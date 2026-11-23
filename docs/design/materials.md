# Studio materials and textures

Issue #3. This document records the shared material library, the texture memory budget and the rights position for every surface in the 3D studio. Code: `src/features/studio/materials.ts`, `room/textures.ts`, `room/studio-room.tsx` and `avatar.ts`. Enforced by `tests/studio-materials.test.ts`.

## Room surfaces

| Surface | Shading | Texture |
| --- | --- | --- |
| Oak floor | Lambert (matte) | Procedural planks |
| Walnut (slats, credenzas, lectern) | Lambert | Procedural grain |
| Reeded walnut (desk front) | Lambert | Procedural reeds, one every 4 cm |
| Pale concrete | Lambert | Procedural speckle |
| Sage rug | Lambert | Procedural border |
| Leather chairs | Lambert | None |
| Desk stone, black steel | Standard (physically based) | None |
| Brass | Standard, partly metallic, faint warm emissive | None |
| Artwork | Lambert | Procedural abstract painting |
| Contact shadows | Unlit, transparent | Procedural radial falloff |
| City and sky | Unlit, vertex colours | None |

The shading choices come from Issue #1's measurements on the CI software renderer (see `studio-visual-kit.md`). This issue did not make room shading more expensive.

## Character surfaces

Colours stay per investor (`avatar.ts`, Issues #5–#7). Finish is shared by slot so the cast reads as one set (`CHARACTER_FINISH`):

| Slot | Roughness | Metalness | Notes |
| --- | --- | --- | --- |
| Skin | 0.62 | 0 | |
| Jacket | 0.78 | 0 | |
| Trousers | 0.85 | 0 | |
| Hair | 0.50 | 0 | |
| Brass | 0.32 | 0.55 | Faint warm emissive (0.12) so it reads without reflections |
| Shirt | 0.70 | 0 | |
| Eyes | 0.20 | 0 | |

**Decision: smooth shading for every slot.** The original generator used flat shading, which made the low-poly heads, eyes and hands look faceted and hard to read at investor-camera distance. Smooth shading costs nothing extra.

**Readable faces.** In this issue, readability comes from smooth shading and glossier eyes. Distinct facial features belong to the production characters (Issues #5–#7).

## Texture memory budget

Sizes are declared once in `TEXTURE_SPECS`. The painter uses exactly those sizes, so the budget is testable without a browser. Memory counts RGBA8 with a full mipmap chain (base level × 4/3).

| Texture | Wide screens | Narrow screens (< 760 px) |
| --- | --- | --- |
| Floor | 1024 × 1024 | 512 × 512 |
| Walnut | 512 × 512 | 256 × 256 |
| Reeded walnut | 64 × 512 | 64 × 256 |
| Concrete | 512 × 512 | 256 × 256 |
| Rug | 512 × 512 | 256 × 256 |
| Contact shadow | 128 × 128 | 128 × 128 |
| Artwork | 512 × 640 | 256 × 320 |
| **Total** | **11.25 MB** | **2.92 MB** |
| **Budget** | 12 MB | 4 MB |

The floor is the largest texture because it is the surface seen closest, in the panel camera. Characters use no textures.

## Rights and provenance

Every material and texture is original and created in code. There are no image files, no downloaded textures, no HDRIs and no third-party material packs. `public/studio/` contains only the cast `.glb`, and the cast file embeds no images or textures. A test enforces both rules, so adding a bitmap texture fails until it is reviewed and documented in `docs/studio-assets.md` with source, creator, licence, version, modifications and redistribution rights (Issue #13).

## Measured

| View | Triangles | Draw calls |
| --- | --- | --- |
| Panel, desktop and portrait | 29,674 | 50 |
| Maya, desktop | 29,374 | 47 |
| Adrian, desktop | 29,610 | 49 |
| Sofia, desktop | 25,966 | 40 |

Material changes did not change geometry or draw calls. All captures were made with a software renderer. Physical-phone performance remains unverified.
