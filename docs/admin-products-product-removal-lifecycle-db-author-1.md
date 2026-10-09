# ADMIN-PRODUCTS-PRODUCT-REMOVAL-LIFECYCLE-DB-AUTHOR-1

# Result

**PASS — FINAL PRODUCT LIFECYCLE DB MIGRATION + PERMANENT DELETE RPC AUTHORED / NOT APPLIED**

# Corrected Contract Baseline

Source: `docs/admin-products-product-removal-contract-correction-1.md` — **PASS**.

V1: **ARCHIVE + RESTORE + PERMANENT DELETE**

Closed decisions consumed as-is (not reopened):

- Availability separate (`is_available`)
- Archive reversible via `archived_at`; forces unavailable; preserves row/SKU/stock/image/relations
- Restore same id; remains unavailable; no auto-republication
- Permanent delete immediate from ACTIVE or ARCHIVED; irreversible; no recycle bin
- Historical orders / order_items / snapshots preserved; `product_id` may SET NULL
- Cancel after delete succeeds; no restock / recreate / ledger reconstruction for deleted product
- Product-specific `stock_movements` deleted
- Product-owned customization/upsell relations auto-cleaned
- SKU reserved while row exists (including archived); free after permanent delete
- Image Storage cleanup post-commit only
- Raw table DELETE denied; domain RPC is the delete API
- Permission: manageProducts semantics

# Preflight

| Field | Value |
|-------|-------|
| branch | `main` |
| HEAD | `c9af635e27ad86e0731eea0a90b16b9b628d5aa6` |
| dirty | **PRE-EXISTING** Products package + docs (large uncommitted working tree) |

**PRE-EXISTING DELTA:** prior Products UX/unified-draft/docs package (untouched by this phase beyond CURRENT_PHASE / living audit / living memory / supersession verify).

**THIS PHASE DELTA:**

- `supabase/migrations/20260916180000_products_removal_lifecycle.sql` (new final)
- removed `supabase/migrations/20260916180000_products_archive_lifecycle.sql` (superseded unapplied)
- `lib/products/admin-products-product-removal-lifecycle-db-author.verify.ts`
- `lib/products/admin-products-product-removal-archive-db-author.verify.ts` (supersession stub)
- this doc + CURRENT_PHASE + living audit + living memory

No commit / push / deploy / remote write.

# Target Identity

| Check | Result |
|-------|--------|
| Expected ref | `pkrsedmwxekbhlohhqds` |
| Live URL | `https://pkrsedmwxekbhlohhqds.supabase.co` |
| Workspace linking | not relied upon |
| Other projects | not touched |
| Live writes | **0** |

# Old Migration Remote-State Proof

| Check | Result |
|-------|--------|
| path | `supabase/migrations/20260916180000_products_archive_lifecycle.sql` |
| old SHA256 | `55f187f5b4362723ba1e4e3659a90769cc75d57ea61b615f79d2505e89db88bb` |
| remote `archived_at` | **absent** |
| remote history `version=20260916180000` | **count 0** |
| remote CHECK `products_archived_requires_unavailable` | absent (column absent) |
| remote index `products_business_created_at_active_idx` | absent |
| remote policy `products_delete_own_business` | **still live** |
| applied | **NO** |
| safe replacement | **YES** |

Gate `UNAPPLIED_ARCHIVE_MIGRATION_ALREADY_APPLIED`: **not triggered**.

# Migration Replacement Strategy

| Field | Value |
|-------|-------|
| strategy | Remove unapplied archive-only file; author one final lifecycle migration under the **same version timestamp** `20260916180000` |
| old local file | `20260916180000_products_archive_lifecycle.sql` (**removed**) |
| final local file | `20260916180000_products_removal_lifecycle.sql` |
| reason | One coherent pending apply unit; avoids archive-only + patch dual-apply; timestamp unchanged because never applied remotely or locally recorded |

# Product Relation Census

