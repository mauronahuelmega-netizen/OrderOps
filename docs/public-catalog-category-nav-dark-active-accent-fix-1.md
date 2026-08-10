# PUBLIC-CATALOG-CATEGORY-NAV-DARK-ACTIVE-ACCENT-FIX-1

## Estado

PASS — CATEGORY NAV DARK ACTIVE ACCENT FIX VERIFIED

## Contexto

En light, el chip activo de categorías usa fill teal sólido (`--business-primary`). En dark, el active se percibía como surface + borde teal (outline/hover), no como selección fuerte.

## Problema visual

```text
Dark active (antes): surface dark + border teal → parece focus/hover
Light active: teal fill sólido → selección clara
```

Causa: `.catalog-page[data-theme="dark"] .catalog-category-chip` aplicaba `background: var(--catalog-surface-strong)` a **todos** los chips con especificidad empatada frente al active genérico, y el contrato dark active no estaba afirmado con suficiente especificidad + foreground blanco explícito.

## Decisión visual

```text
Light active = accent fill
Dark active = accent fill
```

Token: `--business-primary` / `--business-primary-foreground` (teal de negocio `#0F766E` en demo), no `--catalog-accent`.

## Cambios aplicados

Archivo: `app/globals.css` (estilos reales de `.catalog-category-chip*`; CSS-only).

- Dark active: especificidad alta → fill `business-primary`, texto blanco, border primary.
- Dark inactive: surface-strong + muted + border sutil.
- Focus-visible: outline mix distinto del active fill.
- Desktop glass MQ (≥768): active reafirma fill solid.
- Sin cambios TSX / category logic / sticky / search.

## Light category nav

Sin regresión: Bebidas active `rgb(15,118,110)` + texto blanco; inactivos white/cream.

## Dark category nav

- Active: `rgb(15, 118, 110)` + `rgb(255,255,255)` (mismo teal que FAB).
- Inactive: `rgb(29, 23, 18)` + muted cream.

## Active / inactive states

Combos seleccionado en dark → Combos teal fill; Bebidas vuelve a surface dark. Scroll-spy / click preservados.

## Sticky / scrolled state

Tras scroll, active Combos mantiene `rgb(15, 118, 110)`. Sticky top del rail no modificado.

## Accessibility

- Botones reales + `aria-pressed` en search mode intactos.
- Focus-visible con outline offset, no confundible con active fill.
- Contraste active: teal + blanco.

## Browser QA

### Dark active

PASS — Bebidas/Combos teal sólido, inactivos dark surface.

### Light regression

PASS — active teal, inactive white.

### Change active category

PASS — Combos ↔ Bebidas.

### Horizontal rail

PASS — sin overflow documento; chips scrollables.

### Scrolled / sticky

PASS — active teal tras scroll.

### Focus

PASS — outline CSS distinto del fill.

### Desktop / tablet

PASS — reglas MQ + medida desktop aplicadas; fill solid.

## Console / network QA

- `create_order`: 0
- Pedidos reales: 0

## Validación

- `tsc --noEmit`: PASS
- `npm run build`: PASS
- HTTP catalogo/checkout/success: 200
- `git diff --check`: PASS
- `tsconfig.tsbuildinfo` restaurado / no commiteado

## Contratos preservados

- Category select / scroll-into-view / horizontal rail / search
- Header, ProductCard, FAB, CartSheet, checkout, success: no tocados en esta fase
- Sin DB/RPC/actions/cart logic

## Deuda aceptada

P3: captura AI puede describir el teal como “más muted” por iluminación/screenshot; computed style confirma match exacto con FAB (`rgb(15,118,110)`).

## Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-UI-REDESIGN-CLOSEOUT-1 = ALLOWED
QUEUE_GATE: PUBLIC-CATALOG-SUCCESS-EDGE-STATES-POLISH-1 = OPTIONAL
QUEUE_GATE: PUBLIC-ORDERS-PUBLIC-CODE-SPEC-1 = BACKLOG
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-* = PAUSED
```
