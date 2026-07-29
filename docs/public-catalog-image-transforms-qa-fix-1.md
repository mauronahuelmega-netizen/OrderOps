# PUBLIC-CATALOG-IMAGE-TRANSFORMS-QA-FIX-1 — Supabase Image Transformations QA/Fix for Public Catalog

## 1. Estado

**PASS WITH INFRA IMAGE DEBT**

Fecha: 2026-07-28  
Branch: `main`  
HEAD: `4dd5dce`  
Proyecto Storage: `pkrsedmwxekbhlohhqds.supabase.co`

## 2. Resumen ejecutivo

Se reprodujo el fallback full-res: las URLs `render/image` se construyen bien, pero Supabase responde **403 FeatureNotEnabled** (“feature not enabled for this tenant”). Object public URLs responden **200**. El camino principal del código sigue siendo transform; el fallback a object es seguro y por `onError`. Se corrigió un bug menor en `PublicStorageImage`: reset de fallback al cambiar `src`. Sin tocar loader URL (correcto), DB, cache, checkout ni preview.

## 3. Problema reproducido

Tras IMAGE-OPTIMIZATION-1, Network mostraba requests transformadas (`width=64|128|1080`) que caían a `/object/public/`.

Evidencia curl (2026-07-28):

```json
{"statusCode":"403","error":"FeatureNotEnabled","message":"feature not enabled for this tenant"}
```

en todas las URLs `/storage/v1/render/image/public/...` probadas (cover, logo, product; con y sin `height`/`resize=cover`).

## 4. Archivos modificados

* `components/public/catalog/public-storage-image.tsx` — reset fallback on `src` change; no iniciar en fallback para URLs optimizables
* `docs/public-catalog-image-transforms-qa-fix-1.md` (este)
* `docs/CURRENT_PHASE.md`
* `ORDEROPS_LIVING_MEMORY.md`

**No modificados:** `lib/supabase/image-loader.ts`, `next.config.ts` (correctos).

## 5. Loader audit

`lib/supabase/image-loader.ts`:

| Check | Resultado |
|-------|-----------|
| object → render prefix swap | OK |
| host `*.supabase.co` | OK |
| width/quality clamp | OK |
| strip/rebuild query | OK (set width/quality) |
| no double `/storage/v1` | OK |
| buckets `business-assets` / `product-images` | OK (path preserved) |
| non-Supabase passthrough | OK |
| already-render URL | OK |

No hay bug de construcción de URL. Agregar `height`/`resize` no elimina el 403 (FeatureNotEnabled).

## 6. PublicStorageImage audit

| Check | Antes | Después |
|-------|-------|---------|
| Primary = loader render | Sí | Sí |
| Fallback solo onError | Sí | Sí |
| Reset fallback al cambiar `src` | **No** | **Sí** (`useEffect`) |
| `unoptimized` solo en fallback / non-optimizable | Parcial (`useState(!optimizable)`) | Sí |
| alt / sizes / fill props | Passthrough | Intactos |

## 7. URL/status matrix

| Tipo | Object status | Render status | Params | Fallback |
|------|-------------:|-------------:|--------|----------|
| Cover | 200 | **403 FeatureNotEnabled** | `width=1080&quality=80` | Sí (object) |
| Cover + resize | 200 | **403** | `width=1080&height=608&resize=cover&quality=75` | Sí |
| Logo | 200 | **403** | `width=64&quality=80` | Sí |
| Product thumb | 200 | **403** | `width=228&quality=80` | Sí |
| Product + resize | 200 | **403** | `width=228&height=216&resize=cover&quality=75` | Sí |

Host/buckets: `…supabase.co` · `business-assets` · `product-images`.

## 8. Fix implementado

Código:

* Reset de `useOriginFallback` cuando cambia `src`.
* Estado inicial `false` para URLs optimizables (siempre intenta render primero).

Infra (externa, no desde repo):

```txt
Habilitar Supabase Image Transformations para el tenant/proyecto
(Dashboard → Storage → Image Transformations / plan feature)
```

Hasta entonces, bytes full-res vía object fallback son esperados.

## 9. Runtime QA público

`:3018` / catalogo:

| Check | Resultado |
|-------|-----------|
| Catálogo carga | PASS |
| Cover/logo/thumbs visibles | PASS (object fallback) |
| Requests intentan `render/image` primero | PASS (Performance resource log) |
| Fallback object tras 403 | PASS |
| Sin pan/cursor preview | PASS |
| Agregar / Ver detalle | PASS (sesión previa + UI intacta) |

## 10. Preview regression

**UNVERIFIED** — auth/preview no ejercitado. Preview reutiliza mismo helper; pan/cursor/guard no tocados.

## 11. Checkout boundary

**No modificado.** Smoke checkout no re-ejecutado en esta fase (scope transforms). Código checkout intacto.

## 12. Performance verification

| Esperado ideal | Observado |
|----------------|-----------|
| `currentSrc` = render/image 200 | **No** — 403 FeatureNotEnabled |
| naturalWidth chico | **No** — object full-res tras fallback |
| Intentos render con widths | **Sí** — cover/logo/product render URLs en resource log |
| Imágenes visibles | **Sí** |

## 13. Seguridad / no-regression

```txt
No DB / RLS / RPC SQL
No cache/revalidation
No checkout / carrito / preview admin / CSP
No pedidos reales
No commit / push / deploy
No se forzó unoptimized global
No se volvió a <img> raw
```

## 14. Resultado de comandos

```txt
branch: main · HEAD: 4dd5dce
npx tsc --noEmit: PASS
npm run build: PASS
npm run lint: FAIL (ESLint circular histórico)
curl render/image: 403 FeatureNotEnabled
curl object/public: 200
```

## 15. Deuda residual

| ID | Sev | Descripción |
|----|-----|-------------|
| I1 | P2 | Image Transformations no habilitadas en tenant Supabase → full-res vía fallback |
| I2 | P3 | Preview/checkout smoke UNVERIFIED esta sesión |
| I3 | P3 | Landing page `<img>` (fuera de scope) |

Acción externa: habilitar Image Transformations en el proyecto Supabase; re-QA → esperado `PASS` sin cambio de código adicional.

## 16. Rollback

```bash
git checkout -- components/public/catalog/public-storage-image.tsx docs/CURRENT_PHASE.md ORDEROPS_LIVING_MEMORY.md
rm -f docs/public-catalog-image-transforms-qa-fix-1.md
```

Sin DB/Supabase rollback.

## 17. Próximo paso

```txt
PUBLIC-CATALOG-PERFORMANCE-FIX-1
```
