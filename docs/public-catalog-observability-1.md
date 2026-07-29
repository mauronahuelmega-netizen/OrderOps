# PUBLIC-CATALOG-OBSERVABILITY-1 — Public Catalog Web Vitals & UX Observability Foundation

## 1. Estado

```txt
PASS WITH PREVIEW QA DEBT
```

Fecha: 2026-07-29  
Branch: `main`  
HEAD base: `9fae258`  
Modo: foundation local (sin commit/push/deploy)

Notas de clasificación:

- Preview admin: **UNVERIFIED** (auth → `/admin/login`)
- Producción logging: no-op hasta `ORDEROPS_PUBLIC_CATALOG_OBSERVABILITY_LOGS=1` (endpoint ya acepta 204)
- Client send: requiere `NEXT_PUBLIC_ORDEROPS_PUBLIC_CATALOG_OBSERVABILITY=1` **o** `?orderopsMetrics=1`

## 2. Resumen ejecutivo

Se agregó una base privacy-safe de observabilidad para el catálogo público: Web Vitals vía `useReportWebVitals`, métricas custom livianas (`hydrated_ms` + image debug aggregate), debug mode por query param y endpoint same-origin 204 sin DB/Supabase/PII. El Client Component retorna `null` y no altera UI. Checkout, cart schema, cache, corpus summary-lite, image loader, preview admin logic y UX polish previos intactos.

## 3. Problema atacado

```txt
sin foundation medible de Web Vitals / UX readiness en /b/[slug]/catalogo
antes del deploy agrupado (scroll / corpus / UX / transforms infra)
```

## 4. Archivos modificados

**Creados**

- `components/public/catalog/public-catalog-observability.tsx`
- `lib/observability/public-catalog-metrics.ts`
- `app/api/observability/public-catalog/route.ts`
- `docs/public-catalog-observability-1.md`

**Componentes**

- `components/public/catalog/public-catalog-page.tsx` (mount sibling a `CatalogClient`)

**Docs**

- `docs/CURRENT_PHASE.md`
- `ORDEROPS_LIVING_MEMORY.md`

**No tocados (límites)**

- checkout action / `create_order` / cart schema
- corpus summary-lite / cache strategy / image loader
- preview admin logic / CSP / PWA / DB / RLS / RPC

## 5. Observability audit

| Surface                | Existe | Archivo                                      | Reutilizar | Acción                          |
| ---------------------- | -----: | -------------------------------------------- | ---------: | ------------------------------- |
| Web Vitals             |     no | —                                            |         no | crear `useReportWebVitals`      |
| Analytics externo      |     no | —                                            |         no | no agregar                      |
| Performance marks      |     no | —                                            |         no | custom livianas solo en client  |
| Logging endpoint       |     no | —                                            |         no | crear `/api/observability/...`  |
| Error boundary público |     no | —                                            |         no | docs only (deuda P3)            |
| Admin analytics        |    sí  | `lib/orders/analytics*` (admin orders)       |         no | no reutilizar (otro dominio)    |
| ESLint core-web-vitals |    sí  | `package.json` / eslint config               |        n/a | lint rule only, no runtime      |

## 6. Metrics contract

```ts
type PublicCatalogMetricPayload = {
  source: "public_catalog";
  version: 1;
  businessSlug: string;
  isPreview: boolean;
  path: string; // pathname only, /b/{slug}/catalogo
  metric: {
    name: PublicCatalogMetricName;
    value: number;
    rating?: "good" | "needs-improvement" | "poor";
    delta?: number;
    id?: string;
    navigationType?: string;
  };
  context: {
    viewport: "xs" | "sm" | "md" | "lg" | "xl";
    connection?: "slow-2g" | "2g" | "3g" | "4g" | "unknown";
    deviceMemory?: number;
  };
  debug?: {
    imageResourceCount?: number;
    renderImageCount?: number;
    objectImageCount?: number;
    fallbackImageCount?: number;
    totalImageTransferKB?: number;
  };
};
```

Allowlist de nombres:

```txt
TTFB, FCP, LCP, CLS, INP, FID,
Next.js-hydration, Next.js-route-change-to-render, Next.js-render,
public_catalog_hydrated_ms, public_catalog_image_debug
```

Reglas:

- sanitize slug + path
- max payload 10 KB
- no query string completa, no cart, no customer, no product IDs/names

## 7. Client instrumentation

Archivo: `components/public/catalog/public-catalog-observability.tsx`

