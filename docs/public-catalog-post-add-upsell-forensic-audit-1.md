# PUBLIC-CATALOG-POST-ADD-UPSELL-FORENSIC-AUDIT-1

## Estado

PARTIAL - POST-ADD UPSELL AUDIT COMPLETE WITH VISUAL QA DEBT

El source, contratos y contenido quedaron mapeados. Browser/Android real no estuvo disponible para auditar visualmente el sheet.

## Componentes y archivos involucrados

| Area | Archivo | Rol |
| --- | --- | --- |
| Sheet | `components/public/catalog/post-add-upsell-sheet.tsx` | Render, foco, Escape, add y cierre. |
| Estilos | `components/public/catalog/post-add-upsell-sheet.module.css` | Backdrop, sheet, lista, rows y CTAs. |
| Ownership | `components/public/catalog/catalog-client.tsx:390-453, 807-845` | Estado `postAddOpportunity`, created-only, CartSheet y callbacks. |
| Decision | `lib/cart/post-add-upsell.ts:73-160` | Filtro de candidatos y decision de abrir sheet o carrito. |
| Cart | `lib/cart/local.ts:724-821` | Adjunta child V2, actualiza signature y conserva familia. |
| Datos | `lib/product-customization/public.ts`, `public-shared.ts:33-55` | Resuelve un `upsellGroup` efectivo y serializa candidatos publicos. |

## Data contract y origen de contenido

`PostAddUpsellOpportunity` recibe `parentCartLineId` y `candidates`. Cada candidato es `PublicUpsellSuggestedProduct`: `id`, `name`, `price` e `imageUrl`.

- DB/admin-managed: upsell group, target producto/categoria, items, disponibilidad, sort order y producto sugerido (`id`, nombre, precio, imagen, disponibilidad).
- Derived from DB: un unico group efectivo, con precedencia producto sobre categoria; el resolver conserva el orden y filtra items/productos no disponibles.
- Computed runtime: parent line, candidatos elegibles, attached/pending/blocked/error y label final `Ahora no` o `Listo`.
- Cart/signature contract: `parentCartLineId`, child `itemKind="upsell"`, `parentCartLineId`, cantidad heredada y `configurationSignature` del parent.
- Accessibility-only: ids de titulo/descripcion/error y `aria-busy`/`aria-describedby`.

## Inventario de textos visibles

| Texto | Origen | Archivo/línea | Editable admin | Puede pulirse |
| --- | --- | --- | --- | --- |
| `¿Sumás algo más?` | UI hardcoded | `post-add-upsell-sheet.tsx:251` | No | Sí |
| `Completá tu pedido con alguno de estos adicionales.` | UI hardcoded | `:253` | No | Sí |
| `Cerrar` | UI hardcoded visible | `:264` | No | Sí, por X accesible |
| Nombre, ej. `Coca Cola 500ml` | DB/admin product name | `:300` | Sí | No, solo presentación |
| Precio, ej. `$ 3.000,00` | DB price + formatter | `:279, 302` | Sí | No, solo presentación |
| `Agregar · $...` / `Agregado` | UI derivado | `:284-286` | No | Sí, sin cambiar sentido |
| `Ahora no` / `Listo` | UI derivado por attachedCount | `:66-68, 340` | No | Sí, sin cambiar flujo |
| Conflicto de combinación | UI hardcoded | `:216` | No | Sí, sin alterar branch |

## Qué viene de DB/admin

No tocar nombre, precio, imagen, disponibilidad ni orden de candidatos. Tampoco el `upsellGroup` efectivo, asignaciones, target producto/categoria ni los items disponibles. El overlay no recibe descripciones, stock, `priceFrom` ni `customizationSummary` de los candidatos.

## Qué es UI copy hardcodeado

Titulo, subtitulo, cierre, verbos de add/attached, `Ahora no`/`Listo`, error de conflicto y error de parent missing son UI. Pueden pulirse solo preservando sus condiciones y significado.

## Flujo de apertura

Customization confirma parent/children sin Plus seleccionado y entrega `suggestedUpsellProducts` desde `config.upsellGroup.products` (`customization-modal.tsx:296-318`). `CatalogClient` hace merge y solo llama `decidePostAddOverlay` cuando `mergeResult.outcome === "created"` (`catalog-client.tsx:419-436`).

El detail simple, quick add simple, quick add configurable directo, merge, replace, signature conflict y edit mode no abren este sheet. Al abrir, CartSheet queda cerrado; si no hay candidatos elegibles se abre CartSheet directamente.

## Condición created-only

`decidePostAddOverlay` retorna `openPostAdd: false` para todo outcome distinto de `created` (`post-add-upsell.ts:138-160`). Este es el guard contractual de created-only.

## Productos ofrecidos y origen

Hay un solo `upsellGroup` efectivo por producto. Los candidatos provienen exclusivamente de `config.upsellGroup.products`; el helper limita a tres y excluye id invalido, duplicado, parent mismo, precio invalido, already-attached y posibles conflictos de signature. Son productos simples para esta superficie: el shape no contiene configuracion ni puede abrir Customization.

## Agregar upsell

Se pueden agregar varios candidatos en la misma sesion. Cada boton usa `attachUpsellChildToParent`; un success deja el sheet abierto, marca solo ese candidato `Agregado` y actualiza el Cart FAB via `setCartItems`. No hay recursion de post-add porque attach no llama la decision de overlay.

