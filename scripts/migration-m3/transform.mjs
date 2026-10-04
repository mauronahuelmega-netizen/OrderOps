import { VERSION, TABLES, canonical, hash, id, sourceKey, validateSnapshot, profile } from './core.mjs';

export function transform(snapshot, config) {
  validateSnapshot(snapshot);
  const p=profile(snapshot,config);
  if(p.blocked) throw Object.assign(Error('SOURCE_PROFILE_BLOCKED'),{profile:p});
  if(config.mode!=='synthetic' && config.mode!=='real-rehearsal') throw Error('EXPLICIT_MODE_REQUIRED');
  if(!config.business?.whatsapp_number || !config.business?.slug || !config.timezone) throw Error('EXPLICIT_TARGET_INFRASTRUCTURE_REQUIRED');
  const s=snapshot.tables, bid=config.business.id;
  const tid=(table,key,component='row')=>id(VERSION,snapshot.manifest.source_id,config.sourceWorkspaceId,table,key,component);
  const runId=id(VERSION,'run',snapshot.sha256,hash(config));
  const rows={}, crosswalk=[], evidence=[];
  const add=(table,row)=>{ (rows[table]??=[]).push(row); return row; };
  const ev=(table,row,targetTable=null,targetId=null)=>{
    const cls=p.classification.find(c=>c.entity===table&&c.source_id===sourceKey(table,row));
    const e={id:tid(table,sourceKey(table,row),'evidence'),run_id:runId,business_id:bid,source_table:table,source_id:sourceKey(table,row),source_hash:hash(row),source_actor_id:row.created_by??row.actor_id??row.opened_by??null,target_table:targetTable,target_id:targetId,...{classification:cls.classification,rule:cls.rule},source_row:row};
    evidence.push(e); crosswalk.push({source_table:table,source_id:e.source_id,target_table:targetTable,target_id:targetId,evidence_id:e.id,classification:e.classification,rule:e.rule});return e.id;
  };
  const workspace=s.workspaces.find(w=>w.id===config.sourceWorkspaceId);
  if(!workspace || s.workspaces.length!==1)throw Error('EXACTLY_ONE_SOURCE_TENANT_REQUIRED');
  add('businesses',{id:bid,name:workspace.name,slug:config.business.slug,whatsapp_number:config.business.whatsapp_number,is_active:true,created_at:workspace.created_at}); ev('workspaces',workspace,'businesses',bid);
  for(const r of [...s.profiles,...s.workspace_members]) ev('user_id' in r?'workspace_members':'profiles',r);
  for(const r of s.accounts) {const target=tid('accounts',r.id);add('finance_accounts',{id:target,business_id:bid,name:r.name,kind:r.kind,active:r.active,sort_order:r.sort_order,created_at:r.created_at,updated_at:r.updated_at});ev('accounts',r,'finance_accounts',target);}
  for(const r of s.categories){const target=tid('categories',r.id);add('finance_categories',{id:target,business_id:bid,name:r.name,area:r.area,kind:r.kind,active:r.active,sort_order:r.sort_order,created_at:r.created_at,updated_at:r.updated_at});ev('categories',r,'finance_categories',target);}
  const alphabet='23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  for(const r of s.orders){const target=tid('orders',r.id),d=config.orderDecisions[r.id];
    const codeBytes=Buffer.from(hash(['order-code',target]),'hex');const code=Array.from(codeBytes.subarray(0,6),b=>alphabet[b%alphabet.length]).join('');
    const evidenceId=ev('orders',r,'orders',target);
    add('orders',{id:target,business_id:bid,order_code:code,customer_name:r.client_name,phone:null,delivery_date:r.due_at?new Intl.DateTimeFormat('en-CA',{timeZone:config.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(r.due_at)):null,delivery_time:null,delivery_method:null,notes:r.note,total_price:null,status:d.operational_status,composition_status:'legacy_unknown',created_at:r.created_at,migration_evidence_id:evidenceId});
    add('order_financials',{order_id:target,business_id:bid,agreed_total:r.quoted_total,financial_status:d.financial_status,settled_at:d.settled_at??null,settled_by:null,cancelled_at:d.cancelled_at??null,cancelled_by:null,created_at:r.created_at,updated_at:r.updated_at});
    crosswalk.push({source_table:'orders',source_id:r.id,target_table:'order_financials',target_id:target,classification:'TRANSFORMED_WITH_EXPLICIT_RULE',rule:d.rule});
  }
  for(const r of s.funds){const target=tid('funds',r.id);add('finance_funds',{id:target,business_id:bid,account_id:tid('accounts',r.account_id),name:r.name,fund_type:r.fund_type,area_hint:r.area_hint,order_id:r.order_id?tid('orders',r.order_id):null,active:r.active,requires_strong_confirmation:r.requires_strong_confirmation,sort_order:r.sort_order,created_at:r.created_at,updated_at:r.updated_at});ev('funds',r,'finance_funds',target);}
  const operationTargets=new Map();
  for(const op of s.operations){
    const ts=s.transactions.filter(t=>t.operation_id===op.id);
    const components=new Map();
    for(const t of ts){const es=s.transaction_entries.filter(e=>e.transaction_id===t.id);let type=op.operation_type;
      if(t.order_id && ['income','order_delivery'].includes(type)) type=es.some(e=>e.direction==='out' && s.funds.find(f=>f.id===e.fund_id)?.fund_type==='committed')?'release_deposit':'order_payment';
      if(!['income','expense','transfer','opening_balance','deposit','historical_deposit','order_payment','release_deposit','correction','void','adjustment'].includes(type)) throw Error(`UNSUPPORTED_OPERATION_TYPE:${type}`);
      if(!components.has(type))components.set(type,[]);components.get(type).push(t.id);
    }
    if(!components.size) {
      if(op.operation_type==='void'&&config.operationDecisions?.[op.id]?.rule==='LEGACY_VOID_PRESERVE_EVIDENCE_ONLY') {ev('operations',op);continue;}
      throw Error('LIFECYCLE_WITHOUT_LEDGER_REQUIRES_EXPLICIT_RULE');
    }
    const entries=[...components.entries()].sort(([a],[b])=>a.localeCompare(b));
    const primaryId=tid('operations',op.id,entries[0][0]);const evidenceId=ev('operations',op,'finance_operations',primaryId);
    if(entries.length!==1) { const e=evidence.find(e=>e.id===evidenceId);e.classification='TRANSFORMED_WITH_EXPLICIT_RULE';e.rule='split_existing_transaction_semantics_without_new_entries'; }
    for(const [type,txids] of entries){const target=tid('operations',op.id,type);let eid=evidenceId;
      if(target!==primaryId){eid=tid('operations',op.id,`evidence:${type}`);evidence.push({...evidence.find(e=>e.id===evidenceId),id:eid,source_id:`${op.id}/${type}`,target_id:target});crosswalk.push({source_table:'operations',source_id:op.id,target_table:'finance_operations',target_id:target,classification:'TRANSFORMED_WITH_EXPLICIT_RULE',rule:'split_existing_transaction_semantics_without_new_entries'});}
      const decision=config.operationDecisions?.[op.id];
      add('finance_operations',{id:target,business_id:bid,operation_type:type,client_request_id:entries.length===1?op.client_request_id:tid('operations',op.id,`request:${type}`),request_hash:entries.length===1?op.request_hash:hash({original_request_hash:op.request_hash,type}),note:op.note,created_by:null,created_at:op.created_at,migration_evidence_id:eid,target_operation_id:decision?.target_operation_id?tid('operations',decision.target_operation_id,decision.target_type):null});
      for(const txid of txids)operationTargets.set(txid,target);
    }
  }
  for(const r of s.transactions){const target=tid('transactions',r.id);add('finance_transactions',{id:target,business_id:bid,operation_id:operationTargets.get(r.id),status:r.status,area:r.area,category_id:r.category_id?tid('categories',r.category_id):null,order_id:r.order_id?tid('orders',r.order_id):null,occurred_at:r.occurred_at,note:r.note,created_by:null,created_at:r.created_at,updated_at:r.updated_at,migration_evidence_id:ev('transactions',r,'finance_transactions',target)});}
  for(const r of s.transaction_entries){const target=tid('transaction_entries',r.id);add('finance_transaction_entries',{id:target,business_id:bid,transaction_id:tid('transactions',r.transaction_id),fund_id:tid('funds',r.fund_id),direction:r.direction,amount:r.amount,created_at:r.created_at});ev('transaction_entries',r,'finance_transaction_entries',target);}
  for(const r of s.audit_events){const target=tid('audit_events',r.id);add('finance_audit_events',{id:target,business_id:bid,actor_id:null,event_type:r.event_type,entity_type:r.entity_type,entity_id:r.entity_id?crosswalk.find(c=>c.source_id===r.entity_id)?.target_id??null:null,payload:r.payload,created_at:r.created_at,migration_evidence_id:ev('audit_events',r,'finance_audit_events',target)});}
  for(const table of TABLES.filter(t=>t.startsWith('reconciliation')))for(const r of s[table])ev(table,r);
  const settings={business_id:bid,protection_account_id:workspace.protection_account_id?tid('accounts',workspace.protection_account_id):null,default_operating_fund_id:workspace.default_operating_fund_id?tid('funds',workspace.default_operating_fund_id):null};
  const result={version:VERSION,run_id:runId,business_id:bid,snapshot_hash:snapshot.sha256,rules_hash:config.rulesHash,config_hash:hash(config),rows,evidence,crosswalk,profile:p,settings,timezone:config.timezone};
  // No hidden undefined values or zero-value entries can reach the importer.
  canonical(result);
  return {...result,dataset_hash:hash(result)};
}
