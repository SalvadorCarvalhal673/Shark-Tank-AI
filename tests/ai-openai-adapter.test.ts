import test from 'node:test';
import assert from 'node:assert/strict';
import { OpenAIResponseAdapter, type ProviderExchange } from '../src/features/ai/server/openai-adapter.ts';
import { ServerCredential } from '../src/features/ai/server/configuration.ts';
import { ProviderFault, selectBackendProvider } from '../src/features/ai/server/backend-provider.ts';
import { ConversationBackend } from '../src/features/ai/server/backend-service.ts';
import { BudgetController } from '../src/features/ai/budgets.ts';
import { request as fixtureRequest } from './fixtures/ai/request.ts';
type Mutable<T> = T extends object ? { -readonly [K in keyof T]: Mutable<T[K]> } : T;
const request = (): Mutable<ReturnType<typeof fixtureRequest>> => structuredClone(fixtureRequest()) as Mutable<ReturnType<typeof fixtureRequest>>;
const input=()=>({binding:request().binding,prompt:{system:'Trusted system instructions.',data:'Untrusted founder text.'},maxOutputTokens:2000});
const output=()=>({contractVersion:1,binding:request().binding,dialogue:'Review the supplied operating assumptions.',question:'What costs remain uncertain?',observations:[]});
const wire=()=>({model:'gpt-6.2-sol',status:'completed',output:[{type:'message',role:'assistant',status:'completed',content:[{type:'output_text',text:JSON.stringify(output())}]}],usage:{input_tokens:200,output_tokens:100}});
const credential=new ServerCredential('SYNTHETIC_CREDENTIAL_SENTINEL');
test('OpenAI codec produces reviewed structured Responses request through injected transport only',async()=>{
 let calls=0;const adapter=new OpenAIResponseAdapter(credential,async(url,init)=>{
  calls++;assert.equal(url,'https://api.openai.com/v1/responses');assert.equal(init.method,'POST');
  const body=JSON.parse(init.body);assert.equal(body.model,'gpt-6.2-sol');assert.equal(body.store,false);assert.equal(body.stream,false);assert.deepEqual(body.tools,[]);
  assert.equal(body.text.format.type,'json_schema');assert.equal(body.text.format.strict,true);assert.equal(body.text.format.schema.additionalProperties,false);
  assert.equal(body.instructions,input().prompt.system);assert.equal(body.input,input().prompt.data);assert.equal(body.max_output_tokens,2000);
  return Response.json(wire());
 });
 const result=await adapter.generate(input(),new AbortController().signal);assert.equal(calls,1);assert.deepEqual(result.packet,{status:'complete',text:JSON.stringify(output())});
 assert.deepEqual(result.usage,{inputTokens:200,outputTokens:100});assert.doesNotMatch(JSON.stringify(result),/SYNTHETIC_CREDENTIAL/);
});
test('OpenAI codec rejects malformed, duplicate, oversized, wrong model and unauthorized tool output',async()=>{
 for(const raw of ['{',JSON.stringify(wire()).replace('"status":"completed"','"status":"failed","status":"completed"'),
 JSON.stringify({...wire(),model:'unreviewed-model'}),JSON.stringify({...wire(),output:[{type:'function_call',name:'accept_deal'}]}),
 JSON.stringify({...wire(),output:[]}), 'x'.repeat(65537)]){
  const adapter=new OpenAIResponseAdapter(credential,async()=>new Response(raw));
  await assert.rejects(adapter.generate(input(),new AbortController().signal),e=>e instanceof ProviderFault&&e.category==='invalid-output');
 }
});
test('OpenAI refusal, incomplete and usage-unavailable results remain conservative',async()=>{
 const refusal={...wire(),output:[{type:'message',role:'assistant',status:'completed',content:[{type:'refusal',refusal:'No.'}]}]};
 for(const [body,status] of [[refusal,'refusal'],[{...wire(),status:'incomplete'},'incomplete']] as const){
  const adapter=new OpenAIResponseAdapter(credential,async()=>Response.json(body));const r=await adapter.generate(input(),new AbortController().signal);assert.equal((r.packet as {status:string}).status,status);assert.equal(r.usage,undefined);
 }
 const adapter=new OpenAIResponseAdapter(credential,async()=>Response.json({...wire(),usage:{input_tokens:-1,output_tokens:2}}));assert.equal((await adapter.generate(input(),new AbortController().signal)).usage,undefined);
});
test('OpenAI HTTP errors never read or return server error bodies; no retries or vendor switch',async()=>{
 for(const code of [401,429,500]){
  let calls=0;const adapter=new OpenAIResponseAdapter(credential,async()=>{calls++;return new Response('SYNTHETIC_CREDENTIAL_SENTINEL',{status:code});});
  await assert.rejects(adapter.generate(input(),new AbortController().signal),e=>e instanceof ProviderFault&&e.category===(code===429?'rate-limit':'network')&&!String(e).includes('SYNTHETIC_CREDENTIAL'));
  assert.equal(calls,1);
 }
});
test('OpenAI abort reaches injected transport; already-aborted request never invokes it',async()=>{
 let called=0;const exchange:ProviderExchange=async(_url,init)=>{called++;assert.equal(init.signal.aborted,false);throw Error('SECRET');};
 const adapter=new OpenAIResponseAdapter(credential,exchange),abort=new AbortController();abort.abort();await assert.rejects(adapter.generate(input(),abort.signal));assert.equal(called,0);
 await assert.rejects(adapter.generate(input(),new AbortController().signal),/Investor provider unavailable/);assert.equal(called,1);
});
test('provider registry selects explicitly and rejects missing/ambiguous alternative ports or pricing mismatch',()=>{
 const openai=new OpenAIResponseAdapter(credential,async()=>Response.json(wire()));
 const alternative={name:'anthropic' as const,model:'claude-sonnet-5-5' as const,generate:async()=>({packet:{status:'refusal',text:''}})};
 assert.equal(selectBackendProvider('openai','gpt-6.2-sol',[openai,alternative]),openai);
 assert.equal(selectBackendProvider('anthropic','claude-sonnet-5-5',[openai,alternative]),alternative);
 assert.equal(selectBackendProvider('google','gemini-3.8-flash',[openai,alternative]),null);
 assert.equal(selectBackendProvider('openai','gpt-6.2-sol',[openai,openai]),null);
 assert.throws(()=>new ConversationBackend({provider:openai,budget:new BudgetController({model:'gpt-6-luna'})}),/model mismatch/);
});
test('full OpenAI-shaped pipeline uses canonical context, explicit consent and mocked transport',async()=>{
 const adapter=new OpenAIResponseAdapter(credential,async()=>Response.json(wire()));const backend=new ConversationBackend({provider:adapter});
 const r=request();r.consent={version:1,accepted:true,sessionId:r.binding.sessionId,provider:'openai',scope:'investor-dialogue'};
 const response=await backend.run(JSON.stringify(r),{principal:'trusted-server-scope',signal:new AbortController().signal,mode:'mock'});
 assert.equal(response.kind,'ready');if(response.kind==='ready'){assert.equal(response.response.provenance,'ai');assert.equal(response.response.fallback,null);}
 assert.equal(backend.budget.snapshot().chargedNano,BigInt(1400000));assert.equal(backend.budget.snapshot().active,0);
});
