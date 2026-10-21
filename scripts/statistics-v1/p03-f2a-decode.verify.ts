import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {decodeStatisticsResponse} from '../../lib/statistics/read';
import {decodeStatisticsSeriesResponse} from '../../lib/statistics/series-read';
import fixtures from '../../lib/statistics/fixtures/series-responses.json';
type Pair={expectedBusinessId:string;original:unknown;candidate:unknown};
const fixtureMode=process.argv[2]==='--fixtures';
let pairs:Pair[];
if(fixtureMode)pairs=[{expectedBusinessId:fixtures.complete.businessId,original:fixtures.complete,candidate:structuredClone(fixtures.complete)}];
else{
 const file=resolve(process.argv[2]??'');assert.ok(relative(process.cwd(),file)&&!relative(process.cwd(),file).startsWith('..'),'Owned exported-pairs path required');
 pairs=JSON.parse(readFileSync(file,'utf8')) as Pair[];
}
assert.ok(Array.isArray(pairs)&&pairs.length>0);
for(const pair of pairs){
 assert.ok(typeof pair.expectedBusinessId==='string'&&pair.expectedBusinessId);
 assert.deepEqual(pair.candidate,pair.original,'Exact complete JSON; no excluded fields or array normalization');
 decodeStatisticsSeriesResponse(pair.original,pair.expectedBusinessId);decodeStatisticsSeriesResponse(pair.candidate,pair.expectedBusinessId);
 const {series:_originalSeries,...originalBase}=pair.original as Record<string,unknown>;
 const {series:_candidateSeries,...candidateBase}=pair.candidate as Record<string,unknown>;
 void _originalSeries;void _candidateSeries;
 decodeStatisticsResponse(originalBase,pair.expectedBusinessId);decodeStatisticsResponse(candidateBase,pair.expectedBusinessId);
}
if(fixtureMode){assert.throws(()=>decodeStatisticsSeriesResponse(fixtures.complete,'foreign-business'));writeFileSync('docs/estadisticas-v1/p03-f2a/decoder-tests.json',JSON.stringify({result:'PASS',mode:'Existing synthetic fixtures only; candidate SQL NOT executed',pairs:pairs.length,foreignTenantRejected:true},null,2));}
console.log(`PASS decoder/exact JSON checks (${fixtureMode?'offline synthetic fixture':'exported same-snapshot pairs'})`);
