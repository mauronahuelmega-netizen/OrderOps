# ADMIN-CATALOG-PREVIEW-DEPLOY-1 — Controlled Deploy & Production Smoke

## 1. Estado

```txt
DEPLOYED WITH NON-BLOCKING QA DEBT
```

## 2. Resumen ejecutivo

Se desplegó de forma controlada la Vista previa del catálogo (`c4b3e18` → `main` → Vercel). Producción responde con CSP `frame-ancestors 'self'`. Path público preview confirma carrito aislado y checkout bloqueado (mensaje + botón disabled). Admin autenticado / cookie DevTools / Vaciar→clear cookie quedan **UNVERIFIED** sin sesión E2E. Sin pedidos creados. Sin DB/RLS/RPC.

## 3. Commit / deploy

| Campo | Valor |
|-------|--------|
| Commit | `c4b3e18` — *Add safe admin catalog preview* |
| Branch | `main` |
| Push | `01fe5a4..c4b3e18` → `origin/main` |
| Deploy URL | https://orderops.vercel.app |
| Vercel status | Live (headers CSP presentes; `X-Matched-Path: /admin/products/preview` en 307→login) |
| Hora aprox. | 2026-07-27 ~22:53 ART (commit) · smoke ~23:05 ART |
| Nota | `vercel ls` falló: token CLI inválido; smoke vía HTTPS público |

**Working tree note:** docs/tmp ajenos y `tsconfig.tsbuildinfo` quedaron **fuera** del commit (scope selectivo).

## 4. Archivos incluidos

### Código (23 files en commit)

- `app/admin/(protected)/products/preview/page.tsx`
- `app/admin/(protected)/products/preview/actions.ts`
- `components/admin/products/catalog-preview-shell.tsx`
- `components/admin/products/catalog-preview-shell.module.css`
- `components/admin/products/products-header-actions.tsx`
- `lib/admin/catalog-preview.ts`
- `lib/admin/catalog-preview-shared.ts`
- `lib/cart/local.ts`
- `components/public/catalog/catalog-client.tsx`
- `components/public/catalog/public-catalog-page.tsx`
- `app/b/[slug]/catalogo/page.tsx`
- `app/b/[slug]/checkout/page.tsx`
- `app/b/[slug]/checkout/actions.ts`
- `components/public/checkout/checkout-client.tsx`
- `next.config.ts`

### Docs

- `docs/admin-catalog-preview-audit-1-forensic-architecture.md`
- `docs/admin-catalog-preview-spec-closure-1.md`
- `docs/admin-catalog-preview-impl-safe-v1-1.md`
- `docs/admin-catalog-preview-qa-1.md`
- `docs/admin-catalog-preview-cookie-polish-1.md`
- `docs/admin-catalog-preview-re-qa-1.md`
- `docs/CURRENT_PHASE.md`
- `ORDEROPS_LIVING_MEMORY.md`

(+ este documento en commit de docs post-smoke)

## 5. Validación local

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS (0) |
| `npm run build` | PASS (0); ruta `ƒ /admin/products/preview` |
| `npm run lint` | FAIL preexistente — ESLint circular config |

Source checklist (ruta, carrito, cookie 300, clear, checkout guard, CSP): PASS.

## 6. Smoke producción

| Área | Resultado |
|------|-----------|
| Site live | PASS |
| Headers CSP | PASS |
| Path preview público | PASS |
| Checkout preview block | PASS |
| Regresión pública | PASS (`Enviar pedido`, sin mensaje preview) |
| Admin auth shell | **UNVERIFIED** → `/admin/login` |
| Cookie DevTools / Vaciar | **UNVERIFIED** |
| Device/PWA | **UNVERIFIED** |

Tenant smoke: `demohamburgueseria` / `e21b8fc2-3016-4dec-92ef-ebb04e58ecdf`.

## 7. Admin preview

| Check | Resultado |
|-------|-----------|
| `/admin/products` CTA dual | UNVERIFIED (login) |
| `/admin/products/preview` shell/banner/iframe | UNVERIFIED (login) |
| Ruta protegida | PASS (307 → `/admin/login` sin sesión) |

## 8. Cookie QA producción

| Check | Resultado |
|-------|-----------|
| Source Max-Age=300 / path / HttpOnly / Secure prod | PASS (código desplegado) |
| DevTools Max-Age ≈ 300s | **UNVERIFIED** |
| Clear al vaciar carrito | Source PASS · Browser **UNVERIFIED** |

## 9. Storage QA producción

Tras Agregar Coca en `?orderopsPreview=1`:

```txt
Preview keys cambian.  → orderops-preview-cart contiene Coca
Public keys no cambian. → orderops-cart permanece "[]"
```

## 10. Checkout guard producción

URL: `/b/demohamburgueseria/checkout?orderopsPreview=1`

```txt
No se creó pedido.
No se llamó create_order desde preview.
No se navegó a success.
```

Mensaje + botón **Confirmación deshabilitada** (disabled).

## 11. Headers producción

```txt
Content-Security-Policy: frame-ancestors 'self'
```

Verificado en:

- `/b/demohamburgueseria/catalogo`
- `/b/demohamburgueseria/checkout`
- `/admin/products/preview` (307 login; CSP presente)

Ausente: `X-Frame-Options: DENY`, `frame-ancestors *`.

## 12. Regresión pública

- Catálogo normal carga.
- Checkout normal: botón **Enviar pedido**; sin mensaje de preview.
- No se envió pedido.

## 13. Product Customization / Settings smoke

Admin routes: **UNVERIFIED** (login). Scope del commit no tocó customization preview ni Settings/Presence.

## 14. Deuda residual

| Deuda | Severidad |
|-------|-----------|
| Auth browser (cookie 300s + Vaciar clear en prod) | P2 |
| Iframe no refresca tras vaciar | P2 |
| Responsive admin matrix real | P2/P3 |
| Operator/viewer runtime | P3 |
| Device/PWA | P3 |
| Lint circular | P3 |

Sin P0/P1 abiertos.

## 15. Rollback

No ejecutado. Si hace falta:

1. `git revert c4b3e18` + push `main`
2. Confirmar preview route / CTA / CSP según estado previo
3. Sin tocar DB/Supabase/pedidos

## 16. Próximo paso

```txt
ADMIN-CATALOG-PREVIEW-HANDOFF-1
```

(Alternativa UX: `ADMIN-CATALOG-PREVIEW-TOUCH-PAN-POLISH-1` si se prioriza polish iframe.)
