import { TABLES, hash, makeSnapshot } from './core.mjs';

export const REAL_SOURCE_PROJECT = 'kvqhlnzoprwwhidfkrfi';
export const REAL_SOURCE_WORKSPACE = 'a928d0d6-5394-473b-a5a4-1982297c19fe';
export function expectedPolicyExpression(table) {
  const ws=`'${REAL_SOURCE_WORKSPACE}'::uuid`;
  if(table==='profiles') {
    const branches=[['workspace_members','m','user_id'],['orders','o','created_by'],['operations','o','created_by'],['transactions','t','created_by'],['audit_events','a','actor_id']].map(([t,a,c])=>`(EXISTS ( SELECT 1 FROM ${t} ${a} WHERE ((${a}.workspace_id = ${ws}) AND (${a}.${c} = profiles.id))))`);
    branches.push(`(EXISTS ( SELECT 1 FROM reconciliations r WHERE ((r.workspace_id = ${ws}) AND ((r.opened_by = profiles.id) OR (r.closed_by = profiles.id)))))`);
    return `(${branches.join(' OR ')})`;
  }
  if(['reconciliation_entries','reconciliation_fund_snapshots'].includes(table))return `(EXISTS ( SELECT 1 FROM reconciliations r WHERE ((r.id = ${table}.reconciliation_id) AND (r.workspace_id = ${ws}))))`;
  return `(${table==='workspaces'?'id':'workspace_id'} = ${ws})`;
}
export function verifySourcePolicies(policies,rls) {
  const normalize=s=>s.replace(/\s+/g,' ').trim();
  if(policies.length!==TABLES.length*2||rls.length!==TABLES.length||rls.some(r=>!TABLES.includes(r.table_name)||!r.enabled))throw Error('SOURCE_M3_POLICIES_MISMATCH');
  for(const table of TABLES)for(const [prefix,mode] of [['select','PERMISSIVE'],['tenant_cap','RESTRICTIVE']]) {
    const matches=policies.filter(p=>p.tablename===table&&p.policyname===`m3_source_reader_${prefix}_${table}`);
    if(matches.length!==1)throw Error('SOURCE_M3_POLICIES_MISMATCH');
    const p=matches[0];
    if(p.roles!=='{m3_source_reader}'||p.cmd!=='SELECT'||p.permissive!==mode||p.with_check!==null||normalize(p.qual??'')!==normalize(expectedPolicyExpression(table)))throw Error('SOURCE_M3_POLICIES_MISMATCH');
  }
  return {policy_count:policies.length,policy_hash:hash(policies),rls};
}
export function assertAuthorizedRealSource(url,workspaceId) {
  const u=new URL(url);
  if(!['postgres:','postgresql:'].includes(u.protocol)||u.hostname!=='aws-0-us-west-2.pooler.supabase.com'||u.port!=='5432'||u.pathname!=='/postgres'||decodeURIComponent(u.username)!==`m3_source_reader.${REAL_SOURCE_PROJECT}`||workspaceId!==REAL_SOURCE_WORKSPACE)throw Error('SOURCE_PROJECT_IDENTITY_MISMATCH');
  if(u.searchParams.has('sslmode')&&!['require','verify-ca','verify-full'].includes(u.searchParams.get('sslmode')))throw Error('SOURCE_TLS_REQUIRED');
}

