# PUBLIC-CATALOG-CUSTOMIZATION-MODAL-PERF-AUDIT-1 — Forensic Audit of Customization Modal Repeated Loading

## 1. Estado

**PERF AUDIT COMPLETE — FIX RECOMMENDED**

## 2. Resumen ejecutivo

Cada apertura del modal de personalización (incluido reopen del mismo producto) vuelve a mostrar “Cargando opciones…” y dispara fetch on-demand vía server action. La config vive solo en estado local del modal; al cerrar, `CatalogClient` pone `customizationSession = null` y desmonta el modal. El loader usa `noStore()`. En local, cada open dispara **2** POSTs `Next-Action` (~1.3–1.8s c/u) → ready ~2.7–3.7s. Productos simples no fetchean. Fix recomendado: cache client por `productId` en `CatalogClient` + dedupe in-flight (**A+B**). Audit-only: sin implementación.

## 3. Contexto de entrada

Shell/cart/cards/singleton PASS WITH PREVIEW QA DEBT. Modal funciona pero loading repetido. Deploy base `fb19a3a`.

## 4. Preflight

| Campo | Valor |
| ----- | ----- |
| Branch | `main` |
| HEAD | `5dd9b41` |
| Dirty tree | shell/cart/cards/docs esperados |
| Runtime dirty inesperado | **no** (sin cambios modal/API inesperados) |

## 5. Source flow map

```txt
ProductCard "+" (customizable)
  → CatalogClient.handleAddProductById
  → openCustomizationModal(product)
  → setCustomizationSession({ productId, ... })
  → mount <CustomizationModal /> (dynamic import, ssr:false)
  → loadState = { status: "loading" }  // "Cargando opciones…"
  → useEffect([productId, slug]) → getPublicProductCustomizationConfigAction
  → ready | error | disabled

Close:
  → onClose → setCustomizationSession(null)
  → unmount CustomizationModal → config local descartada
```

| Check | Hallazgo |
| ----- | -------- |
| Abre modal | `openCustomizationModal` |
| Carga config | `getPublicProductCustomizationConfigAction` en modal `useEffect` |
| Loading state | local `loadState` en modal |
| Config cargada | solo en `loadState` del modal |
| Index por productId | **no** |
| Reset al cerrar | **sí** (session null → unmount) |
| AbortController | **no**; flag `cancelled` en cleanup |
| In-flight dedupe | **no** |
| API route | **no** — server action |
| Page summary | summary-lite en card; **no** config completa |

Detail path: `ProductDetailModal` CTA “Elegir opciones” → `onCustomize` → **mismo** `openCustomizationModal`.

## 6. Loader / endpoint audit

| Ítem | Detalle |
| ---- | ------- |
| Entry | `app/b/[slug]/catalogo/actions.ts` → `getPublicProductCustomizationConfigAction` |
| Loader | `lib/product-customization/public.ts` → `getPublicProductCustomizationConfig` |
| Cache | **`noStore()`** en loader |
| Flag | `isProductCustomizationEnabled` (action + loader; fail-closed) |
| Tenancy | `getRequestPublicBusiness(slug)` → `business.id`; queries `.eq("business_id", businessId)` |
| Product | requiere `is_available`; corpus scoped a `[productId]` |
| Tablas | products, assignments, overrides, groups, options, upsell_* |
| Client | service client en corpus (cookie-free) |
| HTTP cache | N/A (server action POST, no route cacheable) |

## 7. Runtime audit — first open

Producto: BBQ Bacon · local `http://localhost:3000/b/demohamburgueseria/catalogo` · 390 emulado.

| Métrica | Valor |
| ------- | ----: |
| open→modal visible | 562 ms |
| modal visible→options ready | 3131 ms |
| open→ready | 3693 ms |
| requests customization (Next-Action POST) | **2** |
| request duration ms | 1770 / 1304 |
| payload KB | UNVERIFIED |
| duplicate requests | **sí (2)** |
| status | 200 / 200 |
| Muestra “Cargando opciones” | **sí** |

