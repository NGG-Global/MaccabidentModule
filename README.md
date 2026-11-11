# בידיים טובות — Maccabident onboarding module

Hebrew (RTL) interactive learning experience for new clinic employees.
**This build is a working prototype of the introduction chapter, S00–S04**, for
an internal stakeholder demonstration. S05–S09 are modelled in the content and
navigation but not implemented.

All learner-facing text is DRAFT and has not been approved by Maccabident.
The specification is in `docs/good_hands_spec/`; the media verification is in
`docs/media-audit.md`.

## What the prototype covers

| Screen | Content | Media |
|---|---|---|
| S00 Opening | Arrival film, then a narrated title sequence | V01, narration S00, Remotion `opening` |
| S01 Role | Three roles; the choice is saved for later branching | Narration S01 with live captions |
| S02 Two experiences | Chapter card, "Meet Yossi", both reception versions, question, animated feedback | V02A, V02B, narration S02 ×3, `chapter`, `meetYossi`, `compareFeedback` |
| S03 Three values | Introduction and one animation per value, then a matching exercise with spoken feedback | Narration S03 ×5, `valuesIntro`, `valueSeeing`, `valueAdapting`, `valueAccompanying` |
| S04 Patient journey | Five touchpoints, key points revealed as narrated; all must be explored; narrated chapter closing | Narration S04 ×7, `journey` |

Learner controls: start, continue, back, pause, replay, mute, captions,
transcript and speed; local save and resume; restart with confirmation.
Nothing makes a sound before the learner presses Start (or Play after a refresh).

## Run

Requires Node 22.

```bash
npm install
npm run dev          # http://localhost:5173 — DRAFT content visible, console analytics
npm run build:demo   # static build with DRAFT content shown, for the stakeholder demonstration
npm run preview      # serve the last build locally
```

`npm run build` (without `:demo`) hides DRAFT content, as a production build should.
The build is static with relative paths and can be served from any web server or folder.

## Deploying to Vercel

`vercel.json` holds the build settings (`npm run build:demo`, output `dist`, Node 22).
The site sends `noindex` headers and a `robots.txt` that blocks crawlers, but these
do not restrict access. **Turn on Deployment Protection before sharing any link.**

1. In Vercel, import `NGG-Global/MaccabidentModule` under the NGG team. The settings are read from `vercel.json`.
2. Before the first share, open Project Settings → Deployment Protection and enable protection for all deployments (Vercel Authentication, or a password if the plan includes it). Check which options the plan includes.
3. Give access only to NGG team members and the stakeholders cleared to see draft Maccabident content.
4. Use the production deployment for the demonstration; each push to a branch gets its own preview link for review.

## Checks

```bash
npm run typecheck
npm run lint
npm test             # unit tests (Vitest)
npm run e2e          # browser tests (Playwright; desktop and 360px)
```

`npm run e2e` needs Chromium for Playwright (`npx playwright install chromium`).

## Architecture

| Layer | Location | Notes |
|---|---|---|
| Content | `src/content/` | JSON validated with Zod at start-up: screens, timed sequences, questions, captions, media manifest |
| Media | `public/media/`, `src/content/media-manifest.json` | Stable ids, measured durations, source and verification per asset |
| Interaction logic | `src/engine/flow.ts` | Pure reducer: navigation graph, completion rules, skip prevention, resume validation |
| Playback | `src/stage/` | One active media beat at a time; narration drives its composition frame by frame |
| Presentation | `src/screens/`, `src/components/`, `src/remotion/` | React + Tailwind + Motion; Remotion compositions in `@remotion/player` |
| Analytics | `src/analytics/` | Typed, validated, local only (memory buffer, console in development) |

Narration timing: every animated line has an `at` time in seconds taken from
word timings of the actual narration, so animation follows the voice and never
cuts it off. Compositions render 16:9 on wide screens and 4:5 on phones.

## Analytics

Events: `course_started`, `screen_viewed`, `narration_started`,
`narration_completed`, `video_started`, `video_completed`,
`question_answered`, `journey_stage_viewed`, `role_selected`,
`prototype_completed`. They are validated against strict schemas and kept in
the page only; in development they are also printed to the console and exposed
as `window.__goodHandsEvents`. Nothing is transmitted and no personal or medical
data is collected. To connect a destination later, implement
`AnalyticsAdapter` in `src/analytics/adapter.ts`.

## Known limits

- **Remotion licence.** Remotion requires a paid company licence for companies above a small size (see remotion.dev/license). This must be confirmed before production use; the prototype does not set `acknowledgeRemotionLicense`.
- The station 3 narration says "התחנה השישית" instead of "השלישית" and should be re-recorded. S05–S09 media have not been supplied.
- V03 has a garbled burned-in subtitle and is not used. The clinic logo in the videos is AI-generated and needs Maccabident's confirmation. See `docs/media-audit.md`.
- Captions are a hand-corrected machine transcription pending comparison with the approved scripts.
- Progress and the learner id are stored in this browser only; they are not an organisational record.
- In development, React StrictMode makes the Remotion Player log `Cannot suspend a closed AudioContext`; this does not occur in the production build.
- Not verified here: testing with a real screen reader, measured completion time with learners, SCORM/xAPI packaging.
