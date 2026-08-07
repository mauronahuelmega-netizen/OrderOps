# PUBLIC-CATALOG-PRODUCT-CARD-PRICE-FROM-VISUAL-SIMPLIFY-1

## Estado

PASS WITH BROWSER/ANDROID QA DEBT - PRODUCT CARD PRICE FROM SOURCE VERIFIED

## Decision de producto

Las ProductCards muestran solo el importe base formateado. La transparencia de precio variable permanece en Product Detail y Customization.

## Cambio visual

Se retiro el texto visible `Desde` de la card configurable sin cambiar `shouldShowPriceFrom`, `priceFrom` ni el valor mostrado.

## Accesibilidad

La card configurable mantiene `aria-label="Desde {importe}"` sobre el precio. La card simple conserva la lectura de su importe sin duplicacion.

## Price nowrap

El importe conserva nowrap, word-break normal, overflow-wrap normal y numeros tabulares.

## Quick-add preservation

Se conservan target de 44px, circulo visual compacto, SVG centrado, focus-visible y handlers existentes.

## Modal transparency preserved

No se modificaron Product Detail ni Customization: siguen mostrando `Desde`/`Precio base` y el copy de personalizacion existente.

## Dark/Light

No se alteran tokens ni superficies de la card.

## QA visual

BROWSER/ANDROID QA DEBT - source/build verified. Pendiente validar cards configurables y simples en dark/light sobre dispositivo real.

## QA funcional

Sin cambios de interaccion, quick-add, card click, cantidad, pricing, cart o modales.

## Validacion

- TypeScript: PASS (`tsc --noEmit`).
- Build: PASS (`npm run build`).
- HTTP smoke: PASS para catalogo, checkout y success (200).
- `git diff --check`: PASS.

## Gate siguiente

QUEUE_GATE: PUBLIC-CATALOG-POST-ADD-UPSELL-INTERACTION-QA-FIX-1 = ALLOWED
