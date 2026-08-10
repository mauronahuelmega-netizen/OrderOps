# PUBLIC-CATALOG-CART-FAB-CONTRAST-POLISH-1

## Estado

**PASS — CART FAB CONTRAST POLISH VERIFIED**

## Contexto

Antes del closeout del UI redesign, el FAB flotante del carrito (`CartBar` → `.fab`) tenía separación débil sobre cards cream en light y se mezclaba con surfaces dark. Decisión: **Opción B** — surface elevada + ring/borde accent sutil. Sin sticky bar, sin cambiar CartSheet/checkout/success/cart logic.

## Problema visual

```text
Light: FAB blanco sobre cards cream — legible pero jerarquía débil.
Dark: FAB se fundía con canvas/card; sombra/borde insuficientes; riesgo de competencia visual con quick-add teal sólido.
```

## Cambios aplicados

| Archivo | Cambio |
|---------|--------|
| `components/public/catalog/cart-bar.module.css` | Tokens locales `--cart-fab-*`; ring accent + sombra de separación; dark surface elevated (mix `#1d1712` + accent 18%) + texto claro |
| `docs/public-catalog-cart-fab-contrast-polish-1.md` | Este documento |

TSX: **sin cambios** (CSS-only).
Fuente del FAB: `components/public/catalog/cart-bar.tsx` (button, `count > 0`, `onOpenCart` → CartSheet).

## Light theme

```text
surface: --catalog-surface-strong (#fff)
text: --catalog-text (#20170f)
border: accent mix ~28% sobre catalog-border
box-shadow: ring accent 22% + 0 10px 24px rgba(32,23,15,0.10)
```

CDP @390 light: bg `rgb(255,255,255)`, ring teal sutil, min 52×52, count legible. No disabled look. Distinto de quick-add sólido `rgb(15,118,110)`.

## Dark theme

```text
surface: color-mix(#1d1712 82%, accent 18%) — elevated, no white
text: #f8f2e8
border/ring: accent sutil
shadow: ring + 0 14px 30px rgba(0,0,0,0.48)
```

Bases dark hardcodeadas para que el FAB fixed no herede tokens light si el tema en `html`/`catalog-page` desync. CDP dark: surface oscura elevada, texto claro, `isWhite: false`, `sameAsPlus: false`.

## Quick-add relationship

- Quick-add: pill teal sólido (`product-card` `.plus::before`) — **no tocado**.
- FAB: surface + ring accent, icono carrito + count — no 100% teal sólido.
- Posición fixed bottom/right preservada (14px + safe-area). Overlap geométrico posible con cards inferiores (comportamiento previo); no micro-offset en esta fase.

## Accessibility

- `aria-label` intacto (`Ver pedido, N producto(s)`).
- Tap target ≥52px.
- `:focus-visible` outline accent + offset 3px (regla presente).
- Button semantics / click → CartSheet preservados.
- `prefers-reduced-motion` respeta animation:none.

## Browser QA

### Light

- FAB visible con 1+ ítems; ring + sombra; contraste sobre cream OK.

### Dark

- Theme sync `html[data-catalog-theme]` + `.catalog-page[data-theme]`; surface elevated; no white panel; no idéntico a quick-add.

### CartSheet

- Click FAB abre “Tu pedido” / Cerrar carrito; close OK. CartSheet CSS/TSX no modificados.

### Count

- 1 → 2 al agregar Coca; label `Ver pedido, 2 productos`.

### Empty cart

- Tras vaciar qty: FAB ausente (`emptyWasHidden: true`). Sin ghost.

### Overlap

- FAB vs quick-add: distintos visualmente; overlap espacial residual aceptado (P3).

### Desktop/tablet

- 1440×900: fixed bottom-right, tamaño ~70×52, no sobredimensionado.

### Focus

- Regla `.fab:focus-visible` presente; outline accent.

## Console / network QA

```text
create_order: 0
pedidos reales: 0
Sin cambios de network por esta fase
PII/tokens: no registrados
```

## Validación

```text
tsc / next build: PASS
git diff --check: PASS (warning CRLF ajeno en success page)
HTTP: catalogo/checkout/success → 200
tsconfig.tsbuildinfo: restaurado si apareció
```

## Contratos preservados

```text
✓ aparición solo si count > 0
✓ count semantics
✓ click abre CartSheet
✓ aria-label
✓ posición general / safe-area
✓ CartSheet / checkout / success / cart storage / product-card / quick-add: sin cambios
```

## Deuda aceptada

```text
P3 — overlap espacial residual FAB vs quick-add en viewport mobile (no crítico; no sticky bar)
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
