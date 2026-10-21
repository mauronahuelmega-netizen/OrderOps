BEGIN READ ONLY;SET LOCAL statement_timeout='15s';SET LOCAL lock_timeout='3s';
SELECT json_build_object(
'functions',(SELECT json_agg(json_build_object('signature',sig,'installed',to_regprocedure(sig) is not null)) FROM unnest(ARRAY['private.statistics_products_metric(numeric,bigint,bigint,bigint,bigint)','private.statistics_v1_products_reader(text,date,date,text,integer,jsonb)','public.statistics_v1_products(text,date,date,text,integer,jsonb)','private.statistics_products_qa_can_query(uuid)'])sig),
'newConfigAbsent',to_regclass('public.statistics_products_qa_access') is null,
'schemaUsage',(SELECT json_agg(json_build_object('role',r,'public',has_schema_privilege(r,'public','USAGE'),'private',has_schema_privilege(r,'private','USAGE'))) FROM unnest(ARRAY['anon','authenticated','service_role'])r),
'originalSummary',(SELECT json_agg(json_build_object('role',r,'execute',has_function_privilege(r,'public.statistics_v1_summary(text,date,date,text,integer,jsonb)','EXECUTE'))) FROM unnest(ARRAY['anon','authenticated','service_role'])r),
'roleFlags',(SELECT json_agg(json_build_object('role',rolname,'superuser',rolsuper,'bypassRls',rolbypassrls,'canLogin',rolcanlogin)) FROM pg_roles WHERE rolname IN ('anon','authenticated','service_role','authenticator')),
'sourceRls',(SELECT json_agg(json_build_object('relation',oid::regclass::text,'rls',relrowsecurity,'acl',relacl::text)) FROM pg_class WHERE oid IN ('public.profiles'::regclass,'public.statistics_v1_effective_facts'::regclass,'public.order_statistics_completions'::regclass,'public.order_statistics_completion_items'::regclass)),
'readOnly',current_setting('transaction_read_only'));
ROLLBACK;