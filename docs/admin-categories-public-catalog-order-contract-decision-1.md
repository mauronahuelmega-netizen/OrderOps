# ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-CONTRACT-DECISION-1

# Result

**PASS — PUBLIC CATEGORY ORDERING V1 CONTRACT APPROVED / IMPLEMENTATION NOT STARTED**

# Product Intent

Merchant controls the order of **categories** in the public catalog (e.g. Hamburguesas → Pizzas → Empanadas → Bebidas → Postres), via a discoverable control on `/admin/products` Category filter — not a buried `/admin/categories`-only workflow.

# Scope

Decision + forensic contract only. No migration, no runtime, no CSS, no deps, no business mutations.

# Non-Goals

- Manual product ordering inside categories
- Drag products between categories
- Category CRUD expansion / Create Category inside filter surface
- Main-nav redesign for `/admin/categories`
- Replacing Stock/Estado native selects
- Installing DnD packages in this phase
- Authoring SQL/RPC/RLS now

# Preflight

| Field | Value |
|-------|-------|
| branch | `main` |
| HEAD | `c9af635e27ad86e0731eea0a90b16b9b628d5aa6` |
| dirty | PRE-EXISTING Products package preserved |

# Source Census

| Area | Key owners |
|------|------------|
| Public load | `lib/catalog/public.ts` → `loadPublicCatalogByBusinessId` |
| Public render | `components/public/catalog/catalog-client.tsx`, `category-nav.tsx` |
| Public page | `app/b/[slug]/catalogo/page.tsx`, `components/public/catalog/public-catalog-page.tsx` |
| Preview | same public catalog + `app/admin/(protected)/products/preview/page.tsx` iframe |
| Admin categories loader | `lib/categories/admin.ts` → `getAdminCategories` |
| Products filter | `products-toolbar.tsx` + page/provider |
| Mobile groups | `lib/products/selectors.ts` → `buildCategorySections` |
| Create select | `create-product-form.tsx` |
| Categories admin | `app/admin/(protected)/categories/page.tsx` + `actions.ts` |
| Schema | `types/database.ts`, `20260426215500_t2_categories_products.sql` |
| Reorder primitive | `sortable-reorder-list.tsx` (customization; HTML5 DnD + move controls) |
| Toast | `components/admin/admin-toast-provider.tsx` |

# Current Category Schema

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `business_id` | uuid NOT NULL | FK businesses |
| `name` | text NOT NULL | trim length > 0 |
| `position` | integer NULL | check `>= 0` or null |
| `created_at` | timestamptz NOT NULL | |

Ordering column exists?: **YES — `categories.position`**

Why it does not fully control merchant intent today:

- Create inserts `{ business_id, name }` only — **never writes `position`**
- Update updates `name` only
- No reorder action exists
- Live corpus: most rows `position IS NULL` (global null_positions≈6/8); La Burguesía has `BEBIDAS.position=90`, others null

Indexes: PK + uniqueness `(id, business_id)`. No unique `(business_id, position)`.

RLS: select/insert/update/delete own-business (+ super_admin). Mutative policies are **tenant-only** (not manageProducts-role gated — unlike Products post PROD-P1-2).

FK: `products.category_id` → categories **ON DELETE RESTRICT**. No app `deleteCategoryAction`.

# Current Category Authority

| Gate | Value |
|------|-------|
| App permission | `manageProducts` (`owner`/`admin`/`super_admin`/`manager`) |
| Page | `/admin/categories`, Products create-category |
| Actions | `createCategoryAction`, `updateCategoryAction` |
| operator/viewer | App denied; PostgREST category UPDATE historically still tenant-open |

**V1 principle:** category ordering uses the same `manageProducts` authority. No new permission.

# Current Public Category Ordering — Forensic Proof

**PUBLIC_CURRENT_CATEGORY_ORDER =**

```
ORDER BY categories.position ASC NULLS LAST, categories.name ASC
```

then client **filters** to categories with ≥1 public-visible product (`is_available=true` AND `archived_at IS NULL`), **preserving array order** — no re-sort by first product occurrence.

