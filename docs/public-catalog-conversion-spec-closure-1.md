# PUBLIC-CATALOG-CONVERSION-SPEC-CLOSURE-1 — Final Product & Technical Spec Closure for Public Catalog Conversion Roadmap

## 1. Estado

```txt
SPEC CLOSED
```

Fecha: 2026-07-30  
Branch: `main`  
HEAD: `5dd9b41`  
Deploy base: `fb19a3a`  
Live: `https://orderops.vercel.app`  
Audit previo: `docs/public-catalog-conversion-surfaces-audit-spec-1.md` → SPEC READY

```txt
Tipo: docs-only / contract de implementación
Código tocado: no
Deploy: no
```

## 2. Resumen ejecutivo

Se cierra el contrato de implementación para **Public Catalog Conversion Surfaces**. Hallazgo ancla: en mobile 390×844 ~1 producto en primer viewport (header sticky + hero alto + cart vacío fijo). Decisiones PO congeladas (incl. FAB **solo ícono + cantidad**, sin total). Primer deploy = paquete agrupado de polish de superficies + modal perf/UX + cart sheet + checkout/phone + QA/deploy/monitor/handoff. **Fuera del primer deploy:** post-add upsell impl, Google Places impl, large-catalog nav impl, transforms/obs/mutation auth debts. Próximo: `PUBLIC-CATALOG-SHELL-CART-SURFACES-POLISH-1`.

## 3. Contexto de entrada

```txt
PUBLIC-CATALOG-CONVERSION-SURFACES-AUDIT-SPEC-1 → SPEC READY
Hallazgo: ~1 producto visible en 390×844
Próximo previo: PUBLIC-CATALOG-SHELL-CART-SURFACES-POLISH-1
V1 estable: cache, preview deep, checkout guard, object image fallback
```

## 4. Decisiones finales del Product Owner

| Superficie | Decisión final | Implementación futura | Riesgo |
| ---------- | -------------- | --------------------- | ------ |
| Header | Hide completo scroll down; reappear scroll up; no compactar; hamburguesa intacta; nombre no siempre visible post-hero | SHELL-CART | Medio (offset/Android) |
| Hero | Compacto premium; imagen más baja; copy overlay; admin copy; sin CTA obligatorio | SHELL-CART (visual) | Bajo |
| Categories | Sticky al salir hero; top absoluto si header hidden; offset scroll; active chip; chips horizontales V1 | SHELL-CART | Medio (offset) |
| Cart vacío | Sin superficie (ni FAB 0 ni bar) | SHELL-CART | Bajo |
| Cart con items | FAB/pill: **solo ícono carrito + cantidad**; **sin total**; abre sheet | SHELL-CART | Bajo |
| Product cards | 2 cols mobile; image-first; card→detail; sin Ver detalle; `+` simple add / customizable abre modal; desc 2 líneas | PRODUCT-CARDS-GRID | Medio (taps/images) |
| Modal perf | Audit primero; re-fetch al reabrir es problema; fix solo si audit valida | PERF-AUDIT → PERF-FIX | Alto percibido |
| Modal UX | Required full-width; optional grid; CTA `Agregar · $total`; bounce CSS-only | MODAL-UX-POLISH | Bajo–medio |
| Post-add upsell | No inline principal; post-add; qty + imagen mini; **solo SPEC** en roadmap | POST-ADD-UPSELL-SPEC | Alto (cart) si se implementa |
| Cart sheet | Icon-only edit/delete; tap amplio; confirm delete; edit rehydrate; parent+adicionales | CART-SHEET-USABILITY | Bajo |
| Checkout | Delivery/Retiro cards; default Delivery; address solo Delivery; summary arriba; CTA sticky; sin Places; sin envío | CHECKOUT-CONVERSION | Bajo |
| Phone | Obligatorio AR; tel/inputmode; paste flexible; normalize; área; fase propia | PHONE-VALIDATION-AR | Bajo |
| Places | Spec propia; solo Delivery; textual only; no lat/lng/place_id; fallback manual | ADDRESS-AUTOCOMPLETE-SPEC | Billing/privacy |
| Deploy | Agrupado tras impl + integrated QA; no deploy por polish individual | CONVERSION-DEPLOY-1 | Operacional |

## 5. Performance budget cerrado

