// Builds the static studio architecture as one merged geometry per material.
// Pure Three.js geometry (no DOM, textures or React), so it can be unit tested in Node.
//
// DECISION: every static part is merged by material. The rendered room therefore costs one draw
// call per material (about 20) instead of one per object (about 400 in the unmerged concept),
// which keeps the whole studio inside the 60 draw-call phone budget enforced by the browser suite.
import {
  BoxGeometry, BufferGeometry, CircleGeometry, Color, CylinderGeometry, Euler, ExtrudeGeometry,
  Float32BufferAttribute, Matrix4, PlaneGeometry, QuadraticBezierCurve3, Quaternion, RingGeometry,
  Shape, SphereGeometry, Vector3,
} from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { FOUNDER, PALETTE, ROOM, SEAT_X, SEAT_Z } from "./layout.ts";

export const ROOM_MATERIALS = [
  "floor", "rug", "ceiling", "oak", "walnut", "walnutDark", "concrete", "stone", "leather", "brass",
  "steel", "glass", "glow", "plant", "dark", "paper", "books", "skyline", "contact", "founderMark", "art",
] as const;
export type RoomMaterial = typeof ROOM_MATERIALS[number];
export type RoomGeometry = { parts: Map<RoomMaterial, BufferGeometry>; triangles: number; dispose: () => void };

type Vec3 = readonly [number, number, number];
/** Panel camera position (model.ts cameraPresets.panel), used only to order geometry for the depth test. */
const PANEL_EYE: Vec3 = [0, 3.1, 9.2];
const ATTRIBUTES = ["position", "normal", "uv"] as const;

/** Deterministic pseudo-random sequence so every build (and test) produces identical geometry. */
export function seededRandom(seed: number) {
  let state = seed;
  return () => (state = (state * 16807) % 2147483647) / 2147483647;
}

class Builder {
  private groups = new Map<RoomMaterial, BufferGeometry[]>();
  add(material: RoomMaterial, source: BufferGeometry, position: Vec3 = [0, 0, 0], rotation: Vec3 = [0, 0, 0],
    scale: Vec3 = [1, 1, 1], color?: string) {
    const geometry = source.index ? source.toNonIndexed() : source.clone();
    source.dispose();
    for (const name of Object.keys(geometry.attributes)) {
      if (!(ATTRIBUTES as readonly string[]).includes(name)) geometry.deleteAttribute(name);
    }
    if (material === "books" || material === "skyline") {
      const tint = new Color(color ?? "#ffffff");
      const colors = new Float32Array(geometry.attributes.position.count * 3);
      for (let i = 0; i < colors.length; i += 3) { colors[i] = tint.r; colors[i + 1] = tint.g; colors[i + 2] = tint.b; }
      geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
    }
    geometry.applyMatrix4(new Matrix4().compose(new Vector3(...position),
      new Quaternion().setFromEuler(new Euler(...rotation)), new Vector3(...scale)));
    const list = this.groups.get(material) ?? [];
    list.push(geometry);
    this.groups.set(material, list);
  }
  finish(): RoomGeometry {
    const parts = new Map<RoomMaterial, BufferGeometry>();
    let triangles = 0;
    const eye = new Vector3(...PANEL_EYE), centre = new Vector3();
    for (const [material, list] of this.groups) {
      // Near parts first inside each merged buffer, so the depth test rejects the hidden pixels of
      // farther parts (overlapping skyline towers, chair bases behind the desk) before shading.
      const sorted = list.map(geometry => {
        geometry.computeBoundingBox();
        return { geometry, distance: geometry.boundingBox!.getCenter(centre).distanceTo(eye) };
      }).sort((a, b) => a.distance - b.distance).map(entry => entry.geometry);
      const merged = mergeGeometries(sorted, false);
      list.forEach(geometry => geometry.dispose());
      if (!merged) throw new Error(`Could not merge studio geometry for ${material}`);
      merged.computeBoundingSphere();
      triangles += merged.attributes.position.count / 3;
      parts.set(material, merged);
    }
    return { parts, triangles, dispose: () => parts.forEach(geometry => geometry.dispose()) };
  }
}

function deskShapes() {
  const top = new Shape();
  top.moveTo(-3.95, .56); top.quadraticCurveTo(0, .12, 3.95, .56);
  top.lineTo(4.05, 1.38); top.quadraticCurveTo(0, 2.45, -4.05, 1.38); top.closePath();
  const inlay = new Shape();
  inlay.moveTo(-4.0, 1.40); inlay.quadraticCurveTo(0, 2.47, 4.0, 1.40);
  inlay.lineTo(4.05, 1.44); inlay.quadraticCurveTo(0, 2.52, -4.05, 1.44); inlay.closePath();
  return { top, inlay };
}

