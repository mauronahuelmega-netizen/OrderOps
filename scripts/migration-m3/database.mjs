import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { canonical, cents, hash, money, sourceBalances, sourceOrderTruth } from './core.mjs';

export const ROOT=fileURLToPath(new URL('../../',import.meta.url));
// Existing pg dependency is dev tooling only; never imported by either app runtime.
const require=createRequire(path.join(ROOT,'../majo-pasteleria-caja/package.json'));
const {Client}=require('pg');
export function assertLocalUrl(raw, port='54322') {
  const u=new URL(raw);
  if(!['localhost','127.0.0.1','[::1]'].includes(u.hostname)||u.port!==port||u.pathname!=='/postgres')throw Error('M3_LOCAL_TARGET_REQUIRED');
  return u;
}
export function localStatus() {
  const r=spawnSync('supabase',['status','-o','json'],{cwd:ROOT,encoding:'utf8',shell:false});
  if(r.status!==0)throw Error('ORDEROPS_LOCAL_STATUS_REQUIRED');
  const s=JSON.parse(r.stdout.slice(r.stdout.indexOf('{')));
  if(s.API_URL!=='http://127.0.0.1:54321')throw Error('ORDEROPS_LOCAL_API_REQUIRED');
  assertLocalUrl(s.DB_URL);
  return s;
}
export function resetLocal() {
  localStatus();
  const r=spawnSync(process.platform==='win32'?'npx.cmd':'npx',['--yes','supabase@2.119.0','db','reset','--local','--no-seed'],{cwd:ROOT,stdio:'inherit',shell:process.platform==='win32'});
  if(r.status!==0)throw Error('LOCAL_RESET_FAILED');
}
export async function localClient() {
  const status=localStatus();
  const client=new Client({connectionString:status.DB_URL});
  await client.connect();
  const r=await client.query("select current_user, inet_server_addr()::text addr, current_database() db");
  if(r.rows[0].current_user!=='postgres'||r.rows[0].db!=='postgres'){await client.end();throw Error('LOCAL_IMPORT_ROLE_REQUIRED');}
  return client;
}
const ORDER=['finance_accounts','finance_categories','orders','order_financials','finance_funds','finance_operations','finance_transactions','finance_transaction_entries','finance_audit_events'];
async function insert(client,table,row) {
  if(!/^[a-z_]+(?:\.[a-z_]+)?$/.test(table)||Object.keys(row).some(k=>!/^[a-z_]+$/.test(k)))throw Error('UNSAFE_SQL_IDENTIFIER');
  const keys=Object.keys(row),values=keys.map(k=>typeof row[k]==='object'&&row[k]!==null?JSON.stringify(row[k]):row[k]);
  await client.query(`insert into ${table} (${keys.join(',')}) values (${keys.map((_,i)=>`$${i+1}`).join(',')})`,values);
}
export async function importDataset(client,dataset,{faultAfter=null}={}) {
  const {dataset_hash,...body}=dataset;
  if(hash(body)!==dataset_hash)throw Error('DATASET_HASH_MISMATCH');
  if(dataset.profile.blocked)throw Error('BLOCKED_SOURCE_NOT_IMPORTABLE');
  await client.query('begin isolation level serializable');
  try {
    await client.query("select pg_advisory_xact_lock(hashtextextended('m3-local-import',0))");
    const existing=await client.query('select dataset_hash from migration_private.runs where id=$1',[dataset.run_id]);
    if(existing.rowCount){
      if(existing.rows[0].dataset_hash!==dataset_hash)throw Error('IMPORT_HASH_CONFLICT');
      await client.query('commit');return {idempotent:true};
    }
    for(const t of ['businesses','orders','finance_operations','finance_transactions','finance_transaction_entries','finance_reconciliations'])if(Number((await client.query(`select count(*) from public.${t}`)).rows[0].count)!==0)throw Error('CLEAN_REHEARSAL_TARGET_REQUIRED');
    await insert(client,'public.businesses',dataset.rows.businesses[0]);
    await insert(client,'migration_private.runs',{id:dataset.run_id,business_id:dataset.business_id,snapshot_hash:dataset.snapshot_hash,rules_hash:dataset.rules_hash,config_hash:dataset.config_hash,dataset_hash});
    for(const row of dataset.evidence) await insert(client,'migration_private.evidence',row);
    await client.query('create temporary table m3_validated_staging (entity text not null, row_data jsonb not null) on commit drop');
    let count=0;
    for(const table of ORDER)for(const row of dataset.rows[table]??[]) {
      await client.query('insert into m3_validated_staging values ($1,$2)',[table,JSON.stringify(row)]);
      await insert(client,`public.${table}`,row);
      if(++count===faultAfter)throw Error('INJECTED_IMPORT_INTERRUPTION');
    }
    await client.query('update public.business_settings set timezone=$2,finance_enabled=false where business_id=$1',[dataset.business_id,dataset.timezone]);
    await insert(client,'public.business_finance_settings',dataset.settings);
    await client.query('set constraints all immediate');
    const bad=await client.query('select order_id from public.order_financials where business_id=$1 and private.order_protection_variance(business_id,order_id)<>0',[dataset.business_id]);
    if(bad.rowCount)throw Error('IMPORTED_PROTECTION_VARIANCE');
    await client.query('commit');return {idempotent:false};
  } catch(e){await client.query('rollback');throw e;}
}
export async function verify(client,snapshot,dataset) {
  const source=sourceBalances(snapshot.tables),funds=[];
  for(const f of snapshot.tables.funds){const mapping=dataset.crosswalk.find(c=>c.source_table==='funds'&&c.source_id===f.id);
    const r=await client.query('select private.finance_fund_balance($1,$2)::text balance',[dataset.business_id,mapping.target_id]);
    if(cents(r.rows[0].balance)!==source[f.id])throw Error('FUND_BALANCE_DELTA');
    funds.push({source_id:f.id,target_id:mapping.target_id,balance:money(source[f.id])});
  }
  const accounts=[];
  for(const a of snapshot.tables.accounts){const amount=snapshot.tables.funds.filter(f=>f.account_id===a.id).reduce((n,f)=>n+source[f.id],0n);accounts.push({source_id:a.id,target_id:dataset.crosswalk.find(c=>c.source_table==='accounts'&&c.source_id===a.id).target_id,balance:money(amount)});}
  const orders=(await client.query(`select o.id, o.status operational_status,o.composition_status,o.phone,o.delivery_date,o.delivery_method,f.agreed_total::text,f.financial_status,
    private.order_paid_net(f.business_id,f.order_id)::text paid_net,
    private.order_released_amount(f.business_id,f.order_id)::text released,
    private.order_committed_amount(f.business_id,f.order_id)::text committed,
    private.order_refunded_amount(f.business_id,f.order_id)::text refunded,
    private.order_retained_amount(f.business_id,f.order_id)::text retained,
    private.order_remaining(f.business_id,f.order_id)::text remaining,
    case when f.financial_status='open' then coalesce(private.order_remaining(f.business_id,f.order_id),0)::text else '0.00' end collectible_remaining,
    private.order_protection_variance(f.business_id,f.order_id)::text protection_variance
    from public.orders o join public.order_financials f on f.order_id=o.id where o.business_id=$1 order by o.id`,[dataset.business_id])).rows;
  for(const order of orders){if(cents(order.protection_variance)!==0n)throw Error('ORDER_VARIANCE');if(order.financial_status!=='open'&&cents(order.collectible_remaining)!==0n)throw Error('COLLECTIBLE_CONTRACT');
    const mapping=dataset.crosswalk.find(c=>c.target_table==='orders'&&c.target_id===order.id),truth=sourceOrderTruth(snapshot.tables,mapping.source_id);
    for(const [field,sourceField] of [['paid_net','paid'],['released','released'],['committed','committed']])if(cents(order[field])!==truth[sourceField])throw Error(`ORDER_ECONOMIC_DELTA:${field}`);
    order.source_order_id=mapping.source_id;
  }
  const entities=Object.fromEntries(Object.entries(snapshot.tables).map(([table,rows])=>{
    const classes=dataset.profile.classification.filter(c=>c.entity===table);
    if(classes.length!==rows.length)throw Error('SOURCE_ROW_UNCLASSIFIED');
    return [table,{source:rows.length,classification:Object.fromEntries(['MIGRATED','TRANSFORMED_WITH_EXPLICIT_RULE','EXCLUDED_WITH_EXPLICIT_REASON','SOURCE_INCONSISTENT_REQUIRES_DECISION'].map(k=>[k,classes.filter(c=>c.classification===k).length]))}];
  }));
  const target={};
  for(const table of ['businesses',...ORDER]){
    const numericFields={orders:['total_price'],order_financials:['agreed_total'],finance_transaction_entries:['amount']}[table]??[];
    const numericText=numericFields.length?` || jsonb_build_object(${numericFields.map(k=>`'${k}',t.${k}::text`).join(',')})`:'';
    const actual=(await client.query(`select to_jsonb(t)${numericText} row from public.${table} t order by ${table==='order_financials'?'order_id':'id'}`)).rows.map(r=>r.row);
    const expected=dataset.rows[table]??[];
    if(actual.length!==expected.length)throw Error(`ENTITY_COUNT_MISMATCH:${table}`);
    for(const row of expected){const pk=table==='order_financials'?'order_id':'id',r=actual.find(a=>a[pk]===row[pk]);if(!r)throw Error('TARGET_ID_MISMATCH');
      for(const [k,v]of Object.entries(row)){
        const av=r[k];
        if(['amount','agreed_total','total_price'].includes(k)){if(v===null?av!==null:av===null||cents(av)!==cents(v))throw Error(`ROW_VALUE_MISMATCH:${table}:${k}`);}
        else if(k.endsWith('_at')){if(v===null?av!==null:av===null||!(await client.query('select $1::timestamptz = $2::timestamptz equal',[v,av])).rows[0].equal)throw Error('HISTORICAL_TIMESTAMP_CHANGED');}
        else if(canonical(v)!==canonical(av))throw Error(`ROW_VALUE_MISMATCH:${table}:${k}`);
      }
    }
    // Hash all explicitly transformed fields (not server defaults / execution metadata).
    target[table]=expected.map(r=>Object.fromEntries(Object.keys(r).map(k=>[k,r[k]]))).sort((a,b)=>canonical(a).localeCompare(canonical(b)));
  }
  const posted=new Set(snapshot.tables.transactions.filter(t=>t.status==='posted').map(t=>t.id));
  const totals={external_in:0n,external_out:0n,internal_in:0n,internal_out:0n,opening_in:0n};
  for(const t of snapshot.tables.transactions.filter(t=>posted.has(t.id))){const es=snapshot.tables.transaction_entries.filter(e=>e.transaction_id===t.id),op=snapshot.tables.operations.find(o=>o.id===t.operation_id);const internal=es.some(e=>e.direction==='in')&&es.some(e=>e.direction==='out');for(const e of es){const key=op.operation_type==='opening_balance'?'opening_in':`${internal?'internal':'external'}_${e.direction}`;totals[key]=(totals[key]??0n)+cents(e.amount);}}
  const evidenceCount=Number((await client.query('select count(*) from migration_private.evidence where run_id=$1',[dataset.run_id])).rows[0].count);
  if(evidenceCount!==dataset.evidence.length)throw Error('PROVENANCE_COUNT_MISMATCH');
  return {snapshot_hash:snapshot.sha256,dataset_hash:dataset.dataset_hash,target_ids_hash:hash(dataset.crosswalk),canonical_rows_hash:hash(target),entities,funds,accounts,orders,money:Object.fromEntries(Object.entries(totals).map(([k,v])=>[k,money(v)])),unexplained_delta:'0.00',evidence_count:evidenceCount};
}
