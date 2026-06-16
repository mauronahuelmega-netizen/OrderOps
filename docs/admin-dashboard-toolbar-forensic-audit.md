# Admin Dashboard Toolbar Forensic Audit

## 1. Executive Summary

Phase T0 audita el bloque **Dashboard Execution Toolbar** y su zona adyacente en `/admin/dashboard`: título `Pedidos en curso`, search, tabs/filtros, scope de sesión, controles open/close, refresh/resync, scanning operacional, empty states y panel contextual (`Resumen operativo` / `Actividad reciente`).

**Hallazgo principal:** La funcionalidad existe y opera, pero la **orquestación vive casi enteramente en `admin-dashboard-orders.tsx` (~2.380 líneas)**. El toolbar es presentacional (`DashboardToolbar.tsx`), pero search state, filtros URL-sync, session hydration, derived orders, scanning model, empty states y context panel se calculan en el contenedor monolítico.

**CSS:** Mezcla de tokens modernos (`dashboard-toolbar.module.css`, `operational-search.module.css`) con legacy warm hardcodes en `dashboard-filters.module.css` (solo usado parcialmente para empty filtrado). Scanning usa tipografía microscópica (0.5–0.67rem) — legible como consola técnica, no enterprise premium.

**Copy:** Abundancia de strings sin acentos (`situacion`, `Todavia`, `catalogo`, `Busqueda`, `Operacion`, `senales`) — no mojibake UTF-8 roto, sino **decisión/copy inconsistente** con fases D7/D10.1 del top section.

**Dead code:** Estado/handlers de filter panel mobile (`isFilterPanelOpen`, `filterMenuRef`, `handleFilterMenuToggle`, `filterTriggerLabel`, `hasActiveCompactFilter`) **sin JSX** — remanentes de refactor previo.

**Recomendación:** Iniciar **T1 — Product Contract & Scope Freeze** antes de tocar layout/CSS. Si T1 confirma extracción, **T2** desacopla presenter del contenedor antes de polish visual.

---

## 2. Scope Audited

**Incluido:**
- Execution section (`data-section="execution"`)
- `DashboardToolbar`, search, tabs, session controls, refresh
- `LaneNavigationScanning` + empty scanning variant
- Empty states operacional y filtrado
- `DashboardContextPanel` (resumen + actividad + business insights)
- CSS modules y clases globales que tocan la zona
- Flujos de estado/handlers en `admin-dashboard-orders.tsx`
- Libs: `natural-search`, `lane-navigation-scanning`, `operational-summaries`, `operational-feed`, analytics window

**Excluido de cambios (defer):**
- Top section presenter/viewModel (`dashboard-top-section-view-model.ts`, `DashboardOverview`, `DashboardMobileOverview`)
- Order cards / order modal internals
- Realtime hooks implementation details (solo referenciados)
- Server actions / Supabase schema
- Audio unlock modal / theme bootstrap A1

---

## 3. Files Audited

| Archivo | Rol |
|---------|-----|
| `app/admin/(protected)/dashboard/page.tsx` | SSR: orders + `initialActiveStoreSession` → `AdminDashboardOrders` |
| `components/admin/orders/admin-dashboard-orders.tsx` | **Orquestador monolítico** — state, handlers, empty, render tree |
| `components/admin/orders/DashboardToolbar.tsx` | Toolbar presentacional |
| `components/admin/orders/dashboard-toolbar.module.css` | Layout toolbar + scope row (tokenizado) |
| `components/admin/orders/operational-search.tsx` | Input search + chips + clear |
| `components/admin/orders/operational-search.module.css` | Search field (tokenizado) |
| `components/admin/orders/admin-dashboard-orders.module.css` | Execution section structure, mobile containment (D10) |
| `components/admin/orders/DashboardKanbanBoard.tsx` | Kanban + `LaneNavigationScanning` |
| `components/admin/orders/lane-navigation-scanning.tsx` | Scanning chips + IntersectionObserver |
| `components/admin/orders/lane-navigation-scanning.module.css` | Scanning strip (tokens, micro tipografía) |
| `components/admin/orders/dashboard-filters.module.css` | Legacy warm — **solo** `.admin-orders-filter-empty` en uso |
| `components/admin/orders/dashboard-analytics-surfaces.module.css` | `.emptyContext*` empty state |
| `components/admin/orders/DashboardContextPanel.tsx` | Resumen + insights + feed |
| `components/admin/orders/operational-summary-strip.tsx` | Resumen operativo UI |
| `components/admin/orders/operational-summary-strip.module.css` | Summary strip styles |
| `components/admin/orders/operational-feed.tsx` | Actividad reciente UI |
| `components/admin/orders/operational-feed.module.css` | Feed styles |
| `components/admin/orders/business-insights-strip.tsx` | Tercer bloque context panel |
| `lib/orders/natural-search.ts` | Parse + match search |
| `lib/orders/lane-navigation-scanning.ts` | Modelo scanning |
| `lib/orders/operational-summaries.ts` | Copy resumen operativo |
| `lib/orders/operational-feed.ts` | Feed items |
| `lib/orders/analytics.ts` | `getOperationalWindow`, session scope |
| `app/admin/(protected)/dashboard/actions.ts` | `toggleBusinessStatus`, session hydration action (referenciado) |
| `components/admin/orders/use-admin-store-session-realtime.ts` | Realtime session → hydrate |

