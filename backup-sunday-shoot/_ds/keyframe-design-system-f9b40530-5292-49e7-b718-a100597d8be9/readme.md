# Keyframe Design System

> think like a director · craft before tools

This is the design system for **Keyframe**, a teaching brand for filmmakers and
directors working in the age of generative tools. Keyframe sells the craft, not
the software: the through-line is that anyone can now make one beautiful image,
but telling a story across frames is still the profession.

Dark, cinematic, premium, restrained. True black backgrounds, a deep purple
accent system, and warm cream type. It should read like a film editorial, never
like an AI-course template.

## Source material

- `uploads/keyframe-brand-guidelines.pdf` — Keyframe Brand Guidelines v2.0, June 2026.
  The single source of truth for this system. Six sections: Logo, Colour,
  Typography, Voice & Tone, Usage Rules. Text-only PDF (no embedded imagery) —
  the wordmark is purely typographic and is reconstructed here from its recipe.

No codebase, Figma file, or slide deck was provided. The token values, type
system, and voice rules below are transcribed directly from the guidelines.

## The two brands (do not conflate)

- **Keyframe** — the teaching brand. Everything in this system is Keyframe.
- **Node Prime** — the production firm. A separate entity. Never mix the two in
  copy, marks, or layouts.
- **Vishwas** is the human face and credibility of Keyframe, but brand equity
  accrues to Keyframe the institution, not to a personal handle.

---

## CONTENT FUNDAMENTALS

How Keyframe writes. The voice is the brand's sharpest asset — treat these as
hard rules, not suggestions.

**Posture.** Expert but not academic. Direct, with no hedging. Honest before
motivational, warning before hype. Warm but never sycophantic. Culturally
grounded. Write like a working cinematographer explaining why a shot works, not
like a marketer or a textbook.

**Person.** Speaks plainly. Addresses the reader as a fellow practitioner ("you"),
positions Keyframe as the institution that has seen the work done right. Not
chummy, not corporate.

**Mechanics.**
- Fragments are fine. Contractions are fine. Dry humour is fine.
- Sentences should vary in length and rhythm. Never a uniform cadence.
- Left-aligned copy. Body text is never centred.
- Lowercase wide-tracked labels for eyebrows and metadata.
- No emoji. No unicode decoration. The restraint is the point.

**The three canonical lines** (house voice, memorise the register):
- "The resistance to execution has collapsed, but the bar for ideas has gone up."
- "One beautiful disconnected image anyone can make. A story told across frames is the profession."
- "These are things nobody will appreciate you for doing right, but miss any one and people will flag you down."

**Banned words** — game-changer, revolutionary, unlock your potential, delve,
tapestry, nuanced, foster, crucial, essential, pivotal, transformative,
testament, underscores, paradigm, ever-evolving.

**Banned patterns**
- **Em dashes, under any circumstances.** (Use periods, commas, or a colon.)
- Fear-based copy ("AI will replace you").
- Excessive bullet lists.
- Uniform sentence rhythm.
- AI signposting ("here's why this matters").
- Rule of three purely for rhythmic effect.
- False contrasts ("it's not X, it's Y").

Every line should sound like it could only come from Keyframe.

---

## VISUAL FOUNDATIONS

**Mood.** Cinematic, restrained, premium. The look is proof of taste. No neon,
no loud gradients, no AI-course-template energy. One accent element per
composition, maximum.

**Colour.** True black (`Void #000000`) is the foundation; `Obsidian #0A0610` is
the working surface; `Elevated #120A1C` lifts cards. Purple is the only chroma
and it signals intelligence and depth: `Royal #7C3AED` for interactive/web
elements, `Orchid #A855F7` for hover, `Imperial`/`Plum` for deep accents and the
ends of the rare gradient. The logo phi uses a softer lavender (`#C4B5FD`).
Full-saturation violet outside those uses: never. `Champagne #D9C089` is an
optional metallic substitute for purple and is never used alongside it.

**Type.** Display is `Epilogue 800` with tight tracking (-0.03em) and a 1.05 line
height. Body and all UI is `Inter 400–600` at 1.6 line height, left-aligned.
`Cormorant Garamond` appears only in the logo lockup, never in body. Labels are
lowercase, tracked wide (0.16em), in Orchid Gray. Mono is the system SF Mono /
ui-monospace stack for code, hex values, and technical labels.

