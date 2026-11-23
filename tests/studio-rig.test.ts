import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AnimationMixer, Bone, SkinnedMesh, Vector3, type Object3D } from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { createInvestorInstance } from "../src/features/studio/avatar.ts";
import { CAST_BODY, CAST_URL, castMeshName, RIG_BONES, RIG_CLIPS, RIG_MATERIALS } from "../src/features/studio/rig.ts";
import { INVESTOR_ORDER } from "../src/features/simulation/negotiation/investor-policy.ts";

// Issue #8: one shared skeleton and clip set for the whole cast, independent instances, and
// per-investor features that are skinned to the same bones so they follow every animation.

const file = readFileSync(new URL("../public" + CAST_URL, import.meta.url));
const gltf = await new Promise<GLTF>((resolve, reject) =>
  new GLTFLoader().parse(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength), "", resolve, reject));

const skinned = (root: Object3D) => {
  const meshes: SkinnedMesh[] = [];
  root.traverse(object => { if (object instanceof SkinnedMesh) meshes.push(object); });
  return meshes;
};
const ownerOf = (mesh: Object3D) => {
  for (let node: Object3D | null = mesh; node; node = node.parent) if (node.name.startsWith("Cast_")) return node.name.replace(/_\d+$/, "");
  return "";
};

test("the cast file uses exactly the contract skeleton, hierarchy and rest pose", () => {
  const bones = new Map<string, Bone>();
  gltf.scene.traverse(object => { if (object instanceof Bone) bones.set(object.name, object); });
  assert.deepEqual([...bones.keys()].sort(), RIG_BONES.map(bone => bone.name).sort());
  for (const { name, parent, position } of RIG_BONES) {
    const bone = bones.get(name)!;
    assert.equal(parent ? bone.parent?.name : !(bone.parent instanceof Bone), parent ?? true, `${name} parent`);
    bone.position.toArray().forEach((value, i) => assert.ok(Math.abs(value - position[i]) < 1e-5, `${name} rest position`));
  }
});

test("every clip in the contract exists and only rotates contract bones", () => {
  assert.deepEqual(gltf.animations.map(clip => clip.name), [...RIG_CLIPS]);
  const names = new Set<string>(RIG_BONES.map(bone => bone.name));
  for (const clip of gltf.animations) {
    assert.ok(clip.duration > 0, `${clip.name} has a duration`);
    for (const track of clip.tracks) {
      const [bone, property] = track.name.split(".");
      assert.ok(names.has(bone), `${clip.name} animates unknown bone ${bone}`);
      assert.equal(property, "quaternion", `${clip.name} may only rotate bones, so seated proportions never change`);
    }
  }
});

test("the file holds one shared body and one feature mesh per investor, all bound to one skeleton", () => {
  const owners = new Set(skinned(gltf.scene).map(ownerOf));
  assert.deepEqual([...owners].sort(), [CAST_BODY, ...INVESTOR_ORDER.map(castMeshName)].sort());
  const reference = skinned(gltf.scene)[0].skeleton.bones;
  for (const mesh of skinned(gltf.scene)) {
    assert.deepEqual(mesh.skeleton.bones.map(bone => bone.name), reference.map(bone => bone.name));
    mesh.skeleton.bones.forEach((bone, i) => assert.equal(bone, reference[i], `${mesh.name} shares the body's bones`));
    for (const material of [mesh.material].flat()) assert.ok((RIG_MATERIALS as readonly string[]).includes(material.name), `${material.name} is a contract slot`);
  }
});

test("each instance keeps the shared body and only its own investor's features", () => {
  for (const investor of INVESTOR_ORDER) {
    const instance = createInvestorInstance(gltf.scene, investor);
    const owners = new Set(skinned(instance.root).map(ownerOf));
    assert.deepEqual([...owners].sort(), [CAST_BODY, castMeshName(investor)].sort(), investor);
    const bones = skinned(instance.root)[0].skeleton.bones;
    for (const mesh of skinned(instance.root)) mesh.skeleton.bones.forEach((bone, i) => assert.equal(bone, bones[i], "features share the instance's own bones"));
    instance.dispose();
  }
});

test("instances own independent skeletons and mixers but share body geometry", () => {
  const [a, b] = [createInvestorInstance(gltf.scene, "maya"), createInvestorInstance(gltf.scene, "maya")];
  const [bodyA, bodyB] = [skinned(a.root)[0], skinned(b.root)[0]];
  assert.notEqual(a.mixer, b.mixer);
  assert.notEqual(bodyA.skeleton.bones[0], bodyB.skeleton.bones[0]);
  assert.equal(bodyA.geometry, bodyB.geometry, "one body geometry in GPU memory for the whole cast");
  a.dispose(); b.dispose();
});

test("accessories follow the head: Adrian's glasses keep their offset from the head in every frame", () => {
  const instance = createInvestorInstance(gltf.scene, "adrian");
  const glasses = skinned(instance.root).find(mesh => ownerOf(mesh) === castMeshName("adrian") && [mesh.material].flat()[0].name === "Brass")!;
  assert.ok(glasses, "Adrian has skinned glasses");
  const head = glasses.skeleton.bones.find(bone => bone.name === "Head")!;
  const offset = () => {
    instance.root.updateMatrixWorld(true);
    // Primitives share one vertex buffer, so take a vertex this primitive actually draws.
    const vertex = glasses.geometry.index ? glasses.geometry.index.getX(0) : 0;
    const local = glasses.getVertexPosition(vertex, new Vector3()).applyMatrix4(glasses.matrixWorld);
    return head.worldToLocal(local);
  };
  const rest = offset();
  const mixer = new AnimationMixer(instance.root);
  mixer.clipAction(gltf.animations.find(clip => clip.name === "Withdrawal")!).play();
  mixer.setTime(.5);
  assert.ok(head.quaternion.angleTo(skinned(gltf.scene)[0].skeleton.bones.find(b => b.name === "Head")!.quaternion) > .05, "the head actually turned");
  const moved = offset().distanceTo(rest);
  assert.ok(moved < 1e-4, `glasses moved ${moved} relative to the head`);
  instance.dispose();
});
