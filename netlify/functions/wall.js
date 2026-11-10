// DAILY FRAME wall backend. Runs on Netlify next to generate.js and uses the same keys.
// action "post":   check sign-in → today's brief only → max WALL_DAILY_LIMIT posts per person per day
//                  → Claude Haiku screens the small copy of the image → store both copies → put it on the wall.
// action "report": one report per person per frame; at WALL_REPORTS_TO_HIDE reports it comes off the wall.
// Names are never stored with a frame. The wall only ever shows the image, the model, the slop score and the sheet.
// Optional env vars: WALL_DAILY_LIMIT (default 3), WALL_REPORTS_TO_HIDE (default 3).

const crypto = require('crypto');
const { recordSignup } = require('../lib/signup.js');
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5';

// The current Haiku thinks before it answers unless asked to keep it light. That thinking counts toward max_tokens
// and can arrive as the first block of the reply. So: ask for low effort, leave room in max_tokens, and read the
// answer by block type, never by position. Haiku 4.5 and older reject the effort setting, so they are not sent it.
const TUNE = /claude-3|haiku-4|sonnet-4-5|sonnet-4-0|opus-4-1|opus-4-0/.test(MODEL) ? {} : { output_config: { effort: 'low' } };
const textOf = (out) => (Array.isArray(out && out.content) ? out.content : []).filter(b => b && b.type === 'text').map(b => b.text).join('').trim();
const PER_DAY = parseInt(process.env.WALL_DAILY_LIMIT || '3', 10);
const HIDE_AT = parseInt(process.env.WALL_REPORTS_TO_HIDE || '3', 10);
const MODELS = ['GPT Image 2', 'Nano Banana 2.1', 'Seedream 5 Pro', 'Midjourney', 'Something else'];

const SCREEN = `You screen images before they appear on a public, anonymous wall on a filmmaking education website. People post AI-generated film frames for a daily brief.
Reply with JSON only, no other text: {"allow": true} or {"allow": false, "reason": "<under 12 words, polite>"}.
Block the image if it shows any of: nudity or sexual content; a child or teenager in any sexualised, violent or unsafe situation; graphic gore, injury or self-harm; hate symbols or slurs; a recognisable real public figure such as a politician or celebrity; personal details such as phone numbers, addresses or QR codes; adverts, logos used as spam, or text-heavy promotional images.
Allow ordinary cinematic scenes, including dark or sad moods, night, rain, crowds, children in everyday safe settings, and fictional tension without gore.
If you are unsure, block.`;

