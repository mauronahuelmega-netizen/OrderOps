import {spawn} from 'node:child_process';import assert from 'node:assert/strict';import {args,project} from './p03-f4a-common.mjs';
export function session(tag){
 const child=spawn('docker',args,{stdio:['pipe','pipe','pipe'],windowsHide:true});let out='',err='',seq=0,closed=false;
 const done=new Promise(resolve=>{child.on('error',e=>resolve({code:-1,error:String(e),out,err}));child.on('close',code=>{closed=true;resolve({code,out,err});});});
 child.stdout.on('data',s=>out+=s);child.stderr.on('data',s=>err+=s);
 async function query(q){const start=out.length,key=`F4A_END_${tag}_${++seq}`;child.stdin.write(q+`\nSELECT '${key}';\n`);const deadline=Date.now()+20000;
  while(!out.slice(start).split(/\r?\n/).includes(key)){if(closed)throw Object.assign(Error('Owned SQL connection closed'),{err});if(Date.now()>deadline)throw Error('Transport marker deadline; SQL limit15s unchanged');await new Promise(r=>setTimeout(r,10));}return out.slice(start,out.indexOf(key,start));
 }
 async function close(){if(!closed){try{await query('RESET ROLE;ROLLBACK;');}catch{}child.stdin.end();}return await done;}
 return {query,close,done,log:()=>out+'\n'+err};
}
export const extract=out=>{const lines=out.split(/\r?\n/),i=lines.findIndex(s=>s.startsWith('{')||s.startsWith('['));assert.ok(i>=0,'JSON result absent');const end=lines.findIndex((s,j)=>j>i&&/^Time:/.test(s));assert.ok(end>i,'Query timing absent');const data=JSON.parse(lines.slice(i,end).join('\n'));return {data,ms:Number(lines[end].match(/^Time: ([0-9.]+)/)[1])};};
export const asyncRun=(bin,args,input)=>new Promise((ok,no)=>{const c=spawn(bin,args,{stdio:['pipe','pipe','pipe'],windowsHide:true});let out='',err='';c.stdout.on('data',s=>out+=s);c.stderr.on('data',s=>err+=s);c.on('error',no);c.on('close',code=>code===0?ok(out.trim()):no(Error(`${bin} read command failed: ${err}`)));c.stdin.end(input??'');});
export async function observe(pid){assert.match(String(pid),/^[0-9]+$/);const db=`supabase_db_${project}`;
 const [stats,status,activity]=await Promise.all([
  asyncRun('docker',['stats','--no-stream','--format','{{json .}}',db]),
  asyncRun('docker',['exec',db,'cat',`/proc/${pid}/status`]),
  asyncRun('docker',args,"BEGIN READ ONLY;SELECT coalesce(json_agg(json_build_object('pid',pid,'app',application_name,'state',state,'waitType',wait_event_type,'wait',wait_event,'seconds',extract(epoch from clock_timestamp()-query_start))),'[]'::json) FROM pg_stat_activity WHERE application_name LIKE 'statistics_f4a_%';COMMIT;")
 ]);return {at:new Date().toISOString(),container:JSON.parse(stats),backendMemoryKiB:Object.fromEntries([...status.matchAll(/^(VmRSS|VmHWM|VmPeak):\s+(\d+) kB/gm)].map(m=>[m[1],+m[2]])),ownedActivity:JSON.parse(activity.split(/\r?\n/).find(s=>s.startsWith('[')))};
}
