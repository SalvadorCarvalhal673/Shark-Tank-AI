"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { panel } from "./panel";
import { money, readPitch, type Pitch } from "./pitch";
import {
  answerQuestion, assessment, counterOffer, finishPractice, postMoneyValue, type Offer, type Practice,
} from "./practice";

function OfferTerms({ offer, currency }: { offer: Offer; currency: Pitch["currency"] }) {
  const valuation = postMoneyValue(offer);
  if (valuation === null) return <p role="alert">These investment terms are invalid. Restart practice to continue.</p>;
  return <><p className="ask-line">{money(offer.amount, currency)} for {offer.equity / 100}%</p>
    <p>{money(valuation, currency)} post-money valuation</p></>;
}

function CounterForm({ offer, pitch, onCounter }: {
  offer: Offer;
  pitch: Pitch;
  onCounter: (terms: { amount: number; equity: number }) => void;
}) {
  const [error, setError] = useState("");
  const numberHint = useId();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.set("startup", pitch.startup);
    form.set("pitch", pitch.pitch);
    form.set("currency", pitch.currency);
    const result = readPitch(form);
    if (typeof result === "string") setError(result);
    else onCounter({ amount: result.amount, equity: result.equity });
  }

  return <details><summary>Make a counteroffer</summary>
    <form className="counter-form" onSubmit={submit}>
      <p id={numberHint} className="muted">Use plain decimals, such as 0.50, with up to two decimal places.</p>
      <div className="field-row counter-fields">
        <label>Investment ({pitch.currency})<input name="amount" aria-describedby={numberHint} type="number" step=".01" min=".01" max="999999999.99" required defaultValue={offer.amount / 100} /></label>
        <label>Equity (%)<input name="equity" aria-describedby={numberHint} type="number" step=".01" min=".01" max="100" required defaultValue={offer.equity / 100} /></label>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="button secondary" type="submit">Send counteroffer</button>
    </form>
  </details>;
}

export function PracticeRoom({ initialSession, onExit }: { initialSession: Practice; onExit: () => void }) {
  const [session, setSession] = useState(initialSession);
  const [answerError, setAnswerError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const offerHeadings = useRef<Array<HTMLHeadingElement | null>>([]);
  const { pitch, stage, answers, offers, counters } = session;
  const turn = answers.length;
  const currency = pitch.currency;
  const accepted = offers.find((offer) => offer.status === "accepted");

  const lastCounter = counters.at(-1);
  const counterInvestor = offers.find((offer) => offer.id === lastCounter?.offerId)?.investor;

  useEffect(() => {
    if (stage === "negotiation" && counterInvestor !== undefined) {
      offerHeadings.current[counterInvestor]?.focus();
    } else {
      heading.current?.focus();
    }
  }, [stage, turn, counterInvestor, lastCounter]);

  function submitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = String(new FormData(event.currentTarget).get("answer") ?? "").trim();
    if (text.length < 10 || text.length > 1500) {
      setAnswerError("Use between 10 and 1,500 characters for your answer.");
      return;
    }
    setAnswerError("");
    setSession((current) => answerQuestion(current, text, turn));
  }

  return <section className="practice-room" aria-label="Practice simulation">
    <div className="room-status"><span className="kicker"><span className="signal" /> Scripted practice</span>
      <span className="startup-name">{pitch.startup} · {money(pitch.amount, currency)} for {pitch.equity / 100}%</span></div>
    <p role="status" className="sr-only">
      {lastCounter && counterInvestor !== undefined && (
        lastCounter.outcome === "accepted"
          ? panel[counterInvestor].name + " accepted your counter terms. Confirm the deal to accept the offer."
          : panel[counterInvestor].name + " declined your counteroffer and withdrew."
      )}
    </p>
    <div className="practice-panel">{panel.map((investor, index) => <div key={investor.name} className={stage === "questions" && turn === index ? "active-investor" : ""}>
      <strong>{investor.name}</strong><span>{investor.role}</span>
    </div>)}</div>

    {stage === "questions" && <div className="form-card">
      <p className="kicker">Question {turn + 1} of {panel.length}</p>
      <h2 ref={heading} tabIndex={-1}>{panel[turn].name}</h2>
      <p>{panel[turn].question}</p>
      <form className="counter-form" key={turn} onSubmit={submitAnswer}>
        <label>Your answer<textarea name="answer" rows={4} minLength={10} maxLength={1500} required /></label>
        {answerError && <p className="error" role="alert">{answerError}</p>}
        <button className="button" type="submit">Submit answer <ArrowRight size={17} aria-hidden /></button>
      </form>
    </div>}

    {stage === "negotiation" && <div className="form-card">
      <h2 ref={heading} tabIndex={-1}>Negotiate your terms.</h2>
      <p className="muted">You may counter once per investor or accept any active offer.</p>
      {panel.map((investor, index) => {
        const offer = offers.findLast((item) => item.investor === index);
        return <article className="offer-card" key={investor.name}>
          <h3 ref={(element) => { offerHeadings.current[index] = element; }} tabIndex={-1}>{investor.name}</h3>
          {!offer && <p>Passes on this round.</p>}
          {offer?.status === "withdrawn" && <p>Declined your counteroffer and withdrew.</p>}
          {offer?.status === "active" && <>
            <OfferTerms offer={offer} currency={currency} />
            {offer.id.startsWith("counter-") && <p>Accepted your counter terms. Confirm the deal below.</p>}
            <button className="button" type="button" onClick={() => setSession((current) => finishPractice(current, offer.id))}>Accept offer</button>
            {offer.id.startsWith("initial-") && <CounterForm offer={offer} pitch={pitch} onCounter={(terms) => setSession((current) => counterOffer(current, offer.id, terms))} />}
          </>}
        </article>;
      })}
      <button className="button secondary" type="button" onClick={() => setSession((current) => finishPractice(current))}>Walk away</button>
    </div>}

    {stage === "finished" && <div className="form-card">
      <h2 ref={heading} tabIndex={-1}>Your debrief.</h2>
      {accepted ? <article className="offer-card"><h3>Deal with {panel[accepted.investor].name}</h3><OfferTerms offer={accepted} currency={currency} /></article> : <p className="ask-line">No deal</p>}
      <p className="muted">Practice scoring uses response detail and whether the finance answer includes a number. Use the prompts below to review the substance of your answers.</p>
      {assessment(session).map((item) => <article className="offer-card" key={item.title}>
        <h3>{item.title} <span className="muted">· {item.result}</span></h3>
        {item.excerpt && <blockquote className="pitch-text">{item.excerpt}</blockquote>}
        <p>{item.feedback}</p>
      </article>)}
      {counters.length > 0 && <div><h3>Counteroffer history</h3>
        <ul>{counters.map((counter) => <li key={counter.offerId}>
          {panel[offers.find((offer) => offer.id === counter.offerId)!.investor].name} · {money(counter.amount, currency)} for {counter.equity / 100}% · {counter.outcome}
        </li>)}</ul>
      </div>}
      <button className="button" type="button" onClick={onExit}>Practice again <ArrowRight size={17} aria-hidden /></button>
    </div>}
  </section>;
}
