# OrderOps Visual System Consolidation Audit

**Fecha:** 2026-06-11  
**Tipo:** Fase 0 — Auditoría de solo lectura (sin cambios de código)  
**Alcance:** Tokens globales, primitivas UI, shell admin, módulos Productos y Pedidos  
**Autor:** Auditoría generada por análisis estático del repositorio

---

## 1. Executive Summary

OrderOps opera hoy con **dos sistemas visuales en paralelo**:

1. **Sistema Zinc/Índigo (semántico)** — `app/theme-tokens.css` + CSS Modules tokenizados en piezas recientes (sidebar, flyout de productos, tabla operativa, tarjetas de pedido token-compliant).
2. **Sistema Legacy (warm/cream)** — `products-admin.css`, `orders-admin.css`, mobile drawer, y gran parte de `app/globals.css` (landing, catálogo, primitivas `ui-*`) con hex/rgba fijos que **no responden** a dark mode admin.

**Hallazgos clave:**

| Dimensión | Estado |
|-----------|--------|
| Tokens semánticos | Definidos y completos en `theme-tokens.css` (incl. dark preparado) |
| Activación dark admin | **No wired** — `html[data-dashboard-theme="dark"]` no se aplica en layout admin |
| Tailwind | **Ausente** — no existe `tailwind.config.*` |
| `components/shared/` | **Ausente** |
| Primitivas UI | 4 componentes en `components/ui/`; estilos en `globals.css` (no modulares) |
| Productos (reciente) | ~40% tokenizado (form, flyout, tabla, toolbar); ~60% aún en `products-admin.css` |
| Pedidos (operacional) | Kanban activo en CSS global; 6/22 módulos orders 100% token-compliant |
| Riesgo de regresión | **Alto** en dashboard de pedidos (Realtime, lanes, cards) si se toca `orders-admin.css` sin plan |

**Veredicto:** El módulo de Productos es el **mejor candidato de referencia** para consolidación visual enterprise. El dashboard de Pedidos es el **activo operacional más crítico** y el de mayor deuda híbrida module/global.

---

## 2. Files Audited

### 2.1 Tokens y globales

| Archivo | Rol |
|---------|-----|
| `app/theme-tokens.css` | Fuente autoritativa de tokens Zinc + estados operacionales + dark preparado |
| `app/globals.css` | Reset, `sr-only`, landing, catálogo público (con dark scoped), primitivas `ui-*`, utilidades admin sueltas, super-admin warm palette |
| `components/admin/admin-surfaces.css` | Sistema `oo-*` / `admin-*` surfaces, feedback, botones legacy |
| `components/admin/admin-shell.css` | Grid shell 240px + main |
| `components/admin/admin-header.css` | Nav links globales (`admin-nav-link`) |
| `components/admin/admin-mobile-drawer.css` | Drawer mobile warm palette |

**No auditado como existente:** `tailwind.config.*` (0 archivos), `components/shared/**` (directorio inexistente).

### 2.2 Primitivas UI

| Archivo |
|---------|
| `components/ui/Button.tsx` |
| `components/ui/Input.tsx` |
| `components/ui/Card.tsx` |
| `components/ui/Badge.tsx` |
| `components/ui/admin-spinner.tsx` + `admin-spinner.module.css` |

### 2.3 Shell / layout admin

| Archivo |
|---------|
| `components/admin/admin-shell.tsx` |
| `components/admin/layout/admin-sidebar.tsx` + `.module.css` |
| `components/admin/layout/admin-nav-list.tsx` + `.module.css` |
| `components/admin/layout/admin-brand.tsx` + `.module.css` |
| `components/admin/admin-topbar.tsx` |
| `components/admin/admin-mobile-drawer.tsx` |
| `components/admin/admin-nav-config.ts` |
| `app/admin/(protected)/layout.tsx` |

### 2.4 Productos

| Área | Archivos representativos |
|------|--------------------------|
| Rutas | `app/admin/(protected)/products/page.tsx`, `loading.tsx`, `actions.ts` |
| CSS módulos | `product-form.module.css`, `flyout-panel.module.css`, `product-table-view.module.css`, `products-toolbar.module.css`, `dashboard-shell.module.css`, `product-empty-state.module.css`, `image-crop-modal.module.css`, `product-availability-toggle.module.css`, `product-card.module.css`, `product-catalog-views.module.css` |
| CSS legacy | `components/admin/products/products-admin.css` (~504 líneas) |
| Componentes clave | `flyout-panel.tsx`, `create/edit-product-form.tsx`, `product-table-view.tsx`, `products-toolbar.tsx`, `product-form-skeleton.tsx`, `image-crop-modal.tsx`, `products-management-provider.tsx` |

