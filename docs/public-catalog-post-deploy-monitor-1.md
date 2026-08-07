# PUBLIC-CATALOG-POST-DEPLOY-MONITOR-1 — Post-Deploy Production Monitor for Public Catalog V1

## 1. Estado

```txt
PASS WITH NON-BLOCKING QA DEBT
```

Fecha: 2026-07-29  
Branch: `main`  
HEAD: `5dd9b41`  
Deploy base funcional: `fb19a3a`  
Live: `https://orderops.vercel.app`  
Modo: QA / monitor / docs-only (sin código, sin deploy, sin commit/push)

## 2. Resumen ejecutivo

Monitor productivo read-only del catálogo público V1 tras handoff final. Health HTTP, catálogo (~16 productos / 5 categorías), Product Customization (BBQ Bacon → Papas/Salsas/Agregados → Agregar al pedido), cart sheet, checkout boundary sin submit, observability debug 204, performance measured, Image Transforms debt esperada (`FeatureNotEnabled`), preview shell con iframe, mobile 390px sticky sin blur. Sin P0/P1. Deudas P2/P3 conocidas permanecen.

## 3. Contexto de entrada

```txt
PUBLIC-CATALOG-FINAL-HANDOFF-1 → FEATURE CLOSED — DEPLOYED WITH NON-BLOCKING QA DEBT
Último paquete funcional: fb19a3a
Referencia roadmap: TTFB~37 / DCL~1008 / load~1980 / metrics 204 / render 403
Dirty tree: docs handoff + residuales out-of-scope (sin runtime dirty inesperado)
```

## 4. Health check HTTP

| Path | Status | CSP | XFO | Location |
| ---- | -----: | --- | --- | -------- |
| `/b/demohamburgueseria/catalogo` | 200 | `frame-ancestors 'self'` | null | — |
| `/b/demohamburgueseria/checkout` | 200 | `frame-ancestors 'self'` | null | — |
| `/admin/products/preview` | 200* | `frame-ancestors 'self'` | null | — |

\* HEAD previo en sesión sin auth era 307→`/admin/login`; en browser session con auth el preview cargó 200.  
`cache-control`: `private, no-cache, no-store, max-age=0, must-revalidate`  
Metrics POST directo: **204**

## 5. Catalog smoke

```txt
status: PASS
productos: ~16 (1+5+2+5+3)
categorías: 5 (Bebidas, COMBOS, EMPANADAS, HAMBURGUESAS, PIZZAS)
estado: Estamos tomando pedidos
simple: Clásica / Combos → CTA Agregar
customizable: BBQ Bacon / Doble Smash → Elegir opciones + hint Personalizalo
cursor: auto (sin pan público)
console errors críticos: none
```

## 6. Product Customization smoke

```txt
producto: BBQ Bacon
modal: PASS (Armá tu pedido)
Papas / Salsas / Agregados extra: PASS
required: CTA Agregar al pedido disabled hasta Papas; alert “Elegí una opción en Papas”
selección: Papas chicas → Agregar al pedido enabled → cart 8 productos
parent + Papas en cart sheet: PASS
Plus/Bebida en BBQ: no visible en este producto (esperado si no configurado)
sin JSON raw / sin error client crítico
```

## 7. Cart / checkout boundary

**Cart**

```txt
cart bar: Ver pedido con 8 productos PASS
cart sheet: Revisá tu carrito PASS
BBQ Bacon + Papas chicas PASS
Doble Smash parent + adicional Coca visible PASS
Ir a confirmar pedido PASS
```

**Checkout**

```txt
URL: /b/demohamburgueseria/checkout
Enviar pedido visible: PASS
items/adicionales correctos (BBQ + Papas; Doble Smash + adicional): PASS
no pedido enviado: PASS
no success page: PASS
```

## 8. Observability debug

```txt
?orderopsMetrics=1
POST /api/observability/public-catalog → 204
browser beacons: 4
curl metrics: 204
payload contract privacy-safe (source/version/path/slug allowlist)
NEXT_PUBLIC flag off → beacons solo en debug (estado ops esperado)
sin UI visible de metrics
```

## 9. Performance sanity

Clasificación: **measured** (CDP, viewport 390×844 tras emulación)

| Métrica | Monitor | Referencia roadmap |
| ------- | ------: | -----------------: |
| TTFB | ~108 ms | ~37 ms |
| DCL | ~824 ms | ~1008 ms |
| load | ~1513 ms | ~1980 ms |
| storage resources | 36 | ~36 |
| render attempts | 18 | ~18 |
| object currentSrc | 19 | ~19 |
| render currentSrc | 0 | 0 |

