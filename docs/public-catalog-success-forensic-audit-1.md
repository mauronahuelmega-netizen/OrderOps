# PUBLIC-CATALOG-SUCCESS-FORENSIC-AUDIT-1

## Estado

**AUDIT COMPLETE — SUCCESS READY FOR FLAT POLISH**

Sin blockers P0 de seguridad o contrato que impidan polish visual. Deudas de producto (`public_order_code`, validación de `order_id`, preview-aware return) quedan fuera de polish y documentadas como backlog.

## Contexto

Tras el cierre del polish visual del Checkout (flat, sticky footer, dark inputs) y la pausa de Maps/address validation, la Success Page del catálogo público sigue en diseño legacy (`app/globals.css` + `Card`/`Button` genéricos).

Capturas / QA previo alineadas con evidencia de esta auditoría:

- Header de negocio correcto.
- Canvas con gran espacio vacío antes de la card (`place-items: center` + `min-height: 100vh`).
- Card con sombra / borde legacy (`ui-card` + `--shadow-card`).
- Dark mode sin parity real: `data-catalog-theme="dark"` no cambia fondos de success.
- Título grande en mobile (~32px).
- Número de pedido = UUID completo desde query.
- CTA WhatsApp naranja (`Button variant="accent"` → `rgb(249, 115, 22)`), no teal del checkout flat.
- “Volver al catálogo” secundario básico hacia `/b/{slug}/catalogo`.

Decisión de producto (no implementar ahora): futuro código público corto alfanumérico tipo `#K7P4Q9`. No inventar short code desde UUID en frontend.

## Git preflight

```text
Branch: cursor-handoff-public-catalog-ui-redesign
HEAD:   b2321b0 docs(public-catalog): audit checkout before flat polish

Dirty previo (checkout polish / Maps metadata — no tocado en esta fase):
M  components/public/checkout/address-autocomplete.module.css
M  components/public/checkout/address-autocomplete.tsx
M  components/public/checkout/checkout-client.module.css
M  components/public/checkout/checkout-client.tsx
?? docs/public-catalog-checkout-address-fallback-ux-1.md
?? docs/public-catalog-checkout-address-maps-metadata-capture-1.md
?? docs/public-catalog-checkout-address-maps-validation-forensic-audit-1.md
?? docs/public-catalog-checkout-address-maps-validation-spec-1.md
?? docs/public-catalog-checkout-copy-density-polish-1.md
?? docs/public-catalog-checkout-dark-input-surface-tuning-1.md
?? docs/public-catalog-checkout-flat-polish-1.md
?? docs/public-catalog-checkout-scroll-room-calibration-1.md
?? docs/public-catalog-checkout-sticky-footer-safe-area-followup-1.md
?? docs/public-catalog-checkout-sticky-total-simplify-1.md

Prohibiciones respetadas: sin pull/reset/restore global/clean/checkout/push/deploy;
sin cambios runtime/CSS/DB/RPC/WhatsApp/order creation.
```

## Documentos revisados

| Documento | Estado |
|-----------|--------|
| `docs/public-catalog-checkout-forensic-audit-1.md` | Encontrado (commiteado en `b2321b0`) |
| `docs/public-catalog-checkout-flat-polish-1.md` | Encontrado (untracked) |
| `docs/public-catalog-checkout-sticky-footer-safe-area-followup-1.md` | Encontrado (untracked) |
| `docs/public-catalog-checkout-scroll-room-calibration-1.md` | Encontrado (untracked) |
| `docs/public-catalog-checkout-copy-density-polish-1.md` | Encontrado (untracked) |
| `docs/public-catalog-checkout-address-fallback-ux-1.md` | Encontrado (untracked) |
| `docs/public-catalog-checkout-sticky-total-simplify-1.md` | Encontrado (untracked) |
| `docs/public-catalog-checkout-dark-input-surface-tuning-1.md` | Encontrado (untracked) |
| `docs/public-catalog-checkout-address-maps-validation-forensic-audit-1.md` | Encontrado (untracked) |
| `docs/public-catalog-checkout-address-maps-validation-spec-1.md` | Encontrado (untracked) |
| `docs/public-catalog-checkout-address-maps-metadata-capture-1.md` | Encontrado (untracked) |
| `docs/public-catalog-ui-redesign-cursor-handoff-2026-08-06.md` | Encontrado |
| `docs/public-catalog-ux-ui-redesign-spec-closure-1.md` | Encontrado |

Búsqueda previa success / order id / WhatsApp / admin abbreviation: hits en `app/b/[slug]/success/page.tsx`, `lib/whatsapp/public.ts`, `components/admin/orders/order-card.tsx`, `admin-order-workspace-modal.tsx`, checkout redirect. **No** existe doc previo dedicado a Success flat polish ni a `public_order_code`.

