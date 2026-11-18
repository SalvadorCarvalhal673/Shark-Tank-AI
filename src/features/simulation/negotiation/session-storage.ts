import { validPitch, validTerms } from "../pitch.ts";
import { validOwnership } from "./financials.ts";
import {
  applyFounderAction, startNegotiation, type FounderAction, type NegotiationSession,
} from "./session.ts";

export const STORAGE_KEY = "shark-tank-ai.session";
export const STORAGE_LOCK = "shark-tank-ai.session.write";
export const MAX_RECORD_UNITS = 65_536;
// Rules v1 permits three answers, three counters, and one explicit terminal action.
export const MAX_ACTIONS = 7;

export type SessionRun = Readonly<{
  session: NegotiationSession;
  actions: readonly FounderAction[];
}>;
export type SaveEnvelope = {
  schemaVersion: 1;
  rulesVersion: 1;
  sessionId: string;
  pitch: NegotiationSession["pitch"];
  actions: readonly FounderAction[];
  saveId: string;
  generation: number;
  writerId: string;
  savedAt: number;
};
export type StoredSlot =
  | { kind: "empty"; raw: null }
  | { kind: "valid"; raw: string; envelope: SaveEnvelope; run: SessionRun }
  | { kind: "invalid"; raw: string; reason: "malformed" | "oversized" | "incompatible" | "schema" | "invalid-replay" }
  | { kind: "unavailable"; raw: null };

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function exact(value: unknown, keys: string[]): value is Record<string, unknown> {
  return object(value) && Object.keys(value).length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key));
}
function id(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{1,80}$/.test(value);
}
function offerId(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{1,80}:(maya|adrian|sofia):[1-7]$/.test(value);
}
function safeInteger(value: unknown, minimum: number): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= minimum;
}

export function canonicalAction(value: unknown): FounderAction | null {
  if (!object(value) || !id(value.sessionId) || !safeInteger(value.expectedRevision, 0) ||
      value.expectedRevision >= MAX_ACTIONS) return null;
  const base = { sessionId: value.sessionId, expectedRevision: value.expectedRevision };
  switch (value.kind) {
    case "answer":
      if (!exact(value, ["kind", "sessionId", "expectedRevision", "turn", "text"]) ||
          !safeInteger(value.turn, 0) || value.turn > 2 || typeof value.text !== "string" ||
          value.text.length > 1500 || value.text.trim().length < 10) return null;
      return Object.freeze({ ...base, kind: "answer", turn: value.turn, text: value.text });
    case "counter":
      if (!exact(value, ["kind", "sessionId", "expectedRevision", "offerId", "terms"]) ||
          !offerId(value.offerId) || !exact(value.terms, ["amount", "equity"]) || !validTerms(value.terms)) return null;
      return Object.freeze({
        ...base, kind: "counter", offerId: value.offerId,
        terms: Object.freeze({ amount: value.terms.amount, equity: value.terms.equity }),
      });
    case "accept":
      if (!exact(value, ["kind", "sessionId", "expectedRevision", "offerId"]) || !offerId(value.offerId)) return null;
      return Object.freeze({ ...base, kind: "accept", offerId: value.offerId });
    case "walk-away":
      return exact(value, ["kind", "sessionId", "expectedRevision"])
        ? Object.freeze({ ...base, kind: "walk-away" }) : null;
    default: return null;
  }
}

// Pure shared transition. Rejected actions preserve both session and journal.
export function advanceRun(run: SessionRun, input: unknown): SessionRun {
  const action = canonicalAction(input);
  if (!action || run.actions.length >= MAX_ACTIONS) return run;
  const session = applyFounderAction(run.session, action);
  if (session === run.session || session.revision !== run.session.revision + 1) return run;
  return Object.freeze({ session, actions: Object.freeze([...run.actions, action]) });
}

export function createRun(sessionId: string, pitch: unknown): SessionRun | null {
  const session = startNegotiation(sessionId, pitch);
  return session ? Object.freeze({ session, actions: Object.freeze([]) }) : null;
}

export function decodeSave(raw: string | null): Exclude<StoredSlot, { kind: "unavailable" }> {
  if (raw === null) return { kind: "empty", raw: null };
  const invalid = (reason: Extract<StoredSlot, { kind: "invalid" }>["reason"]): Extract<StoredSlot, { kind: "invalid" }> =>
    ({ kind: "invalid", raw, reason });
  if (raw.length > MAX_RECORD_UNITS) return invalid("oversized");
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return invalid("malformed"); }
  if (!object(value)) return invalid("schema");
  if ((safeInteger(value.schemaVersion, 1) && value.schemaVersion !== 1) ||
      (safeInteger(value.rulesVersion, 1) && value.rulesVersion !== 1)) return invalid("incompatible");
  if (!exact(value, [
    "schemaVersion", "rulesVersion", "sessionId", "pitch", "actions",
    "saveId", "generation", "writerId", "savedAt",
  ]) || value.schemaVersion !== 1 || value.rulesVersion !== 1 ||
      !id(value.sessionId) || !id(value.saveId) || !id(value.writerId) ||
      !safeInteger(value.generation, 1) || !safeInteger(value.savedAt, 1) || value.savedAt > 8_640_000_000_000_000 ||
      !exact(value.pitch, ["startup", "pitch", "currency", "amount", "equity", "founderOwnershipBps"]) ||
      !validOwnership(value.pitch.founderOwnershipBps) || !validPitch(value.pitch) ||
      !Array.isArray(value.actions) || value.actions.length > MAX_ACTIONS) return invalid("schema");
  let run = createRun(value.sessionId, value.pitch);
  if (!run) return invalid("schema");
  for (const input of value.actions) {
    const next = advanceRun(run, input);
    if (next === run) return invalid("invalid-replay");
    run = next;
  }
  const envelope: SaveEnvelope = {
    schemaVersion: 1, rulesVersion: 1, sessionId: run.session.id, pitch: run.session.pitch,
    actions: run.actions, saveId: value.saveId, generation: value.generation,
    writerId: value.writerId, savedAt: value.savedAt,
  };
  return { kind: "valid", raw, envelope, run };
}

