import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceRun, createRun, decodeSave, MAX_RECORD_UNITS, readSlot, removeSave, STORAGE_KEY,
  writeSave, type SaveEnvelope, type SessionRun, type StorageHost,
} from "../src/features/simulation/negotiation/session-storage.ts";
import type { FounderAction } from "../src/features/simulation/negotiation/session.ts";

const pitch = { startup: "Atlas Energy", pitch: "We sell energy monitoring subscriptions to local retail shops.", currency: "EUR", amount: 10_000_000, equity: 1000, founderOwnershipBps: 6000 };
const answers = [
  "Revenue: €9000; Runway: 8 months; Use of funds: install monitoring hardware",
  "Target segment: local retail shops; Acquisition channel: regional hardware distributors; CAC: €30",
  "Customer evidence: buyers requested weekly reporting; Milestone: deliver automated dashboards",
];
function initial() {
  const run = createRun("session-1", pitch);
  assert.ok(run);
  return run;
}
type Intent = Omit<Extract<FounderAction, { kind: "counter" }>, "sessionId" | "expectedRevision"> |
  Omit<Extract<FounderAction, { kind: "accept" }>, "sessionId" | "expectedRevision"> | { kind: "walk-away" };
function action(run: SessionRun, input: Intent) {
  return advanceRun(run, { ...input, sessionId: run.session.id, expectedRevision: run.session.revision });
}
function opened(mask = 7) {
  return answers.reduce((run, text, turn) => advanceRun(run, {
    kind: "answer", turn, text: mask & (1 << turn) ? text : "No evidence available for question " + turn,
    sessionId: run.session.id, expectedRevision: run.session.revision,
  }), initial());
}
function envelope(run = initial(), changes: Partial<SaveEnvelope> = {}): SaveEnvelope {
  return { schemaVersion: 1, rulesVersion: 1, sessionId: run.session.id, pitch: run.session.pitch,
    actions: run.actions, saveId: "save-1", generation: 1, writerId: "writer-1", savedAt: 1000, ...changes };
}
function expectReplay(run: SessionRun) {
  const slot = decodeSave(JSON.stringify(envelope(run)));
  assert.equal(slot.kind, "valid");
  if (slot.kind === "valid") assert.deepEqual(slot.run, run);
}
function fakeHost() {
  let raw: string | null = null;
  let writes = 0;
  let blocked = false;
  let queue: Promise<unknown> = Promise.resolve();
  const host: StorageHost = {
    storage: () => {
      if (blocked) throw new Error("blocked");
      return {
        getItem: (key) => { assert.equal(key, STORAGE_KEY); return raw; },
        setItem: (key, value) => { assert.equal(key, STORAGE_KEY); writes++; raw = value; },
        removeItem: (key) => { assert.equal(key, STORAGE_KEY); raw = null; },
      };
    },
    lock: (task) => {
      const result = queue.then(task);
      queue = result.catch(() => {});
      return result;
    },
  };
  return { host, set: (value: string | null) => { raw = value; }, get: () => raw,
    writes: () => writes, block: (value: boolean) => { blocked = value; } };
}
function request(run = initial(), expectedRaw: string | null = null) {
  return { run, expectedRaw, saveId: "save-1", writerId: "writer-1", savedAt: 1000, replacement: expectedRaw === null, authorized: () => true };
}

test("replay restores each question, final offers and accepted completed debrief", () => {
  let run = initial();
  expectReplay(run);
  for (const [turn, text] of answers.entries()) {
    run = advanceRun(run, { kind: "answer", turn, text, sessionId: run.session.id, expectedRevision: run.session.revision });
    expectReplay(run);
  }
  for (let round = 0; round < 3; round++) {
    const offer = run.session.offers.find((offer) => offer.investor === "maya" && offer.status === "active")!;
    run = action(run, { kind: "counter", offerId: offer.id, terms: { amount: offer.amount, equity: 1000 } });
    expectReplay(run);
  }
  assert.equal(run.session.stage, "final-offers");
  run = action(run, { kind: "accept", offerId: run.session.offers.find((offer) => offer.status === "active")!.id });
  assert.equal(run.actions.length, 7);
  expectReplay(run);
});

