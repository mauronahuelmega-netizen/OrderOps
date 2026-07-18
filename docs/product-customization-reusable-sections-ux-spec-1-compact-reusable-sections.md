# PRODUCT-CUSTOMIZATION-REUSABLE-SECTIONS-UX-SPEC-1 — Reusable Sections Compact UX Specification

## Objetivo

Diseñar una UX compacta para la pestaña **Secciones reutilizables** de `/admin/products/customizations`, de modo que la pantalla principal sirva para **leer, ordenar y entender**, y la edición detallada ocurra en **modales centrados**.

Esta fase es **solo especificación**. La implementación queda para:

```txt
PRODUCT-CUSTOMIZATION-REUSABLE-SECTIONS-COMPACT-1
```

## Contexto

| Hecho | Estado |
|-------|--------|
| Layout/theme admin customizations | Cerrado (visual + buttons polish) |
| Preview interactiva + overrides mapper | Cerrado (overrides con DATA QA DEBT) |
| Tab Secciones reutilizables | Funcional, densa, scroll pesado |
| Usuario objetivo | Dueño/encargado gastronómico (no técnico) |

Auditoría visual local (2026-07-18): tab con Papas / Salsas / Agregados extra — cada sección muestra formulario completo + cada opción con formulario completo + formularios “Nueva opción” siempre abiertos. Accessibility tree: decenas de textboxes/spinbuttons y muchos botones “Guardar sección” / “Guardar opción” / “Desactivar” visibles a la vez.

## Alcance

- Auditoría de componentes, actions y CSS actuales
- Auditoría UX browser (local)
- Propuesta de lista compacta, cards, menús ⋮, modales
- Copy owner-friendly, responsive, theme, a11y
- Plan de implementación y QA para COMPACT-1
- Docs: este archivo + `CURRENT_PHASE.md` + `ORDEROPS_LIVING_MEMORY.md`

## Fuera de scope

- Implementar UI compacta / modales / menús
- Cambiar server actions, schema, RLS, migrations
- Cambiar lógica Product Customization / catálogo / checkout / cart / stock
- Deploy, writes, pedidos QA, datos productivos

## Precheck local

| Check | Resultado |
|-------|-----------|
| `git status --short` | Working tree con docs/tmp previos; sin bloqueo de lectura |
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |

## Auditoría de código actual

### Componente principal del tab

`OwnerCustomizationBuilder` (`tab === "sections"`):

- Header “Secciones reutilizables”
- Layout `sectionsLayout`:
  - izquierda: `CreateCustomizationGroupForm` (siempre visible)
  - derecha: “Tus secciones” → `SortableGroupsList` o empty state

### Componentes hijos

| Archivo | Rol |
|---------|-----|
| `create-group-form.tsx` | Form crear sección (inline, siempre abierto) |
| `sortable-groups-list.tsx` | Lista DnD de secciones → wrappea cada `CustomizationGroupCard` |
| `customization-group-card.tsx` | Card densa: header + form edit sección + lista opciones + form crear opción |
| `sortable-reorder-list.tsx` | DnD genérico + ↑↓ + persist |
| `product-customization-admin.module.css` | Styles: `.sectionsLayout`, `.groupCard`, `.optionCard`, `.sortableCardShell`, chips |

### Formularios actuales (inline)

**Sección (create + edit):** nombre, descripción, `selection_type`, `sort_order`, min, max (si múltiple), `is_required`, `is_available`.

**Opción (create + edit):** nombre, `price_delta`, descripción, `sort_order`, `is_available`.

### Server actions existentes (reutilizar en COMPACT-1)

| Action | Uso |
|--------|-----|
| `createCustomizationGroupAction` | Nueva sección |
| `updateCustomizationGroupAction` | Editar sección |
| `toggleCustomizationGroupAvailabilityAction` | Ocultar / mostrar sección |
| `createCustomizationOptionAction` | Nueva opción |
| `updateCustomizationOptionAction` | Editar opción |
| `toggleCustomizationOptionAvailabilityAction` | Ocultar / mostrar opción |
| `reorderCustomizationGroupsAction` | Orden secciones |
| `reorderCustomizationOptionsAction` | Orden opciones |

**No existen** actions de delete/duplicate sección u opción → **fuera de V1 compact** (no inventar backend).