El helper crea un child V2 `upsell` con cantidad igual al parent, lo inserta despues de la familia y actualiza la `configurationSignature` del parent. `already_attached` es idempotente; `signature_conflict` bloquea solo ese candidato; `parent_missing` cierra al sheet y abre CartSheet con notice.

## Rechazar / Ahora no

`Ahora no` y cierre/backdrop/Escape llaman `finishOnce`, limpian `postAddOpportunity` y abren CartSheet (`catalog-client.tsx:444-447`). No mutan el carrito ni disparan actions.

## Cart signatures, parent/child y post-add contracts

El child conserva `parentCartLineId` y categoria del parent; la cantidad sigue al parent. La signature se recalcula con los ids de children para prevenir colision con otro root. No se crean pedidos ni se toca checkout/local persistence fuera del `setCartItems` existente.

## Layout actual

Sheet bottom modal con lista vertical. Cada item es una row con thumbnail 56px, nombre, precio y CTA full-width; footer contiene CTA primario full-width. Header usa cierre textual. El body interno hace `overflow-y: auto`; header/footer son siblings flex, por lo que permanecen visibles sin sticky.

## Evaluación list vs grid vs híbrido

La lista es el baseline más seguro: los candidatos pueden no tener imagen y los nombres DB no tienen límite conocido. Un grid de dos columnas aumentaría riesgo de wrap, CTA estrecho y lectura de imagen faltante, sin aportar valor para el límite actual de tres.

Recomendación: fase 1 debe preservar lista compacta y corregir dark/surfaces/jerarquía. Luego, con QA real de 2-3 candidatos e imágenes reales, evaluar un híbrido: una card compacta para un candidato y grid solo cuando todos tengan imagen y el viewport soporte targets. No recomendar grid universal aún.

## Light theme

Actualmente usa `--bg-surface`, `--bg-canvas`, `--text-*`, `--border-subtle`, `--accent-*` y `--business-primary`. Light está alineado al estilo previo, salvo la jerarquía de CTAs observada por QA manual.

## Dark theme

No hay selector dark ni tokens `--post-add-*`. Al renderizar dentro de `.catalog-page[data-theme="dark"]`, el sheet sigue tomando tokens globales light, explicación confirmada del sheet blanco y botones claros en dark.

## Accesibilidad actual

- Dialog, `aria-modal`, nombre y descripción: VERIFIED BY SOURCE.
- Foco inicial en close, Tab/Shift+Tab trap, Escape y backdrop close: VERIFIED BY SOURCE.
- Scroll lock compartido y overscroll body: VERIFIED BY SOURCE.
- `aria-busy`, error asociado al CTA e imagen decorativa con `alt=""`: VERIFIED BY SOURCE.
- Return focus al trigger exacto: MISSING. El cleanup de foco está vacío y el cierre transiciona a CartSheet.
- Keyboard real, lector de pantalla, contraste y orden visual: UNVERIFIED.

## Scroll, sticky, backdrop y lock

`usePublicOverlayScrollLock` protege el fondo y el body interno contiene overscroll. El sheet tiene max-height y footer fuera del scroll. La persistencia de header/nav freeze es compartida con overlays. QA Android de scroll interno y backdrop: UNVERIFIED.

## Hallazgos visuales confirmados

Por source y QA manual: superficies se resuelven light en dark, close es textual, CTA add usa `--accent-*` global y el CTA inferior usa el accent principal. Esto explica la jerarquía invertida y la falta de paridad. Lista vertical confirmada; proporcionalidad real y scroll: pendiente browser.

## Entra en POST-ADD-UPSELL-FLAT-POLISH-1

Tokens scoped light/dark, backdrop/sheet/header/footer, cierre X, jerarquía de CTAs, rows, thumbnails, selected/error/disabled visual, focus-visible, density y copy UI. Mantener lista en la primera fase.

## Recomendación de fases progresivas

1. Surface/token/a11y visual: dark, close X y CTA hierarchy sin alterar la lista o handlers.
2. Layout polish: validar lista compacta contra híbrido con device QA y datos reales.
3. QA de interacción: Android scroll, Escape/focus return, screen reader, console/network y count de Cart FAB.

## No tocar porque viene de DB/admin

Upsell group, candidatos, nombres, precios, imágenes, disponibilidad, orden y targets. No inferir descripciones ni customization de candidatos que no existen en el contrato serializado.

## Fuera de alcance

Resolver data/admin, validación de customizations, helpers de signatures/cart, CartSheet, Product Detail, Customization, checkout, success, DB/RPC/actions y packages.

## Riesgos de regresión

- Abrir post-add para merged/replaced/edit.
- Re-disparar post-add al adjuntar un candidato.
- Romper signature, quantity heredada o inserción parent/child.
- Mostrar candidatos no disponibles, duplicados o en conflicto.
- Cambiar nombre/precio/orden DB.
- Romper preview isolation, Cart FAB, lock/freeze o el foco entre overlays.
- Aplicar tokens globales que afecten otros sheets.

## Validación

- TypeScript: PASS (`tsc --noEmit`).
- `git diff --check`: PASS.
- Cambios runtime/CSS/component/DB/RPC/package de esta auditoría: 0.

## Gate siguiente

QUEUE_GATE: PUBLIC-CATALOG-POST-ADD-UPSELL-FLAT-POLISH-1 = ALLOWED WITH VISUAL QA DEBT
