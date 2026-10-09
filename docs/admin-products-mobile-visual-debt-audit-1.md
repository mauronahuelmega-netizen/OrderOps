# Result

**ADMIN-PRODUCTS-MOBILE-VISUAL-DEBT-AUDIT-1 — AUDIT COMPLETE (2026-09-08)**

P0: **0** · P1: **1** · P2: **8** · P3: **11**

Runtime changes: **NONE** · CSS: **NONE** · Product mutations: **0** · DB / RPC / migrations: **UNCHANGED**

Preflight baseline confirmed: branch `main`, HEAD == `origin/main` == `c9af635e27ad86e0731eea0a90b16b9b628d5aa6`; pre-existing dirty (`docs/CURRENT_PHASE.md`, `docs/admin-manual-order-modal-commit-push-deploy-1.md`, `tsconfig.tsbuildinfo`) preserved untouched.

Both preliminary indications were resolved, and neither is the real problem:

- **Next Image `quality="80"`** — **CONFIRMED as a config/console-only warning** (P3), and currently **inert**: the Supabase transform endpoint is disabled, so images render `unoptimized` and `quality` never reaches the CDN.
- **`store-session` focus hydration `unauthorized`** — **NOT REPRODUCED on `/admin/products`** (0/3 focus cycles). Owner is the Orders dashboard, dev-gated and non-redirecting by design → **CASE A** for Products.

The material discovery is different from both: a **zero-result search hijacks the page into the Create Product form** (P1), and **every product thumbnail downloads the full-resolution original** (2.2 MB for a 71×72 slot).

---

# Scope

Audited: `/admin/products` (list, toolbar, collection, create flyout, edit flyout, empty/no-result states) with mobile priority.

Not audited / not touched: `/admin/products/preview`, `/admin/products/customizations`, categories, dashboard/orders, public catalog runtime (referenced only where a Products finding demonstrably shares an owner with it), auth/permissions, store-session domain.

Mode: AUDIT-ONLY / READ-ONLY RUNTIME. No fix, no config change, no CSS change, no staging, no commit.

---

# Ownership map

Traced from `app/admin/(protected)/products/page.tsx` and its direct imports.

| Concern | Owner |
| ------- | ----- |
| Page (server) | `app/admin/(protected)/products/page.tsx` — `requireAdminPermission("manageProducts")`, `AdminPageLayout size="operational"` |
| Page header | `components/admin/admin-page-header` (`variant="operational"`, eyebrow `Catálogo`, title `Productos`) — **shared, behaving correctly** |
| Header actions | `products-header-actions.tsx` + `.module.css` — **feature-local, source of mobile header debt** |
| Shell (toolbar/content/flyout slots) | `products/dashboard-shell.tsx` + `.module.css` |
| Toolbar / search / filters | `products-toolbar.tsx` + `.module.css` (search 300ms debounce → `router.push`; 3 native `<select>`; conditional `Limpiar filtros`) |
| Collection switch | `product-catalog-views.tsx` + `.module.css` — **dual mount**, CSS-toggled at **900px** |
| Collection (mobile, <900) | `product-grid-server.tsx` + `product-grid.module.css` → `product-card.tsx` + `product-card.module.css` |
| Collection (desktop, ≥900) | `product-table-view.tsx` + `.module.css` (+ `product-availability-toggle.*`, `product-pagination.*`) |
| Client state | `products-management-provider.tsx` (`flyoutMode`, selected product, `resolveEmptyCatalogFlyoutMode`) |
| Flyout / dialog | `flyout-panel.tsx` + `.module.css` (`role="dialog"`, `aria-modal="true"`, `useScrollLock`) |
| Create / edit forms | `create-product-form.tsx`, `edit-product-form.tsx`, shared `product-form.module.css`; `image-crop-modal.*` |
| Loading / empty | `product-catalog-skeleton.*`, `product-form-skeleton.tsx`, `product-catalog-empty-state.tsx`, `product-empty-state-actions.tsx` |
| Image rendering | `next/image` + `lib/supabase/image-loader.ts` (`getSupabaseImageLoader`, `toSupabaseObjectPublicUrl`), `lib/products/product-image.ts` |
| Image config | `next.config.ts` → `images.loader: "custom"`, `loaderFile`, `remotePatterns`; **no `images.qualities` key** |
| Session hydration | `components/admin/orders/admin-dashboard-orders.tsx` + `app/admin/(protected)/dashboard/actions.ts` — **OUTSIDE Products** |

