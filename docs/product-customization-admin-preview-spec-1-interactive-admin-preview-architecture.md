# PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-SPEC-1 — Interactive Admin Preview Architecture Spec

## Objetivo

Diseñar la arquitectura de una preview interactiva en `/admin/products/customizations` (card "Así lo verá el cliente") que se acerque al modal público real de Product Customization, en modo sandbox: selección single/multi, plus, total estimado, sin carrito, localStorage, checkout ni writes.

Esta fase es **solo spec/auditoría**. No implementa la preview.

## Contexto

Fases cerradas recientes:

- PRODUCT-CUSTOMIZATION-ADMIN-VISUAL-POLISH-1 — PASS
- PRODUCT-CUSTOMIZATION-ADMIN-BUTTON-THEME-POLISH-1 — PASS
- PRODUCT-CUSTOMIZATION-PLUS-UI-DEPLOY-1 — PASS
- PRODUCT-CUSTOMIZATION-PLUS-COPY-POLISH-1 — PASS
- PRODUCT-CUSTOMIZATION-PUBLIC-RLS-HARDENING-1 — PASS
- PRODUCT-CUSTOMIZATION-FLAG-OFF-RLS-FIXTURE-QA-1 — PASS

Estado UI admin: layout/theme/botones cerrados. Preview actual: orientativa, no interactiva, no replica el modal público.

Piloto: demohamburgueseria / La Burguesía.

## Alcance

- Auditar modal público y preview admin.
- Evaluar riesgos de importar el modal completo.
- Definir arquitectura segura (extracción presentacional + sandbox).
- Definir contrato de datos, estado local, reglas single/multi/plus, pricing visual.
- Plan de implementación/QA para PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-POLISH-1.
- Docs: este archivo, CURRENT_PHASE.md, ORDEROPS_LIVING_MEMORY.md.

## Fuera de scope

- Implementar preview interactiva.
- Refactorizar modal público.
- Extraer componentes en esta fase.
- Cambiar CSS/runtime productivo.
- Cart / checkout / create_order / DB / RLS / migrations / deploy / pedidos QA.

## Autorización

```txt
AUTORIZO_PRODUCT_CUSTOMIZATION_ADMIN_PREVIEW_SPEC_LOCAL=yes
AUTORIZO_PRODUCT_CUSTOMIZATION_ADMIN_PREVIEW_SPEC_BROWSER_QA=yes
```

Sin autorización de writes, deploy ni DB.

## Precheck local

```txt
npx tsc --noEmit → PASS
npm run build → PASS
```

Sin cambios de código runtime en esta fase.

## Auditoría del modal público

### Archivo principal

`components/public/catalog/customization-modal.tsx`  
CSS: `customization-modal.module.css`  
Orquestador: `components/public/catalog/catalog-client.tsx` (lazy `next/dynamic`, ssr:false)

### Componentes hijos

Hoy el modal es **monolítico**: no hay subcomponentes extraídos. Toda la UI (header, grupos, opciones, upsell, footer) vive en el mismo archivo.

Helpers externos (reutilizables, client-safe):

| Helper | Archivo | Rol |
|--------|---------|-----|
| `validateCustomizationSelection` | `lib/product-customization/public-shared.ts` | required/min/max |
| `computeVisualCustomizationTotal` | idem | total visual |
| `formatPublicCatalogCurrency` | idem | moneda |
| `getUpsellGroupCopy` / `formatUpsellOptionPrice` | `lib/product-customization/upsell-copy.ts` | copy Plus |
| `buildCartLinesFromCustomizationSelection` | `lib/cart/local.ts` | líneas carrito V2 |

### Props principales

```ts
type CustomizationModalProps = {
  slug: string;
  productId: string;
  productName: string;
  categoryId: string;
  editingCartLineId?: string | null;
  initialSelection?: CustomizationModalInitialSelection | null;
  onClose: () => void;
  onConfirmSelection: (result: CustomizationConfirmResult) => void;
};
```

