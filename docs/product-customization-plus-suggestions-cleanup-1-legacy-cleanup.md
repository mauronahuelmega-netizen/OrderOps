# PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-CLEANUP-1 — Plus Suggestions Legacy Cleanup

## Objetivo

Eliminar deuda técnica dejada por PRODUCT-CUSTOMIZATION-PLUS-SUGGESTIONS-COMPACT-1: componente legacy del flujo inline de Plus sugeridos, CSS huérfano asociado e imports muertos, sin cambiar comportamiento visible.

## Contexto

Tras COMPACT-1, Plus sugeridos usa `plus-suggestions/*` (`PlusSuggestionsTab`, cards, modales). `upsell-groups-section.tsx` quedó sin wiring.

## Alcance

- Auditoría de referencias runtime
- Eliminación de archivo 100% muerto
- CSS huérfano exclusivo del layout Plus inline
- Docs / CURRENT_PHASE / LIVING_MEMORY

## Fuera de scope

- Cambios de UI compacta
- Server actions / DB / RLS / migrations
- Stock contextual
- Delete/remove
- Checkout / cart / create_order
- Preview mapper / catálogo público

## Autorización

```txt
AUTORIZO_PRODUCT_CUSTOMIZATION_PLUS_SUGGESTIONS_CLEANUP_LOCAL=yes
AUTORIZO_PRODUCT_CUSTOMIZATION_PLUS_SUGGESTIONS_CLEANUP_BROWSER_QA=yes
AUTORIZO_DEPLOY_PRODUCT_CUSTOMIZATION_PLUS_SUGGESTIONS_CLEANUP_TO_VERCEL=yes
```

## Precheck local

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |

## Auditoría de referencias legacy

| Archivo / símbolo | Imports runtime | Decisión |
|-------------------|-----------------|----------|
| `upsell-groups-section.tsx` | 0 (solo self) | Eliminar |
| `PlusSuggestionsTab` | Wired en builder | Vigente |
| `.plusWorkspace` | 0 TSX (wrapper removido en COMPACT-1) | Eliminar CSS |
| `.optionsSection` | Solo legacy upsell | Eliminar CSS |
| `.groupCard` / `.optionCard` / `.sectionGrid` / etc. | Usados por assignments / overrides | **Conservar** |

Tipos `UpsellGroupForm|InlineUpsell|…`: 0 matches runtime.

## Archivos eliminados

```txt
components/admin/product-customization/upsell-groups-section.tsx
```

## Imports / exports limpiados

Builder ya importaba solo `PlusSuggestionsTab`. Post-delete: 0 imports a `UpsellGroupsSection`.

## CSS limpiado

En `product-customization-admin.module.css`:

- Removidos: `.plusWorkspace`, `.optionsSection`
- Conservados: estilos compartidos (assignments / overrides / builder)

## Tipos / helpers revisados

Ningún helper obsoleto dedicado al flujo inline. No se tocó `types/database.ts` ni shapes cart/checkout.

## Validación local admin

Plus: card Bebidas · Coca · +$3.000 · manage modal · sin forms inline.

## Validación otros tabs

Secciones reutilizables compactas OK; tabs cambian.

## Validación pública

Doble Smash: Papas/Salsas/Agregados + Coca Plus. Sin confirmar pedido.

## No side effects

Sin migrations/schema/RLS/actions/cart/checkout/stock/pedidos/flags/stock contextual.

## Deploy

Autorizado y ejecutado.

- Commit: `6b0e153` — `Clean up legacy Product Customization plus suggestions`
- Push: `origin/main`
- App: https://orderops.vercel.app

## Browser QA

Local checklist admin + secciones + público: PASS.

## Compatibilidad

UI compacta COMPACT-1 intacta. Público/preview sin cambios de código.

## Qué NO se tocó

DB · RLS · actions · checkout · cart · stock · preview mapper · public modal · delete

## Validaciones CLI

`tsc PASS` · `build PASS`

## Riesgos / deuda

| Deuda | Notas |
|-------|-------|
| Docs históricas | Mentions a `upsell-groups-section` en docs de fases anteriores |
| Stock contextual en row | Fuera de scope (shape admin sin stock) |
| CSS compartido residual | `groupCard`/`optionCard` siguen usados por assignments |

## Rollback plan

Restaurar `upsell-groups-section.tsx` + CSS desde git; builder actual no lo necesita.

## Resultado final

**PASS**

## Próxima fase recomendada

Monitor piloto · o polish menor de tabs restantes (Por producto / Por categoría) si se prioriza densificación.
