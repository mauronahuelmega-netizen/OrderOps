# PUBLIC-CATALOG-MOTION-OVERLAYS-IMPL-2

## Estado

PASS WITH BROWSER QA DEBT — PUBLIC CATALOG MOTION OVERLAYS IMPL-2 COMPLETE

## Contexto

CartSheet overlay motion ya en producción (`e682568`). Esta fase alinea Customization modal, Post-add upsell sheet y Product detail modal al mismo lenguaje (backdrop fade + surface slide/fade + press + PRM), sin Framer Motion ni cambios de negocio.

## Scope

**IN**

- Customization modal enter/exit + dismiss delayed unmount
- Customization CTA/close/secondary press; option press vía `:global([role=radio|checkbox])`
- Confirm/add path: cierre **inmediato** (preserva handoff upsell/cart)
- Post-add upsell enter/exit + finish/dismiss delayed unmount (≤180ms)
- Attach upsell: **inmediato** (sin delay)
- Product detail enter/exit + dismiss delayed unmount
- Save/customize path: cierre **inmediato**
- Reduced-motion en los tres
- Helper puro `public-overlay-motion.ts`

**OUT**

- CartSheet / ProductCard / CartBar
- Framer Motion, checkout/create_order, DB/packages

## Implementation

Patrón compartido (como CartSheet):

```text
requestClose/requestFinish
  → PRM: onClose/onFinish inmediato
  → else: isClosing + timer PUBLIC_OVERLAY_EXIT_MS (180) → unmount
```

## Files changed

| File | Change |
|------|--------|
| `components/public/catalog/public-overlay-motion.ts` | **Nuevo** — `prefersReducedMotion`, `PUBLIC_OVERLAY_EXIT_MS` |
| `components/public/catalog/customization-modal.tsx` | Delayed dismiss; `closeImmediate` post-confirm |
| `components/public/catalog/customization-modal.module.css` | Enter/exit keyframes + press + PRM |
| `components/public/catalog/post-add-upsell-sheet.tsx` | Delayed finish; attach inmediato |
| `components/public/catalog/post-add-upsell-sheet.module.css` | Enter/exit keyframes + press + PRM |
| `components/public/catalog/product-detail-modal.tsx` | Delayed dismiss; `closeImmediate` post-save |
| `app/globals.css` | `.catalog-modal*` animations + press scoped; PRM |
| `docs/public-catalog-motion-overlays-impl-2.md` | Este documento |

`catalog-client.tsx`: **sin tocar**.

## Customization modal motion

- Keyframes: `catalogCustomizationBackdropIn/Out`, `catalogCustomizationModalIn/Out`
- Clases: `backdropClosing`, `modalClosing`, `data-closing`
- Dismiss (X / backdrop / Escape / cancel): delayed
- Confirm success: `closeImmediate()` — no retrasa mutación ni handoff
- CTA press + `ctaPriceBump` preservado
- Option press: radio/checkbox under `.modal`

## Post-add upsell motion

- Keyframes: `catalogUpsellBackdropIn/Out`, `catalogUpsellSheetIn/Out`
- Finish paths (X / backdrop / Escape / “Ahora no” / “Listo”): delayed ≤180ms luego `onFinish` → cart
- `handleAttach`: inmediato
- Press en icon / add / primary

## Product detail modal motion

- Globals `.catalog-modal-backdrop` / `.catalog-modal` + `data-closing`
- Keyframes: `catalogProductDetailBackdropIn/Out`, `catalogProductDetailModalIn/Out`
- Dismiss delayed; submit save → `closeImmediate`; customize callback sin delay de unmount propio
- Press: close / submit / qty dentro de `.catalog-modal`

## Reduced motion

CSS: animations/transitions/active transform off por overlay.

JS: `prefersReducedMotion()` → close/finish inmediato sin timer.

## Scroll lock / focus / Escape

- `usePublicOverlayScrollLock` sin cambios
- Lock hasta unmount real post-exit
- Escape / backdrop / X usan requestClose/requestFinish
- Focus trap preservado
- Closing: `pointer-events: none`

## Validation

| Check | Result |
|-------|--------|
| tsc / build | PASS |
| git diff --check | PASS |
| lint | P3 tooling ESLint 9 circular (conocido) |
| CartSheet diff | vacío |
| catalog-client | sin diff |

## Browser QA

Local `http://localhost:3000/b/demohamburgueseria/catalogo`:

| Caso | Resultado |
|------|-----------|
| Product detail open/close X | PASS — enter anims + delayed unmount + scroll unlock |
| Customization open + Escape | PASS — enter anims + `data-closing` + unlock |
| Customization select + confirm | PASS — add al carrito; handoff inmediato a cart (sin upsell en este run) |
| Post-add upsell enter/exit | **QA debt P3** — confirm fue a CartSheet sin sheet upsell visible (candidatos/condiciones de negocio); código motion implementado |
| PRM detail + custom | PASS — anim `none`, close inmediato |
| create_order / checkout submit | 0 |

Hydration overlay Next en `public-catalog-page.tsx`: deuda preexistente.

## Safety

| Item | Count |
|------|-------|
| create_order | 0 |
| Pedidos reales | 0 |
| WhatsApp | 0 |
| DB/RPC/actions/packages | 0 |
| CartSheet touched | 0 |

## Risks / Debt

- P3: Post-add upsell browser enter/exit no observado en este tenant/run (flujo fue a cart)
- P3: ESLint 9 circular config
- P3: Hydration warning catálogo preexistente
- Option press depende de roles a11y del shared option-group (no se modificó ese módulo)

## Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-MOTION-OVERLAYS-QA-2 = ALLOWED
QUEUE_GATE: PUBLIC-CATALOG-MOTION-OVERLAYS-COMMIT-DEPLOY-2 = PAUSED_UNTIL_QA
QUEUE_GATE: PUBLIC-CATALOG-MOTION-OVERLAYS-IMPL-2 = COMPLETE_WITH_QA_DEBT
QUEUE_GATE: PUBLIC-CATALOG-MOTION-OVERLAYS-IMPL-1 = COMPLETE
QUEUE_GATE: PUBLIC-CATALOG-MOTION-INTERACTIONS-IMPL-2 = SUPERSEDED
QUEUE_GATE: PUBLIC-TENANT-BROWSER-BRANDING-FAVICON-CACHE-BUST-1 = BACKLOG_OPTIONAL
QUEUE_GATE: PUBLIC-CATALOG-SUCCESS-EDGE-STATES-POLISH-1 = OPTIONAL
QUEUE_GATE: PUBLIC-ORDERS-PUBLIC-CODE-SPEC-1 = BACKLOG
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-* = PAUSED
```

Sin commit. Sin push. Sin deploy.
