# Cyclone Preparedness BD — Test Results (run #220, 2026-11-03)

## Unit tests — 25/25 passed (`node tests/unit.test.js`)

- Bengali digits: 2026 -> ২০২৬, 999 -> ৯৯৯; en mode keeps Latin digits.
- Signals: 7 levels; V–VII, VIII–X, XI lookups exact; unknown id -> null.
- Checklist math: 3/10 = 30%, 7/7 = 100%, 0 total = 0; overall 22/34 = 65%.
- Phone validation: empty (optional) ok; 01712345678 and +8801712345678 ok;
  too short / letters / too long rejected.
- Plan validation: missing meeting point flagged; bad phone flagged; valid plan clean.
- Quiz scoring: 2/3 and 0/3 exact.

## Headless-Chrome smoke tests — 18/18 passed (`node tests/smoke.mjs`)

Raw CDP against stock Playwright headless_shell-1187, `file://` page, 0 console/page errors.

- Title, 7 signal cards, signal action box render.
- Picker VIII–X shows the Great Danger action card.
- Checklists tab: 4 sections, 34 items (10+7+7+10); ticking 1 item -> overall 3%;
  tick persists after reload.
- Family plan: empty meeting point blocked with error; valid plan (School field,
  01712345678) saves; meeting point persists after reload.
- Quiz: Myth/Fact buttons render; answering via the EN data set is accepted with
  feedback; Next advances to question 2.
- Language toggle: EN title -> Bengali title (ঘূর্ণিঝড় renders); toggle back works.
- 390 px viewport: scrollWidth <= 391 (no horizontal overflow).

## Repairs

0 app-logic bugs. The HTML language button was converted to numeric character
references so all shipped sources are pure ASCII (Bengali as \uXXXX in JS).

## Content honesty notes

- Signal levels follow the BMD maritime-port scale (I Distant Cautionary,
  II Distant Warning, III Local Cautionary, IV Local Warning, V–VII Danger,
  VIII–X Great Danger, XI Failure of Communication). River-port signals differ —
  stated in the README.
- The app issues no warnings and fetches no live data; the footer and the
  signals intro say so explicitly.
- "30 cm of water can sweep a car away" in the quiz is the widely published
  flood-safety rule of thumb, presented as general guidance, not a measured claim.