Structure observed in DOM (mobile):

```text
Page (AdminPageLayout operational)
└─ AdminPageHeader (eyebrow, h1 "Productos", description)
   └─ ProductsHeaderActions  → 4 stacked full-width actions
└─ DashboardShell
   ├─ ProductsToolbar        → summary line + search + 3 selects (+ Limpiar filtros)
   ├─ Collection
   │  ├─ [hidden ≥900 rule]  ProductTableView   (still mounted)
   │  └─ [visible <900]      ProductGridServer
   │        Card → h2 "Catálogo" / "Por categorías" / metrics line
   │        └─ section per category (h3 name + count)
   │             └─ cardGrid → ProductCard (image, badge, h3 name, price, "Gestionar")
   └─ FlyoutPanel (create-product | create-category | edit)
```

Confirmed: the mobile collection is a **card grid**, not a table; the desktop collection is a real `<table>`.

---

# Responsive breakpoints

Real breakpoints extracted from `components/admin/products/*.module.css` (no invented viewports):

| Breakpoint | Modules | Effect |
| ---------- | ------- | ------ |
| `max-width: 479` | header-actions, toolbar | primary CTA min-height **reduced** to 2.25rem |
| `min-width: 480` | product-card, product-grid, skeleton | card grid → 2 columns |
| `max-width: 640` | product-form, pagination | form/pagination compaction |
| `min-width: 720` | header-actions, skeleton | action gap 8→10px |
| `max-width: 767` / `min-width: 768` | header-actions, toolbar, dashboard-shell | actions stack full-width ≤767; toolbar row ≥768 |
| `768–899` band | 6 modules | card grid **back to 1 column**; actions return to a row |
| `min-width: 900` | **product-catalog-views**, card, grid, skeleton, pagination | **table replaces grid** |
| `min-width: 961` | flyout-panel | flyout geometry |
| `min-width: 1024` | toolbar, catalog-preview | toolbar expansion |
| `min-width: 1440` | catalog-preview | preview only |

Measured at the boundaries:

| Width | Collection | Grid columns | Card | Header actions | Overflow-x |
| ----- | ---------- | ------------ | ---- | -------------- | ---------- |
| 360 | grid | `302px` (1) | 302×74 | stacked, **150px tall** | none |
| 390 | grid | `332px` (1) | 332×74 | stacked | none |
| 719 | grid | `318px 318px` (2) | 318×160 | stacked, 152px, CTA 672px wide | none |
| 899 | grid | `810px` (**1**) | 810×98 | row, 36px | none |
| 1024 | **table** | — | row 65px | row | none |
| 1440 | table | — | row | row | none |

Note the non-monotonic progression: **2 columns at 719 → 1 stretched column at 899**. Wider viewport, fewer columns (PROD-P3-1).

Three different "desktop" thresholds coexist: collection **900**, flyout **961**, toolbar **768/1024** (PROD-P3-2).

---

# Runtime coverage

- Auth: existing authenticated admin session (`laburguesia@demo.com`, business `La Burguesía`, 18 products / 5 categories). No credentials invented, no login mutation.
- Viewports: **360, 390, 412-class, 719, 899, 1024, 1440** (priority 360/390 measured in full).
- Themes: **390 LIGHT**, **390 DARK**, **1440 DARK**, 1024 light — switched with the **real** admin toggle (`Cambiar a modo oscuro` → `html[data-dashboard-theme]`), never `prefers-color-scheme`. Light theme restored at the end.
- States: unfiltered list, query with results (`?q=combo` → 6), query without results (`?q=zzzznoresults` → 0), cleared filters, create flyout, edit flyout, full-page scroll, 3 focus cycles.
- Mutations: **none**. No product created/edited/deleted, no availability toggled, no category changed, no image uploaded or cropped, no reorder. `Guardar cambios` never pressed; edit flyout closed via `Cerrar`.

---

# Mobile header / toolbar

