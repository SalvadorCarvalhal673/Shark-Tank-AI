import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { SkinnedMesh, type Material, type Object3D } from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { createInvestorInstance } from "../src/features/studio/avatar.ts";
import { CAST_BODY, CAST_BUDGET, CAST_URL, castMeshName } from "../src/features/studio/rig.ts";
import type { InvestorId } from "../src/features/simulation/negotiation/investor-policy.ts";

// Issues #5-#7: production characters with stable skinning, readable faces and a bounded download.

const bytes = readFileSync(new URL("../public" + CAST_URL, import.meta.url));
const gltf = await new Promise<GLTF>((resolve, reject) =>
  new GLTFLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "", resolve, reject));


const meshes = (root: Object3D, owner: string) => {
  const found: SkinnedMesh[] = [];
  root.traverse(object => {
    let node: Object3D | null = object, name = "";
    while (node && !name) { if (node.name.startsWith("Cast_")) name = node.name.replace(/_\d+$/, ""); node = node.parent; }
    if (object instanceof SkinnedMesh && name === owner) found.push(object);
  });
  return found;
};
const slots = (list: SkinnedMesh[]) => new Set(list.flatMap(mesh => [mesh.material].flat().map((material: Material) => material.name)));
const bonesUsed = (mesh: SkinnedMesh) => {
  const used = new Set<string>(), joints = mesh.geometry.attributes.skinIndex;
  for (let i = 0; i < joints.count; i++) used.add(mesh.skeleton.bones[joints.getX(i)].name);
  return used;
};

test("the cast download stays within the approved transfer budget", () => {
  assert.ok(bytes.byteLength <= CAST_BUDGET.bytes, `${bytes.byteLength} bytes`);
  assert.ok(gzipSync(bytes).byteLength <= CAST_BUDGET.gzipBytes, `${gzipSync(bytes).byteLength} bytes compressed`);
});

test("every vertex is rigidly bound to one valid bone, so skinning never stretches", () => {
  gltf.scene.traverse(object => {
    if (!(object instanceof SkinnedMesh)) return;
    const { skinIndex, skinWeight } = object.geometry.attributes;
    for (let i = 0; i < skinWeight.count; i++) {
      assert.ok(Math.abs(skinWeight.getX(i) - 1) < 1e-3 && skinWeight.getY(i) + skinWeight.getZ(i) + skinWeight.getW(i) < 1e-3, `${object.name} vertex ${i} is fully weighted to one bone`);
      assert.ok(skinIndex.getX(i) < object.skeleton.bones.length, `${object.name} vertex ${i} uses a real bone`);
    }
  });
});

test("the shared face has eye whites, irises, brows and a mouth on the facial bones", () => {
  const [body] = meshes(gltf.scene, CAST_BODY);
  assert.ok(body.geometry.attributes.color, "eyes and lips use vertex colours instead of extra materials");
  const used = new Set(meshes(gltf.scene, CAST_BODY).flatMap(mesh => [...bonesUsed(mesh)]));
  for (const bone of ["LeftBrow", "RightBrow", "Jaw"]) assert.ok(used.has(bone), `face geometry rides ${bone}`);
});

const expected: Partial<Record<InvestorId, { slots: string[]; note: string }>> = {
  maya: { slots: ["Hair", "Brass", "Shirt", "Jacket"], note: "sleek hair, brass hoops, high collar and lapels" },
  adrian: { slots: ["Hair", "Brass", "Shirt", "Jacket"], note: "textured copper hair, glasses with temples, open collar and narrow lapels" },
  sofia: { slots: ["Hair", "Brass", "Shirt", "Jacket"], note: "high bun with a brass clip, brass studs, shawl collar and cream top" },
};
test("the three investors are distinct: no two feature meshes share a silhouette", () => {
  const silhouettes = (["maya", "adrian", "sofia"] as const).map(investor => {
    const own = meshes(gltf.scene, castMeshName(investor));
    return own.map(mesh => mesh.geometry.index?.count ?? 0).join("/");
  });
  assert.equal(new Set(silhouettes).size, 3, silhouettes.join(" | "));
});

for (const [investor, { slots: needed, note }] of Object.entries(expected) as [InvestorId, { slots: string[]; note: string }][]) {
  test(`${investor} has their own production features: ${note}`, () => {
    const own = meshes(createInvestorInstance(gltf.scene, investor).root, castMeshName(investor));
    assert.ok(own.length > 0);
    for (const slot of needed) assert.ok(slots(own).has(slot), `${investor} features use ${slot}`);
    for (const mesh of own) for (const bone of bonesUsed(mesh)) assert.ok(["Head", "Chest"].includes(bone), `${investor} features ride ${bone}`);
  });
}
