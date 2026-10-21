-- OrderOps demo simulation. QA only. Ids d0d0d0d0-d0d0-40d0-80d0-*.
-- Visible names are commercial; every row is tagged demo-synthetic internally.
-- Financial CVU/alias/receipts are SYNTHETIC. They are not Talo responses.
-- Passwords are injected by scripts/commercial-core/apply-demo-simulation.mjs.
-- Idempotent: if the businesses already exist, only auth passwords and catalog photos refresh.

begin;

create function pg_temp.did(p_kind int, p_n int) returns uuid language sql immutable as $$
  select ('d0d0d0d0-d0d0-40d0-80d0-' || lpad(p_kind::text, 10, '0') || lpad(p_n::text, 2, '0'))::uuid
$$;

create function pg_temp.as_user(p_sub text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p_sub, true);
end;
$$;

create temporary table demo_users (
  n int primary key,
  email text not null,
  password text not null,
  full_name text not null
);
insert into demo_users (n, email, password, full_name) values
  (1, 'demo.martin@local.test', '{{PW_1}}', 'Martín Alegre'),
  (2, 'demo.lucia@local.test', '{{PW_2}}', 'Lucía Benítez'),
  (3, 'demo.nicolas@local.test', '{{PW_3}}', 'Nicolás Herrera'),
  (4, 'demo.tomas@local.test', '{{PW_4}}', 'Tomás Ferrero'),
  (5, 'demo.valentina@local.test', '{{PW_5}}', 'Valentina Ríos'),
  (6, 'demo.sofia@local.test', '{{PW_6}}', 'Sofía Molina'),
  (7, 'demo.diego@local.test', '{{PW_7}}', 'Diego Acosta'),
  (8, 'demo.camila@local.test', '{{PW_8}}', 'Camila Duarte');

-- Auth identities: create or rotate the password. Never touch other users.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current,
  phone_change, phone_change_token, reauthentication_token,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
select
  '00000000-0000-0000-0000-000000000000',
  pg_temp.did(0, u.n),
  'authenticated',
  'authenticated',
  u.email,
  extensions.crypt(u.password, extensions.gen_salt('bf')),
  now(),
  '', '', '', '', '', '', '', '',
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', u.full_name, 'demo_set', 'orderops-v1-simulation'),
  now(),
  now()
from demo_users u
on conflict (id) do update
  set encrypted_password = excluded.encrypted_password,
      email_confirmed_at = now(),
      raw_user_meta_data = excluded.raw_user_meta_data,
      updated_at = now();

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), pg_temp.did(0, u.n), pg_temp.did(0, u.n)::text, 'email',
  jsonb_build_object('sub', pg_temp.did(0, u.n)::text, 'email', u.email, 'email_verified', true),
  now(), now(), now()
from demo_users u
where not exists (
  select 1 from auth.identities i
  where i.user_id = pg_temp.did(0, u.n) and i.provider = 'email'
);

insert into commercial.platform_accounts (id, user_id, kind) values
  (pg_temp.did(10, 1), pg_temp.did(0, 1), 'internal'),
  (pg_temp.did(10, 2), pg_temp.did(0, 2), 'internal'),
  (pg_temp.did(10, 3), pg_temp.did(0, 3), 'internal'),
  (pg_temp.did(10, 4), pg_temp.did(0, 4), 'promoter')
on conflict (id) do nothing;

insert into commercial.internal_role_assignments (account_id, role)
select v.account_id, v.role
from (values
  (pg_temp.did(10, 1), 'superadmin'),
  (pg_temp.did(10, 2), 'commercial'),
  (pg_temp.did(10, 3), 'finance')
) as v(account_id, role)
where not exists (
  select 1 from commercial.internal_role_assignments a
  where a.account_id = v.account_id and a.role = v.role and a.revoked_at is null
);

insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  (pg_temp.did(11, 4), pg_temp.did(10, 4), 'tomasferro', 'Tomás Ferrero', 'active')
on conflict (id) do update set status = 'active', legal_name = excluded.legal_name;

