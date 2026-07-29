# PUBLIC-CATALOG-ROADMAP-DEPLOY-1 — Controlled Deploy for Public Catalog Roadmap Package

## 1. Estado

```txt
DEPLOYED WITH NON-BLOCKING QA DEBT
```

Fecha: 2026-07-29  
Branch: `main`  
HEAD base pre-paquete: `9fae258`  
Commit funcional: `fb19a3a`  
Deploy: `https://orderops.vercel.app`  
Modo: consolidación (sin features nuevas)

## 2. Resumen ejecutivo

Se desplegó el paquete agrupado del roadmap de catálogo público: scroll mobile polish, corpus customization filtrado, UX de conversión y observability foundation privacy-safe. Image Transforms queda como deuda infra (`FeatureNotEnabled`) hasta autorización. Producción smokeada en catálogo, observability debug, checkout boundary y preview admin según auth disponible. Sin DB/RLS/RPC/checkout action/carrito schema/cache strategy/preview logic/CSP/pedidos reales.

## 3. Paquete desplegado

```txt
PUBLIC-CATALOG-SCROLL-JANK-POLISH-1
PUBLIC-CATALOG-CORPUS-OVERFETCH-FIX-1
PUBLIC-CATALOG-IMAGE-TRANSFORMS-INFRA-1 (docs only)
PUBLIC-CATALOG-CONVERSION-UX-POLISH-1
PUBLIC-CATALOG-OBSERVABILITY-1
```

## 4. Commits

| Tipo | Hash | Mensaje |
| ---- | ---- | ------- |
| funcional | `fb19a3a` | Polish public catalog experience and observability |
| docs | (este commit) | Document public catalog roadmap deploy |

Push funcional: `9fae258..fb19a3a` → `origin/main`

## 5. Archivos incluidos

**CSS**

- `app/globals.css`
- `components/public/catalog/cart-sheet.module.css`
- `components/public/catalog/customization-modal.module.css`

**Componentes**

- `components/public/catalog/product-card.tsx`
- `components/public/catalog/product-detail-modal.tsx`
- `components/public/catalog/cart-bar.tsx`
- `components/public/catalog/cart-sheet.tsx`
- `components/public/catalog/customization-modal.tsx`
- `components/public/catalog/catalog-client.tsx`
- `components/public/catalog/public-catalog-page.tsx`
- `components/public/catalog/public-catalog-observability.tsx`
- `components/product-customization/shared/customization-option-group.tsx`

**lib / api**

- `lib/product-customization/public.ts`
- `lib/catalog/public-cached-data.ts`
- `lib/observability/public-catalog-metrics.ts`
- `app/api/observability/public-catalog/route.ts`

**Docs**

- `docs/public-catalog-scroll-jank-polish-1.md`
- `docs/public-catalog-corpus-overfetch-fix-1.md`
- `docs/public-catalog-image-transforms-infra-1.md`
- `docs/public-catalog-conversion-ux-polish-1.md`
- `docs/public-catalog-observability-1.md`
- `docs/CURRENT_PHASE.md`
- `ORDEROPS_LIVING_MEMORY.md`
- `docs/public-catalog-roadmap-deploy-1.md` (este doc, commit docs)

**Excluidos deliberadamente del stage**

- `docs/admin-catalog-preview-mobile-feel-deploy-1.md` (out of scope)
- `tsconfig.tsbuildinfo`
- docs históricos untracked no pertenecientes al paquete
- `tmp/`

## 6. Preflight / dirty tree

```txt
branch: main
HEAD pre-commit: 9fae258
dirty package: scroll + corpus + UX + observability + phase docs
unexpected (no stageado): admin-catalog-preview-mobile-feel-deploy-1.md (+2/-1), tsconfig.tsbuildinfo, docs históricos untracked
```

Env observability Vercel: **no tocado** (sin autorización `AUTORIZO_PUBLIC_CATALOG_OBSERVABILITY_PROD_ENABLE`). Debug `?orderopsMetrics=1` disponible; prod normal sin beacons si flag off.

## 7. Source validation

