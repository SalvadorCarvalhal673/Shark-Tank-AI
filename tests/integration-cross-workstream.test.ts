import test from 'node:test';
import assert from 'node:assert/strict';
import { demoScenarios, financialPreview, sceneCue, cameraStep } from '../src/features/studio/model.ts';
import { createRun, advanceRun, decodeSave, type SessionRun } from '../src/features/simulation/negotiation/session-storage.ts';
import { acceptanceAction, pendingForSession, ownershipPresentation, investorActivity } from '../src/features/simulation/negotiation/presentation.ts';
import { valuations } from '../src/features/simulation/negotiation/financials.ts';
import { buildContext } from '../src/features/ai/context.ts';
import { ConversationBackend } from '../src/features/ai/server/backend-service.ts';
import { createInvestorEndpoint } from '../src/features/ai/server/http-boundary.ts';
import { backendMode } from '../src/features/ai/server/backend-configuration.ts';
const scenario=demoScenarios[1];
function episode(id='integration-run',valid=true):SessionRun {
 let run=createRun(id,scenario.pitch)!;
 for(let turn=0;turn<3;turn++)run=advanceRun(run,{kind:'answer',sessionId:id,expectedRevision:run.session.revision,turn,text:valid?scenario.answers[turn]:'I do not have these business measures available yet.'});
 return run;
}
function wire(run:SessionRun){return {contractVersion:1,rulesVersion:1,binding:{sessionId:run.session.id,revision:run.session.revision,requestId:'narration',epoch:0,investorId:'maya',purpose:'outcome'},pitch:run.session.pitch,actions:run.actions,history:[],consent:null};}
function saved(run:SessionRun){return JSON.stringify({schemaVersion:1,rulesVersion:1,sessionId:run.session.id,pitch:run.session.pitch,actions:run.actions,saveId:'integration-save',generation:1,writerId:'integration-writer',savedAt:1});}

test('integration: scene projections are stable for rejected commands, unique for committed counters and passive at completion',()=>{
 const run=episode(),before=JSON.stringify(run),cue=sceneCue(run.session,'maya'),offer=run.session.offers.find(o=>o.investor==='maya')!;
 assert.equal(cue.pose,'Offering');
 const invalid=advanceRun(run,{kind:'counter',sessionId:run.session.id,expectedRevision:0,offerId:offer.id,terms:{amount:offer.amount,equity:offer.equity}});
 assert.equal(invalid,run);assert.deepEqual(sceneCue(invalid.session,'maya'),cue);
 const next=advanceRun(run,{kind:'counter',sessionId:run.session.id,expectedRevision:3,offerId:offer.id,terms:{amount:offer.amount,equity:offer.equity}});
 assert.notEqual(sceneCue(next.session,'maya').key,cue.key);assert.equal(sceneCue(next.session,'adrian').key,sceneCue(run.session,'adrian').key);
 assert.deepEqual(Object.keys(sceneCue(next.session,'maya')).sort(),['clip','key','pose']);
 const ended=advanceRun(next,{kind:'walk-away',sessionId:next.session.id,expectedRevision:4});
 sceneCue(ended.session,'maya');assert.equal(JSON.stringify(run),before);assert.equal(ended.actions.length,5);
});
for(const [i,s] of demoScenarios.entries())test('integration: both workstreams preserve fictional scenario '+s.id+' with independent financial expectations',()=>{
 const preview=financialPreview('100000',i===0?'20':'10',s.pitch.founderOwnershipBps);
 assert.ok(preview.cap&&preview.value);assert.deepEqual(preview.value,i===0?{preMoney:40000000,postMoney:50000000}:{preMoney:90000000,postMoney:100000000});
 assert.deepEqual([preview.cap.founderAfterBps,preview.cap.otherExistingAfterBps,preview.cap.investorBps],i===0?[6400,1600,2000]:[5400,3600,1000]);
 assert.equal(preview.cap.founderAfterBps+preview.cap.otherExistingAfterBps+preview.cap.investorBps,10000);
 const run=createRun('fixture-'+i,s.pitch)!,original=JSON.stringify(run);financialPreview('1e9','0',s.pitch.founderOwnershipBps);assert.equal(JSON.stringify(run),original);
});

test('integration: selected acceptance, cap table and old offer inspection reconcile without replaying history',()=>{
 const run=episode(),offer=run.session.offers.find(o=>o.investor==='maya')!;
 const pending={kind:'confirm' as const,sessionId:run.session.id,expectedRevision:3,offerId:offer.id};
 const action=acceptanceAction(run.session,pending)!;assert.ok(action);const done=advanceRun(run,action);
 assert.equal(done.session.outcome?.kind,'accepted-deal');assert.equal(done.session.offers.filter(o=>o.status==='accepted').length,1);
 assert.equal(done.session.offers.find(o=>o.status==='accepted')?.id,offer.id);assert.equal(advanceRun(done,action),done);
 assert.deepEqual(valuations(offer),{preMoney:66923077,postMoney:76923077});
 const cap=ownershipPresentation(6000,offer.equity)!;assert.deepEqual([cap.founderAfterBps,cap.otherExistingAfterBps,cap.investorBps],[5220,3480,1300]);
 assert.equal(cap.founderDilutionBps,780);assert.equal(cap.founderRelativeDilutionBps,1300);
 const original=JSON.stringify(done),view=investorActivity(done.session,'maya');assert.equal(view.length,1);
 assert.equal(view[0].kind,'opening');assert.ok(Object.isFrozen(view[0]));assert.throws(()=>Object.assign(view[0],{revision:99}));view.pop();
 assert.equal(JSON.stringify(done),original);assert.equal(pendingForSession(done.session,pending),null);
});

