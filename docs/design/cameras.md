# Studio camera composition

Issue #11. This document covers the four fixed camera presets, how they adapt to screen shape, and how transitions behave. There are no free-roaming controls. Code: `cameraPresets`, `cameraFov` and `cameraStep` in `src/features/studio/model.ts`, used by the `Direction` component in `scene.tsx`. Enforced by `tests/studio-camera.test.ts` and the existing prototype browser suite.

## Presets

| Shot | Camera | Aim | Purpose |
| --- | --- | --- | --- |
| Panel | (0, 3.1, 9.2) | (0, 1.45, 0.1) | The founder's view: all three investors, the desk and the pitch mark |
| Maya | (−2.5, 2.3, 4.4) | (−2.5, 1.8, 0) | Medium close-up from just above eye level |
| Adrian | (0, 2.3, 4.4) | (0, 1.8, 0) | Same framing, centre seat |
| Sofia | (2.5, 2.3, 4.4) | (2.5, 1.8, 0) | Same framing, right seat |

**Decision: closer investor shots.** The Issue #1 investor cameras sat at 2.5 m height and 5.1 m away, which framed the investor small and from above. The new shots are 0.7 m closer and 0.2 m lower, aimed at face height, so the face, hands and desk read as a medium close-up. The panel shot is unchanged.

**Decision: investor cameras stay on their seat's axis.** Each camera keeps x equal to its seat, so selection, character picking and the existing browser assertions keep their meaning. Composition changes come only from height, distance and aim. An angled three-quarter view was considered and left for a future issue, because it would change the existing camera contract.

## Screen shapes

`cameraFov(view, aspect)` widens the vertical field of view only when a shot would otherwise crop its subject:

- Panel shot: keeps 3.1 m either side of the centre.
- Investor shots: keep 0.62 m either side of the investor, which covers both hands.

Landscape screens always use 43°, and the widest allowed is 74°.

| Canvas aspect (width / height) | Panel FOV | Investor FOV |
| --- | --- | --- |
| 2.2 to 1.0 | 43° | 43° |
| 0.75 | 48.2° | 43° |
| 0.46 | 72.2° | 43° |

**Decision: widen rather than move the camera.** Pulling the panel camera back on tall screens would take it past the end of the floor. Widening keeps the same viewpoint.

The prototype's studio viewport on a 390 × 844 phone is about 362 × 331 px (aspect 1.09), so all three investors already fit there at 43°. The adaptation protects taller canvases, such as a full-height phone layout. The field of view eases with the same step as the camera, so shot changes and window resizes never jump.

## Transitions, interruption and resume

- **Animated:** position, aim and field of view ease towards the target shot with an exponential step (`cameraStep`). Choosing a new shot mid-transition simply retargets from the current pose, so interruptions are smooth and never queue.
- **Reduced motion:** shots cut immediately (step = 1), including the field of view.
- **Hidden tab:** rendering stops while the page is hidden and resumes from the same pose.
- Camera changes never dispatch negotiation actions. The existing browser test redirects the camera three times and checks the session revision is unchanged.

## Evidence

| View | Image |
| --- | --- |
| Maya shot, before (left) and after (right) | [camera-maya-before-after.jpg](studio-concept/camera-maya-before-after.jpg) |
| Adrian shot | [camera-adrian.jpg](studio-concept/camera-adrian.jpg) |
| Panel, desktop | [camera-panel.jpg](studio-concept/camera-panel.jpg) |
| Panel, portrait 390 × 844 | [camera-panel-portrait.jpg](studio-concept/camera-panel-portrait.jpg) |

| View | Triangles | Draw calls |
| --- | --- | --- |
| Panel, desktop and portrait | 29,674 | 50 |
| Maya, desktop | 25,966 | 40 |
| Adrian, desktop | 29,610 | 49 |
| Sofia, desktop | 25,966 | 40 |

## Tests

- Panel: the head top, hands and shoulders of all three investors are in frame at aspects from 2.4 to 0.46.
- Investor shots: the investor is centred, fully in frame and has head room at every aspect.
- The field of view never grows as the screen widens, stays within 43–74°, and is unchanged on landscape screens.
- Every camera is inside the room, above the desk and in front of the investors.
- No orbit, fly, pointer-lock or similar free-camera control exists in the studio.
