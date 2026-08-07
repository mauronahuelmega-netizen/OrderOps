# PUBLIC-CATALOG-CONVERSION-SURFACES-AUDIT-SPEC-1 — Public Catalog Conversion Surfaces Audit & Product Spec

## 1. Estado

```txt
SPEC READY
```

Fecha: 2026-07-30  
Branch: `main`  
HEAD: `5dd9b41`  
Deploy base: `fb19a3a`  
Live: `https://orderops.vercel.app`  
Demo: `/b/demohamburgueseria/catalogo`

```txt
Tipo: docs / product+technical spec only
Código tocado: no
Mutaciones: 0
Pedidos reales: 0
```

## 2. Resumen ejecutivo

El catálogo público V1 es estable en performance/cache/customization/preview, pero la capa de conversión mobile aún deja **~1 producto visible** en el primer viewport (390×844) porque header sticky (~102px), hero (~404px) y cart bar vacío fijo (~72px) compiten por espacio. Esta spec congela decisiones de producto y propone fases quirúrgicas: shell/cart FAB → product grid → modal perf audit → modal UX → post-add upsell → cart icons → checkout polish → phone AR → Places spec. Budget: sin server calls nuevas en catálogo, sin framer-motion, sin Google Places en catálogo, sin cambios de cart/create_order/cache en esta fase.

## 3. Objetivo de producto

```txt
Que el dueño del negocio venda más
```

Prioridad de conversión:

| Prioridad | Objetivo |
| --------: | -------- |
| 1 | Ver más productos por pantalla |
| 2 | Entender mejor productos personalizables |
| 3 | Agregar extras/adicionales |
| 4 | Primer producto más rápido |
| 5 | Checkout con menos fricción |
| 6 | Llegar antes al checkout |
| 7 | Teléfono/dirección más limpios (fases separadas) |

## 4. Contexto de entrada

```txt
PUBLIC-CATALOG-FINAL-HANDOFF-1 → FEATURE CLOSED
PUBLIC-CATALOG-POST-DEPLOY-MONITOR-1 → PASS WITH NON-BLOCKING QA DEBT
PUBLIC-CATALOG-PREVIEW-AUTH-SMOKE-1 → PASS WITH MINOR PREVIEW QA DEBT
PUBLIC-CATALOG-REAL-DEVICE-QA-1 → BLOCKED — REAL DEVICE UNAVAILABLE
PUBLIC-CATALOG-PREVIOUS-SLUG-CALLERS-FIX-1 → PASS WITH RUNTIME SLUG QA DEBT
```

Estado conocido preservado:

```txt
cache tags + previousSlug helper OK
preview iframe deep PASS
checkout preview guard PASS
render/image 403 FeatureNotEnabled (object fallback)
observability prod off/debug-only
```

## 5. Performance budget

Obligatorio en todas las fases derivadas:

```txt
no aumentar server calls del catálogo inicial
no romper cache strategy / tags / previousSlug
no cargar Google Places en catálogo
no cargar Places hasta checkout y solo si Delivery
no agregar librerías pesadas de animación
no usar framer-motion
mantener modal lazy/on-demand salvo recomendación fundamentada post-audit
preservar Product Customization server-side validation
preservar cart schema salvo fase explícita (post-add upsell)
preservar checkout/create_order boundaries
preservar preview admin
mobile-first / prioridad Android Chrome
CSS transitions / keyframes livianos OK
scroll listeners: passive + throttle/rAF; prefer IntersectionObserver / CSS
estilos nuevos: .module.css + tokens (no ampliar globals.css de dominio)
```

## 6. Decisiones de producto congeladas

| Superficie | Decisión |
| ---------- | -------- |
| Header | Hide completo al scroll down; reappear al scroll up; no compactar; hamburguesa intacta |
| Hero | Mantener premium; más compacto mobile; copy overlay; sin CTA obligatorio |
| Cart empty | Ocultar completamente (no FAB 0, no bar grande) |
| Cart con items | Superficie compacta FAB/pill; abre sheet |
| Cards | 2 columnas mobile; image-first; card → detail; quitar Ver detalle; `+` quick add; customizable abre modal |
| Categories | Sticky cuando sale hero; top absoluto si header hidden; active chip; chips horizontales V1 |
| Modal UX | Opcionales en grilla compacta; CTA `Agregar · $total`; micro-bounce CSS en total |
| Plus | No inline principal; post-add flow; qty propia; imagen mini |
| Cart sheet | Solo iconos Editar/Eliminar; confirm delete; edit rehydrate; parent+adicionales |
| Checkout | Delivery default / Retiro; address solo Delivery; summary arriba; CTA sticky; sin Places aún |
| Phone | Obligatorio; AR; tel/numeric; normalize; fase propia |
| Places | Fase propia; solo Delivery; textual only; fallback manual |

