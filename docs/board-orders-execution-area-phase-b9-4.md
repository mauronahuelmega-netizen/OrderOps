# Board / Orders Execution Area — Phase B9.4 — Safe Dead Code Cleanup

## Objetivo

Eliminar código muerto y ramas congeladas del roadmap B0–B9.2 / C / M sin cambiar comportamiento visible ni contratos server-side.

## Contexto

B9.2 congeló `shouldRenderFlowNavigation = false` y removió “Estados del flujo” de la UI. B9.4 ejecuta cleanup demostrable: componentes no cableados, modelos huérfanos, alias deprecated sin consumidores.

No existían `docs/board-orders-cleanup-audit.md` ni `docs/board-orders-execution-area-phase-b9-3.md`. Preflight audit realizado en esta fase.

## Preflight audit

| Archivo | Símbolo/clase | Clasificación | Acción | Motivo | Riesgo |
|---------|---------------|---------------|--------|--------|--------|
| `lane-navigation-scanning.tsx` | `LaneNavigationScanning` | **SAFE DELETE** | Eliminar archivo | Sin imports runtime; B9.2 no renderiza | Bajo |
| `lane-navigation-scanning.module.css` | `.admin-orders-lane-nav*` | **SAFE DELETE** | Eliminar archivo | Solo usado por componente eliminado | Bajo |
| `lib/orders/lane-navigation-scanning.ts` | `buildLaneNavigationModel`, tipos, constantes | **SAFE SIMPLIFY** | Reducir a `buildLaneSectionId` | Único consumidor activo: kanban section ids | Bajo |
| `admin-dashboard-orders.tsx` | `shouldRenderFlowNavigation`, `laneNavigationModel` | **SAFE SIMPLIFY** | Eliminar memo/flag/props | Siempre vacío desde B9.2 | Bajo |
| `DashboardKanbanBoard.tsx` | props `laneNavigationItems`, `suggestedFocusId` | **SAFE SIMPLIFY** | Eliminar props + render | Dead path | Bajo |
| `delivery-workflow-lanes.tsx` + lib | Experimental lanes | **SAFE DELETE** | Eliminar 4 archivos | 0 imports en app runtime | Bajo — docs históricos OX_3.5/3.6 |
| `priority-risk-lanes.tsx` + lib | Experimental lanes | **SAFE DELETE** | Eliminar 4 archivos | 0 imports en app runtime | Bajo |
| `queue-pressure.ts` | `getTodayActiveOrders` | **SAFE DELETE** | Eliminar alias | 0 consumidores TS; `getActiveOrdersInScope` activo | Bajo |
| `admin-dashboard-orders.module.css` | `:global(.admin-orders-lane-nav*)` etc. | **SAFE DELETE** | Quitar selectores | Componentes eliminados | Bajo |
| `DashboardToolbar` | `data-kanban-board`, `filterCluster` | **KEEP** | Sin cambio | B9.2 live — mobile vs desktop filters | — |
| `dashboard-kanban.module.css` | tablet 2-col, mobile rail | **KEEP** | Sin cambio | B9.2 responsive activo | — |
| `admin-dashboard-orders.tsx` | ~2700 LOC container | **DEFER** | No partir | Fuera de scope B9.4 | Medio si refactor |
| `lib/orders/lane-navigation-scanning.ts` | nombre de archivo | **DEFER** | Renombrar a util dedicado | Requiere mover imports — refactor menor | Bajo |
| `lib/orders/analytics.ts` | analytics helpers | **KEEP** | Sin cambio | Usado por top section / context | — |
| `lib/orders/dashboard-board-view-model.ts` | renderMode, groupedOrders | **KEEP** | Sin cambio | Core board; sin flow nav propio | — |
| `lib/orders/types.ts` | — | **KEEP** | N/A | Archivo no existe en repo | — |
| `filtered-list` render path | `renderMode !== kanban` | **KEEP** | Sin cambio | Mobile filter ≠ Todos sigue usando lista | — |
| Docs OX_3.5 / OX_3.6 | referencias a lanes experimentales | **KEEP** | Sin cambio | Documentación histórica | — |

## Archivos modificados

- `components/admin/orders/admin-dashboard-orders.tsx`
- `components/admin/orders/admin-dashboard-orders.module.css`
- `components/admin/orders/DashboardKanbanBoard.tsx`
- `lib/orders/lane-navigation-scanning.ts`
- `lib/orders/queue-pressure.ts`

## Archivos eliminados

