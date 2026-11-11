# Media assets

Web copies of the supplied media, named by stable asset id. Every file here is
registered in `src/content/media-manifest.json` with its source upload,
measured duration and verification notes; see `docs/media-audit.md`.

- Videos: re-encoded web copies (720p H.264, AAC). The original uploads are kept outside the repository.
- Narration: ElevenLabs MP3 files as supplied, renamed to their asset id.
- Stills and posters: frames extracted from the supplied videos.

To add or replace a file, put it here, set `"status": "ready"`, `"src"` and the
measured `"durationSec"` (audio/video) in the manifest, and add captions to
`src/content/captions.json`. Validation fails if any of these is missing.