Sin claim de mejora/regresión definitiva. TTFB más alto en esta muestra; DCL/load mejores o similares → **no** clasificar PERF WATCH.

## 10. Image transforms status

```txt
render/image: 403 FeatureNotEnabled (curl logo)
object: 200 ~940521 bytes (logo)
currentSrc: object only (render=0)
imágenes visibles: PASS
severidad: P2 infra debt esperada
```

## 11. Preview boundary

```txt
/admin/products/preview
shell: PASS (auth session disponible en browser)
iframe src: /b/demohamburgueseria/catalogo?orderopsPreview=1 PASS
Modo seguro / checkout deshabilitado copy: PASS
Vaciar carrito de prueba button: PASS
iframe deep CTA/modal interactions: UNVERIFIED (herramienta no accede contenido iframe)
CSP frame-ancestors 'self': PASS
```

## 12. Console / network errors

```txt
critical: none
hydration mismatch visible: none
nextjs error dialog: none
expected non-blocking: render/image 403 FeatureNotEnabled (resource attempts presentes)
```

## 13. Mobile / device QA

```txt
viewport emulado 390×844: PASS
sticky/fixed backdrop-filter: none (header, category nav, cart bar)
superficies sólidas: PASS
cursor: auto
Android/iOS real: UNVERIFIED → P3/P2 device debt
```

## 14. Cache / freshness observation

```txt
estado operativo visible y consistente con checkout (tomando pedidos)
reload/navigate catalog estable
sin señales de stale extremo
sin mutaciones admin (mutation QA sigue fase separada)
```

## 15. Seguridad / no-regression

```txt
No DB
No RLS
No RPC SQL
No checkout action
No create_order
No real orders
No cart schema changes
No cache strategy changes
No Product Customization logic changes
No image loader/transforms changes
No Supabase Image Transformations enable
No preview admin logic changes
No CSP changes
No PWA changes
No analytics externo
No env vars changed
No deploy
No commit/push
```

## 16. Resultado de comandos

```txt
git: main @ 5dd9b41
dirty: docs handoff + residuales out-of-scope (esperado)
tsc/build/lint: no ejecutados (docs-only / sin código)
metrics POST: 204
health catalog/checkout: 200
```

## 17. Hallazgos y severidad

| Severidad | Hallazgo | Evidencia | Acción |
| --------- | -------- | --------- | ------ |
| P2 | Image Transforms FeatureNotEnabled | render 403; object 200; currentSrc object | deuda infra; MODE-B con auth |
| P2 | Observability prod env off | beacons solo con `?orderopsMetrics=1` | OBSERVABILITY-PROD-ENABLE-1 |
| P2 | Mutation cache runtime QA pendiente | no mutaciones en este monitor | CACHE-MUTATION-RUNTIME-QA-2 |
| P2/P3 | Real device QA | solo emulación 390px | REAL-DEVICE-QA-1 |
| P3 | Iframe deep preview interactions | shell OK; iframe content no inspeccionable | PREVIEW-AUTH-SMOKE-1 |
| P3 | Lint circular histórico | tooling | no bloquea |
| — | TTFB sample 108 vs ref 37 | variance; DCL/load OK | vigilar informal; no rollback |

## 18. Deuda residual

| Severidad | Deuda | Fase sugerida |
| --------- | ----- | ------------- |
| P2 | FeatureNotEnabled transforms | IMAGE-TRANSFORMS-INFRA-1-MODE-B |
| P2 | Observability prod env | OBSERVABILITY-PROD-ENABLE-1 |
| P2 | Mutation cache runtime smoke | CACHE-MUTATION-RUNTIME-QA-2 |
| P2/P3 | Real device Android/iOS | REAL-DEVICE-QA-1 |
| P3 | Preview iframe deep smoke | PREVIEW-AUTH-SMOKE-1 |
| P3 | Lint circular / docs untracked locales | limpieza opcional |

## 19. Rollback recommendation

```txt
NO recomendado
Sin P0/P1 atribuible a fb19a3a
```

Si en el futuro aparece P0/P1:

```bash
# requiere AUTORIZO_ROLLBACK_PUBLIC_CATALOG=yes
git revert fb19a3a
git push origin main
```

Sin rollback DB/Supabase. No borrar pedidos.

## 20. Próximo paso

```txt
PUBLIC-CATALOG-CACHE-MUTATION-RUNTIME-QA-2
```

Alternativas: `IMAGE-TRANSFORMS-INFRA-1-MODE-B` (con autorización billing), `OBSERVABILITY-PROD-ENABLE-1`, `REAL-DEVICE-QA-1`.
