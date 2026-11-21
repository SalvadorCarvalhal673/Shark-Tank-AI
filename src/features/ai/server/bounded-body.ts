export class BodyLimitError extends Error {
  readonly kind: 'too-large' | 'invalid-body';
  constructor(kind:BodyLimitError['kind']) { super('Invalid bounded body'); this.kind=kind; }
}
/** Stream byte bound precedes decoding/parsing; cancellation never awaits an untrusted source. */
export async function readBoundedBody(body:ReadableStream<Uint8Array>|null,limit:number,signal:AbortSignal):Promise<string> {
  if (!body) throw new BodyLimitError('invalid-body');
  signal.throwIfAborted();
  const reader=body.getReader(),bytes=new Uint8Array(limit); let size=0,chunks=0;
  const cancel=()=>{void reader.cancel().catch(()=>{});};
  signal.addEventListener('abort',cancel,{once:true});
  try {
    for (;;) {
      signal.throwIfAborted(); const next=await reader.read(); signal.throwIfAborted();
      if (next.done) break;
      if (!(next.value instanceof Uint8Array)) throw new BodyLimitError('invalid-body');
      if (++chunks > limit + 1) {cancel();throw new BodyLimitError('invalid-body');}
      size+=next.value.byteLength;
      if(size>limit) {cancel();throw new BodyLimitError('too-large');}
      bytes.set(next.value,size-next.value.byteLength);
    }

    try {return new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(0,size));} catch {throw new BodyLimitError('invalid-body');}
  } catch(error) {cancel();throw error;} finally {signal.removeEventListener('abort',cancel);reader.releaseLock();}
}
