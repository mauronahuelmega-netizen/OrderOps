# PUBLIC-CATALOG-CACHE-DEPLOY-1 — Controlled Deploy for Public Catalog Cache Strategy

## 1. Estado

```txt
DEPLOYED WITH NON-BLOCKING QA DEBT
```

Fecha: 2026-07-29  
Branch: `main`  
Commit funcional: `81ae607`  
Deploy URL: `https://orderops.vercel.app`  
CLI local: `tsc` PASS · `build` PASS · `lint` FAIL (ESLint circular histórico)

## 2. Resumen ejecutivo

Se desplegó la estrategia de cache segura del catálogo público: datos estables cacheados con `unstable_cache` (TTL 60s + tags), aceptación de pedidos separada y fresca con `noStore`, e invalidación centralizada `revalidatePublicCatalogCache` desde Server Actions admin. Smoke productivo en catálogo, checkout boundary (sin pedido) y preview admin. Sin mutaciones productivas de catálogo ni de store session (sin autorización explícita). Sin DB/RLS/RPC/checkout action/carrito schema/preview logic/CSP.

## 3. Alcance desplegado

```txt
PUBLIC-CATALOG-CACHE-STRATEGY-1
```

Superficie: `/b/[slug]/catalogo`  
Sin: features nuevas, ampliación de scope de cache, checkout/`create_order`, DB/RLS/RPC, migraciones, CSP, PWA, imágenes/transforms, scroll/jank, pedidos reales.

## 4. Commits y deploy

| Item | Valor |
|------|-------|
| Base HEAD | `c9a107b` |
| Commit funcional | `81ae607` — *Cache public catalog data safely* |
| Push | `c9a107b..81ae607` → `origin/main` |
| Deploy | Vercel production `https://orderops.vercel.app` (Age:0 / X-Vercel-Cache:MISS en document; Data Cache interno) |
| Vercel CLI | no credentials / no usable — validado por producción directa |
| Commit docs | (este doc + CURRENT_PHASE + LIVING_MEMORY) |

## 5. Archivos incluidos

**Código (commit funcional `81ae607`)**

- `lib/catalog/public-cache-tags.ts` (nuevo)
- `lib/catalog/public-cached-data.ts` (nuevo)
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

**Docs (commit funcional)**

- `docs/public-catalog-cache-strategy-1.md`
- `docs/CURRENT_PHASE.md`
- `ORDEROPS_LIVING_MEMORY.md`

**Docs (este commit)**

- `docs/public-catalog-cache-deploy-1.md`
- `docs/CURRENT_PHASE.md`
- `ORDEROPS_LIVING_MEMORY.md`

**Excluidos (dirty local ajeno)**

- `docs/admin-catalog-preview-*`, product-customization/stock docs, forensic audit, `tmp/`, `tsconfig.tsbuildinfo`

## 6. Validación local

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `npm run lint` | FAIL — ESLint circular histórico `configs.flat.plugins.react` |
| Runtime local `:3021` | PASS — 16 productos / Desde BBQ+Doble Smash / cart / checkout **Enviar pedido** sin enviar |
| Preview local | UNVERIFIED — auth unavailable en smoke local previo; prod sí |

## 7. Source checklist

| Check | Resultado |
|-------|-----------|
| `public-cached-data.ts` + `unstable_cache` TTL 60s | PASS |
| Loader cacheado usa service client (sin `cookies()`/`headers()`) | PASS |
| Cached: branding, scheduled rules, flag customization, categories, products, summaries | PASS |
| NOT cached: store sessions / live acceptance / checkout / create_order / preview cookie | PASS |
| `getFreshPublicOrderingStatus` / `isBusinessAcceptingPublicOrders` → `noStore()` | PASS |
| `PublicBusiness.on_demand_mode_active` overlay fresco | PASS |
| Tags: `public-business:{slug}`, `public-catalog:{businessId}`, `public-customization:{businessId}` | PASS |
| `updateTag` solo en `revalidatePublicCatalogCache` (Server Actions) | PASS — único uso en repo |
| Checkout action / `create_order` | no tocados |

### Admin invalidation coverage

| Surface | Scope | Tags / path |
|---------|-------|-------------|
| products actions | `catalog` | catalog + customization + `/b/{slug}/catalogo` |
| categories actions | `catalog` | catalog + customization + path |
| settings public actions | `business` | business + path (+ landing si business) |
| settings operations actions | `business` | business + path |
| customizations actions | `customization` | customization + catalog + path |
| store session open/close | n/a | no tags estables; status fresco vía `noStore` |

## 8. Smoke producción catálogo

URL: `https://orderops.vercel.app/b/demohamburgueseria/catalogo`

| Check | Resultado |
|-------|-----------|
| Catálogo carga | PASS |
| 16 productos / categorías | PASS |
| Cover/logo/thumbs | PASS (object/public fallback) |
| Desde BBQ / Doble Smash | PASS |
| Agregar simple + cart bar/sheet | PASS |
| Modal customization (Papas/Salsas/Agregados/Plus) | PASS |
| Sin cursor/pan público normal | PASS |
| Pedido real | **NO** creado |

## 9. Cache behavior producción

