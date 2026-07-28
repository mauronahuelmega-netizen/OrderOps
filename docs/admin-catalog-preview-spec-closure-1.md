# ADMIN-CATALOG-PREVIEW-SPEC-CLOSURE-1 — Product & Technical Spec Closure

## 1. Estado

```txt
PRODUCT SPEC DECISIONS CLOSED
TECHNICAL CONTRACTS FROZEN FOR V1
READY FOR IMPLEMENTATION ROADMAP
```

**No es fase de implementación.** Este documento congela decisiones de producto aprobadas y contratos técnicos derivados del audit `ADMIN-CATALOG-PREVIEW-AUDIT-1`.

**Fuente de producto:** decisiones P0/P1/A* aprobadas por Product Owner (2026-07-27).  
**Fuente técnica:** `docs/admin-catalog-preview-audit-1-forensic-architecture.md`.

---

## 2. Objetivo de producto V1

Permitir que un administrador con `manageProducts` pruebe la experiencia móvil real del catálogo público **dentro del admin**, sin DevTools:

- recorrer catálogo;
- abrir productos;
- personalizar opciones / extras / plus sugeridos;
- usar un **carrito de prueba aislado**;
- abrir visualmente el checkout.

**Prohibido en V1:**

- confirmar pedidos reales;
- mutar carrito público (`orderops-cart*` / `orderops-cart-v2*`);
- confiar slug enviado por cliente;
- preview cross-tenant;
- confundir con “Vista previa del cliente” (Product Customization);
- llegar a `/success`;
- sidebar nuevo, selector de dispositivos, recargar, auto-refresh, postMessage.

---

## 3. Nombre y diferenciación

| Superficie | Nombre UI |
|------------|-----------|
| Esta feature | **Vista previa del catálogo** |
| Product Customization sandbox | **Vista previa del cliente** (sin cambio) |

Microcopy de advertencia (P1-5), obligatorio en la pantalla admin:

```txt
Estás viendo una vista previa móvil del catálogo. Podés probar productos, opciones y carrito de prueba. La confirmación de pedidos está deshabilitada en este modo.
```

Sin slug (P1-6):

```txt
Tu negocio todavía no tiene una dirección pública configurada.
Configurala antes de abrir la vista previa del catálogo.
```

En ese caso: **no renderizar iframe**.

---

## 4. Decisiones P0 — congeladas

| ID | Decisión | Contrato |
|----|----------|----------|
| P0-1 | Sin pedidos reales | Checkout visible; confirmación bloqueada **UI + server-side** |
| P0-2 | Carrito aislado | Keys preview; no tocar keys públicas |
| P0-3 | `manageProducts` | `requireAdminPermission("manageProducts")` |
| P0-4 | Vive en Productos | Ruta `/admin/products/preview` |
| P0-5 | Dual CTA Productos | Primary: Vista previa → preview; Secondary: Copiar link público |
| P0-6 | Framing same-origin | `Content-Security-Policy: frame-ancestors 'self'` (no `DENY`, no `*`) |

---

## 5. Decisiones P1 — congeladas

| ID | Decisión |
|----|----------|
| P1-1 | Marco teléfono en desktop/tablet grande; viewport fluido sin marco en mobile admin |
| P1-2 | **Sin** botón Recargar / auto-refresh / postMessage / polling |
| P1-3 | Acción **Vaciar carrito de prueba** (solo keys preview) |
| P1-4 | **Sin** “Abrir catálogo público”; sí **Copiar link catálogo público** |
| P1-5 | Copy de advertencia aprobado (§3) |
| P1-6 | Copy sin slug + no iframe |
| P1-7 | Nombre **Vista previa del catálogo** |
| P1-8 | No success; no success simulado |
| P1-9 | Respetar tema público (`orderops-public-theme`); no forzar desde admin |
| P1-10 | Links externos (WA/IG/Maps) comportamiento real; documentar escape del iframe |

---

## 6. P2 / fuera de V1

```txt
Selector de dispositivos
Rotación landscape
Tablet/Desktop preview dedicada
postMessage
Realtime preview sync
Auto-refresh
Deep-link a producto
Analytics de preview
Sidebar item nuevo
Feature flag (salvo blast radius reportado en implementación)
Help center / tour / onboarding largo
Success simulado
```

