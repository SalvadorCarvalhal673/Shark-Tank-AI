// Original procedural artwork for Shark Tank AI, 2026. No downloaded models/textures.
// Regenerate with: node scripts/create-studio-avatar.mjs
//
// Builds the whole investor cast into one GLB following the rig contract in
// src/features/studio/rig.ts (Issue #8): one shared seated skeleton and clip set, one shared body
// mesh, and one feature mesh per investor (hair, accessories, face details) skinned to the same
// bones, so accessories follow every animation.
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mkdir, writeFile } from "node:fs/promises";
import { CAST_BODY, castMeshName, RIG_BONES, RIG_CLIPS, RIG_MATERIALS } from "../src/features/studio/rig.ts";
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((value) => { this.result = value; this.onloadend?.(); }); }
};

// ---- Skeleton (from the contract) ----
const bones = new Map();
for (const { name, parent, position } of RIG_BONES) {
  const bone = new THREE.Bone(); bone.name = name; bone.position.set(...position);
  if (parent) bones.get(parent).add(bone);
  bones.set(name, bone);
}
const skeletonBones = RIG_BONES.map(({ name }) => bones.get(name));
const boneIndex = name => RIG_BONES.findIndex(bone => bone.name === name);
skeletonBones[0].updateMatrixWorld(true);

// ---- Rigid-skinned parts grouped by material slot ----
const material = name => RIG_MATERIALS.indexOf(name);
function meshBuilder({ colors = false } = {}) {
  const groups = RIG_MATERIALS.map(() => []);
  return {
    /** tint multiplies the slot colour (vertex colour); only meshes built with colors:true keep it. */
    part(geometry, center, scale, bone, slot, rotation = [0, 0, 0], tint = [1, 1, 1]) {
      geometry.scale(...scale);
      geometry.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...rotation)));
      geometry.translate(...center);
      const count = geometry.attributes.position.count, joint = boneIndex(bone);
      if (joint < 0) throw new Error("Unknown bone " + bone);
      const indices = new Uint16Array(count * 4), weights = new Float32Array(count * 4);
      for (let i = 0; i < count; i++) { indices[i * 4] = joint; weights[i * 4] = 1; }
      geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(indices, 4));
      geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(weights, 4));
      // No textures use UVs, so they are dropped to keep the download small (Issue #5 transfer budget).
      geometry.deleteAttribute("uv");
      if (colors) geometry.setAttribute("color", new THREE.Float32BufferAttribute(new Array(count).fill(tint).flat(), 3));
      groups[material(slot)].push(geometry);
    },
    build(name, materials) {
      const used = groups.map((items, i) => ({ items, i })).filter(entry => entry.items.length);
      const geometry = mergeGeometries(used.map(entry => mergeGeometries(entry.items)), true);
      const mesh = new THREE.SkinnedMesh(geometry, used.map(entry => materials[entry.i]));
      mesh.name = name;
      return mesh;
    },
  };
}
const box = () => new THREE.BoxGeometry(1, 1, 1);
/** Tessellation by visibility: faces get the most detail, limbs the least (Issue #5 triangle budget). */
const sphere = (w = 12, h = 8) => new THREE.SphereGeometry(1, w, h);
const fine = () => sphere(20, 14), medium = () => sphere(14, 10), small = () => sphere(10, 7);
const rounded = (w, h, d, r = .3) => mergeVertices(new RoundedBoxGeometry(w, h, d, 2, r * Math.min(w, h, d)));

