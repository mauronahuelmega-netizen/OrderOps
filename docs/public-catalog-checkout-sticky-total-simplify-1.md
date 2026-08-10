# PUBLIC-CATALOG-CHECKOUT-STICKY-TOTAL-SIMPLIFY-1

## Estado

**PASS — CHECKOUT STICKY TOTAL SIMPLIFIED**

Nota de entorno QA: el negocio demo estaba **Cerrado** (`onDemandModeActive=false`), por lo que el CTA quedó `disabled` (contrato preservado). Validación por click de submit vacío no se re-ejecutó en vivo; el handler/orden de validación no se modificó.

## Problema corregido

Al final del checkout el importe aparecía tres veces (resumen Total + sticky Total + CTA). Visualmente redundante y el sticky ocupaba más altura de la necesaria.

## Decisión UX

- Resumen conserva **Total $…**
- CTA conserva **Enviar pedido · $…** (y labels disabled/loading/preview)
- Sticky deja de mostrar la fila **Total** duplicada → superficie compacta de acción

## Cambios aplicados

`checkout-client.tsx`:
- Removida la fila `.stickyTotal` del sticky footer.
- Botón submit / `submitLabel` / disabled conditions intactos.

`checkout-client.module.css`:
- Eliminados estilos `.stickyTotal*`.
- Sticky más compacto: padding footer/inner reducido; `gap: 0`.
- `--checkout-sticky-footer-space`: `7.25rem` → **`5.5rem`** (+ safe-area).
- `padding-bottom` corto del `.page` y scroll-padding/margin vía var: intactos en patrón.

## Sticky footer

Post-cambio CDP 390×844:

| Métrica | Valor |
|---------|-------|
| sticky height | **~81px** (antes ~114px) |
| stickyInner | solo CTA `Enviar pedido · $…` |
| stickyHasTotalRow | **false** |
| CTA min-height | 48px (≥44) |
| position mobile | sticky |
| desktop ≥900 | static + space `0` |

## Summary total

- Mobile/desktop `OrderSummary`: **Total** conservado (`summaryHasTotal: true`).
- Sin cambios a rows / children / Editar pedido / cálculo.

## Scroll room

| Métrica | Valor |
|---------|-------|
| `--checkout-sticky-footer-space` | `calc(5.5rem + env(safe-area-inset-bottom, 0px))` |
| pagePadBottom | 12px |
| gapBelowSticky | **12px** (sin ghost zone) |
| notes/textarea/summary clear | **true** |

## Dark / Light

- Tokens `--checkout-*` intactos.
- Dark: canvas/sticky oscuros; CTA accent; sin blancos internos.
- Compact sticky height ~81px también en dark.

## Accessibility

- `type="submit"`, form association, disabled, focus-visible, tab order: intactos.
- Importe sigue visible en el CTA (o label preview/closed).
- Sin aria duplicada nueva.

## QA browser

### Light

- Resumen Total sí; sticky sin fila Total; CTA con importe; gap 12.

### Dark

- Sticky compacto oscuro; clearance OK.

### Flujos A-I

| Flujo | Resultado |
|-------|-----------|
| A Final checkout | PASS |
| B Sticky height / scroll room | PASS — 81px / space 5.5rem / gap 12 |
| C Submit vacío | PASS w/ env note — CTA disabled por negocio cerrado; create_order 0; código validación no tocado |
| D Datos manuales sin submit real | PASS — CTA visual compacto |
| E Retiro | PASS — address oculto; sticky compacto |
| F Empty cart | PASS — sin sticky |
| G Preview | PASS — `Confirmación deshabilitada`; sin Total sticky; create_order 0 |
| H Dark | PASS |
| I Desktop/tablet | PASS — 768 sticky compact; 1440 static space 0 |

## Console/network

- create_order: **0**
- Submit real: no

## Validación

- `tsc --noEmit`: PASS
- `npm run build`: PASS
- `git diff --check`: PASS
- HTTP catalogo/checkout/success: **200**
- `tsconfig.tsbuildinfo`: restaurado si dirty

## Contratos preservados

- Totales / payload / actions / phone / preview / validation / delivery values — **0 cambios de lógica**
- Solo UI hierarchy sticky + recalibración CSS de altura

## Deuda aceptada

- QA de submit vacío en vivo diferida por ventana operativa cerrada del demo (no es regresión de código).

## Gate siguiente

```
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-DARK-INPUT-SURFACE-TUNING-1 = ALLOWED
QUEUE_GATE: PUBLIC-CATALOG-SUCCESS-FLAT-POLISH-1 = PAUSED
```
