import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AnimationMixer, DoubleSide, Mesh, MeshBasicMaterial, Raycaster, Vector3, type AnimationClip, type Object3D, type SkinnedMesh } from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { buildInvestorFurniture, deskProps } from "../src/features/studio/room/geometry.ts";
import { DESK_SURFACE_Y, SEATED_BODY, SEAT_X } from "../src/features/studio/room/layout.ts";

// Issue #2: the seated investors must rest on the chairs and desk, never pass through them,
// in every frame of every animation clip and at every seat.

const file = readFileSync(new URL("../public/studio/investor-v1.glb", import.meta.url));
const gltf = await new Promise<GLTF>((resolve, reject) =>
  new GLTFLoader().parse(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength), "", resolve, reject));
const SAMPLES = 8;

/** World-space vertices of one posed rig, tagged with the bone each vertex follows. */
function posedVertices(clip: AnimationClip, time: number, x: number) {
  const rig: Object3D = clone(gltf.scene);
  rig.position.x = x;
  const mixer = new AnimationMixer(rig);
  mixer.clipAction(clip).play();
  mixer.setTime(time);
  rig.updateMatrixWorld(true);
  const vertices: { point: Vector3; bone: string }[] = [], seen = new Set<string>();
  rig.traverse(object => {
    const mesh = object as SkinnedMesh;
    if (!mesh.isSkinnedMesh || seen.has(mesh.geometry.uuid)) return;
    seen.add(mesh.geometry.uuid);
    const bones = mesh.skeleton.bones.map(bone => bone.name), skin = mesh.geometry.attributes.skinIndex;
    for (let i = 0; i < mesh.geometry.attributes.position.count; i++) {
      vertices.push({ point: mesh.getVertexPosition(i, new Vector3()).applyMatrix4(mesh.matrixWorld), bone: bones[skin.getX(i)] });
    }
  });
  return vertices;
}

function* poses() {
  for (const clip of gltf.animations) for (let s = 0; s <= SAMPLES; s++) yield { clip, time: clip.duration * s / SAMPLES };
}

test("the rig still matches the seated envelope the furniture was designed for", () => {
  let hips = Infinity, back = Infinity, head = Infinity, forearms = Infinity, torso = 0;
  for (const { clip, time } of poses()) for (const { point, bone } of posedVertices(clip, time, 0)) {
    if (bone === "Pelvis") hips = Math.min(hips, point.y);
    if (bone === "Chest") { back = Math.min(back, point.z); torso = Math.max(torso, Math.abs(point.x)); }
    if (bone === "Head") head = Math.min(head, point.y);
    if (bone.endsWith("Forearm")) forearms = Math.min(forearms, point.y);
  }
  for (const value of [hips, back, head, forearms]) assert.ok(Number.isFinite(value), "every measured body part was found in the rig");
  assert.ok(hips >= SEATED_BODY.hipUnderside - .005, `hips reach ${hips.toFixed(3)}`);
  assert.ok(back >= SEATED_BODY.backOfTorso - .005, `back reaches ${back.toFixed(3)}`);
  assert.ok(head >= SEATED_BODY.headLowest - .005, `head reaches ${head.toFixed(3)}`);
  assert.ok(forearms >= SEATED_BODY.forearmUnderside - .005, `forearms reach ${forearms.toFixed(3)}`);
  assert.ok(torso <= SEATED_BODY.torsoHalfWidth + .005, `torso reaches ${torso.toFixed(3)}`);
});

const furniture = (() => {
  const material = new MeshBasicMaterial({ side: DoubleSide });
  return buildInvestorFurniture().map(geometry => {
    geometry.computeBoundingBox();
    return { mesh: new Mesh(geometry, material), box: geometry.boundingBox! };
  });
})();
const ray = new Raycaster(), directions = [new Vector3(0, 1, 0), new Vector3(1, .13, .07).normalize(), new Vector3(-.2, -.1, 1).normalize()];
/** A point is inside a closed solid when rays from it cross the surface an odd number of times. */
const inside = (point: Vector3, mesh: Mesh) => directions.filter(direction => {
  ray.set(point, direction);
  return ray.intersectObject(mesh, false).length % 2 === 1;
}).length >= 2;

/** Body vertices inside furniture, optionally with the rig lowered by `drop` metres. */
function intersections(drop = 0, limit = 10) {
  const found: string[] = [];
  for (const x of SEAT_X) for (const { clip, time } of poses()) for (const { point, bone } of posedVertices(clip, time, x)) {
    point.y -= drop;
    for (const { mesh, box } of furniture) {
      if (found.length >= limit) return found;
      if (box.containsPoint(point) && inside(point, mesh)) {
        found.push(`${clip.name}@${time.toFixed(2)} seat ${x} ${bone} at ${point.toArray().map(v => v.toFixed(2))}`);
      }
    }
  }
  return found;
}

test("no investor vertex is inside a chair or the desk in any clip, frame or seat", () => {
  assert.ok(furniture.length >= 30, "desk, chair cushions, back rolls, shells and arm pads are all checked");
  assert.deepEqual(intersections(), []);
});

test("the intersection check detects a rig that sinks into the furniture", () => {
  // Guards the test above against passing vacuously: 5 cm lower, the hips enter the cushions.
  assert.ok(intersections(.05, 1).length > 0);
});

test("every desk prop rests on the finished desk surface", () => {
  for (const x of SEAT_X) for (const { material, geometry } of deskProps(x)) {
    geometry.computeBoundingBox();
    assert.ok(Math.abs(geometry.boundingBox!.min.y - DESK_SURFACE_Y) < .001, `${material} prop at seat ${x} floats or sinks`);
    geometry.dispose();
  }
});
