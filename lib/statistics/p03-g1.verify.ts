import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';import vm from 'node:vm';
import {statisticsPublishedForQa} from './statistics-publication-policy';
import {verifyStatisticsPrincipal} from './summary-principal';
import {readAuthenticatedSummary} from './summary-transport';
import fixtures from './fixtures/series-responses.json';
async function main(){
 const dir='docs/estadisticas-v1/p03-g1/';fs.mkdirSync(dir,{recursive:true});let assertions=0;
 const equal=(a:unknown,b:unknown)=>{assertions++;assert.deepEqual(a,b);};
 const user='00000000-0000-4000-8000-000000000001',biz=fixtures.complete.businessId;
 const config={version:'statistics.qa-publication.v1',projectId:'orderops-statistics-v1-test-74718de66a41',api:'http://127.0.0.1:56321',db:'127.0.0.1:56322',principals:[{userId:user,businessId:biz}]};const raw=JSON.stringify(config);
 for(const bad of [undefined,'','{','{}',JSON.stringify({...config,version:'production'}),JSON.stringify({...config,projectId:'foreign'}),JSON.stringify({...config,principals:[]}),JSON.stringify({...config,roles:['super_admin']}),JSON.stringify({...config,principals:[{userId:'*',businessId:'*'}]})])equal(statisticsPublishedForQa(bad,'http://127.0.0.1:56321',{userId:user,businessId:biz}),false);
 for(const target of [undefined,'http://127.0.0.1:54321','https://production.invalid','http://localhost:56321','http://127.0.0.1:56321/?allow=1','http://user:password@127.0.0.1:56321'])equal(statisticsPublishedForQa(raw,target,{userId:user,businessId:biz}),false);
 equal(statisticsPublishedForQa(raw,'http://127.0.0.1:56321',{userId:user,businessId:biz}),true);
 equal(statisticsPublishedForQa(raw,'http://127.0.0.1:56321',{userId:'00000000-0000-4000-8000-000000000002',businessId:biz}),false);
 function mock(role:unknown,authError:unknown=null,missing=false,business:unknown=biz){let calls=0;const client={supabaseUrl:'http://127.0.0.1:56321',auth:{getUser:async()=>({data:{user:authError?null:{id:user}},error:authError})},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:missing?null:{business_id:business,role},error:null})})})}),rpc:async()=>{calls++;return {data:fixtures.complete,error:null};}};return{client,calls:()=>calls};}
 const compile=(p:string,imports:Record<string,unknown>,env:Record<string,string>={})=>{const mod={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{module:mod,exports:mod.exports,process:{env},require:(id:string)=>{if(!(id in imports))throw Error(id);return imports[id];}});return mod.exports as Record<string,(...args:unknown[])=>Promise<unknown>>;};
 const closedHelper=compile('lib/statistics/statistics-publication-server.ts',{'server-only':{},'./statistics-publication-policy':{statisticsPublishedForQa}},{NEXT_PUBLIC_STATISTICS:'true'});
 const publishedHelper=compile('lib/statistics/statistics-publication-server.ts',{'server-only':{},'./statistics-publication-policy':{statisticsPublishedForQa}},{ORDEROPS_STATISTICS_QA_PUBLICATION:raw});
 equal(await closedHelper.statisticsPublicationAllowed(mock('owner').client,{userId:user,businessId:biz}),false);
 equal(await publishedHelper.statisticsPublicationAllowed(mock('owner').client,{userId:user,businessId:biz}),true);
 const realWrapper=compile('lib/statistics/summary-server.ts',{'server-only':{},'@/lib/supabase/server':{createSupabaseServerClient:async()=>mock('owner').client},'./summary-transport':{readAuthenticatedSummary,summaryFailure:(code:string)=>({ok:false,code})},'./statistics-publication-server':closedHelper});
 equal((await realWrapper.getStatisticsSummary('period=today') as {code:string}).code,'not_published');
 for(const role of ['owner','manager','admin',null,'unknown','operator','viewer','super_admin']){
  const m=mock(role),authorized=['owner','manager','admin'].includes(String(role));
  const closed=await readAuthenticatedSummary(m.client,'period=today');equal(closed.ok,false);if(!closed.ok)equal(closed.code,authorized?'not_published':'forbidden');equal(m.calls(),0);
  const open=await readAuthenticatedSummary(m.client,`period=custom&start=${fixtures.complete.period.startDate}&end=${fixtures.complete.period.endDate}&businessId=foreign&published=true`,scope=>statisticsPublishedForQa(raw,m.client.supabaseUrl,scope));equal(open.ok,authorized);equal(m.calls(),authorized?1:0);
  if(open.ok)equal(open.data,fixtures.complete);
  const route=compile('lib/statistics/summary-route-server.ts',{'server-only':{},'@/lib/supabase/server':{createSupabaseServerClient:async()=>m.client},'./summary-principal':{verifyStatisticsPrincipal},'./statistics-publication-server':{statisticsPublicationAllowed:()=>false}});
  equal((await route.statisticsRouteScope() as {status:string}).status,authorized?'not_published':'forbidden');
 }
 for(const m of [mock('owner',{status:401}),mock('owner',{code:'jwt_expired'}),mock('owner',{code:'refresh_token_not_found'})]){const r=await readAuthenticatedSummary(m.client,'period=today',()=>true);equal(!r.ok&&r.code,'unauthenticated');equal(m.calls(),0);}
 for(const m of [mock('owner',null,true),mock('owner',null,false,null)]){const r=await readAuthenticatedSummary(m.client,'period=today',()=>true);equal(!r.ok&&r.code,'forbidden');equal(m.calls(),0);}
 const switched=mock('owner',null,false,'00000000-0000-4000-8000-000000000099');const r=await readAuthenticatedSummary(switched.client,'period=today',scope=>statisticsPublishedForQa(raw,switched.client.supabaseUrl,scope));equal(!r.ok&&r.code,'not_published');equal(switched.calls(),0);
 for(const code of ['not_published','unauthenticated','forbidden']){const endpoint=compile('app/admin/(protected)/statistics/query/route.ts',{'next/server':{NextResponse:{json:(body:unknown,options:unknown)=>({body,options})}},'@/lib/statistics/summary-server':{getStatisticsSummary:async()=>({ok:false,code})}});const response=await endpoint.GET({nextUrl:{search:'period=today'}}) as {options:{status:number;headers:Record<string,string>}};equal(response.options.status,{not_published:404,unauthenticated:401,forbidden:403}[code]);equal(response.options.headers['Cache-Control'],'private, no-store, max-age=0');}
 const page=compile('app/admin/(protected)/statistics/page.tsx',{'next/navigation':{notFound:()=>{throw Error('NOT_FOUND');},redirect:()=>{throw Error('REDIRECT');}},'react/jsx-runtime':{jsx:()=>null,jsxs:()=>null},'@/components/admin/admin-page-layout':{},'@/components/admin/statistics/statistics-summary':{},'@/lib/statistics/summary-route-server':{statisticsRouteScope:async()=>({status:'not_published'})}});
 await assert.rejects(page.default(),/NOT_FOUND/);assertions++;
 fs.writeFileSync(dir+'tests.json',JSON.stringify({at:new Date().toISOString(),result:'PASS',assertions,scope:'Offline policy + principal/transport + actual HTTP server wrappers/route/page via SSR injection. No live QA/DB.'},null,2)+'\n');console.log(`PASS ${assertions} publication/security assertions`);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
