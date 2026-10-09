# Products Living Audit

## 1. Status

```txt
Status:            ACTIVE LIVING SOURCE OF TRUTH
Last verified:     2026-09-19 — ADMIN-PRODUCTS-FILTER-MENU-HARD-VISUAL-CLOSEOUT-1
                   (Category Order V1: Runtime IMPLEMENTED; Pre-Final visual polish PASS;
                    Motion + Filter Unity PASS / PARTIALLY SUPERSEDED;
                    Filter handoff + Category compact unity PASS;
                    Filter menu hard visual closeout PASS — trailing action clear,
                    rhythm/edge polished, handoff 6/6 certified;
                    Category = compact menu + separated Ordenar categorías;
                    Order = dedicated order-only dialog; Grip/drag REMOVED;
                    Subir/Bajar canonical + reflow PRESERVED;
                    single toolbar openFilter / one-tap handoff;
                    Filter URL/server semantics UNCHANGED; Real Save/restore PENDING FINAL-QA-1;
                    Package LOCAL / UNDEPLOYED)
Verified commit:   c9af635e27ad86e0731eea0a90b16b9b628d5aa6
                   (+ local undeployed Products package; release PAUSED)
Route:             /admin/products
Primary permission: manageProducts (owner | manager)

Image optimizer selection:
CLOSED — ADMIN-PRODUCTS-CLIENT-IMAGE-OPTIMIZATION-800-FIRST-SELECTION-1

Mobile main surface:
CLOSED — ADMIN-PRODUCTS-MOBILE-MAIN-SURFACE-HARD-VISUAL-POLISH-1

Create mobile viewport / footer occlusion:
CLOSED — ADMIN-PRODUCTS-CREATE-MOBILE-VIEWPORT-VISUAL-POLISH-1

Create stock default / UX contract:
CLOSED — ADMIN-PRODUCTS-CREATE-STOCK-DEFAULT-UX-CONTRACT-1

Create mobile final visual QA:
CLOSED / FROZEN — ADMIN-PRODUCTS-CREATE-MOBILE-FINAL-VISUAL-QA-1
  bottom-gap: ARTIFICIAL spacer removed (128px → 36px)

Create mobile sticky footer END state:
CLOSED — ADMIN-PRODUCTS-CREATE-MOBILE-STICKY-FOOTER-END-STATE-POLISH-1
  CASE B: `.createForm.shell` trailing padding-bottom 0.875rem only visible at END

Create required-field affordance:
CLOSED — ADMIN-PRODUCTS-CREATE-REQUIRED-FIELD-AFFORDANCE-1
  Convention: * = required; native `required` = authority
  Create required marker set: Nombre · Categoría · Precio · Stock inicial
  Legend: * Campos obligatorios

Create required-marker spacing polish:
CLOSED — ADMIN-PRODUCTS-CREATE-REQUIRED-MARKER-SPACING-POLISH-1
  Root: `.admin-field span { margin: 0 }` zeroed Categoría mark margin
  Owner: `.fieldLabelInline` inline-flex + column-gap 0.15em
  Create mobile: FINAL CLOSED / FROZEN
  Create owner polish: COMPLETE
  Remaining Create release-blocking debt: NONE

Edit base-form dirty / unsaved-changes:
CLOSED — ADMIN-PRODUCTS-EDIT-DIRTY-STATE-UX-CONTRACT-1
  pristine: Save disabled
  dirty+valid: Save enabled
  change→revert: pristine
  dirty close: discard confirmation
  discard: local only / no mutation
  image staged KEEP/REMOVE/REPLACE in snapshot
  customization overrides: outside base dirty transaction
    ← HISTORICAL (superseded by UNIFIED-DRAFT-SAVE-IMPLEMENTATION-1 / FINAL-QA-1):
      CURRENT dirty = UNIFIED (base + image + groups + options)
  PROD-P3-18: CLOSED

Edit simple mobile visual / UX parity:
CLOSED — ADMIN-PRODUCTS-EDIT-SIMPLE-MOBILE-VISUAL-UX-PARITY-1
  required affordance: parity with Create
  Edit required: Nombre · Categoría · Precio · Stock actual
    ← HISTORICAL (superseded by UNIFIED-DRAFT-SAVE-IMPLEMENTATION-1 / FINAL-QA-1):
      CURRENT Edit category = READ-ONLY persisted context (not required / not editable);
      Create Categoría remains editable + required
  operational toggles: compact / Activo-Inactivo removed
  footer: mobile full-bleed + CTA inset/full-width
  dirty state: FROZEN / PRESERVED
  customization internals: UNCHANGED / NEXT
  product removal: SEPARATE DECISION PHASE
  NOTE: historically PASS; residual header-seam remnant closed by next phase

Edit sticky footer release-state polish:
CLOSED / FROZEN — ADMIN-PRODUCTS-EDIT-STICKY-FOOTER-RELEASE-STATE-POLISH-1
  CASE A: exiting sticky CTA clipped at `.body` top under header seam
  Fix: Edit-only `.headerReleaseClip::after` 32px lip + `.bodyReleaseClip` pad
  Create flyout header: unchanged
  EDIT BASE FORM: FINAL CLOSED / FROZEN

Edit customization overrides mobile density:
CLOSED / FROZEN — ADMIN-PRODUCTS-EDIT-CUSTOMIZATION-OVERRIDES-MOBILE-DENSITY-POLISH-1
  (historical density baseline; presentation superseded by accordion)

Edit customization progressive disclosure accordion:
CLOSED / FROZEN — ADMIN-PRODUCTS-EDIT-CUSTOMIZATION-PROGRESSIVE-DISCLOSURE-ACCORDION-1
  Presentation: PROGRESSIVE DISCLOSURE (PRESERVED)
  Top-level: Avanzado collapsed by default
  Active exceptions: discoverable while closed when >0
  Groups: accordion · ONE AT A TIME · initially all closed
  Options: nested under parent group
  Visibility: Eye / EyeOff visual
  CURRENT RUNTIME persistence: LOCAL DRAFT ONLY inside Edit (`mode="draft"`)
  Builder / immediate actions: PRESERVED on customization builder surface
  Flat Secciones/Opciones: SUPERSEDED

Edit Advanced visual hierarchy:
**OWNER HARD-QA FIX PASS** — ADMIN-PRODUCTS-EDIT-ADVANCED-VISUAL-HIERARCHY-HARD-QA-FIX-1
  Predecessor polish: ADMIN-PRODUCTS-EDIT-ADVANCED-VISUAL-HIERARCHY-POLISH-1 (implementation PASS / owner follow-up)
  Functional unified draft: UNCHANGED / CERTIFIED (FINAL-QA-1)
  Hierarchy: 3 LEVELS — Advanced > Group > Option
  Group: SINGLE CARD OWNER
  Options: FLAT NESTED LIST + real inset (~16px measured)
  Parent hidden: CHILD CONTROLS DISABLED; child draft PRESERVED; no cascade
  Explicit child override chip retained under hidden parent
  Exception count: explicit overrides only (no descendant inflation)
  Visibility: ghost Eye/EyeOff + `Oculta` chip
  Sticky: WHOLE EDITOR
  Mobile live QA: 360/390/412 PASS
  Builder: unchanged (immediate mode)
  Create: unchanged
  Business mutations: 0

Edit Advanced loading + footer rhythm:
**PASS** — ADMIN-PRODUCTS-EDIT-ADVANCED-LOADING-STATE-FOOTER-RHYTHM-POLISH-1
  Advanced loading: stable disabled shell (`Avanzado…`) from first paint; no detached visible loading copy
  Advanced ready: same geometry (measured dx=dy=dw=dh=0 @ 412)
  Footer rhythm: redundant Edit `4.75rem` predecessor pad → `1.5rem`; short-content empty band = intentional flexible viewport space (NOT unresolved spacer debt)
  Sticky ownership / hierarchy / unified draft: UNCHANGED
  Business mutations: 0

Edit Advanced premium visual closeout:
**FINAL VISUAL CLOSED / FROZEN** — ADMIN-PRODUCTS-EDIT-ADVANCED-PREMIUM-VISUAL-CLOSEOUT-1
  Expanded group: continuous header surface incl. Eye (no white cell / seam)
  Action hierarchy: enabled vs disabled Eye clear; disabled still legible
  Metadata / helper / price / status: contrast audited AA
  Empty-valid: stable `Avanzado` + `Sin ajustes` shell (loading→empty 0 shift)
  Long content 360: overflow-x 0
  Loading / footer / unified draft / parent-hidden: UNCHANGED
  Remaining Advanced visual debt: NONE
  Shared disabled primary CTA: optional design-system follow-up (non-blocking)
  Business mutations: 0

Edit Advanced accordion motion polish:
**MOTION-ONLY FREEZE EXCEPTION — PASS** — ADMIN-PRODUCTS-EDIT-ADVANCED-ACCORDION-MOTION-POLISH-1
  Advanced/group disclosure: CSS grid 0fr↔1fr + subtle opacity/translate (≤240ms)
  Static premium-closeout baseline: UNCHANGED at rest
  Reduced-motion: instant; closed content `inert` (not actionable)
  Draft / dirty / save / loading / empty / sticky / builder: UNCHANGED
  Business mutations: 0
  Advanced returns to: FINAL CLOSED / FROZEN (STATIC + MOTION)

Product removal contract:
**HISTORICAL PASS / SUPERSEDED** — ADMIN-PRODUCTS-PRODUCT-REMOVAL-CONTRACT-DECISION-1
  Original selection: SOFT ARCHIVE + RESTORE (hard delete deferred)
  Forensic evidence: PRESERVED
  Superseded by owner clarification before runtime/DB apply

Product removal archive DB author:
**HISTORICAL TECHNICAL PASS / SUPERSEDED BEFORE APPLY** — ADMIN-PRODUCTS-PRODUCT-REMOVAL-ARCHIVE-DB-AUTHOR-1
  File: `20260916180000_products_archive_lifecycle.sql` (**removed locally**)
  SHA256: `55f187f5b4362723ba1e4e3659a90769cc75d57ea61b615f79d2505e89db88bb`
  Remote applied: NO (`archived_at` absent; history count 0)
  Safe to apply standalone: **NO**

Product removal contract correction:
**PASS — CORRECTED TARGET** — ADMIN-PRODUCTS-PRODUCT-REMOVAL-CONTRACT-CORRECTION-1
  V1: ARCHIVE + RESTORE + PERMANENT DELETE

Product removal lifecycle DB author:
**PASS — AUTHORED** — ADMIN-PRODUCTS-PRODUCT-REMOVAL-LIFECYCLE-DB-AUTHOR-1
  Final migration: `20260916180000_products_removal_lifecycle.sql`
  SHA256: `5f19d2697f79d2bf17a3388d619a42bc31e32690313362a1cf26400c32628d57`

Product removal lifecycle DB apply:
**PASS — LIVE / VALIDATED** — ADMIN-PRODUCTS-PRODUCT-REMOVAL-LIFECYCLE-DB-APPLY-1
  Remote history: `20260916195024_products_removal_lifecycle`
  RPC: `public.delete_product_permanently(uuid)` · SECURITY DEFINER · LIVE
  DB authority: **LIVE / VALIDATED / UNCHANGED**

Product removal lifecycle application:
**PASS — IMPLEMENTED IN LOCAL SOURCE / UNDEPLOYED** — ADMIN-PRODUCTS-PRODUCT-REMOVAL-LIFECYCLE-IMPLEMENTATION-1
  Archive UI: **IMPLEMENTED**
  Restore UI: **IMPLEMENTED**
  Permanent Delete UI: **IMPLEMENTED**
  Server actions: **IMPLEMENTED** (`archiveProductAction` / `restoreProductAction` / `deleteProductPermanentlyAction`)
  Application archived filtering: **IMPLEMENTED** (default + status matrix)
  Catalog existence includes archived: **IMPLEMENTED**
  Archived read-only (UI + action guards): **IMPLEMENTED**
  Storage post-delete cleanup: **IMPLEMENTED** (post-RPC; shared-ref includes archived)
  Pre-Final-QA visual/copy polish: **PASS** — one-row Archivar/Eliminar (+ Lucide); Restaurar/Eliminar; simplified confirms; Archive neutral vs Delete destructive; redundant lifecycle top divider removed; functional contract unchanged
  Final QA: **PASS — CERTIFIED END-TO-END** — ADMIN-PRODUCTS-PRODUCT-REMOVAL-LIFECYCLE-FINAL-QA-1
  CONTRACT: **CLOSED** · DB: **LIVE / VALIDATED** · APPLICATION: **IMPLEMENTED / CERTIFIED** · VISUAL: **FINAL**
  Archive / Restore / Permanent Delete: **CLOSED**
  Remaining lifecycle release-blocking debt: **NONE**
  Package state: **LOCAL / UNDEPLOYED**
  Category order V1: **CONTRACT APPROVED** · **DB LIVE / CERTIFIED**
  Final migration: `20260917210150…` SHA `47dd3e195…` · remote `20260917212712`
  Historical #1/#2: **SUPERSEDED BEFORE APPLY / remote 0**
  position: **NOT NULL / CONTIGUOUS** · visible order **UNCHANGED**
  append: **LIVE / DEFINER / AUTH-BEFORE-LOCK** · businesses authority **UNCHANGED**
  position client bypass: **DENIED** · RPC: **LIVE / ATOMIC / VALIDATED**
  super_admin semantics: **PROVEN** · Category RLS manageProducts: **LIVE**
  Runtime UI: **IMPLEMENTED IN LOCAL SOURCE / FINAL QA REQUIRED**
  Next: **ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-FINAL-QA-1**
  Production runtime deployed: **NO**

Unified Edit draft save contract:
**CERTIFIED END-TO-END** — ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-FINAL-QA-1
  (runtime: ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-IMPLEMENTATION-1)
  CURRENT APPLICATION RUNTIME: UNIFIED / CERTIFIED
  RPC: public.save_product_edit_draft · SECURITY INVOKER · LIVE / VALIDATED
  Atomic product + customization reconciliation: LIVE VALIDATED (RPC)
  Application persistence: ONE EDITOR = ONE DRAFT = ONE SAVE (`saveProductEditDraftAction`)
  Real Save + reopen + restore on disposable QA fixture: PASS / net delta 0
  Legacy true override blocker: RESOLVED / 0
  Migration history: RECONCILED (20260915215741_products_edit_unified_draft_save_rpc)
  Migration SHA256: 42b2e206635d0fe3a13ffff7972e8149ae86c909829641a30ca001e500a16631
  Function fingerprint: 6d31d3050a938022242eae9348c52697c46b8528b4f7b3afd08f5f3ff422079a
  Category Edit: READ-ONLY PERSISTED CONTEXT (Create editable unchanged)
  Eye local draft: IMPLEMENTED (Edit); pre-Save writes 0
  Immediate Edit override writes: REMOVED
  Dirty: UNIFIED (base + image + group + option)
  Sticky: WHOLE EDITOR (spans Advanced); release-lip Edit wiring SUPERSEDED
  Accordion: PRESERVED
  Create / Builder / collection availability toggle: UNCHANGED
  Historical DB-APPLY BLOCK (legacy true row): preserved in db-apply-1.md Initial Result
  Cleanup: ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-LEGACY-OVERRIDE-CLEANUP-1 PASS



Current debt:
P0: 0
P1: 0
Release-blocking P2: 0
Accepted infra / QA debt: see §32 Remaining + Final QA doc
```

