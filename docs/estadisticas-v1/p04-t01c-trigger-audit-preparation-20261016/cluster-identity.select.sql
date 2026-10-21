SELECT pg_catalog.json_build_object('markerVerified',true,'ledger',124,
 'database',pg_catalog.current_database(),'user',current_user,
 'readOnly',pg_catalog.current_setting('transaction_read_only'),'isolation',pg_catalog.current_setting('transaction_isolation'),
 'serverVersionNum',pg_catalog.current_setting('server_version_num'),
 'systemIdentifier',s.system_identifier::text) FROM pg_catalog.pg_control_system() s;
