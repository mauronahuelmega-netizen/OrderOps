# Board / Orders Execution Area — Phase B8.4 — Search-Aware Persistent Kanban Results

## Objetivo

Ajustar la búsqueda al modelo de kanban persistente desktop: filtrar dentro de las columnas fijas sin reemplazar el tablero por un empty global.

## Contexto

- **B8.1** introdujo lanes persistentes (`pending`, `preparing`, `ready`, `completed`) con empty lane state "Sin pedidos".
- **B8.2/B8.3** simplificaron toolbar y altura de columnas.
- El view model seguía usando `filtered-empty` cuando `filteredOrders.length === 0`, incluso con `activeFilter === "all"` y búsqueda activa.

## Problema detectado

Con el tablero desktop persistente, una búsqueda sin resultados reemplazaba todo el kanban por un empty global filtrado, rompiendo el mapa mental del flujo.

```txt
No hay pedidos que coincidan con esta búsqueda o filtro.
```

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `lib/orders/dashboard-board-view-model.ts` | `resolveBoardRenderMode`: `activeFilter === "all"` → `kanban` antes de `filtered-empty` |
| `components/admin/orders/admin-dashboard-orders.tsx` | `isSearchEmptyKanban`, context panel empty variant, `emptyLaneLabel` / `isSearchEmpty` props |
| `components/admin/orders/DashboardKanbanBoard.tsx` | Prop `emptyLaneLabel`, `data-search-empty` en `boardWrapper` |
| `components/admin/orders/dashboard-kanban.module.css` | Mobile: mostrar lanes vacías persistentes cuando `data-search-empty="true"` |

## Archivos creados

| Archivo | Rol |
|---------|-----|
| `docs/board-orders-execution-area-phase-b8-4.md` | Este documento |

## Decisión IA aplicada

Cuando `activeFilter === "all"`, la búsqueda filtra dentro del kanban persistente. Las lanes permanecen visibles y muestran resultados en su estado correspondiente o "Sin resultados".

Cuando `activeFilter !== "all"` y no hay resultados, se preserva `renderMode = "filtered-empty"`.

## Render mode changes

Orden actualizado en `resolveBoardRenderMode`:

```txt
operational-empty → day-scope-empty → kanban (if filter=all) → filtered-empty → filtered-list
```

Implicaciones:

- Búsqueda con `filter=all` y 0 matches: `renderMode = "kanban"`.
- Filtro específico sin matches: `renderMode = "filtered-empty"` (sin cambio).

## Search-aware kanban behavior

Pipeline sin cambios:

```txt
search/filter → filteredOrders → groupedOrders
```

`groupedOrders` ya se construía desde `filteredOrders`; cada pedido match aparece en su lane real. Lanes sin matches quedan vacías (`isEmpty: true`).

## Empty lane labels

| Condición | Copy lane vacía |
|-----------|-----------------|
| Búsqueda activa | Sin resultados |
| Sin búsqueda | Sin pedidos |

Prop `emptyLaneLabel` pasada desde el container; sin CTA, icono ni aria-live.

## Context panel behavior

`isSearchEmptyKanban = renderMode === "kanban" && hasSearchQuery && filteredOrders.length === 0`

- `contextPanelVariant = "empty"` para `filtered-empty` o `isSearchEmptyKanban`.
- `shouldRenderFullContextPanel` omitido en ambos casos (sin métricas pesadas).
- `contextPanelScopeLabel = "Sin resultados para esta vista"` cuando variant es empty.

El view model ya resuelve `contextScope = "empty"` vía `isFilteredEmpty` para búsqueda sin resultados; `renderMode` y `contextScope` pueden divergir.

## Mobile / tablet behavior

B8.1 oculta lanes persistentes vacías en mobile (`display: none`). B8.4 agrega:

```css
.boardWrapper[data-search-empty="true"] .lane[data-lane-empty="true"][data-lane-persistent="true"] {
  display: flex;
}
```

Evita pantalla vacía sin explicación cuando la búsqueda no encuentra nada. Sin JS viewport detection.

## Comportamiento preservado

- Status workflow igual.
- Assignment behavior igual.
- Quick actions iguales.
- Realtime/hydration/optimistic igual.
- Manual sync igual.
- Search input igual.
- ActiveFilter logic igual.
- Toolbar session/sync igual.
- Top section/modal iguales.
- Card UX igual.

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

## Compatibilidad con B1/B2/B3/B4/B5/B6/B7/B8/B8.1/B8.2/B8.3

- B8.1 persistent lanes: intactas; empty copy ahora contextual.
- B8.2 filter safeguard / filtered-empty para filtros específicos: intacto.
- B8.3 lane height / header: intacto.
- B7 mobile stack: intacto salvo override search-empty.
- B3 context panel empty variant: extendido a search-empty kanban.

## Riesgos encontrados

- Flow navigation sigue visible con 4 lanes vacías en search-empty (comportamiento existente B7/B8.1).
- Búsqueda con resultados parciales muestra "Sin resultados" en lanes vacías aunque otras tengan pedidos (esperado).

## Validaciones ejecutadas

- `npm run build`
- `npx tsc --noEmit`
- `npm run lint`

## QA manual recomendado

### Desktop search with results

1. Abrir `/admin/dashboard`.
2. Tener al menos un pedido en `preparing`.
3. Buscar por cliente/producto que coincida.
4. Confirmar 4 columnas persistentes.
5. Pedido en su lane real; otras lanes "Sin resultados".

### Desktop search without results

6. Buscar término inexistente.
7. Confirmar 4 columnas con "Sin resultados".
8. No aparece empty global filtrado.
9. Context panel liviano / "Sin resultados para esta vista".

### Normal board

10. Limpiar búsqueda → lanes vacías "Sin pedidos".
11. Context panel normal.

### Active filters

12. `?filter=pending` sin resultados → filtered empty global (sin cambio).
13. Volver a Todos.

### Mobile/tablet

14. Búsqueda sin resultados: lanes visibles con "Sin resultados" (no pantalla en blanco).

### Functional sanity

15. Quick actions, modal, manual sync, realtime sin regresiones.

## Deuda técnica restante

- QA manual pendiente si no hay sesión local.
- 16 warnings `no-img-element` preexistentes.

## Próxima fase recomendada

**B9 — Final QA / Production Readiness**
