-- SEPARATE PROPOSAL. Not part of installation; not authorized now.
begin;
set local statement_timeout='15s';
set local lock_timeout='3s';
do $guard$ begin
 if to_regclass('statistics_test_environment.identity') is null then raise exception 'QA_IDENTITY_REQUIRED';end if;
 if (select md5(token) from statistics_test_environment.identity where singleton) is distinct from '8205c0ec377b2f7bae6871f549b9a1db' then raise exception 'QA_IDENTITY_MISMATCH';end if;
 if (select count(*) from supabase_migrations.schema_migrations)<>124 then raise exception 'QA_LEDGER_MISMATCH';end if;
 if not has_schema_privilege('authenticated','private','USAGE') then raise exception 'QA_EXISTING_SCHEMA_USAGE_REQUIRED';end if;
end $guard$;
insert into public.statistics_products_qa_access(user_id,business_id,enabled,expires_at) values
('a9eea14b-6c1c-4631-9a0e-4c6c62efe501','108722c0-a80f-4d5b-98ee-6c99f44cdb23',true,statement_timestamp()+interval '30 minutes'),
('6d1a696a-d974-4ad6-809d-a5715f90d816','108722c0-a80f-4d5b-98ee-6c99f44cdb23',true,statement_timestamp()+interval '30 minutes'),
('4f81b68b-fc92-4865-88a8-bd59372b45f8','108722c0-a80f-4d5b-98ee-6c99f44cdb23',true,statement_timestamp()+interval '30 minutes'),
('bb729a71-be76-4ff7-a7f6-0edd33361097','ea72a875-7511-4c1d-9d2c-c3f899b94bea',true,statement_timestamp()+interval '30 minutes'),
('1ef472c5-3f84-4118-b486-ff2796f1992c','ea72a875-7511-4c1d-9d2c-c3f899b94bea',true,statement_timestamp()+interval '30 minutes'),
('a63714a3-afc5-490c-b114-8abc68d45621','ea72a875-7511-4c1d-9d2c-c3f899b94bea',true,statement_timestamp()+interval '30 minutes')
 on conflict(user_id,business_id) do update set enabled=excluded.enabled,expires_at=excluded.expires_at;
commit;