test("replay restores all four terminal outcomes", () => {
  expectReplay(opened(0));
  expectReplay(action(opened(), { kind: "walk-away" }));
  const open = opened();
  expectReplay(action(open, { kind: "accept", offerId: open.session.offers[0].id }));
  let withdrawn = open;
  for (const offer of open.session.offers) withdrawn = action(withdrawn, { kind: "counter", offerId: offer.id, terms: { amount: pitch.amount + 1, equity: 1000 } });
  assert.equal(withdrawn.session.outcome?.kind, "all-withdrawn");
  expectReplay(withdrawn);
});

test("maximum-length valid pitch and answers fit the bounded envelope", () => {
  let run = createRun("long", { ...pitch, startup: "x".repeat(80), pitch: "x".repeat(3000) })!;
  for (let turn = 0; turn < 3; turn++) run = advanceRun(run, {
    kind: "answer", turn, text: answers[turn] + " " + "x".repeat(1499 - answers[turn].length),
    sessionId: run.session.id, expectedRevision: run.session.revision,
  });
  expectReplay(run);
  assert.ok(JSON.stringify(envelope(run)).length < MAX_RECORD_UNITS);
});

test("record size is checked before parsing and exact limit is accepted", () => {
  const raw = JSON.stringify(envelope());
  assert.equal(decodeSave(raw + " ".repeat(MAX_RECORD_UNITS - raw.length)).kind, "valid");
  assert.deepEqual(decodeSave("x".repeat(MAX_RECORD_UNITS + 1)), { kind: "invalid", raw: "x".repeat(MAX_RECORD_UNITS + 1), reason: "oversized" });
  assert.equal(decodeSave("{").kind, "invalid");
  const broken = decodeSave("{");
  assert.equal(broken.kind === "invalid" && broken.reason, "malformed");
});

test("schema rejects missing, unexpected, incompatible and unsafe values", () => {
  for (const field of Object.keys(envelope())) {
    const missing = { ...envelope() } as Record<string, unknown>;
    delete missing[field];
    assert.equal(decodeSave(JSON.stringify(missing)).kind, "invalid", field);
  }
  for (const change of [
    { extra: true }, { generation: 0 }, { generation: 1.5 }, { generation: Number.MAX_SAFE_INTEGER + 1 },
    { savedAt: -1 }, { writerId: "" }, { saveId: "x:y" }, { sessionId: "invalid/id" },
    { pitch: { ...pitch, extra: true } }, { pitch: { ...pitch, founderOwnershipBps: -1 } },
    { pitch: { ...pitch, amount: 0 } }, { pitch: { ...pitch, equity: 10001 } },
    { actions: Array(8).fill({}) }, { actions: [{}] },
  ]) assert.equal(decodeSave(JSON.stringify({ ...envelope(), ...change })).kind, "invalid");
  for (const change of [{ schemaVersion: 2 }, { rulesVersion: 2 }]) {
    const slot = decodeSave(JSON.stringify({ ...envelope(), ...change }));
    assert.equal(slot.kind === "invalid" && slot.reason, "incompatible");
  }
});

test("replay rejects duplicate, stale, cross-session and impossible actions", () => {
  const open = opened();
  const first = open.actions[0];
  for (const actions of [
    [first, first], [{ ...first, sessionId: "other" }], [{ ...first, expectedRevision: 1 }],
    [{ ...first, turn: 2 }], [{ ...first, extra: true }], [{ ...first, text: " " }],
    [{ kind: "accept", sessionId: "session-1", expectedRevision: 0, offerId: "session-1:maya:3" }],
  ]) {
    const slot = decodeSave(JSON.stringify(envelope(initial(), { actions: actions as FounderAction[] })));
    assert.equal(slot.kind === "invalid" && slot.reason, "invalid-replay");
  }
  const rejected = advanceRun(open, first);
  assert.equal(rejected, open);
  assert.equal(rejected.actions.length, 3);
  assert.equal(Object.isFrozen(open.actions[0]), true);
});

