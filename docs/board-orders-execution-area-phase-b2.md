# Board / Orders Execution Area — Phase B2 — View Model Boundary

## Objetivo

Extraer derivaciones puras del Board desde `admin-dashboard-orders.tsx` hacia un view model puro y testeable (`lib/orders/dashboard-board-view-model.ts`), manteniendo exactamente el mismo comportamiento visible. Preparar B3 sin aplicar cambios de UX.

## Contexto

- **B0** auditó el container monolítico (~2,486 LOC) mezclando estado, realtime, derivaciones y render.
- **B1** congeló el contrato de producto: context panel = vista actual del Board; empty sin flow nav; lanes MVP por status.
- **B2** implementa el límite arquitectónico: board derivations → view model; container conserva side effects e I/O.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `components/admin/orders/admin-dashboard-orders.tsx` | Reemplazo de cadenas `useMemo` inline por `buildDashboardBoardViewModel`; eliminación de `GROUP_ORDER` / `GROUP_LABELS` y memos day-scoped usados solo para search |

## Archivos creados

| Archivo | Rol |
|---------|-----|
| `lib/orders/dashboard-board-view-model.ts` | View model puro del Board |
| `docs/board-orders-execution-area-phase-b2.md` | Este documento |

## Qué se extrajo

- `visibleOperationalOrders` — `getOrdersInOperationalWindow(orders, operationalWindow)`
- `baseFilteredOrders` — filtro por `activeFilter` (status / delivery / pickup / all)
- `filteredOrders` — search vía `parseOperationalSearch` + `matchesOperationalSearch` (incluye risk assessments day-scoped para search)
- `parsedSearchQuery`
- `groupedOrders` — kanban por status (`pending` → `cancelled`), solo lanes non-empty
- Empty flags: `isOperationalEmpty`, `isDayScopeEmpty`, `isFilteredEmpty`, `hasAnyOrders`, `hasOrdersInScope`, `hasVisibleOrders`
- `renderMode`: `operational-empty` | `day-scope-empty` | `filtered-empty` | `kanban` | `filtered-list`
- Metadata B3 (no renderizada aún): `contextScope`, `contextScopeLabel`, `activeFilterLabel`, `hasSearchQuery`, `hasActiveFilter`, `shouldRenderKanban`, `shouldRenderFilteredList`
- Constantes board: `BOARD_GROUP_ORDER`, `BOARD_GROUP_LABELS` (privadas en view model)

## Qué quedó en el container

- Realtime subscriptions (`useAdminOrdersRealtime`, `useAdminStoreSessionRealtime`)
- Hydration / recovery (`useEffect`, session actions)
- Optimistic mutation handlers y patches
- Toolbar state, URL filter, search input, manual sync
- Modal routing (`openOrder`, `selectedOrderId`, `AdminOrderWorkspaceModal`)
- Notifications / audio / toast / new-order effects
- Server action calls
- `operationalWindow` computation (depende de `activeStoreSessionState`, `liveOperationalNow`)
- Top section view model (`buildDashboardTopSectionViewModel`)
- Context panel metrics derivadas de `filteredOrders` (`commercialAnalytics`, `operationalMetrics`, insights, feed, lane metrics)
- `buildLaneNavigationModel` (depende de `groupedOrders`, `currentUserRole`)
- Presence hooks

## Nuevo view model

Función principal:

```ts
buildDashboardBoardViewModel(input: DashboardBoardViewModelInput): DashboardBoardViewModel
```

Helpers privados:

- `filterOrdersByActiveFilter`
- `applyOperationalSearch`
- `buildGroupedBoardOrders`
- `resolveBoardRenderMode`
- `resolveContextScope`
- `resolveContextScopeLabel`

## Inputs del view model

| Input | Origen en container |
|-------|---------------------|
| `orders` | `optimisticOrders` |
| `activeFilter` | toolbar / URL |
| `searchQuery` | toolbar local state |
| `operationalWindow` | `getOperationalWindow(liveOperationalNow, …)` |
| `now` | tick 60s |
| `currentUserId` | props |

## Outputs del view model

Ver tipos exportados en `lib/orders/dashboard-board-view-model.ts`:

- `DashboardBoardViewModel`
- `DashboardBoardRenderMode`
- `DashboardBoardContextScope`
- `DashboardBoardGroupedOrders`

## Comportamiento preservado

- Empty states visibles siguen igual (incl. `Estados del flujo` en empty — deuda B3).
- Context panel sigue recibiendo `filteredOrders`.
- Flow navigation sigue con visibilidad actual (`activeFilter === "all" && hasVisibleOrders`).
- Lanes/status grouping sigue igual (5 status, non-empty lanes only).
- Search/filter behavior sigue igual (misma lógica de risk + averageTicket para search).
- Manual sync no cambia.
- Realtime/hydration/optimistic no cambian.
- Top section sigue usando `visibleOperationalOrders` del mismo criterio operativo.

## Qué NO se cambió

- UX visible
- CSS
- toolbar
- top section layout/copy
- order cards
- order modal
- realtime
- hydration
- optimistic callbacks
- server actions
- DB/Supabase
- route JSON

## Compatibilidad con B1

- B1 define semántica de context scope labels — B2 las expone en `contextScope` / `contextScopeLabel` sin renderizarlas.
- B1 define empty sin flow nav — B2 expone `renderMode` pero no altera branching de render.
- B1 congela lanes MVP — B2 preserva `BOARD_GROUP_ORDER` equivalente al container previo.

## Preparación para B3

B3 puede consumir:

- `renderMode` para ocultar flow nav en empty
- `contextScope` / `contextScopeLabel` para labeling del context panel
- `shouldRenderKanban` / `shouldRenderFilteredList` para branching explícito

Sin tocar derivaciones puras nuevamente.

## Riesgos encontrados

- Search filtering recalcula risk assessments day-scoped dentro del view model (mismo costo que antes en container, determinístico).
- `boardViewModel` debe declararse después de `operationalWindow` y antes de derivaciones que usan `filteredOrders` / `visibleOperationalOrders`.
- Metadata B3 (`contextScopeLabel`) no se usa en render — evitar dead-code lint en container hasta B3.

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npm run build` | Compilación y typecheck OK; fallo en `collecting page data` por error preexistente en `/admin/categories` (`PageNotFoundError: Cannot find module for page`) — no relacionado con B2 |
| `npx tsc --noEmit` | Pass (exit 0) |
| `npm run lint` | Pass — 0 errors / 16 warnings `@next/next/no-img-element` (baseline DEVX-2) |

## QA manual recomendado

1. Abrir `/admin/dashboard`
2. Confirmar board idéntico al pre-B2
3. Probar filtros: Todos, Pendientes, Preparando, Listos, Delivery, Retiro
4. Probar search y empty filtrado
5. Confirmar empty global/day-scope sin cambio
6. Confirmar `Estados del flujo` igual que antes en empty (deuda conocida)
7. Abrir pedido, cambiar estado, optimistic update
8. Manual sync — search/filter no se resetean
9. Context panel igual
10. Mobile rápido si hay entorno

**Estado QA manual:** pendiente (sin sesión local verificada en esta ejecución).

## Próxima fase recomendada

**B3 — Empty + Context Panel Integration** — aplicar contrato B1: ocultar flow nav en empty, labeling explícito del context panel.
