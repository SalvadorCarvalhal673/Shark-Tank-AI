import type { NegotiationSession } from "./session";

export function ReplayChallenge({ session, onStart }: { session: NegotiationSession; onStart: () => void }) {
  const lastCounter = session.history.findLast((event) => event.kind === "counter");
  const missingEvidence = session.answers.some(({ evidence }) => evidence.signals.some(({ status }) => status === "missing"));
  const prompt = lastCounter?.reason === "above-cash-ceiling"
    ? "Decide the minimum funding you can use before you counter. If an offer falls short, compare it with the terms from a different investor."
    : lastCounter?.reason === "below-withdrawal-band"
      ? "Set the maximum equity you can give up. Compare your limit with the opening offers before you choose an equity counter."
      : missingEvidence
        ? "Pick a signal the simulator did not detect. Prepare a separate answer for that investor and include a specific example you can support."
        : "Set a funding target and a founder ownership limit before starting. Use both when you compare your offers.";

  return <details className="negotiation-details">
    <summary>Try a replay challenge</summary>
    <p>{prompt}</p>
    <p>Your next run starts from pitch review, where you can choose whether to save it.</p>
    <button className="button" type="button" onClick={onStart}>Start challenge</button>
  </details>;
}
