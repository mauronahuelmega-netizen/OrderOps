# PUBLIC-CATALOG-CHECKOUT-FORENSIC-AUDIT-1

## Estado

**AUDIT COMPLETE — CHECKOUT READY FOR FLAT POLISH**

Sin blockers funcionales P1 que impidan polish visual. Hay deuda P2 (dark parity del checkout vs catálogo, sombras sticky, alineación visual del resumen con CartSheet, hydration warning en layout) alineada con el alcance de `PUBLIC-CATALOG-CHECKOUT-FLAT-POLISH-1`.

Submit real **no ejecutado** (scope de auditoría).

## Git preflight

| Campo | Valor |
|-------|-------|
| Branch | `cursor-handoff-public-catalog-ui-redesign` |
| HEAD | `f28f5cd` — `feat(public-catalog): polish cart sheet flat UI` |
| Working tree al iniciar | limpio |
| `.handoff-backups` | no presente en status |
| Push / Deploy | no |
| Acciones destructivas | ninguna |

## Documentos revisados

| Documento | Estado |
|-----------|--------|
| `docs/public-catalog-ui-redesign-cursor-handoff-2026-08-06.md` | Leído |
| `docs/public-catalog-ux-ui-redesign-spec-closure-1.md` | Leído |
| `docs/public-catalog-cart-sheet-forensic-audit-1.md` | Leído |
| `docs/public-catalog-cart-sheet-flat-polish-1.md` | Leído |
| `docs/public-catalog-cart-sheet-actions-density-followup-1.md` | Leído |
| `docs/product-customization-cart-1-cart-signature-pricing-display.md` | Leído (contexto contracts) |
| `docs/public-catalog-post-add-upsell-cart-contract-1.md` | Leído (contexto) |
| `docs/public-catalog-cart-edit-quantity-preservation-fix-1.md` | Leído (contexto) |
| `docs/public-catalog-overlay-scroll-lock-header-freeze-1.md` | Leído (contexto overlays) |
| `docs/public-catalog-checkout-conversion-polish-1.md` | Leído (baseline checkout UI) |
| `docs/public-catalog-checkout-summary-visual-qa-fix-1.md` | Existente — referenciado |
| `docs/public-catalog-checkout-address-autocomplete-spec-1.md` | Existente — referenciado |
| `docs/product-customization-checkout-ui-smoke-1-browser-checkout-validation.md` | Existente — referenciado |
| `docs/public-checkout-anonymous-order-fix-prod-4.md` | Existente — referenciado |

## Archivos inspeccionados

| Archivo | Rol |
|---------|-----|
| `app/b/[slug]/checkout/page.tsx` | RSC: business + preview flag → `CheckoutClient` |
| `app/b/[slug]/checkout/actions.ts` | `createPublicCheckoutOrderAction` → RPC `create_order` |
| `app/b/[slug]/success/page.tsx` | Success + WhatsApp CTA |
| `app/b/[slug]/layout.tsx` | `PublicBusinessHeader` + content |
| `components/public/checkout/checkout-client.tsx` | Formulario, summary, submit client |
| `components/public/checkout/checkout-client.module.css` | Visual actual |
| `components/public/checkout/address-autocomplete.tsx` (+ module CSS) | Dirección + Places |
| `components/public/catalog/catalog-client.tsx` | `handleCheckoutFromSheet` → `/checkout` |
| `components/public/catalog/cart-sheet.tsx` | CTA hacia checkout (callback parent) |
| `components/public/business/public-business-header.tsx` | Theme `data-catalog-theme`, menú |
| `components/ui/Input.tsx` | Labels / id = name |
| `lib/cart/local.ts` | Storage, hierarchy, `buildCheckoutCartPayload`, totals |
| `lib/cart/signature.ts` / `types.ts` | Signature / itemKind |
| `lib/checkout/argentine-phone.ts` | Normalización +549 |
| `lib/admin/catalog-preview-shared.ts` / `catalog-preview.ts` | Preview path + block order |
| `lib/product-customization/order-validation.ts` | Server cart validation pre-RPC |
| `lib/product-customization/upsell-copy.ts` | Label Adicional |

## Estructura actual del Checkout

