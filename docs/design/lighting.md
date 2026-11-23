# Studio lighting

Issue #4. The studio uses cinematic three-point lighting with no post-processing and no shadow maps. Code: `src/features/studio/lighting.ts`, rendered by `room/studio-room.tsx`. Enforced by `tests/studio-lighting.test.ts`.

## Composition

| Role | Light | Placement | Purpose |
| --- | --- | --- | --- |
| Key | Warm directional, intensity 2.7 | Front-left and above (−4, 5.5, 7) | Lights faces from the camera side, leaving a soft shadow side so heads have shape |
| Fill | Sky/ground hemisphere, intensity 2.0 | Everywhere | Keeps shadow sides from going black |
| Rim | Low golden sun, intensity 2.6 | Behind the glass (−6, 4.2, −10) | Separates hair and shoulders from the bright window |

Exposure is 1.25 while the studio is mounted and is restored on unmount.

**Decision.** The Issue #1 rig relied on strong ambient and hemisphere light, which made the investors look flat. Moving that energy into a directional key from the camera side, plus a rim from the window, adds modelling with the same number of real-time lights.

**Same lights for every camera.** The panel and all three investor cameras look from the key side, so the lights do not move when the camera changes. Moving lights would make the room appear to change between shots. A test checks that every preset stays on the key side.

## Tiers

| Tier | Screens | Lights |
| --- | --- | --- |
| Wide | 760 px and wider | Fill, key, rim (3) |
| Compact | Under 760 px | Fill, key, rim (3) |

**Decision: no fourth light.** A wide-screen tier with a soft spot pooling light on the desk was built and measured. On the CI software renderer it cut the studio from 10 to 8 fps (the Issue #3 room ran at 9), and the camera test failed one run in three. Spot lights are the most expensive per pixel, so the pool was removed from both tiers and the key was raised slightly instead. The tiers stay separate in code so Issue #12 can trim phones further if real-device measurements require it. Post-processing (bloom, ambient occlusion, colour grading passes) and shadow maps are not used in either tier. Contact shadows are painted decals (Issue #1).

## Evidence

| View | Image |
| --- | --- |
| Panel and Maya cameras, before (left) and after (right) | [lighting-before-after.jpg](studio-concept/lighting-before-after.jpg) |
| Maya and Adrian close-up, before and after | [lighting-maya-before-after.jpg](studio-concept/lighting-maya-before-after.jpg) |
| Sofia camera, wide tier | [lighting-sofia.jpg](studio-concept/lighting-sofia.jpg) |
| Panel, portrait 390 × 844, compact tier | [lighting-portrait-compact.jpg](studio-concept/lighting-portrait-compact.jpg) |

All captures were made with the lavapipe software renderer. Hardware GPUs can differ slightly in colour, and physical-phone appearance and performance remain unverified.

| View | Triangles | Draw calls |
| --- | --- | --- |
| Panel, desktop and portrait | 29,674 | 50 |
| Maya, desktop | 29,374 | 47 |
| Adrian, desktop | 29,610 | 49 |
| Sofia, desktop | 25,966 | 40 |

Lights do not add draw calls, because no light casts shadows.

## Tests

- Each tier has a key, a fill and a rim within its light budget (3 lights). The compact tier never adds lights.
- The key is in front of and above the heads, the rim is behind the investors, and the key is stronger than the fill.
- No studio source file enables shadow maps or post-processing.
