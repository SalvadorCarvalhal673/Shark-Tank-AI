import { validPitch, type Pitch, type Terms } from "../pitch.ts";
import { BASIS_POINTS, snapshotTerms, validOwnership } from "./financials.ts";
import {
  assessEvidence, decideCounter, INVESTOR_ORDER, NEGOTIATION_RULES, openingDecision,
  type CounterDecision, type Evidence, type InvestorId, type InvestorLimits,
} from "./investor-policy.ts";

export type NegotiationPitch = Readonly<Pitch & { founderOwnershipBps: number }>;
export type NegotiationOffer = Readonly<Terms & {
  id: string;
  investor: InvestorId;
  status: "active" | "superseded" | "withdrawn" | "closed" | "accepted";
}>;
export type Outcome =
  | { readonly kind: "accepted-deal"; readonly offerId: string }
  | { readonly kind: "no-offers" | "all-withdrawn" | "founder-walk-away" };

type HistoryEntry = Readonly<{ revision: number } & (
  | { kind: "answer"; investor: InvestorId }
  | { kind: "opening"; investor: InvestorId; decision: "offer" | "pass";
      reason: ReturnType<typeof openingDecision>["reason"]; offerId: string | null }
  | { kind: "counter"; investor: InvestorId; round: number; previousOfferId: string;
      proposed: Readonly<Terms>; decision: CounterDecision["kind"];
      reason: CounterDecision["reason"]; resultingOfferId: string | null }
  | { kind: "finished"; outcome: Outcome }
)>;

export type NegotiationSession = {
  readonly id: string;
  readonly rulesVersion: typeof NEGOTIATION_RULES.version;
  readonly revision: number;
  readonly stage: "questions" | "negotiation" | "final-offers" | "finished";
  readonly pitch: NegotiationPitch;
  readonly answers: readonly Readonly<{ investor: InvestorId; text: string; evidence: Evidence }>[];
  readonly offers: readonly NegotiationOffer[];
  readonly limits: Readonly<Partial<Record<InvestorId, InvestorLimits>>>;
  readonly roundsUsed: number;
  readonly history: readonly HistoryEntry[];
  readonly outcome: Outcome | null;
};

export type FounderAction = Readonly<{ sessionId: string; expectedRevision: number } & (
  | { kind: "answer"; turn: number; text: string }
  | { kind: "counter"; offerId: string; terms: Terms }
  | { kind: "accept"; offerId: string }
  | { kind: "walk-away" }
)>;

function freezeSnapshot<T>(value: T): T {
  // Only engine-owned plain objects and arrays reach this function.
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) return value;
  for (const entry of Object.values(value)) freezeSnapshot(entry);
  return Object.freeze(value);
}

// The caller supplies a fresh ID for each new run. Reusing the same ID is reserved
// for replay of the same run. The engine uses no random numbers or clock.
export function startNegotiation(sessionId: unknown, input: unknown): NegotiationSession | null {
  if (typeof sessionId !== "string" || !/^[a-zA-Z0-9_-]{1,80}$/.test(sessionId) ||
      typeof input !== "object" || input === null) return null;
  const { startup, pitch, currency, amount, equity, founderOwnershipBps: supplied } = input as Partial<NegotiationPitch>;
  const candidate = { startup, pitch, currency, amount, equity };
  if (!validPitch(candidate)) return null;
  const founderOwnershipBps = supplied === undefined ? BASIS_POINTS : supplied;
  if (!validOwnership(founderOwnershipBps)) return null;
  return freezeSnapshot<NegotiationSession>({
    id: sessionId, rulesVersion: NEGOTIATION_RULES.version, revision: 0, stage: "questions",
    pitch: {
      startup: candidate.startup.trim(), pitch: candidate.pitch.trim(), currency: candidate.currency,
      amount: candidate.amount, equity: candidate.equity, founderOwnershipBps,
    },
    answers: [], offers: [], limits: {}, roundsUsed: 0, history: [], outcome: null,
  });
}

function makeOffer(session: NegotiationSession, investor: InvestorId, revision: number, terms: Terms): NegotiationOffer {
  return {
    id: `${session.id}:${investor}:${revision}`,
    investor, amount: terms.amount, equity: terms.equity, status: "active",
  };
}

function finish(session: NegotiationSession, outcome: Outcome): NegotiationSession {
  const acceptedId = outcome.kind === "accepted-deal" ? outcome.offerId : undefined;
  return {
    ...session, stage: "finished", outcome,
    offers: session.offers.map((offer) => offer.status !== "active" ? offer : {
      ...offer, status: offer.id === acceptedId ? "accepted" : "closed",
    }),
    history: [...session.history, { kind: "finished", revision: session.revision, outcome }],
  };
}

