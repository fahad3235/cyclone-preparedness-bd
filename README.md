# Cyclone Preparedness BD

An offline, bilingual (English / বাংলা) cyclone preparedness app for Bangladesh.
It helps a family get ready **before** a cyclone: understand the warning signals,
work through practical checklists, agree a family emergency plan, and test common
beliefs with a short myth-or-fact quiz.

Live site: https://fahad3235.github.io/cyclone-preparedness-bd/

## Features

1. **Warning-signal guide** — all 7 BMD maritime-port signal levels (I, II, III,
   IV, V–VII, VIII–X, XI) with plain-language meanings and actions.
2. **Signal action finder** — pick the signal hoisted right now and see exactly
   what it means and what to do.
3. **Preparedness checklists** — Before (10 items), During (7), After (7) and
   Go-bag essentials (10), with per-list and overall readiness progress, saved
   in localStorage.
4. **Family emergency plan** — meeting point, nearest shelter, two emergency
   contacts and notes, with phone validation; stored only on the device, with a
   print-friendly view.
5. **Myth-or-Fact quiz** — 6 questions with explanations after every answer and
   a persisted best score.
6. **Bilingual UI** — English / বাংলা toggle persisted across visits, with
   Bengali digits in Bangla mode; fully responsive down to 390 px; zero network
   requests (works offline once loaded).

## Stack

Vanilla HTML, CSS and JavaScript — no build step, no dependencies, no backend.
Data and strings live in `js/i18n.js`; pure logic in `js/logic.js` (UMD, shared
by the browser app and the node unit tests).

## Run locally

Open `index.html` in any modern browser, or serve the folder:

```sh
npx serve .
# or
python3 -m http.server 8000
```

## Testing

```sh
node tests/unit.test.js   # 25 logic checks
node tests/smoke.mjs      # 18 headless-Chrome checks (stock Playwright headless_shell)
```

The smoke test uses raw Chrome DevTools Protocol against the Playwright
`headless_shell` binary; it needs no npm install.

## Source encoding note

All app sources are pure ASCII: Bengali text is stored as `\uXXXX` escapes in
`js/i18n.js` and `js/app.js`, and as numeric character references in
`index.html`. This keeps GitHub push payloads byte-safe (see the factory's
2026-10-11 run #25 lesson). Rendered output in the browser is normal Bengali.

## Limitations — read before relying on this app

- **This app does NOT issue cyclone warnings.** It explains the signal system
  only. For live warnings, always follow Bangladesh Meteorological Department
  (BMD) bulletins, radio/TV announcements and your local administration.
- Signal descriptions cover **maritime ports**; river-port signals differ.
- Checklist and quiz content is general preparedness guidance, not official
  instructions and not a substitute for local authority advice.
- The family plan is stored only in this browser's localStorage. If you clear
  site data, it is gone — keep a printed copy.
- In an emergency, call **999**.

## Status

MVP complete. See `TEST_RESULTS.md` for the verified test results.