## 7. Audit runtime read-only

### Entorno

```txt
URL: https://orderops.vercel.app/b/demohamburgueseria/catalogo
Viewport medido: 390×844 (emulación device metrics; no sustituye real-device QA)
Hora: 2026-07-30
Pedidos: 0
```

### Métricas UX (390×844)

| Métrica | Valor |
| ------- | ----- |
| Header sticky height | ~102px |
| Hero height | ~404px |
| Category nav height | ~62px |
| Cart bar empty height | ~72px (fixed, visible) |
| Product cards total | 16 |
| Productos en primer viewport | **~1** |
| First card height | ~168px |
| Sticky header/nav | ambos `position: sticky` |
| Ver detalle presente | sí |
| Elegir opciones presente | sí |
| Cart empty visible | sí (“Carrito vacío…”) |

### Taps estimados (estado actual)

| Flujo | Taps |
| ----- | ---- |
| Agregar producto simple | 1 (`Agregar`) |
| Abrir customizable | 1 (`Elegir opciones`) |
| Completar customizable mínimo | 1 open + ≥1 required + 1 `Agregar al pedido` (≥3) |
| Abrir carrito (con items) | 1 (`Ver pedido`) |
| Ir a checkout | 1 (`Ir a confirmar pedido`) |

### Source findings clave

```txt
Header: scrollY>12 → scrolled compact styles; NO hide-on-direction (public-business-header.tsx)
Hero: catalog-hero + cover 16/9 + overlay + admin copy (catalog-client.tsx)
Category: sticky top:0; IntersectionObserver scroll-spy; scrollIntoView start (catalog-client + globals)
Cards: 1-col list; hit opens detail; Agregar/Elegir + Ver detalle (product-card.tsx)
Cart bar: always mounted; empty disabled but visible (cart-bar.tsx)
Modal: fetch getPublicProductCustomizationConfigAction on every mount; no client cache (customization-modal.tsx)
Upsell: inline UpsellSuggestionGroup inside modal
Cart sheet: text Editar/Eliminar; edit rehydrate exists
Checkout: type=tel; deliveryMethod default delivery; summary below form; submit bottom; no Places
```

### Modal loading (source)

```txt
loadState inicial: loading
useEffect([productId, slug]) → server action cada open
unmount al cerrar → pierde config → re-fetch al reabrir
"Cargando opciones…" / isPending UI
```

## 8. Header spec

**Tipo:** A — modificación de superficie existente  
**Fase:** `PUBLIC-CATALOG-SHELL-CART-SURFACES-POLISH-1`

### Comportamiento

```txt
scroll down past threshold → translateY(-100%) hide completo
scroll up → reappear
no compact-mode paralelo (eliminar dependencia de “scrolled shrink” como destino)
hamburger/menu sigue funcionando
safe-area-top respetado al reappear
prefers-reduced-motion: skip transform animation / instant toggle
```

### Parámetros recomendados

```txt
threshold: 24–48px (evitar flicker)
direction: lastY vs currentY delta ≥ 6–8px
listener: passive scroll o rAF throttle
z-index: por debajo del category nav cuando hidden; category toma top:0 / safe-area
no layout jump: usar transform, no height:0 abrupt sin spacer; category sticky top ajusta a 0 cuando header hidden
```

### Riesgos

```txt
Android Chrome address bar resize
conflicto sticky category offset
preview pan/touch cursor (desktop preview only)
```

## 9. Hero spec

**Tipo:** A  
**Fase:** shell polish o follow-up visual menor dentro de shell/cards

### Objetivo

```txt
más compacto mobile (target: reducir ~30–40% altura efectiva vs ~404px actual)
imagen protagonista + overlay copy legible
badges/status/trust chips opcionales
sin nuevas server calls
admin catalog_hero_* intactos
```

### Dirección visual

```txt
media aspect más bajo en mobile (ej. 2/1 o 21/9) o altura max clamp
copy sobre imagen con gradient overlay (ya hay overlay base)
evitar card “stack” que empuja productos fuera del primer viewport
```

