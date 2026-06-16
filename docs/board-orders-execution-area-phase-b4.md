# Board / Orders Execution Area — Phase B4 — Flow Navigation / Lanes IA Decision

## Objetivo

Aplicar la decisión IA mínima sobre lanes y flow navigation: mantener status kanban como MVP, jerarquizar completed/cancelled como lanes secundarias, y refinar cuándo aparece `Estados del flujo` — sin tocar cards, realtime ni context panel B3.

## Contexto

- **B1** diferió completed/cancelled y modelos alternativos de lanes.
- **B3** ocultó flow nav en empties e integró context panel con scope explícito.
- **B4** decide e implementa jerarquía core/secondary y reglas de visibilidad del flow nav.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `lib/orders/dashboard-board-view-model.ts` | `laneKind`, `isCoreLane`, `isSecondaryLane` en `groupedOrders` |
| `lib/orders/lane-navigation-scanning.ts` | `laneKind` en items del modelo de navegación |
| `components/admin/orders/admin-dashboard-orders.tsx` | `shouldRenderFlowNavigation` requiere `> 1` lane |
| `components/admin/orders/DashboardKanbanBoard.tsx` | Clase/data-attribute secondary en lanes |
| `components/admin/orders/lane-navigation-scanning.tsx` | Clase/data-attribute secondary en items nav |
| `components/admin/orders/dashboard-kanban.module.css` | Estilo `.laneSecondary` |
| `components/admin/orders/lane-navigation-scanning.module.css` | Estilo `--secondary`; limpieza CSS `--empty` muerto (B3) |

## Archivos creados

| Archivo | Rol |
|---------|-----|
| `docs/board-orders-execution-area-phase-b4.md` | Este documento |

## Decisión principal

**Mantener status kanban como modelo principal del MVP.**

No wirear modelos alternativos. No ocultar completed/cancelled. No colapsar sección secondary todavía.

## Lanes IA

| Clasificación | Status |
|---------------|--------|
| Core | `pending`, `preparing`, `ready` |
| Secondary | `completed`, `cancelled` |

Orden preservado: pending → preparing → ready → completed → cancelled.

## Core lanes

Flujo operativo vivo. Sin cambio de labels, grouping ni filtros. Visualmente dominantes (estilo default del kanban).

## Secondary lanes

Cierre operativo / excepción. Siguen visibles si tienen pedidos. Tratamiento visual más liviano (opacity + tipografía secundaria) en kanban y lane nav.

## Completed / Cancelled Decision

| Opción | Decisión | Motivo |
|--------|----------|--------|
| A — Mantener como lanes normales | Rechazada por ahora | Compiten con flujo vivo |
| B — Colapsar secondary section | Diferida | Requiere IA visual mayor |
| C — Ocultar del kanban | Rechazada por ahora | Podría esconder información útil |
| **B-lite — Mantener visibles como secundarias** | **Aceptada B4** | Menor riesgo, mejor jerarquía |

`completed` / `cancelled` se mantienen visibles si tienen pedidos, pero se visualizan como cierre operativo secundario.

## Flow Navigation Rules

`Estados del flujo` aparece **solo** cuando:

```txt
renderMode === "kanban" && groupedOrders.length > 1
```

No aparece cuando:

- empty global / sesión-jornada / filtrado-search
- filtered list
- kanban con una sola lane visible

## Lane Navigation Metadata

- Input `groupedOrders` incluye `laneKind` desde view model.
- Output `LaneNavigationItem.laneKind`: `"core" | "secondary"`.
- Componente aplica `admin-orders-lane-nav__item--secondary` y `data-lane-kind`.

## Kanban Visual Hierarchy

- `DashboardBoardGroupedOrder.laneKind` propagado a cada `<section>` lane.
- Clase `laneSecondary` + `data-lane-kind="secondary"` en completed/cancelled.
- Cards internas sin cambios.

## Alternative Lane Models

Auditoría B4 — **no cableados en runtime**:

| Componente / lib | Estado |
|------------------|--------|
| `components/admin/orders/delivery-workflow-lanes.tsx` | Experimental, sin import en dashboard |
| `components/admin/orders/priority-risk-lanes.tsx` | Experimental, sin import en dashboard |
| `lib/orders/delivery-workflow-lanes.ts` | Experimental |
| `lib/orders/priority-risk-lanes.ts` | Experimental |

B4 los mantiene fuera del runtime. No se borran.

## CSS Adjustments

**Kanban (`dashboard-kanban.module.css`):**

- `.laneSecondary` — opacity 0.86
- `.laneSecondary .laneTitle` / `.laneCount` — `--text-secondary`

**Lane nav (`lane-navigation-scanning.module.css`):**

- `.admin-orders-lane-nav__item--secondary` — opacity 0.78, label font-weight 500
- Removidas clases muertas `--empty`, `__empty-status`, `__empty-pill` (shell B3 eliminado)

Sin cambio de min-width, responsive global ni card styling.

## Comportamiento preservado

- Cards siguen igual.
- Search/filter behavior sigue igual.
- Context panel sigue igual desde B3.
- Empty states siguen igual desde B3.
- Realtime/hydration/optimistic no cambian.
- Manual sync no cambia.
- Toolbar no cambia.
- Top section no cambia.

## Qué NO se cambió

- card UI
- quick actions
- status/assignment logic
- realtime
- hydration
- optimistic callbacks
- server actions
- DB/Supabase
- toolbar
- top section
- modal/detail
- route JSON
- DeliveryWorkflowLanes runtime
- PriorityRiskLanes runtime
- `/admin/categories`

## Compatibilidad con B1/B2/B3

| Fase | Contrato | B4 |
|------|----------|-----|
| B1 | Status kanban MVP | ✅ Mantenido |
| B2 | View model groupedOrders | ✅ Extendido con laneKind |
| B3 | Empty sin flow nav; context labeling | ✅ No revertido |
| B3 | Flow nav con lanes | ✅ Refinado a `> 1` lane |

## Riesgos encontrados

- Una sola lane visible (p. ej. solo `pending`) ya no muestra flow nav — intencional B4.
- Secondary styling via opacity puede afectar legibilidad en temas de bajo contraste; ajuste fino posible en B5+.

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npm run build` | Pass (exit 0) |
| `npx tsc --noEmit` | Pass (exit 0) |
| `npm run lint` | Pass — 0 errors / 16 warnings `@next/next/no-img-element` |

## QA manual recomendado

1. `filter=all` + varias lanes → flow nav visible.
2. Una sola lane → flow nav oculto.
3. Empty global/day-scope → sin flow nav (B3).
4. Empty filtrado → igual B3.
5. pending/preparing/ready → lanes principales.
6. completed/cancelled con pedidos → visibles, estilo secundario.
7. Cards, quick actions, optimistic, manual sync sin cambios.

**Estado QA manual:** pendiente.

## Deuda técnica restante

- Colapsar sección secondary (opción B) — diferida.
- Wire o delete de `DeliveryWorkflowLanes` / `PriorityRiskLanes` — post-B4.
- Constantes `LANE_NAVIGATION_EMPTY_*` en lib siguen exportadas sin uso runtime.
- Variant `compact` del context panel (B3).

## Próxima fase recomendada

**B5 — Order Cards Operational UX Pass**
