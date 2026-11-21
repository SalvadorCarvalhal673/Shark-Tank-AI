# Phase 4C group handover

Verified integration: [PR #106](https://github.com/SalvadorCarvalhal673/Shark-Tank-AI/pull/106), standard merge **27043d4d8f3da4ecfe701e95975a27fdd51b6e90**. The merge preserves previous develop7dea5d3 and candidate05550bc as parents; all14 AI heads are ancestors and the merged tree exactly matches the approved candidate. [Post-merge CI passed](https://github.com/SalvadorCarvalhal673/Shark-Tank-AI/actions/runs/44754129952). This subsequent handover changes documentation only; the completion comment on PR106 identifies the latest verified develop hash.

## Synchronize

Preserve or commit your local work first. For an existing checkout:

```sh
git status --short --branch
git fetch origin
git switch develop
git pull --ff-only origin develop
git rev-parse HEAD
npm ci
npm test
```

On your existing feature branch:

```sh
git switch YOUR_FEATURE_BRANCH
git merge origin/develop
```

Resolve conflicts deliberately, coordinate shared files and rerun relevant checks. Do not reset or force-push another contributor's work. Node24 is required; Windows may use npm.cmd. No API key is needed. Main remains historical and the GitHub default, so explicitly use develop as the PR base.

## Interfaces for the three other contributors

| Workstream | Available contract | Authority boundary |
|---|---|---|
| Graphics | PresentationEvent: request-started, dialogue-ready, presentation-finished, request-cancelled, with full binding | Presentation only. Never dispatch financial actions from animation completion. |
| Gameplay | BrowserRequest/ProviderOutput/AppResponse; strict schemas/context replay; RequestLifecycle; runMockConversation and MockProvider | Offline harness, no HTTP endpoint. Synchronize lifecycle context on session/revision/investor/mode/recovery changes. Preserve three binding answers and counters. |
| Outcomes/scorecard | Qualitative Observation with exact source references, provenance/limitations; committedExplanation | Founder reports remain unverified. No fabricated grades or AI authority over valuations, terms or deal status. |

Read [AI module guide](ai/README.md) and [architecture boundaries](AI-INTEGRATION.md). Evidence extraction/confirmation and clarification are nonbinding models; they never submit answers or modify policy. Financial facts come from deterministic engine helpers. Budgets use owned reservations and deadlines; remote cancellation does not guarantee billing stops, and current limits are process-local. Explicit AI consent is separate from saving. Redaction is best effort. Keep credentials server-side, out of NEXT_PUBLIC, logs and storage.

Current gameplay remains scripted and imports none of the AI modules. No provider SDK, live inference, paid API call, authentication or live endpoint exists. AI history remains in memory; transcript.ts is a read-only future-format evaluator. Storage schema1 remains unchanged.

## Verified scope and housekeeping

197 unit tests and100 browser scenarios (82original+6recovery+12prototype). Post-merge CI verifies197unit,88application and12prototype cases; the application step retains its historical82 label. Prior four-engine evidence covers100distinct cases per engine across batches, not uninterrupted full runs. Firefox final targeted stress100/100 passed without retries; baseline94/100 and all failures/reruns remain documented in [correction evidence](qa/issue105/correction.md).

After successful integration verification, issues42–55 and105 are closed as completed. Superseded PRs91–104 and107 are documented as included through106; remaining open PRs are closed without remerging. GitHub automatically recognized91 through ancestry. All branches remain. Never merge the14stack or107 again. The recovery correction and QA test correction are included through traceable cherry-picks a5daec8/9b33679.

## Phase 4D and remaining limits

The architecture is ready for separately approved Phase4D work, but this handover does not authorize its implementation. Live quality, provider configuration/security, distributed budgets and future transcript/UI integration retain separate review gates. No real mobile/Safari, spoken screen-reader or total GPU-memory certification is claimed. Current art remains temporary.

**SE-001 stays open. Public deployment remains prohibited.** No changes to main or other contributors' active branches, graphics/gameplay/scorecard features, or paid inference were made.
