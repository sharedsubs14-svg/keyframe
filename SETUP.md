# SLATE on keyframe24.ai · finishing the setup

The website files are already in this GitHub repo and already connected to Netlify. What is left needs your own logins, so only you can do it: the accounts and the keys. Budget about an hour. Do the parts in order.

Until this is done the site is live but locked: people can use the drafting table and browse the wall, and every gated action (revealing a prompt, Reverse SLATE, posting a frame) answers "sign-in opens shortly". Nothing is handed out without a sign-up.

| Piece | What it does | Cost |
|---|---|---|
| GitHub | Stores the website files. Already set up | Free |
| Netlify | Puts the site on the internet and runs the hidden backend that keeps your Claude key secret. Already set up | Free |
| Supabase | Google sign-in, the daily allowance of ₹1 per person, and the Daily Frame wall and its images | Free to start |
| Google Cloud | Lets Supabase show "Continue with Google" | Free |
| Anthropic | The Claude key that writes prompts and checks uploaded images | Pay as you go, about ₹0.02 a reveal |
| Google Sheet | Where every new sign-up's email lands | Free |

Copy this block into a notes file and fill it in as you go:

```
SUPABASE_URL          =
SUPABASE_ANON_KEY     =      (Supabase calls it "Publishable key", or "anon public" on older screens)
SUPABASE_SERVICE_KEY  =      (Supabase calls it "Secret key", or "service_role" on older screens) SECRET
ANTHROPIC_API_KEY     =      SECRET
SHEET_WEBHOOK_URL     =
```

The two lines marked SECRET never go inside the website files and never get pasted into a chat. They only go into Netlify's settings page (Part 7).

---

## Part 1 · Make the accounts (5 min)

1. **Supabase**: go to supabase.com, click **Start your project**, and sign in with GitHub.
2. **Anthropic**: go to console.anthropic.com and sign in.

## Part 2 · Create the Supabase project (15 min)

1. In Supabase click **New project**.
   - Name: `slate`
   - Database password: click **Generate a password**, then copy it into your notes. You will not need it again, but keep it.
   - Region: **Mumbai** (or the closest one to India in the list).
   - Click **Create new project** and wait about two minutes.
2. Left sidebar: the gear icon, **Project Settings**. Then **API Keys** (on older screens it is called **API**).
   - Copy the **Project URL** into `SUPABASE_URL`. It looks like `https://abcdxyz.supabase.co`.
   - Copy the **Publishable key** into `SUPABASE_ANON_KEY`. (If you only see "legacy" keys, the **anon public** key is the same thing.)
   - Copy the **Secret key** into `SUPABASE_SERVICE_KEY`. (Legacy screen: **service_role**, click Reveal.) This one is secret.
3. Left sidebar: **SQL Editor**, then **New query**.
   - On github.com open this repo, click the file `supabase.sql`, then click the **copy** icon at the top right of the file (two overlapping squares).
   - Paste into the Supabase box and click **Run**.
   - You should see "Success. No rows returned". A yellow warning about a "security definer view" called wall_public is expected: that view is the only part of the wall the public can read, and it hides who posted what. Confirm and run.
4. Check it worked:
   - **Table Editor** shows `users`, `reveals`, `entries` and `wall_reports`.
   - **Storage** shows a bucket called `wall`.

## Part 3 · Turn on Google sign-in (20 min)

This is the fiddliest part. Go slowly and copy addresses exactly.

**3a · In Supabase**
1. Left sidebar: **Authentication**, then **Sign In / Providers** (older screens: **Providers**). Click **Google**.
2. Turn on **Enable Sign in with Google**. Leave this tab open.
3. Copy the **Callback URL** shown there into your notes. It looks like `https://abcdxyz.supabase.co/auth/v1/callback`.

**3b · In Google Cloud** (open a new tab)
1. Go to console.cloud.google.com and sign in with the Google account you want to own this.
2. Top bar: click the project dropdown, then **New project**. Name it `slate`, click **Create**, then make sure `slate` is selected in that dropdown.
3. Left menu: **APIs & Services**, then **OAuth consent screen** (newer screens call it **Google Auth Platform**, then **Branding**).
   - User type: **External**.
   - App name: `SLATE by Keyframe`. Support email and developer email: your email.
   - Skip logo and scopes. Save through every screen.
   - Find **Publish app** (under **Audience** on newer screens) and confirm, so anyone can sign in, not just test users.
