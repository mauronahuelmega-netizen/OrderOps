/** Offline only. No Supabase/Docker/HTTP client, SQL execution or environment load. */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const require=createRequire(import.meta.url);
const {parse}=require('../../supabase/statistics-v1-test/.runtime/sql-tools/node_modules/pgsql-parser');
const file='supabase/migrations/20261013004000_statistics_v1_comparative_series.sql';
const oldFile='supabase/migrations/20261013003000_statistics_v1_reads_security.sql';
const source=readFileSync(file,'utf8'), old=readFileSync(oldFile,'utf8');
assert.equal(execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),'codex/estadisticas-v1');
const ast=await parse(source), legacyAst=await parse(old);
function functions(tree) { return tree.stmts.flatMap(({stmt})=>stmt.CreateFunctionStmt ? [stmt.CreateFunctionStmt] : []); }
function name(f) { return f.funcname.map(n=>n.String.sval).join('.'); }
function options(f) { return Object.fromEntries(f.options.map(o=>[o.DefElem.defname,o.DefElem.arg])); }
function body(f) { return options(f).as.List.items[0].String.sval; }
function semantic(value) { return value===undefined ? undefined : JSON.parse(JSON.stringify(value, (key,v)=>key==='location'?undefined:v)); }
function signature(f) { return f.parameters.map(p=>({name:p.FunctionParameter.name,type:semantic(p.FunctionParameter.argType),default:semantic(p.FunctionParameter.defexpr)})); }
const fs=functions(ast), oldRpc=functions(legacyAst).find(f=>name(f)==='public.statistics_v1_summary');
const base=fs.find(f=>name(f)==='private.statistics_v1_summary_base'), rpc=fs.find(f=>name(f)==='public.statistics_v1_summary');
assert.equal(body(base),body(oldRpc),'Legacy body must be byte-identical, including predicates and return object');
assert.deepEqual(signature(base),signature(oldRpc)); assert.deepEqual(signature(rpc),signature(oldRpc));
assert.deepEqual(semantic(rpc.returnType),semantic(oldRpc.returnType)); assert.equal(rpc.replace,true);
assert.equal(fs.length,5);
assert.equal(fs.filter(f=>f.replace).length,1);
const inventory=[];let embeddedStatements=0;
for(const f of fs) {
  const o=options(f), lang=o.language.String.sval, b=body(f);
  assert.equal(Boolean(o.security.Boolean.boolval),false,'Invoker only');
  assert.equal(o.volatility.String.sval,name(f).endsWith('_delta')?'immutable':'stable');
  assert.ok(!/\b(?:insert\s+into|update\s+public|delete\s+from|for\s+update|pg_advisory|execute\s+format)\b/i.test(b));
  if(lang==='sql') {await parse(b);embeddedStatements++;}
  if(name(f)==='private.statistics_v1_series_response') {
    for(const m of b.matchAll(/(?:^|\n) {2}(with\b[\s\S]*?;|select\b[\s\S]*?;)/gi)) {
      const query=m[1].replace(/\binto\s+v_\w+(?:\s*,\s*v_\w+)*/gi,'');
      await parse(query);embeddedStatements++;
    }
    const sizing=/select least\(div\(max[\s\S]*?;/.exec(b);
    assert.ok(sizing);
    await parse(sizing[0].replace(/\binto\s+v_\w+/gi,'')); embeddedStatements++;
    assert.ok(b.includes('3600000000::numeric*v_step'));
    assert.ok(!b.includes('/(3600*v_step)'));
    assert.ok(b.includes("case when v_mode='session' then greatest(1,div("));
    assert.ok(b.includes("role not in ('owner','manager','admin')"));
    assert.equal((b.match(/from public[.]statistics_v1_effective_facts/g)??[]).length,1);
    assert.ok(b.includes('v_bad<>0') && b.includes('STATISTICS_SERIES_LEGACY_COHORT_MISMATCH'));
    assert.ok(b.includes('jsonb_array_length(v_points)>200'));
    assert.ok(!f.parameters.some(p=>p.FunctionParameter.argType.names.some(n=>n.String.sval==='jsonb') && p.FunctionParameter.name!=='p_cursor'));
  }
  inventory.push({name:name(f),language:lang,volatility:o.volatility.String.sval,security:'invoker',parameters:signature(f).map(p=>p.name),bodySha256:createHash('sha256').update(b).digest('hex')});
}
for(const {stmt} of ast.stmts) {
  assert.ok(['TransactionStmt','VariableSetStmt','CreateFunctionStmt','GrantStmt'].includes(Object.keys(stmt)[0]),'Unexpected DDL/DML surface');
}
const raw=source.replace(/--[^\n]*/g,'');
// Prepared runtime equality remains a single SELECT (same MVCC snapshot/cutoff).
const runtime=readFileSync('supabase/tests/statistics-v1/phase03-series.sql','utf8');
const equality=/select private[.]statistics_v1_summary_base\(period,[\s\S]*?into old,new;/.exec(runtime);
assert.ok(equality && equality[0].includes('public.statistics_v1_summary(period,'));
const equalityAst=await parse(equality[0].replace(/into old,new;/,';'));
assert.equal(equalityAst.stmts.length,1);
assert.equal(equalityAst.stmts[0].stmt.SelectStmt.targetList.length,2);
assert.ok(runtime.includes("new-'series'=old"));
assert.ok(!/\b(?:create\s+table|alter\s+table|create\s+trigger|create\s+policy|security\s+definer|placeholder|todo)\b/i.test(raw));
assert.ok(raw.includes('from public,anon,authenticated,service_role'));
assert.ok(raw.includes('to authenticated;'));
const versions=readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).map(f=>f.split('_')[0]);
assert.equal(new Set(versions).size,versions.length,'No duplicate local migration version');
for(const previous of ['20261013001000','20261013002000','20261013003000'])assert.ok(previous<'20261013004000');
for(const path of [oldFile,'supabase/migrations/20261013001000_statistics_v1_structures.sql','supabase/migrations/20261013002000_statistics_v1_capture.sql']) {
  assert.equal(readFileSync(path,'utf8'),execFileSync('git',['show',`HEAD:${path}`],{encoding:'utf8'}),'Historical migration changed');
}
const cursorFiles=execFileSync('git',['ls-tree','-r','--name-only','cursor/commercial-core-v1-integration','supabase/migrations'],{encoding:'utf8'});
assert.ok(!cursorFiles.includes('20261013004000_'),'Collision in known local Cursor ref');
execFileSync('git',['diff','--exit-code','--','lib/admin/permissions.ts','components/admin/admin-nav-config.ts','components/admin/layout/admin-nav-list.tsx'],{stdio:'pipe'});
const evidence={at:new Date().toISOString(),result:'PASS_STATIC_ONLY',file,sha256:createHash('sha256').update(source).digest('hex'),statements:ast.stmts.length,embeddedSqlParsed:embeddedStatements,functions:inventory,
 legacy:{bodyByteIdentical:true,signatureAndDefaultsIdentical:true,returnTypeIdentical:true,reason:'Static preservation, not proof of runtime result equality'},
 isolation:{connections:0,sqlExecuted:false},limitations:['PL/pgSQL bodies and types not compiled against PostgreSQL','Runtime/RLS/concurrency/EXPLAIN pending approval','Local Cursor reference may be stale'],
 candidateVersion:'20261013004000',localMigrationCount:versions.length,cursorRef:execFileSync('git',['rev-parse','cursor/commercial-core-v1-integration'],{encoding:'utf8'}).trim()};
writeFileSync('docs/estadisticas-v1/p03-a/static-evidence.json',JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify(evidence,null,2));
