# ADMIN-CATALOG-PREVIEW-HANDOFF-1 — Final Technical & Product Handoff

## 1. Estado final

```txt
DEPLOYED WITH NON-BLOCKING QA DEBT
FEATURE CLOSED — DEPLOYED WITH NON-BLOCKING QA DEBT
```

No hay P0/P1 abiertos. La feature está productivamente disponible para owner/manager.

Cadena de fases: AUDIT → SPEC-CLOSURE → IMPL-SAFE-V1 → QA → COOKIE-POLISH → RE-QA → DEPLOY → **HANDOFF**.

## 2. Resumen ejecutivo

Vista previa del catálogo desplegada en producción (`c4b3e18` → `main` → https://orderops.vercel.app):

* ruta `/admin/products/preview`;
* iframe same-origin del catálogo real;
* carrito preview aislado (`orderops-preview-cart*`);
* checkout preview bloqueado UI + server (sin `create_order`);
* cookie preview Max-Age **300s** + clear al vaciar;
* CSP `frame-ancestors 'self'`;
* CTA dual en Productos;
* sin DB / RLS / RPC SQL;
* sin pedidos reales creados en QA/smoke.

## 3. Objetivo de producto

```txt
Permitir que owner/manager vea y pruebe la experiencia móvil real del catálogo desde el admin, sin DevTools y sin riesgo de crear pedidos reales.
```

Diferenciada de “Vista previa del cliente” (Product Customization sandbox).

## 4. Alcance V1

### Dentro de scope

```txt
Vista previa móvil del catálogo
Iframe real del catálogo público
Carrito de prueba aislado
Checkout visible sin confirmación
Copiar link catálogo público
Vaciar carrito de prueba
CSP same-origin
```

### Fuera de scope

```txt
Pedidos reales desde preview
Success simulado
Recargar iframe
Touch Pan
Selector de dispositivos
Analytics
Deep-link producto
Sidebar item
Device/PWA full QA
```

## 5. Arquitectura implementada

```txt
/admin/products
  → Vista previa del catálogo
    → /admin/products/preview
      → arma contexto preview server-side (cookie httpOnly)
      → iframe /b/{slug}/catalogo?orderopsPreview=1
        → catálogo usa cart scope preview
        → checkout conserva orderopsPreview=1
        → checkout bloquea confirmación (UI + server)
```

Principios:

```txt
El iframe da fidelidad visual, no aislamiento total de datos.
El aislamiento de carrito se logra por keys separadas.
El bloqueo de pedidos se logra por UI + server guard.
```

Helpers: `lib/admin/catalog-preview.ts` (server) + `catalog-preview-shared.ts` (client-safe constants). Cookie arm/clear vía Server Actions en `preview/actions.ts` (Next no setea cookies desde RSC).

## 6. Rutas y navegación

| Superficie | Ruta |
|------------|------|
| Admin preview | `/admin/products/preview` |
| Catálogo público | `/b/[slug]/catalogo` |
| Checkout público | `/b/[slug]/checkout` |
| Success público | `/b/[slug]/success` |

```txt
Preview no debe llegar a success.
Top-level admin permanece bajo /admin/products/preview.
Iframe navega dentro del flujo público.
```

Query preview: `?orderopsPreview=1`.

## 7. Permisos y tenant isolation

```txt
requireAdminPermission("manageProducts")
```

* owner/manager: acceso (source);
* operator/viewer: sin `manageProducts` (source); runtime P3 UNVERIFIED;
* slug desde `adminContext.businessSlug` (server-side);
* slug no es verdad desde query/input client;
* `clearCatalogPreviewCookieAction` exige match de `businessId` + slug con contexto (`tenant_mismatch` si no).

Empty state si el negocio no tiene slug público.

## 8. Preview context y cookie

```txt
Cookie: orderops-admin-catalog-preview
Value: businessId
Path: /b/{slug}
Max-Age: 300
HttpOnly: true
SameSite: Lax
Secure: production
```

```txt
?orderopsPreview=1 es indicador UX/storage.
No es la única fuente de verdad server-side.
```

* Max-Age bajó de **3600 → 300** para reducir bloqueo de pedidos reales del admin en el mismo browser/path.
* **Vaciar carrito de prueba** limpia keys preview **y** expira la cookie (mismo path, `maxAge: 0`).
* Deuda: DevTools prod autenticado (Max-Age + clear) **UNVERIFIED**.

## 9. Carrito aislado

Públicas (intactas por defecto):

```txt
orderops-cart:{businessId}
orderops-cart-v2:{businessId}
```

Preview:

```txt
orderops-preview-cart:{businessId}
orderops-preview-cart-v2:{businessId}
```

* default helper scope = `public`;
* preview usa scope explícito `"preview"`;
* vaciar limpia solo preview;
* public keys no se tocan.

## 10. Checkout guard

**UI preview:**

* mensaje de bloqueo;
* botón disabled / no enviable (“Confirmación deshabilitada”);
* early return en submit;
* no success.

**Server (`createPublicCheckoutOrderAction`):**

* `shouldBlockCatalogPreviewOrder` (cookie match **o** `isPreview===true`) **antes** de accepting / validation / `create_order`;
* no stock / ledger / success por este camino.

Mensaje:

```txt
La confirmación de pedidos está deshabilitada en la vista previa del catálogo.
```

Confirmado en smoke:

```txt
No se creó pedido.
No se llamó create_order desde preview.
No se navegó a success.
```

RPC SQL de `create_order` no se modificó.

## 11. CSP / framing

```txt
Content-Security-Policy: frame-ancestors 'self'
```

* permite `/admin` embeber `/b/[slug]` (same-origin);
* evita framing por terceros;
* no `X-Frame-Options: DENY`;
* no `frame-ancestors *`.

Fuente: `next.config.ts`. Verificado local y producción.

## 12. CTA de Productos

```txt
Antes: Ver catálogo
Después:
- Vista previa del catálogo → /admin/products/preview
- Copiar link catálogo público → /b/{slug}/catalogo
```

* Settings / Presence links: no modificados;
* Product Customization preview: no tocada;
* sin item nuevo en sidebar.

## 13. UX de la preview

* título: **Vista previa del catálogo**;
* banner aprobado;
* marco teléfono en desktop/tablet (≥768);
* fluido sin marco pesado en mobile admin (&lt;768);
* sin botón Recargar;
* sin selector de dispositivo;
* sin touch-pan;
* **Vaciar carrito de prueba**;
* **Copiar link catálogo público**.

Banner:

```txt
Estás viendo una vista previa móvil del catálogo. Podés probar productos, opciones y carrito de prueba. La confirmación de pedidos está deshabilitada en este modo.
```

## 14. Archivos creados

### Código

```txt
app/admin/(protected)/products/preview/page.tsx
app/admin/(protected)/products/preview/actions.ts
components/admin/products/catalog-preview-shell.tsx
components/admin/products/catalog-preview-shell.module.css
lib/admin/catalog-preview.ts
lib/admin/catalog-preview-shared.ts
```

### Docs (cadena)

```txt
docs/admin-catalog-preview-audit-1-forensic-architecture.md
docs/admin-catalog-preview-spec-closure-1.md
docs/admin-catalog-preview-impl-safe-v1-1.md
docs/admin-catalog-preview-qa-1.md
docs/admin-catalog-preview-cookie-polish-1.md
docs/admin-catalog-preview-re-qa-1.md
docs/admin-catalog-preview-deploy-1.md
docs/admin-catalog-preview-handoff-1.md
```

## 15. Archivos modificados

```txt
components/admin/products/products-header-actions.tsx
lib/cart/local.ts
components/public/catalog/catalog-client.tsx
components/public/catalog/public-catalog-page.tsx
app/b/[slug]/catalogo/page.tsx
app/b/[slug]/checkout/page.tsx
app/b/[slug]/checkout/actions.ts
components/public/checkout/checkout-client.tsx
next.config.ts
docs/CURRENT_PHASE.md
ORDEROPS_LIVING_MEMORY.md
```

## 16. Qué NO se tocó

```txt
No DB
No RLS
No RPC SQL
No Product Customization preview
No Settings / Presence links fuera de scope
No Realtime orders
No PWA manifest/SW
No sidebar
No recargar
No device selector
No pedidos reales
```

## 17. QA ejecutado

```txt
tsc PASS
build PASS
lint FAIL preexistente
source QA PASS
headers QA PASS
public runtime preview PASS
checkout preview block PASS
public regression PASS
admin auth QA UNVERIFIED
device/PWA UNVERIFIED
```

## 18. Smoke producción

```txt
Deploy URL: https://orderops.vercel.app
Commit feature: c4b3e18
Commit docs deploy: 84c0c48
Estado: DEPLOYED WITH NON-BLOCKING QA DEBT
```

```txt
CSP presente
Preview public path cambia preview keys
Public keys no cambian
Checkout preview bloqueado
Checkout normal muestra Enviar pedido
Sin pedidos enviados
```

## 19. Deuda residual

```txt
P2 — Auth browser cookie DevTools + Vaciar clear en prod
P2 — Iframe no refresca tras vaciar
P2/P3 — Responsive admin matrix real
P3 — Operator/viewer runtime
P3 — Device/PWA
P3 — Lint circular preexistente
```

```txt
Sin P0/P1 abiertos.
```

## 20. Riesgos aceptados

* admin auth / cookie DevTools no verificado por falta de sesión E2E;
* iframe refresh tras vaciar queda como P2 UX;
* touch-pan fuera de V1;
* Device/PWA real pendiente;
* customers anónimos no reciben cookie preview;
* pedidos reales desde preview bloqueados por UI + server.

## 21. Rollback

```bash
git revert c4b3e18
git push origin main
```

Docs deploy/handoff (opcional):

```bash
git revert 84c0c48
# + revert handoff docs commit si aplica
```

```txt
Sin DB rollback.
Sin migraciones.
Sin Supabase.
Sin borrar pedidos.
Sin tocar datos productivos.
```

Post-rollback: preview CTA/ruta al estado previo; catálogo y checkout públicos normales; Productos sin CTA preview.

## 22. Runbook de soporte

### Si un owner dice “no puedo hacer un pedido real después de usar preview”

1. Usar **Vaciar carrito de prueba**.
2. Esperar hasta ~5 minutos si aún persiste (TTL cookie 300s).
3. Abrir catálogo público normal (sin `orderopsPreview`).
4. Verificar que checkout muestra **Enviar pedido**.
5. Si sigue bloqueado: DevTools → cookie `orderops-admin-catalog-preview` (path `/b/{slug}`).

### Si la preview no carga

1. Login admin.
2. Permiso `manageProducts`.
3. Slug público configurado.
4. CSP `frame-ancestors 'self'`.
5. Iframe `/b/{slug}/catalogo?orderopsPreview=1`.
6. Consola del navegador.

### Si el carrito público parece contaminado

Revisar keys:

```txt
orderops-cart:{businessId}
orderops-cart-v2:{businessId}
orderops-preview-cart:{businessId}
orderops-preview-cart-v2:{businessId}
```

Preview no debe escribir en keys públicas.

## 23. Próximas fases opcionales

| Fase | Propósito |
|------|-----------|
| `ADMIN-CATALOG-PREVIEW-TOUCH-PAN-POLISH-1` | Simular scroll táctil con mouse en preview desktop |
| `ADMIN-CATALOG-PREVIEW-AUTH-SMOKE-1` | Sesión real: cookie DevTools + vaciar clear + permisos |
| `ADMIN-CATALOG-PREVIEW-RESPONSIVE-POLISH-1` | Matriz responsive admin si aparecen issues |
| `ADMIN-CATALOG-PREVIEW-FINAL-QA-DEVICE-1` | Android/iOS/PWA standalone |

Ninguna es obligatoria salvo P0/P1 nuevo.

## 24. Criterio de cierre

```txt
FEATURE CLOSED — DEPLOYED WITH NON-BLOCKING QA DEBT
```

```txt
La feature puede considerarse productivamente disponible para owner/manager, con smoke público seguro y sin evidencia de regresión crítica.
```
