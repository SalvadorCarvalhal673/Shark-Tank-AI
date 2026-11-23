# Development history

Branch/commit references verified against GitHub before handover. These are product checkpoints; handover documentation is a later develop-only change.
| Phase | Published branch | Commit | Implemented scope |
| --- | --- | --- | --- |
|1 |codex/shark-tank-foundation |79798d6cda13d933ac364848bcacf83b0e532276 |Next/React/TypeScript structure, landing and pitch intake |
|2 |codex/shark-tank-practice |e37667cf19a44b8b5ca7e2dfbbc40e8f44ec4cdd |Three scripted investors, questions/offers/counters/debrief |
|2.5 |codex/shark-tank-qa-hardening |ee2e37bc12d544d3e923984cc27bf268c4dd5f23 |Financial validation, state reliability, accessibility, responsive/typographic corrections and regression coverage |
|3A |codex/shark-tank-negotiation-engine |383a44c491f90d30d22e4e6ee11f2d999ed30236 |Isolated immutable advanced engine, policies, competing offers, three shared counters, concessions/withdrawals and exact valuations/dilution |
|3B |codex/shark-tank-negotiation-ui |066c154e6397a2c6c4675da75c5454cf10f81440 |Advanced engine in practice UI, comparisons, confirmation, history, financial displays and factual outcome assessment |
|3C |codex/shark-tank-session-persistence |41d9b8dd74fe551c3007a70f6163193e3adb3dc1 |Optional saving, bounded validated replay/recovery, multi-tab coordination and privacy controls |
|4A.2 |codex/shark-tank-3d-prototype |21745d658f6855c5601525dea56ca76ad823e8cd |Development-only studio, original animated rigs, cameras/picking, exact previews, engine reactions/fallback and desktop feasibility measurements |

Main remains7ec048e51ecba91f55518378aa2b10ac36f90bca(initial commit). Develop was created at21745d6 for cumulative collaborative work; no historical branch was merged into main or rewritten.

Phase 4A is a planning deliverable, not an implemented cinematic interface. The original eleven-scene storyboard, character concepts, interactions/animations and verified fictional LunchLoop episode were created against41d9b8d and are recovered into docs/design in this handover. No separate historical Phase 4A implementation commit is claimed.
The2D illustration direction was subsequently superseded by stylized 3D. Preserve reusable UX/financial decisions without treating old2D art as final approval for production 3D.
Current 3D art is temporary, live AI absent, and full cinematic onboarding/negotiation/outcomes/scorecard are remaining work. The existing debrief is factual rather than a personalized AI scorecard.
No formal assignment brief/grading rubric was found in the source repository; the interactivity emphasis comes from the project owner's course context.

Handover resources were first published on develop at1c4fab22d1d03abf4c3e24bff10d55810d106c03. The subsequent verification/security documentation checkpoint does not introduce a new product implementation phase. See HANDOVER-VERIFICATION.md.

## Phase 4C integration

On 20 November 2026, owner-authorized PR #106 integrated approved candidate 05550bcd15d031b28184d42b51f3685861dbf8a3 into develop using standard merge commit 27043d4d8f3da4ecfe701e95975a27fdd51b6e90. Its other parent is prior develop 7dea5d336034484eb6d7748400b0b12d4bcbcbd4. All 14 Phase 4C heads are ancestors; the merged tree equals the reviewed candidate. No separate stacked PR merge, squash or rebase was performed. GitHub recognized #91 as merged by ancestry.

Post-merge CI run44754129952 passed: install, lint,197 unit tests, build,TypeScript,both audits,88 application browser cases and12 prototype cases. Six application defects and one QA synchronization defect have verified corrections. Historical failure evidence remains under qa/. Subsequent group handover updates documentation only. Main and historical/contributor branches remain unchanged. No live AI, Phase4D or public deployment is authorized; SE-001 remains open.
