import type { BrowserRequest, Source } from "./contracts.ts";
import { frozenCopy, parseRequest } from "./schemas.ts";
import { createRun, advanceRun } from "../simulation/negotiation/session-storage.ts";
import { INVESTOR_ORDER } from "../simulation/negotiation/investor-policy.ts";
import { valuations, ownershipAfterInvestment } from "../simulation/negotiation/financials.ts";
export function buildContext(input: BrowserRequest) {
  const request = parseRequest(JSON.stringify(input));
  if (!request) return null;
  let run = createRun(request.binding.sessionId, request.pitch);
  if (!run) return null;
  for (const action of request.actions) {
    const next = advanceRun(run,action);
    if (next === run) return null;
    run = next;
  }
  const session = run.session, b = request.binding;
  if (session.revision !== b.revision) return null;
  const last = session.history.at(-1);
  const lastAction = run.actions.at(-1);
  if ((b.purpose === "question" && (session.stage !== "questions" || INVESTOR_ORDER[session.answers.length] !== b.investorId)) ||
      (b.purpose === "answer-feedback" && (lastAction?.kind !== "answer" || session.answers.at(-1)?.investor !== b.investorId)) ||
      (b.purpose === "counter-explanation" && (last?.kind !== "counter" || last.investor !== b.investorId)) ||
      (b.purpose === "outcome" && session.stage !== "finished")) return null;
  const sources: Source[] = [
    {id:"pitch",text:session.pitch.pitch,provenance:"founder-reported"},
    ...session.answers.map(a => ({id:"answer:"+a.investor,text:a.text,provenance:"founder-reported" as const})),
  ];
  return frozenCopy({
    request, session, sources,
    // Facts are reconstructed here; browser-provided offers/valuations are not accepted.
    financialFacts: session.offers.map(o => ({
      offerId:o.id, investorId:o.investor, status:o.status, amountMinor:o.amount, equityBps:o.equity,
      valuation:valuations(o), ownership:ownershipAfterInvestment(session.pitch.founderOwnershipBps,o.equity),
    })),
  });
}
export type ConversationContext = NonNullable<ReturnType<typeof buildContext>>;
