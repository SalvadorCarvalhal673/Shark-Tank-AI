import { estimateCostNano,type Model } from "./costs.ts";
import { id,integer } from "./schemas.ts";
export type BudgetLimits=Readonly<{
  maxInputTokens:number;maxOutputTokens:number;perEpisode:number;globalRequests:number;
  concurrency:number;maxPrincipals:number;serverNano:bigint;deadlineMs:number;model:Model;
}>;
export const DEFAULT_BUDGETS:BudgetLimits=Object.freeze({
  maxInputTokens:8000,maxOutputTokens:2000,perEpisode:16,globalRequests:128,
  concurrency:2,maxPrincipals:64,serverNano:BigInt(5000000000),deadlineMs:15000,model:"gpt-6.2-sol",
});
type Lease=Readonly<{id:number;reserved:bigint}>;
export class BudgetController {
  #limits:BudgetLimits;
  #charged=BigInt(0);#reserved=BigInt(0);#count=0;
  #active=new Map<number,{principal:string;reserved:bigint;lease:Lease}>();
  #episodes=new Map<string,number>();#principals=new Set<string>();#seen=new Set<string>();
  constructor(limits:Partial<BudgetLimits>={}){
    const l={...DEFAULT_BUDGETS,...limits};
    for(const n of [l.maxInputTokens,l.maxOutputTokens,l.perEpisode,l.globalRequests,l.concurrency,l.maxPrincipals,l.deadlineMs])
      if(!integer(n,1000000)||n<1)throw new RangeError("Invalid budget limits");
    if(l.deadlineMs>15000||typeof l.serverNano!=="bigint"||l.serverNano<BigInt(0))throw new RangeError("Invalid budget limits");
    estimateCostNano(0,0,l.model);this.#limits=Object.freeze(l);
  }
  get limits(){return this.#limits;}
  snapshot(){return Object.freeze({chargedNano:this.#charged,reservedNano:this.#reserved,
    requests:this.#count,active:this.#active.size});}
  reserve(principal:string,episode:string,requestId:string,inputTokens:number,outputTokens:number):
    {ok:true;lease:Lease}|{ok:false;reason:"duplicate"|"budget"} {
    if(!id(principal)||!id(episode)||!id(requestId)||!integer(inputTokens,this.#limits.maxInputTokens)||
      !integer(outputTokens,this.#limits.maxOutputTokens)||outputTokens===0)return {ok:false,reason:"budget"};
    const key=principal+":"+episode+":"+requestId,episodeKey=principal+":"+episode;
    if(this.#seen.has(key))return {ok:false,reason:"duplicate"};
    const cost=estimateCostNano(inputTokens,outputTokens,this.#limits.model);
    if(this.#count>=this.#limits.globalRequests||this.#active.size>=this.#limits.concurrency||
      [...this.#active.values()].some(a=>a.principal===principal)||
      (this.#episodes.get(episodeKey)??0)>=this.#limits.perEpisode||
      (!this.#principals.has(principal)&&this.#principals.size>=this.#limits.maxPrincipals)||
      this.#charged+this.#reserved+cost>this.#limits.serverNano)return {ok:false,reason:"budget"};
    const lease=Object.freeze({id:++this.#count,reserved:cost});
    this.#active.set(lease.id,{principal,reserved:cost,lease});this.#reserved+=cost;
    this.#seen.add(key);this.#principals.add(principal);this.#episodes.set(episodeKey,(this.#episodes.get(episodeKey)??0)+1);
    return {ok:true,lease};
  }
  finish(lease:Lease,usage?:{inputTokens:number;outputTokens:number}):boolean{
    const active=this.#active.get(lease.id);
    if(!active||active.lease!==lease)return false;
    let charge=active.reserved;
    if(usage&&integer(usage.inputTokens,this.#limits.maxInputTokens)&&integer(usage.outputTokens,this.#limits.maxOutputTokens)){
      const actual=estimateCostNano(usage.inputTokens,usage.outputTokens,this.#limits.model);
      // Overshoot or unverifiable usage retains the whole conservative reservation.
      if(actual<=active.reserved)charge=actual;
    }
    this.#active.delete(lease.id);this.#reserved-=active.reserved;this.#charged+=charge;return true;
  }
}