| Pregunta | Evidencia |
|----------|-----------|
| ¿Qué componente renderiza? | `CheckoutClient` (`components/public/checkout/checkout-client.tsx`) |
| ¿Server / client / mixto? | Mixto: page RSC carga `requirePublicBusinessBySlug` + `isCatalogPreview`; UI es client |
| ¿Business/config? | Server `requirePublicBusinessBySlug(slug)` → props `business` |
| ¿Carrito? | Client `loadUnifiedCartItems(business.id, cartScope)` en `useEffect` |
| ¿Total? | `getCartItemsTotal(unifiedCartItems)` (mismo helper que CartSheet) |
| ¿Aviso personalizados? | `hasCustomizedItems` → status copy “Tu pedido incluye productos personalizados…” |
| ¿Envío/retiro? | Fieldset segmented radios `delivery` / `pickup` |
| ¿Dirección? | Condicional si `deliveryMethod === "delivery"` → `AddressAutocomplete` |
| ¿Nombre/teléfono/notas? | Sección “Tus datos” + textarea notas |
| ¿Resumen? | `OrderSummary` mobile (`.mobileSummary`) + aside desktop (`.desktopSummary`) |
| ¿Sticky footer? | `.stickyFooter` + total + submit `form="checkout-form"` implícito (button type=submit dentro del form) |
| ¿Navega a success? | `router.push(/b/${slug}/success?order_id=…)` tras éxito |
| Layout shell | `app/b/[slug]/layout.tsx` monta `PublicBusinessHeader` encima de checkout |

Flujo de entrada desde catálogo:

```text
CartSheet CTA → catalog-client.handleCheckoutFromSheet
  → router.push(/b/{slug}/checkout | preview path)
```

## Cart / payload contract

| Pregunta | Evidencia |
|----------|-----------|
| Storage | `getCartStorageKeys(businessId, scope)` → `orderops-cart:` + `orderops-cart-v2:` (public) o `orderops-preview-cart*` (preview) |
| Scope | `isCatalogPreview ? "preview" : "public"` |
| Items | `loadUnifiedCartItems` (legacy + V2) |
| Root customized | V2 `itemKind: "product"`; UI via `buildHierarchicalCartRows` |
| selectedGroups / displaySummary | Persistidos en V2; summary lista `parent.displaySummary`; **no** van como líneas hijas |
| Upsell children | V2 `itemKind: "upsell"` bajo parent; UI label `UPSELL_ASSOCIATED_LABEL` (“Adicional”) |
| Payload builder | `buildCheckoutCartPayload` → `{ legacyItems, customizedItems[{ cartLineId, productId, quantity, configurationSignature, selectedGroups, upsellItems }] }` |
| Campos al action | `customerName`, `phone` (E.164), `deliveryDate`, `deliveryMethod`, `address|null`, `notes|null`, `cart`, `isPreview: false` |
| Total/count vs CartSheet | Mismos helpers `getCartItemsTotal` / `getCartItemCount` (root-only count) |
| No tocar para órdenes | `buildCheckoutCartPayload`, action input shape, `validateCheckoutCartForCreateOrder`, RPC `create_order`, signature, storage keys/scopes |

## Delivery / pickup contract

| Pregunta | Evidencia |
|----------|-----------|
| Valores internos | `"delivery"` \| `"pickup"` |
| Default | `"delivery"` (`initialFormState`) |
| Required delivery | `address.trim()` required (client + server) |
| Pickup UI | Address **no renderiza**; copy “Retiro en {business.name}…” |
| ¿Se limpia address al pickup? | **No** se limpia el state; al volver a Envío se retiene. Payload pickup envía `address: null` |
| Payload | delivery → address trim; pickup → `null` |
| Copy visible | Segment “Envío” / “Retiro”; headings “Cómo recibís…” / “¿Dónde lo entregamos?” |

Scheduled mode (si `scheduled_mode_active`): date input required + rules; on-demand usa `today` como `deliveryDate`.

## Customer data contract