```txt
no aumentar server calls del catálogo inicial
no romper cache strategy / tags / previousSlug
no cargar Google Places en catálogo
no cargar Places hasta checkout y solo si Delivery
no agregar librerías pesadas / no framer-motion
modal lazy/on-demand salvo fix fundamentado post-audit
no corpus completo al page load
preservar Product Customization server-side validation
preservar cart schema salvo fase explícita futura (upsell impl)
preservar checkout/create_order / preview admin
mobile-first / prioridad Android Chrome
CSS transitions/keyframes livianos OK
scroll: passive + rAF/throttle o IntersectionObserver
CSS modules + tokens; no ampliar globals sin necesidad
```

## 6. Scope del primer paquete agrupado

```txt
PUBLIC-CATALOG-SHELL-CART-SURFACES-POLISH-1
PUBLIC-CATALOG-PRODUCT-CARDS-GRID-POLISH-1
PUBLIC-CATALOG-CUSTOMIZATION-MODAL-PERF-AUDIT-1
PUBLIC-CATALOG-CUSTOMIZATION-MODAL-PERF-FIX-1  (solo si audit lo valida)
PUBLIC-CATALOG-CUSTOMIZATION-MODAL-UX-POLISH-1
PUBLIC-CATALOG-CART-SHEET-USABILITY-1
PUBLIC-CATALOG-CHECKOUT-CONVERSION-POLISH-1
PUBLIC-CATALOG-CHECKOUT-PHONE-VALIDATION-AR-1
PUBLIC-CATALOG-CONVERSION-INTEGRATED-QA-1
PUBLIC-CATALOG-CONVERSION-DEPLOY-1
PUBLIC-CATALOG-CONVERSION-POST-DEPLOY-MONITOR-1
PUBLIC-CATALOG-CONVERSION-FINAL-HANDOFF-1
```

Specs ejecutables **dentro del roadmap** pero **sin impl en el primer deploy**:

```txt
PUBLIC-CATALOG-POST-ADD-UPSELL-SPEC-1
PUBLIC-CATALOG-CHECKOUT-ADDRESS-AUTOCOMPLETE-SPEC-1
PUBLIC-CATALOG-LARGE-CATALOG-NAV-SPEC-1
```

## 7. Fuera de scope del primer paquete

```txt
PUBLIC-CATALOG-POST-ADD-UPSELL-IMPL-1
PUBLIC-CATALOG-CHECKOUT-ADDRESS-AUTOCOMPLETE-IMPL-1
PUBLIC-CATALOG-LARGE-CATALOG-NAV-IMPL
Supabase Image Transformations enablement
Observability prod enable
Cache mutation runtime QA
Runtime slug rename QA
Real-device QA followup (si no hay hardware)
```

No bloqueantes del primer paquete:

```txt
Image Transforms → object fallback
Observability → debug-only
Real device → P3 si sin hardware
Places → auth/billing/spec posterior
Upsell impl → fase propia por riesgo cart/server
```

## 8. Roadmap final completo

### 0. `PUBLIC-CATALOG-CONVERSION-SURFACES-AUDIT-SPEC-1` ✅

Audit/spec inicial. Detectó ~1 producto en primer viewport y congeló la dirección general de conversión.

### 1. `PUBLIC-CATALOG-CONVERSION-SPEC-CLOSURE-1` (esta fase)

Cierre formal de decisiones, scope del primer paquete, exclusiones, budget y roadmap.

### 2. `PUBLIC-CATALOG-SHELL-CART-SURFACES-POLISH-1`

Header hide-on-scroll, categorías sticky/offset, cart vacío oculto, FAB ícono+cantidad.

### 3. `PUBLIC-CATALOG-PRODUCT-CARDS-GRID-POLISH-1`

Cards 2 columnas, image-first, card→detail, quick `+`, sin Ver detalle, desc clamp 2.

### 4. `PUBLIC-CATALOG-CUSTOMIZATION-MODAL-PERF-AUDIT-1`

Forense repeated loading: fetch count, open→ready, re-fetch, cache/prefetch budget.

### 5. `PUBLIC-CATALOG-CUSTOMIZATION-MODAL-PERF-FIX-1`

Fix post-audit (p.ej. memo sesión por productId) sin server calls iniciales ni corpus full.

### 6. `PUBLIC-CATALOG-CUSTOMIZATION-MODAL-UX-POLISH-1`

