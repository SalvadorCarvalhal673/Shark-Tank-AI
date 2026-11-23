# Shark Tank AI

Shark Tank AI is a university Introduction to Programming group project. Pitch a fictional startup to three investors, defend your assumptions, negotiate a deal, and see how funding changes ownership.

![The Shark Tank AI practice interface](docs/design/application.png)

## Play the simulation

- **Practice room (`/simulate`)** — Start from scratch or edit a fictional LunchLoop example. Meet Maya Chen (finance), Adrian Vale (growth), and Sofia Mendes (operations), then submit answers, compare offers and use up to three shared counters.
- **Negotiation and debrief** — Confirm an exact offer or walk away. The debrief explains the outcome, shows valuation and ownership, and lets you review decisions and choose a replay challenge. Local saving is optional.
- **3D studio (`/prototype/studio`)** — Start the development server to try the Rooftop VC Boardroom with three original rigged characters, investor reactions and an active-speaker camera. HTML controls and a simplified view support keyboard use and renderer fallback. The production route returns 404.
- **Investor voice** — The optional voice panel adds rules-based feedback, one bounded clarification per investor, and coaching based on the scorecard. Core interview questions are scripted. A development mock exercises the validated AI pipeline. Production live inference is disabled and requires no credentials.

The deterministic engine uses integer minor currency units and basis points. It alone commits offers and deals, computes pre- and post-money valuations, and reconciles the cap table. [Architecture](docs/ARCHITECTURE.md) · [Financial engine](docs/FINANCIAL-ENGINE.md) · [AI behavior](docs/ai/PHASE-4D.md)

## Install and run locally

Install Git and Node.js 24 with npm. The stack is TypeScript, Next.js App Router, React, Tailwind CSS, Three.js and React Three Fiber.

```sh
git clone --branch develop https://github.com/SalvadorCarvalhal673/Shark-Tank-AI.git
cd Shark-Tank-AI
npm ci
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Open [the local home page](http://127.0.0.1:3000) or [start a practice session](http://127.0.0.1:3000/simulate). No database, API key or environment file is required. If PowerShell blocks `npm.ps1`, use `npm.cmd` and `npx.cmd`. Build and serve the production application with `npm run build` and `npm start -- --hostname 127.0.0.1 --port 3000`. [Platform setup](docs/START-HERE.md)

## Test and demonstrate

```sh
npm run lint
npm test
npm run build
npm run typecheck
npx playwright install chromium
npm run test:e2e
npx playwright test --config playwright.ci.config.ts
npm audit
npm audit --omit=dev
```

Use `npm run demo:check` after the build. The demo guide includes the exact LunchLoop figures, the 3D introduction and the scripted fallback. [Testing guide](docs/TESTING.md) · [Demo script](docs/presentation/demo-script.md) · [Studio screenshots](docs/3D-STUDIO.md) · [Release evidence](docs/RELEASE-READINESS.md)

## Security, hosting and attribution

The desktop demonstration can run locally. Before public hosting, review the selected HTTPS artifact, environment, dependency and vendored-code exposure, privacy, and monitoring. Owner approval is tracked in [#90](https://github.com/SalvadorCarvalhal673/Shark-Tank-AI/issues/90). The scoped SE-001 exception was retired after advisory reassessment. [Security record](docs/security-exceptions.md)

The asset manifest identifies original studio art, the generated icon, locally shipped fonts, and their notices. See [asset provenance](docs/design/asset-provenance.md) and the [manifest](docs/design/asset-manifest.json) for redistribution terms. The asset terms do not grant a blanket licence for the project source.

**Public HTTPS URL:** pending approved deployment.

## Team

| Member | Name | Student number | Verified contribution |
| --- | --- | --- | --- |
| 1 | Salvador Carvalhal | To be confirmed by the group | Repository coordination, simulator foundation, AI architecture and integration |
| 2 | Madalena Monteiro | To be supplied | 3D studio, characters, cameras and reactions |
| 3 | Full name to be supplied (`zevsmouraa`) | To be supplied | Interactive onboarding and gameplay |
| 4 | Full name to be supplied (`carmogalhardas`) | To be supplied | Outcomes, scorecard, decision review and replay |

[Contributor workflow](CONTRIBUTING.md) · [Development history](docs/DEVELOPMENT-HISTORY.md)
