# PUBLIC-CATALOG-PREVIEW-AUTH-SMOKE-1 — Authenticated Admin Preview Deep Smoke for Public Catalog V1

## 1. Estado

```txt
PASS WITH MINOR PREVIEW QA DEBT
```

Fecha: 2026-07-29  
Branch: `main`  
HEAD: `5dd9b41`  
Deploy base: `fb19a3a`  
Live: `https://orderops.vercel.app`  
Preview: `https://orderops.vercel.app/admin/products/preview`  
Iframe: `/b/demohamburgueseria/catalogo?orderopsPreview=1`

```txt
Auth admin: PASS (manageProducts)
Iframe deep: PASS (same-origin CDP)
Pedidos reales: 0
Código tocado: no
```

## 2. Resumen ejecutivo

Se ejecutó smoke autenticado profundo de `/admin/products/preview` con sesión admin real. Shell en modo seguro, iframe same-origin al catálogo con `orderopsPreview=1`, CTAs/customization/cart/checkout preview verificados dentro del iframe vía CDP. Carrito preview aislado de keys públicas; clear cart vació preview sin tocar público; checkout preview muestra **Confirmación deshabilitada**; checkout público normal muestra **Enviar pedido** (sin submit). CSP `frame-ancestors 'self'`. Deuda menor: flags HttpOnly de cookie no visibles en `document.cookie` (esperado) y real device fuera de alcance.

## 3. Contexto de entrada

```txt
ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-HANDOFF-1 → FEATURE CLOSED — DEPLOYED WITH ACCEPTED DEVICE QA DEBT
PUBLIC-CATALOG-ROADMAP-DEPLOY-1 → DEPLOYED WITH NON-BLOCKING QA DEBT
PUBLIC-CATALOG-FINAL-HANDOFF-1 → FEATURE CLOSED
PUBLIC-CATALOG-POST-DEPLOY-MONITOR-1 → PASS WITH NON-BLOCKING QA DEBT
PUBLIC-CATALOG-IMAGE-TRANSFORMS-INFRA-1-MODE-B → BLOCKED — MISSING IMAGE TRANSFORMS ENABLE AUTH
```

Deuda atacada:

```txt
P3/P2 — Preview iframe deep interactions UNVERIFIED → cerrado en runtime autenticado
```

## 4. Preflight

```txt
branch: main
HEAD: 5dd9b41
dirty tree: docs previos + residuales out-of-scope + tsbuildinfo
runtime dirty inesperado: no
últimos commits: 5dd9b41 docs stamp · 55f866f docs deploy · fb19a3a polish catalog
```

## 5. Source sanity

```txt
route /admin/products/preview + requireAdminPermission(manageProducts) PASS
iframeSrc buildCatalogPreviewPath(slug, catalogo) → ?orderopsPreview=1 PASS
cookie orderops-admin-catalog-preview Max-Age 300, httpOnly, sameSite lax, path /b/{slug} PASS
preview cart keys orderops-preview-cart* PASS
public cart keys orderops-cart* PASS
checkout UI block + shouldBlockCatalogPreviewOrder (cookie | clientDeclaredPreview) PASS
clear cart postMessage ORDEROPS_PREVIEW_CLEAR_CART + ACK + remount fallback PASS (source)
CSP frame-ancestors 'self' in next.config.ts PASS
```

Sin regresión de guard de checkout preview.

## 6. Headers / CSP

| URL | Status | CSP | Notes |
| --- | ------ | --- | ----- |
| `/admin/products/preview` (sin cookie sesión en curl) | 307 → `/admin/login` | `frame-ancestors 'self'` | esperado |
| `/b/demohamburgueseria/catalogo` | 200 | `frame-ancestors 'self'` | sin X-Frame-Options DENY |
| `/b/demohamburgueseria/checkout` | 200 | `frame-ancestors 'self'` | |

## 7. Authenticated preview shell

```txt
clasificación: PASS
no redirect a login (sesión admin activa)
shell: Vista previa del catálogo
Modo seguro activo visible
Acciones: Vaciar carrito de prueba · Copiar link catálogo público
Checklist visible
iframe src: /b/demohamburgueseria/catalogo?orderopsPreview=1
iframe rect desktop ~388×842
```

## 8. Preview iframe deep smoke

Vía `iframe.contentDocument` (same-origin):

```txt
catálogo carga PASS
categorías Bebidas/COMBOS/EMPANADAS/HAMBURGUESAS/PIZZAS PASS
CTAs Agregar / Elegir opciones PASS
Agregar simple → cart bar "1 producto" (Coca Cola 500ml) PASS
Elegir opciones → modal BBQ Bacon PASS
Papas/Salsas/Agregados + gate obligatorio PASS
Papas chicas → Agregar al pedido → cart bar "2 productos · $16.500" PASS
cart sheet legible (Coca + BBQ + Papas: Papas chicas) PASS
sin JSON raw en UI PASS
```

## 9. Cart isolation

```txt
preview: orderops-preview-cart / orderops-preview-cart-v2
público: orderops-cart / orderops-cart-v2
```

Evidencia runtime:

- Tras adds preview: preview keys con items; público previo (Doble Smash legacy QA) **no** reemplazado por items preview.
- Tras clear preview: preview `[]`; público **intact** hasta cleanup explícito QA.
- Pestaña pública sin `orderopsPreview`: sin banner preview; usa carrito público.

