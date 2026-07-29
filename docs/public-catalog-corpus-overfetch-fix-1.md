# PUBLIC-CATALOG-CORPUS-OVERFETCH-FIX-1 — Public Customization Corpus Overfetch Reduction

## 1. Estado

```txt
PASS WITH PREVIEW QA DEBT
```

Fecha: 2026-07-29  
Branch: `main`  
HEAD base: `9fae258`  
Sin commit/push/deploy

## 2. Resumen ejecutivo

Se eliminó el overfetch de groups/options/upsell items a nivel tenant en el corpus público: el loader ahora deriva IDs desde assignments/upsell targets de productos/categorías visibles y solo fetcha filas relevantes. El catálogo usa `loadPublicCustomizationSummariesForCatalogProducts` (summary-lite). Modal on-demand sigue intacto (mismo corpus filtrado por producto). Cache tags/TTL y ordering fresco sin cambios. Preview local UNVERIFIED (auth).

## 3. Problema atacado

```txt
P2 — corpus overfetch groups/options
```

Antes: `loadPublicCustomizationCorpus` cargaba **todos** los `customization_groups`, `customization_options` y `upsell_group_items` del tenant aunque solo hubiera 16 productos visibles.

## 4. Archivos modificados

**Código**

- `lib/product-customization/public.ts` — corpus filtrado en 2 fases + `loadPublicCustomizationSummariesForCatalogProducts`
- `lib/catalog/public-cached-data.ts` — wire summary-lite en enrichment cacheado

**Docs**

- `docs/public-catalog-corpus-overfetch-fix-1.md` (este)
- `docs/CURRENT_PHASE.md`
- `ORDEROPS_LIVING_MEMORY.md`

**No tocados (scroll polish dirty previo)**

- `app/globals.css`, cart-sheet/customization-modal module CSS

## 5. Data path antes

```txt
catalogo/page → public-page-data → public-cached-data
  → loadPublicCustomizationSummariesForProducts
    → loadPublicCustomizationCorpus(productIds)
      assignments: filtrado por product/category ✓
      overrides: filtrado por productIds ✓
      upsell_groups: filtrado por product/category ✓
      groups: ALL tenant ✗
      options: ALL tenant ✗
      upsell_items: ALL tenant ✗
```

## 6. Data path después

```txt
catalogo/page → public-page-data → public-cached-data
  → loadPublicCustomizationSummariesForCatalogProducts (summary-lite)
    → loadPublicCustomizationSummariesForProducts
      → loadPublicCustomizationCorpus(productIds) filtrado
        Phase 1: assignments + overrides + upsell_groups (scoped)
        Phase 2: groups.in(groupIds) + options.in(group_id) + upsell_items.in(upsell_group_id)
```

Modal: `getPublicProductCustomizationConfig` → mismo corpus filtrado por 1 productId (on-demand, `noStore`).

## 7. Query/corpus reduction

| Corpus | Antes | Después | Evidencia |
| ------ | ----: | ------: | --------- |
| groups | all tenant `is_available` | `.in("id", relevantGroupIds)` | `public.ts` phase 2 |
| options | all tenant | `.in("group_id", relevantGroupIds)` | `public.ts` phase 2 |
| overrides | visible productIds | visible productIds | sin cambio de scope |
| upsell groups | relevant targets | relevant targets | sin cambio de scope |
| upsell items | all tenant | `.in("upsell_group_id", relevantUpsellGroupIds)` | `public.ts` phase 2 |
| suggested products (page) | omitido fuera de catálogo | omitido (`reuseProductsForSuggested`) | source |

## 8. Summary-lite read model

```ts
loadPublicCustomizationSummariesForCatalogProducts({
  businessId,
  products, // visible catalog rows
  productCustomizationEnabled
})
```

Shape inalterado: `hasCustomizations`, `hasPaidCustomizations`, `hasUpsell`, `priceFrom`.

No calcula precio final server-side. No valida checkout. No carga modal config completa.

## 9. Modal boundary

```txt
modal config on-demand intacta
getPublicProductCustomizationConfig + catalogo/actions no reescritos
Papas/Salsas/Agregados/Plus verificados en runtime local
```

## 10. Cache boundary

```txt
tags: public-business / public-catalog / public-customization — intactos
TTL 60s — intacto
fresh ordering status noStore — intacto
cached loader: service client, sin cookies/headers — intacto
```

## 11. Runtime QA público

Local `http://localhost:3000/b/demohamburgueseria/catalogo`

| Check | Resultado |
|-------|-----------|
| 16 productos / 5 categorías | PASS |
| Desde BBQ `$13.500` / Doble Smash `$12.500` | PASS (2× Desde) |
| Modal BBQ Papas/Salsas/Agregados/Plus | PASS |
| Cart bar | PASS |
| Pedido real | **NO** |

## 12. Preview regression

```txt
UNVERIFIED — auth unavailable (local)
source: preview logic untouched
```

## 13. Checkout boundary

| Check | Resultado |
|-------|-----------|
| **Enviar pedido** visible | PASS |
| Items / adicionales visibles | PASS |
| Pedido enviado | **NO** |

## 14. Flag OFF / fail-closed

```txt
source-level fail-closed PASS
(isProductCustomizationEnabled → empty summaries; early return)
runtime flag-OFF UNVERIFIED
```

## 15. Seguridad / no-regression

```txt
No DB
No RLS
No RPC SQL
No checkout action
No carrito schema
No cache strategy/tags/TTL changes
No preview admin logic
No CSP
No pedidos reales
businessId en todas las queries
service client solo server-only
```

## 16. Resultado de comandos

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `npm run lint` | FAIL — ESLint circular histórico |

Dirty tree incluye scroll polish previo + este fix (sin stage/commit).

## 17. Deuda residual

| ID | Deuda | Severidad |
|----|-------|-----------|
| — | Preview auth local smoke | P3 |
| — | Summary `hasUpsell` omite suggested fuera del set de catálogo (`reuseProductsForSuggested`) | P3 residual aceptada |
| — | Scroll polish local sin deploy | P2 deploy pendiente |
| P2 | Image Transforms 403 | P2 |
| P2 | slug rename / flag toggle UI | P2 |
| P3 | mutation cache/ordering QA | P3 |
| P3 | lint circular | P3 |

## 18. Rollback

```bash
git checkout -- \
  lib/product-customization/public.ts \
  lib/catalog/public-cached-data.ts \
  docs/CURRENT_PHASE.md \
  ORDEROPS_LIVING_MEMORY.md

rm -f docs/public-catalog-corpus-overfetch-fix-1.md
```

No revertir CSS de scroll polish.

## 19. Próximo paso

```txt
PUBLIC-CATALOG-ROADMAP-DEPLOY-1
```

(agrupa scroll polish + corpus overfetch para deploy controlado)