| Campo | Contrato |
|-------|----------|
| Nombre | Required; `trim()`; client + server |
| Teléfono | Required; `parseArgentineMobilePhone` → E.164 `+549XXXXXXXXXX`; helper “Ejemplo: 11 1234-5678”; blur valida; focus a `#phone` si inválido |
| Persistencia phone | Solo se envía al pedido; **no** se guarda en localStorage propio |
| Notas | Optional; `trim()` → `null` si vacío; **sin `maxLength`** en textarea |

## Submit / order creation contract

```text
handleSubmit (client)
  → preview guard / empty cart / name / phone / date / method / address
  → buildCheckoutCartPayload(latestUnified)
  → createPublicCheckoutOrderAction(slug, input)
       → shouldBlockCatalogPreviewOrder (cookie + isPreview)
       → isBusinessAcceptingPublicOrders
       → re-validate fields + validateCheckoutCartForCreateOrder
       → supabase.rpc("create_order", …)
  → best-effort POST /api/internal/orders/{id}/push
  → clear legacy+v2 storage keys
  → router.push success?order_id=
```

| Pregunta | Evidencia |
|----------|-----------|
| Loading | `isSubmitting` → label “Enviando…”; button `disabled` |
| Doble submit | Disabled por `isSubmitting` (race React mínima posible antes del re-render) |
| Errores | `setErrorMessage` / `setPhoneError`; `role="alert"` para error general |
| Cart clear | `removeItem` legacy + v2 keys del scope actual |
| Success data | Query `order_id`; WhatsApp via `buildPublicOrderWhatsappUrl` |
| WhatsApp | Success CTA externa; checkout crea pedido en DB primero |
| Requests esperadas | Entrada checkout: load business (RSC). Cambiar método: **0** server. Validar vacío: **0** RPC. Submit éxito: server action + optional push |

## Preview safety

| Pregunta | Evidencia |
|----------|-----------|
| Flag | `?orderopsPreview=1` → `isCatalogPreview` |
| Storage | Scope `preview` (keys aisladas) |
| UI | Banner `CATALOG_PREVIEW_ORDER_BLOCKED_MESSAGE`; submit disabled + label “Confirmación deshabilitada” |
| Client submit | Early return con mismo mensaje |
| Server | `shouldBlockCatalogPreviewOrder`: `isPreview===true` **o** cookie preview matching `businessId` |
| Riesgo pedido real | Bajo si cookie/query correctos; defensa en profundidad client+server. Flat polish **no debe** tocar guards |

## Empty / invalid cart behavior

| Caso | Comportamiento |
|------|----------------|
| Checkout sin items | Empty state “Tu pedido está vacío” + link catálogo; **sin form/submit** |
| Flash vacío→hidratado | Primer paint vacío hasta `useEffect` load (QA: snapshot temprano mostró empty; re-snapshot con form) |
| Storage corrupto | `loadUnifiedCartItems` defensive (no auditó casos corruptos en browser); server validation rechaza cart inválido |
| Productos inexistentes | Server/RPC → errores mapeados (“El producto ya no está disponible.”, etc.) |
| Total 0 | Posible si precios 0; empty check es por `length === 0`, no por total |
| Enviar sin items | Client bloquea; server `validateCheckoutCartForCreateOrder` también (“Tu carrito está vacío.”) |

## Accessibility / form UX

| Check | Estado |
|-------|--------|
| Labels reales | Sí (`Input` label+htmlFor; textarea label; address label) |
| id/name/autocomplete | `customer_name`/`name`, `phone`/`tel`, `notes`, address id default `address` |
| Errores anunciados | `role="alert"` error general; phone `aria-invalid` + `aria-describedby` |
| aria-live | No dedicado; alert/status roles |
| Focus primer error | Solo phone inválido fuerza focus; nombre/dirección **no** auto-focus |
| Submit disabled a11y | Disabled + texto de estado (preview / closed / submitting) |
| Segmented | Radios reales ocultos visualmente + labels; legend sr-only |
| Back | Link `aria-label="Volver al catálogo"` 44px |
| Sticky footer | Dentro del form; focus-visible en submit |
| Tab order | Header → back → fields → summary link → sticky CTA (no audit exhaustivo) |

## Visual system actual

