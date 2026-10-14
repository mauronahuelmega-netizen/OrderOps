-- P05-T08. Rolls back. Simulated payments: partial, failed, retry, and a later CBU change.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111101', 'authenticated', 'authenticated', 'phase05-finance-pay-a@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111103', 'authenticated', 'authenticated', 'phase05-finance-pay-b@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111102', 'authenticated', 'authenticated', 'phase05-super-pay@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111104', 'authenticated', 'authenticated', 'phase05-promoter-pay@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());
insert into commercial.platform_accounts (id, user_id, kind) values
  ('11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111101', 'internal'),
  ('11111111-1111-4111-8111-111111111113', '11111111-1111-4111-8111-111111111103', 'internal'),
  ('11111111-1111-4111-8111-111111111112', '11111111-1111-4111-8111-111111111102', 'internal'),
  ('11111111-1111-4111-8111-111111111114', '11111111-1111-4111-8111-111111111104', 'promoter');
insert into commercial.internal_role_assignments (account_id, role) values
  ('11111111-1111-4111-8111-111111111111', 'finance'),
  ('11111111-1111-4111-8111-111111111113', 'finance'),
  ('11111111-1111-4111-8111-111111111112', 'superadmin');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('11111111-1111-4111-8111-111111111121', '11111111-1111-4111-8111-111111111114', 'ppay00000008', 'Promotor Pago', 'active');
insert into commercial.promoter_bank_accounts (id, promoter_id, cbu_or_cvu, holder_name, is_current, created_by) values
  ('11111111-1111-4111-8111-111111111171', '11111111-1111-4111-8111-111111111121', '0000000000000000000001', 'Titular Original', true, '11111111-1111-4111-8111-111111111111');
insert into public.businesses (id, name, slug, whatsapp_number) values
  ('11111111-1111-4111-8111-111111111131', 'Negocio Pago', 'negocio-pago', '5491100000751');
insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel) values
  ('11111111-1111-4111-8111-111111111141', 'Lead Pago', 'lead pago', 'promoter');
insert into commercial.commercial_opportunities (id, commercial_business_id, stage, owner_account_id) values
  ('11111111-1111-4111-8111-111111111151', '11111111-1111-4111-8111-111111111141', 'demo_done', '11111111-1111-4111-8111-111111111114');
insert into commercial.opportunity_attributions (id, opportunity_id, promoter_id, status, method, reason) values
  ('11111111-1111-4111-8111-111111111161', '11111111-1111-4111-8111-111111111151', '11111111-1111-4111-8111-111111111121', 'confirmed', 'manual', 'fixture');

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111102', true);

do $$
declare
  v_terms uuid;
  v_open jsonb;
  v_result jsonb;
  v_commission uuid;
  v_settlement uuid;
  v_snapshot text;
  v_count int;
begin
  v_terms := (commercial.win_opportunity('11111111-1111-4111-8111-111111111151', '11111111-1111-4111-8111-111111111131', null)->>'conversion_terms_id')::uuid;
  perform set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111101', true);
  v_open := public.open_obligation(v_terms, 'subscription', 'pay:1');
  v_result := public.record_collection((v_open->>'obligation_id')::uuid, 'pay-1', 'posted', 5500000, null);
  perform public.accrue_commissions_for_collection((v_result->>'collection_id')::uuid);
  v_commission := (select id from commercial.promoter_commissions where collection_id = (v_result->>'collection_id')::uuid);
  update commercial.promoter_commissions set status = 'available', available_at = '2026-09-16 15:00:00+00' where id = v_commission;
  v_settlement := (public.prepare_settlement('11111111-1111-4111-8111-111111111121', '2026-09', null)->>'settlement_id')::uuid;
  if (select status from commercial.promoter_settlements where id = v_settlement) is distinct from 'draft' then
    raise exception 'not approved yet paid';
  end if;
  perform set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111103', true);
  perform public.approve_settlement(v_settlement);
  v_result := public.record_settlement_payment(v_settlement, 'pay-early', 100, 'recorded', 'ref', null);
  if v_result->>'commercial_error_code' is distinct from 'validation' then
    raise exception 'pay before invoice %', v_result;
  end if;

  perform set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111104', true);
  v_result := public.submit_invoice(v_settlement, 2200000, 'invoices/' || v_settlement::text || '/pago.pdf');
  perform set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111101', true);
  perform public.review_invoice((v_result->>'invoice_id')::uuid, 'accepted', null);
  if (select status from commercial.promoter_settlements where id = v_settlement) is distinct from 'payable' then
    raise exception 'not payable';
  end if;

  perform set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111103', true);
  v_result := public.record_settlement_payment(v_settlement, 'pay-sod', 100, 'recorded', 'ref', null);
  if v_result->>'commercial_error_code' is distinct from 'sod_conflict' then
    raise exception 'approver pays %', v_result;
  end if;

  perform set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111101', true);
  v_result := public.record_settlement_payment(v_settlement, 'pay-fail', 2200000, 'failed', 'fallo', null);
  if v_result->>'status' is distinct from 'failed' or (select status from commercial.promoter_settlements where id = v_settlement) is distinct from 'payable' then
    raise exception 'failed changed settlement %', v_result;
  end if;
  v_result := public.record_settlement_payment(v_settlement, 'pay-fail', 2200000, 'recorded', 'retry', null);
  if v_result->>'duplicate' is distinct from 'true' or v_result->>'status' is distinct from 'failed' then
    raise exception 'retry same key %', v_result;
  end if;

  v_result := public.record_settlement_payment(v_settlement, 'pay-partial', 1000000, 'recorded', 'parcial', 'receipts/local/parcial.pdf');
  if (select status from commercial.promoter_settlements where id = v_settlement) is distinct from 'partially_paid'
     or (select status from commercial.promoter_commissions where id = v_commission) is distinct from 'in_settlement' then
    raise exception 'G-15 partial %', v_result;
  end if;
  v_snapshot := (select destination_snapshot->>'cbu_or_cvu' from commercial.settlement_payments where idempotency_key = 'pay-partial');
  update commercial.promoter_bank_accounts set cbu_or_cvu = '9999999999999999999999' where id = '11111111-1111-4111-8111-111111111171';
  if (select destination_snapshot->>'cbu_or_cvu' from commercial.settlement_payments where idempotency_key = 'pay-partial') is distinct from v_snapshot then
    raise exception 'snapshot rewritten';
  end if;

  v_result := public.record_settlement_payment(v_settlement, 'pay-over', 2000000, 'recorded', 'demas', null);
  if v_result->>'commercial_error_code' is distinct from 'amount_exceeds_total' then
    raise exception 'overpay %', v_result;
  end if;
  v_result := public.record_settlement_payment(v_settlement, 'pay-rest', 1200000, 'recorded', 'resto', null);
  if (select status from commercial.promoter_settlements where id = v_settlement) is distinct from 'paid'
     or (select status from commercial.promoter_commissions where id = v_commission) is distinct from 'paid' then
    raise exception 'E2E-03 paid %', v_result;
  end if;
  select count(*) into v_count from commercial.outbox_events where event_name = 'payment.recorded';
  if v_count < 3 then
    raise exception 'outbox %', v_count;
  end if;
  select coalesce(sum(amount_cents), 0) into v_count from commercial.settlement_payments
  where settlement_id = v_settlement and status = 'recorded';
  if v_count <> 2200000 then
    raise exception 'recorded sum %', v_count;
  end if;
end;
$$;

rollback;
