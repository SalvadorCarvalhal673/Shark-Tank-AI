import test from "node:test";
import assert from "node:assert/strict";
import { inspectTranscript } from "../src/features/ai/transcript.ts";
import { request } from "./fixtures/ai/request.ts";
const checkpoint={sessionId:request().binding.sessionId,revision:0,journalDigest:"a".repeat(64)};
const draft={transcriptVersion:1,contractVersion:1,rulesVersion:1,storageConsentVersion:1,checkpoint,
  entries:[{binding:request().binding,text:"A fictional investor response.",provenance:"mock",fallback:null,model:null,promptVersion:"investors-1"}]};
test("AI future transcript compatibility retains provenance but performs no storage operation",()=>{
  const r=inspectTranscript(JSON.stringify(draft),checkpoint);assert.equal(r.kind,"compatible");
  if(r.kind==="compatible")assert.ok(Object.isFrozen(r.value.entries));
});
test("AI transcript rejects corruption, newer versions, wrong checkpoint and duplicate entries",()=>{
  assert.equal(inspectTranscript("{",checkpoint).kind,"invalid");
  assert.equal(inspectTranscript(JSON.stringify({...draft,transcriptVersion:2}),checkpoint).kind,"incompatible");
  assert.equal(inspectTranscript(JSON.stringify(draft),{...checkpoint,journalDigest:"b".repeat(64)}).kind,"checkpoint-mismatch");
  assert.equal(inspectTranscript(JSON.stringify({...draft,entries:[...draft.entries,...draft.entries]}),checkpoint).kind,"invalid");
  assert.equal(inspectTranscript(JSON.stringify({...draft,secret:"forbidden"}),checkpoint).kind,"invalid");
});
