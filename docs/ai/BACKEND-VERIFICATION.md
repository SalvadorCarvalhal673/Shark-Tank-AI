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

## Focused adversarial review after initial architecture approval

The follow-up review found and corrected four reproducible defects exclusively in the new Issue #56 backend. No protected/shared implementation changed.

| ID | Severity / affected code | Reproduction and root cause | Correction / regression |
| --- | --- | --- | --- |
| F56-AR-001 | Medium, backend-coordinator.ts | An abort listener synchronously starts request C while request B supersedes A. B previously aborted A before publishing its slot, then overwrote newer C. | Publish the slot/seen ID before abort dispatch; return null if reentrant work superseded that slot. `adversarial coordinator publishes ordering before synchronous abort callbacks can reenter` fails before and passes after. |
| F56-AR-002 | Low, openai-adapter.ts | An injected exchange ignores abort and returns a response after cancellation; the post-exchange abort check threw without cancelling the unread response stream. | Cancel a late response body before throwing, without awaiting an untrusted producer. `adversarial OpenAI late headers are cancelled after caller abort even when exchange ignores signal` fails before and passes after. |
| F56-AR-003 | High confidentiality safeguard, openai-adapter.ts; external adapter remains disconnected | A synthetic vendor response echoed the configured synthetic server credential in an otherwise valid dialogue field. Structural validation accepted it and the composed backend returned the credential. No real credential or paid call was involved. | Decode the bounded inner JSON and reject an exact credential substring in any key/string before returning a packet. This also catches Unicode-escaped credential echoes. `adversarial successful provider output cannot echo the server credential, including escaped JSON` fails before and passes after. This is not general secret detection: transformed/fragmented secrets or unrelated host credentials are not guaranteed detectable. |
| F56-AR-004 | Low, bounded-body.ts / http-boundary.ts | An already-aborted read rejected before acquiring the reader but left its source uncancelled. The HTTP deadline wrapper could reject before invoking the reader at all. | Explicitly cancel unopened sources in the reader and HTTP pre-abort path; HTTP pre-abort returns499 before admission. Reader regression fails before and passes after; HTTP cancellation test confirms its source is cancelled. |

Saved red logs: `review-cancellation-red`, `review-credential-red`, `review-preabort-red`. Green evidence: `review-cancellation-green`, `review-http-green`, `review-focused`, `review-unit-final`. All logs and exit codes persist in the existing external evidence directory. One new regression initially failed TypeScript because control-flow analysis cannot track an assignment from a synchronous event callback; changing its typed holder fixed the test without relaxing any production contract.

Additional adversarial verification includes twelve overlapping providers resolved in reverse order: exactly one current response delivers, all superseded requests discard, each owned reservation settles, and late completions cannot change settled budgets. Coordinator64-session/128-request saturation rejects additional work without invalidating the current ticket; fail-closed process-lifetime exhaustion remains intentional and requires process restart, not eviction that might reopen replay. Forged/replaced journals cannot preempt legitimate pending work or change its budget snapshot. Existing positive canonical replay tests cover all four conversation purposes without state mutation.

HTTP tests use fake time for the two-second stalled-body deadline and confirm producer cancellation/lock release; empty-fragment flooding terminates at a bounded count. A throwing global-fetch sentinel confirms default, production/live-configured and explicit local-mock HTTP paths perform zero external fetches. Consent/replay/response/minimization and disabled-production tests remain intact. Provider protocol/model/pricing parameters were not changed by this review.

Final local suite: 237/237 unit tests, retaining all227 previous tests plus10 new cases; lint and TypeScript pass. Production build and audit results are retained under `review-build` and `review-audit-*`. The unchanged complete CI must verify the final published correction commit, including all100 browser scenarios. Earlier Edge100/100 evidence is retained, not misrepresented as a new rerun. No new GUI functionality is present to certify. Final CI evidence is attached to PR108 after it completes.

Activation blockers and uncertainty are unchanged: live hard-disabled, no wired external exchange, no durable access/cost authority, consent revocation/session identity integration pending, SE-001 open, public deployment prohibited. Exact-credential reflection rejection is defense in depth; it does not prove model truthfulness or comprehensive secrecy. No #57–#66 integration or other-member implementation was changed.