**Create mobile:** FINAL CLOSED / FROZEN.
**Edit dirty-state:** CLOSED (historical; now UNIFIED dirty in implementation).
**Edit simple mobile visual parity:** CLOSED (historical PASS; category Edit read-only reconciled).
**Edit sticky footer release-state:** CLOSED (historical PASS; supersession implemented — sticky spans Advanced).
**Customization mobile density:** CLOSED / FROZEN (historical).
**Customization progressive disclosure:** CLOSED / FROZEN (presentation preserved).
**Unified draft:** **CERTIFIED END-TO-END** (IMPLEMENTATION + FINAL-QA).
**DB RPC:** LIVE / VALIDATED.
**Legacy true overrides:** 0.
Product Removal Lifecycle V1: **CERTIFIED / CLOSED**.
DB: **LIVE / VALIDATED** · Application: **IMPLEMENTED / CERTIFIED** · Visual: **FINAL**
Archive / Restore / Permanent Delete: **CLOSED**
Remaining lifecycle release-blocking debt: **NONE**
Package: **LOCAL / UNDEPLOYED**
Category order V1: **CONTRACT APPROVED** · **DB LIVE / CERTIFIED** (`20260917210150…` / remote `20260917212712`) · Runtime **IMPLEMENTED / FINAL QA REQUIRED**.
Next: **ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-FINAL-QA-1**
`ADMIN-PRODUCTS-COMMIT-PUSH-DEPLOY-1` remains **PAUSED**.

HISTORICAL — SUPERSEDED BY IMPLEMENTATION-1 + FINAL-QA-1:
> Product removal capability: DB LIVE / VALIDATED / RUNTIME ABSENT (implementation not started).

Historical note (2026-09-08 audit entry): debt counts then differed from the entry
expectation (`P1:1 P2:8 P3:11`) because the living audit added server-action / loader /
RLS / trigger / storage layers. Those original OPEN P1/P2/P3 rows are preserved below;
statuses were reconciled by certified phases + Final QA — **do not erase historical
evidence**.

Evidence legend used throughout:

| Marker | Meaning |
|--------|---------|
| `SOURCE` | Proven by reading repository source or applied migrations |
| `RUNTIME` | Proven by authenticated local runtime observation at the verified commit |
| `DB` | Proven by read-only query against the live Postgres schema/data |
| `INFERRED` | Derived from the above, not directly observed |
| `UNKNOWN` | Needs follow-up |

## 2. Purpose

Products is the tenant's **catalog authoring and operational availability surface**. It
owns the lifecycle of `public.products` rows for one `business_id`: creation, editing,
pricing, categorisation, imagery, stock quantity, stock-tracking opt-in, public
availability (`is_available`), and **product removal lifecycle** (`archived_at` Archive /
Restore + Permanent Delete via domain RPC).

It is the **only** admin surface that writes `public.products`. Everything the public
catalog renders as a purchasable item originates here.

It is **not** the owner of: customization groups/options/upsells (separate subsystem,
linked from the header), categories CRUD (separate route; Products *creates* categories
inline on **Create only**, *reads* persisted category on **Edit** as read-only context —
no Edit category reassignment; **Move Category** deferred), or order-time stock
consumption (owned by the `create_order` RPC).

## 3. Scope

| In scope | Out of scope |
|----------|--------------|
| `/admin/products` route, layout, permission | `/admin/products/customizations` internals |
| `components/admin/products/**` | `/admin/products/preview` internals |
| `app/admin/(protected)/products/actions.ts` | `/admin/categories` CRUD internals |
| `lib/products/admin.ts` | Public catalog rendering/UX |
| Products-relevant `public.products` schema, RLS, triggers | `create_order` order flow beyond its stock contract |
| `product-images` storage bucket contract | Shared admin shell chrome |
| Public catalog **invalidation boundary** | Orders, Team, Settings |

## 4. Route / Auth / Permissions

```txt
route:            /admin/products
segment:          app/admin/(protected)/products/page.tsx
layout:           app/admin/(protected)/layout.tsx  → AdminShell + AdminToastProvider
gate:             requireAdminPermission("manageProducts")   [SOURCE]
```

### Resolution chain

```
page.tsx
  └─ requireAdminPermission("manageProducts")        lib/admin/context.ts
       └─ requireAdminContext()
            └─ getAdminContext()                     React.cache, per-request
                 ├─ supabase.auth.getUser()
                 └─ profiles.select(business_id, role, businesses(slug)).eq(id, user.id)
```

| Question | Answer | Evidence |
|----------|--------|----------|
| `business_id` source | The authenticated user's own `profiles` row | SOURCE |
| Does any code path accept a client-supplied tenant id? | **No.** `businessId` is always read from `getAdminContext()` server-side | SOURCE |
| Unauthenticated | `redirect("/admin/login")` | SOURCE + RUNTIME (307) |
| Authenticated, no `business_id` | `redirect("/admin/login")` | SOURCE |
| Unauthorized role (`operator`, `viewer`) | `redirect("/admin/dashboard")` | SOURCE |
| Permission rechecked on mutations | **Yes** — every action calls `requireAdminPermission("manageProducts")` before touching Supabase | SOURCE |

### Role matrix

`canManageProducts = isOwner(role) || isManager(role)` — `lib/admin/permissions.ts`.
`super_admin`, `admin`, `owner` all normalise to `owner`.

| Role | Products access |
|------|-----------------|
| owner / admin / super_admin | Full |
| manager | Full |
| operator | Denied (redirect to dashboard) |
| viewer | Denied (redirect to dashboard) |

### Security invariant status

**NEVER TRUST CLIENT-SUPPLIED TENANT ID — upheld at the application layer.**

**CURRENT:** Products manage-role RLS is **LIVE / VALIDATED** (`PROD-P1-2` **CLOSED** —
owner/admin/manager mutate; operator/viewer denied at PostgREST/Storage; raw authenticated
`products` DELETE **denied**; Permanent Delete only via `delete_product_permanently` RPC).
See §27 CURRENT vs HISTORICAL.

## 5. Ownership Map

```
app/admin/(protected)/products/page.tsx                     server page, auth, dual query
├── ProductsManagementProvider                              client state root
├── AdminPageLayout / AdminPageHeader                       shared admin chrome
├── ProductsHeaderActions                                   4 header actions + clipboard
├── DashboardShell                                          toolbar / content / flyout slots
│   ├── ProductsToolbar                                     search + 3 filters + clear
│   ├── <Suspense key={catalogKey}> ProductCatalogSkeleton  per-filter fallback
│   │   └── ProductCatalogSection                           server, real paged query
│   │       ├── ProductCatalogEmptyState                    when 0 rows returned
│   │       └── ProductCatalogViews                         SINGLE ACTIVE TREE
│   │           ├── ≥900 → ProductTableView                 + ProductAvailabilityToggle
│   │           │                                           + ProductPagination
│   │           └── <900 → ProductGridServer
│   │                        └── ProductCard                div[role=button]
│   └── FlyoutPanel                                         role=dialog, dynamic imports
│       ├── CreateProductForm       (ssr:false)
│       ├── EditProductForm         (ssr:false)
│       │   └── ProductCustomizationOverridesPanel          customization boundary
│       ├── CreateCategoryForm      (ssr:false)
│       └── ProductFormSkeleton
└── ImageCropModal                                          mounted by both forms
```

### Server / lib owners

| File | Role |
|------|------|
| `app/admin/(protected)/products/actions.ts` | Products server actions incl. **`saveProductEditDraftAction`** (normal Edit writer → `public.save_product_edit_draft`); `updateProductAction` **LEGACY** (not normal Edit) |
| `lib/products/admin.ts` | `getAdminProducts`, `getAdminProductById`, page-size, **and `getManualOrderProductOptions` (Orders consumer — shared file)** |
| `lib/categories/admin.ts` | `getAdminCategories` |
| `lib/admin/context.ts` | Tenant + permission resolution |
| `lib/admin/permissions.ts` | `manageProducts` definition |
| `lib/admin/action-errors.ts` | Shared action error mapping (see `PROD-P2-9`) |
| `lib/catalog/public-cache-tags.ts` | Public catalog invalidation |
| `lib/supabase/image-loader.ts` | Custom `next/image` loader (shared with public catalog) |
| `lib/admin/catalog-preview-shared.ts` | Public/preview path builders |
| `hooks/use-scroll-lock.ts` | Flyout body scroll lock (global hooks folder, not co-located) |

## 6. Data Model

`public.products` — verified against the live schema [DB].

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `business_id` | uuid | NO | — | Tenant key. Indexed |
| `category_id` | uuid | NO | — | **NOT NULL** → uncategorized products are impossible. Indexed. FK `ON DELETE RESTRICT` |
| `name` | text | NO | — | |
| `description` | text | YES | — | |
| `price` | numeric | NO | — | |
| `image_url` | text | YES | — | Absolute Supabase public URL |
| `is_available` | boolean | NO | `true` | Merchandising / public selling (orthogonal to archive) |
| `created_at` | timestamptz | NO | `timezone('utc', now())` | Sole ordering key |
| `sku` | text | YES | — | Unique per business when non-null (**LIVE**) |
| `stock` | integer | NO | `0` | |
| `track_stock` | boolean | NO | `false` | Opt-in to order-time decrement |
| `archived_at` | timestamptz | YES | — | **LIVE** — NULL = active lifecycle; non-null = archived (reversible). CHECK forces unavailable when archived |

**CURRENT (post LIFECYCLE-DB-APPLY / IMPLEMENTATION):** soft-archive via `archived_at` is LIVE. Hard delete is via RPC `delete_product_permanently` only (raw authenticated DELETE **denied**). Historical forensic note below about “absent archived_at” is superseded for current state.

**CURRENT Permanent Delete history contract:** orders + order_items preserved; commercial snapshots unchanged; `order_items.product_id` SET NULL. Deep evidence: DB-APPLY + FINAL-QA docs.

### Indexes [DB]

`products_pkey (id)`, `products_business_id_idx`, `products_category_id_idx`, plus active-list partial index `products_business_created_at_active_idx` (`WHERE archived_at IS NULL`). SKU unique integrity LIVE (prior phase).

### Triggers

`tr_auto_suspend_out_of_stock` — `BEFORE INSERT OR UPDATE OF stock ON public.products`,
sets `NEW.is_available := false` whenever `NEW.stock <= 0`. **Applies to every product
regardless of `track_stock`** (it predates the flag). See §15/§16 — this is the root of
`PROD-P1-4`.

### TypeScript projection — `lib/products/admin-product-types.ts` (+ server `admin.ts`)

```ts
AdminProductListItem = { id, name, price, category_id, image_url, is_available, sku, stock, track_stock, archived_at }
AdminProduct        = AdminProductListItem & { description, created_at, categories: { name } | null }
```

The list view includes `track_stock` + `archived_at`. Exact-id detail allows archived rows. Default collection excludes archived.

## 7. Data Loading

The page issues **two** primary queries plus suspended collection [SOURCE CURRENT]:

| # | Call | Purpose | Notes |
|---|------|---------|-------|
| 1 | `getAdminCategories(businessId)` | Filter options, form selects, empty-state logic | |
| 2 | `getAdminProductsCatalogCount(businessId)` | **Catalog existence** — ALL rows incl. archived | Feeds Create auto-open |
| 3 | `getAdminProducts` + `getAdminProductsActiveLifecycleCount` inside `ProductCatalogSection` | Paged collection + only-archived empty UX | Inside `<Suspense>` |

### `getAdminProducts` contract (CURRENT)

```
select … archived_at   count: "exact"
where  business_id = :businessId
  [+ q]        escaped ILIKE name|sku
  [+ category] .eq(category_id, :categoryId)
  [+ stock]    out | low | in
  [+ status]   default/active/inactive → archived_at IS NULL (+ availability for active/inactive)
               archived → archived_at IS NOT NULL
order  created_at DESC
range  …
```

**HISTORICAL forensic (pre-lifecycle) — preserved:**

**Absent by design or omission (historical audit):** no soft-delete column
(`deleted_at`/`archived_at`/`is_deleted`) — **SUPERSEDED**: `archived_at` is now LIVE.

### Indexes [DB] (historical excerpt)

`products_pkey (id)`, `products_business_id_idx`, `products_category_id_idx`. No index
supports `stock`, `is_available` or the `name ILIKE '%…%'` search. **SUPERSEDED IN PART** by active-list + SKU integrity indexes (see CURRENT above).

### Triggers (unchanged historical)

`tr_auto_suspend_out_of_stock` — unchanged.

