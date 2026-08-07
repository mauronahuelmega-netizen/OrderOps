# PUBLIC-CATALOG-CACHE-MUTATION-RUNTIME-QA-2 — Runtime QA for Public Catalog Cache Invalidation After Admin Mutations

## 1. Estado

```txt
PASS WITH RUNTIME MUTATION AUTH DEBT
```

Fecha: 2026-07-29  
Branch: `main`  
HEAD: `5dd9b41`  
Deploy base: `fb19a3a`  
Live: `https://orderops.vercel.app`  
Modo: **A — Source + no-write QA** (sin mutaciones productivas)

## 2. Resumen ejecutivo

Se completó auditoría source de invalidación del cache público y baseline read-only en producción. **No** se ejecutaron mutaciones admin porque faltó `AUTORIZO_CACHE_MUTATION_RUNTIME_QA_PROD=yes` (y autorizaciones separadas de ordering/slug/flag). El helper `revalidatePublicCatalogCache` está cableado en products/categories/public settings/operations/customizations; store session usa `revalidatePath` + overlay `noStore`. Checkout boundary y metrics debug siguen PASS. Timing/TTL runtime queda deuda hasta Modo B autorizado.

## 3. Contexto de entrada

```txt
CACHE-STRATEGY-1 / CACHE-DEPLOY-1 (81ae607)
CACHE-INVALIDATION-QA-1 → PASS WITH MUTATION QA DEBT
ROADMAP-DEPLOY-1 → fb19a3a
POST-DEPLOY-MONITOR-1 → PASS WITH NON-BLOCKING QA DEBT
Dirty: docs handoff/monitor + residuales out-of-scope; sin runtime dirty inesperado
```

## 4. Modo de ejecución / autorizaciones

| Token | Presente | Efecto |
| ----- | -------- | ------ |
| `AUTORIZO_CACHE_MUTATION_RUNTIME_QA_PROD` | **no** | Modo B no ejecutado |
| `AUTORIZO_CACHE_ORDERING_STATUS_RUNTIME_QA_PROD` | **no** | Modo C no ejecutado |
| `AUTORIZO_SLUG_RENAME_CACHE_QA_PROD` | **no** | Modo D no ejecutado |
| `AUTORIZO_PRODUCT_CUSTOMIZATION_FLAG_TOGGLE_QA_PROD` | **no** | Modo E no ejecutado |

```txt
Modo ejecutado: A
Mutaciones productivas: 0
Restauraciones: N/A
```

## 5. Source audit de invalidation

### Helper

`lib/catalog/public-cache-tags.ts`

```txt
tags: public-business:{slug}, public-catalog:{businessId}, public-customization:{businessId}
updateTag + revalidatePath(/b/{slug}/catalogo)
previousSlug: soportado en helper (updateTag + revalidatePath old paths)
```

`updateTag` solo aparece en este helper (llamado desde Server Actions).

### Fresh overlay

```txt
getPublicCatalogPageData → stable cache + getFreshPublicOrderingStatus (noStore)
store session toggle → revalidatePath catalogo/checkout/layout (dashboard/actions.ts)
NO updateTag de tags estables en open/close (correcto)
```

### Matriz source

| Área | Action | Scope esperado | Source PASS/FAIL | Nota |
| ---- | ------ | -------------- | ---------------- | ---- |
| Products | create/update/availability | catalog (+ customization summaries vía scope catalog) | PASS | `products/actions.ts` |
| Categories | create/update | catalog | PASS | `categories/actions.ts` |
| Public settings | update branding/hero | business | PASS | `settings/public/actions.ts` |
| Operations settings | update scheduled | business | PASS | `settings/operations/actions.ts` |
| Customizations | groups/options/assignments/upsells vía helper | customization | PASS | `customizations/actions.ts` → scope customization (también toca catalog tag por helper) |
| Store session | open/close | fresh overlay + path | PASS | `revalidatePath` only; no stable tags |
| Slug rename | previousSlug | business old+new | PARTIAL | helper PASS; **ningún caller admin pasa `previousSlug`** |
| Flag toggle | product_customization_enabled | business/settings cache | PARTIAL | flag vive en settings cacheadas; runtime toggle UNVERIFIED |

## 6. Baseline público

```txt
URL: https://orderops.vercel.app/b/demohamburgueseria/catalogo
status: 200
categorías: Bebidas, COMBOS, EMPANADAS, HAMBURGUESAS, PIZZAS
CTAs: Agregar / Elegir opciones
Desde: visible
estado operativo: visible
[QA cache suffix]: ausente (PASS)
console critical: none observado en fetch baseline
```

Targets runtime **no mutados** (captura conceptual para Modo B futuro):

| Target | Campo sugerido | Visible | Ruta admin |
| ------ | -------------- | ------- | ---------- |
| Producto low-risk | description + `[QA cache HHMM]` | card/detail | `/admin/products` |
| Categoría | description/name corto | nav | `/admin/categories` |
| Public settings | hero microcopy | hero | `/admin/settings/public` |
| Customization group | description Papas/Salsas | modal | `/admin/products/customizations` |

## 7. Product mutation QA

```txt
UNVERIFIED — no auth (Modo A)
```

## 8. Category mutation QA

```txt
UNVERIFIED — no auth (Modo A)
```

## 9. Public settings mutation QA

```txt
UNVERIFIED — no auth (Modo A)
```

## 10. Customization mutation QA

