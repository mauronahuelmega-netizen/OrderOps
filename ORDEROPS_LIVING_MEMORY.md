# OrderOps â€” Living Memory (Cerebro Inmutable)

> **PropÃ³sito:** Este archivo es la memoria viva y autoritativa del proyecto. Cualquier refactorizaciÃ³n importante, cambio de esquema, nueva ruta, mÃ³dulo o patrÃ³n arquitectÃ³nico **debe registrarse aquÃ­** para preservar el contexto histÃ³rico entre sesiones de desarrollo y agentes IA.
>
> **Actualizar tras:** migraciones SQL, cambios en Realtime/RLS, nuevos mÃ³dulos tenant, reestructuraciÃ³n de carpetas, introducciÃ³n de feature flags, cambios en el flujo de pedidos o en el sistema de estilos.

**Ãšltima auditorÃ­a:** 2026-06-06  
**Stack:** Next.js 15.3 Â· React 19 Â· TypeScript 5.8 Â· Supabase SSR/JS 2.49

---

### 2026-08-12 - Public Catalog MVP Entry Routing — Catalog-first

Status: **COMPLETE_WITH_ACCEPTED_P3_FALLBACK_DEBT**.

Release: `feat(public-catalog): add catalog-first entry routing` on `cursor-handoff-public-catalog-ui-redesign` → production `https://orderops.vercel.app`.

Behavior:

- `/b/[slug]` Case A: invalid/inactive → `notFound()`
- Case B ready: server `redirect()` → `/b/[slug]/catalogo` (+ preserve searchParams; never external `redirectTo`/`next` as destination)
- Case C not-ready: `PublicBusinessFallbackHome` (no “Ver catálogo”; WA inquiry CTA only if number valid)
- Readiness: `hasReadyPublicCatalog` via `loadPublicCatalogByBusinessId` — **does not** use `on_demand_mode_active` / store sessions
- Header: no visible Home; brand → `/b/[slug]`; Catálogo visible
- Long landing (`BusinessLandingPage`) preserved unused as primary entry

Key files:

- `app/b/[slug]/page.tsx`
- `lib/business/public-catalog-readiness.ts`
- `components/public/business/public-business-fallback-home.tsx` (+ module CSS)
- `components/public/business/public-business-header.tsx`
- `lib/whatsapp/public.ts` (`buildPublicBusinessInquiryWhatsappUrl`; `buildPublicOrderWhatsappUrl` intact)

Docs: `docs/public-catalog-mvp-entry-routing-{audit,spec,impl,qa}-1.md`.

Accepted debt: P3 — no real not-ready public tenant for browser QA without DB/product mutation.

Gates: `PUBLIC-CATALOG-MVP-V1-ENTRY-COMPLETE = COMPLETE_WITH_ACCEPTED_P3_FALLBACK_DEBT`; success edge OPTIONAL; Maps PAUSED.

### 2026-08-12 - Public Catalog Motion — Final Handoff

Status: **COMPLETE**.

Final production commit: `3d83afd6f0919598df46066fb3aabd34ecfb5d06` (`feat(public-catalog): add remaining overlay motion`).

Production: `https://orderops.vercel.app` — deployment `dpl_EFjoBKzm7mi2A39zNmynDXeGRWsT`.

Public catalog motion now includes:

- ProductCard press / badge pop
- Cart FAB/count pulse
- category transition
- CartSheet enter/exit
- Customization modal enter/exit
- Post-add upsell enter/exit
- Product detail modal enter/exit
- reduced-motion support (`public-overlay-motion.ts`, CSS + JS PRM gates)

Release chain: `ebfa5b2` (interactions) → `e682568` (CartSheet overlay) → `3d83afd` (remaining overlays).

Doc: `docs/public-catalog-motion-final-handoff-1.md`.

Safety:

- create_order: 0
- pedidos reales: 0
- WhatsApp: 0
- DB/RPC/actions/packages: 0

Known debt:

- ESLint 9 circular JSON/config-validator = P3 tooling
- hydration warning catálogo público = P3 preexisting

Gates: `PUBLIC-CATALOG-MOTION-PUBLIC-CATALOG-COMPLETE = COMPLETE`; success edge OPTIONAL; Maps PAUSED; public_order_code BACKLOG.

### 2026-08-10 - Public Catalog UI Redesign Final Commit-1
- **[Release]** Local commit `feat(public-catalog): complete UI redesign closeout` on `cursor-handoff-public-catalog-ui-redesign`. Packages catalog/checkout/success/FAB/ProductCard/header/nav runtime + phase docs. No push/deploy.
- Doc: `docs/public-catalog-ui-redesign-final-commit-1.md`
- Gates: `PUBLIC-CATALOG-UI-REDESIGN-PUSH-DEPLOY-1 = ALLOWED`; production smoke PAUSED_UNTIL_DEPLOY; Maps PAUSED; `public_order_code` BACKLOG.
- Debt: ESLint tooling circular P3; hydration overlay P3.

### 2026-08-10 - Public Catalog UI Redesign Closeout-1
- **[Release/UI]** Closeout formal del rediseño público (catalog/checkout/success/FAB/ProductCard/header/nav) en branch `cursor-handoff-public-catalog-ui-redesign`. Helper `getRootQuantityForProduct` para badges ProductCard (legacy + V2 parents; excluye upsells). Sin commit/push/deploy en esta fase.
- Files: runtime catalog/checkout/success/globals + `lib/cart/local.ts`; docs de fases + `docs/public-catalog-ui-redesign-closeout-1.md`; `docs/CURRENT_PHASE.md`.
- Safety: DB/migrations/RPC/actions/package/lockfile/cart signatures/storage/create_order unchanged; real orders `0`.
- Gates: `PUBLIC-CATALOG-UI-REDESIGN-FINAL-COMMIT-1 = ALLOWED`; push/deploy/smoke PAUSED_UNTIL_COMMIT/DEPLOY; Maps PAUSED; `public_order_code` BACKLOG; success edge OPTIONAL.
- Debt: ESLint tooling circular; hydration overlay P3 en dev; keyboard/Maps QA debt previo.

### 2026-08-01 - Public Catalog Post-Add Followup-2 Partial Re-Monitor
- **[Ops]** `origin/main` reconciled at `3f253ee`; focus fix ancestry and runtime continuity passed. Production Chrome verified Doble Smash modal, Plus absence, created-to-post-add, attach, and eight forward/backward Tab cycles before and after attach with zero escapes.
- **[Ops]** The single complete-suite retry timed out on the CartSheet locator after `Listo`; classified inconclusive automation coverage, not an application regression. Final handoff remains blocked; no runtime, DB, checkout submit, or real orders.

### 2026-08-01 - Public Catalog Post-Add Focus Trap Fix
- **[UI/Ops]** `2322999434ed113f897a67c796eb3adde55d7743` moves the post-add Tab handler to document capture, filters visible focusables, and prevents empty-cycle escape. Production Chrome + bundled Codex Playwright verified focus containment before and after attach.
- Files: `components/public/catalog/post-add-upsell-sheet.tsx`, `docs/public-catalog-post-add-upsell-focus-trap-fix-1.md`
- Safety: no DB/migrations/RLS/RPC/admin/product/upsell/store-session mutations; checkout submit not executed; real orders `0`; no manual deploy or Vercel CLI.
- Gates: `PUBLIC-CATALOG-POST-ADD-UPSELL-POST-DEPLOY-MONITOR-1-FOLLOWUP-2 = ALLOWED`; `PUBLIC-CATALOG-POST-ADD-UPSELL-FINAL-HANDOFF-1 = BLOCKED`.
- Debt: local build/browser blocked by pre-existing CSS module errors; provider logs/deployment identity, real device, screen reader, preview, closed-store, PWA, and historical fixture timeouts remain unverified.

## 1. Resumen ArquitectÃ³nico

### VisiÃ³n

OrderOps es un **SaaS multi-tenant** de operaciones de pedidos para negocios locales (catÃ¡logo pÃºblico + panel admin operativo). Cada tenant es un `business` identificado por `business_id` en BD y `slug` en rutas pÃºblicas.

### Capas del sistema

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  PÃšBLICO (/b/[slug]/â€¦)                                      â”‚
â”‚  CatÃ¡logo â†’ Carrito (localStorage) â†’ Checkout â†’ RPC       â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                              â”‚
                              â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  SUPABASE (Postgres + Auth + RLS + Realtime + Storage)      â”‚
â”‚  businesses Â· profiles Â· orders Â· products Â· store_sessions  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                              â”‚
                              â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  ADMIN (/admin/â€¦)                                           â”‚
â”‚  Dashboard operativo Â· Workspace Â· Team Â· Settings          â”‚
â”‚  Realtime + Presence + Push + Audio notifications           â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                              â”‚
                              â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  SUPER-ADMIN (/super-admin/â€¦)                               â”‚
â”‚  GestiÃ³n de negocios y usuarios plataforma                  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Estructura de carpetas

| Ruta | Responsabilidad |
|------|-----------------|
| `app/` | App Router: layouts, pÃ¡ginas, route handlers, `theme-tokens.css`, `globals.css` |
| `components/admin/` | UI admin: orders dashboard, shell, nav, notifications, products, team, settings |
| `components/public/` | CatÃ¡logo, checkout, landing, theme toggle |
| `components/super-admin/` | Forms de gestiÃ³n plataforma |
| `components/ui/` | Primitivas compartidas (`Button`, `Badge`, `Input`, `EmptyState`, `Skeleton`) |
| `lib/orders/` | Cerebro operativo: queries, realtime, lanes, metrics, SLA/saturation BI, prescriptive actions, presenter, sorting |
| `lib/supabase/` | Clientes browser/server/middleware/service |
| `lib/admin/` | Context, permissions, team, action errors |
| `lib/store-sessions/` | Apertura/cierre/hidrataciÃ³n de sesiones de tienda |
| `lib/notifications/` | Audio, push, browser, preferences, dedupe |
| `lib/catalog/`, `lib/business/`, `lib/products/` | CatÃ¡logo y CRUD admin |
| `supabase/migrations/` | Esquema, RLS, RPC, publicaciones Realtime |
| `types/database.ts` | Tipos generados Supabase |
| `docs/` | DocumentaciÃ³n de fases, auditorÃ­as y decisiones |

### Rutas principales

**PÃºblico**
- `/` â€” Landing marketing
- `/b/[slug]` â€” Landing del negocio
- `/b/[slug]/catalogo` â€” CatÃ¡logo
- `/b/[slug]/checkout` â€” Checkout â†’ RPC `create_order`
- `/b/[slug]/success` â€” ConfirmaciÃ³n

**Admin** (protegido por `requireAdminContext()`)
- `/admin/dashboard` â€” Dashboard operativo (SSR + `AdminDashboardOrders`)
- `/admin/orders/[id]` â€” Detalle profundo
- `/admin/products`, `/admin/categories`, `/admin/team`
- `/admin/settings/public/*` â€” Branding, catÃ¡logo hero, notificaciones

**API interna (reconciliaciÃ³n)**
- `GET /admin/dashboard/orders` â€” Silent refresh lista completa
- `GET /admin/orders/[id]/summary` â€” HidrataciÃ³n completa post-Realtime
- `GET /admin/orders/[id]/workspace` â€” HidrataciÃ³n workspace
- `POST /api/internal/orders/[id]/push` â€” Web push server-side

**Super-admin**
- `/super-admin/businesses`, `/super-admin/users`

### Auth y middleware

- `middleware.ts` â†’ `lib/supabase/middleware.ts` refresca cookies en `/admin/*` y `/b/*`
- Admin: `profiles.business_id` + `role` â†’ `lib/admin/context.ts`
- Super-admin: `role = 'super_admin'`, `business_id` nullable

### PatrÃ³n Realtime (ReconciliaciÃ³n Defensiva)

```
Evento Supabase â†’ patch optimista â†’ hidrataciÃ³n defensiva â†’ silent refresh â†’ estado convergente
```

**Canales activos:**
| Canal | Tabla/Evento | Hook |
|-------|--------------|------|
| `admin-orders:{businessId}` | `orders` INSERT/UPDATE | `use-admin-orders-realtime.ts` |
| `store-session-{businessId}` | `store_sessions` | `use-admin-store-session-realtime.ts` |
| `business-presence:{businessId}` | Presence | `use-admin-presence.ts` |

**Candados sÃ­ncronos:** `pendingMutationsRef` (Map in-memory, TTL 8s) â€” no locks de BD.

**Cadena de derivaciÃ³n:**
```
orders â†’ hydratedOrders â†’ optimisticOrders â†’ windowScopedOrders â†’ filteredOrders â†’ lanes/metrics/insights
```

### Sistema de estilos

| Capa | Archivo | Uso permitido |
|------|---------|---------------|
| Tokens semÃ¡nticos | `app/theme-tokens.css` | Variables CSS Zinc/Ãndigo â€” light/dark vÃ­a `html[data-dashboard-theme]` + `localStorage` (`orderops-theme`) |
| Superficies compartidas | `components/admin/admin-surfaces.css` | `.oo-canvas`, `.oo-surface`, `.admin-status-badge*` â€” **congelado** |
| Dominio orders | `components/admin/orders/*.module.css` | **100% CSS Modules + tokens** â€” `orders-admin.css` **eliminado** |
| Dominio products | `components/admin/products/*.module.css` | **100% CSS Modules + tokens** â€” `products-admin.css` **eliminado** |
| Componentes | `*.module.css` | **Ãšnico destino para estilos nuevos** |

Paleta: Zinc (`#FAFAFB`, `#09090B`) + Ãndigo (`#4F46E5`, `#6366F1`). SVGs: `contain: paint layout`.

### Tenancy y permisos

- **Clave real:** `business_id` (no `tenant_id` en cÃ³digo ni BD)
- **Roles:** `owner`, `manager`, `operator`, `viewer`, `admin` (legacy), `super_admin`
- **Matriz:** `lib/admin/permissions.ts`
- **RLS:** subquery `profiles.business_id` en todas las tablas tenant

### MÃ³dulos y modos (estado)

| Feature | Estado | Notas |
|---------|--------|-------|
| Dashboard operativo + lanes | âœ… ProducciÃ³n | `admin-dashboard-orders.tsx` (~2700 lÃ­neas; orquestador + extracciones Fase 8) |
| Store Sessions | âœ… ProducciÃ³n | Ventana operativa `store-session` vs `business-window` |
| Assignment + Presence | âœ… ProducciÃ³n | `assigned_to`, heartbeat 30s, stale 90s |
| Order Events (timeline) | âœ… ProducciÃ³n | `order_events` append-only |
| Push + Audio + Browser notif. | âœ… ProducciÃ³n | `push_subscriptions`, audio unlock modal |
| **GestiÃ³n de Productos (admin)** | âœ… **ProducciÃ³n** | MÃ³dulo finalizado â€” ver Â§1.1 |
| Kitchen Mode | ðŸ”® Roadmap | Documentado en `docs/context.md` |
| Delivery Mode | ðŸ”® Roadmap | Lanes delivery parcialmente implementadas |
| On-Demand vs Programado | ðŸ”® Roadmap | Sin flags runtime; `delivery_date` existe en schema |

---

## 1.1 MÃ³dulo de Productos (Finalizado)

> **Estado:** âœ… **ProducciÃ³n** â€” 2026-06-11  
> **Ruta:** `/admin/products`  
> **Alcance:** CRUD de productos, filtros server-side, flyout de creaciÃ³n/ediciÃ³n, tabla de alta densidad, motor de imÃ¡genes y estados vacÃ­os. Documentado como referencia arquitectÃ³nica para futuros mÃ³dulos admin.

### Arquitectura de Datos â€” 2026-06-11

- **SKU autogenerado:** `createProductAction` genera SKU con formato `AAA-000` a partir del prefijo de la categorÃ­a cuando el campo se deja vacÃ­o (Fase 12.1).
- **Columnas operativas:** MigraciÃ³n `20260610103000_add_product_sku_stock.sql` â€” campos `sku` y `stock` en `products`.
- **Integridad SQL (Supabase):** Trigger `auto_suspend_out_of_stock_product()` (`20260610110000_auto_suspend_out_of_stock.sql`) â€” si `stock <= 0`, `is_available` pasa a `false` automÃ¡ticamente para evitar sobreventas.
- **Capa de consulta:** `lib/products/admin.ts` â€” `getAdminProducts` con filtros compuestos (`q`, `categoryId`, `stock`, `status`); detalle bajo demanda vÃ­a `getAdminProductById` + Server Actions en `app/admin/(protected)/products/actions.ts`.

### UI de Alta Densidad â€” 2026-06-11

- **Tabla responsiva:** `ProductTableView` â€” desktop tabla / mobile grid (`product-table-view.tsx` + `.module.css`).
- **SKU apilado:** CÃ³digo bajo el nombre del producto (sin columna SKU dedicada); fallback `SIN ASIGNAR`; tipografÃ­a monospace.
- **Columnas numÃ©ricas:** Precio y stock alineados a la derecha para escaneo rÃ¡pido.
- **Toggle de disponibilidad:** `ProductAvailabilityToggle` con mutaciÃ³n optimista local (sin bloqueo global `isPending` en la lista).
- **Layout fluido:** Toolbar superior + grid expansivo (`dashboard-shell`, Fase 9â€“10); sin doble sidebar.

### Filtros Inteligentes â€” 2026-06-11

- **URL-Driven:** `ProductsToolbar` sincroniza `q`, `category`, `stock` y `status` con `searchParams` de Next.js.
- **Debounce en bÃºsqueda:** Texto con retardo antes de navegar (nombre o SKU).
- **Filtrado server-side:** `getAdminProducts` aplica predicates en Postgres; sin filtrado client-side masivo.
- **Empty State restrictivo:** `ProductCatalogEmptyState` (wrapper) + primitiva global `<EmptyState />` con acciÃ³n â€œLimpiar filtrosâ€ cuando la bÃºsqueda no devuelve resultados (Fase 14 â†’ Fase 2 UI).

### UX Premium â€” 2026-06-11

- **Motor de recorte 1:1:** `react-easy-crop` + `ImageCropModal` + util `lib/utils/cropImage.ts` (Canvas â†’ `File` JPEG).
- **Subida directa:** Drag & drop en dropzone (`product-form.module.css`); upload a bucket `product-images` vÃ­a Supabase Storage (`businessId/productId/uuid.ext`).
- **Re-recorte sin re-upload:** Badge de tijera (`.editImageBadge`) intercepta clic y reabre `ImageCropModal` con la imagen actual; clic en el resto del dropzone abre explorador de archivos (Fase 19.1).
- **Formularios simÃ©tricos:** `CreateProductForm` y `EditProductForm` comparten `product-form.module.css` â€” CSS Grid, categorÃ­a inline (`createCategoryAction` + dialog), input de moneda con `$`, switch de disponibilidad.
- **Skeleton Loaders:** `ProductFormSkeleton` usa primitiva global `<Skeleton />`; reemplaza spinner genÃ©rico en flyout de ediciÃ³n; labels incluidos para evitar CLS (Fase 18â€“19 â†’ Fase 2 UI).
- **Select de categorÃ­a pulido:** Flecha nativa oculta; chevron SVG custom con `padding-right: 2.5rem` (Fase 19.2).

### EstÃ¡ndar Enterprise â€” 2026-06-11

- **Flyout unificado:** `FlyoutPanel` + `ProductsManagementProvider` â€” creaciÃ³n, ediciÃ³n y categorÃ­a inline; scroll-lock (`useScrollLock`); panel 560px desktop.
- **Consistencia visual:** Modales de creaciÃ³n/ediciÃ³n con la misma grilla, dropzone, divider y acciones; shell compartido (`styles.formShell`, altura de controles 42px).
- **ConsolidaciÃ³n visual (Fases 1â€“3):** MÃ³dulo 100% tokenizado â€” sin `products-admin.css`; grid mÃ³vil en `product-grid.module.css` + `product-card.module.css`; botones principales vÃ­a `<Button />` global.
- **EliminaciÃ³n de redundancias:** BotÃ³n â€œ+ Nueva categorÃ­aâ€ removido del toolbar principal (`products-header-actions.tsx`); alta de categorÃ­a solo inline en formularios (Fase 17).
- **Estados vacÃ­os y feedback:** Empty states, hints de bÃºsqueda en toolbar, mensajes de error/Ã©xito en formularios, overlay â€œCambiar fotoâ€ + badge persistente en imagen (accesibilidad tÃ¡ctil).
- **Archivos clave:**

| Ãrea | Archivos |
|------|----------|
| Estado global | `products-management-provider.tsx`, `flyout-panel.tsx` |
| Tabla / filtros | `product-table-view.tsx`, `products-toolbar.tsx`, `product-catalog-section.tsx` |
| Grid mÃ³vil | `product-grid-server.tsx`, `product-grid.module.css`, `product-card.tsx`, `product-card.module.css` |
| Formularios | `create-product-form.tsx`, `edit-product-form.tsx`, `product-form.module.css`, `product-form-skeleton.tsx` |
| ImÃ¡genes | `image-crop-modal.tsx`, `vendor/react-easy-crop.css`, `lib/utils/cropImage.ts` |
| UI global | `components/ui/empty-state.tsx`, `components/ui/skeleton.tsx` |
| Server | `lib/products/admin.ts`, `app/admin/(protected)/products/actions.ts`, `app/admin/(protected)/categories/actions.ts` |
| BD | `20260610103000_add_product_sku_stock.sql`, `20260610110000_auto_suspend_out_of_stock.sql` |

---

## 2. Esquema de Base de Datos (Resumen)

> Fuente de verdad: `supabase/migrations/`. Tipos: `types/database.ts`.

### Diagrama relacional simplificado

```
businesses (1) â”€â”€â”¬â”€â”€ (N) profiles
                 â”œâ”€â”€ (1) business_settings  (+ product_customization_enabled)
                 â”œâ”€â”€ (N) categories â”€â”€ (N) products
                 â”œâ”€â”€ (N) customization_groups â”€â”€ (N) customization_options
                 â”‚         â””â”€â”€ (N) customization_group_assignments â†’ category|product
                 â”œâ”€â”€ (N) product_customization_overrides â†’ products
                 â”œâ”€â”€ (N) upsell_groups â”€â”€ (N) upsell_group_items â†’ products
                 â”œâ”€â”€ (N) orders â”€â”€â”¬â”€â”€ (N) order_items (+ snapshot, parent, item_kind)
                 â”‚                â””â”€â”€ (N) order_events
                 â”œâ”€â”€ (N) store_sessions
                 â””â”€â”€ (N) push_subscriptions
```

### Tablas

#### `businesses`
| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | uuid PK | |
| `name`, `slug` | text | `slug` Ãºnico, formato `[a-z0-9-]+` |
| `whatsapp_number` | text | |
| `logo_url` | text? | |
| `is_active` | boolean | default true |
| `created_at` | timestamptz | |
| + branding | text? | `primary_color`, hero copy (migraciones t9/t10) |

#### `profiles`
| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | uuid PK â†’ `auth.users` | |
| `business_id` | uuid? â†’ businesses | nullable solo para `super_admin` |
| `role` | text | `owner\|manager\|operator\|viewer\|admin\|super_admin` |
| `notification_preferences` | jsonb | MigraciÃ³n u1 |
| `created_at` | timestamptz | |

#### `categories` / `products`
- Ambas con `business_id`
- `products.category_id` + FK compuesta `(category_id, business_id)`
- `products`: `name`, `description`, `price`, `image_url`, `is_available`, **`sku`**, **`stock`** (migraciÃ³n `20260610103000`)
- `categories`: `name`, `position`
- **Trigger:** `auto_suspend_out_of_stock_product()` â€” `stock <= 0` â†’ `is_available = false` (migraciÃ³n `20260610110000`)

#### `orders`
| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | uuid PK | |
| `business_id` | uuid FK | **Ãndice tenant** |
| `customer_name`, `phone` | text | |
| `delivery_date` | date | |
| `delivery_time` | text? | |
| `delivery_method` | text | `delivery` \| `pickup` |
| `address` | text? | Requerido si delivery |
| `notes` | text? | |
| `total_price` | numeric(12,2) | Calculado server-side en RPC |
| `status` | text | `pending\|preparing\|ready\|completed\|cancelled` |
| `assigned_to` | uuid? â†’ profiles | MigraciÃ³n s3 |
| `assigned_at` | timestamptz? | |
| `created_at` | timestamptz | |

**Status v2 (t9):** `in_progress` renombrado a `preparing`; agregado `ready`.

#### `order_items`
| Columna | Tipo | Notas |
|---------|------|-------|
| `order_id` | uuid FK | CASCADE delete |
| `product_id` | uuid? FK | Snapshot si producto eliminado |
| `product_name`, `unit_price`, `quantity` | | Snapshot inmutable |
| `customization_snapshot` | jsonb? | V1/V2 Product Customization; null = legacy; V2 adds option `quantity` + `total_price_delta` |
| `parent_order_item_id` | uuid? self FK | Plus hijo; ON DELETE CASCADE |
| `item_kind` | text | `product` \| `upsell`; default `product` |

#### Product Customization V1 (migraciÃ³n `20260712090000`)

| Tabla | Rol |
|-------|-----|
| `customization_groups` | Grupos reutilizables (single/multiple, min/max) |
| `customization_options` | Opciones con `price_delta numeric(12,2) >= 0` |
| `customization_group_assignments` | AsignaciÃ³n polimÃ³rfica a category\|product |
| `product_customization_overrides` | Disable grupo/opciÃ³n por producto |
| `upsell_groups` | Plus sugerido (1 por target) |
| `upsell_group_items` | Productos reales sugeridos |

Flag: `business_settings.product_customization_enabled` default **false**.

#### `order_events`
| Columna | Tipo | Notas |
|---------|------|-------|
| `business_id`, `order_id` | uuid FK | |
| `actor_profile_id` | uuid? | |
| `event_type` | text | `order_created\|status_changed\|assignment_taken\|assignment_released` |
| `payload` | jsonb | |
| `created_at` | timestamptz | Append-only |

#### `store_sessions`
| Columna | Tipo | Notas |
|---------|------|-------|
| `business_id` | uuid FK | |
| `opened_at`, `closed_at` | timestamptz? | |
| `status` | text | `open\|closed` |
| `opened_by`, `closed_by` | uuid? â†’ profiles | |
| Ãndice Ãºnico | | Una sesiÃ³n `open` por business |

#### `push_subscriptions`
| Columna | Tipo | Notas |
|---------|------|-------|
| `business_id`, `profile_id` | uuid FK | |
| `endpoint`, `p256dh`, `auth` | text | Web Push keys |
| `revoked_at` | timestamptz? | Soft revoke |

