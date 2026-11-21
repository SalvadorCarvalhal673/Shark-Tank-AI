import type { Model } from '../costs.ts';
import type { Consent } from '../contracts.ts';
import type { ProviderInput, ProviderUsage } from './provider.ts';
/** A stable port for vendor adapters. It never authorizes external transmission. */
export interface BackendProvider {
  readonly name: Consent['provider'] | 'mock';
  readonly model: Model;
  generate(input: ProviderInput, signal: AbortSignal): Promise<{packet: unknown; usage?: ProviderUsage}>;
}
export class ProviderFault extends Error {
  readonly category: 'network' | 'rate-limit' | 'invalid-output';
  constructor(category: ProviderFault['category']) { super('Investor provider unavailable'); this.category = category; }
}

/** Explicit registry lookup, never automatic cross-provider failover. */
export function selectBackendProvider(provider:Consent['provider'],model:Model,adapters:readonly BackendProvider[]):BackendProvider|null {
  const matches=adapters.filter(adapter=>adapter.name===provider&&adapter.model===model);
  return matches.length===1?matches[0]:null;
}
