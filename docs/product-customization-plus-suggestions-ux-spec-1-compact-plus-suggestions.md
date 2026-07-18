# PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-UX-SPEC-1 — Plus Suggestions Compact UX Specification

## Objetivo

Diseñar una UX compacta para la pestaña **Plus sugeridos** de `/admin/products/customizations`, de modo que la pantalla principal sirva para **leer y entender** las ventas sugeridas, y la edición detallada ocurra en **modales centrados** — alineada al patrón ya aprobado en Secciones reutilizables.

Esta fase es **solo especificación**. La implementación queda para:

```txt
PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-COMPACT-1
```

## Contexto

| Hecho | Estado |
|-------|--------|
| Secciones reutilizables compact (cards + ⋮ + modales) | PASS + cleanup PASS |
| Preview admin interactiva + overrides | PASS WITH DATA QA DEBT |
| Tab Plus sugeridos | Funcional, denso, formularios inline siempre abiertos |
| Piloto demohamburgueseria | 1 venta: **Bebidas** → producto **Doble Smash** → ítem **Coca Cola 500ml** |
| Usuario objetivo | Dueño/encargado gastronómico (no técnico) |

Referencia de patrón UI:

```txt
docs/product-customization-reusable-sections-ux-spec-1-compact-reusable-sections.md
components/admin/product-customization/reusable-sections/*
```

## Alcance

- Auditoría de componentes, actions y CSS actuales del tab Plus
- Auditoría UX browser (local)
- Propuesta de lista compacta, cards, menús ⋮, modales
- Copy owner-friendly, responsive, theme, a11y
- Plan de implementación y QA para COMPACT-1
- Docs: este archivo + `CURRENT_PHASE.md` + `ORDEROPS_LIVING_MEMORY.md`

## Fuera de scope

- Implementar UI compacta / modales / menús
- Cambiar server actions, schema, RLS, migrations
- Cambiar lógica Product Customization / catálogo / checkout / cart / stock
- Compactar otros tabs (Por producto / Por categoría / Secciones)
- Deploy, writes productivos, pedidos QA
- Delete / remove hard de venta o ítem (no hay actions)

## Autorización

Fase docs-only / lectura. No requiere tokens LOCAL/DEPLOY de mutación. Browser audit local usado para evidencia UX.

## Precheck local

| Check | Resultado |
|-------|-----------|
| `git status --short` | Working tree con docs/tmp previos; sin bloqueo de lectura |
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |

## Auditoría de código actual

### Componente principal del tab

`OwnerCustomizationBuilder` (`tab === "plus"`):

- Renderiza `UpsellGroupsSection` dentro de `plusWorkspace`

### Archivo monolítico

| Archivo | Rol |
|---------|-----|
| `upsell-groups-section.tsx` | Tab completo: create form + cards densas + ítems + add form |
| `product-customization-admin.module.css` | `.sectionGrid`, `.groupCard`, `.optionCard`, `.fields`, `.plusWorkspace`, etc. |
| `owner-customization-builder.tsx` | Wiring del tab |

### Subcomponentes internos (mismo archivo)

| Función | Rol |
|---------|-----|
| `UpsellCreateForm` | Form crear venta (siempre visible a la izquierda) |
| `UpsellGroupCard` | Card densa: header + form edit + toggle + lista ítems + form agregar |
| `UpsellItemRow` | Card de ítem: precio + `sort_order` + Guardar orden + Desactivar |

### Formularios actuales (inline)

**Venta sugerida (create):**

- `name`, `description`
- `target_type` (categoría / producto) + `target_id`
- `sort_order` (en “Opciones avanzadas”)
- `is_available`

**Venta sugerida (edit):**

- `name`, `description`, `sort_order`, `is_available`
- `target_type` / `target_id` van **hidden** (destino no editable en update)

**Ítem sugerido (add):**

- `product_id`, `sort_order`, `is_available`

**Ítem sugerido (edit):**

- solo `sort_order` (+ toggle availability aparte)

### Server actions existentes (reutilizar en COMPACT-1)

| Action | Uso |
|--------|-----|
| `createUpsellGroupAction` | Nueva venta sugerida |
| `updateUpsellGroupAction` | Editar venta (nombre, descripción, sort, visibility; target fijo) |
| `toggleUpsellGroupAction` | Ocultar / mostrar venta |
| `addUpsellGroupItemAction` | Agregar producto sugerido |
| `updateUpsellGroupItemAction` | Actualizar `sort_order` del ítem |
| `toggleUpsellGroupItemAction` | Ocultar / mostrar ítem |

