# S05–S09 narration: mapping and report

Source: `S05-S09.zip`, 29 ElevenLabs MP3 files (44.1 kHz mono), received 2026-11-24. Full transcripts with word timings, checksums and uncertain words: [`s05-s06-transcripts.json`](s05-s06-transcripts.json).

## Method

- Transcribed locally with faster-whisper and the Hebrew model `ivrit-ai/whisper-large-v3-turbo-ct2`. No audio was sent to an external service. The original files were not modified; the course uses copies renamed to their asset ids.
- Each recording was identified by what it says. File names carry only the generation time, so they were not used to assign content.
- Feedback recordings were matched to answers by meaning: the preferred answer is the one the recording calls "התגובה המועדפת", "נכון" or "מצוין"; the other two are matched to the specific mistake each recording describes (inaction or dismissal, versus a false promise, a privacy breach, acting outside the role, or pointing only to an app or website).
- One word in the whole set scored below 0.6 confidence ("את" in `AUDIO-S06-REC2-01`); it is listed, not corrected.

## Original → renamed

| Original file | Asset id | Duration (s) | Classification | Used in | Transcript |
|---|---|---:|---|---|---|
| `ElevenLabs_2026-11-24T09_18_38__s0_sim75_v4.mp3` | `AUDIO-S05-01` | 13.819 | scenario-introduction | SC-COM-01 situation | יוסי כבר יושב באזור ההמתנה. התור שלו היה אמור להתחיל לפני 20 דקות, אבל הוא עדיין לא נקרא להיכנס. הוא מסתכל שוב על השעון, קם מהכיסא ופונה אליך. בואו נשמע מה יש לו לומר. |
| `ElevenLabs_2026-11-24T09_19_12_לומדה _gen_s0_sim75_v4.mp3` | `AUDIO-S05-02` | 1.959 | question | SC-AST-01 question; SC-COM-01 question; SC-REC-01 question; SC-CLN-01 question | איך הייתם מגיבים ליוסי? |
| `ElevenLabs_2026-11-24T09_19_54_לומדה _gen_s0_sim75_v4.mp3` | `AUDIO-S05-FB-A` | 14.289 | incorrect-answer-feedback | SC-COM-01 answer A (undesirable) | התשובה הזאת לא נותנת מענה לתחושה של יוסי. גם אם אין לנו אפשרות לקצר את זמן ההמתנה, אנחנו עדיין יכולים להכיר בתסכול שלו ולנסות לברר מה קורה. יוזמה ואמפתיה הן חלק חשוב מהשירות. |
| `ElevenLabs_2026-11-24T09_20_20_לומדה _gen_s0_sim75_v4.mp3` | `AUDIO-S05-FB-B` | 14.211 | correct-answer-feedback | SC-COM-01 answer B (preferred) | זו התגובה המועדפת. אנחנו מכירים בתחושה של יוסי, מציעים פעולה ממשית ולא מבטיחים משהו שאנחנו לא יודעים. כך אנחנו מבטאים גם את הערך רואים אותך וגם את הערך מתאמצים למענך. |
| `ElevenLabs_2026-11-24T09_20_46_לומדה _gen_s0_sim75_v4.mp3` | `AUDIO-S05-FB-C` | 15.961 | incorrect-answer-feedback | SC-COM-01 answer C (undesirable) | הרצון להרגיע את יוסי הוא מובן, אבל כשאנחנו מבטיחים זמן שאין לנו דרך לאמת, אנחנו עלולים ליצור אכזבה נוספת ולפגוע באמון שלו. עדיף לברר, למסור מידע מדויק ולעדכן אותו בהתאם למה שידוע לנו. |
| `ElevenLabs_2026-11-24T09_21_43_לומדה _gen_s0_sim75_v4.mp3` | `AUDIO-S06-REC1-01` | 9.482 | scenario-introduction | SC-REC-01 situation | יוסי סיים את הטיפול וחזר לדלפק הקבלה. הוא מחזיק בידו כמה מסמכים ונראה מעט מבולבל. הוא מתקרב ושואל שאלה. |
| `ElevenLabs_2026-11-24T09_22_02_לומדה _gen_s0_sim75_v4.mp3` | `AUDIO-S06-REC1-FB-A` | 13.949 | incorrect-answer-feedback | SC-REC-01 answer A (undesirable) | התשובה הזאת משאירה את המטופל בחוסר ודאות. גם אם איננו יודעים מיד מה נדרש, אפשר לברר ולהכווין אותו לגורם המתאים. סגירת מעגל טובה מתחילה בכך שאנחנו לא משאירים שאלות פתוחות. |
| `ElevenLabs_2026-11-24T09_22_32_לומדה _gen_s0_sim75_v4.mp3` | `AUDIO-S06-REC1-FB-B` | 16.353 | correct-answer-feedback | SC-REC-01 answer B (preferred) | מצוין. התגובה הזאת מבטאת את הערך מלווים אותך לאורך הדרך. אנחנו בודקים מה נדרש, מסבירים את המשך התהליך ומוודאים שהמטופל יודע מה לעשות. כך נוצרת רציפות בין הטיפול הרפואי לבין השירות במרפאה. |
| `ElevenLabs_2026-11-24T09_23_04_לומדה _gen_s0_sim75_v4.mp3` | `AUDIO-S06-REC1-FB-C` | 13.636 | incorrect-answer-feedback | SC-REC-01 answer C (undesirable) | האפליקציה יכולה להיות כלי שימושי מאוד, אבל הפניה אליה לבדה לא תמיד מספיקה. חשוב קודם להבין מה המטופל צריך, להסביר לו את השלב הבא ולסייע לו להשתמש בערוץ המתאים. |
| `ElevenLabs_2026-11-24T09_23_51_לומדה _gen_s0_sim75_v4.mp3` | `AUDIO-S06-REC2-01` | 13.636 | scenario-introduction+question | SC-REC-02 situation | במהלך העבודה את עוברת על משימות המעקב. את מבחינה במטופל שלא הגיע לתור שנקבע לו. את יודעת שמעקב אחר מטופלים הוא חלק מהשמירה על רציפות השירות. מה נכון לעשות עכשיו? |
| `ElevenLabs_2026-11-24T09_24_42_לומדה _gen_s0_sim75_v4.mp3` | `AUDIO-S06-REC2-FB-A` | 13.087 | incorrect-answer-feedback | SC-REC-02 answer A (undesirable) | מעקב אחר מטופלים הוא חלק מתפיסת השירות של מכבידנט. התעלמות ממשימה פתוחה עלולה לפגוע ברציפות השירות. חשוב לבדוק מה נדרש במסגרת התפקיד ולפעול בהתאם לנהלים. |
| `ElevenLabs_2026-11-24T09_25_01_לומדה _gen_s0_sim75_v4.mp3` | `AUDIO-S06-REC2-FB-B` | 14.028 | correct-answer-feedback | SC-REC-02 answer B (preferred) | נכון, מעקב יזום יכול לעזור לשמור על רציפות הטיפול והשירות. יחד עם זאת, חשוב להקפיד על נהלי הפניה, ההרשאות והפרטיות ולתעד את הטיפול במשימה בהתאם להנחיות הארגון. |
| `ElevenLabs_2026-11-24T09_25_20_לומדה _gen_s0_sim75_v4.mp3` | `AUDIO-S06-REC2-FB-C` | 15.151 | incorrect-answer-feedback | SC-REC-02 answer C (undesirable) | גם כאשר אנחנו פועלים מתוך רצון לסייע, אסור לנו להתעלם מפרטיות המטופל. יש להשתמש רק בערוצי תקשורת מאושרים ולמסור מידע בהתאם לנהלים. שירות טוב משלב יוזמה עם אחריות מקצועית. |
| `ElevenLabs_2026-11-24T09_25_52_לומדה _gen_s0_sim75_v4.mp3` | `AUDIO-S06-AST1-01` | 10.371 | scenario-introduction | SC-AST-01 situation | דנה, הסייעת, מכניסה את יוסי לחדר הטיפול. הוא מתיישב בכיסא, אבל נראה מתוח. לפני שהטיפול מתחיל, הוא פונה אליה בשקט. |
| `ElevenLabs_2026-11-24T09_26_08_לומדה _gen_s0_sim75_v4.mp3` | `AUDIO-S06-AST1-FB-A` | 11.807 | incorrect-answer-feedback | SC-AST-01 answer A (undesirable) | התגובה נועדה להרגיע, אבל היא עלולה לגרום ליוסי להרגיש שלא באמת מקשיבים לו. עדיף להכיר בתחושה שלו, לתת לו מקום ולסייע לו לקבל את המענה המתאים. |
| `ElevenLabs_2026-11-24T09_26_27_לומדה _gen_s0_sim75_v4.mp3` | `AUDIO-S06-AST1-FB-B` | 14.681 | correct-answer-feedback | SC-AST-01 answer B (preferred) | זו התגובה המועדפת. היא מבטאת אמפתיה ורגישות לצורך האישי של המטופל. בנוסף, היא מאפשרת להעביר לצוות המטפל מידע חשוב על התחושות של יוסי, כדי שיוכל לקבל מענה מתאים במסגרת הטיפול. |
| `ElevenLabs_2026-11-24T09_26_45_לומדה _gen_s0_sim75_v4.mp3` | `AUDIO-S06-AST1-FB-C` | 13.087 | incorrect-answer-feedback | SC-AST-01 answer C (undesirable) | הרצון להרגיע הוא חיובי, אבל הבטחה לגבי תחושת הכאב או תוצאות הטיפול אינה מתאימה. חשוב להישאר בגבולות התפקיד, לגלות אמפתיה ולערב את הגורם המטפל כשנדרש. |
| `ElevenLabs_2026-11-24T09_27_32_לומדה _gen_s0_sim75_v4.mp3` | `AUDIO-S06-AST2-01` | 10.762 | scenario-introduction+question | SC-AST-02 situation | הטיפול התחיל. במהלכו את מבחינה שיוסי נע באי-נוחות ומנסה לסמן משהו בידו. הרופא מרוכז בפעולה שהוא מבצע. איך תפעלי? |
| `ElevenLabs_2026-11-24T09_27_56_לומדה _gen_s0_sim75_v4.mp3` | `AUDIO-S06-AST2-FB-A` | 14.106 | incorrect-answer-feedback | SC-AST-02 answer A (undesirable) | חשוב להישאר קשובים למטופל גם במהלך הטיפול. התעלמות מסימני אי-נוחות עלולה לפגוע בתחושת הביטחון שלו. כאשר מתעורר צורך, יש להתייחס אליו ולערב את הגורם המטפל בהתאם למצב. |
| `ElevenLabs_2026-11-24T09_28_11_לומדה _gen_s0_sim75_v4.mp3` | `AUDIO-S06-AST2-FB-B` | 12.669 | correct-answer-feedback | SC-AST-02 answer B (preferred) | נכון, הסייעת היא חלק משמעותי מחוויית המטופל בחדר הטיפול. זיהוי הצורך, שיקוף שלו לרופא ומתן סיוע מתאים הם דוגמה לשירות רגיש, יוזם ומקצועי. |
| `ElevenLabs_2026-11-24T09_28_29_לומדה _gen_s0_sim75_v4.mp3` | `AUDIO-S06-AST2-FB-C` | 12.513 | incorrect-answer-feedback | SC-AST-02 answer C (undesirable) | חשוב לגלות יוזמה, אבל גם לשמור על גבולות האחריות המקצועית. כאשר מתעורר צורך במהלך הטיפול, יש לתקשר עם הגורם המטפל ולפעול בהתאם להנחיותיו ולנהלים. |
| `ElevenLabs_2026-11-24T09_29_17_לומדה _gen_s0_sim75_v4.mp3` | `AUDIO-S06-CLN1-01` | 10.031 | scenario-introduction | SC-CLN-01 situation | יוסי יושב בכיסא הטיפולים. הסברת לו בקצרה על התהליך, אבל הוא עדיין נראה לא בטוח. רגע לפני שממשיכים, הוא שואל אותך שאלה. |
| `ElevenLabs_2026-11-24T09_29_30_לומדה _gen_s0_sim75_v4.mp3` | `AUDIO-S06-CLN1-FB-A` | 13.479 | incorrect-answer-feedback | SC-CLN-01 answer A (undesirable) | גם אם כבר ניתן הסבר, חשוב להתייחס לכך שהמטופל עדיין לא הבין. מתן מידע אינו מספיק כשלעצמו. אנחנו רוצים לוודא שהמטופל מבין את המידע הרלוונטי ויכול לשאול שאלות. |
| `ElevenLabs_2026-11-24T09_29_46_לומדה _gen_s0_sim75_v4.mp3` | `AUDIO-S06-CLN1-FB-B` | 13.557 | correct-answer-feedback | SC-CLN-01 answer B (preferred) | נכון מאוד, הסבר ברור, הקשבה לשאלות ובדיקת הבנה הם חלק משמעותי מחוויית המטופל. הם מאפשרים לו להיות שותף לתהליך ולהרגיש שמכבדים את הצרכים והחששות שלו. |
| `ElevenLabs_2026-11-24T09_30_07_לומדה _gen_s0_sim75_v4.mp3` | `AUDIO-S06-CLN1-FB-C` | 12.199 | incorrect-answer-feedback | SC-CLN-01 answer C (undesirable) | הרגעה היא חלק חשוב מהמפגש, אבל היא אינה תחליף להסבר מקצועי. כדאי להימנע מהבטחות גורפות, לברר מה המטופל לא הבין ולספק מידע מדויק ומותאם. |
| `ElevenLabs_2026-11-24T09_30_40_לומדה _gen_s0_sim75_v4.mp3` | `AUDIO-S06-CLN2-01` | 11.886 | scenario-introduction+question | SC-CLN-02 situation | הטיפול הסתיים. יוסי מתארגן לצאת מחדר הטיפולים, אבל לפני שהוא קם, הוא אומר, אני לא בטוח שאני זוכר מה אני צריך לעשות עכשיו. מה נכון לעשות? |
| `ElevenLabs_2026-11-24T09_31_02_לומדה _gen_s0_sim75_v4.mp3` | `AUDIO-S06-CLN2-FB-A` | 13.871 | incorrect-answer-feedback | SC-CLN-02 answer A (undesirable) | המטופל אומר במפורש שהוא אינו בטוח מה עליו לעשות. זה הזמן לעצור, להתייחס לשאלה ולוודא שהוא מקבל את המידע הנדרש. סיום הטיפול הוא חלק חשוב מחוויית השירות. |
| `ElevenLabs_2026-11-24T09_31_21_לומדה _gen_s0_sim75_v4.mp3` | `AUDIO-S06-CLN2-FB-B` | 14.916 | correct-answer-feedback | SC-CLN-02 answer B (preferred) | זו התגובה המועדפת. הסבר מותאם, בדיקת הבנה ותיאום ציפיות לגבי ההמשך עוזרים למטופל לצאת מהמרפאה עם תחושת ביטחון ובהירות. כך אנחנו מבטאים את הערך מלווים אותך לאורך הדרך. |
| `ElevenLabs_2026-11-24T09_31_45_לומדה _gen_s0_sim75_v4.mp3` | `AUDIO-S06-CLN2-FB-C` | 13.322 | incorrect-answer-feedback | SC-CLN-02 answer C (undesirable) | מידע דיגיטלי יכול לתמוך בהסברים, אבל הוא אינו תחליף להנחיות המקצועיות שהמטופל צריך לקבל. חשוב לספק מידע ברור ורלוונטי ולוודא שהמטופל יודע כיצד יפעול בהמשך. |

