import type { Binding } from "../contracts.ts";
export type ProviderInput=Readonly<{binding:Binding;prompt:Readonly<{system:string;data:string}>;maxOutputTokens:number}>;
export type ProviderPacket = Readonly<{status:"complete"|"refusal"|"incomplete";text:string}>;
export type ProviderUsage = Readonly<{inputTokens:number;outputTokens:number}>;
export type ProviderResult = Readonly<{packet:ProviderPacket;usage:ProviderUsage}>;
export interface InvestorProvider {
  readonly kind:"mock";
  generate(input:ProviderInput,signal:AbortSignal):Promise<ProviderResult>;
}
// Live adapters are deliberately not implemented or accepted by the Phase4C runner.
