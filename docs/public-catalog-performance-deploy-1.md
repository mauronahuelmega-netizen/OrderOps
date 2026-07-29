# PUBLIC-CATALOG-PERFORMANCE-DEPLOY-1 — Controlled Deploy for Public Catalog Performance Package

## 1. Estado

```txt
DEPLOYED WITH NON-BLOCKING QA DEBT
```

Fecha: 2026-07-28  
Branch: `main`  
Commit funcional: `2b60bb3`  
Deploy URL: `https://orderops.vercel.app`  
CLI local: `tsc` PASS · `build` PASS · `lint` FAIL (ESLint circular histórico)

## 2. Resumen ejecutivo

Se desplegó el paquete acumulado de performance del catálogo público (`IMAGE-OPTIMIZATION` + `IMAGE-TRANSFORMS-QA-FIX` + `PERFORMANCE-FIX`) a producción. Smoke productivo en `/b/demohamburgueseria/catalogo`, checkout boundary sin enviar pedido, preview admin con iframe/cart OK. CSP `frame-ancestors 'self'` intacto. Deuda no bloqueante: Supabase Image Transformations `403 FeatureNotEnabled` (fallback object), corpus/groups overfetch, `noStore`, scroll jank.

## 3. Alcance desplegado

```txt
PUBLIC-CATALOG-IMAGE-OPTIMIZATION-1
PUBLIC-CATALOG-IMAGE-TRANSFORMS-QA-FIX-1
PUBLIC-CATALOG-PERFORMANCE-FIX-1
```

Sin: cache persistente, revalidate, DB/RLS/RPC, checkout action, carrito schema, preview admin logic, CSP, PWA, migraciones.

## 4. Commits y deploy

| Item | Valor |
|------|-------|
| Base HEAD | `4dd5dce` |
| Commit funcional | `2b60bb3` — *Optimize public catalog performance* |
| Push | `4dd5dce..2b60bb3` → `origin/main` |
| Deploy | Vercel production `https://orderops.vercel.app` (Age:0 / X-Vercel-Cache:MISS en smoke) |
| Vercel CLI | no credentials — validado por producción directa |
| Commit docs | (este doc + CURRENT_PHASE + LIVING_MEMORY) |

## 5. Archivos incluidos

**Código**

- `components/public/catalog/public-storage-image.tsx` (nuevo)
- `components/public/catalog/product-card.tsx`
- `components/public/catalog/product-detail-modal.tsx`
- `components/public/catalog/catalog-client.tsx`
- `components/public/catalog/public-catalog-page.tsx`
- `components/public/business/public-business-header.tsx`
- `app/globals.css`
- `lib/catalog/public-page-data.ts` (nuevo)
- `lib/business/public.ts`
- `lib/store-sessions/public.server.ts`
- `lib/product-customization/flags.ts`
- `lib/product-customization/public.ts`

**Docs (commit funcional)**

- `docs/public-catalog-image-optimization-1.md`
- `docs/public-catalog-image-transforms-qa-fix-1.md`
- `docs/public-catalog-performance-fix-1.md`
- `docs/CURRENT_PHASE.md`
- `ORDEROPS_LIVING_MEMORY.md`

**Excluidos (dirty local ajeno)**

- `docs/admin-catalog-preview-mobile-feel-deploy-1.md`
- `docs/admin-catalog-preview-*`, product-customization/stock docs, forensic audit, `tmp/`, `tsconfig.tsbuildinfo`

## 6. Validación local

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `npm run lint` | FAIL — ESLint circular histórico `configs.flat.plugins.react` |
| Source checklist imágenes/data/render | PASS |
| Runtime local `:3020` | PASS — 16 productos / 5 categorías / Desde BBQ+Doble Smash / object fallback |
| Checkout local | no re-corrido en este deploy (ya validado en FIX-1); prod sí |
| Preview local | no requerido; prod sí |

## 7. Smoke producción catálogo

URL: `https://orderops.vercel.app/b/demohamburgueseria/catalogo`

| Check | Resultado |
|-------|-----------|
| Catálogo carga | PASS |
| 16 productos / 5 categorías | PASS |
| Cover/logo/thumbs visibles | PASS (object/public fallback) |
| Desde BBQ Bacon / Doble Smash | PASS |
| Modal customization + Papas/Plus | PASS |
| Sin cursor/pan público | PASS |
| Pedido real | no creado |

## 8. Smoke checkout boundary

URL: `https://orderops.vercel.app/b/demohamburgueseria/checkout`

| Check | Resultado |
|-------|-----------|
| **Enviar pedido** visible | PASS |
| Sin mensaje preview | PASS |
| Items en resumen | PASS (cart persistido browser) |
| Pedido enviado | **NO** |

## 9. Smoke preview admin

URL: `https://orderops.vercel.app/admin/products/preview` (auth disponible en browser)

| Check | Resultado |
|-------|-----------|
| Shell + iframe `?orderopsPreview=1` | PASS · 16 products · 2 Desde |
| Vaciar carrito → 0 | PASS |
| Agregar Mozzarella preview | PASS · cart $9.500 |
| Checkout preview bloqueado | shell “confirmación deshabilitada” visible; no se envió pedido |
| cursor/pan preview | presente en iframe (gated) |

## 10. Headers / CSP

```txt
catalogo:  HTTP/1.1 200 · CSP frame-ancestors 'self' · no X-Frame-Options DENY
checkout:  HTTP/1.1 200 · CSP frame-ancestors 'self'
preview:   HTTP/1.1 307 → /admin/login (curl sin cookie) · CSP frame-ancestors 'self'
```

Sin `frame-ancestors *`. Sin cambios CSP en este deploy.

## 11. Performance sanity

```txt
document request 200
imágenes visibles (object/public)
render/image intento → 403 Forbidden (FeatureNotEnabled infra)
fallback object funciona
sin errores client críticos observados
bytes transform no exigidos hasta habilitar Supabase Image Transformations
```

## 12. Seguridad / no-regression

```txt
No DB
No RLS
No RPC SQL
No cache/revalidation
No checkout action
No carrito schema
No preview admin logic
No CSP changes
No pedidos reales
```

## 13. Deuda residual

| Prioridad | Ítem |
|-----------|------|
| P2 | Supabase Image Transformations no habilitado (403) |
| P2 | `noStore` global / cache strategy pendiente |
| P2 | Corpus loads all groups/options |
| P2 | Scroll/jank glass |
| P3 | Preview hooks en module graph público |
| P3 | Lint ESLint circular histórico |
| P3 | Vercel CLI auth no disponible en entorno |

## 14. Rollback

```bash
git revert 2b60bb3
git push origin main
# si docs deploy ya pusheado:
git revert <docs-deploy-commit>
git push origin main
```

Sin rollback DB/Supabase. No borrar pedidos.

## 15. Resultado final

```txt
DEPLOYED WITH NON-BLOCKING QA DEBT
```

## 16. Próximo paso

```txt
PUBLIC-CATALOG-CACHE-STRATEGY-1
```
