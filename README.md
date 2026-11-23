# Shark Tank AI

University Introduction to Programming group project: pitch a startup to three fictional investors, defend assumptions, negotiate investment and learn how ownership changes.

**Use develop.** Main remains the historical initial branch and repository default. Published product checkpoint: [21745d6](https://github.com/SalvadorCarvalhal673/Shark-Tank-AI/commit/21745d658f6855c5601525dea56ca76ad823e8cd).

## Current functionality

- **Practice (`/simulate`).**
  - Guided pitch preparation with fictional LunchLoop examples, and investor introductions.
  - Three investors: Maya Chen (finance), Adrian Vale (growth) and Sofia Mendes (operations).
  - Contextual scripted questions.
  - Revealed opening offers and an offer comparison with ownership visualisation.
  - Three shared counters, concessions and policy-specific withdrawals.
  - Explicit, revision-bound deal confirmation, and four terminal outcomes with cinematic conclusions.
  - Scorecard, financial explanations, decision analysis, historical review and replay challenges.
  - Optional local saving, recovery and multi-tab coordination.
- **Optional investor voice (Phase 4D).** Off by default. It narrates committed moments and offers one founder-confirmed clarification per investor. Every reply is validated and bound to the session, and the scripted fallback is honest. **The production build keeps the AI route disabled, and live AI is not activated** ([details](docs/ai/PHASE-4D.md)).
- **3D studio (`/prototype/studio`, development only).**
  - A Rooftop VC Boardroom with three original characters generated in code, on a shared rig.
  - Gestures, reactions, concessions and withdrawals.
  - An active-speaker camera, a dialogue transcript and a simplified fallback.
- **Money.** Always integer cents and basis points, computed by the deterministic engine. Independent oracle tests are in `tests/final-financial-oracle.test.ts`.

![Current application](docs/design/application.png)

## Install and launch

Install Git and Node.js 24.x with bundled npm(npm 10+).
```sh
git clone --branch develop https://github.com/SalvadorCarvalhal673/Shark-Tank-AI.git
cd Shark-Tank-AI
npm ci
npm run dev -- --hostname 127.0.0.1 --port 3000
```
Open http://127.0.0.1:3000 for landing, /simulate for complete practice, /prototype/studio for the feasibility slice. Enter 3D, start LunchLoop and explicitly submit three sample/custom answers before countering.
No API key, database or environment configuration is needed. Windows PowerShell blocking npm.ps1: use npm.cmd/npx.cmd, not a weaker execution policy. [Platform setup](docs/START-HERE.md).

## Checks

```sh
npm run lint
npm test
npm run build
npm run typecheck
npx playwright install chromium
npm run test:e2e
```
See [TESTING](docs/TESTING.md) for the prototype suite (`npx playwright test --config playwright.prototype.config.ts`), the CI software-renderer suite and the WebKit suite (`playwright.webkit.config.ts`, on macOS). Release-candidate results are recorded in [RELEASE-READINESS](docs/RELEASE-READINESS.md). Production intentionally returns 404 for the prototype route.

No environment configuration is required. To try the development mock investor voice: `SHARK_AI_BACKEND_MODE=mock npm run dev`. Never put provider keys in `NEXT_PUBLIC_*` variables ([credentials](docs/ai/credentials.md)).

## Contribute and explore

Read [AGENTS.md](AGENTS.md), [CONTRIBUTING.md](CONTRIBUTING.md) and an available [Issue](https://github.com/SalvadorCarvalhal673/Shark-Tank-AI/issues). Create an issue-linked feature branch and reviewed PR into develop.
- [Start here](docs/START-HERE.md), [architecture](docs/ARCHITECTURE.md), [history](docs/DEVELOPMENT-HISTORY.md)
- [Roadmap](docs/ROADMAP.md), [task backlog/workstreams](docs/TASK-BACKLOG.md), [milestones](https://github.com/SalvadorCarvalhal673/Shark-Tank-AI/milestones)
- [Finance](docs/FINANCIAL-ENGINE.md), [negotiation](docs/NEGOTIATION-ENGINE.md), [persistence](docs/SESSION-PERSISTENCE.md)
- [3D studio](docs/3D-STUDIO.md), [future AI](docs/AI-INTEGRATION.md), [UX](docs/USER-EXPERIENCE.md), [design guidelines](docs/DESIGN-GUIDELINES.md), [design resources](docs/design/README.md)
- [Testing](docs/TESTING.md), [handover verification](docs/HANDOVER-VERIFICATION.md), [security](docs/security-exceptions.md), [asset provenance](docs/studio-assets.md)

**Security:** SE-001 was retired for the reviewed configuration on 22 November 2026 ([record](docs/security-exceptions.md)). **Public deployment is still not authorized:** it needs the release verification in [RELEASE-READINESS](docs/RELEASE-READINESS.md) and the explicit owner approval tracked in Issue #90. Never use `npm audit fix --force` as a remediation.
Physical Android/iPhone performance, Safari/WebKit, spoken screen readers, production performance certification and final art remain open. Phone viewport emulation is desktop hardware.


## Team

| Member | Name | Student number | Main workstream |
| --- | --- | --- | --- |
| 1 | *to be completed by the group* | | *to be completed* |
| 2 | Madalena Monteiro | *to be completed* | 3D studio, characters, cameras, reactions |
| 3 | *to be completed by the group* | | *to be completed* |
| 4 | *to be completed by the group* | | *to be completed* |

Deployment URL: **none yet.** Public deployment requires the owner approval recorded in Issue #90.