---

## 7. Arquitectura V1 aprobada

```txt
Opción: iframe same-origin del catálogo real
  + carrito aislado
  + preview mode verificable server-side
  + bloqueo de createPublicCheckoutOrderAction en preview
  + CSP frame-ancestors 'self'
  + shell admin en /admin/products/preview
```

Equivalente audit: **híbrido E / B con guards**, no A naive.

### Flujo

```txt
Admin (manageProducts)
  → /admin/products/preview
    → resuelve slug server-side desde businessId
    → establece contexto preview verificable (cookie/token/sesión — ver §9)
    → iframe src = /b/{slug}/catalogo?...(indicador client-visible opcional)
      → browse / customize / preview-cart
      → /b/{slug}/checkout (visual)
      → submit bloqueado (UI + server)
      ✗ no /success
      → externos _blank pueden salir del iframe (aceptado)
```

---

## 8. Rutas y permisos

| Ruta | Rol | Gate |
|------|-----|------|
| `/admin/products/preview` | Nueva (protegida) | `(protected)` + `requireAdminPermission("manageProducts")` |
| iframe `/b/[slug]/catalogo` | Pública existente | slug **inyectado solo por server** desde admin context |
| iframe puede navegar a `/b/[slug]/checkout` | Pública existente | preview mode activo |
| `/b/[slug]/success` | No objetivo V1 | No debe alcanzarse desde preview (no pedido) |

**Slug:**

- Fuente de verdad: `requireAdminContext()` / `businessId` → slug canónico server-side.
- `businessSlug == null` → empty state P1-6; sin iframe.
- **Prohibido:** `?slug=` o input editable como fuente de verdad.

**Sidebar:** no nuevo item (A3). Acceso desde header/acciones de Productos.

---

## 9. Preview mode — contrato de verdad server-side (A1)

### Regla

```txt
Un indicador client-visible (query/header/data-attr) PUEDE existir para UX/cart keys.
NO puede ser la única fuente de verdad para autorizar o bloquear create_order.
```

### Requisitos

1. El shell `/admin/products/preview` (server) establece un **contexto preview** verificable en el servidor (preferido: cookie httpOnly same-site scoped al origin, o token firmado de corta vida atado a `businessId` + session admin).
2. `createPublicCheckoutOrderAction` (y cualquier path a `create_order`) debe **rechazar** si detecta preview context válido **o** si el request carece de prueba de “modo cliente real” cuando se exige — diseño concreto en implementación, pero el rechazo debe ser server-side.
3. Query `?preview=1` solo **no basta**.
4. El indicador client-visible sirve para: elegir keys de carrito preview, UI de checkout disabled, copy.

### Blast radius note (A5)

Tocar `createPublicCheckoutOrderAction` es blast radius **acotado y esperado**.  
Tocar `lib/cart/local.ts` + callers públicos para keys preview es blast radius **medio** (catálogo/checkout públicos deben seguir usando keys actuales cuando NO hay preview).

**Feature flag:** no requerida si se cumplen las condiciones A5 del PO. Si la implementación detecta acoplamiento inaceptable (p. ej. reescritura amplia de checkout/RPC), reportar y proponer flag o fase intermedia — **no improvisar flag sin evidencia**.

---

## 10. Carrito aislado — contrato (P0-2, P1-3)

### Keys públicas (NO tocar en preview)

```txt
orderops-cart:{businessId}
orderops-cart-v2:{businessId}
```

### Keys preview (obligatorias)

```txt
orderops-preview-cart:{businessId}
orderops-preview-cart-v2:{businessId}
```

### Comportamiento

| Acción | Preview | Público |
|--------|---------|---------|
| load/persist cart | solo keys preview | solo keys públicas |
| Vaciar carrito de prueba | borra solo preview keys del `businessId` | n/a |
| Success cleanup | n/a (no success) | sigue limpiando keys públicas |

### Tema

`orderops-public-theme` puede compartirse (P1-9 acepta tema público actual). No crear tema preview separado en V1.

---

## 11. Checkout y anti-pedido — contrato (P0-1, P1-8)

