# OrderOps Admin / Dashboard — Forensic Living Architecture Audit

```text
DOCUMENT TYPE: LIVING ARCHITECTURE SOURCE OF TRUTH
Scope: OrderOps Admin / Dashboard
Baseline audit: 2026-08-17
Last reconciled commit: 81b1162
Status: CURRENT
Maintenance rule:
Any future phase that changes admin/dashboard architecture,
visual ownership, shared primitives, route behavior,
data boundaries or reusable admin components
MUST reconcile this document before closeout.
```

**Preflight (baseline):** branch `main` · HEAD `81b1162` · dirty (unrelated public-catalog spacing polish + docs; do not confuse with admin baseline).

---

## Executive summary

Tenant admin lives under `app/admin` with:

1. Passthrough root layout + PWA metadata.
2. Auth/login outside `(protected)`.
3. `(protected)/layout.tsx` → `requireAdminContext` → `AdminToastProvider` → `AdminShell`.
4. Page width via `AdminPageLayout` sizes (`default` | `wide` | `narrow` | `operational`).
5. Dashboard orders = high-risk realtime/optimistic surface (`admin-dashboard-orders.tsx` + co-located hooks).
6. Products / customizations / settings = mostly feature-scoped modules + shared shell primitives.
7. **No** shared Dialog primitive — overlays are feature-local (`<dialog>`, portals, custom shells).
8. **No** single canonical Card owner — mix of `ui/Card`, `admin-surfaces.css`, and feature modules.
9. Public catalog tokens (`data-catalog-theme`) are **separate** from admin (`data-dashboard-theme`).

Verified at commit: `81b1162`

---

## Quick routing index

| I want to change... | Start here | CSS owner | Do not touch |
| --------------------- | ---------- | --------- | ------------ |
| Dashboard order cards | `components/admin/orders/order-card.tsx` | `order-card.module.css` | `use-admin-orders-realtime.ts`, reconciliation |
| Dashboard lanes / kanban | `DashboardKanbanBoard.tsx` (incl. terminal-lane pager) / board VMs in `lib/orders/*` | `dashboard-kanban.module.css` | realtime hooks, pending mutations |
| Dashboard overview KPIs | `DashboardOverview.tsx` / mobile twin | `DashboardOverview.module.css`, `DashboardMobileOverview.module.css` | board view-model correctness |
| Dashboard page width | `app/admin/(protected)/dashboard/page.tsx` → `AdminPageLayout size="operational"` | `admin-page-layout.css` | shell gutters only if intentional |
| Admin shell / sidebar | `admin-shell.tsx`, `layout/admin-sidebar.tsx` | `admin-shell.css`, `admin-sidebar.module.css` | auth layout |
| Admin page width (shared) | `admin-page-layout.tsx` | `admin-page-layout.css` | all consumers of each size |
| Products catalog UI | `products/page.tsx` + `products/*` | `products/*.module.css` | `products/actions.ts` unless scoped |
| Product form | `create-product-form.tsx` / `edit-product-form.tsx` | `product-form.module.css` | actions + image pipeline |
| Categories UI | `categories/page.tsx` + forms | `categories-layout.module.css` + `admin-surfaces` | category actions / sort if data-sensitive |
| Customizations builder | `owner-customization-builder.tsx` | `product-customization-admin.module.css` | `customizations/actions.ts` |
| Customizations cards | section/assignment/plus cards | tab `*.module.css` | DnD reorder actions |
| Customizations modals | `*-edit-modal.tsx`, `assign-section-modal.tsx` | same feature modules | validation / RPC side effects |
| Catalog preview shell | `catalog-preview-shell.tsx` | `catalog-preview-shell.module.css` | cookie/isolation (`lib/admin/catalog-preview*`), checkout guard |
| Settings hub / pages | `settings-shell.tsx`, hub/index | `settings-shell.module.css`, hub modules | permission gates |
| Operations open/close UI | `operations-settings-client.tsx` | `operations-settings.module.css` | `dashboard/actions.ts` session mutations |
| Shared buttons (legacy) | classes in `admin-surfaces.css` | `admin-surfaces.css` | HIGH blast |
| Shared UI Button | `components/ui/Button.tsx` | `globals.css` `.ui-button*` | public + admin consumers |
| Dark mode tokens | `app/theme-tokens.css` | same | public catalog theme attrs |
| Toasts | `admin-toast-provider.tsx` | `admin-toast.css` | call-site contracts |

---

## Route inventory

| Route | Page owner | Layout | Auth | Main component | CSS owner | Data owner | Mutations | Segment |
| ----- | ---------- | ------ | ---- | -------------- | --------- | ---------- | --------- | ------- |
| `/admin` | `app/admin/page.tsx` | `admin/layout` | soft (`getAdminContext`) | redirect | — | context | — | TENANT ADMIN |
| `/admin/login` | `login/page.tsx` | root admin | public | login form | `admin-login.module.css` | — | `login/actions.ts` | AUTH/LOGIN |
| `/admin/manifest.webmanifest` | `manifest.../route.ts` | — | public | JSON | — | `pwa-manifest.ts` | — | SHARED/PWA |
| `/admin/dashboard` | `(protected)/dashboard/page.tsx` | protected | `requireAdminContext` | `AdminDashboardOrders` | orders modules | `lib/orders/admin.ts` | orders + dashboard actions | TENANT ADMIN |
| `/admin/dashboard/orders` | `dashboard/orders/route.ts` | — | context | JSON list | — | `getAdminOrders` | — | TENANT ADMIN |
| `/admin/orders/[id]` | `orders/[id]/page.tsx` | protected | context | `order-detail-page-client` | order detail modules | `getAdminOrderById` | `[id]/actions.ts` | TENANT ADMIN |
| `/admin/orders/[id]/summary` | `summary/route.ts` | — | context | JSON hydrate | — | dashboard order by id | — | TENANT ADMIN |
| `/admin/orders/[id]/workspace` | `workspace/route.ts` | — | context | JSON workspace | — | order + events | — | TENANT ADMIN |
| `/admin/products` | `products/page.tsx` | protected | `manageProducts` | products shell + catalog | products modules | `lib/products/admin.ts` | `products/actions.ts` | TENANT ADMIN |
| `/admin/products/preview` | `preview/page.tsx` | protected | `manageProducts` | `CatalogPreviewShell` | preview module | cookie + iframe | `preview/actions.ts` | TENANT ADMIN |
| `/admin/products/customizations` | `customizations/page.tsx` | protected | `manageProducts` + flag | `OwnerCustomizationBuilder` | customization modules | `lib/product-customization/*` | `customizations/actions.ts` | TENANT ADMIN |
| `/admin/categories` | `categories/page.tsx` | protected | `manageProducts` | list + forms | categories module + surfaces | `lib/categories/admin.ts` | `categories/actions.ts` | TENANT ADMIN |
| `/admin/kitchen` | `kitchen/page.tsx` | protected | `viewOrders` + flag | stub | page layout | settings flag | — | TENANT ADMIN (roadmap) |
| `/admin/settings` | `settings/page.tsx` | protected | `manageNotifications` | `SettingsHubIndex` | settings hub modules | — | — | TENANT ADMIN |
| `/admin/settings/operations` | `operations/page.tsx` | protected | dual gate | `operations-settings-client` | operations module | store/settings | `operations/actions.ts` | TENANT ADMIN |
| `/admin/settings/notifications` | notifications page | protected | `manageNotifications` | notification cards | notification modules | — | `notifications/actions.ts` | TENANT ADMIN |
| `/admin/settings/team` | team page | protected | `manageTeam` | `AdminTeamSettingsView` | team module | `lib/admin/team.ts` | `team/actions.ts` | TENANT ADMIN |
| `/admin/settings/public` | public summary | protected | notifications enter / public edit | presence summary | public-settings CSS | business | `public/actions.ts` | TENANT ADMIN |
| `/admin/settings/public/landing` | landing editor | protected | `managePublicSettings` | presence editor | public modules | business | public actions | TENANT ADMIN |
| `/admin/settings/public/catalogo` | catalog hero editor | protected | `managePublicSettings` | catalog settings form | public modules | business | public actions | TENANT ADMIN |
| `/admin/team` | `team/page.tsx` | protected | — | redirect → settings/team | — | — | — | TENANT ADMIN |

**Super-admin** (`app/super-admin/**`) is out of body detail here; shares some UI primitives (`admin-surfaces`, `ui/*`).

Middleware (`middleware.ts`) refreshes session cookies for `/admin/*` but does **not** enforce auth redirects.

---

## Admin shell architecture

```text
/admin
  ↓ app/admin/layout.tsx (metadata / PWA only)
  ├─ /login  (outside protected)
  └─ /(protected)
       ↓ requireAdminContext()
       ↓ AdminToastProvider
       ↓ AdminShell
            ├─ AdminSidebar (+ AdminThemeToggle)
            ├─ AdminTopbar (+ AdminMobileDrawer)
            └─ main content (route children)
                 ↓ AdminPageLayout (per page)
                 ↓ feature surface
```

| Piece | File |
| ----- | ---- |
| Shell | `components/admin/admin-shell.tsx` |
| Sidebar | `components/admin/layout/admin-sidebar.tsx` |
| Nav config | `components/admin/admin-nav-config.ts` |
| Topbar | `components/admin/admin-topbar.tsx` |
| Mobile drawer | `components/admin/admin-mobile-drawer.tsx` |
| Brand | `components/admin/layout/admin-brand.tsx` |
| Footer | `components/admin/layout/admin-footer.tsx` |
| Theme toggle | `components/admin/layout/admin-theme-toggle.tsx` |

