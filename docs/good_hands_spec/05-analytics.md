# אפיון אנליטיקס — Vendor-neutral

## יעדים
מעקב התחלה/השלמה, זמן פעיל, נטישה, הצלחה לפי מיומנות, בחירות בתרחישים, ניסיונות חוזרים, ביצועים לפי תפקיד וגרסת תוכן.

## סכמת אירוע משותפת
`eventName`, `eventId`, `timestamp`, `sessionId`, `anonymousLearnerId`, `courseId`, `courseVersion`, `role`, `screenId`, `scenarioId?`, `attemptId?`, `payload`, `schemaVersion`.

## אירועים
- `course_started` — התחלה ראשונה.
- `role_selected` — בחירת מסלול.
- `screen_viewed` — כניסה למסך.
- `media_started`, `media_completed` — צריכת מדיה, ללא מדידה פולשנית של כל שנייה.
- `scenario_answered` — מזהה תרחיש, מזהה אפשרות, ניסיון, מיומנות; לא טקסט חופשי של מטופלים.
- `feedback_viewed` — משוב שהוצג.
- `assessment_started`, `assessment_completed` — ציון, מעבר, זמן פעיל, מספר ניסיון.
- `course_completed` — השלמה לפי כלל עסקי מפורש.
- `course_resumed` — חזרה לסשן.
- `client_error` — תקלות טכניות ללא פרטים אישיים.

## דוגמת אירוע
```json
{
  "eventName": "scenario_answered",
  "eventId": "generated-uuid",
  "timestamp": "2026-11-11T12:00:00Z",
  "sessionId": "session-opaque",
  "anonymousLearnerId": "learner-pseudonymous",
  "courseId": "good-hands",
  "courseVersion": "0.1.0",
  "role": "reception",
  "screenId": "S05",
  "scenarioId": "SC-COM-01",
  "attemptId": "attempt-1",
  "schemaVersion": "1",
  "payload": {"answerId":"B","isPreferred":true,"responseTimeMs":8200}
}
```

## ארכיטקטורה
`track(event)` → validator → local development adapter → future adapter (PostHog / xAPI LRS / LMS). Adapter failure must not break learning. Event IDs enable deduplication. No vendor SDK in screen components.

## פרטיות ואבטחה
- לא לאסוף שמות/טלפונים/פרטי מטופלים או מידע רפואי.
- מזהה עובד ארגוני יתווסף רק לאחר החלטת IT/פרטיות ומנגנון הזדהות מורשה.
- נתונים מקומיים בדפדפן אינם דוח מנהל אמין; אינם ראיה מוסמכת להשלמה.
- לשמור נתוני תרגול רק לצורך שהוגדר; לא להפעיל session replay או הקלטת שדות ללא אישור.
- להגדיר retention, access control, region, consent/notice ו-DPA לפי מדיניות הארגון.

## דוחות עתידיים
שיעור השלמה, חציון זמן פעיל, התפלגות ציונים לפי מסלול, שאלות עם שיעור שגיאות גבוה, מעבר בניסיון ראשון, נקודות נטישה. פילוח קבוצות קטנות כפוף למדיניות פרטיות.

## החלטות פתוחות
האם יש LMS קיים? האם נדרש זיהוי אישי? האם נדרש SCORM 1.2/2004 או xAPI? האם השלמה תירשם במערכת HR? מי רואה נתוני עובדים?