### RPC crÃ­tica

- **`create_order`** (`t8_create_order_rpc.sql`) â€” Security definer; valida productos, calcula total, inserta order + items en transacciÃ³n. Customization payload: fase ORDER-1 (aÃºn no).

### RLS (patrÃ³n universal)

```sql
business_id = (select p.business_id from profiles p where p.id = auth.uid())
-- o super_admin bypass
```

Tablas con RLS: `businesses`, `profiles`, `categories`, `products`, `orders`, `order_items`, `order_events`, `store_sessions`, `push_subscriptions`, `business_settings`, `customization_groups`, `customization_options`, `customization_group_assignments`, `product_customization_overrides`, `upsell_groups`, `upsell_group_items`.

Lectura pÃºblica (sin auth): `categories`, `products`, `businesses` activos â€” migraciÃ³n `t6_public_catalog_read`. Customization anon solo si `product_customization_enabled` + available.

### Realtime publication

| Tabla | MigraciÃ³n | Replica Identity |
|-------|-----------|------------------|
| `orders` | `t12_orders_realtime_publication` | FULL |
| `store_sessions` | `v63_store_sessions_realtime_publication` | FULL |

### Storage buckets

- `product-images` â€” imÃ¡genes de productos por `business_id`
- `business-assets` â€” logos y assets de branding

---

## 2.1 ConfiguraciÃ³n de Infraestructura

### Next.js `images.remotePatterns`

Archivo: `next.config.ts`

| Regla | Valor | Motivo |
|-------|-------|--------|
| `protocol` | `https` | Solo assets servidos por HTTPS |
| `hostname` | `**.supabase.co` | Dominio de Supabase Storage (proyecto) |
| `pathname` | `/storage/v1/object/public/**` | Solo objetos pÃºblicos del bucket; no API ni rutas auth |

**Uso:** `next/image` en admin (`ProductCard`) y futuras vistas de catÃ¡logo. URLs fuera de este patrÃ³n no pasan por el optimizador (fallback a placeholder en admin).

**Buckets cubiertos:** `product-images`, `business-assets` (ambos bajo `/storage/v1/object/public/...`).

### Next.js Image + Supabase Transformations

Archivos: `lib/supabase/image-loader.ts`, `next.config.ts` (`loader: "custom"`).

| Pieza | Detalle |
|-------|---------|
| `sharp` | Dependencia de producciÃ³n para el pipeline de `next/image` (fallback local) |
| `getSupabaseImageLoader(src, width, quality)` | Convierte `/object/public/` â†’ `/render/image/public/` con `width`, `quality`, `format=webp` |
| Custom loader global | Evita que Next descargue el origin completo; Supabase/imgproxy redimensiona en edge |

**Ejemplo de URL transformada:** `.../storage/v1/render/image/public/product-images/...?width=120&quality=80&format=webp`

---

## 3. Registro de Cambios ArquitectÃ³nicos (Changelog)

> Formato bitÃ¡cora: `YYYY-MM-DD â€” [Ãrea] DescripciÃ³n`. Registrar de mÃ¡s antiguo a mÃ¡s reciente.

### 2026-08-15 — PUBLIC-CATALOG-CHROME-FINAL-CLOSEOUT-1

- **Frontend / Public Catalog** Closed drawer + tenant footer: flush-right full-height nav side-sheet; catalog-only footer with `business.name`, dynamic year, OrderOps link `/` (no ™). Android real-device QA PASS both. Docs: nav-drawer + tenant-footer polish.

### 2026-08-15 — PUBLIC-CATALOG-TENANT-FOOTER-1

- **Frontend / Public Catalog** Catalog-only tenant footer: `business.name`, server `copyrightYear`, OrderOps link `/`, no extra fetch. Rendered in `CatalogClient` after content, before cart/modals. Doc: `docs/public-catalog-tenant-footer-1.md`. Android QA PASS.

### 2026-08-15 — PUBLIC-CATALOG-NAV-DRAWER-VISUAL-POLISH-1

- **Frontend / Public Catalog** Public nav drawer = flush-right full-height side-sheet (`top/right/bottom: 0`), width `min(82vw, 348px)`, left radii only (`22px 0 0 22px`), safe-area via internal padding. Desktop MQ no longer reintroduces floating card. CSS-only (`app/globals.css`). Doc: `docs/public-catalog-nav-drawer-visual-polish-1.md`. Android QA PASS.

### 2026-08-15 — PUBLIC-CATALOG-TAP-HIGHLIGHT-POLISH-1

- **Frontend / Public Catalog** Scoped `-webkit-tap-highlight-color: transparent` on `.public-business-layout` interactive descendants (`a`, `button`, `[role="button"]`, `label`, form controls). No prior tap-highlight rule. Focus-visible/outline untouched. Admin unaffected. Doc: `docs/public-catalog-tap-highlight-polish-1.md`. Android Chrome real-device QA PASS (tap flash removed; own feedback preserved).

### 2026-08-14 — PUBLIC-CATALOG-CUSTOMIZATION-POLISH-HANDOFF (block close)

- **Frontend / Public Catalog** Polish block closed and deployed to production (`831903f`, 2026-08-14): catalog chrome (header flow, sticky categories), product detail modal mobile shell, customization modal (V2 qty P1 fix, controls, extras cards/motion, info hierarchy). Handoff: `docs/public-catalog-customization-polish-handoff-2026-08-14.md`. Android final smoke PASS. Production: https://orderops.vercel.app. No legacy round-trip on public Papas/Salsas handler.

### 2026-08-14 — CUSTOMIZATION-MODAL-INFORMATION-HIERARCHY-POLISH

- **Frontend / Public Catalog Customization** Modal info hierarchy: removed product description + optional group badges/helpers (Salsas, Extras); Papas required badge+helper preserved. Limits metadata via `sr-only`. Props `showGroupMeta`/`showGroupDescription` on shared group component (admin defaults unchanged). No logic/pricing/motion/P1 changes.
- Archivos: `customization-modal.tsx`, `customization-option-group.tsx`; doc information-hierarchy-polish.

### 2026-08-14 — PUBLIC-CATALOG-CUSTOMIZATION-MODAL-EXTRAS-MOTION-POLISH-1

- **Frontend / Public Catalog Customization** Extras quantity tiles motion: card bg/border transition 180ms; Agregar/stepper entrance 150ms opacity+scale; button press scale(0.96) 100ms; quantity bump 140ms via `key={qty}` on value span. prefers-reduced-motion disables all. CSS-only + 1 TSX key line. P1 verify PASS. Android device QA pending.
- Archivos: `customization-modal.module.css`, `customization-modal.tsx`; doc EXTRAS-MOTION-POLISH-1.

### 2026-08-14 — PUBLIC-CATALOG-CUSTOMIZATION-MODAL-EXTRAS-CARD-POLISH-1

- **Frontend / Public Catalog Customization** Extra quantity tiles: 2-row layout (name+price / action). Per-option “máx. N” removed from tile UI only; max clamping and `+` disable unchanged. Group header badge preserved. ~17px card height reduction. P1 qty preservation re-verified. Android device QA pending.
- Archivos: `customization-modal.tsx`, `customization-modal.module.css`; doc EXTRAS-CARD-POLISH-1.

### 2026-08-14 — PUBLIC-CATALOG-CUSTOMIZATION-MODAL-CONTROLS-FIX-1

- **Frontend / Public Catalog Customization** P1 quantity preservation: group-scoped V2 helpers (`selectSingleOptionInV2`, `toggleMultipleOptionInV2`) replace legacy round-trip in modal `onSelectOption`. P2 salsa circular checkbox indicator (CSS). P2/P3 extra tile compaction + 44px touch controls. Verify tests in `order-qty-helpers.verify.ts`. No DB/checkout/cache changes. Android device QA pending.
- Archivos: `selection-v2.ts`, `customization-modal.tsx`, `customization-shared.module.css`, `customization-modal.module.css`, `order-qty-helpers.verify.ts`; doc FIX-1.

### 2026-08-14 — PUBLIC-CATALOG-CUSTOMIZATION-MODAL-CONTROLS-STATE-AUDIT-1 (read-only)

- **QA / Public Catalog Customization** Audit-only: mapped render paths (Papas/Salsas → shared `CustomizationOptionGroup`/`CustomizationOptionRow`; quantity extras → inline modal). Confirmed P1 bug — extra option qty >1 resets to 1 when changing Papas/Salsas because `onSelectOption` round-trips via `selectionV2ToLegacyOptionIds` → `normalizeLegacySelectionToV2` (forces qty=1 per option). Documented salsa visual congruence (CSS circular checkbox) and extra tile height drivers. No runtime/DB/commit. Doc: `docs/public-catalog-customization-modal-controls-state-audit-1.md`. Próximo: **PUBLIC-CATALOG-CUSTOMIZATION-MODAL-CONTROLS-FIX-1**.

### 2026-08-14 — PUBLIC-CATALOG-PRODUCT-DETAIL-MODAL-VISUAL-POLISH-2

- **Frontend / Public Catalog UX** Product detail modal: mobile L/R/B shell borders removed (top hairline only) to eliminate lateral rails on 1:1 image; “Desde” secondary via existing `.catalog-product-card__price-from` scoped under summary; helper microcopy quieter (`12px`). Full-width/radii/1:1/desktop restore preserved. CSS-only. Android real-device QA pending.
- Archivos: `app/globals.css`; `docs/public-catalog-product-detail-modal-visual-polish-2.md`.

### 2026-08-14 — PUBLIC-CATALOG-CATEGORIES-STICKY-TOP-BOUNDARY-POLISH-1

- **Frontend / Public Catalog UX** Sticky category nav gains `border-top: 1px solid var(--catalog-border)` hairline to separate hero/copy from the nav band. Bottom border + downward shadow unchanged. No spacing/sticky/full-bleed/header changes. Doc dedicated. Android real-device QA pending.
- Archivos: `app/globals.css`; `docs/public-catalog-categories-sticky-top-boundary-polish-1.md`.

### 2026-08-14 — PUBLIC-CATALOG-CHROME-ELEVATION-POLISH-1-FOLLOWUP-2

- **Frontend / Public Catalog UX** Header `.header` `position: relative` (still document-flow) so existing `z-index: 18` paints shadow above opaque `.catalog-page` sibling. Category main shadow spread `-12` → `-8`. No alpha/layout/sticky/scroll changes. Checkout keeps `headerCheckout { position: static }`.
- Archivos: `public-business-header.module.css`, `app/globals.css`.

### 2026-08-14 — PUBLIC-CATALOG-CHROME-ELEVATION-POLISH-1-FOLLOWUP-1

- **Frontend / Public Catalog UX** Header elevation ownership → `public-business-header.module.css` (`.header`); removed duplicate header shadows from globals. Category + header shadows retuned with negative spread (downward-only, no top halo). Borders/full-bleed/sticky/flow unchanged. No blur/JS/animation.
- Archivos: `public-business-header.module.css`, `app/globals.css`.

### 2026-08-14 — PUBLIC-CATALOG-CHROME-ELEVATION-POLISH-1

- **Frontend / Public Catalog UX** Subtle static downward `box-shadow` on public chrome: header root (weaker) + sticky category nav (slightly stronger). Borders preserved; dimensions/full-bleed/sticky/header flow untouched. Inner header stays flat (no double shadow). No blur/filter/JS/animation. Dark overrides use low-alpha black only.
- Archivos: `app/globals.css` only (runtime).

### 2026-08-14 — PUBLIC-CATALOG-CATEGORIES-STICKY-SURFACE-POLISH-1

- **Frontend / Public Catalog UX** Sticky category nav surface polish: real full-bleed via `width: calc(100% + 2×page-padding)` (negative margins alone left a right-edge gap under border-box); symmetric vertical padding; `border-bottom: 1px solid var(--catalog-border)`. Sticky `top: 0` / header document-flow preserved. No interaction/header/modal changes.
- Archivos: `app/globals.css` only (runtime).

### 2026-08-13 — PUBLIC-CATALOG-HEADER-CATEGORIES-SCROLL-UX-POLISH-1

- **Frontend / Public Catalog UX** Business header returns to document flow (no sticky/fixed, no hide-on-scroll-up). Category nav is the only sticky chrome (`top: 0`, opaque `--catalog-bg` band with full-bleed). Removed `useHideOnScroll` + `public-header-visibility` CSS vars/event. `scroll-margin-top` on groups set to static `64px` (categories-only). No Chrome UI control / visualViewport / modal changes. Gate: ANDROID-CHROME-QA REQUIRED for Chrome address-bar coexistence.
- Archivos: `public-business-header.tsx`/+`.module.css`, `app/globals.css`; deleted `use-hide-on-scroll.ts`, `public-header-visibility.ts`.

### 2026-08-13 — PUBLIC-CATALOG-CUSTOMIZATION-MODAL-LOADING-SPINNER-MOTION-POLISH-1

- **Frontend / Public Catalog UX** Loading spinner upgraded to ~68px CSS-only conic-arc + center dot; continuous 780ms spin; reduced-motion static fallback. Loading copy/footer/header semantics unchanged. No fetch/cache/logic changes. Gate: VISUAL-QA ALLOWED_WITH_THROTTLED_SPINNER_QA; COMMIT-DEPLOY BLOCKED_UNTIL_VISUAL_QA.
- Archivos: `customization-modal.module.css`, docs SPINNER-MOTION-POLISH + CURRENT_PHASE + living memory.

### 2026-08-13 — PUBLIC-CATALOG-CUSTOMIZATION-MODAL-LOADING-STATE-POLISH-1

- **Frontend / Public Catalog UX** Customization modal loading → centered CSS-only spinner + “Preparando opciones” / “Un momento…”. `aria-busy` + status live region; reduced-motion disables spin; footer hidden while loading. No fetch/cache/selection/pricing changes. Gate: VISUAL-QA ALLOWED_WITH_THROTTLED_LOADING_QA; COMMIT-DEPLOY BLOCKED_UNTIL_VISUAL_QA.
- Archivos: `customization-modal.tsx`/+`.module.css`, docs LOADING-STATE-POLISH + CURRENT_PHASE + living memory.

### 2026-08-13 — PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-MODAL-SHELL-QTY-VISUAL-POLISH-1

- **Frontend / Public Catalog UX** Mobile customization modal → full-height sheet (`100dvh`/`100svh`), sticky header/footer, internal body scroll. Quantity extras tiles densified to match checkbox grid language; quieter Agregar/stepper; compact unit copy; section meta pill without space-between gap. No business logic / cart / order / DB changes. Local-only visual fixture QA then removed. Gate: VISUAL-POLISH-QA ALLOWED_WITH_LOCAL_ONLY_VISUAL_QA; LIMITS-GRID-QA PAUSED_UNTIL_VISUAL_POLISH_QA; COMMIT-DEPLOY BLOCKED_UNTIL_VISUAL_QA.
- Archivos: `customization-modal.tsx`/+`.module.css`, docs MODAL-SHELL-QTY-VISUAL-POLISH + CURRENT_PHASE + living memory.

### 2026-08-13 — PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-LIMITS-GRID-POLISH-1

- **Product / Public Catalog UX** Removed effective `max_total_quantity` cap (deprecated/no-op; column kept). Limits = `option.max_quantity` + distinct `max_selections`/`min_selections`. Admin hides total-units field and persists null. Public quantity extras restored to compact 2-col checkbox-like grid (Agregar / stepper). Selection V2 + snapshot null `max_total_quantity`; order validation does not reject on total units. Local-only grid fixture QA then removed. No migration/DB push/mutation/commit/push/deploy. Gate: LIMITS-GRID-POLISH-QA ALLOWED_WITH_LOCAL_ONLY_GRID_QA; COMMIT-DEPLOY BLOCKED_UNTIL_QA; real enablement still blocked.
- Archivos: `customization-modal.tsx`/+`.module.css`, `section-edit-modal.tsx`, `selection-v2.ts`, `shared.ts`, `public-shared.ts`, `order-snapshot.ts`, `order-qty-helpers.verify.ts`, docs LIMITS-GRID-POLISH + CURRENT_PHASE.

### 2026-08-13 — PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-ORDER-QA-1

- **QA / Orders** Formal ORDER path QA. Helper/browser PASS. P1 microfix: `isSelectionStrictlyWithinLimits` rejects over-max qty on create_order (UI clamp must not silently persist). No local Docker submit. Gate: COMMIT-DEPLOY ALLOWED_WITH_ACCEPTED_ORDER_SUBMIT_QA_DEBT_AND_REAL_ENABLEMENT_GUARD. Real qty enablement blocked until safe submit or owner risk accept.
- Archivos: `selection-v2.ts`, `order-validation.ts`, `order-qty-helpers.verify.ts`, `docs/public-catalog-customization-multi-quantity-extras-order-qa-1.md`, `docs/CURRENT_PHASE.md`.

### 2026-08-13 — PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-ORDER-IMPL-1

- **Orders / Checkout** Checkout payload V2 (`selectedOptions` + legacy `selectedOptionIds`); TS server normalize/validate/price (`price_delta × qty`); Snapshot V2; admin readers V1+V2 (`Bacon x2`). Hybrid Case C — TS is SoT for qty (no new RPC migration). WhatsApp admin extras = P3. No submit/DB push/commit. Gate: ORDER-QA ALLOWED_WITH_ORDER_SUBMIT_QA_DEBT; COMMIT-DEPLOY BLOCKED_UNTIL_ORDER_QA.
- Archivos: `lib/cart/local.ts`, `lib/product-customization/checkout-payload-v2.ts`, `order-validation.ts`, `order-snapshot.ts`, `order-types.ts`, `order-dashboard.ts`, `lib/orders/customization-summary.ts`, docs ORDER IMPL + CURRENT_PHASE.

### 2026-08-10 — PUBLIC-CATALOG-UI-REDESIGN-FINAL-COMMIT-1

- **Release / Public Catalog UX** Local commit package `feat(public-catalog): complete UI redesign closeout` on `cursor-handoff-public-catalog-ui-redesign`. No push/deploy. Push gate ALLOWED.
- Archivos: runtime catalog/checkout/success/globals/`lib/cart/local.ts` + docs de fases + `docs/public-catalog-ui-redesign-final-commit-1.md`.

### 2026-08-10 — PUBLIC-CATALOG-UI-REDESIGN-CLOSEOUT-1

- **Frontend / Public Catalog UX** Closeout del rediseño UI/UX público en `cursor-handoff-public-catalog-ui-redesign`: ProductCard display qty = legacy + V2 parent roots (`getRootQuantityForProduct`); checkout/success flat; FAB/header/nav polish. Sin commit/push/deploy. Gates: FINAL-COMMIT ALLOWED; Maps PAUSED; public_order_code BACKLOG.
- Archivos: `lib/cart/local.ts`, catalog/checkout/success/globals runtime, `docs/public-catalog-ui-redesign-closeout-1.md`, `docs/CURRENT_PHASE.md`, `ORDEROPS_LIVING_MEMORY.md`.

### 2026-08-01 — PUBLIC-CATALOG-POST-ADD-UPSELL-POST-DEPLOY-MONITOR-1-FOLLOWUP CORRECTION

- **Ops / Release** Corrección documental de cierre: el probe final Tab/Shift+Tab reprodujo que el foco escapa de `PostAddUpsellSheet` al botón de carrito y categorías del catálogo. Hallazgo **P2 — POST-ADD FOCUS TRAP REGRESSION**. Aunque modal/Plus absence/created/attach/cart/quantity/edit/persistence/remove-signature-merge/quick-add/checkout visual pasaron, el estado consolidado queda **BLOCKED — RUNTIME FIX REQUIRED**. No se tocó runtime ni se hizo rollback. `QUEUE_GATE: PUBLIC-CATALOG-POST-ADD-UPSELL-FINAL-HANDOFF-1 = BLOCKED`.
- Archivos: `docs/public-catalog-post-add-upsell-post-deploy-monitor-1-followup.md`, `docs/public-catalog-post-add-upsell-post-deploy-monitor-1.md`, `docs/CURRENT_PHASE.md`, `ORDEROPS_LIVING_MEMORY.md`.

### 2026-08-01 — PUBLIC-CATALOG-POST-ADD-UPSELL-POST-DEPLOY-MONITOR-1-FOLLOWUP

- **Ops / Release** Browser-core followup sobre baseline `7c894d0`, con runtime sin cambios desde `6d138a6`. Chrome del sistema + Playwright bundled, contextos efímeros, verificaron `Doble Smash`: modal sin Plus, created → post-add, attach Coca, CartSheet jerárquico/root-only, quantity 1→2, edit preservando parent/child, refresh persistence, checkout visual sin submit, remove/signature/merge y simple quick-add. Network local sin acciones adicionales después del primer config open; consola sin error release-related. Rounds A/B/C PASS. Sin DB, runtime, admin, producto, sesión, submit ni pedidos reales. Estado: **PASS WITH NON-BLOCKING QA DEBT — POST-ADD UPSELL STABLE IN PRODUCTION**.
- Archivos: `docs/public-catalog-post-add-upsell-post-deploy-monitor-1-followup.md`, `docs/public-catalog-post-add-upsell-post-deploy-monitor-1.md`, `docs/CURRENT_PHASE.md`, `ORDEROPS_LIVING_MEMORY.md`.
- Breaking: no — solo documentación. `QUEUE_GATE: PUBLIC-CATALOG-POST-ADD-UPSELL-FINAL-HANDOFF-1 = ALLOWED`. Deuda P3: provider logs/identity, real device, screen reader, preview, closed-store, PWA, fixtures/build continuity, modality-network probe e imágenes no funcionales.

### 2026-08-01 — PUBLIC-CATALOG-POST-ADD-UPSELL-POST-DEPLOY-MONITOR-PARTIAL-HANDOFF-1

- **Ops / Release** Handoff documental append-only del monitor post-deploy parcial de Codex. El deploy single-group post-add sigue live como evidencia histórica; Codex operó en `MODE C — HTTP/GIT ONLY`, sincronizó Git/origin en `eac9d17`, verificó la arquitectura single-group y `PLACEMENT_RUNTIME = ABSENT`, y obtuvo HTTP 200 de catálogo y checkout. Browser core, identidad/logs Vercel, Round C y ventana completa quedaron **UNVERIFIED**. Fixtures agotaron 60 s y son inconclusos; TypeScript PASS; build unverified. Sin rollback, DB, migraciones, mutaciones productivas, submit ni pedidos reales (`0`). Final handoff bloqueado; followup monitor permitido.
- Archivos: `docs/public-catalog-post-add-upsell-post-deploy-monitor-1.md`, `docs/CURRENT_PHASE.md`, `docs/public-catalog-post-add-upsell-deploy-1.md`, `ORDEROPS_LIVING_MEMORY.md`.
- Breaking: no — solo documentación. `QUEUE_GATE: PUBLIC-CATALOG-POST-ADD-UPSELL-POST-DEPLOY-MONITOR-1-FOLLOWUP = ALLOWED`; `QUEUE_GATE: PUBLIC-CATALOG-POST-ADD-UPSELL-FINAL-HANDOFF-1 = BLOCKED`.

### 2026-04-26 â€” FundaciÃ³n (T1â€“T8)

- **DB** `t1`: Tablas `businesses`, `profiles` â€” multi-tenant base con `slug` Ãºnico.
- **DB** `t2`: `categories`, `products` con FK compuesta business-scoped.
- **DB** `t3`: `orders`, `order_items` con snapshot de producto y status v1.
- **DB** `t4`: Ãndices MVP (`business_id`, `delivery_date`).
- **DB** `t5`: RLS admin en todas las tablas tenant.
- **DB** `t6`: Lectura pÃºblica de catÃ¡logo sin autenticaciÃ³n.
- **DB** `t7`: Storage `product-images` con polÃ­ticas por carpeta `business_id`.
- **DB** `t8`: RPC `create_order` security definer â€” totales server-side.

### 2026-04-27 â€” Super Admin + Storage fixes

- **Auth** `super_admin_roles_and_rls`: Rol `super_admin` con bypass RLS controlado.
- **Auth** `super_admin_profiles_nullable_business`: `business_id` nullable para super-admin.
- **Storage** NormalizaciÃ³n polÃ­ticas `product-images` y fix folder policy.

### 2026-05-05 â€” Branding tenant

- **DB** `t9_business_branding_fields`: Campos de marca en `businesses`.
- **DB** `t10_business_assets_storage`: Bucket `business-assets`.
- **DB** `t11_businesses_update_rls`: PolÃ­tica UPDATE para owners.

### 2026-05-06 â€” CatÃ¡logo hero

- **DB** `catalog_hero_copy_fields`: Campos de copy para hero del catÃ¡logo pÃºblico.

### 2026-05-15 â€” Status v2 operativo

- **DB** `t9_order_status_v2`: `in_progress` â†’ `preparing`; nuevo estado `ready`. AlineaciÃ³n con lanes operativas.

### 2026-05-16 â€” Realtime + Roles + Assignment + Events

- **Realtime** `t12_orders_realtime_publication`: `orders` en `supabase_realtime`, REPLICA IDENTITY FULL.
- **Auth** `s1_business_roles`: Roles granulares `owner/manager/operator/viewer`.
- **DB** `s3_order_assignment_fields`: `assigned_to`, `assigned_at` en orders.
- **DB** `s4_order_events`: Timeline append-only con RLS.

### 2026-05-18 â€” Notificaciones

- **DB** `u1_profile_notification_preferences`: JSONB preferencias por perfil.
- **DB** `u4_push_subscriptions`: Web Push endpoints por profile+business.

### 2026-06-04 â€” Store Sessions (V6.3)

- **DB** `v63_store_sessions`: Tabla `store_sessions` con una sesiÃ³n abierta por business.
- **Realtime** `v63_store_sessions_realtime_publication`: Sync de sesiones en dashboard.
- **Ops** Ventana operativa dual: `store-session` vs `business-window` en `lib/orders/analytics.ts`.

### 2026-06-07 â€” Blindaje de desarrollo (esta auditorÃ­a)

- **DX** CreaciÃ³n de `.cursorrules` â€” reglas estrictas de estilos modulares, Realtime, tenancy.
- **DX** CreaciÃ³n de `ORDEROPS_LIVING_MEMORY.md` â€” cerebro inmutable del proyecto.
- **Nota** Confirmado: tenancy usa `business_id`; `tenant_id` es nomenclatura conceptual en docs legacy.
- **Nota** Kitchen Mode, On-Demand y Programado permanecen en roadmap â€” sin feature flags runtime.