Shell CSS imported in `(protected)/layout.tsx`: `admin-shell.css`, `admin-header.css`, `admin-mobile-drawer.css`, `admin-page-layout.css`, `admin-page-header.css`, `admin-toast.css`, `public-settings.css`.

---

## Admin page layout system

| Primitive | Files | Routes using it | Controls | Blast radius |
| --------- | ----- | --------------- | -------- | ------------ |
| `AdminPageLayout` | `admin-page-layout.tsx` + `.css` | dashboard, products, preview, customizations, categories, kitchen, settings-shell, order detail | max-width + vertical gap by size | **HIGH** if changing padding/max-width |
| `AdminPageHeader` | `admin-page-header.tsx` + `.css` | products, categories, kitchen, preview, customizations, settings | title/actions row | MEDIUM |
| `SettingsShell` | `settings-shell.tsx` | all settings subroutes | wraps operational layout + settings nav | MEDIUM (settings only) |

### Size semantics (`admin-page-layout.css`)

| Size | Max-width | Used by |
| ---- | --------- | ------- |
| `default` | 980px centered | order detail |
| `narrow` | 760px | (available; few/no current pages) |
| `wide` | none | categories, kitchen |
| `operational` | none, tighter gap | **dashboard, products, preview, customizations, settings** |

**Who controls width**

- **Products / Dashboard / Customizations / Preview / Settings:** `AdminPageLayout size="operational"` → full content width inside shell (no 980 cap).
- **Categories / Kitchen:** `wide` (also uncapped).
- **Order detail:** `default` (980).
- **Shell gutters:** `admin-shell.css` main padding — separate from page layout max-width.

Customizations also adds class `admin-page-layout--customizations-mobile` (feature-specific responsive tweak).

---

## Visual ownership map

| Visual concept | Canonical owner | Shared? | Routes | Notes |
| -------------- | --------------- | ------- | ------ | ----- |
| Page shell | `AdminShell` | YES | all protected | |
| Page header | `AdminPageHeader` | YES | most CRUD/settings | dashboard uses feature headers inside orders CSS |
| Navigation | `admin-nav-config` + sidebar/drawer | YES | all protected | permission + feature flags |
| Buttons | **SPLIT** | partial | all | `ui/Button` **and** `admin-surfaces` `.admin-primary-button` / feature modules — **NO single owner** |
| Inputs | **SPLIT** | partial | forms | `ui/Input` + `.admin-field` surfaces + module inputs |
| Selects | feature-local | NO | products/settings/customizations | no shared Select primitive found |
| Tabs | feature-local | NO | customizations builder tabs | in `owner-customization-builder` + module CSS |
| Cards | **NO SINGLE CANONICAL OWNER** | — | — | Orders: order-card modules; Products: product modules; Customizations: section/assignment/plus cards; Settings: `settings-card`; also `ui/Card` + `admin-form-card` |
| Tables | products catalog table views | mostly products | products | |
| Empty states | **SPLIT** | partial | many | `ui/empty-state` + `.admin-empty-state` + feature empties |
| Badges / chips | `ui/Badge` + order status chips | partial | orders/products | status colors via theme tokens |
| Modals / dialogs | **NO shared Dialog** | NO | many | native `<dialog>` or portal shells per feature |
| Drawers | mobile admin drawer; product flyout | NO | shell / products | |
| Menus | feature actions menus | NO | customizations `actions-menu` | |
| Toasts | `AdminToastProvider` | YES | protected | |
| Tooltips | sparse / feature | UNKNOWN | — | no shared Tooltip owner confirmed |
| Loading / skeletons | `ui/skeleton`, products loading page | partial | products | |
| Focus states | tokens + per-component `:focus-visible` | YES/partial | all | do not blanket `outline: none` |
| Dark mode | `data-dashboard-theme` + `theme-tokens.css` | YES | admin | |
| Breakpoints | shell + feature CSS | YES | all | dashboard dual overview at 768; Kanban terminal pager ≥1200 |
| Mobile-specific renderers | dashboard only (dual mount) | — | dashboard | same route; CSS show/hide |
| Kanban terminal pager | `DashboardKanbanBoard` local presentation | NO | `/admin/dashboard` | compact navigation row above 4-lane grid; not overlay; local UI state only |
| Order assignment UI | `order-assignment-controls.tsx`, `order-card.tsx`, workspace/modal, lane metrics | partial | dashboard + order detail | claim/release self-assign; gated by `order_assignment_enabled` → `orderResponsibilityEnabled` |

```text
Cards:
NO SINGLE CANONICAL OWNER
Current implementations:
- Orders → order-card.module.css / kanban cards
- Products → products/*.module.css
- Customizations → reusable-section / assignment / plus cards
- Settings → settings-card.module.css
- Shared legacy → admin-surfaces .admin-form-card
- ui → components/ui/Card.tsx
Implication:
Do not assume card polish propagates globally.
```

```text
Modals:
NO SHARED DIALOG PRIMITIVE
- Orders workspace: admin-order-modal-shell (portal)
- Manual order: manual-order-modal
- Products: flyout-panel, image-crop-modal (portal), native dialogs in forms
- Customizations: native <dialog> edit/assign/options/plus modals
- Shell: admin-mobile-drawer (portal)
Implication:
Modal polish must be scoped per feature unless introducing a new shared primitive deliberately.
```

---

## Design tokens / theme

| Token family | Owner | Consumers | Safe to change globally? |
| ------------ | ----- | --------- | ------------------------ |
| Semantic Zinc/Indigo + status colors | `app/theme-tokens.css` | admin + some shared UI | **CAUTION** — also used outside pure admin |
| Dashboard theme attribute | `admin-theme-toggle.tsx` → `html[data-dashboard-theme]` | admin shell | YES for admin-only toggles |
| Catalog theme | public `data-catalog-theme` | public catalog | **DO NOT** mix into admin polish |
| Feature CSS vars | occasional in modules | feature | LOCAL |
| Business primary (brand) | runtime / settings | shell brand accents | tenant-specific |

Separate clearly:

- **GLOBAL TOKENS:** `theme-tokens.css`
- **ADMIN CHROME:** shell CSS + surfaces
- **FEATURE-SPECIFIC:** orders/products/customizations modules
- **PUBLIC CATALOG TOKENS:** catalog page vars — out of admin polish scope

---

## CSS ownership map

| CSS file | Scope | Main consumers | Blast radius |
| -------- | ----- | -------------- | ------------ |
| `app/theme-tokens.css` | GLOBAL | admin + UI | HIGH |
| `app/globals.css` | GLOBAL (+ residual admin helpers) | mixed | HIGH |
| `components/admin/admin-surfaces.css` | SHARED ADMIN | forms, buttons, empty | HIGH |
| `admin-shell.css` / header / topbar / mobile drawer | SHARED ADMIN | all protected | HIGH |
| `admin-page-layout.css` / `admin-page-header.css` | SHARED ADMIN | most pages | HIGH |
| `admin-toast.css` | SHARED ADMIN | toasts | MEDIUM |
| `orders/*.module.css` (~30+) | FEATURE | dashboard/orders | LOCAL–MEDIUM |
| `products/*.module.css` | FEATURE | products/preview | LOCAL |
| `product-customization*/**.module.css` | FEATURE | customizations | LOCAL |
| `settings/**/*.module.css` + `public-settings.css` | FEATURE | settings | LOCAL–MEDIUM |
| `admin-login.module.css` | AUTH | login | LOCAL |

**Absent (do not resurrect as owners):** `orders-admin.css`, `products-admin.css` (modularized away).

---

## Shared component inventory

| Shared component | File | Used by | Responsibility | Flag |
| ---------------- | ---- | ------- | -------------- | ---- |
| `AdminShell` | `admin-shell.tsx` | protected | chrome | HIGH BLAST |
| `AdminPageLayout` | `admin-page-layout.tsx` | most pages | width/rhythm | HIGH BLAST / SAFE FOR GLOBAL POLISH only with multi-route QA |
| `AdminPageHeader` | `admin-page-header.tsx` | CRUD/settings | headers | MEDIUM |
| `AdminToastProvider` | `admin-toast-provider.tsx` | protected | feedback | FUNCTIONAL — DO NOT STYLE CARELESSLY |
| `Button` | `ui/Button.tsx` | admin+public | actions | HIGH BLAST |
| `Input` / `Card` / `Badge` | `ui/*` | mixed | primitives | HIGH BLAST |
| Surfaces classes | `admin-surfaces.css` | forms | legacy kit | HIGH BLAST |

---

## Feature map — Dashboard / Orders