/** Curved modesty panel that follows the front edge of the desk. */
function deskSkirt() {
  const curve = new QuadraticBezierCurve3(new Vector3(-3.9, 0, 1.34), new Vector3(0, 0, 2.38), new Vector3(3.9, 0, 1.34));
  const points = curve.getPoints(32);
  const position: number[] = [], uv: number[] = [], index: number[] = [];
  points.forEach((p, i) => {
    position.push(p.x, .12, p.z, p.x, 1.12, p.z);
    uv.push(i / 32 * 4, 0, i / 32 * 4, 1);
    if (i) { const a = (i - 1) * 2; index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  });
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(position, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return geometry;
}

function addShell(b: Builder) {
  const { width, depth, centerZ, ceilingY, glassZ } = ROOM;
  b.add("floor", new BoxGeometry(width, .1, depth), [0, -.05, centerZ]);
  b.add("rug", new PlaneGeometry(6.4, 3.6), [0, .006, 1.0], [-Math.PI / 2, 0, 0]);
  b.add("ceiling", new BoxGeometry(width, .1, depth), [0, ceilingY + .05, centerZ]);
  for (let x = -7.5; x <= 7.5; x += .4) b.add("oak", new BoxGeometry(.1, .12, 9), [x, ceilingY - .07, 1]);
  // Curtain wall frame. DECISION: no full-height transparent glass pane; at the camera distance it
  // was nearly invisible but cost a blended full-screen layer. Mullions and transoms read as glazing.
  for (let x = -8; x <= 8; x += 2) b.add("steel", new BoxGeometry(.07, ceilingY, .12), [x, ceilingY / 2, glassZ]);
  b.add("steel", new BoxGeometry(width, .08, .14), [0, .04, glassZ]);
  b.add("steel", new BoxGeometry(width, .1, .14), [0, ceilingY - .05, glassZ]);
  // Left: walnut slat feature wall. Right: pale board-formed concrete.
  b.add("walnutDark", new BoxGeometry(.1, ceilingY, depth), [-width / 2, ceilingY / 2, centerZ]);
  for (let z = -3.2; z <= 6; z += .22) b.add("walnut", new BoxGeometry(.1, ceilingY - .2, .12), [-width / 2 + .1, ceilingY / 2, z]);
  b.add("concrete", new BoxGeometry(.1, ceilingY, depth), [width / 2, ceilingY / 2, centerZ]);
  // Rooftop terrace and balustrade just outside the glass.
  b.add("concrete", new BoxGeometry(width, .1, 4), [0, -.06, glassZ - 2.1]);
  b.add("glass", new BoxGeometry(width, 1.05, .05), [0, .52, glassZ - 4]);
  b.add("steel", new BoxGeometry(width, .05, .08), [0, 1.06, glassZ - 4]);
}

function addDesk(b: Builder) {
  const { top, inlay } = deskShapes();
  b.add("stone", new ExtrudeGeometry(top, { depth: .07, bevelEnabled: true, bevelThickness: .02, bevelSize: .025, bevelSegments: 2, curveSegments: 32 }),
    [0, ROOM.deskTopY, 0], [Math.PI / 2, 0, 0]);
  b.add("brass", new ExtrudeGeometry(inlay, { depth: .08, bevelEnabled: false, curveSegments: 32 }), [0, ROOM.deskTopY + .005, 0], [Math.PI / 2, 0, 0]);
  b.add("walnut", deskSkirt());
  for (const x of [-3.4, 3.4]) b.add("walnutDark", new RoundedBoxGeometry(.22, 1.12, .5, 2, .04), [x, .56, 1.05]);
  // Desk dressing per seat: tablet, notepad, water glass and brass name plate.
  SEAT_X.forEach(x => {
    b.add("dark", new RoundedBoxGeometry(.34, .02, .24, 1, .008), [x - .12, 1.285, 1.25], [0, .15, 0]);
    b.add("paper", new BoxGeometry(.22, .01, .3), [x + .28, 1.28, 1.3], [0, -.2, 0]);
    b.add("glass", new CylinderGeometry(.035, .03, .14, 12), [x + .5, 1.34, 1.05]);
    b.add("brass", new RoundedBoxGeometry(.5, .08, .04, 1, .01), [x, 1.3, 1.62], [-.35, 0, 0]);
  });
}

function addChairs(b: Builder) {
  for (const x of SEAT_X) {
    const at = (dx: number, y: number, dz: number): Vec3 => [x + dx, y, SEAT_Z + dz];
    b.add("leather", new RoundedBoxGeometry(.78, .16, .74, 2, .07), at(0, .68, 0));
    b.add("leather", new RoundedBoxGeometry(.78, 1.05, .14, 2, .06), at(0, 1.22, -.36), [-.1, 0, 0]);
    for (const s of [-1, 1]) b.add("steel", new RoundedBoxGeometry(.07, .05, .5, 1, .02), at(s * .42, .92, -.02));
    b.add("steel", new CylinderGeometry(.04, .05, .55, 12), at(0, .36, 0));
    for (let k = 0; k < 5; k++) {
      const a = k / 5 * Math.PI * 2;
      b.add("steel", new BoxGeometry(.42, .04, .06), at(Math.cos(a) * .2, .07, Math.sin(a) * .2), [0, -a, 0]);
    }
  }
}

function addFounderMark(b: Builder) {
  // DECISION: the founder is the player, so the scene marks the pitch position instead of drawing
  // a founder avatar that would sit between the cameras and the investors.
  b.add("brass", new RingGeometry(FOUNDER.ringInner, FOUNDER.ringOuter, 64), [0, .004, FOUNDER.z], [-Math.PI / 2, 0, 0]);
  b.add("founderMark", new CircleGeometry(FOUNDER.ringInner, 64), [0, .003, FOUNDER.z], [-Math.PI / 2, 0, 0]);
  b.add("walnut", new RoundedBoxGeometry(.5, 1.0, .36, 2, .03), [FOUNDER.lecternX, .5, FOUNDER.lecternZ], [0, FOUNDER.lecternYaw, 0]);
  b.add("stone", new RoundedBoxGeometry(.56, .04, .42, 1, .015), [FOUNDER.lecternX, 1.02, FOUNDER.lecternZ], [-.18, FOUNDER.lecternYaw, 0]);
}

function addLightingFixtures(b: Builder) {
  b.add("steel", new RoundedBoxGeometry(5.2, .08, .18, 1, .03), [0, 3.45, .9]);
  b.add("glow", new BoxGeometry(5.0, .02, .12), [0, 3.405, .9]);
  for (const x of [-2.2, 2.2]) b.add("steel", new CylinderGeometry(.006, .006, 1.4, 6), [x, 4.15, .9]);
}

function addPlant(b: Builder, random: () => number, x: number, z: number, size: number) {
  b.add("dark", new CylinderGeometry(.32 * size, .24 * size, .62 * size, 20), [x, .31 * size, z]);
  for (let i = 0; i < 24; i++) {
    const a = random() * Math.PI * 2, r = (.05 + random() * .28) * size, h = (.75 + random() * 1.0) * size;
    b.add("plant", new SphereGeometry(.16 * size, 7, 5), [x + Math.cos(a) * r, h, z + Math.sin(a) * r],
      [(random() - .5) * 1.2, a, (random() - .5) * 1.2], [.5, 1.6, .12]);
  }
}

function addDressing(b: Builder, random: () => number) {
  addPlant(b, random, -6.6, -2.6, 1.25);
  addPlant(b, random, 6.7, -2.6, 1.1);
  addPlant(b, random, -6.9, 4.5, 1.0);
  // Walnut credenzas with brass kick strips under each window corner.
  for (const x of [-5.4, 5.4]) {
    b.add("walnut", new RoundedBoxGeometry(2.6, .7, .5, 2, .03), [x, .4, -2.8]);
    b.add("brass", new BoxGeometry(2.62, .03, .52), [x, .06, -2.8]);
  }
  b.add("paper", new CylinderGeometry(.12, .16, .42, 20), [-6.1, .96, -2.8]);
  b.add("brass", new SphereGeometry(.16, 20, 14), [-4.9, .91, -2.8]);
  b.add("books", new BoxGeometry(.5, .06, .34), [-5.4, .78, -2.8], undefined, undefined, "#22324c");
  b.add("dark", new CylinderGeometry(.1, .1, .55, 16), [6.0, 1.02, -2.8]);
  // Floating shelves and books on the concrete wall.
  const wallX = ROOM.width / 2 - .28;
  for (const y of [1.6, 2.4]) b.add("walnut", new BoxGeometry(.45, .06, 3.2), [wallX, y, .6]);
  const bookColors = ["#1f2f2a", "#6e2e1e", "#c9b79a", "#22324c"];
  for (let i = 0; i < 14; i++) {
    const h = .22 + random() * .12;
    b.add("books", new BoxGeometry(.28, h, .05 + random() * .04), [wallX - .02, 1.63 + h / 2, -.6 + i * .12], undefined, undefined, bookColors[i % 4]);
  }
  // Framed original abstract artwork (texture painted in code).
  b.add("steel", new BoxGeometry(.06, 1.7, 1.3), [ROOM.width / 2 - .08, 2.6, 3.2]);
  b.add("art", new PlaneGeometry(1.2, 1.6), [ROOM.width / 2 - .12, 2.6, 3.2], [0, -Math.PI / 2, 0]);
}

/**
 * Soft contact shadows painted as decals instead of real-time shadow maps.
 * DECISION: shadow maps would roughly double the draw calls (a second pass per caster) and are
 * expensive on phones; decals ground the furniture at almost no cost. Lighting work in Issue #4
 * can revisit this with measurements.
 */
function addContactShadows(b: Builder) {
  const decal = (x: number, z: number, w: number, d: number) =>
    b.add("contact", new PlaneGeometry(w, d), [x, .009, z], [-Math.PI / 2, 0, 0]);
  decal(0, 1.2, 9.4, 2.6);
  SEAT_X.forEach(x => decal(x, SEAT_Z, 1.2, 1.2));
  for (const [x, z] of [[-6.6, -2.6], [6.7, -2.6], [-6.9, 4.5]] as const) decal(x, z, 1.3, 1.3);
  for (const x of [-5.4, 5.4]) decal(x, -2.8, 3.0, .9);
  decal(FOUNDER.lecternX, FOUNDER.lecternZ, .8, .7);
}

/**
 * Distant city outside the glass.
 * DECISION: the studio camera's far plane is 40 m (owned by scene.tsx and the camera issue), so the
 * skyline is a scaled miniature 6 to 22 m beyond the glass, faded by fog to read as distance. Towers
 * are flat, unlit, vertex-coloured silhouettes: solid textured boxes overlapped heavily on screen and
 * were the single most expensive part of the room on software renderers.
 */
function addSkyline(b: Builder, random: () => number) {
  const tones = ["#8792a3", "#95a0b0", "#7d8899", "#a2abb9"];
  for (let i = 0; i < 30; i++) {
    const depth = 6 + random() * 16, z = ROOM.glassZ - 4.5 - depth;
    const x = (random() - .5) * (14 + depth * 2.2);
    const h = 3 + random() * random() * 13 + depth * .25, w = 1.2 + random() * 2.2;
    b.add("skyline", new PlaneGeometry(w, h), [x, -6 + h / 2, z], undefined, undefined, tones[i % tones.length]);
  }
}

/**
 * Late-afternoon sky backdrop, 84 x 36 m, placed inside the camera's 40 m far plane.
 * DECISION: the gradient and sun glow are vertex colours rather than a texture, because a
 * full-screen textured layer halved the frame rate on the software renderer used by CI.
 */
export function createSkyGeometry() {
  const geometry = new PlaneGeometry(84, 36, 24, 12);
  const position = geometry.attributes.position;
  const stops = [PALETTE.skyLow, PALETTE.skyWarm, PALETTE.skyMid, PALETTE.skyTop].map(hex => new Color(hex));
  const sun = new Color("#fff4dc"), color = new Color(), colors = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), t = Math.min(Math.max((position.getY(i) + 18) / 36, 0), 1);
    const scaled = Math.min(t * 1.6, 2.999), band = Math.floor(scaled);
    color.copy(stops[band]).lerp(stops[band + 1], scaled - band);
    const glow = Math.max(0, 1 - Math.hypot(x + 14, (position.getY(i) + 9) * 1.6) / 18);
    color.lerp(sun, glow * glow * .8);
    colors.set([color.r, color.g, color.b], i * 3);
  }
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  return geometry;
}

export function buildStudioRoom(seed = 42): RoomGeometry {
  const random = seededRandom(seed);
  const b = new Builder();
  addShell(b);
  addDesk(b);
  addChairs(b);
  addFounderMark(b);
  addLightingFixtures(b);
  addDressing(b, random);
  addContactShadows(b);
  addSkyline(b, random);
  return b.finish();
}

