# PUBLIC-CATALOG-UX-UI-REDESIGN-SPEC-CLOSURE-1
## Flat Visual System, Surface Contracts, Implementation Roadmap and Release Gates

## 1. Estado

SPEC CLOSED - PUBLIC CATALOG FLAT REDESIGN READY FOR IMPLEMENTATION

## 2. Resumen ejecutivo

Esta spec congela un rediseño public-facing flat sin alterar la arquitectura actual: server data, `CatalogClient`, carrito local, customization, post-add, checkout y success conservan sus contratos. Las fases de implementacion solo pueden modificar presentacion y accesibilidad explicitamente indicada, con deploy agrupado despues de QA integrada.

## 3. Fuentes

- `docs/public-catalog-ux-ui-redesign-forensic-audit-1.md`: ownership, arbol de render, riesgos e invariantes.
- Source auditado en `app/b/[slug]`, `components/public`, `lib/catalog`, `lib/cart`, `lib/checkout`, `lib/product-customization`, `lib/maps` y `app/globals.css`.
- Baseline: `main` / `origin/main` `3b6160df0cce010a66db6b90cf008fb0fc546529`; release funcional `3bd26ff`.

## 4. Principios

- Mobile-first, lectura lineal, una jerarquia visual por superficie y cero card inception.
- Fondos calidos claros y superficies blancas; informacion se separa por tipografia, espacio y divisores antes que por sombras.
- La semantica, estados locales, callbacks, loaders, cache y server actions no cambian como efecto de un polish.
- Toda superficie editada mantiene paridad light/dark, focus-visible y sus limites de stacking.

## 5. Sistema visual

| Elemento | Contrato congelado |
| --- | --- |
| Fondo | Arena/gris calido muy claro; usar tokens existentes. |
| Superficies | Blancas; borde neutro de `1px` y contraste bajo. |
| Radios | `16-20px` para cards/media/sheets; inputs con radio menor consistente. |
| Spacing | Escala `8/12/16/24/32px`. |
| Sombras | Ninguna en contenido estatico; permitidas solo en overlays/sheets, Cart FAB y opcion activa del segmented. |
| Gradients | Prohibidos decorativamente; solo para legibilidad obligatoria sobre imagen. |
| Tokens | Extender tokens existentes; no crear una paleta paralela ni hardcodear hex por componente. |

## 6. Tokens semanticos

La implementacion reutilizara los tokens actuales de canvas, surface, border, text, business primary y accent. Si falta una expresion semantica, se agregara una variable compartida de alcance publico; no se duplicara el mismo valor en Modules. Los estados open/closed, error, selection, disabled y WhatsApp deberan ser semanticos y tener contraparte dark.

## 7. Header

- Conservar hide-on-scroll en catalogo y header estatico en checkout.
- Eliminar `Pedido online`, wrapper tipo tarjeta del logo y sombra del header; mantener radio propio de la imagen.
- Usar borde inferior ultrafino.
- Mostrar junto al nombre: abierto con punto verde y nombre accesible; cerrado con punto gris y texto visible `Cerrado`.
- Mantener rutas, estado del menu, theme persistence/event, preview y `useHideOnScroll`.

## 8. Hero

- Eliminar superficie blanca externa; media dentro de los margenes de la grilla y `rounded-2xl`.
- Mantener `PublicStorageImage`, priority, loader, fallback y legibilidad funcional sobre imagen.
- Eliminar eyebrow `Pedi online`, status pill, trust chip y microcopy separada.
- Copy unico bajo la imagen, sin fondo ni pill: `Personaliza tu pedido y te lo confirmamos por WhatsApp.`
- El estado de negocio se comunica en header, no en hero.

## 9. Search

- SMALL: sin search DOM.
- MEDIUM y LARGE: input siempre visible; retirar trigger compacto MEDIUM.
- Un input con icono de lupa, placeholder `Buscar productos o categorias`, label accesible `Buscar productos` sin label visual redundante ni helper inferior.
- Mantener result count, clear, Escape, empty state, filtro por categoria, `aria-describedby` equivalente y cero requests.