- `components/admin/orders/lane-navigation-scanning.tsx`
- `components/admin/orders/lane-navigation-scanning.module.css`
- `components/admin/orders/delivery-workflow-lanes.tsx`
- `components/admin/orders/delivery-workflow-lanes.module.css`
- `components/admin/orders/priority-risk-lanes.tsx`
- `components/admin/orders/priority-risk-lanes.module.css`
- `lib/orders/delivery-workflow-lanes.ts`
- `lib/orders/priority-risk-lanes.ts`

## Archivos creados

- `docs/board-orders-execution-area-phase-b9-4.md`

## SAFE DELETE aplicado

1. **LaneNavigationScanning** — componente + CSS (~11 KB).
2. **DeliveryWorkflowLanes / PriorityRiskLanes** — prototipos B4 nunca cableados al dashboard (~28 KB lib + UI).
3. **`getTodayActiveOrders`** — alias deprecated sin consumidores.
4. **CSS huérfano** — selectores globales `admin-orders-lane-nav`, `priority-lanes`, `workflow-lanes` en `admin-dashboard-orders.module.css`.

## SAFE SIMPLIFY aplicado

1. **`laneNavigationModel` useMemo** — removido de container.
2. **`shouldRenderFlowNavigation`** — removido (flag congelado B9.2).
3. **`DashboardKanbanBoard`** — props y render de flow nav eliminados; solo kanban grid.
4. **`lib/orders/lane-navigation-scanning.ts`** — reducido a `buildLaneSectionId()` (anchor ids de lanes).

## KEEP decisions

- Toolbar `isKanbanBoardVisible` / `data-kanban-board` (B9.2).
- Kanban responsive CSS (B9.2 tablet 2-col, mobile rail).
- Scroll chaining B9.1 (`overscroll-behavior-y: auto`).
- `filtered-list` cuando `activeFilter !== "all"`.
- `activeFilterBanner` en desktop cuando filtered-list (kanban no visible).
- Analytics, board view model, session/realtime paths intactos.

## DEFER decisions

- **DEVX / B10 — Dashboard Container Split** — `admin-dashboard-orders.tsx` sigue ~2730 LOC.
- Renombrar `lane-navigation-scanning.ts` → util más semántico (ej. `lane-section-id.ts`).
- Actualizar docs históricos OX_3.5/3.6 que referencian archivos eliminados (no bloqueante).

## Imports/types cleaned

- Removidos imports `buildLaneNavigationModel`, `EMPTY_LANE_NAVIGATION_MODEL`.
- Removidos props `laneNavigationItems`, `suggestedFocusId` del kanban board.
- Removido export deprecated `getTodayActiveOrders`.
- Removidos tipos/constantes de lane navigation model del lib file.

## CSS cleanup

- Eliminado módulo `lane-navigation-scanning.module.css` completo.
- Eliminados módulos experimental lanes CSS.
- Limpiados selectores globales muertos en `admin-dashboard-orders.module.css`.
- **No tocado:** `dashboard-kanban.module.css`, `dashboard-toolbar.module.css` (reglas activas B9.1/B9.2).

## Qué se preservó

- kanban persistente
- tablet 2 columnas
- mobile stacked
- mobile filter compacto
- mobile lane rail lateral
- scroll chaining B9.1
- manual order flow
- realtime/hydration
- search/filter logic
- cards compactas

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
- cards behavior
- checkout público
- theme tokens/global CSS

## Riesgos encontrados

- Docs históricos (`OX_3.5`, `OX_3.6`, audit B4) referencian archivos eliminados — solo documentación, no runtime.
- Bundle dashboard bajó ~1.2 KB (43 kB vs 44.2 kB) — efecto secundario positivo.

## Validaciones ejecutadas

- `npm run build`: **pass** (exit 0)
- `npx tsc --noEmit`: **pass** (exit 0)
- `npm run lint`: **pass** — 0 errors / 16 warnings `no-img-element` (sin cambio)

## QA manual recomendado

Pendiente staging:

- Desktop: kanban 4 cols, sin “Estados del flujo”, search/filters en filtered-list.
- Tablet: 2 cols, sin scroll horizontal.
- Mobile: filtro compacto, rail lateral, sin flow summary.
- Manual order modal intacto.

## Deuda técnica restante

- Container monolítico `admin-dashboard-orders.tsx` (~2730 LOC).
- Renombrar util `lane-navigation-scanning.ts`.
- Staging QA final (B9 checklist).
- Docs OX históricos con paths obsoletos.

## Próxima fase recomendada

- **Staging QA final** / cierre roadmap operacional
- **DEVX / B10 — Dashboard Container Split** (opcional, no blocker)
- Próximo producto: Cash Closing / Session Reports / Delivery Mode / Kitchen Mode
