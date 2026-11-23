// Studio material library and texture memory budget (Issue #3).
// Pure data shared by the room, the characters and the tests: one place that says how every
// surface is shaded and how much GPU memory its textures may use.
import type { RigMaterial } from "./rig.ts";

/**
 * Character surface finish per rig material slot. Colours stay per investor (avatar.ts); finish is
 * shared so the whole cast reads as one coherent set.
 * DECISION: smooth shading on every slot. The original generator used flat shading, which made the
 * low-poly heads and hands look faceted and hard to read at investor-camera distance.
 * DECISION: brass gets a faint warm emissive instead of an environment map, matching the room
 * (no environment map exists; see docs/design/studio-visual-kit.md).
 */
export const CHARACTER_FINISH: Record<RigMaterial, { roughness: number; metalness: number; emissive?: number }> = {
  Skin: { roughness: .62, metalness: 0 },
  Jacket: { roughness: .78, metalness: 0 },
  Trousers: { roughness: .85, metalness: 0 },
  Hair: { roughness: .5, metalness: 0 },
  Brass: { roughness: .32, metalness: .55, emissive: .12 },
  Shirt: { roughness: .7, metalness: 0 },
  Eyes: { roughness: .2, metalness: 0 },
  // Merged hair, lapels and collars (Issue #12): between the hair and cloth finishes.
  Features: { roughness: .7, metalness: 0 },
};

/**
 * Every procedural room texture with its size on wide and narrow screens. textures.ts paints at
 * exactly these sizes, so the memory budget below can be checked without a browser.
 */
export const TEXTURE_SPECS = {
  floor: { wide: [1024, 1024], compact: [512, 512] },
  walnut: { wide: [512, 512], compact: [256, 256] },
  reeded: { wide: [64, 512], compact: [64, 256] },
  concrete: { wide: [512, 512], compact: [256, 256] },
  rug: { wide: [512, 512], compact: [256, 256] },
  contact: { wide: [128, 128], compact: [128, 128] },
  art: { wide: [512, 640], compact: [256, 320] },
} as const satisfies Record<string, { wide: readonly [number, number]; compact: readonly [number, number] }>;
export type TextureName = keyof typeof TEXTURE_SPECS;

export const textureSize = (name: TextureName, compact: boolean) => TEXTURE_SPECS[name][compact ? "compact" : "wide"];

/** GPU bytes for one RGBA8 texture with a full mipmap chain (about 4/3 of the base level). */
export const textureBytes = ([width, height]: readonly [number, number]) => Math.round(width * height * 4 * 4 / 3);

/**
 * Upper bound on room texture memory.
 * DECISION: 12 MB on wide screens and 4 MB on narrow screens (under 760 px). Measured totals are
 * documented in docs/design/materials.md and enforced by tests/studio-materials.test.ts.
 */
export const TEXTURE_BUDGET = { wide: 12 * 1024 * 1024, compact: 4 * 1024 * 1024 } as const;

export function textureMemory(compact: boolean) {
  return (Object.keys(TEXTURE_SPECS) as TextureName[]).reduce((sum, name) => sum + textureBytes(textureSize(name, compact)), 0);
}
