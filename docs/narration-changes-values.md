# Narration changes: values wording (DRAFT)

The client asked to sharpen how the three values are presented and to name "חמלה" explicitly. The on-screen text and the captions now follow the updated script. The current recordings still say the previous wording, so until these files are re-recorded the audio and the captions differ in the sentences below.

## Recordings to re-record

| Recording | Screen | Sentence (before) | Sentence (after, to record) |
|---|---|---|---|
| AUDIO-S03-01 | S03 values intro | בואו נראה איך כל אחד מהם מתבטא בעבודה שלנו. | בואו נראה איך כל אחד מהם בא לידי ביטוי בעבודה שלנו. |
| AUDIO-S03-02 | S03 "רואים אותך" | המשמעות היא שאנחנו לא מחכים תמיד שהמטופל יבקש עזרה. אנחנו שמים לב למה שקורה סביבנו, מזהים צרכים ופועלים ביוזמה. | המשמעות היא שאנחנו מזהים מראש את הצרכים של המטופל, גם כשהוא לא אומר אותם. אנחנו מתייחסים אליו באופן אישי ומותאם, פונים אליו בכבוד ומגלים חמלה במידת הצורך. |
| AUDIO-S04-03 | S04 station "תקשורת עם המטופל" | לתת הסברים ולהפגין אמפתיה. | לתת הסברים ולהפגין אמפתיה וחמלה. |

AUDIO-S04-03 should be recorded in the same take as the existing fix: its opening says "התחנה השישית" instead of the third station.

The rest of each recording is unchanged. In AUDIO-S03-02 the examples (the confused patient in the waiting area, the proactive update about a delay) and the closing sentence stay as they are.

## Full scripts after the change

**AUDIO-S03-01**
תפיסת השירות של מכבידנט נקראת בידיים טובות. היא מבוססת על שלושה ערכים שמלווים אותנו לאורך המפגש עם המטופל. רואים אותך, מתאמצים למענך, ומלווים אותך לאורך הדרך. בואו נראה איך כל אחד מהם בא לידי ביטוי בעבודה שלנו.

**AUDIO-S03-02**
רואים אותך. המשמעות היא שאנחנו מזהים מראש את הצרכים של המטופל, גם כשהוא לא אומר אותם. אנחנו מתייחסים אליו באופן אישי ומותאם, פונים אליו בכבוד ומגלים חמלה במידת הצורך. למשל, כשמטופל נראה מבולבל באזור ההמתנה, אפשר לפנות אליו ולבדוק אם הוא זקוק להכוונה. או כשיש עיכוב, אפשר לעדכן אותו באופן יזום, עוד לפני שהוא נאלץ לגשת ולשאול. לפעמים, עצם הידיעה שמישהו שם לב אליך עושה הבדל גדול.

**AUDIO-S04-03**
התחנה השלישית היא התקשורת במהלך המפגש. זה המקום להקשיב, לברר צרכים, לתת הסברים ולהפגין אמפתיה וחמלה. חשוב לדבר בשפה ברורה ומותאמת, לשמור על פרטיות המטופל ולוודא שהוא מבין את המידע שנמסר לו. אם עולה קושי, לא תמיד נוכל לפתור אותו מיד, אבל כמעט תמיד נוכל להקשיב, לברר ולסייע למטופל להבין מה אפשר לעשות בהמשך.

## After the new recordings arrive

1. Replace the files and re-encode the web copies as before.
2. Re-transcribe them to get word timings, and update the cue start times in `src/content/captions.json`.
3. Update the `at` timings of the on-screen text in `S03.json` (`valuesIntro.outro`, `valueSeeing.lead`, `actions`, `examples`, `closing`) and in `S04.json` (communication `points`). The new definition is longer, so the examples and the closing line will start later.
4. Remove the re-record notes from `media-manifest.json` and `captions.json`.

## Not changed

- The recorded scenario feedback uses the verb "מבטאים" (for example, "מבטאים את הערך…"). That is a different verb from "מתבטא", and it is in recorded speech, so it was left as is.
- `src/content/values.json` lists "חמלה" as a sub-value of "מתאמצים למענך", following the source deck. That file is not shown to learners and was not changed.