Nota: primer open más lento a modal (~562ms) vs reopens (~115–127ms) → coste `dynamic()` chunk primera vez.

## 8. Runtime audit — close and reopen same product

| Reopen | Muestra loading | Requests nuevos | Ready ms | Observación |
| -----: | --------------- | --------------: | -------: | ----------- |
| #1 | sí | 2 | 2960 | POST 1511 + 1319 |
| #2 | sí | 2 | 2816 | POST 1347 + 1330 |
| #3 | sí | 2 | 2818 | POST 1341 + 1340 |

Clasificación:

```txt
cada reopen dispara fetch nuevo: SÍ
config queda en memoria: NO
browser 304/memory cache: NO (server action fresh / noStore)
loading aunque cacheada: N/A — siempre refetch
```

## 9. Runtime audit — multiple customizable products

| Paso | Loading | POSTs | Ready ms |
| ---- | ------- | ----: | -------: |
| A first (BBQ) | sí | 2 | 3693 |
| B first (Doble Smash) | sí | 2 | 3298 |
| A reopen | sí | 2 | 3012 |

Conclusión: cache futuro **debe ser por `productId`**; no hay mezcla A/B en source (session/productId explícito).

## 10. Runtime audit — simple product control

Coca Cola quick add:

| Check | Resultado |
| ----- | --------- |
| customization fetch | **0 POSTs** |
| modal loading | **no** |
| quick + add | PASS |

## 11. Runtime audit — detail modal path

| Check | Resultado |
| ----- | --------- |
| Card → detail → “Elegir opciones” | PASS |
| Loading | sí |
| POSTs | 2 |
| Ready | ~3360 ms |
| Path | mismo `openCustomizationModal` + mismo modal fetch |

## 12. Network profile

| Campo | Valor |
| ----- | ----- |
| URL | `POST /b/demohamburgueseria/catalogo` |
| Method | POST |
| Status | 200 |
| Duration | ~1.3–1.9s cada uno |
| Initiator | `fetch` (Next server action / `Next-Action`) |
| Response size | UNVERIFIED |
| Cache-Control | N/A (action) |
| Repeated per open | **sí — 2×** |

Hipótesis H5: doble invoke del `useEffect` (cleanup `cancelled` + remount típico de React Strict Mode en Next/React 19). Aunque en prod fuera 1 request, H1–H3 siguen obligando refetch en cada reopen.

## 13. Render / perceived performance

| Ítem | Observación |
| ---- | ----------- |
| Loading skeleton | “Cargando opciones…” hasta ready |
| Long tasks | UNVERIFIED (no Profiler) |
| Scroll lock | `body.overflow = hidden` mientras modal montado |
| Layout jump loading→ready | percibido al poblar grupos/upsell (cualitativo) |
| Main thread block | no medido; demora dominada por red/action (~3s) |

H6: **parcial** — red/action es el cuello principal; render no explica ~3s alone.  
H7: upsell/imágenes pueden alargar percepción post-ready; no medido como causa primaria del loading.

## 14. Security / tenant boundary audit

| Check | Source |
| ----- | ------ |
| businessId desde slug server | PASS |
| queries filtradas por business_id | PASS |
| producto available | PASS |
| flag fail-closed | PASS |
| no business_settings anon leak en client | PASS (server action) |
| cross-tenant productId | mitigado por businessId + product row lookup |

Sin incidente P0/P1 de tenancy en esta auditoría.

## 15. Root cause diagnosis

**Confirmed**

```txt
ROOT CAUSE: no client-side cache by productId; config stored only in
CustomizationModal local state and discarded on close (CatalogClient clears
customizationSession → unmount). Each open refetches via
getPublicProductCustomizationConfigAction → getPublicProductCustomizationConfig
(noStore()). Local/dev additionally fires two duplicate Next-Action POSTs per
open (effect remount / missing in-flight dedupe), amplifying perceived delay.
```

