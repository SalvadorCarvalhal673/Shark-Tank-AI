// Browser side of the investor voice (Phase 4D, Issues #57–#65). It turns the committed run into the
// exact BrowserRequest contract, calls the server route and accepts only a response that passes the
// same validation the server uses, bound to the same session, revision, request and epoch. It never
// returns actions: the deterministic engine stays the only authority for money, equity and outcomes.
import type { AppResponse, Binding, BrowserRequest, Failure, Purpose } from "./contracts.ts";
import { buildContext, type ConversationContext } from "./context.ts";
import { parseAppResponse } from "./response.ts";
import { INVESTOR_ORDER, type InvestorId } from "../simulation/negotiation/investor-policy.ts";
import type { SessionRun } from "../simulation/negotiation/session-storage.ts";

export const INVESTOR_VOICE_ENDPOINT = "/api/investor";

export type VoiceTarget = Readonly<{ investorId: InvestorId; purpose: Purpose }>;

/**
 * What the investor voice should narrate for the latest committed moment, or null when there is
 * nothing new to say. One request per committed revision keeps cost bounded and replies current.
 * DECISION: narrate the latest committed event only (opening question, answer feedback, counter
 * explanation or outcome); the founder can additionally ask the open investor for one clarification.
 */
export function narrationTarget(run: SessionRun): VoiceTarget | null {
  const { session } = run;
  const last = run.actions.at(-1);
  if (session.stage === "finished") {
    const outcome = session.outcome;
    const investor = outcome?.kind === "accepted-deal" ? session.offers.find(offer => offer.id === outcome.offerId)?.investor : undefined;
    const lastEvent = session.history.findLast(event => event.kind === "counter" || event.kind === "opening");
    return { investorId: investor ?? (lastEvent && "investor" in lastEvent ? lastEvent.investor : INVESTOR_ORDER[0]), purpose: "outcome" };
  }
  if (last?.kind === "counter") {
    const counter = session.history.findLast(event => event.kind === "counter");
    return counter?.kind === "counter" && counter.revision === session.revision ? { investorId: counter.investor, purpose: "counter-explanation" } : null;
  }
  if (last?.kind === "answer") {
    const answered = session.answers.at(-1);
    return answered ? { investorId: answered.investor, purpose: "answer-feedback" } : null;
  }
  if (!last && session.stage === "questions") return { investorId: INVESTOR_ORDER[0], purpose: "question" };
  return null;
}

/** The investor whose question is open, for the optional clarification exchange. */
export function clarificationTarget(run: SessionRun): VoiceTarget | null {
  const { session } = run;
  const asking = session.stage === "questions" ? INVESTOR_ORDER[session.answers.length] : undefined;
  return asking ? { investorId: asking, purpose: "question" } : null;
}

export function buildVoiceRequest(run: SessionRun, target: VoiceTarget, requestId: string, epoch: number): BrowserRequest {
  const binding: Binding = { sessionId: run.session.id, revision: run.session.revision, requestId, epoch, investorId: target.investorId, purpose: target.purpose };
  // Only committed actions are sent; drafts never leave the page. Consent stays null: no external
  // provider is wired, and the server refuses to transmit founder text to one without consent.
  return { contractVersion: 1, rulesVersion: 1, binding, pitch: run.session.pitch, actions: [...run.actions], history: [], consent: null };
}

export type VoiceResult =
  | { readonly kind: "reply"; readonly response: AppResponse; readonly context: ConversationContext }
  | { readonly kind: "unavailable"; readonly status: number }
  | { readonly kind: "rejected"; readonly reason: "invalid-response" | "invalid-request" }
  | { readonly kind: "failed"; readonly reason: "network" | "timeout" | "cancelled" };

type Fetcher = (input: string, init: RequestInit) => Promise<Response>;

/**
 * Calls the route and validates the reply against a context rebuilt from the same committed journal.
 * A reply that names other terms, another binding or an unknown provenance is rejected, never shown.
 */
export async function requestInvestorVoice(request: BrowserRequest, signal: AbortSignal, fetcher: Fetcher = fetch, timeoutMs = 15000): Promise<VoiceResult> {
  const context = buildContext(request);
  if (!context) return { kind: "rejected", reason: "invalid-request" };
  const deadline = new AbortController();
  const abort = () => deadline.abort();
  signal.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(() => deadline.abort(new DOMException("timeout", "TimeoutError")), timeoutMs);
  try {
    const response = await fetcher(INVESTOR_VOICE_ENDPOINT, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request),
      signal: deadline.signal, cache: "no-store", credentials: "same-origin",
    });
    if (response.status !== 200) return { kind: "unavailable", status: response.status };
    const parsed = parseAppResponse(await response.text(), context);
    if (signal.aborted) return { kind: "failed", reason: "cancelled" };
    return parsed ? { kind: "reply", response: parsed, context } : { kind: "rejected", reason: "invalid-response" };
  } catch {
    return signal.aborted ? { kind: "failed", reason: "cancelled" } : deadline.signal.aborted ? { kind: "failed", reason: "timeout" } : { kind: "failed", reason: "network" };
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", abort);
  }
}

/** Engine-owned figures for the narrated investor, shown beside any AI text (Issue #61). */
export function engineFacts(context: ConversationContext) {
  return context.financialFacts.filter(fact => fact.investorId === context.request.binding.investorId && fact.status === "active");
}

/** Honest, specific recovery messages (Issue #64/#65): what happened and that nothing was lost. */
export function recoveryNote(result: Exclude<VoiceResult, { kind: "reply" }>): { reason: Failure; note: string } | null {
  if (result.kind === "unavailable") {
    if (result.status === 409) return null; // stale or duplicate: a newer request owns the view
    if (result.status === 503) return { reason: "missing-credentials", note: "The AI investor voice is not available in this build, so the scripted reply is shown. Your answers, drafts and saved progress are unchanged." };
    if (result.status === 429) return { reason: "budget", note: "The AI request limit was reached, so the scripted reply is shown. Your answers, drafts and saved progress are unchanged." };
    return { reason: "network", note: `The AI service answered with an error (${result.status}), so the scripted reply is shown. Nothing else changed.` };
  }
  if (result.kind === "rejected") return result.reason === "invalid-response"
    ? { reason: "invalid-output", note: "An AI reply did not match the committed session and was discarded. The scripted reply is shown instead." }
    : null;
  if (result.reason === "cancelled") return null;
  return result.reason === "timeout"
    ? { reason: "timeout", note: "The AI reply took too long, so the scripted reply is shown. Nothing was lost." }
    : { reason: "network", note: "The AI service could not be reached, so the scripted reply is shown. Nothing was lost." };
}

