/** Exact owner-approved hash only; fixed isolated Docker target, no URLs or environment credentials. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { reviewBundle } from './review-bundle.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)), dir=resolve(root,'docs/estadisticas-v1/p03-b');
const runtime=resolve(root,'supabase/statistics-v1-test/.runtime');
const file='supabase/migrations/20261013004000_statistics_v1_comparative_series.sql';
const approved='b10c330adff70b803d9d25165f07830e90d4cd092aa4ba2cf3d0120a43f95219',version='20261013004000';
const project='orderops-statistics-v1-test-74718de66a41';
const action=process.argv[2];assert.ok(['preflight','apply','tests','inventory','concurrency','performance','paired','api'].includes(action));
mkdirSync(dir,{recursive:true});
const digest=x=>createHash('sha256').update(x).digest('hex');
const source=readFileSync(resolve(root,file),'utf8');assert.equal(digest(readFileSync(resolve(root,file))),approved);
function run(bin,args,input){const r=spawnSync(bin,args,{cwd:root,input,encoding:'utf8',timeout:60000,maxBuffer:32*1024*1024});if(r.error||r.status!==0)throw Object.assign(new Error(`${bin} failed`),{stdout:r.stdout??'',stderr:r.stderr??''});return r.stdout.trim();}
assert.equal(run('git',['branch','--show-current']),'codex/estadisticas-v1');
assert.equal(run('git',['rev-parse','--show-toplevel']).replaceAll('\\','/').toLowerCase(),root.replaceAll('\\','/').replace(/\/$/,'').toLowerCase());
run(process.execPath,['scripts/statistics-v1/isolation-policy.verify.mjs']);
run(process.execPath,['scripts/statistics-v1/assert-isolated-target.mjs']);
const m=JSON.parse(readFileSync(resolve(runtime,'manifest.json'),'utf8'));assert.equal(m.projectId,project);
const sql=text=>run('docker',['exec','-i',`supabase_db_${project}`,'psql','-X','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-At'],text);
const read=q=>sql(`BEGIN READ ONLY;${q};COMMIT;`).split(/\r?\n/).filter(s=>!['BEGIN','COMMIT'].includes(s)).join('\n');
const ownNames=run('docker',['ps','-a','--filter',`label=com.supabase.cli.project=${project}`,'--format','{{.Names}}']).split(/\r?\n/);
assert.equal(ownNames.length,5);
const containers=JSON.parse(run('docker',['container','inspect',...ownNames]));
assert.equal(m.resources.volumeNames.length,2);
assert.deepEqual(containers.map(c=>c.Id).sort(),m.resources.containerIds);
for(const c of containers){assert.ok(c.State.Running);if(c.State.Health)assert.equal(c.State.Health.Status,'healthy');}
const ledger=JSON.parse(read("SELECT coalesce(json_agg(json_build_object('version',version,'name',name,'statements',statements) ORDER BY version),'[]') FROM supabase_migrations.schema_migrations"));
const p2=readdirSync(resolve(root,'supabase/migrations')).filter(f=>/^2026101300[123]000_statistics_v1_.*\.sql$/.test(f)).sort();assert.equal(p2.length,3);
const expected=[...m.migrations.map(f=>f.name.slice(0,14)),...p2.map(f=>f.slice(0,14))].sort();
assert.deepEqual(ledger.filter(l=>l.version!==version).map(l=>l.version),expected);assert.equal(expected.length,122);
const require=createRequire(import.meta.url);const {parse}=require('../../supabase/statistics-v1-test/.runtime/sql-tools/node_modules/pgsql-parser');
const semantic=x=>JSON.stringify(x,(k,v)=>['location','stmt_location','stmt_len'].includes(k)?undefined:v);
for(const record of ledger.filter(l=>l.version!==version)){
  const base=m.migrations.find(f=>f.name.startsWith(record.version+'_'));
  const path=base?resolve(runtime,'supabase/migrations',base.name):resolve(root,'supabase/migrations',p2.find(f=>f.startsWith(record.version+'_')));
  const body=readFileSync(path,'utf8');if(base)assert.equal(digest(readFileSync(path)),base.sha256);
  if(!body.trim()){assert.ok(record.statements===null || record.statements.length===0,`Unexpected source in empty migration ${record.version}`);}
  else assert.equal(semantic(await parse((record.statements??[]).join('\n;\n'))),semantic(await parse(body)),`Installed source mismatch ${record.version}`);
}
assert.equal(read(`SELECT token='${m.token}' FROM statistics_test_environment.identity WHERE singleton`),'t');
const refs=run('git',['for-each-ref','--format=%(refname)','refs/heads','refs/remotes']).split(/\r?\n/).filter(Boolean);
for(const ref of refs){if(ref==='refs/heads/codex/estadisticas-v1')continue;assert.ok(!run('git',['ls-tree','-r','--name-only',ref,'--','supabase/migrations']).includes(version+'_'));}
const evidence={at:new Date().toISOString(),hash:approved,projectId:project,api:'127.0.0.1:56321',db:'127.0.0.1:56322',baseline119AndPhase02SourceEquivalent:true,ledgerVersions:ledger.map(l=>l.version),knownRefs:refs,resources:m.resources,containers:containers.map(c=>({id:c.Id,name:c.Name,running:c.State.Running,health:c.State.Health?.Status??'no-healthcheck',ports:c.NetworkSettings.Ports,networks:Object.keys(c.NetworkSettings.Networks)})),privateIdentityMatches:true};
const catalog=()=>JSON.parse(read(`SELECT json_build_object('functions',(SELECT json_agg(json_build_object('schema',n.nspname,'name',p.proname,'signature',pg_get_function_identity_arguments(p.oid),'defaults',pg_get_expr(p.proargdefaults,0),'return',pg_get_function_result(p.oid),'language',l.lanname,'invoker',not p.prosecdef,'volatility',p.provolatile,'acl',p.proacl::text,'definition',pg_get_functiondef(p.oid))) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace JOIN pg_language l ON l.oid=p.prolang WHERE p.proname LIKE 'statistics_%'),'policies',(SELECT json_agg(row_to_json(t)) FROM pg_policies t WHERE policyname LIKE 'statistics_%'),'tables',(SELECT json_agg(json_build_object('name',c.relname,'rls',c.relrowsecurity)) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND c.relname LIKE '%statistics%'),'checkFunctionBodies',current_setting('check_function_bodies'),'orders',(SELECT count(*) FROM public.orders),'sessions',(SELECT count(*) FROM public.store_sessions),'products',(SELECT count(*) FROM public.products),'completions',(SELECT count(*) FROM public.order_statistics_completions),'deadlocks',(SELECT deadlocks FROM pg_stat_database WHERE datname=current_database()))`));
if(action==='preflight'){
  assert.equal(ledger.length,122);const inventory=catalog();assert.equal(inventory.orders,0);assert.equal(inventory.sessions,0);assert.equal(inventory.products,0);
  writeFileSync(resolve(dir,'live-before.json'),JSON.stringify({...evidence,inventory},null,2)+'\n');console.log('PASS live preflight: 5 exclusive healthy/running containers, 2 volumes, API56321/DB56322, marker, exact installed baseline119+Phase02 sources, approved hash.');
}else if(action==='apply'){
  assert.equal(ledger.length,122,'No reapplication');
  assert.ok(source.endsWith('commit;\r\n')||source.endsWith('commit;\n'));
  const prefix=source.replace(/commit;\s*$/,'');
  const before=catalog();
  // Exercise exact DDL in an aborted transaction; no new hash/version is executed.
  let failed=false;try{sql(prefix+'\nSELECT 1/0;COMMIT;');}catch(error){assert.ok(error.stderr.includes('division by zero'));failed=true;}
  assert.ok(failed);assert.deepEqual(catalog(),before,'Atomic failed-install rollback');
  assert.equal(read(`SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version='${version}'`),'0');
  const encoded=Buffer.from(source).toString('base64');
  try{sql(prefix+`\nINSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES('${version}','statistics_v1_comparative_series',ARRAY[convert_from(decode('${encoded}','base64'),'UTF8')]);COMMIT;`);}catch(error){writeFileSync(resolve(dir,'installation.json'),JSON.stringify({result:'FAIL',hash:approved,error:error.stderr.replaceAll(m.token,'[identity-token]'),atomicRollback:true,at:new Date().toISOString()},null,2));throw error;}
  writeFileSync(resolve(dir,'installation.json'),JSON.stringify({result:'PASS',hash:approved,atomicErrorProbe:'PASS: forced division-by-zero reverted entire catalog; ledger absent',at:new Date().toISOString()},null,2)+'\n');console.log('PASS exact migration installed transactionally; failed-install rollback probe PASS.');
}else if(action==='tests'){
  assert.equal(ledger.length,123);const record=ledger.find(l=>l.version===version);assert.equal(digest(record.statements[0]),approved);
  const results=[];
  for(const name of ['phase03-series.sql','capture-metrics.sql','security-money.sql','regression.sql']){
    const body=readFileSync(resolve(root,'supabase/tests/statistics-v1',name),'utf8');const start=Date.now();
    try{const out=sql(`SET statistics.test_token='${m.token}';SET statistics.p03b_approved='true';`+body);results.push({name,hash:digest(body),result:'PASS',elapsedMs:Date.now()-start,rollback:out.endsWith('ROLLBACK')});console.log(`PASS ${name}`);}
    catch(error){results.push({name,hash:digest(body),result:'FAIL',elapsedMs:Date.now()-start,error:error.stderr.replaceAll(m.token,'[identity-token]'),connectionClosedRollback:true});writeFileSync(resolve(dir,'sql-tests.json'),JSON.stringify({at:new Date().toISOString(),results},null,2)+'\n');console.log(`FAIL ${name}; stopped. See sql-tests.json.`);process.exitCode=1;break;}
  }
  writeFileSync(resolve(dir,'sql-tests.json'),JSON.stringify({at:new Date().toISOString(),results},null,2)+'\n');
}else if(action==='concurrency'){
  assert.equal(ledger.length,123);assert.equal(digest(ledger.find(l=>l.version===version).statements[0]),approved);
  writeFileSync(resolve(runtime,'p03-b-approval.local.json'),JSON.stringify({approvedByOwner:true,allowWriteTests:true,projectId:project,migrationSha256:approved,reviewedBundleHash:reviewBundle().bundleHash,scope:'P03-B isolated validation under express resumed authorization'},null,2));
  console.log(run(process.execPath,['scripts/statistics-v1/p03-b-concurrency.mjs','concurrency']));
}else if(action==='api'){
  assert.equal(ledger.length,123);assert.equal(digest(ledger.find(l=>l.version===version).statements[0]),approved);
  console.log(run(process.execPath,['scripts/statistics-v1/p03-b-api.verify.mjs']));
}else if(action==='paired'){
  assert.equal(ledger.length,123);assert.equal(digest(ledger.find(l=>l.version===version).statements[0]),approved);
  const start=Date.now();let result;
  try{const out=sql(`SET statistics.test_token='${m.token}';`+readFileSync(resolve(root,'supabase/tests/statistics-v1/p03-b-paired-series.sql'),'utf8'));result={result:'PASS',elapsedMs:Date.now()-start,rollback:out.endsWith('ROLLBACK')};}
  catch(error){result={result:'FAIL',error:error.stderr.replaceAll(m.token,'[identity-token]'),rollbackOnConnectionClose:true};process.exitCode=1;}
  writeFileSync(resolve(dir,'paired-series.json'),JSON.stringify(result,null,2)+'\n');console.log(`${result.result} paired nonempty nocturnal series.`);
}else if(action==='performance'){
  assert.equal(ledger.length,123);assert.equal(digest(ledger.find(l=>l.version===version).statements[0]),approved);
  const start=Date.now();const out=sql(`SET statistics.test_token='${m.token}';`+readFileSync(resolve(root,'supabase/tests/statistics-v1/p03-b-performance.sql'),'utf8'));
  writeFileSync(resolve(dir,'performance.json'),JSON.stringify({at:new Date().toISOString(),result:'PASS',elapsedMs:Date.now()-start,output:out.replaceAll(m.token,'[identity-token]'),rollback:out.endsWith('ROLLBACK'),maximumSyntheticOrders:200},null,2)+'\n');console.log('PASS bounded synthetic performance test and rollback.');
}else{
  assert.equal(ledger.length,123);assert.equal(digest(ledger.find(l=>l.version===version).statements[0]),approved);
  const inventory=catalog();
  const details=JSON.parse(read(`SELECT json_build_object(
    'triggers',(SELECT json_agg(pg_get_triggerdef(oid)) FROM pg_trigger WHERE tgname LIKE 'statistics_v1_%'),
    'privileges',(SELECT json_agg(json_build_object('role',r,'function',f,'execute',has_function_privilege(r,f,'EXECUTE'))) FROM unnest(array['anon','authenticated','service_role']) r CROSS JOIN unnest(array['public.statistics_v1_summary(text,date,date,text,integer,jsonb)','private.statistics_v1_summary_base(text,date,date,text,integer,jsonb)','private.statistics_v1_series_response(text,date,date,text,integer,jsonb)','private.statistics_v1_series_delta(jsonb,jsonb,boolean,text)','private.statistics_v1_series_instant(timestamptz)']) f),
    'fixtureCounts',(SELECT json_build_object('businesses',(SELECT count(*) FROM public.businesses),'profiles',(SELECT count(*) FROM public.profiles),'categories',(SELECT count(*) FROM public.categories),'stockMovements',(SELECT count(*) FROM public.stock_movements),'items',(SELECT count(*) FROM public.order_items),'financials',(SELECT count(*) FROM public.order_financials),'completionItems',(SELECT count(*) FROM public.order_statistics_completion_items),'itemSnapshots',(SELECT count(*) FROM public.order_item_statistics_snapshots),'sessionSnapshots',(SELECT count(*) FROM public.store_session_statistics_snapshots),'auditEvents',(SELECT count(*) FROM public.finance_audit_events)))
  )`));
  assert.equal(inventory.orders,0);assert.equal(inventory.sessions,0);assert.equal(inventory.products,0);assert.equal(inventory.completions,0);
  assert.equal(inventory.tables.length,5);assert.ok(inventory.tables.every(t=>t.rls));assert.equal(inventory.policies.length,5);assert.equal(details.triggers.length,8);
  assert.ok(details.privileges.every(p=>p.execute===(p.role==='authenticated')));
  writeFileSync(resolve(dir,'live-after.json'),JSON.stringify({...evidence,inventory,details},null,2)+'\n');console.log(JSON.stringify({functionCount:inventory.functions.length,orders:inventory.orders,sessions:inventory.sessions,products:inventory.products,completions:inventory.completions,deadlocks:inventory.deadlocks,fixtureCounts:details.fixtureCounts}));
}
