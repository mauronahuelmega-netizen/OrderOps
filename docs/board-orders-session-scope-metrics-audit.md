# Board Orders — Session Scope Metrics Audit (C1a)

## Objetivo

Auditar cómo las métricas del dashboard respetan el **scope operativo** (sesión de tienda vs jornada calendario) y detectar desalineaciones label/datos, sin modificar código.

## Archivos revisados

| Archivo | Rol |
|---------|-----|
| `components/admin/orders/admin-dashboard-orders.tsx` | Wiring de arrays, memos de métricas, top section, context panel |
| `lib/orders/dashboard-board-view-model.ts` | `visibleOperationalOrders`, `filteredOrders`, scope labels |
| `lib/orders/dashboard-top-section-view-model.ts` | KPIs e insights del top section |
| `lib/orders/analytics.ts` | `getOperationalWindow`, `getOrdersInOperationalWindow`, `getTodayOrders` |
| `lib/orders/metrics.ts` | `buildOperationalMetrics` |
| `lib/orders/queue-pressure.ts` | `buildOrdersQueuePressure`, `getTodayActiveOrders` |
| `lib/orders/business-insights.ts` | Insights del context panel |
| `lib/orders/operational-feed.ts` | Feed de actividad |
| `lib/orders/activity.ts` | Actividad reciente |
| `lib/orders/lane-metrics.ts` | Métricas por lane filtrado |
| `lib/orders/saturation-metrics.ts` | Saturación cocina (top section) |
| `docs/board-orders-execution-area-product-contract.md` | Contrato scope context panel |
| `docs/admin-dashboard-top-section-data-map.md` | Auditoría histórica D1 (referencia) |

## Hallazgo principal

**El desajuste P0 histórico (top section con `businessWindowOrders` mientras la UI decía “Sesión activa”) está resuelto en código actual.** El top section usa `visibleOperationalOrders` vía `buildDashboardTopSectionViewModel`.

Quedan **tres categorías de riesgo**:

1. **Split intencional top vs board** — top section ignora filtro/search; context panel usa `filteredOrders`. Es contrato de producto, no bug, pero puede confundir operadores.
2. **Doble filtro calendario en queue pressure** — `buildOrdersQueuePressure(filteredOrders)` vuelve a aplicar `getTodayOrders` (jornada 00:00–24:00) sobre un array ya acotado por sesión.
3. **Guard de cierre de sesión** — `hasActiveOrdersInProgress` escanea `optimisticOrders` completo, no el scope operativo.

## Cadena de scope (estado actual)

```txt
optimisticOrders                          [todos los pedidos cargados en cliente]
  ↓
operationalWindow = getOperationalWindow(liveOperationalNow, config, activeStoreSession)
  • store-session open → start = openedAt, end = now, source = "store-session"
  • else → jornada calendario DEFAULT_BUSINESS_WINDOW_CONFIG
  ↓
visibleOperationalOrders = getOrdersInOperationalWindow(orders, operationalWindow)
  ↓
baseFilteredOrders = filter by activeFilter (toolbar)
  ↓
filteredOrders = applyOperationalSearch(baseFilteredOrders, searchQuery)
```

| Array | Scope |
|-------|-------|
| `optimisticOrders` | Carga completa del tenant en dashboard |
| `visibleOperationalOrders` | Sesión activa o jornada actual |
| `filteredOrders` | Scope operativo + filtro tab + búsqueda |

**Nota:** `businessWindowOrders` ya **no existe** en el código; la documentación D1 está parcialmente obsoleta.

## Inventario de métricas por superficie

### Top section (`dashboardTopSectionViewModel`)

| Input | `visibleOperationalOrders` |
| Builders | `buildAdminOrdersAnalytics`, `buildOperationalMetrics`, `calculateSaturationIndex`, insights internos |
| Label UI | `Sesión activa` si `operationalWindow.source === "store-session"`, else `Jornada actual` |
| **Session scoped?** | **Sí** — alineado con label |
| Ignora filter/search | **Sí** — by design (T10 / D3) |

