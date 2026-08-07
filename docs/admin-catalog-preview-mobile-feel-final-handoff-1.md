# ADMIN-CATALOG-PREVIEW-MOBILE-FEEL-HANDOFF-1 — Final Handoff for Admin Catalog Preview Mobile Feel

## 1. Estado final

```txt
FEATURE CLOSED — DEPLOYED WITH ACCEPTED DEVICE QA DEBT
```

Sin P0/P1 abiertos.  
Device QA real queda como **P2 de cobertura aceptada** (evidencia, no fallo funcional confirmado).

Fecha de cierre documental: 2026-07-28  
Producción: https://orderops.vercel.app  
Ruta: `/admin/products/preview`

## 2. Resumen ejecutivo

* `/admin/products/preview` está en producción;
* iframe real del catálogo público (`/b/{slug}/catalogo?orderopsPreview=1`);
* carrito preview aislado (`orderops-preview-cart*` / `orderops-preview-cart-v2*`);
* checkout preview bloqueado UI + server (sin `create_order` / success);
* cookie preview `orderops-admin-catalog-preview` Max-Age **300s**;
* clear-cart con `postMessage` + ACK + remount fallback;
* mobile-feel desktop: cursor circular, pan, momentum, anti-selection (solo preview + mouse);
* shell premium: modo seguro, acciones, checklist, toasts;
* layout final con paridad `/admin/products` (operational 1600px);
* CSP `frame-ancestors 'self'`;
* sin DB/RLS/RPC nuevos en esta etapa;
* sin pedidos reales desde preview.

Decisión de cierre: se acepta explícitamente Android Chrome / PWA / iOS **UNVERIFIED** como deuda de cobertura. No hay bug productivo observado.

## 3. Objetivo de producto

```txt
Permitir que owner/manager revise el catálogo como lo verá un cliente en celular, desde el admin, con carrito de prueba y sin riesgo de crear pedidos reales.
```

Diferenciada de “Vista previa del cliente” (Product Customization sandbox).

## 4. Alcance entregado

```txt
Vista previa móvil del catálogo
Iframe same-origin
Carrito de prueba aislado
Checkout visible pero bloqueado
Copiar link catálogo público
Vaciar carrito de prueba
Cookie preview corta
CSP same-origin
Touch-pan desktop
Anti-selection
Cursor circular
Momentum vertical
Scrollbar sutil
Shell premium
Toasts
Checklist
Modo seguro activo
Layout dos columnas
Phone sticky
Paridad de ancho con Products
```

Fuera de scope (intencional): pedidos reales, success simulado, selector de dispositivos, botón Recargar, analytics, deep-link producto, sidebar item dedicado, device/PWA QA completo.

## 5. Arquitectura final

```txt
/admin/products
  → Vista previa del catálogo
    → /admin/products/preview
      → arma contexto preview server-side
      → set cookie preview 300s
      → iframe /b/{slug}/catalogo?orderopsPreview=1
        → catálogo usa cart scope preview
        → mobile-feel solo preview/mouse
        → checkout conserva orderopsPreview=1
        → checkout bloquea confirmación
```

Principios:

```txt
El iframe aporta fidelidad visual.
El aislamiento de carrito se logra con keys separadas.
La protección de pedidos se logra con UI guard + server guard.
```

Helpers: `lib/admin/catalog-preview.ts` (server) + `lib/admin/catalog-preview-shared.ts` (client-safe). Cookie arm/clear vía Server Actions en `preview/actions.ts`.

## 6. Rutas y navegación

| Superficie | Ruta |
|------------|------|
| Admin preview | `/admin/products/preview` |
| Catálogo preview iframe | `/b/[slug]/catalogo?orderopsPreview=1` |
| Checkout preview iframe | `/b/[slug]/checkout?orderopsPreview=1` |
| Catálogo público normal | `/b/[slug]/catalogo` |
| Checkout público normal | `/b/[slug]/checkout` |
| Success público | `/b/[slug]/success` |

