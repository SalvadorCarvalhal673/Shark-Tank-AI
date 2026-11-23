# Defect register — in progress

All findings below are confirmed by failing tests before correction. No full-audit sign-off yet.

| ID | Phase | Severity/category | Component/files | Expected / actual / root cause | Correction and regression | Status / workstream / integration |
|---|---|---|---|---|---|---|
| AUD-001 | 4C #50/#55 | High / A | ai/lifecycle.ts; server/mock-runner.ts | Superseded request must not cancel replacement; old catch called global cancel, incremented epoch and aborted new request | identity-bound cancelRequest; tests/audit-ai-races.test.ts starts blocked request then replacement before old catch | Focused red/green verified; AI B; preserves global context cancellation |
| AUD-002 | 4C #43/#45/#52/#55 | Medium / A | schemas.ts; validation.ts; response.ts; transcript.ts | Exact wire contracts must reject duplicate properties; JSON.parse silently retained final key, including escaped equivalent names | Shared bounded-depth parseUniqueJson scanner after native grammar validation; tests/audit-ai-inputs.test.ts | Focused red/green verified; AI B; stricter invalid-input rejection, no schema migration |
| AUD-003 | 4C #46 | Medium / A | evidence.ts | Mixed monthly/annual context must remain ambiguous; monthly-first precedence mislabeled annual expenses as confirmable monthly | Conflicting period signals produce null/ambiguous; tests/audit-ai-inputs.test.ts | Focused red/green verified; AI B; synthetic extraction only, original financial rubric untouched |

Reproduction evidence: TEMP/shark-comprehensive-audit/cancellation-red.log and inputs-red.log. Corrections are not yet committed or published. Related original issues remain open. No Category C implementation edits authorized without coordination; none made so far.

SE-001: existing security exception, not a newly established application exploit. Official advisory rechecked 2026-11-20: withdrawn 2026-11-18 because upstream classifies it as not a security issue; updated 2026-11-19. https://github.com/advisories/GHSA-fc5q-39xc-vjpf . Owner exception stays open and deployment prohibited pending separate clearance.

Additional confirmed finding AUD-004: Phase4C evaluation.ts (low, A/B): separately safe per-sample token counts could sum beyond MAX_SAFE_INTEGER. Red test evaluation-red.log; BigInt sum now rejects unsafe numeric conversion, regression tests/audit-ai-inputs.test.ts. Corrected in34f7fff.

Additional confirmed finding AUD-005: Phase4C mock-runner.ts (medium, A/B): already-aborted external request called begin() and superseded legitimate active work before abort admission check. Reproduced preaborted-red.log; external signal is now checked before begin(); regression audit-ai-races.test.ts. Corrected in34f7fff.

AUD-006 suspected medium/C interaction defect: Firefox answer click after save removal remained on Maya. One initial failure, five unchanged traced repetitions pass; root cause unresolved. Expected next question and focus. Files recovery-panel.tsx/use-saved-session.ts/practice-room.tsx; no implemented correction. Reported to C/D workstream through issue105, with precise reproduction/investigation proposal and evidence. https://github.com/SalvadorCarvalhal673/Shark-Tank-AI/issues/105 . Do not label this infrastructure or claim it fixed.

## Issue105 blocker investigation update

AUD-006 is now a CONFIRMED medium interaction defect under controlled scheduling. RecoveryPanel.confirm() unconditionally restores heading focus in a deferred callback even after the player focuses the answer field. Releasing it on textarea focus before insertion causes no input event; submit click is delivered but native required validation prevents submit/controller dispatch, leaving revision0/Maya. Pointerdown/up release alone passed. Original untraced failure's exact ordering remains unproved. Failing and guard-comparison diagnostics are published under ../issue105/; original implementation is unchanged pending required C/D coordination. Related GitHub105 stays open. Expected: user-directed focus/text entry survives storage completion. Proposed fix: conditional, lifecycle-safe focus restoration. No implemented production correction yet. New AI budget/deadline regression passes.

## AUD-006 correction checkpoint

Owner authorized105-only shared edits after prior handoff. Confirmed medium defect corrected in recovery-panel.tsx: user-focus guard, cancellable frame, epoch/mount/view/run invalidation and duplicate confirmation guard. Regression tests/issue105-browser.spec.ts (six permanent cases). Baseline100Firefox94pass/6fail and deterministic red preserved. IsolatedPR107commitfa4369d; cumulativecherry-picka5daec8. Verification ongoing;105OPENpending approval. No financial/controller/persistence/AI/3D/design changes. This update supersedes previous no-implementation status, preserving historical evidence.

## Final AUD-006 verification

Application correction verified: deterministic red-before/green-after; final100Firefox100pass/0fail; six permanent regressions across4engines; original82+prototype12 retained;197unit/lint/type/build/auditspass. Issue105OPENfor approval, not unresolved code dependency once finalCIpasses. Responsible reviewer: projectowner(newauthorization); shared change confined recovery-panel.tsx. Related integration effects: focusownership only, no financial/journal/storage schema/policy/AI/3D/design changes. See issue105/correction.md for complete evidence/limits.

## AUD-007 — low, test synchronization, corrected

Phase3CQA; component tests/session-recovery-browser.spec.ts finaldelayedacktest; related105/PR107. Expected gate actualone-answer commit; actualfirstlockcould be idempotentzero-actioncheckpoint, producing false expected1/actual0 failure. InitialWebKit1failure; unchanged5repeats4fail. Deterministicexplicitzero-actionlock blocks originalgate. Corrected gate identifies actioncount1, adds explicitzero-actionlock/initialcount0assertion; all original assertions remain. Final3repeats each4enginespass. Test-onlycommit226ece7. No application persistencecorrection required. Statusverifiedlocally/finalCIpending. WorkstreamQA; integrationpreservesoriginalcoverage/doesnotweakenassertions.
