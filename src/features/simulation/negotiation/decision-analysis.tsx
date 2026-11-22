import { money } from "../pitch";
import { NEGOTIATION_RULES } from "./investor-policy";
import { historicalCounterCopy } from "./presentation";
import type { NegotiationSession } from "./session";
import { percent } from "./terms-display";

export function DecisionAnalysis({ session }: { session: NegotiationSession }) {
  const counters = session.history.filter((event) => event.kind === "counter");
  if (!counters.length) return null;

  return <section aria-label="Negotiation decision analysis">
    <h4>Negotiation decision analysis</h4>
    <p>Compare each requested amount and equity share with the scripted investor’s recorded response.</p>
    <ol className="negotiation-timeline">
      {counters.map(({ round, investor, proposed, reason }) => <li key={round}>
        <strong>Round {round} · {NEGOTIATION_RULES.investors[investor].name}</strong>
        <p>Requested {money(proposed.amount, session.pitch.currency)} for {percent(proposed.equity)}.</p>
        <p>{historicalCounterCopy[reason]}</p>
      </li>)}
    </ol>
  </section>;
}