### 2.5 Pedidos

| Área | Archivos representativos |
|------|--------------------------|
| Rutas | `app/admin/(protected)/dashboard/page.tsx`, `app/admin/(protected)/orders/[id]/*` |
| CSS legacy global | `components/admin/orders-admin.css` (~94 hardcodes) |
| CSS módulos | 22 archivos `components/admin/orders/*.module.css` |
| Componentes críticos | `admin-dashboard-orders.tsx`, `admin-order-card.tsx`, `lane-navigation-scanning.tsx`, `lane-metrics-layer.tsx`, `order-workspace*.tsx`, `order-detail-page-client.tsx` |

---

## 3. Existing Tokens

### 3.1 Superficies y texto (`theme-tokens.css`)

| Token | Light | Uso |
|-------|-------|-----|
| `--bg-canvas` | `#FAFAFB` | Fondo app |
| `--bg-surface` | `#FFFFFF` | Cards, paneles |
| `--bg-surface-hover` | `#F4F4F5` | Hover, skeletons |
| `--text-primary` | `#09090B` | Texto principal |
| `--text-secondary` | `#52525B` | Labels, meta |
| `--text-tertiary` | `#A1A1AA` | Captions |
| `--border-subtle` | `#E4E4E7` | Bordes default |
| `--border-strong` | `#D4D4D8` | Bordes emphasis |

### 3.2 Estados operacionales (mapeo explícito)

| Estado | Color principal | Fondo sutil | Texto fuerte |
|--------|-----------------|-------------|--------------|
| **Pending** | `--color-pending` `#D97706` | `--bg-pending-subtle` `#FEF3C7` | `--text-pending-strong` `#B45309` |
| **Preparing** | `--color-preparing` `#4F46E5` | `--bg-preparing-subtle` `#E0E7FF` | `--text-preparing-strong` `#4338CA` |
| **Ready** | `--color-ready` `#059669` | `--bg-ready-subtle` `#D1FAE5` | `--text-ready-strong` `#047857` |
| **Delivery** | `--color-delivery` `#2563EB` | `--bg-delivery-subtle` `#DBEAFE` | `--text-delivery-strong` `#1D4ED8` |
| **Cancelled / Danger** | `--color-cancelled` `#DC2626` | `--bg-cancelled-subtle` `#FEE2E2` | `--text-cancelled-strong` `#B91C1C` |

**Aliases semánticos:**

| Alias | Resuelve a |
|-------|------------|
| `--success` | `--color-ready` |
| `--warning` | `--color-pending` |
| `--danger` | `--color-cancelled` |
| `--info` | `--color-delivery` |
| `--risk` | `--color-cancelled` |
| `--ownership` | `#6366f1` |
| `--congestion` | `--color-pending` |
| `--focus` | `#6366f1` |

### 3.3 Marca y sombras

| Token | Valor / notas |
|-------|---------------|
| `--accent-primary` | `#2563eb` |
| `--accent-primary-strong` | `#1e40af` |
| `--accent-soft` | `rgba(37, 99, 235, 0.12)` |
| `--shadow-sm`, `--shadow-card`, `--shadow-floating` | Tinte frío Zinc |
| `--focus-ring` | `0 0 0 3px rgba(37, 99, 235, 0.22)` |

### 3.4 Compatibilidad legacy (aliases)

`--color-primary`, `--color-bg`, `--color-card`, `--color-border`, `--color-text-primary`, `--color-text-secondary`, `--color-success`, `--color-accent-orange` — usados masivamente en `globals.css` (landing, checkout, catálogo, primitivas `ui-*`).

### 3.5 Dark theme (preparado, no activo en admin)

Bloque `.dark, html[data-dashboard-theme="dark"]` redefine canvas, surface, text, borders, shadows. **Catálogo público** tiene sistema dark **independiente** via `.catalog-page[data-theme="dark"]` y `html[data-catalog-theme="dark"]` — no reutilizable para admin sin unificación.

### 3.6 Tokens ausentes o inconsistentes

