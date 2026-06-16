# Admin Products Visual Audit — P1

## Objetivo

Auditar visualmente `/admin/products` para definir cómo devolverle el mismo feeling premium enterprise que ya logramos en `/admin/dashboard` (Board V1.0), sin implementar cambios. Entregar inventario, gaps, maqueta objetivo y contrato visual para P2.

## Contexto

El dashboard operativo V1.0 quedó aceptado con estructura **Top KPIs → Toolbar → Kanban → AdminFooter global**, lenguaje dark enterprise, ancho amplio (`AdminPageLayout size="operational"` + shell `max-width: 1600px`), jerarquía compacta y surfaces intencionales.

`/admin/products` es funcional y fue cerrado como módulo enterprise en junio 2025 (`ORDEROPS_LIVING_MEMORY.md`), pero su capa visual no siguió la evolución post-B9/S1 del dashboard: mantiene header tipo landing, doble capa de chrome (header + toolbar), padding anidado y container más angosto que el tablero operacional.

Referencias leídas:

- `docs/board-orders-execution-area-v1-final-handoff.md`
- `docs/board-orders-execution-area-phase-b9-7.md` (vía handoff)
- `docs/admin-sidebar-enterprise-polish-s1.md`
- `docs/admin-sidebar-enterprise-polish-s1-1.md`

## Archivos revisados

### Ruta y layout

| Archivo | Rol |
|---------|-----|
| `app/admin/(protected)/products/page.tsx` | Composición de página |
| `app/admin/(protected)/products/loading.tsx` | Skeleton loading |
| `components/admin/admin-page-layout.tsx` | Wrapper `size="wide"` |
| `components/admin/admin-page-layout.css` | Ritmo y max-width por size |
| `components/admin/admin-page-header.tsx` | Header compartido (eyebrow/título/descripción) |
| `components/admin/admin-page-header.css` | Tipografía display grande |
| `components/admin/admin-shell.tsx` | Shell + AdminFooter global |
| `components/admin/admin-shell.css` | `page-container` 1280px / 1600px operational |
| `components/admin/layout/admin-footer.tsx` | Footer global compact |
| `components/admin/layout/admin-footer.module.css` | Estilos footer |

### Módulo productos

| Archivo | Rol |
|---------|-----|
| `components/admin/products/dashboard-shell.tsx` | Columna toolbar + content + flyout slot |
| `components/admin/products/dashboard-shell.module.css` | Padding interno del content |
| `components/admin/products/products-toolbar.tsx` | Summary, búsqueda, filtros, acciones |
| `components/admin/products/products-toolbar.module.css` | Surface toolbar |
| `components/admin/products/products-header-actions.tsx` | `+ Nuevo producto`, `Ver catálogo` |
| `components/admin/products/products-header-actions.module.css` | Grid de acciones |
| `components/admin/products/product-catalog-section.tsx` | Server fetch + empty routing |
| `components/admin/products/product-catalog-views.tsx` | Switch table (≥900px) / grid (<900px) |
| `components/admin/products/product-catalog-views.module.css` | Breakpoint desktop/mobile |
| `components/admin/products/product-table-view.tsx` | Tabla desktop |
| `components/admin/products/product-table-view.module.css` | Table shell, rows, kebab |
| `components/admin/products/product-grid-server.tsx` | Grid mobile por categorías |
| `components/admin/products/product-grid.module.css` | Cards agrupadas |
| `components/admin/products/product-card.tsx` | Card interactiva mobile |
| `components/admin/products/product-card.module.css` | Media, badge, hover lift |
| `components/admin/products/product-availability-toggle.tsx` | Toggle activo/inactivo en tabla |
| `components/admin/products/product-availability-toggle.module.css` | Switch iOS-style |
| `components/admin/products/product-pagination.tsx` | Paginación |
| `components/admin/products/product-pagination.module.css` | Controles paginación |
| `components/admin/products/product-catalog-empty-state.tsx` | Empty filtros (UI EmptyState) |
| `components/admin/products/product-catalog-skeleton.tsx` | Loading skeleton |
| `components/admin/products/flyout-panel.tsx` | Panel lateral create/edit |
| `components/admin/products/flyout-panel.module.css` | Overlay flyout |
| `components/admin/products/create-product-form.tsx` | Form alta (flyout) |
| `components/admin/products/edit-product-form.tsx` | Form edición (flyout) |
| `components/admin/products/product-form.module.css` | Form styles |
| `components/admin/products/products-management-provider.tsx` | Estado flyout/selección |
| `components/admin/products/product-empty-state-actions.tsx` | CTAs empty (categoría/producto) |
| `components/admin/products/image-crop-modal.tsx` | Crop imagen (form) |

