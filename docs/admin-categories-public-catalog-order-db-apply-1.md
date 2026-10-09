# ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-DB-APPLY-1

# Result

**PASS — CATEGORY ORDER DB LIVE / FINAL AUTHORITY MODEL + ATOMIC REORDER CERTIFIED / RUNTIME IMPLEMENTATION REQUIRED**

# Attempt History

| Attempt | Outcome |
|---------|---------|
| 1 | **BLOCKED CORRECTLY** — `CATEGORY_ORDER_DB_APPLY_POSITION_AUTHORITY_BYPASS` — remote delta 0 |
| 2 | **BLOCKED CORRECTLY** — `CATEGORY_ORDER_DB_APPLY_APPEND_LOCK_AUTHORITY_FAIL` — remote delta 0 |
| 3 (this) | **PASS** — final migration applied once via Supabase MCP `apply_migration` |

# Scope

FINAL LIVE DATABASE APPLY + DB CERTIFICATION for:

`supabase/migrations/20260917210150_categories_public_catalog_order.sql`

Frozen SHA256:

`47dd3e195d77385f0201490c57cd7b016fc373597435ddc94cb2567123d0f314`

No runtime feature implementation. No UI/CSS. No hotfix. No commit/push/deploy.

# Preflight

| Field | Value |
|-------|-------|
| branch | `main` |
| HEAD | `c9af635e27ad86e0731eea0a90b16b9b628d5aa6` |
| dirty | PRE-EXISTING Products package preserved (untouched for this APPLY) |

# Target Identity

| Field | Value |
|-------|-------|
| project | OrderOps |
| ref | `pkrsedmwxekbhlohhqds` |
| status | ACTIVE_HEALTHY |
| proofs | `get_project` + `list_projects` |
| MauroDev | NOT TOUCHED |

# Active Migration Chain

| Item | State |
|------|-------|
| FINAL `20260917210150_categories_public_catalog_order.sql` | **PRESENT** |
| historical `20260917182047_…` | **ABSENT** |
| historical `20260917202554_…` | **ABSENT** |
| active Category Order migrations | **1** |

# Final Migration SHA Pre

`47dd3e195d77385f0201490c57cd7b016fc373597435ddc94cb2567123d0f314` — **MATCH**

# Remote History Pre

