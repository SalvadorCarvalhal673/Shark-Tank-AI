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
