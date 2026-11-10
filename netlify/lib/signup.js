// Records a first-time sign-in, once: a row in the Supabase `users` table and a row in the Google Sheet.
// Every gated action calls this (reveal, Reverse SLATE, posting to the wall, and the plain "just signed in" ping),
// so a person is captured whichever one they do first. It never blocks or fails the action it is called from.
exports.recordSignup = async ({ rest, svc, user, source }) => {
  try {
    const email = user.email || '';
    const name = (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || '';
    const existing = await (await fetch(`${rest}/users?id=eq.${user.id}&select=id`, { headers: svc })).json();
    if (!Array.isArray(existing) || existing.length) return false;
    await fetch(`${rest}/users`, { method: 'POST', headers: Object.assign({}, svc, { Prefer: 'resolution=ignore-duplicates' }), body: JSON.stringify({ id: user.id, email, name }) });
    const sheet = process.env.SHEET_WEBHOOK_URL;
    if (sheet) { try { await fetch(sheet, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, name, signed_up: new Date().toISOString(), source: source || 'slate' }) }); } catch (e) {} }
    return true;
  } catch (e) { return false; }
};
