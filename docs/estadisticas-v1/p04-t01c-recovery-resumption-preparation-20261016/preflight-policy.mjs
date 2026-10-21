// Pure validation. No I/O, defaults for missing measurements, or metadata repair.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const IMAGE='sha256:4255b662ba3d774105cb34f623e410a3d7a860b68408ac6810f7e7e4b9781d5a';
export const NAME='orderops-statistics-recovery-20261016-a';
export const LABEL='orderops.statistics.recovery=20261016-a';
export const MANIFEST='790960c137c57c70d725cde4a7113165b15c6369662b2e2a52387623093dfd3f';
const own=(o,k)=>{assert.ok(o&&Object.hasOwn(o,k),'MISSING_REQUIRED_FIELD:'+k);return o[k];};
const obj=o=>assert.ok(o!==null&&typeof o==='object'&&!Array.isArray(o),'OBJECT_REQUIRED');
const strings=a=>assert.ok(Array.isArray(a)&&a.every(v=>typeof v==='string'),'STRING_ARRAY_REQUIRED');
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
export function capacityGate(m){
 obj(m);const processors=own(m,'processors');assert.ok(Array.isArray(processors)&&processors.length>0,'CPU_NOT_AVAILABLE');
 const loads=processors.map(p=>{const v=own(p,'loadPercentage');assert.ok(typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=100,'INVALID_CPU');return v;});
 const available=own(m,'freePhysicalMemoryKiB'),total=own(m,'totalVisibleMemoryKiB');
 assert.ok(Number.isSafeInteger(available)&&Number.isSafeInteger(total)&&total>0&&available>=0&&available<=total,'INVALID_MEMORY');
 const start=Date.parse(own(m,'startUtc')),end=Date.parse(own(m,'endUtc'));
 assert.ok(Number.isFinite(start)&&Number.isFinite(end)&&end>=start&&end-start<=30000,'INVALID_CAPTURE_WINDOW');
 const cpu=loads.reduce((s,n)=>s+n,0)/loads.length;
 assert.ok(cpu<=35,'CPU_OVER_35_PERCENT');
 assert.ok(available>=4*1024*1024,'MEMORY_BELOW_4_GIB');
 return {result:'PASS_POINT_IN_TIME_CAPACITY',cpuPercent:cpu,availableMemoryGiB:available/1024/1024,startUtc:m.startUtc,endUtc:m.endUtc,repetitions:1};
}
export function imageGate(payload){
 assert.ok(Array.isArray(payload)&&payload.length===1,'ONE_IMAGE_REQUIRED');const i=payload[0];obj(i);
 assert.equal(own(i,'Id'),IMAGE,'IMAGE_CONFIG_DIGEST_MISMATCH');
 assert.equal(own(i,'Os'),'linux');assert.equal(own(i,'Architecture'),'amd64');
 assert.ok(Number.isSafeInteger(own(i,'Size'))&&i.Size>0,'INVALID_IMAGE_SIZE');
 const digests=own(i,'RepoDigests');strings(digests);
 assert.ok(digests.every(d=>/^[^\s]+@sha256:[a-f0-9]{64}$/.test(d)),'INVALID_REPOSITORY_DIGEST');
 const root=own(i,'RootFS');obj(root);assert.equal(own(root,'Type'),'layers');
 const layers=own(root,'Layers');strings(layers);assert.ok(layers.length>0&&layers.every(d=>/^sha256:[a-f0-9]{64}$/.test(d)),'INVALID_LAYERS');
 const cfg=own(i,'Config');obj(cfg);
 // An omitted key is deliberately NOT accepted as equivalent to null or {}.
 const volumes=own(cfg,'Volumes');
 if(volumes!==null){obj(volumes);assert.ok(Object.keys(volumes).every(k=>k==='/var/lib/postgresql/data'),'UNEXPECTED_IMAGE_VOLUME');for(const v of Object.values(volumes)){obj(v);assert.equal(Object.keys(v).length,0,'INVALID_VOLUME_METADATA');}}
 const user=own(cfg,'User'),workingDir=own(cfg,'WorkingDir');assert.equal(typeof user,'string');assert.equal(typeof workingDir,'string');
 const env=own(cfg,'Env');strings(env);
 for(const key of ['Entrypoint','Cmd']){const value=own(cfg,key);if(value!==null)strings(value);}
 return {result:'PASS_IMAGE_CONFIG_DIGEST_AND_METADATA',imageId:i.Id,os:i.Os,architecture:i.Architecture,imageSizeBytes:i.Size,
  repositoryDigests:digests,repositoryProvenance:digests.length?'RECORDED_NOT_HISTORICALLY_PINNED':'NOT_AVAILABLE_EMPTY_LIST',
  declaredVolumes:volumes,rootFsLayers:layers.length,rootFsLayersHash:hash(layers),
  configSha256:hash(cfg),environmentEntries:env.length,environmentValuesExported:false,
  originalUser:user,originalWorkingDir:workingDir,entrypointHash:hash(cfg.Entrypoint),cmdHash:hash(cfg.Cmd),
  overrides:'Approved lab overrides user/entrypoint/healthcheck/network/mounts; no source entrypoint execution',
  toolAvailability:'NOT_TESTED_WITHOUT_EXECUTION',absenceOfVolumesInferred:false};
}
export function collisionGate(nameOutput,labelOutput){
 for(const [kind,raw] of [['NAME',nameOutput],['LABEL',labelOutput]]){assert.equal(typeof raw,'string');assert.equal(raw.trim(),'','COLLISION_OR_UNEXPECTED_OUTPUT_'+kind);}
 return {result:'PASS_CONTAINER_NAME_AND_LABEL_ABSENT',name:NAME,label:LABEL,newNetworksAndVolumes:'NONE_PLANNED',raceFreeReservation:false};
}
