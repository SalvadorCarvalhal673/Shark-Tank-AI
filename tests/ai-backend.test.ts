import test from 'node:test';
import assert from 'node:assert/strict';
import { ConversationBackend } from '../src/features/ai/server/backend-service.ts';
import { BudgetController } from '../src/features/ai/budgets.ts';
import { MockProvider } from '../src/features/ai/server/mock-provider.ts';
import { ProviderFault, type BackendProvider } from '../src/features/ai/server/backend-provider.ts';
import { request as fixtureRequest } from './fixtures/ai/request.ts';
type Mutable<T> = T extends object ? { -readonly [K in keyof T]: Mutable<T[K]> } : T;
const request = (): Mutable<ReturnType<typeof fixtureRequest>> => structuredClone(fixtureRequest()) as Mutable<ReturnType<typeof fixtureRequest>>;
const raw=()=>JSON.stringify(request());
const options=()=>({principal:'server-principal',signal:new AbortController().signal,mode:'mock' as const});
test('backend defaults to honest script; mock returns validated bound immutable envelope',async()=>{
 const backend=new ConversationBackend();
 const script=await backend.run(raw(),{...options(),mode:'scripted'});assert.equal(script.kind,'ready');
 if(script.kind==='ready'){assert.equal(script.response.provenance,'scripted');assert.equal(script.response.fallback,'missing-credentials');}
 const r=request();r.binding.requestId='new';const mock=await backend.run(JSON.stringify(r),options());
 assert.equal(mock.kind,'ready');if(mock.kind==='ready'){assert.equal(mock.response.provenance,'mock');assert.deepEqual(mock.response.binding,r.binding);assert.ok(Object.isFrozen(mock.response));}
 assert.equal(backend.budget.snapshot().active,0);
});
test('backend rejects tampered financial state, duplicate keys, invalid replay and identities before provider',async()=>{
 let calls=0;const backend=new ConversationBackend({provider:{name:'mock',model:'gpt-6.2-sol',generate:async()=>{calls++;throw Error('must not call');}}});
 for(const v of [{...request(),valuation:1},{...request(),rulesVersion:2},{...request(),binding:{...request().binding,revision:1}},
 {...request(),binding:{...request().binding,investorId:'sofia'}},{...request(),pitch:{...request().pitch,equity:0}},
 {...request(),actions:[{kind:'accept',sessionId:'fictional-run',expectedRevision:0,offerId:'fictional-run:maya:3'}]}])
 assert.equal((await backend.run(JSON.stringify(v),options())).kind,'invalid-request');
 assert.equal((await backend.run(raw().replace('"contractVersion":1','"contractVersion":2,"contractVersion":1'),options())).kind,'invalid-request');assert.equal(calls,0);
});
test('backend checks provider/session consent before transmission and minimizes testimony copies',async()=>{
 let calls=0;const provider:BackendProvider={name:'openai',model:'gpt-6.2-sol',generate:async(input,signal)=>{calls++;assert.doesNotMatch(input.prompt.data,/founder@example.com|founderOwnershipBps|saveId/);return new MockProvider().generate(input,signal);}};
 const backend=new ConversationBackend({provider});const denied=await backend.run(JSON.stringify({...request(),pitch:{...request().pitch,pitch:request().pitch.pitch+" Contact founder@example.com."}}),options());
 assert.equal(calls,0);if(denied.kind==='ready')assert.equal(denied.response.fallback,'no-consent');
 const r=request();r.binding.requestId='consent';r.pitch.pitch+=' Contact founder@example.com.';
 const original=r.pitch.pitch;r.consent={version:1,accepted:true,sessionId:r.binding.sessionId,provider:'openai',scope:'investor-dialogue'};
 const result=await backend.run(JSON.stringify(r),options());assert.equal(calls,1);assert.equal(result.kind,'ready');assert.equal(r.pitch.pitch,original);
});
for(const mode of ['refusal','incomplete','invalid','network'] as const)test('backend safe fallback for '+mode,async()=>{
 const mock=new MockProvider(mode),backend=new ConversationBackend({provider:{name:'mock',model:'gpt-6.2-sol',generate:(i,s)=>mock.generate(i,s)}});
 const r=await backend.run(raw(),options());assert.equal(r.kind,'ready');if(r.kind==='ready'){assert.equal(r.response.provenance,'scripted');assert.equal(r.response.fallback,mode==='incomplete'||mode==='invalid'?'invalid-output':mode);}
 assert.equal(backend.budget.snapshot().active,0);
});
test('backend deadlines settle unknown usage and never accept late provider completion',async()=>{
 const budget=new BudgetController({deadlineMs:5});let release!:()=>void;
 const backend=new ConversationBackend({budget,provider:{name:'mock',model:'gpt-6.2-sol',generate:async(i,s)=>{await new Promise<void>(resolve=>{release=resolve;});return new MockProvider().generate(i,s);}}});
 const result=await backend.run(raw(),options());assert.equal(result.kind,'ready');if(result.kind==='ready')assert.equal(result.response.fallback,'timeout');
 const before=budget.snapshot();assert.equal(before.active,0);assert.ok(before.chargedNano>BigInt(0));release();await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(budget.snapshot(),before);
});
test('backend obsolete cancelled request cannot cancel replacement; aborted admission consumes nothing',async()=>{
 let entered!:()=>void;const started=new Promise<void>(resolve=>{entered=resolve;});
 const backend=new ConversationBackend({provider:{name:'mock',model:'gpt-6.2-sol',generate:async(i,s)=>{if(i.binding.requestId==='request-1'){entered();return new Promise(()=>{});}return new MockProvider().generate(i,s);}}});
 const abort=new AbortController();abort.abort();assert.equal((await backend.run(raw(),{...options(),signal:abort.signal})).kind,'discarded');assert.equal(backend.budget.snapshot().requests,0);
 const old=backend.run(raw(),options());await started;
 const r=request();r.binding.requestId='replacement';const next=backend.run(JSON.stringify(r),options());
 assert.equal((await old).kind,'discarded');assert.equal((await next).kind,'ready');assert.equal(backend.budget.snapshot().active,0);
 assert.equal((await backend.run(JSON.stringify(r),options())).kind,'discarded');
});
test('backend cannot deliver after external cancellation or trusted run invalidation',async()=>{
 for(const invalidation of ['external','trusted']){
  let entered!:()=>void;const started=new Promise<void>(resolve=>{entered=resolve;});
  const backend=new ConversationBackend({provider:{name:'mock',model:'gpt-6.2-sol',generate:async()=>{entered();return new Promise(()=>{});}}});const abort=new AbortController();
  const pending=backend.run(raw(),{...options(),signal:abort.signal});await started;
  if(invalidation==='external')abort.abort();else backend.coordinator.cancel('server-principal','fictional-run');
  assert.equal((await pending).kind,'discarded');assert.equal(backend.budget.snapshot().active,0);assert.ok(backend.budget.snapshot().chargedNano>BigInt(0));
 }
});
test('backend budget/rate exhaustion and exception details never escape',async()=>{
 for(const provider of [{name:'mock' as const,model:'gpt-6.2-sol' as const,generate:async()=>{throw new ProviderFault('rate-limit');}},
 {name:'mock' as const,model:'gpt-6.2-sol' as const,generate:async()=>{throw Error('INTERNAL_CREDENTIAL_SENTINEL');}}]){
  const b=new ConversationBackend({provider});const r=await b.run(raw(),options());assert.equal(r.kind,'ready');assert.doesNotMatch(JSON.stringify(r),/INTERNAL_CREDENTIAL/);
 }
 const b=new ConversationBackend({budget:new BudgetController({serverNano:BigInt(0)})});const r=await b.run(raw(),options());if(r.kind==='ready')assert.equal(r.response.fallback,'budget');
});
test('backend rejects financial commitments, forged sources and wrong binding with unchanged contracts',async()=>{
 for(const change of ['commitment','source','binding','extra','duplicate']){
  const b=new ConversationBackend({provider:{name:'mock',model:'gpt-6.2-sol',generate:async(i)=>{
   const o={contractVersion:1,binding:i.binding,dialogue:'Review the supplied assumptions.',question:'What costs remain uncertain?',observations:[] as unknown[]};
   if(change==='commitment')o.dialogue='I offer EUR 1000 for 10%.';
   if(change==='source')o.observations=[{category:'finance',text:'Founder reports traction.',references:[{sourceId:'pitch',quote:'fabricated evidence'}]}];
   if(change==='binding')o.binding={...i.binding,epoch:i.binding.epoch+1};
   const text=JSON.stringify(change==='extra'?{...o,acceptedDeal:true}:o);
   return {packet:{status:'complete',text:change==='duplicate'?text.replace('"contractVersion":1','"contractVersion":2,"contractVersion":1'):text}};
  }}});const r=await b.run(raw(),options());assert.equal(r.kind,'ready');if(r.kind==='ready')assert.equal(r.response.fallback,'invalid-output');
 }
});