4. Left menu: **Credentials** (newer screens: **Clients**), then **Create credentials**, then **OAuth client ID**.
   - Application type: **Web application**. Name: `slate web`.
   - **Authorized JavaScript origins**: add `https://keyframe24.ai` and, on a second line, `https://www.keyframe24.ai`. No slash at the end of either.
   - **Authorized redirect URIs**: paste the Supabase Callback URL from 3a.
   - Click **Create**. Copy the **Client ID** and **Client secret** that appear.

**3c · Back in the Supabase tab**
1. Paste the **Client ID** and **Client secret** into the Google provider page. Click **Save**.

## Part 4 · Get the Claude key (5 min)

1. console.anthropic.com: **API Keys**, then **Create Key**. Name it `slate`. Copy it into `ANTHROPIC_API_KEY` right away. It is shown only once.
2. **Billing**: add a small amount of credit. ₹1,000 worth lasts a long time at about ₹0.02 a reveal.
3. **Limits**: set a monthly spend limit (start around ₹2,000) so nothing can ever run away.

## Part 5 · The Google Sheet for sign-ups (10 min)

1. Create a new Google Sheet called `SLATE sign-ups`.
2. Menu: **Extensions**, then **Apps Script**. Delete everything in the editor.
3. On github.com open this repo, click the file `sheet-webhook.gs`, click the **copy** icon, and paste it into the Apps Script editor. Click the save icon.
4. Top right: **Deploy**, then **New deployment**. Click the gear next to "Select type", choose **Web app**.
   - Description: `slate`. Execute as: **Me**. Who has access: **Anyone**. Click **Deploy**.
   - Google asks you to authorise. If it warns you, click **Advanced**, then **Go to project**. It is your own script.
5. Copy the **Web app URL** into `SHEET_WEBHOOK_URL`.

## Part 6 · Give Claude the two public values (2 min)

In the Claude Code chat, send these two lines from your notes:

```
SUPABASE_URL = ...
SUPABASE_ANON_KEY = ...
```

These two are public and are meant to be in the website file. Claude puts them into `index.html` and publishes. Do not send the two SECRET values.

Daily Frame No. 001 is set to 11 November 2026, in `js/briefs.js`.

## Part 7 · Add the secret keys in Netlify (5 min)

1. app.netlify.com, open the keyframe24.ai site, then **Site configuration**, then **Environment variables**.
2. Click **Add a variable**, then **Add a single variable**. Do this once for each line:

   | Key | Value |
   |---|---|
   | `ANTHROPIC_API_KEY` | your Claude key |
   | `SUPABASE_URL` | your Supabase Project URL |
   | `SUPABASE_ANON_KEY` | your publishable key |
   | `SUPABASE_SERVICE_KEY` | your secret key |
   | `SHEET_WEBHOOK_URL` | your Apps Script web app URL |

   Optional: `DAILY_BUDGET_INR` (rupees of Claude use per person per day, default 1), `USD_INR` (the rupee rate used for that sum, default 90), `WALL_DAILY_LIMIT` (posts per person per day, default 3) and `WALL_REPORTS_TO_HIDE` (reports that take a frame down, default 3).

The keys are picked up by the next deploy. That happens by itself when Claude publishes your two values from Part 6. If you add or change a key later, go to **Deploys**, then **Trigger deploy**, then **Deploy site**.

## Part 8 · Tell Supabase the address (2 min)

1. **Supabase**: **Authentication**, then **URL Configuration**.
   - **Site URL**: `https://keyframe24.ai`
   - **Redirect URLs**: add `https://keyframe24.ai/**` and `https://www.keyframe24.ai/**`. Save.

## Part 9 · Test the live site (15 min)

Once Claude has published your two values, open `https://keyframe24.ai` in a private or incognito window and check each item:

- [ ] The page loads in light mode. The theme switch works.
- [ ] Pick a subject. The drawing changes. Drag the lamp, the camera and the sun.
- [ ] The Slop Score drops as you make your own choices.
- [ ] Click **Reveal the prompt**, sign in with Google, and a real prompt appears. Switch the model tab and reveal again.
- [ ] A new row appears in the `SLATE sign-ups` sheet within a few seconds. The same person also shows in Supabase under **Authentication**, **Users**, and in **Table Editor**, `users`.
- [ ] The Daily Frame shows today's brief and the countdown. Click **Post your frame**, upload any image you made, post it. It appears on the wall. (A refusal message means the image check said no. That is the check working.)
- [ ] Open the frame on the wall and click **Open this sheet on the board**.
- [ ] In **Reverse SLATE**, drop in any film still. Five rows fill in, and **Open this sheet on the board** loads them. A small note shows how much of the day's allowance is left.
- [ ] On your phone: the same checks, quickly.