- `"use client"`, retorna `null`
- `useReportWebVitals` (next/web-vitals)
- enable: `NEXT_PUBLIC_ORDEROPS_PUBLIC_CATALOG_OBSERVABILITY=1` **o** `?orderopsMetrics=1`
- `sendBeacon` + fallback `fetch({ keepalive: true, credentials: "omit" })`
- custom: `public_catalog_hydrated_ms` on mount
- debug-only: `public_catalog_image_debug` (aggregate resource/image counts)
- nunca lanza; no lee localStorage/cookies/cart

Wiring: `public-catalog-page.tsx` junto a `CatalogClient`, no en root layout ni checkout.

## 8. Endpoint / logging

`POST /api/observability/public-catalog`

- 204 en éxito / payload inválido descartado
- 413 si body > 10 KB
- sin Supabase / DB / cookies / auth
- logs server solo si `ORDEROPS_PUBLIC_CATALOG_OBSERVABILITY_LOGS=1` o `NODE_ENV !== "production"`
- formato: `[public-catalog-metric] { name, value, rating, businessSlug, isPreview, viewport, connection }`
- producción sin env de logs: accept + discard 204 (listo para habilitar)

## 9. Debug mode

```txt
/b/demohamburgueseria/catalogo?orderopsMetrics=1
```

- `console.table` de métricas safe
- image summary debug diferido ~1.5s
- Network: `POST /api/observability/public-catalog` → **204**
- sin UI visible adicional

Sin query param y sin `NEXT_PUBLIC_...=1`: no beacon.

## 10. Runtime QA público

Local (`demohamburgueseria`):

- catálogo carga; ~16 productos / 5 categorías
- estado operativo, Desde, Agregar / Elegir opciones visibles
- sin errores de montaje de observability
- endpoint curl/fetch: valid → 204; invalid path discarded → 204
- UI intacta (conversion UX + scroll polish previos)

## 11. Checkout boundary

```txt
/b/demohamburgueseria/checkout
```

- `Enviar pedido` visible
- resumen / adicionales correctos (sesión previa)
- **no** pedido enviado
- observability no montada en checkout (solo vía `PublicCatalogPageContent`)

## 12. Preview regression

```txt
/admin/products/preview → redirect /admin/login
```

**UNVERIFIED — auth unavailable**

`isPreview` se propaga desde `isCatalogPreview` en `PublicCatalogPageContent` cuando el iframe use esa ruta; sin auth no se validó runtime en iframe.

## 13. Privacy / security

```txt
No DB
No Supabase
No RLS
No RPC SQL
No checkout action
No create_order
No cart content
No customer PII
No cookies/auth
No Product Customization logic
No cache strategy
No corpus summary-lite
No image loader/transforms
No preview admin logic
No CSP changes
No pedidos reales
No analytics externo / terceros
```

## 14. Resultado de comandos

```txt
npx tsc --noEmit     → PASS
npm run build        → PASS
npm run lint         → FAIL (ESLint circular histórico)
git: sin commit/push/deploy
```

Dirty tree previo preservado (scroll / corpus / transforms docs / conversion UX).

## 15. Deuda residual

| ID | Severidad | Deuda |
| -- | --------: | ----- |
| P2 | preview   | Preview admin iframe smoke con auth |
| P2 | ops       | Setear `NEXT_PUBLIC_ORDEROPS_PUBLIC_CATALOG_OBSERVABILITY=1` + opcional `ORDEROPS_PUBLIC_CATALOG_OBSERVABILITY_LOGS=1` en deploy |
| P3 | errors    | Captura global error/unhandledrejection (omitida a propósito) |
| P3 | vitals    | FID legacy / INP dependen del browser; no forzar |
| P2 | deploy    | Agrupar con scroll/corpus/UX en ROADMAP-DEPLOY-1 |

## 16. Rollback

```bash
git checkout -- \
  components/public/catalog/public-catalog-page.tsx \
  docs/CURRENT_PHASE.md \
  ORDEROPS_LIVING_MEMORY.md

rm -f \
  components/public/catalog/public-catalog-observability.tsx \
  lib/observability/public-catalog-metrics.ts \
  app/api/observability/public-catalog/route.ts \
  docs/public-catalog-observability-1.md
```

No revertir scroll polish, corpus overfetch, image transforms infra docs, conversion UX polish.

Sin DB / Supabase rollback.

## 17. Próximo paso

```txt
PUBLIC-CATALOG-ROADMAP-DEPLOY-1
```

Deploy agrupado local pending: scroll jank + corpus overfetch + conversion UX + observability foundation. Image transforms permanece infra auth debt.