**No existe:** `app/admin/(protected)/dashboard/loading.tsx` para execution zone.

---

## 4. Component Ownership Map

| UI / Concern | File | Component | Props/state source | Handlers | CSS owner | Notes |
|-------------|------|-----------|--------------------|----------|-----------|-------|
| Pedidos en curso title | `DashboardToolbar.tsx` | `DashboardToolbar` | static | — | `dashboard-toolbar.module.css` `.title` | h2 en topRow |
| Search input | `operational-search.tsx` | `OperationalSearch` | `searchQuery` state in `admin-dashboard-orders` | `setSearchQuery` | `operational-search.module.css` | No debounce |
| Search chips | `operational-search.tsx` | chips from `parsedSearchQuery.chips` | `parseOperationalSearch` in lib | — | same | Derived from natural language parse |
| Filter tabs | `DashboardToolbar.tsx` | `Button` × N | `FILTER_OPTIONS`, `activeFilter` | `handleFilterMenuSelect` → `handleFilterChange` | `dashboard-toolbar.module.css` `.filterButton` | URL sync via `?filter=` |
| Session metadata label | `DashboardToolbar.tsx` | `scopeIndicator` | `operationalWindowLabel` memo | — | `.scopeIndicator` | "Sesión activa · desde HH:MM" o jornada |
| Open session button | `DashboardToolbar.tsx` | `Button` | `onDemandModeActive`, permissions | `handleOpenStoreSession` | `.sessionButton` | Server action `toggleBusinessStatus(true)` |
| Close session button | `DashboardToolbar.tsx` | `Button` danger | same | `handleCloseStoreSession` | `.sessionButtonDanger` | Confirm si hay pedidos activos |
| Session status text | `DashboardToolbar.tsx` | span | `onDemandModeActive` | — | `.sessionStatus` | "Negocio abierto" / "Jornada actual" |
| Refresh/resync icon | `DashboardToolbar.tsx` | ghost `Button` + inline SVG | `isStoreSessionHydrating` | `handleManualStoreSessionResync` → `hydrateStoreSession` | `.sessionLink` | **No refetch orders directo** — hydrate session |
| Session error | `DashboardToolbar.tsx` | `p` alert | `storeSessionError` | — | `.sessionError` | Post action errors |
| Scanning header (con pedidos) | `lane-navigation-scanning.tsx` | `LaneNavigationScanning` | `laneNavigationModel` memo | chip click → scrollIntoView | `lane-navigation-scanning.module.css` | IO + suggested focus |
| Scanning empty variant | `admin-dashboard-orders.tsx` | inline JSX | `renderOperationalEmptyState` | — | same module `--empty` | Duplica header "Scanning operacional" |
| Empty orders panel | `admin-dashboard-orders.tsx` | `emptyContext` | `isOperationalEmpty` / `isDayScopeEmpty` | Link actions | `dashboard-analytics-surfaces.module.css` | Catálogo / productos |
| Filter/search empty | `admin-dashboard-orders.tsx` | `admin-orders-filter-empty` | `isFilteredEmpty` | — | `dashboard-filters.module.css` | Legacy warm en archivo |
| Kanban lanes | `DashboardKanbanBoard.tsx` | sections | `groupedOrders`, metrics | card actions | `dashboard-kanban.module.css` | Out of toolbar scope internals |
| Resumen operativo | `operational-summary-strip.tsx` | strip | `operationalSummaries` memo | — | `operational-summary-strip.module.css` | Label "RESUMEN OPERATIVO" uppercase |
| Actividad reciente | `operational-feed.tsx` | feed | `operationalFeedItems` memo | `onOpenOrder` | `operational-feed.module.css` | Label "ACTIVIDAD RECIENTE" |
| Business insights | `business-insights-strip.tsx` | strip | `businessInsights` memo | `onOpenOrder` | `business-insights-strip.module.css` | Entre resumen y feed |
| Container layout | `admin-dashboard-orders.tsx` | sections | classNames | — | `admin-dashboard-orders.module.css` | execution + context sections |

