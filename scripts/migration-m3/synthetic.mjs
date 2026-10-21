import { TABLES, hash, id, makeSnapshot } from './core.mjs';

export function synthetic() {
  const tables=Object.fromEntries(TABLES.map(t=>[t,[]]));const at='2026-09-01T12:00:00.000Z';
  const uid=id('synthetic','actor'),ws=id('synthetic','workspace');
  const config={mode:'synthetic',sourceWorkspaceId:ws,business:{id:id('synthetic','business'),slug:'m3-synthetic-rehearsal',whatsapp_number:'+5491100000000'},timezone:'America/Argentina/Buenos_Aires',rulesHash:hash('m3-v1-rules'),orderDecisions:{},reconciliationDecisions:{}};
  const account=(name,kind)=>{const a={id:id('synthetic','account',name),workspace_id:ws,name,kind,active:true,sort_order:0,created_at:at,updated_at:at};tables.accounts.push(a);return a.id;};
  const digital=account('Digital sintético','mercado_pago'),cash=account('Efectivo sintético','cash');
  const fund=(name,type='business_operating',accountId=digital,orderId=null,active=true)=>{const f={id:id('synthetic','fund',name),workspace_id:ws,account_id:accountId,name,fund_type:type,area_hint:type==='family'?'family':'business',order_id:orderId,active,requires_strong_confirmation:false,sort_order:0,created_at:at,updated_at:at,system_key:null};tables.funds.push(f);return f.id;};
  const operating=fund('Operating'),cashFund=fund('Cash','business_operating',cash),reserve=fund('Reserve','protected_reserve'),family=fund('Family','family'),inactive=fund('Inactive','business_operating',digital,null,false);
  tables.workspaces.push({id:ws,name:'Majo synthetic history',protection_account_id:digital,default_operating_fund_id:operating,created_at:at,updated_at:at});
  tables.profiles.push({id:uid,display_name:'Historical synthetic actor',email:null,created_at:at,updated_at:at});tables.workspace_members.push({workspace_id:ws,user_id:uid,role:'owner',created_at:at});
  const cat=id('synthetic','category');tables.categories.push({id:cat,workspace_id:ws,name:'Synthetic income',area:'business',kind:'income',active:true,sort_order:0,created_at:at,updated_at:at,system_key:null});
  const order=(name,total,status='open',financial='open')=>{const oid=id('synthetic','order',name);tables.orders.push({id:oid,workspace_id:ws,client_name:name,description:'Historical unitemized description',status,due_at:null,note:null,quoted_total:total,created_by:uid,created_at:at,updated_at:at});config.orderDecisions[oid]={operational_status:status==='delivered'?'completed':status==='cancelled'?'cancelled':'pending',financial_status:financial,rule:'synthetic_explicit_lifecycle_evidence',...(financial==='settled'?{settled_at:'2026-09-03T12:00:00.000Z'}:{})};return oid;};
  const tx=(name,type,legs,orderId=null,status='posted',operationName=name)=>{
    const opid=id('synthetic','operation',operationName);if(!tables.operations.some(o=>o.id===opid))tables.operations.push({id:opid,workspace_id:ws,operation_type:type,client_request_id:id('synthetic','request',operationName),request_hash:hash(['synthetic',operationName]),note:null,created_by:uid,created_at:at});
    const txid=id('synthetic','transaction',name);tables.transactions.push({id:txid,workspace_id:ws,operation_id:opid,status,area:'business',category_id:null,order_id:orderId,occurred_at:at,note:null,created_by:uid,created_at:at,updated_at:at});
    legs.forEach(([fid,direction,amount],i)=>tables.transaction_entries.push({id:id('synthetic','entry',name,i),workspace_id:ws,transaction_id:txid,fund_id:fid,direction,amount,created_at:at}));return txid;
  };
  tx('opening','opening_balance',[[operating,'in','1000.00'],[cashFund,'in','200.00'],[reserve,'in','50.00'],[family,'in','25.00'],[inactive,'in','10.00']]);
  tx('income','income',[[operating,'in','120.00']]);tx('expense','expense',[[operating,'out','20.00']]);tx('transfer','transfer',[[operating,'out','10.00'],[reserve,'in','10.00']]);
  tx('voided income','income',[[operating,'in','75.00']],null,'voided');
  tx('edited final income','income',[[operating,'in','5.00']]);
  const unpaid=order('Unpaid','100.00'),unknown=order('Unknown total',null),cancelled=order('Cancelled unpaid','100.00','cancelled','cancelled');
  config.orderDecisions[cancelled].cancelled_at='2026-09-03T12:00:00.000Z';
  const partial=order('Partial','100.00'),partialFund=fund('Partial committed','committed',digital,partial);
  tx('partial deposit','deposit',[[partialFund,'in','30.00']],partial);
  const full=order('Full still open','100.00'),fullFund=fund('Full committed','committed',digital,full);
  tx('full deposit','deposit',[[fullFund,'in','100.00']],full);
  const cashOrder=order('Cash paid','100.00'),cashCommitted=fund('Cash committed','committed',digital,cashOrder);
  tx('cash external','income',[[cashFund,'in','40.00']],cashOrder,'posted','cash payment');
  tx('cash coverage','income',[[operating,'out','40.00'],[cashCommitted,'in','40.00']],cashOrder,'posted','cash payment');
  const hist=order('Historical','100.00'),histFund=fund('Historical committed','committed',digital,hist);
  tx('historical deposit','historical_deposit',[[operating,'out','30.00'],[histFund,'in','30.00']],hist);
  const delivered=order('Delivered with demonstrated release','100.00','delivered','settled'),releasedFund=fund('Released historical committed','committed',digital,delivered,false);
  tx('delivered deposit','deposit',[[releasedFund,'in','100.00']],delivered);
  tx('delivery release','order_delivery',[[releasedFund,'out','100.00'],[operating,'in','100.00']],delivered);
  const reconciliationId=id('synthetic','reconciliation');
  config.reconciliationDecisions[reconciliationId]={classification:'PRESERVE_AS_LEGACY_MIGRATION_EVIDENCE',reason:'Synthetic legacy snapshots were taken at opening; no statement cutoff evidence exists. Preserve all rows, no canonical closed period.'};
  tables.reconciliations.push({id:reconciliationId,workspace_id:ws,account_id:digital,status:'closed',statement_balance:'1420.00',system_balance:'1420.00',note:null,opened_by:uid,closed_by:uid,opened_at:at,closed_at:'2026-09-05T12:00:00.000Z',created_at:at});
  tables.reconciliation_fund_snapshots.push({id:id('synthetic','snapshot'),reconciliation_id:reconciliationId,fund_id:operating,balance:'1000.00'});
  tables.reconciliation_entries.push({id:id('synthetic','membership'),reconciliation_id:reconciliationId,transaction_id:tables.transactions[0].id,entry_id:tables.transaction_entries[0].id});
  tables.audit_events.push({id:id('synthetic','audit'),workspace_id:ws,actor_id:uid,event_type:'transaction_edited',entity_type:'transaction',entity_id:id('synthetic','transaction','edited final income'),payload:{before:{amount:'50.00'},after:{amount:'5.00'}},created_at:'2026-09-02T12:00:00.000Z'});
  const snapshot=makeSnapshot(tables,{source_id:'m3-synthetic-legacy',source_kind:'synthetic',source_workspace_id:ws,exported_at:'2026-09-30T12:00:00.000Z',schema_fingerprint:hash('majo-legacy-phase-a-schema'),schema_version:'legacy-phase-a-local-migrations'});
  return {snapshot,config,keys:{operating,cashFund,reserve,family,inactive,unpaid,unknown,full,partial,cashOrder,hist,delivered,cancelled}};
}
