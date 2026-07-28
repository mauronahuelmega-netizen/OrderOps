# ADMIN-CATALOG-PREVIEW-COOKIE-POLISH-1 — Preview Cookie Lifetime & Cleanup Polish

## 1. Estado

**PASS WITH AUTH QA DEBT**

Cookie Max-Age reducido a 300s; “Vaciar carrito de prueba” limpia keys preview y expira la cookie vía Server Action con revalidación admin/tenant. Checkout guard intacto. Browser admin autenticado no verificado en esta sesión.

## 2. Resumen ejecutivo

Se corrigió la deuda P1 de `ADMIN-CATALOG-PREVIEW-QA-1`: la cookie `orderops-admin-catalog-preview` ya no dura 1h. Ahora dura **300 segundos** y se puede expirar explícitamente al vaciar el carrito de prueba, sin botón nuevo ni cambios de DB/RLS/RPC.

## 3. Problema corregido

| Antes | Impacto |
|-------|---------|
| `Max-Age=3600` | Admin podía quedar bloqueado para pedidos reales en `/b/{slug}/*` hasta 1h tras preview |
| Solo clear de localStorage preview | Cookie seguía activa aunque se vaciara el carrito de prueba |

No afectaba customers anónimos (no reciben la cookie).

## 4. Cambios realizados

1. Constante centralizada `CATALOG_PREVIEW_COOKIE_MAX_AGE_SECONDS = 300` en `catalog-preview-shared.ts`.
2. `setCatalogPreviewCookie` usa esa constante (ya no 3600).
3. Helper `clearCatalogPreviewCookie` (mismo name/path, `maxAge: 0`).
4. Server Action `clearCatalogPreviewCookieAction` con `manageProducts` + match tenant.
5. Shell: “Vaciar carrito de prueba” limpia preview keys y llama clear cookie.

## 5. Cookie antes/después

| Campo | Antes | Después |
|-------|-------|---------|
| Name | `orderops-admin-catalog-preview` | igual |
| Value | `businessId` | igual |
| Path | `/b/{slug}` | igual |
| HttpOnly | sí | sí |
| SameSite | Lax | Lax |
| Secure (prod) | sí | sí |
| Max-Age | **3600** | **300** |
| Clear | no | `maxAge: 0` mismo path |

## 6. Clear cookie server-side

- Action: `clearCatalogPreviewCookieAction({ businessId, businessSlug })`
- Revalida: `requireAdminPermission("manageProducts")`
- Tenant: input debe coincidir con `adminContext.businessId` y `businessSlug` (slug arbitrario → `tenant_mismatch`)
- Path de expiración: `/b/{contextSlug}` (mismo que set)
- No toca cookies Supabase ni localStorage

## 7. Vaciar carrito de prueba

Al click:

1. `clearUnifiedCartItems(businessId, "preview")` → solo `orderops-preview-cart*` / `orderops-preview-cart-v2*`
2. `clearCatalogPreviewCookieAction` → expira cookie
3. Feedback existente: “Carrito de prueba vaciado” / error

Nombre del botón **sin cambio**. Sin “Salir de vista previa”. Sin refresh forzado del iframe (deuda P2).

## 8. Checkout guard

Sin cambios en `createPublicCheckoutOrderAction`:

- Bloquea si cookie match **o** `input.isPreview === true`
- Antes de accepting / validation / `create_order`
- UI preview sigue con submit deshabilitado

Expirar cookie **no** convierte preview en canal de pedidos: el iframe sigue con `orderopsPreview=1` → `isPreview` server-side.

## 9. QA

### CLI

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | PASS (exit 0) |
| `npm run build` | PASS (exit 0) |
| `npm run lint` | FAIL preexistente — ESLint circular JSON config (`TypeError: Converting circular structure to JSON`) |

### Source QA

| # | Check | Resultado |
|---|-------|-----------|
| 1 | No `maxAge=3600` para esta cookie | PASS |
| 2 | Max-Age = 300 | PASS |
| 3 | Clear usa path `/b/{slug}` | PASS |
| 4 | Clear revalida admin + manageProducts | PASS |
| 5 | Clear no acepta slug arbitrario | PASS (`tenant_mismatch`) |
| 6 | Vaciar limpia preview keys | PASS |
| 7 | Vaciar expira cookie | PASS |
| 8 | Public keys no se tocan | PASS (scope `"preview"`) |
| 9 | Checkout guard antes de create_order | PASS (sin tocar) |
| 10–14 | No DB/RLS/RPC / Customization / Settings / PWA | PASS |

### Browser QA

Admin autenticado: **UNVERIFIED** (sin credenciales E2E en esta sesión).

## 10. Riesgos residuales

| Riesgo | Severidad | Notas |
|--------|-----------|-------|
| Auth browser QA | Deuda | Confirmar Max-Age=300 y clear en DevTools |
| 300s aún puede bloquear pedidos reales brevemente | Aceptado | Mitigado por clear en “Vaciar carrito” |
| Iframe no refresca tras vaciar | P2 | Sin cambio en esta fase |
| Device/PWA matrix | Deuda previa | Fuera de scope |

## 11. Rollback

Código/docs only:

1. Revertir Max-Age a 3600 (o valor anterior).
2. Remover `clearCatalogPreviewCookie` + action.
3. Revertir wiring de “Vaciar carrito de prueba”.
4. Revertir docs de fase.

Sin DB rollback.

## 12. Próximo paso

**ADMIN-CATALOG-PREVIEW-RE-QA-1** — re-QA breve (cookie 300s + vaciar limpia cookie + checkout guard) antes de deploy.