| Gap | Impacto |
|-----|---------|
| `--brand-primary`, `--accent-success` | Referenciados como fallback en CSS de productos; **no definidos** en `theme-tokens.css` |
| `--type-body-size` etc. | Usados en modules; definidos en tokens ✓ |
| Overlay semántico | No existe `--overlay-scrim`; modales usan `rgba(0,0,0,0.5–0.7)` ad hoc |

---

## 4. Existing Components

### 4.1 Inventario `components/ui/`

| Componente | Variantes / API | Estilos | Clasificación |
|------------|-----------------|---------|---------------|
| **Button** | `primary`, `secondary`, `accent`, `ghost`; link via `href` | `globals.css` `.ui-button*` | **[Consolidar]** — mover a module; unificar con `admin-primary-button` |
| **Input** | label, helper, error | `globals.css` `.ui-field`, `.ui-input` | **[Consolidar]** — forms admin lo usan directo como clases también |
| **Card** | passthrough `className` | `globals.css` `.ui-card` | **[Pulir]** — sin subcomponentes |
| **Badge** | acoplado a `OrderStatus` | `globals.css` `.ui-badge--*` | **[Consolidar]** — drift vs tokens; card module override parcial |
| **AdminSpinner** | label opcional | `admin-spinner.module.css` | **[Definitivo]** — patrón module + tokens |
| **Select** | — | **No existe** como componente | **[Legacy]** — `<select>` nativo + CSS ad hoc |
| **Drawer** | — | Mobile drawer global CSS | **[Legacy]** |
| **Table** | — | Semántico en modules (products) | **[Consolidar]** — sin primitiva compartida |
| **Skeleton** | 2 sistemas | pulse (form) + shimmer (catalog) | **[Consolidar]** |

### 4.2 Superficies admin compartidas (`admin-surfaces.css`)

`oo-canvas`, `oo-surface`, `oo-panel`, `admin-form-card`, `admin-empty-state`, `admin-feedback`, `admin-primary-button`, `admin-danger-button` — **[Consolidar]** con tokens; feedback usa rgba warm hardcoded.

### 4.3 Duplicación detectada

| Patrón | Instancias |
|--------|------------|
| Botón primario | `.ui-button--primary` + `.admin-primary-button` |
| Empty state | `admin-empty-state` global + `ProductEmptyState` module + copy inline en table/grid |
| Toggle switch | `ProductAvailabilityToggle` module + markup duplicado en `edit-product-form.tsx` |
| Select chevron SVG | `product-form.module.css` (×2 reglas) + `products-toolbar.module.css` |
| Dialog actions | `categoryDialogCancel/Save` vs crop modal buttons |
| Spinner | `AdminSpinner` module vs inline spinner en `admin-shell.css` |
| Skeleton | `ProductFormSkeleton` (pulse) vs `ProductCatalogSkeleton` (shimmer legacy) |

---

## 5. Legacy Visual Debt

### 5.1 Hojas CSS globales de dominio (congeladas pero activas)

| Archivo | Líneas aprox. | Hardcodes | Cargado desde |
|---------|---------------|-----------|---------------|
| `products-admin.css` | ~504 | 40+ hex/rgba warm | `app/admin/(protected)/layout.tsx` |
| `orders-admin.css` | grande | ~94 | mismo layout ( **todas** rutas admin) |

**Clasificación:** **[Legacy]** — objetivo documentado: migrar a modules y eliminar import global.

### 5.2 Clases problemáticas que bloquean Dark Theme

| Clase / patrón | Ubicación | Problema |
|----------------|-----------|----------|
| `#fff`, `#fffdf9`, `#faf4ec` | products/orders admin CSS, super-admin, drawer | Superficies fijas light |
| `#5f564c`, `#6b6257`, `#1f1a14` | legacy admin, `globals.css` `.admin-product-category` | Texto warm fijo |
| `#eee4d8`, `#ded4c9`, `#f0e5d7` | borders legacy | No `--border-subtle` |
| `background: #fff` | `.ui-button--primary`, toggle knob, drawer thumb | Texto/blanco fijo |
| `rgba(37, 99, 235, 0.08)` | `.ui-button--ghost:hover` | Hover blue fijo |
| `#0369a1`, `#b91c1c` | `.ui-badge--ready`, `.ui-badge--cancelled` | Bypass tokens semánticos |
| `#dc2626` | `.ui-error` | Error text hardcoded |
| SVG `stroke='%2364748b'` | toolbar/form selects | Chevron no theme-aware |
| `admin-mobile-drawer.css` | completo | ~20+ warm hex — **[Legacy]** blocker dark mobile |

