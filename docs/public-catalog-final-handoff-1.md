# PUBLIC-CATALOG-FINAL-HANDOFF-1 — Public Catalog V1 Final Technical & Product Handoff

## 1. Estado final

```txt
FEATURE CLOSED — DEPLOYED WITH NON-BLOCKING QA DEBT
```

Fecha: 2026-07-29  
Branch: `main`  
HEAD al cerrar: `5dd9b41`  
Deploy live: `https://orderops.vercel.app`  
Último paquete funcional: `fb19a3a` (*Polish public catalog experience and observability*)  
Último deploy docs roadmap: `55f866f` (+ stamp `5dd9b41`)  
Superficie: `/b/[slug]/catalogo`

Esta fase es **documental**: sin cambios runtime, sin deploy, sin commit/push.

## 2. Resumen ejecutivo

El roadmap V1 del catálogo público está **cerrado y live**. La arquitectura final combina:

- datos estables cacheados (TTL 60s + tags) + aceptación de pedidos **fresca** (`noStore`)
- Product Customization **summary-lite** en catálogo + modal **on-demand**
- imágenes con `next/image` / `PublicStorageImage` (transform primary → object fallback)
- UX de compra clara (Agregar vs Elegir opciones, modal/cart copy)
- scroll mobile sin blur pesado en sticky/fixed
- observability privacy-safe (debug `?orderopsMetrics=1`, endpoint 204)

Producción verificada en el deploy roadmap. Deuda no bloqueante: Image Transforms `FeatureNotEnabled`, preview auth/device, observability prod env, mutation cache runtime QA, lint circular, device QA.

## 3. Alcance cerrado

### En producción (deploys)

| Deploy | Commit funcional | Contenido |
| ------ | ---------------- | --------- |
| PUBLIC-CATALOG-PERFORMANCE-DEPLOY-1 | `2b60bb3` | images + transforms QA fix + performance fix |
| PUBLIC-CATALOG-CACHE-DEPLOY-1 | `81ae607` | unstable_cache + tags + fresh ordering + invalidation |
| PUBLIC-CATALOG-ROADMAP-DEPLOY-1 | `fb19a3a` | scroll + corpus summary-lite + UX + observability + transforms infra docs |

### Explicitamente fuera de alcance V1 (no reabrir aquí)

```txt
DB / RLS / RPC / migraciones
checkout action / create_order
cart schema / localStorage keys
pricing server rules
stock server rules
CSP / PWA
habilitar Supabase Image Transformations (requiere auth billing)
analytics externos
```

## 4. Línea temporal del roadmap

