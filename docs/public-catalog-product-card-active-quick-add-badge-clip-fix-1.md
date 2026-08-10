# PUBLIC-CATALOG-PRODUCT-CARD-ACTIVE-QUICK-ADD-BADGE-CLIP-FIX-1

## Estado

**PASS — PRODUCT CARD ACTIVE QUICK-ADD BADGE CLIP FIX VERIFIED**

## Contexto

Followup de `PUBLIC-CATALOG-PRODUCT-CARD-ACTIVE-QUICK-ADD-COMPACT-FOLLOWUP-1`. El badge absoluto externo se recortaba por `overflow: hidden` de la card. Se reemplaza por control pill interno `[ + n ]`.

## Problema visual

```text
quantity > 0: badge absolute top/right → número cortado / bug visual.
```

## Decisión UX

```text
quantity = 0 → + circular
quantity > 0 → pill interna [ + n ] (sin badge externo)
decremento → CartSheet
```

## Cambios aplicados

| Archivo | Cambio |
|---------|--------|
| `components/public/catalog/product-card.tsx` | `plusActive` + `quantityInline` (reemplaza `quantityBadge`) |
| `components/public/catalog/product-card.module.css` | Pill activa; `::before` full-bleed; cantidad `position: static`; eliminado badge absoluto |
| `docs/public-catalog-product-card-active-quick-add-badge-clip-fix-1.md` | Este documento |

## Quantity 0

- Botón circular 44×44; sin número.
- CDP Sprite: `btnW: 44`, `qty: null`.

## Quantity active control

- Pill `min-width ~3.15rem`, gap `+` / cantidad, teal, texto blanco.
- CDP Coca/Clásica/Combo: `btnW: 55`, `btnH: 44`, `qtyPosition: static`, `clippedByCard/Btn: false`.

## Price/footer

- Combo BBQ `$ 22.000,00` + pill qty 2: `priceOverlap: false`, `gap: 6`, `cardH: 306`.

## Light theme

- Teal fill; `+` y número blancos; sin bubble externa.

## Dark theme

- Mismo teal + blanco; sin white badge; sin recorte.

## CartSheet decrement

- Sin cambios de CartSheet; ProductCard sin `-`.
- Contrato preservado desde fase anterior.

## Product detail/customization

- Handlers `onAddProduct` / `onIncrementProduct` intactos; `requiresCustomization` sin cambio.

## Accessibility

- Aria-label con cantidad; `quantityInline` `aria-hidden`.
- Focus-visible / tap ≥44px / botón en footer (fuera del hit).

## Browser QA

### Quantity 0

- Sprite circular sin número.

### Quantity 1 / 2+

- Clásica `1`, Coca `2`, Combo BBQ `2`; sin clip.

### Precios largos

- `$ 22.000,00` completo junto a pill.

### Decrement desde CartSheet

- Sin `Quitar` en card; decremento vía CartSheet (no modificado).

### Light / Dark

- Sin recorte; dark sin white bubble.

### Product detail/customization / FAB / Desktop / Focus

- Contratos intactos; FAB count actualiza (6 productos tras Combo).

## Console / network QA

```text
create_order: 0
pedidos reales: 0
```

## Validación

```text
tsc / next build: PASS
git diff --check: PASS (warning CRLF ajeno success)
HTTP catalogo/checkout/success: 200
```

## Contratos preservados

```text
✓ add / increment
✓ decrement solo CartSheet
✓ customization / FAB / storage
✓ sin overlay / sin stepper - 1 +
✓ sin card height increase
```

## Deuda aceptada

```text
P3 opcional — microajuste gap pill vs precios extremos
OPTIONAL — SUCCESS-EDGE-STATES
BACKLOG — public_order_code
PAUSED — Maps/address
```

## Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-UI-REDESIGN-CLOSEOUT-1 = ALLOWED
QUEUE_GATE: PUBLIC-CATALOG-SUCCESS-EDGE-STATES-POLISH-1 = OPTIONAL
QUEUE_GATE: PUBLIC-ORDERS-PUBLIC-CODE-SPEC-1 = BACKLOG
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-* = PAUSED
```
