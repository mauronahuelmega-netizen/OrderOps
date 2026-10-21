/** Decode already captured synthetic HTTP responses offline; no connections or credentials. */
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { decodeStatisticsSeriesResponse } from './series-read';
const responses=JSON.parse(readFileSync('supabase/statistics-v1-test/.runtime/p03-b-api-contract.local.json','utf8')) as {status:number;businessId:string;response:unknown}[];
let decoded=0;
for(const item of responses.filter(r=>r.status===200)){
  assert.equal(decodeStatisticsSeriesResponse(item.response,item.businessId).status,'ready');decoded++;
}
assert.equal(decoded,6);
writeFileSync('docs/estadisticas-v1/p03-b/api-decoder.json',JSON.stringify({result:'PASS',decodedSyntheticHttpResponses:decoded,scope:'strict production decoder on real isolated HTTP JSON',connectionsThisCheck:0},null,2)+'\n');
console.log('PASS strict decoder: six real isolated HTTP responses decoded offline.');
