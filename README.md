# Shark Tank AI

Pitch to three fictional investors, defend your business assumptions, and negotiate a simulated deal.

## Run locally

Use Node.js 24 and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Choose **Enter the pitch room**, submit a startup pitch and funding ask, then start scripted practice. Answer one question per investor. If investors offer deals, compare their terms, use up to three shared counters, and explicitly confirm one active offer or walk away. Every completed session ends with a debrief.

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
- The legacy startPractice accepts runtime input and returns Practice or null. The active interface uses startNegotiation, which returns NegotiationSession or null. PitchForm handles invalid initialization with an alert and keeps the pitch available for editing.
- The legacy postMoneyValue returns rounded minor units or null. The active interface uses valuations and ownershipAfterInvestment from the versioned financial module. Invalid terms produce an unavailable state and prevent offer confirmation.
- The legacy answerQuestion requires the displayed question index. The active interface dispatches founder actions with a session ID, expected revision and question turn. Duplicate, stale, future, malformed or out-of-stage actions return the unchanged session.
- counterOffer and finishPractice return the unchanged session for rejected actions. Counter terms, offers and counter-history records copy only declared fields.

Valuation remains investment divided by equity fraction, rounded to the nearest minor unit. Tests compare supported boundary values with an independent BigInt arithmetic oracle.
Local font files and their SIL Open Font License notices are in src/app/fonts.

## Negotiation interface

The simulator uses the version 1 deterministic negotiation engine. Questions identify written signals using a transparent rubric. They do not independently verify claims. Investor profiles and limits are fictional simulation assumptions.

Founder ownership is optional and defaults to 100% for a genuinely blank field. It accepts zero and uses basis points. Pitch previews show the ask's implied valuations. The negotiation screen shows concurrent offers, three shared counters, a chronological history and inline confirmation of one deal. Every valid counter uses a round, including unchanged terms or withdrawal. Investor agreement requires founder confirmation.

The financial module provides valuation and dilution figures. The debrief separates pitch signals, investor decisions, negotiation actions and financial consequences. Ownership reflects a primary equity investment, with half-up rounding and residual ownership assigned to other existing holders.

The legacy practice engine remains internally for regression tests. The active interface uses the new engine. Session IDs and revisions bind actions and pending controls to the terms that were displayed. Sessions stay in memory and reset on refresh. Local browser storage and API keys are not used.