import type { BrowserRequest } from "../../../src/features/ai/contracts.ts";
export function request(): BrowserRequest {
  return {
    contractVersion:1,rulesVersion:1,
    binding:{sessionId:"fictional-run",revision:0,requestId:"request-1",epoch:0,investorId:"maya",purpose:"question"},
    pitch:{startup:"LunchLoop",pitch:"Reusable lunch containers for campus cafes, with local washing and return points.",
      currency:"EUR",amount:10000000,equity:1000,founderOwnershipBps:6000},
    actions:[],history:[],consent:null,
  };
}