Category-order migrations (historical #1/#2 + final): **0**

Latest prior remote: `20260916195024` / `products_removal_lifecycle`

# Live Schema Pre

| Item | Live |
|------|------|
| `categories.position` | integer **NULL**, no default |
| non-negative check | LIVE (`categories_position_non_negative`) |
| unique `(business_id, position)` | ABSENT |
| append function / trigger | ABSENT |
| `save_category_display_order` | ABSENT |
| authenticated UPDATE | table-wide YES (all columns) — old baseline |

# Category Census Pre

| Metric | Value |
|--------|-------|
| categories | 8 |
| businesses with categories | 3 |
| NULL position | 6 |
| non-null position | 2 |
| negative | 0 |
| duplicate non-null business+position | 0 |
| mixed NULL/non-null businesses | 1 |

# Backfill Ambiguity

`(business_id, position, name)` groups with count > 1: **0**

# Backfill Simulation

Hypothetical `row_number()-1` vs pre visible ID sequence: **delta = 0** for every business.

# Pre-Apply Category Snapshot

Captured all 8 rows (`id`, `business_id`, `name`, `position`, `created_at`) and per-business ID sequences under:

`position ASC NULLS LAST, name ASC, created_at ASC, id ASC`

| business_id | pre ID sequence |
|-------------|-----------------|
| `59db34de-…` | `[ebb67cfb-…]` |
| `a9b41e85-…` | `[b355e6a8-…, e1dd7af3-…]` |
| `e21b8fc2-…` | `[91580431-…, 8ed25e8b-…, 8767c61e-…, 3ffbf1a8-…, 3b514ac6-…]` |

# Position Authority Gate

Final SQL:

- revoke table UPDATE from `authenticated` / `anon`
- grant `UPDATE(name)` only to `authenticated`
- no `UPDATE(position|id|business_id|created_at)` for client roles

**PASS** — APPLY #1 bypass closed in authored SQL.

# Append Authority Gate

| Check | Result |
|-------|--------|
| SECURITY DEFINER | YES |
| search_path | `''` |
| auth.uid → profile → role → tenant | BEFORE lock |
| businesses FOR UPDATE | AFTER auth |
| max+1 + NEW.position override | YES |
| businesses RLS/grants in migration | **UNCHANGED** |

**PASS** — APPLY #2 lock authority closed.

# SECURITY DEFINER Owner

| Check | Result |
|-------|--------|
| expected owner | `postgres` |
| `rolbypassrls` | true |
| owns `public.businesses` | YES |
| SELECT+UPDATE on businesses | YES |

# Businesses Domain Freeze

Migration does **not** alter businesses RLS, policies, grants, or FORCE RLS.

Pre/post businesses policy names unchanged:

`businesses_insert_super_admin`, `businesses_select_active_public`, `businesses_select_own_business`, `businesses_update_own_business`

# Super Admin Semantics Gate

| Evidence | Finding |
|----------|---------|
| schema CHECK | allows `super_admin` with NULL **or** non-null `business_id` (no IS NULL force) |
| source invariant | `updateBusinessUserAction` always writes `business_id: null` when role=`super_admin`; create path cannot create `super_admin` |
| documented contract | Products RLS: “super_admin carries business_id NULL” |
| live census | **1** super_admin · `business_id` NULL · non-null **0** |
| Append | global for `role=super_admin` |
| Category RLS | global branch for `role=super_admin` |
| Reorder RPC | global when `super_admin` **AND** `business_id IS NULL` (matches valid contract) |

**PASS condition A** — valid global super_admin is contract/source-guaranteed `business_id IS NULL`; live complies; Append/RLS/RPC effective authority consistent for valid rows.

`apply allowed?:` **YES**

# Apply

| Field | Value |
|-------|-------|
| method | Supabase MCP `apply_migration` |
| target | `pkrsedmwxekbhlohhqds` |
| name | `categories_public_catalog_order` |
| result | **success** |
| remote history | `20260917212712` / `categories_public_catalog_order` |
| collateral migrations | **0** |
| historical #1/#2 remote | **0** |

# Remote Migration History

Exactly one Category Order row:

`version=20260917212712` · `name=categories_public_catalog_order`

# Final Migration SHA Post

`47dd3e195d77385f0201490c57cd7b016fc373597435ddc94cb2567123d0f314`

pre=post: **YES** (file not edited)

# Position Schema

| Item | Live |
|------|------|
| type | integer |
| NULL | **NOT NULL** |
| default | none |
| non-negative check | preserved |
| all rows non-null | YES |

# Category Backfill

| business | positions |
|----------|-----------|
| `59db34de-…` | `[0]` |
| `a9b41e85-…` | `[0,1]` |
| `e21b8fc2-…` | `[0,1,2,3,4]` |

Contiguous 0..N-1: **YES** · duplicates/gaps/negatives/nulls: **0**

# Visible Order Preservation

Pre ID sequence vs post (`position ASC, name ASC, created_at ASC, id ASC`): **delta = 0**

Identity fields preserved for all 8 pre-existing rows: `id`, `business_id`, `name`, `created_at`

Only intentional field delta: `position` normalization.

# Unique Constraint

`categories_business_id_position_key`

- UNIQUE `(business_id, position)`
- `condeferrable = true`
- `condeferred = false` → **DEFERRABLE INITIALLY IMMEDIATE**

# Append Function

Live `public.categories_assign_append_position()`:

- SECURITY DEFINER · owner `postgres` · `search_path=''`
- auth before businesses FOR UPDATE · max+1 · client position override

# Append Fingerprint

SHA256(`pg_get_functiondef`):

`7b240c4c66b10d8b97ac46dea4ceef57a3ab013c4975e47236af9b1395ab5514`

# Append Trigger

`tr_categories_assign_append_position` — BEFORE INSERT — FOR EACH ROW — ENABLED (`O`) — fn `categories_assign_append_position`

# Append ACL

`proacl`: `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}`

PUBLIC / anon: no EXECUTE grant (revoked in migration).

# Position Privileges

| Privilege | authenticated | anon |
|-----------|---------------|------|
| table UPDATE | **NO** | **NO** |
| UPDATE(name) | **YES** | NO |
| UPDATE(position) | **NO** | NO |
| UPDATE(business_id) | **NO** | NO |
| UPDATE(id) | **NO** | NO |
| UPDATE(created_at) | **NO** | NO |

# Category RLS

| Policy | State |
|--------|-------|
| SELECT own / public active | **PRESERVED** |
| INSERT | tenant + owner/admin/manager **OR** super_admin global |
| UPDATE | USING + WITH CHECK · same role set |
| DELETE | same role set |

# Reorder RPC

`public.save_category_display_order(uuid[])` RETURNS void

- SECURITY DEFINER · `search_path=''` · owner `postgres`
- no `p_business_id` · no client numeric positions
- exact set · business lock → category locks · WITH ORDINALITY rewrite

# RPC Fingerprint

SHA256(`pg_get_functiondef`):

`e82ba8ce34d263743aa7e2ad4ad09336a70ae5e592d0ed24bb12e68346cff8a3`

# RPC ACL

authenticated: EXECUTE · PUBLIC/anon: denied (live: anon EXECUTE denied at runtime)

# Old Runtime Create

Admin JWT + INSERT `(business_id, name)` only (no position):

**PASS** → assigned `position = max+1` (5 on 5-category tenant)

Proves DB-before-app Create compatibility + DEFINER lock path (APPLY #2 closed).

# Manager/Super Admin Create Evidence

| Role | Evidence |
|------|----------|
| manager | **NOT AVAILABLE** live (0 manager profiles) — contract/definition PASS |
| super_admin | **RUNTIME PASS** create on foreign business → append position |

# Rename Compatibility

Authenticated admin `UPDATE(name)` on disposable: **PASS** · position unchanged

Operator rename under RLS: **row_count 0** (DENY)

# Raw Position Denial

| Attempt (SET ROLE authenticated) | Result |
|----------------------------------|--------|
| `UPDATE position` | DENY (`permission denied for table categories`) |
| `UPDATE name, position` | DENY (whole statement) |
| `UPDATE business_id` | DENY |

BEBIDAS baseline position remained `0` after denial attempts.

# Insert Position Override

INSERT with `position=999` → trigger assigned `6` (max+1): **OVERRIDDEN**

# Public Read Compatibility

Public-visible sections (categories with available non-archived products), order by position:

business `e21b8fc2-…`: `[BEBIDAS, HAMBURGUESAS]` — relative order unchanged vs pre backfill sequence.

Zero-public-product categories remain omitted (6 empty/omitted).

# RPC No-Op

`save_category_display_order(current IDs)` as super_admin: **PASS** · persistent delta 0

# RPC Swap

Baseline `[A,B,C,D,E]` → `[B,A,C,D,E]`:

- success · B.position=0 · A.position=1 · contiguous · no unique failure
- restored via second RPC to baseline

# RPC Invalid Set

| Case | Result |
|------|--------|
| duplicate IDs | `CATEGORY_ORDER_INVALID_SET` |
| NULL id | `CATEGORY_ORDER_INVALID_SET` |
| missing member | `CATEGORY_ORDER_STALE_SET` |
| foreign substitute | `CATEGORY_ORDER_STALE_SET` |
| stale membership (after append) | `CATEGORY_ORDER_STALE_SET` |

Persistent position delta on rejects: **0** (after restore)

# Role Matrix — RPC

| Role | Result |
|------|--------|
| super_admin | ALLOW (noop + swap + restore) |
| admin | ALLOW via DEFINER auth (create/stale path exercised) |
| manager | definition-only (no live identity) |
| operator | `CATEGORY_ORDER_FORBIDDEN` |
| anon / cleared JWT | `CATEGORY_ORDER_UNAUTHORIZED` / EXECUTE deny |
| viewer | no live identity · RLS/RPC deny by role contract |

# Role Matrix — Raw Mutations

| Actor | INSERT | UPDATE(name) | DELETE empty |
|-------|--------|--------------|--------------|
| admin | PASS | PASS | PASS |
| super_admin | PASS | (via RLS allow) | — |
| operator | `CATEGORY_ORDER_APPEND_FORBIDDEN` | row_count 0 | — |
| foreign admin→other biz | `CATEGORY_ORDER_APPEND_FORBIDDEN` | — | — |
| anon | `CATEGORY_ORDER_APPEND_UNAUTHORIZED` | privilege DENY | — |

# Super Admin Reorder Evidence

RUNTIME: super_admin with NULL `business_id` reordered tenant derived from input IDs — **PASS**

# Concurrency Evidence

| Scenario | Evidence level |
|----------|----------------|
| create/create | **NOT RUN** (two-session) · LIVE LOCK CONTRACT PASS (shared businesses FOR UPDATE) |
| create/reorder | stale membership RUNTIME PASS + shared lock definitions |
| reorder/reorder | V1 documented: serialize on business lock; last valid writer wins; membership change → stale reject |

# Public/Admin Order Smoke

| Surface | pre→post |
|---------|----------|
| visible category ID sequence | delta **0** |
| public product-bearing sections | relative order preserved |
| product order within categories | unchanged (no product mutations) |
| admin loader order | same ID sequence; positions now normalized |

# QA Cleanup

Prefix `__QA_CATEGORY_ORDER_DB_APPLY__`:

- categories residue: **0**
- product / customization / upsell refs: **0**

# Final Position Reconciliation

All businesses contiguous 0..N-1 · nulls 0 · category count **8** · sequences restored to post-backfill baseline.

# Intended Persistent Delta

| Layer | Delta |
|-------|-------|
| DATA | existing `categories.position` normalized to contiguous 0..N-1 |
| SCHEMA | `position NOT NULL` |
| CONSTRAINT | unique DEFERRABLE `(business_id, position)` |
| FUNCTION | `categories_assign_append_position` LIVE |
| TRIGGER | append BEFORE INSERT LIVE |
| RPC | `save_category_display_order` LIVE |
| RLS | category mutative manageProducts role-hardened |
| PRIVILEGES | authenticated UPDATE(name) only |
| HISTORY | one remote migration row |

# Collateral Safety

| Entity | pre | post |
|--------|-----|------|
| categories count | 8 | 8 |
| products | 10 | 10 |
| orders | 77 | 77 |
| order_items | 160 | 160 |
| stock_movements | 60 | 60 |
| customization_groups | 4 | 4 |
| upsell_groups | 3 | 3 |
| Storage | unchanged (no Storage ops) |

# Runtime Delta

**0** — no Category-order UI, DnD, server action, loader rewrite, CSS, or generated types edits in this phase.

# Verification

| Check | Result |
|-------|--------|
| focused `admin-categories-public-catalog-order-db-author.verify.ts` | **PASS** |
| related | producer still name-only / manageProducts contract preserved (source census) |
| `npx tsc --noEmit` | **PASS** |
| `git diff --check` | **PASS** (CRLF warnings only) |

# Remaining Runtime Work

ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-IMPLEMENTATION-1:

- Category filter / order UI
- `saveCategoryDisplayOrderAction`
- optional loader/types reconciliation

# Next

**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-IMPLEMENTATION-1**

# Release

COMMIT/PUSH/DEPLOY: **PAUSED**
