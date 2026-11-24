# בידיים טובות — Maccabident onboarding module

Hebrew (RTL) interactive learning experience for new clinic employees.
**This build covers the whole course, S00–S09**, for stakeholder review: the
introduction chapter (S00–S04), shared and role-specific practice scenarios
(S05–S06), service measurement (S07), the scored assessment (S08) and the
conclusion (S09). Narration for S07–S09 has not been supplied yet.

All learner-facing text is DRAFT and has not been approved by Maccabident.
The specification is in `docs/good_hands_spec/`; the media verification is in
`docs/media-audit.md`; the S05–S06 narration mapping is in `docs/audio/`; what
is approved, proposed or missing is in `docs/content-coverage.md`.

## What the course covers

| Screen | Steps | Content | Media |
|---|---|---|---|
| S00 Opening | Cover → film | Arrival film, then a narrated title sequence | V01, narration S00, Remotion `opening` |
| S01 Role | — | Three roles; the choice is saved for later branching | Narration S01 with live captions |
| S02 Two experiences | Watch → Question → Explanation | Chapter card, "Meet Yossi", version A then version B (each labelled while it plays), the question while its narration asks it, then the animated explanation | V02A, V02B, narration S02 ×3, `chapter`, `meetYossi`, `compareFeedback` |
| S03 Three values | Watch → Exercise | Introduction and one animation per value (with an index), then a matching exercise with spoken feedback | Narration S03 ×5, `valuesIntro`, `valueSeeing`, `valueAdapting`, `valueAccompanying` |
| S04 Patient journey | Introduction → Touchpoints → Summary | Five touchpoints, key points revealed as narrated; all must be explored; narrated chapter closing | Narration S04 ×7, `journey` |
| S05 Shared scenario | Situation → Decision → Feedback | A delay in the waiting room: narrated situation and Yossi's complaint on video; the question opens as it is asked; each answer plays its own narrated feedback; the preferred answer is followed by a clip of what it looks like; retry at any time | Narration S05 ×5, V03 (cropped), V04B, `scenarioIntro`, `scenarioFeedback` |
| S06 Role scenarios | Situation → Decision → Feedback, per case | Two cases for the role chosen in S01 (reception, assistants, or clinicians and hygienists), same pattern | Narration S06 ×24, V06, V07, V10 |
| S07 Measurement | Mechanisms → Knowledge check | Patient survey, mystery shopper, observations, traffic light and the improvement loop; two check questions with immediate feedback | `measurement` (narration not supplied) |
| S08 Assessment | Instructions → Questions → Result | 2 shared + 3 role questions, 20 points each, pass at 80 (configurable in `course.json`); no feedback until submission; then score, pass/fail, review with explanations, areas to strengthen, retry when failed | `assessmentResult` (narration not supplied) |
| S09 Conclusion | — | Yossi's farewell, the closing sequence, and the completion status (complete only with a passed assessment) | V04, `closing` (narration not supplied) |

**Completion rule:** the course is complete when the learner reaches S09 with the latest assessment attempt passed. Only then is `course_completed` reported (and the LMS seam told). Finishing S04 or failing the assessment does not complete the course.

**Randomisation:** answers in scenarios, checks and the assessment are shown in a seeded order; option ids stay stable, so feedback and scoring always follow the answer actually chosen. A retry of the assessment reorders its questions and answers.

### Layout and navigation

- **One window, no scrolling.** The course is exactly one viewport tall: header, screen, footer. Every screen and step fits without scrolling at 1920×1080, 1366×768, 1280×650, 1024×600, 768×1024, 390×844 and 360×740 (checked by `every screen and step fits the window without scrolling`). If a window is smaller still, or the text is zoomed, the screen area scrolls instead of cutting content off.
- **Steps inside a screen.** Longer screens are split into steps shown in a tracker beside the title. Steps already reached can be revisited from the tracker.
- **One place to continue.** The forward button is always at the bottom left and says where it leads ("לשאלה", "להסבר", "לתרגול", "לנקודת המגע הבאה", "לסיכום הפרק", "המשך"). A line beside it says what is needed to continue; when a step is finished the button is highlighted.
- **The media frame** sizes itself to the space left, keeps its aspect ratio, and has a fixed strip underneath for captions and for "segment finished / watch again". A segment timeline shows where the learner is in the sequence and lets them jump to a part.

Learner controls: start, continue, back, pause, replay, mute, captions,
transcript (in a dialog) and speed; local save and resume, with a notice on return; restart with confirmation.
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
| Presentation | `src/screens/`, `src/components/`, `src/remotion/` | React + Tailwind + Motion; Remotion compositions in `@remotion/player`. Screens set the footer's behaviour per step through `useScreenNav` (`src/components/ScreenNav.tsx`) |
| Assessment | `src/engine/assessment.ts`, `src/engine/scoring.ts` | Seeded draw of shared and role questions, option order, scoring against `course.json` |
| LMS seam | `src/lms/adapter.ts` | `setProgress` (location + compact versioned suspend data), `setScore`, `setCompleted`; the default does nothing, so the course stays a plain static site. A SCORM or xAPI implementation plugs in here |
| Analytics | `src/analytics/` | Typed, validated, local only (memory buffer, console in development) |

Narration timing: every animated line has an `at` time in seconds taken from
word timings of the actual narration, so animation follows the voice and never
cuts it off. Compositions render 16:9 on wide screens and 4:5 on phones.

## Analytics

Events: `course_started`, `screen_viewed`, `narration_started`,
`narration_completed`, `video_started`, `video_completed`,
`question_answered` (with `mode`: practice or assessment), `journey_stage_viewed`,
`role_selected`, `assessment_started`, `assessment_completed` and
`course_completed` (only when the completion rule is met). They are validated against strict schemas and kept in
the page only; in development they are also printed to the console and exposed
as `window.__goodHandsEvents`. Nothing is transmitted and no personal or medical
data is collected. To connect a destination later, implement
`AnalyticsAdapter` in `src/analytics/adapter.ts`.

## Known limits

- **Remotion licence.** Remotion requires a paid company licence for companies above a small size (see remotion.dev/license). This must be confirmed before production use; the prototype does not set `acknowledgeRemotionLicense`.
- The station 3 narration says "התחנה השישית" instead of "השלישית" and should be re-recorded.
- Narration for S07, S08 and S09 has not been supplied; those screens say so on screen.
- The 11 assessment questions and two S07 check questions were written for the build (`proposed: true`) and need SME approval. See `docs/content-coverage.md`.
- V03's burned-in subtitle is cropped out of the web copy; a clean regeneration is preferable. The clinic logo in the videos is AI-generated and needs Maccabident's confirmation. See `docs/media-audit.md`.
- Captions are a hand-corrected machine transcription pending comparison with the approved scripts.
- Progress and the learner id are stored in this browser only; they are not an organisational record.
- In development, React StrictMode makes the Remotion Player log `Cannot suspend a closed AudioContext`; this does not occur in the production build.
- An assessment in progress is not saved; after a refresh it starts again. Submitted attempts are saved.
- Not verified here: testing with a real screen reader, measured completion time with learners, SCORM/xAPI packaging (only the adapter seam exists).