| Fase | Estado | Qué resolvió | Deploy/commit | Deuda |
| ---- | ------ | ------------ | ------------- | ----- |
| PUBLIC-CATALOG-PERFORMANCE-FORENSIC-AUDIT-1 | NEEDS PERFORMANCE FIX | Audit forense: noStore, imgs raw, re-renders, glass jank | docs (local; ver §20) | baseline P1 perf |
| PUBLIC-CATALOG-IMAGE-OPTIMIZATION-1 | PASS (con deuda image) | `next/image` + PublicStorageImage cover/logo/thumbs/detail | en `2b60bb3` | transforms infra |
| PUBLIC-CATALOG-IMAGE-TRANSFORMS-QA-FIX-1 | PASS WITH INFRA IMAGE DEBT | Confirmó 403 FeatureNotEnabled; reset fallback on src | en `2b60bb3` | FeatureNotEnabled |
| PUBLIC-CATALOG-PERFORMANCE-FIX-1 | PASS WITH RESIDUAL PERFORMANCE DEBT | `public-page-data`, dedupe settings/flag, memo ProductCard | en `2b60bb3` | corpus overfetch, noStore, scroll |
| PUBLIC-CATALOG-PERFORMANCE-DEPLOY-1 | DEPLOYED WITH NON-BLOCKING QA DEBT | Deploy paquete performance | `2b60bb3` | transforms, corpus, scroll, noStore |
| PUBLIC-CATALOG-CACHE-STRATEGY-1 | PASS WITH RESIDUAL CACHE DEBT | TTL 60s + tags + fresh acceptance + revalidate helper | en `81ae607` | mutation QA, slug |
| PUBLIC-CATALOG-CACHE-DEPLOY-1 | DEPLOYED WITH NON-BLOCKING QA DEBT | Deploy cache strategy | `81ae607` / docs `9fae258` | mutation invalidation smoke |
| PUBLIC-CATALOG-CACHE-INVALIDATION-QA-1 | PASS WITH MUTATION QA DEBT | Source audit tags/actions; smoke sin mutaciones | docs (local; ver §20) | runtime mutation smoke |
| PUBLIC-CATALOG-SCROLL-JANK-POLISH-1 | PASS WITH DEVICE QA DEBT | Mobile sin blur pesado; desktop glass moderado | en `fb19a3a` | real device QA |
| PUBLIC-CATALOG-CORPUS-OVERFETCH-FIX-1 | PASS WITH PREVIEW QA DEBT | summary-lite filtrado por productos visibles | en `fb19a3a` | preview auth |
| PUBLIC-CATALOG-IMAGE-TRANSFORMS-INFRA-1 | PASS WITH INFRA AUTH DEBT | Docs/evidencia 403; sin enable infra | docs en `fb19a3a` | FeatureNotEnabled |
| PUBLIC-CATALOG-CONVERSION-UX-POLISH-1 | PASS WITH PREVIEW QA DEBT | CTAs/Desde/modal/cart copy | en `fb19a3a` | preview auth |
| PUBLIC-CATALOG-OBSERVABILITY-1 | PASS WITH PREVIEW QA DEBT | Web Vitals + endpoint 204 privacy-safe | en `fb19a3a` | prod env off |
| PUBLIC-CATALOG-ROADMAP-DEPLOY-1 | DEPLOYED WITH NON-BLOCKING QA DEBT | Deploy agrupado scroll/corpus/UX/obs | `fb19a3a` / docs `55f866f` | deudas P2/P3 listadas |
| PUBLIC-CATALOG-FINAL-HANDOFF-1 | FEATURE CLOSED — DEPLOYED WITH NON-BLOCKING QA DEBT | Handoff técnico/producto | docs-only (este doc) | residuales heredadas |

## 5. Arquitectura final

### Piezas

```txt
route /b/[slug]/catalogo
  → app/b/[slug]/catalogo/page.tsx (preview flag query)
  → PublicCatalogPageContent (server)
      → getPublicCatalogPageData
      → PublicCatalogObservability (client, returns null)
      → CatalogClient (client)
          → category nav / hero / ProductCard grid
          → ProductDetailModal / CustomizationModal (on-demand)
          → CartBar / CartSheet
          → navigate → /b/[slug]/checkout
```

### Diagrama textual

```txt
Request /b/[slug]/catalogo
  → resolve business by slug
  → load cached stable catalog data
      → business public data
      → categories/products
      → customization summaries (summary-lite)
  → overlay fresh ordering status
  → render PublicCatalogPageContent
  → hydrate CatalogClient
      → local cart
      → category nav
      → product cards
      → customization modal on demand
      → cart bar/sheet
      → checkout navigation
  → PublicCatalogObservability null component
      → Web Vitals/debug beacons when enabled
```

### Archivos ancla (no modificar sin fase explícita)

| Rol | Archivo |
| --- | ------- |
| Route | `app/b/[slug]/catalogo/page.tsx` |
| Page shell | `components/public/catalog/public-catalog-page.tsx` |
| Client UX | `components/public/catalog/catalog-client.tsx` |
| Loader | `lib/catalog/public-page-data.ts` |
| Cache | `lib/catalog/public-cached-data.ts` |
| Tags/invalidation | `lib/catalog/public-cache-tags.ts` |
| Customization public | `lib/product-customization/public.ts` |
| Metrics contract | `lib/observability/public-catalog-metrics.ts` |
| Metrics API | `app/api/observability/public-catalog/route.ts` |

## 6. Data path final

### Stable / cacheable

