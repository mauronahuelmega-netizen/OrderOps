# PUBLIC-CATALOG-CART-SHEET-FORENSIC-AUDIT-1

## Estado

**AUDIT COMPLETE — CART SHEET READY FOR FLAT POLISH**

Sin blockers funcionales P1. Hay deuda visual/a11y P2 (dark parity, flat shadows, Escape/focus) alineada con el alcance de `PUBLIC-CATALOG-CART-SHEET-FLAT-POLISH-1`.

## Git preflight

| Campo | Valor |
|-------|-------|
| Branch | `cursor-handoff-public-catalog-ui-redesign` |
| HEAD | `926c1e8` — `docs(public-catalog): add cursor handoff for ui redesign` |
| WIP Codex previo | `cc1deb8` |
| Working tree al iniciar | limpio |
| Push / Deploy | no |
| Acciones destructivas | ninguna (no pull/reset/restore/clean/checkout) |

## Documentos revisados

| Documento | Estado |
|-----------|--------|
| `docs/public-catalog-ui-redesign-cursor-handoff-2026-08-06.md` | Leído |
| `docs/public-catalog-ux-ui-redesign-spec-closure-1.md` | Leído |
| `docs/public-catalog-post-add-upsell-forensic-audit-1.md` | Leído |
| `docs/public-catalog-post-add-upsell-row-composition-followup-1.md` | Leído |
| `docs/public-catalog-overlay-scroll-lock-header-freeze-1.md` | Leído |
| `docs/product-customization-cart-1-cart-signature-pricing-display.md` | Leído |
| `docs/public-catalog-post-add-upsell-cart-contract-1.md` | Leído |
| `docs/public-catalog-cart-edit-quantity-preservation-fix-1.md` | Leído |
| `docs/public-catalog-cart-sheet-usability-1.md` | Leído |
| `docs/public-catalog-shell-cart-surfaces-polish-1.md` | Leído |

Ningún documento obligatorio faltó.

## Archivos inspeccionados

| Archivo | Rol |
|---------|-----|
| `components/public/catalog/cart-sheet.tsx` | UI sheet, jerarquía, callbacks |
| `components/public/catalog/cart-sheet.module.css` | Visual actual (tokens + shadow) |
| `components/public/catalog/catalog-client.tsx` | Mount, open/close, cart state, edit/checkout |
| `components/public/catalog/public-overlay-scroll-lock.ts` | Scroll lock compartido + header freeze event |
| `lib/cart/local.ts` | Persistencia, hierarchy, qty, remove, merge, checkout payload builder |
| `lib/cart/signature.ts` | `configurationSignature` estable |
| `lib/cart/types.ts` | `itemKind`, `parentCartLineId`, guards |
| `lib/product-customization/upsell-copy.ts` | `UPSELL_ASSOCIATED_LABEL = "Adicional"` |

## Estructura actual del CartSheet

| Pregunta | Evidencia |
|----------|-----------|
| ¿Dónde se monta? | `catalog-client.tsx` — render condicional `{isCartSheetOpen && !postAddOpportunity ? <CartSheet …/> : null}` |
| ¿Quién lo abre/cierra? | Abre: FAB `CartBar.onOpenCart`, post-add `finishPostAddUpsell`, confirm customization (si no hay post-add), `handlePostAddParentMissing`. Cierra: backdrop click, X, “Seguir comprando”, `handleCheckoutFromSheet`, `openCustomizationModal` |
| ¿Quién pasa items/total/handlers? | Parent pasa `items={cartItems}`, `notice`, `onClose`, `onCheckout`, `onEditParent`, `onRemoveLine`, `onChangeParentQuantity`, `onChangeLegacyQuantity`. Total/count se calculan **dentro** del sheet |
| ¿Total visible? | `getCartItemsTotal(items)` — suma `lineTotal` V2 + `price*qty` legacy (`lib/cart/local.ts`) |
| ¿Contador “N producto(s)”? | `getCartItemCount(items)` — solo roots jerárquicos (legacy + V2 parents); **upsell children no cuentan** |
| ¿Línea root? | `buildHierarchicalCartRows` → `kind: "customized"` con `parent` + `children`; o `kind: "legacy"` |
| ¿Upsell children? | Bloque `childrenBlock` + label `UPSELL_ASSOCIATED_LABEL` (“Adicional”, CSS `uppercase` → “ADICIONAL”); trash por child; **sin stepper child** |
| ¿Opciones/extras customization? | `parent.displaySummary` (`Group: options…`); **no** son children — viven en el parent |
| ¿Empty state? | Copy “Tu pedido está vacío” + “Seguir comprando”; footer checkout **omitido** |
| ¿Footer checkout? | Total + “Continuar al checkout” + helper; solo si `!isEmpty` |