Hipótesis:

| ID | Estado |
| -- | ------ |
| H1 | **Confirmed** |
| H2 | **Confirmed** |
| H3 | **Confirmed** |
| H4 | Partial — no “config activa” en CatalogClient; solo session metadata |
| H5 | **Confirmed (local/dev)** — 2 POSTs/open |
| H6 | Partial — red domina |
| H7 | Not primary |
| H8 | Confirmed pattern — `noStore()` + server action (no HTTP cache útil) |

## 16. Fix options evaluated

| Opción | Beneficio | Riesgo | Recomendación |
| ------ | --------- | ------ | ------------- |
| A — Map cache por productId en CatalogClient | reopen instantáneo; sin +calls iniciales | stale si admin edita mid-session | **Sí (core)** |
| B — In-flight dedupe | elimina doble POST / races | implementación cuidadosa con Abort | **Sí (junto a A)** |
| C — Keep last config | reopen último producto rápido | no escala multi-product | No como fix principal |
| D — Idle prefetch N visibles | less cold open | +server calls; fuera budget primer fix | Diferir |
| E — Server/route cache | menos DB | invalidación / tags complejos | No primero |

## 17. Recommended fix contract

**Fase:** `PUBLIC-CATALOG-CUSTOMIZATION-MODAL-PERF-FIX-1`

**Archivos a tocar (previstos):**

- `components/public/catalog/catalog-client.tsx` — Map/`ref` cache + in-flight promises por productId
- `components/public/catalog/customization-modal.tsx` — aceptar `config`/`cached` opcional; loading solo si miss
- posiblemente helper pequeño colocalizado (sin deps nuevas)

**Invariantes:**

- no aumentar server calls del catálogo inicial
- no prefetch agresivo de todos los customizables
- no tocar summary-lite / page cache tags
- no cambiar cart schema / checkout / create_order
- no cambiar validation server-side
- tenancy/flag fail-closed intactos
- preview mode intacto

**Acceptance:**

- reopen mismo producto: sin “Cargando opciones” (o flash &lt;~50ms) y **0** nuevos action posts si cache hit
- primer open sigue on-demand
- producto B no usa config de A
- simple products sin fetch
- detail path comparte cache
- tsc/build PASS

**Rollback:** revertir solo cache/dedupe wiring; no tocar corpus loader ni actions salvo props passthrough.

## 18. Performance budget impact

Fix A+B: **reduce** modal roundtrips en reopen; **no** aumenta page-load calls; no corpus completo; no libs.

## 19. Seguridad / no-regression

Audit-only: sin cambios de código. Checklist: no DB/RLS/RPC/checkout/create_order/cart/cache strategy/image/env/CSP/deploy/commit.

## 20. Resultado de comandos

| Comando | Resultado |
| ------- | --------- |
| `git status --short` | dirty shell/cards/docs esperado |
| `tsc` / `build` | no ejecutados (audit-only, sin código) |

## 21. Hallazgos y severidad

| Severidad | Hallazgo | Evidencia | Acción |
| --------- | -------- | --------- | ------ |
| P2 | Refetch + loading en cada reopen | reopen tables; source unmount | FIX-1 A+B |
| P2 | 2× Next-Action por open (local) | network profile | dedupe (B) |
| P3 | Primer open + dynamic chunk | open→modal 562ms first | OK / opcional |
| Info | `noStore()` en loader | public.ts | no cambiar en primer fix |
| P3 | Preview deep UNVERIFIED | deuda previa | follow-up |

## 22. Deuda residual actualizada

1. **CUSTOMIZATION-MODAL-PERF-FIX-1** (A+B)
2. Modal UX polish (después de perf)
3. Preview admin deep / real device
4. previousSlug / Image Transforms / upsell roadmap

## 23. Próximo paso

**PUBLIC-CATALOG-CUSTOMIZATION-MODAL-PERF-FIX-1**
