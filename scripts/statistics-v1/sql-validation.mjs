/** Authorized isolated validation only. Never uses a URL, shared config, reset or remote DB. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { reviewBundle } from './review-bundle.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)), runtime=resolve(root,'supabase/statistics-v1-test/.runtime');
const action=process.argv[2];assert.ok(['preflight','apply','inventory','refresh-review','recover-stock-fixture'].includes(action));
function run(bin,args,input){const r=spawnSync(bin,args,{cwd:root,input,encoding:'utf8',timeout:60000,maxBuffer:8*1024*1024});if(r.status!==0){writeFileSync(resolve(runtime,'sql-validation-failure.local.log'),r.stdout+'\n'+r.stderr);throw new Error(`${bin} failed; see ignored sql-validation-failure.local.log`);}return r.stdout.trim();}
assert.equal(run('git',['branch','--show-current']),'codex/estadisticas-v1');
assert.equal(run('git',['rev-parse','--show-toplevel']).replaceAll('\\','/').toLowerCase(),root.replaceAll('\\','/').replace(/\/$/,'').toLowerCase());
run(process.execPath,[resolve(root,'scripts/statistics-v1/isolation-policy.verify.mjs')]);
run(process.execPath,[resolve(root,'scripts/statistics-v1/assert-isolated-target.mjs')]);
const m=JSON.parse(readFileSync(resolve(runtime,'manifest.json'),'utf8'));
const sql=source=>run('docker',['exec','-i',`supabase_db_${m.projectId}`,'psql','-X','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-At'],source);
const read=source=>sql(`BEGIN READ ONLY;${source};COMMIT;`).split(/\r?\n/).filter(x=>!['BEGIN','COMMIT'].includes(x));
assert.equal(read(`SELECT token='${m.token}' FROM statistics_test_environment.identity WHERE singleton`).join(''),'t');
const files=readdirSync(resolve(root,'supabase/migrations')).filter(x=>/^2026101300[123]000_statistics_v1_.*[.]sql$/.test(x)).sort();assert.equal(files.length,3);
const versions=files.map(x=>x.slice(0,14));assert.ok(versions.every(v=>v>m.migrations.at(-1).name.slice(0,14)));
const refs=run('git',['for-each-ref','--format=%(refname)','refs/heads','refs/remotes']).split(/\r?\n/).filter(Boolean);
for(const ref of refs){if(ref==='refs/heads/codex/estadisticas-v1')continue;const paths=run('git',['ls-tree','-r','--name-only',ref,'--','supabase/migrations']);assert.ok(!paths.split(/\r?\n/).some(p=>versions.includes(p.split('/').at(-1).slice(0,14))),`Version collision in ${ref}`);}
const ledger=read('SELECT version FROM supabase_migrations.schema_migrations ORDER BY version').filter(x=>/^\d{14}$/.test(x));
assert.deepEqual(ledger.filter(v=>!versions.includes(v)),m.migrations.map(x=>x.name.slice(0,14)).sort());
const sessions=JSON.parse(read("SELECT coalesce(json_agg(json_build_object('application',application_name,'client',client_addr::text,'state',state)),'[]') FROM pg_stat_activity WHERE datname=current_database()").join(''));
const evidence={verifiedAt:new Date().toISOString(),projectId:m.projectId,branch:'codex/estadisticas-v1',api:'127.0.0.1:56321',postgres:'127.0.0.1:56322',resources:m.resources,tokenMatches:true,baseMigrations:119,statisticsVersions:ledger.filter(v=>versions.includes(v)),knownRefsChecked:refs,sessions,writeTarget:'fixed exclusive Docker container; no remote credentials/configuration loaded',reviewBundle:reviewBundle()};
if(action==='recover-stock-fixture'){
  const receipt=JSON.parse(readFileSync(resolve(runtime,'sql-review-approval.local.json'),'utf8'));assert.equal(receipt.approvedByOwner,true);assert.equal(receipt.projectId,m.projectId);
  sql(`SET statistics.test_token='${m.token}';`+readFileSync(resolve(root,'supabase/tests/statistics-v1/stock-fixture-recovery.sql'),'utf8'));console.log('Recovered exact isolated synthetic stock fixture; existing operational schema untouched.');
}else if(action==='refresh-review'){
  const path=resolve(runtime,'sql-review-approval.local.json');const old=JSON.parse(readFileSync(path,'utf8'));assert.equal(old.approvedByOwner,true);assert.equal(old.projectId,m.projectId);
  writeFileSync(path,JSON.stringify({...old,reviewedBundleHash:reviewBundle().bundleHash,previousBundleHash:old.reviewedBundleHash,correctionsAuthorizedByOwner:true,updatedAt:new Date().toISOString()},null,2));
  console.log('Recorded corrected owned test bundle under express isolated-correction authorization.');
}else if(action==='preflight'){
  assert.equal(ledger.length,119);assert.equal(read('SELECT count(*) FROM public.orders').join(''),'0');
  const original=JSON.parse(readFileSync(resolve(root,'docs/estadisticas-v1/fase-02-evidencia.json'),'utf8'));
  assert.equal(reviewBundle().bundleHash,original.reviewBundle.bundleHash,'Proposed bundle changed before initial application');
  writeFileSync(resolve(root,'docs/estadisticas-v1/validacion-sql-antes.json'),JSON.stringify(evidence,null,2)+'\n');
  writeFileSync(resolve(runtime,'sql-review-approval.local.json'),JSON.stringify({approvedByOwner:true,allowWriteTests:true,projectId:m.projectId,reviewedBundleHash:reviewBundle().bundleHash,scope:'User expressly authorizes isolated SQL validation and corrections; no integration or Phase03',recordedAt:new Date().toISOString()},null,2));
  console.log('PASS preflight: exact worktree/branch, adversarial isolation, API56321/DB56322, baseline119, no known version collisions.');
}else if(action==='apply'){
  const receipt=JSON.parse(readFileSync(resolve(runtime,'sql-review-approval.local.json'),'utf8'));assert.equal(receipt.approvedByOwner,true);assert.equal(receipt.projectId,m.projectId);assert.equal(receipt.reviewedBundleHash,reviewBundle().bundleHash);
  const applied=[];
  for(const name of files){const version=name.slice(0,14);if(ledger.includes(version)){console.log(`Already applied ${version}; no rerun`);continue;}
    const source=readFileSync(resolve(root,'supabase/migrations',name),'utf8');
    const encoded=Buffer.from(source).toString('base64');
    sql(`BEGIN;SET LOCAL lock_timeout='5s';SET LOCAL statement_timeout='45s';${source}\nINSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES('${version}','${name.slice(15,-4)}',ARRAY[convert_from(decode('${encoded}','base64'),'UTF8')]);COMMIT;`);
    applied.push(name);console.log(`PASS applied transactionally: ${name}`);
    writeFileSync(resolve(runtime,'statistics-applied.local.json'),JSON.stringify({applied,reviewBundle:reviewBundle(),at:new Date().toISOString()},null,2));
  }
}else{
  const inventory=JSON.parse(read(`SELECT json_build_object(
  'functionBodyChecks',current_setting('check_function_bodies'),
  'migrationRecords',(SELECT json_agg(json_build_object('version',version,'name',name,'sourceMd5',md5(statements[1]))) FROM supabase_migrations.schema_migrations WHERE version IN ('20261013001000','20261013002000','20261013003000')),
  'tables',(SELECT json_agg(json_build_object('name',c.relname,'rls',c.relrowsecurity)) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND c.relname LIKE '%statistics%'),
  'functions',(SELECT json_agg(json_build_object('schema',n.nspname,'name',p.proname,'arguments',pg_get_function_identity_arguments(p.oid),'language',l.lanname,'securityDefiner',p.prosecdef,'acl',p.proacl::text)) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace JOIN pg_language l ON l.oid=p.prolang WHERE p.proname LIKE 'statistics_%'),
  'triggers',(SELECT json_agg(pg_get_triggerdef(oid)) FROM pg_trigger WHERE tgname LIKE 'statistics_v1_%'),
  'policies',(SELECT json_agg(row_to_json(p)) FROM pg_policies p WHERE policyname LIKE 'statistics_%'),
  'views',(SELECT json_agg(json_build_object('name',c.relname,'options',c.reloptions,'definition',pg_get_viewdef(c.oid))) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='v' AND c.relname='statistics_v1_effective_facts'),
  'indexes',(SELECT json_agg(indexdef) FROM pg_indexes WHERE tablename IN ('business_statistics_state','store_session_statistics_snapshots','order_item_statistics_snapshots','order_statistics_completions','order_statistics_completion_items')),
  'constraints',(SELECT json_agg(json_build_object('table',conrelid::regclass::text,'definition',pg_get_constraintdef(oid))) FROM pg_constraint WHERE conrelid IN (SELECT c.oid FROM pg_class c WHERE c.relname LIKE '%statistics%')),
  'grants',(SELECT json_agg(row_to_json(g)) FROM information_schema.role_table_grants g WHERE table_name LIKE '%statistics%'),
  'orders',(SELECT count(*) FROM public.orders),'products',(SELECT count(*) FROM public.products),'sessions',(SELECT count(*) FROM public.store_sessions),'stockMovements',(SELECT count(*) FROM public.stock_movements),
  'syntheticSettings',(SELECT json_agg(json_build_object('slug',b.slug,'onDemand',s.on_demand_mode_active,'scheduled',s.scheduled_mode_active)) FROM public.business_settings s JOIN public.businesses b ON b.id=s.business_id),
  'deadlocks',(SELECT deadlocks FROM pg_stat_database WHERE datname=current_database()))`).join(''));
  assert.equal(inventory.tables.length,5);assert.equal(inventory.triggers.length,8);assert.equal(inventory.policies.length,5);assert.ok(inventory.tables.every(t=>t.rls));
  assert.equal(inventory.orders,0);assert.equal(inventory.products,0);assert.equal(inventory.sessions,0);assert.equal(inventory.stockMovements,0);assert.equal(inventory.deadlocks,0);
  assert.equal(inventory.functionBodyChecks,'on');
  for(const item of inventory.migrationRecords){const name=files.find(f=>f.startsWith(item.version));assert.equal(item.sourceMd5,createHash('md5').update(readFileSync(resolve(root,'supabase/migrations',name))).digest('hex'),'Applied SQL source differs from owned file');}
  assert.deepEqual(evidence.resources,JSON.parse(readFileSync(resolve(root,'docs/estadisticas-v1/validacion-sql-antes.json'),'utf8')).resources,'Exclusive resources changed');
  writeFileSync(resolve(root,'docs/estadisticas-v1/validacion-sql-despues.json'),JSON.stringify({...evidence,inventory},null,2)+'\n');
  console.log(JSON.stringify({tables:inventory.tables?.length,functions:inventory.functions?.length,triggers:inventory.triggers?.length,policies:inventory.policies?.length,statisticsVersions:evidence.statisticsVersions,orders:inventory.orders,deadlocks:inventory.deadlocks}));
}
