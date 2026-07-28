# ADMIN-CATALOG-PREVIEW-QA-1 — Authenticated Browser QA & Release Readiness

## 1. Estado

```txt
READY AFTER COOKIE POLISH
```

## 2. Resumen ejecutivo

Source QA y headers PASS. Path público con `?orderopsPreview=1` confirma carrito aislado y checkout bloqueado (UI) sin pedidos. Admin autenticado (`/admin/products/preview` shell/CTA) **UNVERIFIED** — sin sesión/credenciales E2E en el entorno. Cookie preview 1h clasificada **P1** (afecta al admin en el mismo browser, no a customers anónimos). Recomendado polish de cookie antes de deploy.

## 3. Entorno

| Item | Valor |
|------|--------|
| Branch | `main` |
| HEAD | `01fe5a4` |
| Working tree | Sucio (impl SAFE-V1-1 uncommitted + docs/tmp preexistentes) |
| Server QA | `npx next start -p 3011` |
| Tenant smoke | `demohamburgueseria` · `businessId=e21b8fc2-3016-4dec-92ef-ebb04e58ecdf` |
| Auth admin | No disponible (`E2E_ADMIN_*` ausente) |

## 4. Preflight

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | PASS (0) |
| `npm run build` | PASS (0); ruta `ƒ /admin/products/preview` |
| `npm run lint` | FAIL (2) — ESLint circular **preexistente** |

## 5. Source QA

| Área | Resultado | Evidencia |
|------|-----------|-----------|
| A1 Ruta admin | PASS | `requireAdminPermission("manageProducts")`; slug server; empty shell; cookie arm via Server Action antes del iframe |
| A2 Preview context | PASS | Cookie httpOnly, value=`businessId`, path=`/b/{slug}`, maxAge=3600, secure en prod; query no es verdad única |
| A3 Carrito | PASS | Default `public`; preview keys `orderops-preview-cart*`; clear scoped |
| A4 Checkout guard | PASS | UI early-return + server `shouldBlockCatalogPreviewOrder` **antes** de accepting/validation/`create_order` |
| A5 CSP | PASS | `frame-ancestors 'self'` en `next.config.ts`; no DENY / no `*` |
| Sidebar nuevo | PASS (no hay) | Solo AdminShell estándar |
| RPC SQL | PASS (no tocado) | Guard solo en action |

Nota: “No sidebar” de producto = no item nuevo de nav; el AdminShell global sigue visible (esperado).

## 6. Browser QA autenticado

| Caso | Resultado |
|------|-----------|
| `/admin/products` CTA dual | **UNVERIFIED** — redirect `/admin/login` |
| `/admin/products/preview` shell/banner/iframe | **UNVERIFIED** — sin sesión |
| Iframe conteniendo catálogo | **UNVERIFIED** (iframe DOM inaccesible a automation + sin auth) |
| Copiar link / Vaciar carrito (admin chrome) | **UNVERIFIED** |

### Sustituto runtime (path público preview — autorizado por spec de storage/checkout)

URL: `/b/demohamburgueseria/catalogo?orderopsPreview=1`

| Check | Resultado |
|-------|-----------|
| Catálogo carga | PASS |
| Categorías/productos | PASS |
| Agregar Coca Cola | PASS |
| Cart bar “1 producto” | PASS |
| Checkout `?orderopsPreview=1` | PASS |
| Mensaje bloqueo | PASS |
| Botón “Confirmación deshabilitada” disabled | PASS |
| Success | No navegado |
| Pedido creado | No |

## 7. Storage QA

Business: `e21b8fc2-3016-4dec-92ef-ebb04e58ecdf`

Antes de agregar (preview page): preview keys `[]`; se sembró marker sintético en public keys.

Después de Agregar Coca en preview:

```txt
Preview keys cambian.  → orderops-preview-cart:{id} contiene Coca Cola 500ml
Public keys no cambian. → orderops-cart:{id} conservó marker PUBLIC_MARKER
```

Clear preview keys (manual CDP removeItem preview only): public intacto.

Checkout sin query preview: muestra carrito público (marker), botón **Enviar pedido** (no preview) — confirma que sin cookie/query no hay modo preview UI.

## 8. Checkout guard QA

```txt
No se creó pedido.
No se llamó create_order desde preview.
No se navegó a success.
```

UI: submit disabled + mensaje aprobado.  
Server: guard confirmado en source (cookie \|\| `isPreview`); no se forzó bypass RPC en prod.

