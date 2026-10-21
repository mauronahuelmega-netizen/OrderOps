import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const PROJECT='orderops-statistics-v1-test-74718de66a41';
export const NETWORK='supabase_network_'+PROJECT;
export const names={db:'supabase_db_'+PROJECT,kong:'supabase_kong_'+PROJECT};
export const sha=x=>createHash('sha256').update(x).digest('hex');
export const transientResty=(kind,p)=>kind==='kong'&&/^\/tmp\/resty_[A-Za-z0-9]+$/.test(p);
export function assertCollisionFree(containers,reservedNames){assert.equal(new Set(reservedNames).size,reservedNames.length);for(const name of reservedNames)assert.ok(!containers.some(x=>x.Name==='/'+name||x.Name===name),'Reserved name collision');}
const clone=x=>structuredClone(x);
export function makePayload(c,kind){
 assert.ok(['db','kong'].includes(kind));assert.equal(c.Name,'/'+names[kind]);
 assert.equal(c.Config.Labels['com.supabase.cli.project'],PROJECT);
 assert.equal(c.HostConfig.NetworkMode,NETWORK);
 assert.deepEqual(Object.keys(c.NetworkSettings.Networks),[NETWORK]);
 assert.ok(c.State.Running);if(c.State.Health)assert.equal(c.State.Health.Status,'healthy');
 assert.match(c.Image,/^sha256:[a-f0-9]{64}$/);
 const internal=kind==='db'?'5432/tcp':'8000/tcp',port=kind==='db'?'56322':'56321';
 assert.deepEqual(Object.keys(c.HostConfig.PortBindings),[internal]);
 assert.equal(c.HostConfig.PortBindings[internal].length,1);
 assert.equal(c.HostConfig.PortBindings[internal][0].HostPort,port);
 assert.ok(['','0.0.0.0','127.0.0.1'].includes(c.HostConfig.PortBindings[internal][0].HostIp));
 assert.equal(c.HostConfig.PublishAllPorts,false);
 assert.ok(!c.HostConfig.AutoRemove);assert.ok(!c.HostConfig.Privileged);
 assert.ok(!c.HostConfig.VolumesFrom?.length);assert.ok(!Object.keys(c.HostConfig.Tmpfs??{}).length);
 assert.equal(c.HostConfig.PidMode,'');assert.equal(c.HostConfig.IpcMode,'private');
 for(const m of c.Mounts){assert.equal(m.Type,'volume');assert.equal(kind,'db');assert.equal(m.Name,names.db);assert.equal(m.Destination,'/var/lib/postgresql/data');assert.equal(m.RW,true);}
 if(kind==='db')assert.equal(c.Mounts.length,1);else assert.equal(c.Mounts.length,0);
 const e=c.NetworkSettings.Networks[NETWORK];
 assert.ok(!e.Links?.length);assert.ok(!e.DriverOpts||Object.keys(e.DriverOpts).length===0);
 assert.equal(e.GwPriority??0,0,'Non-default gateway priority requires explicit preservation');
 assert.ok(!e.IPAMConfig||Object.values(e.IPAMConfig).every(x=>!x||(Array.isArray(x)&&x.length===0)),'Static IP requires separate design');
 const aliases=(e.Aliases??[]).filter(x=>x!==c.Id&&x!==c.Id.slice(0,12));
 assert.deepEqual(aliases,kind==='db'?['db','db.supabase.internal']:['kong','api.supabase.internal'],'Unexpected service aliases');
 assert.ok(e.DNSNames?.includes(names[kind]),'Automatic container DNS name absent');
 const config=clone(c.Config),host=clone(c.HostConfig);
 config.Image=c.Image; // Proven pin to SAME resolved image; no tag lookup/pull at application.
 host.PortBindings[internal]=[{HostIp:'127.0.0.1',HostPort:port}];
 return {...config,HostConfig:host,NetworkingConfig:{EndpointsConfig:{[NETWORK]:{Aliases:aliases,IPAMConfig:clone(e.IPAMConfig)}}}};
}
export function validatePayload(c,kind,p){
 assert.deepEqual(p,makePayload(c,kind),'Payload differs beyond approved representation pin and HostIp');
 const cfg=clone(c.Config);cfg.Image=c.Image;
 const actual=clone(p);delete actual.HostConfig;delete actual.NetworkingConfig;
 assert.deepEqual(actual,cfg);
 const host=clone(p.HostConfig);host.PortBindings=clone(c.HostConfig.PortBindings);
 assert.deepEqual(host,c.HostConfig,'Additional HostConfig delta');
 return {functionalDelta:'HostIp only',imageReference:{from:sha(Buffer.from(c.Config.Image)),to:c.Image,sameResolvedImage:true},configExceptImageIdentical:true,hostConfigExceptHostIpIdentical:true,serviceAliasesPreserved:true,dynamicEndpointIdentityCopied:false};
}
export function validateFleet(m,cs,vs,n,all){
 assert.equal(m.projectId,PROJECT);assert.equal(cs.length,5);
 assert.deepEqual(cs.map(x=>x.Id).sort(),m.resources.containerIds);
 assert.equal(n.Id,m.resources.networkId);assert.equal(n.Name,NETWORK);
 assert.equal(n.Labels['com.supabase.cli.project'],PROJECT);
 assert.equal(vs.length,2);assert.deepEqual(vs.map(x=>x.Name).sort(),m.resources.volumeNames);
 for(const v of vs)assert.equal(v.Labels['com.supabase.cli.project'],PROJECT);
 for(const c of cs){assert.equal(c.Config.Labels['com.supabase.cli.project'],PROJECT);assert.deepEqual(Object.keys(c.NetworkSettings.Networks),[NETWORK]);assert.ok(c.State.Running);if(c.State.Health)assert.equal(c.State.Health.Status,'healthy');}
 for(const c of all){if(cs.some(x=>x.Id===c.Id))continue;assert.ok(!c.NetworkSettings.Networks?.[NETWORK],'Foreign network sharing');assert.ok(!c.Mounts?.some(x=>m.resources.volumeNames.includes(x.Name)),'Foreign volume sharing');}
 for(const c of cs)for(const mnt of c.Mounts)assert.ok(m.resources.volumeNames.includes(mnt.Name),'Unknown mount');
}
export function classify(p,type,mounts){
 assert.ok(p.startsWith('/')&&!p.split('/').includes('..'));
 if(mounts.some(m=>p===m.Destination||p.startsWith(m.Destination+'/')))return 'VOLUME_EXCLUDED';
 if(type==='directory')return 'DIRECTORY_METADATA';
 if(p.startsWith('/run/')||p.startsWith('/usr/local/kong/pids/')||p.startsWith('/usr/local/kong/logs/'))return 'TRANSIENT_NO_RESTORE';
 if(type==='regular file'||type==='regular empty file'||type==='symbolic link')return 'PRESERVE_ARCHIVE';
 throw Error('Unclassified filesystem object');
}
// Docker cp tar: verify checksums, reject traversal/unsupported special entries. No extraction.
export function inspectTar(buf){
 const entries=[];let off=0,pax={};
 const txt=(b,a,z)=>b.subarray(a,a+z).toString().replace(/\0.*$/s,'');
 const oct=(b,a,z)=>{const s=txt(b,a,z).trim();assert.ok(!s||/^[0-7]+$/.test(s),'Unsupported tar number');return s?parseInt(s,8):0;};
 while(off+512<=buf.length){const h=buf.subarray(off,off+512);off+=512;if(h.every(x=>x===0))break;
  const expected=oct(h,148,8);let sum=0;for(let i=0;i<512;i++)sum+=i>=148&&i<156?32:h[i];assert.equal(sum,expected,'Tar checksum');
  const size=oct(h,124,12);assert.ok(off+size<=buf.length);const data=buf.subarray(off,off+size);off+=Math.ceil(size/512)*512;
  const type=txt(h,156,1)||'0';let name=txt(h,0,100);const prefix=txt(h,345,155);if(prefix)name=prefix+'/'+name;
  if(type==='x'){pax={};let pos=0;while(pos<data.length){const space=data.indexOf(32,pos);assert.ok(space>pos);const len=Number(data.subarray(pos,space).toString());assert.ok(len>0&&pos+len<=data.length);const record=data.subarray(space+1,pos+len-1).toString();const equal=record.indexOf('=');assert.ok(equal>0);pax[record.slice(0,equal)]=record.slice(equal+1);pos+=len;}continue;}
  assert.ok(['0','1','2','5'].includes(type),'Unsupported tar entry type');
  name=pax.path??name;assert.ok(!name.startsWith('/')&&!name.split('/').includes('..'),'Unsafe tar path');
  entries.push({path:name,type,size,mode:oct(h,100,8),uid:oct(h,108,8),gid:oct(h,116,8),link:pax.linkpath??txt(h,157,100),contentSha256:type==='0'?sha(data):null});pax={};
 }
 assert.ok(entries.length);return entries;
}
export function validateTransition(old,newFleet,observedNetwork,observedVolumes,retained){
 assert.equal(retained.length,2,'Originals must be retained, stopped and detached');
 for(const kind of ['db','kong']){const source=old.find(x=>x.Name==='/'+names[kind]);const archived=retained.find(x=>x.Id===source.Id);assert.ok(archived);assert.equal(archived.State.Running,false);assert.ok(!archived.NetworkSettings.Networks[NETWORK]);assert.ok(archived.Name.startsWith('/'+names[kind]+'.pre-loopback-'));assert.deepEqual(archived.Config,source.Config);assert.deepEqual(archived.HostConfig,source.HostConfig);}
 assert.equal(new Set(newFleet.map(x=>x.Id)).size,5);
 assert.equal(new Set(newFleet.map(x=>x.Name)).size,5);
 for(const c of newFleet){assert.ok(c.State.Running);if(c.State.Health)assert.equal(c.State.Health.Status,'healthy');}
 for(const c of old){const n=newFleet.find(x=>x.Name===c.Name);assert.ok(n);const kind=Object.keys(names).find(k=>c.Name==='/'+names[k]);
  if(kind){assert.notEqual(n.Id,c.Id);assert.equal(n.Image,c.Image);const p=makePayload(c,kind);const cfg=structuredClone(p);delete cfg.HostConfig;delete cfg.NetworkingConfig;assert.deepEqual(n.Config,cfg);assert.deepEqual(n.HostConfig,p.HostConfig);assert.deepEqual(Object.keys(n.NetworkSettings.Networks),[NETWORK]);const aliases=(n.NetworkSettings.Networks[NETWORK].Aliases??[]).filter(x=>x!==n.Id&&x!==n.Id.slice(0,12));assert.deepEqual(aliases,p.NetworkingConfig.EndpointsConfig[NETWORK].Aliases);}else{assert.equal(n.Id,c.Id);assert.deepEqual(n.Config,c.Config);assert.deepEqual(n.HostConfig,c.HostConfig);}
 }
 assert.equal(observedNetwork.id,old[0].NetworkSettings.Networks[NETWORK].NetworkID);
 assert.deepEqual([...observedVolumes].sort(),['supabase_db_'+PROJECT,'supabase_storage_'+PROJECT].sort());
 return true;
}
