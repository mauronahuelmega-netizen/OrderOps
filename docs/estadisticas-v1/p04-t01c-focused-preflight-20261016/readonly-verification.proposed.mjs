// PROPOSED runner. --review is offline. --execute-readonly REQUIRES NEW HUMAN AUTHORIZATION.
// No execution mode is invoked by this task, its finalizer, or --review.
import fs from 'node:fs';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {validateFleet} from '../p04-t01c-loopback-harness-20261016/policy.mjs';
const d='docs/estadisticas-v1/p04-t01c-focused-preflight-20261016/';const hash=b=>createHash('sha256').update(b).digest('hex');const read=p=>JSON.parse(fs.readFileSync(p));
const args=process.argv.slice(2);assert.ok(args.length===1&&['--review','--execute-readonly'].includes(args[0]),'Only explicit review or separately authorized read-only run');
const manifestBytes=fs.readFileSync(d+'readonly-query-manifest.json');assert.equal(hash(manifestBytes),'85fefde4aa8256a4f42bfa38b5cd0a8b8819b8919bc77f8643ed3823adcfd294');const q=JSON.parse(manifestBytes);
const template=fs.readFileSync(d+'verification.proposed.psql','utf8');assert.equal(hash(template),'485cf660d8230a868b4051aecce8418da9cc30d799aaec6a001f5eb0e4309a15');assert.equal(hash(template),q.queryFileSha256);
for(const x of q.queries){assert.equal(hash(x.sql),x.derivedSha256??hash(x.sql));if(x.sourcePath)assert.equal(hash(fs.readFileSync(x.sourcePath)),x.sourceSha256);if(x.referencePath)assert.equal(hash(fs.readFileSync(x.referencePath)),x.referenceSha256);}
if(args[0]==='--review'){console.log(JSON.stringify({result:'PASS_OFFLINE_REVIEW',sqlConnections:0,dockerCommands:0,queries:q.queries.length,executionAuthorized:false}));}
else {
 // This branch is a proposed procedure, not authorization. Review the exact artifact hash first.
 const docker=(a,input)=>{const r=spawnSync('docker',['--host','npipe:////./pipe/docker_engine',...a],{input,encoding:'utf8',windowsHide:true,timeout:25000,maxBuffer:20e6});assert.equal(r.status,0,'Read-only Docker preflight failed; raw output suppressed');return r.stdout;};
 const git=(a)=>{const r=spawnSync('git',['--no-optional-locks',...a],{encoding:'utf8',windowsHide:true});assert.equal(r.status,0);return r.stdout.trim();};
 assert.equal(git(['branch','--show-current']),'codex/estadisticas-v1');assert.equal(git(['rev-parse','HEAD']),'923300265323d411c5c91b7935472d5423d228d2');assert.ok(git(['rev-parse','--show-toplevel']).replaceAll('\\','/').endsWith('/OrderOps-Estadisticas'));
 const runtime='supabase/statistics-v1-test/.runtime/';assert.equal(hash(fs.readFileSync(runtime+'manifest.json')),read('docs/estadisticas-v1/p04-t01c-loopback-plan-20261016/binding-origin.json').manifestHash);
 const pins=read('docs/estadisticas-v1/p04-t01c-executor-audit-20261016/pins.json'),m=read(runtime+'manifest.json');
 assert.equal(hash(fs.readFileSync(runtime+'supabase/config.toml')),m.configHash);assert.equal(hash(fs.readFileSync(runtime+'supabase/signing_keys.json')),m.signingKeysHash);
 assert.equal(m.projectId,q.project);assert.match(m.token,/^[a-f0-9]{64}$/);
 const ids=docker(['ps','-aq','--no-trunc']).trim().split(/\s+/).filter(Boolean),all=JSON.parse(docker(['inspect',...ids]));
 const cs=[...pins.targets,...pins.others].map(p=>{const c=all.find(c=>c.Id===p.id);assert.ok(c);assert.equal(c.Name,p.name);assert.equal(hash(JSON.stringify(c.Config)),p.configHash);assert.equal(hash(JSON.stringify(c.HostConfig)),p.hostHash);return c;});
 const vs=JSON.parse(docker(['volume','inspect',...pins.volumes]));const n=JSON.parse(docker(['network','inspect',pins.networkId]))[0];validateFleet(m,cs,vs,n,all);
 assert.deepEqual(Object.keys(n.Containers).sort(),cs.map(c=>c.Id).sort());
 const db=cs.find(c=>c.Id===pins.targets.find(p=>p.kind==='db').id),kong=cs.find(c=>c.Id===pins.targets.find(p=>p.kind==='kong').id);
 assert.deepEqual(db.HostConfig.PortBindings['5432/tcp'],[{HostIp:'',HostPort:'56322'}]);assert.deepEqual(kong.HostConfig.PortBindings['8000/tcp'],[{HostIp:'',HostPort:'56321'}]);
 // Pins intentionally match current pre-intervention configuration; after recreation this runner must halt for review.
 const sql="\\set expected_token '"+m.token+"'\n"+template+"\\echo ROLLBACK_COMPLETED\n";
 const r=spawnSync('docker',['--host','npipe:////./pipe/docker_engine','exec','-i',db.Id,'psql','-X','-U','postgres','-d','postgres','-qAt'],{input:sql,encoding:'utf8',windowsHide:true,timeout:90000,maxBuffer:12e6});
 const rollbackObserved=r.stdout?.trim().endsWith('ROLLBACK_COMPLETED')??false;
 const states=[...(r.stderr??'').matchAll(/(?:ERROR|FATAL):\s+([A-Z0-9]{5})/g)].map(m=>m[1]);
 const result={at:new Date().toISOString(),exitCode:r.status,clientError:r.error?.code??null,rollbackObserved,sqlStates:states,queryResults:{},comparisons:[],status:'BLOCKED',remoteEndpointUsed:false,targetContainer:db.Id};
 try {
  assert.equal(r.status,0);assert.equal(rollbackObserved,true);assert.equal(states.length,0);
  let key;for(const line of r.stdout.split(/\r?\n/)){if(line.startsWith('RESULT_'))key=line.slice(7);else if(line.startsWith('{')){assert.ok(q.queries.some(x=>x.name===key));assert.ok(!Object.hasOwn(result.queryResults,key));result.queryResults[key]=JSON.parse(line);key=null;}}
  assert.equal(Object.keys(result.queryResults).length,q.queries.length);
  for(const x of q.queries.filter(x=>x.referencePath)){const ref=read(x.referencePath),obs=result.queryResults[x.name];for(const k of x.comparisonKeys??Object.keys(ref)){assert.deepEqual(obs[k],ref[k],x.name+'.'+k);}result.comparisons.push({name:x.name,result:'PASS_STRICT_EQUALITY'});}
  assert.equal(result.queryResults.metadata.readOnly,'on');assert.equal(result.queryResults.metadata.isolation,'repeatable read');assert.equal(result.queryResults.catalog.ledger.length,124);
  result.status='PASS_READONLY_INTEGRITY';
 } catch {result.status='BLOCKED_DIFFERENCE_OR_EXECUTION_ERROR';}
 // No raw stderr, input SQL/token or credentials are persisted. References are never rewritten.
 fs.writeFileSync(d+'sql-readonly-observed.json',JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({status:result.status,rollbackObserved,sqlStates:states,referenceUpdates:0}));if(result.status!=='PASS_READONLY_INTEGRITY')process.exitCode=1;
}
