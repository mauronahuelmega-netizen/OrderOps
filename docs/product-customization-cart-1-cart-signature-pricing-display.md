# PRODUCT-CUSTOMIZATION-CART-1 — Cart Signature, Pricing & Display

## Objetivo

Conectar el modal de personalización (CATALOG-1) al carrito local V2: signature, dedup, display jerárquico, edit from cart y guard de checkout — **sin** enviar customizations a `create_order`/RPC.

## Contexto

- CATALOG-1: modal lazy, summaries, CTA sin persistir.
- Flag `product_customization_enabled` sigue **off**.
- Checkout legacy solo entiende items base.

## Scope

- `LocalCartItemV2` + discriminador union con legacy.
- Storage dual (`orderops-cart` + `orderops-cart-v2`).
- `configurationSignature` estable.
- Dedup por signature; líneas distintas por configuración.
- Upsell como hijo (`itemKind: "upsell"`, qty sincronizada con parent).
- Cart sheet jerárquico + editar/eliminar.
- Checkout guard client-side.
- Compatibilidad legacy con flag off.

## Fuera de scope

- `create_order` / RPC / `customization_snapshot`.
- Activar feature flag.
- DB/migrations/RLS.
- Dashboard / pedido manual.

## Archivos creados/modificados

### Creados

- `lib/cart/types.ts`
- `lib/cart/signature.ts`
- `components/public/catalog/cart-sheet.tsx`
- `components/public/catalog/cart-sheet.module.css`
- `docs/product-customization-cart-1-cart-signature-pricing-display.md`

### Modificados

- `lib/cart/local.ts` — parsers, persistencia unificada, merge/remove/qty helpers
- `components/public/catalog/customization-modal.tsx` — confirma y escribe carrito
- `components/public/catalog/catalog-client.tsx` — cart V2 + sheet + edit
- `components/public/catalog/cart-bar.tsx` — abre sheet (ya no navega directo)
- `components/public/checkout/checkout-client.tsx` — guard client-side
- `docs/CURRENT_PHASE.md`
- `ORDEROPS_LIVING_MEMORY.md`

## LocalCartItemV2

Discriminador: `schemaVersion: 2` + `cartLineId`.

Campos clave: `selectedGroups`, `customizationTotal`, `finalUnitPrice`, `lineTotal`, `configurationSignature`, `displaySummary`, `itemKind`, `parentCartLineId`.

Legacy: `schemaVersion?: 1` (o ausente) con shape histórico.

## Storage strategy

| Key | Contenido |
|-----|-----------|
| `orderops-cart:{businessId}` | Solo items legacy (checkout sigue leyendo esto) |
| `orderops-cart-v2:{businessId}` | Solo items V2 (product + upsell) |

- No se borra el carrito legacy al agregar V2.
- `loadUnifiedCartItems` / `persistUnifiedCartItems` mantienen ambos.
- Si parse falla → array vacío (patrón existente).

## configurationSignature

```txt
product:<productId>|groups:<groupId>:<optionId>,...;...|upsells:<id>,...
```

- Sin nombres, precios ni quantity.
- Grupos y options ordenados de forma estable.
- Helper: `buildCartConfigurationSignature`.

## Dedup rules

- Misma signature + `itemKind=product` → incrementa `quantity`.
- Signature distinta → nueva línea.
- Al editar: remove línea vieja (`replaceCartLineId`) → upsert (puede fusionar con otra línea).

## Upsell parent/child model

- Hijo: `itemKind: "upsell"`, `parentCartLineId`.
- **Quantity sincronizada con el parent** (regla CART-1).
- Quitar hijo: solo elimina ese upsell.
- Quitar parent: elimina parent + hijos.
- Upsells entran en la signature del parent (mismas opciones + distintos upsells = líneas distintas).

## Modal → cart integration

CTA “Agregar al carrito” / “Actualizar carrito”:

1. Valida required/min/max.
2. `buildCartLinesFromCustomizationSelection`.
3. `mergeCustomizedSelectionIntoCart`.
4. Cierra modal y abre cart sheet.

No llama checkout ni backend.

## Cart display

`CartSheet` (desde “Ver pedido”):

- Legacy: nombre + qty + total.
- Custom: parent + `displaySummary` + hijos “+ Producto”.
- Acciones: qty parent, Editar, Eliminar, Quitar upsell.

## Edit from cart

“Editar” reabre modal con `initialSelection` + `editingCartLineId`. Opciones stale se filtran con aviso.

## Checkout guard

Bloqueado si hay cualquier item V2:

1. Cart sheet: CTA “Checkout pendiente” + mensaje.
2. `/checkout` directo: pantalla de aviso (no formulario).
3. `handleSubmit`: re-check + no llama `createPublicCheckoutOrderAction`.

Mensaje:

> Los productos personalizados todavía no pueden finalizarse. La conexión al pedido se implementará en la próxima fase.

**No** se modificó `app/b/[slug]/checkout/actions.ts` ni RPC.

## Feature flag behavior

- Flag off: sin modal/custom flow; legacy add + sheet + checkout OK.
- Flag on: modal → V2 cart (QA pendiente de autorización).
- Flag no activado en esta fase.

## Backward compatibility

- Key legacy intacta.
- `parseLocalCartItems` sigue filtrando solo legacy.
- Product cards usan qty solo de líneas legacy.
- Checkout legacy solo envía `productId` + `quantity` de items legacy.

## Error handling

- Fallo al confirmar modal: mensaje, no cierra, no agrega base.
- localStorage fail: carrito en memoria; no rompe UI.
- Config stale al editar: aviso + selección filtrada.

## Validaciones CLI

- `npx tsc --noEmit` → PASS
- `npm run build` → PASS

## Browser QA flag off

Ejecutado en `localhost:3000` (2026-07-13):

| Check | Resultado |
|-------|-----------|
| Catálogo carga | PASS |
| Sin “Desde” | PASS |
| Add legacy → qty + localStorage legacy | PASS |
| `orderops-cart-v2` vacío (`[]`) | PASS |
| Cart bar = `<button>` “Ver pedido” | PASS |
| Cart sheet abre con items legacy | PASS |
| CTA “Continuar al checkout” habilitada (solo legacy) | PASS |
| `/checkout` formulario legacy accesible | PASS |
| Sin modal customization | PASS |

`/admin/dashboard`: no revalidado en esta corrida (fase no toca dashboard).

## Browser QA flag on

No ejecutado (sin autorización para activar flag).

## Datos QA

Catálogo demo existente; sin seeds; flag no tocado.

## Qué NO se tocó

- `checkout/actions.ts` (server)
- `create_order` / RPC
- migrations / RLS
- dashboard
- activación de flag

## Riesgos / deuda

- Flag-on E2E pendiente.
- Cart bar cambió de `<Link>` a `<button>` (abre sheet); UX distinto pero necesario para display/edit.
- Precios locales no son fuente de verdad para ORDER-1.
- Carrito mixto legacy+V2 bloquea todo el checkout (fail-closed correcto).

## Resultado final

**PASS WITH DEBT**

## Próxima fase recomendada

**PRODUCT-CUSTOMIZATION-ORDER-1** — RPC/server validation + `customization_snapshot` + desbloquear checkout para items V2.