| Área | Resultado |
| ---- | --------- |
| Scroll | mobile `backdrop-filter: none` en sticky/fixed; desktop ≥768px glass moderado |
| Corpus | `loadPublicCustomizationSummariesForCatalogProducts` summary-lite; cache tags/TTL no cambiados en este commit |
| Transforms | sin cambios de loader; docs infra debt |
| UX | CTA Agregar / Elegir opciones; Obligatorio; Agregar al pedido |
| Observability | client retorna `null`; montado solo en `public-catalog-page`; endpoint sin DB/auth/cookies |

## 8. Local QA

```txt
tsc PASS
build PASS (incluye /api/observability/public-catalog)
lint FAIL (ESLint circular histórico)
catalog local 200 · Elegir opciones / Agregar visibles
metrics POST local 204
checkout local 200
preview local 307 → /admin/login (UNVERIFIED auth)
```

## 9. Deploy

```txt
git push origin main → 9fae258..fb19a3a
Vercel CLI: unavailable (sin token/credentials)
Producción: https://orderops.vercel.app
Poll: catalog=200 · metrics=204 · Elegir opciones=True → DEPLOY_LIVE
```

## 10. Production catalog smoke

```txt
HTTP 200
5 categorías · ~16 productos
Estamos tomando pedidos
Agregar / Elegir opciones (BBQ Bacon, Doble Smash)
Personalizalo antes de agregar
cart bar visible
sin pedido real
```

## 11. Production observability smoke

```txt
?orderopsMetrics=1
POST /api/observability/public-catalog → 204
browser beacons: 4
payload privacy-safe (allowlist + sanitize)
sin cookies/auth/cart/product IDs en contract
NEXT_PUBLIC flag no seteada → beacons solo en debug
```

## 12. Checkout boundary

```txt
/b/demohamburgueseria/checkout
Enviar pedido visible
items/adicionales correctos (sesión browser)
no pedido enviado
```

## 13. Preview regression

```txt
/admin/products/preview → 307 /admin/login
UNVERIFIED — auth unavailable
CSP frame-ancestors 'self' en preview redirect
```

## 14. Headers / CSP

| Path | Status | CSP | X-Frame-Options |
| ---- | -----: | --- | --------------- |
| `/b/.../catalogo` | 200 | `frame-ancestors 'self'` | null |
| `/b/.../checkout` | 200 | `frame-ancestors 'self'` | null |
| `/admin/products/preview` | 307 | `frame-ancestors 'self'` | null |

Sin cambios CSP en esta fase.

## 15. Performance sanity

Clasificación: **measured** (CDP prod con debug)

```txt
ttfb ≈ 37 ms
domContentLoaded ≈ 1008 ms
load ≈ 1980 ms
storage resources ≈ 36
render resource attempts ≈ 18
object resources ≈ 18
currentSrc render=0 / object=19
```

Sin claim de mejora vs baseline previo.

## 16. Seguridad / no-regression

```txt
No DB
No RLS
No RPC SQL
No checkout action
No create_order
No carrito schema
No cache strategy changes
No preview admin logic
No CSP changes
No pedidos reales
No analytics externo
No Vercel env observability tocado
```

## 17. Resultado de comandos

```txt
npx tsc --noEmit → PASS
npm run build → PASS
npm run lint → FAIL (circular histórico)
git push origin main → OK (fb19a3a)
prod metrics POST → 204
prod catalog → 200
```

## 18. Deuda residual

| ID | Severidad | Deuda |
| -- | --------: | ----- |
| P2 | infra | Image Transforms `FeatureNotEnabled` (render 403; object 200 ~940 KB logo) |
| P2 | QA | Preview admin auth unavailable |
| P2 | ops | Observability prod env no habilitada (debug-only) |
| P2 | QA | Mutation cache invalidation smoke (previo) |
| P3 | tooling | ESLint circular histórico |
| P3 | device | Android scroll device QA |

## 19. Rollback

```bash
git revert fb19a3a
git push origin main
# opcional docs:
git revert <docs_commit_hash>
git push origin main
```

Sin rollback DB/Supabase. No borrar pedidos. No revertir cache deploy previo salvo diagnóstico explícito.

## 20. Próximo paso

```txt
PUBLIC-CATALOG-FINAL-HANDOFF-1
```
