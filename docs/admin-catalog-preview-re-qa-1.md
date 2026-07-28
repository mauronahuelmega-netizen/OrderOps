# ADMIN-CATALOG-PREVIEW-RE-QA-1 — Authenticated Re-QA After Cookie Polish

## 1. Estado

```txt
READY WITH NON-BLOCKING QA DEBT
```

## 2. Resumen ejecutivo

Tras `ADMIN-CATALOG-PREVIEW-COOKIE-POLISH-1`, el source re-check confirma Max-Age **300**, clear cookie con tenant match, y wiring de **Vaciar carrito de prueba**. Runtime en `:3012` (build fresco) confirma aislamiento de carrito, checkout preview bloqueado (mensaje + botón disabled), regresión pública con **Enviar pedido** sin mensaje preview, y CSP `frame-ancestors 'self'`. Admin autenticado (`/admin/products/preview`, DevTools cookie Max-Age, clear al vaciar) queda **UNVERIFIED** sin credenciales E2E. No se crearon pedidos. Sin código, commit, push ni deploy.

## 3. Entorno

| Item | Valor |
|------|--------|
| Branch | `main` |
| HEAD | `01fe5a4` |
| Working tree | Sucio (impl preview + cookie polish uncommitted + docs/tmp previos) |
| Server QA | `npx next start -p 3012` (post-`npm run build`) |
| Tenant smoke | `demohamburgueseria` · `businessId=e21b8fc2-3016-4dec-92ef-ebb04e58ecdf` |
| Auth admin | Ausente (`E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` absent en proceso) |

## 4. Preflight

| Check | Resultado |
|-------|-----------|
| `git branch` / `HEAD` | `main` @ `01fe5a4` |
| Working tree | No limpiado / no stash / no revert |
| `npx tsc --noEmit` | PASS (0) |
| `npm run build` | PASS (0); ruta `ƒ /admin/products/preview` |
| `npm run lint` | FAIL (2) — ESLint circular **preexistente** |

## 5. Source re-check

| Área | Resultado | Evidencia |
|------|-----------|-----------|
| A1 Cookie polish | PASS | `CATALOG_PREVIEW_COOKIE_MAX_AGE_SECONDS = 300`; set usa esa constante; **no** queda `3600` en helpers |
| A1 attrs | PASS | name `orderops-admin-catalog-preview`; path `/b/{slug}`; httpOnly; sameSite lax; secure en prod |
| A2 Clear cookie | PASS | `clearCatalogPreviewCookieAction` + `requireAdminPermission("manageProducts")` + tenant match → `tenant_mismatch`; path igual; maxAge 0; no Supabase cookies |
| A3 Vaciar carrito | PASS | `clearUnifiedCartItems(..., "preview")` + clear action; copy “Vaciar carrito de prueba”; sin “Salir de vista previa” |
| A4 Checkout guard | PASS | `shouldBlockCatalogPreviewOrder` **antes** de accepting / validation / `create_order`; UI early-return + disabled |
| Permisos source | PASS | `canManageProducts` = owner \|\| manager; page `requireAdminPermission("manageProducts")` |
| CTA Productos | PASS | Vista previa → `/admin/products/preview`; Copiar link → `/b/{slug}/catalogo`; sin “Ver catálogo” legacy |

## 6. Browser QA autenticado

| Caso | Resultado |
|------|-----------|
| `/admin/products` CTA dual | **UNVERIFIED** — redirect `/admin/login` |
| `/admin/products/preview` shell/banner/iframe | **UNVERIFIED** — sin sesión |
| Vaciar carrito (admin chrome) + clear cookie | **UNVERIFIED** |
| Copiar link desde admin | **UNVERIFIED** |

Sustituto autorizado (path público `?orderopsPreview=1`): catálogo carga, categorías/productos, add Coca, cart sheet, checkout bloqueado.

## 7. Cookie QA

| Check | Resultado |
|-------|-----------|
| Source Max-Age=300 | PASS |
| No Max-Age=3600 en código cookie | PASS |
| DevTools cookie armada (HttpOnly path `/b/{slug}` ~300s) | **UNVERIFIED** (requiere admin arm action) |
| Clear al vaciar carrito | Source PASS · Browser **UNVERIFIED** |
| `document.cookie` en path público | vacío (esperado: cookie httpOnly solo se setea vía admin action) |

## 8. Iframe UX

Admin iframe shell: **UNVERIFIED** (auth).

Path público preview (sustituto del contenido del iframe):

| Check | Resultado |
|-------|-----------|
| Catálogo / categorías / productos | PASS |
| Agregar Coca Cola 500ml | PASS |
| Cart bar / sheet | PASS |
| Overflow grave | No observado en viewport emulado |

## 9. Storage QA

Business: `e21b8fc2-3016-4dec-92ef-ebb04e58ecdf`

