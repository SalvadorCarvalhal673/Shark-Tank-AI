# Backend #56 — verification record

Date: 2026-11-21. Baseline: develop `f4cec0a99672a9f3a21a55e75342ec11951c2f27`. Node 24 / Windows desktop, installed Edge. No paid inference or founder data transmission. All provider responses are injected synthetic fixtures.

## Independent local results

- Baseline unit suite before implementation: 197/197.
- Final unit suite: 227/227 (197 retained + 30 new), no skips/cancellations. New tests cover all four dialogue purposes from canonical replay, authority immutability, forged contracts/financial commitments/sources, consent, minimization, bounded streams, adapter selection/pricing, refusal/incomplete/network/rate errors, unknown usage, timeout, stale/duplicate/overlapping requests and cancellation ownership.
- Lint: passed. TypeScript: passed. Production build: passed; dynamic `/api/investor` emitted.
- Full npm audit: zero findings. Production-only npm audit: zero findings. SE-001 remains open; these results do not clear vendored code or permit deployment.
- Unchanged Edge application suites, persisted batches: 22/22 practice/QA/intake, 23/23 negotiation/Issue #105, 43/43 persistence/recovery. Total 88/88. No retries or weakened browser assertions.
- Unchanged Edge 3D prototype: 12/12, including asset/WebGL/renderer/context failures, lifecycle, drafts, preview and session preservation. No retries.
- Built production HTTP probe: POST `/api/investor` returns 503 `{"error":"disabled"}` and no-store; GET returns 405. Separate port 3195 used so browser suite servers were not reused.
- Browser output scan: no backend URL, exception/principal or synthetic credential sentinels in `.next/static`. This is a targeted bundle check, not a universal secret detection guarantee.
- Isolated temporary Next client-import fixture: compilation rejects the actual server-only entry. The initial fixture had a quoting syntax error (apostrophe in repository path); after correcting the fixture, the compiler specifically reported `server-only`. The syntax failure is not counted as boundary evidence.
- Scope/credential review: only authorized backend/API/AI-test/fixture/docs paths; no key signatures, secret files, packages, generated assets or protected implementation changes.

Local durable evidence directory: `C:\Users\salva\AppData\Local\Temp\shark-56`. It is outside the repository and excluded from publication. Logs and exit-status files remain available through interruption. `unit-final`, `typecheck-final2`, `lint-final2`, `build-third`, `audit-full`, `audit-production`, `browser-edge-a/b/c`, `prototype-edge`, `production-route` and `client-boundary-second` identify the relevant records. Browser output contains test names only; fixtures are synthetic.

## Failing-before / passing-after evidence and initial failures

- `checkpoint-red`: same-session initial pitch/journal replacement was accepted by the first new coordinator; canonical fingerprints and journal-prefix checks now discard it (`backend-green2`, final suite).
- `order-red`: semantically identical action property order was initially rejected by that fingerprint check; existing `canonicalAction` now normalizes it (`backend-combined`, final suite).
- `stream-red`: malformed byte-stream producer was not cancelled; bounded reader now cancels on failure/releases locks and uses fixed-size accumulation (`stream-green`, final suite).
- Initial TypeScript/build failures were synthetic fixtures attempting readonly assignments, then clone annotations retaining readonly nested arrays. Explicit mutable clone types corrected those fixture errors; final type/build gates pass. No protected contract was relaxed.
- Initial full unit run rejected any AI route under the old Phase 4C isolation assertion. Updated that single AI test to allow exactly the newly authorized guarded route, retain all protected-application import checks, and forbid direct transport/credential wiring there.
- The added all-purpose replay harness initially supplied repeated unlabeled answers and incorrectly expected an opening offer; distinct valid labeled business fixtures now exercise the actual rules. The consent harness initially expected fallback for wrong-session consent; the existing request schema correctly rejects that request. Assertions now distinguish request rejection from provider-mismatch fallback. Neither required changing the production engine/schema.

## CI and review gate

The feature PR targets develop and must run the unchanged complete Checks workflow against its final commit: clean npm installation, lint, unit, build, typecheck, both audits, all 88 application scenarios and all 12 software-WebGL prototype scenarios. Consult the PR Checks/run URL for final measured status; this local record does not pre-assert a future CI result. No merge or Issue #56 closure is authorized in this batch.

Local Edge and CI Chromium do not certify physical mobile performance, WebKit, spoken screen-reader behavior or live model quality/latency/billing. Chrome/Firefox/WebKit were not rerun for this backend-only change. Gameplay/3D/scorecard integration, durable server authentication/budgets and actual provider transport activation remain unverified and prohibited pending approval. See BACKEND.md for exact contracts and blockers.
