# PUBLIC-CATALOG-PRODUCT-DETAIL-MODAL-FORENSIC-AUDIT-1

## Estado

PARTIAL — PRODUCT DETAIL MODAL AUDIT INCOMPLETE

Source audit completo. BROWSER VISUAL QA: UNVERIFIED. El componente, sus flujos y sus contratos quedaron identificados; el gate de implementacion puede avanzar con deuda visual explicita.

## Componentes y archivos involucrados

| Area | Archivo | Evidencia actual |
| --- | --- | --- |
| Modal de detalle | `components/public/catalog/product-detail-modal.tsx` | Render, draft quantity, pricing, close y CTA. |
| Ownership de overlays | `components/public/catalog/catalog-client.tsx` | `selectedProductId`, apertura, cierre, cart callback y transicion a Customization. |
| Apertura desde card | `components/public/catalog/product-card.tsx` | Click/Enter/Space abren detail; quick action detiene propagacion. |
| Imagen publica | `components/public/catalog/public-storage-image.tsx` | Next Image, loader Supabase y fallback a object URL ante error. |
| Estilos | `app/globals.css` | `.catalog-modal-*`, `.catalog-quantity-control*`, desktop media query y dark tokens. |
| Datos | `lib/catalog/public.ts` | `PublicProduct`: id, category, name, description, price, image y customization summary. |
| Pricing/config decision | `lib/product-customization/public-shared.ts` | `productNeedsCustomizationModal`, `shouldShowPriceFrom`, formatter ARS. |
| Cart simple | `lib/cart/local.ts` | Lectura y reemplazo de cantidad legacy sin tocar parents/children V2. |

## Flujo producto simple

1. La hit area de `ProductCard` llama `onOpenProduct(product.id)` por click, Enter o Space (`product-card.tsx:33-36`, `68-73`).
2. `CatalogClient.handleOpenProduct` guarda `selectedProductId` (`catalog-client.tsx:334-336`).
3. El modal recibe el producto, cantidad legacy actual y `requiresCustomization=false` (`catalog-client.tsx:848-859`).
4. El draft inicia en `max(currentQuantity, 1)` y se resincroniza por producto/cantidad (`product-detail-modal.tsx:28-32`).
5. Los botones permiten bajar hasta cero o aumentar sin limite UI (`product-detail-modal.tsx:151-168`).
6. El footer calcula subtotal como `product.price * draftQuantity`; no altera pricing de dominio (`product-detail-modal.tsx:190-194`).
7. Submit llama `setLegacyProductQuantity`, luego cierra (`product-detail-modal.tsx:70-80`, `catalog-client.tsx:853-858`). Cero elimina la linea; positivo reemplaza la unica linea legacy del producto (`lib/cart/local.ts:253-283`).

El flujo simple no abre Customization, no crea parent/children V2 y no dispara post-add.

## Flujo producto configurable

1. La card completa sigue abriendo Product Detail.
2. `requiresCustomization` deriva exclusivamente de `summary.hasCustomizations` (`public-shared.ts:65-74`).
3. Detail muestra `Desde`, helper de precio, helper de opciones y CTA `Elegir opciones` (`product-detail-modal.tsx:52-68`, `132-149`).
4. Submit no guarda cantidad legacy: llama `onCustomize` (`product-detail-modal.tsx:70-75`).
5. `openCustomizationModal` cierra detail y otros overlays, usa cache/in-flight por `slug:productId`, o ejecuta un unico server action on-demand (`catalog-client.tsx:279-319`).
6. Post-add solo se decide despues de confirmar Customization y solo para outcome `created` (`catalog-client.tsx:390-432`). Detail no lo abre directamente.

## Apertura, cierre y transicion a customization

- Card click/teclado: abre Product Detail.
- Quick add simple: detiene propagacion y crea cantidad legacy 1 sin abrir detail (`product-card.tsx:106-130`, `catalog-client.tsx:338-352`).
- Quick add configurable: detiene propagacion y abre Customization directamente; evita Product Detail.
- Cierre actual: boton textual `Cerrar` o click en backdrop.
- Click dentro del sheet detiene propagacion.
- `Elegir opciones`: desmonta Product Detail antes de abrir Customization; no superpone ambos modales.
- Preview: usa el mismo componente. El clear-cart message limpia tambien `selectedProductId` y `customizationSession` (`catalog-client.tsx:485-510`).