---

## 5. Functional Flow Map

```
dashboard/page.tsx (SSR orders, session)
  └─ AdminDashboardOrders (client orchestrator)
       ├─ DashboardOverview / DashboardMobileOverview (top — out of T scope)
       └─ executionSection
            ├─ DashboardToolbar (presentational)
            └─ admin-orders-execution-flow
                 ├─ empty / filtered-empty / Kanban / filtered list
                 └─ (scanning inside Kanban or empty variant)
       └─ DashboardContextPanel (summaries + feed)
```

State concentration: **`admin-dashboard-orders.tsx` owns ~95% of execution toolbar logic.**

---

## 6. Search Flow

```
OperationalSearch onChange
  → setSearchQuery (useState, no debounce)
  → parseOperationalSearch(searchQuery) [useMemo]
  → matchesOperationalSearch per order [useMemo filteredOrders]
  → lanes/cards/empty/context summaries recalculated
```

| Aspecto | Detalle |
|---------|---------|
| State location | `searchQuery` in `admin-dashboard-orders.tsx:363` |
| Debounce | **No** |
| Client-side | **Sí** — filtra `baseFilteredOrders` |
| Parser | `lib/orders/natural-search.ts` — status terms, delivery, risk, customer, chips |
| Fields searched | status keywords, delivery method, customer name, risk flags, assignment, ticket value, etc. |
| useMemo | `parsedSearchQuery`, `filteredOrders` — sí |
| Affects tabs | Indirectamente — search applies after tab filter |
| Affects empty | `isFilteredEmpty` when search+tab yield zero |
| Placeholder | `"Buscar por cliente, estado o situacion..."` — **sin acento** |
| Clear | Button "Limpiar" when `hasValue` |
| Chips display | Read-only spans from parser |

**Render risk:** Every keystroke recomputes `filteredOrders` → ~15 downstream memos (metrics, summaries, feed, lane nav, top section viewModel uses `visibleOperationalOrders` not search — top section **not** filtered by search).

---

## 7. Filter Tabs Flow

```
Tab click (DashboardToolbar)
  → onFilterSelect = handleFilterMenuSelect
  → handleFilterChange
  → setActiveFilter + router.replace(?filter=)
  → baseFilteredOrders recomputed
  → Kanban vs list mode switch
```

| Aspecto | Detalle |
|---------|---------|
| Tab IDs | `all`, `pending`, `preparing`, `ready`, `delivery`, `pickup` |
| Labels | Hardcoded `FILTER_OPTIONS` / `FILTER_LABELS` |
| URL sync | `?filter=` query param; `resolveOrdersFilter` on load |
| Status vs method | status filters except delivery/pickup use `delivery_method` |
| Active state | `Button variant primary/ghost` + `aria-pressed` |
| Accessibility | `role="group"` aria-label="Filtros de pedidos" — **not tablist/tab** |
| Mobile overflow | `filtersWrapper` horizontal scroll, scrollbar hidden |
| Dead code | `isFilterPanelOpen`, `filterMenuRef`, `handleFilterMenuToggle`, `filterTriggerLabel`, `hasActiveCompactFilter` — **no render** |

---

## 8. Session Controls Flow

```
initialActiveStoreSession (SSR)
  + businessSettings.on_demand_mode_active
  + useAdminStoreSessionRealtime
  → activeStoreSessionState, onDemandModeActive
  → getOperationalWindow → visibleOperationalOrders
  → operationalWindowLabel ("Sesión activa · desde …")
  → open/close → toggleBusinessStatus server action → router.refresh()
  → manual resync → hydrateStoreSession → getActiveStoreSessionHydrationAction
```

