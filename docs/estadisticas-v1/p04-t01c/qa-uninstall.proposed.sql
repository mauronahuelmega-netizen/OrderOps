-- PROPOSED ONLY. Execute only after matching approved installed catalog hash and stopping owned QA traffic.
-- No CASCADE, original function replacement or financial-data deletion.
begin;
set local statement_timeout='15s';
set local lock_timeout='3s';
do $guard$ begin
 if to_regclass('statistics_test_environment.identity') is null then raise exception 'QA_IDENTITY_REQUIRED';end if;
 if (select md5(token) from statistics_test_environment.identity where singleton) is distinct from '8205c0ec377b2f7bae6871f549b9a1db' then raise exception 'QA_IDENTITY_MISMATCH';end if;
 if (select count(*) from supabase_migrations.schema_migrations)<>124 then raise exception 'QA_LEDGER_MISMATCH';end if;
 if not has_schema_privilege('authenticated','private','USAGE') then raise exception 'QA_EXISTING_SCHEMA_USAGE_REQUIRED';end if;
end $guard$;
do $ownership$ begin
 if obj_description('public.statistics_products_qa_access'::regclass,'pg_class') is distinct from 'P04-T01C-QA1; QA ONLY; default closed; fixed synthetic principal pairs; no commercial data' then raise exception 'QA_ROLLBACK_OWNERSHIP_MISMATCH';end if;
end $ownership$;
drop function public.statistics_v1_products(text,date,date,text,integer,jsonb);
drop function private.statistics_v1_products_reader(text,date,date,text,integer,jsonb);
drop function private.statistics_products_metric(numeric,bigint,bigint,bigint,bigint);
drop function private.statistics_products_qa_can_query(uuid);
drop table public.statistics_products_qa_access;
notify pgrst,'reload schema';
commit;
