# PUBLIC-CATALOG-UI-REDESIGN-CLOSEOUT-1

## Estado

PASS WITH CLOSEOUT DEBT — PUBLIC CATALOG UI REDESIGN CLOSEOUT READY FOR COMMIT

## Resumen ejecutivo

Branch `cursor-handoff-public-catalog-ui-redesign` (HEAD `b2321b0`) consolida el rediseño visual/UX del catálogo público, cart affordances, ProductCard, header, category nav, checkout flat y success flat. Working tree dirty con runtime + docs de fases acumuladas. **Esta fase no ejecuta commit, push ni deploy.** Inventario, contratos, QA browser final y plan de commit quedan listos para `PUBLIC-CATALOG-UI-REDESIGN-FINAL-COMMIT-1`.

## Alcance cerrado

- Catalog shell (header dark full-bleed, search, burger)
- Category nav (active teal solid light/dark)
- ProductCard quick-add circular + floating badge
- Customized product root quantity badge (`getRootQuantityForProduct`)
- Cart FAB contrast + accent fill
- CartSheet flat (ya en commits previos del branch) + affordances preservadas
- Checkout flat polish + sticky/footer/scroll/copy/dark/address fallback
- Success flat polish
- Docs de auditoría/fix/spec de fases recientes

## Fases incluidas

| Fase | Estado doc |
|------|------------|
| Checkout forensic audit | AUDIT COMPLETE — READY FOR FLAT POLISH |
| Checkout flat polish | PASS |
| Sticky footer safe area | PASS WITH KEYBOARD QA DEBT |
| Scroll room calibration | PASS WITH KEYBOARD QA DEBT |
| Copy density polish | PASS WITH MINOR COPY DEBT |
| Address fallback UX | PASS |
| Sticky total simplify | PASS |
| Dark input surface tuning | PASS |
| Address maps forensic audit | AUDIT COMPLETE — READY FOR SPEC |
| Address maps validation spec | SPEC COMPLETE — MODEL A APPROVED |
| Address maps metadata capture | PASS WITH MAPS QA DEBT (client-only; Maps continuation PAUSED) |
| Success forensic audit | AUDIT COMPLETE — READY FOR FLAT POLISH |
| Success flat polish | PASS |
| Cart FAB contrast | PASS |
| Cart FAB accent fill | PASS WITH MINOR FAB DEBT |
| ProductCard quantity stepper overlay | PASS WITH MINOR STEPPER DEBT (superseded by float restore) |
| ProductCard active quick-add compact | PASS WITH MINOR QUICK-ADD DEBT (superseded by float restore) |
| ProductCard badge clip fix | PASS |
| ProductCard badge float restore | PASS |
| Customized quantity badge audit | AUDIT COMPLETE — READY FOR FIX |
| Customized quantity badge fix | PASS |
| Header dark full-bleed | PASS |
| Category nav dark active accent | PASS |

Documentos mínimos listados en el handoff: **todos encontrados** (ningún “no encontrado”).

## Fases pausadas / backlog

| Item | Gate |
|------|------|
| Maps/address validation continuation | PAUSED |
| Success edge states polish | OPTIONAL |
| `public_order_code` | BACKLOG |
| Push / deploy / production smoke | PAUSED_UNTIL_COMMIT / PAUSED_UNTIL_DEPLOY |

## Archivos runtime modificados

### Catálogo

- `components/public/catalog/catalog-client.tsx` — root display quantity map
- `components/public/catalog/product-card.tsx` — quick-add + aria cantidad custom
- `components/public/catalog/product-card.module.css` — badge float / density
- `components/public/catalog/cart-bar.module.css` — FAB contrast/accent

### Carrito / Cart contracts

- `lib/cart/local.ts` — helper puro `getRootQuantityForProduct` (solo lectura; sin mutaciones/storage/signatures)

### Checkout

- `components/public/checkout/checkout-client.tsx`
- `components/public/checkout/checkout-client.module.css`
- `components/public/checkout/address-autocomplete.tsx`
- `components/public/checkout/address-autocomplete.module.css`

### Success

- `app/b/[slug]/success/page.tsx`
- `app/b/[slug]/success/success-page.module.css` (nuevo)

### Global shell / tokens

- `app/globals.css` — header dark full-bleed + category nav dark active accent (shell legacy público)

### Build artifacts

- `tsconfig.tsbuildinfo` — restaurado; **no commitear**

### No esperados

Ninguno. Sin diff en `supabase/`, `package.json`/`lockfiles`, `types/database.ts`, `app/b/[slug]/checkout/actions.ts`.

