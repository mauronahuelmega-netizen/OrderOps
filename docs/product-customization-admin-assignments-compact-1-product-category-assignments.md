# PRODUCT-CUSTOMIZATION-ADMIN-ASSIGNMENTS-COMPACT-1 — Product & Category Assignments Compact UI

## Objetivo

Compactar y pulir la UX de asignaciones en **Por producto** y **Por categoría** dentro de `/admin/products/customizations`, presentando secciones aplicadas como cards/rows resumidas con agregado vía modal y acciones secundarias en menú ⋮.

## Contexto

Nace de:

- PRODUCT-CUSTOMIZATION-ADMIN-V1-POLISH-MONITOR-1 — NEEDS POLISH
- PRODUCT-CUSTOMIZATION-ADMIN-HIERARCHY-POLISH-1 — PASS WITH HIERARCHY DEBT
- PRODUCT-CUSTOMIZATION-ADMIN-EXCEPTIONS-UX-1 — PASS

Problema: assignments seguían densos (form inline + sort permanente + toggle expuesto), aunque la jerarquía de tabs ya había mejorado.

## Alcance

- Compactar listas de asignaciones en Por producto / Por categoría
- Cards/rows premium + modal Agregar sección
- Reutilizar actions existentes (create / toggle / reorder)
- Empty states, chips, copy owner-friendly
- CSS module local de assignments
- Docs / CURRENT_PHASE / LIVING_MEMORY / deploy

## Fuera de scope

DB/schema/RLS/migrations · server actions nuevas o modificadas · preview mapper · catálogo público · cart/checkout/create_order/stock · delete/remove nuevo · duplicate · responsive structural rewrite · creación de secciones desde assignments

## Autorización

```txt
AUTORIZO_PRODUCT_CUSTOMIZATION_ADMIN_ASSIGNMENTS_COMPACT_LOCAL=yes
AUTORIZO_PRODUCT_CUSTOMIZATION_ADMIN_ASSIGNMENTS_COMPACT_BROWSER_QA=yes
AUTORIZO_GIT_COMMIT_PRODUCT_CUSTOMIZATION_ADMIN_ASSIGNMENTS_COMPACT=yes
AUTORIZO_GIT_PUSH_PRODUCT_CUSTOMIZATION_ADMIN_ASSIGNMENTS_COMPACT_TO_ORIGIN_MAIN=yes
AUTORIZO_DEPLOY_PRODUCT_CUSTOMIZATION_ADMIN_ASSIGNMENTS_COMPACT_TO_VERCEL=yes
```

## Permisos operativos

Lectura/escritura en scope UI · docs · tsc/build · browser QA local · commit · push `origin/main` · deploy Vercel vía push. Sin migrations, writes productivos, flags ni pedidos QA.

## Precheck local

`tsc PASS` · `build PASS` (baseline previo a cambios; sin fallos bloqueantes en admin customizations).

## Auditoría inicial

| Ítem | Hallazgo |
|------|----------|
| Componente principal | `customization-assignments-section.tsx` |
| Por producto | Asignaciones `target_type=product` + bloque lectura “Aplicadas desde categoría” |
| Por categoría | Asignaciones `target_type=category` |
| Actions | `createCustomizationGroupAssignmentAction`, `toggleCustomizationGroupAssignmentAction`, `reorderCustomizationAssignmentsAction`, update sort |
| Remove/delete | **No existe** action segura → no se muestra “Quitar” |
| Reorder | Existe y es seguro vía `SortableReorderList` |
| Compactable | Form create inline, sort input permanente, toggle expuesto |
| Summary data | Group name/desc, selection_type, required, min/max, option count, is_enabled |
| No tocar | actions/, preview mapper, público, exceptions semantics |

## Cambios implementados

```txt
components/admin/product-customization/assignments/
  assignments.module.css
  assign-section-modal.tsx
  assignment-card.tsx
customization-assignments-section.tsx  (rewrite compacto)
owner-customization-builder.tsx        (wiring Por producto / Por categoría)
```

## Por producto

- Panel **Secciones propias de este producto** con cards compactas + `+ Agregar sección`
- Empty: “Sin secciones propias todavía…”
- Bloque lectura **Aplicadas desde categoría** (no editable desde este tab)
- Helper hacia Secciones reutilizables / excepciones

## Por categoría

- Panel **Secciones aplicadas a esta categoría**
- Empty: “Sin secciones asignadas directamente…”
- Modal agregar con copy de impacto en lote
- No confunde con ajustes individuales por producto

