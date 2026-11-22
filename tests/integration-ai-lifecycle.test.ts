import test from 'node:test';
import assert from 'node:assert/strict';
import { RequestLifecycle } from '../src/features/ai/lifecycle.ts';
import { request } from './fixtures/ai/request.ts';
const view=()=>({sessionId:request().binding.sessionId,revision:0,investorId:'maya' as const,mode:'html',recoveryId:'fresh'});

test('integration: reentrant provider abort preserves newest AI request and ordered identities',()=>{
 const l=new RequestLifecycle();l.setContext(view());const a=request().binding,b={...a,requestId:'middle'},c={...a,requestId:'newest'};
 const first=l.begin(a)!;const result:{signal:AbortSignal|null}={signal:null};
 first.addEventListener('abort',()=>{result.signal=l.begin(c);},{once:true});
 assert.equal(l.begin(b),null);assert.ok(result.signal);assert.equal(result.signal.aborted,false);
 assert.equal(l.consume(c),true);assert.equal(l.consume(b),false);
 assert.deepEqual(l.drainEvents().map(e=>[e.kind,e.binding.requestId]),[
  ['request-started',a.requestId],['request-cancelled',a.requestId],['request-started','middle'],['request-cancelled','middle'],['request-started','newest'],['dialogue-ready','newest']]);
});
test('integration: context publishes before abort handlers, rejecting old view work',()=>{
 const l=new RequestLifecycle();l.setContext(view());const a=request().binding,signal=l.begin(a)!;
 let accepted=false;
 signal.addEventListener('abort',()=>{accepted=l.begin({...a,epoch:l.epoch,requestId:'obsolete'})!==null;},{once:true});
 l.setContext({...view(),revision:1});assert.equal(accepted,false);
 assert.equal(l.consume({...a,epoch:l.epoch,requestId:'obsolete'}),false);
});
test('integration: disposal cannot leave a reentrantly created AI request alive',()=>{
 const l=new RequestLifecycle();l.setContext(view());const a=request().binding,signal=l.begin(a)!;
 let created:AbortSignal|null=null;signal.addEventListener('abort',()=>{created=l.begin({...a,epoch:l.epoch,requestId:'after-dispose'});});
 l.dispose();assert.equal(created,null);assert.equal(l.begin({...a,epoch:l.epoch,requestId:'late'}),null);
});
