# Board / Orders Execution Area — Phase M2 — Manual Order Modal UI

## Objetivo

Implementar la UI del modal de creación manual de pedidos con validación client-side, product picker y total preview. El modal queda listo para abrirse desde M3 (toolbar + reconciliación local).

## Contexto

M1 expuso `createManualOrderAction` con guard de sesión activa, validación server-side y retorno `AdminOrderDashboardItem`. M2 agrega el formulario admin sin botón definitivo en toolbar ni inserción local/realtime final.

## Archivos modificados

- `lib/products/admin.ts` — `ManualOrderProductOption`, `getManualOrderProductOptions`.
- `app/admin/(protected)/orders/actions.ts` — `getManualOrderProductOptionsAction`.
- `components/admin/orders/admin-dashboard-orders.tsx` — wiring mínimo: carga de productos, estado `isManualOrderModalOpen` (cerrado por defecto), `canCreateManualOrder`, `onCreated` con toast.

## Archivos creados

- `components/admin/orders/manual-order-modal.tsx`
- `components/admin/orders/manual-order-modal.module.css`
- `docs/board-orders-execution-area-phase-m2.md`

## Modal contract

```tsx
<ManualOrderModal
  isOpen={boolean}
  onClose={() => void}
  onCreated?: (order: AdminOrderDashboardItem) => void
  canCreateOrder={boolean}
  products={ManualOrderProductOption[]}
/>
```

Usa `AdminOrderModalShell` (variant `workstation`) para overlay, Escape y foco inicial.

## Product option contract

```ts
type ManualOrderProductOption = {
  id: string;
  name: string;
  price: number;
  categoryName?: string | null;
  isAvailable: boolean;
};
```

Origen: `getManualOrderProductOptions` → solo `is_available = true`, ordenados por nombre. Precio es preview; el server sigue siendo autoridad.

## Form fields

- Cliente: nombre *, teléfono *
- Entrega: radio Retiro / Delivery; dirección * si delivery
- Notas: opcional
- Productos: búsqueda + lista + resumen con cantidades
- Footer: Cancelar / Crear pedido

## Client-side validation

Antes de `createManualOrderAction`:

- Nombre y teléfono requeridos
- Dirección requerida si delivery
- Al menos un producto
- Cantidad entera >= 1

Errores inline por campo + mensaje server en alerta superior.

## Product picker behavior

- Filtro por `name` y `categoryName`
- Agregar incrementa quantity si ya existe
- +/- en resumen; quantity 0 elimina línea
- Sin imágenes, modifiers ni stock UI

## Total preview

`previewTotal = Σ (product.price × quantity)` solo display.

Copy: *El total final se valida al crear el pedido.*

No se envía total al server.

## Submit behavior

- Llama `createManualOrderAction` con items `{ productId, quantity }` únicamente
- `ok: false` → muestra error, modal abierto, formulario intacto
- `ok: true` → `onCreated(order)`, reset, `onClose()`

## Active session disabled state

Prop `canCreateOrder={false}`:

- Submit deshabilitado
- Mensaje: *Abrí una sesión activa para crear pedidos.*

Dashboard calcula:

```ts
canCreateManualOrder =
  canUpdateOrders &&
  orderActionPolicy.canMutateOrders &&
  operationalWindow.source === "store-session" &&
  Boolean(activeStoreSessionState);
```

## Accessibility

- Labels en inputs (`admin-field`)
- `aria-invalid` en campos con error
- `role="alert"` en error server
- `aria-label` en controles +/- cantidad
- Escape vía shell; botones disabled con texto claro durante submit

## Styling

`manual-order-modal.module.css` — tokens existentes (`--text-primary`, `--border-subtle`, `--focus`, etc.), layout compacto responsive, sin cambios globales.

## What was NOT implemented

- botón toolbar definitivo
- realtime/local insertion final
- optimistic pre-create
- push notification
- payment method
- discounts/promos
- delivery fee
- modifiers/variants
- stock decrement
- customer CRM

## Comportamiento preservado

- M1 server contract intacto.
- C2/C3/C4/C4.1 intactos.
- Checkout público intacto.
- Board/kanban/cards intactos.
- Realtime intacto.
- Pricing server-side intacto.

## Qué NO se cambió

- DB/schema
- RLS
- RPC `public.create_order`
- server pricing
- checkout público
- toolbar final
- realtime/order reconciliation
- status/assignment workflow
- theme tokens/global CSS

## Riesgos encontrados

- Modal montado con `isOpen={false}` hasta M3; QA visual completo pendiente de botón toolbar.
- Precio preview puede diferir del total RPC si cambian precios entre abrir modal y submit (edge raro).
- Productos se cargan al montar dashboard (permiso `updateOrders`); lista no se refresca en vivo si cambia catálogo durante sesión.

## Validaciones ejecutadas

- `npm run build`
- `npx tsc --noEmit`
- `npm run lint`

## QA manual recomendado

Parcial pendiente hasta M3 (sin botón para abrir modal en UI):

1. Abrir modal (temporalmente vía dev o M3).
2. Validar campos, delivery/retiro, picker, total preview.
3. Errores client/server.
4. Submit válido con sesión activa → cierre + `onCreated`.
5. `canCreateOrder=false` → submit bloqueado.

## Próxima fase recomendada

**M3 — Toolbar Integration & Reconciliation** — botón “Nuevo pedido”, abrir modal, insertar pedido en estado local y dedupe con realtime.
