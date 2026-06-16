# Admin Dashboard Toolbar Phase T2 — Structure Refactor / Presentational Boundary

## Objetivo

Reducir la responsabilidad de `admin-dashboard-orders.tsx` creando una frontera presentacional clara para el bloque **Dashboard Execution Toolbar**, sin alterar comportamiento, layout visual, CSS ni copy visible de fases futuras (T4–T7).

## Contexto

- **T0** mapeó el estado real del toolbar y detectó concentración de responsabilidades en el container.
- **T1** congeló el contrato de producto (filtros, sesión, sync, context panel, scanning).
- **T2** extrae tipos, constantes y derivación presentacional del toolbar a un presenter puro, manteniendo handlers y side effects en el container.

## Archivos modificados

- `components/admin/orders/admin-dashboard-orders.tsx`
- `components/admin/orders/DashboardToolbar.tsx`

## Archivos creados

- `lib/orders/dashboard-execution-view-model.ts`
- `docs/admin-dashboard-toolbar-phase-t2.md`

## Cambio principal

Se introdujo un **presenter/view model puro** (`dashboard-execution-view-model.ts`) y el container lo consume vía `useMemo`. `DashboardToolbar` pasa a recibir un `viewModel` consolidado más handlers separados (Opción A), en lugar de múltiples props dispersas de estado derivado.

## Presenter / View Model creado

`lib/orders/dashboard-execution-view-model.ts`:

- Sin React, router, hooks, server actions, Supabase, DOM ni side effects.
- Exporta tipos de filtros, constantes, `resolveDashboardExecutionFilter()` y `buildDashboardExecutionToolbarViewModel()`.
- El builder agrupa labels/flags de sesión, sync y scope tal como existían en el JSX previo.
- Comentario interno marca copy de sesión/sync para alineación en **T4** (sin cambiar UI en T2).

## Constantes extraídas

Desde `admin-dashboard-orders.tsx` hacia el view model:

- `OrdersFilter` → alias de `DashboardExecutionFilterId`
- `FILTER_OPTIONS` → `DASHBOARD_EXECUTION_FILTER_OPTIONS`
- `FILTER_LABELS` → `DASHBOARD_EXECUTION_FILTER_LABELS`
- `resolveOrdersFilter` → `resolveDashboardExecutionFilter`
- `VALID_FILTERS` → `VALID_DASHBOARD_EXECUTION_FILTERS` (interno al módulo)

IDs congelados: `all`, `pending`, `preparing`, `ready`, `delivery`, `pickup`.

## DashboardToolbar boundary

**Antes:** props dispersas (`filterOptions`, `activeFilter`, `operationalWindowLabel`, flags de sesión, labels implícitos en JSX).

**Después:**

```ts
viewModel: DashboardExecutionToolbarViewModel;
onSearchChange / onFilterSelect / onOpenStoreSession / onCloseStoreSession / onManualStoreSessionResync
```

La estructura DOM y clases CSS del toolbar no cambiaron intencionalmente.

## Qué se preservó

- search behavior
- filter URL sync
- filter IDs
- session open/close behavior
- manual session hydration behavior
- scanning behavior
- empty states
- context panel scope
- top section

## Qué NO se tocó

- CSS/layout
- premium visual polish
- copy T4/T5/T6/T7
- realtime internals
- server actions
- DB/Supabase
- order cards
- order modal
- audio unlock
- theme bootstrap

## Comportamiento preservado

- Búsqueda operacional instantánea (client-side).
- Filtros con sync a URL `?filter=`.
- Controles de sesión (abrir/cerrar, pending labels, confirm al cerrar con pedidos activos).
- Refresh manual = hydrate session (`handleManualStoreSessionResync`).
- Copy visible actual del toolbar (p. ej. `Negocio abierto`, `Jornada actual`, `Actualizar sesión`).
- Dead code de filter panel compacto conservado para **T9** (`isFilterPanelOpen`, `filterMenuRef`, `handleFilterMenuToggle`, `filterTriggerLabel`, `hasActiveCompactFilter`).

## Riesgos encontrados

- Refactor estructural con muchas props previas: mitigado usando builder que replica la lógica condicional del JSX original de sesión.
- Alias `OrdersFilter` mantenido en el container para minimizar diffs en handlers existentes.

## Deuda técnica restante

- **T3:** desktop layout del toolbar.
- **T4:** session controls polish + copy contract (`Sincronizar sesión`, etc.).
- **T5:** search/filter UX polish.
- **T6:** scanning operacional integration (`Estados del flujo`).
- **T7:** empty/context copy review.
- **T9:** cleanup de dead code del filter panel compacto.

## Validaciones ejecutadas

- `npx tsc --noEmit`: **pass** (exit 0)
- `npm run lint`: **no configurado** — `next lint` abre setup interactivo de ESLint (Strict/Base/Cancel); no se completó para evitar cambiar configuración del proyecto
- `npm run build`: **pass** (Next.js 15.3.0, compiled successfully)

## QA manual recomendado

En `/admin/dashboard`:

### Search

1. Escribir en search.
2. Confirmar que filtra igual que antes.
3. Confirmar chips si existen.
4. Confirmar limpiar búsqueda.

### Filters

5. Click en `Todos`.
6. Click en `Pendientes`.
7. Click en `Preparando`.
8. Click en `Listos`.
9. Click en `Delivery`.
10. Click en `Retiro`.
11. Confirmar URL `?filter=`.
12. Confirmar que reload conserva filtro.

### Session controls

13. Confirmar estado de sesión se ve igual que antes.
14. Abrir sesión si es seguro.
15. Cerrar sesión si es seguro.
16. Confirmar pending labels igual que antes.
17. Confirmar confirm dialog al cerrar con pedidos activos si aplica.

### Refresh / resync

18. Click refresh.
19. Confirmar que sigue ejecutando hydrate session.
20. Confirmar pending/disabled igual que antes.

### Scanning

21. Confirmar `Scanning operacional` se sigue viendo igual.
22. Confirmar chips/scroll funcionan igual.

### Empty/context

23. Confirmar empty state sin pedidos.
24. Confirmar empty filtrado.
25. Confirmar `Resumen operativo` y `Actividad reciente` siguen renderizando igual.

### No regresión

26. Top section intacto.
27. Lanes/cards intactos.
28. Order modal intacto.
29. Realtime intacto.
30. No errores de consola.

## Próxima fase recomendada

**T3 — Desktop Layout** del Dashboard Execution Toolbar, usando la frontera `DashboardExecutionToolbarViewModel` ya establecida.
