# ADMIN-PRODUCTS-PRODUCT-REMOVAL-CONTRACT-DECISION-1

**Date:** 2026-09-16  
**Gate:** PASS — PRODUCT REMOVAL V1 CONTRACT DECIDED  
**Evidence:** SOURCE + LIVE SCHEMA (read-only) — no runtime / DB mutations

# Result

**V1 canonical contract: SOFT ARCHIVE + RESTORE**  
**Availability:** separate merchandising axis (`is_available`)  
**Hard delete / permanent purge:** **DEFERRED — not a normal user operation**  
Runtime implementation: **NOT STARTED** · Business mutations: **0** · Schema apply: **0**

# Current Runtime

| Capability | Status |
|------------|--------|
| Create / Edit / availability / stock / image / unified draft | CERTIFIED |
| Product removal UI | **ABSENT** |
| App removal/archive action | **ABSENT** (`deleteProductAction` / `Eliminar producto` asserted absent in image-lifecycle verify) |
| Soft-delete / `archived_at` / `is_archived` column | **ABSENT** (live `products` columns) |
| `is_available` | merchandising / public-selling flag only |
| DB DELETE via RLS | **EXISTS** — `products_delete_own_business` for owner/admin/manager (+ super_admin) |

**Important:** DB can DELETE ≠ product should DELETE.

# Current Removal Capability

Operators today can only hide from public sale via **Disponible = false**. Inactive products remain first-class admin catalog rows. There is no lifecycle retirement surface.

# Product Semantics

## Availability

`is_available` = public merchandising / selling state.  
Public anon SELECT already requires `is_available = true`.  
Stock trigger may force `is_available = false` when tracked stock hits 0; restock never auto-reactivates.  
Admin filter `Activos` / `Inactivos` maps to this axis (`lib/products/admin.ts`).

## Lifecycle Removal

**Distinct from availability.**  
Intent: “I no longer manage/sell this product in the normal catalog” vs “temporarily not selling.”  
Collapsing both into `is_available` overloads filters, counts, empty-catalog, and operator mental model.

# Schema Evidence

Live `public.products` columns:  
`id, business_id, category_id, name, description, price, image_url, is_available, created_at, sku, stock, track_stock`  
No archive/lifecycle column.  
SKU uniqueness: partial unique `(business_id, sku) WHERE sku IS NOT NULL`.  
Category FK: `ON DELETE RESTRICT` (composite with `business_id`).

# Product Foreign-Key Census

Live introspection — every FK referencing `public.products`:

| Referencing table | Column | Nullable | ON DELETE | ON UPDATE | Semantic | Historical/live | DELETE consequence |
|-------------------|--------|----------|-----------|-----------|----------|-----------------|--------------------|
| `order_items` | `product_id` | YES | **SET NULL** | NO ACTION | Line → catalog product | Historical commercial | Row survives; `product_id` cleared; name/price/snapshot remain |
| `stock_movements` | `product_id` | NO | **RESTRICT** | NO ACTION | Inventory ledger | Permanent audit | **Blocks** product DELETE while any movement exists |
| `product_customization_overrides` | `product_id` | NO | **CASCADE** | NO ACTION | Per-product hide overrides | Live config | Overrides wiped with product |
| `upsell_group_items` | `product_id` | NO | **RESTRICT** | NO ACTION | Suggested/upsell target product | Live operational | **Blocks** DELETE while referenced |

**Polymorphic (no FK to products):**

| Table | Link | Risk |
|-------|------|------|
| `customization_group_assignments` | `target_type='product'` + `target_id` | **Logical orphan** on hard delete (7 live product-targeted rows) |
| `upsell_groups` | `target_type` + `target_id` (category/product) | Same class of orphan risk for product targets |

Aggregate census (read-only, tenant DB): products 20 · order_items with product_id 150 · distinct ordered products 12 · stock_movements 60 · products with movements 2 · upsell items 5 · products in upsells 3 · product assignments 7 · overrides 1 · with image 18.  
Products not blocked by RESTRICT FKs alone: 17 — but order history + polymorphic orphans still make hard delete unsafe as a product feature.