### TypeScript projection — historical

```ts
AdminProductListItem = { id, name, price, category_id, image_url, is_available, sku, stock }
```

**SUPERSEDED** by CURRENT projection including `track_stock` + `archived_at`.

## 7b. Data Loading (historical count-probe note)

Historical page used a filter-scoped `limit:1` count probe — **SUPERSEDED** by `getAdminProductsCatalogCount` (unfiltered incl. archived). Filtered empty ≠ catalog empty.
## 8. Search / Filters / Pagination

All filter state lives in the **URL**. There is no client-side filtering.

| Param | Default | Parser | Semantics |
|-------|---------|--------|-----------|
| `q` | none | `searchParams.q?.trim() \|\| undefined` | `name ILIKE %q%` **OR** `sku ILIKE %q%` |
| `categoryId` | none | passthrough | `category_id = value` |
| `stock` | none | `out` \| `low` \| `in` | `<=0` / `1–5` / `>0` |
| `status` | none | `active` \| `inactive` \| `archived` | **CURRENT** lifecycle + availability (see below) |
| `page` | `1` | `parseAdminProductsPageParam` → `parseInt`, clamp `>=1`, floor | `range()` offset |

**CURRENT `status` contract** (`lib/products/admin.ts` + toolbar) — availability ≠ lifecycle:

| URL `status` | Query semantics |
|--------------|-----------------|
| *(absent / default)* | `archived_at IS NULL` (all non-archived; any availability) |
| `active` | `archived_at IS NULL` AND `is_available = true` |
| `inactive` | `archived_at IS NULL` AND `is_available = false` |
| `archived` | `archived_at IS NOT NULL` |

Toolbar labels [SOURCE — `products-toolbar.tsx`]: stock `Agotados` / `Bajo stock` / `Con stock`;
estado **`Disponibles`** / **`No disponibles`** / **`Archivados`** (not “Activos/Inactivos”).

Default admin collection **excludes archived** (application filter). Admin RLS still allows
own-business archived reads so Archivados recovery / exact-id detail work.

HISTORICAL — SUPERSEDED BY LIFECYCLE IMPLEMENTATION-1 + FINAL-QA-1:
> Parser documented as `active | inactive` only; labels `Activos` / `Inactivos`.

- **Search debounce: 300 ms**, then `router.push` with the rebuilt query string.
- Any filter change **resets `page`**.
- `catalogKey = [page, q, categoryId, stock, status].join("-")` is the `<Suspense key>`, so
  every filter change tears down the boundary and shows `ProductCatalogSkeleton`.
- Pagination renders inside `ProductTableView` (desktop tree) only. With 18 products and a
  page size of 24 the pagination container renders empty [RUNTIME].

### The counting defect — durable rule

There are three distinct counts in the system, and only two are computed:

| Count | Computed? | Where |
|-------|-----------|-------|
| Filtered product count | Yes | `getAdminProducts(...filterOptions).totalCount` |
| Category count | Yes (unfiltered) | `categories.length` |
| **Unfiltered catalog product count** | **Yes (CURRENT)** | `getAdminProductsCatalogCount` — **includes archived** |
| Non-archived lifecycle count | Yes (CURRENT) | `getAdminProductsActiveLifecycleCount` — distinguishes archived-only vs true zero |

**CURRENT:** catalog existence includes archived so archived-only ≠ first-run empty; Create
auto-open uses true-zero semantics; empty state may offer **Ver archivados**.

HISTORICAL — SUPERSEDED (`PROD-P1-1` CLOSED):
> Unfiltered catalog product count was missing; `provider.totalCount` (filtered) was misused
> as catalog existence — root cause of first-run / filtered-empty confusion.

> **DURABLE RULE — `FILTERED EMPTY` AND `CATALOG EMPTY` ARE DIFFERENT STATES.**
> `CATALOG EMPTY` = the tenant owns zero products, independent of any filter. It is the
> only state that may justify an onboarding affordance.
> `FILTERED EMPTY` = the tenant owns products but the active query matched none. It must
> only ever produce a recoverable empty state.
> A filter-scoped count may never be used to decide catalog existence.

## 9. State Model

### Server-owned (URL)

`q`, `categoryId`, `stock`, `status`, `page`.

### Client-owned — `ProductsManagementProvider`

| State | Initial | Notes |
|-------|---------|-------|
| `categories` | from props | Mirror of server data |
| `totalCount` | from props | **Filtered** count (misnamed) |
| `flyoutMode` | `resolveEmptyCatalogFlyoutMode(...)` | `"edit" \| "create-product" \| "create-category" \| null` |
| `selectedProductId` | `null` | |
| `selectedProductName` | `"Producto"` | Placeholder title until hydration |
| `selectedProduct` | `null` | `AdminProduct`, fetched on demand |
| `isLoadingSelectedProduct` | `false` | |
| `selectedProductError` | `null` | |

**No flyout state is in the URL.** Consequences: the edit surface is not deep-linkable,
browser Back does not close it, and a reload loses it.

### Auto-open resolver

```ts
function resolveEmptyCatalogFlyoutMode(categories, totalCount) {
  if (categories.length === 0) return "create-category";
  if (totalCount === 0)        return "create-product";   // ← filtered count
  return null;
}
```

It runs in two places: the lazy `useState` initializer, **and** `syncCatalogData`, which is
invoked by a `useEffect` keyed on `[initialData.categories, initialData.totalCount]`. Since
the server passes a new array identity on every render, the effect re-evaluates on **every
navigation**. `flyoutMode === "edit"` is the only mode protected from being overridden.

### Transitions

| From | Trigger | To |
|------|---------|-----|
| any (not `edit`) | server render with `categories.length === 0` | `create-category` |
| any (not `edit`) | server render with filtered `totalCount === 0` | `create-product` |
| `null` | `+ Nuevo producto` | `create-product` |
| `create-product` | header button (label flips to `Cerrar producto`) | `null` |
| `null` | card / row action → `openEditProduct(id, name)` | `edit` + async hydration |
| `edit` | `getAdminProductByIdAction` resolves | `edit` + `selectedProduct` |
| any | `Cerrar` / backdrop click | `null` |
| `edit` | successful save → `onSuccess` | `null` |
| `create-product` | successful create | **stays open**, form reset |

Verified [RUNTIME]: under an active zero-result filter the auto-opened flyout **can** be
dismissed and stays dismissed — until the next navigation re-fires the effect.

## 10. Desktop Product Management

Desktop = viewport **≥ 900px** (`product-catalog-views.module.css`).

`ProductTableView` renders a semantic `<table>`; all `<th>` carry `scope="col"`; the table
has **no `<caption>`** [RUNTIME].

| # | Column | Source | Interactive | Operational weight |
|---|--------|--------|-------------|--------------------|
| 1 | `Foto` | `image_url` via `next/image` | No | Recognition |
| 2 | `Producto` | `name` + `SKU: {sku}` sub-line | No | Primary identity |
| 3 | `Categoría` | `categories`/`category_id` lookup | No | Grouping |
| 4 | `Precio` | `price`, es-AR currency | No | Commercial |
| 5 | `Stock` | raw `stock` integer | No | **Inventory** |
| 6 | `Estado` | `ProductAvailabilityToggle` + `Activo`/`Inactivo` | **Yes** | **Public visibility** |
| 7 | `Acciones` | menu button, `aria-label="Acciones para {name}"` | **Yes** | Entry to Edit |

### Operational capability answers

| Question | Answer |
|----------|--------|
| Can the operator identify low stock? | Partially — the raw number is shown, but there is **no low-stock visual treatment**; the 1–5 threshold exists only in the filter |
| Can the operator change availability immediately? | **Yes** — inline optimistic toggle, one click |
| Can the operator enter edit? | Yes, via the actions menu |
| Can the operator understand category? | Yes, dedicated column |
| Is SKU visible? | Yes, as a secondary line under the name |
| Is status obvious? | Yes — toggle plus availability chip (availability ≠ archived lifecycle) |
| Can the operator permanently delete a product from the **collection** row/card? | **No** — no collection-row / table / card Delete shortcut |
| Can the operator permanently delete from **product detail**? | **Yes (CURRENT)** — detail lifecycle **Eliminar** → `deleteProductPermanentlyAction` → `delete_product_permanently` RPC (active or archived). Collection has no Delete |

HISTORICAL — SUPERSEDED BY LIFECYCLE IMPLEMENTATION-1 + FINAL-QA-1:
> Can the operator delete a product? No — no delete exists anywhere in the product.

## 11. Mobile Product Management

Mobile = viewport **< 900px**. `ProductGridServer` renders a category-grouped card list.

Structure [RUNTIME]: `h2 Catálogo` → summary line
`18 productos · 5 categorías · 4 activos · 14 inactivos` → per-category `h3 {CATEGORY}` +
`{n} productos` → product cards.

### Card anatomy

`div[role="button"][tabindex="0"]`, `aria-label="Editar {name}"`, with both `onClick` and
`onKeyDown`; measured **311 × 74 px**; no nested interactive elements [RUNTIME].

Content order: `Activo|Inactivo` · `CATEGORÍA` · `{name}` · `{price}` · `Gestionar`.

The per-card category `<p>` is rendered then hidden with `display:none` on mobile
(`PROD-P3-6`), duplicating the section header.

### Assessment of the previous audit's characterisation

The prior audit described mobile as a **CATALOG BROWSER** vs desktop as an **OPERATIONAL
MANAGEMENT SURFACE**. That is now **partially disproven** and must be restated:

- **Disproven:** mobile cards are fully interactive and open the same Edit flyout, which
  exposes *every* field including stock, availability, SKU and image. Mobile is a complete
  management surface by way of Edit.
- **Confirmed:** mobile lacks **at-a-glance inventory data** (no stock, no SKU) and lacks
  the **one-click availability toggle**. Changing availability on mobile costs
  open → toggle → save → close instead of a single tap. Collection cards do **not**
  expose Delete; Permanent Delete / Archive / Restore live only inside product detail
  lifecycle (same as desktop).

The accurate framing is *capability parity through Edit, with a density and inline-action
gap in the collection*. `PROD-P2-7` remains open with this refined wording.

## 12. Desktop ↔ Mobile Capability Matrix

| Capability | Desktop (≥900) | Mobile (<900) | Parity |
|------------|----------------|---------------|--------|
| View image | Yes (`Foto` column) | Yes (card thumb) | ✅ |
| View name | Yes | Yes | ✅ |
| View category | Yes (column) | Yes (group header) | ✅ |
| View price | Yes | Yes | ✅ |
| View stock | **Yes** (column) | **No** | ❌ |
| View SKU | **Yes** (sub-line) | **No** | ❌ |
| View availability | Yes (toggle + text) | Yes (`Activo`/`Inactivo` chip) | ✅ |
| Change availability | **Yes, inline (1 click)** | **Only via Edit (4 steps)** | ❌ |
| Edit product | Yes (actions menu) | Yes (whole card) | ✅ |
| Open actions menu | Yes | No menu; card is the action | ⚠️ by design |
| Understand low stock | Weak — number only, no threshold styling | **No** | ❌ |
| Understand inactive state | Yes | Yes | ✅ |
| Paginate | Yes | **No** — pagination lives only in the desktop tree | ❌ |
| Keyboard operable | Yes (native controls) | Yes (`role=button` + `onKeyDown`) | ✅ |

**Pagination is a newly identified parity gap:** `ProductPagination` is rendered by
`ProductTableView`, which is inside `.desktopOnly`. Below 900px a catalog exceeding 24
products has no page control. Recorded as part of `PROD-P2-7`.

## 13. Create Product

Entry: header `+ Nuevo producto` (disabled while `categoriesCount === 0`), or auto-open.

```
FlyoutPanel(create-product)
  └─ dynamic import CreateProductForm (ssr:false)
       useActionState(createProductAction, {})
```

### Fields

| Field | Control | Required | Default |
|-------|---------|----------|---------|
| Imagen | dropzone → crop modal → direct browser upload | No | empty |
| Nombre | text | **Yes** | empty |
| Categoría | native `<select>` + inline “nueva categoría” dialog | **Yes** | unselected |
| Descripción | textarea | No | empty |
| Precio | number, `min=0 step=0.01` | **Yes** | empty |
| SKU | text | No | empty → auto-generated |
| Stock inicial | number, `min=0 step=1` | **Yes** | **`0`** |
| Controlar stock automáticamente | checkbox `track_stock` | No | **on** (Create default; user may OFF) |
| Disponible | **not present** | — | server derives via `resolveEffectiveProductAvailability` (`requestedAvailable: true`) |

### CTA logic

`disabled={!isValid || isPending || isUploadingImage || isSavingCategory}`, where `isValid`
is native `form.checkValidity()` recomputed on every `onChange`.

### Server flow — `createProductAction`

```
parse FormData → validate(name, price≥0 finite, categoryId, stock≥0 finite)
  → requireAdminPermission("manageProducts")
  → validateCategoryOwnership(categoryId, businessId)
  → resolveProductSkuForCreate()
  → insert { business_id: ctx.businessId, …, is_available: true }
  → revalidatePath("/admin/products")
  → revalidatePublicCatalogCache({ businessId, slug, scope: "catalog" })
  → { success: true }
```

### SKU auto-generation

Manual SKU wins. Otherwise: category name → NFD strip diacritics → strip non-alphanumeric
→ uppercase → first 3 chars (fallback `CAT`), joined to `count(products in category) + 1`
zero-padded to 3 → e.g. `BEB-002`. Non-atomic and unconstrained — see `PROD-P3-12`.

### Post-success behaviour

`formRef.reset()`, all local state cleared, `router.refresh()`. **The flyout does not
close** — no `onSuccess` is passed to `CreateProductForm`. The user sees `Producto creado.`
above a blank form. Asymmetric with Edit; documented as an intentional-looking
"create another" affordance but never stated in copy.

### The stock-0 trap

