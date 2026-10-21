import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {verify,save,run,runtime,m,read} from './p03-f4a-common.mjs';
import {session,extract} from './p03-f4a-session.mjs';
import {decodeStatisticsSeriesResponse} from '../../lib/statistics/series-read';
const isolation=verify(),config=JSON.parse(run('supabase',['status','--workdir',runtime,'-o','json']));
assert.equal(config.API_URL,'http://127.0.0.1:56321');const api=config.API_URL;
const credentials=JSON.parse(fs.readFileSync(`${runtime}/credentials.local.json`,'utf8'));assert.equal(credentials.projectId,m.projectId);
const jwk=JSON.parse(fs.readFileSync(`${runtime}/supabase/signing_keys.json`,'utf8'))[0];
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(`${runtime}/supabase/signing_keys.json`)).digest('hex'),m.signingKeysHash);
const key=crypto.createPrivateKey({format:'jwk',key:jwk});
function token(user:any,expired=false){const now=Math.floor(Date.now()/1000);const head=Buffer.from(JSON.stringify({alg:'ES256',typ:'JWT',kid:jwk.kid})).toString('base64url');const payload=Buffer.from(JSON.stringify({sub:user.id,aud:'authenticated',role:'authenticated',iss:`${api}/auth/v1`,iat:now-120,exp:expired?now-60:now+900,email:user.email,aal:'aal1',app_metadata:{role:'owner',business_id:credentials.businesses[user.business==='a'?'b':'a']}})).toString('base64url');const body=`${head}.${payload}`;return `${body}.${crypto.sign('sha256',Buffer.from(body),{key,dsaEncoding:'ieee-p1363'}).toString('base64url')}`;}
async function request(path:string,jwt?:string,rpc=false){const start=performance.now();const response=await fetch(api+path,{method:rpc?'POST':'GET',headers:{apikey:config.ANON_KEY,...(jwt?{Authorization:`Bearer ${jwt}`}:{ }),'Content-Type':'application/json'},...(rpc?{body:JSON.stringify({p_period:'today'})}:{}),signal:AbortSignal.timeout(15000)});const headersMs=performance.now()-start;const bodyStart=performance.now(),text=await response.text(),bodyMs=performance.now()-bodyStart;const parseStart=performance.now(),data=JSON.parse(text),parseMs=performance.now()-parseStart;return{status:response.status,data,headersMs,bodyMs,jsonParseMs:parseMs,totalMs:performance.now()-start};}
const authFingerprint=()=>JSON.parse(read("SELECT json_build_object('users',(SELECT md5(string_agg(to_jsonb(t)::text,',' ORDER BY id)) FROM auth.users t),'sessions',(SELECT md5(string_agg(to_jsonb(t)::text,',' ORDER BY id)) FROM auth.sessions t),'refresh',(SELECT md5(string_agg(to_jsonb(t)::text,',' ORDER BY id)) FROM auth.refresh_tokens t))"));
const before=authFingerprint(),cases=[],samples=[],privateSamples=[];let privateSupported=true;
for(const user of credentials.users.filter((u:any)=>u.business==='a')){
 const jwt=token(user),auth=await request('/auth/v1/user',jwt),rpc=await request('/rest/v1/rpc/statistics_v1_summary',jwt,true),allowed=['owner','manager','admin'].includes(user.role);
 assert.equal(rpc.status,allowed?200:403);if(allowed){assert.equal(rpc.data.businessId,credentials.businesses.a);decodeStatisticsSeriesResponse(rpc.data,credentials.businesses.a);}
 if(auth.status!==200)privateSupported=false;else assert.equal(auth.data.id,user.id);
 cases.push({role:user.role,authStatus:auth.status,rpcStatus:rpc.status,forgedMetadataIgnored:true});
}
for(const business of ['a','b']){
 const user=credentials.users.find((u:any)=>u.business===business&&u.role==='owner'),jwt=token(user);
 for(let i=0;i<21;i++){
  const auth=await request('/auth/v1/user',jwt),rpc=await request('/rest/v1/rpc/statistics_v1_summary',jwt,true);assert.equal(rpc.status,200);assert.equal(rpc.data.businessId,credentials.businesses[business]);const t=performance.now();decodeStatisticsSeriesResponse(rpc.data,credentials.businesses[business]);const decodeMs=performance.now()-t;
  samples.push({business,warmup:i===0,authVerifyHttpMs:auth.totalMs,rpcHttpMs:rpc.totalMs,rpcHeadersMs:rpc.headersMs,rpcBodyMs:rpc.bodyMs,jsonParseMs:rpc.jsonParseMs,decoderMs:decodeMs,orders:'0_committed_fixture_rows'});
 }
}
const owner=credentials.users.find((u:any)=>u.business==='a'&&u.role==='owner');
const expiredAuth=await request('/auth/v1/user',token(owner,true)),expiredRPC=await request('/rest/v1/rpc/statistics_v1_summary',token(owner,true),true),anonymous=await request('/rest/v1/rpc/statistics_v1_summary',undefined,true);assert.equal(expiredRPC.status,401);assert.ok([401,403].includes(anonymous.status));assert.notEqual(expiredAuth.status,200);
if(privateSupported){
 const s=session('http_private');try{
  const fixture=fs.readFileSync('scripts/statistics-v1/p03-f1-fixture.sql','utf8').replaceAll('__N__','5').replace('begin;','begin isolation level repeatable read;').replace("statement_timeout='30s'","statement_timeout='15s'");
  await s.query(`SET application_name='statistics_f4a_http_private';SET statistics.test_token='${m.token}';${fixture}\n\\timing on\n`);
  for(let i=0;i<21;i++){
   const auth=await request('/auth/v1/user',token(owner));assert.equal(auth.status,200);assert.equal(auth.data.id,owner.id);assert.match(auth.data.id,/^[a-f0-9-]{36}$/);
   const start=performance.now();await s.query(`SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claims',jsonb_build_object('sub','${auth.data.id}','role','authenticated')::text,true);`);
   const r=extract(await s.query("SELECT private.statistics_v1_summary_d1_candidate('today');")),bridgeMs=performance.now()-start;const t=performance.now();decodeStatisticsSeriesResponse(r.data,credentials.businesses.a);const decodeMs=performance.now()-t;assert.equal(r.data.businessId,credentials.businesses.a);
   privateSamples.push({warmup:i===0,authHttpMs:auth.totalMs,sqlPsqlWireMs:r.ms,privateBridgeWallMs:bridgeMs,decoderMs:decodeMs,orders:5});
  }
 }finally{await s.close();}
}
assert.deepEqual(authFingerprint(),before);verify();
save('http-results.json',{result:'PASS_WITH_LIMITATIONS',liveIdentity:isolation.isolation,cases,samples,privateSamples,privateHarness:privateSupported?'Client-local only: live Auth HTTP getUser verifies signed identity before authenticated direct D1 SQL; no HTTP D1 endpoint/service/route created.':'NOT_EXECUTED: stateless signed token not accepted by live Auth getUser; refuse unverified private bridge.',credentials:'Exclusive ES256 isolated signing key, authenticated synthetic sub; anon API key only; no service role. Stateless tokens avoid changing existing Auth users/sessions/refresh records.',expired:{authStatus:expiredAuth.status,rpcStatus:expiredRPC.status,privateBridge:'Denied by live auth; no SQL invocation for expired/absent credentials'},anonymousStatus:anonymous.status,authRecordsFingerprintPreserved:true,limits:['Public HTTP tests see empty committed database; fixtures uncommitted and not shared across HTTP connections.','RPC HTTP wall includes proxy/JWT validation/server SQL/network; cannot attribute exact pure transport by subtracting unpaired PostgreSQL measurements.','Private D1 client bridge is NOT an HTTP RPC endpoint or application transport SLA.','No Auth-issued login/revocation/cookie lifecycle: only authentic signature/expiry validation of stateless synthetic tokens.']});
console.log('PASS authenticated HTTP reference/denials/expiry and private bridge limits; Auth fingerprints unchanged.');
