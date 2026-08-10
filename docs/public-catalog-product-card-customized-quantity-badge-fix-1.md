# PUBLIC-CATALOG-PRODUCT-CARD-CUSTOMIZED-QUANTITY-BADGE-FIX-1

## Estado

PASS — CUSTOMIZED PRODUCT QUANTITY BADGE FIX VERIFIED

## Contexto

Tras `PUBLIC-CATALOG-PRODUCT-CARD-CUSTOMIZED-QUANTITY-BADGE-AUDIT-1`, el ProductCard no mostraba badge en productos customizados (p.ej. Doble Smash) porque `quantityByProductId` solo sumaba líneas legacy vía `getLegacyQuantityForProduct`.

Esta fase corrige la derivación de cantidad visual para ProductCard sin cambiar signatures, storage, CartSheet, checkout ni create_order.

## Causa confirmada

```189:195:components/public/catalog/catalog-client.tsx
// (antes) getLegacyQuantityForProduct → V2 parents siempre 0
```

```243:251:lib/cart/local.ts
// getLegacyQuantityForProduct solo encuentra schemaVersion 1
```

## Cambios aplicados

| Archivo | Cambio |
|---------|--------|
| `lib/cart/local.ts` | Nuevo helper puro `getRootQuantityForProduct` |
| `components/public/catalog/catalog-client.tsx` | `quantityByProductId` usa root display qty |
| `components/public/catalog/product-card.tsx` | Aria custom incluye `N en el carrito` si quantity > 0 |
| `docs/public-catalog-product-card-customized-quantity-badge-fix-1.md` | Este documento |

Sin cambios en CSS, CartSheet, FAB logic, signatures, storage, checkout/success.

## Quantity derivation

`catalog-client.tsx` mantiene el Map `quantityByProductId` (nombre preservado; semántica = root display quantity):

```ts
map.set(product.id, getRootQuantityForProduct(cartItems, product.id));
```

## Legacy root count

`getRootQuantityForProduct` suma `item.quantity` cuando `isLocalCartLegacyItem(item) && item.productId === productId`.

## V2 parent root count

Suma `item.quantity` cuando `isV2ParentCartItem(item) && item.productId === productId`
(`itemKind === "product"` && `parentCartLineId === null`).

Múltiples parents del mismo `productId` (distinta `configurationSignature`) se agregan.

## Child/adicional exclusion

No se cuentan:

- `itemKind === "upsell"`
- cualquier línea con `parentCartLineId != null`
- cualquier V2 no-parent

## ProductCard behavior

Preservado:

- `canInlineIncrement = !requiresCustomization && hasQuantity`
- Simple + qty > 0 → increment legacy
- Custom + qty > 0 → `onAddProduct` → modal (no clona última config)
- Badge circular flotante si `quantity > 0` (CSS intacto)

## Accessibility

Custom con cantidad:

`Elegir opciones para {name}. {quantity} en el carrito.`

Custom sin cantidad:

`Elegir opciones para {name}`

Badge sigue `aria-hidden="true"`.

## Browser QA

Ruta: `http://localhost:3000/b/demohamburgueseria/catalogo`

### Simple product

- Cart vacío → Sprite + → aria `1 en el carrito`, FAB 1
- Increment JS → aria `2 en el carrito`, FAB 2
- PASS

### Customized product

- Doble Smash + Papas chicas → aria `Elegir opciones para Doble Smash. 1 en el carrito.`, FAB 3 (2 Sprite + 1 root)
- Badge visual `1` en quick-add
- PASS

### Custom active plus

- Tap + con badge 1 → abre modal; FAB permanece 3 (no incrementa directo)
- PASS

### Same signature

- Cubierto por helper: suma `quantity` del parent V2 (merge CartSheet incrementa la misma línea)
- No se re-ejecutó merge misma signature en browser; comportamiento de merge no tocado
- PASS (código + contrato)

### Different signatures

- Segunda config Papas grandes → badge `2`, FAB 4; CartSheet dos líneas Doble Smash
- PASS

### Nested additional

- Post-add upsell Coca Cola adjunto al parent
- CartSheet: Coca como Adicional nested
- ProductCard Coca: `Agregar Coca Cola 500ml al pedido` (sin badge)
- FAB sin +1 por child (sigue roots-only)
- PASS

### Decrement from CartSheet

- Disminuir un Doble Smash → badge `2`→`1`, FAB `4`→`3`
- PASS

### Light / dark

- Light: badge custom OK
- Dark (`data-theme=dark`): badge `1` visible sobre `+` teal; footer limpio
- PASS

### Search / category

- Search “Doble Smash” / category nav: badge persistió
- PASS

### Customization modal

- Abre/cierra; confirm agrega; post-add upsell intacto
- PASS

## Console / network QA

- create_order resource hits: 0
- Pedidos reales: 0
- Sin errores de hidratación observados en el flujo QA

## Validación

| Check | Resultado |
|-------|-----------|
| `tsc --noEmit` | PASS |
| `npm run build` | PASS |
| HTTP catalogo/checkout/success | 200 / 200 / 200 |
| `git diff --check` (archivos tocados) | PASS |

## Contratos preservados

- Cart signatures / merge rules
- Storage keys legacy + v2
- CartSheet decrement / edit
- FAB `getCartItemCount` (roots)
- Checkout / success / create_order
- ProductCard visual badge (sin CSS)
- Grilla suma / CartSheet resta

## Deuda aceptada

Ninguna bloqueante. Same-signature merge no re-probado end-to-end en browser; cubierto por helper + contrato existente de merge.

## Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-UI-REDESIGN-CLOSEOUT-1 = ALLOWED
QUEUE_GATE: PUBLIC-CATALOG-SUCCESS-EDGE-STATES-POLISH-1 = OPTIONAL
QUEUE_GATE: PUBLIC-ORDERS-PUBLIC-CODE-SPEC-1 = BACKLOG
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-* = PAUSED
```
