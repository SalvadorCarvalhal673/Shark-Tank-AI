import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Mesh, type Object3D } from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { createInvestorInstance } from "../src/features/studio/avatar.ts";
import { CAST_URL } from "../src/features/studio/rig.ts";
import { DRAWS_PER_INVESTOR, STUDIO_BUDGETS } from "../src/features/studio/performance.ts";
import { buildStudioRoom } from "../src/features/studio/room/geometry.ts";
import { INVESTOR_ORDER } from "../src/features/simulation/negotiation/investor-policy.ts";

// Issue #12: draw calls and triangles that can be counted without a GPU stay inside the phone
// budget. Browser views are measured by tests/prototype and scripts/measure-studio.mjs.

const bytes = readFileSync(new URL("../public" + CAST_URL, import.meta.url));
const gltf = await new Promise<GLTF>((resolve, reject) =>
  new GLTFLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "", resolve, reject));

const drawn = (root: Object3D) => {
  let draws = 0, triangles = 0;
  root.traverse(object => {
    if (!(object instanceof Mesh)) return;
    draws++;
    triangles += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3;
  });
  return { draws, triangles };
};

test("each investor stays inside its draw-call allowance", () => {
  for (const investor of INVESTOR_ORDER) {
    const instance = createInvestorInstance(gltf.scene, investor);
    assert.ok(drawn(instance.root).draws <= DRAWS_PER_INVESTOR, `${investor} uses ${drawn(instance.root).draws} draws`);
    instance.dispose();
  }
});

test("room plus cast fit the phone draw-call and triangle budgets with headroom for the sky and founder mark", () => {
  const room = buildStudioRoom();
  const cast = INVESTOR_ORDER.map(investor => {
    const instance = createInvestorInstance(gltf.scene, investor);
    const result = drawn(instance.root);
    instance.dispose();
    return result;
  });
  const draws = room.parts.size + cast.reduce((sum, item) => sum + item.draws, 0);
  const triangles = room.triangles + cast.reduce((sum, item) => sum + item.triangles, 0);
  // A few draws are added in React (sky, founder mark); keep at least five free for them.
  assert.ok(draws + 5 <= STUDIO_BUDGETS.drawCalls.phone, `${draws} draws before the sky and founder mark`);
  assert.ok(triangles < STUDIO_BUDGETS.triangles.phone, `${triangles} triangles`);
  room.dispose();
});
