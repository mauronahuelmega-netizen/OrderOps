# PUBLIC-CATALOG-PERFORMANCE-FIX-1 — Public Catalog Server Calls & Render Cost Reduction

## 1. Estado

```txt
PASS WITH RESIDUAL PERFORMANCE DEBT
```

Fecha: 2026-07-28  
Branch: `main`  
HEAD baseline: `4dd5dce`  
Superficie: `/b/[slug]/catalogo` (local `:3020` smoke)  
CLI: `tsc` PASS · `build` PASS · `lint` FAIL (ESLint circular histórico `configs.flat.plugins.react`)

Sin DB/RLS/RPC/cache persistente/revalidation/checkout action/carrito schema/preview admin logic. Sin pedidos reales.

## 2. Resumen ejecutivo

Se redujo el costo server/render del catálogo público sin cache persistente:

- **Dedupe `business_settings`**: el loader de business ya lee settings una vez; aceptación de pedidos reutiliza `onDemandModeActive`; el flag de customization viaja en `PublicBusiness.product_customization_enabled`.
- **Summaries sin re-fetch de products**: `getPublicCatalogPageData` pasa productos del catálogo al corpus; `reuseProductsForSuggested` evita el waterfall de suggested products en el path de página.
- **Flag una sola vez** en el path de catálogo (no segunda lectura en summaries).
- **CatalogClient**: `ProductCard` memoizado + callbacks estables por `productId` + `quantityByProductId` → cambios de carrito no invalidan props de cards no afectadas.

## 3. Problemas atacados

| Problema audit | Mitigación |
|----------------|------------|
| `business_settings` ×3–4 | 1 lectura en `getPublicBusinessBySlug`; opciones opcionales en helpers |
| flag customization ×2 | valor en `PublicBusiness` + `productCustomizationEnabled` en summaries |
| products ×2 (+ suggested) | corpus acepta `products` + `reuseProductsForSuggested` |
| waterfall suggested | omitido en page path cuando el catálogo ya trae disponibles |
| cart → re-render grid | `memo(ProductCard)` + handlers estables + qty map |

## 4. Archivos modificados

**Creados**

- `lib/catalog/public-page-data.ts`
- `docs/public-catalog-performance-fix-1.md`

**Modificados**

- `lib/business/public.ts`
- `lib/store-sessions/public.server.ts`
- `lib/product-customization/flags.ts`
- `lib/product-customization/public.ts`
- `components/public/catalog/public-catalog-page.tsx`
- `components/public/catalog/catalog-client.tsx`
- `components/public/catalog/product-card.tsx`
- `docs/CURRENT_PHASE.md`
- `ORDEROPS_LIVING_MEMORY.md`

## 5. Data path antes

```txt
layout/page: getRequestPublicBusiness (React.cache)
  → businesses
  → business_settings (schedule + on_demand)
  → isBusinessAcceptingPublicOrders → business_settings OTRA VEZ + store_sessions

PublicCatalogPageContent:
  → Promise.all(catalog, isProductCustomizationEnabled)
      catalog: categories + products
      flag: business_settings OTRA VEZ
  → if ON: getPublicCustomizationSummariesForProducts
      → flag OTRA VEZ
      → products by ids OTRA VEZ
      → Promise.all(assignments/groups/options/overrides/upsells)
      → waterfall suggested products
```

**Calls antes (source-inferred audit):** ~7 OFF / ~16 ON · settings 3–4 · products 2 (+ suggested)

## 6. Data path después

```txt
layout/page: getRequestPublicBusiness (React.cache)
  → businesses
  → business_settings (schedule + on_demand + product_customization_enabled)
  → isBusinessAcceptingPublicOrders({ onDemandModeActive }) → solo store_sessions

getPublicCatalogPageData(business):
  → getPublicCatalogByBusinessId (categories + products)
  → productCustomizationEnabled = business.product_customization_enabled
  → if ON: getPublicCustomizationSummariesForProducts({
        productCustomizationEnabled: true,
        products: catalogProducts,
        reuseProductsForSuggested: true
     })
      → NO settings
      → NO products re-fetch
      → Promise.all(assignments/groups/options/overrides/upsells)
      → NO suggested products query (reuso catálogo)
```

Modal action (`getPublicProductCustomizationConfig`) intacta: sigue fall-closed + corpus on-demand (puede fetch suggested missing).

## 7. Server calls antes/después

| Métrica | Antes audit | Después | Resultado | Fuente |
|---------|------------:|--------:|-----------|--------|
| Queries flag OFF | ~7 | ~5 | mejora | source-inferred |
| Queries flag ON | ~16 | ~11 | mejora | source-inferred |
| business_settings reads | 3–4 | 1 | mejora | source-inferred |
| products reads (page ON) | 2 (+ suggested) | 1 | mejora | source-inferred |
| customization flag reads (page) | 2 | 0 extras (campo business) | mejora | source-inferred |
| Client catalog re-fetch | 0 | 0 | sin regresión | runtime |
| Customization modal action | bajo demanda | igual | sin cambio | code |