### 2026-06-07 â€” Feature flags por tenant (`business_settings`)

- **DB** Tabla `business_settings` con PK/FK `business_id` â†’ `businesses(id)` ON DELETE CASCADE; relaciÃ³n 1:1 estricta por tenant.
- **DB** Flags: `on_demand_mode_active` (default true), `scheduled_mode_active`, `kitchen_mode_active`, `delivery_mode_active` (default false).
- **Auth** RLS SELECT para miembros autenticados del tenant (+ bypass `super_admin`); UPDATE solo `owner`/`manager`.
- **DB** Trigger `on_business_created_create_settings` inserta fila por defecto al registrar un negocio; backfill para negocios existentes.
- Archivos: `supabase/migrations/20260607210325_business_settings.sql`, `types/database.ts`
- Breaking: no â€” negocios existentes reciben defaults vÃ­a backfill en migraciÃ³n.

### 2026-06-08 â€” Hook de feature flags por tenant

- **DX** CreaciÃ³n de hook `useBusinessSettings` para abstracciÃ³n de flags por tenant.
- Archivos: `lib/business/use-business-settings.ts`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-08 â€” PropagaciÃ³n global de feature flags en AdminShell

- **DX** IntegraciÃ³n de `useBusinessSettings` en AdminShell para propagaciÃ³n global de flags.
- Archivos: `components/admin/admin-shell.tsx`, `lib/business/use-business-settings.ts`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-08 â€” Guardrails de Kitchen Mode en admin

- **Ops** ImplementaciÃ³n de guardrails (`notFound`) en ruta `/admin/kitchen` y blindaje de navegaciÃ³n.
- Archivos: `app/admin/(protected)/kitchen/page.tsx`, `components/admin/admin-nav-links.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-08 â€” Blindaje On-Demand en pedidos pÃºblicos

- **Ops** Blindaje On-Demand: validaciÃ³n en RPC `create_order` y UI de checkout pÃºblico.
- **DB** `create_order` rechaza pedidos si `business_settings.on_demand_mode_active = false`; polÃ­tica RLS pÃºblica de lectura de settings para negocios activos.
- Archivos: `supabase/migrations/20260608143000_on_demand_order_guardrails.sql`, `lib/business/public.ts`, `components/public/checkout/checkout-client.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-08 â€” Blindaje Scheduled Mode en pedidos pÃºblicos

- **Ops** Blindaje Scheduled Mode: lÃ³gica de checkout condicional y validaciÃ³n en RPC `create_order`.
- **DB** `create_order` rechaza fechas futuras si `scheduled_mode_active = false`; valida que la fecha no sea pasada.
- **UI** Checkout oculta el selector de fecha cuando el modo programado estÃ¡ desactivado; envÃ­a fecha del dÃ­a (on-demand).
- Archivos: `supabase/migrations/20260608153000_scheduled_mode_order_guardrails.sql`, `lib/business/public.ts`, `components/public/checkout/checkout-client.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-08 â€” Reglas operativas Scheduled en business_settings

- **DB** ExpansiÃ³n de `business_settings` con reglas operativas (lead time, cutoff, inactive days) para el modo Scheduled.
- **DB** Columnas: `scheduled_min_lead_time_hours` (default 24), `scheduled_max_days_in_advance` (default 30), `scheduled_cutoff_time` (default 18:00), `inactive_working_days` (default `{}`).
- Archivos: `supabase/migrations/20260608160000_business_settings_operations.sql`, `types/database.ts`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-08 â€” UI de configuraciÃ³n operativa en admin

- **UI** CreaciÃ³n de `/admin/settings/operations` para configuraciÃ³n de modos operativos y Server Action de actualizaciÃ³n.
- **UI** Secciones: suscripciÃ³n de modos (solo lectura), control On-Demand (`toggleBusinessStatus`) y formulario Scheduled (`updateScheduledSettings`).
- Archivos: `app/admin/(protected)/settings/operations/page.tsx`, `operations-settings-client.tsx`, `operations-settings.module.css`, `actions.ts`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-08 â€” Blindaje Scheduled en checkout y RPC

- **Ops** Enlace de navegaciÃ³n para Settings Operativos y blindaje estricto de fechas Scheduled en Checkout y RPC `create_order`.
- **Ops** Validaciones: ventana mÃ¡xima, dÃ­as inactivos, lead time mÃ­nimo y hora de corte; checkout restringe selector con reglas de `business_settings`.
- Archivos: `components/admin/settings/public-settings-nav.tsx`, `lib/business/public.ts`, `lib/business/scheduled-delivery-rules.ts`, `components/public/checkout/checkout-client.tsx`, `supabase/migrations/20260608170000_scheduled_operational_rules_guardrails.sql`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-08 â€” PR1 perf catÃ¡logo admin (React.cache + query lean)

- **DX/Perf** PR1: ImplementaciÃ³n de `React.cache()` en `getAdminContext` y optimizaciÃ³n de query lean en `getAdminProducts` para reducciÃ³n de payload.
- **Perf** Nuevo `getAdminProductById` + Server Action para cargar detalle solo al abrir el modal de ediciÃ³n; grid usa `AdminProductListItem`.
- Archivos: `lib/admin/context.ts`, `lib/products/admin.ts`, `app/admin/(protected)/products/actions.ts`, `components/admin/products/product-catalog-panel.tsx`, `product-card.tsx`, `products-workspace.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-08 â€” PR2 split SC/CC catÃ¡logo admin

- **UI/Perf** PR2: Split de `ProductGridServer` (Server Component) y `ProductsWorkspace` (Client), implementaciÃ³n de `next/dynamic` para formularios y Suspense boundaries.
- **UI/Perf** `ProductCatalogSection` async dentro de `<Suspense>`; `loading.tsx` con skeleton de catÃ¡logo; triggers cliente mÃ­nimos para ediciÃ³n y empty states.
- Archivos: `app/admin/(protected)/products/page.tsx`, `loading.tsx`, `components/admin/products/product-grid-server.tsx`, `product-catalog-section.tsx`, `products-workspace.tsx`, `products-header-actions.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-08 â€” PR3 next/image y memoizaciÃ³n catÃ¡logo admin

- **UI/Perf** PR3: MigraciÃ³n a `next/image` para optimizaciÃ³n de assets, implementaciÃ³n de `remotePatterns` y memoizaciÃ³n de `ProductCard`.
- **UI/Perf** `ProductEditTrigger` con handler estabilizado; contexto de acciones separado del estado en `ProductsWorkspace` para evitar re-render del grid al abrir modales.
- Archivos: `next.config.ts`, `lib/products/product-image.ts`, `components/admin/products/product-card.tsx`, `product-edit-trigger.tsx`, `products-workspace.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-08 â€” PR4 paginaciÃ³n server-side catÃ¡logo admin

- **Perf** PR4: ImplementaciÃ³n de paginaciÃ³n server-side en `getAdminProducts` y controles de navegaciÃ³n en el catÃ¡logo administrativo.
- **Perf** Query con `.range()` + `count: "exact"`; URL `?page=N`; componente `ProductPagination` con links nativos de Next.js.
- Archivos: `lib/products/admin.ts`, `app/admin/(protected)/products/page.tsx`, `components/admin/products/product-catalog-section.tsx`, `product-grid-server.tsx`, `product-pagination.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-09 â€” UX polish modal ediciÃ³n de productos

- **UI** UX Polish: ImplementaciÃ³n de scroll-lock, modal responsive scrollable y AdminSpinner profesional en el flujo de ediciÃ³n.
- **UI** Hook `useScrollLock` en el contenedor del modal; `.admin-modal` con `max-height: 90vh` y scroll interno; spinner semÃ¡ntico con tokens del tema.
- Archivos: `hooks/use-scroll-lock.ts`, `components/ui/admin-spinner.tsx`, `components/admin/products/edit-product-form.module.css`, `products-admin.css`, `products-workspace.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-09 â€” Limpieza cÃ³digo muerto /admin/products (Fase 1)

- **DX/Cleanup** Limpieza de cÃ³digo muerto en `/admin/products` previa a migraciÃ³n de arquitectura: eliminados paneles obsoletos, funciones huÃ©rfanas y CSS legacy.
- Eliminados `create-product-panel.tsx`, `create-category-panel.tsx`, `getAdminProductsCount`, hook `useProductsWorkspace` y selectores CSS legacy (`.admin-products-layout`, `.admin-products-sidebar`, `.admin-products-list`, `.admin-products-create-panel`).
- Archivos: `lib/products/admin.ts`, `components/admin/products/products-workspace.tsx`, `products-admin.css`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-09 â€” Fase 2 ProductsManagementProvider y selectors

- **DX** Fase 2: ImplementaciÃ³n de `ProductsManagementProvider` y extracciÃ³n de lÃ³gica de selecciÃ³n a `lib/products/selectors.ts`.
- **DX** Estado centralizado (`flyoutMode`, `selectedProductId`, `viewMode`, `categories`, `totalCount`); eliminado `ProductCatalogStateSync`; consumidores migrados a `useProductsManagement()`.
- Archivos: `lib/products/selectors.ts`, `products-management-provider.tsx`, `products-workspace.tsx`, `page.tsx`, `product-catalog-section.tsx`, `product-grid-server.tsx`, `products-header-actions.tsx`, `product-empty-state-actions.tsx`, `product-edit-trigger.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-09 â€” Fase 3 DashboardShell (3-panel layout)

- **UI** Fase 3: ImplementaciÃ³n de `DashboardShell` (3-panel layout) con Flyout Panel integrado y estado unificado.
- **UI** Grid `240px 1fr auto` con sidebar de filtros, grid central y flyout deslizable; lÃ³gica de ediciÃ³n/creaciÃ³n migrada de modal a `FlyoutPanel`; eliminado `ProductsWorkspace`.
- Archivos: `components/admin/layout/dashboard-shell.tsx`, `dashboard-shell.module.css`, `flyout-panel.tsx`, `products-dashboard-sidebar.tsx`, `page.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-09 â€” Conectividad ProductCard â†’ FlyoutPanel

- **UI** Conectividad funcional: ProductCard habilitado como disparador de FlyoutPanel; sincronizado estado de selecciÃ³n con el provider.
- **UI** Fetch de producto centralizado en `ProductsManagementProvider` (`selectedProduct`, loading/error); transiciÃ³n suave del flyout refinada.
- Archivos: `product-card.tsx`, `products-management-provider.tsx`, `flyout-panel.tsx`, `product-grid-server.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-09 â€” Fase 4 AdminSidebar modular

- **UI** Fase 4: CreaciÃ³n de `AdminNavList` (compartido) y `AdminSidebar` (escritorio). ImplementaciÃ³n de lÃ³gica modular de navegaciÃ³n reutilizando `admin-nav-config.ts`.
- **UI** Sidebar en preview oculto (`display: none`) dentro de `AdminShell`; nav horizontal legacy intacto.
- Archivos: `components/admin/layout/admin-nav-list.tsx`, `admin-sidebar.tsx`, `admin-sidebar.module.css`, `admin-nav-list.module.css`, `admin-shell.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-09 â€” Fase 5 Corte de navegaciÃ³n

- **UI** Fase 5: Corte de navegaciÃ³n. ImplementaciÃ³n de `AdminShell` con Sidebar persistente (desktop) y migraciÃ³n de `MobileDrawer` a `AdminNavList` compartido. EliminaciÃ³n de cÃ³digo nav legacy.
- **UI** Grid `240px 1fr` en desktop (â‰¥900px); sidebar oculto en mobile; `AdminTopbar` slim (brand + acciones + hamburger); eliminado `admin-nav-links.tsx`.
- Archivos: `admin-shell.css`, `admin-shell.tsx`, `admin-topbar.tsx`, `admin-mobile-drawer.tsx`, `admin-header.css`, `admin-sidebar.tsx`, `admin-nav-list.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-09 â€” Fase 7 AdminBrand (identidad consolidada)

- **UI/Architecture** Fase 7: ConsolidaciÃ³n de Identidad en `AdminBrand`. ExtracciÃ³n de branding desde Topbar/Drawer hacia AdminSidebar como Centro de Comando.
- **UI** `AdminBrand` presentacional (`logoUrl`, `name`); identidad en sidebar (desktop) y drawer (mobile); topbar sin logo, acciones alineadas a la derecha.
- Archivos: `components/admin/layout/admin-brand.tsx`, `admin-brand.module.css`, `admin-sidebar.tsx`, `admin-topbar.tsx`, `admin-mobile-drawer.tsx`, `admin-header.css`, `admin-mobile-drawer.css`, `admin-shell.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-09 â€” Fase 8 Responsive SaaS Standard

- **UI/Layout** Fase 8: MigraciÃ³n a Responsive SaaS Standard. Topbar eliminado en escritorio; sesiÃ³n y logout unificados en el footer del AdminSidebar. Grid principal expandido a 100vh.
- **UI** Mobile (<900px): topbar con logo + hamburger; desktop (â‰¥900px): sidebar full-height con identidad, nav y sesiÃ³n; contenido principal con scroll vertical independiente.
- Archivos: `admin-sidebar.tsx`, `admin-sidebar.module.css`, `admin-shell.tsx`, `admin-shell.css`, `admin-topbar.tsx`, `admin-header.css`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-09 â€” Fase 9 Doble Sidebar Productos â†’ Toolbar

- **UI/Layout** Fase 9: Desmantelamiento de Doble Sidebar en dominio de Productos. DashboardShell refactorizado a layout de columna (Toolbar superior + Grid expansivo), eliminando navegaciÃ³n lateral anidada para maximizar espacio en escritorio y evitar scroll doble en mobile.
- Archivos: `components/admin/products/dashboard-shell.tsx`, `dashboard-shell.module.css`, `products-toolbar.tsx`, `products-toolbar.module.css`, `app/admin/(protected)/products/page.tsx`; eliminados `layout/dashboard-shell.*`, `products-dashboard-sidebar.*`

### 2026-06-09 â€” Fase 10 Fluid Width

- **UI/Layout** Fase 10: TransiciÃ³n a Fluid Width. Eliminados los lÃ­mites de max-width en admin-shell para aprovechar el 100% del espacio en escritorio tras la consolidaciÃ³n del Sidebar.
- **UI** Grid de productos con `repeat(auto-fill, minmax(280px, 1fr))`; padding lateral alineado entre toolbar y contenido (`var(--space-xl)` en desktop).
- Archivos: `admin-shell.css`, `admin-page-layout.css`, `products-toolbar.module.css`, `dashboard-shell.module.css`, `products-admin.css`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-10 â€” Fase 11 ProductTableView responsiva

- **DB/UI** Fase 11: MigraciÃ³n aÃ±adida para SKU/Stock en productos. ImplementaciÃ³n de ProductTableView responsiva (Tabla en Desktop, Grid en Mobile) mediante CSS. Toggle manual de vista eliminado por UX.
- Archivos: `supabase/migrations/20260610103000_add_product_sku_stock.sql`, `types/database.ts`, `lib/products/admin.ts`, `products/actions.ts`, `product-table-view.tsx`, `product-catalog-views.tsx`, `product-catalog-section.tsx`, `products-toolbar.tsx`, `products-management-provider.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-10 â€” Fase 12 Paridad SKU/Stock en formularios

- **UI/API** Fase 12: Paridad de Datos. Formularios de creaciÃ³n y ediciÃ³n de productos (y sus Server Actions) actualizados para soportar los campos SKU y Stock.
- Archivos: `create-product-form.tsx`, `edit-product-form.tsx`, `app/admin/(protected)/products/actions.ts`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-10 â€” Fase 12.1 SKU autogenerado

- **API/Ops** Fase 12.1: SKU Autogenerado. Implementada lÃ³gica en createProductAction para generar SKUs con formato AAA-000 basados en la categorÃ­a si el input se deja en blanco.
- Archivos: `app/admin/(protected)/products/actions.ts`, `create-product-form.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-10 â€” Fase 12.2 Trigger auto-suspensiÃ³n por stock

- **DB/Ops** Fase 12.2: Trigger de seguridad implementado en Postgres. Cuando el stock de un producto <= 0, is_available pasa a false automÃ¡ticamente para evitar sobreventas.
- Archivos: `supabase/migrations/20260610110000_auto_suspend_out_of_stock.sql`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-10 â€” Fase 13 Filtros Inteligentes

- **UI/API** Fase 13: Filtros Inteligentes. Implementados controles URL-Driven (Search, CategorÃ­a, Stock, Estado) en ProductsToolbar. Modificada capa de BD (getAdminProducts) para procesar filtrado compuesto del lado del servidor.
- Archivos: `products-toolbar.tsx`, `products-toolbar.module.css`, `lib/products/admin.ts`, `app/admin/(protected)/products/page.tsx`, `product-catalog-section.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-10 â€” Fase 14 Empty State y pulido de tabla

- **UI** Fase 14 completada: Pulido de tabla (alta densidad) y agregado de Empty State para bÃºsquedas sin resultados.
- Archivos: `product-table-view.tsx`, `product-table-view.module.css`, `products-toolbar.module.css`, `product-empty-state.tsx`, `product-empty-state.module.css`, `product-catalog-section.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-10 â€” Fase 11.5 ProductAvailabilityToggle

- **UI/Ops** Fase 11.5: Componente ProductAvailabilityToggle extraÃ­do para evitar bloqueos masivos (global isPending) en listas. Implementada mutaciÃ³n optimista local y UI de switch moderno.
- Archivos: `product-availability-toggle.tsx`, `product-availability-toggle.module.css`, `product-table-view.tsx`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-11 â€” Fase 15â€“16 Formularios premium e Image Crop

- **UI/Storage** Fase 15â€“16: RediseÃ±o de `CreateProductForm` con CSS Grid, dropzone drag & drop, categorÃ­a inline, input de moneda y validaciÃ³n `checkValidity`.
- **UI/Storage** Motor de recorte 1:1: `react-easy-crop`, `ImageCropModal`, `lib/utils/cropImage.ts`; CSS de crop vendido en `vendor/react-easy-crop.css` (Fase 3).
- Archivos: `create-product-form.tsx`, `product-form.module.css`, `image-crop-modal.tsx`, `image-crop-modal.module.css`, `lib/utils/cropImage.ts`, `vendor/react-easy-crop.css`, `flyout-panel.module.css`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-11 â€” Fase 17 ConsolidaciÃ³n de modales

- **UI/DX** Fase 17: `EditProductForm` sincronizado con paridad total de `CreateProductForm` (dropzone, crop, categorÃ­a inline, grid, moneda, switch).
- **UI/DX** Eliminado botÃ³n redundante â€œ+ Nueva categorÃ­aâ€ del toolbar principal; alta de categorÃ­a solo inline en formularios.
- Archivos: `edit-product-form.tsx`, `products-header-actions.tsx`, `create-product-form.tsx`, `product-form.module.css`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-11 â€” Fase 18â€“19 Hyper-pulido de ediciÃ³n

- **UI** Fase 18: `ProductFormSkeleton` reemplaza `AdminSpinner` en flyout de ediciÃ³n; estructura replica grilla del formulario.
- **UI/A11y** Fase 19: Skeleton con labels anti-CLS; label â€œImagenâ€ en `sr-only`; badge persistente de ediciÃ³n; padding de moneda `2rem`.
- **UI/UX** Fase 19.1: Badge de tijera reabre `ImageCropModal` con imagen actual (`stopPropagation`); re-recorte sin re-upload.
- **UI** Fase 19.2: Select de categorÃ­a con `appearance: none` y chevron SVG custom (`padding-right: 2.5rem`).
- Archivos: `product-form-skeleton.tsx`, `flyout-panel.tsx`, `edit-product-form.tsx`, `create-product-form.tsx`, `product-form.module.css`, `ORDEROPS_LIVING_MEMORY.md`

### 2026-06-11 â€” MÃ³dulo de Productos cerrado (Enterprise SaaS)

- **Ops/DX** ConsolidaciÃ³n del mÃ³dulo `/admin/products` en estado **ProducciÃ³n**. Referencia arquitectÃ³nica documentada en Â§1.1 â€” datos (SKU + triggers), tabla alta densidad, filtros URL-driven server-side, UX premium (crop + skeletons) y estÃ¡ndar enterprise (flyout, empty states, paridad create/edit).
- Archivos: ver tabla en Â§1.1 MÃ³dulo de Productos (Finalizado)
- Breaking: no

### 2026-06-06 â€” ConsolidaciÃ³n Visual (Fases 1 a 3) â€” Productos 100% Tokenizado

- **DX/AuditorÃ­a** **AuditorÃ­a inicial:** GeneraciÃ³n de `docs/orderops-visual-system-consolidation-audit.md` para separar el sistema legacy (warm/cream, hex fijos) del nuevo sistema semÃ¡ntico (tokens Zinc/Ãndigo + CSS Modules).
- **UI/DX** **Foundation (Z-Index & Tokens):** CreaciÃ³n de `docs/visual-z-index-scale.md` estandarizando capas de apilamiento (p. ej. crop modal `z-index: 60`). CentralizaciÃ³n del icono chevron en `app/theme-tokens.css` (`--icon-chevron-down`) consumido por toolbars y formularios.
- **UI** **Arsenal UI global:** ExtracciÃ³n exitosa de `<EmptyState />` y `<Skeleton />` desde el dominio de productos hacia `components/ui/` para uso cross-mÃ³dulo. `ProductCatalogEmptyState` y `ProductFormSkeleton` delegan en las primitivas; eliminados `product-empty-state.tsx` y animaciÃ³n `@keyframes pulse` duplicada en formularios.
- **UI** **ErradicaciÃ³n legacy:** EliminaciÃ³n completa fÃ­sica y de referencias de `components/admin/products/products-admin.css` (import removido de `app/admin/(protected)/layout.tsx`). Estilos migrados a CSS Modules tokenizados; cÃ³digo muerto removido (`product-edit-trigger.tsx`, reglas `.admin-modal-*` huÃ©rfanas). `.admin-status-badge*` centralizado en `admin-surfaces.css`.
- **UI** **Mobile Grid:** RefactorizaciÃ³n de la vista mÃ³vil de productos usando estrictamente CSS Modules (`product-grid.module.css`, `product-card.module.css`, `product-pagination.module.css`, `product-catalog-skeleton.module.css`) y tokens semÃ¡nticos (`--bg-surface`, `--border-subtle`, `--text-primary`, hover `--bg-surface-hover` / `--border-strong`). Badge de estado y placeholder â€œSin fotoâ€ preservados.
- **UI/DX** **Vendoring:** CSS de `react-easy-crop` vendido en `components/admin/products/vendor/react-easy-crop.css` e importado desde `image-crop-modal.tsx` â€” evita corrupciÃ³n de typecheck por `.css.d.ts` invÃ¡lido en `node_modules`.
- **UI** AdopciÃ³n de primitivas `<Button />` en acciones principales (`products-header-actions`, `products-toolbar`, paginaciÃ³n, formularios). PÃ¡gina de categorÃ­as migrada a `categories-layout.module.css`.
- Archivos: `docs/orderops-visual-system-consolidation-audit.md`, `docs/visual-z-index-scale.md`, `app/theme-tokens.css`, `components/ui/empty-state.tsx`, `components/ui/skeleton.tsx`, `components/admin/products/*.module.css`, `components/admin/categories/categories-layout.module.css`, `components/admin/admin-surfaces.css`, `app/admin/(protected)/layout.tsx`, `image-crop-modal.tsx`
- Breaking: no â€” paridad visual mantenida

### 2026-06-06 â€” ConsolidaciÃ³n Visual (Fase 4) - Orders Premium Pass

- **UI** MigraciÃ³n exitosa de la vista Kanban y Listas a CSS Modules (`dashboard-kanban.module.css`, `dashboard-list.module.css`).
- **UI/DX** ExtracciÃ³n de `<OrderCard />` a componente independiente tokenizado, eliminando 170 lÃ­neas de JSX inline (`order-card.tsx`, `order-card.module.css`, `order-card-quick-actions.module.css`).
- **UI** Refactor del Toolbar (filtros y bÃºsqueda) consumiendo primitivas `<Button>` e `<Input>` (`dashboard-toolbar.module.css`, `operational-search.module.css`).
- **UI/DX** **EliminaciÃ³n absoluta de `orders-admin.css`**, erradicando el Ãºltimo gran bloque de deuda tÃ©cnica global; import removido de `app/admin/(protected)/layout.tsx`.
- **UI/DX** Fix de pureza CSS Modules (`:global()`) en superficies residuales analÃ­ticas y de detalle (`dashboard-analytics-surfaces.module.css`, `order-detail-surfaces.module.css`); componentes React actualizados a referencias modulares (`surfaceStyles.*`, `detailStyles.*`).
- Archivos: `components/admin/orders/dashboard-kanban.module.css`, `dashboard-list.module.css`, `dashboard-toolbar.module.css`, `dashboard-analytics-surfaces.module.css`, `order-detail-surfaces.module.css`, `order-card.tsx`, `admin-dashboard-orders.tsx`, `order-workspace.tsx`, `order-product-modal.tsx`, `app/admin/(protected)/layout.tsx`
- Breaking: no â€” paridad visual mantenida; lÃ³gica Realtime, filtros y reconciler intactos

### 2026-06-06 â€” ConsolidaciÃ³n Visual (Fase Final) - Supabase Sidebar & Dark Theme

- **UI/Layout** Refactor del Sidebar a `position: fixed` colapsable (72px â†’ 240px on hover) estilo Supabase, con patrÃ³n â€œventanaâ€ (filas internas a 240px recortadas por overflow), iconos centrados matemÃ¡ticamente y scroll horizontal erradicado (`admin-sidebar.module.css`, `admin-nav-list.tsx`, `admin-brand.tsx`).
- **UI/Layout** ResoluciÃ³n del layout shift del shell: rail fantasma de 72px en `admin-shell.tsx` + grid `72px minmax(0, 1fr)` en `admin-shell.css` para que el `<main>` no colapse con sidebar fixed.
- **UI/Perf** Paridad estructural de `<ProductCatalogSkeleton />`: esqueleto de **tabla** en desktop (8 filas, 7 columnas) y **grid** en mobile; prop `includeToolbar` para `loading.tsx` dentro de `DashboardShell` â€” erradica el salto visual gridâ†’tabla durante la carga del catÃ¡logo.
- **UI/DX** ImplementaciÃ³n de `<AdminThemeToggle />` (Client Component) en el footer del sidebar: persiste `orderops-theme` en `localStorage` e inyecta `data-dashboard-theme="dark"|"light"` en `<html>`; paleta oscura Zinc completada en `theme-tokens.css` (estados operativos legibles).
- **Ops/DX** **Cierre oficial de la deuda tÃ©cnica visual del Admin.** Panel 100% CSS Modules + tokens semÃ¡nticos; sin hojas globales de dominio (`orders-admin.css`, `products-admin.css` eliminados). Superficies congeladas limitadas a `admin-surfaces.css`.
- Archivos: `components/admin/layout/admin-sidebar.module.css`, `admin-sidebar.tsx`, `admin-theme-toggle.tsx`, `admin-shell.css`, `admin-shell.tsx`, `components/admin/products/product-catalog-skeleton.tsx`, `product-catalog-skeleton.module.css`, `app/admin/(protected)/products/loading.tsx`, `app/theme-tokens.css`
- Breaking: no

