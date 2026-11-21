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
