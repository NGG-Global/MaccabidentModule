# Media audit — S00–S04 prototype

Generated from `src/content/media-manifest.json` and `src/content/captions.json`. Every file was identified by its content, not by its file name or upload order: speech was transcribed locally (faster-whisper, ivrit-ai/whisper-large-v3-turbo-ct2, run in the session; nothing was sent to an external service) and each video was reviewed frame by frame.

## Status summary

| Status | Meaning |
|---|---|
| ready | File is in `public/media/` and used |
| missing | Not supplied; the interface says so instead of inventing content |
| blocked | Supplied but not usable as delivered |

## Narration and video

| Asset | Screen | Status | Duration (s) | Source file | Notes |
|---|---|---|---:|---|---|
| `VID-INTRO-01` | S00 | ready | 10.042 | lv_0_20261111233252.mp4 (corrected V01) | Wall sign corrected; shorter dialogue; AI-generated logo to be confirmed |
| `VID-COMPARE-A-01` | S02 | ready | 10.026 | V02A_Reception_Distracted_Service.mp4 |  |
| `VID-COMPARE-B-01` | S02 | ready | 10.026 | 1064077222_1794425076924453.mp4 (V02B) | Uploaded under a numeric file name; identified as V02B by its dialogue and framing, which match V02A. The earlier upload named V02B was a byte-identical copy of V04B. |
| `VID-WAIT-01` | later chapters | blocked |  | V03_Yossi_Waiting_Complaint.mp4 | Burned-in Hebrew subtitle is garbled ("שמחון בזת לאינוי של?"). Not usable; needs regeneration without subtitles. |
| `VID-CARE-01` | later chapters | ready | 10.026 | V04B_Reception_Empathetic_Response.mp4 |  |
| `VID-SERVICE-01` | later chapters | ready | 10.026 | V04_Reception_Service_Conversation.mp4 | Dialogue transcript has low confidence; check against the script. |
| `VID-AST-WELCOME-01` | later chapters | ready | 10.026 | V05_Assistant_Welcomes_Yossi.mp4 | Yossi wears a different outfit than in the other clips. |
| `VID-AST-ANXIETY-01` | later chapters | ready | 10.026 | V06_Yossi_Dental_Anxiety.mp4 |  |
| `VID-CLN-EXPLAIN-01` | later chapters | ready | 10.026 | V07_Dentist_Explains_Treatment.mp4 | AI-generated dental image on the tablet needs clinical review; check that Yossi is the same character. |
| `VID-REC-CLOSING-01` | later chapters | ready | 10.026 | V10_Reception_Followup_Closing.mp4 | Yossi puts a card in his wallet; confirm it does not imply a payment step. |
| `AUDIO-S00-01` | S00 | ready | 50.678 | S00_01_Welcome.mp3 |  |
| `AUDIO-S01-01` | S01 | ready | 24.189 | S01_01_Role_Selection.mp3 |  |
| `AUDIO-S02-01` | S02 | ready | 16.771 | S02_01_Introduction.mp3 |  |
| `AUDIO-S02-02` | S02 | ready | 9.091 | S02_02_Comparison_Question.mp3 |  |
| `AUDIO-S02-03` | S02 | ready | 20.349 | S02_03_Comparison_Feedback.mp3 |  |
| `AUDIO-S03-01` | S03 | ready | 16.771 | S03_01_Values_Introduction.mp3 |  |
| `AUDIO-S03-02` | S03 | ready | 28.029 | S03_02_Seeing_You.mp3 |  |
| `AUDIO-S03-03` | S03 | ready | 33.306 | S03_03_Going_Extra_Mile.mp3 |  |
| `AUDIO-S03-04` | S03 | ready | 31.321 | S03_04_Accompanying_You.mp3 |  |
| `AUDIO-S04-00` | S04 | missing |  | — | Not supplied. The S00–S03 archive contained no S04 files. |
| `AUDIO-S04-01` | S04 | missing |  | — | Not supplied. The S00–S03 archive contained no S04 files. |
| `AUDIO-S04-02` | S04 | missing |  | — | Not supplied. The S00–S03 archive contained no S04 files. |
| `AUDIO-S04-03` | S04 | missing |  | — | Not supplied. The S00–S03 archive contained no S04 files. |
| `AUDIO-S04-04` | S04 | missing |  | — | Not supplied. The S00–S03 archive contained no S04 files. |
| `AUDIO-S04-05` | S04 | missing |  | — | Not supplied. The S00–S03 archive contained no S04 files. |
| `AUDIO-S03-FB-01` | later chapters | missing |  | — | Not supplied; the exercise shows written feedback only. |

## Findings

1. **V02B duplicate.** The first upload named `V02B_Reception_Welcoming_Service.mp4` was byte-identical to `V04B_Reception_Empathetic_Response.mp4`. The correct V02B arrived later as `1064077222_1794425076924453.mp4`; it was identified by its dialogue ("בוקר טוב, ברוך הבא. בוא נבדוק יחד.") and its framing, which matches V02A.
2. **Unidentified narration file.** `UNVERIFIED_19_08_45.mp3` is an alternate take of `S02_02_Comparison_Question.mp3` (same text, different encoding). It is not used.
3. **S04 narration missing.** The narration archive contains S00–S03 only. S04 stage narration and the S03 exercise feedback narration were not supplied; S04 shows written key points and names the missing narration on screen.
4. **V01 wall sign — resolved.** The first V01 showed a meaningless sign under the logo ("הפנידיה משיבידנט"). A corrected version (`lv_0_20261111233252.mp4`) replaced it in S00: the sign now shows the logo only, and Yossi matches the other clips. Its dialogue is shorter than the first version: "שלום, בוקר טוב. יש לי תור לעשר." The logo itself is still AI-generated and should be confirmed with Maccabident.
5. **V03 burned-in subtitle.** The subtitle reads "שמחון בזת לאינוי של?" (garbled). V03 is blocked; one still frame from before the subtitle appears is used in the compositions.
6. **Bitstream defect.** The delivered H.264 streams failed to decode in Chromium when seeked. The web copies were re-encoded to clean 720p H.264 (keyframe every second, AAC 160 kb/s); the original uploads are unchanged.
7. **Consistency.** In V05 Yossi wears a different outfit; in V07 the actor may differ and the tablet shows an AI-generated dental image that needs clinical review. V10 shows a card going into a wallet; confirm it does not imply payment. None of these clips is used in S00–S04.

## Captions

Captions and transcripts are the machine transcription, corrected by hand only where the error was certain (for example "יחולם" → "לכולם", "מכבי דנט" → "מכבידנט"). Status in `captions.json` is `machine-transcribed`. They must be checked against the approved scripts before release.

## Brand

The logo (`LOGO-MACCABIDENT-01.png`) was supplied directly. Interface colours are sampled from it: violet `#7F68D7`, navy `#02428E`, blue `#0090D2`. No official brand guide was supplied; fonts (Frank Ruhl Libre, Heebo) are an interim choice.