### Referencia dashboard (solo lectura)

| Archivo | Rol |
|---------|-----|
| `app/admin/(protected)/dashboard/page.tsx` | `AdminPageLayout size="operational"` |
| `components/admin/orders/admin-dashboard-orders.tsx` | KPIs + Toolbar + Kanban |
| `components/admin/orders/admin-dashboard-orders.module.css` | Ritmo execution area |
| `components/admin/orders/DashboardToolbar.tsx` | Toolbar operacional |
| `components/admin/orders/dashboard-toolbar.module.css` | Filtros/chips/búsqueda |
| `components/admin/orders/DashboardKanbanBoard.tsx` | Superficie datos principal |
| `components/admin/orders/dashboard-kanban.module.css` | Lanes/cards |

## Hallazgo principal

**Products no está roto funcionalmente, pero quedó visualmente atrasado respecto al dashboard V1.0.**

La página cumple CRUD, filtros URL, paginación, flyout de edición y responsive table/cards, pero compone demasiadas capas visuales (header display + toolbar surface + content padding + table border box) con escala tipográfica y ancho de container distintos al tablero operacional. El footer global existe y funciona, pero el contenido no “cae” hacia él con la misma continuidad horizontal que el kanban.

## Current visual inventory

### Árbol de composición actual

```txt
AdminShell
└─ admin-shell__page-container (max-width: 1280px, padding 2rem)
   └─ AdminPageLayout --wide (gap 24–32px)
      ├─ AdminPageHeader
      │    eyebrow: "Catálogo"
      │    title: "Productos" (--type-display-size hasta 3.2rem)
      │    description: "Gestioná los productos..."
      │    actions: (vacío — acciones viven en toolbar)
      └─ DashboardShell (products)
           ├─ ProductsToolbar
           │    summary: "N productos · M categorías"
           │    filtersRow: search, categoría, stock, estado, limpiar
           │    rightActions: ProductsHeaderActions
           │         "+ Nuevo producto" | "Ver catálogo"
           ├─ content (padding lg/xl)
           │    └─ ProductCatalogViews
           │         desktop ≥900px: ProductTableView
           │         mobile <900px: ProductGridServer + ProductCard
           └─ FlyoutPanel (create/edit/category overlay)
   └─ AdminFooter variant="compact"
```

### Componentes visuales por zona

| Zona | Componente | Notas visuales |
|------|------------|----------------|
| Page shell | `AdminPageLayout` + `admin-shell__page-container` | Wide sin max propio; shell limita a 1280px |
| Header | `AdminPageHeader` | Eyebrow uppercase, título display clamp 2–3.2rem |
| Toolbar | `ProductsToolbar` | Surface `--bg-surface`, border-bottom, inputs nativos |
| Acciones primarias | `ProductsHeaderActions` | En toolbar derecha, no en header |
| Data desktop | `ProductTableView` | Tabla bordered box, 7 columnas, kebab "..." |
| Data mobile | `ProductGridServer` | Card anidada con headers duplicados por categoría |
| Thumbnail | `ProductTablePhoto` / `ProductCard` media | 40×40 tabla; 120–156px cards |
| Estado | `ProductAvailabilityToggle` | Switch + label "Activo/Inactivo" |
| Acciones fila | `kebabButton` literal "..." | Abre flyout edit |
| Empty | `admin-empty-state` + `EmptyState` | Dos patrones distintos |
| Loading | `ProductCatalogSkeleton` | Toolbar + table skeleton |
| Flyout | `FlyoutPanel` | Panel lateral form (fuera de scope P2 visual tabla) |
| Footer | `AdminFooter` | Global, compact, alineado al page-container |