test('backend refuses in-process pitch or committed journal replacement under the same session ID',async()=>{
 const b=new ConversationBackend();await b.run(raw(),options());
 const changed=request();changed.binding.requestId='changed-pitch';changed.pitch.amount++;
 assert.equal((await b.run(JSON.stringify(changed),options())).kind,'discarded');
 const first=request();first.binding={...first.binding,requestId:'answer-one',revision:1,purpose:'answer-feedback'};
 first.actions=[{kind:'answer',sessionId:first.binding.sessionId,expectedRevision:0,turn:0,text:'Revenue: EUR9000 monthly.'}];
 assert.equal((await b.run(JSON.stringify(first),options())).kind,'ready');
 const forged=structuredClone(first);forged.binding.requestId='replaced-answer';forged.actions=[{...first.actions[0],kind:'answer',turn:0,text:'Revenue: EUR8000 monthly.'}];
 assert.equal((await b.run(JSON.stringify(forged),options())).kind,'discarded');
});

test('backend checkpoint equivalence ignores JSON field order in canonical actions',async()=>{
 const b=new ConversationBackend(),r=request();r.binding={...r.binding,revision:1,purpose:'answer-feedback'};
 r.actions=[{kind:'answer',sessionId:r.binding.sessionId,expectedRevision:0,turn:0,text:'Revenue: EUR9000 monthly.'}];
 assert.equal((await b.run(JSON.stringify(r),options())).kind,'ready');
 r.binding.requestId='reordered';r.actions=[{text:'Revenue: EUR9000 monthly.',turn:0,expectedRevision:0,sessionId:r.binding.sessionId,kind:'answer'}];
 assert.equal((await b.run(JSON.stringify(r),options())).kind,'ready');
});
import fs from 'node:fs';
test('backend synthetic injection corpus fails closed without executing founder or provider text',async()=>{
 const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/ai/backend-adversarial.json',import.meta.url),'utf8'));
 for(const dialogue of fixture.dialogueAttacks){
  const b=new ConversationBackend({provider:{name:'mock',model:'gpt-6.2-sol',generate:async(i)=>({packet:{status:'complete',text:JSON.stringify({contractVersion:1,binding:i.binding,dialogue,question:'What remains uncertain?',observations:[]})}})}});
  const result=await b.run(raw(),options());assert.equal(result.kind,'ready');if(result.kind==='ready')assert.equal(result.response.fallback,'invalid-output');
 }
 for(const bad of fixture.malformedRequests)assert.equal((await new ConversationBackend().run(bad,options())).kind,'invalid-request');
});


