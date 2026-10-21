// Bounded MVCC experiment: one repeatable-read fixture reader and one uncommitted settings writer.
import fs from 'node:fs';import assert from 'node:assert/strict';import {spawn,spawnSync} from 'node:child_process';import crypto from 'node:crypto';
const dir='docs/estadisticas-v1/p03-f2b',project='orderops-statistics-v1-test-74718de66a41';
const run=(bin,args,input)=>{const r=spawnSync(bin,args,{input,encoding:'utf8',timeout:60000});assert.equal(r.status,0);return r.stdout.trim();};
const live=JSON.parse(run(process.execPath,['scripts/statistics-v1/assert-isolated-target.mjs']));assert.equal(live.projectId,project);
assert.equal(crypto.createHash('sha256').update(fs.readFileSync('supabase/migrations/20261013005000_statistics_v1_read_core_candidate.sql')).digest('hex'),'fd88de8c0ec3f4a87d8a6782650d63cf4779d8170033a4c5b4f37edbd489faf9');
const m=JSON.parse(fs.readFileSync('supabase/statistics-v1-test/.runtime/manifest.json'));const credentials=JSON.parse(fs.readFileSync('supabase/statistics-v1-test/.runtime/credentials.local.json'));assert.equal(credentials.projectId,project);
const business=credentials.businesses.a;assert.match(business,/^[a-f0-9-]{36}$/i);
const args=['exec','-i',`supabase_db_${project}`,'psql','-X','-U','postgres','-d','postgres','-At','-v','ON_ERROR_STOP=1'];
const inventory=()=>JSON.parse(run('docker',args,"BEGIN READ ONLY;SELECT json_build_object('orders',(SELECT count(*) FROM public.orders),'settings', (SELECT md5(string_agg(to_jsonb(s)::text,',' ORDER BY business_id)) FROM public.business_settings s),'connections',(SELECT count(*) FROM pg_stat_activity WHERE application_name LIKE 'statistics_f2b_mvcc_%'),'deadlocks',(SELECT deadlocks FROM pg_stat_database WHERE datname=current_database()));COMMIT;").split(/\r?\n/).find(l=>l.startsWith('{')));
const before=inventory();assert.equal(before.orders,0);assert.equal(before.connections,0);
const children=[];
function session(name){const child=spawn('docker',args,{stdio:['pipe','pipe','pipe'],windowsHide:true});children.push(child);let out='',err='';child.stdout.on('data',s=>out+=s);child.stderr.on('data',s=>err+=s);const done=new Promise((ok,no)=>{child.on('error',no);child.on('close',code=>code===0?ok(out):no(Error(err)));});done.catch(()=>{});child.stdin.write(`SET application_name='statistics_f2b_mvcc_${name}';SET lock_timeout='3s';SET statement_timeout='15s';SET statistics.test_token='${m.token}';`);return {send:s=>child.stdin.write(s+'\n'),end:()=>child.stdin.end(),output:()=>out,done};}
async function until(fn){const end=Date.now()+15000;while(!fn()){if(Date.now()>end)throw Error('MVCC barrier timeout');await new Promise(r=>setTimeout(r,50));}}
const reader=session('reader'),writer=session('writer');let status='PASS',error=null;
try{
 const fixture=fs.readFileSync('scripts/statistics-v1/p03-f1-fixture.sql','utf8').replaceAll('__N__','5').replace('begin;','begin isolation level repeatable read;');
 reader.send(fixture+"SET LOCAL ROLE authenticated;SELECT 'READER_READY';");await until(()=>reader.output().includes('READER_READY'));
 writer.send(`BEGIN;UPDATE public.business_settings SET timezone='Asia/Kathmandu' WHERE business_id='${business}';SELECT 'WRITER_HELD';`);await until(()=>writer.output().includes('WRITER_HELD'));
 reader.send("DO $$ DECLARE a jsonb;b jsonb;BEGIN SELECT public.statistics_v1_summary('today'),private.statistics_v1_summary_candidate('today') INTO a,b;IF a IS DISTINCT FROM b THEN RAISE EXCEPTION 'MVCC_DIFFERENCE';END IF;IF a->>'timezone'='Asia/Kathmandu' THEN RAISE EXCEPTION 'UNCOMMITTED_WRITER_VISIBLE';END IF;END $$;SELECT 'PAIR_PASS';RESET ROLE;ROLLBACK;");reader.end();await reader.done;assert.ok(reader.output().includes('PAIR_PASS'));
 writer.send('ROLLBACK;');writer.end();await writer.done;
}catch(e){status='FAIL';error=String(e);for(const s of [reader,writer]){try{s.send('ROLLBACK;');s.end();}catch{ /* Connection already closed. */ }}await Promise.allSettled([reader.done,writer.done]);}
const after=inventory();assert.deepEqual(after,before);
fs.writeFileSync(`${dir}/concurrency.json`,JSON.stringify({result:status,error,scope:'Two connections: RR reader with own uncommitted captured fixture vs uncommitted timezone writer; same-snapshot JSON equality, no dirty reads. Not an order/finance commit-race stress test.',before,after,live,cleanup:'Both transactions rolled back; owned application_name connections absent; settings fingerprint identical'},null,2));console.log(`${status} bounded MVCC; cleanup and settings fingerprint preserved`);
