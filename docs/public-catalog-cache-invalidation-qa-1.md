# PUBLIC-CATALOG-CACHE-INVALIDATION-QA-1 — Runtime QA for Public Catalog Cache Invalidation

## 1. Estado

```txt
PASS WITH MUTATION QA DEBT
```

Fecha: 2026-07-29  
Branch: `main`  
HEAD: `9fae258`  
Commit cache funcional: `81ae607`  
Deploy: `https://orderops.vercel.app`  
Modo: **A — Source + runtime no-write**

## 2. Resumen ejecutivo

Se validó la frescura operativa del cache del catálogo público ya desplegado: source audit de `unstable_cache`/tags/`updateTag`/`revalidatePath`, coverage de Server Actions admin, y smoke productivo en catálogo, checkout boundary y preview. Runtime mutation de invalidación admin y ordering status: **UNVERIFIED** (sin `AUTORIZO_CACHE_INVALIDATION_PROD_SMOKE` / `AUTORIZO_CACHE_ORDERING_STATUS_PROD_SMOKE`). Sin fixes de código. Sin DB/RLS/RPC/checkout action/pedidos reales/commit/push/deploy.

## 3. Alcance

```txt
Source audit + admin coverage + smoke prod no destructivo
```

Fuera de alcance: corpus overfetch, scroll/jank, Image Transforms, slug rename, flag toggle UI, nuevas features, mutaciones productivas no autorizadas.

## 4. Archivos revisados

- `docs/public-catalog-cache-strategy-1.md`
- `docs/public-catalog-cache-deploy-1.md`
- `docs/CURRENT_PHASE.md`
- `ORDEROPS_LIVING_MEMORY.md`
- `lib/catalog/public-cache-tags.ts`
- `lib/catalog/public-cached-data.ts`
- `lib/catalog/public-page-data.ts`
- `lib/catalog/public.ts`
- `lib/business/public.ts`
- `lib/store-sessions/public.server.ts`
- `lib/product-customization/public.ts`
- `app/admin/(protected)/products/actions.ts`
- `app/admin/(protected)/categories/actions.ts`
- `app/admin/(protected)/settings/public/actions.ts`
- `app/admin/(protected)/settings/operations/actions.ts`
- `app/admin/(protected)/products/customizations/actions.ts`
- `app/admin/(protected)/dashboard/actions.ts` (store session)
- `app/b/[slug]/catalogo/page.tsx`
- `components/public/catalog/public-catalog-page.tsx`
- `app/b/[slug]/checkout/actions.ts` (confirmación no tocado)

## 5. Source audit

| Check | Resultado | Evidencia |
| ----- | --------: | --------- |
| `unstable_cache` stable-only | PASS | `lib/catalog/public-cached-data.ts` L98–183 — business/catalog/summaries; acceptance no incluida |
| no cookies/headers en cache | PASS | service client `createSupabaseServiceClient` L41–42; no `cookies()`/`headers()` en `lib/catalog` ni summaries cookie-free |
| tags correctos | PASS | `public-business:{slug}`, `public-catalog:{businessId}`, `public-customization:{businessId}` en `public-cache-tags.ts` L6–17 |
| updateTag server-action only | PASS | único `updateTag` en `revalidatePublicCatalogCache` (`public-cache-tags.ts` L60–74); callers solo `"use server"` admin actions |
| ordering status noStore | PASS | `isBusinessAcceptingPublicOrders` / `getFreshPublicOrderingStatus` — `public.server.ts` L39, L103–104; overlay en `public-page-data.ts` L26–31 |
| checkout untouched | PASS | `create_order` sigue en `checkout/actions.ts`; no en commit `81ae607` |

## 6. Admin invalidation coverage

| Surface | Acción | Archivo | Scope esperado | Invalida | Estado |
| ------- | ------ | ------- | -------------- | -------- | ------ |
| Products | create / update / availability | `products/actions.ts` | catalog | catalog + customization + path | PASS |
| Categories | create / update (no reorder/delete actions en repo) | `categories/actions.ts` | catalog | catalog + customization + path | PASS |
| Public settings | branding / hero | `settings/public/actions.ts` | business | business + path (+ landing admin paths) | PASS |
| Operations settings | `updateScheduledSettings` | `settings/operations/actions.ts` | business | business + path | PASS |
| Customizations | groups/options/assignments/overrides/upsells/reorder vía `revalidateCustomizationPaths` | `customizations/actions.ts` | customization | customization + catalog + path | PASS |
| Store session | open/close `toggleBusinessStatus` | `dashboard/actions.ts` | fresh status | `revalidatePath` catalogo/checkout/layout; **no** tags estables requeridos (`noStore` acceptance) | PASS |

