import test from "node:test";
import assert from "node:assert/strict";
import { latestConcession } from "../src/features/studio/concession.ts";
import { demonstrationAnswers, demonstrationPitch, financialPreview, sceneCue } from "../src/features/studio/model.ts";
import { applyFounderAction, startNegotiation, type NegotiationSession } from "../src/features/simulation/negotiation/session.ts";
import { INVESTOR_ORDER, type InvestorId } from "../src/features/simulation/negotiation/investor-policy.ts";
import type { Terms } from "../src/features/simulation/pitch.ts";

// Issue #29: concessions depict only committed agreed / revised / unchanged terms, with each investor
// playing their own clip while the others keep theirs.

const opened = () => demonstrationAnswers.reduce((session, text, turn) =>
  applyFounderAction(session, { kind: "answer", sessionId: session.id, expectedRevision: session.revision, turn, text }), startNegotiation("concession-test", demonstrationPitch)!);
const active = (session: NegotiationSession, investor: InvestorId) => session.offers.find(offer => offer.investor === investor && offer.status === "active")!;
const counter = (session: NegotiationSession, investor: InvestorId, terms: Terms) =>
  applyFounderAction(session, { kind: "counter", sessionId: session.id, expectedRevision: session.revision, offerId: active(session, investor).id, terms });
const others = (session: NegotiationSession, investor: InvestorId) => INVESTOR_ORDER.filter(id => id !== investor).map(id => sceneCue(session, id).key);

test("no concession is shown before a counter, and previews never create one", () => {
  const session = opened(), before = JSON.stringify(session);
  for (const investor of INVESTOR_ORDER) assert.equal(latestConcession(session, investor), null);
  financialPreview("1", "1", session.pitch.founderOwnershipBps);
  assert.equal(JSON.stringify(session), before);
  assert.equal(latestConcession(null, "maya"), null);
});

test("a revision shows the committed before and after terms and the founder's exact proposal", () => {
  const session = opened(), offer = active(session, "maya"), floor = session.limits.maya!.equityFloor;
  const proposed = { amount: offer.amount, equity: floor - 1 };
  const next = counter(session, "maya", proposed);
  const concession = latestConcession(next, "maya")!;
  assert.equal(concession.kind, "revise");
  assert.deepEqual(concession.before, { amount: offer.amount, equity: offer.equity });
  assert.deepEqual(concession.proposed, proposed);
  assert.deepEqual(concession.after, { amount: active(next, "maya").amount, equity: active(next, "maya").equity });
  assert.ok(concession.after.equity < concession.before.equity && concession.after.equity >= floor, "a real, bounded concession");
  assert.equal(concession.pose, "Considering");
  assert.equal(sceneCue(next, "maya").pose, "Considering");
  assert.deepEqual(others(next, "maya"), others(session, "maya"), "the other investors keep their own clips");
});

test("an agreement shows the founder's terms as the investor's committed terms", () => {
  const session = opened(), offer = active(session, "adrian");
  const proposed = { amount: offer.amount, equity: session.limits.adrian!.equityFloor };
  const concession = latestConcession(counter(session, "adrian", proposed), "adrian")!;
  assert.equal(concession.kind, "agree");
  assert.deepEqual(concession.after, proposed);
  assert.equal(concession.pose, "Agreeing");
});

test("an unchanged offer shows identical before and after terms", () => {
  let session = opened();
  const floor = session.limits.sofia!.equityFloor;
  while (active(session, "sofia").equity > floor) session = counter(session, "sofia", { amount: active(session, "sofia").amount, equity: floor - 1 });
  session = counter(session, "sofia", { amount: active(session, "sofia").amount, equity: floor - 1 });
  const concession = latestConcession(session, "sofia")!;
  assert.equal(concession.kind, "unchanged");
  assert.deepEqual(concession.after, concession.before);
  assert.equal(concession.pose, "Firm");
});

test("a withdrawal is not a concession", () => {
  const session = opened();
  const withdrawn = counter(session, "maya", { amount: active(session, "maya").amount, equity: 1 });
  assert.equal(latestConcession(withdrawn, "maya"), null);
});
