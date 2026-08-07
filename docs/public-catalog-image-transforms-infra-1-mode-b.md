# PUBLIC-CATALOG-IMAGE-TRANSFORMS-INFRA-1-MODE-B — Authorized Supabase Image Transformations Enablement & Production Verification

## 1. Estado

```txt
BLOCKED — MISSING IMAGE TRANSFORMS ENABLE AUTH
```

Fecha: 2026-07-29  
Branch: `main`  
HEAD: `5dd9b41`  
Deploy base: `fb19a3a`  
Live: `https://orderops.vercel.app`  
Project ref: `pkrsedmwxekbhlohhqds`  
Bucket principal: `product-images`

```txt
Supabase Image Transformations touched: no
Billing/plan changed: no
Code changed: no
Deploy/commit/push: no
```

## 2. Resumen ejecutivo

No se habilitó Supabase Image Transformations porque faltaron ambos tokens obligatorios:

```txt
AUTORIZO_SUPABASE_IMAGE_TRANSFORMATIONS_ENABLE=yes
AUTORIZO_SUPABASE_IMAGE_TRANSFORMATIONS_BILLING_ACCEPTED=yes
```

No se tocó Dashboard Supabase, billing, plan, buckets, policies, código ni deploy. Source sanity del loader/fallback permanece intacta. Baseline read-only confirma `object/public` **200** y `render/image` **403 FeatureNotEnabled**.

Para desbloquear Mode B, reenviar con ambos tokens `=yes` (env o grant explícito top-level). Cambio de plan requiere además `AUTORIZO_SUPABASE_PLAN_CHANGE=yes`.

## 3. Contexto de entrada

```txt
PUBLIC-CATALOG-IMAGE-TRANSFORMS-INFRA-1 → PASS WITH INFRA AUTH DEBT
PUBLIC-CATALOG-ROADMAP-DEPLOY-1 → DEPLOYED WITH NON-BLOCKING QA DEBT
PUBLIC-CATALOG-FINAL-HANDOFF-1 → FEATURE CLOSED — DEPLOYED WITH NON-BLOCKING QA DEBT
PUBLIC-CATALOG-POST-DEPLOY-MONITOR-1 → PASS WITH NON-BLOCKING QA DEBT
PUBLIC-CATALOG-OBSERVABILITY-PROD-ENABLE-1 → BLOCKED — MISSING OBSERVABILITY PROD ENABLE AUTH
```

Deuda atacada (no resuelta por bloqueo auth):

```txt
P2 — Image Transforms FeatureNotEnabled
```

Estado productivo conocido (confirmado baseline Mode B):

```txt
render/image → 403 FeatureNotEnabled
object/public → 200 visible
fallback object → funciona (source + runtime histórico)
currentSrc → object only (histórico post-deploy)
catálogo público → estable
```

## 4. Autorizaciones

| Token | Resultado |
| ----- | --------- |
| `AUTORIZO_SUPABASE_IMAGE_TRANSFORMATIONS_ENABLE=yes` | **ausente** (`≠ yes`) → BLOCKED |
| `AUTORIZO_SUPABASE_IMAGE_TRANSFORMATIONS_BILLING_ACCEPTED=yes` | **ausente** (`≠ yes`) → BLOCKED |
| `AUTORIZO_SUPABASE_PLAN_CHANGE=yes` | ausente (N/A; no se intentó plan change) |

No se asumió autorización por nombre de fase ni por historial. Los tokens aparecen en el brief como requisitos, no como grant.

## 5. Preflight

```txt
branch: main
HEAD: 5dd9b41
dirty tree: docs previos de handoff/monitor/mutation/obs + residuales out-of-scope + tsbuildinfo
runtime dirty inesperado: no
últimos commits: cercanos a 5dd9b41 / deploy base fb19a3a
auth enable presente: no
auth billing presente: no
auth plan change presente: no
```

Esperado cumplido para continuar docs-only: `main`, HEAD cercano a `5dd9b41`, docs dirty esperados, sin runtime dirty inesperado. Bloqueo es por auth, no por dirty tree.

## 6. Source sanity

Validado sin modificar:

```txt
PublicStorageImage intenta render/image (loader) PASS
fallback object/public existe (toSupabaseObjectPublicUrl + onError) PASS
fallback se activa ante error PASS
fallback reset al cambiar src (useEffect [src]) PASS
next.config.ts permite Supabase object + render remotePatterns PASS
cover/logo/thumbs/detail usan PublicStorageImage / loader PASS
checkout no depende de transforms PASS
preview no depende de transforms PASS
```

Wiring clave:

- `components/public/catalog/public-storage-image.tsx` — primary render via loader; object fallback on error; reset on `src` change
- `lib/supabase/image-loader.ts` — `RENDER_PUBLIC_PREFIX` / `OBJECT_PUBLIC_PREFIX`
- `next.config.ts` — remotePatterns para ambos paths

No hay IMAGE LOADER REGRESSION. Bloqueo es solo auth de enable/billing.

## 7. Baseline antes de enable

Catálogo live (referencias previas + curl Mode B):

```txt
catalog URL: https://orderops.vercel.app/b/demohamburgueseria/catalogo
catalog 200: sí (histórico post-deploy / monitor)
imágenes visibles: sí vía object fallback
currentSrc object/public: sí (histórico)
render/image 403 FeatureNotEnabled: sí (confirmado curl Mode B)
checkout boundary intacta: sí (histórico; no re-smoke completo por bloqueo auth)
```

Curl Mode B (logo business-assets conocido):

| Path | Status | Bytes / nota |
| ---- | -----: | ------------ |
| object/public (logo) | 200 | 940521 |
| render/image (logo `width=64&height=64&resize=cover`) | 403 | FeatureNotEnabled — `feature not enabled for this tenant` |

