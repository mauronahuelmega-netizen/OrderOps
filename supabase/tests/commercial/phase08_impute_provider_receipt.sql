-- T08-B. Rolls back. Attestation is manual and does not verify Talo or the webhook signature.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '19191919-1919-4191-8191-191919191901', 'authenticated', 'authenticated', 'phase08b-finance@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '19191919-1919-4191-8191-191919191902', 'authenticated', 'authenticated', 'phase08b-super@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '19191919-1919-4191-8191-191919191903', 'authenticated', 'authenticated', 'phase08b-support@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '19191919-1919-4191-8191-191919191904', 'authenticated', 'authenticated', 'phase08b-promoter@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());
insert into commercial.platform_accounts (id, user_id, kind) values
  ('19191919-1919-4191-8191-191919191911', '19191919-1919-4191-8191-191919191901', 'internal'),
  ('19191919-1919-4191-8191-191919191912', '19191919-1919-4191-8191-191919191902', 'internal'),
  ('19191919-1919-4191-8191-191919191913', '19191919-1919-4191-8191-191919191903', 'internal'),
  ('19191919-1919-4191-8191-191919191914', '19191919-1919-4191-8191-191919191904', 'promoter');
insert into commercial.internal_role_assignments (account_id, role) values
  ('19191919-1919-4191-8191-191919191911', 'finance'),
  ('19191919-1919-4191-8191-191919191912', 'superadmin'),
  ('19191919-1919-4191-8191-191919191913', 'support');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('19191919-1919-4191-8191-191919191921', '19191919-1919-4191-8191-191919191914', 'p08b000019', 'Promotor Imputacion', 'active');
insert into public.businesses (id, name, slug, whatsapp_number) values
  ('19191919-1919-4191-8191-191919191931', 'Negocio Imputacion A', 'negocio-imputacion-a', '5491100001931'),
  ('19191919-1919-4191-8191-191919191932', 'Negocio Imputacion B', 'negocio-imputacion-b', '5491100001932'),
  ('19191919-1919-4191-8191-191919191933', 'Negocio Imputacion C', 'negocio-imputacion-c', '5491100001933');
insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel) values
  ('19191919-1919-4191-8191-191919191941', 'Lead A', 'lead imputacion a', 'promoter'),
  ('19191919-1919-4191-8191-191919191942', 'Lead B', 'lead imputacion b', 'promoter'),
  ('19191919-1919-4191-8191-191919191943', 'Lead C1', 'lead imputacion c1', 'promoter'),
  ('19191919-1919-4191-8191-191919191944', 'Lead C2', 'lead imputacion c2', 'promoter');
insert into commercial.commercial_opportunities (id, commercial_business_id, stage, owner_account_id) values
  ('19191919-1919-4191-8191-191919191951', '19191919-1919-4191-8191-191919191941', 'demo_done', '19191919-1919-4191-8191-191919191914'),
  ('19191919-1919-4191-8191-191919191952', '19191919-1919-4191-8191-191919191942', 'demo_done', '19191919-1919-4191-8191-191919191914'),
  ('19191919-1919-4191-8191-191919191953', '19191919-1919-4191-8191-191919191943', 'demo_done', '19191919-1919-4191-8191-191919191914'),
  ('19191919-1919-4191-8191-191919191954', '19191919-1919-4191-8191-191919191944', 'demo_done', '19191919-1919-4191-8191-191919191914');
insert into commercial.opportunity_attributions (id, opportunity_id, promoter_id, status, method, reason) values
  ('19191919-1919-4191-8191-191919191961', '19191919-1919-4191-8191-191919191951', '19191919-1919-4191-8191-191919191921', 'confirmed', 'manual', 'fixture'),
  ('19191919-1919-4191-8191-191919191962', '19191919-1919-4191-8191-191919191952', '19191919-1919-4191-8191-191919191921', 'confirmed', 'manual', 'fixture'),
  ('19191919-1919-4191-8191-191919191963', '19191919-1919-4191-8191-191919191953', '19191919-1919-4191-8191-191919191921', 'confirmed', 'manual', 'fixture'),
  ('19191919-1919-4191-8191-191919191964', '19191919-1919-4191-8191-191919191954', '19191919-1919-4191-8191-191919191921', 'confirmed', 'manual', 'fixture');