```txt
public business branding/settings cacheables
categories
products
prices/public availability
customization summaries (summary-lite)
product_customization_enabled flag
```

Implementación: `getCachedPublicCatalogPageStableData` (`unstable_cache`, TTL 60s, tags business/catalog/customization). Service client cookie-free.

### Fresh / non-cacheable

```txt
store session / accepting orders
on_demand_mode_active (overlay en page data)
checkout/create_order validation
stock validation
server-side price validation
preview mode guard
modal customization config (getPublicProductCustomizationConfig + noStore)
```

Implementación: `getFreshPublicOrderingStatus` overlay en `getPublicCatalogPageData`.

### Client-only

```txt
cart localStorage
preview cart isolation
category active state
modal state
debug observability console (?orderopsMetrics=1)
```

## 7. Cache e invalidation

```txt
TTL 60s (PUBLIC_CATALOG_CACHE_REVALIDATE_SECONDS)
tags public-business:{slug}
tags public-catalog:{businessId}
tags public-customization:{businessId}
revalidatePublicCatalogCache helper
updateTag + revalidatePath desde Server Actions
acceptance siempre fresh/noStore
```

### Cobertura admin (source-level)

| Área | Acción esperada |
| ---- | --------------- |
| Products | `revalidatePublicCatalogCache` scope catalog (+ customization summaries) |
| Categories | scope catalog |
| Public settings | scope business |
| Operations settings | scope business |
| Customizations | scope customization (+ catalog cuando afecta summaries) |
| Store session open/close | `revalidatePath` + fresh overlay; **no** depende de tags estables |

### Deuda cache

```txt
runtime mutation invalidation smoke pendiente sin auth env
slug rename / previousSlug — helper existe; QA runtime limitada
flag toggle UI — cobertura source; UI smoke opcional
```

## 8. Product Customization public read model

```txt
summary-lite para catálogo
filtra por productos/categorías visibles
groups/options/overrides/upsell groups/items relevantes
modal config on-demand intacta (getPublicProductCustomizationConfig)
checkout sigue validando server-side
```

Entrypoint catálogo: `loadPublicCustomizationSummariesForCatalogProducts`.

### Invariantes

```txt
Desde se mantiene
required options no cambian
Plus no reemplaza parent
cart conserva parent + additional
product overrides no modifican categoría global
flag OFF fail-closed
```

## 9. Cart / checkout boundary

```txt
Cart: client localStorage (schema no cambiado en este roadmap)
CartBar / CartSheet: UX copy V1 (cantidad/total, Ir a confirmar pedido)
Checkout: /b/[slug]/checkout
  → Enviar pedido visible
  → create_order / checkout action NO tocados por roadmap
  → precios/stock validation server-side intactos
  → observability NO montada en checkout
Preview: orderopsPreview=1; checkout preview bloqueado; cursor/pan gated
Público normal: sin cursor/pan
```

**Nunca** crear pedidos reales en fases de polish/deploy/QA de catálogo.

## 10. Images / Supabase transforms

```txt
next/image activo
PublicStorageImage
Supabase loader /render/image primary
object/public fallback onError
fallback reset por src
cover/logo/thumb/detail optimizados
```

### Deuda actual (prod evidenciada en ROADMAP-DEPLOY-1)

```txt
Supabase Image Transformations sigue 403 FeatureNotEnabled
object fallback visible (currentSrc object; logo object ~940 KB)
bytes full-res todavía altos
requiere AUTORIZO_SUPABASE_IMAGE_TRANSFORMATIONS_ENABLE=yes
fase futura: PUBLIC-CATALOG-IMAGE-TRANSFORMS-INFRA-1-MODE-B
```

## 11. UX / conversion

Mejoras activas en prod (`fb19a3a`):

```txt
CTA Agregar vs Elegir opciones
hint Personalizalo antes de agregar
Desde más claro
hero con estado operativo (role=status)
modal Armá tu pedido / Obligatorio / Agregar al pedido
cart bar con cantidad/total
cart sheet Revisá tu carrito / Ir a confirmar pedido
empty states con copy mejorado
aria-labels y role=status
```