### 5.3 Contaminación global en `globals.css`

- **Landing / business-landing:** gradientes `rgba(255,255,255,…)`, `#fff` — scope público, aceptable separado.
- **Catálogo:** tokens scoped `--catalog-*` + dark — **[Definitivo]** para público; paralelo al admin.
- **Primitivas `ui-*` en globals:** **[Legacy]** para admin enterprise — deberían vivir en modules o token-only globals.
- **Admin utilities sueltas:** `.admin-product-header`, `.admin-toggle`, `.admin-page` — **[Consolidar]** hacia modules de dominio.

### 5.4 Código muerto visual

| Item | Clasificación |
|------|---------------|
| `.admin-modal-*` en `products-admin.css` | **[Eliminar]** — sin consumidor TSX |
| `product-edit-trigger.tsx` | **[Eliminar]** — sin imports (superseded por card click) |
| `PriorityRiskLanes` / `DeliveryWorkflowLanes` UI | **[Eliminar]** o wire — CSS huérfano |
| `admin-status-badge` referenciado en `product-card.tsx` | **[Legacy]** — **sin definición CSS** en repo |

---

## 6. Operational UX Assets to Preserve

**No romper bajo ninguna circunstancia** durante consolidación visual:

### 6.1 Pedidos — Dashboard operativo

| Activo | Archivo | Razón |
|--------|---------|-------|
| Kanban por estado | `admin-dashboard-orders.tsx` + `.admin-orders-group*` | Flujo operativo core; Realtime |
| Order cards token-compliant | `admin-order-card.module.css` | Patrón oro de status/risk |
| Quick actions | `order-card-quick-actions.module.css` | Mutaciones optimistas |
| Lane navigation | `lane-navigation-scanning.tsx` | Scanning UX validado |
| Lane metrics | `lane-metrics-layer.tsx` | KPIs por carril |
| Realtime reconciliation | hooks en `lib/orders/` | No es visual pero acoplado a layout |
| Badge status en cards | overrides `:global(.ui-badge--*)` en card module | Única fuente token-correcta hoy |

### 6.2 Productos — Módulo enterprise recién cerrado

| Activo | Archivo | Razón |
|--------|---------|-------|
| Flyout CRUD | `flyout-panel.tsx` + module | Patrón modal/drawer referencia |
| Form grid + crop | `product-form.module.css`, `image-crop-modal.tsx` | UX premium validada QA |
| Tabla alta densidad | `product-table-view.module.css` | SKU apilado, nums right |
| URL-driven filters | `products-toolbar.module.css` | Server-side filter UX |
| Skeleton anti-CLS | `product-form-skeleton.tsx` | Loading premium |
| Re-recorte tijera | `editImageBadge` + `ImageCropModal` | Feature cliente aprobada |
| Toggle disponibilidad optimista | `product-availability-toggle.tsx` | Evita global isPending |

### 6.3 Shell

| Activo | Razón |
|--------|-------|
| Grid 240px sidebar ≥900px | Estándar SaaS adoptado |
| `AdminNavList` + feature flags | Cocina/settings gating |
| `useScrollLock` en flyouts | Accesibilidad scroll |

---

## 7. New Visual System Candidates

Piezas listas para promover a **Design System v1**:

| Candidato | Origen | Promoción |
|-----------|--------|-----------|
| **Surface tokens** | `theme-tokens.css` `--surface-*` | Base de todos los paneles |
| **Status token matrix** | `--color-*` + `--bg-*-subtle` | Unificar Badge, chips, lane headers |
| **FlyoutPanel pattern** | `flyout-panel.module.css` | Drawer admin estándar |
| **ProductFormShell** | `product-form.module.css` `.shell` | Altura 42px, grid, divider |
| **Operational table** | `product-table-view.module.css` | Tabla densa reutilizable |
| **Form skeleton** | `product-form-skeleton.tsx` | Loading pattern con labels |
| **Native dialog** | `<dialog>` + `::backdrop` en forms | Modal ligero categoría |
| **AdminSpinner module** | `admin-spinner.module.css` | Loading inline |
| **Order card accent system** | `--card-status-color`, `--card-risk-*` | Extender a otros dominios |