| Concern | Owner |
| ------- | ----- |
| Page | `app/admin/(protected)/dashboard/page.tsx` |
| Orchestrator | `components/admin/orders/admin-dashboard-orders.tsx` |
| CSS | `admin-dashboard-orders.module.css` + siblings |
| Server load | `getAdminOrders`, store session helpers |
| Silent refresh | `GET /admin/dashboard/orders` |
| Order hydrate | `GET /admin/orders/[id]/summary` |
| Workspace hydrate | `GET /admin/orders/[id]/workspace` |
| Lane UI | `DashboardKanbanBoard` + `OrderCard` list modes — desktop always 4 visible lanes; cancelled via local `"primary" \| "terminal"` pager in a compact board navigation row above the grid (not overlay; ≥1200px) |
| Overview | `DashboardOverview` + `DashboardMobileOverview` (≤768 swap) |
| Filters/search | dashboard toolbar / operational search components |
| Manual order | `manual-order-modal.tsx` → `create_order` RPC |
| Order assignment / responsable | `order-assignment-controls.tsx`, `order-card.tsx` (meta), workspace/modal, `orders/[id]/actions.ts` → `updateOrderAssignmentAction` | `order-detail-surfaces.module.css`, `order-card.module.css` | Tenant-gated by `business_settings.order_assignment_enabled` → `orderResponsibilityEnabled`. OFF hides presentation + blocks assignment mutations server-side. Helper: `lib/orders/assignment-flags.ts`. |
| OrderCard compact count/summary | `order-card.tsx` (render) | `order-card.module.css` | **Durable rule (2026-08-27):** `item_count` sums root order item quantities; compact `item_summary` lists root products only. Parent-linked upsell/Adicional child rows are excluded from compact card count/summary but remain in `order_items_preview`, workspace Products, WhatsApp/contact summary, pricing and detail. Derivation owner: `buildDashboardOrderCardSummary` in `lib/orders/dashboard-card-summary.ts` (uses `buildDashboardOrderItemTree`). Initial load (`buildAdminOrderDashboardItem`), summary hydrate and realtime patch must use the same helper. |

### Current derivation chain (source-accurate)

```text
props.orders (server)
  → optimisticOrders (+ ref)
  → buildDashboardBoardViewModel({ orders: optimisticOrders, filter, search, operationalWindow, ... })
      → visible / filtered / grouped / renderMode
  → metrics / lanes / queue pressure / toolbar VMs
  → Kanban | OrderCard list | empty
  → AdminOrderWorkspaceModal (selected order from optimistic set)
```

Realtime: event → optional optimistic patch → defensive hydrate (`/summary`) → silent refresh on recovery; **pending mutations** (TTL 8s) in `use-admin-orders-realtime.ts`.

**Pending status finalization invariant (2026-08-20):** `clearPendingMutationKind(..., "status")` mutates the Map entry in place (`delete pending.status`). Resolvers MUST snapshot `expectedStatus` / `previousStatus` / `externalStatus` / `mutationId` before clear. Late confirmation when no status entry remains is a safe no-op (idempotent across server-success / realtime / hydrate convergence). Do not read `pending.status.*` after clear.

---

## High-risk functional files

| File | Responsibility | Why high risk |
| ---- | -------------- | ------------- |
| `use-admin-orders-realtime.ts` | RT + pending mutations | Cross-session sync / echo suppression |
| `use-admin-presence.ts` | Presence | Operator visibility |
| `use-admin-store-session-realtime.ts` | Session RT | Operational window |
| `admin-dashboard-orders.tsx` | Orchestrator | Couples all dashboard UX |
| `lib/orders/dashboard-order-reconciliation.ts` | Reconcile | Stale/conflict correctness |
| `lib/orders/realtime.ts` | Channel helpers | Tenancy filters |
| `orders/actions.ts` (manual create) | `create_order` RPC | Money/totals |
| `orders/[id]/actions.ts` | Status/assignment | Operational mutations; assignment = claim/release on `assigned_to` |
| `order-assignment-controls.tsx` | Assignment UI | Claim/release; `updateOrderAssignmentAction` caller |
| `lib/orders/assignment-flags.ts` | Tenant assignment flag | Fail-closed read of `order_assignment_enabled` |
| `lib/orders/assignment.ts` | Assignment labels | Sin responsable / Tomar pedido copy |
| `lib/admin/catalog-preview.ts` (+ shared) | Preview cookie | Isolation / false orders |
| `catalog-preview-shell.tsx` | Preview UX | postMessage cart clear |
| `checkout/actions.ts` `shouldBlockCatalogPreviewOrder` | Preview guard | Security boundary |
| `lib/admin/context.ts` / `permissions.ts` | AuthZ | Tenant + role |

**DO NOT TOUCH DURING VISUAL POLISH** unless the phase explicitly scopes functional risk.

---

## Products architecture

| Layer | Owner |
| ----- | ----- |
| Page | `products/page.tsx` (`manageProducts`) |
| Actions | `products/actions.ts` |
| Lib | `lib/products/admin.ts`, image helpers |
| UI | catalog section/views, toolbar, flyout, create/edit forms, header actions |
| CSS | `components/admin/products/*.module.css` |
| Loading | `products/loading.tsx` |

Visual polish: prefer product modules. Avoid `admin-surfaces` / `ui/Button` unless intentional global change.

---

## Categories architecture

| Layer | Owner |
| ----- | ----- |
| Page | `categories/page.tsx` |
| Forms | `create-category-form.tsx`, `edit-category-form.tsx` |
| Actions | `categories/actions.ts` |
| Lib | `lib/categories/admin.ts` |
| CSS | `categories-layout.module.css` + surfaces |

Visual-only safe on layout module; mutating sort/name affects public catalog ordering — treat mutations as functional.

---

## Product customizations

```text
/admin/products/customizations
  page.tsx (flag + manageProducts)
  └─ AdminPageLayout operational (+ customizations-mobile class)
       └─ OwnerCustomizationBuilder
            ├─ tabs: product | category | sections | plus
            ├─ CustomizationAssignmentsSection
            ├─ ReusableSectionsTab (+ section/option modals, DnD)
            ├─ PlusSuggestionsTab (+ plus modals)
            ├─ ProductCustomizationOverridesPanel
            └─ AdminCustomizationLivePreview
```

| Concern | Owner |
| ------- | ----- |
| Flag | `lib/product-customization/flags.ts` ← `business_settings.product_customization_enabled` |
| Actions | `app/admin/(protected)/products/customizations/actions.ts` |
| Lib | `lib/product-customization/admin.ts`, shared/selection/validation |
| Width | `AdminPageLayout` operational |
| Cards/modals/menus | feature modules under `components/admin/product-customization/**` |
| Preview (admin live) | `admin-customization-live-preview.tsx` (not iframe catalog preview) |

### Customizations visual ownership

- **Page width:** `AdminPageLayout` + optional mobile class.
- **Header/tabs:** builder + `product-customization-admin.module.css`.
- **Cards:** reusable-sections / assignments / plus modules.
- **Modals:** native `<dialog>` in feature files.
- **Menus:** `actions-menu.tsx`.
- **Responsive:** feature CSS + layout mobile class.
- **Shared shell:** only page layout/header/toast — not card internals.

---

## Admin catalog preview

| Piece | Owner |
| ----- | ----- |
| Route | `/admin/products/preview` |
| Shell | `catalog-preview-shell.tsx` |
| Iframe | `/b/{slug}/catalogo?orderopsPreview=1` |
| Cookie | httpOnly `orderops-admin-catalog-preview`, path `/b/{slug}`, TTL ~300s, value `businessId` |
| Arm/clear | `preview/actions.ts` |
| Order block | `shouldBlockCatalogPreviewOrder` in public checkout actions |
| Pan/mobile-feel | **public** hooks (`use-preview-pointer-pan-scroll`) inside iframe, not admin shell |

### HIGH-RISK PREVIEW ISOLATION BOUNDARIES

- Do not loosen cookie path/TTL without security review.
- Do not remove checkout block for preview.
- Do not assume admin parent CSS applies inside iframe (public catalog owns iframe chrome).
- Cart clear relies on `postMessage` ACK — fragile to origin/message changes.

---

## Settings

| Route family | Shell | Notes |
| ------------ | ----- | ----- |
| Hub | `SettingsHubIndex` | permission-gated sections |
| Operations | client + actions | view vs mutate split |
| Notifications | cards + push hooks | |
| Team | `AdminTeamSettingsView` | `manageTeam` |
| Public / landing / catalogo | presence editor family | `managePublicSettings` for edits |

CSS: settings modules + `public-settings.css` (imported at protected layout — **settings blast into all admin pages** for those rules).

---

## Operations / store session

| Concern | Owner |
| ------- | ----- |
| Settings UI | `operations-settings-client.tsx` |
| Dashboard open/close | `dashboard/actions.ts` + session RT hook |
| Lib | `lib/store-sessions/*` |
| Coupling | dashboard operational window filters orders |

**Invariant:** order acceptance / window must stay consistent with store session + business settings; visual polish must not bypass session actions.

---

## Auth / roles / tenant boundary

```text
request
  → Supabase auth session (middleware refresh)
  → getAdminContext / requireAdminContext
       → profiles (role, business_id, prefs)
       → businessId tenant key
  → requireAdminPermission(permission)
  → page / server action
```

| Helper | File |
| ------ | ---- |
| Context | `lib/admin/context.ts` |
| Permissions | `lib/admin/permissions.ts` |
| Nav filter | `getAdminNavItemsForRole` |

**Invariants:** every query/mutation filters by `business_id`; `super_admin` normalized to owner-equivalent in business admin matrix when `business_id` present; no client-supplied tenant id as authority.

---

## Mutation map

| Domain | Action owner | Primary data | Revalidation / impact |
| ------ | ------------ | ------------ | --------------------- |
| ORDERS | `orders/actions.ts`, `orders/[id]/actions.ts` | orders, events | dashboard RT + silent refresh |
| PRODUCTS | `products/actions.ts` | products, images | products page |
| CATEGORIES | `categories/actions.ts` | categories | categories + public catalog |
| CUSTOMIZATIONS | `customizations/actions.ts` | groups/options/assignments/upsells/overrides | builder + public customization |
| SETTINGS / PUBLIC | `settings/public/actions.ts`, operations/notifications | businesses, settings | public surfaces |
| OPERATIONS / SESSIONS | `dashboard/actions.ts`, operations actions | store_sessions, scheduled settings | dashboard window |
| PREVIEW | `preview/actions.ts` | cookie only | iframe isolation |
| TEAM | `team/actions.ts` | profiles/membership | team UI |
| AUTH | `login/actions.ts`, `admin/actions.ts` | session | redirect |