Sin cambios de pricing ni de checkout server.

## 12. Scroll / mobile jank

```txt
mobile sin blur pesado en sticky/fixed
superficies sólidas en mobile
desktop mantiene glass moderado (≥768px)
reduced transparency/motion respetado
no cursor/pan público
preview pan/cursor sigue gated
```

### Deuda scroll

```txt
Android/iOS real device QA pendiente
medición FPS no formal
```

## 13. Observability

```txt
PublicCatalogObservability client component retorna null
useReportWebVitals
debug ?orderopsMetrics=1
POST /api/observability/public-catalog → 204
payload privacy-safe
no DB/Supabase/cookies/auth/cart/PII
NEXT_PUBLIC_ORDEROPS_PUBLIC_CATALOG_OBSERVABILITY=1 opcional
ORDEROPS_PUBLIC_CATALOG_OBSERVABILITY_LOGS=1 opcional
normal prod debug-only si env off (estado actual: env no seteada)
```

### Métricas allowlist

```txt
TTFB
FCP
LCP
CLS
INP
FID
Next.js-hydration
Next.js-route-change-to-render
Next.js-render
public_catalog_hydrated_ms
public_catalog_image_debug
```

### Deuda observability

```txt
prod env no habilitada
server logs opcionales no habilitados
error tracking global omitido
```

Autorización requerida para habilitar en Vercel:

```txt
AUTORIZO_PUBLIC_CATALOG_OBSERVABILITY_PROD_ENABLE=yes
AUTORIZO_PUBLIC_CATALOG_OBSERVABILITY_LOGS_PROD=yes
```

## 14. Seguridad / privacidad

```txt
No DB changes (en roadmap polish/handoff)
No RLS changes
No RPC SQL changes
No checkout action changes
No create_order changes
No cart schema changes
No cache strategy regression (post cache-deploy)
No preview admin logic changes
No CSP changes
No external analytics
No real orders created in deploy
```

### Tenant / privacy

```txt
server-only service usage donde corresponde (cache cookie-free)
businessId/slug scoping explícito
public metrics sin PII
checkout pricing server-side intacto
stock validation server-side intacta
CSP frame-ancestors 'self'
```

## 15. Producción / QA evidence

Evidencia de `PUBLIC-CATALOG-ROADMAP-DEPLOY-1` (`docs/public-catalog-roadmap-deploy-1.md`):

```txt
catalog 200
checkout 200
preview 307 login si auth unavailable
CSP frame-ancestors 'self'
observability debug POST 204
TTFB ~37 ms
DCL ~1008 ms
load ~1980 ms
render/image 403 FeatureNotEnabled
object fallback visible
no pedido real
```

Demo tenant usado en smokes: `demohamburgueseria` (~16 productos / 5 categorías).

## 16. Operación diaria / runbook

### Monitoreo liviano

```txt
abrir /b/demohamburgueseria/catalogo?orderopsMetrics=1
verificar beacons 204
verificar console debug safe
verificar imágenes visibles
verificar CTAs
verificar checkout boundary sin submit
```

### Cuando un owner edita productos/categorías/settings

```txt
admin action debe llamar revalidatePublicCatalogCache
public catalog debería reflejar cambio por updateTag/revalidatePath
TTL fallback 60s
si no refleja, revisar tags y previousSlug
```

### Cuando el negocio abre/cierra sesión

```txt
accepting status no debe depender de stable cache
fresh ordering status debe reflejar sesión/on_demand
checkout/create_order sigue validando server-side
```

### Cuando se habiliten Image Transforms

```txt
autorizar billing
habilitar Supabase Image Transformations
re-ejecutar PUBLIC-CATALOG-IMAGE-TRANSFORMS-INFRA-1-MODE-B
verificar render/image 200
medir bytes reales
```

## 17. Rollback

### Rollback roadmap deploy

```bash
git revert fb19a3a
git push origin main
```

### Rollback docs roadmap

```bash
git revert 55f866f
git revert 5dd9b41
git push origin main
```

