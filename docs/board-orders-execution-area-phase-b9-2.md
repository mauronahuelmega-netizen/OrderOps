# Board / Orders Execution Area — Phase B9.2 — Responsive Board IA Cleanup

## Objetivo

Limpiar la IA responsive del board/kanban: tablet 2 columnas sin scroll horizontal, mobile con un solo sistema de filtros, eliminar “Estados del flujo” redundante, accent lateral en mobile — sin rediseño general ni cambios de lógica.

## Contexto

B8 dejó kanban persistente desktop premium. B9.1 ajustó scroll chaining. B9.2 corrige fricción responsive (iPad horizontal, filtros duplicados, accent mobile).

## Problemas detectados

- Tablet mostraba kanban horizontal con scroll lateral.
- Filtros seguían visibles cuando el kanban ya estaba visible.
- Mobile mostraba dos sistemas de filtro (chips superiores + “Estados del flujo”).
- Accent superior de lanes sobresalía visualmente en mobile.

## Archivos modificados

- `components/admin/orders/dashboard-kanban.module.css`
- `components/admin/orders/dashboard-toolbar.module.css`
- `components/admin/orders/DashboardToolbar.tsx`
- `components/admin/orders/admin-dashboard-orders.tsx`

## Archivos creados

- `docs/board-orders-execution-area-phase-b9-2.md`

## Decisión responsive aplicada

```txt
>=1200px:
  Desktop kanban 4 columnas (sin cambio)
  Sin filtros compactos cuando kanban visible
  Sin “Estados del flujo”

768–1199px:
  Kanban grid 2 columnas
  Sin scroll horizontal
  Sin filtros compactos cuando kanban visible
  Sin “Estados del flujo”

<768px:
  Kanban stacked 1 columna
  Filtro compacto superior visible
  Sin “Estados del flujo”
  Lane accent rail lateral izquierdo
```

## Tablet behavior

- `.boardWrapper`: `display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); overflow-x: visible`.
- Lanes: `min-width: 0`, altura `clamp` moderada, scroll interno en `.laneBody`.
- Layout esperado: Pendientes | Preparando / Listos | Completados (+ Cancelados si aplica en fila extra).

## Mobile behavior

- Kanban vertical stacked preservado.
- `.filterCluster` visible (toolbar sin `data-kanban-board` hide en <768).
- `shouldRenderFlowNavigation = false` → no monta `LaneNavigationScanning`.
- Lane: `border-left: 3px solid var(--lane-accent)`, `::before` top rail oculto.

## Desktop behavior

- Grid 4 columnas ≥1200px intacto.
- Scroll chaining B9.1 (`overscroll-behavior-y: auto`) intacto.
- Filtros ocultos cuando `isKanbanBoardVisible` (kanban con filtro “Todos”).
- Filtros visibles en vista `filtered-list` (filtro activo ≠ all).

## Filter / flow summary cleanup

### “Estados del flujo”

Render condition en `admin-dashboard-orders.tsx`:

```tsx
const shouldRenderFlowNavigation = false;
```

El kanban persistente ya comunica estados por columnas; el bloque `LaneNavigationScanning` era redundante en todos los breakpoints.

### Filtros superiores

`DashboardToolbar` recibe `isKanbanBoardVisible={shouldRenderKanbanBoard}` → `data-kanban-board="true"`.

CSS `@media (min-width: 769px)`:

- Oculta `.filterCluster` y `.activeFilterBanner` cuando kanban visible.
- Search pasa a ancho completo en `.viewControlsRow`.

En mobile kanban visible, filtros compactos permanecen para navegar a `filtered-list`.

## Mobile lane accent

- Top `::before` accent oculto en `<768px`.
- `border-left: 3px solid var(--lane-accent)` en `.lane`.
- Header/count sin cambios funcionales; `overflow: hidden` preserva border-radius.

## Search / toolbar preservation

- Search siempre visible; placeholder/parser sin cambio.
- Session controls, sync, Nuevo pedido intactos.
- `activeFilter` logic sin cambio; solo visibilidad CSS.

## Qué se preservó

- kanban persistente
- lanes semánticas
- cards compactas
- search logic
- realtime/hydration
- scroll chaining B9.1
- manual order flow
- session controls

## Qué NO se cambió

- DB/schema
- server actions
- realtime
- hydration
- optimistic callbacks
- orders logic
- session logic
- manual order modal
- toolbar behavior (acciones)
- cards logic
- checkout público

## Validaciones ejecutadas

- `npm run build`: pass
- `npx tsc --noEmit`: pass
- `npm run lint`: pass — 0 errors / 16 warnings `no-img-element`

## QA visual recomendado

Pendiente staging:

- iPad Mini: 2 cols, sin scroll horizontal, sin filtros duplicados.
- Mobile: un filtro, accent lateral, sin “Estados del flujo”.
- Desktop: 4 cols, scroll chaining, sin filtros con kanban “Todos”.

## Riesgos / deuda

- Breakpoint toolbar `769px` vs kanban tablet `768px`: gap de 1px aceptable.
- Vista `filtered-list` (mobile filtro ≠ Todos) sigue mostrando lista, no kanban — comportamiento previo.
- `shouldRenderFlowNavigation` queda como flag falso; lane nav model sigue en código pero vacío.

## Próxima fase recomendada

- Staging QA final
- Próximo roadmap: Cash Closing / Session Reports / Delivery Mode / Kitchen Mode