### 2026-06-06 â€” Refactor UI/Perf Dashboard (OperaciÃ³n Clean Slate)

- **UI/DX** **Fase 8.1 â€” Surface Cleansing:** ErradicaciÃ³n de clases globales legacy (`oo-surface`, `oo-panel`, `oo-surface-muted`) en `/admin/dashboard` a favor de CSS Modules tokenizados (`executionSection`, `contextSection` en `admin-dashboard-orders.module.css`). Aplanamiento de strips de contexto (`operational-summary-strip`, `business-insights-strip`, `operational-feed`) y tokenizaciÃ³n de buscador/presencia para Dark Mode.
- **UI** **Fase 8.2 â€” Dark Mode Remediation (Kanban):** MigraciÃ³n estricta a tokens semÃ¡nticos en `lane-navigation-scanning.module.css` y `lane-metrics-layer.module.css` â€” eliminados hex/rgba warm legacy; estados operativos vÃ­a `--bg-*-subtle`, `--text-*-strong`, `--border-subtle/strong`, `--shadow-sm`; contraste AA en light/dark.
- **UI/Perf** **Fase 8.3 â€” Desmembramiento del monolito:** MemoizaciÃ³n estricta de `<OrderCard />` con comparaciÃ³n de campos operativos (`status`, `assigned_to`, `operational_aging`, etc.) y `optimisticOrdersRef` para estabilizar `handleCardKeyDown` y no invalidar memo en cada evento Realtime.
- **UI/Architecture** ExtracciÃ³n arquitectÃ³nica del JSX inline: `DashboardToolbar`, `DashboardKanbanBoard`, `DashboardMobileOverview`, `DashboardContextPanel`.
- **UI/Perf** Lazy Loading (`next/dynamic`, `ssr: false`) de `AdminOrderWorkspaceModal` con montaje condicional al abrir pedido â€” payload inicial del dashboard reducido (~225 kB â†’ ~217 kB First Load JS).
- Archivos: `components/admin/orders/admin-dashboard-orders.tsx`, `DashboardToolbar.tsx`, `DashboardKanbanBoard.tsx`, `DashboardMobileOverview.tsx`, `DashboardContextPanel.tsx`, `DashboardOverview.tsx`, `order-card.tsx`, `lane-navigation-scanning.module.css`, `lane-metrics-layer.module.css`, `operational-search.module.css`, `operator-presence-pill.module.css`, `operational-summary-strip.module.css`, `business-insights-strip.module.css`, `operational-feed.module.css`, `admin-dashboard-orders.module.css`
- Breaking: no â€” paridad visual; lÃ³gica Realtime, hooks y reconciler intactos

### 2026-06-06 â€” Upgrade BI: SLA Tracker & Saturation Index

- **Ops/DX** **Limpieza de datos:** CentralizaciÃ³n de reglas de negocio en `lib/orders/constants.ts` (`SLA_THRESHOLDS`, `SATURATION_THRESHOLDS`, `OPERATIONAL_THRESHOLDS`) y eliminaciÃ³n de memos muertos (`commercialInsights`, `operationalInsights`) en el orquestador principal â€” reduce recomputaciÃ³n innecesaria en cada render.
- **Ops/API** **Pipeline de promesa:** InclusiÃ³n de `delivery_time` en SELECTs de `getAdminOrders` / `getAdminDashboardOrderById`, tipos `AdminOrderListItem` / `AdminOrderDashboardItem` y builder `buildAdminOrderDashboardItem` â€” habilita SLA en tiempo real sobre `delivery_date` + `delivery_time`.
- **Ops** **Riesgo prescriptivo:** CreaciÃ³n de `lib/orders/prescriptive-actions.ts` (`buildPrescriptiveActions`) â€” evalÃºa pedidos activos vÃ­a `assessOrderRisk` y devuelve acciÃ³n operativa (`Operacion fluida` / `Atencion requerida en N pedidos`) con tono semÃ¡ntico.
- **Ops/BI** **SLA Promise Tracker:** ImplementaciÃ³n de `lib/orders/sla-metrics.ts` (`calculateSLACompliance`) â€” clasifica pedidos pending/preparing en `on-time`, `at-risk` (< 15 min) y `breached`; devuelve % de cumplimiento y conteos en vivo.
- **Ops/BI** **Saturation Index (Queue Pressure):** ImplementaciÃ³n de `lib/orders/saturation-metrics.ts` (`calculateSaturationIndex`) â€” mide presiÃ³n de cola de cocina: `(preparing Ã— tiempo base) / (capacidad ideal Ã— tiempo base)` con estados **Cocina fluida**, **Alta demanda** y **Saturacion / Cuello de botella**.
- **UI** **Operational Strip prescriptivo:** EvoluciÃ³n de `DashboardOverview` / `admin-dashboard-orders.tsx` â€” reemplazo de mÃ©tricas pasivas (Estancados, Tiempo de preparaciÃ³n) por **Estado de cocina**, **Cumplimiento SLA** y **Riesgo operativo**; tonos semÃ¡nticos (`success` / `attention` / `danger`) vÃ­a `data-tone` en `DashboardOverview.module.css`; paridad en vista mÃ³vil.
- Archivos: `lib/orders/constants.ts`, `lib/orders/prescriptive-actions.ts`, `lib/orders/sla-metrics.ts`, `lib/orders/saturation-metrics.ts`, `lib/orders/admin.ts`, `components/admin/orders/admin-dashboard-orders.tsx`, `components/admin/orders/DashboardOverview.tsx`, `components/admin/orders/DashboardOverview.module.css`, `components/admin/orders/DashboardMobileOverview.tsx`
- Breaking: no â€” mÃ©tricas legacy (`averagePreparation`, `stalled`) permanecen en `overviewOperationalInsights` para otros consumidores; strip operativo usa claves `kitchenSaturation`, `slaCompliance`, `operationalRisk`

### 2026-07-12 â€” Product Customization V1 schema (DB-1)

- **DB** MigraciÃ³n `20260712090000_product_customization_v1_schema.sql`: tablas `customization_groups`, `customization_options`, `customization_group_assignments`, `product_customization_overrides`, `upsell_groups`, `upsell_group_items`; columnas `order_items.customization_snapshot`, `parent_order_item_id`, `item_kind`; flag `business_settings.product_customization_enabled` default false; RLS admin + anon gated por flag.
- Archivos: `supabase/migrations/20260712090000_product_customization_v1_schema.sql`, `types/database.ts`, `docs/product-customization-db-1-schema-rls-types.md`
- Breaking: no â€” backward-compatible; RPC `create_order` sin cambios; flag off.

### 2026-07-12 â€” Product Customization FLAG-1 â€” Tenant Rollout Guard

- **API** Helper server-only `isProductCustomizationEnabled(businessId)` fail-closed sobre `business_settings.product_customization_enabled` vÃ­a `createSupabaseServiceClient`.
- Archivos: `lib/product-customization/flags.ts`, `docs/product-customization-flag-1-tenant-rollout-guard.md`
- Breaking: no â€” sin integraciÃ³n UI/catÃ¡logo; flag sigue off; no se activa ningÃºn tenant.

### 2026-07-12 â€” Product Customization DB-APPLY-1 (producciÃ³n autorizada)

- **DB/Ops** Sin staging: usuario autorizÃ³ validar `pkrsedmwxekbhlohhqds` (OrderOps). Schema customization ya aplicado en remoto; smoke PASS; `enabled_count=0`; app flag-off PASS. `db push` omitido por ausencia de `supabase_migrations.schema_migrations` (evitar reaplicar historial).
- Archivos: `docs/product-customization-db-apply-1-staging-migration-schema-smoke.md`, `docs/CURRENT_PHASE.md`
- Breaking: no â€” flag off; sin UI; sin deploy.

### 2026-07-12 â€” Product Customization ADMIN-1 â€” Groups & Options Admin

- **UI/Admin** Ruta `/admin/products/customizations`: CRUD grupos/opciones (sin assignments/upsell), soft disable, sort_order numÃ©rico, aviso flag off. Link desde header de Productos.
- Archivos: `app/admin/(protected)/products/customizations/*`, `lib/product-customization/admin.ts`, `lib/product-customization/shared.ts`, `components/admin/product-customization/*`, `docs/product-customization-admin-1-groups-options-admin.md`
- Breaking: no â€” no afecta catÃ¡logo/checkout; flag off; sin deploy.

### 2026-07-12 â€” Product Customization ADMIN-2 â€” Assignments, Overrides & Upsell

- **UI/Admin** Assignments categorÃ­a/producto, herencia + overrides en edit product, upsell groups/items (mÃ¡x. 1 por target). Flag off; sin pÃºblico.
- Archivos: `customizations/actions.ts`, `lib/product-customization/*`, `customization-assignments-section.tsx`, `upsell-groups-section.tsx`, `product-customization-overrides-panel.tsx`, `edit-product-form.tsx`, `docs/product-customization-admin-2-assignments-overrides-upsell.md`
- Breaking: no â€” preparaciÃ³n interna; flag off; sin deploy.

### 2026-07-14 â€” LIVE-OPS-GATE-1 â€” Store Session / On-Demand Acceptance Reconciliation

- **Ops** LIVE-OPS-GATE-1 ejecutada. Se corrigiÃ³ la reconciliaciÃ³n entre `store_sessions` y `business_settings.on_demand_mode_active` para que el gate pÃºblico y `create_order` no queden desincronizados. Smoke remoto PASS: closeâ†’open SQL sync + pedido legacy `1ef8a30a-â€¦` (QA Live Ops Gate). Product Customization no fue modificado. Tenant listo: session open + `on_demand=true` + customization flag false. PrÃ³ximo paso: PRODUCT-CUSTOMIZATION-ROLLOUT-PILOT-1 Modo C Live Activation Retry 2.
- Archivos: `lib/store-sessions/acceptance.ts`, `public.server.ts`, `admin.ts`, `dashboard/actions.ts`, operations settings client, `docs/live-ops-gate-1-store-session-on-demand-reconciliation.md`
- Resultado: **PASS**.

### 2026-07-17 â€” PRODUCT-STOCK-DECREMENT-LEDGER-1 â€” Record Order Decrement Movements in create_order

- **RPC** PRODUCT-STOCK-DECREMENT-LEDGER-1 ejecutada. Se actualizÃ³ create_order para registrar movimientos order_decrement en stock_movements cuando descuenta stock de productos con track_stock=true. Cada movement queda asociado a order_id, order_item_id y product_id, con stock_before/stock_after y quantity_delta negativo. No se implementÃ³ restock ni se modificaron pedidos histÃ³ricos. Resultado: **PASS**.
- Archivos: `supabase/migrations/20260717130000_product_stock_decrement_ledger_1.sql`, `docs/product-stock-decrement-ledger-1-record-order-decrement-movements-create-order.md`
- QA: Coca 4â†’3 + ledger (`4ef1169a-â€¦`); legacy sin movements (`c9721e63-â€¦`); #9632 sin backfill
- PrÃ³xima: PRODUCT-STOCK-RESTOCK-CANCEL-1

### 2026-07-17 â€” PRODUCT-STOCK-RESTOCK-CANCEL-1 â€” Idempotent Cancel Restock via stock_movements

- **RPC** PRODUCT-STOCK-RESTOCK-CANCEL-1 ejecutada. Se implementÃ³ restock idempotente al cancelar pedidos mediante una transiciÃ³n transaccional de estado. El sistema devuelve stock solo para order_items con stock_movements.order_decrement previo, registra order_restock, evita doble devoluciÃ³n y no aplica restock a pedidos histÃ³ricos sin ledger. No se modificÃ³ create_order ni se hizo backfill. Resultado: **PASS WITH DEBT** (deploy action Vercel pendiente).
- Archivos: `supabase/migrations/20260717140000_product_stock_restock_cancel_1.sql`, `app/admin/(protected)/orders/[id]/actions.ts`, `types/database.ts`, `docs/product-stock-restock-cancel-1-idempotent-cancel-restock-stock-movements.md`
- QA: `#8B9A` Coca 3â†’4 + order_restock; idempotencia OK; `#503E` cancel sin movements; `#9632`/`#8C2F` sin restock
- PrÃ³xima: deploy wiring `updateOrderStatusAction` â†’ smoke UI cancel

### 2026-07-17 â€” PRODUCT-STOCK-RESTOCK-ACTION-DEPLOY-SMOKE-1 â€” Deploy Status Action Wiring & UI Cancel Smoke

- **Ops** PRODUCT-STOCK-RESTOCK-ACTION-DEPLOY-SMOKE-1 ejecutada. Se desplegÃ³ el wiring de updateOrderStatusAction para usar transition_order_status en producciÃ³n y se validÃ³ desde la UI admin real que cancelar un pedido tracked devuelve stock de forma idempotente mediante stock_movements. El smoke confirmÃ³ order_decrement + order_restock para Coca Cola 500ml sin afectar pedidos histÃ³ricos sin ledger. Resultado: **PASS**.
- Archivos: commit `b0bfddb` (action + types RPC + migration SQL), `docs/product-stock-restock-action-deploy-smoke-1-deploy-status-action-wiring-ui-cancel-smoke.md`
- QA: `#754A` `21064f2b-â€¦` create UI Coca 4â†’3; cancel UI 3â†’4 + restock; idempotencia â€œNo hubo cambiosâ€
- PrÃ³xima: deploy WIP customization / cleanup QA `#9632` opcional

### 2026-07-23 â€” PRODUCT-CUSTOMIZATION-ADMIN-V1-FINAL-HANDOFF-1 â€” Final Technical & Product Handoff

- **Docs / Cierre V1** PRODUCT-CUSTOMIZATION-ADMIN-V1-FINAL-HANDOFF-1 completada. Product Customization Admin V1 quedÃ³ cerrado como premium-ready para piloto, con Enterprise Readiness 4.3/5, P0=0 y P1=0. El handoff final consolidÃ³ arquitectura, modelo de datos, RLS, permisos, server actions, secciones reutilizables, assignments, excepciones, plus sugeridos, preview, pÃºblico, pricing, cart, checkout, snapshots, stock, restock, QA, rollback e invariantes de no regresiÃ³n. No se modificÃ³ runtime, DB, RLS, actions, preview mapper, cart, checkout, stock ni pedidos. Resultado: **PASS**.
- Archivos: `docs/product-customization-admin-v1-final-handoff-1.md`, `docs/CURRENT_PHASE.md`, `ORDEROPS_LIVING_MEMORY.md`; commit `6731a16`.

### 2026-07-23 â€” PRODUCT-CUSTOMIZATION-ADMIN-A11Y-POLISH-1 â€” Accessible Menus, Focus & Keyboard Polish

- **Frontend / Admin UX** PRODUCT-CUSTOMIZATION-ADMIN-A11Y-POLISH-1 ejecutada. Se puliÃ³ la accesibilidad de menÃºs, dialogs, foco y navegaciÃ³n por teclado en Product Customization Admin. Los menÃºs cerrados dejaron de exponer menuitems en el accessibility tree y se reforzaron aria-expanded, labels contextuales, Escape, click fuera y restauraciÃ³n de foco. No se modificÃ³ DB, RLS, actions, preview mapper, cart, checkout, stock ni pedidos. Resultado: **PASS WITH DND TOUCH DEBT**.
- Archivos: `reusable-sections/actions-menu.tsx`, call sites de cards, CSS focus-ring, `assignment-card.tsx` (confirm a11y), docs de fase; commit `128fac2`.

### 2026-07-23 â€” PRODUCT-CUSTOMIZATION-ADMIN-V1-PREMIUM-RESCORE-1 â€” Enterprise Premium Rescore & Residual Handoff

- **QA / Admin UX** PRODUCT-CUSTOMIZATION-ADMIN-V1-PREMIUM-RESCORE-1 ejecutada. Se re-auditÃ³ el admin de Product Customization V1 despuÃ©s de las fases de copy, jerarquÃ­a, excepciones, assignments, remove y responsive. Se recalculÃ³ el Enterprise Readiness Score, se revisaron los P1 originales y se documentÃ³ deuda residual priorizada sin modificar runtime, DB, RLS, actions, preview mapper, checkout, cart, stock ni pedidos. Resultado: **PASS WITH RESIDUAL POLISH DEBT** (score 4.3/5 Â· P0=0 Â· P1=0).
- Archivos: `docs/product-customization-admin-v1-premium-rescore-1-enterprise-readiness.md`, `docs/CURRENT_PHASE.md`, `ORDEROPS_LIVING_MEMORY.md`.

### 2026-07-23 â€” PRODUCT-CUSTOMIZATION-ADMIN-RESPONSIVE-POLISH-1 â€” Responsive Premium Polish

- **Frontend / Admin UX** PRODUCT-CUSTOMIZATION-ADMIN-RESPONSIVE-POLISH-1 ejecutada. Se puliÃ³ la experiencia responsive del admin de Product Customization, corrigiendo ancho Ãºtil en mobile, tabs, cards, chips, modales, menÃºs y vista previa. La fase fue UI/CSS-only y no modificÃ³ DB, RLS, actions, preview mapper, checkout, cart, stock ni pedidos. Resultado: **PASS**.
- Archivos: `customizations/page.tsx` (class mobile), `admin-shell.css` (`:has` padding scoped), `product-customization-admin.module.css`, `assignments.module.css`, `reusable-sections.module.css`, `plus-suggestions.module.css`, docs de fase; commit `fa8265e`.

### 2026-07-23 â€” PRODUCT-CUSTOMIZATION-ADMIN-ASSIGNMENTS-REMOVE-1 â€” Safe Assignment Unassign Action & UX

- **Frontend / Admin UX + Server Action** PRODUCT-CUSTOMIZATION-ADMIN-ASSIGNMENTS-REMOVE-1 ejecutada. Se agregÃ³ una acciÃ³n segura para quitar asignaciones de secciones desde Por producto y Por categorÃ­a en Product Customization. La UX diferencia Ocultar para clientes de Quitar asignaciÃ³n, incluye confirmaciÃ³n owner-friendly y conserva secciones/opciones reutilizables. No se modificÃ³ DB, RLS, preview mapper, checkout, cart, stock ni pedidos. Resultado: **PASS**.
- Archivos: `actions.ts` (`removeCustomizationGroupAssignmentAction`), `assignment-card.tsx`, `assignments.module.css`, `customization-assignments-section.tsx`, docs de fase; commit `e8383e0`.

### 2026-07-23 â€” PRODUCT-CUSTOMIZATION-ADMIN-ASSIGNMENTS-COMPACT-1 â€” Product & Category Assignments Compact UI

- **Frontend / Admin UX** PRODUCT-CUSTOMIZATION-ADMIN-ASSIGNMENTS-COMPACT-1 ejecutada. Se compactÃ³ la experiencia de asignaciones de Product Customization en Por producto y Por categorÃ­a, haciendo mÃ¡s claras las secciones propias, las aplicadas desde categorÃ­a y las asignadas directamente a categorÃ­a. Se reutilizaron actions existentes y no se modificÃ³ DB, RLS, preview mapper, checkout, cart, stock ni pedidos. Resultado: **PASS WITH REMOVE DEBT** (no hay action segura de quitar asignaciÃ³n; solo toggle hide/show + reorder).
- Archivos: `assignments/*`, `customization-assignments-section.tsx`, `owner-customization-builder.tsx`, docs de fase; commit `4f6ebfe`.

### 2026-07-23 â€” PRODUCT-CUSTOMIZATION-ADMIN-EXCEPTIONS-UX-1 â€” Product Exceptions Guided UX

- **Frontend / Admin UX** PRODUCT-CUSTOMIZATION-ADMIN-EXCEPTIONS-UX-1 ejecutada. Se puliÃ³ la experiencia de Excepciones del producto dentro del admin de Product Customization, convirtiendo el flujo en una experiencia guiada para el producto seleccionado. Se mejoraron empty states, resumen de excepciones, copy y acciones owner-friendly sin modificar DB, RLS, actions, preview mapper, checkout, cart, stock ni pedidos. Resultado: **PASS**.
- Archivos: `owner-customization-builder.tsx`, `product-customization-overrides-panel.tsx`, `product-customization-admin.module.css`, `edit-product-form.tsx` (productName), docs de fase; commit `f4d5260`.

### 2026-07-24 â€” ADMIN-PWA-FOUNDATION-1 â€” OrderOps Admin Installable Standalone PWA Foundation

- **Frontend / Admin PWA** ADMIN-PWA-FOUNDATION-1 completada. Se agregÃ³ una base PWA instalable para la experiencia admin de OrderOps en /admin, orientada a probar la operaciÃ³n desde telÃ©fono en modo standalone. La implementaciÃ³n agregÃ³ manifest admin, metadata de instalaciÃ³n, iconos PWA y soporte bÃ¡sico iOS/Android. No se agregÃ³ service worker ni caching offline para evitar riesgos con sesiÃ³n, dashboards, pedidos, productos, precios, stock y datos operativos. No se modificÃ³ auth, lÃ³gica admin, catÃ¡logo pÃºblico, carrito, checkout, pricing, stock, DB, RLS, actions ni pedidos. Resultado: **PASS WITH DEVICE QA DEBT**.
- Archivos: `lib/admin/pwa-manifest.ts`, `app/admin/manifest.webmanifest/route.ts`, `app/admin/layout.tsx`, `public/icons/orderops-admin-*.png`, `scripts/generate-admin-pwa-icons.mjs`, `docs/admin-pwa-foundation-1-installable-standalone.md`, `docs/CURRENT_PHASE.md`, `ORDEROPS_LIVING_MEMORY.md`; commit `b8dcbb1`.

### 2026-07-24 â€” ADMIN-PWA-BRANDING-POLISH-1 â€” Admin PWA branding polish

- **Frontend / Admin PWA** ADMIN-PWA-BRANDING-POLISH-1 completada. Se puliÃ³ branding PWA admin: nombre instalado "OrderOps", icono OrderOps mÃ¡s completo (no O aislada). start_url/scope/id /admin. Sin SW/offline. Sin cambios auth/admin/catalog/cart/checkout/pricing/stock/DB/RLS/actions/pedidos.
- Archivos: `lib/admin/pwa-manifest.ts`, `scripts/generate-admin-pwa-icons.mjs`, `public/icons/orderops-admin-*.png`, `docs/admin-pwa-branding-polish-1-app-name-icon.md`, `docs/CURRENT_PHASE.md`, `ORDEROPS_LIVING_MEMORY.md`.


### 2026-07-30 — PUBLIC-CATALOG-CART-SHEET-USABILITY-1 — Mobile Cart Sheet Hierarchy, Controls & Checkout Readiness

- **Release / Public Catalog** Public Catalog Post-Add Upsell Deploy-1: atomic functional commit `6d138a6` (`feat(public-catalog): add single-group post-add upsell flow`) pushed to `origin/main`. Vercel production deployment `dpl_6Z7qqAG3a8uJHbpm4HSBqow4zcAR` **Ready** on `https://orderops.vercel.app`. Live: single `upsellGroup`, no placement migration, post-add sheet after `created`, C1 attach/merge/replace, quantity preservation on edit, remove-child signature rebuild, focus trap. Production smoke PASS (no submit, 0 real orders). Estado: **DEPLOYED WITH NON-BLOCKING QA DEBT — SINGLE-GROUP POST-ADD UPSELL LIVE**. Doc: `docs/public-catalog-post-add-upsell-deploy-1.md`. **QUEUE_GATE: PUBLIC-CATALOG-POST-ADD-UPSELL-POST-DEPLOY-MONITOR-1 = ALLOWED**.

- **Frontend / Public Catalog Cart** Public Catalog Cart Edit Quantity Preservation Fix: P1 — edit `replaced` no longer resets parent/child quantity to 1. Authority = `existingParent.quantity` inside `mergeCustomizedSelectionIntoCart` when `replaceCartLineId` is set (modal may still emit qty 1 for creates). Children scale via existing preserve path; totals = unit × N; root-only count unchanged; `replaced` still skips post-add; created/merged/conflict/parent_missing unchanged. Fixtures EDIT-QTY-01…15. Estado: **PASS — CUSTOMIZED CART EDIT PRESERVES ROOT AND CHILD QUANTITY** · **READY FOR HUMAN DEPLOY REVIEW**. Doc: `docs/public-catalog-cart-edit-quantity-preservation-fix-1.md`. **QUEUE_GATE: PUBLIC-CATALOG-POST-ADD-UPSELL-DEPLOY-1 = HUMAN_REVIEW_REQUIRED**.

- **Frontend / Public Catalog UX** Public Catalog Post-Add Upsell QA-2: Mode B QA + authorized local fixes. Revalidated Cleanup/C1/U1 fixtures, tsc, build, and public browser core on `demohamburgueseria`. Confirmed modal without Plus, `created`→post-add, attach, merge suppression, edit preservation, checkout boundary without submit. Fixed P1 stale parent signature after removing upsell child (`removeSingleCartLine` rebuild). Added Tab focus trap on post-add sheet. Historical note: edit qty reset was observed as QA debt and later fixed in CART-EDIT-QUANTITY-PRESERVATION-FIX-1. Estado: **PASS WITH NON-BLOCKING QA DEBT** · **READY FOR HUMAN DEPLOY REVIEW**. Doc: `docs/public-catalog-post-add-upsell-qa-2.md`. **QUEUE_GATE: PUBLIC-CATALOG-POST-ADD-UPSELL-DEPLOY-1 = HUMAN_REVIEW_REQUIRED**.

- **Frontend / Public Catalog UX** Public Catalog Post-Add Upsell Impl-1: moved single `config.upsellGroup` from customization modal UI to post-add sheet after `created` only. Modal keeps customizations/options/extras; confirm builds parent with empty Plus selection; candidates filtered (max 3) via `getEligiblePostAddUpsellCandidates` + signature conflict predicate; attach uses C1 `attachUpsellChildToParent`; merged/replaced/simple quick-add skip post-add. Zero post-add fetch. Estado: **PASS WITH NON-BLOCKING QA DEBT**. Doc: `docs/public-catalog-post-add-upsell-impl-1.md`. **QUEUE_GATE: PUBLIC-CATALOG-POST-ADD-UPSELL-QA-2 = ALLOWED**. Q1 histórica permanece BLOCKED en docs; siguiente corrida válida = QA-2.

