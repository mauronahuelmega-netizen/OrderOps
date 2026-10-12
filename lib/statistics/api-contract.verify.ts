import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { decodeStatisticsResponse } from './read';
const cases: Array<{status:number;businessId:string;response:unknown}> = JSON.parse(readFileSync('supabase/statistics-v1-test/.runtime/api-contract.local.json','utf8'));
let verified=0;
for(const item of cases)if(item.status===200){const decoded=decodeStatisticsResponse(item.response,item.businessId);assert.equal(decoded.status,'ready');verified++;}
assert.equal(verified,6);
console.log('PASS: six actual isolated RPC responses satisfy the owned TypeScript runtime decoder. No database calls.');
