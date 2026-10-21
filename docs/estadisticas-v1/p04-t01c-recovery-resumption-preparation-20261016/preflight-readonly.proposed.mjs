// Additional artifact, not part of the approved restoration manifest.
// Default is offline --review. Future --execute-readonly requires separate human authorization.
// This runner contains no Docker lifecycle operation, SQL, restore, initdb or staging.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {capacityGate,imageGate,collisionGate,IMAGE,NAME,LABEL,MANIFEST} from './preflight-policy.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const prior=path.resolve(here,'../p04-t01c-recovery-kong-decision-20261016');
const root=path.resolve(here,'../../..');
const sha=b=>createHash('sha256').update(b).digest('hex');
// Fixed read-only allowlist, no caller-supplied commands, IDs, host or paths.
const dockerArgs=[
 ['image','inspect',IMAGE],
 ['ps','-aq','--no-trunc','--filter',`name=^/${NAME}$`],
 ['ps','-aq','--no-trunc','--filter',`label=${LABEL}`]
];
const cim="$ErrorActionPreference='Stop'; $s=(Get-Date).ToUniversalTime().ToString('o'); $p=@(Get-CimInstance Win32_Processor); if($p.Count -lt 1){throw 'CPU_NOT_AVAILABLE'}; $o=Get-CimInstance Win32_OperatingSystem; if($null -eq $o){throw 'MEMORY_NOT_AVAILABLE'}; [pscustomobject]@{startUtc=$s;endUtc=(Get-Date).ToUniversalTime().ToString('o');processors=@($p | ForEach-Object { [pscustomobject]@{loadPercentage=$_.LoadPercentage} });freePhysicalMemoryKiB=$o.FreePhysicalMemory;totalVisibleMemoryKiB=$o.TotalVisibleMemorySize} | ConvertTo-Json -Depth 4 -Compress";
const deadline=Date.now()+90000;
const run=(cmd,args,timeout)=>{
 const remaining=deadline-Date.now();assert.ok(remaining>0,'PREFLIGHT_PROCESS_BUDGET_EXHAUSTED');
 const r=spawnSync(cmd,args,{encoding:'utf8',windowsHide:true,timeout:Math.min(timeout,remaining),maxBuffer:8*1024*1024,cwd:root});
 // Do not expose Docker raw Config/Env or raw stderr to output.
 assert.ok(!r.error&&r.status===0&&r.signal===null&&!r.stderr?.trim(),'READ_COMMAND_FAILED_NO_RETRY');return r.stdout;
};
const records=[];let stage='arguments';let fd;
try{
 const a=process.argv.slice(2);
 assert.ok(a.length===0||a.length===1&&['--review','--execute-readonly'].includes(a[0]),'INVALID_MODE');
 if(a[0]!=='--execute-readonly')console.log(JSON.stringify({result:'PREPARED_ONLY',liveExecuted:false,mutationsReachable:false,futureReadOnlyCommands:dockerArgs}));
 else{
  // Exclusive durable attempt record: even a failed preflight cannot be rerun automatically.
  fd=fs.openSync(path.join(here,'future-readonly-attempt.json'),'wx',0o600);
  records.push({at:new Date().toISOString(),stage:'START',purpose:'Only readonly preflight; never recovery'});
  const flush=()=>{fs.ftruncateSync(fd,0);fs.writeSync(fd,JSON.stringify({phaseP04T01C:'BLOCKED',records},null,2)+'\n',0,'utf8');fs.fsyncSync(fd);};flush();
  stage='packageHashes';const b=fs.readFileSync(path.join(prior,'recovery-approval-manifest.json'));assert.equal(sha(b),MANIFEST,'MANIFEST_HASH');
  const m=JSON.parse(b);for(const f of m.runtimeAndProcedureFiles)assert.equal(sha(fs.readFileSync(path.join(root,f.path))),f.sha256,'APPROVED_ARTIFACT_HASH');
  assert.equal(sha(fs.readFileSync(m.backup.path)),m.backup.sha256,'SOURCE_BACKUP_HASH');records.push({stage,result:'PASS',artifacts:m.runtimeAndProcedureFiles.length});flush();
  stage='worktree';assert.equal(run('git',['branch','--show-current'],10000).trim(),'codex/estadisticas-v1');assert.equal(run('git',['rev-parse','HEAD'],10000).trim(),'923300265323d411c5c91b7935472d5423d228d2');records.push({stage,result:'PASS'});flush();
  stage='capacity';const measured=JSON.parse(run('powershell.exe',['-NoProfile','-NonInteractive','-Command',cim],30000));
  // Measurements are not secrets. Preserve failed observations too, without defaulting null to zero.
  records.push({stage:'capacityObservation',startUtc:measured.startUtc,endUtc:measured.endUtc,processors:measured.processors,freePhysicalMemoryKiB:measured.freePhysicalMemoryKiB,totalVisibleMemoryKiB:measured.totalVisibleMemoryKiB});flush();
  records.push({stage,...capacityGate(measured)});flush();
  // Failed capacity => no Docker reads; no remeasurement or retry.
  stage='image';records.push({stage,...imageGate(JSON.parse(run('docker',['--host','npipe:////./pipe/docker_engine',...dockerArgs[0]],15000)))});flush();
  stage='collision';const name=run('docker',['--host','npipe:////./pipe/docker_engine',...dockerArgs[1]],15000);collisionGate(name,'');
  const label=run('docker',['--host','npipe:////./pipe/docker_engine',...dockerArgs[2]],15000);records.push({stage,...collisionGate(name,label)});flush();
  stage='complete';records.push({stage,result:'READONLY_CHECKS_PASS_ONLY',at:new Date().toISOString(),recoveryAuthorized:false,notAFullResourcePressureOrOomAudit:true});flush();
  console.log('READONLY_CHECKS_PASS_ONLY; P04-T01C BLOCKED; recovery not started');
 }
}catch(e){
 // Only validation messages are emitted; process stderr/raw inspected image never exported.
 const message=String(e?.message||'UNEXPECTED').split('\n')[0];
 const reason=/^[A-Z][A-Z0-9_: ]+$/.test(message)?message:'VALIDATION_ERROR_DETAILS_SUPPRESSED';
 records.push({at:new Date().toISOString(),stage,result:'BLOCKED',reason});
 if(fd!==undefined){fs.ftruncateSync(fd,0);fs.writeSync(fd,JSON.stringify({phaseP04T01C:'BLOCKED',records},null,2)+'\n',0,'utf8');fs.fsyncSync(fd);}
 console.log(JSON.stringify({result:'BLOCKED',stage,reason,noRetry:true,mutations:0}));process.exitCode=1;
}finally{if(fd!==undefined)fs.closeSync(fd);}
