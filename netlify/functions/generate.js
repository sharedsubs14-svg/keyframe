// SLATE backend. Runs on Netlify, keeps every key hidden.
// Flow: check the user's sign-in → count today's prompts (max DAILY_LIMIT, 10 unless set) → write the prompt with Claude → return it.
// Reverse SLATE reads are counted separately, in reverse.js.
// Env vars (set in Netlify → Site configuration → Environment variables):
//   ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, SHEET_WEBHOOK_URL (optional), DAILY_LIMIT (optional)

const { recordSignup } = require('../lib/signup.js');
const DAILY_LIMIT = parseInt(process.env.DAILY_LIMIT || '10', 10);
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5';

// The current Haiku thinks before it answers unless asked to keep it light. That thinking counts toward max_tokens
// and can arrive as the first block of the reply. So: ask for low effort, leave room in max_tokens, and read the
// answer by block type, never by position. Haiku 4.5 and older reject the effort setting, so they are not sent it.
const TUNE = /claude-3|haiku-4|sonnet-4-5|sonnet-4-0|opus-4-1|opus-4-0/.test(MODEL) ? {} : { output_config: { effort: 'low' } };
const textOf = (out) => (Array.isArray(out && out.content) ? out.content : []).filter(b => b && b.type === 'text').map(b => b.text).join('').trim();

const GUIDES = {
  gpt: `Target: OpenAI GPT Image. Write one or two natural-language paragraphs, like a brief to a photographer. Full sentences, concrete nouns. State the subject first, then setting, light, camera and lens, time of day, mood and colour. Say what should NOT appear in plain words ("no text, no watermark") rather than special syntax. Do not use parameter flags or keyword lists.`,
  banana: `Target: Google Nano Banana (Gemini image model). Describe the scene as a narrative paragraph, not a list of keywords: who, doing what, where, lit how. Use real photography language (lens focal length, aperture, lighting pattern, time of day). Mention the intended aspect ratio in words if relevant. Keep it to one dense paragraph.`,
  seedream: `Target: ByteDance Seedream. Structured and explicit: subject and action; environment; lighting pattern and direction; camera angle, lens and shot size; time of day and colour temperature; emotion, genre and palette; materials and textures. Long prompts are fine. Write as clear declarative sentences grouped in that order. No parameter flags.`,
  mj: `Target: Midjourney. Front-load the most important elements. Concise comma-separated phrases, not full sentences. Put the subject and action first, then setting, lighting, lens, time, mood and palette. End with parameters: --ar (choose 16:9 for landscape, 2:1 for anamorphic, 4:5 for portrait when the shot calls for it) and --style raw. Use --no for exclusions instead of writing "no" in the prose.`,
  universal: `Target: any image model. One solid descriptive paragraph in plain language that works everywhere: subject and action, setting, light, camera and lens, time of day, mood and palette, then "no text, no watermark". No flags, no keyword spam.`
};

const SYSTEM = `You are a cinematographer turning a director's decisions into an image-generation prompt.
Rules:
- Use ONLY what the director specified. Where something is marked unspecified, do not invent it; leave it out so the model decides. Never add "8k", "masterpiece", "trending", "ultra realistic" or similar filler.
- Keep the vocabulary cinematic and precise (lighting patterns, lens focal lengths, angles, time of day). Translate the decisions into how the frame would actually look.
- If the director wrote something in their own words (any language), keep its meaning and render it in natural English inside the prompt.
- Output only the prompt text. No preamble, no title, no explanation, no quotes.`;

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

  // 3. Today's count (IST day so the reset feels right for India).
  const day = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
  // If the count cannot be read, nothing is written: the cap must never fail open.
  const q = await fetch(`${rest}/reveals?user_id=eq.${user.id}&day=eq.${day}&select=count`, { headers: svc });
  if (!q.ok) return json(503, { error: 'The writer is busy. Try again in a moment.' }, cors);
  const rows = await q.json(), row = Array.isArray(rows) && rows[0] ? rows[0] : null;
  const used = row ? (row.count || 0) : 0;
  if (used >= DAILY_LIMIT) return json(429, { error: `That's ${DAILY_LIMIT} reveals for today. The sheet resets at midnight IST.`, remaining: 0 }, cors);

  // 4. Write the prompt.
  const model = GUIDES[body.model] ? body.model : 'universal';
  const d = body.decisions || {};
  const lines = [
    `SUBJECT + ACTION: ${d.subject || 'unspecified'}`,
    `LIGHTING + ENVIRONMENT: ${d.lighting || 'unspecified'}`,
    `ANGLE + LENSING: ${d.camera || 'unspecified'}`,
    `TIME OF DAY: ${d.time || 'unspecified'}`,
    `EMOTION + GENRE: ${d.mood || 'unspecified'}`,
    d.advanced ? `ANNOTATIONS: ${d.advanced}` : null,
    Array.isArray(d.unspecified) && d.unspecified.length ? `LEFT TO THE MODEL (do not invent): ${d.unspecified.join(', ')}` : null
  ].filter(Boolean).join('\n');

  const ai = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.assign({ model: MODEL, max_tokens: 1500, system: SYSTEM + '\n\n' + GUIDES[model], messages: [{ role: 'user', content: `Director's decisions:\n${lines}\n\nWrite the prompt.` }] }, TUNE))
  });
  if (!ai.ok) { const t = await ai.text(); return json(502, { error: 'The writer is busy. Try again in a moment.', detail: t.slice(0, 200) }, cors); }
  const out = await ai.json();
  if (out.stop_reason === 'refusal') return json(422, { error: 'That one can’t be written here. Change the subject and try again.' }, cors);
  const prompt = textOf(out);
  if (!prompt) return json(502, { error: 'Empty prompt returned' }, cors);

  // 5. Count it.
  // The day's row may already exist with no prompts on it, made by a Reverse SLATE read, so go by the row, not the count.
  if (!row) await fetch(`${rest}/reveals`, { method: 'POST', headers: svc, body: JSON.stringify({ user_id: user.id, email, day, count: 1 }) });
  else await fetch(`${rest}/reveals?user_id=eq.${user.id}&day=eq.${day}`, { method: 'PATCH', headers: svc, body: JSON.stringify({ count: used + 1 }) });

  return json(200, { prompt, remaining: DAILY_LIMIT - used - 1, model }, cors);
};

function json(status, obj, headers) { return { statusCode: status, headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(obj) }; }