### Imágenes

- Tabla y cards: `next/image` con loader Supabase (premium path).
- Forms create/edit: `<img>` raw en dropzone (`no-img-element` warnings — fuera de scope P1/P2 visual).
- No hay componente `ProductThumbnail` reusable; lógica duplicada table/card.

## Dashboard comparison

| Área | Dashboard V1.0 | Products actual | Gap | Recomendación P2 |
|------|----------------|-----------------|-----|------------------|
| Page width | `operational` → shell **1600px** | `wide` → shell **1280px** | **Alto** | Migrar a `operational` o unificar token container admin |
| Header | Sin `AdminPageHeader`; título toolbar **1.5rem** compacto | `AdminPageHeader` display **hasta 3.2rem** + eyebrow | **Alto** | Header operacional compacto; mover acciones al header row |
| Tipografía título | 24px/700, letter-spacing tight | clamp(2rem, 6vw, 3.2rem) display | **Alto** | Usar escala toolbar/KPI, no landing |
| Ritmo vertical | KPIs gap md → toolbar gap sm → kanban | header 24–32px gap + toolbar + content padding | **Medio** | Reducir gaps; una sola “execution chrome” |
| Surfaces | Canvas + chips/filtros integrados | Toolbar `--bg-surface` + table box + cards anidadas | **Alto** | Toolbar surface premium tipo dashboard; tabla en data shell único |
| Toolbar | Filtros chip, búsqueda operacional, session cluster | Selects nativos + search tooltip emoji | **Alto** | Alinear patrón filterCluster/searchCluster |
| Contenido principal | Kanban full-bleed dentro de execution | Tabla en box con padding doble | **Medio–Alto** | Quitar padding redundante; tabla fluida |
| Footer alignment | Mismo page-container, contenido full width | Mismo container pero contenido más angosto visualmente | **Medio** | Unificar ancho percibido con dashboard |
| Dark mode | Tokens `--bg-canvas`, color-mix surfaces | Tokens correctos pero más “form admin” legacy | **Medio** | Surfaces enterprise consistentes |
| Responsive | Mobile overview + kanban lanes | Mobile cards por categoría (<900px) | **Medio** | Mantener cards; reducir headers duplicados |
| Sensación enterprise | Operacional, denso, enfocado | Funcional SaaS genérico / landing header | **Alto** | Contrato admin page compartido |

## Page shell audit

### 5.1 Respuestas

- **¿Qué layout envuelve `/admin/products`?**  
  `AdminShell` → `admin-shell__page-container` → `AdminPageLayout size="wide"` → `DashboardShell` (products) → contenido.

- **¿Usa AdminPageLayout?**  
  Sí, con `size="wide"` (`max-width: none` en layout, pero limitado por shell padre).

- **¿Tiene max-width propio?**  
  El layout wide no impone max-width; el **cuello de botella es `admin-shell__page-container` a 1280px**. Dashboard usa `:has(.admin-page-layout--operational)` para **1600px**.

- **¿Su ancho difiere del dashboard?**  
  **Sí, ~320px menos** en viewport grande (1280 vs 1600), más padding interno de `dashboard-shell.content`.

- **¿El footer queda alineado con el contenido?**  
  Técnicamente sí (mismo `page-container`), pero visualmente el bloque productos (header + toolbar + table box) se percibe más angosto y “flotante” que el kanban full-width, por lo que el footer no cierra la composición con la misma naturalidad.

## Header audit

### Estructura actual