**Regla de negocio ya implementada:** máximo **1 venta sugerida por destino** (`target_type` + `target_id`). Create falla con mensaje owner-friendly si ya existe.

**No existen** actions de:

- delete / duplicate venta
- remove hard de ítem
- `reorderUpsellGroupsAction` / `reorderUpsellItemsAction` (a diferencia de Secciones)

### DnD / move

**No hay** `SortableReorderList` en Plus hoy. El orden se edita con inputs numéricos `Orden de aparición` + “Guardar orden”.

Para COMPACT-1 V1 (sin actions nuevas):

| Objetivo | Enfoque recomendado |
|----------|---------------------|
| Orden de ítems en modal | ↑↓ que calculen nuevos `sort_order` y llamen `updateUpsellGroupItemAction` (swap / reindex) |
| Orden entre ventas | ↑↓ opcional vía `updateUpsellGroupAction` con nuevo `sort_order`; o campo avanzado colapsado en modal |
| Drag-and-drop | **Fuera de V1** salvo que se reutilice chrome DnD sin inventar RPC (solo si el equipo lo prioriza) |

### CSS actual

- Comparte `.groupCard` / `.optionCard` / `.fieldsTwo` con assignments (no mass-delete en cleanup futuro)
- Layout create \| list vía `.sectionGrid` (≥900px dos columnas)
- `.plusWorkspace` ya aislado post CLEANUP-1 sections

### Qué ya funciona y no debe tocarse (semántica)

- Máximo 1 plus por destino (category/product)
- Soft-hide vía `is_available` (venta e ítem)
- Ítems = productos del catálogo (precio desde producto, no `price_delta` libre)
- No sugerir el mismo producto dos veces; no sugerir el producto target si `target_type === product`
- Public/read model + preview admin (otros tabs)
- Flag Product Customization

### Patrón modal existente a reutilizar

- Secciones: `reusable-sections/*` (`SectionEditModal`, `OptionsManagementModal`, `ActionsMenu`, `<dialog>` + module CSS)
- Products admin: `<dialog>` nativo en create/edit product

COMPACT-1 de Plus debería **reutilizar el patrón visual/a11y** de `reusable-sections` (no copiar lógica de customization groups).

## Auditoría UX actual

### Layout observado (piloto, 1 venta)

```txt
[ Nueva venta sugerida — form completo siempre abierto ]
[ Lista ]
  Bebidas
    Producto: Doble Smash
    form edit completo + Guardar venta sugerida
    Ocultar venta sugerida
    Productos para sugerir
      Coca Cola 500ml · $ 3.000 · Visible
      Orden de aparición + Guardar orden + Desactivar
    form Agregar sugerido (producto + orden + visible) siempre abierto
```

Accessibility tree (local 2026-07-18): con **una sola** venta aparecen ~4 textboxes/spinbuttons de create + ~3 de edit + spin de ítem + selects de agregar + botones Guardar/Ocultar/Desactivar/Agregar — lectura y edición mezcladas.

### Lectura para el owner

- Para “ver qué se sugiere en Doble Smash” hay que leer a través del create form y del form de edición.
- “Desactivar” (ítem) vs “Ocultar venta sugerida” (grupo) — vocabulario inconsistente (mismo problema que tenía Secciones).
- Destino (categoría/producto) se entiende bien en el summary, pero no destaca como chip primario.
- Precio del sugerido es el del producto de catálogo — correcto, pero no se explica que no se edita acá.

## Problemas detectados

1. **Create form permanente** compite con la lista (mismo anti-patrón pre-COMPACT de Secciones).
2. **Form edit siempre abierto** por cada venta.
3. **Form “Agregar sugerido” siempre abierto** aunque ya haya ítems.
4. **Orden numérico técnico** visible en lista (`Guardar orden`) en vez de ↑↓ / DnD.
5. **Vocabulario “Desactivar”** en ítems vs “Ocultar” en venta.
6. **Escalabilidad pobre** — N ventas × (form edit + M ítems × form orden + add form) ⇒ scroll inmanejable.
7. **Sensación panel técnico** pese a copy comercial ya mejorado en el header.
8. **Sin progressive disclosure** — no hay “Gestionar productos sugeridos” separado.
9. **Destino no editable** en update — correcto, pero COMPACT-1 debe mostrarlo read-only claro (no campos hidden confusos).
10. **Sin delete** — owner puede esperar “Quitar Coca”; hay que educar soft-hide.