| Step | Evidence |
|------|----------|
| Query | `lib/catalog/public.ts` `.order("position", { ascending: true, nullsFirst: false }).order("name", { ascending: true })` |
| Grouping | `catalog-client.tsx` `categories.filter(...productsByCategoryId...)` |
| Products within category | `products.order("name", { ascending: true })` — **unchanged by this feature** |
| Alphabetical? | **Only as tie-breaker among equal/null `position`** — NOT the sole rule |
| First-product occurrence? | **NO** |
| created_at? | **NO** in public ORDER BY |

Runtime corroboration (La Burguesía, read-only):

| name | position | rendered order rule |
|------|----------|---------------------|
| BEBIDAS | 90 | first (non-null position before nulls) |
| COMBOS | null | then name ASC among nulls |
| EMPANADAS | null | |
| HAMBURGUESAS | null | |
| PIZZAS | null | |

# Current Admin Category Ordering

| Surface | Rule |
|---------|------|
| Products Category filter | `getAdminCategories` = same `position ASC NULLS LAST, name ASC` |
| Create Product select | same categories array; no client sort |
| Mobile card sections | `buildCategorySections(categories, products)` — category order = categories array |
| `/admin/categories` | same `getAdminCategories` |

# Public Rendering Pipeline

```
categories query (position, name)
  + products query (available, non-archived, name ASC)
→ cache tags
→ CatalogClient
→ filter categories with visible products
→ section map in category array order
→ CategoryNav same filter
```

Empty / unavailable-only / archived-only categories: **loaded but not rendered** publicly.

# Existing Category Consumers

| Consumer | Classification | V1 |
|----------|----------------|-----|
| Public catalog sections/nav | ORDER-SENSITIVE | **USE configured `position`** |
| Preview | ORDER-SENSITIVE | same as public |
| Products Category filter | ORDER-SENSITIVE | same order |
| Create Product select | ORDER-SENSITIVE | same order (native select) |
| `/admin/categories` list | ORDER-SENSITIVE | reflect order (read-only; no DnD there in V1) |
| Mobile Products groups | ORDER-SENSITIVE | same order |
| Customization category targets | ORDER-SENSITIVE (dropdown UX) | use configured order |
| Upsell category targets | ORDER-SENSITIVE (dropdown UX) | use configured order |
| Manual order product picker | ORDER-IRRELEVANT | products by name; category is label |
| Internal name maps without `.order()` | ORDER-IRRELEVANT | Map by id |

# Existing Dependencies / DnD Capability

| Item | State |
|------|-------|
| `@dnd-kit` / RBD / etc. | **ABSENT** |
| Existing reorder | `sortable-reorder-list.tsx` — HTML5 DnD + **Move up/down** keyboard controls; persists immediately (customization) |
| Lucide `GripVertical` | **unused** (available via lucide-react) |

**V1 decision:** **no new dependency**. Adapt customization pattern: grip drag + Move arriba/abajo; **local draft until Save** (unlike customization autosave).

# Existing Dialog / Popover / Sheet Primitives

`components/ui`: Button/Input/Card/Badge/skeleton only — **no** Popover/Sheet kit.

Established patterns: native `<dialog>` (Products/Create category), public cart sheet CSS, admin mobile drawer.

**V1 surface:** one native `<dialog>` (or project-equivalent dialog) switching Filter ↔ Order modes. No new design-system package.

# Native Select Invariant

**Stock** + **Estado**: remain native `<select>` — **FROZEN**.

**Category:** scoped exception **APPROVED**.

# Category Filter Exception Decision

**CATEGORY_FILTER_NATIVE_SELECT_EXCEPTION = APPROVED**

Rationale: Order mode cannot live inside native select; Stock/Estado need no reorder UX.

# Entry Point Decision

**APPROVED:** `/admin/products` Category filter control.

Rationale: categories already appear there; avoids nav redesign; matches owner intent.

# Filter Mode Contract

Closed trigger:

- no selection: **Categorías**
- selected: category **name** (ellipsis; accessible full name via `aria-label` / title)
- must still read as a **filter**, not a reorder tool — **no GripVertical** on closed trigger

Open Filter mode:

- title: Categorías
- options: **Todas** + all tenant categories in configured order
- select category → set `categoryId`, reset `page`, close, preserve `q`/`stock`/`status`
- Todas → clear `categoryId`, reset `page`, close
- footer affordance (≥2 categories): **Ordenar categorías** → Order mode (no URL change)
- 0–1 categories: hide/disable Ordenar

