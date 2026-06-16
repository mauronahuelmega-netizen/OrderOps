# Board / Orders Execution Area — Phase C4 — Server-Side Session Mutation Guard

## Objetivo

Enforcement server-side para que mutaciones operativas de pedidos sólo se ejecuten con sesión activa válida y pedido dentro de esa sesión.

## Contexto

C2 mantiene lectura de última sesión cerrada. C3 bloqueó UI en modo revisión client-side. C3 documentó deuda: enforcement server-side pendiente.

## Problema detectado

Un usuario podía saltear la UI (race multi-tab, DOM, llamada directa a server action) y mutar pedidos sin sesión activa o pedidos de sesión cerrada.

## Decisión de producto aplicada

Una sesión cerrada se revisa, no se opera. Una mutación operativa requiere sesión activa válida.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `lib/store-sessions/types.ts` | Tipos/códigos/mensajes del guard (client-safe) |
| `lib/store-sessions/admin.ts` | `assertActiveStoreSessionForOrderMutation` |
| `lib/orders/admin.ts` | Re-export tipos/códigos client-safe |
| `app/admin/(protected)/orders/[id]/actions.ts` | Guard en status y assignment actions |
| `components/admin/orders/status-form.tsx` | Sync sesión + toast en error server guard |
| `components/admin/orders/order-assignment-controls.tsx` | Sync sesión + toast en error server guard |
| `components/admin/orders/admin-dashboard-orders.tsx` | Listener `orderops:operational-mutation-blocked` → hydrate |

## Archivos creados

| Archivo | Rol |
|---------|-----|
| `docs/board-orders-execution-area-phase-c4.md` | Este documento |
| `lib/store-sessions/types.ts` | Tipos compartidos sin `server-only` |

## Write paths audit

| Action | File | Mutation | Guard applied |
|--------|------|----------|---------------|
| `updateOrderStatusAction` | `app/admin/(protected)/orders/[id]/actions.ts` | Cambio de estado (`orders.status`) | Sí — `assertActiveStoreSessionForOrderMutation` |
| `updateOrderAssignmentAction` | `app/admin/(protected)/orders/[id]/actions.ts` | Tomar/liberar pedido (`assigned_to`, `assigned_at`) | Sí — mismo guard |
| Quick status (Preparar/Listo/Completar/Cancelar) | Client → `updateOrderStatusAction` | Status | Sí (misma action) |
| Cancel/complete/mark ready | Client → `updateOrderStatusAction` | Status | Sí (misma action; no hay actions separadas) |
| `getActiveStoreSessionHydrationAction` | `dashboard/actions.ts` | Lectura | No (read-only) |
| `openStoreSessionAction` / `closeStoreSessionAction` | `dashboard/actions.ts` | Sesión | No (fuera de scope C4) |
| WhatsApp/tel/maps/clipboard | Client utilities | Ninguna DB | No |

## Guard helper

`assertActiveStoreSessionForOrderMutation({ businessId, order })` en `lib/store-sessions/admin.ts`.

Retorno:

```ts
| { ok: true; session: StoreSession }
| { ok: false; reason: OrderMutationErrorCode; message: string }
```

Códigos: `NO_ACTIVE_SESSION`, `ORDER_OUTSIDE_ACTIVE_SESSION`, `ORDER_NOT_FOUND`, `UNAUTHORIZED`, `UNKNOWN`.

## Active session validation

Reutiliza `getActiveStoreSession(businessId)`:

- `status = open`
- `closed_at IS NULL`

Si no hay sesión activa → `NO_ACTIVE_SESSION`.

## Order ownership/session validation

Modelo actual **sin** `orders.store_session_id`. Validación **Opción B**:

```txt
order.created_at >= activeSession.opened_at
```

Si en el futuro existe `store_session_id`, el helper valida `order.store_session_id === activeSession.id`.

También valida `order.business_id === businessId` cuando está presente.

## Status mutation guard

Antes de update en `updateOrderStatusAction`:

1. Cargar pedido con `created_at`
2. Ejecutar guard
3. Si falla → `{ error, code }` sin mutar DB ni crear evento

## Assignment mutation guard

Mismo guard en `updateOrderAssignmentAction` antes de claim/release.

## Cancel/complete mutation guard

No hay server actions separadas. Cancelar/completar/marcar listo usan `updateOrderStatusAction` → cubierto.

## Client error handling

- Toast con `result.error` (mensaje server-side claro).
- Optimistic rollback en `status-form` / `order-assignment-controls` si `result.error`.
- Evento `orderops:operational-mutation-blocked` → `hydrateStoreSession` en dashboard (race multi-tab).
- Campo opcional `code` en respuesta de action para clientes que lo consuman.

## Race conditions covered

| Caso | Comportamiento |
|------|----------------|
| A — Modal abierto, otro tab cierra sesión, submit stale | Server rechaza `NO_ACTIVE_SESSION`; rollback + hydrate |
| B — Modo revisión, bypass UI | Server rechaza `NO_ACTIVE_SESSION` |
| C — Nueva sesión + pedido viejo de sesión cerrada | Server rechaza `ORDER_OUTSIDE_ACTIVE_SESSION` (`created_at < opened_at`) |
| D — Pedido nuevo en sesión activa | Guard OK; comportamiento previo |

## What was NOT implemented

- DB/schema changes
- RLS changes
- cierre de caja
- reportes/export
- selector/historial de sesiones
- roles/permisos nuevos
- Guard en `order-card-quick-actions` event dispatch (quick actions ya muestran toast; hydrate vía interval/sync manual)

## Comportamiento preservado

- C2 Last Closed Session Review Mode intacto.
- C3 UI Action Policy intacta.
- Sesión activa sigue operando normalmente.
- Última sesión cerrada sigue visible para revisión.
- Search/filter intactos.
- Realtime/hydration intactos.
- Optimistic UX intacta salvo rechazo controlado por server guard.
- Kanban/cards/modal layout intactos.

## Qué NO se cambió

- DB/schema
- RLS
- realtime orders
- store session open/close behavior
- hydration scope resolution
- WhatsApp builders/templates/URLs
- clipboard/maps/tel logic
- theme tokens/global CSS

## Riesgos encontrados

- Entornos sin tabla `store_sessions` migrada: `getActiveStoreSession` retorna `null` → todas las mutaciones bloqueadas.
- Pedidos creados antes de `opened_at` de sesión activa (edge timing) quedan fuera de scope operativo.

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npm run build` | Pass — compilación y typecheck Next OK |
| `npx tsc --noEmit` | Pass — exit 0 |
| `npm run lint` | Pass — 0 errors, 16 warnings (`no-img-element`, preexistentes) |

## QA manual recomendado

Ver checklist prompt C4 (casos 1–5).

**Estado:** pendiente.

## Deuda técnica restante

- Guard en otros write paths futuros (kitchen, API interna) si aparecen mutaciones de pedidos.
- Asignar `store_session_id` en creación de pedidos (schema futuro) para validación más estricta.

## Próxima fase recomendada

**B9 — Final QA / Production Readiness**