## Physical FKs

Live OrderOps (`pkrsedmwxekbhlohhqds`) FK census where `confrelid = public.products`:

| table | column | nullable | ON DELETE | historical vs operational | approved delete behavior |
|-------|--------|----------|-----------|---------------------------|--------------------------|
| `order_items` | `product_id` | yes | **SET NULL** | historical | **PRESERVE** row + snapshots; FK nulls link |
| `product_customization_overrides` | `product_id` | no | **CASCADE** | operational | **FK CASCADE** (product-owned) |
| `upsell_group_items` | `product_id` | no | **RESTRICT** | operational | **DELETE EXPLICITLY** (item rows only) |
| `stock_movements` | `product_id` | no | **RESTRICT** | operational ledger | **DELETE EXPLICITLY** (product-scoped) |

No other physical FKs to `public.products` on live schema.

## Logical / Polymorphic References

| table | discriminator | physical FK? | delete behavior | shared-definition risk |
|-------|---------------|--------------|-----------------|------------------------|
| `customization_group_assignments` | `target_type` ∈ {category,product} + `target_id` | no | **DELETE** where `target_type='product' AND target_id=product` | none if both predicates used |
| `upsell_groups` | `target_type` ∈ {category,product} + `target_id` | no | **DELETE** product-targeted groups only (1:1 per target) | category-targeted groups preserved; group is not cross-target shared |
| app JSON / create_order payloads | runtime only | n/a | not DB rows | n/a |

Census complete → no `PERMANENT_DELETE_RELATION_CENSUS_INCOMPLETE`.

Ownership of product-targeted `upsell_groups` proven 1:1 via `unique (business_id, target_type, target_id)` → no `PERMANENT_DELETE_SHARED_DEFINITION_OWNERSHIP_AMBIGUOUS`.

# Preserve / Delete Matrix

**PRESERVE**

- `orders`
- `order_items` (+ commercial snapshots)
- `categories`
- shared customization group/option definitions
- category-targeted upsell groups
- unrelated products / business data

**DELETE / RECONCILE**

- `stock_movements` for deleted product
- `product_customization_overrides` (CASCADE)
- product-target `customization_group_assignments`
- `upsell_group_items` referencing deleted product
- product-target `upsell_groups` (and their remaining items via CASCADE)
- `public.products` row

**POST-COMMIT (application; not this migration)**

- Storage object for returned `image_url` if unreferenced

# Historical Orders

| Fact | Proof |
|------|-------|
| `order_items.product_id` ON DELETE SET NULL | live FK |
| snapshots | order UI uses persisted `product_name` / `unit_price` / quantity / customization snapshot fields |
| permanent delete must not rewrite snapshots | RPC never UPDATEs `order_items` / `orders` |
| expected effect | `product_id → NULL`; line preserved |

# Cancellation / Restock Forensics

Source: live-applied `20260717140000_product_stock_restock_cancel_1.sql` → `public.transition_order_status`.

Cancel restock path:

1. Selects `stock_movements` with `movement_type='order_decrement'` **INNER JOIN `public.products`** on `p.id = sm.product_id` and `p.track_stock = true`, excluding already-restocked items.
2. Locks / updates only those live products.
3. Inserts `order_restock` rows only for that set.

Answers:

1. Cancellation still transitions the order (status update is independent of restock loop).
2. Restock JOINs only live products.
3. NULL `order_items.product_id` is irrelevant; restock is ledger-driven via movements JOIN products.
4. Absence of deleted product’s movements → safe no-op for that product (not selected).
5. No function requires every order item to find a product for cancel success.
6. Deleting product movements cannot fail cancel; it only removes that product from restock eligibility.

Approved target met:

- ORDER CANCELLATION: SUCCESS
- DELETED PRODUCT RESTOCK: 0
- DELETED PRODUCT RECREATE: 0
- DELETED PRODUCT LEDGER RECONSTRUCTION: 0
- SURVIVING PRODUCT RESTOCK: preserved (still joins live product + remaining movements)

