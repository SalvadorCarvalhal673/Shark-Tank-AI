import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { demonstrationAnswers, demonstrationPitch, REACTIONS, sceneCue } from "../src/features/studio/model.ts";
import { CAST_URL, REDUCED_MOTION_POSE } from "../src/features/studio/rig.ts";
import { applyFounderAction, startNegotiation, type NegotiationSession } from "../src/features/simulation/negotiation/session.ts";
import { INVESTOR_ORDER, type InvestorId } from "../src/features/simulation/negotiation/investor-policy.ts";
import type { Terms } from "../src/features/simulation/pitch.ts";

// Issue #10: every committed decision reason maps to one recognisable reaction. Reactions are derived
// from the journal only, so they never anticipate an outcome, and deriving them never changes state.

const bytes = readFileSync(new URL("../public" + CAST_URL, import.meta.url));
const gltf = await new Promise<GLTF>((resolve, reject) =>
  new GLTFLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "", resolve, reject));

const answered = (answers: readonly string[] = demonstrationAnswers) => {
  let session = startNegotiation("reaction-test", demonstrationPitch)!;
  for (const [turn, text] of answers.entries())
    session = applyFounderAction(session, { kind: "answer", sessionId: session.id, expectedRevision: session.revision, turn, text });
  return session;
};
const activeOffer = (session: NegotiationSession, investor: InvestorId) =>
  session.offers.find(offer => offer.investor === investor && offer.status === "active")!;
const counter = (session: NegotiationSession, investor: InvestorId, terms: (current: Terms) => Terms) => {
  const offer = activeOffer(session, investor);
  return applyFounderAction(session, { kind: "counter", sessionId: session.id, expectedRevision: session.revision, offerId: offer.id, terms: terms({ amount: offer.amount, equity: offer.equity }) });
};
const lastReason = (session: NegotiationSession, investor: InvestorId) =>
  session.history.findLast(item => (item.kind === "opening" || item.kind === "counter") && item.investor === investor) as { reason: keyof typeof REACTIONS } | undefined;
const expectReaction = (session: NegotiationSession, investor: InvestorId, reason: keyof typeof REACTIONS) => {
  assert.equal(lastReason(session, investor)?.reason, reason, `${investor} committed ${reason}`);
  const before = JSON.stringify(session);
  assert.equal(sceneCue(session, investor).pose, REACTIONS[reason], `${reason} shows ${REACTIONS[reason]}`);
  assert.equal(JSON.stringify(session), before, "deriving a reaction never changes the session");
};

test("every reaction has its own clip with a held pose inside it for reduced motion", () => {
  for (const pose of new Set(Object.values(REACTIONS))) {
    const clip = gltf.animations.find(candidate => candidate.name === pose);
    assert.ok(clip, `${pose} clip exists`);
    assert.ok(REDUCED_MOTION_POSE[pose] > 0 && REDUCED_MOTION_POSE[pose] <= clip.duration, `${pose} held pose is inside the clip`);
  }
});

test("distinct outcomes read differently: each reaction moves a recognisable set of bones", () => {
  const signature = (name: string) => gltf.animations.find(clip => clip.name === name)!.tracks.map(track => track.name.split(".")[0]).sort().join(",");
  const reactions = [...new Set(Object.values(REACTIONS))];
  assert.equal(new Set(reactions.map(signature)).size, reactions.length, "no two reactions animate the same bones");
  const tracks = (name: string) => signature(name).split(",");
  assert.ok(tracks("Agreeing").includes("Jaw"), "agreement smiles");
  assert.ok(tracks("Skeptical").includes("RightBrow"), "scepticism cocks a brow");
  assert.ok(tracks("Considering").includes("RightForearm"), "considering raises a hand");
  assert.ok(tracks("Firm").includes("Head"), "a firm hold shakes the head");
});

test("opening reasons: offers, missing signals and repeated answers", () => {
  const offered = answered();
  for (const investor of INVESTOR_ORDER) expectReaction(offered, investor, "required-signals-supplied");
  const repeated = answered(demonstrationAnswers.map(() => demonstrationAnswers[0]));
  assert.ok(INVESTOR_ORDER.some(investor => lastReason(repeated, investor)?.reason === "repeated-answer"));
  for (const investor of INVESTOR_ORDER) expectReaction(repeated, investor, lastReason(repeated, investor)!.reason);
  const vague = answered(demonstrationAnswers.map((_, turn) => `We are excited about the future, chapter ${turn + 1}.`));
  for (const investor of INVESTOR_ORDER) expectReaction(vague, investor, "missing-required-signals");
});

test("counter reasons: agree, limited concession, held at the limit, and both withdrawals", () => {
  const session = answered();
  const floor = session.limits.maya!.equityFloor;
  expectReaction(counter(session, "maya", current => ({ amount: current.amount, equity: floor })), "maya", "within-limits");
  const revised = counter(session, "maya", current => ({ amount: current.amount, equity: floor - 1 }));
  expectReaction(revised, "maya", "limited-concession");
  let held = revised;
  while (activeOffer(held, "maya").equity > floor) held = counter(held, "maya", current => ({ amount: current.amount, equity: floor - 1 }));
  held = counter(held, "maya", current => ({ amount: current.amount, equity: floor - 1 }));
  expectReaction(held, "maya", "at-concession-limit");
  expectReaction(counter(session, "adrian", current => ({ amount: session.limits.adrian!.cashCeiling + 1, equity: current.equity })), "adrian", "above-cash-ceiling");
  expectReaction(counter(session, "sofia", current => ({ amount: current.amount, equity: 1 })), "sofia", "below-withdrawal-band");
});

test("closing a deal: the chosen investor shows delight, the others keep their last reaction", () => {
  const session = answered();
  const offer = activeOffer(session, "sofia");
  const closed = applyFounderAction(session, { kind: "accept", sessionId: session.id, expectedRevision: session.revision, offerId: offer.id });
  assert.equal(closed.outcome?.kind, "accepted-deal");
  assert.equal(sceneCue(closed, "sofia").pose, "Agreeing");
  assert.notEqual(sceneCue(closed, "sofia").key, sceneCue(session, "sofia").key, "the deal replays the reaction");
  for (const investor of ["maya", "adrian"] as const) assert.equal(sceneCue(closed, investor).pose, "Offering");
  const walked = applyFounderAction(session, { kind: "walk-away", sessionId: session.id, expectedRevision: session.revision });
  for (const investor of INVESTOR_ORDER) assert.equal(sceneCue(walked, investor).pose, "Offering", "walking away invents no reaction");
});
