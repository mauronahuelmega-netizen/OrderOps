// Metadata only. No SQL, HTTP/Auth, lifecycle, archive restore or native adapter.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {sha,validateFleet,makePayload,validatePayload} from '../p04-t01c-loopback-harness-20261016/policy.mjs';
const dir='docs/estadisticas-v1/p04-t01c-scope-preflight-20261016/';
const read=p=>JSON.parse(fs.readFileSync(p));
const pins=read('docs/estadisticas-v1/p04-t01c-executor-audit-20261016/pins.json');
const manifest=read('supabase/statistics-v1-test/.runtime/manifest.json');
const docker=(...args)=>execFileSync('docker',args,{encoding:'utf8',windowsHide:true,timeout:25000,maxBuffer:20e6});
try {
 const version=JSON.parse(docker('version','--format','{{json .Server}}'));
 const ids=docker('ps','-aq','--no-trunc').trim().split(/\s+/).filter(Boolean);
 const all=JSON.parse(docker('inspect',...ids)); // Raw objects remain in memory, never persisted/logged.
 const expected=[...pins.targets,...pins.others];
 const cs=expected.map(p=>{const c=all.find(c=>c.Id===p.id);assert.ok(c,'Original ID absent');assert.equal(c.Name,p.name);assert.equal(sha(Buffer.from(JSON.stringify(c.Config))),p.configHash,'Config changed');assert.equal(sha(Buffer.from(JSON.stringify(c.HostConfig))),p.hostHash,'HostConfig changed');if(p.image)assert.equal(c.Image,p.image);return c;});
 const net=JSON.parse(docker('network','inspect',pins.networkId))[0];
 const vs=JSON.parse(docker('volume','inspect',...pins.volumes));
 validateFleet(manifest,cs,vs,net,all);
 assert.deepEqual(Object.keys(net.Containers).sort(),cs.map(c=>c.Id).sort());
 const project=pins.projectId;
 assert.deepEqual(all.filter(c=>c.Config.Labels?.['com.supabase.cli.project']===project).map(c=>c.Id).sort(),cs.map(c=>c.Id).sort(),'Additional project container');
 for(const c of all.filter(c=>!cs.some(t=>t.Id===c.Id)))for(const bindings of Object.values(c.HostConfig.PortBindings??{}))assert.ok(!(bindings??[]).some(b=>['56321','56322'].includes(b.HostPort)),'Port collision');
 const payloads=pins.targets.map(p=>{const c=cs.find(c=>c.Id===p.id);const payload=makePayload(c,p.kind);validatePayload(c,p.kind,payload);assert.equal(sha(Buffer.from(JSON.stringify(payload))),p.payloadSha256);return {kind:p.kind,payloadSha256:p.payloadSha256,onlyFunctionalChange:'HostIp',matchesApproved:true};});
 const images=JSON.parse(docker('image','inspect',...pins.targets.map(p=>p.image))).map(i=>({id:i.Id,repoDigests:i.RepoDigests}));
 const layers=pins.targets.map(p=>({kind:p.kind,id:p.id,entries:docker('diff',p.id).trim().split('\n').filter(Boolean).sort()}));
 const output={at:new Date().toISOString(),result:'PASS_RESOURCE_IDENTITY',server:{version:version.Version,apiVersion:version.ApiVersion,minApiVersion:version.MinAPIVersion,os:version.Os,arch:version.Arch},project,globalMetadataInspected:all.length,foreignServicesContacted:false,containers:cs.map(c=>({id:c.Id,name:c.Name,image:c.Image,status:c.State.Status,running:c.State.Running,health:c.State.Health?.Status??'NO_HEALTHCHECK',restartCount:c.RestartCount,hostBindings:c.HostConfig.PortBindings,effectiveBindings:c.NetworkSettings.Ports,mounts:c.Mounts.map(m=>({type:m.Type,name:m.Name,destination:m.Destination,rw:m.RW})),networks:Object.keys(c.NetworkSettings.Networks),configHash:sha(Buffer.from(JSON.stringify(c.Config))),hostHash:sha(Buffer.from(JSON.stringify(c.HostConfig)))})),network:{id:net.Id,name:net.Name,driver:net.Driver,ipv6:net.EnableIPv6,attachedIds:Object.keys(net.Containers).sort(),exclusive:true},volumes:vs.map(v=>({name:v.Name,driver:v.Driver,mountpoint:v.Mountpoint,createdAt:v.CreatedAt,projectLabel:v.Labels?.['com.supabase.cli.project']})),negativeSharingChecks:'PASS_ALL_CONTAINERS_METADATA',payloads,images,layers,sqlConnections:0,mutations:0};
 fs.writeFileSync(dir+'live-resources.json',JSON.stringify(output,null,2)+'\n');
 console.log(JSON.stringify({result:output.result,engine:output.server,health:output.containers.map(c=>({name:c.name,health:c.health})),payloads:payloads.length}));
} catch {fs.writeFileSync(dir+'live-resources.json',JSON.stringify({at:new Date().toISOString(),result:'BLOCKED',reason:'Read-only command or assertion failed; raw errors suppressed to protect inspect data',sqlConnections:0,mutations:0},null,2)+'\n');console.log('BLOCKED_READONLY_RESOURCE_PREFLIGHT');process.exitCode=1;}
