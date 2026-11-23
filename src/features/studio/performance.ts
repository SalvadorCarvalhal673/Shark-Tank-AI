// Documented studio performance budgets (Issue #12), as data so tests and the measurement script
// (scripts/measure-studio.mjs) compare against one source. Values come from docs/3D-STUDIO.md.
export const STUDIO_BUDGETS = {
  /** Critical transfer: desktop / physical mobile, bytes. */
  transferBytes: { desktop: 8 * 1024 * 1024, mobile: 5 * 1024 * 1024 },
  /** Triangles drawn in any view: desktop / phone. */
  triangles: { desktop: 150000, phone: 90000 },
  /** Draw calls in any view: desktop / phone. */
  drawCalls: { desktop: 100, phone: 60 },
  /** Target frame rate: desktop / physical mobile. Only physical devices can prove these. */
  fps: { desktop: 60, mobile: 30 },
  /** Maximum rendered device-pixel ratio: wide / narrow (< 760 px) windows (scene.tsx). */
  maxDpr: { wide: 1.5, narrow: 1 },
} as const;

/**
 * Draw calls each investor instance may use (Issue #12).
 * DECISION (approved): six for the shared body (skin, jacket, trousers, brows, shirt, eyes) plus two
 * for the investor's features (merged Features + Brass). Three investors use 24 of the 60 phone draws.
 */
export const DRAWS_PER_INVESTOR = 8;