| Aspecto | Detalle |
|---------|---------|
| Active session detection | `activeStoreSessionState` + `getOperationalWindow` source `store-session` |
| Elapsed label | `formatSessionStartLabel` — time only, **no live ticking label** in toolbar (static at render) |
| Open handler | `handleOpenStoreSession` — guards: permission, pending, already active |
| Close handler | `handleCloseStoreSession` — confirm dialog if active orders in progress |
| Optimistic UI | `onDemandModeActive` local state updated on success |
| Pending | `isStoreSessionPending` + `pendingStoreSessionAction` labels |
| Duplication top section | Top section viewModel uses same `visibleOperationalOrders` window — session **concept** appears in KPIs/insights and again in scope row |

**Note:** `onDemandModeActive` (business settings flag) vs `activeStoreSessionState` (DB session) — related but distinct; UI merges via `operationalWindow` logic.

---

## 9. Refresh Flow

```
Refresh icon click
  → handleManualStoreSessionResync
  → hydrateStoreSession("manual-resync")
  → getActiveStoreSessionHydrationAction()
  → setActiveStoreSessionState
  → optional router.refresh() (throttled)
```

| Aspecto | Detalle |
|---------|---------|
| **Not** orders refetch | Manual refresh icon hydrates **store session**, not order list |
| Orders refresh | Separate: `refreshOrdersSilently` via realtime/visibility/online |
| Loading UI | `isStoreSessionHydrating` disables button; aria-label toggles |
| Icon | Inline SVG in `DashboardToolbar` — **not lucide-react** |
| aria-label | "Actualizar sesión" / "Actualizando sesión" |

**UX gap (P1):** Icon looks like generic refresh but only resyncs session — operators may expect order reload.

---

## 10. Scanning Operacional Flow

```
groupedOrders + role + searchActive
  → buildLaneNavigationModel (lib)
  → DashboardKanbanBoard → LaneNavigationScanning
  → chips scroll to lane section ids
  → IntersectionObserver updates active chip
```

| Aspecto | Detalle |
|---------|---------|
| Data source | Grouped kanban orders in scope |
| Presentational + behavior | Chips are buttons; scroll + IO |
| Empty state | Separate inline block in `renderOperationalEmptyState` — pills "Sin pedidos" / "Panel en escucha" |
| Duplication | Header "Scanning operacional" duplicated empty vs `LaneNavigationScanning` |
| vs tabs | Tabs filter; scanning navigates within "Todos" kanban view |
| vs top section | Insights may mention same statuses — conceptual overlap |
| Typography | 0.5–0.58rem labels — **very small** |

---

## 11. Empty State / Summary Flow

### Empty states

| Condition | Render |
|-----------|--------|
| `isOperationalEmpty` (no orders at all) | `renderOperationalEmptyState` |
| `isDayScopeEmpty` (orders exist outside window) | same |
| `isFilteredEmpty` (in scope, filter/search empty) | `renderFilteredEmptyState` |

Copy examples:
- `"Todavia no hay pedidos"` — missing accent
- `"Ver catalogo"` — missing accent
- `"Los nuevos ingresos aparecerán acá automáticamente."` — uses `\u00e1` escapes in source

### Context panel (below execution)

```
filteredOrders → buildOperationalSummaries / buildOperationalFeed / buildBusinessInsights
  → DashboardContextPanel
  → Resumen operativo | Business insights | Actividad reciente
```

**Coupling:** Summaries/feed use **`filteredOrders`** (search+tab scoped), not full visible window — resumen changes when filtering.

---

## 12. CSS / Layout Audit

### Layout structure

| Zone | Desktop | Mobile (≤768px) |
|------|---------|-----------------|
| Toolbar | Title left, search right (topRow flex) | Stacked column, search full width |
| Tabs | Horizontal scroll row | Same, nowrap scroll |
| Scope row | Label left, session controls right | Stacked column |
| Execution gap | Border-top divider from top section (D8) | `overflow-x: clip` containment (D10) |
| Context panel | 2-col @720px, 3-col @1024px | Single column |

### CSS ownership split

| Layer | Tokenized? | Notes |
|-------|------------|-------|
| `dashboard-toolbar.module.css` | ✅ Mostly | `#b91c1c` fallback in sessionError |
| `operational-search.module.css` | ✅ | Good |
| `lane-navigation-scanning.module.css` | ✅ | Micro font sizes |
| `admin-dashboard-orders.module.css` | ✅ | Execution chrome |
| `dashboard-analytics-surfaces.module.css` | ✅ | emptyContext |
| `dashboard-filters.module.css` | ❌ Legacy warm | rgba whites, `#fff` mobile — **file mostly dead** |
| `admin-orders-controls` global | Via dashboardStyles import in toolbar | Legacy class name from orders-admin extraction |