# Order Mode Contract

- Shows **all** tenant categories (not only filtered subset)
- Rows: GripVertical + name; row tap does **NOT** change `categoryId`
- Drag: grip only
- Local draft only during drag
- Footer: **Cancelar** | **Guardar orden**
- Preserve active `categoryId` / other filters across enter/save/cancel
- ≥2 categories required; else affordance hidden/disabled

# Drag Handle Contract

- Lucide **GripVertical**
- Accessible label: e.g. `Arrastrar para reordenar: {name}`
- Whole row is **not** the drag source (touch/scroll safety)

# Accessibility / Keyboard Reorder Contract

Pointer/touch: grip drag.

Keyboard/AT: **Subir** / **Bajar** controls per row (parity with `SortableReorderList`).

Also:

- Filter mode: listbox/dialog pattern — open, arrows, Enter select, Escape close, focus return
- Order mode: focus preserved after move; Save/Cancel in tab order; Escape discards draft (see below)
- Pointer-only sorting: **BLOCKED**

# Desktop Surface Decision

**One `<dialog>`** anchored/opened from Category trigger; Filter and Order are modes inside it.

# Mobile Surface Decision

**Same dialog primitive**, full-width / viewport-safe; internal list scroll; sticky Cancel/Save footer in Order mode; rows ≥48px; grip ≥44px; single scroll owner.

Tablet: same as mobile/desktop via existing breakpoints — dialog works both.

# Local Draft / Dirty Contract

- `persistedOrder` from server-loaded categories
- `draftOrder` local
- `isDirty` = semantic id-sequence inequality (move+revert → clean)
- Guardar disabled when pristine or pending
- No autosave on drag

# Save Contract

**ONE ORDER DRAFT = ONE SAVE = ONE ATOMIC SERVER OPERATION.**

No N client UPDATEs. No write if pristine.

# Data Model Decision

**Reuse existing `categories.position` (integer)** — do **not** add `sort_order` / parallel table.

| Aspect | Decision |
|--------|----------|
| Field | `categories.position` |
| Type | `integer NOT NULL` after backfill (nullable temporarily only during migration if needed) |
| Semantics | tenant-relative; **lower renders first** |
| Contiguous | **0..n-1** rewritten on each successful Save |
| Tie-breaker (queries) | `position ASC, name ASC, created_at ASC, id ASC` |
| Unique | recommend unique `(business_id, position)` after contiguous backfill |

# Position Semantics

`ORDER BY position ASC, name ASC, created_at ASC, id ASC` for all order-sensitive loaders (public already uses position+name; align admin to same full tie-break if tightening).

# Backfill Contract

**HARD:** post-migration visible category order = pre-migration query order.

Algorithm (conceptual):

```sql
-- For each business, rank by CURRENT public/admin loader rule:
ORDER BY position ASC NULLS LAST, name ASC, created_at ASC, id ASC
-- Assign contiguous positions 0..n-1 via row_number()-1
```

Do **not** backfill with name-only or created_at-only — that would reorder businesses where any non-null `position` already exists (e.g. BEBIDAS@90).

Existing tenants: **zero manual action**; visual order unchanged until merchant Saves a new order.

# New Category Contract

**APPEND** to end: `position = coalesce(max(position), -1) + 1` for that `business_id`.

Producers that must adopt append:

1. `createCategoryAction`
2. Any future category insert paths (none others today)

No alphabetical reshuffle of existing rows on create.

# Empty / Non-Public Category Contract

**All merchant categories participate in ordering** (including empty / unavailable-only / archived-only product sets).

Public catalog continues to **omit** categories with zero currently visible products, preserving relative configured order among those that remain visible.

# Public Catalog Render Contract

1. Load categories ordered by `position` (+ tie-breakers)
2. Attach public-visible products
3. Render only non-empty visible categories in that relative order
4. Products inside category: **current product order unchanged** (`name ASC` today)

# Admin Consumer Contract

| Surface | V1 |
|---------|-----|
| Category filter list | configured order |
| Create native select options | configured order |
| `/admin/categories` | configured order (display only; **no** Order UI in V1) |
| Mobile Products groups | configured order |