---

## 8. Products Module Findings

### 8.1 Arquitectura visual actual

```
ProductsManagementProvider
├── DashboardShell (toolbar + content)     [Definitivo - module]
├── ProductsToolbar (URL filters)          [Definitivo - module]
├── ProductCatalogViews
│   ├── ProductTableView (desktop ≥900px)  [Definitivo - module]
│   └── ProductGridServer (mobile)         [Legacy - products-admin.css]
├── FlyoutPanel                            [Definitivo - module]
│   ├── CreateProductForm                  [Definitivo - product-form.module.css]
│   ├── EditProductForm                    [Definitivo - idem]
│   └── ProductFormSkeleton                [Definitivo - anti-CLS]
└── ImageCropModal                         [Pulir - z-index 99999, overlay hardcoded]
```

### 8.2 Clasificación por superficie

| Superficie | Clasificación | Notas |
|------------|---------------|-------|
| `product-form.module.css` | **[Definitivo]** | Grid, dropzone, currency, select chevron, skeleton pulse |
| `flyout-panel.module.css` | **[Definitivo]** | 560px, backdrop tokenizado |
| `product-table-view.module.css` | **[Definitivo]** | Alta densidad, monospace SKU |
| `products-toolbar.module.css` | **[Pulir]** | SVG chevron hardcoded en data-URI |
| `product-empty-state.module.css` | **[Definitivo]** | Filtros vacíos |
| `dashboard-shell.module.css` | **[Definitivo]** | Column layout |
| `product-card` + grid mobile | **[Legacy]** | Shell en `products-admin.css`; 3 reglas module |
| `product-catalog-skeleton` | **[Legacy]** | Shimmer warm `#f0e5d7` |
| `product-pagination` | **[Legacy]** | Clases `admin-products-pagination` |
| `products-admin.css` bulk | **[Legacy → Eliminar]** tras migración |

### 8.3 Hallazgos específicos QA reciente

- Label imagen `sr-only` — **[Definitivo]**
- Badge tijera re-recorte — **[Definitivo]**
- Select categoría `appearance: none` — **[Definitivo]** (SVG `currentColor` en data-URI no hereda — **[Pulir]**)
- Doble sistema skeleton — **[Consolidar]**

---

## 9. Orders Module Findings

### 9.1 Arquitectura visual activa

- **Entrada:** `/admin/dashboard` → `AdminDashboardOrders` (~3200 LOC TSX).
- **Kanban:** global `.admin-orders-groups` / `.admin-orders-group--{status}` en `orders-admin.css`.
- **Cards:** `admin-order-card.module.css` — **gold standard** tokens.
- **Híbrido:** mismo TSX mezcla ~68 clases globales + 6 imports module.

### 9.2 Clasificación por módulo CSS (22 files)

| Tier | Count | Ejemplos |
|------|-------|----------|
| **[Definitivo]** A — 0 hardcodes | 6 | `admin-order-card`, `admin-dashboard-orders`, `order-card-quick-actions`, `operational-*-strip`, `operational-feed` |
| **[Pulir]** B — residual | 3 | `order-workspace`, `order-detail-page`, `status-form` |
| **[Legacy]** C — warm palette | 13 | `dashboard-filters`, `lane-navigation-scanning`, `lane-metrics-layer`, `dashboard-indicators`, etc. |
| **[Eliminar]** E — orphan | 2 | `priority-risk-lanes`, `delivery-workflow-lanes` (built, unwired) |

### 9.3 Badge / status drift

- Cards: Badge override tokenizado via `:global(.ui-badge--*)` — **[Definitivo]**
- Detail/workspace: Badge hereda `globals.css` rgba legacy — **[Legacy]**
- `ui-badge--aging/stale`: usado en TSX, **sin reglas visuales** — **[Pulir]**
- `admin-order-risk-chip-row`: clase en TSX, **sin CSS** — bug visual menor

### 9.4 Filtros operacionales

- `dashboard-filters.module.css`, `operational-search.module.css` — **[Legacy]** warm palette
- Lógica de filtros acoplada a lanes — preservar comportamiento; migrar estilos solamente

---

## 10. Sidebar / Shell Findings