- **Frontend / Public Catalog UX** Public Catalog Upsell Realignment Cleanup: discarded D1 placement architecture (`placement`, `postAddUpsellGroup`, dual surface resolver, unapplied migration deleted). Restored single effective `upsellGroup` (product > category). Public summaries recovered against production schema (confirmed PostgREST `42703` placement missing). Plus again visible in customization modal baseline. C1 retained/generalized (`eligibleAttachedUpsellProductIds`). Safe error logging retained. No post-add UI. Estado: **PASS — D1 REMOVED, SINGLE-UPSELL BASELINE RESTORED, CATALOG RECOVERED**. Doc: `docs/public-catalog-upsell-realignment-cleanup-1.md`. **QUEUE_GATE: PUBLIC-CATALOG-POST-ADD-UPSELL-IMPL-1 = ALLOWED**.

- **Frontend / Public Catalog UX** Public Catalog Post-Add Upsell D1 Schema Runtime Fix: `next dev` targets production Supabase `pkrsedmwxekbhlohhqds`. Local Docker unavailable. Remote-dev migration tokens absent. **No D1 migration applied.** Logging fixed (`getSafeErrorDetails` / `throwLoggedCorpusError`). **SUPERSEDED BY UPSELL REALIGNMENT CLEANUP-1**. Doc: `docs/public-catalog-post-add-upsell-d1-schema-runtime-fix-1.md`.

- **Frontend / Public Catalog UX** Public Catalog Post-Add Upsell QA-1: Mode A QA-only gate. **BLOCKED — IMPL-1 NOT COMPLETE** (historical; superseded by realignment then IMPL-1 queue). Doc: `docs/public-catalog-post-add-upsell-qa-1.md`.

- **Frontend / Public Catalog UX** Public Catalog Post-Add Upsell Cart Contract (C1): discriminated merge outcomes + `attachUpsellChildToParent` + signature safety + edit preservation. **RETAINED AND GENERALIZED** under realignment (`eligibleAttachedUpsellProductIds` from single `upsellGroup`). Doc: `docs/public-catalog-post-add-upsell-cart-contract-1.md`.

- **Frontend / Public Catalog UX** Public Catalog Post-Add Upsell Domain (D1): **SUPERSEDED BY UPSELL REALIGNMENT** — placement column/domain discarded before any production apply. Historical doc: `docs/public-catalog-post-add-upsell-domain-1.md`.

- **Frontend / Public Catalog UX** Public Catalog Post-Add Upsell Spec: docs-only product/domain/technical spec. Placement does not exist on `upsell_groups` today; reusing all in-modal Plus post-add (Option A) is rejected. Preferred MVP = new V2 parent only + cache-hit 0 POST + group-level `placement` enum `in_modal|post_add` (no `both` in MVP) + merge result exposing final `parentCartLineId`/`outcome` + `attachUpsellChildToParent` + dismissible bottom sheet + root-only count. Legacy simple and cart-level cross-sell roots out of MVP. Verdict: **GO WITH DOMAIN PREREQUISITE**. Doc: `docs/public-catalog-post-add-upsell-spec-1.md`. Próximo: **PUBLIC-CATALOG-POST-ADD-UPSELL-DOMAIN-1** (implementado en código; apply DB pendiente).

- **Frontend / Public Catalog UX** Public Catalog Integrated Conversion QA: end-to-end funnel QA (catalog → modal → FAB → sheet → checkout) without real orders. Modo A QA-only — no code fixes. Validated root-only customer-facing counts, parent/child price clarity, Plus remove/edit/qty, mix parent×3+independent Coca×2 = 5, remove parent without orphans, modal cache first-open 1 POST / reopen 0, checkout delivery/pickup 0 fetch, empty states. Preview admin, real device, and closed-store runtime remain debt. `createPublicCheckoutOrderAction`/`create_order`/payload/cart schema untouched. Estado: **PASS WITH PREVIEW QA DEBT** (+ device QA debt) · **SUBMIT REAL NOT EXECUTED BY SCOPE**. Doc: `docs/public-catalog-integrated-conversion-qa-1.md`. Próximo: **PUBLIC-CATALOG-POST-ADD-UPSELL-SPEC-1** (completado).

- **Frontend / Public Catalog UX** Public Catalog Checkout Summary Visual QA Fix: customer-facing cart count is root-only (`getCartItemCount` sums hierarchical legacy + V2 parent quantities; linked upsell children remain visible/billable/removable but do not inflate FAB/sheet/checkout counts). Parent/child prices clarified using explicit `lineTotal` (no ambiguous groupTotal beside parent). Checkout-only static business header (sticky overlay fixed without hiding branding). Sticky CTA focus spacing via CSS scroll-padding/margin. Totals/payload/`createPublicCheckoutOrderAction`/`create_order` unchanged. Submit real not executed. Estado: **PASS WITH PREVIEW QA DEBT** (+ device QA debt). Doc: `docs/public-catalog-checkout-summary-visual-qa-fix-1.md`. Próximo: **PUBLIC-CATALOG-INTEGRATED-CONVERSION-QA-1** (completado).

- **Frontend / Public Catalog UX** Public Catalog Checkout Conversion Polish: segmented mobile checkout surface with clear sections (modality radios `delivery`/`pickup` labeled Envío/Retiro, contact, conditional address/pickup info, notes, hierarchical summary, sticky CTA `Enviar pedido · $X`). Presentational CSS module only; payload, `createPublicCheckoutOrderAction`, `create_order`, cart schema, localStorage keys, pricing, preview guard unchanged. No payment UI (none existed). No Google Places; no Argentine phone mask/normalization. Submit real not executed in QA. Estado: **PASS WITH PREVIEW QA DEBT** (+ device QA debt). Doc: `docs/public-catalog-checkout-conversion-polish-1.md`. Próximo: **PUBLIC-CATALOG-INTEGRATED-CONVERSION-QA-1**.

- **Frontend / Public Catalog UX** Public Catalog Cart Sheet Usability: implements compact premium cart sheet hierarchy and icon controls after customization modal UX. Header “Tu pedido” uses existing `getCartItemCount` semantics; simple and V2 parents render as clear units with customer-facing `displaySummary`; upsell children stay subordinated with existing remove callback; quantity steppers reuse current local mutations (0 fetch); sticky footer shows Total + “Continuar al checkout” with unchanged navigation; empty sheet shows “Tu pedido está vacío” + “Seguir comprando”. Cart schema, LocalCartItem contracts, localStorage keys, pricing, checkout, create_order, Product Customization, cache, preview isolation untouched. Estado: **PASS WITH PREVIEW QA DEBT**. Doc: `docs/public-catalog-cart-sheet-usability-1.md`. Próximo: **PUBLIC-CATALOG-INTEGRATED-CONVERSION-QA-1** o **PUBLIC-CATALOG-POST-ADD-UPSELL-SPEC-1**.

### 2026-07-30 — PUBLIC-CATALOG-CUSTOMIZATION-MODAL-UX-POLISH-1 — Compact Premium UX for Public Customization Modal

- **Frontend / Public Catalog UX** Public Catalog Customization Modal UX Polish: implements compact premium UX for the public customization modal after the perf fix. Required groups remain full-width and clear; optional groups (and in-modal Plus) render in compact 2-col grids; option rows/cards are denser but tappable (≥44px); the sticky CTA shows the final total (`Agregar · $X`); and the price gets a subtle CSS-only micro-interaction only when the total changes, with reduced-motion support. Existing Plus/upsell flow remains unchanged; post-add upsell is not implemented. PERF-FIX-1 cache/dedupe remains intact: first open on-demand (1 POST), reopen cache-hit with 0 POST, simple products 0 fetch. No DB/RLS/RPC/checkout/create_order/cart schema/cache/image/env/CSP/PWA changes; no deploy in this phase. Estado: **PASS WITH PREVIEW QA DEBT**. Doc: `docs/public-catalog-customization-modal-ux-polish-1.md`. Próximo: **PUBLIC-CATALOG-POST-ADD-UPSELL-SPEC-1** o **PUBLIC-CATALOG-CART-SHEET-USABILITY-1**.

### 2026-07-30 — PUBLIC-CATALOG-CUSTOMIZATION-MODAL-PERF-FIX-1 — Client Cache & In-flight Dedupe for Customization Modal

- **Frontend / Public Catalog Perf** Public Catalog Customization Modal Perf Fix: implements client-side session cache by `slug:productId` in CatalogClient plus in-flight request dedupe for customization modal configs. First open remains on-demand (local: 1 Next-Action POST, may show “Cargando opciones”); reopening the same product uses cached config without perceptible loading and with 0 new Next-Action POSTs (~40–50 ms ready); different products keep isolated configs; simple products still do not fetch; detail modal path shares the same cache. CustomizationModal is controlled via parent `loadState`/`onRetry` (no internal refetch). No DB/RLS/RPC/checkout/create_order/cart schema/Product Customization server validation/cache tags/image/env/CSP/PWA changes; no deploy in this phase. Estado: **PASS WITH PREVIEW QA DEBT**. Doc: `docs/public-catalog-customization-modal-perf-fix-1.md`. Próximo: **PUBLIC-CATALOG-CUSTOMIZATION-MODAL-UX-POLISH-1**.

### 2026-07-30 — PUBLIC-CATALOG-CUSTOMIZATION-MODAL-PERF-AUDIT-1 — Forensic Audit of Customization Modal Repeated Loading

- **QA / Public Catalog Perf** Public Catalog Customization Modal Perf Audit: audit-only phase to diagnose repeated loading of the public customization modal. Source maps ProductCard/CatalogClient → CustomizationModal → `getPublicProductCustomizationConfigAction` → `getPublicProductCustomizationConfig` (`noStore()`). Runtime confirms every open/reopen shows “Cargando opciones…” and refetches (local/dev: two Next-Action POSTs per open, ~2.7–3.7s ready). Config lives only in modal local state and is discarded on close. Simple products do not fetch. Recommended fix: client cache by productId in CatalogClient + in-flight dedupe. No cache fix, no prefetch, no Product Customization logic changes, no checkout/create_order/cart schema/cache/image/env/CSP changes. Estado: **PERF AUDIT COMPLETE — FIX RECOMMENDED**. Doc: `docs/public-catalog-customization-modal-perf-audit-1.md`. Próximo: **PUBLIC-CATALOG-CUSTOMIZATION-MODAL-PERF-FIX-1**.

### 2026-07-30 — PUBLIC-CATALOG-PRODUCT-CARDS-SINGLETON-WIDTH-FIX-1 — Keep Single-Product Categories at Grid Card Width

- **Frontend / Public Catalog Conversion** Public Catalog Product Cards Singleton Width Fix: microfix after product cards grid polish. Categories with a single product now keep the standard 2-column card width instead of stretching the only card full-width. The fix is layout/CSS-only and preserves image-first cards, quick `+`, header hide, category sticky, cart FAB, checkout, cart schema, Product Customization server logic, cache, image loader, env/CSP/PWA. Estado: **PASS WITH PREVIEW QA DEBT**. Doc: `docs/public-catalog-product-cards-singleton-width-fix-1.md`. Próximo: **PUBLIC-CATALOG-CUSTOMIZATION-MODAL-PERF-AUDIT-1**.

### 2026-07-30 — PUBLIC-CATALOG-PRODUCT-CARDS-GRID-POLISH-1 — Mobile 2-Column Product Cards & Quick Add Polish

- **Frontend / Public Catalog Conversion** Public Catalog Product Cards Grid Polish: second implementation phase of conversion roadmap. Product cards now use a mobile-first 2-column image-first layout, remove the competing “Ver detalle” CTA, make the whole card open product detail, and expose a compact quick `+` action. Simple products add quickly; customizable products open the customization modal. Descriptions are clamped to 2 lines and card image sizes are adjusted for 2-column layout. Existing quantity stepper kept only when simple qty > 0 (visually compacted). No DB/RLS/RPC/checkout/create_order/cart schema/cache/Product Customization server logic/image loader/env/CSP/PWA changes; no deploy in this phase. Estado: **PASS WITH PREVIEW QA DEBT**. Doc: `docs/public-catalog-product-cards-grid-polish-1.md`. Próximo: **PUBLIC-CATALOG-CUSTOMIZATION-MODAL-PERF-AUDIT-1**.

### 2026-07-30 — PUBLIC-CATALOG-SHELL-CART-SURFACES-POLISH-1 — Header Hide, Sticky Categories & Compact Cart FAB

- **Frontend / Public Catalog Conversion** Public Catalog Shell/Cart Surfaces Polish: first implementation phase of the conversion roadmap. Implements public catalog header hide-on-scroll, sticky category nav offset refinement, hides empty cart surface completely, and replaces the large bottom cart bar with a compact cart FAB showing only cart icon + quantity when items exist. Hero mobile compacted safely as shell visual polish (overlay copy on cover). Fixed legacy CSS override that pinned category `top` to `--public-business-header-offset` and ignored hide state. No DB/RLS/RPC/checkout/create_order/cart schema/Product Customization/cache/image/env/CSP/PWA changes; no deploy in this phase. Estado: **PASS WITH PREVIEW QA DEBT**. Doc: `docs/public-catalog-shell-cart-surfaces-polish-1.md`. Próximo: **PUBLIC-CATALOG-PRODUCT-CARDS-GRID-POLISH-1**.

### 2026-07-30 — PUBLIC-CATALOG-CONVERSION-SPEC-CLOSURE-1 — Final Product & Technical Spec Closure for Public Catalog Conversion Roadmap

- **Spec / Public Catalog Conversion** Public Catalog Conversion Spec Closure: final product/technical closure for the public catalog conversion roadmap. Decisions frozen: hide header on downward scroll, sticky/active category nav, compact premium hero with overlay copy, hide empty cart surface, cart FAB only icon+quantity when cart has items, 2-column mobile product cards with image-first layout and quick `+`, `+` opens customization modal when needed, no `Ver detalle`, modal perf audit before fix, compact optional groups and CTA total, post-add upsell spec-only for now, cart sheet icon-only actions with confirm delete, checkout Delivery/Retiro segmented cards with summary above and sticky CTA, Argentina phone validation, Google Places as later standalone spec. First deploy will be grouped after safe conversion polish + integrated QA; post-add upsell implementation and Places implementation are out of first grouped deploy. Estado: **SPEC CLOSED**. Doc: `docs/public-catalog-conversion-spec-closure-1.md`. Próximo: **PUBLIC-CATALOG-SHELL-CART-SURFACES-POLISH-1**.

### 2026-07-30 — PUBLIC-CATALOG-CONVERSION-SURFACES-AUDIT-SPEC-1 — Public Catalog Conversion Surfaces Audit & Product Spec

- **Spec / Public Catalog Conversion** Public Catalog Conversion Surfaces Audit/Spec: docs-only product and technical spec for the next conversion layer of the public catalog. Decisions: hide header on downward scroll, keep category nav sticky/active, compact premium hero, hide empty cart surface, use compact cart FAB when cart has items, move product cards toward 2-column image-first layout with whole-card detail and quick + add, audit repeated customization modal loading, use compact grids for optional groups, post-add upsell as separate flow, icon-based cart actions, checkout Delivery/Retiro segmented cards, summary above, sticky CTA, Argentina phone normalization, and Google Places as a later standalone spec. Performance budget: no new catalog server calls, no heavy animation libs, no Google Places in catalog, no cache/cart/create_order changes in this spec phase. Estado: **SPEC READY**. Doc: `docs/public-catalog-conversion-surfaces-audit-spec-1.md`. Próximo: **PUBLIC-CATALOG-SHELL-CART-SURFACES-POLISH-1**.

### 2026-07-30 — PUBLIC-CATALOG-PREVIOUS-SLUG-CALLERS-FIX-1 — Pass previousSlug Through Public Catalog Cache Invalidation Callers

- **Fix / Public Catalog Cache** Public Catalog previousSlug Callers Fix: server actions that can change the public business slug now capture the old slug before update and pass it as `previousSlug` to `revalidatePublicCatalogCache`, so both old and new public paths are revalidated after slug changes. Cache tags/scopes remain unchanged; no DB/RLS/RPC/checkout/orders/Product Customization/image/env/CSP changes. Runtime slug rename QA requires separate authorization. Source of truth: `businesses.slug` via super-admin `updateBusinessAction` (tenant admin settings do not mutate slug). Estado: **PASS WITH RUNTIME SLUG QA DEBT**. Doc: `docs/public-catalog-previous-slug-callers-fix-1.md`. Próximo: **PUBLIC-CATALOG-CACHE-MUTATION-RUNTIME-QA-2-FOLLOWUP** o slug rename QA con auth.

### 2026-07-30 — PUBLIC-CATALOG-REAL-DEVICE-QA-1 — Real Device QA for Public Catalog V1

- **QA / Public Catalog Device** Public Catalog Real Device QA: hardware-device QA for public catalog V1 and admin preview, validating real mobile loading, scroll/jank, Product Customization, cart, checkout boundary without submit, image fallback, preview iframe touch behavior, preview checkout guard, public/preview isolation, cleanup, and no real orders. No DB/RLS/RPC/checkout/cache/Product Customization/image/env/code changes. Estado: **BLOCKED — REAL DEVICE UNAVAILABLE** (no operable Android/iOS hardware from agent environment; emulation not accepted as PASS). Doc: `docs/public-catalog-real-device-qa-1.md`. Próximo: **PUBLIC-CATALOG-REAL-DEVICE-QA-1-FOLLOWUP** with Android Chrome real.

### 2026-07-29 — PUBLIC-CATALOG-PREVIEW-AUTH-SMOKE-1 — Authenticated Admin Preview Deep Smoke for Public Catalog V1

- **QA / Public Catalog Preview** Public Catalog Preview Auth Smoke: authenticated deep QA of `/admin/products/preview` validating preview shell, real same-origin catalog iframe, isolated preview cart, clear-cart flow, Product Customization inside iframe, preview checkout guard, public normal boundary, CSP/frame behavior, local QA cleanup and no real orders. No DB/RLS/RPC/checkout/cache/Product Customization/image/env/code changes. Estado: **PASS WITH MINOR PREVIEW QA DEBT** (cookie Application flags partially UNVERIFIED; real device pending). Doc: `docs/public-catalog-preview-auth-smoke-1.md`. Próximo: **PUBLIC-CATALOG-REAL-DEVICE-QA-1**.

### 2026-07-29 — PUBLIC-CATALOG-IMAGE-TRANSFORMS-INFRA-1-MODE-B — Authorized Supabase Image Transformations Enablement & Production Verification

- **Infra / Public Catalog Images** Public Catalog Image Transforms Infra Mode B: authorized Supabase Image Transformations enablement and production verification for public catalog images. The phase validates billing/plan, render/image status, real bytes vs object fallback, public catalog smoke, checkout boundary, preview boundary, and fallback safety. No DB/RLS/RPC/checkout/orders/cache/Product Customization/CSP changes. Enable requires explicit `AUTORIZO_SUPABASE_IMAGE_TRANSFORMATIONS_ENABLE=yes` and `AUTORIZO_SUPABASE_IMAGE_TRANSFORMATIONS_BILLING_ACCEPTED=yes`. Estado: **BLOCKED — MISSING IMAGE TRANSFORMS ENABLE AUTH** (no Supabase enable/billing/plan/code). Baseline: object 200 / render 403 FeatureNotEnabled. Doc: `docs/public-catalog-image-transforms-infra-1-mode-b.md`. Próximo: re-run Mode B with both auth tokens.

### 2026-07-29 — PUBLIC-CATALOG-OBSERVABILITY-PROD-ENABLE-1 — Controlled Production Enablement for Public Catalog Observability

- **Ops / Public Catalog Observability** Public Catalog Observability Prod Enable: controlled production enablement/audit for privacy-safe public catalog observability. The existing Web Vitals/custom metrics endpoint remains 204 and privacy-safe. Production normal beacons are enabled only if `AUTORIZO_PUBLIC_CATALOG_OBSERVABILITY_PROD_ENABLE=yes` is present; server logs require separate `AUTORIZO_PUBLIC_CATALOG_OBSERVABILITY_LOGS_PROD=yes`. No DB/RLS/RPC/checkout/orders/cache/Product Customization/image/CSP changes. Estado: **BLOCKED — MISSING OBSERVABILITY PROD ENABLE AUTH** (no Vercel env changes). Doc: `docs/public-catalog-observability-prod-enable-1.md`. Próximo: re-run with explicit auth.

### 2026-07-29 — PUBLIC-CATALOG-CACHE-MUTATION-RUNTIME-QA-2-FOLLOWUP — Authorized Runtime QA for Public Catalog Cache Invalidation

- **QA / Public Catalog Cache** Public Catalog Cache Mutation Runtime QA Followup: blocked — missing `AUTORIZO_CACHE_MUTATION_RUNTIME_QA_PROD=yes`. No productive admin mutations executed. Prior Mode A source audit remains valid. Ordering, slug rename and flag toggle require separate tokens and remain UNVERIFIED. No DB/RLS/RPC/checkout/orders/deploy/code. Doc: `docs/public-catalog-cache-mutation-runtime-qa-2-followup.md`. Estado: **BLOCKED — MISSING MUTATION AUTH**. Próximo: re-run FOLLOWUP with explicit auth token.

### 2026-07-29 — PUBLIC-CATALOG-CACHE-MUTATION-RUNTIME-QA-2 — Runtime QA for Public Catalog Cache Invalidation After Admin Mutations

- **QA / Public Catalog Cache** Public Catalog Cache Mutation Runtime QA: validated or source-audited public catalog cache invalidation after admin mutations. Product/category/public-settings/customization mutations were handled according to explicit authorization, with exact restore verification and no checkout/create_order/cart schema/pricing/stock changes. Acceptance status remains fresh/noStore; slug rename and Product Customization flag toggle remain separate high-risk QA unless explicitly authorized. No DB/RLS/RPC/orders/deploy. Modo A (no mutation auth): source PASS + baseline/checkout/metrics read-only. Doc: `docs/public-catalog-cache-mutation-runtime-qa-2.md`. Estado: **PASS WITH RUNTIME MUTATION AUTH DEBT**. Próximo: **PUBLIC-CATALOG-CACHE-MUTATION-RUNTIME-QA-2-FOLLOWUP**.

### 2026-07-29 — PUBLIC-CATALOG-POST-DEPLOY-MONITOR-1 — Post-Deploy Production Monitor for Public Catalog V1

- **QA / Public Catalog** Public Catalog Post-Deploy Monitor: read-only production monitor after Public Catalog V1 final handoff. Validated catalog health, Product Customization, cart/checkout boundary without submitting orders, observability debug endpoint, CSP/headers, performance sanity, image fallback debt, preview boundary according to auth, and mobile smoke. No DB/RLS/RPC/checkout/orders/code changes. Residual debts remain tracked separately. Doc: `docs/public-catalog-post-deploy-monitor-1.md`. Estado: **PASS WITH NON-BLOCKING QA DEBT**. Próximo: **PUBLIC-CATALOG-CACHE-MUTATION-RUNTIME-QA-2**.

### 2026-07-29 — PUBLIC-CATALOG-FINAL-HANDOFF-1 — Public Catalog V1 Final Technical & Product Handoff

- **Docs / Public Catalog** Public Catalog V1 Final Handoff: public catalog roadmap is formally closed and live. Final architecture includes cached stable catalog data, fresh ordering status, customization summary-lite, optimized image wrapper with Supabase transform fallback, mobile scroll polish, conversion UX polish and privacy-safe observability debug endpoint. Last functional deploy `fb19a3a`; roadmap deploy status `DEPLOYED WITH NON-BLOCKING QA DEBT`. Residual debt: Image Transformations FeatureNotEnabled, preview auth/device smoke, observability prod env, mutation cache runtime QA, real-device QA and lint circular. No DB/RLS/RPC/checkout/orders changed in final handoff. Doc: `docs/public-catalog-final-handoff-1.md`. Estado: **FEATURE CLOSED — DEPLOYED WITH NON-BLOCKING QA DEBT**. Próximo opcional: **PUBLIC-CATALOG-POST-DEPLOY-MONITOR-1**.

### 2026-07-29 — PUBLIC-CATALOG-ROADMAP-DEPLOY-1 — Controlled Deploy for Public Catalog Roadmap Package

- **Deploy / Public Catalog** Public Catalog Roadmap Deploy: grouped deploy of scroll jank polish, customization corpus overfetch reduction, conversion UX polish and privacy-safe observability foundation. Supabase Image Transformations remains infra auth debt (`FeatureNotEnabled`). Production smoke covered public catalog, observability debug endpoint, checkout boundary and preview according to auth availability. No DB/RLS/RPC/checkout/orders. Commit funcional `fb19a3a`. Doc: `docs/public-catalog-roadmap-deploy-1.md`. Estado: **DEPLOYED WITH NON-BLOCKING QA DEBT**. Próximo: **PUBLIC-CATALOG-FINAL-HANDOFF-1**.

### 2026-07-29 — PUBLIC-CATALOG-OBSERVABILITY-1 — Public Catalog Web Vitals & UX Observability Foundation

- **Frontend / Public Catalog Observability** Public Catalog Observability: added privacy-safe Web Vitals + lightweight public catalog metrics foundation with debug query mode and a 204 same-origin endpoint, no DB/Supabase/PII/cart/customer data. Preserves checkout/create_order, cart schema, cache, corpus summary-lite, image loader, preview logic and UX polish. Pending grouped deploy. Doc: `docs/public-catalog-observability-1.md`. Estado: **PASS WITH PREVIEW QA DEBT**. Próximo: **PUBLIC-CATALOG-ROADMAP-DEPLOY-1**.

### 2026-07-29 — PUBLIC-CATALOG-CONVERSION-UX-POLISH-1 — Public Catalog Shopping Experience & Conversion Clarity

- **Frontend / Public Catalog** Public Catalog Conversion UX Polish: improved customer-facing clarity across product cards, Desde/option CTAs, customization modal, cart bar/sheet and empty/closed states while preserving pricing, cart schema, checkout/create_order, cache, corpus summary-lite, preview logic and scroll polish. No DB/RLS/RPC/checkout/orders. Pending grouped deploy with scroll polish/corpus UX package. Doc: `docs/public-catalog-conversion-ux-polish-1.md`. Estado: **PASS WITH PREVIEW QA DEBT**. Próximo: **PUBLIC-CATALOG-ROADMAP-DEPLOY-1**.