| Capa | Requisito V1 |
|------|----------------|
| UI checkout | Confirmación deshabilitada / no enviable + mensaje coherente con advertencia |
| Server action | Rechazar creación de pedido en preview mode (error claro, no ok:true) |
| RPC `create_order` | Preferible no modificar firma en V1 si el guard en action es suficiente |
| Success | No navegar; no simular |
| Stock / ledger | No deben mutarse desde preview |

Mensaje de error sugerido (implementación puede ajustar copy):

```txt
La confirmación de pedidos está deshabilitada en la vista previa del catálogo.
```

---

## 12. Framing / CSP — contrato (P0-6)

Objetivo:

```txt
Content-Security-Policy: frame-ancestors 'self';
```

| Permitido | Prohibido |
|-----------|-----------|
| Admin same-origin embebe `/b/...` | Framing por terceros |
| — | `frame-ancestors *` |
| — | `X-Frame-Options: DENY` |

Notas de implementación:

- Aplicar de forma que **no rompa** el iframe admin→catálogo.
- Evaluar superficie (`next.config` `headers`, middleware, o ambos) en la fase de implementación; preferir cambio mínimo global consistente.
- No relajar CSP de scripts en esta feature.

---

## 13. Shell admin UI — contrato

### Ruta

`/admin/products/preview`

### Elementos V1

1. Título: **Vista previa del catálogo**
2. Banner P1-5
3. Contenedor iframe (marco teléfono desktop/tablet; fluido mobile)
4. `iframe` con `title` accesible (ej. “Vista previa del catálogo”)
5. Acción **Vaciar carrito de prueba**
6. Acción **Copiar link catálogo público** (clipboard de URL absoluta o path canónico `/b/{slug}/catalogo`)
7. Empty state sin slug (P1-6)

### No incluir V1

- Recargar vista
- Abrir en pestaña (como CTA Productos)
- Selector device
- URL editable
- Sidebar entry

### CTA Productos (`products-header-actions.tsx`)

| Acción | Destino / comportamiento |
|--------|--------------------------|
| **Vista previa del catálogo** (principal) | `/admin/products/preview` |
| **Copiar link catálogo público** (secundaria) | clipboard `/b/{slug}/catalogo` |
| CTA legacy “Ver catálogo” same-tab | **Reemplazar** por el dual anterior |

Settings / presence `_blank` links: **fuera de scope V1** (no cambiar).

---

## 14. Accesibilidad mínima V1

- `iframe` con `title` descriptivo.
- Mantener alternativa implícita: “Copiar link catálogo público” (no abre pestaña, pero permite salida).
- No empeorar focus traps públicos existentes (deuda conocida del audit; no scope de fix amplio).
- Light/dark: respetar tema público.

---

## 15. PWA admin

- Top-level permanece en `/admin/products/preview` → scope `/admin` preservado.
- Links externos desde iframe pueden abrir browser chrome (P1-10 aceptado).
- No cambiar manifest/SW en esta feature.

---

## 16. Invariantes de no regresión

No romper:

```txt
Catálogo público real
Checkout público real (fuera de preview)
Success público real
Carrito público real (keys orderops-cart*)
Product Customization admin preview (“Vista previa del cliente”)
Product Customization public modal
Pricing server-side / order-validation
create_order productivo (clientes reales)
Stock / ledger / restock
RLS
Realtime orders
Admin PWA scope /admin
Settings public presence links (_blank)
```

---

## 17. Criterios de aceptación V1

### Felices

1. Owner/manager abre `/admin/products/preview` y ve iframe del catálogo propio.
2. Puede personalizar y llenar carrito de **prueba**.
3. Keys públicas de carrito no cambian al usar preview (verificable en DevTools).
4. Checkout se abre visualmente; submit no crea pedido; action server rechaza.
5. No hay navegación a success.
6. “Vaciar carrito de prueba” limpia solo preview keys.
7. “Copiar link catálogo público” copia URL correcta.
8. Sin slug: empty state, sin iframe.
9. Operator/viewer no acceden a la ruta.
10. Headers incluyen `frame-ancestors 'self'` (o equivalente CSP) sin romper iframe.
11. Customization “Vista previa del cliente” intacta.
12. Catálogo/checkout público siguen creando pedidos reales fuera de preview.

### Negativos

