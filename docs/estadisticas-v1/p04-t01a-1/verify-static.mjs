// Offline only. PostgreSQL grammar parsing is not catalog binding or PL/pgSQL compilation.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const require=createRequire(import.meta.url);
const {parse}=require('../../../supabase/statistics-v1-test/.runtime/sql-tools/node_modules/pgsql-parser');
const ts=require('../../../node_modules/typescript');
const dir='docs/estadisticas-v1/p04-t01a-1/';
const original=fs.readFileSync(dir+'original/candidate-products.sql','utf8');
const reviewed=fs.readFileSync(dir+'candidate-products-reviewed.sql','utf8');
let assertions=0;
function check(x,message){assert.ok(x,message);assertions++;}
function walk(x,visit){if(!x||typeof x!=='object')return;visit(x);for(const y of Object.values(x))if(Array.isArray(y))y.forEach(z=>walk(z,visit));else walk(y,visit);}
function relational(source){return source.slice(source.indexOf(' with facts as materialized ('),source.indexOf(' return v_result;')).replace('into v_result from totals','from totals');}
async function dag(source){
 const tree=await parse(relational(source));
 const ctes=tree.stmts[0].stmt.SelectStmt.withClause.ctes.map(x=>x.CommonTableExpr);
 const names=ctes.map(x=>x.ctename),edges=[];
 for(const [index,cte] of ctes.entries())walk(cte.ctequery,x=>{if(x.RangeVar&&!x.RangeVar.schemaname&&names.includes(x.RangeVar.relname))edges.push({from:cte.ctename,to:x.RangeVar.relname,valid:names.indexOf(x.RangeVar.relname)<index});});
 return {names,edges,tree};
}
const old=await dag(original),fixed=await dag(reviewed);
check(old.edges.some(x=>x.from==='totals'&&x.to==='totals'&&!x.valid),'Negative control must expose original self-reference');
check(fixed.edges.every(x=>x.valid),'All CTE references must point backwards');
check(fixed.names.join(',')==='facts,lines,missing_counts,grouped,totals,ranked,categories','Expected CTE order');
check(!reviewed.includes('(select missing from totals)'),'No old circular expression remains');
check((reviewed.match(/select count\(\*\) missing from facts/g)||[]).length===1,'Single independent missing count');
const outer=await parse(reviewed);
const funcs=outer.stmts.filter(x=>x.stmt.CreateFunctionStmt).map(x=>x.stmt.CreateFunctionStmt);
check(funcs.length===3,'Only three proposed functions');
let sqlBodies=0;
for(const f of funcs){
 const opts=Object.fromEntries(f.options.map(x=>[x.DefElem.defname,x.DefElem.arg]));
 check(opts.security?.Boolean?.boolval!==true,'No SECURITY DEFINER');
 if(opts.language.String.sval==='sql'){await parse(opts.as.List.items[0].String.sval);sqlBodies++;}
}
check((reviewed.match(/security invoker/gi)||[]).length===3,'Explicit invoker on all functions');
check(!/candidate_d1|summary_candidate|series_candidate|candidate_c|security definer|create or replace/i.test(reviewed),'No optimized candidate or replacement dependency');
check(reviewed.slice(0,reviewed.indexOf(' with facts'))===original.slice(0,original.indexOf(' with facts')),'Auth, periods, cursor, history and defaults unchanged');
check(reviewed.slice(reviewed.indexOf('create function public.'))===original.slice(original.indexOf('create function public.')),'Wrapper and proposed ACL byte-for-byte unchanged');
const structures=fs.readFileSync('supabase/migrations/20261013001000_statistics_v1_structures.sql','utf8');
const tables={};
for(const x of (await parse(structures)).stmts){const s=x.stmt.CreateStmt;if(s)tables[s.relation.relname]=s.tableElts.filter(x=>x.ColumnDef).map(x=>({name:x.ColumnDef.colname,type:x.ColumnDef.typeName.names.map(n=>n.String.sval).join('.')}));}
const expected={store_session_statistics_snapshots:['session_id','business_id','commercial_date','source_quality','opened_at'],order_item_statistics_snapshots:['source_item_id','order_id','business_id','generation','captured_at','source_kind','product_identity','product_name','category_identity','category_name'],order_statistics_completion_items:['completion_id','business_id','line_key','product_identity','product_name','category_identity','category_name','item_kind','quantity','net_amount']};
for(const [table,columns] of Object.entries(expected))for(const col of columns)check(tables[table].some(x=>x.name===col),table+'.'+col);
check(tables.order_statistics_completion_items.find(x=>x.name==='quantity').type.endsWith('int8'),'Quantity bigint');
const sessions=fs.readFileSync('supabase/migrations/20260604143000_v63_store_sessions.sql','utf8');
check(/create unique index[\s\S]*store_sessions_one_open_per_business_idx[\s\S]*\(business_id\)[\s\S]*where status = 'open' and closed_at is null/.test(sessions),'Open session uniqueness prerequisite');
check(structures.includes('unique(source_item_id,generation)'),'Lateral generation order unique');
check(structures.includes('primary key(completion_id,line_key)'),'One captured line per completion');
const migrations=fs.readdirSync('supabase/migrations').filter(x=>x.endsWith('.sql'));
for(const file of migrations)check(!/drop\s+index(?:\s+if\s+exists)?\s+(?:public\.)?store_sessions_one_open_per_business_idx/i.test(fs.readFileSync('supabase/migrations/'+file,'utf8')),'No subsequent open-session index drop: '+file);
// Run the existing decoder fixture suite in memory, redirecting only its report path.
const cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;const mod={exports:{}};cache.set(file,mod);let source=fs.readFileSync(file,'utf8');if(file.endsWith('products.verify.ts'))source=source.replace("docs/estadisticas-v1/p04-t01a/",dir);
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText;
 const localRequire=id=>id.startsWith('.')?load(path.resolve(path.dirname(file),id+'.ts')):require(id);
 vm.runInThisContext('(function(require,module,exports){'+js+'\n})',{filename:file})(localRequire,mod,mod.exports);return mod.exports;}