```txt
Preview no debe navegar a success.
Top-level admin permanece en /admin/products/preview.
Iframe puede navegar dentro del flujo público preview.
```

## 7. Seguridad y tenant isolation

```txt
requireAdminPermission("manageProducts")
slug server-side (adminContext.businessSlug)
tenant match en acciones (cookie clear / businessId)
businessId validado en preview clear (postMessage + actions)
no query/client slug como fuente de verdad
```

* owner/manager: acceso previsto;
* operator/viewer runtime: no fue prioridad final (P3 opcional);
* no hay cross-tenant esperado;
* RLS/DB no fueron modificados por mobile-feel / shell / layout.

## 8. Preview context / cookie

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

Server usa cookie + helpers (`shouldBlockCatalogPreviewOrder`) para bloquear confirmación.

## 9. Carrito preview aislado

Keys públicas:

```txt
orderops-cart:{businessId}
orderops-cart-v2:{businessId}
```

Keys preview:

```txt
orderops-preview-cart:{businessId}
orderops-preview-cart-v2:{businessId}
```

```txt
Vaciar carrito limpia preview.
Public keys quedan intactas.
```

Confirmado en smoke desktop/prod (DEVICE-1 / layout deploy).

## 10. Checkout guard

UI:

```txt
- mensaje de bloqueo
- botón Confirmación deshabilitada
- sin success
```

Server:

```txt
- rechaza preview antes de create_order
- sin stock movement
- sin order insert
- sin success redirect
```

```txt
No se creó pedido desde preview en QA final.
No se llamó create_order desde preview de forma observable.
No se navegó a success desde preview.
```

## 11. CSP / framing

```txt
Content-Security-Policy: frame-ancestors 'self'
```

* permite iframe same-origin admin → público;
* bloquea framing externo;
* no usa `X-Frame-Options: DENY`;
* no usa `frame-ancestors *`.

Smoke headers PASS en catalogo / checkout / preview.

## 12. Mobile-feel UX

```txt
Touch-pan con mouse
Anti-selection
Anti ghost image drag
Cursor circular tipo touch
Momentum/inertia vertical
Scrollbar sutil
```

Contratos:

```txt
solo isCatalogPreview
solo pointerType === "mouse"
no público normal
no touch real
no checkout
no Product Customization preview
```

Hooks: `use-preview-pointer-pan-scroll.ts`, `use-preview-touch-cursor.ts` + modules CSS colindantes.

```txt
Touch real en hardware no verificado en DEVICE-1, pero el código sigue gated por mouse-only.
```

## 13. Shell premium UX

```txt
Modo seguro activo
Acciones jerarquizadas
Toast para copiar link
Toast para vaciar carrito
Checklist Qué podés probar
Copy claro de seguridad
Sin panel izquierdo premium
Sin estado de carrito en shell
Sin botón Recargar
Sin selector de dispositivos
```

Toasts vía `useAdminToast`.

## 14. Layout final

```txt
Paridad con /admin/products
Container operational 1600px
Header alineado con Products
Rail izquierdo max-width 560px
Phone centrado en derecha
Phone alineado con header
Frame/viewport alineados
Phone sticky desktop
Mobile una columna
Sin overflowX
```

Commits layout: `0dce5b3` (LAYOUT-FIX-2 + WIDTH-PARITY). Shell `max-width: none` para llenar page-container operational.

## 15. Clear cart iframe sync

```txt
Parent admin:
  → limpia preview storage/cookie
  → postMessage ORDEROPS_PREVIEW_CLEAR_CART
  → espera ACK
  → fallback remount si no llega ACK
  → toast success/error
Iframe CatalogClient:
  → escucha solo isCatalogPreview
  → valida origin
  → valida businessId
  → limpia estado interno del carrito
  → responde ORDEROPS_PREVIEW_CLEAR_CART_ACK
```

Constantes en `lib/admin/catalog-preview-shared.ts`.

