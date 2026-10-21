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
const beforeGate=gate(),before=JSON.parse(read(catalogQuery));assert.ok(Object.values(before.counts).every(n=>n===0));

const fullCatalog=()=>JSON.parse(read(`SELECT json_build_object(
 'functions',(SELECT json_agg(json_build_object('schema',n.nspname,'name',p.proname,'signature',pg_get_function_identity_arguments(p.oid),'defaults',pg_get_expr(p.proargdefaults,0),'invoker',not p.prosecdef,'volatility',p.provolatile,'config',p.proconfig,'acl',p.proacl::text,'definition',pg_get_functiondef(p.oid)) ORDER BY n.nspname,p.proname) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE p.proname LIKE 'statistics_%'),
 'policies',(SELECT json_agg(row_to_json(t) ORDER BY schemaname,tablename,policyname) FROM pg_policies t WHERE schemaname='public'),
 'indexes',(SELECT json_agg(row_to_json(t) ORDER BY schemaname,tablename,indexname) FROM pg_indexes t WHERE schemaname='public'),
 'constraints',(SELECT json_agg(json_build_object('table',c.conrelid::regclass::text,'name',c.conname,'definition',pg_get_constraintdef(c.oid)) ORDER BY c.conrelid,c.conname) FROM pg_constraint c WHERE c.conrelid IN ('public.profiles'::regclass,'public.orders'::regclass,'public.order_financials'::regclass,'public.order_statistics_completions'::regclass)),
 'counts',json_build_object('orders',(SELECT count(*) FROM public.orders),'items',(SELECT count(*) FROM public.order_items),'financials',(SELECT count(*) FROM public.order_financials),'audit',(SELECT count(*) FROM public.finance_audit_events),'sessions',(SELECT count(*) FROM public.store_sessions),'sessionSnapshots',(SELECT count(*) FROM public.store_session_statistics_snapshots),'completions',(SELECT count(*) FROM public.order_statistics_completions),'completionItems',(SELECT count(*) FROM public.order_statistics_completion_items),'identitySnapshots',(SELECT count(*) FROM public.order_item_statistics_snapshots)),
 'profileFingerprint',(SELECT md5(string_agg(id::text||coalesce(business_id::text,'NULL')||role,',' ORDER BY id)) FROM public.profiles),
 'ledger',(SELECT json_agg(json_build_object('version',version,'md5',md5(array_to_string(statements,E'\\n;\\n'))) ORDER BY version) FROM supabase_migrations.schema_migrations),
 'checkFunctionBodies',current_setting('check_function_bodies'),'deadlocks',(SELECT deadlocks FROM pg_stat_database WHERE datname=current_database()))`));
const previous=JSON.parse(readFileSync(resolve(root,'docs/estadisticas-v1/p03-f2b/installed-catalog.json'),'utf8')).catalog;
const beforeFull=fullCatalog();
for(const key of ['functions','policies','indexes','constraints','counts','profileFingerprint','ledger'])assert.deepEqual(beforeFull[key],previous[key],key);
assert.equal(beforeFull.ledger.length,124);
const originalFiles=JSON.parse(readFileSync(resolve(root,'docs/estadisticas-v1/p03-f1/baseline.json'),'utf8')).migrations;
for(const f of originalFiles)assert.equal(sha(f.path),f.sha256);
const fileList=run('git',['--no-optional-locks','ls-files','--cached','--others','--exclude-standard','-z']).split('\0').filter(p=>p&&!p.startsWith('docs/estadisticas-v1/p03-f3a/')&&!p.startsWith('scripts/statistics-v1/p03-f3a-'));
const files=Object.fromEntries(fileList.map(p=>[p,sha(p)]));
writeFileSync(resolve(dir,'baseline.json'),JSON.stringify({at:new Date().toISOString(),branch:run('git',['branch','--show-current']),head:run('git',['rev-parse','HEAD']),status:run('git',['--no-optional-locks','status','--short']),isolation:beforeGate,catalog:beforeFull,diagnosticCatalog:before,files,candidateSha256:hash},null,2)+'\n');

