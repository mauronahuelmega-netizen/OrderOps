-- P03-T02: contract, verification, and bank evidence. No fiscal authority lookup.

create table commercial.promoter_contracts (
  id uuid primary key default gen_random_uuid(),
  promoter_id uuid not null references commercial.promoters (id),
  version_label text not null,
  accepted_at timestamptz,
  document_path text,
  created_at timestamptz not null default now()
);

create table commercial.promoter_verifications (
  id uuid primary key default gen_random_uuid(),
  promoter_id uuid not null references commercial.promoters (id),
  kind text not null check (kind in ('identity', 'cuit', 'monotributo')),
  status text not null check (status in ('pending', 'verified', 'rejected')),
  evidence_path text,
  reviewed_by uuid references commercial.platform_accounts (id),
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table commercial.promoter_bank_accounts (
  id uuid primary key default gen_random_uuid(),
  promoter_id uuid not null references commercial.promoters (id),
  cbu_or_cvu text not null,
  holder_name text not null,
  verification_note text,
  is_current boolean not null default false,
  created_by uuid references commercial.platform_accounts (id),
  created_at timestamptz not null default now(),
  disabled_at timestamptz
);

create unique index promoter_bank_accounts_one_current
  on commercial.promoter_bank_accounts (promoter_id)
  where is_current and disabled_at is null;

insert into storage.buckets (id, name, public)
values ('commercial-documents', 'commercial-documents', false)
on conflict (id) do update set public = false;

create or replace function commercial.submit_promoter_evidence(
  p_promoter_id uuid,
  p_kind text,
  p_evidence_path text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_actor uuid;
  v_promoter uuid;
  v_id uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_actor := commercial.current_account_id();
  v_promoter := commercial.current_promoter_id();
  if v_promoter is not null then
    p_promoter_id := v_promoter;
  elsif v_actor is null or not commercial.has_permission('promoter.review') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if p_promoter_id is null or p_kind not in ('identity', 'cuit', 'monotributo', 'contract') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  if p_kind = 'contract' then
    insert into commercial.promoter_contracts (promoter_id, version_label, accepted_at, document_path)
    values (
      p_promoter_id,
      'v1',
      case when v_promoter is not null or commercial.has_permission('promoter.review') then pg_catalog.now() else null end,
      nullif(btrim(coalesce(p_evidence_path, '')), '')
    )
    returning id into v_id;
  else
    insert into commercial.promoter_verifications (promoter_id, kind, status, evidence_path)
    values (p_promoter_id, p_kind, 'pending', nullif(btrim(coalesce(p_evidence_path, '')), ''))
    returning id into v_id;
  end if;

  return jsonb_build_object('ok', true, 'evidence_id', v_id);
end;
$$;

create or replace function commercial.review_verification(
  p_verification_id uuid,
  p_status text,
  p_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_actor uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('promoter.review') or commercial.current_promoter_id() is not null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if p_status not in ('verified', 'rejected') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  update commercial.promoter_verifications
  set status = p_status,
      notes = nullif(btrim(coalesce(p_notes, '')), ''),
      reviewed_by = v_actor,
      reviewed_at = pg_catalog.now()
  where id = p_verification_id;
  if not found then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  return jsonb_build_object('ok', true, 'status', p_status);
end;
$$;

create or replace function commercial.activate_promoter(p_promoter_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_actor uuid;
  v_status text;
  v_verified int;
  v_contract int;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('promoter.activate') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  select status into v_status from commercial.promoters where id = p_promoter_id;
  if v_status is null or v_status not in ('registered', 'pending_verification') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  select count(distinct kind) into v_verified
  from commercial.promoter_verifications
  where promoter_id = p_promoter_id
    and status = 'verified'
    and kind in ('identity', 'cuit', 'monotributo');
  select count(*) into v_contract
  from commercial.promoter_contracts
  where promoter_id = p_promoter_id
    and accepted_at is not null;
  if v_verified < 3 or v_contract < 1 then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'verification_incomplete');
  end if;
  update commercial.promoters
  set status = 'active',
      activated_at = pg_catalog.now()
  where id = p_promoter_id;
  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
  ) values (
    v_actor, 'internal', 'promoter.activated', 'commercial', 'promoters', p_promoter_id, p_promoter_id,
    jsonb_build_object('status', 'active')
  );
  return jsonb_build_object('ok', true, 'status', 'active');
end;
$$;

create or replace function commercial.replace_bank_account(
  p_promoter_id uuid,
  p_cbu_or_cvu text,
  p_holder_name text,
  p_note text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_actor uuid;
  v_self uuid;
  v_current boolean;
  v_id uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_actor := commercial.current_account_id();
  v_self := commercial.current_promoter_id();
  if length(btrim(coalesce(p_cbu_or_cvu, ''))) = 0 or length(btrim(coalesce(p_holder_name, ''))) = 0 then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  if v_self is not null then
    if p_promoter_id is distinct from v_self then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
    end if;
    v_current := false;
  elsif v_actor is not null and commercial.has_permission('bank.read_any') then
    v_current := true;
  else
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;

  if v_current then
    update commercial.promoter_bank_accounts
    set is_current = false,
        disabled_at = pg_catalog.now()
    where promoter_id = p_promoter_id
      and is_current
      and disabled_at is null;
  end if;

  insert into commercial.promoter_bank_accounts (
    promoter_id, cbu_or_cvu, holder_name, verification_note, is_current, created_by
  ) values (
    p_promoter_id, btrim(p_cbu_or_cvu), btrim(p_holder_name), nullif(btrim(coalesce(p_note, '')), ''), v_current, v_actor
  )
  returning id into v_id;

  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
  ) values (
    v_actor,
    case when v_self is not null then 'promoter' else 'internal' end,
    'promoter.bank_replaced',
    'commercial',
    'promoter_bank_accounts',
    v_id,
    v_id,
    jsonb_build_object('promoter_id', p_promoter_id, 'is_current', v_current)
  );

  return jsonb_build_object('ok', true, 'bank_account_id', v_id, 'is_current', v_current);
end;
$$;

create or replace function commercial.read_own_bank()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_promoter uuid;
begin
  v_promoter := commercial.current_promoter_id();
  if auth.uid() is null or v_promoter is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  return jsonb_build_object(
    'ok', true,
    'accounts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', bank.id,
        'cbu_or_cvu', bank.cbu_or_cvu,
        'holder_name', bank.holder_name,
        'is_current', bank.is_current,
        'disabled_at', bank.disabled_at
      ) order by bank.created_at)
      from commercial.promoter_bank_accounts bank
      where bank.promoter_id = v_promoter
    ), '[]'::jsonb)
  );
