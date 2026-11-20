import type { AppResponse,Failure } from "./contracts.ts";
import type { ConversationContext } from "./context.ts";
import { frozenCopy } from "./schemas.ts";
import { NEGOTIATION_RULES } from "../simulation/negotiation/investor-policy.ts";
import { counterCopy,openingCopy,outcomeCopy } from "../simulation/negotiation/presentation.ts";
export function committedExplanation(context:ConversationContext):string {
  const {session,request}=context;
  if(request.binding.purpose==="outcome"&&session.outcome)return outcomeCopy[session.outcome.kind];
  if(request.binding.purpose==="counter-explanation"){
    const event=session.history.at(-1);
    if(event?.kind==="counter")return counterCopy[event.reason];
  }
  const opening=session.history.findLast(e=>e.kind==="opening"&&e.investor===request.binding.investorId);
  if(opening?.kind==="opening")return openingCopy[opening.reason];
  return "Your answer is recorded as founder-reported information. It has not been independently verified.";
}
export function scriptedFallback(context:ConversationContext,reason:Failure):AppResponse {
  if(!["missing-credentials","timeout","refusal","network","invalid-output","budget","no-consent","cancelled"].includes(reason))
    throw new RangeError("Unknown fallback reason");
  const question=context.request.binding.purpose==="question"
    ?NEGOTIATION_RULES.investors[context.request.binding.investorId].question:null;
  return frozenCopy({contractVersion:1,binding:context.request.binding,
    dialogue:question?"Scripted investor prompt. Continue with the same simulation rules.":committedExplanation(context),
    question,observations:[],provenance:"scripted",fallback:reason,
    limitations:["Scripted continuation; no live AI response.","Founder information is unverified."]});
}