## Archivos inspeccionados

```text
app/b/[slug]/success/page.tsx syn — Success Server Component
app/globals.css — estilos .success-* (legacy global)
app/b/[slug]/checkout/actions.ts — create order / preview guards (contexto)
app/b/[slug]/checkout/page.tsx — preview flag en checkout
components/public/checkout/checkout-client.tsx — redirect a success
lib/whatsapp/public.ts — buildPublicOrderWhatsappUrl
components/admin/orders/order-card.tsx — buildOrderDisplayRef (4 chars)
components/admin/orders/admin-order-workspace-modal.tsx — mismo helper local
types/database.ts — sin public_order_code (rg: 0 matches)
lib/admin/catalog-preview-shared.ts / catalog-preview.ts — usados en catalogo/checkout, no en success
```

No se modificó ninguno en esta fase.

## Ruta / contrato Success

| Pregunta | Evidencia | Respuesta |
|----------|-----------|-----------|
| Ruta exacta | `app/b/[slug]/success/page.tsx` | `/b/{slug}/success` |
| Search params | `searchParams.order_id?: string` | Solo `order_id` (opcional). Slug vía `params`. |
| Server vs client | `export default async function SuccessPage` | **Server Component** |
| ¿Consulta Supabase del pedido? | Código de página | **No**. Solo `requirePublicBusinessBySlug(slug)` para negocio. |
| ¿Lee datos del pedido real? | — | **No**. El `order_id` se renderiza desde query tal cual. |
| Falta `order_id` | Browser QA + código | Página carga; **omite** el box de número; copy de éxito se mantiene; WhatsApp sin línea `Pedido:`. |
| `order_id` inválido | `?order_id=invalid` | **No valida UUID**. Muestra el string “invalid” en el box; WhatsApp incluye `Pedido: invalid`. No crash. |
| Pedido de otro negocio | No hay fetch de order | **No hay check de ownership**. No filtra por `business_id` porque no lee la fila. Solo refleja el query param (riesgo de UX engañosa, no de leak de PII de pedido vía DB). |
| Preview guard | Comparado con checkout/catalogo | **No**. Success no lee preview cookie/flag. |
| Datos sensibles | Página | Muestra `business.name`, UUID en query si viene, link WhatsApp con número del negocio. **No** muestra teléfono/dirección/nombre del cliente. |

Redirect desde checkout (contrato a preservar):

```text
components/public/checkout/checkout-client.tsx
router.push(`/b/${slug}/success?order_id=${encodeURIComponent(orderId)}`);
```

## Datos mostrados

| Elemento | Contenido actual |
|----------|------------------|
| Eyebrow | “Pedido registrado” |
| Título | “Tu pedido fue recibido correctamente” |
| Negocio | `business.name` (ej. “La Burguesía”) |
| Copy | Confirmación + paso WhatsApp |
| Número / ID | Label “Número de pedido” + **UUID completo** si `order_id` presente |
| CTA primario | “Confirmar por WhatsApp” → `wa.me` |
| CTA secundario | “Volver al catálogo” → `/b/{slug}/catalogo` |
| Otros | Header shell del negocio (layout público) |

**Sí muestra UUID completo** cuando hay `order_id`.

## WhatsApp handoff

Fuente: `lib/whatsapp/public.ts` → `buildPublicOrderWhatsappUrl`.

| Aspecto | Comportamiento |
|---------|----------------|
| URL | `https://wa.me/{digits}?text={encodeURIComponent(message)}` |
| Número | `business.whatsapp_number` con strip no-dígitos |
| Mensaje | “¡Hola! Ya registré mi pedido en OrderOps.” + opcional `Pedido: {orderId}` + “Te escribo para continuar la confirmación por WhatsApp.” |
| Incluye order_id completo | **Sí**, si está en query |
| Customer data | **No** (nombre/teléfono/dirección del cliente no van en el mensaje) |
| encodeURIComponent | **Sí** sobre el mensaje completo |
| Nueva pestaña | `target="_blank"` + `rel="noreferrer"` |
| Dependencia | Config negocio (`whatsapp_number`) + query `order_id`; **no** fetch del pedido |
| Teléfono faltante | `cleanedNumber` vacío → `https://wa.me/?text=...` (link degradado; CTA igual se renderiza) |

Browser QA (shape sin PII completa): host `wa.me`, phone digits length 13 en demo, mensaje con `Pedido:` + UUID cuando hay `order_id`. **No se envió WhatsApp real.**

## Volver al catálogo

| Aspecto | Evidencia |
|---------|-----------|
| href | `/b/${slug}/catalogo` |
| Respeta slug | Sí |
| Query params | Limpia (path limpio sin `order_id`) |
| Catálogo público | Sí, ruta pública |
| Preview | **No** vuelve a preview; siempre público aunque el flujo hubiera sido preview (Success no es preview-aware) |