---

## Data / server boundaries

- **Server loaders:** route `page.tsx` files call `lib/*/admin.ts` with user-scoped Supabase server client.
- **Service role:** used selectively (e.g. team) — treat as elevated.
- **Feature flags:** `business_settings` columns + customization flag helper.
- **Cache:** mix of request-time loads; preview cookie is short-lived; do not invent cache behavior here.
- **Client boundaries:** dashboard/products/customizations are heavy client islands; pages remain server for initial data.

---

## Overlay / modal architecture

**No shared Dialog/Menu/Sheet design-system component.**

Patterns in use:

| Pattern | Examples |
| ------- | -------- |
| Portal + `role="dialog"` | order modal shell, image crop, mobile drawer |
| Native `<dialog>` | customization edit/assign, product category dialogs |
| Feature flyout | products `flyout-panel` + `useScrollLock` |
| Toast provider | global admin feedback |

Focus traps / scroll locks are **per implementation** — visual polish must preserve existing a11y hooks.

---

## Responsive architecture

| Layer | Approach |
| ----- | -------- |
| Shell | desktop sidebar + mobile topbar/drawer |
| Dashboard | **SEPARATE MOBILE RENDERER** for overview (dual mount, CSS ≤768) — same DOM tree, not separate route |
| Products / customizations / settings | **SAME DOM + CSS responsive** |
| Preview | iframe = public mobile catalog; parent shell operational |

Observed dashboard breakpoints (orders CSS): ~389, 479, 720, 768, 1024, 1200, 1440.

---

## Dark mode architecture

| Area | Automatic via tokens | Feature overrides | Risk |
| ---- | -------------------- | ----------------- | ---- |
| Shell / surfaces | mostly yes | some | MEDIUM |
| Orders kanban / audio unlock | partial | `:global(html[data-dashboard-theme="dark"])` | LOCAL |
| Products / customizations | mostly modules + tokens | possible hardcodes | check per polish |
| Public iframe preview | catalog theme | independent | do not couple |

Toggle: `localStorage` `orderops-theme` + `data-dashboard-theme`.

---

## Blast radius index

### HIGH BLAST RADIUS

```text
AdminPageLayout / admin-page-layout.css
Used by: dashboard, products, preview, customizations, categories, kitchen, settings, order detail
Changing horizontal padding / max-width: HIGH BLAST RADIUS
Recommended for feature-specific fix: NO (prefer feature wrapper)

admin-surfaces.css
Used by: forms across products/categories/team/customization
Recommended for scoped visual fix: NO

theme-tokens.css / globals.css admin remnants
Recommended for scoped visual fix: NO without multi-surface QA

ui/Button, ui/Input, ui/Card
Used by: admin + often public
Recommended for admin-only polish: NO
```

### MEDIUM BLAST RADIUS

```text
AdminPageHeader, admin-shell.css, admin-toast.css, public-settings.css (layout-imported)
SettingsShell
```

### LOCAL / SAFE FOR SCOPED POLISH

```text
components/admin/orders/*.module.css (+ matching TSX markup-only)
components/admin/products/*.module.css
components/admin/product-customization/**/*.module.css
components/admin/settings/**/*.module.css (except layout-imported public-settings.css caution)
admin-login.module.css
catalog-preview-shell.module.css (parent chrome only — not iframe)
```

---

## Route → file index

```text
/admin
  page: app/admin/page.tsx
  main: redirect
  CSS: —
  loader: getAdminContext
  actions: —
  shared: —

/admin/login
  page: app/admin/login/page.tsx
  CSS: admin-login.module.css
  actions: login/actions.ts

/admin/dashboard
  page: (protected)/dashboard/page.tsx
  main: AdminDashboardOrders
  CSS: orders/*.module.css
  loader: getAdminOrders + store sessions
  actions: dashboard/actions.ts, orders/*
  shared: AdminPageLayout, AudioUnlockGate, toast

/admin/orders/[id]
  page: orders/[id]/page.tsx
  main: order-detail-page-client
  CSS: order detail modules
  actions: orders/[id]/actions.ts
  APIs: summary, workspace routes

/admin/products
  page: products/page.tsx
  main: products management shell
  CSS: products/*.module.css
  actions: products/actions.ts
  shared: AdminPageLayout/Header, ui primitives

/admin/products/preview
  page: preview/page.tsx
  main: CatalogPreviewShell
  CSS: catalog-preview-shell.module.css
  actions: preview/actions.ts
  shared: AdminPageLayout; isolation libs

/admin/products/customizations
  page: customizations/page.tsx
  main: OwnerCustomizationBuilder
  CSS: product-customization*.module.css
  actions: customizations/actions.ts
  shared: AdminPageLayout/Header

/admin/categories
  page: categories/page.tsx
  CSS: categories-layout.module.css + surfaces
  actions: categories/actions.ts

/admin/kitchen
  page: kitchen/page.tsx
  main: stub (feature flag)
  CSS: layout only

/admin/settings/**
  page: settings/*/page.tsx
  main: SettingsShell + feature clients
  CSS: settings modules + public-settings.css
  actions: settings/*/actions.ts, team/actions.ts
```

---

## File → consumer index

```text
components/admin/admin-page-layout.tsx
→ dashboard, products, preview, customizations, categories, kitchen, settings-shell, order-detail
→ page width/rhythm
→ HIGH

components/admin/admin-surfaces.css
→ product/category/team/customization forms (class consumers)
→ legacy form kit
→ HIGH

components/admin/orders/admin-dashboard-orders.tsx
→ /admin/dashboard only
→ orders board orchestrator
→ HIGH functional / LOCAL visual if CSS-only sibling

components/admin/orders/use-admin-orders-realtime.ts
→ dashboard orchestrator
→ realtime sync
→ HIGH functional

lib/admin/context.ts
→ protected layout, pages, actions
→ auth/tenant
→ HIGH

lib/admin/catalog-preview.ts
→ preview actions + checkout guard
→ preview isolation
→ HIGH

components/admin/product-customization/owner-customization-builder.tsx
→ customizations page
→ builder UX
→ LOCAL–MEDIUM

components/admin/products/catalog-preview-shell.tsx
→ preview page
→ iframe host UX
→ MEDIUM (isolation adjacent)
```

---

## Safe modification matrix

| Area | Visual-only safe? | Requires functional QA? | Why |
| ---- | ----------------- | ----------------------- | --- |
| Feature `*.module.css` (orders/products/customizations) | YES | light visual QA | scoped |
| Markup className-only in feature TSX | YES | light | avoid logic |
| `AdminPageLayout` CSS | NO (multi-route) | YES multi-route | high blast |
| `admin-surfaces.css` | NO | YES | shared forms |
| `theme-tokens.css` | CAUTION | YES admin+ | global |
| Order card CSS | YES | dashboard visual | keep status semantics |
| Realtime hooks | NO | full RT QA | sync |
| Product / customization actions | NO | functional | mutations |
| Preview cookie / checkout guard | NO | isolation QA | security |
| Dashboard orchestrator structure | NO | RT + UX | coupling |
| Native dialog markup a11y attrs | NO | a11y | focus/escape |

---

## Architectural invariants

1. **Tenant key is `business_id`** — never trust client-supplied tenant as authority.
2. **Protected admin requires `requireAdminContext`** — middleware alone is insufficient.
3. **Permissions matrix in `lib/admin/permissions.ts`** gates nav and mutations.
4. **Dashboard orders sync uses defensive reconciliation + pending mutations** — do not replace with naive polling/`router.refresh` for operational sync.
5. **Order totals / create_order are security-definer RPC paths** — admin manual create and public checkout must not reimplement totals in client.
6. **Product customization public behavior is flag-gated** — admin builder may load behind `manageProducts` + enabled flag.
7. **Catalog preview must not create real customer orders** — cookie + checkout block.
8. **Admin theme (`data-dashboard-theme`) ≠ public catalog theme (`data-catalog-theme`)**.
9. **Store session defines operational window** coupled to dashboard filtering / acceptance.
10. **No shared modal primitive** — do not assume one feature’s dialog styles apply elsewhere.
11. **Kanban terminal lane navigation is presentation-only** — realtime/domain lane derivation remains unchanged; local UI window state must not auto-navigate on new cancellations.
12. **Order responsibility is tenant-capability gated** — `business_settings.order_assignment_enabled` (default OFF). OFF hides assignment presentation and blocks assignment mutations server-side while preserving assignment data/realtime fields.
13. **Order code vs UUID identity (2026-08-27 + 2026-08-28):** `orders.order_code` is the persistent public/operator-facing order identity. UUID `orders.id` remains the internal route/relation/mutation/realtime identity. Order codes are generated in the authoritative `create_order` RPC, use the reduced 6-character alphabet `23456789ABCDEFGHJKMNPQRSTUVWXYZ`, and are unique per `(business_id, order_code)`. Admin order loaders, summary/workspace hydrates and realtime patchers carry `order_code` as a scalar field. Visible admin/customer order references prefer `order_code` with UUID-derived fallback. UUID remains the route/mutation/realtime identity. Dashboard/admin search matches order_code with or without `#`, case-insensitively, while preserving legacy UUID-derived ref matching.

---

## Known debt

