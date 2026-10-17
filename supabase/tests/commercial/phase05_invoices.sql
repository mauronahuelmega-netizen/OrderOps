-- P05-T07. Rolls back. A matching invoice makes the settlement payable. A mismatch can only be rejected.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222201', 'authenticated', 'authenticated', 'phase05-finance-inv-a@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222203', 'authenticated', 'authenticated', 'phase05-finance-inv-b@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222202', 'authenticated', 'authenticated', 'phase05-super-inv@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222204', 'authenticated', 'authenticated', 'phase05-promoter-inv@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222205', 'authenticated', 'authenticated', 'phase05-promoter-other@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());
insert into commercial.platform_accounts (id, user_id, kind) values
  ('22222222-2222-4222-8222-222222222211', '22222222-2222-4222-8222-222222222201', 'internal'),
  ('22222222-2222-4222-8222-222222222213', '22222222-2222-4222-8222-222222222203', 'internal'),
  ('22222222-2222-4222-8222-222222222212', '22222222-2222-4222-8222-222222222202', 'internal'),
  ('22222222-2222-4222-8222-222222222214', '22222222-2222-4222-8222-222222222204', 'promoter'),
  ('22222222-2222-4222-8222-222222222215', '22222222-2222-4222-8222-222222222205', 'promoter');
insert into commercial.internal_role_assignments (account_id, role) values
  ('22222222-2222-4222-8222-222222222211', 'finance'),
  ('22222222-2222-4222-8222-222222222213', 'finance'),
  ('22222222-2222-4222-8222-222222222212', 'superadmin');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('22222222-2222-4222-8222-222222222221', '22222222-2222-4222-8222-222222222214', 'pinv00000007', 'Promotor Factura', 'active'),
  ('22222222-2222-4222-8222-222222222225', '22222222-2222-4222-8222-222222222215', 'pinv00000008', 'Promotor Ajeno', 'separated');
insert into public.businesses (id, name, slug, whatsapp_number) values
  ('22222222-2222-4222-8222-222222222231', 'Negocio Factura', 'negocio-factura', '5491100000651'),
  ('22222222-2222-4222-8222-222222222232', 'Negocio Factura B', 'negocio-factura-b', '5491100000652');
insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel) values
  ('22222222-2222-4222-8222-222222222241', 'Lead Factura', 'lead factura', 'promoter'),
  ('22222222-2222-4222-8222-222222222242', 'Lead Factura B', 'lead factura b', 'promoter');
insert into commercial.commercial_opportunities (id, commercial_business_id, stage, owner_account_id) values
  ('22222222-2222-4222-8222-222222222251', '22222222-2222-4222-8222-222222222241', 'demo_done', '22222222-2222-4222-8222-222222222214'),
  ('22222222-2222-4222-8222-222222222252', '22222222-2222-4222-8222-222222222242', 'demo_done', '22222222-2222-4222-8222-222222222215');
insert into commercial.opportunity_attributions (id, opportunity_id, promoter_id, status, method, reason) values
  ('22222222-2222-4222-8222-222222222261', '22222222-2222-4222-8222-222222222251', '22222222-2222-4222-8222-222222222221', 'confirmed', 'manual', 'fixture'),
  ('22222222-2222-4222-8222-222222222262', '22222222-2222-4222-8222-222222222252', '22222222-2222-4222-8222-222222222225', 'confirmed', 'manual', 'fixture');

select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222202', true);

do $$
declare
  v_terms uuid;
  v_open jsonb;
  v_result jsonb;
  v_commission uuid;
  v_settlement uuid;
  v_other uuid;
  v_invoice uuid;
  v_bad uuid;
