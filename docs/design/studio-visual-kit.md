# Studio visual kit — Rooftop VC Boardroom

Issue #1, Redesign the investment studio. This document records the approved room concept and the visual rules that Issues #2 (geometry), #3 (materials and textures), #4 (lighting) and #11 (cameras) build on. It describes the current implementation, not a final production art pass.

## Concept

A bright, premium venture-capital boardroom on a city rooftop in late-afternoon light. The investors sit behind a curved walnut and stone desk in front of a full-height glass wall. The founder is the player and pitches from a brass mark in the foreground.

The direction was chosen over a prime-time TV stage and a futuristic arena, then iterated on twice: an industrial loft version was rejected as less professional, and the first boardroom render was brightened. It is an original design. It uses no logo, set layout, likeness or other identifying element of any television programme.

| Captured view | Image |
| --- | --- |
| Panel, desktop | [panel-desktop.jpg](studio-concept/panel-desktop.jpg) |
| Maya selected, desktop | [maya-desktop.jpg](studio-concept/maya-desktop.jpg) |
| Sofia selected, desktop | [sofia-desktop.jpg](studio-concept/sofia-desktop.jpg) |
| Panel, portrait 390 × 844 | [panel-portrait.jpg](studio-concept/panel-portrait.jpg) |
| Concept render, side view (not a game camera) | [concept-hero.jpg](studio-concept/concept-hero.jpg) |

Captures come from the development studio route rendered with Chromium's software (lavapipe) WebGL. Colours and anti-aliasing can differ slightly on a hardware GPU. The concept render is from the earlier unoptimised concept and shows real-time shadows and a glass pane that the implementation deliberately omits.

## Focal hierarchy

1. **Investors.** The three seats at x = −2.5, 0 and 2.5 are unchanged, so every camera preset and the three-seat framing are preserved. The investors are the brightest, most central subjects: a key spot is aimed at the desk under a linear pendant.
2. **Desk.** The curved desk is the hero object. It keeps the previous footprint so camera sightlines are identical. A stone top, brass edge inlay and walnut modesty panel lead the eye along the arc. Each seat has a brass name plate, a tablet, a notepad and a water glass.
3. **Founder.** A brass ring inlay on the floor at z = 4 marks where the player pitches. No founder avatar is drawn, because the founder is the player and an avatar there would block the cameras. A lectern stands off-axis at x = 3.6. A unit test checks that it never blocks any camera's line of sight to any investor.
4. **Context.** The glass wall, city, plants, credenzas, shelves and artwork are deliberately lower in contrast so they frame the subjects without competing with them.

## Palette

Tokens live in `src/features/studio/room/layout.ts` (`PALETTE`).

| Role | Token | Hex |
| --- | --- | --- |
| Walnut (desk, slats, credenzas) | walnut / walnutDark | #5a3a24 / #5b3a24 |
| Oak (ceiling slats) | oak | #c4a27a |
| Pale concrete (right wall, terrace) | concrete / ceiling | #d6d1c8 / #c9c4bb |
| Desk stone | stone | #d8d2c7 |
| Cognac leather (chairs) | leather | #8a4b2a |
| Brass accents | brass | #c9a063 |
| Black steel (mullions, chair frames, pendant) | blackSteel | #1d1e20 |
| Sage rug | rug | #5d6763 |
| Late-afternoon sky | skyTop → skyLow | #6f9ed1 → #fbe2b4 |

**Rules.** Warm neutrals dominate. Brass is an accent only: edges, inlays, name plates and the founder ring. Investor jacket colours (avatar.ts) must stay distinguishable from the walnut and leather, so avoid brown or cognac jackets.

## Materials

