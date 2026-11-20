import type { Binding,PresentationEvent } from "./contracts.ts";
import { frozenCopy, id, integer, investor, sameBinding, validBinding } from "./schemas.ts";
export type ViewContext = Readonly<{sessionId:string;revision:number;investorId:Binding["investorId"];mode:string;recoveryId:string}>;
export class RequestLifecycle {
  #context:ViewContext|null=null;
  #epoch=0;
  #active:{binding:Binding;controller:AbortController}|null=null;
  #delivered:Binding|null=null;
  #seen=new Set<string>();
  #events:PresentationEvent[]=[];
  #disposed=false;
  get epoch(){return this.#epoch;}
  setContext(context:ViewContext):number {
    if(!id(context.sessionId)||!integer(context.revision,7)||!investor(context.investorId)||
      !id(context.mode)||!id(context.recoveryId))throw new RangeError("Invalid view context");
    if(this.#disposed)return this.#epoch;
    if(this.#context&&Object.keys(context).some(k=>context[k as keyof ViewContext]!==this.#context![k as keyof ViewContext]))
      this.cancel();
    this.#context=frozenCopy(context);return this.#epoch;
  }
  begin(binding:Binding):AbortSignal|null {
    const c=this.#context,key=binding.sessionId+":"+binding.requestId;
    if(this.#disposed||!validBinding(binding)||!c||binding.sessionId!==c.sessionId||binding.revision!==c.revision||
      binding.investorId!==c.investorId||binding.epoch!==this.#epoch||this.#seen.has(key)||this.#seen.size>=128)return null;
    // New request supersedes the old one at the same context/epoch; exact request identity still differs.
    if(this.#active){this.#active.controller.abort();this.#events.push({kind:"request-cancelled",binding:this.#active.binding});}
    const copy=frozenCopy(binding),controller=new AbortController();
    this.#delivered=null;this.#active={binding:copy,controller};this.#seen.add(key);
    this.#events.push({kind:"request-started",binding:copy});return controller.signal;
  }
  consume(binding:Binding):boolean {
    if(this.#disposed||!this.#active||this.#active.controller.signal.aborted||
      !sameBinding(this.#active.binding,binding)||binding.epoch!==this.#epoch)return false;
    this.#delivered=this.#active.binding;this.#active=null;
    this.#events.push({kind:"dialogue-ready",binding:this.#delivered});return true;
  }
  presentationFinished(binding:Binding):boolean {
    if(!this.#delivered||!sameBinding(this.#delivered,binding)||binding.epoch!==this.#epoch)return false;
    this.#events.push({kind:"presentation-finished",binding:this.#delivered});this.#delivered=null;return true;
  }
  cancel():void {
    if(this.#active){this.#active.controller.abort();this.#events.push({kind:"request-cancelled",binding:this.#active.binding});}
    this.#active=null;this.#delivered=null;this.#epoch++;
  }
  dispose():void {this.cancel();this.#disposed=true;}
  drainEvents():readonly PresentationEvent[] {const result=frozenCopy(this.#events);this.#events=[];return result;}
}
export class RequestTimeout extends Error {constructor(){super("AI request deadline exceeded");}}
/** Rejects on abort even when a provider ignores its signal; late completion is never returned. */
export async function withDeadline<T>(task:(signal:AbortSignal)=>Promise<T>,external:AbortSignal,ms=15000):Promise<T>{
  if(!Number.isInteger(ms)||ms<1||ms>15000)throw new RangeError("Invalid deadline");
  external.throwIfAborted();
  const controller=new AbortController();
  let timer:ReturnType<typeof setTimeout>|undefined;
  let listener:()=>void=()=>{};
  const cancelled=new Promise<never>((_,reject)=>{
    listener=()=>{controller.abort();reject(new Error("AI request cancelled"));};
    external.addEventListener("abort",listener,{once:true});
    timer=setTimeout(()=>{controller.abort();reject(new RequestTimeout());},ms);
    if(external.aborted)listener();
  });
  try{return await Promise.race([Promise.resolve().then(()=>{controller.signal.throwIfAborted();return task(controller.signal);}),cancelled]);}
  finally{clearTimeout(timer);external.removeEventListener("abort",listener);}
}
