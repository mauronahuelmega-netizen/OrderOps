import { id, cents, sourceOrderTruth, validateSnapshot } from './core.mjs';

export const APPROVED_REAL_SNAPSHOT='4aeec18c7ba0e171ad225c02e2b2aadf36f2c291d19c29d404168df58e4c9d90';
export const APPROVED_REAL_SCHEMA='300e1ecce69958a9ef23dd593131bccf226a700053b6f995bdf484625c167dbc';
/** Human decisions are bound to this immutable snapshot; no inference from delivery alone. */
export function approvedRealDecisions(snapshot) {
  validateSnapshot(snapshot);
  if(snapshot.sha256!==APPROVED_REAL_SNAPSHOT||snapshot.manifest.schema_fingerprint!==APPROVED_REAL_SCHEMA)throw Error('HUMAN_DECISION_SNAPSHOT_MISMATCH');
  const s=snapshot.tables,operationDecisions={},orderDecisions={};
  for(const op of s.operations.filter(o=>o.operation_type==='void')) {
    const audits=s.audit_events.filter(a=>a.event_type==='transaction_voided'&&a.payload?.void_operation_id===op.id);
    if(!audits.length||s.transactions.some(t=>t.operation_id===op.id))throw Error('LEGACY_VOID_EVIDENCE_CONTRADICTION');
    const txids=[...new Set(audits.flatMap(a=>a.payload.voided_transaction_ids??[a.entity_id]))].sort();
    if(txids.some(tid=>s.transactions.find(t=>t.id===tid)?.status!=='voided'))throw Error('LEGACY_VOID_EVIDENCE_CONTRADICTION');
    operationDecisions[op.id]={rule:'LEGACY_VOID_PRESERVE_EVIDENCE_ONLY',audit_ids:audits.map(a=>a.id).sort(),transaction_ids:txids};
  }
  for(const o of s.orders) {
    const operational_status={open:'pending',delivered:'completed'}[o.status];
    if(!operational_status)throw Error('UNRESOLVED_REAL_OPERATIONAL_STATUS');
    const truth=sourceOrderTruth(s,o.id);
    if(truth.variance!==0n)throw Error('SOURCE_PROTECTION_VARIANCE');
    const releaseTx=s.transactions.filter(t=>t.order_id===o.id&&t.status==='posted'&&s.operations.some(op=>op.id===t.operation_id&&['order_delivery','release_deposit'].includes(op.operation_type))&&s.transaction_entries.some(e=>e.transaction_id===t.id&&e.direction==='out'&&s.funds.some(f=>f.id===e.fund_id&&f.fund_type==='committed')));
    const settled=truth.released>0n&&truth.committed===0n&&o.quoted_total!==null&&truth.paid===cents(o.quoted_total)&&truth.released===truth.paid&&releaseTx.length>0;
    const latest=releaseTx.map(t=>t.occurred_at).sort().at(-1);
    orderDecisions[o.id]={operational_status,financial_status:settled?'settled':'open',rule:settled?'VALID_POSTED_RELEASE_FULL_CONTRACT_PROTECTION_ZERO':'CONTRACT_OPEN_NO_EFFECTIVE_FINANCIAL_CLOSURE',release_transaction_ids:releaseTx.map(t=>t.id).sort(),...(settled?{settled_at:latest}:{})};
  }
  return {mode:'real-rehearsal',sourceWorkspaceId:snapshot.manifest.source_workspace_id,business:{id:id('m3-real-rehearsal',snapshot.manifest.source_workspace_id),slug:'m3-majo-real-rehearsal'},timezone:'America/Argentina/Buenos_Aires',orderDecisions,operationDecisions,reconciliationDecisions:{},human_decisions:{snapshot:APPROVED_REAL_SNAPSHOT,schema:APPROVED_REAL_SCHEMA,rule:'REAL_SOURCE_PROFILE_A_HUMAN_DECISIONS'}};
}
