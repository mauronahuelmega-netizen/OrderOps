import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const sha=b=>createHash('sha256').update(b).digest('hex');
let test=fs.readFileSync('lib/statistics/summary.verify.ts','utf8').replace('import { readAuthenticatedSummary,','import { readAuthenticatedSummary as fixtureTransport,').replace("const dir='docs/estadisticas-v1/p03-c';","const readAuthenticatedSummary=(client:SummaryAuthenticatedClient,search:string)=>fixtureTransport(client,search,()=>true);\nconst dir='docs/estadisticas-v1/p03-g1/regression';");
fs.writeFileSync('lib/statistics/p03-g1-summary-regression.verify.ts','// Historical regression copied; publication policy supplied explicitly only to synthetic tests.\n'+test);
const allowed=['lib/statistics/summary-route-server.ts','lib/statistics/summary-server.ts','lib/statistics/summary-transport.ts','app/admin/(protected)/statistics/page.tsx','app/admin/(protected)/statistics/query/route.ts'];
const baseline=JSON.parse(fs.readFileSync('docs/estadisticas-v1/phase04-discovery/baseline.json'));
const changes=[];
for(const p of allowed){let s=fs.readFileSync(p,'utf8').replaceAll('\r\n','\n'),old=s;
 if(p.endsWith('summary-route-server.ts'))old=s.replace("import { statisticsPublicationAllowed } from './statistics-publication-server';\n",'').replace(" | 'not_published'",'').replace("    const access = await verifyStatisticsPrincipal(client as unknown as StatisticsPrincipalClient);\n    if (access.status !== 'allowed') return access;\n    return statisticsPublicationAllowed(client, access.scope) ? access : { status: 'not_published' };","    return verifyStatisticsPrincipal(client as unknown as StatisticsPrincipalClient);");
 if(p.endsWith('summary-server.ts'))old=s.replace("import { statisticsPublicationAllowed } from './statistics-publication-server';\n",'').replace('search,scope=>statisticsPublicationAllowed(client,scope)','search');
 if(p.endsWith('summary-transport.ts'))old=s.replace("|'not_published'",'').replace("  not_published:'Estadísticas todavía no está disponible.',\n",'').replace(',publication:(scope:SummaryScope)=>boolean=()=>false','').replace("    if(!publication(access.scope))return summaryFailure('not_published');\n",'');
 if(p.endsWith('/page.tsx'))old=s.replace('redirect, notFound','redirect').replace("  if (access.status === 'not_published') notFound();\n",'');
 if(p.endsWith('/route.ts'))old=s.replace("result.code === 'not_published' ? 404 : ",'');
 const expected=baseline.preexistingHashes[p];assert.ok(expected,p);const variants=[old,old.replaceAll('\n','\r\n')];const reference=variants.find(s=>sha(Buffer.from(s))===expected);assert.ok(reference,'Reverse diff must match approved pre-task baseline: '+p);
 const before='docs/estadisticas-v1/p03-g1/before/'+p+'.txt',after='docs/estadisticas-v1/p03-g1/after/'+p+'.txt';
 for(const leaf of [before.slice(0,-4),after.slice(0,-4)]){assert.ok(path.resolve(leaf).startsWith(path.resolve('docs/estadisticas-v1/p03-g1')+path.sep));if(fs.existsSync(leaf))fs.unlinkSync(leaf);}
 fs.mkdirSync(path.dirname(before),{recursive:true});fs.mkdirSync(path.dirname(after),{recursive:true});fs.writeFileSync(before,reference);fs.copyFileSync(p,after);
 const d=spawnSync('git',['--no-pager','diff','--no-index','--',before,after],{encoding:'utf8'});assert.equal(d.status,1);changes.push(d.stdout);
}
fs.writeFileSync('docs/estadisticas-v1/p03-g1/implementation.diff',changes.join('\n'));
const existingUnchanged=[];for(const[p,h]of Object.entries(baseline.preexistingHashes)){if(allowed.includes(p))continue;assert.equal(sha(fs.readFileSync(p)),h,p);existingUnchanged.push(p);}
fs.writeFileSync('docs/estadisticas-v1/p03-g1/preservation.json',JSON.stringify({at:new Date().toISOString(),unchangedFiles:existingUnchanged.length,hashesUnchanged:true,authorizedOwnedChanges:allowed,originalBytesVerifiedByReverseDiff:true,sharedAdminFilesUnchanged:true,dbConnections:0,ddl:0,commits:0},null,2)+'\n');
const require=createRequire(import.meta.url),parser=require(path.resolve('supabase/statistics-v1-test/.runtime/sql-tools/node_modules/pgsql-parser'));
const sql=fs.readFileSync('docs/estadisticas-v1/p04-t01a/candidate-products.sql','utf8');await parser.parse(sql);
await parser.parse(sql.slice(sql.indexOf(' with facts as materialized ('),sql.indexOf(' return v_result;')).replace(' into v_result from totals t;',' from totals t;'));
assert.equal((sql.match(/create function /g)||[]).length,3);assert.ok(!/create or replace|security definer|create table|create index|alter table/i.test(sql));
fs.writeFileSync('docs/estadisticas-v1/p04-t01a/empty-reference.sql','');const diff=spawnSync('git',['--no-pager','diff','--no-index','--','docs/estadisticas-v1/p04-t01a/empty-reference.sql','docs/estadisticas-v1/p04-t01a/candidate-products.sql'],{encoding:'utf8'});assert.equal(diff.status,1);fs.writeFileSync('docs/estadisticas-v1/p04-t01a/functions.diff',diff.stdout);
fs.writeFileSync('docs/estadisticas-v1/p04-t01a/static-audit.json',JSON.stringify({at:new Date().toISOString(),result:'PASS_STATIC_ONLY',parser:'Outer SQL + modified relational SELECT; not PL/pgSQL compilation',newFunctions:3,invoker:true,newTables:0,originalSummaryUnchanged:true,candidateSqlExecuted:false,candidateSha256:sha(Buffer.from(sql)),limits:{pageMaximum:20,querySeconds:15,lockSeconds:3}},null,2)+'\n');
console.log('PASS exact baseline preservation, gate diff, SQL parser; no SQL execution.');
