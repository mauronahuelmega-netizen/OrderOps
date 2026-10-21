import fs from 'node:fs';import assert from 'node:assert/strict';import {verify,save,dir,runtime,m,args,extra} from './p03-f4a-common.mjs';import {session,extract,observe} from './p03-f4a-session.mjs';
const readers={original:'public.statistics_v1_summary',AB:'private.statistics_v1_summary_candidate',D1:'private.statistics_v1_summary_d1_candidate'};
const stats=a=>{const s=[...a].sort((a,b)=>a-b),mean=a.reduce((a,b)=>a+b,0)/a.length;return{n:a.length,p50:s[Math.ceil(a.length*.5)-1],p95:s[Math.ceil(a.length*.95)-1],min:s[0],max:s.at(-1),mean,stddev:Math.sqrt(a.reduce((v,x)=>v+(x-mean)**2,0)/a.length),cv:Math.sqrt(a.reduce((v,x)=>v+(x-mean)**2,0)/a.length)/mean,rawMs:a};};
const results=[],observations=[],equivalence=[];let halt=null;
async function cohort(n,batch,scaling=false){
 const before=verify(),cpu=parseFloat(before.resources.dbStats.CPUPerc),mem=parseFloat(before.resources.dbStats.MemPerc);if(cpu>35||mem>40){halt='ENTRY_RESOURCE_GATE';return false;}
 const tag=`${batch}_${n}`,s=session(tag);let timer,monitorBusy=false,pressure=false,pid,status='PASS',error=null;
 const raw={original:[],AB:[],D1:[]},warmups={},plans=[];
 try{
  const fixture=fs.readFileSync('scripts/statistics-v1/p03-f1-fixture.sql','utf8').replaceAll('__N__',String(n)).replace('begin;','begin isolation level repeatable read;').replace("statement_timeout='30s'","statement_timeout='15s'");
  await s.query(`SET application_name='statistics_f4a_${tag}';SET statistics.test_token='${m.token}';${fixture}SET LOCAL ROLE authenticated;\n\\timing on\n`);
  pid=Number((await s.query('SELECT pg_backend_pid();')).split(/\r?\n/).find(l=>/^\d+$/.test(l)));
  const tick=async()=>{if(monitorBusy)return;monitorBusy=true;try{const o=await observe(pid);observations.push({tag,...o});const normCPU=parseFloat(o.container.CPUPerc)/before.resources.dockerCapacity.cpus;if(normCPU>35||parseFloat(o.container.MemPerc)>40)pressure=true;}catch(e){observations.push({tag,observationError:String(e)});}finally{monitorBusy=false;}};
  await tick();timer=setInterval(tick,5000);
  // Three SELECTs pinned to the original asOf in one RR transaction,15s EACH.
  const first=extract(await s.query(`SELECT ${readers.original}('today');`)).data;
  assert.ok(first.products.nextCursor,'Seed must provide real cursor');const cur={...first.products.nextCursor,offset:0};const literal=JSON.stringify(cur).replaceAll("'","''");
  const matched=[];for(const [name,fn]of Object.entries(readers)){const r=extract(await s.query(`SELECT ${fn}('today',null,null,'units',5,'${literal}'::jsonb);`));matched.push(r.data);}
  assert.deepEqual(matched[0],matched[1]);assert.deepEqual(matched[1],matched[2]);equivalence.push({tag,orders:n,result:'PASS',completeJSON:true,pinnedAsOf:cur.asOf,readers:Object.keys(readers)});
  const call=fn=>`${fn}('today',null,null,'units',5,'${literal}'::jsonb)`;
  for(const [name,fn]of Object.entries(readers))warmups[name]=extract(await s.query(`SELECT ${call(fn)};`)).ms;
  const names=scaling?['AB','D1']:['original','AB','D1'];
  for(let i=0;i<20;i++){
   if(pressure){status='INCOMPLETE_RESOURCE_STOP';halt=status;break;}
   const offset=(i+batch)%names.length,order=[...names.slice(offset),...names.slice(0,offset)];
   for(const name of order){const r=extract(await s.query(`SELECT ${call(readers[name])};`));assert.ok(Number.isFinite(r.ms));assert.deepEqual(r.data,matched[2],'Complete pinned JSON during each normal measurement');raw[name].push(r.ms);if(r.ms>=5000){status='INCOMPLETE_LATENCY_GATE';halt=`${name}_QUERY_AT_LEAST_5000MS`;break;}}
   if(status!=='PASS')break;
  }
  if(status==='PASS'){
   // Plans collected AFTER normal samples; never folded into their quantiles.
   for(const name of names){const r=extract(await s.query(`EXPLAIN(ANALYZE,BUFFERS,SETTINGS,FORMAT JSON) SELECT ${call(readers[name])};`));plans.push({reader:name,plan:r.data});}
  }
 }catch(e){status=/DIVERGENCE|equal/i.test(String(e))?'FAIL_EQUIVALENCE':'FAILED_QUERY_OR_TRANSPORT';error={message:String(e),sql:s.log().slice(-14000).replaceAll(m.token,'[marker]')};halt=status;}
 finally{clearInterval(timer);while(monitorBusy)await new Promise(r=>setTimeout(r,10));const closed=await s.close();fs.writeFileSync(`${runtime}/p03-f4a-${tag}.local.log`,s.log());if(closed.code!==0&&status==='PASS'){status='FAILED_QUERY';halt=status;}}
 const after=verify();assert.deepEqual(after.extra,before.extra);assert.deepEqual(after.catalog.counts,before.catalog.counts);
 const item={batch,orders:n,scaling,status,error,method:'psql real SELECT timing, includes PostgreSQL execution/serialization/local Unix wire; no EXPLAIN/function instrumentation in normal samples',readers:Object.fromEntries(Object.entries(raw).filter(([k,a])=>a.length).map(([k,a])=>[k,stats(a)])),warmups,plans,resourceBefore:before.resources,resourceAfter:after.resources,rollback:true};results.push(item);save(`batch-${batch}-${n}.json`,item);save('resource-profile.json',{samples:observations,scope:'Own container and owned backend RSS/HWM/VM peak plus owned activity/waits; RSS includes shared mappings, not private allocated heap. CPU pressure active normalized to engine CPU capacity, entry gate raw35%; memory40%. Observer no query text/credentials.',observerIntervalMs:5000});save('equivalence-results.json',{result:equivalence.length?'PASS_IN_EXECUTED_CASES':'NOT_EXECUTED',cases:equivalence});
 console.log(`${status} batch${batch} N${n}: ${JSON.stringify(Object.fromEntries(Object.entries(item.readers).map(([k,v])=>[k,{samples:v.n,p50:v.p50,p95:v.p95,max:v.max,cv:v.cv}])))}; rollback verified.`);return status==='PASS';
}
for(const batch of [1,2,3]){for(const n of batch===2?[100,50]:[50,100]){if(!await cohort(n,batch))break;}if(halt)break;}
const stable=[];for(const n of [50,100]){const cs=results.filter(r=>r.orders===n&&!r.scaling);const p=cs.map(r=>r.readers.D1?.p95??Infinity);stable.push({orders:n,complete:cs.length===3&&cs.every(r=>r.status==='PASS'&&Object.values(r.readers).every(s=>s.n===20)),p95Ratio:Math.max(...p)/Math.min(...p),maxCV:Math.max(...cs.map(r=>r.readers.D1?.cv??Infinity))});}
const stabilityGate=!halt&&stable.every(g=>g.complete&&g.p95Ratio<=2&&g.maxCV<=.5);save('stability-benchmarks.json',{result:stabilityGate?'STABLE_WITHIN_EXPLORATORY_GATES':'STABILITY_NOT_ESTABLISHED',gates:{threeIndependentConnectionBatches:true,twentyPerReaderBatch:true,maxD1P95RatioAcrossBatches:2,maxD1CV:.5,query15s:true,lock3s:true},cohorts:results.filter(r=>!r.scaling),stability:stable,halt});
if(stabilityGate){for(const n of [200,500,1000,5000]){if(!await cohort(n,4,true))break;}}
save('scaling-benchmarks.json',{result:results.some(r=>r.scaling)?'EXECUTED_WITH_EXPLICIT_LIMITS':'NOT_EXECUTED',cohorts:results.filter(r=>r.scaling),halt:halt??(!stabilityGate?'D1_VARIABILITY_GATE':null),omitted:[200,500,1000,5000].filter(n=>!results.some(r=>r.scaling&&r.orders===n)),originalControl:'Full JSON original/AB/D1 with pinned cursor before each cohort; if original control times out, stop, not certified. Higher-cohort normal samples AB/D1 only.',targetsMs:{100:500,500:1000,1000:1500,5000:3000}});
console.log('Controlled stability/scaling complete.');
