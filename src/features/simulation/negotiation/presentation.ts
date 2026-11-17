import { ownershipAfterInvestment } from "./financials.ts";
import type { Evidence, InvestorId } from "./investor-policy.ts";
import type { NegotiationSession, FounderAction, Outcome } from "./session.ts";

type Event = NegotiationSession["history"][number];
type Opening = Extract<Event, { kind: "opening" }>;
type Counter = Extract<Event, { kind: "counter" }>;

export const specialties = {
  maya: "Finance", adrian: "Growth", sofia: "Operations",
} satisfies Record<InvestorId, string>;

export const openingCopy = {
  "required-signals-supplied": "I recognized the signals I asked for and have an opening offer.",
  "missing-required-signals": "I could not identify all the signals I asked for, so I am passing.",
  "repeated-answer": "This repeats an earlier answer. I am passing because I could not assess a separate response to my question.",
} satisfies Record<Opening["reason"], string>;

export const counterCopy = {
  "above-cash-ceiling": "I withdrew because the requested investment exceeds my cash limit.",
  "below-withdrawal-band": "I withdrew because the equity requested is below the range I can negotiate.",
  "within-limits": "I agreed to your counter. Accept the offer to complete the deal.",
  "limited-concession": "I revised my offer within the terms I can negotiate.",
  "at-concession-limit": "My offer is unchanged. I cannot concede more on these terms.",
} satisfies Record<Counter["reason"], string>;

export const outcomeCopy = {
  "accepted-deal": "You confirmed one offer. All other active offers closed.",
  "no-offers": "The investors passed during the opening decisions. There were no offers to negotiate.",
  "all-withdrawn": "All remaining investors withdrew during negotiation.",
  "founder-walk-away": "You chose to walk away. The remaining offers closed.",
} satisfies Record<Outcome["kind"], string>;

type Signal = Evidence["signals"][number]["signal"];
export const signalCopy = {
  "named-financial-figure": "Name a financial measure and give its figure, such as Revenue: €9,000.",
  "runway-duration": "Give your runway in months, such as Runway: 8 months.",
  "use-of-funds": "Describe what the investment would pay for.",
  "target-segment": "Describe the specific customers you want to reach first.",
  "acquisition-channel": "Describe how you will reach those customers.",
  "acquisition-measure": "Include a measured acquisition figure, such as conversion rate or customer acquisition cost.",
  "customer-observation": "Describe something you observed from customers, such as a request or buying behavior.",
  "delivery-milestone": "Describe the next concrete result your team will deliver.",
} satisfies Record<Signal, string>;

export type PendingOffer = {
  readonly kind: "counter" | "confirm";
  readonly sessionId: string;
  readonly expectedRevision: number;
  readonly offerId: string;
};

export function pendingForSession(session: NegotiationSession, pending: PendingOffer | null): PendingOffer | null {
  if (!pending || pending.sessionId !== session.id || pending.expectedRevision !== session.revision) return null;
  if (session.stage !== "negotiation" && session.stage !== "final-offers") return null;
  if (pending.kind === "counter" && session.stage !== "negotiation") return null;
  return session.offers.some(({ id, status }) => id === pending.offerId && status === "active") ? pending : null;
}

export function acceptanceAction(session: NegotiationSession, pending: PendingOffer): FounderAction | null {
  if (pending.kind !== "confirm" || pendingForSession(session, pending) === null) return null;
  return { kind: "accept", sessionId: pending.sessionId, expectedRevision: pending.expectedRevision, offerId: pending.offerId };
}

export function latestCounter(session: NegotiationSession): Counter | undefined {
  return session.history.findLast((event) => event.kind === "counter" && event.revision === session.revision) as Counter | undefined;
}

export function investorActivity(session: NegotiationSession, investor: InvestorId): (Opening | Counter)[] {
  return session.history.filter((event): event is Opening | Counter =>
    (event.kind === "opening" || event.kind === "counter") && event.investor === investor);
}

export function ownershipPresentation(founderBeforeBps: number, equityBps: number) {
  const cap = ownershipAfterInvestment(founderBeforeBps, equityBps);
  return cap ? { ...cap, otherExistingBeforeBps: 10000 - cap.founderBeforeBps } : null;
}

export const historicalCounterCopy = {
  "above-cash-ceiling": "Investor withdrew because the requested investment exceeded the cash limit.",
  "below-withdrawal-band": "Investor withdrew because requested equity was below the negotiable range.",
  "within-limits": "Investor agreed to the proposed terms. Founder acceptance was still required.",
  "limited-concession": "Investor revised the offer within its negotiation limits.",
  "at-concession-limit": "Investor retained the current offer without changing its terms.",
} satisfies Record<Counter["reason"], string>;