Because `stock` defaults to `0` and `tr_auto_suspend_out_of_stock` fires `BEFORE INSERT`,
a product created without changing the stock field is written with `is_available = false`
despite the action explicitly inserting `true`. The UI reports success and offers no
indication that the product is invisible to customers. **`PROD-P1-4`.**

## 14. Edit Product

Entry: desktop actions menu, or tapping a mobile card.

```
openEditProduct(id, name) → flyoutMode="edit"
  → effect: getAdminProductByIdAction(id)     server action used as a fetch
       → requireAdminPermission + getAdminProductById(businessId, id)
  → ProductFormSkeleton while pending (aria-busy, aria-label="Cargando producto")
  → error → <p role="alert">
  → EditProductForm(product) + ProductCustomizationOverridesPanel (mode="draft")
       → ONE EDITOR = ONE DRAFT = ONE SAVE
       → saveProductEditDraftAction → public.save_product_edit_draft
```

Hydration is **on demand**; the list payload does not contain `description` or
`track_stock`, so opening Edit always costs one server round-trip plus one dynamic chunk.

**Normal Edit writer (CURRENT):** `saveProductEditDraftAction` → RPC
`public.save_product_edit_draft`.
**`updateProductAction`:** **LEGACY** — not the normal Edit writer (retained for
verify/historical grep only).

### Fields vs Create

Base fields plus a **`Disponible` toggle** (`is_available`), and `product_id` + image
intent wiring. Values seed from the fetched `AdminProduct`.

| Aspect | Create | Edit (CURRENT) |
|--------|--------|----------------|
| Categoría | editable `<select>` + inline create, **required** | **READ-ONLY** persisted name/context — no select, not in save payload; **no reassignment** (Move Category deferred) |
| Customizations | none | draft-mode local Eye/EyeOff; builder immediate mode preserved elsewhere |
| Save | `createProductAction` | whole editor one draft via `saveProductEditDraftAction` |
| Sticky footer | Create shell | whole editor spans Advanced |

### Contract answers

| Question | Answer |
|----------|--------|
| Does a no-op save remain enabled? | **No.** Save requires unified `isDirty && isValid` (+ pending/upload/customization-ready guards) |
| Does the surface track dirty state? | **Yes.** UNIFIED dirty: base + image + groups + options vs persisted baseline. HISTORICAL (superseded by UNIFIED-DRAFT-SAVE-IMPLEMENTATION-1 / FINAL-QA-1): base-form-only dirty from DIRTY-STATE-UX-CONTRACT-1 |
| Does Cancel discard changes? | **Dirty close confirms.** Pristine Cerrar/Escape/backdrop close immediately; dirty opens discard dialog (accordion-only UI changes close immediately) |
| Is there a save confirmation? | No |
| Is delete available? | **CURRENT — detail lifecycle only.** Active: **Archivar** + **Eliminar**. Archived read-only: **Restaurar** + **Eliminar**. Not part of unified Save. Collection: no Delete shortcut. Canonical path: `deleteProductPermanentlyAction` → `delete_product_permanently`. Raw `products` DELETE: **denied** |
| Archived read-only (CURRENT) | Banner; fields inspectable/locked; no normal Save; availability/image mutation denied; Advanced inspectable; Restore + Permanent Delete available; server actions deny Save/availability when archived |
| Image preservation | Intent **KEEP** leaves image unchanged |
| Image removal | **Supported** — intent **REMOVE** (lifecycle KEEP/REPLACE/REMOVE). HISTORICAL (superseded by UNIFIED-DRAFT-SAVE-IMPLEMENTATION-1 / FINAL-QA-1): “Impossible via UI” / `PROD-P3-14` OPEN claim — now **CLOSED** |

### Post-success

Cache union invalidation → `router.refresh()` then `onSuccess()` → `closeFlyout()`.

### Silent re-suspension

HISTORICAL note (pre-contract / LEGACY path): `updateProductAction` always included
`stock` in the update payload so `tr_auto_suspend_out_of_stock` always evaluated.
**CURRENT** normal Edit (`saveProductEditDraftAction` / RPC) also submits stock; stock↔
availability semantics remain governed by the stock/availability contract
(`PROD-P2-10` **CLOSED**).

## 15. Availability

`is_available` is the **merchandising / public selling** switch. It is **orthogonal** to
lifecycle (`archived_at`).

**CURRENT public visibility** (application + RLS): a product is publicly visible only when
`is_available = true` **and** `archived_at IS NULL` **and** the business is active
(plus other existing public predicates). Preview shares the same lifecycle visibility —
no preview bypass.

Valid conceptual states:

| Lifecycle | Availability | Meaning |
|-----------|--------------|---------|
| active (`archived_at` NULL) | available | sellable when other public rules pass |
| active | unavailable | not public; admin-editable |
| archived (`archived_at` set) | unavailable (CHECK-enforced) | recovery view; read-only; not public |
| archived + available | **forbidden** (CHECK) | — |
| deleted | — | row absent; Permanent Delete via RPC |

HISTORICAL — incomplete CURRENT claim SUPERSEDED BY LIFECYCLE:
> `is_available` is the single public-visibility switch (`products_select_available_public`
> requires `is_available = true`) — missing archived exclusion.

### Write paths

| Path | Writes | Trigger fires? | Feedback |
|------|--------|----------------|----------|
| `setProductAvailabilityAction` (desktop inline toggle) | `is_available` **only** | **No** (`stock` untouched) | Optimistic; on error reverts with user-visible feedback (`PROD-P3-16`) |
| `saveProductEditDraftAction` (normal Edit) | full draft via `public.save_product_edit_draft` incl. `stock` + `is_available` | **Yes** (stock-touching) | Inline success; whole-editor save |
| `updateProductAction` | LEGACY full payload incl. `stock` | **Yes** | HISTORICAL (superseded by UNIFIED-DRAFT-SAVE-IMPLEMENTATION-1 / FINAL-QA-1): was Edit form writer; **not** normal Edit |
| `create_order` RPC | `stock` + conditional `is_available=false` | Yes | n/a |
| `tr_auto_suspend_out_of_stock` | forces `is_available=false` | — | none |

Collection toggle + LEGACY update verify permission, ownership pre-check, and
`.eq("business_id", …)` on write. Normal Edit goes through RPC
`save_product_edit_draft` (SECURITY INVOKER) under the same tenant/permission gates
[SOURCE].

### stock ↔ availability relationship — do not assume, this is measured

They are **not** independent:

- `stock <= 0` **forces** `is_available = false` on any INSERT or UPDATE that touches
  `stock`, **for all products, tracked or not**.
- The reverse is **not** true: raising stock above 0 never re-enables availability. A
  suspended product stays suspended until manually reactivated.
- `setProductAvailabilityAction` bypasses the trigger, so a zero-stock product **can** be
  forced available and will stay available until the next stock-touching write.

Live corroboration [DB]:

| stock | is_available | track_stock | products |
|-------|--------------|-------------|----------|
| > 0 | true | false | 1 |
| > 0 | true | true | 2 |
| ≤ 0 | **false** | false | **16** |
| ≤ 0 | **true** | false | 1 ← the toggle-bypass case |

14 of 18 products in the live tenant read unavailable [RUNTIME — historical audit sampling
under then-current labels]; consistent with the trigger rather than deliberate merchandising.

## 16. Stock

| Aspect | Contract |
|--------|----------|
| Storage | `stock integer NOT NULL DEFAULT 0`; no negative guard at column level |
| Display | Desktop `Stock` column, raw integer. Mobile: not displayed |
| Filters | `out` = `stock <= 0`; `low` = `stock 1–5`; `in` = `stock > 0` — thresholds confirmed in `lib/products/admin.ts` and mirrored in the toolbar labels |
| Low-stock semantics | Exists **only as a filter**. No badge, colour or warning anywhere |
| Zero-stock semantics | Forces `is_available=false` via trigger (§15) |
| Edit behaviour | Controlled number input, `min=0`, required; always submitted |
| Mobile visibility | None |
| Order-time consumption | `create_order` aggregates demand, locks rows `FOR UPDATE`, and raises `INSUFFICIENT_STOCK` **before** inserting the order — no partial orders, no negative stock. Applies to `track_stock = true` only |
| Restock | `20260717140000_product_stock_restock_cancel_1.sql` — idempotent restock on order cancel |
| Ledger | `stock_movements` ledger records decrements |

### `track_stock`

Opt-in flag (default `false`) that gates **order-time decrement and the insufficient-stock
guard**. It does **not** gate the auto-suspend trigger.

Both forms tell the user the opposite of the truth:

- Create: *"El descuento automático se implementará en una fase posterior."*
- Edit: *"Por ahora, esta opción solo prepara el producto para el control automático de stock."*

Decrement has been live since migration `20260717010500`. **`PROD-P3-13`.**

## 17. Categories

| Aspect | Behaviour |
|--------|-----------|
| Relation | `products.category_id` → `categories.id`, **NOT NULL**, `ON DELETE RESTRICT` |
| Loader | `getAdminCategories(businessId)` — unfiltered, feeds filters + Create select + empty-state logic |
| Filter | `categoryId` URL param → `.eq("category_id", …)` |
| Selector (Create) | Native `<select>`, **required**, editable + inline “nueva categoría” |
| Selector (Edit) | **READ-ONLY** persisted category context — no `select[name=category_id]`; not dirty; not in save payload. HISTORICAL (superseded by UNIFIED-DRAFT-SAVE-IMPLEMENTATION-1 / FINAL-QA-1): required editable select in both forms |
| Inline creation | **Create only** — `<dialog>` + `createCategoryAction`, then auto-selects the new id and `router.refresh()`. **No Edit inline category creation** |
| Edit reassignment | **None** — Move Category deferred |
| Deleted / missing category | **Cannot happen** — `ON DELETE RESTRICT` blocks deleting a category that still has products, and `category_id` cannot be null |
| Ownership validation | `validateCategoryOwnership` on **Create**. Normal Edit does **not** re-validate/reassign category (RPC does not accept client `category_id`). HISTORICAL: “on every create and update” |
| Ordering | **CURRENT:** loaders still `position ASC NULLS LAST, name ASC` (NULLS LAST inert post-NOT-NULL). `categories.position` **NOT NULL / CONTIGUOUS** per business. Insert rank: append trigger. Reorder rank: RPC. Product list rows remain `created_at DESC`. |
| Manual public category order | **CONTRACT APPROVED** · **DB LIVE / CERTIFIED** — Runtime ordering UI **IMPLEMENTED** · Pre-Final visual polish **PASS** · Motion + Filter Unity **PASS / PARTIALLY SUPERSEDED** · Filter handoff + Category compact unity **PASS** · Filter menu hard visual closeout **PASS** (trailing actionable; edge/rhythm polished; handoff 6/6 certified) · real Save/restore E2E **PENDING FINAL-QA-1** · Package LOCAL/UNDEPLOYED · Next: **FINAL-QA-1** |
| Mobile grouping | Presentation only — the flat, ordered product array is grouped client/server-side for display; grouping carries no persisted state |
| Desktop | Flat `Categoría` column, no grouping |
| Guard | `+ Nuevo producto` is disabled when the tenant has zero categories, and the provider auto-opens `create-category` instead |

**Category grouping is presentation-only. Confirmed.**

## 18. Images

### Pipeline

```
products.image_url  (absolute Supabase object URL, written at upload time)
  → next/image  (loader: "custom", loaderFile: lib/supabase/image-loader.ts)
      → RENDER_PUBLIC_PREFIX  /storage/v1/render/image/public/…?width=&quality=
          → 403 FeatureNotEnabled          ← current production + local state
      → onError fallback
          → toSupabaseObjectPublicUrl → /storage/v1/object/public/…  + unoptimized
```

### Upload path (write side)

Both forms upload **directly from the browser** with the Supabase browser client:

| | Create | Edit |
|---|--------|------|
| Path | `${businessId}/tmp-product-{rand}/{rand}.{ext}` | `${businessId}/${product.id}/{rand}.{ext}` |
| Bucket | `product-images` (public) | same |
| `upsert` | true | true |
| Intent (CURRENT Edit) | n/a (set on create) | **KEEP / REPLACE / REMOVE** — REMOVE clears product image via unified draft save |

Create uses a **temporary** product id because the row does not exist yet, so created
products permanently carry a `tmp-product-*` path segment.

HISTORICAL (superseded by UNIFIED-DRAFT-SAVE-IMPLEMENTATION-1 / FINAL-QA-1): Edit image
removal described as impossible / no affordance.

### Storage authorization

`product_images_insert_own_business` / `_update_own_business` require folder depth 2 and
`foldername[1] = caller's business_id` → **a user cannot write into another tenant's
prefix** [SOURCE]. `product_images_public_read` grants `select` to `public`.

**CURRENT Storage DELETE:** `product_images_delete_own_business` is **LIVE** (role/tenant
constrained with manageProducts-equivalent roles — image lifecycle + RLS role enforcement).
Permanent Delete sequence: DB RPC commit → shared-reference check (active **and** archived
products count as owners) → Storage cleanup if unreferenced (`removeProductImageIfUnreferenced`
via authenticated server session — **not** service-role). Archive / Restore: **no** Storage
mutation. Edit KEEP/REMOVE/REPLACE is a separate image-intent lifecycle.

HISTORICAL — SUPERSEDED BY ADMIN-PRODUCTS-IMAGE-LIFECYCLE-DB-APPLY-1 (+ role enforcement):
> There is no DELETE policy, so no client can remove objects.

### Measured delivery state [RUNTIME, 384px, 17 loaded product images]

| Metric | Value |
|--------|-------|
| Served via `/render/image/` | **0** |
| Served via `/object/public/` | **17** |
| Natural dimensions (sample) | 1122×1122, 1254×1254 |
| Displayed box | 71×72 |
| Overscale | ~16× per axis |

### Two distinct issues — keep separate

1. **`quality: 80` warning (`PROD-P3-3`)** — `next.config.ts` declares no
   `images.qualities`; Next 16.2.9 defaults to `[75]`; three callsites and the loader
   default pass `80`. A dev-time console warning. **Currently inert**, because the render
   endpoint is never successfully used.