# Create Select Contract

Native `<select>` **remains**. Option order follows `position`. Control architecture unchanged.

# /admin/categories Contract

Consumes configured order for list display. Ordering UX owned by Products Category control only in V1.

# Other Consumers Matrix

See Existing Category Consumers — customization/upsell dropdowns use configured order; manual-order / id maps IRRELEVANT.

# Concurrency Contract

Atomic Save validates submitted id set equals current tenant category set (same members, no extras/missing/dupes/foreign).

If stale: reject with safe conflict; keep Order mode + draft; do not partial-save; prompt refresh/retry.

# Server Payload Contract

```ts
saveCategoryDisplayOrderAction({ orderedCategoryIds: string[] })
// or FormData with repeated ids
```

Client must **not** send `business_id`, numeric positions as authority, or names.

Server derives tenant from `requireAdminPermission("manageProducts")`.

# Transaction / RPC Decision

**Postgres RPC** (single transaction rewrite of all positions).

Reason: Supabase client cannot reliably batch multi-row updates as one transaction from the app without RPC.

# Security / RLS Contract

| Item | Decision |
|------|----------|
| Mechanism | `save_category_display_order(uuid[])` **SECURITY DEFINER**, hardened |
| Auth | `auth.uid()` present |
| Role | manageProducts-equivalent (owner/admin/manager/super_admin path) |
| Tenant | from profile `business_id` |
| ACL | revoke public execute; grant authenticated |
| search_path | pinned |
| Writes | only `categories.position` for caller tenant |
| Public writes | impossible |

Companion recommendation for DB-AUTHOR (defense in depth, not a new permission): align categories INSERT/UPDATE/DELETE policies with manageProducts roles (same class as Products PROD-P1-2). Order Save must not rely on operator-capable PostgREST UPDATEs.

# Cache Invalidation Contract

On successful Save:

- `revalidatePath("/admin/products")`
- `revalidatePath("/admin/categories")`
- `revalidatePublicCatalogCache({ scope: "catalog" })` (and customization if category-target UIs cached — prefer catalog minimum; include customization if those loaders are tag-scoped)

No `revalidatePath("/")`.

# Success / Error Contract

Success toast: **Orden de categorías guardado.** (`useAdminToast`)

Cancel / Escape: **0 writes**; discard draft; return Filter mode (no extra confirm — draft cheap/reversible).

Save failure: 0 partial writes; stay in Order mode; keep draft; safe error; retry allowed.

Stale set: specific safe message (categories changed; refresh and retry).

# Copy Contract

| Location | Copy |
|----------|------|
| Closed empty | Categorías |
| Closed selected | `{name}` (ellipsis) |
| Filter title | Categorías |
| First option | Todas |
| Order affordance | Ordenar categorías |
| Order title | Ordenar categorías |
| Helper | Arrastrá las categorías para definir el orden del catálogo. |
| Buttons | Cancelar · Guardar orden |
| Success | Orden de categorías guardado. |

# Responsive Contract

Implementation must later QA 360/390/412/899/900/≥961. Expectations: closed trigger fits 3-column toolbar; Stock/Estado footprint stable; Order list scrolls; footer sticky/reachable.

# Theme Contract

Light/dark via existing tokens. Neutral configuration chrome — no destructive styling.

# Decision Matrix

