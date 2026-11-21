import { MAX_REQUEST_BYTES } from '../contracts.ts';
import { withDeadline, RequestTimeout } from '../lifecycle.ts';
import { ConversationBackend } from './backend-service.ts';
import { BodyLimitError, readBoundedBody } from './bounded-body.ts';
import type { BackendMode } from './backend-configuration.ts';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
/** The principal is selected here by the server; body/header IDs never authenticate a caller. */
export function createInvestorEndpoint(mode:()=>BackendMode,backend=new ConversationBackend()) {
  let admitted=0;
  return async(request:Request):Promise<Response>=>{
    const error=(code:string,status:number)=>Response.json({error:code},{status,headers});
    const selected=mode();
    if(selected==='disabled')return error('disabled',503);
    if(request.method!=='POST')return error('method-not-allowed',405);
    if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return error('forbidden',403);
    if(request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')return error('unsupported-media-type',415);
    if(request.headers.get('content-encoding')&&!['identity'].includes(request.headers.get('content-encoding')!))return error('invalid-request',400);
    const length=request.headers.get('content-length');
    if(length!==null&&(!/^\d+$/.test(length)||!Number.isSafeInteger(Number(length))))return error('invalid-request',400);
    if(length!==null&&Number(length)>MAX_REQUEST_BYTES)return error('too-large',413);
    if(request.signal.aborted){void request.body?.cancel().catch(()=>{});return error('cancelled',499);}
    if(admitted++>=256)return error('resource-limit',429);
    try {
      const raw=await withDeadline(signal=>readBoundedBody(request.body,MAX_REQUEST_BYTES,signal),request.signal,2000);
      const result=await backend.run(raw,{principal:'development-offline',signal:request.signal,mode:selected});
      if(result.kind==='invalid-request')return error('invalid-request',400);
      if(result.kind==='discarded')return error('discarded',409);
      return Response.json(result.response,{headers});
    }catch(e){
      if(request.signal.aborted)return error('cancelled',499);
      if(e instanceof BodyLimitError)return error(e.kind,e.kind==='too-large'?413:400);
      if(e instanceof RequestTimeout)return error('request-timeout',408);
      // No provider errors, prompts, user contents or credentials leave this boundary.
      return error('unavailable',503);
    }
  };
}
