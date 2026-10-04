#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { createRequire } from 'node:module';
import { canonical, hash, makeSnapshot, profile, validateSnapshot, cents, money, id, VERSION, sourceOrderTruth } from './core.mjs';
import { transform } from './transform.mjs';
import { synthetic } from './synthetic.mjs';
import { ROOT, localClient, importDataset, verify, resetLocal } from './database.mjs';
import { assertSourceLocal, assertAuthorizedRealSource, REAL_SOURCE_PROJECT, REAL_SOURCE_WORKSPACE, exportSnapshot } from './exporter.mjs';
import { approvedRealDecisions } from './real-decisions.mjs';

const [command,...rawArgs]=process.argv.slice(2);
const setIndex=rawArgs.indexOf('--artifact-set');
const artifactSet=setIndex>=0?rawArgs[setIndex+1]:'local';
if(!artifactSet||!/^[a-zA-Z0-9_-]+$/.test(artifactSet))throw Error('INVALID_ARTIFACT_SET');
const args=setIndex<0?rawArgs:rawArgs.filter((_,i)=>i!==setIndex&&i!==setIndex+1);
const privateRoot=resolve(ROOT,'.migration-m3-private',artifactSet);
function artifact(name){const p=resolve(privateRoot,name);if(relative(privateRoot,p).startsWith('..'))throw Error('ARTIFACT_OUTSIDE_PRIVATE_STORAGE');return p;}
function save(name,value){const p=artifact(name);if(existsSync(p))throw Error('IMMUTABLE_ARTIFACT_EXISTS');mkdirSync(resolve(p,'..'),{recursive:true});writeFileSync(p,canonical(value)+'\n',{flag:'wx'});}
const load=name=>JSON.parse(readFileSync(artifact(name),'utf8'));
const rulesHash=()=>hash([...['core.mjs','transform.mjs','synthetic.mjs','database.mjs','exporter.mjs','real-decisions.mjs'].map(f=>readFileSync(new URL(f,import.meta.url),'utf8')),readFileSync(resolve(ROOT,'supabase/migrations/20261004010000_m3_historical_import_provenance.sql'),'utf8')]);
async function main(){
  if(command==='reuse-real-snapshot'){
    if(!args[0]||!/^[a-zA-Z0-9_-]+$/.test(args[0])||args[0]===artifactSet)throw Error('PRIOR_PRIVATE_ARTIFACT_SET_REQUIRED');
    const snapshot=validateSnapshot(JSON.parse(readFileSync(resolve(ROOT,'.migration-m3-private',args[0],'source/snapshot.json'),'utf8')));
    approvedRealDecisions(snapshot);save('source/snapshot.json',snapshot);
    console.log('IMMUTABLE_REAL_SNAPSHOT_REUSED_NO_REMOTE_ACCESS');return;
  }
  if(command==='configure-real-target'){
    const key='M3_TARGET_WHATSAPP_NUMBER',lines=readFileSync(resolve(ROOT,'.env.local'),'utf8').split(/\r?\n/);
    const line=lines.find(s=>/^\s*M3_TARGET_WHATSAPP_NUMBER\s*=/.test(s));
    let value=process.env[key]??line?.slice(line.indexOf('=')+1).trim();
    if(value&&/^(['"])/.test(value))value=value.slice(1,-1);
    if(!value?.trim())throw Error('M3_TARGET_WHATSAPP_NUMBER_REQUIRED');
    if(value.replace(/\D/g,'')==='5491100000000')throw Error('M2_PLACEHOLDER_WHATSAPP_FORBIDDEN');
    const snapshot=validateSnapshot(load('source/snapshot.json')),config=approvedRealDecisions(snapshot);
    config.business.whatsapp_number=value;
    config.target_configuration={source_has_business_whatsapp:false,target_whatsapp_source:'HUMAN_APPROVED_TARGET_CONFIGURATION',whatsapp_fingerprint:hash(value)};
    config.rulesHash=rulesHash();
    save('decisions/target-config.json',config);
    save('decisions/target-config-fingerprint.json',{config_hash:hash(config),...config.target_configuration});
    console.log('HUMAN_APPROVED_TARGET_CONFIGURATION_VALIDATED');return;
  }
  if(command==='report-real-orders'){
    const snapshot=validateSnapshot(load('source/snapshot.json')),config=load('decisions/profile-a.json');
    const orders=snapshot.tables.orders.map(o=>{
      const decision=config.orderDecisions[o.id],truth=sourceOrderTruth(snapshot.tables,o.id),remaining=o.quoted_total===null?null:money(cents(o.quoted_total)-truth.paid);
      return {source_order_id:o.id,target_order_id:id(VERSION,snapshot.manifest.source_id,config.sourceWorkspaceId,'orders',o.id,'row'),operational_status:decision.operational_status,financial_status:decision.financial_status,agreed_total:o.quoted_total,paid_net:money(truth.paid),gross_paid:money(truth.paid),remaining,collectible_remaining:decision.financial_status==='open'?remaining:'0.00',committed:money(truth.committed),released:money(truth.released),refunded:'0.00',retained:'0.00',protection_variance:money(truth.variance),lifecycle_evidence:decision,migration_classification:'TRANSFORMED_WITH_EXPLICIT_RULE',verification_stage:'SOURCE_DECISION_PRE_IMPORT'};
    });
    save('reports/order-decision-review.json',{snapshot_hash:snapshot.sha256,orders});
    console.log(JSON.stringify({order_count:orders.length,status_counts:orders.reduce((r,o)=>(r[o.financial_status]=(r[o.financial_status]??0)+1,r),{}),all_variances_zero:orders.every(o=>o.protection_variance==='0.00'),orders}));return;
  }
  if(command==='apply-real-decisions'){
    const snapshot=validateSnapshot(load('source/snapshot.json')),config=approvedRealDecisions(snapshot);config.rulesHash=rulesHash();
    const report=profile(snapshot,config);save('decisions/profile-a.json',config);save('profile/approved-report.json',report);
    console.log(JSON.stringify({result:report.blocked?'PROFILE_BLOCKED':'APPROVED_REAL_PROFILE_PASS',order_count:Object.keys(config.orderDecisions).length,void_evidence_count:Object.keys(config.operationDecisions).length,issues:report.issues}));
    if(report.blocked)process.exitCode=1;return;
  }
  if(command==='profile-real'){
    const snapshot=validateSnapshot(load('source/snapshot.json'));
    if(snapshot.manifest.source_id!==REAL_SOURCE_PROJECT||snapshot.manifest.source_workspace_id!==REAL_SOURCE_WORKSPACE||snapshot.manifest.source_kind!=='authorized-real-legacy-export')throw Error('SOURCE_PROJECT_IDENTITY_MISMATCH');
    const config={sourceWorkspaceId:REAL_SOURCE_WORKSPACE,rulesHash:rulesHash(),orderDecisions:{},reconciliationDecisions:{},operationDecisions:{}};
    const report=profile(snapshot,config);
    save('profile/config.json',config);save('profile/report.json',report);
    const summary={};
    for(const issue of report.issues){const g=summary[issue.code]??={count:0,amount:0n,examples:[]};g.count++;if(issue.monetary_impact!==null)g.amount+=cents(issue.monetary_impact);if(g.examples.length<3)g.examples.push({entity:issue.entity,source_id:issue.source_id,amount:issue.monetary_impact});}
    const sanitized=Object.fromEntries(Object.entries(summary).map(([code,g])=>[code,{count:g.count,total_amount:money(g.amount),examples:g.examples}]));
    save('profile/summary.json',{snapshot_hash:snapshot.sha256,blocked:report.blocked,anomalies:sanitized});
    console.log(JSON.stringify({result:report.blocked?'REAL_SOURCE_PROFILE_STOP':'REAL_SOURCE_PROFILE_PASS',snapshot_hash:snapshot.sha256,anomalies:sanitized}));
    if(report.blocked)process.exitCode=1;return;
  }
  if(command==='export-real'){
    const sourceEnvironment=readFileSync(resolve(ROOT,'.env.local'),'utf8').split(/\r?\n/);
    if(!process.env.M3_SOURCE_CA_CERT_PATH){
      const line=sourceEnvironment.find(s=>/^\s*M3_SOURCE_CA_CERT_PATH\s*=/.test(s));
      let value=line?.slice(line.indexOf('=')+1).trim();
      if(value&&/^(['"])/.test(value))value=value.slice(1,-1);
      if(value)process.env.M3_SOURCE_CA_CERT_PATH=value;
    }
    if(!process.env.M3_SOURCE_DATABASE_URL){
      const line=readFileSync(resolve(ROOT,'.env.local'),'utf8').split(/\r?\n/).find(s=>/^\s*M3_SOURCE_DATABASE_URL\s*=/.test(s));
      let value=line?.slice(line.indexOf('=')+1).trim();
      if(value&&/^(['"])/.test(value))value=value.slice(1,-1);
      if(value)process.env.M3_SOURCE_DATABASE_URL=value;
    }
    if(!process.env.M3_SOURCE_DATABASE_URL)throw Error('SOURCE_CREDENTIAL_UNAVAILABLE');
    assertAuthorizedRealSource(process.env.M3_SOURCE_DATABASE_URL,REAL_SOURCE_WORKSPACE);
    if(!process.env.M3_SOURCE_CA_CERT_PATH)throw Error('SOURCE_TRUSTED_CA_REQUIRED');
    const ca=readFileSync(resolve(ROOT,process.env.M3_SOURCE_CA_CERT_PATH),'utf8');
    if(!ca.includes('-----BEGIN CERTIFICATE-----'))throw Error('SOURCE_TRUSTED_CA_INVALID');
    if(existsSync(artifact('source/snapshot.json')))throw Error('IMMUTABLE_ARTIFACT_EXISTS');
    const require=createRequire(resolve(ROOT,'../majo-pasteleria-caja/package.json'));const {Client}=require('pg');
    const url=new URL(process.env.M3_SOURCE_DATABASE_URL);url.searchParams.delete('sslmode');
    const c=new Client({connectionString:url.toString(),ssl:{ca,rejectUnauthorized:true},connectionTimeoutMillis:15000,application_name:'m3-authorized-readonly-export'});
    try{
      await c.connect();const snapshot=validateSnapshot(await exportSnapshot(c,{workspaceId:REAL_SOURCE_WORKSPACE,sourceId:REAL_SOURCE_PROJECT,realSource:true}));
      save('source/snapshot.json',snapshot);
      save('source/manifest.json',{snapshot_hash:snapshot.sha256,...snapshot.manifest,rules_hash:rulesHash(),snapshot_identifier:snapshot.sha256});
      console.log(JSON.stringify({result:'REAL_SOURCE_READ_ONLY_EXPORT_PASS',snapshot_hash:snapshot.sha256,schema_fingerprint:snapshot.manifest.schema_fingerprint,table_counts:Object.fromEntries(Object.entries(snapshot.manifest.tables).map(([k,v])=>[k,v.count]))}));
    }catch(e){if(e.verification)console.log(JSON.stringify({source_preflight:e.verification}));throw Error(/^[A-Z_]+(?::[a-z_]+)?$/.test(e.message)?e.message:`SOURCE_EXPORT_FAILED_${e.code??'UNKNOWN'}`);}finally{await c.end();}
    return;
  }
  if(command==='synthetic'){
    const {snapshot,config}=synthetic();config.rulesHash=rulesHash();save('synthetic/source.json',snapshot);save('synthetic/config.json',config);console.log('SYNTHETIC_SOURCE_CREATED');return;
  }
  if(command==='export'){
    if(!process.env.M3_SOURCE_DATABASE_URL||!args[0]||!args[1])throw Error('EXPORT_REQUIRES_LOCAL_SOURCE_URL_WORKSPACE_AND_SOURCE_ID');
    assertSourceLocal(process.env.M3_SOURCE_DATABASE_URL);
    const require=createRequire(resolve(ROOT,'../majo-pasteleria-caja/package.json'));const {Client}=require('pg');const c=new Client({connectionString:process.env.M3_SOURCE_DATABASE_URL});await c.connect();
    try{save('source/snapshot.json',await exportSnapshot(c,{workspaceId:args[0],sourceId:args[1]}));console.log('READ_ONLY_LOCAL_EXPORT_COMPLETE');}finally{await c.end();}return;
  }
  const sourceName=args[0]??'synthetic/source.json',configName=args[1]??'synthetic/config.json';
  const snapshot=validateSnapshot(load(sourceName)),config=load(configName);if(config.rulesHash!==rulesHash())throw Error('RULES_VERSION_MISMATCH');
  const report=profile(snapshot,config);
  if(command==='profile'){save('profile/report.json',report);console.log(report.blocked?'PROFILE_BLOCKED':'PROFILE_PASS');if(report.blocked)process.exitCode=1;return;}
  const dataset=transform(snapshot,config);
  if(command==='transform'){save('transform/dataset.json',dataset);save('crosswalk/manifest.json',dataset.crosswalk);console.log('TRANSFORM_PASS');return;}
  if(command==='rehearse'){
    if(args[2]!=='--confirm-local-reset')throw Error('EXPLICIT_LOCAL_RESET_CONFIRMATION_REQUIRED');
    if([1,2].some(run=>existsSync(artifact(`reports/run-${run}.json`))))throw Error('REHEARSAL_ARTIFACT_SET_ALREADY_USED');
    const reports=[];
    for(const run of [1,2]){
      resetLocal();const c=await localClient();
      try{
        if(run===1){try{await importDataset(c,dataset,{faultAfter:3});throw Error('FAULT_NOT_TRIGGERED');}catch(e){if(e.message!=='INJECTED_IMPORT_INTERRUPTION')throw e;}
          const n=(await c.query('select count(*) from public.businesses')).rows[0].count;if(n!=='0')throw Error('INTERRUPTED_IMPORT_LEFT_PARTIAL_ROWS');}
        await importDataset(c,dataset);const first=await verify(c,snapshot,dataset);
        if(!(await importDataset(c,dataset)).idempotent)throw Error('IMPORT_RETRY_NOT_IDEMPOTENT');
        if(canonical(first)!==canonical(await verify(c,snapshot,dataset)))throw Error('RETRY_CHANGED_CANONICAL_RESULT');
        reports.push(first);save(`reports/run-${run}.json`,first);console.log(`RUN_${run}_PASS ${hash(first)}`);
      }finally{await c.end();}
    }
    if(canonical(reports[0])!==canonical(reports[1]))throw Error('REHEARSAL_NONDETERMINISTIC');
    save('reports/comparison.json',{pass:true,canonical_hash:hash(reports[0]),snapshot_hash:snapshot.sha256});console.log(`${config.mode==='real-rehearsal'?'REAL':'SYNTHETIC'}_MIGRATION_REHEARSAL: PASS`);return;
  }
  if(['import','verify'].includes(command)){
    const c=await localClient();try{if(command==='import')console.log(await importDataset(c,dataset));else{save('reports/verification.json',await verify(c,snapshot,dataset));console.log('VERIFY_PASS');}}finally{await c.end();}return;
  }
  throw Error('COMMAND_REQUIRED: synthetic/export/profile/transform/import/verify/rehearse');
}
main().catch(e=>{console.error(e.message);if(e.profile)console.error(`Profile blocked: ${e.profile.issues.length} classified issues; raw details remain private.`);process.exitCode=1;});