2. **Image delivery performance (`PROD-P2-1`)** — full-resolution originals are delivered
   to thumbnail slots. This is **not a Products bug and not newly discovered**. It is
   pre-existing, tracked infra debt from `PUBLIC-CATALOG-IMAGE-TRANSFORMS-INFRA-1-MODE-B`
   (2026-07-29), which is **BLOCKED pending two explicit owner authorizations**
   (`AUTORIZO_SUPABASE_IMAGE_TRANSFORMATIONS_ENABLE`,
   `…_BILLING_ACCEPTED`) because Supabase Image Transformations is a paid capability.
   The `onError` → object fallback is **working as designed**.

Code-side mitigations that would *not* require enabling transforms (resizing at upload
time, storing a derivative, tightening `sizes`) are design options, not defects.

## 19. Public Catalog Integration

**Boundary**

| Owner | Responsibility |
|-------|----------------|
| Admin Products | Writes `public.products`; triggers invalidation |
| `lib/catalog/public-cache-tags.ts` | Translates a mutation into tag/path invalidation |
| Public catalog | Reads and renders; owns its own UX |

Contract: a product is publicly visible **iff** `is_available = true` **and**
`archived_at IS NULL` **and** the business is active (plus existing public predicates —
`lib/catalog/public.ts` / RLS). Preview uses the same catalog data/path — **no lifecycle bypass**.

**CURRENT invalidation matrix** (do not collapse to “all three actions identical”):

| Mutation | `/admin/products` | `/admin/products/customizations` | public catalog | public customization |
|----------|-------------------|----------------------------------|----------------|----------------------|
| `createProductAction` | ✅ | — | ✅ catalog | — |
| `saveProductEditDraftAction` | ✅ | ✅ | ✅ catalog | ✅ customization |
| `setProductAvailabilityAction` | ✅ | — | ✅ catalog | — |
| `archiveProductAction` | ✅ | — | ✅ catalog | ✅ customization |
| `restoreProductAction` | ✅ | — | ✅ catalog | ✅ customization |
| `deleteProductPermanentlyAction` | ✅ | ✅ | ✅ catalog | ✅ customization |
| `updateProductAction` (LEGACY) | ✅ | — | ✅ catalog | — |

Lifecycle trio uses `revalidateProductLifecycleCaches` (delete also includes admin
customizations path).

HISTORICAL — SUPERSEDED:
> publicly visible iff `is_available = true` and business active (archived omitted).
> “All three mutating Products actions invalidate identically.”
## 20. Customizations / Extras Integration

The header link `Opcionales y extras` → `/admin/products/customizations`.

| Question | Answer |
|----------|--------|
| Does the Products **list** show customization state? | **No** — no column, badge or card indicator |
| Does **Create** touch customization? | **No** |
| Does **Edit** touch customization? | **Yes** — `ProductCustomizationOverridesPanel` (`mode="draft"`) inside the edit flyout: local Eye/EyeOff draft only; persisted on whole-editor `saveProductEditDraftAction`. Builder / immediate mode preserved on customization builder surface |
| Separation | Group/option/upsell definitions live in the separate subsystem; the edit flyout exposes only **per-product overrides** (draft until Save) |

`lib/products/admin.ts` also consumes customization data through
`getManualOrderProductOptions` (for the Orders manual-order modal), which resolves
`resolveManualOrderProductEligibilityMap` and `getPublicProductCustomizationConfig`. That
function shares the file but not the Products UI.

## 21. Catalog Preview Integration

Header link `Vista previa del catálogo` → `/admin/products/preview`.

| Aspect | Contract |
|--------|----------|
| What it renders | The **real** public route `/b/{slug}/catalogo?orderopsPreview=1` in an iframe |
| Permission | Behind the same protected admin layout |
| Safety model | Preview query flag + `orderops-admin-catalog-preview` cookie (**300 s TTL**) disables order confirmation: *"La confirmación de pedidos está deshabilitada en la vista previa del catálogo."* |
| Cart isolation | Same-origin `postMessage` `ORDEROPS_PREVIEW_CLEAR_CART` / `…_ACK` |
| Does it reflect Products state? | Yes — it is the same route and the same cached data; **archived products stay hidden** (same public lifecycle contract; no preview bypass) |
| Cache sharing | Shares `public-catalog:{businessId}`, so Products invalidation covers preview [INFERRED] |

Deeper preview architecture: `docs/admin-catalog-preview-audit-1-forensic-architecture.md`.

## 22. Responsive Architecture

### Canonical breakpoint table

| BP | Owner module(s) | Effect | Classification |
|----|-----------------|--------|----------------|
| `max-479` | `products-header-actions`, `products-toolbar` | Tightest mobile density; primary CTA drops to `2.25rem` | Intentional |
| `min-480` | `product-card`, `product-grid`, `product-catalog-skeleton` | Grid → 2 columns | Intentional (pairs with 479) |
| `max-640` | `product-form`, `product-pagination` | Form/pagination compaction | Orphan threshold |
| `min-720` | `products-header-actions`, `product-catalog-skeleton` | Header action row reflow | Orphan threshold |
| `max-767` / `min-768` | `products-toolbar`, `products-header-actions`, `dashboard-shell`, `catalog-preview-shell` | Tablet layout switch | Intentional (paired) |
| `768–899` | `product-card`, `product-grid`, `product-catalog-skeleton`, `product-pagination`, `products-header-actions`, `products-toolbar` | Tablet band; **overrides the 480 two-column rule back to one stretched column** | Legacy — cause of `PROD-P3-1` |
| `max-899` | `product-pagination` | Pagination compaction | Intentional (pairs with 900) |
| **`min-900`** | **`product-catalog-views`**, `product-card`, `product-grid`, `product-catalog-skeleton` | **Collection renderer switch: `.desktopOnly` block / `.mobileOnly` none** | **Canonical** |
| `min-961` | `flyout-panel` | Flyout width/inset change | **Orphan** |
| `min-1024` | `products-toolbar`, `catalog-preview-shell` | Toolbar final desktop layout | **Orphan** |
| `min-1440` | `catalog-preview-shell` | Preview shell only | Out of Products scope |

### Canonical thresholds

```txt
product collection : 900   ← authoritative
toolbar            : 768 / 1024
header actions     : 479 / 720 / 768 / 899
flyout             : 961
```

Four thresholds (`640`, `720`, `961`, `1024`) have no paired counterpart and no shared
token. `PROD-P3-2` covers the desktop-threshold divergence; the `768–899` band inversion is
`PROD-P3-1`.

## 23. Loading / Empty / Error States

| Surface | Owner | Behaviour |
|---------|-------|-----------|
| Page shell | `AdminShell` | `Cargando panel / Un momento…` [RUNTIME] |
| Collection | `<Suspense key={catalogKey}>` → `ProductCatalogSkeleton` | Re-fires on every filter change |
| Edit form | `ProductFormSkeleton`, `aria-busy`, `aria-label="Cargando producto"` | While `getAdminProductByIdAction` resolves |
| Create/Edit submit | `isPending` → CTA text `Guardando...`, all fields disabled | |
| Image upload | `Subiendo imagen...` hint; CTA disabled | |
| Image load failure | `onError` → object/public URL fallback | Silent by design |
| Product load error | `<p role="alert">` inside the flyout | Good |
| Action error | inline `admin-feedback--error` paragraph | **No toast is used anywhere in Products** |
| Availability toggle error | **none** — optimistic value reverts silently | `PROD-P3-16` |

### Empty-state machine

There is exactly **one** empty component, `ProductCatalogEmptyState`, always worded as a
filter miss: *"No se encontraron productos / No hay resultados que coincidan con tus
filtros actuales"* + `Limpiar filtros` → `router.push(pathname)`.

| # | State | Collection shows | Flyout | CTA | URL |
|---|-------|------------------|--------|-----|-----|
| A | Catalog truly empty (has categories) | filter-miss empty state | **auto `create-product`** | Limpiar filtros (no-op) | clean |
| A′ | No categories at all | filter-miss empty state | **auto `create-category`**; `+ Nuevo producto` disabled | — | clean |
| B | Products exist, search no match | filter-miss empty state | **auto `create-product`** ❌ | Limpiar filtros | `?q=` |
| C | Category filter no match | same | **auto `create-product`** ❌ | Limpiar filtros | `?categoryId=` |
| D | Stock filter no match | same | **auto `create-product`** ❌ | Limpiar filtros | `?stock=` |
| E | Status filter no match | same | **auto `create-product`** ❌ | Limpiar filtros | `?status=` |
| F | Combined filters no match | same | **auto `create-product`** ❌ | Limpiar filtros | multiple |
| G | Page out of range | same | **not** auto-opened (`totalCount > 0`) | Limpiar filtros clears `page` too → recovers | `?page=99` |
| H | `q` contains `,` | **whole page 500** — *"This page couldn't load"* | n/a | none — must edit URL | `?q=a,b` |

Rows B–F are `PROD-P1-1`. Row H is `PROD-P1-3`. Row A shows correct *intent* with wrong
*copy* (the only empty copy available is filter-worded).

## 24. Accessibility

### Semantic correctness

| Item | State |
|------|-------|
| Heading hierarchy | **Broken** — two `<h1>` (`La Burguesía` from the shell, `Productos` from the page); category and product both `<h3>`; empty state `<h4>` under `<h2>`. `PROD-P3-5` |
| Landmarks | `navigation` present and labelled (`Navegación de administración`) |
| Table semantics | Good — real `<table>`, `<thead>`, `scope="col"`. **No `<caption>`** |
| Icon-only actions | Row actions labelled `Acciones para {name}`; crop badge labelled; category `+` labelled |
| Card semantics | `div[role=button][tabindex=0]` + `aria-label="Editar {name}"` + `onKeyDown` — correct custom-button pattern |
| Availability toggle name | `aria-label` announces the **action** (`Marcar producto como inactivo`) while the checkbox state announces the **value** → contradictory when combined ("…inactivo, checked") |
| Status text | `Activo`/`Inactivo` next to the toggle is `aria-hidden="true"` |
| Copy-link feedback | Visible label changes to `Link copiado`, but a static `aria-label` pins the accessible name → **screen readers get no confirmation**. `PROD-P3-17` |
| Stock warnings | `role="status"` used correctly in both forms |
| Product load error | `role="alert"` |

### Keyboard correctness

| Item | State |
|------|-------|
| Cards | Focusable and operable |
| Table controls | Native, operable |
| Flyout: initial focus | **Not set** |
| Flyout: focus containment | **None** — 9–11 tabbables remain reachable behind the panel |
| Flyout: Escape | **Does not close** |
| Flyout: return focus | **Not restored** |
| Background inert | Not `aria-hidden`, not `inert` |
| Overlay | Closes on click; it is a plain `div` with `onClick`, no role, not keyboard reachable |

**`ARIA MODAL CLAIM` vs `NO MODAL FOCUS MANAGEMENT`** — `flyout-panel.tsx` declares
`role="dialog" aria-modal="true"` while implementing none of the focus obligations that
declaration makes. `PROD-P2-5`.

### Visual accessibility

Light mode: `#a1a1aa` on white = **2.56:1** for `Gestionar`, `Por categorías` and category
counts — fails WCAG AA. Dark equivalents pass at 6.91:1. `PROD-P2-6`.
**Zero** `:focus` / `:focus-visible` rules exist in any Products module. `PROD-P3-8`.

### Touch ergonomics

8 of 9 representative mobile controls are below 44px (ghost links 32, primary 38→36 at
≤479, selects 36, search 38, crop 32). `PROD-P2-3`. The product **card** itself is a
generous 311×74 target and is the exception.

## 25. Visual / Information Hierarchy

### Header actions

| Action | Class | Style | Deserves this prominence? |
|--------|-------|-------|---------------------------|
| `+ Nuevo producto` | **PRIMARY OPERATION** | `admin-primary-button` | Yes |
| `Opcionales y extras` | **CATALOG CONFIGURATION** | ghost link | No — configuration, not a page action; belongs adjacent to catalog settings |
| `Vista previa del catálogo` | **PREVIEW** | ghost link | Secondary at most |
| `Copiar link catálogo público` | **UTILITY** | ghost button | Tertiary; a share/utility affordance |

Three tertiary-value actions currently sit at the same visual level as the one primary
action. On mobile all four stack full-width, consuming **150–152 px** and pushing the
collection below the fold (~1.5 cards visible at 360×800). The three ghost links render as
centered plain text with no control affordance. `PROD-P2-8`.

### Toolbar

| Element | Type |
|---------|------|
| `18 productos · 5 categorías` | **summary** |
| `Buscar producto o SKU...` | **control** |
| Categoría / Stock / Estado selects | **control** |
| `Limpiar filtros` | **control** |

The mobile catalog card repeats the summary in richer form
(`18 productos · 5 categorías · 4 activos · 14 inactivos`), so the count appears twice with
different vocabularies, and it mixes a *filtered* product count with an *unfiltered*
category count. `PROD-P3-4`. `Limpiar filtros` is simultaneously present in the toolbar and
in the empty state. `PROD-P3-9`.

### Product information hierarchy

| Rank | Desktop | Mobile |
|------|---------|--------|
| 1 | Name (+SKU) | Name |
| 2 | Photo | Status chip |
| 3 | Category | Photo |
| 4 | Price | Price |
| 5 | **Stock** | Category (as group header) |
| 6 | Status toggle | `Gestionar` |
| 7 | Actions | — |

Operationally critical: **status** and **stock**. Mobile surfaces status but not stock;
this is the substantive hierarchy gap. Desktop density should not be transplanted wholesale
onto mobile — the card's 74px height and single-tap Edit are healthy.

## 26. Performance / Network

### Proven performance debt

