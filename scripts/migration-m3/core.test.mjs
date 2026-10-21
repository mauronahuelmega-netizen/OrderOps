import test from 'node:test';
import assert from 'node:assert/strict';
import { canonical, cents, money, hash, id, makeSnapshot, profile, validateSnapshot, sourceOrderTruth } from './core.mjs';
import { synthetic } from './synthetic.mjs';
import { transform } from './transform.mjs';
import { assertLocalUrl } from './database.mjs';
import { assertSourceLocal, assertAuthorizedRealSource, REAL_SOURCE_WORKSPACE, exportSnapshot, expectedPolicyExpression, verifySourcePolicies } from './exporter.mjs';
import { TABLES } from './core.mjs';

test('source RLS requires the exact 28 SELECT policies, including restrictive tenant caps',()=>{
  const policies=TABLES.flatMap(tablename=>[['select','PERMISSIVE'],['tenant_cap','RESTRICTIVE']].map(([prefix,permissive])=>({tablename,policyname:`m3_source_reader_${prefix}_${tablename}`,permissive,roles:'{m3_source_reader}',cmd:'SELECT',qual:expectedPolicyExpression(tablename),with_check:null})));
  const rls=TABLES.map(table_name=>({table_name,enabled:true,forced:false}));
  assert.equal(verifySourcePolicies(policies,rls).policy_count,28);
  for(const change of [p=>p.pop(),p=>p.push({...p[0]}),p=>p[0].roles='{public}',p=>p[0].cmd='ALL',p=>p[0].qual+=' OR true',p=>p[1].permissive='PERMISSIVE']){const altered=structuredClone(policies);change(altered);assert.throws(()=>verifySourcePolicies(altered,rls),/POLICIES_MISMATCH/);}
  assert.throws(()=>verifySourcePolicies(policies,rls.map(r=>({...r,enabled:false}))),/POLICIES_MISMATCH/);
});