| File | Class/selector | Concern | Current behavior | Risk | Recommendation |
|------|----------------|---------|------------------|------|----------------|
| `dashboard-toolbar.module.css` | `.topRow` | Title/search split | flex wrap | P2 | T3 consolidate desktop row |
| `dashboard-toolbar.module.css` | `.searchWrapper max-width 300px` | Search narrow desktop | May feel detached from title | P2 | T5 search UX |
| `dashboard-filters.module.css` | `.admin-orders-filter-empty` | Filter empty | Warm legacy colors | P1 | T9 replace with tokens |
| `lane-navigation-scanning.module.css` | font-size 0.5–0.58rem | Scanning chips | Ultra compact | P1 | T6 readability |
| `DashboardToolbar.tsx` | `admin-orders-controls` global | Double wrapper classes | Mixed module+legacy | P2 | T2 boundary cleanup |
| `admin-dashboard-orders.module.css` | `.dashboardExecutionSection` | Section spacing | OK post-D8/D10 | P3 | Preserve |
| `operational-summary-strip.tsx` | `RESUMEN OPERATIVO` uppercase | Label style | Shouts, legacy analytics | P2 | T7 copy/style |

---

## 13. Visual / Product UX Audit

### Qué funciona

- Estructura general entendible: título → filtros → scope → contenido
- Tabs operativos funcionales con URL persistencia
- Search natural language parser avanzado
- Session open/close visible con estados pending
- Scanning concept útil en kanban denso
- Empty state guía a catálogo/productos
- Mobile overflow containment post-D10

### Qué está débil

| Issue | Priority |
|-------|----------|
| Search separado visualmente del título (max-width 300px floating right) | P1 |
| Session label + "Negocio abierto" + scope label — triple señal | P1 |
| Refresh icon semántica incorrecta (session vs orders) | P1 |
| "Scanning operacional" / "Panel en escucha" — copy técnico | P1 |
| Scanning tipografía microscópica | P1 |
| Resumen/actividad compiten con top section insights | P2 |
| Empty state bajo mucho chrome cuando no hay pedidos | P2 |
| Legacy warm CSS en filter-empty | P2 |
| Filter panel dead code confunde mantenimiento | P3 |

**Sensación general:** Piezas funcionales pero **no consola enterprise unificada** — mezcla D8/D10 polish con extracciones legacy (`orders-admin.css` blocks A–N).

---

## 14. Icon Audit

| UI | Icon | Source/import | lucide-react? | Issue | Recommendation |
|----|------|---------------|---------------|-------|----------------|
| Refresh/resync | Circular arrow SVG | Inline in `DashboardToolbar.tsx` | ❌ | No semantic match to action | T4 → `RefreshCw` lucide |
| Search | None visible | `Input` component only | ❌ | No search icon affordance | T5 optional `Search` icon |
| Filter tabs | Text only | `Button` | n/a | OK | — |
| Session open/close | Text buttons | `Button` | n/a | OK | — |
| Scanning chips | Text + count | — | n/a | OK | T6 size not icon |
| Clear search | Text "Limpiar" | `Button` | n/a | OK | — |

**System direction:** Admin top section uses lucide (`DashboardOverview`). Toolbar refresh is **outlier inline SVG**.

---

## 15. Imports / Dead Code / Redundancy Audit

### Dead / unused in `admin-dashboard-orders.tsx`

| Symbol | Evidence |
|--------|----------|
| `isFilterPanelOpen` | State + effect, never read in JSX |
| `filterMenuRef` | Ref never attached |
| `handleFilterMenuToggle` | Callback never passed |
| `filterTriggerLabel` | Computed, never rendered |
| `hasActiveCompactFilter` | Computed, never rendered |

### Redundancy

| Pattern | Notes |
|---------|-------|
| `FILTER_OPTIONS` vs `FILTER_LABELS` | Duplicate label maps |
| `handleFilterMenuSelect` vs `handleFilterChange` | Wrapper only closes dead panel |
| Scanning empty header | Duplicates `LaneNavigationScanning` header markup |
| `operationalSummaries` vs top section insights | Overlapping operational narrative |
| `dashboard-filters.module.css` | Large file, ~1 class used |

### Memoization

- **Good:** Extensive `useMemo` for filtered orders, metrics, lane models
- **Risk:** `now` tick every 60s invalidates many memos even if orders unchanged
- **Risk:** `renderOrderCard` inline function in parent — new reference each render (passes to lists)

