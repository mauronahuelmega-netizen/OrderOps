// Metadata inspection only. No exec in containers, SQL, HTTP, lifecycle or firewall operations.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {validateResources,validateConfig} from '../../../scripts/statistics-v1/isolation-policy.mjs';
const dir='docs/estadisticas-v1/p04-t01c-loopback-plan-20261016/';
const hash=x=>createHash('sha256').update(x).digest('hex');
function run(bin,args){const r=spawnSync(bin,args,{encoding:'utf8',windowsHide:true,timeout:30000,maxBuffer:16e6});assert.equal(r.status,0,bin+' metadata operation failed');return r.stdout.trim();}
const branch=run('git',['--no-optional-locks','branch','--show-current']);
const head=run('git',['--no-optional-locks','rev-parse','HEAD']);
assert.equal(branch,'codex/estadisticas-v1');assert.equal(head,'923300265323d411c5c91b7935472d5423d228d2');
const runtime='supabase/statistics-v1-test/.runtime/';
const m=JSON.parse(fs.readFileSync(runtime+'manifest.json'));
const project='orderops-statistics-v1-test-74718de66a41';assert.equal(m.projectId,project);
const config=fs.readFileSync(runtime+'supabase/config.toml');validateConfig(config.toString(),project);assert.equal(hash(config),m.configHash);
const names=run('docker',['ps','-a','--filter','label=com.supabase.cli.project='+project,'--format','{{.Names}}']).split(/\r?\n/);assert.equal(names.length,5);
const cs=JSON.parse(run('docker',['container','inspect',...names]));
const vs=JSON.parse(run('docker',['volume','inspect',...m.resources.volumeNames]));
const net=JSON.parse(run('docker',['network','inspect','supabase_network_'+project]))[0];
assert.deepEqual(validateResources(m,cs,vs,net),m.resources);
const entries=cs.map(c=>({id:c.Id,name:c.Name,running:c.State.Running,health:c.State.Health?.Status??'NO_HEALTHCHECK',image:c.Image,labels:c.Config.Labels,requestedBindings:c.HostConfig.PortBindings,effectiveBindings:c.NetworkSettings.Ports,networkMode:c.HostConfig.NetworkMode,networks:Object.keys(c.NetworkSettings.Networks),mounts:c.Mounts.map(x=>({type:x.Type,name:x.Name,destination:x.Destination})),restartPolicy:c.HostConfig.RestartPolicy,configHash:hash(JSON.stringify(c.Config)),hostConfigHash:hash(JSON.stringify(c.HostConfig))}));
const diffs={};for(const kind of ['db','kong']){const name='supabase_'+kind+'_'+project;diffs[kind]=run('docker',['diff',name]).split(/\r?\n/);}
const result={at:new Date().toISOString(),branch,head,projectId:project,cli:{path:run('where.exe',['supabase']),version:run('supabase',['--version']),startHelp:run('supabase',['start','--help'])},engineVersion:run('docker',['version','--format','{{.Server.Version}}']),resources:entries,network:{id:net.Id,name:net.Name,options:net.Options},volumes:vs.map(x=>({name:x.Name,driver:x.Driver,labels:x.Labels})),writableLayerPathsOnly:diffs,filesAudited:['scripts/statistics-v1/isolated-environment.mjs','scripts/statistics-v1/isolation-policy.mjs','supabase/statistics-v1-test/config.template.toml',runtime+'supabase/config.toml'].map(p=>({path:p,sha256:hash(fs.readFileSync(p))})),manifestHash:hash(fs.readFileSync(runtime+'manifest.json')),sqlConnections:0,authHttp:0,lifecycleChanges:0,firewallChanges:0};
fs.writeFileSync(dir+'binding-origin.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({result:'PASS_METADATA_ONLY',containers:cs.length,volumes:vs.length,cli:result.cli.version,engine:result.engineVersion,sql:0,changes:0}));