`CustomizationConfirmResult` = `{ parent, children, replaceCartLineId }` con `LocalCartItemV2`.

### Estado interno

- `loadState`: loading | error | ready | disabled
- `selectedOptionsByGroupId: Record<string, string[]>`
- `selectedUpsellProductIds: string[]`
- `staleWarning`, `confirmError`, `isPending`

### Carga de datos

`useEffect` → `getPublicProductCustomizationConfigAction({ slug, productId })`  
(`app/b/[slug]/catalogo/actions.ts` → `getPublicProductCustomizationConfig`)

### Selección single / multi

- **single:** `toggleSingle` reemplaza por `[optionId]` (radio).
- **multi:** `toggleMultiple` toggle; si `maxSelections` alcanzado y opción no seleccionada → no-op + `disabled` en input.
- Validación con `validateCustomizationSelection` (required/min/max/blocked).

### Plus / upsell

Sección si `config.upsellGroup`; copy vía `getUpsellGroupCopy` ("Sumá una bebida" / "También podés sumar"). Toggle checkbox. No entra en validación de required del CTA.

### Total visual

`computeVisualCustomizationTotal({ basePrice, groups, selectedOptionsByGroupId, upsellProducts, selectedUpsellProductIds })`  
= base + sum(priceDelta) + sum(upsell.price)

### Carrito / side effects

1. `handleConfirm` → `buildCartLinesFromCustomizationSelection` → `onConfirmSelection` → `onClose`
2. Parent `catalog-client` mergea carrito y abre CartSheet
3. Persistencia `localStorage` en parent (`persistUnifiedCartItems`), **no** dentro del modal
4. Side effect del modal: `document.body.style.overflow = "hidden"` mientras está abierto
5. CTA: "Agregar al carrito" / "Actualizar carrito"; disabled si `!validation.valid`

## Auditoría de la preview admin actual

### Archivo

`components/admin/product-customization/customer-preview-panel.tsx`  
Usado desde `owner-customization-builder.tsx` (desktop sticky + mobile collapsible).

### Datos que recibe

`product: BuilderProductRow | null` desde `buildProductRows` (`builder-presentation.ts`).

`BuilderProductRow` incluye: id, name, price, sections (groupId/name/source/options limitadas), hasUpsell, upsellLabel.

**No incluye hoy:** selectionType, isRequired, min/max, option descriptions, lista real de productos upsell + precios, productDescription, imageUrl.

### Qué muestra

- Aviso "Vista previa orientativa · no agrega al carrito"
- Nombre + "Desde {price}"
- Hasta 4 opciones por sección con radio decorativo (no interactivo)
- Plus genérico "Producto sugerido" si hasUpsell
- Copy: "Borrador visual… No es el catálogo real."

### Qué falta vs modal público

| Capacidad | Modal público | Preview admin |
|-----------|---------------|---------------|
| Selección interactiva | Sí | No |
| Single vs multi | Sí | No (todo radio fake) |
| Required/min/max UI | Sí | No |
| Plus con productos/precios | Sí | Label genérico |
| Total estimado | Sí | No |
| Copy upsell real | `getUpsellGroupCopy` | Hardcode parcial |
| Todas las opciones | Sí | slice(0,4) |

### Estilos post visual polish

Panel/surfaces OK. Contenido sigue placeholder.

## Riesgos de importar el modal completo

| Pregunta | Respuesta |
|----------|-----------|
| ¿Depende de carrito real? | Sí vía `onConfirmSelection` + `buildCartLinesFromCustomizationSelection` |
| ¿Depende de localStorage? | Indirecto (parent persiste); modal no escribe, pero confirma líneas cart |
| ¿Asume ruta pública? | Sí: `slug` + server action pública |
| ¿Callbacks add-to-cart? | Sí, obligatorios |
| ¿Side effects? | body overflow lock; fetch server action |
| ¿Datos que admin no tiene en el shape actual? | Config pública vía action; admin tiene corpus admin distinto |
| ¿Modo read-only? | No existe hoy |

