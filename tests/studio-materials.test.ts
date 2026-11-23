import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { MeshStandardMaterial, SkinnedMesh } from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { createInvestorInstance } from "../src/features/studio/avatar.ts";
import { CHARACTER_FINISH, TEXTURE_BUDGET, TEXTURE_SPECS, textureBytes, textureMemory, type TextureName } from "../src/features/studio/materials.ts";
import { CAST_URL, RIG_MATERIALS, type RigMaterial } from "../src/features/studio/rig.ts";
import { INVESTOR_ORDER } from "../src/features/simulation/negotiation/investor-policy.ts";

// Issue #3: one coherent material set, bounded texture memory and only original local assets.

test("room texture memory stays within the wide and narrow screen budgets", () => {
  assert.ok(textureMemory(false) <= TEXTURE_BUDGET.wide, `wide screens use ${textureMemory(false)} bytes`);
  assert.ok(textureMemory(true) <= TEXTURE_BUDGET.compact, `narrow screens use ${textureMemory(true)} bytes`);
  for (const name of Object.keys(TEXTURE_SPECS) as TextureName[]) {
    const { wide, compact } = TEXTURE_SPECS[name];
    assert.ok(compact[0] <= wide[0] && compact[1] <= wide[1], `${name} never grows on narrow screens`);
    for (const side of [...wide, ...compact]) assert.ok(side <= 1024, `${name} stays at or under 1024 px per side`);
  }
  assert.equal(textureBytes([256, 256]), Math.round(256 * 256 * 4 * 4 / 3), "budget counts the full mipmap chain");
});

test("every character material slot has one shared finish", () => {
  assert.deepEqual(Object.keys(CHARACTER_FINISH).sort(), [...RIG_MATERIALS].sort());
  for (const [slot, finish] of Object.entries(CHARACTER_FINISH)) {
    assert.ok(finish.roughness > 0 && finish.roughness <= 1, slot);
    assert.ok(finish.metalness >= 0 && finish.metalness <= 1, slot);
  }
});

test("each investor instance applies the shared finish to its own materials", async () => {
  const file = readFileSync(new URL("../public" + CAST_URL, import.meta.url));
  const gltf = await new Promise<GLTF>((resolve, reject) =>
    new GLTFLoader().parse(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength), "", resolve, reject));
  for (const investor of INVESTOR_ORDER) {
    const instance = createInvestorInstance(gltf.scene, investor);
    instance.root.traverse(object => {
      if (!(object instanceof SkinnedMesh)) return;
      for (const material of [object.material].flat() as MeshStandardMaterial[]) {
        const finish = CHARACTER_FINISH[material.name as RigMaterial];
        assert.equal(material.flatShading, false, `${investor} ${material.name} is smooth shaded`);
        assert.equal(material.roughness, finish.roughness);
        assert.equal(material.metalness, finish.metalness);
      }
    });
    instance.dispose();
  }
});

test("the studio ships no downloaded or bitmap texture files", () => {
  const files = readdirSync(new URL("../public/studio/", import.meta.url));
  assert.deepEqual(files.filter(name => !name.endsWith(".glb")), [], "textures are painted in code, so there is nothing to license");
  const bytes = readFileSync(new URL("../public" + CAST_URL, import.meta.url));
  const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
  assert.equal(json.images, undefined, "the cast file embeds no images");
  assert.equal(json.textures, undefined, "the cast file references no textures");
});