## 10. Category navigation spec

**Tipo:** A  
**Fase:** `PUBLIC-CATALOG-SHELL-CART-SURFACES-POLISH-1`

```txt
sticky independiente del header
cuando header hidden → category top = safe-area / 0
active chip (ya existe --active)
IntersectionObserver scroll-spy (ya existe; retunar rootMargin/offset con header hide)
scrollIntoView con scroll-margin-top dinámico
chips horizontales V1
sin filtro por categoría en V1 conversión
```

### Escalabilidad (ver §21)

```txt
IO actual OK para decenas de secciones
cientos de productos: scroll largo; filtro/drawer = incorporación futura
```

## 11. Product cards spec

**Tipo:** A  
**Fase:** `PUBLIC-CATALOG-PRODUCT-CARDS-GRID-POLISH-1`

```txt
mobile: grid 2 columnas
image-first (imagen arriba o dominante)
metadata compacta
precio + Desde visible
description line-clamp: 2
toda la card → detail (excepto quick action)
eliminar botón "Ver detalle"
quick add: botón "+"
requiresCustomization: "+" / acción abre modal (mismo onAddProduct)
aria-labels específicos
quantity stepper: decidir compacto o solo tras add (recomendación: stepper overlay/mini tras qty>0)
```

### Riesgos

```txt
legibilidad en 2 cols
tap targets ≥44px en +
lazy/sized images (PublicStorageImage; sizes debe actualizarse a ~50vw)
evitar re-render masivo: ProductCard ya memo; no pasar cart map inestable
```

## 12. Empty cart / Cart FAB spec

**Tipo:** A  
**Fase:** `PUBLIC-CATALOG-SHELL-CART-SURFACES-POLISH-1`

### Recomendación: **Opción A — FAB compacto**

| Opción | Descripción | Veredicto |
| ------ | ----------- | --------- |
| A. FAB ícono + badge qty + total mínimo | Máximo espacio productos | **Elegida** |
| B. Pill flotante | Similar, más ancha | Alternativa OK |
| C. Mini-bar post primer producto | Más familiar, más altura | No preferida |

### Reglas

```txt
count === 0 → no render (return null)
count > 0 → FAB bottom-right (o bottom-center pill corta)
abre cart sheet
animación CSS fade/slide 180–220ms
safe-area-bottom
tap target ≥44px
no bloquear última fila de cards (padding-bottom del page dinámico)
```

## 13. Product detail spec

**Tipo:** A (menor, acoplado a cards)

```txt
detail modal permanece para exploración
CTA primario: Agregar / Elegir opciones según requiresCustomization
no competir con Ver detalle (eliminado en card)
mantener PublicStorageImage sized
```

## 14. Customization modal performance audit

**Tipo:** C — auditoría técnica previa obligatoria  
**Fase:** `PUBLIC-CATALOG-CUSTOMIZATION-MODAL-PERF-AUDIT-1`

### Hallazgo actual (source)

```txt
fetch on-demand por open
sin Map productId→config en CatalogClient
unmount destruye state
posible waterfall percibido ("Cargando opciones")
```

### Hipótesis a forensicar en audit

```txt
duplicate RSC/action calls
cold server action latency
no HTTP cache client
skeleton blocking scroll perception
```

### Direcciones candidatas (post-audit, sin subir corpus)

```txt
session memo Map<productId, config> en CatalogClient
stale-while-open
prefetch idle solo visibles customizables (budgeted, opt-in)
NO cargar corpus completo
NO nuevas server calls en page load inicial
```

## 15. Customization modal UX spec

**Tipo:** A  
**Fase:** `PUBLIC-CATALOG-CUSTOMIZATION-MODAL-UX-POLISH-1` (después o en paralelo controlado post-perf)

```txt
required groups: full width list
optional groups: compact grid ≤2 cols mobile
tap targets compactos pero ≥40–44px
sin highlight especial price delta (precio inline OK)
footer sticky CTA: `Agregar · $18.250` / `Actualizar · $…`
micro-bounce CSS en número total al cambiar
prefers-reduced-motion: disable bounce
preservar radio/checkbox a11y (labels existentes)
upsell inline: retirar del flujo principal → post-add (§16)
```

## 16. Post-add upsell spec