Prop `slug` se recibe pero se void-ea (`_checkoutSlug`); la navegación la hace el callback del parent.

## Contratos cart/customization

| Pregunta | Evidencia |
|----------|-----------|
| Root vs upsell child | `itemKind: "product"` + `parentCartLineId: null` vs `itemKind: "upsell"` + `parentCartLineId` (`lib/cart/types.ts`) |
| Campos parent/child en sheet | Parent: `productName`, `finalUnitPrice`, `lineTotal`, `quantity`, `displaySummary`, `cartLineId`. Child: `productName`, `lineTotal`, `cartLineId` |
| Agrupación adicionales | `buildHierarchicalCartRows` agrupa children por `parentCartLineId` bajo el parent |
| Quantity parent | Stepper → `setV2ParentQuantity`; `quantity<=0` elimina familia |
| Customization selections | Persistidas en `selectedGroups`; UI via `displaySummary`; edit restaura con `selectionStateFromCartParent` |
| `configurationSignature` | `product:{id}\|groups:…\|upsells:…` — sin nombres/precios/qty (`signature.ts`). Rebuild en attach/remove child/edit |
| Extras vs post-add upsells | Extras = options en `selectedGroups`/`displaySummary`. Upsells = líneas V2 separadas `itemKind=upsell` |
| Editar configurado | `handleEditParent` → customization modal con `editingCartLineId` + initial selection; merge `replaced` preserva qty (`cart-edit-quantity-preservation-fix-1`) |
| Remover root | `removeSingleCartLine` → `removeCartLineWithChildren` (borra parent + children) |
| Remover child | `removeSingleCartLine` quita child y rebuild signature del parent |
| Cambiar quantity | Parent qty sincroniza children upsell (`setV2ParentQuantity`) |

## Contratos post-add upsell en CartSheet

- Post-add adjunta children vía `attachUpsellChildToParent` (fuera del sheet).
- Dismiss/`Listo` → `finishPostAddUpsell` → abre CartSheet.
- CartSheet solo **renderiza** children ya adjuntos; no conoce candidates/post-add UI.
- Count root-only: root + 2 upsells ⇒ header “1 producto” (verificado en browser).
- Children muestran `lineTotal` (qty sincronizada); no hay qty UI independiente.

## Checkout safety

| Pregunta | Evidencia |
|----------|-----------|
| ¿Payload a checkout? | `buildCheckoutCartPayload` en `lib/cart/local.ts` (legacy + customized + nested `upsellItems`). CartSheet **no** lo invoca |
| ¿CartSheet modifica payload? | No — solo `onCheckout` → `router.push(/b/{slug}/checkout)` (o preview path) |
| ¿Preview isolation? | `cartScope: "preview" \| "public"`; keys `orderops-preview-cart(-v2)` vs `orderops-cart(-v2)` |
| ¿Preview vs real? | Scopes de storage separados; clear preview no toca public |
| ¿Qué no tocar? | `buildCheckoutCartPayload`, persistence keys/scopes, signature helpers, attach/remove/qty semantics, order creation / server actions |

Browser H: navegó a `/b/demohamburgueseria/checkout` con total `$ 30.800,00` (2×12500 + 2×2900). **No** se envió pedido.

## Overlay, scroll y accesibilidad

