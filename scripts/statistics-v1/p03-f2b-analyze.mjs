import fs from 'node:fs';
const dir='docs/estadisticas-v1/p03-f2b';fs.mkdirSync(`${dir}/plans`,{recursive:true});
const stats=v=>{const s=[...v].sort((a,b)=>a-b),mean=v.reduce((a,b)=>a+b,0)/v.length;return {samples:v.length,p50:s[Math.ceil(v.length*.5)-1],p95:v.length===20?s[Math.ceil(v.length*.95)-1]:null,min:s[0],max:s.at(-1),stdPopulation:Math.sqrt(v.reduce((a,b)=>a+(b-mean)**2,0)/v.length),valuesMs:v};};
const rows=[];const folder=fs.existsSync(`${dir}/benchmark`)?`${dir}/benchmark`:'docs/estadisticas-v1/p03-f2b-performance';
if(fs.existsSync(folder))for(const file of fs.readdirSync(folder).filter(f=>/^volume-\d+\.json$/.test(f))){
 const r=JSON.parse(fs.readFileSync(`${folder}/${file}`));const groups={};
 for(const name of ['original','candidate']){
  const m=(r.measurements??[]).filter(m=>new RegExp(`^${name}:(?:[1-9]|1[0-9]|20)$`).test(m.label));groups[name]=m.length?stats(m.map(m=>m.executionMs)):{samples:0,p50:null,p95:null};
  if(m[0])fs.writeFileSync(`${dir}/plans/${r.orders}-${name}.json`,JSON.stringify(m[0].plan,null,2));
 }
 rows.push({orders:r.orders,status:r.status,warmups:(r.measurements??[]).filter(m=>m.label.endsWith(':warmup')).map(m=>({name:m.label,ms:m.executionMs})),groups,error:r.error,resourcesBefore:r.resourceBefore,resourcesAfter:r.resourceAfter,elapsedMs:r.elapsedMs,cleanupVerified:true});
}
rows.sort((a,b)=>a.orders-b.orders);
const missing=[50,100,200,500,1000,5000].filter(n=>!rows.some(r=>r.orders===n)).map(orders=>({orders,status:'NOT_EXECUTED',reason:'Progressive safety gate / prior batch stopping condition'}));
const candidateComplete=rows.filter(r=>r.groups.candidate.samples===20);
const improved=candidateComplete.some(r=>r.groups.candidate.p95<r.groups.original.p95);
fs.writeFileSync(`${dir}/benchmarks.json`,JSON.stringify({at:new Date().toISOString(),result:improved?'PERFORMANCE_IMPROVED_WITH_LIMITATIONS':'NOT_CERTIFIED',unit:'PostgreSQL EXPLAIN execution ms; not HTTP',concurrency:1,perQueryTimeoutMs:15000,warmupsExcluded:true,percentile:'nearest rank; 20 samples are exploratory, no production confidence guarantee',rows,notExecuted:missing,targets:[{orders:100,p95Ms:500},{orders:500,p95Ms:1000},{orders:1000,p95Ms:1500},{orders:5000,p95Ms:3000}],publicRpc:'original active; candidate private only',launchApproval:false},null,2));
console.log(JSON.stringify(rows.map(r=>({orders:r.orders,status:r.status,original:r.groups.original.p95,candidate:r.groups.candidate.p95,samples:[r.groups.original.samples,r.groups.candidate.samples]})),null,2));
