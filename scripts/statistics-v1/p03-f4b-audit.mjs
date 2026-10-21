// Read-only infrastructure audit. No fixture, DDL, service control or configuration writes.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const out='docs/estadisticas-v1/p03-f4b/';
const own='scripts/statistics-v1/p03-f4b-audit.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const run=(bin,args,input)=>{const r=spawnSync(bin,args,{input,encoding:'utf8',timeout:60000,maxBuffer:32*1024*1024,windowsHide:true});if(r.error||r.status!==0)throw Error(`${bin} failed: ${r.error?.message??r.stderr?.slice(0,800)}`);return r.stdout.trim();};
const git=(...args)=>run('git',['--no-optional-locks',...args]);
const save=(p,j)=>fs.writeFileSync(out+p,JSON.stringify(j,null,2)+'\n');
const at=()=>new Date().toISOString();
fs.mkdirSync(out,{recursive:true});
const files=run('git',['--no-optional-locks','ls-files','--cached','--others','--exclude-standard','-z']).split('\0').filter(p=>p&&!p.startsWith(out)&&p!==own);
const hashes=Object.fromEntries(files.map(p=>[p,hash(fs.readFileSync(p))]));
const baseline={at:at(),head:git('rev-parse','HEAD'),branch:git('branch','--show-current'),status:git('status','--porcelain=v1','--untracked-files=all'),preexistingFiles:hashes};
save('file-baseline.json',baseline);
let c,preflight={at:at(),result:'NOT_RUN'},infra={at:at(),operations:[]};
const capture=(name,fn)=>{try{const value=fn();infra.operations.push({name,at:at(),status:'PASS',value});return value;}catch(e){infra.operations.push({name,at:at(),status:'UNAVAILABLE',reason:String(e)});return null;}};
try{
 assert.equal(path.basename(process.cwd()),'OrderOps-Estadisticas');
 assert.equal(baseline.head,'923300265323d411c5c91b7935472d5423d228d2');
 assert.equal(baseline.branch,'codex/estadisticas-v1');
 c=await import('./p03-f4a-common.mjs');
 const before=c.verify();
 const names=before.catalog.functions.map(f=>f.name);
 assert.ok(!names.includes('statistics_v1_summary_c_candidate'));
 assert.ok(!names.includes('statistics_v1_read_core_c_candidate'));
 const reference=JSON.parse(fs.readFileSync('docs/estadisticas-v1/p03-f3c/installed-catalog.json')).catalog.functions.find(f=>f.schema==='public'&&f.name==='statistics_v1_summary');
 assert.deepEqual(before.catalog.functions.find(f=>f.schema==='public'&&f.name==='statistics_v1_summary'),reference);
 assert.ok(reference.definition.includes('private.statistics_v1_series_response('));
 preflight={at:at(),result:'PASS',...before,cNotInstalled:true,publicOriginalUnchanged:true};
 save('preflight.json',preflight);
 const db=`supabase_db_${c.project}`;
 capture('docker-version',()=>JSON.parse(run('docker',['version','--format','{{json .}}'])));
 capture('docker-engine',()=>JSON.parse(run('docker',['info','--format','{"serverVersion":"{{.ServerVersion}}","operatingSystem":"{{.OperatingSystem}}","kernel":"{{.KernelVersion}}","cpus":{{.NCPU}},"memoryBytes":{{.MemTotal}},"storageDriver":"{{.Driver}}","cgroupVersion":"{{.CgroupVersion}}","dockerRootDir":"{{.DockerRootDir}}","containers":{{.Containers}},"running":{{.ContainersRunning}}}'])));
 capture('postgres-container-limits-storage',()=>{const [d]=JSON.parse(run('docker',['inspect',db]));return {id:d.Id,image:d.Config.Image,state:{running:d.State.Running,health:d.State.Health?.Status,oomKilled:d.State.OOMKilled,startedAt:d.State.StartedAt,restarts:d.RestartCount},limits:{memory:d.HostConfig.Memory,memorySwap:d.HostConfig.MemorySwap,nanoCpus:d.HostConfig.NanoCpus,cpuQuota:d.HostConfig.CpuQuota,cpuPeriod:d.HostConfig.CpuPeriod,cpusetCpus:d.HostConfig.CpusetCpus,blkioWeight:d.HostConfig.BlkioWeight},mounts:d.Mounts.map(x=>({type:x.Type,name:x.Name,source:x.Source,destination:x.Destination,driver:x.Driver,rw:x.RW}))};});
 capture('owned-volumes',()=>JSON.parse(run('docker',['volume','inspect',...c.m.resources.volumeNames])).map(v=>({name:v.Name,driver:v.Driver,mountpoint:v.Mountpoint,labels:v.Labels,options:v.Options})));
 const ps=command=>run('powershell',['-NoProfile','-Command',command]);
 capture('wsl-version',()=>run('wsl',['--version']).replaceAll('\0',''));
 capture('wsl-distributions-status',()=>run('wsl',['--list','--verbose']).replaceAll('\0',''));
 capture('host-capacity',()=>JSON.parse(ps('$os=Get-CimInstance Win32_OperatingSystem; $cpu=Get-CimInstance Win32_Processor; [pscustomobject]@{LogicalProcessors=($cpu|Measure-Object NumberOfLogicalProcessors -Sum).Sum;TotalVisibleMemoryKiB=$os.TotalVisibleMemorySize;FreePhysicalMemoryKiB=$os.FreePhysicalMemory;TotalVirtualMemoryKiB=$os.TotalVirtualMemorySize;FreeVirtualMemoryKiB=$os.FreeVirtualMemory;LastBootUpTime=$os.LastBootUpTime} | ConvertTo-Json -Compress')));
 capture('docker-desktop-settings-selected',()=>{const p=path.join(process.env.APPDATA,'Docker','settings-store.json');const j=JSON.parse(fs.readFileSync(p));const selected=Object.fromEntries(Object.entries(j).filter(([k])=>/^(wslEngineEnabled|memoryMiB|cpus|swapMiB|diskSizeMiB|dataFolder|diskImageLocation|useVirtualizationFramework|version|resourceSaverEnabled|autoPauseTimeoutSeconds)$/.test(k)));return {path:p,sha256:hash(fs.readFileSync(p)),selected};});
 capture('wslconfig',()=>{const p=path.join(process.env.USERPROFILE,'.wslconfig');if(!fs.existsSync(p))return {present:false};return {present:true,sha256:hash(fs.readFileSync(p)),resourceSettings:fs.readFileSync(p,'utf8').split(/\r?\n/).filter(l=>/^\s*(\[wsl2\]|memory\s*=|processors\s*=|swap\s*=|swapFile\s*=|pageReporting\s*=|autoMemoryReclaim\s*=|\[experimental\])/.test(l))};});
 capture('container-linux-storage',()=>run('docker',['exec',db,'sh','-c','df -T /var/lib/postgresql/data; cat /proc/self/mountinfo | grep /var/lib/postgresql; cat /proc/meminfo; cat /proc/swaps; cat /sys/fs/cgroup/memory.max /sys/fs/cgroup/memory.current /sys/fs/cgroup/memory.events /sys/fs/cgroup/cpu.max /sys/fs/cgroup/cpu.stat /sys/fs/cgroup/io.stat; cat /proc/pressure/cpu /proc/pressure/memory /proc/pressure/io']));
 capture('postgres-settings',()=>JSON.parse(c.read("SELECT json_agg(json_build_object('name',name,'setting',setting,'unit',unit,'source',source,'pendingRestart',pending_restart) ORDER BY name) FROM pg_settings WHERE name IN ('server_version','work_mem','hash_mem_multiplier','maintenance_work_mem','shared_buffers','effective_cache_size','jit','jit_above_cost','jit_inline_above_cost','jit_optimize_above_cost','jit_provider','plan_cache_mode','max_parallel_workers_per_gather','max_parallel_workers','max_worker_processes','random_page_cost','seq_page_cost','track_io_timing','track_functions','shared_preload_libraries','default_statistics_target','statement_timeout','lock_timeout')")));
 capture('postgres-io-waits',()=>JSON.parse(c.read("SELECT json_build_object('database',(SELECT row_to_json(d) FROM pg_stat_database d WHERE datname=current_database()),'io',(SELECT json_agg(to_jsonb(s)) FROM pg_stat_io s),'waits',(SELECT json_agg(json_build_object('state',state,'waitType',wait_event_type,'wait',wait_event,'count',n)) FROM (SELECT state,wait_event_type,wait_event,count(*) n FROM pg_stat_activity WHERE datname=current_database() GROUP BY state,wait_event_type,wait_event) a))")));
 const samples=[];
 for(let i=0;i<3;i++){
  const s={at:at(),index:i};
  s.resources=c.resources();
  s.host=capture(`host-performance-${i}`,()=>JSON.parse(ps('$cpu=Get-CimInstance Win32_PerfFormattedData_PerfOS_Processor -Filter "Name=\'_Total\'"; $mem=Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory; $disk=Get-CimInstance Win32_PerfFormattedData_PerfDisk_PhysicalDisk -Filter "Name=\'_Total\'"; $p=Get-Process | Sort-Object CPU -Descending | Select-Object -First 12 Name,Id,CPU,WorkingSet64; [pscustomobject]@{ProcessorPercent=$cpu.PercentProcessorTime;ProcessorQueue=$null;AvailableMiB=$mem.AvailableMBytes;PagesPerSec=$mem.PagesPersec;DiskBytesPerSec=$disk.DiskBytesPersec;DiskQueueLength=$disk.CurrentDiskQueueLength;TopProcessesCumulativeCPU=$p} | ConvertTo-Json -Depth 4 -Compress')));
  s.pressure=capture(`container-pressure-${i}`,()=>run('docker',['exec',db,'sh','-c','cat /sys/fs/cgroup/cpu.stat /sys/fs/cgroup/memory.events /sys/fs/cgroup/io.stat; cat /proc/pressure/cpu /proc/pressure/memory /proc/pressure/io']));
  samples.push(s);if(i<2)await new Promise(r=>setTimeout(r,2000));
 }
 save('current-resource-samples.json',{scope:'Read-only idle observation; no SQL benchmarks; host process CPU is cumulative, not interval attribution',samples});
 const after=c.verify();assert.deepEqual(after.catalog,before.catalog);assert.deepEqual(after.extra,before.extra);
 save('live-preservation.json',{at:at(),result:'PASS',isolationAfter:after.isolation,catalogUnchanged:true,extraUnchanged:true,ledger:124,cNotInstalled:true,publicOriginalActive:true});
}catch(e){
 preflight={...preflight,result:preflight.result==='PASS'?'AUDIT_ERROR':'BLOCKED',error:String(e).replaceAll(c?.m?.token??'NO_TOKEN','[marker]')};
 save('preflight.json',preflight);
}
save('environment-baseline.json',{at:at(),head:baseline.head,branch:baseline.branch,preflight:preflight.result,infrastructure:infra});
const changed=Object.entries(hashes).filter(([p,h])=>hash(fs.readFileSync(p))!==h).map(([p])=>p);
assert.equal(changed.length,0);
save('preservation.json',{at:at(),preexistingFiles:files.length,hashesUnchanged:true,changed,preflight:preflight.result,livePreservation:fs.existsSync(out+'live-preservation.json')?'live-preservation.json':'NOT_AVAILABLE',commits:0,databaseWrites:0,ddl:0,serviceChanges:0});
console.log(JSON.stringify({result:preflight.result,infraOperations:infra.operations.map(x=>({name:x.name,status:x.status})),preservation:'PASS'}));
