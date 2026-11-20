import { parseUniqueJson } from "./json.ts";
import { PURPOSES, MAX_REQUEST_BYTES, type Binding, type BrowserRequest } from "./contracts.ts";
import { INVESTOR_ORDER } from "../simulation/negotiation/investor-policy.ts";
import { validPitch } from "../simulation/pitch.ts";
import { validOwnership } from "../simulation/negotiation/financials.ts";
import { canonicalAction } from "../simulation/negotiation/session-storage.ts";
export function record(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v) &&
    (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);
}
export function exact(v: unknown, keys: readonly string[]): v is Record<string, unknown> {
  return record(v) && Object.keys(v).length === keys.length && keys.every(k => Object.hasOwn(v,k));
}
export function id(v: unknown): v is string { return typeof v === "string" && /^[A-Za-z0-9_-]{1,80}$/.test(v); }
export function integer(v: unknown, max = Number.MAX_SAFE_INTEGER): v is number {
  return typeof v === "number" && Number.isSafeInteger(v) && v >= 0 && v <= max;
}
export function bounded(v: unknown, max: number, min = 1): v is string {
  return typeof v === "string" && v.length <= max && v.trim().length >= min;
}
export function investor(v: unknown): v is typeof INVESTOR_ORDER[number] {
  return INVESTOR_ORDER.some(i => i === v);
}
export function validBinding(v: unknown): v is Binding {
  return exact(v,["sessionId","revision","requestId","epoch","investorId","purpose"]) &&
    id(v.sessionId) && integer(v.revision,7) && id(v.requestId) && integer(v.epoch) &&
    investor(v.investorId) && PURPOSES.some(p => p === v.purpose);
}
export function sameBinding(a: Binding, b: Binding): boolean {
  return a.sessionId === b.sessionId && a.revision === b.revision && a.requestId === b.requestId &&
    a.epoch === b.epoch && a.investorId === b.investorId && a.purpose === b.purpose;
}
export function frozenCopy<T>(v: T): T {
  const copy = structuredClone(v);
  function freeze(x: unknown) {
    if (x && typeof x === "object") { Object.values(x).forEach(freeze); Object.freeze(x); }
  }
  freeze(copy); return copy;
}
export function parseRequest(raw: string): BrowserRequest | null {
  if (typeof raw !== "string" || new TextEncoder().encode(raw).length > MAX_REQUEST_BYTES) return null;
  let v: unknown; try { v = parseUniqueJson(raw); } catch { return null; }
  if (!exact(v,["contractVersion","rulesVersion","binding","pitch","actions","history","consent"]) ||
      v.contractVersion !== 1 || v.rulesVersion !== 1 || !validBinding(v.binding) ||
      !exact(v.pitch,["startup","pitch","currency","amount","equity","founderOwnershipBps"]) ||
      !validOwnership(v.pitch.founderOwnershipBps) || !validPitch(v.pitch) || !bounded(v.pitch.startup,80,2) || !bounded(v.pitch.pitch,3000,30) ||
      !Array.isArray(v.actions) || v.actions.length > 7 ||
      !v.actions.every(a => canonicalAction(a) !== null) ||
      !Array.isArray(v.history) || v.history.length > 6 ||
      !v.history.every(h => exact(h,["id","investorId","text"]) && id(h.id) && investor(h.investorId) && bounded(h.text,600)) ||
      new Set(v.history.map(h => h.id)).size !== v.history.length) return null;
  if (v.consent !== null && (!exact(v.consent,["version","accepted","sessionId","provider","scope"]) ||
      v.consent.version !== 1 || v.consent.accepted !== true || v.consent.sessionId !== v.binding.sessionId ||
      !["openai","anthropic","google"].includes(String(v.consent.provider)) || v.consent.scope !== "investor-dialogue")) return null;
  return frozenCopy(v as BrowserRequest);
}
// Runtime functions above remain authoritative; this descriptor documents the bounded wire format.
export const REQUEST_SCHEMA = Object.freeze({
  version: 1, additionalProperties: false, maxBytes: MAX_REQUEST_BYTES,
  maxActions: 7, maxHistory: 6, maxHistoryText: 600,
});
