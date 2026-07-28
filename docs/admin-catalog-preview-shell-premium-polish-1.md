# ADMIN-CATALOG-PREVIEW-SHELL-PREMIUM-POLISH-1 — Preview Shell UX Polish Before Deploy

## 1. Estado

**PASS WITH NON-BLOCKING UX DEBT**

Shell premium + clear-cart iframe sync + toasts + checklist + sticky phone PASS en admin autenticado. Deuda: clipboard success toast no verificable en automatización Cursor (error path sí); device touch previo; press feedback diferido.

## 2. Resumen ejecutivo

Se pulió `/admin/products/preview` sin panel izquierdo ni estado de carrito en shell: jerarquía de acciones, checklist, copy “Modo seguro activo”, phone sticky desktop, empty/loading/error más claros, toasts vía `useAdminToast`, y sync de “Vaciar carrito de prueba” al iframe con `postMessage` same-origin + ACK + remount fallback.

## 3. Decisiones de producto

| Incluir | No incluir |
|---------|------------|
| Acciones jerarquizadas | Panel izquierdo premium |
| Toast copy / vaciar | Estado carrito en shell |
| postMessage clear cart | Recargar / device selector |
| Checklist | Deploy/commit/push |
| Safety copy premium | Cambios checkout guard / CSP / DB |
| Phone sticky ≥1024 | |

## 4. Layout shell

Grid desktop (`≥1024`): content column + phone column sticky (`top: 96px`). Mobile: columna única, acciones apiladas. Sin overflow horizontal observado.

## 5. Acciones y toasts

* `Vaciar carrito de prueba` — secondary soft-destructive + loading “Vaciando…”
* `Copiar link catálogo público` — secondary
* Toasts: `useAdminToast` (`info`/`success`/`error`)
* Microcopy: acciones solo afectan preview

## 6. Clear cart iframe sync

1. Parent: `clearUnifiedCartItems(preview)` + `postMessage(ORDEROPS_PREVIEW_CLEAR_CART)`
2. Iframe (`isCatalogPreview` only): validate origin + businessId → clear storage + `setCartItems([])` + ACK
3. Si no ACK en 1000ms → bump `iframeKey` (remount silencioso)
4. `clearCatalogPreviewCookieAction` existente
5. Toast éxito

Constantes en `lib/admin/catalog-preview-shared.ts`.

## 7. Checklist

Cinco ítems livianos bajo “Qué podés probar”.

## 8. Seguridad copy

“Modo seguro activo” + copy de pedidos deshabilitados + “No se crean pedidos reales…”.

## 9. Sticky phone

`.phoneSticky { position: sticky; top: 96px }` solo `@media (min-width: 1024px)`.

## 10. Empty/loading/error states

* Empty slug: copy + CTA Presencia pública
* Loading cookie: “Preparando vista previa del catálogo…”
* Cookie error / iframe loading overlay
* Sin botón Recargar

## 11. QA

| Área | Resultado |
|------|-----------|
| `tsc` / `build` | PASS |
| `lint` | FAIL circular preexistente |
| Layout shell | PASS — safety/actions/checklist/sticky |
| Vaciar → iframe 0 | PASS — bar disabled, preview `[]`, toasts |
| Public keys | PASS — no limpiadas por vaciar |
| Copy toast | PARTIAL — error path en automation; success source OK |
| Mobile-feel | PASS — cursor + pan enabled |
| Checkout preview | PASS — bloqueo + Confirmación deshabilitada |
| Público normal | PASS (smoke) |
| Customizations/Settings | Source untouched; smoke prior chain |

## 12. Deuda residual

| Ítem | Severidad |
|------|-----------|
| Clipboard success toast en automation | P3 |
| Device touch / press feedback | P3 / P2 |
| ESLint circular | P3 |

## 13. Rollback

Revertir shell TSX/CSS, listener en `catalog-client`, constantes postMessage en shared. Sin DB.

## 14. Próximo paso

```txt
ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-DEPLOY-1
```