`AdminPageHeader` itself is fine (eyebrow/title/description render correctly, no collision with the shell, no horizontal overflow). The debt is **feature-local** in `ProductsHeaderActions`.

- Four actions are rendered in the page header: `+ Nuevo producto` (primary), `Opcionales y extras`, `Vista previa del catálogo`, `Copiar link catálogo público`. At ≤767 they stack full-width and consume **150–152 px** of vertical space.
- The three ghost links render as **centered plain text** with no border, background or icon — they read as body copy, not controls.
- Touch heights (measured, 360 and 390): primary **36**, ghost links **32 / 32 / 32**, search **38**, selects **36 / 36 / 36**. The only compliant control on the page is the shell burger (**44×44**).
- Inverted scaling: at ≤479 the primary CTA min-height *drops* from `2.375rem` to `2.25rem` — the smallest screens get the smallest target.
- Combined header + toolbar + catalog header/metrics leave roughly **1.5 product cards above the fold** at 360×800.

Toolbar behaviour is otherwise correct: search has `aria-label="Buscar productos"`, `type="search"`, 300ms debounce, resets `page`; the three selects are native with `aria-label`s; `Limpiar filtros` appears only when a filter is active. Search results verified (`?q=combo` → exactly the 6 combos, summary updated to "6 productos").

Two defects surfaced in the filter states:

- With an active filter, **`Limpiar filtros` appears twice** simultaneously (toolbar + empty state).
- The summary line mixes filtered products with unfiltered categories ("0 productos · 5 categorías").

---

# Product collection

Product item anatomy (mobile card, measured at 390): image **71×72** `object-fit: cover`, availability badge overlaid on the image (10px text), product name `h3` **13px/600**, price `strong` **13px/650**, `Gestionar` hint 11px, card **332×74**.

- **No typographic hierarchy between name and price**: both 13px, both `rgb(9,9,11)` (19.9:1), weights 600 vs 650. Name and price are visually interchangeable.
- The per-card category `<p>` **is rendered and then hidden** (`display: none`) on mobile — dead markup, already redundant with the category section header.
- Mobile shows **no stock and no SKU**, and — critically — **no availability control**. The desktop table exposes `ProductAvailabilityToggle` per row plus a kebab action; the mobile card offers only "open editor". Meanwhile the toolbar still offers `Agotados (0)` / `Bajo stock (1-5)` filters whose result the operator cannot see on mobile.
- No wrapping, truncation or `nowrap` defects were found: names up to "Coca Cola 500ml" / "Crispy Chicken" fit on one line (name box 210–240px), long descriptions wrap normally, and no product in the fixture lacks an image (the `Sin foto` placeholder path exists in both renderers but was not exercisable read-only).
- No accidental horizontal scroll at any width; no clipped cards.

Structural finding: `product-catalog-views.tsx` mounts **both** renderers unconditionally and hides one with CSS. Measured consequence: **38 `<img>` elements for 18 products** (19 visible / 19 hidden), **14 for 6** filtered products. The hidden set is `loading="lazy"` inside `display:none`, so it does not fetch, but it doubles DOM, doubles React work, and doubles the `quality` warning surface.

---

# Create / edit surfaces

Both are rendered by `FlyoutPanel` with a shared `product-form.module.css`. Geometry at 390 is correct: the dialog is **full-viewport 390×844 at (0,0)**, `body` is scroll-locked, and the panel body is the **single** internal scroller (`scrollHeight 1147 / clientHeight 767`) — no nested scroll competition.

Create vs edit are properly distinguished: eyebrow `Alta` + title `Nuevo producto` vs eyebrow `Editar producto` + title = product name. Create's `Guardar producto` starts **disabled**; edit's `Guardar cambios` is enabled immediately (permits a no-op save). No delete/destructive action is offered in the edit surface.

Defects:

- **Sticky footer has no surface.** `.actions` is `position: sticky` with `background-color: rgba(0,0,0,0)`, `backdrop-filter: none`, `box-shadow: none`, `border-top: 0`. Form content scrolls *behind* it: the **`SKU` label** was measured underneath the sticky bar (label y=784, bar y=788–844) in **both** create and edit, and is visibly bisected by the CTA.
- Touch targets are mixed: `Guardar` **166×44** and `Cerrar` **84×44** comply, but the image crop trigger is **32×32**.
- Microcopy: the uploader says `Arrastrá tu imagen o hacé clic` (dragging is not available on touch), and the crop control is labelled `Haga clic para recortar` — formal *usted* register that breaks the app's *voseo* voice and is click-specific.
- The image uploader is exposed as a **readonly textbox** whose accessible name is the instruction string, rather than a file input or button.

---

# Scroll / density

Scroll ownership at 390 is **clean**: the document is the single scroller, `overflow`-based nested scrollers = **0**, horizontal scrollers = **0**. Scrolled to the bottom (`scrollY 1518 / maxScroll 1518`): the last card ("Napolitana") is **fully visible**, the footer is reachable and usable, and there are **no fixed overlays** covering content. Page height = **2.8 viewports** for 18 products. Pagination is in the DOM but correctly not rendered (18 ≤ page limit). `body` carries no explicit bottom safe-area padding, but with no fixed bottom bar on Products the exposure is nil.

At ≥900 the scroller changes owner to `admin-shell__main` — shell design, not a Products defect.

Density answers: a long list is **not** quickly scannable on mobile (header+toolbar cost ~330px before the first card; name and price share one type scale; the primary per-item action is an 11px low-contrast `Gestionar` hint); information is repeated (toolbar summary vs catalog metrics); mobile currently reads as a **read-only browser of the catalog** rather than an operational tool, because the availability control exists only on desktop. Create/Edit keep enough context (product name in the dialog title, current image, current values) and are not over-tall for their content.

---

# Accessibility

Evidence-backed only, at 390 and 1024:

- **Two `<h1>`** on the page: `La Burguesía` (shell) and `Productos` (page header).
- Heading levels are non-sequential: `h1 → h1 → h2 "Catálogo" → h3 category → h3 product`, and the no-results state uses **`h4`**. Category and product occupy the **same level**, flattening the collection structure.
- **No focus management in the flyout** despite `aria-modal="true"`: Escape does **not** close it, no initial focus is moved in (`activeElement` stayed `BODY` for create and on the opener card for edit), **9–11 tabbable elements remain outside** the dialog, the background is not `aria-hidden`, and there is no return-focus. The backdrop is a `div` with `tabIndex -1` and a meaningless `aria-hidden="false"`.
- **Zero** `:focus-visible` rules and zero `:focus` rules across Products modules; product cards are `role="button" tabIndex={0}` `div`s relying entirely on UA/global defaults.
- Positive `tabindex`: **0** (clean).
- Accessible names are otherwise good: cards `Editar {name}`, kebab `Acciones para {name}`, search and all three selects labelled, table headers use `scope="col"`, the actions column uses `sr-only`.
- Status is conveyed by more than colour in both views (`Activo` / `Inactivo` text, badge + label).

---

# Light / dark

Dark mode is healthy: canvas `rgb(9,10,13)`, card `rgb(23,24,29)`, hairline `rgba(255,255,255,0.08)`, and **all** measured informative text passes AA (**6.91:1 – 16.94:1**). No dark uniform slab, no illegible tertiary text, no hardcoded light colours surfaced.

Light mode is where the materiality debt is, and it is a **tertiary-text contrast failure** (`#a1a1aa` on white):

| Element | Light contrast | AA |
| ------- | -------------- | -- |
| `Gestionar` per-card action (11px) | **2.56:1** | FAIL |
| `Por categorías` catalog subtitle (12px) | **2.56:1** | FAIL |
| category count `2 productos` (11px) | **2.56:1** | FAIL |
| card name / price (13px) | 19.9:1 | pass |
| status badge `Activo` (10px) | 4.84:1 | pass |
| toolbar summary (13px) | 7.39:1 | pass |

The same strings are legible in dark (`rgb(148,163,184)`, 6.91:1), so this is **light-specific**. It is the same root-cause class the manual order modal already resolved locally with a dedicated auxiliary text token.

---

# Console

Captured on a stable authenticated load at 390 and across a client re-render (filter change), grouped by root cause:

