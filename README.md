# keyframe24.ai

Static site, no build step. Netlify publishes this repo as it is and runs the functions in `netlify/functions`.

## What is live

| Address | What it is | Files |
|---|---|---|
| `/` | SLATE by Keyframe | `index.html`, `css/`, `js/`, `img/`, `seed/`, `netlify/functions/` |
| `/terms` `/privacy` `/refund` `/about` | Policy pages | the four `.dc.html` files, with `support.js`, `_ds/`, `assets/vendor/`, `keyframe-logo.png` |
| `/contact` `/delivery` `/pricing` | Info pages | `contact.html`, `delivery.html`, `pricing.html` |
| `/thank-you` | Where Razorpay sends a buyer after paying for The Sunday Shoot | `thank-you.html` |

The clean addresses come from `_redirects`. SLATE's footer links to Terms, Privacy and Contact, and Razorpay checks for the policy pages, so keep them.

Setup steps for SLATE (accounts, keys, going live) are in `SETUP.md`.

## The Sunday Shoot backup

`backup-sunday-shoot/` holds the complete Sunday Shoot workshop site exactly as it stood on the day SLATE replaced it: the homepage with country pricing, the Razorpay payment buttons, the Meta Pixel, the mobile layer, the gallery, the policy pages, its own `netlify.toml`, `_redirects` and the country edge function. Nothing in it was edited.

It is not served. `_redirects` answers every address under `/backup-sunday-shoot/` with a 404.

To put it live somewhere else: create a new site in Netlify from this same repo, and in its build settings set **Base directory** to `backup-sunday-shoot`. The folder carries its own Netlify settings, so nothing else is needed. Then point the new address at that site.

One thing was left half done there: US and UAE visitors need Razorpay Payment Page links, because Razorpay payment buttons only take Indian cards. The two empty `link: ''` lines in the `PRICING` block of `backup-sunday-shoot/index.html` are where those links go.

## Working files

`tools/wall/` holds the prompts and sheets for the house frames on the Daily Frame wall and the script that builds `seed/` from generated images. It is not served either.
