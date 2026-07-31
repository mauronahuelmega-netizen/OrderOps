# PUBLIC-CATALOG-CUSTOMIZATION-MODAL-PERF-FIX-1 — Client Cache & In-flight Dedupe for Customization Modal

## 1. Estado

**PASS WITH PREVIEW QA DEBT**

## 2. Resumen ejecutivo

Se implementó el fix A+B recomendado por la auditoría: cache client-side por `slug:productId` en `CatalogClient` e in-flight dedupe por producto. El primer open sigue on-demand (loading + **1** `Next-Action` POST lógico). Los reopens del mismo producto son cache-hit: **0** POSTs, sin “Cargando opciones”, ready inmediato (~40–50 ms). Productos distintos no mezclan configs. Productos simples no fetchean. Detail path comparte el mismo cache. Sin cambios server loader/`noStore`, DB/RLS/RPC, checkout/create_order, cart schema, cache tags, image, CSP/PWA ni deploy.

## 3. Contexto de entrada

Fase previa: `PUBLIC-CATALOG-CUSTOMIZATION-MODAL-PERF-AUDIT-1` → **PERF AUDIT COMPLETE — FIX RECOMMENDED**.

Causa raíz: config solo en estado local de `CustomizationModal`; close → `customizationSession = null` → unmount → refetch. Loader con `noStore()`. Local/dev audit: **2** POSTs por open.

## 4. Preflight

| Campo | Valor |
| ----- | ----- |
| Branch | `main` |
| HEAD | `5dd9b41` |
| Dirty tree | shell/cart/cards/docs + fix modal/cache esperado; `app/super-admin/.../actions.ts` prior; sin dirty checkout/create_order/migrations |
| Runtime dirty inesperado | **no** |
| Últimos commits | `5dd9b41` docs stamp · `55f866f` roadmap · `fb19a3a` polish catalog |

## 5. Source audit

| Pregunta | Respuesta |
| -------- | --------- |
| `customizationSession` | estado en `CatalogClient` |
| `getPublicProductCustomizationConfigAction` | llamado solo desde `ensureCustomizationConfig` en `CatalogClient` (ya no desde modal `useEffect`) |
| Modal fetch interno | **eliminado**; modal controlado por `loadState` |
| Close | `setCustomizationSession(null)` — unmount modal; **cache queda** en refs |
| Open card `+` | `handleAddProductById` → `openCustomizationModal` |
| Open detail CTA | `ProductDetailModal.onCustomize` → mismo `openCustomizationModal` |
| Action return | `{ ok, enabled?, config?, error? }` mapeado por `loadStateFromActionResult` |
| `loadState` | `loading` \| `ready` \| `error` \| `disabled` |

## 6. Implementación

1. Helper colocalizado `customization-config-cache.ts` (tipos + key + mappers).
2. `CatalogClient`: `customizationConfigCacheRef` + `customizationInflightRef` + `ensureCustomizationConfig` + ownership de `loadState` en session.
3. `CustomizationModal`: props `loadState` + `onRetry`; sin fetch propio.
4. Race guard: `applyCustomizationLoadState` solo si `current.productId === productId`.

## 7. Cache por productId

| Ítem | Valor |
| ---- | ----- |
| Cache key | `` `${slug}:${productId}` `` |
| Cachea | `ready`, `disabled` |
| No cachea | errores de red/server (`ok: false`) |
| Lifetime | memoria de la instancia `CatalogClient` (sesión de página) |
| Persistencia | **no** localStorage |

## 8. In-flight dedupe

| Ítem | Valor |
| ---- | ----- |
| Structure | `Map<key, Promise<CustomizationLoadState>>` |
| Duplicate open | reutiliza la misma Promise |
| Cleanup | `finally` → `delete(key)` |
| Efecto observado | primer open local: **1** POST (antes 2) |

## 9. Modal loading contract

| Caso | Comportamiento |
| ---- | -------------- |
| Cache hit | abre con `ready` — sin loading |
| Cache miss | abre `loading` → fetch dedupe → `ready`/`error`/`disabled` |
| Error | UI error + **Reintentar** → `retryCustomizationLoad` (sin cachear error) |

## 10. Race guards / close behavior

- `setCustomizationSession` funcional valida `productId` activo.
- Close antes de resolve: no reabre; update ignorado si session null o producto distinto.
- A→B: B no pinta opciones de A (títulos verificados).

## 11. Error / retry behavior

- Error no se cachea.
- Retry fuerza `loading` y reusa `ensureCustomizationConfig` (dedupe + fill cache si éxito).
- Cerrar y reabrir tras error puede reintentar (miss de cache).

## 12. Simple product boundary

Coca Cola `Sumar uno`: FAB 4→5 productos, **0** customization POSTs, sin modal customization.

## 13. Detail path cache sharing

