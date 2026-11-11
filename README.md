# בידיים טובות — Maccabident onboarding module

Hebrew (RTL) e-learning module for new clinic employees: a shared core plus role
tracks for reception, assistants and clinicians, designed for one sitting.

**Status: infrastructure and one vertical slice.** The specification in
`docs/good_hands_spec/` is version 0.1, a draft pending professional approval.
All learner-facing text in this repository is DRAFT and is not approved
Maccabident policy.

## What is built

| Area | State |
|---|---|
| Content model with schema validation | Done (`src/content`) |
| Navigation engine, role paths, skip prevention | Done (`src/engine/flow.ts`) |
| Scoring with configurable threshold | Engine done and tested; no assessment screen yet |
| Progress save and resume | Done, browser localStorage only |
| Narration player and transcript | Done; no narration has been produced |
| Analytics events and adapter | Done; Console and Noop adapters only |
| Media manifest and placeholders | Done; every asset is listed as `missing` |
| Screens | Slice only: S00 → S01 → S03 (values as cards) → S05 → S09 |

S02, S04, S06, S07 and S08 exist as validated content stubs and are not yet in the flow.

## Run

Requires Node 22.

```bash
npm install
npm run dev        # development server, DRAFT content visible with a "טעון אישור" badge
npm run typecheck
npm run lint
npm test           # unit tests (Vitest)
npm run e2e        # browser tests (Playwright, desktop and 360px)
npm run build      # static build in dist/, relative paths, host-neutral
```

`npm run e2e` needs a Chromium for Playwright (`npx playwright install chromium`).

A production build hides DRAFT content. To show it deliberately, for example in a
pilot, build with `VITE_ALLOW_DRAFT=true`; the badge then stays visible.
`VITE_ANALYTICS_ADAPTER=console|noop` selects the analytics adapter
(default: `console` in development, `noop` in production).

## Editing content

No content lives in components. Everything is JSON under `src/content` and is
validated when the application starts and in the unit tests.

| File | Holds |
|---|---|
| `course.json` | Version, assessment settings, the navigation graph (`flow.transitions`) |
| `screens/Sxx.json` | One screen: title, on-screen text, narration transcript, media ids, source pages, approval status |
| `scenarios/SC-XXX-nn.json` | One scenario: scene, question, exactly three options with one `preferred`, feedback per option |
| `values.json`, `roles.json` | Service values and role labels |
| `media-manifest.json` | Every media asset id; set `status: "ready"` and `src` once a file is in `public/media/` |
| `ui.json` | Interface wording |

To add a screen to the course, add its JSON file and reference it in
`course.json` → `flow.transitions`. A transition is either a screen id or an
object keyed by role. Validation fails with a list of problems if a reference is
broken, a scenario does not have exactly one preferred option, or a role cannot
reach the summary screen.

Change `courseVersion` when content changes in a way that makes saved progress
invalid; progress saved under another version is discarded.

## Analytics

`track()` builds the event envelope, validates it against the schema in
`src/analytics/events.ts` (the events in `docs/good_hands_spec/05-analytics.md`)
and hands it to an `AnalyticsAdapter`. A failing adapter or an invalid event
never interrupts the learner. Payloads are strict: an unexpected field is
rejected. To connect a real destination, implement `AnalyticsAdapter` in
`src/analytics/adapter.ts`; screen components do not change.

## Known limits

- Progress and the learner id are stored in the browser on one device. They are
  not an organisational record and not evidence of completion.
- No personal or medical data is collected. The learner id is a random value
  with no link to a person.
- The 80/100 pass threshold and 20 points per decision are development targets
  from the specification, not a Maccabident requirement.
- Colours and fonts are neutral placeholders (`src/styles/index.css`) until brand assets are supplied.
- Not yet covered: SCORM/xAPI packaging, employee identification, completion
  certificate, slow-network behaviour, testing with a real screen reader, and
  measured completion time. The open decisions are listed in
  `docs/good_hands_spec/07-open-decisions.md`.