insert into public.profiles (id, business_id, role) values
  (pg_temp.did(0, 1), null, 'super_admin')
on conflict (id) do update set role = 'super_admin';

create function pg_temp.ensure_operating_business(
  p_n int,
  p_name text,
  p_slug text,
  p_whatsapp text,
  p_headline text,
  p_owner int
) returns uuid language plpgsql as $$
begin
  insert into public.businesses (
    id, name, slug, whatsapp_number, description, catalog_hero_badge, catalog_hero_headline, catalog_hero_microcopy, is_active
  ) values (
    pg_temp.did(1, p_n), p_name, p_slug, p_whatsapp,
    'Hamburguesería de demostración OrderOps. Datos sintéticos, no es un cliente real.',
    'Demostración', p_headline, 'Pedido de mostrador · Villa Urquiza',
    true
  )
  on conflict (id) do update
    set name = excluded.name,
        whatsapp_number = excluded.whatsapp_number,
        catalog_hero_headline = excluded.catalog_hero_headline,
        description = excluded.description;

  insert into public.business_settings (
    business_id, on_demand_mode_active, delivery_mode_active, scheduled_mode_active, product_customization_enabled
  ) values (pg_temp.did(1, p_n), true, false, false, true)
  on conflict (business_id) do update
    set on_demand_mode_active = true, product_customization_enabled = true;

  insert into public.profiles (id, business_id, role)
  values (pg_temp.did(0, p_owner), pg_temp.did(1, p_n), 'owner')
  on conflict (id) do update set business_id = excluded.business_id, role = 'owner';

  if not exists (
    select 1 from public.store_sessions s
    where s.business_id = pg_temp.did(1, p_n) and s.closed_at is null
  ) then
    insert into public.store_sessions (business_id, opened_by)
    values (pg_temp.did(1, p_n), pg_temp.did(0, p_owner));
  end if;

  return pg_temp.did(1, p_n);
end;
$$;

select pg_temp.ensure_operating_business(
  1, 'Brasa Norte Burgers', 'brasa-norte', '5491114200105',
  'Smash y brasas de barrio', 5
);
select pg_temp.ensure_operating_business(
  2, 'Distrito Burger', 'distrito-burger', '5491114200108',
  'Smash de esquina, sin vueltas', 8
);

insert into public.profiles (id, business_id, role) values
  (pg_temp.did(0, 6), pg_temp.did(1, 1), 'manager'),
  (pg_temp.did(0, 7), pg_temp.did(1, 1), 'operator')
on conflict (id) do update set business_id = excluded.business_id, role = excluded.role;

-- Catalog as the owner (category position trigger).
create function pg_temp.product(
  p_n int, p_biz int, p_cat int, p_name text, p_price numeric, p_desc text, p_image text
) returns void language plpgsql as $$
begin
  insert into public.products (id, business_id, category_id, name, price, description, image_url, is_available)
  values (pg_temp.did(21, p_n), pg_temp.did(1, p_biz), pg_temp.did(20, p_cat), p_name, p_price, p_desc, p_image, true)
  on conflict (id) do update
    set name = excluded.name, price = excluded.price, description = excluded.description, image_url = excluded.image_url;
end;
$$;