## Visual actual

Estilos en `app/globals.css` (`.success-page`, `.success-panel`, `.success-order-id`, …). Card usa componente `Card` → sombra legacy. Comparado con checkout flat (module CSS + tokens canvas/surface, sin sombra fuerte, accent teal).

### Light

- Canvas: `var(--color-bg)` medido `rgb(248, 250, 252)`.
- Panel: blanco, border `1px solid rgba(15,23,42,0.08)`, radius ~20px, shadow `rgba(15,23,42,0.04) 0 8px 24px`.
- Order box: fondo azul suave hardcoded `rgba(37, 99, 235, 0.06)`.
- WA CTA: naranja `rgb(249, 115, 22)`.

### Dark

- Set `data-catalog-theme="dark"` en document: **pageBg y panelBg permanecen light** (`248/250/252` y blanco).
- Sin parity con checkout dark. Gap crítico vs sistema flat.

### Mobile

Viewport 390×844 (mediciones previas + re-check):

- `min-height: 100vh` + `display: grid; place-items: center` → card centrada verticalmente; ~150px+ de vacío superior.
- `h1` ~32px — jerarquía pesada.
- UUID largo fuerza wrap / densidad alta en el order box.
- Acciones full-width stacked.

### Desktop

Viewport 1440×900:

- Panel `max-width: 520px`, width 520, `top` ~308 → `gapAbove` ~215px (centrado vertical).
- Media `@media` solo aumenta padding de `.success-page` (28/24/56); no alinea al layout flat del checkout.

## Identificador de pedido

### Success actual

- Muestra **UUID completo** del query param.
- Label: “Número de pedido”.
- No hay helper de abreviación en public success.
- Refresh conserva el id vía URL (comportamiento esperado del contrato query).

### Admin / dashboard

- `buildOrderDisplayRef` **local duplicado** en:
  - `components/admin/orders/order-card.tsx`
  - `components/admin/orders/admin-order-workspace-modal.tsx`
- Lógica: `orderId.replace(/-/g, "").slice(-4).toUpperCase()` → **4 caracteres** hex/alphanum del UUID sin guiones, mostrado como `#XXXX`.
- **Solo display** en admin; no es `public_order_code` persistido.
- **No** hay helper compartido reutilizable en `lib/`.

### Deuda `public_order_code`

- `rg public_order_code` en repo: **0 matches**.
- Ausente en `types/database.ts` / migrations conocidas.
- Product requirement futuro: código alfanumérico corto único por `business_id` (ej. `#K7P4Q9`).
- **No** implementar en flat polish.
- **No** inventar short code desde UUID en Success (la abreviación admin de 4 chars **no** es el código público deseado).

## Edge states

### Sin `order_id`

- URL: `/b/demohamburgueseria/success`
- No crash.
- Sin `.success-order-id`.
- Copy de “pedido recibido” **igual** (engañoso si acceso directo).
- WhatsApp sin línea `Pedido:`.

### `order_id` inválido

- URL: `?order_id=invalid`
- No crash; no validación UUID.
- Box muestra “invalid”; WA incluye `Pedido: invalid`.

### WhatsApp faltante

- Código no oculta CTA si número vacío; construye `wa.me/` con 0 dígitos.
- No probado con negocio sin número en browser (demo tiene número).

### Preview / acceso directo

- Acceso directo a success sin checkout: permitido; muestra éxito genérico.
- Sin preview guard; return siempre a catálogo público.
- No se crearon pedidos reales en esta auditoría.

## Browser QA

Rutas base usadas: catalogo / checkout / success bajo `/b/demohamburgueseria/…`.

| Flujo | Resultado |
|-------|-----------|
| A — Success con order_id QA `5767614d-0f22-4be1-9a72-e10e9ae43878` | Contenido completo; UUID visible; WA presente; href inspeccionado sin click externo |
| B — Sin order_id | Carga OK; sin order box; copy éxito; WA sin Pedido |
| C — `order_id=invalid` | Carga OK; muestra “invalid”; no crash |
| D — Dark (`data-catalog-theme=dark`) | Surfaces siguen light; CTA naranja |
| E — 768/1440 | Card centrada, max 520px, gran gap vertical |
| F — Volver al catálogo | `href=/b/demohamburgueseria/catalogo` |
| G — WhatsApp CTA | `wa.me` + text encoded; no envío real |

Viewports ejercitados: 390×844, 1440×900 (+ métricas previas alineadas a 360/430/768). Themes: light + atr. dark.

## Console / network QA