1. Query `?preview=1` forjada sin contexto server **no** habilita create_order.
2. Slug ajeno en URL no puede forzar preview de otro tenant desde admin shell.
3. “Vaciar carrito de prueba” no borra `orderops-cart*`.

---

## 18. Blast radius de implementación (candidatos)

### Probablemente necesarios

| Área | Archivos candidatos | Notas |
|------|---------------------|-------|
| Ruta admin | `app/admin/(protected)/products/preview/page.tsx` (+ loading opcional) | Nueva |
| Shell UI | `components/admin/products/catalog-preview-*.tsx` + `.module.css` | Nueva |
| CTA Productos | `components/admin/products/products-header-actions.tsx` | Dual CTA |
| Preview context | `lib/admin/catalog-preview-*.ts` (nuevo) | Cookie/token set/verify |
| Cart keys | `lib/cart/local.ts` (+ callers catalog/checkout) | Branch preview vs public |
| Checkout UI | `components/public/checkout/checkout-client.tsx` | Disable submit in preview |
| Checkout action | `app/b/[slug]/checkout/actions.ts` | Server reject |
| Headers | `next.config.ts` y/o `middleware.ts` | CSP frame-ancestors |
| Docs | CURRENT_PHASE, LIVING_MEMORY, doc de fase impl | |

### Condicionales

- Indicador client-visible en layout/páginas `/b/[slug]/*` (mínimo).
- Tests/helpers de storage preview.

### No tocar salvo justificación explícita

- RPC `create_order` SQL / migrations / RLS
- Realtime orders
- Product customization admin mapper
- Settings presence CTAs
- PWA manifest/icons
- `public/sw.js`

---

## 19. Estrategia de QA (para fase de implementación)

### Sin mutación productiva

- Load preview, browse, open modal, customize UI, open checkout, assert submit blocked.
- Assert headers CSP.
- Assert top-level URL under `/admin`.
- Assert copy link clipboard.
- Empty slug path.
- Permission deny for operator (si fixture disponible).

### Mutación storage controlada

- Add to preview cart; verify preview keys only.
- Clear preview cart; verify public keys untouched.
- **No** create orders.

### Pedido real

```txt
REQUIRES EXPLICIT AUTHORIZATION
```

Solo para verificar que el path **público** sigue creando pedidos (regresión), no desde preview.

---

## 20. Riesgos residuales aceptados en V1

| Riesgo | Postura |
|--------|---------|
| Same-origin iframe puede acceder a parent DOM | Aceptado con CSP frame-ancestors; no sandbox agresivo en V1 |
| Tema público compartido | Aceptado (P1-9) |
| Externos salen del iframe / PWA | Aceptado (P1-10) |
| Sin botón recargar | Aceptado (P1-2) |
| Deuda a11y modales públicos | Diferida |
| Clickjacking mitigado solo con frame-ancestors | Suficiente para contrato P0-6; no política CSP completa |

---

## 21. Roadmap de fases posteriores (no iniciar automáticamente)

Orden sugerido tras este cierre:

1. **ADMIN-CATALOG-PREVIEW-IMPL-FOUNDATION-1** — ruta admin + shell + CTA + slug gate + CSP  
2. **ADMIN-CATALOG-PREVIEW-IMPL-ISOLATED-CART-1** — keys preview + vaciar  
3. **ADMIN-CATALOG-PREVIEW-IMPL-CHECKOUT-GUARD-1** — UI + server reject + no success  
4. **ADMIN-CATALOG-PREVIEW-QA-1** — matriz aceptación §17  

La implementación puede fusionar 1–3 en una sola fase si el blast radius se mantiene acotado; debe reportar el plan antes de mutar checkout/cart.

---

## 22. Rollback de esta fase (SPEC-CLOSURE)

Solo documentación:

- `docs/admin-catalog-preview-spec-closure-1.md`
- registros en `docs/CURRENT_PHASE.md`
- `ORDEROPS_LIVING_MEMORY.md`

Sin código. Sin DB. Sin deploy.

---

## 23. Clasificación final

```txt
PRODUCT SPEC DECISIONS CLOSED
READY FOR IMPLEMENTATION
```

**Condición:** cualquier implementación debe respetar §4–§17 íntegramente.  
**Próximo paso:** fase de implementación (nombre a definir por el usuario; sugerido §21).  
**No iniciar implementación automáticamente.**
