# PUBLIC-CATALOG-CHECKOUT-COPY-DENSITY-POLISH-1

## Estado

**PASS WITH MINOR COPY DEBT — CHECKOUT COPY DENSITY VERIFIED**

Deuda P3 no bloqueante: subtítulo de header de página (`Completá tus datos…`) y fallback Places (`No pudimos cargar…`) diferidos a fases posteriores.

## Problema corregido

El Checkout era claro pero demasiado didáctico: títulos + helpers redundantes en delivery, address, customer y notes. Se redujo microcopy visible sin tocar contratos.

## Cambios de copy

| Antes | Después |
|-------|---------|
| Cómo recibís el pedido + helper | **Cómo lo recibís** (sin subtítulo) |
| ¿Dónde lo entregamos? + helper | **Dirección de entrega** (label input **Dirección** intacto) |
| Tus datos + helper | **Tus datos** (sin subtítulo) |
| Notas… + “Aclaraciones…” | **Notas para el pedido** + **Opcional**; label **Notas** |
| “Tu pedido incluye productos personalizados. Los precios…” | **Los precios se confirman al enviar.** |

Footer/CTA no tocado (fase sticky-total aparte).

## Delivery / pickup

- Valores internos `delivery` / `pickup` intactos.
- Botones **Envío** / **Retiro** intactos.
- Retiro: address oculto; copy “Retiro en {negocio}…” preservado.
- Scheduled helper de fecha (si activo) intacto vía `Input` helperText.

## Address

- Título único **Dirección de entrega**.
- Label **Dirección** en `AddressAutocomplete` sin cambios.
- Required / Places logic / no-exigir-sugerencia: intactos.
- Fallback Places: **no cambiado** (gate → `ADDRESS-FALLBACK-UX-1`).

## Customer data

- Sección **Tus datos** sin subtítulo.
- Labels Nombre / Teléfono + `Ejemplo: 11 1234-5678` intactos.
- Validación: submit vacío → **Ingresá tu nombre.** (orden preservado).

## Notes

- Título **Notas para el pedido**.
- Subtítulo **Opcional**.
- Label **Notas**; sin `required` / `maxLength`; trim/null semantics intactas.

## Custom products notice

- Condición `hasCustomizedItems` intacta.
- Copy compactado a confirmación de precios.

## Accessibility

- Labels / fieldset legend / radios / phone `aria-describedby` / `role="alert"` intactos.
- Subtítulos eliminados **no** estaban referenciados por `aria-describedby`.
- Tab order / focus-visible / ids / names / autocomplete: sin cambios.

## QA browser

### Light

- Top fold más denso; sin huecos raros por subtítulos quitados.
- Copy viejo ausente; requerido presente.
- Scroll room: pad 12px / gap ~12px / sticky sticky.

### Dark

- Canvas / sticky oscuros; copy legible; gap 12px.

### Flujos A-H

| Flujo | Resultado |
|-------|-----------|
| A Top fold density | PASS |
| B Delivery / address | PASS |
| C Customer + empty submit | PASS · create_order 0 |
| D Notes optional | PASS |
| E Summary / sticky / scroll room | PASS |
| F Dark | PASS |
| G Retiro | PASS · address oculto · error nombre · create_order 0 |
| H Preview | PASS · CTA disabled · create_order 0 |

Viewports smoke: 390 (primario), 1440 desktop (`space: 0`, sticky static). 360/430/768: mismos tokens CSS (sin regresión de layout esperada).

## Console/network

- create_order: **0**
- Submit real: no
- Success nav: no

## Validación

- `tsc --noEmit`: PASS
- `npm run build`: PASS
- `git diff --check`: PASS
- HTTP catalogo/checkout/success: **200**
- `tsconfig.tsbuildinfo`: restaurado si dirty

## Contratos preservados

- Action / RPC / payload / phone / preview / storage / validations / delivery values / sticky calibration / dark tokens — **0 cambios de lógica**
- Solo microcopy en `checkout-client.tsx` (+ doc de fase)

## Deuda aceptada

- Header page subtitle aún explicativo (P3).
- Address Places fallback copy diferido a `PUBLIC-CATALOG-CHECKOUT-ADDRESS-FALLBACK-UX-1`.
- Sticky total duplicate diferido a `PUBLIC-CATALOG-CHECKOUT-STICKY-TOTAL-SIMPLIFY-1`.

## Gate siguiente

```
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-ADDRESS-FALLBACK-UX-1 = ALLOWED
QUEUE_GATE: PUBLIC-CATALOG-SUCCESS-FLAT-POLISH-1 = PAUSED
```
