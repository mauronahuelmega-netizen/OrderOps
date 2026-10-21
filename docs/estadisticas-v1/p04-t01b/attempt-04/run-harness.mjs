// Single exact-source transaction, ROLLBACK only. No migration tool or persistent installation.
import fs from 'node:fs';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
const dir='docs/estadisticas-v1/p04-t01b/',project='orderops-statistics-v1-test-74718de66a41';
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');const save=(f,x)=>fs.writeFileSync(dir+f,JSON.stringify(x,null,2)+'\n');
const manifest=JSON.parse(fs.readFileSync(dir+'harness-manifest.json'));
assert.equal(sha(manifest.source),manifest.sourceSha256);assert.equal(manifest.sourceSha256,'a66ce3ea73bf4a4421c60b77376914f232b4470d41df7d661ee38142c4a29ba8');assert.equal(sha(dir+'harness.sql'),manifest.harnessSha256);
// Revalidate all live gates immediately before the only writable transaction.
const gate=spawnSync(process.execPath,[dir+'preflight.mjs'],{encoding:'utf8',maxBuffer:32e6,windowsHide:true});if(gate.status!==0)throw Error('PREFLIGHT_STOP: '+gate.stdout);assert.equal(JSON.parse(fs.readFileSync(dir+'preflight.json')).result,'PASS');
const sql=fs.readFileSync(dir+'harness.sql','utf8');assert.ok(!/\bcommit\s*;/i.test(sql));assert.ok(sql.includes('\nROLLBACK;\n'));
const args=['exec','-i','-e','PGOPTIONS=-c statement_timeout=15000 -c lock_timeout=3000','supabase_db_'+project,'psql','-X','-U','postgres','-d','postgres','-qAt'];
const at=new Date().toISOString();const result=spawnSync('docker',args,{input:sql,encoding:'utf8',maxBuffer:32e6,windowsHide:true});
// psql receives the complete ROLLBACK-terminated script. On server disconnect its open transaction aborts.
fs.writeFileSync(dir+'psql.stdout.log',result.stdout??'');fs.writeFileSync(dir+'psql.stderr.log',result.stderr??'');
const records=[];for(const line of (result.stderr??'').split(/\r?\n/)){const start=line.indexOf('{"');if(start>=0){try{const o=JSON.parse(line.slice(start));if(o.test)records.push(o);}catch{}}}
const errors=(result.stderr??'').split(/\r?\n/).filter(x=>/ERROR:|FATAL:/.test(x));
const rollback=(result.stdout??'').split(/\r?\n/).filter(x=>x.startsWith('{')).map(x=>{try{return JSON.parse(x);}catch{return null;}}).find(x=>x?.rollbackReached);
save('sql-results.json',{startUTC:at,endUTC:new Date().toISOString(),processExit:result.status,processError:result.error?String(result.error):null,expectedTests:manifest.tests.length,recordedTests:records.length,pass:records.filter(x=>x.status==='PASS').length,fail:records.filter(x=>x.status==='FAIL').length,records,topLevelErrors:errors,rollback:rollback??'NOT_AVAILABLE',candidateHash:manifest.sourceSha256,harnessHash:manifest.harnessSha256});
// New connection: READ ONLY + ROLLBACK; confirm original catalog and fingerprints exactly.
function read(q){const r=spawnSync('docker',[...args,'-v','ON_ERROR_STOP=1'],{input:'BEGIN READ ONLY;\n'+q+'\nROLLBACK;\n',encoding:'utf8',maxBuffer:32e6,windowsHide:true});assert.equal(r.status,0,'Post-rollback read failed: '+r.stderr);return JSON.parse(r.stdout.trim());}
const after={};for(const name of ['catalog','extra','data']){after[name]=read(fs.readFileSync(dir+name+'-select.sql','utf8'));save(name+'-after.json',after[name]);assert.deepEqual(after[name],JSON.parse(fs.readFileSync(dir+name+'-before.json')),name+' changed');}
const absent=read("SELECT json_build_object('absent',to_regprocedure('public.statistics_v1_products(text,date,date,text,integer,jsonb)') is null and to_regprocedure('private.statistics_v1_products_reader(text,date,date,text,integer,jsonb)') is null and to_regprocedure('private.statistics_products_metric(numeric,bigint,bigint,bigint,bigint)') is null);");assert.equal(absent.absent,true);
save('rollback-verification.json',{at:new Date().toISOString(),newConnection:true,threeFunctionsAbsent:true,catalogIdentical:true,aclPoliciesFunctionsIdentical:true,ledgerIdentical:true,dataFingerprintsIdentical:true,extraIdentical:true,explicitRollbackReached:rollback?.rollbackReached===true,commitStatements:0});
console.log(JSON.stringify({tests:records.length,pass:records.filter(x=>x.status==='PASS').length,fail:records.filter(x=>x.status==='FAIL').length,topLevelErrors:errors.length,rollback,afterPreserved:true}));