| Capacidad | Estado | Evidencia |
|-----------|--------|-----------|
| Scroll lock compartido | Sí | `usePublicOverlayScrollLock()` en mount |
| Header freeze | Sí (vía evento) | `data-public-overlay-open` + `PUBLIC_OVERLAY_LOCK_CHANGE_EVENT` |
| `role="dialog"` / `aria-modal` | Sí | `cart-sheet.tsx` |
| `aria-labelledby` | Sí | `cart-sheet-title` |
| `aria-describedby` | No | ausente |
| Foco inicial | No | no implementado |
| Focus trap | No | no implementado (docs usability ya lo marcaban) |
| Escape | No | browser: Escape **no** cierra sheet |
| Backdrop close | Sí | `onClick={onClose}` en backdrop |
| Return focus | No | no implementado |
| Safe-area bottom | Sí | `padding-bottom: calc(0.85rem + env(safe-area-inset-bottom))` en footer |
| Scroll interno | Sí | `.body { overflow-y: auto; overscroll-behavior: contain }` |

## Visual system actual

| Tema | Hallazgo |
|------|----------|
| Tokens en CSS module | `--bg-surface`, `--bg-canvas`, `--text-*`, `--border-subtle`, `--business-primary`, `--shadow-floating` (desktop) |
| Hardcoded | Fallback `#fff` en `primaryButton` (`--business-primary-foreground, #fff`) |
| Shadow | Mobile sheet: `box-shadow: 0 12px 28px …`; ≥640px: `var(--shadow-floating)` — **rompe contrato flat** del redesign |
| Dark parity | **Rotura confirmada**: con `main[data-theme=dark]`, `--bg-surface` sigue `#fff` (tokens dark globales solo en `.dark` / `html[data-dashboard-theme=dark]`). Post-add/Customization usan `--catalog-surface-strong` + overrides `:global(.catalog-page[data-theme="dark"])`; CartSheet **no**. Resultado: sheet light sobre catálogo dark |
| Light-only classes | No hay clases light-only explícitas; el problema es herencia de tokens |
| Radius / spacing | Sheet ~1.15rem; rows 0.9rem; gaps 0.55–0.75rem; icon buttons 2.75rem |
| Overflow risk | Nombres `overflow-wrap: anywhere`; ≤359px apila acciones; cards largas con muchos children dependen del scroll del body |

## Browser QA

URL: `http://localhost:3000/b/demohamburgueseria/catalogo`  
Viewport primario: **360×740** (Samsung-like). Adicionales (390/430/768/1440) cubiertos por CSS responsive + deuda de re-QA multi-viewport en polish.

### Light

- Sheet usa superficies blancas / canvas claro — correcto en light.
- Contraste header/body/CTA OK.

### Dark

- Catálogo dark OK (`data-theme=dark` / `data-catalog-theme=dark`).
- CartSheet permanece **blanco** (`background: rgb(255,255,255)` medido en dialog `#cart-sheet-title`).
- Child rows / qty / CTA siguen tokens light → **sin dark parity**.

### Flujos probados

| Flujo | Resultado |
|-------|-----------|
| A — configurable sin upsell (`Ahora no`) | PASS — root + `displaySummary` (Papas/Mayonesa), qty 1, total 12500, CTA |
| B/C — 1 y 2 upsells (Coca + Sprite → Listo) | PASS — “1 producto”, label ADICIONAL, children con trash, total 18400 |
| D — remove Coca | PASS — root + Sprite permanecen |
| E — remove root | PASS — empty state “Tu pedido está vacío”; FAB desaparece; sin huérfanos |
| F — quantity | PASS — qty 2: unit hint, child Sprite 5800, meta “2 productos”; decrement OK |
| G — edit | PASS — modal con selections restauradas; Actualizar sin cambios; qty 2 + Sprite preservados; no reabre post-add |
| H — checkout | PASS — navega a `/checkout`, total 30800; **sin submit / sin pedido real** |

## Console/network QA

| Check | Resultado |
|-------|-----------|
| Errores console bloqueantes | No observados en flujos A–H |
| Hydration warnings | No observados |
| Server actions inesperadas en sheet open/qty/remove | Esperado: 0 (mutaciones locales) |
| Navegación checkout | Client navigation a `/b/demohamburgueseria/checkout` |
| Imágenes | Post-add thumbs lazy esperadas; CartSheet **no** renderiza imágenes de líneas |
| Pedidos reales | Ninguno |

## Deuda UX/UI clasificada

### P1

Ninguna. Contratos cart/checkout/parent-child intactos en QA.

### P2