| Pieza | Clasificación | Dark readiness |
|-------|---------------|----------------|
| `admin-shell.css` grid | **[Definitivo]** | Parcial — shadow mobile warm |
| `admin-sidebar.module.css` | **[Definitivo]** | Alta — tokens nativos |
| `admin-nav-list.module.css` + `admin-nav-link` global | **[Consolidar]** | Active state usa `#fff` en header.css |
| `admin-topbar.tsx` | **[Definitivo]** | Mobile only |
| `admin-mobile-drawer.css` | **[Legacy]** | Blocker dark mobile |
| `admin-brand.module.css` drawer variant | **[Legacy]** | Hex fijos `#ddd2c5`, `#1f1a14` |
| `AdminPageHeader` (por ruta) | **[Pulir]** | Sin sistema unificado documentado |

**Layout import chain:** `layout.tsx` → `globals.css` → `theme-tokens` + `admin-surfaces` + **`products-admin.css`** + **`orders-admin.css`** — carga legacy en **todas** las páginas admin protegidas.

---

## 11. Drawer / Form Findings

### 11.1 Patrones de overlay

| Patrón | z-index | Backdrop | Clasificación |
|--------|---------|----------|---------------|
| Flyout productos | 40/41 | `color-mix` token | **[Definitivo]** |
| Image crop | 99999 | `rgba(0,0,0,0.7)` | **[Pulir]** — stacking war |
| Native `<dialog>` categoría | browser | `::backdrop` token | **[Definitivo]** |
| Mobile admin drawer | 34 | warm rgba | **[Legacy]** |
| Catalog modal (público) | 20 | scoped tokens | Referencia dark pública |
| `admin-order-modal` | module legacy | warm | **[Legacy]** |

### 11.2 Formularios

| Form | Layout | Clasificación |
|------|--------|---------------|
| Create/Edit Product | CSS Grid 2/3 cols, shell 42px | **[Definitivo]** |
| Category inline dialog | `<dialog>` nativo | **[Definitivo]** |
| Checkout público | `globals.css` checkout-* | **[Legacy]** scope público OK |
| Order status form | `status-form.module.css` | **[Pulir]** |
| Settings operations | modules + Input/Button | **[Consolidar]** |

### 11.3 Inputs

- Altura inconsistente: `ui-input` min-height **46px** vs shell product **42px** — **[Pulir]**
- Number spinners hidden en product shell — **[Definitivo]** pattern
- Textarea: class `ui-input` + module — **[Consolidar]**

---

## 12. Table System Findings

### 12.1 Productos — referencia

`product-table-view.tsx` + module:

- `<table>` semántico, column widths fijas
- Foto 40×40, nombre + SKU monospace
- Precio/stock `text-align: right`
- Kebab → flyout edit
- Responsive: oculto <900px; mobile usa grid legacy

**Clasificación:** **[Definitivo]** (desktop); paginación wrapper **[Legacy]**.

### 12.2 Pedidos — no hay tabla densa equivalente

Lista/card-based en lanes — intentional para ops. No forzar tabla en pedidos.

### 12.3 Oportunidad de primitiva

Extraer **`DataTable`** o **`OperationalTable`** desde product module para futuros módulos (Team, Categories admin list).

---

## 13. Status / Badge System Findings

### 13.1 Capas actuales

```
Badge.tsx → ui-badge--{status}
    ├── globals.css (rgba legacy)           [Legacy base]
    ├── admin-order-card.module.css (:global) [Definitivo override]
    └── product-card admin-status-badge*      [Broken - no CSS definition]
```

### 13.2 Mapeo status → visual (objetivo unificado)

| OrderStatus | Token target | Label ES |
|-------------|--------------|----------|
| pending | `--color-pending` / `--bg-pending-subtle` | Pendiente |
| preparing | `--color-preparing` / `--bg-preparing-subtle` | Preparando |
| ready | `--color-ready` / `--bg-ready-subtle` | Listo |
| completed | `--success` / ready subtle | Completado |
| cancelled | `--color-cancelled` / `--bg-cancelled-subtle` | Cancelado |

### 13.3 Chips adicionales (orders)

- `admin-order-new-chip`, `admin-order-risk-chip` — **[Definitivo]** en card module
- Dashboard indicator dots — **[Legacy]** hex ad hoc (`#6f9b83`, `#c39a5a`, …)

### 13.4 Product availability

Switch verde `#10b981` fallback — usar `--color-ready` / `--success`.

---

