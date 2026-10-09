# ADMIN-PRODUCTS-PRODUCT-REMOVAL-CONTRACT-CORRECTION-1

**Date:** 2026-09-16  
**Gate:** PASS — PRODUCT REMOVAL CONTRACT CORRECTED — ARCHIVE + RESTORE + PERMANENT DELETE  
**Evidence:** Owner clarification + prior forensic census (preserved) + read-only live reconfirm  
**Runtime / DB / migration edits:** **0**

# Result

Corrected V1 product lifecycle:

**ARCHIVE + RESTORE + PERMANENT DELETE**

Availability remains a separate merchandising axis.  
Permanent Delete is immediate, irreversible, and available for **active and archived** products without archive prerequisite.  
Raw PostgREST `DELETE /products` remains **DENIED**; canonical path = server action → transactional domain RPC.

# Trigger

Owner clarification after CONTRACT-DECISION-1 and ARCHIVE-DB-AUTHOR-1 (unapplied): OrderOps must expose both reversible Archive and true Permanent Delete as merchant capabilities.

# Why Correction Was Required

Prior decision deferred hard delete to protect inventory/restock integrity and avoid orphans. Owner product philosophy overrides that deferral:

- warn clearly;
- user owns the final lifecycle choice;
- OrderOps auto-reconciles known internal dependencies;
- commercial order history survives; product-owned operational state may be removed.

Forensic evidence remains valid; the **selected product behavior** changes.

# Previous Contract

**ADMIN-PRODUCTS-PRODUCT-REMOVAL-CONTRACT-DECISION-1**  
STATUS: **HISTORICAL PASS / SUPERSEDED BY OWNER CLARIFICATION**  
Evidence: **PRESERVED**  
Old selected behavior (hard delete deferred): **SUPERSEDED**

# Owner Clarification

1. Permanent delete exists directly (no archive-first requirement).  
2. Allowed even with historical sales.  
3. Historical orders/snapshots preserved.  
4. Product stock ledger for that product may be permanently deleted.  
5. Product image permanently deleted (post-commit Storage).  
6. SKU free immediately after permanent delete.  
7. Archive still exists separately (reversible).  
8. Archived = read-only (inspect / restore / delete).  
9. Delete UX: Edit flyout danger zone (not collection-row canonical).  
10. Confirmation: clear consequences + destructive primary; **no typed name**.  
11. System auto-resolves known dependencies.  
12. Warn, then user decides.  
13. Product-targeted upsell/customization refs auto-clean.  
14. Cancel after delete: order cancels; no product recreate; no restock/ledger for deleted product.  
15. Immediate / permanent / irreversible — no undo / recycle bin.

# Corrected V1 Contract

```txt
ACTIVE  → Archive | Permanent Delete
ARCHIVED → Restore | Permanent Delete
DELETED → (no restore)
```

# Lifecycle Model

## Availability

`is_available` = public selling state. Unchanged stock/availability trigger contract.

## Archive

`archived_at = now()` + `is_available = false`. Reversible. Preserves id, SKU, image, stock, category, overrides, assignments, upsells, ledger, order links.

## Restore

`archived_at = NULL`; **`is_available` stays false**. Same product id / SKU / image / stock / category / customizations / `created_at`.

## Permanent Delete

User-facing: **Eliminar producto**. Removes product row + product-owned operational state. Orders survive. No undo.

# Lifecycle Matrix

| Lifecycle | Availability | Valid |
|-----------|--------------|-------|
| active | available | YES |
| active | unavailable | YES |
| archived | available | **NO** |
| archived | unavailable | YES |
| deleted | any | N/A (row absent) |

| State | Actions |
|-------|---------|
| active | Edit, Archive, Delete |
| archived | Inspect (RO), Restore, Delete |
| deleted | none |

# Archived Product UX

Read-only detail. Allowed: inspect, Restaurar, Eliminar.  
Forbidden: unified Save, field edits, availability toggle, overrides, image, stock, SKU.

# Permanent Delete UX

Primary location: Edit / danger zone bottom.  
Confirm: permanente / irreversible / history kept / config+stock removed / image removed / SKU reusable.  
Primary: **Eliminar producto** (destructive). Secondary: Cancelar. No typed name, no nested modal, no undo.

# Dirty Draft Interaction

Delete ≠ Save. If dirty: **Save or discard first**. No auto-save, no save+delete hybrid.

# Historical Orders

Preserve: orders, order_items, product_name, unit_price, quantity, customization_snapshot, item_kind.  
Live FK: `order_items.product_id` **ON DELETE SET NULL** (reconfirmed).  
No tombstone / synthetic product rows.

# Cancellation After Delete

Order cancel: **SUCCEEDS**.  
Deleted product: **not recreated**.  
Stock: **not restored**.  
Ledger: **not reconstructed**. Intentional.

# Stock / Ledger

`stock_movements` for that product: **DELETE WITH PRODUCT** (owner-approved; supersedes prior “ledger forever blocks delete”).  
`ON DELETE RESTRICT` requires explicit pre-delete cleanup inside transactional RPC.

# SKU

Archived: **RESERVED** (unique index unchanged; never `WHERE archived_at IS NULL`).  
Permanently deleted: **FREE** (row gone → index frees naturally).

# Images / Storage

Archive: KEEP · Restore: REUSE · Delete: DELETE after DB commit.  
Shared-reference guard. Storage failure after commit: product stays deleted; orphan = retry/maintenance.