**Veredicto: NO importar `CustomizationModal` completo en admin.**

## Opciones de arquitectura evaluadas

### A — Importar modal completo

Descartada: acoplamiento a cart lines, CTA real, action pública, overflow lock, riesgo de side effects.

### B — Extraer presentacionales compartidos + preview sandbox (recomendada)

Modal público y AdminPreview consumen los mismos bloques UI + helpers puros. Admin usa estado local y CTA no operativo.

### C — Duplicar markup en admin

Fallback solo si extracción bloquea. Alta deuda de sync visual.

## Arquitectura recomendada

Opción B.

```txt
lib/product-customization/
  public-shared.ts          # YA: validate + visual total + types
  upsell-copy.ts            # YA: copy plus
  preview-selection.ts      # NUEVO (fase polish): toggles pure

components/product-customization/shared/   # NUEVO
  customization-option-group.tsx
  customization-option-row.tsx
  upsell-suggestion-group.tsx
  customization-price-summary.tsx
  customization-modal-body.tsx   # opcional

components/public/catalog/
  customization-modal.tsx        # orquesta fetch + cart confirm + shell

components/admin/product-customization/
  admin-customization-live-preview.tsx  # reemplaza customer-preview-panel
  map-builder-to-preview-config.ts      # admin corpus → PublicProductCustomizationConfig-like
```

Flujo admin:

```txt
selected BuilderProductRow + groups/assignments/upsells admin
  → map a PreviewConfig (mismo shape que PublicProductCustomizationConfig)
  → AdminLivePreview (estado local sandbox)
  → shared presentational components
  → CTA visual disabled / no-op + aviso sandbox
```

## Componentes candidatos a extraer

1. Option group (header meta required/min/max + lista)
2. Option row (radio/checkbox + name + delta + disabled-at-max)
3. Upsell suggestion group (copy helper + checkboxes + precios)
4. Price summary footer (Total + hint incompleto)
5. (Opcional) Modal body sin chrome de diálogo

Helpers a reutilizar sin mover:

- `validateCustomizationSelection`
- `computeVisualCustomizationTotal`
- `formatPublicCatalogCurrency` / `getUpsellGroupCopy`

## Componentes que NO deben compartirse

| No compartir | Motivo |
|--------------|--------|
| `CustomizationModal` completo | cart confirm, fetch público, overflow |
| `buildCartLinesFromCustomizationSelection` | crea LocalCartItemV2 |
| `catalog-client` / CartSheet / CartBar | carrito real |
| `getPublicProductCustomizationConfigAction` | acoplado a slug público; preferir map admin→config |
| Persistencia localStorage | solo catálogo público |

## Contrato de datos de la preview

Preferir shape alineado a `PublicProductCustomizationConfig`:

```ts
type AdminPreviewConfig = {
  productId: string;
  productName: string;
  productPrice: number;
  productDescription: string | null;
  groups: PublicCustomizationGroup[];
  upsellGroup: PublicUpsellGroupView | null;
};
```

Fuente: mapear corpus admin ya cargado en la page (groups, assignments, upsellGroups, products) — **sin** llamar la action pública ni escribir DB.

Props del futuro componente:

```ts
type AdminCustomizationLivePreviewProps = {
  config: AdminPreviewConfig | null;
  customizationEnabled: boolean;
};
```

## Estado local sandbox

```ts
type PreviewSelectionState = {
  selectedOptionsByGroupId: Record<string, string[]>;
  selectedUpsellProductIds: string[];
};
```

- Inicializar `{}` / `[]` al cambiar de producto.
- No persistir (ni localStorage ni server).
- Reset al cambiar `productId`.

## Reglas de selección single/multi

Alinear al modal público:

- **single:** reemplaza selección del grupo.
- **multi:** toggle; si max alcanzado y no seleccionada → bloquear (disabled), no reemplazar.
- **required/min:** mostrar issues visuales; en admin **no** bloquear exploración (CTA siempre no operativo; opcional hint "incompleto" sin impedir toggles).
- Diferencia UX admin vs público: público deshabilita "Agregar al carrito" si inválido; admin nunca agrega — CTA = "Vista previa — no agrega al carrito".

## Reglas de plus/adicionales

- Toggle productos del upsell group efectivo del producto.
- Copy: `getUpsellGroupCopy(upsellGroup.name)`.
- Precio: `formatUpsellOptionPrice`.
- Opcional; no bloquea preview.
- Mostrar productos reales (ej. Coca Cola 500ml + precio), no placeholder "Producto sugerido".

## Pricing visual estimado

```txt
base product price
+ selected options price_delta
+ selected upsells product price
```

Usar `computeVisualCustomizationTotal`.

Aclarar en UI: **Total estimado (vista previa)** — checkout real recalcula server-side. No tocar server pricing.

## Estados UX a cubrir

1. Grupo single requerido sin selección → issue visible
2. Grupo single con selección
3. Grupo multi opcional
4. Grupo multi con max alcanzado → opciones no seleccionadas disabled
5. Opción price_delta 0 → sin badge +
6. Opción price_delta > 0 → +monto
7. Plus seleccionado / no seleccionado
8. Producto sin customizations ni plus → empty state
9. Con customizations sin plus
10. (Edge) plus sin groups — si config lo permite
11. Flag customization OFF → aviso (admin ya tiene notice global)
12. Sección enabled=false / overrides — map debe filtrar como público

## Plan de implementación recomendado

Fase siguiente: **PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-POLISH-1**

1. Mapper admin corpus → `AdminPreviewConfig` (puro).
2. Extraer presentacionales shared desde markup del modal (sin cambiar comportamiento público).
3. Refactor `CustomizationModal` para consumir shared (smoke público).
4. Implementar `admin-customization-live-preview.tsx` con estado sandbox + helpers puros.
5. Reemplazar `CustomerPreviewPanel` en builder.
6. CSS: reutilizar tokens; module shared o clases del modal con cuidado (no globals).
7. QA dark/light + funcional mínimo.

Orden seguro: mapper + shared extract + admin preview; refactor modal público en el mismo PR solo si smoke público pasa.

## Plan de QA para la fase siguiente

```txt
Admin:
- Doble Smash: single Papas, multi Salsas max, plus Coca, total estimado cambia
- CTA no escribe cart/localStorage/DB
- Producto sin opciones: empty OK
- Dark/light OK
- Reset selección al cambiar producto

Público (regresión):
- Modal Doble Smash sigue abriendo
- Agregar al carrito sigue funcionando
- Plus copy intacto
- Sin pedidos QA obligatorios salvo smoke mínimo autorizado
```

## Riesgos / deuda

- `BuilderProductRow` insuficiente → mapper debe enriquecer desde groups/upsells admin.
- Extracción del modal es refactor público sensible → smoke obligatorio.
- Overrides/blocked groups: mapper debe espejar reglas de `public.ts`.
- Fidelity 100% visual (backdrop fullscreen) no es meta admin; meta = body del modal en card.
- Token on-accent / button polish admin ya cerrado; preview usará estilos shared/public.

## Qué NO se tocó

Runtime · CSS productivo · cart · checkout · create_order · DB · RLS · migrations · deploy · extracción de componentes · implementación preview.

## Validaciones CLI

```txt
tsc PASS
build PASS
```

## Resultado final

**PASS** — arquitectura definida; recomendación Opción B; modal completo no importable.

## Próxima fase recomendada

**PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-POLISH-1** — implementar preview interactiva sandbox según este spec (mapper + shared presentational + admin live preview), con smoke de no-regresión del modal público.