### Board — context panel

| Métrica | Input | Session scoped? |
|---------|-------|-----------------|
| `commercialAnalytics` | `filteredOrders` | Sí + filter + search |
| `operationalMetrics` | `filteredOrders` | Sí + filter + search |
| `operationalDashboardInsights` | `filteredOrders` | Sí + filter + search |
| `recentActivity` | `filteredOrders` | Sí + filter + search |
| `orderRiskAssessments` | `filteredOrders` | Sí + filter + search |
| `operationalSummaries` | derivado de lo anterior | Sí + filter + search |
| `businessInsights` | `filteredOrders` | Sí + filter + search |
| `operationalFeedItems` | `filteredOrders` | Sí + filter + search |
| `scopeLabel` | `contextScopeLabel` del board VM | Correcto por vista |

Contrato B1/B3: context panel = **vista actual del board**. Correcto técnicamente.

### Board — kanban / list / cards

| Superficie | Input |
|------------|-------|
| Kanban lanes | `groupedOrders` ← `filteredOrders` |
| Filtered list | `filteredOrders` |
| Lane metrics layer | `filteredOrders` + `queuePressure` |

### Queue pressure → lane metrics

| Campo | Builder | Input en wiring |
|-------|---------|-----------------|
| `queuePressure` | `buildOrdersQueuePressure` | `filteredOrders` |

Internamente:

```ts
getTodayActiveOrders(orders) → getTodayOrders(orders) → getOrdersInBusinessWindow(calendar day)
```

**Problema:** re-filtra por jornada calendario aunque `orders` ya venga session-scoped.

**Escenario:** sesión abierta ayer 23:00, pedido activo creado 23:30, ahora 01:00 hoy. El pedido está en `visibleOperationalOrders` / `filteredOrders`, pero `getTodayOrders` lo excluye (creado ayer). Queue pressure y lane metrics que dependen de `activeCount` pueden **subcontar**.

### Modal (integración)

| Campo | Input |
|-------|-------|
| `operationalMetrics` pasado al modal | Mismo memo `buildOperationalMetrics(filteredOrders)` |

Scope = vista board actual (filter + search), no solo sesión.

### Session close guard

```ts
hasActiveOrdersInProgress = optimisticOrders.some(status in pending|preparing|ready)
```

| Aspecto | Estado |
|---------|--------|
| Session scoped? | **No** |
| Riesgo | Puede bloquear/permitir cierre con pedidos activos fuera de la sesión visible, o contar pedidos legacy cargados en memoria |

## Por qué el D1 P0 ya no aplica

Antes (D1):

```txt
dashboardTopSectionViewModel ← businessWindowOrders   ❌
UI label ← "Sesión activa"                            ❌ mismatch
```

Ahora:

```tsx
buildDashboardTopSectionViewModel({
  orders: visibleOperationalOrders,
  operationalWindow,
  ...
})
```

Mobile (`DashboardMobileOverview`) consume el mismo view model (D9).

## Desalineaciones restantes (priorizadas)

| ID | Severidad | Tema | Detalle |
|----|-----------|------|---------|
| C1-01 | **P1** | Queue pressure | `getTodayActiveOrders` aplica calendario sobre array session-scoped |
| C1-02 | **P2** | Session close guard | `hasActiveOrdersInProgress` no usa `visibleOperationalOrders` |
| C1-03 | **P2** | Copy vs scope | Insights dicen “hoy” / “del dia” con datos de sesión (`delivery-dominance`, business-insights) |
| C1-04 | **P3** | Top vs context | KPIs top ≠ context cuando hay filtro/search activo — intencional, documentar en UI |
| C1-05 | **P3** | Activity labels | `activity.ts` no pasa `now` explícito al helper (deuda B8.10b opcional) |

## Heartbeat / `now`

| Mecanismo | Uso en métricas |
|-----------|-----------------|
| `now` tick 60s (`LIVE_PRESSURE_TICK_MS`) | Recalcula memos que dependen de `now`: `operationalMetrics`, `queuePressure`, risk, top section VM |
| `syncFreshnessTick` | Solo sync stale toolbar — no métricas de scope |

