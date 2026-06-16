# Board / Orders Execution Area — Phase M4 — Manual Order QA / Production Hardening

## Objetivo

Endurecer el flujo **Nuevo pedido** para uso real: productos actualizados al abrir, modal usable en pantallas bajas, submit protegido, race de sesión manejada, push best-effort y reconciliación local validada.

## Contexto

M1–M3 entregaron server contract, modal UI, toolbar e inserción local. M4 cierra deuda de M3 (product refresh stale, push pendiente, QA) sin nuevas features grandes.

## Archivos modificados

- `components/admin/orders/admin-dashboard-orders.tsx` — `refreshManualOrderProducts`, refresh al abrir modal, estados de carga/error, push best-effort post-create, `handleManualOrderSessionBlocked`.
- `components/admin/orders/manual-order-modal.tsx` — scroll/footer, submit lock, empty state con Reintentar, props de productos, `NO_ACTIVE_SESSION` → hydrate.
- `components/admin/orders/manual-order-modal.module.css` — layout flex scroll + footer sticky.
- `components/admin/orders/dashboard-toolbar.module.css` — `max-width: 100%` en session cluster.

## Archivos creados

- `docs/board-orders-execution-area-phase-m4.md`

## Product refresh on open

**Opción A implementada:** modal abre inmediato + refresh background.

```txt
handleOpenManualOrderModal → setIsManualOrderModalOpen(true) → refreshManualOrderProducts({ silent: true })
```

- No bloquea apertura si hay lista previa.
- Si falla, mantiene lista previa + warning no bloqueante en modal.
- Sin polling.
- `Reintentar` en empty state llama refresh con toast en error.

Estados: `isRefreshingManualOrderProducts`, `manualOrderProductsError`.

## Product empty state

Copy: *No hay productos disponibles para cargar pedidos.*

Botón **Reintentar** cuando `onRefreshProducts` está disponible. Submit bloqueado sin productos.

## Modal scroll / footer hardening

- Formulario en columna flex (`flex: 1`, `min-height: 0`).
- Contenido en `.manual-order-modal__form-scroll` con `overflow-y: auto`.
- Footer sticky con borde superior y fondo de superficie.
- Footer Cancelar / Crear pedido siempre accesible en viewports bajos.

## Submit hardening

- `submitLockRef` + `isSubmitting` evitan doble envío.
- Botones disabled durante submit.
- `handleClose` bloqueado durante submit.
- Error server mantiene formulario y `selectedItems`.
- Success resetea y cierra vía flujo existente.
- `aria-busy` en form.

## Session race handling

Si `createManualOrderAction` devuelve `code: "NO_ACTIVE_SESSION"`:

- Modal muestra error server (no cierra).
- Dispara `orderops:operational-mutation-blocked` → `hydrateStoreSession("manual-action")` (patrón C4).

## Local insertion / realtime dedupe

Sin cambios en lógica M3: `insertRealtimeOrderIntoState` dedupea por `order.id`. Realtime INSERT ignora ids existentes. Toast único *Pedido creado.*

## Push notification decision

**Opción B implementada:** cliente best-effort post-success en `handleManualOrderCreated`:

```txt
POST /api/internal/orders/{id}/push
catch ignore
```

Mismo patrón que checkout público. No bloquea creación ni cierra con error.

## Toolbar responsive hardening

CSS mínimo: `sessionCluster` con `max-width: 100%` para wrap en mobile/tablet. Labels desktop/mobile del botón preservados (M3).

## Button disabled behavior

Política M3 intacta. Sin sesión / review mode → disabled + `title` + toast al click.

## QA manual results

**Pendiente** — requiere sesión local y entorno admin. Escenarios A–G documentados en prompt M4; validación estática de código y build completada.

## What was NOT implemented

- optimistic pre-create
- payment method
- discounts/promos
- delivery fee
- modifiers/variants
- stock decrement
- customer CRM
- cierre de caja
- session selector

## Comportamiento preservado

- M1 server contract intacto.
- M2 modal intacto (estructura ampliada, no rediseño).
- M3 toolbar/reconciliation intactos.
- C2/C3/C4/C4.1 intactos.
- Checkout público intacto.
- Pricing server-side intacto.
- Status/assignment workflow intacto.

## Qué NO se cambió

- DB/schema
- RLS
- RPC `public.create_order`
- server pricing
- checkout público
- realtime internals (`lib/orders/realtime.ts`, `dashboard-order-reconciliation.ts`)
- card/kanban layout
- theme tokens/global CSS

## Riesgos encontrados

- Productos en `selectedItems` pueden quedar stale si se desactivan entre refresh y submit (RPC devuelve `PRODUCT_UNAVAILABLE`).
- Push best-effort puede no notificar si la route falla (aceptable).
- `delivery_date` UTC sigue siendo deuda conocida de M1.

## Validaciones ejecutadas

- `npm run build`
- `npx tsc --noEmit`
- `npm run lint`

## Deuda técnica restante

- QA manual end-to-end con sesión real.
- Refrescar picker también al reabrir modal ya abierto (solo refresh on open hoy).
- Timezone operativa para `delivery_date`.

## Próxima fase recomendada

**B9 — Final QA / Production Readiness** — QA cross-browser, regresión C2–M4, smoke checkout + manual order en staging.
