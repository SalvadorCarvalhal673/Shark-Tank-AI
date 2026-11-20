export type EvaluationSample=Readonly<{
  durationMs:number;inputTokens:number;outputTokens:number;costNano:bigint;
  schemaValid:boolean;financialConsistent:boolean;grounded:boolean;fallback:boolean;
}>;
export function summarizeEvaluation(samples:readonly EvaluationSample[]){
  if(!samples.length||samples.length>10000)throw new RangeError("Invalid sample count");
  for(const s of samples)if(!Number.isFinite(s.durationMs)||s.durationMs<0||
    ![s.inputTokens,s.outputTokens].every(n=>Number.isSafeInteger(n)&&n>=0)||typeof s.costNano!=="bigint"||s.costNano<BigInt(0)||
    ![s.schemaValid,s.financialConsistent,s.grounded,s.fallback].every(v=>typeof v==="boolean"))
    throw new RangeError("Invalid evaluation sample");
  const times=samples.map(s=>s.durationMs).sort((a,b)=>a-b);
  const percentile=(p:number)=>times[Math.ceil(times.length*p)-1];
  const rate=(key:"schemaValid"|"financialConsistent"|"grounded"|"fallback")=>samples.filter(s=>s[key]).length/samples.length;
  return Object.freeze({count:samples.length,p50Ms:percentile(.5),p95Ms:percentile(.95),
    schemaValidRate:rate("schemaValid"),financialConsistentRate:rate("financialConsistent"),
    groundedRate:rate("grounded"),fallbackRate:rate("fallback"),
    inputTokens:samples.reduce((a,s)=>a+s.inputTokens,0),outputTokens:samples.reduce((a,s)=>a+s.outputTokens,0),
    costNano:samples.reduce((a,s)=>a+s.costNano,BigInt(0))});
}
