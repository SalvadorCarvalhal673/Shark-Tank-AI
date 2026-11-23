import { NEGOTIATION_RULES } from "../simulation/negotiation/investor-policy.ts";
import type { Binding,Consent } from "./contracts.ts";
import type { ConversationContext } from "./context.ts";
import { exact, frozenCopy, validBinding } from "./schemas.ts";
export const PRIVACY_VERSION = 1;
export const DISCLOSURE = Object.freeze({
  sends:"Your startup description, committed answers, bounded recent dialogue and engine-recorded negotiation decisions go to the selected AI provider.",
  localSaving:"AI consent is separate from optional local session saving.",
  retention:"Provider retention and abuse-monitoring rules apply; zero retention is not promised.",
  choice:"Decline or revoke AI and continue the same scripted simulation.",
  limits:"Redaction is best effort. Use fictional information and omit confidential or personal data.",
});
export function hasConsent(value:unknown,binding:Binding,provider:Consent["provider"]):value is Consent {
  return validBinding(binding)&&exact(value,["version","accepted","sessionId","provider","scope"])&&
    value.version===PRIVACY_VERSION&&value.accepted===true&&value.sessionId===binding.sessionId&&
    value.provider===provider&&["openai","anthropic","google"].includes(provider)&&value.scope==="investor-dialogue";
}
/** Best-effort minimization, not a general PII detector. Never modifies founder testimony. */
export function redact(text:string):string {
  return text.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,"[redacted email]")
    .replace(/\+[\d ()-]{8,24}\d/g,"[redacted phone]")
    .replace(/\b(?:sk-[A-Za-z0-9_-]{8,}|(?:api[_ -]?key|password)\s*[:=]\s*\S+)/gi,"[redacted credential]");
}
export function minimizeContext(context:ConversationContext){
  return frozenCopy({
    binding:context.request.binding,stage:context.session.stage,startup:redact(context.session.pitch.startup),
    sources:context.sources.map(s=>({...s,text:redact(s.text)})),
    history:context.request.history.map(h=>({...h,text:redact(h.text)})),
    requiredQuestion:NEGOTIATION_RULES.investors[context.request.binding.investorId].question,
    committedDecisions:context.session.history,
    // No local save IDs, writer IDs, credentials, ownership or arbitrary browser state.
  });
}

export function prepareTransmission(context:ConversationContext,consent:unknown,provider:Consent["provider"]){
  return hasConsent(consent,context.request.binding,provider)?minimizeContext(context):null;
}