## 14. Dark Theme Readiness

| Área | Readiness | Blockers |
|------|-----------|----------|
| Token definitions | ✅ Complete | — |
| Admin activation | ❌ Not wired | No `data-dashboard-theme` on `<html>` |
| Sidebar desktop | ✅ Ready | — |
| Shell base | ⚠️ Partial | Mobile shadow warm |
| Products modules | ✅ Mostly ready | `products-admin.css` mobile grid |
| Products legacy sheet | ❌ Blocker | Entire warm palette |
| Orders modules (6 compliant) | ✅ Ready | — |
| Orders legacy + kanban global | ❌ Blocker | `orders-admin.css` |
| UI primitives globals | ⚠️ Partial | Hex in badges, buttons, errors |
| Mobile drawer | ❌ Blocker | Full warm file |
| Public catalog dark | ✅ Scoped | Separate system — do not merge blindly |

**Estrategia recomendada:** Activar dark en admin **solo después** de eliminar imports legacy o scopearlos; validar con `html[data-dashboard-theme="dark"]` toggle interno.

---

## 15. Responsive Readiness

| Breakpoint | Definición | Uso |
|------------|------------|-----|
| 640px | product-form grid collapse | forms |
| 720px | globals catalog/checkout | público |
| 768px | landing layouts | marketing |
| 900px | admin shell sidebar / product table vs grid | **admin standard** |
| 1024px | catalog 3-col | público |

### 15.1 Productos

- Desktop: tabla densa — **[Definitivo]**
- Mobile: grid cards legacy — **[Legacy]** — visual discontinuity con desktop

### 15.2 Pedidos

- Kanban horizontal scroll / lane nav — funcional; density modules en progreso
- Card compression docs (`V_3_1_*`) — comportamiento preservado

### 15.3 Shell

- `<900px`: topbar + drawer — **[Legacy]** drawer colors
- `≥900px`: sidebar persistent — **[Definitivo]**

---

## 16. Component Consolidation Map

| De (origen) | A (destino propuesto) | Prioridad |
|-------------|----------------------|-----------|
| `products-admin.css` card/grid/skeleton/pagination | CSS Modules tokenizados | P0 |
| `orders-admin.css` kanban scaffold | `admin-dashboard-orders.module.css` | P0 |
| `.ui-button*` + `.admin-primary-button` | `Button.module.css` único | P1 |
| `.ui-badge*` globals | `Badge.module.css` + status tokens | P1 |
| `globals.css` ui-input | `Input.module.css` + size variants | P1 |
| Select chevron SVG (×3) | `--select-chevron` token o shared mixin | P2 |
| Dual skeleton systems | `Skeleton.module.css` pulse standard | P2 |
| `ProductAvailabilityToggle` + edit form toggle | `Switch.tsx` primitiva | P2 |
| `admin-mobile-drawer.css` | Module + tokens | P1 |
| `admin-status-badge` (broken) | Fix → `Badge` variant o remove refs | P0 bugfix visual |
| `product-edit-trigger.tsx` | Eliminar | P3 |
| Orphan lane components | Wire o delete | P3 |

---

## 17. Migration Risk Map

| Cambio | Riesgo | Mitigación |
|--------|--------|------------|
| Tocar `orders-admin.css` kanban | **Crítico** | Snapshot visual dashboard; incremental extract to module |
| Remover `products-admin.css` import | **Alto** | Mobile grid breaks until migrated |
| Unificar Badge globals | **Medio** | Card overrides already tokenized — extend pattern |
| Cambiar z-index crop modal | **Medio** | Test flyout + crop stack |
| Activar dark theme | **Alto** | Legacy sheets flash wrong colors |
| Refactor `admin-dashboard-orders.tsx` | **Crítico** | Realtime UX regression |
| Fix `admin-status-badge` missing CSS | **Bajo** | Quick win |
| Consolidar button systems | **Medio** | grep class usage before delete |

---

## 18. Recommended Phased Plan

### Fase 1 — Quick wins (bajo riesgo)
- Definir `--brand-primary` → alias de `--accent-primary`
- Fix `admin-status-badge` o reemplazar por `Badge`/`ui-badge`
- Eliminar `product-edit-trigger.tsx` y `.admin-modal-*` muertos en products CSS
- Documentar z-index scale: flyout 40, dialog 50, crop 60, toast 70

