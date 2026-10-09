# ADMIN-PRODUCTS-RLS-ROLE-ENFORCEMENT-1

# Result

**PASS WITH DB APPLY REQUIRED.**

The migration is authored and its contract is verified, but it has **not** been applied to
any database. `PROD-P1-2` is therefore `IMPLEMENTED / APPLY REQUIRED`, not CLOSED — the
hole is still open in the running project.

# Gap closed

`PROD-P1-2`: the mutative RLS on `public.products` and on the `product-images` bucket
checked **tenancy only**, never the caller's role. The application enforces
`manageProducts` (`lib/admin/permissions.ts`), but an authenticated `operator` or `viewer`
calling PostgREST or Storage directly bypassed that check and could insert, update or
delete products inside its own tenant. There was no cross-tenant exposure, and none is
introduced here.

Migration: `supabase/migrations/20260909040000_products_manage_role_rls.sql`.

Role model was proven from source, not assumed. `profiles.role` is a **text column with a
CHECK constraint** (`profiles_role_valid`, `20260516201000_s1_business_roles.sql`), not an
enum, with values `admin | owner | manager | operator | viewer | super_admin`.
`normalizeBusinessAdminRole()` folds `super_admin | admin | owner` into `owner`, so
`canManageProducts = owner || manager` resolves to the persisted set
`{owner, admin, manager, super_admin}`. The tenant-scoped SQL allow-list is
`('owner', 'admin', 'manager')`; `super_admin` keeps its pre-existing separate
cross-tenant branch.

No canonical DB role helper exists in the repo (the only functions are domain functions
such as `create_order`), so the predicate is kept local to each policy. No global RLS
refactor was opened.

# Policies changed

| resource | operation | old | new |
|---|---|---|---|
| `public.products` | INSERT | tenant `business_id` OR super_admin | (tenant **AND** role) OR super_admin |
| `public.products` | UPDATE | tenant `business_id` OR super_admin, USING + WITH CHECK | (tenant **AND** role) OR super_admin, USING + WITH CHECK |
| `public.products` | DELETE | tenant `business_id` OR super_admin | (tenant **AND** role) OR super_admin |
| `public.products` | SELECT (authenticated) | tenant OR super_admin | **UNCHANGED** |
| `public.products` | SELECT (anon catalog) | `is_available` + active business | **UNCHANGED** |
| `storage.objects` `product-images` | INSERT | tenant folder + path shape | tenant folder + path shape **AND** role |
| `storage.objects` `product-images` | UPDATE | tenant folder + path shape, USING + WITH CHECK | tenant folder + path shape **AND** role, USING + WITH CHECK |
| `storage.objects` `product-images` | SELECT (public read) | `bucket_id` only | **UNCHANGED** |
| `storage.objects` `product-images` | DELETE | no policy | **still no policy** (PROD-P3-15) |

Tenant and role are ANDed, never offered as alternatives. UPDATE keeps both USING (which
rows may be targeted) and WITH CHECK (the resulting row), so an authorized caller cannot
move a product into another tenant.

Storage deliberately has no `super_admin` branch: `super_admin` carries `business_id NULL`,
so it already fails the folder comparison today. That behaviour is preserved rather than
silently granted.

# Role matrix

| role | products mutate | image mutate |
|---|---|---|
| `owner` | ALLOW (own tenant) | ALLOW (own tenant folder) |
| `admin` (legacy, normalizes to owner) | ALLOW (own tenant) | ALLOW (own tenant folder) |
| `manager` | ALLOW (own tenant) | ALLOW (own tenant folder) |
| `operator` | **DENY** | **DENY** |
| `viewer` | **DENY** | **DENY** |
| `super_admin` | ALLOW (cross-tenant, pre-existing) | DENY (unchanged — no business folder) |
| foreign tenant | **DENY** | **DENY** |
| anonymous | **DENY** (no mutative policy exists; RLS enabled) | **DENY** |

Reads are untouched for every role. The finding was that operator/viewer can *mutate*, not
that they can *read*, and other subsystems depend on product reads.

