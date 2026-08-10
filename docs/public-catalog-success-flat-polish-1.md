# PUBLIC-CATALOG-SUCCESS-FLAT-POLISH-1

## Estado

**PASS — SUCCESS FLAT POLISH VERIFIED**

## Contexto

Basado en `docs/public-catalog-success-forensic-audit-1.md` (`AUDIT COMPLETE — SUCCESS READY FOR FLAT POLISH`).

Objetivo: alinear Success con el sistema flat del Checkout (canvas cálido, surfaces tokenizadas, sin sombra fuerte, dark parity, CTA accent de negocio, UUID con jerarquía baja), sin tocar contratos funcionales.

## Cambios aplicados

| Archivo | Cambio |
|---------|--------|
| `app/b/[slug]/success/page.tsx` | CSS Module; copy compacto; label “Referencia del pedido”; `--business-primary` inline (mismo patrón checkout); CTAs flat via clases module |
| `app/b/[slug]/success/success-page.module.css` | **Nuevo** — tokens `--success-*` light/dark, layout top-aligned, panel flat, ref box secundario, CTAs |
| `app/globals.css` | Eliminados estilos legacy `.success-*` (huérfanos confirmados) |
| `docs/public-catalog-success-flat-polish-1.md` | Este documento |

Checkout / Maps / WhatsApp builder / actions / DB: **sin cambios**.

## Layout

- Eliminado `min-height: 100vh` + `place-items: center`.
- Canvas full-width con `padding-top: 1.5rem` (24px) mobile; panel top-aligned.
- Gap header → panel medido **24px** @390 (antes ~150px+).
- Desktop 1440: panel no hundido; padding-top 2rem; max-width inner ~47.5rem, panel ~32.5rem.
- `box-shadow: none` en panel.

## Copy / hierarchy

```text
Eyebrow: Pedido registrado
H1: Pedido recibido
Business: {business.name}
Body (con order_id): Ya registramos tu pedido. Confirmalo por WhatsApp para que el negocio pueda prepararlo.
Body (sin order_id): Ya registramos tu pedido. Si necesitás confirmarlo, escribile al negocio por WhatsApp.
```

H1 medido ~21.6px @390 (antes ~32px).

## Order reference

- Label: **Referencia del pedido**
- Valor: UUID/texto completo del query (sin abreviar, sin short code inventado)
- Tipografía mono compacta (~12.5px), color muted, `overflow-wrap: anywhere`
- Slot tipográfico listo para futuro `Pedido #K7P4Q9` (no implementado)

## WhatsApp CTA

- Visual: `var(--success-accent)` = `business.primary_color` (demo `#0F766E` teal), no naranja legacy
- `min-height: 3rem` (48px), full-width
- Contrato intacto: `buildPublicOrderWhatsappUrl({ whatsappNumber, orderId })`, `target="_blank"`, `rel="noreferrer"`, label “Confirmar por WhatsApp”
- Mensaje / encoding / número: sin cambios en `lib/whatsapp/public.ts`

## Return CTA

- href: `/b/${slug}/catalogo` (intact)
- Ghost/secondary flat: border tokenizado, fondo transparente
- `min-height: 3rem`

## Dark / Light

| Token | Light | Dark (`html[data-catalog-theme="dark"]`) |
|-------|-------|------------------------------------------|
| canvas | `#f6f2ea` → `rgb(246,242,234)` | `#12100d` → `rgb(18,16,13)` |
| surface/panel | blanco | `#1d1712` → `rgb(29,23,18)` |
| text | `#20170f` | `#f8f2e8` |
| CTA | business primary teal | mismo accent |
| white panel in dark | — | **no** |

## Edge states

### Sin order_id

- 200, no crash
- Sin reference box
- Copy suave de confirmación WhatsApp
- WA sin línea `Pedido:`

### order_id inválido

- 200, no crash
- Reference box muestra texto (`invalid`) sin validación nueva
- Sin fetch/ownership/redirect

## Accessibility

- `h1` único con `id` + `aria-labelledby` en section
- Links con labels claros; WA external `rel="noreferrer"`
- `focus-visible` outline accent
- UUID wrap legible
- Contraste light/dark tokenizado

## Browser QA

### Light

- Canvas cream, panel flat sin shadow, gap 24px, CTA teal `rgb(15,118,110)`, ref secundaria

### Dark

- Canvas/panel dark, sin white surfaces, CTA teal, secondary border/text claros

### Viewports

- 390×844: top gap 24px, h1 compacto, CTAs 48px
- 1440×900: card no centrada verticalmente / no hundida
- HTTP 200 en catalogo/checkout/success/success?invalid

### WhatsApp href

- host `wa.me`, target blank, rel noreferrer
- Pedido line presente solo con `order_id`
- **Envío real: 0**

## Console / network QA

```text
create_order: 0
pedidos reales: 0
WhatsApp real enviado: 0
Sin fetch de order en Success
PII/API keys/tokens: no registrados
```

## Validación

```text
tsc --noEmit: PASS (vía next build TS)
npm run build: PASS
git diff --check: PASS (solo warning CRLF en page.tsx)
HTTP smoke: catalogo/checkout/success/invalid → 200
tsconfig.tsbuildinfo: restaurado si apareció
```

## Contratos preservados

```text
✓ /b/[slug]/success
✓ searchParam order_id
✓ requirePublicBusinessBySlug
✓ buildPublicOrderWhatsappUrl(whatsappNumber, orderId)
✓ checkout redirect contract (no tocado)
✓ volver /b/{slug}/catalogo
✓ sin fetch order / ownership / UUID validation
✓ sin public_order_code
✓ sin DB/RPC/action/WhatsApp message changes
```

## Deuda aceptada

```text
P3 — edge copy genérico “éxito” sin order_id (OPTIONAL followup)
P3 — preview-aware return no implementado
BACKLOG — public_order_code / PUBLIC-ORDERS-PUBLIC-CODE-SPEC-1
PAUSED — Maps/address validation line
```

## Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-SUCCESS-EDGE-STATES-POLISH-1 = OPTIONAL
QUEUE_GATE: PUBLIC-CATALOG-UI-REDESIGN-CLOSEOUT-1 = ALLOWED
QUEUE_GATE: PUBLIC-ORDERS-PUBLIC-CODE-SPEC-1 = BACKLOG
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-* = PAUSED
```
