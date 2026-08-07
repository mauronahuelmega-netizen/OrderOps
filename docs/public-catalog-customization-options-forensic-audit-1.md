# PUBLIC-CATALOG-CUSTOMIZATION-OPTIONS-FORENSIC-AUDIT-1

## Estado

PARTIAL - CUSTOMIZATION OPTIONS AUDIT COMPLETE WITH VISUAL QA DEBT

Source and data-contract audit is complete. No runtime, CSS, component, DB, RPC, action or package changes were made in this phase. Browser and Android visual confirmation remain unavailable.

## Componentes y archivos involucrados

- Modal lifecycle and submit: `components/public/catalog/customization-modal.tsx`.
- Modal sheet/header/footer: `components/public/catalog/customization-modal.module.css`.
- Group layout and DB-backed presentation: `components/product-customization/shared/customization-option-group.tsx` and `customization-shared.module.css`.
- Native radio/checkbox rows: `components/product-customization/shared/customization-option-row.tsx`.
- Public client contract and pure pricing/validation: `lib/product-customization/public-shared.ts`.
- Public config resolver: `lib/product-customization/public.ts:getPublicProductCustomizationConfig`.
- On-demand public action: `app/b/[slug]/catalogo/actions.ts:getPublicProductCustomizationConfigAction`.
- Cart lines/signatures: `lib/cart/local.ts:buildCartLinesFromCustomizationSelection` and signature helpers.
- Cache/in-flight ownership and overlay sequencing: `components/public/catalog/catalog-client.tsx`.

## Data contract y origen de contenido

`PublicProductCustomizationConfig` reaches the client with `productId`, `productName`, `productPrice`, `productImageUrl`, `productDescription`, resolved `groups` and an optional `upsellGroup`.

Each `PublicCustomizationGroup` carries DB/admin-managed `id`, `name`, `description`, `selectionType`, `isRequired`, `minSelections`, `maxSelections` and ordered selectable options. Each option carries DB/admin-managed `id`, `name`, `description` and `priceDelta`; availability, assignments, overrides and sort order are resolved server-side before this public shape is returned. `isBlocked`, selected IDs, validation issues and visual total are runtime-derived.

## Inventario de textos visibles

| Texto | Origen | Editable admin/DB | Puede cambiarse en polish |
| --- | --- | --- | --- |
| `Armá tu pedido` | UI hardcodeado | No | Sí, presentación/copy UI |
| Nombre del producto | `config.productName` | Sí | No contenido |
| `Precio base` + importe | UI + `config.productPrice` | Importe sí | Solo label visual |
| Descripción de producto | `config.productDescription` | Sí | No contenido |
| `Papas`, `Salsas`, `Agregados extra` | `group.name` | Sí | No |
| Descripción de grupo | `group.description` | Sí | No |
| Nombres/descripciones de opción | `option.name` / `option.description` | Sí | No |
| Delta `+$...` | UI formatter + `option.priceDelta` | Importe sí | Solo presentación |
| `Obligatorio`, `Opcional`, `mín.`, `máx.` | UI derivado | No | Sí, sin cambiar reglas |
| Error `Elegí ... en “Grupo”` | UI derivado por validator | No | Sí, sin alterar condición |
| Error global de footer | UI hardcodeado según validation | No | Sí, sin alterar condición |
| `Agregar` / `Actualizar` + total | UI derivado | No | Sí, sin cambiar sentido/cálculo |
| `Cerrar`, `Reintentar`, loading/disabled copy | UI hardcodeado | No | Sí |

## Qué viene de DB/admin

No tocar contenido de producto, grupos u opciones: nombres, descripciones, price deltas, tipo single/multiple, disponibilidad efectiva, required, min/max, sort order, asignaciones, overrides ni upsell candidates. El resolver público ya filtra disponibilidad y aplica precedencia de producto sobre categoría antes de serializar el config.

## Qué es UI copy hardcodeado

Eyebrow, labels de precio/base, badges required/optional, textos min/max, estados loading/error/disabled, warnings de selección stale, mensajes del validator, copy de footer, verbos CTA, `aria-label` de cierre y CTA son copy de UI. Pueden pulirse solo preservando la misma semántica, condiciones y referencias al nombre de grupo.

## Flujo de apertura

`CatalogClient` abre Customization desde Product Detail (`Elegir opciones`), quick add configurable y edición de parent V2. Cierra Product Detail, Cart Sheet y Post-add antes de crear una sesión. Cachea por `slug:productId`, deduplica requests in-flight y usa la action pública solo en el primer open sin cache. El overlay recibe `loadState` y nunca carga config por sí mismo.

## Flujo de selección

Single usa radio con un `name` por grupo y `selectSingleOption`; multiple usa checkbox y `toggleMultipleOption`. Required/min/max determinan layout list o compact-grid, deshabilitan opciones no seleccionadas al alcanzar máximo y producen issues por grupo. Grupos bloqueados generan una issue; el contenido seleccionado stale se filtra al abrir una configuración ready.