test("saving is idempotent and generation cannot overflow", async () => {
  const fake = fakeHost();
  const first = await writeSave(fake.host, request());
  assert.equal(first.kind, "saved");
  assert.equal(fake.writes(), 1);
  const raw = fake.get()!;
  const duplicate = await writeSave(fake.host, { ...request(initial(), raw), savedAt: 9999 });
  assert.equal(duplicate.kind, "saved");
  assert.equal(fake.get(), raw);
  assert.equal(fake.writes(), 1);
  fake.set(JSON.stringify(envelope(initial(), { generation: Number.MAX_SAFE_INTEGER })));
  const result = await writeSave(fake.host, request(opened(), fake.get()));
  assert.equal(result.kind, "unavailable");
  assert.equal(fake.writes(), 1);
});

test("simultaneous initial writers serialize and only one wins", async () => {
  const fake = fakeHost();
  const results = await Promise.all([
    writeSave(fake.host, request()),
    writeSave(fake.host, { ...request(), saveId: "save-2", writerId: "writer-2" }),
  ]);
  assert.deepEqual(results.map(({ kind }) => kind), ["saved", "conflict"]);
  assert.equal(fake.writes(), 1);
});

test("whole-record comparison catches external changes with identical generation", async () => {
  const fake = fakeHost();
  const original = JSON.stringify(envelope());
  fake.set(original + " ");
  assert.equal((await writeSave(fake.host, request(opened(), original))).kind, "conflict");
  assert.equal((await removeSave(fake.host, original, () => true)).kind, "conflict");
  assert.equal(fake.get(), original + " ");
});

test("queued cancellations prevent late writes and removal prevents recreation", async () => {
  const fake = fakeHost();
  let allowed = true;
  const pending = writeSave(fake.host, { ...request(), authorized: () => allowed });
  allowed = false;
  assert.equal((await pending).kind, "cancelled");
  assert.equal(fake.get(), null);
  await writeSave(fake.host, request());
  const old = fake.get();
  assert.equal((await removeSave(fake.host, old, () => true)).kind, "removed");
  assert.equal((await writeSave(fake.host, request(opened(), old))).kind, "conflict");
  assert.equal(fake.get(), null);
});

test("blocked storage, quota and lock failures return safe outcomes", async () => {
  const fake = fakeHost();
  fake.block(true);
  assert.equal(readSlot(fake.host).kind, "unavailable");
  assert.equal((await writeSave(fake.host, request())).kind, "unavailable");
  assert.equal((await removeSave(fake.host, null, () => true)).kind, "unavailable");
  fake.block(false);
  const failLock: StorageHost = { ...fake.host, lock: async () => { throw new Error("lock failure"); } };
  assert.equal((await writeSave(failLock, request())).kind, "unavailable");
  const quota: StorageHost = { ...fake.host, storage: () => ({ ...fake.host.storage(), setItem: () => { throw new Error("quota"); } }) };
  assert.equal((await writeSave(quota, request())).kind, "unavailable");
  assert.equal((await writeSave(fake.host, request())).kind, "saved");
});

test("corrupt records stay intact until an exactly confirmed replacement or removal", async () => {
  const fake = fakeHost();
  fake.set("{");
  const invalid = await writeSave(fake.host, { ...request(), expectedRaw: "{", replacement: false });
  assert.equal(invalid.kind, "conflict");
  assert.equal(fake.get(), "{");
  const replacement = await writeSave(fake.host, { ...request(), expectedRaw: "{", replacement: true });
  assert.equal(replacement.kind, "saved");
  const before = fake.get();
  assert.equal((await removeSave(fake.host, "{", () => true)).kind, "conflict");
  assert.equal(fake.get(), before);
  assert.equal((await removeSave(fake.host, before, () => true)).kind, "removed");
});