**Backgrounds.** Void or Obsidian only. No light modes in core brand assets. No
busy textures. Imagery, when present, is cinematic film-still grade: warm-to-cool
color grading, real depth, grain acceptable. Backgrounds stay dark so the work
and the cream type carry the eye. Gradients are rare and always end in `Plum`.

**Borders & cards.** Hairline borders (`#1E1530`, 1px) define panels and dividers.
Cards sit on `Elevated` with a hairline border and `--radius-md (12px)`, low-key
shadow (`--shadow-md`), no heavy chrome. Corner radii are small and consistent:
4 / 8 / 12 / 16, pill for chips and avatars.

**Shadows & glow.** Dark, soft, low-opacity drop shadows for depth. Interactive
accents may carry a soft purple glow (`--glow-accent`) on hover or focus — used
sparingly, never decoratively.

**Motion.** Subtle and confident. Fades and short eased moves (`--ease-out`,
120–360ms). No bounce, no spin, no infinite decorative loops. Hover states
brighten purple toward Orchid or lift opacity; press states deepen the colour
slightly and may nudge scale down a hair. Focus shows a soft Royal ring.

**Transparency & blur.** Used quietly: a `--gradient-veil` (transparent to Void)
to protect text over imagery, occasional low blur on overlays. Never frosted-glass
maximalism.

**Layout.** Generous negative space. Content max ~1200px, prose ~680px.
Left-aligned. One idea per view. The composition should feel edited, like a cut.

---

## ICONOGRAPHY

The brand guidelines do not specify an icon set. The one true mark is the
**phi (φ)** logomark — set in Cormorant Garamond, lavender on dark — used for app
icons, favicons, avatars, and the corner watermark on every Instagram post (in
Mauve Muted). That glyph is the brand's signature; lean on it before reaching for
decorative iconography.

For UI chrome (play, menu, search, bookmark, camera, film, layers), this system
standardises on **[Lucide](https://lucide.dev)** — thin 1.5px stroke, no fills,
which matches the restrained cinematic feel. Render in Cream by default, Lavender
or Royal for the active/interactive state. No filled icon styles, no emoji, no
unicode dingbats anywhere in the brand.

> **Substitution flag.** Lucide is a substitution chosen by this design system,
> not a set named in the source guidelines. If Keyframe has an in-house or
> licensed icon library, send it over and it will replace Lucide wholesale (the
> stroke weight and dark-on-cream treatment should carry across cleanly).

Usage in this project:
- Cards and UI kits load Lucide from CDN (`unpkg.com/lucide`), then `lucide.createIcons()`.
- Keep icons at 20–26px, 1.5px stroke, optical-centred with their label.
- One accent-coloured icon per composition, maximum. Everything else is Cream.

---

## INDEX — what's in this system

Root
- `styles.css` — the single CSS entry point consumers link. `@import`s the tokens + fonts.
- `readme.md` — this guide.
- `SKILL.md` — Agent-Skill front matter for downloading into Claude Code.

`tokens/`
- `fonts.css` — Epilogue, Inter, Cormorant Garamond (Google Fonts).
- `colors.css` — surfaces, purple accents, text, champagne, plus semantic aliases.
- `typography.css` — families, scale, tracking, line heights, the `.kf-label` utility.
- `spacing.css` — spacing scale, radii, borders, shadows, gradients, motion, layout.

`components/`
- `brand/Logo` — wordmark + phi logomark.
- `core/Button`, `core/Card`, `core/Badge`, `core/Avatar`.
- `forms/Input`, `forms/Switch`.
- `navigation/Tabs`.
- Each has `.jsx`, `.d.ts`, `.prompt.md`, and a directory `@dsCard` HTML.

`ui_kits/`
- `keyframe-web/` — interactive teaching-site: landing, lesson player, enroll flow.
  See its own `README.md`.

`guidelines/` — foundation specimen cards rendered in the Design System tab:
Colors (surfaces, accent, text, metallic), Type (display, body, wordmark,
labels/mono), Spacing (scale, radii, elevation), Brand (voice, logo, iconography).
