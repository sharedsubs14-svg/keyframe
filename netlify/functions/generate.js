// SLATE backend. Runs on Netlify, keeps every key hidden.
// Flow: check the user's sign-in → hold this call's cost against the person's daily allowance → write the prompt with Claude → return it.
// The allowance is money, not a count: one rupee per person per day unless set, shared with Reverse SLATE and the wall check. See ../lib/budget.js.
// Env vars (set in Netlify → Site configuration → Environment variables):
//   ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, SHEET_WEBHOOK_URL (optional), DAILY_BUDGET_INR (optional, default 1), USD_INR (optional, default 90)

const { recordSignup } = require('../lib/signup.js');
const { hold, settle } = require('../lib/budget.js');
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5';

// The current Haiku thinks before it answers unless asked to keep it light. That thinking counts toward max_tokens
// and can arrive as the first block of the reply. So: ask for low effort, leave room in max_tokens, and read the
// answer by block type, never by position. Haiku 4.5 and older reject the effort setting, so they are not sent it.
const TUNE = /claude-3|haiku-4|sonnet-4-5|sonnet-4-0|opus-4-1|opus-4-0/.test(MODEL) ? {} : { output_config: { effort: 'low' } };
const textOf = (out) => (Array.isArray(out && out.content) ? out.content : []).filter(b => b && b.type === 'text').map(b => b.text).join('').trim();

// What Claude is told to do lives in its own file, so it can be edited without touching this code.
const { PROMPT_WRITER, TARGETS } = require('../lib/prompt-writer.js');

exports.handler = async (event) => {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors };
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' }, cors);

  const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, ANTHROPIC_API_KEY, SHEET_WEBHOOK_URL } = process.env;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY || !ANTHROPIC_API_KEY) return json(500, { error: 'Server is missing configuration' }, cors);

  // 1. Who is asking?
  const token = (event.headers.authorization || '').replace(/^Bearer /i, '');
  if (!token) return json(401, { error: 'Sign in first' }, cors);
  const who = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` } });
  if (!who.ok) return json(401, { error: 'Sign in again' }, cors);
  const user = await who.json();
  const email = user.email || '';
  const name = (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || '';

  // Works with both Supabase key styles: the new secret key (sb_secret_...) goes in the apikey header only; an old JWT service_role key also goes in Authorization.
  const svc = Object.assign({ apikey: SUPABASE_SERVICE_KEY, 'Content-Type': 'application/json', Prefer: 'return=representation' }, /^eyJ/.test(SUPABASE_SERVICE_KEY) ? { Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } : {});
  const rest = `${SUPABASE_URL}/rest/v1`;

  // 2. First time? Record them and tell the Google Sheet.
  await recordSignup({ rest, svc, user, source: 'slate' });
  let body; try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'Bad request' }, cors); }
  // A plain "I just signed in" ping from the page: the sign-up is recorded above, nothing is written, nothing is counted.
  if (body.hello) return json(200, { ok: true }, cors);

  // 3. Today's allowance (IST day so the reset feels right for India). The most this call could cost is put on
  //    hold first; if the day's allowance cannot cover it, or the hold cannot be placed, nothing is written.
  const day = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
  const ctx = { rest, svc, user, day, model: MODEL };
  const h = await hold(Object.assign({ maxIn: 4000, maxOut: 1500 }, ctx));
  if (h.error) return json(503, { error: 'The writer is busy. Try again in a moment.' }, cors);
  if (h.over) return json(429, { error: 'That’s today’s free allowance used. It resets at midnight IST.', left: 0 }, cors);

  // 4. Write the prompt.
  const model = TARGETS[body.model] ? body.model : 'universal';
  // Every field is cut to a sane length, so one request can never be made to cost more than the hold above.
  const raw = body.decisions && typeof body.decisions === 'object' ? body.decisions : {};
  const clip = (v, n) => String(v == null ? '' : v).slice(0, n).trim();
  const d = { subject: clip(raw.subject, 400), lighting: clip(raw.lighting, 400), camera: clip(raw.camera, 400), time: clip(raw.time, 400), mood: clip(raw.mood, 400), advanced: clip(raw.advanced, 600),
    unspecified: Array.isArray(raw.unspecified) ? raw.unspecified.slice(0, 6).map(x => clip(x, 40)).filter(Boolean) : [] };
  const open = 'left to the model';
  const lines = [
    `Subject: ${d.subject || open}`,
    `Light: ${d.lighting || open}`,
    `Angle: ${d.camera || open}`,
    `Time: ${d.time || open}`,
    `Emotion: ${d.mood || open}`,
    d.advanced ? `Advanced notes: ${d.advanced}` : null,
    d.unspecified.length ? `Left to the model (keep these open): ${d.unspecified.join(', ')}` : null
  ].filter(Boolean).join('\n');

  let ai;
  try {
    ai = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      // The instructions never change between calls, so they are cached: after the first call of every few minutes,
      // Claude reads them at a tenth of the price. The sheet and the target model come after the cached part.
      body: JSON.stringify(Object.assign({ model: MODEL, max_tokens: 1500,
        system: [{ type: 'text', text: PROMPT_WRITER, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: `<sheet>\n${lines}\n</sheet>\n\nTarget model: ${TARGETS[model]}\n\nWrite the prompt.` }] }, TUNE))
    });
  } catch (e) { ai = null; }
  // A call that never produced an answer is refunded in full.
  if (!ai || !ai.ok) { const t = ai ? await ai.text() : ''; await settle(Object.assign({ held: h.held, usage: null }, ctx)); return json(502, { error: 'The writer is busy. Try again in a moment.', detail: t.slice(0, 200) }, cors); }
  const out = await ai.json();
  const prompt = out.stop_reason === 'refusal' ? '' : textOf(out);

  // 5. Swap the hold for what the call really cost, from Claude's own token count, and count the prompt if one came back.
  const left = await settle(Object.assign({ held: h.held, usage: out.usage || null, prompts: prompt ? 1 : 0 }, ctx));
  if (out.stop_reason === 'refusal') return json(422, { error: 'That one can’t be written here. Change the subject and try again.' }, cors);
  if (!prompt) return json(502, { error: 'Empty prompt returned' }, cors);

  return json(200, { prompt, left, model }, cors);
};

function json(status, obj, headers) { return { statusCode: status, headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(obj) }; }