**Tipo:** B — nueva incorporación funcional mayor  
**Fase previa:** `PUBLIC-CATALOG-POST-ADD-UPSELL-SPEC-1` → luego implement

### Por qué es mayor

```txt
cambia modal flow
cart composition UX
edit configured item
upsell quantity
checkout/dashboard summary expectations
```

### Invariantes a preservar

```txt
server-side validation
parent_order_item_id / child lines
stock tracking
snapshots históricos
preview mode / preview cart keys
```

### UX objetivo

```txt
tras Agregar al pedido, si hay plus → pantalla/sheet "Sumá una bebida"
qty propia + imagen mini
omitir / continuar
no sección Plus inline dominante
```

## 17. Cart sheet usability spec

**Tipo:** A  
**Fase:** `PUBLIC-CATALOG-CART-SHEET-USABILITY-1`

```txt
Editar / Eliminar → icon-only (Pencil / Trash2)
aria-labels obligatorios
tap target ≥44px
Eliminar parent → confirm dialog/sheet
edit → reopen modal con initialSelection (ya parcialmente existe handleEditParent)
adicionales como parte del parent en UI
qty parent actualiza bundle (comportamiento actual a validar/ajustar sin romper schema)
```

## 18. Checkout conversion spec

**Tipo:** A  
**Fase:** `PUBLIC-CATALOG-CHECKOUT-CONVERSION-POLISH-1`

```txt
segmented cards: [Delivery] [Retiro en local]
default Delivery (ya)
address hidden si pickup (ya condicional)
summary ABOVE form
sticky submit CTA bottom + safe-area
disabled/loading/error states claros
sin Places
sin precio de envío
no submit en QA
```

## 19. Phone validation spec

**Tipo:** B/C  
**Fase:** `PUBLIC-CATALOG-CHECKOUT-PHONE-VALIDATION-AR-1`

Estado actual: `type="tel"`, required, trim; sin normalización AR profunda.

```txt
inputmode tel/numeric
autocomplete tel
permitir paste con espacios/guiones
normalizar client + server
requerir código de área
mensajes claros
no rechazo injustificado formatos comunes AR
WhatsApp formatting compatibility
```

## 20. Google Places / address autocomplete future spec

**Tipo:** B + C  
**Fase:** `PUBLIC-CATALOG-CHECKOUT-ADDRESS-AUTOCOMPLETE-SPEC-1`

```txt
solo checkout + Delivery
lazy load script
sugerencia preferida + fallback manual
guardar solo texto de dirección
NO lat/lng / place_id / barrio / localidad / ref extra
NO country/city hard limit V1
API key + billing + privacy + CSP review
dashboard maps link compatibility
failure mode documentado
```

No implementar en conversión shell/cards.

## 21. Large catalog scalability analysis

| Escala | Navegación actual (secciones + IO) | Riesgo | Futuro |
| ------ | ---------------------------------- | ------ | ------ |
| <50 productos / ~5 cats | OK | bajo | — |
| 50–150 | scroll largo | medio | chips + search |
| 150+ | fatiga scroll | alto | filtro categoría / drawer / virtualize list |

V1 conversión: **no filtro**. Documentar como deuda de producto para tenants grandes.

## 22. Accessibility requirements

```txt
tap ≥44px en FAB / + / icon buttons
aria-labels en icon-only
focus visible en cards
header hide no atrapa focus offscreen
reduced-motion en hide/FAB/price bounce
modal: focus trap / escape (mantener o mejorar)
cart confirm delete anunciable
```

## 23. Analytics / observability considerations

```txt
no agregar analytics externo en fases de polish
métricas existentes privacy-safe opcionales: hydrated_ms, CLS-ish custom
eventos conversión futuros (si obs enable): add_to_cart, open_modal, open_cart, begin_checkout — sin PII/product names IDs si contract lo prohíbe
no habilitar obs prod en esta spec
```

## 24. Risk matrix

| Severidad | Riesgo | Área | Mitigación |
| --------- | ------ | ---- | ---------- |
| P1 | Header hide + sticky nav offset incorrecto | shell | dynamic scroll-margin + real Android QA |
| P1 | Post-add upsell rompe parent/child cart | upsell | spec dedicada + server validation intacta |
| P2 | Modal refetch lentitud percibida | customization | PERF-AUDIT antes de UX polish agresivo |
| P2 | 2-col cards reduce tap accuracy | cards | hit areas + sizes image update |
| P2 | FAB tapa última fila | cart | page padding-bottom dinámico |
| P2 | Places billing/privacy | checkout future | spec+auth billing aparte |
| P3 | Real device unverified | QA | REAL-DEVICE followup |
| P3 | Image transforms 403 | images | object fallback; Mode B auth |

