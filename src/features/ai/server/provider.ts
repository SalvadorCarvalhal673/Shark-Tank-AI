import type { ConversationContext } from "../context.ts";
export type ProviderPacket = Readonly<{status:"complete"|"refusal"|"incomplete";text:string}>;
export type ProviderUsage = Readonly<{inputTokens:number;outputTokens:number}>;
export type ProviderResult = Readonly<{packet:ProviderPacket;usage:ProviderUsage}>;
export interface InvestorProvider {
  readonly kind:"mock";
  generate(context:ConversationContext,signal:AbortSignal):Promise<ProviderResult>;
}
// Live adapters are deliberately not implemented or accepted by the Phase4C runner.
