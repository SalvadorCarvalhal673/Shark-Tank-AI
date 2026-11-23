import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { demonstrationAnswers, demonstrationPitch, sceneCue, type Pose } from "../src/features/studio/model.ts";
import { CAST_URL, REDUCED_MOTION_POSE, RIG_CLIPS } from "../src/features/studio/rig.ts";
import { applyFounderAction, startNegotiation } from "../src/features/simulation/negotiation/session.ts";
import { INVESTOR_ORDER } from "../src/features/simulation/negotiation/investor-policy.ts";

// Issue #9: seated gestures for listening, explaining, offering and withdrawal, chosen only from
// the committed session, with a held pose for every clip under reduced motion. The furniture fit
// for every frame of every clip is checked in tests/studio-room-fit.test.ts.

const bytes = readFileSync(new URL("../public" + CAST_URL, import.meta.url));
const gltf = await new Promise<GLTF>((resolve, reject) =>
  new GLTFLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "", resolve, reject));

test("every pose the studio can show has a clip and a reduced-motion pose inside it", () => {
  const poses: Pose[] = ["Listening", "Explaining", "Offering", "Withdrawal"];
  for (const pose of poses) {
    const clip = gltf.animations.find(candidate => candidate.name === pose);
    assert.ok(clip, `${pose} clip exists`);
    assert.ok((RIG_CLIPS as readonly string[]).includes(pose));
    assert.ok(REDUCED_MOTION_POSE[pose] >= 0 && REDUCED_MOTION_POSE[pose] <= clip.duration, `${pose} held pose is inside the clip`);
  }
});

test("expressive clips move the face: brows rise to ask and offer, and frown to withdraw", () => {
  const tracks = (name: string) => gltf.animations.find(clip => clip.name === name)!.tracks.map(track => track.name);
  for (const clip of ["Explaining", "Offering", "Withdrawal"]) assert.ok(tracks(clip).includes("Brows.quaternion"), `${clip} moves the brows`);
  assert.ok(tracks("Explaining").includes("Jaw.quaternion"), "the asking investor speaks");
  assert.ok(tracks("Withdrawal").includes("LeftBrow.quaternion") && tracks("Withdrawal").includes("RightBrow.quaternion"), "withdrawal frowns");
});

test("during questions only the investor whose question is open is explaining", () => {
  let session = startNegotiation("animation-test", demonstrationPitch)!;
  for (const [turn, text] of demonstrationAnswers.entries()) {
    const before = JSON.stringify(session);
    INVESTOR_ORDER.forEach((investor, index) =>
      assert.equal(sceneCue(session, investor).pose, index === turn ? "Explaining" : "Listening", `turn ${turn}: ${investor}`));
    assert.equal(JSON.stringify(session), before, "deriving poses never changes the session");
    const keys = INVESTOR_ORDER.map(investor => sceneCue(session, investor).key);
    session = applyFounderAction(session, { kind: "answer", sessionId: session.id, expectedRevision: session.revision, turn, text });
    if (turn < demonstrationAnswers.length - 1) assert.notDeepEqual(INVESTOR_ORDER.map(investor => sceneCue(session, investor).key), keys, "a new question replays the gesture");
  }
  assert.notEqual(session.stage, "questions");
  for (const investor of INVESTOR_ORDER) assert.notEqual(sceneCue(session, investor).pose, "Explaining", "nobody explains once questions end");
});
