// Filesystem verification and new evidence only. No Docker, network or database calls.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const dir='docs/estadisticas-v1/p04-t01c-post-recovery-20261016/';
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const git=(...args)=>execFileSync('git',['--no-optional-locks',...args],{encoding:'utf8',maxBuffer:20e6}).trim();
const baseline=read(dir+'file-baseline.json');
assert.equal(git('branch','--show-current'),baseline.branch);
assert.equal(git('rev-parse','HEAD'),baseline.head);
for(const f of baseline.files)assert.equal(sha(f.path),f.sha256,f.path);
const paths=git('ls-files','--cached','--others','--exclude-standard','-z').split('\0').filter(Boolean);
const previous=new Set(baseline.files.map(x=>x.path));
assert.ok(paths.filter(x=>!previous.has(x)).every(x=>x.startsWith(dir)));
const ignored=[];
for(const [path,x]of Object.entries(read('docs/estadisticas-v1/p03-f4a/evidence.json').ignoredRuntimeInventory)){
 assert.equal(sha(path),x.sha256,path);ignored.push({path,sha256:x.sha256});
}
for(const x of read('docs/estadisticas-v1/p03-f4c/evidence.json').privateLogs){
 assert.equal(sha(x.path),x.sha256,x.path);ignored.push({path:x.path,sha256:x.sha256});
}
const old='docs/estadisticas-v1/p04-t01c/';
for(const [observed,reference]of [['catalog-observed.json','catalog-after.json'],['extra-observed.json','extra-after.json'],['data-observed.json','data-after.json']])assert.deepEqual(read(dir+observed),read(old+reference),observed);
const at=new Date().toISOString();
const preservation={at,result:'PASS',baselineFiles:baseline.files.length,allBaselineHashesUnchanged:true,baselineGitStatePreservedByFileHashes:true,branch:baseline.branch,head:baseline.head,ignoredRecordedArtifacts:ignored,newFilesOnlyWithin:dir,catalogLedgerAclPoliciesTriggersAnd15TableFingerprintsMatchPrevious:true,scopeOfDataProof:'15 public tables; not a full Auth/Storage database comparison',noRehearsal:true,sqlReadOnlyRollbackOnly:true,ddl:0,commitsSql:0,migrations:0,fixturesCreated:0,grantsChanged:0,authSessionsModifiedByTask:0,servicesStarted:0,networkChanges:0,gitCommits:0,otherWorktreesModified:0};
fs.writeFileSync(dir+'preservation.json',JSON.stringify(preservation,null,2)+'\n');
const inventory=[];
for(const name of fs.readdirSync(dir).sort())if(name!=='evidence.json'){
 const path=dir+name;assert.ok(fs.statSync(path).isFile());inventory.push({path,bytes:fs.statSync(path).size,sha256:sha(path),kind:'created'});
}
const network=read(dir+'network-observations.json');
const evidence={at,phase:'P04-T01C_POST_RECOVERY',verdict:'BLOCKED',targetCheckpointNotReached:'READY_FOR_TRANSACTIONAL_QA_REHEARSAL',blocker:'Wildcard published bindings and OS access denied to effective firewall rules; external restriction not demonstrated',preflight:read(dir+'preflight.json').result,staticReview:read(dir+'static-review.json').result,projectId:'orderops-statistics-v1-test-74718de66a41',api:'127.0.0.1:56321',postgresql:'127.0.0.1:56322',ledger:124,qaInstallerSha256:sha(old+'qa-install.proposed.sql'),productsSourceSha256:sha('docs/estadisticas-v1/p04-t01b-fix/candidate-products-fixed.sql'),functionsOriginalActive:true,productsAndQaAbsent:true,network:{result:'BLOCKED',wildcardBindingsUnchangedFromPrior:true,windowsListenersObserved:true,effectiveRuleReadError:network.ruleError,ruleCount:'NOT_AVAILABLE',externalReachability:'NOT_TESTED',remoteProbes:0,changes:0},recoveryBackup:'USER_REPORTED_NOT_INDEPENDENTLY_AUDITED',scriptsExecuted:[dir+'preflight-readonly.mjs',dir+'proposal-static-readonly.mjs',dir+'finalize-readonly.mjs','scripts/statistics-v1/isolation-policy.verify.mjs'],additionalOperations:['Inline Node baseline capture before creating audit artifacts','PowerShell read-only ActiveStore/listeners/portproxy observation; effective rule query denied'],scriptAdaptations:'New copies only; original invariant checks retained, new output paths and P04-T01C reference/hash comparisons. Original verifiers preserved.',noLiveOperationsAfterNetworkBlock:true,noTransactionalRehearsal:true,noPersistentInstall:true,noAuthHttp:true,noSyntheticPairsEnabled:true,noT02:true,noCandidateAdoption:true,preservation:'preservation.json',inventory,inventoryExcludesSelf:true};
assert.equal(evidence.qaInstallerSha256,'f7940a54a58b93b04d56b10eb1f65bf425299436a2e25a1d3ae79feec919272f');
fs.writeFileSync(dir+'evidence.json',JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({verdict:evidence.verdict,preservedFiles:baseline.files.length,ignoredPreserved:ignored.length,newFiles:inventory.length+1,installerHash:evidence.qaInstallerSha256}));
