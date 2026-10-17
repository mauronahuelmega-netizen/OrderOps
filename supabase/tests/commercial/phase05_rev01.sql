-- CC-P05-REV-01. Rolls back. Unpaid settlements are invalidated and replaced.
-- A recorded partial payment freezes the settlement. A fully paid settlement keeps its adjustment.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '97979797-9797-4979-7979-979797979801', 'authenticated', 'authenticated', 'rev01-finance-a@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '97979797-9797-4979-7979-979797979803', 'authenticated', 'authenticated', 'rev01-finance-b@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '97979797-9797-4979-7979-979797979802', 'authenticated', 'authenticated', 'rev01-super@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '97979797-9797-4979-7979-979797979804', 'authenticated', 'authenticated', 'rev01-promoter@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());
insert into commercial.platform_accounts (id, user_id, kind) values
  ('97979797-9797-4979-7979-979797979811', '97979797-9797-4979-7979-979797979801', 'internal'),
  ('97979797-9797-4979-7979-979797979813', '97979797-9797-4979-7979-979797979803', 'internal'),
  ('97979797-9797-4979-7979-979797979812', '97979797-9797-4979-7979-979797979802', 'internal'),
  ('97979797-9797-4979-7979-979797979814', '97979797-9797-4979-7979-979797979804', 'promoter');
insert into commercial.internal_role_assignments (account_id, role) values
  ('97979797-9797-4979-7979-979797979811', 'finance'),
  ('97979797-9797-4979-7979-979797979813', 'finance'),
  ('97979797-9797-4979-7979-979797979812', 'superadmin');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('97979797-9797-4979-7979-979797979821', '97979797-9797-4979-7979-979797979814', 'prev010001', 'Promotor Rev', 'active');
insert into commercial.promoter_bank_accounts (id, promoter_id, cbu_or_cvu, holder_name, is_current, created_by) values
  ('97979797-9797-4979-7979-979797979871', '97979797-9797-4979-7979-979797979821', '0000000000000000000097', 'Titular Rev', true, '97979797-9797-4979-7979-979797979811');
insert into public.businesses (id, name, slug, whatsapp_number) values
  ('97979797-9797-4979-7979-979797979831', 'Negocio Rev', 'negocio-rev01', '5491100000971');
insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel) values
  ('97979797-9797-4979-7979-979797979841', 'Lead Rev', 'lead rev01', 'promoter');
insert into commercial.commercial_opportunities (id, commercial_business_id, stage, owner_account_id) values
  ('97979797-9797-4979-7979-979797979851', '97979797-9797-4979-7979-979797979841', 'demo_done', '97979797-9797-4979-7979-979797979814');
insert into commercial.opportunity_attributions (id, opportunity_id, promoter_id, status, method, reason) values
  ('97979797-9797-4979-7979-979797979861', '97979797-9797-4979-7979-979797979851', '97979797-9797-4979-7979-979797979821', 'confirmed', 'manual', 'fixture');

select set_config('request.jwt.claim.sub', '97979797-9797-4979-7979-979797979802', true);

do $$
declare
  v_terms uuid;
  v_promoter uuid := '97979797-9797-4979-7979-979797979821';
  v_finance_a uuid := '97979797-9797-4979-7979-979797979811';
  v_finance_b uuid := '97979797-9797-4979-7979-979797979813';
  v_open jsonb;
  v_result jsonb;
  v_kept uuid;
  v_voided uuid;
  v_settlement uuid;
  v_replacement uuid;
  v_invoice uuid;
  v_total bigint;
  v_approved_by uuid;
  v_payment bigint;
