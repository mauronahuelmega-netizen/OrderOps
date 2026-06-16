# Board / Orders Execution Area — Phase B8.6 — Persistent Kanban Empty State

## Objetivo

Hacer que el estado vacío global del Board conserve la estructura de kanban persistente, con ayuda contextual compacta en lugar de reemplazar el tablero.

## Contexto

- **B8.1** introdujo kanban persistente (4 columnas fijas).
- **B8.4/B8.5** extendieron kanban a búsqueda con/sin resultados.
- Empty global (`operational-empty` / `day-scope-empty`) seguía renderizando caja horizontal grande.

## Problema detectado

El empty global reemplazaba el tablero por una caja horizontal, rompiendo la continuidad visual del kanban persistente.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `lib/orders/dashboard-board-view-model.ts` | Flags `shouldRenderPersistentEmptyKanban`, `emptyBoardKind`; groupedOrders vacíos; `shouldRenderKanban` extendido |
| `components/admin/orders/admin-dashboard-orders.tsx` | Kanban + helper compacto en empty global/day-scope |
| `components/admin/orders/DashboardKanbanBoard.tsx` | `data-empty-board` attribute |
| `components/admin/orders/admin-dashboard-orders.module.css` | Estilos `.emptyBoardHelper*` |

## Archivos creados

| Archivo | Rol |
|---------|-----|
| `docs/board-orders-execution-area-phase-b8-6.md` | Este documento |

## Decisión IA aplicada

La vista principal del Board conserva estructura de kanban incluso sin pedidos. El empty global se convierte en ayuda contextual compacta debajo del board.

Opción B: mantener `renderMode` existente + flags presentacionales.

## Render mode / flags

```ts
shouldRenderPersistentEmptyKanban =
  activeFilter === "all" &&
  !hasSearchQuery &&
  (isOperationalEmpty || isDayScopeEmpty);

emptyBoardKind = "operational" | "day-scope" | null;
shouldRenderKanban = renderMode === "kanban" || shouldRenderPersistentEmptyKanban;
```

`renderMode` sigue siendo `operational-empty` / `day-scope-empty` para semántica y context panel.

## Persistent empty kanban

- `groupedOrders`: pending, preparing, ready, completed con `orders: []`.
- Lanes muestran **Sin pedidos** (sin búsqueda activa).
- `data-empty-board="true"` en `boardWrapper`.

## Empty helper compact

Debajo del kanban:

- **Operational:** Todavía no hay pedidos. Los nuevos ingresos aparecerán automáticamente.
- **Day-scope sesión:** No hay pedidos en la sesión actual.
- **Day-scope jornada:** No hay pedidos en la jornada actual.

CTAs preservados: Ver catálogo, Gestionar productos (mismos permisos/destinos).

## Day-scope empty behavior

Mismo contrato que operational empty cuando `filter=all` y sin búsqueda: kanban vacío + helper compacto.

## Search / filtered empty compatibility

- B8.4: búsqueda sin resultados → kanban + "Sin resultados".
- B8.5: sin chip bajo input; scope sin cambios.
- Filtro específico sin resultados → `filtered-empty` global (sin cambio).
- Fallback a caja empty legacy si `activeFilter !== "all"` en operational/day-scope empty.

## Mobile / tablet behavior

Mobile B7 oculta lanes persistentes vacías; el helper compacto provee feedback. Desktop (prioridad B8.6) muestra 4 columnas + helper.

## Context panel behavior

Oculto en `operational-empty` / `day-scope-empty` (sin cambio B3). No métricas pesadas.

## Flow navigation behavior

`shouldRenderFlowNavigation` false cuando `shouldRenderPersistentEmptyKanban` (no Estados del flujo en empty).

## Comportamiento preservado

- Search-aware kanban B8.4.
- Search scope cleanup B8.5.
- Status workflow igual.
- Assignment behavior igual.
- Quick actions iguales.
- Realtime/hydration/optimistic igual.
- Manual sync igual.
- Toolbar session/sync igual.
- Top section/modal iguales.

## Qué NO se cambió

- realtime
- hydration
- optimistic callbacks
- server actions
- DB/Supabase
- route JSON
- toolbar UI
- top section
- modal/detail
- card data
- card UX B5/B8
- quick action behavior
- status/assignment logic
- image optimization / no-img-element

## Compatibilidad con B1/B2/B3/B4/B5/B6/B7/B8/B8.1/B8.2/B8.3/B8.4/B8.5

- B8.1 persistent lanes: base del empty kanban.
- B8.4 search-aware: intacto.
- B8.5 search scope: intacto.
- B8.2 flow nav oculto desktop: intacto en empty.

## Riesgos encontrados

- Mobile puede mostrar sólo helper sin columnas visibles (decisión documentada).
- `activeFilter !== "all"` con zero orders mantiene empty legacy box.

## Validaciones ejecutadas

- `npm run build`
- `npx tsc --noEmit`
- `npm run lint`

## QA manual recomendado

Ver checklist prompt B8.6 (empty global, day-scope, search, functional, responsive).

**Estado:** pendiente.

## Deuda técnica restante

- QA manual pendiente.
- 16 warnings `no-img-element` preexistentes.

## Próxima fase recomendada

**B9 — Final QA / Production Readiness**
