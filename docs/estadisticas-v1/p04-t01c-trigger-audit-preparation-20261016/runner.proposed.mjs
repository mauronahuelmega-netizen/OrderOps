// Independent proposed runner. Preparation invokes --review ONLY; live needs new explicit authorization.
import fs from 'node:fs';import {spawnSync} from 'node:child_process';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {parseOutput,validateCapture,verifyArtifacts} from './validation.mjs';
import {validateFleet} from '../p04-t01c-loopback-harness-20261016/policy.mjs';
const dir='docs/estadisticas-v1/p04-t01c-trigger-audit-preparation-20261016/';
const PIN_MANIFEST_SHA='db9310b204b3dbe41284c778abe66d01685982d20c5246ff7035c392fd6b36fa';
const sha=b=>createHash('sha256').update(b).digest('hex');const read=p=>JSON.parse(fs.readFileSync(p));
let stage='MODE';let intentCreated=false;let childResult=null;
try{
 const args=process.argv.slice(2);assert.ok(args.length===1&&['--review','--execute-readonly'].includes(args[0]));stage='ARTIFACT_HASHES';
 const pinBytes=fs.readFileSync(dir+'artifact-pins.json');assert.equal(sha(pinBytes),PIN_MANIFEST_SHA);const pins=JSON.parse(pinBytes);
 const bytes=Object.fromEntries(pins.files.map(p=>[p.path,fs.readFileSync(p.path)]));verifyArtifacts(bytes,pins.files);
 const targets=read(dir+'targets.json');const template=fs.readFileSync(dir+'verification.proposed.psql','utf8');
 if(args[0]==='--review'){console.log(JSON.stringify({status:'PASS_OFFLINE_PACKAGE_REVIEW',targets:targets.length,sqlConnections:0,dockerCommands:0,executionAuthorized:false}));}
 else{
  // Each attempt consumes its own intent file; no retry/resume flag and no overwrite.
  stage='SINGLE_ATTEMPT_INTENT';const fd=fs.openSync(dir+'execution-intent.json','wx');fs.writeSync(fd,JSON.stringify({at:new Date().toISOString(),invocations:1,pinsSha256:PIN_MANIFEST_SHA,mode:'--execute-readonly'})+'\n');fs.fsyncSync(fd);fs.closeSync(fd);intentCreated=true;
  const command=(bin,args,input,timeout=25000)=>{const r=spawnSync(bin,args,{input,encoding:'utf8',windowsHide:true,timeout,maxBuffer:12e6});assert.equal(r.status,0);return r.stdout;};
  const git=(...a)=>command('git',['--no-optional-locks',...a]).trim();const docker=(...a)=>command('docker',['--host','npipe:////./pipe/docker_engine',...a]);
  stage='GIT_IDENTITY';assert.equal(git('branch','--show-current'),'codex/estadisticas-v1');assert.equal(git('rev-parse','HEAD'),'923300265323d411c5c91b7935472d5423d228d2');assert.ok(git('rev-parse','--show-toplevel').replaceAll('\\','/').endsWith('/OrderOps-Estadisticas'));
  stage='PRIVATE_IDENTITY';const runtime='supabase/statistics-v1-test/.runtime/';assert.equal(sha(fs.readFileSync(runtime+'manifest.json')),pins.privateManifestSha256);const m=read(runtime+'manifest.json');assert.equal(m.projectId,'orderops-statistics-v1-test-74718de66a41');assert.match(m.token,/^[a-f0-9]{64}$/);assert.equal(sha(fs.readFileSync(runtime+'supabase/config.toml')),m.configHash);assert.equal(sha(fs.readFileSync(runtime+'supabase/signing_keys.json')),m.signingKeysHash);
  stage='DOCKER_ORIGINAL_RESOURCES';const rp=read('docs/estadisticas-v1/p04-t01c-executor-audit-20261016/pins.json');const ids=docker('ps','-aq','--no-trunc').trim().split(/\s+/).filter(Boolean);const all=JSON.parse(docker('inspect',...ids));
  const cs=[...rp.targets,...rp.others].map(p=>{const c=all.find(c=>c.Id===p.id);assert.ok(c);assert.equal(c.Name,p.name);assert.equal(sha(JSON.stringify(c.Config)),p.configHash);assert.equal(sha(JSON.stringify(c.HostConfig)),p.hostHash);if(p.image)assert.equal(c.Image,p.image);return c;});
  const vs=JSON.parse(docker('volume','inspect',...rp.volumes)),n=JSON.parse(docker('network','inspect',rp.networkId))[0];validateFleet(m,cs,vs,n,all);assert.deepEqual(Object.keys(n.Containers).sort(),cs.map(c=>c.Id).sort());
  const db=cs.find(c=>c.Id===rp.targets.find(p=>p.kind==='db').id);assert.deepEqual(db.HostConfig.PortBindings['5432/tcp'],[{HostIp:'',HostPort:'56322'}]);const kong=cs.find(c=>c.Id===rp.targets.find(p=>p.kind==='kong').id);assert.deepEqual(kong.HostConfig.PortBindings['8000/tcp'],[{HostIp:'',HostPort:'56321'}]);
  stage='SINGLE_SQL_TRANSACTION';const startedUtc=new Date().toISOString();
  childResult=spawnSync('docker',['--host','npipe:////./pipe/docker_engine','exec','-i',db.Id,'psql','-X','-U','postgres','-d','postgres','-qAt'],{input:"\\set expected_token '"+m.token+"'\n"+template,encoding:'utf8',windowsHide:true,timeout:90000,maxBuffer:2e6});
  assert.equal(childResult.status,0);assert.ok(!childResult.stderr?.trim());stage='STRICT_CAPTURE_VALIDATION';const capture=parseOutput(childResult.stdout);const conclusion=validateCapture(capture,targets);
  fs.writeFileSync(dir+'execution-observed.json',JSON.stringify({startedUtc,endedUtc:new Date().toISOString(),targetContainer:db.Id,invocations:1,rollbackObserved:true,conclusion,capture,phaseP04T01C:'BLOCKED'},null,2)+'\n');console.log(JSON.stringify({status:conclusion.status,rollbackObserved:true,phaseP04T01C:'BLOCKED',invocations:1}));
 }
}catch{
 const result={at:new Date().toISOString(),status:'BLOCKED_UNEXPECTED_NO_RETRY',stage,attemptIntentCreated:intentCreated,sqlProcessInvoked:childResult!==null,exitCode:childResult?.status??null,clientErrorCode:childResult?.error?.code??null,sqlStates:[...(childResult?.stderr??'').matchAll(/(?:ERROR|FATAL):\s+([A-Z0-9]{5})/g)].map(m=>m[1]),stdoutSha256:childResult?sha(childResult.stdout??''):null,rollbackObserved:childResult?.status===0&&childResult?.stdout?.trim().endsWith('ROLLBACK_COMPLETED')||false,rawOutputPersisted:false,phaseP04T01C:'BLOCKED'};
 if(intentCreated)fs.writeFileSync(dir+'execution-observed.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));process.exitCode=1;
}
