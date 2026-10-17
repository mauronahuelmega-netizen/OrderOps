-- One accepted invoice per settlement. A rejected invoice stays. A second submitted invoice may exist.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '86868686-8686-4868-8868-868686868601', 'authenticated', 'authenticated', 'inv1-finance-a@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '86868686-8686-4868-8868-868686868603', 'authenticated', 'authenticated', 'inv1-finance-b@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '86868686-8686-4868-8868-868686868602', 'authenticated', 'authenticated', 'inv1-super@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '86868686-8686-4868-8868-868686868604', 'authenticated', 'authenticated', 'inv1-promoter@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());
insert into commercial.platform_accounts (id, user_id, kind) values
  ('86868686-8686-4868-8868-868686868611', '86868686-8686-4868-8868-868686868601', 'internal'),
  ('86868686-8686-4868-8868-868686868613', '86868686-8686-4868-8868-868686868603', 'internal'),
  ('86868686-8686-4868-8868-868686868612', '86868686-8686-4868-8868-868686868602', 'internal'),
  ('86868686-8686-4868-8868-868686868614', '86868686-8686-4868-8868-868686868604', 'promoter');
insert into commercial.internal_role_assignments (account_id, role) values
  ('86868686-8686-4868-8868-868686868611', 'finance'),
  ('86868686-8686-4868-8868-868686868613', 'finance'),
  ('86868686-8686-4868-8868-868686868612', 'superadmin');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('86868686-8686-4868-8868-868686868621', '86868686-8686-4868-8868-868686868614', 'pinvone0001', 'Promotor Una', 'active');
insert into public.businesses (id, name, slug, whatsapp_number) values
  ('86868686-8686-4868-8868-868686868631', 'Negocio Una', 'negocio-inv-one', '5491100000868');
insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel) values
  ('86868686-8686-4868-8868-868686868641', 'Lead Una', 'lead una factura', 'promoter');
insert into commercial.commercial_opportunities (id, commercial_business_id, stage, owner_account_id) values
  ('86868686-8686-4868-8868-868686868651', '86868686-8686-4868-8868-868686868641', 'demo_done', '86868686-8686-4868-8868-868686868614');
insert into commercial.opportunity_attributions (id, opportunity_id, promoter_id, status, method, reason) values
  ('86868686-8686-4868-8868-868686868661', '86868686-8686-4868-8868-868686868651', '86868686-8686-4868-8868-868686868621', 'confirmed', 'manual', 'fixture');

select set_config('request.jwt.claim.sub', '86868686-8686-4868-8868-868686868602', true);

do $$
declare
  v_terms uuid;
  v_promoter uuid := '86868686-8686-4868-8868-868686868621';
  v_open jsonb;
  v_collection uuid;
  v_settlement uuid;
  v_first uuid;
  v_second uuid;
  v_rejected uuid;
  v_result jsonb;
begin
  v_terms := (commercial.win_opportunity('86868686-8686-4868-8868-868686868651', '86868686-8686-4868-8868-868686868631', null)->>'conversion_terms_id')::uuid;
  perform set_config('request.jwt.claim.sub', '86868686-8686-4868-8868-868686868601', true);
  perform public.record_founder_service_start(v_terms, date '2019-01-10');
  v_open := public.open_obligation(v_terms, 'subscription', '2019-02-10');
  v_collection := (public.record_collection((v_open->>'obligation_id')::uuid, 'inv-one', 'posted', 5500000, null)->>'collection_id')::uuid;
  perform public.accrue_commissions_for_collection(v_collection);
  update commercial.promoter_commissions set status = 'available', available_at = '2026-08-16 15:00:00+00' where collection_id = v_collection;
  v_settlement := (public.prepare_settlement(v_promoter, '2026-08', null)->>'settlement_id')::uuid;
  perform set_config('request.jwt.claim.sub', '86868686-8686-4868-8868-868686868603', true);
  perform public.approve_settlement(v_settlement);
  perform set_config('request.jwt.claim.sub', '86868686-8686-4868-8868-868686868604', true);
  v_first := (public.submit_invoice(v_settlement, 2200000, 'invoices/' || v_settlement::text || '/a.pdf')->>'invoice_id')::uuid;
  v_rejected := (public.submit_invoice(v_settlement, 100, 'invoices/' || v_settlement::text || '/bad.pdf')->>'invoice_id')::uuid;
  v_second := (public.submit_invoice(v_settlement, 2200000, 'invoices/' || v_settlement::text || '/b.pdf')->>'invoice_id')::uuid;
  if (select count(*) from commercial.promoter_invoices where settlement_id = v_settlement and status = 'submitted') <> 3 then
    raise exception 'submitted history missing';
  end if;
  perform set_config('request.jwt.claim.sub', '86868686-8686-4868-8868-868686868601', true);
  v_result := public.review_invoice(v_rejected, 'rejected', 'importe');
  if v_result->>'status' is distinct from 'rejected'
     or (select rejection_reason from commercial.promoter_invoices where id = v_rejected) is distinct from 'importe' then
    raise exception 'reject %', v_result;
  end if;
  v_result := public.review_invoice(v_first, 'accepted', null);
  if (select status from commercial.promoter_settlements where id = v_settlement) is distinct from 'payable' then
    raise exception 'first accept %', v_result;
  end if;
  v_result := public.review_invoice(v_second, 'accepted', null);
  if v_result->>'commercial_error_code' is distinct from 'validation'
     or (select count(*) from commercial.promoter_invoices where settlement_id = v_settlement and status = 'accepted') <> 1
     or (select status from commercial.promoter_invoices where id = v_rejected) is distinct from 'rejected' then
    raise exception 'second accept %', v_result;
  end if;
  begin
    insert into commercial.promoter_invoices (settlement_id, promoter_id, amount_cents, status, document_path)
    values (v_settlement, v_promoter, 2200000, 'accepted', 'invoices/' || v_settlement::text || '/extra.pdf');
    raise exception 'direct second accepted inserted';
  exception when unique_violation then
    null;
  end;
end;
$$;

rollback;
