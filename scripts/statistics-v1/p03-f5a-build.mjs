// Offline only: no database, Docker, HTTP, credentials or installed objects are accessed.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { validateManifest, validateConfig, validateSigningKeys } from './isolation-policy.mjs';
const root=process.cwd(), out='docs/estadisticas-v1/p03-f5a/';
const hash=b=>createHash('sha256').update(b).digest('hex');
const read=p=>fs.readFileSync(p,'utf8');
const git=(...a)=>execFileSync('git',['--no-optional-locks',...a],{encoding:'utf8'}).trim();
assert.equal(path.basename(root),'OrderOps-Estadisticas');
assert.equal(git('branch','--show-current'),'codex/estadisticas-v1');
assert.equal(git('rev-parse','HEAD'),'923300265323d411c5c91b7935472d5423d228d2');
const abPath='supabase/migrations/20261013005000_statistics_v1_read_core_candidate.sql';
const d1Path='docs/estadisticas-v1/p03-f3b/candidate-d1.sql';
const expected={
 [abPath]:'fd88de8c0ec3f4a87d8a6782650d63cf4779d8170033a4c5b4f37edbd489faf9',
 [d1Path]:'9e8b793df40de1aeb6ecbb71c1ce4e828c717498e62340341d8784726ee78070',
 'supabase/migrations/20261013001000_statistics_v1_structures.sql':'5b28bc586ac76f2bcf19df36ecd610d780d26e609d153e8343e5c7b0ecba8828',
 'supabase/migrations/20261013002000_statistics_v1_capture.sql':'58c3b995450dd84bcc4299453dc8a80c5c96e62b3b72fe4a46394ae05f9b0d19',
 'supabase/migrations/20261013003000_statistics_v1_reads_security.sql':'b42a4c961a5ae1ca6a7884af391b6faa36fe3e9e271ba0c570bb9bd3355a7678',
 'supabase/migrations/20261013004000_statistics_v1_comparative_series.sql':'b10c330adff70b803d9d25165f07830e90d4cd092aa4ba2cf3d0120a43f95219'};
