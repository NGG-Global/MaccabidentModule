# Narration changes awaiting re-recording

The on-screen text and the recorded narration must say the same thing. Where they
differ, the difference is listed here until a new recording replaces the old one.

## AUDIO-S04-05 — S04, station 5 "מעקב, בקרה וקשר"

**Change (feedback meeting, 24.11):** the section "איך אנחנו לומדים ומשתפרים" was removed. One statement about
the satisfaction survey was added to station 5, on screen and in the script.

**Status:** the station shows the new sentence as its last key point. **The current recording does not say it.**
Captions and transcript show what the recording actually says, so the gap is visible until it is re-recorded.

**Current recording (28.8 s):**

> התחנה החמישית היא המעקב והקשר לאחר הטיפול. יש מצבים שבהם השירות לא מסתיים כשהמטופל יוצא מהמרפאה. למשל, מעקב אחר המשך סדרת טיפולים, בירור לגבי תור שלא התקיים, או יצירת קשר לאחר טיפול מורכב, בהתאם לתפקיד ולנהלים. המעקב עוזר לשמור על רצף השירות ולמנוע מצב שבו המטופל נשאר בלי מענה, וזה בדיוק הרעיון של ליווי לאורך הדרך.

**Updated script (the added sentence in bold):**

> התחנה החמישית היא המעקב והקשר לאחר הטיפול. יש מצבים שבהם השירות לא מסתיים כשהמטופל יוצא מהמרפאה. למשל, מעקב אחר המשך סדרת טיפולים, בירור לגבי תור שלא התקיים, או יצירת קשר לאחר טיפול מורכב, בהתאם לתפקיד ולנהלים. **בסיום הביקור נשלח למטופל סקר שביעות רצון, שעוזר לנו להמשיך ולשפר את השירות.** המעקב עוזר לשמור על רצף השירות ולמנוע מצב שבו המטופל נשאר בלי מענה, וזה בדיוק הרעיון של ליווי לאורך הדרך.

**To re-record:** one file only, `AUDIO-S04-05`, with the same voice and settings as the other station recordings.
No other recording mentions the removed section, so nothing else needs to be re-recorded.

**After re-recording:** replace `public/media/AUDIO-S04-05.mp3`, update its measured `durationSec` in the
manifest, regenerate its captions, and re-time the station's key points (`at` values in
`src/content/screens/S04.json`) to the new recording; the survey point should appear when the sentence is spoken.
Then remove this section from this file.
