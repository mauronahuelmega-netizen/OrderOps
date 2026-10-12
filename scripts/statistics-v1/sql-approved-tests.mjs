/** PREPARED ONLY. This runner cannot apply migrations. Requires an explicit local review receipt. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { reviewBundle } from './review-bundle.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const runtime=resolve(root,'supabase/statistics-v1-test/.runtime');
// No --skip-gate, arbitrary SQL, database URL, remote endpoint, or migration execution path.
assert.equal(process.argv.length,3,'Usage: node sql-approved-tests.mjs unit|concurrency (after express SQL AND write-test approval)');
const suite=process.argv[2];assert.ok(['unit','concurrency','regression'].includes(suite));
const receipt=JSON.parse(readFileSync(resolve(runtime,'sql-review-approval.local.json'),'utf8'));
assert.equal(receipt.approvedByOwner,true,'Explicit approval not recorded');
assert.equal(receipt.allowWriteTests,true,'Write tests not approved');
assert.equal(receipt.reviewedBundleHash,reviewBundle().bundleHash,'Reviewed SQL/test contents changed');
const gate=spawnSync(process.execPath,[resolve(root,'scripts/statistics-v1/assert-isolated-target.mjs')],{cwd:root,stdio:'inherit',timeout:180000});
assert.equal(gate.status,0,'Isolation gate failed');
const manifest=JSON.parse(readFileSync(resolve(runtime,'manifest.json'),'utf8'));
assert.equal(receipt.projectId,manifest.projectId);
assert.match(manifest.token,/^[a-f0-9]+$/);
const container=`supabase_db_${manifest.projectId}`;
function args(){return ['exec','-i',container,'psql','-X','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-At'];}
function sql(source){
  const result=spawnSync('docker',args(),{input:source,encoding:'utf8',cwd:root,timeout:60000,maxBuffer:4*1024*1024});
  if(result.status!==0){writeFileSync(resolve(runtime,'statistics-sql-tests-failure.local.log'),`${result.stdout}\n${result.stderr}`);throw new Error('Isolated SQL test failed; see ignored runtime log');}
  return result.stdout.trim();
}
assert.equal(sql("BEGIN READ ONLY;SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version IN ('20261013001000','20261013002000','20261013003000');COMMIT;").split(/\r?\n/).filter(x=>!['BEGIN','COMMIT'].includes(x)).join(''),'3','Apply reviewed migrations separately first');
const guard=`SET statistics.test_token='${manifest.token}';`;
const runFile=name=>sql(guard+readFileSync(resolve(root,'supabase/tests/statistics-v1',name),'utf8'));
function record(details){const path=resolve(root,'docs/estadisticas-v1/validacion-sql-pruebas.json');const previous=existsSync(path)?JSON.parse(readFileSync(path,'utf8')):{projectId:manifest.projectId,results:{}};previous.results[suite]={status:'PASS',at:new Date().toISOString(),bundleHash:reviewBundle().bundleHash,details};writeFileSync(path,JSON.stringify(previous,null,2)+'\n');}
if(suite==='unit'){
  runFile('capture-metrics.sql');runFile('security-money.sql');
  record(['capture-metrics.sql','security-money.sql','transactional test writes rolled back']);
  console.log('PASS: isolated transactional SQL capture/metrics/security/money suites; all test writes rolled back.');
}else if(suite==='regression'){
  runFile('regression.sql');record(['regression.sql','create_order/transition_order_status/initialize_order_financials/set_order_agreed_total','stock and financial idempotence','all presets/hour/day/week/month/missing timezone','writes rolled back']);console.log('PASS: existing create/status/finance RPCs, stock/ledger idempotence, all presets and missing timezone; writes rolled back.');
}else{
  const children=[];
  function session(name){
    assert.match(name,/^[a-z_]+$/);
    const child=spawn('docker',args(),{cwd:root,stdio:['pipe','pipe','pipe']});children.push(child);
    let output='',err='';child.stdout.on('data',x=>{output+=x;});child.stderr.on('data',x=>{err+=x;});
    const done=new Promise((accept,reject)=>{child.on('error',reject);child.on('close',code=>{if(code===0)accept(output);else {writeFileSync(resolve(runtime,`${name}-failure.local.log`),err+output);reject(new Error(`Concurrency session ${name} failed`));}});});
    // Rejection is still checked when awaited; avoid an unhandled rejection before a barrier resolves.
    done.catch(()=>{});
    child.stdin.write(`${guard}SET application_name='statistics_test_${name}';SET lock_timeout='8s';SET statement_timeout='15s';`);
    return {send:source=>child.stdin.write(source+'\n'),end:()=>child.stdin.end(),done,output:()=>output};
  }
  const delay=()=>new Promise(accept=>setTimeout(accept,50));
  async function until(predicate){for(let n=0;n<160;n++){if(predicate())return;await delay();}throw new Error('Concurrency barrier timeout');}
  async function held(session,source){session.send(`BEGIN;${source};SELECT 'HELD';`);await until(()=>session.output().includes('HELD'));}
  async function blocked(name){await until(()=>sql(`BEGIN READ ONLY;SELECT exists(select 1 from pg_stat_activity WHERE application_name='statistics_test_${name}' AND wait_event_type='Lock');COMMIT;`).split(/\r?\n/).includes('t'));}
  const id='f2030000-0000-4000-8000-000000000001';
  const check=expected=>assert.equal(sql(`BEGIN READ ONLY;SELECT count(*) FILTER(WHERE active)=1 AND count(*)=${expected} AND count(*)=count(DISTINCT cycle) FROM public.order_statistics_completions WHERE order_id='${id}';COMMIT;`).split(/\r?\n/).filter(x=>!['BEGIN','COMMIT'].includes(x)).join(''),'t');
  runFile('concurrency-fixture.sql');
  try{
    // The same source order is serialized. Assert actual lock wait, then release A.
    const a=session('complete_a'),b=session('complete_b');
    await held(a,`UPDATE public.orders SET status='completed' WHERE id='${id}'`);
    b.send(`BEGIN;UPDATE public.orders SET status='completed' WHERE id='${id}';COMMIT;`);b.end();
    await blocked('complete_b');a.send('COMMIT;');a.end();await Promise.all([a.done,b.done]);check(1);
    const c=session('reopen'),d=session('recomplete');
    await held(c,`UPDATE public.orders SET status='preparing' WHERE id='${id}'`);
    d.send(`BEGIN;UPDATE public.orders SET status='completed' WHERE id='${id}';COMMIT;`);d.end();
    await blocked('recomplete');c.send('COMMIT;');c.end();await Promise.all([c.done,d.done]);check(2);
    // Hold financial row before completion: completion must NOT wait for that financial row.
    sql(`UPDATE public.orders SET status='preparing' WHERE id='${id}';`);
    const e=session('financial'),f=session('finance_completion');
    await held(e,`UPDATE public.order_financials SET agreed_total=22 WHERE order_id='${id}'`);
    f.send(`BEGIN;UPDATE public.orders SET status='completed' WHERE id='${id}';SELECT 'CAPTURED';COMMIT;`);f.end();
    await until(()=>f.output().includes('CAPTURED')); // F may wait at deferred revision COMMIT; release E now.
    e.send('COMMIT;');e.end();await Promise.all([e.done,f.done]);check(3);
    const g=session('session_close'),h=session('close_completion');
    sql(`UPDATE public.orders SET status='preparing' WHERE id='${id}';`);
    await held(g,"UPDATE public.store_sessions SET status='closed',closed_at=clock_timestamp() WHERE id='f2030000-0000-4000-8000-000000000004'");
    h.send(`BEGIN;UPDATE public.orders SET status='completed' WHERE id='${id}';COMMIT;`);h.end();
    await blocked('close_completion');g.send('COMMIT;');g.end();await Promise.all([g.done,h.done]);check(4);
    assert.equal(sql(`BEGIN READ ONLY;SELECT date_kind FROM public.order_statistics_completions WHERE order_id='${id}' AND active;COMMIT;`).split(/\r?\n/).filter(x=>!['BEGIN','COMMIT'].includes(x)).join(''),'outside_session');
    // Real stock RPC schedule: create holds product, cancel waits for it. Deferred revision must not invert locks.
    const oldSettings=JSON.parse(sql("BEGIN READ ONLY;SELECT json_build_object('onDemand',on_demand_mode_active,'scheduled',scheduled_mode_active) FROM public.business_settings WHERE business_id=(SELECT id FROM public.businesses WHERE slug='statistics-synthetic-a');COMMIT;").split(/\r?\n/).find(x=>x.startsWith('{')));
    const pendingOrder=runFile('stock-concurrency-fixture.sql').split(/\r?\n/).find(x=>/^[a-f0-9-]{36}$/.test(x));assert.ok(pendingOrder);
    const context="DO $$ BEGIN PERFORM set_config('request.jwt.claims',(SELECT jsonb_build_object('sub',p.id,'role','authenticated')::text FROM public.profiles p JOIN public.businesses b ON b.id=p.business_id WHERE b.slug='statistics-synthetic-a' AND p.role='owner'),true);END $$;";
    const i=session('stock_create'),j=session('stock_cancel');
    await held(i,context+"SELECT public.create_order(id,'SYNTHETIC STOCK CONCURRENCY CREATE','0000000000',current_date,'pickup',null,null,'[{\"product_id\":\"f2050000-0000-4000-8000-000000000002\",\"quantity\":1}]') FROM public.businesses WHERE slug='statistics-synthetic-a'");
    j.send(`BEGIN;${context}SELECT public.transition_order_status('${pendingOrder}','cancelled');COMMIT;`);j.end();
    await blocked('stock_cancel');i.send('COMMIT;');i.end();await Promise.all([i.done,j.done]);
    const createdOrder=i.output().split(/\r?\n/).find(x=>/^[a-f0-9-]{36}$/.test(x));assert.ok(createdOrder);
    assert.equal(sql("BEGIN READ ONLY;SELECT stock=19 FROM public.products WHERE id='f2050000-0000-4000-8000-000000000002';COMMIT;").split(/\r?\n/).filter(x=>!['BEGIN','COMMIT'].includes(x)).join(''),'t');
    assert.equal(sql(`BEGIN READ ONLY;SELECT count(*)=1 FROM public.stock_movements WHERE order_id='${pendingOrder}' AND movement_type='order_restock';COMMIT;`).split(/\r?\n/).filter(x=>!['BEGIN','COMMIT'].includes(x)).join(''),'t');
    sql(`BEGIN;DELETE FROM public.stock_movements WHERE order_id IN('${pendingOrder}','${createdOrder}') AND product_id='f2050000-0000-4000-8000-000000000002';DELETE FROM public.orders WHERE id IN('${pendingOrder}','${createdOrder}') AND business_id=(SELECT id FROM public.businesses WHERE slug='statistics-synthetic-a');DELETE FROM public.products WHERE id='f2050000-0000-4000-8000-000000000002';${context}DELETE FROM public.categories WHERE id='f2050000-0000-4000-8000-000000000001';UPDATE public.business_settings SET on_demand_mode_active=${oldSettings.onDemand?'true':'false'},scheduled_mode_active=${oldSettings.scheduled?'true':'false'} WHERE business_id=(SELECT id FROM public.businesses WHERE slug='statistics-synthetic-a');COMMIT;`);
    record(['two independent PostgreSQL connections','complete/complete:1 cycle','reopen/recomplete:2 cycles','agreement/completion:3 cycles','close/completion:4 cycles','exactly one active and unique cycles','real observed lock waits','real create_order vs transition_order_status stock schedule','final stock19 and exactly one restock ledger','isolated fixtures cleaned after sessions']);
    console.log('PASS: five coordinated schedules including real stock creation/cancellation; exact cycles, stock and idempotent ledger.');
  }finally{
    for(const child of children)if(child.exitCode===null){child.stdin.end('ROLLBACK;\n');}
    // Cleanup only after sessions finish. On failure retain fixtures for inspection; no reset/kill/shared cleanup.
    if(children.every(child=>child.exitCode===0))runFile('concurrency-cleanup.sql');
  }
}
