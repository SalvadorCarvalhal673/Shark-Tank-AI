// Policy-specific withdrawals for the studio (Issue #30). Reads only the committed decision that took
// an investor out and the offer it ended, so the reason and the retained history are exactly what
// the engine recorded. No camera or gesture callback can cause a withdrawal: this only reads.
import type { Terms } from "../simulation/pitch.ts";
import type { InvestorId } from "../simulation/negotiation/investor-policy.ts";
import type { NegotiationSession } from "../simulation/negotiation/session.ts";
import { sceneCue } from "./model.ts";
import type { RigClip } from "./rig.ts";

export type Withdrawal =
  | { readonly kind: "counter"; readonly reason: "above-cash-ceiling" | "below-withdrawal-band"; readonly round: number;
      readonly revision: number; readonly proposed: Readonly<Terms>; readonly lastOffer: Readonly<Terms>; readonly clip: RigClip }
  | { readonly kind: "opening"; readonly reason: "missing-required-signals" | "repeated-answer"; readonly revision: number; readonly clip: RigClip };

/** Why this investor is out, from their latest committed decision; null while they are still in. */
export function latestWithdrawal(session: NegotiationSession | null, investor: InvestorId): Withdrawal | null {
  const event = session?.history.findLast(item => (item.kind === "counter" || item.kind === "opening") && item.investor === investor);
  if (!session || !event) return null;
  const clip = sceneCue(session, investor).clip;
  if (event.kind === "opening") return event.decision === "pass" ? { kind: "opening", reason: event.reason as "missing-required-signals" | "repeated-answer", revision: event.revision, clip } : null;
  if (event.kind !== "counter" || event.decision !== "withdraw") return null;
  const offer = session.offers.find(item => item.id === event.previousOfferId);
  if (!offer) return null;
  return { kind: "counter", reason: event.reason as "above-cash-ceiling" | "below-withdrawal-band", round: event.round, revision: event.revision,
    proposed: { amount: event.proposed.amount, equity: event.proposed.equity }, lastOffer: { amount: offer.amount, equity: offer.equity }, clip };
}
