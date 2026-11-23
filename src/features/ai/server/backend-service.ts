import { canonicalAction } from '../../simulation/negotiation/session-storage.ts';
import type { AppResponse, Failure } from '../contracts.ts';
import { buildContext } from '../context.ts';
import { parseRequest, frozenCopy } from '../schemas.ts';
import { buildPrompt } from '../prompts.ts';
import { minimizeContext, prepareTransmission } from '../privacy.ts';
import { scriptedFallback } from '../fallback.ts';
import { validateProvider, PROVIDER_SCHEMA } from '../validation.ts';
import { parseAppResponse } from '../response.ts';
import { withDeadline, RequestTimeout } from '../lifecycle.ts';
import { BudgetController } from '../budgets.ts';
import { MockProvider } from './mock-provider.ts';
import type { ProviderUsage } from './provider.ts';
import { ProviderFault, type BackendProvider } from './backend-provider.ts';
import { BackendCoordinator, fingerprint } from './backend-coordinator.ts';
export type BackendResult = {kind:'ready';response:AppResponse} | {kind:'invalid-request'} | {kind:'discarded'};
export class ConversationBackend {
  readonly budget: BudgetController;
  readonly coordinator = new BackendCoordinator();
  #provider: BackendProvider;
  constructor(options: {budget?: BudgetController; provider?: BackendProvider} = {}) {
    this.budget = options.budget ?? new BudgetController();
    this.#provider = options.provider ?? {name:'mock',model:this.budget.limits.model,generate:(input,signal)=>new MockProvider().generate(input,signal)};
    if (this.#provider.model !== this.budget.limits.model) throw new RangeError('Provider budget model mismatch');
  }
  async run(raw:string, options:{principal:string;signal:AbortSignal;mode?:'scripted'|'mock'}):Promise<BackendResult> {
    const request = parseRequest(raw), context = request && buildContext(request);
    if (!context) return {kind:'invalid-request'};
    if (options.signal.aborted) return {kind:'discarded'};
    const ticket = this.coordinator.begin(options.principal,request!.binding,{pitch:fingerprint(context.session.pitch),actions:request!.actions.map(action=>fingerprint(canonicalAction(action)))});
    if (!ticket) return {kind:'discarded'};
    const signal = AbortSignal.any([ticket.signal,options.signal]);
    const minimized = minimizeContext(context);
    const outputContext = frozenCopy({...context,sources:minimized.sources});
    const deliver = (response:AppResponse):BackendResult => {
      if (signal.aborted || !ticket.current()) return {kind:'discarded'};
      const checked = parseAppResponse(JSON.stringify(response),outputContext);
      ticket.finish(); return checked ? {kind:'ready',response:checked} : {kind:'discarded'};
    };
    const fallback = (reason:Failure) => deliver(scriptedFallback(context,reason));
    if ((options.mode ?? 'scripted') === 'scripted') return fallback('missing-credentials');
    if (this.#provider.name !== 'mock' && !prepareTransmission(context,request!.consent,this.#provider.name)) return fallback('no-consent');
    const prompt = frozenCopy({...buildPrompt(context),data:JSON.stringify(minimized)});
    const inputTokens = new TextEncoder().encode(prompt.system+prompt.data+JSON.stringify(PROVIDER_SCHEMA)).length + 1024;
    const reserve = this.budget.reserve(options.principal,request!.binding.sessionId,request!.binding.requestId,
      inputTokens,this.budget.limits.maxOutputTokens);
    if (!reserve.ok) return reserve.reason === 'duplicate' ? {kind:'discarded'} : fallback('budget');
    let usage: ProviderUsage | undefined;
    // Charge unknown usage conservatively on cancellation; only this owned lease is settled.
    const cancelled = () => { this.budget.finish(reserve.lease); };
    signal.addEventListener('abort',cancelled,{once:true});
    try {
      const result = await withDeadline(s=>this.#provider.generate(frozenCopy({binding:request!.binding,prompt,
        maxOutputTokens:this.budget.limits.maxOutputTokens}),s),signal,this.budget.limits.deadlineMs);
      usage = result.usage;
      const validated = validateProvider(result.packet,outputContext);
      if (!validated.ok) return fallback(validated.reason);
      return deliver(frozenCopy({...validated.value,
        provenance:this.#provider.name === 'mock' ? 'mock' : 'ai',fallback:null,
        limitations:[this.#provider.name === 'mock' ? 'Synthetic mock dialogue; no model inference.' : 'Untrusted nonbinding provider dialogue.',
          'Founder information is unverified.']}));
    } catch (error) {
      if (signal.aborted || !ticket.current()) return {kind:'discarded'};
      return fallback(error instanceof RequestTimeout ? 'timeout' : error instanceof ProviderFault ?
        error.category === 'rate-limit' ? 'budget' : error.category : 'network');
    } finally {
      signal.removeEventListener('abort',cancelled); this.budget.finish(reserve.lease,usage);
    }
  }
}
