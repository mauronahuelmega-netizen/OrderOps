// Local file preservation only. Does not run SQL, network calls, old evidence writers or Git mutations.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const dir='docs/estadisticas-v1/p04-t01a-1/';
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const git=(...args)=>execFileSync('git',['--no-optional-locks',...args],{encoding:'utf8',maxBuffer:20e6}).trim();
const baseline=JSON.parse(fs.readFileSync(dir+'baseline.json'));
assert.equal(git('branch','--show-current'),baseline.branch);assert.equal(git('rev-parse','HEAD'),baseline.head);
for(const file of baseline.files)assert.equal(sha(file.path),file.sha256,'Preexisting file modified: '+file.path);
const originals=fs.readdirSync(dir+'original').map(name=>({path:dir+'original/'+name,source:'docs/estadisticas-v1/p04-t01a/'+name,sha256:sha(dir+'original/'+name)}));
for(const file of originals)assert.equal(file.sha256,sha(file.source),'Original copy mismatch');
const historical=JSON.parse(fs.readFileSync('docs/estadisticas-v1/phase04-discovery/baseline.json')).preexistingHashes;
const historicalDiff=Object.entries(historical).filter(([p,h])=>sha(p)!==h).map(([p])=>p).sort();
const authorizedG1=JSON.parse(fs.readFileSync('docs/estadisticas-v1/p03-g1/preservation.json')).authorizedOwnedChanges.sort();
assert.deepEqual(historicalDiff,authorizedG1,'Unexpected drift from original 2705-file baseline');
const ignored=[];
const oldA=JSON.parse(fs.readFileSync('docs/estadisticas-v1/p03-f4a/evidence.json')).ignoredRuntimeInventory;
for(const[p,o]of Object.entries(oldA)){assert.equal(sha(p),o.sha256);ignored.push({path:p,sha256:o.sha256});}
for(const o of JSON.parse(fs.readFileSync('docs/estadisticas-v1/p03-f4c/evidence.json')).privateLogs){assert.equal(sha(o.path),o.sha256);ignored.push({path:path.relative(process.cwd(),o.path).replaceAll('\\','/'),sha256:o.sha256});}
const all=git('ls-files','--cached','--others','--exclude-standard','-z').split('\0').filter(Boolean);
const newFiles=all.filter(p=>!baseline.files.some(x=>x.path===p));
assert.ok(newFiles.every(p=>p.startsWith(dir)),'New file outside review directory');
const preservation={at:new Date().toISOString(),currentBaselineFiles:baseline.files.length,currentBaselineHashesUnchanged:true,historicalBaselineFiles:Object.keys(historical).length,historicalUnchangedFiles:Object.keys(historical).length-historicalDiff.length,priorAuthorizedG1Changes:historicalDiff,priorG1ChangesUnchangedThisPhase:true,originalCopies:originals,ignoredRecordedArtifacts:ignored,gateUnchanged:true,sharedFilesUnchanged:true,migrationsUnchanged:true,summaryRpcSourceUnchanged:true,commits:0,databaseConnections:0,sqlExecution:false,servicesStarted:false};
fs.writeFileSync(dir+'preservation.json',JSON.stringify(preservation,null,2)+'\n');
const inventory=[];function walk(p){for(const entry of fs.readdirSync(p,{withFileTypes:true})){const file=p+entry.name;if(entry.isDirectory())walk(file+'/');else if(file!==dir+'evidence.json')inventory.push({path:file,sha256:sha(file),bytes:fs.statSync(file).size,kind:'created'});}}walk(dir);
const sources=['supabase/migrations/20260426214500_t1_businesses_profiles.sql','supabase/migrations/20260427021000_super_admin_roles_and_rls.sql','supabase/migrations/20260427030000_super_admin_profiles_nullable_business.sql','supabase/migrations/20260516201000_s1_business_roles.sql','supabase/migrations/20260604143000_v63_store_sessions.sql','supabase/migrations/20260607210325_business_settings.sql','supabase/migrations/20260926010000_shared_core_expand.sql','supabase/migrations/20260926011000_order_financials.sql','supabase/migrations/20261013001000_statistics_v1_structures.sql','supabase/migrations/20261013002000_statistics_v1_capture.sql','supabase/migrations/20261013003000_statistics_v1_reads_security.sql','lib/statistics/products-contracts.ts','lib/statistics/products-read.ts','lib/statistics/statistics-publication-policy.ts','lib/statistics/statistics-publication-server.ts'];
const tests=JSON.parse(fs.readFileSync(dir+'static-tests.json'));
const evidence={at:new Date().toISOString(),phase:'P04-T01A.1',verdict:'READY_WITH_LIMITATIONS',branch:baseline.branch,head:baseline.head,originalSha256:sha('docs/estadisticas-v1/p04-t01a/candidate-products.sql'),reviewedSha256:sha(dir+'candidate-products-reviewed.sql'),findings:[{id:'SQL-01',status:'CORRECTED',classification:'COMPILATION_BLOCKER'},{id:'SQL-02',status:'CORRECTED',classification:'DECODER_INCOMPATIBILITY'},{id:'SQL-03',status:'PROPOSED_RESTRICTED_VALIDATION',classification:'PUBLICATION_RISK'},{id:'SQL-04',status:'NOT_EXECUTED',classification:'RUNTIME_VALIDATION_PENDING'},{id:'SQL-05',status:'PRESERVED_DOCUMENTED',classification:'CURSOR_SESSION_SETTINGS'},{id:'SQL-06',status:'NOT_MEASURED',classification:'PERFORMANCE'},{id:'SQL-07',status:'DOCUMENTED_TEST_REQUIRED',classification:'NONFINITE_FINANCIAL_SOURCE'}],tests:{staticAssertions:tests.assertions,decoderAssertions:tests.decoderRegression.assertions,result:tests.result,originalNegativeControlDetected:true,sqlBodiesParsed:tests.sqlBodiesParsed,plpgsqlCompiled:false,catalogBinding:false,liveRls:false},preservation:{currentFiles:baseline.files.length,allUnchanged:true,original2705PreservationChain:true,ignoredRecordedArtifacts:ignored.length,originalCopiesIdentical:true},sources:sources.map(p=>({path:p,sha256:sha(p)})),inventory,inventoryExcludesSelf:true,scope:{databaseConnections:0,cursorWorktreeAccess:false,installedSql:false,realGrantsChanged:false,httpGateChanged:false,commits:0,nextPhasesStarted:false},limitations:['Static parser is not PL/pgSQL compilation or catalog binder','No live identity/catalog revalidation by design','RPC authenticated grant independent of HTTP gate; restricted future installation authorization required','Cursor TimeZone/DateStyle continuity and nonfinite pending financial source require runtime cases','No financial semantics or decoder changes; no optimization adopted']};
fs.writeFileSync(dir+'evidence.json',JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({verdict:evidence.verdict,reviewedSha256:evidence.reviewedSha256,preservedFiles:baseline.files.length,original2705Chain:true,createdFiles:inventory.length+1,evidenceSha256:sha(dir+'evidence.json')}));