| Material | Treatment |
| --- | --- |
| Floor, walnut, concrete, rug, leather, plants, books, artwork | Lambert (matte) shading, with procedural textures where noted |
| Desk stone, black steel | Standard (physically based) shading for a soft sheen |
| Brass | Standard shading, partly metallic with a faint warm glow so it reads without reflections |
| Glazing | Black steel mullions and transoms with no glass pane, because a full-height transparent layer was nearly invisible at camera distance but cost a blended full-screen pass |
| City and sky | Unlit, vertex-coloured silhouettes and gradient, faded by warm fog |
| Plants | Faceted, low-poly leaves; stylised rather than botanical |

All textures are painted in code at load time (`room/textures.ts`): no image files, nothing downloaded and nothing to license. They render at 512 px instead of 1024 px on screens narrower than 760 px, and sample one mip level for speed. Issue #3 may replace them with documented, licensed textures and richer shading, once measured.

## Shape language and scale

- Units are metres. Seat height is about 0.7 m, desk top 1.2 m, ceiling 4.9 m and the room is 16 × 14 m.
- Use soft, rounded edges (rounded boxes, bevels) on everything a person touches, and crisp edges on architecture (mullions, slats, shelves).
- Prefer long horizontal lines (desk arc, ceiling slats, pendant) and repeated verticals (glass mullions, walnut slats).
- The cast is stylised adults. The current humanoids are temporary placeholders.

## Cast direction (for Issues #5–#8)

Two women and one man, matching the existing identities: Maya Chen (seat 1) and Sofia Mendes (seat 3) are women, and Adrian Vale (seat 2) is a man. The placeholder rig does not yet show this. Hair, faces and clothing belong to the character issues, not to this room work.

## Technical decisions and budgets

The continuous-integration browser suite renders on a CPU software renderer (SwiftShader), and its camera test needs enough frames to finish moving within the camera's wake window. The first implementation rendered at 5 fps there against 17–19 fps for the old room, and failed that test. Each decision below was measured and brought it back to about 11 fps, with every suite passing.

| Decision | Reason |
| --- | --- |
| Static geometry merged per material | About 20 draw calls for the whole room instead of about 400 unmerged objects. |
| Merged parts ordered nearest first, and background surfaces drawn last | The depth test discards hidden background pixels before they are shaded. |
| Lambert shading for matte surfaces | Several times cheaper per pixel than physically based shading. |
| No environment map | Generating one stalled the first frame on software renderers and delayed the safe fallback. |
| Sky and city as vertex colours | A full-screen textured sky halved the software frame rate. Textured box towers overlapped heavily and were the single most expensive part. |
| Contact-shadow decals instead of shadow maps | Shadow maps add a second render pass per caster and are costly on phones. Issue #4 can revisit this. |
| City as a miniature 6–22 m behind the glass, faded with fog | The studio camera's far plane is 40 m (owned by `scene.tsx` and Issue #11). |
| Four baseline lights | Ambient, sky/ground fill, low golden sun and a desk key spot. Each extra light adds per-pixel cost. Cinematic lighting is Issue #4. |
| Room fog and exposure set on mount and restored on unmount | Fallback and retry behave as before. |
| Room ignores pointer raycasts | Character picking works as before. |

**Measured in the development studio route:**

| View | Triangles | Draw calls |
| --- | --- | --- |
| Panel, desktop and portrait | 24,902 | 47 |
| Maya, desktop | 24,782 | 45 |
| Adrian, desktop | 24,838 | 46 |
| Sofia, desktop | 21,194 | 38 |

These are within the browser suite's 90,000-triangle and 60-draw-call limits. The room geometry alone is 13,116 triangles in 21 merged parts, and a unit test caps it at 60,000. The room adds no network transfer.

Frame rates come from software renderers and only compare versions; they do not predict hardware performance. Physical-phone performance remains unverified, as before.

## Known limitations

- The prototype's decorative "FOUNDER CAM" caption (`prototype.tsx`, Interactive gameplay workstream) was designed for the old dark room and has lower contrast on the brighter floor. It is `aria-hidden`, but its styling should be reviewed.
- Window reflections, real shadows and final lighting are not implemented.
- The bottom-right edge of the panel view shows part of the lectern by design. It never covers an investor.