# Restock DB Change Decision

**RESTOCK DB CHANGE: NOT REQUIRED**

Exact safe branch: `JOIN public.products p ON p.id = sm.product_id ... AND p.track_stock = true` inside the cancel restock block of `transition_order_status`. Missing product / missing movements → empty set → `restocked_items` may be 0 for that product while cancel still commits.

# Lifecycle Schema

Authored in final migration only. Structural DDL. No product content UPDATE.

# archived_at

`public.products.archived_at timestamptz NULL`

- Existing rows: NULL by default
- No backfill
- No `deleted_at` / `is_archived` / status enum / lifecycle table

# Lifecycle Check

`products_archived_requires_unavailable`

`CHECK (archived_at IS NULL OR is_available = false)`

Future archive UPDATE: `archived_at = now()`, `is_available = false`  
Future restore UPDATE: `archived_at = NULL`, `is_available = false`  
No lifecycle trigger (CHECK sufficient).

Archived read-only UX remains application-owned (Restore must UPDATE `archived_at`).

# Public SELECT

Recreated `products_select_available_public` for `anon` from **current live** predicates + archive exclusion:

- `is_available = true`
- `archived_at IS NULL`
- active business exists (`businesses.is_active = true`)

# Admin SELECT

`products_select_own_business` **untouched**.

Reason: Archivados view requires authorized admin reads of archived rows; adding `archived_at IS NULL` would break that.

# Raw DELETE Boundary

`products_delete_own_business` **dropped**; no replacement DELETE policy.

Table GRANT DELETE may remain (Supabase default). With RLS enabled and no DELETE policy, ordinary authenticated/anon sessions cannot delete product rows. `service_role` bypasses RLS (maintenance only).

Target matrix (app sessions): owner/admin/manager/operator/viewer/foreign/anon → **DENY** raw DELETE.

# Permanent Delete RPC

## Signature

```sql
public.delete_product_permanently(p_product_id uuid)
returns table (
  deleted_product_id uuid,
  image_url text,
  deleted boolean
)
```

## Security Mode

**RPC SECURITY: SECURITY DEFINER**

Rationale:

- After dropping `products_delete_own_business`, INVOKER cannot delete `products` without reopening raw DELETE.
- `stock_movements` has SELECT-only RLS (no DELETE policy) while FK is ON DELETE RESTRICT → INVOKER cannot clear the blocker.
- DEFINER enables atomic domain cleanup while raw table DELETE stays denied.

## Caller Authentication

- `auth.uid()` required
- profile must exist
- errors: `DELETE_PRODUCT_PERMANENTLY_UNAUTHORIZED` / `FORBIDDEN` / `INVALID_INPUT` / `INTEGRITY_FAILURE`

## Permission

Roles: `owner`, `admin`, `manager`, `super_admin` (mirrors `canManageProducts` + existing products mutative RLS).  
`operator` / `viewer`: FORBIDDEN.

## Tenant Authority

- Non-super_admin: lock `products` where `id = p_product_id AND business_id = profile.business_id`
- Super_admin: lock by id only (existing cross-tenant maintenance semantics)
- No client `business_id` input

## Row Locking

`SELECT ... FOR UPDATE` before cleanup.

## Cleanup Order

1. Authenticate / authorize
2. Lock product; capture `id`, `business_id`, `image_url`
3. DELETE `customization_group_assignments` (`target_type='product' AND target_id=...`)
4. DELETE `upsell_group_items` (`product_id=...`)
5. DELETE `upsell_groups` (`target_type='product' AND target_id=...`)
6. DELETE `stock_movements` (`product_id=...`)
7. DELETE `products` row (overrides CASCADE; `order_items.product_id` SET NULL)
8. Return captured image handoff

## Return Contract

