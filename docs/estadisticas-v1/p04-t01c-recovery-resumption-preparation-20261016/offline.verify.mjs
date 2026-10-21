// Synthetic fixtures only. No CIM, Docker, SQL, network, or restoration calls.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {capacityGate,imageGate,collisionGate,IMAGE} from './preflight-policy.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));const tests=[];
const test=(name,fn)=>{fn();tests.push({name,result:'PASS'});};
const copy=v=>structuredClone(v);
const capacity={startUtc:'2026-10-16T00:00:00Z',endUtc:'2026-10-16T00:00:01Z',processors:[{loadPercentage:35}],freePhysicalMemoryKiB:4194304,totalVisibleMemoryKiB:16777216};
const image=[{Id:IMAGE,Os:'linux',Architecture:'amd64',Size:100,RepoDigests:[],RootFS:{Type:'layers',Layers:['sha256:'+'a'.repeat(64)]},Config:{Volumes:null,User:'postgres',WorkingDir:'/',Env:['PRIVATE_PLACEHOLDER=not-logged'],Cmd:['postgres'],Entrypoint:['entrypoint.sh']}}];
test('capacity exact 4 GiB and 35% accepted',()=>assert.equal(capacityGate(capacity).availableMemoryGiB,4));
test('CPU same arithmetic mean per processor as approved observation',()=>{const c=copy(capacity);c.processors=[{loadPercentage:30},{loadPercentage:40}];assert.equal(capacityGate(c).cpuPercent,35);});
for(const [name,change]of [
 ['below 4 GiB',c=>c.freePhysicalMemoryKiB--],['above 35%',c=>c.processors[0].loadPercentage=35.01],
 ['null CPU',c=>c.processors[0].loadPercentage=null],['unknown CPU',c=>delete c.processors[0].loadPercentage],
 ['no CPUs',c=>c.processors=[]],['NaN CPU',c=>c.processors[0].loadPercentage=NaN],['negative CPU',c=>c.processors[0].loadPercentage=-1],
 ['null RAM',c=>c.freePhysicalMemoryKiB=null],['string RAM',c=>c.freePhysicalMemoryKiB='4194304'],
 ['RAM exceeds total',c=>c.freePhysicalMemoryKiB=c.totalVisibleMemoryKiB+1],['unknown total RAM',c=>delete c.totalVisibleMemoryKiB],
 ['invalid UTC',c=>c.startUtc='invalid'],['capture over 30s',c=>c.endUtc='2026-10-16T00:01:00Z'],['reverse clock',c=>c.endUtc='2026-10-15T00:00:00Z']
])test('capacity rejects '+name,()=>{const c=copy(capacity);change(c);assert.throws(()=>capacityGate(c));});
test('explicit null Volumes recorded',()=>assert.equal(imageGate(image).declaredVolumes,null));
test('explicit empty Volumes accepted',()=>{const i=copy(image);i[0].Config.Volumes={};assert.deepEqual(imageGate(i).declaredVolumes,{});});
test('only approved PGDATA volume accepted',()=>{const i=copy(image);i[0].Config.Volumes={'/var/lib/postgresql/data':{}};assert.equal(Object.keys(imageGate(i).declaredVolumes).length,1);});
test('empty RepoDigests not misreported as repository proof',()=>assert.equal(imageGate(image).repositoryProvenance,'NOT_AVAILABLE_EMPTY_LIST'));
test('environment values not exported',()=>assert.ok(!JSON.stringify(imageGate(image)).includes('not-logged')));
for(const [name,change]of [
 ['missing Volumes',i=>delete i[0].Config.Volumes],['unexpected volume',i=>i[0].Config.Volumes={'/foreign':{}}],
 ['malformed volume metadata',i=>i[0].Config.Volumes={'/var/lib/postgresql/data':null}],['Volumes array',i=>i[0].Config.Volumes=[]],
 ['wrong digest',i=>i[0].Id='sha256:'+'b'.repeat(64)],['unknown digest',i=>delete i[0].Id],['unknown config',i=>delete i[0].Config],
 ['unknown Env',i=>delete i[0].Config.Env],['unknown Cmd',i=>delete i[0].Config.Cmd],['unknown Entrypoint',i=>delete i[0].Config.Entrypoint],
 ['unknown User',i=>delete i[0].Config.User],['unknown WorkingDir',i=>delete i[0].Config.WorkingDir],
 ['unknown RepoDigests',i=>delete i[0].RepoDigests],['malformed RepoDigest',i=>i[0].RepoDigests=['mutable:latest']],
 ['unknown RootFS',i=>delete i[0].RootFS],['empty layers',i=>i[0].RootFS.Layers=[]],['wrong OS',i=>i[0].Os='windows'],
 ['wrong architecture',i=>i[0].Architecture='arm64'],['unknown size',i=>delete i[0].Size],['two images',i=>i.push(copy(i[0]))]
])test('image rejects '+name,()=>{const i=copy(image);change(i);assert.throws(()=>imageGate(i));});
test('no collision',()=>assert.equal(collisionGate('','\r\n').result,'PASS_CONTAINER_NAME_AND_LABEL_ABSENT'));
test('name collision',()=>assert.throws(()=>collisionGate('a'.repeat(64),'')));
test('label collision under another name',()=>assert.throws(()=>collisionGate('','b'.repeat(64))));
test('malformed collision response',()=>assert.throws(()=>collisionGate('warning','')));
test('missing collision response',()=>assert.throws(()=>collisionGate(null,'')));
const runner=fs.readFileSync(path.join(here,'preflight-readonly.proposed.mjs'),'utf8');
test('raw JSON inspect replaces failing Go template',()=>{assert.ok(runner.includes("['image','inspect',IMAGE]"));assert.ok(!runner.includes('--format'));});
test('one capture with fail-before-Docker sequence',()=>{assert.equal((runner.match(/run\('powershell.exe'/g)||[]).length,1);assert.ok(runner.indexOf('capacityGate(measured)')<runner.indexOf('stage=\'image\''));assert.ok(!/setInterval|setTimeout|while\s*\(|for\s*\(.*retry/.test(runner));});
test('exclusive attempt lock and fixed named pipe',()=>{assert.ok(runner.includes("'wx',0o600"));assert.ok(runner.includes('npipe:////./pipe/docker_engine'));});
test('no Docker mutation verbs in allowlist',()=>{assert.ok(!/\['(?:create|start|stop|rm|run|exec|pull|build|restart|update|network|volume)'/.test(runner));});
test('default review performs no external reads',()=>{const r=spawnSync(process.execPath,[path.join(here,'preflight-readonly.proposed.mjs')],{encoding:'utf8',timeout:5000});assert.equal(r.status,0);const j=JSON.parse(r.stdout);assert.equal(j.result,'PREPARED_ONLY');assert.equal(j.liveExecuted,false);});
test('invalid mode fails before live access',()=>{const r=spawnSync(process.execPath,[path.join(here,'preflight-readonly.proposed.mjs'),'--restore'],{encoding:'utf8',timeout:5000});assert.equal(r.status,1);assert.equal(JSON.parse(r.stdout).stage,'arguments');});
assert.ok(!fs.existsSync(path.join(here,'future-readonly-attempt.json')));
const output={at:new Date().toISOString(),result:'PASS_OFFLINE_ONLY',count:tests.length,tests,cimCalls:0,dockerCalls:0,sqlExecutions:0,restores:0,livePreflightExecuted:false,syntheticFixtures:true};
fs.writeFileSync(path.join(here,'offline-results.json'),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({result:output.result,tests:tests.length,dockerCalls:0,cimCalls:0}));