| Item | Evidence |
|------|----------|
| Dual render tree | `.desktopOnly` at 384px: `display:none`, **447 DOM nodes**, 18 table rows, 36 interactive elements, 18 `<img>`. Visible `.mobileOnly`: 255 nodes. Page total **930 nodes** → the inert tree is ~48% of the document [RUNTIME] |
| Oversized images | 17 originals at ~1122–1254px square rendered into 71×72 boxes [RUNTIME] |
| Failed transforms | Every product image attempts `/render/image/` → 403 before falling back [SOURCE + prior runtime] |
| Redundant row fetch | The count probe uses `limit: 1`, fetching one full row that is never rendered [SOURCE] |
| Suspense key churn | Every filter change remounts the boundary and re-renders both trees [SOURCE] |

### Corrections to earlier assumptions

- **Images are not doubled.** The hidden tree's 18 `<img>` are `loading="lazy"` and,
  under `display:none`, **never load** — measured `loaded: 0` [RUNTIME]. `PROD-P2-2` is
  narrowed to DOM/render duplication only.
- **The hidden tree is not an accessibility or keyboard hazard.** `display:none` removes
  its 36 controls from both the a11y tree and the tab order.

### Dev-timing observations (not debt)

Local dev compile/HMR latency and Turbopack overlay noise are excluded.

### Network model

| Request | When | Expected |
|---------|------|----------|
| `GET /admin/products` (RSC) | initial + every filter/search/page change | Yes |
| `products` count probe + paged select + `categories` | per render | Yes (probe is wasteful) |
| `/storage/v1/render/image/public/...` | per product image | **403 by current infra state** |
| `/storage/v1/object/public/...` | fallback per image | Yes |
| Dynamic chunk for Create/Edit/Category form | first flyout open of each type | Yes |
| `getAdminProductByIdAction` | each Edit open | Yes |
| `createProductAction` / `saveProductEditDraftAction` / `setProductAvailabilityAction` (`updateProductAction` LEGACY) | user-initiated only | Source-verified; **not executed in this audit** |

## 27. Tenant / Security Boundaries

### Application layer — strong

| Control | State |
|---------|-------|
| Permission on page | `requireAdminPermission("manageProducts")` |
| Permission on every action | Yes — Create / Edit draft / availability / Archive / Restore / Permanent Delete / LEGACY update |
| `business_id` origin | Server context only |
| Row ownership pre-check | `select id … eq(id) eq(business_id) maybeSingle()` before update |
| Mutation scoping | `UPDATE … eq(id) eq(business_id)` — double-scoped |
| Category ownership | `validateCategoryOwnership` on **Create**; normal Edit does not reassign category |
| Product id lookup | Always `eq(business_id)`; a foreign id yields *"Este producto ya no existe o pertenece a otro negocio."* |
| Image path ownership | Storage policy pins `foldername[1]` to the caller's `business_id` |
| Invalidation scope | Tag keyed by `businessId`/`slug` — no cross-tenant flush |

### Database layer — CURRENT vs HISTORICAL

**CURRENT (PROD-P1-2 CLOSED):** Products manage-role RLS is **LIVE / VALIDATED**. Mutative
policies require tenancy **and** manageProducts-equivalent role (owner/admin/manager;
super_admin path documented). Operator/viewer: **denied** at PostgREST for products
mutations and for mutative product-images policies. Raw authenticated `DELETE` on
`public.products`: **no merchant policy** (denied). Permanent Delete feature exists only
via `public.delete_product_permanently(uuid)` (SECURITY DEFINER; role + tenant validated
inside RPC). Canonical app path:
`deleteProductPermanentlyAction` → RPC → optional Storage cleanup.

#### HISTORICAL — PRE RLS ROLE ENFORCEMENT (evidence preserved)

All four `products_*_own_business` policies (`20260427021000_super_admin_roles_and_rls.sql`)
were historically `to authenticated` and gated solely on

```sql
business_id = (select p.business_id from public.profiles p where p.id = auth.uid())
or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin')
```

**HISTORICAL finding:** no policy referenced role beyond `super_admin`. An authenticated
`operator` or `viewer` of the same business — blocked from `/admin/products` at the app
layer — could `INSERT`, `UPDATE` and `DELETE` that business's products directly through
PostgREST. Same gap applied to product-images insert/update. This **privilege-escalation-
within-tenant** finding is what fed `ADMIN-PRODUCTS-RLS-ROLE-ENFORCEMENT-*` and is now
**CLOSED** as CURRENT above. Also historically: raw DELETE existed in RLS while the app
had no delete UI and no soft-delete — **SUPERSEDED** by lifecycle RPC + raw DELETE deny.

### Search input handling

`q` is interpolated raw into a PostgREST `or()` expression. Because `business_id` is a
separate `and` condition, injection **cannot cross tenants**; it can only malform or widen
the filter within the caller's own rows. Its practical impact is the crash in
`PROD-P1-3`, not disclosure.

## 28. Cache / Revalidation

`revalidatePublicCatalogCache({ businessId, slug, scope: "catalog" })` expands to:

| Effect | Fires for `scope: "catalog"`? |
|--------|-------------------------------|
| `updateTag(public-business:{slug})` | No |
| `updateTag(public-catalog:{businessId})` | **Yes** |
| `updateTag(public-customization:{businessId})` | **Yes** — product edits change `priceFrom`/availability summaries |
| `revalidatePath('/b/{slug}/catalogo')` | **Yes** |
| `revalidatePath('/b/{slug}')` | No |
| `previousSlug` handling | Not used by Products |

| Mutation | `revalidatePath("/admin/products")` | public cache | client |
|----------|------------------------------------|--------------|--------|
| `createProductAction` | ✅ | ✅ scope catalog | `router.refresh()` |
| `saveProductEditDraftAction` (normal Edit) | ✅ + `/admin/products/customizations` | ✅ catalog **+** customization | `router.refresh()` + close |
| `updateProductAction` | ✅ | ✅ scope catalog | LEGACY — not normal Edit |
| `setProductAvailabilityAction` | ✅ | ✅ scope catalog | `router.refresh()` |
| `archiveProductAction` | ✅ | ✅ catalog + customization | toast + refresh |
| `restoreProductAction` | ✅ | ✅ catalog + customization | toast + refresh |
| `deleteProductPermanentlyAction` | ✅ + `/admin/products/customizations` | ✅ catalog + customization | toast + refresh |
| `createCategoryAction` (inline) | owned by categories | per that action | `router.refresh()` |

Freshness: **admin** immediate; **public** immediate via `updateTag`; **preview**
immediate by sharing the public catalog tag [INFERRED].

HISTORICAL (superseded by UNIFIED-DRAFT-SAVE-IMPLEMENTATION-1 / FINAL-QA-1): mutation
matrix listed only `updateProductAction` as Edit save / missing `saveProductEditDraftAction`
union (products + customizations + public catalog + customization).

## 29. Integration Map

```
Products Page  (app/admin/(protected)/products/page.tsx)
│
├── Auth / Tenant ........... lib/admin/context.ts + lib/admin/permissions.ts
├── Product Data ............ lib/products/admin.ts  →  public.products  (RLS: business_id)
├── Categories .............. lib/categories/admin.ts (read)
│                             app/admin/(protected)/categories/actions.ts (inline create — Create only)
├── Stock ................... products.stock + track_stock
│                             ├─ tr_auto_suspend_out_of_stock        (DB trigger)
│                             ├─ create_order RPC                    (decrement + guard)
│                             └─ stock_movements ledger / restock-on-cancel
├── Availability ............ products.is_available
│                             ├─ setProductAvailabilityAction        (inline, desktop)
│                             ├─ saveProductEditDraftAction          (normal Edit → save_product_edit_draft)
│                             ├─ updateProductAction                 (LEGACY — not normal Edit)
│                             └─ tr_auto_suspend_out_of_stock        (override)
├── Images .................. product-images bucket (public, tenant-scoped by path)
│                             └─ lib/supabase/image-loader.ts → render/image → object/public
├── Customizations link ..... /admin/products/customizations
│                             └─ ProductCustomizationOverridesPanel  (Edit draft mode inside flyout)
├── Preview link ............ /admin/products/preview → /b/{slug}/catalogo?orderopsPreview=1
├── Copy public link ........ lib/admin/catalog-preview-shared.ts → /b/{slug}/catalogo
└── Public invalidation ..... lib/catalog/public-cache-tags.ts
                              ├─ public-catalog:{businessId}
                              ├─ public-customization:{businessId}
                              └─ path /b/{slug}/catalogo
```

HISTORICAL (superseded by UNIFIED-DRAFT-SAVE-IMPLEMENTATION-1 / FINAL-QA-1): map showed
`updateProductAction` as Edit form owner.

## 30. Functional Capability Matrix

| Capability | Desktop | Mobile | Create | Edit | Server owner | Notes |
|------------|---------|--------|--------|------|--------------|-------|
| Search (name + SKU) | ✅ | ✅ | — | — | `getAdminProducts` | URL `q`, 300 ms debounce; breaks on `,` |
| Filter category | ✅ | ✅ | — | — | `getAdminProducts` | |
| Filter stock | ✅ | ✅ | — | — | `getAdminProducts` | 0 / 1–5 / >0 |
| Filter availability / lifecycle | ✅ | ✅ | — | — | `getAdminProducts` | URL `active`/`inactive`/`archived`; labels Disponibles / No disponibles / Archivados |
| Paginate | ✅ | ❌ | — | — | `getAdminProducts` | Control lives in the desktop tree only |
| View stock | ✅ | ❌ | ✅ | ✅ | — | |
| Change availability | ✅ inline | ❌ inline | ❌ (forced `true`, then trigger may flip) | ✅ active only | `setProductAvailability` / `saveProductEditDraft` | Denied when archived |
| View SKU | ✅ | ❌ | ✅ | ✅ | — | |
| Set SKU | — | — | ✅ (auto if blank) | ✅ active | `createProduct` / `saveProductEditDraft` | uniqueness via DB contract |
| Edit product | ✅ | ✅ | — | — | `getAdminProductById` + `saveProductEditDraft` | Archived: read-only detail |
| Create product | ✅ | ✅ | ✅ | — | `createProduct` | Requires ≥1 category |
| **Archive product** | ✅ detail | ✅ detail | ❌ | ✅ active detail | `archiveProductAction` | Collection: no Archive shortcut |
| **Restore product** | ✅ archived detail | ✅ archived detail | ❌ | ✅ archived detail | `restoreProductAction` | Restores unavailable (≠ publish) |
| **Permanent Delete** | ✅ detail | ✅ detail | ❌ | ✅ active + archived detail | `deleteProductPermanentlyAction` → `delete_product_permanently` | Collection: **no** Delete shortcut. Raw table DELETE: **denied** |
| Image upload | — | — | ✅ | ✅ | Supabase Storage (browser) | |
| Image remove | — | — | n/a | ✅ | `saveProductEditDraft` (REMOVE intent) | HISTORICAL: ❌ / no affordance |
| Image crop | — | — | ✅ | ✅ | client-side | |
| Category assign | ✅ view | ✅ view | ✅ | ❌ read-only | Create validated server-side | Edit reassignment deferred (Move Category) |
| Category create | — | — | ✅ inline | ❌ | `createCategoryAction` | HISTORICAL: Edit inline create |
| Price | ✅ view | ✅ view | ✅ | ✅ | `createProduct` / `saveProductEditDraft` | |
| Description | ❌ view | ❌ view | ✅ | ✅ | — | Not shown in either collection |
| `track_stock` | ❌ view | ❌ view | ✅ | ✅ | — | Helper copy reconciled with contract phases |
| Preview | ✅ | ✅ | — | — | preview route | |
| Customizations | link only | link only | ❌ | ✅ overrides panel (draft) | customization subsystem + unified Save | |
| Copy public link | ✅ | ✅ | — | — | slug from server context | No SR feedback |

## 31. Frozen Invariants

Behaviours proven correct that future phases must preserve.

| # | Invariant | Status |
|---|-----------|--------|
| 1 | `manageProducts` (owner\|manager) gates the page and **all** Products write actions (incl. `saveProductEditDraftAction`) | **FROZEN** |
| 2 | `business_id` is resolved server-side from the caller's profile; never accepted from the client | **FROZEN** |
| 3 | Every product mutation is tenant-scoped (ownership pre-check / RLS / RPC invoker); client never supplies `business_id` | **FROZEN** |
| 4 | Category ownership is validated on **Create**. Normal Edit does **not** reassign `category_id` (read-only persisted context). HISTORICAL (superseded by UNIFIED-DRAFT-SAVE-IMPLEMENTATION-1 / FINAL-QA-1): “validated on create and update” / direct `products.update` as Edit writer | **FROZEN** (Create); Edit reassignment deferred |
| 5 | Storage writes are path-pinned to the caller's `business_id` | **FROZEN** |
| 6 | Filters are URL-driven and server-applied; no client-side filtering | **FROZEN** |
| 7 | Search debounce 300 ms, and any filter change resets `page` | **FROZEN** |
| 8 | Filter controls PRESENTATION: **CURRENT / VISUALLY FROZEN** — Category compact filter menu (+ separated Ordenar categorías → order-only dialog) · Stock compact menu · Estado compact menu; single toolbar `openFilter`; one-tap handoff **CERTIFIED**. Hard visual closeout: trailing action clear/available, separator rhythm tightened, menu edge contact+floating polished. **HISTORICAL / SUPERSEDED** — (a) Category Filter+Order shared dialog two-mode; (b) Grip/Pointer drag; (c) native Stock/Estado `<select>`. Filter **SEMANTICS** remain **FROZEN**. | **FROZEN semantics + frozen visual family** |
| 9 | Desktop inline availability toggle is optimistic with rollback | **FROZEN** (add feedback, keep the pattern) |
| 10 | Every product mutation invalidates `public-catalog:{businessId}` + `/b/{slug}/catalogo` (Edit draft also invalidates admin customizations path + public customization scope) | **FROZEN** |
| 11 | Server-side validation of name/price/stock is authoritative on Create+Edit; category validation authoritative on **Create only** (Edit omits category from payload) | **FROZEN** |
| 12 | Preview cannot submit real orders (query flag + 300 s cookie) | **FROZEN** |
| 13 | `create_order` validates and decrements tracked stock transactionally; no partial orders, no negative stock | **FROZEN** |
| 14 | `order_items` keeps `product_name`/`unit_price` snapshots, so product changes never rewrite order history | **FROZEN** |
| 15 | Mobile cards are single-tap, ≥44px, labelled, keyboard-operable | **FROZEN** |
| 16 | Single document scroll on mobile; body is the only scroll owner outside the flyout | **FROZEN** |
| 17 | `category_id` is NOT NULL and `ON DELETE RESTRICT` — no orphan products | **FROZEN** |
| 18 | Normal Edit writer is `saveProductEditDraftAction` → `public.save_product_edit_draft`; `updateProductAction` is LEGACY | **FROZEN** |