### 2026-07-29 — PUBLIC-CATALOG-IMAGE-TRANSFORMS-INFRA-1 — Enable Supabase Image Transformations & Verify Real Bytes

- **Infra / Public Catalog Images** Public Catalog Image Transforms Infra: Supabase Image Transformations blocked/unverified (no auth); render/image status 403 FeatureNotEnabled; real image bytes measured via curl object (logo ~918KB, cover ~1.8MB, thumb ~338KB); PublicStorageImage fallback remains safe; no DB/RLS/RPC/cache/checkout/orders. Pending grouped deploy with scroll polish and corpus overfetch if no blockers. Doc: `docs/public-catalog-image-transforms-infra-1.md`. Estado: **PASS WITH INFRA AUTH DEBT**. Próximo: **PUBLIC-CATALOG-ROADMAP-DEPLOY-1**.

### 2026-07-29 — PUBLIC-CATALOG-CORPUS-OVERFETCH-FIX-1 — Public Customization Corpus Overfetch Reduction

- **Frontend / Public Catalog** Public Catalog Corpus Overfetch Fix: customization summaries now use a summary-lite read model limited to visible catalog products/categories and relevant groups/options/overrides/upsells. Modal config remains on-demand; checkout/create_order, DB/RLS/RPC, cache tags and preview logic untouched. Residual: deploy grouped with scroll polish, Image Transforms infra, mutation QA with auth, web vitals. Doc: `docs/public-catalog-corpus-overfetch-fix-1.md`. Estado: **PASS WITH PREVIEW QA DEBT**. Próximo: **PUBLIC-CATALOG-ROADMAP-DEPLOY-1**.

### 2026-07-29 — PUBLIC-CATALOG-SCROLL-JANK-POLISH-1 — Public Catalog Mobile Scroll Smoothness & Glass Cost Reduction

- **Frontend / Public Catalog** Public Catalog Scroll Jank Polish: reduced mobile glass/backdrop-filter/shadow cost on public catalog sticky/fixed surfaces while preserving catalog behavior, cart, customization modal, checkout boundary and admin preview. No DB/RLS/RPC/cache/checkout/orders. Residual: real device Android QA if unavailable, corpus overfetch, Image Transforms infra, optional web vitals. Doc: `docs/public-catalog-scroll-jank-polish-1.md`. Estado: **PASS WITH DEVICE QA DEBT**. Próximo: **PUBLIC-CATALOG-SCROLL-JANK-DEPLOY-1**.

### 2026-07-29 — PUBLIC-CATALOG-CACHE-INVALIDATION-QA-1 — Runtime QA for Public Catalog Cache Invalidation

- **QA / Public Catalog Cache** Public Catalog Cache Invalidation QA: cache tags/source coverage verified; runtime mutation invalidation UNVERIFIED; ordering status freshness UNVERIFIED; catalog/checkout/preview smoke passed; no DB/RLS/RPC/checkout/orders. Residual: scroll/jank, corpus overfetch, Image Transforms infra, optional stricter web vitals. Doc: `docs/public-catalog-cache-invalidation-qa-1.md`. Estado: **PASS WITH MUTATION QA DEBT**. Próximo: **PUBLIC-CATALOG-SCROLL-JANK-POLISH-1**.

### 2026-07-29 — PUBLIC-CATALOG-CACHE-DEPLOY-1 — Controlled Deploy for Public Catalog Cache Strategy

- **Deploy / Public Catalog Cache** Public Catalog Cache Strategy deployed: stable public catalog data cached with TTL 60s + tags, ordering status remains fresh/noStore, admin actions invalidate via central public catalog cache helper. Checkout/create_order, DB/RLS/RPC, cart schema and preview logic untouched. Residual debt: runtime mutation invalidation smoke if not authorized, corpus overfetch, scroll/jank, Supabase Image Transformations infra. Commit funcional `81ae607`. Doc: `docs/public-catalog-cache-deploy-1.md`. Próximo: **PUBLIC-CATALOG-CACHE-INVALIDATION-QA-1** o **PUBLIC-CATALOG-SCROLL-JANK-POLISH-1**.

### 2026-07-29 — PUBLIC-CATALOG-CACHE-STRATEGY-1 — Public Catalog Data Cache Strategy & Safe Invalidation

- **Frontend / Public Catalog Cache** PUBLIC-CATALOG-CACHE-STRATEGY-1: `unstable_cache` TTL 60s + tags `public-business`/`public-catalog`/`public-customization`; stable branding/products/summaries cacheados (service client); `getFreshPublicOrderingStatus` con `noStore`; invalidación `updateTag` vía `revalidatePublicCatalogCache` en products/categories/settings/operations/customizations. Estado: **PASS WITH RESIDUAL CACHE DEBT**. Doc: `docs/public-catalog-cache-strategy-1.md`. Próximo: **PUBLIC-CATALOG-CACHE-DEPLOY-1**. Sin DB/RLS/RPC/checkout/commit/push/deploy.

### 2026-07-28 — PUBLIC-CATALOG-PERFORMANCE-DEPLOY-1 — Controlled Deploy for Public Catalog Performance Package

- **Deploy / Public Catalog** PUBLIC-CATALOG-PERFORMANCE-DEPLOY-1: Public Catalog Performance package deployed: imágenes críticas con `next/image`/PublicStorageImage, transforms fallback seguro por FeatureNotEnabled, data path dedupeado con `public-page-data`, settings/flag/products reducidos, summaries reusando catálogo y ProductCard memoizado. Sin DB/RLS/RPC/cache/checkout/pedidos. Commit `2b60bb3`. Próximo: **PUBLIC-CATALOG-CACHE-STRATEGY-1**. Doc: `docs/public-catalog-performance-deploy-1.md`.

### 2026-07-28 — PUBLIC-CATALOG-PERFORMANCE-FIX-1 — Public Catalog Server Calls & Render Cost Reduction

- **Frontend / Public Catalog** PUBLIC-CATALOG-PERFORMANCE-FIX-1: loader `getPublicCatalogPageData`; dedupe `business_settings`/`onDemandModeActive`/`product_customization_enabled` en path público; summaries con products preloaded + sin waterfall suggested en page; `memo(ProductCard)` + callbacks estables. Estado: **PASS WITH RESIDUAL PERFORMANCE DEBT** (corpus groups/options overfetch, `noStore`, scroll jank, preview hooks graph, image transforms infra). Doc: `docs/public-catalog-performance-fix-1.md`. Siguiente: **PUBLIC-CATALOG-CACHE-STRATEGY-1**. Sin DB/RLS/RPC/cache/checkout/commit/push.

### 2026-07-28 — PUBLIC-CATALOG-IMAGE-TRANSFORMS-QA-FIX-1 — Supabase Image Transformations QA/Fix for Public Catalog

- **QA/Fix / Public Catalog Images** PUBLIC-CATALOG-IMAGE-TRANSFORMS-QA-FIX-1: curl object **200** vs render/image **403 FeatureNotEnabled** (tenant). Loader OK; fix `PublicStorageImage` reset fallback on `src`. Estado: **PASS WITH INFRA IMAGE DEBT**. Acción externa: habilitar Image Transformations en Supabase. Doc: `docs/public-catalog-image-transforms-qa-fix-1.md`. Siguiente: **PUBLIC-CATALOG-PERFORMANCE-FIX-1**.

### 2026-07-28 — PUBLIC-CATALOG-IMAGE-OPTIMIZATION-1 — Public Catalog Image Loading & Rendering Optimization

- **Frontend / Public Catalog** PUBLIC-CATALOG-IMAGE-OPTIMIZATION-1: migración `<img>` → `next/image` en cover, logo header, product thumbs y detail modal vía `PublicStorageImage` + `getSupabaseImageLoader` (fallback object). Thumbs lazy/sized; cover priority. Estado: **PASS WITH MINOR IMAGE DEBT** (transforms fallback, landing imgs, checkout/preview smoke UNVERIFIED). Doc: `docs/public-catalog-image-optimization-1.md`. Siguiente: **PUBLIC-CATALOG-PERFORMANCE-FIX-1**. Sin DB/RLS/RPC/cache/checkout/commit/push.

### 2026-07-28 — ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-HANDOFF-1 — Final Handoff for Admin Catalog Preview Mobile Feel

- **Handoff / Admin Preview (docs-only)** Admin Catalog Preview cerrada: `/admin/products/preview` live con iframe real, cart preview aislado, checkout bloqueado, cookie 300s, clear-cart postMessage, mobile-feel desktop/mouse, shell premium y layout paridad Products. Estado final **FEATURE CLOSED — DEPLOYED WITH ACCEPTED DEVICE QA DEBT**. No DB/RLS/RPC/pedidos. Próximo opcional device hardware QA. Doc: `docs/admin-catalog-preview-mobile-feel-final-handoff-1.md`. Commits: `c4b3e18` · `5843fd9` · `0dce5b3` · HEAD docs `4dd5dce`.

### 2026-07-28 — ADMIN-CATALOG-PREVIEW-FINAL-QA-DEVICE-1 — Real Device Final QA for Admin Catalog Preview

- **QA / Admin Preview (docs-only)** ADMIN-CATALOG-PREVIEW-FINAL-QA-DEVICE-1 completada. Prod https://orderops.vercel.app @ HEAD docs `4dd5dce` (layout `0dce5b3`, mobile-feel `5843fd9`). Desktop smoke: preview shell+iframe, clear-cart visual 0, checkout preview bloqueado, público sin preview + “Enviar pedido”, CSP `frame-ancestors 'self'`, Products/Customizations/Settings OK, sin pedidos/migraciones/Supabase. Android Chrome / PWA / iOS **UNVERIFIED — device unavailable** (P2). Pan/cursor gated `pointerType === "mouse"`. Estado: **READY WITH DEVICE QA DEBT**. Doc: `docs/admin-catalog-preview-final-qa-device-1.md`. Siguiente: **ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-HANDOFF-1** (o DEVICE-2). Sin código/deploy/commit/push.

### 2026-07-28 — ADMIN-CATALOG-PREVIEW-LAYOUT-FINAL-DEPLOY-1 — Controlled Deploy for Final Preview Layout Polish

- **Deploy / Admin Preview UX** ADMIN-CATALOG-PREVIEW-LAYOUT-FINAL-DEPLOY-1 completada. Commit `0dce5b3` (“Polish admin catalog preview layout”) en `main`: LAYOUT-QA-FIX-2 + WIDTH-PARITY-FIX-1. Push `origin/main`; prod LIVE (`shellMaxNone`, header in contentColumn, sin 1360). Paridad Products @1440 (container 1600, left 104). Smoke: clear-cart preview `[]` / public intactas, checkout “Confirmación deshabilitada”, público sin pan + “Enviar pedido”, customizations/settings OK, CSP `frame-ancestors 'self'`. Estado: **DEPLOYED WITH NON-BLOCKING QA DEBT**. Doc: `docs/admin-catalog-preview-layout-final-deploy-1.md`. Siguiente: **ADMIN-CATALOG-PREVIEW-FINAL-QA-DEVICE-1**. Sin migraciones/Supabase/pedidos.

### 2026-07-28 — ADMIN-CATALOG-PREVIEW-SHELL-WIDTH-PARITY-FIX-1 — Products Page Width Parity

- **Frontend / Admin Preview UX (layout-only)** ADMIN-CATALOG-PREVIEW-SHELL-WIDTH-PARITY-FIX-1 completada. Causa: `.shell { max-width: 1360px }` estrecho vs Products (`admin-shell__page-container:has(.admin-page-layout--operational)` → 1600px). Fix: shell `max-width: none; width: 100%`; gap desktop `clamp(48px, 6vw, 96px)`. Paridad @1440: container 1600, layout/shell 1289, header left 104. Phone centrado / header Δ0 / pad 16/16 / sticky OK. Estado: **PASS**. Doc: `docs/admin-catalog-preview-shell-width-parity-fix-1.md`. Siguiente: commit/push → **ADMIN-CATALOG-PREVIEW-FINAL-QA-DEVICE-1**. Sin commit/push/deploy ni DB/CSP/cookie/guard.

### 2026-07-28 — ADMIN-CATALOG-PREVIEW-SHELL-LAYOUT-QA-FIX-2 — Header Alignment & Left Column Width Polish

- **Frontend / Admin Preview UX (layout-only)** ADMIN-CATALOG-PREVIEW-SHELL-LAYOUT-QA-FIX-2 completada. `AdminPageHeader` vive en `.contentColumn` del grid (phone/header top Δ=0). Rail izquierdo `max-width: 560px`; eje izquierdo unificado; sin paddings que bajen el frame. Phone centrado en mitad derecha; sticky ≥1024; mobile una columna sin overflowX. Estado: **PASS**. Doc: `docs/admin-catalog-preview-shell-layout-qa-fix-2.md`. Siguiente: commit/push autorizado → **ADMIN-CATALOG-PREVIEW-FINAL-QA-DEVICE-1**. Sin commit/push/deploy ni DB/CSP/cookie/guard/mobile-feel.

### 2026-07-28 — ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-DEPLOY-1 — Controlled Deploy for Mobile Feel + Shell Polish

- **Deploy / Admin Preview UX** ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-DEPLOY-1 completada. Commit único `5843fd9` en `main` (touch-pan, mobile-feel, shell premium, layout QA fix + docs). Push `origin/main`; producción https://orderops.vercel.app LIVE (markers clear-cart + pan/cursor CSS). Smoke: preview shell, layout 1440 (Δ=0, pad 16/16), clear-cart preview keys `[]` / public intactas, checkout preview “Confirmación deshabilitada”, público sin pan/cursor + “Enviar pedido”, customizations/settings OK, CSP `frame-ancestors 'self'`. Estado: **DEPLOYED WITH NON-BLOCKING QA DEBT**. Doc: `docs/admin-catalog-preview-mobile-feel-deploy-1.md`. Siguiente: **ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-HANDOFF-1**. Sin migraciones/Supabase/pedidos.

### 2026-07-28 — ADMIN-CATALOG-PREVIEW-SHELL-LAYOUT-QA-FIX-1 — Two-Column Centering & Phone Frame Alignment

- **Frontend / Admin Preview UX (layout-only)** ADMIN-CATALOG-PREVIEW-SHELL-LAYOUT-QA-FIX-1 completada. Grid desktop `minmax(0,1fr) minmax(420px,1fr)` con phone centrado en mitad derecha; eliminados `justify-self:end` / `flex-end`. Phone frame envuelve viewport (padding simétrico; ancho definido 422 evita colapso intrinsic iframe ~300). Sticky ≥1024 centrado; mobile una columna sin overflowX. Shell `max-width: 1360px`. Estado: **PASS**. Doc: `docs/admin-catalog-preview-shell-layout-qa-fix-1.md`. Siguiente: **ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-DEPLOY-1**. Sin commit/push/deploy ni DB/CSP/cookie/guard/mobile-feel.

### 2026-07-28 — ADMIN-CATALOG-PREVIEW-SHELL-PREMIUM-POLISH-1 — Preview Shell UX Polish Before Deploy

- **Frontend / Admin Preview UX** ADMIN-CATALOG-PREVIEW-SHELL-PREMIUM-POLISH-1 completada. Shell premium sin panel izquierdo ni estado de carrito: acciones jerarquizadas, checklist, copy “Modo seguro activo”, phone sticky ≥1024, empty/loading/error, toasts `useAdminToast`, clear preview cart via `postMessage` same-origin (`ORDEROPS_PREVIEW_CLEAR_CART` + ACK + remount 1s). Vaciar refleja iframe 0; public keys intactas; checkout preview bloqueado. Clipboard success toast automation UNVERIFIED (P3). Estado: **PASS WITH NON-BLOCKING UX DEBT**. Doc: `docs/admin-catalog-preview-shell-premium-polish-1.md`. Siguiente pasó por **SHELL-LAYOUT-QA-FIX-1** antes de deploy. Sin commit/push/deploy ni DB/CSP/guard.

### 2026-07-28 — ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-AUTH-QA-1 — Authenticated Iframe QA for Mobile Feel

- **QA / Admin Preview UX (docs-only)** ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-AUTH-QA-1 completada. Sesión owner en `:3015`: `/admin/products/preview` iframe same-origin — cursor circular, momentum RAF (Δ≈−75), anti-selection, storage preview aislado, Vaciar limpia preview keys, checkout preview bloqueado (`Confirmación deshabilitada`, sin `create_order`). Público normal sin pan/cursor; checkout público “Enviar pedido”. Customizations + Settings catalogo smoke PASS. Estado: **READY WITH NON-BLOCKING QA DEBT** (device touch / cookie DevTools / pressed visual P3). Doc: `docs/admin-catalog-preview-mobile-feel-auth-qa-1.md`. Siguiente pasó por **SHELL-PREMIUM-POLISH-1** antes de deploy. Sin código, commit, push, deploy ni pedidos.

### 2026-07-28 — ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-POLISH-1 — Mobile Feel Implementation

- **Frontend / Admin Preview UX** ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-POLISH-1 completada. Momentum vertical (RAF + friction, caps velocity/duration) en `usePreviewPointerPanScroll`; cursor circular en `usePreviewTouchCursor` (`pointer-events: none`); scrollbar thin scoped a `html[data-preview-pan-enabled]`. Press feedback diferido. Solo `isCatalogPreview` + mouse. Public preview PASS; admin iframe UNVERIFIED. Resultado: **PASS WITH AUTH QA DEBT**. Doc: `docs/admin-catalog-preview-mobile-feel-polish-1.md`. Siguiente: **ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-AUTH-QA-1**. Sin commit/push/deploy ni tocar carrito/cookie/guard/CSP/DB.

### 2026-07-28 — ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-SPEC-1 — Mobile Feel UX Specification

- **Docs / Admin Preview UX** ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-SPEC-1 completada. Mobile Feel Spec cerrada: próximo polish debe implementar cursor circular + momentum vertical solo en preview/mouse. No tocar carrito/cookie/checkout/CSP/DB. Admin iframe QA obligatorio antes de deploy. Estado: **SPEC READY FOR IMPLEMENTATION**. Doc: `docs/admin-catalog-preview-mobile-feel-spec-1.md`. Siguiente: **ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-POLISH-1**. Sin código, commit, push, deploy ni pedidos.

### 2026-07-28 — ADMIN-CATALOG-PREVIEW-TOUCH-PAN-QA-FIX-1 — Prevent Text Selection During Preview Pan

- **Frontend / Admin Preview UX** ADMIN-CATALOG-PREVIEW-TOUCH-PAN-QA-FIX-1 completada. Fix selección de texto en mouse-pan: fases `candidate`/`active`, `html[data-preview-pan-state]`, `user-select: none` desde enabled, `selectstart`/`dragstart` prevent, `removeAllRanges`, `pointermove` non-passive + `preventDefault`. Selector interactivo omite `[role="button"]` para panear sobre texto/imagen de card sin romper botones reales. Público preview PASS (sin selección / sin drag fantasma); admin iframe UNVERIFIED. Resultado: **PASS WITH PUBLIC QA ONLY**. Doc: `docs/admin-catalog-preview-touch-pan-qa-fix-1.md`. Deploy bloqueado hasta auth smoke. Siguiente tras PASS: **ADMIN-CATALOG-PREVIEW-TOUCH-PAN-DEPLOY-1**. Sin commit/push/deploy ni tocar carrito/cookie/guard/CSP/DB.

### 2026-07-27 — ADMIN-CATALOG-PREVIEW-TOUCH-PAN-POLISH-1 — Mouse Drag Touch-Scroll Polish

- **Frontend / Admin Preview UX** ADMIN-CATALOG-PREVIEW-TOUCH-PAN-POLISH-1 completada. Hook `usePreviewPointerPanScroll` en CatalogClient: solo `isCatalogPreview` + mouse; threshold 8px; scroll vertical vía `scrollingElement`; ignore interactivos/overlays (`data-preview-pan-ignore`). Cursor grab/grabbing en module CSS. Público/touch/cookie/guard/CSP/DB intactos. Resultado: **PASS WITH AUTH QA DEBT**. Doc: `docs/admin-catalog-preview-touch-pan-polish-1.md`. Siguiente pasó a **ADMIN-CATALOG-PREVIEW-TOUCH-PAN-QA-FIX-1** (selección de texto bloqueó deploy). Sin commit/push/deploy ni pedidos.

### 2026-07-27 — ADMIN-CATALOG-PREVIEW-HANDOFF-1 — Final Technical & Product Handoff

- **Handoff / Admin Preview (docs-only)** ADMIN-CATALOG-PREVIEW-HANDOFF-1 completada. Cierre formal de Vista previa del catálogo: `/admin/products/preview`, iframe same-origin, carrito `orderops-preview-cart*`, checkout bloqueado UI+server, cookie `orderops-admin-catalog-preview` Max-Age 300 + clear al vaciar, CSP `frame-ancestors 'self'`, CTA dual Productos. Commits `c4b3e18` / `84c0c48`. Deploy https://orderops.vercel.app. Estado: **FEATURE CLOSED — DEPLOYED WITH NON-BLOCKING QA DEBT**. Deuda P2/P3 (auth DevTools, iframe refresh, device/PWA). Rollback: `git revert c4b3e18`. Opcionales: TOUCH-PAN / AUTH-SMOKE / RESPONSIVE / DEVICE. Doc: `docs/admin-catalog-preview-handoff-1.md`. Sin código, deploy, rollback ni pedidos.

### 2026-07-27 — ADMIN-CATALOG-PREVIEW-DEPLOY-1 — Controlled Deploy & Production Smoke

- **Deploy / Admin Preview** ADMIN-CATALOG-PREVIEW-DEPLOY-1 completada. Commit `c4b3e18` (*Add safe admin catalog preview*) pushed a `main`; producción https://orderops.vercel.app con CSP `frame-ancestors 'self'`. Smoke: preview cart aislado; checkout preview bloqueado; público “Enviar pedido”; admin auth/cookie DevTools UNVERIFIED. Estado: **DEPLOYED WITH NON-BLOCKING QA DEBT**. Doc: `docs/admin-catalog-preview-deploy-1.md`. Siguiente: **ADMIN-CATALOG-PREVIEW-HANDOFF-1**. Sin DB/RLS/RPC/pedidos/rollback.

### 2026-07-27 — ADMIN-CATALOG-PREVIEW-RE-QA-1 — Authenticated Re-QA After Cookie Polish

- **QA / Admin Preview (docs-only)** ADMIN-CATALOG-PREVIEW-RE-QA-1 completada. Source: Max-Age 300, clear cookie tenant-safe, vaciar limpia preview keys. Runtime `:3012`: preview cart aislado; checkout preview con mensaje + “Confirmación deshabilitada”; público normal “Enviar pedido” sin bloqueo preview; CSP `frame-ancestors 'self'`. Admin autenticado / cookie DevTools / clear al vaciar UNVERIFIED. Estado: **READY WITH NON-BLOCKING QA DEBT**. Doc: `docs/admin-catalog-preview-re-qa-1.md`. Siguiente: **ADMIN-CATALOG-PREVIEW-DEPLOY-1**. Sin código, commit, push, deploy ni pedidos.

### 2026-07-27 — ADMIN-CATALOG-PREVIEW-COOKIE-POLISH-1 — Preview Cookie Lifetime & Cleanup Polish

- **Frontend / Admin Preview** ADMIN-CATALOG-PREVIEW-COOKIE-POLISH-1 completada. Cookie `orderops-admin-catalog-preview`: Max-Age **300** (antes 3600); clear vía `clearCatalogPreviewCookieAction` (manageProducts + tenant match, path `/b/{slug}`, maxAge 0). “Vaciar carrito de prueba” limpia `orderops-preview-cart*` y expira cookie; no toca carrito público. Checkout guard intacto (`shouldBlockCatalogPreviewOrder` + UI). Resultado: **PASS WITH AUTH QA DEBT**. Doc: `docs/admin-catalog-preview-cookie-polish-1.md`. Siguiente: **ADMIN-CATALOG-PREVIEW-RE-QA-1**. Sin commit/push/deploy ni pedidos.

### 2026-07-27 — ADMIN-CATALOG-PREVIEW-QA-1 — Authenticated Browser QA & Release Readiness

- **QA / Admin Preview (docs-only)** ADMIN-CATALOG-PREVIEW-QA-1 completada. Source QA y CSP `frame-ancestors 'self'` PASS. Runtime en `:3011` con `?orderopsPreview=1`: carrito aislado confirmado (preview keys cambian; public keys intactas); checkout muestra bloqueo y botón “Confirmación deshabilitada”; sin create_order/success/pedidos. Admin `/admin/products/preview` UNVERIFIED sin credenciales. Cookie preview Max-Age 1h = **P1** (bloquea pedidos del admin en mismo browser bajo `/b/{slug}`; no afecta customers anónimos). Estado: **READY AFTER COOKIE POLISH**. Doc: `docs/admin-catalog-preview-qa-1.md`. Siguiente: **ADMIN-CATALOG-PREVIEW-COOKIE-POLISH-1**. Sin código, commit, push, deploy ni pedidos.

### 2026-07-27 — ADMIN-CATALOG-PREVIEW-IMPL-SAFE-V1-1 — Implementación segura V1

- **Frontend / Admin Preview** ADMIN-CATALOG-PREVIEW-IMPL-SAFE-V1-1 completada. Ruta `/admin/products/preview` con permiso `manageProducts`, iframe same-origin del catálogo, cookie httpOnly `orderops-admin-catalog-preview` (armado via Server Action antes del iframe), carrito aislado `orderops-preview-cart*` / `orderops-preview-cart-v2*`, checkout con submit bloqueado UI+server antes de `create_order`, CTA Productos dual (Vista previa + Copiar link), CSP `frame-ancestors 'self'` en `next.config.ts`. Sin success, sin RPC SQL, sin DB/RLS, sin Settings/Presence, sin sidebar. Resultado: **PASS WITH DEBT** (QA autenticado pendiente; cookie 1h puede bloquear pedidos reales en el mismo browser). Doc: `docs/admin-catalog-preview-impl-safe-v1-1.md`. Siguiente: **ADMIN-CATALOG-PREVIEW-QA-1**. Sin commit/push/deploy.

### 2026-07-27 — ADMIN-CATALOG-PREVIEW-SPEC-CLOSURE-1 — Product & Technical Spec Closure

