import { NEGOTIATION_RULES } from "./investor-policy";
import { outcomeCopy, signalCopy } from "./presentation";
import type { NegotiationSession } from "./session";
import styles from "./performance-scorecard.module.css";

export function PerformanceScorecard({ session }: { session: NegotiationSession }) {
  if (!session.outcome) return null;

  return <section className="form-card" aria-label="Performance scorecard">
    <h3>Performance scorecard</h3>
    <p>{outcomeCopy[session.outcome.kind]}</p>
    <p>Shared counters used · {session.roundsUsed} of {NEGOTIATION_RULES.counterBudget}</p>
    <h4>Pitch evidence</h4>
    <blockquote className="pitch-text">{session.pitch.pitch}</blockquote>
    <p className="muted">
      This rubric looks for specific text patterns in your answers. It can miss relevant evidence and cannot verify claims or assess startup viability. The evidence counts describe what the simulator detected.
    </p>
    {session.answers.map(({ investor, text, evidence }) => {
      const detected = evidence.signals.filter(({ status }) => status === "supplied").length;
      return <details className={styles.disclosure} key={investor}>
        <summary>
          <strong>{NEGOTIATION_RULES.investors[investor].name}</strong>
          <span className={styles.count}>{detected} of {evidence.signals.length} signals detected</span>
        </summary>
        <blockquote className="pitch-text">{text}</blockquote>
        {evidence.repeated && <p>This response repeats an earlier answer.</p>}
        <ul className="evidence-list">{evidence.signals.map(({ signal, status }) => <li key={signal}>
          <strong>{status === "supplied" ? "Signal detected" : "Signal not identified"}</strong> · {signalCopy[signal]}
        </li>)}</ul>
      </details>;
    })}
  </section>;
}
