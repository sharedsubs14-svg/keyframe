# Keyframe · The Sunday Shoot

Static site, no build step. Netlify publishes the repo root as-is.

| URL | File |
|---|---|
| `/` | `index.html` (The Sunday Shoot v7, from Claude Design) |
| `/about` | `About Us.dc.html` |
| `/privacy` | `Privacy Policy.dc.html` |
| `/refund` | `Refund Policy.dc.html` |
| `/terms` | `Terms and Conditions.dc.html` |
| `/pricing` | `pricing.html` |
| `/delivery` | `delivery.html` |
| `/contact` | `contact.html` |

The clean URLs come from `_redirects`. Keep the policy pages: Razorpay and Paddle check for them.

Supporting files, keep the structure intact:

- `support.js` runs every `.dc.html` page. It loads React from unpkg.com when the page opens.
- `image-slot.js` and `_ds/` (Keyframe design system) are loaded by the pages.
- `assets/` holds the logos, the gallery frames (`gallery/`) and the before/after pairs (`pairs/`).

The Razorpay button id and both YouTube links live in the script at the bottom of `index.html`.
