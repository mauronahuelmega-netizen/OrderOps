# Kanban Transition Runtime Trace Audit — K3

## Objetivo

Instrumentar de forma temporal y segura el flujo real de transición de estado del kanban para identificar qué writer mueve la orden hacia atrás (`pending → preparing → pending`, o `ready → pending`), con evidencia runtime — sin cambiar comportamiento.

## Contexto

- **K1:** bounce causado por `useEffect([orders])` sin reconcile (CONFIRMED en código).
- **K2:** fix reconcile en props sync aplicado.
- **QA manual post-K2:** bounce persiste; hipótesis de writers adicionales, respuestas out-of-order, summary fetch stale, clear pending temprano, o transiciones encadenadas rápidas.

K3 agrega trace dev-only detrás de flag `localStorage`.

## Archivos modificados

- `components/admin/orders/admin-dashboard-orders.tsx`
- `components/admin/orders/use-admin-orders-realtime.ts`

## Archivos creados

- `lib/orders/kanban-transition-trace.ts`
- `docs/kanban-transition-runtime-trace-audit-k3.md`

## Instrumentación agregada

### Helper central (`lib/orders/kanban-transition-trace.ts`)

- `traceKanbanTransition(event)` — buffer + `console.debug` sólo con flag activo.
- `traceKanbanReconcileBatch(...)` — props sync / silent refresh (órdenes con pending o mismatch).
- `isKanbanTransitionTraceEnabled()` — `localStorage orderops:kanban-transition-trace === "1"`.
- Buffer: `window.__ORDEROPS_KANBAN_TRACE__` (máx. 400 eventos).
- Sin PII: sólo `orderId`, statuses, sources, mutation metadata.

### `admin-dashboard-orders.tsx`

| Punto | Source |
|-------|--------|
| `applyOptimisticStatusChange` | `optimistic.apply` |
| `finalizeOptimisticStatusChange` | `optimistic.finalize` (before-resolve + applied) |
| `rollbackOptimisticStatusChange` | `optimistic.rollback` |
| `useEffect([orders])` | `props-sync.before` / `props-sync.after` |
| `refreshOrdersSilently` | `silent-refresh.before` / `silent-refresh.after` |
| `onOrderUpdate` | `realtime.apply` (payload + patch fallback) |
| `fetchDashboardOrderSummary` | `summary.fetch.start` / `summary.fetch.success` |
| `replaceRealtimeOrderInState` | `realtime.apply` (summary-replace) |
| `optimisticOrders` + pending | `view-model.render` (sólo órdenes con pending patch) |

### `use-admin-orders-realtime.ts`

| Punto | Source |
|-------|--------|
| `markPendingStatusMutation` | `pending.mark` |
| `resolvePendingStatusMutation` | `pending.resolve` |
| `clearPendingMutation` | `pending.clear` |
| TTL expired | `pending.expired` |
| Realtime suppress | `realtime.suppressed` (expected-echo / conflict) |
| Realtime apply path | `realtime.payload` |

## Cómo activar trace

En DevTools Console:

```js
localStorage.setItem("orderops:kanban-transition-trace", "1");
location.reload();
```

## Cómo desactivar trace

```js
localStorage.removeItem("orderops:kanban-transition-trace");
location.reload();
```

## Eventos registrados

Ver tipos en `KanbanTransitionTraceSource` en `lib/orders/kanban-transition-trace.ts`.

Consultar buffer:

```js
window.__ORDEROPS_KANBAN_TRACE__
console.table(window.__ORDEROPS_KANBAN_TRACE__)
```

Filtrar por orderId:

```js
console.table(
  window.__ORDEROPS_KANBAN_TRACE__.filter((event) => event.orderId === "ORDER_ID")
)
```

## Reproducción ejecutada

**No ejecutada** — sin sesión admin autenticada en esta sesión.

## Timeline Caso A — single transition

**Pendiente.** Pasos:

1. Activar trace.
2. Pedido en `PENDIENTES`.
3. Click `Preparar`.
4. Esperar 2–3s.
5. Filtrar trace por `orderId`.
6. Buscar secuencia `toStatus` que retrocede (ej. `preparing` → `pending`).

## Timeline Caso B — chained transition

**Pendiente.** Pasos:

1. `PENDIENTES → PREPARANDO` click rápido.
2. Apenas en `PREPARANDO`, click `LISTOS`.
3. Esperar 3–5s.
4. Filtrar trace; identificar si `optimistic.finalize` de mutación vieja pisa `ready`.