```tsx
<AdminPageHeader
  eyebrow="Catálogo"
  title="Productos"
  description="Gestioná los productos que aparecen en el catálogo público."
/>
```

Sin prop `actions` — CTAs en `ProductsToolbar.rightActions`.

### Comparación con dashboard

| Aspecto | Dashboard | Products |
|---------|-----------|----------|
| Título visible | "Pedidos" en toolbar, 1.5rem | "Productos" en header, hasta 3.2rem |
| Eyebrow | No usa eyebrow de página | "CATÁLOGO" uppercase caption |
| Descripción | Implícita en KPIs/toolbar | Párrafo bajo título (max 42rem) |
| Acciones | Toolbar session/manual/sync | Toolbar separado, no header |

### Evaluación

- **Eyebrow "Catálogo":** aporta contexto de módulo pero **pesa demasiado** junto a título display; en dashboard el contexto vive en nav sidebar + título compacto.
- **Descripción:** útil para onboarding; en V1.0 operacional debería ser **secundaria muted** o una línea bajo título compacto, no bloque landing.
- **Acciones principales:** hoy están **mal ubicadas visualmente** (toolbar derecha lejos del título). Deberían vivir en **header row derecha** (`+ Nuevo producto`, `Ver catálogo` secundario), como manual order en dashboard toolbar.

## Toolbar / filters audit

### Construcción

`ProductsToolbar`: flex row (column en mobile) con:

1. **Summary** — `N productos · M categorías`
2. **filtersRow** — search, 3 `<select>`, "Limpiar filtros"
3. **rightActions** — `ProductsHeaderActions`

CSS: `--bg-surface`, `border-bottom`, inputs 2.25rem, selects con chevron SVG token, tooltip hover con emoji en search.

### ¿Surface premium?

**No del todo.** Es una caja funcional correcta (tokenizada) pero:

- No usa chip/filter button pattern del dashboard.
- Tooltip emoji 💡 se siente pre-enterprise.
- `justify-content: space-between` separa acciones del bloque filtros (similar deuda S1.1 en theme row).
- Summary duplica métricas que mobile grid repite otra vez.

### Controles

| Control | Tipo | URL param |
|---------|------|-----------|
| Buscar | `<input type="search">` debounced | `q` |
| Categoría | `<select>` | `categoryId` |
| Stock | `<select>` | `stock` |
| Estado | `<select>` | `status` |
| Limpiar | ghost button | reset query |
| Nuevo producto | primary | flyout state |
| Ver catálogo | ghost link | external public |

### Responsive

- **≤767px:** toolbar column; filtros stack full width; acciones full width grid.
- **768–899px:** aún **mobile grid** de productos (table hidden).
- **≥900px:** tabla visible.

### Alineación dashboard

Patrón objetivo: `DashboardToolbar.viewControlsRow` — filterCluster + searchCluster + context banner. Products puede adoptar **AdminToolbarSurface** compartido sin cambiar lógica de URL params.

## Table / data surface audit

### Ancho y densidad

- Tabla `width: 100%` dentro de `.tableWrap` bordered — **no usa full bleed** por padding de `dashboard-shell.content`.
- `table-layout: fixed` con columnas % — OK en desktop ancho; en 900–1100px puede comprimir categoría/precio.
- Padding celdas `var(--space-sm) var(--space-md)` — densidad **media**, aceptable pero no tan tight como order cards.

### Headers

- Uppercase caption 12px, `--text-tertiary`, letter-spacing 0.04em — **correctos** estilo enterprise, ligeramente más fuertes que kanban column headers por el box border.

### Filas

- Hover: no hay row hover surface (solo kebab hover).
- Product name 500 weight + SKU mono 0.75rem — jerarquía clara.
- Kebab "..." texto — **no premium**; debería ser icon button / menu.

### Thumbnails

- 40×40, radius 6px, border subtle — **consistentes** en tabla.
- Cards mobile 120–156px height — ratio distinto a tabla (aceptable por breakpoint).