- **Spec / Admin Preview (docs-only)** ADMIN-CATALOG-PREVIEW-SPEC-CLOSURE-1 completada. Decisiones de producto cerradas para la Vista previa del catálogo: ruta `/admin/products/preview`, permiso `manageProducts`, iframe same-origin del catálogo real, carrito aislado `orderops-preview-cart*` / `orderops-preview-cart-v2*`, checkout visual con bloqueo UI+server de `create_order`, sin success, CTA Productos dual (Vista previa + Copiar link), CSP `frame-ancestors 'self'`, preview mode verificable server-side (no solo query/slug client). Diferenciada de “Vista previa del cliente” (Product Customization). Estado: **PRODUCT SPEC DECISIONS CLOSED · READY FOR IMPLEMENTATION**. Doc: `docs/admin-catalog-preview-spec-closure-1.md`. Siguiente: fases IMPL (foundation / isolated-cart / checkout-guard) a decisión del usuario. Sin código, commit, push, deploy ni pedidos.

### 2026-07-26 — ADMIN-CATALOG-PREVIEW-AUDIT-1 — Forensic Architecture & Product Audit

- **Audit / Admin Preview (docs-only)** ADMIN-CATALOG-PREVIEW-AUDIT-1 completada. Propósito de la feature futura: vista previa móvil del catálogo público para administradores (hipótesis iframe same-origin). Estado: **READY WITH TECHNICAL CONDITIONS**. Invariantes: auth admin en `(protected)` layout (no middleware); slug desde `businessId`/join (nullable); catálogo en `/b/[slug]/catalogo`; carrito `orderops-cart` + `orderops-cart-v2` por `businessId` compartido same-origin; checkout → `create_order` real sin `preview_mode`; sin XFO/CSP framing en repo/prod; PWA scope `/admin` (iframe preserva shell; top-level `/b` lo abandona). Riesgos P0: pedidos reales, contaminación carrito, slug client-trust, framing abierto. Decisión pendiente: Product Owner (P0 pedidos/carrito/permiso/ubicación CTA/headers). Doc: `docs/admin-catalog-preview-audit-1-forensic-architecture.md`. Siguiente: **ADMIN-CATALOG-PREVIEW-SPEC-CLOSURE-1**. Sin código, commit, push, deploy ni pedidos.

### 2026-07-24 — ADMIN-PWA-ICON-CONSISTENCY-1 — Admin PWA icon web branding consistency

- **Frontend / Admin PWA** ADMIN-PWA-ICON-CONSISTENCY-1 completada. Se alinearon los iconos instalables del admin con la marca web en `public/icon.png` (anillos OO de pestaña), eliminando el fallback del generador que dibujaba wordmark **Ops** sobre panel índigo. El script `generate-admin-pwa-icons.mjs` ahora compone PNG desde la fuente 192×192 con upscale a 512 (deuda de resolución de fuente). `name`/`short_name` OrderOps y `start_url`/`scope`/`id` `/admin` sin cambio. Sin SW/offline. Sin cambios auth/admin/catalog/cart/checkout/pricing/stock/DB/RLS/actions/pedidos. Resultado: **PASS WITH ICON SOURCE RESOLUTION AND DEVICE QA DEBT**.
- Archivos: `scripts/generate-admin-pwa-icons.mjs`, `public/icons/orderops-admin-*.png`, `docs/admin-pwa-icon-consistency-1-real-branding.md`, `docs/CURRENT_PHASE.md`, `ORDEROPS_LIVING_MEMORY.md`.

### 2026-07-19 â€” PRODUCT-CUSTOMIZATION-ADMIN-HIERARCHY-POLISH-1 â€” Product & Category Hierarchy Premium Polish

- **Frontend / Admin UX** PRODUCT-CUSTOMIZATION-ADMIN-HIERARCHY-POLISH-1 ejecutada. Se puliÃ³ la jerarquÃ­a visual de Por producto y Por categorÃ­a dentro del admin de Product Customization, mejorando headers, agrupaciÃ³n de informaciÃ³n, empty states, presentaciÃ³n de excepciones y consistencia con las tabs compactas. No se modificÃ³ DB, RLS, actions, preview mapper, checkout, cart, stock ni pedidos. Resultado: **PASS WITH HIERARCHY DEBT**.
- Archivos: `owner-customization-builder.tsx`, `product-customization-overrides-panel.tsx`, `customization-assignments-section.tsx`, `admin-customization-live-preview.tsx`, `product-customization-admin.module.css`, `page.tsx`, docs de fase; commit `a16de09`.

### 2026-07-19 â€” PRODUCT-CUSTOMIZATION-ADMIN-COPY-POLISH-1 â€” Owner-Friendly Premium Copy Polish

- **Frontend / Admin UX** PRODUCT-CUSTOMIZATION-ADMIN-COPY-POLISH-1 ejecutada. Se puliÃ³ el lenguaje owner-facing del admin de Product Customization para acercarlo a un estÃ¡ndar SaaS premium. Se reemplazaron tÃ©rminos tÃ©cnicos o ambiguos como â€œDesactivarâ€, â€œPreviewâ€, â€œHerenciaâ€, â€œOrigenâ€, â€œMin/Maxâ€ y referencias internas por copy mÃ¡s claro y orientado al dueÃ±o del negocio. No se modificÃ³ DB, RLS, actions, checkout, cart, stock ni pedidos. Resultado: **PASS**.
- Archivos: componentes `components/admin/product-customization/*` (strings UI), `page.tsx` description, docs de fase; commit `40d4cd1`.

### 2026-07-19 â€” PRODUCT-CUSTOMIZATION-ADMIN-V1-POLISH-MONITOR-1 â€” Enterprise Premium QA & UX/UI Polish Audit

- **QA / Admin UX** PRODUCT-CUSTOMIZATION-ADMIN-V1-POLISH-MONITOR-1 ejecutada. Se realizÃ³ una auditorÃ­a premium del mÃ³dulo admin de Product Customization V1, evaluando funcionalidad, copy, jerarquÃ­a, UX/UI, intuitividad, responsive, accesibilidad bÃ¡sica, preview admin y catÃ¡logo pÃºblico. No se modificÃ³ runtime ni lÃ³gica operativa. Se generÃ³ un backlog priorizado para llevar la experiencia a estÃ¡ndar enterprise. Resultado: **NEEDS POLISH** (Enterprise Readiness 3.1/5; P1 en categorÃ­a vs producto, copy â€œDesactivarâ€, inconsistencia compact vs dense, mobile width, excepciones vÃ­a query).
- Archivos: `docs/product-customization-admin-v1-polish-monitor-1-premium-qa.md`, `docs/CURRENT_PHASE.md` (sin cambios runtime)

### 2026-07-19 â€” PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-CLEANUP-1 â€” Plus Suggestions Legacy Cleanup

- **Frontend / Admin UX** PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-CLEANUP-1 ejecutada. Se limpiÃ³ deuda tÃ©cnica posterior a la compactaciÃ³n de Plus sugeridos, eliminando el componente legacy/imports/CSS obsoletos del flujo inline anterior donde fue seguro hacerlo. La UI compacta, Secciones reutilizables, preview admin, tabs restantes y catÃ¡logo pÃºblico se mantienen operativos sin tocar DB, RLS, checkout, cart, stock ni pedidos. Resultado: **PASS**.
- Archivos eliminados: `upsell-groups-section.tsx`; CSS huÃ©rfano `.plusWorkspace` / `.optionsSection`; docs de fase; commit `6b0e153`

### 2026-07-18 â€” PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-COMPACT-1 â€” Compact Plus Suggestions UI

- **Frontend / Admin UX** PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-COMPACT-1 ejecutada. Se compactÃ³ la pestaÃ±a Plus sugeridos del admin de Product Customization. La pantalla principal ahora usa cards resumidas, menÃº de acciones y modales para editar ventas sugeridas/productos sugeridos, reduciendo scroll y mejorando comprensiÃ³n comercial para el dueÃ±o del negocio. La fase reutilizÃ³ actions existentes y no modificÃ³ DB, RLS, checkout, cart, stock ni pedidos. Resultado: **PASS**.
- Archivos: `components/admin/product-customization/plus-suggestions/*`, `owner-customization-builder.tsx`, docs de fase; commit `a2a9b26`

### 2026-07-18 â€” PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-UX-SPEC-1 â€” Plus Suggestions Compact UX Specification

- **Spec / Admin UX** PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-UX-SPEC-1 ejecutada. Se diseÃ±Ã³ la compactaciÃ³n de la pestaÃ±a Plus sugeridos dentro del admin de Product Customization. La propuesta reemplaza formularios inline largos por cards compactas, menÃºs de tres puntos y modales para editar ventas sugeridas y gestionar productos sugeridos, reutilizando actions existentes y alineÃ¡ndose al patrÃ³n de Secciones reutilizables. Resultado: **PASS**.
- Archivos: `docs/product-customization-plus-suggestions-ux-spec-1-compact-plus-suggestions.md`, `docs/CURRENT_PHASE.md` (sin cambios runtime)

### 2026-07-18 â€” PRODUCT-CUSTOMIZATION-REUSABLE-SECTIONS-CLEANUP-1 â€” Reusable Sections Legacy Cleanup

- **Frontend / Admin UX** PRODUCT-CUSTOMIZATION-REUSABLE-SECTIONS-CLEANUP-1 ejecutada. Se limpiÃ³ deuda tÃ©cnica posterior a la compactaciÃ³n de Secciones reutilizables, eliminando componentes legacy/imports/CSS obsoletos del flujo inline anterior donde fue seguro hacerlo. La UI compacta, preview admin, tabs restantes y catÃ¡logo pÃºblico se mantienen operativos sin tocar DB, RLS, checkout, cart, stock ni pedidos. Resultado: **PASS**.
- Archivos eliminados: `create-group-form.tsx`, `customization-group-card.tsx`, `sortable-groups-list.tsx`; CSS huÃ©rfano en `product-customization-admin.module.css`; docs de fase; commit `5819460`

### 2026-07-18 â€” PRODUCT-CUSTOMIZATION-REUSABLE-SECTIONS-COMPACT-1 â€” Compact Reusable Sections UI

- **Frontend / Admin UX** PRODUCT-CUSTOMIZATION-REUSABLE-SECTIONS-COMPACT-1 ejecutada. Se compactÃ³ la pestaÃ±a Secciones reutilizables del admin de Product Customization. La pantalla principal ahora usa cards resumidas, menÃº de acciones y modales para editar secciones/opciones, reduciendo scroll y mejorando comprensiÃ³n para el dueÃ±o del negocio. La fase reutilizÃ³ actions existentes y no modificÃ³ DB, RLS, checkout, cart, stock ni pedidos. Resultado: **PASS**.
- Archivos: `components/admin/product-customization/reusable-sections/*`, `owner-customization-builder.tsx`, docs de fase; commit `a124459`

### 2026-07-18 â€” PRODUCT-CUSTOMIZATION-REUSABLE-SECTIONS-UX-SPEC-1 â€” Reusable Sections Compact UX Specification

- **Spec / Admin UX** PRODUCT-CUSTOMIZATION-REUSABLE-SECTIONS-UX-SPEC-1 ejecutada. Se diseÃ±Ã³ la compactaciÃ³n de la pestaÃ±a Secciones reutilizables dentro del admin de Product Customization. La propuesta reemplaza formularios inline largos por cards compactas, menÃºs de tres puntos y modales de ediciÃ³n para secciones/opciones, manteniendo la lÃ³gica existente y priorizando comprensiÃ³n para el dueÃ±o del negocio. Resultado: **PASS**.
- Archivos: `docs/product-customization-reusable-sections-ux-spec-1-compact-reusable-sections.md`, `docs/CURRENT_PHASE.md` (sin cambios runtime)

### 2026-07-18 â€” PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-OVERRIDES-1 â€” Admin Preview Product Overrides Fidelity

- **Frontend / Admin UX** PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-OVERRIDES-1 ejecutada. La preview interactiva del admin ahora respeta las excepciones del producto seleccionado, ocultando grupos u opciones desactivadas por override y manteniendo grupos propios/product-specific. La fase ajustÃ³ el mapper/admin read model sin tocar checkout, carrito, pedidos, stock, RLS ni schema. Resultado: **PASS WITH DATA QA DEBT**.
- Archivos: `admin.ts` (load overrides), `admin-preview-mapper.ts`, `preview-selection.ts` (prune), live preview + builder + page, docs de fase; commit `dee486a`

### 2026-07-17 â€” PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-CLEANUP-1 â€” Admin Preview Dead Code & Wiring Cleanup

- **Frontend / Admin UX** PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-CLEANUP-1 ejecutada. Se limpiÃ³ deuda tÃ©cnica de la preview admin anterior de Product Customization, eliminando cÃ³digo muerto/imports/CSS obsoleto donde correspondÃ­a. La preview sandbox interactiva y el modal pÃºblico se mantienen operativos sin tocar DB, RLS, checkout, cart, stock ni pedidos. Resultado: **PASS**.
- Archivos: eliminado `customer-preview-panel.tsx`; CSS placeholder huÃ©rfano en `product-customization-admin.module.css`; docs de fase; commits `34b0b55` / `c93d9fc`

### 2026-07-17 â€” PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-POLISH-1 â€” Interactive Admin Preview Sandbox

- **Frontend / Admin UX** PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-POLISH-1 ejecutada. Se implementÃ³ una preview interactiva sandbox en `/admin/products/customizations`. La preview reutiliza componentes presentacionales del modal pÃºblico, permite probar selecciÃ³n single/multi y plus/adicionales, recalcula total estimado localmente y no toca carrito, checkout, localStorage, DB, RLS, pedidos ni stock. Resultado: **PASS**.
- Archivos: `components/product-customization/shared/*`, `admin-customization-live-preview.tsx`, `admin-preview-mapper.ts`, `preview-selection.ts`, `customization-modal.tsx`, docs de fase

### 2026-07-17 â€” PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-SPEC-1 â€” Interactive Admin Preview Architecture Spec

- **Spec / Admin UX** PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-SPEC-1 ejecutada. Se definiÃ³ la arquitectura para convertir la preview admin de Product Customization en una vista interactiva y realista del modal pÃºblico. La recomendaciÃ³n es extraer componentes presentacionales compartidos y usar estado local sandbox en admin, sin importar el modal completo ni arrastrar carrito, checkout, localStorage o side effects. Resultado: **PASS**.
- Archivos: `docs/product-customization-admin-preview-spec-1-interactive-admin-preview-architecture.md`, `docs/CURRENT_PHASE.md` (sin cambios runtime)

### 2026-07-17 â€” PRODUCT-CUSTOMIZATION-ADMIN-BUTTON-THEME-POLISH-1 â€” Admin Customizations Button Theme Polish

- **Frontend / Admin UX** PRODUCT-CUSTOMIZATION-ADMIN-BUTTON-THEME-POLISH-1 ejecutada. Se pulieron los botones y controles interactivos de `/admin/products/customizations` para alinearlos con los tokens de theme del admin. La fase mejorÃ³ primary, secondary, disabled, hover y focus states en dark/light sin tocar lÃ³gica de Product Customization, DB, RLS, checkout, stock ni pedidos. Resultado: **PASS**.
- Archivos: `product-customization-admin.module.css`, `owner-customization-builder.tsx` (className), `docs/product-customization-admin-button-theme-polish-1-button-theme-polish.md`, `docs/CURRENT_PHASE.md`

### 2026-07-17 â€” PRODUCT-CUSTOMIZATION-ADMIN-VISUAL-POLISH-1 â€” Admin Customizations Layout & Theme Polish

- **Frontend / Admin UX** PRODUCT-CUSTOMIZATION-ADMIN-VISUAL-POLISH-1 ejecutada. Se puliÃ³ visualmente la pantalla `/admin/products/customizations` para alinearla con el shell admin actual. La fase ajustÃ³ layout, ancho disponible, tabs, cards y tokens de theme sin modificar lÃ³gica de Product Customization, checkout, stock, RLS, DB ni pedidos. Resultado: **PASS**.
- Archivos: `app/admin/(protected)/products/customizations/page.tsx`, `components/admin/product-customization/product-customization-admin.module.css`, `docs/product-customization-admin-visual-polish-1-layout-theme-polish.md`, `docs/CURRENT_PHASE.md`

### 2026-07-17 â€” PRODUCT-CUSTOMIZATION-FLAG-OFF-RLS-FIXTURE-QA-1 â€” Flag OFF Corpus Fixture Negative QA

- **QA / RLS fixture** PRODUCT-CUSTOMIZATION-FLAG-OFF-RLS-FIXTURE-QA-1 ejecutada. Se creÃ³/validÃ³ un fixture no piloto (`qa-rls-flag-off-customization`) con product_customization_enabled=false y corpus real de Product Customization/Plus. La prueba confirmÃ³ que las filas existen para lectura privilegiada, pero anon no puede leer el corpus cuando el flag estÃ¡ OFF, mientras el piloto flag ON sigue exponiendo su corpus pÃºblico esperado. No se modificÃ³ cÃ³digo, RLS, schema, pedidos, stock, flags del piloto ni se hizo deploy. Fixture KEEP. Resultado: **PASS**.

### 2026-07-17 â€” PRODUCT-CUSTOMIZATION-FLAG-OFF-RLS-QA-1 â€” Flag OFF Public RLS Negative QA

- **QA / RLS** PRODUCT-CUSTOMIZATION-FLAG-OFF-RLS-QA-1 ejecutada. Se validÃ³ el comportamiento negativo del hardening RLS pÃºblico: con product_customization_enabled=false el corpus pÃºblico de Product Customization/Plus no debe exponerse para anon, mientras el piloto flag ON continÃºa funcionando. La prueba no modificÃ³ cÃ³digo, schema, flags, stock, pedidos ni realizÃ³ deploys. Sin tenant flag OFF con corpus real â†’ **PASS WITH FIXTURE DEBT**.

### 2026-07-17 â€” PRODUCT-CUSTOMIZATION-PILOT-MONITOR-2 â€” Plus UI + Stock + Public RLS Live Monitoring

- **Ops / Pilot** PRODUCT-CUSTOMIZATION-PILOT-MONITOR-2 ejecutada. Se monitoreÃ³ el piloto live despuÃ©s de Plus UI, copy polish, stock/restock y public RLS hardening. El monitoreo validÃ³ catÃ¡logo, modal, Plus Bebidas, carrito/checkout, dashboard, stock Coca, stock_movements y lectura anon del corpus pÃºblico sin realizar writes ni deploys. Resultado: **PASS**.

### 2026-07-17 â€” PRODUCT-CUSTOMIZATION-PUBLIC-RLS-HARDENING-1 â€” Public Customization Corpus RLS Hardening

- **RLS / Public read model** PRODUCT-CUSTOMIZATION-PUBLIC-RLS-HARDENING-1 ejecutada. Se endureciÃ³ el acceso pÃºblico al corpus de Product Customization / Plus UI. Las policies pÃºblicas ya no dependen de que anon lea business_settings directamente, sino de un helper SECURITY DEFINER que expone Ãºnicamente si Product Customization estÃ¡ habilitado para el tenant. El catÃ¡logo pÃºblico mantiene Plus Bebidas funcionando sin abrir settings internos ni tocar checkout, inventario, stock_movements o RPCs. Migration `20260717170000_product_customization_public_rls_hardening_1.sql`. Resultado: **PASS**.

### 2026-07-17 â€” PRODUCT-CUSTOMIZATION-PLUS-COPY-POLISH-1 â€” Customer-facing Plus Copy Alignment

- **Frontend** PRODUCT-CUSTOMIZATION-PLUS-COPY-POLISH-1 ejecutada. Se alineÃ³ el copy pÃºblico de la secciÃ³n Plus/Bebidas para que el cliente entienda la venta sugerida como una bebida adicional al pedido. No se modificÃ³ la lÃ³gica de checkout, inventario, stock_movements, RPC, schema ni configuraciÃ³n de productos. Resultado: **PASS**.
- Archivos: `lib/product-customization/upsell-copy.ts`, `customization-modal.tsx`, `cart-sheet.tsx`, `checkout-client.tsx`, `docs/product-customization-plus-copy-polish-1-customer-facing-plus-copy-alignment.md`, `docs/CURRENT_PHASE.md`
- PrÃ³xima: opcional hardening RLS public Â· monitor piloto

### 2026-07-17 â€” PRODUCT-CUSTOMIZATION-PLUS-UI-DEPLOY-1 â€” Deploy Plus Suggestions UI

- **Frontend/Deploy** PRODUCT-CUSTOMIZATION-PLUS-UI-DEPLOY-1 ejecutada. Se desplegÃ³ el WIP de Plus UI para Product Customization, habilitando Plus Bebidas en el modal pÃºblico del producto. Se validÃ³ que Coca Cola 500ml se agrega como upsell asociado al producto padre, que checkout crea parent + child item, que stock tracked se descuenta y que cancelar desde admin devuelve stock vÃ­a stock_movements. Fix crÃ­tico: public read model usa service role porque las policies public de customization/upsell dependen de `business_settings` no legible por anon. Resultado: **PASS**.
- Archivos: `lib/product-customization/public.ts`, commits `a284a23` + `d1b8e7f`, `docs/product-customization-plus-ui-deploy-1-deploy-plus-suggestions-ui.md`, `docs/CURRENT_PHASE.md`
- QA: `#76D4` `8508feb5-â€¦` Doble Smash + Coca upsell Â· Coca 4â†’3â†’4 Â· decrement+restock idempotente
- PrÃ³xima: opcional hardening RLS public Â· copy Plus Â· monitor piloto

### 2026-07-17 â€” PRODUCT-STOCK-QA-ORDER-CLEANUP-1 â€” Controlled QA Orders Cleanup

- **Ops** PRODUCT-STOCK-QA-ORDER-CLEANUP-1 ejecutada. Se limpiaron pedidos QA pendientes mediante cancelaciÃ³n controlada, sin eliminar pedidos ni order_items. El cleanup respetÃ³ el contrato de stock: solo pedidos con order_decrement pueden restockear automÃ¡ticamente; pedidos pre-ledger como #9632 no reciben restock retroactivo. No se modificaron cÃ³digo, schema, productos, flags ni sesiÃ³n. Resultado: **PASS WITH DEBT** (1 Coca histÃ³rica pre-ledger documentada).
- Archivos: `docs/product-stock-qa-order-cleanup-1-controlled-qa-orders-cleanup.md`, `docs/CURRENT_PHASE.md`
- QA: `#9632` + `#9B25` cancelled vÃ­a UI Â· Coca stock=4 Â· pending QA=0 Â· dashboard limpio
- PrÃ³xima: opcional reconciliaciÃ³n manual pre-ledger (auth) Â· deploy WIP customization

### 2026-07-16 â€” PRODUCT-STOCK-MOVEMENTS-SCHEMA-1 â€” Stock Movements Ledger & Idempotency Schema

- **Schema** PRODUCT-STOCK-MOVEMENTS-SCHEMA-1 ejecutada. Se creÃ³ la base de ledger public.stock_movements para movimientos de inventario, con constraints de integridad, Ã­ndices de consulta e Ã­ndices Ãºnicos parciales para evitar doble order_decrement/order_restock por order_item. La tabla queda preparada para fases futuras de decrement ledger y restock idempotente. No se modificaron create_order, updateOrderStatusAction, stock, productos, pedidos, flags ni sesiÃ³n. Resultado: **PASS**.
- Archivos: `supabase/migrations/20260717120000_product_stock_movements_schema_1.sql`, `types/database.ts`, `docs/product-stock-movements-schema-1-stock-movements-ledger-idempotency-schema.md`
- PrÃ³xima: PRODUCT-STOCK-DECREMENT-LEDGER-1 â†’ RESTOCK-CANCEL-1

### 2026-07-16 â€” PRODUCT-STOCK-RESTOCK-DESIGN-1 â€” Cancel Restock Contract & Idempotency

- **Ops/Design** PRODUCT-STOCK-RESTOCK-DESIGN-1 ejecutada. Se diseÃ±Ã³ el contrato de devoluciÃ³n de stock al cancelar pedidos. La recomendaciÃ³n es no modificar updateOrderStatusAction directamente todavÃ­a, sino introducir un ledger stock_movements con constraints de idempotencia y luego implementar restock transaccional solo para items con decremento registrado. Los pedidos histÃ³ricos y QA actuales no deben recibir restock automÃ¡tico retroactivo. Resultado: **PASS**.
- Archivos: `docs/product-stock-restock-design-1-cancel-restock-contract-idempotency.md`, `docs/CURRENT_PHASE.md`
- PrÃ³xima: PRODUCT-STOCK-MOVEMENTS-SCHEMA-1 â†’ DECREMENT-LEDGER-1 â†’ RESTOCK-CANCEL-1 â†’ RESTOCK-QA / QA-CLEANUP

### 2026-07-16 â€” PRODUCT-STOCK-DECREMENT-ORDER-1 â€” Transactional Stock Consumption in create_order

- **RPC** PRODUCT-STOCK-DECREMENT-ORDER-1 ejecutada. Se actualizÃ³ create_order para validar y descontar stock transaccionalmente solo en productos con track_stock=true. La lÃ³gica agrupa cantidades por product_id, incluye productos normales y upsell child items, usa bloqueo transaccional y evita stock negativo. Productos legacy con track_stock=false conservan comportamiento anterior. Restock en cancelaciÃ³n queda fuera de scope. Resultado: **PASS**.
- Archivos: `supabase/migrations/20260717010500_product_stock_decrement_order_1.sql`, checkout/admin `mapCreateOrderRpcError`, `docs/product-stock-decrement-order-1-transactional-stock-consumption-create-order.md`
- QA: Coca Cola 5â†’4 (`f34118c6-â€¦`); legacy ClÃ¡sica sin descuento (`d2489663-â€¦`); insufficient qty 99 sin order
- PrÃ³xima: PRODUCT-STOCK-RESTOCK-CANCEL-1 / STOCK-MOVEMENTS

### 2026-07-16 â€” PRODUCT-STOCK-ADMIN-UX-1 â€” Stock Tracking Controls in Product Admin

- **Admin UX** PRODUCT-STOCK-ADMIN-UX-1 ejecutada. Se agregÃ³ al admin de productos el control â€œControlar stock automÃ¡ticamenteâ€, conectado a products.track_stock. El comportamiento legacy se mantiene: create_order todavÃ­a no descuenta stock y los productos existentes siguen sin tracking salvo cambios explÃ­citos. No se tocaron schema, triggers, pedidos, flags ni sesiÃ³n. Resultado: **PASS**.
- Archivos: `create-product-form.tsx`, `edit-product-form.tsx`, `product-form.module.css`, `products/actions.ts`, `lib/products/admin.ts`, `docs/product-stock-admin-ux-1-stock-tracking-controls-product-admin.md`, `docs/CURRENT_PHASE.md`
- QA write: Coca Cola 500ml `track_stock=true` (autorizado)
- PrÃ³xima: PRODUCT-STOCK-DECREMENT-ORDER-1

