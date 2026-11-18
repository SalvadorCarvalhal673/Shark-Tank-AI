# Shark Tank AI

Pitch to three fictional investors, defend your business assumptions, and negotiate a simulated deal.

## Run locally

Use Node.js 24 and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Choose **Enter the pitch room**, submit a startup pitch and funding ask, then start scripted practice. Answer one question per investor. If investors offer deals, compare their terms, use up to three shared counters, and explicitly confirm one active offer or walk away. Every completed session ends with a debrief.

Scripted practice uses transparent rules for answer detail and offer decisions. Sessions run in memory by default. In pitch preview, explicitly enable **Save this session in this browser** to restore saved progress after refresh. The practice flow needs no account or API key.

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

The legacy practice engine remains internally for regression tests. The active interface uses the new engine. Session IDs and revisions bind actions and pending controls to the terms that were displayed. A single shared controller owns the immutable session and accepted-action journal. The storage adapter validates and replays this journal through the approved engine; financial and investor rules remain unchanged. API keys are not used.
## Local saving and recovery

Saving is opt-in for each new run. Pitch descriptions and answers stay in this browser profile, unencrypted by the application; other profile users and scripts on the same origin may access them. The app sends no founder information externally. Private browsing, browser cleanup or profile removal can erase saved data. Memory-only practice never starts saving automatically.

On return, choose **Resume saved session**, **Start a new session**, or **Remove saved information**. Completed sessions restore the debrief. Starting a new pitch preserves the existing save until **Start practice** and explicit replacement confirmation. Cancelling replacement returns to preview. **Practice again** preserves the completed save. Removal requires confirmation, cancels queued writes, and keeps the current run usable in memory. Remove only this app's key; if coordinated removal fails, use the browser's site-data settings.

The single localStorage key is `shark-tank-ai.session`. Schema 1 / rules 1 stores exactly `schemaVersion`, `rulesVersion`, `sessionId`, the original validated `pitch`, ordered accepted `actions`, `saveId`, `generation`, `writerId`, and `savedAt` (epoch milliseconds). It never stores derived offers, valuations, outcomes, cap tables, or UI state. Generation is a positive safe integer increasing within one save ID; replacement uses fresh save/session IDs and generation 1. Equal-journal saves preserve generation and timestamp. Overflow stops saving.

The adapter checks the 65,536 UTF-16 code-unit limit before JSON parsing, exact root/nested keys, identifier/financial/text bounds, valid timestamp range, and supported versions. Rules 1 allows at most seven actions: three answers + three shared counters + one explicit acceptance/walk-away. Some terminal outcomes need fewer actions. Every action must replay successfully with the session ID, expected revision and stage, advancing revision once. One invalid action rejects the entire record. Corrupted, oversized and unsupported saves are retained until explicit removal or replacement; migration is not automatic. Rules changes affecting replay require a version change and a separately approved migration policy.

Each tab serializes writes. Every write/removal acquires the exclusive Web Lock `shark-tank-ai.session.write`, re-reads and compares the complete observed raw record, checks identity/generation and cancellation, then mutates only that slot. Append-only writes cannot roll back or diverge from an existing journal. Storage events (including origin-wide clearing) trigger fresh reads. A conflict stops saving and preserves memory; **Load saved progress** requires confirmation before replacing divergent progress, or choose **Continue without saving**. Replacement/removal confirmation is bound to the exact record observed when opened.

Web Locks coordinate cooperating contexts; they do not protect against malicious same-origin scripts or browser tools. Missing, rejected or long-held locks (three-second acquisition timeout), blocked storage and quota errors use memory-only fallback. **Retry saving** checks the slot again under the lock. There is no unlocked fallback or background retry loop. “Saved” acknowledges only the latest in-memory revision; closing before that acknowledgement may lose pending actions. Reload uses the last complete saved checkpoint, without opening transient counterforms or confirmations.

Persistence code is in `session-storage.ts`, `use-saved-session.ts`, and `recovery-panel.tsx` under `src/features/simulation/negotiation`. Storage/replay tests are in `tests/session-storage.test.ts`; real-tab recovery/failure/concurrency tests are in `tests/session-recovery-browser.spec.ts`. Existing regression tests are preserved. Test installed Chrome with `PLAYWRIGHT_CHANNEL=chrome`; Firefox with `npm run test:e2e -- --browser=firefox` after `npx playwright install firefox` (unset `PLAYWRIGHT_CHANNEL` first).

The unresolved dependency exception and deployment restriction remain documented in [docs/security-exceptions.md](docs/security-exceptions.md). Run both `npm audit` and `npm audit --omit=dev`; a clean production-only audit does not establish that vendored framework code is unaffected.
