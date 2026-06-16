# Board / Orders Execution Area — Phase B8.3 — Lane Height & Lane Header Simplification

## Objetivo

Ajustar el kanban desktop para consola operacional: columnas más altas, scroll interno, header limpio (título + count) sin micro-resúmenes redundantes.

## Contexto

- **B8.2** simplificó toolbar/flow nav y full-width 4 lanes.
- **B8.3** pulido final de altura y header antes de **B9**.

## Problemas detectados

Después de B8.2, las columnas eran correctas en estructura pero no ocupaban suficiente altura de pantalla. Además, el micro-resumen de cada lane duplicaba información ya presente en la card, el count badge y el context panel.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `components/admin/orders/DashboardKanbanBoard.tsx` | Eliminado `LaneMetricsLayer`; prop `groupedLaneMetrics` removida |
| `components/admin/orders/dashboard-kanban.module.css` | Altura desktop clamp ~780px max; lane height 100%; empty state spacing |
| `components/admin/orders/admin-dashboard-orders.tsx` | Removido `groupedLaneMetrics` useMemo y prop (dead code kanban) |

## Archivos creados

| Archivo | Rol |
|---------|-----|
| `docs/board-orders-execution-area-phase-b8-3.md` | Este documento |

## Cambios aplicados

1. **Lane header** — solo título + count badge.
2. **Micro-resumen eliminado** — `LaneMetricsLayer` ya no se renderiza en kanban.
3. **Altura desktop** — `height: clamp(40rem, calc(100dvh - 13rem), 48.75rem)` (~780px max).
4. **Lane fill** — `.lane { height: 100%; min-height: 0 }` en desktop.
5. **Scroll interno** — `laneBody` flex + overflow-y auto preservado.
6. **Dead code** — `groupedLaneMetrics` removido del container; `filteredLaneMetrics` intacto para filtered-list.

## Lane header simplification

```txt
PENDIENTES                    [0]
PREPARANDO                    [1]
```

Sin línea de métricas (`pedidos · riesgo · asignados`).

## Removed lane micro-summary

- Componente removido: `LaneMetricsLayer` en `DashboardKanbanBoard` only.
- `lib/orders/lane-metrics.ts` sin cambios.
- Filtered-list sigue usando `LaneMetricsLayer` vía `filteredLaneMetrics`.

## Desktop lane height

```css
height: clamp(40rem, calc(100dvh - 13rem), 48.75rem);
min-height: 34rem;
```

Flexible, no 780px rígido.

## Internal lane scroll preservation

- `.laneHeader`: `flex: 0 0 auto`
- `.laneBody`: `flex: 1 1 auto; min-height: 0; overflow-y: auto`
- Una lane con muchos pedidos no empuja altura de hermanas.

## Empty lane state

- Copy **Sin pedidos** sin cambio.
- Desktop: `margin-block-start: 0.5rem` para aire sutil.
- No centrado vertical completo.

## Desktop full-width preservation

- B8.2 grid 4/5 lanes sin cambio.
- `data-lane-count="4"`: sin scroll horizontal.
- `data-lane-count="5"`: scroll aceptable.

## Tablet / mobile preservation

- Tablet 768–1199: altura moderada B8.1/B8.2 sin 780px forzado.
- Mobile ≤767: stack B7; lane body overflow visible; empty persistent ocultas.

## Comportamiento preservado

- Status workflow igual.
- Assignment behavior igual.
- Quick actions iguales.
- Realtime/hydration/optimistic igual.
- Manual sync igual.
- Search behavior igual.
- ActiveFilter logic igual.
- Context panel igual.
- Empty global/day-scope igual.
- Toolbar session/sync igual.
- Top section/modal iguales.
- B8.2 desktop simplification intacta.

## Qué NO se cambió

- realtime
- hydration
- optimistic callbacks
- server actions
- DB/Supabase
- route JSON
- toolbar
- top section
- modal/detail
- card data
- card UX B5/B8
- quick action behavior
- status/assignment logic
- search/filter behavior
- image optimization / no-img-element

## Compatibilidad con B1/B2/B3/B4/B5/B6/B7/B8/B8.1/B8.2

| Fase | B8.3 |
|------|------|
| B8.2 full-width | Preservado |
| B8.1 persistent lanes | Preservado |
| B8.2 toolbar/flow nav | Sin tocar |
| Filtered-list metrics | `filteredLaneMetrics` intacto |

## Riesgos encontrados

- `100dvh` — fallback implícito vía clamp min 34rem en viewports antiguos.
- Operadores pierden resumen lane-level — mitigado por cards + context panel.

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npm run build` | ✓ pass (1er intento falló por error transitorio `_not-found`) |
| `npx tsc --noEmit` | ✓ pass |
| `npm run lint` | ✓ pass — 0 errors / 16 warnings `no-img-element` |

## QA manual recomendado

1. Desktop: columnas altas, header limpio, scroll interno, sin micro-resumen.
2. 4 lanes full width sin scroll horizontal.
3. B8.2 toolbar/flow nav ocultos desktop.
4. Filtered-list con métricas si aplica.
5. Mobile/tablet sin regresión.

**Estado QA manual:** pendiente.

## Deuda técnica restante

- QA manual pre-B9.
- Métricas lane-level solo en filtered-list y context panel.

## Próxima fase recomendada

**B9 — Final QA / Production Readiness**