test("append-only writes reject older or divergent journals and reused replacement identities", async () => {
  const fake = fakeHost();
  const open = opened();
  const raw = JSON.stringify(envelope(open));
  fake.set(raw);
  assert.equal((await writeSave(fake.host, request(initial(), raw))).kind, "conflict");
  const changedPitch = createRun("session-1", { ...pitch, startup: "Changed" })!;
  assert.equal((await writeSave(fake.host, request(changedPitch, raw))).kind, "conflict");
  const divergent = advanceRun(initial(), {
    kind: "answer", turn: 0, text: "Revenue: 5000", sessionId: "session-1", expectedRevision: 0,
  });
  assert.equal((await writeSave(fake.host, request(divergent, raw))).kind, "conflict");
  assert.equal((await writeSave(fake.host, { ...request(initial(), raw), replacement: true, saveId: "different" })).kind, "conflict");
  assert.equal(fake.get(), raw);
});

test("timestamp and identifier boundaries reject unsafe or unrenderable metadata", () => {
  for (const savedAt of [0, -1, 1.5, 8_640_000_000_000_001, Number.MAX_SAFE_INTEGER]) {
    assert.equal(decodeSave(JSON.stringify(envelope(initial(), { savedAt }))).kind, "invalid");
  }
  assert.equal(decodeSave(JSON.stringify(envelope(initial(), { savedAt: 8_640_000_000_000_000 }))).kind, "valid");
  for (const saveId of ["", "x".repeat(81), "bad:id", "<script>"]) {
    assert.equal(decodeSave(JSON.stringify(envelope(initial(), { saveId }))).kind, "invalid");
  }
});

test("review: authorization is rechecked after reading and immediately before mutation", async () => {
  for (const removal of [false, true]) {
    const fake = fakeHost();
    if (removal) fake.set(JSON.stringify(envelope()));
    const raw = fake.get();
    let authorized = true;
    let mutations = 0;
    const host: StorageHost = { ...fake.host, storage: () => ({
      getItem: () => { authorized = false; return raw; },
      setItem: () => { mutations++; }, removeItem: () => { mutations++; },
    }) };
    const result = removal ? await removeSave(host, raw, () => authorized)
      : await writeSave(host, { ...request(), authorized: () => authorized });
    assert.equal(result.kind, "cancelled");
    assert.equal(mutations, 0);
    assert.equal(fake.get(), raw);
  }
});

test("review: plausible but inconsistent identities and histories are rejected in full", () => {
  const open = opened();
  const accepted = action(open, { kind: "accept", offerId: open.session.offers[0].id });
  const tampered = [
    { ...envelope(open), sessionId: "other-session" },
    envelope(open, { actions: open.actions.map((entry, index) => index === 1 ? { ...entry, expectedRevision: 0 } : entry) }),
    envelope(open, { actions: [open.actions[1], open.actions[0], open.actions[2]] }),
    envelope(open, { actions: [...open.actions, { kind: "accept", sessionId: open.session.id, expectedRevision: 3, offerId: "other-session:maya:3" }] }),
    envelope(open, { actions: [...open.actions, { kind: "counter", sessionId: open.session.id, expectedRevision: 3, offerId: open.session.offers[0].id, terms: { amount: 1, equity: 0 } }] }),
    envelope(accepted, { actions: [...accepted.actions, { kind: "walk-away", sessionId: open.session.id, expectedRevision: 4 }] }),
  ];
  for (const record of tampered) assert.equal(decodeSave(JSON.stringify(record)).kind, "invalid");
});

test("review: prototype keys in every schema layer never pollute prototypes", () => {
  const open = opened();
  const counter = action(open, { kind: "counter", offerId: open.session.offers[0].id, terms: { amount: pitch.amount, equity: 1000 } });
  const base = JSON.stringify(envelope(counter));
  const original = (Object.prototype as Record<string, unknown>).reviewPolluted;
  const root = JSON.parse(base);
  for (const target of [root, root.pitch, root.actions[0], root.actions[3], root.actions[3].terms]) {
    Object.defineProperty(target, "__proto__", { value: { reviewPolluted: true }, enumerable: true, configurable: true });
    assert.equal(decodeSave(JSON.stringify(root)).kind, "invalid");
    delete target.__proto__;
  }
  assert.equal((Object.prototype as Record<string, unknown>).reviewPolluted, original);
  expectReplay(opened());
});
