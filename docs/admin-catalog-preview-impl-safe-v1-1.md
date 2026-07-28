# ADMIN-CATALOG-PREVIEW-IMPL-SAFE-V1-1 — Implementación segura V1

## 1. Estado

```txt
PASS WITH DEBT
```

Deuda: browser QA autenticado completo (modales/carrito/checkout en iframe) requiere sesión admin; Device QA PWA no ejecutado; cookie preview (1h, path `/b/{slug}`) bloquea `create_order` también fuera del iframe mientras esté viva.

## 2. Objetivo cumplido

Vista previa del catálogo en `/admin/products/preview` con:

- iframe same-origin del catálogo real;
- carrito aislado `orderops-preview-cart*`;
- checkout visual con submit bloqueado UI + server;
- CSP `frame-ancestors 'self'`;
- CTA dual en Productos;
- sin pedidos reales / sin success / sin RPC SQL / sin DB.

## 3. Arquitectura final

```txt
/admin/products/preview (manageProducts)
  → armCatalogPreviewCookieAction (httpOnly cookie businessId, path=/b/{slug})
  → iframe /b/{slug}/catalogo?orderopsPreview=1
      → cart scope=preview
      → checkout?orderopsPreview=1
          → UI submit disabled
          → createPublicCheckoutOrderAction rejects (cookie || isPreview)
```

Query `orderopsPreview=1` = UX/storage only.  
Cookie httpOnly = verdad server-side para rechazo de pedidos.

## 4. Ruta admin

`app/admin/(protected)/products/preview/page.tsx`

- `requireAdminPermission("manageProducts")`
- Slug desde `adminContext.businessSlug` (server)
- Empty state sin slug (copy aprobado)
- Sin sidebar

## 5. Preview context

| Pieza | Rol |
|-------|-----|
| `armCatalogPreviewCookieAction` | Server Action setea cookie antes del iframe |
| Cookie `orderops-admin-catalog-preview` | value=`businessId`, HttpOnly, SameSite=Lax, Path=`/b/{slug}`, Max-Age=3600, Secure en prod |
| Query `?orderopsPreview=1` | propaga preview en catálogo→checkout; elige keys preview |
| `shouldBlockCatalogPreviewOrder` | rechaza si cookie match **o** `input.isPreview===true` |

No se confía solo en query. No slug editable. No secretos nuevos.

## 6. Carrito aislado

| Scope | Keys |
|-------|------|
| public (default) | `orderops-cart:{id}` · `orderops-cart-v2:{id}` |
| preview | `orderops-preview-cart:{id}` · `orderops-preview-cart-v2:{id}` |

API: `CartStorageScope`, `getCartStorageKeys`, `load/persist/clearUnifiedCartItems(..., scope)`.  
“Vaciar carrito de prueba” → `clearUnifiedCartItems(id, "preview")`.

## 7. Checkout guard

- UI: mensaje bloqueo + botón disabled + early return en `handleSubmit` (no llama action / no success).
- Server: rechazo **antes** de accepting-orders / validation / `create_order`.
- Mensaje: `La confirmación de pedidos está deshabilitada en la vista previa del catálogo.`

## 8. CSP

`next.config.ts` → `headers()` global:

```txt
Content-Security-Policy: frame-ancestors 'self'
```

Runtime verificado local (`next start :3010`): presente en `/b/.../catalogo` y `/admin/products/preview`.

## 9. CTA Productos

`products-header-actions.tsx`:

- **Vista previa del catálogo** → `/admin/products/preview`
- **Copiar link catálogo público** → clipboard URL absoluta `/b/{slug}/catalogo`
- Removido “Ver catálogo” same-tab

Settings/Presence `_blank`: no tocados.

## 10. Archivos

### Creados

- `app/admin/(protected)/products/preview/page.tsx`
- `app/admin/(protected)/products/preview/actions.ts`
- `components/admin/products/catalog-preview-shell.tsx`
- `components/admin/products/catalog-preview-shell.module.css`
- `lib/admin/catalog-preview.ts`
- `lib/admin/catalog-preview-shared.ts`
- `docs/admin-catalog-preview-impl-safe-v1-1.md`

### Modificados

- `components/admin/products/products-header-actions.tsx`
- `lib/cart/local.ts`
- `components/public/catalog/catalog-client.tsx`
- `components/public/catalog/public-catalog-page.tsx`
- `app/b/[slug]/catalogo/page.tsx`
- `app/b/[slug]/checkout/page.tsx`
- `app/b/[slug]/checkout/actions.ts`
- `components/public/checkout/checkout-client.tsx`
- `next.config.ts`
- `docs/CURRENT_PHASE.md`
- `ORDEROPS_LIVING_MEMORY.md`

## 11. QA

| Tipo | Resultado |
|------|-----------|
| CLI tsc | PASS |
| CLI build | PASS |
| CLI lint | FAIL preexistente (ESLint circular) |
| Source | Guards/cart defaults/CSP/CTA OK; no RPC/RLS/Settings/customization preview |
| Headers | CSP `frame-ancestors 'self'` OK local |
| Browser auth | Deuda — requiere login admin |
| Responsive código | Marco ≥768; fluido mobile; sin `scale()` |

## 12. No se tocó

```txt
No DB / RLS / RPC SQL
No Product Customization preview
No Settings / Presence links
No Realtime orders
No PWA manifest/SW
No sidebar / recargar / device selector
No pedidos reales
No commit / push / deploy
```

## 13. Riesgos residuales

1. Cookie viva 1h en path `/b/{slug}` bloquea pedidos reales en ese browser hasta expirar.
2. Same-origin iframe: parent↔child DOM accesible (aceptado V1).
3. “Vaciar carrito” no refresca iframe (admin puede re-navegar en iframe).
4. Browser QA autenticado pendiente.

## 14. Rollback

Revertir archivos listados §10; eliminar ruta/preview helpers/docs. Sin DB.

## 15. Próximo paso

```txt
ADMIN-CATALOG-PREVIEW-QA-1
```
