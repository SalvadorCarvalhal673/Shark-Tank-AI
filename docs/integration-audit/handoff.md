# Contributor handoff and Phase 4D readiness

Initial baseline: `fd2e98e0c22565142cc635fb1fa3d022d32580bb`; refreshed baseline: `f0c1ebb4b3542e656d0e7bb311ca16f35fed773e`. Member4 PRs112–120 landed during the baseline run. Their delivered outcome, signal-count scorecard, explanations, expandable history and replay features were inspected; only the audit branch was synchronized with develop. They are not missing features and were not reimplemented. This is a bounded integration review, not permission to implement any remaining issue. See matrix.md for every one of the49 requested issues, owners, prerequisites and current status. No contributor-owned source or existing tests are modified.

## Existing boundaries and required agreements

| Boundary | Actual available interface | Agreement required before integration |
| --- | --- | --- |
| Gameplay → studio (#19,#21,#24,#29,#30) | Readonly NegotiationSession; history entries have revision/kind/investor/reason and offer IDs. studio/model.ts:17 projects only Listening/Offering/Withdrawal plus a key. StudioSceneProps in scene.tsx:16 accepts selected/view/session and onSelect/onFailure/onMetrics. | M3 owns active question/selected investor and explicit actions; M2 owns choreography. Selected investor is not necessarily the active speaker. No existing automatic speaker bus is claimed. |
| AI → presentation (#57–#59,#63–#65) | contracts.ts Binding and PresentationEvent; lifecycle.ts RequestLifecycle; validated AppResponse; epoch/revision/request/investor/session binding. | M1/M3 must capture an immutable binding per request, not recompute an obsolete operation's epoch. Cancel on view/recovery/restart/investor changes. M2 consumes presentation cues only after current response validation. |
| Engine → outcomes (#31–#41) | session.outcome, accepted offer ID/status, ordered history, existing valuations/ownershipPresentation and read-only debrief/history views. | M4 now delivers the factual signal-count rubric/outcome UX; M3 owns confirmation. Accepted terms come only from the exact engine offer. Draft previews and concessions never imply founder acceptance. |
| Persistence → all views | SessionRun, canonicalAction/advanceRun/decodeSave, schema1/rules1, maximum7 actions; same STORAGE_KEY/LOCK. | Keep presentation/AI drafts transient; restoring a record reconstructs authority, not new player commands. Same-origin storage is not authenticated business evidence. No transcript/schema migration authorized. |
| Optional clarification (#60) | Isolated clarify/confirmEvidence modules; no extra FounderAction and no persisted clarification schema. | M1/M3/M4 must agree confirmation, budget, consent and recovery semantics. Existing canonical three answers/three counters/one terminal action cannot silently grow. |
| Financial narration (#61,#38) | Engine financialFacts available after canonical replay; current AI validator/prompt forbids currency/numerals/commitments in generated dialogue. | Prefer exact engine-rendered values adjacent to qualitative narration. If product requires numbers inside AI prose, obtain an explicit reviewed contract/validator decision; do not relax guards in this audit. |
| Coaching (#62,#37–#41) | Existing factual detected/missing signals and decision history, explicitly unverified. | Agree how to reuse M4's delivered factual signal-count rubric before personalized AI coaching. No invented quality score, psychology or verified-traction claims. |

Engine history is not a generic action queue. Three opening events can share revision3: a future stable event identity needs at least sessionId + history ordinal (and the relevant revision/kind/investor/offer identifiers), not revision alone. These proposed fields are design requirements, not an installed event bus. Keep client request IDs within the existing schema; do not reuse colon-separated offer IDs as AI request IDs.

## Member 2 — renderer/choreography handoff

Issues #19,#21,#24,#29,#30 need M3 triggers plus M2 camera/gesture ownership. The current scene accepts state, while Avatar selection only calls onSelect; no financial dispatch callback exists on StudioSceneProps. Keep it that way. Opening pass and counter withdrawal may share a generic clip, but decision-specific copy must read the history kind/reason. The same applies to revised versus unchanged offers: Offering is a pose, not proof of a concession. That ambiguity is a future semantic contract to agree, not a confirmed visual defect.

Use the existing cameraStep reduced-motion cut and frozen nonessential gestures. On failure, remove presentation only; preserve the controller, answers, amount/equity drafts, journal, saving choice and explicit financial action path. No acceptance/withdrawal/round consumption from camera completion, scene mounting, clipping or offer reveal.

For #67–#71,#75–#76: current room resources have explicit disposal hooks and independent geometry/rig tests. Existing new-room browser assertions pass in Edge/software-rendering configuration; this does not certify prolonged GPU memory, battery/thermal behavior or physical mobile performance. Retain THREE.Clock and unavailable-extension warnings for owner/dependency review, not a speculative renderer rewrite.

## Member 3 — gameplay handoff

Issues #19,#21,#24,#31–#32,#57–#61,#63–#65 require stable meaning for current speaker versus selection, draft versus committed terms, pending confirmation, response status and recovery transitions. The production practice and development-only prototype remain separate routes; this audit does not unify them. The prototype's missing terminal acceptance/outcome controls are intentional incomplete prototype scope, not a new engine defect.

Always project plain `{amount,equity}` into counter terms: an entire offer object includes identity/status fields and is rejected by canonicalAction. Pending acceptance must remain tied to session/revision/offer ID; any intervening valid action invalidates it. New browser tests seed canonical studio-scenario saves into practice, verify confirmation alone does not append, confirm the exact selected offer once and restore the resulting debrief. They test the existing shared save contract, not an implemented scene-to-production route bridge.

On AI fallback, keep explicit provenance. Do not label scripted prompts as live AI or display fabricated processing delays. Backend failure/cancellation must not erase the gameplay drafts or change the canonical journal. The backend does not infer local UI changes: the future client must invalidate/abort the bound operation.

## Member 4 — outcomes/QA handoff

For #33–#41, Member4 PRs112–120 now deliver accepted-deal animation with reduced-motion handling, all-withdrawn/walk-away/no-offers explanations, native-disclosure signal-count scorecard, dilution glossary, policy-grounded analysis, expandable historical counters and optional replay challenges. These were read in full and remain untouched. PerformanceScorecard, DecisionAnalysis and WithdrawalConclusion take the existing readonly session; ReplayChallenge adds only an onStart callback wired to the existing parent exit/restart path. Final acceptance/physical/assistive-technology review is still distinct from source delivery. The existing debrief/history never calls the reducer. Any future historical selection must inspect only, not dispatch old FounderActions. New tests cover exact accepted ID, primary-issuance cap table, monetary reconciliation, point versus relative dilution and stale confirmation after replay.

Agree the existing factual rubric as the input contract for future #62 AI coaching; #41's non-AI challenge implementation is already delivered. A deal is not evidence that an idea is good; pattern matches are founder-reported, not independently verified facts. Replay challenges require a fresh session ID and deliberate saving choices.

For #72–#78,#80–#90, current keyboard/responsive/reduced-motion/fallback assertions are evidence only for their exact automated scenarios. Physical Android/iPhone, actual Safari, spoken screen-reader sessions, consented novice studies and final demonstration rehearsal are not performed here. Cached bundled Chromium/Firefox/WebKit failed local direct-launch probes before page execution; preserved logs distinguish that capability failure from application regressions. CI Chromium remains a separate fresh-run gate. No application code was changed to obtain a green browser result.

## Phase 4D readiness after independent approval

| Issue | Safe next work in M1 after separate approval | Required teammate or security decision |
| --- | --- | --- |
| #57 | Bounded question fixtures/contract refinements | M3 phase/speaker identity and founder confirmation; fixed binding-answer allowance |
| #58 | Source-bound qualitative response evaluation | M3 reply/draft/status handling; exact context binding |
| #59 | Isolated personality/prompt evaluation | M3 presentation contract for observable behavior; policies unchanged |
| #60 | Compatibility/confirmation design only | Joint clarification/recovery/persistence decision, #47/#52; no silent schema change |
| #61 | Engine-grounded qualitative explanation fixtures | M3/M4 numeric renderer or explicitly reviewed new output contract |
| #62 | Proposed source-bound coaching fixtures once the existing rubric input contract is agreed | M4 delivered scorecard/rubric contract; do not invent new scores |
| #63 | Readonly canonical event/narration fixtures | M2/M3/M4 event identity, ordering, terminal presentation |
| #64 | Isolated failure/cancellation tests | M3 preserving drafts/save and current-response fallback mapping |
| #65 | Adversarial validation/identity tests | M3 truthful rejection/status display; semantic limits remain explicit |
| #66 | Existing synthetic corpus extension | Complete integrated product evaluation waits for #57–#65 interfaces/features |

None is started by this table. Live provider activation additionally remains blocked by trusted user/session ownership, access control, explicit consent/revocation, durable distributed cost/rate controls and explicit authorization. Session IDs are not authentication. Process-local resource limits do not provide a public-service security boundary.

## Reproducible owner-dependent defects versus missing work

The three confirmed defects found in this pass belong to M1's AI lifecycle and are corrected in this PR (report.md). No confirmed implemented-feature defect was handed off as someone else's bug. Remaining items above are interface decisions, future features or unverified platform/release evidence, not claims of broken teammate implementations. If a future reproduction implicates another owner, attach exact baseline, input/action sequence, expected/actual state and a standalone regression before requesting their change; never patch their branch silently.

SE-001 is retired under PR109's scoped decision; its original assessment and evidence are untouched. Deployment remains unauthorized pending actual release-artifact/configuration/advisory/secrets/network/privacy/final QA/accessibility/owner gates. #85–#90 presentation, README, release and deployment work remains reserved for its final phase.

## Observed final CI gate: M2/M4 investigation required

XQA-004: final code CI45077351879 passed257 unit/96 application cases but failed1 of13 prototype cases: hidden-tab metrics changed after the existing150ms wait (prototype.spec.ts:151,162). M2 owns renderer suspension; M4 owns QA synchronization/regression assessment; #76/#81 remain open. Four unchanged focused Edge baseline repetitions passed. Root cause remains unconfirmed: pending rendering/React metrics settlement versus continuing hidden animation. See report.md final addendum for exact values, source trace and proposed distinguishing checks. Do not weaken tests or change a teammate's renderer here. This failure blocks a clean integration recommendation even though all isolated M1 and financial checks passed.