Opcionales en grilla, obligatorios full-width, CTA con total, micro-bounce CSS-only.

### 7. `PUBLIC-CATALOG-POST-ADD-UPSELL-SPEC-1`

Spec “Sumá una bebida” post-add: imagen mini, qty, omitir/continuar, invariantes cart/server. **Sin impl en primer deploy.**

### 8. `PUBLIC-CATALOG-CART-SHEET-USABILITY-1`

Iconos editar/eliminar, tap ≥44px, confirm delete, edit rehydrate, parent+adicionales.

### 9. `PUBLIC-CATALOG-CHECKOUT-CONVERSION-POLISH-1`

Delivery/Retiro cards, summary arriba, address solo Delivery, CTA sticky; sin `create_order` changes.

### 10. `PUBLIC-CATALOG-CHECKOUT-PHONE-VALIDATION-AR-1`

Tel AR: type/inputmode, paste flexible, normalize, código de área, mensajes claros.

### 11. `PUBLIC-CATALOG-CHECKOUT-ADDRESS-AUTOCOMPLETE-SPEC-1`

Places: key/billing/privacy, lazy Delivery, fallback manual, solo texto. **Sin impl en primer deploy.**

### 12. `PUBLIC-CATALOG-LARGE-CATALOG-NAV-SPEC-1`

Futuro: search/filtro/drawer para catálogos grandes. **Sin impl en primer deploy.**

### 13. `PUBLIC-CATALOG-CONVERSION-INTEGRATED-QA-1`

QA pre-deploy del paquete: catálogo, cards, modal, carrito, checkout, preview, budget; sin pedidos.

### 14. `PUBLIC-CATALOG-CONVERSION-DEPLOY-1`

Deploy controlado: tsc/build, smoke, rollback; sin DB/RLS/RPC; sin pedidos.

### 15. `PUBLIC-CATALOG-CONVERSION-POST-DEPLOY-MONITOR-1`

Monitor read-only: velocidad, errores, conversión visible, checkout boundary.

### 16. `PUBLIC-CATALOG-CONVERSION-FINAL-HANDOFF-1`

Handoff: arquitectura, UX, QA, deploy, rollback, deuda residual.

## 9. Orden operativo recomendado

```txt
0. PUBLIC-CATALOG-CONVERSION-SURFACES-AUDIT-SPEC-1 ✅
1. PUBLIC-CATALOG-CONVERSION-SPEC-CLOSURE-1
2. PUBLIC-CATALOG-SHELL-CART-SURFACES-POLISH-1
3. PUBLIC-CATALOG-PRODUCT-CARDS-GRID-POLISH-1
4. PUBLIC-CATALOG-CUSTOMIZATION-MODAL-PERF-AUDIT-1
5. PUBLIC-CATALOG-CUSTOMIZATION-MODAL-PERF-FIX-1
6. PUBLIC-CATALOG-CUSTOMIZATION-MODAL-UX-POLISH-1
7. PUBLIC-CATALOG-POST-ADD-UPSELL-SPEC-1
8. PUBLIC-CATALOG-CART-SHEET-USABILITY-1
9. PUBLIC-CATALOG-CHECKOUT-CONVERSION-POLISH-1
10. PUBLIC-CATALOG-CHECKOUT-PHONE-VALIDATION-AR-1
11. PUBLIC-CATALOG-CHECKOUT-ADDRESS-AUTOCOMPLETE-SPEC-1
12. PUBLIC-CATALOG-LARGE-CATALOG-NAV-SPEC-1
13. PUBLIC-CATALOG-CONVERSION-INTEGRATED-QA-1
14. PUBLIC-CATALOG-CONVERSION-DEPLOY-1
15. PUBLIC-CATALOG-CONVERSION-POST-DEPLOY-MONITOR-1
16. PUBLIC-CATALOG-CONVERSION-FINAL-HANDOFF-1
```

```txt
POST-ADD-UPSELL-SPEC-1 = spec en roadmap; impl NO en primer deploy salvo auth futura
ADDRESS-AUTOCOMPLETE-SPEC-1 = spec; Places impl NO en primer deploy
PERF-FIX-1 solo si PERF-AUDIT valida go
```

## 10. Dependencias y gates