do $$
begin
  perform pg_temp.as_user(pg_temp.did(0, 5)::text);

  insert into public.categories (id, business_id, name, position) values
    (pg_temp.did(20, 1), pg_temp.did(1, 1), 'Hamburguesas', 1),
    (pg_temp.did(20, 2), pg_temp.did(1, 1), 'Acompañamientos', 2),
    (pg_temp.did(20, 3), pg_temp.did(1, 1), 'Bebidas', 3)
  on conflict (id) do update set name = excluded.name, position = excluded.position;

  perform pg_temp.product(1, 1, 1, 'Clásica Norte', 8900,
    'Blend de tapa y vacío, cheddar, cebolla caramelizada y salsa de la casa.',
    '/demo-catalog/brasa-classic.svg');
  perform pg_temp.product(2, 1, 1, 'Doble Brasa', 11900,
    'Dos medallones smash, bacon crocante, cheddar y mostaza ahumada.',
    '/demo-catalog/brasa-doble.svg');
  perform pg_temp.product(3, 1, 1, 'Pollo Crispy', 9800,
    'Suprema crocante, coleslaw, pickles y mayo de ajo.',
    '/demo-catalog/brasa-classic.svg');
  perform pg_temp.product(4, 1, 1, 'Verde Norte', 9200,
    'Medallón de garbanzo y porto, rúcula, tomate asado y alioli.',
    '/demo-catalog/brasa-classic.svg');
  perform pg_temp.product(5, 1, 2, 'Papas Bravas', 3500,
    'Papas rústicas, paprika y salsa brava.',
    '/demo-catalog/brasa-papas.svg');
  perform pg_temp.product(6, 1, 2, 'Aros de cebolla', 3200,
    'Aros rebozados y dip de queso azul.',
    '/demo-catalog/brasa-papas.svg');
  perform pg_temp.product(7, 1, 3, 'Línea de gaseosa', 1800,
    'Lata 354 ml. Pedí el sabor en el mostrador.',
    null);
  perform pg_temp.product(8, 1, 3, 'Cerveza rubia de barril', 3200,
    'Media pinta. Solo retiro en local.',
    null);

  insert into public.customization_groups (
    id, business_id, name, description, selection_type, is_required, min_selections, max_selections, sort_order
  ) values (
    pg_temp.did(40, 1), pg_temp.did(1, 1), 'Punto de la carne', 'Cómo la querés',
    'single', true, 1, 1, 1
  ) on conflict (id) do nothing;

  insert into public.customization_options (id, business_id, group_id, name, price_delta, sort_order) values
    (pg_temp.did(41, 1), pg_temp.did(1, 1), pg_temp.did(40, 1), 'Jugosa', 0, 1),
    (pg_temp.did(41, 2), pg_temp.did(1, 1), pg_temp.did(40, 1), 'A punto', 0, 2),
    (pg_temp.did(41, 3), pg_temp.did(1, 1), pg_temp.did(40, 1), 'Bien cocida', 0, 3)
  on conflict (id) do nothing;

  insert into public.customization_groups (
    id, business_id, name, description, selection_type, is_required, min_selections, max_selections, sort_order
  ) values (
    pg_temp.did(40, 2), pg_temp.did(1, 1), 'Extras', 'Sumá lo que quieras',
    'multiple', false, 0, 3, 2
  ) on conflict (id) do nothing;

  insert into public.customization_options (id, business_id, group_id, name, price_delta, sort_order) values
    (pg_temp.did(41, 4), pg_temp.did(1, 1), pg_temp.did(40, 2), 'Bacon extra', 900, 1),
    (pg_temp.did(41, 5), pg_temp.did(1, 1), pg_temp.did(40, 2), 'Cheddar extra', 700, 2),
    (pg_temp.did(41, 6), pg_temp.did(1, 1), pg_temp.did(40, 2), 'Huevo frito', 800, 3)
  on conflict (id) do nothing;

  insert into public.customization_group_assignments (
    id, business_id, group_id, target_type, target_id, is_enabled, sort_order
  ) values
    (pg_temp.did(42, 1), pg_temp.did(1, 1), pg_temp.did(40, 1), 'category', pg_temp.did(20, 1), true, 1),
    (pg_temp.did(42, 2), pg_temp.did(1, 1), pg_temp.did(40, 2), 'category', pg_temp.did(20, 1), true, 2)
  on conflict (id) do nothing;

  perform pg_temp.as_user(pg_temp.did(0, 8)::text);
  insert into public.categories (id, business_id, name, position) values
    (pg_temp.did(20, 4), pg_temp.did(1, 2), 'Smash', 1),
    (pg_temp.did(20, 5), pg_temp.did(1, 2), 'Para picar', 2)
  on conflict (id) do update set name = excluded.name;

  perform pg_temp.product(11, 2, 4, 'Smash Distrito', 7800,
    'Medallón fino, cheddar, cebolla y salsa Distrito.',
    '/demo-catalog/distrito-smash.svg');
  perform pg_temp.product(12, 2, 4, 'Distrito Doble', 10500,
    'Dos smash, bacon y cheddar.',
    '/demo-catalog/distrito-smash.svg');
  perform pg_temp.product(13, 2, 5, 'Papas con cheddar', 3900,
    'Papas, cheddar fundido y verdeo.',
    '/demo-catalog/brasa-papas.svg');

  perform pg_temp.as_user('');
