import fs from 'node:fs';import path from 'node:path';
const dir='docs/estadisticas-v1/p03-f1';
const stats=values=>{const sorted=[...values].sort((a,b)=>a-b),mean=values.reduce((a,b)=>a+b,0)/values.length;return {repetitions:values.length,p50:sorted[Math.ceil(values.length*.5)-1],p95:sorted[Math.ceil(values.length*.95)-1],min:sorted[0],max:sorted.at(-1),mean,stdPopulation:Math.sqrt(values.reduce((a,b)=>a+(b-mean)**2,0)/values.length),method:'nearest-rank; with five repetitions p95 is the sample maximum, not a robust population estimate'};};
const runs=[];
for(const folder of [dir,path.join(dir,'profile'),path.join(dir,'shapes')]){
 if(!fs.existsSync(folder))continue;
 for(const file of fs.readdirSync(folder).filter(p=>/^volume-\d+\.json$/.test(p))){
  const run=JSON.parse(fs.readFileSync(path.join(folder,file)));const measurements=run.measurements??[];
  const result={dataset:folder.endsWith('profile')?'instrumented profiling':folder.endsWith('shapes')?'two businesses, night session, reopened, mixed composition and reconciliation, last_30_days':'one business, one line, today',orders:run.orders,status:run.status,elapsedMs:run.elapsedMs,warmups:measurements.filter(m=>m.label.endsWith(':warmup')).map(m=>({rpc:m.label.split(':')[0],executionMs:m.executionMs})),samples:[],resourceBefore:run.resourceBefore,resourceAfter:run.resourceAfter,timeout:run.error??null,cleanup:'Counts equal empty baseline after connection closes; explicit rollback when successful, automatic rollback on error'};
  for(const rpc of ['legacy','extended'])for(const mode of ['default','jit_off']){
   const selected=measurements.filter(m=>mode==='default'?new RegExp(`^${rpc}:[1-5]$`).test(m.label):new RegExp(`^${rpc}:jit_off:[1-3]$`).test(m.label));
   if(selected.length){const summary=stats(selected.map(m=>m.executionMs));const expected=mode==='default'?5:3;result.samples.push({rpc,mode,valuesMs:selected.map(m=>m.executionMs),...summary,p95:selected.length===expected?summary.p95:null,complete:selected.length===expected,expectedRepetitions:expected,percentileCaveat:selected.length===expected?'exploratory small sample':'Incomplete mode: no target p95 estimated'});}
   const first=selected[0]??measurements.find(m=>m.label===rpc+':warmup');
   if(first)fs.writeFileSync(path.join(dir,'plans',`${path.basename(folder)}-${run.orders}-${rpc}-${mode}.json`),JSON.stringify(first.plan,null,2));
  }
  for(const [i,plan]of (run.nestedPlans??[]).entries())fs.writeFileSync(path.join(dir,'plans',`nested-${path.basename(folder)}-${run.orders}-${i}.json`),JSON.stringify(plan,null,2));
  if(run.functionStats?.before){const delta=(after,before)=>Object.fromEntries(Object.entries(after).map(([name,s])=>[name,{calls:s.calls-(before[name]?.calls??0),totalMs:s.totalMs-(before[name]?.totalMs??0),selfMs:s.selfMs-(before[name]?.selfMs??0)}]));result.functions={legacy:delta(run.functionStats.legacy,run.functionStats.before),extended:delta(run.functionStats.extended,run.functionStats.legacy)};result.instrumentedCalls=measurements.filter(m=>m.label.endsWith(':nested')).map(m=>({rpc:m.label,executionMs:m.executionMs}));}
  runs.push(result);
 }
}
const attempted=new Set(runs.filter(r=>r.dataset.startsWith('one business')).map(r=>r.orders));
const skipped=[50,100,200,500,1000,5000].filter(n=>!attempted.has(n)).map(orders=>({orders,status:'NOT_EXECUTED',reason:'Progressive safety stop; do not infer timings'}));
fs.writeFileSync(path.join(dir,'benchmarks.json'),JSON.stringify({at:new Date().toISOString(),unit:'milliseconds PostgreSQL EXPLAIN execution; planning stored separately in raw plans',concurrency:1,statementTimeoutMs:15000,lockTimeoutMs:3000,defaultSamples:5,warmupsPerRpc:1,executed:runs,notExecuted:skipped,http:{status:'NOT_EXECUTED',reason:'Fixtures are uncommitted and deliberately invisible to PostgREST. No commit/HTTP of a different cohort is presented as comparable.'},targets:[{orders:100,p95Ms:500},{orders:500,p95Ms:1000},{orders:1000,p95Ms:1500},{orders:5000,p95Ms:3000}],estimates:'No optimized execution or guaranteed speedups measured'},null,2));
const profilePath=path.join(dir,'profile','volume-100.json');
if(fs.existsSync(profilePath)){
 const profile=JSON.parse(fs.readFileSync(profilePath));
 const nodes=(n,list=[])=>{if(!n)return list;if(n['Relation Name']||n['Node Type']?.includes('Sort'))list.push({node:n['Node Type'],relation:n['Relation Name'],index:n['Index Name'],actualRows:n['Actual Rows'],loops:n['Actual Loops'],sharedHits:n['Shared Hit Blocks'],sharedReads:n['Shared Read Blocks'],tempRead:n['Temp Read Blocks'],tempWritten:n['Temp Written Blocks'],sortMethod:n['Sort Method'],sortSpace:n['Sort Space Used']});for(const child of n.Plans??[])nodes(child,list);return list;};
 fs.writeFileSync(path.join(dir,'plans','relevant-summary.json'),JSON.stringify({instrumentation:'auto_explain timing off for nested nodes; query duration and buffers retained, inclusive totals must not be summed',queries:profile.nestedPlans.map(p=>({durationMs:p.durationMs,query:p.plan['Query Text'],rootBuffers:{hits:p.plan.Plan?.['Shared Hit Blocks'],reads:p.plan.Plan?.['Shared Read Blocks'],tempReads:p.plan.Plan?.['Temp Read Blocks'],tempWrites:p.plan.Plan?.['Temp Written Blocks']},nodes:nodes(p.plan.Plan)}))},null,2));
}
console.log('Prepared benchmarks and extracted plans');
