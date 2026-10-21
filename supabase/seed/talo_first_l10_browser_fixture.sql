-- Talo First L10. QA-only browser fixture (commits). Ids 80808080-8080-4080-8080-*, emails l10-*@local.test.
-- Refuses to run twice. Receipts go through public.system_record_provider_read, the same path as the worker.
-- Login password for every fixture user: l10-qa-local-only (loopback QA only).
begin;

do $$
begin
  if exists (select 1 from public.businesses where id = '80808080-8080-4080-8080-000000000101') then
    raise exception 'l10 fixture already applied';
  end if;
end;
$$;

create function pg_temp.id(p_kind int, p_n int) returns uuid language sql immutable as $$
  select ('80808080-8080-4080-8080-' || lpad(p_kind::text, 10, '0') || lpad(p_n::text, 2, '0'))::uuid
$$;

create function pg_temp.as_user(p_sub text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p_sub, true);
end;
$$;

-- 01 owner A, 02 operator A, 03 owner B, 04 finance, 05 superadmin, 06 promoter, 07 owner D
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current,
  phone_change, phone_change_token, reauthentication_token,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
select '00000000-0000-0000-0000-000000000000', pg_temp.id(0, n), 'authenticated', 'authenticated', u.email,
  extensions.crypt('l10-qa-local-only', extensions.gen_salt('bf')), now(),
  '', '', '', '', '', '', '', '',
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
from (values
  (1, 'l10-owner-a@local.test'), (2, 'l10-operator-a@local.test'), (3, 'l10-owner-b@local.test'),
  (4, 'l10-finance@local.test'), (5, 'l10-superadmin@local.test'), (6, 'l10-promoter@local.test'),
  (7, 'l10-owner-d@local.test')
) as u(n, email);
insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text, 'email', jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true), now(), now(), now()
from auth.users u where u.id between pg_temp.id(0, 1) and pg_temp.id(0, 7);

insert into commercial.platform_accounts (id, user_id, kind) values
  (pg_temp.id(10, 4), pg_temp.id(0, 4), 'internal'),
  (pg_temp.id(10, 5), pg_temp.id(0, 5), 'internal'),
  (pg_temp.id(10, 6), pg_temp.id(0, 6), 'promoter');
insert into commercial.internal_role_assignments (account_id, role) values
  (pg_temp.id(10, 4), 'finance'),
  (pg_temp.id(10, 5), 'superadmin');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  (pg_temp.id(11, 6), pg_temp.id(10, 6), 'l10p000006', 'Promotor L10', 'active');

-- The catalog is created by the business owner, as the category position trigger requires.
create function pg_temp.business(p_n int, p_name text, p_slug text, p_owner int) returns uuid language plpgsql as $$
begin
  insert into public.businesses (id, name, slug, whatsapp_number)
  values (pg_temp.id(1, p_n), p_name, p_slug, '549110080800' || p_n);
  insert into public.business_settings (business_id, on_demand_mode_active) values (pg_temp.id(1, p_n), true)
  on conflict (business_id) do update set on_demand_mode_active = true;
  insert into public.profiles (id, business_id, role) values (pg_temp.id(0, p_owner), pg_temp.id(1, p_n), 'owner');
  perform pg_temp.as_user(pg_temp.id(0, p_owner)::text);
  insert into public.categories (id, business_id, name, position) values (pg_temp.id(20, p_n), pg_temp.id(1, p_n), 'Panes', 1);
  insert into public.products (id, business_id, category_id, name, price)
  values (pg_temp.id(21, p_n), pg_temp.id(1, p_n), pg_temp.id(20, p_n), 'Pan de campo', 1000);
  perform pg_temp.as_user('');
  insert into public.store_sessions (business_id, opened_by) values (pg_temp.id(1, p_n), pg_temp.id(0, p_owner));
  return pg_temp.id(1, p_n);
end;
$$;