### DnD / move

Ya existe y debe preservarse:

- Drag handle (`Arrastrar para ordenar: {name}`)
- Botones Subir / Bajar
- Persist vía `reorderCustomizationGroupsAction` / `reorderCustomizationOptionsAction`
- Helper `moveItemInOrderedIds`

### CSS actual

- Module CSS del builder (tokens surface/text/accent)
- `.builderShell` overrides de primary buttons (button theme polish)
- Layout sections: 2 columnas ≥900px (`minmax(280px,360px) + 1fr`); apilado en mobile

### Qué ya funciona y no debe tocarse (semántica)

- Validación/parsing de inputs (`parseCustomizationGroupInput` / option)
- Soft hide vía `is_available` (no hard delete)
- Reorder por `sort_order`
- Relación group → options
- Flag Product Customization / public read model / preview admin (otros tabs)

### Patrón modal existente en admin

No hay design-system Dialog compartido. Referencia usable: `<dialog>` nativo en forms de productos (`create-product-form` / `edit-product-form`). COMPACT-1 debería reutilizar ese patrón o un modal module CSS local al builder, con tokens semánticos.

## Auditoría UX actual

### Layout observado

```txt
[ Nueva sección — form completo siempre abierto ]
[ Tus secciones ]
  [drag ↑↓] Papas
    chips resumen
    form edit sección completo + Guardar sección
    Opciones:
      cada opción: drag ↑↓ + Desactivar + form completo + Guardar opción
    Nueva opción: form completo + Crear opción
  … Salsas (igual) …
  … Agregados extra (igual) …
```

### Lectura para el owner

- Para “ver Papas” hay que saltar formularios.
- Para “cambiar precio de Cheddar” hay que scrollear entre muchos campos idénticos.
- Single/multi/min/max aparecen como inputs técnicos sin explicación contextual fuerte.
- “Desactivar” (opción) vs “Ocultar sección” (grupo) — vocabulario inconsistente.

## Problemas detectados

1. **Scroll excesivo** — 3 secciones piloto generan ~15+ formularios visibles.
2. **Formularios inline siempre abiertos** (sección + cada opción + create forms).
3. **Botones repetidos** — N× “Guardar sección”, N× “Guardar opción”, N× “Desactivar”.
4. **Jerarquía confusa** — lectura y edición mezcladas; no hay progressive disclosure.
5. **Estados Visible/Oculto poco resumidos** en lista (chip “Desactivado” solo si oculto; no chip “Visible” explícito).
6. **Single/multi/min/max** poco explicados al owner (labels cortos sin helper text).
7. **Create form permanente** a la izquierda compite con la lista (en desktop); en mobile empuja la lista hacia abajo.
8. **Acciones peligrosas/ambiguas** — “Desactivar” opción es soft-hide pero suena fuerte; no hay confirmación.
9. **Responsive** — cards apilan; densidad empeora en mobile.
10. **Sensación panel técnico** — muchos `Orden de aparición` numéricos visibles aunque el DnD ya ordena.

## Principio de diseño V1

```txt
Pantalla principal = lectura + orden + acciones rápidas.
Modal = edición detallada.
```

Evitar:

- form de sección siempre abierto
- form de opción siempre abierto
- sección + opciones + config en una sola columna larga
- repetir Guardar por cada card expandida
- mezclar lectura con edición

## Propuesta de pantalla principal compacta

### Estructura

```txt
Secciones reutilizables
Creá secciones de opciones que podés reutilizar en productos o categorías.

[ + Nueva sección ]

Tus secciones
┌─────────────────────────────────────────────────────────────┐
│ ☰  Papas                                         [↑] [↓] [⋮]│
│    Elegí el tamaño de papas…                                │
│    [Única] [Requerida] [Min 1] [Max 1] [3 opciones] [Visible]│
│    Opciones: Papas chicas · Papas medianas +$950 · …        │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ ☰  Salsas                                        [↑] [↓] [⋮]│
│    Sumá tus salsas favoritas.                               │
│    [Múltiple] [Opcional] [Min 0] [Max 5] [5 opciones] [Visible]│
│    Opciones: Mayonesa · Ketchup · Mostaza · BBQ +$250 · …  │
└─────────────────────────────────────────────────────────────┘
```

