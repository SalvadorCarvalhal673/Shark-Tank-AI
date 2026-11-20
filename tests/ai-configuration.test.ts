import test from "node:test";
import assert from "node:assert/strict";
import { loadConfiguration } from "../src/features/ai/server/configuration.ts";
test("AI missing configuration never prevents scripted application setup",()=>{
  assert.deepEqual(loadConfiguration({}),{mode:"scripted",reason:"disabled"});
  assert.deepEqual(loadConfiguration({SHARK_AI_MODE:"mock"}),{mode:"mock"});
  assert.deepEqual(loadConfiguration({SHARK_AI_MODE:"live"}),{mode:"scripted",reason:"missing-credentials"});
});
test("AI configuration rejects public keys, placeholders, unknown models and provider mismatches",()=>{
  for(const env of [{NEXT_PUBLIC_OPENAI_API_KEY:"fictional"},{SHARK_AI_MODE:"live",SHARK_AI_API_KEY:"replace-me-placeholder"},
    {SHARK_AI_MODE:"live",SHARK_AI_MODEL:"unknown"},{SHARK_AI_MODE:"live",SHARK_AI_PROVIDER:"google",SHARK_AI_MODEL:"gpt-6.2-sol"}])
    assert.equal(loadConfiguration(env).mode,"scripted");
});
test("AI server credential serializes redacted and is only accessed through explicit server capability",()=>{
  const secret=["synthetic","credential","fixture"].join("-");
  const c=loadConfiguration({SHARK_AI_MODE:"live",SHARK_AI_API_KEY:secret});
  assert.equal(c.mode,"configured");
  if(c.mode==="configured"){
    assert.equal(JSON.stringify(c).includes(secret),false);
    assert.equal(String(c.credential),"[REDACTED]");
    assert.equal(c.credential.use(v=>v.length),secret.length);
  }
});
