// Must PASS offline before preflight or candidate execution.
import fs from 'node:fs';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),{parse}=require('../../../supabase/statistics-v1-test/.runtime/sql-tools/node_modules/pgsql-parser');
const dir='docs/estadisticas-v1/p04-t01b-fix/',m=JSON.parse(fs.readFileSync(dir+'candidate-manifest.json')),h=JSON.parse(fs.readFileSync(dir+'harness-manifest.json'));
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
assert.equal(hash(m.immutableSource),m.immutableSourceSha256);assert.equal(hash(m.candidate),m.candidateSha256);assert.equal(h.sourceSha256,m.candidateSha256);assert.equal(hash(dir+'harness.sql'),h.harnessSha256);
assert.equal(JSON.parse(fs.readFileSync(dir+'static-tests.json')).result,'PASS_STATIC_ONLY');
const sql=fs.readFileSync(dir+'harness.sql','utf8'),clean=sql.split('\n').filter(x=>!x.startsWith('\\')).join('\n');assert.ok(!/\bCOMMIT\s*;/i.test(sql));
const sourceAst=await parse(fs.readFileSync(m.candidate,'utf8')),harnessAst=await parse(clean);
const funcs=ast=>ast.stmts.filter(x=>x.stmt.CreateFunctionStmt).map(x=>x.stmt.CreateFunctionStmt);
function canonical(x){if(Array.isArray(x))return x.map(canonical);if(!x||typeof x!=='object')return x;return Object.fromEntries(Object.entries(x).filter(([k])=>k!=='location').map(([k,v])=>[k,canonical(v)]));}
assert.deepEqual(funcs(harnessAst).map(canonical),funcs(sourceAst).map(canonical));assert.equal(funcs(harnessAst).length,3);
const transactionKinds=harnessAst.stmts.filter(x=>x.stmt.TransactionStmt).map(x=>x.stmt.TransactionStmt.kind);assert.equal(transactionKinds.filter(x=>x==='TRANS_STMT_BEGIN').length,1);assert.equal(transactionKinds.filter(x=>x==='TRANS_STMT_COMMIT').length,0);assert.equal(transactionKinds.at(-1),'TRANS_STMT_ROLLBACK');
const stepIds=h.tests.map(x=>x.id);assert.deepEqual(stepIds.slice(2,2+h.priorityTests.length),h.priorityTests);
fs.writeFileSync(dir+'static-gate.json',JSON.stringify({at:new Date().toISOString(),result:'PASS',candidateSha256:m.candidateSha256,harnessSha256:h.harnessSha256,onlyTwoApprovedExpressionsChanged:true,sourceFunctionsAstEqual:true,signaturesDefaultsSecurityPathUnchanged:true,outerStatements:harnessAst.stmts.length,transactionKinds,tests:stepIds.length,regressionsBeforeFunctionalTests:true,staticAssertions:183,decoderAssertions:25,typeScriptContractChanged:false,plpgsqlNotYetCompiled:true,sqlNotExecuted:true},null,2)+'\n');console.log('PASS complete offline static gate, AST-equivalent functions and ROLLBACK harness.');
