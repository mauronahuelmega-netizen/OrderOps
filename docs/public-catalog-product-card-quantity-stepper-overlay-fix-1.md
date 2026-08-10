# PUBLIC-CATALOG-PRODUCT-CARD-QUANTITY-STEPPER-OVERLAY-FIX-1

## Estado

**PASS WITH MINOR STEPPER DEBT — PRODUCT CARD QUANTITY STEPPER OVERLAY FIX VERIFIED**

## Contexto

En grid mobile 2 columnas, el quick-add circular `+` coexistía bien con el precio, pero el stepper activo `- 1 +` en el footer invadía precios como `$ 2.900,00` (Sprite). Decisión: **Opción A** — mover solo el stepper activo a overlay sobre media, sin subir altura de card.

## Problema visual

```text
Footer [ precio ] [ - 1 + ] → overlap/invasión en cards angostas.
Card height workarounds (:has(.qty) row break) no resolvían limpieza del precio.
```

## Decisión UX

```text
quantity = 0 → precio + `+` circular en footer (igual que antes).
quantity > 0 → `- 1 +` overlay bottom-right sobre media; footer solo precio.
```

## Cambios aplicados

| Archivo | Cambio |
|---------|--------|
| `components/public/catalog/product-card.tsx` | Stepper activo dentro de `.media`; footer solo renderiza `+` si `!showQuantityControl`; `stopPropagation` en overlay |
| `components/public/catalog/product-card.module.css` | `.quantityOverlay` absolute; `.qty` pill glass; dark elevated; footer flex; removido hack `:has(.qty)` |
| `docs/public-catalog-product-card-quantity-stepper-overlay-fix-1.md` | Este documento |

Handlers (`onAddProduct` / `onIncrementProduct` / `onDecrementProduct`) y aria-labels **intactos**.

## Quantity 0

- Footer: precio + botón circular teal `+`.
- Sin overlay en media.
- Layout compacto preservado.

## Quantity active overlay

- Overlay `right/bottom ~0.55rem` sobre media `position: relative`.
- Pill ~100×40 (`36+28+36`), radius 999.
- CDP Sprite @390: `overlayInMedia: true`, `priceOverlap: false`, precio `$ 2.900,00`, `cardH: 306` (sin crecimiento).

## Price/footer

- Footer flex `space-between`; sin columna vacía del stepper.
- Precio `nowrap` completo.
- `priceRow` min-height 44px mantiene ancla vertical del footer.

## Light theme

- Qty surface: `color-mix(surface-strong 92%, transparent)` + halo canvas + sombra suave.

## Dark theme

- Qty: elevated `#1d1712` mix (no white); texto `#f8f2e8`.
- CDP: `bg rgb(55,49,44)`, `isWhite: false`.

## Accessibility

- Buttons reales `-` / `+` con aria-labels previos.
- Tap targets ≥36–40px.
- `focus-visible` outline accent.
- `stopPropagation` evita abrir detalle al tocar stepper.
- **P3:** stepper vive dentro de `role="button"` del hit (nested interactive). Mitigado con stopPropagation; deuda a11y menor aceptada.

## Browser QA

### Quantity 0

- Sprite pre-add: `Agregar Sprite` en footer + precio.

### Quantity 1

- Sprite post-add: overlay + precio limpio `$ 2.900,00`; sin overlap; FAB count sube.

### Quantity 2+

- Controles `Sumar`/`Quitar` presentes; mismos handlers (markup movido).

### Decrement to 0

- Contrato: `showQuantityControl = quantity > 0` → vuelve `+` en footer (TSX).

### Light / Dark

- Overlay legible; dark sin white fill.

### Product detail/customization

- Abrir BBQ Bacon → dialog/modal detectado; flujo no alterado.

### CartSheet/FAB

- FAB presente con count; CartSheet no modificado en esta fase.

### Desktop/tablet

- Overlay offsets aumentan levemente `@768+`; media 1:1 intacta.

### Focus

- Reglas focus-visible en `.qty button` preservadas.

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
✓ add / increment / decrement handlers
✓ quantity 0 ↔ quick-add
✓ cart signatures / storage / FAB / CartSheet / customization
✓ grid 2 col / aspect media / sin card height increase
✓ sin checkout/success/FAB CSS changes
```

## Deuda aceptada

```text
P3 — nested interactive (stepper dentro de hit role=button)
P3 — overlay cubre esquina inferior de imagen (esperado Opción A)
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
