// Preparation harness. ONLY --dry-run is executable. Mutation modes deliberately rejected.
// Sensitive inspect/config/archive material exists only in memory and an AES-GCM/DPAPI sealed bundle.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';import {randomBytes,createCipheriv,createDecipheriv} from 'node:crypto';
import {PROJECT,NETWORK,names,sha,makePayload,validatePayload,validateFleet,classify,inspectTar,transientResty,assertCollisionFree} from './policy.mjs';
let stage='arguments';try {
assert.deepEqual(process.argv.slice(2),['--dry-run'],'Only --dry-run authorized/implemented; no apply/rollback execution');
const out='docs/estadisticas-v1/p04-t01c-loopback-harness-20261016/';
function run(bin,args,{input,bytes=false,limit=16e6}={}){const r=spawnSync(bin,args,{input,encoding:bytes?undefined:'utf8',windowsHide:true,timeout:30000,maxBuffer:limit});if(r.error||r.status!==0)throw Error('Read operation failed: '+bin+'; raw output suppressed');return bytes?r.stdout:r.stdout.trim();}
const git=(...a)=>run('git',['--no-optional-locks',...a]);
const docker=(...a)=>run('docker',a);
assert.equal(path.basename(git('rev-parse','--show-toplevel')),'OrderOps-Estadisticas');
assert.equal(git('branch','--show-current'),'codex/estadisticas-v1');assert.equal(git('rev-parse','HEAD'),'923300265323d411c5c91b7935472d5423d228d2');
const m=JSON.parse(fs.readFileSync('supabase/statistics-v1-test/.runtime/manifest.json'));
const runId=new Date().toISOString().replace(/[:.]/g,'-')+'-'+randomBytes(4).toString('hex');
const privateDir='supabase/statistics-v1-test/.runtime/loopback-bundles/'+runId;
assert.equal(spawnSync('git',['check-ignore','-q',privateDir+'/sealed.json'],{windowsHide:true}).status,0,'Private path must be ignored');
assert.equal(git('ls-files','--',privateDir),'');
let ancestor=path.resolve(privateDir);while(!fs.existsSync(ancestor))ancestor=path.dirname(ancestor);
for(let p=ancestor;;p=path.dirname(p)){assert.ok(!fs.lstatSync(p).isSymbolicLink(),'No symlink storage');if(p===path.parse(p).root)break;}
const ownNames=docker('ps','-a','--filter','label=com.supabase.cli.project='+PROJECT,'--format','{{.Names}}').split(/\r?\n/);
stage='fleet_metadata';
const cs=JSON.parse(docker('container','inspect',...ownNames));
const volumes=JSON.parse(docker('volume','inspect',...m.resources.volumeNames));
const network=JSON.parse(docker('network','inspect',NETWORK))[0];
const ids=docker('ps','-aq').split(/\r?\n/).filter(Boolean);
const all=JSON.parse(docker('container','inspect',...ids));validateFleet(m,cs,volumes,network,all);
assertCollisionFree(all,Object.values(names).flatMap(name=>['.pre-loopback-'+runId,'.loopback-failed-'+runId].map(suffix=>name+suffix)));
const sensitive={runId,projectId:PROJECT,manifestHash:sha(fs.readFileSync('supabase/statistics-v1-test/.runtime/manifest.json')),targets:[]};
const summaries=[],layers=[];let totalBytes=0;
for(const kind of ['db','kong']){
 stage='payload_'+kind;
 const c=cs.find(x=>x.Name==='/'+names[kind]);const payload=makePayload(c,kind);const delta=validatePayload(c,kind,payload);
 const image=JSON.parse(docker('image','inspect',c.Image))[0];assert.equal(image.Id,c.Image);
 const target={kind,originalInspect:c,payload,archives:[],directoryMetadata:[],diff:docker('diff',c.Id).split(/\r?\n/).filter(Boolean).sort()};
 for(const line of target.diff){assert.match(line,/^[ACD] \/[^\r\n]*$/);assert.ok(!line.startsWith('D '),'Deletion requires separate restoration design');const p=line.slice(2);
  stage='layer_'+kind+'_'+p;
  if(transientResty(kind,p)){layers.push({kind,path:p,change:line[0],type:'NOT_AVAILABLE_VOLATILE',disposition:'TRANSIENT_NO_RESTORE',reason:'Kong resty scratch path; may disappear during live observation',liveCaptureNotStoppedCheckpoint:true});continue;}
  const stat=docker('exec',c.Id,'stat','-c','%F|%a|%u|%g|%s','--',p).split('|');assert.equal(stat.length,5);
  const [type,mode,uid,gid,size]=stat;assert.ok(Number.isSafeInteger(Number(size)));
  const disposition=classify(p,type,c.Mounts);const row={kind,path:p,change:line[0],type,mode,uid:Number(uid),gid:Number(gid),size:Number(size),disposition,liveCaptureNotStoppedCheckpoint:true};
  if(disposition==='DIRECTORY_METADATA')target.directoryMetadata.push(row);
  if(disposition==='PRESERVE_ARCHIVE'){
   assert.ok(Number(size)<=32*1024*1024,'Per-file capture budget');
   const tar=run('docker',['cp',c.Id+':'+p,'-'],{bytes:true,limit:34*1024*1024});totalBytes+=tar.length;assert.ok(totalBytes<=128*1024*1024,'Total capture budget');
   const entries=inspectTar(tar);assert.equal(entries.length,1,'Single leaf capture required');
   assert.ok(entries[0].type!=='1','Hard-link needs explicit dependency design');
   row.archiveSha256=sha(tar);row.contentSha256=entries[0].contentSha256;row.entryType=entries[0].type;row.linkTargetSha256=sha(Buffer.from(entries[0].link));
   assert.equal(entries[0].uid,Number(uid));assert.equal(entries[0].gid,Number(gid));assert.equal(entries[0].mode&0o7777,parseInt(mode,8));
   target.archives.push({path:p,tarBase64:tar.toString('base64'),sha256:row.archiveSha256,entries});
  }
  layers.push(row);
 }
 const behavior=(c.Config.Entrypoint??[]).join('\n')+'\n'+(c.Config.Cmd??[]).join('\n');
 summaries.push({kind,oldId:c.Id,name:c.Name,imageId:c.Image,payloadSha256:sha(Buffer.from(JSON.stringify(payload))),originalConfigSha256:sha(Buffer.from(JSON.stringify(c.Config))),originalHostConfigSha256:sha(Buffer.from(JSON.stringify(c.HostConfig))),delta,aliases:payload.NetworkingConfig.EndpointsConfig[NETWORK].Aliases,archives:target.archives.length,entrypointReview:{containsOpenSsl:/openssl/i.test(behavior),containsFileExistenceGuard:/\[\s+!?\s*-[ef]\s/.test(behavior),containsAppendRedirect:/>>/.test(behavior),containsKeyOrCertificatePaths:/pgsodium|localhost\.(crt|key)/.test(behavior),fullCommandNeverLogged:true,replaySafety:'NOT_CERTIFIED: review privately before intervention'}});
 sensitive.targets.push(target);
}
// Capture is LIVE: prove inspect/config and diff path sets unchanged during capture, not atomic data snapshot.
for(const target of sensitive.targets){stage='post_capture_config_'+target.kind;const now=JSON.parse(docker('container','inspect',target.originalInspect.Id))[0];assert.deepEqual(now.Config,target.originalInspect.Config);assert.deepEqual(now.HostConfig,target.originalInspect.HostConfig);stage='post_capture_diff_'+target.kind;const relevant=lines=>lines.filter(x=>!transientResty(target.kind,x.slice(2))).sort();assert.deepEqual(relevant(docker('diff',now.Id).split(/\r?\n/).filter(Boolean)),relevant(target.diff));}
const key=randomBytes(32),iv=randomBytes(12);const cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(Buffer.from(PROJECT+':'+runId));
stage='seal_DPAPI';
const ciphertext=Buffer.concat([cipher.update(Buffer.from(JSON.stringify(sensitive))),cipher.final()]);
const dpapiScript="Add-Type -AssemblyName System.Security; $v=[Convert]::FromBase64String([Console]::In.ReadToEnd()); [Convert]::ToBase64String([Security.Cryptography.ProtectedData]::Protect($v,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser))";
const protectedKey=run('powershell.exe',['-NoLogo','-NoProfile','-NonInteractive','-Command',dpapiScript],{input:key.toString('base64')});
const unprotect="Add-Type -AssemblyName System.Security; $v=[Convert]::FromBase64String([Console]::In.ReadToEnd()); [Convert]::ToBase64String([Security.Cryptography.ProtectedData]::Unprotect($v,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser))";
const restoredKey=Buffer.from(run('powershell.exe',['-NoLogo','-NoProfile','-NonInteractive','-Command',unprotect],{input:protectedKey}),'base64');
const decipher=createDecipheriv('aes-256-gcm',restoredKey,iv);decipher.setAAD(Buffer.from(PROJECT+':'+runId));decipher.setAuthTag(cipher.getAuthTag());
assert.deepEqual(JSON.parse(Buffer.concat([decipher.update(ciphertext),decipher.final()])),sensitive,'Sealed bundle roundtrip');key.fill(0);restoredKey.fill(0);
fs.mkdirSync(privateDir,{recursive:true});const sealed={format:'AES-256-GCM+DPAPI-CurrentUser.v1',runId,projectId:PROJECT,protectedKey,iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),ciphertext:ciphertext.toString('base64')};
const sealedPath=privateDir+'/sealed.json';fs.writeFileSync(sealedPath,JSON.stringify(sealed)+'\n',{flag:'wx'});
const result={at:new Date().toISOString(),runId,result:'PASS_DRY_RUN_ONLY',projectId:PROJECT,mode:'--dry-run',mutationsExecutable:false,privateBundle:{path:sealedPath,sha256:sha(fs.readFileSync(sealedPath)),format:sealed.format,plaintextWritten:false,dpapiRoundtrip:true,archiveBytes:totalBytes},targets:summaries,layers,filesAudited:layers.length,allDiffEntriesClassified:true,volumeDataCaptured:false,liveSnapshotAtomic:false,postStopRecaptureRequired:true,entrypointReplayApprovalRequired:true,baselineOtherServices:cs.filter(x=>!Object.values(names).includes(x.Name.slice(1))).map(x=>({name:x.Name,id:x.Id,configHash:sha(Buffer.from(JSON.stringify(x.Config))),hostHash:sha(Buffer.from(JSON.stringify(x.HostConfig)))})),networkId:network.Id,volumes:volumes.map(x=>x.Name),sqlConnections:0,authHttp:0,containersChanged:0};
fs.writeFileSync(out+'dry-run-'+runId+'.json',JSON.stringify(result,null,2)+'\n');
fs.writeFileSync(out+'dry-run.json',JSON.stringify(result,null,2)+'\n');
const checkpoint={status:'PROPOSED_NOT_APPLIED',runId,projectId:PROJECT,privateBundleSha256:result.privateBundle.sha256,oldManifestSha256:sensitive.manifestHash,transition:summaries.map(x=>({kind:x.kind,oldId:x.oldId,newId:null,payloadSha256:x.payloadSha256})),historicalManifestUnmodified:true,identityContinuity:false,requiresExplicitIdReplacementAuthorization:true,sqlConsistency:'NOT_TESTED',lan:'NOT_TESTED',ipv4:'NOT_TESTED',ipv6:'NOT_TESTED',closedOnFailure:true};
fs.writeFileSync(out+'checkpoint.proposed.json',JSON.stringify(checkpoint,null,2)+'\n');
console.log(JSON.stringify({result:result.result,diffEntries:layers.length,archives:summaries.map(x=>({kind:x.kind,count:x.archives})),archiveBytes:totalBytes,plaintextWritten:false,containersChanged:0}));
} catch(e) {
 // Assertion/spawn errors can embed full Config/Env. NEVER serialize the original error/stack.
 const safe={at:new Date().toISOString(),result:'BLOCKED_DRY_RUN',stage,errorClass:e?.constructor?.name??'Error',rawErrorSuppressed:true,containersChanged:0};
 fs.writeFileSync('docs/estadisticas-v1/p04-t01c-loopback-harness-20261016/failure-'+Date.now()+'.json',JSON.stringify(safe,null,2)+'\n');
 console.log(JSON.stringify(safe));process.exitCode=1;
}
