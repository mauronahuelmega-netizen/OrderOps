# PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-POLISH-1 — Interactive Admin Preview Sandbox

## Objetivo

Reemplazar la preview orientativa de `/admin/products/customizations` por una sandbox interactiva que reutiliza presentacionales del modal público, con selección single/multi, plus, total estimado y CTA no operativo — sin carrito, localStorage, checkout ni writes.

## Contexto

Spec previa: PRODUCT-CUSTOMIZATION-ADMIN-PREVIEW-SPEC-1 — PASS (Opción B).

## Alcance

- Extraer presentacionales shared.
- Refactor mínimo del modal público.
- Mapper admin corpus → preview config.
- Preview sandbox admin + estado local.
- Docs + deploy.

## Fuera de scope

- Importar `CustomizationModal` completo en admin.
- Cart / checkout / create_order / DB / RLS / migrations / stock / pedidos QA.

## Autorización

```txt
AUTORIZO_PRODUCT_CUSTOMIZATION_ADMIN_PREVIEW_POLISH_LOCAL=yes
AUTORIZO_PRODUCT_CUSTOMIZATION_ADMIN_PREVIEW_POLISH_BROWSER_QA=yes
AUTORIZO_DEPLOY_PRODUCT_CUSTOMIZATION_ADMIN_PREVIEW_POLISH_TO_VERCEL=yes
```

## Precheck local

```txt
tsc PASS · build PASS
```

## Componentes extraídos

| Archivo | Rol |
|---------|-----|
| `components/product-customization/shared/customization-option-group.tsx` | Grupo + meta + issues |
| `components/product-customization/shared/customization-option-row.tsx` | Radio/checkbox + delta |
| `components/product-customization/shared/upsell-suggestion-group.tsx` | Plus + `getUpsellGroupCopy` |
| `components/product-customization/shared/customization-price-summary.tsx` | Total / hints |
| `components/product-customization/shared/customization-shared.module.css` | Estilos shared |
| `lib/product-customization/preview-selection.ts` | Toggles puros |

Helpers reutilizados: `validateCustomizationSelection`, `computeVisualCustomizationTotal`, `formatPublicCatalogCurrency`, `getUpsellGroupCopy`.

## Refactor del modal público

`customization-modal.tsx` ahora orquesta fetch + estado + cart confirm, y renderiza grupos/upsell/footer vía shared. Props y `onConfirmSelection` / localStorage (parent) intactos.

## Mapper admin

`lib/product-customization/admin-preview-mapper.ts` → `PublicProductCustomizationConfig`.

Fuente: groups / assignments / upsellGroups / product del admin (sin action pública).

Deuda: overrides de producto no vienen en `getCustomizationAdminConfig` V1.

## Preview sandbox admin

`admin-customization-live-preview.tsx` reemplaza el uso de `CustomerPreviewPanel` en el tab Por producto.

## Estado local

`selectedOptionsByGroupId` + `selectedUpsellProductIds`; reset al cambiar producto; sin persistencia.

## Reglas single/multi

Igual al público (replace / toggle + max disabled). Required muestra issue; CTA admin siempre disabled.

## Reglas plus/adicionales

Toggle productos reales (Coca) + copy `Sumá una bebida`; suma al total estimado.

## Pricing visual

`computeVisualCustomizationTotal` · label **Total estimado** · nota de vista previa.

## UX / theme

Card "Así lo verá el cliente" · shell tipo modal en columna · scroll interno · CTA "Agregar al pedido" disabled · tokens/surfaces admin.

## Validación local admin

- Doble Smash: Papas/Salsas/Agregados + Sumá una bebida + Coca + alert required + CTA disabled.
- No llama action pública de config.

## Validación local pública

Modal Doble Smash: Papas/Salsas/Agregados · Sumá una bebida · Coca · Total · Agregar al carrito.

## LocalStorage / side effects

Admin preview no escribe cart keys. Side effects de cart solo en flujo público existente.

## Deploy

Commit + push `main` (documentar hash).

## Browser QA

Admin interactivo OK · público modal OK (CDP).

## Compatibilidad

Dark/light vía tokens shared/admin. Layout operational intacto.

## Qué NO se tocó

DB · RLS · create_order · checkout · stock · flags · import del modal completo en admin.

## Validaciones CLI

`tsc PASS` · `build PASS`

## Riesgos / deuda

- Overrides no mapeados en preview admin V1.
- `customer-preview-panel.tsx` queda sin uso (posible cleanup).
- Max helper text extra en shared (también visible en público — mejora menor).

## Rollback plan

Revertir commit de esta fase. Sin migraciones.

## Resultado final

PASS

## Próxima fase recomendada

Opcional: incluir overrides en mapper admin · cleanup `CustomerPreviewPanel` · monitor piloto.