import { investorAnswers } from './browser-fixtures.ts';
import { createRun, advanceRun } from '../src/features/simulation/negotiation/session-storage.ts';
test('backend serves every authorized dialogue purpose from replay without mutating authoritative state',async()=>{
 const r=request();let run=createRun(r.binding.sessionId,r.pitch)!;
 const check=async(purpose:'question'|'answer-feedback'|'counter-explanation'|'outcome',investorId:'maya'|'adrian'|'sofia')=>{
  const before=JSON.stringify(run);const result=await new ConversationBackend().run(JSON.stringify({...r,actions:run.actions,
   binding:{...r.binding,revision:run.session.revision,purpose,investorId}}),options());
  assert.equal(result.kind,'ready');if(result.kind==='ready'){assert.equal(result.response.binding.revision,run.session.revision);assert.equal(result.response.provenance,'mock');if(purpose!=='question')assert.equal(result.response.question,null);}
  assert.equal(JSON.stringify(run),before);
 };
 await check('question','maya');
 for(const [turn,investor] of (['maya','adrian','sofia'] as const).entries()){
  run=advanceRun(run,{kind:'answer',sessionId:run.session.id,expectedRevision:run.session.revision,turn,
   text:investorAnswers[turn]});
  await check('answer-feedback',investor);
 }
 const offer=run.session.offers.find(o=>o.status==='active')!;assert.ok(offer);
 run=advanceRun(run,{kind:'counter',sessionId:run.session.id,expectedRevision:run.session.revision,offerId:offer.id,terms:{amount:offer.amount,equity:offer.equity}});
 await check('counter-explanation',offer.investor);
 run=advanceRun(run,{kind:'walk-away',sessionId:run.session.id,expectedRevision:run.session.revision});
 await check('outcome','maya');assert.equal(run.session.outcome?.kind,'founder-walk-away');
});
test('backend mismatched consent provider or session never invokes external adapter',async()=>{
 for(const consent of [{version:1,accepted:true,sessionId:'different-run',provider:'openai',scope:'investor-dialogue'},
  {version:1,accepted:true,sessionId:'fictional-run',provider:'google',scope:'investor-dialogue'}]){
  let calls=0;const b=new ConversationBackend({provider:{name:'openai',model:'gpt-6.2-sol',generate:async()=>{calls++;throw Error('must not call');}}});
  const result=await b.run(JSON.stringify({...request(),consent}),options());assert.equal(result.kind,consent.sessionId==='fictional-run'?'ready':'invalid-request');
  if(result.kind==='ready')assert.equal(result.response.fallback,'no-consent');assert.equal(calls,0);assert.equal(b.budget.snapshot().requests,0);
 }
});