test('integration: restored canonical history rejects stale confirmations and duplicate journals',()=>{
 const run=episode(),offer=run.session.offers[0],pending={kind:'confirm' as const,sessionId:run.session.id,expectedRevision:3,offerId:offer.id};
 const next=advanceRun(run,{kind:'counter',sessionId:run.session.id,expectedRevision:3,offerId:offer.id,terms:{amount:offer.amount,equity:offer.equity}});
 const recovered=decodeSave(saved(next));assert.equal(recovered.kind,'valid');if(recovered.kind!=='valid')return;
 assert.deepEqual(recovered.run,next);assert.equal(acceptanceAction(recovered.run.session,pending),null);
 const envelope=JSON.parse(saved(next));envelope.actions.push(envelope.actions.at(-1));assert.equal(decodeSave(JSON.stringify(envelope)).kind,'invalid');
 assert.equal(cameraStep(.016,true),1);const before=JSON.stringify(recovered.run);sceneCue(recovered.run.session,'maya');assert.equal(JSON.stringify(recovered.run),before);
});
for(const ending of ['accepted-deal','no-offers','all-withdrawn','founder-walk-away'] as const)test('integration: '+ending+' outcome reaches AI only through canonical replay, with no authority mutation',async()=>{
 let run=episode('terminal-'+ending,ending!=='no-offers');
 if(ending==='accepted-deal')run=advanceRun(run,{kind:'accept',sessionId:run.session.id,expectedRevision:3,offerId:run.session.offers[0].id});
 if(ending==='founder-walk-away')run=advanceRun(run,{kind:'walk-away',sessionId:run.session.id,expectedRevision:3});
 if(ending==='all-withdrawn')for(const offer of run.session.offers)run=advanceRun(run,{kind:'counter',sessionId:run.session.id,expectedRevision:run.session.revision,offerId:offer.id,terms:{amount:99999999999,equity:1}});
 assert.equal(run.session.outcome?.kind,ending);const before=JSON.stringify(run),request=wire(run),context=buildContext(request as Parameters<typeof buildContext>[0]);assert.ok(context);
 const result=await new ConversationBackend().run(JSON.stringify(request),{principal:'integration',signal:new AbortController().signal,mode:'scripted'});
 assert.equal(result.kind,'ready');if(result.kind==='ready'){assert.equal(result.response.provenance,'scripted');assert.equal(result.response.binding.revision,run.session.revision);}
 assert.equal(JSON.stringify(run),before);assert.deepEqual(context.session,run.session);
 const forged={...request,actions:[...run.actions,{kind:'accept',sessionId:run.session.id,expectedRevision:run.session.revision,offerId:'fabricated'}]};
 assert.equal(buildContext(forged as Parameters<typeof buildContext>[0]),null);
});

test('integration: production endpoint cannot call injected provider and invalid AI output cannot commit terms',async()=>{
 let calls=0;const run=episode(),backend=new ConversationBackend({provider:{name:'mock',model:'gpt-6.2-sol',generate:async(input)=>{calls++;return {packet:{status:'complete',text:JSON.stringify({contractVersion:1,binding:input.binding,dialogue:'I offer EUR1000 for 10%.',question:null,observations:[]})}};}}});
 const request={...wire(run),binding:{...wire(run).binding,investorId:'sofia',purpose:'answer-feedback'}};
 const denied=await createInvestorEndpoint(()=>backendMode({NODE_ENV:'production',SHARK_AI_BACKEND_MODE:'mock'}),backend)(new Request('http://localhost/api/investor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request)}));
 assert.equal(denied.status,503);assert.equal(calls,0);const before=JSON.stringify(run);
 const result=await backend.run(JSON.stringify(request),{principal:'integration',signal:new AbortController().signal,mode:'mock'});
 assert.equal(result.kind,'ready');if(result.kind==='ready')assert.equal(result.response.fallback,'invalid-output');assert.equal(calls,1);assert.equal(JSON.stringify(run),before);
});

test('integration: decimal UI previews and ownership reconcile across 36 independent boundary vectors',()=>{
 for(const amount of [1,10000000,99999999999])for(const equity of [1,1300,10000])for(const owner of [0,1,6000,10000]){
  const preview=financialPreview((amount/100).toFixed(2),(equity/100).toFixed(2),owner);assert.ok(preview.value&&preview.cap);
  // Test-only algebraic oracle; no alternative calculation service is introduced.
  const numerator=BigInt(amount)*BigInt(10000),denominator=BigInt(equity);
  const expectedPost=Number((BigInt(2)*numerator+denominator)/(BigInt(2)*denominator));
  const expectedFounder=Number((BigInt(2)*BigInt(owner)*BigInt(10000-equity)+BigInt(10000))/BigInt(20000));
  assert.equal(preview.value.postMoney,expectedPost);assert.equal(preview.value.preMoney+amount,expectedPost);
  assert.equal(preview.cap.founderAfterBps,expectedFounder);
  assert.equal(preview.cap.founderAfterBps+preview.cap.otherExistingAfterBps+preview.cap.investorBps,10000);
  assert.ok(Object.values(preview.value).every(Number.isSafeInteger));
  assert.equal(preview.cap.founderRelativeDilutionBps,owner===0?null:equity);
 }
});