### File size smell

- `admin-dashboard-orders.tsx` — ~2.380 lines: realtime, notifications, session, search, filters, modal, kanban, empty, top section wiring

---

## 16. Copy / Mojibake Audit

**No mojibake UTF-8 detectado** (`sesiÃ³n`, etc.). Issue is **missing accents** and inconsistent tone.

| Current copy | Location | Issue | Suggested copy | Priority |
|--------------|----------|-------|----------------|----------|
| `Buscar por cliente, estado o situacion...` | `operational-search.tsx` | Missing accent | `…situación…` | P1 |
| `Busqueda operacional` | aria-label search section | Missing accent | `Búsqueda operacional` | P2 |
| `Limpiar busqueda` | clear button aria | Missing accent | `Limpiar búsqueda` | P2 |
| `Todavia no hay pedidos` | empty state | Missing accent | `Todavía no hay pedidos` | P1 |
| `Ver catalogo` | empty link | Missing accent | `Ver catálogo` | P1 |
| `Scanning operacional` | lane nav | Technical EN mix | `Recorrido por estado` (T1 decide) | P1 |
| `Panel en escucha` | empty pill | Technical | `Esperando pedidos` | P1 |
| `Saltos rapidos entre lanes visibles` | scanning subtitle | Technical + no accent | Human copy T6 | P2 |
| `RESUMEN OPERATIVO` / `ACTIVIDAD RECIENTE` | strips | Uppercase shout | Sentence case per D7 | P2 |
| `Operacion sin senales criticas` | lib summaries | No accents | Full Spanish | P2 |
| `OrderOps no detecta fricciones relevantes` | lib summaries | Technical | Operator-friendly | P2 |
| `No hay pedidos que coincidan con esta busqueda` | filter empty | No accent | `…búsqueda…` | P2 |
| `Proba con otra combinacion` | filter empty | Missing accents | `Probá…combinación` | P2 |
| `Negocio abierto` vs `Sesión activa` | toolbar | Two session concepts | T1 contract | P1 |

---

## 17. Performance / Render Risk Audit

| Area | Risk | Level | Notes |
|------|------|-------|-------|
| Search without debounce | Recompute all derived on keystroke | **MEDIUM** | ~15 memos; OK for small N |
| `now` interval 60s | Broad memo invalidation | **LOW–MEDIUM** | Needed for stalled metrics |
| Realtime order updates | Full orchestrator re-render | **MEDIUM** | Expected; Kanban memo helps partially |
| `renderOrderCard` inline | New function reference | **LOW** | Child memo impact |
| IntersectionObserver scanning | Observer per mount | **LOW** | Cleanup OK |
| Session hydration throttle | Guards spam | **NO_RISK** | Well throttled |
| Top section viewModel rebuild | On visibleOperationalOrders | **LOW** | Separate from search |
| Large monolithic component | Hard to isolate renders | **MEDIUM** | Architectural |

---

## 18. Accessibility Audit

| Criterion | Status | Notes |
|-----------|--------|-------|
| Search label | **PARTIAL** | aria-label present; placeholder duplicates |
| Filter tabs | **PARTIAL** | `aria-pressed` on buttons; not tablist pattern |
| Refresh button | **READY** | aria-label + title |
| Session buttons | **READY** | Text labels clear |
| Scanning chips | **PARTIAL** | `aria-pressed`; small touch targets |
| Empty state links | **READY** | Real links with text |
| Focus visible | **PARTIAL** | Depends on shared `Button` / UI kit |
| Color contrast scanning | **PARTIAL** | Tertiary text at 0.5rem — hard to read |
| Live regions | **PARTIAL** | empty states `aria-live="polite"` |

**Classification:** **PARTIAL** — no critical blockers, gaps in tab semantics and scanning readability.

---

## 19. State Boundary Audit

| State | Belongs to | Today lives in |
|-------|------------|----------------|
| `searchQuery` | Toolbar / search controller | `admin-dashboard-orders` ❌ |
| `activeFilter` + URL | Toolbar / filter controller | `admin-dashboard-orders` ❌ |
| `operationalWindowLabel` | Derived presenter | computed in container ✅ could extract |
| Session pending/hydrating | Session controller | container ✅ |
| `laneNavigationModel` | Scanning presenter | container ❌ |
| `filteredOrders` | Derived | container ✅ |
| Modal selection | Order workspace | container (OK separate) |
| Realtime buffers | Data layer | container (heavy) |