// ---- Shared body: same proportions for the whole cast (Issues #5-#7) ----
// Every part keeps the Phase 4A silhouette, so the measured seated envelope and chair fit hold.
const body = meshBuilder({ colors: true });
const lips = [.86, .64, .6], white = [.97, .96, .93], iris = [.24, .16, .11], pupil = [.05, .04, .04];
// Torso, collarbones and a soft shirt front.
body.part(sphere(16, 10), [0, 1.32, 0], [.34, .47, .21], "Chest", "Jacket");
body.part(rounded(.22, .27, .06), [0, 1.55, .17], [1, 1, 1], "Chest", "Shirt");
// Neck and head: egg-shaped cranium, jaw, cheeks, ears and nose.
body.part(small(), [0, 1.80, 0], [.098, .16, .098], "Head", "Skin");
body.part(fine(), [0, 2.04, 0], [.215, .265, .212], "Head", "Skin");
for (const x of [-.212, .212]) body.part(small(), [x, 2.03, -.01], [.03, .058, .042], "Head", "Skin");
body.part(medium(), [0, 1.995, .205], [.026, .05, .04], "Head", "Skin", [-.25, 0, 0]);
body.part(small(), [0, 1.972, .214], [.02, .012, .016], "Head", "Skin");
// Eyes: white, iris and pupil share the Eyes slot through vertex colours (no extra draw calls).
for (const x of [-.083, .083]) {
  body.part(small(), [x, 2.07, .18], [.033, .023, .027], "Head", "Eyes", [0, 0, 0], white);
  body.part(small(), [x, 2.07, .199], [.016, .016, .01], "Head", "Eyes", [0, 0, 0], iris);
  body.part(sphere(), [x, 2.07, .206], [.008, .008, .005], "Head", "Eyes", [0, 0, 0], pupil);
}
// Brows and mouth ride the facial bones so reactions can move them (Issue #10).
for (const [x, bone, tilt] of [[-.087, "LeftBrow", .08], [.087, "RightBrow", -.08]]) body.part(rounded(.075, .016, .016, .45), [x, 2.13, .2], [1, 1, 1], bone, "Hair", [0, 0, tilt]);
body.part(small(), [0, 1.918, .2], [.044, .012, .018], "Jaw", "Skin", [0, 0, 0], lips);
body.part(small(), [0, 1.903, .197], [.038, .012, .017], "Jaw", "Skin", [0, 0, 0], lips);
// Arms, hands and legs.
for (const side of [-1, 1]) {
  const s = side < 0 ? "Left" : "Right";
  body.part(sphere(), [side * .35, 1.43, .025], [.12, .23, .12], s + "Arm", "Jacket");
  body.part(sphere(), [side * .37, 1.28, .24], [.095, .09, .23], s + "Forearm", "Jacket");
  body.part(sphere(), [side * .37, 1.28, .37], [.07, .065, .03], s + "Forearm", "Shirt");
  body.part(small(), [side * .37, 1.272, .44], [.07, .045, .095], s + "Forearm", "Skin");
  body.part(sphere(), [side * .335, 1.275, .47], [.024, .022, .045], s + "Forearm", "Skin", [0, side * .5, 0]);
  body.part(sphere(), [side * .16, .75, .28], [.14, .14, .31], s + "Thigh", "Trousers");
  body.part(sphere(), [side * .16, .41, .56], [.10, .31, .10], s + "Shin", "Trousers");
  body.part(sphere(), [side * .16, .10, .65], [.115, .075, .20], s + "Shin", "Trousers", [0, 0, 0], [.55, .5, .48]);
}
body.part(sphere(), [0, .80, 0], [.29, .20, .19], "Pelvis", "Trousers");

/** Crown fill under the hair shell, so no scalp shows where the tilted shell leaves the top open. */
const crown = (features) => features.part(sphere(16, 8), [0, 2.17, -.01], [.226, .16, .216], "Head", "Hair");

/** Hair shell: a partial sphere just outside the cranium, open at the face so the hairline sits on the forehead. */
const hairCap = (opening = .5) => {
  const shell = new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI * opening);
  shell.scale(.232, .285, .232);
  return shell;
};

// ---- Per-investor features. Issues #5-#7 replace these with the production characters. ----
function sharedPlaceholderHair(features) {
  features.part(sphere(), [0, 2.17, -.045], [.245, .20, .20], "Head", "Hair");
  features.part(box(), [0, 2.02, -.19], [.40, .34, .07], "Head", "Hair");
}
const cast = {
  /**
   * Maya Chen, finance (Issue #5): composed and precise. Sleek dark shoulder-length hair with a side
   * part, a structured forest-green blazer with sharp lapels, a high cream collar and brass hoops.
   */
  maya(features) {
    features.part(hairCap(), [0, 2.04, 0], [1, 1, 1], "Head", "Hair", [-.55, 0, -.06]);
    crown(features);
    features.part(rounded(.44, .4, .1, .5), [0, 1.9, -.165], [1, 1, 1], "Head", "Hair");
    for (const side of [-1, 1]) {
      features.part(rounded(.07, .3, .2, .5), [side * .2, 1.94, -.02], [1, 1, 1], "Head", "Hair", [0, 0, side * .06]);
      features.part(new THREE.TorusGeometry(.024, .0045, 4, 12), [side * .222, 1.95, .005], [1, 1, 1], "Head", "Brass", [0, Math.PI / 2, 0]);
      // Peaked lapels over the shared jacket.
      features.part(rounded(.09, .3, .03, .4), [side * .095, 1.49, .2], [1, 1, 1], "Chest", "Jacket", [-.08, 0, side * .32]);
    }
    features.part(medium(), [-.06, 2.25, .1], [.12, .04, .1], "Head", "Hair", [.35, 0, .35]);
    features.part(new THREE.TorusGeometry(.105, .026, 6, 18), [0, 1.75, .015], [1, 1, .85], "Chest", "Shirt", [Math.PI / 2 - .2, 0, 0]);
  },
  adrian(features) {
    sharedPlaceholderHair(features);
    // Glasses are skinned to the Head bone, so they follow every head movement.
    for (const x of [-.088, .088]) features.part(new THREE.TorusGeometry(.052, .007, 5, 14), [x, 2.07, .21], [1, 1, 1], "Head", "Brass");
    features.part(box(), [0, 2.07, .21], [.07, .008, .008], "Head", "Brass");
  },
  sofia(features) { sharedPlaceholderHair(features); },
};

