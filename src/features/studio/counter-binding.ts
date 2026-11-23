// Counter binding for the studio (Issue #28). Says exactly which offer, session and revision a counter
// would be bound to, and how the three shared counters stand. Pure: it never dispatches. The engine
// (session.ts) stays the only authority; a stale or repeated action is rejected there and adds no
// journal entry.
import { NEGOTIATION_RULES, type InvestorId } from "../simulation/negotiation/investor-policy.ts";
import type { NegotiationSession } from "../simulation/negotiation/session.ts";

export type CounterSlot = "used" | "next" | "left";

export type CounterBinding =
  | { readonly ready: true; readonly sessionId: string; readonly offerId: string; readonly expectedRevision: number;
      readonly round: number; readonly slots: readonly CounterSlot[] }
  | { readonly ready: false; readonly reason: string; readonly slots: readonly CounterSlot[] };

/** The shared allowance as one slot per counter: used, the one this counter would use, and the rest. */
export function counterSlots(session: NegotiationSession | null): CounterSlot[] {
  const used = session?.roundsUsed ?? 0;
  const open = session?.stage === "negotiation";
  return Array.from({ length: NEGOTIATION_RULES.counterBudget }, (_, i) =>
    i < used ? "used" : i === used && open ? "next" : "left");
}

export function counterBinding(session: NegotiationSession | null, investor: InvestorId): CounterBinding {
  const slots = counterSlots(session);
  const name = NEGOTIATION_RULES.investors[investor].name;
  if (!session || session.stage === "questions") return { ready: false, reason: "Complete the three investor answers to negotiate.", slots };
  if (session.stage === "finished") return { ready: false, reason: "This session is finished.", slots };
  if (session.roundsUsed >= NEGOTIATION_RULES.counterBudget) return { ready: false, reason: "The counter allowance is exhausted.", slots };
  const offer = session.offers.find(item => item.investor === investor && item.status === "active");
  if (!offer) return { ready: false, reason: `${name} has no active offer.`, slots };
  return { ready: true, sessionId: session.id, offerId: offer.id, expectedRevision: session.revision, round: session.roundsUsed + 1, slots };
}
