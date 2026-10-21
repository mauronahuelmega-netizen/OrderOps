/** Own browser QA. Only isolated cookies/identities. Visual fixtures intercept in the test, never app code. */
/* global localStorage, document, window */
import assert from 'node:assert/strict';
import { readFileSync,writeFileSync,mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createPrivateKey,sign } from 'node:crypto';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
const root=process.cwd(),runtime=resolve(root,'supabase/statistics-v1-test/.runtime'),dir=resolve(root,'docs/estadisticas-v1/p03-d');
const app='http://127.0.0.1:3037',api='http://127.0.0.1:56321';
function gate(){const r=spawnSync(process.execPath,['scripts/statistics-v1/assert-isolated-target.mjs'],{encoding:'utf8',timeout:180000});assert.equal(r.status,0,'Live identity failed');return JSON.parse(r.stdout);}
const before=gate();assert.equal(before.projectId,'orderops-statistics-v1-test-74718de66a41');
const credentials=JSON.parse(readFileSync(resolve(runtime,'credentials.local.json'),'utf8'));assert.equal(credentials.apiUrl,api);assert.equal(credentials.projectId,before.projectId);
const [key]=JSON.parse(readFileSync(resolve(runtime,'supabase/signing_keys.json'),'utf8')),signer=createPrivateKey({key,format:'jwk'});
function cookie(user){const now=Math.floor(Date.now()/1000);const input=Buffer.from(JSON.stringify({alg:'ES256',typ:'JWT',kid:key.kid})).toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:user.id,role:'authenticated',aud:'authenticated',iss:api+'/auth/v1',iat:now,exp:now+3600})).toString('base64url');const token=input+'.'+sign('sha256',Buffer.from(input),{key:signer,dsaEncoding:'ieee-p1363'}).toString('base64url');return {name:'sb-127-auth-token',value:'base64-'+Buffer.from(JSON.stringify({access_token:token,refresh_token:'synthetic-not-used',expires_at:now+3600,expires_in:3600,token_type:'bearer',user:{id:user.id,email:user.email,role:'authenticated',aud:'authenticated',app_metadata:{},user_metadata:{},created_at:new Date().toISOString()}})).toString('base64url'),url:app};}
const require=createRequire('C:/Users/Oasis Desktop/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json');
const {chromium}=require('playwright');
const fixtures=JSON.parse(readFileSync('lib/statistics/fixtures/series-responses.json','utf8'));
Object.assign(fixtures,JSON.parse(readFileSync('lib/statistics/fixtures/p03-d-responses.json','utf8')));
const browser=await chromium.launch({headless:true,channel:'chrome'});
mkdirSync(resolve(dir,'screenshots'),{recursive:true});
let assertions=0,lastPage;const results=[],foreign=[],errors=[];const check=(actual,expected,label)=>{assertions++;assert.deepEqual(actual,expected,label);results.push({label,result:'PASS'});};
async function context(user,theme='light',viewport={width:1440,height:1050}) {
  const ctx=await browser.newContext({viewport,serviceWorkers:'block'});if(user)await ctx.addCookies([cookie(user)]);
  await ctx.addInitScript(t=>localStorage.setItem('orderops-theme',t),theme);
  await ctx.route('**/*',route=>{const origin=new URL(route.request().url()).origin;if(origin===app||origin===api||origin==='null')return route.continue();foreign.push(origin);return route.abort();});
  const page=await ctx.newPage();lastPage=page;page.on('pageerror',e=>errors.push(e.message));return {ctx,page};
}
const owner=credentials.users.find(u=>u.role==='owner'&&u.business==='a');
function payload(name='complete') {const data=structuredClone(fixtures[name]);data.businessId=credentials.businesses.a;return {ok:true,scope:{userId:owner.id,businessId:credentials.businesses.a},periodKey:JSON.stringify(['custom',data.period.startDate,data.period.endDate]),data};}
const sample=payload();const url=`${app}/admin/statistics?period=custom&start=${sample.data.period.startDate}&end=${sample.data.period.endDate}`;
async function snapshot(page,name){await page.screenshot({path:resolve(dir,'screenshots',name+'.png'),fullPage:true});}
async function visibleOverflow(page){return page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);}
async function run(){
  const {ctx,page}=await context(owner);let requests=0;
  page.on('request',r=>{if(new URL(r.url()).pathname==='/admin/statistics/query')requests++;});
  await page.goto(app+'/admin/statistics',{waitUntil:'domcontentloaded',timeout:120000});
  if(process.argv.includes('--diagnostic')) {await page.waitForTimeout(3000);writeFileSync(resolve(runtime,'p03-d-browser-diagnostic.local.json'),JSON.stringify({url:page.url(),text:await page.locator('body').innerText(),errors,foreign,requests},null,2));await page.screenshot({path:resolve(runtime,'p03-d-browser-diagnostic.local.png'),fullPage:true});console.log('Read-only browser diagnostic saved.');await ctx.close();return;}
  await page.getByTestId('statistics-summary').waitFor({timeout:120000});await page.getByText('Todavía no hay resultados para este período.',{exact:true}).waitFor({timeout:45000});
  check(requests,1,'Real SSR cookies + initial default period: one query');check(await page.locator('#summary-period').inputValue(),'this_week','Default week');
  check(await page.locator('[data-kpi="averageTicket"] strong').textContent(),'No disponible','Empty average is unknown, not zero');
  await snapshot(page,'desktop-light-empty-live');
  for(const preset of ['today','yesterday','this_week','this_month','previous_month','last_7_days','last_30_days']){
    const count=requests;await page.locator('#summary-period').selectOption(preset);await page.getByText('Todavía no hay resultados para este período.',{exact:true}).waitFor();check(requests,count+(new URL(page.url()).searchParams.get('period')===preset?1:0),`Live period ${preset}: one query`);check(new URL(page.url()).searchParams.get('period'),preset,'URL persists '+preset);
  }
  await page.locator('#summary-period').selectOption('custom');await page.getByLabel('Desde',{exact:true}).fill('2026-10-01');await page.getByLabel('Hasta',{exact:true}).fill('2026-10-02');const customCount=requests;await page.getByRole('button',{name:'Aplicar rango'}).click();await page.getByText('Todavía no hay resultados para este período.',{exact:true}).waitFor();check(requests,customCount+1,'Live custom range one query');check(new URL(page.url()).searchParams.get('start'),'2026-10-01','Custom dates in URL');
  const spoof=await ctx.request.get(app+'/admin/statistics/query?period=today&businessId='+credentials.businesses.b);check((await spoof.json()).data.businessId,credentials.businesses.a,'URL cannot choose a foreign business');check(spoof.headers()['cache-control'].includes('no-store'),true,'Response never shared cached');
  for(const user of credentials.users){const cookieHeader=`${cookie(user).name}=${cookie(user).value}`;const r=await ctx.request.get(app+'/admin/statistics/query?period=today',{headers:{Cookie:cookieHeader}});check(r.status(),['owner','manager','admin'].includes(user.role)?200:403,`Real cookies role ${user.business}/${user.role}`);const data=await r.json();if(data.ok)check(data.data.businessId,credentials.businesses[user.business],'Actual tenant '+user.business+'/'+user.role);}
  const anon=await context();const response=await anon.ctx.request.get(app+'/admin/statistics/query?period=today');check(response.status(),401,'Anonymous endpoint denied');await anon.page.goto(app+'/admin/statistics');check(new URL(anon.page.url()).pathname,'/admin/login','Anonymous page login redirect');await anon.ctx.close();
  const denied=await context(credentials.users.find(u=>u.role==='operator'));await denied.page.goto(app+'/admin/statistics');await denied.page.getByText('No tenés permisos para consultar Estadísticas.',{exact:true}).waitFor();check(await denied.page.locator('[data-kpi]').count(),0,'Denied page exposes no KPI');await denied.ctx.close();
  await page.setViewportSize({width:390,height:844});await snapshot(page,'mobile-light-empty-live');await page.evaluate(()=>document.documentElement.setAttribute('data-dashboard-theme','dark'));await snapshot(page,'mobile-dark-empty-live');await page.setViewportSize({width:1440,height:1050});await snapshot(page,'desktop-dark-empty-live');
  await ctx.close();
  // These cases verify rendering with strict synthetic contract fixtures, not nonempty live DB data.
  for(const theme of ['light','dark'])for(const mobile of [false,true]){
    const {ctx,page}=await context(owner,theme,mobile?{width:390,height:844}:{width:1440,height:1050});let calls=0;
    await page.route('**/admin/statistics/query?**',async route=>{calls++;await route.fulfill({json:sample});});
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});await page.locator('[data-kpi="sales"] strong').filter({hasText:'$ 200'}).waitFor();
    const first=calls;await page.locator('[data-kpi="mainUnits"]').click();check(await page.locator('#chart-metric').inputValue(),'mainUnits','KPI -> chart synchronized');check(await page.locator('[data-kpi="mainUnits"]').getAttribute('aria-pressed'),'true','Active KPI pressed');
    await page.locator('#chart-metric').selectOption('averageTicket');check(await page.locator('[data-kpi="averageTicket"]').getAttribute('aria-pressed'),'true','Chart -> KPI synchronized');
    await page.locator('#chart-metric').selectOption('sales');await page.locator('#chart-point').selectOption(sample.data.series.points.find(p=>p.current?.metrics.sales.knownCount>0).key);check(await page.getByTestId('point-detail').textContent().then(t=>t.includes('Actual')),true,'Persistent point detail');check(calls,first,'KPI/point interactions do not query');
    check(await visibleOverflow(page),false,`No horizontal overflow ${theme}/${mobile?'mobile':'desktop'}`);
    if(!mobile){const hero=await page.locator('[data-kpi="sales"]').boundingBox(),secondary=await page.locator('[data-kpi="completedOrders"]').boundingBox();check(hero.width*hero.height>secondary.width*secondary.height*2,true,'Sales surface dominates');const chart=await page.getByTestId('summary-chart').boundingBox(),reading=await page.getByTestId('commercial-reading').boundingBox();check(chart.width/reading.width>1.8&&chart.width/reading.width<2.2,true,'Desktop chart reading 2:1');}
    else {const a=await page.locator('[data-kpi="completedOrders"]').boundingBox(),b=await page.locator('[data-kpi="averageTicket"]').boundingBox();check(Math.abs(a.y-b.y)<2,true,'Mobile secondary two columns where viable');}
    await snapshot(page,`${mobile?'mobile':'desktop'}-${theme}-complete-fixture`);
    await page.locator('#chart-point').focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');check(await page.evaluate(()=>document.activeElement?.id),'chart-point','Keyboard alternative for points');
    await ctx.close();
  }
  const altered=await context(owner,'dark',{width:390,height:844});let current=sample;
  await altered.page.route('**/admin/statistics/query?**',route=>route.fulfill({json:current}));
  current=payload('long_amount');await altered.page.goto(url);await altered.page.locator('[data-kpi="sales"] strong').filter({hasText:'$ 200.000.000.000.000.000'}).waitFor();
  await altered.page.evaluate(()=>document.documentElement.style.fontSize='125%');check(await visibleOverflow(altered.page),false,'Long exact monetary value and 125% text without overflow');await snapshot(altered.page,'mobile-dark-long-amount-125text-fixture');
  await altered.page.setViewportSize({width:844,height:390});check(await visibleOverflow(altered.page),false,'Landscape without overflow');await snapshot(altered.page,'landscape-dark-long-amount-125text-fixture');await altered.page.setViewportSize({width:390,height:844});
  current=payload('unknown_amount');await altered.page.goto(url);await altered.page.getByText('Cobertura parcial',{exact:true}).first().waitFor();check(await altered.page.locator('[data-kpi="averageTicket"] strong').textContent(),'No disponible','Partial unknown ticket');await snapshot(altered.page,'mobile-dark-partial-fixture');
  await altered.page.locator('[data-kpi="averageTicket"]').click();await altered.page.getByText('No hay valores conocidos para graficar este indicador.',{exact:true}).waitFor();check(await altered.page.getByTestId('summary-chart').locator('svg[role="img"]').count(),0,'Unknown indicator not plotted as zero');
  current=payload('no_comparison');await altered.page.getByRole('button',{name:'Actualizar',exact:true}).click();await altered.page.locator('#chart-metric').waitFor();await altered.page.locator('#chart-metric').selectOption('sales');check((await altered.page.getByTestId('summary-chart').locator('path[class*="previousLine"]').getAttribute('d')??'').trim(),'', 'No invalid previous line');await snapshot(altered.page,'mobile-dark-no-comparison-fixture');
  current={ok:true,scope:sample.scope,periodKey:sample.periodKey,data:{...fixtures.configuration_required,businessId:credentials.businesses.a}};await altered.page.getByRole('button',{name:'Actualizar',exact:true}).click();await altered.page.getByRole('heading',{name:'Configuración requerida'}).waitFor();check(await altered.page.locator('[data-kpi]').count(),0,'Timezone configuration not fake data');await snapshot(altered.page,'mobile-dark-configuration-fixture');
  current=sample;await altered.page.reload();await altered.page.locator('#chart-point').waitFor();
  current={ok:false,code:'timeout',message:'ignored raw',retryable:true};await altered.page.getByRole('button',{name:'Actualizar',exact:true}).click();await altered.page.getByRole('button',{name:'Volver a intentar'}).waitFor();check(await altered.page.locator('[data-kpi]').count(),0,'Error contains no stale KPI');await snapshot(altered.page,'mobile-dark-error-fixture');
  await altered.page.setViewportSize({width:1440,height:1050});await altered.page.evaluate(()=>{document.documentElement.style.fontSize='100%';document.documentElement.setAttribute('data-dashboard-theme','light');});await snapshot(altered.page,'desktop-light-error-fixture');
  current=sample;await altered.page.getByRole('button',{name:'Volver a intentar'}).click();await altered.page.locator('#chart-point').waitFor();check(await altered.page.locator('#summary-period').inputValue(),'custom','Retry retains period');await altered.ctx.close();
  const race=await context(owner);let release;const held=new Promise(r=>{release=r;});
  await race.page.route('**/admin/statistics/query?**',async route=>{if(new URL(route.request().url()).searchParams.get('period')==='custom'){await held;await route.fulfill({json:sample});}else await route.fulfill({json:{ok:true,scope:sample.scope,periodKey:JSON.stringify(['today',null,null]),data:{...fixtures.configuration_required,businessId:credentials.businesses.a}}});});
  await race.page.goto(url);await race.page.getByText('Cargando estadísticas…',{exact:true}).waitFor();check(await race.page.locator('[data-kpi]').count(),0,'Loading contains no fictional zeros');await snapshot(race.page,'desktop-light-loading-fixture');await race.page.getByRole('button',{name:'Hoy',exact:true}).click();await race.page.getByRole('heading',{name:'Configuración requerida'}).waitFor();release();await race.page.waitForResponse(r=>new URL(r.url()).pathname==='/admin/statistics/query'&&new URL(r.url()).searchParams.get('period')==='custom');check(await race.page.getByRole('heading',{name:'Configuración requerida'}).isVisible(),true,'Late reply cannot replace current URL period');check(await race.page.locator('[data-kpi]').count(),0,'Old financial data discarded');await race.ctx.close();
  check(foreign,[],'No foreign browser origins');check(errors,[],'No uncaught browser errors');
  const after=gate();check(after,before,'Identity unchanged after QA');
  writeFileSync(resolve(dir,'e2e.json'),JSON.stringify({at:new Date().toISOString(),result:'PASS',assertions,results,live:'SSR cookies, real extended RPC, eight periods, two tenants, six roles; existing empty synthetic datasets',visual:'Complete/partial/error screenshots intercept only the owned endpoint within Playwright using strict synthetic fixtures; never app fallback data',before,after,foreignOrigins:foreign,browserErrors:errors},null,2)+'\n');
  console.log(`PASS ${assertions} P03-D browser assertions; isolated real-cookie flow and explicitly labeled visual fixtures.`);
}
try{await run();}catch(error){writeFileSync(resolve(runtime,'p03-d-e2e-failure.local.log'),error.stack??String(error));if(lastPage&&!lastPage.isClosed())writeFileSync(resolve(runtime,'p03-d-browser-failure.local.json'),JSON.stringify({url:lastPage.url(),text:await lastPage.locator('body').innerText(),errors,foreign},null,2));console.error('FAIL P03-D E2E; diagnostic in ignored runtime.');process.exitCode=1;}finally{await browser.close();}
