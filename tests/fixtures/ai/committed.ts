import { request } from "./request.ts";
import { createRun,advanceRun } from "../../../src/features/simulation/negotiation/session-storage.ts";
export function committedRequest(){
  const r=request();let run=createRun(r.binding.sessionId,r.pitch)!;
  const answers=["Revenue: 9000. Runway: 8 months. Use of funds: washing equipment and cafe onboarding.",
    "Target segment: campus cafes. Acquisition channel: student societies. CAC: 30.",
    "Customer evidence: cafe managers requested return points. Milestone: test a library return station."];
  answers.forEach((text,turn)=>{run=advanceRun(run,{kind:"answer",sessionId:run.session.id,expectedRevision:run.session.revision,turn,text});});
  return {run,request:{...r,actions:run.actions,binding:{...r.binding,revision:3,investorId:"sofia" as const,purpose:"answer-feedback" as const}}};
}