### Rollback cache deploy previo

Solo si diagnóstico explícito apunta al cache deploy:

```bash
git revert 81ae607
git push origin main
```

### Rollback performance deploy (último recurso)

```bash
git revert 2b60bb3
git push origin main
```

### Rollback de este handoff (docs-only)

```bash
git checkout -- docs/CURRENT_PHASE.md ORDEROPS_LIVING_MEMORY.md
rm -f docs/public-catalog-final-handoff-1.md
```

### No aplica

```txt
sin rollback DB
sin rollback Supabase
sin borrar pedidos
sin revertir migrations históricas
```

## 18. Deuda residual priorizada

| Severidad | Deuda | Impacto | Fase sugerida |
| --------- | ----- | ------- | ------------- |
| P2 | Image Transforms FeatureNotEnabled | thumbs/cover full-res; peso alto | PUBLIC-CATALOG-IMAGE-TRANSFORMS-INFRA-1-MODE-B |
| P2 | Preview admin auth/device smoke | no cerrado en último deploy | PUBLIC-CATALOG-PREVIEW-AUTH-SMOKE-1 |
| P2 | Observability prod env no habilitada | métricas solo con debug query | PUBLIC-CATALOG-OBSERVABILITY-PROD-ENABLE-1 |
| P2 | Mutation cache invalidation runtime smoke | frescura post-edit UNVERIFIED en prod | PUBLIC-CATALOG-CACHE-MUTATION-RUNTIME-QA-2 |
| P2 | slug rename / previousSlug | edge case rename | (incluir en mutation QA) |
| P2 | flag toggle UI | cobertura source; UI smoke opcional | (incluir en mutation QA) |
| P3 | lint circular histórico | tooling | (fuera de catálogo) |
| P3 | Android/iOS real device QA | scroll/jank real | PUBLIC-CATALOG-REAL-DEVICE-QA-1 |
| P3 | error tracking global | errores client no capturados | (fase observability 2) |
| P3 | docs históricos untracked locales | forensic/cache-invalidation QA en working tree sin commit | commit docs opcional / limpieza |

## 19. Próximas fases opcionales

| Fase | Para qué |
| ---- | -------- |
| PUBLIC-CATALOG-POST-DEPLOY-MONITOR-1 | monitoreo post-deploy liviano (vitals/debug, CTAs, checkout boundary) |
| PUBLIC-CATALOG-IMAGE-TRANSFORMS-INFRA-1-MODE-B | habilitar transforms tras autorización billing |
| PUBLIC-CATALOG-PREVIEW-AUTH-SMOKE-1 | smoke iframe preview con auth |
| PUBLIC-CATALOG-CACHE-MUTATION-RUNTIME-QA-2 | mutaciones admin + invalidation runtime |
| PUBLIC-CATALOG-OBSERVABILITY-PROD-ENABLE-1 | setear env prod con autorización explícita |
| PUBLIC-CATALOG-REAL-DEVICE-QA-1 | Android/iOS scroll/jank formal |

**Recomendado inmediato:** `PUBLIC-CATALOG-POST-DEPLOY-MONITOR-1`  
**Opcional infra:** `IMAGE-TRANSFORMS-INFRA-1-MODE-B` cuando haya autorización.

## 20. Resultado de comandos

Preflight (handoff):

```txt
branch: main
HEAD: 5dd9b41
dirty: solo residuales out-of-scope (admin/product-customization docs untracked, admin-catalog-preview-mobile-feel-deploy-1.md M, tsconfig.tsbuildinfo, tmp/)
sin cambios runtime inesperados del paquete catálogo
```

Checks en esta fase:

```txt
git status --short → dirty out-of-scope only (esperado)
npx tsc --noEmit → no ejecutado (fase docs-only)
npm run build → no ejecutado (fase docs-only)
npm run lint → no ejecutado (histórico circular conocido)
```

Referencia CLI del último deploy funcional (`fb19a3a`): `tsc` PASS · `build` PASS · lint circular.

```txt
sin deploy
sin commit/push en esta fase
sin cambios de código
```
