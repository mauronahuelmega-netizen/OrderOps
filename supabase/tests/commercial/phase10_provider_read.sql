-- Talo First L3. Rolls back. Authenticated read -> evidence -> automatic activation imputation.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '20202020-2020-4020-8020-202020202001', 'authenticated', 'authenticated', 'p10read-super@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '20202020-2020-4020-8020-202020202002', 'authenticated', 'authenticated', 'p10read-promoter@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());
insert into commercial.platform_accounts (id, user_id, kind) values
  ('20202020-2020-4020-8020-202020202011', '20202020-2020-4020-8020-202020202001', 'internal'),
  ('20202020-2020-4020-8020-202020202012', '20202020-2020-4020-8020-202020202002', 'promoter');
insert into commercial.internal_role_assignments (account_id, role) values
  ('20202020-2020-4020-8020-202020202011', 'superadmin');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('20202020-2020-4020-8020-202020202021', '20202020-2020-4020-8020-202020202012', 'p10r000021', 'Promotor Lectura', 'active');
insert into public.businesses (id, name, slug, whatsapp_number) values
  ('20202020-2020-4020-8020-202020202031', 'Negocio Lectura A', 'negocio-lectura-a', '5491100202031'),
  ('20202020-2020-4020-8020-202020202032', 'Negocio Lectura C', 'negocio-lectura-c', '5491100202032'),
  ('20202020-2020-4020-8020-202020202033', 'Negocio Lectura D', 'negocio-lectura-d', '5491100202033'),
  ('20202020-2020-4020-8020-202020202034', 'Negocio Lectura E', 'negocio-lectura-e', '5491100202034');
insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel) values
  ('20202020-2020-4020-8020-202020202041', 'Lead Lectura A', 'lead lectura a', 'promoter'),
  ('20202020-2020-4020-8020-202020202042', 'Lead Lectura C1', 'lead lectura c1', 'promoter'),
  ('20202020-2020-4020-8020-202020202043', 'Lead Lectura C2', 'lead lectura c2', 'promoter'),
  ('20202020-2020-4020-8020-202020202044', 'Lead Lectura E', 'lead lectura e', 'promoter');
insert into commercial.commercial_opportunities (id, commercial_business_id, stage, owner_account_id) values
  ('20202020-2020-4020-8020-202020202051', '20202020-2020-4020-8020-202020202041', 'demo_done', '20202020-2020-4020-8020-202020202012'),
  ('20202020-2020-4020-8020-202020202052', '20202020-2020-4020-8020-202020202042', 'demo_done', '20202020-2020-4020-8020-202020202012'),
  ('20202020-2020-4020-8020-202020202053', '20202020-2020-4020-8020-202020202043', 'demo_done', '20202020-2020-4020-8020-202020202012'),
  ('20202020-2020-4020-8020-202020202054', '20202020-2020-4020-8020-202020202044', 'demo_done', '20202020-2020-4020-8020-202020202012');
insert into commercial.opportunity_attributions (id, opportunity_id, promoter_id, status, method, reason) values
  ('20202020-2020-4020-8020-202020202061', '20202020-2020-4020-8020-202020202051', '20202020-2020-4020-8020-202020202021', 'confirmed', 'manual', 'fixture'),
  ('20202020-2020-4020-8020-202020202062', '20202020-2020-4020-8020-202020202052', '20202020-2020-4020-8020-202020202021', 'confirmed', 'manual', 'fixture'),
  ('20202020-2020-4020-8020-202020202063', '20202020-2020-4020-8020-202020202053', '20202020-2020-4020-8020-202020202021', 'confirmed', 'manual', 'fixture'),
  ('20202020-2020-4020-8020-202020202064', '20202020-2020-4020-8020-202020202054', '20202020-2020-4020-8020-202020202021', 'confirmed', 'manual', 'fixture');