**Recommendation (T2):** Extract `useDashboardExecutionState` or presenter `buildDashboardExecutionViewModel` mirroring top section pattern — **without changing behavior**.

---

## 20. Architecture Smells

| Smell | Evidence | Severity |
|-------|----------|----------|
| Monolithic orchestrator | `admin-dashboard-orders.tsx` ~2380 LOC | **HIGH** |
| Presentational + business mixed | Toolbar props = 18 fields | **MEDIUM** |
| Dead filter panel state | Unused hooks/state | **LOW** |
| Legacy CSS blocks | `dashboard-filters`, `admin-orders-controls` | **MEDIUM** |
| Magic strings | Filter IDs duplicated | **LOW** |
| Session vs on-demand naming | `onDemandModeActive` + session label | **MEDIUM** |
| Refresh misleading | Session hydrate only | **MEDIUM** |
| Duplicate scanning markup | Empty vs component | **LOW** |
| Context panel fed by filteredOrders | Summary changes with tab | **MEDIUM** (intentional?) |

---

## 21. What Is Working Well

- End-to-end operational dashboard functional under realtime load
- URL-synced filters (`?filter=`) + scroll persistence per filter
- Natural language search parser (`natural-search.ts`) — powerful differentiator
- Session realtime hydration with throttling guards
- Tokenized toolbar module CSS (post-refactor path)
- D10 mobile containment (`overflow-x: clip`, full-width search)
- Kanban + scanning integration with IntersectionObserver
- Empty state actionable links (catálogo/productos)
- `DashboardKanbanBoard` memo wrapper
- Separation of `DashboardToolbar` as dumb component (good T2 base)

---

## 22. Risk Classification

| Risk | Priority | Evidence | Recommended phase |
|------|----------|----------|-------------------|
| Monolithic orchestrator hard to change safely | P0 | 2380 LOC file | T2 |
| Refresh icon misleading (session not orders) | P1 | `handleManualStoreSessionResync` only | T4 |
| Search/filter UX scattered layout | P1 | topRow max-width 300px | T3/T5 |
| Technical scanning copy | P1 | "Scanning operacional" | T6 |
| Copy without accents / inconsistent | P1 | multiple files | T1/T7 |
| Legacy warm filter-empty CSS | P1 | `dashboard-filters.module.css` | T9 |
| Scanning micro typography | P1 | 0.5rem labels | T6 |
| Dead filter panel code | P2 | unused state | T9 |
| Resumen vs top section redundancy | P2 | dual insight systems | T1 contract |
| Tab accessibility not tablist | P2 | role=group only | T5 |
| Inline refresh SVG not lucide | P3 | DashboardToolbar | T4 |
| `now` tick broad invalidation | P3 | 60s interval | T9 optional |

---

## 23. Recommended Roadmap

### T1 — Product Contract & Scope Freeze

**Objetivo:** Definir qué es toolbar vs top section vs context panel; congelar IDs, copy principles, session semantics.

**Archivos probables:** docs only + contract markdown

**Tipo:** Product/spec

**Riesgo:** Bajo

**Qué NO tocar:** Implementación

**Criterios:** Written contract for scanning label, session labels, refresh semantics, summary scope (filtered vs window)

---

### T2 — Structure Refactor / Presentational Boundary

**Objetivo:** Extraer execution view model / hooks from `admin-dashboard-orders.tsx` without behavior change.

**Archivos probables:** `lib/orders/dashboard-execution-view-model.ts`, slim container

**Tipo:** Refactor

**Riesgo:** Medio

**Qué NO tocar:** Top section presenter, realtime internals

**Criterios:** Toolbar props from viewModel; no logic change; tests/build pass

---

### T3 — Desktop Layout Consolidation

**Objetivo:** Unified execution header row — title, search, session, refresh alignment.

**Archivos probables:** `dashboard-toolbar.module.css`, `DashboardToolbar.tsx`

**Tipo:** Layout/CSS

**Riesgo:** Medio

**Qué NO tocar:** Filter logic, session actions

**Criterios:** Single visual band; no regression mobile

---

### T4 — Session Controls Polish

**Objetivo:** Clarify session status + refresh affordance; lucide icon; loading state.

**Archivos probables:** `DashboardToolbar.tsx`, CSS module

**Tipo:** UX/copy/visual

**Riesgo:** Medio (operators rely on session)

**Qué NO tocar:** `toggleBusinessStatus`, hydration throttles

**Criterios:** Refresh labeled correctly; session state single clear phrase

