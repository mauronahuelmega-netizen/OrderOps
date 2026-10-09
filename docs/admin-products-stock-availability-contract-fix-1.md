# ADMIN-PRODUCTS-STOCK-AVAILABILITY-CONTRACT-FIX-1

# Result

**PASS WITH DB APPLY REQUIRED.**

Contract implemented in source + migration authored. Remote apply **not** run:
`AUTORIZO_PRODUCTS_STOCK_AVAILABILITY_DB_APPLY` was **ABSENT**.

# Closed

- **PROD-P1-4** — IMPLEMENTED / REMOTE APPLY REQUIRED. Trigger will suspend only when
  `track_stock=true AND stock<=0`, once applied remotely.
- **PROD-P2-10** — IMPLEMENTED (app-level). Edit derives effective `is_available` so
  untracked + stock0 no longer re-suspends on save. Full DB close still needs remote apply.
- **PROD-P3-13** — CLOSED. Stale “descuento automático se implementará después” copy removed
  from Create + Edit.

# Contract

| case | track_stock | stock | requested available | result |
|---|---|---|---|---|
| A | false | 0 | true | true |
| B | false | 0 | false | false |
| C | true | 0 | true | **false** |
| D | true | >0 | false | false |
| E | true | 1→0 | true | **false** |
| F | false | 1→0 | true | true |
| G | true | 0→10 | false | false (no auto-reactivation) |

Invariant: `track_stock=true AND stock<=0 AND is_available=true` must not survive a
relevant write.

# Implementation

**trigger** — replace `auto_suspend_out_of_stock_product`; event
`BEFORE INSERT OR UPDATE OF stock, track_stock, is_available`; force
`is_available=false` only when tracked and stock≤0; never sets true.

**create** — `is_available = resolveEffectiveProductAvailability({ trackStock, stock,
requestedAvailable: true })`.

**edit** — same helper with the form’s `is_available` as requested value.

**inline availability** — ownership pre-check now selects `stock, track_stock`; enabling
when tracked and stock≤0 returns domain error before UPDATE (does not claim success).

**copy** — both forms:
“Al activar el control, el stock se descuenta automáticamente con cada pedido. Si llega a 0,
el producto deja de estar disponible. Al reponer stock, volvé a marcarlo como disponible
cuando quieras publicarlo.”

# Migration

- file: `supabase/migrations/20260909154400_products_stock_availability_contract.sql`
- remote: **NOT APPLIED**
- history: unchanged

RLS migration `20260909040000_products_manage_role_rls.sql` left immutable / untouched.
`create_order` / stock_movements / restock-on-cancel: untouched.

# Verification

- targeted: `lib/products/admin-products-stock-availability-contract.verify.ts` — **PASS**
- tsc: **PASS**
- diff: **PASS**
- DB matrix: **NOT RUN** (apply gate absent)

# Data safety

persistent mutations: **0**

# Historical rows

no backfill: **YES**. Existing `track_stock=false AND stock<=0 AND is_available=false` rows
stay false. Merchandising intent is not inferred.

HISTORICAL AVAILABILITY REMEDIATION: NOT AUTOMATED / PRODUCT DECISION REQUIRED IF DESIRED.

# Gate

Local contract gates met. Remote close of P1-4 deferred until authorized apply phase.