## 32. Known Debt Register

Status values: `OPEN`, `OPEN (refined)`, `OPEN (blocked)`, `OPEN (external)`.

### P1

| ID | Severity | Status | Surface | Owner | Evidence | Impact | Phase |
|----|----------|--------|---------|-------|----------|--------|-------|
| `PROD-P1-1` | P1 | **CLOSED** | Zero-result filter state | `products/page.tsx`, `products-management-provider.tsx` | Closed by search/empty-state resilience; Final QA reconfirmed filtered-zero does **not** auto-open Create | — | CLOSED |
| `PROD-P1-2` | P1 | **CLOSED** | RLS / storage policies | products manage-role RLS migrations | LIVE / VALIDATED (`ADMIN-PRODUCTS-RLS-ROLE-ENFORCEMENT-*`) | — | CLOSED |
| `PROD-P1-3` | P1 | **CLOSED** | Search | `lib/products/admin.ts` | Punctuation-safe; Final QA `?q=a,b` PASS | — | CLOSED |
| `PROD-P1-4` | P1 | **CLOSED** | Create + stock/availability contract | stock availability contract migration + actions | LIVE / VALIDATED | — | CLOSED |

### P2

| ID | Severity | Status | Surface | Owner | Evidence | Impact | Phase |
|----|----------|--------|---------|-------|----------|--------|-------|
| `PROD-P2-1` | P2 | **OPEN (blocked) / ACCEPTED INFRA DEBT** | All product images + public catalog | Supabase Image Transformations / billing; `image-loader.ts` | Final QA observed large originals still; **do not block release**; owner deferred Image Delivery Reconciliation | Full originals on thumbs | Infra decision |
| `PROD-P2-2` | P2 | **CLOSED** | Collection | `product-catalog-views.tsx` + `use-products-desktop-collection.ts` | Single active tree: `<900` cards / `≥900` table; Final QA 899/900 proof | — | CLOSED |
| `PROD-P2-3` | P2 | **CLOSED** | Header, toolbar, form touch | mobile operational + flyout polish | Final QA 390: Nuevo 44px; menu 44px; availability host ≥44px min-height | — | CLOSED |
| `PROD-P2-4` | P2 | **CLOSED** | Create + edit flyout footer | `product-form` / flyout polish | Sticky footer / non-occluding certified + Final QA | — | CLOSED |
| `PROD-P2-5` | P2 | **CLOSED** | Flyout a11y | `flyout-panel.tsx` | Escape / focus containment / return focus Final QA PASS | — | CLOSED |
| `PROD-P2-6` | P2 | **CLOSED / RECONCILED** | Card + catalog supporting text | `product-card` / `product-grid` CSS | Runtime main-surface uses `--text-secondary`; light+dark usable in MOBILE-MAIN-SURFACE polish | — | CLOSED |
| `PROD-P2-7` | P2 | **CLOSED** | Mobile collection ops | `product-card.tsx` | SKU / stock / availability visible; Final QA 390 | — | CLOSED |
| `PROD-P2-8` | P2 | **CLOSED** | Mobile header density | `products-header-actions.*` + toolbar | Closed by `ADMIN-PRODUCTS-MOBILE-MAIN-SURFACE-HARD-VISUAL-POLISH-1` | — | CLOSED |
| `PROD-P2-9` | P2 | **CLOSED** | Admin action redirect passthrough | `lib/admin/action-errors` + actions | `ADMIN-ACTION-REDIRECT-PASSTHROUGH-FIX-1` CLOSED | — | CLOSED |
| `PROD-P2-10` | P2 | **CLOSED** | Edit + availability vs stock | stock/availability contract | Closed with contract fix LIVE | — | CLOSED |

### P3

| ID | Status | Surface | Summary |
|----|--------|---------|---------|
| `PROD-P3-1` | **CLOSED** (collection responsive) | Collection | 899 cards / two-column expected; Final QA cards @899 |
| `PROD-P3-2` | OPEN (non-blocking) | Responsive system | Multiple thresholds remain; not release-blocking |
| `PROD-P3-3` | OPEN (inert) / tied to infra | Console | Inert while transforms blocked (`PROD-P2-1`) |
| `PROD-P3-4` | **CLOSED (mobile portion)** | Toolbar + catalog header | Mobile summary dedupe + compact filters via MOBILE-MAIN-SURFACE polish; desktop summary retained |
| `PROD-P3-5` | OPEN (non-blocking) | Page semantics / shared shell | Heading hierarchy polish — OUT OF SCOPE / SHARED SHELL for multi-h1 |
| `PROD-P3-6` | OPEN (non-blocking) | Product card | Hidden category line residue |
| `PROD-P3-7` | OPEN (non-blocking) | Microcopy | Drag/usted copy polish |
| `PROD-P3-8` | **CLOSED (main-surface portion)** | Keyboard affordance | Header/toolbar `:focus-visible` present; not project-wide |
| `PROD-P3-9` | **CLOSED** | Filtered state | Single Clear Filters owner; Final QA confirmed |
| `PROD-P3-10` | OPEN (external) | Shared admin shell | Intermittent hydration; outside Products |
| `PROD-P3-11` | **CLOSED** | Documentation | Collection architecture reconciled (single active tree) |
| `PROD-P3-12` | **CLOSED** (DB) / generator LOCAL | SKU | Business-scoped unique invariant LIVE; generator/retry local undeployed until release |
| `PROD-P3-13` | **CLOSED** | Copy vs behaviour | Addressed with stock/availability contract phases |
| `PROD-P3-14` | **CLOSED** | Edit / images | REMOVE affordance + lifecycle |
| `PROD-P3-15` | **CLOSED FOR FORWARD LIFECYCLE** | Storage hygiene | DELETE policy LIVE; historical orphans **DEFERRED** |
| `PROD-P3-16` | **CLOSED** | Availability toggle | User-visible error feedback |
| `PROD-P3-17` | **CLOSED** | Copy public link | `role="status"` `aria-live="polite"` announces success/failure |
| `PROD-P3-18` | **CLOSED** | Edit form | Dirty / unsaved-changes — `ADMIN-PRODUCTS-EDIT-DIRTY-STATE-UX-CONTRACT-1` |

### Final QA accepted debt (2026-09-11)

| Debt | Status |
|------|--------|
| Image Delivery Reconciliation | **BLOCKED / ACCEPTED INFRA DEBT** |
| Historical image orphan cleanup | **DEFERRED / NOT EXECUTED** |
| Real camera JPEG 3–10 MB Final QA | **DEFERRED / ACCEPTED NON-BLOCKING QA DEBT — OWNER DECISION** (not PASS; fixture unavailable; does not block release) |
| Real photographic byte budget | **CLOSED BY OWNER PRODUCT DECISION** — `ADMIN-PRODUCTS-CLIENT-IMAGE-OPTIMIZATION-BYTE-BUDGET-DECISION-1`: preferred ≤90 KiB; quality-preserving outlier >90 and ≤150 KiB; hard miss >150 KiB. Prior 135.43 KiB @640 accepted as outlier under new contract. |
| Image optimizer selection (800-first) | **CLOSED** — `ADMIN-PRODUCTS-CLIENT-IMAGE-OPTIMIZATION-800-FIRST-SELECTION-1`: largest valid dimension first; 800 ≤150 outlier beats smaller-dimension ≤90; highest-quality ≤150 outlier retained |
| HEIC real-device QA | **ACCEPTED QA DEBT** |
| Verify corpus (2 stale asserts) | **CLOSED — ADMIN-PRODUCTS-VERIFY-CORPUS-RECONCILIATION-1 — 12/12 PASS** |
| ESLint circular-config crash | **KNOWN TOOLING DEBT / NON-BLOCKING** |

## 33. Blast Radius Index

| File / area | Risk | Why | Safe changes |
|-------------|------|-----|--------------|
| `supabase/migrations/**`, RLS policies, `tr_auto_suspend_out_of_stock` | **CRITICAL** | Governs tenant isolation, availability semantics and every consumer of `products`. The trigger silently rewrites `is_available` | Only via an authorized migration phase with an explicit rollback and a public-visibility regression pass |
| `create_order` RPC / stock ledger | **CRITICAL** | Money and inventory; transactional guarantees | Out of scope for Products phases |
| `app/admin/(protected)/products/actions.ts` | **HIGH** | Admin write surface for `public.products` (Create + `saveProductEditDraftAction` → RPC; `updateProductAction` LEGACY); owns permission, tenant checks and invalidation | Additive validation; never weaken tenant/permission gates or Edit draft RPC contract |
| `lib/products/admin.ts` | **HIGH** | Feeds Products **and** the Orders manual-order modal (`getManualOrderProductOptions`) | Fixing the `q` filter is safe and contained; changing the projection or page size affects Orders |
| `lib/catalog/public-cache-tags.ts` | **HIGH** | Public freshness for all admin domains | Do not narrow existing scopes |
| `lib/supabase/image-loader.ts`, `next.config.ts` images | **HIGH** | Shared with the **public catalog**; a regression breaks customer-facing imagery | Only inside a dedicated image phase with public-catalog QA |
| `lib/admin/context.ts`, `permissions.ts` | **HIGH** | Auth for every admin route | Do not touch from a Products phase |
| `lib/admin/action-errors.ts` | **MEDIUM-HIGH** | Shared by 10 action files (`PROD-P2-9`) | A redirect-aware rethrow is safe but must be verified across all domains |
| `products-management-provider.tsx` | **MEDIUM** | Owns the flyout state machine and the auto-open rule | Adding an unfiltered count and splitting the empty signals is contained |
| `page.tsx` (query composition) | **MEDIUM** | Adding an unfiltered count adds a query | Contained; watch the extra round-trip |
| `flyout-panel.tsx` | **MEDIUM** | Shared by all three flyout forms | Focus management is additive; reuse the manual-order modal pattern |
| `create-product-form.tsx` / `edit-product-form.tsx` | **MEDIUM** | Direct browser→Storage upload; form contracts | Copy, validation and dirty-state work is contained |
| `product-catalog-views.tsx` | **MEDIUM** | Changing the dual mount alters SSR/hydration for the whole collection | Prefer a conditional render only with full 360→1440 QA |
| `products-toolbar.tsx`, `product-table-view.tsx`, `product-grid-server.tsx`, `product-card.tsx` | **LOW-MEDIUM** | Feature-local presentation | Markup and layout changes with a responsive pass |
| `components/admin/products/*.module.css` | **LOW** | Feature-local, no global selectors | Token-based visual work |
| `product-catalog-empty-state.tsx`, `products-header-actions.tsx`, `product-pagination.*` | **LOW** | Leaf components | Copy, hierarchy, density |

## 34. Safe Modification Matrix

| Future phase | Owners it may touch | Must not touch | Extra QA |
|--------------|---------------------|----------------|----------|
| **VISUAL CARD POLISH** | `product-card.*`, `product-grid*`, `product-catalog-skeleton.*` | actions, loaders, provider | 360/390/719/899 + light/dark |
| **MOBILE CAPABILITY PARITY** | `product-card.*`, `product-grid-server.tsx`, `product-pagination.*` | `actions.ts` write logic | Parity matrix re-run; keep 44px and single-tap |
| **FILTER LOGIC** | `lib/products/admin.ts` query builder, `page.tsx` counts, `products-toolbar.tsx`, provider | RLS, actions | Zero-result, combined filters, `,`/`%`/`(` inputs, pagination reset |
| **CREATE/EDIT FORM** | both forms, `product-form.module.css`, `image-crop-modal.*` | `actions.ts` tenant/permission blocks | create+edit × light/dark × keyboard; no-op save |
| **AVAILABILITY** | `product-availability-toggle.*`, `saveProductEditDraftAction` / RPC payload shape (`updateProductAction` LEGACY only) | the trigger, unless separately authorized | Desktop inline + edit + public catalog + zero-stock interaction |
| **IMAGES** | `image-loader.ts`, `next.config.ts`, callsite widths | Supabase billing/config without explicit tokens | **Public catalog blast radius**: admin card/table + public catalog + fallback |
| **FLYOUT A11Y** | `flyout-panel.tsx`, `flyout-panel.module.css` | provider state machine | Escape, focus entry/containment/return, overlay, SR pass |
| **RLS / ROLE ENFORCEMENT** | migrations + policies | anything else, same phase | Per-role matrix (owner/manager/operator/viewer) against PostgREST directly |
| **GLOBAL ADMIN LAYOUT** | — | **Out of scope unless separately authorized** | — |

## 35. Required QA Matrix

| Change type | Required QA |
|-------------|-------------|
| **Filter / search** | Query with results; zero result; **input containing `,`, `%`, `(`**; clear filters; combined filters; page reset; filtered vs catalog-empty distinction |
| **Card** | 360 / 390 / 719 / 899; light + dark; touch target ≥44px; keyboard activation |
| **Table** | 900 / 1024 / 1440; column integrity; inline toggle; actions menu |
| **Form** | Create + edit; light + dark; keyboard-only; required-field validation; image with and without; no-op save |
| **Availability** | Desktop inline toggle; edit-form toggle; **zero-stock interaction**; public catalog reflects the change; failure feedback |
| **Stock** | `0` / `1–5` / `>0` filters; create with stock 0; edit stock to 0; `track_stock` on/off; public visibility after each |
| **Image** | Admin card + admin table + public catalog + preview; transform path and fallback path; oversized source |
| **Flyout** | Escape; overlay click; focus entry/containment/return; scroll lock; sticky footer overlap |
| **Any server action** | Owner and manager succeed; operator and viewer are redirected, not shown a raw error; foreign `product_id` rejected |
| **Any mutation** | `/admin/products` fresh; `/b/{slug}/catalogo` fresh; preview fresh |

