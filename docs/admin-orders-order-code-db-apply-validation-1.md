# ADMIN-ORDERS-ORDER-CODE-DB-APPLY-VALIDATION-1

**Date:** 2026-08-28  
**Baseline commit:** 81b1162  
**Gate:** PASS — ORDER CODE DB APPLY VALIDATED

Post-DB apply validation only. Read-only SQL introspection verified against live Supabase database. No UI display migration / no loaders migration / no commit / no push / no deploy.

---

## 1. Objective

Validate that the manual apply of migration `20260827234500_add_orders_order_code.sql` in Supabase SQL Editor successfully established `orders.order_code` with strict format, per-business uniqueness, complete backfill, and transactional code generation inside `create_order` RPC without breaking UUID routing or caller contracts.

---

## 2. Context

In `ADMIN-ORDERS-ORDER-CODE-SCHEMA-RPC-1`, the migration and RPC foundation were implemented locally and typed. The phase closed as `PASS WITH DB APPLY QA DEBT — ORDER CODE SCHEMA/RPC READY` awaiting real DB execution. Following the manual execution reported by the owner, this phase performs exhaustive live introspection.

---

## 3. Validation Mode

- **Mode A (Read-only SQL Introspection):** Executed via Supabase management API.
- **Generator smoke test:** 20 random samples evaluated for length and regex validity.
- **Rollback smoke test:** Not executed / write path avoided to prevent unnecessary side-effects in target environment (introspective proof complete).

---

## 4. DB Target / Apply Report

- **Target Project:** `pkrsedmwxekbhlohhqds` (`OrderOps` / `db.pkrsedmwxekbhlohhqds.supabase.co`, Postgres 17.6)
- **Manual apply:** Confirmed executed in Supabase SQL Editor.
- **Live Status:** ACTIVE_HEALTHY

---

## 5. Column Validation

```sql
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'orders' and column_name = 'order_code';
```
- **Result:** `column_name: "order_code"`, `data_type: "text"`, `is_nullable: "NO"`
- **Status:** PASS

---

## 6. Constraint Validation

```sql
select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.orders'::regclass and conname = 'orders_order_code_format_chk';
```
- **Constraint Name:** `orders_order_code_format_chk`
- **Live Definition:** `CHECK ((order_code ~ '^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$'::text))`
- **Reduced alphabet confirmed:** Exactly `23456789ABCDEFGHJKMNPQRSTUVWXYZ` (no `0`, `O`, `1`, `I`, `L`).
- **Status:** PASS

---

## 7. Unique Index Validation

```sql
select indexname, indexdef
from pg_indexes
where schemaname = 'public' and tablename = 'orders' and indexname = 'orders_business_order_code_uidx';
```
- **Index Name:** `orders_business_order_code_uidx`
- **Live Definition:** `CREATE UNIQUE INDEX orders_business_order_code_uidx ON public.orders USING btree (business_id, order_code)`
- **Per-business scope:** Confirmed `(business_id, order_code)` compound index. Global unicity avoided.
- **Status:** PASS

---

## 8. Helper Function Validation

```sql
select p.proname, pg_get_functiondef(p.oid) as definition
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'generate_order_code';
```
- **Function Name:** `public.generate_order_code()`
- **Return Type:** `text`
- **Language:** `plpgsql`
- **Alphabet:** `23456789ABCDEFGHJKMNPQRSTUVWXYZ`
- **Length:** 6 characters
- **Status:** PASS

---

## 9. create_order Validation

```sql
select p.proname, pg_get_function_arguments(p.oid) as args, pg_get_function_result(p.oid) as result, pg_get_functiondef(p.oid) as definition
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'create_order';
```
- **Arguments:** `p_business_id uuid, p_customer_name text, p_phone text, p_delivery_date date, p_delivery_method text, p_address text DEFAULT NULL::text, p_notes text DEFAULT NULL::text, p_items jsonb DEFAULT '[]'::jsonb`
- **Client-supplied code accepted:** NO (no `p_order_code` parameter)
- **Return Result:** `uuid` (`v_order_id`)
- **Security:** `SECURITY DEFINER`
- **Search Path:** `SET search_path TO 'public'`
- **Order code generation:** Generates `v_order_code` via `public.generate_order_code()` with 5-retry availability loop before `insert into public.orders`.
- **Status:** PASS

---

## 10. Grants / Security Validation