Desglose OFF (~5): businesses, settings, store_sessions, categories, products.  
Desglose ON (~11): OFF + assignments, groups, options, overrides, upsell_groups, upsell_items.

## 8. Customization summaries

- API extendida backward-compatible: `productCustomizationEnabled?`, `products?`, `reuseProductsForSuggested?`.
- Page path usa productos disponibles del catálogo como `ProductRow` (`is_available: true`).
- Equivalencia QA demo: 16 productos, 5 categorías, `Desde` en BBQ Bacon / Doble Smash, modal Papas/Salsas/Agregados + Plus Coca.

## 9. Render / hydration improvements

```txt
ProductCard memo + displayName
callbacks estables: onOpen/Add/Increment/Decrement(productId)
quantityByProductId (useMemo)
requiresCustomizationByProductId (useMemo)
cart re-render scope: solo cards cuyo `quantity` cambia
```

Documentación: **source-level improvement** + runtime smoke. React Profiler no usado.

## 10. Runtime QA público

Local `http://127.0.0.1:3020/b/demohamburgueseria/catalogo`:

| Check | Resultado |
|-------|-----------|
| Catálogo carga | PASS |
| 16 productos / 5 categorías | PASS |
| Scroll / nav categorías | PASS (smoke) |
| Agregar Coca Cola (simple) | PASS · cart bar 1 × $3000 |
| Agregar Doble Smash → modal | PASS |
| Papas/Salsas/Agregados/Plus | PASS |
| Cart sheet + qty | PASS |
| Público sin pan/cursor preview | PASS (no `orderopsPreview`) |
| Pedido real | no creado |

## 11. Preview regression

`/admin/products/preview` (auth disponible local):

| Check | Resultado |
|-------|-----------|
| Shell preview carga | PASS |
| iframe `?orderopsPreview=1` | PASS · 16 products · 2 Desde |
| Agregar en preview | PASS · cart bar preview |
| Vaciar carrito → 0 | PASS |
| Checkout preview bloqueado | no re-probado end-to-end (shell “confirmación deshabilitada” intacta; no se modificó preview) |
| cursor/pan | presente en iframe preview (gated) |

## 12. Checkout boundary

`/b/demohamburgueseria/checkout` tras agregar desde catálogo:

- Botón **Enviar pedido** visible
- Sin mensaje preview
- Resumen: Coca Cola + Doble Smash (Papas chicas)
- **No** se envió pedido

## 13. Seguridad / no-regression

```txt
No DB
No RLS
No RPC SQL
No cache/revalidation / unstable_cache
No checkout action
No carrito schema
No preview admin logic
No CSP
No pedidos reales
Fail-closed customization preservado
Tenancy por business_id / slug server-side intacto
```

## 14. Resultado de comandos

```txt
git branch: main @ 4dd5dce (working tree dirty — fase + docs previos)
npx tsc --noEmit → PASS
npm run build → PASS
npm run lint → FAIL (histórico ESLint circular configs.flat.plugins.react)
```

## 15. Deuda residual

| Prioridad | Deuda |
|-----------|-------|
| P2 | Corpus still loads **all** tenant groups/options (no filter por assigned ids) |
| P2 | `noStore()` global en loaders públicos — candidato `PUBLIC-CATALOG-CACHE-STRATEGY-1` |
| P2 | Scroll/jank glass (`backdrop-filter`) — `PUBLIC-CATALOG-SCROLL-JANK-POLISH-1` |
| P3 | Preview hooks/CSS en module graph público (gated; no split trivial seguro) |
| P3 | Supabase Image Transformations infra (403 FeatureNotEnabled) — fuera de esta fase |

## 16. Rollback

```bash
git checkout -- lib/business/public.ts lib/store-sessions/public.server.ts lib/product-customization/flags.ts lib/product-customization/public.ts lib/catalog/public-page-data.ts components/public/catalog/public-catalog-page.tsx components/public/catalog/catalog-client.tsx components/public/catalog/product-card.tsx docs/CURRENT_PHASE.md ORDEROPS_LIVING_MEMORY.md
rm -f lib/catalog/public-page-data.ts docs/public-catalog-performance-fix-1.md
```

Sin DB rollback. Sin Supabase rollback.

## 17. Próximo paso

```txt
PUBLIC-CATALOG-CACHE-STRATEGY-1
```

(alternativa UX: `PUBLIC-CATALOG-SCROLL-JANK-POLISH-1`)
