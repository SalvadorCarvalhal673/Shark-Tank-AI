# Phase 4A.2 — interactive 3D feasibility prototype

## Scope and baseline
Experimental branch: codex/shark-tank-3d-prototype.
Approved implementation baseline: 41d9b8dd74fe551c3007a70f6163193e3adb3dc1.
Prototype publication and creation of develop are authorized. Public deployment, paid asset purchases, live AI and full eleven-scene implementation remain outside this checkpoint.

The existing landing page, practice interface, financial engine, investor policies, negotiation state machine, validation, persistence controller, storage schema and original tests remain unchanged. New application code lives under src/features/studio and src/app/prototype/studio. package.json and package-lock.json contain the permitted dependency additions.

## Launch and interact
Use Node.js 24 (review machine: 24.22.0) and npm. From the Shark Tank AI repository:
```powershell
npm run dev -- --hostname 127.0.0.1 --port 3193
```
Open http://127.0.0.1:3193/prototype/studio in Edge, Chrome or Firefox.
The original application remains at / and /simulate on the same server. Browser storage belongs to the scheme, hostname and port: use the same address for prototype and practice when testing their shared saved slot.

1. Enter 3D studio. The HTML interface remains available while its separate code and local model load.
2. Choose investors using the HTML controls or click a character. Full panel restores the founder view.
3. Start the LunchLoop episode. Saving is opt-in. An existing saved record is retained; resume it or start the sample without saving. The sample cannot silently overwrite it.
4. Use each sample answer or enter your own answer and submit it explicitly. Three committed answers produce actual opening offers through the approved engine.
5. Adjust investment and equity through numeric fields or sliders. Pre-money, post-money and all three ownership allocations update immediately without using a counter.
6. Send a counter to an active investor. For example, Maya's initial cash ceiling is EUR100,000: requesting EUR100,000.01 causes an actual engine withdrawal. The response, history and gesture follow the committed event.
7. Switch to simplified view and back. Inputs, session identity, revision, counter allowance and saved journal remain unchanged.
8. Reduce motion freezes nonessential gestures and changes cameras immediately.

This is a negotiation feasibility slice. Deal-confirmation UI and the complete episode are still available in the approved practice interface, not reimplemented here. No AI response is fabricated. The experiment does not add new persistence rules or auto-submit sample answers.

The route returns HTTP404 outside development. The production landing and practice routes were checked separately. Public deployment is prohibited regardless of this route gate. The gate is not a replacement for security review.

## Architecture and files
- model.ts: camera presets and interpolation policy; pure scene cues derived from committed history; preview adapter calling existing readTerms, valuations and ownershipAfterInvestment; explicitly identified LunchLoop fixture.
- prototype.tsx: accessible HTML controls, drafts, investor selection, error boundary and existing useSavedSession integration. The controller stays mounted across view changes.
- scene.tsx: one lazily loaded R3F canvas, room geometry, GLB loader, gestures, camera choreography, visibility suspension and renderer diagnostics.
- avatar.ts: skeleton-aware cloning, separate animation mixers and owned material/skeleton disposal. Shared immutable geometry avoids redundant asset copies.
- create-studio-avatar.mjs: original GLB source generator.
- review-studio.mjs: cold-browser network/preview timing, screenshots and a separate real video capture.
- soak-studio.mjs: repeated camera selection, periodic renderer remounts and resource sampling.
- tests/studio.test.ts: eight focused unit tests.
- tests/prototype/prototype.spec.ts and playwright.prototype.config.ts: twelve focused browser scenarios.

Only explicit answer and counter submissions call controller.dispatch. Cameras, selection, clipping gestures, loading callbacks, view changes and financial previews do not dispatch. No animation callback can accept an offer, calculate authoritative financial terms or consume a round.

Scene cues bind to session ID, event revision, investor and committed decision. Unrelated investor cues remain stable across a counter. The original source offer history is retained by the existing engine. Camera movement restarts from its current position after repeated selection and resumes following a hidden-tab interval.

## Rendering and fallback
Original seated humanoid instances have separate cloned bone hierarchies, independent mixers and material variations. The GLB loader splits its seven material primitives into skinned meshes; those primitives share the actor's bone hierarchy. Diagnostics count three character roots and three independent rigs, rather than incorrectly equating every mesh primitive with a person.

The room uses matte green architecture, wood, brass, a curved table, three chairs, hemisphere lighting and two directional lights. There are no real-time shadows, post-processing passes, physics, movement controls or external lighting assets. DPR is capped at 1 on narrow windows and 1.5 on larger windows.

The demand-rendering loop runs during camera or gesture activity and settles afterwards. document.hidden suspends it. Rendering is optional and isolated from financial controls.

Failure coverage includes injected asset/renderer/WebGL conditions, an aborted real GLB request with a successful explicit retry, actual WebGL initialization denial, and actual WEBGL_lose_context. Failures unmount only the renderer and report a truthful fallback message. View switching preserves pending answer and financial drafts and the exact saved record.

## Measured performance
Reference machine: Windows 11 Home 10.0.26200; AMD Ryzen 5 5625U; AMD Radeon integrated graphics; Edge 157.0.4341.60; headless ANGLE/D3D11 with the actual AMD adapter. This is desktop hardware, including when the viewport emulates a phone.

