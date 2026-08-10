# PUBLIC-CATALOG-HEADER-DARK-FULL-BLEED-SURFACE-FIX-1

## Estado

PASS — HEADER DARK FULL-BLEED SURFACE FIX VERIFIED

## Contexto

En dark theme el header público se percibía como pastilla/contenedor centrado: surface marrón (`#1d1712`) en el inner max-width y canvas más oscuro (`#12100d`) en el root, dejando laterales más oscuros.

## Problema visual

```text
[ canvas #12100d ][ inner surface #1d1712 max-width ][ canvas #12100d ]
```

Causa técnica: `html[data-catalog-theme="dark"] .public-business-header__inner` tenía mayor especificidad que el polish flat (inner transparente) y reaplicaba `background: var(--business-header-bg)` sobre un inner `width: min(100%, 1080px); margin: 0 auto`.

## Decisión visual

Header dark full-bleed surface. Contenido interno conserva max-width/padding/alineación. Sin oscurecer el header hasta canvas; sin menú/burger changes.

## Cambios aplicados

Archivo: `app/globals.css` (estilos reales del PublicBusinessHeader; excepción documentada — no existe `public-header.module.css` de catálogo).

- Root dark: `background: var(--business-header-bg)` (`#1d1712`) full-width.
- Inner dark: `background: transparent` + sin box-shadow (separado del sheet).
- Scrolled dark inner: transparente.
- Desktop glass MQ (≥768): root surface full-bleed; inner no vuelve a pintar pill.
- `prefers-reduced-transparency`: dark root `#1d1712` (no `#12100d`).
- Refuerzo junto al flat polish: same root/inner contrato.

## Dark header

- Surface `#1d1712` / `rgb(29, 23, 18)` de punta a punta del layout client width.
- Inner transparente; logo/nombre/burger alineados con padding existente.
- Border-bottom sutil preservado.

## Light header

Sin regresión: root canvas/header surface; inner transparente; layout intacto.

## Full-bleed implementation

```text
header root = full-width background + border-bottom
header inner = max-width content row, transparent
```

Sin `100vw` / `calc(50% - 50vw)` — no fue necesario; el root ya es full width del layout.

## Burger/menu

Open/close + theme switch verificados. Sheet conserva su propio surface. Sin cambios de comportamiento.

## Routes checked

- `/b/demohamburgueseria/catalogo`
- `/b/demohamburgueseria/checkout` (header `position: static` preservado)
- `/b/demohamburgueseria/success?...`

## Browser QA

### Catalog

PASS — dark full-bleed (`headerW === clientWidth`, edges `inHeader`, inner transparent). Light OK.

### Checkout

PASS — dark full-bleed; static header intacto.

### Success

PASS — dark full-bleed en desktop; inner ~1080px content width.

### Burger menu

PASS — open/close + theme toggle light↔dark.

### Horizontal overflow

PASS — `scrollWidth <= clientWidth + 1` en 390 y 1440.

### Scroll/sticky

PASS — catalog header `position: sticky` preservado.

## Console / network QA

- `create_order` hits: 0
- Pedidos reales: 0
- Sin hydration dialog detectado en flujo QA

## Validación

- `tsc --noEmit`: PASS
- `npm run build`: PASS
- HTTP smoke catalogo/checkout/success: 200
- `git diff --check` (globals header scope): PASS
- `tsconfig.tsbuildinfo` restaurado / no commiteado

## Contratos preservados

- Logo, nombre, status dot, burger, theme, hide-on-scroll, checkout static header
- ProductCard / FAB / CartSheet / checkout / success content: no tocados en esta fase (solo CSS header en globals)
- Sin DB/RPC/actions/cart logic

## Deuda aceptada

P3: en viewports con scrollbar, `window.innerWidth` puede diferir ~15px de `clientWidth`; el surface cubre el client width completo (correcto). Capturas con letterboxing del browser tool no deben confundirse con gutters del documento.

## Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-UI-REDESIGN-CLOSEOUT-1 = ALLOWED
QUEUE_GATE: PUBLIC-CATALOG-SUCCESS-EDGE-STATES-POLISH-1 = OPTIONAL
QUEUE_GATE: PUBLIC-ORDERS-PUBLIC-CODE-SPEC-1 = BACKLOG
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-* = PAUSED
```
