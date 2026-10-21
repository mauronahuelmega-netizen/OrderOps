import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { decodeStatisticsResponse } from './read';
import { decodeStatisticsSeriesResponse, readStatisticsSeries, StatisticsSeriesReadError } from './series-read';
import { instantMicros, inObservation, wallInstant, equalExposure, dateOffset, elapsedStepHours, seriesDelta } from './series-temporal';
import { indicators } from './quality';
import type { StatisticsSeriesReadyResponse } from './series-contracts';
import type { StatisticsReadClient } from './contracts';

const business='11111111-1111-4111-8111-111111111111';
const fixtureFile='lib/statistics/fixtures/series-responses.json';
const fixtures=JSON.parse(readFileSync(fixtureFile,'utf8')) as Record<string,StatisticsSeriesReadyResponse>;
let assertions=0;
const ok=(value:unknown)=>{assert.ok(value);assertions++;};
const same=(a:unknown,b:unknown)=>{assert.deepEqual(a,b);assertions++;};
const rejects=(operation:()=>unknown)=>{assert.throws(operation,StatisticsSeriesReadError);assertions++;};
for(const [name,fixture]of Object.entries(fixtures)) {
  const decoded=decodeStatisticsSeriesResponse(fixture,business);
  const legacy=decodeStatisticsResponse(fixture,business);
  const {series: _series,...plain}=decoded as StatisticsSeriesReadyResponse;
  same(plain,legacy.status==='ready'?(({series:_extra,...rest})=>rest)(legacy as StatisticsSeriesReadyResponse):legacy);
  if(name==='configuration_required')same(decoded.status,'configuration_required');
}
const negative=(mutate:(r:StatisticsSeriesReadyResponse)=>void)=>{
  const r=structuredClone(fixtures.complete);mutate(r);rejects(()=>decodeStatisticsSeriesResponse(r,business));
};
negative(r=>{r.series.version='broken' as never;});
negative(r=>{r.series.snapshot.revision='43';});
negative(r=>{r.series.snapshot.asOf='2026-10-14T12:00:00.000001Z';});
negative(r=>{r.series.points[1].key=r.series.points[0].key;});
negative(r=>{r.series.points[1].current!.interval.key=r.series.points[0].current!.interval.key;});
negative(r=>{r.series.points[1].comparisons.sales.absolute='40.01';});
negative(r=>{r.series.points[1].comparisons.sales.percentage='24.99';});
negative(r=>{r.series.points[1].comparisons.sales.percentageReason='no_base';});
negative(r=>{r.series.points[1].current!.metrics.sales.value=null;});
negative(r=>{r.series.points[1].current!.metrics.mainUnits.value='3.0';});
negative(r=>{r.series.points[1].current!.metrics.averageTicket.value='100.01';});
negative(r=>{r.series.points[1].current!.metrics.sales.unknownCount=-1;});
negative(r=>{r.series.points[1].current!.metrics.sales.knownCount=Number.MAX_SAFE_INTEGER+1;});
negative(r=>{r.series.previousRange!.endDate='2026-10-12';});
negative(r=>{r.series.points[1].mapping={kind:'date_offset',days:-1};});
negative(r=>{r.series.points[1].current!.interval.slices[0].end='2026-10-15T03:00:00Z';});
negative(r=>{r.series.points[1].current!.interval.slices[0].timezone='Fake/Zone';});
negative(r=>{r.series.points[1].current!.interval.slices[0].start='2026-02-30T03:00:00Z';});
negative(r=>{r.series.points[1].current!.interval.slices[0].end='2026-10-13T03:00:00.0000001Z';});
negative(r=>{r.series.points[1].current!.interval.slices[0].end='2026-10-13T03:00:00Z';});
negative(r=>{r.series.points[1].current!.interval.slices.push(r.series.points[1].current!.interval.slices[0]);});
negative(r=>{r.series.totalComparisons.sales.absolute='999.00';});
negative(r=>{r.series.totalAlignment={available:false,reason:'duration_mismatch'};});
negative(r=>{r.series.points.pop();});
negative(r=>{(r.series as unknown as Record<string,unknown>).businessId='foreign';});
negative(r=>{r.series.points=Array.from({length:201},(_,i)=>({...r.series.points[0],key:String(i)}));});
negative(r=>{r.series.points[0].alignment={available:false,reason:null};});
const without=structuredClone(fixtures.complete) as Partial<StatisticsSeriesReadyResponse>;delete without.series;
assert.throws(()=>decodeStatisticsSeriesResponse(without,business),e=>e instanceof StatisticsSeriesReadError&&e.code==='series_unavailable');assertions++;
assert.throws(()=>decodeStatisticsSeriesResponse(fixtures.complete,'foreign'));assertions++;