## 7. Smoke producción catálogo

URL: `https://orderops.vercel.app/b/demohamburgueseria/catalogo`

| Check | Resultado |
|-------|-----------|
| Catálogo carga | PASS |
| 16 productos / 5 categorías | PASS |
| Desde BBQ / Doble Smash | PASS (2× Desde) |
| Modal customization Papas/Salsas/Agregados/Plus | PASS |
| Cart bar/sheet | PASS (carrito persistido browser) |
| Sin cursor/pan público | PASS (`cursor: auto`) |
| Pedido real | **NO** |

## 8. Checkout boundary

URL: `https://orderops.vercel.app/b/demohamburgueseria/checkout`

| Check | Resultado |
|-------|-----------|
| **Enviar pedido** visible | PASS |
| Sin mensaje preview | PASS |
| Items correctos | PASS (7 productos en resumen) |
| Pedido enviado | **NO** |

## 9. Preview regression

URL: `https://orderops.vercel.app/admin/products/preview` (auth disponible)

| Check | Resultado |
|-------|-----------|
| Shell + iframe `?orderopsPreview=1` | PASS · 16 products · 2 Desde |
| Agregar preview | PASS |
| Vaciar → `0 productos` / `$0` | PASS |
| Checkout bloqueado (shell copy) | PASS — “confirmación… deshabilitada” |
| `data-preview-pan-ignore` gated | PASS |
| Pedido real | **NO** |

## 10. Runtime invalidation smoke

```txt
UNVERIFIED — no authorization
```

Motivo: no se proveyó `AUTORIZO_CACHE_INVALIDATION_PROD_SMOKE=yes`.  
Source-level coverage: **PASS**. TTL fallback: **60s**.

## 11. Fresh ordering status smoke

```txt
UNVERIFIED — no authorization
```

Motivo: no se proveyó `AUTORIZO_CACHE_ORDERING_STATUS_PROD_SMOKE=yes`.  
Source-level `noStore` + overlay: **PASS**.  
Checkout boundary con **Enviar pedido** (acceptance activa observada): **PASS** (no mutación).

## 12. Cache behavior / performance sanity

| Check | Resultado |
|-------|-----------|
| Primera carga | PASS · document 200 |
| Segunda carga | PASS · sin errores client |
| Hard reload / re-navigate | PASS |
| CSP | `frame-ancestors 'self'` |
| Document cache | `Cache-Control: private, no-cache…` · `X-Vercel-Cache: MISS` (página dinámica; Data Cache interno) |

Perf (navigation timing, **measured**):

| Carga | TTFB | DCL | load |
|-------|------|-----|------|
| 1ª | ~35 ms | ~5629 | ~8606 |
| 2ª | ~40 ms | ~1329 | ~1598 |

Clasificación: **measured** (ligera; sin baseline comparable para claim).

## 13. Seguridad / no-regression

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
No mutaciones productivas de catálogo
No open/close sesión productiva
No commit/push/deploy
```

## 14. Resultado de comandos

| Check | Resultado |
|-------|-----------|
| `git branch` | `main` |
| `git rev-parse --short HEAD` | `9fae258` |
| dirty tree | docs ajenos + `tsconfig.tsbuildinfo` + `tmp/` (no relacionados) |
| `npx tsc --noEmit` | PASS (0) |
| `npm run build` | PASS (0) |
| `npm run lint` | FAIL (2) — ESLint circular histórico `configs.flat.plugins.react` |

## 15. Fixes aplicados

```txt
ninguno
```

## 16. Deuda residual

| ID | Deuda | Severidad |
|----|-------|-----------|
| — | Runtime mutation admin invalidation (sin auth env) | P3 QA |
| — | Runtime mutation ordering status (sin auth env) | P3 QA |
| P2 | corpus overfetch groups/options | P2 |
| P2 | scroll/jank glass | P2 |
| P2 | Image Transforms 403 FeatureNotEnabled | P2 |
| P2 | slug rename `previousSlug` cuando exista action | P2 |
| P2 | `product_customization_enabled` toggle UI | P2 |
| P3 | lint circular histórico | P3 |
| P3 | web vitals más estrictos | P3 |

## 17. Rollback

QA-only: no hay rollback funcional.  
Solo revertir docs si se desea.

## 18. Próximo paso

```txt
PUBLIC-CATALOG-SCROLL-JANK-POLISH-1
```

Alternativas: `PUBLIC-CATALOG-CORPUS-OVERFETCH-FIX-1` · para cerrar deuda de mutación: re-ejecutar esta fase en Modo B/C con auth env explícita.
