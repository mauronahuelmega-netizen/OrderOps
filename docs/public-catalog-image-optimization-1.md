# PUBLIC-CATALOG-IMAGE-OPTIMIZATION-1 — Public Catalog Image Loading & Rendering Optimization

## 1. Estado

**PASS WITH MINOR IMAGE DEBT**

Fecha: 2026-07-28  
Branch: `main`  
HEAD preflight: `4dd5dce`  
Local QA: `http://127.0.0.1:3018/b/demohamburgueseria/catalogo`

## 2. Resumen ejecutivo

Se migraron las imágenes críticas del catálogo/header público de `<img>` raw a `next/image` vía helper `PublicStorageImage`, reutilizando `getSupabaseImageLoader` + fallback a object URL (mismo patrón admin). Product thumbs con `sizes`/`lazy`, cover con `priority`/`fill`, logo sized 64px, detail modal `fill`. Sin cambios DB/RLS/RPC/cache/checkout/carrito/preview.

## 3. Problema auditado

Audit `PUBLIC-CATALOG-PERFORMANCE-FORENSIC-AUDIT-1` F1:

* thumbs ~1122–1536px para display ~114×108;
* cover 1672×941;
* logo 1254→~60;
* sin lazy real;
* loader Supabase existía pero no se usaba.

## 4. Archivos modificados

### Código

* `components/public/catalog/public-storage-image.tsx` (**nuevo**)
* `components/public/catalog/product-card.tsx`
* `components/public/catalog/product-detail-modal.tsx`
* `components/public/catalog/catalog-client.tsx`
* `components/public/business/public-business-header.tsx`
* `app/globals.css` (wrappers media mínimos: relative/overflow/height)

### Docs

* `docs/public-catalog-image-optimization-1.md`
* `docs/CURRENT_PHASE.md`
* `ORDEROPS_LIVING_MEMORY.md`

### No tocados

`next.config.ts`, `lib/supabase/image-loader.ts`, data libs, checkout, cart logic, preview admin, landing page.

## 5. Inventario de imágenes

| Imagen | Archivo | Uso | Display aprox | Antes | Después |
|--------|---------|-----|--------------:|-------|---------|
| Cover | `catalog-client` | LCP/hero | ~1040×584 | `<img>` eager | `next/image` fill + priority |
| Logo ×2 | `public-business-header` | marca / sheet | ~58–72 | `<img>` | `next/image` 64×64 |
| Product thumb | `product-card` | lista | ~114×108 | `<img>` | `next/image` 228×216, sizes 114px, lazy |
| Detail | `product-detail-modal` | modal | ~686×320 | `<img>` | `next/image` fill + sizes |
| Cart/sheet | — | — | — | N/A | sin imágenes |
| Customization modal | — | — | — | N/A | sin `<img>` |
| Landing cover/logo | `business-landing-page` | landing | — | `<img>` | **deuda menor** (fuera de catálogo) |

## 6. Cambios implementados

* Helper `PublicStorageImage`: loader Supabase + `onError` → `toSupabaseObjectPublicUrl` + `unoptimized` (parity admin).
* Cover: `fill`, `priority`, `sizes="(max-width: 768px) 100vw, min(100vw, 1040px)"`, alt `Portada de {name}`.
* Logo: `width/height={64}`, `sizes="64px"`.
* Thumbs: `width={228}` `height={216}` `sizes="114px"` (evita srcset fill oversized ~2500).
* Modal: shell `position:relative` + `fill` + `sizes="(max-width: 640px) 92vw, 480px"`.
* CSS: media box con height estable; modal `__image-shell`.

## 7. next/image / loader

```txt
se usó infraestructura existente (getSupabaseImageLoader)
no se amplió next.config / remotePatterns
sizes definidos
priority solo cover
lazy default en thumbs/logo (Next)
```

Runtime local: resource URLs con `width=64|128|1080` antes de fallback. Si Image Transformations responde error, fallback a `/object/public/` (documentado en loader).

## 8. Fallbacks y accesibilidad

* Sin URL → placeholders “Sin foto” / inicial logo / cover fallback intactos.
* Alt producto/logo/portada descriptivos.
* Wrappers con dimensiones estables → sin CLS observable.

## 9. Runtime QA público

Local `:3018`:

| Check | Resultado |
|-------|-----------|
| Catálogo carga | PASS |
| Cover/logo/product imgs visibles | PASS |
| Fallbacks | PASS (estructura intacta) |
| Agregar (qty) | PASS — cart bar enabled |
| Ver detalle + modal image | PASS — Coca Cola modal 686×320 |
| Customization modal | no ejercitado (sin imagen propia) |
| Público sin pan/cursor | PASS |
| Checkout / Enviar pedido | **UNVERIFIED** (herramienta bloqueó navegación checkout en esta sesión; **cero cambios** en checkout) |

## 10. Preview regression

**UNVERIFIED** en runtime esta sesión (auth/preview no ejercitado). Preview usa el mismo `CatalogClient`/cards; sin cambios a pan/cursor/clear-cart/guard. Riesgo residual de visual-only.

## 11. Performance comparison

| Métrica | Antes (audit prod) | Después (local :3018) |
|---------|-------------------:|----------------------:|
| Técnica | raw `<img>` | `next/image` + loader |
| Product lazy | 0 | 16/16 lazy |
| Request widths observados | full object | `64`, `128`, `1080` (+ fallback object) |
| Product naturalWidth post-fallback | ~1122–1536 | ~841–1051 (origen; transforms fallan → object) |
| Product rendered | ~114 | ~114 |
| Cover request | full | `width=1080` luego fallback object |
| Logo request | full 1254 | `width=64` luego fallback |
| DCL / load | ~6.3s / ~7.5s prod | ~3.3s / ~4.0s local (no comparable 1:1) |
| hasPan público | false | false |

**Nota:** Si Supabase Image Transformations no está habilitado/estable, el fallback sirve el objeto original (mismo techo que admin). El cableado sized queda listo para cuando transforms respondan 200.

## 12. Seguridad / no-regression

```txt
No DB / RLS / RPC SQL
No cache/revalidation / noStore
No checkout action / carrito logic
No preview admin logic / CSP
No pedidos reales
No commit / push / deploy
```

## 13. Resultado de comandos

```txt
branch: main
HEAD: 4dd5dce
npx tsc --noEmit: PASS (×2)
npm run build: PASS (×2)
npm run lint: FAIL (ESLint circular histórico)
```

## 14. Deuda residual

| ID | Sev | Descripción |
|----|-----|-------------|
| D1 | P2 | Image Transforms fallback → bytes full-res si render 403 |
| D2 | P3 | `business-landing-page.tsx` sigue con `<img>` |
| D3 | P3 | Checkout/preview runtime smoke UNVERIFIED esta sesión |
| D4 | P3 | Algunos srcset candidates residuales en fallback path |

## 15. Rollback

```bash
git checkout -- components/public/catalog components/public/business/public-business-header.tsx app/globals.css docs/CURRENT_PHASE.md ORDEROPS_LIVING_MEMORY.md
rm -f docs/public-catalog-image-optimization-1.md components/public/catalog/public-storage-image.tsx
```

Sin DB/Supabase rollback.

## 16. Próximo paso

```txt
PUBLIC-CATALOG-PERFORMANCE-FIX-1
```