| Group | Level | Count | Verdict |
| ----- | ----- | ----- | ------- |
| Next Image `quality` | warn (server-side) | once per unique `src` | config debt, currently inert — see below |
| React hydration mismatch (`ProtectedAdminLayout`) | error | 1, intermittent | owner outside Products |
| `store-sessions-hydration` | info/warn | **0** | not reproduced on Products |
| Products-specific errors | error | **0** | — |
| Products-specific warnings | warn | **0** | — |

Browser console on a stable Products load: **0 errors, 0 warnings**. The only client-side error observed in the whole session was a **React hydration mismatch** attributed by the dev overlay to `app/admin/(protected)/layout.tsx (28:7) @ ProtectedAdminLayout` — i.e. the shared `AdminShell` subtree, not Products. It appeared on the first load and did **not** reproduce on subsequent reloads → intermittent, owner outside Products.

## Next Image quality

**CONFIRMED as real config debt, but server-side and currently without visual effect.**

The warning is emitted by `next/dist/shared/lib/get-img-props.js` L423–427, whose condition is `qualityInt && config.qualities && !config.qualities.includes(qualityInt)`, producing exactly:

```text
Image with src "…" is using quality "80" which is not configured in images.qualities [75].
Please update your config to [75, 80].
Read more: https://nextjs.org/docs/messages/next-image-unconfigured-qualities
```

Answers to the trace questions:

- **A / B — callsites passing 80:** three. `components/admin/products/product-card.tsx:78`, `components/admin/products/product-table-view.tsx:73`, and `components/public/catalog/public-storage-image.tsx:28` (default parameter). Additionally `lib/supabase/image-loader.ts` sets its own `DEFAULT_QUALITY = 80`.
- **C — scope:** **not Products-only.** One of the three callsites is the **public catalog**, and the shared loader defaults to 80. A fix is therefore not Products-local.
- **D — config:** `next.config.ts` declares `images.loader`, `loaderFile` and `remotePatterns` but **no `qualities` key**; Next **16.2.9** defaults `qualities: [75]` (`image-config.js` L70). So `[75]` is a framework default, not an explicit project decision.
- **E — frequency:** Next uses `warnOnce`, keyed on the full message (which embeds `src`) → **once per unique image URL**, not once per render and not once in total. The dual-mount collection does not multiply it, because both renderers use the same `src`.
- **F — fallbacks / broken images:** no broken images; the fallback path *is* engaged (see below).
- **G — runtime impact:** **none from the quality value itself.** Because transforms are disabled, images take the `unoptimized` origin path where `quality` is not applied at all. Fixing 80→75 or adding `[75, 80]` would silence the console without changing a single delivered byte.

Classification: **P3** (consistent technical warning, no visible impact) — explicitly *not* the image problem worth fixing first.

## Store session hydration

**NOT REPRODUCED on `/admin/products` → CASE A (transient / no active Products debt).**

Source trace: the tag is `[store-sessions-hydration]` (plural), emitted only from `components/admin/orders/admin-dashboard-orders.tsx`; the action is `getActiveStoreSessionHydrationAction` in `app/admin/(protected)/dashboard/actions.ts`. Neither is imported anywhere under Products.

- **Who triggers it:** the Orders dashboard orchestrator, on its own recovery paths (focus/visibility/reconnect), throttled.
- **What `unauthorized` means:** the action's `getAdminContext()` returned `null`, so it returns `{ ok: false, reason: "unauthorized" }` — a *result*, never a throw or redirect.
- **Why the caller can be non-redirecting:** on `!result.ok` the caller logs `"non-redirecting hydration skipped"` and `return false`, deliberately leaving existing state untouched rather than bouncing the operator to login.
- **Does Products depend on it:** **no** — zero references, and the component is not mounted on this route.
- **Is the session operative:** yes.
- **Log gating:** the warn is wrapped in `if (DEBUG_REALTIME)` where `DEBUG_REALTIME = process.env.NODE_ENV === "development"` → **it cannot appear in production**.

Three focus cycles (blur → visibilitychange → focus → online, ~2.3s settle each) on a stable, authenticated, fully loaded Products page:

| Cycle | reason | resultReason | store-session logs | new requests | route | redirect | session visible | UI break |
| ----- | ------ | ------------ | ------------------ | ------------ | ----- | -------- | --------------- | -------- |
| 1 | — (none fired) | — | 0 | 0 | `/admin/products` | no | yes | no |
| 2 | — (none fired) | — | 0 | 0 | `/admin/products` | no | yes | no |
| 3 | — (none fired) | — | 0 | 0 | `/admin/products` | no | yes | no |

3/3 clean; 18 cards and the search field intact after each cycle. Auth/session was not modified.

---

# Network observations

Timings are recorded as observation only (`next dev`), not classified as performance bugs. One item does clear the §20 bar for escalation because it is repeatable, redundant and payload-driven.

- **Initial load / filter change:** search and filters go through `router.push` → server render; no polling, no fetch loop, no duplicate server actions.
- **Failed requests:** every Supabase **`/render/image/`** request returns **403**. Verified directly: `GET /storage/v1/render/image/public/product-images/…?width=96&quality=80` → **403**; the same object via `/object/public/…` → **200, 2,203,916 bytes (2.2 MB), image/png**.
- **Redundant waterfall:** on a page showing only **6** products, **41** Supabase image requests were recorded — **23 render attempts** (each 530–900 ms before failing) followed by **18 origin fetches**, with **6 duplicate URLs**. Every image pays a failed transform round-trip before falling back.
- **Oversized images:** product thumbnails display at **71×72 CSS px** while the decoded bitmap is **764×764** (or 854×683) → **~10.8× linear / ~117× area** overscale. The business logo is **866×867** for a **34×34** slot (**25.5×**).
- **401 / 403 on app routes:** none. **Accidental mutations:** none. No mutative POST was issued.

Root cause is documented in the loader itself (`lib/supabase/image-loader.ts`): *"Requires Image Transformations enabled on the Supabase project; otherwise the render endpoint responds 403 FeatureNotEnabled and callers should fall back to `toSupabaseObjectPublicUrl` with `unoptimized`."* The designed fallback is working exactly as written — which is precisely why the real cost is invisible in the console.

---

# Findings