import { BackendCoordinator, fingerprint } from '../src/features/ai/server/backend-coordinator.ts';
test('adversarial coordinator publishes ordering before synchronous abort callbacks can reenter',()=>{
 const c=new BackendCoordinator(),binding=request().binding,checkpoint={pitch:fingerprint(request().pitch),actions:[]};
 const first=c.begin('principal',binding,checkpoint)!;
 const newest:{ticket:ReturnType<BackendCoordinator['begin']>}={ticket:null};
 first.signal.addEventListener('abort',()=>{newest.ticket=c.begin('principal',{...binding,requestId:'newest'},checkpoint);},{once:true});
 assert.equal(c.begin('principal',{...binding,requestId:'middle'},checkpoint),null);
 assert.ok(newest.ticket);assert.equal(newest.ticket.current(),true);
 assert.equal(c.begin('principal',{...binding,requestId:'newest'},checkpoint),null);
});

test('adversarial coordinator capacity is bounded and rejection cannot invalidate its current ticket',()=>{
 const c=new BackendCoordinator(),checkpoint={pitch:fingerprint(request().pitch),actions:[]};
 for(let i=0;i<64;i++)assert.ok(c.begin('principal',{...request().binding,sessionId:'run-'+i},checkpoint));
 assert.equal(c.begin('principal',{...request().binding,sessionId:'overflow'},checkpoint),null);
 let last:ReturnType<BackendCoordinator['begin']>=null;
 for(let i=0;i<64;i++){last=c.begin('principal',{...request().binding,sessionId:'run-'+i,requestId:'second'},checkpoint);assert.ok(last);}
 assert.ok(last);assert.equal(last.current(),true);
 assert.equal(c.begin('principal',{...request().binding,sessionId:'run-63',requestId:'third'},checkpoint),null);
 assert.equal(last.current(),true);
});
test('adversarial overlapping requests settle owned reservations once and only the newest may deliver',async()=>{
 const budget=new BudgetController();let entered:()=>void=()=>{};
 const releases:Array<()=>void>=[],pending:Array<ReturnType<ConversationBackend['run']>>=[];
 const backend=new ConversationBackend({budget,provider:{name:'mock',model:'gpt-6.2-sol',generate:async(input)=>{
  await new Promise<void>(resolve=>{releases.push(resolve);entered();});
  return new MockProvider().generate(input,new AbortController().signal);
 }}});
 let cancelledCost=BigInt(0);
 for(let i=0;i<12;i++){
  const ready=new Promise<void>(resolve=>{entered=resolve;});
  pending.push(backend.run(JSON.stringify({...request(),binding:{...request().binding,requestId:'overlap-'+i}}),options()));await ready;
  const s=budget.snapshot();assert.equal(s.active,1);assert.equal(s.chargedNano,cancelledCost);
  if(i<11)cancelledCost+=s.reservedNano;
 }
 releases[11]();assert.equal((await pending[11]).kind,'ready');
 const settled=budget.snapshot();assert.equal(settled.active,0);assert.equal(settled.reservedNano,BigInt(0));assert.ok(settled.chargedNano>=cancelledCost);
 for(let i=10;i>=0;i--)releases[i]();
 const results=await Promise.all(pending);assert.equal(results.filter(r=>r.kind==='ready').length,1);
 await new Promise<void>(resolve=>setImmediate(resolve));assert.deepEqual(budget.snapshot(),settled);
});
test('adversarial denied capacity and fabricated journal never preempt a legitimate pending operation',async()=>{
 let entered!:()=>void,release!:()=>void;const ready=new Promise<void>(resolve=>{entered=resolve;});
 const backend=new ConversationBackend({provider:{name:'mock',model:'gpt-6.2-sol',generate:async(input,s)=>{
  entered();await new Promise<void>(resolve=>{release=resolve;});return new MockProvider().generate(input,s);
 }}});
 const pending=backend.run(raw(),options());await ready;const before=backend.budget.snapshot();
 const bad=request();bad.binding.requestId='forged';bad.actions=[{kind:'accept',sessionId:bad.binding.sessionId,expectedRevision:0,offerId:'fictional-run:maya:3'}];
 assert.equal((await backend.run(JSON.stringify(bad),options())).kind,'invalid-request');
 const changed=request();changed.binding.requestId='changed';changed.pitch.amount++;
 assert.equal((await backend.run(JSON.stringify(changed),options())).kind,'discarded');assert.deepEqual(backend.budget.snapshot(),before);
 release();assert.equal((await pending).kind,'ready');assert.equal(backend.budget.snapshot().active,0);
});