begin
  v_terms := (commercial.win_opportunity('22222222-2222-4222-8222-222222222251', '22222222-2222-4222-8222-222222222231', null)->>'conversion_terms_id')::uuid;
  perform set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222201', true);
  perform public.record_founder_service_start(v_terms, date '2019-01-10');
  v_open := public.open_obligation(v_terms, 'subscription', '2019-02-10');
  v_result := public.record_collection((v_open->>'obligation_id')::uuid, 'inv-1', 'posted', 5500000, null);
  perform public.accrue_commissions_for_collection((v_result->>'collection_id')::uuid);
  v_commission := (select id from commercial.promoter_commissions where collection_id = (v_result->>'collection_id')::uuid);
  update commercial.promoter_commissions set status = 'available', available_at = '2026-09-16 15:00:00+00' where id = v_commission;
  v_settlement := (public.prepare_settlement('22222222-2222-4222-8222-222222222221', '2026-09', null)->>'settlement_id')::uuid;
  perform set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222203', true);
  perform public.approve_settlement(v_settlement);

  perform set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222205', true);
  v_result := public.submit_invoice(v_settlement, 2200000, 'invoices/' || v_settlement::text || '/ajeno.pdf');
  if v_result->>'commercial_error_code' is distinct from 'validation' and v_result->>'commercial_error_code' is distinct from 'forbidden' then
    raise exception 'foreign promoter %', v_result;
  end if;

  perform set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222204', true);
  v_result := public.submit_invoice(v_settlement, 1, 'invoices/' || v_settlement::text || '/mal.pdf');
  if v_result->>'ok' is distinct from 'true' or (select status from commercial.promoter_settlements where id = v_settlement) is distinct from 'approved' then
    raise exception 'mismatch submit %', v_result;
  end if;
  v_bad := (v_result->>'invoice_id')::uuid;
  v_result := public.review_invoice(v_bad, 'rejected', 'no');
  if v_result->>'commercial_error_code' is distinct from 'forbidden' then
    raise exception 'promoter review %', v_result;
  end if;

  perform set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222201', true);
  v_result := public.review_invoice(v_bad, 'accepted', null);
  if v_result->>'commercial_error_code' is distinct from 'invoice_amount_mismatch' then
    raise exception 'accept mismatch %', v_result;
  end if;
  v_result := public.review_invoice(v_bad, 'rejected', 'importe distinto');
  if v_result->>'status' is distinct from 'rejected' or (select status from commercial.promoter_settlements where id = v_settlement) is distinct from 'approved' then
    raise exception 'reject mismatch %', v_result;
  end if;

  perform set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222204', true);
  v_result := public.submit_invoice(v_settlement, 2200000, 'invoices/' || v_settlement::text || '/ok.pdf');
  v_invoice := (v_result->>'invoice_id')::uuid;
  if v_result->>'settlement_status' is distinct from 'approved' then
    raise exception 'G-14 submit payable %', v_result;
  end if;
  perform set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222201', true);
  v_result := public.review_invoice(v_invoice, 'accepted', null);
  if v_result->>'status' is distinct from 'accepted' or (select status from commercial.promoter_settlements where id = v_settlement) is distinct from 'payable' then
    raise exception 'G-14 accept %', v_result;
  end if;

  perform set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222202', true);
  v_terms := (commercial.win_opportunity('22222222-2222-4222-8222-222222222252', '22222222-2222-4222-8222-222222222232', null)->>'conversion_terms_id')::uuid;
  perform set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222201', true);
  perform public.record_founder_service_start(v_terms, date '2019-01-10');
  v_open := public.open_obligation(v_terms, 'subscription', '2019-02-10');
  v_result := public.record_collection((v_open->>'obligation_id')::uuid, 'inv-sep', 'posted', 5500000, null);
  perform public.accrue_commissions_for_collection((v_result->>'collection_id')::uuid);
  update commercial.promoter_commissions
  set status = 'available', available_at = '2026-08-16 15:00:00+00'
  where collection_id = (v_result->>'collection_id')::uuid;
  v_other := (public.prepare_settlement('22222222-2222-4222-8222-222222222225', '2026-08', null)->>'settlement_id')::uuid;
  perform set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222203', true);
  perform public.approve_settlement(v_other);
  perform set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222205', true);
  v_result := public.submit_invoice(v_other, 2200000, 'invoices/' || v_other::text || '/separado.pdf');
  if v_result->>'ok' is distinct from 'true' then
    raise exception 'separated %', v_result;
  end if;
end;
$$;

rollback;
