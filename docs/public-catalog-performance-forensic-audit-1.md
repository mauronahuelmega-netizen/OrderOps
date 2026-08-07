# PUBLIC-CATALOG-PERFORMANCE-FORENSIC-AUDIT-1 — Public Catalog Performance, UX, Security & Rendering Audit

## 1. Estado

```txt
NEEDS PERFORMANCE FIX
```

Fecha: 2026-07-28  
Branch: `main`  
HEAD: `4dd5dce`  
Superficie: `/b/[slug]/catalogo` (prod: https://orderops.vercel.app/b/demohamburgueseria/catalogo)  
CLI: `tsc` PASS · `build` PASS · `lint` FAIL (ESLint circular histórico)

No hay P0 de seguridad/pedidos detectado. Hay **P1 de performance/conversión** con evidencia source + runtime.

## 2. Resumen ejecutivo

El catálogo público es un **Server Component thin** que hidrata un **CatalogClient monolítico**: todos los productos se renderizan de entrada; carrito en localStorage; modales bajo demanda (CustomizationModal con `dynamic`).

El cuello de botella principal no es un bug de lógica, sino un **paquete de costos acumulados**:

1. **Data path siempre `noStore()`** → cada visita pega DB (business, settings × N, session, categories, products, y si customization ON: corpus completo + waterfall).
2. **Imágenes vía `<img>` raw** a full-res Storage (~1100–1500px) para thumbs ~114×108; `next/image` + loader Supabase existen en `next.config.ts` pero **no se usan** en cards/hero.
3. **Hydration de lista completa** + cart state levantado en `CatalogClient` → cualquier cambio de carrito re-renderiza todas las cards.
4. **Superficies glass** (`backdrop-filter: blur(18px)` en hero, category nav, cart bar, modales) + sticky/fixed stacked → riesgo de jank en móviles modestos.
5. Preview hooks viven en el mismo module graph del catálogo público (gated por `isCatalogPreview`; público normal no monta cursor/pan — verificado en prod).

Seguridad pública: tenant por `business_id` / slug server-side; service role solo server; checkout/preview boundaries intactas. Sin mojibake `Ã` en `app/b` / `components/public`. Hay copy sin tildes en fallbacks (“Catalogo”, “Hace”, “todavia”).

## 3. Alcance auditado

| Área | Archivos / superficies |
|------|-------------------------|
| Ruta | `app/b/[slug]/catalogo/page.tsx`, layout `app/b/[slug]/layout.tsx` |
| UI | `components/public/catalog/*`, `public-business-header` |
| Data | `lib/catalog/public.ts`, `lib/business/public.ts`, `lib/product-customization/public.ts`, `flags.ts`, `lib/store-sessions/public.server.ts` |
| Cart | `lib/cart/local.ts` (solo lectura audit) |
| Config | `next.config.ts`, `globals.css` (estilos catalog) |
| Runtime | prod `/b/demohamburgueseria/catalogo` Performance API |
| Checkout | frontera solo (no modificado) |

Fuera de scope de fixes: admin preview, Product Customization admin, DB/RLS writes, deploy/commit.

## 4. Arquitectura actual

```txt
request /b/[slug]/catalogo
  → layout: getRequestPublicBusiness(slug) [React cache]
  → page: getRequestPublicBusiness + isCatalogPreview query
  → PublicCatalogPageContent
      → Promise.all:
          getPublicCatalogByBusinessId (categories + products)
          isProductCustomizationEnabled
      → if enabled: getPublicCustomizationSummariesForProducts (corpus)
  → CatalogClient (client) hydration
      → localStorage cart (public | preview scope)
      → CategoryNav + all ProductCards
      → CartBar; CartSheet/ProductDetail/Customization on demand
      → checkout navigation /b/{slug}/checkout
```

| Pregunta | Respuesta |
|----------|-----------|
| ¿Qué corre en server? | Business, settings/session, catalog rows, customization summaries/corpus |
| ¿Qué corre en client? | Cart UX, theme, scroll spy, modales, preview pan/cursor si preview |
| ¿Datos antes del primer render? | Todo lo anterior (SSR). Sin streaming parcial observado |
| ¿Datos después? | Config de customization modal vía Server Action al abrir; cart desde localStorage |
| ¿Qué se hidrata? | `CatalogClient` completo (lista + nav + hero + cart bar) |
| ¿localStorage? | Cart keys + theme preference |
| ¿`orderopsPreview`? | Solo flag prop; keys preview; hooks pan/cursor; no afecta público normal |
| ¿Común preview/admin? | Mismo `CatalogClient` + mismos datos públicos |

## 5. Server calls / data fetching

### Conteo estimado por request (customization **ON**, ~N productos)

| # | Llamada | Origen | Tabla/RPC | Above-the-fold | Cacheable | Duplicada |
|---|---------|--------|-----------|----------------|-----------|-----------|
| 1 | business by slug | `getPublicBusinessBySlug` | `businesses` | Sí | Parcial (slug) | Deduped vía React `cache` layout+page |
| 2 | settings schedule | same | `business_settings` (service) | Parcial | Sí corto | — |
| 3 | on_demand flag | `isBusinessAcceptingPublicOrders` | `business_settings` (service) | Parcial | Sí corto | **Sí** vs #2 |
| 4 | open session | same | `store_sessions` (service) | Sí (aceptación) | No / fresco | — |
| 5 | categories | `getPublicCatalogByBusinessId` | `categories` | Sí | Sí | — |
| 6 | products | same | `products` available | Sí | Sí | — |
| 7 | customization flag | `isProductCustomizationEnabled` | `business_settings` (service) | Para “Desde”/CTA | Sí | **Sí** vs settings |
| 8 | flag again | `getPublicCustomizationSummaries…` | `business_settings` | — | Sí | **Sí** vs #7 |
| 9 | products again | `loadPublicCustomizationCorpus` | `products` by ids | No (summary) | Sí | **Sí** vs #6 |
| 10–15 | assignments, groups, options, overrides, upsell_groups, upsell_items | corpus | varias | No (summary only) | Sí | Overfetch: **ALL groups/options del tenant** |
| 16 | suggested products | corpus waterfall | `products` | No | Sí | Tras #10–15 |

**Sin customization:** ~7 queries (1–7), aún todas con `noStore()`.

### Hallazgos data

```txt
cantidad estimada: ~7 (flag off) / ~16 (flag on) queries Supabase por document request
origen: server-only libs; client catalog sin createClient/fetch de catálogo
duplicadas: sí (settings ×3–4 paths; products ×2 con customization)
waterfalls: sí (suggested products después del Promise.all del corpus)
```

Client-side: **no** re-fetch del listado. Customization modal sí dispara Server Action (`getPublicProductCustomizationConfigAction`) → otro corpus/config por producto al abrir (aceptable bajo demanda; pero corpus listado ya cargó casi todo en SSR).

## 6. Runtime network audit

Prod sample (browser Performance API, sesión posiblemente warm cache — `transferSize` 0 en muchos assets):

| Métrica | Valor observado |
|---------|-----------------|
| URL | `/b/demohamburgueseria/catalogo` |
| TTFB (nav) | ~178 ms |
| DOMContentLoaded | ~6335 ms |
| loadEventEnd | ~7509 ms |
| Document encoded | ~7.3 KB |
| Resource entries | ~39 (script 11, link 23, fetch 5) |
| Product cards | 16 |
| Preview pan/cursor | **ausentes** (correcto público) |
| Lazy images | **0** |
| Eager cover | 1 |
| Product/logo imgs | `loading=auto` (efectivamente eager browser) |
| Intrinsic product imgs | ~1122–1536 px para display ~114×108 |
| Cover | 1672×941 → display ~1040×584 |
| Logo | 1254×1254 → display ~58–60 |
| Top JS decoded | ~227 KB + ~110 KB + chunks menores |
| Client XHR catálogo | prefetch RSC a landing/login/catalogo (Next), **no** Supabase browser |

Lighthouse formal: **no ejecutado** en esta fase. Diagnóstico accionable: LCP probable = cover o first product image; decode cost alto por resolución excesiva; TTI afectado por JS + lista completa.

## 7. Rendering / hydration cost

| Pregunta | Hallazgo |
|----------|----------|
| ¿Gran client component? | **Sí** — `CatalogClient` orquesta casi toda la UI |
| ¿Todos los productos al inicio? | **Sí** — sin virtualización / windowing |
| ¿Modales siempre? | **No** — CartSheet / Detail / Customization condicionales; Customization `dynamic(..., { ssr:false })` |
| ¿Imágenes eager/lazy? | Cover eager; cards sin `loading="lazy"` |
| ¿Cart sheet siempre? | Solo si `isCartSheetOpen` |
| ¿Precios recalculados? | `formatPublicCatalogCurrency` por card; summaries precomputados server |
| ¿useMemo? | productMap, groupings, cartCount/total — sí; handlers inline por card — **no** memoizados |
| ¿useEffect? | Cart hydrate/persist, theme, IO spy, cover, preview message (gated) — razonables; IO actualiza state → re-renders |
| ¿State global arriba? | **Cart en CatalogClient** → add/qty re-renderiza lista completa |
| ¿Agregar = re-render masivo? | **Sí** (todas las cards) |

Riesgos: listas sin memo de item, closures nuevas por producto, state levantado, sin React Compiler assumptions documentadas aquí.

## 8. Scroll performance / jank

| Superficie | CSS pesado | En scroll | Riesgo jank | Recomendación |
|------------|-----------:|----------:|------------:|---------------|
| `.catalog-hero` | `box-shadow` + `backdrop-filter: blur(18px)` | Above-fold | Medio | Reducir blur / solid surface |
| `.catalog-category-nav` sticky | blur 18px + shadow | Sí | Medio-Alto | Solid sticky, menos blur |
| `.catalog-product-card` | shadow + radius + overflow + img cover | Sí | Medio | Lazy imgs + lighter shadow |
| `.catalog-cart-bar` fixed | blur 18px + shadow | Sí | Medio | Solid bar |
| Modal/sheet overlays | fixed + blur + floating shadow | On open | Bajo (bajo demanda) | OK |
| Preview cursor CSS | `will-change`, fixed | Solo preview | N/A público | OK gated |
| Public header sticky | blur en `globals` business header | Sí | Medio | Auditar en polish scroll |

Overlays apilados público: header sticky + category sticky + cart fixed (+ modal on demand). Preview-only listeners/classes **no** activos en público (verificado).

## 9. Images / assets

| Imagen | Componente | Técnica | Riesgo | Fix sugerido |
|--------|------------|---------|--------|--------------|
| Cover | `catalog-client` | `<img loading=eager>` raw URL | LCP / decode | `next/image` + sizes + priority |
| Logo | `public-business-header` | `<img>` raw | Oversize 1254→58 | `next/image` width/height |
| Product thumb | `product-card` | `<img>` raw, no lazy | P1 bandwidth/decode | `next/image` + `loading=lazy` + sizes ~120–240 |
| Detail modal | `product-detail-modal` | `<img>` | Decode on open | Optimized sizes |
| Storage | Supabase public buckets | Full object URL | No transform on wire | Usar `/render/image` vía loader existente |

`next.config.ts` ya define `loaderFile: ./lib/supabase/image-loader.ts` y remotePatterns — **infra lista, UI no la usa**.

Sin width/height HTML en cards → riesgo CLS menor (CSS fija media box, pero no intrínseco).

## 10. Bundle / imports

| Check | Resultado |
|-------|-----------|
| Admin components en público | **No** imports `@/components/admin` en `components/public` |
| lucide / date-fns / framer / dnd / recharts | **No** en public catalog |
| supabase client en catalog client | **No** |
| Preview code en bundle | Hooks + CSS modules importados siempre; runtime gated |
| Customization shared UI | Importado por modal dynamic + option groups |
| Chunks | Múltiples `/_next/static/chunks/*`; mayor ~227KB decoded |

Preview pan/cursor CSS + hooks aumentan peso del módulo del catálogo aunque `enabled=false`. Candidato a split condicional / lazy preview-only.

## 11. Cache / revalidation

```txt
force-dynamic implícito vía unstable_noStore() en:
  getPublicBusinessBySlug
  getPublicCatalogByBusinessId
  getPublicCustomizationSummariesForProducts
  getPublicProductCustomizationConfig
```

Build marca `/b/[slug]/catalogo` como **Dynamic (ƒ)**.

| Pregunta | Respuesta |
|----------|-----------|
| ¿Cada visita pega DB? | **Sí** (by design actual) |
| ¿Cacheable? | categories/products/customization corpus / hero settings |
| ¿No cacheable? | store session open, on_demand acceptance, cart (client) |
| ¿Freshness negocio abierto? | Sí — session/settings acceptance |
| ¿Tags por businessId? | No implementado |
| ¿Invalidación admin? | No observada en esta auditoría |

Estrategia propuesta (no implementar):

```txt
cache por business slug / businessId tags
revalidate corto (p.ej. 30–60s) para shell catálogo
separar “acceptance” fresco de “menu corpus” cacheado
invalidar tags en admin product/category/settings/customization mutations
```

## 12. Seguridad pública / tenant isolation

| Riesgo | Estado | Severidad | Evidencia | Recomendación |
|--------|--------|----------:|-----------|---------------|
| Service role en cliente | Mitigado | — | `createSupabaseServiceClient` solo server libs | Mantener |
| Queries sin business_id | Mitigado | — | `.eq("business_id", …)` en catalog/corpus | Mantener |
| Productos no disponibles | Mitigado | — | `.eq("is_available", true)` | Mantener |
| Customization flag off | Mitigado | — | fail-closed `isProductCustomizationEnabled` + RLS helper comment | Mantener |
| Cross-tenant leakage | No evidencia | — | slug → business id server | Mantener QA |
| Checkout preview | Fuera; guard conocido | — | handoff previo | No tocar |
| Público sin preview mode | PASS | — | sin pan/cursor en prod | Mantener |
| localStorage por businessId | PASS | — | keys `orderops-cart*:{businessId}` | Mantener |
| Overfetch options all-tenant | Performance, no leak | P2 | corpus carga groups/options de todo el business | Acotar en FIX data |

**No NEEDS SECURITY FIX.** Service role en server para settings/session es patrón existente; no se expone al browser.

## 13. Mojibake / copy / encoding

| Clase | Estado |
|-------|--------|
| Mojibake `Ã` / `Â` / `�` en `app/b` + `components/public` | **No encontrado** |
| Fallbacks sin tildes | “Catalogo listo…”, “Hace tu pedido…”, “todavia”, “Elegi” en `catalog-client` |
| Copy cliente claro | Mayormente sí; hero settings-driven |
| Términos internos / QA | No en UI pública observada |

Severidad copy: **P3** (acentos), no P1 mojibake.

## 14. Tokenización visual

| Pregunta | Respuesta |
|----------|-----------|
| ¿Tokenizado? | Parcial: vars locales `--catalog-*` + `--business-primary` en `.catalog-page` |
| ¿Hardcodes? | Sí, muchos hex/rgba en `app/globals.css` bloque catalog (no `theme-tokens.css`) |
| ¿Duplicados? | Sombras/blur repetidos hero/nav/card/bar |
| ¿Sombra excesiva? | Sí (`0 18px 44px…` + blur) |
| ¿Contraste? | Aceptable light/dark locales; no audit WCAG formal |
| ¿Theme negocio? | `primary_color` → CSS var; surfaces warm cream hardcoded |
| ¿Glass/blur? | Excesivo para scroll móvil |

Nota de arquitectura CSS: estilos de catálogo viven en **globals** (deuda vs regla module.css del proyecto para trabajo nuevo).

## 15. UX de conversión

| Ítem | Nota | Sev |
|------|------|-----|
| Entender oferta | Hero + headline settings | OK |
| Header claro | PublicBusinessHeader | OK |
| Categorías | Sticky nav + IO spy | OK / jank risk |
| Productos ATF | Tras hero grande | P2 — hero alto retrasa productos |
| CTA Agregar | Claro | OK |
| Precio / Desde | Summary server | OK |
| No disponibles | Filtrados server | OK |
| Empty states | Presentes | OK |
| Cart bar | Visible fixed | OK |
| Checkout | Via sheet | OK |
| Scroll fricción | Blur + heavy imgs | **P1** |
| Modal | Bajo demanda | OK |
| Extras | Modal customization | OK |
| Errores | Copy humano en action | OK |

## 16. Accesibilidad básica

| Check | Estado |
|-------|--------|
| Botones reales | Sí en actions; card hit `role=button` |
| Labels | aria-label en hits / qty |
| Dialogs | Modales propios (roles a verificar en polish) |
| Escape/cerrar | Implementado en modales (patrón existente) |
| Focus visible | Depende globals; no audit profundo |
| Touch targets | Agregar/Ver detalle OK aprox |
| Alt images | product.name / cover alt |
| Reduced motion | No auditado específicamente |
| Preview cursor | No en público |

## 17. Observabilidad

| Capacidad | Estado |
|-----------|--------|
| web-vitals | No en catálogo público |
| performance.mark | No |
| Analytics | No observado |
| Error boundary público | No (solo admin workspace) |
| Loading/error UI | Empty panels; cover skeleton; modal load states |

Propuesta (no implementar): `web-vitals` opcional, `performance.mark('catalog-products-visible')`, error boundary liviano en `CatalogClient`.

## 18. Hallazgos priorizados

| ID | Hallazgo | Severidad | Impacto | Evidencia | Fix sugerido | Fase recomendada |
|----|----------|----------:|---------|-----------|--------------|------------------|
| F1 | Product/cover/logo images full-res `<img>`, sin lazy, sin next/image | P1 | LCP, datos, decode, scroll | Runtime naturalWidth 1k–1.5k vs 114px; loader unused | Migrar a `next/image` + sizes + lazy | PUBLIC-CATALOG-IMAGE-OPTIMIZATION-1 |
| F2 | `noStore()` en business/catalog/customization → DB cada hit | P1 | TTFB bajo presión; costo Supabase | Source + dynamic route | Cache tags + separar acceptance fresco | PUBLIC-CATALOG-CACHE-STRATEGY-1 |
| F3 | Customization summaries cargan corpus completo + products duplicados + waterfall | P1 | Latencia SSR cuando flag ON | `loadPublicCustomizationCorpus` | Summary-lite query o cache corpus; no re-fetch products; no double flag | PUBLIC-CATALOG-PERFORMANCE-FIX-1 |
| F4 | Settings/session lookups duplicados (business_settings ×3–4) | P2 | Waterfall/latencia | `getPublicBusiness` + acceptance + flag×2 | Unificar lectura settings por request | PERFORMANCE-FIX-1 |
| F5 | Lista completa + cart state root → re-render masivo | P2 | INP al agregar | CatalogClient map all cards | Memo cards / split cart context | PERFORMANCE-FIX-1 |
| F6 | backdrop-filter + sticky/fixed stack | P2 | Jank scroll móvil | globals.css catalog | Solid surfaces; menos blur | PUBLIC-CATALOG-SCROLL-JANK-POLISH-1 |
| F7 | Preview hooks/CSS en module graph público | P3 | Bundle weight | imports catalog-client | Lazy/split preview-only | PERFORMANCE-FIX-1 (opcional) |
| F8 | Fallbacks sin tildes | P3 | Copy polish | catalog-client strings | Corregir acentos | PUBLIC-CATALOG-MOJIBAKE-COPY-FIX-1 |
| F9 | Catalog styles hardcoded en globals | P3 | Tokens/branding | globals.css | Tokens / module.css gradual | PUBLIC-CATALOG-TOKENIZATION-POLISH-1 |
| F10 | Sin web-vitals / marks públicos | P3 | Ceguera operativa | grep | Observabilidad liviana | (junto FIX-1 o fase obs) |
| F11 | Hero alto retrasa productos | P2 | Conversión ATF | Layout hero | Compactar hero móvil | CONVERSION-UX-POLISH-1 |

Sin P0 seguridad/pedidos.

## 19. Fases recomendadas

Ordenadas (máx. 5 prioritarias):

1. **PUBLIC-CATALOG-IMAGE-OPTIMIZATION-1** — `next/image` + lazy + sizes (mayor win LCP/datos).
2. **PUBLIC-CATALOG-PERFORMANCE-FIX-1** — dedupe settings/flag/products; summary-lite; reducir re-renders; opcional split preview imports.
3. **PUBLIC-CATALOG-CACHE-STRATEGY-1** — tags por `businessId`; revalidate; acceptance fuera de cache de menú.
4. **PUBLIC-CATALOG-SCROLL-JANK-POLISH-1** — reducir blur/shadow sticky; layers.
5. **PUBLIC-CATALOG-CONVERSION-UX-POLISH-1** (+ copy accents) — hero móvil más bajo; copy tildes.

Opcionales posteriores: TOKENIZATION-POLISH-1, SECURITY-HARDENING-1 (solo si auditoría RLS dedicada), MOJIBAKE-COPY-FIX-1 si se separa.

## 20. Riesgos si no se corrige

* Catálogos con muchas fotos/PNG grandes: abandono en 3G/móviles modestos.
* Tenants con customization ON: SSR más lento → peor TTFB percibido en cold start.
* Escala de productos: DOM + hydration crece lineal sin virtualización.
* Costo Supabase/egress por `noStore` + imágenes full.
* Jank sticky+blur refuerza sensación de app “pesada” vs competencia delivery.

## 21. Qué NO se tocó

```txt
No código
No CSS
No DB
No RLS
No RPC SQL
No checkout
No carrito
No preview admin
No Product Customization admin
No pedidos reales
No deploy
No commit
No push
No migraciones
No Supabase writes
```

## 22. Próximo paso

```txt
PUBLIC-CATALOG-IMAGE-OPTIMIZATION-1
```

Alternativa si se prioriza TTFB/DB antes que bytes de imagen:

```txt
PUBLIC-CATALOG-PERFORMANCE-FIX-1
```