| Tema | Evidencia |
|------|-----------|
| CSS | `checkout-client.module.css` (+ `address-autocomplete.module.css`) |
| Tokens | `--bg-canvas`, `--bg-surface`, `--border-subtle`, `--text-*`, `--business-primary`, `--shadow-card` |
| Hardcoded | CTA foreground fallback `#fff`; businessStyles `--business-primary-foreground: #ffffff` |
| Light-only / dark | Checkout **no** usa `.catalog-page[data-theme]`. Con `html[data-catalog-theme=dark]` el header oscurece, pero `--bg-canvas/#f8fafc` y `--bg-surface/#fff` del checkout **siguen light** (CDP confirmado) |
| Sombras | Sticky inner `box-shadow: var(--shadow-card)`; segment selected inset shadow |
| Radii | ~0.75–0.95rem; sections bordered cards |
| Desalineación vs catálogo | Surfaces globales zinc vs CartSheet tokens locales `--cart-sheet-*` flat dark-aware |
| Resumen vs CartSheet | Misma jerarquía semántica (root / displaySummary / Adicional); visual distinto (summary panel vs cart row cards) |
| Sticky | `position: sticky`; safe-area padding; `scroll-padding-bottom` / `scroll-margin-bottom` |

## Browser QA

Ruta: `/b/demohamburgueseria/catalogo` → checkout. Viewport primario **390×844**. Themes: light efectivo en checkout; dark forzado en `html` sin efecto en surfaces checkout.

### Light

- Form sections card/border; Envío default; sticky total + CTA teal.
- Total QA: `$ 24.000,00` (Clásica 8500 + Doble 12500 + Coca 3000).
- Aviso personalizados visible.

### Dark

- `orderops-catalog-theme=dark` / `data-catalog-theme=dark` **no** invierte checkout page/sections/sticky (permanecen `#f8fafc` / `#fff`).
- Header sí tiene overrides dark en globals.
- **P2 dark parity** para flat polish.

### Flujos A-I

| Flujo | Resultado |
|-------|-----------|
| A Configurable + upsell → checkout | PASS (Doble Smash + Papas + Coca + Clásica legacy; summary + sticky) |
| B Envío vacío | PASS — alert “Ingresá tu nombre.” (orden de validación: nombre antes de address/phone). Sin pedido real |
| C Retiro | PASS — address oculto; copy retiro; submit vacío → mismo alert nombre; address state se retiene al volver a Envío |
| D Notas | PASS — sin `maxLength`; DOM aceptó 5000 chars |
| E Resumen | PASS — root Clásica + Doble Smash, displaySummary Papas, Adicional Coca, total, “Editar pedido” → catálogo |
| F Sticky / focus | PASS parcial — focus Nombre sin overlap sticky en 390×844 (`overlap: false`); teclado nativo device no simulado |
| G Empty cart | PASS — empty state + links catálogo |
| H Dark | PASS como hallazgo — **roto / light-only** en body checkout |
| I Submit real | **No ejecutado** (autorización explícita requerida). Source auditado |

## Console/network QA

| Ítem | Observación |
|------|-------------|
| Hydration | Overlay Next: hydration warning atribuido a `app/b/[slug]/layout.tsx` (PublicBusinessLayout) — deuda P2/P3 |
| Server actions al entrar | Ninguna de mutación; RSC page load |
| Cambiar método | 0 requests mutación |
| Validar vacío | 0 create_order |
| Submit real | No probado |
| PII | No registrado |

## Deuda UX/UI clasificada

### P1

- Ninguno detectado que cree pedidos incorrectos **si** se respetan guards actuales. Preview + validation + RPC validation están en lugar.

### P2

- Dark parity checkout ausente (tokens globales light; no scoped como CartSheet).
- Sticky `box-shadow: var(--shadow-card)` vs flat system del catálogo.
- Resumen visual no alineado a CartSheet flat (jerarquía semántica OK).
- Segmented / inputs / cards light-first necesitan tokenización local.
- Hydration warning en layout público (investigar en polish o fase a11y/layout).
- Flash empty-state hasta hidratar cart desde localStorage.

### P3

- Auto-focus solo en phone error; no en nombre/dirección.
- Notas sin max length (UX/abuse).
- Address no se limpia al pasar a pickup (payload OK; state residual).
- Race mínima doble-click pre-`isSubmitting`.
- CTA foreground `#fff` hardcoded fallback.
- Teclado mobile real / viewports 360–1440 no exhaustivos en esta pasada (390 primario).

