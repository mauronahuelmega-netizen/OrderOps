// Exact approved candidate, one isolated target; no migration CLI or automatic repairs.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {spawnSync,execFileSync} from 'node:child_process';import {createRequire} from 'node:module';
const root=process.cwd(),dir='docs/estadisticas-v1/p03-f2b';fs.mkdirSync(dir,{recursive:true});
const file='supabase/migrations/20261013005000_statistics_v1_read_core_candidate.sql',approved='fd88de8c0ec3f4a87d8a6782650d63cf4779d8170033a4c5b4f37edbd489faf9',version='20261013005000';
const project='orderops-statistics-v1-test-74718de66a41';const action=process.argv[2];assert.ok(['preflight','apply','security','differential','finish'].includes(action));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');assert.equal(sha(file),approved);
const run=(bin,args,input)=>{const r=spawnSync(bin,args,{input,encoding:'utf8',timeout:60000,maxBuffer:40*1024*1024});if(r.status!==0||r.error)throw Object.assign(Error(`${bin} failed`),{stdout:r.stdout??'',stderr:r.stderr??''});return r.stdout.trim();};
const git=(...args)=>run('git',['--no-optional-locks',...args]);assert.equal(git('branch','--show-current'),'codex/estadisticas-v1');assert.ok(git('rev-parse','--show-toplevel').replaceAll('\\','/').endsWith('/OrderOps-Estadisticas'));
run(process.execPath,['scripts/statistics-v1/isolation-policy.verify.mjs']);const live=JSON.parse(run(process.execPath,['scripts/statistics-v1/assert-isolated-target.mjs']));assert.equal(live.projectId,project);
const manifest=JSON.parse(fs.readFileSync('supabase/statistics-v1-test/.runtime/manifest.json'));assert.equal(manifest.projectId,project);
const sql=q=>run('docker',['exec','-i',`supabase_db_${project}`,'psql','-X','-U','postgres','-d','postgres','-At','-v','ON_ERROR_STOP=1'],q);
const read=q=>JSON.parse(sql(`BEGIN READ ONLY;${q};COMMIT;`).split(/\r?\n/).find(l=>l.startsWith('{')||l.startsWith('[')));
const catalog=()=>read(`SELECT json_build_object(
 'functions',(SELECT json_agg(json_build_object('schema',n.nspname,'name',p.proname,'signature',pg_get_function_identity_arguments(p.oid),'defaults',pg_get_expr(p.proargdefaults,0),'invoker',not p.prosecdef,'volatility',p.provolatile,'config',p.proconfig,'acl',p.proacl::text,'definition',pg_get_functiondef(p.oid)) ORDER BY n.nspname,p.proname) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE p.proname LIKE 'statistics_%'),
 'policies',(SELECT json_agg(row_to_json(t) ORDER BY schemaname,tablename,policyname) FROM pg_policies t WHERE schemaname='public'),
 'indexes',(SELECT json_agg(row_to_json(t) ORDER BY schemaname,tablename,indexname) FROM pg_indexes t WHERE schemaname='public'),
 'constraints',(SELECT json_agg(json_build_object('table',c.conrelid::regclass::text,'name',c.conname,'definition',pg_get_constraintdef(c.oid)) ORDER BY c.conrelid,c.conname) FROM pg_constraint c WHERE c.conrelid IN ('public.profiles'::regclass,'public.orders'::regclass,'public.order_financials'::regclass,'public.order_statistics_completions'::regclass)),
 'counts',json_build_object('orders',(SELECT count(*) FROM public.orders),'items',(SELECT count(*) FROM public.order_items),'financials',(SELECT count(*) FROM public.order_financials),'audit',(SELECT count(*) FROM public.finance_audit_events),'sessions',(SELECT count(*) FROM public.store_sessions),'sessionSnapshots',(SELECT count(*) FROM public.store_session_statistics_snapshots),'completions',(SELECT count(*) FROM public.order_statistics_completions),'completionItems',(SELECT count(*) FROM public.order_statistics_completion_items),'identitySnapshots',(SELECT count(*) FROM public.order_item_statistics_snapshots)),
 'profileFingerprint',(SELECT md5(string_agg(id::text||coalesce(business_id::text,'NULL')||role,',' ORDER BY id)) FROM public.profiles),
 'ledger',(SELECT json_agg(json_build_object('version',version,'md5',md5(array_to_string(statements,E'\\n;\\n'))) ORDER BY version) FROM supabase_migrations.schema_migrations),
 'checkFunctionBodies',current_setting('check_function_bodies'),'deadlocks',(SELECT deadlocks FROM pg_stat_database WHERE datname=current_database()))`);
