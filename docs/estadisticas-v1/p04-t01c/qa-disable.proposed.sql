-- Reversible QA-only publication closure. Requires explicit future authorization.
begin;
set local statement_timeout='15s';
set local lock_timeout='3s';
do $guard$ begin
 if to_regclass('statistics_test_environment.identity') is null then raise exception 'QA_IDENTITY_REQUIRED';end if;
 if (select md5(token) from statistics_test_environment.identity where singleton) is distinct from '8205c0ec377b2f7bae6871f549b9a1db' then raise exception 'QA_IDENTITY_MISMATCH';end if;
 if (select count(*) from supabase_migrations.schema_migrations)<>124 then raise exception 'QA_LEDGER_MISMATCH';end if;
 if not has_schema_privilege('authenticated','private','USAGE') then raise exception 'QA_EXISTING_SCHEMA_USAGE_REQUIRED';end if;
end $guard$;
update public.statistics_products_qa_access set enabled=false;
commit;