## 10. Categorias

- Conservar `nav`, chips horizontales, touch targets, scroll-spy y `aria-pressed` durante busqueda.
- Sin sombras; borde neutro; activo con accent de negocio.
- Presentar encabezados en formato oracion y contadores atenuados.
- Retirar transformaciones visuales uppercase; si el dato almacenado llega todo en mayusculas, normalizar solo su presentacion sin cambiar DB ni nombres almacenados.

## 11. Grid y ProductCard

- Dos columnas mobile; singleton conserva una columna; no hay variante horizontal.
- Card blanca, `1px` sutil, `rounded-2xl`, `overflow-hidden`, sin shadow y body con padding mayor.
- Usar columna flexible: texto arriba, precio y accion rapida anclados al fondo, baseline alineada por fila; sin alturas rigidas salvo evidencia de QA.
- Preservar line clamp, placeholder, hit area, teclado, propagation del quick add, simple-product steppers y ruta de producto configurable.

## 12. Burger menu

- Eliminar logo/nombre duplicados. El close es icono `X` simple y sin fondo.
- Navegacion como lista plana con padding generoso y divisores finos; ThemeToggle comparte fila con label.
- Mantener dialog, backdrop, Escape, body lock, links, dark mode y z-index.
- Agregar focus trap y restauracion del foco al boton hamburguesa al cerrar. Elementos cerrados quedan fuera del tab order.

## 13. Product Detail

- Imagen superior edge-to-edge dentro del modal; sin margenes laterales de media.
- Close `X`, jerarquia limpia de titulo/descripcion/precio y footer sticky simplificado.
- Reducir sombras y gradients no funcionales.
- No cambiar draft quantity, remove-at-zero, add, customize callback, scroll lock ni orden de cierre.

## 14. Customization

- Header compacto con `X`; sin imagen inmersiva grande.
- Grupos y opciones son listas planas: fila completa seleccionable, radio/checkbox nativo a la izquierda, contenido central y extra a la derecha; divisores sutiles.
- Seleccion con tintado accent tenue; required con asterisco; error con borde tenue y rojo apagado; footer sticky limpio.
- Plus permanece fuera del modal. Cache, in-flight dedupe, pricing, validation, selection, stale warning y edit mode no cambian.

## 15. Post-add

- Filas candidatas flat, con bordes/sombras reducidos y CTA/dismiss simples.
- Mantener dialog focus trap, attach local y el orden de overlays.
- Trigger solo para `outcome === "created"`; `merged` y `replaced` nunca abren post-add.

## 16. Cart

- FAB conserva visibilidad, root-only count, safe area, focus style y stacking bajo overlays.
- CartSheet usa filas planas, divisores sutiles, hijos indentados y label discreto `Adicional`; retirar linea izquierda accent.
- Quantity usa iconos ligeros, no una pastilla pesada; footer sticky y total permanecen.
- Parent/child, quantities, pricing, edit, remove, signatures y persistencia no cambian.

## 17. Checkout

- Fondo/superficie blanca unificada; retirar cards individuales por seccion y separar con titulo, spacing y divisores.
- Resumen comparte superficie sin perder jerarquia de parent/child.
- Segmented iOS: contenedor gris claro, activa blanca y sombra muy leve; conservar `fieldset`, radios nativos `delivery/pickup`, checked state y teclado.
- Inputs con borde neutral equivalente a gray-200 y radios consistentes. Footer sticky permanece.
- Telefono `+549`, autocomplete lazy en delivery, fallback manual, preview guard, payload/action/RPC y submit state no cambian.

## 18. Success

- Composicion centrada, conclusiva y con ID en fondo blanco o gris ultraclaro.
- Label exacto `ID de pedido`; valor seleccionable.
- CTA exacto `Confirmar por WhatsApp` con variante semantica WhatsApp verde si el Button compartido la necesita; no mutar globalmente el accent del negocio.
- Conservar retorno al catalogo y acceso directo sin `order_id`.

## 19. Responsive

Viewports minimos: `390x844`, `430x932`, `768px`, `1440x900`.