end;
$$;

alter table commercial.promoter_contracts enable row level security;
alter table commercial.promoter_contracts force row level security;
alter table commercial.promoter_verifications enable row level security;
alter table commercial.promoter_verifications force row level security;
alter table commercial.promoter_bank_accounts enable row level security;
alter table commercial.promoter_bank_accounts force row level security;
revoke all on commercial.promoter_contracts, commercial.promoter_verifications, commercial.promoter_bank_accounts from public, anon, authenticated;

create policy promoter_contracts_select on commercial.promoter_contracts
  for select to authenticated
  using (
    promoter_id = commercial.current_promoter_id()
    or commercial.has_internal_role('superadmin')
    or commercial.has_internal_role('commercial')
  );

create policy promoter_verifications_select on commercial.promoter_verifications
  for select to authenticated
  using (
    promoter_id = commercial.current_promoter_id()
    or commercial.has_internal_role('superadmin')
    or commercial.has_internal_role('commercial')
  );

create policy promoter_bank_accounts_select on commercial.promoter_bank_accounts
  for select to authenticated
  using (
    promoter_id = commercial.current_promoter_id()
    or commercial.has_permission('bank.read_any')
  );

revoke all on function commercial.submit_promoter_evidence(uuid, text, text) from public, anon, authenticated, service_role;
revoke all on function commercial.review_verification(uuid, text, text) from public, anon, authenticated, service_role;
revoke all on function commercial.activate_promoter(uuid) from public, anon, authenticated, service_role;
revoke all on function commercial.replace_bank_account(uuid, text, text, text) from public, anon, authenticated, service_role;
revoke all on function commercial.read_own_bank() from public, anon, service_role;

create or replace function public.submit_promoter_evidence(p_promoter_id uuid, p_kind text, p_evidence_path text)
returns jsonb language sql security definer set search_path = pg_catalog, commercial
as $$ select commercial.submit_promoter_evidence(p_promoter_id, p_kind, p_evidence_path); $$;

create or replace function public.review_verification(p_verification_id uuid, p_status text, p_notes text)
returns jsonb language sql security definer set search_path = pg_catalog, commercial
as $$ select commercial.review_verification(p_verification_id, p_status, p_notes); $$;

create or replace function public.activate_promoter(p_promoter_id uuid)
returns jsonb language sql security definer set search_path = pg_catalog, commercial
as $$ select commercial.activate_promoter(p_promoter_id); $$;

create or replace function public.replace_bank_account(p_promoter_id uuid, p_cbu_or_cvu text, p_holder_name text, p_note text)
returns jsonb language sql security definer set search_path = pg_catalog, commercial
as $$ select commercial.replace_bank_account(p_promoter_id, p_cbu_or_cvu, p_holder_name, p_note); $$;

create or replace function public.read_own_bank()
returns jsonb language sql security definer set search_path = pg_catalog, commercial
as $$ select commercial.read_own_bank(); $$;

revoke all on function public.submit_promoter_evidence(uuid, text, text) from public, anon, service_role;
revoke all on function public.review_verification(uuid, text, text) from public, anon, service_role;
revoke all on function public.activate_promoter(uuid) from public, anon, service_role;
revoke all on function public.replace_bank_account(uuid, text, text, text) from public, anon, service_role;
revoke all on function public.read_own_bank() from public, anon, service_role;
grant execute on function public.submit_promoter_evidence(uuid, text, text) to authenticated;
grant execute on function public.review_verification(uuid, text, text) to authenticated;
grant execute on function public.activate_promoter(uuid) to authenticated;
grant execute on function public.replace_bank_account(uuid, text, text, text) to authenticated;
grant execute on function public.read_own_bank() to authenticated;
grant execute on function commercial.read_own_bank() to authenticated;
