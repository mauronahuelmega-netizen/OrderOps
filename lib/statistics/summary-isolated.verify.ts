/** Opt-in, read-only synthetic integration. No .env, login writes, service role or SQL mutations. */
import assert from 'node:assert/strict';
import { readFileSync,writeFileSync,mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createPrivateKey,sign,createHash } from 'node:crypto';
import { readAuthenticatedSummary,type SummaryAuthenticatedClient } from './summary-transport';
import { SummaryQueryController } from './summary-query';
import { presentStatisticsSummary } from './summary-presenter';

const root=process.cwd(),runtime=resolve(root,'supabase/statistics-v1-test/.runtime'),dir=resolve(root,'docs/estadisticas-v1/p03-c');
const project='orderops-statistics-v1-test-74718de66a41',api='http://127.0.0.1:56321';
function gate(script:string){const r=spawnSync(process.execPath,[resolve(root,'scripts/statistics-v1',script)],{cwd:root,encoding:'utf8',timeout:180000});assert.equal(r.status,0,`Isolation gate failed: ${script}`);return r.stdout.trim();}
const offline=gate('isolation-policy.verify.mjs'),before=gate('assert-isolated-target.mjs');
const migration=readFileSync(resolve(root,'supabase/migrations/20261013004000_statistics_v1_comparative_series.sql'));
assert.equal(createHash('sha256').update(migration).digest('hex'),'b10c330adff70b803d9d25165f07830e90d4cd092aa4ba2cf3d0120a43f95219');
const manifest=JSON.parse(readFileSync(resolve(runtime,'manifest.json'),'utf8'));
assert.equal(manifest.projectId,project);
function inventory(){
  const sql="BEGIN READ ONLY; SELECT json_build_object('versions',(SELECT json_agg(version ORDER BY version) FROM supabase_migrations.schema_migrations),'installedHash',(SELECT md5(statements[1]) FROM supabase_migrations.schema_migrations WHERE version='20261013004000'),'orders',(SELECT count(*) FROM public.orders),'sessions',(SELECT count(*) FROM public.store_sessions),'completions',(SELECT count(*) FROM public.order_statistics_completions),'items',(SELECT count(*) FROM public.order_items)); COMMIT;";
  const r=spawnSync('docker',['exec',`supabase_db_${project}`,'psql','-X','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-At','-c',sql],{cwd:root,encoding:'utf8',timeout:30000});assert.equal(r.status,0,'Read-only isolated inventory failed');
  const data=JSON.parse(r.stdout.split(/\r?\n/).find(line=>line.startsWith('{'))!);
  const expected=[...manifest.migrations.map((m:{name:string})=>m.name.split('_')[0]),'20261013001000','20261013002000','20261013003000','20261013004000'].sort();assert.deepEqual(data.versions,expected);
  assert.equal(data.installedHash,createHash('md5').update(migration).digest('hex'));
  for(const field of ['orders','sessions','completions','items'])assert.equal(data[field],0,'Synthetic dataset must remain empty');
  return data;
}
const inventoryBefore=inventory();
const r=spawnSync('supabase',['status','--workdir',runtime,'-o','json'],{cwd:root,encoding:'utf8',timeout:30000});assert.equal(r.status,0,'Isolated status unavailable');
const config=JSON.parse(r.stdout);assert.equal(config.API_URL,api);
const credentials=JSON.parse(readFileSync(resolve(runtime,'credentials.local.json'),'utf8'));
assert.equal(credentials.projectId,project);assert.equal(credentials.apiUrl,api);assert.equal(credentials.users.length,12);
const [key]=JSON.parse(readFileSync(resolve(runtime,'supabase/signing_keys.json'),'utf8'));
const signer=createPrivateKey({key,format:'jwk'});
interface SyntheticUser {id:string;role:string;business:'a'|'b'}
let assertions=0;const same=(a:unknown,b:unknown)=>{assertions++;assert.deepEqual(a,b);};
function adapter(user:SyntheticUser){
  let rpcCalls=0;const requests:Array<{path:string;method:string}>=[];
  const now=Math.floor(Date.now()/1000);
  const input=Buffer.from(JSON.stringify({alg:'ES256',typ:'JWT',kid:key.kid})).toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:user.id,role:'authenticated',aud:'authenticated',iss:api+'/auth/v1',iat:now,exp:now+300})).toString('base64url');
  const token=input+'.'+sign('sha256',Buffer.from(input),{key:signer,dsaEncoding:'ieee-p1363'}).toString('base64url');
  async function request(path:string,body?:unknown){
    const url=new URL(path,api);assert.equal(url.origin,api);
    const method=body===undefined?'GET':'POST';
    assert.ok(method==='GET'||url.pathname==='/rest/v1/rpc/statistics_v1_summary','Only read-only RPC POST permitted');
    requests.push({path:url.pathname,method});
    const result=await fetch(url,{method,headers:{apikey:config.ANON_KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(20000)});
    return {ok:result.ok,status:result.status,data:await result.json()};
  }
  const client:SummaryAuthenticatedClient={
    auth:{getUser:async()=>{const v=await request('/auth/v1/user');return {data:{user:v.ok?{id:v.data.id}:null},error:v.ok?null:{status:v.status}};}},
    from:name=>({select:columns=>({eq:(column,id)=>({maybeSingle:async()=>{
      const params=new URLSearchParams({select:columns,[column]:`eq.${id}`});
      const v=await request(`/rest/v1/${name}?${params}`);
      return {data:v.ok&&v.data.length===1?v.data[0]:null,error:v.ok?null:{status:v.status}};
    }})})}),
    rpc:async(name,args)=>{same(name,'statistics_v1_summary');rpcCalls++;const v=await request(`/rest/v1/rpc/${name}`,args);return {data:v.ok?v.data:null,error:v.ok?null:{code:v.data.code??'',message:v.data.message??'RPC failed'}};},
  };
  return {client,requests,calls:()=>rpcCalls};
}
async function run(){
  const roles=[];let empty:unknown;
  for(const user of credentials.users as SyntheticUser[]){
    const m=adapter(user);const result=await readAuthenticatedSummary(m.client,'period=today');
    const allowed=['owner','manager','admin'].includes(user.role);same(result.ok,allowed);same(m.calls(),allowed?1:0);
    if(result.ok){same(result.scope,{userId:user.id,businessId:credentials.businesses[user.business]});same(result.data.status,'ready');
      if(result.data.status==='ready'){same(result.data.metrics.completedOrders.value,'0');const view=presentStatisticsSummary(result.data);same(view.dataState,'empty');same(view.kpis[2].valueText,'No disponible');same(view.reading.state,'neutral');empty=view;}}
    else same(result.code,'forbidden');
    roles.push({business:user.business,role:user.role,result:result.ok?'PASS':'DENIED',rpcCalls:m.calls(),requests:m.requests});
  }
  const user=(credentials.users as SyntheticUser[]).find(u=>u.role==='owner'&&u.business==='a')!;
  const m=adapter(user),scope={userId:user.id,businessId:credentials.businesses.a};
  const controller=new SummaryQueryController(scope,url=>readAuthenticatedSummary(m.client,url));
  await Promise.all([controller.query('period=today'),controller.query('period=today&tab=summary')]);same(m.calls(),1);same(controller.getSnapshot().status,'ready');
  for(const metric of ['sales','completedOrders','averageTicket','mainUnits'] as const)controller.selectMetric(metric);
  const state=controller.getSnapshot();if(state.status==='ready'&&state.data.status==='ready')for(const point of state.data.series.points)controller.selectPoint(point.key);
  controller.selectPoint(null);same(m.calls(),1);await controller.query('period=this_week');same(m.calls(),2);same(controller.getSnapshot().status,'ready');
  const after=gate('assert-isolated-target.mjs');same(JSON.parse(after),JSON.parse(before));const inventoryAfter=inventory();same(inventoryAfter,inventoryBefore);
  mkdirSync(dir,{recursive:true});
  writeFileSync(resolve(dir,'isolated-evidence.json'),JSON.stringify({at:new Date().toISOString(),result:'PASS',assertions,projectId:project,api,db:'127.0.0.1:56322',offline,before:JSON.parse(before),after:JSON.parse(after),inventoryBefore,inventoryAfter,roles,controller:'one RPC for concurrent same-period queries and all local metric/point interactions; second RPC only on period change',sqlWrites:0,authSessionWrites:0,fixturesCreated:0,cleanup:'Nothing created; preexisting synthetic identities and empty datasets retained'},null,2)+'\n');
  writeFileSync(resolve(dir,'empty-example.json'),JSON.stringify(empty,null,2)+'\n');
  console.log(`PASS ${assertions} isolated integration assertions; authenticated HTTP/profile/RPC, no SQL/Auth writes.`);
}
void run().catch(error=>{
  writeFileSync(resolve(runtime,'p03-c-failure.local.log'),error instanceof Error?error.stack??error.name:'Unknown error');
  console.error('FAIL isolated P03-C integration; no resources started or changed. Diagnostic saved in ignored runtime.');process.exitCode=1;
});
