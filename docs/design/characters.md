# Investor characters

Issues #5–#7. The three production investors are original, stylised adults generated in code by `scripts/create-studio-avatar.mjs`, following the rig contract (`docs/design/character-rig.md`). Enforced by `tests/studio-characters.test.ts`, `tests/studio-rig.test.ts` and `tests/studio-room-fit.test.ts`.

## Decision: original characters in code

The group chose original characters generated in code over downloaded or purchased models, for three reasons:

- There is nothing to license (Issue #13).
- The repository is public.
- The project rules forbid purchases without authorisation.

The look is deliberately stylised rather than photorealistic.

## Shared body (Issue #5)

All three investors share one body, so the cast has consistent proportions and one body geometry in GPU memory. Issue #5 upgraded it from the Phase 4A placeholder:

- **Face.** Egg-shaped head, ears, a sculpted nose with nostril tip, eye whites, irises and pupils, brows and two-part lips.
- **Facial bones.** Four were added to the contract: `Brows` (raises or lowers both brows), `LeftBrow` and `RightBrow` (tilt each brow) and `Jaw` (opens the mouth). Reactions in Issue #10 can then move the face, using rotations only.
- **Vertex colours.** Eye whites, irises, pupils, lips and shoe soles use vertex colours inside existing material slots. They add no draw calls.
- **Hands and cuffs.** Shirt cuffs, hands and thumbs.
- **Silhouette.** Unchanged, so the measured seated envelope and chair fit still hold.

**Decision: tessellation by visibility.** Head and hair use the most detail; eyes, lips, ears and limbs the least. A first pass at uniform high detail reached 54,000 triangles in the panel view. The final version is 40,802 triangles, below the 90,000 limit, at the same frame rate as the Issue #11 baseline on the CI software renderer.

## Maya Chen, finance (Issue #5)

Composed and precise. The finance investor reads as the most formal of the three.

| Feature | Design |
| --- | --- |
| Hair | Sleek, near-black, shoulder-length with a side part: a hair shell open at the forehead, crown fill, back panel and side curtains |
| Accessories | Brass hoop earrings, skinned to the head |
| Clothing | Structured forest-green blazer with peaked lapels over the shared jacket, high cream collar |
| Colours | Jacket #25362f, hair #171c19, skin #b97957 |

| View | Image |
| --- | --- |
| Portrait, front | [maya-portrait.jpg](studio-concept/maya-portrait.jpg) |
| Portrait, three-quarter | [maya-three-quarter.jpg](studio-concept/maya-three-quarter.jpg) |
| In the studio, Maya camera | [maya-in-studio.jpg](studio-concept/maya-in-studio.jpg) |

## Budgets

| Measure | Budget | Measured after Issue #5 |
| --- | --- | --- |
| Cast file | 1 MB raw, 300 KB gzip | 446,928 bytes raw; 80,323 bytes gzip |
| Panel view | 90,000 triangles, 60 draw calls | 40,802 triangles, 50 draw calls |
| Skinning | Every vertex fully weighted to one valid bone | Verified for every mesh |
| Seat fit | No body vertex inside furniture in any frame | Verified for every seat and clip |

Unused UV coordinates are dropped from the cast file, because no character uses textures. Captures were made with a software renderer, and physical-phone performance remains unverified.