### Active relevant debt

- No shared Dialog/Select/Tabs primitives → inconsistent overlay polish cost.
- Dual button/input systems (`ui/*` vs `admin-surfaces`) → global button polish ambiguous.
- `public-settings.css` imported on all protected pages → accidental global bleed risk.
- Dashboard orchestrator size/complexity → visual changes need careful isolation to CSS modules.
- ESLint 9 circular JSON (tooling) — unrelated to admin architecture but blocks lint gate.

### Historical / non-blocking debt

- Legacy `orders-admin.css` / `products-admin.css` removed — ignore old docs that cite them as live files.
- Kitchen mode stub route — roadmap, not polish target unless flagged.
- Super-admin parallel app — out of tenant admin polish unless scoped.

---

## Document maintenance protocol

1. Future phases update this doc **only if** architecture/ownership/routes/shared primitives changed.
2. Pure visual value tweaks may append a one-line Living Audit Changelog entry without rewriting body.
3. If an owner/file moves: update **Quick Routing Index** + affected section + Route/File indexes.
4. Keep **current state in body**; history only in compact changelog.
5. Never turn this into a phase diary or CURRENT_PHASE dump.
6. Prefer `UNKNOWN / NEEDS FOLLOW-UP` over inventing owners.

Verified at commit: `81b1162` (baseline).

---

## Order workspace — Products / preparation display

| Concern | Owner |
|---------|-------|
| Section **Productos** | `order-items-section.tsx` |
| List renderer | `order-products-list.tsx` → `order-preparation-items.tsx` |
| Preparation mapper | `lib/product-customization/order-preparation.ts` |
| Snapshot parse + tree | `lib/product-customization/order-dashboard.ts` |
| Legacy summary helper | `lib/orders/customization-summary.ts` (unchanged) |
| CSS | `order-items.module.css` + modal overrides `admin-order-modal.module.css` |
| Shared consumers | `admin-order-workspace-modal.tsx`, `order-workspace.tsx` (detail) |
| OrderCard | `item_summary` only — unchanged |

**Invariant:** Order preparation display is derived exclusively from order-time snapshots; it must not depend on current product/customization configuration or recalculate authoritative order totals.

**Invariant:** Workspace left/right rails are independently stacked; section heights across rails must not be synchronized by shared grid rows.

Implemented: snapshot-derived structured preparation hierarchy (V2 qty-aware, V1 structured, legacy flat). **OrderCard compact count/summary (2026-08-27):** root-product-based via `buildDashboardOrderCardSummary`; upsell children excluded from card scalars only.

**Durable rule — Dashboard Overview Top Product Semantics (2026-08-28):** Dashboard overview “Producto más pedido” is root-product-only. Parent-linked upsell/Adicional child rows are excluded from the top product KPI, but remain included in revenue/ticket through persisted order totals and remain visible in workspace/contact/preparation surfaces. Ready waiting metric clearly communicates delivery + pickup coverage.

**Layout (2026-08-19 + 2026-08-21):** Desktop workspace modal (≥720px tablet / ≥1024 two-rail) uses `executionColumn` + `commandColumn` as independent vertical stacks inside `.workspaceGrid` (~60/40 at ≥1024). Owner: `admin-order-workspace-modal.tsx`, `admin-order-modal.module.css`. **Narrow mobile (≤719px):** workstation shell is full dynamic viewport (`100dvh`), radius 0, safe-area aware; deliberate two-row header (identity+close / badges+age); overall section flow remains single-column; preparation rows are semantic-adaptive — simple coverage/simple quantity stay label|metadata (2-track); quantity-enabled rows use label|per-unit|operational-total (3-track); **active contextual status action is rendered as a persistent bottom workstation action** (inline Estado CTA hidden on ≤719); **≥720 retains inline Estado CTA** (no persistent footer); **manual status correction remains in scroll content**; **terminal orders render no persistent action**; **one status mutation controller/path remains authoritative** (`useOrderStatusMutation` owned by workspace modal, shared with StatusForm); single modal content scroll (`.workspaceGrid`) preserved.

**Information/action flow (2026-08-19 + 2026-08-20 + 2026-08-21 + 2026-08-22 + 2026-08-28):** Owners — status mutation: `use-order-status-mutation.ts` + `status-form.tsx` → `updateOrderStatusAction` → `transition_order_status`; workspace status UI: `order-workspace-status-section.tsx` + presentational `order-workspace-contextual-status-action.tsx`; contextual mapping: `lib/orders/contextual-status-action.ts`; contact/templates: `order-external-actions.tsx` + `lib/whatsapp/admin.ts`; customer order summary: `lib/orders/customer-order-summary.ts` (pure; snapshot/tree via `order-dashboard.ts`); notes: `order-notes-section.tsx`; customer/delivery: `order-workspace-overview.tsx` + `order-customer-delivery-info.tsx`; shared timeline component: `order-human-timeline.tsx` (detail route only — **workspace no longer renders recent Activity**). **Implemented:** HEADER ref/customer + Delivery/Retiro + status + age; **Desktop LEFT** Productos → Indicaciones; **Desktop RIGHT** Estado (risk/terminal context + manual escape; contextual CTA inline ≥720) → Cliente/Entrega → Contacto; **Mobile** Productos → Indicaciones → Estado/manual operational context → Cliente/Entrega → Contacto; **mobile ≤719 persistent footer = sole contextual primary CTA**. Order events/history remain part of domain/detail surfaces and risk derivation. **Durable rule:** Admin order Products surfaces are inline-only operational preparation surfaces. Product rows are not drilldown triggers. The former internal OrderProductModal was removed globally from workspace and detail route; preparation remains snapshot-derived and rendered inline. **Durable rule:** Workspace Cliente/Entrega presentation uses order-owned customer data; visible redundant field labels are removed while semantic labeling is preserved. Phone formatting is presentation-only; action/canonical value remains unchanged. Manual status correction remains secondary. Manual Guardar is enabled only when selected status differs from authoritative status. Entering `cancelled` from a non-cancelled state requires explicit inline confirmation in `StatusForm` before invoking the existing status mutation path. **Contacto/WhatsApp default (workspace):** contextual — pending→`received`, preparing→`preparing`, ready→`ready_delivery`/`ready_pickup`, completed/cancelled→`summary`; manual template selection remains available. Preference owner: `getPreferredWhatsappTemplateKeyForOrder` in `lib/whatsapp/admin.ts`. Detail/shared `OrderExternalActions` keeps list-position default unless `contextualTemplateDefault` is set. **Durable rule — Contact messaging content:** Admin Contact messaging derives customer-facing order summaries from persisted order data/snapshots only (`persisted items → buildCustomerOrderSummary → WhatsApp / plain-text formatters`). V2 structured + qty-aware; V1 structured without fabricated qty; legacy root-only. Upsells stay parent-associated. No live product/customization config reads. Contextual template default remains separate from message content. Copiar resumen / Compartir consume the same structured model via plain-text formatter. `received`/`summary` rich; preparing/ready_*/on_the_way minimal; monetary Total omitted. **Durable rule — Workspace Contacto presentation:** Contact messaging group = template selector → Abrir WhatsApp → Copiar resumen / Compartir; secondary utilities = Copiar teléfono / Llamar / Copiar dirección / Abrir Maps under Más acciones. Workspace uses `presentation="workspace"` on `OrderExternalActions`; detail surface retains legacy layout. Abrir WhatsApp is primary within Contacto but subordinate to contextual status CTA. Workspace secondary utility presentation is feature-local and tool-oriented (compact icon-labeled controls); action semantics, gating, and clipboard/`tel:`/Maps targets remain unchanged. Workspace Contacto/right-rail controls use feature-local surface contrast tuning (local CSS variables derived from semantic tokens); detail retains legacy presentation. `OrderRecommendedActionPanel` retained in repo but not rendered in workspace.

---

## Living Audit Changelog

