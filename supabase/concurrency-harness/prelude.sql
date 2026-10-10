-- Minimal prelude for the disposable concurrency database.
-- Not applied by this commit. install.mjs applies it only after container guards pass.
-- CREATE ROLE cannot run inside a transaction block; install.mjs must not use --single-transaction.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin;
  end if;
end;
$$;

create schema if not exists auth;

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

create table if not exists auth.users (
  instance_id uuid,
  id uuid primary key,
  aud text,
  role text,
  email text unique,
  encrypted_password text,
  email_confirmed_at timestamptz,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  created_at timestamptz,
  updated_at timestamptz
);

create schema if not exists public;

create table if not exists public.profiles (
  id uuid primary key,
  business_id uuid
);

create table if not exists public.businesses (
  id uuid primary key
);

create schema if not exists storage;

create table if not exists storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null
);

create schema if not exists concurrency_harness;

create table if not exists concurrency_harness.applied_files (
  name text primary key,
  applied_at timestamptz not null default now()
);

create table if not exists concurrency_harness.identity (
  id integer primary key check (id = 1),
  database_name text not null,
  disposable boolean not null,
  token text not null,
  container_name text not null,
  created_at timestamptz not null default now()
);

revoke all on schema concurrency_harness from public;
