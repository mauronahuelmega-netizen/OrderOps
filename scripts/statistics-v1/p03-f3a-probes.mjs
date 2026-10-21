/** P03-F.1: bounded, serial, synthetic diagnostic. No migration/index/function modifications. */
import assert from 'node:assert/strict';
import { readFileSync,writeFileSync,mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn,spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const root=fileURLToPath(new URL('../../',import.meta.url));
const profileOnly=true;
const runtime=resolve(root,'supabase/statistics-v1-test/.runtime'),dir=resolve(root,'docs/estadisticas-v1/p03-f3a');
const project='orderops-statistics-v1-test-74718de66a41',hash='fd88de8c0ec3f4a87d8a6782650d63cf4779d8170033a4c5b4f37edbd489faf9';
mkdirSync(dir,{recursive:true});
function run(bin,args,input){const r=spawnSync(bin,args,{cwd:root,input,encoding:'utf8',timeout:60000,maxBuffer:32*1024*1024});if(r.error||r.status!==0)throw new Error(`${bin} diagnostic command failed`);return r.stdout.trim();}
const sha=p=>createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex');
assert.equal(run('git',['branch','--show-current']),'codex/estadisticas-v1');
assert.equal(run('git',['rev-parse','--show-toplevel']).replaceAll('\\','/').toLowerCase(),root.replaceAll('\\','/').replace(/\/$/,'').toLowerCase());
const migration='supabase/migrations/20261013005000_statistics_v1_read_core_candidate.sql';assert.equal(sha(migration),hash);
const m=JSON.parse(readFileSync(resolve(runtime,'manifest.json'),'utf8'));assert.equal(m.projectId,project);
const args=['exec','-i',`supabase_db_${project}`,'psql','-X','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-At'];
const sql=q=>run('docker',args,q);
const read=q=>sql(`BEGIN READ ONLY;${q};COMMIT;`).split(/\r?\n/).filter(x=>!['BEGIN','COMMIT'].includes(x)).join('\n');
function gate(){
  run(process.execPath,['scripts/statistics-v1/isolation-policy.verify.mjs']);
  run(process.execPath,['scripts/statistics-v1/assert-isolated-target.mjs']);
  const names=run('docker',['ps','-a','--filter',`label=com.supabase.cli.project=${project}`,'--format','{{.Names}}']).split(/\r?\n/);assert.equal(names.length,5);
  const cs=JSON.parse(run('docker',['inspect',...names]));assert.deepEqual(cs.map(c=>c.Id).sort(),m.resources.containerIds);assert.equal(m.resources.volumeNames.length,2);
  for(const c of cs){assert.ok(c.State.Running);if(c.State.Health)assert.equal(c.State.Health.Status,'healthy');}
  assert.equal(read(`SELECT token='${m.token}' FROM statistics_test_environment.identity WHERE singleton`),'t');
  assert.equal(read("SELECT count(*) FROM supabase_migrations.schema_migrations"),'124');
  assert.equal(read("SELECT md5(statements[1]) FROM supabase_migrations.schema_migrations WHERE version='20261013005000'"),createHash('md5').update(readFileSync(resolve(root,migration))).digest('hex'));
  return {at:new Date().toISOString(),projectId:project,resources:m.resources,containers:cs.map(c=>({name:c.Name,id:c.Id,health:c.State.Health?.Status??'no-healthcheck',running:c.State.Running})),api:'127.0.0.1:56321',db:'127.0.0.1:56322'};
}
function resources(){return {at:new Date().toISOString(),dbStats:JSON.parse(run('docker',['stats','--no-stream','--format','{{json .}}',`supabase_db_${project}`])),dockerCapacity:JSON.parse(run('docker',['info','--format','{"cpus":{{.NCPU}},"memoryBytes":{{.MemTotal}}}']))};}
const catalogQuery=`SELECT json_build_object('functions',(SELECT json_agg(json_build_object('name',n.nspname||'.'||p.proname,'definition',pg_get_functiondef(p.oid)) ORDER BY n.nspname,p.proname) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE p.proname LIKE 'statistics_%'),'indexes',(SELECT json_agg(row_to_json(i) ORDER BY schemaname,tablename,indexname) FROM pg_indexes i WHERE tablename IN ('orders','order_items','order_financials','profiles','order_item_statistics_snapshots','order_statistics_completions','order_statistics_completion_items','store_session_statistics_snapshots')),'counts',(SELECT json_build_object('orders',(SELECT count(*) FROM public.orders),'items',(SELECT count(*) FROM public.order_items),'completions',(SELECT count(*) FROM public.order_statistics_completions),'completionItems',(SELECT count(*) FROM public.order_statistics_completion_items),'snapshots',(SELECT count(*) FROM public.order_item_statistics_snapshots),'sessions',(SELECT count(*) FROM public.store_sessions),'auditEvents',(SELECT count(*) FROM public.finance_audit_events),'financials',(SELECT count(*) FROM public.order_financials))),'plannerStatistics',(SELECT json_agg(row_to_json(s)) FROM pg_stat_all_tables s WHERE schemaname='public' AND relname IN ('orders','order_items','order_financials','order_statistics_completions','order_statistics_completion_items','order_item_statistics_snapshots')),'columnStatistics',(SELECT json_agg(json_build_object('table',tablename,'column',attname,'nullFrac',null_frac,'distinct',n_distinct)) FROM pg_stats WHERE schemaname='public' AND tablename IN ('orders','order_items','order_financials','order_statistics_completions')),'deadlocks',(SELECT deadlocks FROM pg_stat_database WHERE datname=current_database()),'settings',(SELECT json_object_agg(name,setting) FROM pg_settings WHERE name IN ('server_version','jit','jit_above_cost','jit_inline_above_cost','jit_optimize_above_cost','work_mem','shared_buffers','max_parallel_workers_per_gather','track_functions','shared_preload_libraries','effective_cache_size','random_page_cost','seq_page_cost','default_statistics_target','max_connections')))`;

const prior=JSON.parse(readFileSync(resolve(dir,'baseline.json'),'utf8'));
for(const [p,h]of Object.entries(prior.files))assert.equal(sha(p),h,p);
const isolation=gate(),before=JSON.parse(read(catalogQuery)),resourceBefore=resources();
assert.ok(Object.values(before.counts).every(x=>x===0));
assert.ok(Number.parseFloat(resourceBefore.dbStats.CPUPerc)<=35 && Number.parseFloat(resourceBefore.dbStats.MemPerc)<=40);
function parseMeasurements(out){const items=[];const re=/MEASURE:([^\r\n]+)\r?\n(\[[\s\S]*?\r?\n\])/g;for(const match of out.matchAll(re)){const plan=JSON.parse(match[2])[0];items.push({label:match[1],executionMs:plan['Execution Time'],planningMs:plan['Planning Time'],plan});}return items;}
function parseNested(stderr){const items=[];for(const match of stderr.matchAll(/duration: ([0-9.]+) ms\s+plan:\s*(\{[\s\S]*?\n\})/g)){try{items.push({durationMs:Number(match[1]),plan:JSON.parse(match[2])});}catch{/* Raw ignored log retained for alternate PostgreSQL log formatting. */}}return items;}

let body=`SET statistics.test_token='${m.token}';`+readFileSync(resolve(root,'scripts/statistics-v1/p03-f1-fixture.sql'),'utf8').replaceAll('__N__','100');
body+=`SET LOCAL statement_timeout='15s';SET LOCAL ROLE authenticated;
SELECT set_config('statistics.f3a.probe_bundle',private.statistics_v1_read_core_candidate('today')::text,true) IS NOT NULL;
`;
const facts=`jsonb_populate_recordset(null::public.statistics_v1_effective_facts,current_setting('statistics.f3a.probe_bundle')::jsonb->'effectiveFacts')`;
const probes={
 historical:`SELECT count(*) FROM public.orders o WHERE o.business_id=(SELECT business_id FROM public.profiles WHERE id=auth.uid()) AND o.status='completed' AND NOT EXISTS(SELECT 1 FROM public.order_statistics_completions c WHERE c.order_id=o.id AND c.active AND c.commercial_date IS NOT NULL AND c.timezone IS NOT NULL AND NOT c.date_conflict)`,
 jsonRoundtrip:`SELECT count(*),sum(effective_sales),sum(effective_units) FROM ${facts} f`,
 jsonReaggregate:`SELECT jsonb_agg(to_jsonb(f)) FROM ${facts} f`
};
for(let i=0;i<6;i++)for(const [name,q]of Object.entries(probes))body+=`SELECT 'MEASURE:${name}:${i===0?'warmup':i}';EXPLAIN(ANALYZE,BUFFERS,SETTINGS,FORMAT JSON) ${q};\n`;
body+='RESET ROLE;ROLLBACK;';
const result=sql(body);assert.ok(result.trim().endsWith('ROLLBACK'));
const after=JSON.parse(read(catalogQuery));for(const key of ['functions','indexes','counts','deadlocks'])assert.deepEqual(after[key],before[key]);
for(const [p,h]of Object.entries(prior.files))assert.equal(sha(p),h,p);
writeFileSync(resolve(dir,'component-probes.json'),JSON.stringify({isolation,orders:100,resourceBefore,resourceAfter:resources(),measurements:parseMeasurements(result),rollback:true,catalogUnchanged:true,method:'Controlled SELECT probes. JSON reads transaction-local GUC populated from an authorized candidate core; GUC string parsing is included. Historical count has scalar authenticated-profile parameter; planner can differ from PL/pgSQL cached query. No change to installed SQL or persistent settings.'},null,2)+'\n');
console.log('PASS controlled component SELECT probes, rollback and preservation verified.');
