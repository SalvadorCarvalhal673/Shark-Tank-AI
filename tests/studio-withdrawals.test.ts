import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { latestWithdrawal } from "../src/features/studio/withdrawal.ts";
import { demonstrationAnswers, demonstrationPitch, sceneCue, WITHDRAWAL_CLIPS } from "../src/features/studio/model.ts";
import { CAST_URL, REDUCED_MOTION_POSE } from "../src/features/studio/rig.ts";
import { applyFounderAction, startNegotiation, type NegotiationSession } from "../src/features/simulation/negotiation/session.ts";
import type { InvestorId } from "../src/features/simulation/negotiation/investor-policy.ts";
import type { Terms } from "../src/features/simulation/pitch.ts";

// Issue #30: each policy reason for leaving plays its own movement and copy, the investor's last offer
// stays in the history, and nothing in the 3D view can cause a withdrawal.

const bytes = readFileSync(new URL("../public" + CAST_URL, import.meta.url));
const gltf = await new Promise<GLTF>((resolve, reject) =>
  new GLTFLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "", resolve, reject));

const answered = (answers: readonly string[] = demonstrationAnswers) => answers.reduce((session, text, turn) =>
  applyFounderAction(session, { kind: "answer", sessionId: session.id, expectedRevision: session.revision, turn, text }), startNegotiation("withdrawal-test", demonstrationPitch)!);
const active = (session: NegotiationSession, investor: InvestorId) => session.offers.find(offer => offer.investor === investor && offer.status === "active")!;
const counter = (session: NegotiationSession, investor: InvestorId, terms: (offer: Terms) => Terms) => {
  const offer = active(session, investor);
  return applyFounderAction(session, { kind: "counter", sessionId: session.id, expectedRevision: session.revision, offerId: offer.id, terms: terms({ amount: offer.amount, equity: offer.equity }) });
};

test("each withdrawal reason has its own clip, distinct movement and a held reduced-motion pose", () => {
  const clips = [...new Set(Object.values(WITHDRAWAL_CLIPS))];
  assert.equal(clips.length, 3);
  const signature = (name: string) => gltf.animations.find(clip => clip.name === name)!.tracks.map(track => track.name).sort().join();
  assert.equal(new Set(clips.map(signature)).size, 3, "the three withdrawals move different bones");
  for (const name of clips) {
    const clip = gltf.animations.find(candidate => candidate.name === name)!;
    assert.ok(REDUCED_MOTION_POSE[name] > 0 && REDUCED_MOTION_POSE[name] <= clip.duration, `${name} held pose`);
  }
  assert.ok(signature("WithdrawalCash").includes("RightForearm"), "the cash withdrawal raises a hand");
  assert.ok(signature("WithdrawalEquity").includes("LeftBrow"), "the equity withdrawal frowns");
});

test("above the cash ceiling: the cash clip, the exact request and the retained last offer", () => {
  const session = answered(), offer = active(session, "maya"), before = JSON.stringify(session);
  const next = counter(session, "maya", terms => ({ amount: session.limits.maya!.cashCeiling + 1, equity: terms.equity }));
  assert.equal(JSON.stringify(session), before);
  const cue = sceneCue(next, "maya");
  assert.equal(cue.pose, "Withdrawal", "the pose category is unchanged");
  assert.equal(cue.clip, "WithdrawalCash");
  const withdrawal = latestWithdrawal(next, "maya")!;
  assert.equal(withdrawal.kind, "counter");
  assert.ok(withdrawal.kind === "counter");
  assert.equal(withdrawal.reason, "above-cash-ceiling");
  assert.deepEqual(withdrawal.proposed, { amount: session.limits.maya!.cashCeiling + 1, equity: offer.equity });
  assert.deepEqual(withdrawal.lastOffer, { amount: offer.amount, equity: offer.equity });
  assert.equal(next.offers.find(item => item.id === offer.id)?.status, "withdrawn", "the offer is kept in the history, marked withdrawn");
  assert.equal(latestWithdrawal(next, "adrian"), null, "the others are still in");
});

test("below the equity range: the equity clip", () => {
  const next = counter(answered(), "sofia", terms => ({ amount: terms.amount, equity: 1 }));
  assert.equal(sceneCue(next, "sofia").clip, "WithdrawalEquity");
  assert.equal(latestWithdrawal(next, "sofia")?.reason, "below-withdrawal-band");
});

test("opening passes keep their own reactions", () => {
  const vague = answered(demonstrationAnswers.map((_, turn) => `We are excited about the future, chapter ${turn + 1}.`));
  assert.equal(sceneCue(vague, "maya").clip, "Withdrawal");
  assert.deepEqual(latestWithdrawal(vague, "maya"), { kind: "opening", reason: "missing-required-signals", revision: vague.revision, clip: "Withdrawal" });
  const repeated = answered(demonstrationAnswers.map(() => demonstrationAnswers[0]));
  const passed = (["adrian", "sofia"] as const).find(investor => latestWithdrawal(repeated, investor)?.reason === "repeated-answer")!;
  assert.ok(passed);
  assert.equal(sceneCue(repeated, passed).clip, "Skeptical");
});

test("the 3D view cannot withdraw: scene and avatar code never dispatch actions", () => {
  for (const file of ["scene.tsx", "avatar.ts", "withdrawal.ts", "concession.ts", "dialogue.ts"]) {
    const source = readFileSync(new URL("../src/features/studio/" + file, import.meta.url), "utf8");
    assert.doesNotMatch(source, /dispatch\(|applyFounderAction|advanceRun/, `${file} only reads committed state`);
  }
});
