// File preservation and plan inventory only. No Docker, SQL, HTTP or configuration changes.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const dir='docs/estadisticas-v1/p04-t01c-loopback-plan-20261016/';
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p));
const git=(...a)=>execFileSync('git',['--no-optional-locks',...a],{encoding:'utf8',maxBuffer:20e6}).trim();
assert.equal(git('branch','--show-current'),'codex/estadisticas-v1');
assert.equal(git('rev-parse','HEAD'),'923300265323d411c5c91b7935472d5423d228d2');
const baseline=read(dir+'file-baseline.json');
for(const x of baseline.files)assert.equal(hash(x.path),x.sha256,x.path);
const priorPaths=new Set(baseline.files.map(x=>x.path));
const paths=git('ls-files','--cached','--others','--exclude-standard','-z').split('\0').filter(Boolean);
assert.ok(paths.filter(x=>!priorPaths.has(x)).every(x=>x.startsWith(dir)));
let ignoredCount=0;
for(const [p,x] of Object.entries(read('docs/estadisticas-v1/p03-f4a/evidence.json').ignoredRuntimeInventory)){assert.equal(hash(p),x.sha256,p);ignoredCount++;}
for(const x of read('docs/estadisticas-v1/p03-f4c/evidence.json').privateLogs){assert.equal(hash(x.path),x.sha256,x.path);ignoredCount++;}
const at=new Date().toISOString();
const preservation={at,result:'PASS',baselineFiles:baseline.files.length,allFileHashesUnchanged:true,ignoredRecordedArtifactsUnchanged:ignoredCount,trackedAndUntrackedPreserved:true,newFilesOnlyWithin:dir,originalsAndVerifiersModified:false,sqlConnections:0,authRequests:0,lifecycleOperations:0,firewallChanges:0,configurationChanges:0,gitCommits:0};
fs.writeFileSync(dir+'preservation.json',JSON.stringify(preservation,null,2)+'\n');
const inventory=fs.readdirSync(dir).sort().filter(x=>x!=='evidence.json').map(x=>({path:dir+x,sha256:hash(dir+x),bytes:fs.statSync(dir+x).size,kind:'created'}));
const evidence={at,phase:'P04-T01C_LOOPBACK_CORRECTION_PLAN',verdict:'BLOCKED',executionAuthorized:false,scope:'Read-only metadata audit and proposal documents',externalEvidence:{source:'Human owner report in this conversation',device:'Phone on same Wi-Fi',url:'http://192.168.0.108:56321/',response:'{"message":"no Route matched with those values"}',meaning:'API reachable from LAN; not evidence of data access',postgresql56322:'POTENTIALLY_EXPOSED_NOT_REMOTELY_TESTED',independentlyRepeated:false},projectId:'orderops-statistics-v1-test-74718de66a41',origin:'Supabase CLI 2.72.7 HostPort without HostIp; Docker 29.1.3 expands wildcard',proposedDelta:{db:{'5432/tcp':[{HostIp:'127.0.0.1',HostPort:'56322'}]},kong:{'8000/tcp':[{HostIp:'127.0.0.1',HostPort:'56321'}]}},mandatoryDecision:'Literal binding change cannot preserve both original active DB/Kong container IDs. Selective recreation exception and reviewed harness required; not authorized.',recommendedIfExceptionApproved:'Keep original DB/Kong stopped and renamed; create two reviewed replacements. Preserve Auth/REST/Storage IDs, network and both volumes; keep history and immutable references.',writableLayerPreservation:'Required gate; configuration, keys, Kong files and recovery dump paths identified; no secret contents read',futureHarnessPrepared:false,commands:'commands-and-tests.md; not executed',ledgerAndData:'Previous post-recovery evidence only; no new SQL comparison in this task',qaInstallSha256:hash('docs/estadisticas-v1/p04-t01c/qa-install.proposed.sql'),noTransactionalRehearsal:true,noT02:true,noPublication:true,noCandidateAdoption:true,oldCheckpointUnchanged:true,additionalLiveChecks:['Only project-labelled Docker inspect/network/volume metadata and db/kong docker diff','Supabase executable version/help and Docker engine version'],sources:['https://raw.githubusercontent.com/supabase/cli/v2.72.7/internal/start/start.go','https://raw.githubusercontent.com/supabase/cli/v2.72.7/internal/db/start/start.go','https://raw.githubusercontent.com/supabase/cli/v2.72.7/internal/utils/docker.go','https://docs.docker.com/engine/network/port-publishing/','https://docs.docker.com/reference/cli/docker/container/update/'],preservation:'preservation.json',inventory,inventoryExcludesSelf:true};
assert.equal(evidence.qaInstallSha256,'f7940a54a58b93b04d56b10eb1f65bf425299436a2e25a1d3ae79feec919272f');
fs.writeFileSync(dir+'evidence.json',JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({verdict:evidence.verdict,preservedFiles:baseline.files.length,ignoredPreserved:ignoredCount,newFiles:inventory.length+1,sql:0,changes:0}));