| Field | Meaning |
|-------|---------|
| `deleted=true` | first successful permanent delete |
| `deleted_product_id` / `image_url` | locked pre-delete values |
| `deleted=false`, nulls | absent / already deleted / inaccessible foreign id (non-leaking) |

No Storage mutation inside RPC.

## Idempotency

Second/stale authorized call → `deleted=false` (no error, no side effects).  
Partial failure before commit → full transaction rollback (Postgres atomicity).

# Stock Movements

Explicit `DELETE FROM public.stock_movements WHERE product_id = v_product_id` only.

# Customization Overrides

Rely on existing **ON DELETE CASCADE**. Not explicitly deleted in RPC (FK sufficient).

# Customization Assignments

Explicit delete with **both** `target_type='product'` and `target_id=v_product_id`.

# Upsells

| Relation | Behavior |
|----------|----------|
| items | delete where `product_id = target` |
| product-targeted groups | delete where `target_type='product' AND target_id=target` |
| shared / category-targeted definitions | preserved |
| customization group/option definitions | preserved |

# SKU

| State | Contract |
|-------|----------|
| archived (row exists) | **RESERVED** (`products_business_sku_uidx` unchanged; no `archived_at` predicate) |
| permanently deleted | **FREE** (row gone) |

# Images / Storage Handoff

1. RPC commits with returned pre-delete `image_url`
2. Future Server Action runs shared-reference guard against remaining products
3. If unreferenced → delete Storage object
4. Storage failure never resurrects product row

No Storage SQL/HTTP in migration.

# Unified Edit Compatibility

`save_product_edit_draft` **not modified**.

- Future app will not Save archived rows
- CHECK blocks archived+available
- Concurrent Save vs Delete: both lock product row → one commits first; loser either deletes final row or Save fails safely on missing row
- No optimistic version column added

# Archive / Restore RPC Decision

**ARCHIVE RPC: NOT REQUIRED**  
**RESTORE RPC: NOT REQUIRED**

Ordinary role-gated atomic UPDATE under existing `products_update_own_business` is sufficient:

- Archive: `archived_at=now(), is_available=false`
- Restore: `archived_at=null, is_available=false`

# Index Decision

`products_business_created_at_active_idx ON (business_id, created_at DESC) WHERE archived_at IS NULL`

Justified by current admin list ordering (`lib/products/admin.ts`) + future default active filter.  
No speculative archive-list / search indexes.

# ACL / Search Path

- `SECURITY DEFINER`
- `SET search_path = ''`
- fully qualified `public.*` / `auth.uid()`
- `REVOKE ALL ... FROM PUBLIC`
- `REVOKE ALL ... FROM anon`
- `GRANT EXECUTE ... TO authenticated`

# Focused Verification

`lib/products/admin-products-product-removal-lifecycle-db-author.verify.ts`

**PASS**

SHA256 reported by verify matches file hash.

# Mutation Probes

| Probe | Attack | Result |
|-------|--------|--------|
| A | remove `archived_at IS NULL` from public policy | FAIL_OK → restore PASS |
| B | SKU unique with `archived_at IS NULL` reuse | FAIL_OK → restore PASS |
| C | reintroduce raw DELETE policy | FAIL_OK → restore PASS |
| D | remove manageProducts role check | FAIL_OK → restore PASS |
| E | remove `target_type` from assignment cleanup | FAIL_OK → restore PASS |
| F | remove `search_path` hardening | FAIL_OK → restore PASS |

All temporary mutations restored.

# Final Migration

| Field | Value |
|-------|-------|
| path | `supabase/migrations/20260916180000_products_removal_lifecycle.sql` |
| SHA256 | `5f19d2697f79d2bf17a3388d619a42bc31e32690313362a1cf26400c32628d57` |
| applied | **NO** |
| old archive SHA | `55f187f5b4362723ba1e4e3659a90769cc75d57ea61b615f79d2505e89db88bb` |

# DB Apply Matrix