## Principio de diseño V1

```txt
Pantalla principal = lectura + acciones rápidas.
Modal = edición detallada / gestión de productos sugeridos.
```

Evitar:

- form de create siempre abierto
- form de edit siempre abierto
- form de add ítem siempre abierto
- “Guardar orden” por cada fila en la lista principal
- mezclar lectura con edición

Alinear copy:

```txt
Preferir: Ocultar / Mostrar (venta e ítem)
Evitar: Desactivar / Activar
```

## Propuesta de pantalla principal compacta

### Estructura

```txt
Plus sugeridos
Ofrecé productos extra antes de agregar al carrito.
Cada producto o categoría puede tener una venta sugerida activa.

[ + Nueva venta sugerida ]

Tus ventas sugeridas
┌─────────────────────────────────────────────────────────────┐
│ Bebidas                                            [⋮]      │
│ Cuando compran: Producto · Doble Smash                      │
│ [Visible] [1 producto]                                      │
│ Sugiere: Coca Cola 500ml · $ 3.000                          │
└─────────────────────────────────────────────────────────────┘
```

### Empty state

```txt
Todavía no estás sugiriendo productos extra
Creá una venta sugerida para una categoría o producto y sumá ítems.
[ + Nueva venta sugerida ]
```

### Layout

- Una columna full-width (abandonar split create \| list siempre visible).
- CTA `+ Nueva venta sugerida` en header de lista.
- Cards apiladas; gap compacto (mismo ritmo que Secciones).

### Orden entre ventas en lista principal

- V1 opcional: ↑↓ si hay ≥2 ventas (vía `updateUpsellGroupAction`).
- Si 1 sola venta (piloto actual): no mostrar chrome de reorder.

## Card compacta de venta sugerida

### Contenido obligatorio

| Elemento | Fuente |
|----------|--------|
| Nombre | `group.name` |
| Descripción corta (1 línea, truncate) | `group.description` |
| Chip destino | `Categoría` / `Producto` + `target_name` |
| Chip Visible / Oculta | `is_available` |
| Chip N productos | `items.length` |
| Preview ítems | primeras 2–3: `product_name` + precio formateado |
| Indicador ocultos | count `!item.is_available` → “· 1 oculto” |
| Menú ⋮ | acciones |

### Interacciones

- Sin inputs en la card.
- Reorder ↑↓ solo si se implementa chrome de lista (opcional V1).
- Click cuerpo: preferir no-op; acciones vía ⋮ (igual que Secciones).

### Ejemplo piloto

```txt
Bebidas
Sumá una bebida a tu burguer
[Producto · Doble Smash] [Visible] [1 producto]
Sugiere: Coca Cola 500ml · $ 3.000
```

## Menú de acciones de venta

Menú ⋮ (`aria-haspopup="menu"`, Escape/Arrow) — reutilizar patrón `ActionsMenu` de `reusable-sections`.

### V1 obligatorio (solo actions existentes)

| Ítem | Comportamiento |
|------|----------------|
| Editar venta | Abre modal Editar venta sugerida |
| Gestionar productos | Abre modal Gestionar productos sugeridos |
| Ocultar venta / Mostrar venta | `toggleUpsellGroupAction` |

### Fuera de V1

| Ítem | Motivo |
|------|--------|
| Eliminar venta | No hay action |
| Duplicar venta | No hay action |
| Cambiar destino | Update no permite retarget; create nuevo + soft-hide viejo = flujo avanzado |

## Modal Crear / Editar venta sugerida

### Shell

- Modal centrado (`role="dialog"` `aria-modal="true"`)
- Overlay click + Escape → cerrar **sin guardar**
- Footer: Cancelar · Guardar / Crear venta sugerida
- Reutilizar look de `SectionEditModal`

### Create — campos

| Campo UI | Form field |
|----------|------------|
| Nombre | `name` |
| Descripción | `description` |
| Cuando el cliente compre | `target_type` |
| De (categoría o producto) | `target_id` |
| Visible para el cliente | `is_available` |
| Orden de aparición | avanzado colapsado (`sort_order`) |

Helper bajo destino:

```txt
Solo puede haber una venta sugerida por categoría o producto.
Si ya existe una, editá o mostrá/ocultá la existente.
```