```text
2026-08-29 — ADMIN-DASHBOARD-POLISH-PACKAGE-COMMIT-PUSH-DEPLOY-1
- packaged and released the closed admin/dashboard polish set including order code adoption, dashboard metrics semantics, search/Kanban fixes, loading-state unification/restoration, product drilldown removal and mobile terminal order density;
- committed and pushed the validated package after tsc/build/diff-check/verifies;
- deployed and smoke-tested the production admin/public surfaces;
- no additional runtime behavior changes were introduced during release packaging;
- baseline before this package remained 81b1162

2026-08-28 — ADMIN-DASHBOARD-MOBILE-TERMINAL-ORDERS-DENSITY-POLISH-1
- implemented mobile-only terminal order density control for dashboard stacked view;
- completed/cancelled sections now show the first 5 orders by default on ≤767px with local “Mostrar X más” / “Mostrar menos” progressive disclosure;
- pending/preparing/ready remain uncapped and search active bypasses the cap so all matches are visible;
- preserved desktop/tablet Kanban, terminal pager, dashboard metrics, root count, order code search/display, workspace, DB/RPC/realtime and global CSS/AdminShell/AdminPageLayout boundaries;
- baseline commit remains 81b1162

2026-08-28 — ADMIN-DASHBOARD-MOBILE-TERMINAL-ORDERS-DENSITY-AUDIT-1
- audited mobile dashboard order-list density after completed/cancelled orders made the stacked mobile board excessively long;
- mapped mobile stacked renderer, terminal sections, search interaction, counts and desktop Kanban boundaries;
- specified future mobile-only terminal cap behavior while preserving active statuses, search visibility, desktop Kanban/pager, metrics, order code, root count, workspace, DB/RPC/realtime and global CSS boundaries;
- no runtime/CSS/DB/RPC/realtime changes;
- baseline commit remains 81b1162

2026-08-28 — ADMIN-DASHBOARD-LOADING-SPINNER-STYLE-RESTORATION-1
- restored the AdminShell loading spinner to the original border/ring visual language while preserving the scaled 44–56px size, X/Y centering, single first-paint ownership, `Cargando panel` / `Un momento…` copy and accessibility semantics;
- kept the dashboard route loader removed and preserved dashboard data/realtime/search/Kanban/metrics/workspace/order code and global CSS/theme/AdminPageLayout boundaries;
- baseline commit remains 81b1162

2026-08-28 — ADMIN-DASHBOARD-LOADING-STATE-VERTICAL-CENTERING-FOLLOWUP-1
- corrected AdminShell unified loading geometry so the spinner/copy composition is centered in both X and Y axes across desktop/tablet/mobile;
- preserved AdminShell first-paint ownership, removed dashboard route loader state, spinner/copy hierarchy, dashboard data/realtime/search/Kanban/metrics/workspace/order code and global theme/AdminPageLayout boundaries;
- baseline commit remains 81b1162

2026-08-28 — ADMIN-DASHBOARD-LOADING-STATE-OWNERSHIP-UNIFICATION-1
- unified admin dashboard loading ownership at the shared AdminShell first-paint boundary;
- upgraded AdminShell loading to the scaled spinner + `Cargando panel` / `Un momento…` hierarchy;
- removed redundant dashboard route loading files that caused second-stage flicker;
- preserved dashboard data/realtime/search/Kanban/metrics/workspace/order code and global theme/AdminPageLayout boundaries;
- baseline commit remains 81b1162

2026-08-28 — ADMIN-DASHBOARD-LOADING-STATE-OWNERSHIP-AUDIT-1
- audited dashboard/admin loading ownership after observed double-loading flash;
- mapped shared shell/protected loading, dashboard route loading and client/dashboard loading states;
- documented render order, root cause and future unification/removal recommendation;
- no runtime/CSS/DB/RPC/realtime changes;
- baseline commit remains 81b1162

2026-08-28 — ADMIN-DASHBOARD-LOADING-STATE-SCALE-ALIGNMENT-FOLLOWUP-1
- refined dashboard loading state scale and hierarchy to align with public catalog loading feel;
- upgraded loading from small fallback-like text to centered spinner + title + subtitle composition (`Cargando panel` / `Un momento…`);
- preserved dashboard data/realtime/search/Kanban/metrics/workspace/order code and global CSS/theme/AdminShell/AdminPageLayout boundaries;
- baseline commit remains 81b1162

2026-08-28 — ADMIN-DASHBOARD-LOADING-STATE-CENTERING-POLISH-1
- centered dashboard loading state across desktop/tablet/mobile viewports (100dvh place-items center);
- updated dashboard loading copy from “Cargando configuración...” to “Cargando panel…”;
- preserved dashboard data/realtime/search/Kanban/metrics/workspace/order code and global CSS/theme/AdminPageLayout boundaries;
- baseline commit remains 81b1162

2026-08-28 — ADMIN-ORDER-WORKSPACE-PRODUCT-DETAIL-DRILLDOWN-REMOVAL-1
- removed internal product detail drilldown modal globally from admin order workspace/detail Products surfaces;
- removed product row click affordance and selected-item modal state;
- preserved inline snapshot-derived preparation hierarchy, pricing display, Adicional handling, workspace/status/contact, dashboard search/Kanban, metrics, order code, DB/RPC/realtime and global CSS boundaries;
- baseline commit remains 81b1162

2026-08-28 — ADMIN-ORDER-WORKSPACE-PRODUCT-DETAIL-DRILLDOWN-REMOVAL-AUDIT-1
- audited product-row drilldown inside admin order workspace/detail Products surfaces;
- mapped click handlers, modal ownership, snapshot/current-data usage, workspace/detail consumers and removal risks;
- documented product decision options for removing or retaining the internal product detail modal;
- no runtime/CSS/DB/RPC/realtime changes;
- baseline commit remains 81b1162

2026-08-28 — ADMIN-DASHBOARD-SEARCH-KANBAN-VISUAL-STABILITY-FIX-1
- stabilized dashboard Kanban presentation during active search so visible lane windows remain structurally stable and Cancelados does not disappear when filtered empty;
- refined dashboard search focus treatment to a single accessible local focus state;
- preserved order_code/name/phone search logic, dashboard metrics, dashboard card root count, workspace/contact, DB/RPC/realtime and CSS-global boundaries;
- baseline commit remains 81b1162

2026-08-28 — ADMIN-DASHBOARD-ORDER-CODE-SEARCH-PARTIAL-MATCH-FIX-1
- fixed dashboard order_code partial search so alphanumeric prefixes such as PGF5 remain constrained to matching order codes instead of falling through to broad numeric/token fallback;
- preserved search by customer name, phone, legacy UUID-derived refs and order_code with/without #;
- preserved dashboard metrics semantics, dashboard card root count, order code identity, workspace/contact, DB/RPC/realtime and CSS boundaries;
- baseline commit remains 81b1162

2026-08-28 — ADMIN-DASHBOARD-METRICS-RUNTIME-QA-1
- completed formal runtime QA for dashboard metrics semantic fix;
- confirmed “Producto más pedido” remains root-product-only and excludes parent-linked upsell/Adicional children;
- confirmed ready waiting copy communicates delivery + pickup;
- confirmed revenue, ticket, active orders, delayed orders, average preparation time, kitchen status, dashboard card root count, order code, workspace/contact, DB/RPC/realtime and CSS boundaries unchanged;
- documented order_code partial search match issue as separate follow-up debt;
- baseline commit remains 81b1162

2026-08-28 — ADMIN-DASHBOARD-METRICS-SEMANTIC-FIX-1
- corrected dashboard top product KPI from flat item aggregation to root-product-only semantics;
- relabeled “Más vendido” to “Producto más pedido”;
- clarified ready waiting copy for delivery + pickup;
- preserved revenue, average ticket, active orders, delayed orders, average preparation time and kitchen status formulas;
- preserved dashboard card root count, order code, workspace/contact, DB/RPC/realtime and CSS boundaries;
- baseline commit remains 81b1162

2026-08-28 — ADMIN-DASHBOARD-METRICS-SEMANTIC-AUDIT-1
- audited dashboard overview KPI/source semantics across revenue, ticket, active orders, top seller, kitchen state, delayed orders, average time, ready waiting and session signals;
- documented root product vs upsell/adicional item-count risks for metrics;
- no runtime/CSS/DB/RPC/realtime changes;
- baseline commit remains 81b1162

2026-08-28 — PUBLIC-CATALOG-SUCCESS-WHATSAPP-BUSINESS-COPY-1
- updated public catalog success WhatsApp prefilled copy to business-first template;
- raw order code without `#` used in WhatsApp text; success card visible ref retains `#ORDER_CODE`;
- UUID query identity, create_order RPC, and Admin WhatsApp architecture unchanged;
- baseline commit remains 81b1162

2026-08-28 — ADMIN-ORDERS-ORDER-CODE-FINAL-RUNTIME-QA-1
- completed final runtime/source QA for Order Code end-to-end adoption;
- confirmed visible refs/search prefer `orders.order_code` with UUID fallback;
- confirmed UUID remains internal route/mutation/realtime identity;
- confirmed dashboard card root count, workspace/contact structure, WhatsApp architecture, pricing, order_items, DB/RPC and CSS boundaries unchanged;
- public checkout submit remains P3 debt unless explicitly authorized;
- baseline commit remains 81b1162

2026-08-28 — ADMIN-ORDERS-ORDER-CODE-UI-SEARCH-1
- migrated visible order references to prefer `orders.order_code` with UUID-derived fallback;
- added dashboard/admin search support for order_code with/without `#`, case-insensitive;
- preserved UUID routes/mutations/realtime identity;
- preserved dashboard root item count, workspace/contact structure, WhatsApp content architecture, pricing, order_items, DB/RPC and CSS boundaries;
- baseline commit remains 81b1162

2026-08-28 — ADMIN-ORDERS-ORDER-CODE-LOADERS-REALTIME-1
- propagated `orders.order_code` through admin order loaders, dashboard refresh, summary/workspace/detail payloads and realtime patchers;
- preserved UUID as route/mutation/realtime identity;
- UI/search/display adoption deferred;
- dashboard card root count, workspace/contact, WhatsApp, pricing and DB/RPC unchanged;
- baseline commit remains 81b1162

2026-08-27 — ADMIN-ORDERS-ORDER-CODE-DB-APPLY-VALIDATION-1
- validated manual Supabase apply for `orders.order_code` schema/RPC foundation;
- confirmed reduced-alphabet format, NOT NULL, per-business uniqueness, backfill and `create_order` assignment;
- UUID internal identity, routes, UI/search/display, workspace/contact and dashboard card root count unchanged;
- baseline commit remains 81b1162

2026-08-27 — ADMIN-ORDERS-ORDER-CODE-SCHEMA-RPC-1
- added schema/RPC foundation for persistent `orders.order_code`;
- implemented reduced-alphabet 6-character code generation and backfill;
- enforced format and `(business_id, order_code)` uniqueness;
- updated `create_order` to assign order_code without changing UUID internal identity;
- UI/search/display migration deferred;
- baseline commit remains 81b1162

