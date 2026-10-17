-- T08-A. Rolls back. External receipts do not open collections.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '18181818-1818-4181-8181-181818181801', 'authenticated', 'authenticated', 'phase08-finance@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '18181818-1818-4181-8181-181818181804', 'authenticated', 'authenticated', 'phase08-promoter@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());
insert into commercial.platform_accounts (id, user_id, kind) values
  ('18181818-1818-4181-8181-181818181811', '18181818-1818-4181-8181-181818181801', 'internal'),
  ('18181818-1818-4181-8181-181818181814', '18181818-1818-4181-8181-181818181804', 'promoter');
insert into commercial.internal_role_assignments (account_id, role) values
  ('18181818-1818-4181-8181-181818181811', 'finance');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('18181818-1818-4181-8181-181818181821', '18181818-1818-4181-8181-181818181814', 'pwh00000008', 'Promotor Webhook', 'active');
insert into public.businesses (id, name, slug, whatsapp_number) values
  ('18181818-1818-4181-8181-181818181831', 'Negocio Talo A', 'negocio-talo-a', '5491100001831'),
  ('18181818-1818-4181-8181-181818181832', 'Negocio Talo B', 'negocio-talo-b', '5491100001832');

select set_config('request.jwt.claim.sub', '18181818-1818-4181-8181-181818181804', true);

do $$
declare
  v_denied jsonb;
  v_obligations bigint;
  v_collections bigint;
begin
  select count(*) into v_obligations from commercial.platform_obligations;
  select count(*) into v_collections from commercial.platform_collections;
  v_denied := commercial.link_provider_customer(
    '18181818-1818-4181-8181-181818181831', 'talo', 'sandbox', 'orderops-qa-webhook-burger',
    '0000000000000000001831', 'alias.qa'
  );
  if v_denied->>'commercial_error_code' is distinct from 'forbidden'
    or (select count(*) from commercial.platform_obligations) <> v_obligations
    or (select count(*) from commercial.platform_collections) <> v_collections then
    raise exception 'promoter wrote a provider link';
  end if;
end $$;

select set_config('request.jwt.claim.sub', '18181818-1818-4181-8181-181818181801', true);

do $$
declare
  v_link jsonb;
  v_conflict jsonb;
  v_note jsonb;
  v_confirm jsonb;
  v_again jsonb;
  v_defer jsonb;
  v_second jsonb;
  v_incomplete jsonb;
  v_missing jsonb;
  v_count int;
  v_obligations bigint;
  v_collections bigint;
  v_receipt_id uuid;
