"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { currencies, money, readFounderOwnership, readPitch } from "./pitch";
import { PracticeRoom } from "./practice-room";
import { startNegotiation, type NegotiationPitch, type NegotiationSession } from "./negotiation/session";
import { percent, ValuationDetails } from "./negotiation/terms-display";

export function PitchForm() {
  const [session, setSession] = useState<NegotiationSession | null>(null);
  const [pitch, setPitch] = useState<NegotiationPitch | null>(null);
  const [draft, setDraft] = useState<NegotiationPitch | null>(null);
  const [error, setError] = useState("");
  const ownershipInput = useRef<HTMLInputElement>(null);
  const previewHeading = useRef<HTMLHeadingElement>(null);
  const startupInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (session) return;
    if (pitch) previewHeading.current?.focus();
    else if (draft) startupInput.current?.focus();
  }, [pitch, draft, session]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = readPitch(new FormData(event.currentTarget));
    if (typeof result === "string") {
      setError(result);
      return;
    }
    setError("");
    const field = ownershipInput.current;
    const ownership = readFounderOwnership(field?.value ?? "", field?.validity.badInput ?? false);
    if (typeof ownership === "string") {
      setError(ownership);
      if (field) {
        const details = field.closest("details");
        if (details) details.open = true;
        field.focus();
      }
      return;
    }
    const next = { ...result, founderOwnershipBps: ownership };
    setDraft(next);
    setPitch(next);
  }

  function beginPractice() {
    const next = startNegotiation(crypto.randomUUID(), pitch);
    if (next === null) {
      setError("Check your pitch and funding terms before starting practice.");
      return;
    }
    setError("");
    setSession(next);
  }

  if (session) return <PracticeRoom key={session.id} initialSession={session} onExit={() => setSession(null)} />;

  return pitch ? (
    <section className="form-card" aria-label="Pitch preview">
      {error && <p className="error" role="alert">{error}</p>}
      <p className="kicker">Pitch preview</p>
      <h2 className="startup-name" ref={previewHeading} tabIndex={-1}>{pitch.startup}</h2>
      <p className="pitch-text">{pitch.pitch}</p>
      <p className="ask-line">{money(pitch.amount, pitch.currency)} for {pitch.equity / 100}% equity</p>
      <ValuationDetails terms={pitch} currency={pitch.currency} />
      <p className="muted">Founder ownership before investment · {percent(pitch.founderOwnershipBps)}</p>
      <div className="preview-actions">
        <button className="button secondary" type="button" onClick={() => setPitch(null)}>
          <ArrowLeft size={17} aria-hidden /> Edit pitch
        </button>
        <button className="button" type="button" onClick={beginPractice}>
          Start practice <ArrowRight size={17} aria-hidden />
        </button>
      </div>
    </section>
  ) : (
    <form className="form-card" onSubmit={submit}>
      <p className="lede">Tell the panel what you are building, who needs it, and what you are asking for.</p>
      <label>Startup name
        <input ref={startupInput} name="startup" defaultValue={draft?.startup} required minLength={2} maxLength={80} placeholder="e.g. Atlas Energy" />
      </label>
      <label>Your pitch
        <textarea name="pitch" defaultValue={draft?.pitch} required minLength={30} maxLength={3000} rows={6} placeholder="Describe the problem, your solution, target customers, and business model." />
      </label>
      <p id="pitch-number-hint" className="muted">Use plain decimals, such as 0.50, with up to two decimal places.</p>
      <div className="field-row">
        <label>Currency
          <select name="currency" defaultValue={draft?.currency ?? "EUR"}>
            {currencies.map((currency) => <option key={currency}>{currency}</option>)}
          </select>
        </label>
        <label>Investment
          <input name="amount" aria-describedby="pitch-number-hint" defaultValue={draft ? draft.amount / 100 : undefined} type="number" step="0.01" min="0.01" max="999999999.99" required placeholder="100000" />
        </label>
        <label>Equity (%)
          <input name="equity" aria-describedby="pitch-number-hint" defaultValue={draft ? draft.equity / 100 : undefined} type="number" step="0.01" min="0.01" max="100" required placeholder="10" />
        </label>
      </div>
      <details className="negotiation-details" open={draft && draft.founderOwnershipBps !== 10000 ? true : undefined}>
        <summary>Ownership details <span className="muted">· Optional</span></summary>
        <p id="ownership-hint" className="muted">Your share of the company before investment. Other existing shareholders own the rest. Leave blank for 100%.</p>
        <label>Founder ownership (%)
          <input ref={ownershipInput} name="founderOwnership" type="number" min="0" max="100" step="0.01"
            defaultValue={draft ? draft.founderOwnershipBps / 100 : undefined} aria-describedby="ownership-hint"
            onInvalid={(event) => {
              const details = event.currentTarget.closest("details");
              if (details) details.open = true;
            }} />
        </label>
      </details>
      {error && <p className="error" role="alert">{error}</p>}
      <button type="submit" className="button">Review pitch <ArrowRight size={18} aria-hidden /></button>
    </form>
  );
}
