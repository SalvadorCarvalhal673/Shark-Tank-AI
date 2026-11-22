// Studio layout and visual kit tokens for the "Rooftop VC Boardroom" concept (Issue #1).
// Pure data: no React, no DOM, no financial or session imports.

/** Investor seat X positions. Must match the avatar positions in scene.tsx and the camera presets in model.ts. */
export const SEAT_X = [-2.5, 0, 2.5] as const;
/** Chairs sit slightly behind the avatar origin so the seated rig rests on the cushion. */
export const SEAT_Z = -0.11;

export const ROOM = {
  width: 16,
  depth: 14,
  centerZ: 2.5,
  ceilingY: 4.9,
  /** Glass curtain wall behind the investors. */
  glassZ: -3.4,
  deskTopY: 1.2,
} as const;

/**
 * Founder pitch mark: in the foreground, centred on the panel axis and below every camera's
 * line of sight, so it frames the investors without hiding them. The lectern stays off-axis.
 */
export const FOUNDER = { z: 4.0, ringInner: 0.7, ringOuter: 0.76, lecternX: 3.6, lecternZ: 4.3, lecternYaw: 0.5 } as const;

/** Visual kit palette. Documented in docs/design/studio-visual-kit.md. */
export const PALETTE = {
  walnut: "#5a3a24",
  walnutDark: "#5b3a24",
  oak: "#c4a27a",
  concrete: "#d6d1c8",
  ceiling: "#c9c4bb",
  stone: "#d8d2c7",
  leather: "#8a4b2a",
  brass: "#c9a063",
  blackSteel: "#1d1e20",
  rug: "#5d6763",
  glass: "#9fb8c8",
  plant: "#3f5e3a",
  pot: "#2a2724",
  skyline: "#69727f",
  skyTop: "#6f9ed1",
  skyMid: "#b9c6d8",
  skyWarm: "#f0c08e",
  skyLow: "#fbe2b4",
  fog: "#eadcc8",
} as const;

/** Rendering budget for the room alone; avatars and UI share the global studio budget. */
export const ROOM_BUDGET = { maxTriangles: 60000, maxMaterials: 22 } as const;
