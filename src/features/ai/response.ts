import type { AppResponse,Failure } from "./contracts.ts";
import { MAX_OUTPUT_BYTES } from "./contracts.ts";
import type { ConversationContext } from "./context.ts";
import { bounded,exact,frozenCopy,sameBinding,validBinding } from "./schemas.ts";
import { scriptedFallback } from "./fallback.ts";
import { validateProvider } from "./validation.ts";
/** Validate a transport envelope before rendering. Provenance comes from the trusted server, not a model. */
export function parseAppResponse(raw:string,context:ConversationContext):AppResponse|null {
  if(typeof raw!=="string"||new TextEncoder().encode(raw).length>MAX_OUTPUT_BYTES)return null;
  let v:unknown;try{v=JSON.parse(raw);}catch{return null;}
  if(!exact(v,["contractVersion","binding","dialogue","question","observations","provenance","fallback","limitations"])||
    v.contractVersion!==1||!validBinding(v.binding)||!sameBinding(v.binding,context.request.binding)||
    !["ai","mock","scripted"].includes(String(v.provenance))||!Array.isArray(v.limitations)||
    v.limitations.length<1||v.limitations.length>4||!v.limitations.every(l=>bounded(l,180)))return null;
  if(v.provenance==="scripted"){
    if(!["missing-credentials","timeout","refusal","network","invalid-output","budget","no-consent","cancelled"].includes(String(v.fallback)))return null;
    const expected=scriptedFallback(context,v.fallback as Failure);
    if(v.dialogue!==expected.dialogue||v.question!==expected.question||!Array.isArray(v.observations)||v.observations.length)return null;
  }else{
    if(v.fallback!==null)return null;
    const output={contractVersion:1,binding:v.binding,dialogue:v.dialogue,question:v.question,observations:v.observations};
    if(!validateProvider({status:"complete",text:JSON.stringify(output)},context).ok)return null;
  }
  return frozenCopy(v as AppResponse);
}
