import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {verifyStatisticsPrincipal} from './summary-principal';
import {readAuthenticatedSummary,type SummaryAuthenticatedClient} from './summary-transport';
import {hasAdminPermission,getAdminPermissions} from '../admin/permissions';
import {getAdminNavItemsForRole,isAdminNavItemFeatureEnabled,adminNavItems} from '../../components/admin/admin-nav-config';
import fixtures from './fixtures/series-responses.json';
import ts from 'typescript';
import vm from 'node:vm';
async function main() {
let assertions=0;
const same=(a:unknown,b:unknown)=>{assertions++;assert.deepEqual(a,b);};
const compile=(source:string,imports:Record<string,unknown>)=>{
 const mod={exports:{}};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:mod.exports,module:mod,require:(id:string)=>imports[id]??(()=>{throw Error(id)})()});return mod.exports as Record<string,(...args:unknown[])=>unknown>;
};
const old=compile(readFileSync('docs/estadisticas-v1/p03-e0/base/lib/admin/permissions.ts.txt','utf8'),{});
for(const role of ['owner','manager','admin','operator','viewer','super_admin'] as const){
 same(hasAdminPermission(role,'viewStatistics'),['owner','manager','admin'].includes(role));
 same(JSON.stringify(getAdminPermissions(role)),JSON.stringify(old.getAdminPermissions(role)));
 same(getAdminNavItemsForRole(role).some(i=>i.href==='/admin/statistics'),false);
}
same(isAdminNavItemFeatureEnabled(adminNavItems.find(i=>i.href==='/admin/statistics')!,null,false),false);
function mock(role:unknown,business:unknown=fixtures.complete.businessId,authError:unknown=null,profileError:unknown=null,missing=false){
 let calls=0;const ids:string[]=[];
 const client:SummaryAuthenticatedClient={auth:{getUser:async()=>({data:{user:{id:'synthetic-user'}},error:authError})},from:()=>({select:()=>({eq:(_column,id)=>{ids.push(id);return {maybeSingle:async()=>({data:missing?null:{business_id:business,role},error:profileError})};}})}),rpc:async()=>{calls++;return {data:fixtures.complete,error:null};}};
 return {client,ids,calls:()=>calls};
}
for(const role of ['owner','manager','admin',null,undefined,'','unknown','operator','viewer','super_admin']){
 const m=mock(role);const expected=['owner','manager','admin'].includes(String(role))?'allowed':'forbidden';
 same((await verifyStatisticsPrincipal(m.client)).status,expected);
 const result=await readAuthenticatedSummary(m.client,`period=custom&start=${fixtures.complete.period.startDate}&end=${fixtures.complete.period.endDate}&businessId=foreign`);
 same(result.ok,expected==='allowed');same(m.calls(),expected==='allowed'?1:0);same(m.ids.every(id=>id==='synthetic-user'),true);
}
for(const business of [null,undefined,'', ' ', 17]){
 const m=mock('owner');m.client.from=()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{business_id:business,role:'owner'},error:null})})})});
 same((await verifyStatisticsPrincipal(m.client)).status,'forbidden');
}
same((await verifyStatisticsPrincipal(mock('owner',undefined,null,null,true).client)).status,'forbidden');
for(const error of [{status:401},{status:403},{name:'AuthSessionMissingError'},{status:400,code:'validation_failed',message:'Refresh token is not valid'},{code:'refresh_token_not_found'}]){
 const m=mock('owner',undefined,error);same((await verifyStatisticsPrincipal(m.client)).status,'unauthenticated');same((await readAuthenticatedSummary(m.client,'period=today')).ok,false);same(m.calls(),0);
}
same((await verifyStatisticsPrincipal(mock('owner',undefined,{status:500}).client)).status,'error');
same((await verifyStatisticsPrincipal(mock('owner',undefined,null,{code:'network'}).client)).status,'error');
// Each request re-reads the profile; a tenant switch cannot keep a former principal.
const m=mock('owner');let business=fixtures.complete.businessId;
m.client.from=()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{business_id:business,role:'owner'},error:null})})})});
const a=await verifyStatisticsPrincipal(m.client);business='synthetic-business-b';const b=await verifyStatisticsPrincipal(m.client);
same(a.status==='allowed'&&a.scope.businessId,fixtures.complete.businessId);same(b.status==='allowed'&&b.scope.businessId,business);
const foreign=await readAuthenticatedSummary(m.client,`period=custom&start=${fixtures.complete.period.startDate}&end=${fixtures.complete.period.endDate}`);same(foreign.ok,false);
// Exercise actual server wrappers and endpoint with injected SSR, never a real DB.
const route=compile(readFileSync('lib/statistics/summary-route-server.ts','utf8'),{'server-only':{},'@/lib/supabase/server':{createSupabaseServerClient:async()=>mock(null).client},'./summary-principal':{verifyStatisticsPrincipal}});
same((await route.statisticsRouteScope() as {status:string}).status,'forbidden');
const endpoint=compile(readFileSync('app/admin/(protected)/statistics/query/route.ts','utf8'),{'next/server':{NextResponse:{json:(body:unknown,options:unknown)=>({body,options})}},'@/lib/statistics/summary-server':{getStatisticsSummary:(search:string)=>readAuthenticatedSummary(mock(null).client,search)}});
const denied=await endpoint.GET({nextUrl:{search:'period=today'}}) as {options:{status:number;headers:Record<string,string>}};
same(denied.options.status,403);same(denied.options.headers['Cache-Control'],'private, no-store, max-age=0');same(denied.options.headers.Vary,'Cookie');
mkdirSync('docs/estadisticas-v1/p03-e1',{recursive:true});
writeFileSync('docs/estadisticas-v1/p03-e1/security-tests.json',JSON.stringify({at:new Date().toISOString(),result:'PASS',assertions,scope:'Offline verified principal, transport, actual server route/endpoint with SSR injection, raw roles, tenant switch, fail-closed, navigation and previous permissions'},null,2));
console.log(`PASS ${assertions} security/navigation assertions`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
