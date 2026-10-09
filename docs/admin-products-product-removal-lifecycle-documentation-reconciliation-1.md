# ADMIN-PRODUCTS-PRODUCT-REMOVAL-LIFECYCLE-DOCUMENTATION-RECONCILIATION-1

# Result

**PASS — PRODUCTS LIVING AUDIT RECONCILED TO CERTIFIED LIFECYCLE / RUNTIME UNCHANGED**

# Trigger

Stale CURRENT-state claims in `docs/products-living-audit.md` still presented pre-lifecycle /
pre-RLS-role-enforcement facts as live truth (notably `RUNTIME ABSENT`, “no delete anywhere”,
“no DELETE policy”, incomplete public visibility, `PROD-P1-2` open, status `active|inactive`
only, collapsed mutation invalidation matrix).

# Scope

Documentation-only reconciliation of Living Audit CURRENT sections to certified Product
Lifecycle V1 + Final QA. No runtime/DB/business mutations. No QA replay. No Categories work.

# Authoritative Sources

1. Current repository source (`lib/products/admin.ts`, toolbar, actions, `lib/catalog/public.ts`)
2. `docs/admin-products-product-removal-lifecycle-final-qa-1.md` — **UNCHANGED**
3. `docs/CURRENT_PHASE.md` Final QA block
4. Live DB not required (SHA check only)

# Preflight

| Field | Value |
|-------|-------|
| branch | `main` |
| HEAD | `c9af635e27ad86e0731eea0a90b16b9b628d5aa6` |
| dirty | PRE-EXISTING Products package preserved |
| migration SHA | `5f19d2697f79d2bf17a3388d619a42bc31e32690313362a1cf26400c32628d57` unchanged |

# Reconciliation Method

Forensic grep → classify CURRENT vs HISTORICAL → surgical CURRENT edits + explicit
HISTORICAL / SUPERSEDED labels → consistency re-sweep. Minimal prose; no audit rewrite.

# Stale Current Claims Found

| Claim (as CURRENT) | Classification after |
|--------------------|----------------------|
| RUNTIME ABSENT / implementation not started | HISTORICAL — SUPERSEDED BY IMPLEMENTATION-1 + FINAL-QA-1 |
| status `active \| inactive` only; Activos/Inactivos | CURRENT updated; old wording HISTORICAL |
| Unfiltered catalog count missing | CURRENT: catalog count includes archived |
| Collection “no delete anywhere” | CURRENT: collection NO shortcut / detail YES Eliminar |
| Edit “Is delete available? No” | CURRENT: Archivar/Eliminar / Restaurar/Eliminar |
| Public iff `is_available` + business active | CURRENT adds `archived_at IS NULL` |
| No Storage DELETE policy | HISTORICAL — SUPERSEDED BY IMAGE-LIFECYCLE-DB-APPLY-1 |
| All three mutating actions invalidate identically | CURRENT matrix per action |
| PROD-P1-2 role half open / operator can DELETE | HISTORICAL — PRE RLS ROLE ENFORCEMENT; CURRENT CLOSED |
| Functional matrix Delete ❌ / none | CURRENT Archive / Restore / Permanent Delete rows |

# Runtime Status Reconciliation

Product Lifecycle: **CLOSED** (Archive + Restore + Permanent Delete certified).  
Package: **LOCAL / UNDEPLOYED**. Remaining lifecycle release-blocking debt: **NONE**.

# Status Filter Reconciliation

CURRENT URL + source:

- default → `archived_at IS NULL`
- `active` → non-archived + available
- `inactive` → non-archived + unavailable
- `archived` → `archived_at IS NOT NULL`

Labels: Disponibles / No disponibles / Archivados. Availability ≠ lifecycle.

# Collection / Detail Delete Reconciliation

Collection row/card: **no** Delete shortcut.  
Detail lifecycle: Permanent Delete **yes** (active + archived).  
Raw `/rest/v1/products` DELETE: **denied**. Canonical: RPC.

# Archived Read-Only Reconciliation

Documented CURRENT: banner; fields locked; no Save; availability/image denied; Advanced
inspectable; Restore + Eliminar; server guards.

# Public Visibility Reconciliation

CURRENT: `is_available = true` AND `archived_at IS NULL` AND business active (+ existing
predicates). Preview shares contract — no bypass. Restore ≠ publish.

# Storage Policy Reconciliation

CURRENT: DELETE policy LIVE; post-RPC cleanup; shared refs include archived; Archive/Restore
no Storage mutation. Old “no DELETE policy” labeled HISTORICAL.

# Cache / Invalidation Reconciliation

CURRENT matrix documents create / save draft / availability / archive / restore / permanent
delete / legacy update with distinct admin + public catalog/customization scopes.

# Security / PROD-P1-2 Reconciliation

CURRENT: manage-role RLS LIVE; operator/viewer denied; raw DELETE denied; RPC canonical;
`PROD-P1-2` **CLOSED**. Pre-enforcement privilege-escalation finding preserved as HISTORICAL.

# Functional Capability Matrix Reconciliation

Added Archive / Restore / Permanent Delete rows; removed false “Delete absent” row; filter
row notes archived + labels.

# Current vs Historical Preservation

Historical evidence retained under explicit HISTORICAL / SUPERSEDED / PRE RLS ROLE
ENFORCEMENT labels. Final QA doc untouched.

# Frozen Invariants

Native three-filter `<select>` remains **FROZEN**. Note added: next Categories decision
phase may *decide* a Category-filter exception — **not pre-approved**. Public category
ordering left **UNKNOWN / source-defined**.

# Category Ordering Boundary

Decided now: **NONE**.  
Next: `ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-CONTRACT-DECISION-1`.

# Consistency Sweep

| Phrase | Remaining as CURRENT? |
|--------|------------------------|
| RUNTIME ABSENT | 0 (blockquote HISTORICAL only) |
| no Delete / Is delete available? No | 0 as CURRENT |
| status active\|inactive only | 0 as CURRENT |
| publicly visible incomplete | 0 as CURRENT |
| There is no DELETE policy | 0 as CURRENT |
| RLS role gap open | 0 as CURRENT |
| functional Delete ❌ | 0 |

CURRENT contradictions remaining: **0**

# Runtime Delta = 0

No edits under `app/`, `components/`, `lib/`, `supabase/`, styles, or package files in this phase.

# DB / Data Safety

products/orders/items/stock/customizations/upsells/categories/profiles/Storage/schema/RLS/RPC/history: **0** mutations.

# Documentation Delta

| File | Change |
|------|--------|
| `docs/products-living-audit.md` | CURRENT reconciliations + HISTORICAL labels |
| `docs/CURRENT_PHASE.md` | this phase PASS block |
| `docs/admin-products-product-removal-lifecycle-documentation-reconciliation-1.md` | this doc |
| `ORDEROPS_LIVING_MEMORY.md` | concise milestone |

Final QA doc: **UNCHANGED**.

# Next

**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-CONTRACT-DECISION-1**

# Release

**COMMIT / PUSH / DEPLOY: PAUSED**