// Verified overnight session. Explicit correspondence, not indexes or labels.
const overnight=structuredClone(fixtures.complete);
overnight.period.startDate=overnight.period.endDate='2026-10-13';
overnight.period.comparable={startDate:'2026-10-12',endDate:'2026-10-12'};
overnight.period.granularity='hour';overnight.period.asOf='2026-10-14T04:00:00Z';
overnight.series.snapshot.asOf=overnight.period.asOf;overnight.series.previousRange=overnight.period.comparable;
overnight.series.resolution='hour';overnight.series.resolutionReason=null;
const currentSession='44444444-4444-4444-8444-444444444444', previousSession='55555555-5555-4555-8555-555555555555';
for(const [n,p]of overnight.series.points.entries()) {
  p.basis='session_elapsed';p.mapping={kind:'session_elapsed',ordinal:1,startSeconds:String(n*3600),endSeconds:String((n+1)*3600)};
  for(const side of ['current','previous'] as const) {
    const i=p[side]!.interval;i.startDate=i.endDate=side==='current'?'2026-10-13':'2026-10-12';
    i.slices=[{sessionId:side==='current'?currentSession:previousSession,timezone:overnight.timezone,commercialDate:i.startDate,
      start:`2026-10-${side==='current'?'14':'13'}T0${n+(side==='current'?1:0)}:00:00Z`,
      end:`2026-10-${side==='current'?'14':'13'}T0${n+(side==='current'?2:1)}:00:00Z`,endInclusive:n===1}];
  }
}
same(decodeStatisticsSeriesResponse(overnight,business).status,'ready');
const falseExposure=structuredClone(overnight);falseExposure.series.points[1].previous!.interval.slices[0].end='2026-10-13T02:30:00Z';
rejects(()=>decodeStatisticsSeriesResponse(falseExposure,business));
const falseEndpoint=structuredClone(overnight);falseEndpoint.series.points[1].previous!.interval.slices[0].endInclusive=false;
rejects(()=>decodeStatisticsSeriesResponse(falseEndpoint,business));
const forgedElapsed=structuredClone(overnight);
forgedElapsed.series.points[1].mapping={kind:'session_elapsed',ordinal:1,startSeconds:'3601',endSeconds:'7201'};
rejects(()=>decodeStatisticsSeriesResponse(forgedElapsed,business));
const reversed=structuredClone(overnight);reversed.series.points.reverse();
same(decodeStatisticsSeriesResponse(reversed,business).status,'ready');
// Physical microseconds and exact boundary partition.
same(instantMicros('2026-10-14T03:00:00.000001Z')-instantMicros('2026-10-14T03:00:00Z'),BigInt(1));
same(instantMicros('2026-10-14T00:00:00.123456-03:00'),instantMicros('2026-10-14T03:00:00.123456Z'));
ok(!inObservation('2026-10-14T02:00:00Z','2026-10-14T01:00:00Z','2026-10-14T02:00:00Z',false));
ok(inObservation('2026-10-14T02:00:00Z','2026-10-14T02:00:00Z','2026-10-14T03:00:00Z',true));
ok(!inObservation('2026-10-14T03:00:00.000001Z','2026-10-14T02:00:00Z','2026-10-14T03:00:00Z',true));
ok(equalExposure('2026-10-14T01:00:00Z','2026-10-14T05:30:00Z','2026-10-13T00:00:00Z','2026-10-13T04:30:00Z'));
ok(!equalExposure('2026-10-14T01:00:00Z','2026-10-14T05:30:00Z','2026-10-13T00:00:00Z','2026-10-13T06:00:00Z'));
same(wallInstant('2026-03-08','02:30:00','America/New_York').reason,'nonexistent_wall_time');
same(wallInstant('2026-11-01','01:30:00','America/New_York').reason,'ambiguous_wall_time');
same(wallInstant('2026-10-04','02:15:00','Australia/Lord_Howe').reason,'nonexistent_wall_time');
same(wallInstant('2026-04-05','01:45:00','Australia/Lord_Howe').reason,'ambiguous_wall_time');
same(wallInstant('2026-10-13','00:00:00','Asia/Kathmandu').instant,'2026-10-12T18:15:00.000Z');
ok(dateOffset('2024-02-28','2024-02-29','2024-02-26','2024-02-27',-2));
ok(dateOffset('2026-03-15','2026-04-02','2026-02-24','2026-03-14',-19));
ok(!dateOffset('2026-03-01','2026-03-31','2026-02-01','2026-02-28',-28));
same(elapsedStepHours(Array.from({length:200},()=>BigInt(3600000000))),null);
for(let lanes=1;lanes<200;lanes++) {
  const durations=Array.from({length:lanes},(_,n)=>BigInt(n+1)*BigInt(86400000000)+BigInt(1));
  const hours=elapsedStepHours(durations)!;const step=BigInt(hours)*BigInt(3600000000);
  ok(durations.reduce((n,d)=>n+Number((d+step-BigInt(1))/step),0)<=200);
}
const large=indicators([{sales:'99999999999999.99',mainUnits:1,reasons:[]}]);
const small=indicators([{sales:'0.01',mainUnits:1,reasons:[]}]);
same(seriesDelta(large.sales,small.sales,true,null).absolute,'99999999999999.98');
const zero=indicators([]);same(seriesDelta(large.sales,zero.sales,true,null).percentageReason,'no_base');
same(seriesDelta(zero.averageTicket,zero.averageTicket,true,null).reason,'empty_average');
same(seriesDelta(large.sales,small.sales,false,'duration_mismatch').absolute,null);
same(decodeStatisticsSeriesResponse(fixtures.unknown_amount,business).status,'ready');

async function run() {
  let calls=0;
  const client:StatisticsReadClient={rpc:async()=>{calls++;return{data:fixtures.complete,error:null};}};
  for(const role of ['operator','viewer','super_admin']) {await assert.rejects(readStatisticsSeries(client,{p_period:'this_week'},{businessId:business,role}));assertions++;}
  same(calls,0);
  for(const role of ['owner','manager','admin'])same((await readStatisticsSeries(client,{p_period:'this_week'},{businessId:business,role})).status,'ready');
  same(calls,3);
  writeFileSync('docs/estadisticas-v1/p03-a/pure-evidence.json',JSON.stringify({at:new Date().toISOString(),result:'PASS_PURE',assertions,fixtures:5,transport:'mock only',databaseConnections:0,scope:'Production decoder, temporal arithmetic, DST, quality and precision. SQL planner runtime is not emulated or claimed.'},null,2)+'\n');
  console.log(`PASS ${assertions} pure assertions; five synthetic fixtures; zero DB/API connections.`);
}
void run().catch(error=>{console.error(error);process.exitCode=1;});