Tras Agregar en `?orderopsPreview=1`:

```txt
Preview keys cambian.  → orderops-preview-cart:{id} contiene Coca Cola 500ml
Public keys no cambian. → orderops-cart* permanecen null
```

Tras limpiar preview keys (simulación localStorage; clear cookie admin UNVERIFIED):

```txt
Preview keys null.
Public keys intactas (null en ese momento).
```

Tras Agregar en catálogo **sin** preview:

```txt
Public keys cambian (Coca).
Preview keys permanecen null.
```

## 10. Checkout preview QA

URL: `/b/demohamburgueseria/checkout?orderopsPreview=1`

| Check | Resultado |
|-------|-----------|
| Mensaje bloqueo | PASS |
| Botón “Confirmación deshabilitada” disabled | PASS |
| Success | No navegado |
| Pedido / create_order | No (no submit forzado) |
| Carrito público | No tocado por preview add |

## 11. Regresión pública

| Check | Resultado |
|-------|-----------|
| `/checkout` sin query: sin mensaje preview | PASS (empty cart state o form normal) |
| Con carrito público: botón **Enviar pedido** | PASS |
| No disabled por cookie preview | PASS (sin cookie armada; form usable) |
| Pedido real | No enviado |

## 12. Headers QA

`:3012` (también verificado en `:3011`):

```txt
Content-Security-Policy: frame-ancestors 'self'
```

| Check | Resultado |
|-------|-----------|
| catalogo | PASS |
| checkout | PASS |
| admin/products/preview | PASS (header presente; body 307 → `/admin/login`) |
| X-Frame-Options: DENY | Ausente |
| frame-ancestors * | Ausente |

## 13. Responsive QA

Admin shell (marco teléfono): **source-only** (auth UNVERIFIED). CSS: phoneFrame `display:none` &lt;768; visible ≥768.

| Viewport | Resultado | Notas |
|----------|-----------|-------|
| 390 | PASS (público) / admin UNVERIFIED | Emulación: checkout público fluido; sin mensaje preview |
| 414 | Source esperado / admin UNVERIFIED | Misma rama CSS &lt;768 |
| 768 | Source esperado / admin UNVERIFIED | phoneFrame on |
| 1024 | Source esperado / admin UNVERIFIED | phoneFrame centrado |
| 1440 | Source esperado / admin UNVERIFIED | phoneFrame centrado |

## 14. Product Customization / Settings smoke

| Ruta | Resultado |
|------|-----------|
| `/admin/products/customizations` | **UNVERIFIED** (login) |
| `/admin/settings/public/catalogo` | **UNVERIFIED** (login) |

Source: CTA customization distinto (“Opcionales y extras” / Vista previa del cliente no tocada en esta fase).

## 15. Permisos

| Rol | Resultado |
|-----|-----------|
| Owner/manager | Source PASS (`canManageProducts`) · runtime **UNVERIFIED** |
| Operator/viewer | Source PASS (sin manageProducts) · runtime **UNVERIFIED** |

## 16. Device/PWA

```txt
DEVICE QA UNVERIFIED
```

## 17. Riesgos

| Riesgo | Severidad | Notas |
|--------|-----------|-------|
| Cookie Max-Age/clear no visto en DevTools | P2 deuda QA | Source OK; falta sesión admin |
| Iframe no refresca tras vaciar | P2 | Conocida; fuera de esta fase |
| Touch-pan / device selector | P3 | Spec diferido |
| ESLint circular | P3 tooling | Preexistente |

## 18. Deuda residual

- **P2** Auth browser QA (shell, cookie DevTools 300s, clear al vaciar)
- **P2** Iframe refresh tras vaciar
- **P2/P3** Responsive admin matrix en sesión real
- **P3** Operator/viewer runtime
- **P3** Device/PWA
- **P3** Lint config circular

Sin P0/P1 de producto detectados en este re-QA.

## 19. Release readiness

Críticos de seguridad (pedido/carrito/CSP/guard/Max-Age source) PASS vía source + path público. Falta solo evidencia autenticada de cookie arm/clear y shell admin → **no** `READY FOR DEPLOY` estricto; sí listo con deuda no bloqueante de QA auth/device.

Recomendación operativa: deploy posible si el owner valida manualmente en 2–3 min cookie 300s + Vaciar limpia cookie; o mantener deuda y desplegar con smoke post-deploy autenticado.

Clasificación formal de esta fase: **READY WITH NON-BLOCKING QA DEBT**.

## 20. Rollback

N/A (docs-only). Rollback de feature = fases impl/cookie polish previas.

## 21. Próximo paso

```txt
ADMIN-CATALOG-PREVIEW-DEPLOY-1
```

Con checklist mínimo post-deploy autenticado: cookie Max-Age≈300, Vaciar limpia cookie, checkout preview bloqueado.