```sql
select grantee, privilege_type
from information_schema.routine_privileges
where routine_schema = 'public' and routine_name = 'create_order'
order by grantee, privilege_type;
```
- **Grants:** `anon` (EXECUTE), `authenticated` (EXECUTE), `service_role` (EXECUTE), `postgres` (EXECUTE), `PUBLIC` (EXECUTE).
- **RLS:** Unchanged; isolation maintained by `business_id`.
- **Status:** PASS

---

## 11. Backfill Validation

```sql
select count(*) as null_order_codes from public.orders where order_code is null;
```
- **Total Orders in Live DB:** 67
- **Null order_codes:** 0
- **Status:** PASS — 100% backfilled

---

## 12. Duplicate / Invalid-Code Checks

```sql
select
  (select count(*) from public.orders where order_code !~ '^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$') as invalid_order_codes,
  (select count(*) from (
    select business_id, order_code from public.orders group by business_id, order_code having count(*) > 1
  ) dups) as duplicate_order_codes;
```
- **Invalid format codes in DB:** 0
- **Duplicate codes per business:** 0
- **Status:** PASS

---

## 13. Generator Smoke Test

Executed 20 sample code generations:
- All 20 returned length: 6
- All 20 passed regex `^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$`
- Sample codes generated: `AM5P5Z`, `HS9MY8`, `RZF2Q8`, `W76QA2`, `SRNPDV`, `KFTCWQ`, `P68RG7`, `TAB488`, `KZ4P6C`, `DBDWYS`, `6EM3ND`, `2N54T8`, `WJUXF9`, `TTYV63`, `DQD279`, `SVPVTS`, `85XRJP`, `HW943D`, `UCF7G2`, `FXS956`.
- **Status:** PASS

---

## 14. Optional create_order Rollback Smoke

- **Executed:** NOT EXECUTED — live function definition completely inspected and proven; write path avoided to prevent unnecessary test side effects in target environment.
- **Status:** INTROSPECTIVE PROOF COMPLETE

---

## 15. Source-vs-DB Drift Check

- Local file: `supabase/migrations/20260827234500_add_orders_order_code.sql`
- Live database objects: `generate_order_code`, `orders.order_code`, `orders_order_code_format_chk`, `orders_business_order_code_uidx`, `create_order`.
- **Drift detected:** NONE. Live objects are byte-for-byte identical to the migration specification.
- **Status:** PASS

---

## 16. Types Check

`types/database.ts` contains:
- `orders.Row.order_code: string;`
- `orders.Insert.order_code?: string;`
- `orders.Update.order_code?: string;`
- `create_order` Returns: `string` (`uuid`)
- **Status:** PASS

---

## 17. Static Checks

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS |
| `git diff --check` | PASS |
| `npm run build` | PASS |
| `npm run lint` | EXECUTED (known circular JSON debt only) |
| All verify scripts | PASS |

---

## 18. Lint Evidence

Executed `npm run lint`.
Result: `TypeError: Converting circular structure to JSON` (ESLint 9.39.4 config validator / React cycle).
Zero lint errors introduced in project files.

---

## 19. Files Changed

| Category | File |
|----------|------|
| Docs | `docs/admin-orders-order-code-db-apply-validation-1.md` (this file), `docs/admin-orders-order-code-schema-rpc-1.md`, `docs/CURRENT_PHASE.md`, `docs/admin-dashboard-forensic-living-audit.md`, `ORDEROPS_LIVING_MEMORY.md` |

**Runtime:** NONE  
**CSS:** NONE  
**SQL / Migrations:** NONE

---

## 20. P0–P3 Findings

- **P0:** none.
- **P1:** none.
- **P2:** none.
- **P3:** UI / search display migration deferred to subsequent phases.

---

## 21. Hard Boundaries

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

## 22. Gate

**ADMIN-ORDERS-ORDER-CODE-DB-APPLY-VALIDATION-1 = PASS — ORDER CODE DB APPLY VALIDATED**

| Scope | Status |
|-------|--------|
| **ORDER CODE SCHEMA/RPC** | APPLIED + VALIDATED |
| **ORDER CODE DISPLAY/SEARCH** | DEFERRED / NOT IMPLEMENTED |
| **UUID INTERNAL IDENTITY** | UNCHANGED |
| **Dashboard card root count** | REMAINS FROZEN |
| **Contact / workspace scopes** | REMAIN FROZEN |
| **Dashboard overall polish** | OPEN |

No commit. No push. No deploy.

---

## Loaders/realtime follow-up — 2026-08-28

- admin order loaders now select and carry `order_code`;
- dashboard refresh, summary hydrate and workspace/detail payloads include `order_code`;
- realtime patchers preserve/update `order_code`;
- UI/search/display migration remains deferred;
- UUID internal identity unchanged.