### Empty state

```txt
Todavía no hay secciones
Creá la primera (por ejemplo “Tamaño de papas” o “Aderezos”).
[ + Nueva sección ]
```

### Layout desktop

- Una columna principal full-width (abandonar split “create form | list” siempre visible).
- CTA `+ Nueva sección` en header de lista (abre modal).
- Cards apiladas con gap compacto.

### Layout mobile

- Misma estructura; chips wrap; preview de opciones truncada a 2–3 ítems + “+N más”.

## Card compacta de sección

### Contenido obligatorio

| Elemento | Fuente de datos |
|----------|-----------------|
| Nombre | `group.name` |
| Descripción corta (1 línea, truncate) | `group.description` |
| Chip Única / Múltiple | `selection_type` |
| Chip Requerida / Opcional | `is_required` |
| Chip Min X | `min_selections` |
| Chip Max Y o “Sin máx.” | `max_selections` |
| Chip N opciones | `options.length` |
| Chip Visible / Oculta | `is_available` (+ estilo danger si oculta) |
| Preview opciones | primeras 3–4: `name` + precio (“Incluido” o `+$X`) |
| Indicador opciones ocultas | count `!is_available` → “· 1 oculta” |
| Drag handle + ↑ + ↓ | `SortableReorderList` chrome |
| Menú ⋮ | acciones |

### Interacciones de card

- Click en cuerpo (opcional V1): abrir “Gestionar opciones” **o** no-op (preferir solo ⋮ para evitar clicks accidentales).
- Reorder sin abrir modal.
- No mostrar inputs en la card.

### Ejemplo

```txt
Papas
Elegí el tamaño de papas para acompañar tu pedido.
[Única] [Requerida] [Min 1] [Max 1] [3 opciones] [Visible]
Opciones: Papas chicas · Papas medianas +$950 · Papas grandes +$1.500
```

## Menú de acciones de sección

Menú ⋮ (`aria-haspopup="menu"`, teclado Escape/Arrow).

### V1 obligatorio (solo actions existentes)

| Ítem | Comportamiento |
|------|----------------|
| Editar sección | Abre modal Editar sección |
| Gestionar opciones | Abre modal Gestionar opciones |
| Ocultar sección / Mostrar sección | `toggleCustomizationGroupAvailabilityAction` (confirmación ligera opcional) |

### Fuera de V1

| Ítem | Motivo |
|------|--------|
| Eliminar sección | No hay action |
| Duplicar sección | No hay action |

## Modal Editar sección

### Shell

- Modal centrado (`role="dialog"` `aria-modal="true"`)
- Overlay click + Escape → cerrar **sin guardar**
- Focus trap (mismo nivel que otros dialogs admin si se implementa)
- Footer sticky en mobile: Cancelar · Guardar sección

### Campos (mapear a `updateCustomizationGroupAction` / create)

| Campo UI | Form field |
|----------|------------|
| Nombre | `name` |
| Descripción | `description` |
| Tipo de selección: Única / Múltiple | `selection_type` |
| Mínimo | `min_selections` |
| Máximo (si múltiple; hidden 1 si única) | `max_selections` |
| Sección requerida | `is_required` |
| Visible para el cliente | `is_available` |
| Orden de aparición | **Ocultar del modal V1** si el reorder de lista es suficiente; si se mantiene, campo avanzado colapsado |

### Microcopy

```txt
Única — El cliente elige una sola opción.
Múltiple — El cliente puede elegir varias opciones.
Requerida — El cliente debe completar esta sección antes de agregar el producto.
Visible — La sección aparece en el catálogo público.
```

### Feedback

- Pending: botón “Guardando…”
- Error: `admin-feedback--error` en modal
- Success: cerrar modal + `router.refresh()` (patrón actual)

## Modal Gestionar opciones

Preferencia V1: **modal centrado grande** (no drawer).

```txt
Título: Opciones de {sectionName}
Subtítulo: Estas son las opciones que verá el cliente dentro de esta sección.

Lista compacta (DnD):
☰ Papas chicas     Incluido    Visible    [↑][↓][⋮]
☰ Papas medianas   +$950       Visible    [↑][↓][⋮]
…

[+ Agregar opción]
```

