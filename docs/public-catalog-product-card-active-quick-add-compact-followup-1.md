# PUBLIC-CATALOG-PRODUCT-CARD-ACTIVE-QUICK-ADD-COMPACT-FOLLOWUP-1

## Estado

**PASS WITH MINOR QUICK-ADD DEBT — PRODUCT CARD ACTIVE QUICK-ADD COMPACT FOLLOWUP VERIFIED**

## Contexto

Followup de `PUBLIC-CATALOG-PRODUCT-CARD-QUANTITY-STEPPER-OVERLAY-FIX-1`. El overlay `- 1 +` resolvía overlap de precio pero dejaba stepper grande sobre imagen, hueco en footer y nested interactive. Nueva decisión: quick-add compacto con badge; restar en CartSheet.

## Problema visual pendiente

```text
Media: imagen tapada por stepper grande
Footer: hueco sin acción cuando quantity > 0
A11y: nested interactive dentro del hit
```

## Decisión UX

```text
Grilla = descubrir + sumar rápido
CartSheet = revisar / editar / restar
quantity = 0 → + circular footer
quantity > 0 → + circular footer + badge cantidad (tap incrementa)
```

## Cambios aplicados

| Archivo | Cambio |
|---------|--------|
| `components/public/catalog/product-card.tsx` | Eliminado overlay/stepper/`onDecrementProduct`; footer siempre muestra `+`; badge si `quantity > 0`; increment vía `onIncrementProduct` si no requiere customización |
| `components/public/catalog/product-card.module.css` | Removidas `.quantityOverlay`/`.qty`; añadido `.quantityBadge` light/dark |
| `components/public/catalog/catalog-client.tsx` | Deja de pasar `onDecrementProduct` a ProductCard (handler global sigue para CartSheet) |
| `docs/public-catalog-product-card-active-quick-add-compact-followup-1.md` | Este documento |

## Quantity 0

- Footer: precio + `+` teal circular (sin badge).
- Media limpia.

## Quantity active quick-add

- Mismo botón `+` en footer.
- Click → `onIncrementProduct` (o `onAddProduct` si `requiresCustomization`).
- Aria: `Agregar otra unidad de {name}. {n} en el carrito.`

## Badge

- Absolute top-right del botón; `aria-hidden` (cantidad en aria-label).
- Light: surface blanca + texto teal.
- Dark: elevated `#1d1712` mix + texto cream (`isWhiteBadge: false`).

## Price/footer

- Flex balanceado precio | acción; sin hueco.
- CDP Sprite/Coca: precio completo, sin overlay, `cardH: 306` estable.

## Light theme

- Badge white/teal; plus teal; precio limpio.

## Dark theme

- Badge elevated dark; no white chillón grande.

## CartSheet decrement

- ProductCard ya no expone `-`.
- CartSheet conserva Disminuir/Eliminar/Aumentar (sin cambios de archivo).
- QA: sheet abre con controles de cantidad; decremento de ProductCard eliminado por diseño.

## Product detail/customization

- BBQ Bacon → modal/dialog detectado.
- `requiresCustomization` sigue usando `onAddProduct` (Elegir opciones…).

## Accessibility

- Button real en footer (fuera del hit) + `stopPropagation`.
- Sin nested interactive del overlay.
- Tap target 44px; focus-visible preservado.
- Badge aria-hidden; label informa cantidad.

## Browser QA

### Quantity 0

- Sprite pre-add / post-remove esperado: label `Agregar … al pedido` sin badge.

### Quantity 1

- Sprite: badge `1`, precio `$ 2.900,00`, `hasOverlay: false`, footer con `+`.

### Quantity 2+

- Coca: badge `2`, label con “2 en el carrito”, FAB count presente.

### Decrement desde CartSheet

- Controles Disminuir/Eliminar presentes en sheet; ProductCard sin `Quitar uno` (`quitarOnCards: 0`).

### Light / Dark

- Badge legible; dark no white fill.

### Product detail/customization

- Modal OK.

### FAB

- Pill teal; count coherente con carrito.

### Desktop/tablet

- Mismos estilos; badge no agranda card.

### Focus

- Focus-visible en `.plus` intacto.

## Console / network QA

```text
create_order: 0
pedidos reales: 0
PII/tokens: no registrados
```

## Validación

```text
tsc / next build: PASS
git diff --check: PASS (warning CRLF ajeno success)
HTTP catalogo/checkout/success: 200
tsconfig.tsbuildinfo: restaurado si apareció
```

## Contratos preservados

```text
✓ add / increment desde ProductCard
✓ decrement solo vía CartSheet (handler global intacto)
✓ customization / upsell / FAB / storage
✓ sin card height increase / grid 2 col
✓ sin checkout/success/FAB/CartSheet CSS-TSX changes (salvo prop cleanup)
```

## Deuda aceptada

```text
P3 — badge size/contrast fine-tuning opcional en viewports extremos
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
