import { env as serverEnvironment } from "node:process";
import { MODEL_RATES, type Model } from "../costs.ts";
if(typeof window!=="undefined")throw new Error("AI configuration is server-only");
export class ServerCredential {
  #value:string;
  constructor(value:string){this.#value=value;Object.freeze(this);}
  use<T>(operation:(value:string)=>T):T{return operation(this.#value);}
  toJSON(){return "[REDACTED]";}
  toString(){return "[REDACTED]";}
}
export type Configuration =
  | Readonly<{mode:"scripted";reason:"disabled"|"missing-credentials"|"invalid-configuration"}>
  | Readonly<{mode:"mock"}>
  | Readonly<{mode:"configured";provider:"openai"|"anthropic"|"google";model:Model;credential:ServerCredential}>;
/** Reads server env only on explicit invocation; never enables an endpoint or makes a request. */
export function loadConfiguration(environment:Readonly<Record<string,string|undefined>>=serverEnvironment):Configuration {
  if(Object.keys(environment).some(k=>k.startsWith("NEXT_PUBLIC_")&&/(?:AI|OPENAI|ANTHROPIC|GEMINI).*(?:KEY|SECRET)/i.test(k)))
    return Object.freeze({mode:"scripted",reason:"invalid-configuration"});
  if(!environment.SHARK_AI_MODE||environment.SHARK_AI_MODE==="scripted")return Object.freeze({mode:"scripted",reason:"disabled"});
  if(environment.SHARK_AI_MODE==="mock")return Object.freeze({mode:"mock"});
  const model=environment.SHARK_AI_MODEL??"gpt-6.2-sol",provider=environment.SHARK_AI_PROVIDER??"openai";
  if(environment.SHARK_AI_MODE!=="live"||!Object.hasOwn(MODEL_RATES,model)||
    !(provider==="openai"?model.startsWith("gpt-"):provider==="anthropic"?model.startsWith("claude-"):provider==="google"&&model.startsWith("gemini-")))
    return Object.freeze({mode:"scripted",reason:"invalid-configuration"});
  const value=environment.SHARK_AI_API_KEY;
  if(!value)return Object.freeze({mode:"scripted",reason:"missing-credentials"});
  if(value.length<12||value.length>4096||value!==value.trim()||/\s|placeholder|replace-me|your-key/i.test(value))
    return Object.freeze({mode:"scripted",reason:"invalid-configuration"});
  return Object.freeze({mode:"configured",provider:provider as "openai"|"anthropic"|"google",
    model:model as Model,credential:new ServerCredential(value)});
}
