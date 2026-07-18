# PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-OVERRIDES-1 — Admin Preview Product Overrides Fidelity

## Objetivo

Hacer que la preview sandbox de `/admin/products/customizations` refleje overrides/excepciones del producto seleccionado (grupos/opciones ocultos), alineada al read model público efectivo.

## Contexto

Tras CLEANUP-1, la preview interactiva existía pero `admin-preview-mapper` no aplicaba `product_customization_overrides`. El público ya resolvía overrides en `lib/product-customization/public.ts` (`resolveGroupsForProduct`).

## Alcance

- Lectura admin de overrides en `getCustomizationAdminConfig`
- Mapper efectivo con overrides
- Prune de selección sandbox
- Copy discreto cuando hay excepciones disable
- Docs / CURRENT_PHASE / LIVING_MEMORY / deploy

## Fuera de scope

DB/schema/RLS/migrations · create_order · checkout · cart · stock · writes de overrides · cambios funcionales al modal público · flags · pedidos QA

## Autorización

```txt
AUTORIZO_PRODUCT_CUSTOMIZATION_ADMIN_PREVIEW_OVERRIDES_LOCAL=yes
AUTORIZO_PRODUCT_CUSTOMIZATION_ADMIN_PREVIEW_OVERRIDES_BROWSER_QA=yes
AUTORIZO_DEPLOY_PRODUCT_CUSTOMIZATION_ADMIN_PREVIEW_OVERRIDES_TO_VERCEL=yes
```

## Precheck local

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |

## Auditoría de overrides

| Área | Hallazgo |
|------|----------|
| Tabla | `product_customization_overrides` (`override_type` group\|option, `is_enabled`) |
| Público | `loadPublicCustomizationCorpus` + `resolveGroupsForProduct` aplica `is_enabled === false` |
| Admin herencia | `getProductCustomizationInheritanceForAdmin` ya leía overrides por producto |
| Admin corpus page | `getCustomizationAdminConfig` **no** traía overrides (deuda) |
| Panel UI | `ProductCustomizationOverridesPanel` carga herencia vía action (separado) |
| Duplicación | Misma semántica que público; mapper admin es espejo client-safe |

## Reglas V1 aplicadas

1. Grupo con override disable → no aparece en preview
2. Opción con override disable → grupo visible sin esa opción
3. Asignaciones product-specific siguen aportando grupos
4. Plus/upsell no se filtra por overrides de opciones

Nota: el modelo real (igual que público) aplica disable a grupos resueltos tanto de categoría como de producto; el panel admin permite desactivar en ambos orígenes.

## Reglas de prioridad

1. Category assignments → grupos heredados  
2. Product assignments → grupos propios (ganan ante duplicado `group_id`)  
3. Overrides `is_enabled === false` ocultan grupos/opciones  
4. `is_available === false` nunca se muestra  
5. Deduplicación por `group_id`  
6. `sort_order` (+ `created_at`) preservado  

## Admin data loading

- Nuevo: `getCustomizationOverridesForAdmin(businessId)` (SELECT admin-only)
- `getCustomizationAdminConfig` ahora retorna `{ …, overrides }`
- Page → `OwnerCustomizationBuilder` → `AdminCustomizationLivePreview`
- Sin service role nuevo; sin actions públicas

## Mapper efectivo

Archivo: `lib/product-customization/admin-preview-mapper.ts`

- `mapAdminCorpusToPreviewConfig` / alias `resolveAdminEffectivePreviewConfig`
- Input incluye `overrides: AdminProductCustomizationOverride[]`
- `productHasDisableOverrides` para copy UX

## Estado local sandbox

En `preview-selection.ts`:

- `pruneSelectedOptionsByGroupId`
- `pruneSelectedUpsellProductIds`

Live preview: reset al cambiar `product.id`; prune al cambiar config efectiva.

## Preview UX

Si el producto tiene al menos un override disable:

- “Vista previa según las excepciones de este producto · no agrega al carrito”
- Subtítulo panel: “Preview según las excepciones de este producto…”

Si no: copy interactivo anterior.

## Validación local admin

| Check | Resultado |
|-------|-----------|
| Pantalla carga | OK |
| Doble Smash Papas/Salsas/Agregados + Plus Coca | OK |
| Total estimado / CTA disabled | OK |
| Copy excepciones (sin disable real) | Copy estándar (correcto: piloto sin overrides disable) |
| Browser override hide | **N/A** — piloto `0` filas disable; fixture flag-off tiene 1 override `is_enabled=true` |

## Validación pública

Catálogo + modal Doble Smash: Papas/Salsas/Agregados/Sumá una bebida/Coca OK. Sin confirmar pedido.

## No side effects

Sin writes · sin pedidos · sin localStorage admin · sin schema/RLS · sin cart/checkout modificados.

## Deploy

Pendiente completar tras commit (ver CURRENT_PHASE).

## Browser QA

Admin smoke + público smoke OK. Override hide en browser: deuda de datos (sin producto piloto con disable).

## Compatibilidad

Modal público intacto. Semántica de overrides alineada al read model público.

## Qué NO se tocó

Modal público (funcional) · DB/RLS · create_order · checkout · cart · stock · flags · configuración productiva

## Validaciones CLI

`tsc PASS` · `build PASS` · smoke in-memory mapper rules PASS (6/6)

## Riesgos / deuda

| Deuda | Notas |
|-------|-------|
| DATA QA | No hay override `is_enabled=false` en piloto para browser QA de hide |
| Fixture | `59db34de-…` tiene override group `is_enabled=true` (no oculta) |
| Max hint público | Minor previo, fuera de scope |

## Rollback plan

Revertir commit de esta fase. Sin migraciones. Preview vuelve a ignorar overrides.

## Resultado final

**PASS WITH DATA QA DEBT** (implementación + smoke; sin dato real de hide en browser)

## Próxima fase recomendada

QA opcional con override disable temporal autorizado en producto no crítico · monitor piloto.
