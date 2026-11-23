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

## Adrian Vale, growth (Issue #6)

Energetic and approachable. The growth investor is the most casual of the three.

| Feature | Design |
| --- | --- |
| Hair | Short, textured copper hair swept up at the front: a shorter hair shell, crown fill, five tufts and short sideburns |
| Accessories | Brass-rimmed glasses with a bridge and temple arms to the ears, all skinned to the head so they follow every clip |
| Clothing | Unstructured cobalt blazer with narrow lapels, open-collar shirt |
| Colours | Jacket #355985, hair #9c5433, skin #dbac89 |

| View | Image |
| --- | --- |
| Portrait, front | [adrian-portrait.jpg](studio-concept/adrian-portrait.jpg) |
| Portrait, three-quarter | [adrian-three-quarter.jpg](studio-concept/adrian-three-quarter.jpg) |
| In the studio, Adrian camera | [adrian-in-studio.jpg](studio-concept/adrian-in-studio.jpg) |

**Test fix.** The Issue #8 glasses test sampled vertex 0 of the brass primitive. glTF primitives share one vertex buffer, so once Adrian gained lapels, vertex 0 belonged to a lapel on the chest bone. The test now samples a vertex the glasses primitive actually draws. This makes it stricter, not weaker.

## Budgets

| Measure | Budget | After Issue #5 | After Issue #6 |
| --- | --- | --- | --- |
| Cast file | 1 MB raw, 300 KB gzip | 446,928 bytes; 80,323 gzip | 582,044 bytes; 120,641 gzip |
| Panel view | 90,000 triangles, 60 draw calls | 40,802 triangles, 50 draw calls | 44,350 triangles, 52 draw calls |
| Skinning | Every vertex fully weighted to one valid bone | Verified | Verified |
| Seat fit | No body vertex inside furniture in any frame | Verified | Verified |

Unused UV coordinates are dropped from the cast file, because no character uses textures. Captures were made with a software renderer, and physical-phone performance remains unverified.