1. **Dark parity ausente** — sheet light sobre catálogo dark; no usa `--catalog-*` ni overrides dark (a diferencia de Post-add/Customization).
2. **Sombras estáticas** — contradicen sistema flat del redesign.
3. **Escape / focus trap / foco inicial / return focus** ausentes.
4. **`aria-describedby`** ausente.
5. Visual hierarchy flat incompleta vs shell/header/post-add ya polishados (cards con borde + canvas, densidades).
6. Indent/children: borde accent + mix de superficies — funciona, pero hay que alinear a tokens flat dark/light.

### P3

1. Label “ADICIONAL” vía `text-transform: uppercase` (copy source “Adicional”).
2. Child rows sin hint de qty cuando parent qty>1 (solo precio total child).
3. Fallback hardcoded `#fff` en CTA.
4. Density: gaps/padding del sheet previo al polish flat.
5. Multi-viewport re-QA formal (390/430/768/1440) pendiente en fase polish.

## Matriz de riesgos

| Área | Riesgo | Severidad | Evidencia | Recomendación |
|------|--------|-----------|-----------|---------------|
| cart item grouping | Bajo si solo CSS | Media si se toca hierarchy | `buildHierarchicalCartRows` | No tocar helpers |
| upsell children | Romper attach/remove/signature | Alta | `removeSingleCartLine`, attach | Solo presentación de rows |
| quantity | Reset N→1 en edit ya fixed | Alta si se reintroduce | `setV2ParentQuantity`, merge replaced | No tocar qty semantics |
| edit flow | Perder children/qty | Alta | Flow G PASS | No cambiar `handleEditParent` |
| remove flow | Huérfanos / empty incorrecto | Alta | Flow D/E PASS | No cambiar remove helpers |
| checkout payload | Pedidos incorrectos | Crítica | Sheet solo navega; payload en checkout/local | Prohibido tocar payload |
| preview isolation | Contaminar cart real | Alta | `cartScope` keys | No tocar storage keys |
| dark parity | Sheet ilegible/inconsistente | Media (P2) | CDP tokens | Tokenizar en polish |
| scroll lock | Background scroll / header jump | Media | lock compartido activo | Preservar hook |
| focus/a11y | Escape/trap ausentes | Media (P2) | Escape no cierra | Mejoras a11y permitidas en polish si no cambian contrato |
| mobile overflow | Cards largas | Baja | scroll body | Densidad + wrap |
| visual density | Desalineado vs flat system | Media (P2) | shadows + light sheet | Objetivo de flat polish |

## Plan seguro para PUBLIC-CATALOG-CART-SHEET-FLAT-POLISH-1

### Permitido

- CSS module visual polish (flat, density, hierarchy).
- Tokenización dark/light al patrón catalog (`--catalog-*` y/o `:global(.catalog-page[data-theme="dark"])`).
- Flat surfaces; remover/restringir sombras estáticas.
- Row/card layout, child indent visual, icon alignment.
- Focus-visible, safe-area, empty/footer polish.
- Escape / focus trap / foco inicial **si** se implementan sin cambiar contratos de cart.
- Copy UI menor sin cambiar semántica.

### Prohibido

- DB / RPC / actions / packages / lockfiles.
- Checkout payload / order creation.
- Cart persistence semantics / storage keys.
- Signature helpers / parent-child attach semantics.
- Candidate/upsell decision logic.
- ProductCard / Product Detail / Customization (salvo regresión visual directa).
- Deploy / push.

### Requiere fase separada

- Cambiar modelo de carrito / cálculo de totales.
- Cambiar payload checkout.
- Cambiar quantity inheritance.
- Edición de children / nuevas funciones de cart.

## Archivos candidatos para próxima fase

- `components/public/catalog/cart-sheet.tsx` (solo si a11y Escape/focus o markup mínimo)
- `components/public/catalog/cart-sheet.module.css` (**primario**)
- Referencia de patrón dark: `post-add-upsell-sheet.module.css`, `customization-modal.module.css`
- Docs: este audit + handoff 2026-08-06
- **No modificar** salvo bug probado: `lib/cart/local.ts`, `lib/cart/signature.ts`, checkout clients

## Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-CART-SHEET-FLAT-POLISH-1 = ALLOWED
```

```text
AUDIT COMPLETE — CART SHEET READY FOR FLAT POLISH
```
