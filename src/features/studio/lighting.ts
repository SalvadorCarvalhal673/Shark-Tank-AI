// Cinematic lighting rig for the studio (Issue #4). Pure data so the composition can be reviewed
// and tested without a browser; studio-room.tsx renders it.
//
// DECISION: classic three-point lighting with no post-processing and no shadow maps.
//  - Key: warm directional light from front-left and above, the camera side, so faces are lit.
//  - Fill: the sky/ground hemisphere, soft and low, so shadow sides never go black.
//  - Rim: the low sun behind the glass, so heads and shoulders separate from the bright window.
// The previous rig leaned on strong ambient and hemisphere light, which flattened the investors.

type Vec3 = readonly [number, number, number];
export type LightSpec =
  | { kind: "hemisphere"; role: "fill"; sky: string; ground: string; intensity: number }
  | { kind: "directional"; role: "key" | "rim"; color: string; intensity: number; position: Vec3 };

const fill: LightSpec = { kind: "hemisphere", role: "fill", sky: "#fff4e6", ground: "#8a6d58", intensity: 2.0 };
const key: LightSpec = { kind: "directional", role: "key", color: "#ffe6c8", intensity: 2.7, position: [-4, 5.5, 7] };
const rim: LightSpec = { kind: "directional", role: "rim", color: "#ffc98f", intensity: 2.6, position: [-6, 4.2, -10] };

/**
 * Tiers chosen by screen width, like the textures.
 * DECISION: both tiers use the same three lights. A fourth light for wide screens, a soft spot that
 * pooled light on the desk, was measured and rejected: it cut the CI software renderer from 10 to
 * 8 fps and made its camera test fail intermittently. Spot lights cost the most per pixel. Tiers stay
 * separate so Issue #12 can trim phones further if real-device measurements require it.
 */
export const LIGHTING_TIERS = {
  wide: [fill, key, rim],
  compact: [fill, key, rim],
} as const satisfies Record<string, readonly LightSpec[]>;
export type LightingTier = keyof typeof LIGHTING_TIERS;

/** At most this many real-time lights per tier; post-processing and shadow maps are not used. */
export const LIGHT_BUDGET = { wide: 3, compact: 3 } as const;

/** Exposure applied while the studio is mounted (restored on unmount). */
export const STUDIO_EXPOSURE = 1.25;