begin
  select count(*) into v_obligations from commercial.platform_obligations;
  select count(*) into v_collections from commercial.platform_collections;

  v_link := commercial.link_provider_customer(
    '18181818-1818-4181-8181-181818181831', 'talo', 'sandbox', 'orderops-qa-webhook-burger',
    '0000000000000000001831', 'alias.qa'
  );
  if (v_link->>'ok')::boolean is not true or (v_link->>'idempotent')::boolean then
    raise exception 'link %', v_link;
  end if;
  if (commercial.link_provider_customer(
    '18181818-1818-4181-8181-181818181831', 'talo', 'sandbox', 'orderops-qa-webhook-burger',
    '0000000000000000001831', 'alias.qa'
  )->>'idempotent')::boolean is not true then
    raise exception 'link not idempotent';
  end if;
  v_conflict := commercial.link_provider_customer(
    '18181818-1818-4181-8181-181818181832', 'talo', 'sandbox', 'orderops-qa-webhook-burger',
    '0000000000000000001831', 'alias.qa'
  );
  if v_conflict->>'commercial_error_code' is distinct from 'customer_link_conflict' then
    raise exception 'cross business %', v_conflict;
  end if;

  v_missing := commercial.note_provider_receipt(
    '18181818-1818-4181-8181-181818181831', 'talo', 'sandbox', 'cliente-desconocido', 'tx-missing'
  );
  if v_missing->>'commercial_error_code' is distinct from 'customer_link_missing' then
    raise exception 'unknown customer %', v_missing;
  end if;

  v_note := commercial.note_provider_receipt(
    '18181818-1818-4181-8181-181818181831', 'talo', 'sandbox', 'orderops-qa-webhook-burger', 'tx-monthly'
  );
  if v_note->>'status' is distinct from 'received' then
    raise exception 'received %', v_note;
  end if;
  v_receipt_id := (v_note->>'receipt_id')::uuid;

  v_incomplete := commercial.confirm_provider_receipt(
    '18181818-1818-4181-8181-181818181831', 'talo', 'sandbox', 'orderops-qa-webhook-burger', 'tx-monthly',
    'PROCESSED', 'ARS', null, 5433450, 'detail', 'detail', '2026-10-17 20:03:00+00'
  );
  if v_incomplete->>'status' is distinct from 'pending_review' then
    raise exception 'incomplete %', v_incomplete;
  end if;

  v_defer := commercial.defer_provider_receipt(
    '18181818-1818-4181-8181-181818181831', 'talo', 'sandbox', 'orderops-qa-webhook-burger', 'tx-monthly'
  );
  if v_defer->>'status' is distinct from 'pending_review' then
    raise exception 'defer %', v_defer;
  end if;

  v_confirm := commercial.confirm_provider_receipt(
    '18181818-1818-4181-8181-181818181831', 'talo', 'sandbox', 'orderops-qa-webhook-burger', 'tx-monthly',
    'PROCESSED', 'ARS', 5500000, 5433450, 'list', 'detail', '2026-10-17 20:03:00+00'
  );
  if v_confirm->>'status' is distinct from 'confirmed'
    or (v_confirm->>'receipt_id')::uuid is distinct from v_receipt_id
    or (v_confirm->>'economic_recognition')::boolean then
    raise exception 'confirm %', v_confirm;
  end if;
  if (select gross_amount_cents from commercial.provider_receipts where id = v_receipt_id) <> 5500000
    or (select net_amount_cents from commercial.provider_receipts where id = v_receipt_id) <> 5433450
    or (select processing_difference_cents from commercial.provider_receipts where id = v_receipt_id) <> 66550
    or (select gross_source from commercial.provider_receipts where id = v_receipt_id) is distinct from 'list'
    or (select net_source from commercial.provider_receipts where id = v_receipt_id) is distinct from 'detail' then
    raise exception 'amounts diverged';
  end if;

  v_again := commercial.confirm_provider_receipt(
    '18181818-1818-4181-8181-181818181831', 'talo', 'sandbox', 'orderops-qa-webhook-burger', 'tx-monthly',
    'PROCESSED', 'ARS', 1, 1, 'detail', 'detail', '2026-10-17 20:03:00+00'
  );
  if (v_again->>'idempotent')::boolean is not true
    or (v_again->>'amount_preserved')::boolean is not true
    or (select gross_amount_cents from commercial.provider_receipts where id = v_receipt_id) <> 5500000 then
    raise exception 'restart overwrite %', v_again;
  end if;
  v_defer := commercial.defer_provider_receipt(
    '18181818-1818-4181-8181-181818181831', 'talo', 'sandbox', 'orderops-qa-webhook-burger', 'tx-monthly'
  );
  if v_defer->>'status' is distinct from 'confirmed' then
    raise exception 'defer downgraded %', v_defer;
  end if;

  v_second := commercial.confirm_provider_receipt(
    '18181818-1818-4181-8181-181818181831', 'talo', 'sandbox', 'orderops-qa-webhook-burger', 'tx-later',
    'PROCESSED', 'ARS', 29000000, 28649100, 'detail', 'detail', '2026-10-17 18:00:00+00'
  );
  v_confirm := commercial.confirm_provider_receipt(
    '18181818-1818-4181-8181-181818181831', 'talo', 'sandbox', 'orderops-qa-webhook-burger', 'tx-earlier',
    'PROCESSED', 'ARS', 5500000, 5433450, 'list', 'detail', '2026-10-17 19:00:00+00'
  );
  select count(*) into v_count from commercial.provider_receipts where status = 'confirmed';
  if v_second->>'status' is distinct from 'confirmed'
    or v_confirm->>'status' is distinct from 'confirmed'
    or v_count <> 3 then
    raise exception 'out of order %', v_count;
  end if;

  begin
    insert into commercial.provider_receipts (
      link_id, provider, environment, external_customer_id, external_transaction_id, status
    ) values (
      (v_link->>'link_id')::uuid, 'talo', 'sandbox', 'orderops-qa-webhook-burger', 'tx-monthly', 'received'
    );
    raise exception 'duplicate insert succeeded';
  exception
    when unique_violation then
      null;
  end;

  if (select count(*) from commercial.platform_obligations) <> v_obligations
    or (select count(*) from commercial.platform_collections) <> v_collections then
    raise exception 'economic tables changed';
  end if;
end $$;

rollback;
