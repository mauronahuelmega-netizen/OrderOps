# Board / Orders Execution Area — Phase M1 — Manual Order Server Contract

## Objetivo

Implementar el contrato server-side para crear pedidos manuales desde admin, sin UI. M1 expone `createManualOrderAction(input)` para que M2/M3 integren modal, toolbar e inserción local.

## Contexto

Tras C2–C4.1 el dashboard opera con sesiones de tienda, modo revisión post-cierre y guards server-side en mutaciones. M0 auditó el flujo de creación existente (checkout público + RPC) y recomendó reutilizar el write path autoritativo desde una server action admin.

## Hallazgo de M0

El único write path autoritativo de creación es la RPC `public.create_order`. No hay server action admin ni INSERT directo permitido por RLS.

## Archivos modificados

- `lib/store-sessions/types.ts` — tipos y mensajes para guard de creación (`OrderCreationErrorCode`, `ActiveSessionCreationGuardResult`, `ORDER_CREATION_GUARD_MESSAGES`).
- `lib/store-sessions/admin.ts` — `resolveOpenActiveStoreSession`, `assertActiveStoreSessionForOrderCreation`; refactor interno compartido con `assertActiveStoreSessionForOrderMutation` sin cambiar semántica de mutación.

## Archivos creados

- `app/admin/(protected)/orders/actions.ts` — `createManualOrderAction`, validación de payload, invocación RPC, retorno normalizado.
- `docs/board-orders-execution-area-phase-m1.md` — este documento.

## Server action contract

```ts
createManualOrderAction(input: CreateManualOrderInput): Promise<CreateManualOrderActionResult>
```

**Input:** `customerName`, `phone`, `deliveryMethod`, `address?`, `notes?`, `items[{ productId, quantity }]`. No acepta precios ni total.

**Output:**

- `{ ok: true, order: AdminOrderDashboardItem }`
- `{ ok: false, error: string, code?: OrderCreationErrorCode }`

## Input validation

Validación server-side antes de RPC:

- `customerName` — requerido, trim, length > 0
- `phone` — requerido, trim, length > 0
- `deliveryMethod` — `"delivery" | "pickup"`
- `address` — requerido si `deliveryMethod === "delivery"`
- `items` — array no vacío
- `items[].productId` — string no vacío
- `items[].quantity` — entero >= 1
- `notes` — opcional, trim

Mensajes de error alineados con el prompt (nombre, teléfono, dirección, productos, cantidad).

## Active session creation guard

`assertActiveStoreSessionForOrderCreation({ businessId })`:

- Verifica sesión activa (`status === "open"`, `closed_at` null).
- No valida pedido existente (aún no existe).
- No muta estado.
- Fail closed con `NO_ACTIVE_SESSION` y mensaje: *No hay una sesión activa. Abrí una nueva sesión para crear pedidos.*

## Permission guard

`createManualOrderAction` usa `requireAdminPermission("updateOrders")`, mismo patrón que `updateOrderStatusAction` en `app/admin/(protected)/orders/[id]/actions.ts`. Usuarios sin permiso son redirigidos por el helper existente (no se inventa sistema de roles).

## RPC reuse decision

Se reutiliza `public.create_order` desde server action admin vía `supabase.rpc("create_order", …)` con:

- `p_business_id` del contexto admin
- `p_delivery_date` = hoy (`YYYY-MM-DD`, mismo patrón que checkout on-demand)
- `p_items` como `{ product_id, quantity }[]`
- Sin precios client-side

## Pricing strategy

Total y snapshots de `order_items` los calcula la RPC en Postgres. TypeScript no replica lógica de pricing.

## Normalized dashboard order response

Tras RPC:

1. Se obtiene `order_id` (string UUID).
2. Se llama `getAdminDashboardOrderById(orderId, businessId)` (`lib/orders/admin.ts`).
3. Se retorna `AdminOrderDashboardItem` (items preview, relative time, urgency, customer context, etc.) listo para kanban/cards en M3.

## Error handling

Códigos: `NO_ACTIVE_SESSION`, `UNAUTHORIZED`, `VALIDATION_ERROR`, `PRODUCT_UNAVAILABLE`, `ORDER_CREATE_FAILED`, `UNKNOWN`.

Errores RPC mapeados sin exponer SQL crudo:

- Productos inválidos/no disponibles → `PRODUCT_UNAVAILABLE`
- `on_demand_mode is not active` → `NO_ACTIVE_SESSION`
- Guardrails de scheduled mode / delivery_date → `ORDER_CREATE_FAILED` con mensaje claro
- Fallo genérico → *No se pudo crear el pedido. Revisá los datos e intentá nuevamente.*

## Push notification decision

**Opción A — no disparar push en M1.**

El checkout público hace best-effort `POST /api/internal/orders/{id}/push` desde el cliente. M1 no replica ese paso para mantener blast radius mínimo. M3 puede añadir best-effort server-side (try/catch, no fail action) al confirmar creación manual.

## What was NOT implemented

- botón Nuevo pedido
- modal UI
- product picker
- toolbar integration
- optimistic/local insertion
- payment method
- discounts/promos
- delivery fee
- modifiers/variants
- stock decrement
- store_session_id migration
- customer CRM

## Comportamiento preservado

- checkout público intacto
- RPC pricing server-side intacto
- C2 last closed review mode intacto
- C3 UI action policy intacta
- C4 server mutation guard intacto
- realtime intacto
- kanban/cards/modal intactos

## Qué NO se cambió

- DB/schema
- RLS
- realtime
- dashboard UI
- checkout público UI
- product pricing logic
- status/assignment workflow
- theme tokens/global CSS

## Riesgos encontrados

- `delivery_date = hoy` en UTC (`toISOString().slice(0, 10)`) — mismo patrón que checkout; en zonas horarias extremas podría diferir del día operativo local (deuda conocida, no introducida en M1).
- Si `on_demand_mode_active` desincroniza de la sesión, la RPC puede fallar aunque exista sesión en UI; el guard de sesión + mapeo RPC cubren el caso operativo normal.
- Sin UI en M1, QA end-to-end queda pendiente hasta M2/M3.

## Validaciones ejecutadas

- `npm run build`
- `npx tsc --noEmit`
- `npm run lint`

## QA manual recomendado

Pendiente hasta M2/M3 (sin invocador UI):

1. Sin sesión activa → `NO_ACTIVE_SESSION`.
2. Nombre vacío / delivery sin dirección / items vacío / quantity 0 → `VALIDATION_ERROR`.
3. Con sesión activa + productos válidos → `ok: true`, `status: pending`, total RPC, `order_items` snapshot, shape `AdminOrderDashboardItem`.

## Próxima fase recomendada

**M2 — Manual Order Modal UI** — formulario admin, product picker, llamada a `createManualOrderAction`.
