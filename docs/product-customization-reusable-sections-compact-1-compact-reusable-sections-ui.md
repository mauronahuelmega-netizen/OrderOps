# PRODUCT-CUSTOMIZATION-REUSABLE-SECTIONS-COMPACT-1 — Compact Reusable Sections UI

## Objetivo

Compactar la pestaña **Secciones reutilizables** con cards de lectura, menú ⋮ y modales de edición, eliminando formularios inline extensos.

## Contexto

Spec: `PRODUCT-CUSTOMIZATION-REUSABLE-SECTIONS-UX-SPEC-1` — PASS.  
Actions create/update/toggle/reorder de groups/options ya existían; no hay delete/duplicate.

## Alcance

- UI compacta del tab Secciones reutilizables
- Modales create/edit sección y opción
- Modal gestionar opciones + reorder
- CSS module local
- Docs / CURRENT_PHASE / LIVING_MEMORY / deploy

## Fuera de scope

DB/schema/RLS/migrations · nuevas actions · delete/duplicate · catálogo/checkout/cart/stock · cambios de modelo

## Autorización

```txt
AUTORIZO_PRODUCT_CUSTOMIZATION_REUSABLE_SECTIONS_COMPACT_LOCAL=yes
AUTORIZO_PRODUCT_CUSTOMIZATION_REUSABLE_SECTIONS_COMPACT_BROWSER_QA=yes
AUTORIZO_DEPLOY_PRODUCT_CUSTOMIZATION_REUSABLE_SECTIONS_COMPACT_TO_VERCEL=yes
```

## Precheck local

`tsc PASS` · `build PASS`

## Auditoría inicial

| Antes | Después |
|-------|---------|
| `CreateCustomizationGroupForm` inline | Modal Crear sección |
| `CustomizationGroupCard` form denso | `ReusableSectionCard` |
| Option forms inline | `OptionsManagementModal` + `OptionEditModal` |
| `SortableGroupsList` + dense cards | `ReusableSectionsTab` + `SortableReorderList` |

Legacy files (`create-group-form.tsx`, `customization-group-card.tsx`, `sortable-groups-list.tsx`) quedan en repo sin uso del tab (cleanup opcional futuro).

## Arquitectura implementada

```txt
components/admin/product-customization/reusable-sections/
  reusable-sections-tab.tsx
  reusable-section-card.tsx
  actions-menu.tsx
  section-edit-modal.tsx
  options-management-modal.tsx
  reusable-option-row.tsx
  option-edit-modal.tsx
  reusable-sections.module.css
```

Wired en `owner-customization-builder.tsx` (`tab === "sections"`).

## Pantalla principal compacta

- Header + CTA `+ Nueva sección`
- Lista “Tus secciones” con cards
- 0 textboxes en vista principal (verificado browser)

## Card compacta de sección

Nombre, descripción, chips (Única/Múltiple, Requerida/Opcional, Min, Máx, N opciones, Visible/Oculta), preview opciones, drag/↑↓, menú ⋮.

## Menú de sección

Editar sección · Gestionar opciones · Ocultar/Mostrar sección

## Modal Crear / Editar sección

`<dialog>` + `createCustomizationGroupAction` / `updateCustomizationGroupAction`

## Modal Gestionar opciones

Lista compacta + reorder + `+ Agregar opción`

## Row compacta de opción

Nombre · Incluido/+$ · Visible/Oculta · drag/↑↓ · ⋮

## Menú de opción

Editar opción · Ocultar/Mostrar opción

## Modal Crear / Editar opción

`createCustomizationOptionAction` / `updateCustomizationOptionAction`

## Reordenamiento

`SortableReorderList` + `reorderCustomizationGroupsAction` / `reorderCustomizationOptionsAction`  
↑↓ y drag verificados en smoke admin.

## Estados pending/error

Botones “Guardando…” · feedback error en modal · toggle pending en menú

## Theme / tokens

Surfaces/text/border/accent/chipDanger vía tokens; primary buttons del builder shell.

## Responsive

Cards full width · chips wrap · modales `min(100%-24px, …)` · option row apila side en mobile

## Accesibilidad

`dialog` · summary aria-label · Escape cierra dialog · Cancelar sin guardar · chips texto Visible/Oculta

## Validación local admin

| Check | Resultado |
|-------|-----------|
| Cards compactas Papas/Salsas/Agregados | OK |
| Sin Guardar sección/opción inline | OK (0 textboxes) |
| Crear sección modal | OK |
| Editar sección modal (Papas) | OK |
| Gestionar opciones (Papas) | OK |
| Reorder ↑↓ | OK (smoke) |
| Dark/light | tokens (no regresó a ink blanco) |

## Validación no regresión

| Check | Resultado |
|-------|-----------|
| Catálogo público carga | OK |
| Modal Doble Smash Papas/Salsas/Agregados/Plus Coca | OK |
| Sin confirmar pedido | OK |

## No side effects

Sin migrations/schema/RLS · sin cart/checkout/stock · sin flags · solo actions admin existentes

## Deploy

| Campo | Valor |
|-------|-------|
| Commit | `a124459` |
| Mensaje | Compact reusable Product Customization sections |
| Remote | `origin/main` |
| URL | https://orderops.vercel.app |

## Browser QA

Local admin + público: PASS

## Compatibilidad

Otros tabs del builder sin cambios de wiring salvo import del tab sections. Preview admin intacta.

## Qué NO se tocó

DB · RLS · create_order · checkout · cart · stock · public modal logic · delete/duplicate

## Validaciones CLI

`tsc PASS` · `build PASS`

## Riesgos / deuda

| Deuda | Notas |
|-------|-------|
| Legacy unused components | `create-group-form` / `customization-group-card` / `sortable-groups-list` |
| Nested dialog stacking | Option modal sobre Options modal — OK en Chromium |
| Menú details en a11y tree | Contenido puede listarse aunque cerrado |

## Rollback plan

Revertir commit; restaurar bloque sections del builder a forms legacy.

## Resultado final

**PASS** (local + deploy autorizado)

## Próxima fase recomendada

Cleanup de componentes legacy no usados · o compactar tab Plus con el mismo patrón.