`onCustomize` → mismo `openCustomizationModal` / cache. Con A ya cacheado: customize ready, **0** POSTs, sin loading.

## 14. Product behavior QA

| Check | Resultado |
| ----- | --------- |
| Required Papas gate | CTA disabled hasta seleccionar |
| Selección Papas chicas | habilita Agregar |
| Agregar al pedido | FAB 5→6; cart sheet muestra BBQ + child `Papas: Papas chicas` |
| Edit/remove | botones presentes en sheet (smoke) |

## 15. Preview admin boundary

**UNVERIFIED** (sin auth admin en esta sesión). Estado permitido: **PASS WITH PREVIEW QA DEBT**. No se tocaron preview cookie/CSP/postMessage/keys/checkout preview guard.

## 16. Checkout boundary

`/b/demohamburgueseria/checkout`: formulario + **Enviar pedido** visible con carrito hidratado. **NO** submit. **NO** pedido real.

## 17. Runtime/browser QA

Viewport local ~mobile · `http://localhost:3000/b/demohamburgueseria/catalogo`.

### First open A (BBQ Bacon, post hard reload)

| Métrica | Valor |
| ------- | ----: |
| Loading visible | sí (`loadingSeen`) |
| Next-Action POST count | **1** |
| Status | 200 |
| Options ready | sí (Papas/Salsas/Agregados) |

### Reopen A #1–#3

| Reopen | Loading visible | New POSTs | Ready ms | Cache hit |
| -----: | --------------- | --------: | -------: | --------- |
| 1 | no | 0 | ~48 | sí |
| 2 | no | 0 | ~48 | sí |
| 3 | no | 0 | ~42 | sí |

### A → B → A

| Paso | Resultado |
| ---- | --------- |
| B (Doble Smash) | config propia (upsell Coca visible); título Doble Smash |
| A reopen | BBQ Bacon; 0 POSTs; no loading |

### Simple product

| Check | Resultado |
| ----- | --------- |
| Coca Cola + | 0 POST · sin modal · FAB qty↑ |

### Detail path

| Check | Resultado |
| ----- | --------- |
| Customize con A cacheado | 0 POST · ready · Papas |

## 18. Performance sanity

| Check | Resultado |
| ----- | --------- |
| Server calls nuevas en page load | **no** (baseline POST 0) |
| Primer open on-demand | **sí** |
| Reopen cache hit 0 POST | **sí** |
| Fetch por scroll/card | **no** |
| Prefetch masivo / corpus | **no** |
| New deps | **no** |
| Before (audit) | reopen → 2 POSTs, ~2.8–3.0s |
| After | reopen → 0 POSTs, ~40–50 ms |

## 19. Seguridad / no-regression

No DB · No RLS · No RPC · No migrations · No checkout action · No create_order · No real orders · No cart schema · No localStorage keys · No pricing/stock · No Product Customization server validation · No corpus/`noStore` · No cache tags/strategy · No image loader · No env/CSP/PWA · No Google Places · No post-add upsell · No new deps · No framer-motion · No deploy · No commit/push funcional.

## 20. Resultado de comandos

| Command | Result |
| ------- | ------ |
| `npx tsc --noEmit` | **PASS** (exit 0) → `tmp/perf-fix-1-tsc.txt` |
| `npm run build` | **PASS** (exit 0) → `tmp/perf-fix-1-build.txt` / prior `tmp/modal-perf-fix-build.txt` |
| lint | no ejecutado |

## 21. Hallazgos y severidad

| Severidad | Hallazgo | Evidencia | Acción |
| --------- | -------- | --------- | ------ |
| Info | Primer open sigue ~2.9s server action (`noStore`) | 1 POST ~2.9s | Deuda residual; no mover a page load |
| Info | Preview admin deep no validado | sin auth | PREVIEW QA DEBT |
| Resuelto | Doble POST local por open | ahora 1 POST | dedupe inflight |
| Resuelto | Reopen refetch + loading | 0 POST / no loading | cache CatalogClient |

## 22. Deuda residual actualizada

1. Preview admin iframe QA (auth).
2. Primer open latency dominada por server action + `noStore` (aceptable; no prefetch).
3. UX polish del modal (próxima fase).
4. Dirty tree acumulado shell/cards/docs (commit fuera de esta fase).

## 23. Rollback plan

Revertir solo:

- `components/public/catalog/customization-config-cache.ts`
- cambios cache/dedupe/load ownership en `catalog-client.tsx`
- props controladas en `customization-modal.tsx`
- docs de esta fase / entradas CURRENT_PHASE + LIVING_MEMORY

No revertir: shell/cart, product cards, singleton width, server loader/action, cache strategy, checkout/create_order, DB/RLS.

## 24. Próximo paso

**PUBLIC-CATALOG-CUSTOMIZATION-MODAL-UX-POLISH-1**
