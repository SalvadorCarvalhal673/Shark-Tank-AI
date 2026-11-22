// Builds the static studio architecture as one merged geometry per material.
// Pure Three.js geometry (no DOM, textures or React), so it can be unit tested in Node.
//
// DECISION: every static part is merged by material. The rendered room therefore costs one draw
// call per material (about 20) instead of one per object (about 400 in the unmerged concept),
// which keeps the whole studio inside the 60 draw-call phone budget enforced by the browser suite.
import {
  BoxGeometry, BufferGeometry, CapsuleGeometry, CatmullRomCurve3, CircleGeometry, Color, CylinderGeometry, Euler,
  ExtrudeGeometry, Float32BufferAttribute, Matrix4, PlaneGeometry, QuadraticBezierCurve3, Quaternion, RingGeometry,
  Shape, SphereGeometry, TubeGeometry, Vector3,
} from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { CHAIR, DESK_SURFACE_Y, FOUNDER, PALETTE, ROOM, SEAT_X, SEAT_Z } from "./layout.ts";

export const ROOM_MATERIALS = [
  "floor", "rug", "ceiling", "oak", "walnut", "walnutDark", "concrete", "stone", "leather", "brass",
  "steel", "glass", "glow", "plant", "dark", "paper", "books", "skyline", "contact", "founderMark", "art", "reeded",
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
  /** Closed furniture volumes the seated investors must never enter; used by the fit tests. */
  readonly solids: BufferGeometry[] = [];
  solid(material: RoomMaterial, source: BufferGeometry, position?: Vec3, rotation?: Vec3, scale?: Vec3) {
    this.solids.push(this.add(material, source, position, rotation, scale).clone());
  }
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
    return geometry;
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

/** Front edge of the desk at floor level, used by the skirt, plinth and kick rail. */
function deskFrontCurve(inset = 0, y = 0) {
  return new QuadraticBezierCurve3(new Vector3(-3.9, y, 1.34 - inset), new Vector3(0, y, 2.38 - inset), new Vector3(3.9, y, 1.34 - inset));
}

/** Width of one vertical reed on the desk front, in metres. */
export const REED_WIDTH = .04;

/**
 * Curved panel that follows the front edge of the desk. The u coordinate counts reeds along the
 * curve, so the reeded walnut texture keeps a constant 4 cm reed width.
 * DECISION: the walnut front is reeded (vertical flutes) so the desk reads as joinery rather than
 * a placeholder board. The reeds are painted in the texture, not modelled: modelled flutes needed
 * about 2,600 sliver triangles, which slowed the software renderer used by CI by about 15 %.
 */
function deskSkirt(bottom: number, top: number, inset = 0) {
  const curve = deskFrontCurve(inset), columns = 48, reeds = Math.round(curve.getLength() / REED_WIDTH);
  const position: number[] = [], uv: number[] = [], index: number[] = [];
  const point = new Vector3();
  for (let i = 0; i <= columns; i++) {
    const t = i / columns;
    curve.getPointAt(t, point);
    position.push(point.x, bottom, point.z, point.x, top, point.z);
    uv.push(t * reeds, 0, t * reeds, 1);
    if (i) { const a = (i - 1) * 2; index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(position, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return geometry;
}

/** Rotates a prop, then lifts it so its lowest point rests exactly on the desk surface. */
export function restOnDesk(source: BufferGeometry, x: number, z: number, rotation: Vec3 = [0, 0, 0]) {
  source.applyMatrix4(new Matrix4().makeRotationFromEuler(new Euler(...rotation)));
  source.computeBoundingBox();
  source.translate(x, DESK_SURFACE_Y - source.boundingBox!.min.y, z);
  return source;
}

/** Per-seat desk dressing. Exported so tests can check every prop rests on the surface. */
export function deskProps(seatX: number): { material: RoomMaterial; geometry: BufferGeometry }[] {
  return [
    { material: "dark", geometry: restOnDesk(new RoundedBoxGeometry(.34, .02, .24, 1, .008), seatX - .12, 1.25, [0, .15, 0]) },
    { material: "paper", geometry: restOnDesk(new BoxGeometry(.22, .01, .3), seatX + .28, 1.3, [0, -.2, 0]) },
    { material: "glass", geometry: restOnDesk(new CylinderGeometry(.035, .03, .14, 12), seatX + .5, 1.05) },
    { material: "brass", geometry: restOnDesk(new RoundedBoxGeometry(.5, .08, .04, 1, .01), seatX, 1.62, [-.35, 0, 0]) },
  ];
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
  const slabBottom = ROOM.deskTopY - .09;
  b.solid("stone", new ExtrudeGeometry(top, { depth: .07, bevelEnabled: true, bevelThickness: .02, bevelSize: .025, bevelSegments: 2, curveSegments: 32 }),
    [0, ROOM.deskTopY, 0], [Math.PI / 2, 0, 0]);
  // Brass edge band, flush with the finished surface and as deep as the slab.
  b.add("brass", new ExtrudeGeometry(inlay, { depth: .11, bevelEnabled: false, curveSegments: 32 }), [0, DESK_SURFACE_Y, 0], [Math.PI / 2, 0, 0]);
  // Dark shadow reveal under the slab, so the stone appears to float above the walnut.
  b.add("dark", deskSkirt(slabBottom - .035, slabBottom, .025));
  b.add("reeded", deskSkirt(.16, slabBottom - .035));
  // Recessed dark plinth and a brass kick rail at the foot of the skirt.
  b.add("dark", deskSkirt(0, .16, .04));
  b.add("brass", new TubeGeometry(deskFrontCurve(.01, .16), 64, .012, 6, false));
  for (const x of [-3.4, 3.4]) {
    b.solid("walnutDark", new RoundedBoxGeometry(.22, slabBottom, .5, 2, .04), [x, slabBottom / 2, 1.05]);
    b.add("brass", new BoxGeometry(.24, .03, .52), [x, .015, 1.05]);
  }
  for (const x of SEAT_X) for (const prop of deskProps(x)) b.add(prop.material, prop.geometry);
}

/**
 * Channel-tufted executive chair sized to SEATED_BODY (see layout.ts).
 * DECISION: the back is built from horizontal leather rolls rather than one flat slab. Rolls read
 * as sculpted upholstery in the close investor cameras and are closed shapes, so they can be tested
 * for body intersections. Tessellation is deliberately coarse (about 4,000 triangles for all three
 * chairs): the desk and investors hide most of each chair, and denser chairs pushed the software
 * renderer used by CI below the frame rate its camera test needs.
 */
function addChair(b: Builder, x: number) {
  const c = CHAIR, at = (dx: number, y: number, dz: number): Vec3 => [x + dx, y, SEAT_Z + dz];
  // Seat: cushion, front waterfall roll, dark shell and tilt mechanism.
  b.solid("leather", new RoundedBoxGeometry(c.cushionWidth, c.cushionThickness, c.cushionDepth - .06, 2, .045),
    at(0, c.cushionTop - c.cushionThickness / 2, -.03));
  b.solid("leather", new CapsuleGeometry(.05, c.cushionWidth - .1, 2, 10), at(0, c.cushionTop - .05, c.cushionDepth / 2 - .05), [0, 0, Math.PI / 2]);
  b.add("dark", new BoxGeometry(c.cushionWidth - .04, .04, c.cushionDepth - .04), at(0, c.cushionTop - c.cushionThickness - .02, 0));
  b.add("dark", new BoxGeometry(.22, .06, .2), at(0, c.cushionTop - c.cushionThickness - .07, 0));
  // Back: reclined stack of rolls on a leather shell that stops below the head.
  const rollZ = (y: number) => c.backFrontAtBottom - c.backRollRadius * .7 - (y - c.backBottomY) * c.recline;
  for (let i = 0; i < c.backRolls; i++) {
    const y = c.backBottomY + i * c.backStep;
    b.solid("leather", new CapsuleGeometry(c.backRollRadius, c.cushionWidth - .16, 2, 10), [x, y, rollZ(y)],
      [-Math.atan(c.recline), 0, Math.PI / 2], [1, 1, .7]);
  }
  const backMid = c.backBottomY + (c.backRolls - 1) * c.backStep / 2, backHeight = (c.backRolls - 1) * c.backStep + .2;
  b.solid("leather", new RoundedBoxGeometry(c.cushionWidth - .02, backHeight, .06, 1, .025),
    [x, backMid, rollZ(backMid) - c.backRollRadius * .7 - .02], [-Math.atan(c.recline), 0, 0]);
  // Arms: polished steel loops from under the seat, topped with padded leather.
  for (const s of [-1, 1]) {
    const ax = s * c.armX, low = c.cushionTop - c.cushionThickness - .02, pad = c.armPadTop - .04;
    const loop = new CatmullRomCurve3([
      new Vector3(ax * .9, low, .2), new Vector3(ax, pad - .05, .22), new Vector3(ax, pad, .12),
      new Vector3(ax, pad, -.12), new Vector3(ax, pad - .05, -.2), new Vector3(ax * .9, low, -.18),
    ]);
    b.add("steel", new TubeGeometry(loop, 16, .014, 5, false), [x, 0, SEAT_Z]);
    b.solid("leather", new RoundedBoxGeometry(.075, .04, .36, 1, .018), at(ax, c.armPadTop - .02, 0));
  }
  // Base: gas column, five tapered aluminium arms and casters.
  const columnTop = c.cushionTop - c.cushionThickness - .1;
  b.add("steel", new CylinderGeometry(.024, .028, columnTop - .1, 8), at(0, (columnTop + .1) / 2, 0));
  b.add("dark", new CylinderGeometry(.042, .05, .14, 8), at(0, .17, 0));
  b.add("steel", new CylinderGeometry(.06, .07, .05, 10), at(0, .085, 0));
  for (let k = 0; k < 5; k++) {
    const a = k / 5 * Math.PI * 2 + Math.PI / 2, arm = new BoxGeometry(.3, .035, .05, 4, 1, 1);
    const p = arm.attributes.position;
    for (let i = 0; i < p.count; i++) { const u = (p.getX(i) + .15) / .3; p.setZ(i, p.getZ(i) * (1 - u * .4)); p.setY(i, p.getY(i) * (1 - u * .3) - u * .02); }
    arm.computeVertexNormals();
    b.add("steel", arm, at(Math.cos(a) * .17, .085, Math.sin(a) * .17), [0, -a, 0]);
    b.add("dark", new CylinderGeometry(.028, .028, .03, 8), at(Math.cos(a) * .32, .03, Math.sin(a) * .32), [Math.PI / 2, -a, 0]);
    b.add("dark", new BoxGeometry(.035, .04, .03), at(Math.cos(a) * .32, .065, Math.sin(a) * .32), [0, -a, 0]);
  }
}

function addChairs(b: Builder) {
  for (const x of SEAT_X) addChair(b, x);
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
  SEAT_X.forEach(x => decal(x, SEAT_Z, 1.0, 1.0));
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

/** Only the desk and chairs, with their closed volumes, for the seated-fit tests. */
export function buildInvestorFurniture() {
  const b = new Builder();
  addDesk(b);
  addChairs(b);
  const { solids } = b;
  b.finish().dispose();
  return solids;
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

