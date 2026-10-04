begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(1);
do $$
declare
  b constant uuid := 'd3000000-0000-4000-8000-000000000001';
  o constant uuid := 'd3000000-0000-4000-8000-000000000002';
  e constant uuid := 'd3000000-0000-4000-8000-000000000003';
  r constant uuid := 'd3000000-0000-4000-8000-000000000004';
  u constant uuid := 'd3000000-0000-4000-8000-000000000005';
  x constant uuid := 'd3000000-0000-4000-8000-000000000006';
  failed boolean;
begin
  insert into public.businesses(id,name,slug,whatsapp_number) values(b,'M3 local test','m3-provenance-test','5491100000000');
  insert into migration_private.runs(id,business_id,snapshot_hash,rules_hash,config_hash,dataset_hash)
    values(r,b,repeat('a',64),repeat('b',64),repeat('c',64),repeat('d',64));
  insert into migration_private.evidence(id,run_id,business_id,source_table,source_id,source_hash,target_table,target_id,classification,rule,source_row)
    values(e,r,b,'orders','legacy-test',repeat('e',64),'orders',o,'TRANSFORMED_WITH_EXPLICIT_RULE','explicit historical absence','{"client_name":"M3 synthetic"}');
  failed:=false;
  begin
    insert into public.orders(id,business_id,order_code,customer_name,phone,delivery_method,composition_status,total_price,status)
      values(x,b,'M3TSTA','Native must reject','5491100000000','pickup','legacy_unknown',null,'pending');
  exception when check_violation then failed:=true; end;
  if not failed then raise exception 'native NULL delivery date accepted'; end if;
  insert into public.orders(id,business_id,order_code,customer_name,composition_status,total_price,status,migration_evidence_id)
    values(o,b,'M3TSTB','M3 synthetic','legacy_unknown',null,'pending',e);
  if exists(select 1 from public.orders where id=o and (phone is not null or delivery_date is not null or delivery_method is not null)) then raise exception 'historical field invented'; end if;
  failed:=false;
  begin update public.orders set migration_evidence_id=null where id=o;
  exception when check_violation then failed:=true; end;
  if not failed then raise exception 'provenance removable'; end if;
  failed:=false;
  begin insert into public.orders(id,business_id,order_code,customer_name,composition_status,total_price,status,migration_evidence_id)
    values(x,b,'M3TSTC','Evidence mismatch','legacy_unknown',null,'pending',e);
  exception when check_violation then failed:=true; end;
  if not failed then raise exception 'evidence reused for another target'; end if;
  failed:=false;
  begin insert into public.finance_operations(business_id,operation_type,client_request_id,request_hash,created_by)
    values(b,'income',x,'native-null-actor',null);
  exception when check_violation then failed:=true; end;
  if not failed then raise exception 'native NULL actor accepted'; end if;
  insert into auth.users(id,email,raw_app_meta_data,raw_user_meta_data) values(u,'m3-native@synthetic.test','{}','{}');
  insert into public.profiles(id,business_id,role) values(u,b,'owner');
  perform set_config('request.jwt.claim.sub',u::text,true);
  perform set_config('role','authenticated',true);
  failed:=false;
  begin insert into public.orders(id,business_id,order_code,customer_name,composition_status,total_price,status,migration_evidence_id)
    values(x,b,'M3TSTD','Runtime forgery','legacy_unknown',null,'pending',e);
  exception when insufficient_privilege then failed:=true; end;
  if not failed then raise exception 'authenticated forged imported identity'; end if;
  failed:=false;
  begin perform 1 from migration_private.evidence;
  exception when insufficient_privilege then failed:=true; end;
  if not failed then raise exception 'historical private PII readable'; end if;
  perform set_config('role','postgres',true);
  if exists(select 1 from public.business_settings where business_id=b and finance_enabled) then raise exception 'finance enabled persistently'; end if;
  if pg_get_functiondef('public.business_order_finance_summaries(uuid,integer)'::regprocedure)
    not like '%delivery_date desc nulls last, o.created_at desc, o.id desc%'
    or pg_get_functiondef('public.business_order_finance_summaries(uuid,integer)'::regprocedure)
    not like '%delivery_date desc nulls last, created_at desc, id desc limit p_limit%'
  then raise exception 'historical general list ordering is not explicit/deterministic'; end if;
end;
$$;
select extensions.pass('M3 isolated provenance, native required fields, actor guards and runtime privacy');
select * from extensions.finish();
rollback;
