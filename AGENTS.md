# Shark Tank AI — persistent Codex instructions

## Objective and baseline

University group programming project: premium stylized 3D narrative investment simulation accessible to beginners. Current art is temporary; live AI is not implemented. Work from develop, product checkpoint 21745d658f6855c5601525dea56ca76ad823e8cd. Preserve main, GitHub default and historical branches.

## Inspect and reuse

Read README.md, CONTRIBUTING.md, docs/ARCHITECTURE.md, docs/TASK-BACKLOG.md and the chosen GitHub Issue before editing. Inspect relevant code/tests. Reuse existing functionality; do not rebuild the simulator or create a second authoritative controller. Implement only the issue's acceptance criteria.
For Next.js changes, read the installed version's guide under node_modules/next/dist/docs. Preserve project instructions if generated notes append.

## Architecture

src/app/page.tsx: landing. app/simulate/page.tsx: full practice. app/prototype/studio/page.tsx: development-only prototype.
src/features/simulation/pitch.ts: validated decimal parsing. pitch-form.tsx owns negotiation/use-saved-session.ts; practice-room.tsx renders questions/offers/outcomes.
negotiation/session.ts is the immutable reducer; investor-policy.ts owns versioned policies and text-pattern assessment; financials.ts is arithmetic authority. presentation.ts, offer-card.tsx, terms-display.tsx, history.tsx and debrief.tsx are views/adapters.
session-storage.ts validates/replays/saves; recovery-panel.tsx handles explicit recovery/removal.
src/features/studio/prototype.tsx keeps HTML/drafts/controller outside scene.tsx canvas. model.ts projects committed cues and delegates preview; avatar.ts clones rigs/materials/mixers. Original temporary GLB: public/studio/investor-v1.glb; source: scripts/create-studio-avatar.mjs.
practice.ts/panel.ts are historical helpers; current practice uses advanced negotiation.

## Stable contracts

Cash=integer minor units; equity/ownership=integer basis points(10000=100%). Reuse BigInt half-up helpers; pre-money+investment=post-money and cap table=10000bp. Primary issuance only.
Rules-v1: three answers, three shared counters, explicit acceptance, one accepted deal and four terminal reasons. Invalid/stale/duplicate/wrong-session actions preserve rounds and revision. Bind actions to sessionId/expectedRevision; preserve frozen snapshots, initial concession floors, offer IDs/statuses and ordered history.
Detected evidence is unverified text. Never claim factual verification, viability grades or fabricated traction.
Saving is optional/local: exact schema 1/rules 1,65536-code-unit bound, seven-action journal, deterministic replay, Web Locks, authorization/cancellation and conflict handling. Never silently overwrite/delete corrupt or incompatible saves. Persistence changes require reviewed version/migration/consent design. No GPU objects, camera state, credentials or unreviewed AI transcripts in storage.
Cameras, selection, previews and animation completion never dispatch financial decisions. Fallback/view switching must preserve controller, drafts, journal, counter allowance and saved record.

## Redesign and future integration

Layouts, original assets and view adapters can evolve within issues. Finance, policy/reducer and persistence contracts require coordinated architecture review plus independent oracle/sequence tests. Parallel branches must not replace these independently.
Final creative direction: modern stylized adult characters, expressive faces, convincing materials, premium studio, cinematic comfortable cameras and meaningful decisions. Keep HTML keyboard equivalents, reduced motion, responsive layouts and simplified fallback. No free-roaming controls required. Host licensed assets/decoders locally; measure budgets and distinguish physical phones from emulation.
AI needs reviewed Phase 4C contracts before Phase 4D implementation: server-only keys, structured validation, evidence confirmation, privacy, transcript compatibility, cost/rate/time limits, cancellation/stale protection and honest scripted fallback. AI can explain committed results but never authoritatively calculate terms, mutate budgets or accept deals.

## Testing/security/licensing

Node 24; npm ci. Use meaningful regressions, never delete/skip/weaken existing assertions. Run npm run lint, npm test, npm run build, npm run typecheck and relevant browser suites. Preserve136 unit/94 browser cases. docs/TESTING.md defines servers, browser settings and durable evidence/batches.
SE-001 stays open. Public deployment prohibited. Keep audits visible; no forced audit fix, unsupported override, secret disclosure or false clearance. External assets require exact source/creator/license/version/modifications/redistribution rights and preserved notices. No purchases without authorization.

## Git and issue workflow

Read issue dependencies/priority/milestone, update develop, create an issue-linked feature branch, implement scope, test, review diff, push branch and open PR into develop. Merge only after approval. No uncontrolled direct shared-branch pushes, force pushes, history rewrite, branch deletion, main merge or deployment. This owner-authorized documentation handover may commit directly to develop.
Coordinate shared files in issues/PRs. No named assignments/deadlines/paid services/external messages without authorization. Save durable progress after stages and recover evidence after interruption.
Authoritative docs: ARCHITECTURE, FINANCIAL-ENGINE, NEGOTIATION-ENGINE, SESSION-PERSISTENCE,3D-STUDIO, AI-INTEGRATION, TESTING, security-exceptions and studio-assets under docs.


<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
