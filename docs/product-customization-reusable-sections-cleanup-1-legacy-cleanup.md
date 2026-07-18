# PRODUCT-CUSTOMIZATION-REUSABLE-SECTIONS-CLEANUP-1 — Reusable Sections Legacy Cleanup

## Objetivo

Eliminar deuda técnica dejada por PRODUCT-CUSTOMIZATION-REUSABLE-SECTIONS-COMPACT-1: componentes legacy del flujo inline de Secciones reutilizables, CSS huérfano asociado e imports muertos, sin cambiar comportamiento visible.

## Contexto

Tras COMPACT-1, la pestaña Secciones reutilizables usa:

- `ReusableSectionsTab`
- `ReusableSectionCard`
- `SectionEditModal` / `OptionsManagementModal` / `OptionEditModal`
- `ReusableOptionRow`

Los archivos legacy (`create-group-form`, `customization-group-card`, `sortable-groups-list`) quedaron sin wiring en el builder.

## Alcance

- Auditoría de referencias runtime
- Eliminación de archivos 100% muertos
- CSS huérfano exclusivo del layout inline de secciones
- Docs / CURRENT_PHASE / LIVING_MEMORY

## Fuera de scope

- Cambios de UI compacta aprobada
- Server actions / DB / RLS / migrations
- Checkout / cart / create_order / stock
- Compactación de Plus sugeridos
- Delete/duplicate

## Autorización

```txt
AUTORIZO_PRODUCT_CUSTOMIZATION_REUSABLE_SECTIONS_CLEANUP_LOCAL=yes
AUTORIZO_PRODUCT_CUSTOMIZATION_REUSABLE_SECTIONS_CLEANUP_BROWSER_QA=yes
AUTORIZO_DEPLOY_PRODUCT_CUSTOMIZATION_REUSABLE_SECTIONS_CLEANUP_TO_VERCEL=yes
```

## Precheck local

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |

## Auditoría de referencias legacy

| Archivo | Imports runtime | Uso | Decisión |
|---------|-----------------|-----|----------|
| `create-group-form.tsx` | 0 (solo se referenciaba a sí / docs) | Reemplazado por `SectionEditModal` create | Eliminar |
| `customization-group-card.tsx` | 0 (solo `sortable-groups-list` + docs) | Reemplazado por `ReusableSectionCard` + modales | Eliminar |
| `sortable-groups-list.tsx` | 0 (solo builder histórico; builder usa `ReusableSectionsTab`) | Reemplazado por `ReusableSectionsTab` + `SortableReorderList` | Eliminar |

Confirmaciones:

- `owner-customization-builder.tsx` importa `ReusableSectionsTab` únicamente.
- Tipos `CreateGroupForm|GroupFormState|…` — 0 matches en `app/components/lib/types`.
- Referencias restantes solo en docs históricas (no runtime).
- CSS compartido (`groupCard`, `optionCard`, `fieldsTwo`, `optionList`, etc.) **sigue en uso** por assignments / upsell / overrides → **no eliminado**.

CSS exclusivo del layout sections inline (0 uso TSX tras delete):

- `.metaRow`
- `.groupsColumn` (+ media rule)
- `.sortableCardShell`
- `.sectionsLayout` (+ media rules)
- `.sectionsWorkspace` (selector compartido con `.plusWorkspace` → se dejó solo `.plusWorkspace`)

## Archivos eliminados

```txt
components/admin/product-customization/create-group-form.tsx
components/admin/product-customization/customization-group-card.tsx
components/admin/product-customization/sortable-groups-list.tsx
```

## Imports / exports limpiados

No había barrels/index exportando esos archivos. El builder ya no los importaba (COMPACT-1). Post-delete: 0 imports runtime a esos paths.

## CSS limpiado

En `product-customization-admin.module.css`:

- Removidos: `.metaRow`, `.groupsColumn`, `.sortableCardShell`, `.sectionsLayout`, `.sectionsWorkspace`
- Conservados: estilos compartidos usados por Por producto / Por categoría / Plus (`groupCard`, `optionCard`, `fieldsTwo`, `plusWorkspace`, toolbars sortable, etc.)

## Tipos / helpers revisados

Ningún tipo helper obsoleto dedicado al flujo inline encontrado en runtime. No se tocó `types/database.ts` ni shapes de cart/checkout.

## Validación local admin

`/admin/products/customizations` → Secciones reutilizables:

- Tab carga con cards compactas
- + Nueva sección / Editar → modales
- Gestionar opciones → modal + rows compactas
- Crear/editar opción → modal
- Ocultar/mostrar sección/opción
- Reorder ↑↓ sección/opción
- Sin formularios largos inline

## Validación otros tabs

Por producto · Por categoría · Plus sugeridos: cargan; preview admin operativa; tabs cambian.

## Validación pública

`/b/demohamburgueseria/catalogo` — smoke Doble Smash (Papas/Salsas/Agregados + Plus Coca) sin confirmar pedido.

## No side effects

- no migrations / schema / RLS
- no server actions modificadas
- no cart / checkout / create_order
- no stock / restock
- no pedidos QA
- no flags / session

## Deploy

Autorizado y ejecutado.

- Commit: `5819460` — `Clean up legacy reusable customization sections`
- Push: `origin/main`
- App: https://orderops.vercel.app

## Browser QA

Local browser QA autorizado; checklist admin + tabs + público en esta fase.

## Compatibilidad

UI compacta COMPACT-1 intacta. Tabs no sections sin cambio de comportamiento. Modal público sin cambios de código.

## Qué NO se tocó

DB · RLS · actions · checkout · cart · create_order · stock · Plus compact · preview mapper · public modal logic

## Validaciones CLI

`tsc PASS` · `build PASS`

## Riesgos / deuda

| Deuda | Notas |
|-------|-------|
| Docs históricas | Mentions a archivos legacy en docs de fases anteriores (intencional, histórico) |
| CSS compartido residual | `groupCard`/`optionCard` siguen usados por Plus/assignments — no son orphan |
| Plus sugeridos compact | Fuera de scope |

## Rollback plan

Restaurar los tres TSX desde git + CSS eliminado del module admin; el builder actual no los necesita (seguiría en compact).

## Resultado final

**PASS** (cleanup completo de candidatos seguros + deploy autorizado)

## Próxima fase recomendada

Opcional: compactar tab Plus sugeridos con el mismo patrón cards/modales · o QA overrides disable real en piloto.
