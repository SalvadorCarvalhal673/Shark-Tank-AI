import type { Binding } from "./contracts.ts";
import type { InvestorId } from "../simulation/negotiation/investor-policy.ts";
import { bounded, exact, frozenCopy, id, sameBinding, validBinding } from "./schemas.ts";
export type ClarificationEntry = Readonly<{
  binding:Binding; status:"asked"|"answered"|"skipped"|"cancelled"|"unnecessary";
  question:string|null; reply:string|null;
}>;
export type ClarificationState = Readonly<{sessionId:string;entries:Readonly<Partial<Record<InvestorId,ClarificationEntry>>>}>;
export function startClarifications(sessionId:string): ClarificationState {
  if(!id(sessionId))throw new RangeError("Invalid run identity");
  return frozenCopy({sessionId,entries:{}});
}
/** Isolated mock interaction; never creates a binding founder action or changes a session. */
export function clarify(state:ClarificationState,input:unknown,binding:Binding,eligible:boolean): ClarificationState {
  if(!validBinding(binding)||binding.sessionId!==state.sessionId||!exact(input,["kind","binding","text"])||
    !validBinding(input.binding)||!sameBinding(input.binding,binding)||binding.purpose!=="question")return state;
  const previous=state.entries[binding.investorId],kind=input.kind;
  if(kind==="ask"||kind==="unnecessary") {
    if(!eligible||previous||Object.values(state.entries).some(e=>e.status==="asked")||
      (kind==="ask"?!bounded(input.text,240):input.text!==null))return state;
    return frozenCopy({...state,entries:{...state.entries,[binding.investorId]:{
      binding,status:kind==="ask"?"asked":"unnecessary",question:input.text,reply:null}}});
  }
  if(!previous||previous.status!=="asked"||!sameBinding(previous.binding,binding))return state;
  if(!["answer","skip","cancel"].includes(String(kind))||
    (kind==="answer"?!bounded(input.text,1500):input.text!==null))return state;
  return frozenCopy({...state,entries:{...state.entries,[binding.investorId]:{...previous,
    status:kind==="answer"?"answered":kind==="skip"?"skipped":"cancelled",
    reply:kind==="answer"?input.text:null}}});
}