```txt
Vaciar carrito refleja 0 en iframe.
Preview keys limpias.
Public keys intactas.
```

## 16. Archivos principales

### Admin shell

```txt
app/admin/(protected)/products/preview/page.tsx
app/admin/(protected)/products/preview/actions.ts
components/admin/products/catalog-preview-shell.tsx
components/admin/products/catalog-preview-shell.module.css
components/admin/products/products-header-actions.tsx
lib/admin/catalog-preview.ts
lib/admin/catalog-preview-shared.ts
```

### Public catalog / mobile-feel

```txt
components/public/catalog/catalog-client.tsx
components/public/catalog/use-preview-pointer-pan-scroll.ts
components/public/catalog/use-preview-touch-cursor.ts
components/public/catalog/catalog-preview-pan.module.css
components/public/catalog/catalog-preview-mobile-feel.module.css
components/public/catalog/category-nav.tsx
components/public/catalog/cart-bar.tsx
components/public/catalog/cart-sheet.tsx
components/public/catalog/product-detail-modal.tsx
components/public/catalog/customization-modal.tsx
lib/cart/local.ts
```

### Checkout / CSP

```txt
app/b/[slug]/catalogo/page.tsx
app/b/[slug]/checkout/page.tsx
app/b/[slug]/checkout/actions.ts
components/public/checkout/checkout-client.tsx
next.config.ts
```

### Docs (cadena completa)

```txt
audit
spec closure
impl safe
qa
cookie polish
re-qa
deploy
handoff (base V1)
touch-pan polish
touch-pan qa-fix
mobile-feel spec
mobile-feel polish
mobile-feel auth QA
mobile-feel deploy
shell premium polish
layout fix 1
layout fix 2
width parity
layout final deploy
final qa device
final handoff (este documento)
```

Nota working tree: `docs/admin-catalog-preview-mobile-feel-deploy-1.md` puede estar **dirty local** (nota menor no commiteada). La versión válida en repo quedó vía commit docs `311568b`. No se corrige en esta fase. `docs/admin-catalog-preview-final-qa-device-1.md` puede estar untracked local hasta un commit docs opcional futuro.

## 17. Commits y deploys

| Commit | Descripción |
|--------|-------------|
| `c4b3e18` | safe admin catalog preview |
| `84c0c48` | docs deploy / handoff base |
| `5843fd9` | mobile-feel + shell polish deploy |
| `311568b` | docs mobile-feel deploy smoke |
| `0dce5b3` | final layout polish deploy |
| `4dd5dce` | docs/current phase after layout deploy |

```txt
Deploy actual live: https://orderops.vercel.app
```

HEAD local docs al cierre de este handoff: `4dd5dce` (+ docs uncommitted de DEVICE-1 / este handoff).

## 18. QA consolidado

```txt
tsc PASS
build PASS en fases funcionales/deploy
lint FAIL preexistente
source QA PASS
headers/CSP PASS
admin iframe auth QA PASS
clear-cart PASS
checkout preview block PASS
public normal regression PASS
Product Customization / Settings PASS
layout production PASS
device real UNVERIFIED
```

Última fase: **ADMIN-CATALOG-PREVIEW-FINAL-QA-DEVICE-1** → `READY WITH DEVICE QA DEBT` (aceptada aquí como P2 cobertura).

## 19. Producción final

```txt
Deploy URL: https://orderops.vercel.app
Layout live: 0dce5b3
Mobile-feel live: 5843fd9
HEAD docs: 4dd5dce
Estado: FEATURE CLOSED — DEPLOYED WITH ACCEPTED DEVICE QA DEBT
```

Smoke final confirmado:

```txt
admin preview carga
clear-cart refleja 0
checkout preview bloqueado
público normal con Enviar pedido
CSP self
sin pedidos
```

## 20. Deuda residual aceptada

