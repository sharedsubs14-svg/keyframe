// Stamps the visitor's country into the homepage before it is sent.
//
// The page reads window.KF_COUNTRY and picks a price tier from it (see the
// PRICING block in index.html). Doing it here rather than in the browser means
// the correct price is in the HTML from the first paint, so nobody ever sees
// one price flash and change to another.
//
// Netlify works the country out from the connection. No third-party lookup, no
// extra request, nothing to configure.

export default async (request, context) => {
  const res = await context.next();

  // Only rewrite HTML. Images, scripts and stylesheets pass through untouched.
  const type = res.headers.get('content-type') || '';
  if (!type.includes('text/html')) return res;

  let cc = '';
  try {
    cc = (context.geo && context.geo.country && context.geo.country.code) || '';
  } catch (e) {
    // Unknown country falls through as an empty string. The page then uses its
    // own fallback and lands on the international tier, which is the safe default.
  }

  const html = await res.text();
  const tag = '<script>window.KF_COUNTRY=' + JSON.stringify(String(cc)) + ';</script>';
  const out = html.includes('</head>')
    ? html.replace('</head>', tag + '</head>')
    : tag + html;

  const headers = new Headers(res.headers);
  // The body now differs by country, so the length changed and no shared cache
  // may hold on to one country's copy.
  headers.delete('content-length');
  headers.set('cache-control', 'private, no-cache');

  return new Response(out, { status: res.status, statusText: res.statusText, headers: headers });
};
