begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(1);

do $$
declare
  v_business constant uuid := 'a2000000-0000-4000-8000-000000000001';
  v_other constant uuid := 'a2000000-0000-4000-8000-000000000002';
  v_user constant uuid := 'a2100000-0000-4000-8000-000000000001';
  v_account constant uuid := 'a2200000-0000-4000-8000-000000000001';
  v_fund constant uuid := 'a2300000-0000-4000-8000-000000000001';
  v_context jsonb;
  v_reference jsonb;
  v_dashboard jsonb;
begin
  insert into public.businesses (id, name, slug, whatsapp_number) values
    (v_business, 'M2 Shared', 'm2-shared', '5491100000801'),
    (v_other, 'M2 Other', 'm2-other', '5491100000802');
  insert into auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
  values ('00000000-0000-0000-0000-000000000000',v_user,'authenticated','authenticated','owner@m2.test','test',now(),'{}','{}',now(),now());
  insert into public.profiles (id,business_id,role) values (v_user,v_business,'owner');
  update public.business_settings set timezone='America/Argentina/Buenos_Aires', finance_enabled=true where business_id=v_business;
  insert into public.finance_accounts (id,business_id,name,kind) values (v_account,v_business,'M2 Account','other');
  insert into public.finance_funds (id,business_id,account_id,name,fund_type,area_hint,active)
  values (v_fund,v_business,v_account,'M2 Operating','business_operating','business',true);
  insert into public.business_finance_settings (business_id,protection_account_id,default_operating_fund_id)
  values (v_business,v_account,v_fund);

  perform set_config('request.jwt.claim.sub',v_user::text,true);
  v_context := public.current_business_context();
  if v_context->'business'->>'id' <> v_business::text or not (v_context->>'finance_enabled')::boolean then
    raise exception 'current business context mismatch';
  end if;
  v_reference := public.finance_reference_data(v_business);
  if jsonb_array_length(v_reference->'accounts') <> 1 or jsonb_array_length(v_reference->'funds') <> 1 then
    raise exception 'reference data mismatch';
  end if;
  v_dashboard := public.finance_dashboard_summary(v_business);
  if (v_dashboard->>'managed_business_balance')::numeric <> 0 then raise exception 'empty dashboard mismatch'; end if;
  if public.finance_transaction_search(v_business,null,50,0)->>'total' <> '0' then raise exception 'empty search mismatch'; end if;
  if public.business_order_finance_summaries(v_business,100) <> '[]'::jsonb then raise exception 'empty order read mismatch'; end if;
  if public.finance_reconciliation_list(v_business) <> '[]'::jsonb then raise exception 'empty reconciliation read mismatch'; end if;
  begin
    perform public.finance_reference_data(v_other);
    raise exception 'cross tenant read unexpectedly succeeded';
  exception when sqlstate '42501' then null;
  end;
end;
$$;

select extensions.pass('M2 shared read contracts are tenant-safe and return canonical empty-domain shapes');
select * from extensions.finish();
rollback;