```txt
P2 — Android Chrome real touch QA
P2 — Android PWA standalone QA
P2 — iOS Safari / iOS PWA QA
P3 — Clipboard success toast en device/automation
P3 — Press feedback diferido
P3 — Momentum synthetic/automation flake
P3 — ESLint circular histórico
P3 — dirty local docs/tsbuildinfo si sigue presente
```

```txt
No hay P0/P1 abiertos.
```

## 21. Riesgos operativos

| Riesgo | Severidad | Estado |
|--------|----------:|--------|
| Device touch no probado | P2 | aceptado como cobertura |
| Preview crea pedido | P0 | mitigado UI + server guard |
| Carrito público contaminado | P1 | mitigado keys separadas |
| Clear cart no actualiza iframe | P2 | mitigado postMessage + ACK/fallback |
| CSP rompe iframe | P1 | smoke PASS |
| Cursor/momentum afecta público normal | P1 | gated preview/mouse |
| Cookie preview bloquea pedidos reales admin same-browser | P2 | mitigado Max-Age 300 + clear |

## 22. Runbook de soporte

### Owner dice “Vaciar carrito no funciona”

1. Verificar que está en `/admin/products/preview`.
2. Click en `Vaciar carrito de prueba`.
3. Esperar toast.
4. Confirmar que el iframe muestra `0 productos`.
5. Si no actualiza, recargar la página admin como fallback manual.
6. Revisar preview keys si hay DevTools.

### Owner dice “No puedo confirmar pedido desde preview”

```txt
Es correcto. La confirmación de pedidos está deshabilitada en la vista previa.
```

### Owner dice “No puedo hacer pedido real después de usar preview”

1. Usar `Vaciar carrito de prueba`.
2. Esperar hasta 5 minutos por cookie preview.
3. Abrir catálogo público normal sin `orderopsPreview=1`.
4. Confirmar botón `Enviar pedido`.
5. Revisar cookie `orderops-admin-catalog-preview` si persiste.

### Preview no carga

Revisar:

```txt
login admin
manageProducts
slug público
CSP
iframe /b/{slug}/catalogo
consola navegador
```

## 23. Rollback

### Rollback layout final

```bash
git revert 0dce5b3
git push origin main
```

### Rollback mobile-feel/shell polish

```bash
git revert 5843fd9
git push origin main
```

### Rollback preview V1 completa

```bash
git revert c4b3e18
git push origin main
```

```txt
Sin DB rollback.
Sin Supabase.
Sin borrar pedidos.
Sin tocar datos productivos.
```

Solo ejecutar revert/push con autorización explícita del PO.

## 24. Próximas fases opcionales

```txt
ADMIN-CATALOG-PREVIEW-FINAL-QA-DEVICE-2
```

Android Chrome real obligatorio; iOS/PWA deseable.

```txt
ADMIN-CATALOG-PREVIEW-PRESS-FEEDBACK-POLISH-1
```

Feedback táctil visual en cards/botones preview desktop.

```txt
ADMIN-CATALOG-PREVIEW-CLIPBOARD-TOAST-QA-1
```

Cerrar deuda clipboard success real.

```txt
ADMIN-CATALOG-PREVIEW-OPERATOR-PERMISSION-RUNTIME-QA-1
```

Validar runtime operator/viewer sin `manageProducts`.

Ninguna es obligatoria salvo que el PO exija cerrar device real antes de piloto.

## 25. Criterio de cierre

```txt
FEATURE CLOSED — DEPLOYED WITH ACCEPTED DEVICE QA DEBT
```

```txt
La feature está productivamente disponible para owner/manager.
No hay P0/P1 abiertos.
La deuda restante es de cobertura y polish menor.
```

Cadena cerrada: AUDIT → SPEC → IMPL-SAFE → QA → COOKIE → RE-QA → DEPLOY → HANDOFF-V1 → TOUCH-PAN → MOBILE-FEEL → SHELL → LAYOUT → DEVICE-QA → **MOBILE-FEEL-FINAL-HANDOFF**.
