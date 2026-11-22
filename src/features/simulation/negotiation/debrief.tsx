import type { Ref } from "react";
import { NegotiationHistory } from "./history";
import { NEGOTIATION_RULES } from "./investor-policy";
import { historicalCounterCopy, openingCopy, ownershipPresentation, signalCopy } from "./presentation";
import { PerformanceScorecard } from "./performance-scorecard";
import type { NegotiationSession } from "./session";
import { percent, TermsDisplay } from "./terms-display";
import styles from "./deal-conclusion.module.css";
import { WithdrawalConclusion } from "./withdrawal-conclusion";

export function Debrief({ session, headingRef, onExit }: {
  session: NegotiationSession;
  headingRef: Ref<HTMLHeadingElement>;
  onExit: () => void;
}) {
  const accepted = session.offers.find(({ status }) => status === "accepted");
  const cap = accepted && ownershipPresentation(session.pitch.founderOwnershipBps, accepted.equity);
  const opening = accepted && session.offers.find(({ investor }) => investor === accepted.investor);
  const counters = session.history.filter((event) => event.kind === "counter");
  return <div className="debrief">
    <div className="form-card">
      <h2 ref={headingRef} tabIndex={-1}>Your debrief.</h2>
      <p className="ask-line">{accepted ? "Deal confirmed" : "No deal"}</p>
      {session.outcome && <p>{outcomeCopy[session.outcome.kind]}</p>}
      {session.outcome?.kind === "accepted-deal" && accepted && <section className={styles.deal} aria-label="Accepted deal">
      {accepted && <section aria-label="Accepted deal">
        <h3>Deal with {NEGOTIATION_RULES.investors[accepted.investor].name}</h3>
        <TermsDisplay terms={accepted} currency={session.pitch.currency} />
        <p>You confirmed these terms. The investment is a simulated result and does not establish the quality of the pitch.</p>
        {opening && <details className="negotiation-details"><summary>Compare opening terms</summary>
          <TermsDisplay terms={opening} currency={session.pitch.currency} />
        </details>}
      </section>}
      {session.outcome?.kind === "founder-walk-away" && <section aria-label="Founder decision">
        <h3>You ended the negotiation</h3>
        <p>No offer was accepted. This session raised no investment and left ownership unchanged.</p>
        <p>For another practice run, decide how much funding you need and how much ownership you are willing to give up.</p>
      </section>}
    </div>

    <PerformanceScorecard session={session} />

    <section className="form-card">
      <h3>Investor decisions</h3>
      {session.outcome?.kind === "no-offers" && <section aria-label="Why there were no opening offers">
        <h4>Why there were no opening offers</h4>
        <p>The scripted investors need to recognize specific signals in each answer before they make an offer. A repeated answer can also lead an investor to pass.</p>
        <p>The simulator can miss valid evidence. These decisions give you feedback about this practice run and do not assess the viability of your business.</p>
      </section>}
      {session.history.map((event, index) => {
        if (event.kind !== "opening" && event.kind !== "counter") return null;
        return <p key={session.id + index}><strong>{NEGOTIATION_RULES.investors[event.investor].name}</strong> · {
          event.kind === "opening" ? openingCopy[event.reason] : historicalCounterCopy[event.reason]
        }</p>;
      })}
    </section>

    <section className="form-card">
      <h3>Negotiation performance</h3>
      <p>You used {session.roundsUsed} of {NEGOTIATION_RULES.counterBudget} shared counters.</p>
      <WithdrawalConclusion session={session} />
      <p>{counters.length
        ? "Review how your requested funding and equity changed the investors’ responses."
        : "You made your final decision without countering. Review whether the available funding and ownership matched your limits."}</p>
      <NegotiationHistory session={session} />
    </section>

    <section className="form-card">
      <h3>Financial consequences</h3>
      {accepted && cap ? <>
        <p>Primary equity investment. Existing holders keep a proportional share of the remaining equity.</p>
        <div className="ownership-bar" aria-hidden="true">
          <span className="owner-founder" style={{ flexGrow: cap.founderAfterBps }} />
          <span className="owner-others" style={{ flexGrow: cap.otherExistingAfterBps }} />
          <span className="owner-investor" style={{ flexGrow: cap.investorBps }} />
        </div>
        <table className="ownership-table">
          <caption>Ownership before and after investment</caption>
          <thead><tr><th scope="col">Holder</th><th scope="col">Before</th><th scope="col">After</th></tr></thead>
          <tbody>
            <tr><th scope="row">Founder</th><td>{percent(cap.founderBeforeBps)}</td><td>{percent(cap.founderAfterBps)}</td></tr>
            <tr><th scope="row">Other existing shareholders</th><td>{percent(cap.otherExistingBeforeBps)}</td><td>{percent(cap.otherExistingAfterBps)}</td></tr>
            <tr><th scope="row">New investor</th><td>0%</td><td>{percent(cap.investorBps)}</td></tr>
          </tbody>
          <tfoot><tr><th scope="row">Total</th><td>100%</td><td>100%</td></tr></tfoot>
        </table>
        <p>Founder ownership change · {cap.founderDilutionBps / 100} percentage points</p>
        <p>Founder relative dilution · {cap.founderRelativeDilutionBps === null ? "Not applicable" : percent(cap.founderRelativeDilutionBps)}</p>
        <p className="muted">Values round to the nearest cent or 0.01 percentage point, half up. A very small proportional change can round to zero in the ownership table. Other existing holders receive any rounding residual.</p>
      </> : <p>{accepted ? "Ownership calculation unavailable." : "No investment was completed. Ownership remains as it was before this session."}</p>}
    </section>

    <section className="form-card">
      <h3>What to improve next</h3>
      {session.answers.map(({ investor, evidence }) => <div key={investor}>
        <h4>{NEGOTIATION_RULES.investors[investor].name}</h4>
        {evidence.signals.filter(({ status }) => status === "missing").map(({ signal }) => <p key={signal}>{signalCopy[signal]}</p>)}
        {evidence.signals.every(({ status }) => status === "supplied") && <p>The requested signals were detected. Check the source and assumptions behind each claim before using it in a real pitch.</p>}
      </div>)}
      <p>{session.outcome?.kind === "all-withdrawn"
        ? "Review the cash and equity requests that triggered withdrawals, and set funding and dilution limits before your next session."
        : session.outcome?.kind === "no-offers"
          ? "Answer each investor’s specific question with separate, clearly labeled evidence."
          : "Compare the funding you need with the ownership you are willing to give up before choosing your next terms."}</p>
      <button className="button" type="button" onClick={onExit}>Practice again</button>
    </section>
  </div>;
}
