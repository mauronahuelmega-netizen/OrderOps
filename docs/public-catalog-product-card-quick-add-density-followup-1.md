# PUBLIC-CATALOG-PRODUCT-CARD-QUICK-ADD-DENSITY-FOLLOWUP-1

## Estado

PASS WITH BROWSER/ANDROID QA DEBT - PRODUCT CARD QUICK ADD SOURCE VERIFIED

## Problema corregido

El quick-add usaba el mismo circulo de 44px para interaccion y apariencia, y el footer flex no reservaba una columna fija para la accion junto a precios largos.

## Causa visual

El precio y la accion compartian espacio sin una columna de accion explicita; en mobile esto hacia que el quick-add compitiera visualmente con importes largos.

## Cambios aplicados

El footer usa una grilla `minmax(0, 1fr) auto`, el precio puede wrappear dentro de su columna y el boton conserva target de 44px con un circulo visual de 38px.

## Quick-add size

El icono pasa a 18px dentro de un circulo visual compacto. El nombre accesible, focus-visible, color de negocio y comportamiento no cambian.

## Price/action layout

La columna de accion no se encoge y el bloque de precio tiene ancho reservado, evitando overlap para precio regular y `Desde`.

## Dark/Light

Se conservan los tokens de card y `--business-primary`; no se modifica la paleta ni los estilos de otros overlays.

## QA visual

BROWSER/ANDROID QA DEBT - source/build verified. Pendiente validar BBQ Bacon, Clásica, Crispy Chicken, Doble Smash y Coca Cola en dark/light sobre dispositivo real.

## QA funcional

Sin cambios de JSX, handlers, stopPropagation, labels, cantidad, pricing ni estados simple/configurable.

## Validacion

- TypeScript: PASS (`tsc --noEmit`).
- Build: PASS (`npm run build`).
- HTTP smoke: PASS para catalogo, checkout y success (200).
- `git diff --check`: PASS.

## Gate siguiente

QUEUE_GATE: PUBLIC-CATALOG-POST-ADD-UPSELL-INTERACTION-QA-FIX-1 = ALLOWED
