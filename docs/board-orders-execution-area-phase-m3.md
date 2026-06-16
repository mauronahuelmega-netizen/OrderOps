# Board / Orders Execution Area — Phase M3 — Toolbar Integration & Reconciliation

## Objetivo

Integrar el flujo de pedido manual en el dashboard: botón toolbar → modal → server action → inserción local con dedupe realtime, sin optimistic pre-create.

## Contexto

M1 expuso `createManualOrderAction`. M2 implementó `ManualOrderModal` montado con `isOpen={false}`. M3 conecta toolbar, apertura del modal e inserción local del pedido confirmado por server.

## Archivos modificados

- `components/admin/orders/admin-dashboard-orders.tsx` — `manualOrderDisabledReason`, `handleOpenManualOrderModal`, `handleManualOrderCreated` con `insertRealtimeOrderIntoState`, props al toolbar.
- `components/admin/orders/DashboardToolbar.tsx` — botón “Nuevo pedido” / “+ Pedido”, props `canCreateManualOrder`, `onCreateManualOrder`, `manualOrderDisabledReason`, `showManualOrderButton`.
- `components/admin/orders/dashboard-toolbar.module.css` — estilos mínimos del botón y labels responsive.

## Archivos creados

- `docs/board-orders-execution-area-phase-m3.md`

## Toolbar integration

Botón en `sessionCluster` (junto a controles de sesión/sync):

- Desktop: **Nuevo pedido**
- Mobile: **+ Pedido**
- `aria-label="Crear nuevo pedido manual"`
- `title` con reason cuando está disabled

Visible si `canUpdateOrders` (`showManualOrderButton`).

## Button availability policy

| Condición | Botón |
|-----------|--------|
| `store-session` + permiso + `canMutateOrders` + sesión activa | enabled |
| `last-closed-store-session` (review mode) | visible disabled |
| business-window / sin sesión activa | visible disabled |
| sin `updateOrders` | oculto |

Reasons (`title` / toast al click disabled):

- Sin permiso → *No tenés permisos para crear pedidos.*
- Review mode → *Estás revisando una sesión cerrada. Abrí una nueva sesión para crear pedidos.*
- Sin sesión activa → *Abrí una sesión activa para crear pedidos.*

Sin productos: botón habilitado; empty state y submit bloqueado en modal (M2).

## Modal opening behavior

`handleOpenManualOrderModal`:

- Fail closed si `!canCreateManualOrder` → toast info con reason.
- Si OK → `setIsManualOrderModalOpen(true)`.

No abre en review mode ni sin sesión activa.

## Manual order created behavior

Tras `createManualOrderAction` ok:

1. Modal llama `onCreated(order)` y cierra.
2. Dashboard ejecuta `insertRealtimeOrderIntoState(order)`.
3. Toast *Pedido creado.*
4. `setNow` vía helper de inserción.

Sin optimistic pre-create. Sin full page refresh.

## Local insertion / reconciliation

Reutiliza `insertRealtimeOrderIntoState`:

```txt
server-confirmed order → local insert with dedupe by id → realtime insert ignored/deduped
```

`insertRealtimeOrderIntoState` dedupea por `order.id` en `optimisticOrdersRef`. El handler realtime INSERT comprueba duplicado antes de fetch summary → no duplica visual ni dispara efectos de llegada duplicados.

## Realtime dedupe

Sin cambios en `lib/orders/realtime.ts`. Dedupe existente en dashboard:

- Inserción local primero.
- Realtime INSERT encuentra id existente → early return.

Deuda menor: si realtime llegara antes que la respuesta local (muy improbable), el flujo normal aplicaría; no observado en M3.

## Product list behavior

Productos cargados al montar (M2). Sin auto-refresh al abrir modal.

Deuda documentada: M4 puede refrescar picker al abrir.

## Responsive behavior

Labels desktop/mobile con CSS. Touch targets alineados a `sessionButton` en mobile/tablet. Sin rediseño estructural del toolbar.

## Push notification decision

No implementado en M3. Checkout público usa `POST /api/internal/orders/{id}/push` client-side. Documentado para M4 o P1 (best-effort server-side post-create).

## What was NOT implemented

- optimistic pre-create
- push notification
- product picker live refresh
- payment method
- discounts/promos
- delivery fee
- modifiers/variants
- stock decrement
- customer CRM

## Comportamiento preservado

- M1 server contract intacto.
- M2 modal intacto.
- C2/C3/C4/C4.1 intactos.
- Checkout público intacto.
- Realtime internals intactos.
- Pricing server-side intacto.
- Status/assignment intactos.

## Qué NO se cambió

- DB/schema
- RLS
- RPC `public.create_order`
- server pricing
- checkout público
- realtime internals (`lib/orders/realtime.ts`, `dashboard-order-reconciliation.ts`)
- status/assignment workflow
- card/kanban layout
- theme tokens/global CSS

## Riesgos encontrados

- Botón dentro de `showSessionControls`; si ese cluster se ocultara en el futuro, el flujo manual quedaría inaccesible.
- Lista de productos stale si cambia catálogo durante sesión (M4).
- Toast “Pedido creado” vs efectos realtime en edge race (dedupe mitiga duplicado visual).

## Validaciones ejecutadas

- `npm run build`
- `npx tsc --noEmit`
- `npm run lint`

## QA manual recomendado

Pendiente sin sesión local automatizada:

1. Sin sesión → botón disabled + title.
2. Review mode → disabled + reason.
3. Sesión activa → abrir modal, crear pedido, aparece en Pending sin refresh.
4. Realtime no duplica.
5. Error server → modal abierto.
6. Responsive desktop/mobile/tablet.

## Próxima fase recomendada

**M4 — Manual Order QA / Production Hardening** — refresh product picker al abrir, push best-effort, QA end-to-end, edge cases de timezone/sync.
