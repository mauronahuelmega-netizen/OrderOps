# PUBLIC-CATALOG-PRODUCT-CARD-ACTIVE-QUICK-ADD-BADGE-FLOAT-RESTORE-1

## Estado

PASS — PRODUCT CARD ACTIVE QUICK-ADD BADGE FLOAT RESTORE VERIFIED

## Contexto

La fase `PUBLIC-CATALOG-PRODUCT-CARD-ACTIVE-QUICK-ADD-BADGE-CLIP-FIX-1` resolvió el clipping del número convirtiendo el quick-add activo en pill interna `[ + n ]`. Esa dirección visual quedó rechazada: el patrón correcto es botón circular `+` + badge flotante de cantidad.

## Problema visual

- Pill interna `[ + n ]` cambia demasiado el affordance del quick-add.
- Pierde la limpieza del botón circular teal.
- El problema real a resolver era clipping por `overflow: hidden` en `.card`, no el formato del control.

## Decisión UX

```text
quantity = 0 → botón circular teal +
quantity > 0 → botón circular teal + + badge flotante pequeño con cantidad
decremento → solo CartSheet
```

Sin overlay sobre imagen, sin stepper `- 1 +`, sin pill, sin aumentar altura de card.

## Cambios aplicados

- `product-card.tsx`: eliminado `plusActive` / `quantityInline`; wrapper `quickAddSlot` con botón circular + `quantityBadge` sibling.
- `product-card.module.css`: slot seguro que reserva espacio; badge absoluto con offsets leves dentro del slot; estilos light/dark del badge; removidos estilos de pill.

## Quantity 0

Botón circular `+` sin badge. Verificado con Sprite tras decremento a 0 desde CartSheet (`Agregar Sprite 500ml al pedido`).

## Quantity active badge

Coca/Sprite/Combo BBQ con quantity > 0 muestran badge absoluto (`1`/`2`/`3`) sibling del botón circular 44×44 (`border-radius: 999px`). No pill.

## Clipping fix

Causa: `.card { overflow: hidden }`. Solución: `quickAddSlot` (~2.95×2.85rem) contiene el badge con `top/right` no negativos agresivos. Medición DOM: `badgeInCard: true` en Coca, Sprite, Combo BBQ.

## Price/footer

Precios completos sin overlap:

- Sprite `$ 2.900,00` (gap ~22px)
- Coca `$ 3.000,00` (gap ~22px)
- Combo BBQ `$ 22.000,00` (gap ~12px)
- Combo Chicken `$ 18.500,00` (qty 0)

Altura de card estable (~307px en 390×844). Sin wrap vertical del precio.

## Light theme

Botón teal circular; badge surface clara + texto teal + halo; número legible sin corte.

## Dark theme

Botón teal circular; badge elevated dark (`rgb(77,71,65)`) + texto claro (`rgb(248,242,232)`); sin white bubble grande; sin clip.

## CartSheet decrement

Abrir FAB → Disminuir Sprite → qty 0 → ProductCard vuelve a `+` circular sin badge; FAB count 8→7. CartSheet UI intacta.

## Product detail/customization

`Elegir opciones para BBQ Bacon` / `Ver BBQ Bacon` preservan flujo de opciones; quick-add no introduce stepper ni decremento en card.

## Accessibility

- Button real con `aria-label` que informa agregar + cantidad actual.
- `quantityBadge` con `aria-hidden="true"`.
- Tap target 44px; `focus-visible` outline en `.plus`.

## Browser QA

### Quantity 0

PASS — Sprite sin badge, botón circular.

### Quantity 1

PASS — Sprite badge `1`, circular, sin pill, precio completo.

### Quantity 2+

PASS — Coca incrementó a 3; badge `3`; FAB actualizó.

### Precios largos

PASS — Combo BBQ `$ 22.000,00` completo + badge sin overlap.

### Decrement desde CartSheet

PASS — Sprite a 0; card sin badge.

### Light

PASS — badge claro/teal legible.

### Dark

PASS — badge elevated dark legible.

### Product detail/customization

PASS — flujo de opciones intacto (no regresiones de markup/handlers).

### FAB

PASS — teal pill + count correcto.

### Desktop/tablet

PASS — métricas geométricas consistentes; viewport 1440×900 aplicado sin clip.

### Focus

PASS — botón real + `focus-visible` CSS preservado.

## Console / network QA

- Sin errores de hidratación observados en flujo QA.
- `create_order`: 0
- Pedidos reales: 0

## Validación

- `tsc --noEmit`: PASS
- `npm run build`: PASS
- HTTP smoke: catalogo/checkout/success → 200
- `git diff --check`: PASS (product-card)
- `tsconfig.tsbuildinfo` restaurado / no commiteado
- Customization modal BBQ Bacon: abre y cierra OK

## Contratos preservados

- add/increment desde ProductCard
- decrement solo CartSheet
- cart signatures / storage / FAB / customization / checkout navigation
- sin cambios en cart-bar, cart-sheet, checkout, success, DB/RPC

## Deuda aceptada

P3 menor opcional: fine-tuning milimétrico de badge vs FAB overlap en cards inferiores del viewport móvil (no clipping del badge).

## Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-UI-REDESIGN-CLOSEOUT-1 = ALLOWED
QUEUE_GATE: PUBLIC-CATALOG-SUCCESS-EDGE-STATES-POLISH-1 = OPTIONAL
QUEUE_GATE: PUBLIC-ORDERS-PUBLIC-CODE-SPEC-1 = BACKLOG
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-* = PAUSED
```
