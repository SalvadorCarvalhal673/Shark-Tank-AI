import test from 'node:test';
import assert from 'node:assert/strict';
import { createInvestorEndpoint } from '../src/features/ai/server/http-boundary.ts';
import { backendMode, LIVE_INFERENCE_ENABLED } from '../src/features/ai/server/backend-configuration.ts';
import { MAX_REQUEST_BYTES } from '../src/features/ai/contracts.ts';
import { request as fixtureRequest } from './fixtures/ai/request.ts';
type Mutable<T> = T extends object ? { -readonly [K in keyof T]: Mutable<T[K]> } : T;
const request = (): Mutable<ReturnType<typeof fixtureRequest>> => structuredClone(fixtureRequest()) as Mutable<ReturnType<typeof fixtureRequest>>;
function post(body=JSON.stringify(request()),headers:Record<string,string>={'Content-Type':'application/json'}){return new Request('http://localhost/api/investor',{method:'POST',body,headers});}
test('backend HTTP activation defaults off, production and every live environment stay disabled',async()=>{
 assert.equal(LIVE_INFERENCE_ENABLED,false);
 for(const env of [{},{NODE_ENV:'production',SHARK_AI_BACKEND_MODE:'mock'},{NODE_ENV:'development',SHARK_AI_MODE:'live',SHARK_AI_BACKEND_MODE:'mock'},
 {NODE_ENV:'test',SHARK_AI_BACKEND_MODE:'mock',SHARK_AI_LIVE_ENABLED:'true'},
 {NODE_ENV:'test',SHARK_AI_BACKEND_MODE:'mock',NEXT_PUBLIC_OPENAI_API_KEY:'SYNTHETIC_CREDENTIAL'}])assert.equal(backendMode(env),'disabled');
 assert.equal(backendMode({NODE_ENV:'development',SHARK_AI_BACKEND_MODE:'mock'}),'mock');
 const r=await createInvestorEndpoint(()=>backendMode({}))(post());assert.equal(r.status,503);assert.deepEqual(await r.json(),{error:'disabled'});
});
test('backend HTTP validates contract, origin, encoding and methods without echoing hostile text',async()=>{
 const run=createInvestorEndpoint(()=> 'mock');
 for(const [req,status] of [[post('{}'),400],[post('{'),400],[post('SYNTHETIC_PRIVATE_TEXT',{'Content-Type':'text/plain'}),415],
 [post(undefined,{'Content-Type':'application/json',Origin:'https://attacker.invalid'}),403],
 [post(undefined,{'Content-Type':'application/json','Content-Encoding':'gzip'}),400],[new Request('http://localhost/api/investor'),405]] as const){
  const r=await run(req);assert.equal(r.status,status);assert.doesNotMatch(await r.text(),/SYNTHETIC_PRIVATE_TEXT|stack|prompt|credential/);
 }
});
test('backend HTTP emits only validated envelope with no-cache headers, duplicate is discarded',async()=>{
 const run=createInvestorEndpoint(()=> 'mock');const r=await run(post());assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'no-store');
 const v=await r.json();assert.equal(v.provenance,'mock');assert.deepEqual(v.binding,request().binding);assert.equal(v.financialFacts,undefined);assert.equal(v.prompt,undefined);
 assert.equal((await run(post())).status,409);
});
test('backend HTTP byte bound applies to declared and chunked bodies, invalid UTF8 is rejected',async()=>{
 const run=createInvestorEndpoint(()=> 'mock');
 assert.equal((await run(post('x',{'Content-Type':'application/json','Content-Length':String(MAX_REQUEST_BYTES+1)}))).status,413);
 assert.equal((await run(post('x'.repeat(MAX_REQUEST_BYTES+1)))).status,413);
 const bytes=new ReadableStream<Uint8Array>({start(c){c.enqueue(new Uint8Array([0xff]));c.close();}});
 const req=new Request('http://localhost/api/investor',{method:'POST',body:bytes,headers:{'Content-Type':'application/json'},duplex:'half'} as RequestInit);
 assert.equal((await run(req)).status,400);
 const unicode=request();unicode.pitch.pitch='😀'.repeat(750);
 assert.equal((await run(post(JSON.stringify(unicode)))).status,200);
});
test('backend HTTP external cancellation returns no dialogue and global admission is bounded',async()=>{
 const run=createInvestorEndpoint(()=> 'mock'),abort=new AbortController();abort.abort();
 const r=await run(new Request('http://localhost/api/investor',{method:'POST',body:JSON.stringify(request()),headers:{'Content-Type':'application/json'},signal:abort.signal}));assert.equal(r.status,499);
 const limited=createInvestorEndpoint(()=> 'scripted');
 for(let i=0;i<256;i++)await limited(post('{}'));
 assert.equal((await limited(post('{}'))).status,429);
});