# Verification

**targeted**: `lib/products/admin-products-rls-role-enforcement.verify.ts` — PASS. It
parses the migration with a paren-balanced statement/clause scanner and asserts tenant
scope, role gate, AND-binding, super_admin preservation, USING+WITH CHECK on both UPDATEs,
bucket and folder predicates on storage, that no SELECT policy is defined or dropped, that
the only DELETE policy is on `public.products`, that every dropped policy is recreated,
that no table/function/trigger/DML/grant appears, and that no out-of-scope table is
touched. The SQL allow-list is compared against `canManageProducts()` imported from
`lib/admin/permissions.ts`, so the two cannot drift.

The verify was mutation-tested to confirm it is not vacuous:

- adding `'operator'` to the products INSERT allow-list → FAILS
  (`SQL roles must match canManageProducts() exactly`)
- removing `WITH CHECK` from products UPDATE → FAILS
  (`must define WITH CHECK so business_id cannot be moved to another tenant`)

Both mutations were reverted and the restored migration passes.

Census of the final SQL: 5 `create policy` / 5 `drop policy`, 3 `USING`, 4 `WITH CHECK`,
7 role allow-lists, 4 `super_admin` branches, **0** occurrences of `'operator'` or
`'viewer'`.

**local DB matrix**: NOT RUN — SAFE LOCAL DB UNAVAILABLE. `.env.local` resolves to a
remote `*.supabase.co` project and the Docker daemon is not running, so no local stack
exists. Per the phase rules the remote project was not used as a substitute.

**diff**: `git diff --check` — PASS.

No `tsc` run: this phase touched only SQL and a new verify, no shared TypeScript.

# Remote DB

**NOT APPLIED.** No `supabase db push`, no remote SQL execution, no data touched. The
migration exists only as a file in `supabase/migrations/`.

# Boundaries

- runtime TSX/CSS: unchanged.
- `app/admin/(protected)/products/actions.ts`, `lib/admin/context.ts`,
  `lib/admin/permissions.ts`: unchanged. The app layer already enforces `manageProducts`
  correctly; this phase adds defense in depth in the DB, with no redundant app checks.
- trigger (`tr_auto_suspend_out_of_stock`), `create_order`, any other function: untouched.
- schema, tables, columns, FKs, data: untouched. Policies only.
- historical migrations: not modified.
- other tables (orders, categories, order_items, businesses, profiles): untouched.
  **SYSTEM-WIDE RLS HARDENING: FOLLOW-UP / OUT OF SCOPE** — the same tenant-only pattern
  exists elsewhere and needs its own phase.
- storage DELETE: not added. Image lifecycle is `PROD-P3-15`, a later phase.
- commit / push / deploy: none.

# Remaining P1

- `PROD-P1-2` — IMPLEMENTED / APPLY REQUIRED. Closed in code, still open in the database.
- `PROD-P1-4` — open. `tr_auto_suspend_out_of_stock` forces `is_available = false` at
  `stock <= 0` ignoring `track_stock`, so products created with the default `stock = 0`
  are born invisible.

# Gate

Met: migration exists; the role predicate matches the actually persisted role model
(proven from `profiles_role_valid`, not from the TS names); the tenant predicate remains
and is ANDed with the role; products INSERT/UPDATE/DELETE are role-gated; UPDATE has USING
+ WITH CHECK; storage INSERT/UPDATE are role-gated; public and authenticated read policies
are preserved; the targeted verify passes and is mutation-proven.

Not met: the migration has **not** been applied or validated on any database target.
Per the phase security rule, "migration authored" is not "security hole closed in
production", so `PROD-P1-2` is not claimed CLOSED.

# Next

`ADMIN-PRODUCTS-RLS-ROLE-ENFORCEMENT-DB-APPLY-1` — apply and validate the policy matrix on
the authorized target (owner/manager allowed, operator/viewer denied, foreign tenant
denied), then `ADMIN-PRODUCTS-STOCK-AVAILABILITY-CONTRACT-FIX-1` for `PROD-P1-4`.
