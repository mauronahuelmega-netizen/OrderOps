import assert from 'node:assert/strict';
import { mkdirSync,writeFileSync } from 'node:fs';
import fixtures from './fixtures/series-responses.json';
import { SUMMARY_PERIODS,parseSummaryPeriod,serializeSummaryPeriod,summaryPeriodKey } from './summary-period';
import { readAuthenticatedSummary,summaryFailure,type SummaryAuthenticatedClient,type SummaryResult } from './summary-transport';
import { decodeStatisticsSeriesResponse } from './series-read';
import { formatSummaryDecimal,presentStatisticsSummary,presentSummaryComparison,commercialReading } from './summary-presenter';
import { SummaryQueryController } from './summary-query';
const dir='docs/estadisticas-v1/p03-c';mkdirSync(dir,{recursive:true});
let assertions=0;
const same=(a:unknown,b:unknown)=>{assertions++;assert.deepEqual(a,b);};
const rejects=(fn:()=>unknown)=>{assertions++;assert.throws(fn);};
function readyFixture(payload:unknown){const decoded=decodeStatisticsSeriesResponse(payload,fixtures.complete.businessId);if(decoded.status!=='ready')throw new Error('fixture');return decoded;}
const data=readyFixture(fixtures.complete);
const scope={userId:'synthetic-user',businessId:data.businessId};
const search=serializeSummaryPeriod({preset:'custom',startDate:data.period.startDate,endDate:data.period.endDate});
const key=summaryPeriodKey(parseSummaryPeriod(search));
function mock(payload:unknown=fixtures.complete,role:unknown='owner',rpcError:{code:string;message:string}|null=null){
  let calls=0;const seen:unknown[]=[];
  const client:SummaryAuthenticatedClient={auth:{getUser:async()=>({data:{user:{id:scope.userId}},error:null})},
    from:name=>{same(name,'profiles');return {select:columns=>{same(columns,'business_id,role');return {eq:(column,id)=>{same([column,id],['id',scope.userId]);return {maybeSingle:async()=>({data:{business_id:scope.businessId,role},error:null})};}};}};},
    rpc:async(name,args)=>{calls++;seen.push({name,args});return {data:payload,error:rpcError};}};
  return {client,calls:()=>calls,seen};
}
same(SUMMARY_PERIODS.length,8);same(parseSummaryPeriod(''),{preset:'this_week'});
for(const p of SUMMARY_PERIODS){const value=p.value==='custom'?{preset:p.value,startDate:'2024-02-29',endDate:'2024-03-01'}:{preset:p.value};same(parseSummaryPeriod(serializeSummaryPeriod(value)),value);}
for(const bad of ['period=','period=other','period=today&period=yesterday','period=custom','period=custom&start=2024-02-30&end=2024-03-01','period=custom&start=2024-03-02&end=2024-03-01','period=today&start=2024-01-01'])rejects(()=>parseSummaryPeriod(bad));
same(new URLSearchParams(serializeSummaryPeriod({preset:'this_month'},'tab=products&point=abc')).get('tab'),'products');
same(formatSummaryDecimal('99999999999999999.99',true),'$ 99.999.999.999.999.999,99');
same(formatSummaryDecimal('-0.01',true,true),'-$ 0,01');same(formatSummaryDecimal('1.00',false,true),'+1');
same(presentSummaryComparison('sales',{available:true,reason:null,absolute:'1.00',percentage:null,percentageReason:'no_base'}).percentageText,'Sin variación porcentual calculable');
same(presentSummaryComparison('sales',{available:true,reason:null,absolute:'-0.01',percentage:'-0.10',percentageReason:null}).absoluteText,'-$ 0,01');
same(presentSummaryComparison('mainUnits',{available:true,reason:null,absolute:'0',percentage:'0.00',percentageReason:null}).direction,'unchanged');
const emptyMetric={value:'0.00',quality:'empty' as const,reasons:[],knownCount:0,unknownCount:0};
same(commercialReading({...data,metrics:{...data.metrics,sales:emptyMetric},previousMetrics:{...data.previousMetrics!,sales:emptyMetric},series:{...data.series,totalComparisons:{...data.series.totalComparisons,sales:{available:true,reason:null,absolute:'0.00',percentage:null,percentageReason:'no_base'}}}},'sales').state,'neutral');
const complete=presentStatisticsSummary(data);
same(complete.dataState,'complete');same(complete.kpis[0].valueText,'$ 200');same(complete.reading.state,'descriptive');same(complete.reading.evidence.comparison.percentageText,'+25%');
const partial=decodeStatisticsSeriesResponse(fixtures.unknown_amount,scope.businessId);if(partial.status!=='ready')throw new Error('partial');
const partialView=presentStatisticsSummary(partial);same(partialView.dataState,'partial');same(partialView.kpis[0].valueText,'$ 100');same(partialView.kpis[2].valueText,'No disponible');same(partialView.reading.state,'neutral');same(partialView.kpis[0].comparison.available,false);
const temporal=readyFixture(fixtures.partial_cut);same(presentStatisticsSummary(temporal).temporalPartial,true);
const missing=readyFixture(fixtures.no_comparison);same(presentStatisticsSummary(missing).series.every(p=>p.previous===null),true);
const reordered={...data,series:{...data.series,points:[...data.series.points].reverse()}};
same(presentStatisticsSummary(reordered).series.map(p=>p.key),reordered.series.points.map(p=>p.key));
same(presentStatisticsSummary(data,'mainUnits',data.series.points[0].key).reading.evidence.pointKey,data.series.points[0].key);
rejects(()=>presentStatisticsSummary(data,'sales','invented'));
async function run(){
  for(const role of ['owner','manager','admin']){const m=mock(fixtures.complete,role);same((await readAuthenticatedSummary(m.client,search)).ok,true);same(m.calls(),1);same(m.seen,[{name:'statistics_v1_summary',args:{p_period:'custom',p_start_date:data.period.startDate,p_end_date:data.period.endDate}}]);}
  for(const role of ['operator','viewer','super_admin',null,'']){const m=mock(fixtures.complete,role);same(await readAuthenticatedSummary(m.client,search),summaryFailure('forbidden'));same(m.calls(),0);}
  for(const [error,code] of [[{code:'57014',message:'private SQL timeout'},'timeout'],[{code:'22023',message:'STATISTICS_INVALID_RANGE'},'invalid_period'],[{code:'XX000',message:'private stack'},'query_failed']] as const){same(await readAuthenticatedSummary(mock(null,'owner',error).client,search),summaryFailure(code));}
  same(await readAuthenticatedSummary(mock({...fixtures.complete,businessId:'foreign'}).client,search),summaryFailure('invalid_response'));
  const legacy={...fixtures.complete} as Record<string,unknown>;delete legacy.series;same(await readAuthenticatedSummary(mock(legacy).client,search),summaryFailure('series_unavailable'));
  const unauthorized=mock();unauthorized.client.auth.getUser=async()=>({data:{user:null},error:null});same(await readAuthenticatedSummary(unauthorized.client,search),summaryFailure('unauthenticated'));same(unauthorized.calls(),0);
  const invalid=mock();same(await readAuthenticatedSummary(invalid.client,'period=wrong'),summaryFailure('invalid_period'));same(invalid.calls(),0);
  const authFailure=mock();authFailure.client.auth.getUser=async()=>{throw new Error('Unavailable Auth');};same(await readAuthenticatedSummary(authFailure.client,search),summaryFailure('query_failed'));same(authFailure.calls(),0);
  same(await readAuthenticatedSummary(mock().client,'period=today'),summaryFailure('invalid_response'));
  const malformed=mock({...fixtures.complete,series:{...fixtures.complete.series,unexpected:true}});same(await readAuthenticatedSummary(malformed.client,search),summaryFailure('invalid_response'));
  function deferred<T>(){let resolve!:(v:T)=>void;const promise=new Promise<T>(r=>{resolve=r;});return {promise,resolve};}
  const a=deferred<SummaryResult>(),b=deferred<SummaryResult>();let calls=0;
  const controller=new SummaryQueryController(scope,url=>{calls++;return parseSummaryPeriod(url).preset==='custom'?a.promise:b.promise;});
  const r1=controller.query(search),r2=controller.query(search+'&tab=products');await Promise.resolve();same(calls,1);same(controller.getSnapshot().status,'loading');
  const rb=controller.query('period=this_week');await Promise.resolve();same(calls,2);b.resolve({ok:true,scope,periodKey:summaryPeriodKey({preset:'this_week'}),data:decodeStatisticsSeriesResponse(fixtures.configuration_required,scope.businessId)});await rb;
  same(controller.present().status,'configuration_required');a.resolve({ok:true,scope,periodKey:key,data});await Promise.all([r1,r2]);same(controller.present().status,'configuration_required');
  const m=mock();const ready=new SummaryQueryController(scope,url=>readAuthenticatedSummary(m.client,url));await ready.query(search);same(m.calls(),1);
  const before=ready.getSnapshot();ready.selectMetric('mainUnits');ready.selectPoint(data.series.points[0].key);same(m.calls(),1);same(ready.getSnapshot()===before,false);same(ready.getSnapshot().selectedMetric,'mainUnits');
  await ready.query(search+'&metric=sales');same(m.calls(),1);await ready.query(search,true);same(m.calls(),2);
  const waiting=deferred<SummaryResult>();const old=new SummaryQueryController(scope,()=>waiting.promise);const p=old.query(search);old.setScope({...scope,userId:'another'});waiting.resolve({ok:true,scope,periodKey:key,data});await p;same(old.getSnapshot().status,'idle');
  const foreign=new SummaryQueryController(scope,async()=>({ok:true,scope:{...scope,businessId:'other'},periodKey:key,data}));await foreign.query(search);same(foreign.getSnapshot().status,'error');
  const failed=new SummaryQueryController(scope,async()=>summaryFailure('timeout'));await failed.query(search);same(failed.present().status,'error');same(failed.getSnapshot().selectedMetric,'sales');
  const wrongPeriod=new SummaryQueryController(scope,async()=>({ok:true,scope,periodKey:summaryPeriodKey({preset:'today'}),data}));await wrongPeriod.query('period=today');same(wrongPeriod.getSnapshot().status,'error');
  const thrown=new SummaryQueryController(scope,async()=>{throw new Error('Network failure');});await thrown.query(search);same(thrown.present().status,'error');
  const repeat=deferred<SummaryResult>();let repeatCalls=0;const back=new SummaryQueryController(scope,async url=>{repeatCalls++;return parseSummaryPeriod(url).preset==='custom'?repeat.promise:summaryFailure('timeout');});
  const qa=back.query(search);await Promise.resolve();await back.query('period=today');const qaAgain=back.query(search);await Promise.resolve();same(repeatCalls,2);repeat.resolve({ok:true,scope,periodKey:key,data});await Promise.all([qa,qaAgain]);same(back.getSnapshot().status,'ready');
  const destroyed=deferred<SummaryResult>();const c=new SummaryQueryController(scope,()=>destroyed.promise);const q=c.query(search);c.dispose();destroyed.resolve({ok:true,scope,periodKey:key,data});await q;same(c.getSnapshot().status,'idle');
  writeFileSync(dir+'/examples.json',JSON.stringify({complete,partial:partialView,temporalPartial:presentStatisticsSummary(temporal),comparisonUnavailable:presentStatisticsSummary(missing),timeout:failed.present(),configuration:controller.present()},null,2)+'\n');
  writeFileSync(dir+'/pure-evidence.json',JSON.stringify({result:'PASS',assertions,transport:'mock authenticated adapter; one RPC',databaseConnections:0,scope:'URL, exact presenter, deterministic reading, authorization, decoding, races, dedupe, scope invalidation, error states'},null,2)+'\n');
  console.log(`PASS ${assertions} P03-C assertions; zero DB/API connections.`);
}
void run().catch(error=>{console.error(error);process.exitCode=1;});
