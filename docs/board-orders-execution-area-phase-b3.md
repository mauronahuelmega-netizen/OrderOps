# Board / Orders Execution Area — Phase B3 — Empty + Context Panel Integration

## Objetivo

Aplicar el contrato B1 para empty states, flow navigation (`Estados del flujo`) y context panel, consumiendo el view model B2 sin cambiar flujo de datos, lanes, cards ni side effects.

## Contexto

- **B0** detectó `Estados del flujo` redundante en empty y context panel sin labeling.
- **B1** congeló: context = vista actual del Board; empty global/day-scope sin flow nav; context oculto o compacto en empties.
- **B2** expuso `renderMode`, `contextScope`, `contextScopeLabel`, flags de render.
- **B3** aplica el contrato visual/semántico sobre ese límite.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `components/admin/orders/admin-dashboard-orders.tsx` | Branching por `renderMode`; flow nav sólo en kanban con lanes; empty sin shell de lane nav; context panel condicional |
| `components/admin/orders/DashboardContextPanel.tsx` | Header `Resumen de la vista` + `scopeLabel`; variant `default` / `empty` |
| `components/admin/orders/admin-dashboard-orders.module.css` | Estilos header/scope/variant empty del context panel |
| `lib/orders/dashboard-board-view-model.ts` | Labels de scope: sesión vs jornada; `"Sin resultados para esta vista"` en scope empty |

## Archivos creados

| Archivo | Rol |
|---------|-----|
| `docs/board-orders-execution-area-phase-b3.md` | Este documento |

## Cambios aplicados

1. **Branching del board** — `renderMode` reemplaza la cadena `isOperationalEmpty || isDayScopeEmpty / isFilteredEmpty / activeFilter === "all"`.
2. **Empty global/day-scope** — eliminado el shell vacío de `Estados del flujo` (`admin-orders-lane-nav--empty`); sólo queda empty principal con copy existente.
3. **Empty filtrado** — sin cambios de copy; sigue dedicado vía `renderMode === "filtered-empty"`.
4. **Flow navigation** — `shouldRenderFlowNavigation = renderMode === "kanban" && groupedOrders.length > 0`; `laneNavigationModel` devuelve items vacíos si no aplica.
5. **Context panel labeling** — título fijo `Resumen de la vista` + subtítulo desde `contextScopeLabel` (o `"Sin resultados para esta vista"` en filtered empty).
6. **Context panel en empties** — oculto en `operational-empty` y `day-scope-empty`; variant `empty` en `filtered-empty` (header + hint, sin strips pesados).

## Flow navigation visibility

| `renderMode` | `Estados del flujo` |
|--------------|---------------------|
| `operational-empty` | No |
| `day-scope-empty` | No |
| `filtered-empty` | No |
| `kanban` + lanes non-empty | Sí (vía `DashboardKanbanBoard` + `laneNavigationModel`) |
| `filtered-list` | No |

## Empty states integration

| Caso | Comportamiento B3 |
|------|-------------------|
| Global | Empty principal; sin flow nav; sin context panel |
| Sesión/jornada | Copy sesión/jornada; sin flow nav; sin context panel |
| Filtrado/search | Empty filtrado dedicado; context panel variant `empty` |

## Context panel scope labeling

| `contextScope` | Subtítulo |
|----------------|-----------|
| `operational-scope` (sesión) | Pedidos dentro de la sesión actual |
| `operational-scope` (jornada) | Pedidos de la jornada actual |
| `filtered-view` | Vista filtrada por {filterLabel} |
| `search-results` | Resultados de búsqueda |
| `filtered-search-results` | Vista filtrada + búsqueda |
| `empty` / filtered empty | Sin resultados para esta vista |

Título siempre: **Resumen de la vista**.

## Context panel empty behavior

- **Global / day-scope:** panel no renderizado (`shouldRenderContextPanel === false`).
- **Filtered empty:** panel con header + hint liviano; no renderiza `OperationalSummaryStrip`, `BusinessInsightsStrip`, `OperationalFeed`.
- **Vista normal:** panel completo; data source sigue siendo `filteredOrders`.

## CSS adjustments

Clases nuevas en `admin-dashboard-orders.module.css`:

- `.contextPanelHeader`, `.contextPanelTitle`, `.contextPanelScopeLabel`
- `.contextSection--compact`, `.contextSection--empty`
- `.contextPanelEmptyHint`

Tokens existentes: `--text-secondary`, `--text-tertiary`, `--bg-surface`, `--border-subtle`.

## Comportamiento preservado

- Lanes/status grouping sigue igual.
- Cards siguen igual.
- Search/filter behavior sigue igual.
- Context panel sigue usando `filteredOrders`.
- Realtime/hydration/optimistic no cambian.
- Manual sync no cambia.
- Toolbar no cambia.
- Top section no cambia.

## Qué NO se cambió

- cards
- lanes IA (`DeliveryWorkflowLanes` / `PriorityRiskLanes`)
- completed/cancelled behavior
- realtime
- hydration
- optimistic callbacks
- server actions
- DB/Supabase
- toolbar
- top section
- modal/detail
- route JSON
- `/admin/categories`

## Compatibilidad con B1

Contrato B1 aplicado en los puntos acordados para B3:

- Context panel = vista actual + labeling explícito ✅
- Empty global/day-scope sin `Estados del flujo` ✅
- Flow nav sólo con lanes navegables ✅
- Empty filtrado dedicado + context compacto ✅

Pendiente B4+: lanes IA, completed/cancelled, search URL.

## Uso del view model B2

| Output B2 | Uso B3 |
|-----------|--------|
| `renderMode` | Branching board + context visibility |
| `contextScopeLabel` | Subtítulo context panel |
| `groupedOrders.length` | `shouldRenderFlowNavigation` |
| `shouldRenderKanban` / `shouldRenderFilteredList` | Alineados con branching explícito por `renderMode` |

## Riesgos encontrados

- En filtered empty, métricas derivadas de `filteredOrders` vacío siguen calculándose en container (costo menor; no se renderizan en variant `empty`).
- `isOperationalEmpty` se conserva para clases CSS de top/execution empty overview (comportamiento previo).

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npm run build` | Pass (exit 0) |
| `npx tsc --noEmit` | Pass (exit 0) |
| `npm run lint` | Pass — 0 errors / 16 warnings `@next/next/no-img-element` |

## QA manual recomendado

1. `/admin/dashboard` con pedidos + `filter=all` → flow nav si hay lanes.
2. Kanban/cards iguales.
3. Filtro `Pendientes` → lista filtrada igual.
4. Search con resultados → context con scope correcto.
5. Search sin resultados → empty filtrado + context compacto.
6. Empty global/day-scope → sin flow nav, sin context panel.
7. Toolbar/top section intactos.
8. Abrir pedido, cambiar estado, optimistic, manual sync.

**Estado QA manual:** pendiente.

## Deuda técnica restante

- CSS `--empty` del lane nav (`lane-navigation-scanning.module.css`) queda sin uso en empty operacional; no eliminado en B3.
- Variant `compact` reservado; hoy sólo `default` y `empty`.
- Build `/admin/categories` preexistente (B2).

## Próxima fase recomendada

**B4 — Flow Navigation / Lanes IA Decision** — completed/cancelled, alternativas de lanes.