| # | Topic | CURRENT | DECISION | RATIONALE | IMPLEMENTATION |
|---|-------|---------|----------|-----------|----------------|
| 1 | Public order source | `position ASC NULLS LAST, name ASC` | Keep query shape; activate writes | Proven | Public already correct once positions set |
| 2 | Persistence | `position` unused by writes | Own `categories.position` | Column exists | No new column name |
| 3 | Model | nullable integer | Contiguous 0..n-1 NOT NULL post-backfill | Simple Save-all | Unique (business_id, position) |
| 4 | Backfill | mixed null/legacy | Rank by current ORDER BY | Preserve visible order | SQL row_number |
| 5 | New category | null position | APPEND max+1 | No reshuffle | createCategoryAction |
| 6 | Entry | filter select | Products Category control | Discoverability | Custom trigger |
| 7 | Native exception | all selects frozen | Category only | Order mode needs custom UI | Stock/Estado frozen |
| 8 | Filter mode | native select | List + Todas + Ordenar | Spec | Dialog mode A |
| 9 | Order mode | none | Grip draft + Guardar | Spec | Dialog mode B |
| 10 | Drag | none | GripVertical | Touch safety | Lucide |
| 11 | Keyboard | n/a | Move up/down | a11y | Adapt SortableReorderList |
| 12 | Desktop | select | One dialog | Existing primitive | `<dialog>` |
| 13 | Mobile | select | Same dialog | Consistency | Full-width |
| 14 | Save | n/a | Explicit atomic | No drag autosave | One RPC |
| 15 | Atomicity | n/a | Postgres RPC | True transaction | DB-AUTHOR |
| 16 | Server API | n/a | orderedCategoryIds[] | No client business_id | Action + RPC |
| 17 | Stale set | n/a | Reject + keep draft | Safety | RPC validate |
| 18 | Public | position query | Merchant order | Intent | Already wired |
| 19 | Admin filter | same loader | Same order | Orientation | Loader |
| 20 | Create select | same | Same order | Canonical | Options only |
| 21 | /admin/categories | same | Reflect order, no DnD V1 | Scope | Display |
| 22 | Cache | create/update paths | Products+categories+public catalog | Freshness | Action |
| 23 | Empty cats | hidden public | Still ordered | Future visibility | All rows |
| 24 | Archived-only | hidden public | Still ordered | Restore returns | All rows |
| 25 | Product order | name ASC | UNCHANGED / OUT OF SCOPE | Scope | None |
| 26 | Copy | — | Frozen Spanish set | Spec | UI strings |

# DB-AUTHOR Handoff

**Next phase:** `ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-DB-AUTHOR-1`

| Spec | Value |
|------|-------|
| Migration intent | Activate merchant category display order on existing `categories.position` |
| Column | `categories.position` (existing) |
| Type | integer |
| Nullability | backfill then NOT NULL (or NOT NULL with default 0 after contiguous assign) |
| Backfill | `row_number()-1` over `(PARTITION BY business_id ORDER BY position ASC NULLS LAST, name ASC, created_at ASC, id ASC)` |
| Constraint/index | unique `(business_id, position)`; keep non-negative check |
| New category append | create path must set `position = max+1` (trigger or app+RPC helper — prefer DB default/trigger or require create to compute) |
| RPC | `save_category_display_order(p_ordered_category_ids uuid[])` |
| Security | DEFINER, role+tenant hardened, pinned search_path, revoke public |
| Validation | array non-empty if categories exist; uuid; no dupes; exact set match tenant categories; foreign deny |
| Locking | lock tenant category rows / advisory as needed for concurrency |
| Idempotency | same order rewrite OK |
| Cache | n/a in SQL; app action invalidates |
| Optional companion | manageProducts-role gate on categories mutative RLS |

**Do not create migration in this phase.**

# Implementation Handoff

Likely owners (do not edit now):

- `products-toolbar.tsx` — Category trigger + surface
- new category filter/order dialog component (+ module.css)
- `categories/actions.ts` — `saveCategoryDisplayOrderAction`; create append
- `lib/categories/admin.ts` — loader already ordered
- `lib/catalog/public.ts` — already ordered (verify NOT NULL post-migration)
- Create select — option order only
- `/admin/categories` — display only
- customization/upsell category selects — consume ordered loader
- toast via `useAdminToast`
- focused verifies (future)

# Future Verification Plan

Future verifies must catch at least:

- public ignores position
- admin/Create order wrong
- new category not append
- backfill changes visible order
- client sends business_id
- duplicate/missing/foreign ids
- partial update / N updates
- drag autosave
- filter mutation in Order mode
- categoryId lost after reorder
- keyboard reorder missing
- touch drag vs scroll conflict
- Stock/Estado still native
- product order changed
- archived-only relative order loss

# Data Safety

categories/products/orders/Storage/schema/RLS/RPC/history mutations this phase: **0**

# Remaining Questions

**NONE** blocking DB-AUTHOR. Implementation may refine dialog CSS/motion timings without changing this contract.

# Next

**ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-DB-AUTHOR-1**

# Release

**COMMIT / PUSH / DEPLOY: PAUSED**
