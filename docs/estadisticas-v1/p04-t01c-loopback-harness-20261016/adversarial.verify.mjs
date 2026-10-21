import assert from 'node:assert/strict';import fs from 'node:fs';
import {PROJECT,NETWORK,names,makePayload,validatePayload,validateFleet,classify,inspectTar,validateTransition,transientResty,assertCollisionFree} from './policy.mjs';
const results=[];const check=(name,fn)=>{fn();results.push({name,result:'PASS'});};
const rejects=(name,fn)=>check(name,()=>assert.throws(fn));
const image='sha256:'+'1'.repeat(64);
function fixture(kind,id){const db=kind==='db',kong=kind==='kong';const name=db?names.db:kong?names.kong:'supabase_'+kind+'_'+PROJECT;return {Id:id.repeat(64),Name:'/'+name,Image:image,Config:{Image:'fixture:pinned-by-resolved-id',Hostname:'retained-hostname',Labels:{'com.supabase.cli.project':PROJECT},Env:['FIXTURE=synthetic'],Cmd:['original'],Entrypoint:['entrypoint'],Healthcheck:{Test:['CMD','true']}},State:{Running:true,Health:{Status:'healthy'}},HostConfig:{NetworkMode:NETWORK,PortBindings:db?{'5432/tcp':[{HostIp:'',HostPort:'56322'}]}:kong?{'8000/tcp':[{HostIp:'',HostPort:'56321'}]}:{},PublishAllPorts:false,AutoRemove:false,Privileged:false,PidMode:'',IpcMode:'private',RestartPolicy:{Name:'unless-stopped'},Binds:db?[names.db+':/var/lib/postgresql/data:rw']:[],Memory:0},Mounts:db?[{Type:'volume',Name:names.db,Destination:'/var/lib/postgresql/data',RW:true}]:[],NetworkSettings:{Networks:{[NETWORK]:{NetworkID:'network-fixture',Aliases:db?['db','db.supabase.internal']:kong?['kong','api.supabase.internal']:[kind],DNSNames:[name],IPAMConfig:null,Links:null,DriverOpts:null}}}};}
const db=fixture('db','a'),kong=fixture('kong','b');
check('valid_hostip_only_delta',()=>validatePayload(db,'db',makePayload(db,'db')));
const mutatePayload=[['env',p=>p.Env.push('EXTRA=1')],['cmd',p=>p.Cmd=['different']],['entrypoint',p=>p.Entrypoint=[]],['image',p=>p.Image='sha256:'+'2'.repeat(64)],['hostname',p=>p.Hostname='new'],['healthcheck',p=>p.Healthcheck={}],['restart',p=>p.HostConfig.RestartPolicy.Name='always'],['memory',p=>p.HostConfig.Memory=1],['mount',p=>p.HostConfig.Binds=[]],['new_port',p=>p.HostConfig.PortBindings['99/tcp']=[{HostIp:'127.0.0.1',HostPort:'99'}]],['wildcard',p=>p.HostConfig.PortBindings['5432/tcp'][0].HostIp='0.0.0.0'],['ipv6',p=>p.HostConfig.PortBindings['5432/tcp'].push({HostIp:'::',HostPort:'56322'})],['port_changed',p=>p.HostConfig.PortBindings['5432/tcp'][0].HostPort='54322'],['network',p=>p.HostConfig.NetworkMode='foreign'],['alias',p=>p.NetworkingConfig.EndpointsConfig[NETWORK].Aliases.pop()],['grant_label',p=>p.Labels.extra='x']];
for(const [label,mutate]of mutatePayload)rejects('payload_reject_'+label,()=>{const p=makePayload(db,'db');mutate(p);validatePayload(db,'db',p);});
for(const [label,mutate]of [['privileged',c=>c.HostConfig.Privileged=true],['publish_all',c=>c.HostConfig.PublishAllPorts=true],['volumes_from',c=>c.HostConfig.VolumesFrom=['foreign']],['static_ip',c=>c.NetworkSettings.Networks[NETWORK].IPAMConfig={IPv4Address:'192.0.2.1'}],['unknown_mount',c=>c.Mounts[0].Name='foreign'],['unhealthy',c=>c.State.Health.Status='unhealthy'],['wrong_role_target',c=>c.Name='/supabase_auth_'+PROJECT]])rejects('source_reject_'+label,()=>{const c=structuredClone(db);mutate(c);makePayload(c,'db');});
const fleet=[db,kong,fixture('auth','c'),fixture('rest','d'),fixture('storage','e')];
const volumes=[{Name:names.db,Labels:{'com.supabase.cli.project':PROJECT}},{Name:'supabase_storage_'+PROJECT,Labels:{'com.supabase.cli.project':PROJECT}}];
const network={Name:NETWORK,Id:'network-fixture',Labels:{'com.supabase.cli.project':PROJECT}};
const manifest={projectId:PROJECT,resources:{containerIds:fleet.map(x=>x.Id).sort(),networkId:network.Id,volumeNames:volumes.map(x=>x.Name).sort()}};
check('exclusive_fleet',()=>validateFleet(manifest,fleet,volumes,network,fleet));
rejects('reserved_name_collision',()=>assertCollisionFree(fleet,[names.db]));
rejects('reserved_names_duplicate',()=>assertCollisionFree([],['same','same']));
check('reserved_name_free',()=>assertCollisionFree(fleet,['unused']));
rejects('foreign_network_sharing',()=>{const c=fixture('foreign','f');validateFleet(manifest,fleet,volumes,network,[...fleet,c]);});
rejects('foreign_volume_sharing',()=>{const c=fixture('foreign','f');c.NetworkSettings.Networks={};c.Mounts=[{Name:names.db}];validateFleet(manifest,fleet,volumes,network,[...fleet,c]);});
rejects('id_discontinuity_unapproved',()=>{const m=structuredClone(manifest);m.resources.containerIds[0]='other';validateFleet(m,fleet,volumes,network,fleet);});
check('volume_not_copied',()=>assert.equal(classify('/var/lib/postgresql/data','directory',db.Mounts),'VOLUME_EXCLUDED'));
check('key_requires_archive',()=>assert.equal(classify('/etc/postgresql-custom/pgsodium_root.key','regular file',db.Mounts),'PRESERVE_ARCHIVE'));
check('pid_not_restored',()=>assert.equal(classify('/run/postgresql/socket','socket',db.Mounts),'TRANSIENT_NO_RESTORE'));
rejects('unknown_special_file',()=>classify('/etc/unknown','block special file',[]));
check('resty_scope_narrow',()=>{assert.ok(transientResty('kong','/tmp/resty_abc123'));assert.ok(!transientResty('db','/tmp/resty_abc123'));assert.ok(!transientResty('kong','/tmp/orderops-estadisticas-recovered.dump'));assert.ok(!transientResty('kong','/home/kong/localhost.key'));});
function tar(name,type='0'){const h=Buffer.alloc(512);h.write(name);h.write('0000644\0',100);h.write('0000000\0',108);h.write('0000000\0',116);h.write('00000000000\0',124);h.fill(32,148,156);h.write(type,156);let sum=0;for(const b of h)sum+=b;h.write(sum.toString(8).padStart(6,'0')+'\0 ',148);return Buffer.concat([h,Buffer.alloc(1024)]);}
check('valid_tar',()=>assert.equal(inspectTar(tar('config'))[0].path,'config'));
rejects('tar_traversal',()=>inspectTar(tar('../escape')));rejects('tar_absolute',()=>inspectTar(tar('/absolute')));rejects('tar_special',()=>inspectTar(tar('device','3')));rejects('tar_bad_checksum',()=>{const t=tar('config');t[0]^=1;inspectTar(t);});
const next=structuredClone(fleet);for(const [kind,i]of [['db',0],['kong',1]]){const p=makePayload(fleet[i],kind);next[i].Id=(kind==='db'?'6':'7').repeat(64);next[i].Config={...p};delete next[i].Config.HostConfig;delete next[i].Config.NetworkingConfig;next[i].HostConfig=p.HostConfig;next[i].NetworkSettings.Networks[NETWORK].Aliases=p.NetworkingConfig.EndpointsConfig[NETWORK].Aliases;}
const retained=structuredClone([db,kong]);for(const c of retained){c.Name+='.pre-loopback-fixture';c.State.Running=false;c.NetworkSettings.Networks={};}
check('explicit_transition_valid',()=>validateTransition(fleet,next,{id:network.Id},volumes.map(x=>x.Name),retained));
rejects('transition_lost_env',()=>{const n=structuredClone(next);n[0].Config.Env=[];validateTransition(fleet,n,{id:network.Id},volumes.map(x=>x.Name),retained);});
rejects('transition_changes_auth',()=>{const n=structuredClone(next);n[2].Id='f'.repeat(64);validateTransition(fleet,n,{id:network.Id},volumes.map(x=>x.Name),retained);});
rejects('transition_second_db_writer',()=>{const r=structuredClone(retained);r[0].State.Running=true;validateTransition(fleet,next,{id:network.Id},volumes.map(x=>x.Name),r);});
rejects('transition_old_aliases_attached',()=>{const r=structuredClone(retained);r[0].NetworkSettings.Networks[NETWORK]={};validateTransition(fleet,next,{id:network.Id},volumes.map(x=>x.Name),r);});
const output={at:new Date().toISOString(),result:'PASS_OFFLINE_ONLY',tests:results.length,results,sql:0,containersChanged:0};fs.writeFileSync(new URL('./adversarial-results.json',import.meta.url),JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify({result:output.result,tests:results.length}));
