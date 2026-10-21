/** Real Auth-issued synthetic sessions with SSR cookies; local sign-out in finally, no schema/DML. */
import assert from 'node:assert/strict';
import { readFileSync,writeFileSync,statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
const root=process.cwd(),runtime=resolve(root,'supabase/statistics-v1-test/.runtime');
const gate=()=>{const r=spawnSync(process.execPath,['scripts/statistics-v1/assert-isolated-target.mjs'],{encoding:'utf8',timeout:180000});assert.equal(r.status,0);return JSON.parse(r.stdout);};
const before=gate();assert.equal(before.projectId,'orderops-statistics-v1-test-74718de66a41');
const r=spawnSync('supabase',['status','--workdir',runtime,'-o','json'],{encoding:'utf8',timeout:30000});assert.equal(r.status,0);
const config=JSON.parse(r.stdout);assert.equal(config.API_URL,'http://127.0.0.1:56321');
const data=JSON.parse(readFileSync(resolve(runtime,'credentials.local.json'),'utf8'));assert.equal(data.projectId,before.projectId);
const phaseBaselineAt=statSync('docs/estadisticas-v1/p03-d/baseline.json').mtime.toISOString();
function sessionInventory(){const sql=`BEGIN READ ONLY; SELECT json_build_object('count',count(*),'fingerprint',md5(string_agg(id::text||user_id::text||created_at::text,',' ORDER BY id)),'first',min(created_at),'last',max(created_at),'afterPhaseBaseline',count(*) FILTER (WHERE created_at >= '${phaseBaselineAt}'::timestamptz)) FROM auth.sessions; COMMIT;`;const r=spawnSync('docker',['exec',`supabase_db_${before.projectId}`,'psql','-X','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-At','-c',sql],{encoding:'utf8',timeout:30000});assert.equal(r.status,0);return JSON.parse(r.stdout.split(/\r?\n/).find(line=>line.startsWith('{')));}
const sessionsBefore=sessionInventory();assert.equal(sessionsBefore.afterPhaseBaseline,0,'Unowned new sessions exist; stop rather than delete');
const {createServerClient}=createRequire(resolve(root,'package.json'))('@supabase/ssr');
const {chromium}=createRequire('C:/Users/Oasis Desktop/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const browser=await chromium.launch({channel:'chrome',headless:true}),results=[];
try {
  for(const user of [data.users.find(u=>u.role==='owner'&&u.business==='a'),data.users.find(u=>u.role==='manager'&&u.business==='b')]) {
    let jar=[];
    const client=createServerClient(config.API_URL,config.ANON_KEY,{cookies:{getAll:()=>jar,setAll:values=>{for(const value of values){jar=jar.filter(c=>c.name!==value.name);if(value.value)jar.push(value);}}},global:{fetch:(url,options)=>{assert.equal(new URL(String(url)).origin,config.API_URL);return fetch(url,options);}}});
    let ctx;let signedIn=false;
    try {
      const login=await client.auth.signInWithPassword({email:user.email,password:user.password});assert.equal(login.error,null);signedIn=true;assert.equal(login.data.user.id,user.id);
      const sessionId=JSON.parse(Buffer.from(login.data.session.access_token.split('.')[1],'base64url').toString()).session_id;assert.match(sessionId,/^[a-f0-9-]{36}$/);
      ctx=await browser.newContext({serviceWorkers:'block'});await ctx.addCookies(jar.map(({name,value})=>({name,value,url:'http://127.0.0.1:3037'})));
      const response=await ctx.request.get('http://127.0.0.1:3037/admin/statistics/query?period=today');assert.equal(response.status(),200);const summary=await response.json();assert.equal(summary.scope.userId,user.id);assert.equal(summary.data.businessId,data.businesses[user.business]);
      const page=await ctx.newPage();await page.goto('http://127.0.0.1:3037/admin/statistics');await page.getByText('Todavía no hay resultados para este período.',{exact:true}).waitFor({timeout:45000});assert.equal(await page.locator('[data-kpi]').count(),4);
      results.push({business:user.business,role:user.role,authIssuedSession:true,sessionId,ssrCookies:jar.map(c=>c.name),rpcStatus:200,tenantVerified:true,visibleKpis:4});
    } finally {
      if(signedIn){const logout=await client.auth.signOut({scope:'local'});assert.equal(logout.error,null);}
      if(ctx){await ctx.clearCookies();const denied=await ctx.request.get('http://127.0.0.1:3037/admin/statistics/query?period=today');assert.equal(denied.status(),401);await ctx.close();}
    }
  }
  const after=gate();assert.deepEqual(after,before);
  const sessionsAfter=sessionInventory();assert.deepEqual(sessionsAfter,sessionsBefore);
  writeFileSync('docs/estadisticas-v1/p03-d/auth-sessions.json',JSON.stringify({at:new Date().toISOString(),result:'PASS',results,before,after,phaseBaselineAt,sessionsBefore,sessionsAfter,cleanup:'Each owned Auth-issued synthetic session locally signed out in finally; all preexisting sessions retained with identical row fingerprint; browser cookies cleared; anonymous endpoint 401 verified. No orders, schema changes or SQL mutations.'},null,2)+'\n');
  console.log('PASS real Auth sessions: synthetic A owner / B manager, canonical SSR cookies, real RPC and page, local logout and anonymous denial.');
} catch(error){writeFileSync(resolve(runtime,'p03-d-auth-failure.local.log'),error.stack??String(error));console.error('FAIL synthetic Auth-session QA; diagnostic retained locally.');process.exitCode=1;}finally{await browser.close();}