2026-08-27 — ADMIN-ORDERS-ORDER-CODE-AUDIT-SPEC-1
- audited current UUID-derived order display reference ownership;
- specified future `orders.order_code` / public operational order identity;
- documented schema, generation, backfill, display/search and rollout plan;
- no runtime/CSS/DB/RPC/realtime changes;
- baseline commit remains 81b1162

2026-08-27 — ADMIN-DASHBOARD-ORDER-CARD-ROOT-ITEM-COUNT-IMPL-1
- implemented root-product-based dashboard OrderCard item_count;
- compact summary now lists root products only and excludes parent-linked
  upsell/Adicional children;
- initial dashboard mapping, summary hydrate and realtime patch use shared
  root-aware helper (buildDashboardOrderCardSummary);
- workspace/modal Products, Contact messaging, preparation, pricing,
  DB/RPC and natural search unchanged;
- baseline commit remains 81b1162

2026-08-27 — ADMIN-DASHBOARD-ORDER-CARD-ROOT-ITEM-COUNT-AUDIT-1
- audited dashboard OrderCard item-count semantics against root/upsell
  order item model;
- documented that card count currently includes upsell/adicional children;
- documented recommended future implementation path (shared root-summary
  helper + dashboard mapping/realtime);
- no runtime/CSS/DB/realtime changes;
- baseline commit remains 81b1162

2026-08-27 — ADMIN-ORDER-WORKSPACE-CONTACT-SURFACE-CONTRAST-TUNING-1
- tuned workspace right-rail Contact/control surface contrast after PO
  visual review;
- improved light/dark materiality without changing Contact structure;
- WhatsApp/CopyShare/secondary utilities/status hierarchy preserved;
- detail route unchanged;
- no domain/message/content/default/DB/RPC/realtime/global-token changes;
- baseline commit remains 81b1162

2026-08-27 — ADMIN-ORDER-WORKSPACE-SECONDARY-ACTIONS-VISUAL-POLISH-1
- polished workspace secondary phone/address utilities as compact
  icon-labeled operational tools;
- preserved 2-column phone/address pairing;
- action targets, clipboard payloads and data gating unchanged;
- Contact messaging hierarchy/content/default unchanged;
- detail route retains legacy presentation;
- no DB/RPC/realtime/network/domain/shared-primitive changes;
- baseline commit remains 81b1162

2026-08-27 — ADMIN-ORDER-WORKSPACE-CONTACT-MESSAGING-VISUAL-HIERARCHY-VALIDATION-1
- authenticated responsive/theme visual validation completed;
- workspace messaging hierarchy confirmed;
- detail presentation regression-free;
- Contact messaging visual hierarchy frozen;
- real Android debt retained (not executed);
- no architecture/domain/realtime changes;
- baseline commit remains 81b1162

2026-08-22 — ADMIN-ORDER-WORKSPACE-CONTACT-MESSAGING-VISUAL-HIERARCHY-POLISH-1
- separated workspace Contact messaging from generic secondary utilities;
- WhatsApp + Copiar resumen + Compartir now form one communication group;
- Abrir WhatsApp is primary within Contacto but remains subordinate to
  contextual status CTA;
- phone/call/address/maps remain secondary utilities and were not
  visually redesigned;
- structured message content/default/template availability unchanged;
- detail route presentation unchanged (presentation="default");
- no DB/RPC/realtime/network/domain changes;
- baseline commit remains 81b1162

2026-08-22 — ADMIN-ORDER-WORKSPACE-CONTACT-MESSAGING-STRUCTURED-CONTENT-IMPL-1
- replaced MVP flat admin contact summary with snapshot-derived
  customer-facing structured order summary;
- V2 qty-aware, V1 structured fallback, legacy root-only fallback;
- parent-associated Adicional preserved;
- received/summary rich; operational status pings minimal;
- monetary Total and kitchen operational totals omitted;
- WhatsApp formatter owns markdown; Copy/Share use plain text;
- contextual default/template availability unchanged;
- no live config, DB, RPC, realtime, CSS or public WhatsApp changes;
- baseline commit remains 81b1162

2026-08-21 — ADMIN-ORDER-WORKSPACE-CONTACT-MESSAGING-CONTENT-AUDIT-1
- audited admin WhatsApp/contact content against current order
  customization architecture;
- contextual default remains unchanged;
- documented product/customization content gap;
- documented recommended future formatter architecture;
- no runtime/CSS/DB/realtime changes;
- baseline commit remains 81b1162

2026-08-21 — ADMIN-ORDER-WORKSPACE-MOBILE-INFORMATION-HIERARCHY-CLEANUP-1
- reduced Indicaciones visual emphasis without changing notes semantics;
- simplified Cliente/Entrega into compact operational value grid;
- removed redundant visible Nombre/Teléfono/Modalidad/Dirección labels;
- full order-owned customer name preserved;
- phone formatting presentation-only where safe (BA-deterministic helper);
- removed recent Activity from workspace presentation;
- order events/detail history/risk/realtime unchanged;
- Contacto/status/Products/persistent CTA unchanged;
- baseline commit remains 81b1162

2026-08-21 — ADMIN-ORDER-WORKSPACE-MANUAL-STATUS-CONTROL-VISUAL-POLISH-1
- native manual status select retained;
- custom feature-local chevron / spacing polish;
- Guardar visually secondary and disabled when no status change exists;
- cancellation confirmation / status mutation architecture unchanged;
- no shared primitive introduced;
- baseline commit remains 81b1162

2026-08-21 — ADMIN-ORDER-WORKSPACE-MOBILE-PERSISTENT-STATUS-ACTION-1
- mobile ≤719 active orders expose one persistent contextual status action at viewport/workstation bottom;
- desktop/tablet retain inline Estado CTA;
- mobile inline duplicate removed/not rendered (CSS-hidden non-interactive twin; single authoritative controller);
- mobile visible Estado section heading visually hidden (sr-only) as redundant; aria-labelledby preserved; ≥720 unchanged;
- manual correction/cancel safety unchanged;
- same mutation/optimistic/realtime path reused;
- terminal orders have no persistent action;
- single scroll preserved;
- authenticated runtime matrix PASS (agent); real Android NOT EXECUTED; gate PASS WITH REAL-DEVICE QA DEBT — MOBILE WORKSPACE FROZEN; baseline commit still 81b1162

2026-08-21 — ADMIN-ORDER-WORKSPACE-MOBILE-PREPARATION-QUANTITY-NUMERIC-GUTTER-VISUAL-FIX-1
- widened optical separation between per-unit and operational-total columns on narrow mobile;
- adaptive 3-track architecture unchanged;
- semantics/mapper/pricing/desktop unchanged;
- (uncommitted at write time; baseline commit still 81b1162)

2026-08-21 — ADMIN-ORDER-WORKSPACE-MOBILE-PREPARATION-QUANTITY-THREE-TRACK-POLISH-1
- quantity-enabled mobile preparation rows changed from stacked metadata to label/per-unit/total three-track geometry;
- simple coverage/simple quantity rows remain two-track;
- semantics/mapper/pricing unchanged; desktop unchanged;
- (uncommitted at write time; baseline commit still 81b1162)

2026-08-21 — ADMIN-ORDER-WORKSPACE-MOBILE-FULLSCREEN-LAYOUT-POLISH-1
- narrow mobile (≤719px) workstation = full 100dvh surface (not floating card);
- deliberate two-row mobile header; preparation option/metadata two-track on ≤719;
- Cliente/Entrega: address stacks full-width on phone; desktop ≥720 unchanged / FROZEN;
- shared preparation mobile CSS improves detail route rows (intentional);
- (uncommitted at write time; baseline commit still 81b1162)

2026-08-21 — ADMIN-ORDER-WORKSPACE-FINAL-VISUAL-UX-QA-1
- Order workspace visual/UX architecture final-QA passed; surface FROZEN;
- future workspace visual/UX changes require explicit regression or new product requirement;
- P0/P1/P2 = 0; non-blocking P3 only (Hace N age copy; Actualizando/Sincronizando dual pending labels);
- manual correction ACCEPTABLE (no disclosure phase); non-sticky action KEEP (no persistence phase);
- no runtime/CSS/architecture change; baseline commit still 81b1162.

2026-08-20 — ADMIN-ORDER-WORKSPACE-WHATSAPP-CONTEXTUAL-DEFAULT-POLISH-1
- workspace WhatsApp default now status + delivery_method (not templates[0]);
- completed+delivery defaults to summary; confirm_address remains manually selectable;
- shared preference helper reused by buildContextualOrderWhatsappUrl;
- detail OrderExternalActions unchanged (opt-in contextualTemplateDefault);
- (uncommitted at write time; baseline commit still 81b1162)

2026-08-20 — ADMIN-ORDER-WORKSPACE-MANUAL-STATUS-CORRECTION-SAFETY-POLISH-1
- manual Cancelado + Guardar no longer mutates; inline confirmation required;
- Volver resets select to authoritative status; only Cancelar pedido calls submitStatusChange("cancelled");
- contextual CTA and non-cancel manual corrections unchanged; no RPC/realtime/reconciliation changes;
- runtime confirmed on disposable QA #45E0 (La Burguesía); stock side effect not directly verified.
- (uncommitted at write time; baseline commit still 81b1162)

2026-08-20 — ADMIN-ORDER-WORKSPACE-CONTEXTUAL-STATUS-ACTION-RUNTIME-VALIDATION-RESUME-1
- authenticated status matrix pending→preparing→ready→completed PASS on QA order #AF33;
- P1 snapshot-before-clear finalization fix RUNTIME CONFIRMED (no expectedStatus crash / no workspace boundary);
- no architecture change; hard contextual runtime gate CLOSED.
- (uncommitted at write time; baseline commit still 81b1162)