for(const [p,h] of Object.entries(expected)) assert.equal(hash(fs.readFileSync(p)),h,p);
const runtime=path.join(root,'supabase/statistics-v1-test/.runtime');
const manifest=JSON.parse(read(path.join(runtime,'manifest.json')));
validateManifest(manifest,runtime);
assert.equal(manifest.projectId,'orderops-statistics-v1-test-74718de66a41');
const config=fs.readFileSync(path.join(runtime,'supabase/config.toml'));
const keys=fs.readFileSync(path.join(runtime,'supabase/signing_keys.json'));
assert.equal(hash(config),manifest.configHash); assert.equal(hash(keys),manifest.signingKeysHash);
validateConfig(config.toString(),manifest.projectId); validateSigningKeys(JSON.parse(keys));
const prior=JSON.parse(read('docs/estadisticas-v1/p03-f4a/preservation.json'));
const priorEvidence=JSON.parse(read('docs/estadisticas-v1/p03-f4a/evidence.json'));
const ignored=priorEvidence.ignoredRuntimeInventory;
for(const [p,entry] of Object.entries(ignored)) assert.equal(hash(fs.readFileSync(p)),entry.sha256,'Prior private log: '+p);
assert.equal(prior.result,'PASS'); assert.equal(prior.catalog.ledger.length,124);
assert.equal(prior.publicOriginalActive,true); assert.equal(prior.isolation.projectId,manifest.projectId);
assert.equal(prior.isolation.resources.containerIds.length,5);
assert.equal(prior.isolation.resources.volumeNames.length,2);
assert.deepEqual(manifest.resources,prior.isolation.resources);
const statusBefore=git('status','--porcelain=v1','--untracked-files=all');
const files=execFileSync('git',['--no-optional-locks','ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(p=>p&&!p.startsWith(out)&&p!=='scripts/statistics-v1/p03-f5a-build.mjs');
const baseline=Object.fromEntries(files.map(p=>[p,hash(fs.readFileSync(p))]));
const adversarial=execFileSync('node',['scripts/statistics-v1/isolation-policy.verify.mjs'],{encoding:'utf8'});
const ab=read(abPath),d1=read(d1Path);
const extract=(s,name)=>{const start=s.indexOf('create function private.'+name+'(');assert.ok(start>=0);const end=s.indexOf('\n$$;',start);assert.ok(end>start);return s.slice(start,end+4);};
const originalCore=extract(ab,'statistics_v1_read_core_candidate');
const originalEntry=extract(d1,'statistics_v1_summary_d1_candidate');
const anchor='  product_lines as (select i.*,f.effective_sales';
assert.equal(originalCore.split(anchor).length,2);
const inserted=`  -- Window-scoped historical lines; invoker SELECT retains the base-table RLS barrier.
  authorized_completion_items as materialized (
    select i.* from public.order_statistics_completion_items i
    where i.business_id=v_business and exists (
      select 1 from current_facts f where f.id=i.completion_id
      union all
      select 1 from previous_facts f where f.id=i.completion_id
    )
  ),
`;
let core=originalCore.replace('statistics_v1_read_core_candidate(','statistics_v1_read_core_c_candidate(');
assert.equal((core.match(/join public\.order_statistics_completion_items i/g)||[]).length,4);
core=core.replaceAll('join public.order_statistics_completion_items i','join authorized_completion_items i').replace(anchor,inserted+anchor);
const entry=originalEntry.replace('statistics_v1_summary_d1_candidate(','statistics_v1_summary_c_candidate(').replace('private.statistics_v1_read_core_candidate(','private.statistics_v1_read_core_c_candidate(');
assert.equal(core.replace(inserted,'').replaceAll('join authorized_completion_items i','join public.order_statistics_completion_items i').replace('statistics_v1_read_core_c_candidate(','statistics_v1_read_core_candidate('),originalCore);
assert.equal(entry.replace('statistics_v1_summary_c_candidate(','statistics_v1_summary_d1_candidate(').replace('private.statistics_v1_read_core_c_candidate(','private.statistics_v1_read_core_candidate('),originalEntry);
const privileges=['statistics_v1_read_core_c_candidate','statistics_v1_summary_c_candidate'].map(n=>`revoke all on function private.${n}(text,date,date,text,integer,jsonb) from public,anon,authenticated,service_role;\ngrant execute on function private.${n}(text,date,date,text,integer,jsonb) to authenticated;`).join('\n');
const sql='-- P03-F.5A: review only; no public routing or existing-object changes.\nbegin;\nset local lock_timeout=\'3s\';\nset local statement_timeout=\'15s\';\n\n'+core+'\n\n'+entry+'\n\n'+privileges+'\ncommit;\n';
const require=createRequire(import.meta.url);
const parser=require(path.join(root,'supabase/statistics-v1-test/.runtime/sql-tools/node_modules/pgsql-parser'));
await parser.parse(sql);
// Parse the actual modified relational SELECT separately. PL/pgSQL variable binding is not certified.
const relational=core.slice(core.indexOf('  with current_facts as materialized ('),core.indexOf('  v_current_metrics:='));
await parser.parse(relational.replace(/\s+into v_current,v_previous,v_products,v_product_count,v_categories,v_outside,v_unresolved,v_pending,v_rules;/,';'));
assert.equal((sql.match(/create function /g)||[]).length,2);
assert.equal((sql.match(/stable security invoker/g)||[]).length,2);
assert.equal((sql.match(/point_metrics as materialized/gi)||[]).length,1);
assert.ok(!/create or replace|security definer|create table|create index|alter table/i.test(sql));
fs.mkdirSync(out,{recursive:true});
const write=(p,s)=>fs.writeFileSync(out+p,s);
write('candidate-c.sql',sql);
write('reference-functions.sql',originalCore+'\n\n'+originalEntry+'\n');
write('proposed-functions.sql',core+'\n\n'+entry+'\n');
const diff=spawnSync('git',['--no-pager','diff','--no-index','--',out+'reference-functions.sql',out+'proposed-functions.sql'],{encoding:'utf8'});
assert.equal(diff.status,1); write('functions.diff',diff.stdout);
write('baseline-files.json',JSON.stringify({at:new Date().toISOString(),files:baseline,statusBefore},null,2)+'\n');
write('static-audit.json',JSON.stringify({parser:'pgsql-parser; outer DDL and modified SELECT parsed, not PL/pgSQL compilation',functions:2,relationalReadSitesReused:4,sourceRestorationExact:true,d1RestorationExact:true,pointMetricsMaterialized:true,adversarialOutput:adversarial.trim(),databaseConnections:0},null,2)+'\n');
const profilePath='docs/estadisticas-v1/p03-f4a/profile/volume-50.json';
const profile=JSON.parse(read(profilePath));
const scanEvidence=[];
const walk=v=>{if(!v||typeof v!=='object')return;if(v['Relation Name']==='order_statistics_completion_items')scanEvidence.push(Object.fromEntries(Object.entries(v).filter(([k])=>['Node Type','Relation Name','Index Name','Actual Loops','Actual Rows','Actual Total Time','Shared Hit Blocks','Filter'].includes(k))));for(const x of Object.values(v))if(typeof x==='object')walk(x);};
walk(profile.nestedPlans[15].plan);
write('recorded-plan-excerpt.json',JSON.stringify({source:profilePath,sha256:hash(fs.readFileSync(profilePath)),instrumented:true,newMeasurement:false,reader:'D1',orders:50,nestedPlan:15,durationMs:profile.nestedPlans[15].durationMs,scans:scanEvidence},null,2)+'\n');
for(const [p,h] of Object.entries(baseline)) assert.equal(hash(fs.readFileSync(p)),h,'Preservation: '+p);
for(const [p,entry] of Object.entries(ignored)) assert.equal(hash(fs.readFileSync(p)),entry.sha256,'Private log preservation: '+p);
write('evidence.json',JSON.stringify({at:new Date().toISOString(),verdict:'READY_WITH_LIMITATIONS',head:git('rev-parse','HEAD'),branch:git('branch','--show-current'),sourceHashes:expected,candidateSha256:hash(sql),offlineIdentity:{projectId:manifest.projectId,api:'127.0.0.1:56321',db:'127.0.0.1:56322',configSha256:hash(config),signingKeysSha256:hash(keys),resources:manifest.resources},recordedLiveEvidence:{source:'docs/estadisticas-v1/p03-f4a/preservation.json',sha256:hash(fs.readFileSync('docs/estadisticas-v1/p03-f4a/preservation.json')),at:prior.at,ledger:124,publicOriginalActive:true,currentLiveStatus:'NOT_VERIFIED_NO_DATABASE_CONNECTION_AUTHORIZED'},preservation:{preexistingFiles:files.length,allHashesUnchanged:true,baseline:'baseline-files.json'},executed:{databaseConnections:0,sql:0,ddl:0,commits:0},inventory:fs.readdirSync(out).filter(p=>p!=='evidence.json').map(p=>({path:out+p,sha256:hash(fs.readFileSync(out+p))})).concat([{path:'scripts/statistics-v1/p03-f5a-build.mjs',sha256:hash(fs.readFileSync('scripts/statistics-v1/p03-f5a-build.mjs'))}])},null,2)+'\n');
const evidence=JSON.parse(read(out+'evidence.json'));
evidence.preservation.ignoredRuntimeInventory=ignored;
evidence.preservation.ignoredRuntimeHashesUnchanged=true;
evidence.inventoryExcludesSelf='evidence.json is included in the delivered inventory by name; its own hash is not recursively embedded.';
write('evidence.json',JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({result:'PASS_OFFLINE',candidateSha256:hash(sql),preexistingFiles:files.length,ignoredRuntimeFiles:Object.keys(ignored).length}));
