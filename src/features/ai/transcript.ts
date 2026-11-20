import { bounded,exact,frozenCopy,id,integer,validBinding } from "./schemas.ts";
import type { Binding,Failure } from "./contracts.ts";
export type TranscriptCheckpoint=Readonly<{sessionId:string;revision:number;journalDigest:string}>;
export type TranscriptEntry=Readonly<{
  binding:Binding;text:string;provenance:"mock"|"ai"|"scripted";fallback:Failure|null;
  model:string|null;promptVersion:string;
}>;
export type TranscriptDraft=Readonly<{
  transcriptVersion:1;contractVersion:1;rulesVersion:1;storageConsentVersion:1;
  checkpoint:TranscriptCheckpoint;entries:readonly TranscriptEntry[];
}>;
export type TranscriptCompatibility=
  | {kind:"compatible";value:TranscriptDraft}
  | {kind:"invalid"|"incompatible"|"checkpoint-mismatch"};
/** Read-only future format evaluator. No storage reads/writes, keys, migration or deletion. */
export function inspectTranscript(raw:string,expected:TranscriptCheckpoint):TranscriptCompatibility{
  if(!id(expected.sessionId)||!integer(expected.revision,7)||!/^[a-f0-9]{64}$/.test(expected.journalDigest))
    return {kind:"checkpoint-mismatch"};
  if(typeof raw!=="string"||new TextEncoder().encode(raw).length>65536)return {kind:"invalid"};
  let v:unknown;try{v=JSON.parse(raw);}catch{return {kind:"invalid"};}
  if(!exact(v,["transcriptVersion","contractVersion","rulesVersion","storageConsentVersion","checkpoint","entries"]))
    return {kind:"invalid"};
  if(v.transcriptVersion!==1||v.contractVersion!==1||v.rulesVersion!==1||v.storageConsentVersion!==1)
    return {kind:"incompatible"};
  if(!exact(v.checkpoint,["sessionId","revision","journalDigest"])||v.checkpoint.sessionId!==expected.sessionId||
    v.checkpoint.revision!==expected.revision||v.checkpoint.journalDigest!==expected.journalDigest)
    return {kind:"checkpoint-mismatch"};
  if(!Array.isArray(v.entries)||v.entries.length>24)return {kind:"invalid"};
  const seen=new Set<string>();let revision=0;
  for(const e of v.entries){
    if(!exact(e,["binding","text","provenance","fallback","model","promptVersion"])||!validBinding(e.binding)||
      e.binding.sessionId!==expected.sessionId||e.binding.revision>expected.revision||e.binding.revision<revision||
      seen.has(e.binding.requestId)||!bounded(e.text,600)||!["mock","ai","scripted"].includes(String(e.provenance))||
      !(e.model===null||bounded(e.model,80))||!bounded(e.promptVersion,80)||
      (e.provenance==="scripted"?!["missing-credentials","timeout","refusal","network","invalid-output","budget","no-consent","cancelled"].includes(String(e.fallback)):e.fallback!==null)||
      (e.provenance==="ai"&&e.model===null))return {kind:"invalid"};
    revision=e.binding.revision;seen.add(e.binding.requestId);
  }
  return {kind:"compatible",value:frozenCopy(v as TranscriptDraft)};
}
