-- P05 P0. Rolls back. Reversal of an unsettled right voids it. A voided right cannot be paid or restored.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '98989898-9898-4989-8989-989898989801', 'authenticated', 'authenticated', 'p0void-finance-a@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '98989898-9898-4989-8989-989898989803', 'authenticated', 'authenticated', 'p0void-finance-b@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '98989898-9898-4989-8989-989898989802', 'authenticated', 'authenticated', 'p0void-super@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '98989898-9898-4989-8989-989898989804', 'authenticated', 'authenticated', 'p0void-promoter@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());
insert into commercial.platform_accounts (id, user_id, kind) values
  ('98989898-9898-4989-8989-989898989811', '98989898-9898-4989-8989-989898989801', 'internal'),
  ('98989898-9898-4989-8989-989898989813', '98989898-9898-4989-8989-989898989803', 'internal'),
  ('98989898-9898-4989-8989-989898989812', '98989898-9898-4989-8989-989898989802', 'internal'),
  ('98989898-9898-4989-8989-989898989814', '98989898-9898-4989-8989-989898989804', 'promoter');
insert into commercial.internal_role_assignments (account_id, role) values
  ('98989898-9898-4989-8989-989898989811', 'finance'),
  ('98989898-9898-4989-8989-989898989813', 'finance'),
  ('98989898-9898-4989-8989-989898989812', 'superadmin');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('98989898-9898-4989-8989-989898989821', '98989898-9898-4989-8989-989898989814', 'pp0void0001', 'Promotor Void', 'active');
insert into commercial.promoter_bank_accounts (id, promoter_id, cbu_or_cvu, holder_name, is_current, created_by) values
  ('98989898-9898-4989-8989-989898989871', '98989898-9898-4989-8989-989898989821', '0000000000000000000011', 'Titular Void', true, '98989898-9898-4989-8989-989898989811');
insert into public.businesses (id, name, slug, whatsapp_number) values
  ('98989898-9898-4989-8989-989898989831', 'Negocio Void', 'negocio-void-p0', '5491100000961');
insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel) values
  ('98989898-9898-4989-8989-989898989841', 'Lead Void', 'lead void p0', 'promoter');
insert into commercial.commercial_opportunities (id, commercial_business_id, stage, owner_account_id) values
  ('98989898-9898-4989-8989-989898989851', '98989898-9898-4989-8989-989898989841', 'demo_done', '98989898-9898-4989-8989-989898989814');
insert into commercial.opportunity_attributions (id, opportunity_id, promoter_id, status, method, reason) values
  ('98989898-9898-4989-8989-989898989861', '98989898-9898-4989-8989-989898989851', '98989898-9898-4989-8989-989898989821', 'confirmed', 'manual', 'fixture');

select set_config('request.jwt.claim.sub', '98989898-9898-4989-8989-989898989802', true);

do $$
declare
  v_terms uuid;
  v_promoter uuid := '98989898-9898-4989-8989-989898989821';
  v_open jsonb;
  v_result jsonb;
  v_collection uuid;
  v_commission uuid;
  v_settlement uuid;
  v_total bigint;
  v_items bigint;