# Historical Order Integrity

`order_items` snapshot fields (types + create_order path):

| Field | Persisted |
|-------|-----------|
| `product_id` | yes, **nullable** |
| `product_name` | yes, required |
| `unit_price` | yes |
| `quantity` | yes |
| `customization_snapshot` | yes, nullable JSON |
| `item_kind` | product \| upsell |
| SKU / image | **NOT** on order_items |

Order UI (`order-items-section`, workspace) displays **`product_name`** from the item — not a live products join for labels.  
`product_id` SET NULL on hard delete: display/history of name/price/customization **preserved**; live product link / any future “open product” / restock join **degraded**.

# Stock / Restock / Ledger

Cancel restock (`transition_order_status` / `20260717140000_product_stock_restock_cancel_1.sql`):

- Restocks **only** via `stock_movements.order_decrement` rows **JOIN `products`** (`p.track_stock = true`).
- Writes new `order_restock` movements + increments `products.stock`.

| Product state | Cancel/restock |
|---------------|----------------|
| **Archived** (row exists, track_stock preserved) | Works — join succeeds |
| **Hard deleted** | Impossible if movements exist (**RESTRICT**). If somehow deleted after wiping ledger: restock **silently skips** (join finds no product) → inventory integrity failure |

**Hard gate:** normal hard delete is **PRODUCT-INAPPROPRIATE** while cancel/restock depends on live `products` + permanent `stock_movements`.

# Customization Relations

| Relation | Archive | Hard delete |
|----------|---------|-------------|
| `product_customization_overrides` | **Preserve** for restore | CASCADE wipe |
| `customization_group_assignments` (product target) | **Preserve** | Orphan `target_id` (no FK) |
| Inheritance readers / public config | Must exclude archived products from sale paths | N/A if row gone |

Logical-orphan risk: **CONFIRMED** for hard delete. Archive avoids it.

# Image Lifecycle

Certified forward lifecycle: DB success then Storage cleanup for unreferenced paths; shared-reference guard.  
No product-delete path today.

| Mode | Image policy |
|------|----------------|
| Archive | **KEEP** object + `image_url` (reversible) |
| Restore | **REUSE** existing `image_url` |
| Hard delete (deferred) | Only after DB success; Storage cleanup best-effort; never before irreversible DB delete |

# SKU Semantics

Unique index: `(business_id, sku) WHERE sku IS NOT NULL` — unchanged under archive.

**Decision: RESERVE ACROSS ARCHIVE**  
Archived row keeps SKU → restore never collides with a reused active SKU.  
**REUSE ALLOWED WITH RESTORE POLICY:** rejected for v1 (restore non-deterministic / UX debt).

# Category Semantics

- Archive: **preserve** `category_id` (NOT NULL, RESTRICT).  
- Category delete while archived products exist: **still blocked** — **ACCEPTED for v1**.  
- Future category cleanup / move-archived: **DEFERRED**.  
- Restore: same category; if category missing → **IMPOSSIBLE BY FK** (cannot delete category while product exists).

# Public Catalog

| Surface | Archived behavior |
|---------|-------------------|
| Public catalog | **FORBIDDEN** |
| Public customization config / priceFrom | **FORBIDDEN** for archived product |
| Preview | **FORBIDDEN** as purchasable |

Enforcement: **lifecycle invariant + query filters + public RLS** (defense in depth).  
Forcing `is_available=false` on archive alone is necessary but **not sufficient** authority long-term — public SELECT must also require `archived_at IS NULL`.

# Admin Collection

| Concern | Contract |
|---------|----------|
| Default `/admin/products` | **Non-archived only** |
| Archived discoverability | **REQUIRED** — Estado filter value **Archivados** (do not overload Activo/Inactivo) |
| Search (default) | Excludes archived |
| Search (Archivados) | Within archived set |
| Counts “N productos” | Non-archived management count; archived count separate when in archive view |
| Empty catalog / auto-open Create | `catalogTotalCount` for onboarding = **all product rows including archived**. Tenant with only archived products is **NOT** first-run empty. |

