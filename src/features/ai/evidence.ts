import type { Binding, Source } from "./contracts.ts";
import { bounded, exact, frozenCopy, id, integer, sameBinding, validBinding } from "./schemas.ts";
export type EvidenceItem = Readonly<{
  id:string; metric:"revenue"|"operating-expenses"; valueMinor:number|null;
  currency:"EUR"|"USD"|"GBP"|null; period:"month"|"year"|null;
  basis:"supplied"|"inferred"; quote:string; start:number; end:number;
  status:"proposed"|"ambiguous"|"negated"; notes:readonly string[];
}>;
export type EvidenceProposal = Readonly<{
  version:1; binding:Binding; source:Source; items:readonly EvidenceItem[];
}>;
function money(text:string): number|null {
  let value=text.replace(/[\s\u00a0]/g,"");
  if(/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(value)) value=value.replaceAll(",","");
  else if(/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(value)) value=value.replaceAll(".","").replace(",",".");
  else if(/^\d+([.,]\d{1,2})?$/.test(value)) value=value.replace(",",".");
  else return null;
  const [whole,decimal=""]=value.split(".");
  const units=Number(whole)*100+Number(decimal.padEnd(2,"0"));
  return Number.isSafeInteger(units)&&units>=0&&units<=99999999999?units:null;
}
/** Deliberately bounded synthetic extractor, NOT a production language-understanding service. */
export function mockExtract(source:Source,binding:Binding): EvidenceProposal {
  if(!bounded(source.text,1500)||!id(source.id.replaceAll(":","_"))||!validBinding(binding))
    throw new RangeError("Invalid evidence source");
  const items:EvidenceItem[]=[];
  // Currency is mandatory: dates and unrelated counts cannot become money.
  const pattern=/(€|£|\$|EUR|USD|GBP)\s*(\d[\d., ]{0,23}\d|\d)(?![\dA-Za-z]|[.,]\d)/g;
  for(const match of source.text.matchAll(pattern)){
    if(items.length===4) break;
    const start=match.index!, end=start+match[0].length;
    const prefix=source.text.slice(Math.max(0,start-100),start).split(/[.;!?]/).at(-1)!;
    const local=(prefix+" "+source.text.slice(end,end+70).split(/[.;!?]/)[0]).toLowerCase();
    const expense=/\b(?:spend|expenses|operating costs|costs)\b/.test(prefix.toLowerCase());
    const revenue=/\b(?:revenue|generate|sales)\b/.test(prefix.toLowerCase());
    if(!expense&&!revenue)continue;
    const negated=/\b(?:not|no|never|don't|isn't|without)\b/i.test(prefix);
    const period=/\b(?:month|monthly)\b/i.test(local)?"month":/\b(?:year|annual|annually)\b/i.test(local)?"year":null;
    const currency=match[1]==="€"||match[1]==="EUR"?"EUR":match[1]==="£"||match[1]==="GBP"?"GBP":match[1]==="USD"?"USD":null;
    const signedOrRange=/-\s*$/.test(prefix)||/^\s*[-–]\s*\d/.test(source.text.slice(end))||/\b(?:between|at least|up to|more than|less than)\b/i.test(prefix);
    const valueMinor=signedOrRange?null:money(match[2]);
    const corrected=/\b(?:actually|correction|corrected|rather|instead)\b/i.test(prefix);
    items.push({id:"item-"+items.length,metric:expense?"operating-expenses":"revenue",valueMinor,currency,period,
      basis:/\b(?:revenue|expenses|operating costs)\b/i.test(prefix)?"supplied":"inferred",
      quote:match[0],start,end,status:negated?"negated":(!currency||!period||valueMinor===null||corrected?"ambiguous":"proposed"),
      notes:[...(signedOrRange?["Signed or ranged figure requires correction."]:[]),...(!currency?["Currency requires confirmation."]:[]),...(!period?["Period requires confirmation."]:[]),
        ...(corrected?["Correction: explicitly select the current claim."]:[]),
        ...(/\b(?:around|approximately|about)\b/i.test(prefix)?["Approximate founder report."]:[])]});
  }
  const conflicts=items.some((a,i)=>items.some((b,j)=>j>i&&a.metric===b.metric&&a.valueMinor!==b.valueMinor));
  return frozenCopy({version:1,binding,source,items:conflicts?items.map(i=>({...i,status:i.status==="negated"?"negated":"ambiguous",
    notes:[...i.notes,"Conflicting claims require founder resolution."]})):items});
}
export function validProposal(v:unknown,source:Source,binding:Binding): v is EvidenceProposal {
  if(!exact(v,["version","binding","source","items"])||v.version!==1||!validBinding(v.binding)||!sameBinding(v.binding,binding)||
    !exact(v.source,["id","text","provenance"])||v.source.id!==source.id||v.source.text!==source.text||
    v.source.provenance!=="founder-reported"||!Array.isArray(v.items)||v.items.length>4) return false;
  if(!bounded(source.text,1500)||!validBinding(binding))return false;
  const expected=mockExtract(source,binding).items;
  const ids=new Set();
  return v.items.every(i=>{
    if(!exact(i,["id","metric","valueMinor","currency","period","basis","quote","start","end","status","notes"])||
      !id(i.id)||ids.has(i.id)||!["revenue","operating-expenses"].includes(String(i.metric))||
      !(i.valueMinor===null||integer(i.valueMinor,99999999999))||![null,"EUR","USD","GBP"].includes(i.currency as null)||
      ![null,"month","year"].includes(i.period as null)||!["supplied","inferred"].includes(String(i.basis))||
      !bounded(i.quote,240)||!integer(i.start,source.text.length)||!integer(i.end,source.text.length)||
      i.end<=i.start||source.text.slice(i.start,i.end)!==i.quote||
      !["proposed","ambiguous","negated"].includes(String(i.status))||!Array.isArray(i.notes)||i.notes.length>4||
      !i.notes.every(n=>bounded(n,120)))return false;
    const canonical=expected.find(e=>e.id===i.id&&e.start===i.start&&e.end===i.end);
    if(!canonical||["metric","valueMinor","currency","period","basis","status"].some(k=>canonical[k as keyof EvidenceItem]!==i[k]))return false;
    ids.add(i.id);return true;
  });
}
export type EvidenceConfirmation = Readonly<{
  version:1; binding:Binding; source:Source; item:EvidenceItem;
  decision:"confirmed"|"corrected"|"rejected"; correction:string|null;
  provenance:"founder-confirmed-unverified";
}>;
export function confirmEvidence(proposal:EvidenceProposal,source:Source,binding:Binding,itemId:string,
  decision:"confirmed"|"corrected"|"rejected",correction:string|null=null): EvidenceConfirmation|null {
  if(!validProposal(proposal,source,binding)||!["confirmed","corrected","rejected"].includes(decision))return null;
  const item=proposal.items.find(i=>i.id===itemId);
  if(!item||(decision==="confirmed"&&(item.status!=="proposed"||item.valueMinor===null||!item.currency||!item.period))||
    (decision==="corrected"?!bounded(correction,500):correction!==null)) return null;
  // Corrections preserve the original item/statement and require fresh extraction/confirmation.
  return frozenCopy({version:1,binding,source,item,decision,correction,provenance:"founder-confirmed-unverified"});
}