### 2026-07-16 â€” PRODUCT-STOCK-TRACKING-SCHEMA-1 â€” Add Product Stock Tracking Flag

- **Schema** PRODUCT-STOCK-TRACKING-SCHEMA-1 ejecutada. Se agregÃ³ la base de schema para inventario hÃ­brido mediante products.track_stock boolean NOT NULL DEFAULT false. Los productos existentes conservan comportamiento legacy con tracking apagado. No se modificÃ³ create_order, stock, availability, pedidos, flags, sesiÃ³n ni lÃ³gica runtime. Resultado: **PASS**.
- Archivos: `supabase/migrations/20260716224005_product_stock_tracking_schema_1.sql`, `types/database.ts`, `docs/product-stock-tracking-schema-1-add-product-track-stock-flag.md`, `docs/CURRENT_PHASE.md`
- PrÃ³xima: PRODUCT-STOCK-ADMIN-UX-1

### 2026-07-16 â€” PRODUCT-STOCK-DECREMENT-DESIGN-1 â€” Inventory Consumption Contract

- **Ops/Design** PRODUCT-STOCK-DECREMENT-DESIGN-1 ejecutada. Se diseÃ±Ã³ el contrato de consumo de inventario para OrderOps. La recomendaciÃ³n es un modelo hÃ­brido con track_stock por producto: productos sin tracking siguen usando disponibilidad manual; productos con tracking validan y descuentan stock transaccionalmente en create_order, incluyendo products y upsell child items. Restock en cancelaciones queda para una fase posterior con diseÃ±o de idempotencia/ledger. No se tocaron cÃ³digo, schema, stock, pedidos, flags ni sesiÃ³n. Resultado: **PASS**.
- Archivos: `docs/product-stock-decrement-design-1-inventory-consumption-contract.md`, `docs/CURRENT_PHASE.md`
- PrÃ³xima: PRODUCT-STOCK-TRACKING-SCHEMA-1 â†’ ADMIN-UX â†’ DECREMENT-ORDER â†’ QA

### 2026-07-16 â€” PRODUCT-STOCK-DECREMENT-AUDIT-1 â€” Order Stock Consumption For Product/Upsell Items

- **Ops/QA** PRODUCT-STOCK-DECREMENT-AUDIT-1 ejecutada. Se auditÃ³ el modelo de stock/inventario para pedidos normales y upsell child items usando como evidencia el pedido QA #8C2F. La fase fue read-only: no se tocaron cÃ³digo, schema, stock, productos, pedidos, flags ni sesiÃ³n. Se documentÃ³ si create_order consume stock o no, cÃ³mo interactÃºa products.stock con availability y cuÃ¡l deberÃ­a ser la fase posterior de diseÃ±o/fix. HipÃ³tesis: **H1** (stock manual + trigger availability; sin consumo en create_order/cancel). Resultado: **PASS WITH DEBT**.
- Archivos: `docs/product-stock-decrement-audit-1-order-stock-consumption-product-upsell-items.md`, `docs/CURRENT_PHASE.md`

### 2026-07-16 â€” PRODUCT-CUSTOMIZATION-QA-ORDER-CLEANUP-1 â€” Cancel QA Orders Safely

- **Ops/QA** PRODUCT-CUSTOMIZATION-QA-ORDER-CLEANUP-1 ejecutada. Se cancelÃ³ de forma segura el pedido QA `#8C2F` (`30c1b498-â€¦`) vÃ­a UI admin (`updateOrderStatusAction` â†’ `cancelled`), sin borrar order/items/snapshot/upsell. Dashboard Pendientes limpio; evidencia histÃ³rica intacta. Product Customization live; flags/sesiÃ³n intactos; stock sin ajuste manual. Resultado: **PASS WITH DEBT**.
- Archivos: `docs/product-customization-qa-order-cleanup-1-cancel-qa-orders-safely.md`, `docs/CURRENT_PHASE.md`

### 2026-07-16 â€” PRODUCT-CUSTOMIZATION-PLUS-BEBIDAS-QA-1 Retry â€” Real Order Snapshot & Dashboard Validation

- **Ops/QA** PRODUCT-CUSTOMIZATION-PLUS-BEBIDAS-QA-1 Retry ejecutada. Se creÃ³ un pedido QA real desde UI en demohamburgueseria con Doble Smash personalizado y Coca Cola 500ml como Plus/Bebidas. Se validÃ³ order parent, upsell child item, total, snapshot, stock post-pedido y dashboard, manteniendo Product Customization live y sin tocar cÃ³digo, schema, flags, sesiÃ³n ni configuraciÃ³n. Resultado: **PASS WITH DEBT** (stock no decrementa; pedido QA queda pending).
- Archivos: `docs/product-customization-plus-bebidas-qa-1-retry-real-order-snapshot-dashboard-validation.md`, `docs/CURRENT_PHASE.md`
- Pedido: `30c1b498-â€¦` `#8C2F` Â· total `15750` Â· parent `c559f4bf-â€¦` Â· upsell child `9138e5f2-â€¦`

### 2026-07-16 â€” PRODUCT-CUSTOMIZATION-PLUS-BEBIDAS-AVAILABILITY-1 â€” Reactivate Beverage Product for Upsell QA

- **Ops/QA** PRODUCT-CUSTOMIZATION-PLUS-BEBIDAS-AVAILABILITY-1 ejecutada. Se auditÃ³ el modelo real de disponibilidad/stock de products y se reactivÃ³ Coca Cola 500ml para que Plus/Bebidas vuelva a aparecer en el modal pÃºblico. Se validÃ³ catÃ¡logo, modal, cart V2 y checkout pre-submit sin crear pedido, manteniendo Product Customization live y sin tocar cÃ³digo, schema, flags, sesiÃ³n ni configuraciÃ³n de customization. Nota: al auditar, Coca Cola ya estaba `is_available=true`/`stock=5` (sin write SQL adicional). Resultado: **PASS WITH DEBT**.
- Archivos: `docs/product-customization-plus-bebidas-availability-1-reactivate-beverage-product-for-upsell-qa.md`, `docs/CURRENT_PHASE.md`
- IDs: product `c5d56371-â€¦` Â· upsell item `df1e56f4-â€¦` Â· trigger `tr_auto_suspend_out_of_stock`

### 2026-07-16 â€” PRODUCT-CUSTOMIZATION-PLUS-BEBIDAS-QA-1 â€” Real Order Snapshot & Dashboard Validation

- **Ops/QA** PRODUCT-CUSTOMIZATION-PLUS-BEBIDAS-QA-1 quedÃ³ **BLOCKED**. HabÃ­a autorizaciÃ³n para crear pedido QA, pero Coca Cola 500ml (`c5d56371-â€¦`) estÃ¡ `is_available=false`, por lo que el Plus no aparece en el modal pÃºblico y no se puede validar parent+upsell child. No se reactivÃ³ el producto (fuera de scope). Live intacto. PrÃ³ximo: reactivar Coca Cola con auth explÃ­cita y reintentar QA.
- Archivos: `docs/product-customization-plus-bebidas-qa-1-real-order-snapshot-dashboard-validation.md`, `docs/CURRENT_PHASE.md`

### 2026-07-16 â€” PRODUCT-IMAGE-RANDOMUUID-HOTFIX-1 â€” Client-Safe Image Upload ID Fallback

- **Fix** PRODUCT-IMAGE-RANDOMUUID-HOTFIX-1 ejecutada. Se eliminÃ³ el crash `crypto.randomUUID is not a function` en crop/upload de imÃ¡genes de producto (y assets pÃºblicos) en orÃ­genes no seguros (LAN HTTP). Helper client-safe `createClientSafeId` con fallbacks `getRandomValues` / timestamp. Sin tocar schema, storage policies ni buckets. Resultado: **PASS WITH DEBT** (QA LAN fÃ­sica pendiente).
- Archivos: `lib/client/safe-random-id.ts`, `components/admin/products/edit-product-form.tsx`, `create-product-form.tsx`, `components/admin/settings/public-settings-form.tsx`, `docs/product-image-randomuuid-hotfix-1-client-safe-image-upload-id-fallback.md`, `docs/CURRENT_PHASE.md`

### 2026-07-16 â€” PRODUCT-CUSTOMIZATION-PLUS-BEBIDAS-2 â€” Create Beverage Products & Enable Upsell

- **Ops/QA** PRODUCT-CUSTOMIZATION-PLUS-BEBIDAS-2 ejecutada. Se creÃ³ al menos un producto bebida real en `demohamburgueseria` (Coca Cola 500ml) y se conectÃ³ al grupo Plus/Bebidas, habilitando la experiencia modal â†’ cart V2 â†’ checkout pre-submit con bebida sugerida, manteniendo Product Customization live y sin tocar cÃ³digo, schema, precios existentes, assignments, flags ni sesiÃ³n. No se creÃ³ pedido QA por falta de autorizaciÃ³n; la validaciÃ³n quedÃ³ en checkout pre-submit. Resultado: **PASS WITH DEBT**.
- Archivos: `docs/product-customization-plus-bebidas-2-create-beverage-products-enable-upsell.md`, `docs/CURRENT_PHASE.md`
- IDs: category `91580431-â€¦` Â· product `c5d56371-â€¦` Â· upsell item `df1e56f4-â€¦`

### 2026-07-16 â€” PRODUCT-CUSTOMIZATION-PLUS-BEBIDAS-1 â€” Real Beverage Upsell Setup

- **Ops/QA** PRODUCT-CUSTOMIZATION-PLUS-BEBIDAS-1 ejecutada. Se auditÃ³ Plus/Bebidas en `demohamburgueseria`: el grupo upsell existe y apunta a Doble Smash, pero `upsell_group_items` estÃ¡ vacÃ­o y **no hay productos bebida vivos** en catÃ¡logo (Coca Cola 500ml histÃ³rica eliminada). Sin `AUTORIZO_CREATE_BEVERAGE_PRODUCTS` no se aplicaron writes. Live intacto. Resultado: **BLOCKED**.
- Archivos: `docs/product-customization-plus-bebidas-1-real-beverage-upsell-setup.md`, `docs/CURRENT_PHASE.md`

### 2026-07-16 â€” PRODUCT-CUSTOMIZATION-GROUP-DESCRIPTIONS-1 â€” Customer-Facing Group Description Polish

- **Ops/QA** PRODUCT-CUSTOMIZATION-GROUP-DESCRIPTIONS-1 ejecutada. Se pulieron descriptions de grupos visibles para clientes en `demohamburgueseria`, alineando Papas, Salsas y Agregados extra con el copy comercial actual. Product Customization siguiÃ³ live, con precios, assignments, checkout y dashboard intactos. Resultado: **PASS WITH DEBT** (Plus Bebidas vacÃ­o; assignments limitados; sin pedido QA nuevo).
- Archivos: `docs/product-customization-group-descriptions-1-customer-facing-descriptions.md`, `docs/CURRENT_PHASE.md`

### 2026-07-16 â€” PRODUCT-CUSTOMIZATION-GROUP-NAMING-1 â€” Customer-Facing Group Naming Polish

- **Ops/QA** PRODUCT-CUSTOMIZATION-GROUP-NAMING-1 ejecutada. Se pulieron nombres de grupos visibles para clientes en `demohamburgueseria`. Aderezos pasÃ³ a **Salsas** y Extras pasÃ³ a **Agregados extra**, manteniendo Product Customization live, precios, assignments, checkout y dashboard intactos. Papas sin cambios. Resultado: **PASS WITH DEBT** (descriptions de grupo aÃºn con copy viejo; Plus Bebidas vacÃ­o).
- Archivos: `docs/product-customization-group-naming-1-customer-facing-group-names.md`, `docs/CURRENT_PHASE.md`

### 2026-07-16 â€” PRODUCT-CUSTOMIZATION-REAL-CONFIG-POLISH-1 â€” Owner Config Copy & Commercial Cleanup

- **Ops/QA** PRODUCT-CUSTOMIZATION-REAL-CONFIG-POLISH-1 ejecutada. Se auditÃ³ y puliÃ³ la configuraciÃ³n comercial inicial del piloto live en `demohamburgueseria`. Product Customization siguiÃ³ live. Se corrigieron nombres visibles seguros (`Chedar`â†’Cheddar, `Big Mac`â†’Salsa Big Mac) y se limpiÃ³ copy pÃºblico con restos QA. Se documentaron recomendaciones para plus sugeridos (grupo Bebidas sin items), renombres de grupo opcionales, imÃ¡genes y UX admin futura. Resultado: **PASS WITH DEBT**. Sin cambios de cÃ³digo funcional.
- Archivos: `docs/product-customization-real-config-polish-1-owner-config-copy-commercial-cleanup.md`, `docs/CURRENT_PHASE.md`

### 2026-07-15 â€” PRODUCT-CUSTOMIZATION-PILOT-MONITOR-1 â€” Live Pilot Monitoring & Real Config Readiness

- **Ops/QA** PRODUCT-CUSTOMIZATION-PILOT-MONITOR-1 ejecutada. Se monitoreÃ³ el piloto live de Product Customization V1 en `demohamburgueseria`. Se validaron flags, gate operativo, pedidos recientes, pedido live `#213F`, pedido comercial `#7D0A`, catÃ¡logo, modal, cart, checkout pre-submit y dashboard. La configuraciÃ³n activa (Papas/Aderezos/Extras) fue clasificada como **demo/comercial inicial** con recomendaciones de polish (`Chedar`â†’Cheddar, `Big Mac`â†’Salsa Big Mac, Plus ausente) antes de rollout comercial. Resultado: **PASS WITH DEBT**. Sin writes.
- Archivos: `docs/product-customization-pilot-monitor-1-live-pilot-monitoring-real-config-readiness.md`, `docs/CURRENT_PHASE.md`

### 2026-07-15 â€” PRODUCT-CUSTOMIZATION-ROLLOUT-PILOT-1 Modo C Live Activation Retry 2

- **Ops/QA** PRODUCT-CUSTOMIZATION-ROLLOUT-PILOT-1 Modo C Live Activation Retry 2 ejecutado. Tenant: `demohamburgueseria`. Motivo: retry posterior a LIVE-OPS-GATE-1 PASS. Resultado: **PASS WITH DEBT â€” PILOT LIVE**. Flag final: **true** (`2026-07-14 23:00:16 UTC`). Gate operativo final: store session open + `on_demand_mode_active=true`. Config final: **active** (leave-on autorizado). Pedido QA live retry 2: `#213F` / `d5573074-8c14-4fa1-af5f-6e3a2209213f`. SQL/dashboard: **PASS**. Rollback: **disponible, no ejecutado**. Deuda: sticky cart automation; dedup no smokeado.
- Archivos: `docs/product-customization-rollout-pilot-1-controlled-tenant-rollout.md`, `docs/CURRENT_PHASE.md`
- Sin cambios de cÃ³digo funcional.

### 2026-07-14 â€” Product Customization ROLLOUT-PILOT-1 â€” Controlled Tenant Rollout

- **Ops/QA** PRODUCT-CUSTOMIZATION-ROLLOUT-PILOT-1 Modo C Live Activation Retry ejecutado. Tenant: `demohamburgueseria`. Motivo: retry despuÃ©s de abrir store session. Resultado: **ROLLBACK EXECUTED**. Flag final: **false** (`16:08:29 UTC`). Config final: soft-disabled. Pedido QA live retry: N/A. SQL/dashboard: N/A. Rollback: **ejecutado**. Causa: desync `store_sessions=open` vs `on_demand_mode_active=false` â†’ RPC `create_order` rechaza con mismo mensaje UX. CatÃ¡logo/modal/cart V2 PASSaron bajo flag ON. Modo B `#8C9E` sigue vÃ¡lido.
- Archivos: `docs/product-customization-rollout-pilot-1-controlled-tenant-rollout.md`, `docs/CURRENT_PHASE.md`
- Sin cambios de cÃ³digo. Superado por Modo C Live Activation Retry 2 (PASS WITH DEBT â€” PILOT LIVE).

### 2026-07-14 â€” Product Customization CHECKOUT-UI-SMOKE-1 â€” Browser Checkout Validation

- **QA/Runtime** Primer pedido V2 desde checkout UI real (`3b9f87a2-â€¦` / `#5C7C`): catÃ¡logo â†’ modal â†’ cart V2 â†’ checkout â†’ server action â†’ snapshot parent + upsell child; dashboard summary/Plus OK.
- Archivos: `docs/product-customization-checkout-ui-smoke-1-browser-checkout-validation.md`, `docs/CURRENT_PHASE.md`
- Flag/datos QA cleanup cerrado (`product_customization_enabled=false`). Deuda menor: dedup cart no probado; browser automation frÃ¡gil. Sin cambios de cÃ³digo.

### 2026-07-14 â€” Product Customization ADMIN-UX-1 â€” Owner-Friendly Builder Shell
- QuÃ©: shell de presentaciÃ³n para `/admin/products/customizations` (tabs product-first, preview placeholder, copy de negocio) sobre UI ADMIN-1/2/DnD existente; helpers puros `builder-presentation.ts`
- Archivos: `owner-customization-builder.tsx`, `customer-preview-panel.tsx`, `builder-presentation.ts`, `customizations/page.tsx`, `product-customization-admin.module.css`, copy en assignments/groups/upsell, `docs/product-customization-admin-ux-1-owner-friendly-builder-shell.md`
- Impacto: UX admin mÃ¡s owner-friendly sin cambiar DB/actions/validaciones/flag; deuda preview/overrides + densificaciÃ³n forms
- Dec: `docs/product-customization-admin-ux-1-owner-friendly-builder-shell.md`

### 2026-07-14 â€” Product Customization ADMIN-UX-SPEC-1 â€” Owner-Friendly Builder Specification

- **Docs/UX** Spec para rediseÃ±ar `/admin/products/customizations` como builder owner-friendly product-first: lenguaje de negocio, preview del cliente, plus como venta sugerida, excepciones (overrides), roadmap UX-1â€¦UX-5 + OPTION-IMAGES-1.
- Archivos: `docs/product-customization-admin-ux-spec-1-owner-friendly-builder.md`, `docs/CURRENT_PHASE.md`
- Sin cÃ³digo/DB/flag. PrÃ³xima implementaciÃ³n: ADMIN-UX-1 Builder Shell.

### 2026-07-14 â€” Product Customization V1-HANDOFF-1 â€” Final Handoff & V1 Closure

- **Docs** Product Customization V1 cerrado como PASS WITH DEBT. ConsolidaciÃ³n de arquitectura, QA, rollout/rollback, deudas y roadmap V1.1.
- Archivos: `docs/product-customization-v1-final-handoff.md`, `docs/CURRENT_PHASE.md`
- Flag final `demohamburgueseria=false`. Pedido V2 runtime `#8E6F` validado en SQL/dashboard. Sin cambios de cÃ³digo/DB.

### 2026-07-14 â€” Product Customization E2E-QA-1 â€” Flag-on Full Runtime Smoke

- **QA/Runtime** Pedido V2 real en prod demo (`d3e5c903-â€¦`): snapshot parent + upsell child; dashboard summary/Plus render; flag/datos cleanup cerrado.
- Archivos: `docs/product-customization-e2e-qa-1-flag-on-full-runtime-smoke.md`, `docs/CURRENT_PHASE.md`
- Deuda: E2E browser checkout UI no automatizado (RPC autorizado usado). Sin cambios de cÃ³digo.

### 2026-07-13 â€” Product Customization DASHBOARD-1 â€” Render Snapshot & Upsell Children

- **UI/Admin** Display read-only de `customization_snapshot` + upsell hijos en panel Productos del workspace; parser tolerante + Ã¡rbol jerÃ¡rquico; selects dashboard/detail extendidos.
- Archivos: `lib/product-customization/order-dashboard.ts`, `lib/orders/admin.ts`, `order-products-list.tsx`, `order-product-modal.tsx`, `order-items*.css`, `docs/product-customization-dashboard-1-render-snapshot-upsell-children.md`
- Breaking: no â€” legacy sin snapshot se ve igual; sin RPC/checkout/flag/DB.

### 2026-07-13 â€” Product Customization ORDER-1-DB-APPLY-QA â€” Apply RPC & Flag-on Smoke

- **DB/Runtime** `create_order` ORDER-1 aplicado en prod `pkrsedmwxekbhlohhqds` vÃ­a MCP `apply_migration`; markers snapshot/parent/item_kind verificados; legacy order QA OK; flag-on temporal + public modal/cart V2 smoke parcial.
- Archivos: `docs/product-customization-order-1-db-apply-qa-runtime-smoke.md`, `docs/CURRENT_PHASE.md`
- **Deuda crÃ­tica:** `product_customization_enabled` demo puede seguir true si cleanup no se ejecutÃ³; V2 persist SQL assert pendiente. Sin dashboard UI.

### 2026-07-13 â€” Product Customization ORDER-1 â€” RPC, Server Validation & Snapshot

- **Orders** ValidaciÃ³n TS + `create_order` evolucionado (snapshot + upsell children); checkout V2 unlock; dual cart clear on success.
- Archivos: `order-validation.ts`, `order-snapshot.ts`, `order-types.ts`, `20260713030000_product_customization_order_1_create_order_snapshot.sql`, checkout action/client, cart-sheet, `docs/product-customization-order-1-rpc-server-validation-snapshot.md`
- Flag off; migraciÃ³n local no pushed; sin dashboard UI.

### 2026-07-13 â€” Product Customization CART-1 â€” Cart Signature, Pricing & Display

- **Cart** LocalCartItemV2 + configurationSignature; storage `orderops-cart-v2`; cart sheet; edit from cart; checkout client guard (no RPC).
- Archivos: `lib/cart/{types,signature,local}.ts`, `cart-sheet.*`, `customization-modal.tsx`, `catalog-client.tsx`, `cart-bar.tsx`, `checkout-client.tsx`, `docs/product-customization-cart-1-cart-signature-pricing-display.md`
- Flag sigue off; sin create_order/migrations.

### 2026-07-13 â€” Product Customization CATALOG-1 â€” Public Customization Modal

- **Public** CatÃ¡logo: summaries SSR detrÃ¡s de flag; â€œDesde $Xâ€; intercept add-to-cart; modal lazy con herencia/overrides/upsell; CTA no persiste (seam CART-1).
- Archivos: `lib/product-customization/public.ts`, `public-shared.ts`, `app/b/[slug]/catalogo/actions.ts`, `components/public/catalog/customization-modal.*`, `catalog-client.tsx`, `product-card.tsx`, `product-detail-modal.tsx`, `public-catalog-page.tsx`, `docs/product-customization-catalog-1-public-customization-modal.md`
- Flag sigue off; sin cart/checkout/`create_order`/migraciones.

### 2026-07-12 â€” Product Customization ADMIN-DND-1 â€” Sortable Groups & Options

- **UI/Admin** Reorder visual (HTML5 DnD + â†‘/â†“) de grupos, opciones intra-grupo y assignments intra-target; persist `sort_order` 10/20/30. Sin librerÃ­a DnD nueva.
- Archivos: `sortable-reorder-list.tsx`, `sortable-groups-list.tsx`, `customizations/actions.ts` (reorder*), `shared.ts`, `docs/product-customization-admin-dnd-1-sortable-groups-options.md`
- Breaking: no â€” solo admin UX; flag off; sin migraciones/deploy.

---


## 4. Convenciones de ActualizaciÃ³n

Al registrar un cambio, incluir:

1. **Fecha** (YYYY-MM-DD)
2. **Ãrea** â€” uno de: `DB`, `Realtime`, `Auth`, `UI`, `Ops`, `Storage`, `DX`, `API`
3. **DescripciÃ³n** â€” quÃ© cambiÃ³ y por quÃ© (1-2 lÃ­neas)
4. **Archivos/migraciones** afectados (si aplica)
5. **Breaking changes** â€” si los hay, documentar migraciÃ³n necesaria

### Plantilla

```markdown
### YYYY-MM-DD â€” TÃ­tulo breve
- **[Ãrea]** DescripciÃ³n del cambio.
- Archivos: `ruta/al/archivo.ts`, `supabase/migrations/...sql`
- Breaking: sÃ­/no â€” detalle si aplica
```

---

## 5. Referencias RÃ¡pidas

| Documento | Contenido |
|-----------|-----------|
| `docs/ARCHITECTURE.md` | Arquitectura detallada |
| `docs/context.md` | Principios operativos y modos futuros |
| `docs/CURRENT_PHASE.md` | Fase actual de desarrollo |
| `docs/DECISIONS.md` | Decisiones tÃ©cnicas registradas |
| `docs/CRITICAL_FILES.md` | Archivos de alto impacto |
| `docs/DB_SCHEMA_NOTES.md` | Notas de esquema y limitaciones |
| `docs/orderops-visual-system-consolidation-audit.md` | AuditorÃ­a sistema visual legacy vs semÃ¡ntico |
| `docs/visual-z-index-scale.md` | Escala de capas z-index admin |
| `AUDITORIA_COMPLETA_APP.md` | AuditorÃ­a completa en espaÃ±ol (Jun 2026) |
| `.cursorrules` | Reglas del copiloto IA |

---

*Este documento es la fuente de verdad para contexto arquitectÃ³nico. Si contradice otro doc, prevalece este archivo tras confirmaciÃ³n en el Registro de Cambios.*
### 2026-08-02 — Public Catalog Residual Roadmap Deploy 1
- **[UI]** Release en progreso para búsqueda local de catálogos grandes, validación AR de teléfono y autocomplete de dirección con fallback manual.
- Archivos: catálogo público, checkout público y documentación del roadmap residual.
- Breaking: no — sin DB, migraciones, RPC, contratos de pedido ni cambios de paquetes.

### 2026-08-02 — Public Catalog Residual Roadmap Deploy 1 Closure
- **[Ops]** Commit `3bd26ff` publicado en `main`; Vercel production `dpl_DPv6mEwxE6UsaS5pMec3TZME35V2` Ready y alias `https://orderops.vercel.app` smokeado con catálogo/checkout HTTP 200.
- QA aceptada: Android/Chrome físico, interacción MEDIUM/LARGE, screen reader y activación real de Maps (key/billing/APIs/restricciones) pendientes.
- Breaking: no — sin DB, migraciones, RLS, RPC, paquetes ni pedidos reales; rollback no ejecutado.