## Pricing, cantidad y cart contracts

- `showFrom` usa `shouldShowPriceFrom`: customizaciones, customizaciones pagas, upsell o `priceFrom` finito pueden activar `Desde` (`public-shared.ts:76-89`).
- Si existe `priceFrom`, ese valor se muestra; si no, se usa `product.price`.
- Simple: subtotal del footer siempre usa precio base por cantidad; no incorpora customization deltas.
- Configurable: footer muestra `Opciones` y `Desde $...`; el total final queda delegado a Customization.
- Labels de submit: agregar, quitar, actualizar o elegir opciones dependen del estado local; son copy de UI, no branching de dominio.
- `setLegacyProductQuantity` solo reemplaza/elimina schema V1 del mismo productId. No modifica signatures, parents, children ni root count V2.
- Persistencia de cart sigue en el efecto existente de `CatalogClient`; Product Detail no escribe storage directamente.
- No hay server action en open/close/simple quantity. El fetch on-demand pertenece a la transicion configurable.

Riesgo a preservar: productos Plus-only pueden mostrar `Desde` por summary pero siguen siendo quick-add/simple porque `productNeedsCustomizationModal` solo considera `hasCustomizations`. No cambiar esta decision en polish visual.

## Imagen/media actual

- Modal con imagen: `PublicStorageImage`, `fill`, alt igual al nombre, sizes mobile `92vw` / desktop `480px`.
- Wrapper e imagen tienen altura fija `240px`; desktop pasa a `320px` (`app/globals.css:1592-1613`, `3261-3264`).
- No existe `aspect-ratio` en el modal. `object-fit: cover` recorta sobre una caja horizontal variable.
- ProductCard usa media `1 / 1`; por source, Product Detail no mantiene esa geometria.
- Sin imagen: placeholder `Sin foto`; dark tiene gradient propio.
- Loader/fallback se mantiene en `PublicStorageImage`: render endpoint primero, object URL solo tras error.

## Header, copy y footer actuales

- Header sticky: eyebrow hardcodeado `Producto`, `h2` con nombre y boton pill textual `Cerrar`.
- `Cerrar` es un button nativo con nombre visible, pero no tiene `aria-label` adicional.
- Copy configurable hardcodeado y global para todo configurable:
  - `El precio final depende de las opciones que elijas.`
  - `Elegi las opciones obligatorias y, si queres, suma extras antes de agregarlo al pedido.`
- Footer sticky al bottom, con safe-area bottom, summary y CTA.
- Configurable usa label `Opciones`; cambiarlo visualmente a `Personalizacion` no debe afectar callbacks ni pricing.
- Quantity control large usa columnas `48/56/48` y targets de 48px; es candidato a density polish, no a cambio logico.

## Light theme

- Sheet, header, footer, quantity y placeholder consumen `--catalog-surface-strong`, `--catalog-border`, `--catalog-text` y `--catalog-muted` definidos en `.catalog-page`.
- CTA usa `--business-primary` y foreground del tenant.
- Mobile usa superficies solidas. Desde 768px, header/footer pasan a rgba + blur y el backdrop usa blur de 6px.

## Dark theme

- `.catalog-page[data-theme="dark"]` define surface strong solida `#1d1712`, texto, muted y border.
- Sheet principal consume la surface strong y queda solido por source.
- Header/footer son solidos mobile; desde 768px usan rgba dark `0.94/0.96` y blur.
- Backdrop es translucido en ambos temas; desktop agrega blur.
- Placeholder dark tiene colores propios. CTA y quantity heredan tokens con contraste esperado por source.
- Paridad visual y transparencia real: UNVERIFIED BY BROWSER. El polish debe seguir el estandar: backdrop translucido, sheet/header/footer legibles y tokens dentro del scope `.catalog-page`.

## Accesibilidad actual

