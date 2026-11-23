# Phase 4A.2 asset provenance and dependency notes

## Original visual assets
No character, environment, texture, HDRI or animation pack was downloaded or purchased.

| Asset | Source and modifications | Rights / redistribution |
| --- | --- | --- |
| public/studio/investor-v1.glb | Original procedural cast created specifically for this project by scripts/create-studio-avatar.mjs, following the rig contract in src/features/studio/rig.ts (Issue #8): one shared body and one feature mesh per investor, all weighted to one 15-bone seated rig (11 body + 4 facial bones, Issue #5); production characters in docs/design/characters.md. Includes Listening, Offering, Withdrawal and Explaining quaternion clips (docs/design/animation.md) and the Skeptical, Agreeing, Considering and Firm reaction clips (docs/design/reactions.md). | Original project artwork, not a third-party model. No separate public license has been applied to the original artwork. |
| Room geometry and materials | Original procedural Rooftop VC Boardroom (Issue #1) in src/features/studio/room/: curved desk, chairs, glass wall, slat walls, furniture, plants, miniature skyline and lighting. Textures (wood, concrete, rug, sky, windows, artwork, contact shadows) are painted on canvas in code at load time. | Original project source; no image files, downloads or external art licenses. |
| Materials and texture budget | Shared material library and texture sizes in src/features/studio/materials.ts (Issue #3); see docs/design/materials.md. | Original project source; no image files. |
| Character variations | Original per-instance jacket, skin and hair materials; per-investor feature meshes, including Adrian's skinned procedural glasses. | Original project source; no downloaded textures or likenesses. |
| Simplified portraits | Original HTML/CSS silhouettes, sharing the same investor identities. | Original project source. |
| Fonts | Existing approved local project fonts and OFL notices, unchanged. | Existing notices remain in src/app/fonts. |

The exported GLB is 743,512 bytes.
SHA-256: 72084abf958f696d8bdf9a75efe16b547a0caf11b5f3262715ed9e8409ba12ca

Regenerate from the repository root:
```powershell
node scripts/create-studio-avatar.mjs
```

The generation process requires the pinned Three.js package. The original GLB is retained in source control for reproducible checkout use. It contains embedded geometry, materials, skin data and animations; no image files, external buffer URIs, scripts or required compression extensions. No runtime decoder is needed or hosted. Three.js's GLTFLoader loads the local file directly.

## Dependency evaluation
Pinned final direct additions:
- three 0.187.0 — MIT.
- @react-three/fiber 9.8.2 — MIT.
- @types/three 0.187.0 — MIT, development dependency.

Resolved React and React DOM remain 19.3.1, with Next.js 16.4.6. No existing locked package versions changed. There are 19 additional lockfile package entries. The machine-readable dependency-delta.json in the external review artifacts enumerates every additional entry, version, development flag and declared license.

Drei 10.7.9 was installed and evaluated successfully, then removed. Its helper convenience did not justify the unused helpers and dependency footprint for this small scene. The final application uses R3F useLoader and the native Three.js GLTFLoader. No Drei decoder CDN, environment preset service, analytics, model service or live AI request is used.

R3F internally depends on Zustand. The application does not add a separate state store: the approved React session controller remains authoritative. @types/three transitively installs @dimforge/rapier3d-compat as a development dependency for its example declarations; no physics API, simulation or physics engine is integrated or imported by the prototype. No dependency override was used to conceal this.

New package license metadata contains MIT, BSD-3-Clause and Apache-2.0 declarations. Installed package notices remain with npm packages. Preserve required notices in any future redistribution. This inventory is not a source-code security audit of every transitive dependency.

## Security assessment
Final full npm audit: 14 high-severity propagated package findings from the already documented picomatch advisory; no new advisory identified among the additions. Final npm audit --omit=dev: zero reported findings.

A zero production audit is not security sign-off. The generated production server trace still contains Next.js's vendored picomatch implementation and package metadata. The existing SE-001 exception remains open and unresolved. Its accepted scope is controlled development, testing and repository publication only; public deployment remains prohibited.

No remotely supplied or user-uploaded GLB is accepted. Models and requests are fixed local paths. Financial and dialogue inputs do not become asset URLs, HTML, shader code or executable scripts. No credentials, secrets or environment files were introduced. Development fault injection is available only through the development-only prototype route.

The advisory was rechecked on 18 November 2026:
https://github.com/advisories/GHSA-fc5q-39xc-vjpf


## Handover status update
The preceding audit counts describe the Phase4A.2 review snapshot. During handover, the official advisory was withdrawn and fresh full/production audits reported0. No dependency remediation or lockfile change was made; SE-001 remains open and public deployment prohibited. See the latest reassessment in security-exceptions.md and HANDOVER-VERIFICATION.md.
