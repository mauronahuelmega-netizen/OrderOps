# Board / Orders Execution Area — Phase B9.6c — Context Panel Cleanup / Legacy Empty Cleanup

## Objetivo

Limpiar restos post-B9.6 del dashboard operativo: context panel huérfano, strips/feed exclusivos, builders sin consumidores, CSS legacy y CTAs inferiores del legacy empty path — manteniendo la estructura final **KPIs + Toolbar + Kanban + AdminFooter**.

## Contexto

Referencias revisadas:

| Documento | Estado |
|-----------|--------|
| `admin-footer-board-bottom-area-audit.md` | ✓ (audit B9.5) |
| `board-orders-execution-area-phase-b9-6.md` | ✓ |
| `board-orders-execution-area-phase-b9-5.md` | ✗ — usar `admin-footer-board-bottom-area-audit.md` |
| `board-orders-execution-area-phase-b9-4.md` | ✓ |
| `board-orders-execution-area-phase-b9-2.md` | ✓ |
| `board-orders-execution-area-phase-b9-final-qa.md` | ✓ |

B9.6 removió render de `emptyBoardHelper` y `DashboardContextPanel`, creó `AdminFooter` pilot, y dejó `renderOperationalEmptyState` con CTAs legacy como deuda.

## Decisión producto

Para V1.0, el dashboard operativo cierra con **KPIs + Toolbar + Kanban + Footer**. No se mantiene panel contextual inferior ni CTAs de onboarding.

Los CTAs **Ver catálogo** / **Gestionar productos** no pertenecen al área inferior del dashboard; sus destinos siguen en navegación y pantallas dedicadas.

## Preflight audit

Búsquedas `rg` ejecutadas sobre símbolos candidatos. Clasificación:

| Símbolo / archivo | Clasificación | Motivo |
|-------------------|---------------|--------|
| `DashboardContextPanel.tsx` | **SAFE DELETE** | Sin imports en código TS/TSX tras B9.6 |
| `operational-summary-strip.tsx` + CSS | **SAFE DELETE** | Sólo consumido por context panel |
| `business-insights-strip.tsx` + CSS | **SAFE DELETE** | Sólo consumido por context panel |
| `operational-feed.tsx` + CSS | **SAFE DELETE** | Sólo consumido por context panel |
| `lib/orders/business-insights.ts` | **SAFE DELETE** | Sin consumidores TS tras eliminar strips |
| `lib/orders/operational-summaries.ts` | **SAFE DELETE** | Sin consumidores TS tras eliminar strips |
| `lib/orders/operational-feed.ts` | **SAFE DELETE** | Sin consumidores TS tras eliminar strips |
| `.contextSection*` CSS en `admin-dashboard-orders.module.css` | **SAFE DELETE** | Sólo usado por context panel eliminado |
| `emptyContextAction` / `emptyContextActions` CSS | **SAFE DELETE** | CTAs removidos del legacy empty |
| `contextScope*` / `emptyBoardKind` en view model | **SAFE SIMPLIFY** | Sin consumidores tras B9.6 |
| `renderOperationalEmptyState()` | **SAFE SIMPLIFY** | Path aún alcanzable (`filter≠all` + empty); CTAs removidos, copy mínimo conservado |
| `buildOperationalDashboardInsights` (`metrics.ts`) | **DEFER** | Sin wiring actual; fuera de archivos permitidos para delete |
| `buildRecentOperationalActivity` (`activity.ts`) | **DEFER** | Sin wiring actual; fuera de archivos permitidos para delete |
| `catalogHref` / `canManageProducts` props | **KEEP** | Tipo conservado; page sigue pasándolas; sin uso en runtime |
| `AdminFooter` pilot | **KEEP** | Sin cambios |
| Top KPIs (`DashboardOverview` / `DashboardMobileOverview`) | **KEEP** | Sin cambios |

## Archivos modificados

- `components/admin/orders/admin-dashboard-orders.tsx`
- `components/admin/orders/admin-dashboard-orders.module.css`
- `components/admin/orders/dashboard-analytics-surfaces.module.css`
- `lib/orders/dashboard-board-view-model.ts`

## Archivos eliminados

- `components/admin/orders/DashboardContextPanel.tsx`
- `components/admin/orders/operational-summary-strip.tsx`
- `components/admin/orders/operational-summary-strip.module.css`
- `components/admin/orders/business-insights-strip.tsx`
- `components/admin/orders/business-insights-strip.module.css`
- `components/admin/orders/operational-feed.tsx`
- `components/admin/orders/operational-feed.module.css`
- `lib/orders/business-insights.ts`
- `lib/orders/operational-summaries.ts`
- `lib/orders/operational-feed.ts`

