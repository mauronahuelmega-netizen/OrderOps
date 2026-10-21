WITH expected(original_index, schema_name, table_name, trigger_name) AS (VALUES
 (18, 'public', 'business_settings', 'handle_business_settings_updated_at'),
 (19, 'public', 'customization_groups', 'handle_customization_groups_updated_at'),
 (20, 'public', 'customization_options', 'handle_customization_options_updated_at'),
 (21, 'public', 'customization_group_assignments', 'handle_customization_group_assignments_updated_at'),
 (22, 'public', 'product_customization_overrides', 'handle_product_customization_overrides_updated_at'),
 (23, 'public', 'upsell_groups', 'handle_upsell_groups_updated_at'),
 (24, 'public', 'upsell_group_items', 'handle_upsell_group_items_updated_at'),
 (25, 'public', 'order_financials', 'handle_order_financials_updated_at'),
 (28, 'public', 'finance_accounts', 'handle_finance_accounts_updated_at'),
 (29, 'public', 'finance_categories', 'handle_finance_categories_updated_at'),
 (31, 'public', 'finance_funds', 'handle_finance_funds_updated_at'),
 (33, 'public', 'business_finance_settings', 'handle_business_finance_settings_updated_at'),
 (38, 'public', 'finance_transactions', 'handle_finance_transactions_updated_at')
), rows AS (
 SELECT e.*, t.oid AS trigger_oid, t.tgfoid,
  pg_catalog.jsonb_build_object(
   'originalIndex',e.original_index,'schema',e.schema_name,'table',e.table_name,'name',e.trigger_name,
   'triggerOid',t.oid::text,'tableOid',c.oid::text,'tableKind',c.relkind::text,
   'tgfoid',t.tgfoid::text,'tgparentid',t.tgparentid::text,'tgtype',t.tgtype::integer,'tgenabled',t.tgenabled::text,
   'tgisinternal',t.tgisinternal,'tgconstrrelid',t.tgconstrrelid::text,'tgconstrindid',t.tgconstrindid::text,
   'tgconstraint',t.tgconstraint::text,'tgdeferrable',t.tgdeferrable,'tginitdeferred',t.tginitdeferred,
   'tgnargs',t.tgnargs::integer,'tgattr',t.tgattr::text,
   'argumentMatches',t.tgargs=pg_catalog.decode('757064617465645f617400','hex'),
   'argumentHex',CASE WHEN t.tgargs=pg_catalog.decode('757064617465645f617400','hex') THEN pg_catalog.encode(t.tgargs,'hex') END,
   'argumentBytes',pg_catalog.octet_length(t.tgargs),'argumentMd5',pg_catalog.md5(t.tgargs),
   'hasWhen',t.tgqual IS NOT NULL,'whenMd5',pg_catalog.md5(t.tgqual::text),
   'hasOldTransition',t.tgoldtable IS NOT NULL,'hasNewTransition',t.tgnewtable IS NOT NULL
   ) || pg_catalog.jsonb_build_object(
   'functionOid',p.oid::text,'functionSchema',fn.nspname,'functionName',p.proname,
   'functionIdentityArguments',pg_catalog.pg_get_function_identity_arguments(p.oid),
   'functionArgumentOids',p.proargtypes::text,'functionNargs',p.pronargs::integer,'functionKind',p.prokind::text,
   'returnTypeOid',p.prorettype::text,'returnsTrigger',p.prorettype='pg_catalog.trigger'::pg_catalog.regtype,
   'language',l.lanname,'languageOid',p.prolang::text,'owner',pg_catalog.pg_get_userbyid(p.proowner),
   'securityDefiner',p.prosecdef,'strict',p.proisstrict,'leakproof',p.proleakproof,'returnsSet',p.proretset,
   'volatility',p.provolatile::text,'parallel',p.proparallel::text,
   'configIsNull',p.proconfig IS NULL,'configMd5',pg_catalog.md5(pg_catalog.array_to_string(p.proconfig,E'\n')),
   'acl',p.proacl::text,'sourceMatches',p.prosrc='moddatetime','binaryMatches',p.probin='$libdir/moddatetime',
   'sourceMd5',pg_catalog.md5(p.prosrc),'binaryMd5',pg_catalog.md5(p.probin),
   'functionDefinitionMd5',CASE WHEN p.prokind='f' THEN pg_catalog.md5(pg_catalog.pg_get_functiondef(p.oid)) END,
   'extensionMembership',ext.memberships,
   'functionVisible',pg_catalog.pg_function_is_visible(p.oid),
   'definition',CASE WHEN t.tgargs=pg_catalog.decode('757064617465645f617400','hex') AND t.tgqual IS NULL
    AND t.tgconstraint=0 AND t.tgoldtable IS NULL AND t.tgnewtable IS NULL
    AND fn.nspname='extensions' AND p.proname='moddatetime' AND p.pronargs=0
    THEN pg_catalog.pg_get_triggerdef(t.oid,false) END
  ) AS payload,
  coalesce(t.oid IS NOT NULL AND c.relkind='r' AND t.tgtype=19 AND t.tgenabled='O' AND NOT t.tgisinternal
   AND t.tgparentid=0 AND t.tgconstrrelid=0 AND t.tgconstrindid=0 AND t.tgconstraint=0
   AND NOT t.tgdeferrable AND NOT t.tginitdeferred AND t.tgnargs=1 AND t.tgattr::text=''
   AND t.tgargs=pg_catalog.decode('757064617465645f617400','hex') AND t.tgqual IS NULL
   AND t.tgoldtable IS NULL AND t.tgnewtable IS NULL
   AND fn.nspname='extensions' AND p.proname='moddatetime' AND p.pronargs=0 AND p.prokind='f'
   AND p.prorettype='pg_catalog.trigger'::pg_catalog.regtype AND l.lanname='c'
   AND NOT p.prosecdef AND NOT p.proretset AND NOT p.proleakproof AND NOT p.proisstrict
   AND p.provolatile='v' AND p.proparallel='u' AND p.proconfig IS NULL
   AND p.prosrc='moddatetime' AND p.probin='$libdir/moddatetime'
   AND p.oid=pg_catalog.to_regprocedure('extensions.moddatetime()')::pg_catalog.oid
   AND ext.count_memberships=1 AND ext.expected_membership,false) AS row_ok
 FROM expected e
 LEFT JOIN pg_catalog.pg_namespace n ON n.nspname=e.schema_name
 LEFT JOIN pg_catalog.pg_class c ON c.relnamespace=n.oid AND c.relname=e.table_name
 LEFT JOIN pg_catalog.pg_trigger t ON t.tgrelid=c.oid AND t.tgname=e.trigger_name
 LEFT JOIN pg_catalog.pg_proc p ON p.oid=t.tgfoid
 LEFT JOIN pg_catalog.pg_namespace fn ON fn.oid=p.pronamespace
 LEFT JOIN pg_catalog.pg_language l ON l.oid=p.prolang
 LEFT JOIN LATERAL (SELECT count(*) AS count_memberships,
  coalesce(pg_catalog.bool_and(ex.extname='moddatetime' AND xn.nspname='extensions'),false) AS expected_membership,
  pg_catalog.json_agg(pg_catalog.json_build_object('oid',ex.oid::text,'name',ex.extname,'schema',xn.nspname,'version',ex.extversion,'dependencyType',dep.deptype::text) ORDER BY ex.oid) AS memberships
  FROM pg_catalog.pg_depend dep JOIN pg_catalog.pg_extension ex ON ex.oid=dep.refobjid
  JOIN pg_catalog.pg_namespace xn ON xn.oid=ex.extnamespace
  WHERE dep.classid='pg_catalog.pg_proc'::pg_catalog.regclass AND dep.objid=p.oid AND dep.objsubid=0
   AND dep.refclassid='pg_catalog.pg_extension'::pg_catalog.regclass AND dep.deptype='e'
 ) ext ON true
)
SELECT pg_catalog.json_build_object('label',:'frame_label',
 'searchPath',pg_catalog.current_setting('search_path'),'effectiveSchemas',pg_catalog.current_schemas(false),
 'expectedFunctionOid',pg_catalog.to_regprocedure('extensions.moddatetime()')::pg_catalog.oid::text,
 'resolvedUnqualifiedFunctionOid',pg_catalog.to_regprocedure('moddatetime()')::pg_catalog.oid::text,
 'rows',(SELECT pg_catalog.json_agg(payload ORDER BY original_index) FROM rows));