## Documentos creados

Untracked en closeout (incl. fases recientes):

- `docs/public-catalog-ui-redesign-closeout-1.md` (este)
- `docs/public-catalog-checkout-*.md` (flat/sticky/scroll/copy/dark/address/maps*)
- `docs/public-catalog-success-*.md`
- `docs/public-catalog-cart-fab-*.md`
- `docs/public-catalog-product-card-*.md` (stepper/quick-add/badge/custom qty)
- `docs/public-catalog-header-dark-full-bleed-surface-fix-1.md`
- `docs/public-catalog-category-nav-dark-active-accent-fix-1.md`

Actualizados:

- `docs/CURRENT_PHASE.md`
- `ORDEROPS_LIVING_MEMORY.md`

## Contratos preservados

| Contrato | Evidencia |
|----------|-----------|
| DB / migrations / RLS | 0 diff |
| RPC / `create_order` behavior | actions.ts sin diff; QA sin hits create_order |
| Package / lockfiles | 0 diff |
| Cart signatures / storage keys / merge rules | sin cambios mutativos; solo helper de lectura |
| CartSheet behavior | no tocado en fases badge/header/nav |
| Checkout payload / submit | sin cambios de action; CTA vacío → alert client |
| Maps validation runtime | PAUSED post metadata capture |
| `public_order_code` | no implementado |

## QA browser final

Rutas: `/b/demohamburgueseria/catalogo|checkout|success?order_id=5767614d-…`
Viewport primario closeout: 390×844; overflow medido OK. Themes: dark (sesión) + light verificado en fases previas del shell.

### Catalog shell

PASS — burger, search, header full-bleed dark (`headerW === clientWidth`), hero/copy intactos.

### Category nav

PASS — active chip teal sólido (`rgb(15, 118, 110)`); rail categorías presente.

### Product cards

PASS — quick-add circular; footer/price limpios; custom aria `Elegir opciones…`.

### Simple products

PASS — Sprite badge `1 en el carrito`; FAB aparece con count.

### Customized products

PASS — Doble Smash badge `1 en el carrito`; FAB roots 2 (Sprite+Doble Smash).

### Nested additional / upsell

PASS (evidencia FIX-1) — Coca nested no inflaba ProductCard standalone; re-run completo no repetido en closeout.

### Cart FAB

PASS — visible con items; oculto con carrito vacío (post-clear); count root-only.

### CartSheet

PASS — Sprite + Doble Smash lines; qty controls; CTA checkout.

### Checkout

PASS — flat layout; sticky `Enviar pedido · $…` sin total duplicado aparte; resumen 2 productos; empty-form alert `Ingresá tu nombre.`; create_order 0. Empty flash pre-hidratación documentado (deuda P3 UX/dev).

### Success

PASS — flat polish; heading Pedido recibido; UUID secundaria; CTA WhatsApp; Volver al catálogo. Sin envío WhatsApp real.

### Dark / Light

PASS — dark closeout; light verificado en docs header/nav/FAB/success/checkout.

### Responsive / overflow

PASS — `scrollWidth <= innerWidth + 1` en 390.

## Console / network QA

- Dev overlay: React hydration warning en `PublicCatalogPageContent` / `PublicBusinessLayout` (deuda P3 preexistente / shell; no bloquea build).
- create_order network hits: **0**
- Pedidos reales: **0**
- WhatsApp real enviado: **0**
- PII/tokens/API keys: no registrados

## Validación técnica