type StoragePort = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type Lock = <T>(task: () => T) => Promise<T>;
export type StorageHost = { storage: () => StoragePort; lock: Lock };
export type MutationResult =
  | { kind: "saved"; slot: Extract<StoredSlot, { kind: "valid" }> }
  | { kind: "removed" | "cancelled" }
  | { kind: "conflict"; slot: StoredSlot }
  | { kind: "unavailable" };

export function browserStorageHost(): StorageHost {
  return {
    storage: () => window.localStorage,
    lock: (task) => {
      if (!navigator.locks?.request) return Promise.reject(new Error("Coordinated storage unavailable"));
      const cancellation = new AbortController();
      const timeout = window.setTimeout(() => cancellation.abort(), 3000);
      return navigator.locks.request(STORAGE_LOCK, { mode: "exclusive", signal: cancellation.signal }, task)
        .finally(() => window.clearTimeout(timeout));
    },
  };
}

export function readSlot(host: StorageHost): StoredSlot {
  try { return decodeSave(host.storage().getItem(STORAGE_KEY)); }
  catch { return { kind: "unavailable", raw: null }; }
}

export async function writeSave(host: StorageHost, request: {
  run: SessionRun;
  expectedRaw: string | null;
  saveId: string;
  writerId: string;
  savedAt: number;
  replacement: boolean;
  authorized: () => boolean;
}): Promise<MutationResult> {
  try {
    return await host.lock(() => {
      if (!request.authorized()) return { kind: "cancelled" };
      const storage = host.storage();
      const raw = storage.getItem(STORAGE_KEY);
      if (raw !== request.expectedRaw) return { kind: "conflict", slot: decodeSave(raw) };
      const prior = decodeSave(raw);
      if (!request.replacement && (prior.kind !== "valid" ||
          prior.envelope.saveId !== request.saveId || prior.envelope.sessionId !== request.run.session.id)) {
        return { kind: "conflict", slot: prior };
      }
      if (!request.replacement && prior.kind === "valid" &&
          (JSON.stringify(prior.envelope.pitch) !== JSON.stringify(request.run.session.pitch) ||
           prior.envelope.actions.length > request.run.actions.length ||
           JSON.stringify(prior.envelope.actions) !== JSON.stringify(request.run.actions.slice(0, prior.envelope.actions.length)))) {
        return { kind: "conflict", slot: prior };
      }
      if (!request.replacement && prior.kind === "valid" &&
          JSON.stringify(prior.envelope.actions) === JSON.stringify(request.run.actions) &&
          JSON.stringify(prior.envelope.pitch) === JSON.stringify(request.run.session.pitch)) {
        return { kind: "saved", slot: prior };
      }
      const generation = request.replacement ? 1 : prior.kind === "valid" ? prior.envelope.generation + 1 : 1;
      if (!Number.isSafeInteger(generation)) return { kind: "unavailable" };
      if (request.replacement && prior.kind === "valid" && (prior.envelope.saveId === request.saveId || prior.envelope.sessionId === request.run.session.id)) {
        return { kind: "conflict", slot: prior };
      }
      const envelope: SaveEnvelope = {
        schemaVersion: 1, rulesVersion: 1, sessionId: request.run.session.id,
        pitch: request.run.session.pitch, actions: request.run.actions,
        saveId: request.saveId, generation, writerId: request.writerId, savedAt: request.savedAt,
      };
      const serialized = JSON.stringify(envelope);
      const checked = decodeSave(serialized);
      if (checked.kind !== "valid") return { kind: "unavailable" };
      // Recheck cancellation immediately before touching the slot.
      if (!request.authorized()) return { kind: "cancelled" };
      storage.setItem(STORAGE_KEY, serialized);
      if (storage.getItem(STORAGE_KEY) !== serialized) return { kind: "conflict", slot: readSlot(host) };
      return { kind: "saved", slot: checked };
    });
  } catch { return { kind: "unavailable" }; }
}

export async function removeSave(host: StorageHost, expectedRaw: string | null, authorized: () => boolean): Promise<MutationResult> {
  try {
    return await host.lock(() => {
      if (!authorized()) return { kind: "cancelled" };
      const storage = host.storage();
      const raw = storage.getItem(STORAGE_KEY);
      if (raw !== expectedRaw) return { kind: "conflict", slot: decodeSave(raw) };
      if (!authorized()) return { kind: "cancelled" };
      storage.removeItem(STORAGE_KEY);
      if (storage.getItem(STORAGE_KEY) !== null) return { kind: "conflict", slot: readSlot(host) };
      return { kind: "removed" };
    });
  } catch { return { kind: "unavailable" }; }
}
