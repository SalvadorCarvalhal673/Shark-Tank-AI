import test from "node:test";
import assert from "node:assert/strict";
import { Box3, Ray, Vector3 } from "three";
import { buildStudioRoom, ROOM_MATERIALS } from "../src/features/studio/room/geometry.ts";
import { FOUNDER, ROOM, ROOM_BUDGET, SEAT_X } from "../src/features/studio/room/layout.ts";
import { cameraPresets } from "../src/features/studio/model.ts";
import { INVESTOR_ORDER } from "../src/features/simulation/negotiation/investor-policy.ts";

test("studio room builds deterministically within its triangle and material budget", () => {
  const first = buildStudioRoom(), second = buildStudioRoom();
  assert.ok(first.triangles > 5000, "room should not be a placeholder");
  assert.ok(first.triangles <= ROOM_BUDGET.maxTriangles, `room uses ${first.triangles} triangles`);
  assert.equal(first.triangles, second.triangles);
  assert.ok(first.parts.size <= ROOM_BUDGET.maxMaterials);
  for (const key of first.parts.keys()) assert.ok((ROOM_MATERIALS as readonly string[]).includes(key));
  const a = first.parts.get("plant")!.attributes.position.array, b = second.parts.get("plant")!.attributes.position.array;
  assert.deepEqual(Array.from(a.slice(0, 300)), Array.from(b.slice(0, 300)));
  first.dispose(); second.dispose();
});

test("studio room geometry is finite and merged to one geometry per material", () => {
  const room = buildStudioRoom();
  for (const [key, geometry] of room.parts) {
    const positions = geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i++) assert.ok(Number.isFinite(positions[i]), `${key} has a non-finite vertex`);
    assert.ok(geometry.attributes.normal, `${key} needs normals for lighting`);
    assert.equal(geometry.attributes.uv.count, geometry.attributes.position.count);
  }
  assert.ok(room.parts.get("books")!.attributes.color, "books share one material through vertex colours");
  room.dispose();
});

test("seats match the three investors and their camera presets", () => {
  assert.equal(SEAT_X.length, INVESTOR_ORDER.length);
  INVESTOR_ORDER.forEach((id, index) => {
    assert.equal(cameraPresets[id].position[0], SEAT_X[index]);
    assert.equal(cameraPresets[id].target[0], SEAT_X[index]);
  });
});

test("founder lectern and room shell never block a camera sightline to an investor", () => {
  const lectern = new Box3(new Vector3(FOUNDER.lecternX - .4, 0, FOUNDER.lecternZ - .4), new Vector3(FOUNDER.lecternX + .4, 1.08, FOUNDER.lecternZ + .4));
  const views = ["panel", ...INVESTOR_ORDER] as const;
  for (const view of views) {
    const eye = new Vector3(...cameraPresets[view].position);
    for (const x of SEAT_X) for (const y of [1.3, 1.75, 2.05]) {
      const point = new Vector3(x, y, 0);
      const ray = new Ray(eye, point.clone().sub(eye).normalize());
      const hit = ray.intersectBox(lectern, new Vector3());
      assert.ok(!hit || hit.distanceTo(eye) > eye.distanceTo(point), `${view} camera sees ${x},${y} through the lectern`);
    }
    assert.ok(eye.y < ROOM.ceilingY && eye.z > ROOM.glassZ, `${view} camera stays inside the room`);
  }
  // The pitch mark lies flat on the floor in front of the desk, behind every camera's focus.
  assert.ok(FOUNDER.z > 2.4 && FOUNDER.z < cameraPresets.panel.position[2]);
});
