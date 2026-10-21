import fs from 'node:fs';import assert from 'node:assert/strict';import {verify,save,m,runtime,resources} from './p03-f4a-common.mjs';import {session,extract} from './p03-f4a-session.mjs';
const serial=JSON.parse(fs.readFileSync('docs/estadisticas-v1/p03-f4a/stability-benchmarks.json','utf8'));assert.ok(serial.cohorts.length&&serial.cohorts.every(c=>c.status==='PASS'),'No concurrency after serial failure');
const before=verify();assert.ok(parseFloat(before.resources.dbStats.CPUPerc)<=35&&parseFloat(before.resources.dbStats.MemPerc)<=40);
const credentials=JSON.parse(fs.readFileSync(`${runtime}/credentials.local.json`,'utf8')),lanes=[],checkpoints=[],latencies=[];let status='PASS',error=null;
const triple="SELECT json_build_object('original',public.statistics_v1_summary('last_30_days'),'AB',private.statistics_v1_summary_candidate('last_30_days'),'D1',private.statistics_v1_summary_d1_candidate('last_30_days'));";
const compare=async(lane,phase)=>{const r=extract(await lane.s.query(triple));assert.deepEqual(r.data.original,r.data.AB);assert.deepEqual(r.data.AB,r.data.D1);assert.equal(r.data.D1.businessId,credentials.businesses[lane.business]);checkpoints.push({business:lane.business,phase,threeReaderJSON:'PASS',tripleSqlWireMs:r.ms,sales:r.data.D1.metrics.sales,completed:r.data.D1.metrics.completedOrders});return r.data;};
try{
 for(const business of ['a','b']){
  const s=session(`concurrency_${business}`),owner=credentials.users.find(u=>u.business===business&&u.role==='owner');lanes.push({business,s,owner});
  let fixture=fs.readFileSync('scripts/statistics-v1/p03-f1-fixture.sql','utf8').replaceAll('__N__','10').replace('begin;','begin isolation level repeatable read;').replace("statement_timeout='30s'","statement_timeout='15s'").replaceAll('P03F1:synthetic:',`P03F4A:${business}:synthetic:`);
  if(business==='b')fixture=fixture.replaceAll('statistics-synthetic-a','statistics-synthetic-b').replace("'P'||","'Q'||").replace("'pickup',10,'itemized'","'pickup',11,'itemized'").replace("'Synthetic diagnostic main',1,10","'Synthetic diagnostic main',1,11").replace('o.id,o.business_id,10','o.id,o.business_id,11').replace('"agreed_total":10','"agreed_total":11');
  await s.query(`SET application_name='statistics_f4a_concurrency_${business}';SET statistics.test_token='${m.token}';${fixture}SET LOCAL ROLE authenticated;\n\\timing on\n`);
  await compare(lanes.at(-1),'serial_baseline');
 }
 // Concurrency progresses1->2, ten owned uncommitted rows per different business.
 for(let i=0;i<5;i++)await Promise.all(lanes.map(async lane=>{const r=extract(await lane.s.query("SELECT private.statistics_v1_summary_d1_candidate('last_30_days');"));assert.equal(r.data.businessId,credentials.businesses[lane.business]);latencies.push({business:lane.business,concurrentReaders:2,iteration:i,sqlWireMs:r.ms});}));
 const a=lanes[0],b=lanes[1];await a.s.query("RESET ROLE;UPDATE public.order_financials SET agreed_total=9.99 WHERE order_id=md5('P03F4A:a:synthetic:1')::uuid;SET LOCAL ROLE authenticated;");
 await Promise.all([compare(a,'own_uncommitted_financial_change'),compare(b,'concurrent_other_business_financial_change')]);
 for(const state of ['preparing','completed']){
  await a.s.query(`RESET ROLE;UPDATE public.orders SET status='${state}' WHERE id=md5('P03F4A:a:synthetic:1')::uuid;SET CONSTRAINTS statistics_v1_order_revision,statistics_v1_item_revision,statistics_v1_financial_revision IMMEDIATE;SET LOCAL ROLE authenticated;`);
  await Promise.all([compare(a,state==='preparing'?'reopen':'recomplete_capture'),compare(b,'parallel_other_business_'+state)]);
 }
 // Within A's transaction its own rows are visible to MVCC, but raw B identity must not see A.
 await a.s.query(`SELECT set_config('request.jwt.claims',jsonb_build_object('sub','${b.owner.id}','role','authenticated','business_id','${credentials.businesses.a}')::text,true);`);
 const cross=extract(await a.s.query("SELECT json_build_object('orders',(SELECT count(*) FROM public.orders WHERE id=md5('P03F4A:a:synthetic:1')::uuid),'completions',(SELECT count(*) FROM public.order_statistics_completions WHERE order_id=md5('P03F4A:a:synthetic:1')::uuid));")).data;assert.deepEqual(cross,{orders:0,completions:0});checkpoints.push({phase:'raw_B_identity_forged_A_business',result:'PASS',cross});
}catch(e){status='FAIL';error=String(e);}
finally{for(const lane of lanes)await lane.s.close();}
const after=verify();assert.deepEqual(after.extra,before.extra);assert.deepEqual(after.catalog.counts,before.catalog.counts);assert.equal(after.catalog.deadlocks,before.catalog.deadlocks);
save('concurrency-results.json',{result:status,error,checkpoints,latencies,resourcesBefore:before.resources,resourcesAfter:after.resources,deadlocksDelta:after.catalog.deadlocks-before.catalog.deadlocks,rollback:true,scope:'Progression1->2 readers, independent tenant-owned RR fixtures; own financial writes/reopen/recompletion while second tenant reads; complete three-reader JSON at each checkpoint. No persistent commits.',limits:['Not a shared committed finance-row writer vs separate same-tenant reader race: uncommitted fixtures cannot be shared across connections.','No4+reader load; two-reader small-cohort diagnostic only; no production concurrency guarantee.','RLS cross-identity test uses own transaction-visible A rows under raw B identity, no inferred historical data.']});console.log(`${status} bounded two-tenant readers and financial/lifecycle checkpoints; rollback preserved.`);
