# Shark Tank AI

Pitch to three fictional investors, defend your business assumptions, and negotiate a simulated deal.

## Run locally

Use Node.js 24 and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Choose **Enter the pitch room**, submit a startup pitch and funding ask, then start scripted practice. Answer one question per investor. If an investor offers a deal, you can counter once, accept an active offer, or walk away. Every completed session ends with a debrief.

Scripted practice uses transparent rules for answer detail and offer decisions. Sessions run in memory and reset on refresh. The practice flow needs no account or API key.

## Verify

```sh
npm run lint
npm test
npm run build
npm run typecheck
npx playwright install chromium
npm run test:e2e
```

The production build runs before the browser tests because they launch the production server. Set `PLAYWRIGHT_CHANNEL=msedge` to test with an installed Edge browser.

Pages live in `src/app`, shared UI in `src/components`, and pitch validation, investor profiles, negotiation rules, and the practice interface in `src/features/simulation`. Amounts use integer minor units and equity uses basis points.

## Domain validation contracts

Investment amounts are positive safe integers from 1 through 99,999,999,999 minor units.
Equity is an integer from 1 through 10,000 basis points.

- readPitch returns a validated Pitch or a user-facing validation string. Plain decimal input accepts leading decimals and leading zeros. Exponent notation and more than two fractional digits receive specific validation messages.
- startPractice accepts runtime input and returns Practice or null. Invalid initialization returns null. PitchForm handles null with an alert and keeps the pitch available for editing.
- postMoneyValue accepts runtime input and returns rounded minor units or null. Invalid terms return null. OfferTerms handles null with an alert, without displaying an invalid valuation.
- answerQuestion requires the displayed question index. Duplicate, stale, future, malformed or out-of-stage submissions return the unchanged session.
- counterOffer and finishPractice return the unchanged session for rejected actions. Counter terms, offers and counter-history records copy only declared fields.

Valuation remains investment divided by equity fraction, rounded to the nearest minor unit. Tests compare supported boundary values with an independent BigInt arithmetic oracle.
Local font files and their SIL Open Font License notices are in src/app/fonts.
