# PUBLIC-CATALOG-CACHE-STRATEGY-1 — Public Catalog Data Cache Strategy & Safe Invalidation

## 1. Estado

```txt
PASS WITH RESIDUAL CACHE DEBT
```

Fecha: 2026-07-29  
Branch: `main`  
HEAD base: `c9a107b`  
CLI: `tsc` PASS · `build` PASS · `lint` FAIL (ESLint circular histórico)

Sin deploy / commit / push. Sin DB/RLS/RPC/checkout action/carrito schema/preview logic.

## 2. Resumen ejecutivo

Se implementó cache de datos estables del catálogo público con `unstable_cache` (TTL 60s + tags), separado del estado fresco de aceptación de pedidos (`noStore` + store sessions). Invalidación centralizada vía `revalidatePublicCatalogCache` (`updateTag` + `revalidatePath`) desde products/categories/settings públicos/operations/customizations.

## 3. Problema atacado

```txt
P2 — noStore global / cache strategy
```

Antes: cada request de `/catalogo` pegaba DB para branding, productos y summaries.  
Ahora: esos datos son cacheables; ordering status sigue fresco.

## 4. Archivos modificados

**Creados**

- `lib/catalog/public-cache-tags.ts`
- `lib/catalog/public-cached-data.ts`
- `docs/public-catalog-cache-strategy-1.md`

**Modificados**

- `lib/catalog/public-page-data.ts`
- `lib/catalog/public.ts`
- `lib/business/public.ts`
- `lib/store-sessions/public.server.ts`
- `lib/product-customization/public.ts`
- `app/b/[slug]/catalogo/page.tsx`
- `components/public/catalog/public-catalog-page.tsx`
- `app/admin/(protected)/products/actions.ts`
- `app/admin/(protected)/categories/actions.ts`
- `app/admin/(protected)/settings/public/actions.ts`
- `app/admin/(protected)/settings/operations/actions.ts`
- `app/admin/(protected)/products/customizations/actions.ts`
- `docs/CURRENT_PHASE.md`
- `ORDEROPS_LIVING_MEMORY.md`

## 5. Cache boundaries

### Cacheado (TTL 60s + tags)

```txt
business branding/copy/theme
scheduled delivery rules (estables)
product_customization_enabled
categories
available products (price/image/name)
customization summaries (Desde / hasUpsell / …)
```

### Fresco / no cacheado

```txt
store_sessions open/closed
on_demand live acceptance → PublicBusiness.on_demand_mode_active
getFreshPublicOrderingStatus / isBusinessAcceptingPublicOrders (noStore)
checkout validation / create_order
modal getPublicProductCustomizationConfig (sigue noStore)
preview cookie / preview guard
```

## 6. Tags e invalidación

| Tag | Helper |
|-----|--------|
| `public-business:{slug}` | `publicBusinessTag` |
| `public-catalog:{businessId}` | `publicCatalogTag` |
| `public-customization:{businessId}` | `publicCustomizationTag` |

Helper central:

```ts
revalidatePublicCatalogCache({ businessId, slug, previousSlug?, scope })
```

Usa `updateTag` (Next 16 Server Actions, invalidación inmediata) + `revalidatePath(/b/{slug}/catalogo)` (+ landing si scope business).

## 7. Data path antes

```txt
getRequestPublicBusiness → noStore business + settings + acceptance
getPublicCatalogPageData(business) → noStore catalog + summaries
```

## 8. Data path después

```txt
layout: getPublicBusinessBySlug
  → getCachedPublicBusinessStable(slug)
  → getFreshPublicOrderingStatus(businessId)  // noStore

catalogo page: getPublicCatalogPageData(slug)
  → getCachedPublicCatalogPageStableData
      business stable + catalog rows + enriched summaries
  → getFreshPublicOrderingStatus overlay
```

Loaders cacheados usan **service client** (sin cookies) para ser válidos dentro de `unstable_cache`.

## 9. Fresh ordering status

Confirmado:

- `isBusinessAcceptingPublicOrders` llama `noStore()`
- Alias `getFreshPublicOrderingStatus`
- `PublicBusiness.on_demand_mode_active` siempre overlay fresco
- Stable cache guarda placeholder `false` para ese campo
- Store session open/close **no** invalida tags de catálogo estable (solo path revalidate existente en dashboard) — acceptance no depende del cache

Checkout action no se tocó; sigue validando server-side.

## 10. Admin invalidation coverage

| Acción | Archivo | Catálogo | Customization | Path | Estado |
|--------|---------|---------:|--------------:|-----:|--------|
| create/update/availability product | products/actions | sí | sí (scope catalog) | sí | PASS |
| create/update category | categories/actions | sí | sí | sí | PASS |
| public branding/hero | settings/public/actions | business | — | sí | PASS |
| scheduled rules | settings/operations/actions | business | — | sí | PASS |
| all customization mutations | customizations/actions | sí | sí | sí | PASS |
| store session open/close | dashboard/actions | path only | — | sí | OK (fresh status) |
| product_customization_enabled toggle | — | — | — | — | P2: no tenant action UI |
| slug rename | — | — | — | — | P2: no slug edit in public settings |

## 11. Runtime QA público

Local `:3021` `/b/demohamburgueseria/catalogo`:

| Check | Resultado |
|-------|-----------|
| Carga 1ª y 2ª | PASS · 16 productos / 5 categorías |
| Desde BBQ/Doble Smash | PASS |
| Agregar Unidad | PASS |
| Modal Doble Smash + Plus | PASS |
| Cart bar | PASS |
| Sin pan público | PASS |
| Pedido real | no creado |

## 12. Preview regression

`/admin/products/preview`: iframe 16/2 Desde; Agregar Mozzarella OK; Vaciar → 0; shell “confirmación deshabilitada”. Sin cambios de lógica preview.

## 13. Checkout boundary

`/b/demohamburgueseria/checkout`: **Enviar pedido** visible; Unidad en resumen; sin mensaje preview; **no enviado**.

## 14. Seguridad / no-regression

```txt
No DB
No RLS
No RPC SQL
No checkout action
No carrito schema
No preview admin logic
No CSP changes
No pedidos reales
Fail-closed customization preservado (flag antes de corpus)
Service role solo server-only, filtrado por business_id
```

## 15. Resultado de comandos

```txt
git: main @ c9a107b (dirty — esta fase + docs ajenos)
npx tsc --noEmit → PASS
npm run build → PASS
npm run lint → FAIL (ESLint circular histórico)
```

## 16. Deuda residual

| Prioridad | Ítem |
|-----------|------|
| P2 | Toggle `product_customization_enabled` sin action tenant (invalidar si se expone UI) |
| P2 | Rename slug: invalidar previousSlug cuando exista action |
| P2 | Corpus still loads all groups/options |
| P2 | Scroll/jank glass |
| P2 | Image Transforms infra 403 |
| P3 | Preview hooks en graph público |
| P3 | Medición TTFB prod post-deploy |

## 17. Rollback

```bash
git checkout -- \
  lib/catalog/public-page-data.ts \
  lib/catalog/public.ts \
  lib/catalog/public-cache-tags.ts \
  lib/catalog/public-cached-data.ts \
  lib/business/public.ts \
  lib/store-sessions/public.server.ts \
  lib/product-customization/public.ts \
  app/b/[slug]/catalogo/page.tsx \
  components/public/catalog/public-catalog-page.tsx \
  app/admin/(protected)/products/actions.ts \
  app/admin/(protected)/categories/actions.ts \
  app/admin/(protected)/settings/public/actions.ts \
  app/admin/(protected)/settings/operations/actions.ts \
  app/admin/(protected)/products/customizations/actions.ts \
  docs/CURRENT_PHASE.md \
  ORDEROPS_LIVING_MEMORY.md

rm -f lib/catalog/public-cache-tags.ts lib/catalog/public-cached-data.ts docs/public-catalog-cache-strategy-1.md
```

Sin DB rollback.

## 18. Próximo paso

```txt
PUBLIC-CATALOG-CACHE-DEPLOY-1
```
