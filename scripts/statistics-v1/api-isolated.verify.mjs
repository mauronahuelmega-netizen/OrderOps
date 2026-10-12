/** Read-only RPC/Auth authorization tests using the isolated stack's own signer; no login/session writes. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createPrivateKey, sign } from 'node:crypto';
const root=fileURLToPath(new URL('../../',import.meta.url)),runtime=resolve(root,'supabase/statistics-v1-test/.runtime');
const gate=spawnSync(process.execPath,[resolve(root,'scripts/statistics-v1/assert-isolated-target.mjs')],{cwd:root,stdio:'inherit',timeout:180000});assert.equal(gate.status,0);
const m=JSON.parse(readFileSync(resolve(runtime,'manifest.json'),'utf8'));
const status=spawnSync('supabase',['status','--workdir',runtime,'-o','json'],{cwd:root,encoding:'utf8',timeout:30000});assert.equal(status.status,0);
const config=JSON.parse(status.stdout);assert.equal(new URL(config.API_URL).hostname,'127.0.0.1');assert.equal(new URL(config.API_URL).port,'56321');
const [key]=JSON.parse(readFileSync(resolve(runtime,'supabase/signing_keys.json'),'utf8'));
const privateKey=createPrivateKey({key,format:'jwk'});
const credentials=JSON.parse(readFileSync(resolve(runtime,'credentials.local.json'),'utf8'));assert.equal(credentials.projectId,m.projectId);
const reload=spawnSync('docker',['exec','-i',`supabase_db_${m.projectId}`,'psql','-X','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-At'],{cwd:root,input:"NOTIFY pgrst, 'reload schema';",encoding:'utf8',timeout:30000});assert.equal(reload.status,0);
function jwt(user){const now=Math.floor(Date.now()/1000);const head=Buffer.from(JSON.stringify({alg:'ES256',typ:'JWT',kid:key.kid})).toString('base64url');const body=Buffer.from(JSON.stringify({sub:user.id,role:'authenticated',aud:'authenticated',iss:config.API_URL+'/auth/v1',iat:now,exp:now+300})).toString('base64url');const input=head+'.'+body;return input+'.'+sign('sha256',Buffer.from(input),{key:privateKey,dsaEncoding:'ieee-p1363'}).toString('base64url');}
const results=[];
for(const user of credentials.users){
  const response=await fetch(new URL('/rest/v1/rpc/statistics_v1_summary',config.API_URL),{method:'POST',headers:{apikey:config.ANON_KEY,Authorization:`Bearer ${jwt(user)}`,'Content-Type':'application/json'},body:JSON.stringify({p_period:'today'})});
  const data=await response.json();const allowed=['owner','manager','admin'].includes(user.role);
  assert.equal(response.status,allowed?200:403,`API original role ${user.business}/${user.role}; error code ${data.code??'none'}`);
  if(allowed){assert.equal(data.businessId,credentials.businesses[user.business]);assert.equal(data.contractVersion,'statistics.v1');}
  results.push({business:user.business,role:user.role,status:response.status,businessId:credentials.businesses[user.business],response:data});
}
const anonymous=await fetch(new URL('/rest/v1/rpc/statistics_v1_summary',config.API_URL),{method:'POST',headers:{apikey:config.ANON_KEY,'Content-Type':'application/json'},body:'{"p_period":"today"}'});assert.ok([401,403].includes(anonymous.status));
writeFileSync(resolve(runtime,'api-contract.local.json'),JSON.stringify(results,null,2));
writeFileSync(resolve(root,'docs/estadisticas-v1/validacion-sql-api.json'),JSON.stringify({at:new Date().toISOString(),projectId:m.projectId,api:'127.0.0.1:56321',roles:results.map(({business,role,status})=>({business,role,status})),anonymousStatus:anonymous.status,noAuthSessionsWritten:true},null,2)+'\n');
console.log('PASS: isolated HTTP RPC, twelve synthetic original roles/two tenants, anonymous denied. No Auth session writes.');
