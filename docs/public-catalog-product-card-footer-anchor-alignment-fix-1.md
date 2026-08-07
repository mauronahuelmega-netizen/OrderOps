# PUBLIC-CATALOG-PRODUCT-CARD-FOOTER-ANCHOR-ALIGNMENT-FIX-1

## Estado

PASS WITH BROWSER/ANDROID QA DEBT - PRODUCT CARD FOOTER ANCHOR SOURCE VERIFIED

## Problema corregido

El footer de precio/accion dependia de la altura natural del contenido textual, por lo que cards de una misma fila podian terminar en ejes verticales distintos.

## Causa visual

La card era flex column, pero `.hit` y `.body` no ocupaban el espacio disponible, y el footer no se anclaba con `margin-top: auto`.

## Footer anchoring

La card, hit y body ahora pueden llenar la altura estirada del grid. El footer usa `margin-top: auto` y una zona centrada estable para precio y accion.

## Description/content normalization

Se preservan los clamps de titulo y descripcion. El espacio flexible del body absorbe las diferencias de copy sin imponer alturas rigidas.

## Price/action alignment

Precio y accion usan zonas de 44px y comparten eje vertical. En ancho muy estrecho, solo el stepper de cantidad puede pasar a otra fila para no comprimir sus controles; quick-add conserva precio y `+` en una misma linea.

## Price nowrap preserved

Se conserva nowrap, numeros tabulares y la ocultacion visual de `Desde` en ProductCard.

## Quick-add preserved

Target de 44px, circulo visual compacto, SVG centrado, aria-label y handlers no cambian.

## Modal transparency preserved

Product Detail y Customization no fueron modificados y mantienen `Desde`/`Precio base`.

## Dark/Light

No se modifican tokens ni superficies.

## QA visual

BROWSER/ANDROID QA DEBT - source/build verified. Pendiente validar anclaje por fila, dark/light y fallback del stepper en dispositivo real.

## QA funcional

Sin cambios de JSX, card click, quick-add, quantity handlers, pricing, cart o modales.

## Validacion

- TypeScript: PASS (`tsc --noEmit`).
- Build: PASS (`npm run build`).
- HTTP smoke: PASS para catalogo, checkout y success (200).
- `git diff --check`: PASS.

## Gate siguiente

QUEUE_GATE: PUBLIC-CATALOG-POST-ADD-UPSELL-INTERACTION-QA-FIX-1 = ALLOWED
