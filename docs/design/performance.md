# Studio performance

Issue #12. This document records the studio's budgets, what was optimised and what was measured. It also lists what still has to be measured on real devices. Budgets are data in `src/features/studio/performance.ts` (from `docs/3D-STUDIO.md`). Measurements come from `scripts/measure-studio.mjs`.

## Optimisation: merged feature slots

**DECISION (approved by the 3D owner):** each investor's hair, lapels and collar now render as one vertex-coloured `Features` primitive instead of three material slots (`Hair`, `Jacket`, `Shirt`). The generator bakes each investor's colours (`INVESTOR_COLORS` in `rig.ts`) into the vertices. Brass stays a separate slot so glasses, earrings and the bun clip keep their metallic shine.

| Measure | Before | After |
| --- | --- | --- |
| Draw calls per investor | 10 | 8 (6 shared body + Features + Brass) |
| Panel view draw calls | 55 | 49 (phone budget 60) |
| Panel view triangles | 46,478 | 46,478 |
| Cast file | 672,472 bytes | 743,512 bytes (vertex colours on feature meshes) |
| Cast file gzip / brotli | — | 170,918 / 96,906 bytes (budget 300 KB gzip) |

The look is unchanged: lapels match the body jacket exactly, because both use the same colour. The only finish change is that hair, lapels and collars share roughness 0.70 (previously 0.50 for hair, 0.78 for the jacket and 0.70 for the shirt). See [cast-merged-features.jpg](studio-concept/cast-merged-features.jpg).

## Measured results (software renderer)

Run with `npm run dev -- --hostname 127.0.0.1 --port 3193`, then `node scripts/measure-studio.mjs`. The renderer was SwiftShader (CPU), so frame rates are **not** reported and none of these numbers are device evidence.

| Measure | Budget | Desktop 1440×1080, device DPR 2 | Emulated iPhone 13, device DPR 3 |
| --- | --- | --- | --- |
| Rendered DPR | ≤ 1.5 wide / ≤ 1 narrow | 1.5 | 1 |
| Panel view | 150k / 90k triangles; 100 / 60 draws | 46,478 triangles, 49 draws | 46,478 triangles, 49 draws |
| Maya selected | same | 37,794 triangles, 39 draws | 33,718 triangles, 36 draws |
| Adrian selected | same | 46,414 triangles, 48 draws | 43,538 triangles, 44 draws |
| Sofia selected | same | 37,338 triangles, 39 draws | 33,262 triangles, 36 draws |
| Time from "Enter 3D studio" to all three investors ready | — | 3.6 s | 2.4 s |
| Resources after 30 view changes and a hide/show | unchanged | 37 geometries, 31 textures, 3 skeletons, 3 mixers: unchanged | unchanged |
| Page errors | none | none | none |

**Transfer:**

| Item | Size | Budget (critical transfer) |
| --- | --- | --- |
| Cast file (only downloaded 3D asset; room textures are painted in code) | 743,512 bytes raw, 170,918 bytes gzip | — |
| Studio scripts (three.js and studio, production build) | 1,022,229 bytes raw, 273,612 bytes gzip | — |
| Studio total | about 445 KB gzip | 8 MB desktop / 5 MB mobile |

**Decode:** parsing the cast file with GLTFLoader takes a median of 3.5 ms in Node (CPU only). GPU upload and shader compilation are part of the time-to-ready figure above. No decode budget is documented, so this is a measurement, not a pass/fail result.

## Not yet measured: real devices

The issue asks for real-device evidence separately. Nothing above shows how fast a real phone renders the studio. To collect it:

1. Run `npm run dev -- --hostname 0.0.0.0 --port 3193` on a laptop, then open `http://<laptop-ip>:3193/prototype/studio` on a phone on the same Wi-Fi.
2. Start the LunchLoop episode, enter the 3D studio, and open each investor.
3. Note the `fps` and `frameP95Ms` values from the diagnostics panel, together with the device model, browser and battery state, and whether the phone got warm after 5 minutes.
4. Add a row per device to this table:

| Device | Browser | Panel fps / p95 | Selected fps / p95 | Notes |
| --- | --- | --- | --- | --- |
| — | — | — | — | not yet measured |

## Enforcement

- `tests/studio-performance.test.ts`: each investor uses at most `DRAWS_PER_INVESTOR` (8) draw calls, and the room plus cast leave at least five of the 60 phone draws free for the sky and founder mark, under the 90k-triangle phone budget.
- `tests/studio-characters.test.ts`: each investor's merged features contain their exact hair, jacket and shirt colours, and use at most two draw calls.
- `tests/prototype/prototype.spec.ts`: 60 draw calls and 90k triangles in the browser (unchanged).
