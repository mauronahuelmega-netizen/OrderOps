// PREPARED ONLY. Real Auth API writes/session creation require later explicit QA authorization.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {createRequire} from 'node:module';
const require=createRequire(path.resolve('package.json')),dir='docs/estadisticas-v1/p04-t01c/',runtime=path.resolve('supabase/statistics-v1-test/.runtime'),api='http://127.0.0.1:56321',project='orderops-statistics-v1-test-74718de66a41';
assert.ok(process.argv.includes('--authorized-http-qa'),'Preparation only; later explicit HTTP/Auth authorization required');
const mode=process.argv.includes('--enabled')?'enabled':'closed';
const checkpoint=JSON.parse(fs.readFileSync(dir+'qa-installed-evidence.json'));assert.equal(checkpoint.result,'PASS');assert.equal(checkpoint.projectId,project);assert.equal(checkpoint.policyMode,mode);assert.equal(checkpoint.httpTestsAuthorized,true);assert.equal(checkpoint.installSha256,JSON.parse(fs.readFileSync(dir+'qa-proposal-manifest.json')).files.find(x=>x.path.endsWith('qa-install.proposed.sql')).sha256);
// This future verifier is supplied/reviewed during the authorized installation; old absence checks must not be weakened.
assert.ok(fs.existsSync(dir+'qa-installed-live.verify.mjs'),'Installed-catalog verifier required, not available during preparation');
const verified=spawnSync(process.execPath,[dir+'qa-installed-live.verify.mjs','--verify-installed-qa'],{encoding:'utf8',timeout:60000});assert.equal(verified.status,0,'Fresh installed identity/catalog verification required');
const c=JSON.parse(fs.readFileSync(path.join(runtime,'credentials.local.json')));assert.equal(c.projectId,project);assert.equal(c.apiUrl,api);
const status=spawnSync('supabase',['status','--workdir',runtime,'-o','json'],{encoding:'utf8',timeout:30000});assert.equal(status.status,0);const config=JSON.parse(status.stdout);assert.equal(config.API_URL,api);assert.equal(new URL(config.DB_URL).hostname,'127.0.0.1');assert.equal(new URL(config.DB_URL).port,'56322');
const {createServerClient}=require('@supabase/ssr');const results=[];const targetFetch=(url,opts)=>{assert.equal(new URL(String(url)).origin,api);return fetch(url,{...opts,redirect:'error'});};
for(const u of c.users){let jar=[],client,signedIn=false,refreshToken;
 try{
  client=createServerClient(api,config.ANON_KEY,{cookies:{getAll:()=>jar,setAll:xs=>{for(const x of xs){jar=jar.filter(y=>y.name!==x.name);if(x.value)jar.push(x);}}},global:{fetch:targetFetch}});
  const login=await client.auth.signInWithPassword({email:u.email,password:u.password});assert.equal(login.error,null);signedIn=true;
  const verifiedUser=await client.auth.getUser();assert.equal(verifiedUser.error,null);assert.equal(verifiedUser.data.user.id,u.id);
  const profile=await client.from('profiles').select('id,business_id,role').eq('id',u.id).single();assert.equal(profile.error,null);assert.equal(profile.data.business_id,c.businesses[u.business]);assert.equal(profile.data.role,u.role);
  assert.ok(jar.length>0,'Auth-issued SSR cookies');
  const response=await client.rpc('statistics_v1_products',{p_period:'today'});const allowed=mode==='enabled'&&['owner','manager','admin'].includes(u.role);
  if(allowed){assert.equal(response.error,null);assert.equal(response.data.businessId,profile.data.business_id);assert.equal(response.data.version,'statistics.products.v1');}
  else{assert.equal(response.data,null);assert.equal(response.error?.code,'42501');assert.equal(response.error.message,['owner','manager','admin'].includes(u.role)?'STATISTICS_PRODUCTS_NOT_PUBLISHED':'STATISTICS_ACCESS_DENIED');}
  const foreign=await client.from('statistics_products_qa_access').select('user_id,business_id').eq('business_id',c.businesses[u.business==='a'?'b':'a']);assert.equal(foreign.error,null);assert.deepEqual(foreign.data,[]);
  const forbiddenWrite=await client.from('statistics_products_qa_access').update({enabled:true}).eq('user_id',u.id);assert.ok(forbiddenWrite.error,'Auth role must not write publication config');
  const refresh=await client.auth.refreshSession({refresh_token:login.data.session.refresh_token});assert.equal(refresh.error,null);assert.equal(refresh.data.user.id,u.id);refreshToken=refresh.data.session.refresh_token;
  results.push({business:u.business,role:u.role,mode,authIssued:true,getUserVerified:true,ssrCookieNames:jar.map(x=>x.name),rpcAllowed:allowed,rpcError:response.error?.code??null,tenantVerified:true,foreignConfigRows:0,configWriteDenied:true,refreshReal:true,expiresAt:refresh.data.session.expires_at,expiry:'NOT_EXECUTED: real Auth TTL 3600 seconds; no fake exp mutation counted as expiry'});
 }finally{
  if(signedIn){const logout=await client.auth.signOut({scope:'local'});assert.equal(logout.error,null);if(refreshToken){const stale=await client.auth.refreshSession({refresh_token:refreshToken});assert.ok(stale.error,'Logged-out refresh token must not refresh');}}
  jar=[];
 }
}
// Tokens/passwords/cookie values never written to evidence.
const anonymous=await targetFetch(api+'/rest/v1/rpc/statistics_v1_products',{method:'POST',headers:{apikey:config.ANON_KEY,'Content-Type':'application/json'},body:JSON.stringify({p_period:'today'})});assert.ok([401,403,404].includes(anonymous.status),'Anonymous caller must not receive statistics');const anonBody=await anonymous.json();assert.notEqual(anonBody.version,'statistics.products.v1');
results.push({anonymous:true,status:anonymous.status,denied:true,code:anonBody.code??null});
fs.writeFileSync(dir+'http-results.future.json',JSON.stringify({at:new Date().toISOString(),results,transport:'Auth-issued JWT + real SSR cookie jar to isolated Supabase, not Next route E2E',expiry:'NOT_EXECUTED',requiresIndependentAuthSessionInventoryCleanupCheck:true},null,2)+'\n');
console.log('Future synthetic Auth/SSR/RPC tests finished; inspect expiry and cleanup limitations before any PASS.');