| Contrato | Estado | Evidencia |
| --- | --- | --- |
| `role="dialog"` | VERIFIED BY SOURCE | `.catalog-modal`. |
| `aria-modal="true"` | VERIFIED BY SOURCE | Modal root. |
| Nombre accesible | VERIFIED BY SOURCE | `aria-labelledby` al `h2` del producto. |
| Close accesible | VERIFIED BY SOURCE | Boton nativo con texto `Cerrar`. |
| Backdrop close | VERIFIED BY SOURCE | Backdrop `onClick={onClose}`; sheet detiene bubbling. |
| Scroll lock | VERIFIED BY SOURCE | Guarda/restaura `document.body.style.overflow`. |
| Escape | MISSING | No listener de teclado. |
| Initial focus | MISSING | No ref ni `.focus()`. |
| Focus trap | MISSING | No manejo Tab/Shift+Tab. |
| Return focus | MISSING | No captura/restauracion del trigger. |
| Background inertness | MISSING | `aria-modal` no se complementa con inert/focus containment. |
| Quantity keyboard | PARTIAL | Botones nativos, pero `-` y `+` no tienen accessible names ni group label. |
| CTA labels | VERIFIED BY SOURCE | Texto visible segun outcome de UI. |
| Browser/screen reader | UNVERIFIED | Browser automation no disponible en este entorno. |

Customization ya posee refs, foco inicial, Escape capture, focus trap y retorno. Reusar ese patron conceptual en la fase de polish; no crear una segunda solucion divergente.

## Riesgos de regresion

- Cambiar `submitQuantity` puede convertir configurable en legacy o alterar eliminacion por cero.
- Unificar quick add con detail puede agregar requests o abrir overlays no previstos.
- Recalcular `Desde` localmente puede divergir de `shouldShowPriceFrom`.
- Reusar subtotal configurable en detail puede mostrar un total no seleccionado.
- Cambiar `openCustomizationModal` puede romper cache/dedupe, edit, post-add o stacking de overlays.
- Tocar helpers de cart puede afectar signatures y parent/child V2.
- Hacer media edge-to-edge sin revisar scroll/footer puede tapar copy o aumentar overflow mobile.
- Aplicar dark selectors fuera de `.catalog-page` puede perder tokens del tenant.

## Hallazgos visuales confirmados

Confirmados por source:

- Media horizontal de altura fija, distinta del `1 / 1` de ProductCard.
- Header con eyebrow `Producto` y boton pill textual `Cerrar`.
- Copy configurable hardcodeado y duplicado en dos helpers.
- Footer sticky con safe-area; desktop restaura glass/blur.
- Quantity large tiene geometria ancha y no tiene labels accesibles en botones.
- Configurable muestra `Opciones`, `Desde` y CTA `Elegir opciones`.

BROWSER VISUAL QA: UNVERIFIED. No se declaran como verificados los viewports, light/dark, clipping, sticky overlap ni transicion visual real.

## Entra en PRODUCT-DETAIL-MODAL-POLISH-1

- Media modal `1 / 1` o contrato final congelado, con `object-fit: cover`, placeholder y loader intactos.
- Media edge-to-edge segun spec, sin cambiar source de imagen.
- Header visual, jerarquia de titulo/copy y close `X` con nombre accesible.
- Implementar Escape, foco inicial, trap y retorno siguiendo el patron probado de Customization.
- Mejorar accessible names de quantity y densidad sin cambiar handlers/limites.
- Simplificar footer sticky, copy `Personalizacion`, safe-area y paridad light/dark.
- Eliminar glass involuntario de header/footer si QA demuestra baja legibilidad.

## Fuera de alcance para fases posteriores

Customization Options:

- Filas de opciones, radio/checkbox, required/min/max, extras, grupos, option pricing y copy interno.
- Cache, in-flight dedupe, confirm selection y focus del Customization Modal salvo referencia de patron.

Cart/Post-add/Checkout:

- Signatures, parent/child, root count, quantity del CartSheet, post-add created/merged/replaced, attach y remove.
- Persistencia/localStorage, Cart FAB, checkout action, submit y success.

Tambien fuera: loaders, server actions, DB, RPC, packages y preview-specific forks.

## Validacion

- Source audit: PASS.
- BROWSER VISUAL QA: UNVERIFIED.
- TypeScript: PASS (`tsc --noEmit`).
- `git diff --check`: PASS.
- Build: no requerido para docs-only; ultimo build previo PASS, no atribuido a este audit.
- Runtime changes: 0.
- CSS changes: 0.
- Component changes: 0.
- DB/RPC/package changes: 0.
- Real orders: 0.

## Gate siguiente

QUEUE_GATE: PUBLIC-CATALOG-PRODUCT-DETAIL-MODAL-POLISH-1 = ALLOWED WITH VISUAL QA DEBT

Proximo paso: `PUBLIC-CATALOG-PRODUCT-DETAIL-MODAL-POLISH-1`.
