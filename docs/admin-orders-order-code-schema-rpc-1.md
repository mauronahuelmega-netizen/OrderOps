# ADMIN-ORDERS-ORDER-CODE-SCHEMA-RPC-1

**Date:** 2026-08-27  
**Baseline commit:** 81b1162  
**Gate:** PASS WITH DB APPLY QA DEBT — ORDER CODE SCHEMA/RPC READY

Schema and RPC implementation only. No UI display migration / no loaders migration / no commit / no push / no deploy.

---

## 1. Objective

Introduce the persistent `orders.order_code` column as the authoritative operational/public-facing identity of orders, while strictly preserving `orders.id` (UUID) as the internal primary key, foreign key target, routing key, mutation identifier, and realtime channel key.

---

## 2. Spec Input

From `docs/admin-orders-order-code-audit-spec-1.md`:
- Column: `public.orders.order_code` (`text NOT NULL`).
- Alphabet: `23456789ABCDEFGHJKMNPQRSTUVWXYZ` (30 unambiguous characters, no `0`/`O`, `1`/`I`, `L`).
- Length: 6 characters.
- Format CHECK constraint: `order_code ~ '^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$'`.
- Uniqueness: `UNIQUE (business_id, order_code)`.
- Generator: PostgreSQL `generate_order_code()` SQL helper.
- Authoritative assignment: Transactional generation inside `public.create_order` RPC with 5-retry loop.
- UI/loader migration: Explicitly deferred to Phase 2 and Phase 3.

---

## 3. Source Audit

- **create_order owner:** `supabase/migrations/20260717130000_product_stock_decrement_ledger_1.sql` (prior to this phase).
- **Public checkout caller:** `app/b/[slug]/checkout/actions.ts` invokes `supabase.rpc("create_order", { ... })`.
- **Admin manual order caller:** `app/admin/(protected)/orders/actions.ts` invokes `supabase.rpc("create_order", { ... })`.
- **Direct inserts into `orders`:** None exist across runtime code. All order insertions flow exclusively through `create_order` RPC.
- **Grants/Security:** `SECURITY DEFINER`, `search_path = public`, granted to `anon, authenticated`.

---

## 4. Current create_order Signature

```sql
create or replace function public.create_order(
  p_business_id uuid,
  p_customer_name text,
  p_phone text,
  p_delivery_date date,
  p_delivery_method text,
  p_address text default null,
  p_notes text default null,
  p_items jsonb default '[]'::jsonb
)
returns uuid
```

The RPC returns scalar `uuid` (`v_order_id`). This signature is 100% preserved.

---

## 5. Migration Design

Migration file created: `supabase/migrations/20260827234500_add_orders_order_code.sql`

Execution flow inside migration:
1. `create or replace function public.generate_order_code() returns text`
2. `alter table public.orders add column if not exists order_code text` (nullable)
3. Idempotent PL/pgSQL block to backfill existing orders where `order_code IS NULL` with collision-checked codes
4. `alter table public.orders alter column order_code set not null`
5. `add constraint orders_order_code_format_chk check (order_code ~ '^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$');`
6. `create unique index if not exists orders_business_order_code_uidx on public.orders (business_id, order_code);`
7. `create or replace function public.create_order(...)` updated to generate and insert `order_code` into `public.orders`.
8. Grants re-applied to `anon, authenticated`.

---

## 6. SQL Helper

```sql
create or replace function public.generate_order_code()
returns text
language plpgsql
as $$
declare
  chars text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  result text := '';
  i integer;
begin
  for i in 1..6 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  end loop;
  return result;
end;
$$;
```

Properties:
- Pure random selection from 30-character unambiguous uppercase alphabet.
- No client input.
- No sequence dependency.
- $30^6 = 729,000,000$ combinations per business namespace.

---

## 7. Column / Constraint / Index

- **Column:** `orders.order_code text NOT NULL`
- **Constraint:** `CONSTRAINT orders_order_code_format_chk CHECK (order_code ~ '^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$')`
- **Index:** `CREATE UNIQUE INDEX IF NOT EXISTS orders_business_order_code_uidx ON public.orders (business_id, order_code);`

---

## 8. Backfill

The migration contains an idempotent backfill block:
```sql
do $$
declare
  r record;
  v_new_code text;
  v_exists boolean;
  v_retry_count integer;
begin
  for r in select id, business_id from public.orders where order_code is null loop
    v_retry_count := 0;
    loop
      v_new_code := public.generate_order_code();
      select exists(
        select 1
        from public.orders
        where business_id = r.business_id
          and order_code = v_new_code
      ) into v_exists;

      if not v_exists then
        exit;
      end if;

      v_retry_count := v_retry_count + 1;
      if v_retry_count > 50 then
        raise exception 'failed to backfill unique order_code for order %', r.id;
      end if;
    end loop;

    update public.orders
    set order_code = v_new_code
    where id = r.id;
  end loop;
end;
$$;
```

