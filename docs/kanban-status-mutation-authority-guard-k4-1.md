# Kanban Status Mutation Authority Guard — K4.1

## Objetivo

Evitar que respuestas viejas de server action (`optimistic.finalize`), payloads realtime stale y summaries stale muevan una orden hacia atrás después de una mutación optimista más nueva.

## Contexto

- **K1:** bounce por props sync sin reconcile (CONFIRMED).
- **K2:** reconcile en `useEffect([orders])`.
- **K3:** trace runtime confirmó writers adicionales que persistían post-K2.

## Evidencia K3 aplicada

- `optimistic.finalize` con `finalStatus=preparing` cuando UI ya estaba `ready`.
- `realtime.apply` con `toStatus=preparing` cuando UI ya estaba `ready`.
- `summary.fetch.success` con `toStatus=preparing` cuando UI ya estaba `completed`.
- `summary-replace` movía `completed → preparing`.

## Archivos modificados

- `lib/orders/dashboard-order-reconciliation.ts`
- `components/admin/orders/admin-dashboard-orders.tsx`
- `components/admin/orders/use-admin-orders-realtime.ts`

## Archivos creados

- `docs/kanban-status-mutation-authority-guard-k4-1.md`

## Cambio principal aplicado

Helper `shouldApplyIncomingStatusForOrder` + guards en writers async que podían pisar el estado local con datos stale.

## Status authority guard

`lib/orders/dashboard-order-reconciliation.ts`:

- `getOperationalStatusRank` — orden: `pending(0) < preparing(1) < ready(2) < completed(3)`; `cancelled` terminal.
- `isIncomingStatusStaleAgainstAuthority` — rank entrante menor que autoridad.
- `shouldApplyIncomingStatusForOrder` — decide si aplicar status entrante vs `currentStatus` y/o `pendingExpectedStatus`.

Reglas principales:

1. Sin `currentStatus` → permitir (INSERT / primera carga).
2. `incoming === current` → permitir.
3. `incoming === pendingExpected` → permitir (echo esperado).
4. Con `pendingExpected` activo → bloquear si `incoming` rank < `pendingExpected`.
5. Sin pending → bloquear backward estricto en writers async (`finalize` / `realtime` / `summary`).
6. `completed` no vuelve a estados operativos anteriores por stale.
7. `cancelled` entrante permitido; no mover `cancelled` a estados operativos por stale.

## Finalize stale guard

`resolvePendingStatusMutation`:

- Si `serverStatus` rank < `pendingExpectedStatus` → no clear pending, `staleIgnored: true`.
- Si `resolvePendingStatusFromState` produce `finalStatus` rank < expected → igual.

`finalizeOptimisticStatusChange`:

- Si `staleIgnored` → trace `stale-finalize-ignored`, return sin patch UI.
- Si `finalStatus` no pasa `shouldApplyIncomingStatusForOrder` → ignorar apply.

## Realtime stale guard

`onOrderUpdate`:

- Antes de summary fetch: guard en `row.status`.
- Fallback `patchDashboardOrderFromRealtime`: guard en `nextStatus`.

`replaceRealtimeOrderInState`:

- Guard antes de summary-replace completo.

## Summary stale guard

Summary fetch sigue ejecutándose; el guard en `replaceRealtimeOrderInState` ignora el replace completo si `summary.status` es stale (preferencia K4.1: no mover lane hacia atrás).

Trace: `stale-summary-ignored` vía `guardIncomingDashboardOrderStatus`.

## Pending mutation handling

- Finalize viejo con `finalStatus !== pendingExpected` y rank menor **no** limpia pending más nuevo.
- Pending de mutación encadenada (`ready` / `completed`) se preserva hasta su propio finalize.

### Edge cases

| Caso | Comportamiento |
|------|----------------|
| Finalize `ready` con pending `ready` | Normal resolve + clear |
| Finalize `preparing` con pending `ready` | Stale ignored, pending intacto |
| Realtime `completed` con pending `completed` | Permitido |
| Realtime `preparing` con UI `ready`, sin pending | Bloqueado (stale behind current) |
| Backend corrige status sin pending vía props sync / silent refresh | Sigue permitido (no guarded paths) |
| INSERT nuevo pedido | Sin current → permitido |

## Qué se preservó

- optimistic updates
- realtime subscriptions
- server actions
- DB/schema
- kanban visual
- order cards visual
- toolbar/search/filter
- trace K3

## Qué NO se cambió

- no pending lock
- no disabled buttons
- no debounce
- no optimistic removal
- no server action changes
- no DB changes
- no UI visual changes

## Riesgos / edge cases

- Corrección legítima backward desde otro operador vía realtime/summary podría ignorarse brevemente si UI local está más avanzada sin pending — mitigado por props sync / silent refresh autoritativos.
- Summary stale ignorado no actualiza campos no-status del item — trade-off aceptado en K4.1.
- Rollback de acción vieja fallida en quick-actions (out of scope) puede seguir siendo ruidoso; K4.2 pending lock puede ayudar.

## Validaciones ejecutadas

- `npm run build`: **pass**
- `npx tsc --noEmit`: **pass**
- `npm run lint`: **pass** — 0 errors / 16 warnings `no-img-element` (sin cambios vs baseline)

## QA manual recomendado

Con trace activo:

```js
localStorage.setItem("orderops:kanban-transition-trace", "1");
location.reload();
```

### Caso A — single transition

1. `PENDIENTES → PREPARANDO`
2. Confirmar sin bounce a `PENDIENTES`
3. Trace: posibles `stale-*-ignored`

### Caso B — chained transition

1. `PENDIENTES → PREPARANDO → LISTOS → COMPLETADOS` rápido
2. Confirmar card no vuelve a `PENDIENTES`/`PREPARANDO`
3. Trace: `stale-finalize-ignored`, `stale-realtime-ignored`, `stale-summary-ignored`

### Caso C — realtime two tabs

1. Cambiar en tab A; tab A sin bounce; tab B converge

### Regression

Search/filter, modal, manual order, assignment, review mode, store session.

Desactivar trace:

```js
localStorage.removeItem("orderops:kanban-transition-trace");
location.reload();
```

## Resultado esperado

Ningún writer stale (`finalize`, `realtime`, `summary-replace`) mueve la card a un lane anterior cuando UI/pending ya avanzó.

## Próxima fase recomendada

**K4.2 Pending Action Lock** — sólo si operadores pueden disparar demasiadas transiciones encadenadas antes de confirmación y el trace muestra clicks concurrentes como factor residual.

---

**Date:** 2026-06-06 (K4.1)
