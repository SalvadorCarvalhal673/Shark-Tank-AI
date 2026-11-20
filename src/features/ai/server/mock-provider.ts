import type { InvestorProvider,ProviderResult,ProviderInput } from "./provider.ts";
import { PERSONAS } from "../personas.ts";
import { frozenCopy } from "../schemas.ts";
export class MockProvider implements InvestorProvider {
  readonly kind="mock" as const;
  readonly mode:"valid"|"network"|"refusal"|"incomplete"|"invalid";
  readonly delayMs:number;
  constructor(mode:MockProvider["mode"]="valid",delayMs=0){
    if(!["valid","network","refusal","incomplete","invalid"].includes(mode)||
      !Number.isInteger(delayMs)||delayMs<0||delayMs>15000)throw new RangeError("Invalid mock options");
    this.mode=mode;this.delayMs=delayMs;
  }
  async generate(input:ProviderInput,signal:AbortSignal):Promise<ProviderResult>{
    signal.throwIfAborted();
    if(this.delayMs) await new Promise<void>((resolve,reject)=>{
      const done=()=>{signal.removeEventListener("abort",abort);resolve();};
      const timer=setTimeout(done,this.delayMs);
      const abort=()=>{clearTimeout(timer);signal.removeEventListener("abort",abort);reject(new Error("Cancelled"));};
      signal.addEventListener("abort",abort,{once:true});
      if(signal.aborted)abort();
    });
    signal.throwIfAborted();
    if(this.mode==="network")throw new Error("Synthetic network failure");
    const b=input.binding,p=PERSONAS[b.investorId];
    const data=JSON.parse(input.prompt.data);
    const topic=/container/i.test(JSON.stringify(data.sources))?"the reusable-container business":/bicycle/i.test(JSON.stringify(data.sources))?"the bicycle service":/energy/i.test(JSON.stringify(data.sources))?"the energy service":"the business";
    const dialogue="For "+topic+", "+{maya:"Separate operating costs from the financial assumptions you have supplied.",
      adrian:"A focused first market helps. Explain what makes your acquisition approach repeatable.",
      sofia:"Connect the customer observation to a concrete delivery milestone."}[b.investorId];
    return frozenCopy({packet:{status:this.mode==="refusal"?"refusal":this.mode==="incomplete"?"incomplete":"complete",
      text:this.mode==="invalid"?"{":JSON.stringify({contractVersion:1,binding:b,dialogue,
        question:b.purpose==="question"?p.question:null,observations:[]})},
      usage:{inputTokens:0,outputTokens:0}});
  }
}
