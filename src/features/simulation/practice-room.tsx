"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { money } from "./pitch";
import { Debrief } from "./negotiation/debrief";
import { NegotiationHistory } from "./negotiation/history";
import { INVESTOR_ORDER, NEGOTIATION_RULES, type InvestorId } from "./negotiation/investor-policy";
import { OfferCard } from "./negotiation/offer-card";
import { counterCopy, latestCounter, pendingForSession, specialties, type PendingOffer } from "./negotiation/presentation";
import { type FounderAction, type NegotiationSession } from "./negotiation/session";
import { percent } from "./negotiation/terms-display";
import { InvestorVoice } from "./negotiation/investor-voice";
import { OpeningReveal } from "./negotiation/opening-reveal";
import type { SessionRun } from "./negotiation/session-storage";

export function PracticeRoom({ session, run, onAction, onExit, persistenceMessage }: {
  session: NegotiationSession;
  /** Committed journal for the optional investor voice (Phase 4D); never used to change state. */
  run?: SessionRun | null;
  onAction: (action: FounderAction) => void;
  onExit: () => void;
  persistenceMessage: string;
}) {
  const [pending, setPending] = useState<PendingOffer | null>(null);
  const [answerError, setAnswerError] = useState("");
  const [notice, setNotice] = useState("");
  const [answerDraft, setAnswerDraft] = useState("");
  const [selectedInvestor, setSelectedInvestor] = useState<InvestorId>(INVESTOR_ORDER[0]);
  const heading = useRef<HTMLHeadingElement>(null);
  const offerHeadings = useRef<Partial<Record<InvestorId, HTMLHeadingElement | null>>>({});
  const { pitch, stage, answers } = session;
  const turn = answers.length;
  const investor = INVESTOR_ORDER[turn];
  const profile = investor ? NEGOTIATION_RULES.investors[investor] : null;
  const committedCounter = latestCounter(session);
  const activePending = pendingForSession(session, pending);


  useEffect(() => {
    // Feedback and focus follow the committed state, outside the pure updater.
    if (stage === "negotiation" && committedCounter) offerHeadings.current[committedCounter.investor]?.focus();
    else heading.current?.focus();

  }, [session.revision, stage, committedCounter]);

  function dispatch(action: FounderAction) {
    if (action.sessionId !== session.id || action.expectedRevision !== session.revision) {
      setNotice("These controls are out of date. Review the current offer before continuing.");
      return;
    }
    setNotice("");
    onAction(action);
  }

  function open(kind: PendingOffer["kind"], offerId: string) {
    setNotice("");
    setPending({ kind, offerId, sessionId: session.id, expectedRevision: session.revision });
  }

  function submitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = String(new FormData(event.currentTarget).get("answer") ?? "").trim();
    if (text.length < 10 || text.length > 1500) {
      setAnswerError("Use between 10 and 1,500 characters for your answer.");
      return;
    }
    setAnswerError("");
    setAnswerDraft("");
    dispatch({ kind: "answer", sessionId: session.id, expectedRevision: session.revision, turn, text });
  }

  const counterAnnouncement = committedCounter
    ? NEGOTIATION_RULES.investors[committedCounter.investor].name + " · " + counterCopy[committedCounter.reason] +
      " Counter " + committedCounter.round + " of " + NEGOTIATION_RULES.counterBudget + "."
    : "";
  const isNegotiating = stage === "negotiation" || stage === "final-offers";

  return (
    <section className="practice-room" aria-label="Practice simulation" data-session-id={session.id}>
      <div className="room-status"><span className="kicker"><span className="signal" /> Scripted practice</span>
        <span className="startup-name">Original ask · {pitch.startup} · {money(pitch.amount, pitch.currency)} for {percent(pitch.equity)}</span>
      </div>
      <p className="muted">{persistenceMessage}</p>
      <p role="status" className="sr-only">{counterAnnouncement}</p>
      {notice && <p role="alert">{notice}</p>}
      <section className="dialogue-transcript" aria-label="Investor conversation">
        <div className="dialogue-heading"><div><p className="kicker">Conversation · scripted</p>
          <h2>Investor conversation</h2></div>
          <span className="scripted-badge">Scripted engine · no live AI</span>
        </div>
        {answers.map((entry) => <article className="dialogue-exchange" key={entry.investor}>
          <p className="dialogue-speaker">{NEGOTIATION_RULES.investors[entry.investor].name} · Investor</p>
          <p>{NEGOTIATION_RULES.investors[entry.investor].question}</p>
          <p className="dialogue-speaker founder-speaker">Founder · submitted answer</p>
          <blockquote>{entry.text}</blockquote>
        </article>)}
        <p className="history-summary" aria-live="polite">{answers.length === 0 ? "No replies yet. Your submitted exchanges will remain here for review." : `${answers.length} of ${INVESTOR_ORDER.length} investor exchanges available above.`}</p>
      </section>
      {run && run.session === session && <InvestorVoice run={run} draft={answerDraft}
        onUseInAnswer={(text) => setAnswerDraft((draft) => draft ? draft + "\n\n" + text : text)} />}
      <div className="practice-panel">
        {INVESTOR_ORDER.map((id) => <div key={id} className={stage === "questions" && id === investor ? "active-investor" : ""}>
          <strong>{NEGOTIATION_RULES.investors[id].name}</strong><span>{specialties[id]}</span>
        </div>)}
      </div>
      {stage === "questions" && profile && (
        <div className="form-card">
          <p className="kicker">Question {turn + 1} of {INVESTOR_ORDER.length}</p>
          <h2 ref={heading} tabIndex={-1}>{profile.name}</h2>
          <p>{profile.question}</p>
          <p className="muted">Submit your answer when it is ready. The scripted rules respond immediately; there is no simulated waiting or live AI. Detected text signals are not independently verified.</p>
          <form className="counter-form" key={turn} onSubmit={submitAnswer}>
            <label>Your answer<textarea name="answer" rows={4} minLength={10} maxLength={1500} required value={answerDraft}
              onChange={(event) => setAnswerDraft(event.target.value)} aria-describedby="interaction-state" /></label>
            <p id="interaction-state" className="interaction-state" role="status" aria-live="polite">
              {answerDraft ? "Listening · your answer is ready to submit." : "Listening · write an answer when you are ready."}
            </p>
            {answerError && <p className="error" role="alert">{answerError}</p>}
            <button className="button" type="submit">Submit answer <ArrowRight size={17} aria-hidden /></button>
          </form>
        </div>
      )}
      {isNegotiating && <>
        <div className="negotiation-heading">
          <h2 ref={heading} tabIndex={-1} data-session-revision={session.revision}>{stage === "final-offers" ? "Final offers." : "Negotiate your terms."}</h2>
          <p className="rounds-remaining">{NEGOTIATION_RULES.counterBudget - session.roundsUsed} shared counters remaining</p>
          <p className="interaction-state">{committedCounter ? "Reply recorded · " + NEGOTIATION_RULES.investors[committedCounter.investor].name + " responded to counter " + committedCounter.round + "." : "Select an investor to inspect the current terms."}</p>
          <p className="muted">{stage === "final-offers"
            ? "Your counter allowance is used. Accept an active offer or walk away."
            : "Every valid counter uses one shared round, including withdrawals and unchanged offers."}</p>
          <p className="muted">Compare funding and dilution alongside valuation. The highest valuation may not meet your funding needs.</p>
        </div>
        <OpeningReveal session={session} />
        <div className="investor-switcher" role="tablist" aria-label="Select an investor">
          {INVESTOR_ORDER.map((id) => <button key={id} type="button" role="tab" aria-selected={selectedInvestor === id}
            className={selectedInvestor === id ? "button investor-select selected" : "button investor-select secondary"}
            onClick={() => setSelectedInvestor(id)}>{NEGOTIATION_RULES.investors[id].name} · {specialties[id]}</button>)}
        </div>
        <div className="negotiation-offers">
          {INVESTOR_ORDER.map((id) => <OfferCard key={id} session={session} investor={id} pending={activePending}
            selected={selectedInvestor === id}
            headingRef={(element) => { offerHeadings.current[id] = element; }}
            onOpen={open} onClose={() => setPending(null)} onAction={dispatch} />)}
        </div>
        <button className="button secondary" type="button" onClick={() => dispatch({
          kind: "walk-away", sessionId: session.id, expectedRevision: session.revision,
        })}>Walk away</button>
        <details className="negotiation-details"><summary>Negotiation history</summary><NegotiationHistory session={session} /></details>
      </>}
      {stage === "finished" && <Debrief session={session} headingRef={heading} onExit={onExit} />}
    </section>
  );
}