| ID | Severity | Surface | Root cause | Owner | Follow-up |
| -- | -------- | ------- | ---------- | ----- | --------- |
| PROD-P1-1 | **P1** | list / no-result state | **PROVEN** — `page.tsx` computes `totalCount` via `getAdminProducts(..., {...filterOptions})`, so it is *filter-scoped*; `resolveEmptyCatalogFlyoutMode()` reads `totalCount === 0` as "empty catalog" and forces `flyoutMode="create-product"`. A zero-result query therefore auto-opens the full-viewport Create Product dialog over the (correct) `No se encontraron productos` empty state. | `products/page.tsx`, `products-management-provider.tsx` | Phase 1 |
| PROD-P2-1 | P2 | all product images (+ public catalog) | **PROVEN** — Supabase Image Transformations disabled → `/render/image/` **403** → documented `unoptimized` origin fallback → full originals delivered (2.2 MB for 71×72; 10.8× overscale; 23 failed transform round-trips of 530–900 ms) | Supabase project config + `image-loader.ts` consumers | Phase 2 |
| PROD-P2-2 | P2 | collection | **PROVEN** — `product-catalog-views.tsx` mounts table **and** grid unconditionally, CSS-hiding one at 900px → 38 `<img>` / 18 products, doubled DOM and render work | `product-catalog-views.tsx` + `.module.css` | Phase 2 |
| PROD-P2-3 | P2 | header, toolbar, form | **PROVEN** — module min-heights below 44px: ghost links `2rem`=32, primary `2.375rem`=38→**`2.25rem`=36 at ≤479**, selects 36, search 38, crop 32. 8 of 9 representative mobile controls fail; only the shell burger (44×44) passes | `products-header-actions.module.css`, `products-toolbar.module.css`, `product-form.module.css` | Phase 3 / 4 |
| PROD-P2-4 | P2 | create + edit flyout | **PROVEN** — `.actions` is `position: sticky` with transparent background, no `backdrop-filter`, no `box-shadow`, no `border-top`; the `SKU` label measured beneath the bar in both surfaces | `product-form.module.css` | Phase 4 |
| PROD-P2-5 | P2 | flyout (create + edit) | **PROVEN** — `aria-modal="true"` with no focus management: Escape does not close, no initial focus, 9–11 tabbables outside, background not `aria-hidden`, no return focus | `flyout-panel.tsx` | Phase 4 |
| PROD-P2-6 | P2 | product card, catalog header (LIGHT only) | **PROVEN** — `#a1a1aa` on white = **2.56:1** for `Gestionar`, `Por categorías`, category count; dark equivalents pass at 6.91:1 | `product-card.module.css`, `product-grid.module.css` | Phase 3 |
| PROD-P2-7 | P2 | mobile collection | **PROVEN** — `ProductCard` renders no stock, no SKU and **no availability toggle**, while `ProductTableView` (≥900) exposes `ProductAvailabilityToggle` + kebab and the toolbar still offers stock filters | `product-card.tsx` vs `product-table-view.tsx` | Phase 3 |
| PROD-P2-8 | P2 | mobile page header | **PROVEN** — 4 stacked full-width actions = **150–152 px**; 3 ghost links render as centered plain text with no control affordance; ~1.5 cards above the fold at 360×800 | `products-header-actions.*` | Phase 3 |
| PROD-P3-1 | P3 | collection | **PROVEN** — `@media (min-width:768px) and (max-width:899px)` overrides the 480px 2-column rule → 2 cols at 719 but **1 stretched 810px col at 899** | `product-grid.module.css` | Phase 3 |
| PROD-P3-2 | P3 | responsive system | **PROVEN** — three "desktop" thresholds: collection 900, flyout **961**, toolbar 768/1024 | products modules | Phase 3 |
| PROD-P3-3 | P3 | console (server) | **PROVEN** — no `images.qualities` in `next.config.ts`; Next 16.2.9 defaults `[75]`; 3 callsites pass 80 (incl. **public catalog**) + loader `DEFAULT_QUALITY = 80`; `warnOnce` → once per unique src; **inert** while transforms are 403 | `next.config.ts`, `product-card.tsx`, `product-table-view.tsx`, `public-storage-image.tsx`, `image-loader.ts` | Phase 2 |
| PROD-P3-4 | P3 | toolbar + catalog header | **PROVEN** — duplicated counts (`18 productos · 5 categorías` twice, second extended with activos/inactivos); wraps at 360 leaving a trailing `·`; summary mixes filtered products with unfiltered categories | `products-toolbar.tsx`, `product-grid-server.tsx` | Phase 3 |
| PROD-P3-5 | P3 | page semantics | **PROVEN** — two `<h1>`; category and product both `<h3>`; no-result state `<h4>` under `<h2>` | `admin-page-header` (shared) + `product-grid-server.tsx`, `product-card.tsx`, `product-catalog-empty-state.tsx` | Phase 3 |
| PROD-P3-6 | P3 | product card | **PROVEN** — per-card category `<p>` rendered then `display:none` on mobile; redundant with the section header | `product-card.tsx` + `.module.css` | Phase 3 |
| PROD-P3-7 | P3 | create/edit microcopy | **PROVEN** — `Arrastrá tu imagen o hacé clic` (drag unavailable on touch); `Haga clic para recortar` uses formal *usted*, breaking the app's *voseo* voice | `create-product-form.tsx`, `edit-product-form.tsx`, `image-crop-modal.tsx` | Phase 4 |
| PROD-P3-8 | P3 | keyboard affordance | **PROVEN** — **0** `:focus-visible` and **0** `:focus` rules in Products modules; cards are focusable `div`s with `role="button"` | products modules | Phase 4 |
| PROD-P3-9 | P3 | filtered state | **PROVEN** — `Limpiar filtros` rendered twice simultaneously (toolbar + empty state) | `products-toolbar.tsx`, `product-catalog-empty-state.tsx` | Phase 1 |
| PROD-P3-10 | P3 | shared admin shell | **SUSPECTED** — intermittent React hydration mismatch attributed to `app/admin/(protected)/layout.tsx (28:7) @ ProtectedAdminLayout`; seen once on first load, not reproduced on reload. **Owner outside Products** | `app/admin/(protected)/layout.tsx` → `AdminShell` | Separate (see below) |
| PROD-P3-11 | P3 | documentation | **PROVEN** — `admin-dashboard-forensic-living-audit.md` states Products is `SAME DOM + CSS responsive`; it is actually a **dual-mount** pattern like the dashboard overview, and its 900/961 breakpoints are unlisted | living audit doc | Fold into whichever phase lands first |

