# PUBLIC-CATALOG-OBSERVABILITY-PROD-ENABLE-1 — Controlled Production Enablement for Public Catalog Observability

## 1. Estado

```txt
BLOCKED — MISSING OBSERVABILITY PROD ENABLE AUTH
```

Fecha: 2026-07-29  
Branch: `main`  
HEAD: `5dd9b41`  
Deploy base: `fb19a3a`  
Live: `https://orderops.vercel.app`

```txt
Env principal: off/blocked (no change)
Logs prod: off
Vercel env touched: no
Redeploy: no
```

## 2. Resumen ejecutivo

No se habilitó observability normal en producción porque faltó el token exacto `AUTORIZO_PUBLIC_CATALOG_OBSERVABILITY_PROD_ENABLE=yes` (env ≠ `yes`). No se tocaron envs de Vercel, no hubo redeploy, no hubo cambios de código. Source sanity privacy-safe sigue PASS; endpoint debug/baseline POST → **204**. Para desbloquear, reenviar con autorización explícita:

```txt
AUTORIZO_PUBLIC_CATALOG_OBSERVABILITY_PROD_ENABLE=yes
```

Logs server opcionales requieren además:

```txt
AUTORIZO_PUBLIC_CATALOG_OBSERVABILITY_LOGS_PROD=yes
```

## 3. Contexto de entrada

```txt
OBSERVABILITY-1 → foundation deployed in fb19a3a
ROADMAP-DEPLOY / FINAL-HANDOFF / POST-DEPLOY-MONITOR → estable
debug-only: ?orderopsMetrics=1
NEXT_PUBLIC_ORDEROPS_PUBLIC_CATALOG_OBSERVABILITY: no habilitada
CACHE-MUTATION-FOLLOWUP → BLOCKED MISSING MUTATION AUTH (sin relación)
```

## 4. Autorizaciones

| Token | Resultado |
| ----- | --------- |
| `AUTORIZO_PUBLIC_CATALOG_OBSERVABILITY_PROD_ENABLE=yes` | **ausente** → BLOCKED |
| `AUTORIZO_PUBLIC_CATALOG_OBSERVABILITY_LOGS_PROD=yes` | ausente (N/A, enable bloqueado) |

## 5. Preflight

```txt
branch: main
HEAD: 5dd9b41
dirty: docs previos + residuales out-of-scope
runtime dirty inesperado: no
OBS_ENABLE_AUTH_EQ_YES=False
OBS_LOGS_AUTH_EQ_YES=False
```

## 6. Source sanity

```txt
PublicCatalogObservability: client, returns null, useReportWebVitals PASS
montado solo en public-catalog-page (catálogo) PASS
env gate: NEXT_PUBLIC_ORDEROPS_PUBLIC_CATALOG_OBSERVABILITY === "1" PASS
debug: ?orderopsMetrics=1 PASS
endpoint: 204, size cap, sanitize, no DB/Supabase/cookies/auth PASS
allowlist metric names PASS
no PII/cart/product IDs in contract PASS
```

No privacy contract regression.

## 7. Baseline antes de env

```txt
catalog HEAD: 200
POST /api/observability/public-catalog: 204
env normal: no tocado (sigue debug-only esperado)
```

Browser Network “sin beacons normales” no re-verificado en esta fase (bloqueo auth previo a enable); evidencia de monitor/handoff: normal off + debug 204.

## 8. Env audit

```txt
Vercel Dashboard/CLI: no consultado (auth enable ausente → no tocar)
NEXT_PUBLIC_ORDEROPS_PUBLIC_CATALOG_OBSERVABILITY: sin cambio
ORDEROPS_PUBLIC_CATALOG_OBSERVABILITY_LOGS: sin cambio
```

## 9. Env changes

```txt
ninguno
```

## 10. Deploy / redeploy

```txt
ninguno
```

## 11. Normal production smoke

```txt
NOT RUN — enable blocked
```

## 12. Debug smoke

```txt
endpoint curl baseline: 204
full browser debug re-smoke: not required under auth block
```

## 13. Checkout boundary

```txt
NOT re-run under auth block
referencia previa: Enviar pedido visible · no pedido · observability no montada en checkout (source)
```

## 14. Preview boundary

```txt
NOT RUN — enable blocked
```

## 15. Beacon volume / performance sanity

```txt
N/A — normal beacons not enabled
```

## 16. Privacy / payload verification

```txt
contract allowlist + sanitize PASS (source)
no PII/cart/product IDs/names in contract PASS
```

## 17. Seguridad / no-regression

```txt
No DB
No RLS
No RPC SQL
No migrations
No checkout action
No create_order
No real orders
No cart schema / pricing / stock / availability
No cache strategy
No Product Customization logic
No image loader/transforms
No Supabase infra enable
No preview admin logic
No CSP / PWA
No external analytics / SDK
No code changes
No commit/push funcional
No Vercel env changes
```

## 18. Resultado de comandos

```txt
OBS_ENABLE_AUTH_EQ_YES=False
metrics POST → 204
catalog HEAD → 200
tsc/build: no ejecutados
```

## 19. Hallazgos y severidad

| Severidad | Hallazgo | Evidencia | Acción |
| --------- | -------- | --------- | ------ |
| P2 | Prod enable bloqueado por auth | `OBS_ENABLE_AUTH_EQ_YES=False` | re-run con token explícito |
| P2 | Logs prod off | token logs ausente | opcional con token logs |
| P3 | Normal beacon smoke no re-ejecutado | bloqueo auth | al habilitar |

## 20. Rollback env plan

Si en un re-run futuro se habilita:

```txt
NEXT_PUBLIC_ORDEROPS_PUBLIC_CATALOG_OBSERVABILITY=0 (o unset)
unset ORDEROPS_PUBLIC_CATALOG_OBSERVABILITY_LOGS
redeploy last stable commit
verify no normal beacons
verify ?orderopsMetrics=1 still 204
```

No revertir `fb19a3a` / código.

## 21. Deuda residual actualizada

| Severidad | Deuda | Fase sugerida |
| --------- | ----- | ------------- |
| P2 | Observability prod env no habilitada | re-run esta fase con auth |
| P2 | Mutation cache runtime | CACHE-MUTATION-FOLLOWUP + auth |
| P2 | Image Transforms FeatureNotEnabled | IMAGE-TRANSFORMS-INFRA-1-MODE-B |
| P2 | previousSlug callers | PREVIOUS-SLUG-CALLERS-FIX-1 |
| P3 | Real device QA | REAL-DEVICE-QA-1 |
| P3 | Preview iframe deep | PREVIEW-AUTH-SMOKE-1 |

## 22. Próximo paso

```txt
Re-ejecutar PUBLIC-CATALOG-OBSERVABILITY-PROD-ENABLE-1
con AUTORIZO_PUBLIC_CATALOG_OBSERVABILITY_PROD_ENABLE=yes
```

Alternativas: `PUBLIC-CATALOG-IMAGE-TRANSFORMS-INFRA-1-MODE-B`, `PUBLIC-CATALOG-PREVIOUS-SLUG-CALLERS-FIX-1`, `PUBLIC-CATALOG-CACHE-MUTATION-RUNTIME-QA-2-FOLLOWUP`.
