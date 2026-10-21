// Local verification only. Does not rerun historical finalizers or contact Docker/SQL.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const d='docs/estadisticas-v1/p04-t01c-scope-preflight-20261016/';
const old='docs/estadisticas-v1/p04-t01c-executor-audit-20261016/';
const read=p=>JSON.parse(fs.readFileSync(p));
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const git=(...a)=>execFileSync('git',['--no-optional-locks',...a],{encoding:'utf8',maxBuffer:20e6});
assert.equal(git('branch','--show-current').trim(),'codex/estadisticas-v1');
assert.equal(git('rev-parse','HEAD').trim(),'923300265323d411c5c91b7935472d5423d228d2');
const baseline=read(d+'file-baseline.json');
for(const f of baseline.files)assert.equal(hash(f.path),f.sha256,f.path);
for(const f of read(old+'evidence.json').inventory)assert.equal(hash(f.path),f.sha256,f.path);
const paths=git('ls-files','--cached','--others','--exclude-standard','-z').split('\0').filter(Boolean);
const known=new Set(baseline.files.map(x=>x.path));
const added=paths.filter(p=>!known.has(p));assert.ok(added.every(p=>p.startsWith(d)),'New files outside owned directory');
const ignored=[];
for(const [p,v]of Object.entries(read('docs/estadisticas-v1/p03-f4a/evidence.json').ignoredRuntimeInventory)){assert.equal(hash(p),v.sha256);ignored.push({path:p,sha256:v.sha256});}
for(const v of read('docs/estadisticas-v1/p03-f4c/evidence.json').privateLogs){assert.equal(hash(v.path),v.sha256);ignored.push({path:v.path,sha256:v.sha256});}
const pins=read(old+'pins.json');for(const p of pins.referenceFiles)assert.equal(hash(p.path),p.sha256);
const runtime='supabase/statistics-v1-test/.runtime/';const m=read(runtime+'manifest.json');
const privateRefs=[{path:runtime+'manifest.json',sha256:read('docs/estadisticas-v1/p04-t01c-loopback-plan-20261016/binding-origin.json').manifestHash},{path:runtime+'supabase/config.toml',sha256:m.configHash},{path:runtime+'supabase/signing_keys.json',sha256:m.signingKeysHash},pins.bundle,{path:runtime+'loopback-bundles/2026-10-16T13-25-58-910Z-40249ac9/sealed.json',sha256:'0a88c88e5f2270db11d6a2263c5e84b2b1adb376231d30c7e60066c58ebd1412'}];
for(const f of privateRefs)assert.equal(hash(f.path),f.sha256);
const sql=[{path:'docs/estadisticas-v1/p04-t01c/qa-install.proposed.sql',sha256:'f7940a54a58b93b04d56b10eb1f65bf425299436a2e25a1d3ae79feec919272f'},{path:'docs/estadisticas-v1/p04-t01b-fix/candidate-products-fixed.sql',sha256:'57395a7920d95cf63c1b67fb8191e40272a26aeb445a4abe7bec4d822b99c2c1'},{path:'docs/estadisticas-v1/p03-f5a/candidate-c.sql',sha256:'7d05e3987695f8bfc0e2477d74a38566269c7b6992682e58dbc4c34032f49bb6'}];
for(const f of sql)assert.equal(hash(f.path),f.sha256);
assert.equal(hash(old+'native-adapter.proposed.mjs'),'fdc7323a0664ad621b58a4b45d0319ff5085da837c9c9d39d5e17409621852e5');
const syntax=[];for(const p of fs.readdirSync(d).filter(x=>x.endsWith('.mjs'))){execFileSync(process.execPath,['--check',d+p],{stdio:'pipe'});syntax.push({path:d+p,result:'PASS'});}
const live=read(d+'live-resources.json'),bundle=read(d+'private-bundle-audit.json'),attrs=read(d+'xattr-audit.json');
assert.equal(live.result,'PASS_RESOURCE_IDENTITY');assert.equal(bundle.result,'PASS_OFFLINE_PRIVATE_BUNDLE');assert.ok(bundle.qualifiedCandidateDescriptors.every(x=>x.nativeHardBarrierConfirmed));
const layerComparison=live.layers.map(t=>{const exp=pins.layerInventory.filter(x=>x.kind===t.kind).map(x=>x.change+' '+x.path).sort();assert.deepEqual(t.entries,exp);return {kind:t.kind,entries:t.entries.length,samePathAndChangeSet:true,contentEqualityNotImplied:true};});
const at=new Date().toISOString();
fs.writeFileSync(d+'preservation.json',JSON.stringify({at,result:'PASS',baselineFiles:baseline.files.length,allBaselineHashesUnchanged:true,oldEvidenceInventoryUnchanged:true,ignoredRecordedArtifactsUnchanged:ignored.length,privateReferencesUnchanged:privateRefs,sqlFilesUnchanged:sql,gitStatus:git('status','--porcelain=v1','--untracked-files=no').trim().split('\n'),onlyNewOwnedFiles:true,headUnchanged:true,applicationEdits:0,commits:0,sqlConnections:0,containerMutations:0,catalogAndData:'NOT_QUERIED; cannot claim fresh equality',layerComparison},null,2)+'\n');
fs.writeFileSync(d+'validation-results.json',JSON.stringify({at,syntax,priorTests:{source:old+'offline-results.json',count:371,rerun:false},liveResourceIdentity:'PASS',payloadRecomputation:'PASS_2',bundleDecryption:'PASS_17_ARCHIVES',nativeBarrier:'PASS_2_REAL_PAYLOAD_DESCRIPTORS_REJECTED',earlierBundle:'HASH_VERIFIED_NOT_DECRYPTED_IN_THIS_TASK',xattrs:attrs.result,sql:'NOT_EXECUTED',mutationOperations:0,scopeDocuments:'ONLY_NEW_DOCUMENTS; no UI implementation'},null,2)+'\n');
const inventory=fs.readdirSync(d).filter(p=>p!=='evidence.json').map(p=>({path:d+p,sha256:hash(d+p),bytes:fs.statSync(d+p).size}));
fs.writeFileSync(d+'evidence.json',JSON.stringify({at,verdict:'BLOCKED',phaseP04T01C:'BLOCKED',head:git('rev-parse','HEAD').trim(),baselineFiles:baseline.files.length,sourceAttachment:{path:'C:/Users/Oasis Desktop/.codex/attachments/7e18f8e4-c760-48a2-b755-f94be9bc85d6/Texto pegado.txt',sha256:hash('C:/Users/Oasis Desktop/.codex/attachments/7e18f8e4-c760-48a2-b755-f94be9bc85d6/Texto pegado.txt')},checkpointReference:{path:old+'checkpoint-review.json',sha256:hash(old+'checkpoint-review.json'),historicalStatus:'READY_FOR_LOOPBACK_INTERVENTION_REVIEW',notPromoted:true},blockers:['Five Kong directories have incomplete xattr visibility','Independent backup recoverability not demonstrated','Fresh logical SQL integrity not authorized','Native build still locked; runtime replay/wire compatibility unproven'],engine:live.server,layerComparison,privateBundle:{path:pins.bundle.path,sha256:pins.bundle.sha256,decryptedInMemory:true,plaintextWritten:false},liveCalls:'docker version, ps, inspect(container/network/volume/image), diff; exec readonly xattr listing only',foreignMetadataUse:'Negative sharing/port collision checks only; no foreign service/DB access',sqlConnections:0,authHttp:0,lifecycleMutations:0,networkChanges:0,firewallChanges:0,oldIdsReplaced:false,inventory,inventoryExcludesSelf:true},null,2)+'\n');
console.log(JSON.stringify({verdict:'BLOCKED',preservedFiles:baseline.files.length,ignoredArtifacts:ignored.length,createdFiles:inventory.length+1,sqlConnections:0,mutations:0}));