## 9. Cookie debt analysis

### Reproducción empírica con cookie real

**UNVERIFIED** — requiere armar cookie vía admin login.

### Análisis SOURCE (CONFIRMED)

- Cookie `orderops-admin-catalog-preview` path=`/b/{slug}` maxAge=**3600**.
- `shouldBlockCatalogPreviewOrder` bloquea si cookie.value === businessId **aunque** no haya query preview.
- Impacto: el **mismo browser** del admin, tras usar preview, no puede completar `create_order` en `/b/{slug}/*` hasta expirar cookie.
- Customers anónimos **no** reciben esa cookie → **no P0 customer-facing**.

### Clasificación

```txt
P1 — debe corregirse antes de deploy
```

### Recomendación

**Opción A + C (híbrida):**

1. Reducir Max-Age a **300s** (o 600s).
2. Hacer que **Vaciar carrito de prueba** también limpie/expire la cookie preview (Server Action `clear`).
3. Opcional follow-up: botón “Salir de vista previa” (Opción B) en polish.

Fase: `ADMIN-CATALOG-PREVIEW-COOKIE-POLISH-1`

## 10. Responsive QA

Automation no emuló todos los viewports; evidencia código + viewport actual amplio.

| Viewport | Shell | Iframe | Modal | Cart | Checkout | Resultado |
|----------|-------|--------|-------|------|----------|-----------|
| 390 | Código: sin marco | fluido | UNVERIFIED auth iframe | PASS path público | PASS path público | PASS WITH DEBT |
| 414 | idem | fluido | UNVERIFIED | PASS | PASS | PASS WITH DEBT |
| 768 | marco teléfono (CSS ≥768) | 390px | UNVERIFIED | — | — | SOURCE PASS |
| 1024 | marco | 390px | UNVERIFIED | — | — | SOURCE PASS |
| 1440 | marco | 390px | UNVERIFIED | — | — | SOURCE PASS |

Sin `transform: scale()` en CSS preview.

## 11. Headers QA

Local `:3011`:

```txt
Content-Security-Policy: frame-ancestors 'self'
```

Presente en:

- `/b/demohamburgueseria/catalogo` 200
- `/b/demohamburgueseria/checkout` 200
- `/admin/products/preview` 307→login (header en redirect)

Prod headers: no re-sondeados en esta fase (impl doc previo sin XFO; CSP nuevo aún no deployado).

## 12. Regresión pública

| Ruta | Resultado |
|------|-----------|
| `/b/.../catalogo` | PASS carga |
| `/b/.../checkout` sin preview | PASS; sin mensaje preview; submit “Enviar pedido” |
| `/admin/products/customizations` | UNVERIFIED (login) — source: no tocado |
| `/admin/settings/public/catalogo` | UNVERIFIED (login) — source: no tocado |

## 13. Permisos

| Rol | Resultado |
|-----|-----------|
| Owner/manager | UNVERIFIED runtime; source gate `manageProducts` |
| Operator/viewer | UNVERIFIED |

## 14. Device/PWA QA

```txt
DEVICE QA UNVERIFIED
```

## 15. Riesgos encontrados

| ID | Sev | Hallazgo |
|----|-----|----------|
| Q1 | P1 | Cookie 1h bloquea pedidos reales del admin en mismo browser/path |
| Q2 | P2 | Vaciar carrito no refresca iframe (deuda conocida) |
| Q3 | P2 | Admin shell/CTA/iframe-in-admin no verificados sin credenciales |
| Q4 | P3 | Lint ESLint circular preexistente |

## 16. Deuda

1. **COOKIE-POLISH-1** (P1) — Max-Age + clear cookie
2. Browser QA admin autenticado (CTA/shell/iframe)
3. Permisos operator/viewer runtime
4. Device/PWA
5. Responsive matrix completa en iframes admin

## 17. Clasificación release readiness

```txt
READY AFTER COOKIE POLISH
```

Justificación: seguridad de pedidos/carrito validada en path preview; cookie debt P1 bloquea deploy limpio; falta QA admin autenticado (no bloquea clasificación cookie, pero debe hacerse en polish o deploy smoke).

## 18. Rollback

N/A docs-only. Rollback de feature = revert impl SAFE-V1-1.

## 19. Próximo paso

```txt
ADMIN-CATALOG-PREVIEW-COOKIE-POLISH-1
```

Luego: re-QA autenticado breve → `ADMIN-CATALOG-PREVIEW-DEPLOY-1`.
