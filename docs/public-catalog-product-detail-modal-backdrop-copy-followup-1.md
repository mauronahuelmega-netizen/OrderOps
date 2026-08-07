# PUBLIC-CATALOG-PRODUCT-DETAIL-MODAL-BACKDROP-COPY-FOLLOWUP-1

## Estado

PASS WITH VISUAL/KEYBOARD QA DEBT - PRODUCT DETAIL BACKDROP/COPY SOURCE VERIFIED

## Problemas corregidos

- El scrim del detalle atenúa más el catálogo en light y dark.
- El sheet dark usa una superficie elevada derivada de tokens del catálogo, con borde y sombra propios del overlay.
- El configurable deja de explicar reglas de selección antes de abrir Customization.

## Backdrop y separación visual

El backdrop light pasa a `rgba(17, 12, 8, 0.6)`. En dark usa `rgba(0, 0, 0, 0.74)`. El sheet conserva una superficie sólida y header/footer reutilizan la misma superficie, sin blur ni opacidad en el panel.

## Dark theme

Dentro de `.catalog-page[data-theme="dark"]`, el modal deriva `--catalog-modal-surface` y `--catalog-modal-border` de los tokens existentes. Esto crea profundidad frente a `--catalog-bg` sin afectar Burger Menu, CartSheet ni checkout.

## Light theme

Light mantiene `--catalog-surface-strong`, ahora con una sombra de overlay más marcada para separar el diálogo del catálogo atenuado.

## Copy configurable

Antes: dos ayudas extensas sobre precio final, opciones obligatorias y extras.

Después: `El precio se actualiza según las opciones y extras que elijas.`

Se preservan `Desde`, la descripción real, `Personalización` y `Elegir opciones`.

## Contratos preservados

No se modificaron `shouldShowPriceFrom`, `priceFrom`, quantity legacy, `onCustomize`, quick add, cart V2, signatures, post-add, cache/in-flight, loaders, actions ni checkout. La media permanece `1 / 1` y la accesibilidad existente del diálogo permanece intacta.

## QA visual

BROWSER VISUAL QA DEBT - source/build verified. El entorno no dispone de navegador controlable para comprobar el fondo real en light/dark, el trap de teclado y la transición a Customization. Pendiente: 390x844, 412x914, 430x932, 768px y 1440x900.

## Console/Network

UNVERIFIED BY ENVIRONMENT. Por source, el cambio no añade requests, server actions ni mutaciones de carrito.

## Validación

- TypeScript: PASS (`tsc --noEmit`).
- Build: PASS (`npm run build`).
- HTTP smoke: PASS para catálogo, checkout y success (200).
- `git diff --check`: PASS.

## Gate siguiente

QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-OPTIONS-FLAT-POLISH-1 = ALLOWED