# Manual Order

`getManualOrderProductOptions` today: `is_available = true` only.  
Future: also **`archived_at IS NULL`**. Archived never offered for new manual orders.

# Removal Options

## Availability Only — **REJECTED**

Pros: zero schema; reversible; history intact.  
Cons: no retirement semantics; admin clutter; Activos/Inactivos overloaded; empty-catalog and metrics blur “not selling” vs “retired”.  
Cheapest ≠ correct.

## Soft Archive — **SELECTED (V1)**

Reversible; preserves id/config/image/SKU/stock/overrides/assignments; excludes from public + default admin; restore path required.

## Hard Delete — **PRODUCT-INAPPROPRIATE as normal operation**

RESTRICT on ledger + upsells; restock joins products; polymorphic orphans; SET NULL weakens order↔product link; Storage out-of-transaction.  
May remain a future **maintenance/purge** under strict guards — **not v1**.

## Hybrid — **CONCEPTUAL SHAPE OF V1**

Normal user: **ARCHIVE / RESTORE**.  
Permanent purge: **DEFERRED / NOT EXPOSED** (no never-ordered shortcut in v1 — incomplete without full orphan cleanup design).

# Selected V1 Contract

```txt
SOFT ARCHIVE + RESTORE
Availability = separate merchandising axis
Hard delete / purge = DEFERRED (not normal UX)
```

# User-Facing Vocabulary

| Action | Spanish term |
|--------|----------------|
| Archive | **Archivar producto** |
| Restore | **Restaurar producto** |
| Availability | **Disponible** / **No disponible** (unchanged) |
| Permanent delete | **Eliminar permanentemente** — not exposed in v1 |

Avoid: calling archive “Eliminar”; calling unavailable “Archivar”; restore “Reactivar” (collides with Disponible).

# Archive Contract

1. Set `archived_at = now()` (timestamptz).  
2. Atomically force `is_available = false`.  
3. Preserve: id, category_id, sku, stock, track_stock, description, price, image_url, overrides, product-targeted assignments, created_at.  
4. Forbidden state: `archived_at IS NOT NULL AND is_available = true`.  
5. Idempotent: archiving already-archived = success no-op.  
6. Invalidate public catalog + customization + preview caches; revalidate admin products.  
7. Primary UX owner: **Edit flyout lifecycle section** (outside sticky Save). Optional mirror in desktop row actions later — one canonical owner first: **Edit**.  
8. Success: close flyout, refresh collection, non-blocking feedback.

Representation: **`archived_at timestamptz NULL`** preferred over boolean (audit + restore clarity + partial index `WHERE archived_at IS NULL`).

# Restore Contract

1. Clear `archived_at`.  
2. Leave **`is_available = false`** — owner explicitly republishes (aligns with stock restock never auto-reactivating).  
3. Same product id; category/image/customizations/stock/track_stock/SKU/created_at unchanged.  
4. Idempotent restore of non-archived = no-op success.  
5. SKU collision: **none** under RESERVE policy.  
6. Success: leave archive view (row disappears from Archivados); do not force-open Edit.  
7. Cache invalidation same union as archive.

# Hard Delete Contract

**DEFERRED / NOT EXPOSED in v1.**  
If ever introduced: maintenance-only; resolve RESTRICT children; clean polymorphic assignments; Storage after DB; irreversible confirmation; never default merchant path.

# Dirty Draft Interaction

**REMOVAL IS A SEPARATE LIFECYCLE OPERATION.**  
If Edit dirty → Archive/Restore blocked until user **Saves or discards** via existing unsaved-change flow.  
No auto-save; no archive-includes-draft; no Save+Archive hybrid.

# Permission / RLS

| Concern | Decision |
|---------|----------|
| Who | Same **manageProducts** roles: owner / admin / manager (+ super_admin) |
| Current DELETE RLS | Proven: authenticated manageProducts may DELETE |
| Future DELETE | **RLS CHANGE REQUIRED** — remove or deny normal `products_delete_own_business` for app roles; reserve hard DELETE for **service_role / maintenance** only |
| Archive/restore authority | Via **UPDATE** policy (already role-gated) + app server action |

