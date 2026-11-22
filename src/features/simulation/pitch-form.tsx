"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { currencies, money, readFounderOwnership, readPitch } from "./pitch";
import { PracticeRoom } from "./practice-room";
import { type NegotiationPitch } from "./negotiation/session";
import { useSavedSession } from "./negotiation/use-saved-session";
import { RecoveryPanel } from "./negotiation/recovery-panel";
import { percent, ValuationDetails } from "./negotiation/terms-display";
import { InvestorIntroductions } from "./investor-introductions";
import { INVESTOR_ORDER, type InvestorId } from "./negotiation/investor-policy";
import { pitchExamples } from "./pitch-examples";

export function PitchForm() {
  const controller = useSavedSession();
  const session = controller.run?.session ?? null;
  const [editing, setEditing] = useState(false);
  const [saveLocally, setSaveLocally] = useState(false);
  const [replacement, setReplacement] = useState<{ raw: string } | null>(null);
  const replacementHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (replacement) replacementHeading.current?.focus(); }, [replacement]);
  const [pitch, setPitch] = useState<NegotiationPitch | null>(null);
  const [draft, setDraft] = useState<NegotiationPitch | null>(null);
  const [exampleRevision, setExampleRevision] = useState(0);
  const [error, setError] = useState("");
  const [showIntroductions, setShowIntroductions] = useState(true);
  const [selectedIntroduction, setSelectedIntroduction] = useState<InvestorId>(INVESTOR_ORDER[0]);
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

  function useExample(example: typeof pitchExamples[number]) {
    const data = new FormData();
    data.set("startup", example.pitch.startup);
    data.set("pitch", example.pitch.pitch);
    data.set("currency", example.pitch.currency);
    data.set("amount", String(example.pitch.amount / 100));
    data.set("equity", String(example.pitch.equity / 100));
    const parsed = readPitch(data);
    const ownership = readFounderOwnership(String(example.pitch.founderOwnershipBps / 100), false);
    if (typeof parsed === "string" || typeof ownership === "string") {
      setError("This example could not be loaded. Your current draft is unchanged.");
      return;
    }
    setDraft({ ...parsed, founderOwnershipBps: ownership });
    setExampleRevision((revision) => revision + 1);
    setError("");
  }

  async function launch(expectedRaw: string | null) {
    if (!pitch) return;
    const started = await controller.begin(pitch, saveLocally, expectedRaw);
    setReplacement(null);
    if (!started) setError("Saved information changed. Check the latest saved progress before replacing it.");
  }

  function beginPractice() {
    if (!pitch || controller.busy) return;
    const latest = controller.refresh();
    if (saveLocally && (latest.kind === "valid" || latest.kind === "invalid")) {
      setReplacement({ raw: latest.raw });
      return;
    }
    setError("");
    void launch(null);
  }

  async function practiceAgain() {
    const previousPitch = await controller.leave();
    if (previousPitch) {
      setPitch(previousPitch);
      setDraft(previousPitch);
      setEditing(true);
      setSaveLocally(false);
    }
  }

  if (controller.checking) return <RecoveryPanel controller={controller} active={false} onNew={() => setEditing(true)} />;
  if (session) return <>
    <RecoveryPanel controller={controller} active onNew={() => setEditing(true)} />
    <PracticeRoom key={controller.viewKey} session={session} onAction={controller.dispatch}
      onExit={practiceAgain} persistenceMessage={controller.status === "Not saving"
        ? "Refreshing clears this in-memory run. Saving is off."
        : "Only saved actions can be restored after refresh. Check the save status before closing."} />
  </>;
  if (!editing && (controller.slot.kind === "valid" || controller.slot.kind === "invalid")) {
    return <RecoveryPanel controller={controller} active={false} onNew={() => setEditing(true)} />;
  }
  return pitch ? (
    <section className="form-card" aria-label="Pitch preview">
      {error && <p className="error" role="alert">{error}</p>}
      <p className="kicker">Pitch preview</p>
      <h2 className="startup-name" ref={previewHeading} tabIndex={-1}>{pitch.startup}</h2>
      <p className="pitch-text">{pitch.pitch}</p>
      <p className="ask-line">{money(pitch.amount, pitch.currency)} for {pitch.equity / 100}% equity</p>
      <ValuationDetails terms={pitch} currency={pitch.currency} founderOwnershipBps={pitch.founderOwnershipBps} />
      <p className="muted">Founder ownership before investment · {percent(pitch.founderOwnershipBps)}</p>
      {showIntroductions
        ? <InvestorIntroductions selected={selectedIntroduction} onSelect={setSelectedIntroduction}
            onContinue={() => setShowIntroductions(false)} onSkip={() => setShowIntroductions(false)} />
        : <button className="button secondary" type="button" onClick={() => setShowIntroductions(true)}>Meet the investors</button>}
      <div className="privacy-notice">
        <label className="save-choice"><input type="checkbox" disabled={controller.busy} checked={saveLocally} onChange={(event) => setSaveLocally(event.target.checked)} /> Save this session in this browser</label>
        <p className="muted">Saving stores your pitch and answers in this browser profile. Other users of this profile or scripts on this origin may access them. The app does not encrypt them. Private browsing or clearing browser data may remove them. No founder information is sent externally.</p>
        <p className="muted">Leave saving off to practice in memory. Existing saved progress will be retained.</p>
      </div>
      <RecoveryPanel controller={controller} active={false} preview onNew={() => setEditing(true)} />
      {replacement && <div className="inline-offer-panel" role="group" aria-label="Replace saved session">
        <h3 ref={replacementHeading} tabIndex={-1}>Replace saved progress?</h3>
        <p>Starting with saving enabled will replace the saved pitch and answers. Cancel to keep them.</p>
        <div className="preview-actions">
          <button className="button" disabled={controller.busy} type="button" onClick={() => launch(replacement.raw)}>Confirm replacement</button>
          <button className="button secondary" disabled={controller.busy} type="button" onClick={() => {
            setReplacement(null);
            previewHeading.current?.focus();
          }}>Cancel replacement</button>
        </div>
      </div>}
      <div className="preview-actions">
        <button className="button secondary" disabled={controller.busy} type="button" onClick={() => { setReplacement(null); setPitch(null); }}>
          <ArrowLeft size={17} aria-hidden /> Edit pitch
        </button>
        <button className="button" disabled={controller.busy} type="button" onClick={beginPractice}>
          Start practice <ArrowRight size={17} aria-hidden />
        </button>
      </div>
    </section>
  ) : (
    <form key={`${draft?.pitch ?? "new-pitch"}:${exampleRevision}`} className="form-card" onChangeCapture={() => setEditing(true)} onSubmit={submit}>
      {controller.slot.kind === "unavailable" && <p>Saved information could not be read. Memory-only practice is available.</p>}
      <section className="pitch-guidance" aria-labelledby="pitch-guide-title">
        <h2 id="pitch-guide-title">Build your pitch</h2>
        <p>Describe a real idea in your own words. The examples below are fictional starting points; choosing one only fills this editable form.</p>
        <div className="example-picker" role="group" aria-label="Fictional pitch examples">
          {pitchExamples.map((example) => <button key={example.id} type="button" className="button secondary"
            onClick={() => useExample(example)}>
            Use {example.title}
          </button>)}
        </div>
        {pitchExamples.map((example) => <p className="muted" key={example.id}>{example.description}</p>)}
      </section>
      <p className="lede">Tell the panel what you are building, who needs it, and what you are asking for.</p>
      <label>Startup name
        <input ref={startupInput} name="startup" defaultValue={draft?.startup} required minLength={2} maxLength={80} placeholder="e.g. Atlas Energy" />
      </label>
      <label>Your pitch
        <textarea name="pitch" defaultValue={draft?.pitch} required minLength={30} maxLength={3000} rows={6} placeholder="Describe the problem, your solution, target customers, and business model." />
      </label>
      <p className="muted">Name the product or service and the people it helps. Keep the description between 30 and 3,000 characters.</p>
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
      <p className="muted">Investment is the amount of cash you are asking for. Equity is the percentage of newly issued company ownership offered in return.</p>
      <details className="negotiation-details"><summary>What do investment and equity mean?</summary>
        <p>Investment is the cash requested. Equity is the percentage of newly issued ownership offered to that investor if a deal is accepted. The simulator calculates valuation using its exact financial rules after you review the pitch.</p>
      </details>
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