```text
- create_order requests observados en success QA: 0
- pedidos reales creados en esta fase: 0
- WhatsApp real enviado: 0
- Success no dispara fetch de order a Supabase
- Resource noise: logo image status 0 (no bloqueante)
- Sin hydration crash en flujos A–C
- PII/API keys/tokens/cookies: no registrados
- WhatsApp message: solo shape (Pedido line yes/no); sin dump de PII de cliente
```

## Hallazgos

| Área | Hallazgo | Severidad | Evidencia | Recomendación |
|------|----------|-----------|-----------|---------------|
| layout mobile | Card centrada vertical → vacío superior grande | P2 | `.success-page` `place-items: center`; gap ~150px@390 | Align top + padding tipo checkout flat |
| layout desktop | Mismo centrado; gapAbove ~215@1440 | P2 | CDP 1440×900 | Reducir espacio superior; max-width coherente |
| dark mode | Sin parity; canvas/card light bajo theme dark | P2 | CDP `data-catalog-theme=dark` | Tokenizar surfaces light/dark en module CSS |
| card surface/shadow | Sombra + Card legacy; no flat | P2 | `boxShadow` medido; `Card` | Flat surface, border sutil, sin sombra fuerte |
| vertical gap | Centrado grid provoca “card demasiado abajo” | P2 | globals `.success-page` | `align-content/start` o flex top |
| title/copy hierarchy | h1 32px pesado en mobile | P2 | CDP fontSize | Compactar título / scale tipográfica |
| order id display | UUID completo como “Número de pedido” | P1 (UX) | page.tsx + QA | Bajar jerarquía; label “Referencia / ID técnico”; slot futuro para código corto |
| WhatsApp CTA | Accent naranja ≠ teal checkout | P2 | `rgb(249,115,22)` | CTA primario alineado a sistema flat actual |
| return catalog CTA | Secundario básico; OK funcional | P3 | Button secondary | Flat secondary polish |
| missing order_id | Éxito engañoso sin id | P1 (UX) | QA B | Polish copy/estado sin cambiar contrato (o fase UX aparte) |
| invalid order_id | Acepta cualquier string | P2 | QA C | No endurecer contrato en polish; deuda validación futura |
| preview safety | Sin preview guard; return siempre público | P2 | page.tsx vs checkout preview | Backlog; no bloquear flat polish |
| public_order_code future | No existe en DB/types | P2 (debt) | rg 0 hits | BACKLOG `PUBLIC-ORDERS-PUBLIC-CODE-SPEC-1` |
| admin/dashboard id abbreviation | `#` + últimos 4 chars hex sin guiones; helper duplicado | P3 | `buildOrderDisplayRef` | No reusar como código público; no inventar en Success |
| accessibility/focus | Links WA + volver presentes; sin audit a11y profundo | P3 | snapshot | Mantener focus visibles en polish |
| privacy/PII | UUID en URL/UI/WA; sin PII cliente en página | P3 | public.ts + page | No loguear mensaje completo; futuro código corto reduce exposición UUID |

**Sin P0** (no crash, no leak de fila de pedido vía Success, create_order=0).

## Recomendación para PUBLIC-CATALOG-SUCCESS-FLAT-POLISH-1

Alcance propuesto (solo visual / copy presentation; sin contrato de datos):

```text
- Reducir espacio superior vacío (dejar de centrar verticalmente en viewport).
- Alinear canvas/card al sistema checkout flat (module CSS colindante; tokens semánticos).
- Quitar sombra fuerte; border/radius coherentes.
- Tokenizar light/dark (parity real).
- Compactar título y densidad de copy.
- Bajar jerarquía del UUID; label tipo “Referencia del pedido” / “ID de pedido”.
- Preparar slot tipográfico para futuro “Pedido #K7P4Q9” sin implementarlo.
- CTA principal coherente con accent del checkout flat (teal), no naranja legacy.
- CTA secundario flat.
- Polish visual de estados missing/invalid **sin** cambiar query contract ni WhatsApp message contract.
- Preferir mover estilos fuera de globals.css hacia `*.module.css` (regla de estilos del repo).
```

## Fuera de alcance

```text
- NO crear public_order_code / migraciones / RPC / types.
- NO inventar short code desde UUID en frontend.
- NO modificar checkout redirect contract.
- NO cambiar WhatsApp message contract (fase propia si se requiere).
- NO crear pedidos reales.
- NO Maps/address validation.
- NO commit/push/deploy en esta auditoría.
- NO endurecer ownership/UUID validation en polish inmediato (deuda separada).
```

## Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-SUCCESS-FLAT-POLISH-1 = ALLOWED
QUEUE_GATE: PUBLIC-ORDERS-PUBLIC-CODE-SPEC-1 = BACKLOG
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-* = PAUSED
```

Estado de cierre:

**AUDIT COMPLETE — SUCCESS READY FOR FLAT POLISH**
