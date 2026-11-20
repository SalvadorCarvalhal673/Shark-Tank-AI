import { buildPrompt } from "../prompts.ts";
import { parseRequest } from "../schemas.ts";
import { buildContext } from "../context.ts";
import { validateProvider } from "../validation.ts";
import type { InvestorProvider } from "./provider.ts";
import { MockProvider } from "./mock-provider.ts";
/** Test-only dependency-injected service. There is no HTTP route and no fetch/SDK. */
export async function invokeMock(raw:string,signal:AbortSignal,provider:InvestorProvider=new MockProvider()){
  const request=parseRequest(raw);
  const context=request&&buildContext(request);
  if(!context)return {ok:false as const,reason:"invalid-request" as const};
  signal.throwIfAborted();
  const result=await provider.generate({binding:context.request.binding,prompt:buildPrompt(context),maxOutputTokens:2000},signal);
  signal.throwIfAborted();
  return validateProvider(result.packet,context);
}
