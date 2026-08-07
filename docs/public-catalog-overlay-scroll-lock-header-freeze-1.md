# PUBLIC-CATALOG-OVERLAY-SCROLL-LOCK-HEADER-FREEZE-1

## Estado

PASS WITH ANDROID QA DEBT - SOURCE/BUILD VERIFIED

## Bug reproducido

Los overlays solo asignaban `body.style.overflow = "hidden"`. En Android esto permite que el gesto alcance el scroll raiz, que el catalogo reaccione y que el header hide-on-scroll vuelva a mostrarse detras del overlay.

## Causa encontrada

Product Detail, Customization, Post-add y Burger Menu tenian locks independientes; Cart Sheet no tenia lock. Ninguno preservaba la posicion con `body` fijo ni coordinaba cierres superpuestos. El listener del header quedaba activo para overlays distintos del menu.

## Scroll lock implementado

`usePublicOverlayScrollLock` aplica un lock compartido con ref-count. Guarda estilos inline y `scrollY`, fija el `body`, bloquea `html/body` y marca `data-public-overlay-open`. El unlock se difiere un tick para cubrir handoffs de React entre overlays. Al liberar el ultimo overlay, restaura estilos y posicion exacta del catalogo.

## Header/nav freeze

El helper emite un evento de cambio. El header usa ese estado para pausar `useHideOnScroll` sin cambiar el estado visible/hidden actual. Al cerrar, el listener reinicia su baseline desde el scroll restaurado y vuelve a reaccionar solo a gestos nuevos.

## Overlays cubiertos

- Product Detail Modal
- Customization Modal
- Cart Sheet
- Post-add Upsell Sheet
- Burger Menu

## Android QA

ANDROID REAL QA: UNVERIFIED BY ENVIRONMENT. Pendiente repetir el gesto sobre Product Detail, Customization, Cart y Burger en la URL LAN vigente para confirmar que header/nav no reaparecen y que el fondo conserva su posicion al cerrar.

## Browser/desktop QA

BROWSER QA DEBT. Pendiente validar wheel/backdrop, scroll interno, Escape y retorno de foco en 390x844, 412x914, 430x932, 768px y 1440x900.

## Console/Network

UNVERIFIED BY ENVIRONMENT. El helper no incorpora requests ni server actions; sus cambios son solo de estilos inline, atributo y evento local.

## Validación

- TypeScript: PASS (`tsc --noEmit`).
- Build: PASS (`npm run build`).
- HTTP smoke: PASS para catálogo, checkout y success (200).
- `git diff --check`: PASS.

## Contratos preservados

No se modificaron media/copy/backdrop del Product Detail, pricing, ProductCard, quick add, Customization options/cache, post-add decisions, cart V2, checkout, actions, DB, RPC ni packages.

## Gate siguiente

QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-OPTIONS-FLAT-POLISH-1 = ALLOWED