begin
  v_terms := (commercial.win_opportunity('98989898-9898-4989-8989-989898989851', '98989898-9898-4989-8989-989898989831', null)->>'conversion_terms_id')::uuid;
  perform set_config('request.jwt.claim.sub', '98989898-9898-4989-8989-989898989801', true);

  perform public.record_founder_service_start(v_terms, date '2019-01-10');
  v_open := public.open_obligation(v_terms, 'subscription', '2019-02-10');
  v_collection := (public.record_collection((v_open->>'obligation_id')::uuid, 'void-pending', 'posted', 5500000, null)->>'collection_id')::uuid;
  perform public.accrue_commissions_for_collection(v_collection);
  perform public.reverse_collection(v_collection, 'pending');
  if (select status from commercial.promoter_commissions where collection_id = v_collection) is distinct from 'voided' then
    raise exception 'pending not voided';
  end if;

  v_open := public.open_obligation(v_terms, 'subscription', '2019-03-10');
  v_collection := (public.record_collection((v_open->>'obligation_id')::uuid, 'void-available', 'posted', 5500000, null)->>'collection_id')::uuid;
  perform public.accrue_commissions_for_collection(v_collection);
  update commercial.promoter_commissions set status = 'available', available_at = '2026-02-16 15:00:00+00' where collection_id = v_collection;
  perform public.reverse_collection(v_collection, 'available');
  if (select status from commercial.promoter_commissions where collection_id = v_collection) is distinct from 'voided' then
    raise exception 'available not voided';
  end if;

  v_open := public.open_obligation(v_terms, 'subscription', '2019-04-10');
  v_collection := (public.record_collection((v_open->>'obligation_id')::uuid, 'void-held', 'posted', 5500000, null)->>'collection_id')::uuid;
  perform public.accrue_commissions_for_collection(v_collection);
  update commercial.promoter_commissions set status = 'held' where collection_id = v_collection;
  perform public.reverse_collection(v_collection, 'held');
  if (select status from commercial.promoter_commissions where collection_id = v_collection) is distinct from 'voided' then
    raise exception 'held not voided';
  end if;

  v_open := public.open_obligation(v_terms, 'subscription', '2019-05-10');
  v_collection := (public.record_collection((v_open->>'obligation_id')::uuid, 'void-draft', 'posted', 5500000, null)->>'collection_id')::uuid;
  perform public.accrue_commissions_for_collection(v_collection);
  update commercial.promoter_commissions set status = 'available', available_at = '2026-03-16 15:00:00+00' where collection_id = v_collection;
  v_settlement := (public.prepare_settlement(v_promoter, '2026-03', null)->>'settlement_id')::uuid;
  perform public.reverse_collection(v_collection, 'draft');
  select total_cents into v_total from commercial.promoter_settlements where id = v_settlement;
  select coalesce(sum(amount_cents), 0) into v_items from commercial.settlement_items where settlement_id = v_settlement;
  if v_total is distinct from v_items
     or (select status from commercial.promoter_commissions where collection_id = v_collection) is distinct from 'voided'
     or (select status from commercial.promoter_settlements where id = v_settlement) is distinct from 'invalidated' then
    raise exception 'draft totals';
  end if;
  perform set_config('request.jwt.claim.sub', '98989898-9898-4989-8989-989898989803', true);
  v_result := public.approve_settlement(v_settlement);
  if v_result->>'commercial_error_code' is distinct from 'settlement_invalidated' then
    raise exception 'draft approve %', v_result;
  end if;

  perform set_config('request.jwt.claim.sub', '98989898-9898-4989-8989-989898989801', true);
  v_open := public.open_obligation(v_terms, 'subscription', '2019-06-10');
  v_collection := (public.record_collection((v_open->>'obligation_id')::uuid, 'void-approved', 'posted', 5500000, null)->>'collection_id')::uuid;
  perform public.accrue_commissions_for_collection(v_collection);
  update commercial.promoter_commissions set status = 'available', available_at = '2026-04-16 15:00:00+00' where collection_id = v_collection;
  v_settlement := (public.prepare_settlement(v_promoter, '2026-04', null)->>'settlement_id')::uuid;
  perform set_config('request.jwt.claim.sub', '98989898-9898-4989-8989-989898989803', true);
  perform public.approve_settlement(v_settlement);
  perform set_config('request.jwt.claim.sub', '98989898-9898-4989-8989-989898989801', true);
  perform public.reverse_collection(v_collection, 'approved');
  if (select status from commercial.promoter_settlements where id = v_settlement) is distinct from 'invalidated'
     or (select approved_by from commercial.promoter_settlements where id = v_settlement) is distinct from '98989898-9898-4989-8989-989898989813'::uuid then
    raise exception 'approved history lost';
  end if;
  perform set_config('request.jwt.claim.sub', '98989898-9898-4989-8989-989898989804', true);
  v_result := public.submit_invoice(v_settlement, 2200000, 'invoices/' || v_settlement::text || '/a.pdf');
  if v_result->>'ok' is distinct from 'false' or (select status from commercial.promoter_settlements where id = v_settlement) is distinct from 'invalidated' then
    raise exception 'approved invoice %', v_result;
  end if;

  perform set_config('request.jwt.claim.sub', '98989898-9898-4989-8989-989898989801', true);
  v_open := public.open_obligation(v_terms, 'subscription', '2019-07-10');
  v_collection := (public.record_collection((v_open->>'obligation_id')::uuid, 'void-payable', 'posted', 5500000, null)->>'collection_id')::uuid;
  perform public.accrue_commissions_for_collection(v_collection);
  v_commission := (select id from commercial.promoter_commissions where collection_id = v_collection);
  update commercial.promoter_commissions set status = 'available', available_at = '2026-05-16 15:00:00+00' where id = v_commission;
  v_settlement := (public.prepare_settlement(v_promoter, '2026-05', null)->>'settlement_id')::uuid;
  perform set_config('request.jwt.claim.sub', '98989898-9898-4989-8989-989898989803', true);
  perform public.approve_settlement(v_settlement);
  perform set_config('request.jwt.claim.sub', '98989898-9898-4989-8989-989898989804', true);
  v_result := public.submit_invoice(v_settlement, 2200000, 'invoices/' || v_settlement::text || '/p.pdf');
  perform set_config('request.jwt.claim.sub', '98989898-9898-4989-8989-989898989801', true);
  perform public.review_invoice((v_result->>'invoice_id')::uuid, 'accepted', null);
  v_result := public.record_settlement_payment(v_settlement, 'void-fail', 2200000, 'failed', 'fallo', null);
  if v_result->>'status' is distinct from 'failed' or (select status from commercial.promoter_commissions where id = v_commission) is distinct from 'in_settlement' then
    raise exception 'failed %', v_result;
  end if;
  perform public.reverse_collection(v_collection, 'payable');
  v_result := public.record_settlement_payment(v_settlement, 'void-pay', 2200000, 'recorded', 'ref', null);
  if v_result->>'commercial_error_code' is distinct from 'settlement_invalidated' or (select status from commercial.promoter_commissions where id = v_commission) is distinct from 'voided' or (select status from commercial.promoter_settlements where id = v_settlement) is distinct from 'invalidated' then
    raise exception 'payable payment %', v_result;
  end if;

  v_open := public.open_obligation(v_terms, 'subscription', '2019-08-10');
  v_collection := (public.record_collection((v_open->>'obligation_id')::uuid, 'void-partial', 'posted', 5500000, null)->>'collection_id')::uuid;
  perform public.accrue_commissions_for_collection(v_collection);
  v_commission := (select id from commercial.promoter_commissions where collection_id = v_collection);
  update commercial.promoter_commissions set status = 'available', available_at = '2026-06-16 15:00:00+00' where id = v_commission;
  v_settlement := (public.prepare_settlement(v_promoter, '2026-06', null)->>'settlement_id')::uuid;
  perform set_config('request.jwt.claim.sub', '98989898-9898-4989-8989-989898989803', true);
  perform public.approve_settlement(v_settlement);
  perform set_config('request.jwt.claim.sub', '98989898-9898-4989-8989-989898989804', true);
  v_result := public.submit_invoice(v_settlement, 2200000, 'invoices/' || v_settlement::text || '/part.pdf');
  perform set_config('request.jwt.claim.sub', '98989898-9898-4989-8989-989898989801', true);
  perform public.review_invoice((v_result->>'invoice_id')::uuid, 'accepted', null);
  perform public.record_settlement_payment(v_settlement, 'void-part', 1000000, 'recorded', 'parcial', null);
  perform public.reverse_collection(v_collection, 'partial');
  v_result := public.record_settlement_payment(v_settlement, 'void-rest', 1200000, 'recorded', 'resto', null);
  if v_result->>'commercial_error_code' is distinct from 'reconciliation_required'
     or (select status from commercial.promoter_commissions where id = v_commission) is distinct from 'voided'
     or (select status from commercial.promoter_settlements where id = v_settlement) is distinct from 'reconciliation_required'
     or (select amount_cents from commercial.settlement_payments where idempotency_key = 'void-part') is distinct from 1000000 then
    raise exception 'partial %', v_result;
  end if;

  v_open := public.open_obligation(v_terms, 'subscription', '2019-09-10');
  v_collection := (public.record_collection((v_open->>'obligation_id')::uuid, 'void-paid', 'posted', 5500000, null)->>'collection_id')::uuid;
  perform public.accrue_commissions_for_collection(v_collection);
  v_commission := (select id from commercial.promoter_commissions where collection_id = v_collection);
  update commercial.promoter_commissions set status = 'available', available_at = '2026-07-16 15:00:00+00' where id = v_commission;
  v_settlement := (public.prepare_settlement(v_promoter, '2026-07', null)->>'settlement_id')::uuid;
  perform set_config('request.jwt.claim.sub', '98989898-9898-4989-8989-989898989803', true);
  perform public.approve_settlement(v_settlement);
  perform set_config('request.jwt.claim.sub', '98989898-9898-4989-8989-989898989804', true);
  v_result := public.submit_invoice(v_settlement, 2200000, 'invoices/' || v_settlement::text || '/paid.pdf');
  perform set_config('request.jwt.claim.sub', '98989898-9898-4989-8989-989898989801', true);
  perform public.review_invoice((v_result->>'invoice_id')::uuid, 'accepted', null);
  perform public.record_settlement_payment(v_settlement, 'void-full', 2200000, 'recorded', 'full', null);
  v_result := public.reverse_collection(v_collection, 'already paid');
  if (select status from commercial.promoter_commissions where id = v_commission) is distinct from 'paid' or (select count(*) from commercial.commission_adjustments where commission_id = v_commission and amount_cents = -2200000 and status = 'available') <> 1 then
    raise exception 'paid reverse %', v_result;
  end if;
end;
$$;

rollback;
