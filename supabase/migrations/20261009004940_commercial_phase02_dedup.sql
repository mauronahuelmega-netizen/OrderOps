-- P02-T02: name and AR phone normalization, and find_or_prepare_business.
-- Does not create claims. Does not return another business when the match is only probable.

create or replace function commercial.normalize_name(p_value text)
returns text
language sql
immutable
set search_path = pg_catalog
as $$
  select nullif(
    btrim(regexp_replace(
      lower(translate(
        btrim(coalesce(p_value, '')),
        'ÁÀÂÄÃáàâäãÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÖÕóòôöõÚÙÛÜúùûüÑñ',
        'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuNn'
      )),
      '[^a-z0-9]+',
      ' ',
      'g'
    )),
    ''
  );
$$;

create or replace function commercial.normalize_ar_phone(p_value text)
returns text
language plpgsql
immutable
set search_path = pg_catalog
as $$
declare
  v_digits text := regexp_replace(coalesce(p_value, ''), '\D', '', 'g');
begin
  if v_digits = '' then
    return null;
  end if;
  if left(v_digits, 2) = '54' then
    v_digits := substr(v_digits, 3);
  end if;
  if left(v_digits, 1) = '0' then
    v_digits := substr(v_digits, 2);
  end if;
  if left(v_digits, 1) = '9' and length(v_digits) = 11 then
    return '+54' || v_digits;
  end if;
  if length(v_digits) = 10 then
    return '+549' || v_digits;
  end if;
  return null;
end;
$$;

create or replace function commercial.find_or_prepare_business(
  p_display_name text,
  p_phone text,
  p_fiscal_id text,
  p_channel text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_name text := commercial.normalize_name(p_display_name);
  v_phone text := commercial.normalize_ar_phone(p_phone);
  v_fiscal text := nullif(btrim(coalesce(p_fiscal_id, '')), '');
  v_existing uuid;
  v_classification text := 'none';
  v_created uuid;
begin
  if v_name is null or p_channel not in ('organic', 'promoter', 'campaign', 'internal') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  if v_phone is not null then
    perform pg_advisory_xact_lock(hashtext('commercial.phone'), hashtext(v_phone));
  end if;

  select business.id into v_existing
  from commercial.commercial_businesses business
  where business.merged_into_id is null
    and v_phone is not null
    and business.normalized_phone = v_phone
    and business.normalized_name = v_name
    and not (
      business.fiscal_id is not null
      and v_fiscal is not null
      and business.fiscal_id <> v_fiscal
    )
  order by business.created_at
  limit 1;

  if v_existing is not null then
    return jsonb_build_object(
      'ok', true,
      'classification', 'high',
      'business_id', v_existing,
      'created', false
    );
  end if;

  if v_phone is not null and exists (
    select 1
    from commercial.commercial_businesses business
    where business.merged_into_id is null
      and (
        business.normalized_phone = v_phone
        or business.normalized_name = v_name
      )
  ) then
    v_classification := 'probable';
  elsif exists (
    select 1
    from commercial.commercial_businesses business
    where business.merged_into_id is null
      and business.normalized_name = v_name
  ) then
    v_classification := 'probable';
  end if;

  insert into commercial.commercial_businesses (
    display_name, normalized_name, normalized_phone, fiscal_id, initial_channel
  ) values (
    btrim(p_display_name), v_name, v_phone, v_fiscal, p_channel
  ) returning id into v_created;

  return jsonb_build_object(
    'ok', true,
    'classification', v_classification,
    'business_id', v_created,
    'created', true
  );
end;
$$;

revoke all on function commercial.normalize_name(text) from public, anon, authenticated;
revoke all on function commercial.normalize_ar_phone(text) from public, anon, authenticated;
revoke all on function commercial.find_or_prepare_business(text, text, text, text) from public, anon, authenticated;
