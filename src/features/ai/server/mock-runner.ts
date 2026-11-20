import type { AppResponse } from "../contracts.ts";
import { buildContext } from "../context.ts";
import { parseRequest,frozenCopy } from "../schemas.ts";
import { validateProvider,PROVIDER_SCHEMA } from "../validation.ts";
import { scriptedFallback } from "../fallback.ts";
import { buildPrompt } from "../prompts.ts";
import { prepareTransmission,minimizeContext } from "../privacy.ts";
import { BudgetController } from "../budgets.ts";
import { RequestLifecycle,RequestTimeout,withDeadline } from "../lifecycle.ts";
import { MockProvider } from "./mock-provider.ts";
import type { InvestorProvider,ProviderUsage } from "./provider.ts";
export type MockRunResult={kind:"ready";response:AppResponse}|{kind:"discarded"}|{kind:"invalid-request"};
/** Offline integration harness only. No HTTP export, SDK, fetch or live adapter. */
export async function runMockConversation(raw:string,options:{
  lifecycle:RequestLifecycle;budget:BudgetController;signal:AbortSignal;provider?:InvestorProvider;
  principal:string;testConsentBoundary?:boolean;deadlineMs?:number;
}):Promise<MockRunResult>{
  const request=parseRequest(raw),context=request&&buildContext(request);
  if(!context)return {kind:"invalid-request"};
  if(options.signal.aborted)return {kind:"discarded"};
  const signal=options.lifecycle.begin(request!.binding);
  if(!signal)return {kind:"discarded"};
  const combined=AbortSignal.any([signal,options.signal]);
  const deliver=(response:AppResponse):MockRunResult=>
    !combined.aborted&&options.lifecycle.consume(response.binding)?{kind:"ready",response}:{kind:"discarded"};
  if(combined.aborted){options.lifecycle.cancelRequest(request!.binding);return {kind:"discarded"};}
  if(options.testConsentBoundary&&!prepareTransmission(context,request!.consent,"openai"))
    return deliver(scriptedFallback(context,"no-consent"));
  const provider=options.provider??new MockProvider();
  if(provider.kind!=="mock")return deliver(scriptedFallback(context,"invalid-output"));
  const originalPrompt=buildPrompt(context);
  const minimized=minimizeContext(context);
  const prompt={...originalPrompt,data:JSON.stringify(minimized)};
  const inputTokens=new TextEncoder().encode(prompt.system+prompt.data+JSON.stringify(PROVIDER_SCHEMA)).length+1024;
  const outputTokens=options.budget.limits.maxOutputTokens;
  const reserve=options.budget.reserve(options.principal,request!.binding.sessionId,request!.binding.requestId,inputTokens,outputTokens);
  if(!reserve.ok){
    if(reserve.reason==="duplicate"){options.lifecycle.cancelRequest(request!.binding);return {kind:"discarded"};}
    return deliver(scriptedFallback(context,"budget"));
  }
  let usage:ProviderUsage|undefined;
  try{
    const result=await withDeadline(s=>provider.generate(frozenCopy({binding:request!.binding,prompt,maxOutputTokens:outputTokens}),s),
      combined,options.deadlineMs??options.budget.limits.deadlineMs);
    usage=result.usage;
    const validated=validateProvider(result.packet,context);
    if(!validated.ok)return deliver(scriptedFallback(context,validated.reason));
    return deliver(frozenCopy({contractVersion:1,binding:request!.binding,dialogue:validated.value.dialogue,
      question:validated.value.question,observations:validated.value.observations,
      provenance:"mock",fallback:null,limitations:["Synthetic mock dialogue; no model inference.","Founder information is unverified."]}));
  }catch(error){
    if(combined.aborted){options.lifecycle.cancelRequest(request!.binding);return {kind:"discarded"};}
    return deliver(scriptedFallback(context,error instanceof RequestTimeout?"timeout":"network"));
  }finally{options.budget.finish(reserve.lease,usage);}
}
