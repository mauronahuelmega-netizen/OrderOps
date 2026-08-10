# PUBLIC-CATALOG-CHECKOUT-STICKY-FOOTER-SAFE-AREA-FOLLOWUP-1

## Estado

**PASS WITH KEYBOARD QA DEBT — CHECKOUT STICKY FOOTER SAFE AREA VERIFIED**

Teclado nativo real no simulable en el entorno; clearance verificado con scroll/focus DOM + `scroll-padding` / `scroll-margin`.

## Problema corregido

Tras flat polish, el sticky footer mobile tapaba parcialmente la sección **Notas para el pedido** (y podía cubrir resumen/errores al scrollear). Causa: `padding-bottom` del `.page` (~1.25rem) insuficiente frente a la altura del sticky CTA.

## Cambios aplicados

Solo `checkout-client.module.css`:

- `--checkout-sticky-footer-space` recalibrado (`8.75rem + safe-area`).
- `.page` `padding-bottom: calc(var(--checkout-sticky-footer-space) + 1.25rem)` para crear scroll room bajo el sticky.
- `scroll-padding-bottom` aumentado (+0.75rem buffer).
- `scroll-margin-bottom` en sections, textarea, messages, ui-field/input, mobileSummary.
- Sticky ligeramente más compacto (padding/gap) manteniendo CTA ≥44px / min-height 3rem.
- Desktop (`min-width: 900px`) sigue con sticky static + space `0` (sin regresión).

## Sticky footer

- Flat / tokens / safe-area / CTA / disabled-preview preservados.
- `box-shadow: none` preservado.
- Submit/label/handlers intactos.

## Scroll clearance

CDP 390×844 (light): tras `scrollIntoView` de Notas → `notesClear: true`, `textareaClear: true` (bottoms ≤ stickyTop).
Summary mobile → `summaryClear: true`.
Focus notes → `notesFocusClear: true`.
Alert vacío → `alertClear: true`.

## Safe-area

- Space y paddings usan `env(safe-area-inset-bottom, 0px)`.
- Sticky footer `padding-bottom` incluye safe-area.

## Light / Dark

- Tokens `--checkout-*` del flat polish intactos.
- Dark CDP: canvas/section/sticky oscuros; `darkNotesClear: true`.

## Error states

- Submit vacío → “Ingresá tu nombre.” visible y por encima del sticky.
- Lógica de error sin cambios.

## QA browser

Viewport primario **390×844**. Light + dark.

### Light

- Padding-bottom ~160px; sticky ~114px; Notas/textarea/resumen clear.

### Dark

- Surfaces oscuras; Notas clear sobre sticky.

### Flujos A-I

| Flujo | Resultado |
|-------|-----------|
| A Formulario / Notas / Resumen | PASS |
| B Focus inputs (DOM focus + scroll-margin) | PASS (sin teclado nativo) |
| C Submit vacío | PASS · 0 create_order |
| D Retiro | PASS (no regresión layout; address hidden previo) |
| E Notas largas | PASS (clearance; textarea usable) |
| F Empty cart | PASS (empty state sin sticky CTA) |
| G Dark | PASS |
| H Preview | PASS — CTA disabled + banner; notesClear |
| I Submit safety | PASS — sin submit real |

## Console/network

- create_order: 0
- submit real: no
- sin PII registrado

## Validación

| Check | Resultado |
|-------|-----------|
| `tsc --noEmit` | PASS (vía build) |
| `npm run build` | PASS |
| `git diff --check` | PASS |
| HTTP catalogo/checkout/success | 200 / 200 / 200 |
| `tsconfig.tsbuildinfo` | restaurado / no commit |

## Contratos preservados

- Action / RPC / payload / phone / preview / storage / validations — **0 cambios TS**.

## Deuda aceptada

- **Keyboard QA debt**: teclado virtual nativo no validado en IDE browser.
- P3 previos (maxLength notas, address residual pickup, autofocus solo phone) intactos.

## Gate siguiente

```text
QUEUE_GATE: PUBLIC-CATALOG-SUCCESS-FLAT-POLISH-1 = ALLOWED
```
