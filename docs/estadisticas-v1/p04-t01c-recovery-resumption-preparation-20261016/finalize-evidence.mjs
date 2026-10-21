// Filesystem/Git only; never runs the proposed live preflight.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const d='docs/estadisticas-v1/p04-t01c-recovery-resumption-preparation-20261016/';
const prior='docs/estadisticas-v1/p04-t01c-recovery-kong-decision-20261016/';
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const json=p=>JSON.parse(fs.readFileSync(p));
const save=(n,v)=>fs.writeFileSync(d+n,JSON.stringify(v,null,2)+'\n');
const baseline=json(d+'file-baseline.json');for(const f of baseline.files)assert.equal(sha(f.path),f.sha256,f.path);
const manifestHash='790960c137c57c70d725cde4a7113165b15c6369662b2e2a52387623093dfd3f';
assert.equal(sha(prior+'recovery-approval-manifest.json'),manifestHash);
const original=json(prior+'recovery-approval-manifest.json');for(const f of original.runtimeAndProcedureFiles)assert.equal(sha(f.path),f.sha256,f.path);
assert.equal(sha(original.backup.path),original.backup.sha256);
let ignored=0;for(const [p,v]of Object.entries(json('docs/estadisticas-v1/p03-f4a/evidence.json').ignoredRuntimeInventory)){assert.equal(sha(p),v.sha256);ignored++;}
for(const v of json('docs/estadisticas-v1/p03-f4c/evidence.json').privateLogs){assert.equal(sha(v.path),v.sha256);ignored++;}
const refs=json('docs/estadisticas-v1/p04-t01c-scope-preflight-20261016/preservation.json');
for(const p of [...refs.privateReferencesUnchanged,...refs.sqlFilesUnchanged])assert.equal(sha(p.path),p.sha256);
assert.equal(execFileSync('git',['status','--short','--untracked-files=no'],{encoding:'utf8'}),baseline.trackedStatus);
assert.equal(execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),'codex/estadisticas-v1');
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),'923300265323d411c5c91b7935472d5423d228d2');
const known=new Set(baseline.files.map(x=>x.path));
const current=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
assert.ok(current.filter(p=>!known.has(p)).every(p=>p.startsWith(d)));
assert.ok(!fs.existsSync(d+'future-readonly-attempt.json'));
const tests=json(d+'offline-results.json');assert.equal(tests.count,52);assert.equal(tests.result,'PASS_OFFLINE_ONLY');
for(const n of fs.readdirSync(d).filter(p=>p.endsWith('.mjs')))execFileSync(process.execPath,['--check',d+n],{encoding:'utf8'});
const at=new Date().toISOString();
save('preservation.json',{at,result:'PASS_FILE_PRESERVATION',preexistingFiles:baseline.files.length,allHashesUnchanged:true,ignoredReferencesVerified:ignored,privateAndSqlReferencesUnchanged:true,approvedManifestUnchanged:true,approvedOriginalArtifacts:13,backupUnchanged:true,trackedGitStatusUnchanged:true,newFilesOnlyInOwnedDirectory:true,sqlExecutions:0,dockerCommands:0,cimQueries:0,containerMutations:0,recoveryExecuted:false,commits:0,livePreflightExecuted:false});
const artifacts=['preflight-readonly.proposed.mjs','preflight-policy.mjs','offline.verify.mjs','informe.md','procedure.md'].map(n=>({path:d+n,sha256:sha(d+n),bytes:fs.statSync(d+n).size}));
save('additional-approval-manifest.json',{at,purpose:'Additional readonly preflight ONLY; no recovery authorization',phaseP04T01C:'BLOCKED',authorizationRequired:true,originalManifestSha256:manifestHash,artifacts,allowedFutureMode:'--execute-readonly',futureInvocations:1,automaticRetries:false,capacity:{minimumFreeMemoryGiB:4,maximumCpuPercent:35},originalManifestModified:false,mutationsAllowed:false});
fs.writeFileSync(d+'APPROVAL_HASHES.md','# Artefactos adicionales — autorización nueva requerida\n\n'+`Manifest original conservado: \`${manifestHash}\`.\n\n`+`additional-approval-manifest.json: \`${sha(d+'additional-approval-manifest.json')}\`.\n\n`+artifacts.map(f=>`- ${path.basename(f.path)}: \`${f.sha256}\``).join('\n')+'\n\nNo se ejecutó preflight live ni recuperación. Este manifest adicional no modifica ni sustituye el manifest de restauración aprobado.\n');
const inventory=fs.readdirSync(d).filter(n=>n!=='evidence.json').map(n=>({path:d+n,sha256:sha(d+n),bytes:fs.statSync(d+n).size}));
save('evidence.json',{at,phaseP04T01C:'BLOCKED',preparationResult:'PASS_OFFLINE_ONLY',liveReadiness:'NOT_VERIFIED',offlineTests:52,preexistingFilesPreserved:baseline.files.length,approvedManifestSha256:manifestHash,additionalManifestSha256:sha(d+'additional-approval-manifest.json'),dockerCommands:0,cimQueries:0,sqlExecuted:0,restores:0,containerMutations:0,inventory,inventoryExcludesSelf:true});
console.log(JSON.stringify({preparation:'PASS_OFFLINE_ONLY',phase:'BLOCKED',tests:52,filesPreserved:baseline.files.length,originalHashesUnchanged:true,additionalManifestSha256:sha(d+'additional-approval-manifest.json'),helperSha256:sha(d+'preflight-readonly.proposed.mjs'),newFiles:inventory.length+1,liveOperations:0}));
