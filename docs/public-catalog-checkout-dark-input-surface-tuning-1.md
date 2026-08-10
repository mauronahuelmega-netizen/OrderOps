# PUBLIC-CATALOG-CHECKOUT-DARK-INPUT-SURFACE-TUNING-1

## Estado

**PASS — CHECKOUT DARK INPUT SURFACES TUNED**

## Problema corregido

En dark, inputs/textarea usaban `--checkout-canvas` (`#12100d`) dentro de cards más claras → “huecos negros” pesados, poco premium.

## Decisión visual

- Suavizar un paso: input entre canvas y card.
- Sin aclarar hasta light; sin blancos/cream en dark.
- Light: conservar fill cream (`--checkout-canvas`).
- Focus/error/placeholder vía tokens; ARIA intacta.

## Cambios aplicados

Solo CSS:

`checkout-client.module.css`
- Tokens nuevos: `--checkout-input-surface`, `--checkout-input-surface-focus`, `--checkout-input-border`, `--checkout-input-placeholder`.
- Dark: `color-mix(card 72%, canvas 28%)` (+ focus 82/18); border mix con text 16%.
- `.ui-input` / `.textarea` usan esos tokens; focus + `aria-invalid` border.
- Sin tocar sticky/scroll room/summary/CTA.

`address-autocomplete.module.css`
- Listbox/options usan `--checkout-input-surface` / `--checkout-input-border` (fallback a tokens previos).

## Input surfaces

CDP dark (390×844), RGB sum:

| Superficie | RGB approx | sum |
|------------|------------|-----|
| canvas | 18,16,13 | **47** |
| input / textarea | 42,37,32 | **111** |
| card token | 51,45,39 | **135** |

`inputBetween: true` (canvas < input < card). `noWhiteInputs: true`.

Light: inputs `#f6f2ea` / `rgb(246,242,234)` — sin regresión brusca.

## Address autocomplete

- Input hereda `.ui-input` del page (surface token).
- Listbox/hover alineados a input surface.
- Places logic / fallback copy: sin cambios TS.

## Dark / Light

| Theme | Resultado |
|-------|-----------|
| Dark | Inputs integrados; sticky/summary oscuros; CTA intacto |
| Light | Cream inputs; borders suaves |

## Focus / error states

- Focus: outline accent + `--checkout-input-surface-focus`.
- `aria-invalid="true"`: border mix error.
- Helper/fallback muted: intactos.

## Accessibility

- Labels / combobox / listbox / focus-visible / contraste texto claro sobre input lift: OK.
- Sin cambios ARIA/TSX.

## QA browser

### Light

- Inputs cream; sticky compacto; gap 12.

### Dark

- Inputs lifted (sum 111 vs canvas 47); no huecos negros; sticky 81px / gap 12.

### Flujos A-G

| Flujo | Resultado |
|-------|-----------|
| A Dark inputs | PASS |
| B Focus states | PASS |
| C Address autocomplete | PASS — surface tokens; Places intacto |
| D Error states | PASS — estilos invalid; create_order 0 (sin submit real) |
| E Scroll/sticky | PASS — space 5.5rem; gap 12; sin Total sticky |
| F Light regression | PASS |
| G Preview / empty | PASS — CTA disabled; empty sin sticky; create_order 0 |

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

- Payload / actions / phone / preview / Places / validation / totals — **0 cambios de lógica**
- Solo CSS tokens de superficie

## Deuda aceptada

- Ninguna bloqueante. Segment unselected sigue en canvas (fuera de alcance inputs).

## Gate siguiente

```
QUEUE_GATE: PUBLIC-CATALOG-SUCCESS-FORENSIC-AUDIT-1 = ALLOWED
QUEUE_GATE: PUBLIC-CATALOG-SUCCESS-FLAT-POLISH-1 = PAUSED
```
