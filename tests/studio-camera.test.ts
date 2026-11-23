import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { PerspectiveCamera, Vector3 } from "three";
import { BASE_FOV, cameraEase, cameraFov, cameraPresets, cameraStep, MAX_FOV, type CameraView } from "../src/features/studio/model.ts";
import { ROOM, SEAT_X } from "../src/features/studio/room/layout.ts";
import { INVESTOR_ORDER } from "../src/features/simulation/negotiation/investor-policy.ts";

// Issue #11: every preset keeps its subjects in frame on every screen shape, with no free camera.

const ASPECTS = [2.4, 1.78, 1.33, 1.09, .75, .56, .46];
function shot(view: CameraView, aspect: number) {
  const preset = cameraPresets[view];
  const camera = new PerspectiveCamera(cameraFov(view, aspect), aspect, .1, 40);
  camera.position.fromArray(preset.position);
  camera.lookAt(new Vector3(...preset.target));
  camera.updateMatrixWorld(true);
  return (point: [number, number, number]) => new Vector3(...point).project(camera);
}
/** Head top, both hands and both shoulders of a seated investor (avatar space, from the rig). */
const landmarks = (x: number): [number, number, number][] => [[x, 2.37, 0], [x - .4, 1.25, .45], [x + .4, 1.25, .45], [x - .46, 1.6, 0], [x + .46, 1.6, 0]];
const inFrame = (p: Vector3) => Math.abs(p.x) <= 1 && Math.abs(p.y) <= 1 && p.z < 1;

test("the panel shot keeps all three investors fully in frame on every screen shape", () => {
  for (const aspect of ASPECTS) {
    const project = shot("panel", aspect);
    for (const x of SEAT_X) for (const point of landmarks(x)) assert.ok(inFrame(project(point)), `panel at aspect ${aspect} crops the investor at ${x}`);
  }
});

test("each investor shot frames its investor with head room on every screen shape", () => {
  INVESTOR_ORDER.forEach((investor, index) => {
    for (const aspect of ASPECTS) {
      const project = shot(investor, aspect);
      for (const point of landmarks(SEAT_X[index])) assert.ok(inFrame(project(point)), `${investor} at aspect ${aspect}`);
      const head = project([SEAT_X[index], 2.37, 0]);
      assert.ok(head.y < .85, `${investor} keeps head room at aspect ${aspect}`);
      assert.ok(Math.abs(project([SEAT_X[index], 1.8, 0]).x) < .05, `${investor} is centred`);
    }
  });
});

test("field of view only widens on narrow screens and stays within limits", () => {
  for (const view of Object.keys(cameraPresets) as CameraView[]) {
    let previous = Infinity;
    for (const aspect of [...ASPECTS].sort((a, b) => a - b)) {
      const fov = cameraFov(view, aspect);
      assert.ok(fov >= BASE_FOV && fov <= MAX_FOV, `${view} fov ${fov}`);
      assert.ok(fov <= previous, `${view} fov never grows as the screen gets wider`);
      previous = fov;
    }
    assert.equal(cameraFov(view, 1.78), BASE_FOV, `${view} is unchanged on landscape screens`);
  }
});

test("every camera stays inside the room and in front of the investors", () => {
  for (const [view, preset] of Object.entries(cameraPresets)) {
    const [x, y, z] = preset.position;
    assert.ok(Math.abs(x) < ROOM.width / 2 && y > 1.5 && y < ROOM.ceilingY, `${view} height and width`);
    assert.ok(z > 2.5 && z < ROOM.centerZ + ROOM.depth / 2, `${view} is in front of the desk and over the floor`);
  }
});

test("the studio has no free-roaming camera controls", () => {
  const dir = new URL("../src/features/studio/", import.meta.url);
  for (const name of readdirSync(dir, { recursive: true }).map(String).filter(file => /\.tsx?$/.test(file))) {
    assert.ok(!/OrbitControls|PointerLockControls|FlyControls|FirstPersonControls|TrackballControls|CameraControls/.test(readFileSync(new URL(name, dir), "utf8")), name);
  }
});

test("slow frames move the camera in real time, without jumping after a stall", () => {
  // Ten 50 ms frames and two 250 ms frames cover the same half second and the same distance.
  const remaining = (deltas: number[]) => deltas.reduce((left, delta) => left * (1 - cameraEase(delta, false)), 1);
  assert.ok(Math.abs(remaining(Array(10).fill(.05)) - remaining([.25, .25])) < 1e-12);
  assert.ok(Math.abs(remaining([1 / 60]) - (1 - cameraStep(1 / 60, false))) < 1e-12, "fast frames are unchanged");
  assert.equal(cameraEase(10, false), cameraEase(.25, false), "a stall counts as a quarter second at most");
  assert.ok(cameraEase(10, false) < 1, "so the camera never jumps to the end");
  assert.equal(cameraEase(.2, true), 1);
  assert.equal(cameraEase(-1, false), 0);
});