-- Simulates a claimed notice; claiming itself is covered by phase10_webhook_inbox.
create function pg_temp.claimed(p_customer text, p_tx text) returns uuid
language plpgsql as $$
declare v jsonb; v_id uuid;
begin
  v := public.system_enqueue_provider_webhook('talo', 'sandbox', p_customer, p_tx, false);
  v_id := (v->>'inbox_id')::uuid;
  update commercial.provider_webhook_inbox
  set status = 'processing', locked_at = now(), attempts = attempts + 1, next_attempt_at = now()
  where id = v_id and status in ('pending', 'retry');
  return v_id;
end;
$$;

create function pg_temp.digest() returns text language sql as $$ select repeat('ab', 32) $$;

do $$
declare
  v jsonb;
  v_win jsonb;
  v_terms_a uuid;
  v_inbox uuid;
  v_receipt commercial.provider_receipts%rowtype;
  v_collection commercial.platform_collections%rowtype;
  v_row commercial.provider_webhook_inbox%rowtype;
  v_count int;
  v_ts timestamptz := timestamptz '2026-10-20 15:00:00+00';
begin
  perform set_config('request.jwt.claim.sub', '20202020-2020-4020-8020-202020202001', true);
  v_win := commercial.win_opportunity('20202020-2020-4020-8020-202020202051', '20202020-2020-4020-8020-202020202031', null);
  if v_win->>'status' is distinct from 'won' then raise exception 'win a %', v_win; end if;
  v_terms_a := (v_win->>'conversion_terms_id')::uuid;
  v_win := commercial.win_opportunity('20202020-2020-4020-8020-202020202052', '20202020-2020-4020-8020-202020202032', null);
  v_win := commercial.win_opportunity('20202020-2020-4020-8020-202020202053', '20202020-2020-4020-8020-202020202032', null);
  if v_win->>'status' is distinct from 'won' then raise exception 'win c2 %', v_win; end if;
  v_win := commercial.win_opportunity('20202020-2020-4020-8020-202020202054', '20202020-2020-4020-8020-202020202034', null);
  perform set_config('request.jwt.claim.sub', '', true);

  perform public.system_link_provider_customer('20202020-2020-4020-8020-202020202031', 'talo', 'sandbox', 'p10r-a', '0000000000000000202031', 'p10r.a');
  perform public.system_link_provider_customer('20202020-2020-4020-8020-202020202032', 'talo', 'sandbox', 'p10r-c', '0000000000000000202032', 'p10r.c');
  perform public.system_link_provider_customer('20202020-2020-4020-8020-202020202033', 'talo', 'sandbox', 'p10r-d', '0000000000000000202033', 'p10r.d');
  perform public.system_link_provider_customer('20202020-2020-4020-8020-202020202034', 'talo', 'sandbox', 'p10r-e', '0000000000000000202034', 'p10r.e');

  -- Unprocessed, undated or incomplete reads never confirm: the notice is retried.
  v_inbox := pg_temp.claimed('p10r-a', 'tx-a1');
  v := public.system_record_provider_read(v_inbox, 'PENDING', 'ARS', 29000000, 28649100, 'list', 'detail', v_ts, pg_temp.digest());
  if v->>'status' is distinct from 'retry' or not (v->>'deferred')::boolean then raise exception 'pending status %', v; end if;
  v_inbox := pg_temp.claimed('p10r-a', 'tx-a1');
  v := public.system_record_provider_read(v_inbox, 'PROCESSED', 'ARS', 29000000, 28649100, 'list', 'detail', null, pg_temp.digest());
  if v->>'status' is distinct from 'retry' then raise exception 'missing timestamp %', v; end if;
  v_inbox := pg_temp.claimed('p10r-a', 'tx-a1');
  v := public.system_record_provider_read(v_inbox, 'PROCESSED', 'USD', 29000000, 28649100, 'list', 'detail', v_ts, pg_temp.digest());
  if v->>'status' is distinct from 'retry' then raise exception 'currency %', v; end if;
  v_inbox := pg_temp.claimed('p10r-a', 'tx-a1');
  v := public.system_record_provider_read(v_inbox, 'PROCESSED', 'ARS', 29000000, 28649100, 'list', 'detail', v_ts, 'not-a-digest');
  if v->>'commercial_error_code' is distinct from 'validation' then raise exception 'digest %', v; end if;
  if exists (select 1 from commercial.provider_receipts where external_customer_id = 'p10r-a') then
    raise exception 'receipt created before a complete processed read';
  end if;

  -- Complete processed activation: confirmed, evidenced, imputed and setup commission accrued, atomically.
  v := public.system_record_provider_read(v_inbox, 'PROCESSED', 'ARS', 29000000, 28649100, 'list', 'detail', v_ts, pg_temp.digest());
  if v->>'status' is distinct from 'imputed' or v->>'kind' is distinct from 'setup' or not (v->>'economic_recognition')::boolean then
    raise exception 'setup imputation %', v;
  end if;
  select * into v_receipt from commercial.provider_receipts where external_customer_id = 'p10r-a' and external_transaction_id = 'tx-a1';
  if v_receipt.status <> 'imputed' or v_receipt.observed_at <> v_ts then raise exception 'receipt %', row_to_json(v_receipt); end if;
  select * into v_collection from commercial.platform_collections where id = v_receipt.collection_id;
  if v_collection.status <> 'posted' or v_collection.policy_status <> 'nominal' or v_collection.gross_cents <> 29000000
    or v_collection.recorded_by <> commercial.system_account_id()
    or v_collection.idempotency_key <> 'provider-receipt:' || v_receipt.id::text then
    raise exception 'collection %', row_to_json(v_collection);
  end if;
  if (select status from commercial.platform_obligations where id = v_receipt.obligation_id) <> 'satisfied' then
    raise exception 'setup obligation not satisfied';
  end if;
  if not exists (
    select 1 from commercial.provider_read_evidence
    where receipt_id = v_receipt.id and provider_api_verified and not webhook_signature_verified
      and provider_timestamp = v_ts and inbox_id = v_inbox
  ) then raise exception 'evidence missing'; end if;
  if (select count(*) from commercial.promoter_commissions where collection_id = v_collection.id and right_kind = 'setup' and amount_cents = 12000000 and status = 'pending') <> 1 then
    raise exception 'setup commission';
  end if;
  if exists (select 1 from commercial.founder_slots where conversion_terms_id = v_terms_a)
    or exists (select 1 from commercial.promoter_commissions where conversion_terms_id = v_terms_a and right_kind = 'recurring') then
    raise exception 'activation consumed a slot or recurring right';
  end if;
  select * into v_row from commercial.provider_webhook_inbox where id = v_inbox;
  if v_row.status <> 'processed' or v_row.receipt_id <> v_receipt.id then raise exception 'inbox %', row_to_json(v_row); end if;
  if exists (
    select 1 from commercial.audit_events
    where correlation_id in (v_receipt.id, v_collection.id) and actor_account_id = commercial.system_account_id() and actor_kind <> 'system'
  ) then raise exception 'audit actor_kind'; end if;
  if not exists (select 1 from commercial.audit_events where entity_id = v_receipt.id and action = 'receipt.imputed' and actor_kind = 'system') then
    raise exception 'imputation audit';
  end if;

  -- Replays: the same read cannot run twice; a repeated notice does not reopen the row.
  v := public.system_record_provider_read(v_inbox, 'PROCESSED', 'ARS', 29000000, 28649100, 'list', 'detail', v_ts, pg_temp.digest());
  if v->>'commercial_error_code' is distinct from 'not_claimed' then raise exception 'replay %', v; end if;
  v := public.system_enqueue_provider_webhook('talo', 'sandbox', 'p10r-a', 'tx-a1', false);
  if not (v->>'duplicate')::boolean or v->>'status' is distinct from 'processed' then raise exception 'renotice %', v; end if;
  select count(*) into v_count from commercial.platform_collections where obligation_id = v_receipt.obligation_id;
  if v_count <> 1 then raise exception 'collections after replay %', v_count; end if;

  -- A second activation-sized transfer after activation is not imputed automatically in L3.
  v_inbox := pg_temp.claimed('p10r-a', 'tx-a2');
  v := public.system_record_provider_read(v_inbox, 'PROCESSED', 'ARS', 29000000, 28649100, 'list', 'detail', v_ts, pg_temp.digest());
  if v->>'status' is distinct from 'reconciliation_required' or v->>'review_reason' is distinct from 'subscription_not_automated' then
    raise exception 'second transfer %', v;
  end if;

  -- Ambiguous terms, missing terms and wrong amount go to reconciliation without money effects.
  v_inbox := pg_temp.claimed('p10r-c', 'tx-c1');
  v := public.system_record_provider_read(v_inbox, 'PROCESSED', 'ARS', 29000000, 28649100, 'list', 'detail', v_ts, pg_temp.digest());
  if v->>'review_reason' is distinct from 'terms_ambiguous' then raise exception 'ambiguous %', v; end if;
  v_inbox := pg_temp.claimed('p10r-d', 'tx-d1');
  v := public.system_record_provider_read(v_inbox, 'PROCESSED', 'ARS', 29000000, 28649100, 'list', 'detail', v_ts, pg_temp.digest());
  if v->>'review_reason' is distinct from 'terms_missing' then raise exception 'no terms %', v; end if;
  v_inbox := pg_temp.claimed('p10r-e', 'tx-e1');
  v := public.system_record_provider_read(v_inbox, 'PROCESSED', 'ARS', 5500000, 5400000, 'list', 'detail', v_ts, pg_temp.digest());
  if v->>'review_reason' is distinct from 'amount_mismatch' then raise exception 'monthly before activation %', v; end if;
  if exists (
    select 1 from commercial.platform_collections collection
    join commercial.platform_obligations obligation on obligation.id = collection.obligation_id
    where obligation.won_business_id in ('20202020-2020-4020-8020-202020202032', '20202020-2020-4020-8020-202020202033', '20202020-2020-4020-8020-202020202034')
  ) then raise exception 'reconciliation produced a collection'; end if;
  if (select count(*) from commercial.provider_webhook_inbox where external_customer_id like 'p10r-%' and status = 'processed') <> 5 then
    raise exception 'processed inbox rows';
  end if;
