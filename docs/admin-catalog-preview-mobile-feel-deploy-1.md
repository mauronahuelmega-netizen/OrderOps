# ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-DEPLOY-1 — Controlled Deploy for Mobile Feel + Shell Polish

## 1. Estado

**DEPLOYED WITH NON-BLOCKING QA DEBT**

Fecha: 2026-07-28  
Commit: `5843fd9`  
Branch: `main`  
Deploy URL: https://orderops.vercel.app

## 2. Resumen ejecutivo

Se desplegó en producción el paquete acumulado de Admin Catalog Preview: touch-pan, anti-selection, cursor circular, momentum, shell premium polish, clear-cart iframe sync y layout dos mitades. Smoke productivo crítico PASS (preview, layout, clear cart, checkout guard, público, CSP). Deuda P3 residual aceptada.

## 3. Commit / deploy

| Campo | Valor |
|-------|-------|
| Commit | `5843fd9` — Add mobile feel and shell polish to admin catalog preview |
| Docs follow-up | `311568b` — docs: record ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-DEPLOY-1 production smoke |
| Parent | `84c0c48` |
| Branch | `main` |
| Push | `84c0c48..5843fd9` (+ docs `311568b`) → `origin/main` |
| Deploy URL | https://orderops.vercel.app |
| Vercel status | LIVE (asset markers detectados en prod) |
| Hora aprox. | 2026-07-28 ~16:05–16:20 UTC |

Markers prod (`/b/demohamburgueseria/catalogo`):

- `ORDEROPS_PREVIEW_CLEAR_CART` / `_ACK` en chunks JS
- `data-preview-pan-enabled` / `data-preview-touch-cursor` en CSS

## 4. Archivos incluidos

### Código (13)

- `components/public/catalog/use-preview-pointer-pan-scroll.ts` (new)
- `components/public/catalog/use-preview-touch-cursor.ts` (new)
- `components/public/catalog/catalog-preview-pan.module.css` (new)
- `components/public/catalog/catalog-preview-mobile-feel.module.css` (new)
- `components/public/catalog/catalog-client.tsx`
- `components/public/catalog/category-nav.tsx`
- `components/public/catalog/cart-bar.tsx`
- `components/public/catalog/cart-sheet.tsx`
- `components/public/catalog/product-detail-modal.tsx`
- `components/public/catalog/customization-modal.tsx`
- `components/admin/products/catalog-preview-shell.tsx`
- `components/admin/products/catalog-preview-shell.module.css`
- `lib/admin/catalog-preview-shared.ts`

### Docs (10)

- `docs/admin-catalog-preview-handoff-1.md`
- `docs/admin-catalog-preview-touch-pan-polish-1.md`
- `docs/admin-catalog-preview-touch-pan-qa-fix-1.md`
- `docs/admin-catalog-preview-mobile-feel-spec-1.md`
- `docs/admin-catalog-preview-mobile-feel-polish-1.md`
- `docs/admin-catalog-preview-mobile-feel-auth-qa-1.md`
- `docs/admin-catalog-preview-shell-premium-polish-1.md`
- `docs/admin-catalog-preview-shell-layout-qa-fix-1.md`
- `docs/CURRENT_PHASE.md`
- `ORDEROPS_LIVING_MEMORY.md`

### Stats

23 files, +2927 / −128

### Excluido (fuera de scope)

- `tsconfig.tsbuildinfo`
- `tmp/**`
- docs product-customization / stock / deploy-qa históricos no relacionados

## 5. Validación local

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `npm run lint` | FAIL preexistente (ESLint circular `configs.flat.plugins.react`) |

## 6. Source release checklist

| Área | Estado |
|------|--------|
| Preview shell (Modo seguro, Vaciar/Copiar, sin Recargar/selector/panel) | PASS |
| Layout 1fr/1fr, phone centrado, sticky ≥1024, frame envuelve viewport | PASS |
| Clear cart postMessage + ACK + origin/businessId + preview-only | PASS (código + smoke) |
| Mobile-feel preview+mouse only | PASS (código + markers) |
| Checkout preview bloqueado / CSP / sin DB | PASS |

## 7. Smoke producción

Tenant: `demohamburgueseria`  
Sesión: owner demo  
Sin pedidos creados.

## 8. Admin preview producción

PASS — `/admin/products/preview` carga con título, Modo seguro activo, Vaciar/Copiar, checklist, iframe `...?orderopsPreview=1`, top-level estable, sin Recargar.

## 9. Layout producción

Medido 1440px:

- cols 619/619, frame 422, wrap 390, pad 16/16, Δ centro 0
- sticky, sin overflowX
- gap columna derecha ~99px

```txt
Dos mitades.
Phone centrado en mitad derecha.
Frame/viewport alineados.
Sin overflowX.
```

## 10. Cursor producción

PASS:

- nodo `previewTouchCursor` presente en iframe
- `pointer-events: none`
- no en shell admin / no en catálogo público

## 11. Momentum producción

PASS parcial / automation-limited:

- pan drag en iframe mueve scroll (p.ej. 300→564)
- código momentum desplegado; auth QA previa Δ≈−75
- flick sintético vía `PointerEvent` no reprodujo inercia post-release en esta sesión (timestamps/sampling)

Clasificado como deuda P3 de automation, no P0 funcional.

## 12. Anti-selection producción

PASS:

- `user-select: none` con `data-preview-pan-state=active`
- CSS pan/mobile-feel en prod

## 13. Clear cart producción

PASS:

- toast “Vaciando carrito de prueba…”
- preview keys → `[]`
- public cart keys intactas (seguían con items)
- top-level `/admin/products/preview`

## 14. Checkout guard producción

PASS (iframe preview → checkout):

- copy: “La confirmación de pedidos está deshabilitada…”
- botón **Confirmación deshabilitada**
- sin **Enviar pedido**
- sin success / sin create_order / sin pedido

## 15. Público normal producción

PASS:

- `/catalogo`: sin `data-preview-pan-enabled`, sin cursor
- `/checkout`: botón **Enviar pedido** visible
- keys públicas intactas

## 16. Product Customization / Settings smoke

PASS:

- `/admin/products/customizations` carga
- `/admin/settings/public/catalogo` carga (Presencia pública)

## 17. Deuda residual

| ID | Sev | Nota |
|----|-----|------|
| Device touch real | P3 | No verificado en dispositivo físico |
| Clipboard success toast automation | P3 | Flaky en automation |
| Press feedback / cursor pressed | P3 | Diferido |
| Momentum flick via synthetic PointerEvent | P3 | Pan OK; inercia automation-limited |
| ESLint circular histórico | P3 | Preexistente |

## 18. Rollback

No ejecutado.

Si P0/P1:

```bash
git revert 5843fd9
git push origin main
```

Sin DB / sin Supabase / sin borrar pedidos.

## 19. Próximo paso

**ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-HANDOFF-1**