## Cards / rows compactas

Nombre · descripción breve · chips (Única/Múltiple, Requerida/Opcional, Mín/Máx, N opciones, Visible/Oculta) · origen (Propia de este producto / Aplicada a esta categoría) · drag/↑↓ si hay >1 · menú ⋮

Sin IDs, target_type, assignment_id ni sort_order permanente.

## Modal Agregar sección

`<dialog>` + `createCustomizationGroupAssignmentAction`  
Campos: sección reutilizable (+ orden solo si el action lo acepta de forma segura vía defaultSortOrder).  
Footer: Cancelar · Agregar sección.  
Microcopy: secciones se crean en “Secciones reutilizables”.

## Menú de asignación

- **Ocultar / Mostrar para clientes** vía `toggleCustomizationGroupAssignmentAction`
- **Sin Quitar** (REMOVE DEBT documentada)
- Reorder en chrome Sortable (no en ⋮)

## Relación con Secciones reutilizables

Helper + CTA “Ir a Secciones reutilizables” cuando no hay grupos disponibles. No se edita/crea la sección desde assignments.

## Relación con Excepciones del producto

Assignments agregan secciones; excepciones ocultan por producto. Copy: usar “Ajustes propios de este producto” para ocultar algo solo en ese producto. Sin mezclar override actions en la card.

## Vista previa admin

Sin cambios al mapper. Tras create/toggle/reorder, `router.refresh()` existente actualiza la preview.

## Estados visuales

Propia de este producto · Aplicada desde categoría · Aplicada a esta categoría · Visible/Oculta · empty states · “No hay secciones disponibles para agregar” · pending “Agregando…” / “Actualizando…” · error genérico de guardado.

## Theme / tokens

`assignments.module.css` con tokens semánticos (`--bg-surface*`, `--text-*`, `--border-subtle`, accent/focus del shell). Sin colores hardcoded. Alineado a ReusableSections / PlusSuggestions.

## Responsive

Sin rewrite estructural. Cards full-width, chips wrap, modal `min(100% - 24px, …)`.

## Validación local admin

| Check | Resultado |
|-------|-----------|
| Por producto compacto (Doble Smash) | PASS |
| Cards Papas/Salsas/Agregados + reorder chrome | PASS |
| Modal + Agregar (todas asignadas → empty opciones) | PASS |
| Aplicadas desde categoría lectura | PASS |
| Por categoría empty + CTA | PASS |
| Excepciones / preview / Secciones / Plus | PASS (no regresión) |

## Validación pública

`/b/demohamburgueseria/catalogo` — Doble Smash: Papas/Salsas/Agregados · Sumá una bebida · Coca Cola 500ml · total · agregar · carrito parent + adicional. Sin confirmar pedido. **PASS**

## No side effects

Confirmado: sin migrations · sin schema/RLS · sin actions modificadas · sin preview mapper · sin cart/checkout/stock · sin pedidos QA · sin flags · sin delete nuevo · sin crear secciones desde assignments.

## Deploy

Commit + push `origin/main` tras tsc/build PASS. Vercel vía deploy automático del push.

## Browser QA

Admin local + público local documentados arriba. PASS WITH REMOVE DEBT (UI).

## Compatibilidad

Actions y contratos de assignments intactos. `?product=` intacto. Tabs compactas previas intactas.

## Qué NO se tocó

`actions.ts` · preview mapper · DB · público · exceptions semantics · cart/checkout/create_order/stock

## Validaciones CLI

`npx tsc --noEmit` PASS · `npm run build` PASS

## Riesgos / deuda

- **REMOVE DEBT:** no existe action segura para quitar asignación; solo toggle hide/show.
- Responsive estructural sigue fuera de scope.
- Categorías demo sin assignments a nivel categoría (empty esperado; productos usan assignments propios).

## Rollback plan

Revertir commit de UI (`assignments/*`, `customization-assignments-section.tsx`, `owner-customization-builder.tsx`, docs). Sin rollback de datos.

## Resultado final

**PASS WITH REMOVE DEBT** — Asignaciones compactas en Por producto y Por categoría; agregar y reorder vía actions existentes; sin quitar destructivo.

## Próxima fase recomendada

- PRODUCT-CUSTOMIZATION-ADMIN-ASSIGNMENTS-REMOVE-1 (si se autoriza action segura de unassign)
- PRODUCT-CUSTOMIZATION-ADMIN-RESPONSIVE-POLISH-1