## 10. Clear cart preview

```txt
clasificación: PASS
```

Botón shell **Vaciar carrito de prueba** → preview keys `[]` · cart bar "Carrito vacío" · público no vaciado accidentalmente.

ACK vs remount no instrumentado en Network; resultado funcional PASS (posible ACK o remount interno).

## 11. Preview checkout guard

```txt
href iframe: /b/demohamburgueseria/checkout?orderopsPreview=1
mensaje: La confirmación de pedidos está deshabilitada en la vista previa del catálogo.
botón: Confirmación deshabilitada (disabled)
no Enviar pedido
no success
no pedido enviado
```

Source server: `shouldBlockCatalogPreviewOrder` en `createPublicCheckoutOrderAction`. No se forzó bypass.

## 12. Public normal boundary

```txt
/b/demohamburgueseria/catalogo sin orderopsPreview PASS
sin mensaje preview PASS
checkout público: Enviar pedido visible (enabled) PASS
no pedido enviado PASS
```

## 13. Preview cookie boundary

```txt
nombre: orderops-admin-catalog-preview
source Path: /b/{slug}
source Max-Age: 300
source HttpOnly: true · SameSite: Lax · Secure: production
document.cookie: cookie NO visible → consistente con HttpOnly
```

Flags DevTools Application: **partially UNVERIFIED** (no bloquea; source + runtime guard PASS).

## 14. Product Customization behavior

Dentro iframe preview:

```txt
BBQ Bacon modal ARMÁ TU PEDIDO PASS
Desde / precio base / required Papas PASS
Salsas / Agregados extra visibles PASS
Agregar al pedido → preview cart v2 con BBQ Bacon PASS
cart sheet estructura legible PASS
checkout preview bloquea confirmación PASS
sin JSON raw PASS
```

## 15. Observability / metrics sanity

```txt
POST /api/observability/public-catalog (isPreview:true payload mínimo) → 204
envs observability no tocados
sin PII/cart content en probe
```

## 16. Console / network

```txt
sin create_order / success page
CSP frame-ancestors self OK
render/image 403 FeatureNotEnabled: deuda conocida no bloqueante
HEAD preview sin auth 307 esperado
```

## 17. Viewport smoke

| Viewport | overflow-X | acciones | iframe |
| -------- | ---------- | -------- | ------ |
| 390×844 | no | Vaciar/Copiar visibles | ~356×591 |
| 768×1024 | no | visibles | ~388×799 |
| 1920×1080 (desktop tool) | no | visibles | ~388×842 |

Real device: no obligatorio / pendiente P3.

## 18. Cleanup local QA state

```txt
preview cart: []
public QA cart: limpiado a [] al cierre
sin borrar datos remotos
sin pedidos reales
```

## 19. Seguridad / no-regression

```txt
No DB / RLS / RPC / migrations
No checkout action / create_order changes
No real orders
No cart schema / pricing / stock / availability
No cache strategy / Product Customization logic
No image loader/transforms / Supabase infra
No Vercel env / CSP / PWA
No code / deploy / commit
Preview + public QA carts cleaned
```

## 20. Resultado de comandos

```txt
git: main @ 5dd9b41 · docs dirty esperados
curl headers: preview 307 · catalog/checkout 200 · CSP frame-ancestors 'self'
metrics POST: 204
tsc/build: no ejecutado (sin código)
```

## 21. Hallazgos y severidad

| Severidad | Hallazgo | Evidencia | Acción |
| --------- | -------- | --------- | ------ |
| P3 | Cookie flags Application parcialmente UNVERIFIED | HttpOnly no en `document.cookie` | Aceptado; source PASS |
| P3 | Clear ACK vs remount no instrumentado | clear funcional PASS | Opcional telemetría QA |
| P3 | Real device pendiente | viewport tool only | PUBLIC-CATALOG-REAL-DEVICE-QA-1 |
| P2 | Image Transforms FeatureNotEnabled | histórico | Mode B con auth |
| — | Preview iframe deep cerrado | smoke autenticado PASS | deuda P2/P3 preview deep cerrada |

## 22. Deuda residual actualizada

```txt
P2 — Image Transforms FeatureNotEnabled (auth)
P2 — Observability prod enable (auth)
P2 — Cache mutation runtime (auth)
P2 — previousSlug callers admin
P3 — Real device QA
P3 — Preview cookie Application flags (minor)
```

Deuda **Preview iframe deep UNVERIFIED**: cerrada en esta fase.

## 23. Rollback recommendation

Sin cambios de código ni datos remotos → no rollback.

Si regresión futura de guard:

```txt
hotfix preview guard / cart isolation
no revertir fb19a3a sin P0 + auth explícita
```

## 24. Próximo paso

```txt
PUBLIC-CATALOG-REAL-DEVICE-QA-1
```

Alternativas: `PUBLIC-CATALOG-PREVIOUS-SLUG-CALLERS-FIX-1` · `PUBLIC-CATALOG-OBSERVABILITY-PROD-ENABLE-1` · `PUBLIC-CATALOG-IMAGE-TRANSFORMS-INFRA-1-MODE-B` · `PUBLIC-CATALOG-CACHE-MUTATION-RUNTIME-QA-2-FOLLOWUP`
