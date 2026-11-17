"use client";

import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { currencies, money, readPitch, type Pitch } from "./pitch";

import { PracticeRoom } from "./practice-room";

export function PitchForm() {
  const [practicing, setPracticing] = useState(false);
  const [pitch, setPitch] = useState<Pitch | null>(null);
  const [draft, setDraft] = useState<Pitch | null>(null);
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = readPitch(new FormData(event.currentTarget));
    if (typeof result === "string") {
      setError(result);
      return;
    }
    setError("");
    setDraft(result);
    setPitch(result);
  }

  if (practicing && pitch) return <PracticeRoom pitch={pitch} onExit={() => setPracticing(false)} />;

  return pitch ? <section className="form-card" aria-label="Pitch preview">
    <p className="kicker">Pitch preview</p><h2>{pitch.startup}</h2>
    <p className="pitch-text">{pitch.pitch}</p>
    <p className="ask-line">{money(pitch.amount, pitch.currency)} for {pitch.equity / 100}% equity</p>
    <div className="preview-actions"><button className="button secondary" type="button" onClick={() => setPitch(null)}><ArrowLeft size={17} aria-hidden /> Edit pitch</button><button className="button" type="button" onClick={() => setPracticing(true)}>Start practice <ArrowRight size={17} aria-hidden /></button></div>
  </section> : <form className="form-card" onSubmit={submit}>
    <label>Startup name<input name="startup" defaultValue={draft?.startup} required minLength={2} maxLength={80} placeholder="e.g. Atlas Energy" /></label>
    <label>Your pitch<textarea name="pitch" defaultValue={draft?.pitch} required minLength={30} maxLength={3000} rows={6} placeholder="Describe the problem, your solution, target customers, and business model." /></label>
    <div className="field-row">
      <label>Currency<select name="currency" defaultValue={draft?.currency ?? "EUR"}>{currencies.map((currency) => <option key={currency}>{currency}</option>)}</select></label>
      <label>Investment<input name="amount" defaultValue={draft ? draft.amount / 100 : undefined} type="number" step="0.01" min="0.01" max="999999999.99" required placeholder="100000" /></label>
      <label>Equity (%)<input name="equity" defaultValue={draft ? draft.equity / 100 : undefined} type="number" step="0.01" min="0.01" max="100" required placeholder="10" /></label>
    </div>
    {error && <p className="error" role="alert">{error}</p>}
    <button type="submit" className="button">Review pitch <ArrowRight size={18} aria-hidden /></button>
  </form>;
}
