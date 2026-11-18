import { readTerms } from "../simulation/pitch.ts";
import { ownershipAfterInvestment, valuations } from "../simulation/negotiation/financials.ts";
import type { NegotiationPitch, NegotiationSession } from "../simulation/negotiation/session.ts";
import type { InvestorId } from "../simulation/negotiation/investor-policy.ts";

export type CameraView = "panel" | InvestorId;
export type Pose = "Listening" | "Offering" | "Withdrawal";
export const cameraPresets = {
  panel: { position: [0,3.1,9.2], target: [0,1.45,.1] },
  maya: { position: [-2.5,2.5,5.1], target: [-2.5,1.75,0] },
  adrian: { position: [0,2.5,5.1], target: [0,1.75,0] },
  sofia: { position: [2.5,2.5,5.1], target: [2.5,1.75,0] },
} as const;
export function cameraStep(deltaSeconds: number, reducedMotion: boolean) {
  return reducedMotion ? 1 : 1-Math.exp(-Math.min(Math.max(deltaSeconds,0),.05)*7);
}
export function sceneCue(session: NegotiationSession | null, investor: InvestorId): { pose: Pose; key: string } {
  if (!session) return {pose:"Listening",key:"idle"};
  const event = session.history.findLast(item =>
    (item.kind==="opening" || item.kind==="counter") && item.investor===investor);
  const pose: Pose = !event ? "Listening" :
    (event.kind==="opening" && event.decision==="pass") ||
    (event.kind==="counter" && event.decision==="withdraw") ? "Withdrawal" : "Offering";
  return {pose,key:session.id+":"+ (event?.revision ?? 0)+":"+investor+":"+pose};
}
export function financialPreview(amount: string, equity: string, founderBeforeBps: number) {
  const data = new FormData(); data.set("amount",amount); data.set("equity",equity);
  const terms=readTerms(data);
  if(typeof terms==="string") return {error:terms};
  const value=valuations(terms), cap=ownershipAfterInvestment(founderBeforeBps,terms.equity);
  if(!value || !cap) return {error:"These terms cannot be previewed."};
  return {terms,value,cap};
}
export const demonstrationPitch: NegotiationPitch = {
 startup:"LunchLoop", pitch:"LunchLoop connects campus kitchens with students who want affordable lunches, using advance orders to reduce waste.",
 currency:"EUR", amount:10000000,equity:2000,founderOwnershipBps:8000,
};
export const demonstrationAnswers = [
 "Revenue: €9,000. Runway: 8 months. Use of funds: campus kitchen onboarding and customer acquisition.",
 "Target segment: university students buying lunch. Acquisition channel: campus ambassadors. CAC: €12.",
 "Customer evidence: students requested repeat weekly lunch orders. Milestone: deliver 500 lunches across three campuses.",
];