### Edit — campos

| Campo UI | Form field |
|----------|------------|
| Nombre | `name` |
| Descripción | `description` |
| Destino (read-only) | mostrar `target_type` + `target_name`; enviar hidden `target_type`/`target_id` |
| Visible para el cliente | `is_available` |
| Orden de aparición | avanzado colapsado |

**No** permitir cambiar destino en el modal de edición.

### Feedback

- Pending: “Guardando…”
- Error create por destino duplicado: mostrar mensaje action existente en el modal
- Success: cerrar + `router.refresh()`

## Modal Gestionar productos sugeridos

Preferencia V1: **modal centrado grande** (mismo rol que OptionsManagementModal).

```txt
Título: Productos de {ventaName}
Subtítulo: Estos productos se ofrecen cuando el cliente compra {destino}.

Lista compacta:
Coca Cola 500ml     $ 3.000     Visible    [↑][↓][⋮]
…

[+ Agregar producto]
[Cerrar]
```

### Row compacta de ítem

| Elemento | Fuente |
|----------|--------|
| Nombre producto | `item.product_name` |
| Precio | `formatCustomizationPriceDelta(item.product_price)` |
| Chip Visible / Oculto | `item.is_available` |
| ↑↓ | reindex `sort_order` vía `updateUpsellGroupItemAction` |
| ⋮ | Editar orden (opcional) / Ocultar / Mostrar |

### Menú ⋮ ítem (V1)

| Ítem | Action |
|------|--------|
| Ocultar producto / Mostrar producto | `toggleUpsellGroupItemAction` |

Fuera de V1: Quitar del listado (no hay remove), editar precio (precio es del catálogo Productos).

### Modal / sheet Agregar producto

Puede ser:

- **A)** segundo modal apilado (como OptionEditModal sobre Options), o  
- **B)** panel expandible dentro del modal de gestión  

Campos: `product_id` (select filtrado), `is_available`, `sort_order` default auto (`max+10`).

Filtros del select (ya en código):

- excluir productos ya en la venta
- si target es producto, excluir el propio `target_id`

Microcopy:

```txt
El precio lo define el producto en Catálogo. Acá solo elegís qué sugerir.
```

## Estados

| Estado | UI |
|--------|----|
| Empty ventas | empty state + CTA |
| Venta sin ítems | card + chip “0 productos” + ⋮ Gestionar productos |
| Ítem oculto | row atenuada + chip Oculto |
| Venta oculta | chip Oculta en card |
| Destino ya tiene venta | error en modal create (mensaje action) |
| Guardando | disable footer / ↑↓ |
| Error | alert en modal |

## Copy owner-friendly

### Preferir

```txt
Plus sugeridos
Tus ventas sugeridas
Nueva venta sugerida
Cuando el cliente compre
Productos para sugerir / Gestionar productos
Visible para el cliente
Ocultar venta / Mostrar venta
Ocultar producto / Mostrar producto
```

### Evitar en UI

```txt
upsell_group · target_type · sort_order (como label principal)
Desactivar / Activar (ítem)
Grupo de plus (preferir venta sugerida)
máximo 1 grupo por target (usar copy comercial ya existente)
```

## Responsive

### Desktop (≥900px)

- Lista full width
- Modal editar ~480–560px
- Modal gestionar ~640–720px

### Mobile

- Cards apiladas
- Preview ítems: 1–2 + “+N”
- Modales casi full-bleed + footer sticky

## Theme / tokens

Igual que Secciones compact:

- Module CSS colindante (`plus-suggestions.module.css` o reutilizar piezas de `reusable-sections.module.css` si se extrae shared)
- Tokens: `--bg-surface`, `--text-*`, `--border-subtle`, `--accent-primary`, `chipDanger`
- Prohibido hardcode light/dark-breaking

## Accesibilidad

- ⋮: `aria-label="Acciones de {nombre}"`
- Modales: `role="dialog"`, `aria-labelledby`, Escape cierra sin guardar
- Destino read-only anunciado como texto, no input disabled confuso sin explicación
- Visible/Oculta: texto + chip
- Pending: controles disabled

## Arquitectura de implementación futura

Componentes sugeridos (co-localizados):