```txt
UNVERIFIED — no auth (Modo A)
Source: revalidatePublicCatalogCache scope customization PASS
```

## 11. Ordering status freshness QA

```txt
UNVERIFIED — no auth ordering
Source: noStore + getFreshPublicOrderingStatus + revalidatePath PASS
```

## 12. Slug rename / previousSlug QA

```txt
Source-level only
Helper previousSlug PASS
Admin callers previousSlug: no matches → deuda P2
Runtime UNVERIFIED — no AUTORIZO_SLUG_RENAME_CACHE_QA_PROD
```

## 13. Product Customization flag toggle QA

```txt
Source-level only
Flag en business_settings / cache business
Fail-closed documentado en flags.ts
Runtime UNVERIFIED — no AUTORIZO_PRODUCT_CUSTOMIZATION_FLAG_TOGGLE_QA_PROD
```

## 14. Checkout boundary

```txt
/b/demohamburgueseria/checkout → 200
Enviar pedido visible: PASS (browser session con carrito previo)
items/adicionales visibles: PASS
no pedido enviado: PASS
```

## 15. Observability / metrics sanity

```txt
POST /api/observability/public-catalog → 204 (curl baseline)
payload privacy-safe contract intacto
sin env prod enable en esta fase
```

Debug URL disponible: `?orderopsMetrics=1` (no se re-midió beacons browser en esta fase; smoke endpoint 204 sí).

## 16. Timing / TTL evidence

| Area | t0 | t1 | Δ visible | t2 | t3 | Δ restore | Clasificación |
| ---- | -- | -- | --------- | -- | -- | --------- | ------------- |
| Product | — | — | — | — | — | — | UNVERIFIED — no auth |
| Category | — | — | — | — | — | — | UNVERIFIED — no auth |
| Public settings | — | — | — | — | — | — | UNVERIFIED — no auth |
| Customization | — | — | — | — | — | — | UNVERIFIED — no auth |
| Ordering | — | — | — | — | — | — | UNVERIFIED — no auth |

TTL fallback 60s documentado en strategy; **no medido runtime**.

## 17. Restore verification

```txt
todos los valores originales restaurados: N/A (sin mutaciones)
sin sufijos QA visibles: PASS (baseline público sin [QA cache)
```

## 18. Seguridad / no-regression

```txt
No DB manual writes
No SQL direct mutation
No RLS
No RPC SQL
No migrations
No checkout action
No create_order
No real orders
No cart schema changes
No pricing changes
No stock changes
No availability changes
No cache strategy changes
No Product Customization logic changes
No image loader/transforms
No Supabase infra enable
No preview admin logic changes
No CSP changes
No PWA changes
No env vars changed
No deploy
No commit/push
All QA suffixes restored: N/A (ninguno creado)
```

## 19. Resultado de comandos

```txt
git: main @ 5dd9b41
dirty: docs + residuales out-of-scope (esperado)
MUTATION_AUTH_PRESENT=False
tsc/build/lint: no ejecutados (docs-only / sin código)
catalog 200 · metrics 204 · checkout 200
```

## 20. Hallazgos y severidad

| Severidad | Hallazgo | Evidencia | Acción |
| --------- | -------- | --------- | ------ |
| P2 | Runtime mutation QA no ejecutada | auth token ausente | re-run Modo B con `AUTORIZO_CACHE_MUTATION_RUNTIME_QA_PROD=yes` |
| P2 | Ordering freshness runtime | auth ordering ausente | Modo C con token separado |
| P2 | previousSlug no cableado en callers | grep admin sin `previousSlug` | FOLLOWUP o slug QA autorizado |
| P2 | Flag toggle runtime | auth flag ausente | Modo E en tenant de prueba |
| P3 | Checkout fetch sin carrito no muestra Enviar | session-dependent | browser con cart PASS |

## 21. Deuda residual

| Severidad | Deuda | Fase sugerida |
| --------- | ----- | ------------- |
| P2 | Mutation runtime coverage | CACHE-MUTATION-RUNTIME-QA-2-FOLLOWUP (Modo B) |
| P2 | Ordering status runtime | FOLLOWUP Modo C |
| P2 | previousSlug callers | FOLLOWUP / SLUG QA |
| P2 | Flag toggle runtime | FOLLOWUP Modo E |
| P2 | Image Transforms FeatureNotEnabled | IMAGE-TRANSFORMS-INFRA-1-MODE-B |
| P2 | Observability prod env | OBSERVABILITY-PROD-ENABLE-1 |
| P3 | Real device QA | REAL-DEVICE-QA-1 |

## 22. Rollback recommendation

```txt
NO recomendado
Sin mutaciones
Sin P0/P1
Sin cambios de código/deploy
```

Para futuro Modo B: restaurar siempre por UI/admin oficial antes de cerrar.

## 23. Próximo paso

```txt
PUBLIC-CATALOG-CACHE-MUTATION-RUNTIME-QA-2-FOLLOWUP
```

Requiere autorización explícita:

```txt
AUTORIZO_CACHE_MUTATION_RUNTIME_QA_PROD=yes
```

Alternativas sin mutación: `PUBLIC-CATALOG-OBSERVABILITY-PROD-ENABLE-1`, `PUBLIC-CATALOG-IMAGE-TRANSFORMS-INFRA-1-MODE-B`, `PUBLIC-CATALOG-REAL-DEVICE-QA-1`.