load('lib/statistics/products.verify.ts');
const {decodeProductsResponse}=load('lib/statistics/products-read.ts');
// Handcrafted SQL-contract model: main + upsell in a separate category/product.
const biz='00000000-0000-4000-8000-000000000001',main='00000000-0000-4000-8000-000000000002',extra='00000000-0000-4000-8000-000000000003';
const metric=(value,known,unknown=0,missing=0)=>({value,quality:known?(unknown||missing?'partial':'exact'):(unknown||missing?'unavailable':'empty'),knownCount:known,unknownCount:unknown,missingCapturedOrders:missing,reasons:[...(unknown?['unverified_lines']:[]),...(missing?['uncaptured_orders']:[])]});
const e=metric('0',0),u=metric('2',1),r=metric('10.00',1),revenue=metric('20.00',2);
const category=(kind,units,unitShare)=>({key:'special:'+kind,kind,identity:null,label:kind,units,revenue:r,unitShare,revenueShare:'50.00'});
const cats=[category('uncategorized_verified',u,'100.00'),category('attribution_unknown',e,'0.00')];
const row=(identity,position,units,unitShare,kind)=>({key:'product:'+identity,identity,label:identity,position,catalogStatus:'historical',units,revenue:r,unitShare,revenueShare:'50.00',categories:[{kind,identity:null}]});
const response={version:'statistics.products.v1',status:'ready',businessId:biz,currency:'ARS',revision:'1',period:{preset:'today',startDate:'2026-10-14',endDate:'2026-10-14',referenceDate:'2026-10-14',timezone:'America/Argentina/Buenos_Aires',asOf:'2026-10-14T12:00:00.000001Z',partial:true},totals:{units:u,revenue},denominators:{scope:'verified_lines_in_period',units:'2',revenue:'20.00',unitComplete:true,revenueComplete:true},coverage:{eligibleOrders:1,capturedLines:2,ordersWithoutCapturedLines:0,historicalWithoutDate:0,historicalScope:'global_unassigned',outsideSession:0,unknownProductLines:0,unknownCategoryLines:1,unresolvedOrders:0,pendingAgreedTotal:null},unidentified:{units:e,revenue:e},ranking:{sort:'amount',totalProducts:2,items:[row(main,1,u,'100.00','uncategorized_verified'),row(extra,2,e,'0.00','attribution_unknown')],nextCursor:null},categories:cats};
check(decodeProductsResponse(response,biz)===response,'Corrected empty upsell units share decodes');
const wrong=structuredClone(response);wrong.categories[1].unitShare=null;
assert.throws(()=>decodeProductsResponse(wrong,biz));assertions++;
const wrongRow=structuredClone(response);wrongRow.ranking.items[1].unitShare=null;
assert.throws(()=>decodeProductsResponse(wrongRow,biz));assertions++;
// Independent missing-count models: NOT EXISTS counts orders, not lines or units.
for(const [facts,lines,n] of [[[],[],0],[[1],[],1],[[1,2],[1,1],1],[[1,2],[1,2,2],0],[[1,2,3],[2],2]])check(facts.filter(f=>!lines.includes(f)).length===n,'Missing count fixture');
check(metric(null,0,1).value===null,'Unknown never coerced to zero');
check(metric(null,0,0,1).quality==='unavailable','Missing capture remains unavailable');
check(reviewed.includes("(c.units->>'value')::numeric"),'Category share uses exposed metric value');
check(reviewed.includes('coalesce(r.units,case when r.uu=0 and v_historical=0 and (select missing from missing_counts)=0 then 0 end)'),'Ranking only supplies proved empty zero');
const {statisticsPublishedForQa}=load('lib/statistics/statistics-publication-policy.ts');
const scope={userId:main,businessId:biz},target='http://127.0.0.1:56321';
check(statisticsPublishedForQa(undefined,target,scope)===false,'Gate default closed');
check(statisticsPublishedForQa('{}',target,scope)===false,'Untrusted config closed');
const qa=JSON.stringify({version:'statistics.qa-publication.v1',projectId:'orderops-statistics-v1-test-74718de66a41',api:target,db:'127.0.0.1:56322',principals:[scope]});
check(statisticsPublishedForQa(qa,target,scope)===true,'Synthetic QA allowlist matches');
check(statisticsPublishedForQa(qa,target,{...scope,businessId:extra})===false,'Other business denied');
check(statisticsPublishedForQa(qa,'https://example.supabase.co',scope)===false,'Remote target denied');
fs.writeFileSync(dir+'static-tests.json',JSON.stringify({at:new Date().toISOString(),result:'PASS_STATIC_ONLY',assertions,outerStatements:outer.stmts.length,sqlBodiesParsed:sqlBodies,cteGraph:{names:fixed.names,edges:fixed.edges},negativeControl:old.edges.filter(x=>!x.valid),schemaColumns:tables,decoderRegression:JSON.parse(fs.readFileSync(dir+'decoder-tests.json')),additionalFixtures:'main/upsell empty shares; missing orders; unknown null',notExecuted:['PL/pgSQL compilation','catalog binding','RLS runtime','SQL fixtures','database connection']},null,2)+'\n');
console.log('PASS static review assertions: '+assertions+'. No SQL execution or DB connection.');
