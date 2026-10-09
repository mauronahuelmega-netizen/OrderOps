# Current Phase

## Estado actual

**ADMIN-PRODUCTS-FILTER-MENU-HARD-VISUAL-CLOSEOUT-1
— PASS —
PRODUCT FILTER MENU VISUAL CLOSEOUT COMPLETE /
ONE-TAP HANDOFF CERTIFIED /
FILTER FAMILY FROZEN /
CATEGORY ORDER FINAL QA NEXT — (2026-09-19)**

Doc: `docs/admin-products-filter-menu-hard-visual-closeout-1.md`

Previous simplification phase:
**PASS / PRESERVED**

Filter architecture:
**FROZEN**

Category:
**COMPACT MENU**

Stock:
**COMPACT MENU**

Estado:
**COMPACT MENU**

Trigger geometry:
**FROZEN**

Menu geometry:
**FROZEN**

Selected state:
**FROZEN**

Category menu width:
**FROZEN**

Stock/Estado widths:
**FROZEN**

Ordenar categorías:
**ACTIONABLE / CLEAR / NOT DISABLED-LOOKING**

Trailing action:
**TEXT ONLY**

Trailing action height:
**44–48px / TOUCH SAFE**

Separator:
**PRESERVED**

Popup edge definition:
**POLISHED**

Menu motion:
**UNCHANGED**

Handoff:
**6/6 ONE-TAP PASS**

Category→Order:
**ONE-TAP PASS**

Search first tap:
**PASS**

Rapid handoff:
**PASS**

Reduced motion:
**PASS** (no wait-for-exit dependency)

Filter URL semantics:
**UNCHANGED**

Category Order runtime:
**UNCHANGED**

Real Category Save:
**0**

DB/RLS/RPC:
**UNCHANGED**

Business mutations:
**0**

Storage:
**0**

360 / 390 / 412 / short / 768 / 899 / 900 / 1024:
**PASS** (412+899/900 hard-measured; others CSS-contract)

Light / Dark:
**PASS**

overflowX:
**0**

focused verify:
**PASS**

probes:
**PASS**

tsc:
**PASS**

build:
**PASS**

diff:
**PASS**

Next:
**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-FINAL-QA-1**

COMMIT/PUSH/DEPLOY:
**PAUSED**

---

## Previous

**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-FILTER-HANDOFF-AND-REORDER-SIMPLIFICATION-1
— PASS —
PRODUCT FILTER HANDOFF +
CATEGORY FILTER UNITY CLOSED /
REORDER INPUT SIMPLIFIED TO MOVE CONTROLS /
ATOMIC SAVE CONTRACT PRESERVED /
FINAL QA NEXT — (2026-09-19)**

Doc: `docs/admin-categories-public-catalog-order-filter-handoff-and-reorder-simplification-1.md`

Previous Motion/Filter Unity:
**PASS / HISTORICALLY PRESERVED / INTERACTION PARTIALLY SUPERSEDED**

DB:
**LIVE / CERTIFIED / UNCHANGED**

Filter URL semantics:
**UNCHANGED**

Category filter:
**COMPACT MENU**

Stock:
**COMPACT MENU**

Estado:
**COMPACT MENU**

Logical filter-open owner:
**SINGLE / TOOLBAR**

Cross-filter handoff:
**ONE TAP**

Sequential wait-for-close:
**NONE**

Category filter backdrop:
**NONE**

Category menu:
**Todas + categories + separated Ordenar categorías**

Category Order:
**DEDICATED ORDER-ONLY DIALOG**

Historical shared Filter+Order dialog:
**SUPERSEDED**

Grip:
**REMOVED**

Pointer drag reorder:
**REMOVED**

Historical drag contract:
**SUPERSEDED**

Subir/Bajar:
**CANONICAL REORDER INPUT**

Reflow motion:
**PRESERVED / MOVE-CONTROL DRIVEN**

Helper:
**Usá las flechas para definir el orden del catálogo.**

Cancel:
**DISCARD + CLOSE**

Escape:
**DISCARD + CLOSE**

Draft:
**LOCAL / UNCHANGED**

Dirty:
**SEMANTIC / UNCHANGED**

Save:
**ONE ACTION → ONE RPC / UNCHANGED**

Real Save this phase:
**0**

DB/RLS/RPC:
**UNCHANGED**

Business mutations:
**0**

Storage:
**0**

focused verify:
**PASS**

probes:
**PASS**

tsc:
**PASS**

build:
**PASS**

diff:
**PASS**

Next:
**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-FINAL-QA-1**

COMMIT/PUSH/DEPLOY:
**PAUSED**

---

## Previous

**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-MOTION-AND-FILTER-UNITY-POLISH-1 — PASS — CATEGORY REORDER MOTION + PRODUCTS FILTER FAMILY UNIFIED / FILTER SEMANTICS PRESERVED / FINAL QA NEXT — (2026-09-17)**

Doc: `docs/admin-categories-public-catalog-order-motion-and-filter-unity-polish-1.md`

Previous visual polish:
**PASS / PRESERVED**

Category DB:
**LIVE / CERTIFIED / UNCHANGED**

Category functional runtime:
**IMPLEMENTED / UNCHANGED**

Category trigger:
**CUSTOM / PRESERVED**

Stock:
**CUSTOM SIMPLE FILTER MENU / IMPLEMENTED**

Estado:
**CUSTOM SIMPLE FILTER MENU / IMPLEMENTED**

Historical native Stock/Estado presentation freeze:
**SUPERSEDED BY OWNER AUTHORIZATION**

Stock / Estado semantics:
**UNCHANGED**

Filter URL authority:
**PRESERVED**

Client-side product filtering:
**NONE**

Simple menu:
**NO DIALOG / NO FOOTER / NO SAVE**

Menu motion:
**PREMIUM / SUBTLE**

Category reorder pressed / dragging / FLIP reflow / settle / keyboard motion:
**IMPLEMENTED** *(drag/grip later SUPERSEDED by FILTER-HANDOFF-AND-REORDER-SIMPLIFICATION-1)*

Reduced motion:
**PASS**

Real Category Save:
**0**

Action / RPC / DB / RLS delta:
**0**

Business / Storage mutations:
**0**

tsc / build / diff / focused verify / probes:
**PASS**

Next:
**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-FINAL-QA-1** *(superseded next by FILTER-HANDOFF phase)*

COMMIT/PUSH/DEPLOY:
**PAUSED**

---

## Previous

**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-PRE-FINAL-QA-VISUAL-POLISH-1 — PASS — CATEGORY ORDER DIALOG VISUAL HIERARCHY + INTERACTION AFFORDANCE POLISHED / FUNCTIONAL CONTRACT UNCHANGED / FINAL QA NEXT — (2026-09-17)**

Doc: `docs/admin-categories-public-catalog-order-pre-final-qa-visual-polish-1.md`

Implementation:
**PASS / PRESERVED**

DB:
**LIVE / CERTIFIED / UNCHANGED**

Toolbar Category trigger:
**PRESERVED**

Filter mode:
**PRESERVED / PASS**

Order mode:
**VISUALLY POLISHED**

Grip:
**PREMIUM / DISCOVERABLE / ≥44** (icon 18px)

Move controls:
**POLISHED / ≥44 / KEYBOARD PRESERVED** (icon 18px)

Pristine Save:
**SEMANTICALLY DISABLED / VISUALLY CLEAR**

Dirty Save:
**ACTIVE PRIMARY / CLEAR**

Revert:
**DISABLED AGAIN**

Drag state:
**POLISHED**

Focus-visible:
**PASS**

Rows:
**≥48** (measured ~55)

Light:
**PASS**

Dark:
**PASS**

360 / 390 / 412 / 899 / short / desktop:
**PASS**

Horizontal overflow:
**0**

Functional contract delta:
**0**

Action / RPC delta:
**0**

DB / RLS delta:
**0**

Business mutations:
**0**

Storage mutations:
**0**

Focused verify / probes:
**PASS**

tsc / build / diff:
**PASS**

Next:
**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-FINAL-QA-1**

COMMIT/PUSH/DEPLOY:
**PAUSED**

---

## Previous

**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-IMPLEMENTATION-1 — PASS — CATEGORY FILTER + ORDER RUNTIME IMPLEMENTED / ATOMIC SAVE WIRED / FINAL QA REQUIRED — (2026-09-17)**

Doc: `docs/admin-categories-public-catalog-order-implementation-1.md`

DB:
**LIVE / CERTIFIED / UNCHANGED**

Migration:
`20260917210150_categories_public_catalog_order.sql`

SHA:
`47dd3e195d77385f0201490c57cd7b016fc373597435ddc94cb2567123d0f314`

Append fingerprint:
`7b240c4c66b10d8b97ac46dea4ceef57a3ab013c4975e47236af9b1395ab5514`

RPC fingerprint:
`e82ba8ce34d263743aa7e2ad4ad09336a70ae5e592d0ed24bb12e68346cff8a3`

Category filter:
**CUSTOM DIALOG / IMPLEMENTED**

Stock:
**NATIVE SELECT / PRESERVED**

Estado:
**NATIVE SELECT / PRESERVED**

Dialog:
**ONE NATIVE DIALOG / FILTER + ORDER**

Order rows:
**ALL TENANT CATEGORIES**

Pointer:
**GRIP ONLY** (Pointer Events)

Touch:
**SUPPORTED**

Keyboard:
**SUBIR / BAJAR**

Draft:
**LOCAL**

Dirty:
**SEMANTIC ID SEQUENCE**

Autosave:
**NO**

Save:
**EXPLICIT**

Action:
`saveCategoryDisplayOrderAction`

Action authority:
**manageProducts**

Client business_id:
**NONE**

Client numeric positions:
**NONE**

RPC:
`save_category_display_order(uuid[])`

RPC calls per Save:
**1**

Raw position update:
**0**

Cancel:
**DISCARD / 0 WRITES**

Escape Order:
**DISCARD → FILTER / 0 WRITES**

Success copy:
**Orden de categorías guardado.**

Stale-set:
**SAFE ERROR / DRAFT PRESERVED**

Cache:
admin products + admin categories + public catalog

Root "/" invalidation:
**NONE**

Create category position payload:
**ABSENT**

/admin/categories DnD:
**NOT IMPLEMENTED / OUT OF SCOPE**

Product order:
**UNCHANGED**

Runtime source:
**IMPLEMENTED**

DB/RLS/RPC:
**UNCHANGED**

Business mutations during implementation:
**0**

Focused verify / probes:
**PASS**

Related verifies:
**PASS**

tsc / build / diff:
**PASS**

Next:
**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-FINAL-QA-1**

COMMIT/PUSH/DEPLOY:
**PAUSED**

---

## Predecessor (historical)

**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-DB-APPLY-DOCUMENTATION-RECONCILIATION-1 — PASS — CATEGORY ORDER DB DOCUMENTATION RECONCILED / LIVE CONTRACT PRESERVED / RUNTIME IMPLEMENTATION NEXT — (2026-09-17)**

Doc: `docs/admin-categories-public-catalog-order-db-apply-documentation-reconciliation-1.md`

DB APPLY:
**PASS / PRESERVED**

Final migration:
`20260917210150_categories_public_catalog_order.sql`

SHA:
`47dd3e195d77385f0201490c57cd7b016fc373597435ddc94cb2567123d0f314`

Remote:
`20260917212712` / `categories_public_catalog_order`

DB / RLS / RPC:
**UNCHANGED**

Runtime:
**UNCHANGED** (Category Order UI **NOT IMPLEMENTED**)

Business mutations:
**0**

Documentation-only:
**YES** — reconciled Living Audit §17 stale “AUTHORED / NOT APPLIED” + wrong Next DB-APPLY-1

Next:
**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-IMPLEMENTATION-1**

COMMIT/PUSH/DEPLOY:
**PAUSED**

---

## Predecessor (historical)

**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-DB-APPLY-1 — PASS — CATEGORY ORDER DB LIVE / FINAL AUTHORITY MODEL + ATOMIC REORDER CERTIFIED / RUNTIME IMPLEMENTATION REQUIRED — (2026-09-17)**

Doc: `docs/admin-categories-public-catalog-order-db-apply-1.md`

Decision:
**PASS / PRESERVED**

APPLY #1:
**BLOCKED CORRECTLY / POSITION_AUTHORITY_BYPASS**

APPLY #2:
**BLOCKED CORRECTLY / APPEND_LOCK_AUTHORITY_FAIL**

APPLY #3:
**PASS**

Historical migration #1:
**REMOTE HISTORY 0**

Historical migration #2:
**REMOTE HISTORY 0**

Applied migration:
`20260917210150_categories_public_catalog_order.sql`

SHA pre/post:
`47dd3e195d77385f0201490c57cd7b016fc373597435ddc94cb2567123d0f314`

Remote history:
`20260917212712` / `categories_public_catalog_order`

Migration apply count:
**1**

Collateral migrations:
**0**

Backfill ambiguity:
**0**

Backfill sequence delta:
**0**

Visible category order delta:
**0**

`categories.position`:
**NOT NULL / LIVE**

positions:
**CONTIGUOUS**

unique:
**DEFERRABLE / LIVE**

Append:
**SECURITY DEFINER / LIVE**

Append fingerprint:
`7b240c4c66b10d8b97ac46dea4ceef57a3ab013c4975e47236af9b1395ab5514`

Append auth:
**UID → PROFILE → ROLE → TENANT → LOCK**

Businesses RLS/grants:
**UNCHANGED**

Old Create without position:
**PASS**

Client INSERT position:
**OVERRIDDEN**

authenticated table UPDATE:
**DENY**

authenticated UPDATE(name):
**ALLOW**

authenticated UPDATE(position):
**DENY**

anon UPDATE:
**DENY**

Reorder RPC:
**LIVE / VALIDATED**

RPC fingerprint:
`e82ba8ce34d263743aa7e2ad4ad09336a70ae5e592d0ed24bb12e68346cff8a3`

RPC no-op / swap / stale set:
**PASS**

RPC duplicate/null/foreign:
**DENY / VALIDATED**

super_admin semantics:
**PROVEN CONSISTENT** (contract/source `business_id NULL`; live 1/null)

super_admin reorder:
**RUNTIME PASS**

Category RLS:
**MANAGE-PRODUCTS ROLE ENFORCEMENT LIVE**

owner/admin:
**ALLOW** (runtime)

manager:
**CONTRACT PASS** (no live identity)

super_admin:
**ALLOW** (runtime)

operator/viewer/foreign/anon:
**DENY**

Public catalog:
**ORDER UNCHANGED**

Product order:
**UNCHANGED**

Intended persistent business delta:
**CATEGORIES.POSITION NORMALIZATION ONLY**

QA residue:
**0**

Products/orders/Storage collateral:
**0**

Runtime Category Order UI:
**NOT IMPLEMENTED**

Runtime feature source delta:
**0**

focused verify / tsc / diff:
**PASS**

Next:
**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-IMPLEMENTATION-1**

COMMIT/PUSH/DEPLOY:
**PAUSED**

---

## Predecessor (historical)

**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-DB-AUTHOR-APPEND-LOCK-AUTHORITY-FIX-1 — PASS — CATEGORY APPEND LOCK AUTHORITY CLOSED / FINAL CORRECTED DB MIGRATION AUTHORED / REMOTE APPLY REQUIRED — (2026-09-17)**

Doc: `docs/admin-categories-public-catalog-order-db-author-append-lock-authority-fix-1.md`

Final migration authored (then applied in APPLY #3):
`20260917210150_categories_public_catalog_order.sql`

SHA:
`47dd3e195d77385f0201490c57cd7b016fc373597435ddc94cb2567123d0f314`

---

## Predecessor (historical)

**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-DB-APPLY-1 — BLOCKED — CATEGORY_ORDER_DB_APPLY_APPEND_LOCK_AUTHORITY_FAIL — (2026-09-17)**

Doc: `docs/admin-categories-public-catalog-order-db-apply-1.md`

Attempt history:
1. BLOCKED — POSITION_AUTHORITY_BYPASS (correct stop; remote delta 0)
2. BLOCKED — APPEND_LOCK_AUTHORITY_FAIL (correct stop; remote delta 0)

Decision:
**PASS / PRESERVED**

Corrected migration:
`20260917202554_categories_public_catalog_order.sql`

Corrected SHA:
`18ef63079eca6afaf6b5d44013df13e0742f7810cd597f590236002aaf4dd8cf` (pre=post; not applied)

Superseded migration remote history:
**0**

Pre-apply gates PASSED:
- target / chain / SHA / history / schema / ambiguity 0 / backfill delta 0
- position authority closed in corrected SQL

Pre-apply gate FAILED:
**APPEND LOCK AUTHORITY**

Evidence:
- append trigger = SECURITY INVOKER + `businesses … FOR UPDATE`
- PostgreSQL requires UPDATE privilege for FOR UPDATE (**authenticated has it**)
- RLS also applies UPDATE policies on FOR UPDATE
- `businesses_update_own_business` allows **`role = 'admin'` only**
- owner / manager / super_admin (manageProducts Category creators) **cannot** lock businesses → Create would break

Apply:
**NOT EXECUTED**

Remote delta:
**0**

Runtime Category order UI:
**NOT IMPLEMENTED**

Runtime source delta:
**0**

Business mutations:
**0**

Next:
**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-DB-AUTHOR-APPEND-LOCK-AUTHORITY-FIX-1**

COMMIT/PUSH/DEPLOY:
**PAUSED**

---

## Predecessor (historical)

**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-DB-AUTHOR-POSITION-AUTHORITY-FIX-1 — PASS — CATEGORY POSITION WRITE AUTHORITY CLOSED / CORRECTED DB MIGRATION AUTHORED / REMOTE APPLY REQUIRED — (2026-09-17)**

Doc: `docs/admin-categories-public-catalog-order-db-author-position-authority-fix-1.md`

Blocked APPLY:
**PRESERVED / CORRECTLY STOPPED** (`CATEGORY_ORDER_DB_APPLY_POSITION_AUTHORITY_BYPASS`)

Previous migration:
**SUPERSEDED BEFORE APPLY**

Previous migration:
`20260917182047_categories_public_catalog_order.sql`

Previous SHA:
`4bb35bec9da5981d0c58a1f9658cf8408d09b2286d44a2ec27ed1f90e0ece9e8`

Previous remote history:
**0**

Corrected migration:
`supabase/migrations/20260917202554_categories_public_catalog_order.sql`

Corrected SHA:
`18ef63079eca6afaf6b5d44013df13e0742f7810cd597f590236002aaf4dd8cf`

Active category-order migrations:
**1**

Position model:
**categories.position**

Authenticated table-wide UPDATE:
**REVOKED IN CORRECTED CONTRACT**

Authenticated UPDATE(name):
**GRANTED**

Authenticated UPDATE(position):
**DENIED**

Authenticated UPDATE(business_id/id/created_at):
**DENIED**

Anon UPDATE:
**DENIED**

Insert:
**PRESERVED**

Delete:
**PRESERVED SUBJECT TO RLS**

Category rename:
**PRESERVED**

Create without position:
**PRESERVED**

Append trigger:
**PRESERVED**

RPC:
**save_category_display_order(uuid[])** — PRESERVED / CANONICAL NUMERIC UPDATE WRITER

RPC SECURITY:
**DEFINER / HARDENED**

RLS manageProducts:
**PRESERVED**

Backfill ambiguity:
**0**

Backfill simulated delta:
**0**

Remote apply:
**NO**

Remote delta:
**0**

Business mutations:
**0**

Runtime UI:
**NOT IMPLEMENTED**

Runtime source delta:
**0**

focused verify:
**PASS**

mutation probes:
**PASS**

tsc:
**PASS**

diff:
**PASS**

Next:
**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-DB-APPLY-1**

COMMIT/PUSH/DEPLOY:
**PAUSED**

---

## Predecessor (historical)

**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-DB-APPLY-1 — BLOCKED — CATEGORY_ORDER_DB_APPLY_POSITION_AUTHORITY_BYPASS — (2026-09-17)**

Doc: `docs/admin-categories-public-catalog-order-db-apply-1.md`

Decision:
**PASS / PRESERVED**

DB Author:
**PASS / NOT APPLIED** (apply stopped at pre-apply gate)

Migration:
`20260917182047_categories_public_catalog_order.sql`

Local SHA:
`4bb35bec9da5981d0c58a1f9658cf8408d09b2286d44a2ec27ed1f90e0ece9e8` (pre=post; file frozen)

Remote history:
**unchanged — migration NOT APPLIED**

Collateral migrations:
**0**

Pre-apply gates that PASSED:
- target OrderOps `pkrsedmwxekbhlohhqds`
- migration SHA exact
- history absent
- schema baseline match
- ambiguity groups **0**
- backfill sequence delta **0**
- no object collision

Pre-apply gate that FAILED:
**POSITION AUTHORITY BYPASS**

Evidence:
- live: `authenticated` has column UPDATE on `categories.position`
- authored migration: role-gates row UPDATE but does **not** revoke/guard numeric `position`
- post-apply manageProducts client could raw `UPDATE … SET position = …` outside RPC

Apply:
**NOT EXECUTED**

Remote delta:
**0**

Runtime Category ordering UI:
**NOT IMPLEMENTED**

Runtime source delta:
**0**

Business mutations:
**0**

Next:
**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-DB-AUTHOR-POSITION-AUTHORITY-FIX-1**

COMMIT/PUSH/DEPLOY:
**PAUSED**

---

## Predecessor (historical)

**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-DB-AUTHOR-1 — PASS — CATEGORY ORDER DB CONTRACT AUTHORED / REMOTE APPLY REQUIRED — (2026-09-17)**

Doc: `docs/admin-categories-public-catalog-order-db-author-1.md`

Decision:
**PASS / PRESERVED**

Existing field:
**categories.position**

Current order:
**PROVEN** (`position ASC NULLS LAST, name ASC`)

Ambiguous current order keys:
**0**

Backfill simulation delta:
**0**

Backfill:
**AUTHORED / PRESERVES CURRENT ORDER**

Position:
**BACKFILL → NOT NULL**

Position semantics:
**CONTIGUOUS 0..n-1**

Unique:
**(business_id, position)** DEFERRABLE INITIALLY IMMEDIATE

Swap safety:
**DEFERRABLE / PROVEN IN AUTHOR VERIFY**

New category append:
**DB-SIDE / BEFORE INSERT / CONCURRENCY-SAFE** (`tr_categories_assign_append_position`)

Old deployed Create compatibility:
**PRESERVED**

RPC:
**save_category_display_order(uuid[])**

RPC security:
**SECURITY DEFINER / HARDENED** (`search_path = ''`)

RPC tenant:
**SERVER-DERIVED**

RPC set:
**EXACT TENANT SET**

RPC writes:
**ATOMIC**

RLS categories:
**MANAGE-PRODUCTS ROLE ENFORCEMENT AUTHORED**

operator/viewer:
**TARGET DENY AFTER APPLY**

Migration:
`supabase/migrations/20260917182047_categories_public_catalog_order.sql`

SHA256:
`4bb35bec9da5981d0c58a1f9658cf8408d09b2286d44a2ec27ed1f90e0ece9e8`

Remote apply:
**NO**

Runtime application:
**NOT IMPLEMENTED**

Runtime source delta:
**0**

Business mutations:
**0**

tsc:
**PASS**

focused verify:
**PASS**

mutation probes:
**PASS**

diff:
**PASS**

Next:
**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-DB-APPLY-1**

COMMIT/PUSH/DEPLOY:
**PAUSED**

---

## Predecessor (historical)

**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-CONTRACT-DECISION-1 — PASS — PUBLIC CATEGORY ORDERING V1 CONTRACT APPROVED / IMPLEMENTATION NOT STARTED — (2026-09-17)**

Doc: `docs/admin-categories-public-catalog-order-contract-decision-1.md`

Current public order (PROVEN):
`categories.position ASC NULLS LAST, name ASC` (not pure alphabetical; not first-product)

Persistence:
**EXISTING `categories.position`** (activate writes; no new column)

Backfill:
**PRESERVES CURRENT VISIBLE ORDER** (rank by current ORDER BY → contiguous 0..n-1)

New category:
**APPEND**

Admin entry:
**PRODUCTS CATEGORY FILTER**

Native filter exception:
**CATEGORY ONLY / APPROVED** (Stock + Estado remain native `<select>`)

Filter / Order modes:
**ONE dialog · TWO explicit modes**

Drag:
**GripVertical** (grip-only)

Keyboard:
**Move up/down** (parity; no pointer-only)

Desktop / Mobile:
**Native `<dialog>`** (shared)

Draft / Save:
**LOCAL draft · EXPLICIT · ATOMIC RPC**

Public / Admin / Create:
**USE merchant category order**

Product ordering:
**UNCHANGED / OUT OF SCOPE**

Category CRUD / navigation:
**UNCHANGED**

Schema / runtime this phase:
**UNCHANGED**

Business mutations:
**0**

Next:
**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-DB-AUTHOR-1**

COMMIT/PUSH/DEPLOY:
**PAUSED**

---

## Predecessor (historical)

**ADMIN-PRODUCTS-PRODUCT-REMOVAL-LIFECYCLE-DOCUMENTATION-RECONCILIATION-1 — PASS — PRODUCTS LIVING AUDIT RECONCILED TO CERTIFIED LIFECYCLE / RUNTIME UNCHANGED — (2026-09-17)**

Doc: `docs/admin-products-product-removal-lifecycle-documentation-reconciliation-1.md`

Lifecycle Final QA:
**PASS / PRESERVED**

Product Lifecycle:
**CLOSED**

Living Audit:
**CURRENT-STATE CONTRADICTIONS RECONCILED**

Historical evidence:
**PRESERVED / LABELED**

Runtime source edits:
**0**

DB / RLS / RPC / Storage:
**UNCHANGED**

Business mutations:
**0**

QA replay:
**NOT RUN / NOT REQUIRED**

git diff --check:
**PASS** (docs phase)

Next:
**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-CONTRACT-DECISION-1**

COMMIT/PUSH/DEPLOY:
**PAUSED**

---

## Predecessor (historical)

**ADMIN-PRODUCTS-PRODUCT-REMOVAL-LIFECYCLE-FINAL-QA-1 — PASS — PRODUCT LIFECYCLE CERTIFIED END-TO-END / ARCHIVE + RESTORE + PERMANENT DELETE CLOSED — (2026-09-17)**

Doc: `docs/admin-products-product-removal-lifecycle-final-qa-1.md`

Lifecycle DB:
**LIVE / VALIDATED / UNCHANGED**

Application:
**CERTIFIED**

Visual/copy polish:
**CERTIFIED**

Archive / Archived recovery / Archived read-only / Restore:
**E2E PASS**

Permanent Delete active / archived:
**E2E PASS**

Dirty lifecycle / Archived server guards:
**E2E PASS**

Public / Manual order / Customization targeting:
**PASS**

Historical orders:
**PRESERVED** (DB-APPLY baseline; fresh disposable order not re-run)

Image single-owner / shared active / shared archived:
**PASS**

Storage failure semantics:
**SOURCE CONTRACT PASS** (runtime injection not performed)

Raw table Delete:
**ABSENT / DENIED**

RPC:
**CANONICAL / UNCHANGED** (`81f2046de539d43db38aa583574d5486`)

Migration SHA:
**UNCHANGED** (`5f19d2697f79d2bf17a3388d619a42bc31e32690313362a1cf26400c32628d57`)

Responsive 360 / 390 / 412 / 899 / 900 / desktop + short viewport:
**PASS**

Light / Dark / Keyboard / Focus / Escape / Network duplicate safety:
**PASS**

Create / Unified Edit / Advanced / Builder:
**UNCHANGED**

QA fixture residue / QA Storage residue / Existing merchant mutations:
**0**

Schema / RLS / RPC / Migration history changes:
**0**

P0 / P1 / release-blocking P2:
**0**

tsc / build / diff:
**PASS**

Next:
**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-CONTRACT-DECISION-1**

COMMIT/PUSH/DEPLOY:
**PAUSED** — Products package **LOCAL / UNDEPLOYED**

---

## Predecessor (historical)

**ADMIN-PRODUCTS-PRODUCT-REMOVAL-LIFECYCLE-PRE-FINAL-QA-VISUAL-COPY-POLISH-1 — PASS — LIFECYCLE ACTION HIERARCHY + CONFIRMATION COPY POLISHED / FUNCTIONAL CONTRACT UNCHANGED — (2026-09-16)**

Doc: `docs/admin-products-product-removal-lifecycle-pre-final-qa-visual-copy-polish-1.md`

---

## Predecessor (historical)

**ADMIN-PRODUCTS-PRODUCT-REMOVAL-LIFECYCLE-IMPLEMENTATION-1 — PASS — PRODUCT LIFECYCLE APPLICATION RUNTIME IMPLEMENTED / FINAL QA REQUIRED — (2026-09-16)**

Doc: `docs/admin-products-product-removal-lifecycle-implementation-1.md`

DB lifecycle:
**LIVE / VALIDATED / UNCHANGED**

Migration SHA:
`5f19d2697f79d2bf17a3388d619a42bc31e32690313362a1cf26400c32628d57`

RPC fingerprint:
**UNCHANGED** (`81f2046de539d43db38aa583574d5486`)

Application:

- Default archived filtering: **IMPLEMENTED**
- Archivados filter: **IMPLEMENTED**
- Catalog existence includes archived: **IMPLEMENTED**
- Archive / Restore / Permanent Delete: **IMPLEMENTED**
- Archived read-only: **IMPLEMENTED**
- Dirty draft lifecycle guard: **IMPLEMENTED**
- Direct products DELETE: **ABSENT**
- RPC delete: **CANONICAL**
- Post-commit image cleanup: **IMPLEMENTED**
- Shared-reference guard incl. archived: **IMPLEMENTED**
- Storage failure: **NO DB RESURRECTION**
- Public / manual / customization filters: **IMPLEMENTED**
- Create / Unified Edit / Advanced: **PRESERVED**
- Builder: **PRESERVED** except target eligibility

Runtime QA:
**SOURCE + VERIFY PASS** — disposable browser matrix **DEFERRED → FINAL-QA-1**

Persistent business delta:
**0**

Schema/RLS/RPC/history mutations:
**0**

tsc / build / focused verify / related verifies / diff:
**PASS**

Next:
**ADMIN-PRODUCTS-PRODUCT-REMOVAL-LIFECYCLE-FINAL-QA-1** (after visual polish)

COMMIT/PUSH/DEPLOY:
**PAUSED**

---

## Predecessor (historical)

**ADMIN-PRODUCTS-PRODUCT-REMOVAL-LIFECYCLE-DB-APPLY-1 — PASS — PRODUCT LIFECYCLE DB LIVE / PERMANENT DELETE RPC VALIDATED — (2026-09-16)**

Doc: `docs/admin-products-product-removal-lifecycle-db-apply-1.md`

Corrected Product Removal contract:
**PASS**

V1:
**ARCHIVE + RESTORE + PERMANENT DELETE**

Migration:
`20260916180000_products_removal_lifecycle.sql`

Frozen SHA:
`5f19d2697f79d2bf17a3388d619a42bc31e32690313362a1cf26400c32628d57`

Remote apply:
**YES**

Remote history:
`20260916195024_products_removal_lifecycle`

Collateral migrations:
**0**

archived_at:
**LIVE**

archive⇒unavailable:
**LIVE / VALIDATED**

active-list index:
**LIVE**

public archived:
**DENIED**

admin archived:
**READABLE**

raw authenticated DELETE:
**DENIED / RUNTIME PROVEN**

RPC:
`public.delete_product_permanently(uuid)`

SECURITY DEFINER:
**LIVE / VALIDATED**

search_path:
**HARDENED** (`''`)

PUBLIC:
**DENY**

anon:
**DENY**

authenticated:
**EXECUTE + INTERNAL AUTHORITY**

owner/admin/manager:
**RUNTIME ALLOW** (RPC)

operator/viewer:
**RUNTIME DENY**

foreign tenant:
**DENY / NON-LEAK**

row lock:
**LIVE**

active permanent delete:
**PASS**

archived permanent delete:
**PASS**

historical orders:
**PRESERVED**

order_items:
**PRESERVED / product_id NULL**

snapshots:
**UNCHANGED**

stock movements target:
**REMOVED**

customization overrides:
**REMOVED**

product assignments:
**REMOVED**

upsell relations:
**RECONCILED**

shared definitions:
**PRESERVED**

category:
**PRESERVED**

SKU archived:
**RESERVED / RUNTIME**

SKU deleted:
**FREE / RUNTIME**

image:
**HANDOFF PASS / STORAGE UNTOUCHED**

duplicate delete:
**SAFE**

RPC rollback:
**PROVEN**

cancel after delete:
**PASS**

deleted-product restock:
**0**

surviving-product restock:
**PASS** (mixed-order)

persistent QA business delta:
**0**

Storage mutations:
**0**

migration file pre/post SHA:
**IDENTICAL**

runtime implementation:
**NOT STARTED**

Next:
**ADMIN-PRODUCTS-PRODUCT-REMOVAL-LIFECYCLE-IMPLEMENTATION-1**

COMMIT/PUSH/DEPLOY:
**PAUSED**

COMMIT/PUSH/DEPLOY:
**PAUSED**

---

## Prior phase (superseded — preserved)

**ADMIN-PRODUCTS-PRODUCT-REMOVAL-ARCHIVE-DB-AUTHOR-1 — HISTORICAL TECHNICAL PASS / SUPERSEDED BEFORE APPLY — (2026-09-16)**

Doc: `docs/admin-products-product-removal-archive-db-author-1.md`

Migration path:
`supabase/migrations/20260916180000_products_archive_lifecycle.sql`

SHA256:
`55f187f5b4362723ba1e4e3659a90769cc75d57ea61b615f79d2505e89db88bb`

Remote apply:
**0 — DO NOT APPLY STANDALONE**

Reason superseded:
archive foundation only; corrected contract requires transactional permanent-delete RPC + relation cleanup.

---

## Prior phase (superseded — preserved)

**ADMIN-PRODUCTS-PRODUCT-REMOVAL-CONTRACT-DECISION-1 — HISTORICAL PASS / SUPERSEDED BY OWNER CLARIFICATION — (2026-09-16)**

Doc: `docs/admin-products-product-removal-contract-decision-1.md`

Product removal (old selected):
**SOFT ARCHIVE + RESTORE** (hard delete deferred — **SUPERSEDED**)

Forensic evidence:
**PRESERVED**

---

## Prior phase (preserved)

**ADMIN-PRODUCTS-EDIT-ADVANCED-ACCORDION-MOTION-POLISH-1 — PASS — ADVANCED ACCORDION MOTION CLOSED / FINAL FROZEN — (2026-09-16)**

Doc: `docs/admin-products-edit-advanced-accordion-motion-polish-1.md`

Previous Premium Visual Closeout:
**PASS / STATIC BASELINE PRESERVED**

Freeze exception:
**MOTION ONLY**

Static visual design:
**UNCHANGED / PIXEL-EQUIVALENT AT REST**

Advanced open motion:
**PASS**

Advanced close motion:
**PASS**

Group open motion:
**PASS**

Group close motion:
**PASS**

Chevron:
**SYNCHRONIZED**

Per-option stagger:
**NONE**

Reduced motion:
**PASS / INSTANT**

Closed hidden content:
**NOT ACTIONABLE**

Keyboard:
**PASS**

One-group-open:
**PRESERVED**

Rapid toggle:
**PASS**

Parent-hidden semantics:
**UNCHANGED**

Draft / Dirty / Save / Loading / Empty / Sticky / Footer / Create / Builder:
**UNCHANGED**

Network mutations:
**0**

Business mutations:
**0**

DB/RPC/RLS:
**UNCHANGED**

360 / 390 / 390 short / 412 / desktop / light / dark / prefers-reduced-motion:
**PASS**

Focused verify / Related verifies / Mutation probes / tsc / build / diff:
**PASS**

P0 / P1 / release-blocking P2 introduced:
**0**

Advanced remaining motion/visual debt:
**NONE**

Global disabled primary CTA token:
**SEPARATE OPTIONAL DESIGN-SYSTEM FOLLOW-UP**

Next:
**PRODUCT REMOVAL DECISION** or **RELEASE SEQUENCING**

COMMIT/PUSH/DEPLOY:
**PAUSED**

---

## Prior phase (preserved)

**ADMIN-PRODUCTS-EDIT-ADVANCED-PREMIUM-VISUAL-CLOSEOUT-1 — PASS — EDIT ADVANCED FINAL VISUAL CLOSED / FROZEN — (2026-09-16)**

Doc: `docs/admin-products-edit-advanced-premium-visual-closeout-1.md`

Functional unified editor:
**CERTIFIED / UNCHANGED**

Advanced loading:
**FINAL**

Advanced empty-valid:
**STABLE STRUCTURAL SHELL** (`Sin ajustes`)

Advanced / Groups / Options:
**LEVEL 1–3 / FINAL**

Expanded group header:
**CONTINUOUS SURFACE** (Eye seam 0)

Active / disabled Eye:
**CLEARLY DISTINCT / LEGIBLE**

Text contrast:
**AA INFORMATIONAL**

Long-content 360:
**PASS**

Loading→ready / loading→empty:
**0 SHIFT**

Sticky / Footer:
**UNCHANGED / PASS**

360 / 390 / 390 short / 412 / 899 / 961+ / desktop / light / dark:
**PASS**

Create / Builder / DB/RPC/RLS:
**UNCHANGED**

Business mutations:
**0**

Focused + related verifies / probes / tsc / build / diff:
**PASS**

lint:
**NOT RUN — KNOWN TOOLING DEBT**

P0 / P1 / release-blocking P2:
**0**

Remaining Advanced visual debt:
**NONE**

Global disabled primary CTA token:
**SEPARATE OPTIONAL DESIGN-SYSTEM FOLLOW-UP**

Next:
**PRODUCT REMOVAL DECISION** or **RELEASE SEQUENCING**

COMMIT/PUSH/DEPLOY:
**PAUSED**

---

## Previous (historical)

**ADMIN-PRODUCTS-EDIT-ADVANCED-LOADING-STATE-FOOTER-RHYTHM-POLISH-1 — PASS — ADVANCED LOADING SHELL / FOOTER RHYTHM CLOSED — (2026-09-16)**

Doc: `docs/admin-products-edit-advanced-loading-state-footer-rhythm-polish-1.md`

Unified functional contract:
**UNCHANGED / CERTIFIED**

Advanced loading:
**VISIBLE STRUCTURAL SHELL** (`Avanzado…`, disabled)

Detached loading copy:
**REMOVED** (SR-only status retained)

Loading → ready layout shift:
**NONE** (dx=dy=dw=dh=0 @ 412)

Advanced hierarchy / parent-hidden:
**UNCHANGED**

Footer ownership:
**UNCHANGED / WHOLE EDITOR**

Footer rhythm:
**REDUNDANT CLEARANCE REMOVED** (`4.75rem` → `1.5rem`) + **NATURAL FLEX SPACE CONFIRMED** on short content

Bottom reachability:
**PASS** (~36px collapsed)

360 / 390 / 390 short / 412 / desktop / light / dark:
**PASS**

Create / Builder / DB/RPC/RLS:
**UNCHANGED**

Business mutations:
**0**

Focused + related verifies / mutation probes / tsc / build / diff:
**PASS**

lint:
**NOT RUN — KNOWN TOOLING DEBT**

P0 / P1 / release-blocking P2:
**0**

Next:
**OWNER FINAL VISUAL ACCEPTANCE**

COMMIT/PUSH/DEPLOY:
**PAUSED**

---

## Previous (historical)

**ADMIN-PRODUCTS-EDIT-ADVANCED-VISUAL-HIERARCHY-HARD-QA-FIX-1 — PASS — ADVANCED GROUP/OPTION HIERARCHY OWNER-QA CLOSED — (2026-09-16)**

Doc: `docs/admin-products-edit-advanced-visual-hierarchy-hard-qa-fix-1.md`

Functional Unified Editor:
**UNCHANGED / CERTIFIED** (FINAL-QA-1)

Advanced:
**LEVEL 1**

Groups:
**LEVEL 2 / SINGLE CARD OWNER**

Options:
**LEVEL 3 / FLAT NESTED LIST** (+ measured inset ~16px)

Parent hidden:
**CHILD CONTROLS DISABLED**

Child draft state:
**PRESERVED** (no cascade)

Parent restore:
**CHILD STATE RESTORED EXACTLY**

Exception count:
**EXPLICIT OVERRIDES ONLY**

Eye/EyeOff:
**GHOST / SECONDARY / >=44**

Hidden state:
**CHIP + ICON**

Pre-Save writes:
**0**

Dirty / Save / Sticky / Create / Builder / DB:
**UNCHANGED**

Live QA:
360 / 390 / 412 / 899 / desktop / light / dark — **PASS**

Focused verify:
**PASS**

Related verifies:
**PASS**

Mutation probes:
**PASS** (FAIL→restore)

tsc / build / diff:
**PASS**

lint:
**NOT RUN — KNOWN TOOLING DEBT**

P0 / P1 / release-blocking P2:
**0**

Next:
**OWNER FINAL VISUAL ACCEPTANCE**
→ PRODUCT REMOVAL DECISION or RELEASE SEQUENCING

COMMIT/PUSH/DEPLOY:
**PAUSED**

---

## Previous (historical)

**ADMIN-PRODUCTS-EDIT-ADVANCED-VISUAL-HIERARCHY-POLISH-1 — IMPLEMENTATION PASS / OWNER HARD QA FOLLOW-UP — (2026-09-16)**

Doc: `docs/admin-products-edit-advanced-visual-hierarchy-polish-1.md`

Visual implementation:
**PASS** (section Advanced, summary, chips, Edit-scoped `.editHierarchy`)

Owner hard visual review:
**FOLLOW-UP REQUIRED** → superseded visually by HARD-QA-FIX-1

Functional contract:
**UNCHANGED / FINAL-QA-1 REMAINS PASS**

---

## Previous (historical)

**ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-FINAL-QA-1 — PASS — UNIFIED EDITOR CERTIFIED END-TO-END — (2026-09-15)**

Doc: `docs/admin-products-edit-unified-draft-save-final-qa-1.md`

DB RPC:
**LIVE / VALIDATED**

Application:
**UNIFIED EDIT CERTIFIED**

Real Save:
**PASS** on disposable QA fixture

Base + customization in one Save:
**PASS**

Reopen persisted state:
**PASS**

Restore:
**PASS** / NET BUSINESS DELTA **0** (fixture deleted)

Category:
EDIT read-only / unchanged through Save

Eye/EyeOff:
LOCAL BEFORE SAVE

Pre-Save customization writes:
**0**

Dirty:
**UNIFIED**

Discard:
**UNIFIED**

Sticky:
WHOLE EDITOR PASS

Create:
PASS / unchanged

Builder:
PASS / immediate mode preserved

Image:
KEEP runtime PASS · REMOVE/REPLACE verify PASS

Products verify corpus:
**27/27 PASS**

tsc:
**PASS**

build:
**PASS**

P0 / P1 / release-blocking P2 introduced:
**0**

Runtime source fixes this phase:
**0**

Next:
OWNER REVIEW / PRODUCT REMOVAL DECISION OR RELEASE SEQUENCING

COMMIT/PUSH/DEPLOY:
**PAUSED**

---

## Previous (historical)

**ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-IMPLEMENTATION-1 — PASS — UNIFIED EDITOR RUNTIME IMPLEMENTED — (2026-09-15)**

Doc: `docs/admin-products-edit-unified-draft-save-implementation-1.md`

DB RPC:
**LIVE / VALIDATED** (`public.save_product_edit_draft`, SECURITY INVOKER)

Application runtime:
**UNIFIED EDIT DRAFT ACTIVE IN SOURCE**

Persistence:
**ONE EDITOR = ONE DRAFT = ONE SAVE**

Category:
CREATE editable · EDIT read-only persisted context

Customization Eye/EyeOff:
**LOCAL DRAFT ONLY**

Pre-Save customization writes:
**0**

Dirty:
base + image + group overrides + option overrides

Accordion:
presentation preserved

Exception count:
**CURRENT DRAFT**

Save:
single unified RPC path (`saveProductEditDraftAction`)

DB atomicity:
provided by certified RPC

Image:
existing lifecycle / compensation preserved

Discard:
whole unified draft

Sticky footer:
whole editor / spans Advanced

Create:
**UNCHANGED**

Customization builder:
**UNCHANGED**

DB/RLS/migration:
**UNCHANGED** (SHA `42b2e206…16631`)

Persistent QA business mutations:
**0**

Next:
**ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-FINAL-QA-1**

COMMIT/PUSH/DEPLOY:
**PAUSED**

---

## Previous (historical)

**ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-CONTRACT-DB-APPLY-1 — PASS — UNIFIED EDIT RPC LIVE / VALIDATED — (2026-09-15)**

Doc: `docs/admin-products-edit-unified-draft-save-contract-db-apply-1.md`

Owner manual schema apply:
**YES — Supabase SQL Editor**

Cursor migration SQL replay:
**0**

Target:
OrderOps / `pkrsedmwxekbhlohhqds`

RPC:
`public.save_product_edit_draft`

Security:
**SECURITY INVOKER** / prosecdef false

ACL:
PUBLIC DENY · anon DENY · authenticated ALLOW

Legacy true overrides:
**0**

Role matrix:
owner ALLOW · admin ALLOW · manager ALLOW · operator DENY · viewer DENY · super_admin ALLOW · foreign DENY · anon DENY

Customization validation:
valid group/option PASS · invalid DENY · cross-tenant DENY

Category:
persisted context / immutable through RPC

Atomicity:
**LIVE VALIDATED** (late-failure SKU unique after override INSERT)

SKU / Stock / Image / Arrays:
**PASS**

Migration:
`supabase/migrations/20260915180000_products_edit_unified_draft_save_rpc.sql`

Migration SHA:
`42b2e206635d0fe3a13ffff7972e8149ae86c909829641a30ca001e500a16631`

Migration history:
**RECONCILED** (`20260915215741_products_edit_unified_draft_save_rpc`)

History collateral:
**0**

Live function fingerprint:
`6d31d3050a938022242eae9348c52697c46b8528b4f7b3afd08f5f3ff422079a`

Persistent QA business mutations:
**0**

Application runtime:
**STILL LEGACY MIXED PERSISTENCE**

Unified editor:
**NOT YET IMPLEMENTED**

Next:
**ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-IMPLEMENTATION-1**

`ADMIN-PRODUCTS-COMMIT-PUSH-DEPLOY-1`:
**PAUSED**

---

## Prior phase snapshot (preserved)
## Prior phase snapshot (preserved)
## Prior phase snapshot (preserved)
## Prior phase snapshot (preserved)

**ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-CONTRACT-DECISION-1 — PASS — UNIFIED EDIT DRAFT CONTRACT APPROVED — (2026-09-15)**

Doc: `docs/admin-products-edit-unified-draft-save-contract-decision-1.md`

Note: Decision phase approved ONE EDITOR = ONE DRAFT = ONE SAVE. Security mode corrected in DB-AUTHOR to SECURITY INVOKER (atomicity ≠ DEFINER). Runtime remains legacy mixed persistence until apply + implementation.

Next (at decision close):
**ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-CONTRACT-DB-AUTHOR-1**

---

## Prior phase snapshot (preserved)

**ADMIN-PRODUCTS-EDIT-CUSTOMIZATION-PROGRESSIVE-DISCLOSURE-ACCORDION-1 — PASS — ADVANCED CUSTOMIZATION PROGRESSIVE DISCLOSURE CLOSED — (2026-09-15)**

Doc: `docs/admin-products-edit-customization-progressive-disclosure-accordion-1.md`

Owner:
**ProductCustomizationOverridesPanel**

Customization UI:
**FINAL CLOSED / FROZEN (presentation)**

Note:
**Persistence ownership approved to change under unified draft decision — presentation preserved.**

---

## Prior phase snapshot (preserved)

**ADMIN-PRODUCTS-EDIT-CUSTOMIZATION-OVERRIDES-MOBILE-DENSITY-POLISH-1 — PASS — CUSTOMIZATION MOBILE DENSITY CLOSED / FROZEN — (2026-09-15)**

Doc: `docs/admin-products-edit-customization-overrides-mobile-density-polish-1.md`

Scope:
**ProductCustomizationOverridesPanel + feature-local CSS only**

Density (412):
**section/option ~141px → ~109px; action 44px; overflow-x 0**

Note:
**Presentation superseded by progressive disclosure accordion (domain unchanged).**

---

## Prior phase snapshot (preserved)

**ADMIN-PRODUCTS-EDIT-STICKY-FOOTER-RELEASE-STATE-POLISH-1 — PASS — EDIT BASE FORM FINAL CLOSED / FROZEN — (2026-09-15)**

Doc: `docs/admin-products-edit-sticky-footer-release-state-polish-1.md`

Release remnant under header:
**0 (pixel-proven)**

Fix owner:
**Edit-only `.headerReleaseClip::after` lip 32px + `.bodyReleaseClip` pad**

Note:
**Historically correct under base-only Save; approved for supersession when unified sticky spans Advanced.**

---

## Prior phase snapshot (preserved)

**ADMIN-PRODUCTS-EDIT-SIMPLE-MOBILE-VISUAL-UX-PARITY-1 — PASS — EDIT BASE FORM MOBILE VISUAL / UX PARITY CLOSED — (2026-09-15)**

Doc: `docs/admin-products-edit-simple-mobile-visual-ux-parity-1.md`

Create reference:
**FROZEN / PRESERVED**

Edit header:
**PASS**

Image block:
**PASS / LIFECYCLE UNCHANGED**

Required legend:
`* Campos obligatorios`

Required:
**Nombre · Categoría · Precio · Stock actual**

Optional:
**Imagen · Descripción · SKU · Disponible · track_stock**

Required semantics:
**UNCHANGED**

Form rhythm:
**POLISHED**

Disponible:
**COMPACT ROW**

Track stock:
**COMPACT ROW**

Activo/Inactivo duplicate copy:
**REMOVED FROM EDIT BASE FORM**

Stock helper:
**COMPACT / DOMAIN-ACCURATE**

Stock label:
**Stock actual / PRESERVED**

Dirty initial Save:
**DISABLED**

Dirty valid:
**ENABLED**

Dirty invalid:
**DISABLED**

Change→revert:
**PRISTINE**

Pristine submit:
**BLOCKED**

Dirty close:
**CONFIRM DISCARD**

Image KEEP/REMOVE/REPLACE:
**PRESERVED**

Pre-submit Storage:
**0**

Edit mobile footer:
**FULL BLEED**

CTA:
**INSET / FULL WIDTH**

CTA target:
**>=44 (preferred 48)**

MID:
**PASS**

BASE-FORM END:
**PASS / NO TRAILING STRIP**

Customization boundary:
**FOOTER RELEASES BEFORE PANEL**

ProductCustomizationOverridesPanel:
**UNCHANGED**

360:
**PASS**

390 light:
**PASS**

390 dark:
**PASS**

412:
**PASS**

899:
**PASS**

Desktop >=961:
**PASS**

Short viewport:
**PASS**

Horizontal overflow:
**0**

Pointer focus:
**PASS**

Keyboard focus-visible:
**PASS**

Flyout focus/Escape:
**PASS**

Create regression:
**PASS / FROZEN**

Products updated:
**0**

Storage mutations:
**0**

Customization mutations:
**0**

Orders:
**0**

DB/RLS/migrations:
**UNCHANGED**

Actions/domain:
**UNCHANGED**

Focused verify:
**PASS**

Related verifies:
**PASS**

Mutation probes:
**FAIL → RESTORED PASS**

tsc:
**PASS**

diff:
**PASS**

build:
**NOT RUN**

lint:
**NOT RUN — KNOWN TOOLING DEBT**

Next:
**ADMIN-PRODUCTS-EDIT-CUSTOMIZATION-OVERRIDES-MOBILE-DENSITY-POLISH-1**

Then:
**PRODUCT REMOVAL DECISION PHASE**

ADMIN-PRODUCTS-COMMIT-PUSH-DEPLOY-1:
**PAUSED**

---

### Prior — ADMIN-PRODUCTS-EDIT-DIRTY-STATE-UX-CONTRACT-1 — PASS — (2026-09-15)

Doc: `docs/admin-products-edit-dirty-state-ux-contract-1.md`

Dirty owner:
**`edit-product-form.tsx` currentSnapshot vs baselineSnapshot**

Baseline:
**PERSISTED EDITABLE PRODUCT SNAPSHOT**

Dirty semantics:
**CURRENT != BASELINE**

Change → revert:
**PRISTINE**

Initial Save:
**DISABLED**

Dirty + valid:
**ENABLED**

Dirty + invalid:
**DISABLED**

Pending:
**DISABLED**

Pristine submit:
**BLOCKED CLIENT-SIDE**

Close pristine:
**IMMEDIATE**

Close dirty:
**CONFIRM DISCARD**

Escape pristine:
**CLOSE**

Escape dirty:
**CONFIRM DISCARD**

Confirmation Escape:
**CANCEL DISCARD / RETURN TO EDIT**

Seguir editando:
**PRESERVES LOCAL CHANGES**

Descartar cambios:
**LOCAL DISCARD ONLY**

Image KEEP:
**PRISTINE**

Image REMOVE:
**DIRTY**

Image REPLACE:
**DIRTY**

Storage before Save:
**0**

Save success:
**closeFlyout (immediate; no discard prompt)**

Save failure:
**DIRTY PRESERVED**

Customization overrides:
**OUTSIDE BASE DIRTY SNAPSHOT**

window.confirm:
**NOT USED** (feature-local `<dialog>`)

360:
**PASS**

390:
**PASS**

412:
**PASS**

Light:
**PASS**

Dark:
**PASS**

Horizontal overflow:
**0**

Focus trap:
**PASS**

Escape ownership:
**PASS**

Products updated:
**0**

Storage mutations:
**0**

Orders:
**0**

DB/RLS/migrations:
**UNCHANGED**

Actions/domain:
**UNCHANGED**

Focused verify:
**PASS**

Mutation probes:
**FAIL → RESTORED PASS** (A canSave · B close guard · C imageIntent)

tsc:
**PASS**

diff:
**PASS**

Build:
**NOT RUN**

Lint:
**NOT RUN — KNOWN TOOLING DEBT**

PROD-P3-18:
**CLOSED**

Next:
**ADMIN-PRODUCTS-EDIT-SIMPLE-MOBILE-VISUAL-UX-PARITY-1**

Then:
**ADMIN-PRODUCTS-EDIT-CUSTOMIZATION-OVERRIDES-MOBILE-DENSITY-POLISH-1**

Product removal:
**SEPARATE DECISION PHASE LATER**

ADMIN-PRODUCTS-COMMIT-PUSH-DEPLOY-1:
**PAUSED**

---

### Prior — ADMIN-PRODUCTS-CREATE-REQUIRED-MARKER-SPACING-POLISH-1 — PASS — (2026-09-14)

Doc: `docs/admin-products-create-required-marker-spacing-polish-1.md`

Owner finding:
**Categoría `*` flush; Nombre / Precio / Stock spaced**

Root cause:
`.admin-field span { margin: 0 }` (admin-surfaces) overrode `.requiredMark { margin-inline-start: 0.15em }` on Categoría only

Spacing owner:
**`.fieldLabelInline` `display: inline-flex` + `column-gap: 0.15em`**

Mark margin as spacing:
**REMOVED** (defeated by admin-field)

RequiredMark markup:
**compact `*` (no whitespace padding)**

Affordance / required / legend / Input API:
**UNCHANGED**

Validation / Save / stock / footer / dvh:
**UNCHANGED**

Edit:
**UNCHANGED**

360:
**PASS** (gaps ~2.27–2.30px · overflow 0)

390 dark:
**PASS**

412 light:
**PASS**

Focused spacing verify:
**PASS**

Mutation (remove column-gap):
**FAIL → RESTORED PASS**

required-field-affordance verify:
**PASS**

tsc:
**PASS**

diff:
**PASS**

Build:
**NOT RUN**

Lint:
**NOT RUN — KNOWN TOOLING DEBT**

CREATE MOBILE:
**FINAL CLOSED / FROZEN**

CREATE OWNER POLISH:
**COMPLETE**

Next:
**OWNER REVIEW → EDIT SIMPLE MOBILE VISUAL QA**

ADMIN-PRODUCTS-COMMIT-PUSH-DEPLOY-1:
**STILL PAUSED**

---

### Prior — ADMIN-PRODUCTS-CREATE-REQUIRED-FIELD-AFFORDANCE-1 — PASS — (2026-09-14)

Doc: `docs/admin-products-create-required-field-affordance-1.md`

Required field contract:
**CONFIRMED FROM CURRENT SOURCE**

Required markers:
**Nombre · Categoría · Precio · Stock inicial**

Optional unmarked:
**Imagen · Descripción · SKU · Controlar stock automáticamente**

Legend:
`* Campos obligatorios`

Marker semantics:
**VISUAL ONLY / aria-hidden**

Native `required`:
**PRESERVED**

Validation behavior:
**UNCHANGED**

Save enablement:
**UNCHANGED**

Server validation:
**UNCHANGED**

Stock contract:
**UNCHANGED**

Viewport:
**UNCHANGED**

Sticky footer MID/END:
**PRESERVED**

Safe-area:
**PRESERVED**

Pointer focus:
**PRESERVED**

360:
**PASS**

390:
**PASS**

412:
**PASS**

Light:
**PASS**

Dark:
**PASS**

Horizontal overflow:
**0**

Create submits:
**0**

Products created:
**0**

Storage mutations:
**0**

DB/RLS/migrations:
**UNCHANGED**

Edit:
**UNCHANGED**

Focused verify:
**PASS**

Related verifies:
**PASS**

Mutation probes:
**FAIL → RESTORED PASS** (A missing Precio · B false SKU · C aria-hidden)

tsc:
**PASS**

diff:
**PASS**

Build:
**NOT RUN**

Lint:
**NOT RUN — KNOWN TOOLING DEBT**

CREATE MOBILE:
**FINAL CLOSED / FROZEN**

NO MORE CREATE OWNER POLISH PLANNED

Next:
**OWNER REVIEW → EDIT SIMPLE MOBILE VISUAL QA**

ADMIN-PRODUCTS-COMMIT-PUSH-DEPLOY-1:
**STILL PAUSED**

---

### Prior — ADMIN-PRODUCTS-CREATE-MOBILE-STICKY-FOOTER-END-STATE-POLISH-1 — PASS — (2026-09-14)

Doc: `docs/admin-products-create-mobile-sticky-footer-end-state-polish-1.md`

Trigger:
**OWNER REAL / DEVTOOLS VISUAL EVIDENCE**

Primary viewport:
**412 × ~915**

Root cause:
`.createForm.shell` `padding-bottom: 0.875rem` (14px) painted after sticky footer at END only

Classification:
**CASE B**

MID footer geometry:
**STABLE**

END footer geometry:
**STABLE**

Extra trailing footer surface:
**REMOVED** (`footerToBodyBottom` 14 → 0)

Footer:
**STICKY / FULL BLEED**

CTA:
**INSET / FULL WIDTH**

MID vs END CTA height:
**STABLE** (48)

MID vs END footer internal spacing:
**STABLE** (cta→footer bottom 12)

Safe-area:
**PRESERVED**

100dvh:
**PRESERVED**

Single scroll:
**PRESERVED**

Browser-chrome short viewport regression:
**PASS**

360:
**PASS**

390 short:
**PASS** (dark MID+END)

412:
**PASS** (light MID+END)

Light:
**PASS**

Dark:
**PASS**

Horizontal overflow:
**0**

Stock contract:
**FROZEN / UNCHANGED**

Create validation:
**UNCHANGED**

Pointer focus:
**PRESERVED**

Keyboard focus-visible:
**PRESERVED**

Edit:
**READ-ONLY GUARD PASS**

Products created:
**0**

Products updated:
**0**

Storage mutations:
**0**

Orders:
**0**

DB/RLS/migrations:
**UNCHANGED**

Runtime source edits:
`product-form.module.css`

Focused verify:
**PASS**

Related verifies:
**PASS**

Mutation probe:
**FAIL → RESTORED PASS**

tsc:
**PASS**

diff:
**PASS**

Build:
**NOT RUN**

Lint:
**NOT RUN — KNOWN TOOLING DEBT**

Create remaining release-blocking debt:
**NONE**

Create:
**FROZEN AGAIN**

Next:
**OWNER REVIEW → EDIT SIMPLE MOBILE VISUAL QA**

Then:
**EDIT PERSONALIZABLE MOBILE VISUAL QA**

ADMIN-PRODUCTS-COMMIT-PUSH-DEPLOY-1:
**STILL PAUSED**

---

**ADMIN-PRODUCTS-CREATE-MOBILE-FINAL-VISUAL-QA-1 — PASS — CREATE MOBILE VISUAL / UX SURFACE FROZEN — (2026-09-13)**

Doc: `docs/admin-products-create-mobile-final-visual-qa-1.md`

Create mobile:
**PRODUCTION-READY / FROZEN** (footer end-state polish applied above)

Header:
**PASS**

Dropzone:
**PASS**

Fields:
**PASS**

Stock initial:
**0**

Track stock default:
**ON**

Track stock reset:
**ON**

Zero-stock info:
**PASS**

Pointer focus:
**PASS**

Keyboard focus-visible:
**PASS**

Bottom whitespace:
**ARTIFICIAL spacer REMOVED** (128px → 36px); tall-viewport remainder accepted as natural

Footer:
**FULL BLEED**

CTA:
**INSET / FULL-WIDTH**

Short viewport:
**PASS**

Browser-chrome regression:
**PASS**

100dvh:
**PRESERVED**

safe-area:
**PRESERVED**

single scroll:
**PRESERVED**

360:
**PASS**

390 short:
**PASS** (light + dark)

390 normal:
**PASS**

412:
**PASS**

Light:
**PASS**

Dark:
**PASS**

Horizontal overflow:
**0**

Touch:
**>=44**

Initial focus / Tab / Escape:
**PASS**

Create business mutations:
**0**

Storage mutations:
**0**

DB/RLS/migrations:
**UNCHANGED**

Edit:
**READ-ONLY GUARD PASS**

Runtime source edits:
`product-form.module.css` only

Focused verify:
**PASS**

Related verifies:
**PASS**

Mutation probe A:
**FAIL → RESTORED PASS**

tsc:
**PASS**

diff:
**PASS**

Build:
**NOT RUN**

Lint:
**NOT RUN — KNOWN TOOLING DEBT**

Create remaining release-blocking debt:
**NONE**

Create:
**FROZEN**

Next (historical):
footer end-state polish (now PASS above)

ADMIN-PRODUCTS-COMMIT-PUSH-DEPLOY-1:
**STILL PAUSED**

---

**ADMIN-PRODUCTS-CREATE-STOCK-DEFAULT-UX-CONTRACT-1 — PASS — CREATE STOCK DEFAULT / UX CONTRACT CLOSED — (2026-09-13)**

Doc: `docs/admin-products-create-stock-default-ux-contract-1.md`

Create track_stock initial:
**ON**

Create track_stock success reset:
**ON**

User can disable tracking:
**YES**

Stock label:
**STOCK INICIAL** (Create only)

Initial stock:
**0**

Tracked + stock 0:
**VALID** → created unavailable by existing domain contract

Stock 0 validation error:
**NO**

Create Disponible switch:
**NOT INTRODUCED**

Zero-stock consequence:
**CONTEXTUAL INFO** (`toggleInfo`)

Generic stock helper:
**COMPACT**

Standalone Activo/Inactivo text:
**REMOVED FROM CREATE**

Pointer/touch switch focus:
**NO PERSISTENT KEYBOARD RING**

Keyboard focus-visible:
**PASS** (CSS `:has(input:focus-visible)` + Create hit-area)

Footer background:
**FULL BLEED MOBILE** (Create)

CTA:
**INSET / FULL-WIDTH**

dvh:
**PRESERVED**

safe-area:
**PRESERVED**

single scroll:
**PRESERVED**

360 runtime:
**PASS**

390 runtime:
**PASS** (light + dark)

412 runtime:
**PASS**

Horizontal overflow:
**0**

Light:
**PASS**

Dark:
**PASS**

Edit stock persisted state:
**UNCHANGED**

Edit "Stock actual":
**PRESERVED**

Server stock/availability authority:
**UNCHANGED**

Actions:
**UNCHANGED**

DB/RLS/migrations:
**UNCHANGED**

Products created:
**0**

Products updated:
**0**

Storage mutations:
**0**

Orders:
**0**

Focused verify:
**PASS**

Related verifies:
**PASS**

Mutation probes:
**FAIL → RESTORED PASS** (A/B/C/D)

tsc:
**PASS**

diff:
**PASS**

Commit/push/deploy:
**NONE**

Next (historical):
**ADMIN-PRODUCTS-CREATE-MOBILE-FINAL-VISUAL-QA-1** (now PASS)

Then:
owner review → Edit simple mobile phase

Release:
**STILL PAUSED**

---

**ADMIN-PRODUCTS-CREATE-MOBILE-VIEWPORT-VISUAL-POLISH-1 — PASS — CREATE MOBILE VIEWPORT / VISUAL SURFACE CLOSED — (2026-09-13)**

Doc: `docs/admin-products-create-mobile-viewport-visual-polish-1.md`

Trigger:
**REAL ANDROID BROWSER-CHROME FOOTER OCCLUSION**

Root cause:
**CASE A — `.panel` sized with static `100vh` only**

Mobile viewport sizing:
**DYNAMIC / `100vh` fallback + `100dvh`**

Static 100vh-only dependency:
**REMOVED** (dvh override present)

Flyout breakpoint:
**961 PRESERVED**

Scroll owners:
**1** (`.body`)

Sticky footer:
**PASS**

Safe-area bottom:
**PASS**

Create CTA mobile:
**FULL WIDTH** (≥48px)

Create CTA visible in short viewport:
**PASS** (600/640)

Create CTA visible in normal viewport:
**PASS**

Body/footer occlusion (scrolled bottom):
**0**

360/390/412 overflow:
**0**

Dropzone:
**POLISHED / BEHAVIOR FROZEN**

Form vertical rhythm:
**POLISHED (Create mobile)**

Header / image lifecycle / stock defaults:
**FROZEN / UNCHANGED** (stock defaults closed in CREATE-STOCK-DEFAULT phase above)

Create submits:
**0**

Edit shared-shell guard:
**PASS**

Focus / Escape:
**PASS REGRESSION**

Focused verify / mutations / tsc / diff:
**PASS**

Commit/push/deploy:
**NONE**

Next (historical):
**ADMIN-PRODUCTS-CREATE-STOCK-DEFAULT-UX-CONTRACT-1** (now PASS)

Then:
**ADMIN-PRODUCTS-CREATE-MOBILE-FINAL-VISUAL-QA-1**

Release:
**STILL PAUSED**

---

## Previous — ADMIN-PRODUCTS-MOBILE-MAIN-SURFACE-HARD-VISUAL-POLISH-1 — PASS — MOBILE MAIN PRODUCTS SURFACE CLOSED — (2026-09-12)

Doc: `docs/admin-products-mobile-main-surface-hard-visual-polish-1.md`

Scope:
**MAIN /admin/products ONLY**

Mobile actions:
**[Opcionales] [Abrir catálogo] [Copiar link]**

Mobile Abrir catálogo:
**PUBLIC REAL ROUTE** (`buildPublicCatalogPath` → `/b/{slug}/catalogo`)

Preview query:
**NOT USED ON MOBILE**

Desktop Vista previa:
**PRESERVED** (`/admin/products/preview`)

Public catalog new tab:
**PASS**

Search:
**FULL WIDTH / PRESERVED** (≥44 · 300ms debounce)

Mobile filters:
**3-COLUMN COMPACT NATIVE SELECT ROW**

Native select semantics:
**PRESERVED**

Filter URL contract:
**PRESERVED**

Filter page reset:
**PRESERVED**

Summary duplication:
**REMOVED ON MOBILE**

Por categorías redundancy:
**HIDDEN ON MOBILE**

Horizontal overflow:
**0** (360/390/412/899/900)

Touch targets:
**≥44**

Light:
**PASS**

Dark:
**PASS**

360 / 390 / 412 / 899 / 900:
**PASS**

Copy link visible feedback:
**PASS**

Copy link accessible announcement:
**PASS** (`role="status"` `aria-live="polite"`)

ProductCard architecture:
**FROZEN**

Forms / flyout / customizations:
**UNCHANGED**

Product mutations:
**0**

Storage mutations:
**0**

Orders:
**0**

Focused verify:
**PASS**

Mutation probes:
**FAIL → RESTORED PASS**

tsc / diff:
**PASS**

DB/RLS/migrations:
**UNCHANGED**

Commit/push/deploy:
**NONE**

Next (historical):
**WAIT FOR OWNER DETAIL ON CREATE / EDIT SIMPLE / EDIT PERSONALIZABLE MOBILE VISUAL QA**

ADMIN-PRODUCTS-COMMIT-PUSH-DEPLOY-1:
**STILL PAUSED**

---

## Previous — ADMIN-PRODUCTS-CLIENT-IMAGE-OPTIMIZATION-800-FIRST-SELECTION-1 — PASS — 800-FIRST QUALITY-PRESERVING SELECTION CLOSED — (2026-09-11)

Doc: `docs/admin-products-client-image-optimization-800-first-selection-1.md`

Preferred target:
**≤90 KiB**

Quality-preserving ceiling:
**≤150 KiB**

Selection priority:
**LARGEST VALID DIMENSION FIRST**

800 outlier ≤150:
**PREFERRED OVER 720/640**

Dimension fallback:
**ONLY WHEN CURRENT DIMENSION HAS NO ≤150 CANDIDATE**

Highest-quality acceptable outlier:
**SELECTED**

Quality floor:
**0.60 / UNCHANGED**

Dimension floor:
**640 / UNCHANGED**

WebP:
**UNCHANGED**

Pica:
**UNCHANGED**

No-upscale:
**PRESERVED**

Image lifecycle:
**FROZEN / PASS**

Pre-submit Storage:
**0 / PRESERVED**

Optimizer verify:
**PASS**

Lifecycle verify:
**PASS**

Mutation probes:
**FAIL → RESTORED PASS** (A/B/C)

tsc:
**PASS**

diff:
**PASS**

Runtime source files changed:
**1** (`lib/products/product-image-optimization.ts`) + focused verify

Forms:
**UNCHANGED**

DB/RLS/migrations:
**UNCHANGED**

Storage policies:
**UNCHANGED**

Products verify corpus:
**12/12 PREVIOUSLY PASS**

Real phone camera QA:
**DEFERRED / ACCEPTED NON-BLOCKING QA DEBT**

HEIC:
**ACCEPTED QA DEBT**

Image Delivery:
**BLOCKED / ACCEPTED INFRA**

Historical orphan cleanup:
**DEFERRED**

ESLint:
**KNOWN TOOLING DEBT**

Products P0:
**0**

Products P1:
**0**

Release-blocking P2:
**0**

Products package:
**READY FOR RELEASE** (later paused for owner mobile visual block)

Next (historical):
**ADMIN-PRODUCTS-COMMIT-PUSH-DEPLOY-1** — superseded pause by mobile main-surface polish owner gate

No commit. No push. No deploy.

---

## Previous — ADMIN-PRODUCTS-CLIENT-IMAGE-OPTIMIZATION-REAL-ASSET-QA-2 — REAL PHONE FIXTURE UNAVAILABLE — (2026-09-11)

Doc: `docs/admin-products-client-image-optimization-real-asset-qa-2.md`

Owner-supplied files: ExampleFile synthetic banners (`xx_2.jpg` 5.05 MiB · `10mb-example-jpg.jpg` 10.31 MiB)
Hard gate: **FAILED** — synthetic ExampleFile explicitly forbidden
Genuine phone JPEG processed: **0**
Optimizer exercised: **NO**
Runtime source edits: **0**
Real camera JPEG 3–10 MiB debt: later owner-accepted as non-blocking (see 800-FIRST phase)
Byte-budget contract: **IN FORCE** (≤90 preferred / ≤150 outlier / >150 miss)
HEIC: **ACCEPTED QA DEBT**
Image Delivery: **BLOCKED / ACCEPTED INFRA**
Products P0: **0**
Products P1: **0**
Historical note: at execution time package was marked not release-ready pending phone fixture; **superseded** by 800-FIRST owner decision + PASS.

---

## Previous — ADMIN-PRODUCTS-CLIENT-IMAGE-OPTIMIZATION-BYTE-BUDGET-DECISION-1 — PASS — BYTE BUDGET CONTRACT DECIDED — (2026-09-11)

Doc: `docs/admin-products-client-image-optimization-byte-budget-decision-1.md`

Previous Real-Asset QA: **BLOCKED UNDER OLD ≤90 KiB HARD GATE**
Preferred target: **≤90 KiB**
Quality-preserving outlier band: **>90 KiB to ≤150 KiB**
Hard byte-budget miss: **>150 KiB**
Current fallback floor: **640px**
Current quality floor: **~0.60**
Further degradation: **NOT AUTHORIZED**
Real photographic QA result: **135.43 KiB @640 → ACCEPTED QUALITY-PRESERVING OUTLIER UNDER NEW CONTRACT**
Visual quality: **ACCEPTABLE / GOOD**
Optimizer source: **UNCHANGED**
Lifecycle: **FROZEN**
Pre-submit Storage: **0**
DB/RLS: **UNCHANGED**
Dual-quality architecture: **DEFERRED / NOT INTRODUCED**
Image Delivery Reconciliation: **BLOCKED / ACCEPTED INFRA**
Real camera JPEG 3–10 MiB QA: **STILL OPEN**
HEIC real-device: **ACCEPTED QA DEBT**
Products verify corpus: **12/12 PASS**
Products P0: **0**
Products P1: **0**

Next: **ADMIN-PRODUCTS-CLIENT-IMAGE-OPTIMIZATION-REAL-ASSET-QA-2**

Then, if PASS: **ADMIN-PRODUCTS-COMMIT-PUSH-DEPLOY-1**

No commit. No push. No deploy.

---

## Previous — ADMIN-PRODUCTS-CLIENT-IMAGE-OPTIMIZATION-REAL-ASSET-QA-1 — REAL-ASSET QA BLOCKED — BYTE BUDGET MICROFIX/DECISION REQUIRED — (2026-09-11)

Doc: `docs/admin-products-client-image-optimization-real-asset-qa-1.md`

Real camera JPEG 3–10 MB QA debt: **NOT CLOSED**
Primary real photographic JPEG: **1024×1024 · 1.317 MiB → 135.43 KiB WebP @ 640×640**
JPEG final: image/webp · ≤800 · visual **ACCEPTABLE/GOOD**
JPEG byte target ≤90 KiB: **FAIL — BYTE BUDGET MISS** (fallback 800→640 engaged) — *historical hard-gate interpretation*
Heavy synthetic JPEG (ExampleFile, NOT camera): 11384×4221 · 10.308 MiB → 34.54 KiB @ 800×800 · PASS stress only
Heavy PNG: 1082×12637 · 7.246 MiB → 36.86 KiB @ 800×800 · PASS
Pre-submit Storage uploads: **0**
Committed Storage uploads: **0**
Product / DB mutations: **0**
Image lifecycle: **FROZEN / PASS**
Optimizer: **FROZEN** (no code changes)
Products verify corpus: **12/12 PASS / NOT RE-RUN FULL**
Targeted optimizer verify: **PASS**
Targeted lifecycle verify: **PASS**
diff: **PASS**
Runtime source edits this phase: **0**
HEIC real-device: **ACCEPTED QA DEBT / DEFERRED**
Image Delivery Reconciliation: **BLOCKED / ACCEPTED INFRA**
Historical orphan cleanup: **DEFERRED**
ESLint: **KNOWN TOOLING DEBT**
Products P0: **0**
Products P1: **0**
Release-blocking finding: **BYTE BUDGET MISS on real photographic asset** *(superseded by owner decision)*

Products package: **NOT RELEASE-READY until byte-budget decision/microfix** *(then phone QA)*

Next (then): **ADMIN-PRODUCTS-CLIENT-IMAGE-OPTIMIZATION-BYTE-BUDGET-DECISION-1**

No commit. No push. No deploy.

---

## Previous — ADMIN-PRODUCTS-VERIFY-CORPUS-RECONCILIATION-1 — PASS — PRODUCTS VERIFY CORPUS RECONCILED — (2026-09-11)

Doc: `docs/admin-products-verify-corpus-reconciliation-1.md`

Final QA: **PASS WITH ACCEPTED NON-BLOCKING DEBT**
Products P0: **0**
Products P1: **0**
Release-blocking P2: **0**

Verify corpus before: **10/12 PASS**
Verify corpus after: **12/12 PASS**

Image lifecycle verify: **RECONCILED TO OPTIMIZED STAGED FILE CONTRACT**
Card aspect-ratio verify: **RECONCILED TO CURRENT SQUARE / COVER SCALE CONTRACT**

Mutation probe lifecycle: **FAIL → RESTORED PASS**
Mutation probe aspect: **FAIL → RESTORED PASS**

Runtime source permanent edits: **0**
Runtime CSS permanent edits: **0**
DB/RLS/migrations: **UNCHANGED**
Image lifecycle: **FROZEN**
Image optimization: **FROZEN**
Collection: **FROZEN**

tsc: **PASS**
diff: **PASS**
build: **NOT RUN — FINAL QA PASS / RUNTIME UNCHANGED**
lint: **NOT RUN — KNOWN TOOLING DEBT**
Browser QA: **NOT RUN — FINAL QA ALREADY PASS**

Remaining accepted debt:

- Image Delivery Reconciliation — **BLOCKED / ACCEPTED INFRA**
- Historical orphan cleanup — **DEFERRED**
- Real camera JPEG 3–10 MB QA — **ACCEPTED QA DEBT**
- HEIC real-device QA — **ACCEPTED QA DEBT**
- ESLint circular-config tooling debt
- residual non-blocking P3 polish

Verify corpus debt: **CLOSED**
Products package: **READY FOR RELEASE** (superseded: real-asset QA later blocked on byte budget)

Next (then): **ADMIN-PRODUCTS-CLIENT-IMAGE-OPTIMIZATION-REAL-ASSET-QA-1**

No commit. No push. No deploy.

---

## Previous — ADMIN-PRODUCTS-FINAL-FUNCTIONAL-VISUAL-QA-1 — PASS WITH ACCEPTED NON-BLOCKING DEBT — PRODUCTS PACKAGE READY FOR RELEASE — (2026-09-11)

Doc: `docs/admin-products-final-functional-visual-qa-1.md`

Products P0: **0**
Products P1: **0**
Release-blocking P2: **0**

Search/filter: **PASS**
Responsive collection: **PASS**
390: **PASS**
899: **PASS** (cards / no table)
900: **PASS** (table / no cards)
1440: **PASS**
Light: **PASS**
Dark: **PASS**
Create flyout: **PASS / NO SUBMIT**
Edit flyout: **PASS / NO BUSINESS MUTATION**
Availability feedback: **PASS**
Image lifecycle: **PASS / FROZEN** (staged remove discard nondestructive)
Client image optimization: **PASS** (source + verifies; real 3–10 MB camera fixture **ACCEPTED QA DEBT**)
Real camera JPEG: **ACCEPTED QA DEBT**
HEIC real-device: **ACCEPTED QA DEBT**
Pre-submit Storage writes: **0**
Historical image cleanup: **DEFERRED / NOT EXECUTED**
Image Delivery Reconciliation: **BLOCKED / ACCEPTED INFRA DEBT**
Public catalog read-only smoke: **PASS**
Accessibility: **PASS**
Products verifies: **10/12 PASS** (2 stale asserts → verify corpus reconciliation debt)
tsc: **PASS**
build: **PASS**
lint: **KNOWN ESLINT TOOLING DEBT ONLY**
diff: **PASS**
Product mutations during Final QA: **0**
Committed image mutations: **0**
Orders: **0**
Runtime source edits this phase: **0**
Living Products audit: **RECONCILED**
ORDEROPS_LIVING_MEMORY: **RECONCILED**

Next (then): **ADMIN-PRODUCTS-VERIFY-CORPUS-RECONCILIATION-1** → **ADMIN-PRODUCTS-COMMIT-PUSH-DEPLOY-1**

No commit. No push. No deploy.

---

## Previous — ADMIN-PRODUCTS-AVAILABILITY-TOGGLE-ERROR-FEEDBACK-1 — PASS — (2026-09-10)

Doc: `docs/admin-products-availability-toggle-error-feedback-1.md`

PROD-P3-16: **CLOSED**
Availability domain contract: **FROZEN / UNCHANGED**
setProductAvailabilityAction: **SERVER AUTHORITY PRESERVED**
Tracked stock zero activation: **DENIED + USER-VISIBLE FEEDBACK**
Pending: **SINGLE IN-FLIGHT / DUPLICATE-SAFE**
Failure: **PREVIOUS CONFIRMED STATE PRESERVED**
Domain error: **VISIBLE / SAFE**
Unexpected error: **GENERIC SAFE FEEDBACK**
Raw backend error: **NOT EXPOSED**
Success: **QUIET / ERROR CLEARED**
Mobile cards: **PASS** (shared owner)
Desktop table: **PASS** (shared owner)
Accessibility: **ERROR ANNOUNCED + CONTROL ASSOCIATED**
Product mutations during QA: **0**
Domain denial runtime: **NOT RUN — NO SAFE NON-MUTATING FIXTURE**
DB: **UNCHANGED**
RLS: **UNCHANGED**
Stock trigger: **UNCHANGED**
SKU: **FROZEN**
Image lifecycle: **FROZEN**
Client image optimization: **FROZEN**
Public catalog: **UNCHANGED**
Collection architecture: **FROZEN**
Targeted verify: **PASS**
Mutation probes: **FAIL → RESTORED PASS**
tsc: **PASS**
diff: **PASS**
Products P0: **0**
Products P1: **0**

Next (then): **ADMIN-PRODUCTS-FINAL-FUNCTIONAL-VISUAL-QA-1** (Image Delivery Reconciliation remains BLOCKED)

No commit. No push. No deploy.

---

## Previous — ADMIN-PRODUCTS-CLIENT-IMAGE-OPTIMIZATION-1 — PASS WITH HEIC REAL-DEVICE QA DEBT — (2026-09-10)

Doc: `docs/admin-products-client-image-optimization-1.md`

Owner roadmap insertion: **AUTHORIZED BEFORE PROD-P3-16**
Image lifecycle: **FROZEN / PRESERVED**
Storage DELETE policy: **LIVE / UNCHANGED**
Client optimization: **IMPLEMENTED IN SOURCE**
Resize: **PICA**
HEIC: **LAZY DECODER (`heic-to` LGPL-3.0)**
Final format: **WEBP**
Primary max dimension: **800px**
Initial quality: **0.80**
Normal target: **<=90 KiB**
40 KiB: **NOT A MINIMUM / NO PADDING**
Metadata: **RE-ENCODED / EXIF-GPS NOT PRESERVED**
Create: **SHARED OPTIMIZER**
Edit: **SHARED OPTIMIZER**
Crop: **PRESERVED**
Pre-submit Storage uploads: **0**
Optimization: **OUTSIDE SKU RETRY**
Upload: **SAVE-TIME ONLY**
Canonical path: **businessId/productId/*.webp**
New tmp-product writes: **0**
KEEP: **NO OPTIMIZATION / NO UPLOAD**
REMOVE: **NO OPTIMIZATION / NO UPLOAD**
REPLACE: **OPTIMIZE ONCE / UPLOAD ONCE**
DB/RLS: **UNCHANGED**
Storage policies: **UNCHANGED**
Image delivery/transforms: **UNCHANGED**
Runtime QA: landscape **3052 B @ 800×600**; portrait **3176 B @ 533×800**; invalid **DENIED**; Storage hits **0**
HEIC runtime: **REAL-DEVICE QA DEBT**
Targeted verify: **PASS**
tsc: **PASS**
diff: **PASS**
New lifecycle source: **LOCAL / UNDEPLOYED**
Production runtime: **LEGACY UNTIL RELEASE**
Products P0: **0**
Products P1: **0**

Next: **ADMIN-PRODUCTS-AVAILABILITY-TOGGLE-ERROR-FEEDBACK-1** (PROD-P3-16)

No commit. No push. No deploy.

---

## Previous — ADMIN-PRODUCTS-IMAGE-LIFECYCLE-DB-APPLY-1 — PASS — (2026-09-10)

Doc: `docs/admin-products-image-lifecycle-db-apply-1.md`

PROD-P3-14: **CLOSED**
PROD-P3-15: **CLOSED FOR FORWARD LIFECYCLE**
Storage DELETE policy: **LIVE**
Migration: `20260910022504_product_images_delete_lifecycle.sql` **APPLIED + VALIDATED**
Remote history: `20260910040100_product_images_delete_lifecycle`
Migration hash: `83A48B1BFEDD98F9BC2469D6E33AC9E145E5B3ED2FEFE5D55C6533E40DAFC789` (pre = post)
Policy: `product_images_delete_own_business` DELETE on `product-images`
Tenant enforcement: **PASS**
Role enforcement: **PASS**
Operator/viewer: **DENY**
Foreign tenant: **DENY**
Anonymous: **DENY**
KEEP: **PASS**
REPLACE: **PASS**
FAILED REPLACE CLEANUP: **PASS**
SHARED REFERENCE GUARD: **PASS**
REMOVE: **PASS**
Replace ordering: **NEW UPLOAD → DB NEW REF → OLD CLEANUP**
Remove ordering: **DB NULL → OLD CLEANUP**
Pre-submit uploads: **0**
New tmp-product writes: **0**
Probe products: **0 REMAINING**
Probe storage objects: **0 REMAINING**
Product count: **20 → 20 SAME**
Existing product mutations: **0**
Existing image mutations: **0**
Historical orphan cleanup: **DEFERRED / NOT EXECUTED**
Image delivery/transforms: **UNCHANGED / SEPARATE BLOCKED DEBT**
New lifecycle source: **LOCAL / UNDEPLOYED**
Production runtime: **LEGACY UNTIL RELEASE**
RLS products: **UNCHANGED**
Stock: **UNCHANGED**
SKU: **UNCHANGED**
Collection/flyout: **FROZEN**
Targeted verify: **PASS**
diff: **PASS**
Products P0: **0**
Products P1: **0**

Next: **ADMIN-PRODUCTS-AVAILABILITY-TOGGLE-ERROR-FEEDBACK-1** (PROD-P3-16)

No commit. No push. No deploy.

---

## Previous — ADMIN-PRODUCTS-IMAGE-LIFECYCLE-1 — PASS WITH DB APPLY + MUTATION QA REQUIRED — (2026-09-10)

Doc: `docs/admin-products-image-lifecycle-1.md`

PROD-P3-14: **IMPLEMENTED IN SOURCE**
PROD-P3-15: **FORWARD LIFECYCLE IMPLEMENTED / STORAGE DELETE POLICY APPLY REQUIRED**
Storage DELETE policy: `20260910022504_product_images_delete_lifecycle.sql` **AUTHORED / NOT APPLIED** (closed by DB-APPLY phase above)

---

## Previous — ADMIN-PRODUCTS-SKU-DATA-INTEGRITY-DB-APPLY-1 — PASS — (2026-09-09)

Doc: `docs/admin-products-sku-data-integrity-db-apply-1.md`

PROD-P3-12: **CLOSED AT DATA-INTEGRITY LAYER**
SKU DB invariant: **LIVE**
Migration: `20260910010123_products_sku_unique_integrity.sql` **APPLIED + VALIDATED**
Remote history: `20260910014445_products_sku_unique_integrity`
Migration hash: `8A493BC4BD1D196DD5F962518B922C4653AEE8FF798EECD256C196CB0DF2F10E` (pre = post)
Unique scope: **business_id + sku**
Predicate: **sku IS NOT NULL**
Same-business duplicate: **DENIED**
Cross-business same SKU: **ALLOWED**
Multiple NULL: **ALLOWED**
Case semantics: **EXACT / PRESERVED**
Fresh duplicate census: **0**
DB matrix: **PASS 5/5**
Probe rows: **0**
Existing SKU mutations: **0**
Product persistent mutations: **0**
Legacy producer compatibility: **PASS / CURRENT NEXT CANDIDATE COLLISIONS 0**
Duplicate category-prefix groups: **0**
DB concurrency authority: **LIVE**
New generator source: **LOCAL / UNDEPLOYED**
3-attempt auto collision retry: **LOCAL / UNDEPLOYED**
Manual/Edit duplicate domain errors: **LOCAL / UNDEPLOYED**
RLS: **UNCHANGED**
Stock/availability: **UNCHANGED**
UI/CSS/flyout/collection: **UNCHANGED**
Targeted verify: **PASS**
diff: **PASS**
Products P0: **0**
Products P1: **0**

Next: **PROD-P3-14 / PROD-P3-15 image lifecycle** (no named IMAGE-LIFECYCLE phase in living-audit roadmap; `ADMIN-PRODUCTS-IMAGE-DELIVERY-RECONCILIATION-1` remains blocked on transform tokens)

No commit. No push. No deploy.

---

## Previous — ADMIN-PRODUCTS-SKU-DATA-INTEGRITY-1 — PASS WITH DB APPLY REQUIRED — (2026-09-09)

Doc: `docs/admin-products-sku-data-integrity-1.md`

SKU debt: **PROD-P3-12 — IMPLEMENTED / REMOTE DB APPLY REQUIRED**
Current SKU format: **PRESERVED** (`PREFIX-NNN`)
SKU nullable: **yes**
Same-business exact duplicates census: **0**
Case-fold duplicate census: **0** (informational)
Generation: **COUNT+1 REMOVED**
Next candidate: **MAX EXISTING AUTO-SEQUENCE + 1**
Concurrency: **DB UNIQUE AUTHORITY + BOUNDED INSERT RETRY (3)**
Manual SKU behavior: **preserved; duplicate → domain error**
Edit SKU behavior: **preserved; duplicate → domain error**
Migration: `20260910010123_products_sku_unique_integrity.sql` **AUTHORED / NOT APPLIED**
Unique scope: **business_id + sku**
Null SKU: **MULTIPLE ALLOWED**
Data backfill: **NONE**
Existing SKU mutations: **0**
Product mutations: **0**
CSS/UI: **UNCHANGED**
RLS: **UNCHANGED**
Stock/availability: **UNCHANGED**
Targeted verify: **PASS**
tsc: **PASS**
diff: **PASS**
Products P0: **0**
Products P1: **0**

Next: **ADMIN-PRODUCTS-SKU-DATA-INTEGRITY-DB-APPLY-1**

No commit. No push. No deploy.

---

## Previous — ADMIN-PRODUCTS-FLYOUT-FORM-INTERACTION-POLISH-1 — PASS — (2026-09-09)

Doc: `docs/admin-products-flyout-form-interaction-polish-1.md`

PROD-P2-3: **CLOSED**
PROD-P2-4: **CLOSED**
PROD-P2-5: **CLOSED**

Flyout: **ACCESSIBLE MODAL INTERACTION**
Initial focus: **INSIDE / CLOSE BUTTON**
Tab containment: **PASS**
Shift+Tab containment: **PASS**
Escape: **CLOSES**
Return focus: **PASS FOR MANUAL OPENERS**
Auto-open no-opener: **SAFE / NO RESTORE REQUIRED**
Sticky footer: **OPAQUE + NON-OCCLUDING**
Create bottom: **PASS**
Edit bottom: **PASS**
Flyout/form targets: **>=44px**
390 Create: **PASS**
390 Edit: **PASS**
Desktop: **PASS**
Validation/domain: **UNCHANGED**
Create/Edit success semantics: **UNCHANGED**
Dirty tracking: **NOT INTRODUCED**
Collection/images: **FROZEN / UNCHANGED**
Image crop/upload semantics: **UNCHANGED**
Product mutations: **0**
DB/RPC/migrations: **UNCHANGED**
Targeted verify: **PASS**
tsc: **PASS**
diff: **PASS**
Products P0: **0**
Products P1: **0**

Next: **ADMIN-PRODUCTS-SKU-DATA-INTEGRITY-1**

No commit. No push. No deploy.

---

## Previous — ADMIN-PRODUCTS-CARD-IMAGE-SCALE-POLISH-1 — READY FOR HUMAN VISUAL ACCEPTANCE (2026-09-09)

Doc: `docs/admin-products-card-image-scale-polish-1.md`

Mobile: height-derived 1:1 · ~117×117 @390 · ~116 @899
Desktop: 60×60 · row 71→69 · ~87% row occupancy
Collection/images: **FROZEN for flyout phase**
Next was: **ADMIN-PRODUCTS-FLYOUT-FORM-INTERACTION-POLISH-1**

---

## Previous — ADMIN-PRODUCTS-MOBILE-CARD-IMAGE-ASPECT-RATIO-FIX-1 — PASS (2026-09-09)

Doc: `docs/admin-products-mobile-card-image-aspect-ratio-fix-1.md`

Mobile ProductCard image: **SQUARE 1:1**
Object fit: **COVER**
Crop presentation: **PRESERVED**
390: **PASS** (72×72 measured)
899: **PASS / TWO-COLUMN PRESERVED** (80×80 measured)
900: **DESKTOP TABLE UNCHANGED** (0 cards / 1 table)
Image pipeline: **UNCHANGED**
Uploads/crop/storage/transforms: **UNCHANGED**
Mobile operational fields: **PRESERVED**
Availability/card interactions: **PRESERVED**
Collection architecture: **FROZEN / SINGLE ACTIVE TREE**
Breakpoints: **UNCHANGED**
Pagination: **UNCHANGED**
Product mutations: **0**
DB/RPC/migrations: **UNCHANGED**
Targeted verify: **PASS** · tsc: **PASS** · diff: **PASS**
Products P0: **0** · Products P1: **0**

Next: **ADMIN-PRODUCTS-FLYOUT-FORM-INTERACTION-POLISH-1**

No commit. No push. No deploy.

---

## Previous — ADMIN-PRODUCTS-MOBILE-OPERATIONAL-UX-POLISH-1 — PASS WITH DEFERRED REMAINDER (2026-09-09)

Doc: `docs/admin-products-mobile-operational-ux-polish-1.md`

`PROD-P2-7`: **CLOSED**
Mobile operational parity: **SKU AT-A-GLANCE** · **STOCK AT-A-GLANCE** · **INLINE AVAILABILITY**
Pagination: **REMAINS CLOSED / SHARED**

`PROD-P2-3`: **COLLECTION PORTION CLOSED / FLYOUT-FORM REMAINDER**
`PROD-P2-6`: **CLOSED** (measured ≥4.5:1 on audited collection selectors)
`PROD-P2-8`: **CLOSED** (feature-local header ~150→~97px @390; targets ≥44)

Mobile touch targets: **≥44px** for all in-scope collection/toolbar/header/availability controls
Light informative contrast: **~7.73:1** (`--text-secondary` on white) for `Gestionar` / `Por categorías` / category counts
390: **PASS** · 899: **PASS / TWO-COLUMN PRESERVED**
Collection architecture: **FROZEN / SINGLE ACTIVE TREE**
Breakpoints: **`<720` 1 col · `720–899` 2 col · `>=900` table**
Pagination owner: **UNCHANGED**
Product mutations (QA): **0** · DB/RPC/migrations: **UNCHANGED**
Products P0: **0** · Products P1: **0**

Next: **ADMIN-PRODUCTS-FLYOUT-FORM-INTERACTION-POLISH-1**

No commit. No push. No deploy.

---

## Previous — ADMIN-PRODUCTS-COLLECTION-RESPONSIVE-ARCHITECTURE-1 — PASS (2026-09-09)

Doc: `docs/admin-products-collection-responsive-architecture-1.md`

`PROD-P2-2`: **CLOSED** · `PROD-P2-7`: **PAGINATION CLOSED** (stock/SKU/inline availability still deferred) · `PROD-P3-1`: **CLOSED** · `PROD-P3-2`: **COLLECTION BREAKPOINT CLOSED** (flyout 961 / toolbar 768/1024 unchanged)

Collection architecture: **SINGLE ACTIVE TREE** — `useProductsDesktopCollection` (`useSyncExternalStore` + `(min-width: 900px)`); SSR snapshot mobile `false`; no `window.innerWidth`; no `suppressHydrationWarning`; CSS dual-mount `.desktopOnly`/`.mobileOnly` removed
Mobile: **`<900` cards** · Desktop: **`>=900` table** · Grid: **`<720` 1 col · `720–899` 2 cols**
Pagination: **SHARED / SINGLE OWNER** in `product-catalog-views` (stripped from table + grid); URL/`ADMIN_PRODUCTS_PAGE_SIZE` unchanged
SSR: mobile deterministic fallback · Hydration: **PASS / NO MISMATCH**
Runtime smoke: 390 cards/no table/1col · 899 cards/no table/2col · 900 table/no cards · resize 900↔899 **PASS** (URL intact, no dual tree)
Targeted verify: **PASS** · tsc: **PASS** · diff: **PASS** · Resize data fetch: **NONE BY SOURCE**
DB/RPC/migrations: **UNCHANGED** · Data mutations: **0** · Provider/actions: untouched

Products P0: **0** · Products P1: **0**

Next: **ADMIN-PRODUCTS-MOBILE-OPERATIONAL-UX-POLISH-1**

No commit. No push. No deploy.

---

## Previous — ADMIN-ACTION-REDIRECT-PASSTHROUGH-FIX-1 — PASS (2026-09-09)

Doc: `docs/admin-action-redirect-passthrough-fix-1.md`

`PROD-P2-9`: **CLOSED**

Root cause: auth/permission `redirect()` caught by Server Action `try/catch` → `getActionErrorMessage` → literal `NEXT_REDIRECT`
Fix: redirect-capable admin guards execute **outside** the application-error try/catch
Affected action files: **8** (41 actions) — categories, dashboard, orders/[id], products, products/customizations, settings/notifications, settings/operations, settings/public
Already correct: `team/actions.ts` · Outliers: **none**
Permissions: **UNCHANGED** · Application/domain error normalization: **PRESERVED** · `NEXT_REDIRECT` visible error: **ELIMINATED BY STRUCTURE**
No `NEXT_REDIRECT` parsing · no `unstable_rethrow` · no `next/dist/*` · auth helpers untouched
Targeted verify: **PASS** · Behavior: synthetic errors PASS + auth redirect **SOURCE-DETERMINISTIC PASS** · tsc: **PASS** · diff: **PASS**
Runtime/CSS: UNCHANGED except action control-flow structure · DB/RPC/migrations: **UNCHANGED** · Data mutations: **0**

Products P0: **0** · Products P1: **0**

Next: **ADMIN-PRODUCTS-COLLECTION-RESPONSIVE-ARCHITECTURE-1**

No commit. No push. No deploy.

---

## Previous — ADMIN-PRODUCTS-STOCK-AVAILABILITY-CONTRACT-DB-APPLY-1 — PASS (2026-09-09)

Doc: `docs/admin-products-stock-availability-contract-db-apply-1.md`

`PROD-P1-4`: **CLOSED** · `PROD-P2-10`: **CLOSED** · `PROD-P3-13`: **CLOSED IN SOURCE / DEPLOY PENDING**

Products P0: **0** · Products P1: **0**

Migration: `20260909154400_products_stock_availability_contract.sql` → **APPLIED + VALIDATED**. Remote history: `20260909190021_products_stock_availability_contract` (exactamente una vez). Hash pre=post `73536671…890A29` — inmutable. Target: `pkrsedmwxekbhlohhqds` / OrderOps (`.env.local` = `get_project_url`). Single-migration API; **no** `db push`; **0** collateral
Remote trigger: **track_stock-aware** — `BEFORE INSERT OR UPDATE OF stock, track_stock, is_available`; `IF track_stock=true AND stock<=0 THEN is_available=false`; sin auto-reactivación
Contract: untracked stock0 → availability preservada · tracked stock0 → unavailable · restock → no auto-reactivate · manual unavailable → preserved · enable track_stock at zero → unavailable
DB matrix: **PASS 9/9** (`BEGIN…ROLLBACK`) · probe rows after rollback: **0**
Historical backfill: **NONE** · counts pre=post (untracked0 avail 1 / unavail 16 · tracked0 avail 0 / unavail 0 · products 20) · Public available count: **4 UNCHANGED**
Persistent QA product mutations: **0** · RLS: UNCHANGED · create_order / ledger / restock: UNCHANGED / FROZEN
Runtime/CSS this phase: **UNCHANGED** · App source improvements (helper/copy/inline error): **LOCAL / UNDEPLOYED**
Targeted verify: **PASS** · diff: **PASS**

Remaining Products P1: **NONE**

Next: **ADMIN-ACTION-REDIRECT-PASSTHROUGH-FIX-1**

No commit. No push. No deploy.

---

## Previous — ADMIN-PRODUCTS-STOCK-AVAILABILITY-CONTRACT-FIX-1 — PASS WITH DB APPLY REQUIRED (2026-09-09)

Doc: `docs/admin-products-stock-availability-contract-fix-1.md`
Migration: `supabase/migrations/20260909154400_products_stock_availability_contract.sql`

`PROD-P1-4`: **IMPLEMENTED / APPLY REQUIRED** · `PROD-P2-10`: **IMPLEMENTED** · `PROD-P3-13`: **CLOSED**

Contract: `track_stock=false` → stock **no** controla availability · `track_stock=true + stock<=0` → unavailable · restock → **sin** auto-reactivación · unavailable manual se conserva
Trigger: `auto_suspend_out_of_stock_product` + `tr_auto_suspend_out_of_stock` — evento `BEFORE INSERT OR UPDATE OF stock, track_stock, is_available`; fuerza `is_available=false` sólo si tracked y stock≤0; **nunca** setea true. Incluye `is_available` en el evento para que el toggle inline no pueda dejar tracked+0 disponible
App: helper `resolveEffectiveProductAvailability` en create (requested true) y edit (requested form) · `setProductAvailabilityAction` pre-check ahora lee `stock, track_stock` y deniega enable con error de dominio si tracked+0
Copy Create+Edit: copy stale “se implementará en una fase posterior” / “solo prepara…” eliminado; copy preciso de descuento automático + sin auto-reactivación al reponer
Migration: **AUTHORED / NOT APPLIED** — gate `AUTORIZO_PRODUCTS_STOCK_AVAILABILITY_DB_APPLY` **ABSENT** → STOP antes de remote write. Sin backfill. RLS `20260909040000` inmutable. `create_order` / ledger / restock: **UNTOUCHED**
Targeted verify: **PASS** (`lib/products/admin-products-stock-availability-contract.verify.ts`) · tsc: **PASS** · diff: **PASS** · DB matrix: **NOT RUN**
Persistent data mutations: **0** · Historical inactive rows: **NO AUTOMATIC BACKFILL**
Runtime/CSS fuera de scope: **UNCHANGED** (sólo actions + create/edit forms + migration + verify + docs)

P0: **0** · Remaining Products P1: `PROD-P1-4` APPLY

Next: **ADMIN-PRODUCTS-STOCK-AVAILABILITY-CONTRACT-DB-APPLY-1**

No commit. No push. No deploy.

---

## Previous — ADMIN-PRODUCTS-RLS-ROLE-ENFORCEMENT-DB-APPLY-1 — PASS (2026-09-09)

Doc: `docs/admin-products-rls-role-enforcement-db-apply-1.md`

`PROD-P1-2`: **CLOSED** — enforcement aplicada y probada en la DB viva, no sólo autorada.

Migration: `20260909040000_products_manage_role_rls.sql` → **APPLIED + VALIDATED**. Remote history: `20260909070121_products_manage_role_rls` (nombre coincide; el timestamp lo asigna la herramienta de apply, patrón preexistente del repo: los 7 registros remotos previos también difieren del filename local). Hash del archivo **idéntico** antes/después del apply (`A4225056…3516321`) — migration aplicada = inmutable
Target probado: project ref **`pkrsedmwxekbhlohhqds`** (`OrderOps`, ACTIVE_HEALTHY). `.env.local` y `get_project_url` coinciden. El segundo proyecto de la cuenta (`MauroDev`, INACTIVE) **no** se tocó; el ref se pasó explícito en cada call. CLI sin linked target en el workspace
Apply mechanism: **migration API** (`apply_migration`, ejecuta sólo el SQL pasado y registra history). **`supabase db push` se descartó por inseguro**: remote history tiene 7 entradas vs ~30+ migrations locales → habría intentado un lote colateral (condición de STOP). Sin manual-SQL silencioso. **No collateral synchronization**
Products mutation RLS: **ROLE-GATED REMOTELY** — INSERT/UPDATE/DELETE exigen `(business_id AND role) OR super_admin`; UPDATE con **USING + WITH CHECK**
Product image mutation RLS: **ROLE-GATED REMOTELY** — bucket + carpeta tenant + shape + gate de rol; UPDATE con USING + WITH CHECK
Introspección `pg_policies`: 8 policies, `'operator'`/`'viewer'` en **0** allow-lists mutativas · Reads **UNCHANGED** (`products_select_own_business`, `products_select_available_public`, `product_images_public_read`) · Storage DELETE: **ABSENT / DEFERRED** (PROD-P3-15, count 0)
Runtime role matrix: **PASS** — ejecutada como `current_user = authenticated` con `request.jwt.claims.sub` real, dentro de `BEGIN … ROLLBACK`. **No** service_role (bypasearía RLS y no probaría nada). Roles sin principal real (`owner`/`manager`/`viewer`) se ejercieron toggleando el rol del perfil de prueba dentro de la misma transacción revertida
**Antes → después** (own tenant): `operator` **ALLOW → DENY** · `viewer` **ALLOW → DENY** (UPDATE/INSERT/DELETE y storage INSERT) · `owner`/`admin`/`manager`: ALLOW (sin cambio) · foreign tenant: DENY · anonymous mutation: DENY · `super_admin`: ALLOW preservado. El run pre-apply es la prueba de que el agujero era **real y explotable**
Reads post-apply confirmados abiertos: `operator` y `viewer` ven los 18 productos de su tenant; `anon` ve los 4 disponibles del catálogo público
Persistent business-data mutations: **0** — rol del perfil de prueba restaurado a `operator`, profiles 5, auth users 5, filas `RLS-PROBE` 0, objetos probe 0, `product-images` 48, businesses 4. Única mutación persistente: **policy definitions + 1 fila de migration history**
Targeted verify: **PASS** (pre y post apply) · Remote policy introspection: **PASS** · diff: **PASS** · Runtime/CSS/actions/trigger/`create_order`/schema: **UNCHANGED** · Sin tsc/build/lint/browser
SYSTEM-WIDE RLS HARDENING (orders, order_items, categories, businesses, profiles, otras storage policies): **STILL FOLLOW-UP / OUT OF SCOPE**

P0: **0** · Remaining Products P1: **`PROD-P1-4`** (trigger stock-0 auto-suspend ignora `track_stock`; create default `stock=0` → producto nace invisible)

Next: **ADMIN-PRODUCTS-STOCK-AVAILABILITY-CONTRACT-FIX-1**

No commit. No push. No deploy.

---

## Previous — ADMIN-PRODUCTS-RLS-ROLE-ENFORCEMENT-1 — PASS WITH DB APPLY REQUIRED (2026-09-09)

Doc: `docs/admin-products-rls-role-enforcement-1.md`
Migration: `supabase/migrations/20260909040000_products_manage_role_rls.sql`

`PROD-P1-2`: **IMPLEMENTED LOCALLY · REMOTE DB STILL OPEN** — la migration existe como archivo; **no** se aplicó a ninguna DB. No se declara CLOSED.

Products mutation RLS: **ROLE-GATED** — INSERT/UPDATE/DELETE pasan de `business_id OR super_admin` a `(business_id AND role) OR super_admin`. UPDATE conserva **USING + WITH CHECK** (no se puede mover un producto a otro tenant)
Product image mutation RLS: **ROLE-GATED** — `product_images_insert/update_own_business` mantienen bucket + carpeta tenant + shape de path, y suman el gate de rol. **Sin** rama super_admin (hoy ya falla la carpeta por `business_id NULL`; se preserva)
Role model **probado desde schema**, no asumido: `profiles.role` es **text + CHECK** (`profiles_role_valid`), no enum → `admin|owner|manager|operator|viewer|super_admin`. `canManageProducts` = owner||manager, y `normalizeBusinessAdminRole` pliega `super_admin|admin|owner`→owner ⇒ allow-list tenant-scoped `('owner','admin','manager')` + rama super_admin existente. `operator`/`viewer`: **0 apariciones** en el SQL
Tenant isolation: **PRESERVED** (tenant y rol van **AND**, nunca OR) · Reads: **NO endurecidos** — `products_select_own_business`, `products_select_available_public` y `product_images_public_read` intactos (el hallazgo era mutar, no leer) · Storage DELETE: **no agregado** (PROD-P3-15)
Application `manageProducts`: **UNCHANGED / FROZEN** — sin checks redundantes en app; esto es defense-in-depth en DB
Targeted verify: **PASS** (`lib/products/admin-products-rls-role-enforcement.verify.ts`, parser de statements/clauses con balance de paréntesis; la allow-list SQL se compara contra `canManageProducts()` importado, así no pueden divergir). **Mutation-tested**: agregar `'operator'` → FAIL · quitar `WITH CHECK` del UPDATE → FAIL · restaurado → PASS
Local DB role matrix: **NOT RUN — SAFE LOCAL DB UNAVAILABLE** (`.env.local` apunta a un proyecto remoto `*.supabase.co` y el daemon de Docker no corre). **No** se usó producción como sustituto
Remote DB apply: **NOT AUTHORIZED / NOT RUN** · Runtime TSX/CSS: **UNCHANGED** · `actions.ts` / `context.ts` / `permissions.ts`: **UNCHANGED** · trigger / `create_order` / schema / FKs: **UNTOUCHED** · migrations históricas: **sin modificar** · Data mutations: **0**
SYSTEM-WIDE RLS HARDENING (orders/categories comparten el patrón tenant-only): **FOLLOW-UP / OUT OF SCOPE**
Sin tsc (sólo SQL + verify nuevo) · diff: **PASS**

P0: **0** · Remaining P1: `PROD-P1-2` (apply pendiente) · `PROD-P1-4` (trigger stock-0 auto-suspend)

Next: **ADMIN-PRODUCTS-RLS-ROLE-ENFORCEMENT-DB-APPLY-1** (aplicar + validar matriz owner/manager allow, operator/viewer deny, foreign tenant deny), luego `ADMIN-PRODUCTS-STOCK-AVAILABILITY-CONTRACT-FIX-1`

No commit. No push. No deploy.

---

## Previous — ADMIN-PRODUCTS-SEARCH-EMPTY-STATE-RESILIENCE-FIX-1 — PASS (2026-09-09)

Doc: `docs/admin-products-search-empty-state-resilience-fix-1.md`

`PROD-P1-3`: **CLOSED** · `PROD-P1-1`: **CLOSED** · `PROD-P3-9`: **CLOSED** · `PROD-P3-4`: **CLOSED (semántica del toolbar) / DEFERRED (duplicación de summaries + métricas page-scoped del catalog header)**

Search punctuation: **RESILIENT** — el valor va **entre comillas dobles** en el `or()` de PostgREST (`name.ilike."%a,b%",sku.ilike."%a,b%"`), con `"` y `\` escapados; nada se borra ni se reescribe. `?q=a,b` pasó de romper la página a **HTTP 200**. Probado también `Pizza (grande)`, `producto "especial"`, `producto\test`, `combo: familiar`, `combo 2.0` → 200. Significado preservado: `Coca Cola` matchea, `Coca, Cola` **no** (un fix que borrara puntuación habría matcheado)
Catalog empty vs filtered empty: **SEPARATED** — `catalogTotalCount` (total del tenant, **sin filtros**, query count-only `head:true` scoped por `business_id`) vs `filteredTotalCount` (`AdminProductsPageResult.totalCount`, sólo para collection + paginación). `resolveEmptyCatalogFlyoutMode({ categoriesCount, catalogTotalCount })` **no recibe** el filtered count → un filtro sin resultados no puede autoabrir Create Product. Eliminado el probe `getAdminProducts({ limit: 1 })` filtrado (ya no se trae una fila para saber si existe catálogo)
Clear filters: **UN solo owner** — `ProductsToolbar` (ya gateado por `hasActiveFilters`, necesariamente true en filtered-empty); `ProductCatalogEmptyState` suelta su botón duplicado y apunta a ese control. Desvío documentado respecto de la preferencia del brief: suprimir el del toolbar exigía empujar estado del server sibling suspendido al cliente — el mismo patrón que causó `PROD-P1-1`. Sin CSS, sin tercer owner
Runtime smoke: **PASS** (1 sesión, 1 viewport 384, 0 mutaciones) — `combo` 6 resultados · `a,b` sin crash · `zzzznoresults` 0 resultados + empty state + `dialogs:0` + `aria-modal:0` + sin create form + **exactamente 1** `Limpiar filtros` · click clear → URL limpia, 18 filas, flyout cerrado
Targeted verify: **PASS** (`lib/products/admin-products-search-empty-state-resilience.verify.ts`) · tsc: **PASS** · diff: **PASS**
Runtime scope: **6 files** — `lib/products/products-list-contracts.ts` (nuevo, puro, sin `server-only` para que el verify lo importe), `lib/products/admin.ts`, `app/admin/(protected)/products/page.tsx`, `products-management-provider.tsx`, `products-toolbar.tsx`, `product-catalog-empty-state.tsx`
CSS: **NONE** · DB/RPC/migrations/trigger/RLS: **UNCHANGED** · Product mutations: **0** · `CATALOG EMPTY` validado por resolver puro + contrato de source (no se vació ningún tenant)
Preservado: `name` OR `sku`, ILIKE, debounce 300ms, URL-driven filtering, pagination reset, `.eq("business_id", businessId)`, `ADMIN_PRODUCTS_PAGE_SIZE`, ordering, category loader · en el provider: `+ Nuevo producto` manual, edit state, `selectedProduct`, close, create-category, create/edit-success
Docs: sólo el doc de fase + este bloque. `docs/products-living-audit.md`, `ORDEROPS_LIVING_MEMORY.md` y `docs/admin-dashboard-forensic-living-audit.md` **sin tocar** (se reconcilian en FINAL QA)

P0: **0** · Remaining P1: `PROD-P1-2` (RLS sin rol) · `PROD-P1-4` (trigger stock-0 auto-suspend)

Next: **ADMIN-PRODUCTS-RLS-ROLE-ENFORCEMENT-1** (`PROD-P1-2`)

No commit. No push. No deploy.

---

## Previous — ADMIN-PRODUCTS-LIVING-AUDIT-1 — LIVING AUDIT ESTABLISHED (2026-09-08)

Source of truth: `docs/products-living-audit.md`

`/admin/products`: **ARCHITECTURE + FUNCTIONAL UX + VISUAL UX AUDITED**

P0: **0** · P1: **4** · P2: **10** · P3: **18**

Desktop: **AUDITED** · Mobile: **AUDITED** · Create/Edit: **AUDITED READ-ONLY** · Search/filter: **AUDITED** · Availability/stock: **AUDITED** · Images: **AUDITED** · A11y: **AUDITED** · Performance: **AUDITED** · Tenant/security: **AUDITED SOURCE-LEVEL**
Los conteos suben respecto del audit previo (P1:1 P2:8 P3:11) porque esta fase añadió las capas **server action / loader / RLS / trigger / storage** que el audit visual no cubría. **Ningún hallazgo previo se cerró.**
**P1 nuevos**: `PROD-P1-2` RLS de `products` (y del bucket) filtra por `business_id` pero **no por rol** → operator/viewer pueden insert/update/**delete** vía PostgREST saltando `manageProducts` (sin exposición cross-tenant) · `PROD-P1-3` una búsqueda con **coma** (`?q=a,b`) rompe la página entera (`getAdminProducts` interpola `q` crudo en el `or()` de PostgREST) · `PROD-P1-4` el trigger `tr_auto_suspend_out_of_stock` fuerza `is_available=false` con `stock<=0` **ignorando `track_stock`**, y create default `stock=0` → **todo producto creado con el stock por defecto nace invisible** (live: 16 productos stock-0 inactivos, 14/18 `Inactivos`)
**P2 nuevos**: `PROD-P2-9` `redirect()` lanza `Error('NEXT_REDIRECT')` y el `catch` compartido lo convierte en mensaje visible (10 action files) · `PROD-P2-10` guardar cualquier edición de un producto con stock 0 re-suspende silenciosamente su disponibilidad
**Correcciones probadas**: `PROD-P2-2` el dual mount duplica **DOM** (447 nodos ocultos de 930) pero **no imágenes** (lazy + `display:none` → 0 cargadas) ni es riesgo a11y/teclado · `PROD-P2-7` mobile **sí** puede editar (card = `div[role=button]` con `aria-label`, `onKeyDown`, 311×74); la brecha real es stock/SKU a simple vista, toggle inline y **paginación** · `PROD-P2-1` es deuda de infra **preexistente y bloqueada** por autorización de billing (`PUBLIC-CATALOG-IMAGE-TRANSFORMS-INFRA-1-MODE-B`, 2026-07-29), no un bug de Products
Contratos fijados: sin **delete** en ningún lado · sin dirty state ni Cancel en edit · create **no cierra** el flyout, edit sí · `category_id` NOT NULL + `ON DELETE RESTRICT` (no hay productos sin categoría) · sin `updated_at` ni columna de orden · SKU sin índice único · imagen no se puede **quitar**, solo reemplazar
Runtime changes: **NONE** · CSS: **NONE** · Data mutations: **NONE** · DB/RPC/migrations: **UNCHANGED** (solo SELECT read-only para verificar schema/trigger)
Docs: nuevo `docs/products-living-audit.md` · `docs/admin-dashboard-forensic-living-audit.md` corregido (puntero + dual mount 900px) · `ORDEROPS_LIVING_MEMORY.md` **sin tocar**

Next: **ADMIN-PRODUCTS-SEARCH-FILTER-SANITIZATION-FIX-1** (`PROD-P1-3`), luego `ADMIN-PRODUCTS-EMPTY-STATE-FLYOUT-AUTOOPEN-FIX-1` (`PROD-P1-1`)

No commit. No push. No deploy.

---

## Previous — ADMIN-PRODUCTS-MOBILE-VISUAL-DEBT-AUDIT-1 — AUDIT COMPLETE (2026-09-08)

Doc: `docs/admin-products-mobile-visual-debt-audit-1.md`

P0: **0** · P1: **1** · P2: **8** · P3: **11**

`/admin/products`: **AUDITED** · Mobile: **AUDITED** (360 / 390 / 412-class / 719 / 899 / 1024 / 1440) · Light/dark: **AUDITED** (toggle real `html[data-dashboard-theme]`, restaurado a light) · Create/edit: **AUDITED READ-ONLY** · Console: **AUDITED**
Ownership: mobile = card grid (`product-grid-server` → `product-card`), desktop ≥900 = `<table>` (`product-table-view`); switch en `product-catalog-views` con **dual mount** (ambos montados, uno oculto por CSS)
Breakpoints reales Products: 479/480 · 640 · 720 · 767/768 · banda 768–899 · **900** (tabla↔grid) · **961** (flyout) · 1024 · 1440
**P1-1**: una búsqueda/filtro sin resultados **auto-abre el flyout "Nuevo producto"** tapando el empty state correcto — causa probada: `page.tsx` calcula `totalCount` con `filterOptions` aplicados y `resolveEmptyCatalogFlyoutMode()` lo interpreta como catálogo vacío
P2 destacados: imágenes sirven el **original completo** (transform endpoint **403** → fallback `unoptimized`; **2.2 MB** para un slot de 71×72, overscale 10.8×, 23 round-trips fallidos de 530–900 ms) · dual mount duplica DOM (**38 `<img>` para 18 productos**) · **8 de 9** targets táctiles mobile <44px (solo el burger 44×44 cumple) · footer sticky del form **sin superficie** (tapa el label `SKU` en create y edit) · flyout con `aria-modal` pero **sin focus management** (Escape no cierra, sin foco inicial, 9–11 tabbables afuera) · contraste **light** de texto terciario **2.56:1** · mobile sin stock/SKU/**toggle de disponibilidad**
Next Image quality: **CONFIRMED** — warning server-side de Next 16.2.9 (`images.qualities` ausente → default `[75]`; 3 callsites en 80, uno del **catálogo público**; `warnOnce` = 1 por src único). **Inerte**: con transforms en 403 las imágenes van por la ruta `unoptimized` y `quality` no se aplica → **P3**, no es el problema de imágenes prioritario
Store session hydration: **NOT REPRODUCED en Products → CASE A** — owner fuera de Products (`admin-dashboard-orders.tsx` + `dashboard/actions.ts`), gateado por `NODE_ENV === "development"`, non-redirecting por diseño; **3/3 ciclos de focus** sin logs, sin requests, sin redirect, UI intacta
Otro hallazgo con owner externo: error de hidratación intermitente en `app/admin/(protected)/layout.tsx (28:7) @ ProtectedAdminLayout` (visto una vez, no reproducido) — **no** es deuda de Products
Console en carga estable: **0 errores / 0 warnings** en browser · Scroll 390: **1 solo owner** (document), sin scroll anidado ni horizontal, último item completo, footer usable
Runtime changes: **NONE** · CSS: **NONE** · Data mutations: **NONE** (0 productos creados/editados/borrados, 0 availability, 0 uploads, 0 crops) · DB/RPC/migrations: **UNCHANGED**
Sin tsc/build/lint/verify (no hubo cambios de runtime). `ORDEROPS_LIVING_MEMORY.md` y forensic audit: **sin tocar** (audit-only). Screenshots fuera del repo.
Dirty preexistente preservado: `docs/admin-manual-order-modal-commit-push-deploy-1.md`, `tsconfig.tsbuildinfo`

Next: **ADMIN-PRODUCTS-EMPTY-STATE-FLYOUT-AUTOOPEN-FIX-1**

No commit. No push. No deploy.

---

## Previous — ADMIN-MANUAL-ORDER-MODAL-COMMIT-PUSH-DEPLOY-1 — PASS — MANUAL ORDER MODAL POLISH PACKAGE DEPLOYED (2026-09-08)

Doc: `docs/admin-manual-order-modal-commit-push-deploy-1.md`

Package commit: **`13abcc08c8ae7093c359e9e6fdf7dfe7f9bce7e1`** — `feat(admin): polish manual order modal` (29 files, +9778/−224). Es **el** commit funcional del modal.
Evidence commit: **`c9af635e27ad86e0731eea0a90b16b9b628d5aa6`** — `docs(admin): record manual order modal deploy and smoke evidence` (docs-only)
HEAD / origin/main: **`c9af635e27ad86e0731eea0a90b16b9b628d5aa6`** (HEAD == origin/main, divergence `0 0`; pushes non-force `3e418bb..13abcc0` y `13abcc0..c9af635`)
Package deployment: **`dpl_6YqdcSPSpR6J4cjNtdsSZwPQiL5w`** — source `13abcc0`, **READY** (Git integration, source commit confirmado)
Current production deployment: **`dpl_FVAi6XWbCscbtUBh139ygtLYug81`** — source `c9af635`, **READY**; el alias apunta a este deployment
Producción: **https://orderops.vercel.app** — HEALTHY (root 200, catálogo 200, `/admin/login` 200, `/admin/dashboard` 307)
Clarificación: el evidence commit es **docs-only**, así que el runtime productivo actual es idéntico al paquete certificado en `13abcc0`
Relevant verifies: **15/15 PASS** · tsc: **PASS** · build: **PASS** · lint: **KNOWN TOOLING DEBT ONLY** (ESLint 9 circular JSON)
Runtime: **DEPLOYED / FROZEN** — fingerprint `9BA3B67C…F5D6` MATCH exacto antes de stagear (5 archivos, 1061/216); no se modificó nada durante el release
P0: **0** · P1: **0**
P2-QA1: **CLOSED** · P2-QA2: **ACCEPTED NON-BLOCKING** · P3-QA1 / P3-QA2: **DOCUMENTED**
Manual order modal: **DEPLOYED / FROZEN**
Production authenticated modal smoke: **UNAVAILABLE** (redirige a `/admin/login`; deuda aceptada)
DB / RPC / migrations: **UNCHANGED** · Orders created during release: **0** · status mutations: **0** · WhatsApp sends: **0**
Staged post-release: **none** · remanente dirty: `tsconfig.tsbuildinfo` (generated noise excluido) + esta reconciliación documental (`CURRENT_PHASE.md` y el doc de release), deliberadamente **sin commitear** para no disparar otro deployment docs-only; viajan con el próximo paquete normal

Next: **ADMIN-PRODUCTS-MOBILE-VISUAL-DEBT-AUDIT-1**

---

## Previous — ADMIN-MANUAL-ORDER-MODAL-VERIFY-RECONCILIATION-1 — PASS — MANUAL ORDER MODAL VERIFY SUITE RECONCILED (2026-09-08)

Doc: `docs/admin-manual-order-modal-verify-reconciliation-1.md`

P0: **0** · P1: **0**
P2-QA1: **CLOSED** — reconciliadas **7** assertions stale (no 5): las 2 extra (`breakpoint` L538 `tabIndex` file-wide, `form-validation` L438 `querySelector`) estaban **enmascaradas** porque cada verify aborta en su primera falla; ambas dentro de los 5 archivos ya autorizados y con las mismas dos causas raíz (focus containment certificado + microcopy aprobado)
Relevant verifies: **15/15 PASS** (targeted 5/5 PASS, 0 fallas nuevas)
Runtime: **UNCHANGED** — hash del diff de runtime idéntico al inicio de fase (`9BA3B67C…F5D6`, 5 archivos, 1061/216)
CSS: **UNCHANGED** · Visual/UX block: **FROZEN**
Guards preservados: P1-3 scroll por ref (única query DOM = `container.querySelectorAll` en el helper de focusables, `deepEqual`), focus trap dialog-local, sin mutación de tabindex ni tabindex positivo, single-scroll, condición del orphan-upsell + terminología `pedido`, gate de safety `!isManualOrderAvailable → openConfigure`, ausencia de copy device-specific
P2-QA2: **ACCEPTED NON-BLOCKING PRODUCT DEBT**
P3-QA1 / P3-QA2: **DOCUMENTED**
tsc: **PASS** · diff: **PASS**
build: **NOT RUN** — runtime sin cambios, build ya PASS en Final QA
lint: **NOT RUN** — deuda de tooling conocida ya certificada
Sin browser QA, sin órdenes, sin mutaciones, nada staged. `ORDEROPS_LIVING_MEMORY.md` y forensic audit: **sin tocar** (ya reconciliados en Final QA)

Next: **ADMIN-MANUAL-ORDER-MODAL-COMMIT-PUSH-DEPLOY-1**

No commit. No push. No deploy.

---

## Previous — ADMIN-MANUAL-ORDER-MODAL-FINAL-VISUAL-QA-1 — PASS WITH ACCEPTED NON-BLOCKING DEBT — MANUAL ORDER MODAL VISUAL/UX BLOCK CLOSED (2026-09-08)

Doc: `docs/admin-manual-order-modal-final-visual-qa-1.md`

P0: **0** · P1: **0**
P2: **2 aceptados no bloqueantes** — (P2-QA1) 5 assertions stale en verifies históricos, deuda sólo de tests; (P2-QA2) un ticket cargado se descarta al cerrar sin confirmación, agravado porque el overlay del shell es el primer tab stop
P3: **2 documentados** — (P3-QA1) `Requiere personalización` vs vocabulario "Configurar"; (P3-QA2) `Opcional · máx. 5` y `Opcional · máx. 5 opciones` visibles a la vez
All modal P1: **CLOSED** (P1-1, P1-2, P1-3, P1-4 verificados en runtime)
Visual hierarchy: **FROZEN** · Ticket hierarchy: **FROZEN** · Surface materiality: **FROZEN** · Accessibility interaction: **FROZEN** · Microcopy: **FROZEN** · Single-scroll: **FROZEN** · Validation: **FROZEN**
Pricing / domain / payload / server / RPC / DB: **UNCHANGED**
Runtime tocado en esta fase de QA: **NINGUNO** (diff idéntico al preflight; `HEAD` `3e418bb`, nada staged)
Cobertura: widths **360/390/412/719/899/900/1023/1024/1440** en light + dark vía el toggle real (`html[data-dashboard-theme]`, nunca `prefers-color-scheme`)
P1-4 (900–1023): **GATE PASS** — grid intermedio `135.98px 44px` intacto en 900 light, 900 dark y 1023 dark; cero colisiones, cero overflow, add 44×44
P1-3: **VERIFICADO** — compose 338 → configurador entra en 0 → `Volver` restaura 338 exacto
P1-2: **PASS 6/6** — A/B disabled, C enabled, D exige dirección, E enabled, F vuelve a Retiro con el valor tipeado preservado
Single-scroll: **1 owner** (`manual-order-modal__body`) en ≤899; en 900+ los dos panes del workstation scrollean por diseño
Touch targets: **todos ≥44** medidos a 360 (add, ticket −/+, `Quitar` 60×44, stepper configurador, segmented 88×44, search, close)
Keyboard (900 light): 20 focusables, **0 `tabindex` positivo**, Tab y Shift+Tab envuelven con `preventDefault`, Tab intermedio no interceptado, foco nunca sale del diálogo, Escape cierra, return focus vuelve al opener
Contraste: **10.79:1 – 16.94:1** en dark; ningún texto informativo ilegible (P2-7 confirmado mejorado)
Verifies: **10 PASS / 5 FAIL**, los 5 clasificados **B (assertion stale)** — cero clase A, cero clase C; **ninguno editado**
Static: tsc **PASS** · diff-check **PASS** · build **PASS** · lint **FAIL con la deuda de tooling conocida e idéntica** (ESLint 9.39.4, circular JSON del plugin React)
Producción autenticada: **UNAVAILABLE** (redirige a `/admin/login`; no se pidieron ni adivinaron credenciales)
Orders created: **0** (7 códigos idénticos al baseline) · Status mutations: **0** · WhatsApp sends: **0**
Living memory y forensic audit: **RECONCILIADOS** en esta fase

Next: **ADMIN-MANUAL-ORDER-MODAL-VERIFY-RECONCILIATION-1** (cerrar P2-QA1) y luego **ADMIN-MANUAL-ORDER-MODAL-COMMIT-PUSH-DEPLOY-1**

No commit. No push. No deploy.

---

## Previous — ADMIN-MANUAL-ORDER-MODAL-MICROCOPY-CONSISTENCY-POLISH-1 — PASS — MANUAL ORDER MICROCOPY CONSISTENT (2026-09-08)

Status: **PASS** — sólo copy estático propiedad de OrderOps

Doc: `docs/admin-manual-order-modal-microcopy-consistency-polish-1.md`

Alcance real: **1 archivo runtime, 6 strings** (`manual-order-modal.tsx`) · CSS: **NINGUNO** · `manual-order-customization-panel.tsx`: **sin cambios** (su copy ya cumplía)
Touch-specific wording: **REMOVED** — `Tocá + para configurar opciones antes de agregar.` → `Configurá las opciones antes de agregarlo.` (era la única línea que nombraba un gesto y un glifo)
Jerga interna: **REMOVED** — `Usá el catálogo hasta habilitar el selector manual.` → `Todavía no se puede agregar a un pedido manual.`
Terminología **Pedido**: **CONSISTENT** — `Ticket en construcción` → `Resumen del pedido` · `Revisá el ticket.` → `Revisá el pedido.` ("Ticket" ya no aparece en copy visible; sobrevive sólo en identificadores y clases CSS)
Empty ticket: `Pedido vacío` → `Todavía no agregaste productos` · `Agregá productos desde el catálogo para armar el pedido.` → `Agregá productos para armar el pedido.`
Configurator subtitle: **CONCISE** — `Elegí las opciones del pedido tomado en el local.` → `Elegí las opciones para este producto.` (más corto y sin presuponer canal)
Accessible labels: **GRAMMATICALLY CORRECT** — `Cerrar ${shellTitle.toLowerCase()}` ("Cerrar configurar milanesa") → `Cerrar configuración de ${producto}`
Labels de cierre compose/overlay: **SIN CAMBIOS** (decisión A) — `Cerrar nuevo pedido manual` + `Salir del pedido manual` siguen siendo gramaticales y **distintos entre sí**; unificarlos habría duplicado el nombre accesible de dos controles, el defecto que cerró la fase anterior. **Cero verify surgery**
Deferidos con causa: `Requiere personalización` (el texto real es `MANUAL_ORDER_CUSTOMIZATION_UNAVAILABLE_REASON` en `lib/orders/manual-order-customization-eligibility.ts`, fijado por su safety verify; el literal del modal es sólo el fallback del `??`) · `Opcional · máx. N opciones` (lo genera `formatQuantityGroupMeta` en `selection-v2.ts`, **compartido con el checkout público**)
CTA compose (`Agregá productos` / `Completá los datos obligatorios` / `Crear pedido · $ X` / `Creando pedido...`) y CTA configurador (`Completá las opciones` / `Agregar · $ X` / `Volver`): **VERBATIM**, precedencia incluida
Contenido del negocio (producto, categoría, grupos, descripciones, opciones, notas, cliente) y `Adicional` (`UPSELL_ASSOCIATED_LABEL`, compartido): **INTACTO**
Interaction / validation / `canSubmit` / `requiredFormReady` / `configureDraftValid` / pricing / ticket helpers / snapshots / payload / actions / server / RPC / DB / dashboard / workspace / public catalog: **UNCHANGED**
`globals.css` / `theme-tokens.css` / `Button`-`Input`-`Card` / shell: **UNCHANGED**
P1-1 / P1-2 / P1-3 / P1-4: **CLOSED** · tap targets >=44: **PRESERVED** · focus containment y return focus: **PRESERVED** · single-scroll: **FROZEN** · ticket hierarchy y materiality: **PRESERVED** · CTA/footer: **PRESERVED**
Verify nuevo: `admin-manual-order-modal-microcopy-consistency` **PASS** — chico y basado en intención (no snapshot de texto): prohíbe wording device-specific y jerga técnica en copy visible, fija ambos contratos de CTA con precedencia, exige `pedido` sobre `ticket`, y re-fija condiciones funcionales e invariantes de foco
Static checks: tsc **PASS** · diff-check **PASS** · verifies históricos / build / lint / browser QA: **NO EJECUTADOS** (por instrucción)
Sin browser smoke: 5 de 6 strings son más cortos; el único más largo vive en un `display: grid` de alto automático sin `nowrap` ni `line-clamp`, y ningún string nuevo entra en un botón ni en el header
Orders created: **0** · Status mutations: **0** · WhatsApp sends: **0**
`ORDEROPS_LIVING_MEMORY.md` y `docs/admin-dashboard-forensic-living-audit.md`: **NO ACTUALIZADOS** (se reconcilian en FINAL-VISUAL-QA)

Next phase: **ADMIN-MANUAL-ORDER-MODAL-FINAL-VISUAL-QA-1**

No commit. No push. No deploy.

---

## Previous — ADMIN-MANUAL-ORDER-MODAL-ACCESSIBILITY-INTERACTION-POLISH-1 — PASS — MODAL ACCESSIBILITY & INTERACTION POLISHED (2026-09-08)

Status: **PASS** — tap targets y focus containment cerrados; sin cambios de lógica ni dominio

Doc: `docs/admin-manual-order-modal-accessibility-interaction-polish-1.md`

Tap targets: **CLOSED** — medidos en runtime a 390: add `44×44`, ticket stepper `44×44`, `Quitar` `44` alto, stepper configurador `44×44`, segmented `44×88` (ambas), search `44` alto, close `44×44`. Glifos y texto **sin cambio de tamaño** (fijado por el verify)
Densidad: **PRESERVADA** — product row conserva `min-height: 52px`; padding vertical 8→6px y `row-gap` 2px sólo en `@media (max-width: 639px)`, donde price y add se apilan. Alturas medidas a 390: **76–78px** (antes ~74–76px)
Focus containment: **CLOSED** — listener de `keydown` sobre el nodo `[role="dialog"]` real vía `dialogRef`; sin listener global, sin query del documento, sin mutar `tabindex`, sin sentinels, sin timers. Lista de focusables recalculada por pulsación → el CTA disabled y la subvista no montada quedan fuera solos
Wrap verificado por evento real: Tab desde el último → `preventDefault` + primero · Shift+Tab desde el primero → `preventDefault` + último · el foco **nunca** sale del diálogo
Initial focus: **PRESERVED** (el del shell, botón de cerrar) — sin autofocus nuevo, sin auto-scroll
Return focus: **IMPLEMENTED** — el opener se captura en un *layout effect* porque el shell mueve el foco en un passive effect y los passive effects corren hijo→padre; verificado: trigger enfocado → abrir → Escape → el foco vuelve a `Crear nuevo pedido manual`
Escape: **UNCHANGED** (sigue siendo del shell) — verificado cerrando el modal
Close semantics: **FIXED** — el shell nombraba `Cerrar detalle del pedido` en **overlay y botón a la vez**; ahora el modal pasa `closeLabel="Cerrar nuevo pedido manual"` (o `Cerrar configurar {producto}`) y `overlayLabel="Salir del pedido manual"`. Defaults del shell preservan los nombres previos
Focus-visible: **COMPLETED** en compose — agregado a `__quantity-button` y al segmented vía `:has(input:focus-visible)`; ya existía en add, `Quitar` y search. Sin `:focus` genérico y sin `outline: none` sin reemplazo. Selected (familia accent) y focused (`--focus`) siguen distinguibles
Tab order: **VISUAL** — sin `tabindex` positivo: overlay → cerrar → nombre → teléfono → Retiro/Delivery → buscar → acciones de producto → stepper/`Quitar` → notas → Cancelar
Shell del modal: **EXTENDIDO SIN BREAKING CHANGE** — 4 props opcionales con default (`dialogRef`, `closeLabel`, `overlayLabel`, `closeClassName`); `admin-order-workspace-modal.tsx` no pasa ninguna y queda intacto (fijado por el verify)
P1-1 / P1-2 / P1-3 / P1-4: **CLOSED** → los 4 P1 del modal siguen cerrados
Single-scroll: **FROZEN** — la contención es sólo de teclado; siguen siendo 2 los `overflow-y: auto`, sin `scrollIntoView`, sin scroll de window, sin scroller nuevo
Validación / pricing / ticket domain / payload / `createManualOrderAction` / `create_order` RPC / DB / public catalog / dashboard frozen surfaces: **UNCHANGED**
`app/globals.css` / `app/theme-tokens.css` / `Button`-`Input`-`Card` compartidos / CSS del shell: **UNCHANGED** · tokens globales nuevos: **NINGUNO**
Archivos runtime modificados: **4** (`manual-order-modal.tsx`, `manual-order-modal.module.css`, `manual-order-customization-panel.module.css`, `admin-order-modal-shell.tsx`)
Runtime smoke: **390 (targets) + 900 (teclado)** · Orders created: **0** · Status mutations: **0** · WhatsApp sends: **0**
Static checks: tsc **PASS** · diff-check **PASS** · build **NO EJECUTADO** (por instrucción) · lint **NO EJECUTADO** (por instrucción)
Verifies: nuevo `admin-manual-order-modal-accessibility-interaction-polish` **PASS** + 3 del set autorizado **PASS** (4/4)
Excepción de scope autorizada: **2 assertions stale** actualizadas conservando intención protectora (verify del ticket: stepper `28×28` → `>=44px`; verify del configurador: prohibición global de `useLayoutEffect` → guard dirigido de que la entrada de scroll sigue siendo `useEffect` plano y ningún layout effect toca `scrollTop`)
Nota de método: `browser_press_key` no reproduce Tab de forma fiable en este entorno (devolvía siempre el close); la evidencia válida vino de despachar `keydown` real y leer `defaultPrevented` + `document.activeElement`
Deuda restante: microcopy consistency · QA en producción con auth real · final visual QA · el overlay del shell sigue siendo un `button` full-screen y por eso encabeza el tab order (se dejó así para no cambiar el shell para el otro consumer)
`ORDEROPS_LIVING_MEMORY.md` y `docs/admin-dashboard-forensic-living-audit.md`: **NO ACTUALIZADOS** en esta microfase (se reconcilian en FINAL-VISUAL-QA / checkpoint)

Next phase: **ADMIN-MANUAL-ORDER-MODAL-MICROCOPY-CONSISTENCY-POLISH-1** o, si no queda deuda de microcopy, **ADMIN-MANUAL-ORDER-MODAL-FINAL-VISUAL-QA-1**

No commit. No push. No deploy.

---

## Previous — ADMIN-MANUAL-ORDER-MODAL-SURFACE-MATERIALITY-POLISH-1 — PASS — MODAL SURFACE MATERIALITY POLISHED (2026-09-08)

Status: **PASS** — P2-1, P2-3, P2-4 y P2-16 cerrados; P2-7 mejorado localmente; sólo presentación

Doc: `docs/admin-manual-order-modal-surface-materiality-polish-1.md`

P2-1 affordance inversion de product rows: **CLOSED** (causa raíz: `border: 1px solid transparent` en `__product-row` — las simples quedaban pegadas al panel y las configurables parecían más interactivas sólo porque su `:hover` sí pintaba borde; ahora todas comparten base level 2 y la configurable añade sólo `--mo-accent-hint-*`)
P2-3 dos lenguajes de acento: **CLOSED LOCALLY** (el configurador ya usaba `--accent-primary`/`--accent-soft` y compose usaba `--focus` `#6366f1` para lo mismo; compose se alineó a la familia accent-primary y `--focus` quedó reservado a `:focus-visible`, fijado por el verify bloque a bloque)
P2-4 materialidades distintas compose/configurator: **CLOSED** (`.group` y `.quantitySection` pasaron a la misma familia level 1 que las section cards de compose, reemplazando `--shadow-sm` por `--mo-shadow-section`; `.optionButton`/`.qtyOptionCard` pasaron a level 2)
P2-7 `--text-tertiary` tenue en light: **IMPROVED LOCALLY** (`--mo-text-aux` = `color-mix(--text-secondary 80%, --text-tertiary)` sólo en `__product-blocked-hint`, `__summary-group-label`, `.basePrice`, `.quantityHint`; nombre de producto sigue primary y categoría sigue secondary — sin reemplazo indiscriminado)
P2-16 inputs/segmented/rows planos: **CLOSED** (causa raíz: `--border-subtle` es sólo `rgba(255,255,255,0.08)` en dark y los inputs compartían `background: var(--bg-surface)` con su propia section card)
Escala material feature-local: **3 NIVELES** (`--mo-surface-section`/`--mo-border-section`/`--mo-shadow-section` para level 1; `--mo-surface-row`/`--mo-border-row` para level 2) declarada sobre `.manual-order-modal__form` y **redeclarada** sobre `.panel` para que el configurador sea autosuficiente
Fórmula cross-theme: **UNA SOLA** (las rows se mezclan siempre hacia `--bg-surface-soft`, más oscuro que la section en light y más claro en dark) · medido dark: section `rgb(23,24,29)` vs row `srgb(0.111,0.115,0.134)`, hairline `0.08 → 0.1`
Segmented Retiro/Delivery: **TRACK RECESSED + ACTIVO LEVANTADO** con borde accent-tinted, `font-weight: 600` y `--mo-shadow-raised`; **tamaños sin cambio** (el borde de 1px se compensa `6px 12px → 5px 11px`; medido: ambas opciones `32 × 88px`)
Inputs: **RECESSED** contra la section card (light: input `srgb(0.968,0.977,0.986)` sobre section `rgb(255,255,255)`) — un campo completo ya no se lee como focused; tratamiento de focus intacto
Empty ticket: **POLISHED** (superficie level 2 + dashed border a 24% en dark en lugar de un outline invisible; sin ilustración, sin lógica, sin cambio de copy)
Tokens globales nuevos: **NINGUNO** · `prefers-color-scheme`: **NINGUNO** (override dark vía `:global(html[data-dashboard-theme="dark"])`)
Excepción documentada: `__header-badge` conserva mezclas literales porque el shell lo renderiza como `headerMeta`, fuera de `.manual-order-modal__form`, y no puede ver las variables locales
Ticket hierarchy: **PRESERVED** (root, grupos, `×N`, columnas de precio, micro-superficie `Adicional`, arreglo stepper/`Quitar`, jerarquía del total) — sólo micro-ajustes de superficie
CTA/footer: **PRESERVED** (disabled scoped `opacity: 1` + `not-allowed`, azul enabled, monto sin wrap, fade y sombra) — dominante sólo enabled
P1-1: **CLOSED** · P1-2: **CLOSED** · P1-3: **CLOSED** · P1-4: **CLOSED** → **los 4 P1 del modal siguen cerrados**
Single-scroll: **FROZEN** (único owner medido `manual-order-modal__body`; siguen siendo 2 los `overflow-y: auto`; sin `position: fixed` nuevo)
Tap targets: **SIN TOCAR** (stepper 28×28, add 34×34, stepper configurador 30×30, segmented 32px, search 38px) — fijados por el verify para `ADMIN-MANUAL-ORDER-MODAL-ACCESSIBILITY-INTERACTION-POLISH-1`
Runtime smoke: **390 light + 390 dark**, estados A/B/C — jerarquía visible, inner rows distinguibles de cards, dark sin aplastarse en gris uniforme
900px: **NO EJECUTADO** (P1-4 no se vio roto; el cambio en la product row es sólo de color y el verify fija el bloque `@media (min-width: 900px) and (max-width: 1023px)` y el grid base)
Validación / pricing / ticket domain / payload / `createManualOrderAction` / `create_order` RPC / DB schema-migrations / public checkout-catalog / dashboard frozen surfaces: **UNCHANGED**
`app/globals.css` / `app/theme-tokens.css` / `Button`-`Input`-`Card` compartidos / shell del modal: **UNCHANGED** (la escala `--mo-*` no se filtró a los tokens globales)
Archivos runtime modificados: **2** (`manual-order-modal.module.css`, `manual-order-customization-panel.module.css`) · TSX: **NONE**
Orders created: **0** (códigos idénticos al baseline: 3EMZ8G, G96QN4, 8DBT8G, TJK9R5, 3ZYV8A, ACWXPE, 9E8Y45) · Status mutations: **0** · WhatsApp sends: **0**
Static checks: tsc **PASS** · diff-check **PASS** · build **NO EJECUTADO** (por instrucción) · lint **NO EJECUTADO** (por instrucción)
Verifies: nuevo `admin-manual-order-modal-surface-materiality-polish` **PASS** + 3 del set autorizado **PASS** (4/4)

Next phase: **ADMIN-MANUAL-ORDER-MODAL-ACCESSIBILITY-INTERACTION-POLISH-1**

No commit. No push. No deploy.

---

## Previous — ADMIN-MANUAL-ORDER-MODAL-TICKET-SUMMARY-HIERARCHY-POLISH-1 — PASS — TICKET SUMMARY HIERARCHY POLISHED (2026-09-07)

Status: **PASS** — P2-9, P2-10, P2-6 y P3-1 cerrados; sólo presentación

Doc: `docs/admin-manual-order-modal-ticket-summary-hierarchy-polish-1.md`

P2-9 configured summary plano/denso: **CLOSED** (selecciones agrupadas por grupo con label propio + una fila por opción; antes: párrafo continuo)
P2-10 `Adicional` débil: **CLOSED** (micro-superficie anidada `__summary-upsells` con indent, borde izquierdo, background sutil y label único)
P2-6 jerarquía de controles: **CLOSED** (stepper agrupado por proximidad `gap` 6→4px; `Quitar` fuera de `__quantity-controls`, al borde opuesto vía `space-between`)
P3-1 cantidades de extras: **CLOSED** (`×N` explícito cuando `option.quantity > 1` → `Cheddar ×4 +$ 2.000,00`)
Source model: **`customizationSnapshot` (CustomizationSnapshotV2) YA ESTRUCTURADO** — `group_name`, `option_name`, `quantity` y **`total_price_delta`** (el dominio ya calculó `priceDelta × quantity`)
`displaySummary` parsing: **NINGUNO** (sin `split`, sin regex sobre `"Papas:"`, sin parseo de comas ni de `(+$...)`; se conserva como fallback íntegro para líneas sin snapshot)
Fórmula nueva de pricing: **NINGUNA** (el delta mostrado es `total_price_delta` tal cual; el modal no multiplica deltas ni recomputa `lineTotal`)
Helper nuevo: **`getManualTicketSummaryGroups`** — proyección de presentación pura y local (filtra grupos vacíos, ordena por `sort_order`)
Parent hierarchy: **POLISHED** (`{qty} × {nombre}` 0.86rem/600 vs opciones 0.76rem/400; subtotal `nowrap` + tabular-nums; precio del `Adicional` NO plegado en el subtotal del padre)
Columna de precio: **DEDICADA** (`grid-template-columns: minmax(0, 1fr) auto` en opciones y children → nombre puede envolver sin colisionar)
Quantity/remove behavior: **UNCHANGED** (handlers, `aria-label`s, `disabled`, min/max y cascade del dominio intactos)
Tap targets: **SIN TOCAR** (stepper 28×28; rediseño diferido a `ADMIN-MANUAL-ORDER-MODAL-ACCESSIBILITY-INTERACTION-POLISH-1`, fijado por el verify)
Runtime QA: **LOCAL AUTHENTICATED** — 390 light, 390 dark, 412 dark, 900 light; casos A–H PASS; caso de estrés con 4 grupos, 7 filas de opción, `Cheddar ×4`, `Bacon ×4` y `Adicional`
Geometría medida: hScroll **0** · overlap texto/precio **0** (gap constante 10px, `sameLineOverlap: false`) · clipping **0** · controles sin colisión · footer sticky sin tapar el ticket
Dark real: verificado vía toggle admin (`html[data-dashboard-theme="dark"]`, body `rgb(9,10,13)`) — **no** vía `prefers-color-scheme`, que la app ignora
Cantidad raíz 1→2: **ESTABLE** (`2 × Doble Smash` `$ 41.000,00`; child `×2` `$ 6.000,00`; total `$ 50.000,00`; grupos idénticos)
P1-1: **CLOSED** · P1-2: **CLOSED** · P1-3: **CLOSED** · P1-4: **CLOSED** (overlap medido 0 en las 4 product rows a 900 light) → **los 4 P1 del modal siguen cerrados**
Single-scroll: **FROZEN** (a ≤899 único owner `manual-order-modal__body`; `__summary-scroll` neutralizado, `nestedScrollable: false`; a 900 se preserva el pane workstation de 220px; ninguna clase nueva introduce `overflow`/`max-height`/`fixed`/`sticky`)
Pricing / ticket domain / payload / `createManualOrderAction` / `create_order` RPC / DB schema-migrations / public checkout-catalog / dashboard frozen surfaces: **UNCHANGED**
CSS global / theme tokens / Button compartido / shell del modal / panel del configurador: **UNCHANGED**
Tokens semánticos nuevos: **NINGUNO** (se reutilizan `--text-tertiary`, `--text-secondary`, `--text-primary`, `--bg-surface-soft`, `--border-subtle`)
Archivos runtime modificados: **2** (`manual-order-modal.tsx`, `manual-order-modal.module.css`)
Orders created: **0** · Status mutations: **0** · WhatsApp sends: **0** (CTA primario nunca clickeado; `disabled` con `Completá los datos obligatorios` como red de seguridad)
Static checks: tsc **PASS** · diff-check **PASS** · build **NO EJECUTADO** (por instrucción) · lint **NO EJECUTADO** (por instrucción)
Verifies: nuevo `admin-manual-order-modal-ticket-summary-hierarchy-polish` **PASS** + 5 del set autorizado **PASS** (6/6)

Next phase: **ADMIN-MANUAL-ORDER-MODAL-SURFACE-MATERIALITY-POLISH-1**

No commit. No push. No deploy.

---

## Previous — ADMIN-MANUAL-ORDER-MODAL-FORM-VALIDATION-UX-DECISION-1 — PASS — P1-2 CLOSED (CTA READINESS ALINEADO CON `validateForm`) (2026-09-07)

Status: **PASS** — P1-2 cerrado sin agregar ni endurecer ninguna regla de validación

Doc: `docs/admin-manual-order-modal-form-validation-ux-decision-1.md`

P1-2 form validation UX: **CLOSED** (ticket válido + cliente vacío → CTA `Completá los datos obligatorios` **disabled**; antes: habilitado con monto)
Product decision: **OPTION A — GATE CTA BY EXISTING REQUIRED FORM RULES** (sin reglas nuevas)
Single source of truth: **`getManualOrderRequiredFieldErrors`** — helper puro y local en `manual-order-modal.tsx`, consumido por `requiredFormReady` (readiness del CTA) **y** por `validateForm` (errores al enviar); imposible que divergan
`canSubmit`: **`canCreateOrder && !isSubmitting && products.length > 0 && hasSelectedItems && ticketSubmitReady && requiredFormReady`** — único término añadido: `requiredFormReady`
Guards preservados: sesión/permiso, catálogo cargado, ticket no vacío, readiness por línea, bloqueo durante envío, `submitLockRef`, `validateForm()` como autoridad final
CTA copy: **TRES ESTADOS** (`Agregá productos` → `Completá los datos obligatorios` → `Crear pedido · $ X`; `Creando pedido...` al enviar), derivados de los mismos booleanos que el `disabled`
Reglas nuevas / endurecidas: **NINGUNA** (teléfono sigue `!phone.trim()`, sin regex/longitud/formato/normalización; `customerName` sin endurecer)
Delivery conditional: **CORRECTO** (dirección exigida en una sola rama `deliveryMethod === "delivery"`; Retiro no exige campos exclusivos de Delivery; cambiar método **no borra** lo tipeado — verificado)
Field errors: **UNCHANGED** (se publican al enviar; escribir sólo limpia el error del campo; 0 errores en pristine; sin texto rojo prematuro, sin resumen, sin auto-scroll a errores)
Mezcla compose/configurador: **NINGUNA** (`configureDraftValid` no lee `requiredFormReady` y viceversa; verificado con compose listo + configurador inválido)
Runtime QA: **LOCAL AUTHENTICATED** — FULL en 390 light y 390 dark; smoke en 900 light; casos A–H PASS
CTA/footer polish previo: **PRESERVED** (disabled scoped `opacity: 1` + `not-allowed`, sin `pointer-events: none`, monto sin wrap, footer sticky con sombra/fade)
P1-3 configurator context/scroll: **PRESERVED** (entrada en `scrollTop: 0`; `Volver` restaura 281 → 0 → 281)
P1-4 900–1023: **PRESERVED** (900 light, overlap = 0, sin hScroll)
Single-scroll: **FROZEN** (único owner `manual-order-modal__body` a ≤899)
P1-1: **CLOSED** · P1-2: **CLOSED (esta fase)** · P1-3: **CLOSED** · P1-4: **CLOSED** → **los 4 P1 del modal cerrados**
Pricing / ticket payload / `createManualOrderAction` / `create_order` RPC / DB schema-migrations / public checkout-catalog / dashboard frozen surfaces: **UNCHANGED**
CSS global / theme tokens / Button compartido / shell del modal: **UNCHANGED**
Archivos runtime modificados: **1** (`components/admin/orders/manual-order-modal.tsx`) · CSS: **NONE**
Excepción de scope autorizada: **3 verifies previos** actualizados sólo para retirar las assertions stale "P1-2 must remain deferred / customer field validity must stay out of `canSubmit`" y reemplazarlas por guards P1-2-aware de readiness
Orders created: **0** · Status mutations: **0** · WhatsApp sends: **0**
Static checks: tsc **PASS** · diff-check **PASS** · build **NO EJECUTADO** (por instrucción) · lint **NO EJECUTADO** (por instrucción)
Verifies: nuevo `admin-manual-order-modal-form-validation-ux-decision` **PASS** + 5 del set autorizado **PASS** (6/6)

No commit. No push. No deploy.

---

## Previous — ADMIN-MANUAL-ORDER-MODAL-CONFIGURATOR-CONTEXT-POLISH-1 — PASS — CONFIGURATOR CONTEXT AND ENTRY FLOW POLISHED (2026-09-07)

Status: **PASS** — P1-3 cerrado; P2-2, P2-8, P2-11 y P2-14 cerrados; sin cambios de validación/dominio/servidor

Doc: `docs/admin-manual-order-modal-configurator-context-polish-1.md`

P1-3 configurator context/scroll: **CLOSED** (compose 402 → configure **0** medido en el owner real)
Root cause: **SUBVISTAS COMPARTEN EL SCROLL OWNER** (`compose`/`configure` intercambian contenido dentro del mismo `manual-order-modal__body`; el elemento scrollable no se desmonta y conservaba `scrollTop`)
Fix: **OPTION A (event-adjacent síncrono)** — reset en `openConfigure` antes del cambio de estado + `useEffect` keyed sólo a la identidad de subvista (`viewKey` incluye `productId`)
Scroll owner: **EL EXISTENTE `manual-order-modal__body` vía ref local** — sin `window.scrollTo`, sin document scrolling, sin `scrollIntoView`, sin `querySelector`, sin timeouts/rAF/observers, sin `useLayoutEffect`
Compose scroll restoration: **IMPLEMENTED** (offset capturado en el mismo handler; `Volver` → 402 restaurado; `resetForm` limpia el ref)
Configurator entry: **SIEMPRE TOP** (incluido reabrir otro producto)
Contextual header: **POLISHED** (`Configurar {producto}` + subtítulo del subpaso vía props existentes del shell; compose sigue `Nuevo pedido`; badge `PEDIDO MANUAL` en ambas)
Shared modal shell (`admin-order-modal-shell.tsx` / `admin-order-modal.module.css`): **UNCHANGED** (el contexto se resolvió con props)
Duplicate heading: **DEMOTED** (h2 shell → h3 identidad compacta con precio base → h4 grupos; sin títulos de peso equivalente compitiendo)
Required-block feedback: **VISIBLE / NON-DUPLICATED** (superficie canónica única en el área de acción sticky, junto a `Agregar`; `p.validationMessage` del preview y `p.groupIssue` por grupo eliminados; el grupo faltante conserva sólo un cue silencioso `data-missing`)
Validity authority: **`configureDraftValid` SIN CAMBIOS** (el helper de motivo es proyección de sólo lectura de `validateCustomizationSelection`)
Pristine/error timing: **FIXED (presentación únicamente)** — `hasConfigureInteraction` no alimenta validez, `disabled`, selección, pricing ni payload; el panel volvió a ser stateless + `key` por producto
Focus-visible: **POLISHED LOCALLY** (`outline` + offset desde `--focus` en opciones, toggles de cantidad, steppers y Adicional; sin apilar sombras; focus trap sigue diferido)
ARIA: `role="status"` polite + `aria-describedby` condicionado a que el nodo esté renderizado
Runtime QA: **LOCAL AUTHENTICATED** — FULL en 390/412 light y dark; smoke en 899/900/1023/1024/1440; casos A–G PASS
CTA/footer polish previo: **PRESERVED** · P1-4 900–1023: **PRESERVED** (900 light + 1023 dark, overlap = 0)
Single-scroll: **FROZEN** (único owner `manual-order-modal__body` a ≤899; el reset opera sobre ese mismo owner)
P1-1: **CLOSED** · P1-2: **OPEN / DEFERRED** (verificado sin cambios: `Crear pedido` habilitado con Nombre/Teléfono vacíos) · P1-3: **CLOSED** · P1-4: **CLOSED**
`canSubmit` / `validateForm` / payload / `createManualOrderAction`: **UNCHANGED**
create_order RPC · DB schema/migrations · public checkout/catalog · dashboard frozen surfaces: **UNCHANGED**
Archivos runtime modificados: **4** (`manual-order-modal.tsx`, `manual-order-modal.module.css`, `manual-order-customization-panel.tsx`, `manual-order-customization-panel.module.css`)
Excepción de scope autorizada: **2 verifies previos** actualizados sólo para retirar la assertion stale "P1-3 must remain deferred" y reemplazarla por un guard P1-3-aware de scroll sobre el body owner
Orders created: **0** · Status mutations: **0** · WhatsApp sends: **0**
Static checks: tsc **PASS** · diff-check **PASS** · build **PASS** · lint **deuda conocida** (circular JSON / ESLint 9)
Verifies: nuevo `admin-manual-order-modal-configurator-context-polish` **PASS** + 14 regresiones **PASS** (15/15)
Next phase: **ADMIN-MANUAL-ORDER-MODAL-FORM-VALIDATION-UX-DECISION-1**

No commit. No push. No deploy.

---

## Previous — ADMIN-MANUAL-ORDER-MODAL-BREAKPOINT-OVERFLOW-FIX-1 — PASS — WORKSTATION PRODUCT ROW OVERFLOW FIXED (2026-09-07)

Status: **PASS** — P1-4 cerrado con CSS feature-scoped; sin cambios de arquitectura de breakpoints

Doc: `docs/admin-manual-order-modal-breakpoint-overflow-fix-1.md`

P1-4 900–1023 text↔price overlap: **CLOSED** (identidad 55.56px → 190px; overlap medido por intersección de rects = 0)
Root cause: **DUAL-PANE + SHELL CAP + SHRINK SIN CONTENCIÓN** (workstation pide dual-pane en 900 mientras el shell sigue capado en 600px → columna de productos 248px → track de identidad ~56px con min-content 139px, desbordando por `overflow: visible`)
Fix: **OPTION A + C** (`overflow-wrap: anywhere` en `__product-copy` + media query feature-local `900–1023` con `"copy copy" / "price add"`)
Workstation breakpoint: **UNCHANGED** (`@media (min-width: 900px)`, `minmax(0, 1.45fr) minmax(300px, 0.85fr)`) — OPTION D rechazada
Modal shell (`admin-order-modal.module.css`): **UNCHANGED** (cap 600px → 1200px en ≥1024)
900–1023 product rows: **NO OVERLAP** (900/920/960/1023 light y dark)
Precio: **ÍNTegro** (`white-space: nowrap`, `min-width: 4.75rem`, `font-size: 0.84rem` sin reducir)
Botón de acción: **34×34 SIN SHRINK** (deuda de tap target P2 preexistente, no tocada)
Scroll horizontal: **NINGUNO** en 360/390/412/719/899/900/920/960/1023/1024/1440
Extreme content probe: **PASS** (nombre 43 chars + categoría 30 chars sin cortes → envuelve, no desborda; DOM-only, revertido)
≤899 mobile layout: **PRESERVED** · ≥1024 desktop: **PRESERVED**
Simple/configurable parity: **PRESERVED** (P2-1 affordance sigue diferido)
CTA/footer polish previo: **PRESERVED** (`__footer`, `__submit-button`, `__submit-label` sin modificar)
Single-scroll: **FROZEN** (único owner `manual-order-modal__body` a ≤899)
P1-1: **CLOSED** · P1-2: **OPEN / DEFERRED** · P1-3: **OPEN / DEFERRED** · P1-4: **CLOSED**
`canSubmit` / `validateForm` / payload / `createManualOrderAction`: **UNCHANGED**
create_order RPC · DB schema/migrations · public checkout/catalog · dashboard frozen surfaces: **UNCHANGED**
Archivo runtime modificado: **1** (`components/admin/orders/manual-order-modal.module.css`) · TSX: **NONE**
Orders created: **0** · Status mutations: **0** · WhatsApp sends: **0**
Static checks: tsc **PASS** · diff-check **PASS** · build **PASS** · lint **deuda conocida** (circular JSON / ESLint 9)
Verifies: nuevo `admin-manual-order-modal-breakpoint-overflow-fix` **PASS** + 13 regresiones **PASS**
Next phase: **ADMIN-MANUAL-ORDER-MODAL-CONFIGURATOR-CONTEXT-POLISH-1**

No commit. No push. No deploy.

---

## Previous — ADMIN-MANUAL-ORDER-MODAL-CTA-FOOTER-STATES-POLISH-1 — PASS — CTA/FOOTER STATES POLISHED (2026-09-07)

Status: **PASS WITH ACCEPTED P3 COPY DEBT** — P1-1 cerrado; P2-12 y P2-15 cerrados; P3-8 parcial

Doc: `docs/admin-manual-order-modal-cta-footer-states-polish-1.md`

Manual order modal CTA disabled hierarchy: **FIXED / SCOPED** (`.manual-order-modal__footer .manual-order-modal__submit-button:disabled`, sin tocar `.ui-button:disabled`)
Manual order modal enabled CTA: **PRESERVED** (`--accent-primary` `#2563EB` + label blanco, focus/active/loading intactos)
Mobile CTA amount: **VISIBLE / CONSISTENT** (label único con monto en todos los anchos; labels width-gated eliminados)
Sticky footer materiality: **POLISHED** (borde con tinte, sombra ascendente, fade decorativo de 18px `pointer-events: none`)
Blocked CTA copy: **CONFIGURATOR CERRADO** (`Completá las opciones` desde `configureDraftValid`) · **COMPOSE DIFERIDO** (deuda P3 documentada)
Single-scroll: **REMAINS FROZEN** (único scroll owner `manual-order-modal__body` verificado a 360/390/412/899)
Runtime QA: **LOCAL AUTHENTICATED** (`http://localhost:3000`, tenant La Burguesía) — estados A–E + smoke 360/390/412/899/900/1440, light y dark
P1-1: **CLOSED**
P1-2: **OPEN / DEFERRED** → `FORM-VALIDATION-UX-DECISION-1` (verificado sin cambios: CTA habilitado con Nombre/Teléfono vacíos)
P1-3: **OPEN / DEFERRED** → `CONFIGURATOR-CONTEXT-POLISH-1`
P1-4: **OPEN / NEXT PHASE** → reproducido a 900px, sin tocar grid/breakpoints
Global Button / globals.css / theme-tokens.css: **UNCHANGED**
`canSubmit` / `validateForm` / payload / `createManualOrderAction`: **UNCHANGED**
create_order RPC: **UNCHANGED**
DB schema/migrations: **UNCHANGED**
Public checkout/catalog: **UNCHANGED**
Dashboard frozen surfaces: **PRESERVED**
Orders created: **0** · Status mutations: **0** · WhatsApp sends: **0**
Static checks: tsc **PASS** · diff-check **PASS** · build **PASS** · lint **deuda conocida** (circular JSON / ESLint 9)
Next phase: **ADMIN-MANUAL-ORDER-MODAL-BREAKPOINT-OVERFLOW-FIX-1**

No commit. No push. No deploy.

---

## Previous — ADMIN-MANUAL-ORDER-MODAL-VISUAL-HIERARCHY-AUDIT-1 — AUDIT COMPLETE — READY FOR SCOPED VISUAL POLISH (2026-09-07)

Status: **AUDIT COMPLETE WITH BLOCKING P1/P2 FINDINGS** — 0 P0, 4 P1, 18 P2, 11 P3; sin implementación

Doc: `docs/admin-manual-order-modal-visual-hierarchy-audit-1.md`

Manual order modal visual hierarchy: **AUDITED** (compose + configurator, light + dark)
Manual order modal functionality: **REMAINS CLOSED / FROZEN**
Manual order submit flow: **REMAINS VERIFIED** (`#TJK9R5`)
Manual modal single-scroll: **REMAINS FROZEN** (verificado en runtime a 390/412/900: único scroll owner `manual-order-modal__body`)
Runtime QA: **LOCAL AUTHENTICATED** (`http://localhost:3000`, tenant La Burguesía, HEAD `3e418bb`)
Production authenticated QA: **NOT AVAILABLE** (`/admin/dashboard` → `/admin/login`) — deuda P2-18
P1 abiertos: **P1-1** CTA disabled indistinguible del habilitado · **P1-2** `Crear pedido` habilitado con cliente/teléfono vacíos y errores fuera de viewport · **P1-3** configurator hereda scroll y pierde contexto/error · **P1-4** solape texto↔precio en 900–1023px
create_order RPC: **UNCHANGED**
DB schema/migrations: **UNCHANGED**
Public checkout/catalog: **UNCHANGED**
Dashboard frozen surfaces: **PRESERVED**
Orders created: **0** · Status mutations: **0** · WhatsApp sends: **0**
Implementación: **NONE** — no code / no CSS / no commit / no push / no deploy
Next phase: **ADMIN-MANUAL-ORDER-MODAL-CTA-FOOTER-STATES-POLISH-1**
Secuencia recomendada: CTA/footer states → **breakpoint overflow fix (nueva)** → configurator context → ticket summary hierarchy → surface materiality → final visual QA

---

## Previous — ADMIN-DASHBOARD-MOBILE-ORDERS-COMMIT-PUSH-DEPLOY-1 — PASS WITH ACCEPTED PROD AUTH SMOKE DEBT — PACKAGE COMMITTED, PUSHED AND DEPLOYED (2026-09-07)

Status: **PASS WITH ACCEPTED PROD AUTH SMOKE DEBT** — commit `178d07c` pushed to `main`; Vercel prod Ready `dpl_8T1JKrzPhCsKhNYeo8xKTJUesgZn`; public smoke PASS; authenticated prod admin smoke not available

Doc: `docs/admin-dashboard-mobile-orders-commit-push-deploy-1.md`

Admin dashboard mobile/orders block: **COMMITTED / PUSHED / DEPLOYED**
Commit hash: **178d07ced56d739f6f6d1370e4fcd72e8d3ac553**
Production deployment: **READY** (`https://orderops.vercel.app`)
Production smoke: **PASS READ-ONLY (public) + PROD AUTH DEBT**
D1 drawer width/backdrop/motion: **DEPLOYED**
Admin tap highlight: **DEPLOYED**
D2 toolbar density: **DEPLOYED**
D3 manual order flow: **DEPLOYED**
D4 footer: **DEPLOYED**
Manual order configured submit: **DEPLOYED**
QA order #TJK9R5 evidence: **RECORDED FROM MODE B**
create_order RPC: **UNCHANGED**
DB schema/migrations: **UNCHANGED**
Public checkout/catalog: **UNCHANGED**
No new production orders
No status mutation
No WhatsApp send
Next phase: **ADMIN-PRODUCTS-MOBILE-VISUAL-DEBT-AUDIT-1**

---

## Previous — ADMIN-DASHBOARD-MOBILE-ORDERS-COMMIT-PUSH-DEPLOY-1 — IN PROGRESS — PACKAGE AUDIT / COMMIT / PUSH / DEPLOY (2026-09-07)

---

## Previous — ADMIN-DASHBOARD-MOBILE-ORDERS-FINAL-CLOSEOUT-1 — PASS — ADMIN DASHBOARD MOBILE ORDERS FINAL CLOSEOUT COMPLETE (2026-09-07)

---

## Previous — ADMIN-MANUAL-ORDER-CUSTOMIZATION-FLOW-RUNTIME-QA-1 — PASS — MODE B AUTHORIZED SUBMIT QA CLOSED (2026-09-07)

---

## Previous — ADMIN-DASHBOARD-MOBILE-ORDERS-FINAL-CLOSEOUT-1 — BLOCKED — MODE B AUTHORIZED SUBMIT QA REQUIRED BEFORE FINAL CLOSEOUT (2026-09-07)

---

## Previous — ADMIN-MANUAL-ORDER-CUSTOMIZATION-FLOW-RUNTIME-QA-1 — PASS WITH ACCEPTED ORDER-SUBMIT QA DEBT — NO-SUBMIT RUNTIME QA COMPLETE (2026-09-06)

---

## Previous — ADMIN-MANUAL-ORDER-CUSTOMIZATION-FLOW-SERVER-PAYLOAD-1 — PASS — MANUAL ORDER CUSTOMIZATION SERVER PAYLOAD READY (2026-09-06)

---

## Previous — ADMIN-MANUAL-ORDER-CUSTOMIZATION-FLOW-UI-1 — PASS — MANUAL ORDER CUSTOMIZATION PICKER UI READY (2026-09-06)

---

## Previous — ADMIN-MANUAL-ORDER-CUSTOMIZATION-FLOW-DOMAIN-1 — PASS — MANUAL ORDER CUSTOMIZATION DOMAIN HELPERS READY (2026-09-06)

---

## Previous — ADMIN-MANUAL-ORDER-CUSTOMIZATION-FLOW-SPEC-1 — SPEC COMPLETE — READY FOR PHASED IMPLEMENTATION (2026-09-06)

---

## Previous — ADMIN-MANUAL-ORDER-MODAL-MOBILE-SINGLE-SCROLL-FIX-1 — PASS — MANUAL ORDER MODAL MOBILE SINGLE-SCROLL FIXED (2026-09-06)

---

## Previous — ADMIN-MANUAL-ORDER-CUSTOMIZATION-SAFETY-GATE-RUNTIME-QA-1 — PASS — MANUAL ORDER CUSTOMIZATION SAFETY GATE RUNTIME QA CLOSED (2026-09-06)

---

## Previous — ADMIN-MANUAL-ORDER-CUSTOMIZATION-SAFETY-GATE-1 — PASS WITH RUNTIME QA DEBT — MANUAL ORDER CUSTOMIZATION SAFETY GATE READY (2026-09-06)

---

## Previous — ADMIN-MANUAL-ORDER-MODAL-MOBILE-SCROLL-AND-CUSTOMIZATION-AUDIT-1 — AUDIT COMPLETE — MANUAL ORDER CUSTOMIZATION PATH DECISION REQUIRED (2026-09-05)

---

## Previous — ADMIN-MOBILE-FOOTER-SINGLE-LINE-FOLLOWUP-1 — PASS — ADMIN MOBILE FOOTER SINGLE-LINE POLISHED (2026-09-05)

---

## Previous — ADMIN-MOBILE-FOOTER-COMPACT-POLISH-1 — PASS — ADMIN MOBILE FOOTER COMPACT POLISHED (2026-09-05)

---

## Previous — ADMIN-TAP-HIGHLIGHT-POLISH-1 — PASS — ADMIN TAP HIGHLIGHT POLISHED (2026-09-05)

---

## Previous — ADMIN-MOBILE-DRAWER-MOTION-POLISH-1 — PASS — ADMIN MOBILE DRAWER MOTION POLISHED (2026-09-05)

---

## Previous — ADMIN-MOBILE-DRAWER-BACKDROP-FOCUS-POLISH-1 — PASS — ADMIN MOBILE DRAWER BACKDROP FOCUS POLISHED (2026-09-05)

---

## Previous — ADMIN-MOBILE-DRAWER-WIDTH-DENSITY-POLISH-1 — PASS — ADMIN MOBILE DRAWER WIDTH POLISHED (2026-09-05)

---

## Previous — ADMIN-DASHBOARD-MOBILE-ORDERS-TOOLBAR-DENSITY-POLISH-1 — PASS — MOBILE ORDERS TOOLBAR DENSITY POLISHED (2026-09-05)

---

## Previous — ADMIN-DASHBOARD-MOBILE-ORDERS-FINAL-VISUAL-DEBT-AUDIT-1 — AUDIT COMPLETE — MANUAL ORDER MODAL NEEDS DEEPER AUDIT FIRST (2026-09-05)

---

## Previous — ADMIN-DASHBOARD-POLISH-PACKAGE-COMMIT-PUSH-DEPLOY-1 — PASS — PACKAGE COMMITTED, PUSHED AND DEPLOYED (2026-08-29)

---

## Previous — ADMIN-DASHBOARD-LOADING-STATE-OWNERSHIP-AUDIT-1 — AUDIT COMPLETE — READY FOR LOADING UNIFICATION (2026-08-28)

---

## Previous — ADMIN-DASHBOARD-LOADING-STATE-SCALE-ALIGNMENT-FOLLOWUP-1 — PASS — DASHBOARD LOADING STATE SCALE ALIGNED (2026-08-28)

---

## Previous — ADMIN-DASHBOARD-LOADING-STATE-CENTERING-POLISH-1 — PASS — DASHBOARD LOADING STATE CENTERED (2026-08-28)

---

## Previous — ADMIN-ORDER-WORKSPACE-PRODUCT-DETAIL-DRILLDOWN-REMOVAL-1 — PASS — ORDER PRODUCT DRILLDOWN REMOVED (2026-08-28)

---

## Previous — ADMIN-ORDER-WORKSPACE-PRODUCT-DETAIL-DRILLDOWN-REMOVAL-AUDIT-1 — AUDIT COMPLETE — READY FOR REMOVAL IMPLEMENTATION (2026-08-28)

---

## Previous — ADMIN-DASHBOARD-SEARCH-KANBAN-VISUAL-STABILITY-FIX-1 — PASS — DASHBOARD SEARCH/KANBAN VISUAL STABILITY FIXED (2026-08-28)

Status: **PASS — DASHBOARD SEARCH/KANBAN VISUAL STABILITY FIXED** — stabilized dashboard Kanban presentation during active search so visible lane windows remain structurally stable (4 desktop columns) and Cancelados does not disappear when filtered empty; refined operational search focus treatment to a single, quiet, accessible container `:focus-within` state (suppressing inner `.ui-input:focus` double ring); preserved order_code/name/phone search logic (`natural-search.ts` untouched), dashboard metrics, dashboard card root count, workspace/contact, DB/RPC/realtime and CSS-global boundaries; 14/14 deterministic verify scripts PASS — no commit / push / deploy

Doc: `docs/admin-dashboard-search-kanban-visual-stability-fix-1.md`

Dashboard search/Kanban visual stability: **FIXED**
Cancelados lane during search: **STABLE**
Search focus treatment: **SINGLE ACCESSIBLE FOCUS STATE**
Dashboard order_code partial search: **REMAINS FIXED**
Dashboard metrics semantics: **REMAIN FROZEN**
Dashboard card root count: **REMAINS FROZEN**
Order code block: **REMAINS CLOSED**
Public success WhatsApp copy: **REMAINS FROZEN**
Dashboard overall polish: **OPEN**

---

## Previous — ADMIN-DASHBOARD-ORDER-CODE-SEARCH-PARTIAL-MATCH-FIX-1 — PASS — DASHBOARD ORDER CODE PARTIAL SEARCH FIXED (2026-08-28)

Status: **PASS — DASHBOARD ORDER CODE PARTIAL SEARCH FIXED** — fixed dashboard order_code partial search so alphanumeric code queries like `PGF5` remain constrained to matching order codes rather than falling through to broad single-digit phone matches and UUID hex matching; confirmed monotonic progressive narrowing (`PGF` $\to$ `PGF5` $\to$ `PGF5T` $\to$ `PGF5TU` $\to$ `#PGF5` $\to$ `pgf5`); preserved customer name, phone, legacy UUID-derived ref, and `#ORDER_CODE` search; 13/13 deterministic verify scripts PASS; zero changes to metrics, card root count, DB/SQL/RPC, or CSS — no commit / push / deploy

Doc: `docs/admin-dashboard-order-code-search-partial-match-fix-1.md`

Dashboard order_code partial search: **FIXED**
PGF → PGF5 broadening bug: **CLOSED**
Order code block: **REMAINS CLOSED**
Dashboard metrics semantics: **REMAIN FROZEN**
Dashboard card root count: **REMAINS FROZEN**
Public success WhatsApp copy: **REMAINS FROZEN**
Dashboard overall polish: **OPEN**

---

## Previous — ADMIN-DASHBOARD-METRICS-RUNTIME-QA-1 — PASS WITH ACCEPTED P3 QA DEBT — DASHBOARD METRICS SEMANTICS FROZEN (2026-08-28)

Status: **PASS WITH ACCEPTED P3 QA DEBT — DASHBOARD METRICS SEMANTICS FROZEN** — completed formal runtime QA and closeout validation for admin dashboard metrics semantic fix; confirmed “Producto más pedido” strictly counts root products and excludes parent-linked child upsells (e.g., Coca Cola 500ml); confirmed ready waiting visible copy reflects “Listos para entrega/retiro” (detail: “Delivery y retiro en local”) while preserving `count(status === 'ready')`; confirmed revenue, average ticket, active orders, delayed orders, average prep time, kitchen status, dashboard card root count, order code `#ORDER_CODE` refs, workspace/contact, and public success WhatsApp remain intact; 12/12 deterministic verify scripts PASS; search partial-match edge case documented as separate P3 debt (`ADMIN-DASHBOARD-ORDER-CODE-SEARCH-PARTIAL-MATCH-FIX-1`); zero new runtime, CSS, or DB/SQL/RPC changes in this QA phase — no commit / push / deploy

Doc: `docs/admin-dashboard-metrics-runtime-qa-1.md`

Dashboard metrics semantics: **FROZEN**
Top product KPI: **ROOT-ONLY PRODUCTO MÁS PEDIDO FROZEN**
Ready waiting copy: **DELIVERY/RETIRO ACCURATE FROZEN**
Revenue/ticket/active/delayed/time/kitchen formulas: **UNCHANGED**
Dashboard card root count: **REMAINS FROZEN**
Order code block: **REMAINS CLOSED**
Public success WhatsApp copy: **REMAINS FROZEN**
Search partial-match debt: **CLOSED (RESOLVED)**
Dashboard overall polish: **OPEN**

---

## Previous — ADMIN-DASHBOARD-METRICS-SEMANTIC-FIX-1 — PASS — DASHBOARD METRICS SEMANTICS FIXED (2026-08-28)

Status: **PASS — DASHBOARD METRICS SEMANTICS FIXED** — implemented targeted runtime semantic fix for admin dashboard top section metrics; updated `getTopProducts()` in `lib/orders/analytics.ts` to count root products only via `buildDashboardOrderItemTree` (excluding parent-linked child upsells like Coca Cola 500ml); relabeled KPI from “Más vendido” to “Producto más pedido”; updated ready waiting copy to “Listos para entrega/retiro” (detail: “Delivery y retiro en local”); preserved all other metric formulas (revenue, average ticket, active orders, delayed orders, average prep time, kitchen saturation); 8/8 test suites in `lib/orders/dashboard-metrics-semantic-fix.verify.ts` PASS; full regression verify suite PASS; 0 CSS, 0 DB/SQL/RPC, 0 realtime mutations — no commit / push / deploy

Doc: `docs/admin-dashboard-metrics-semantic-fix-1.md`

Dashboard metrics semantics: **IMPLEMENTED / READY FOR QA**
Top product KPI: **ROOT-ONLY PRODUCTO MÁS PEDIDO**
Ready waiting copy: **DELIVERY/RETIRO ACCURATE**
Dashboard card root count: **REMAINS FROZEN**
Order code block: **REMAINS CLOSED**
Public success WhatsApp copy: **REMAINS FROZEN**
Dashboard overall polish: **OPEN**

---

## Previous — ADMIN-DASHBOARD-METRICS-SEMANTIC-AUDIT-1 — PASS — AUDIT COMPLETE — READY FOR PRODUCT DECISION (2026-08-28)

Status: **PASS — AUDIT COMPLETE — READY FOR PRODUCT DECISION** — completed forensic audit and product semantic specification of admin dashboard metrics across commercial KPIs (Revenue, Average Ticket, Active Orders, Top Product), operational KPIs (Kitchen Status, Delayed Orders, Average Prep Time, Ready Waiting), and session signals; pinpointed flat child upsell aggregation in `getTopProducts()` as root cause of "Coca Cola 500ml" surfacing as "Más vendido"; confirmed window scoping, status filters, and order item tree boundaries; zero runtime, CSS, DB/SQL/RPC, or realtime changes — no commit / push / deploy

Doc: `docs/admin-dashboard-metrics-semantic-audit-1.md`

Dashboard metrics semantics: **AUDITED / NOT IMPLEMENTED**
Dashboard card root count: **REMAINS FROZEN**
Order code block: **REMAINS CLOSED**
Public success WhatsApp copy: **REMAINS FROZEN**
Dashboard overall polish: **OPEN**

---

## Previous — PUBLIC-CATALOG-SUCCESS-WHATSAPP-BUSINESS-COPY-1 — PASS — PUBLIC SUCCESS WHATSAPP BUSINESS COPY FROZEN (2026-08-28)

Status: **PASS — PUBLIC SUCCESS WHATSAPP BUSINESS COPY FROZEN** — updated the customer-facing WhatsApp message generated from the catalog success page (`/b/[slug]/success`) to be business-first (`Hola {businessName}, ya hice mi pedido {orderCode} desde el catálogo online. \nTe escribo para confirmarlo.`); raw orderCode used without `#` in WhatsApp text while success page card continues to display `#ORDER_CODE`; platform name and WhatsApp wording omitted; phone normalization preserved; deterministic verify `lib/whatsapp/public.verify.ts` PASS; full regression verify suite PASS; Next.js 16.2.9 production build PASS; TypeScript compilation PASS (0 errors); Order Code block, UUID routes, and Admin WhatsApp unchanged — no commit / push / deploy

Doc: `docs/public-catalog-success-whatsapp-business-copy-1.md`

Public success WhatsApp copy: **BUSINESS-FIRST + FROZEN**
Order code block: **REMAINS CLOSED**
UUID internal identity: **UNCHANGED**
Public success visible ref: **REMAINS #ORDER_CODE**
Admin WhatsApp/contact: **UNCHANGED**
Dashboard overall polish: **OPEN**

---

## Previous — ADMIN-ORDERS-ORDER-CODE-FINAL-RUNTIME-QA-1 — PASS WITH ACCEPTED P3 QA DEBT — ORDER CODE BLOCK CLOSED (2026-08-28)

Status: **PASS WITH ACCEPTED P3 QA DEBT — ORDER CODE BLOCK CLOSED** — completed final runtime and verify closeout validation for the complete Order Code architectural block; confirmed visible references prefer `#ORDER_CODE` (`#K7M4Q9`) with safe legacy UUID-derived fallback; confirmed dashboard/admin search matches `order_code` with or without `#`, case-insensitively, alongside legacy ref, customer name, and phone searches; 10/10 deterministic verify scripts PASS; Next.js 16.2.9 production build PASS; TypeScript compilation PASS (0 errors); UUID routes, mutations, presence, realtime channels, pricing, and domain invariants strictly unchanged — no commit / push / deploy

Doc: `docs/admin-orders-order-code-final-runtime-qa-1.md`

Order code schema/RPC: **APPLIED + VALIDATED**
Order code loaders/realtime: **IMPLEMENTED + FROZEN**
Order code UI/search: **IMPLEMENTED + FROZEN**
Order code block: **CLOSED**
UUID internal identity: **UNCHANGED**
Dashboard card root count: **REMAINS FROZEN**
Contact/workspace scopes: **REMAIN FROZEN except order ref text adoption**
Dashboard overall polish: **OPEN**

---

## Previous — ADMIN-ORDERS-ORDER-CODE-UI-SEARCH-1 — PASS — ORDER CODE UI/SEARCH FROZEN (2026-08-28)

Status: **PASS — ORDER CODE UI/SEARCH FROZEN** — migrated visible order references across admin dashboard cards, workspace modal header, order detail header, structured WhatsApp messages, plain-text Copy/Share summaries, and public success page to prefer `orders.order_code` with legacy UUID fallback; enabled operational search in dashboard/admin search by `order_code` (with/without `#`, case-insensitive, prefix/exact); verified deterministic helper and search coverage (`lib/orders/order-display-ref.verify.ts`, `lib/orders/order-code-ui-search.verify.ts`); verified 0 regressions in full verify suite; UUID internal identity strictly unchanged; no CSS or DB/RPC modifications — no commit / push / deploy

Doc: `docs/admin-orders-order-code-ui-search-1.md`

Order code schema/RPC: **APPLIED + VALIDATED**
Order code loaders/realtime: **IMPLEMENTED + FROZEN**
Order code UI/search: **IMPLEMENTED + FROZEN**
UUID internal identity: **UNCHANGED**
Dashboard card root count: **REMAINS FROZEN**
Contact/workspace scopes: **REMAIN FROZEN except order ref text adoption**
Dashboard overall polish: **OPEN**

---

## Previous — ADMIN-ORDERS-ORDER-CODE-LOADERS-REALTIME-1 — PASS — ORDER CODE LOADERS/REALTIME READY (2026-08-28)

Status: **PASS — ORDER CODE LOADERS/REALTIME READY** — propagated `orders.order_code` through admin data models (`AdminOrderListItem`, `AdminOrderDashboardItem`, `AdminOrderDetail`, `AdminOrderWorkspaceData`); updated initial dashboard loader (`getAdminOrders`), refresh endpoint (`/admin/dashboard/orders`), summary hydrate (`/admin/orders/[id]/summary`), workspace hydrate (`/admin/orders/[id]/workspace`), and detail page loader; updated realtime patchers (`patchDashboardOrderFromRealtime`, `patchWorkspaceOrderFromRealtime`) to preserve/update `order_code`; deterministic verify `lib/orders/order-code-loaders-realtime.verify.ts` PASS; UUID internal identity unchanged; UI/display/search migration deferred — no commit / push / deploy

Doc: `docs/admin-orders-order-code-loaders-realtime-1.md`

Order code schema/RPC: **APPLIED + VALIDATED**
Order code loaders/realtime: **IMPLEMENTED + FROZEN**
Order code display/search: **DEFERRED / NOT IMPLEMENTED**
UUID internal identity: **UNCHANGED**
Dashboard card root count: **REMAINS FROZEN**
Contact messaging / workspace scopes: **REMAIN FROZEN**
Dashboard overall polish: **OPEN**

---

## Previous — ADMIN-ORDERS-ORDER-CODE-DB-APPLY-VALIDATION-1 — PASS — ORDER CODE DB APPLY VALIDATED (2026-08-28)

Status: **PASS — ORDER CODE DB APPLY VALIDATED** — live DB introspection confirmed manual SQL apply; `orders.order_code` exists (text, NOT NULL); `orders_order_code_format_chk` enforces exact 30-char unambiguous alphabet `23456789ABCDEFGHJKMNPQRSTUVWXYZ`; `orders_business_order_code_uidx` enforces per-business uniqueness; `public.generate_order_code()` verified via 20-sample generation; `public.create_order` live definition verified (returns UUID, generates order_code with 5-retry loop); 100% of existing 67 orders backfilled with valid codes (0 null, 0 invalid, 0 duplicate); types aligned; UI/display/search migration deferred — no commit / push / deploy

Doc: `docs/admin-orders-order-code-db-apply-validation-1.md`

Order code schema/RPC: **APPLIED + VALIDATED**
Order code display/search: **DEFERRED / NOT IMPLEMENTED**
UUID internal identity: **UNCHANGED**
Dashboard card root count: **REMAINS FROZEN**
Contact messaging / workspace scopes: **REMAIN FROZEN**
Dashboard overall polish: **OPEN**

---

## Previous — ADMIN-ORDERS-ORDER-CODE-SCHEMA-RPC-1 — PASS WITH DB APPLY QA DEBT — ORDER CODE SCHEMA/RPC READY (2026-08-27)

Status: **PASS WITH DB APPLY QA DEBT — ORDER CODE SCHEMA/RPC READY** — added SQL migration `20260827234500_add_orders_order_code.sql`; `generate_order_code()` with 30-char unambiguous alphabet `23456789ABCDEFGHJKMNPQRSTUVWXYZ`; idempotent backfill; `orders.order_code` NOT NULL + CHECK format + unique index per business `(business_id, order_code)`; `create_order` updated to generate `order_code` transactionally with 5-retry loop; `types/database.ts` updated; UUID routing/internal identity unchanged; UI/display/search migration deferred — no commit / push / deploy

Doc: `docs/admin-orders-order-code-schema-rpc-1.md`

Order code schema/RPC: **IMPLEMENTED LOCALLY / READY FOR DB APPLY**
Order code display/search: **DEFERRED / NOT IMPLEMENTED**
UUID internal identity: **UNCHANGED**
Dashboard card root count: **REMAINS FROZEN**
Contact messaging / workspace scopes: **REMAIN FROZEN**
Dashboard overall polish: **OPEN**

---

## Previous — ADMIN-ORDERS-ORDER-CODE-AUDIT-SPEC-1 — AUDIT/SPEC COMPLETE — READY FOR IMPLEMENTATION (2026-08-27)

Status: **AUDIT/SPEC COMPLETE — READY FOR IMPLEMENTATION** — audited current UUID-derived order display reference ownership (`buildOrderDisplayRef`); specified future `orders.order_code` column (6-char unambiguous alphanumeric `[23456789ABCDEFGHJKMNPQRSTUVWXYZ]`, unique per tenant `(business_id, order_code)`); generation inside `create_order` RPC with 5-retry collision loop; backfill plan with fallback; display/search mapping; UUID internal identity strictly preserved — no runtime/CSS/DB/RPC changes — no commit / push / deploy

Doc: `docs/admin-orders-order-code-audit-spec-1.md`

Order code: **SPECIFIED — NOT IMPLEMENTED**
UUID internal identity: **UNCHANGED**
Dashboard card root count: **REMAINS FROZEN**
Contact messaging / workspace scopes: **REMAIN FROZEN**
Dashboard overall polish: **OPEN**

---

## Previous — ADMIN-DASHBOARD-ORDER-CARD-ROOT-ITEM-COUNT-IMPL-1 — PASS — DASHBOARD CARD ROOT COUNT FROZEN (2026-08-27)

Status: **PASS — DASHBOARD CARD ROOT COUNT FROZEN** — root-product-based `item_count` and root-only compact `item_summary` on dashboard OrderCard; parent-linked upsell/Adicional children excluded from card scalars; initial load, summary hydrate and realtime patch share `buildDashboardOrderCardSummary`; workspace/modal/WhatsApp/pricing/natural search unchanged — no commit / push / deploy

Doc: `docs/admin-dashboard-order-card-root-item-count-impl-1.md`

Dashboard card root count: **IMPLEMENTED + FROZEN**
Dashboard compact item summary: **ROOT-ONLY + FROZEN**
Contact messaging / workspace scopes: **REMAIN FROZEN**
Dashboard overall polish: **OPEN**

---

## Previous — ADMIN-DASHBOARD-ORDER-CARD-ROOT-ITEM-COUNT-AUDIT-1 — AUDIT COMPLETE — READY FOR IMPLEMENTATION (2026-08-27)

Status: **AUDIT COMPLETE — READY FOR IMPLEMENTATION** — dashboard OrderCard `N items` / compact summary traced to `buildOrderOperationalSummary`; current semantics sum all flat `order_items` rows including upsell children; recommended root-quantity fix via shared helper + mapping/realtime — no runtime/CSS/DB changes — no commit / push / deploy

Doc: `docs/admin-dashboard-order-card-root-item-count-audit-1.md`

Dashboard card root count: **AUDITED — NOT IMPLEMENTED**
Contact messaging / workspace scopes: **REMAIN FROZEN**
Dashboard overall polish: **OPEN**

---

## Previous — ADMIN-ORDER-WORKSPACE-CONTACT-SURFACE-CONTRAST-TUNING-1 — PASS WITH REAL-DEVICE QA DEBT (2026-08-27)

Status: **PASS WITH REAL-DEVICE QA DEBT** — workspace right-rail Contact/control surface contrast tuned locally; light theme materiality improved; hierarchy/content/handlers unchanged; detail legacy unchanged; real Android NOT EXECUTED — no commit / push / deploy

Doc: `docs/admin-order-workspace-contact-surface-contrast-tuning-1.md`

Contact messaging content: **STRUCTURED + FROZEN**
Contact messaging visual hierarchy: **FROZEN**
Secondary utilities visual hierarchy: **FROZEN**
Contact/right-rail surface contrast: **FROZEN**
Contextual WhatsApp default: **REMAINS PASS**
Information hierarchy: **REMAINS FROZEN**
Products / Status / Persistent mobile CTA: **REMAIN FROZEN**
Dashboard visual polish overall: **OPEN**

---

## Previous — ADMIN-ORDER-WORKSPACE-SECONDARY-ACTIONS-VISUAL-POLISH-1 — PASS WITH REAL-DEVICE QA DEBT (2026-08-27)

Status: **PASS WITH REAL-DEVICE QA DEBT** — workspace secondary utilities polished as compact icon-labeled tools; action targets/gating unchanged; Contact messaging frozen; detail legacy unchanged; real Android / explicit 390 light screenshot NOT EXECUTED — no commit / push / deploy

Doc: `docs/admin-order-workspace-secondary-actions-visual-polish-1.md`

Contact messaging content: **STRUCTURED + FROZEN**
Contact messaging visual hierarchy: **FROZEN**
Secondary utilities visual hierarchy: **FROZEN**
Contextual WhatsApp default: **REMAINS PASS**
Information hierarchy: **REMAINS FROZEN**
Products / Status / Persistent mobile CTA: **REMAIN FROZEN**
Dashboard visual polish overall: **OPEN**

---

## Previous — ADMIN-ORDER-WORKSPACE-CONTACT-MESSAGING-VISUAL-HIERARCHY-VALIDATION-1 — PASS WITH REAL-DEVICE QA DEBT (2026-08-27)

Status: **PASS WITH REAL-DEVICE QA DEBT** — authenticated browser matrix PASS @390/360/430/719/720/1440 light+dark; detail route legacy unchanged; manual override + delivery fixture PASS; real Android NOT EXECUTED — no commit / push / deploy

Doc: `docs/admin-order-workspace-contact-messaging-visual-hierarchy-validation-1.md`

Contact messaging content: **STRUCTURED / FROZEN**
Contact messaging visual hierarchy: **FROZEN** (authenticated validation closed)
Contextual WhatsApp default: **REMAINS PASS**
Secondary utilities visual polish: **DEFERRED / NOT POLISHED**
Information hierarchy: **REMAINS FROZEN**
Products / Status / Persistent mobile CTA: **REMAIN FROZEN**
Dashboard visual polish overall: **OPEN**

---

## Previous — ADMIN-ORDER-WORKSPACE-CONTACT-MESSAGING-VISUAL-HIERARCHY-POLISH-1 — PASS WITH REAL-DEVICE QA DEBT (2026-08-22)

Status: **PASS WITH REAL-DEVICE QA DEBT** — workspace Contacto hierarchy implemented; authenticated validation deferred — no commit / push / deploy

Doc: `docs/admin-order-workspace-contact-messaging-visual-hierarchy-polish-1.md`

Contact messaging content: **STRUCTURED / FROZEN**
Contact messaging visual hierarchy: **FROZEN**
Contextual WhatsApp default: **REMAINS PASS**
Secondary utilities visual polish: **DEFERRED / NOT POLISHED**
Dashboard visual polish overall: **OPEN**

---

## Previous — ADMIN-ORDER-WORKSPACE-CONTACT-MESSAGING-STRUCTURED-CONTENT-IMPL-1 — PASS — STRUCTURED CONTACT MESSAGING FROZEN (2026-08-22)

Status: **PASS** — snapshot-derived customer order summaries for WhatsApp/Copy/Share; received/summary rich; status pings minimal; Total omitted; contextual default unchanged — no commit / push / deploy

Doc: `docs/admin-order-workspace-contact-messaging-structured-content-impl-1.md`

Contact messaging content: **STRUCTURED / FROZEN** (superseded by visual hierarchy phase for presentation only)
Contextual WhatsApp default: **REMAINS PASS**
Secondary actions: **DEFERRED**
Dashboard visual polish overall: **OPEN**

---

## Previous — ADMIN-ORDER-WORKSPACE-CONTACT-MESSAGING-CONTENT-AUDIT-1 — AUDIT COMPLETE — READY FOR PRODUCT DECISIONS (2026-08-21)

Status: **AUDIT COMPLETE — READY FOR PRODUCT DECISIONS** — WhatsApp/Contact message bodies audited vs V1/V2 preparation; flat `qty×name` gap documented; architecture Option B recommended; contextual default UNCHANGED; no runtime/CSS/DB changes — no commit / push / deploy

Doc: `docs/admin-order-workspace-contact-messaging-content-audit-1.md`

Contact messaging: **AUDITED / NOT YET IMPLEMENTED** (superseded by structured-content impl)
Contextual WhatsApp default: **REMAINS PASS**
Contact visual polish: **NOT STARTED**
Secondary actions: **DEFERRED**
Dashboard visual polish overall: **OPEN**

---

## Previous — ADMIN-ORDER-WORKSPACE-MOBILE-INFORMATION-HIERARCHY-CLEANUP-1 — PASS WITH REAL-DEVICE QA DEBT (2026-08-21)

Status: **PASS WITH REAL-DEVICE QA DEBT** — quieter Indicaciones; Cliente/Entrega compact 2×2 without visible micro-labels; full order-owned name; display-only BA phone formatting; Activity removed from workspace only; Contacto/status/Products/persistent CTA unchanged; real Android/light/1440 NOT EXECUTED — no commit / push / deploy

Doc: `docs/admin-order-workspace-mobile-information-hierarchy-cleanup-1.md`

Information hierarchy: **FROZEN**
Manual status control: **REMAINS PASS**
Persistent mobile contextual action: **REMAINS PASS**
Contextual status runtime gate: **REMAINS CLOSED**
Manual status cancellation safety: **REMAINS PASS**
WhatsApp contextual default: **REMAINS PASS**
Products: **REMAINS FROZEN**
Contacto: **DEFERRED / UNCHANGED**
Dashboard visual polish overall: **OPEN**

---

## Previous — ADMIN-ORDER-WORKSPACE-MANUAL-STATUS-CONTROL-VISUAL-POLISH-1 — PASS WITH REAL-DEVICE QA DEBT (2026-08-21)

Status: **PASS WITH REAL-DEVICE QA DEBT** — native select + feature-local chevron; Guardar secondary + disabled when unchanged; cancel/contextual/mutation architecture unchanged; real Android NOT EXECUTED — no commit / push / deploy

Doc: `docs/admin-order-workspace-manual-status-control-visual-polish-1.md`

Desktop workspace visual/UX: **REMAINS FROZEN** (manual-control polish only)
Mobile workspace: **REMAINS FROZEN** (manual-control polish only)
Persistent mobile contextual action: **REMAINS PASS**
Contextual status runtime gate: **REMAINS CLOSED**
Manual status cancellation safety: **REMAINS PASS**
WhatsApp contextual default: **REMAINS PASS**
Dashboard visual polish overall: **OPEN**

---

## Previous — ADMIN-ORDER-WORKSPACE-MOBILE-PERSISTENT-STATUS-ACTION-1 — PASS WITH REAL-DEVICE QA DEBT — MOBILE WORKSPACE FROZEN (2026-08-21)

Status: **PASS WITH REAL-DEVICE QA DEBT** — authenticated footer matrix pending→preparing→ready→completed PASS; 719/720 placement PASS; single mutation controller; mobile Estado heading sr-only; real Android NOT EXECUTED — no commit / push / deploy

Doc: `docs/admin-order-workspace-mobile-persistent-status-action-1.md`

Desktop workspace visual/UX: **REMAINS FROZEN**
Mobile workspace: **FROZEN** (agent matrix PASS; real Android NOT EXECUTED)
Contextual status runtime gate: **REMAINS CLOSED**
Manual status cancellation safety: **REMAINS PASS**
WhatsApp contextual default: **REMAINS PASS**
Dashboard visual polish overall: **OPEN**

---

## Previous — ADMIN-ORDER-WORKSPACE-MOBILE-PREPARATION-QUANTITY-THREE-TRACK-POLISH-1 — PASS WITH REAL-DEVICE QA DEBT (2026-08-21)

Status: **PASS WITH REAL-DEVICE QA DEBT** — quantity-enabled mobile rows = label | per-unit | total; simple coverage/qty remain two-track; mapper/pricing/shell/header/desktop unchanged — no commit / push / deploy

Doc: `docs/admin-order-workspace-mobile-preparation-quantity-three-track-polish-1.md`

Desktop workspace visual/UX: **REMAINS FROZEN**
Mobile workspace: **FROZEN** (agent matrix PASS; real Android NOT EXECUTED)
Contextual status runtime gate: **REMAINS CLOSED**
Manual status cancellation safety: **REMAINS PASS**
WhatsApp contextual default: **REMAINS PASS**
Dashboard visual polish overall: **OPEN**

---

## Previous — ADMIN-ORDER-WORKSPACE-MOBILE-FULLSCREEN-LAYOUT-POLISH-1 — PASS WITH REAL-DEVICE QA DEBT (2026-08-21)

Status: **PASS WITH REAL-DEVICE QA DEBT** — mobile ≤719px full-screen `100dvh` workstation; deliberate 2-row header; preparation option/metadata two-track (superseded for quantity-enabled by three-track follow-up); Cliente/Entrega address full-width; desktop ≥720 unchanged / FROZEN — no commit / push / deploy

Doc: `docs/admin-order-workspace-mobile-fullscreen-layout-polish-1.md`

Desktop workspace visual/UX: **REMAINS FROZEN**
Mobile workspace: **FROZEN** (agent matrix PASS; real Android NOT EXECUTED)
Contextual status runtime gate: **REMAINS CLOSED**
Manual status cancellation safety: **REMAINS PASS**
WhatsApp contextual default: **REMAINS PASS**
Dashboard visual polish overall: **OPEN**

---

## Previous — ADMIN-ORDER-WORKSPACE-FINAL-VISUAL-UX-QA-1 — PASS WITH NON-BLOCKING P3 DEBT — WORKSPACE FROZEN (2026-08-21)

Status: **PASS WITH NON-BLOCKING P3 DEBT — WORKSPACE FROZEN** — integrated visual/UX/operational QA; P0/P1/P2 = 0; manual correction ACCEPTABLE; non-sticky action KEEP; P3 only (age copy + dual pending labels); no runtime/CSS changes — no commit / push / deploy

Doc: `docs/admin-order-workspace-final-visual-ux-qa-1.md`

Workspace visual/UX: **FROZEN** (future changes need explicit regression or new product requirement)
Contextual status runtime gate: **REMAINS CLOSED**
Manual status cancellation safety: **REMAINS PASS**
WhatsApp contextual default: **REMAINS PASS**
Dashboard visual polish overall: **OPEN** (workspace sub-scope **CLOSED**)

---

## Previous — ADMIN-ORDER-WORKSPACE-WHATSAPP-CONTEXTUAL-DEFAULT-POLISH-1 — PASS (2026-08-20)

Status: **PASS** — workspace WhatsApp default follows status + delivery_method; completed+delivery defaults to Enviar resumen (not Confirmar dirección); manual override preserved until context changes; detail surfaces unchanged — no commit / push / deploy

Doc: `docs/admin-order-workspace-whatsapp-contextual-default-polish-1.md`

Contextual status runtime gate: **REMAINS CLOSED**
Manual status cancellation safety: **REMAINS PASS**
Dashboard visual polish overall remains OPEN.

---

## Previous — ADMIN-ORDER-WORKSPACE-MANUAL-STATUS-CORRECTION-SAFETY-POLISH-1 — PASS (2026-08-20)

Status: **PASS** — manual Cancelado requires inline confirmation before existing status mutation; first Guardar never mutates; Volver resets select; contextual CTA / non-cancel manual path unchanged; stock side effect not directly verified — no commit / push / deploy

Doc: `docs/admin-order-workspace-manual-status-correction-safety-polish-1.md`

Contextual status runtime gate: **REMAINS CLOSED**
Dashboard visual polish overall remains OPEN.

---

## Previous — ADMIN-ORDER-WORKSPACE-CONTEXTUAL-STATUS-ACTION-RUNTIME-VALIDATION-RESUME-1 — PASS WITH NON-BLOCKING QA DEBT (2026-08-20)

Status: **PASS WITH NON-BLOCKING QA DEBT** — authenticated matrix pending→preparing→ready→completed PASS; P1 expectedStatus crash NONE; hard contextual runtime gate CLOSED — no commit / push / deploy

Doc: `docs/admin-order-workspace-contextual-status-action-runtime-validation-resume-1.md`

Dashboard visual polish overall remains OPEN.

---

## Previous — ADMIN-ORDER-WORKSPACE-STATUS-PENDING-MUTATION-FINALIZATION-FIX-1 — PASS WITH QA DEBT (2026-08-20)

Status: **PASS WITH QA DEBT** — P1 finalization crash fixed + regression verify PASS; authenticated runtime matrix still blocked at login — no commit / push / deploy

Doc: `docs/admin-order-workspace-status-pending-mutation-finalization-fix-1.md`

Root cause: `clearPendingMutationKind` deletes `status` in place; post-clear trace read `pendingMutation.status.expectedStatus`. Snapshot-before-clear fix. Dashboard visual polish overall remains OPEN.

---

## Previous — ADMIN-ORDER-WORKSPACE-CONTEXTUAL-STATUS-ACTION-VALIDATION-1 — PASS WITH FOLLOW-UP DEBT (2026-08-19)

Status: **PASS WITH FOLLOW-UP DEBT** — runtime mutation QA blocked; source + static validation PASS — no commit / push / deploy

Doc: `docs/admin-order-workspace-contextual-status-action-validation-1.md`

Source architecture validated (single mutation path, CTA/manual isolation, terminal behavior). Authenticated runtime transition matrix, network/event proof, and responsive visual QA remain pending. Dashboard visual polish overall remains OPEN.

---

## Previous — ADMIN-ORDER-WORKSPACE-CONTEXTUAL-STATUS-ACTION-FLOW-1 — PASS WITH VISUAL QA DEBT (2026-08-19)

Status: **PASS WITH VISUAL QA DEBT** — no commit / push / deploy

Doc: `docs/admin-order-workspace-contextual-status-action-flow-1.md`

Contextual status action flow: standalone Próximo paso/Estado final removed from workspace; one-click transitions via existing mutation path; manual selector secondary; workspace Activity max 2. WhatsApp smart default deferred. Dashboard visual polish overall remains OPEN.

---

## Previous — ADMIN-ORDER-WORKSPACE-CUSTOMER-DELIVERY-RAIL-REALIGNMENT-1 — PASS WITH VISUAL QA DEBT (2026-08-19)

Status: **PASS WITH VISUAL QA DEBT** — no commit / push / deploy

Doc: `docs/admin-order-workspace-customer-delivery-rail-realignment-1.md`

Cliente/Entrega moved from execution rail to operational rail (after Estado, before Contacto). Left rail: Productos → Indicaciones → Actividad. Independent rails/ratio/scroll unchanged. Contextual CTA and WhatsApp default remain Phase B. Dashboard visual polish overall remains OPEN.

---

## Previous — ADMIN-ORDER-WORKSPACE-INFORMATION-HIERARCHY-POLISH-1 — PASS WITH VISUAL QA DEBT (2026-08-19)

Status: **PASS WITH VISUAL QA DEBT** — no commit / push / deploy

Doc: `docs/admin-order-workspace-information-hierarchy-polish-1.md`

Phase A information hierarchy: workstation header includes Delivery/Retiro; Indicaciones after Productos (hidden when empty); Activity last on left rail; terminal eyebrow `Estado final`. Independent rails/ratio unchanged. Contextual CTA and WhatsApp default remain Phase B. Dashboard visual polish overall remains OPEN.

---

## Previous — ADMIN-ORDER-WORKSPACE-INFORMATION-ACTION-FLOW-AUDIT-1 — AUDIT COMPLETE — PRODUCT DECISIONS REQUIRED (2026-08-19)

Status: **AUDIT COMPLETE — PRODUCT DECISIONS REQUIRED** — no commit / push / deploy

Doc: `docs/admin-order-workspace-information-action-flow-audit-1.md`

Information/action flow audit: workspace PARTIALLY OPTIMIZED; notes placement, non-actionable Próximo paso, WhatsApp default selection, and header delivery context are primary P2 gaps. Contextual status CTA feasible via existing mutation path. Implementation phasing A (hierarchy) + B (action flow) recommended.

---

## Previous — ADMIN-ORDER-WORKSPACE-INDEPENDENT-RAILS-LAYOUT-FIX-1 — PASS WITH VISUAL QA DEBT (2026-08-19)

---

## Previous — ADMIN-ORDER-WORKSPACE-PREPARATION-NUMERIC-DENSITY-VISUAL-POLISH-1 — PASS WITH VISUAL QA DEBT (2026-08-19)

---

## Previous — ADMIN-ORDER-WORKSPACE-PREPARATION-PRODUCT-HEADER-TRACK-REGRESSION-FIX-1 — PASS WITH VISUAL QA DEBT (2026-08-18)

---

## Previous — ADMIN-ORDER-WORKSPACE-PREPARATION-COLUMN-ALIGNMENT-VISUAL-FIX-1 — PASS WITH VISUAL QA DEBT (2026-08-18)

---

## Previous — ADMIN-ORDER-WORKSPACE-PREPARATION-PER-UNIT-TOTAL-ADDITIONAL-POLISH-1 — PASS WITH VISUAL QA DEBT (2026-08-18)

Status: **PASS WITH VISUAL QA DEBT** — no commit / push / deploy

Doc: `docs/admin-order-workspace-preparation-per-unit-total-additional-polish-1.md`

Operational clarity polish: parent qty>1 shows unit price + line total; standard selections show `Ambas`/`N total`; V2 qty-enabled shows `×N c/u` + operational total; Adicional without child price. Mapper minimally extended for V2 `allows_option_quantity`. Authenticated viewport QA pending.

---

## Previous — ADMIN-ORDER-WORKSPACE-PRODUCT-PREPARATION-VISUAL-SEPARATION-POLISH-1 — PASS WITH VISUAL QA DEBT (2026-08-18)

Status: **PASS WITH VISUAL QA DEBT** — no commit / push / deploy

Doc: `docs/admin-order-workspace-product-preparation-visual-separation-polish-1.md`

Visual separation polish: product-unit surface, spec-style groups, Adicional boundary. Mapper/data contract unchanged. Authenticated viewport QA pending.

---

## Previous — ADMIN-ORDER-WORKSPACE-PRODUCT-PREPARATION-HIERARCHY-1 — PASS WITH VISUAL QA DEBT (2026-08-18)

Status: **PASS WITH VISUAL QA DEBT** — no commit / push / deploy

Doc: `docs/admin-order-workspace-product-preparation-hierarchy-1.md`

Snapshot-derived structured preparation hierarchy for admin workspace/detail Products: V2 quantity-aware, V1 structured fallback, legacy flat fallback, Adicional upsell label, option prices omitted. Shared renderer via `OrderProductsList`. Authenticated viewport QA pending.

---

## Previous — ADMIN-ORDER-WORKSPACE-PRODUCT-PREPARATION-HIERARCHY-AUDIT-1 — AUDIT COMPLETE (2026-08-18)

Status: **AUDIT COMPLETE — READY FOR IMPLEMENTATION** — no commit / push / deploy

Doc: `docs/admin-order-workspace-product-preparation-hierarchy-audit-1.md`

Audited order-item → snapshot V1/V2 → admin Products renderer path. Verdict: PARTIALLY SUPPORTED. Presentation-only implementation feasible.

---

## Previous — ADMIN-ORDER-WORKSPACE-MODAL-ACTION-HIERARCHY-VISUAL-FIX-1 — PASS WITH VISUAL QA DEBT (2026-08-18)

Status: **PASS WITH VISUAL QA DEBT** — no commit / push / deploy

Doc: `docs/admin-order-workspace-modal-action-hierarchy-visual-fix-1.md`

Corrective visual microfase: single visible Estado (sr-only field label); terminal CTA quiet surface; WhatsApp secondary; contact heading de-duplicated. Functional workflow unchanged. Authenticated viewport matrix still pending.

---

## Previous — ADMIN-ORDER-WORKSPACE-MODAL-HIERARCHY-POLISH-1 — PASS WITH VISUAL QA DEBT (2026-08-18)

Status: **PASS WITH VISUAL QA DEBT** — no commit / push / deploy

Doc: `docs/admin-order-workspace-modal-hierarchy-polish-1.md`

Workspace modal hierarchy polish: information left / operations right; de-nested right rail; Próximo paso copy; Unicode fix; CTA hierarchy. Functional workflow unchanged. Browser viewport matrix pending login.

---

## Previous — ADMIN-ORDER-RESPONSIBILITY-FEATURE-FLAG-VALIDATION-1 — PASS (2026-08-17)**

Status: **PASS — VALIDATED** — no commit / push / deploy

Doc: `docs/admin-order-responsibility-feature-flag-validation-1.md`

Schema aligned on dev target. Flag default OFF. OFF/ON/ON→OFF→ON matrix passed. Server assignment gate validated. Assignment data + realtime/reconciliation preserved. Final QA tenant restored to OFF.

---

## Previous — ADMIN-ORDER-RESPONSIBILITY-FEATURE-FLAG-1 (2026-08-17)

Status: **PASS — VALIDATED**

Doc: `docs/admin-order-responsibility-feature-flag-1.md`

Tenant flag `order_assignment_enabled` (default OFF). UI gated via `orderResponsibilityEnabled`. Server action hardened. Data/realtime/reconciliation preserved. No Settings toggle.

---

## Previous — ADMIN-ORDER-RESPONSIBILITY-FEATURE-FLAG-AUDIT-1 (2026-08-17)

Status: **AUDIT COMPLETE** — no runtime/CSS/DB changes

Doc: `docs/admin-order-responsibility-feature-flag-audit-1.md`

End-to-end map of order assignment/responsibility UI, actions, data, realtime. Recommended flag: `business_settings.order_assignment_enabled` (default false). Server-action hardening required. Living audit reconciled.

---

## Previous — ADMIN-DASHBOARD-KANBAN-LANE-PAGER-VISUAL-FIX-1 (2026-08-17)

Status: **PASS** — visual follow-up closed; no commit / push / deploy

Doc: `docs/admin-dashboard-kanban-lane-pager-visual-fix-1.md`

Pager moved from Completados overlay to compact board navigation row (right primary / left terminal). Neutral secondary treatment. Lane geometry + realtime/domain unchanged.

---

## Previous — ADMIN-DASHBOARD-KANBAN-TERMINAL-LANE-PAGER-1 (2026-08-17)

**ADMIN-DASHBOARD-KANBAN-TERMINAL-LANE-PAGER-1 — FUNCTIONAL PASS + VISUAL FOLLOW-UP CLOSED (2026-08-17)**

Status: **FUNCTIONAL PASS** — visual placement closed in `ADMIN-DASHBOARD-KANBAN-LANE-PAGER-VISUAL-FIX-1`

Doc: `docs/admin-dashboard-kanban-terminal-lane-pager-1.md`

Desktop Kanban (≥1200px) always shows 4 lanes. Cancelled accessed via local `"primary" | "terminal"` pager. Realtime/reconciliation untouched. Living audit reconciled.

---

## Previous — ADMIN-DASHBOARD-FORENSIC-LIVING-AUDIT-1 (2026-08-17)

**ADMIN-DASHBOARD-FORENSIC-LIVING-AUDIT-1 — AUDIT COMPLETE — LIVING SOURCE OF TRUTH ESTABLISHED (2026-08-17)**

Status: **AUDIT COMPLETE — LIVING SOURCE OF TRUTH ESTABLISHED**

Living doc: `docs/admin-dashboard-forensic-living-audit.md`
Baseline commit: `81b1162`
Docs-only. No runtime/CSS/DB changes.

---

## Previous — PUBLIC-CATALOG-FOOTER-CART-BOTTOM-SPACING-POLISH (2026-08-16)

**PUBLIC-CATALOG-FOOTER-CART-BOTTOM-SPACING-POLISH — LOCAL COMPLETE (2026-08-16)**

Status: PASS WITH ANDROID DEVICE QA PENDING

Doc: `docs/public-catalog-footer-cart-bottom-spacing-polish.md`

`.catalog-page--with-cart` padding-bottom: `100px`/`118px` → `calc(52px + max(14px, env(safe-area-inset-bottom)) + 10px)` (~76px base). FAB/footer design unchanged. CSS-only. No commit/push/deploy.

---

## Previous closed — PUBLIC-CATALOG-CHROME-FINAL-CLOSEOUT-1 (2026-08-15)

**PUBLIC-CATALOG-CHROME-FINAL-CLOSEOUT-1 — CLOSED (2026-08-15)**

Status: **PASS** — ANDROID REAL-DEVICE QA COMPLETE (drawer + footer)

Closes:
- `PUBLIC-CATALOG-NAV-DRAWER-VISUAL-POLISH-1`
- `PUBLIC-CATALOG-TENANT-FOOTER-1`

Docs: `docs/public-catalog-nav-drawer-visual-polish-1.md`, `docs/public-catalog-tenant-footer-1.md`

Footer final copy: `© {year} {businessName} · Pedidos online · Hecho con OrderOps` (link `/`, no ™).

Production: Vercel via `main` → https://orderops.vercel.app

---

## Previous — PUBLIC-CATALOG-TENANT-FOOTER-1 (2026-08-15)

**PUBLIC-CATALOG-TENANT-FOOTER-1 — CLOSED (2026-08-15)**

Status: **PASS** — ANDROID REAL-DEVICE QA COMPLETE

Doc: `docs/public-catalog-tenant-footer-1.md`

Catalog-only footer: `business.name` + server `copyrightYear` + OrderOps → `/`. No fetch. No cart state. Inside `.catalog-page` before CartBar.

---

## Previous — PUBLIC-CATALOG-NAV-DRAWER-VISUAL-POLISH-1 (2026-08-15)

**PUBLIC-CATALOG-NAV-DRAWER-VISUAL-POLISH-1 — CLOSED (2026-08-15)**

Status: **PASS** — ANDROID REAL-DEVICE QA COMPLETE

Doc: `docs/public-catalog-nav-drawer-visual-polish-1.md`

Geometry: flush-right full-height side-sheet; `min(82vw, 348px)`; left radii `22px 0 0 22px`; safe-area internal padding; desktop MQ no longer reintroduces floating card. CSS-only in `app/globals.css`.

---

## Previous — PUBLIC-CATALOG-CHROME-DRAWER-FOOTER-AUDIT-1 (2026-08-15)

**PUBLIC-CATALOG-CHROME-DRAWER-FOOTER-AUDIT-1 — AUDIT COMPLETE / READY FOR IMPLEMENTATION (2026-08-15)**

Status: **AUDIT COMPLETE / READY FOR IMPLEMENTATION**

Doc: `docs/public-catalog-chrome-drawer-footer-audit-1.md`

Findings: drawer = `PublicBusinessHeader` + `globals.css` sheet (floating card → recommend flush side-sheet); footer = `CatalogClient` + `business.name`, OrderOps link `/`. Recommend **two microphases**. No runtime changes.

---

## Previous closed — PUBLIC-CATALOG-TAP-HIGHLIGHT-POLISH-1 (2026-08-15)

**PUBLIC-CATALOG-TAP-HIGHLIGHT-POLISH-1 — CLOSED (2026-08-15)**

Status: **PASS** — ANDROID REAL-DEVICE QA COMPLETE

Doc: `docs/public-catalog-tap-highlight-polish-1.md`

Scope: `-webkit-tap-highlight-color: transparent` on `.public-business-layout` interactive descendants only. Focus-visible preserved. Android Chrome real-device confirmed tap flash removed with own button feedback intact. Production deploy via `main` + Vercel.

---

## Previous closed — PUBLIC CATALOG / CUSTOMIZATION POLISH BLOCK (2026-08-14)

**PUBLIC CATALOG / CUSTOMIZATION POLISH BLOCK — CLOSED + DEPLOYED (2026-08-14)**

Status: **PASS**

Handoff: `docs/public-catalog-customization-polish-handoff-2026-08-14.md`

Checks at close: tsc PASS · build PASS · verify PASS · diff-check PASS · lint known debt

Android final smoke: **PASS** (product owner, Android Chrome real device)

Production deploy: **PASS** — fast-forward merge `cursor-handoff-public-catalog-ui-redesign` → `main` @ `831903f` · Vercel Git integration · https://orderops.vercel.app

---

## PUBLIC-CATALOG-CUSTOMIZATION-POLISH-HANDOFF-2026-08-14

Closed scope: catalog chrome (header flow, sticky categories), product detail mobile shell, customization modal (V2 qty P1, controls, extras cards/motion, info hierarchy). See handoff doc for full detail.

---

## Previous phase (superseded by polish block close)

PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-ORDER-QA-1 complete with accepted order-submit QA debt.

## PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-ORDER-QA-1

Status: QA COMPLETE WITH ACCEPTED ORDER SUBMIT QA DEBT — MULTI-QUANTITY EXTRAS ORDER QA-1 PASSED

Validated:
Helper/static PASS (incl. P1 strict-limits microfix); payload V2; server normalize/validate/price; Snapshot V2; admin V1/V2; browser no-submit; no production mutation. Submit real not exercised (no local Docker/safe env).

Next:
PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-COMMIT-DEPLOY-1 = ALLOWED_WITH_ACCEPTED_ORDER_SUBMIT_QA_DEBT_AND_REAL_ENABLEMENT_GUARD
REAL QUANTITY GROUP ENABLEMENT remains blocked until safe submit QA or owner accepts production risk.

## Último bloque cerrado (previo)

PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-ORDER-IMPL-1 complete with order-submit QA debt.
PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-PUBLIC-CART-QA-1 complete with local-only qty fixture.
PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-SCHEMA-ADMIN-COMMIT-DEPLOY-1 complete (`842c2fc`).

## Producción

- URL: https://orderops.vercel.app
- Schema/admin quantity config: `842c2fc`
- Public cart + order qty path: local uncommitted; quantity not enabled on real groups

## Próximas fases permitidas

- PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-COMMIT-DEPLOY-1 = ALLOWED_WITH_ACCEPTED_ORDER_SUBMIT_QA_DEBT_AND_REAL_ENABLEMENT_GUARD
- PUBLIC-CATALOG-SUCCESS-EDGE-STATES-POLISH-1 = OPTIONAL
- PUBLIC-TENANT-BROWSER-BRANDING-FAVICON-CACHE-BUST-1 = BACKLOG_OPTIONAL
- PUBLIC-ORDERS-PUBLIC-CODE-SPEC-1 = BACKLOG
- PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-* = PAUSED

---

## Registro — PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-ORDER-QA-1 (2026-08-13)

**Fase:** PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-ORDER-QA-1 — Formal ORDER path QA
**Estado:** QA COMPLETE WITH ACCEPTED ORDER SUBMIT QA DEBT — MULTI-QUANTITY EXTRAS ORDER QA-1 PASSED
**Resumen:** Helper/browser PASS. P1 microfix: reject over-limit qty (no silent clamp on create_order). No safe local submit env. No production mutation. No commit/push/deploy.
- Doc: `docs/public-catalog-customization-multi-quantity-extras-order-qa-1.md`
- **QUEUE_GATE:** PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-COMMIT-DEPLOY-1 = ALLOWED_WITH_ACCEPTED_ORDER_SUBMIT_QA_DEBT_AND_REAL_ENABLEMENT_GUARD
- **QUEUE_GATE:** PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-ORDER-QA-1 = COMPLETE_WITH_ACCEPTED_ORDER_SUBMIT_QA_DEBT
- **Guard:** REAL QUANTITY GROUP ENABLEMENT REMAINS BLOCKED UNTIL SAFE ORDER SUBMIT QA OR OWNER ACCEPTS PRODUCTION RISK.

---

## Registro — PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-ORDER-IMPL-1 (2026-08-13)

**Fase:** PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-ORDER-IMPL-1 — Checkout/order quantity path
**Estado:** PASS WITH ORDER SUBMIT QA DEBT — MULTI-QUANTITY EXTRAS ORDER IMPL-1 COMPLETE
**Resumen:** Payload V2 + TS validation/pricing/snapshot V2 + admin V1/V2 display. Case C hybrid (TS SoT). No RPC migration. No real submit. WhatsApp extras = P3. No commit/push/deploy.
- Doc: `docs/public-catalog-customization-multi-quantity-extras-order-impl-1.md`
- **QUEUE_GATE:** PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-ORDER-QA-1 = ALLOWED_WITH_ORDER_SUBMIT_QA_DEBT
- **QUEUE_GATE:** PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-ORDER-IMPL-1 = COMPLETE_WITH_ORDER_SUBMIT_QA_DEBT
- **QUEUE_GATE:** PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-COMMIT-DEPLOY-1 = BLOCKED_UNTIL_ORDER_QA

---

## Registro — PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-PUBLIC-CART-QA-1 (2026-08-13)

**Fase:** PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-PUBLIC-CART-QA-1 — Public cart quantity QA
**Estado:** QA COMPLETE WITH LOCAL-ONLY QTY FIXTURE — MULTI-QUANTITY EXTRAS PUBLIC CART QA-1 PASSED
**Resumen:** Option B temporary fixture exercised qty steppers/pricing/signature/merge; fixture removed. Current tenant flag-off regression PASS. No production data mutation. No commit/push/deploy.
- Doc: `docs/public-catalog-customization-multi-quantity-extras-public-cart-qa-1.md`
- **QUEUE_GATE:** PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-ORDER-IMPL-1 = ALLOWED_WITH_LOCAL_ONLY_QTY_FIXTURE_QA

---

## Registro — PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-PUBLIC-CART-IMPL-1 (2026-08-13)

**Fase:** PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-PUBLIC-CART-IMPL-1 — Public modal/cart quantity path
**Estado:** PASS WITH LIVE QTY GROUP QA DEBT — MULTI-QUANTITY EXTRAS PUBLIC CART IMPL-1 COMPLETE
**Resumen:** Public/cart only. Flag-off groups unchanged. No checkout/order. No commit/push/deploy. Live qty-group browser QA debt accepted (no data mutation).
- Doc: `docs/public-catalog-customization-multi-quantity-extras-public-cart-impl-1.md`
- **QUEUE_GATE:** PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-PUBLIC-CART-QA-1 = ALLOWED_WITH_LIVE_QTY_GROUP_QA_DEBT

---

## Registro — PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-SCHEMA-ADMIN-COMMIT-DEPLOY-1 (2026-08-13)

**Fase:** PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-SCHEMA-ADMIN-COMMIT-DEPLOY-1 — Commit, migrate, deploy schema/admin quantity config
**Estado:** PASS WITH ACCEPTED P3 ADMIN SAVE DEBT — MULTI-QUANTITY EXTRAS SCHEMA ADMIN COMMITTED AND DEPLOYED
**Resumen:** Release schema+admin only. Migration `20260813010000` applied before promote. Public binary behavior unchanged. P3 admin save debt accepted. No merge main.
- Branch: `cursor-handoff-public-catalog-ui-redesign`
- **QUEUE_GATE:** PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-PUBLIC-CART-IMPL-1 = ALLOWED_WITH_ACCEPTED_P3_ADMIN_SAVE_DEBT
- **QUEUE_GATE:** PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-SCHEMA-ADMIN-COMMIT-DEPLOY-1 = COMPLETE_WITH_ACCEPTED_P3_ADMIN_SAVE_DEBT

---

## Registro — PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-SCHEMA-ADMIN-QA-1 (2026-08-13)

**Fase:** PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-SCHEMA-ADMIN-QA-1 — Formal QA for schema + admin quantity config
**Estado:** QA COMPLETE WITH ACCEPTED P3 ADMIN SAVE DEBT — MULTI-QUANTITY EXTRAS SCHEMA ADMIN QA-1 PASSED
**Resumen:** SQL/types/admin code PASS; public modal sigue radio/checkbox; tsc/build PASS. P3: admin save + local migration (Docker down) + types manual. Sin commit/push/deploy/remote DB.
- Doc: `docs/public-catalog-customization-multi-quantity-extras-schema-admin-qa-1.md`
- Branch: `cursor-handoff-public-catalog-ui-redesign` @ `89aecc2` (+ dirty IMPL)
- **QUEUE_GATE:** PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-SCHEMA-ADMIN-COMMIT-DEPLOY-1 = ALLOWED_WITH_ACCEPTED_P3_ADMIN_SAVE_DEBT
- **Sin:** runtime/CSS/DB remote, product mutation, commit, push, deploy

---

## Registro — PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-SCHEMA-ADMIN-IMPL-1 (2026-08-13)

**Fase:** PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-SCHEMA-ADMIN-IMPL-1 — Schema + admin config for quantity-enabled extras
**Estado:** PASS WITH ADMIN SAVE QA DEBT — MULTI-QUANTITY EXTRAS SCHEMA ADMIN IMPL-1 COMPLETE
**Resumen:** Migration columns + CHECKs; types manual; admin toggle/max units/max option qty; parsers + persist; public untouched. P3: no admin save (avoid DB mutation); types gen script absent. Sin commit/push/deploy/remote push.
- Doc: `docs/public-catalog-customization-multi-quantity-extras-schema-admin-impl-1.md`
- Branch: `cursor-handoff-public-catalog-ui-redesign` @ `89aecc2` (+ dirty IMPL)
- **QUEUE_GATE:** PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-SCHEMA-ADMIN-QA-1 = ALLOWED_WITH_ADMIN_SAVE_DEBT
- **Sin:** public modal, cart, checkout, create_order, production DB push, commit, push, deploy

---

## Registro — PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-SPEC-1 (2026-08-12)

**Fase:** PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-SPEC-1 — Product/technical spec for quantity-enabled extras
**Estado:** SPEC COMPLETE WITH DATA MODEL MIGRATION REQUIRED — MULTI-QUANTITY EXTRAS READY FOR PHASED IMPL
**Resumen:** Locked Option E+B/C: group/option fields, dual max semantics, selection V2, pricing × qty, signature with xN, snapshot V2, admin + modal UX, phased SCHEMA→PUBLIC-CART→ORDER→QA/DEPLOY. Solo docs.
- Doc: `docs/public-catalog-customization-multi-quantity-extras-spec-1.md`
- Branch: `cursor-handoff-public-catalog-ui-redesign` @ `89aecc2`
- **QUEUE_GATE:** PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-SCHEMA-ADMIN-IMPL-1 = ALLOWED
- **Sin:** runtime, CSS, DB, migrations, checkout/create_order, commit, push, deploy

---

## Registro — PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-AUDIT-1 (2026-08-12)

**Fase:** PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-AUDIT-1 — Forensic audit for repeated optional extras quantity
**Estado:** AUDIT COMPLETE WITH DATA MODEL DEBT — MULTI-QUANTITY EXTRAS READY FOR SPEC
**Resumen:** Modelo actual = IDs binarios; máx. N = opciones distintas; pricing/cart/snapshot sin qty por extra. UX rec: E+B/C. Spec debe migrar end-to-end (signature + snapshot). Solo docs.
- Doc: `docs/public-catalog-customization-multi-quantity-extras-audit-1.md`
- Branch: `cursor-handoff-public-catalog-ui-redesign` @ `89aecc2`
- **QUEUE_GATE:** PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-SPEC-1 = ALLOWED_WITH_AUDIT_DEBT
- **Sin:** runtime, CSS, DB, commit, push, deploy

---

## Registro — PUBLIC-CATALOG-MVP-ENTRY-ROUTING-COMMIT-DEPLOY-1 (2026-08-12)

**Fase:** PUBLIC-CATALOG-MVP-ENTRY-ROUTING-COMMIT-DEPLOY-1 — Commit, push and production deploy catalog-first entry
**Estado:** PASS WITH ACCEPTED P3 FALLBACK DEBT — PUBLIC CATALOG MVP ENTRY ROUTING COMMITTED AND DEPLOYED
**Resumen:** Release Option D: ready redirect `/catalogo`, not-ready fallback, header sin Home, WA inquiry gated. P3 fallback browser debt accepted (no empty tenant without DB mutation). No merge main; no checkout/create_order/motion/DB.
- Docs: audit/spec/impl/qa + motion final handoff + `CURRENT_PHASE` + living memory
- Branch: `cursor-handoff-public-catalog-ui-redesign`
- **QUEUE_GATE:** PUBLIC-CATALOG-MVP-ENTRY-ROUTING-COMMIT-DEPLOY-1 = COMPLETE_WITH_ACCEPTED_P3_FALLBACK_DEBT
- **QUEUE_GATE:** PUBLIC-CATALOG-MVP-V1-ENTRY-COMPLETE = COMPLETE_WITH_ACCEPTED_P3_FALLBACK_DEBT

---

## Registro — PUBLIC-CATALOG-MVP-ENTRY-ROUTING-QA-1 (2026-08-12)

**Fase:** PUBLIC-CATALOG-MVP-ENTRY-ROUTING-QA-1 — Formal QA for MVP hybrid catalog-first entry routing
**Estado:** QA COMPLETE WITH ACCEPTED P3 FALLBACK DEBT — PUBLIC CATALOG MVP ENTRY ROUTING QA-1 PASSED
**Resumen:** Ready 307 + UTM + open-redirect safety PASS; catalog/checkout/success/404 PASS; header sin Home; WA helper null PASS; readiness sin store session; branding PASS. Not-ready browser: P3 accepted (no empty tenant without DB mutation; code path evidenced). Sin commit/push/deploy.
- Doc: `docs/public-catalog-mvp-entry-routing-qa-1.md`
- Branch: `cursor-handoff-public-catalog-ui-redesign` @ `3d83afd` (+ dirty IMPL + QA doc)
- **QUEUE_GATE:** PUBLIC-CATALOG-MVP-ENTRY-ROUTING-COMMIT-DEPLOY-1 = ALLOWED_WITH_ACCEPTED_P3_FALLBACK_DEBT
- **QUEUE_GATE:** PUBLIC-CATALOG-MVP-ENTRY-ROUTING-QA-1 = COMPLETE_WITH_ACCEPTED_P3_FALLBACK_DEBT
- **Sin:** runtime/CSS/routing/DB changes, commit, push, deploy

---

## Registro — PUBLIC-CATALOG-MVP-ENTRY-ROUTING-IMPL-1 (2026-08-12)

**Fase:** PUBLIC-CATALOG-MVP-ENTRY-ROUTING-IMPL-1 — Implement MVP hybrid catalog-first public business entry
**Estado:** PASS WITH QA DEBT — PUBLIC CATALOG MVP ENTRY ROUTING IMPL-1 COMPLETE
**Resumen:** `/b/[slug]` ready → 307 `/catalogo`; not-ready → fallback mínimo; header sin Home; WA inquiry gated; readiness sin `on_demand`. P3: no tenant not-ready real para browser QA. Sin commit/push/deploy.
- Doc: `docs/public-catalog-mvp-entry-routing-impl-1.md`
- Branch: `cursor-handoff-public-catalog-ui-redesign` @ `3d83afd` (+ dirty IMPL)
- **QUEUE_GATE:** PUBLIC-CATALOG-MVP-ENTRY-ROUTING-QA-1 = ALLOWED
- **QUEUE_GATE:** PUBLIC-CATALOG-MVP-ENTRY-ROUTING-COMMIT-DEPLOY-1 = PAUSED_UNTIL_QA_OR_ACCEPTED_DEBT
- **Sin:** commit, push, deploy, checkout/create_order, motion, DB

---

## Registro — PUBLIC-CATALOG-MVP-ENTRY-ROUTING-SPEC-1 (2026-08-12)

**Fase:** PUBLIC-CATALOG-MVP-ENTRY-ROUTING-SPEC-1 — Product and technical spec for MVP catalog-first public entry
**Estado:** SPEC COMPLETE — PUBLIC CATALOG MVP ENTRY ROUTING READY FOR IMPL
**Resumen:** Spec Option D hybrid catalog-first: ready → redirect `/catalogo`; not-ready → fallback mínimo; landing larga preservada fuera del path; header sin “Home”; WA gated; readiness = productos visibles (`is_available`) sin `on_demand`. Solo docs.
- Doc: `docs/public-catalog-mvp-entry-routing-spec-1.md`
- Branch: `cursor-handoff-public-catalog-ui-redesign` @ `3d83afd`
- **QUEUE_GATE:** PUBLIC-CATALOG-MVP-ENTRY-ROUTING-IMPL-1 = ALLOWED
- **QUEUE_GATE:** PUBLIC-CATALOG-MVP-ENTRY-ROUTING-SPEC-1 = COMPLETE
- **Sin:** runtime, CSS, routing, DB, commit, push, deploy

---

## Registro — PUBLIC-CATALOG-MVP-ENTRY-ROUTING-AUDIT-1 (2026-08-12)

**Fase:** PUBLIC-CATALOG-MVP-ENTRY-ROUTING-AUDIT-1 — Forensic audit before MVP public business entry spec
**Estado:** AUDIT COMPLETE — PUBLIC CATALOG MVP ENTRY ROUTING READY FOR SPEC
**Resumen:** Auditoría forense de rutas públicas, landing, readiness (sin flag publish), WhatsApp CTA, metadata. Recomendación Option D hybrid catalog-first. Solo docs; sin runtime/CSS/routing/commit/push/deploy. `ORDEROPS_LIVING_MEMORY.md` no tocado (se actualiza en spec/impl).
- Doc: `docs/public-catalog-mvp-entry-routing-audit-1.md`
- Branch: `cursor-handoff-public-catalog-ui-redesign` @ `3d83afd`
- **QUEUE_GATE:** PUBLIC-CATALOG-MVP-ENTRY-ROUTING-SPEC-1 = ALLOWED
- **QUEUE_GATE:** PUBLIC-CATALOG-MOTION-PUBLIC-CATALOG-COMPLETE = COMPLETE
- **Sin:** runtime, CSS, routing, DB, commit, push, deploy

---

## Registro — PUBLIC-CATALOG-MOTION-FINAL-HANDOFF-1 (2026-08-12)

**Fase:** PUBLIC-CATALOG-MOTION-FINAL-HANDOFF-1 — Final documentation handoff for completed public catalog motion block
**Estado:** HANDOFF COMPLETE — PUBLIC CATALOG MOTION BLOCK CLOSED
**Resumen:** Handoff documental del bloque motion completo (interactions + CartSheet + Customization + upsell + product detail + PRM). Producción validada en `3d83afd` / `dpl_EFjoBKzm7mi2A39zNmynDXeGRWsT`. Solo docs; sin runtime/CSS/commit/push/deploy.
- Doc: `docs/public-catalog-motion-final-handoff-1.md`
- Branch: `cursor-handoff-public-catalog-ui-redesign` @ `3d83afd`
- **QUEUE_GATE:** PUBLIC-CATALOG-MOTION-PUBLIC-CATALOG-COMPLETE = COMPLETE
- **QUEUE_GATE:** PUBLIC-CATALOG-SUCCESS-EDGE-STATES-POLISH-1 = OPTIONAL
- **QUEUE_GATE:** PUBLIC-TENANT-BROWSER-BRANDING-FAVICON-CACHE-BUST-1 = BACKLOG_OPTIONAL
- **QUEUE_GATE:** PUBLIC-ORDERS-PUBLIC-CODE-SPEC-1 = BACKLOG
- **QUEUE_GATE:** PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-* = PAUSED
- **Sin:** commit, push, deploy, DB, create_order, pedidos reales

---

## Registro — PUBLIC-CATALOG-UI-REDESIGN-FINAL-COMMIT-1 (2026-08-10)

**Fase:** PUBLIC-CATALOG-UI-REDESIGN-FINAL-COMMIT-1 — Final local commit for Public Catalog UI Redesign package
**Estado:** PASS WITH COMMIT DEBT — PUBLIC CATALOG UI REDESIGN FINAL COMMIT CREATED
**Resumen:** Commit local `feat(public-catalog): complete UI redesign closeout` con runtime catalog/checkout/success/FAB/ProductCard/header/nav + docs de fases + closeout. Sin push/deploy. Lint tooling circular aceptado (P3). Maps PAUSED; public_order_code BACKLOG; success edge OPTIONAL.
- Doc: `docs/public-catalog-ui-redesign-final-commit-1.md`
- Branch: `cursor-handoff-public-catalog-ui-redesign`
- **QUEUE_GATE:** PUBLIC-CATALOG-UI-REDESIGN-PUSH-DEPLOY-1 = ALLOWED
- **QUEUE_GATE:** PUBLIC-CATALOG-PRODUCTION-SMOKE-QA-1 = PAUSED_UNTIL_DEPLOY
- **QUEUE_GATE:** PUBLIC-CATALOG-SUCCESS-EDGE-STATES-POLISH-1 = OPTIONAL
- **QUEUE_GATE:** PUBLIC-ORDERS-PUBLIC-CODE-SPEC-1 = BACKLOG
- **QUEUE_GATE:** PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-* = PAUSED
- **Próximo:** PUBLIC-CATALOG-UI-REDESIGN-PUSH-DEPLOY-1
- **Sin:** push, deploy, DB, create_order, pedidos reales

---

## Registro — PUBLIC-CATALOG-UI-REDESIGN-CLOSEOUT-1 (2026-08-10)

**Fase:** PUBLIC-CATALOG-UI-REDESIGN-CLOSEOUT-1 — Public Catalog UI Redesign final closeout before commit / push / deploy
**Estado:** PASS WITH CLOSEOUT DEBT — PUBLIC CATALOG UI REDESIGN CLOSEOUT READY FOR COMMIT
**Resumen:** Closeout formal del rediseño visual/UX (catalog shell, ProductCard badge roots, FAB, checkout flat, success flat, header/nav). Inventario runtime+docs, contratos preservados, QA browser final, tsc/build/HTTP PASS. Lint tooling fallido (ESLint circular). Sin commit/push/deploy. Maps pausado; public_order_code backlog; success edge optional.
- Doc: `docs/public-catalog-ui-redesign-closeout-1.md`
- Branch: `cursor-handoff-public-catalog-ui-redesign` @ `b2321b0` (working tree dirty)
- **QUEUE_GATE:** PUBLIC-CATALOG-UI-REDESIGN-FINAL-COMMIT-1 = ALLOWED
- **QUEUE_GATE:** PUBLIC-CATALOG-UI-REDESIGN-PUSH-DEPLOY-1 = PAUSED_UNTIL_COMMIT
- **QUEUE_GATE:** PUBLIC-CATALOG-PRODUCTION-SMOKE-QA-1 = PAUSED_UNTIL_DEPLOY
- **QUEUE_GATE:** PUBLIC-CATALOG-SUCCESS-EDGE-STATES-POLISH-1 = OPTIONAL
- **QUEUE_GATE:** PUBLIC-ORDERS-PUBLIC-CODE-SPEC-1 = BACKLOG
- **QUEUE_GATE:** PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-* = PAUSED
- **Próximo:** PUBLIC-CATALOG-UI-REDESIGN-FINAL-COMMIT-1
- **Sin:** commit, push, deploy, DB, create_order, pedidos reales

---

## Registro — PUBLIC-CATALOG-RESIDUAL-ROADMAP-DEPLOY-1 (2026-08-02)

**Fase:** PUBLIC-CATALOG-RESIDUAL-ROADMAP-DEPLOY-1 — Consolidación, commit, push, deploy y smoke de producción
**Estado:** PASS WITH ACCEPTED REAL-DEVICE AND PROVIDER-ACTIVATION QA DEBT — RESIDUAL ROADMAP DEPLOYED
**Resumen:** Consolidación del roadmap residual: navegación/búsqueda client-side de catálogos grandes, validación argentina de teléfono, autocomplete de dirección con fallback manual y correcciones visuales/semánticas. Sin DB, migraciones, RPC, packages ni pedidos reales.
- **Release:** `3bd26ff` → Vercel `dpl_DPv6mEwxE6UsaS5pMec3TZME35V2` Ready → `https://orderops.vercel.app`
- **QUEUE_GATE:** PUBLIC-CATALOG-RESIDUAL-ROADMAP-DEPLOY-1 = COMPLETE
- **Próximo:** Roadmap residual cerrado; QA real-device/Maps permanece deuda aceptada.

---

## Registro - PUBLIC-CATALOG-POST-ADD-UPSELL-POST-DEPLOY-MONITOR-1-FOLLOWUP-2 (2026-08-01)

**Fase:** PUBLIC-CATALOG-POST-ADD-UPSELL-POST-DEPLOY-MONITOR-1-FOLLOWUP-2 - Full Post-Fix Production Re-Monitor
**Estado:** PARTIAL - FOLLOWUP-2 PRODUCTION COVERAGE INCOMPLETE
**Resumen:** Git, focus trap pre/post attach, modal sin Plus, created-to-post-add y attach pasaron en produccion. El unico retry completo alcanzo `Listo`, pero el locator de CartSheet hizo timeout; el resto del funnel y la ventana A/B/C quedan unverified. No hay P0/P1/P2 confirmado.
- Doc: `docs/public-catalog-post-add-upsell-post-deploy-monitor-1-followup-2.md`
- **QUEUE_GATE:** PUBLIC-CATALOG-POST-ADD-UPSELL-FINAL-HANDOFF-1 = BLOCKED
- **Proximo:** repetir FOLLOWUP-2 con automatizacion estable del CartSheet.

---

## Registro - PUBLIC-CATALOG-POST-ADD-UPSELL-FOCUS-TRAP-FIX-1 (2026-08-01)

**Fase:** PUBLIC-CATALOG-POST-ADD-UPSELL-FOCUS-TRAP-FIX-1 - Targeted Post-Add Dialog Focus Containment
**Estado:** PASS - POST-ADD FOCUS TRAP FIX VERIFIED IN PRODUCTION - FINAL HANDOFF STILL BLOCKED
**Resumen:** El P2 reproducible de Tab/Shift+Tab que escapaba del post-add fue corregido con un cambio minimo en el listener de teclado del sheet. Chrome + Playwright de Codex verificaron ocho ciclos Tab y Shift+Tab dentro del dialogo antes y despues de adjuntar Coca Cola 500ml. Sin DB, submit ni pedidos reales.
- Doc: `docs/public-catalog-post-add-upsell-focus-trap-fix-1.md`
- **QUEUE_GATE:** PUBLIC-CATALOG-POST-ADD-UPSELL-POST-DEPLOY-MONITOR-1-FOLLOWUP-2 = ALLOWED
- **QUEUE_GATE:** PUBLIC-CATALOG-POST-ADD-UPSELL-FINAL-HANDOFF-1 = BLOCKED
- **Proximo:** PUBLIC-CATALOG-POST-ADD-UPSELL-POST-DEPLOY-MONITOR-1-FOLLOWUP-2

---

## Registro — PUBLIC-CATALOG-POST-ADD-UPSELL-POST-DEPLOY-MONITOR-1-FOLLOWUP (2026-08-01)

**Fase:** PUBLIC-CATALOG-POST-ADD-UPSELL-POST-DEPLOY-MONITOR-1-FOLLOWUP — Browser-Core Production Verification
**Estado:** BLOCKED — RUNTIME FIX REQUIRED · POST-ADD FOCUS TRAP REGRESSION
**Resumen:** Followup de Codex verificó el browser core funcional, pero el probe final Tab/Shift+Tab reprodujo escape de foco desde el post-add hacia controles del catálogo. Es P2: no se habilita final handoff; no se aplicó runtime fix, DB, submit ni deploy.
- Doc: `docs/public-catalog-post-add-upsell-post-deploy-monitor-1-followup.md`
- **QUEUE_GATE:** PUBLIC-CATALOG-POST-ADD-UPSELL-FINAL-HANDOFF-1 = BLOCKED
- **Próximo:** RUNTIME FIX REQUIRED — OPEN NEW PHASE, luego re-ejecutar followup
- **Sin:** Vercel CLI/logs, real device, screen reader, preview, closed-store, PWA

---

## Registro — PUBLIC-CATALOG-POST-ADD-UPSELL-POST-DEPLOY-MONITOR-PARTIAL-HANDOFF-1 (2026-08-01)

**Fase:** PUBLIC-CATALOG-POST-ADD-UPSELL-POST-DEPLOY-MONITOR-PARTIAL-HANDOFF-1 — Document Partial Codex Monitor Evidence, Reconcile Active Phase & Preserve Final Handoff Block
**Estado:** PARTIAL HANDOFF COMPLETE — CODEX HTTP/GIT MONITOR DOCUMENTED · BROWSER CORE STILL BLOCKED
**Resumen:** Codex reanudó el monitor post-deploy en MODE C HTTP/GIT ONLY. Git y `origin/main` quedaron reconciliados en `eac9d17`; arquitectura single-group verificada; catálogo y checkout HTTP 200. Browser funnel, network, console y Vercel deployment/log identity quedaron UNVERIFIED por limitaciones del entorno. Se documentó el monitor parcial. Final handoff permanece bloqueado.
- Doc: `docs/public-catalog-post-add-upsell-post-deploy-monitor-1.md`
- **QUEUE_GATE:** PUBLIC-CATALOG-POST-ADD-UPSELL-POST-DEPLOY-MONITOR-1-FOLLOWUP = ALLOWED
- **QUEUE_GATE:** PUBLIC-CATALOG-POST-ADD-UPSELL-FINAL-HANDOFF-1 = BLOCKED
- **Próximo:** PUBLIC-CATALOG-POST-ADD-UPSELL-POST-DEPLOY-MONITOR-1-FOLLOWUP
- **Sin:** re-run runtime, browser claims, Vercel claims, DB, checkout submit, commit, push o deploy

---

## Registro — PUBLIC-CATALOG-POST-ADD-UPSELL-DEPLOY-1 (2026-07-31)

**Fase:** PUBLIC-CATALOG-POST-ADD-UPSELL-DEPLOY-1 — Controlled Package Audit, Atomic Git Release, Production Deployment, Read-Only Smoke & Safe Revert Rollback
**Estado:** DEPLOYED WITH NON-BLOCKING QA DEBT — SINGLE-GROUP POST-ADD UPSELL LIVE
**Resumen:** Commit funcional `6d138a6` pusheado a `origin/main`. Vercel production Ready (`dpl_6Z7qqAG3a8uJHbpm4HSBqow4zcAR` → `https://orderops.vercel.app`). Smoke prod: modal sin Plus, post-add created, attach, qty/edit preserve, remove signature, checkout sin submit. Sin DB/migrations/pedidos. Rollback no requerido.
- Doc: `docs/public-catalog-post-add-upsell-deploy-1.md`
- **QUEUE_GATE:** PUBLIC-CATALOG-POST-ADD-UPSELL-POST-DEPLOY-MONITOR-1 = ALLOWED
- **Próximo:** PUBLIC-CATALOG-POST-ADD-UPSELL-POST-DEPLOY-MONITOR-1 (read-only)
- **Sin:** monitor extendido en esta fase; submit; DB

---

## Registro — PUBLIC-CATALOG-CART-EDIT-QUANTITY-PRESERVATION-FIX-1 (2026-07-31)

**Fase:** PUBLIC-CATALOG-CART-EDIT-QUANTITY-PRESERVATION-FIX-1 — Preserve Parent and Child Quantity Through Customized Cart Editing Without Reopening Post-Add
**Estado:** PASS — CUSTOMIZED CART EDIT PRESERVES ROOT AND CHILD QUANTITY
**Resumen:** P1 quantity reset N→1 en edit `replaced` corregido en C1: `preservedQuantity` desde `existingParent`. Children/totals/root-only count correctos; `replaced` sin post-add; created/merged intactos. Fixtures EDIT-QTY-01…15 + Cleanup/C1/U1 + tsc/build + browser core PASS. Sin DB/checkout submit/commit/push/deploy.
- Doc: `docs/public-catalog-cart-edit-quantity-preservation-fix-1.md`
- **QUEUE_GATE:** PUBLIC-CATALOG-POST-ADD-UPSELL-DEPLOY-1 = HUMAN_REVIEW_REQUIRED
- **Deploy:** READY FOR HUMAN DEPLOY REVIEW
- **Próximo:** PUBLIC-CATALOG-POST-ADD-UPSELL-DEPLOY-1 (revisión humana)

---

## Registro — PUBLIC-CATALOG-POST-ADD-UPSELL-QA-2 (2026-07-31)

**Fase:** PUBLIC-CATALOG-POST-ADD-UPSELL-QA-2 — Integrated Single-Group Post-Add Upsell QA, Authorized Local Fixes & Human-Reviewed Deploy Readiness
**Estado:** PASS WITH NON-BLOCKING QA DEBT — SINGLE-GROUP POST-ADD UPSELL VERIFIED AND READY FOR HUMAN DEPLOY REVIEW
**Resumen:** Gate IMPL ALLOWED revalidado. Fixtures Cleanup/C1/U1 + tsc/build PASS. Browser core PASS (modal sin Plus, created→post-add, attach, merge, edit, checkout sin submit). Fix P1: rebuild signature al remover child Plus. Fix P2: focus trap Tab en sheet. Deploy readiness HUMAN REVIEW. Sin DB/checkout submit/commit/push/deploy.
- Doc: `docs/public-catalog-post-add-upsell-qa-2.md`
- **QUEUE_GATE:** PUBLIC-CATALOG-POST-ADD-UPSELL-DEPLOY-1 = HUMAN_REVIEW_REQUIRED
- **Deploy:** READY FOR HUMAN DEPLOY REVIEW
- **Cola:** TERMINA AQUÍ — sin deploy automático

---

## Registro — PUBLIC-CATALOG-POST-ADD-UPSELL-IMPL-1 (2026-07-31)

**Fase:** PUBLIC-CATALOG-POST-ADD-UPSELL-IMPL-1 — Move Single Plus Group from Modal to Safe Post-Add Sheet
**Estado:** PASS WITH NON-BLOCKING QA DEBT — SIMPLIFIED SINGLE-GROUP POST-ADD UPSELL IMPLEMENTED
**Resumen:** Plus fuera del modal; `productNeedsCustomizationModal` = `hasCustomizations`; post-add solo `created` + candidatos desde `config.upsellGroup`; attach vía C1; merged/replaced → CartSheet; simple quick-add sin post-add. Fixtures U1/C1/Cleanup + tsc/build + browser core PASS. Sin DB/checkout/submit/deploy/commit.
- Doc: `docs/public-catalog-post-add-upsell-impl-1.md`
- **QUEUE_GATE:** PUBLIC-CATALOG-POST-ADD-UPSELL-QA-2 = ALLOWED
- **Próximo:** PUBLIC-CATALOG-POST-ADD-UPSELL-QA-2
- **Sin:** placement, segundo grupo, migration, checkout submit, deploy/commit/push

---

## Registro — PUBLIC-CATALOG-UPSELL-REALIGNMENT-CLEANUP-1 (2026-07-31)

**Fase:** PUBLIC-CATALOG-UPSELL-REALIGNMENT-CLEANUP-1 — Remove Unnecessary Placement Domain, Restore Single Plus Group, Recover Public Customization & Preserve Safe Cart Foundations
**Estado:** PASS — D1 REMOVED, SINGLE-UPSELL BASELINE RESTORED, CATALOG RECOVERED
**Resumen:** Placement/postAddUpsellGroup/migración D1 retirados. Un solo upsellGroup; Plus vuelve al modal; summaries recuperados (42703 placement confirmado y eliminado). C1 retenido + `eligibleAttachedUpsellProductIds`. Logging safe conservado. Sin U1/UI post-add. Sin mutaciones DB/prod.
- Doc: `docs/public-catalog-upsell-realignment-cleanup-1.md`
- **QUEUE_GATE:** PUBLIC-CATALOG-POST-ADD-UPSELL-IMPL-1 = ALLOWED
- **Próximo:** PUBLIC-CATALOG-POST-ADD-UPSELL-IMPL-1
- **Sin:** post-add sheet, placement, migration apply, checkout submit, deploy/commit/push

---

## Registro — PUBLIC-CATALOG-POST-ADD-UPSELL-D1-SCHEMA-RUNTIME-FIX-1 (2026-07-31)

**Fase:** PUBLIC-CATALOG-POST-ADD-UPSELL-D1-SCHEMA-RUNTIME-FIX-1 — Active Database Identification, Placement Schema Alignment, Safe Diagnostics & Public Catalog Recovery
**Estado:** BLOCKED — PRODUCTION MIGRATION OUT OF SCOPE · DIAGNOSTICS IMPROVED · CATALOG NOT RECOVERED · **SUPERSEDED BY UPSELL REALIGNMENT CLEANUP-1**
**Resumen:** `next dev` apunta a producción `pkrsedmwxekbhlohhqds`. Docker local caído. Tokens remote-dev ausentes. Migration D1 NO aplicada. Logging PostgREST restaurado (`safe-error-details` + corpus throws). Fixtures/tsc/build PASS. Sin U1/checkout/pedidos/deploy.
- Doc: `docs/public-catalog-post-add-upsell-d1-schema-runtime-fix-1.md`
- **Próximo:** (superseded) realignment cleanup → IMPL-1
- **Sin:** production migration, U1, checkout, pedidos, deploy/commit/push

---

## Registro — PUBLIC-CATALOG-POST-ADD-UPSELL-QA-1 (2026-07-31)

**Fase:** PUBLIC-CATALOG-POST-ADD-UPSELL-QA-1 — Integrated Domain, Cart Contract, Public UX, Network, Accessibility & No-Order Verification
**Estado:** BLOCKED — PUBLIC-CATALOG-POST-ADD-UPSELL-IMPL-1 NOT COMPLETE · NOT READY FOR DEPLOY
**Resumen:** Mode A QA-only. Gate U1 FAIL: sin doc IMPL-1, sin sheet, sin candidate filter, sin orquestación `created`→post-add, sin attach desde UI. Fixtures D1/C1 + tsc/build PASS. Schema local UNAVAILABLE. Sin browser integrado, sin pedidos, sin fixes, sin adelantar U1.
- Doc: `docs/public-catalog-post-add-upsell-qa-1.md`
- **Próximo:** PUBLIC-CATALOG-POST-ADD-UPSELL-IMPL-1 → re-ejecutar Q1
- **Sin:** U1 implementation, runtime fixes, remote migration, deploy/commit/push

---

## Registro — PUBLIC-CATALOG-POST-ADD-UPSELL-CART-CONTRACT-1 (2026-07-31)

**Fase:** PUBLIC-CATALOG-POST-ADD-UPSELL-CART-CONTRACT-1 — Deterministic Parent Mutation Outcomes, Child Attachment, Signature Safety & Edit Preservation
**Estado:** PASS WITH CART RUNTIME QA DEBT · D1 LOCAL DB MIGRATION QA DEBT — INHERITED
**Resumen:** Merge discriminado (`created`/`merged`/`replaced` + fallos); `parentCartLineId` final; `attachUpsellChildToParent` idempotente con signature conflict; `buildUpsellChildCartLine` compartido; preserve post-add en edit; callsites sin UI post-add. Fixtures/tsc/build PASS. Runtime browser no corrido (schema D1).
- Doc: `docs/public-catalog-post-add-upsell-cart-contract-1.md`
- Fixture: `lib/cart/post-add-upsell-contract.verify.ts`
- **Próximo:** PUBLIC-CATALOG-POST-ADD-UPSELL-IMPL-1
- **Sin:** post-add UI, DB, placement, checkout, create_order, deploy/commit/push

---

## Registro — PUBLIC-CATALOG-POST-ADD-UPSELL-DOMAIN-1 (2026-07-31)

**Fase:** PUBLIC-CATALOG-POST-ADD-UPSELL-DOMAIN-1 — Placement Domain, Admin Configuration & Public Surface Resolution
**Estado:** PASS WITH LOCAL DB MIGRATION QA DEBT · PASS WITH ADMIN RUNTIME QA DEBT
**Resumen:** `upsell_groups.placement` (`in_modal`|`post_add`, default/backfill `in_modal`); unique por target+placement; admin radios/badges; resolver por superficie; config `upsellGroup` + `postAddUpsellGroup`; modal/hasUpsell solo in_modal; sin UI post-add; sin cart contract. Fixtures/tsc/build PASS. Migration local UNVERIFIED (Docker down).
- Doc: `docs/public-catalog-post-add-upsell-domain-1.md`
- Migration: `supabase/migrations/20260731233000_post_add_upsell_group_placement.sql`
- **Próximo:** PUBLIC-CATALOG-POST-ADD-UPSELL-CART-CONTRACT-1 (completado en código)
- **Sin:** both, post-add UI, merge/attach cart, checkout, remote migration, deploy/commit/push

---

## Registro — PUBLIC-CATALOG-POST-ADD-UPSELL-SPEC-1 (2026-07-31)

**Fase:** PUBLIC-CATALOG-POST-ADD-UPSELL-SPEC-1 — Post-Add Upsell Product, Domain & Technical Specification
**Estado:** SPEC COMPLETE · **GO WITH DOMAIN PREREQUISITE** · DOCS-ONLY
**Resumen:** Spec cerrada del post-add Plus. Placement **no existe** hoy; Opción A (repetir Plus in-modal) rechazada. MVP = V2 parent nuevo + cache 0 POST + placement group-level `in_modal|post_add|both` (spec closure fijó binario sin `both`) + merge outcome/`cartLineId` + attach child helper + sheet descartable + count root-only. Legacy/cross-sell root fuera. Sin implementación runtime/DB.
- Doc: `docs/public-catalog-post-add-upsell-spec-1.md`
- Preflight: `main` @ `5dd9b41` · dirty ajeno no limpiado
- **Próximo:** PUBLIC-CATALOG-POST-ADD-UPSELL-DOMAIN-1 (completado en código; apply DB pendiente)
- **Sin:** código, DB, RLS, RPC, actions, cart, checkout, deps, deploy/commit/push

---

## Registro — PUBLIC-CATALOG-INTEGRATED-CONVERSION-QA-1 (2026-07-31)

**Fase:** PUBLIC-CATALOG-INTEGRATED-CONVERSION-QA-1 — End-to-End Public Catalog Conversion Funnel QA Without Real Order Creation
**Estado:** PASS WITH PREVIEW QA DEBT · PASS WITH DEVICE QA DEBT · SUBMIT REAL NOT EXECUTED BY SCOPE
**Resumen:** QA-only del funnel catálogo → modal → FAB → sheet → checkout. Root-only count, parent/child prices, Plus remove/edit/qty, mix (5), remove parent sin orphans, cache 1/0 POST, checkout modality 0 fetch, empty states. Preview/device/closed-store deuda. Sin fixes de código. Action/`create_order` intactos.
- Doc: `docs/public-catalog-integrated-conversion-qa-1.md`
- Runtime: `localhost:3000/b/demohamburgueseria/*` · viewport ~390×844
- CLI: `tsc` PASS · `build` PASS · `actions.ts` limpio
- **Próximo:** PUBLIC-CATALOG-POST-ADD-UPSELL-SPEC-1 (completado)
- **Sin:** DB, RLS, RPC, checkout action, create_order, payload, cart schema, pedidos reales, deploy/commit/push

---

## Registro — PUBLIC-CATALOG-CHECKOUT-SUMMARY-VISUAL-QA-FIX-1 (2026-07-30)

**Fase:** PUBLIC-CATALOG-CHECKOUT-SUMMARY-VISUAL-QA-FIX-1 — Parent/Upsell Price Clarity, Customer-Facing Root Count & Mobile Overlay Verification
**Estado:** PASS WITH PREVIEW QA DEBT · PASS WITH DEVICE QA DEBT · SUBMIT REAL NOT EXECUTED BY SCOPE
**Resumen:** Contador customer-facing root-only (`getCartItemCount` via hierarchical rows; Plus no inflan). Precios parent/child separados (`lineTotal` propio; sin groupTotal ambiguo) en checkout y cart sheet. Header comercial estático solo en `/checkout` (sticky real corregido). CTA sticky con scroll-padding/margin; foco sin cobertura. Totals/payload/action/`create_order` intactos.
- Doc: `docs/public-catalog-checkout-summary-visual-qa-fix-1.md`
- Runtime: checkout “1 producto” + parent $15.250 / child $3.000 / total $18.250 · FAB simple “1 producto” · header `position:static` en checkout
- CLI: `tsc` PASS · `build` PASS · tsx fixtures PASS
- **Próximo:** PUBLIC-CATALOG-INTEGRATED-CONVERSION-QA-1 (completado)
- **Sin:** DB, RLS, RPC, checkout action, create_order, payload, cart schema, pedidos reales, deploy/commit/push

---

## Registro — PUBLIC-CATALOG-CHECKOUT-CONVERSION-POLISH-1 (2026-07-30)

**Fase:** PUBLIC-CATALOG-CHECKOUT-CONVERSION-POLISH-1 — Segmented Mobile Checkout, Form Clarity & Final Conversion Surface
**Estado:** PASS WITH PREVIEW QA DEBT · PASS WITH DEVICE QA DEBT · SUBMIT REAL NOT EXECUTED BY SCOPE
**Resumen:** Checkout público reorganizado en secciones mobile-first (header “Finalizá tu pedido”, segmented Envío/Retiro con values `delivery`/`pickup`, Tus datos, entrega/retiro condicional, notas, resumen jerárquico, CTA sticky `Enviar pedido · $X`). Module CSS con tokens. Payload, `createPublicCheckoutOrderAction`, `create_order`, cart schema, pricing y preview guard intactos. Sin forma de pago (N/A). Sin Google Places ni phone AR. Sin pedidos reales.
- Doc: `docs/public-catalog-checkout-conversion-polish-1.md`
- Deploy base: `fb19a3a`
- Live: `https://orderops.vercel.app`
- Runtime: modality/typing `0` fetch · V2+upsell summary `$12.000` · empty PASS · client validation PASS · preview UNVERIFIED
- CLI: `tsc` PASS · `build` PASS · lint no ejecutado
- **Próximo:** PUBLIC-CATALOG-INTEGRATED-CONVERSION-QA-1
- **Sin:** DB, RLS, RPC, checkout action, create_order, payload, cart schema, pedidos reales, deploy/commit/push

---

## Registro — PUBLIC-CATALOG-CART-SHEET-USABILITY-1 (2026-07-30)

**Fase:** PUBLIC-CATALOG-CART-SHEET-USABILITY-1 — Mobile Cart Sheet Hierarchy, Controls & Checkout Readiness
**Estado:** PASS WITH PREVIEW QA DEBT
**Resumen:** Se pulió el cart sheet público mobile: header “Tu pedido” + conteo, jerarquía clara simple/V2/upsell, controles iconográficos (lucide), stepper tocable, footer sticky con Total + “Continuar al checkout”, empty state con “Seguir comprando”. Se preservaron cart schema, callbacks de qty/edit/remove, pricing, checkout destination y preview isolation. Acciones locales sin fetch. Sin post-add upsell, DB/RLS/RPC, create_order, deps nuevas ni deploy.
- Doc: `docs/public-catalog-cart-sheet-usability-1.md`
- Deploy base: `fb19a3a`
- Live: `https://orderops.vercel.app`
- Runtime: qty/remove `0` POST · edit modal cache-hit `0` POST · empty state PASS · checkout boundary sin submit
- CLI: `tsc` PASS · `build` PASS · lint no ejecutado
- **Próximo:** PUBLIC-CATALOG-CHECKOUT-CONVERSION-POLISH-1 (completado) o PUBLIC-CATALOG-POST-ADD-UPSELL-SPEC-1
- **Sin:** DB, RLS, RPC, checkout action, pedidos reales, deploy/commit/push funcional

---

## Registro — PUBLIC-CATALOG-CUSTOMIZATION-MODAL-UX-POLISH-1 (2026-07-30)

**Fase:** PUBLIC-CATALOG-CUSTOMIZATION-MODAL-UX-POLISH-1 — Compact Premium UX for Public Customization Modal
**Estado:** PASS WITH PREVIEW QA DEBT
**Resumen:** Se implementó el polish UX mobile del modal público de personalización: header más compacto/premium, grupos obligatorios full-width, grupos no obligatorios en grilla compacta, opciones más densas pero tocables, CTA inferior con total final (`Agregar · $X`) y micro-interacción CSS-only del precio al cambiar el total. Se preservó el fix de performance anterior: cache `slug:productId`, dedupe in-flight, reopen cache-hit sin loading/POST, productos simples sin fetch y detail path compartido. No se implementó post-add upsell ni Google Places. Sin DB/RLS/RPC/checkout action/create_order/cart schema/cache tags/image/env/CSP/deploy.
- Doc: `docs/public-catalog-customization-modal-ux-polish-1.md`
- Deploy base: `fb19a3a`
- Live: `https://orderops.vercel.app`
- Runtime: first open `1` POST · reopen same product `0` POST · simple product `0` POST
- CLI: `tsc` PASS · `build` PASS · lint no ejecutado
- **Próximo:** PUBLIC-CATALOG-POST-ADD-UPSELL-SPEC-1 o PUBLIC-CATALOG-CART-SHEET-USABILITY-1
- **Sin:** DB, RLS, RPC, checkout action, pedidos reales, deploy/commit/push funcional

---

## Registro — PUBLIC-CATALOG-CUSTOMIZATION-MODAL-PERF-FIX-1 (2026-07-30)

**Fase:** PUBLIC-CATALOG-CUSTOMIZATION-MODAL-PERF-FIX-1 — Client Cache & In-flight Dedupe for Customization Modal
**Estado:** PASS WITH PREVIEW QA DEBT
**Resumen:** Se implementó el fix A+B recomendado por la auditoría del modal de personalización: cache client-side por `productId` en `CatalogClient` e in-flight dedupe por producto para evitar refetch/loading repetido al cerrar y reabrir el mismo producto. El primer open sigue on-demand; los reopens cache-hit no disparan nuevos `Next-Action` POST; productos simples siguen sin fetch; el path desde detail comparte cache. Se preservaron cart schema, checkout, create_order, Product Customization server-side validation, cache strategy/tags, image loader, preview boundaries, CSP y PWA. Sin DB/RLS/RPC/migraciones/pedidos reales/deploy.
- Doc: `docs/public-catalog-customization-modal-perf-fix-1.md`
- Deploy base: `fb19a3a`
- Live: `https://orderops.vercel.app`
- Runtime: first open `1` POST · reopen same product `0` POST · simple product `0` POST
- CLI: `tsc` PASS · `build` PASS · lint no ejecutado
- **Próximo:** PUBLIC-CATALOG-CUSTOMIZATION-MODAL-UX-POLISH-1
- **Sin:** DB, RLS, RPC, checkout action, pedidos reales, deploy/commit/push funcional

---

## Registro — PUBLIC-CATALOG-CUSTOMIZATION-MODAL-PERF-AUDIT-1 (2026-07-30)

**Fase:** PUBLIC-CATALOG-CUSTOMIZATION-MODAL-PERF-AUDIT-1 — Forensic Audit of Customization Modal Repeated Loading
**Estado:** PERF AUDIT COMPLETE — FIX RECOMMENDED
**Resumen:** Se auditó forensemente el flujo de carga del modal de personalización público, revisando source, loader/endpoint, requests al primer open, close/reopen del mismo producto, apertura de múltiples productos, control de productos simples, path desde detail modal, network profile, performance percibida y tenant/security boundaries. La fase es audit-only: sin fix de cache, sin prefetch, sin cambios de modal UX, sin DB/RLS/RPC/checkout/create_order/cart schema/cache/image/env/CSP/deploy.
- Doc: `docs/public-catalog-customization-modal-perf-audit-1.md`
- Deploy base: `fb19a3a`
- Live: `https://orderops.vercel.app`
- Runtime finding: cada open/reopen refetch via server action + `noStore()`; config solo en estado local del modal (unmount al cerrar); local/dev 2× Next-Action POST ~3s ready
- CLI: `tsc` no ejecutado · `build` no ejecutado · lint no ejecutado
- **Próximo:** PUBLIC-CATALOG-CUSTOMIZATION-MODAL-PERF-FIX-1
- **Sin:** DB, RLS, RPC, checkout action, pedidos reales, deploy/commit/push funcional

---

## Registro — PUBLIC-CATALOG-PRODUCT-CARDS-SINGLETON-WIDTH-FIX-1 (2026-07-30)

**Fase:** PUBLIC-CATALOG-PRODUCT-CARDS-SINGLETON-WIDTH-FIX-1 — Keep Single-Product Categories at Grid Card Width
**Estado:** PASS WITH PREVIEW QA DEBT
**Resumen:** Se corrigió el comportamiento visual de categorías con un solo producto para que la card conserve el mismo ancho que las cards normales de la grilla de 2 columnas, en lugar de ocupar todo el ancho. Se preservaron cards image-first, quick `+`, header hide, category sticky, FAB, cart schema, checkout, create_order, cache, Product Customization server-side, image loader, CSP y PWA. Sin DB/RLS/RPC/migraciones/pedidos reales/deploy.
- Doc: `docs/public-catalog-product-cards-singleton-width-fix-1.md`
- Deploy base: `fb19a3a`
- Live: `https://orderops.vercel.app`
- CLI: `tsc` PASS · `build` PASS · lint no ejecutado
- **Próximo:** PUBLIC-CATALOG-CUSTOMIZATION-MODAL-PERF-AUDIT-1
- **Sin:** DB, RLS, RPC, checkout action, pedidos reales, deploy/commit/push funcional

---

## Registro — PUBLIC-CATALOG-PRODUCT-CARDS-GRID-POLISH-1 (2026-07-30)

**Fase:** PUBLIC-CATALOG-PRODUCT-CARDS-GRID-POLISH-1 — Mobile 2-Column Product Cards & Quick Add Polish
**Estado:** PASS WITH PREVIEW QA DEBT
**Resumen:** Se implementó la segunda fase de conversión del catálogo público: cards mobile en 2 columnas, layout image-first, descripción truncada, card completa abre detalle y acción rápida `+` agrega productos simples o abre el modal si el producto requiere personalización. Se eliminó “Ver detalle” de las cards y se ajustaron sizes de imágenes para el nuevo layout. Se preservaron header/FAB del shell, cache, checkout, create_order, cart schema, Product Customization server-side, image loader, preview admin boundaries, CSP y PWA. Sin DB/RLS/RPC/migraciones/pedidos reales/deploy.
- Doc: `docs/public-catalog-product-cards-grid-polish-1.md`
- Deploy base: `fb19a3a`
- Live: `https://orderops.vercel.app`
- CLI: `tsc` PASS · `build` PASS · lint no ejecutado
- **Próximo:** PUBLIC-CATALOG-CUSTOMIZATION-MODAL-PERF-AUDIT-1
- **Sin:** DB, RLS, RPC, checkout action, pedidos reales, deploy/commit/push funcional

---

## Registro — PUBLIC-CATALOG-SHELL-CART-SURFACES-POLISH-1 (2026-07-30)

**Fase:** PUBLIC-CATALOG-SHELL-CART-SURFACES-POLISH-1 — Header Hide, Sticky Categories & Compact Cart FAB
**Estado:** PASS WITH PREVIEW QA DEBT
**Resumen:** Se implementó el primer bloque de conversión del catálogo público: header hide-on-scroll, categorías sticky con offset correcto, carrito vacío sin superficie visible y cart FAB compacto solo con ícono+cantidad cuando hay productos. Se aplicó hero mobile compacto/premium si fue seguro dentro del shell. Se preservaron cache, checkout, create_order, cart schema, Product Customization, preview admin, image loader, CSP y PWA. Sin DB/RLS/RPC/migraciones/pedidos reales/deploy.
- Doc: `docs/public-catalog-shell-cart-surfaces-polish-1.md`
- Deploy base: `fb19a3a`
- Live: `https://orderops.vercel.app`
- CLI: `tsc` PASS · `build` PASS · lint no ejecutado
- **Próximo:** PUBLIC-CATALOG-PRODUCT-CARDS-GRID-POLISH-1
- **Sin:** DB, RLS, RPC, checkout action, pedidos reales, deploy/commit/push funcional

---

## Registro — PUBLIC-CATALOG-CONVERSION-SPEC-CLOSURE-1 (2026-07-30)

**Fase:** PUBLIC-CATALOG-CONVERSION-SPEC-CLOSURE-1 — Final Product & Technical Spec Closure for Public Catalog Conversion Roadmap
**Estado:** SPEC CLOSED
**Resumen:** Se cerró formalmente la spec de producto/técnica para la línea Public Catalog Conversion Surfaces. Quedaron congeladas las decisiones finales: header hide-on-scroll, hero compacto premium, categorías sticky/active, cart vacío oculto, cart FAB solo ícono+cantidad, cards 2 columnas con quick `+`, modal performance audit/fix, modal UX compacta, post-add upsell solo spec por ahora, cart sheet con iconos, checkout segmented, phone AR y Google Places como spec futura. Se definió deploy agrupado tras implementación + QA integrada. Docs-only, sin código funcional, sin DB/RLS/RPC/checkout action/create_order/cart schema/cache/Product Customization/image/env/CSP/deploy.
- Doc: `docs/public-catalog-conversion-spec-closure-1.md`
- Deploy base: `fb19a3a`
- Live: `https://orderops.vercel.app`
- CLI: `tsc` no ejecutado · `build` no ejecutado · lint histórico
- **Próximo:** PUBLIC-CATALOG-SHELL-CART-SURFACES-POLISH-1
- **Sin:** código funcional, DB, RLS, RPC, checkout action, pedidos reales, deploy/commit/push funcional

---

## Registro — PUBLIC-CATALOG-CONVERSION-SURFACES-AUDIT-SPEC-1 (2026-07-30)

**Fase:** PUBLIC-CATALOG-CONVERSION-SURFACES-AUDIT-SPEC-1 — Public Catalog Conversion Surfaces Audit & Product Spec
**Estado:** SPEC READY
**Resumen:** Se auditó y especificó la próxima evolución de conversión del catálogo público, cubriendo header, hero, categorías, cards, cart FAB, modal de personalización, post-add upsell, carrito y checkout. La fase fue docs/spec-only, preservando el performance budget: sin server calls nuevos, sin cache changes, sin Google Places implementation, sin librerías pesadas, sin DB/RLS/RPC/checkout action/create_order/cart schema/Product Customization/image/env/CSP/deploy.
- Doc: `docs/public-catalog-conversion-surfaces-audit-spec-1.md`
- Deploy base: `fb19a3a`
- Live: `https://orderops.vercel.app`
- CLI: `tsc` no ejecutado · `build` no ejecutado · lint histórico
- **Próximo:** PUBLIC-CATALOG-SHELL-CART-SURFACES-POLISH-1
- **Sin:** código funcional, DB, RLS, RPC, checkout action, pedidos reales, deploy/commit/push funcional

---

## Registro — PUBLIC-CATALOG-PREVIOUS-SLUG-CALLERS-FIX-1 (2026-07-30)

**Fase:** PUBLIC-CATALOG-PREVIOUS-SLUG-CALLERS-FIX-1 — Pass previousSlug Through Public Catalog Cache Invalidation Callers
**Estado:** PASS WITH RUNTIME SLUG QA DEBT
**Resumen:** Se corrigió el wiring de invalidación del catálogo público para que el server action capaz de cambiar el slug público (`updateBusinessAction` super-admin) capture el slug anterior antes del update y lo pase como `previousSlug` a `revalidatePublicCatalogCache`. El helper invalida paths del slug actual y anterior, preservando tags/scopes existentes. Callers tenant admin no cambian slug (sin contaminación). Sin DB/RLS/RPC/checkout action/carrito schema/Product Customization/image transforms/CSP/envs/pedidos reales. Runtime slug rename QA no ejecutado por falta de auth.
- Doc: `docs/public-catalog-previous-slug-callers-fix-1.md`
- Deploy base: `fb19a3a`
- Live: `https://orderops.vercel.app`
- CLI: `tsc` PASS · `build` PASS · lint no ejecutado
- Runtime slug QA: `NOT RUN`
- **Próximo:** PUBLIC-CATALOG-CACHE-MUTATION-RUNTIME-QA-2-FOLLOWUP o slug rename QA con `AUTORIZO_SLUG_RENAME_CACHE_QA_PROD=yes`
- **Sin:** DB, RLS, RPC, checkout action, pedidos reales, deploy/commit/push funcional

---

## Registro — PUBLIC-CATALOG-REAL-DEVICE-QA-1 (2026-07-30)

**Fase:** PUBLIC-CATALOG-REAL-DEVICE-QA-1 — Real Device QA for Public Catalog V1
**Estado:** BLOCKED — REAL DEVICE UNAVAILABLE
**Resumen:** No se ejecutó QA real-device porque no hubo hardware disponible operable (sin ADB/platform-tools; PnP Samsung USB Unknown; browser Cursor = desktop Chromium). No se reemplazó por emulación como PASS. Deuda P3 Real device QA permanece. Sin DB/RLS/RPC/checkout action/carrito schema/cache strategy/Product Customization/image transforms/CSP/envs/código.
- Doc: `docs/public-catalog-real-device-qa-1.md`
- Deploy base: `fb19a3a`
- Live: `https://orderops.vercel.app`
- Devices: `Android Chrome UNAVAILABLE / iOS UNVERIFIED / PWA UNVERIFIED`
- CLI: `tsc` no ejecutado · `build` no ejecutado · lint histórico
- **Próximo:** PUBLIC-CATALOG-REAL-DEVICE-QA-1-FOLLOWUP (con Android Chrome real) o PUBLIC-CATALOG-PREVIOUS-SLUG-CALLERS-FIX-1
- **Sin:** DB, RLS, RPC, checkout action, pedidos reales, código funcional

---

## Registro — PUBLIC-CATALOG-PREVIEW-AUTH-SMOKE-1 (2026-07-29)

**Fase:** PUBLIC-CATALOG-PREVIEW-AUTH-SMOKE-1 — Authenticated Admin Preview Deep Smoke for Public Catalog V1
**Estado:** PASS WITH MINOR PREVIEW QA DEBT
**Resumen:** Se ejecutó smoke autenticado profundo de `/admin/products/preview`, validando shell admin, iframe real del catálogo, modo seguro, carrito preview aislado, clear cart, Product Customization dentro del iframe, checkout preview bloqueado, público normal intacto, CSP/frame boundary y ausencia de pedidos reales. Sin DB/RLS/RPC/checkout action/carrito schema/cache strategy/Product Customization/image transforms/CSP/envs.
- Doc: `docs/public-catalog-preview-auth-smoke-1.md`
- Deploy base: `fb19a3a`
- Live: `https://orderops.vercel.app`
- Auth: `PASS`
- Iframe deep: `PASS`
- CLI: `tsc` no ejecutado · `build` no ejecutado · lint histórico
- **Próximo:** PUBLIC-CATALOG-REAL-DEVICE-QA-1
- **Sin:** DB, RLS, RPC, checkout action, pedidos reales, código funcional

---

## Registro — PUBLIC-CATALOG-IMAGE-TRANSFORMS-INFRA-1-MODE-B (2026-07-29)

**Fase:** PUBLIC-CATALOG-IMAGE-TRANSFORMS-INFRA-1-MODE-B — Authorized Supabase Image Transformations Enablement & Production Verification
**Estado:** BLOCKED — MISSING IMAGE TRANSFORMS ENABLE AUTH
**Resumen:** No se tocó Supabase infra porque faltó autorización explícita de enable y/o billing (`AUTORIZO_SUPABASE_IMAGE_TRANSFORMATIONS_ENABLE=yes` y `AUTORIZO_SUPABASE_IMAGE_TRANSFORMATIONS_BILLING_ACCEPTED=yes`). Source loader/fallback intacto; baseline object **200** / render **403 FeatureNotEnabled**. Sin DB/RLS/RPC/checkout action/carrito schema/cache strategy/Product Customization/CSP/pedidos reales.
- Doc: `docs/public-catalog-image-transforms-infra-1-mode-b.md`
- Deploy base: `fb19a3a`
- Live: `https://orderops.vercel.app`
- Render status: `403`
- Billing/plan: `blocked`
- CLI: `tsc` no ejecutado · `build` no ejecutado · lint histórico
- **Próximo:** re-run Mode B con ambos tokens auth, o PUBLIC-CATALOG-OBSERVABILITY-PROD-ENABLE-1 / PUBLIC-CATALOG-PREVIEW-AUTH-SMOKE-1
- **Sin:** DB, RLS, RPC, checkout action, pedidos reales, código funcional salvo fix mínimo autorizado

---

## Registro — PUBLIC-CATALOG-OBSERVABILITY-PROD-ENABLE-1 (2026-07-29)

**Fase:** PUBLIC-CATALOG-OBSERVABILITY-PROD-ENABLE-1 — Controlled Production Enablement for Public Catalog Observability
**Estado:** BLOCKED — MISSING OBSERVABILITY PROD ENABLE AUTH
**Resumen:** No se tocaron envs de Vercel porque faltó `AUTORIZO_PUBLIC_CATALOG_OBSERVABILITY_PROD_ENABLE=yes`. Source privacy-safe y endpoint 204 intactos; normal beacons siguen debug-only. Sin DB/RLS/RPC/checkout action/carrito schema/cache strategy/Product Customization/image transforms/CSP/pedidos reales.
- Doc: `docs/public-catalog-observability-prod-enable-1.md`
- Deploy base: `fb19a3a`
- Live: `https://orderops.vercel.app`
- Env principal: `off/blocked`
- Logs prod: `off`
- CLI: `tsc` no ejecutado · `build` no ejecutado · lint histórico
- **Próximo:** re-run con `AUTORIZO_PUBLIC_CATALOG_OBSERVABILITY_PROD_ENABLE=yes` o PUBLIC-CATALOG-IMAGE-TRANSFORMS-INFRA-1-MODE-B
- **Sin:** DB, RLS, RPC, checkout action, pedidos reales, código funcional

---

## Registro — PUBLIC-CATALOG-CACHE-MUTATION-RUNTIME-QA-2-FOLLOWUP (2026-07-29)

**Fase:** PUBLIC-CATALOG-CACHE-MUTATION-RUNTIME-QA-2-FOLLOWUP — Authorized Runtime QA for Public Catalog Cache Invalidation
**Estado:** BLOCKED — MISSING MUTATION AUTH
**Resumen:** No se ejecutó el followup runtime porque faltó `AUTORIZO_CACHE_MUTATION_RUNTIME_QA_PROD=yes`. Sin mutaciones productivas. Source/baseline previos de QA-2 Modo A siguen vigentes. Checkout/create_order/cart/pricing/stock/cache strategy/CSP/pedidos no tocados.
- Doc: `docs/public-catalog-cache-mutation-runtime-qa-2-followup.md`
- Deploy base: `fb19a3a`
- Live: `https://orderops.vercel.app`
- CLI: `tsc` no ejecutado · `build` no ejecutado · lint histórico
- **Próximo:** re-run FOLLOWUP con `AUTORIZO_CACHE_MUTATION_RUNTIME_QA_PROD=yes` o PUBLIC-CATALOG-OBSERVABILITY-PROD-ENABLE-1
- **Sin:** DB, RLS, RPC, checkout action, pedidos reales, deploy/commit/push funcional

---

## Registro — PUBLIC-CATALOG-CACHE-MUTATION-RUNTIME-QA-2 (2026-07-29)

**Fase:** PUBLIC-CATALOG-CACHE-MUTATION-RUNTIME-QA-2 — Runtime QA for Public Catalog Cache Invalidation After Admin Mutations
**Estado:** PASS WITH RUNTIME MUTATION AUTH DEBT
**Resumen:** Se validó source-level la invalidación del cache público (`revalidatePublicCatalogCache` + tags + fresh ordering noStore) y baseline productivo read-only. No se ejecutaron mutaciones admin productivas por falta de `AUTORIZO_CACHE_MUTATION_RUNTIME_QA_PROD=yes`. Checkout boundary y metrics 204 intactos; sin pedidos reales. Slug rename/flag toggle/ordering status quedan documentados como UNVERIFIED pending autorización.
- Doc: `docs/public-catalog-cache-mutation-runtime-qa-2.md`
- Deploy base: `fb19a3a`
- Live: `https://orderops.vercel.app`
- CLI: `tsc` no ejecutado · `build` no ejecutado · lint histórico
- **Próximo:** PUBLIC-CATALOG-CACHE-MUTATION-RUNTIME-QA-2-FOLLOWUP (con auth) o PUBLIC-CATALOG-OBSERVABILITY-PROD-ENABLE-1
- **Sin:** DB, RLS, RPC, checkout action, pedidos reales, deploy/commit/push funcional

---

## Registro — PUBLIC-CATALOG-POST-DEPLOY-MONITOR-1 (2026-07-29)

**Fase:** PUBLIC-CATALOG-POST-DEPLOY-MONITOR-1 — Post-Deploy Production Monitor for Public Catalog V1
**Estado:** PASS WITH NON-BLOCKING QA DEBT
**Resumen:** Se ejecutó monitor productivo read-only del catálogo público V1 luego del deploy agrupado y handoff final. Se validaron health checks, catálogo, Product Customization, cart/checkout boundary, observability debug, performance sanity, Image Transforms debt, preview boundary, console/network, mobile smoke y frescura observacional. Sin DB/RLS/RPC/checkout action/carrito schema/cache strategy/preview logic/CSP/pedidos reales.
- Doc: `docs/public-catalog-post-deploy-monitor-1.md`
- Deploy base: `fb19a3a`
- Live: `https://orderops.vercel.app`
- CLI: `tsc` no ejecutado · `build` no ejecutado · lint histórico
- **Próximo:** PUBLIC-CATALOG-CACHE-MUTATION-RUNTIME-QA-2 o PUBLIC-CATALOG-IMAGE-TRANSFORMS-INFRA-1-MODE-B
- **Sin:** DB, RLS, RPC, checkout action, pedidos reales, deploy/commit/push funcional

---

## Registro — PUBLIC-CATALOG-FINAL-HANDOFF-1 (2026-07-29)

**Fase:** PUBLIC-CATALOG-FINAL-HANDOFF-1 — Public Catalog V1 Final Technical & Product Handoff
**Estado:** FEATURE CLOSED — DEPLOYED WITH NON-BLOCKING QA DEBT
**Resumen:** Se cerró formalmente el roadmap V1 del catálogo público. Quedan consolidados arquitectura, data path, cache/invalidation, Product Customization summary-lite, UX de compra, scroll mobile polish, observability privacy-safe, seguridad, QA productiva, rollback y deuda residual. Producción live en `https://orderops.vercel.app`; último paquete funcional `fb19a3a`. Sin DB/RLS/RPC/checkout action/carrito schema/cache strategy/preview logic/CSP/pedidos reales.
- Doc: `docs/public-catalog-final-handoff-1.md`
- Deploy base: `PUBLIC-CATALOG-ROADMAP-DEPLOY-1`
- Commit funcional roadmap: `fb19a3a`
- Estado deploy: `DEPLOYED WITH NON-BLOCKING QA DEBT`
- CLI: `tsc` no ejecutado · `build` no ejecutado · lint histórico
- **Próximo opcional:** PUBLIC-CATALOG-POST-DEPLOY-MONITOR-1 o PUBLIC-CATALOG-IMAGE-TRANSFORMS-INFRA-1-MODE-B
- **Sin:** DB, RLS, RPC, checkout action, pedidos reales, deploy/commit/push funcional

---

## Registro — PUBLIC-CATALOG-ROADMAP-DEPLOY-1 (2026-07-29)

**Fase:** PUBLIC-CATALOG-ROADMAP-DEPLOY-1 — Controlled Deploy for Public Catalog Roadmap Package
**Estado:** DEPLOYED WITH NON-BLOCKING QA DEBT
**Resumen:** Se desplegó el paquete agrupado del roadmap de catálogo público: scroll mobile polish, corpus customization filtrado, UX de conversión y observability foundation privacy-safe. Image Transforms queda como deuda infra (`FeatureNotEnabled`) hasta autorización. Producción smokeada en catálogo, observability debug, checkout boundary y preview admin según auth disponible. Sin DB/RLS/RPC/checkout action/carrito schema/cache strategy/preview logic/CSP/pedidos reales.
- Doc: `docs/public-catalog-roadmap-deploy-1.md`
- Commit funcional: `fb19a3a`
- Commit docs: `55f866f`
- Deploy: `https://orderops.vercel.app`
- CLI: `tsc` PASS · `build` PASS · lint histórico
- **Próximo:** PUBLIC-CATALOG-FINAL-HANDOFF-1 o PUBLIC-CATALOG-POST-DEPLOY-MONITOR-1
- **Sin:** DB, RLS, RPC, checkout action, pedidos reales

---

## Registro — PUBLIC-CATALOG-OBSERVABILITY-1 (2026-07-29)

**Fase:** PUBLIC-CATALOG-OBSERVABILITY-1 — Public Catalog Web Vitals & UX Observability Foundation
**Estado:** PASS WITH PREVIEW QA DEBT
**Resumen:** Se agregó una base privacy-safe de observabilidad para el catálogo público: Web Vitals, métricas custom livianas, debug mode y endpoint 204 sin DB/Supabase/PII, preservando checkout, cart schema, cache, corpus summary-lite, image loader, preview admin y UX polish. Sin DB/RLS/RPC/checkout action/carrito schema/cache/corpus/preview logic/CSP/pedidos reales.
- Doc: `docs/public-catalog-observability-1.md`
- Código: `components/public/catalog/public-catalog-observability.tsx`, `lib/observability/public-catalog-metrics.ts`, `app/api/observability/public-catalog/route.ts`, `components/public/catalog/public-catalog-page.tsx`
- CLI: `tsc` PASS · `build` PASS · lint histórico
- **Próximo:** PUBLIC-CATALOG-ROADMAP-DEPLOY-1 o PUBLIC-CATALOG-FINAL-HANDOFF-1
- **Sin:** DB, RLS, RPC, checkout action, pedidos reales, deploy/commit/push

---

## Registro — PUBLIC-CATALOG-CONVERSION-UX-POLISH-1 (2026-07-29)

**Fase:** PUBLIC-CATALOG-CONVERSION-UX-POLISH-1 — Public Catalog Shopping Experience & Conversion Clarity
**Estado:** PASS WITH PREVIEW QA DEBT
**Resumen:** Se mejoró la claridad de compra del catálogo público: cards, CTAs, “Desde”, productos con opciones, modal customization, carrito y microcopy customer-facing, preservando pricing, cart schema, checkout, cache, corpus summary-lite, preview admin y scroll polish. Sin DB/RLS/RPC/checkout action/carrito schema/cache/corpus/preview logic/CSP/pedidos reales.
- Doc: `docs/public-catalog-conversion-ux-polish-1.md`
- Código: `product-card.tsx`, `product-detail-modal.tsx`, `cart-bar.tsx`, `cart-sheet.tsx`, `customization-modal.tsx`, `catalog-client.tsx`, `customization-option-group.tsx`, `app/globals.css`, `customization-modal.module.css`
- CLI: `tsc` PASS · `build` PASS · lint histórico
- **Próximo:** PUBLIC-CATALOG-OBSERVABILITY-1 o PUBLIC-CATALOG-ROADMAP-DEPLOY-1
- **Sin:** DB, RLS, RPC, checkout action, pedidos reales, deploy/commit/push

---

## Registro — PUBLIC-CATALOG-IMAGE-TRANSFORMS-INFRA-1 (2026-07-29)

**Fase:** PUBLIC-CATALOG-IMAGE-TRANSFORMS-INFRA-1 — Enable Supabase Image Transformations & Verify Real Bytes
**Estado:** PASS WITH INFRA AUTH DEBT
**Resumen:** Se validó/habilitó Supabase Image Transformations para el catálogo público: `render/image` 403 FeatureNotEnabled, browser `currentSrc` object (fallback tras intento render), bytes reales object medidos por curl (logo ~918 KB / cover ~1.8 MB / thumb ~338 KB), fallback seguro intacto. Sin autorización para habilitar infra. Sin DB/RLS/RPC/checkout action/carrito schema/cache/corpus/scroll/preview logic/CSP/pedidos reales.
- Doc: `docs/public-catalog-image-transforms-infra-1.md`
- Código: `<sin cambios>`
- Infra: `sin autorización — FeatureNotEnabled`
- CLI: `tsc` PASS · `build` PASS · lint histórico
- **Próximo:** PUBLIC-CATALOG-ROADMAP-DEPLOY-1 o PUBLIC-CATALOG-OBSERVABILITY-1
- **Sin:** DB, RLS, RPC, checkout action, pedidos reales, deploy/commit/push

---

## Registro — PUBLIC-CATALOG-CORPUS-OVERFETCH-FIX-1 (2026-07-29)

**Fase:** PUBLIC-CATALOG-CORPUS-OVERFETCH-FIX-1 — Public Customization Corpus Overfetch Reduction
**Estado:** PASS WITH PREVIEW QA DEBT
**Resumen:** Se redujo el overfetch del corpus público de Product Customization para el catálogo: summaries calculados con un read model limitado a productos/categorías visibles, groups/options/overrides/upsells relevantes y modal config on-demand intacta. Sin DB/RLS/RPC/checkout action/carrito schema/cache strategy/preview logic/CSP/pedidos reales.
- Doc: `docs/public-catalog-corpus-overfetch-fix-1.md`
- Código: `lib/product-customization/public.ts`, `lib/catalog/public-cached-data.ts`
- CLI: `tsc` PASS · `build` PASS · lint histórico
- **Próximo:** PUBLIC-CATALOG-ROADMAP-DEPLOY-1 o PUBLIC-CATALOG-IMAGE-TRANSFORMS-INFRA-1
- **Sin:** DB, RLS, RPC, checkout action, pedidos reales, deploy/commit/push

---

## Registro — PUBLIC-CATALOG-SCROLL-JANK-POLISH-1 (2026-07-29)

**Fase:** PUBLIC-CATALOG-SCROLL-JANK-POLISH-1 — Public Catalog Mobile Scroll Smoothness & Glass Cost Reduction
**Estado:** PASS WITH DEVICE QA DEBT
**Resumen:** Se redujo el costo visual del catálogo público en mobile: menor uso de blur/backdrop-filter/sombras en superficies sticky/fixed, preservando look premium, ProductCard, carrito, modal customization, preview admin y checkout boundary. Sin DB/RLS/RPC/cache/checkout action/carrito schema/preview logic/CSP/pedidos reales.
- Doc: `docs/public-catalog-scroll-jank-polish-1.md`
- Código: `app/globals.css`, `components/public/catalog/cart-sheet.module.css`, `components/public/catalog/customization-modal.module.css`
- CLI: `tsc` PASS · `build` PASS · lint histórico
- **Próximo:** PUBLIC-CATALOG-SCROLL-JANK-DEPLOY-1 o PUBLIC-CATALOG-CORPUS-OVERFETCH-FIX-1
- **Sin:** DB, RLS, RPC, cache, checkout action, pedidos reales, deploy/commit/push

---

## Registro — PUBLIC-CATALOG-CACHE-INVALIDATION-QA-1 (2026-07-29)

**Fase:** PUBLIC-CATALOG-CACHE-INVALIDATION-QA-1 — Runtime QA for Public Catalog Cache Invalidation
**Estado:** PASS WITH MUTATION QA DEBT
**Resumen:** Se validó la frescura operativa del cache del catálogo público: source audit de tags/updateTag/revalidatePath, coverage de actions admin y smoke productivo en catálogo/checkout/preview. Runtime mutation smoke de invalidación y ordering status: UNVERIFIED (sin auth env). Sin DB/RLS/RPC/checkout action/carrito schema/preview logic/CSP/pedidos reales.
- Doc: `docs/public-catalog-cache-invalidation-qa-1.md`
- Código: `<sin cambios>`
- CLI: `tsc` PASS · `build` PASS · lint histórico
- **Próximo:** PUBLIC-CATALOG-SCROLL-JANK-POLISH-1 o PUBLIC-CATALOG-CORPUS-OVERFETCH-FIX-1
- **Sin:** DB, RLS, RPC, checkout action, pedidos reales, deploy/commit/push si QA-only

---

## Registro — PUBLIC-CATALOG-CACHE-DEPLOY-1 (2026-07-29)

**Fase:** PUBLIC-CATALOG-CACHE-DEPLOY-1 — Controlled Deploy for Public Catalog Cache Strategy
**Estado:** DEPLOYED WITH NON-BLOCKING QA DEBT
**Resumen:** Se desplegó la estrategia de cache segura del catálogo público: datos estables cacheados con TTL 60s + tags, aceptación de pedidos separada y fresca con `noStore`, e invalidación centralizada desde actions admin. Producción smokeada en catálogo, checkout boundary y preview admin según disponibilidad. Sin DB/RLS/RPC/checkout action/carrito schema/preview logic/CSP/pedidos reales.
- Doc: `docs/public-catalog-cache-deploy-1.md`
- Commit funcional: `81ae607`
- Deploy: `https://orderops.vercel.app`
- CLI: `tsc` PASS · `build` PASS · lint histórico
- **Próximo:** PUBLIC-CATALOG-SCROLL-JANK-POLISH-1 o PUBLIC-CATALOG-CACHE-INVALIDATION-QA-1
- **Sin:** DB, RLS, RPC, checkout action, pedidos reales

---

## Registro — PUBLIC-CATALOG-CACHE-STRATEGY-1 (2026-07-29)

**Fase:** PUBLIC-CATALOG-CACHE-STRATEGY-1 — Public Catalog Data Cache Strategy & Safe Invalidation
**Estado:** PASS WITH RESIDUAL CACHE DEBT
**Resumen:** Se implementó una estrategia de cache segura para el catálogo público: datos estables del catálogo cacheados con tags/TTL corto, estado de aceptación de pedidos separado y fresco, e invalidación centralizada desde actions admin que cambian productos/categorías/settings/customizations. Sin DB/RLS/RPC/checkout action/carrito schema/preview admin logic.
- Doc: `docs/public-catalog-cache-strategy-1.md`
- Código: `lib/catalog/public-cache-tags.ts`, `public-cached-data.ts`, `public-page-data.ts`, `public.ts`, `lib/business/public.ts`, `lib/store-sessions/public.server.ts`, `lib/product-customization/public.ts`, `app/b/[slug]/catalogo/page.tsx`, `public-catalog-page.tsx`, admin products/categories/settings/operations/customizations actions
- CLI: `tsc` PASS · `build` PASS · lint histórico
- **Próximo:** PUBLIC-CATALOG-CACHE-DEPLOY-1 o PUBLIC-CATALOG-SCROLL-JANK-POLISH-1
- **Sin:** DB, RLS, RPC, checkout action, pedidos reales, deploy, commit/push

---

## Registro — PUBLIC-CATALOG-PERFORMANCE-DEPLOY-1 (2026-07-28)

**Fase:** PUBLIC-CATALOG-PERFORMANCE-DEPLOY-1 — Controlled Deploy for Public Catalog Performance Package
**Estado:** DEPLOYED WITH NON-BLOCKING QA DEBT
**Resumen:** Se desplegó el paquete de performance del catálogo público: `next/image` + helper público, fallback transforms seguro, dedupe de settings/flags/products, summaries sin re-fetch de productos en page path y ProductCard/CatalogClient optimizados para menor re-render por carrito. Producción smokeada en `/b/demohamburgueseria/catalogo` y checkout boundary sin enviar pedido. Sin DB/RLS/RPC/cache/revalidation/checkout action/carrito schema/preview admin logic.
- Doc: `docs/public-catalog-performance-deploy-1.md`
- Commit: `2b60bb3`
- Deploy: `https://orderops.vercel.app`
- CLI: `tsc` PASS · `build` PASS · lint histórico
- **Próximo:** PUBLIC-CATALOG-CACHE-STRATEGY-1
- **Sin:** DB, RLS, RPC, cache persistente, checkout action, pedidos reales

---

## Registro — PUBLIC-CATALOG-PERFORMANCE-FIX-1 (2026-07-28)

**Fase:** PUBLIC-CATALOG-PERFORMANCE-FIX-1 — Public Catalog Server Calls & Render Cost Reduction
**Estado:** PASS WITH RESIDUAL PERFORMANCE DEBT
**Resumen:** Se redujo el costo server/render del catálogo público sin cache persistente: dedupe de settings/flags/products donde fue seguro, summaries de customization usando datos ya cargados, menor waterfall y ProductCard/CatalogClient ajustados para reducir re-renders por carrito. Sin DB/RLS/RPC/cache/revalidation/checkout/carrito schema/preview admin.
- Doc: `docs/public-catalog-performance-fix-1.md`
- Código: `lib/catalog/public-page-data.ts`, `lib/business/public.ts`, `lib/store-sessions/public.server.ts`, `lib/product-customization/{flags,public}.ts`, `components/public/catalog/{public-catalog-page,catalog-client,product-card}.tsx`
- CLI: `tsc` PASS · `build` PASS · lint histórico
- **Próximo:** PUBLIC-CATALOG-CACHE-STRATEGY-1 o PUBLIC-CATALOG-SCROLL-JANK-POLISH-1
- **Sin:** DB, RLS, RPC, cache persistente, checkout, pedidos, deploy, commit/push

---

## Registro — PUBLIC-CATALOG-IMAGE-TRANSFORMS-QA-FIX-1 (2026-07-28)

**Fase:** PUBLIC-CATALOG-IMAGE-TRANSFORMS-QA-FIX-1 — Supabase Image Transformations QA/Fix for Public Catalog
**Estado:** PASS WITH INFRA IMAGE DEBT
**Resumen:** Se auditó/corrigió el path de Supabase Image Transformations usado por `next/image` en el catálogo público. Object URLs 200; render/image 403 FeatureNotEnabled (tenant). Loader URL correcto; fix menor: reset de fallback en `PublicStorageImage` al cambiar `src`. Fallback seguro; camino principal sigue siendo transform. Sin DB/RLS/RPC/cache/checkout/carrito/preview admin.

- Doc: `docs/public-catalog-image-transforms-qa-fix-1.md`
- Código: `components/public/catalog/public-storage-image.tsx`
- CLI: `tsc` PASS · `build` PASS · lint histórico
- **Próximo:** PUBLIC-CATALOG-PERFORMANCE-FIX-1
- **Sin:** DB, RLS, RPC, cache, checkout, pedidos, deploy, commit/push

---

## Registro — PUBLIC-CATALOG-IMAGE-OPTIMIZATION-1 (2026-07-28)

**Fase:** PUBLIC-CATALOG-IMAGE-OPTIMIZATION-1 — Public Catalog Image Loading & Rendering Optimization
**Estado:** PASS WITH MINOR IMAGE DEBT
**Resumen:** Se migraron imágenes públicas críticas del catálogo de `<img>` raw a `next/image` usando la infraestructura existente de Supabase loader. Product thumbs lazy/sized, cover priority/sized, logo sized y modal detail optimizado. Sin cambios de DB/RLS/RPC/cache/checkout/carrito/preview admin. Objetivo: reducir bytes, decode y jank percibido. Deuda: transforms fallback full-res, landing `<img>`, smoke checkout/preview UNVERIFIED.

- Doc: `docs/public-catalog-image-optimization-1.md`
- Código: `public-storage-image.tsx`, `product-card.tsx`, `product-detail-modal.tsx`, `catalog-client.tsx`, `public-business-header.tsx`, `globals.css` (wrappers)
- CLI: `tsc` PASS · `build` PASS · lint histórico
- **Próximo:** PUBLIC-CATALOG-PERFORMANCE-FIX-1
- **Sin:** DB, RLS, RPC, cache, checkout, pedidos, deploy, commit/push

---

## Registro — ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-HANDOFF-1 (2026-07-28)

**Fase:** ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-HANDOFF-1 — Final Handoff for Admin Catalog Preview Mobile Feel
**Estado:** FEATURE CLOSED — DEPLOYED WITH ACCEPTED DEVICE QA DEBT
**Resumen:** Se cerró formalmente la Vista previa del catálogo con mobile-feel y shell premium. Producción live en /admin/products/preview: iframe real, carrito preview aislado, checkout bloqueado UI+server, cookie 300s, clear-cart postMessage+ACK/fallback, cursor/momentum/anti-selection solo preview/mouse, layout final con paridad Products, CSP self. Sin DB/RLS/RPC/pedidos. Deuda aceptada: Android/PWA/iOS device QA P2 + polish P3.

- Doc: `docs/admin-catalog-preview-mobile-feel-final-handoff-1.md`
- Commits: `c4b3e18` · `5843fd9` · `0dce5b3` · HEAD docs `4dd5dce`
- CLI: `tsc` PASS
- **Próximo opcional:** FINAL-QA-DEVICE-2 si se exige hardware real; si no, feature cerrada.
- **Sin:** código, CSS, deploy, commit, push, DB, pedidos

---

## Registro — ADMIN-CATALOG-PREVIEW-FINAL-QA-DEVICE-1 (2026-07-28)

**Fase:** ADMIN-CATALOG-PREVIEW-FINAL-QA-DEVICE-1 — Real Device Final QA for Admin Catalog Preview
**Estado:** READY WITH DEVICE QA DEBT
**Resumen:** QA-only prod. Desktop: preview layout, clear-cart → 0, checkout “Confirmación deshabilitada”, público “Enviar pedido”, CSP `frame-ancestors 'self'`, Products/Customizations/Settings PASS, sin pedidos. Android Chrome / PWA / iOS **UNVERIFIED — device unavailable** (P2 cobertura). Código pan/cursor sigue mouse-only. Sin código/deploy/commit.

- Doc: `docs/admin-catalog-preview-final-qa-device-1.md`
- HEAD: `4dd5dce` · Layout live `0dce5b3` · Mobile-feel `5843fd9`
- CLI: `tsc` PASS · build/lint no ejecutados
- **Próximo:** ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-HANDOFF-1 (o DEVICE-2 si se exige Android real)
- **Sin:** código, CSS, deploy, commit, push, DB, pedidos

---

## Registro — ADMIN-CATALOG-PREVIEW-LAYOUT-FINAL-DEPLOY-1 (2026-07-28)

**Fase:** ADMIN-CATALOG-PREVIEW-LAYOUT-FINAL-DEPLOY-1 — Controlled Deploy for Final Preview Layout Polish
**Estado:** DEPLOYED WITH NON-BLOCKING QA DEBT
**Resumen:** Commit `0dce5b3` en `main` (LAYOUT-FIX-2 + WIDTH-PARITY). Live en https://orderops.vercel.app. Paridad Products (container 1600 / header left 104 / shell max-width none). Smoke: layout, clear-cart, checkout guard, público, customizations/settings PASS. P3 residual (device touch, clipboard, press, momentum automation, lint).

- Doc: `docs/admin-catalog-preview-layout-final-deploy-1.md`
- Commit: `0dce5b3` · Push: `origin/main` · Deploy: live
- CLI: `tsc` PASS · `build` PASS · lint FAIL preexistente
- **Próximo:** ADMIN-CATALOG-PREVIEW-FINAL-QA-DEVICE-1
- **Sin:** migraciones, Supabase, pedidos, re-deploy mobile-feel

---

## Registro — ADMIN-CATALOG-PREVIEW-SHELL-WIDTH-PARITY-FIX-1 (2026-07-28)

**Fase:** ADMIN-CATALOG-PREVIEW-SHELL-WIDTH-PARITY-FIX-1 — Products Page Width Parity
**Estado:** PASS
**Resumen:** Se quitó `max-width: 1360px` del shell de preview para llenar el ancho operational (`page-container` 1600px, igual que `/admin/products`). Header left 104 / shell width 1289 @1440 = paridad Products. Rail izquierdo 560px y phone centrado intactos. Solo CSS.

- Doc: `docs/admin-catalog-preview-shell-width-parity-fix-1.md`
- Código: `catalog-preview-shell.module.css`
- CLI: `tsc` PASS · `build` PASS · lint FAIL preexistente
- **Próximo:** ADMIN-CATALOG-PREVIEW-FINAL-QA-DEVICE-1 (tras commit/push autorizado)
- **Sin:** commit, push, deploy, DB, cookie, CSP, guard, mobile-feel logic

---

## Registro — ADMIN-CATALOG-PREVIEW-SHELL-LAYOUT-QA-FIX-2 (2026-07-28)

**Fase:** ADMIN-CATALOG-PREVIEW-SHELL-LAYOUT-QA-FIX-2 — Header Alignment & Left Column Width Polish
**Estado:** PASS
**Resumen:** Header movido dentro de la columna izquierda del grid (phone top Δ=0 vs header). Rail izquierdo `max-width: 560px` con eje compartido header/safety/acciones/checklist. Phone sigue centrado en mitad derecha; sticky ≥1024; mobile una columna. Layout-only; sin commit/push/deploy.

- Doc: `docs/admin-catalog-preview-shell-layout-qa-fix-2.md`
- Código: `catalog-preview-shell.*`, `app/admin/(protected)/products/preview/page.tsx`
- CLI: `tsc` PASS · `build` PASS · lint FAIL preexistente
- **Próximo:** ADMIN-CATALOG-PREVIEW-FINAL-QA-DEVICE-1 (tras commit/push autorizado)
- **Sin:** commit, push, deploy, DB, cookie, CSP, guard, mobile-feel logic

---

## Registro — ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-DEPLOY-1 (2026-07-28)

**Fase:** ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-DEPLOY-1 — Controlled Deploy for Mobile Feel + Shell Polish
**Estado:** DEPLOYED WITH NON-BLOCKING QA DEBT
**Resumen:** Commit `5843fd9` pusheado a `main` y live en https://orderops.vercel.app. Paquete touch-pan + mobile-feel + shell polish + layout. Smoke prod: preview, layout, clear-cart, checkout guard, público, CSP, customizations/settings PASS. P3 residual (device touch, clipboard automation, press feedback, momentum synthetic flake, lint histórico).

- Doc: `docs/admin-catalog-preview-mobile-feel-deploy-1.md`
- Commit: `5843fd9` · Push: `origin/main` · Deploy: live
- CLI pre-commit: `tsc` PASS · `build` PASS · lint FAIL preexistente
- **Próximo:** ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-HANDOFF-1
- **Sin:** migraciones, Supabase, pedidos reales, cambios funcionales post-commit

---

## Registro — ADMIN-CATALOG-PREVIEW-SHELL-LAYOUT-QA-FIX-1 (2026-07-28)

**Fase:** ADMIN-CATALOG-PREVIEW-SHELL-LAYOUT-QA-FIX-1 — Two-Column Centering & Phone Frame Alignment
**Estado:** PASS
**Resumen:** Layout desktop en dos mitades (`1fr`/`1fr`); teléfono centrado en mitad derecha (sin `justify-self: end`); frame envuelve viewport con padding simétrico 16/16 y ancho 422; sticky ≥1024; mobile una columna sin overflowX. Solo CSS/markup shell.

- Doc: `docs/admin-catalog-preview-shell-layout-qa-fix-1.md`
- Código: `catalog-preview-shell.tsx`, `catalog-preview-shell.module.css`
- CLI: `tsc` PASS · `build` PASS · lint FAIL preexistente
- **Próximo:** ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-DEPLOY-1
- **Sin:** commit, push, deploy, DB, cookie, CSP, guard, carrito público, mobile-feel logic

---

## Registro — ADMIN-CATALOG-PREVIEW-SHELL-PREMIUM-POLISH-1 (2026-07-28)

**Fase:** ADMIN-CATALOG-PREVIEW-SHELL-PREMIUM-POLISH-1 — Preview Shell UX Polish Before Deploy
**Estado:** PASS WITH NON-BLOCKING UX DEBT
**Resumen:** Shell premium sin panel izquierdo: acciones jerarquizadas, checklist, Modo seguro, phone sticky, toasts admin, clear-cart via postMessage+ACK+remount. Vaciar refleja 0 en iframe. Clipboard success toast automation = deuda P3.

- Doc: `docs/admin-catalog-preview-shell-premium-polish-1.md`
- Código: `catalog-preview-shell.*`, `catalog-client.tsx`, `catalog-preview-shared.ts`
- CLI: `tsc` PASS · `build` PASS · lint FAIL preexistente
- **Próximo:** ADMIN-CATALOG-PREVIEW-SHELL-LAYOUT-QA-FIX-1 → luego MOBILE-FEEL-DEPLOY-1
- **Sin:** commit, push, deploy, pedidos, panel izquierdo, estado carrito shell

---

## Registro — ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-AUTH-QA-1 (2026-07-28)

**Fase:** ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-AUTH-QA-1 — Authenticated Iframe QA for Mobile Feel
**Estado:** READY WITH NON-BLOCKING QA DEBT
**Resumen:** QA autenticado en `/admin/products/preview`: cursor + momentum + anti-selection + storage aislado + checkout bloqueado PASS dentro del iframe. Público normal intacto. Sin código. Próximo: MOBILE-FEEL-DEPLOY-1 (pausado por shell polish).

- Doc: `docs/admin-catalog-preview-mobile-feel-auth-qa-1.md`
- CLI: `tsc` PASS · `build` PASS · lint FAIL preexistente
- **Próximo:** ADMIN-CATALOG-PREVIEW-SHELL-PREMIUM-POLISH-1 → luego DEPLOY
- **Sin:** código, commit, push, deploy, pedidos

---

## Registro — ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-POLISH-1 (2026-07-28)

**Fase:** ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-POLISH-1 — Mobile Feel Implementation
**Estado:** PASS WITH AUTH QA DEBT
**Resumen:** Cursor circular + momentum vertical RAF + scrollbar sutil solo en preview/mouse. Press feedback diferido. Public preview PASS; admin iframe UNVERIFIED. Sin tocar carrito/cookie/guard/CSP/DB.

- Doc: `docs/admin-catalog-preview-mobile-feel-polish-1.md`
- Código: `use-preview-pointer-pan-scroll.ts`, `use-preview-touch-cursor.ts`, `catalog-preview-mobile-feel.module.css`, `catalog-client.tsx`
- CLI: `tsc` PASS · `build` PASS · lint FAIL preexistente
- **Próximo:** ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-AUTH-QA-1
- **Sin:** commit, push, deploy, pedidos

---

## Registro — ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-SPEC-1 (2026-07-28)

**Fase:** ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-SPEC-1 — Mobile Feel UX Specification
**Estado:** SPEC READY FOR IMPLEMENTATION
**Resumen:** Se definió el polish mobile-feel para la preview: cursor circular tipo touch, momentum/inertia vertical, feedback táctil sutil y scrollbars menos protagonistas, siempre solo en preview desktop/mouse. Sin código funcional. Próximo: MOBILE-FEEL-POLISH-1.

- Doc: `docs/admin-catalog-preview-mobile-feel-spec-1.md`
- **Próximo:** ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-POLISH-1
- **Sin:** código, commit, push, deploy, pedidos

---

## Registro — ADMIN-CATALOG-PREVIEW-TOUCH-PAN-QA-FIX-1 (2026-07-28)

**Fase:** ADMIN-CATALOG-PREVIEW-TOUCH-PAN-QA-FIX-1 — Prevent Text Selection During Preview Pan
**Estado:** PASS WITH PUBLIC QA ONLY
**Resumen:** Anti-selección en mouse-pan preview: fase `candidate` inmediata, `user-select: none`, `selectstart`/`dragstart` prevent, cleanup de selection. Cards `role="button"` ya no bloquean pan sobre texto/imagen. Público preview PASS; admin iframe UNVERIFIED. Deploy sigue bloqueado hasta auth smoke.

- Doc: `docs/admin-catalog-preview-touch-pan-qa-fix-1.md`
- Código: `use-preview-pointer-pan-scroll.ts`, `catalog-preview-pan.module.css`
- CLI: `tsc` PASS · `build` PASS · lint FAIL preexistente (si corre)
- **Próximo (tras auth iframe):** ADMIN-CATALOG-PREVIEW-TOUCH-PAN-DEPLOY-1
- **Sin:** commit, push, deploy, pedidos, carrito/cookie/guard/CSP/DB

---

## Registro — ADMIN-CATALOG-PREVIEW-TOUCH-PAN-POLISH-1 (2026-07-27)

**Fase:** ADMIN-CATALOG-PREVIEW-TOUCH-PAN-POLISH-1 — Mouse Drag Touch-Scroll Polish
**Estado:** PASS WITH AUTH QA DEBT
**Resumen:** Mouse drag vertical scrollea el catálogo solo en preview (`isCatalogPreview` + pointer mouse). Hook aislado, threshold 8px, ignore interactivos/overlays. Público/touch/cookie/guard/CSP intactos. Admin iframe UNVERIFIED.

- Doc: `docs/admin-catalog-preview-touch-pan-polish-1.md`
- Código: `use-preview-pointer-pan-scroll.ts`, `catalog-preview-pan.module.css`, `catalog-client.tsx` + ignore attrs
- CLI: `tsc` PASS · `build` PASS · lint FAIL preexistente
- **Próximo:** ADMIN-CATALOG-PREVIEW-TOUCH-PAN-QA-FIX-1 (bloqueó deploy por selección de texto)
- **Sin:** commit, push, deploy, pedidos

---

## Registro — ADMIN-CATALOG-PREVIEW-HANDOFF-1 (2026-07-27)

**Fase:** ADMIN-CATALOG-PREVIEW-HANDOFF-1 — Final Technical & Product Handoff
**Estado:** FEATURE CLOSED — DEPLOYED WITH NON-BLOCKING QA DEBT
**Resumen:** Se consolidó el cierre técnico/producto de Vista previa del catálogo desplegada en producción. Feature en `/admin/products/preview` con iframe real, carrito preview aislado, checkout bloqueado UI+server, cookie 300s, clear al vaciar y CSP self. Sin DB/RLS/RPC/pedidos. Quedan deudas P2/P3 no bloqueantes.

- Doc: `docs/admin-catalog-preview-handoff-1.md`
- Commits: feature `c4b3e18` · docs deploy `84c0c48`
- **Próximo opcional:** TOUCH-PAN-POLISH-1 o AUTH-SMOKE-1
- **Sin:** código, deploy, rollback, pedidos

---

## Registro — ADMIN-CATALOG-PREVIEW-DEPLOY-1 (2026-07-27)

**Fase:** ADMIN-CATALOG-PREVIEW-DEPLOY-1 — Controlled Deploy & Production Smoke
**Estado:** DEPLOYED WITH NON-BLOCKING QA DEBT
**Resumen:** Commit `c4b3e18` pushed a `main`; producción live en https://orderops.vercel.app con CSP `frame-ancestors 'self'`. Smoke público: carrito preview aislado + checkout bloqueado; público normal “Enviar pedido”. Admin auth / cookie DevTools UNVERIFIED. Sin pedidos / DB / RLS / RPC.

- Doc: `docs/admin-catalog-preview-deploy-1.md`
- **Próximo:** ADMIN-CATALOG-PREVIEW-HANDOFF-1
- **Sin:** migraciones, pedidos reales, rollback

---

## Registro — ADMIN-CATALOG-PREVIEW-RE-QA-1 (2026-07-27)

**Fase:** ADMIN-CATALOG-PREVIEW-RE-QA-1 — Authenticated Re-QA After Cookie Polish
**Estado:** READY WITH NON-BLOCKING QA DEBT
**Resumen:** Source confirma Max-Age 300 + clear cookie + vaciar wiring. Runtime `:3012`: carrito aislado, checkout preview bloqueado, público normal con “Enviar pedido”, CSP OK. Admin auth / cookie DevTools / clear al vaciar UNVERIFIED sin E2E. Sin P0/P1 nuevos.

- Doc: `docs/admin-catalog-preview-re-qa-1.md`
- CLI: `tsc` PASS · `build` PASS · lint FAIL preexistente
- **Próximo:** ADMIN-CATALOG-PREVIEW-DEPLOY-1
- **Sin:** código, commit, push, deploy, pedidos

---

## Registro — ADMIN-CATALOG-PREVIEW-COOKIE-POLISH-1 (2026-07-27)

**Fase:** ADMIN-CATALOG-PREVIEW-COOKIE-POLISH-1 — Preview Cookie Lifetime & Cleanup Polish
**Estado:** PASS WITH AUTH QA DEBT
**Resumen:** Cookie `orderops-admin-catalog-preview` pasa de Max-Age 3600 → **300**. “Vaciar carrito de prueba” limpia keys preview y expira cookie vía Server Action (`manageProducts` + tenant match). Checkout guard UI+server intacto. Sin DB/RLS/RPC ni botón nuevo.

- Doc: `docs/admin-catalog-preview-cookie-polish-1.md`
- Código: `catalog-preview-shared.ts`, `catalog-preview.ts`, `preview/actions.ts`, `catalog-preview-shell.tsx`
- **Próximo:** ADMIN-CATALOG-PREVIEW-RE-QA-1
- **Sin:** commit, push, deploy, pedidos

---

## Registro — ADMIN-CATALOG-PREVIEW-QA-1 (2026-07-27)

**Fase:** ADMIN-CATALOG-PREVIEW-QA-1 — Authenticated Browser QA & Release Readiness
**Estado:** READY AFTER COOKIE POLISH
**Resumen:** Source/headers PASS. Path público `?orderopsPreview=1` confirma carrito aislado (preview cambia, public no) y checkout con submit deshabilitado + mensaje de bloqueo; sin pedidos/success. Admin autenticado UNVERIFIED (sin sesión E2E). Cookie preview 1h clasificada **P1** (afecta admin same-browser, no customers anónimos).

- Doc: `docs/admin-catalog-preview-qa-1.md`
- CLI: `tsc` PASS · `build` PASS · lint FAIL preexistente
- **Próximo:** ADMIN-CATALOG-PREVIEW-COOKIE-POLISH-1
- **Sin:** código, commit, push, deploy, pedidos

---

## Registro — ADMIN-CATALOG-PREVIEW-IMPL-SAFE-V1-1 (2026-07-27)

**Fase:** ADMIN-CATALOG-PREVIEW-IMPL-SAFE-V1-1 — Implementación segura V1
**Estado:** PASS WITH DEBT
**Resumen:** Se implementó `/admin/products/preview` (`manageProducts`) con iframe del catálogo real, cookie httpOnly de preview, carrito aislado `orderops-preview-cart*`, checkout visual con bloqueo UI+server (sin `create_order`), CTA dual en Productos y CSP `frame-ancestors 'self'`. Sin DB/RLS/RPC/sidebar/recargar/pedidos.

- Doc: `docs/admin-catalog-preview-impl-safe-v1-1.md`
- CLI: `tsc` PASS · `build` PASS · lint FAIL preexistente
- Headers local: CSP `frame-ancestors 'self'` OK
- **Deuda:** browser QA autenticado + cookie 1h bloquea pedidos reales en mismo browser/path
- **Próximo:** ADMIN-CATALOG-PREVIEW-QA-1
- **Sin:** commit, push, deploy

---

## Registro — ADMIN-CATALOG-PREVIEW-SPEC-CLOSURE-1 (2026-07-27)

**Fase:** ADMIN-CATALOG-PREVIEW-SPEC-CLOSURE-1 — Product & Technical Spec Closure
**Estado:** PRODUCT SPEC DECISIONS CLOSED · READY FOR IMPLEMENTATION
**Resumen:** Se congelaron las decisiones P0/P1 del Product Owner para la Vista previa del catálogo en `/admin/products/preview`: iframe same-origin, carrito aislado (`orderops-preview-cart*`), checkout visual sin confirmación (UI+server), sin success, `manageProducts`, CTA dual (preview + copiar link), CSP `frame-ancestors 'self'`, sin recargar/sidebar/device selector. Preview mode debe ser verificable server-side (no solo query).

- Doc: `docs/admin-catalog-preview-spec-closure-1.md`
- Audit base: `docs/admin-catalog-preview-audit-1-forensic-architecture.md`
- **Próximo paso:** implementación (IMPL foundation / cart / checkout-guard) — **no iniciada**
- **Sin:** código, commit, push, deploy, pedidos

---

## Registro — ADMIN-CATALOG-PREVIEW-AUDIT-1 (2026-07-26)

**Fase:** ADMIN-CATALOG-PREVIEW-AUDIT-1 — Forensic Architecture & Product Audit
**Estado:** READY WITH TECHNICAL CONDITIONS
**Resumen:** Auditoría forense (solo docs) de la futura vista previa móvil del catálogo público en admin vía iframe same-origin. Confirmado: ruta `/b/[slug]/catalogo`, auth por layout, carrito `localStorage` por `businessId` compartido same-origin, checkout → `create_order` real sin `preview_mode`, sin XFO/CSP framing en repo ni prod. Iframe **VIABLE WITH CONDITIONS**.

- Doc: `docs/admin-catalog-preview-audit-1-forensic-architecture.md`
- Hallazgos: P0 pedidos/carrito/tenant/CTA/framing · P1 PWA/naming/responsive · P2 a11y/perf
- Recomendación preliminar: híbrido (E) o iframe+guards (B); no iframe naive (A)
- CLI baseline: `tsc` PASS · `build` PASS · lint FAIL preexistente (ESLint config)
- **Próximo paso:** ADMIN-CATALOG-PREVIEW-SPEC-CLOSURE-1 (decisiones P0 del PO)
- **Sin:** código, commit, push, deploy, pedidos

---

## Registro — ADMIN-PWA-ICON-CONSISTENCY-1 (2026-07-24)

**Fase:** ADMIN-PWA-ICON-CONSISTENCY-1 — Admin PWA icon real branding alignment
**Estado:** PASS WITH ICON SOURCE RESOLUTION AND DEVICE QA DEBT
**Resultado:** Los iconos PWA admin se regeneraron desde `public/icon.png` (misma marca que la pestaña /icon.png), eliminando el fallback SVG con texto **Ops**. Nombre **OrderOps** y start_url/scope/id /admin sin cambio. Sin SW/offline ni cambios auth/admin/catálogo.

- Doc: `docs/admin-pwa-icon-consistency-1-real-branding.md`
- Fuente: `public/icon.png` 192×192 (Caso B — upscale a 512)
- **Usuario:** desinstalar PWA admin anterior y reinstalar para ver icono en launcher
- CLI: `tsc` PASS → `build` PASS
- **Deuda:** resolución master ≥512 px + DEVICE QA manual

---

## Registro — ADMIN-PWA-BRANDING-POLISH-1 (2026-07-24)

**Fase:** ADMIN-PWA-BRANDING-POLISH-1 â€” Admin PWA app name & icon polish
**Estado:** PASS WITH BRAND ASSET AND DEVICE QA DEBT
**Resultado:** Se unificÃ³ el nombre instalado a **OrderOps** y se reemplazÃ³ el icono tipo "O" aislada por una marca compuesta (checklist + anillos + **Ops**) en iconos admin PWA. `start_url`/`scope`/`id` permanecen en `/admin`. Sin SW/offline ni cambios auth/admin/catÃ¡logo.

- Doc: `docs/admin-pwa-branding-polish-1-app-name-icon.md`
- Asset: `public/icon.png` existe pero es marca parcial; se usÃ³ fallback SVG compuesto en script
- **Usuario:** desinstalar PWA admin anterior y reinstalar para ver nombre/icono en launcher
- CLI: `tsc` PASS â†’ `build` PASS
- **Deuda:** DEVICE QA manual + asset corporativo master opcional

---
## Registro â€” ADMIN-PWA-FOUNDATION-1 (2026-07-24)

**Fase:** ADMIN-PWA-FOUNDATION-1 â€” Installable Standalone PWA (/admin only)
**Estado:** PASS WITH DEVICE QA DEBT
**Resultado:** Se aÃ±adiÃ³ manifest web app, metadata/viewport e iconos de marca para instalar OrderOps Admin como standalone en `/admin`, sin service worker, sin offline cache y sin PWA pÃºblica en catÃ¡logo.

- Doc: `docs/admin-pwa-foundation-1-installable-standalone.md`
- Auth/scope: login en `/admin/login`; `start_url`/`scope`/`id` = `/admin`; middleware solo `updateSession`
- CLI: `tsc` PASS Â· `build` PASS
- Smoke: manifest JSON + iconos 200 Â· `/admin` Â· catÃ¡logo pÃºblico sin manifest tenant
- **Deuda:** instalaciÃ³n real en dispositivo no verificada por agente (DEVICE QA)
- **Fuera de scope:** SW, offline, cambios auth, PWA pÃºblica `/b/[slug]`

---
# OrderOps: Estado de Desarrollo y Fase Actual (6 de Junio)

## Registro â€” PRODUCT-CUSTOMIZATION-ADMIN-V1-FINAL-HANDOFF-1 (2026-07-23)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-V1-FINAL-HANDOFF-1 â€” Product Customization Admin V1 Final Technical & Product Handoff
**Estado:** PASS
**Resultado:** Product Customization Admin V1 quedÃ³ formalmente cerrado y documentado como premium-ready para piloto. El mÃ³dulo conserva Enterprise Readiness 4.3/5, P0=0 y P1=0. El handoff consolida arquitectura, datos, permisos, actions, flujos admin/pÃºblico, pricing, cart, checkout, snapshots, stock, QA, invariantes, rollback y deuda residual aceptada.

- Doc: `docs/product-customization-admin-v1-final-handoff-1.md`
- Deploy: commit `6731a16` â†’ `origin/main` â†’ https://orderops.vercel.app
- CLI: `tsc` PASS Â· `build` PASS Â· **docs-only**
- Smoke: admin 4 tabs + a11y menÃºs Â· pÃºblico Doble Smash parent+ADICIONAL (sin pedido)
- **PrÃ³xima obligatoria:** ninguna
- **Opcionales:** DND-TOUCH-POLISH-1 Â· PILOT-MONITOR-3

---

## Registro â€” PRODUCT-CUSTOMIZATION-ADMIN-A11Y-POLISH-1 (2026-07-23)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-A11Y-POLISH-1 â€” Accessible Menus, Focus & Keyboard Polish
**Estado:** PASS WITH DND TOUCH DEBT
**Resultado:** Se corrigiÃ³ la accesibilidad de los menÃºs y dialogs del admin de Product Customization. Los menuitems cerrados ya no permanecen en el accessibility tree, los triggers exponen estado y contexto, Escape/click fuera cierran correctamente y el foco vuelve al control de origen, sin modificar lÃ³gica operativa.

- Doc: `docs/product-customization-admin-a11y-polish-1-menus-focus-keyboard.md`
- Deploy: commit `128fac2` â†’ `origin/main` â†’ https://orderops.vercel.app
- CLI: `tsc` PASS Â· `build` PASS
- A11y tree: cerrado `menuitems=0` Â· Escape/click fuera Â· foco al trigger Â· confirm remove accesible
- Deuda: drag handle ~32px â†’ DND-TOUCH-POLISH-1
- **PrÃ³xima:** DND-TOUCH-POLISH-1 (opcional) Â· V1-FINAL-HANDOFF-1

---

## Registro â€” PRODUCT-CUSTOMIZATION-ADMIN-V1-PREMIUM-RESCORE-1 (2026-07-23)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-V1-PREMIUM-RESCORE-1 â€” Enterprise Premium Rescore & Residual Handoff
**Estado:** PASS WITH RESIDUAL POLISH DEBT
**Resultado:** Se re-auditÃ³ el admin de Product Customization V1 despuÃ©s de las fases de polish principales. Los P1 del monitor original quedaron cerrados, el score enterprise mejorÃ³ y solo queda deuda residual P2/P3 para handoff.

- Doc: `docs/product-customization-admin-v1-premium-rescore-1-enterprise-readiness.md`
- Score: **4.3/5** (antes 3.1 Â· Î” +1.2) Â· P0=0 Â· P1=0 Â· P2=5 Â· P3=3
- P1 originales: CLOSED (categorÃ­a ciega Â· Desactivar Â· compact vs dense Â· mobile width Â· excepciones query)
- CLI: `tsc` PASS Â· `build` PASS Â· audit/docs-only (sin runtime)
- Browser QA: 390â€“1440 Â· light/dark Â· 4 tabs Â· preview Â· pÃºblico Doble Smash parent+ADICIONAL
- **PrÃ³xima:** A11Y-POLISH-1 / DND-TOUCH-POLISH-1 (opcionales) Â· V1-FINAL-HANDOFF-1

---

## Registro â€” PRODUCT-CUSTOMIZATION-ADMIN-RESPONSIVE-POLISH-1 (2026-07-23)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-RESPONSIVE-POLISH-1 â€” Responsive Premium Polish
**Estado:** PASS
**Resultado:** Se corrigiÃ³ el responsive del admin de Product Customization, mejorando ancho Ãºtil mobile, tabs, cards, chips, modales, menÃºs y vista previa sin cambiar lÃ³gica operativa.

- Doc: `docs/product-customization-admin-responsive-polish-1-mobile-layout.md`
- Deploy: commit `fa8265e` â†’ `origin/main` â†’ https://orderops.vercel.app
- CLI: `tsc` PASS Â· `build` PASS
- Browser QA: 390/414/768/1024/1440 Â· light/dark Â· 4 tabs Â· modales Â· preview Â· pÃºblico Doble Smash parent+ADICIONAL
- Shell: padding scoped `:has(.admin-page-layout--customizations-mobile)` â‰¤719px
- **PrÃ³xima:** monitor re-score / handoff residual opcional

---

## Registro â€” PRODUCT-CUSTOMIZATION-ADMIN-ASSIGNMENTS-REMOVE-1 (2026-07-23)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-ASSIGNMENTS-REMOVE-1 â€” Safe Assignment Unassign Action & UX
**Estado:** PASS
**Resultado:** Se implementÃ³ una action segura para quitar asignaciones de secciones en Por producto y Por categorÃ­a, con validaciones tenant/permiso, confirmaciÃ³n owner-friendly y QA controlado, sin eliminar secciones/opciones ni modificar lÃ³gica pÃºblica.

- Doc: `docs/product-customization-admin-assignments-remove-1-safe-unassign-action.md`
- Deploy: commit `e8383e0` â†’ `origin/main` â†’ https://orderops.vercel.app
- CLI: `tsc` PASS Â· `build` PASS
- Browser QA: Mozzarella temp assign/unassign Â· Secciones intactas Â· pÃºblico Doble Smash
- **PrÃ³xima:** RESPONSIVE-POLISH-1

---

## Registro â€” PRODUCT-CUSTOMIZATION-ADMIN-ASSIGNMENTS-COMPACT-1 (2026-07-23)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-ASSIGNMENTS-COMPACT-1 â€” Product & Category Assignments Compact UI
**Estado:** PASS WITH REMOVE DEBT
**Resultado:** Se compactÃ³ la UX de asignaciones en Por producto y Por categorÃ­a, reemplazando bloques densos por cards/rows resumidas, modales de agregado y acciones secundarias mÃ¡s claras, sin cambiar lÃ³gica operativa. No existe action segura de quitar asignaciÃ³n (solo Ocultar/Mostrar).

- Doc: `docs/product-customization-admin-assignments-compact-1-product-category-assignments.md`
- Deploy: commit `4f6ebfe` â†’ `origin/main` â†’ https://orderops.vercel.app
- CLI: `tsc` PASS Â· `build` PASS
- Browser QA: Por producto compacto Â· Por categorÃ­a empty/CTA Â· Secciones/Plus Â· preview Â· pÃºblico Doble Smash parent+adicional
- Deuda: sin remove/unassign seguro â†’ fase REMOVE opcional
- **PrÃ³xima:** ASSIGNMENTS-REMOVE-1 (opcional) Â· RESPONSIVE-POLISH-1

---

## Registro â€” PRODUCT-CUSTOMIZATION-ADMIN-EXCEPTIONS-UX-1 (2026-07-23)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-EXCEPTIONS-UX-1 â€” Product Exceptions Guided UX
**Estado:** PASS
**Resultado:** Se mejorÃ³ la UX de Excepciones del producto, presentÃ¡ndolas como ajustes propios guiados para el producto seleccionado, con empty states, resumen y acciones owner-friendly, sin cambiar la lÃ³gica de overrides ni el modelo de datos.

- Doc: `docs/product-customization-admin-exceptions-ux-1-guided-product-exceptions.md`
- Deploy: commit `f4d5260` â†’ `origin/main` â†’ https://orderops.vercel.app
- CLI: `tsc` PASS Â· `build` PASS
- Browser QA: panel por selecciÃ³n Â· hide/restore BBQ Â· preview Â· pÃºblico Doble Smash
- **PrÃ³xima:** ASSIGNMENTS-COMPACT-1 Â· RESPONSIVE-POLISH-1

---

## Registro â€” PRODUCT-CUSTOMIZATION-ADMIN-HIERARCHY-POLISH-1 (2026-07-19)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-HIERARCHY-POLISH-1 â€” Product & Category Hierarchy Premium Polish
**Estado:** PASS WITH HIERARCHY DEBT
**Resultado:** Se mejorÃ³ la jerarquÃ­a visual y comprensiÃ³n de los tabs Por producto y Por categorÃ­a, reforzando headers, agrupaciÃ³n, empty states, presentaciÃ³n de excepciones y consistencia visual con las secciones compactas, sin cambiar lÃ³gica operativa.

- Doc: `docs/product-customization-admin-hierarchy-polish-1-product-category-hierarchy.md`
- Deploy: commit `a16de09` â†’ `origin/main` â†’ https://orderops.vercel.app
- CLI: `tsc` PASS Â· `build` PASS
- Browser QA local admin + pÃºblico Doble Smash PASS
- Deuda: assignments densos Â· excepciones vÃ­a `?product=` Â· responsive estructural â†’ fases posteriores
- **PrÃ³xima:** EXCEPTIONS-UX-1 Â· ASSIGNMENTS-COMPACT-1 Â· RESPONSIVE-POLISH-1

---

## Registro â€” PRODUCT-CUSTOMIZATION-ADMIN-COPY-POLISH-1 (2026-07-19)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-COPY-POLISH-1 â€” Owner-Friendly Premium Copy Polish
**Estado:** PASS
**Resultado:** Se puliÃ³ el copy owner-facing del admin de Product Customization, reemplazando lenguaje tÃ©cnico o ambiguo por tÃ©rminos claros y premium como â€œVista previaâ€, â€œMostrar/Ocultar para clientesâ€, â€œAplicado desdeâ€, â€œExcepciones del productoâ€ y â€œOrden de apariciÃ³nâ€, sin cambiar lÃ³gica operativa.

- Doc: `docs/product-customization-admin-copy-polish-1-owner-friendly-copy.md`
- Deploy: commit `40d4cd1` â†’ `origin/main` â†’ https://orderops.vercel.app
- CLI: `tsc` PASS Â· `build` PASS
- Deuda menor: mensajes de success en actions con â€œHerenciaâ€¦â€ (actions no tocadas por scope)
- **PrÃ³xima:** PRODUCT-CUSTOMIZATION-ADMIN-HIERARCHY-POLISH-1 Â· EXCEPTIONS-UX-1 Â· ASSIGNMENTS-COMPACT-1

---

## Registro â€” PRODUCT-CUSTOMIZATION-ADMIN-V1-POLISH-MONITOR-1 (2026-07-19)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-V1-POLISH-MONITOR-1 â€” Enterprise Premium QA & UX/UI Polish Audit
**Estado:** NEEDS POLISH
**Resultado:** Se auditÃ³ crÃ­ticamente el mÃ³dulo admin de Product Customization V1 con foco enterprise/premium, revisando funcionalidad, copy, jerarquÃ­a, UX/UI, responsive, accesibilidad bÃ¡sica, preview admin y no regresiÃ³n pÃºblica. Se generÃ³ una matriz priorizada de hallazgos y prÃ³ximas fases quirÃºrgicas.

- Doc: `docs/product-customization-admin-v1-polish-monitor-1-premium-qa.md`
- Enterprise Readiness Score: **3.1/5**
- Hallazgos: P0=0 Â· P1=5 Â· P2=8 Â· P3=4 Â· pÃºblico sin regresiÃ³n
- CLI: `tsc` PASS Â· `build` PASS
- Sin cambios runtime / DB / actions / deploy funcional
- **PrÃ³xima:** PRODUCT-CUSTOMIZATION-ADMIN-COPY-POLISH-1 â†’ HIERARCHY / EXCEPTIONS â†’ ASSIGNMENTS-COMPACT â†’ RESPONSIVE

---

## Registro â€” PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-CLEANUP-1 (2026-07-19)

**Fase:** PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-CLEANUP-1 â€” Plus Suggestions Legacy Cleanup
**Estado:** PASS
**Resultado:** Se eliminÃ³ el componente legacy del flujo inline anterior de Plus sugeridos y se limpiaron referencias/CSS obsoletos donde fue seguro hacerlo. La UI compacta sigue funcionando y no se modificÃ³ lÃ³gica operativa.

- Eliminado: `upsell-groups-section.tsx` (0 imports)
- CSS huÃ©rfano: `.plusWorkspace`, `.optionsSection` (compartido assignments/overrides conservado)
- Doc: `docs/product-customization-plus-suggestions-cleanup-1-legacy-cleanup.md`
- Deploy: commit `6b0e153` â†’ `origin/main` â†’ https://orderops.vercel.app
- **PrÃ³xima:** monitor piloto Â· opcional densificar Por producto / Por categorÃ­a

---

## Registro â€” PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-COMPACT-1 (2026-07-18)

**Fase:** PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-COMPACT-1 â€” Compact Plus Suggestions UI
**Estado:** PASS
**Resultado:** La pestaÃ±a Plus sugeridos fue compactada: las ventas sugeridas ahora se muestran como cards resumidas, la ediciÃ³n ocurre en modales y los productos sugeridos se gestionan en un modal dedicado sin tocar la lÃ³gica operativa.

- Components: `plus-suggestions/*` Â· wired en `owner-customization-builder`
- Actions reutilizadas (create/update/toggle group + add/update/toggle item; â†‘â†“ vÃ­a update item)
- Doc: `docs/product-customization-plus-suggestions-compact-1-compact-plus-suggestions-ui.md`
- Deploy: commit `a2a9b26` â†’ `origin/main` â†’ https://orderops.vercel.app
- **PrÃ³xima:** PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-CLEANUP-1 (hecho) Â· monitor piloto

---

## Registro â€” PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-UX-SPEC-1 (2026-07-18)

**Fase:** PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-UX-SPEC-1 â€” Plus Suggestions Compact UX Specification
**Estado:** PASS
**Resultado:** Se definiÃ³ la UX compacta para Plus sugeridos, reemplazando formularios inline extensos por cards resumidas, menÃºs de acciones y modales de ediciÃ³n para ventas sugeridas y productos sugeridos, sin cambiar lÃ³gica operativa.

- Doc: `docs/product-customization-plus-suggestions-ux-spec-1-compact-plus-suggestions.md`
- Principio: lista = lectura; modal = ediciÃ³n / gestionar productos
- Actions existentes reutilizables; sin delete/remove; sin reorder RPC (â†‘â†“ vÃ­a update item)
- PatrÃ³n alineado a Secciones reutilizables compact
- **PrÃ³xima:** PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-COMPACT-1

---

## Registro â€” PRODUCT-CUSTOMIZATION-REUSABLE-SECTIONS-CLEANUP-1 (2026-07-18)

**Fase:** PRODUCT-CUSTOMIZATION-REUSABLE-SECTIONS-CLEANUP-1 â€” Reusable Sections Legacy Cleanup
**Estado:** PASS
**Resultado:** Se eliminaron componentes legacy e imports/CSS obsoletos del flujo inline anterior de Secciones reutilizables. La UI compacta sigue funcionando y no se modificÃ³ lÃ³gica operativa.

- Eliminados: `create-group-form.tsx`, `customization-group-card.tsx`, `sortable-groups-list.tsx`
- CSS huÃ©rfano sections-only removido del module admin (compartido Plus/assignments conservado)
- Doc: `docs/product-customization-reusable-sections-cleanup-1-legacy-cleanup.md`
- Deploy: commit `5819460` â†’ `origin/main` â†’ https://orderops.vercel.app
- **PrÃ³xima:** PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-COMPACT-1 (tras UX-SPEC)

---

## Registro â€” PRODUCT-CUSTOMIZATION-REUSABLE-SECTIONS-COMPACT-1 (2026-07-18)

**Fase:** PRODUCT-CUSTOMIZATION-REUSABLE-SECTIONS-COMPACT-1 â€” Compact Reusable Sections UI
**Estado:** PASS
**Resultado:** La pestaÃ±a Secciones reutilizables fue compactada: las secciones ahora se muestran como cards resumidas, la ediciÃ³n ocurre en modales, las opciones se gestionan en un modal dedicado y se eliminaron los formularios inline extensos sin tocar la lÃ³gica operativa.

- Components: `reusable-sections/*` Â· wired en `owner-customization-builder`
- Actions reutilizadas (create/update/toggle/reorder)
- Doc: `docs/product-customization-reusable-sections-compact-1-compact-reusable-sections-ui.md`
- Deploy: commit `a124459` â†’ `origin/main` â†’ https://orderops.vercel.app
- **PrÃ³xima:** cleanup legacy forms Â· opcional compact Plus tab

---

## Registro â€” PRODUCT-CUSTOMIZATION-REUSABLE-SECTIONS-UX-SPEC-1 (2026-07-18)

**Fase:** PRODUCT-CUSTOMIZATION-REUSABLE-SECTIONS-UX-SPEC-1 â€” Reusable Sections Compact UX Specification
**Estado:** PASS
**Resultado:** Se definiÃ³ la UX compacta para Secciones reutilizables, reemplazando formularios inline extensos por cards resumidas, menÃºs de acciones y modales de ediciÃ³n para secciones y opciones, sin cambiar lÃ³gica operativa.

- Doc: `docs/product-customization-reusable-sections-ux-spec-1-compact-reusable-sections.md`
- Principio: lista = lectura/orden; modal = ediciÃ³n
- Actions existentes reutilizables; sin delete/duplicate en V1
- **PrÃ³xima:** PRODUCT-CUSTOMIZATION-REUSABLE-SECTIONS-COMPACT-1

---

## Registro â€” PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-OVERRIDES-1 (2026-07-18)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-OVERRIDES-1 â€” Admin Preview Product Overrides Fidelity
**Estado:** PASS WITH DATA QA DEBT
**Resultado:** La preview sandbox de `/admin/products/customizations` ahora refleja overrides/excepciones del producto seleccionado. Los grupos u opciones ocultos por override no aparecen en la vista previa, los grupos propios se mantienen y la selecciÃ³n local se limpia cuando cambian las opciones efectivas.

- Loader: `getCustomizationOverridesForAdmin` en corpus admin
- Mapper: `resolveAdminEffectivePreviewConfig` / overrides filter alineado a pÃºblico
- Sandbox: prune de selection ids invisibles
- Piloto sin overrides `is_enabled=false` â†’ browser hide N/A (in-memory rules OK)
- Doc: `docs/product-customization-admin-preview-overrides-1-preview-overrides-fidelity.md`
- Deploy: commit `dee486a` â†’ `origin/main` â†’ https://orderops.vercel.app
- **PrÃ³xima:** QA opcional con override disable real autorizado Â· monitor piloto

---

## Registro â€” PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-CLEANUP-1 (2026-07-17)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-CLEANUP-1 â€” Admin Preview Dead Code & Wiring Cleanup
**Estado:** PASS
**Resultado:** Se eliminÃ³ la preview placeholder anterior y se limpiÃ³ wiring/imports/CSS obsoleto relacionado. La preview sandbox interactiva sigue funcionando y el modal pÃºblico conserva su comportamiento.

- Eliminado: `customer-preview-panel.tsx` (0 imports)
- CSS huÃ©rfano del placeholder removido del module admin
- Sandbox `AdminCustomizationLivePreview` + modal pÃºblico smoke OK
- Doc: `docs/product-customization-admin-preview-cleanup-1-dead-code-wiring-cleanup.md`
- Deploy: commit `34b0b55` â†’ `origin/main` â†’ https://orderops.vercel.app
- **PrÃ³xima:** opcional overrides en mapper admin Â· monitor piloto

---

## Registro â€” PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-POLISH-1 (2026-07-17)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-POLISH-1 â€” Interactive Admin Preview Sandbox
**Estado:** PASS
**Resultado:** La preview admin de Product Customization ahora es interactiva y sandbox. Permite probar selecciÃ³n single/multi, plus/adicionales y total estimado reutilizando componentes presentacionales del modal pÃºblico, sin agregar al carrito, sin localStorage, sin checkout y sin writes.

- Shared: option-group/row Â· upsell Â· price-summary Â· \`preview-selection.ts\`
- Admin: \`admin-customization-live-preview.tsx\` + \`admin-preview-mapper.ts\`
- PÃºblico: modal refactorizado sin cambio de comportamiento (smoke Papas/Salsas/Plus OK)
- Doc: \`docs/product-customization-admin-preview-polish-1-interactive-preview-sandbox.md\`
- **PrÃ³xima:** opcional overrides en mapper Â· cleanup CustomerPreviewPanel

---

## Registro â€” PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-SPEC-1 (2026-07-17)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-SPEC-1 â€” Interactive Admin Preview Architecture Spec
**Estado:** PASS
**Resultado:** Se auditÃ³ el modal pÃºblico y la preview admin actual. Se definiÃ³ una arquitectura segura para una preview interactiva en modo sandbox, reutilizando componentes presentacionales sin arrastrar carrito, checkout, localStorage ni side effects.

- Veredicto: **no** importar `CustomizationModal` completo
- RecomendaciÃ³n: extraer presentacionales shared + estado local sandbox + mapper adminâ†’`PublicProductCustomizationConfig`
- Reutilizar: `validateCustomizationSelection`, `computeVisualCustomizationTotal`, `upsell-copy`
- Doc: `docs/product-customization-admin-preview-spec-1-interactive-admin-preview-architecture.md`
- **PrÃ³xima:** PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-POLISH-1 (implementaciÃ³n)

---

## Registro â€” PRODUCT-CUSTOMIZATION-ADMIN-BUTTON-THEME-POLISH-1 (2026-07-17)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-BUTTON-THEME-POLISH-1 â€” Admin Customizations Button Theme Polish
**Estado:** PASS
**Resultado:** Los botones y controles interactivos de `/admin/products/customizations` quedaron alineados con los tokens de theme del admin. Dark/light se ven consistentes, los disabled states son claros y la pantalla conserva la lÃ³gica operativa intacta.

- Primary: accent (`--accent-primary`) en lugar de ink `text-primary` (evita blanco crudo en dark)
- Secondary / DnD tokenizados Â· overrides scoped bajo `.builderShell` para `admin-primary-button`
- Sin layout/DB/RLS/actions Â· tsc/build PASS
- Doc: `docs/product-customization-admin-button-theme-polish-1-button-theme-polish.md`
- **PrÃ³xima:** opcional primary global admin-wide Â· monitor piloto

---

## Registro â€” PRODUCT-CUSTOMIZATION-ADMIN-VISUAL-POLISH-1 (2026-07-17)

**Fase:** PRODUCT-CUSTOMIZATION-ADMIN-VISUAL-POLISH-1 â€” Admin Customizations Layout & Theme Polish
**Estado:** PASS
**Resultado:** La pantalla `/admin/products/customizations` quedÃ³ alineada visualmente con el resto del admin. Usa mejor el ancho disponible, elimina estilos legacy/hardcoded relevantes y mantiene compatibilidad dark/light sin tocar lÃ³gica operativa.

- Shell: `AdminPageLayout size="operational"` + header operational (mismo ancho efectivo que Products / 1600px)
- CSS module: grid 3-col â‰¥1200px Â· tabs strip Â· surfaces tokenizadas Â· selected con accent
- Sin DB/RLS/actions/checkout/stock Â· tsc/build PASS
- Doc: `docs/product-customization-admin-visual-polish-1-layout-theme-polish.md`
- **PrÃ³xima:** monitor piloto Â· opcional preview mÃ¡s fiel al modal pÃºblico

---

## Registro â€” PRODUCT-CUSTOMIZATION-FLAG-OFF-RLS-FIXTURE-QA-1 (2026-07-17)

**Fase:** PRODUCT-CUSTOMIZATION-FLAG-OFF-RLS-FIXTURE-QA-1 â€” Flag OFF Corpus Fixture Negative QA
**Estado:** PASS
**Resultado:** Se creÃ³ un fixture no piloto con Product Customization flag OFF y corpus real. La lectura privilegiada confirma que existen filas, pero anon no puede leerlas por RLS. El piloto flag ON sigue funcionando y business_settings permanece cerrado para anon.

- Fixture: `qa-rls-flag-off-customization` / `59db34de-â€¦` Â· flag OFF Â· corpus 1/1/1/1/1 + override
- Anon fixture corpus **0** Â· piloto groups=3 options=11 upsell=1 Â· Plus UI OK Â· KEEP fixture
- Doc: `docs/product-customization-flag-off-rls-fixture-qa-1-flag-off-corpus-fixture-negative-qa.md`
- **PrÃ³xima:** reusar fixture en regresiones Â· monitor piloto

---

## Registro â€” PRODUCT-CUSTOMIZATION-FLAG-OFF-RLS-QA-1 (2026-07-17)

**Fase:** PRODUCT-CUSTOMIZATION-FLAG-OFF-RLS-QA-1 â€” Flag OFF Public RLS Negative QA
**Estado:** PASS WITH FIXTURE DEBT
**Resultado:** El helper y business_settings cerrado fueron validados, y el control positivo del piloto ON pasÃ³. No se encontrÃ³ tenant flag OFF con corpus real para probar negaciÃ³n completa; queda deuda de fixture.

- Helper false: `roticeriajuan` / `majopasteleria` (sin settings) Â· piloto helper true Â· anon settings=0
- Piloto Plus UI OK Â· browser flag-OFF N/A (404) Â· sin writes
- Doc: `docs/product-customization-flag-off-rls-qa-1-flag-off-public-rls-negative-qa.md`
- **PrÃ³xima:** fixture flag-OFF con corpus (auth) Â· o monitor piloto

---

## Registro â€” PRODUCT-CUSTOMIZATION-PILOT-MONITOR-2 (2026-07-17)

**Fase:** PRODUCT-CUSTOMIZATION-PILOT-MONITOR-2 â€” Plus UI + Stock + Public RLS Live Monitoring
**Estado:** PASS
**Resultado:** El piloto live se mantiene estable luego de Plus UI, copy polish, inventario tracked y public RLS hardening. CatÃ¡logo, modal, carrito, checkout, dashboard, stock Coca, ledger y corpus anon fueron validados sin writes.

- Flags ON Â· sesiÃ³n abierta Â· Coca stock **4** Â· anon corpus OK Â· `business_settings` count=0
- Modal â€œSumÃ¡ una bebidaâ€ + Coca Â· carrito/checkout â€œAdicionalâ€ Â· Pendientes QA=0
- Doc: `docs/product-customization-pilot-monitor-2-plus-ui-stock-public-rls-live-monitoring.md`
- **PrÃ³xima:** monitor operaciÃ³n real Â· opcional reconciliaciÃ³n `#9632` (auth) Â· opcional flag-OFF test

---

## Registro â€” PRODUCT-CUSTOMIZATION-PUBLIC-RLS-HARDENING-1 (2026-07-17)

**Fase:** PRODUCT-CUSTOMIZATION-PUBLIC-RLS-HARDENING-1 â€” Public Customization Corpus RLS Hardening
**Estado:** PASS
**Resultado:** El corpus pÃºblico de Product Customization / Plus UI dejÃ³ de depender del service role directo. RLS pÃºblica ahora usa un helper SECURITY DEFINER que expone solo el booleano del flag y permite leer customizations/upsells disponibles cuando Product Customization estÃ¡ activo.

- Helper: `public.is_public_product_customization_enabled(uuid)` Â· policies public SELECT actualizadas
- CÃ³digo: `loadPublicCustomizationCorpus` â†’ `createSupabaseServerClient()` (sin service role en corpus)
- Apply prod OK Â· anon REST: groups=3 options=11 upsell Bebidas/Coca Â· `business_settings` count=0
- Doc: `docs/product-customization-public-rls-hardening-1-public-corpus-rls-hardening.md`
- **PrÃ³xima:** monitor piloto Â· opcional test flag-OFF Â· opcional flag gate vÃ­a RPC

---

## Registro â€” PRODUCT-CUSTOMIZATION-PLUS-COPY-POLISH-1 (2026-07-17)

**Fase:** PRODUCT-CUSTOMIZATION-PLUS-COPY-POLISH-1 â€” Customer-facing Plus Copy Alignment
**Estado:** PASS
**Resultado:** El copy pÃºblico de Plus Bebidas quedÃ³ alineado para clientes. La secciÃ³n del modal comunica la venta sugerida como una bebida adicional al pedido, manteniendo intacta la lÃ³gica de parent+upsell, checkout, stock y restock.

- Helper: `lib/product-customization/upsell-copy.ts` Â· modal â€œSumÃ¡ una bebidaâ€ Â· carrito/checkout â€œAdicionalâ€
- Sin pedido QA Â· sin DB/RPC/stock
- Doc: `docs/product-customization-plus-copy-polish-1-customer-facing-plus-copy-alignment.md`
- **PrÃ³xima:** opcional RLS public hardening Â· monitor piloto

---

## Registro â€” PRODUCT-CUSTOMIZATION-PLUS-UI-DEPLOY-1 (2026-07-17)

**Fase:** PRODUCT-CUSTOMIZATION-PLUS-UI-DEPLOY-1 â€” Deploy Plus Suggestions UI
**Estado:** PASS
**Resultado:** Plus Bebidas quedÃ³ desplegado y validado en la UI pÃºblica productiva. El cliente puede agregar Coca Cola 500ml como plus dentro del modal de Doble Smash; checkout, dashboard, decremento de stock, ledger y restock al cancelar funcionan end-to-end.

- Deploy: `a284a23` Plus UI + `d1b8e7f` service-role public corpus (fix RLS/anon gap) â†’ `https://orderops.vercel.app`
- Smoke: Doble Smash modal Â· Papas/Salsas/Agregados Â· plus Coca Â· carrito parent+plus
- QA: `#76D4` `8508feb5-â€¦` Coca **4â†’3** `order_decrement` upsell Â· cancel UI **3â†’4** `order_restock` Â· idempotencia OK
- Doc: `docs/product-customization-plus-ui-deploy-1-deploy-plus-suggestions-ui.md`
- **PrÃ³xima:** opcional hardening RLS public/`business_settings` Â· copy Plus Â· monitor piloto

---

## Registro â€” PRODUCT-STOCK-QA-ORDER-CLEANUP-1 (2026-07-17)

**PRODUCT-STOCK-QA-ORDER-CLEANUP-1 â€” Controlled QA Orders Cleanup** â†’ **PASS WITH DEBT**.

- Cancel UI: `#9632` + `#9B25` pendingâ†’cancelled Â· 0 deletes Â· Coca stock **4**
- `#9632` sin `order_restock` (pre-ledger, correcto) Â· deuda histÃ³rica 1 Coca documentada
- Dashboard: Pendientes vacÃ­os Â· QA en Cancelados
- Doc: `docs/product-stock-qa-order-cleanup-1-controlled-qa-orders-cleanup.md`
- **PrÃ³xima:** opcional reconciliaciÃ³n manual pre-ledger (auth) Â· deploy WIP customization

---

## Registro â€” PRODUCT-STOCK-RESTOCK-ACTION-DEPLOY-SMOKE-1 (2026-07-17)

**PRODUCT-STOCK-RESTOCK-ACTION-DEPLOY-SMOKE-1 â€” Deploy Status Action Wiring & UI Cancel Smoke** â†’ **PASS**.

- Deploy: commit `b0bfddb` â†’ `origin/main` â†’ Vercel `https://orderops.vercel.app`
- UI create: `#754A` `21064f2b-â€¦` Coca tracked Â· stock **4â†’3** + `order_decrement`
- UI cancel admin: pendingâ†’cancelled Â· Coca **3â†’4** + `order_restock` (`source=transition_order_status`)
- Idempotencia UI: â€œNo hubo cambiosâ€ Â· restock count=1 Â· timeline `status_changed` OK
- Doc: `docs/product-stock-restock-action-deploy-smoke-1-deploy-status-action-wiring-ui-cancel-smoke.md`
- **PrÃ³xima:** deploy WIP customization (Plus UI) Â· cleanup QA `#9632` opcional

---

## Registro â€” PRODUCT-STOCK-RESTOCK-CANCEL-1 (2026-07-17)

**PRODUCT-STOCK-RESTOCK-CANCEL-1 â€” Idempotent Cancel Restock via stock_movements** â†’ **PASS WITH DEBT**.

- RPC `transition_order_status` restockea solo con `order_decrement` previo (TX + idempotente)
- `updateOrderStatusAction` llama al RPC (cÃ³digo local); **deploy Vercel pendiente** (deuda)
- QA: `#8B9A` `4ef1169a-â€¦` pendingâ†’cancelled Â· Coca **3â†’4** Â· `order_restock` +1
- Idempotencia: re-cancel no-op Â· legacy `#503E` cancel sin movements Â· `#9632`/`#8C2F` sin restock
- Migration: `20260717140000_product_stock_restock_cancel_1.sql` Â· apply prod OK
- Doc: `docs/product-stock-restock-cancel-1-idempotent-cancel-restock-stock-movements.md`
- **PrÃ³xima:** deploy action wiring â†’ smoke UI cancel Â· opcional cleanup `#9632`

---

## Registro â€” PRODUCT-STOCK-DECREMENT-LEDGER-1 (2026-07-17)

**PRODUCT-STOCK-DECREMENT-LEDGER-1 â€” Record Order Decrement Movements in create_order** â†’ **PASS**.

- `create_order` inserta `stock_movements.order_decrement` por order_item tracked (misma TX)
- QA: `4ef1169a-â€¦` Doble Smash + Coca Â· Coca **4â†’3** Â· movement before=4 after=3 delta=-1
- Legacy `c9721e63-â€¦` ClÃ¡sica Â· 0 movements Â· #9632 sin backfill
- Migration: `20260717130000_product_stock_decrement_ledger_1.sql`
- Doc: `docs/product-stock-decrement-ledger-1-record-order-decrement-movements-create-order.md`
- **PrÃ³xima:** PRODUCT-STOCK-RESTOCK-CANCEL-1

---

## Registro â€” PRODUCT-STOCK-MOVEMENTS-SCHEMA-1 (2026-07-16)

**PRODUCT-STOCK-MOVEMENTS-SCHEMA-1 â€” Stock Movements Ledger & Idempotency Schema** â†’ **PASS**.

- Tabla `public.stock_movements` + constraints (tipo, signo, math, nonneg, order context)
- Unique parciales: un `order_decrement` / un `order_restock` por `order_item_id`
- RLS SELECT tenant + super_admin; sin writes client
- Apply prod vÃ­a `apply_migration` Â· tabla vacÃ­a Â· Coca stock=4 intacto
- Types: `types/database.ts`
- Doc: `docs/product-stock-movements-schema-1-stock-movements-ledger-idempotency-schema.md`
- **PrÃ³xima:** PRODUCT-STOCK-DECREMENT-LEDGER-1

---

## Registro â€” PRODUCT-STOCK-RESTOCK-DESIGN-1 (2026-07-16)

**PRODUCT-STOCK-RESTOCK-DESIGN-1 â€” Cancel Restock Contract & Idempotency** â†’ **PASS**.

- Cancel debe restockear solo stock previamente descontado (`track_stock` + evidencia ledger)
- Transiciones V1: pending/preparing/ready â†’ cancelled; **no** completedâ†’cancelled automÃ¡tico
- RecomendaciÃ³n: `stock_movements` con unique `(order_item_id, movement_type)` antes de tocar cancel
- HistÃ³ricos (#8C2F) y QA pending (#9632 / legacy) sin restock retroactivo en esta fase
- `updateOrderStatusAction` auditado: solo status + event; sin stock hoy
- Doc: `docs/product-stock-restock-design-1-cancel-restock-contract-idempotency.md`
- **PrÃ³xima:** PRODUCT-STOCK-MOVEMENTS-SCHEMA-1 â†’ DECREMENT-LEDGER-1 â†’ RESTOCK-CANCEL-1

---

## Registro â€” PRODUCT-STOCK-DECREMENT-ORDER-1 (2026-07-16)

**PRODUCT-STOCK-DECREMENT-ORDER-1 â€” Transactional Stock Consumption in create_order** â†’ **PASS**.

- `create_order` valida/descuenta stock solo si `track_stock=true` (FOR UPDATE + demanda agregada product/upsell)
- Legacy `track_stock=false` intacto (ClÃ¡sica stock=0 vendible, sin descuento)
- QA tracked: order `f34118c6-â€¦` Doble Smash + Coca upsell Â· Coca **5â†’4** Â· total 15500
- QA insufficient: qty 99 â†’ `INSUFFICIENT_STOCK`, sin order, Coca sigue 4
- Migration: `20260717010500_product_stock_decrement_order_1.sql` Â· error map checkout/admin
- Restock cancel **fuera de scope**
- Doc: `docs/product-stock-decrement-order-1-transactional-stock-consumption-create-order.md`
- **PrÃ³xima:** PRODUCT-STOCK-RESTOCK-CANCEL-1 / STOCK-MOVEMENTS

---

## Registro â€” PRODUCT-STOCK-ADMIN-UX-1 (2026-07-16)

**PRODUCT-STOCK-ADMIN-UX-1 â€” Stock Tracking Controls in Product Admin** â†’ **PASS**.

- Create/edit product: switch **Controlar stock automÃ¡ticamente** â†’ `products.track_stock`
- Actions create/update persisten boolean; default false; Disponible/stock intactos
- QA: Coca Cola 500ml â†’ `track_stock=true` (stock 5 / available / price 3000 sin cambio)
- Legacy intacto: `create_order` sin tocar; sin decremento runtime
- Doc: `docs/product-stock-admin-ux-1-stock-tracking-controls-product-admin.md`
- **PrÃ³xima:** PRODUCT-STOCK-DECREMENT-ORDER-1

---

## Registro â€” PRODUCT-STOCK-TRACKING-SCHEMA-1 (2026-07-16)

**PRODUCT-STOCK-TRACKING-SCHEMA-1 â€” Add Product Stock Tracking Flag** â†’ **PASS**.

- Columna `products.track_stock boolean NOT NULL DEFAULT false`
- Migration: `20260716224005_product_stock_tracking_schema_1.sql` Â· aplicada en prod
- 17 productos existentes con `track_stock=false` Â· legacy intacto
- Tipos: `types/database.ts` actualizado Â· create_order/UI sin cambios
- Doc: `docs/product-stock-tracking-schema-1-add-product-track-stock-flag.md`
- **PrÃ³xima:** PRODUCT-STOCK-ADMIN-UX-1

---

## Registro â€” PRODUCT-STOCK-DECREMENT-DESIGN-1 (2026-07-16)

**PRODUCT-STOCK-DECREMENT-DESIGN-1 â€” Inventory Consumption Contract** â†’ **PASS**.

- Contrato hÃ­brido: `track_stock` default **false**
- Tracking ON â†’ validar + descontar en `create_order` (product + upsell), FOR UPDATE
- Restock en cancel â†’ fase posterior (ledger/idempotencia)
- Legacy `stock=0`+available intacto; opciones/customizations no inventarian en V1
- Doc: `docs/product-stock-decrement-design-1-inventory-consumption-contract.md`
- **PrÃ³xima:** PRODUCT-STOCK-TRACKING-SCHEMA-1

---

## Registro â€” PRODUCT-STOCK-DECREMENT-AUDIT-1 (2026-07-16)

**PRODUCT-STOCK-DECREMENT-AUDIT-1 â€” Order Stock Consumption For Product/Upsell Items** â†’ **PASS WITH DEBT**.

- Read-only: `create_order` **no** toca `products.stock` (ni parent ni upsell); solo valida `is_available`
- Trigger `tr_auto_suspend_out_of_stock` solo en INSERT/UPDATE OF stock â†’ availability
- CancelaciÃ³n (`updateOrderStatusAction`) no restaura stock
- Evidencia `#8C2F` / Coca Cola: stock 5â†’5; catÃ¡logo vive con stock=0 + available=true
- HipÃ³tesis: **H1** (stock = control manual de disponibilidad)
- Doc: `docs/product-stock-decrement-audit-1-order-stock-consumption-product-upsell-items.md`
- **PrÃ³xima:** PRODUCT-STOCK-DECREMENT-DESIGN-1 (polÃ­tica + create_order)

---

## Registro â€” Product Customization QA-ORDER-CLEANUP-1 (2026-07-16)

**PRODUCT-CUSTOMIZATION-QA-ORDER-CLEANUP-1 â€” Cancel QA Orders Safely** â†’ **PASS WITH DEBT**.

- Pedido `#8C2F` (`30c1b498-â€¦`) cancelado vÃ­a UI admin (`updateOrderStatusAction` â†’ `cancelled`)
- Items/snapshot/upsell intactos Â· total `$15750` Â· Pendientes limpio Â· lane Cancelados
- Flags/sesiÃ³n intactos Â· stock Coca Cola sin cambio (sigue 5)
- Doc: `docs/product-customization-qa-order-cleanup-1-cancel-qa-orders-safely.md`

---

## Registro â€” Product Customization PLUS-BEBIDAS-QA-1 Retry (2026-07-16)

**PRODUCT-CUSTOMIZATION-PLUS-BEBIDAS-QA-1 â€” Retry / Real Order Snapshot & Dashboard Validation** â†’ **PASS WITH DEBT**.

- Pedido UI: `#8C2F` (`30c1b498-â€¦`) QA Plus Bebidas Retry Â· `$15750` Â· pending Â· pickup
- Parent Doble Smash `item_kind=product` + snapshot v1 (Papas chicas + Salsa Big Mac)
- Child Coca Cola `item_kind=upsell` + `parent_order_item_id` correcto Â· `$3000`
- Total SQL coincide Â· dashboard detalle sin JSON raw
- Deuda: stock Coca Cola no decrementa (sigue 5) Â· pedido QA queda pending
- Doc: `docs/product-customization-plus-bebidas-qa-1-retry-real-order-snapshot-dashboard-validation.md`

---

## Registro â€” Product Customization PLUS-BEBIDAS-AVAILABILITY-1 (2026-07-16)

**PRODUCT-CUSTOMIZATION-PLUS-BEBIDAS-AVAILABILITY-1 â€” Reactivate Beverage Product for Upsell QA** â†’ **PASS WITH DEBT**.

- Audit: `products.stock` + trigger `tr_auto_suspend_out_of_stock` (`stock<=0` â†’ `is_available=false`)
- Al auditar, Coca Cola ya estaba `is_available=true` / `stock=5` (reactivada entre QA-1 y esta fase) â†’ **sin write SQL**
- Browser: Plus â€œTambiÃ©n podÃ©s sumarâ€ + Coca Cola Â· cart V2 padre+bebida Â· checkout pre-submit PASS
- Pedido QA **no creado**
- Doc: `docs/product-customization-plus-bebidas-availability-1-reactivate-beverage-product-for-upsell-qa.md`
- **PrÃ³xima:** PLUS-BEBIDAS-QA-1 Retry (pedido real)

---

## Registro â€” Product Customization PLUS-BEBIDAS-QA-1 (2026-07-16)

**PRODUCT-CUSTOMIZATION-PLUS-BEBIDAS-QA-1 â€” Real Order Snapshot & Dashboard Validation** â†’ **BLOCKED**.

- Auth de crear pedido presente, pero **Coca Cola 500ml** estÃ¡ `is_available=false`
- Public Plus filtra productos disponibles â†’ modal sin â€œTambiÃ©n podÃ©s sumarâ€
- **No se creÃ³ pedido** (no se reactivÃ³ producto: fuera de scope)
- Live: customization/on_demand/session intactos
- Doc: `docs/product-customization-plus-bebidas-qa-1-real-order-snapshot-dashboard-validation.md`
- **PrÃ³xima:** reactivar Coca Cola (auth) + retry QA order

---

## Registro â€” PRODUCT-IMAGE-RANDOMUUID-HOTFIX-1 (2026-07-16)

**PRODUCT-IMAGE-RANDOMUUID-HOTFIX-1 â€” Client-Safe Image Upload ID Fallback** â†’ **PASS WITH DEBT**.

- Crash `crypto.randomUUID is not a function` en crop/upload (LAN/HTTP) corregido
- Helper: `lib/client/safe-random-id.ts` â†’ usado en create/edit product + public assets
- CLI: `tsc`/`build` PASS Â· smoke helper fallback PASS Â· QA LAN fÃ­sica pendiente
- Doc: `docs/product-image-randomuuid-hotfix-1-client-safe-image-upload-id-fallback.md`

---

## Registro â€” Product Customization PLUS-BEBIDAS-2 (2026-07-16)

**PRODUCT-CUSTOMIZATION-PLUS-BEBIDAS-2 â€” Create Beverage Products & Enable Upsell** â†’ **PASS WITH DEBT**.

- Tenant: `demohamburgueseria` â€” customization **sigue live**
- Writes: categorÃ­a **Bebidas** Â· producto **Coca Cola 500ml** `$3000` Â· upsell item en grupo Bebidas (target Doble Smash)
- Browser: modal Plus Â· cart V2 padre+bebida Â· checkout pre-submit PASS
- Deuda: mÃ¡s bebidas Â· upsell solo Doble Smash Â· sin pedido QA
- Doc: `docs/product-customization-plus-bebidas-2-create-beverage-products-enable-upsell.md`
- **PrÃ³xima:** QA order plus / ampliar targets / assignments / ADMIN-UX-2

---

## Registro â€” Product Customization PLUS-BEBIDAS-1 (2026-07-16)

**PRODUCT-CUSTOMIZATION-PLUS-BEBIDAS-1 â€” Real Beverage Upsell Setup** â†’ **BLOCKED**.

- Tenant: `demohamburgueseria` â€” customization **sigue live**
- Hallazgo: upsell group **Bebidas** existe (`3ef90826-â€¦`, target Doble Smash) pero `upsell_group_items` vacÃ­o
- Bloqueo: **0 productos bebida** en `products` (Coca Cola histÃ³rica eliminada; order_items con `product_id=null`)
- Sin `AUTORIZO_CREATE_BEVERAGE_PRODUCTS` â†’ no writes
- Browser: modal OK sin secciÃ³n Plus; dashboard histÃ³ricos OK
- Doc: `docs/product-customization-plus-bebidas-1-real-beverage-upsell-setup.md`
- **PrÃ³xima:** crear productos bebida + poblar items (retry/PLUS-BEBIDAS-2)

---

## Registro â€” Product Customization GROUP-DESCRIPTIONS-1 (2026-07-16)

**PRODUCT-CUSTOMIZATION-GROUP-DESCRIPTIONS-1 â€” Customer-Facing Group Description Polish** â†’ **PASS WITH DEBT**.

- Tenant: `demohamburgueseria` â€” customization **sigue live**
- Writes: descriptions Papas / Salsas / Agregados extra alineadas al copy comercial
- Browser: modal muestra descriptions nuevas; cart/checkout usan nombres de grupo; histÃ³ricos (`#7D0A`) intactos
- Deuda: Plus Bebidas vacÃ­o Â· assignments limitados Â· sin pedido QA nuevo
- Doc: `docs/product-customization-group-descriptions-1-customer-facing-descriptions.md`
- **PrÃ³xima:** poblar Plus / expandir assignments / ADMIN-UX-2 / OPTION-IMAGES-1

---

## Registro â€” Product Customization GROUP-NAMING-1 (2026-07-16)

**PRODUCT-CUSTOMIZATION-GROUP-NAMING-1 â€” Customer-Facing Group Naming Polish** â†’ **PASS WITH DEBT**.

- Tenant: `demohamburgueseria` â€” customization **sigue live**
- Writes: `Aderezos`â†’**Salsas** Â· `Extras`â†’**Agregados extra** Â· Papas sin cambios
- Browser: modal/cart/checkout muestran nombres nuevos; histÃ³ricos (`#7D0A`) conservan snapshot viejo
- Deuda: descriptions de grupo aÃºn â€œaderezos/extrasâ€ Â· Plus Bebidas vacÃ­o Â· assignments limitados
- Doc: `docs/product-customization-group-naming-1-customer-facing-group-names.md`
- **PrÃ³xima:** descriptions polish / poblar Plus / expandir assignments / ADMIN-UX-2

---

## Registro â€” Product Customization REAL-CONFIG-POLISH-1 (2026-07-16)

**PRODUCT-CUSTOMIZATION-REAL-CONFIG-POLISH-1 â€” Owner Config Copy & Commercial Cleanup** â†’ **PASS WITH DEBT**.

- Tenant: `demohamburgueseria` â€” customization **sigue live**
- Writes: `Chedar`â†’**Cheddar** Â· `Big Mac`â†’**Salsa Big Mac** Â· hero/public copy sin â€œQAâ€
- No renombres de grupos / precios / upsell / pedido nuevo
- Browser: catÃ¡logo/modal/cart/checkout pre-submit PASS con nombres nuevos
- Dashboard: histÃ³ricos (`#7D0A`) conservan snapshot viejo (esperado)
- Deuda: Plus Bebidas sin items Â· Aderezos/Extras naming opcional Â· assignments limitados Â· imÃ¡genes
- Doc: `docs/product-customization-real-config-polish-1-owner-config-copy-commercial-cleanup.md`
- **PrÃ³xima:** poblar Plus / decidir group naming / expandir assignments / ADMIN-UX-2

---

## Registro â€” Product Customization PILOT-MONITOR-1 (2026-07-15)

**PRODUCT-CUSTOMIZATION-PILOT-MONITOR-1 â€” Live Pilot Monitoring & Real Config Readiness** â†’ **PASS WITH DEBT**.

- Tenant: `demohamburgueseria`
- Estado live: `product_customization_enabled=true` Â· store session **open** Â· `on_demand_mode_active=true`
- Config activa: **Papas / Aderezos / Extras** (demo/comercial inicial; stamp QA ADMIN-2 ausente)
- Pedidos: `#213F` SQL PASS Â· `#7D0A` real Doble Smash snapshot v1 PASS Â· sin inconsistencias 48h
- Browser: catÃ¡logo/modal/cart V2/checkout pre-submit/dashboard PASS
- Deuda: copy (`Chedar`, `Big Mac`), hero pÃºblico â€œQAâ€, sin upsell Plus, assignments solo 2 productos
- Sin writes / sin rollback / sin cÃ³digo
- Doc: `docs/product-customization-pilot-monitor-1-live-pilot-monitoring-real-config-readiness.md`
- **PrÃ³xima:** owner polish copy/config â†’ opcional ADMIN-UX-2 / OPTION-IMAGES-1

---

## Registro â€” Product Customization ROLLOUT-PILOT-1 Modo C Retry 2 (2026-07-14 / 2026-07-15 UTC)

**PRODUCT-CUSTOMIZATION-ROLLOUT-PILOT-1 â€” Modo C Live Activation Retry 2** â†’ **PASS WITH DEBT â€” PILOT LIVE**.

- Tenant: `demohamburgueseria`
- Flag final: `product_customization_enabled=true` (activaciÃ³n `2026-07-14 23:00:16 UTC`)
- Gate operativo: store session **open** + `on_demand_mode_active=true`
- Config final: QA customization **active** (autorizaciÃ³n leave-on)
- Pedido QA live retry 2: `#213F` / `d5573074-8c14-4fa1-af5f-6e3a2209213f` â€” BBQ+Plus+Coca `$16.750`
- SQL parent snapshot v1 + upsell child `parent_order_item_id`: **PASS**
- Dashboard summary + badge Plus: **PASS**
- Rollback SQL: documentado, **no ejecutado**
- Deuda menor: sticky cart CTA en automation (navegaciÃ³n directa a `/checkout`); dedup cart no smokeado
- Doc: `docs/product-customization-rollout-pilot-1-controlled-tenant-rollout.md`
- **PrÃ³xima:** monitoreo piloto / config real owner / ADMIN-UX-2 polish

---

## Registro â€” LIVE-OPS-GATE-1 (2026-07-14)

**LIVE-OPS-GATE-1 â€” Store Session / On-Demand Acceptance Reconciliation** â†’ **PASS**.

- ReconciliaciÃ³n: open/close admin deja `store_sessions` y `on_demand_mode_active` alineados (SQL smoke PASS).
- Gate pÃºblico + `create_order`: pedido legacy UI `1ef8a30a-â€¦` (QA Live Ops Gate) **PASS** â€” sin rechazo por negocio cerrado.
- Product Customization **no** modificado; flag off.
- Estado recomendado para Modo C Retry 2:
  - session **open** (`a01252b0-â€¦`)
  - `on_demand_mode_active=true`
  - `product_customization_enabled=false`
  - QA customization soft-disabled
- Doc: `docs/live-ops-gate-1-store-session-on-demand-reconciliation.md`
- **Cerrado por:** Modo C Live Activation Retry 2 â†’ **PASS WITH DEBT â€” PILOT LIVE**

---

## Registro â€” Product Customization ROLLOUT-PILOT-1 (2026-07-14)

**PRODUCT-CUSTOMIZATION-ROLLOUT-PILOT-1 â€” Modo C Live Activation Retry** â†’ **ROLLBACK EXECUTED**.

- Tenant: `demohamburgueseria`
- Flag final: **false** (rollback `16:08:29 UTC`; activaciÃ³n previa `15:21:41 UTC`)
- Config final: QA soft-disabled
- Causa: checkout submit rechazado â€” UI/sesiÃ³n `open` pero RPC `create_order` exige `on_demand_mode_active=true` (columna seguÃ­a **false**; desync ops)
- CatÃ¡logo/modal/cart V2 flag-on: PASS ($16.750 BBQ+Plus+Coca); pedido live retry: **no creado**
- Modo A: PASS READINESS Â· Modo B: PASS WITH FLAG OFF (`#8C9E`) Â· Modo C #1: ROLLBACK EXECUTED
- Doc: `docs/product-customization-rollout-pilot-1-controlled-tenant-rollout.md`
- **PrÃ³xima:** abrir sesiÃ³n vÃ­a admin (sync on-demand) â†’ verificar **ambos** gates â†’ re-intentar Modo C leave-ON

---

## Registro â€” Product Customization CHECKOUT-UI-SMOKE-1 (2026-07-14)

**PRODUCT-CUSTOMIZATION-CHECKOUT-UI-SMOKE-1** â†’ **PASS WITH DEBT**.

- Primer pedido V2 desde **checkout UI real** (no RPC): `#5C7C` / `3b9f87a2-â€¦`
- Flujo validado: catÃ¡logo â†’ modal â†’ cart V2 â†’ checkout â†’ server action â†’ `create_order` â†’ SQL snapshot/upsell child â†’ dashboard
- SQL: parent snapshot v1 `unit_price=13750` + upsell Coca Cola `parent_order_item_id` OK
- Cleanup: flag **false**; datos QA soft-disabled
- Deuda menor: dedup cart / config distinta no probados; automatizaciÃ³n browser frÃ¡gil
- Doc: `docs/product-customization-checkout-ui-smoke-1-browser-checkout-validation.md`
- **Deudas P1 D1/D2 cerradas.** V1 listo para rollout pilot controlado.
- **PrÃ³xima recomendada:** rollout pilot por tenant **o** ADMIN-UX-2 (polish)

---

## Registro â€” Product Customization ADMIN-UX-1 (2026-07-14)

**PRODUCT-CUSTOMIZATION-ADMIN-UX-1** â†’ **PASS WITH DEBT**.

- Shell owner-friendly en `/admin/products/customizations`: tabs Por producto (default) / Por categorÃ­a / Secciones reutilizables / Plus sugeridos
- Layout product-first 3 zonas + preview placeholder; copy de negocio; actions/DnD intactos
- Sin DB/RPC/cart/checkout/catÃ¡logo/dashboard; flag no activado
- Doc: `docs/product-customization-admin-ux-1-owner-friendly-builder-shell.md`
- Deuda: preview orientativo (sin overrides), formularios internos densos, mobile polish
- **PrÃ³xima recomendada:** `PRODUCT-CUSTOMIZATION-ADMIN-UX-2` (polish forms/preview) o rollout pilot V1

---

## Registro â€” Product Customization ADMIN-UX-SPEC-1 (2026-07-14)

**PRODUCT-CUSTOMIZATION-ADMIN-UX-SPEC-1** â†’ **PASS**.

- Spec owner-friendly para `/admin/products/customizations` (product-first, lenguaje de negocio, preview, venta sugerida)
- Sin implementaciÃ³n UI/cÃ³digo/DB; capa UX sobre modelo V1 existente
- Doc: `docs/product-customization-admin-ux-spec-1-owner-friendly-builder.md`
- **Implementada parcialmente por:** `PRODUCT-CUSTOMIZATION-ADMIN-UX-1`
- V1 funcional PASS WITH DEBT (flag off; CHECKOUT-UI-SMOKE-1 cerrÃ³ D1/D2)

---

## MÃ³dulo â€” Product Customization V1 (2026-07-14)

**PRODUCT-CUSTOMIZATION-V1-HANDOFF-1** â†’ **PASS WITH DEBT** (V1 cerrado).

- Handoff: `docs/product-customization-v1-final-handoff.md`
- Flag `demohamburgueseria`: **off** (default fail-closed)
- Evidencia runtime: pedido V2 `#8E6F` / `d3e5c903-â€¦` (SQL + dashboard)
- Deudas P1 D1/D2: **cerradas** por CHECKOUT-UI-SMOKE-1 (pedido `#5C7C` desde UI)
- Deuda menor: dedup cart / browser automation polish
- **No hay fase funcional activa** hasta rollout pilot o roadmap V1.1
- PrÃ³xima recomendada: **rollout pilot controlado** por tenant

---

## Registro â€” Product Customization E2E-QA-1 (2026-07-14)

**PRODUCT-CUSTOMIZATION-E2E-QA-1** â†’ **PASS WITH DEBT**.

- Flag-on temporal + datos QA reactivados; pedido V2 real `d3e5c903-â€¦` (#8E6F)
- SQL: parent snapshot v1 `unit_price=13750` + upsell child Coca Cola con `parent_order_item_id`
- Dashboard: summary + Plus indentado; legacy `#2C00` intacto
- Cleanup: flag **false**; QA data soft-disabled
- Deuda: browser catÃ¡logoâ†’checkout UI no cerrado (pedido vÃ­a RPC autorizado)
- Doc: `docs/product-customization-e2e-qa-1-flag-on-full-runtime-smoke.md`
- PrÃ³xima: opcional UI checkout smoke, o handoff V1 / roadmap V1.1

---

## Registro â€” Product Customization DASHBOARD-1 (2026-07-13)

**PRODUCT-CUSTOMIZATION-DASHBOARD-1** â†’ **PASS WITH DEBT**.

- Parser/normalizer client-safe `order-dashboard.ts` (snapshot v1 + Ã¡rbol parent/upsell)
- Panel Productos: summary debajo del parent; upsell indentado + badge Plus; orphan seguro
- Selects read-only incluyen `item_kind` / `parent_order_item_id` / `customization_snapshot`
- Legacy smoke: dashboard + workspace QA Legacy ORDER-1 se ven normales; sin JSON raw
- Flag sigue **off**; sin checkout/RPC/DB; `tsc` + `build` PASS
- Deuda: QA V2 real en dashboard pendiente (no hay pedido V2 persistido)
- Doc: `docs/product-customization-dashboard-1-render-snapshot-upsell-children.md`
- PrÃ³xima: cerrar ORDER-1 V2 assert **o** QA dashboard V2 cuando exista dato

---

## Registro â€” Product Customization ORDER-1-DB-APPLY-QA (2026-07-13)

**PRODUCT-CUSTOMIZATION-ORDER-1-DB-APPLY-QA** â†’ **PASS WITH DEBT** (cleanup cerrado).

- RPC `create_order` ORDER-1 aplicada en `pkrsedmwxekbhlohhqds` (MCP directed; no mass `db push`)
- Markers post-apply OK; legacy order QA PASS
- Flag-on temporal + catÃ¡logo â€œDesdeâ€ + modal + cart V2 jerÃ¡rquico PASS
- Cleanup `AUTORIZO_FLAG_OFF_CLEANUP=yes`: flag demo **false**; grupo/options/assignments/upsell QA soft-disabled
- Deuda restante: QA 4â€“5 pedido V2 persistido + SQL assert
- Doc: `docs/product-customization-order-1-db-apply-qa-runtime-smoke.md`
- PrÃ³xima: **DASHBOARD-1**

---

## Registro â€” Product Customization ORDER-1 (2026-07-13)

**PRODUCT-CUSTOMIZATION-ORDER-1** â†’ **PASS WITH DEBT**.

- ValidaciÃ³n server-side + snapshot v1; checkout V2 desbloqueado
- MigraciÃ³n `create_order` con parents/upsell/`customization_snapshot` (backward-compatible)
- Flag sigue **off**; sin `db push` remoto; sin dashboard UI
- `tsc` + `build` PASS
- Deuda: migraciÃ³n no aplicada en remoto; flag-on/SQL QA pendientes
- Doc: `docs/product-customization-order-1-rpc-server-validation-snapshot.md`
- PrÃ³xima: apply autorizado + **DASHBOARD-1**

---

## Registro â€” Product Customization CART-1 (2026-07-13)

**PRODUCT-CUSTOMIZATION-CART-1** â†’ **PASS WITH DEBT**.

- `LocalCartItemV2` + signature dedup; storage dual legacy/v2
- Modal confirma â†’ carrito; cart sheet jerÃ¡rquico; edit/remove parent/upsell
- Checkout guard client-side (no `create_order`/RPC/actions server)
- Flag sigue **off**; `tsc` + `build` PASS
- Doc: `docs/product-customization-cart-1-cart-signature-pricing-display.md`
- Deuda: browser QA flag-on pendiente de autorizaciÃ³n
- PrÃ³xima: **PRODUCT-CUSTOMIZATION-ORDER-1**

---

## Registro â€” Product Customization CATALOG-1 (2026-07-13)

**PRODUCT-CUSTOMIZATION-CATALOG-1** â†’ **PASS WITH DEBT**.

- Read model pÃºblico (`lib/product-customization/public.ts` + `public-shared.ts`)
- Summaries / â€œDesde $Xâ€, intercept add-to-cart, modal lazy + total visual + upsell
- CTA â€œContinuarâ€ = seam CART-1 (no escribe carrito legacy ni checkout)
- Flag sigue **off**; sin migraciones/dashboard/`create_order`/cart schema
- Doc: `docs/product-customization-catalog-1-public-customization-modal.md`
- Deuda: browser QA con flag on pendiente de autorizaciÃ³n
- PrÃ³xima: **PRODUCT-CUSTOMIZATION-CART-1**

---

## Registro â€” Product Customization ADMIN-DND-1 (2026-07-12)

**PRODUCT-CUSTOMIZATION-ADMIN-DND-1** â†’ **PASS WITH DEBT**.

- DnD nativo + â†‘/â†“ para grupos, opciones (intra-grupo) y assignments (intra-target)
- Actions: `reorderCustomizationGroups/Options/AssignmentsAction`; `sort_order` 10/20/30â€¦
- Sin dependencia DnD nueva; flag off; sin pÃºblico/DB/deploy
- `tsc` + `build` PASS
- Deuda: touch HTML5 DnD; keyboard ARIA avanzado; upsell items fuera de scope; atomicidad sin RPC
- Doc: `docs/product-customization-admin-dnd-1-sortable-groups-options.md`
- PrÃ³xima: **PUBLIC-1** (detrÃ¡s del flag) o DND-2 upsell items

---

## Registro â€” Product Customization ADMIN-2-QA (2026-07-12)

**PRODUCT-CUSTOMIZATION-ADMIN-2-QA** â†’ **PASS WITH DEBT**.

- Smoke browser autenticado en `localhost:3000` (owner La BurguesÃ­a)
- Assignments categorÃ­a/producto, overrides restore, upsell + regla 1/target: PASS
- Flag sigue **off**; catÃ¡logo/dashboard sin UI customization
- Datos QA `20260712-1726` soft-desactivados; overrides restaurados
- Doc: `docs/product-customization-admin-2-qa-authenticated-browser-smoke.md`
- PrÃ³xima: **PRODUCT-CUSTOMIZATION-PUBLIC-1** (detrÃ¡s del flag; sin activar aÃºn)

---

## Registro â€” Product Customization ADMIN-2 (2026-07-12)

**PRODUCT-CUSTOMIZATION-ADMIN-2** â†’ **PASS WITH DEBT**.

- Extiende `/admin/products/customizations`: assignments, upsell, herencia
- Panel overrides en edit product (disable/restore grupo y opciÃ³n)
- Flag sigue **off**; sin catÃ¡logo/carrito/checkout/dashboard/`create_order`
- `tsc` PASS; build verificado en fase; sin deploy
- Deuda: unique upsell = 1 fila/target (no solo 1 activo); smoke autenticado â†’ ver ADMIN-2-QA
- Doc: `docs/product-customization-admin-2-assignments-overrides-upsell.md`
- PrÃ³xima: conectar pÃºblico detrÃ¡s del flag (**PUBLIC-1**) cuando se autorice

---

## Registro â€” Product Customization ADMIN-1 (2026-07-12)

**PRODUCT-CUSTOMIZATION-ADMIN-1** â†’ **PASS WITH DEBT**.

- Ruta: `/admin/products/customizations` (CRUD grupos + opciones)
- Flag sigue **off**; aviso preparatorio visible
- Link desde header Productos: â€œOpcionales y extrasâ€
- `tsc` + `build` PASS; sin deploy
- Deuda: smoke CRUD autenticado pendiente (redirect login verificado)
- Doc: `docs/product-customization-admin-1-groups-options-admin.md`
- PrÃ³xima: **PRODUCT-CUSTOMIZATION-ADMIN-2** (assignments / overrides / upsell)

---

## Registro â€” Product Customization DB-APPLY-1 (2026-07-12)

**PRODUCT-CUSTOMIZATION-DB-APPLY-1** â†’ **PASS WITH DEBT** (producciÃ³n autorizada; sin staging).

- Project ref: `pkrsedmwxekbhlohhqds` (OrderOps) â€” autorizado por usuario
- Schema customization **ya presente** en remoto; smoke PASS; `enabled_count = 0`
- `db push` **no** re-ejecutado (falta `supabase_migrations.schema_migrations` â€” riesgo de reaplicar historial)
- App smoke flag off PASS (`orderops.vercel.app`)
- Doc: `docs/product-customization-db-apply-1-staging-migration-schema-smoke.md`
- PrÃ³xima: **PRODUCT-CUSTOMIZATION-ADMIN-1**

---

## Registro â€” Product Customization FLAG-1 (2026-07-12)

**PRODUCT-CUSTOMIZATION-FLAG-1** completada (helper server-only; sin UI ni activaciÃ³n).

- Helper: `lib/product-customization/flags.ts` â†’ `isProductCustomizationEnabled(businessId)`
- Fail-closed; service client; flag sigue default **off**
- Doc: `docs/product-customization-flag-1-tenant-rollout-guard.md`
- PrÃ³xima: **PRODUCT-CUSTOMIZATION-ADMIN-1** (tras aplicar DB-1 en staging)

---

## Registro â€” Product Customization DB-1 (2026-07-12)

**PRODUCT-CUSTOMIZATION-DB-1** completada (schema/RLS/types; sin UI ni RPC).

- MigraciÃ³n: `supabase/migrations/20260712090000_product_customization_v1_schema.sql`
- Flag: `business_settings.product_customization_enabled` default **false**
- Doc: `docs/product-customization-db-1-schema-rls-types.md`
- PrÃ³xima: **PRODUCT-CUSTOMIZATION-ADMIN-1** (o aplicar migraciÃ³n en staging)

---

## Registro QA ProducciÃ³n â€” Orders Flow (2026-07-09)

**ORDERS-FLOW-QA-1** ejecutado en `https://orderops.vercel.app`. Resultado: **PASS WITH DEBT**.

- Dashboard operativo, pedido manual #A323, tomar pedido y transiciones hasta Completado: **PASS**
- Realtime single-tab (apariciÃ³n + cambio de lane): **PASS**
- Checkout pÃºblico E2E y multi-tab realtime: **NOT TESTED**
- Doc: `docs/orders-flow-qa-1-production-smoke.md`

---

## 1. MÃ³dulo en Desarrollo Activo

### Pantalla / Componente Principal

**Dashboard Principal Operacional (Orders Dashboard / Workflow Lanes Engine)**

Este mÃ³dulo representa el centro operacional del sistema y concentra:

* gestiÃ³n de pedidos en tiempo real;
* lanes dinÃ¡micas por workflow;
* ownership colaborativo;
* snapshots operacionales;
* mÃ©tricas compactas;
* sesiones vivas;
* scanning operacional;
* insights automÃ¡ticos;
* actividad reciente.

### Funcionalidad Actualmente Bajo IteraciÃ³n

La fase actual estÃ¡ enfocada en estabilizar la ejecuciÃ³n operacional multioperador sobre estados vivos.

Flujo operativo principal:

```text
Pending
   â†“
Preparing
   â†“
Ready
   â†“
Completed

Cualquier estado:
â†’ Cancelled
```

Objetivos funcionales activos:

* sincronizaciÃ³n visual consistente entre operadores simultÃ¡neos;
* evitar desincronizaciÃ³n entre pestaÃ±as;
* convergencia rÃ¡pida entre estado optimista y estado persistido;
* preservar ownership y contexto operacional;
* reducir fricciÃ³n visual durante cambios de estado.

### TecnologÃ­as Involucradas

Frontend:

* Next.js App Router
* React
* TypeScript
* Component Architecture
* Client Components + Hooks

Backend:

* Supabase Postgres
* Supabase Realtime Channels
* Supabase Presence
* Supabase Auth
* Supabase RLS

Estado / Render:

* useMemo
* useEffect
* optimistic state updates
* defensive hydration
* realtime reconciliation

Estilos:

* CSS componentizado
* Mobile-first
* Dashboard styles altamente especializados

Archivos de alta criticidad:

```text
components/admin/orders/admin-dashboard-orders.tsx
components/admin/orders-admin.css
components/admin/admin-shell.css
app/admin/(protected)/dashboard/page.tsx
```

---

## 2. LÃ³gica Visual e Iteraciones en Curso

### Objetivo Visual Actual

Prioridad absoluta:

```text
Estabilidad operacional > fidelidad visual
```

El dashboard debe permanecer estable bajo:

* scroll continuo;
* actualizaciones realtime;
* sesiones largas;
* mÃºltiples operadores;
* dispositivos Android modestos.

### Trabajo Visual Activo

### Dashboard Mobile-First

Se estÃ¡ iterando sobre:

* cards operacionales;
* overview superior;
* snapshots KPI;
* compactaciÃ³n visual;
* spacing adaptativo;
* densidad informativa.

### Empty States Operacionales

Estados vacÃ­os actualmente optimizados para:

* jornada sin pedidos;
* sesiÃ³n cerrada;
* panel en escucha;
* ausencia de actividad;
* filtros sin resultados.

### Renderer Mobile Alternativo

Actualmente existe una bifurcaciÃ³n controlada:

```text
Desktop Overview
â†“
Renderer histÃ³rico intacto

Mobile Overview
â†“
Renderer simplificado y separado
```

MotivaciÃ³n:

* reducir complejidad de render;
* desacoplar mobile del overview histÃ³rico;
* aislar bugs especÃ­ficos de Chrome Android.

### PreparaciÃ³n Future-Proof

El sistema visual sigue preparÃ¡ndose para:

* Dark Theme
* Kitchen Mode
* Delivery Mode
* Role-specific layouts
* visual tokens reutilizables

### Hallazgo CrÃ­tico Visual Actual

Existe un bug de render altamente especÃ­fico:

```text
Chrome Android
âœ“ reproduce bug

Opera Mini
âœ— NO reproduce bug

Desktop
âœ— NO reproduce bug
```

Esto indica:

```text
problema probablemente asociado a:
GPU compositor
rasterization path
viewport rendering
Chrome Android rendering pipeline
```

No existe evidencia fuerte de:

* problema de lÃ³gica;
* problema de datos;
* problema de realtime;
* problema de CSS chunking actual.

---

## 3. Estado de la SincronizaciÃ³n y Realtime (Bloqueo Actual)

### Estado Actual del Realtime

El realtime ya opera sobre:

* channels de Supabase;
* hydration defensiva;
* presencia;
* reconciliaciÃ³n;
* optimistic updates.

### Problema HistÃ³rico Detectado

Hubo evidencia previa de:

* pestaÃ±as que perdÃ­an convergencia;
* operadores viendo sesiones desactualizadas;
* dashboards sin refresco automÃ¡tico;
* dependencia excesiva del refresh manual.

### Estrategia Actual de ReconciliaciÃ³n

PatrÃ³n implementado:

```text
Realtime Event
      â†“
Patch optimista
      â†“
Hydration defensiva
      â†“
Re-fetch / reconcile
      â†“
Estado convergente
```

### Riesgos Actuales

Problemas que todavÃ­a deben vigilarse:

* duplicated optimistic patches;
* stale closures en hooks;
* race conditions entre realtime y hydration;
* order snapshots incompletos;
* payloads parciales.

### Optimistic UX

Objetivo:

```text
feedback inmediato
+
consistencia eventual
```

Reglas:

* la UI responde instantÃ¡neamente;
* el backend sigue siendo la fuente de verdad;
* los fallos deben reconciliarse automÃ¡ticamente.

### Cadena de DerivaciÃ³n Esperada

```text
orders
â†“
hydratedOrders
â†“
optimisticOrders
â†“
windowScopedOrders
â†“
filteredOrders
â†“
lanes
metrics
insights
activity
```

Toda derivaciÃ³n debe depender de la misma fuente.

---

## 4. Bloqueo Activo Actual (Highest Priority)

### Problema Principal

Bug visual severo en:

```text
Chrome Android
Moto G13
```

SÃ­ntomas:

* bandas horizontales;
* ghost rendering;
* cards duplicadas visualmente;
* corrupciÃ³n parcial del viewport;
* repaint inconsistente;
* artefactos durante scroll.

### HipÃ³tesis Ya Descartadas

Descartado o debilitado:

* CSS chunk corruption;
* HMR parcial;
* translateZ hacks;
* forced layer promotion;
* nested grid overview;
* overview histÃ³rico;
* rgba/shadows;
* 100dvh;
* layout mobile previo;
* GPU promotion manual;
* overview renderer antiguo.

### HipÃ³tesis MÃ¡s Fuertes Ahora

```text
1. Chrome Android raster pipeline
2. compositor GPU especÃ­fico
3. assets / imÃ¡genes / SVG
4. primitives visuales globales
5. bug especÃ­fico del device GPU path
```

### Regla Importante

NO seguir haciendo microfixes aislados.

Usar:

```text
aislamiento binario
```

---

## 5. Tareas Pendientes Inmediatas (Next Steps para Cursor)

### Paso 1 â€” Resolver DesincronizaciÃ³n / Convergencia

Auditar:

* hooks realtime;
* subscriptions duplicadas;
* stale references;
* hydration ordering.

Validar:

```text
multi-tab
multi-operator
network fluctuation
```

---

### Paso 2 â€” Estabilizar HidrataciÃ³n Inicial

Objetivos:

* eliminar CLS;
* reducir saltos visuales;
* evitar flashes de mÃ©tricas.

Revisar:

* loading boundaries;
* skeleton strategy;
* hydration sequence.

---

### Paso 3 â€” Fortalecer Tenant Isolation

Verificar:

```text
tenant_id
â†“
query
â†“
mutation
â†“
optimistic update
â†“
RLS
```

Ninguna mutaciÃ³n local debe ejecutarse sin contexto tenant.

---

### Paso 4 â€” Continuar InvestigaciÃ³n Chrome Android

NO hacer mÃ¡s tuning fino.

Hacer pruebas binarias:

```text
RF14A
quitar logos / imÃ¡genes

RF14B
quitar SVGs

RF14C
header mÃ­nimo

RF14D
render-test page incremental
```

Objetivo:

```text
aislar trigger exacto
```

---

## 6. Restricciones Actuales de Desarrollo

NO tocar sin necesidad:

* mÃ©tricas;
* lÃ³gica de pedidos;
* ownership;
* Supabase schema;
* workflow machine;
* RLS;
* realtime base.

Priorizar:

```text
estabilidad
consistencia
convergencia
```

por encima de:

```text
micro mejoras visuales
```

---

## 7. DefiniciÃ³n de Done para Esta Fase

La fase se considera cerrada cuando:

* realtime converge entre tabs;
* realtime converge entre operadores;
* hydration deja de producir estados inconsistentes;
* mobile Android Chrome deja de corromper render;
* dashboard mantiene estabilidad en sesiones largas;
* renderer mobile queda desacoplado y robusto;
* tenant isolation queda validado extremo a extremo.
