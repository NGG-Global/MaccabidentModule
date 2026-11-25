# Brand alignment: "בידיים טובות" (DRAFT)

The client asked to align the module's look with the branding of the service concept. This change covers design only: no content, text or logic was changed. The one exception is the logo's alt text ("לוגו בידיים טובות"), added as an accessibility label.

## Where the design is defined (sources of truth)

| What | Source of truth | Mirrors and consumers |
|---|---|---|
| UI colours | `src/styles/index.css`, `@theme` block (Tailwind v4 tokens such as `--color-navy`, read by utilities like `bg-navy` and `text-violet-ink`) | `src/remotion/theme.ts` (`color`, `logoGradient`) for the Remotion compositions. `tests/unit/brand.test.ts` fails if the two differ. |
| Fonts | `src/styles/index.css`: `--font-sans`, `--font-display` | `src/remotion/theme.ts` (`font`); files loaded in `src/main.tsx` through `@fontsource-variable/heebo` and `@fontsource-variable/frank-ruhl-libre` |
| Logo | `assets/brand/bidayim-tovot-logo.svg` or `.png` | `src/components/BrandLogo.tsx`, used on S00 (opening) and S03 (the screen that presents the service concept) |
| Brand gradient | `--gradient-brand` in `src/styles/index.css` | The active node of the patient-journey cycle |

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

**Neutrals, unchanged:** `ink` `#0B1F3A`, `paper` `#F6F4EF`, `paper-deep` `#ECE8DF`, `mist` and `brand-100` `#DCE6F2`, `brand-50` `#EEF3FA`. `brand-600` now points to the logo navy. `brand-700` was not used anywhere and was removed.

**Why there is a `violet-ink`.** No violet in the logo reaches 4.5:1 on a light background; the best is 3.9:1, and the previous violet was also only 3.9:1. Small violet text, such as the chapter eyebrow, now uses the mix of two logo colours. Violet as a fill or graphic keeps the logo value.

### Where each token takes effect

| Token | UI (Tailwind uses / files) | Remotion |
|---|---|---|
| `navy` | 55 / 17: headings, buttons, visited states, the header's completed chapters | 27 uses |
| `violet` | Fills and rings: current chapter bar, active progress, bullets, focus ring, "continue here" pulse | 33 uses: accents in every composition |
| `violet-ink` | 17 uses: 14 small-text (eyebrows, step labels, number labels) and 3 badges with white text (current chapter, conclusion, active journey node) | Active journey node |
| `sky` | Not used in the UI | 3 uses on dark backgrounds |
| `ink`, `paper`, `mist` | Unchanged | Unchanged |

## Fonts: waiting for licensed files

The task is to move the whole module to Ploni through one central definition, which is `--font-sans` and `--font-display` in `src/styles/index.css`. No Ploni font files are in the repository, so the fonts were **not** changed. Heebo and Frank Ruhl Libre are still in use, and no substitute was added.

The font archive supplied in this conversation was not used. Its `info.txt` reads "License: Free for Personal Use" and links to a third-party download site, which does not license use in a client deliverable.

**Needed, as woff2 from a licensed source (for example a web licence covering Maccabident / NGG):**

| Weight | Ploni file (typical name) | Used for |
|---|---|---|
| 400 | Regular | Body text |
| 500 | Medium | 10 places (`font-medium`) and 2 in compositions |
| 600 | DemiBold | 56 places (`font-semibold`) and 9 in compositions |
| 700 | Bold | Headings, 12 `font-bold` and 24 in compositions |

Hebrew and Latin glyphs are both needed (the course has English terms and numbers). Once the files are placed under `public/fonts/ploni/`, the change is one `@font-face` block per weight. `--font-sans` and `--font-display` then become `'Ploni', 'Heebo Variable', 'Arial Hebrew', Arial, sans-serif`, the same value goes into `src/remotion/theme.ts`, and the two `@fontsource` imports are removed.

## Logo

- `src/components/BrandLogo.tsx` loads `assets/brand/bidayim-tovot-logo.svg` if it exists, otherwise the `.png`, otherwise a clearly marked dashed placeholder of the same size. Replacing the logo only takes placing the file.
- The PNG supplied in this conversation (1998 × 1600, transparent background) is in place.
- **S00 (opening):** the logo sits on a paper tile above the title. The logo's navy line art has 1.7:1 contrast on the dark cover, so it needs a light ground. Its alt text is empty there because the heading beside it already says "בידיים טובות".
- **S03 (values, the service concept):** the logo sits beside the screen title, with the alt text "לוגו בידיים טובות".
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
