// Investor concessions for the studio (Issue #29). Reads only committed counter decisions and the
// offers they reference, so the studio can never depict terms the engine did not record.
import type { Terms } from "../simulation/pitch.ts";
import type { InvestorId } from "../simulation/negotiation/investor-policy.ts";
import type { NegotiationSession } from "../simulation/negotiation/session.ts";
import { REACTIONS, type Pose } from "./model.ts";

export type Concession = {
  readonly kind: "agree" | "revise" | "unchanged";
  readonly round: number;
  readonly revision: number;
  /** The investor's offer before the counter. */
  readonly before: Readonly<Terms>;
  /** What the founder proposed. */
  readonly proposed: Readonly<Terms>;
  /** The investor's committed terms after the counter. */
  readonly after: Readonly<Terms>;
  /** The clip this investor plays (same map as the reactions, Issue #10). */
  readonly pose: Pose;
};

const terms = ({ amount, equity }: Terms): Terms => ({ amount, equity });

/** The investor's latest counter decision when it kept them in the deal; null otherwise. */
export function latestConcession(session: NegotiationSession | null, investor: InvestorId): Concession | null {
  const event = session?.history.findLast(item => (item.kind === "counter" || item.kind === "opening") && item.investor === investor);
  if (!session || event?.kind !== "counter" || event.decision === "withdraw") return null;
  const before = session.offers.find(offer => offer.id === event.previousOfferId);
  const after = session.offers.find(offer => offer.id === (event.resultingOfferId ?? event.previousOfferId));
  if (!before || !after) return null;
  return { kind: event.decision, round: event.round, revision: event.revision, before: terms(before), proposed: terms(event.proposed), after: terms(after), pose: REACTIONS[event.reason] };
}
