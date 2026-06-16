# Board / Orders Execution Area — Phase B6 — Realtime / Hydration / Optimistic Hardening

## Objetivo

Endurecer convergencia operativa entre Supabase Realtime, optimistic updates, silent refresh, manual sync y modal abierto — **sin cambios visuales**.

## Contexto

- **B0** detectó: assignment sin pending lock equivalente a status; DELETE realtime no cubierto.
- **B1–B5** cerraron contrato, view model, empty/context, lanes IA y card polish.
- **B6** generaliza pending mutations y reconciliación silenciosa.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `components/admin/orders/use-admin-orders-realtime.ts` | Pending status+assignment; UPDATE/DELETE; API extendida |
| `components/admin/orders/admin-dashboard-orders.tsx` | Assignment pending lock; reconcile refresh; DELETE handler; modal guard |
| `lib/orders/dashboard-order-reconciliation.ts` | **Nuevo** — helpers puros de reconciliación |

## Archivos creados

| Archivo | Rol |
|---------|-----|
| `lib/orders/dashboard-order-reconciliation.ts` | Reconcile silent refresh + resolve pending + suppress realtime |
| `docs/board-orders-execution-area-phase-b6.md` | Este documento |

## Estado previo

| Mecanismo | Comportamiento pre-B6 |
|-----------|----------------------|
| Pending mutation | Solo `status` por `orderId`; TTL 8s |
| Realtime UPDATE echo | Suprimido si `expectedStatus === row.status` |
| Conflicto externo | `externalStatus` → `needsRefresh` al resolver |
| Silent refresh | Preservaba solo pending status vía `getPendingMutationStatus` |
| Assignment optimistic | Sin pending lock; realtime podía pisar |
| DELETE realtime | No suscrito |
| Modal + refresh | Seed actualizado desde reconciled orders |

## Cambios aplicados

1. **Pending model unificado** — por `orderId`: `status?` + `assignment?` en un solo entry.
2. **API hook** — `markPendingAssignmentMutation`, `getPendingMutationPatch`, `resolvePendingAssignmentMutation`, `clearPendingMutation(kind)`.
3. **UPDATE handler** — suprime echo de status y/o assignment; marca conflicto externo por campo.
4. **DELETE handler** — remueve pedido, limpia pending, cierra modal si estaba abierto.
5. **Silent refresh** — `reconcileDashboardOrdersWithPendingMutations` preserva status + assignment pending.
6. **Assignment flow** — mark pending → optimistic → resolve → conflict refresh (paridad con status).

## Pending mutation model

```txt
PendingOrderMutationState
├─ startedAt / mutationId
├─ status?: { expectedStatus, previousStatus, externalStatus? }
└─ assignment?: { expectedAssignment, previousAssignment, externalAssignment? }
```

TTL: **8000 ms** (sin cambio).

## Status pending behavior

- API legacy `markPendingMutation` / `resolvePendingMutation` preservada (alias status).
- Semántica B0 intacta: echo suprimido, conflicto → refresh al resolver.

## Assignment pending behavior

- `applyOptimisticAssignmentChange` → `markPendingAssignmentMutation`.
- `rollbackOptimisticAssignmentChange` → `clearPendingMutation(orderId, "assignment")`.
- `finalizeOptimisticAssignmentChange` → `resolvePendingAssignmentMutation` + refresh si `needsRefresh`.
- Campo real: `assigned_to` / `assigned_at` (`AdminOrderAssignment`).

## Realtime UPDATE reconciliation

Helper puro: `shouldSuppressRealtimeUpdateForPendingMutation`.

- Echo status: `row.status === expectedStatus`.
- Echo assignment: `assigned_to` coincide con expected.
- Conflicto: valor externo distinto → suppress + marcar external; no pisa optimistic UI.
- Ambos pending y ambos echoed → suppress total.

## DELETE realtime policy

**Opción B implementada** (defensiva).

Evidencia negocio: no hay hard-delete de `orders` en app code; operación normal = `status = cancelled`.

Aun así B6 suscribe DELETE por seguridad operativa:

```txt
DELETE orders → clear pending → onOrderDelete → filter optimisticOrders → close modal si aplica
```

Silent refresh sigue como red de seguridad.

## Silent refresh reconciliation

```txt
GET /admin/dashboard/orders
→ reconcileDashboardOrdersWithPendingMutations(serverOrders, getPendingMutationPatch)
→ sortOrdersForOperationalBoard
→ setOptimisticOrders + selectedOrderSeed si modal abierto
```

Preserva pending status **y** assignment mientras TTL activo.

## Manual sync compatibility

`refreshOrdersSilently("manual-operational-resync")` usa la misma reconciliación.

- No resetea search/filter (sin cambio T4.7).
- Bypass cooldown en manual sync (sin cambio).
- Preserva pending mutations activas.

## Modal open during refresh

- Seed actualizado desde `reconciledOrders` si `selectedOrderId` sigue existiendo.
- DELETE cierra modal y limpia `?order=` de URL.
- Pedido ausente post-refresh → `selectedOrder` null sin crash.

## Recovery triggers

Sin cambio de cooldown/intervalos:

| Trigger | Refresh reason |
|---------|----------------|
| Realtime reconnect | `reconnect` |
| Tab visible | `visibility` |
| Browser online | `online` |
| Mutation conflict | `conflict` |
| Toolbar manual sync | `manual-operational-resync` |

## Tests / QA strategy

No hay test runner en proyecto — **sin tests automatizados en B6**.

Casos documentados para QA manual (ver abajo).

Helpers puros en `dashboard-order-reconciliation.ts` listos para tests futuros.

## Comportamiento preservado

- UI de cards igual.
- Quick actions visibles iguales.
- Status workflow igual.
- Assignment UX igual.
- Search/filter igual.
- Lanes/context/empty igual.
- Toolbar igual.
- Top section igual.

## Qué NO se cambió

- CSS
- card UI
- lanes IA
- context panel
- empty states
- toolbar
- top section
- modal UI
- server actions contract
- DB/Supabase schema
- route JSON contract
- WhatsApp/Maps/tel/share/clipboard

## Compatibilidad con B1/B2/B3/B4/B5

Sin impacto en view model, empty/context, lanes IA ni card polish. Solo capa de convergencia operativa del container + hook realtime.

## Riesgos encontrados

- Status + assignment pending simultáneos en mismo pedido: UPDATE suppress total hasta resolver ambos — aceptable (raro).
- DELETE hard poco probable en prod; handler defensivo.
- Concurrent assignment desde dos tabs: conflicto converge vía `needsRefresh` + silent refresh.

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npm run build` | Pass (exit 0) |
| `npx tsc --noEmit` | Pass (exit 0) |
| `npm run lint` | Pass — 0 errors / 16 warnings `@next/next/no-img-element` |

## QA manual recomendado

### Status optimistic
1. Quick action pending → preparing; optimistic inmediato.
2. Echo realtime no revierte.
3. Manual sync con pending activo no revierte.

### Assignment optimistic
4. Tomar/liberar pedido en modal.
5. Echo no revierte assignment optimistic.
6. Simular error → rollback + pending cleared.

### Race / conflict
7. Dos tabs asignando mismo pedido → silent refresh conflict converge.

### Realtime
8. INSERT nuevo pedido visible.
9. UPDATE desde otro tab converge.

### DELETE
10. Hard-delete en entorno local → pedido desaparece; modal cierra si abierto.
11. Si no hay hard-delete: documentar no testeado en prod.

### Manual sync / recovery
12. Manual sync con search/filter activos — no reset.
13. Visibility/online/reconnect — sin loops.

### Modal
14. Modal abierto + manual sync — no crash; seed converge.

**Estado QA manual:** pendiente.

## Deuda técnica restante

- Tests unitarios para `dashboard-order-reconciliation.ts` cuando exista runner.
- Simultaneous status+assignment pending: posible refresh parcial más fino (post-B6).
- DELETE en prod: confirmar política de negocio explícita en docs de producto.

## Próxima fase recomendada

**B7 — Mobile / Tablet Board UX**