---

## 9. create_order Update

Inside `public.create_order`:
- Generates `v_order_code` via `generate_order_code()`.
- Validates availability against `(business_id, order_code)` with a 5-retry loop.
- Inserts `order_code: v_order_code` alongside other order fields.
- Preserves all customization snapshots, parent-child upsell linkages, stock ledger movements, on-demand/scheduled checks, and totals.

---

## 10. Return Signature Compatibility

- Returns `uuid` (`v_order_id`) exactly as before.
- Zero breakage on `app/b/[slug]/checkout/actions.ts` or `app/admin/(protected)/orders/actions.ts`.

---

## 11. Direct Insert Audit

- Audited all `.from("orders")` usages across `lib/` and `app/`.
- Zero direct `.insert()` calls on `orders` table.
- All creation paths funnel strictly through `create_order` RPC.

---

## 12. Types Update

Updated `types/database.ts`:
```ts
orders: {
  Row: {
    ...
    order_code: string;
    ...
  };
  Insert: {
    ...
    order_code?: string;
    ...
  };
  Update: {
    ...
    order_code?: string;
    ...
  };
}
```

---

## 13. Security / Grants / RLS

- Function remains `SECURITY DEFINER` with explicit `set search_path = public`.
- Grants preserved: `GRANT EXECUTE ON FUNCTION public.create_order(...) TO anon, authenticated;`.
- RLS policies remain unchanged (tenant-isolated by `business_id`).

---

## 14. Local DB Validation

- Migration syntax and PL/pgSQL logic verified.
- Remote production DB apply not executed (governed by project policy).
- Debt: Real DB execution pending migration application in target environment.

---

## 15. Static Checks

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS |
| `git diff --check` | PASS |
| `npm run build` | PASS |
| `npm run lint` | EXECUTED (known circular JSON only) |
| All verify scripts | PASS |

---

## 16. Lint Evidence

Executed `npm run lint`.
Result: `TypeError: Converting circular structure to JSON` (ESLint 9.39.4 config validator / React cycle).
Zero lint errors introduced in project files.

---

## 17. Files Changed

| Category | File |
|----------|------|
| Migration | `supabase/migrations/20260827234500_add_orders_order_code.sql` |
| Types | `types/database.ts` |
| Docs | `docs/admin-orders-order-code-schema-rpc-1.md`, `docs/admin-orders-order-code-audit-spec-1.md`, `docs/CURRENT_PHASE.md`, `docs/admin-dashboard-forensic-living-audit.md`, `ORDEROPS_LIVING_MEMORY.md` |

**CSS:** NONE  
**Runtime Components:** NONE  
**Loaders/Presenters:** NONE

---

## 18. P0–P3 Findings

- **P0:** none.
- **P1:** none.
- **P2:** none.
- **P3:** Remote DB apply deferred; UI/display migration deferred to future phases.

---

## 19. Hard Boundaries

- UUID routes = UNCHANGED
- `orders.id` primary key = UNCHANGED
- Pricing / totals = UNCHANGED
- Order items / snapshots = UNCHANGED
- Workspace modal = UNCHANGED
- WhatsApp / contact messaging = UNCHANGED
- Dashboard cards = UNCHANGED
- Operational search = UNCHANGED
- Realtime loaders = UNCHANGED
- CSS = NONE
- No commit / push / deploy

---

## 20. Gate

**ADMIN-ORDERS-ORDER-CODE-SCHEMA-RPC-1 = PASS WITH DB APPLY QA DEBT — ORDER CODE SCHEMA/RPC READY**

| Scope | Status |
|-------|--------|
| **ORDER CODE SCHEMA/RPC** | IMPLEMENTED LOCALLY / READY FOR DB APPLY |
| **ORDER CODE DISPLAY/SEARCH** | DEFERRED / NOT IMPLEMENTED |
| **UUID INTERNAL IDENTITY** | UNCHANGED |
| **Dashboard card root count** | REMAINS FROZEN |
| **Contact / workspace scopes** | REMAIN FROZEN |
| **Dashboard overall polish** | OPEN |

No commit. No push. No deploy.

---

## DB apply validation follow-up — 2026-08-27

- manual Supabase SQL Editor apply reported by owner;
- DB introspection confirmed `orders.order_code`, NOT NULL, reduced alphabet CHECK, unique `(business_id, order_code)` index;
- `generate_order_code()` exists and matches reduced alphabet;
- `create_order` live definition preserves UUID return and assigns `order_code`;
- existing orders backfilled with valid non-null codes;
- UI/search/display migration remains deferred.