## Validación required/min/max

`validateCustomizationSelection` valida opciones permitidas, single <= 1, required/min >= selección necesaria y max. Los mensajes mencionan el grupo DB sin modificarlo. El CTA se deshabilita cuando `validation.valid` es falso y el footer muestra el hint global cuando existen issues.

## Pricing y total

`computeVisualCustomizationTotal` suma precio base y `priceDelta` de IDs seleccionados. En este modal no se selecciona Plus: `upsellProducts` y `selectedUpsellProductIds` se pasan vacíos porque Post-add lo posee. ARS se formatea con `formatPublicCatalogCurrency`; el total alimenta CTA y aria-label sin redondeos alternativos.

## Submit, cart signatures y post-add

Al confirmar válido, `buildCartLinesFromCustomizationSelection` crea parent/children con quantity 1. `CatalogClient` mergea por signature, conserva parent/child y solo abre Post-add para outcome `created`; merged/replaced no cambian ese contrato. Edit mode usa `editingCartLineId` y preserva candidatos Plus adjuntos elegibles. El modal no persiste directamente ni crea pedidos reales.

## Header, body y footer actuales

Header contiene eyebrow UI, nombre de producto y precio base. Body muestra descripción DB, grupos en orden resuelto, rows nativas y errores. Footer sticky contiene `CustomizationPriceSummary`, hint derivado y CTA disabled/enabled. Cierre es textual; el footer respeta safe area.

## Light theme

El CSS Module usa tokens generales `--bg-surface`, `--bg-canvas`, `--border-subtle`, `--text-primary/secondary/tertiary` y `--business-primary`. Rows seleccionadas mezclan accent y surface; errores usan `--color-cancelled`.

## Dark theme

No hay paleta específica del modal: depende de los tokens globales resueltos por tema. Esto es un riesgo de polish: verificar que `--bg-surface`, rows, selected state, error, disabled CTA y backdrop mantengan contraste real en dark, sin sustituir datos DB.

## Accesibilidad actual

- `role="dialog"`, `aria-modal` y nombre por `aria-labelledby`: VERIFIED BY SOURCE.
- Botón close, foco inicial, Escape, Tab/Shift+Tab trap y retorno a trigger: VERIFIED BY SOURCE.
- Backdrop close y lock compartido de viewport: VERIFIED BY SOURCE.
- Radio/checkbox nativos, labels por `htmlFor`, disabled nativo y CTA disabled: VERIFIED BY SOURCE.
- Asociación programática de issue con grupo/input, announcement completo de deltas y QA screen reader: UNVERIFIED.
- Browser keyboard, light/dark y Android: UNVERIFIED.

## Scroll, sticky y backdrop

Body interno tiene `overflow-y: auto` y `overscroll-behavior: contain`; footer usa safe area. El reciente `usePublicOverlayScrollLock` bloquea el scroll raíz y congela header/nav mientras el modal está abierto. Falta confirmar en Android que el header no reaparece detrás del modal y que opciones extensas siguen desplazándose dentro del body.

## Hallazgos visuales confirmados

Por source: header/close textual, badges UI, list/compact-grid, selected/disabled styles y footer sticky son superficies aptas para polish. Browser visual de jerarquía, contraste, wrapping, first-group visibility, error prominence y backdrop: UNVERIFIED.

## Entra en CUSTOMIZATION-OPTIONS-FLAT-POLISH-1

Header/close visual, spacing, sticky layers, option row selected/disabled styles, radio/checkbox presentation, badges UI, error presentation/copy UI, CTA visual, light/dark token application and focus/error visibility. El polish puede reorganizar presentación, pero no sustituir ningún string proveniente de config.

## No tocar porque viene de DB/admin

Producto, descripción, grupos, descripciones de grupos, opciones, descripciones de opción, importes, min/max, required, tipo de selección, orden y disponibilidad efectiva.

## Fuera de alcance

Customization data/admin, pricing rules, validation conditions, cache/dedupe, cart signatures, parent/child, Post-add, Cart Sheet, checkout, success y schema/RPC/actions.

## Riesgos de regresión

- Confundir group/option descriptions con UI copy.
- Alterar min/max o single/multiple al cambiar badges/rows.
- Cambiar visual total, signature o post-add created-only.
- Romper edit-mode, cache/in-flight, preview isolation o scroll lock.
- Degradar contraste dark, focus trap o scroll interno.

## Validación

- TypeScript: PASS (`tsc --noEmit`).
- `git diff --check`: PASS.
- Runtime/CSS/component/DB/RPC/package changes in this audit: 0.

## Gate siguiente

QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-OPTIONS-FLAT-POLISH-1 = ALLOWED WITH VISUAL QA DEBT