function submitAnswer(session: NegotiationSession, expectedTurn: unknown, answerText: unknown): NegotiationSession {
  const turn = session.answers.length;
  const investor = INVESTOR_ORDER[turn];
  if (session.stage !== "questions" || !investor || expectedTurn !== turn || typeof answerText !== "string") return session;
  const text = answerText.trim();
  if (text.length < 10 || text.length > 1500) return session;

  const revision = session.revision + 1;
  const evidence = assessEvidence(investor, text, session.answers.map((answer) => answer.text));
  const answers = [...session.answers, { investor, text, evidence }];
  const history: HistoryEntry[] = [...session.history, { kind: "answer", revision, investor }];
  if (answers.length < INVESTOR_ORDER.length) return { ...session, revision, answers, history };

  const offers: NegotiationOffer[] = [];
  const limits: Partial<Record<InvestorId, InvestorLimits>> = {};
  for (const answer of answers) {
    const decision = openingDecision(session.pitch, answer.evidence);
    const id = answer.investor;
    const offer = decision.kind === "offer" ? makeOffer(session, id, revision, decision.terms) : null;
    if (offer && decision.kind === "offer") {
      offers.push(offer);
      limits[id] = decision.limits;
    }
    history.push({
      kind: "opening", revision, investor: id, decision: decision.kind, reason: decision.reason,
      offerId: offer?.id ?? null,
    });
  }
  const opened: NegotiationSession = { ...session, revision, answers, history, offers, limits, stage: "negotiation" };
  return offers.length ? opened : finish(opened, { kind: "no-offers" });
}

function submitCounter(session: NegotiationSession, offer: NegotiationOffer, proposed: Terms): NegotiationSession {
  const limits = session.limits[offer.investor];
  if (session.stage !== "negotiation" || !limits || session.roundsUsed >= NEGOTIATION_RULES.counterBudget) return session;

  const decision = decideCounter(offer, proposed, limits);
  const revision = session.revision + 1;
  const roundsUsed = session.roundsUsed + 1;
  const fresh = (decision.kind === "agree" || decision.kind === "revise") &&
    (decision.terms.amount !== offer.amount || decision.terms.equity !== offer.equity)
    ? makeOffer(session, offer.investor, revision, decision.terms)
    : null;
  const withdraws = decision.kind === "withdraw";
  const offers: NegotiationOffer[] = session.offers.map((existing) => {
    if (existing.id !== offer.id) return existing;
    if (withdraws) return { ...existing, status: "withdrawn" };
    if (fresh) return { ...existing, status: "superseded" };
    return existing;
  });
  if (fresh) offers.push(fresh);
  const next: NegotiationSession = {
    ...session, revision, roundsUsed, offers,
    stage: roundsUsed === NEGOTIATION_RULES.counterBudget ? "final-offers" : "negotiation",
    history: [...session.history, {
      kind: "counter", revision, round: roundsUsed, investor: offer.investor,
      previousOfferId: offer.id, proposed: { amount: proposed.amount, equity: proposed.equity },
      decision: decision.kind, reason: decision.reason, resultingOfferId: withdraws ? null : fresh?.id ?? offer.id,
    }],
  };
  return offers.some((entry) => entry.status === "active") ? next : finish(next, { kind: "all-withdrawn" });
}

// Reject malformed, stale and out-of-stage actions without modifying any reference.
export function applyFounderAction(session: NegotiationSession, input: unknown): NegotiationSession {
  if (typeof input !== "object" || input === null || session.stage === "finished") return session;
  const action = input as Record<string, unknown>;
  const { sessionId, expectedRevision, kind } = action;
  if (sessionId !== session.id || expectedRevision !== session.revision) return session;
  if (kind === "answer") return freezeSnapshot(submitAnswer(session, action.turn, action.text));
  if (session.stage === "questions") return session;

  if (kind === "walk-away") {
    return freezeSnapshot(finish({ ...session, revision: session.revision + 1 }, { kind: "founder-walk-away" }));
  }
  if (kind !== "accept" && kind !== "counter") return session;
  const offerId = action.offerId;
  const offer = session.offers.find(({ id, status }) => id === offerId && status === "active");
  if (!offer) return session;
  if (kind === "accept") {
    return freezeSnapshot(finish({ ...session, revision: session.revision + 1 }, { kind: "accepted-deal", offerId: offer.id }));
  }
  if (session.stage !== "negotiation") return session;
  const terms = snapshotTerms(action.terms);
  return terms ? freezeSnapshot(submitCounter(session, offer, terms)) : session;
}
