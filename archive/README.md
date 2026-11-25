# Archive

Content and media taken out of the course but kept so they can be restored.
Nothing in this folder is imported by the app or copied into the build (`dist/`),
so it does not enter the deployed site or a packaged zip.

## Contents

| Path | What it is | Why it is here |
|---|---|---|
| `content/screens/S07.json` | Screen S07 "איך אנחנו לומדים ומשתפרים": chapter card, measurement explainer (satisfaction survey, mystery shopper, observations and feedback, traffic light, improvement loop) | Removed at the client's request (feedback meeting, 24.11): the course covers the service concept and behaviours only |
| `content/questions/Q-S07-01.json` | Knowledge check: purpose of the satisfaction survey | Part of S07 |
| `content/questions/Q-S07-02.json` | Knowledge check: the traffic light | Part of S07 |
| `media/VID-AST-WELCOME-01.mp4` | V05, the assistant welcomes Yossi (Yossi's outfit does not match the other clips) | Not used by any screen |
| `media/POSTER-VID-AST-WELCOME-01.jpg` | Poster frame of V05 | Not used by any screen |
| `media/STILL-CORRIDOR-01.jpg` | Still from V05 | Not used by any screen |

The code that rendered S07 is kept in place and still compiles: `src/screens/MeasurementScreen.tsx`
and the `measurement` composition in `src/remotion/compositions/Course.tsx`. No screen uses them.

## Restoring

- **S07:** move `content/screens/S07.json` back to `src/content/screens/` and the two question files to
  `src/content/questions/`; in `src/content/course.json` set the transitions back to `"S06": "S07"` and
  `"S07": "S08"`; restore the assessment's chapter number (`S08.json`: eyebrow "פרק 7", chapter card "07");
  raise `courseVersion`.
- **A media file:** move it back to `public/media/` and set its manifest entry's `status` to `"ready"`.
  Content validation refuses any screen that refers to an archived file, so nothing can use one by mistake.
