import { parseUniqueJson } from "./json.ts";
import { MAX_OUTPUT_BYTES, type ProviderOutput, type Failure } from "./contracts.ts";
import type { ConversationContext } from "./context.ts";
import { bounded, exact, frozenCopy, sameBinding, validBinding } from "./schemas.ts";
import { PERSONAS } from "./personas.ts";
export type ValidationResult = {ok:true;value:ProviderOutput} | {ok:false;reason:Failure};
const suspicious = /(?:[0-9€$£%<>]|\b(?:hundred|thousand|million|percent|guaranteed|verified|ignore (?:all |previous )?instructions|system prompt|api[_ -]?key)\b|\b(?:I|we)\s+(?:accept|offer|invest|withdraw|agree)\b|\bdeal\s+(?:accepted|done|agreed)\b)/i;
/** This detects known hazardous phrasing, not semantic truth. Finance has no output channel. */
export function validateProvider(packet: unknown, context: ConversationContext): ValidationResult {
  const fail = (reason: Failure = "invalid-output"): ValidationResult => ({ok:false,reason});
  if (!exact(packet,["status","text"]) || typeof packet.text !== "string") return fail();
  if(packet.status==="refusal") return fail("refusal");
  if(packet.status!=="complete") return fail();
  if(new TextEncoder().encode(packet.text).length>MAX_OUTPUT_BYTES) return fail();
  let v:unknown; try {v=parseUniqueJson(packet.text);} catch {return fail();}
  if(!exact(v,["contractVersion","binding","dialogue","question","observations"]) || v.contractVersion!==1 ||
      !validBinding(v.binding) || !sameBinding(v.binding,context.request.binding) || !bounded(v.dialogue,600) ||
      !(v.question===null || bounded(v.question,240)) ||
      (context.request.binding.purpose==="question" ? v.question===null : v.question!==null) ||
      !Array.isArray(v.observations) || v.observations.length>2) return fail();
  if(suspicious.test(v.dialogue) || (typeof v.question==="string" && suspicious.test(v.question))) return fail();
  for(const o of v.observations) {
    if(!exact(o,["category","text","references"]) || o.category!==PERSONAS[context.request.binding.investorId].category ||
       !bounded(o.text,180) || suspicious.test(o.text) || !Array.isArray(o.references) ||
       o.references.length<1 || o.references.length>2) return fail();
    for(const ref of o.references) {
      if(!exact(ref,["sourceId","quote"]) || !bounded(ref.sourceId,80) || !bounded(ref.quote,240) ||
        !context.sources.some(s=>s.id===ref.sourceId && s.text.includes(ref.quote as string))) return fail();
    }
  }
  return {ok:true,value:frozenCopy(v as ProviderOutput)};
}
// Portable strict JSON Schema for a future provider adapter. Runtime validation remains mandatory.
export const PROVIDER_SCHEMA = {
  type:"object",additionalProperties:false,required:["contractVersion","binding","dialogue","question","observations"],
  properties:{
    contractVersion:{type:"integer",enum:[1]},
    binding:{type:"object",additionalProperties:false,
      required:["sessionId","revision","requestId","epoch","investorId","purpose"],
      properties:{sessionId:{type:"string",maxLength:80},revision:{type:"integer",minimum:0,maximum:7},
        requestId:{type:"string",maxLength:80},epoch:{type:"integer",minimum:0},
        investorId:{type:"string",enum:["maya","adrian","sofia"]},
        purpose:{type:"string",enum:["question","answer-feedback","counter-explanation","outcome"]}}},
    dialogue:{type:"string",minLength:1,maxLength:600},
    question:{type:["string","null"],maxLength:240},
    observations:{type:"array",maxItems:2,items:{type:"object",additionalProperties:false,
      required:["category","text","references"],properties:{
        category:{type:"string",enum:["finance","growth","execution"]},text:{type:"string",maxLength:180},
        references:{type:"array",minItems:1,maxItems:2,items:{type:"object",additionalProperties:false,
          required:["sourceId","quote"],properties:{sourceId:{type:"string",maxLength:80},quote:{type:"string",maxLength:240}}}}}}},
  },
} as const;
