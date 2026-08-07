# PUBLIC-CATALOG-PRODUCT-CARD-PRICE-NOWRAP-QUICK-ADD-CENTER-FIX-1

## Estado

PASS WITH BROWSER/ANDROID QA DEBT - PRODUCT CARD PRICE/CENTER SOURCE VERIFIED

## Problemas corregidos

El importe podia quebrarse internamente por `overflow-wrap: anywhere` y el pseudo-circulo del quick-add no tenia un centrado explicito respecto del target.

## Causa

El footer reserva una columna para la accion, pero un precio monetario no debe ceder su ultima cifra al wrapping. El pseudo-elemento usaba posicionamiento absoluto sin `inset` centrado.

## Price nowrap

`.price` usa `white-space: nowrap`, `word-break: normal`, `overflow-wrap: normal` y numeros tabulares. En cards de hasta 383px, precio y accion pasan a filas separadas para mantener el importe completo sin overflow.

## Quick-add centering

El target sigue en 44px y el circulo visual en 38px. El boton usa flex centrado y el pseudo-circulo usa `inset: 0; margin: auto`; el SVG tiene bloque y line-height unitario.

## Footer layout

El grid conserva una columna de accion fija, reduce el gap y en ancho muy estrecho deja el precio completo arriba y la accion alineada al final.

## Dark/Light

Se preservan `--business-primary`, foreground, focus-visible y las superficies existentes.

## QA visual

BROWSER/ANDROID QA DEBT - source/build verified. Pendiente validar los precios de BBQ Bacon, Clásica, Crispy Chicken, Doble Smash y Coca Cola en dark/light.

## QA funcional

Sin cambios de JSX, handlers, stopPropagation, labels, cantidad, quick-add simple/configurable, pricing o cart.

## Validacion

- TypeScript: PASS (`tsc --noEmit`).
- Build: PASS (`npm run build`).
- HTTP smoke: PASS para catalogo, checkout y success (200).
- `git diff --check`: PASS.

## Gate siguiente

QUEUE_GATE: PUBLIC-CATALOG-POST-ADD-UPSELL-INTERACTION-QA-FIX-1 = ALLOWED