## 25. Phase breakdown recommendation

| # | Fase | Tipo | Dependencias |
| - | ---- | ---- | ------------ |
| 1 | `PUBLIC-CATALOG-SHELL-CART-SURFACES-POLISH-1` | A | — |
| 2 | `PUBLIC-CATALOG-PRODUCT-CARDS-GRID-POLISH-1` | A | shell recomendable primero |
| 3 | `PUBLIC-CATALOG-CUSTOMIZATION-MODAL-PERF-AUDIT-1` | C | — |
| 4 | `PUBLIC-CATALOG-CUSTOMIZATION-MODAL-UX-POLISH-1` | A | post #3 ideal |
| 5 | `PUBLIC-CATALOG-POST-ADD-UPSELL-SPEC-1` | B/C | antes de implementar upsell |
| 6 | `PUBLIC-CATALOG-CART-SHEET-USABILITY-1` | A | puede tras #2 |
| 7 | `PUBLIC-CATALOG-CHECKOUT-CONVERSION-POLISH-1` | A | — |
| 8 | `PUBLIC-CATALOG-CHECKOUT-PHONE-VALIDATION-AR-1` | B | tras #7 o paralelo |
| 9 | `PUBLIC-CATALOG-CHECKOUT-ADDRESS-AUTOCOMPLETE-SPEC-1` | B/C | última; billing |

Orden de conversión (producto): **1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9**.

## 26. Acceptance criteria by future phase

### SHELL-CART

```txt
header hide/show direction PASS
category sticky top correcto PASS
empty cart no DOM surface PASS
FAB solo con items PASS
sin jank severo Android (device QA)
sin nuevas server calls
```

### PRODUCT-CARDS-GRID

```txt
2 cols mobile PASS
sin Ver detalle PASS
+ quick add PASS
customizable abre modal PASS
≥2–4 productos visibles primer viewport (post shell) target
images lazy/sized PASS
```

### MODAL-PERF-AUDIT

```txt
timeline open→ready documentado
fetch count 1st vs 2nd open
recomendación cache/prefetch con budget
sin implement obligatoria en la audit
```

### MODAL-UX

```txt
optional grid PASS
CTA con total PASS
reduced motion PASS
a11y radios PASS
```

### POST-ADD-UPSELL-SPEC

```txt
flow/cart/server invariants documentados
riesgos P1 listados
go/no-go implementación
```

### CART-SHEET

```txt
icon actions + confirm delete PASS
edit rehydrate PASS
```

### CHECKOUT-CONVERSION

```txt
segmented Delivery/Retiro PASS
summary above PASS
sticky CTA PASS
no Places PASS
no pedido en QA
```

### PHONE-AR / PLACES-SPEC

```txt
según docs dedicados + auth billing Places
```

## 27. Seguridad / no-regression

```txt
No DB
No RLS
No RPC SQL
No migrations
No checkout action changes
No create_order changes
No real orders
No cart schema changes
No Product Customization logic changes
No cache strategy changes
No image loader/transforms
No Supabase infra enable
No Vercel env changes
No CSP changes
No PWA changes
No external analytics
No Google Places implementation
No new dependencies
No code changes
No deploy
No commit/push funcional
```

## 28. Deuda residual actualizada

```txt
P2 — Conversion layer (spec ready; implementación pendiente) — esta fase
P2 — Modal customization repeated fetch (audit pending)
P2 — Post-add upsell (spec pending)
P2 — Image Transforms FeatureNotEnabled
P2 — Observability prod enable (auth)
P2 — Cache mutation runtime (auth)
P2 — Runtime slug rename QA (auth)
P3 — Real device QA
P3 — Large-catalog filter mode (future)
P3 — Places billing/privacy (future spec)
```

## 29. Próximo paso recomendado

```txt
PUBLIC-CATALOG-SHELL-CART-SURFACES-POLISH-1
```

Rationale: ataca prioridad #1 (más productos visibles) y #6 (menos distracción hacia checkout) con cambio de superficie existente, sin tocar cart schema ni Places ni corpus customization.
