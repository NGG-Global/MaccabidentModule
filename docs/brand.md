# Brand alignment: "בידיים טובות" (DRAFT)

The client asked to align the module's look with the branding of the service concept. This change covers design only: no content, text or logic was changed. The one exception is the logo's alt text ("לוגו בידיים טובות"), added as an accessibility label.

## Where the design is defined (sources of truth)

| What | Source of truth | Mirrors and consumers |
|---|---|---|
| UI colours | `src/styles/index.css`, `@theme` block (Tailwind v4 tokens such as `--color-navy`, read by utilities like `bg-navy` and `text-violet-ink`) | `src/remotion/theme.ts` (`color`, `logoGradient`) for the Remotion compositions. `tests/unit/brand.test.ts` fails if the two differ. |
| Fonts | `src/styles/index.css`: `--font-sans`, `--font-display` | `src/remotion/theme.ts` (`font`); files loaded in `src/main.tsx` through `@fontsource-variable/assistant` (interim, until Ploni) |
| Logo | `assets/brand/bidayim-tovot-logo.svg` or `.png` | `src/components/BrandLogo.tsx`, used on S00 (opening) and S03 (the screen that presents the service concept) |
| Brand gradient and surfaces | `--gradient-brand`, `--surface-night`, `--surface-dawn` in `src/styles/index.css` | Utilities `bg-brand-gradient`, `bg-night` and `bg-dawn`; `surface` and `logoGradient` in `src/remotion/theme.ts` |
| Animated logo | `src/remotion/LogoMark.tsx` (vector paths from the supplied logo) | The S03 concept animation, the S00 title moment and outro, the S09 closing |

The Maccabident company logo in the header (`public/media/LOGO-MACCABIDENT-01.png`) is unchanged.

## Colour palette

All brand hues are sampled from the supplied logo file (`assets/brand/bidayim-tovot-logo.png`). Every value was checked against the pixels in the PNG.

| Token | Value | From the logo | Use |
|---|---|---|---|
| `--color-logo-navy` / `--color-navy` | `#243F82` | Line art | Headings, primary buttons, visited states (9.1:1 on paper) |
| `--color-logo-1` / `--color-sky` | `#00B9FF` | Gradient start | Light accent on dark backgrounds only (7.4:1 on ink) |
| `--color-logo-2` | `#339AFF` | Gradient | Brand gradient |
| `--color-logo-3` | `#677BFF` | Gradient | Brand gradient |
| `--color-logo-4` / `--color-violet` | `#8D65FF` | Gradient | Fills, rings, progress, large text (3.5:1 on paper) |
| `--color-logo-5` | `#A457FF` | Gradient | Brand gradient |
| `--color-logo-6` | `#AD52FF` | Gradient end | Brand gradient |
| `--color-violet-ink` | `#6858D3` | 65% `logo-4` + 35% `logo-navy` | Small violet text and white text on violet (4.9:1 on paper, 5.35:1 with white) |

**Light neutrals, tinted with the logo's blue.** Each is `logo-3` mixed with white:

| Token | Mix | Value |
|---|---|---|
| `paper` | 6% | `#F6F7FF` |
| `brand-50` | 8% | `#F3F4FF` |
| `paper-deep` | 12% | `#EDEFFF` |
| `mist` and `brand-100` | 16% | `#E7EAFF` |

These replace the earlier warm beige. Text contrast on the new paper is unchanged or better: navy 9.3:1, `violet-ink` 5.0:1, `ink/70` 6.0:1.

`ink` `#0B1F3A` stays the neutral dark for text. `brand-600` points to the logo navy.

### Brand surfaces

| Surface | CSS | Remotion | Where |
|---|---|---|---|
| Night: navy to ink, with the logo's violet (top start) and cyan (bottom end) glowing in | `bg-night` (`--surface-night`) | `surface.night` | Chapter cards, the opening's closing invitation, the S08 result, the S09 closing, the S04 chapter-complete card, the narration panel, the S09 completion panel |
| Dawn: the tinted paper with soft logo glows | `bg-dawn` (`--surface-dawn`) | `surface.dawn` | The cover panel, the S03 concept animation, the title moments of S00 and S09 |
| Brand gradient (the heart) | `bg-brand-gradient` (`--gradient-brand`) | `logoGradient` | The arc motif in every animation, the current segment of the progress bars, the rule under the cover title, the ring of the active journey node |

White text on the night surface stays above 8:1 everywhere, including over the glows. Highlighted list items (the current value, the current measurement chapter) use navy instead of ink.

**Why there is a `violet-ink`.** No violet in the logo reaches 4.5:1 on a light background; the best is 3.9:1, and the previous violet was also only 3.9:1. Small violet text, such as the chapter eyebrow, now uses the mix of two logo colours. Violet as a fill or graphic keeps the logo value.

### Where each token takes effect

| Token | UI (Tailwind uses / files) | Remotion |
|---|---|---|
| `navy` | 55 / 17: headings, buttons, visited states, the header's completed chapters | 27 uses |
| `violet` | Fills and rings: current chapter bar, active progress, bullets, focus ring, "continue here" pulse | 33 uses: accents in every composition |
| `violet-ink` | 17 uses: 14 small-text (eyebrows, step labels, number labels) and 3 badges with white text (current chapter, conclusion, active journey node) | Active journey node |
| `sky` | Not used in the UI | 3 uses on dark backgrounds |
| `paper`, `mist`, `paper-deep` | Page background, cards' surroundings, light text on dark | Light animation grounds, light text on dark |

## Fonts: interim Assistant, waiting for licensed Ploni

