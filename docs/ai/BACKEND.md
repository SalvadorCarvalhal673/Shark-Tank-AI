# Issue #56 — isolated backend foundation

## Scope and activation status

Built from develop `f4cec0a99672a9f3a21a55e75342ec11951c2f27` on `feature/f1-implement-the-approved-server-side-ai-integration`. This contribution adds a server boundary and injected provider pipeline, not gameplay integration or a publicly usable paid service. Issue #56 must remain open until reviewed integration. Issues #57–#66 are not completed here.

`LIVE_INFERENCE_ENABLED` is a literal false. Production always returns disabled. Development/test defaults disabled; explicitly setting `SHARK_AI_BACKEND_MODE=mock` or `scripted` permits local synthetic operation. `SHARK_AI_MODE=live`, any `SHARK_AI_LIVE_ENABLED` value, invalid configuration or public credential names disables this boundary. Environment variables cannot activate paid transport. No SDK, dependency, key, account, external transmission or paid inference was used. SE-001 remains open; public deployment is prohibited.

## Request path and authority

`src/app/api/investor/route.ts` → server-only `entry.ts` → `http-boundary.ts` → `backend-service.ts` → existing request validation/canonical replay, privacy, prompts, budget, provider and response validation. Existing Phase 4C modules and all financial/persistence/UI implementation remain unchanged.

The POST body is the existing exact `BrowserRequest` contract, version 1/rules 1: binding, initial pitch, committed action journal, bounded recent history and explicit consent or null. Unknown properties, duplicate JSON keys, invalid versions, invalid action replay and mismatched stage/revision/investor/purpose are rejected. Financial context is rebuilt by the existing engine; supplied offers/valuations are never accepted. AI returns only a validated `AppResponse`, never arbitrary vendor objects, financial actions or updated game state.

Canonical replay checks consistency, not real-world truth or proof of an authenticated saved session. The initial pitch is founder-reported. A new unauthenticated session ID can describe a different valid fictional episode. Server-controlled authentication and trusted session association remain prerequisites for paid activation.

`BackendCoordinator` retains bounded process-local hashes of canonical initial pitch/actions, bindings and request IDs, not persisted transcripts. It rejects changed/truncated/divergent journals within an observed session, stale revisions/epochs and repeated request IDs. Semantically identical JSON action property orders are normalized with the existing canonical action function. Replacement aborts only its predecessor; ticket identity checks prevent obsolete completion from changing the replacement. Trusted future integration can call `coordinator.cancel(principal, sessionId)` on recovery/restart/revocation. The browser cannot call that hook. Presentation changes must invalidate the client lifecycle/epoch; the backend cannot infer an unreported UI change.

## Provider port and configuration

`BackendProvider` selects an explicit name/model and returns a bounded packet plus optional usage. `selectBackendProvider` requires exactly one matching adapter; no automatic provider switch or consent transfer occurs. The original mock-only provider interface is preserved. New orchestration wraps it without changing existing callers. Budget model and adapter model must agree.

`OpenAIResponseAdapter` implements the reviewed Responses wire format for `gpt-6.2-sol`. It has no default fetch transport. A `ProviderExchange` must be injected; all tests inject synthetic responses. The API route never constructs or wires this external adapter. Existing `loadConfiguration`/`ServerCredential` keep server environment values out of serialization; the adapter reveals the credential only to the explicitly injected exchange. This trusted extension point must never be supplied by browser data.

Request encoding: fixed OpenAI Responses URL, instructions plus minimized JSON data, structured `text.format` JSON schema, output token cap, `store:false`, `stream:false`, and no tools. No invented reasoning parameter, retry or vendor failover. Responses are byte-bounded, UTF-8/duplicate-key checked, model/status checked; tool output is rejected, refusal/incomplete results fall back. Missing or invalid usage retains the conservative reservation. Alternative vendors can implement the same port; no Anthropic or Google wire adapter is claimed in this contribution.

Official documentation checked 2026-11-21 before adopting model/parameters:

- [OpenAI model](https://developers.openai.com/api/docs/models/gpt-6.2-sol.md).
- [Responses create](https://developers.openai.com/api/reference/resources/responses/methods/create).
- [Structured output guide](https://developers.openai.com/api/docs/guides/structured-outputs.md).

Existing reviewed short-context rates are reused, not replaced. Availability, pricing, retention and parameters require another review before actual activation.

## HTTP contract

Next Node runtime, dynamic route, POST only. All application replies use `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`.

| Status | Meaning |
| --- | --- |
| 200 | Validated mock or honest scripted `AppResponse` |
| 400 | Malformed contract/body/encoding/UTF-8 |
| 403 | Supplied Origin differs from endpoint origin |
| 405 | Unsupported method (Next handles unexported methods) |
| 408 | Body deadline exceeded |
| 409 | Duplicate/stale/cancelled backend result; no dialogue delivered |
| 413 | Request exceeds 131072 UTF-8 bytes |
| 415 | Content type is not application/json |
| 429 | Process-local admission bound exhausted |
| 499 | Request signal aborted |
| 503 | Disabled or safe internal failure |

No raw input, prompt, stack or provider error escapes in error bodies. Compressed request bodies are rejected. The stream is bounded before decoding and parsed within a two-second deadline; vendor bodies are capped at 65536 bytes and final structured output at the existing 16384-byte limit. Fragment count is bounded; malformed/overflow/aborted streams are cancelled and reader locks released. Origin checking is defense in depth, not authentication; no-Origin local tools are permitted in offline mode.

The local endpoint deliberately uses one server-selected `development-offline` principal. Client headers/IDs are not authentication. Admission stops after 256 body attempts per route instance; coordinator retains at most 64 sessions/128 request IDs. These are fail-closed process-lifetime limits; restarting the process resets them. They are not a public access-control system.

## Privacy, cost and failure behavior

For named external adapters, consent must match provider/session/version/scope before any exchange. Session-mismatched consent is rejected as an invalid request by the existing schema; provider-mismatched consent yields scripted no-consent. Local saving is unrelated. Minimized/redacted copies are used; source validation checks the actually transmitted redacted sources, not withheld originals. Original founder testimony is unchanged. No new transcript storage or schema migration is added.

Existing token/request/episode/principal/concurrency/deadline and cost reservation limits apply. Input reservation conservatively uses UTF-8 bytes of system/data/schema plus framing allowance, subject to the existing input cap; it is not a measured tokenizer. Unknown usage, cancellation, refusal or failure charges the reservation. Valid bounded usage settles conservatively once. Cancellation releases only the owned lease so a replacement can proceed. A provider ignoring cancellation can continue operating remotely despite local discard: neither provider-side termination nor billing guarantees are claimed.

Timeout/refusal/malformed output/network/rate-limit/budget/missing consent produce safe labeled scripted continuation while current; obsolete operations are discarded. Responses are nonbinding and cannot dispatch financial actions. Structural and heuristic semantic validation cannot guarantee truthfulness or catch every linguistic prompt injection. Redaction is best effort, not a general personal-data detector. `store:false` does not promise zero provider retention.

## Activation blockers — do not bypass

1. Reviewed server-side access control and trusted principal/session ownership.
2. Durable distributed request deduplication, rate/cost reservations and cancellation accounting across instances/restarts; organizational/provider billing ceilings.
3. Explicit reviewed activation design, approved account/model/transport and fresh provider pricing/retention/security review. No default external transport exists now.
4. SE-001 review and separate explicit deployment authorization. Zero npm findings do not close a vendored-code exception.
5. Approved consent/revocation integration and lifecycle ownership with the other workstreams. No client wiring is authorized here.

## Future workstream handover (not implemented)

- Member 2: consume trusted dialogue/presentation events via an approved adapter; rendering/animation must never change terms, accept deals or trigger paid calls implicitly. Preserve HTML fallback and draft/controller ownership.
- Member 3: future approved caller owns request ID, existing lifecycle epoch, AbortSignal and committed canonical journal. Validate response binding before presentation; abort/invalidate on restart, recovery, investor or presentation change. Never send draft terms as committed state. Consent is explicit, separate from save opt-in; discard obsolete fallback. A trusted host must supply server principal; browser IDs cannot do so.
- Member 4: consume nonbinding observations/narration separately from engine-owned outcome, valuation, dilution and scorecard facts. Do not persist AI transcript or display qualitative claims as independently verified facts.

No shared controller, UI adapter, finance/persistence change or additional answer/counter round is included. Existing scripted practice is independent of this endpoint.

## Acceptance assessment and manifest

Issue #56's isolated backend/adapter/runtime validation/mock verification deliverables are implemented. Live inference, durable access/cost enforcement and cross-workstream UI remain intentionally blocked. Completion/integration requires independent approval; no closure is requested.

New source:

- `src/app/api/investor/route.ts`
- `src/features/ai/server/backend-provider.ts`
- `src/features/ai/server/backend-configuration.ts`
- `src/features/ai/server/backend-coordinator.ts`
- `src/features/ai/server/backend-service.ts`
- `src/features/ai/server/bounded-body.ts`
- `src/features/ai/server/openai-adapter.ts`
- `src/features/ai/server/http-boundary.ts`
- `src/features/ai/server/entry.ts`

New tests/fixture: `tests/ai-backend.test.ts`, `tests/ai-http-boundary.test.ts`, `tests/ai-openai-adapter.test.ts`, `tests/fixtures/ai/backend-adversarial.json`.
Modified test: `tests/ai-evaluation.test.ts` retains the protected-application no-AI-import assertion, permits exactly the authorized server route, and checks its guarded entry/no direct transport. All original 197 cases remain; no tests are skipped/deleted. Existing browser tests are untouched.
Documentation: this file and `docs/ai/BACKEND-VERIFICATION.md`. No package/lock/config/style/asset/financial/persistence/gameplay/3D/scorecard file changes.

## Adversarial-review corrections

Follow-up review retains the same16-file cumulative manifest. Four defects were reproduced and corrected: reentrant coordinator ordering, cancellation of late provider bodies, unopened pre-aborted stream cleanup, and a synthetic successful-response credential reflection. The adapter now decodes inner JSON and rejects exact configured-credential substrings before returning provider content, including Unicode escapes. This is defense in depth, not comprehensive secret detection or a live-service approval.

The coordinator publishes identity before synchronous abort events and refuses to return a superseded ticket. Request/resource capacity still fails closed for the process lifetime; no TTL/eviction/authentication infrastructure was introduced. See BACKEND-VERIFICATION.md for red/green evidence, severity,237-test coverage and unchanged activation blockers. No shared financial/persistence/UI contract or provider protocol parameter changed.
