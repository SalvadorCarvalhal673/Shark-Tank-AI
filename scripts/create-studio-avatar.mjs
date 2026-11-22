// Original procedural artwork for Shark Tank AI, 2026. No downloaded models/textures.
// Regenerate with: node scripts/create-studio-avatar.mjs
//
// Builds the whole investor cast into one GLB following the rig contract in
// src/features/studio/rig.ts (Issue #8): one shared seated skeleton and clip set, one shared body
// mesh, and one feature mesh per investor (hair, accessories, face details) skinned to the same
// bones, so accessories follow every animation.
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
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
function meshBuilder() {
  const groups = RIG_MATERIALS.map(() => []);
  return {
    part(geometry, center, scale, bone, slot, rotation = [0, 0, 0]) {
      geometry.scale(...scale);
      geometry.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...rotation)));
      geometry.translate(...center);
      const count = geometry.attributes.position.count, joint = boneIndex(bone);
      if (joint < 0) throw new Error("Unknown bone " + bone);
      const indices = new Uint16Array(count * 4), weights = new Float32Array(count * 4);
      for (let i = 0; i < count; i++) { indices[i * 4] = joint; weights[i * 4] = 1; }
      geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(indices, 4));
      geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(weights, 4));
      groups[material(slot)].push(geometry);
    },
    build(name, materials, skeleton) {
      const used = groups.map((items, i) => ({ items, i })).filter(entry => entry.items.length);
      const geometry = mergeGeometries(used.map(entry => mergeGeometries(entry.items)), true);
      const mesh = new THREE.SkinnedMesh(geometry, used.map(entry => materials[entry.i]));
      mesh.name = name;
      return mesh;
    },
  };
}
const box = () => new THREE.BoxGeometry(1, 1, 1);
const sphere = () => new THREE.SphereGeometry(1, 12, 8);

// ---- Shared body: same proportions for the whole cast ----
const body = meshBuilder();
body.part(sphere(), [0, 1.32, 0], [.34, .47, .21], "Chest", "Jacket");
body.part(box(), [0, 1.55, .17], [.23, .27, .06], "Chest", "Shirt");
body.part(sphere(), [0, 1.80, 0], [.105, .17, .105], "Head", "Skin");
body.part(sphere(), [0, 2.02, 0], [.23, .30, .21], "Head", "Skin");
body.part(sphere(), [0, 2.02, .204], [.042, .055, .05], "Head", "Skin");
for (const x of [-.087, .087]) {
  body.part(sphere(), [x, 2.07, .185], [.032, .025, .025], "Head", "Eyes");
  body.part(box(), [x, 2.13, .18], [.07, .013, .012], "Head", "Hair");
}
body.part(box(), [0, 1.92, .197], [.065, .011, .012], "Head", "Hair");
for (const side of [-1, 1]) {
  const s = side < 0 ? "Left" : "Right";
  body.part(sphere(), [side * .35, 1.43, .025], [.12, .23, .12], s + "Arm", "Jacket");
  body.part(sphere(), [side * .37, 1.28, .24], [.095, .09, .23], s + "Forearm", "Jacket");
  body.part(sphere(), [side * .37, 1.28, .44], [.075, .048, .10], s + "Forearm", "Skin");
  body.part(sphere(), [side * .16, .75, .28], [.14, .14, .31], s + "Thigh", "Trousers");
  body.part(sphere(), [side * .16, .41, .56], [.10, .31, .10], s + "Shin", "Trousers");
  body.part(sphere(), [side * .16, .10, .65], [.115, .075, .20], s + "Shin", "Trousers");
}
body.part(sphere(), [0, .80, 0], [.29, .20, .19], "Pelvis", "Trousers");
body.part(sphere(), [-.18, 1.57, .18], [.035, .035, .025], "Chest", "Brass");

// ---- Per-investor features. Issues #5-#7 replace these with the production characters. ----
function sharedPlaceholderHair(features) {
  features.part(sphere(), [0, 2.17, -.045], [.245, .20, .20], "Head", "Hair");
  features.part(box(), [0, 2.02, -.19], [.40, .34, .07], "Head", "Hair");
}
const cast = {
  maya(features) { sharedPlaceholderHair(features); },
  adrian(features) {
    sharedPlaceholderHair(features);
    // Glasses are skinned to the Head bone, so they follow every head movement.
    for (const x of [-.088, .088]) features.part(new THREE.TorusGeometry(.052, .007, 5, 14), [x, 2.07, .21], [1, 1, 1], "Head", "Brass");
    features.part(box(), [0, 2.07, .21], [.07, .008, .008], "Head", "Brass");
  },
  sofia(features) { sharedPlaceholderHair(features); },
};

// ---- Materials (slot names are the runtime colour keys) ----
const defaults = { Skin: "#b97957", Jacket: "#283c34", Trousers: "#172321", Hair: "#201b18", Brass: "#b99b60", Shirt: "#e8dfc8", Eyes: "#171b19" };
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
console.log("Original cast GLB written:", result.byteLength, "bytes;", skeletonBones.length, "bones;", clips.length, "clips; 1 body + 3 feature meshes.");