end;
$$;

-- Only service_role may run the system read; the evidence table is not writable by clients.
do $$
begin
  if has_function_privilege('anon', 'public.system_record_provider_read(uuid, text, text, bigint, bigint, text, text, timestamptz, text)', 'execute')
    or has_function_privilege('authenticated', 'public.system_record_provider_read(uuid, text, text, bigint, bigint, text, text, timestamptz, text)', 'execute')
    or not has_function_privilege('service_role', 'public.system_record_provider_read(uuid, text, text, bigint, bigint, text, text, timestamptz, text)', 'execute') then
    raise exception 'system_record_provider_read grants';
  end if;
  if has_function_privilege('authenticated', 'commercial.impute_provider_read_receipt(uuid)', 'execute')
    or has_function_privilege('service_role', 'commercial.impute_provider_read_receipt(uuid)', 'execute')
    or has_function_privilege('authenticated', 'commercial.post_provider_read_collection(uuid, uuid)', 'execute')
    or has_function_privilege('authenticated', 'commercial.route_receipt_to_reconciliation(uuid, text)', 'execute') then
    raise exception 'internal imputation grants';
  end if;
  if has_table_privilege('authenticated', 'commercial.provider_read_evidence', 'insert')
    or has_table_privilege('authenticated', 'commercial.provider_read_evidence', 'update') then
    raise exception 'evidence writable';
  end if;
end;
$$;

select 'phase10_provider_read: PASS' as result;
rollback;
