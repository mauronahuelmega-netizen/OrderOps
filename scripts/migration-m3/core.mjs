import { createHash } from 'node:crypto';

export const VERSION = 'm3-v1';
export const TABLES = ['workspaces', 'profiles', 'workspace_members', 'accounts', 'funds', 'categories',
  'orders', 'operations', 'transactions', 'transaction_entries', 'audit_events',
  'reconciliations', 'reconciliation_entries', 'reconciliation_fund_snapshots'];
export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  if (value === undefined || typeof value === 'bigint' || (typeof value === 'number' && !Number.isFinite(value))) throw Error('NON_CANONICAL_VALUE');
  return JSON.stringify(value);
}
export const hash = value => createHash('sha256').update(typeof value === 'string' ? value : canonical(value)).digest('hex');
const NAMESPACE = '8258e5de707c532ba3148c732b4c03b7';
export function id(...parts) {
  const bytes = createHash('sha1').update(Buffer.from(NAMESPACE, 'hex')).update(canonical(parts)).digest().subarray(0,16);
  bytes[6] = (bytes[6] & 15) | 80; bytes[8] = (bytes[8] & 63) | 128;
  const h = bytes.toString('hex');
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}
export function cents(value) {
  if (typeof value !== 'string' || !/^-?\d+(?:\.\d{1,2})?$/.test(value)) throw Error('MONEY_MUST_BE_EXACT_DECIMAL_TEXT');
  const [whole, fraction = ''] = value.replace('-', '').split('.');
  const n = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  if (n > 99999999999999n) throw Error('MONEY_OVERFLOW');
  return value.startsWith('-') ? -n : n;
}
export const money = n => `${n < 0n ? '-' : ''}${(n < 0n ? -n : n)/100n}.${((n < 0n ? -n : n)%100n).toString().padStart(2,'0')}`;
export const sourceKey = (table, row) => table === 'workspace_members' ? `${row.workspace_id}/${row.user_id}` : row.id;
export function makeSnapshot(tables, metadata) {
  const sorted = Object.fromEntries(TABLES.map(t => [t, [...(tables[t] ?? [])].sort((a,b) => String(sourceKey(t,a)).localeCompare(String(sourceKey(t,b))))]));
  const manifest = { format: VERSION, ...metadata,
    tables: Object.fromEntries(TABLES.map(t => [t, { count: sorted[t].length, sha256: hash(sorted[t]) }])) };
  return { manifest, tables: sorted, sha256: hash({manifest, tables: sorted}) };
}
export function validateSnapshot(snapshot) {
  if (snapshot.manifest.format !== VERSION || snapshot.sha256 !== hash({manifest:snapshot.manifest,tables:snapshot.tables})) throw Error('SNAPSHOT_HASH_MISMATCH');
  for (const t of TABLES) if (!Array.isArray(snapshot.tables[t]) || snapshot.manifest.tables[t].sha256 !== hash(snapshot.tables[t]) || snapshot.manifest.tables[t].count !== snapshot.tables[t].length) throw Error('TABLE_HASH_MISMATCH');
  return snapshot;
}
export function sourceBalances(s) {
  const posted = new Set(s.transactions.filter(t => t.status === 'posted').map(t => t.id));
  const balances = Object.fromEntries(s.funds.map(f => [f.id,0n]));
  for (const e of s.transaction_entries) if (posted.has(e.transaction_id) && e.fund_id in balances) balances[e.fund_id] += (e.direction === 'in' ? 1n : -1n) * cents(e.amount);
  return balances;
}
export function sourceOrderTruth(s, orderId) {
  const balances=sourceBalances(s);
  let paid=0n,released=0n;
  for(const t of s.transactions.filter(t=>t.order_id===orderId&&t.status==='posted')){
    const op=s.operations.find(o=>o.id===t.operation_id),es=s.transaction_entries.filter(e=>e.transaction_id===t.id);
    for(const e of es){const f=s.funds.find(f=>f.id===e.fund_id);
      if(e.direction==='in'&&((['income','deposit','order_delivery'].includes(op?.operation_type)&&!es.some(x=>x.direction==='out'))||(op?.operation_type==='historical_deposit'&&f?.fund_type==='committed'))) paid+=cents(e.amount);
      if(e.direction==='out'&&f?.fund_type==='committed'&&['release_deposit','order_delivery'].includes(op?.operation_type))released+=cents(e.amount);
    }
  }
  const committed=s.funds.filter(f=>f.order_id===orderId&&f.fund_type==='committed'&&f.active).reduce((n,f)=>n+balances[f.id],0n);
  return {paid,released,committed,variance:paid-released-committed};
}
export function profile(snapshot, config) {
  validateSnapshot(snapshot);
  const s = snapshot.tables, issues = [], classification = [];
  const issue = (code,table,row,details={},severity='error') => issues.push({code,entity:table,source_id:sourceKey(table,row),severity,monetary_impact:details.amount ?? null,classification:'SOURCE_INCONSISTENT_REQUIRES_DECISION',requires_decision:severity==='error',...details});
  const maps = Object.fromEntries(TABLES.map(t=>[t,new Map(s[t].map(r=>[sourceKey(t,r),r]))]));
  const foreign = {workspace_members:{workspace_id:'workspaces',user_id:'profiles'}, accounts:{workspace_id:'workspaces'},funds:{workspace_id:'workspaces',account_id:'accounts',order_id:'orders'},categories:{workspace_id:'workspaces'},orders:{workspace_id:'workspaces',created_by:'profiles'},operations:{workspace_id:'workspaces',created_by:'profiles'},transactions:{workspace_id:'workspaces',operation_id:'operations',category_id:'categories',order_id:'orders',created_by:'profiles'},transaction_entries:{workspace_id:'workspaces',transaction_id:'transactions',fund_id:'funds'},audit_events:{workspace_id:'workspaces',actor_id:'profiles'},reconciliations:{workspace_id:'workspaces',account_id:'accounts',opened_by:'profiles',closed_by:'profiles'},reconciliation_entries:{reconciliation_id:'reconciliations',transaction_id:'transactions',entry_id:'transaction_entries'},reconciliation_fund_snapshots:{reconciliation_id:'reconciliations',fund_id:'funds'}};
  for (const table of TABLES) {
    const seen = new Set();
    for (const row of s[table]) {
      const key = sourceKey(table,row);
      if (!key || seen.has(key)) issue('DUPLICATE_OR_MISSING_ID',table,row); seen.add(key);
      if ('workspace_id' in row && row.workspace_id !== config.sourceWorkspaceId) issue('TENANT_MISMATCH',table,row);
      for (const [field,target] of Object.entries(foreign[table] ?? {})) {
        if (row[field] != null && !maps[target].has(row[field])) issue('ORPHAN_FOREIGN_KEY',table,row,{field});
        const parent = maps[target].get(row[field]);
        if (parent?.workspace_id && row.workspace_id && parent.workspace_id !== row.workspace_id) issue('CROSS_TENANT_FOREIGN_KEY',table,row,{field});
      }
      for (const [field,value] of Object.entries(row)) {
        if (value != null && ['amount','quoted_total','balance','statement_balance','system_balance'].includes(field)) {
          try { const n=cents(value); if (['amount','quoted_total'].includes(field) && n<=0n) issue('NONPOSITIVE_MONEY',table,row,{field}); } catch { issue('INVALID_EXACT_MONEY',table,row,{field}); }
        }
        if (field.endsWith('_at') && value != null && (typeof value!=='string' || !/[Z]|[+-]\d\d:\d\d$/.test(value) || !Number.isFinite(Date.parse(value)))) issue('INVALID_TIMESTAMP',table,row,{field});
      }
      if (['operations','transactions','orders'].includes(table) && !row.created_at) issue('MISSING_HISTORICAL_TIMESTAMP',table,row);
      if (table==='transactions' && !row.occurred_at) issue('MISSING_HISTORICAL_TIMESTAMP',table,row);
      const voidEvidence=table==='operations'&&row.operation_type==='void'&&config.operationDecisions?.[row.id]?.rule==='LEGACY_VOID_PRESERVE_EVIDENCE_ONLY';
      const excluded = ['profiles','workspace_members'].includes(table)||voidEvidence;
      const reconciliation = table.startsWith('reconciliation');
      classification.push({entity:table,source_id:key,classification:excluded?'TRANSFORMED_WITH_EXPLICIT_RULE':reconciliation?'EXCLUDED_WITH_EXPLICIT_REASON':'MIGRATED',rule:voidEvidence?'LEGACY_VOID_PRESERVE_EVIDENCE_ONLY':excluded?'historical_identity_not_current_access':reconciliation?'preserve_legacy_reconciliation_evidence_no_canonical_cutoff':'faithful_import'});
    }
  }
  const requests=new Set();
  for (const op of s.operations) {
    const key=`${op.workspace_id}/${op.client_request_id}`;
    if(requests.has(key))issue('DUPLICATE_REQUEST_IDENTITY','operations',op);requests.add(key);
    if (!op.client_request_id || !op.request_hash) issue('MISSING_REQUEST_IDENTITY','operations',op);
    if (['correction','void','adjustment'].includes(op.operation_type) && !config.operationDecisions?.[op.id]) issue('LEGACY_OPERATION_PROVENANCE_REQUIRED','operations',op);
  }
  for (const t of s.transactions) {
    const es=s.transaction_entries.filter(e=>e.transaction_id===t.id);
    const op=maps.operations.get(t.operation_id);
    if (!['posted','voided'].includes(t.status)) issue('UNKNOWN_TRANSACTION_STATUS','transactions',t);
    if (!es.length) issue('EMPTY_MONETARY_TRANSACTION','transactions',t);
    if (t.order_id && t.status==='posted' && !es.some(e=>e.direction==='out') && es.some(e=>maps.funds.get(e.fund_id)?.fund_type!=='committed')) {
      const cashOnly=es.every(e=>maps.accounts.get(maps.funds.get(e.fund_id)?.account_id)?.kind==='cash');
      const hasCoverage=s.transactions.some(c=>c.operation_id===t.operation_id && c.order_id===t.order_id && s.transaction_entries.some(e=>e.transaction_id===c.id && e.direction==='in' && maps.funds.get(e.fund_id)?.fund_type==='committed'));
      if (!cashOnly || !hasCoverage) issue('LEGACY_DIRECT_AVAILABLE_ORDER_PAYMENT','transactions',t,{order_id:t.order_id,amount:money(es.reduce((n,e)=>n+cents(e.amount),0n)),occurred_at:t.occurred_at,destinations:es.map(e=>({fund_id:e.fund_id,account_id:maps.funds.get(e.fund_id)?.account_id})),operational_status:maps.orders.get(t.order_id)?.status,evidence:'posted external IN without committed/release evidence'});
    }
    if (!op) continue;
    if (es.some(e=>!['in','out'].includes(e.direction))) issue('UNKNOWN_ENTRY_DIRECTION','transactions',t);
  }
  for(const o of s.orders) {
    const decision=config.orderDecisions?.[o.id];
    if(!decision || !decision.rule || !['pending','preparing','ready','completed','cancelled'].includes(decision.operational_status) || !['open','settled','cancelled'].includes(decision.financial_status)) issue('ORDER_LIFECYCLE_DECISION_REQUIRED','orders',o);
    if(!o.client_name?.trim()) issue('MISSING_CUSTOMER_EVIDENCE','orders',o);
    try {const truth=sourceOrderTruth(s,o.id);
      if(truth.variance!==0n)issue('SOURCE_PROTECTION_VARIANCE','orders',o,{amount:money(truth.variance)});
      if(o.quoted_total!=null&&truth.paid>cents(o.quoted_total))issue('SOURCE_OVERPAID','orders',o,{amount:money(truth.paid-cents(o.quoted_total))});
      if(decision?.financial_status==='settled'&&(truth.committed!==0n||o.quoted_total==null||truth.paid!==cents(o.quoted_total)))issue('UNPROVEN_SETTLED_STATE','orders',o);
      if(decision?.financial_status==='cancelled'&&truth.committed!==0n)issue('CANCELLATION_MONEY_UNRESOLVED','orders',o);
    }catch{/* invalid money was already classified */}
  }
  try { for(const [fid,n] of Object.entries(sourceBalances(s))) if(n<0n) issue('NEGATIVE_SOURCE_BALANCE','funds',maps.funds.get(fid),{amount:money(n)}); } catch { /* invalid amounts already classified */ }
  const linked=new Set();
  for(const re of s.reconciliation_entries) { if(linked.has(re.entry_id))issue('MULTIPLE_RECONCILIATION_MEMBERSHIP','reconciliation_entries',re);linked.add(re.entry_id); }
  for(const r of s.reconciliations)if(!config.reconciliationDecisions?.[r.id]?.reason)issue('LEGACY_RECONCILIATION_DECISION_REQUIRED','reconciliations',r);
  for(const c of classification) if(issues.some(i=>i.entity===c.entity && i.source_id===c.source_id && i.severity==='error')){c.classification='SOURCE_INCONSISTENT_REQUIRES_DECISION';c.rule='unresolved_profile_issue';}
  return {snapshot_hash:snapshot.sha256,issues,classification,blocked:issues.some(i=>i.severity==='error')};
}
