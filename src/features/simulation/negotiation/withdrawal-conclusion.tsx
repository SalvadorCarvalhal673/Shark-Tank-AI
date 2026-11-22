import { NEGOTIATION_RULES } from "./investor-policy";
import { historicalCounterCopy } from "./presentation";
import type { NegotiationSession } from "./session";

export function WithdrawalConclusion({ session }: { session: NegotiationSession }) {
  if (session.outcome?.kind !== "all-withdrawn") return null;

  return <section aria-label="Why investors withdrew">
    <h4>Why investors withdrew</h4>
    <p>The last active offer closed when its investor withdrew. No investment was completed.</p>
    <ul className="evidence-list">
      {session.history.map((event) => {
        if (event.kind !== "counter" || event.decision !== "withdraw") return null;
        return <li key={event.round}>
          <strong>{NEGOTIATION_RULES.investors[event.investor].name}</strong> · {historicalCounterCopy[event.reason]}
        </li>;
      })}
    </ul>
  </section>;
}