| Check | Resultado |
|-------|-----------|
| `tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `npm run lint` | FAIL tooling — ESLint 9 circular JSON en config-validator (no lint de código; deuda tooling) |
| HTTP catalogo/checkout/success/success?order_id=invalid | 200/200/200/200 |
| `git diff --check` | PASS (solo warnings CRLF) |
| `tsconfig.tsbuildinfo` | restaurado |

## Git status final

Branch: `cursor-handoff-public-catalog-ui-redesign`
HEAD: `b2321b0`

Runtime modified:

```text
M  app/b/[slug]/success/page.tsx
M  app/globals.css
M  components/public/catalog/cart-bar.module.css
M  components/public/catalog/catalog-client.tsx
M  components/public/catalog/product-card.module.css
M  components/public/catalog/product-card.tsx
M  components/public/checkout/address-autocomplete.module.css
M  components/public/checkout/address-autocomplete.tsx
M  components/public/checkout/checkout-client.module.css
M  components/public/checkout/checkout-client.tsx
M  lib/cart/local.ts
?? app/b/[slug]/success/success-page.module.css
```

Plus untracked `docs/public-catalog-*.md` de fases + closeout + updates a `docs/CURRENT_PHASE.md` / `ORDEROPS_LIVING_MEMORY.md`.

## Plan de commit recomendado

**NO ejecutar en esta fase.**

```powershell
git add `
  app/b/[slug]/success/page.tsx `
  app/b/[slug]/success/success-page.module.css `
  app/globals.css `
  components/public/catalog/cart-bar.module.css `
  components/public/catalog/catalog-client.tsx `
  components/public/catalog/product-card.module.css `
  components/public/catalog/product-card.tsx `
  components/public/checkout/address-autocomplete.module.css `
  components/public/checkout/address-autocomplete.tsx `
  components/public/checkout/checkout-client.module.css `
  components/public/checkout/checkout-client.tsx `
  lib/cart/local.ts `
  docs/public-catalog-checkout-address-fallback-ux-1.md `
  docs/public-catalog-checkout-address-maps-metadata-capture-1.md `
  docs/public-catalog-checkout-address-maps-validation-forensic-audit-1.md `
  docs/public-catalog-checkout-address-maps-validation-spec-1.md `
  docs/public-catalog-checkout-copy-density-polish-1.md `
  docs/public-catalog-checkout-dark-input-surface-tuning-1.md `
  docs/public-catalog-checkout-flat-polish-1.md `
  docs/public-catalog-checkout-scroll-room-calibration-1.md `
  docs/public-catalog-checkout-sticky-footer-safe-area-followup-1.md `
  docs/public-catalog-checkout-sticky-total-simplify-1.md `
  docs/public-catalog-cart-fab-accent-fill-followup-1.md `
  docs/public-catalog-cart-fab-contrast-polish-1.md `
  docs/public-catalog-category-nav-dark-active-accent-fix-1.md `
  docs/public-catalog-header-dark-full-bleed-surface-fix-1.md `
  docs/public-catalog-product-card-active-quick-add-badge-clip-fix-1.md `
  docs/public-catalog-product-card-active-quick-add-badge-float-restore-1.md `
  docs/public-catalog-product-card-active-quick-add-compact-followup-1.md `
  docs/public-catalog-product-card-customized-quantity-badge-audit-1.md `
  docs/public-catalog-product-card-customized-quantity-badge-fix-1.md `
  docs/public-catalog-product-card-quantity-stepper-overlay-fix-1.md `
  docs/public-catalog-success-flat-polish-1.md `
  docs/public-catalog-success-forensic-audit-1.md `
  docs/public-catalog-ui-redesign-closeout-1.md `
  docs/CURRENT_PHASE.md `
  ORDEROPS_LIVING_MEMORY.md

git commit -m "feat(public-catalog): complete UI redesign closeout"
```

**Excluir:** `tsconfig.tsbuildinfo`, `.next`, screenshots, logs, `.handoff-backups`.

Opcional humano: split commit runtime vs docs; no archivos inesperados detectados.

## Riesgos / deuda aceptada

| Deuda | Severidad | Notas |
|-------|-----------|-------|
| ESLint config circular (lint script) | P3 tooling | tsc/build OK; no bloquea commit |
| Hydration warning overlay en dev (`PublicCatalogPageContent` / `PublicBusinessLayout`) | P3 | No rompe build/HTTP; investigar post-commit opcional |
| Keyboard QA debt checkout sticky/scroll | P3 | Docs de fase |
| Maps metadata QA diferido / Maps continuation | PAUSED | No runtime Maps validation |
| Success edge states | OPTIONAL | |
| Nested upsell no re-corrido end-to-end en closeout | P3 | Cubierto en FIX-1 |

## Fuera de alcance

- Commit / push / deploy
- DB / migrations / RLS / RPC
- `create_order` / payload / `public_order_code`
- Maps/address validation continuation
- CartSheet behavior / signature / storage mutations
- Product features nuevos

## Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-UI-REDESIGN-FINAL-COMMIT-1 = ALLOWED
QUEUE_GATE: PUBLIC-CATALOG-UI-REDESIGN-PUSH-DEPLOY-1 = PAUSED_UNTIL_COMMIT
QUEUE_GATE: PUBLIC-CATALOG-PRODUCTION-SMOKE-QA-1 = PAUSED_UNTIL_DEPLOY
QUEUE_GATE: PUBLIC-CATALOG-SUCCESS-EDGE-STATES-POLISH-1 = OPTIONAL
QUEUE_GATE: PUBLIC-ORDERS-PUBLIC-CODE-SPEC-1 = BACKLOG
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-* = PAUSED
```
