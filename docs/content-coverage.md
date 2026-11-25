# Content coverage

All learner-facing content is DRAFT until Maccabident approves it. This report separates what comes from supplied or source material from what was written for the build ("proposed"), and lists the gaps that remain.

**Scope (24.11):** the service concept and behaviours only; S07 "איך אנחנו לומדים ומשתפרים" is removed (see `archive/README.md`).

**Sources:** `docs/good_hands_spec/` (01 content master from the Maccabident deck, 02 learning design, 03 scenario bank) and the supplied narration and video, which are treated as the source of truth for wording.

## By screen

| Screen | Learning objective (02) | Narration | Supplied / source content | Proposed content |
|---|---|---|---|---|
| S00 Opening | — | Supplied | Narration; V01 arrival video | Kinetic on-screen lines (condensed from the narration) |
| S01 Role | — | Supplied | Narration; three roles (01) | — |
| S02 Two experiences | Identify how service behaviour changes the experience | Supplied | Narration; V02A and V02B; question wording (stakeholder brief) | Written feedback for each answer |
| S03 Values | 1. Identify the three values and link behaviours to them | Supplied | Narration; values and sub-values (01, p. 8); exercise items (stakeholder brief) | Written feedback for each item |
| S04 Journey | 2. Order and identify the five touchpoints | Supplied (station 3 says "השישית"; station 5 lacks the survey sentence; re-record both) | Narration; touchpoints and behaviours (01, pp. 9–15) | Short key points condensed from the narration |
| S05 Shared scenario | 3. Choose a fitting response, with empathy, initiative and expectation setting | **Supplied** (situation, question, three feedbacks) | Scenario SC-COM-01 (03); answer-specific feedback narration; V03 (cropped), V04B | — (answer wording is from the 03 scenario bank) |
| S06 Role scenarios | 3 and 4 (handover, explanation, follow-up) | **Supplied** for all six cases | Scenarios SC-REC-01/02, SC-AST-01/02, SC-CLN-01/02 (03); feedback narration; V06, V07, V10 | Answer wording where 03 gives only an outline, worded to match each feedback recording; Yossi's question in SC-REC-01 and SC-CLN-01 |
| S08 Assessment | All objectives, new situations | **Not supplied** (questions and results) | Structure: 5 decisions, 2 shared + 3 role, 20 points each, pass at 80 (02, a development target) | **All 11 questions** (2 shared + 3 per role), each grounded in a behaviour from 01 with its source pages, and marked `proposed: true` |
| S09 Conclusion | — | **Not supplied** | Three values (01); V04 farewell video | On-screen wording of the closing sequence |

## Coverage required by 03 (per role)

| Requirement (03) | Reception | Assistants | Clinicians |
|---|---|---|---|
| Receiving / opening | S04; S08 Q-S08-04 | S04; S08 Q-S08-06 | S04; S08 Q-S08-10 |
| Empathy or personal adaptation | S05 | S05, SC-AST-01, Q-S08-07 | S05, SC-CLN-01 |
| Closing the loop | SC-REC-01, Q-S08-05 | S04 | SC-CLN-02 |
| Follow-up / continuity | SC-REC-02 | Q-S08-08 | S04 (station 5) |
| Privacy or expectation setting | SC-REC-02, Q-S08-01, Q-S08-03 | Q-S08-01, SC-AST-02 | Q-S08-01, Q-S08-11 |

Every role covers all five requirements, partly through the shared core, as 03 allows.

## Gaps

1. **Narration for S08 and S09** has not been supplied. Those screens work with on-screen text and say that the narration is missing.
1. **Objective 5 (measurement) is out of scope.** At the client's request (24.11) the section on how service is measured was removed; the survey is mentioned once, in journey station 5. S07 is kept in `archive/`.
2. **Assessment questions need SME approval.** The 11 questions were written for the build; the 02 learning design and the 03 scenario bank require approval before use. A larger pool would allow different questions on a retry; today a retry reorders the same questions and their answers.
3. **Pass rule.** 80/100, unlimited attempts and no partial credit are development targets, not a Maccabident decision. Whether a missed critical question (privacy) should block a pass needs a professional decision; today it is highlighted in the review only.
4. **Answer wording in S06** where 03 gives only an outline, and Yossi's unrecorded questions, are proposed wording.
5. **Hygienists** share the clinician track; whether they need their own scenarios is open (07).
6. **Captions** are hand-corrected machine transcription, pending comparison with the approved scripts.
7. **Completion certificate and LMS reporting** are not implemented; the LMS adapter is a seam with a no-op default.