If sign-in bounces back with an error, it is almost always one address with a typo: the redirect URL in Part 8, or the JavaScript origin in Part 3b. Compare them character by character, including `https://` and no slash at the end of the origin.

---

## Changing things later

Open Claude Code on this repo and say what you want. Claude pushes the change and gives you a link to merge. Netlify updates the live site about a minute after the merge. Examples:

- "Change the brief for 12 November in js/briefs.js to: A tea stall in heavy fog."
- "Raise the daily allowance to ₹2 a person." (This one is a Netlify setting: Part 7, add `DAILY_BUDGET_INR` with the value `2`, then **Deploys**, **Trigger deploy**, **Deploy site**.)
- "Add a new option 'Ring light' to the lights list in js/options.js."

Where things live, if you ever want to look yourself:

- Dropdown options and wording: `js/options.js`
- Daily briefs and the start date: `js/briefs.js`
- How prompts are written per model: `netlify/functions/generate.js`, the `GUIDES` block
- The image check for the wall: `netlify/functions/wall.js`, the `SCREEN` block
- How Reverse SLATE reads a frame: `netlify/functions/reverse.js`, the `SYSTEM` block
- Keyframe's own frames for the wall: the `seed` folder (its README explains the format). The prompts behind them are in `tools/wall/frames.json`
- The opening scene: `js/opening.js` moves it. Its photographs, words and labels are in `js/opening-frames.js`, and the pictures themselves sit in the `img/open` folder. The site opens on the boxer frame. To open on the railway platform frame instead, change `use: 'boxer'` to `use: 'platform'` in that file
- Colours and fonts: the top of `css/style.css`
- The policy pages, contact, delivery, pricing and the thank-you page: the files at the top of the repo with those names. SLATE's footer links to Terms, Privacy and Contact
- The Sunday Shoot site: the `backup-sunday-shoot` folder. See README.md

## Where the sign-ups live

Every person who signs in with Google is recorded in three places, the first time they sign in:

- **Your Google Sheet** `SLATE sign-ups`: one row with the time, email, name and what they did first (`slate` for a reveal or a plain sign-in, `slate-reverse`, `slate-wall`). This is the list to work from.
- **Supabase, Table Editor, `users`**: the same people, as a table.
- **Supabase, Authentication, Users**: Google's own record of every account, with last sign-in time. It can be exported.

Nobody gets a prompt, a Reverse SLATE read or a wall post without signing in. The check runs on the server, so it cannot be skipped from the browser.

## The daily allowance

Each signed-in person can use ₹1 of Claude a day. There is no separate limit on prompts or on Reverse SLATE reads: a person spends the rupee however they like, and it renews at midnight India time.

- At normal sizes ₹1 is about 39 prompt reveals, or about 24 Reverse SLATE reads, or any mix of the two. The image check on a wall post draws on it too, at about ₹0.01 a post.
- The cost of each call is worked out from the token counts Claude reports back, at the model's price, at ₹90 to the dollar.
- Before each call the site sets aside the most that call could cost, and hands back the difference afterwards. That is why the cap holds even if someone fires many requests at once, and why a person is stopped a little before the full rupee is gone.
- When it runs out the person sees: "That's today's free allowance used. It resets at midnight IST."
- To see who used what: Supabase, **Table Editor**, `reveals`. One row per person per day, with `spend` in rupees, `count` (prompts) and `reads`.
- To change it: add `DAILY_BUDGET_INR` in Netlify (Part 7) with the new number of rupees, then redeploy. The ₹1 default assumes the Haiku 5.5 model the site ships with.

## Looking after the Daily Frame wall

- **Remove a frame by hand**: Supabase, **Table Editor**, `entries`. Find the row, double-click its `status` cell, type `hidden`, press Enter. It disappears on the next refresh.
- **Storage**: each post is about 400 KB in total. The free plan holds 1 GB, roughly 2,500 posts, and about 10 GB of viewing a month. When you get close, Supabase Pro is $25 a month (about ₹2,400).
- **Free projects pause** after about a week with no visitors. Once the site has daily traffic this won't happen. If it ever does, open the project in Supabase and click **Restore**.
- **House frames** exist for briefs 1 to 20. From brief 21 on, the wall shows only what people post, until more house frames are added to the `seed` folder.

## What it costs to run

- GitHub, Netlify, Supabase, Google: free at launch scale.
- Claude: about ₹0.02 per prompt reveal, about ₹0.04 per Reverse SLATE read and under ₹0.01 per wall upload. No person can cost more than ₹1 a day, about ₹30 a month, however they use the site. See "The daily allowance" below.
