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
const fullCatalog=()=>JSON.parse(read(`SELECT json_build_object(
 'functions',(SELECT json_agg(json_build_object('schema',n.nspname,'name',p.proname,'signature',pg_get_function_identity_arguments(p.oid),'defaults',pg_get_expr(p.proargdefaults,0),'invoker',not p.prosecdef,'volatility',p.provolatile,'config',p.proconfig,'acl',p.proacl::text,'definition',pg_get_functiondef(p.oid)) ORDER BY n.nspname,p.proname) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE p.proname LIKE 'statistics_%'),
 'policies',(SELECT json_agg(row_to_json(t) ORDER BY schemaname,tablename,policyname) FROM pg_policies t WHERE schemaname='public'),
 'indexes',(SELECT json_agg(row_to_json(t) ORDER BY schemaname,tablename,indexname) FROM pg_indexes t WHERE schemaname='public'),
 'constraints',(SELECT json_agg(json_build_object('table',c.conrelid::regclass::text,'name',c.conname,'definition',pg_get_constraintdef(c.oid)) ORDER BY c.conrelid,c.conname) FROM pg_constraint c WHERE c.conrelid IN ('public.profiles'::regclass,'public.orders'::regclass,'public.order_financials'::regclass,'public.order_statistics_completions'::regclass)),
 'counts',json_build_object('orders',(SELECT count(*) FROM public.orders),'items',(SELECT count(*) FROM public.order_items),'financials',(SELECT count(*) FROM public.order_financials),'audit',(SELECT count(*) FROM public.finance_audit_events),'sessions',(SELECT count(*) FROM public.store_sessions),'sessionSnapshots',(SELECT count(*) FROM public.store_session_statistics_snapshots),'completions',(SELECT count(*) FROM public.order_statistics_completions),'completionItems',(SELECT count(*) FROM public.order_statistics_completion_items),'identitySnapshots',(SELECT count(*) FROM public.order_item_statistics_snapshots)),
 'profileFingerprint',(SELECT md5(string_agg(id::text||coalesce(business_id::text,'NULL')||role,',' ORDER BY id)) FROM public.profiles),
 'ledger',(SELECT json_agg(json_build_object('version',version,'md5',md5(array_to_string(statements,E'\\n;\\n'))) ORDER BY version) FROM supabase_migrations.schema_migrations),
 'checkFunctionBodies',current_setting('check_function_bodies'),'deadlocks',(SELECT deadlocks FROM pg_stat_database WHERE datname=current_database()))`));
const baseline=JSON.parse(readFileSync(resolve(dir,'baseline.json'),'utf8'));
const isolation=gate(),catalog=fullCatalog();
for(const key of ['functions','policies','indexes','constraints','counts','profileFingerprint','ledger','deadlocks'])assert.deepEqual(catalog[key],baseline.catalog[key],key);
for(const [p,h]of Object.entries(baseline.files))assert.equal(sha(p),h,p);
writeFileSync(resolve(dir,'final-preservation.json'),JSON.stringify({at:new Date().toISOString(),isolation,catalogUnchanged:true,preexistingFileCount:Object.keys(baseline.files).length,preexistingFileHashesUnchanged:true,counts:catalog.counts,deadlocks:catalog.deadlocks,ledgerCount:catalog.ledger.length,candidateSha256:sha(migration),publicOriginalActive:true,policiesAndACLUnchanged:true,resources:resources()},null,2)+'\n');
console.log('PASS final live identity, full catalog/ACL/policies/ledger/data/file preservation.');