- Sin overflow horizontal; targets cercanos a 44px; wrap correcto en nombres largos.
- Sticky/fixed no cubre contenido, input o CTA; safe-area inferior respetada.
- Teclado mobile permite editar input y enviar sin ocultar el CTA.
- Grid mantiene dos columnas mobile; overlays y listas son utilizables en todos los viewports.

## 20. Dark mode

Cada fase incluye tratamientos dark para canvas, superficies, borders, text, estados activos, dialogs, menu, FAB, checkout y success. No se acepta un cambio global/light-only. Los valores deben derivar de tokens o `color-mix` compatibles con el sistema actual.

## 21. Accesibilidad

- Labels/nombres accesibles, botones nativos y focus-visible visibles.
- `aria-invalid`/`aria-describedby`, `nav` de categorias y combobox de direccion se preservan.
- Dialogs conservan semantica, Escape, foco contenido cuando corresponde y restauracion al disparador.
- Search conserva label accesible aun sin label visual; clear tiene nombre accesible.
- No se declara screen-reader PASS sin una corrida real.

## 22. Invariantes

- Search/filtros locales con cero requests; SMALL sin search DOM; scroll-spy/filtros de categorias intactos.
- Image loader/fallback, catalog cache tags e invalidacion intactos.
- Customization cache/dedupe intactos; Plus fuera de customization; post-add solo `created`.
- Root-only count, parent/child, signatures, quantity y pricing intactos.
- Preview cart aislado y preview checkout bloqueado.
- Telefono validado client/server y normalizado a `+549`; autocomplete solo delivery, fallback manual y direccion string.
- Payload, action y RPC de checkout; success; DB, migrations, RLS/RPC y packages quedan fuera de alcance.
- Cero pedidos reales durante implementacion y QA.

## 23. Ownership y manifest

| Fase | Archivos probables permitidos | Prohibidos / limite |
| --- | --- | --- |
| Shell/header/hero/search | header TSX/module, `CatalogClient`, shell/search Modules, selectores puntuales globals | loaders, search helper, cart helpers, checkout action. |
| Categories/grid/cards | `CategoryNav`, `ProductCard`, module, wiring visual minimo, globals puntuales | cart behavior, product data/order, search contracts. |
| Burger | header TSX/module y selectores menu globals | route/theme persistence behavior salvo focus a11y indicado. |
| Detail | detail TSX y selectores detail globals | cart callback semantics. |
| Customization | modal TSX/module y presentational shared estrictamente necesarios | cache, cart builder, validation/pricing logic. |
| Post-add | sheet TSX/module | post-add helper and attach contracts. |
| Cart | CartBar/CartSheet y Modules | `lib/cart/*` logic. |
| Checkout | checkout/address components and Modules | checkout action, phone/maps helpers, storage contract. |
| Success | success page, success globals, Button WhatsApp variant if required | WhatsApp helper and business accent global. |

Este manifest es un limite, no una autorizacion para editar cada archivo listado.

## 24. Politica de globals

- No limpieza masiva ni renombre amplio de `app/globals.css`.
- Tocar solo selectores identificados por superficie y comprobar landing, catalogo, checkout header, success, preview iframe y dark mode.
- Preferir Modules para nuevos estilos especificos; no duplicar tokens globales en cada Module.
- No eliminar una regla por parecer legacy sin demostrar ausencia de consumidores.

## 25. Roadmap definitivo