end;
$$;

-- Commercial journey uses the real RPCs the first time only.
do $$
declare
  v jsonb;
  v_opp uuid;
  v_cb uuid;
  v_today date := commercial.ba_date(now());
  v_terms uuid;
  v_inbox uuid;
  v_already boolean;
begin
  select exists (
    select 1 from commercial.conversion_terms t where t.won_business_id = pg_temp.did(1, 1)
  ) into v_already;

  if v_already then
    -- First apply may have posted setup without accruing; keep commissions aligned.
    perform pg_temp.as_user(pg_temp.did(0, 3)::text);
    perform commercial.accrue_commissions_for_collection(col.id)
    from commercial.platform_collections col
    join commercial.platform_obligations o on o.id = col.obligation_id
    join commercial.conversion_terms t on t.id = o.conversion_terms_id
    where t.won_business_id in (pg_temp.did(1, 1), pg_temp.did(1, 2))
      and o.kind = 'setup'
      and col.status = 'posted'
      and not exists (
        select 1 from commercial.promoter_commissions pc
        where pc.collection_id = col.id and pc.right_kind = 'setup'
      );
    perform pg_temp.as_user('');
    raise notice 'demo conversion already present; refreshed missing setup accruals only';
    return;
  end if;

  perform pg_temp.as_user(pg_temp.did(0, 4)::text);
  v := public.register_promoter_business('Brasa Norte Burgers', '5491114200105', 'Hamburguesería');
  if v->>'ok' is distinct from 'true' then
    raise exception 'register Brasa failed %', v;
  end if;
  v_cb := (v->>'business_id')::uuid;
  v_opp := (v->>'opportunity_id')::uuid;

  -- The promoter panel can only write notes. Confirmation requires a call/whatsapp/meeting.
  -- This insert is the authorized V1 workaround; there is no UI for it.
  insert into commercial.commercial_interactions (
    commercial_business_id, opportunity_id, kind, channel, origin, actor_account_id, body, occurred_at
  ) values (
    v_cb, v_opp, 'whatsapp', 'whatsapp', 'tomasferro', pg_temp.did(10, 4),
    'Visita a Brasa Norte. Valentina pidió demo para el mediodía. Dato sintético de demostración.',
    now() - interval '9 days'
  );

  perform pg_temp.as_user(pg_temp.did(0, 2)::text);
  v := public.transition_opportunity(v_opp, 'qualified', null);
  v := public.transition_opportunity(v_opp, 'demo_done', null);

  perform pg_temp.as_user(pg_temp.did(0, 1)::text);
  v := public.confirm_attribution(v_opp, pg_temp.did(11, 4), null, 'Atribución confirmada: Tomás registró y visitó Brasa Norte.');
  if v->>'ok' is distinct from 'true' then
    raise exception 'confirm Brasa failed %', v;
  end if;
  v := commercial.win_opportunity(v_opp, pg_temp.did(1, 1), null);
  if v->>'ok' is distinct from 'true' then
    raise exception 'win Brasa failed %', v;
  end if;
  v_terms := (v->>'conversion_terms_id')::uuid;

  perform pg_temp.as_user(pg_temp.did(0, 4)::text);
  v := public.register_promoter_business('Distrito Burger', '5491114200108', 'Hamburguesería');
  if v->>'ok' is distinct from 'true' then
    raise exception 'register Distrito failed %', v;
  end if;
  v_cb := (v->>'business_id')::uuid;
  v_opp := (v->>'opportunity_id')::uuid;
  insert into commercial.commercial_interactions (
    commercial_business_id, opportunity_id, kind, channel, origin, actor_account_id, body, occurred_at
  ) values (
    v_cb, v_opp, 'meeting', 'in_person', 'tomasferro', pg_temp.did(10, 4),
    'Reunión con Camila Duarte. Quiere operar en octubre. Dato sintético de demostración.',
    now() - interval '80 days'
  );
  perform pg_temp.as_user(pg_temp.did(0, 2)::text);
  v := public.transition_opportunity(v_opp, 'demo_done', null);
  perform pg_temp.as_user(pg_temp.did(0, 1)::text);
  v := public.confirm_attribution(v_opp, pg_temp.did(11, 4), null, 'Atribución confirmada: Tomás cerró Distrito Burger.');
  if v->>'ok' is distinct from 'true' then
    raise exception 'confirm Distrito failed %', v;
  end if;
  v := commercial.win_opportunity(v_opp, pg_temp.did(1, 2), null);
  if v->>'ok' is distinct from 'true' then
    raise exception 'win Distrito failed %', v;
  end if;

  -- Open lead so the promoter and commercial boards are not empty.
  perform pg_temp.as_user(pg_temp.did(0, 4)::text);
  v := public.register_promoter_business('Puesto Sur Sandwiches', '5491114200199', 'Sandwichería');
  if v->>'ok' is distinct from 'true' then
    raise exception 'register open lead failed %', v;
  end if;

  -- SYNTHETIC payment destination. Not issued by Talo.
  insert into commercial.provider_customer_links (
    id, won_business_id, provider, environment, external_customer_id, cvu, alias
  ) values
    (pg_temp.did(5, 1), pg_temp.did(1, 1), 'talo', 'sandbox', 'demo-synthetic-brasa-norte', '0000003100D0D000000001', 'demo.brasanorte'),
    (pg_temp.did(5, 2), pg_temp.did(1, 2), 'talo', 'sandbox', 'demo-synthetic-distrito', '0000003100D0D000000002', 'demo.distrito')
  on conflict (id) do nothing;

  -- Activation (internal collection path, labeled synthetic).
  -- SYNTHETIC collections (not a Talo HTTP read). Accrue with the real finance RPC.
  perform pg_temp.as_user(pg_temp.did(0, 3)::text);
  select t.id into v_terms from commercial.conversion_terms t where t.won_business_id = pg_temp.did(1, 1);
  v := public.open_obligation(v_terms, 'setup', null);
  v := commercial.record_collection((v->>'obligation_id')::uuid, 'demo-synth-brasa-setup', 'posted', 29000000, 'demo-synthetic');
  v := commercial.accrue_commissions_for_collection((v->>'collection_id')::uuid);
  if (v->>'ok')::boolean is not true then raise exception 'Brasa setup accrual %', v; end if;
  v := public.record_founder_service_start(v_terms, (v_today - interval '1 month')::date);

  select t.id into v_terms from commercial.conversion_terms t where t.won_business_id = pg_temp.did(1, 2);
  v := public.open_obligation(v_terms, 'setup', null);
  v := commercial.record_collection((v->>'obligation_id')::uuid, 'demo-synth-distrito-setup', 'posted', 29000000, 'demo-synthetic');
  v := commercial.accrue_commissions_for_collection((v->>'collection_id')::uuid);
  if (v->>'ok')::boolean is not true then raise exception 'Distrito setup accrual %', v; end if;
  v := public.record_founder_service_start(v_terms, (v_today - interval '3 month')::date);

  -- Monthly for Brasa through the worker record path (synthetic inbox, not a Talo HTTP read).
  insert into commercial.provider_webhook_inbox (
    link_id, provider, environment, external_customer_id, external_transaction_id, status, locked_at
  ) values (
    pg_temp.did(5, 1), 'talo', 'sandbox', 'demo-synthetic-brasa-norte', 'demo-synth-brasa-month-1', 'processing', now()
  ) returning id into v_inbox;
  v := public.system_record_provider_read(
    v_inbox, 'PROCESSED', 'ARS', 5500000, 5500000, 'detail', 'detail', now(),
    encode(extensions.digest('demo-synth-brasa-month-1', 'sha256'), 'hex')
  );
  if v->>'status' is distinct from 'imputed' then
    raise exception 'Brasa monthly synthetic read %', v;
  end if;

  -- Ambiguous / wrong amount stays in finance review.
  insert into commercial.provider_webhook_inbox (
    link_id, provider, environment, external_customer_id, external_transaction_id, status, locked_at
  ) values (
    pg_temp.did(5, 1), 'talo', 'sandbox', 'demo-synthetic-brasa-norte', 'demo-synth-brasa-wrong', 'processing', now()
  ) returning id into v_inbox;
  v := public.system_record_provider_read(
    v_inbox, 'PROCESSED', 'ARS', 5000000, 5000000, 'detail', 'detail', now(),
    encode(extensions.digest('demo-synth-brasa-wrong', 'sha256'), 'hex')
  );

  perform public.system_process_due_accruals(50);
  perform pg_temp.as_user('');
