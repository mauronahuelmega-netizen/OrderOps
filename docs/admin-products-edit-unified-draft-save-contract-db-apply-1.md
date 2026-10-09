# ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-CONTRACT-DB-APPLY-1

# Initial Result

**BLOCK — CUSTOMIZATION LEGACY OVERRIDES LIVE**

(2026-09-15 initial attempt — preserved historically)

Owner manual apply of `save_product_edit_draft` was present and definition-matched.  
Runtime matrices were **not** executed because one live `is_enabled=true` override existed.

---

# Blocker Resolution

Resolved by:

**ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-LEGACY-OVERRIDE-CLEANUP-1 — PASS**

- Deleted exact QA legacy true row `d08a0a85-…`
- Semantic behavior delta: **NONE**
- true rows: 1 → 0

---

# Resume Result

**PASS — RPC LIVE / VALIDATED**

Resume mode: **FROM LEGACY-CENSUS GATE**  
Cursor migration SQL replay: **0**  
Owner manual schema apply: **YES — SQL Editor / before Cursor**

---

# Resume Target Confirmation

| Item | Value |
|------|--------|
| project | OrderOps |
| ref | `pkrsedmwxekbhlohhqds` |
| URL | `https://pkrsedmwxekbhlohhqds.supabase.co` |
| migration SHA | `42b2e206635d0fe3a13ffff7972e8149ae86c909829641a30ca001e500a16631` |
| fingerprint | `6d31d3050a938022242eae9348c52697c46b8528b4f7b3afd08f5f3ff422079a` |
| prosecdef | false (SECURITY INVOKER) |
| ACL | PUBLIC/anon DENY · authenticated ALLOW |

---

# Legacy Census

| Metric | Resume value |
|--------|----------------|
| true | **0** |
| false | **2** |
| invalid shapes | **0** |

---

# Runtime Role Matrix

Executed as `current_user=authenticated` + real JWT `sub`, inside `BEGIN…ROLLBACK`.

| Principal | Result |
|-----------|--------|
| owner (toggled) | **ALLOW** |
| admin | **ALLOW** |
| manager (toggled) | **ALLOW** |
| operator (toggled + real principal) | **DENY** `SAVE_PRODUCT_EDIT_DRAFT_FORBIDDEN` |
| viewer (toggled) | **DENY** `SAVE_PRODUCT_EDIT_DRAFT_FORBIDDEN` |
| super_admin | **ALLOW** (products + overrides path OK — no INVOKER mismatch) |
| foreign tenant admin | **DENY** `SAVE_PRODUCT_EDIT_DRAFT_PRODUCT_NOT_FOUND` |
| anon | **DENY** `42501` permission denied for function |

Post-matrix: product/overrides/profile restored within rollback.

---

# Tenant Isolation

Foreign admin → DENY. No foreign product mutation.

---

# Category Immutability

- No category RPC parameter
- No `SET category_id` in body
- Successful/failed probes: category before == after

---

# Customization Validation

## Valid Group
ALLOW — Agregados false row appeared inside tx (count 1)

## Invalid Group
DENY `SAVE_PRODUCT_EDIT_DRAFT_INVALID_GROUP`

## Valid Option
ALLOW — shape `option|g=null|o=…|en=false`

## Invalid Option
DENY `SAVE_PRODUCT_EDIT_DRAFT_INVALID_OPTION`

## Cross-Tenant
Foreign QA group on tenant product → DENY `INVALID_GROUP`

---

# Atomicity Runtime Proof

## Function Order
validate → legacy guard → delete undesired overrides → insert desired overrides → **UPDATE products**

## Late-Failure Design
Desired groups = Papas + Agregados (INSERT write-capable) then `p_sku=BEB-001` (Coca Cola SKU) → unique violation on UPDATE

## Baseline / Failure / After
- Failure: `23505` `products_business_sku_uidx`
- product before == after: **YES**
- overrides before == after: **YES**
- Agregados insert absent after fail: **0**

## Result
**PASS — late-failure rollback proven**

---

# SKU Regression

- Index live: `products_business_sku_uidx`
- same-business duplicate: **DENY 23505** (isolated probe)
- NULL SKU: **ALLOW**
- self-SKU: **ALLOW**

---

# Stock / Availability Regression

Trigger: `tr_auto_suspend_out_of_stock` enabled (`O`)

| Case | Result |
|------|--------|
| untracked stock=0 request available | avail=true track=false |
| tracked stock=0 request available | avail=false |
| restock + manual unavailable | avail=false stock=10 |
| enable tracking at zero | avail=false |

---

# Image DB Semantics

| Intent | Inside tx |
|--------|-----------|
| KEEP | SAME |
| REMOVE | NULL |
| REPLACE | SET (path with business+product ids) |
| invalid | DENY |
| Storage mutations | **0** |

---

# Canonical Array Semantics

| Case | Result |
|------|--------|
| duplicate ids | 2 unique group rows + 1 option row (no dup blow-up) |
| empty arrays | product overrides → 0 inside tx |
| NULL array | DENY 22023 |
| NULL element | DENY 22023 |

---

# Migration History Reconciliation

## Before
11 entries · unified RPC **ABSENT**

## Mechanism
Supabase MCP `apply_migration` with **history-only** body:
- assert live `to_regprocedure(...)` exists
- **no** CREATE/REPLACE/DROP/GRANT/ALTER
- **no** business DML
- name: `products_edit_unified_draft_save_rpc`

(CLI `migration repair --linked` unavailable — project not linked; MCP apply-with-assert is the established OrderOps history recorder.)

## After
12 entries · remote version `20260915215741_products_edit_unified_draft_save_rpc`  
(tool-assigned timestamp; **name** matches local semantic)

## Collateral
prior 11 entries unchanged · fingerprint/ACL/prosecdef unchanged

---

# Live Function Final Fingerprint

`6d31d3050a938022242eae9348c52697c46b8528b4f7b3afd08f5f3ff422079a`

---

# Migration SHA Final

`42b2e206635d0fe3a13ffff7972e8149ae86c909829641a30ca001e500a16631`  
Local migration file edits: **0**

---

# Data Safety

| Surface | Persistent Cursor delta |
|---------|-------------------------|
| products | 0 |
| overrides | 0 |
| profiles | 0 |
| categories / Storage / orders | 0 |
| schema / RLS / RPC body | 0 |
| migration history | **+1 reconciliation entry only** |

---

# Runtime Application State

**STILL LEGACY MIXED PERSISTENCE**  
Unified editor: **NOT YET IMPLEMENTED**

---

# Verification

author verify: **PASS**  
migration hash: **PASS**  
function fingerprint: **PASS**  
diff: run with docs write

---

# Next

**ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-IMPLEMENTATION-1**

COMMIT/PUSH/DEPLOY: **PAUSED**