Fases C–M (enable, browser after, bytes table completa, preview deep) **no ejecutadas** por falta de auth. No se abrió Dashboard de billing/enable.

## 8. Plan / billing audit

```txt
plan category: Unknown (no Dashboard access attempted — auth missing)
transforms available: unknown
billing accepted token: no
requires plan change: unknown
```

Sin `AUTORIZO_*` no se auditó plan en Dashboard. Si en re-run el plan Free no permite transforms → `BLOCKED WITH BILLING PLAN DEBT` salvo `AUTORIZO_SUPABASE_PLAN_CHANGE=yes`.

## 9. Supabase enablement

```txt
método usado: none
hora: N/A
pantalla/config: N/A
resultado enable: not attempted — BLOCKED AUTH
```

## 10. Render verification

No post-enable. Baseline:

| Asset | Object status | Object bytes | Render status | Render bytes | Δ bytes | Resultado |
| ----- | ------------: | -----------: | ------------: | -----------: | ------: | --------- |
| logo (business-assets) | 200 | 940521 | 403 | N/A (FeatureNotEnabled) | N/A | baseline pre-enable |

Cover / product thumb / detail: no medidos en Mode B (auth block); históricos en docs INFRA-1 / QA-FIX siguen vigentes como referencia object-only.

## 11. Browser catalog smoke

No re-ejecutado post-enable (no hubo enable). Estado productivo residual:

```txt
catálogo estable vía object fallback (histórico monitor)
render no usable hasta enable autorizado
```

Clasificación: N/A post-enable → deuda P2 Image Transforms permanece.

## 12. Checkout boundary

No smoke nuevo en Mode B (bloqueado antes de infra). Histórico post-deploy:

```txt
checkout 200
Enviar pedido visible si hay carrito
no submit / no success / no pedido real
```

Checkout no depende de Image Transformations.

## 13. Preview boundary

No inspeccionado en Mode B. Deuda previa: preview iframe deep UNVERIFIED sin auth admin. No bloquea este resultado (auth transforms).

## 14. Observability/debug sanity

No obligatorio bajo bloqueo. Endpoint histórico:

```txt
POST /api/observability/public-catalog → 204
```

No se tocó env observability.

## 15. Performance / bytes sanity

Solo baseline logo object vs render blocked. Sin claim de performance post-enable. Catálogo sigue estable con object fallback (histórico TTFB/DCL/load del monitor).

## 16. Fallback safety

Source:

```txt
PublicStorageImage conserva object fallback PASS
onError → object/public PASS
fallback reset al cambiar src PASS
```

No se forzó error artificial en producción. Fallback no modificado.

## 17. Seguridad / no-regression

```txt
No DB
No RLS
No RPC SQL
No migrations
No checkout action
No create_order
No real orders
No cart schema changes
No pricing / stock / availability
No cache strategy / invalidation
No Product Customization logic
No preview admin logic
No CSP / PWA
No Vercel env
No external analytics / SDK
No bucket policy changes
No asset deletes
No code changes
No Supabase Image Transformations enable
No plan/billing change
```

## 18. Resultado de comandos

```txt
git branch / rev-parse / status / log: preflight registrado (main @ 5dd9b41)
auth env ENABLE/BILLING/PLAN: ≠ yes
curl/fetch baseline logo: object 200 (940521) · render 403 FeatureNotEnabled
tsc: no ejecutado (sin código)
build: no ejecutado (sin código)
lint: histórico no bloquea
```

## 19. Hallazgos y severidad

| Severidad | Hallazgo | Evidencia | Acción |
| --------- | -------- | --------- | ------ |
| P2 | Image Transforms FeatureNotEnabled | render 403 FeatureNotEnabled curl Mode B | Re-run Mode B con ambos tokens auth |
| P2 | Auth enable + billing ausentes | env ≠ yes | Usuario debe proveer tokens exactos |
| P3 | Plan/billing audit no ejecutado | auth block | Incluir en re-run autorizado |
| P3 | Preview iframe deep UNVERIFIED | historial | PUBLIC-CATALOG-PREVIEW-AUTH-SMOKE-1 |

## 20. Rollback infra plan

No aplica (nada habilitado). Si en re-run futuro se habilita y hay incidente:

```txt
deshabilitar Image Transformations desde Supabase Dashboard
verificar render/image vuelve a 403/disabled
verificar object fallback 200
hard reload catálogo
verificar imágenes visibles vía object
no revertir código / fb19a3a / DB / assets
```

## 21. Deuda residual actualizada

```txt
P2 — Image Transforms FeatureNotEnabled (ENABLE AUTH DEBT) — esta fase
P2 — Observability prod env enable (auth debt)
P2 — Cache mutation runtime QA (auth debt)
P2 — previousSlug no pasado por callers admin
P2/P3 — Preview iframe deep / real device QA
```

## 22. Próximo paso

```txt
PUBLIC-CATALOG-IMAGE-TRANSFORMS-INFRA-1-MODE-B (re-run)
```

Requiere exactamente:

```txt
AUTORIZO_SUPABASE_IMAGE_TRANSFORMATIONS_ENABLE=yes
AUTORIZO_SUPABASE_IMAGE_TRANSFORMATIONS_BILLING_ACCEPTED=yes
```

Alternativas si se prioriza otra deuda:

```txt
PUBLIC-CATALOG-OBSERVABILITY-PROD-ENABLE-1
PUBLIC-CATALOG-CACHE-MUTATION-RUNTIME-QA-2-FOLLOWUP
PUBLIC-CATALOG-PREVIEW-AUTH-SMOKE-1
PUBLIC-CATALOG-REAL-DEVICE-QA-1
PUBLIC-CATALOG-PREVIOUS-SLUG-CALLERS-FIX-1
```