import { readBoundedBody, BodyLimitError } from '../src/features/ai/server/bounded-body.ts';
test('bounded streams cancel invalid producers and release pending reads on abort',async()=>{
 let cancelled=0;
 const malformed=new ReadableStream<Uint8Array>({start(c){c.enqueue('not bytes' as unknown as Uint8Array);},cancel(){cancelled++;}});
 await assert.rejects(readBoundedBody(malformed,10,new AbortController().signal),BodyLimitError);
 assert.equal(cancelled,1);assert.equal(malformed.locked,false);
 const abort=new AbortController();let release:()=>void=()=>{};
 const pending=new ReadableStream<Uint8Array>({pull(){release=()=>abort.abort();},cancel(){cancelled++;}});
 const result=readBoundedBody(pending,10,abort.signal);await Promise.resolve();release();
 await assert.rejects(result);assert.equal(cancelled,2);assert.equal(pending.locked,false);
});

test('adversarial pre-aborted bounded reader cancels its unopened source',async()=>{
 let cancelled=0;const body=new ReadableStream<Uint8Array>({cancel(){cancelled++;}}),abort=new AbortController();abort.abort();
 await assert.rejects(readBoundedBody(body,16,abort.signal));assert.equal(cancelled,1);assert.equal(body.locked,false);
});

test('adversarial HTTP pre-abort cancels the source without consuming admission',async()=>{
 let cancelled=0;const body=new ReadableStream<Uint8Array>({cancel(){cancelled++;}}),abort=new AbortController();abort.abort();
 const req=new Request('http://localhost/api/investor',{method:'POST',headers:{'Content-Type':'application/json'},body,signal:abort.signal,duplex:'half'} as RequestInit);
 const endpoint=createInvestorEndpoint(()=> 'mock');
 assert.equal((await endpoint(req)).status,499);assert.equal(cancelled,1);
 for(let i=0;i<256;i++)assert.equal((await endpoint(post('{}'))).status,400);
 assert.equal((await endpoint(post('{}'))).status,429);
});
test('adversarial body fragment flooding and a stalled stream are bounded and cancelled',async(t)=>{
 let cancelled=0,pulls=0;
 const flood=new ReadableStream<Uint8Array>({pull(c){pulls++;c.enqueue(new Uint8Array(0));},cancel(){cancelled++;}});
 await assert.rejects(readBoundedBody(flood,16,new AbortController().signal),BodyLimitError);
 assert.equal(cancelled,1);assert.ok(pulls<=19);assert.equal(flood.locked,false);
 t.mock.timers.enable({apis:['setTimeout']});
 let started!:()=>void;const ready=new Promise<void>(resolve=>{started=resolve;});
 const stalled=new ReadableStream<Uint8Array>({pull(){started();},cancel(){cancelled++;}});
 const req=new Request('http://localhost/api/investor',{method:'POST',headers:{'Content-Type':'application/json'},body:stalled,duplex:'half'} as RequestInit);
 const result=createInvestorEndpoint(()=> 'mock')(req);await ready;await Promise.resolve();t.mock.timers.tick(2001);
 assert.equal((await result).status,408);assert.equal(cancelled,2);assert.equal(stalled.locked,false);
});

test('adversarial default/production/mock HTTP paths never make a global external request',async(t)=>{
 let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;throw Error('Unexpected external request');});
 for(const environment of [{},{NODE_ENV:'production',SHARK_AI_BACKEND_MODE:'mock'},
  {NODE_ENV:'production',SHARK_AI_MODE:'live',SHARK_AI_API_KEY:'SYNTHETIC_CREDENTIAL_SENTINEL'},
  {NODE_ENV:'test',SHARK_AI_BACKEND_MODE:'mock'}]){
  const result=await createInvestorEndpoint(()=>backendMode(environment))(post());
  assert.equal(result.status,environment.NODE_ENV==='test'?200:503);
  assert.doesNotMatch(await result.text(),/SYNTHETIC_CREDENTIAL_SENTINEL/);
 }
 assert.equal(calls,0);
});