| # | Fase | Objetivo y gate de salida |
| --- | --- | --- |
| 1 | `PUBLIC-CATALOG-UX-UI-REDESIGN-SPEC-CLOSURE-1` | Esta spec cerrada. |
| 2 | `PUBLIC-CATALOG-SHELL-HEADER-HERO-SEARCH-POLISH-1` | Shell flat; QA header/hero/SMALL-MEDIUM-LARGE; gate categories. |
| 3 | `PUBLIC-CATALOG-CATEGORIES-GRID-CARDS-POLISH-1` | Chips/grid/cards; QA scroll-spy, quick add, configurables; gate burger. |
| 4 | `PUBLIC-CATALOG-BURGER-MENU-FLAT-A11Y-POLISH-1` | Menu flat + focus trap/return; keyboard QA; gate detail. |
| 5 | `PUBLIC-CATALOG-PRODUCT-DETAIL-MODAL-POLISH-1` | Detail visual; quantity/customize QA; gate customization. |
| 6 | `PUBLIC-CATALOG-CUSTOMIZATION-OPTIONS-FLAT-POLISH-1` | Option rows; required/edit/cache QA; gate post-add. |
| 7 | `PUBLIC-CATALOG-POST-ADD-UPSELL-FLAT-POLISH-1` | Post-add flat; created/merged/replaced QA; gate cart. |
| 8 | `PUBLIC-CATALOG-CART-SHEET-FLAT-POLISH-1` | Cart flat; hierarchy/quantity/total QA; gate checkout. |
| 9 | `PUBLIC-CATALOG-CHECKOUT-FLAT-POLISH-1` | Checkout flat; delivery/pickup/phone/fallback/preview QA; gate success. |
| 10 | `PUBLIC-CATALOG-SUCCESS-PAGE-POLISH-1` | Success and WhatsApp semantic CTA; direct-access QA; gate integrated QA. |
| 11 | `PUBLIC-CATALOG-UX-UI-REDESIGN-INTEGRATED-QA-1` | Browser mobile/desktop, light/dark, keyboard/focus, preview, cart-to-checkout, TypeScript/build/network/console. |
| 12 | `PUBLIC-CATALOG-UX-UI-REDESIGN-DEPLOY-1` | Single grouped production deploy and smoke. |
| 13 | `PUBLIC-CATALOG-UX-UI-REDESIGN-FINAL-HANDOFF-1` | Reconcile production evidence after deploy. |

No deploys intermedios. Cada implementacion requiere review de diff, `git diff --check`, TypeScript/build cuando haya runtime/CSS, y la QA especifica de su fase antes de abrir la siguiente.

## 26. QA integrada

Obligatoria antes de deploy: browser mobile/desktop, light/dark, teclado/foco, preview admin, carrito y checkout, TypeScript, build, console/network y cero pedidos reales. Debe validar explicitamente overlays, focus traps, return focus, no 5xx, cero fetch en search/filtros locales y los invariantes de cart/customization/post-add/checkout.

Deuda aceptable unicamente: Android fisico no disponible, screen reader no disponible, y Maps real cuando falte key/billing/APIs. No P0/P1 abierto.

## 27. Deploy

El unico deploy funcional es `PUBLIC-CATALOG-UX-UI-REDESIGN-DEPLOY-1`, despues de QA integrada. Requiere TypeScript/build PASS, commit/push, deployment Ready, smoke catalogo/checkout y rollback por regresion severa confirmada.

## 28. Handoff

`PUBLIC-CATALOG-UX-UI-REDESIGN-FINAL-HANDOFF-1` se abre solo despues del deploy y de reconciliar Git, deployment, alias y evidencia de smoke. Ninguna fase anterior marca el handoff como completo.

## 29. Riesgos

- `app/globals.css` tiene blast radius sobre landing, catalogo, header de checkout y success.
- Dialog polish puede romper focus, Escape, scroll lock o stacking si mezcla estructura y apariencia.
- Chips cambian de navegacion a filtro con query activa; no ocultar esa semantica.
- Reordenar DOM de cards/cart/checkout puede afectar hit areas, jerarquia y totales.
- Preview y dark mode son obligatorios en toda superficie compartida.

## 30. Gates

```text
QUEUE_GATE: PUBLIC-CATALOG-SHELL-HEADER-HERO-SEARCH-POLISH-1 = ALLOWED
QUEUE_GATE: LATER IMPLEMENTATION PHASES = SEQUENTIAL
QUEUE_GATE: PUBLIC-CATALOG-UX-UI-REDESIGN-DEPLOY-1 = BLOCKED
QUEUE_GATE: PUBLIC-CATALOG-UX-UI-REDESIGN-FINAL-HANDOFF-1 = BLOCKED
```
