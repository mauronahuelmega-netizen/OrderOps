# PUBLIC-CATALOG-PRODUCT-DETAIL-MODAL-POLISH-1

## Estado

PASS WITH VISUAL/KEYBOARD QA DEBT - PRODUCT DETAIL MODAL SOURCE VERIFIED

## Cambios visuales

- La media del detalle usa `aspect-ratio: 1 / 1` en su wrapper para todos los breakpoints.
- El header elimina el eyebrow visible y conserva el nombre como `h2` del dialogo.
- El cierre es un boton X flat de 44px; header y footer usan superficies solidas.
- El footer configurable muestra `Personalizacion`; la cantidad simple se compacta sin cambiar sus handlers.

## Media 1:1

`PublicStorageImage`, `fill`, `object-fit: cover`, `alt`, placeholder y fallback se preservan. Se eliminaron las alturas fijas de 240px y 320px que imponian una media horizontal.

## Producto simple

El borrador sigue iniciando en `max(currentQuantity, 1)`, decrementa hasta cero, calcula `product.price * draftQuantity` y guarda exclusivamente mediante `setLegacyProductQuantity` a traves de `onSaveQuantity`.

## Producto configurable

`shouldShowPriceFrom`, `priceFrom`, el helper de precio y `onCustomize` se conservan. El detalle no guarda cantidad legacy ni calcula un total final; `Elegir opciones` cierra el detalle y mantiene el flujo existente hacia Customization.

## Accesibilidad

El dialogo conserva `role="dialog"`, `aria-modal` y `aria-labelledby`. Al abrir, el foco va al boton de cierre; Escape cierra desde un unico listener capture, Tab/Shift+Tab se ciclan dentro del dialogo y el foco vuelve al trigger conectado al cerrar. Los controles de cantidad usan un grupo nombrado y labels especificos para disminuir/aumentar.

## Light/Dark

Sheet, header y footer usan `--catalog-surface-strong`; no se aplica opacidad ni blur al dialogo. Los estados de foco usan el accent del negocio y los controles heredan tokens de catalogo.

## Contratos preservados

No se modificaron ProductCard, quick add, CatalogClient, customization cache/in-flight, cart V2, signatures, post-add, checkout, loaders, actions ni pricing helpers.

## QA visual

Browser visual y teclado real: UNVERIFIED BY ENVIRONMENT. El runtime de browser local no tiene un ejecutable Chromium disponible y esta fase no autoriza instalarlo. Queda pendiente comprobar en 390x844, 412x914, 430x932, 768px y 1440x900: media 1:1, light/dark, Escape, trap, retorno de foco, backdrop y transicion a Customization.

## Console/Network

UNVERIFIED BY ENVIRONMENT. Por source, abrir/cerrar detalle y cambiar cantidad no incorporan requests; la carga on-demand de Customization conserva su contrato existente.

## Validacion

- TypeScript: PASS (`tsc --noEmit`).
- Build: PASS (`npm run build`).
- HTTP smoke: PASS para catalogo, checkout y success (200).
- `git diff --check`: PASS.

## Gate siguiente

QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-OPTIONS-FLAT-POLISH-1 = ALLOWED
