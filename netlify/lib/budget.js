// One money cap per signed-in person per day, in rupees, across everything that calls Claude:
// prompt reveals, Reverse SLATE reads and the wall's image check. There are no per-feature counts.
//
// How it holds:
//   1. Before a call, the most that call could cost is put on hold against the person's day (slate_hold).
//      That is one atomic step in the database, so two requests at the same moment cannot both slip under the cap.
//   2. After the call, the hold is replaced with what the call really cost, worked out from the token counts
//      Claude reports back (slate_settle). A call that failed is refunded.
//   3. If the hold cannot be placed for any reason, the call is not made. The cap never fails open.
//
// Settings, all optional (Netlify environment variables):
//   DAILY_BUDGET_INR    rupees per person per day. Default 1.
//   USD_INR             rupees to the dollar used in the sum. Default 90.
//   PRICE_IN_PER_MTOK, PRICE_OUT_PER_MTOK   dollars per million tokens, for a model missing from the table below.

// Dollars per million tokens: [input, output].
const PRICES = {
  'claude-haiku-5-5': [0.10, 0.50],
  'claude-haiku-4-5': [1, 5],
  'claude-sonnet-5-5': [2, 10],
  'claude-sonnet-5': [2, 10],
  'claude-sonnet-4-6': [3, 15],
  'claude-opus-5-5': [4, 20],
  'claude-opus-5': [5, 25]
};
const num = (v, d) => { const n = parseFloat(v); return Number.isFinite(n) && n > 0 ? n : d; };
const CAP = num(process.env.DAILY_BUDGET_INR, 1);
const FX = num(process.env.USD_INR, 90);
const r4 = (n) => Math.round(n * 1e4) / 1e4;

function price(model) {
  const pin = num(process.env.PRICE_IN_PER_MTOK, 0), pout = num(process.env.PRICE_OUT_PER_MTOK, 0);
  if (pin && pout) return [pin, pout];
  return PRICES[model] || [5, 25];   // an unknown model is treated as an expensive one, so the cap errs on the safe side
}
// Rupees for a number of input and output tokens on a model.
function inr(model, tin, tout) { const p = price(model); return ((tin * p[0] + tout * p[1]) / 1e6) * FX; }
const leftPct = (spent) => Math.max(0, Math.min(100, Math.round((1 - spent / CAP) * 100)));

// Put the worst-case cost of one call on hold. Returns { held } to go ahead, { over: true } when the day's
// allowance cannot cover it, or { error: true } when the database could not be asked.
async function hold({ rest, svc, user, day, model, maxIn, maxOut }) {
  try {
    const amount = r4(inr(model, maxIn, maxOut));
    const r = await fetch(`${rest}/rpc/slate_hold`, { method: 'POST', headers: svc, body: JSON.stringify({ p_user: user.id, p_email: user.email || '', p_day: day, p_amount: amount, p_cap: CAP }) });
    if (!r.ok) return { error: true };
    const v = await r.json();
    if (v === null || v === undefined) return { over: true };
    return { held: amount };
  } catch (e) { return { error: true }; }
}

// Swap the hold for the real cost. `usage` is Claude's own token count for the call; without one the hold is refunded.
// Returns the percentage of the day's allowance still left, or null if that could not be read.
async function settle({ rest, svc, user, day, model, held, usage, prompts, reads }) {
  try {
    // Cached instructions are billed differently: writing them to the cache costs 1.25x the input price, reading them 0.1x.
    const tin = usage ? (usage.input_tokens || 0) + 1.25 * (usage.cache_creation_input_tokens || 0) + 0.1 * (usage.cache_read_input_tokens || 0) : 0;
    const actual = usage ? inr(model, tin, usage.output_tokens || 0) : 0;
    const r = await fetch(`${rest}/rpc/slate_settle`, { method: 'POST', headers: svc, body: JSON.stringify({ p_user: user.id, p_day: day, p_delta: r4(actual - held), p_prompts: prompts || 0, p_reads: reads || 0 }) });
    if (!r.ok) return null;
    const v = await r.json();
    return v === null || v === undefined ? null : leftPct(Number(v));
  } catch (e) { return null; }
}

module.exports = { hold, settle, inr, CAP };
