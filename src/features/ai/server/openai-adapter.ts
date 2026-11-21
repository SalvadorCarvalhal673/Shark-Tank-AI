import { parseUniqueJson } from '../json.ts';
import { integer, record, frozenCopy } from '../schemas.ts';
import { MAX_OUTPUT_BYTES } from '../contracts.ts';
import { PROVIDER_SCHEMA } from '../validation.ts';
import type { ProviderInput, ProviderUsage } from './provider.ts';
import { ServerCredential } from './configuration.ts';
import { ProviderFault, type BackendProvider } from './backend-provider.ts';
import { readBoundedBody } from './bounded-body.ts';
/** Explicit dependency injection only. There is intentionally NO default fetch transport. */
export type ProviderExchange=(url:string,init:Readonly<{method:'POST';headers:Readonly<Record<string,string>>;body:string;signal:AbortSignal}>)=>Promise<Response>;
export class OpenAIResponseAdapter implements BackendProvider {
  readonly name='openai' as const;
  readonly model='gpt-6.2-sol' as const;
  #credential:ServerCredential; #exchange:ProviderExchange;
  constructor(credential:ServerCredential,exchange:ProviderExchange){this.#credential=credential;this.#exchange=exchange;}
  async generate(input:ProviderInput,signal:AbortSignal):Promise<{packet:unknown;usage?:ProviderUsage}> {
    signal.throwIfAborted();
    const body=JSON.stringify({model:this.model,instructions:input.prompt.system,input:input.prompt.data,
      max_output_tokens:input.maxOutputTokens,store:false,stream:false,tools:[],
      text:{format:{type:'json_schema',name:'investor_response',strict:true,schema:PROVIDER_SCHEMA}}});
    let response:Response;
    try {response=await this.#credential.use(key=>this.#exchange('https://api.openai.com/v1/responses',{
      method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+key},body,signal}));}
    catch {throw new ProviderFault('network');}
    signal.throwIfAborted();
    if(!response.ok){void response.body?.cancel().catch(()=>{});throw new ProviderFault(response.status===429?'rate-limit':'network');}
    let v:unknown;
    try {v=parseUniqueJson(await readBoundedBody(response.body,65536,signal));} catch {throw new ProviderFault('invalid-output');}
    if(!record(v)||v.model!==this.model||!Array.isArray(v.output)||v.output.length>4)throw new ProviderFault('invalid-output');
    if(v.status==='incomplete')return {packet:{status:'incomplete',text:''}};
    if(v.status!=='completed')throw new ProviderFault('invalid-output');
    const messages=v.output.filter(item=>record(item)&&item.type==='message');
    if(v.output.some(item=>!record(item)||!['message','reasoning'].includes(String(item.type)))||messages.length!==1)
      throw new ProviderFault('invalid-output');
    const message=messages[0];
    if(!record(message)||message.role!=='assistant'||message.status!=='completed'||!Array.isArray(message.content)||message.content.length!==1)
      throw new ProviderFault('invalid-output');
    const content=message.content[0];
    if(!record(content))throw new ProviderFault('invalid-output');
    if(content.type==='refusal')return {packet:{status:'refusal',text:''}};
    if(content.type!=='output_text'||typeof content.text!=='string'||new TextEncoder().encode(content.text).length>MAX_OUTPUT_BYTES)
      throw new ProviderFault('invalid-output');
    const usage=record(v.usage)&&integer(v.usage.input_tokens)&&integer(v.usage.output_tokens)
      ?{inputTokens:v.usage.input_tokens,outputTokens:v.usage.output_tokens}:undefined;
    return frozenCopy({packet:{status:'complete',text:content.text},...(usage?{usage}:{})});
  }
}
