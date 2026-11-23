import { createHash } from 'node:crypto';
import type { Binding } from '../contracts.ts';
import { frozenCopy, id, sameBinding } from '../schemas.ts';
type Ticket = Readonly<{binding: Binding; signal: AbortSignal; current: () => boolean; finish: () => void}>;
type Checkpoint = Readonly<{pitch:string;actions:readonly string[]}>;
type Slot = {binding: Binding; controller: AbortController; delivered: boolean; checkpoint:Checkpoint};
export function fingerprint(value:unknown):string { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
/** Process-local request ordering, NOT authentication or authoritative game state. */
export class BackendCoordinator {
  #slots = new Map<string, Slot>();
  #seen = new Set<string>();
  begin(principal: string, binding: Binding, checkpoint:Checkpoint): Ticket | null {
    if (!id(principal)) return null;
    const key = principal + ':' + binding.sessionId, requestKey = key + ':' + binding.requestId;
    const previous = this.#slots.get(key);
    if (this.#seen.has(requestKey) || this.#seen.size >= 128 ||
      (!previous && this.#slots.size >= 64) ||
      (previous && (binding.revision < previous.binding.revision || binding.epoch < previous.binding.epoch || checkpoint.pitch !== previous.checkpoint.pitch ||
        previous.checkpoint.actions.length > checkpoint.actions.length ||
        previous.checkpoint.actions.some((hash,index)=>hash !== checkpoint.actions[index])))) return null;
    const slot: Slot = {binding: frozenCopy(binding), controller: new AbortController(), delivered: false, checkpoint:frozenCopy(checkpoint)};
    this.#slots.set(key, slot); this.#seen.add(requestKey);
    // Publish before abort dispatch: listeners can synchronously begin a newer request.
    previous?.controller.abort();
    if (this.#slots.get(key) !== slot || slot.controller.signal.aborted) return null;
    const current = () => this.#slots.get(key) === slot && !slot.controller.signal.aborted && !slot.delivered && sameBinding(slot.binding,binding);
    return {binding: slot.binding, signal: slot.controller.signal, current,
      finish: () => { if (this.#slots.get(key) === slot) slot.delivered = true; }};
  }
  /** Future trusted controller integration must call this on recovery/revocation/restart. */
  cancel(principal: string, sessionId: string): void { this.#slots.get(principal + ':' + sessionId)?.controller.abort(); }
}