No se requiere heartbeat nuevo para scope; sí recalcular cuando cambia `operationalWindow` (apertura/cierre sesión).

## Memoization relevante

Los memos de métricas dependen de `filteredOrders` / `visibleOperationalOrders` / `operationalWindow` / `now`. No hay memo que congele scope incorrecto; el problema es **input array + helpers internos**, no stale React memo.

## Fix mínimo recomendado (C1b)

Sin implementar en C1a. Prioridad sugerida:

### C1b-1 — Queue pressure session-safe (P1)

En `lib/orders/queue-pressure.ts`:

- Reemplazar `getTodayActiveOrders` por filtro directo de activos sobre el array recibido, **sin** `getTodayOrders`, cuando el caller ya pasó orders scoped.
- Alternativa: nuevo helper `getActiveOrdersInScope(orders)` sin segundo filtro calendario.

Archivos: `lib/orders/queue-pressure.ts` (y tests si existen).

### C1b-2 — Session close guard (P2)

En `admin-dashboard-orders.tsx`:

```ts
visibleOperationalOrders.some(active status)
```

en lugar de `optimisticOrders.some(...)`.

Archivo: `admin-dashboard-orders.tsx` (fuera del allow-list estricto de card-only phases — OK para C1b).

### C1b-3 — Copy alignment (P2)

Ajustar strings “hoy” → “en esta sesión” / “en la jornada” según `operationalWindow.source` en:

- `dashboard-top-section-view-model.ts` (insights delivery/pickup dominance)
- `business-insights.ts` (ticket alto “del dia”)

Solo copy/presenter — sin cambiar fórmulas.

### C1b-4 — Documentar split top/context (P3)

Tooltip o sublabel en top section: “Métricas de la sesión/jornada completa, no de la vista filtrada.”

Opcional producto; puede ser doc-only en C1b.

## Archivos que debería tocar C1b

| Archivo | Cambio |
|---------|--------|
| `lib/orders/queue-pressure.ts` | Eliminar doble filtro calendario |
| `components/admin/orders/admin-dashboard-orders.tsx` | Session close guard scoped |
| `lib/orders/dashboard-top-section-view-model.ts` | Copy sesión vs jornada |
| `lib/orders/business-insights.ts` | Copy sesión vs jornada |
| `docs/board-orders-execution-area-phase-c1b.md` | Documentación fix |

Opcional: `lib/orders/activity.ts` (`now` explícito — deuda B8.10b).

## Riesgos

| Riesgo | Nota |
|--------|------|
| Cambiar queue pressure | Puede alterar lane metrics y tonos de presión en sesiones nocturnas |
| Session close guard | Comportamiento más estricto al cerrar sesión |
| Copy changes | Solo strings; validar ES |

## Qué NO debería tocarse

- realtime
- hydration
- optimistic callbacks
- server actions
- DB/Supabase
- toolbar logic
- modal behavior
- card layout / CSS
- search/filter logic
- kanban grouping
- status/assignment workflow

## Validaciones (C1a)

Auditoría documental — **sin cambios de código**. Build no requerido.

## QA manual recomendado (post C1b)

1. Abrir sesión de tienda cruzando medianoche (o simular pedido con `created_at` día anterior).
2. Confirmar queue pressure / lane metrics cuentan pedidos activos de la sesión.
3. Con filtro `Preparando` activo, confirmar top section ≠ context panel (esperado).
4. Intentar cerrar sesión con pedido activo in-scope vs out-of-scope.
5. Verificar labels “Sesión activa” vs KPIs de ventas.

**Estado C1a:** pendiente (requiere entorno con sesión).

## Deuda técnica restante

- Actualizar `docs/admin-dashboard-top-section-data-map.md` (referencias a `businessWindowOrders`).
- Activity relative labels (`activity.ts`) — ver B8.10b opcional.

## Próxima fase recomendada

**C1b — Session Scope Metrics Fix** (queue pressure + session close guard + copy alignment)