### Precio / stock / estado

- Precio right-aligned, font-weight 600 — OK.
- Stock número plano secondary — OK operacional; podría usar badge low/out en P3.
- Estado: toggle + label ocupa 120px col — **funcional, no pill premium**.

### Acciones

- Un botón kebab que abre flyout edit — no hay menú desplegable real; label aria correcto.

## Product row audit

| Campo | Presentación | Evaluación |
|-------|--------------|------------|
| Foto | 40px avatar | OK |
| Nombre | Primary 500 | OK |
| SKU | Mono uppercase bajo nombre | **Útil pero ruidoso** en densidad alta; P2 considerar tooltip o columna opcional |
| Categoría | Secondary monoCell | Peso correcto |
| Precio | Bold right | OK |
| Stock | Número | OK |
| Estado | Switch iOS + texto | Mejorable a pill/status compact |
| Acciones | "..." | Polish P2 |

## State / stock / status audit

- **Activo/inactivo:** switch verde `--accent-success` + label — legible, estilo consumer más que enterprise data table. Cards mobile usan `admin-status-badge` (más alineado al dashboard).
- **Stock:** solo entero; filtros URL cubren out/low/in — comunicación operacional OK en filtros, no en fila.
- **Categoría:** peso secondary correcto; en mobile se repite en card header uppercase.
- **SKU:** dato técnico útil para operador con escáner; en tabla siempre visible puede ser **ruido visual** — recomendar secondary más muted o show-on-row-hover (P3).

## Responsive audit

| Breakpoint | Comportamiento |
|------------|----------------|
| Mobile | Grid cards por categoría, toolbar stacked, **no tabla** |
| Tablet 768–899px | Sigue grid mobile (breakpoint table = 900px) |
| Desktop ≥900px | Tabla |
| Scroll horizontal | `.tableWrap { overflow-x: auto }` — posible en viewports estrechos 900–1000px |
| Toolbar | Se rompe ordenadamente a column; filtros full width |
| Footer | Aparece vía shell; OK |

**Deuda:** breakpoint table a 900px mientras dashboard kanban usa 720px/769px en varios sitios — inconsistencia cross-module.

## Missing visual components

Componentes que **existen parcialmente** o **faltan como primitivas compartidas**:

| Componente | Estado actual | Propuesta |
|------------|---------------|-----------|
| `AdminPageHeader` | Existe; escala landing | Variante `operational` compacta |
| `AdminToolbarSurface` | No existe | Wrapper toolbar dashboard-like |
| `AdminTableShell` | Inline `.tableWrap` | Border/radius/padding estándar admin |
| `ProductStatusPill` | Toggle + badge ad hoc | Pill alineada a order status tokens |
| `ProductThumbnail` | Duplicado table/card | Primitiva 40px shared |
| `ProductActionMenu` | Kebab "..." | Icon + dropdown (visual only P2) |
| `AdminEmptyState` | Global class + `EmptyState` UI | Unificar patrón con dashboard empty |
| `AdminPageContainer` | Split shell + layout sizes | Token único `--admin-content-max-width` |

**No implementar en P1.**

## Target visual mockup