/** Source export is local-only until the explicit real-source authorization gate. */
export function assertSourceLocal(url) {
  const u=new URL(url);
  if(!['localhost','127.0.0.1','[::1]'].includes(u.hostname))throw Error('REAL_SOURCE_READ_ONLY_AUTHORIZATION_REQUIRED');
  if(u.port!=='54332')throw Error('LEGACY_LOCAL_SOURCE_PORT_REQUIRED');
}
export async function exportSnapshot(client,{workspaceId,sourceId,realSource=false}) {
  const tables={},schema={};
  let identity=null;
  if(realSource){
    if(workspaceId!==REAL_SOURCE_WORKSPACE||sourceId!==REAL_SOURCE_PROJECT)throw Error('SOURCE_PROJECT_IDENTITY_MISMATCH');
    identity=(await client.query("select current_user role,session_user session_role,current_database() database,current_setting('default_transaction_read_only') default_readonly")).rows[0];
    if(identity.role!=='m3_source_reader'||identity.session_role!=='m3_source_reader'||identity.database!=='postgres'||identity.default_readonly!=='on')throw Error('SOURCE_READONLY_IDENTITY_FAILED');
  }
  await client.query('begin isolation level repeatable read read only');
  try {
    await client.query("set local timezone to 'UTC'");
    const proof=await client.query("select current_setting('transaction_read_only') readonly, current_setting('transaction_isolation') isolation, transaction_timestamp()::text exported_at");
    if(proof.rows[0].readonly!=='on'||proof.rows[0].isolation!=='repeatable read')throw Error('READ_ONLY_SNAPSHOT_REQUIRED');
    if(realSource){
      const privileges=(await client.query(`select
        exists(select 1 from pg_roles r where pg_has_role(current_user,r.oid,'USAGE') and (r.rolsuper or r.rolcreaterole or r.rolcreatedb or r.rolreplication or r.rolbypassrls or r.rolname in ('supabase_auth_admin','service_role'))) elevated,
        has_database_privilege(current_database(),'CREATE') or has_schema_privilege('public','CREATE') or has_schema_privilege('auth','CREATE') ddl,
        has_database_privilege(current_database(),'CREATE') database_create,
        has_database_privilege(current_database(),'TEMP') temporary_objects,
        has_schema_privilege('public','CREATE') public_schema_create,
        has_schema_privilege('auth','CREATE') auth_schema_create,
        exists(select 1 from unnest($1::text[]) t(name) where has_table_privilege('public.'||t.name,'INSERT') or has_table_privilege('public.'||t.name,'UPDATE') or has_table_privilege('public.'||t.name,'DELETE') or has_table_privilege('public.'||t.name,'TRUNCATE') or has_table_privilege('public.'||t.name,'TRIGGER')) writes`,[TABLES])).rows[0];
      if(privileges.elevated||privileges.ddl||privileges.writes)throw Object.assign(Error('SOURCE_PRIVILEGES_NOT_READ_ONLY'),{verification:{...identity,transaction_read_only:proof.rows[0].readonly,isolation:proof.rows[0].isolation,privileges}});
      const policies=(await client.query("select tablename,policyname,permissive,roles::text roles,cmd,qual,with_check from pg_policies where schemaname='public' and policyname like 'm3_source_reader_%' order by tablename,policyname")).rows;
      const rls=(await client.query("select t.relname table_name,t.relrowsecurity enabled,t.relforcerowsecurity forced from pg_class t join pg_namespace n on n.oid=t.relnamespace where n.nspname='public' and t.relname=any($1::text[]) order by t.relname",[TABLES])).rows;
      const policyEvidence=verifySourcePolicies(policies,rls);
      const workspace=await client.query('select id from public.workspaces where id=$1',[workspaceId]);
      if(workspace.rowCount!==1)throw Error('AUTHORIZED_WORKSPACE_NOT_VISIBLE');
      if((await client.query("select current_setting('transaction_read_only') readonly")).rows[0].readonly!=='on')throw Error('READ_ONLY_SNAPSHOT_REQUIRED');
      identity={...identity,privileges,policyEvidence,workspace_verified:true,SOURCE_TEMP_PRIVILEGE:privileges.temporary_objects?'present':'absent',SOURCE_TEMP_PRIVILEGE_DECISION:privileges.temporary_objects?'ALLOWED_UNUSED_BY_HUMAN_EXCEPTION':'NOT_REQUIRED',SOURCE_TEMP_OBJECTS_CREATED:0};
    }
    for(const table of TABLES){
      const cols=(await client.query("select column_name,data_type,is_nullable,column_default from information_schema.columns where table_schema='public' and table_name=$1 order by ordinal_position",[table])).rows;
      if(!cols.length)throw Error(`SOURCE_SCHEMA_OBJECT_MISSING:${table}`);
      const constraints=(await client.query("select c.conname,pg_get_constraintdef(c.oid) definition from pg_constraint c join pg_class t on t.oid=c.conrelid join pg_namespace n on n.oid=t.relnamespace where n.nspname='public' and t.relname=$1 order by c.conname",[table])).rows;
      const indexes=(await client.query("select indexname,indexdef from pg_indexes where schemaname='public' and tablename=$1 order by indexname",[table])).rows;
      schema[table]={columns:cols,constraints,indexes};
      if(cols.some(c=>! /^[a-z_][a-z_0-9]*$/.test(c.column_name)))throw Error('UNSUPPORTED_SOURCE_COLUMN_IDENTIFIER');
      const expressions=cols.map(c=>`'${c.column_name}', ${c.data_type==='timestamp with time zone'?`to_char(t.${c.column_name},'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`:['numeric','timestamp without time zone','date','time without time zone'].includes(c.data_type)?`t.${c.column_name}::text`:`t.${c.column_name}`}`).join(',');
      let where;
      if(table==='workspaces')where='t.id=$1';
      else if(table==='profiles')where='t.id in (select user_id from public.workspace_members where workspace_id=$1) or t.id in (select created_by from public.orders where workspace_id=$1) or t.id in (select created_by from public.operations where workspace_id=$1) or t.id in (select created_by from public.transactions where workspace_id=$1) or t.id in (select actor_id from public.audit_events where workspace_id=$1) or t.id in (select opened_by from public.reconciliations where workspace_id=$1) or t.id in (select closed_by from public.reconciliations where workspace_id=$1)';
      else if(table==='reconciliation_entries'||table==='reconciliation_fund_snapshots')where='t.reconciliation_id in (select id from public.reconciliations where workspace_id=$1)';
      else where='t.workspace_id=$1';
      tables[table]=(await client.query(`select jsonb_build_object(${expressions}) row from public.${table} t where ${where}`,[workspaceId])).rows.map(r=>r.row);
    }
    const snapshot=makeSnapshot(tables,{source_id:sourceId,source_kind:realSource?'authorized-real-legacy-export':'local-legacy-export',source_workspace_id:workspaceId,exported_at:proof.rows[0].exported_at,schema_fingerprint:hash(schema),schema,transaction_evidence:{...proof.rows[0],identity}});
    await client.query('commit');return snapshot;
  }catch(e){await client.query('rollback');throw e;}
}
