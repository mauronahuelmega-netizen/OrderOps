-- E2E-05 second clause. Rolls back. A paid reversal stays available until finance includes it
-- beside enough positive rights. A negative-only settlement is rejected and the adjustment remains pending.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '75757575-7575-4757-8757-757575757501', 'authenticated', 'authenticated', 'neg-a@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '75757575-7575-4757-8757-757575757503', 'authenticated', 'authenticated', 'neg-b@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '75757575-7575-4757-8757-757575757502', 'authenticated', 'authenticated', 'neg-s@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '75757575-7575-4757-8757-757575757504', 'authenticated', 'authenticated', 'neg-p@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());
insert into commercial.platform_accounts (id, user_id, kind) values
  ('75757575-7575-4757-8757-757575757511', '75757575-7575-4757-8757-757575757501', 'internal'),
  ('75757575-7575-4757-8757-757575757513', '75757575-7575-4757-8757-757575757503', 'internal'),
  ('75757575-7575-4757-8757-757575757512', '75757575-7575-4757-8757-757575757502', 'internal'),
  ('75757575-7575-4757-8757-757575757514', '75757575-7575-4757-8757-757575757504', 'promoter');
insert into commercial.internal_role_assignments (account_id, role) values
  ('75757575-7575-4757-8757-757575757511', 'finance'),
  ('75757575-7575-4757-8757-757575757513', 'finance'),
  ('75757575-7575-4757-8757-757575757512', 'superadmin');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('75757575-7575-4757-8757-757575757521', '75757575-7575-4757-8757-757575757514', 'pneg0000001', 'Promotor Ajuste', 'active');
insert into commercial.promoter_bank_accounts (id, promoter_id, cbu_or_cvu, holder_name, is_current, created_by) values
  ('75757575-7575-4757-8757-757575757571', '75757575-7575-4757-8757-757575757521', '0000000000000000000075', 'Titular Ajuste', true, '75757575-7575-4757-8757-757575757511');
insert into public.businesses (id, name, slug, whatsapp_number) values
  ('75757575-7575-4757-8757-757575757531', 'Negocio Ajuste', 'negocio-ajuste-neg', '5491100000751');
insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel) values
  ('75757575-7575-4757-8757-757575757541', 'Lead Ajuste', 'lead ajuste neg', 'promoter');
insert into commercial.commercial_opportunities (id, commercial_business_id, stage, owner_account_id) values
  ('75757575-7575-4757-8757-757575757551', '75757575-7575-4757-8757-757575757541', 'demo_done', '75757575-7575-4757-8757-757575757514');
insert into commercial.opportunity_attributions (id, opportunity_id, promoter_id, status, method, reason) values
  ('75757575-7575-4757-8757-757575757561', '75757575-7575-4757-8757-757575757551', '75757575-7575-4757-8757-757575757521', 'confirmed', 'manual', 'fixture');

select set_config('request.jwt.claim.sub', '75757575-7575-4757-8757-757575757502', true);

do $$
declare
  v_terms uuid;
  v_promoter uuid := '75757575-7575-4757-8757-757575757521';
  v_open jsonb;
  v_paid uuid;
  v_next uuid;
  v_settlement uuid;
  v_adjustment uuid;
  v_result jsonb;
begin
  v_terms := (commercial.win_opportunity('75757575-7575-4757-8757-757575757551', '75757575-7575-4757-8757-757575757531', null)->>'conversion_terms_id')::uuid;
  perform set_config('request.jwt.claim.sub', '75757575-7575-4757-8757-757575757501', true);
  v_open := public.open_obligation(v_terms, 'subscription', 'neg:paid');
  v_paid := (public.record_collection((v_open->>'obligation_id')::uuid, 'neg-paid', 'posted', 5500000, null)->>'collection_id')::uuid;
  perform public.accrue_commissions_for_collection(v_paid);
  update commercial.promoter_commissions set status = 'available', available_at = '2026-05-16 15:00:00+00' where collection_id = v_paid;
  v_settlement := (public.prepare_settlement(v_promoter, '2026-05', null)->>'settlement_id')::uuid;
  perform set_config('request.jwt.claim.sub', '75757575-7575-4757-8757-757575757503', true);
  perform public.approve_settlement(v_settlement);
  perform set_config('request.jwt.claim.sub', '75757575-7575-4757-8757-757575757504', true);
  v_result := public.submit_invoice(v_settlement, 2200000, 'invoices/' || v_settlement::text || '/paid.pdf');
  perform set_config('request.jwt.claim.sub', '75757575-7575-4757-8757-757575757501', true);
  perform public.review_invoice((v_result->>'invoice_id')::uuid, 'accepted', null);
  perform public.record_settlement_payment(v_settlement, 'neg-full', 2200000, 'recorded', 'full', null);
  perform public.reverse_collection(v_paid, 'ya pagada');
  select id into v_adjustment from commercial.commission_adjustments
  where amount_cents = -2200000 and status = 'available';
  if v_adjustment is null or (select status from commercial.promoter_settlements where id = v_settlement) is distinct from 'paid' then
    raise exception 'adjustment missing';
  end if;

  begin
    perform public.prepare_settlement(v_promoter, '2026-07', array[v_adjustment]);
    raise exception 'negative settlement was created';
  exception when others then
    if sqlerrm not like '%settlement total is negative%' then
      raise;
    end if;
  end;
  if (select status from commercial.commission_adjustments where id = v_adjustment) is distinct from 'available' then
    raise exception 'negative-only prepare consumed the adjustment';
  end if;

  v_open := public.open_obligation(v_terms, 'subscription', 'neg:next');
  v_next := (public.record_collection((v_open->>'obligation_id')::uuid, 'neg-next', 'posted', 5500000, null)->>'collection_id')::uuid;
  perform public.accrue_commissions_for_collection(v_next);
  update commercial.promoter_commissions set status = 'available', available_at = '2026-06-16 15:00:00+00' where collection_id = v_next;
  v_result := public.prepare_settlement(v_promoter, '2026-06', array[v_adjustment]);
  if (v_result->>'total_cents')::bigint is distinct from 0
     or (select status from commercial.commission_adjustments where id = v_adjustment) is distinct from 'in_settlement'
     or (select count(*) from commercial.settlement_items where settlement_id = (v_result->>'settlement_id')::uuid) <> 2
     or (select total_cents from commercial.promoter_settlements where id = v_settlement) is distinct from 2200000 then
    raise exception 'later settlement %', v_result;
  end if;
end;
$$;

rollback;
