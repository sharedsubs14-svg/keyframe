// REVERSE SLATE backend. Someone uploads a still; Claude Haiku reads it and answers with the five SLATE decisions,
// choosing the nearest option from the same lists the board uses. A read draws on the person's daily allowance,
// which is money, not a count: one rupee a day unless set, shared with prompts. See ../lib/budget.js.
// Uses the same keys as generate.js. Nothing is stored: the image is read once and dropped.

const { recordSignup } = require('../lib/signup.js');
global.window = global.window || {};
require('../../js/options.js');
const O = global.window.SLATE_OPTIONS;
const MODEL = process.env.REVERSE_MODEL || process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5';
const { hold, settle } = require('../lib/budget.js');

// The current Haiku thinks before it answers unless asked to keep it light. That thinking counts toward max_tokens
// and can arrive as the first block of the reply. So: ask for low effort, leave room in max_tokens, and read the
// answer by block type, never by position. Haiku 4.5 and older reject the effort setting, so they are not sent it.
const TUNE = /claude-3|haiku-4|sonnet-4-5|sonnet-4-0|opus-4-1|opus-4-0/.test(MODEL) ? {} : { output_config: { effort: 'low' } };
const textOf = (out) => (Array.isArray(out && out.content) ? out.content : []).filter(b => b && b.type === 'text').map(b => b.text).join('').trim();

const list = (arr) => arr.map((o, i) => `${i}: ${o.name} (${o.hint})`).join('\n');
const SYSTEM = `You are a cinematographer reading a single film still. Work out the five SLATE decisions behind it and answer by picking the nearest option from each numbered list. Judge only what is visible.

LIGHT (l):
${list(O.lights)}

WORLD (env):
${list(O.environments)}

ANGLE (a):
${list(O.angles)}

LENS (lens):
${list(O.lenses)}

HOUR (t):
${list(O.times)}

FEELING (em):
${list(O.emotions)}

GENRE (e):
${list(O.genres)}

Reply with JSON only, in exactly this shape:
{"subject":"<who or what is in frame and the one thing they are doing, under 14 words>","l":{"i":0,"sure":true,"why":"<what in the image shows it, under 12 words>"},"env":{"i":0,"sure":true,"why":""},"a":{"i":0,"sure":true,"why":""},"lens":{"i":0,"sure":false,"why":""},"t":{"i":0,"sure":true,"why":""},"em":{"i":0,"sure":true,"why":""},"e":{"i":0,"sure":true,"why":""}}
Rules: "i" is the index of the nearest option. Set "sure" to false whenever you are estimating, which is usual for lens and often for light on wide shots. Each "why" names a visible clue (shadow direction, background compression, horizon height, colour of the sky), never a guess about the production. If the image is sexually explicit, shows graphic gore, or sexualises a minor, reply only {"refuse":true}.`;

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

  const svc = Object.assign({ apikey: SUPABASE_SERVICE_KEY, 'Content-Type': 'application/json' }, /^eyJ/.test(SUPABASE_SERVICE_KEY) ? { Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } : {});
  const rest = `${SUPABASE_URL}/rest/v1`;
  const day = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
  await recordSignup({ rest, svc, user, source: 'slate-reverse' });
  let body; try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'Bad request' }, cors); }
  const img = Buffer.from(String(body.image || ''), 'base64');
  if (!(img.length > 3 && img[0] === 0xFF && img[1] === 0xD8)) return json(400, { error: 'That image did not come through. Try again.' }, cors);
  if (img.length > 1.5e6) return json(413, { error: 'That image is too large.' }, cors);

  // The most this read could cost is put on hold against the person's daily allowance first. If the allowance
  // cannot cover it, or the hold cannot be placed, nothing is read.
  const ctx = { rest, svc, user, day, model: MODEL };
  const h = await hold(Object.assign({ maxIn: 6200, maxOut: 1500 }, ctx));
  if (h.error) return json(503, { error: 'The reader is busy. Try again in a moment.' }, cors);
  if (h.over) return json(429, { error: 'That’s today’s free allowance used. It resets at midnight IST.', left: 0 }, cors);

  let read = null, usage = null;
  try {
    const ai = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ model: MODEL, max_tokens: 1500, system: SYSTEM, messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: img.toString('base64') } }, { type: 'text', text: 'Read this frame.' }] }] }, TUNE))
    });
    if (ai.ok) { const out = await ai.json(); usage = out.usage || null; if (out.stop_reason === 'refusal') read = { refuse: true }; else { const m = textOf(out).match(/\{[\s\S]*\}/); read = m ? JSON.parse(m[0]) : null; } }
  } catch (e) { read = null; }
  // Swap the hold for what the read really cost. A read that never produced an answer is refunded in full.
  const left = await settle(Object.assign({ held: h.held, usage, reads: read && !read.refuse ? 1 : 0 }, ctx));
  if (!read) return json(502, { error: 'The reader is busy. Try again in a moment.' }, cors);
  if (read.refuse) return json(422, { error: 'This frame can’t be read here.' }, cors);

  // Keep only what the board understands.
  const LISTS = { l: O.lights, env: O.environments, a: O.angles, lens: O.lenses, t: O.times, em: O.emotions, e: O.genres };
  const clean = { subject: String(read.subject || '').slice(0, 140) };
  Object.keys(LISTS).forEach(k => { const r = read[k] || {}, i = parseInt(r.i, 10); if (Number.isFinite(i) && LISTS[k][i]) clean[k] = { i, sure: r.sure === true, why: String(r.why || '').slice(0, 110) }; });

  return json(200, { read: clean, left }, cors);
};

function json(statusCode, obj, headers) { return { statusCode, headers: Object.assign({ 'Content-Type': 'application/json' }, headers), body: JSON.stringify(obj) }; }