select set_config('request.jwt.claim.sub', '19191919-1919-4191-8191-191919191902', true);

do $$
declare
  v_win jsonb;
  v_terms_a uuid;
  v_terms_b uuid;
  v_open jsonb;
  v_setup_a uuid;
  v_setup_b uuid;
  v_sub uuid;
  v_link jsonb;
  v_confirm jsonb;
  v_attest jsonb;
  v_impute jsonb;
  v_again jsonb;
  v_receipt uuid;
  v_receipt_partial uuid;
  v_receipt_excess uuid;
  v_receipt_conflict uuid;
  v_receipt_sub uuid;
  v_receipt_later uuid;
  v_receipt_shared_a uuid;
  v_receipt_shared_b uuid;
  v_collections bigint;
  v_posted bigint;
  v_commissions bigint;
  v_slots bigint;
  v_audit jsonb;
begin
  v_win := commercial.win_opportunity('19191919-1919-4191-8191-191919191951', '19191919-1919-4191-8191-191919191931', null);
  if v_win->>'status' is distinct from 'won' then raise exception 'win a %', v_win; end if;
  v_terms_a := (v_win->>'conversion_terms_id')::uuid;
  v_win := commercial.win_opportunity('19191919-1919-4191-8191-191919191952', '19191919-1919-4191-8191-191919191932', null);
  if v_win->>'status' is distinct from 'won' then raise exception 'win b %', v_win; end if;
  v_terms_b := (v_win->>'conversion_terms_id')::uuid;
  v_win := commercial.win_opportunity('19191919-1919-4191-8191-191919191953', '19191919-1919-4191-8191-191919191933', null);
  if v_win->>'status' is distinct from 'won' then raise exception 'win c1 %', v_win; end if;
  v_win := commercial.win_opportunity('19191919-1919-4191-8191-191919191954', '19191919-1919-4191-8191-191919191933', null);
  if v_win->>'status' is distinct from 'won' then raise exception 'win c2 %', v_win; end if;

  perform set_config('request.jwt.claim.sub', '19191919-1919-4191-8191-191919191901', true);
  v_open := public.open_obligation(v_terms_a, 'setup', null);
  v_setup_a := (v_open->>'obligation_id')::uuid;
  if (v_open->>'list_price_cents')::bigint <> 29000000 then raise exception 'setup price %', v_open; end if;
  v_open := public.open_obligation(v_terms_b, 'setup', null);
  v_setup_b := (v_open->>'obligation_id')::uuid;
  v_open := public.record_founder_service_start(v_terms_a, date '2026-11-10');
  if v_open->>'ok' is distinct from 'true' then raise exception 'start %', v_open; end if;
  v_open := public.open_obligation(v_terms_a, 'subscription', '2026-12-10');
  v_sub := (v_open->>'obligation_id')::uuid;
  if v_open->>'ok' is distinct from 'true' then raise exception 'subscription %', v_open; end if;
  v_open := public.open_obligation((select id from commercial.conversion_terms where opportunity_id = '19191919-1919-4191-8191-191919191953'), 'setup', null);
  if v_open->>'ok' is distinct from 'true' then raise exception 'setup c1 %', v_open; end if;
  v_open := public.open_obligation((select id from commercial.conversion_terms where opportunity_id = '19191919-1919-4191-8191-191919191954'), 'setup', null);
  if v_open->>'ok' is distinct from 'true' then raise exception 'setup c2 %', v_open; end if;

  v_link := commercial.link_provider_customer('19191919-1919-4191-8191-191919191931', 'talo', 'sandbox', 'customer-a', '0000000000000000001931', 'alias.a');
  if (v_link->>'ok')::boolean is not true then raise exception 'link a %', v_link; end if;
  v_link := commercial.link_provider_customer('19191919-1919-4191-8191-191919191932', 'talo', 'sandbox', 'customer-b', '0000000000000000001932', 'alias.b');
  if (v_link->>'ok')::boolean is not true then raise exception 'link b %', v_link; end if;
  v_link := commercial.link_provider_customer('19191919-1919-4191-8191-191919191933', 'talo', 'sandbox', 'customer-c', '0000000000000000001933', 'alias.c');
  if (v_link->>'ok')::boolean is not true then raise exception 'link c %', v_link; end if;

  perform set_config('request.jwt.claim.sub', '19191919-1919-4191-8191-191919191904', true);
  v_attest := commercial.attest_provider_receipt(null, null, 'consulta del movimiento', 'autorizo talo');
  if v_attest->>'commercial_error_code' is distinct from 'forbidden' then raise exception 'promoter attest %', v_attest; end if;
  perform set_config('request.jwt.claim.sub', '19191919-1919-4191-8191-191919191903', true);
  v_attest := commercial.attest_provider_receipt(null, null, 'consulta del movimiento', 'autorizo talo');
  if v_attest->>'commercial_error_code' is distinct from 'forbidden' then raise exception 'support attest %', v_attest; end if;
  perform set_config('request.jwt.claim.sub', '', true);
  v_attest := commercial.attest_provider_receipt(null, null, 'consulta del movimiento', 'autorizo talo');
  if v_attest->>'commercial_error_code' is distinct from 'unauthenticated' then raise exception 'anon attest %', v_attest; end if;

  perform set_config('request.jwt.claim.sub', '19191919-1919-4191-8191-191919191901', true);
  v_confirm := commercial.confirm_provider_receipt('19191919-1919-4191-8191-191919191931', 'talo', 'sandbox', 'customer-a', 'tx-exact', 'PROCESSED', 'ARS', 29000000, 28649100, 'list', 'detail', now());
  v_receipt := (v_confirm->>'receipt_id')::uuid;
  v_confirm := commercial.confirm_provider_receipt('19191919-1919-4191-8191-191919191931', 'talo', 'sandbox', 'customer-a', 'tx-partial', 'PROCESSED', 'ARS', 1000000, 900000, 'list', 'detail', now());
  v_receipt_partial := (v_confirm->>'receipt_id')::uuid;
  v_confirm := commercial.confirm_provider_receipt('19191919-1919-4191-8191-191919191931', 'talo', 'sandbox', 'customer-a', 'tx-sub', 'PROCESSED', 'ARS', 5500000, 5433450, 'list', 'detail', now());
  v_receipt_sub := (v_confirm->>'receipt_id')::uuid;
  v_confirm := commercial.confirm_provider_receipt('19191919-1919-4191-8191-191919191931', 'talo', 'sandbox', 'customer-a', 'tx-later', 'PROCESSED', 'ARS', 29000000, 28649100, 'list', 'detail', now());
  v_receipt_later := (v_confirm->>'receipt_id')::uuid;
  v_confirm := commercial.confirm_provider_receipt('19191919-1919-4191-8191-191919191931', 'talo', 'sandbox', 'customer-a', 'tx-shared', 'PROCESSED', 'ARS', 29000000, 28649100, 'list', 'detail', now());
  v_receipt_shared_a := (v_confirm->>'receipt_id')::uuid;
  v_confirm := commercial.confirm_provider_receipt('19191919-1919-4191-8191-191919191932', 'talo', 'sandbox', 'customer-b', 'tx-shared', 'PROCESSED', 'ARS', 29000000, 28649100, 'list', 'detail', now());
  v_receipt_shared_b := (v_confirm->>'receipt_id')::uuid;
  if v_receipt_shared_a = v_receipt_shared_b then raise exception 'shared transaction collapsed'; end if;
  v_confirm := commercial.confirm_provider_receipt('19191919-1919-4191-8191-191919191931', 'talo', 'sandbox', 'customer-a', 'tx-usd', 'PROCESSED', 'USD', 29000000, 28649100, 'list', 'detail', now());
  if v_confirm->>'status' is distinct from 'pending_review' then raise exception 'usd confirmed %', v_confirm; end if;
  v_impute := commercial.impute_provider_receipt((v_confirm->>'receipt_id')::uuid);
  if v_impute->>'commercial_error_code' is distinct from 'receipt_not_confirmed' then raise exception 'usd impute %', v_impute; end if;

  v_impute := commercial.impute_provider_receipt(v_receipt);
  if v_impute->>'commercial_error_code' is distinct from 'evidence_missing' then raise exception 'missing evidence %', v_impute; end if;
  if exists (select 1 from commercial.platform_collections c join commercial.platform_obligations o on o.id = c.obligation_id where o.won_business_id = '19191919-1919-4191-8191-191919191931') then
    raise exception 'missing evidence wrote a collection';
  end if;

  v_attest := commercial.attest_provider_receipt(v_receipt, v_setup_b, 'consulte el movimiento en el proveedor', 'autorizo talo para esta obligacion');
  if v_attest->>'commercial_error_code' is distinct from 'obligation_business_mismatch' then raise exception 'cross business %', v_attest; end if;

  v_attest := commercial.attest_provider_receipt(v_receipt_partial, v_setup_a, 'consulte el movimiento en el proveedor', 'autorizo talo para esta obligacion');
  v_impute := commercial.impute_provider_receipt(v_receipt_partial);
  if v_impute->>'review_reason' is distinct from 'amount_mismatch' or (select status from commercial.platform_obligations where id = v_setup_a) <> 'open' then
    raise exception 'partial %', v_impute;
  end if;

  v_confirm := commercial.confirm_provider_receipt('19191919-1919-4191-8191-191919191931', 'talo', 'sandbox', 'customer-a', 'tx-excess', 'PROCESSED', 'ARS', 30000000, 29649100, 'list', 'detail', now());
  v_receipt_excess := (v_confirm->>'receipt_id')::uuid;
  if v_confirm->>'status' is distinct from 'confirmed' then raise exception 'excess confirm %', v_confirm; end if;
  v_attest := commercial.attest_provider_receipt(v_receipt_excess, v_setup_a, 'consulte el movimiento en el proveedor', 'autorizo talo para esta obligacion');
  if (v_attest->>'ok')::boolean is not true then raise exception 'excess attest %', v_attest; end if;
  select count(*) into v_posted from commercial.platform_collections where obligation_id = v_setup_a and status = 'posted';
  v_impute := commercial.impute_provider_receipt(v_receipt_excess);
  if v_impute->>'review_reason' is distinct from 'amount_mismatch'
    or (select status from commercial.platform_obligations where id = v_setup_a) <> 'open'
    or (select status from commercial.provider_receipts where id = v_receipt_excess) <> 'reconciliation_required'
    or (select count(*) from commercial.platform_collections where obligation_id = v_setup_a and status = 'posted') <> v_posted then
    raise exception 'excess %', v_impute;
  end if;

  v_attest := commercial.attest_provider_receipt(v_receipt_sub, v_sub, 'consulte el movimiento en el proveedor', 'autorizo talo para esta obligacion');
  v_impute := commercial.impute_provider_receipt(v_receipt_sub);
  if v_impute->>'review_reason' is distinct from 'subscription_due_not_defined' or (select status from commercial.platform_obligations where id = v_sub) <> 'open' then
    raise exception 'subscription %', v_impute;
  end if;

  v_link := commercial.link_provider_customer('19191919-1919-4191-8191-191919191933', 'talo', 'sandbox', 'customer-c', '0000000000000000001933', 'alias.c');
  v_confirm := commercial.confirm_provider_receipt('19191919-1919-4191-8191-191919191933', 'talo', 'sandbox', 'customer-c', 'tx-ambiguous', 'PROCESSED', 'ARS', 29000000, 28649100, 'list', 'detail', now());
  v_attest := commercial.attest_provider_receipt((v_confirm->>'receipt_id')::uuid, (select id from commercial.platform_obligations where won_business_id = '19191919-1919-4191-8191-191919191933' and kind = 'setup' limit 1), 'consulte el movimiento en el proveedor', 'autorizo talo para esta obligacion');
  v_impute := commercial.impute_provider_receipt((v_confirm->>'receipt_id')::uuid);
  if v_impute->>'review_reason' is distinct from 'ambiguous_obligation'
    or (select count(*) from commercial.platform_obligations where won_business_id = '19191919-1919-4191-8191-191919191933' and status = 'open') <> 2 then
    raise exception 'ambiguous %', v_impute;
  end if;

  v_attest := commercial.attest_provider_receipt(v_receipt, v_setup_a, 'consulte el movimiento en el proveedor', 'autorizo talo para esta obligacion');
  if (v_attest->>'ok')::boolean is not true or (v_attest->>'provider_api_verified')::boolean or (v_attest->>'webhook_signature_verified')::boolean or (v_attest->>'economic_recognition')::boolean then
    raise exception 'attest flags %', v_attest;
  end if;
  select after into v_audit from commercial.audit_events where action = 'receipt.operator_attested' and entity_id = (v_attest->>'evidence_id')::uuid;
  if v_audit->>'movement_consultation' is null or v_audit->>'talo_authorization' is null or (v_audit->>'provider_api_verified')::boolean or (v_audit->>'webhook_signature_verified')::boolean then
    raise exception 'audit evidence %', v_audit;
  end if;
  v_again := commercial.attest_provider_receipt(v_receipt, v_setup_a, 'consulte el movimiento en el proveedor', 'autorizo talo para esta obligacion');
  if (v_again->>'idempotent')::boolean is not true then raise exception 'attest replay %', v_again; end if;

  -- impute_refused_non_nominal is NOT_VERIFIED. Impute calls record_collection only after the gross already equals the list price, and a posted collection on that obligation is refused before the call. No legitimate fixture reaches that raise.
  v_confirm := commercial.confirm_provider_receipt('19191919-1919-4191-8191-191919191931', 'talo', 'sandbox', 'customer-a', 'tx-conflict', 'PROCESSED', 'ARS', 29000000, 28649100, 'list', 'detail', now());
  v_receipt_conflict := (v_confirm->>'receipt_id')::uuid;
  if v_confirm->>'status' is distinct from 'confirmed' then raise exception 'conflict confirm %', v_confirm; end if;
  v_attest := commercial.attest_provider_receipt(v_receipt_conflict, v_setup_a, 'consulte el movimiento en el proveedor', 'autorizo talo para esta obligacion');
  if (v_attest->>'ok')::boolean is not true then raise exception 'conflict attest %', v_attest; end if;
  insert into commercial.platform_collections (
    obligation_id, idempotency_key, status, gross_cents, policy_status, failed_at, recorded_by, external_ref
  ) values (
    v_setup_b,
    'provider-receipt:' || v_receipt_conflict::text,
    'failed',
    29000000,
    'blocked_pending_policy',
    pg_catalog.now(),
    '19191919-1919-4191-8191-191919191911',
    'clave-ajena'
  );
  select count(*) into v_posted from commercial.platform_collections where obligation_id = v_setup_a and status = 'posted';
  begin
    perform commercial.impute_provider_receipt(v_receipt_conflict);
    raise exception 'expected impute_collection_rejected';
  exception
    when others then
      if sqlerrm <> 'impute_collection_rejected' then raise; end if;
  end;
  if (select status from commercial.provider_receipts where id = v_receipt_conflict) <> 'confirmed'
    or (select status from commercial.platform_obligations where id = v_setup_a) <> 'open'
    or (select count(*) from commercial.platform_collections where obligation_id = v_setup_a and status = 'posted') <> v_posted then
    raise exception 'rejected imputation wrote a collection';
  end if;

  select count(*) into v_collections from commercial.platform_collections;
  begin
    perform commercial.impute_provider_receipt(v_receipt);
    raise exception 'force_outer_rollback';
  exception
    when others then
      if sqlerrm <> 'force_outer_rollback' then raise; end if;
  end;
  if (select count(*) from commercial.platform_collections) <> v_collections
    or (select status from commercial.provider_receipts where id = v_receipt) <> 'confirmed' then
    raise exception 'outer rollback kept the imputation';
  end if;

  select count(*) into v_commissions from commercial.promoter_commissions where conversion_terms_id = v_terms_a;
  select count(*) into v_slots from commercial.founder_slots where conversion_terms_id = v_terms_a;
  v_impute := commercial.impute_provider_receipt(v_receipt);
  if v_impute->>'status' is distinct from 'imputed' or (v_impute->>'economic_recognition')::boolean is not true
    or (v_impute->>'provider_api_verified')::boolean or (select status from commercial.platform_obligations where id = v_setup_a) <> 'satisfied' then
    raise exception 'exact %', v_impute;
  end if;
  if (select count(*) from commercial.platform_collections where obligation_id = v_setup_a and status = 'posted') <> 1
    or (select policy_status from commercial.platform_collections where id = (v_impute->>'collection_id')::uuid) <> 'nominal'
    or (select count(*) from commercial.promoter_commissions where conversion_terms_id = v_terms_a) <> v_commissions
    or (select count(*) from commercial.founder_slots where conversion_terms_id = v_terms_a) <> v_slots then
    raise exception 'exact wrote commission or a second collection';
  end if;
  v_again := commercial.impute_provider_receipt(v_receipt);
  if (v_again->>'idempotent')::boolean is not true or v_again->>'collection_id' is distinct from v_impute->>'collection_id' then
    raise exception 'impute replay %', v_again;
  end if;
  if (commercial.defer_provider_receipt('19191919-1919-4191-8191-191919191931', 'talo', 'sandbox', 'customer-a', 'tx-exact')->>'status') is distinct from 'imputed' then
    raise exception 'defer downgraded the receipt';
  end if;

  v_attest := commercial.attest_provider_receipt(v_receipt_later, v_setup_a, 'consulte el movimiento en el proveedor', 'autorizo talo para esta obligacion');
  v_impute := commercial.impute_provider_receipt(v_receipt_later);
  if v_impute->>'review_reason' is distinct from 'obligation_not_open'
    or (select count(*) from commercial.platform_collections where obligation_id = v_setup_a and status = 'posted') <> 1 then
    raise exception 'second receipt %', v_impute;
  end if;

  v_attest := commercial.attest_provider_receipt(v_receipt_shared_b, v_setup_b, 'consulte el movimiento en el proveedor', 'autorizo talo para esta obligacion');
  v_impute := commercial.impute_provider_receipt(v_receipt_shared_b);
  if v_impute->>'status' is distinct from 'imputed' then raise exception 'shared b %', v_impute; end if;
  v_attest := commercial.attest_provider_receipt(v_receipt_shared_a, v_setup_a, 'consulte el movimiento en el proveedor', 'autorizo talo para esta obligacion');
  v_again := commercial.impute_provider_receipt(v_receipt_shared_a);
  if v_again->>'review_reason' is distinct from 'obligation_not_open' or v_receipt_shared_a = v_receipt_shared_b then
    raise exception 'shared a %', v_again;
  end if;
  if (select external_ref from commercial.platform_collections where id = (v_impute->>'collection_id')::uuid) is distinct from 'talo:sandbox:customer-b:tx-shared' then
    raise exception 'external ref omitted the customer';
  end if;

  v_again := commercial.reverse_collection((select collection_id from commercial.provider_receipts where id = v_receipt), 'reversa de prueba');
  if v_again->>'ok' is distinct from 'true' or (select status from commercial.platform_collections where id = (select collection_id from commercial.provider_receipts where id = v_receipt)) <> 'reversed' then
    raise exception 'reverse %', v_again;
  end if;
  if (select status from commercial.platform_obligations where id = v_setup_a) <> 'satisfied'
    or (select status from commercial.provider_receipts where id = v_receipt) <> 'imputed' then
    raise exception 'reverse reopened the obligation';
  end if;
  v_impute := commercial.impute_provider_receipt(v_receipt_later);
  if v_impute->>'status' is distinct from 'reconciliation_required' or (select count(*) from commercial.platform_collections where obligation_id = v_setup_a and status = 'posted') <> 0 then
    raise exception 'post-reverse imputation %', v_impute;
  end if;
end $$;

do $$
declare
  v_result jsonb;
begin
  set local role authenticated;
  begin
    perform commercial.impute_provider_receipt(null);
    raise exception 'authenticated executed the commercial function';
  exception
    when insufficient_privilege then
      null;
  end;
  perform set_config('request.jwt.claim.sub', '19191919-1919-4191-8191-191919191901', true);
  v_result := public.impute_provider_receipt(null);
  if v_result->>'commercial_error_code' is distinct from 'validation' then
    raise exception 'public wrapper %', v_result;
  end if;
end $$;

rollback;