create function pg_temp.win(p_n int, p_started date) returns uuid language plpgsql as $$
declare v jsonb; v_terms uuid;
begin
  insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel)
  values (pg_temp.id(2, p_n), 'Lead L10 ' || p_n, 'lead l10 ' || p_n, 'promoter');
  insert into commercial.commercial_opportunities (id, commercial_business_id, stage, owner_account_id)
  values (pg_temp.id(3, p_n), pg_temp.id(2, p_n), 'demo_done', pg_temp.id(10, 6));
  insert into commercial.opportunity_attributions (id, opportunity_id, promoter_id, status, method, reason)
  values (pg_temp.id(4, p_n), pg_temp.id(3, p_n), pg_temp.id(11, 6), 'confirmed', 'manual', 'l10 fixture');
  perform pg_temp.as_user(pg_temp.id(0, 5)::text);
  v := commercial.win_opportunity(pg_temp.id(3, p_n), pg_temp.id(1, p_n), null);
  v_terms := (v->>'conversion_terms_id')::uuid;
  perform pg_temp.as_user(pg_temp.id(0, 4)::text);
  v := public.open_obligation(v_terms, 'setup', null);
  v := commercial.record_collection((v->>'obligation_id')::uuid, 'l10-setup-' || p_n, 'posted', 29000000, 'l10 fixture');
  if p_started is not null then
    v := public.record_founder_service_start(v_terms, p_started);
  end if;
  perform pg_temp.as_user('');
  return v_terms;
end;
$$;

create function pg_temp.read(p_n int, p_link uuid, p_tx text, p_cents bigint) returns jsonb language plpgsql as $$
declare v_inbox uuid;
begin
  insert into commercial.provider_webhook_inbox (link_id, provider, environment, external_customer_id, external_transaction_id, status, locked_at)
  values (p_link, 'talo', 'sandbox', 'orderops-l10-' || p_n, p_tx, 'processing', now())
  returning id into v_inbox;
  return public.system_record_provider_read(v_inbox, 'PROCESSED', 'ARS', p_cents, p_cents, 'detail', 'detail', now(), encode(extensions.digest(p_tx, 'sha256'), 'hex'));
end;
$$;

do $$
declare
  v_today date := commercial.ba_date(now());
  v jsonb;
begin
  -- A: active, next anniversary in 5 days (T-10 window open).
  perform pg_temp.business(1, 'L10 Panaderia Activa', 'l10-activa', 1);
  perform pg_temp.win(1, (v_today + 5 - interval '1 month')::date);
  -- B: suspended (period 2 unpaid, grace over).
  perform pg_temp.business(2, 'L10 Panaderia Suspendida', 'l10-suspendida', 3);
  perform pg_temp.win(2, ((v_today - 10) - interval '2 months')::date);
  -- D: activation paid, service start not recorded yet.
  perform pg_temp.business(4, 'L10 Panaderia Inicio Pendiente', 'l10-inicio-pendiente', 7);
  perform pg_temp.win(4, null);

  insert into public.profiles (id, business_id, role) values (pg_temp.id(0, 2), pg_temp.id(1, 1), 'operator');

  insert into commercial.provider_customer_links (id, won_business_id, provider, environment, external_customer_id, cvu, alias) values
    (pg_temp.id(5, 1), pg_temp.id(1, 1), 'talo', 'sandbox', 'orderops-l10-1', '0000003100080808080801', 'oo8080808001'),
    (pg_temp.id(5, 4), pg_temp.id(1, 4), 'talo', 'sandbox', 'orderops-l10-4', '0000003100080808080804', 'oo8080808004');

  -- A: exact monthly amount is imputed to the next period; a wrong amount goes to reconciliation.
  v := pg_temp.read(1, pg_temp.id(5, 1), 'l10-tx-a-monthly', 5500000);
  if v->>'status' is distinct from 'imputed' then raise exception 'A monthly %', v; end if;
  v := pg_temp.read(1, pg_temp.id(5, 1), 'l10-tx-a-wrong', 5000000);
  if v->>'review_reason' is distinct from 'amount_mismatch' then raise exception 'A wrong %', v; end if;
  -- D: a monthly transfer before the service start is recorded.
  v := pg_temp.read(4, pg_temp.id(5, 4), 'l10-tx-d-monthly', 5500000);
  if v->>'status' is distinct from 'reconciliation_required' then raise exception 'D monthly %', v; end if;

  -- B: an order accepted before the gate is enforced.
  insert into public.orders (id, business_id, customer_name, phone, delivery_date, delivery_method, total_price, order_code, status)
  values (pg_temp.id(30, 2), pg_temp.id(1, 2), 'Cliente previo', '5491100000000', v_today, 'pickup', 1000, 'PRVB22', 'pending');
end;
$$;

select 'talo_first_l10_browser_fixture: APPLIED' as result,
  commercial.business_service_access('80808080-8080-4080-8080-000000000101', now())->>'state' as a_state,
  commercial.business_service_access('80808080-8080-4080-8080-000000000102', now())->>'state' as b_state,
  commercial.business_service_access('80808080-8080-4080-8080-000000000104', now())->>'state' as d_state;
commit;