const changed=(mutate)=>{const f=synthetic();mutate(f);f.snapshot=makeSnapshot(f.snapshot.tables,f.snapshot.manifest);return f;};
test('approved void evidence-only creates no target operation or monetary entries',()=>{
  const f=synthetic(),voidOp={...f.snapshot.tables.operations[0],id:id('void-evidence-test'),operation_type:'void',client_request_id:id('void-evidence-request')};
  f.snapshot.tables.operations.push(voidOp);f.config.operationDecisions={[voidOp.id]:{rule:'LEGACY_VOID_PRESERVE_EVIDENCE_ONLY'}};
  f.snapshot=makeSnapshot(f.snapshot.tables,f.snapshot.manifest);
  const d=transform(f.snapshot,f.config),e=d.evidence.find(e=>e.source_table==='operations'&&e.source_id===voidOp.id);
  assert.equal(e.target_id,null);assert.equal(e.rule,'LEGACY_VOID_PRESERVE_EVIDENCE_ONLY');
  assert.equal(d.rows.finance_operations.length,f.snapshot.tables.operations.length-1);
  assert.equal(d.rows.finance_transaction_entries.length,f.snapshot.tables.transaction_entries.length);
});
test('synthetic snapshot is immutable, complete and deterministic',()=>{const a=synthetic(),b=synthetic();assert.equal(canonical(a),canonical(b));assert.equal(validateSnapshot(a.snapshot),a.snapshot);assert.equal(profile(a.snapshot,a.config).blocked,false);assert.equal(transform(a.snapshot,a.config).dataset_hash,transform(b.snapshot,b.config).dataset_hash);});
test('snapshot tampering fails',()=>{const f=synthetic();f.snapshot.tables.funds[0].name='changed';assert.throws(()=>validateSnapshot(f.snapshot),/HASH/);});
test('money is exact decimal text, including maximum scale',()=>{assert.equal(money(cents('999999999999.99')),'999999999999.99');assert.equal(money(cents('0.10')+cents('0.20')),'0.30');for(const bad of [0.1,'1.001','NaN','1e2'])assert.throws(()=>cents(bad));});
test('UUIDv5 is stable and namespaced',()=>{assert.match(id('orders','x'),/^[a-f0-9-]{14}5/);assert.equal(id('orders','x'),id('orders','x'));assert.notEqual(id('funds','x'),id('orders','x'));});
test('every source row is classified exactly once; no actor is fabricated',()=>{const f=synthetic(),d=transform(f.snapshot,f.config);assert.equal(d.profile.classification.length,Object.values(f.snapshot.tables).reduce((n,r)=>n+r.length,0));assert.equal(d.rows.profiles,undefined);assert.ok(d.rows.finance_operations.every(o=>o.created_by===null));assert.ok(d.evidence.some(e=>e.source_actor_id===f.snapshot.tables.profiles[0].id));});
test('unknown order fields remain NULL; contract does not become technical total',()=>{const f=synthetic(),d=transform(f.snapshot,f.config);assert.ok(d.rows.orders.every(o=>o.phone===null&&o.delivery_date===null&&o.delivery_method===null&&o.total_price===null&&o.composition_status==='legacy_unknown'));assert.equal(d.rows.order_items,undefined);assert.ok(d.rows.order_financials.some(o=>o.agreed_total===null));});
test('cash external collection and internal coverage count once',()=>{const f=synthetic(),truth=sourceOrderTruth(f.snapshot.tables,f.keys.cashOrder),d=transform(f.snapshot,f.config);assert.equal(truth.paid,4000n);assert.equal(truth.committed,4000n);assert.equal(truth.variance,0n);const orderId=d.crosswalk.find(c=>c.source_table==='orders'&&c.source_id===f.keys.cashOrder).target_id;const tids=d.rows.finance_transactions.filter(t=>t.order_id===orderId);assert.equal(tids.length,2);assert.equal(new Set(tids.map(t=>t.operation_id)).size,1);});
test('historical coverage is not external income and explicit release is preserved',()=>{const f=synthetic();assert.equal(sourceOrderTruth(f.snapshot.tables,f.keys.hist).paid,3000n);assert.equal(sourceOrderTruth(f.snapshot.tables,f.keys.delivered).released,10000n);const d=transform(f.snapshot,f.config);assert.equal(d.rows.finance_transaction_entries.length,f.snapshot.tables.transaction_entries.length);});
test('legacy reconciliation remains evidence, not invented canonical cutoff',()=>{const f=synthetic(),d=transform(f.snapshot,f.config);assert.equal(d.rows.finance_reconciliations,undefined);assert.ok(d.evidence.some(e=>e.source_table==='reconciliations'&&e.target_id===null));});
for(const [label,code,mutate] of [
  ['orphan','ORPHAN_FOREIGN_KEY',f=>{f.snapshot.tables.transaction_entries[0].fund_id=id('missing');}],
  ['duplicate','DUPLICATE_OR_MISSING_ID',f=>{f.snapshot.tables.funds.push({...f.snapshot.tables.funds[0]});}],
  ['tenant','TENANT_MISMATCH',f=>{f.snapshot.tables.transactions[0].workspace_id=null;}],
  ['request','DUPLICATE_REQUEST_IDENTITY',f=>{f.snapshot.tables.operations[1].client_request_id=f.snapshot.tables.operations[0].client_request_id;}],
  ['actor','ORPHAN_FOREIGN_KEY',f=>{f.snapshot.tables.operations[0].created_by=id('missing-actor');}],
  ['time','MISSING_HISTORICAL_TIMESTAMP',f=>{f.snapshot.tables.transactions[0].occurred_at=null;}],
  ['decision','ORDER_LIFECYCLE_DECISION_REQUIRED',f=>{delete f.config.orderDecisions[f.keys.unpaid];}],
  ['protection','SOURCE_PROTECTION_VARIANCE',f=>{f.snapshot.tables.transaction_entries.find(e=>e.fund_id===f.snapshot.tables.funds.find(x=>x.order_id===f.keys.partial).id).amount='20.00';f.snapshot.tables.funds.find(x=>x.order_id===f.keys.partial).active=false;}],
  ['direct available','LEGACY_DIRECT_AVAILABLE_ORDER_PAYMENT',f=>{const t=f.snapshot.tables.transactions.find(t=>t.order_id===f.keys.partial);f.snapshot.tables.transaction_entries.find(e=>e.transaction_id===t.id).fund_id=f.keys.operating;}],
])test(`${label} anomaly is explicit and blocks transformation`,()=>{const f=changed(mutate),p=profile(f.snapshot,f.config);assert.ok(p.issues.some(i=>i.code===code),canonical(p.issues));assert.equal(p.blocked,true);assert.throws(()=>transform(f.snapshot,f.config),/PROFILE_BLOCKED/);});
test('source/target hosted and wrong-port guards fail before connection',()=>{for(const u of ['postgres://user:secret@example.com:54322/postgres','postgres://u:p@127.0.0.1:54332/postgres'])assert.throws(()=>assertLocalUrl(u));assert.throws(()=>assertSourceLocal('postgres://u:p@legacy.supabase.co:5432/postgres'),/AUTHORIZATION/);assert.throws(()=>assertSourceLocal('postgres://u:p@127.0.0.1:54322/postgres'));});
test('authorized session pooler identity is exact and cannot authorize a target',()=>{
  const url='postgresql://m3_source_reader.kvqhlnzoprwwhidfkrfi@aws-0-us-west-2.pooler.supabase.com:5432/postgres';
  assert.doesNotThrow(()=>assertAuthorizedRealSource(url,REAL_SOURCE_WORKSPACE));
  for(const wrong of [url.replace(':5432',':6543'),url.replace('m3_source_reader','postgres'),url.replace('us-west-2','us-east-1'),url.replace('/postgres','/other'),url.replace('kvqhlnzoprwwhidfkrfi','wrongproject')])assert.throws(()=>assertAuthorizedRealSource(wrong,REAL_SOURCE_WORKSPACE));
  assert.throws(()=>assertLocalUrl(url));
});
test('wrong real-source role aborts before opening export transaction or reading tables',async()=>{
  const calls=[];const client={query:async(sql)=>{calls.push(sql);return {rows:[{role:'postgres',session_role:'postgres',database:'postgres',default_readonly:'on'}]};}};
  await assert.rejects(()=>exportSnapshot(client,{workspaceId:REAL_SOURCE_WORKSPACE,sourceId:'kvqhlnzoprwwhidfkrfi',realSource:true}),/IDENTITY_FAILED/);
  assert.equal(calls.length,1);assert.ok(!calls[0].includes('public.'));
});
test('exporter establishes READ ONLY and rolls back missing source schema',async()=>{const calls=[];const client={query:async(sql)=>{calls.push(sql);if(sql.includes('current_setting'))return {rows:[{readonly:'on',isolation:'repeatable read',exported_at:'2026-09-30T12:00:00Z'}]};return {rows:[]};}};await assert.rejects(()=>exportSnapshot(client,{workspaceId:id('workspace'),sourceId:'synthetic'}),/SOURCE_SCHEMA_OBJECT_MISSING/);assert.equal(calls[0],'begin isolation level repeatable read read only');assert.equal(calls.at(-1),'rollback');assert.ok(!calls.some(sql=>/insert|update|delete|alter|truncate/i.test(sql)));});