| Check | Resultado |
|-------|-----------|
| Primera carga | PASS · document 200 |
| Segunda carga / hard reload | PASS · sin errores client |
| Dynamic server usage / cookies en cache | sin errores |
| Stale obvio de menú | no observado |
| `x-vercel-cache HIT` | no exigido (página dinámica + Data Cache) |

```txt
source-level cache OK
runtime smoke OK
medición real TTFB: measured (ligera; ver §15)
```

## 10. Fresh ordering status

| Check | Resultado |
|-------|-----------|
| Source-level `noStore` acceptance helpers | PASS |
| Checkout muestra **Enviar pedido** (acceptance activa) | PASS |
| `create_order` no modificado | PASS |
| Runtime mutation open/close sesión prod | **UNVERIFIED** — no `AUTORIZO_CACHE_ORDERING_STATUS_PROD_SMOKE=yes` |

```txt
ordering status runtime mutation UNVERIFIED — no prod session mutation authorized
source-level PASS
checkout boundary PASS
```

## 11. Admin invalidation smoke

| Check | Resultado |
|-------|-----------|
| Source-level coverage (tabla §7) | PASS |
| Runtime mutation reversible prod | **UNVERIFIED** — no `AUTORIZO_CACHE_INVALIDATION_PROD_SMOKE=yes` |
| TTL fallback | 60s |

```txt
admin invalidation runtime mutation UNVERIFIED — no prod catalog mutation authorized
source-level coverage PASS
TTL fallback 60s
```

## 12. Smoke checkout boundary

URL: `https://orderops.vercel.app/b/demohamburgueseria/checkout`

| Check | Resultado |
|-------|-----------|
| **Enviar pedido** visible | PASS |
| Sin mensaje preview | PASS |
| Items correctos | PASS |
| Pedido enviado | **NO** |

## 13. Smoke preview admin

URL: `https://orderops.vercel.app/admin/products/preview` (auth disponible en browser)

| Check | Resultado |
|-------|-----------|
| Shell + iframe `?orderopsPreview=1` | PASS · productos · 2 Desde |
| Agregar preview | PASS |
| Vaciar carrito → `0 productos` / `$0` | PASS |
| Checkout preview | PASS — botón **Confirmación deshabilitada** (disabled); copy “confirmación… deshabilitada en la vista previa” |
| cursor/pan preview | PASS — `data-preview-pan-ignore` / gated presente |
| Pedido real | **NO** |

## 14. Headers / CSP

| URL | Status | CSP |
|-----|--------|-----|
| `/b/demohamburgueseria/catalogo` | 200 | `frame-ancestors 'self'` |
| `/b/demohamburgueseria/checkout` | 200 | `frame-ancestors 'self'` |
| `/admin/products/preview` (sin cookie curl) | 307 → `/admin/login` | `frame-ancestors 'self'` |

Confirmado: no `X-Frame-Options: DENY`; no `frame-ancestors *`.

## 15. Performance sanity

| Métrica | Valor | Clasificación |
|---------|-------|---------------|
| Document status | 200 | measured |
| TTFB aprox. (navigation timing) | ~35 ms | measured (ligera; no reclamar mejora definitiva) |
| DOMContentLoaded | ~3271 ms | measured |
| Load | ~3939 ms | measured |
| Errores client críticos | ninguno observado | measured |
| Mejora vs pre-cache | no baseline comparable en este smoke | source-inferred / unavailable para claim |

## 16. Seguridad / no-regression

```txt
No DB
No RLS
No RPC SQL
No checkout action
No carrito schema
No preview admin logic
No CSP changes
No pedidos reales
No migraciones
No writes productivos de catálogo
No open/close sesión productiva
```

## 17. Deuda residual

| ID | Deuda | Severidad |
|----|-------|-----------|
| — | Runtime mutation smoke ordering status (sin auth env) | P3 QA |
| — | Runtime mutation smoke admin invalidation (sin auth env) | P3 QA |
| P2 | `product_customization_enabled` toggle sin UI tenant | P2 |
| P2 | slug rename: invalidar `previousSlug` cuando exista action | P2 |
| P2 | corpus todavía carga all groups/options | P2 |
| P2 | scroll/jank glass | P2 |
| P2 | Supabase Image Transformations 403 FeatureNotEnabled | P2 |
| P3 | preview hooks en graph público | P3 |
| P3 | medición TTFB prod más rigurosa | P3 |
| P3 | lint circular histórico | P3 |

## 18. Rollback

Si bug productivo de cache/stale/acceptance:

```bash
git revert 81ae607
git push origin main
```

Si también se revirtió docs:

```bash
git revert <docs-commit>
git push origin main
```

Sin DB/Supabase rollback. Sin borrar pedidos.

## 19. Resultado final

```txt
DEPLOYED WITH NON-BLOCKING QA DEBT
```

Deploy live, smoke crítico PASS (catálogo, checkout boundary, preview, CSP, source-level cache/invalidation/fresh ordering). Deuda no bloqueante: mutaciones productivas de invalidation/ordering sin autorización, Image Transforms infra, corpus overfetch, scroll/jank, lint histórico.

## 20. Próximo paso

```txt
PUBLIC-CATALOG-CACHE-INVALIDATION-QA-1
```

Alternativas: `PUBLIC-CATALOG-SCROLL-JANK-POLISH-1` · `PUBLIC-CATALOG-CORPUS-OVERFETCH-FIX-1`