## Timeline Caso C — two tabs / realtime

**Pendiente.**

## Writer que mueve hacia atrás

**PENDING runtime evidence** — instrumentación lista; writer no confirmado sin QA.

Hipótesis a validar con trace (orden de prioridad):

1. `optimistic.finalize` con `finalStatus` de mutación anterior después de `optimistic.apply` más nuevo.
2. `realtime.apply` / `summary.fetch.success` con status stale.
3. `props-sync.after` con `reconciledStatus` anterior a UI actual (K2 debería mitigar — verificar).
4. `silent-refresh.after` sin pending activo + snapshot stale.
5. `pending.clear` / `pending.resolve` antes de writer stale.

## Evidencia runtime

Ninguna capturada en K3 (doc + instrumentación). La evidencia debe obtenerse ejecutando Casos A/B/C con flag activo.

## Sospechosos clasificados

| ID | Clasificación | Notas |
|----|---------------|-------|
| props-sync K2 | **CLEARED** (código) / **PENDING** (runtime) | Reconcile aplicado; verificar `props-sync.after` en trace |
| finalize out-of-order | **LIKELY** | Caso B encadenado; trace `optimistic.finalize` + `fromStatus`/`toStatus` |
| summary.fetch.success stale | **LIKELY** | `replaceRealtimeOrderInState` sin reconcile pending |
| realtime.apply fallback | **POSSIBLE** | `patchDashboardOrderFromRealtime` path |
| pending.clear temprano | **POSSIBLE** | `pending.resolve` → clear antes de summary |
| silent-refresh stale | **POSSIBLE** | post-TTL o post-resolve |
| double click | **CLEARED** | `type="button"` + stopPropagation |

## Qué se preservó

- server actions
- DB/schema
- realtime semantics
- hydration semantics
- optimistic behavior
- kanban visual
- cards visual
- toolbar/search/filter

## Qué NO se cambió

- no mutation sequencing
- no pending lock
- no debounce
- no optimistic removal
- no server action changes
- no DB changes
- no UI changes
- trace apagado por defecto (sin flag)

## Riesgos

- Trace activo genera `console.debug` ruidoso en dev/staging — desactivar tras captura.
- `view-model.render` emite por cada cambio de `optimisticOrders` con pending activo — acotado a órdenes con patch.
- Buffer 400 eventos puede truncar sesiones largas — exportar pronto.

## Recomendación K4

Basada en hipótesis hasta confirmar trace:

### Opción A — Mutation sequencing por orderId (recomendada si trace muestra finalize out-of-order)

- Ignorar `finalStatus` de respuesta si `expectedStatus` es más viejo que UI actual.
- Archivos: `admin-dashboard-orders.tsx`, posible helper en `dashboard-order-reconciliation.ts`.
- Aceptación: Caso B sin revert a `pending`/`preparing`.

### Opción B — Pending lock / disable quick action durante in-flight

- Si trace muestra clicks encadenados antes de resolve.
- Archivos: `order-card-quick-actions.tsx` (visual disable only) o container.
- Riesgo: latencia percibida en operación rápida.

### Opción C — Reconcile en summary/realtime apply

- Aplicar `reconcileDashboardOrdersWithPendingMutations` en `replaceRealtimeOrderInState` y fallback patch.
- Si trace muestra `summary.fetch.success` con status stale pisando UI.
- Archivos: `admin-dashboard-orders.tsx`.

### Opción D — Conservative optimistic (no mover lane hasta server)

- Último recurso UX; no recomendado salvo evidencia fuerte.

**K4 sugerida:** ejecutar Casos A/B con trace → si `optimistic.finalize` o `summary.fetch.success` aparecen como writer backward → **A + C**.

## Archivos probables para K4

```txt
components/admin/orders/admin-dashboard-orders.tsx
lib/orders/dashboard-order-reconciliation.ts
components/admin/orders/order-card-quick-actions.tsx  (sólo si Opción B)
```

## Validaciones ejecutadas

- `npm run build`: **pass** (Next.js 15.3.0, sin errores de compilación).
- `npx tsc --noEmit`: **pass**.
- `npm run lint`: **pass** — 0 errors / 16 warnings `no-img-element` (sin cambios vs baseline).

## QA manual pendiente

1. Caso A — single transition + export trace.
2. Caso B — chained `pending → preparing → ready`.
3. Caso C — two tabs.
4. Identificar evento exacto con `toStatus` backward.
5. Desactivar trace tras captura.

---

**Audit date:** 2026-06-06 (K3)