writeFileSync(resolve(dir,'before.json'),JSON.stringify({isolation:beforeGate,catalog:before,resources:resources(),migrationSha256:hash},null,2)+'\n');
// LOAD only in disposable connections. No extension creation or persistent server change.
// Already preloaded by the isolated server. No LOAD or persistent setting is necessary.
const nestedAvailable=profileOnly && before.settings.shared_preload_libraries.split(',').map(s=>s.trim()).includes('auto_explain');
const fixture=readFileSync(resolve(root,'scripts/statistics-v1/p03-f1-fixture.sql'),'utf8');
const records=[];
function parseMeasurements(out){const items=[];const re=/MEASURE:([^\r\n]+)\r?\n(\[[\s\S]*?\r?\n\])/g;for(const match of out.matchAll(re)){const plan=JSON.parse(match[2])[0];items.push({label:match[1],executionMs:plan['Execution Time'],planningMs:plan['Planning Time'],plan});}return items;}
function parseNested(stderr){const items=[];for(const match of stderr.matchAll(/duration: ([0-9.]+) ms\s+plan:\s*(\{[\s\S]*?\n\})/g)){try{items.push({durationMs:Number(match[1]),plan:JSON.parse(match[2])});}catch{/* Raw ignored log retained for alternate PostgreSQL log formatting. */}}return items;}
async function sample(n){
  const isolation=gate(),resourceBefore=resources();const cpu=Number.parseFloat(resourceBefore.dbStats.CPUPerc),memory=Number.parseFloat(resourceBefore.dbStats.MemPerc);
  if(cpu>35 || memory>40){records.push({orders:n,status:'SKIPPED_RESOURCE_GATE',resourceBefore});return false;}
  let body=`SET statistics.test_token='${m.token}';`+fixture.replaceAll('__N__',String(n));
  // The older 3-digit base-eight code covers 512 values; use a fourth digit for 1000 unique codes.
  body=body.replace("'P3B'||substr('23456789',1+o.n/64,1)||substr('23456789',1+(o.n/8)%8,1)||substr('23456789',1+o.n%8,1)","'PB'||substr('23456789',1+o.n/512,1)||substr('23456789',1+(o.n/64)%8,1)||substr('23456789',1+(o.n/8)%8,1)||substr('23456789',1+o.n%8,1)");
  body+=`\nSET LOCAL statement_timeout='15s';SET LOCAL ROLE authenticated;\n`;
  const legacy="public.statistics_v1_summary('today')",extended="private.statistics_v1_summary_candidate('today')";
  for(let repeat=0;repeat<6;repeat++) for(const [name,call] of repeat%2?[['extended',extended],['legacy',legacy]]:[['legacy',legacy],['extended',extended]]){
    body+=`SELECT 'MEASURE:${name}:${repeat===0?'warmup':repeat}';EXPLAIN (ANALYZE,BUFFERS,SETTINGS,FORMAT JSON) SELECT ${call};\n`;
  }
  // Session-only counterfactual; neither the migration nor server defaults change.
  body+='SET LOCAL jit=off;\n';
  for(let repeat=1;repeat<=0;repeat++) for(const [name,call] of [['legacy',legacy],['extended',extended]]) body+=`SELECT 'MEASURE:${name}:jit_off:${repeat}';EXPLAIN (ANALYZE,BUFFERS,SETTINGS,FORMAT JSON) SELECT ${call};\n`;
  body+='SET LOCAL jit=default;\n';
  if(nestedAvailable){
    body+="RESET ROLE;SET LOCAL track_functions='all';SET LOCAL auto_explain.log_min_duration='10ms';SET LOCAL auto_explain.log_nested_statements=on;SET LOCAL auto_explain.log_analyze=on;SET LOCAL auto_explain.log_buffers=on;SET LOCAL auto_explain.log_timing=off;SET LOCAL auto_explain.log_level='notice';SET LOCAL auto_explain.log_format='json';SET LOCAL ROLE authenticated;\n";
    const stats=tag=>`SELECT 'FSTATS:${tag}';SELECT coalesce(json_object_agg(schemaname||'.'||funcname,json_build_object('calls',calls,'totalMs',total_time,'selfMs',self_time)),'{}') FROM pg_stat_xact_user_functions;\n`;
    body+=stats('before')+`SELECT 'MEASURE:legacy:nested';EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) SELECT ${legacy};`+stats('legacy')+`SELECT 'MEASURE:extended:nested';EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) SELECT ${extended};`+stats('extended')+"RESET ROLE;SET LOCAL auto_explain.log_min_duration='-1';SET LOCAL track_functions=none;\n";
  }
  body+='RESET ROLE;ROLLBACK;\n';
  writeFileSync(resolve(runtime,`p03-f3a-${n}-prepared.local.sql`),body);
  console.log(`Measuring ${n} synthetic orders, serial queries, 15s per SELECT, rollback.`);
  const start=Date.now();
  const result=await new Promise((accept,reject)=>{const child=spawn('docker',args,{cwd:root,stdio:['pipe','pipe','pipe']});let stdout='',stderr='';child.stdout.on('data',x=>{stdout+=x;});child.stderr.on('data',x=>{stderr+=x;});child.on('error',reject);child.on('close',code=>accept({code,stdout,stderr}));child.stdin.end(body);});
  writeFileSync(resolve(runtime,`p03-f3a-${n}.local.log`),result.stdout+'\n'+result.stderr);
  const functionStats=Object.fromEntries([...result.stdout.matchAll(/FSTATS:([^\r\n]+)\r?\n(\{[^\r\n]*\})/g)].map(x=>[x[1],JSON.parse(x[2])]));
  const item={orders:n,status:result.code===0?'PASS':'FAILED_TIMEOUT_OR_SQL',elapsedMs:Date.now()-start,isolation,resourceBefore,resourceAfter:resources(),measurements:parseMeasurements(result.stdout),nestedPlans:parseNested(result.stderr),functionStats,rollback:result.stdout.trim().endsWith('ROLLBACK'),error:result.code===0?null:result.stderr.replaceAll(m.token,'[token]')};
  assert.ok(Object.values(JSON.parse(read(catalogQuery)).counts).every(x=>x===0),'Fixture cleanup after connection closes');
  records.push(item);writeFileSync(resolve(dir,`volume-${n}.json`),JSON.stringify(item,null,2)+'\n');
  console.log(`${item.status} ${n} orders; fixture cleanup verified.`);
  if(item.status!=='PASS')return false;
  const defaultSamples=item.measurements.filter(x=>/^[^:]+:[1-5]$/.test(x.label));
  return defaultSamples.length===10 && Math.max(...item.measurements.map(x=>x.executionMs))<5000;
}
for(const n of [50,100]){if(!await sample(n))break;}
const afterFull=fullCatalog();for(const key of ['functions','policies','indexes','constraints','counts','profileFingerprint','ledger','deadlocks'])assert.deepEqual(afterFull[key],beforeFull[key],key);for(const [p,h]of Object.entries(files))assert.equal(sha(p),h,p);writeFileSync(resolve(dir,'preservation.json'),JSON.stringify({at:new Date().toISOString(),catalogUnchanged:true,preexistingFilesUnchanged:Object.keys(files).length,fixturesAbsent:true,publicOriginalActive:true,ledgerCount:afterFull.ledger.length},null,2)+'\n');
const afterGate=gate(),after=JSON.parse(read(catalogQuery));assert.deepEqual(after.functions,before.functions);assert.deepEqual(after.indexes,before.indexes);assert.deepEqual(after.counts,before.counts);assert.equal(after.deadlocks,before.deadlocks);assert.equal(sha(migration),hash);
writeFileSync(resolve(dir,'after.json'),JSON.stringify({isolation:afterGate,catalog:after,resources:resources(),migrationSha256:hash},null,2)+'\n');
writeFileSync(resolve(dir,'results.json'),JSON.stringify({at:new Date().toISOString(),nestedAvailable,records:records.map(r=>({orders:r.orders,status:r.status,measurementCount:r.measurements?.length??0})),serialOnly:true,perSelectTimeoutSeconds:15,samplesPerMode:5,fixtureRollbackVerified:true,persistentFunctionsAndIndexesUnchanged:true},null,2)+'\n');
console.log('Diagnostic complete; functions/indexes/hash unchanged, fixtures absent, no deadlocks.');