```txt
components/admin/product-customization/plus-suggestions/
  PlusSuggestionsTab.tsx          # reemplaza UpsellGroupsSection en builder
  PlusSuggestionCard.tsx          # card compacta
  PlusSuggestionEditModal.tsx     # create + edit venta
  SuggestedProductsModal.tsx      # lista ítems + reorder ↑↓
  SuggestedProductRow.tsx         # row compacta
  AddSuggestedProductModal.tsx    # agregar producto (o panel interno)
```

Reutilizar de Secciones donde sea seguro:

- Patrón `ActionsMenu` / modal shell / CSS dialog
- **No** acoplar a `createCustomizationGroupAction` ni shapes de options

Wiring:

```txt
owner-customization-builder.tsx
  tab === "plus" → <PlusSuggestionsTab … />
```

Legacy:

```txt
upsell-groups-section.tsx → queda sin uso tras COMPACT-1 → CLEANUP-1
```

**Server actions: reutilizar las listadas. No crear actions nuevas en V1.**  
↑↓ de ítems = composición de `updateUpsellGroupItemAction` (sin RPC reorder).

## Plan de implementación recomendado

```txt
1. Extraer/adaptar shell modal + ActionsMenu del patrón reusable-sections.
2. PlusSuggestionCard (read-only + chips + preview).
3. PlusSuggestionEditModal (create/update) con actions existentes.
4. SuggestedProductsModal + SuggestedProductRow + ↑↓ sort via update item.
5. AddSuggestedProductModal + toggle hide/show ítem.
6. PlusSuggestionsTab + wiring en owner-customization-builder.
7. Retirar formularios inline del tab (dejar archivo legacy para CLEANUP).
8. Validar dark/light + mobile.
9. Smoke: preview admin Doble Smash + catálogo público Plus Coca.
10. No tocar checkout/cart/stock/DB.
```

## Plan de QA siguiente

Para `PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-COMPACT-1`:

```txt
- Tab carga con cards compactas
- + Nueva venta abre modal
- Create OK / error destino duplicado
- Editar venta (nombre/descripcion/visible)
- Destino read-only en edit
- Ocultar / mostrar venta
- Gestionar productos abre modal
- Agregar producto sugerido
- Ocultar / mostrar producto sugerido
- Reordenar ítems ↑↓ (si V1 lo incluye)
- Escape/Cancelar no persiste
- Otros tabs (producto/categoría/secciones) OK
- Preview admin Doble Smash muestra Plus
- Catálogo público Doble Smash: Sumá una bebida / Coca (sin confirmar pedido)
- Dark / light + mobile
- tsc / build PASS
```

No crear pedidos QA para esta fase visual/admin.

## Compatibilidad con Secciones compact

| Concepto Secciones | Analogía Plus |
|--------------------|---------------|
| Sección | Venta sugerida |
| Opción (texto + price_delta) | Producto de catálogo sugerido |
| Gestionar opciones | Gestionar productos |
| selection_type / min / max | N/A (plus es checklist de productos) |
| SortableReorderList nativo | ↑↓ vía update item (V1) |
| Delete | Soft-hide en ambos |

## Riesgos / deuda

| Riesgo | Mitigación |
|--------|------------|
| Owner espera quitar ítem | Soft-hide + copy; no inventar delete |
| Owner espera cambiar destino | Copy read-only; documentar flujo “nueva venta + ocultar vieja” fuera de V1 |
| Sin reorder RPC | ↑↓ con updates secuenciales; documentar race menor |
| CSS compartido `.groupCard` | COMPACT-1 usa module propio; cleanup no mass-delete shared |
| Nested dialogs (add sobre manage) | OK en Chromium; mismo patrón Secciones |
| Regresión pública Plus | Smoke obligatorio Doble Smash / Coca |

## Qué NO se tocó

Runtime UI · actions · DB/RLS · checkout/cart · stock · catálogo público · deploy

## Validaciones CLI

`tsc PASS` · `build PASS` (baseline; sin cambios de código)

## Browser QA (auditoría)

Local `/admin/products/customizations` → Plus sugeridos:

- Create form siempre abierto: confirmado
- Venta Bebidas + form edit + Coca + Guardar orden + Desactivar + Agregar sugerido: confirmado
- Sin cards compactas / sin modales: confirmado

## Resultado final

**PASS**

Spec lista para `PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-COMPACT-1`.

## Próxima fase recomendada

```txt
PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-COMPACT-1 — Compact Plus Suggestions UI
```

Implementar cards + modales + menús según este documento, reutilizando server actions existentes y el patrón visual de Secciones reutilizables.