---

### T5 — Search & Filter UX Polish

**Objetivo:** Search integration, optional debounce, tab a11y, accent copy.

**Archivos probables:** `operational-search.tsx`, `DashboardToolbar.tsx`

**Tipo:** UX/a11y

**Riesgo:** Bajo–medio

**Qué NO tocar:** Parser semantics in `natural-search.ts` unless contracted

**Criterios:** Placeholder/accessibility; tab keyboard nav

---

### T6 — Scanning Operacional Integration

**Objetivo:** Human copy, readable chip size, dedupe empty header.

**Archivos probables:** `lane-navigation-scanning.tsx`, empty block in `admin-dashboard-orders.tsx`

**Tipo:** Copy/visual

**Riesgo:** Bajo

**Qué NO tocar:** IO scroll behavior

**Criterios:** No "Scanning operacional" unless contracted; readable min font

---

### T7 — Empty State / Summary Review

**Objetivo:** Empty copy accents; summary/feed relationship to filters; de-dupe top section.

**Archivos probables:** `operational-summary-strip.tsx`, `operational-feed.tsx`, lib summaries

**Tipo:** Copy/product

**Riesgo:** Medio

**Qué NO tocar:** Top section presenter IDs

**Criterios:** Accented copy; clear empty hierarchy

---

### T8 — Mobile / Tablet Alignment

**Objetivo:** Tablet breakpoints 720–1024; session row polish.

**Archivos probables:** `dashboard-toolbar.module.css`, `admin-dashboard-orders.module.css`

**Tipo:** Responsive CSS

**Riesgo:** Medio

**Qué NO tocar:** D10 overflow fixes regress

**Criterios:** No horizontal scroll; touch targets ≥44px where feasible

---

### T9 — Cleanup Pass

**Objetivo:** Remove dead filter panel code; trim `dashboard-filters.module.css`; lucide refresh.

**Archivos probables:** `admin-dashboard-orders.tsx`, CSS modules

**Tipo:** Deletion/token migration

**Riesgo:** Bajo

**Qué NO tocar:** Behavior paths

**Criterios:** No unused state; no warm hardcodes in execution zone

---

### T10 — Final QA / Enterprise Polish

**Objetivo:** Cross-theme QA, a11y pass, performance spot check, operator UAT.

**Archivos probables:** all execution zone

**Tipo:** QA

**Riesgo:** Bajo

**Qué NO tocar:** Scope outside toolbar block

**Criterios:** Checklist signed; dark/light; mobile/desktop

---

## 24. Recommended Next Step

**Start with T1 — Product Contract & Scope Freeze.**

Justification:
- Multiple overlapping concepts (session label, on-demand flag, refresh semantics, resumen vs top insights) need product decisions before code moves safely.
- T2 extraction is high-value but **should follow** frozen contracts to avoid rework.
- No P0 functional bug requires hotfix — risk is clarity/maintainability, not broken orders.

**Alternative:** If team wants quick wins only, **T9 dead code removal** is safe but should not precede T1 decisions on copy/session.

---

## 25. What Not To Touch

- Top section presenter/viewModel
- Top section CSS (`DashboardOverview`, `DashboardMobileOverview`)
- Audio unlock modal / gate
- Theme bootstrap A1
- AdminShell loading
- Realtime subscriptions (`use-admin-orders-realtime`, store session realtime)
- Supabase DB/schema
- Server actions (`toggleBusinessStatus`, hydration actions) — behavior frozen until T4+
- Order cards internals
- Order modal internals
- Public catalog
- Product settings pages

---

## 26. Open Questions

1. **Refresh intent:** Should manual refresh re-fetch orders, session, or both? Current = session only.
2. **Context panel scope:** Should `Resumen operativo` reflect filtered subset or full operational window?
3. **Scanning rename:** Replace "Scanning operacional" with operator Spanish? Kill subtitle?
4. **Session copy:** Unify `Sesión activa · desde` with `Negocio abierto` button area?
5. **Filter panel dead code:** Was mobile compact filter menu removed intentionally in D10?
6. **Business insights strip:** Part of toolbar block or separate phase?
7. **Debounce search:** Product wants instant filter or 150–300ms debounce?
8. **Top section redundancy:** Hide context panel summaries when top insights already show same signal?

---

**Phase T0 — Forensic audit complete.**

No se modificó código funcional.  
No se modificó CSS.  
No se modificaron tokens.  
No se requiere tsc/build para esta fase.
