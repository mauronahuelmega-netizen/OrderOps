/** P03-F.1: bounded, serial, synthetic diagnostic. No migration/index/function modifications. */
import assert from 'node:assert/strict';
import { readFileSync,writeFileSync,mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn,spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const root=fileURLToPath(new URL('../../',import.meta.url));
const profileOnly=true;
const runtime=resolve(root,'supabase/statistics-v1-test/.runtime'),dir=resolve(root,'docs/estadisticas-v1/p03-f3c');
const project='orderops-statistics-v1-test-74718de66a41',hash='fd88de8c0ec3f4a87d8a6782650d63cf4779d8170033a4c5b4f37edbd489faf9';
mkdirSync(dir,{recursive:true});
function run(bin,args,input){const r=spawnSync(bin,args,{cwd:root,input,encoding:'utf8',timeout:60000,maxBuffer:32*1024*1024});if(r.error||r.status!==0)throw Object.assign(new Error(`${bin} diagnostic command failed`),{stderr:r.stderr,stdout:r.stdout});return r.stdout.trim();}
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
const action=process.argv[2],variant=process.argv[3]??'base';
assert.ok(['preflight','apply','security','differential','finish'].includes(action));
const d1File='docs/estadisticas-v1/p03-f3b/candidate-d1.sql',d1Hash='9e8b793df40de1aeb6ecbb71c1ce4e828c717498e62340341d8784726ee78070',name='statistics_v1_summary_d1_candidate';
assert.equal(sha(d1File),d1Hash);
const isolation=gate(),catalog=fullCatalog();
const prior=JSON.parse(readFileSync(resolve(root,'docs/estadisticas-v1/p03-f2b/installed-catalog.json'),'utf8')).catalog;
for(const f of JSON.parse(readFileSync(resolve(root,'docs/estadisticas-v1/p03-f1/baseline.json'),'utf8')).migrations)assert.equal(sha(f.path),f.sha256);
const originals=catalog.functions.filter(f=>f.name!==name);assert.deepEqual(originals,prior.functions);
for(const k of ['policies','indexes','constraints','counts','profileFingerprint','ledger'])assert.deepEqual(catalog[k],prior[k],k);
const prefix=`SET statistics.test_token='${m.token}';`;
const sqlTest=q=>new Promise((ok,no)=>{const child=spawn('docker',args,{stdio:['pipe','pipe','pipe'],windowsHide:true});let stdout='',stderr='',completed=0;child.stdout.on('data',s=>stdout+=s);child.stderr.on('data',s=>{stderr+=s;for(const match of String(s).matchAll(/D1_PASS/g)){completed++;if(completed%16===0)console.log(`Triple cases completed: ${completed}`);}});child.on('error',no);child.on('close',code=>code===0?ok(stdout.trim()):no(Object.assign(Error('Controlled SQL test failed'),{stdout,stderr})));child.stdin.end(q);});
const extraFingerprint=()=>JSON.parse(read(`SELECT json_build_object('settings',(SELECT md5(string_agg(to_jsonb(t)::text,',' ORDER BY business_id)) FROM public.business_settings t),'state',(SELECT md5(string_agg(to_jsonb(t)::text,',' ORDER BY business_id)) FROM public.business_statistics_state t),'products',(SELECT count(*) FROM public.products),'categories',(SELECT count(*) FROM public.categories),'stock',(SELECT count(*) FROM public.stock_movements),'triggers',(SELECT json_agg(json_build_object('table',tgrelid::regclass::text,'name',tgname,'def',pg_get_triggerdef(oid)) ORDER BY tgrelid,tgname) FROM pg_trigger WHERE NOT tgisinternal))`));
if(action==='preflight'){
 assert.ok(!catalog.functions.some(f=>f.name===name));assert.equal(catalog.ledger.length,124);assert.ok(Object.values(catalog.counts).every(x=>x===0));
 const files=run('git',['--no-optional-locks','ls-files','--cached','--others','--exclude-standard','-z']).split('\0').filter(p=>p&&!p.startsWith('docs/estadisticas-v1/p03-f3c/')&&!p.startsWith('scripts/statistics-v1/p03-f3c-'));
 writeFileSync(resolve(dir,'baseline.json'),JSON.stringify({at:new Date().toISOString(),head:run('git',['rev-parse','HEAD']),branch:run('git',['branch','--show-current']),status:run('git',['--no-optional-locks','status','--short']),isolation,catalog,extra:extraFingerprint(),candidateSha256:d1Hash,files:Object.fromEntries(files.map(p=>[p,sha(p)]))},null,2)+'\n');
 console.log('PASS preflight:124 ledger, approved D1/AB hashes, originals/catalog/resources preserved, D1 absent.');
}else{
 const baseline=JSON.parse(readFileSync(resolve(dir,'baseline.json'),'utf8'));assert.equal(run('git',['rev-parse','HEAD']),baseline.head);for(const [p,h]of Object.entries(baseline.files))assert.equal(sha(p),h,p);
 const save=(file,v)=>writeFileSync(resolve(dir,file),JSON.stringify(v,null,2)+'\n');
 if(action==='apply'){
  assert.deepEqual(catalog,baseline.catalog);assert.deepEqual(extraFingerprint(),baseline.extra);
  try{const output=sql(readFileSync(resolve(root,d1File),'utf8'));save('installation-evidence.json',{at:new Date().toISOString(),result:'PASS',hash:d1Hash,output,ledgerChanged:false,onlyFunctionD1:true});}
  catch(e){assert.deepEqual(fullCatalog(),baseline.catalog);save('installation-evidence.json',{result:'FAIL',hash:d1Hash,error:e.stderr,atomicRollbackVerified:true});console.log('FAIL compilation: exact error saved; no correction');process.exit(1);}
  const after=fullCatalog(),fn=after.functions.filter(f=>f.name===name);assert.equal(fn.length,1);assert.ok(fn[0].invoker&&fn[0].volatility==='s');assert.deepEqual(fn[0].config,['search_path=pg_catalog, public, private']);assert.ok(fn[0].acl.includes('authenticated=X')&&!/(?:\{|,)=X\//.test(fn[0].acl));
  assert.deepEqual(after.functions.filter(f=>f.name!==name),baseline.catalog.functions);for(const k of ['policies','indexes','constraints','counts','profileFingerprint','ledger'])assert.deepEqual(after[k],baseline.catalog[k]);
  save('installed-catalog.json',{result:'PASS',function:fn[0],catalog:after,publicOriginalActive:true,ABUnchanged:true});console.log('PASS installed D1 only; originals/AB/RLS/ACL/ledger124 unchanged.');
 }else if(action==='security'||action==='differential'){
  assert.equal(JSON.parse(readFileSync(resolve(dir,'installation-evidence.json'))).result,'PASS');if(action==='differential')assert.equal(JSON.parse(readFileSync(resolve(dir,'security.json'))).result,'PASS');
  assert.ok(['base','shapes','products','temporal','edges'].includes(variant));
  const credentials=JSON.parse(readFileSync(resolve(runtime,'credentials.local.json'),'utf8'));assert.equal(credentials.projectId,project);
  let fixture=readFileSync(resolve(root,variant==='shapes'?'scripts/statistics-v1/p03-f1-shapes-fixture.sql':'scripts/statistics-v1/p03-f1-fixture.sql'),'utf8').replaceAll('__N__','10').replace('begin;','begin isolation level repeatable read;');
  if(variant==='products')fixture=fixture.replace('insert into public.order_items(order_id,product_name,quantity,unit_price)',`INSERT INTO public.categories(id,business_id,name) SELECT md5('F3C:category:'||n)::uuid,b.id,'Synthetic F3C category '||n FROM generate_series(1,10)n CROSS JOIN public.businesses b WHERE b.slug='statistics-synthetic-a'; INSERT INTO public.products(id,business_id,category_id,name,price) SELECT md5('F3C:product:'||n)::uuid,b.id,md5('F3C:category:'||n)::uuid,'Synthetic F3C product '||n,10 FROM generate_series(1,10)n CROSS JOIN public.businesses b WHERE b.slug='statistics-synthetic-a'; insert into public.order_items(order_id,product_name,quantity,unit_price,product_id)`).replace("'Synthetic diagnostic main',1,10 from generate_series","'Synthetic diagnostic main',1,10,md5('F3C:product:'||n)::uuid from generate_series");
  if(variant==='temporal')fixture+='\n'+readFileSync(resolve(root,'scripts/statistics-v1/p03-f2b-temporal-fixture.sql'),'utf8').replaceAll('current_date-shift','current_date-2-shift');
  const ids=credentials.users.map(u=>{assert.match(u.id,/^[a-f0-9-]{36}$/i);return u.id;});
  const contexts=`SELECT set_config('statistics.f2a.synthetic_actor_ids','{${ids.join(',')}}',true);SELECT set_config('statistics.f2b.actor',(SELECT p.id::text FROM public.profiles p JOIN public.businesses b ON b.id=p.business_id WHERE b.slug='statistics-synthetic-a' AND p.role='owner'),true);SELECT set_config('statistics.f2b.owners',(SELECT jsonb_agg(p.id)::text FROM public.profiles p JOIN public.businesses b ON b.id=p.business_id WHERE b.slug IN ('statistics-synthetic-a','statistics-synthetic-b') AND p.role='owner'),true);SET LOCAL statement_timeout='15s';`;
  let test;
  const triple=text=>text.replaceAll('a jsonb;b jsonb;','a jsonb;b jsonb;z jsonb;').replace(/select public\.statistics_v1_summary\(([^;]*?)\),private\.statistics_v1_summary_candidate\(([^;]*?)\) into a,b;/gi,(_,a,b)=>`select public.statistics_v1_summary(${a}),private.statistics_v1_summary_candidate(${b}),private.statistics_v1_summary_d1_candidate(${b}) into a,b,z;`).replaceAll('if a is distinct from b then','if a is distinct from b or b is distinct from z then');
  if(action==='security')test=readFileSync(resolve(root,'scripts/statistics-v1/p03-f2b-security.sql'),'utf8').replaceAll("'statistics_v1_summary_candidate']","'statistics_v1_summary_candidate','statistics_v1_summary_d1_candidate']");
  else{
   const prepared=readFileSync(resolve(root,'docs/estadisticas-v1/p03-f3b/differential-three-readers.sql'),'utf8');
   const begin=prepared.indexOf('set local role authenticated;'),end=prepared.lastIndexOf('reset role;');
   const initial=prepared.slice(0,begin)+"SELECT set_config('statistics.d1.all_actors',current_setting('statistics.d1.actors'),true);";
   const one=prepared.slice(begin,end).replace('is distinct from 6','is distinct from 1').replaceAll('current_date',"((statement_timestamp() at time zone (SELECT timezone FROM public.business_settings WHERE business_id=(actor->>'business')::uuid))::date)");
   test=initial+Array.from({length:6},(_,i)=>['today','yesterday','this_week','this_month','previous_month','last_7_days','last_30_days','custom'].flatMap(period=>['units','amount'].map(sort=>{
    const chunk=one.replace("array['today','yesterday','this_week','this_month','previous_month','last_7_days','last_30_days','custom']",`array['${period}']`).replace("array['units','amount']",`array['${sort}']`);
    return `RESET ROLE;SELECT set_config('statistics.d1.actors',jsonb_build_array(current_setting('statistics.d1.all_actors')::jsonb->${i})::text,true);${chunk}RESET ROLE;`;
   })).join('\n')).join('\n');
   test+="RESET ROLE;SELECT set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('statistics.f2b.actor'),'role','authenticated')::text,true);";
   if(variant==='shapes')test+=triple(readFileSync(resolve(root,'scripts/statistics-v1/p03-f2b-state-tests.sql'),'utf8'));
   if(variant==='temporal')test+=triple(readFileSync(resolve(root,'scripts/statistics-v1/p03-f2b-differential.sql'),'utf8').split('-- A partial verified exposure.')[1].replace(/^/,'-- A partial verified exposure.'))+triple(readFileSync(resolve(root,'scripts/statistics-v1/p03-f2b-dst-tests.sql'),'utf8'));
   if(variant==='edges')test=readFileSync(resolve(root,'scripts/statistics-v1/p03-f3c-edges.sql'),'utf8');
  }
  const args=variant==='temporal'?"'custom','2026-04-05','2026-04-05'":"'last_30_days'";
  const outputPair=action==='differential'?`RESET ROLE;SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('statistics.f2b.actor'),'role','authenticated')::text,true);SELECT json_build_object('expectedBusinessId',(SELECT business_id FROM public.profiles WHERE id=auth.uid()),'original',public.statistics_v1_summary(${args}),'candidate',private.statistics_v1_summary_candidate(${args}),'d1',private.statistics_v1_summary_d1_candidate(${args}));`:'';
  try{
   const output=await sqlTest(prefix+fixture+contexts+test+outputPair+'RESET ROLE;ROLLBACK;');assert.ok(output.trim().endsWith('ROLLBACK'));assert.deepEqual(fullCatalog().counts,baseline.catalog.counts);assert.deepEqual(extraFingerprint(),baseline.extra);
   if(action==='differential'){
    const pair=JSON.parse(output.split(/\r?\n/).find(l=>l.startsWith('{"expectedBusinessId"')));assert.deepEqual(pair.original,pair.candidate);assert.deepEqual(pair.candidate,pair.d1);
    save(`pairs-${variant}.json`,[pair]);save(`decode-d1-${variant}.json`,[{expectedBusinessId:pair.expectedBusinessId,original:pair.original,candidate:pair.d1}]);
    for(const f of [`pairs-${variant}.json`,`decode-d1-${variant}.json`])run(process.execPath,['node_modules/tsx/dist/cli.mjs','scripts/statistics-v1/p03-f2a-decode.verify.ts',resolve(dir,f)]);
   }
   save(`${action}${variant==='base'?'':'-'+variant}.json`,{result:'PASS',variant,output,cleanupVerified:true,triples:action==='differential',decoder:action==='differential'?'PASS':'NA'});console.log(`PASS ${action}/${variant}; RR rollback and cleanup verified.`);
  }catch(e){save(`${action}${variant==='base'?'':'-'+variant}.json`,{result:'FAIL',error:e.stderr??String(e),output:e.stdout,cleanupVerified:JSON.stringify(fullCatalog().counts)===JSON.stringify(baseline.catalog.counts)});console.log(`FAIL ${action}/${variant}; stopped, no candidate correction`);process.exit(1);}
 }else{
  const installed=JSON.parse(readFileSync(resolve(dir,'installed-catalog.json'))).catalog;assert.deepEqual(catalog,installed);assert.deepEqual(extraFingerprint(),baseline.extra);
  save('preservation.json',{at:new Date().toISOString(),result:'PASS',isolation,ledgerCount:catalog.ledger.length,originalCatalogAndABUnchanged:true,D1Unchanged:true,ACLAndRLSUnchanged:true,preexistingFileCount:Object.keys(baseline.files).length,counts:catalog.counts,extra:baseline.extra,publicOriginalActive:true,candidateHash:d1Hash,deadlocks:catalog.deadlocks});console.log('PASS final identity/catalog/ACL/RLS/data/file preservation.');
 }
}