**Application-only archive is incomplete while manageProducts can `DELETE /rest/v1/products`.**

# Atomicity / RPC

Archive/restore of products columns alone: **single UPDATE** can set `archived_at` + `is_available` atomically.  
**RPC: OPTIONAL / SIMPLE SERVER ACTION SUFFICIENT** for v1 (still may author RPC later for stricter invariant checks).  
No multi-table mutation required for core archive if assignments/overrides are preserved in place.

# Schema / Migration Decision

| Decision | Value |
|----------|-------|
| Schema | **SCHEMA CHANGE REQUIRED** — `archived_at timestamptz null`; partial indexes for active lists; optional check preventing archived+available |
| Migration | **MIGRATION REQUIRED** |
| RLS | **RLS CHANGE REQUIRED** — public SELECT + DELETE policy; admin SELECT unchanged (sees all) with app filters |
| RPC | **OPTIONAL / SERVER ACTION SUFFICIENT** |

# Storage Decision

Archive: **KEEP IMAGE**  
Restore: **REUSE**  
Hard delete (deferred): cleanup **after** successful DB delete; orphan object tolerated with retry — never delete Storage first for reversible ops.

# Cache Invalidation

Union on archive/restore:  
`/admin/products` · public catalog · public customization · preview (existing invalidation helpers as used by product mutations).

# Empty-Catalog Semantics

| Signal | Meaning under archive |
|--------|------------------------|
| Onboarding empty (`catalogTotalCount === 0`) | **Zero product rows total** (including archived) |
| Default list empty with archived existing | Filtered/lifecycle empty — **not** first-run Create auto-open |
| “N productos” | Non-archived by default |

# Concurrency

Archive/restore should be **idempotent**.  
Two admins: last writer wins on timestamp; no optimistic locking required for v1.

# Verify Census

| Area | Action |
|------|--------|
| Image lifecycle “no product delete” | **UPDATE** — still no hard-delete UI; archive verbs allowed later |
| Products list / empty catalog | **UPDATE** — archived filters + catalogTotalCount semantics |
| Availability / stock | **KEEP** + note archive forces unavailable |
| SKU unique | **KEEP** (reserve policy) |
| Public catalog / manual order | **UPDATE** — exclude archived |
| Customization / RLS | **UPDATE** / **NEW** for archive policies |
| Edit Advanced / unified draft / flyout / sticky | **KEEP** — do not reopen |
| NEW verify | Archive/restore contract verify in implementation phase |

# Superseded / Deferred Concepts

- Availability-as-removal  
- v1 hard delete / never-ordered purge shortcut  
- SKU reuse on archive  
- Auto-restore prior availability  
- Editable archived product (v1 = read-only + Restaurar)  
- Category delete while archived products exist (accepted friction)  
- `updated_at` introduction  
- Billing/quota counting — **NONE FOUND**

# Recommended Implementation Roadmap

1. **ADMIN-PRODUCTS-PRODUCT-REMOVAL-ARCHIVE-DB-AUTHOR-1** — migration + RLS/index authoring (no apply)  
2. **ADMIN-PRODUCTS-PRODUCT-REMOVAL-ARCHIVE-DB-APPLY-1** — remote apply + validate  
3. **ADMIN-PRODUCTS-PRODUCT-REMOVAL-ARCHIVE-IMPLEMENTATION-1** — server actions + admin/public query filters + Edit lifecycle UX + Archivados filter  
4. **ADMIN-PRODUCTS-PRODUCT-REMOVAL-ARCHIVE-FINAL-QA-1** — end-to-end QA (0 net business delta)

# Data Safety

products / order_items / stock_movements / overrides / assignments / categories / profiles / Storage / orders / schema / RLS / RPC / migration history: **0** mutations this phase.

# Runtime Changes = 0

Docs + living memory/audit only.

# Next

**ADMIN-PRODUCTS-PRODUCT-REMOVAL-ARCHIVE-DB-AUTHOR-1**

COMMIT/PUSH/DEPLOY: **PAUSED**