## Report

### Missing
- **S07, S08 and S09 have no narration.** Despite the archive name, all 29 recordings belong to S05 and S06. S07 (measurement), S08 (assessment questions and results) and S09 (conclusion) run with on-screen text, and each names the missing narration in the interface (manifest entries `AUDIO-S07`, `AUDIO-S08`, `AUDIO-S09`, status `missing`).
- **No separate question recording for four scenarios.** SC-COM-01, SC-REC-01, SC-AST-01 and SC-CLN-01 end their situation without the question; they reuse the generic question "איך הייתם מגיבים ליוסי?" (`AUDIO-S05-02`). The other three include their question in the situation recording.
- **Unrecorded patient lines.** In SC-REC-01 and SC-CLN-01 the narration says Yossi asks a question but does not say it. The question is shown on screen, marked in the content as proposed wording (`patientLine.proposed`).

### Duplicates
- None. No two files are byte-identical; the pairs of equal size have different content.

### Ambiguous
- None that affect the mapping. Every recording has one clear meaning, and each scenario has exactly one preferred and two non-preferred feedback recordings.
- The learner is addressed in the feminine in some role recordings ("את עוברת", "איך תפעלי?"). This is how they were recorded; review whether this suits all learners.

### Unused
- None of the 29. `AUDIO-S05-02` is used in four places.

## Media used with these scenarios

- **V03** (Yossi waiting and complaining) was blocked by a garbled burned-in subtitle. The web copy is cropped to the top 600 rows and letterboxed to 16:9, which removes the subtitle completely; it now plays in S05. A clean regeneration is still preferable.
- Consequence clips after the preferred answer: V04B (S05), V10 (SC-REC-01), V07 (SC-CLN-01). V06 plays in the SC-AST-01 situation. V04 is Yossi's farewell in S09.