begin
  v_terms := (commercial.win_opportunity('97979797-9797-4979-7979-979797979851', '97979797-9797-4979-7979-979797979831', null)->>'conversion_terms_id')::uuid;
  perform set_config('request.jwt.claim.sub', '97979797-9797-4979-7979-979797979801', true);

  -- A. Draft reversal invalidates and a replacement keeps only the live right.
  perform public.record_founder_service_start(v_terms, date '2019-01-10');
  v_open := public.open_obligation(v_terms, 'subscription', '2019-02-10');
  v_voided := (public.record_collection((v_open->>'obligation_id')::uuid, 'rev-a1', 'posted', 5500000, null)->>'collection_id')::uuid;
  perform public.accrue_commissions_for_collection(v_voided);
  v_open := public.open_obligation(v_terms, 'subscription', '2019-03-10');
  v_kept := (public.record_collection((v_open->>'obligation_id')::uuid, 'rev-a2', 'posted', 5500000, null)->>'collection_id')::uuid;
  perform public.accrue_commissions_for_collection(v_kept);
  update commercial.promoter_commissions
  set status = 'available', available_at = '2026-01-16 15:00:00+00'
  where collection_id in (v_voided, v_kept);
  v_settlement := (public.prepare_settlement(v_promoter, '2026-01', null)->>'settlement_id')::uuid;
  v_total := (select total_cents from commercial.promoter_settlements where id = v_settlement);
  v_result := public.reverse_collection(v_voided, 'draft');
  v_result := public.reverse_collection(v_voided, 'draft otra vez');
  if v_result->>'duplicate' is distinct from 'true'
     or (select count(*) from commercial.audit_events where entity_id = v_settlement and action = 'settlement.invalidated') <> 1
     or (select status from commercial.promoter_settlements where id = v_settlement) is distinct from 'invalidated'
     or (select total_cents from commercial.promoter_settlements where id = v_settlement) is distinct from v_total
     or (select count(*) from commercial.settlement_items where settlement_id = v_settlement and lineage = 'historical') <> 2
     or (select status from commercial.promoter_commissions where collection_id = v_voided) is distinct from 'voided'
     or (select status from commercial.promoter_commissions where collection_id = v_kept) is distinct from 'available' then
    raise exception 'A invalidate %', v_result;
  end if;
  v_result := public.prepare_settlement(v_promoter, '2026-01', null);
  if v_result->>'commercial_error_code' is distinct from 'replacement_required' then
    raise exception 'A prepare %', v_result;
  end if;
  v_result := public.replace_settlement(v_settlement, 'reemplazo enero');
  v_replacement := (v_result->>'settlement_id')::uuid;
  if v_result->>'duplicate' is distinct from 'false' or v_result->>'status' is distinct from 'draft'
     or (select replaces_settlement_id from commercial.promoter_settlements where id = v_replacement) is distinct from v_settlement
     or (select approved_by from commercial.promoter_settlements where id = v_replacement) is not null
     or (select total_cents from commercial.promoter_settlements where id = v_replacement) is distinct from 2200000
     or exists (
       select 1 from commercial.settlement_items item
       join commercial.promoter_commissions commission on commission.id = item.source_id
       where item.settlement_id = v_replacement and commission.collection_id = v_voided
     ) then
    raise exception 'A replace %', v_result;
  end if;
  v_result := public.replace_settlement(v_settlement, 'reemplazo enero');
  if v_result->>'duplicate' is distinct from 'true' or (v_result->>'settlement_id')::uuid is distinct from v_replacement
     or (select count(*) from commercial.promoter_settlements where replaces_settlement_id = v_settlement) <> 1 then
    raise exception 'A duplicate replace %', v_result;
  end if;
  begin
    update commercial.promoter_commissions set status = 'paid' where collection_id = v_voided;
    raise exception 'H voided became paid';
  exception when others then
    if sqlerrm not like '%voided_commission_immutable%' then
      raise;
    end if;
  end;
  perform set_config('request.jwt.claim.sub', '97979797-9797-4979-7979-979797979803', true);
  v_result := public.approve_settlement(v_settlement);
  if v_result->>'commercial_error_code' is distinct from 'settlement_invalidated' then
    raise exception 'L approve original %', v_result;
  end if;
  perform set_config('request.jwt.claim.sub', '97979797-9797-4979-7979-979797979801', true);
  v_result := public.approve_settlement(v_replacement);
  if v_result->>'commercial_error_code' is distinct from 'sod_violation' then
    raise exception 'P preparer approved %', v_result;
  end if;
  perform set_config('request.jwt.claim.sub', '97979797-9797-4979-7979-979797979803', true);
  v_result := public.approve_settlement(v_replacement);
  if v_result->>'status' is distinct from 'approved'
     or (select approved_by from commercial.promoter_settlements where id = v_replacement) is distinct from v_finance_b then
    raise exception 'A new approval %', v_result;
  end if;

  -- B. Approved reversal keeps the historical approval and requires a new one.
  perform set_config('request.jwt.claim.sub', '97979797-9797-4979-7979-979797979801', true);
  v_open := public.open_obligation(v_terms, 'subscription', '2019-04-10');
  v_voided := (public.record_collection((v_open->>'obligation_id')::uuid, 'rev-b1', 'posted', 5500000, null)->>'collection_id')::uuid;
  perform public.accrue_commissions_for_collection(v_voided);
  v_open := public.open_obligation(v_terms, 'subscription', '2019-05-10');
  v_kept := (public.record_collection((v_open->>'obligation_id')::uuid, 'rev-b2', 'posted', 5500000, null)->>'collection_id')::uuid;
  perform public.accrue_commissions_for_collection(v_kept);
  update commercial.promoter_commissions
  set status = 'available', available_at = '2026-02-16 15:00:00+00'
  where collection_id in (v_voided, v_kept);
  v_settlement := (public.prepare_settlement(v_promoter, '2026-02', null)->>'settlement_id')::uuid;
  v_total := (select total_cents from commercial.promoter_settlements where id = v_settlement);
  perform set_config('request.jwt.claim.sub', '97979797-9797-4979-7979-979797979803', true);
  perform public.approve_settlement(v_settlement);
  perform set_config('request.jwt.claim.sub', '97979797-9797-4979-7979-979797979801', true);
  perform public.reverse_collection(v_voided, 'approved');
  select total_cents, approved_by into v_total, v_approved_by from commercial.promoter_settlements where id = v_settlement;
  if (select status from commercial.promoter_settlements where id = v_settlement) is distinct from 'invalidated'
     or v_approved_by is distinct from v_finance_b
     or v_total is distinct from 4400000 then
    raise exception 'B history';
  end if;
  v_result := public.record_settlement_payment(v_settlement, 'rev-b-pay', 4400000, 'recorded', 'old', null);
  if v_result->>'commercial_error_code' is distinct from 'settlement_invalidated' then
    raise exception 'J old approval pays %', v_result;
  end if;
  v_result := public.replace_settlement(v_settlement, 'reemplazo febrero');
  v_replacement := (v_result->>'settlement_id')::uuid;
  if (select approved_by from commercial.promoter_settlements where id = v_replacement) is not null
     or (select total_cents from commercial.promoter_settlements where id = v_replacement) is distinct from 2200000 then
    raise exception 'B replacement inherited approval %', v_result;
  end if;
  perform set_config('request.jwt.claim.sub', '97979797-9797-4979-7979-979797979803', true);
  v_result := public.approve_settlement(v_replacement);
  if v_result->>'status' is distinct from 'approved' then
    raise exception 'B new approval %', v_result;
  end if;

  -- C and K. Payable reversal keeps the old invoice and does not make the replacement payable.
  perform set_config('request.jwt.claim.sub', '97979797-9797-4979-7979-979797979801', true);
  v_open := public.open_obligation(v_terms, 'subscription', '2019-06-10');
  v_voided := (public.record_collection((v_open->>'obligation_id')::uuid, 'rev-c1', 'posted', 5500000, null)->>'collection_id')::uuid;
  perform public.accrue_commissions_for_collection(v_voided);
  v_open := public.open_obligation(v_terms, 'subscription', '2019-07-10');
  v_kept := (public.record_collection((v_open->>'obligation_id')::uuid, 'rev-c2', 'posted', 5500000, null)->>'collection_id')::uuid;
  perform public.accrue_commissions_for_collection(v_kept);
  update commercial.promoter_commissions
  set status = 'available', available_at = '2026-03-16 15:00:00+00'
  where collection_id in (v_voided, v_kept);
  v_settlement := (public.prepare_settlement(v_promoter, '2026-03', null)->>'settlement_id')::uuid;
  perform set_config('request.jwt.claim.sub', '97979797-9797-4979-7979-979797979803', true);
  perform public.approve_settlement(v_settlement);
  perform set_config('request.jwt.claim.sub', '97979797-9797-4979-7979-979797979804', true);
  v_result := public.submit_invoice(v_settlement, 4400000, 'invoices/' || v_settlement::text || '/old.pdf');
  v_invoice := (v_result->>'invoice_id')::uuid;
  perform set_config('request.jwt.claim.sub', '97979797-9797-4979-7979-979797979801', true);
  perform public.review_invoice(v_invoice, 'accepted', null);
  perform public.record_settlement_payment(v_settlement, 'rev-c-fail', 4400000, 'failed', 'fallo', null);
  perform public.reverse_collection(v_voided, 'payable');
  if (select status from commercial.promoter_settlements where id = v_settlement) is distinct from 'invalidated'
     or (select status from commercial.promoter_invoices where id = v_invoice) is distinct from 'accepted'
     or (select total_cents from commercial.promoter_settlements where id = v_settlement) is distinct from 4400000
     or (select count(*) from commercial.settlement_items where settlement_id = v_settlement) <> 2 then
    raise exception 'C history';
  end if;
  v_result := public.replace_settlement(v_settlement, 'reemplazo marzo');
  v_replacement := (v_result->>'settlement_id')::uuid;
  if (select status from commercial.promoter_settlements where id = v_replacement) is distinct from 'draft'
     or exists (select 1 from commercial.promoter_invoices where settlement_id = v_replacement) then
    raise exception 'K old invoice enabled replacement %', v_result;
  end if;
  v_result := public.record_settlement_payment(v_replacement, 'rev-c-early', 2200000, 'recorded', 'antes', null);
  if v_result->>'ok' is distinct from 'false' then
    raise exception 'K replacement paid early %', v_result;
  end if;
  perform set_config('request.jwt.claim.sub', '97979797-9797-4979-7979-979797979803', true);
  perform public.approve_settlement(v_replacement);
  perform set_config('request.jwt.claim.sub', '97979797-9797-4979-7979-979797979804', true);
  v_result := public.submit_invoice(v_replacement, 2200000, 'invoices/' || v_replacement::text || '/new.pdf');
  perform set_config('request.jwt.claim.sub', '97979797-9797-4979-7979-979797979801', true);
  v_result := public.review_invoice((v_result->>'invoice_id')::uuid, 'accepted', null);
  if (select status from commercial.promoter_settlements where id = v_replacement) is distinct from 'payable'
     or (select status from commercial.promoter_invoices where id = v_invoice) is distinct from 'accepted' then
    raise exception 'C new invoice %', v_result;
  end if;

  -- I. The surviving right is paid once, from the replacement only.
  v_result := public.record_settlement_payment(v_replacement, 'rev-i-pay', 2200000, 'recorded', 'unica', null);
  v_result := public.record_settlement_payment(v_settlement, 'rev-i-old', 2200000, 'recorded', 'doble', null);
  if (select status from commercial.promoter_commissions where collection_id = v_kept) is distinct from 'paid'
     or v_result->>'commercial_error_code' is distinct from 'settlement_invalidated'
     or (select count(*) from commercial.settlement_payments where status = 'recorded' and settlement_id in (v_settlement, v_replacement)) <> 1
     or (select count(*) from commercial.settlement_items where source_kind = 'commission' and lineage = 'active' and source_id = (select id from commercial.promoter_commissions where collection_id = v_kept)) <> 1 then
    raise exception 'I double pay %', v_result;
  end if;

  -- D and M. A successful partial payment freezes the settlement.
  v_open := public.open_obligation(v_terms, 'subscription', '2019-08-10');
  v_voided := (public.record_collection((v_open->>'obligation_id')::uuid, 'rev-d1', 'posted', 5500000, null)->>'collection_id')::uuid;
  perform public.accrue_commissions_for_collection(v_voided);
  update commercial.promoter_commissions
  set status = 'available', available_at = '2026-04-16 15:00:00+00'
  where collection_id = v_voided;
  v_settlement := (public.prepare_settlement(v_promoter, '2026-04', null)->>'settlement_id')::uuid;
  perform set_config('request.jwt.claim.sub', '97979797-9797-4979-7979-979797979803', true);
  perform public.approve_settlement(v_settlement);
  perform set_config('request.jwt.claim.sub', '97979797-9797-4979-7979-979797979804', true);
  v_result := public.submit_invoice(v_settlement, 2200000, 'invoices/' || v_settlement::text || '/part.pdf');
  perform set_config('request.jwt.claim.sub', '97979797-9797-4979-7979-979797979801', true);
  perform public.review_invoice((v_result->>'invoice_id')::uuid, 'accepted', null);
  perform public.record_settlement_payment(v_settlement, 'rev-d-part', 1000000, 'recorded', 'parcial', null);
  v_payment := (select amount_cents from commercial.settlement_payments where idempotency_key = 'rev-d-part');
  perform public.reverse_collection(v_voided, 'parcial');
  v_result := public.replace_settlement(v_settlement, 'no corresponde');
  if v_result->>'ok' is distinct from 'false'
     or (select status from commercial.promoter_settlements where id = v_settlement) is distinct from 'reconciliation_required'
     or (select total_cents from commercial.promoter_settlements where id = v_settlement) is distinct from 2200000
     or (select amount_cents from commercial.settlement_payments where idempotency_key = 'rev-d-part') is distinct from v_payment
     or (select lineage from commercial.settlement_items where settlement_id = v_settlement) is distinct from 'active'
     or (select count(*) from commercial.commission_adjustments where commission_id = (select id from commercial.promoter_commissions where collection_id = v_voided)) <> 0
     or (select count(*) from commercial.audit_events where entity_id = v_settlement and action = 'settlement.reconciliation_required') <> 1 then
    raise exception 'D freeze %', v_result;
  end if;
  v_result := public.record_settlement_payment(v_settlement, 'rev-d-more', 1200000, 'recorded', 'resto', null);
  if v_result->>'commercial_error_code' is distinct from 'reconciliation_required' then
    raise exception 'M later payment %', v_result;
  end if;
  perform set_config('request.jwt.claim.sub', '97979797-9797-4979-7979-979797979803', true);
  v_result := public.approve_settlement(v_settlement);
  if v_result->>'commercial_error_code' is distinct from 'reconciliation_required' then
    raise exception 'D approve %', v_result;
  end if;

  -- E. Fully paid reversal keeps the settlement and one negative adjustment.
  perform set_config('request.jwt.claim.sub', '97979797-9797-4979-7979-979797979801', true);
  v_open := public.open_obligation(v_terms, 'subscription', '2019-09-10');
  v_voided := (public.record_collection((v_open->>'obligation_id')::uuid, 'rev-e1', 'posted', 5500000, null)->>'collection_id')::uuid;
  perform public.accrue_commissions_for_collection(v_voided);
  update commercial.promoter_commissions
  set status = 'available', available_at = '2026-05-16 15:00:00+00'
  where collection_id = v_voided;
  v_settlement := (public.prepare_settlement(v_promoter, '2026-05', null)->>'settlement_id')::uuid;
  perform set_config('request.jwt.claim.sub', '97979797-9797-4979-7979-979797979803', true);
  perform public.approve_settlement(v_settlement);
  perform set_config('request.jwt.claim.sub', '97979797-9797-4979-7979-979797979804', true);
  v_result := public.submit_invoice(v_settlement, 2200000, 'invoices/' || v_settlement::text || '/paid.pdf');
  perform set_config('request.jwt.claim.sub', '97979797-9797-4979-7979-979797979801', true);
  perform public.review_invoice((v_result->>'invoice_id')::uuid, 'accepted', null);
  perform public.record_settlement_payment(v_settlement, 'rev-e-full', 2200000, 'recorded', 'full', null);
  v_result := public.reverse_collection(v_voided, 'pagada');
  v_result := public.reverse_collection(v_voided, 'pagada otra vez');
  if v_result->>'duplicate' is distinct from 'true'
     or (select status from commercial.promoter_settlements where id = v_settlement) is distinct from 'paid'
     or (select total_cents from commercial.promoter_settlements where id = v_settlement) is distinct from 2200000
     or (select status from commercial.promoter_commissions where collection_id = v_voided) is distinct from 'paid'
     or (select amount_cents from commercial.settlement_payments where idempotency_key = 'rev-e-full') is distinct from 2200000
     or (select count(*) from commercial.commission_adjustments where commission_id = (select id from commercial.promoter_commissions where collection_id = v_voided) and amount_cents = -2200000 and status = 'available') <> 1 then
    raise exception 'E paid %', v_result;
  end if;
  v_result := public.replace_settlement(v_settlement, 'no');
  if v_result->>'ok' is distinct from 'false' then
    raise exception 'E replacement %', v_result;
  end if;

  -- P. Promoters and superadmins cannot replace. Direct commercial execute stays revoked.
  perform set_config('request.jwt.claim.sub', '97979797-9797-4979-7979-979797979804', true);
  v_result := public.replace_settlement(v_settlement, 'promotor');
  if v_result->>'commercial_error_code' is distinct from 'forbidden' then
    raise exception 'P promoter %', v_result;
  end if;
  perform set_config('request.jwt.claim.sub', '97979797-9797-4979-7979-979797979802', true);
  v_result := public.replace_settlement(v_settlement, 'super');
  if v_result->>'commercial_error_code' is distinct from 'forbidden' then
    raise exception 'P superadmin %', v_result;
  end if;
  if has_function_privilege('anon', 'public.replace_settlement(uuid,text)', 'execute')
     or has_function_privilege('authenticated', 'commercial.replace_settlement(uuid,text)', 'execute')
     or not has_function_privilege('authenticated', 'public.replace_settlement(uuid,text)', 'execute') then
    raise exception 'P grants';
  end if;
  if (select prepared_by from commercial.promoter_settlements where id = v_replacement) is distinct from v_finance_a then
    raise exception 'replacement actor';
  end if;
end;
$$;

rollback;
