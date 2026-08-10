# PUBLIC-CATALOG-CART-FAB-ACCENT-FILL-FOLLOWUP-1

## Estado

**PASS WITH MINOR FAB DEBT — CART FAB ACCENT FILL FOLLOWUP VERIFIED**

## Contexto

Followup de `PUBLIC-CATALOG-CART-FAB-CONTRAST-POLISH-1` (surface + ring). QA visual: el FAB seguía sintiéndose parte del fondo, sobre todo en dark, y no invitaba lo suficiente a abrir el carrito.

## Problema visual pendiente

```text
Light: ring mejoraba separación, pero el FAB parecía chip secundario.
Dark: surface elevated seguía mezclándose con canvas/card.
Intención “carrito activo / revisar pedido” insuficiente.
```

## Decisión visual

```text
Accent fill sólido (business primary / teal).
Pill/cápsula + icono carrito + count (acción global).
Quick-add permanece círculo + (acción local) — sin tocar.
```

Nota de tokens: `--catalog-accent` en globals es tipografía (`#1f1a14` / cream), **no** el teal de marca. El FAB usa `--business-primary` / `--business-primary-foreground` (mismo accent que checkout/quick-add).

## Cambios aplicados

| Archivo | Cambio |
|---------|--------|
| `components/public/catalog/cart-bar.module.css` | Fill sólido accent; foreground blanco; halo canvas 4px; sombra; focus-visible claro sobre teal; dark halo `#12100d` |
| `docs/public-catalog-cart-fab-accent-fill-followup-1.md` | Este documento |

TSX: **CSS-only** (sin cambios en `cart-bar.tsx`).

## Light theme

```text
background: --business-primary → rgb(15, 118, 110)
color: #fff
border: accent darkened ~76/24
box-shadow: halo cream 4px + 0 12px 28px rgba(32,23,15,0.18)
shape: pill ~70×52, radius 999px
```

## Dark theme

```text
background: mismo teal sólido
color: #fff
halo: canvas dark #12100d
shadow: 0 14px 32px rgba(0,0,0,0.56)
isWhite: false — protagonista sobre card dark
```

## Diferenciación con quick-add

| | Quick-add | Cart FAB |
|---|-----------|----------|
| Forma | círculo ~38–44 | pill ~70×52 |
| Contenido | `+` | carrito + count |
| Rol | producto local | pedido global |
| Color fill | teal | mismo teal (intencional) |

`sameSolidAsPlus: true` en color; `isCircle: false` en FAB → no se confunden por forma/contenido.

## Position / overlap

- Fixed bottom/right + safe-area preservados.
- Sin sticky bar / sin mover a header.
- P3: overlap espacial residual con quick-add en viewport (aceptado).

## Accessibility

- Contraste blanco sobre teal.
- Tap target ≥52px.
- `aria-label` intacto.
- `:focus-visible` outline mix accent/white 3px + offset 3px.
- Button + CartSheet open preservados.

## Browser QA

### Light

- FAB teal sólido, icono/count blancos, halo cream, pill no circular.

### Dark

- Mismo teal; halo oscuro; sin white surface; destaca sobre fondo.

### Quick-add distinction

- Círculo `+` vs pill carrito+count confirmado.

### CartSheet

- Click FAB abre “Tu pedido”; Cerrar OK. CartSheet no modificado.

### Count

- Label `Ver pedido, 2 productos` con count `2`.

### Empty cart

- Contrato intacto en `cart-bar.tsx` (`count <= 0` → `null`); TSX no tocado.
- Verificado en fase contrast previa; en este followup el fill no altera hide semantics.

### Desktop/tablet

- 1440×900: ~70×52, bottom-right, no sobredimensionado.

### Focus

- Regla focus-visible presente.

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
✓ count > 0 → FAB
✓ click → CartSheet
✓ empty → hide
✓ aria-label / button / storage / quick-add / checkout / success
✓ CSS-only
```

## Deuda aceptada

```text
P3 — overlap espacial residual FAB vs quick-add
OPTIONAL — SUCCESS-EDGE-STATES-POLISH-1
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
