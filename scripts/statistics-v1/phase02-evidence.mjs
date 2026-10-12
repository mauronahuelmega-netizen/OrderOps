/** Read-only database verification plus a sanitized local evidence document. No Auth login or SQL writes. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { reviewBundle } from './review-bundle.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const runtime=resolve(root,'supabase/statistics-v1-test/.runtime');
const gate=spawnSync(process.execPath,[resolve(root,'scripts/statistics-v1/assert-isolated-target.mjs')],{cwd:root,stdio:'inherit',timeout:180000});
assert.equal(gate.status,0,'Isolation gate failed');
const m=JSON.parse(readFileSync(resolve(runtime,'manifest.json'),'utf8'));
const query=`BEGIN READ ONLY; SELECT json_build_object(
 'baseMigrations',(SELECT count(*) FROM supabase_migrations.schema_migrations),
 'statisticsMigrations',(SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version IN ('20261013001000','20261013002000','20261013003000')),
 'statisticsTables',(SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('business_statistics_state','store_session_statistics_snapshots','order_item_statistics_snapshots','order_statistics_completions','order_statistics_completion_items')),
 'orders',(SELECT count(*) FROM public.orders),
 'tokenMatches',(SELECT token='${m.token}' FROM statistics_test_environment.identity WHERE singleton)); COMMIT;`;
const r=spawnSync('docker',['exec','-i',`supabase_db_${m.projectId}`,'psql','-X','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-At'],{cwd:root,input:query,encoding:'utf8',timeout:30000});
assert.equal(r.status,0,'Read-only counts failed');
const counts=JSON.parse(r.stdout.split(/\r?\n/).find(x=>x.startsWith('{')));
assert.deepEqual(counts,{baseMigrations:119,statisticsMigrations:0,statisticsTables:0,orders:0,tokenMatches:true});
const evidence={verifiedAt:new Date().toISOString(),branch:'codex/estadisticas-v1',projectId:m.projectId,apiUrl:'http://127.0.0.1:56321',dbHost:'127.0.0.1',dbPort:56322,
  readOnly:true,foreignResourcesUntouched:true,resources:m.resources,counts,reviewBundle:reviewBundle(),appliedStatisticsSql:false,writeTestsExecuted:false,phase03Started:false};
writeFileSync(resolve(root,'docs/estadisticas-v1/fase-02-evidencia.json'),JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({verified:true,apiPort:56321,dbPort:56322,...counts,appliedStatisticsSql:false,writeTestsExecuted:false}));
