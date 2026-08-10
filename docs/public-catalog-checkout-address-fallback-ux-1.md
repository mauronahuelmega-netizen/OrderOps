# PUBLIC-CATALOG-CHECKOUT-ADDRESS-FALLBACK-UX-1

## Estado

**PASS — CHECKOUT ADDRESS FALLBACK UX VERIFIED**

## Problema corregido

Cuando Places/sugerencias no cargan, el mensaje “No pudimos cargar las sugerencias…” sonaba a falla técnica y generaba duda sobre si la dirección manual era válida. El checkout ya permite dirección manual como flujo principal.

## Decisión UX

- Dirección manual = flujo principal válido.
- Autocomplete = ayuda opcional.
- Fallback = helper secundario, no error.
- Sin Maps validation / place_id / geocoding en esta fase.

## Cambios de copy

| Antes | Después |
|-------|---------|
| No pudimos cargar las sugerencias. Podés escribir la dirección manualmente. | **Podés escribir la dirección manualmente.** |

Loading copy (“Cargando sugerencias...”) sin cambios de semántica.

## Visual fallback

- Nueva clase `.statusHint`: color `--checkout-subtle`, `0.75rem`, margin corto, `font-weight: 400`.
- Sin color de error, sin icono warning, sin `role="alert"`.
- Conserva `role="status"` (anuncio suave, no crítico).
- Altura medida ~16px (light/dark).

## Dirección manual

- Input acepta texto manual; value se conserva.
- No exige sugerencia.
- Delivery + address vacío → **Ingresá la dirección de entrega.**
- Retiro oculta address + fallback; pickup copy intacto.
- Places logic / `providerStatus` transitions: sin cambios de comportamiento (solo copy/CSS).

## Dark / Light

| Theme | Fallback | Surfaces |
|-------|----------|----------|
| Light | muted `#8a7b6b` | canvas cream / sticky claro |
| Dark | muted `#c8b9a7` legible | canvas/sticky oscuros; sin blancos |

## Accessibility

- `role="status"` preservado (no se endureció a alert).
- Label **Dirección**, `required`, combobox/listbox semantics intactos.
- Errores reales de form siguen en `role="alert"`.

## QA browser

Forzado de fallback vía bloqueo CDP de Maps URLs (solo QA; sin cambio de código Places).

### Light

- Copy nuevo; sin “No pudimos”; height ~16px; no parece error.

### Dark

- Hint muted legible; surfaces oscuras.

### Flujos A-G

| Flujo | Resultado |
|-------|-----------|
| A Fallback visible | PASS |
| B Dirección manual | PASS |
| C Submit vacío / address required | PASS · create_order 0 |
| D Retiro | PASS · address/fallback ocultos · error nombre |
| E Scroll room | PASS · pad/gap 12px |
| F Dark | PASS |
| G Preview | PASS · CTA disabled · hint ok · create_order 0 |

Viewports: 390×844 primario; tokens CSS compartidos en 360/430/768/1440.

## Console/network

- create_order: **0**
- Submit real / success: no

## Validación

- `tsc --noEmit`: PASS
- `npm run build`: PASS
- `git diff --check`: PASS
- HTTP catalogo/checkout/success: **200**
- `tsconfig.tsbuildinfo`: restaurado si dirty

## Contratos preservados

- Places load/fetch/select logic, address required, pickup null, payload, actions, phone, preview — **0 cambios de comportamiento**
- Solo microcopy + CSS helper en `address-autocomplete.*`

## Deuda aceptada

- Ninguna bloqueante. Loading “Cargando sugerencias...” puede compactarse en fase futura si se desea (P3).

## Gate siguiente

```
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-STICKY-TOTAL-SIMPLIFY-1 = ALLOWED
QUEUE_GATE: PUBLIC-CATALOG-SUCCESS-FLAT-POLISH-1 = PAUSED
```