```txt
┌──────────────────────────────────────────────────────────────────────────────┐
│ CATÁLOGO · Productos                              [Ver catálogo] [+ Nuevo]   │
│ Gestioná el catálogo público y la disponibilidad operativa.                   │
├──────────────────────────────────────────────────────────────────────────────┤
│ 27 productos · 6 categorías                                                  │
│ [Buscar producto o SKU...]  [Categoría ▾] [Stock ▾] [Estado ▾]  Limpiar     │
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌─ data surface ───────────────────────────────────────────────────────────┐ │
│ │ FOTO   PRODUCTO              CATEGORÍA    PRECIO    STOCK   ESTADO   ⋮  │ │
│ │ ─────────────────────────────────────────────────────────────────────── │ │
│ │ [img]  Hamburguesa clásica    Burgers     $4.500      12    ● Activo  ⋮  │ │
│ │        SKU: HAMB-001                                                   │ │
│ │ [img]  Papas medianas          Sides       $2.200       0    ○ Inactivo ⋮  │ │
│ │        SKU: PAP-MED                                                      │ │
│ │ ...                                                                      │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ Mostrando 1–20 de 27 productos          [Anterior]  Página 1 de 2  [Sigu.] │
├──────────────────────────────────────────────────────────────────────────────┤
│ © 2026 OrderOps · Sistema operativo para pedidos          V1.0 · Panel prot. │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Decisiones de maqueta

- Título **sobrio** (~1.25–1.5rem), eyebrow opcional inline muted (no display clamp).
- **Ancho** alineado a dashboard (`operational` / 1600px shell).
- **Toolbar** una fila contexto + una fila controles (patrón dashboard), sin emoji tooltip.
- **Tabla** en single data surface full width, sin padding extra del shell content.
- **Acciones primarias** en header row, no flotando en extremo opuesto del toolbar.
- **Footer** continúa global; contenido y footer comparten el mismo ancho percibido.

## Proposed admin page contract

Contrato visual para páginas admin (sin implementar). No es un header global rígido único — es **shared vocabulary**.

### Page container

```txt
- max-width: alinear con operational (1600px shell) o token --admin-page-max-width
- padding horizontal: heredar admin-shell__page-container (2rem desktop)
- ritmo vertical: gap 16–24px entre header, toolbar, data (no 32px + doble padding)
- relación footer: último bloque data + pagination; footer shell sin margin-top excesivo
```

### Page header

```txt
- eyebrow: opcional, caption uppercase muted (máx. 1 línea)
- título: 1.25–1.5rem, weight 650–700, no --type-display-size
- descripción: 0.875–1rem secondary, max 1–2 líneas
- acción primaria: derecha header (CTA operacional)
- acción secundaria: ghost/link al lado primaria
```

### Toolbar surface

```txt
- fila 1: contador/contexto operativo (productos, categorías, filtros activos)
- fila 2: búsqueda + filtros chip/select + limpiar
- background: --bg-canvas o elevated subtle (como dashboard toolbar)
- border: solo separator inferior sutil, no “caja completa”
- acciones destructivas/creación: preferir header, no toolbar derecha
```

### Data surface

```txt
- shell único: border subtle, radius md, bg surface
- headers: caption uppercase tertiary
- rows: hover surface optional; zebra no requerido
- empty/loading/error: AdminEmptyState pattern unificado
- pagination: dentro o pegada bajo shell, mismo ancho
```

### Responsive

```txt
- desktop (≥900px o alinear 768): table full width
- tablet: table con scroll horizontal mínimo o densidad reducida
- mobile: cards list/grid; evitar headers duplicados ("Catálogo" x3)
- toolbar: stack controls; mantener search first
```

## Priority classification

### P1 — Necesario para coherencia SaaS V1.0

- Unificar **ancho de página** con dashboard (`operational` o token shell).
- Reducir **escala del header** (eliminar display landing).
- Reubicar **acciones primarias** al header row.
- **Toolbar surface** alineada a dashboard (canvas, spacing, sin tooltip emoji).
- Eliminar **padding horizontal redundante** (`dashboard-shell.content` vs page container).
- **Footer alignment** perceptivo (contenido full width del container).

### P2 — Importante pero no blocker

- Densidad/refinamiento tabla (row hover, kebab icon menu).
- Unificar **status** tabla con pills/badges del dashboard.
- Breakpoint consistency (900 vs 768).
- Mobile grid: reducir nested cards/headers duplicados.
- Summary metrics una sola vez (toolbar, no repetir en grid header).

### P3 — Polish

- SKU show-on-hover o columna toggle.
- Stock badges (bajo/agotado).
- Thumbnail component shared.
- Hover states micro en filas.
- Skeleton alineado a nueva toolbar/table shell.

### DEFER — Futuro módulo/roadmap

- Rediseño flyout/form producto (funcional, extenso).
- Optimización `no-img-element` en forms.
- Categorías admin page alignment (módulo separado).
- Reportes/caja/inventario avanzado.
- Checkout público / catálogo público visual.

## Recommended P2 scope

**P2 — Products Page Enterprise Alignment** (propuesta acotada):

1. Cambiar `AdminPageLayout` products a `operational` (o extender token shell).
2. Introducir variante compacta de header (props o `AdminPageHeader` variant).
3. Mover `ProductsHeaderActions` al `AdminPageHeader actions`.
4. Refactor CSS toolbar → patrón dashboard-like (sin cambiar URL filter logic).
5. Ajustar `dashboard-shell.module.css` products: content padding → minimal/full bleed data.
6. `ProductTableView` table shell → `AdminTableShell` styling.
7. Kebab → icon button visual; optional status pill read-only + toggle en menú (solo si no toca actions).
8. Mobile grid header dedupe.
9. Actualizar `loading.tsx` para reflejar nueva composición.

**Fuera de P2:** forms, flyout internals, server actions, DB, image pipeline.

## Files likely touched in P2

### Probables

```txt
app/admin/(protected)/products/page.tsx
app/admin/(protected)/products/loading.tsx
components/admin/products/dashboard-shell.module.css
components/admin/products/products-toolbar.tsx
components/admin/products/products-toolbar.module.css
components/admin/products/products-header-actions.tsx
components/admin/products/product-table-view.module.css
components/admin/products/product-grid.module.css
components/admin/products/product-catalog-views.module.css
components/admin/admin-page-header.css
components/admin/admin-page-layout.css
```

### Propuesta componentes compartidos (crear en P2, no ahora)

```txt
components/admin/layout/admin-page-header-operational.tsx  (o variant prop)
components/admin/layout/admin-toolbar-surface.tsx
components/admin/layout/admin-toolbar-surface.module.css
components/admin/layout/admin-data-surface.tsx
components/admin/layout/admin-data-surface.module.css
```

### Posible touch shell (si unifican width token)

```txt
components/admin/admin-shell.css
```

## Risks

| Riesgo | Mitigación |
|--------|------------|
| Cambiar layout size afecta otras páginas `wide` | Scope change solo products page o nuevo size `catalog` |
| Mover acciones rompe muscle memory | Mantener mismos handlers/hrefs |
| Toolbar refactor sin tocar logic | CSS + markup shuffle only en P2 |
| Tabla más ancha en 900px viewport | Mantener overflow-x; test breakpoint |
| Flyout/form desalineado post-header change | DEFER form polish; flyout es orthogonal |
| Mobile grid regression | QA checklist tablet 768–899 |

## What NOT to implement yet

- header global rígido;
- rutas nuevas;
- nuevos módulos como caja/reportes;
- rediseño funcional de productos;
- cambios DB;
- cambios server actions;
- cambios en carga de imágenes;
- optimización no-img-element;
- cambios en checkout público.

## QA recommendations for P2

### Desktop

1. `/admin/products` ancho percibido = dashboard (lado a lado).
2. Header compacto; acciones visibles sin scroll.
3. Toolbar filtros + búsqueda sin wrap roto 1280–1600px.
4. Tabla full width; paginación alineada.
5. Toggle estado sigue funcionando.
6. Flyout create/edit abre/cierra igual.
7. Footer una sola vez, alineado al contenido.

### Tablet / mobile

8. 768–899: validar grid o considerar table scroll.
9. Toolbar stack legible.
10. Cards sin triple header "Catálogo".
11. Ver catálogo + nuevo producto accesibles.

### Regression

12. Filtros URL (`q`, `categoryId`, `stock`, `status`, `page`).
13. Empty states categoría/producto/filtros.
14. Dark mode legibilidad surfaces.
15. Sidebar collapsed no afectado.

---

**P1 completada — doc-only, sin cambios de código.**