**Nota:** `dashboard-context-panel.module.css` no existía; el panel usaba `admin-dashboard-orders.module.css`.

## Archivos creados

- `docs/board-orders-execution-area-phase-b9-6c.md`

## Context panel cleanup

- `DashboardContextPanel` eliminado (SAFE DELETE).
- CSS `.contextSection*`, `.contextPanel*`, `.admin-orders-section--context` eliminado de `admin-dashboard-orders.module.css`.
- Globals de strips (`admin-orders-operational-summary`, `admin-orders-business-insights`, `admin-orders-recent-activity`) eliminados.

## Strips/feed cleanup

- `OperationalSummaryStrip`, `BusinessInsightsStrip`, `OperationalFeed` eliminados con sus CSS modules.
- No se usaban en top overview, mobile overview ni otras rutas admin.

## Builders cleanup

- `buildOperationalSummaries`, `buildBusinessInsights`, `buildOperationalFeed` eliminados (archivos lib completos).
- `buildOperationalDashboardInsights` y `buildRecentOperationalActivity` conservados en `metrics.ts` / `activity.ts` (**DEFER** — sin consumidor activo, refactor futuro opcional).

## Legacy empty cleanup

- `renderOperationalEmptyState()` conservado para edge case `filter≠all` + empty global / day-scope empty sin kanban persistente.
- CTAs **Ver catálogo** / **Gestionar productos** removidos.
- `Link` import removido del dashboard.
- Props `catalogHref` / `canManageProducts` mantenidas en tipo (page puede seguir pasándolas); ya no se destructuran ni usan.

## CSS cleanup

- `dashboard-analytics-surfaces.module.css` reducido a `.emptyContext` + `.emptyContextCopy` (legacy empty mínimo).
- Eliminadas clases huérfanas: analytics stack, insight items, mobileOverview legacy, kpiGrid duplicado, emptyContextAction.

## Final dashboard structure

```txt
DashboardOverview / DashboardMobileOverview
DashboardToolbar
DashboardKanbanBoard
AdminFooter
```

## Qué se preservó

- top KPIs
- toolbar/session controls
- Nuevo pedido
- search
- kanban persistente
- lane empty states
- tablet 2 columnas
- mobile stacked
- mobile filter compacto
- scroll chaining B9.1
- manual order flow
- realtime/hydration
- AdminFooter pilot

## Qué NO se cambió

- DB/schema
- server actions
- realtime
- hydration
- optimistic callbacks
- orders logic
- session logic
- manual order modal
- toolbar behavior
- cards behavior
- checkout público
- theme tokens/global CSS
- AdminFooter rollout global

## Riesgos encontrados

- `renderOperationalEmptyState` sigue visible en edge case raro (`filter≠all` + sin pedidos globales) — copy mínimo sin CTAs; unificar a kanban en fase futura si producto lo confirma.
- Helpers `buildOperationalDashboardInsights` / `buildRecentOperationalActivity` quedan sin wiring (**DEFER**).

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npm run build` | ✓ pass — dashboard 36.6 kB |
| `npx tsc --noEmit` | ✓ pass |
| `npm run lint` | ✓ pass — 0 errors / 16 warnings `no-img-element` (pre-existentes) |

## QA manual recomendado

### Dashboard con pedidos

1. KPIs, toolbar, kanban, footer visibles.
2. Sin context panel.

### Dashboard sin pedidos

3. Lanes **Sin pedidos**; sin helper inferior; sin CTAs catálogo/productos.

### Search/filtro sin resultados

4. Estado vacío comprensible; sin CTAs inferiores.

### Responsive + manual order

5. Desktop 4 cols / tablet 2 cols / mobile stacked; footer responsive; modal Nuevo pedido OK.

**Estado:** pendiente.

## Deuda técnica restante

- Unificar o eliminar `renderOperationalEmptyState` cuando el edge legacy esté validado en staging.
- Limpiar `buildOperationalDashboardInsights` / `buildRecentOperationalActivity` si no se reutilizan.
- Props `catalogHref` / `canManageProducts` pueden retirarse del contrato cuando `dashboard/page.tsx` se actualice.
- **B9.6b** — rollout global `AdminFooter`.

## Próxima fase recomendada

**Staging QA final** → **B9.6b Admin Layout Footer Rollout**.