2026-08-20 — ADMIN-ORDER-WORKSPACE-STATUS-PENDING-MUTATION-FINALIZATION-FIX-1
- P1: resolvePendingStatusMutation traced expectedStatus after in-place clearPendingMutationKind deleted status;
- fix: snapshot status fields before clear; late missing-entry resolve remains idempotent no-op;
- regression: lib/orders/pending-status-mutation-finalization.verify.ts;
- authenticated runtime matrix still blocked at login.
- (uncommitted at write time; baseline commit still 81b1162)

2026-08-19 — ADMIN-ORDER-WORKSPACE-CONTEXTUAL-STATUS-ACTION-VALIDATION-1
- source-level validation PASS for contextual status mutation path and CTA/manual isolation;
- runtime mutation matrix blocked (no authenticated disposable QA session);
- no code changes; follow-up runtime QA recommended before production freeze.
- (uncommitted at write time; baseline commit still 81b1162)

2026-08-19 — ADMIN-ORDER-WORKSPACE-CONTEXTUAL-STATUS-ACTION-FLOW-1
- removed standalone Próximo paso / Estado final workspace surface;
- active orders now expose one-click contextual status transitions;
- manual status selector preserved as secondary correction path;
- terminal orders expose no primary status CTA;
- workspace Activity reduced to two recent events;
- reused existing status mutation/optimistic path;
- realtime, reconciliation, RPC/FSM, WhatsApp and domain unchanged.
- (uncommitted at write time; baseline commit still 81b1162)

2026-08-19 — ADMIN-ORDER-WORKSPACE-CUSTOMER-DELIVERY-RAIL-REALIGNMENT-1
- moved Cliente/Entrega from execution rail to operational rail;
- customer/delivery context now sits immediately before Contacto/quick actions;
- left rail reduced to Products/Indicaciones/Activity;
- independent rails, modal ratio, scroll, actions, realtime and domain unchanged.
- (uncommitted at write time; baseline commit still 81b1162)

2026-08-19 — ADMIN-ORDER-WORKSPACE-INFORMATION-HIERARCHY-POLISH-1
- promoted Delivery/Retiro to workspace header context;
- moved free-form order notes directly after Productos and presented them as Indicaciones;
- kept Activity as tertiary history at end of left rail;
- terminal recommended-action eyebrow now reads Estado final;
- no changes to status mutations, WhatsApp behavior, realtime, reconciliation or rails.
- (uncommitted at write time; baseline commit still 81b1162)

2026-08-19 — ADMIN-ORDER-WORKSPACE-INFORMATION-ACTION-FLOW-AUDIT-1
- mapped workspace information/action flow by status and delivery modality;
- audited notes, next-step, status mutation, contact/template and quick-action relevance;
- defined implementation boundary; no runtime changes.
- (uncommitted at write time; baseline commit still 81b1162)

2026-08-19 — ADMIN-ORDER-WORKSPACE-INDEPENDENT-RAILS-LAYOUT-FIX-1
- decoupled workspace information and operational rails vertically;
- long Products content no longer pushes Estado/Contacto/quick actions;
- modal horizontal ratio and scroll model unchanged;
- preparation/realtime/actions/domain unchanged.
- (uncommitted at write time; baseline commit still 81b1162)

2026-08-19 — ADMIN-ORDER-WORKSPACE-PREPARATION-NUMERIC-DENSITY-VISUAL-POLISH-1
- compacted preparation body tracks without changing semantic columns;
- applied local tabular numerals to operational quantities for stable digit width;
- reduced excessive horizontal separation between option / per-unit / total;
- product header and modal rail ratio unchanged;
- mapper/domain/pricing/realtime/actions unchanged.
- (uncommitted at write time; baseline commit still 81b1162)

2026-08-18 — ADMIN-ORDER-WORKSPACE-PREPARATION-PRODUCT-HEADER-TRACK-REGRESSION-FIX-1
- decoupled product header geometry from body 4-track preparation grid;
- restored flexible product identity width while retaining unit price + line total;
- removed header-only empty track/placeholder coupling for qty=1;
- body preparation tracks/semantics/mapper unchanged.
- (uncommitted at write time; baseline commit still 81b1162)

2026-08-18 — ADMIN-ORDER-WORKSPACE-PREPARATION-COLUMN-ALIGNMENT-VISUAL-FIX-1
- normalized preparation header/body column tracks;
- increased separation between per-unit and total/coverage values;
- aligned `Ambas`/`N total` in stable terminal track;
- preparation semantics/mapper/pricing unchanged.
- (uncommitted at write time; baseline commit still 81b1162)

2026-08-18 — ADMIN-ORDER-WORKSPACE-PREPARATION-PER-UNIT-TOTAL-ADDITIONAL-POLISH-1
- preparation parent qty>1 now exposes persisted unit price + line total;
- standard selections expose parent coverage (Ambas for qty=2, numeric total above 2);
- quantity-enabled V2 extras expose explicit per-unit + operational total;
- upsell children remain internal child order_items but render as price-less Adicional preparation content;
- pricing/domain/realtime/actions unchanged.
- (uncommitted at write time; baseline commit still 81b1162)

2026-08-18 — ADMIN-ORDER-WORKSPACE-PRODUCT-PREPARATION-VISUAL-SEPARATION-POLISH-1
- refined product preparation visual boundaries and group scannability;
- desktop groups use specification-style layout with narrow/mobile stacked fallback;
- Adicional visually separated from customization groups;
- preparation mapper/data semantics unchanged.
- (uncommitted at write time; baseline commit still 81b1162)

2026-08-18 — ADMIN-ORDER-WORKSPACE-PRODUCT-PREPARATION-HIERARCHY-1
- added snapshot-derived structured preparation hierarchy for admin workspace/detail;
- V2 quantity-aware, V1 structured fallback, legacy flat fallback;
- option prices omitted to avoid visual double counting;
- realtime/actions/checkout/DB/public unchanged.
- (uncommitted at write time; baseline commit still 81b1162)

2026-08-18 — ADMIN-ORDER-WORKSPACE-PRODUCT-PREPARATION-HIERARCHY-AUDIT-1
- mapped order-item → snapshot V1/V2 → admin Products renderer;
- established safe structured/legacy preparation presentation boundary;
- no runtime changes.
- (uncommitted at write time; baseline commit still 81b1162)

2026-08-18 — ADMIN-ORDER-WORKSPACE-MODAL-ACTION-HIERARCHY-VISUAL-FIX-1
- removed duplicate visible status labeling while preserving accessible field labeling;
- clarified active vs terminal status CTA hierarchy;
- demoted WhatsApp/contact actions to secondary presentation;
- no changes to actions/realtime/reconciliation.
- (uncommitted at write time; baseline commit still 81b1162)

2026-08-18 — ADMIN-ORDER-WORKSPACE-MODAL-HIERARCHY-POLISH-1
- workspace modal hierarchy: information left rail + operational right rail;
- de-nested card treatment; Próximo paso copy; Unicode fix; CTA hierarchy;
- order actions/realtime/reconciliation unchanged.
- (uncommitted at write time; baseline commit still 81b1162)

2026-08-17 — ADMIN-ORDER-RESPONSIBILITY-FEATURE-FLAG-VALIDATION-1 (RESUME — PASS)
- schema aligned on dev target pkrsedmwxekbhlohhqds; console flag-read error resolved;
- OFF/ON/ON→OFF→ON validated; server mutation gate validated;
- assignment data preserved; realtime/reconciliation unchanged;
- final tenant flag OFF; no runtime fixes.
- (uncommitted at write time; baseline commit still 81b1162)

2026-08-17 — ADMIN-ORDER-RESPONSIBILITY-FEATURE-FLAG-VALIDATION-1 (initial — BLOCKED)
- dev target missing column; migration ledger drift detected;
- blocked pending operator schema apply (RESOLVED in resume run).

2026-08-17 — ADMIN-ORDER-RESPONSIBILITY-FEATURE-FLAG-VALIDATION-1
- added tenant-level order_assignment_enabled, default OFF;
- dashboard/detail responsibility UI gated by orderResponsibilityEnabled;
- assignment mutation hardened server-side;
- existing assignment data + realtime/reconciliation preserved.
- (uncommitted at write time; baseline commit still 81b1162)

2026-08-17 — ADMIN-ORDER-RESPONSIBILITY-FEATURE-FLAG-AUDIT-1
- current responsibility system mapped end-to-end;
- tenant feature-flag implementation scope established;
- no runtime changes.
- (uncommitted at write time; baseline commit still 81b1162)

2026-08-17 — ADMIN-DASHBOARD-KANBAN-LANE-PAGER-VISUAL-FIX-1
- moved terminal pager from lane edge overlay to dedicated compact board navigation row;
- pager styling demoted to secondary neutral navigation;
- lane geometry and realtime/domain behavior unchanged.
- (uncommitted at write time; baseline commit still 81b1162)

2026-08-17 — ADMIN-DASHBOARD-KANBAN-TERMINAL-LANE-PAGER-1
- fixed four-lane visible window;
- cancelled accessed via local terminal pager;
- realtime/domain derivation unchanged.
- (uncommitted at write time; baseline commit still 81b1162)

2026-08-17 — ADMIN-DASHBOARD-FORENSIC-LIVING-AUDIT-1
- Baseline forensic architecture captured.
- Commit: 81b1162
```