The target is Ploni for the whole module, set in one central place: `--font-sans` and `--font-display` in `src/styles/index.css`, mirrored in `font` in `src/remotion/theme.ts`. A unit test keeps the two the same.

**Interim, at the client's request (2026-11-25):** **Assistant** (SIL Open Font License 1.1, bundled with `@fontsource-variable/assistant`, no external request at runtime) is used for both headings and text, as Ploni is a single family.
- **Why Assistant:** it was compared side by side with Ploni and other open-licence Hebrew fonts (Heebo, Rubik, Noto Sans Hebrew, IBM Plex Sans Hebrew, Alef, Varela Round). It is the closest in width and in the structure of the letters; Heebo, the previous text font, is noticeably wider.
- **What was replaced:** Heebo for text and Frank Ruhl Libre (serif) for headings. Both packages were removed.
- **Fit:** every screen was checked for scrolling at 1440 × 900 and 360 × 740.

The font archive supplied in this conversation was not used. Its `info.txt` reads "License: Free for Personal Use" and links to a third-party download site, which does not license use in a client deliverable.

**Still needed for Ploni, as woff2 from a licensed source (for example a web licence covering Maccabident / NGG):**

| Weight | Ploni file (typical name) | Used for |
|---|---|---|
| 400 | Regular | Body text |
| 500 | Medium | 10 places (`font-medium`) and 2 in compositions |
| 600 | DemiBold | 56 places (`font-semibold`) and 9 in compositions |
| 700 | Bold | Headings, 12 `font-bold` and 24 in compositions |

Hebrew and Latin glyphs are both needed (the course has English terms and numbers).

**Switching to Ploni:**
1. Place the files under `public/fonts/ploni/` and add one `@font-face` block per weight in `src/styles/index.css`.
2. Put `'Ploni'` first in `--font-sans` and `--font-display`, keeping Assistant as the fallback, and the same in `src/remotion/theme.ts`.
3. Check every screen for fit again, since Ploni's metrics differ slightly.

## Logo

### Where it appears

- **Cover (S00):** a light brand panel with the logo, the title and "התחלה". The arrival photo sits beside it on wide screens and above it on phones. The cover had a dark overlay before.
- **Header, every screen:** the "בידיים טובות" logo beside the Maccabident logo. The course name is added on very wide screens.
- **S03, the screen that presents the service concept:** beside the title.
- **In the animations,** as an animated vector logo: the hands and the heart outline draw themselves in, and the gradient heart fills with a short beat.
  - **S03 concept introduction:** the logo draws in as "תפיסת השירות של מכבידנט נקראת בידיים טובות" is spoken, under the name. It then moves to the corner and stays while the three values are named. This animation was moved from the dark surface to the light brand surface, so the logo appears in its true colours.
  - **S00 opening:** the logo draws in with "כל מטופל רוצה לדעת שהוא נמצא… בידיים טובות". It returns as a light seal on the night surface in the closing invitation.
  - **S09 closing:** the logo draws in once more above the concept's name, as a reply to the opening.

The static screens use the logo file. The animations use `LogoMark`, whose paths follow the supplied logo; if the official vector file differs, those paths need updating.

### File

- `src/components/BrandLogo.tsx` loads `assets/brand/bidayim-tovot-logo.svg` if it exists, otherwise the `.png`, otherwise a clearly marked dashed placeholder of the same size. Replacing the logo only takes placing the file.
- The PNG supplied in this conversation (1998 × 1600, transparent background) is in place.
- The logo's navy line art has only 1.7:1 contrast on dark surfaces, so it is always shown on a light ground: the cover panel, the header, light animation surfaces, or a paper seal on the night surface.
- Alt text: empty on the cover, where the heading beside it already says "בידיים טובות"; "לוגו בידיים טובות" in the header and on S03.
- **The SVG version pasted in the conversation was not used.** Its embedded C2PA manifest says it was produced by Claude at a user's request, so it is most likely a vector trace and not the brand owner's master file. Its gradient stops match the PNG exactly. Please confirm with the brand owner and supply the official vector file. If it is placed as `assets/brand/bidayim-tovot-logo.svg`, it is picked up automatically.

## Emotions model

The source code, content files, captions, UI strings and drawn graphics were searched for any mention of an emotions model, smileys or emoji (Hebrew and English terms, emoji code points). **Nothing was found.**

- The survey illustration in S07 uses stars.
- The "רמזור ליישום" graphic uses three coloured circles with no faces.
- The photographs and videos were not reviewed frame by frame as part of this change.

## Patient journey as a cycle (S04)

- The five touchpoints are shown as a ring of numbered nodes, 1 at the top. The order runs counter-clockwise, so it moves right to left, as Hebrew is read. Arrows join each step to the next, and step 5 leads back to step 1. A cycle mark in the centre shows that the process repeats.
- The active step is highlighted: violet fill, a ring in the logo gradient, a slightly larger node and a bold label. Visited steps are navy with a check; unvisited steps are dashed. An arc is drawn solid once the step it leaves has been visited.
- **Interaction is unchanged.** Each node is the same button as before: same test id, accessible name and `aria-current`. Choosing one plays its narration and shows its points. "Next touchpoint", captions and the transcript work as before.
- **Wide screens:** the ring with titles, then the caption and player controls under it, beside the touchpoint card. **Phones:** a compact ring beside the count, with the card below. Every hit area is at least 44 px even where the drawn node is smaller.
- The journey composition (intro and summary) uses the same geometry (`src/remotion/cycle.ts`).
- Verified at 1440 × 900 and 360 × 740 with no scrolling, including a two-line caption on the phone. That caption was clipped before this change. New e2e test: "the journey touchpoints form a cycle…".
