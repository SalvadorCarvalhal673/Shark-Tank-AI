# Issue105 application correction and acceptance record

This record supersedes the earlier ownership restriction and integration hold solely when the final verification gates below pass. Owner explicitly authorized the105-only shared correction on20November2026. Issue105 stays open pending independent approval; no issue/PRmerge or closure is authorized.

## Root cause and minimal correction

RecoveryPanel.confirm() scheduled unconditional heading focus after async removal. A user could focus the answer textarea before that callback ran; callback then stole focus before text insertion. Empty required textarea blocked native submission. Original100Firefoxbaseline:94pass/6fail. Controlled prepatch reproduction failed on actual textarea value. Pointerdown/up-only focus release passed; focus-event microtask release failed. Original historical untraced run's exact ordering is not claimed proved.

Only shared production file changed: src/features/simulation/negotiation/recovery-panel.tsx. A panel ref limits recovery-owned focus; focus outside panel is respected. A tracked animation-frame handle is cancelled on invalidation. Epoch/mounted guards reject obsolete callback/async completion before touching state. View key and run identity changes invalidate work, including leaving/restarting/recovering a run. Confirmation ref prevents duplicate concurrent completion. Original fallback targets and normal focus behavior remain.

No arbitrary delay/event suppression; no controller/reducer/policy/financial/storage schema/AI/3D/design/scorecard changes. Critical review checked that old async completion cannot clear a newer operation, old callback cannot clear the new frame handle, and ordinary load still delegates question focus to the current practice view. Changes localized to recovery focus ownership, not persistence authority.

## Permanent browser regressions

Six cases in tests/issue105-browser.spec.ts, included by existing original browser config and CI:
1. Deferred callback released on textarea focus; actual value preserved; pointer submit produces one native submit, Question2/Adrianfocus, absent local save.
2. Same controlled schedule with keyboardTab/Enter submission.
3. Delayed WebLock/removal, two confirmation events, typing before completion, repeated native submissions; one committed question transition and deleted save stays absent.
4. Completed run/restart invalidates callback even when body is focused.
5. Route unmount/re-entry cannot let old recovery focus the new intake.
6. Restart attempted during pending removal preserves live run; after completion restart proceeds, old callback cannot focus preview and deleted save remains absent.

Existing43persistence browser cases remain unchanged, covering load/recovery, save opt-out, failures, stale confirmations, multi-tab conflicts and normal keyboard focus restoration. Existing197unit tests remain unchanged. Actual controller dispatch is verified through native submit/nextQuestion2 UI and original replay/journal tests; no production test instrumentation was added.

## Verification evidence

TEMP/shark-105-fix stores durable logs/exitcodes. red.log proves prepatch empty textarea; green.log retains an initial incomplete patch failure. green2/final2-deterministic verify correction; final six cases verified in Edge and full matrix. extended-final failed to launch because old interrupted test server still occupied3192; PID32624 identified/stopped before final rebuild. First postpatch stress intentionally interrupted to refine lifecycle boundaries, not counted as final100. All initial failures retained; no original assertion/timeout changed.

Final source built before final stress/matrix and frozen thereafter. Full unit197pass; lint/TypeScript/build and both audits pass. Five prior AI fixes and deadline/budget regression retained. Physical mobile/Safari/spoken-screen-reader and totalGPU-memory/provider cancellation/distributed-budget limitations persist. SE-001open, no public deployment/4D.

## Publication and integration

Bugfix branch bugfix/issue-105-recovery-focus, original isolated commitfa4369dfae9402559153664d10c774f56eda5070, PR107. Audit candidate incorporates via cherry-pick a5daec82b5dbb97458d66bbdf922db87705aa402; no PRmerge. Original commit remains independently reviewable even if PR107diff becomes empty after cumulative incorporation. PR106 remains cumulative review into develop.

After independent approval, prefer ONE reviewed non-squash cumulative integration preserving14AIcommit ancestry. Recheck develop and all contributor changes first; reverify conflicts, confirm14heads are ancestors, then document superseded PR91–104/107 and close only with explicit approval. Do not merge/cherry-pick14stackagain. No integration/deployment executed here.

Final stress/matrix/CI results will be recorded after completion. No readiness recommendation before all gates pass.

## Final stress and failure accounting

Final source100Firefoxstress:100passed/0failed (8.6minutes), no retries. Baseline94passed/6failed retained. Final2productionbuild frozen before this run. Six permanent targeted regressions pass across engines; existing original82 and prototype12 preserved.

WebKit first13-case batch initially6pass/7fail: all7errors were page.goto Could not connect to server, coinciding with final stress completion/teardown of the reused runner-owned3192server. Next batch started a new server automatically. Unchanged13-case rerun passed all13; no assertion/timeouts/source change. Failure and error contexts retained. This was an evidenced orchestration ownership error; avoid sharing a runner-owned server across differently finishing jobs in future. Do not describe WebKit as an uninterrupted100-casepassrun. No additional application defect attributed to these connection failures.

## Final local verification

| Gate | Result |
|---|---|
| Existing unit tests (financial/AI/generated/persistence) |197passed,0skipped|
| Lint / TypeScript / production build |Pass|
| Full / production dependency audits |0findings|
| Final Firefox original targeted stress |100/100passed,no retries|
| Edge application / prototype |88distinct/12passed across batches|
| Chrome application / prototype |88/12passed across batches|
| Firefox application / prototype |88/12passed across batches|
| WindowsWebKit application / prototype |88distinct/12passed; failures and targeted reruns below|

Edge initially discovered5newcases; final6-case targeted pass supplies strengthened assertions and additionalcase without rerunning original82. Chrome/Firefox/WebKit firstbatch discovered all6. One acknowledgement regression was strengthened after the matrix; finaltargeted3repetitions ineachenginepassed. This is cumulative verification across batches, not uninterrupted fullruns after every test edit. Production implementation unchanged throughout final100stress/matrix. Complete finalCI on cumulativePR106is required and reported in PRchecks/finalcomment.

## Additional confirmed QA defect

AUD-007(low,test synchronization): original delayed-acknowledgement test gated first WebLock regardless of stored action count. A valid idempotent zero-action checkpoint can acquire that lock first; test then asserted one saved action while blocking thewrongoperation. InitialWebKitcasefailed at expected1/actual0; unchanged5repeats1pass/4fail. Isolated deterministic baseline with explicit zero-action lock failed waiting onwronggate. Correction gates first actualone-action checkpoint and explicitly acquires azero-action lock before answering. All original assertions preserved, plus assertion initialjournal0. Final3repeats perEdge/Chrome/Firefox/WebKit pass. No application persistence code changed. Isolatedtestcommit226ece7; incorporated via traceablecherry-pick. All failurelogs/traces retained; no test timeout increased or assertion weakened.

## Final critical review

No additional confirmed application defect found after the focus correction. Userfocus is respected, obsolete epoch checked before stateupdate/frame-handle mutation, frame cancellation on view/run/unmount, duplicateconfirm guard, current practicefocus after load, original removal/failure/preview focus coverage retained. Six earlier application defects (fiveAI+105) have verified corrections; one additional QA test defect corrected. No known unresolved implementation defect identified within this authorized scope. This is a bounded review, not a bug-free guarantee. Issue105remainsOPENpending independent acceptance. SE-001remainsOPEN; publicdeploymentprohibited;4Dnotstarted.