const originals=JSON.parse(fs.readFileSync('docs/estadisticas-v1/p03-f1/baseline.json')).migrations;
for(const item of originals)assert.equal(sha(item.path),item.sha256);
const require=createRequire(import.meta.url);const {parse}=require('../../supabase/statistics-v1-test/.runtime/sql-tools/node_modules/pgsql-parser');
const source=fs.readFileSync(file,'utf8');await parse(source); // Existing offline parser; not a database connection.
const prefix=`SET statistics.test_token='${manifest.token}';`;
const candidateNames=['statistics_v1_read_core_candidate','statistics_v1_summary_base_candidate','statistics_v1_summary_candidate'];
if(action==='preflight'){
 const inventory=catalog();assert.equal(inventory.ledger.length,123);assert.ok(!inventory.functions.some(f=>candidateNames.includes(f.name)));assert.ok(Object.values(inventory.counts).every(n=>n===0));assert.equal(inventory.checkFunctionBodies,'on');
 const ledger=read("SELECT json_agg(json_build_object('version',version,'source',statements) ORDER BY version) FROM supabase_migrations.schema_migrations");
 const canonical=x=>JSON.stringify(x,(k,v)=>['location','stmt_location','stmt_len'].includes(k)?undefined:v);
 for(const item of manifest.migrations){const row=ledger.find(r=>r.version===item.name.slice(0,14));assert.ok(row);const body=fs.readFileSync(path.join('supabase/statistics-v1-test/.runtime/supabase/migrations',item.name),'utf8');assert.equal(sha(path.join('supabase/statistics-v1-test/.runtime/supabase/migrations',item.name)),item.sha256);if(body.trim())assert.equal(canonical(await parse(row.source?.join('\n;\n')??'')),canonical(await parse(body)));else assert.ok(!row.source?.length);}
 for(const item of originals){const row=ledger.find(r=>r.version===path.basename(item.path).slice(0,14));assert.ok(row);assert.equal(canonical(await parse(row.source?.join('\n;\n')??'')),canonical(await parse(fs.readFileSync(item.path,'utf8'))));}
 const files=git('ls-files','--cached','--others','--exclude-standard','-z').split('\0').filter(p=>p&&!p.startsWith(dir+'/')&&!p.startsWith('scripts/statistics-v1/p03-f2b-')&&fs.existsSync(p));
 fs.writeFileSync(`${dir}/baseline.json`,JSON.stringify({at:new Date().toISOString(),branch:git('branch','--show-current'),head:git('rev-parse','HEAD'),status:git('status','--short'),hash:approved,live,resources:manifest.resources,api:'127.0.0.1:56321',db:'127.0.0.1:56322',baselineSourcesVerified:true,catalog:inventory,files:Object.fromEntries(files.map(p=>[p,sha(p)]))},null,2));console.log('PASS preflight: exact 123 installed sources, approved hash, isolated project and original catalog recorded');
}else{
 const baseline=JSON.parse(fs.readFileSync(`${dir}/baseline.json`));assert.equal(git('rev-parse','HEAD'),baseline.head);for(const [p,h]of Object.entries(baseline.files))assert.equal(sha(p),h,`Preexisting changed ${p}`);
 if(action==='apply'){
  assert.deepEqual(catalog(),baseline.catalog);assert.ok(source.trimEnd().endsWith('commit;'));
  const body=source.replace(/commit;\s*$/,'');const encoded=Buffer.from(source).toString('base64');
  try{const result=sql(body+`\nINSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES('${version}','statistics_v1_read_core_candidate',ARRAY[convert_from(decode('${encoded}','base64'),'UTF8')]);COMMIT;`);fs.writeFileSync(`${dir}/installation.json`,JSON.stringify({result:'PASS',hash:approved,transactional:true,output:result},null,2));}
  catch(error){const after=catalog();assert.deepEqual(after,baseline.catalog);fs.writeFileSync(`${dir}/installation.json`,JSON.stringify({result:'FAIL',hash:approved,error:error.stderr,atomicRollbackVerified:true},null,2));console.log('FAIL compilation/install; atomic rollback verified; no automatic repair');process.exit(1);}
  const after=catalog();assert.deepEqual(after.functions.filter(f=>!candidateNames.includes(f.name)),baseline.catalog.functions);assert.deepEqual(after.policies,baseline.catalog.policies);assert.deepEqual(after.indexes,baseline.catalog.indexes);assert.deepEqual(after.counts,baseline.catalog.counts);
  const functions=after.functions.filter(f=>candidateNames.includes(f.name));assert.equal(functions.length,3);assert.ok(functions.every(f=>f.invoker&&f.volatility==='s'&&f.acl.includes('authenticated=X')&&!/(?:\{|,)=X\//.test(f.acl)));
  fs.writeFileSync(`${dir}/installed-catalog.json`,JSON.stringify({result:'PASS',functions,originalsUnchanged:true,publicRoutingUnchanged:true,catalog:after},null,2));console.log('PASS installation; three candidate functions only, originals/public/ACL/policies/indexes unchanged');
 }else if(action==='security'||action==='differential'){
  assert.equal(JSON.parse(fs.readFileSync(`${dir}/installation.json`)).result,'PASS');
  if(action==='differential')assert.equal(JSON.parse(fs.readFileSync(`${dir}/security.json`)).result,'PASS');
  const variant=process.argv[3]??'base';assert.ok(['base','products','shapes','temporal','repro'].includes(variant));
  const count=variant==='repro'?Number(process.argv[4]):10;assert.ok(Number.isInteger(count)&&count>=1&&count<=10);
  let fixture=fs.readFileSync(variant==='shapes'?'scripts/statistics-v1/p03-f1-shapes-fixture.sql':'scripts/statistics-v1/p03-f1-fixture.sql','utf8').replaceAll('__N__',String(count));
  if(variant==='products'||variant==='repro'){
   const catalogFixture=`INSERT INTO public.categories(id,business_id,name) SELECT md5('F2B:category:'||n)::uuid,b.id,'Synthetic F2B category '||n FROM generate_series(1,${count}) n CROSS JOIN public.businesses b WHERE b.slug='statistics-synthetic-a';\nINSERT INTO public.products(id,business_id,category_id,name,price) SELECT md5('F2B:product:'||n)::uuid,b.id,md5('F2B:category:'||n)::uuid,'Synthetic F2B product '||n,10 FROM generate_series(1,${count}) n CROSS JOIN public.businesses b WHERE b.slug='statistics-synthetic-a';\n`;
   fixture=fixture.replace('insert into public.order_items(order_id,product_name,quantity,unit_price)',catalogFixture+'insert into public.order_items(order_id,product_name,quantity,unit_price,product_id)')
    .replace("'Synthetic diagnostic main',1,10 from generate_series", "'Synthetic diagnostic main',1,10,md5('F2B:product:'||n)::uuid from generate_series");
  }
  if(variant==='temporal')fixture+='\n'+fs.readFileSync('scripts/statistics-v1/p03-f2b-temporal-fixture.sql','utf8');
  let test=fs.readFileSync(`scripts/statistics-v1/p03-f2b-${action}.sql`,'utf8');
  if(action==='differential'&&variant==='shapes')test+='\n'+fs.readFileSync('scripts/statistics-v1/p03-f2b-state-tests.sql','utf8');
  if(action==='differential'&&variant==='temporal')test+='\n'+fs.readFileSync('scripts/statistics-v1/p03-f2b-dst-tests.sql','utf8');
  const credentials=JSON.parse(fs.readFileSync('supabase/statistics-v1-test/.runtime/credentials.local.json'));assert.equal(credentials.projectId,project);assert.equal(credentials.users.length,12);const ids=credentials.users.map(u=>{assert.match(u.id,/^[a-f0-9-]{36}$/i);return u.id;});
  const actorContext=`SELECT set_config('statistics.f2a.synthetic_actor_ids','{${ids.join(',')}}',true);`;
  const resultFile=variant==='base'?action:`${action}-${variant}${variant==='repro'?'-'+count:''}`;
  const pairArgs=variant==='temporal'?"'custom','2026-04-05','2026-04-05'":"'last_30_days'";
  const exportPair=action==='differential'?`\nSET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('statistics.f2b.actor'),'role','authenticated')::text,true);SELECT json_build_object('expectedBusinessId',(SELECT business_id FROM public.profiles WHERE id=auth.uid()),'original',public.statistics_v1_summary(${pairArgs}),'candidate',private.statistics_v1_summary_candidate(${pairArgs}));RESET ROLE;`:'';
  try{const result=sql(prefix+fixture+'\n'+actorContext+'\n'+test+exportPair+'\nRESET ROLE;ROLLBACK;');if(action==='differential'){const pair=JSON.parse(result.split(/\r?\n/).find(l=>l.startsWith('{"expectedBusinessId"')));fs.writeFileSync(`${dir}/pairs-${variant}.json`,JSON.stringify([pair],null,2));run(process.execPath,['node_modules/tsx/dist/cli.mjs','scripts/statistics-v1/p03-f2a-decode.verify.ts',`${dir}/pairs-${variant}.json`]);}fs.writeFileSync(`${dir}/${resultFile}.json`,JSON.stringify({result:'PASS',output:result,fixture:`${count} explicitly synthetic captured orders / ${variant}`,actualResponseDecoders:action==='differential'?'PASS':'NOT_APPLICABLE',cleanupVerified:JSON.stringify(catalog().counts)===JSON.stringify(baseline.catalog.counts)},null,2));console.log(`PASS ${action}/${variant}; rollback fixtures`);}
  catch(error){fs.writeFileSync(`${dir}/${resultFile}.json`,JSON.stringify({result:'FAIL',error:error.stderr,output:error.stdout,cleanupVerified:JSON.stringify(catalog().counts)===JSON.stringify(baseline.catalog.counts)},null,2));console.log(`FAIL ${action}/${variant}; evidence saved, certification stopped`);}
 }else{
  const after=catalog();assert.deepEqual(after.functions.filter(f=>!candidateNames.includes(f.name)),baseline.catalog.functions);for(const key of ['policies','indexes','constraints','counts','profileFingerprint','deadlocks'])assert.deepEqual(after[key],baseline.catalog[key],key);
  assert.deepEqual(after.functions.filter(f=>candidateNames.includes(f.name)),JSON.parse(fs.readFileSync(`${dir}/installed-catalog.json`)).functions);assert.deepEqual(after.ledger.filter(l=>l.version!==version),baseline.catalog.ledger);
  const extra=read("SELECT json_build_object('products',(SELECT count(*) FROM public.products),'categories',(SELECT count(*) FROM public.categories),'stockMovements',(SELECT count(*) FROM public.stock_movements))");assert.ok(Object.values(extra).every(n=>n===0));
  fs.writeFileSync(`${dir}/preservation.json`,JSON.stringify({at:new Date().toISOString(),live,resources:manifest.resources,hash:approved,preservedFiles:Object.keys(baseline.files).length,originalCatalogUnchanged:true,candidateDefinitionsUnchanged:true,originalLedgerSourcesUnchanged:true,fixturesAbsent:true,extraFixtureCounts:extra,publicOriginalActive:true,functionsInstalled:after.functions.filter(f=>candidateNames.includes(f.name)).map(f=>f.name),ledgerVersions:after.ledger.map(l=>l.version)},null,2));console.log('PASS final preservation/catalog/cleanup; public RPC originals remain active');
 }
}