exports.handler = async (event) => {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors };
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' }, cors);
  const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, ANTHROPIC_API_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY || !ANTHROPIC_API_KEY) return json(500, { error: 'Server is missing configuration' }, cors);

  const token = (event.headers.authorization || '').replace(/^Bearer /i, '');
  if (!token) return json(401, { error: 'Sign in first' }, cors);
  const who = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` } });
  if (!who.ok) return json(401, { error: 'Sign in again' }, cors);
  const user = await who.json();

  let body; try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'Bad request' }, cors); }
  // Works with both Supabase key styles: new secret keys (sb_secret_...) in the apikey header only; old JWT service_role keys also in Authorization.
  const svcAuth = /^eyJ/.test(SUPABASE_SERVICE_KEY) ? { Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } : {};
  const svc = Object.assign({ apikey: SUPABASE_SERVICE_KEY, 'Content-Type': 'application/json' }, svcAuth);
  const rest = `${SUPABASE_URL}/rest/v1`;
  const day = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
  await recordSignup({ rest, svc, user, source: 'slate-wall' });

  // ---------- report ----------
  if (body.action === 'report') {
    const id = String(body.id || '');
    if (!/^[0-9a-f-]{36}$/i.test(id)) return json(400, { error: 'Bad frame' }, cors);
    await fetch(`${rest}/wall_reports`, { method: 'POST', headers: Object.assign({ Prefer: 'resolution=ignore-duplicates' }, svc), body: JSON.stringify({ entry_id: id, user_id: user.id }) });
    const reps = await (await fetch(`${rest}/wall_reports?entry_id=eq.${id}&select=user_id`, { headers: svc })).json();
    if (Array.isArray(reps) && reps.length >= HIDE_AT) await fetch(`${rest}/entries?id=eq.${id}`, { method: 'PATCH', headers: svc, body: JSON.stringify({ status: 'hidden' }) });
    return json(200, { ok: true }, cors);
  }

  if (body.action !== 'post') return json(400, { error: 'Unknown action' }, cors);

  // ---------- post ----------
  if (body.day !== day) return json(400, { error: 'This brief has closed. Refresh for today’s.' }, cors);
  const mine = await (await fetch(`${rest}/entries?user_id=eq.${user.id}&day=eq.${day}&select=id`, { headers: svc })).json();
  const used = Array.isArray(mine) ? mine.length : 0;
  if (used >= PER_DAY) return json(429, { error: `That's ${PER_DAY} posts for today. A new brief opens at midnight IST.` }, cors);

  const full = Buffer.from(String(body.full || ''), 'base64'), tile = Buffer.from(String(body.tile || ''), 'base64');
  const isJpeg = (b) => b.length > 3 && b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF;
  if (!isJpeg(full) || !isJpeg(tile)) return json(400, { error: 'That image did not come through. Try again.' }, cors);
  if (full.length > 3.5e6 || tile.length > 6e5) return json(413, { error: 'That image is too large.' }, cors);

  // Screen the small copy with Claude. If the check itself fails, nothing is posted.
  let verdict = null;
  try {
    const ai = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ model: MODEL, max_tokens: 1024, system: SCREEN, messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: tile.toString('base64') } }, { type: 'text', text: 'Screen this image.' }] }] }, TUNE))
    });
    if (ai.ok) { const out = await ai.json(); if (out.stop_reason === 'refusal') verdict = { allow: false }; else { const m = textOf(out).match(/\{[\s\S]*\}/); verdict = m ? JSON.parse(m[0]) : null; } }
  } catch (e) { verdict = null; }
  if (!verdict) return json(503, { error: 'The check is busy. Try again in a minute.' }, cors);
  if (verdict.allow !== true) return json(422, { error: `This one can't go on the wall${verdict.reason ? ': ' + String(verdict.reason).slice(0, 80) : '.'}` }, cors);

  const id = crypto.randomUUID(), img_path = `${day}/${id}.jpg`, tile_path = `${day}/${id}_t.jpg`;
  const put = (path, buf) => fetch(`${SUPABASE_URL}/storage/v1/object/wall/${path}`, { method: 'POST', headers: Object.assign({ apikey: SUPABASE_SERVICE_KEY, 'Content-Type': 'image/jpeg', 'cache-control': '31536000', 'x-upsert': 'false' }, svcAuth), body: buf });
  const [a, b] = await Promise.all([put(img_path, full), put(tile_path, tile)]);
  if (!a.ok || !b.ok) return json(502, { error: 'Could not save the image. Try again.' }, cors);

  const int = (v, lo, hi) => { const n = parseInt(v, 10); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : null; };
  let slate = body.slate && typeof body.slate === 'object' ? body.slate : null;
  if (slate && JSON.stringify(slate).length > 4000) slate = null;
  const lines = Array.isArray(body.lines) ? body.lines.slice(0, 5).map(l => [String(l[0] || '').slice(0, 1), String(l[1] || '').slice(0, 160)]) : null;
  const row = { id, day, user_id: user.id, img_path, tile_path, w: int(body.w, 1, 10000), h: int(body.h, 1, 10000), model: MODELS.includes(body.model) ? body.model : 'Something else', slop: slate ? int(body.slop, 0, 100) : null, slate, lines: slate ? lines : null, status: 'live' };
  const ins = await fetch(`${rest}/entries`, { method: 'POST', headers: Object.assign({ Prefer: 'return=representation' }, svc), body: JSON.stringify(row) });
  if (!ins.ok) return json(502, { error: 'Could not post it. Try again.' }, cors);
  const saved = (await ins.json())[0] || row; delete saved.user_id; delete saved.status;
  return json(200, { entry: saved, left: PER_DAY - used - 1 }, cors);
};

function json(statusCode, obj, headers) { return { statusCode, headers: Object.assign({ 'Content-Type': 'application/json' }, headers), body: JSON.stringify(obj) }; }
