# ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-DB-AUTHOR-APPEND-LOCK-AUTHORITY-FIX-1

# Result

**PASS — CATEGORY APPEND LOCK AUTHORITY CLOSED / FINAL CORRECTED DB MIGRATION AUTHORED / REMOTE APPLY REQUIRED**

# Blocker Origin

| Field | Value |
|-------|-------|
| previous attempt | ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-DB-APPLY-1 (attempt 2) |
| reason | `CATEGORY_ORDER_DB_APPLY_APPEND_LOCK_AUTHORITY_FAIL` |
| remote delta | **0** |

# Attempt History

| # | Outcome |
|---|---------|
| APPLY #1 | BLOCKED — POSITION_AUTHORITY_BYPASS — remote 0 |
| APPLY #2 | BLOCKED — APPEND_LOCK_AUTHORITY_FAIL — remote 0 |

# Remote Safety

OrderOps `pkrsedmwxekbhlohhqds` ACTIVE_HEALTHY.  
Category-order remote history: **0**. Schema objects: **ABSENT**. Data delta: **0**.

# Preflight

branch `main` · HEAD `c9af635e27ad86e0731eea0a90b16b9b628d5aa6` · dirty Products package preserved

# Target Identity

OrderOps · `pkrsedmwxekbhlohhqds` · PROVEN · MauroDev not touched

# Remote History

| Migration | Remote |
|-----------|--------|
| `20260917182047…` | 0 |
| `20260917202554…` | 0 |
| `20260917210150…` (final) | 0 (authored only) |

# Live Businesses Authority

| Item | Live |
|------|------|
| grants | authenticated SELECT+UPDATE (+ INSERT/DELETE) |
| SELECT RLS | own business OR super_admin; active public |
| UPDATE RLS | **`role = 'admin'` only** (`businesses_update_own_business`) |
| forced | NO |
| manageProducts vs businesses | manageProducts wider (owner/admin/manager/super_admin); businesses UPDATE narrower (admin) |

# Why SECURITY INVOKER Fails

`SELECT … FOR UPDATE` requires UPDATE privilege **and** applies UPDATE RLS.  
Invoker owner/manager/super_admin cannot satisfy admin-only businesses UPDATE RLS → Category Create breaks.

# Businesses Domain Freeze

Final migration does **not** alter businesses policies, grants, or RLS enable/force.

# SECURITY DEFINER Owner Forensic

| Item | Value |
|------|-------|
| established DEFINER owner | `postgres` (`delete_product_permanently`) |
| `rolbypassrls` | **true** |
| table owner businesses/categories | `postgres` |
| owner UPDATE/SELECT businesses | **YES** |
| proven | DEFINER owner can `FOR UPDATE` businesses independent of caller RLS |

# Selected Fix

| Aspect | Decision |
|--------|----------|
| append security | **SECURITY DEFINER** |
| search_path | `''` |
| internal auth | `auth.uid()` + `public.profiles` |
| normal tenant | profile.business_id = NEW.business_id |
| super_admin | global (matches Category INSERT RLS) |
| lock | businesses FOR UPDATE **after** auth |
| businesses policies/grants | **UNCHANGED** |

# Rejected Businesses-RLS Expansion

Would distort Business/Settings domain to satisfy Category concurrency — rejected.

# Rejected Advisory Lock

Businesses row already shared with reorder RPC — keep same mutex.

# Append Internal Authentication

auth.uid → profile → role allow-list → tenant equality (non-super_admin) → then lock.

# Role Contract

Allowed: owner, admin, manager, super_admin.  
Denied: operator, viewer, null/unknown, unauthenticated.

# Tenant Contract

owner/admin/manager: `profile.business_id = NEW.business_id` (non-null).  
Foreign denied **before** lock.

# Super Admin Contract

Matches Category INSERT RLS / reorder RPC: global manageProducts path; no profile.business_id equality required.

# Authorization-Before-Lock Contract

Hard structural order verified (auth/role/tenant indices before businesses FOR UPDATE).

# Foreign Lock Protection

Tenant mismatch / forbidden role → deny before `FOR UPDATE`.

# Trigger ACL

PUBLIC/anon EXECUTE revoked; authenticated EXECUTE granted (project trigger convention; not an RPC surface).

# Service Role / Maintenance Census

Ordinary: `createCategoryAction` INSERT `{business_id, name}` only.  
Service-role: Category DELETE (wipe) only — **no Category INSERT**.  
Decision: **NOT A CURRENT APPLICATION CONTRACT** for service-role INSERT; no `auth.uid() IS NULL ⇒ ALLOW`.

# Append Position Contract

Always `max(position)+1` (or 0); client INSERT position overridden.

# Concurrency Contract

Same businesses mutex as `save_category_display_order`. Lock order: BUSINESS → categories (RPC).

# Category RLS Defense in Depth

manageProducts INSERT/UPDATE/DELETE preserved; SELECT unchanged.

# Position Authority Preservation

authenticated UPDATE(name) only; position denied; anon UPDATE denied.

# RPC Preservation

`save_category_display_order(uuid[])` unchanged semantics.

# Migration Supersession History

| # | File | SHA | Reason |
|---|------|-----|--------|
| 1 | `20260917182047…` | `4bb35bec…` | POSITION_AUTHORITY_BYPASS |
| 2 | `20260917202554…` | `18ef6307…` | APPEND_LOCK_AUTHORITY_FAIL |

Both removed from active chain; remote history 0.

# Final Standalone Migration

`supabase/migrations/20260917210150_categories_public_catalog_order.sql`  
Complete: ambiguity → DEFINER append → backfill → NOT NULL → DEFERRABLE unique → RPC → RLS → privileges.

# Backfill Recheck

ambiguity **0** · simulation delta **0**

# Final Migration SHA

```
47dd3e195d77385f0201490c57cd7b016fc373597435ddc94cb2567123d0f314
```

# Focused Verify

PASS

# Mutation Probes

A–L all FAIL_OK → PASS (INVOKER, no-auth, lock-before-auth, tenant, manager, operator, businesses RLS/grant, position/name grants, position override, old migration active)

# TypeScript

`npx tsc --noEmit` PASS

# Diff

Phase: final migration + verify + docs. Runtime app: 0. `git diff --check` PASS.

# Remote Delta

ALL **0**

# Runtime Delta

**0**

# Data Safety

Category/product/order/Storage mutations: **0**

# Next

**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-DB-APPLY-1**

# Release

COMMIT/PUSH/DEPLOY: **PAUSED**