// ---- Materials (slot names are the runtime colour keys) ----
const defaults = { Skin: "#b97957", Jacket: "#283c34", Trousers: "#172321", Hair: "#201b18", Brass: "#b99b60", Shirt: "#e8dfc8", Eyes: "#ffffff" };
const materials = RIG_MATERIALS.map(name => {
  const m = new THREE.MeshStandardMaterial({ color: defaults[name], roughness: .82, metalness: name === "Brass" ? .55 : 0, flatShading: true });
  m.name = name; return m;
});

// ---- Assemble: every mesh binds to the one skeleton ----
const skeleton = new THREE.Skeleton(skeletonBones);
const root = new THREE.Group(); root.name = "OriginalSeatedCast";
const bodyMesh = body.build(CAST_BODY, materials);
bodyMesh.add(skeletonBones[0]);
root.add(bodyMesh);
root.updateMatrixWorld(true);
bodyMesh.bind(skeleton);
for (const [investor, build] of Object.entries(cast)) {
  const features = meshBuilder();
  build(features);
  const mesh = features.build(castMeshName(investor), materials);
  root.add(mesh);
  root.updateMatrixWorld(true);
  mesh.bind(skeleton);
}

// ---- Shared clips: rotation tracks only, authored once for the whole cast ----
function rotationTrack(name, times, rotations) {
  const q = rotations.flatMap(([x, y, z]) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z)).toArray());
  return new THREE.QuaternionKeyframeTrack(name + ".quaternion", times, q);
}
const clipTracks = {
  Listening: [2.8, [
    rotationTrack("Head", [0, 1.4, 2.8], [[0, 0, 0], [.025, .035, 0], [0, 0, 0]]),
    rotationTrack("Chest", [0, 1.4, 2.8], [[0, 0, 0], [.012, 0, 0], [0, 0, 0]]),
  ]],
  Offering: [1.5, [
    rotationTrack("RightArm", [0, .55, 1.5], [[0, 0, 0], [-.38, -.12, -.15], [-.1, 0, -.05]]),
    rotationTrack("RightForearm", [0, .55, 1.5], [[0, 0, 0], [-.28, 0, 0], [0, 0, 0]]),
    rotationTrack("Head", [0, .7, 1.5], [[0, 0, 0], [.09, 0, 0], [0, 0, 0]]),
  ]],
  Withdrawal: [1.7, [
    rotationTrack("Chest", [0, .8, 1.7], [[0, 0, 0], [-.14, 0, 0], [-.10, 0, 0]]),
    rotationTrack("Head", [0, .5, 1, 1.7], [[0, 0, 0], [0, .16, 0], [0, -.12, 0], [0, .04, 0]]),
  ]],
};
const clips = RIG_CLIPS.map(name => new THREE.AnimationClip(name, ...clipTracks[name]));

const result = await new GLTFExporter().parseAsync(root, { binary: true, animations: clips });
await mkdir(new URL("../public/studio/", import.meta.url), { recursive: true });
await writeFile(new URL("../public/studio/investor-v1.glb", import.meta.url), Buffer.from(result));
let triangles = 0;
root.traverse(object => { if (object.isMesh) triangles += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3; });
console.log("Original cast GLB written:", result.byteLength, "bytes;", skeletonBones.length, "bones;", clips.length, "clips; 1 body + 3 feature meshes;", triangles, "triangles in the file.");
