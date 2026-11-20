# Issue105 investigation — coordination required

Baseline e74959045a5d3401a88f45a5a129f5d539a2971b. No shared application implementation edited.

## Established mechanism

Controlled scheduling reproduces an application focus-stealing race in recovery-panel.tsx confirm() requestAnimationFrame. Hold that callback, focus answer textarea, release in a focus-event microtask before browser text insertion. Recorded ordering: textarea focus -> recovery callback -> Maya heading focus -> no input event -> Submit button pointerdown/up/click -> native required validation -> textarea focus. No submit event occurs, hence no controller action/revision/question transition. This matches the original symptom but the original failing run did not retain a trace, only error context; its exact event ordering cannot be retrospectively proved.

Alternative experiment releasing callback between submit pointerdown/up passed; focus interrupted input, not the controlled submit click. Callback guard diagnostic skips restoration when focus is already outside recovery panel and off body; the exact failing schedule then passes and Adrian receives focus. This guard was injected into the held test callback only: it is a validated correction proposal, NOT a deployed application fix.

## Reproduction

reproduction.spec.txt contains the failing test; proposed-guard.spec.txt contains the comparison experiment. Copy one temporarily to tests/issue105-browser.spec.ts; run node node_modules/@playwright/test/cli.js test tests/issue105-browser.spec.ts --browser=firefox --workers=1 --trace=on. Restore/remove temporary file afterwards. Use production build/test server3192 as original config requires. Do not run two config-owned servers on3192. A first proposed-guard launch failed because stress already owned the port; rerun used a temporary reuseExistingServer config and passed. This is an evidenced launcher conflict, not an application failure.

Raw logs/traces/event timelines: TEMP/shark-105/{controlled,fill-focus,proposed-guard-rerun}. Initial original evidence remains TEMP/shark-comprehensive-audit. Deterministic regression failed before any proposed correction; injected guard passed. Existing assertions/timeouts unchanged.

## Proposed smallest shared correction

Before restoring focus, respect any user focus already outside recovery panel. Retain ordinary restoration when focus is on body or within recovery UI. Cancel scheduled callbacks on unmount; invalidate obsolete operations so callbacks cannot affect restarted/recovered scenes. Preserve normal load/removal focus fallback. No financial/session/journal/storage schema changes. Add deterministic regression asserting actual textarea value, native submit event, next-question focus and absent save after removal; cover delayed locks/input during pending removal, keyboard, restart and repeated confirmation.

Coordination requested on GitHub105 before shared source modification. Issue has no assignee; no contributor feature branches are on remote. Project owner asked to identify responsible C/D reviewer. No approval inferred from elapsed time. Until coordination is resolved, implementation correction is blocked and integration readiness remains withheld. Do not close105, merge, deploy or start4D.

## AI recheck

Existing five AI corrections passed focused17 tests. New deadline/external-abort/late-completion test independently asserts reservation release, conservative charged cost, no late dialogue and no double settlement. Remote provider abort is not guaranteed to stop billing; distributed budgets remain outside current process-local harness.

## Integration strategy after approval

Prefer one reviewed non-squash merge of final cumulative PR106 into develop, preserving ancestry of the14stacked contributions. First fetch/recheck latest develop; integrate any intervening changes on audit candidate, coordinate conflicts, rerun affected checks and full CI. Verify all14head commits are ancestors of merged develop, then document PR91–104 as superseded/included and close only with explicit owner approval. Do not separately merge/cherry-pick the14stack after cumulative integration. If owner chooses individual stacked merges instead, cherry-pick only audit correction/test/doc commits after all14are integrated, resolve and reverify; do not merge cumulative stack again. Neither strategy is executed or authorized here.

## Owner coordination decision

Member3 implements105; Member4 reviews accessibility/regression consequences. Owner explicitly prohibits AI workstream edits to recovery-panel.tsx or shared gameplay.105 remains an OPEN external integration dependency until their verified correction is published. No elapsed-time approval or resolution inferred. Phase4D and final integration paused. Issue105 updated with deterministic schedule, event trace, proposed guard and required regression matrix. Our scope continues on AI contracts/lifecycle/budget tests only.

## Own-workstream final review

Five prior AI corrections reviewed again: cancelRequest matches full binding; pre-aborted admission precedes begin; strict JSON parser compares decoded object keys; mixed-period extraction remains ambiguous; aggregate token arithmetic uses BigInt and rejects unsafe conversion. Focused17tests passed, and additional deadline/external-abort/late-completion regression passed. Full197unit tests,lint,typecheck and both audits pass. No new confirmed AI defect identified in this targeted pass. No live/provider/UI feature introduced. Remote cancellation cannot guarantee cessation/billing, process-local budgets remain insufficient for distributed deployment. Shared issue105 is outside our correction authority under the owner's latest explicit instruction.

## Stress results

100unchanged targetedFirefox repetitions completed:94passed,6failed (6.5minutes). Initial failures retained TEMP/shark-105/stress-original.log and per-repeat error contexts. No retries used to erase this result. This confirms the ordinary scenario remains intermittent on unchanged shared implementation. Controlled failing input-focus experiment and passing diagnostic guard remain separate evidence, not an application correction. Original audit's5passing repeats never proved resolution. Member3/4must retain these six failures in their correction review.
