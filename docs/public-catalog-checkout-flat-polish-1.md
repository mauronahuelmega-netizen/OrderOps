# PUBLIC-CATALOG-CHECKOUT-FLAT-POLISH-1

## Estado

**PASS — CHECKOUT FLAT POLISH VERIFIED**

## Problemas corregidos

| ID | Problema | Resolución |
|----|----------|------------|
| P2-1 | Checkout light-only bajo dark | Tokens `--checkout-*` en `.page` + override `html[data-catalog-theme="dark"]` |
| P2-2 | Sticky shadow/card viejo | `box-shadow: none`; separación border + canvas gradient |
| P2-3 | Resumen desalineado vs CartSheet | Items en cards flat; child indent + child-bg/accent; total row con border-top |
| P2-4 | Segmented light-first | Canvas/card tokens; selected accent soft sin inset shadow |
| P2-5 | Inputs/cards globales light | Override `:global(.ui-input/.ui-label/.ui-helper)` + sections/textarea tokenizados |
| P2-6 | Density pre-redesign | Gaps/paddings compactados; header fold reducido |

## Archivos modificados

- `components/public/checkout/checkout-client.module.css`
- `components/public/checkout/address-autocomplete.module.css`
- `docs/public-catalog-checkout-flat-polish-1.md` (este archivo)

TSX: **sin cambios** (no hizo falta wrappers).

## Dark parity

- Light: canvas `#f6f2ea`, cards blancas/crema, texto `#20170f`.
- Dark (`html[data-catalog-theme="dark"]`): canvas `#12100d`, surface `#1d1712`, text `#f8f2e8`, borders `rgba(255,244,230,0.13)`.
- CDP dark: page `rgb(18,16,13)`, sections `rgb(51,45,39)`, inputs canvas oscuros, sticky `rgb(29,23,18)`, `box-shadow: none`.
- CTA accent + foreground token; sin superficies blancas internas en dark.

## Flat visual system

- Superficies planas, borders sutiles, radii ~0.75–0.95rem.
- Cero `--shadow-card` / inset shadows pesadas.
- Separación por canvas / border / spacing.
- Address listbox flat (sin shadow).

## Header / notice

- Copy intacto; back 44px tokenizado; title/subtitle muted.
- Notice custom products: surface canvas + border sutil.

## Delivery / pickup

- Valores `delivery`/`pickup` intactos; default Envío.
- Segmented flat; selected accent soft; radios ocultos preservados.

## Address

- Condicional delivery intacta; Places logic intacta.
- Input/listbox tokenizados vía herencia `--checkout-*`.

## Customer data

- Labels/helpers/inputs tokenizados; focus-visible accent; phone helper/error intactos.

## Notes

- Textarea tokenizada; sin maxLength; trim/null semantics intactas.

## Order summary

- Jerarquía semántica intacta (`buildHierarchicalCartRows`).
- Visual: card por ítem, displaySummary muted, Adicional + indent estilo CartSheet, precios nowrap.

## Sticky footer

- Flat; `box-shadow: none`; safe-area; CTA accent; disabled/preview/loading labels intactos.

## Error / focus states

- `messageError` tokenizado; `ui-error` override; focus-visible accent; sin cambiar lógica ni focus-to-phone.

## Accessibility

| Feature | Estado |
|---------|--------|
| Back ≥44px | Preservado |
| Radios segmented | Preservados |
| Labels / autocomplete | Preservados |
| `role="alert"` errores | Preservado |
| Preview disabled CTA | Preservado |
| Focus-visible | Token accent |

## QA browser

Viewport primario 390×844. Themes light + dark.

### Light

- Canvas cream; sections/cards claras; sticky sin shadow; CTA teal.

### Dark

- Canvas/sections/inputs/summary/sticky oscuros; CTA accent; sin blancos internos.

### Flujos A-J

| Flujo | Resultado |
|-------|-----------|
| A Configurable + upsell → checkout | PASS (total $ 24.000) |
| B Envío vacío | PASS — alert “Ingresá tu nombre.”; 0 create_order |
| C Datos QA sin submit final | PASS — nombre/tel/dirección/notas fill visual |
| D Retiro | PASS — address oculto; copy retiro; alert nombre |
| E Notas | PASS — 320 chars; textarea ok |
| F Resumen | PASS — Clásica + Doble Smash + Papas + Adicional |
| G Empty cart | PASS — empty state; cart restored attempt (bak perdido en reload; public keys re-seedables) |
| H Dark | PASS |
| I Preview | PASS — banner + CTA “Confirmación deshabilitada” disabled |
| J Submit safety | PASS — sin submit real; validaciones client-only |

## Console/network

- Validar vacío / cambiar método: 0 create_order.
- Submit real: no ejecutado.
- Hydration overlay: no observado en esta pasada checkout.

## Validación

| Check | Resultado |
|-------|-----------|
| `tsc --noEmit` | PASS (vía build) |
| `npm run build` | PASS |
| `git diff --check` | PASS |
| HTTP catalogo/checkout/success | 200 / 200 / 200 |

## Contratos preservados

- Action / RPC / payload / phone / preview / storage / success / validations / totals — **sin cambios de código TS**.

## Deuda aceptada

- P3 notas sin maxLength, address residual pickup, autofocus solo phone, race doble submit, keyboard device no exhaustivo.
- Empty-cart restore: backup en `window` se pierde al navegar; keys públicas deben rehidratarse desde UI si hace falta.

## Gate siguiente

```text
QUEUE_GATE: PUBLIC-CATALOG-SUCCESS-FLAT-POLISH-1 = ALLOWED
```