## 36. Recommended Roadmap

Historical sequence (2026-09-08) executed through certified microphases. **Current next:**

| # | Phase | Status |
|---|-------|--------|
| ★ | `ADMIN-PRODUCTS-CLIENT-IMAGE-OPTIMIZATION-BYTE-BUDGET-DECISION-1` | **CLOSED** — preferred ≤90 KiB; outlier ≤150 KiB; miss >150 KiB |
| ★ | `ADMIN-PRODUCTS-CLIENT-IMAGE-OPTIMIZATION-REAL-ASSET-QA-2` | **CLOSED AS FIXTURE-UNAVAILABLE** — phone QA → accepted non-blocking debt |
| ★ | `ADMIN-PRODUCTS-CLIENT-IMAGE-OPTIMIZATION-800-FIRST-SELECTION-1` | **CLOSED** — largest-dimension-first; 800 ≤150 beats smaller ≤90 |
| ★ | `ADMIN-PRODUCTS-MOBILE-MAIN-SURFACE-HARD-VISUAL-POLISH-1` | **CLOSED** — mobile main surface density + Abrir catálogo público |
| ★ | `ADMIN-PRODUCTS-CREATE-MOBILE-VIEWPORT-VISUAL-POLISH-1` | **CLOSED** — Create flyout `100dvh` + short-viewport CTA + density |
| ★ | `ADMIN-PRODUCTS-CREATE-STOCK-DEFAULT-UX-CONTRACT-1` | **CLOSED** — Create track_stock ON default + stock UX + footer bleed |
| ★ | `ADMIN-PRODUCTS-CREATE-MOBILE-FINAL-VISUAL-QA-1` | **CLOSED / FROZEN** — Create mobile production-ready |
| ★ | `ADMIN-PRODUCTS-CREATE-MOBILE-STICKY-FOOTER-END-STATE-POLISH-1` | **CLOSED** — MID/END footer trailing pad CASE B |
| ★ | `ADMIN-PRODUCTS-CREATE-REQUIRED-FIELD-AFFORDANCE-1` | **CLOSED / FROZEN** — Create `*` markers + legend; native required authority |
| ★ | `ADMIN-PRODUCTS-CREATE-REQUIRED-MARKER-SPACING-POLISH-1` | **CLOSED** — unified `*` gap via `.fieldLabelInline` column-gap |
| ★ | `ADMIN-PRODUCTS-EDIT-DIRTY-STATE-UX-CONTRACT-1` | **CLOSED** — Edit dirty / unsaved close; PROD-P3-18 |
| ★ | `ADMIN-PRODUCTS-EDIT-SIMPLE-MOBILE-VISUAL-UX-PARITY-1` | **CLOSED** — Edit base-form mobile visual parity with Create |
| ★ | `ADMIN-PRODUCTS-EDIT-STICKY-FOOTER-RELEASE-STATE-POLISH-1` | **CLOSED / FROZEN** — Edit header-seam CTA remnant; EDIT BASE FORM FINAL |
| ★ | `ADMIN-PRODUCTS-EDIT-CUSTOMIZATION-OVERRIDES-MOBILE-DENSITY-POLISH-1` | **CLOSED / FROZEN** — historical density; presentation superseded |
| ★ | `ADMIN-PRODUCTS-EDIT-CUSTOMIZATION-PROGRESSIVE-DISCLOSURE-ACCORDION-1` | **CLOSED / FROZEN** — Avanzado accordion + Eye/EyeOff presentation |
| ★ | `ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-CONTRACT-DECISION-1` | **APPROVED / NOT IMPLEMENTED** — unified draft + RPC atomicity |
| ★ | Unified draft DB author → apply → implement → Final QA | **NEXT** |
| ★ | Product removal decision | DEFERRED relative to unified-draft track |
| ★ | Owner Edit personalizable mobile visual QA | PENDING OWNER |
| ★ | `ADMIN-PRODUCTS-COMMIT-PUSH-DEPLOY-1` | **PAUSED** |
| — | Real phone JPEG QA | **ACCEPTED QA DEBT / POST-RELEASE OPTIONAL** |
| ★ | Verify corpus reconciliation (2 stale asserts) | **CLOSED — 12/12 PASS** (`ADMIN-PRODUCTS-VERIFY-CORPUS-RECONCILIATION-1`) |
| — | `ADMIN-PRODUCTS-IMAGE-DELIVERY-RECONCILIATION-1` | **BLOCKED / ACCEPTED INFRA DEBT** (`PROD-P2-1`) |
| — | Historical image orphan cleanup | **DEFERRED** |
| — | Residual polish (`PROD-P2-6`/`P2-8`, selected P3) | Optional post-release |

Original 2026-09-08 ordered plan (preserved for history): search sanitize → empty-state → stock contract → RLS role → image delivery → mobile density → flyout a11y → redirect errors → optional dual-mount / shell hydration.

## 37. Changelog

```txt
2026-09-15  ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-CONTRACT-DECISION-1
Approved ONE EDIT DRAFT target: Eye local-only; Save owns base+overrides+image;
Edit category read-only app-level; atomicity via SECURITY DEFINER RPC migration;
sticky spans Advanced; old mixed persistence/dirty/sticky/category editable
approved to supersede. Runtime edits 0. Next: DB-AUTHOR-1. Release PAUSED.

2026-09-15  ADMIN-PRODUCTS-EDIT-CUSTOMIZATION-PROGRESSIVE-DISCLOSURE-ACCORDION-1
Avanzado collapsed-by-default disclosure; group accordion (one open);
options nested; Eye/EyeOff visibility; flat Secciones/Opciones superseded.
Domain/dirty/flyout frozen. Density verify reconciled. Next: PRODUCT REMOVAL.
Release PAUSED.

2026-09-15  ADMIN-PRODUCTS-EDIT-CUSTOMIZATION-OVERRIDES-MOBILE-DENSITY-POLISH-1
ProductCustomizationOverridesPanel mobile density: compact intro/summary,
dense section/option rows (~141→~109px @412), 44px actions, short mobile
labels + aria-label, counts from existing arrays. Dirty/flyout/Edit/Create
frozen. Domain unchanged. Next: PRODUCT REMOVAL DECISION. Release PAUSED.

2026-09-15  ADMIN-PRODUCTS-EDIT-STICKY-FOOTER-RELEASE-STATE-POLISH-1
CASE A: exiting sticky Guardar CTA clipped at `.body` top under header seam
(blue 14px capsule). Fix: Edit-only headerReleaseClip::after 32px lip +
bodyReleaseClip pad. Create unchanged. EDIT BASE FORM FINAL CLOSED / FROZEN.
Next: customization overrides density. Release PAUSED.

2026-09-15  ADMIN-PRODUCTS-EDIT-SIMPLE-MOBILE-VISUAL-UX-PARITY-1
Edit base-form mobile visual parity with Create: required affordance,
compact toggles (no Activo/Inactivo), mobile full-bleed CTA, dirty frozen,
customization panel internals unchanged. Next: overrides density polish.
Doc: docs/admin-products-edit-simple-mobile-visual-ux-parity-1.md

2026-09-15  ADMIN-PRODUCTS-EDIT-DIRTY-STATE-UX-CONTRACT-1
Edit dirty-state UX: baseline snapshot vs current; Save gated by isDirty;
dirty close confirmation; image intent in snapshot; overrides excluded.
PROD-P3-18 CLOSED. Next: Edit simple mobile visual UX parity. Release PAUSED.
Doc: docs/admin-products-edit-dirty-state-ux-contract-1.md

2026-09-14  ADMIN-PRODUCTS-CREATE-REQUIRED-MARKER-SPACING-POLISH-1
Create marker spacing: Categoría * flush caused by `.admin-field span
{ margin: 0 }` overriding mark margin. Spacing owner → fieldLabelInline
inline-flex + column-gap. Create FINAL CLOSED / FROZEN. Owner polish COMPLETE.
Next: Edit simple mobile visual QA. Release PAUSED.
Doc: docs/admin-products-create-required-marker-spacing-polish-1.md

2026-09-14  ADMIN-PRODUCTS-CREATE-REQUIRED-FIELD-AFFORDANCE-1
Create required-field affordance: * markers on Nombre/Categoría/Precio/Stock
inicial + legend. Native required authority. Create FINAL CLOSED / FROZEN.
Next: Edit simple mobile visual QA. Release PAUSED.
Doc: docs/admin-products-create-required-field-affordance-1.md

2026-09-14  ADMIN-PRODUCTS-CREATE-MOBILE-STICKY-FOOTER-END-STATE-POLISH-1
Create sticky footer END-state: CASE B — `.createForm.shell` padding-bottom
0.875rem visible only at max scroll (footerToBody 14→0). Create FROZEN again.
Next: Edit simple mobile visual QA. Release PAUSED.
Doc: docs/admin-products-create-mobile-sticky-footer-end-state-polish-1.md

2026-09-13  ADMIN-PRODUCTS-CREATE-MOBILE-FINAL-VISUAL-QA-1
Create mobile final hard visual QA PASS. Bottom gap ARTIFICIAL (empty
feedback 5.25rem spacer) → removed; empty feedback collapses; gap 128→36.
Create FROZEN. Next: Edit simple mobile visual QA. Release PAUSED.
Doc: docs/admin-products-create-mobile-final-visual-qa-1.md

2026-09-13  ADMIN-PRODUCTS-CREATE-STOCK-DEFAULT-UX-CONTRACT-1
Create: track_stock default ON (initial + success reset); Stock inicial;
compact helper; calm zero-stock info; Activo/Inactivo removed from Create;
focus-visible switch ring; Create mobile footer full-bleed / CTA inset.
Edit Stock actual + persisted track unchanged. Actions/DB unchanged.
Next: CREATE-MOBILE-FINAL-VISUAL-QA-1. Release PAUSED.
Doc: docs/admin-products-create-stock-default-ux-contract-1.md

2026-09-13  ADMIN-PRODUCTS-CREATE-MOBILE-VIEWPORT-VISUAL-POLISH-1
Create flyout: 100vh→100dvh; safe-area footer; Create mobile CTA full-width;
density + dropzone copy. Stock defaults frozen. Edit shared-shell guard PASS.
Next: CREATE-STOCK-DEFAULT-UX-CONTRACT-1. Release PAUSED.
Doc: docs/admin-products-create-mobile-viewport-visual-polish-1.md

2026-09-12  ADMIN-PRODUCTS-MOBILE-MAIN-SURFACE-HARD-VISUAL-POLISH-1
Mobile main surface: 3-col secondary actions; Abrir catálogo → public route;
desktop preview preserved; 3-col native filters; summary/Por categorías dedupe;
copy-link aria-live status. Closed P2-6/P2-8 + P3-4(mobile)/P3-8(main)/P3-17.
Release still PAUSED for Create/Edit mobile visual QA.
Doc: docs/admin-products-mobile-main-surface-hard-visual-polish-1.md

2026-09-11  ADMIN-PRODUCTS-CLIENT-IMAGE-OPTIMIZATION-800-FIRST-SELECTION-1
Selection: largest valid dimension first; ≤90 preferred; ≤150 highest-quality
outlier; 720/640 only when larger dim has no ≤150. Runtime:
product-image-optimization.ts (+ focused verify). Photo reprobe 640@146.56 KiB
q.70 (800/720 all >150 — legitimate). Phone JPEG QA → accepted non-blocking debt.
Next: ADMIN-PRODUCTS-COMMIT-PUSH-DEPLOY-1.
Doc: docs/admin-products-client-image-optimization-800-first-selection-1.md

2026-09-11  ADMIN-PRODUCTS-FINAL-FUNCTIONAL-VISUAL-QA-1
Final integrated QA / closeout on local Products package.
Result: PASS WITH ACCEPTED NON-BLOCKING DEBT — ready for
ADMIN-PRODUCTS-COMMIT-PUSH-DEPLOY-1.
Reconciled debt register: Products P0=0, P1=0, release-blocking P2=0.
Closed (certified + Final QA): P1-1…P1-4, P2-2…P2-5, P2-7, P2-9, P2-10,
P3-1/9/11/12/13/14/15(forward)/16.
Accepted remaining: P2-1 Image Delivery infra; historical orphans deferred;
real JPEG + HEIC real-device QA debt; verify corpus **CLOSED 12/12**; ESLint tooling debt;
residual non-blocking polish (P2-6/8, selected P3).
Runtime mutations during Final QA: 0. Runtime source edits: 0.
Collection architecture now single active tree (not dual-mount).
Doc: docs/admin-products-final-functional-visual-qa-1.md

2026-09-08  ADMIN-PRODUCTS-LIVING-AUDIT-1
Living source of truth established from source + authenticated runtime audit.
Supersedes the old Products section inside the general admin forensic audit for
detailed Products ownership.
Added the server-action, loader, RLS, trigger and storage layers, which the prior
visual/mobile audit did not cover.
New: PROD-P1-2 (RLS enforces tenant but not role), PROD-P1-3 (comma in search
crashes the page), PROD-P1-4 (stock-0 auto-suspend silently hides new products),
PROD-P2-9, PROD-P2-10, PROD-P3-12 … PROD-P3-18.
Refined: PROD-P2-2 (DOM duplicated, images not), PROD-P2-7 (mobile can edit; gap is
at-a-glance data, inline availability and pagination).
Reclassified: PROD-P2-1 as pre-existing infra debt blocked on billing authorization.
Confirmed (at audit time): Products collection was dual renderer / dual mount with a
CSS visibility switch at 900px — later superseded by single active tree architecture.
```