# Customizations

Overrides: delete (existing **ON DELETE CASCADE** acceptable; DB-author verifies).  
`customization_group_assignments` product targets: **explicit DELETE** (no FK). No orphans.

# Upsells

`upsell_group_items.product_id` **RESTRICT** → delete **relation rows** in transaction.  
`upsell_groups` polymorphic product targets: remove product-target linkage only; **do not** destroy unrelated shared definitions. Exact SQL in next DB-author.

# Relation Cleanup Matrix

| Relation | Permanent delete behavior |
|----------|---------------------------|
| order_items | **PRESERVE**; `product_id` → NULL via FK |
| stock_movements (this product) | **DELETE** rows explicitly |
| product_customization_overrides | **DELETE** / CASCADE OK |
| customization_group_assignments (`target_type=product`) | **DELETE** target rows explicitly |
| upsell_group_items | **DELETE** relation rows explicitly |
| upsell_groups product-target linkage | **REMOVE** product-owned target state only |
| categories | **PRESERVE** category; product relation disappears |
| image Storage | **POST-COMMIT** cleanup if unreferenced |

No UNKNOWN for known current schema relations.

# Transactional Delete Architecture

Required:

```txt
UI → deleteProductPermanentlyAction → transactional RPC → COMMIT → Storage cleanup
```

Conceptual txn: validate caller/tenant/permission → lock product → clean polymorphic assignments → clean upsell relations → delete stock_movements → other product-owned blockers → delete products row.

# Direct DELETE / RLS Boundary

`DELETE /rest/v1/products` for ordinary authenticated sessions: **DENIED**.  
Dropping `products_delete_own_business` remains compatible — rationale updated: delete only via safe domain RPC, not “delete deferred forever.”

# RPC Requirement

**REQUIRED** for permanent delete (multi-table atomicity).

# RPC Security Decision Deferred to DB Author

INVOKER vs DEFINER: least privilege that can perform cleanup; if DEFINER → authz + search_path + revoke PUBLIC/anon. **Not predecided here.**

# Permissions

`manageProducts` (owner/admin/manager + super_admin semantics). No owner-only invent.

# Cache Invalidation

Archive / restore / delete: `/admin/products` + public catalog + public customization + preview.

# Empty-Catalog Semantics

Archived rows count as catalog history (not first-run empty).  
After permanently deleting every product (0 rows): catalog **is** genuinely empty — first-run empty may apply again.

# Concurrency

Dirty blocks delete. Re-read row in txn. Duplicate delete: prefer idempotent-safe. No implementation now.

# Previous Contract Supersession

CONTRACT-DECISION-1 = historical PASS / superseded by owner clarification. Forensic quality preserved.

# Previous DB-Author Supersession

**ADMIN-PRODUCTS-PRODUCT-REMOVAL-ARCHIVE-DB-AUTHOR-1**  
STATUS: **HISTORICAL TECHNICAL PASS / SUPERSEDED BEFORE APPLY**  
Migration: **NOT APPLIED** · **DO NOT APPLY AS STANDALONE**  
Reason: archive foundation only; missing permanent-delete transactional RPC/cleanup.

# Unapplied Migration Disposition

path: `supabase/migrations/20260916180000_products_archive_lifecycle.sql`  
old SHA: `55f187f5b4362723ba1e4e3659a90769cc75d57ea61b615f79d2505e89db88bb` (file unchanged this phase)  
remote: `archived_at` **absent**; schema_migrations `20260916180000` **count 0**; DELETE policy still live  
status: **SUPERSEDED / REQUIRES REAUTHORING BEFORE APPLY**  
safe to apply standalone: **NO**

# What Remains Reusable

- `archived_at` + archive⇒unavailable CHECK  
- public SELECT excludes archived  
- admin SELECT sees archived  
- active-list partial index  
- SKU index unchanged  
- block raw authenticated DELETE  
- stock trigger / FK shapes unchanged unless cleanup strategy requires explicit child deletes (RESTRICT tables)

# Data Safety

All business/schema/RLS/RPC/history/Storage mutations: **0**. Migration file edits: **0**.

# Runtime Changes = 0

Docs / living audit / memory only.

# Corrected Roadmap

1. **ADMIN-PRODUCTS-PRODUCT-REMOVAL-LIFECYCLE-DB-AUTHOR-1** — final schema/RLS + permanent-delete RPC (no apply); revise/replace unapplied migration after proving remote absence  
2. **ADMIN-PRODUCTS-PRODUCT-REMOVAL-LIFECYCLE-DB-APPLY-1** — apply + live matrix  
3. **ADMIN-PRODUCTS-PRODUCT-REMOVAL-LIFECYCLE-IMPLEMENTATION-1** — actions + filters + Archivados + RO archived Edit + Archive/Restore/Delete UX + Storage  
4. **ADMIN-PRODUCTS-PRODUCT-REMOVAL-LIFECYCLE-FINAL-QA-1** — E2E disposable fixtures / net-zero

# Next DB-Author Must Decide

- RPC SECURITY INVOKER vs DEFINER  
- exact upsell / assignment cleanup SQL  
- locking/concurrency  
- function return contract  
- Storage path handoff to server action  
- rewrite vs replace unapplied migration file  
- exact DB test matrix  

These are implementation details, not open product decisions.

# Next

**ADMIN-PRODUCTS-PRODUCT-REMOVAL-LIFECYCLE-DB-AUTHOR-1**
