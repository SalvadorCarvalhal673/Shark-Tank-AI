// Studio layout and visual kit tokens for the "Rooftop VC Boardroom" concept (Issue #1).
// Pure data: no React, no DOM, no financial or session imports.

/** Investor seat X positions. Must match the avatar positions in scene.tsx and the camera presets in model.ts. */
export const SEAT_X = [-2.5, 0, 2.5] as const;
/**
 * Seated body envelope of the original investor rig (public/studio/investor-v1.glb), measured over
 * every frame of every clip (Listening, Offering, Withdrawal) in avatar space. Furniture is designed
 * around it and tests/studio-room.test.ts re-measures the rig, so a new rig that no longer fits fails.
 */
export const SEATED_BODY = {
  hipUnderside: 0.6,
  backOfTorso: -0.21,
  headLowest: 1.63,
  forearmUnderside: 1.19,
  torsoHalfWidth: 0.34,
} as const;

/** Chair seat-cushion centre on z; the cushion runs from behind the hips to just short of the knees. */
export const SEAT_Z = 0.08;

/**
 * Chair dimensions (metres), derived from SEATED_BODY with small clearances.
 * DECISION: the cushion top sits 5 mm under the hips and the arm pads stay clear of the torso,
 * so the seated investors rest on the chairs instead of sinking 14 to 16 cm into them.
 */
export const CHAIR = {
  cushionTop: SEATED_BODY.hipUnderside - 0.005,
  cushionThickness: 0.11,
  cushionWidth: 0.66,
  cushionDepth: 0.62,
  /** Channel-tufted back: horizontal rolls on a slight recline, stopping below the head. */
  backRolls: 6,
  backRollRadius: 0.072,
  backBottomY: 0.72,
  backStep: 0.15,
  backFrontAtBottom: SEATED_BODY.backOfTorso - 0.025,
  recline: 0.15,
  armX: 0.4,
  armPadTop: 0.845,
} as const;

export const ROOM = {
  width: 16,
  depth: 14,
  centerZ: 2.5,
  ceilingY: 4.9,
  /** Glass curtain wall behind the investors. */
  glassZ: -3.4,
  /** Origin of the desk slab; its finished surface is DESK_SURFACE_Y. */
  deskTopY: 1.15,
} as const;

/**
 * Finished desk surface: the slab origin plus its 2 cm bevel. 2 cm under the investors' forearms so
 * resting hands no longer pass through the stone; desk props are placed on this height.
 */
export const DESK_SURFACE_Y = ROOM.deskTopY + 0.02;

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
export const ROOM_BUDGET = { maxTriangles: 60000, maxMaterials: 23 } as const;