Cold browser cache, warmed development server; CDP network throttling:
| Measurement | Desktop, 1440x1080, DPR1 | Emulated mobile, 375x900, device DPR3 / rendered DPR1 |
| --- | --- | --- |
| Network | 20Mbps, 60ms latency | 10Mbps, 80ms latency |
| HTML controls ready from navigation | 1297ms | 1581ms |
| Entry click to observed three-character renderer | 1470ms | 1809ms |
| Incremental 3D HTTP transfer including headers | 698159 bytes | 698159 bytes |
| Sampled active camera FPS | approximately60 | approximately60 on desktop GPU |
| Sampled p95 frame interval | 17.2–17.4ms | 17.3–19.3ms |
| Maximum observed triangles across sampled views | 12688 | 12640 |
| Maximum observed draw calls across sampled views | 52 | 48 |
| Input event to observed preview DOM update | 9.9–14.6ms | 9.8–13.5ms |
| Observed external HTTP requests | zero | zero |

The FPS values are short active-camera samples, not a guarantee of sustained physical mobile FPS. The diagnostic averages rolling frame intervals below250ms and excludes longer initialization/visibility gaps; it does not summarize every stall or establish a complete-episode frame rate. Both geometry budgets and the measured incremental transfer budgets are met on this fixture. The initial HTML/shell transfer is separate from the incremental 3D transfer; detailed resource records are in measurements.json. These development-server results are not an optimized production certification. No performance conclusion is based on installed npm package sizes.

The recording is captured in a separate browser context and is excluded from performance samples because video encoding changes workload. Screenshots include panel and all three camera presets, desktop and mobile emulation, and a committed withdrawal. The original, illustrative prototype characters are not production art.

Final stability result: 301,163ms (five minutes), 191 camera selections and four explicit 3D/simplified round trips. Nineteen samples remained at 38 geometries, 22 textures, three independent rigs and three mixers, with zero page errors. Concurrent browser regression work ran on the host, so these are stability observations rather than an isolated sustained-FPS benchmark. They do not prove absence of all CPU or GPU leaks.
The earlier development stress log includes hot reloads and is retained separately; it is not treated as a clean sustained benchmark.

## Verification
| Check | Final result |
| --- | --- |
| npm run lint | Passed, 0 errors; final rerun reports2 warnings in older QA artifacts that became visible at closure, none in prototype source |
| npm run typecheck | Passed |
| npm test | 136/136 passed; all original128 preserved plus8 focused tests |
| npm run build | Passed |
| Original browser suite, Edge | 82/82 passed |
| Original browser suite, Chrome | 82/82 passed |
| Original browser suite, Firefox | 82/82 passed |
| Prototype suite, Edge | 12/12 passed |
| Prototype suite, Chrome | 12/12 passed |
| Prototype suite, Firefox | 12/12 passed |
| npm audit | 14 existing high propagated findings, no new advisory identified |
| npm audit --omit=dev | 0 findings; vendored-matcher limitation remains |

All final browser runs used the final dependency graph. Exact logs, audit JSON, package inventory, measurements, screenshots and recording are retained outside the repository in the Phase4A.2 review artifacts folder. There were no skipped cases in these suites.

Reproduce the focused suite against its development-only route with:
```powershell
npx playwright test --config playwright.prototype.config.ts
```
The config defaults to installed Edge. Set PLAYWRIGHT_CHANNEL=chrome for Chrome, or PLAYWRIGHT_BROWSER=firefox for Firefox. The original npm run test:e2e suite continues to use its existing production-server config.

Focused browser coverage: exact preview and invalid input; pending-draft and saved-record preservation; one committed counter and replay; camera redirects and actual picking; independent rig/mixer counts; reduced motion; keyboard selection; injected failures; real GLB fetch failure plus retry; actual WebGL2 initialization denial; real context loss; simulated hidden-document events and resumption; responsive layouts at 320,375,681,768,1440px.

The visibility test deliberately synthesizes document visibility changes. It verifies application handling, not operating-system lifecycle certification. Browser viewport emulation does not establish real mobile behavior.

## Defects found and corrected during implementation
- GLB primitives were accidentally assigned single-item material arrays, preventing their display. Preserve their original single-material shape; covered by a rendering and cloning regression.
- Initial diagnostic values could remain empty in reduced-motion mode. Added finite settling frames and a delayed measurement frame.
- A camera interrupted by visibility suspension could stop halfway on return. Visibility changes now wake the directed transition.
- A failed cached GLB request could prevent a useful retry. Explicit retry clears the failed loader entry before remounting.
- An array-valued canvas DPR setting could override narrow-window resolution selection. Use a stable numeric DPR with an explicit resize listener.
- New adversarial test helpers required an explicit DOM this type; corrected before the final build.
- OneDrive marked a stale generated build directory read-only, blocking Next.js cleanup. Removed only the verified obsolete generated directory, then completed the build. No source workaround or framework configuration change.

## Security, limits and recommendation
See studio-assets.md for original asset provenance and final dependency review. Full audit remains14 high propagated findings from SE-001; production-only audit reports0, while the final server trace still contains the vendored matcher. SE-001 remains open. Public deployment is prohibited.

A non-blocking upstream runtime warning remains: R3F9 uses Three.Clock, which Three.js187 deprecates in favor of Timer. The tested stable versions render correctly and pass all suites; no dependency source patch or warning suppression was introduced.

Remaining limits: physical Android/iPhone performance and thermal testing; Safari/WebKit runtime verification; spoken screen-reader verification; final character art, seated gesture polish and full temporal intersection review; production-bundle certification; battery/total GPU-memory profiling; live AI, voice and complete episode integration. The existing approved simulator's deterministic evidence and negotiation limits remain intact.

Recommendation: the bounded 3D presentation is technically feasible on the tested desktop. Advance only after independent review; require character-art approval and physical-mobile evidence before committing to full 3D production. This report does not authorize deployment or further implementation.

Publication preparation: historical QA artifacts were preserved outside the repository. The source commit contains only the prototype, its tests, assets and supporting documentation. Prior branch heads remain unchanged. Publication verification evidence is retained separately; no public deployment is authorized.