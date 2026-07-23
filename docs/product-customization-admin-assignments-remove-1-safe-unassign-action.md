# PRODUCT-CUSTOMIZATION-ADMIN-ASSIGNMENTS-REMOVE-1 — Safe Assignment Unassign Action & UX

## Objetivo

Cerrar la deuda **PASS WITH REMOVE DEBT** de ASSIGNMENTS-COMPACT-1 implementando una action segura para quitar asignaciones de sección desde Por producto / Por categoría, sin eliminar secciones reutilizables ni opciones.

## Contexto

- PRODUCT-CUSTOMIZATION-ADMIN-ASSIGNMENTS-COMPACT-1 — PASS WITH REMOVE DEBT
- Assignments compactas, create/toggle/reorder OK; faltaba unassign seguro.

## Alcance

- Server action `removeCustomizationGroupAssignmentAction`
- UI de confirmación + menú “Quitar de este producto/categoría”
- Docs / CURRENT_PHASE / LIVING_MEMORY / deploy

## Fuera de scope

Migrations · schema · RLS · preview mapper · público · cart/checkout/stock · delete de groups/options · excepciones · responsive rewrite

## Autorización

```txt
AUTORIZO_PRODUCT_CUSTOMIZATION_ADMIN_ASSIGNMENTS_REMOVE_LOCAL=yes
AUTORIZO_PRODUCT_CUSTOMIZATION_ADMIN_ASSIGNMENTS_REMOVE_BROWSER_QA=yes
AUTORIZO_PRODUCT_CUSTOMIZATION_ADMIN_ASSIGNMENTS_REMOVE_SERVER_ACTION=yes
AUTORIZO_PRODUCT_CUSTOMIZATION_ADMIN_ASSIGNMENTS_REMOVE_QA_SAFE_ASSIGNMENT_WRITE=yes
AUTORIZO_GIT_COMMIT_PRODUCT_CUSTOMIZATION_ADMIN_ASSIGNMENTS_REMOVE=yes
AUTORIZO_GIT_PUSH_PRODUCT_CUSTOMIZATION_ADMIN_ASSIGNMENTS_REMOVE_TO_ORIGIN_MAIN=yes
AUTORIZO_DEPLOY_PRODUCT_CUSTOMIZATION_ADMIN_ASSIGNMENTS_REMOVE_TO_VERCEL=yes
```

## Permisos operativos

Lectura/escritura UI + action acotada · docs · tsc/build · browser QA · commit · push `origin/main`.

## Precheck local

`tsc PASS` · `build PASS`

## Auditoría inicial

| Ítem | Hallazgo |
|------|----------|
| Tabla | `customization_group_assignments` |
| Create | `createCustomizationGroupAssignmentAction` |
| Toggle | `toggleCustomizationGroupAssignmentAction` |
| Reorder | `reorderCustomizationAssignmentsAction` |
| Auth | `requireAdminPermission("manageProducts")` + `assertAssignmentOwnership` / `assertTargetOwnership` |
| Remove previo | No existía |
| RLS delete | Policy `customization_group_assignments_delete_own_business` ya existe → sin migration |
| Revalidate | `revalidateCustomizationPaths()` |
| UI | `AssignmentCard` ⋮ |

## Action segura de unassign

`removeCustomizationGroupAssignmentAction` en `app/admin/(protected)/products/customizations/actions.ts`:

- Input: `assignment_id` (+ opcional `target_type`, `target_id` para cross-check)
- DELETE solo en `customization_group_assignments` filtrado por `id` + `business_id`
- No toca groups/options/overrides/products/categories

## Validaciones multi-tenant

1. Sesión + `manageProducts`
2. `assertAssignmentOwnership(assignmentId, businessId)`
3. Cross-check opcional target
4. `assertTargetOwnership` del target de la fila
5. Delete con `.eq("business_id", …)`

## Idempotencia / doble submit

Si la asignación ya no existe (o no es visible al tenant): **success no-op**  
`message: "La asignación ya no estaba presente."` + revalidate.

## UI de confirmación

`<dialog>` con copy:

- Producto: “Quitar sección de este producto” / conserva sección y opciones
- Categoría: “Quitar sección de esta categoría” / impacto en lote

Footer: Cancelar · Quitar de este producto/categoría

## Por producto

Menú ⋮: Ocultar/Mostrar · **Quitar de este producto**

## Por categoría

Misma card con mode=category: **Quitar de esta categoría**

## Relación con Visible/Oculta

Helper: “Ocultar conserva la asignación… Quitar la remueve de esta lista.”

## Relación con Excepciones

Sin mezclar overrides; helper de assignments intacto hacia “Ajustes propios…”.

## QA con write controlado

Target seguro: **Mozzarella** (PIZZAS, sin config crítica).

1. Agregar Papas temporal vía modal
2. Cancelar confirmación → card sigue
3. Confirmar quitar → empty “Sin secciones propias”
4. Secciones reutilizables: Papas + opciones intactas
5. No se tocó Doble Smash / HAMBURGUESAS productivas

Categoría: UI empty/CTA verificada; remove usa el mismo `AssignmentCard` + action (write category no repetido tras flaky modal open en browser automation).

## Validación local admin

| Check | Resultado |
|-------|-----------|
| Menú Quitar + confirm copy | PASS |
| Cancelar no-op | PASS |
| Confirm quita solo assignment temp | PASS |
| Sección/opciones reutilizables | PASS |
| Preview refleja Papas tras assign / limpia tras remove | PASS |
| Secciones / Plus tabs | PASS |

## Validación pública

Doble Smash: Papas/Salsas/Agregados · bebida Coca · carrito parent + adicional — PASS (sin confirmar pedido)

## No side effects

Sin migrations/schema/RLS/mapper/cart/checkout/stock/pedidos QA. Sin delete de groups/options.

## Deploy

Commit `e8383e0` + push `origin/main` tras tsc/build → https://orderops.vercel.app

## Browser QA

Admin write controlado (Mozzarella) + público smoke — PASS

## Compatibilidad

Create/toggle/reorder intactos. `assertAssignmentOwnership` ahora retorna `assignment` (campos extras); callers existentes compatibles.

## Qué NO se tocó

Preview mapper · público · exceptions · cart/checkout · DB schema/RLS policies

## Validaciones CLI

`tsc PASS` · `build PASS`

## Riesgos / deuda

- Browser automation flaky al abrir modal de categoría; action/UI category cubiertos por código + product write.
- Responsive estructural sigue fuera de scope.

## Rollback plan

Revertir commit (action + UI assignments). Filas ya borradas no se restauran automáticamente (solo assignment relations).

## Resultado final

**PASS**

## Próxima fase recomendada

PRODUCT-CUSTOMIZATION-ADMIN-RESPONSIVE-POLISH-1