Store-session focus hydration is deliberately **not** listed as Products debt: not reproduced here, owner outside Products, dev-only, non-redirecting.

---

# Recommended sequence

1. **ADMIN-PRODUCTS-EMPTY-STATE-FLYOUT-AUTOOPEN-FIX-1** — PROD-P1-1, PROD-P3-9. Smallest surface, only functional blocker. Separate the "catalog is empty" signal from the "current filter matched nothing" signal (an unfiltered total alongside the filtered one), so the create flyout only auto-opens for a genuinely empty catalog.
2. **ADMIN-PRODUCTS-IMAGE-DELIVERY-RECONCILIATION-1** — PROD-P2-1, PROD-P2-2, PROD-P3-3. Highest real-world cost. Requires an explicit decision on Supabase Image Transformations before any code change, and must be scoped deliberately because the third `quality: 80` callsite and the shared loader default are **public catalog** territory.
3. **ADMIN-PRODUCTS-MOBILE-HEADER-COLLECTION-DENSITY-POLISH-1** — PROD-P2-8, PROD-P2-3 (header/toolbar), PROD-P2-6, PROD-P2-7, PROD-P3-1, PROD-P3-2, PROD-P3-4, PROD-P3-5, PROD-P3-6. Pure feature-local CSS/markup within Products modules.
4. **ADMIN-PRODUCTS-FLYOUT-FORM-SURFACE-A11Y-POLISH-1** — PROD-P2-4, PROD-P2-5, PROD-P2-3 (form/crop), PROD-P3-7, PROD-P3-8. Reuse the focus-containment pattern already certified in the manual order modal.

Outside Products, **must not be merged** into the above (owner is the shared admin shell / orders domain):

- **ADMIN-SHELL-PROTECTED-LAYOUT-HYDRATION-AUDIT-1** — PROD-P3-10, only if it reproduces.
- **ADMIN-STORE-SESSION-FOCUS-HYDRATION-AUDIT-1** — optional; this audit found no active debt, so it is defensible to close the question without a phase.

---

# Hard boundaries

Read-only inspection only, no edits, of: `components/admin/admin-page-layout.*`, `admin-surfaces.css`, `app/globals.css`, `app/theme-tokens.css`, `components/ui/Button*|Input*|Card*`, `products/actions.ts`, `lib/products/admin.ts`, auth/context/permissions, store-session domain, public catalog, `/admin/products/preview`, `/admin/products/customizations`, categories, dashboard/orders, `next.config.ts`, `node_modules/next` (warning-path verification).

No fix was pre-applied: `quality` was **not** changed 80→75, `images.qualities` was **not** added, hydration was **not** touched, no CSS was modified, no tap target was resized.

Data: no product created, edited, deleted, reordered; no availability, category or image mutated; no crop saved; no upload. DB / RPC / migrations untouched. Nothing staged, committed, pushed or deployed.

Theme was toggled to dark and **restored to light** via the real admin control. Six screenshots were taken to the OS temp directory; none were written into the repository.

---

# Gate

**ADMIN-PRODUCTS-MOBILE-VISUAL-DEBT-AUDIT-1 = AUDIT COMPLETE**

Gate checklist: Products ownership mapped ✔ · real breakpoints inspected from CSS ✔ · 360/390/412-class covered ✔ · light + dark covered via the real toggle ✔ · collection audited ✔ · create + edit inspected read-only ✔ · mobile scroll verified single-owner ✔ · representative touch targets measured ✔ · console grouped by root cause ✔ · `quality=80` confirmed (server-side, inert) ✔ · focus hydration tested 3/3 in a stable authenticated session ✔ · zero product mutations ✔ · zero runtime/CSS changes ✔ · zero shared/global file changes ✔ · DB/RPC untouched ✔ · every finding carries severity + owner ✔ · follow-up phases derived from measured evidence ✔

**NEXT: ADMIN-PRODUCTS-EMPTY-STATE-FLYOUT-AUTOOPEN-FIX-1**