| Fase | Depende de | Gate para pasar | Entra primer deploy agrupado |
| ---- | ---------- | --------------- | ---------------------------- |
| SHELL-CART | — | hide/FAB/empty/sticky PASS | sí |
| PRODUCT-CARDS | idealmente SHELL-CART | 2-col / + / sin Ver detalle | sí |
| MODAL-PERF-AUDIT | — | forense documentado + go/no-go | sí (audit) |
| MODAL-PERF-FIX | PERF-AUDIT go | no re-fetch innecesario; sin corpus | sí si go |
| MODAL-UX | ideal post PERF-FIX | grid + CTA total + a11y | sí |
| POST-ADD-UPSELL-SPEC | — | spec cerrada | spec sí / impl no |
| CART-SHEET | ideal post PRODUCT-CARDS | icons + confirm + rehydrate | sí |
| CHECKOUT-CONVERSION | — | segmented + summary + sticky CTA | sí |
| PHONE-AR | ideal post checkout polish | normalize/validate AR | sí |
| PLACES-SPEC | — | billing/privacy/fallback | spec sí / impl no |
| LARGE-CATALOG-NAV-SPEC | — | opciones documentadas | spec sí / impl no |
| INTEGRATED-QA | paquete impl | acceptance globales | sí |
| DEPLOY | INTEGRATED-QA | tsc/build/smoke/rollback | sí |
| MONITOR | DEPLOY | read-only healthy | sí |
| HANDOFF | MONITOR | deuda residual clara | sí |

## 11. Acceptance criteria globales

Antes de `CONVERSION-DEPLOY-1`:

```txt
header hide/show sin layout jump
category sticky/active no tapa títulos
cart empty no ocupa espacio
FAB solo con items: ícono + cantidad (sin total)
cards 2 columnas → más productos por viewport
+ simple agrega rápido
+ customizable abre modal
modal sin re-fetch innecesario si PERF-FIX entra
modal UX compacta + CTA total
cart sheet icon actions + tap amplio + confirm delete
checkout Delivery/Retiro segmented
summary arriba + CTA sticky
phone AR normalizado (fase incluida)
preview admin sin regresión
checkout preview bloqueado
QA sin pedido real
no server calls nuevas en catálogo inicial
no cache / cart schema / create_order regressions
tsc PASS · build PASS
```

## 12. Riesgos y mitigaciones

| Severidad | Riesgo | Mitigación |
| --------- | ------ | ---------- |
| P1 | Header hide + sticky nav offset incorrecto | scroll-margin dinámico + integrated QA + Android si hay |
| P1 | Upsell impl accidental en primer deploy | fuera de scope explícito; solo SPEC |
| P2 | Modal PERF-FIX incompleto o over-fetch | gate go/no-go desde audit; sin corpus |
| P2 | 2-col reduce tap accuracy | hit ≥44px; sizes image update |
| P2 | FAB tapa última fila | padding-bottom dinámico |
| P2 | Phone false-negatives AR | allow paste formats; mensajes claros |
| P3 | Real device / transforms / obs | deuda no bloqueante |
| P3 | Places billing surprise | spec + auth/billing antes de impl |

## 13. Seguridad / no-regression

```txt
No code / CSS changes (esta fase)
No DB / RLS / RPC / migrations
No checkout action / create_order
No real orders
No cart schema / Product Customization logic
No cache strategy / previousSlug regression
No image transforms / Supabase infra
No Vercel env / CSP / PWA
No Google Places implementation
No new dependencies
No deploy / commit/push funcional
```

Invariantes permanentes del roadmap:

```txt
create_order solo vía RPC existente
preview checkout blocked
cache tags + previousSlug intactos
server-side customization validation
```

## 14. Deuda aceptada

```txt
Post-add upsell implementation (post SPEC)
Google Places implementation (post SPEC + billing auth)
Large catalog filter/search/drawer
Image Transforms FeatureNotEnabled
Observability prod enable (auth)
Cache mutation / slug rename runtime QA (auth)
Real-device QA (hardware)
```

## 15. Resultado de comandos

```txt
branch: main
HEAD: 5dd9b41
dirty: docs previos + residuales out-of-scope + previousSlug patch local (esperado)
runtime dirty inesperado: no
tsc/build: no ejecutado (docs-only)
```

## 16. Próximo paso

```txt
PUBLIC-CATALOG-SHELL-CART-SURFACES-POLISH-1
```