### Fase 2 — Products legacy sunset
- Migrar `product-grid-server`, `product-catalog-skeleton`, `product-pagination`, `product-card` shell off `products-admin.css`
- Unificar skeleton pulse
- Scope `products-admin.css` import solo mientras migra; luego remove from layout

### Fase 3 — UI primitives
- Extraer `Button`, `Input`, `Badge`, `Switch`, `Skeleton` a modules con tokens
- Deprecar `.admin-primary-button` gradualmente
- Toolbar/form SVG chevrons → token

### Fase 4 — Orders visual parity
- Extract kanban globals → `admin-dashboard-orders.module.css`
- Batch migrate C-tier modules (filters, lane-nav, indicators, metrics)
- Unify Badge base con card overrides everywhere

### Fase 5 — Shell + dark
- Migrate mobile drawer + brand drawer to tokens
- Wire `data-dashboard-theme` toggle (internal QA)
- Visual regression pass dashboard + products + settings

### Fase 6 — Design System package (optional)
- Publish `@orderops/ui` internal: tokens + 8 primitives + OperationalTable + FlyoutShell

---

## 19. What Not To Touch Yet

| Área | Razón |
|------|-------|
| `admin-dashboard-orders.tsx` logic / Realtime hooks | Operaciones en producción |
| Lane data derivations (`lib/orders/*`) | No es visual; alto acoplamiento |
| `theme-tokens.css` semantic color values | Ya acordados Zinc/Indigo — solo extender, no rebrand |
| `admin-order-card.module.css` token mapping | Gold standard — copiar, no reescribir |
| `product-form.module.css` + crop flow | QA cliente aprobada Fase 19.x |
| Catálogo público dark system | Scope independiente; funciona |
| `orders-admin.css` import removal | Hasta extraer kanban |
| Checkout / landing globals | Fuera de scope admin consolidation |
| Supabase / auth / actions | Restricción explícita del encargo |

---

## 20. Next Implementation Prompt Recommendation

**Prompt sugerido para Fase 1 de implementación (post-auditoría):**

> Contexto: Fase 1 Visual Consolidation — Quick Wins (post-auditoría 2026-06-11).  
> Rol: UX Engineer. Alcance acotado, sin tocar lógica de negocio ni Realtime.  
> Tareas:  
> 1. En `theme-tokens.css`, añadir aliases `--brand-primary` y `--accent-success` mapeados a tokens existentes.  
> 2. Corregir referencias rotas `admin-status-badge` en `product-card.tsx` usando `Badge` o `ui-badge` con tokens.  
> 3. Eliminar código muerto: `product-edit-trigger.tsx`, reglas `.admin-modal-*` no usadas en `products-admin.css`.  
> 4. Crear `docs/visual-z-index-scale.md` con escala acordada y alinear `image-crop-modal.module.css` (99999 → 60).  
> 5. Unificar chevron select: extraer data-URI a constante CSS `--icon-chevron-down` en `theme-tokens.css` y consumir desde `product-form.module.css` y `products-toolbar.module.css`.  
> Validación: `npm run build`, smoke test flyout edit + crop + mobile product grid sin regresiones visuales obvias.  
> NO migrar aún `orders-admin.css` ni activar dark theme.

---

## Apéndice A — Clasificación rápida por categoría

| Categoría | Significado | Count aprox. |
|-----------|-------------|--------------|
| **[Definitivo]** | Usar tal cual / promover a DS | ~15 surfaces |
| **[Consolidar]** | Existe; unificar globalmente | ~12 patterns |
| **[Pulir]** | Funcional; mejoras visuales/tokens | ~10 items |
| **[Legacy]** | Migrar obligatorio | 2 CSS sheets + drawer + globals ui-* |
| **[Eliminar]** | Código muerto | 4+ items |

---

## Apéndice B — Confirmación de auditoría

- **Archivos de código modificados:** 0  
- **Archivos de lógica/DB/auth/API tocados:** 0  
- **Único artefacto creado:** `docs/orderops-visual-system-consolidation-audit.md`  
- **Estado:** Auditoría Fase 0 completada — solo lectura respetada.

---

*Documento generado como insumo para la consolidación del Design System OrderOps Enterprise. Para contexto histórico de productos ver `ORDEROPS_LIVING_MEMORY.md` §1.1. Para tokens ver `docs/V_1_1_TOKEN_SYSTEM.md`.*
