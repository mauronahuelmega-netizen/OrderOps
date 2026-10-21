// Pure Docker Engine request/response codec. No transport, endpoint selection or I/O.
import assert from 'node:assert/strict';import path from 'node:path';
import {PROJECT,NETWORK,names,makePayload,validatePayload} from '../p04-t01c-loopback-harness-20261016/policy.mjs';
import {allowedPath,verifyArchive,sha} from './filesystem.mjs';
import {APPROVED} from './approved-constants.mjs';
const ids={db:'592f44984962a26c6552ccb02937d56385a8db008eb8e7a27e8be2d932f77bd1',kong:'313f159d75515e52b874369ace5b6f540a9bac833d2f5d644a8639e1a5b34e63'};
const networkId='dfbf3cf0bf455393fd0c01a0f61438fd19fd18dfe5f4107c2bafc32589c476af';
const api='/v1.52';
const issued=new WeakMap();
function fingerprint(r){return sha(Buffer.from(JSON.stringify({method:r.method,path:r.path,expectedStatus:r.expectedStatus,projectId:r.projectId,claimedBodyHash:r.bodyHash,bodyHash:r.body===null?null:sha(Buffer.isBuffer(r.body)?r.body:Buffer.from(JSON.stringify(r.body)))})));}
function issue(r,authority){issued.set(r,{fingerprint:fingerprint(r),authority});return Object.freeze(r);}
export function assertIssuedRequest(r,{allowSimulation=true}={}){assert.deepEqual(Object.keys(r).sort(),['body','bodyHash','expectedStatus','method','path','projectId']);assert.ok(issued.has(r),'Unissued request');assert.equal(fingerprint(r),issued.get(r).fingerprint,'Request changed after validation');assert.equal(r.projectId,PROJECT);if(!allowSimulation)assert.equal(issued.get(r).authority,'APPROVED_CANDIDATE');return true;}
export class RequestCodec {
 #source;#run;#new=new Map();#pending=new Map();#existing;#paths;#directories;#authority;
 constructor({sources,runId,files,directories,existingIds,authority='SIMULATION'}){assert.ok(['SIMULATION','APPROVED_CANDIDATE'].includes(authority));this.#authority=authority;assert.match(runId,/^[A-Za-z0-9_-]{1,100}$/);assert.ok(Array.isArray(existingIds)&&existingIds.length>=5);assert.equal(new Set(existingIds).size,existingIds.length);this.#existing=new Set(existingIds);assert.deepEqual(Object.keys(sources).sort(),['db','kong']);for(const k of ['db','kong']){assert.equal(sources[k].Id,ids[k]);assert.ok(this.#existing.has(ids[k]));assert.equal(sources[k].Image,APPROVED.targets[k].image);validatePayload(sources[k],k,makePayload(sources[k],k));if(authority==='APPROVED_CANDIDATE'){const hash=x=>sha(Buffer.from(JSON.stringify(x)));assert.equal(hash(sources[k].Config),APPROVED.targets[k].configHash);assert.equal(hash(sources[k].HostConfig),APPROVED.targets[k].hostHash);assert.equal(hash(makePayload(sources[k],k)),APPROVED.targets[k].payloadSha256);assert.deepEqual(files[k].map(({path,uid,gid,mode,contentHash,archiveHash})=>({path,uid,gid,mode,contentHash,archiveHash})),APPROVED.files[k]);assert.deepEqual(directories[k].map(({path,uid,gid,mode})=>({path,uid,gid,mode})),APPROVED.directories[k]);}}this.#source=structuredClone(sources);this.#run=runId;this.#paths=structuredClone(files);this.#directories=structuredClone(directories);for(const group of [this.#paths,this.#directories])for(const k of ['db','kong']){assert.ok(Array.isArray(group[k]));for(const e of group[k])allowedPath(e.path);}}
 candidateInspect(kind,response){assert.ok(Object.hasOwn(ids,kind));assert.match(response.Id,/^[a-f0-9]{64}$/);assert.ok(!this.#existing.has(response.Id));assert.ok(!this.#pending.has(kind)&&!this.#new.has(kind));assert.ok(![...this.#pending.values(),...this.#new.values()].includes(response.Id));this.#pending.set(kind,response.Id);return issue({method:'GET',path:api+'/containers/'+response.Id+'/json',body:null,bodyHash:null,expectedStatus:200,projectId:PROJECT},this.#authority);}
 registerNew(kind,response,inspect){assert.ok(Object.hasOwn(ids,kind));assert.equal(this.#pending.get(kind),response.Id);assert.equal(this.#new.has(kind),false);assert.match(response.Id,/^[a-f0-9]{64}$/);assert.ok(!Object.values(ids).includes(response.Id));assert.ok(![...this.#new.values()].includes(response.Id));assert.equal(inspect.Id,response.Id);assert.equal(inspect.Name,'/'+names[kind]);assert.equal(inspect.Image,this.#source[kind].Image);const p=makePayload(this.#source[kind],kind),cfg=structuredClone(p);delete cfg.HostConfig;delete cfg.NetworkingConfig;assert.deepEqual(inspect.Config,cfg);assert.deepEqual(inspect.HostConfig,p.HostConfig);assert.deepEqual(inspect.Mounts,this.#source[kind].Mounts);assert.deepEqual(Object.keys(inspect.NetworkSettings.Networks),[NETWORK]);assert.deepEqual(inspect.NetworkSettings.Networks[NETWORK].Aliases,p.NetworkingConfig.EndpointsConfig[NETWORK].Aliases);assert.equal(inspect.State.Running,false);this.#new.set(kind,response.Id);this.#pending.delete(kind);}
 request(op,kind,extra={}){
  assert.ok(Object.hasOwn(ids,kind));assert.deepEqual(Object.keys(extra).filter(k=>!['path','tar','retained','replacement'].includes(k)),[],'Arbitrary URL/ID/header/body not accepted');
  let method='GET',url='',body=null,expected=200;const old=ids[kind],fresh=this.#new.get(kind);
  const newId=()=>{assert.ok(fresh,'Unverified new ID');return fresh;};
  switch(op){
   case 'inspect_old':url=`/containers/${old}/json`;break;
   case 'stop_old':method='POST';url=`/containers/${old}/stop?t=-1`;expected=204;break;
   case 'changes_stopped':url=`/containers/${old}/changes`;break;
   case 'export_stopped':url=`/containers/${old}/export`;break;
   case 'read_archive':case 'head_directory':{allowedPath(extra.path);const entries=op==='read_archive'?this.#paths[kind]:this.#directories[kind];assert.ok(entries.some(x=>x.path===extra.path));method=op==='read_archive'?'GET':'HEAD';url=`/containers/${old}/archive?path=${encodeURIComponent(extra.path)}`;break;}
   case 'rename_old':method='POST';url=`/containers/${old}/rename?name=${encodeURIComponent(names[kind]+'.pre-loopback-'+this.#run)}`;expected=204;break;
   case 'detach_old':method='POST';url=`/networks/${networkId}/disconnect`;body={Container:old,Force:false};break;
   case 'create':method='POST';url='/containers/create?name='+encodeURIComponent(names[kind]);body=makePayload(this.#source[kind],kind);expected=201;break;
   case 'inspect_new':url=`/containers/${newId()}/json`;break;
   case 'verify_restored':allowedPath(extra.path);assert.ok(this.#paths[kind].some(x=>x.path===extra.path));url=`/containers/${newId()}/archive?path=${encodeURIComponent(extra.path)}`;break;
   case 'restore_file':case 'restore_directory':{
    const directory=op==='restore_directory';allowedPath(extra.path);const e=(directory?this.#directories:this.#paths)[kind].find(x=>x.path===extra.path);assert.ok(e);verifyArchive(e.path,extra.tar,e,{directory});if(!directory&&this.#authority==='APPROVED_CANDIDATE')assert.equal(sha(extra.tar),e.archiveHash);method='PUT';url=`/containers/${newId()}/archive?path=${encodeURIComponent(directory?'/':path.posix.dirname(e.path))}&noOverwriteDirNonDir=true&copyUIDGID=true`;body=extra.tar;break;
   }
   case 'start_new':method='POST';url=`/containers/${newId()}/start`;expected=204;break;
   case 'rollback_stop_new':method='POST';url=`/containers/${newId()}/stop?t=-1`;expected=204;break;
   // No wildcard-original start, rm, force, prune, migration, reset, network creation or reconnect in safe rollback.
   default:throw new Error('OPERATION_FORBIDDEN');
  }
  assert.ok(url.startsWith('/'));return issue({method,path:api+url,body,expectedStatus:expected,projectId:PROJECT,bodyHash:body===null?null:sha(Buffer.isBuffer(body)?body:Buffer.from(JSON.stringify(body)))},this.#authority);
 }
}
export function decodeResponse(request,{status,body=Buffer.alloc(0),complete=true,timedOut=false}){
 assert.equal(timedOut,false,'Ambiguous timeout: HALT, no retry');assert.equal(complete,true,'Truncated response: HALT');assert.equal(status,request.expectedStatus,'Unexpected status: HALT');
 if(status===201){const r=JSON.parse(Buffer.from(body).toString());assert.deepEqual(Object.keys(r).sort(),['Id','Warnings']);assert.match(r.Id,/^[a-f0-9]{64}$/);assert.ok(r.Warnings===null||(Array.isArray(r.Warnings)&&r.Warnings.length===0));return r;}
 if(status===204)assert.equal(body.length,0);return body;
}