- Empty: “Esta sección todavía no tiene opciones.” + CTA Agregar.
- Reorder: `reorderCustomizationOptionsAction` (mismo chrome que hoy).
- Cerrar: X / Cancelar / Escape (sin side effects).

## Row compacta de opción

| Columna | Contenido |
|---------|-----------|
| Handle | drag |
| Nombre | `option.name` |
| Precio | “Incluido” si 0; si no `+$X` (`formatCustomizationPriceDelta`) |
| Estado | Visible / Oculta (texto + chip, no solo color) |
| Orden | ↑ ↓ |
| Acciones | ⋮ |

Sin inputs inline.

## Menú de acciones de opción

| Ítem V1 | Action |
|---------|--------|
| Editar opción | Abre modal Editar opción |
| Ocultar / Mostrar opción | `toggleCustomizationOptionAvailabilityAction` |
| Subir / Bajar | Opcional en menú; preferir botones visibles en row |

Fuera V1: Eliminar opción (no action).

## Modal Editar opción

| Campo UI | Form field |
|----------|------------|
| Nombre | `name` |
| Descripción | `description` |
| Precio adicional | `price_delta` |
| Visible para el cliente | `is_available` |
| Orden de aparición | avanzado colapsado opcional |

Microcopy:

```txt
Precio adicional — Usá 0 si esta opción está incluida en el precio base.
Oculta — El cliente no verá esta opción en el catálogo.
```

Footer: Cancelar · Guardar opción → `updateCustomizationOptionAction`.

## Nueva sección / nueva opción

### Nueva sección

- CTA principal `+ Nueva sección` en header de lista.
- Modal “Crear sección” (mismos campos que Editar; submit `createCustomizationGroupAction`).
- Tras éxito: cerrar, refresh, opcional abrir “Gestionar opciones” de la nueva sección.

### Nueva opción

- Desde Gestionar opciones: `+ Agregar opción`.
- Modal “Crear opción” → `createCustomizationOptionAction` con `group_id`.
- `sort_order` default vía `suggestNextOptionSortOrder` (hidden o avanzado).

## Ordenamiento

| Entidad | Dónde | Action |
|---------|-------|--------|
| Secciones | Lista compacta | `reorderCustomizationGroupsAction` |
| Opciones | Modal Gestionar opciones | `reorderCustomizationOptionsAction` |

Reglas:

- Mantener drag + ↑↓ fallback
- No cambiar semántica de `sort_order`
- No mostrar formularios solo para reordenar
- Feedback success/error existente del `SortableReorderList`

## Estados visuales

| Estado | Tratamiento UI |
|--------|----------------|
| Sección visible | chip Neutral/Accent “Visible” |
| Sección oculta | chip danger “Oculta” + card opacity suave |
| Requerida / Opcional | chips |
| Única / Múltiple | chips |
| Opción incluida ($0) | texto “Incluido” |
| Opción con precio | `+$X` |
| Opción oculta | chip “Oculta” + atenuar row |
| Sin opciones | empty en card + CTA Gestionar opciones |
| Muchas opciones | preview truncate + “+N más” |
| Guardando | disabled footer buttons |
| Error al guardar | alert en modal |
| Empty lista secciones | empty state + CTA Nueva sección |

## Copy owner-friendly

### Preferir

```txt
Tus secciones
Opciones que verá el cliente
Visible para el cliente
Requerido para comprar
Precio adicional
Incluido
Oculta
Gestionar opciones
Nueva sección
```

### Evitar en UI

```txt
selection_type · sort_order · is_available · customization_group · override · upsell
Desactivar (preferir Ocultar / Mostrar)
```

Unificar vocabulario:

- Sección: Ocultar / Mostrar  
- Opción: Ocultar / Mostrar (reemplazar “Desactivar” / “Activar”)

## Responsive

### Desktop (≥900px)

- Lista full width
- Cards una columna
- Modales centrados ~480–640px (editar) / ~720px (gestionar opciones)
- Menú ⋮ al hover/focus

### Tablet / mobile

- Cards apiladas
- Chips wrap
- Preview opciones: 2 ítems + “+N”
- Modales casi full-bleed con padding
- Footer sticky en modal
- Drag handle con target táctil ≥40px

## Theme / tokens

Usar tokens de `theme-tokens.css` + surfaces del module admin:

| Uso | Token |
|-----|-------|
| Card | `--surface-base-*` / `--bg-surface` |
| Modal elevated | `--surface-elevated-*` |
| Texto | `--text-primary/secondary/tertiary` |
| Bordes | `--border-subtle` |
| CTA | `--accent-primary` (scoped builder) |
| Oculta / danger chip | patrón `chipDanger` existente |

Prohibido: blanco/negro/gris hardcoded que rompa dark/light.

## Accesibilidad

- ⋮: `aria-label="Acciones de {nombre}"`, menú teclado
- Modales: `role="dialog"`, `aria-labelledby`, focus inicial en primer campo o título
- Escape / Cancelar cierra sin guardar
- Labels asociados a inputs
- Disabled claros en pending
- Visible/Oculta: texto + chip (no solo color)
- Drag handles ya tienen aria-label — mantener
- No atrapar focus fuera del modal mientras abierto

## Arquitectura de implementación futura

Componentes sugeridos (co-localizados bajo `components/admin/product-customization/`):

```txt
ReusableSectionsTab              # reemplaza bloque tab sections del builder
ReusableSectionCard              # card compacta
SectionActionsMenu               # ⋮ sección
SectionEditModal                 # create + edit sección
OptionsManagementModal           # lista opciones + reorder
ReusableOptionRow                # row compacta
OptionActionsMenu                # ⋮ opción
OptionEditModal                  # create + edit opción
```

Helpers/UI:

- Reutilizar `SortableReorderList`
- Modal: `<dialog>` nativo o wrapper local `.module.css`
- Menú: details/summary o popover ligero (sin nueva lib si no existe)

**Server actions: reutilizar las listadas. No crear actions nuevas en V1.**

## Plan de implementación recomendado

```txt
1. Auditar CustomizationGroupCard y separar presentación vs form state.
2. Crear ReusableSectionCard (read-only + chips + preview + reorder chrome).
3. SectionEditModal (create/update) con actions existentes.
4. OptionsManagementModal + ReusableOptionRow + reorder opciones.
5. OptionEditModal (create/update) + toggles hide/show.
6. SectionActionsMenu / OptionActionsMenu.
7. Reemplazar CreateCustomizationGroupForm inline + SortableGroupsList denso.
8. Retirar formularios inline largos del tab (mantener archivos legacy solo si hacen falta temporalmente).
9. Validar dark/light + mobile.
10. Smoke: no regresión pública / preview admin.
```

## Plan de QA siguiente

Para `PRODUCT-CUSTOMIZATION-REUSABLE-SECTIONS-COMPACT-1`:

```txt
- Crear sección (modal)
- Editar sección
- Ocultar / mostrar sección
- Reordenar sección ↑↓ y drag
- Abrir Gestionar opciones
- Crear opción
- Editar opción
- Ocultar / mostrar opción
- Reordenar opción
- Escape/Cancelar no persiste cambios de form
- Catálogo público no se rompe (Doble Smash smoke)
- Preview admin refleja cambios tras refresh
- Dark / light
- Mobile viewport
- tsc / build PASS
```

No crear pedidos QA para esta fase visual/admin.

## Riesgos / deuda

| Riesgo | Mitigación |
|--------|------------|
| No hay Dialog system compartido | Usar `<dialog>` como products admin |
| Menú ⋮ sin componente existente | Implementar mínimo accesible local |
| Owner espera “Eliminar” | Documentar soft-hide; no inventar delete |
| Regresión DnD al mover chrome | Reutilizar `SortableReorderList` sin cambiar persist |
| Create form lateral era discoverable | CTA `+ Nueva sección` prominente + empty state |

## Qué NO se tocó

Runtime UI · actions · DB/RLS · checkout/cart · stock · catálogo público · deploy

## Validaciones CLI

`tsc PASS` · `build PASS` (baseline; sin cambios de código)

## Resultado final

**PASS**

Spec lista para `PRODUCT-CUSTOMIZATION-REUSABLE-SECTIONS-COMPACT-1`.

## Próxima fase recomendada

```txt
PRODUCT-CUSTOMIZATION-REUSABLE-SECTIONS-COMPACT-1 — Compact Reusable Sections UI
```

Implementar cards + modales + menús según este documento, reutilizando server actions existentes.
