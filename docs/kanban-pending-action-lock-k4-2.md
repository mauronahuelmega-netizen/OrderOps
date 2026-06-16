# Kanban Pending Action Lock — K4.2

## Objetivo

Evitar que el operador dispare múltiples transiciones rápidas de status sobre la misma orden mientras una mutación anterior sigue in-flight.

## Contexto

- K4.1 blindó writers stale (`finalize`, `realtime`, `summary`).
- K4.2 evita que el operador dispare una segunda transición de status sobre la misma order mientras la primera sigue in-flight.
- La card sigue moviéndose optimistic; sólo se bloquea la quick action de status.

## Archivos modificados

- `components/admin/orders/use-admin-orders-realtime.ts`
- `components/admin/orders/admin-dashboard-orders.tsx`
- `components/admin/orders/DashboardKanbanBoard.tsx`
- `components/admin/orders/order-card.tsx`
- `components/admin/orders/order-card-quick-actions.tsx`
- `components/admin/orders/order-card-quick-actions.module.css`
- `lib/orders/kanban-transition-trace.ts`

## Archivos creados

- `docs/kanban-pending-action-lock-k4-2.md`

## Cambio principal aplicado

`hasPendingStatusMutation(orderId)` expone el pending map existente; se propaga como `isOrderStatusPending(orderId)` hasta `OrderCardQuickActions`, que deshabilita botones de status y muestra `Actualizando...` mientras hay mutación in-flight.

## Pending status detection

`use-admin-orders-realtime.ts`:

```ts
hasPendingStatusMutation(orderId: string): boolean
```

- Usa `getActivePendingMutation` (TTL 8s existente).
- No crea nueva fuente de verdad.
- No altera semantics de mark/resolve/clear.

## Prop drilling / data flow

```
admin-dashboard-orders
  → isOrderStatusPending (stable callback + ref)
  → DashboardKanbanBoard / OrderCard (list view)
  → OrderCardQuickActions
```

## Quick action lock

Cuando `isOrderStatusPending(order.id)` es true:

- Botón primary: `Actualizando...`, `disabled`, `aria-busy`.
- Botones secondary de status: `disabled`.
- Card/modal open: sin cambios.
- Otras cards: sin bloqueo.

## Defensive handler guard

`handleStatusAction` verifica `isOrderStatusPending?.(order.id)` en tiempo real (lee ref) antes de disparar server action. Trace opcional: `quick-action.blocked`.

## Trace notes

Nuevo source K3: `quick-action.blocked` con `reason: pending-status-mutation`. Sólo con flag activo.

## Qué se preservó

- optimistic movement
- server actions
- realtime subscriptions
- DB/schema
- kanban visual
- order card layout
- modal open behavior
- search/filter
- trace K3

## Qué NO se cambió

- no mutation queue
- no optimistic removal
- no conservative mode
- no server action changes
- no DB changes
- no global lock
- no products changes

## Riesgos / edge cases

- Pending TTL (8s) expirado sin re-render del parent: función `isOrderStatusPending` lee estado fresco en cada render del quick-actions; edge case menor si componente no re-renderiza.
- Assignment mutations independientes: no bloqueadas por status pending.
- Modal workspace usa `status-form`, no quick actions — fuera de scope K4.2.

## Validaciones ejecutadas

- `npm run build`: **pass**
- `npx tsc --noEmit`: **pass**
- `npm run lint`: **pass** — 0 errors / 16 warnings `no-img-element` (sin cambios vs baseline)

## QA manual recomendado

### Caso A — single transition

1. `PENDIENTES → PREPARANDO`
2. Card en `PREPARANDO`, botón `Actualizando...` / disabled
3. Tras confirmación, botón habilitado para siguiente paso

### Caso B — chained fast attempt

1. Click `Preparar`
2. Intentar `Listo` inmediatamente → bloqueado
3. Tras confirmación, permitir `Preparando → Listos`

### Caso C — no bounce

`Pendientes → Preparando → Listos → Completados` sin vuelta atrás (K4.1 + K4.2).

### Regression

Modal, search/filter, assignment, manual order, realtime dos tabs, review mode, otras cards operables.

## Resultado esperado

Una transición de status por orden a la vez; feedback optimistic inmediato; sin encadenar clicks antes de confirmación.

## Próxima fase recomendada

**K5 — Kanban Transition Final QA / remove or keep trace gated**

---

**Date:** 2026-06-06 (K4.2)
