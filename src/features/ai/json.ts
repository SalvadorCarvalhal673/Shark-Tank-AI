/** Parse bounded JSON without silently accepting duplicate object keys.
 * JSON.parse validates grammar; the token pass compares decoded names per object.
 * Callers enforce their own byte bound before invoking this function.
 */
export function parseUniqueJson(raw:string):unknown {
  const value:unknown=JSON.parse(raw);
  const stack:{keys:Set<string>|null;keyExpected:boolean}[]=[];
  const tokens=/"(?:\\[\s\S]|[^"\\])*"|[{}\[\],:]/g;
  for(const match of raw.matchAll(tokens)){
    const token=match[0],frame=stack.at(-1);
    if(token==='{'||token==='['){
      if(stack.length>=32)throw new SyntaxError("JSON nesting limit exceeded");
      stack.push({keys:token==='{'?new Set():null,keyExpected:true});
    }else if(token==='}'||token===']')stack.pop();
    else if(token===','&&frame)frame.keyExpected=true;
    else if(token===':'&&frame)frame.keyExpected=false;
    else if(token.startsWith('"')&&frame?.keys&&frame.keyExpected){
      const key:string=JSON.parse(token);
      if(frame.keys.has(key))throw new SyntaxError("Duplicate JSON key");
      frame.keys.add(key);frame.keyExpected=false;
    }
  }
  return value;
}
