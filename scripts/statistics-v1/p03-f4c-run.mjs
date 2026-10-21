// Bounded synchronized diagnostic. Existing readers only; synthetic rollback; no DDL/global settings.
import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {spawn,spawnSync} from 'node:child_process';import {performance} from 'node:perf_hooks';
import * as c from './p03-f4a-common.mjs';
const dir='docs/estadisticas-v1/p03-f4c/';fs.mkdirSync(dir+'internal-plans',{recursive:true});
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const git=(...a)=>{const r=spawnSync('git',['--no-optional-locks',...a],{encoding:'utf8'});assert.equal(r.status,0);return r.stdout.trim();};
const save=(p,j)=>fs.writeFileSync(dir+p,JSON.stringify(j,null,2)+'\n');
const now=()=>new Date().toISOString();
const own='scripts/statistics-v1/p03-f4c-run.mjs';
const files=git('ls-files','--cached','--others','--exclude-standard','-z').split('\0').filter(p=>p&&!p.startsWith(dir)&&p!==own);
const hashes=Object.fromEntries(files.map(p=>[p,sha(p)]));
assert.equal(git('branch','--show-current'),'codex/estadisticas-v1');assert.equal(git('rev-parse','HEAD'),'923300265323d411c5c91b7935472d5423d228d2');
save('file-baseline.json',{at:now(),files:hashes,gitStatus:git('status','--porcelain=v1','--untracked-files=all')});
// Session defaults are bounded for our own psql connections, never written persistently.
c.args.splice(1,0,'-e','PGOPTIONS=-c statement_timeout=15000 -c lock_timeout=3000');
const readers={original:'public.statistics_v1_summary',AB:'private.statistics_v1_summary_candidate',D1:'private.statistics_v1_summary_d1_candidate'};
const records=[],cohorts=[],profileFiles=[];let halt=null,baseline;
function session(tag){
 const child=spawn('docker',c.args,{stdio:['pipe','pipe','pipe'],windowsHide:true});let stdout='',stderr='',closed=false,seq=0;
 const done=new Promise(resolve=>{child.on('error',e=>resolve({code:-1,error:String(e)}));child.on('close',code=>{closed=true;resolve({code});});});
 child.stdout.on('data',x=>stdout+=x);child.stderr.on('data',x=>stderr+=x);
 async function query(q){const a=stdout.length,b=stderr.length,key=`F4C_END_${tag}_${++seq}`;child.stdin.write(q+`\nSELECT '${key}';\n`);const deadline=performance.now()+20000;while(!stdout.slice(a).split(/\r?\n/).includes(key)){if(closed)throw Error('Owned SQL session closed: '+stderr.slice(b).replaceAll(c.m.token,'[marker]'));if(performance.now()>deadline)throw Error('Transport deadline, SQL15s unchanged');await new Promise(r=>setTimeout(r,5));}return {out:stdout.slice(a,stdout.indexOf(key,a)),err:stderr.slice(b)};}
 return {query,close:async()=>{if(!closed){try{await query('RESET ROLE;ROLLBACK;');}catch{}child.stdin.end();}return done;},log:()=>stdout+'\n'+stderr};
}
const json=r=>{const lines=r.out.split(/\r?\n/),a=lines.findIndex(x=>x.startsWith('{')||x.startsWith('['));assert.ok(a>=0,'Missing JSON');const b=lines.findIndex((x,i)=>i>a&&x.startsWith('Time:'));return JSON.parse(lines.slice(a,b<0?undefined:b).join('\n'));};
const sqlTiming=r=>{const lines=r.out.split(/\r?\n/),a=lines.findIndex(x=>x.startsWith('{')||x.startsWith('[')),l=lines.find((x,i)=>i>a&&/^Time:/.test(x));return l?+l.match(/^Time: ([0-9.]+)/)[1]:'NOT_AVAILABLE';};
const asyncDocker=args=>new Promise((ok,no)=>{const p=spawn('docker',args,{stdio:['ignore','pipe','pipe'],windowsHide:true});let o='',e='';p.stdout.on('data',x=>o+=x);p.stderr.on('data',x=>e+=x);p.on('error',no);p.on('close',code=>code===0?ok(o):no(Error('Read-only observer failed: '+e.slice(0,400))));});
const paths=['/sys/fs/cgroup/cpu.stat','/sys/fs/cgroup/memory.current','/sys/fs/cgroup/memory.events','/sys/fs/cgroup/io.stat','/proc/pressure/cpu','/proc/pressure/memory','/proc/pressure/io'];
async function snap(phase){const start=now(),t=performance.now();try{const raw=await asyncDocker(['exec',`supabase_db_${c.project}`,'sh','-c',`for f in ${paths.join(' ')}; do printf '\\n%s\\n' "$f"; cat "$f"; done`]);const blocks={};for(let i=0;i<paths.length;i++){const a=raw.indexOf(paths[i]+'\n')+paths[i].length+1,b=i+1<paths.length?raw.indexOf(paths[i+1]+'\n'):raw.length;blocks[paths[i]]=raw.slice(a,b).trim();}const cpu=Object.fromEntries([...blocks[paths[0]].matchAll(/^(\w+) (\d+)$/gm)].map(m=>[m[1],+m[2]]));const psi=p=>Object.fromEntries([...blocks[p].matchAll(/^(some|full) avg10=([0-9.]+) avg60=([0-9.]+) avg300=([0-9.]+) total=(\d+)$/gm)].map(m=>[m[1],{avg10:+m[2],avg60:+m[3],avg300:+m[4],totalUs:+m[5]}]));const io=Object.fromEntries(blocks[paths[3]].split('\n').map(l=>{const [device,...kv]=l.split(' ');return [device,Object.fromEntries(kv.map(x=>{const [k,v]=x.split('=');return [k,+v];}))];}));return {phase,startUTC:start,endUTC:now(),monotonicMs:performance.now(),observerMs:performance.now()-t,cpu,memoryBytes:+blocks[paths[1]],memoryEvents:Object.fromEntries([...blocks[paths[2]].matchAll(/^(\w+) (\d+)$/gm)].map(m=>[m[1],+m[2]])),io,psi:{cpu:psi(paths[4]),memory:psi(paths[5]),io:psi(paths[6])}};}catch(e){return {phase,startUTC:start,endUTC:now(),status:'NOT_AVAILABLE',error:String(e)};}}
const tableCounters="SELECT coalesce(json_object_agg(relname,json_build_object('seqScan',seq_scan,'seqRows',seq_tup_read,'indexScan',idx_scan,'indexRows',idx_tup_fetch)),'{}') FROM pg_stat_xact_user_tables WHERE schemaname='public'";
const functionCounters="SELECT coalesce(json_object_agg(schemaname||'.'||funcname,json_build_object('calls',calls,'totalMs',total_time,'selfMs',self_time)),'{}') FROM pg_stat_xact_user_functions";
const delta=(a,b)=>Object.fromEntries(Object.keys(b).map(k=>[k,Object.fromEntries(Object.entries(b[k]).map(([x,v])=>[x,v-(a[k]?.[x]??0)]))]));
function resourceDelta(a,b){if(!a.cpu||!b.cpu)return 'NOT_AVAILABLE';const seconds=(b.monotonicMs-a.monotonicMs)/1000,rawCPU=(b.cpu.usage_usec-a.cpu.usage_usec)/(seconds*1e6)*100;return {intervalSeconds:seconds,cpuRawPercent:rawCPU,cpuNormalizedPercent:rawCPU/baseline.resources.dockerCapacity.cpus,cgroupIo:delta(a.io,b.io),psiCPUTimeUs:b.psi.cpu.some.totalUs-a.psi.cpu.some.totalUs,psiMemoryTimeUs:b.psi.memory.some.totalUs-a.psi.memory.some.totalUs,psiIOTimeUs:b.psi.io.some.totalUs-a.psi.io.some.totalUs,scope:'Cgroup/VM observer interval brackets SELECT, not exact query-only CPU or IO'};}
function pressure(a,b){if(!a.cpu||!b.cpu)return 'OBSERVER_NOT_AVAILABLE';const d=resourceDelta(a,b),capacity=baseline.resources.dockerCapacity.memoryBytes;if(d.cpuNormalizedPercent>35)return 'ACTIVE_CPU_NORMALIZED_OVER_35';if(Math.max(a.memoryBytes,b.memoryBytes)/capacity*100>40)return 'MEMORY_OVER_40';if(b.memoryEvents.oom>a.memoryEvents.oom||b.memoryEvents.oom_kill>a.memoryEvents.oom_kill)return 'OOM_DELTA';return null;}
async function verify(){const v=c.verify();assert.ok(!v.catalog.functions.some(f=>/statistics_v1_(summary|read_core)_c_candidate/.test(f.name)));const ref=JSON.parse(fs.readFileSync('docs/estadisticas-v1/p03-f3c/installed-catalog.json')).catalog.functions.find(f=>f.schema==='public'&&f.name==='statistics_v1_summary');assert.deepEqual(v.catalog.functions.find(f=>f.schema==='public'&&f.name===ref.name),ref);assert.equal(sha('docs/estadisticas-v1/p03-f5a/candidate-c.sql'),'7d05e3987695f8bfc0e2477d74a38566269c7b6992682e58dbc4c34032f49bb6');return v;}
async function cohort(n){
 const entry=await verify();if(parseFloat(entry.resources.dbStats.CPUPerc)>35||parseFloat(entry.resources.dbStats.MemPerc)>40){halt='ENTRY_RESOURCE_GATE';return;}
 const s=session('data'+n),observer=session('observer'+n);let pid,reference,cursor;
 const cohortRecord={orders:n,startUTC:now(),warmups:[],normalSamplesPerReader:3,maxAuthorized:10,profilesPerReader:2,status:'RUNNING'};cohorts.push(cohortRecord);
 try{
  await observer.query("BEGIN READ ONLY;SET LOCAL statement_timeout='15s';SET LOCAL lock_timeout='3s';");
  const fixture=fs.readFileSync('scripts/statistics-v1/p03-f1-fixture.sql','utf8').replaceAll('__N__',String(n)).replace('begin;','begin isolation level repeatable read;').replace("statement_timeout='30s'","statement_timeout='15s'");
  await s.query(`SET application_name='statistics_f4c_${n}';SET statistics.test_token='${c.m.token}';${fixture}SET LOCAL ROLE authenticated;\n\\timing on\n`);
  pid=Number((await s.query('SELECT pg_backend_pid();')).out.split(/\r?\n/).find(l=>/^\d+$/.test(l)));
  async function runOne(reader,mode,index,call){
   const id=`f4c-${n}-${mode}-${reader}-${index}`,samples=[],waits=[];let done=false;
   const preTables=json(await s.query(`RESET ROLE;${tableCounters};SET LOCAL ROLE authenticated;`));
   const preFunctions=mode==='profile'?json(await s.query(`RESET ROLE;${functionCounters};SET LOCAL ROLE authenticated;`)):'NOT_AVAILABLE';
   const pre=await snap('before');samples.push(pre);if(!pre.cpu)throw Error('RESOURCE_OBSERVER_UNAVAILABLE');
   const startUTC=now(),t=performance.now();
   const pending=s.query(mode==='profile'?`EXPLAIN(ANALYZE,BUFFERS,SETTINGS,FORMAT JSON) SELECT ${call};`:`SELECT ${call};`).finally(()=>done=true);
   const observe=async()=>{while(!done){const obsStart=now();const [resource,activity]=await Promise.all([snap('during'),observer.query(`SELECT json_build_object('state',state,'waitType',wait_event_type,'wait',wait_event,'queryStartedUTC',query_start,'observedUTC',clock_timestamp()) FROM pg_stat_activity WHERE pid=${pid};`)]);samples.push(resource);try{waits.push({observerStartUTC:obsStart,observerEndUTC:now(),activity:json(activity)});}catch{waits.push({status:'NOT_AVAILABLE'});}if(!done)await new Promise(r=>setTimeout(r,500));}};
   const watching=observe();let result,error=null;try{result=await pending;}catch(e){error=String(e).replaceAll(c.m.token,'[marker]');}
   const wallMs=performance.now()-t,endUTC=now();await watching;const post=await snap('after');samples.push(post);
   const record={id,orders:n,reader,mode,index,startUTC,endUTC,selectWallMs:wallMs,psqlTimingMs:result?sqlTiming(result):'NOT_AVAILABLE',asOf:cursor?.asOf??'INITIAL_WARMUP',resources:samples,waits,resourceDelta:resourceDelta(pre,post),buffers:mode==='normal'?'NOT_AVAILABLE_NORMAL_SELECT':null,functionStats:preFunctions==='NOT_AVAILABLE'?'NOT_AVAILABLE_NORMAL_SELECT':null,error};records.push(record);
   if(error){halt='QUERY_ERROR_OR_TIMEOUT';throw Error(error);}
   const data=json(result);record.tableCounterDeltas=delta(preTables,json(await s.query(`RESET ROLE;${tableCounters};SET LOCAL ROLE authenticated;`)));
   if(mode==='profile'){
    const afterFunctions=json(await s.query(`RESET ROLE;${functionCounters};SET LOCAL ROLE authenticated;`));record.functionStats=delta(preFunctions,afterFunctions);
    const nested=[];for(const match of result.err.matchAll(/duration: ([0-9.]+) ms\s+plan:\s*(\{[\s\S]*?\n\})/g)){try{nested.push({durationMs:+match[1],plan:JSON.parse(match[2])});}catch{}}
    const file=`internal-plans/${id}.json`;save(file,{id,orders:n,reader,index,startUTC,endUTC,outer:data,nested,functionStats:record.functionStats,tableCounterDeltas:record.tableCounterDeltas,thresholdMs:10,perNodeTiming:false,instrumented:true});profileFiles.push(file);record.planFile=file;record.buffers=data[0]?.Plan;record.nestedPlansCaptured=nested.length;
   }else if(reference){assert.deepEqual(data,reference,'FULL_JSON_EQUIVALENCE');record.completeJSONEquality=true;}
   const ordered=samples.filter(s=>s.cpu).sort((a,b)=>a.monotonicMs-b.monotonicMs);record.intervalDeltas=ordered.slice(1).map((s,i)=>resourceDelta(ordered[i],s));
   record.resourceGate=pressure(pre,post)??ordered.slice(1).map((s,i)=>pressure(ordered[i],s)).find(Boolean)??null;if(record.resourceGate)halt=record.resourceGate;if(wallMs>=5000||record.psqlTimingMs>=5000)halt='QUERY_LATENCY_AT_LEAST_5000MS';
   save('synchronized-measurements.json',{purpose:'Diagnostic only; no p95',normalPlannedPerReader:3,maxAllowedPerReader:10,cohorts,records,halt,profileFiles});return data;
  }
  // Original bootstrap is its one separate warmup; captures cursor asOf for all remaining calls.
  const first=await runOne('original','warmup',0,`${readers.original}('today')`);if(halt)return;
  assert.ok(first.products.nextCursor);cursor={...first.products.nextCursor,offset:0};reference=first;
  const lit=JSON.stringify(cursor).replaceAll("'","''"),call=fn=>`${fn}('today',null,null,'units',5,'${lit}'::jsonb)`;
  for(const reader of ['AB','D1']){await runOne(reader,'warmup',0,call(readers[reader]));if(halt)return;}
  for(let i=0;i<3;i++){const names=Object.keys(readers),offset=(i+(n===100?1:0))%3,order=[...names.slice(offset),...names.slice(0,offset)];for(const reader of order){await runOne(reader,'normal',i+1,call(readers[reader]));if(halt)return;}}
  // Profiling only after normal samples. All settings transaction-local, no persistent changes.
  const available=entry.diagnosticCatalog.settings.shared_preload_libraries.split(',').map(s=>s.trim()).includes('auto_explain');
  if(!available){cohortRecord.profiles='NOT_AVAILABLE_AUTO_EXPLAIN';return;}
  await s.query("RESET ROLE;SET LOCAL track_functions='all';SET LOCAL auto_explain.log_min_duration='10ms';SET LOCAL auto_explain.log_nested_statements=on;SET LOCAL auto_explain.log_analyze=on;SET LOCAL auto_explain.log_buffers=on;SET LOCAL auto_explain.log_timing=off;SET LOCAL auto_explain.log_level='notice';SET LOCAL auto_explain.log_format='json';SET LOCAL ROLE authenticated;");
  for(let i=0;i<2;i++){const names=i===0?['D1','AB','original']:['original','AB','D1'];for(const reader of names){await runOne(reader,'profile',i+1,call(readers[reader]));if(halt)return;}}
  cohortRecord.status='COMPLETE_DIAGNOSTIC';
 }catch(e){halt=halt??(/EQUIVALENCE|equal/i.test(String(e))?'FAIL_EQUIVALENCE':'DIAGNOSTIC_ERROR');cohortRecord.error=String(e).replaceAll(c.m.token,'[marker]');}
 finally{
  const closed=await s.close();await observer.close();const logFile=`${c.runtime}/p03-f4c-${n}.local.log`;assert.ok(!fs.existsSync(logFile),'Do not overwrite existing runtime log');fs.writeFileSync(logFile,s.log());cohortRecord.log={path:logFile,sha256:sha(logFile),privateOnly:true};cohortRecord.rollbackConnectionExit=closed.code;cohortRecord.endUTC=now();if(cohortRecord.status==='RUNNING')cohortRecord.status=halt?'STOPPED_GATE':'PROFILE_NOT_AVAILABLE';
  const after=await verify();assert.deepEqual(after.catalog,entry.catalog);assert.deepEqual(after.extra,entry.extra);cohortRecord.preservation='PASS';save('synchronized-measurements.json',{purpose:'Diagnostic only, no p95',normalPlannedPerReader:3,maxAllowedPerReader:10,cohorts,records,halt,profileFiles});
 }
 console.log(`N${n}: ${cohortRecord.status}, ${records.filter(r=>r.orders===n&&r.mode==='normal').length} normal queries, rollback/catalog PASS.`);
}
try{baseline=await verify();save('preflight.json',{at:now(),result:'PASS',...baseline,cNotInstalled:true,head:git('rev-parse','HEAD'),branch:git('branch','--show-current')});for(const n of [50,100]){await cohort(n);if(halt)break;}}
catch(e){halt=halt??'PREFLIGHT_OR_PRESERVATION_BLOCKED';save('failure.json',{at:now(),halt,error:String(e).replaceAll(c.m.token,'[marker]')});}
let final=null;if(baseline){try{final=await verify();assert.deepEqual(final.catalog,baseline.catalog);assert.deepEqual(final.extra,baseline.extra);}catch(e){halt='FAIL_PRESERVATION';save('preservation-error.json',{error:String(e)});}}
for(const [p,h]of Object.entries(hashes))assert.equal(sha(p),h,p);
const previous=JSON.parse(fs.readFileSync('docs/estadisticas-v1/p03-f4a/evidence.json'));for(const [p,v]of Object.entries(previous.ignoredRuntimeInventory))assert.equal(sha(p),v.sha256,p);
save('preservation.json',{at:now(),preexistingFileCount:files.length,fileHashesUnchanged:true,ignoredOldLogs:8,ignoredOldLogHashesUnchanged:true,catalogUnchanged:!!final,ledger:final?.catalog.ledger.length??'NOT_AVAILABLE',identityAfter:final?.isolation??'NOT_AVAILABLE',dataCountsAfter:final?.catalog.counts??'NOT_AVAILABLE',extraUnchanged:!!final,cNotInstalled:!!final,candidateCHash:sha('docs/estadisticas-v1/p03-f5a/candidate-c.sql'),commits:0,ddl:0,persistentSettingsChanged:false,fixturesReversible:true,halt});
save('synchronized-measurements.json',{purpose:'Diagnostic, no p95',normalPlannedPerReader:3,maxAllowedPerReader:10,cohorts,records,halt,profileFiles,omittedCohorts:[50,100].filter(n=>!cohorts.some(c=>c.orders===n))});
console.log(JSON.stringify({halt,records:records.length,normalRecords:records.filter(r=>r.mode==='normal').length,profileFiles:profileFiles.length,preservation:!!final}));
