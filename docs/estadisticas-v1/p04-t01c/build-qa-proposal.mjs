// Preparation only: emits proposed SQL. Never connects, migrates, starts services or changes grants.
import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';
const dir='docs/estadisticas-v1/p04-t01c/',source='docs/estadisticas-v1/p04-t01b-fix/candidate-products-fixed.sql';const hash=s=>createHash('sha256').update(s).digest('hex');const sql=fs.readFileSync(source,'utf8');assert.equal(hash(sql),'57395a7920d95cf63c1b67fb8191e40272a26aeb445a4abe7bec4d822b99c2c1');
const m=JSON.parse(fs.readFileSync('supabase/statistics-v1-test/.runtime/manifest.json')),creds=JSON.parse(fs.readFileSync('supabase/statistics-v1-test/.runtime/credentials.local.json'));const project='orderops-statistics-v1-test-74718de66a41';assert.equal(m.projectId,project);assert.equal(creds.projectId,project);assert.equal(JSON.parse(fs.readFileSync(dir+'preflight.json')).result,'PASS');
const principals=creds.users.filter(u=>['owner','manager','admin'].includes(u.role)).map(u=>({userId:u.id,businessId:creds.businesses[u.business],role:u.role}));assert.equal(principals.length,6);for(const p of principals){assert.match(p.userId,/^[a-f0-9-]{36}$/);assert.match(p.businessId,/^[a-f0-9-]{36}$/);}
const pairList=principals.map(p=>`('${p.userId}'::uuid,'${p.businessId}'::uuid)`).join(',\n   ');const markerMd5=createHash('md5').update(m.token).digest('hex');
const identityGuard=`do $guard$ begin
 if to_regclass('statistics_test_environment.identity') is null then raise exception 'QA_IDENTITY_REQUIRED';end if;
 if (select md5(token) from statistics_test_environment.identity where singleton) is distinct from '${markerMd5}' then raise exception 'QA_IDENTITY_MISMATCH';end if;
 if (select count(*) from supabase_migrations.schema_migrations)<>124 then raise exception 'QA_LEDGER_MISMATCH';end if;
 if not has_schema_privilege('authenticated','private','USAGE') then raise exception 'QA_EXISTING_SCHEMA_USAGE_REQUIRED';end if;
end $guard$;`;
const declarations=`-- PROPOSAL ONLY. QA configuration, not a sixth analytical data source or cache.
create table public.statistics_products_qa_access (
 user_id uuid not null references public.profiles(id) on delete cascade,
 business_id uuid not null references public.businesses(id) on delete cascade,
 project_id text not null default '${project}' check(project_id='${project}'),
 enabled boolean not null default false,
 expires_at timestamptz,
 primary key(user_id,business_id),
 check(expires_at is null or isfinite(expires_at)),
 check(not enabled or expires_at is not null),
 check((user_id,business_id) in (
   ${pairList}
 ))
);
alter table public.statistics_products_qa_access enable row level security;
revoke all on public.statistics_products_qa_access from public,anon,authenticated,service_role;
grant select on public.statistics_products_qa_access to authenticated;
create policy statistics_products_qa_access_self on public.statistics_products_qa_access for select to authenticated
 using(user_id=auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid() and p.business_id=statistics_products_qa_access.business_id and p.role in ('owner','manager','admin')));
comment on table public.statistics_products_qa_access is 'P04-T01C-QA1; QA ONLY; default closed; fixed synthetic principal pairs; no commercial data';
create function private.statistics_products_qa_can_query(p_business uuid) returns boolean language sql stable security invoker
set search_path=pg_catalog,public as $$
 select exists(select 1 from public.statistics_products_qa_access q join public.profiles p on p.id=q.user_id and p.business_id=q.business_id
 where q.project_id='${project}' and q.user_id=auth.uid() and q.business_id=p_business and p.role in ('owner','manager','admin')
 and q.enabled and q.expires_at>statement_timestamp());
$$;
revoke all on function private.statistics_products_qa_can_query(uuid) from public,anon,authenticated,service_role;
grant execute on function private.statistics_products_qa_can_query(uuid) to authenticated;
`;
const anchor="raise exception 'STATISTICS_ACCESS_DENIED' using errcode='42501';end if;";assert.equal(sql.split(anchor).length,2);
const gate="\n if not private.statistics_products_qa_can_query(v_business) then\n  raise exception 'STATISTICS_PRODUCTS_NOT_PUBLISHED' using errcode='42501';end if;";
const gated=sql.replace(anchor,anchor+gate);assert.equal(gated.replace(gate,''),sql);fs.writeFileSync(dir+'candidate-products-qa-gated.proposed.sql',gated);
const payload=gated.replace(/^begin;\r?\n/m,'').replace(/^commit;\r?\n?$/m,'');const collision=`do $collision$ begin
 if to_regclass('public.statistics_products_qa_access') is not null or to_regprocedure('private.statistics_products_qa_can_query(uuid)') is not null
 or to_regprocedure('public.statistics_v1_products(text,date,date,text,integer,jsonb)') is not null
 or to_regprocedure('private.statistics_v1_products_reader(text,date,date,text,integer,jsonb)') is not null
 or to_regprocedure('private.statistics_products_metric(numeric,bigint,bigint,bigint,bigint)') is not null then raise exception 'QA_OBJECT_COLLISION';end if;
end $collision$;`;
const install="-- PREPARATION ONLY. New hash needs explicit authorization before persistent execution.\nbegin;\nset local statement_timeout='15s';\nset local lock_timeout='3s';\n"+identityGuard+'\n'+collision+'\n'+declarations+'\n'+payload+"\n-- Empty config remains closed even after installation. No release ledger row appended.\nnotify pgrst,'reload schema';\ncommit;\n";fs.writeFileSync(dir+'qa-install.proposed.sql',install);
const enable="-- SEPARATE PROPOSAL. Not part of installation; not authorized now.\nbegin;\nset local statement_timeout='15s';\nset local lock_timeout='3s';\n"+identityGuard+"\ninsert into public.statistics_products_qa_access(user_id,business_id,enabled,expires_at) values\n"+principals.map(p=>`('${p.userId}','${p.businessId}',true,statement_timestamp()+interval '30 minutes')`).join(',\n')+"\n on conflict(user_id,business_id) do update set enabled=excluded.enabled,expires_at=excluded.expires_at;\ncommit;\n";fs.writeFileSync(dir+'qa-enable-synthetic.proposed.sql',enable);
const disable="-- Reversible QA-only publication closure. Requires explicit future authorization.\nbegin;\nset local statement_timeout='15s';\nset local lock_timeout='3s';\n"+identityGuard+"\nupdate public.statistics_products_qa_access set enabled=false;\ncommit;\n";fs.writeFileSync(dir+'qa-disable.proposed.sql',disable);
const rollback="-- PROPOSED ONLY. Execute only after matching approved installed catalog hash and stopping owned QA traffic.\n-- No CASCADE, original function replacement or financial-data deletion.\nbegin;\nset local statement_timeout='15s';\nset local lock_timeout='3s';\n"+identityGuard+"\n"+"do $ownership$ begin\n if obj_description('public.statistics_products_qa_access'::regclass,'pg_class') is distinct from 'P04-T01C-QA1; QA ONLY; default closed; fixed synthetic principal pairs; no commercial data' then raise exception 'QA_ROLLBACK_OWNERSHIP_MISMATCH';end if;\nend $ownership$;\n"+"drop function public.statistics_v1_products(text,date,date,text,integer,jsonb);\ndrop function private.statistics_v1_products_reader(text,date,date,text,integer,jsonb);\ndrop function private.statistics_products_metric(numeric,bigint,bigint,bigint,bigint);\ndrop function private.statistics_products_qa_can_query(uuid);\ndrop table public.statistics_products_qa_access;\nnotify pgrst,'reload schema';\ncommit;\n";fs.writeFileSync(dir+'qa-uninstall.proposed.sql',rollback);
const diff=spawnSync('git',['diff','--no-index','--no-ext-diff','--',source,dir+'candidate-products-qa-gated.proposed.sql'],{encoding:'utf8'});assert.equal(diff.status,1);fs.writeFileSync(dir+'qa-reader-gate.diff',diff.stdout);
fs.writeFileSync(dir+'qa-proposal-manifest.json',JSON.stringify({at:new Date().toISOString(),source,sourceSha256:hash(sql),projectId:project,qaRevision:'P04-T01C-QA1',principals,policy:'Default empty/closed; fixed six synthetic principal pairs; enabled and expiry required; original role independently required',sourceChanges:['One SQL-only publication guard in private reader; no financial expression change'],newObjects:['public.statistics_products_qa_access table','statistics_products_qa_access_self SELECT RLS policy','private.statistics_products_qa_can_query(uuid)','three Products functions'],existingObjectsAltered:[],releaseLedgerChange:false,requiresNewHashAuthorization:true,sqlExecuted:false,files:['candidate-products-qa-gated.proposed.sql','qa-install.proposed.sql','qa-enable-synthetic.proposed.sql','qa-disable.proposed.sql','qa-uninstall.proposed.sql'].map(file=>({path:dir+file,sha256:hash(fs.readFileSync(dir+file))}))},null,2)+'\n');console.log('QA proposal emitted, config empty/closed, six pinned synthetic pairs, no SQL executed.');