## Matriz de riesgos

| Área | Riesgo | Severidad | Evidencia | Recomendación |
|------|--------|-----------|-----------|---------------|
| cart payload | Romper órdenes | P1 potencial | `buildCheckoutCartPayload` + action | No tocar en flat polish |
| root/customized | Snapshot inválido | P1 potencial | validation + signature | No tocar helpers |
| upsell children | Parent/child mismatch | P1 potencial | `upsellItems` en payload | No tocar |
| delivery/pickup | Valores internos | Alto si se renombran | `"delivery"\|"pickup"` | No renombrar |
| required address | Pedido sin dirección | Mitigado | client+server | Preservar |
| phone validation | Formato incorrecto | Mitigado | `parseArgentineMobilePhone` | No cambiar semantics |
| submit double-click | Pedidos duplicados | P3 | `isSubmitting` | Opcional fase separada |
| order creation | Pedido real | Crítico | RPC `create_order` | No tocar action |
| success navigation | Lost order_id | Mitigado | query param | No cambiar contract |
| preview isolation | Pedido desde preview | Mitigado | UI+cookie+isPreview | No tocar guards |
| empty cart | Submit vacío | Mitigado | empty UI + validation | Preservar |
| sticky footer | Tapa inputs | P3 | scroll-padding; no overlap en QA 390 | Polish visual/safe-area |
| mobile keyboard | Viewport shrink | P3 | no device keyboard | Fase device QA |
| dark parity | Light-only checkout | **P2** | CDP tokens light bajo dark attr | **Incluir en flat polish** |
| a11y errors | Focus incompleto | P3 | solo phone focus | Polish visual OK; focus = fase a11y |
| summary vs CartSheet | Inconsistencia visual | P2 | OrderSummary CSS distinto | Alinear visual en polish |

## Plan seguro para PUBLIC-CATALOG-CHECKOUT-FLAT-POLISH-1

### Permitido

- CSS/module polish (`checkout-client.module.css`, address module si hace falta visual).
- Tokenización dark/light local (patrón CartSheet / `html[data-catalog-theme]` o tokens checkout scoped).
- Flat surfaces; reducir `--shadow-card` estático.
- Density / paddings / radii alineados a catálogo.
- Form fields / segmented / summary / sticky visual polish + safe-area.
- Focus-visible / error surfaces visuales.
- Copy UI menor cosmético sin cambiar contratos.
- Wrappers/classes visuales mínimas en TSX **sin** cambiar handlers/payload.

### Prohibido

- DB/RPC/migrations/RLS.
- Cambios a `createPublicCheckoutOrderAction` / `create_order`.
- Cambios a `buildCheckoutCartPayload` / signature / storage semantics.
- Cambiar valores `delivery`/`pickup`, phone normalization, preview guards.
- Success route contract / WhatsApp URL builders (salvo CSS success fuera de alcance).
- Packages/lockfiles.
- Submit real en QA salvo autorización explícita.

### Requiere fase separada

- Cambiar orden/validaciones de campos.
- Max length notas / phone UX semantics.
- Auto-focus primer error genérico.
- Sticky vs teclado con lógica nueva (`visualViewport`).
- Multi-step checkout.
- Fix hydration layout si requiere refactor de header/theme.

## Archivos candidatos para próxima fase

```text
components/public/checkout/checkout-client.module.css
components/public/checkout/address-autocomplete.module.css
docs/public-catalog-checkout-flat-polish-1.md  (crear en esa fase)
```

TSX solo si hace falta clase visual mínima:

```text
components/public/checkout/checkout-client.tsx
components/public/checkout/address-autocomplete.tsx
```

No candidatos (congelados):

```text
app/b/[slug]/checkout/actions.ts
lib/cart/local.ts (payload/helpers)
lib/checkout/argentine-phone.ts
lib/admin/catalog-preview*.ts
lib/product-customization/order-validation.ts
```

## Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-FLAT-POLISH-1 = ALLOWED
```

Condición: polish **solo visual/token/CSS** (+ wrappers mínimos). Cualquier cambio de payload/action/phone/preview → reabrir gate.