end;
$$;

-- Operational orders (direct insert, same pattern as the L10 fixture). Codes use the order alphabet.
do $$
declare
  v_today date := commercial.ba_date(now());
begin
  if exists (select 1 from public.orders where id = pg_temp.did(30, 1)) then
    return;
  end if;

  insert into public.orders (
    id, business_id, customer_name, phone, delivery_date, delivery_method, total_price, order_code, status, notes
  ) values
    (pg_temp.did(30, 1), pg_temp.did(1, 1), 'Julián Pereyra', '5491114301001', v_today, 'pickup', 12400, 'BRAS2A', 'pending', 'Sin cebolla'),
    (pg_temp.did(30, 2), pg_temp.did(1, 1), 'Mariana Soto', '5491114301002', v_today, 'pickup', 15400, 'BRAS2B', 'preparing', null),
    (pg_temp.did(30, 3), pg_temp.did(1, 1), 'Facundo Ruiz', '5491114301003', v_today, 'pickup', 9800, 'BRAS2C', 'ready', 'Retira en 10 minutos'),
    (pg_temp.did(30, 4), pg_temp.did(1, 1), 'Paula Méndez', '5491114301004', v_today, 'pickup', 8900, 'BRAS2D', 'completed', null),
    (pg_temp.did(30, 5), pg_temp.did(1, 1), 'Ramiro Vidal', '5491114301005', v_today, 'pickup', 3500, 'BRAS2E', 'cancelled', 'Canceló al llegar'),
    (pg_temp.did(30, 6), pg_temp.did(1, 2), 'Elena Paz', '5491114302001', v_today, 'pickup', 7800, 'DSTR2A', 'pending', 'Pedido previo a la suspensión');

  insert into public.order_items (order_id, product_id, quantity, unit_price, product_name) values
    (pg_temp.did(30, 1), pg_temp.did(21, 1), 1, 8900, 'Clásica Norte'),
    (pg_temp.did(30, 1), pg_temp.did(21, 5), 1, 3500, 'Papas Bravas'),
    (pg_temp.did(30, 2), pg_temp.did(21, 2), 1, 11900, 'Doble Brasa'),
    (pg_temp.did(30, 2), pg_temp.did(21, 5), 1, 3500, 'Papas Bravas'),
    (pg_temp.did(30, 3), pg_temp.did(21, 3), 1, 9800, 'Pollo Crispy'),
    (pg_temp.did(30, 4), pg_temp.did(21, 1), 1, 8900, 'Clásica Norte'),
    (pg_temp.did(30, 5), pg_temp.did(21, 5), 1, 3500, 'Papas Bravas'),
    (pg_temp.did(30, 6), pg_temp.did(21, 11), 1, 7800, 'Smash Distrito');
end;
$$;

select 'orderops_demo_simulation: APPLIED' as result,
  commercial.business_service_access(pg_temp.did(1, 1), now())->>'state' as brasa_state,
  commercial.business_service_access(pg_temp.did(1, 2), now())->>'state' as distrito_state;

commit;
