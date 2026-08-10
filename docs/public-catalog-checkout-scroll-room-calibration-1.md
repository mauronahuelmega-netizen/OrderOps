# PUBLIC-CATALOG-CHECKOUT-SCROLL-ROOM-CALIBRATION-1

## Estado

**PASS WITH KEYBOARD QA DEBT — CHECKOUT SCROLL ROOM CALIBRATED**

Teclado nativo real no simulable en el entorno; clearance verificado con scroll/focus DOM + `scroll-padding` / `scroll-margin`.

## Problema corregido

Tras `PUBLIC-CATALOG-CHECKOUT-STICKY-FOOTER-SAFE-AREA-FOLLOWUP-1`, Notas / textarea / Resumen ya no quedaban bajo el sticky, pero el final del scroll dejaba una zona fantasma (~160px debajo del sticky) por reservar la altura completa del footer como `padding-bottom` del `.page`.

## Diagnóstico

CDP 390×844 (pre-calibración):

| Métrica | Valor |
|---------|-------|
| Sticky height real | ~114px |
| `.page` padding-bottom | ~160px (`space + 1.25rem`) |
| Gap debajo del sticky al max scroll | ~160px (= ghost zone) |

Causa: `--checkout-sticky-footer-space` se usaba a la vez para (1) clearance de focus/scroll y (2) padding de fin de página. El (2) duplicaba visualmente el “hueco” bajo un footer sticky que ya ocupa ese espacio en viewport.

## Cambios aplicados

Solo `checkout-client.module.css` (sin TSX):

- `--checkout-sticky-footer-space` → `calc(7.25rem + env(safe-area-inset-bottom, 0px))` (~altura sticky medida).
- `.page` `padding-bottom` → `calc(0.75rem + env(safe-area-inset-bottom, 0px))` — respiro corto de fin de documento (no altura sticky).
- `scroll-padding-bottom` → `calc(var(--checkout-sticky-footer-space) + 0.5rem)`.
- `scroll-margin-bottom` en sections / fields / notes / mobileSummary → `space + 0.25rem` (antes `+ 0.75rem`).
- Desktop `min-width: 900px`: `--checkout-sticky-footer-space: 0` + sticky `static` preservado.

No se tocó `address-autocomplete.module.css` en esta fase.

## Scroll room

Post-calibración 390×844:

| Métrica | Antes | Después |
|---------|-------|---------|
| pagePadBottom | ~160px | **12px** |
| gapBelowSticky (max scroll) | ~160px | **12px** |
| notesClear / textareaClear / summaryClear | true | **true** |

Buffer inferior móvil ≈ 12px (dentro de 12–24px recomendado).

## Sticky footer

- Sigue `position: sticky` en mobile; altura ~114px.
- Safe-area en space + paddings preservada.
- Flat / tokens / CTA teal / disabled preview intactos.
- Sin cambios de submit / label / handlers.

## Light / Dark

- Tokens `--checkout-*` del flat polish intactos.
- Dark CDP: canvas `#12100d`, stickyInner `#1d1712`, summary oscuro; sin superficies blancas internas.
- Gap inferior 12px también en dark.

## Viewports

| Viewport | Resultado |
|----------|-----------|
| 360×740 | gap 12; notes/summary clear; focus address/name/phone/notes clear |
| 390×844 | gap 12; clear |
| 430×932 | gap 12; clear |
| 768×1024 | sticky aún activo (&lt;900); gap 12; sin hueco excesivo |
| 1440×900 | space `0`; sticky `static`; pad `2.25rem` del MQ desktop; layout intacto |

## QA browser

### Light

- Notas + textarea + Resumen visibles sobre sticky.
- Fin de scroll sin pantalla vacía.
- Empty cart: sin sticky; pad 12px; maxScroll corto (sin ghost zone).

### Dark

- Surfaces oscuras; gap 12; clearance OK.

### Flujos A-G

| Flujo | Resultado |
|-------|-----------|
| A Final formulario / Notas / Resumen | PASS |
| B Footer end-of-page (medición gap) | PASS — gap ~12px |
| C Focus fields (DOM) | PASS — address/name/phone/notes clear |
| D Empty cart | PASS |
| E Preview (`?orderopsPreview=1`) | PASS — CTA disabled “Confirmación deshabilitada”; gap 12 |
| F Dark | PASS |
| G Desktop/tablet | PASS |

## Console/network

- `create_order` resource hits: **0**
- Submit real: no ejecutado
- Success navigation: no probada
- Hydration: sin regresiones observadas en smoke

## Validación

- `tsc --noEmit`: PASS
- `npm run build`: PASS
- `git diff --check`: PASS
- HTTP: catalogo/checkout/success → 200
- `tsconfig.tsbuildinfo`: restaurado si dirty

## Contratos preservados

- Action / RPC / payload / phone / preview / storage / validations / success — **0 cambios TS**
- Flat polish + sticky safe-area follow-up no revertidos (solo calibración de reserva inferior)

## Deuda aceptada

- Teclado nativo real (iOS/Android) no validado en este entorno.

## Gate siguiente

```
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-COPY-DENSITY-POLISH-1 = ALLOWED
QUEUE_GATE: PUBLIC-CATALOG-SUCCESS-FLAT-POLISH-1 = PAUSED
```
