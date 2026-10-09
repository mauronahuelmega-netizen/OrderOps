# ADMIN-PRODUCTS-RLS-ROLE-ENFORCEMENT-DB-APPLY-1

# Result

**PASS.** `PROD-P1-2` is **CLOSED** — role enforcement is applied and proven on the live
database, not just authored locally.

# Target

- project ref: `pkrsedmwxekbhlohhqds` — name `OrderOps`, `ACTIVE_HEALTHY`, us-east-1.
- identity proof: `.env.local` resolves to `https://pkrsedmwxekbhlohhqds.supabase.co`, and
  `get_project_url` for that ref returns the same URL. The account holds a second project
  (`pztxfgyicuilfrgoxnhp` / `MauroDev`, INACTIVE) which was **not** touched; every call
  passed the ref explicitly. The Supabase CLI has no linked target in this workspace
  (`supabase/.temp/project-ref` absent; `config.toml project_id = "OrderOps"` is a local
  stack name, not a remote ref), so there was no conflicting target to reconcile.
- migration: `supabase/migrations/20260909040000_products_manage_role_rls.sql`
  (SHA256 `A4225056…3516321`, unchanged before and after apply).

# Apply

- status: applied once, as a single migration. No batch.
- mechanism: the Supabase migration API (`apply_migration`), which executes only the SQL
  passed to it and records it in remote migration history. `supabase db push` was
  **rejected as unsafe**: remote history contains only 7 entries while the repo holds ~30+
  local migration files, so a push would have attempted a large collateral batch — exactly
  the STOP condition. This was not a silent manual-SQL workaround; history is recorded.
- migration history: remote now records
  `20260909070121_products_manage_role_rls`.
  The name matches the local file; the version timestamp is **assigned by the apply tool at
  execution time**, which is the repo's pre-existing pattern — all 7 prior remote entries
  differ in timestamp from their local filenames (e.g. local
  `20260717170000_product_customization_public_rls_hardening_1` → remote
  `20260717162941_…`). Name-level parity, not version parity.
- pre-existing divergence between local and remote migration history was left untouched.
  **No collateral synchronization.**

# Policy introspection

Pre-apply snapshot (rollback evidence): all 8 relevant policies had
`has_manage_allowlist = false`. Products mutative policies carried only the `super_admin`
branch; the two storage mutative policies carried **no role predicate at all**.

Post-apply, from `pg_policies`:

| target | policy | cmd | roles | USING | WITH CHECK | role-gated | tenant | op/viewer |
|---|---|---|---|---|---|---|---|---|
| `public.products` | `products_insert_own_business` | INSERT | authenticated | — | yes | **yes** | yes | no |
| `public.products` | `products_update_own_business` | UPDATE | authenticated | **yes** | **yes** | **yes** | yes | no |
| `public.products` | `products_delete_own_business` | DELETE | authenticated | yes | — | **yes** | yes | no |
| `public.products` | `products_select_own_business` | SELECT | authenticated | yes | — | no | yes | no |
| `public.products` | `products_select_available_public` | SELECT | anon | yes | — | no | yes | no |
| `storage.objects` | `product_images_insert_own_business` | INSERT | authenticated | — | yes | **yes** | folder | no |
| `storage.objects` | `product_images_update_own_business` | UPDATE | authenticated | **yes** | **yes** | **yes** | folder | no |
| `storage.objects` | `product_images_public_read` | SELECT | public | yes | — | no | — | no |

`'operator'` and `'viewer'` appear in **zero** mutative allow-lists. Both reads are
unchanged. No `product_images_*` DELETE policy exists (count 0) — still deferred to
`PROD-P3-15`.

# Role matrix

Executed as `current_user = authenticated` with `request.jwt.claims.sub` set to real
profile ids, inside `BEGIN … ROLLBACK`. **Not** service_role, which would bypass RLS
entirely and prove nothing. Roles without a real principal (`owner`, `manager`, `viewer`)
were exercised by toggling the existing test profile's role inside the same rolled-back
transaction — no permanent profile, role or auth user change.

Before → after, own tenant:

| principal | products (before) | products (after) | storage (before) | storage (after) |
|---|---|---|---|---|
| `owner` | ALLOW | ALLOW | ALLOW | ALLOW |
| `admin` | ALLOW | ALLOW | ALLOW | ALLOW |
| `manager` | ALLOW | ALLOW | ALLOW | ALLOW |
| `operator` | **ALLOW (vulnerable)** | **DENY** | **ALLOW (vulnerable)** | **DENY** |
| `viewer` | **ALLOW (vulnerable)** | **DENY** | **ALLOW (vulnerable)** | **DENY** |
| foreign tenant | DENY | DENY | DENY | DENY |
| anonymous | DENY | DENY | — | — |
| `super_admin` | ALLOW | ALLOW (preserved) | — | — |

ALLOW/DENY covers UPDATE, INSERT and DELETE individually; operator and viewer were denied
on all three after apply (`0 rows` for UPDATE/DELETE, `new row violates row-level security
policy` for INSERT). The pre-apply run is the proof the vulnerability was real and
exploitable, not theoretical.

Reads confirmed still open after apply: `operator` and `viewer` both see all 18 products
of their tenant, and `anon` still sees the 4 available products through the public catalog
policy.

# Persistent data mutations

0.

Verified after the fact: test profile role back to `operator`; profiles 5; auth users 5;
`RLS-PROBE` rows left 0; probe storage objects left 0; `product-images` objects 48;
businesses 4; the target product still present. The only persistent changes are **policy
definitions + one migration history row**.

# Remaining security debt

**SYSTEM-WIDE RLS HARDENING: STILL FOLLOW-UP / OUT OF SCOPE.** `orders`, `order_items`,
`categories`, `businesses`, `profiles` and other storage policies still follow the
tenant-only pattern and were deliberately not touched.

# Remaining Products P1

`PROD-P1-4` — `tr_auto_suspend_out_of_stock` forces `is_available = false` at `stock <= 0`
ignoring `track_stock`, so products created with the default `stock = 0` are born
invisible.

# Gate

All conditions met: remote target identity proven; only migration
`products_manage_role_rls` applied; remote history records it; products
INSERT/UPDATE/DELETE role-gated; UPDATE has USING + WITH CHECK; tenant isolation intact;
authenticated and public SELECT unchanged; storage INSERT/UPDATE role-gated; storage public
read intact; storage DELETE still absent; operator/viewer denied; owner/manager/admin
allowed; foreign tenant denied; anonymous mutation denied; super_admin preserved; no
permanent QA data mutation; migration file unmodified after apply (hash match); targeted
verify green.