70-item matrix for next phase (do not execute now):

**SCHEMA 1–4:** `archived_at` live/nullable; existing rows NULL; CHECK live; active-list index live.

**PUBLIC 5–7:** available+active readable; archived unreadable; archived+available UPDATE rejected.

**ADMIN READ 8–9:** owner/admin/manager read archived own; foreign cannot manage beyond current read contract.

**ARCHIVE 10–15:** authorized archive UPDATE; unavailable forced; SKU reserved; image/stock/customizations stay.

**RESTORE 16–19:** authorized restore; same id; remains unavailable; SKU/image/stock/category remain.

**RAW DELETE 20–25:** owner/admin/manager/operator/viewer/foreign/anon DENY.

**RPC SECURITY 26–34:** manageProducts allow; operator/viewer deny; foreign deny; anon deny; PUBLIC execute deny; security mode + search_path exact; super_admin matches contract.

**FUNCTIONAL 35–47:** delete active + archived; no archive prerequisite; row gone; SKU free; movements/overrides/assignments/upsell items/targets gone; shared defs + category + unrelated products remain.

**HISTORICAL 48–54:** order + item preserved; `product_id` NULL; snapshots unchanged.

**CANCEL AFTER DELETE 55–59:** cancel succeeds; no recreate/restock/ledger for deleted; surviving tracked products still restock (mixed fixture).

**IMAGE 60–61:** RPC returns pre-delete URL; no Storage mutation.

**IDEMPOTENCY 62–65:** duplicate safe; no cross-tenant leak; late-failure atomic rollback.

**MIGRATION 66–70:** exact hash applied once; no collateral; history reconciled only if needed; disposable QA net delta 0.

# Late-Failure Atomicity Plan

DB-APPLY technique (no production test hook):

1. Open a disposable transaction as authorized role calling the RPC path via SQL that performs the same cleanup steps manually **or** wraps `delete_product_permanently` inside a transaction that raises after inspecting intermediate deletes (prefer: call RPC in a subtransaction / use a deliberate FK conflict fixture that cannot survive product delete, then ROLLBACK outer tx).
2. Preferred safe method: `BEGIN;` run cleanup statements mirroring RPC up to before final product delete; `SELECT count(*)` prove children gone; `ROLLBACK;` prove children restored.
3. Separately: successful RPC commit on disposable fixture; then prove no partial residue across tables.
4. Do **not** add permanent failure hooks to production function.

# Disposable Fixture Plan

Prefer `BEGIN`/`ROLLBACK` for role/RLS probes.

If persistent fixtures required:

Create disposable business-scoped product with unique SKU + image_url + stock_movements + override + product-target assignment + upsell item (+ product-target upsell group if needed) + historical order_item if safely constructible → exercise RPC → delete/restore all disposable rows → prove net zero vs baseline counts for that business.

Never use live merchant products for destructive delete QA.

# Mixed Order Restock Plan

DB-APPLY fixture (preferred):

1. Order with item A (to-be-deleted tracked product) + item B (surviving tracked product)
2. Ensure both have `order_decrement` movements
3. Permanently delete product A
4. Cancel order via `transition_order_status`

Expect: cancel success; A not restocked / not recreated; B restocked normally.

If fixture construction unsafe in DB-APPLY, defer exact mixed proof to FINAL-QA with reason recorded — do not fake.

# Data Safety

During this phase:

products/orders/order_items/stock_movements/overrides/assignments/upsells/categories/profiles/Storage/remote schema/RLS/RPC/history = **0 mutations**.

# Runtime Changes = 0

No `.tsx`, no Products `actions.ts` runtime, no UI/CSS, no Storage runtime, no collection query changes in this phase.

# Next

**ADMIN-PRODUCTS-PRODUCT-REMOVAL-LIFECYCLE-DB-APPLY-1**

# Release

**COMMIT / PUSH / DEPLOY: PAUSED**
