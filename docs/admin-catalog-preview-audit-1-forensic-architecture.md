# ADMIN-CATALOG-PREVIEW-AUDIT-1 — Forensic Architecture & Product Audit

## 1. Resumen ejecutivo

La hipótesis de embeber el catálogo público real (`/b/[slug]/catalogo`) en un iframe mobile-first dentro del admin es **técnicamente viable same-origin**, pero **no es un sandbox**. Confirmado en código y runtime: no hay `preview_mode`, el checkout invoca `create_order` real, el carrito vive en `localStorage` keyed por `businessId` (compartido entre iframe y pestaña top-level same-origin), y no existen headers `X-Frame-Options` / CSP `frame-ancestors` en repo ni en producción.

La auth admin es por layout `(protected)` + permisos, no por middleware. El slug admin proviene de `profiles → businesses.slug` y puede ser `null`. Existen CTAs “Ver catálogo” con intenciones distintas (inspección vs apertura pública). La preview de Product Customization es un sandbox in-admin sin carrito; no debe confundirse con esta feature.

**Estado:** `READY WITH TECHNICAL CONDITIONS`  
**Viabilidad iframe:** `VIABLE WITH CONDITIONS`  
**Próximo paso:** `ADMIN-CATALOG-PREVIEW-SPEC-CLOSURE-1` tras decisiones P0 del Product Owner.

## 2. Objetivo y alcance

Auditar forensemente la futura “Vista previa móvil del catálogo público para administradores”, sin implementar rutas, iframe, flags, headers, ni cambios de catálogo/carrito/checkout.

**Incluye:** arquitectura real, viabilidad iframe, side-effects, CTA, storage, pedidos, CSP/headers, PWA, a11y, seguridad, alternativas, blast radius, QA segura, cuestionario PO.

**Excluye:** implementación, commits, push, deploy, migraciones, mutaciones de datos, pedidos QA.

## 3. Metodología y fuentes de evidencia

Clasificación de hallazgos:

| Tag | Significado |
|-----|-------------|
| `CONFIRMED — SOURCE` | Código citado |
| `CONFIRMED — RUNTIME` | HTTP/browser observado |
| `INFERRED` | Conclusión derivada |
| `UNVERIFIED` | No medible en este audit |
| `CONTRADICTED` | Hipótesis vs evidencia |

**Fuentes:** App Router `app/admin/**`, `app/b/**`, `components/admin/**`, `components/public/**`, `lib/admin/**`, `lib/cart/**`, `lib/business/**`, middleware, `next.config.ts`, docs PWA/customization, HEAD HTTP local+prod.

**Prioridad:** código + runtime > docs históricas.

## 4. Preflight del repositorio

| Item | Resultado |
|------|-----------|
| Branch | `main` |
| HEAD | `01fe5a4` |
| Working tree | Sucio: `M next-env.d.ts`, `M tsconfig.tsbuildinfo`; muchos `docs/*` y `tmp/` untracked preexistentes |
| Acción sobre tree | Continuar solo docs; no revert/stash |
| `npx tsc --noEmit` | **PASS** (exit 0) |
| `npm run build` | **PASS** (exit 0); ruta `ƒ /admin/manifest.webmanifest` presente |
| `npm run lint` | Script existe (`eslint .`); **FAIL preexistente** exit 2 — circular JSON en config ESLint; no atribuible a esta fase |

## 5. Mapa de rutas

### Rutas confirmadas (`CONFIRMED — SOURCE`)

| URL | Archivo | Layouts | Gate |
|-----|---------|---------|------|
| `/admin` | `app/admin/page.tsx` | `app/admin/layout.tsx` (PWA meta) | Redirect sesión → dashboard/login |
| `/admin/login` | `app/admin/login/page.tsx` | fuera de `(protected)` | Redirect away si ya admin |
| `/admin/dashboard`, products, settings… | `app/admin/(protected)/**` | `(protected)/layout.tsx` | `requireAdminContext()` |
| `/admin/products` | `…/products/page.tsx` | `(protected)` | `requireAdminPermission("manageProducts")` |
| `/b/[slug]` | `app/b/[slug]/page.tsx` | `app/b/layout.tsx` → `[slug]/layout.tsx` | Público; landing |
| `/b/[slug]/catalogo` | `…/catalogo/page.tsx` | idem | Público — **entry catálogo** |
| `/b/[slug]/checkout` | `…/checkout/page.tsx` | idem | Público |
| `/b/[slug]/success` | `…/success/page.tsx` | idem | Público |

**Quirk:** el default export de `app/b/[slug]/page.tsx` se llama `PublicCatalogPage` pero renderiza landing; el catálogo real es `/catalogo`.

### Navegación pública relevante

| Desde | Mecanismo | Hacia |
|-------|-----------|-------|
| Landing / header | `Link` | `/b/{slug}/catalogo` |
| `CatalogClient` | `router.push` | `/b/{slug}/checkout` |
| `CheckoutClient` | `router.push` | `/b/{slug}/success?order_id=…` |
| Success WhatsApp | `target="_blank"` | `wa.me/…` |
| Header Instagram/WhatsApp | `target="_blank"` | externos |

### Frame escape surfaces

| Pattern | Resultado |
|---------|-----------|
| `target="_top"` / `_parent` | **Ausente** |
| `window.top` / `window.parent` / `top.location` | **Ausente** |
| `<base target>` | **Ausente** |
| `target="_blank"` | Presente (CTAs admin presencia, WhatsApp, redes) |
| `window.open` en admin | **Ausente** |

### Diagrama de flujo propuesto vs browsing context

```txt
Admin CTA (futuro)
  → /admin/…/preview (NO EXISTE hoy)
    → iframe same-origin /b/{slug}/catalogo
      → detalle / personalización / carrito   [permanece en iframe]
      → checkout                               [permanece en iframe vía router.push relativo]
      → success                                [permanece en iframe]
      → WhatsApp wa.me                         [sale a _blank / browser — fuera del iframe]
      → links Instagram/Maps                   [salen a _blank]
```

Middleware: matcher `/admin/:path*` + `/b/:path*` → solo `updateSession` (cookies); **sin redirect de auth**.

## 6. Auth, tenant y resolución del slug

### Protección admin (`CONFIRMED — SOURCE`)

| Capa | Comportamiento |
|------|----------------|
| Middleware | Refresh sesión Supabase; no auth gate |
| `app/admin/layout.tsx` | Metadata PWA; sin auth |
| `app/admin/(protected)/layout.tsx` | `requireAdminContext()` |
| Pages | `requireAdminPermission(...)` según feature |

### `AdminContext` shape (`lib/admin/context.ts`)

- `businessId: string`
- `businessSlug: string | null` (join `profiles → businesses.slug`)
- `profile.role`, `businessRole`, notification prefs
- `permissions` via `getAdminPermissions`
- `user.id`, `user.email?`

`getAdminContext` → `null` sin user o sin `profile.business_id`.  
`requireAdminContext` → redirect `/admin/login`.

### Slug público

`getPublicBusinessBySlug` / `requirePublicBusinessBySlug` (`lib/business/public.ts`): normalize trim+lower, `is_active=true`, miss → `notFound()`.

### Roles Productos

`manageProducts` = owner/manager (`lib/admin/permissions.ts`). Operator/viewer no ven Productos.

### Riesgo cross-tenant

| Escenario | Riesgo |
|-----------|--------|
| CTA construido con `adminContext.businessSlug` | Bajo |
| Aceptar slug por query param del cliente sin validar `businessId` | **Alto** — preview de otro tenant |
| Public `/b/{anySlug}` | Esperado (storefront público) |

**Validación futura obligatoria (opción):** resolver slug **solo** desde `requireAdminContext().businessId` server-side; nunca confiar en query `?slug=`.

## 7. Inventario semántico de CTA

| Archivo | Copy | Destino | Contexto | Roles | Intención | Acción futura probable | Confianza |
|---------|------|---------|----------|-------|-----------|------------------------|-----------|
| `products-header-actions.tsx` | Ver catálogo | `/b/{slug}/catalogo` same-tab | Productos | `manageProducts` | Inspección / apertura | Candidato principal → preview admin | CONFIRMED |
| `settings/public/catalogo/page.tsx` | Ver catálogo público | idem `_blank` | Settings catálogo | `managePublicSettings` | Apertura pública | Conservar `_blank` o dual | CONFIRMED |
| `settings/public/landing/page.tsx` | Ver landing pública | `/b/{slug}` `_blank` | Settings landing | `managePublicSettings` | Apertura pública | Conservar | CONFIRMED |
| `public-presence-summary.tsx` | Ver landing / Ver catálogo / Ver Landing pública / Ver Catálogo público | URLs públicas `_blank` | Publicación | overview + public settings | Apertura / compartir implícito | Conservar `_blank` | CONFIRMED |
| `public-presence-preview.tsx` | Ver landing/catálogo público | URLs reales `_blank` | Footer preview aproximada | settings | Apertura pública | Conservar; no confundir con iframe | CONFIRMED |
| `public-presence-preview.tsx` | Vista previa aproximada / mock “Ver catálogo” | none | Mock UI | — | Configurar presencia | No cambiar a iframe real | CONFIRMED |
| `public-presence-editor-shell.tsx` | Catálogo público | `/admin/settings/public/catalogo` | Nav interna | settings | Configurar | Conservar | CONFIRMED |
| `dashboard/page.tsx` | (prop `catalogHref`) | potencial `/b/.../catalogo` | Dashboard | auth | Dead prop | No asumir CTA vivo | CONFIRMED |
| Customization live preview | Vista previa del cliente | none (disabled CTA) | Customizations | `manageProducts` | Inspección sandbox | Nombre distinto | CONFIRMED |

**No encontrados en admin:** “Abrir catálogo”, “Copiar enlace”, `window.open`.

**Distinción obligatoria:** no todos los “Ver catálogo” deben migrar a iframe. Settings/publicación = apertura pública; Productos = mejor candidato a inspección interna.

## 8. Arquitectura del catálogo público

### Entry stack

1. `app/b/[slug]/catalogo/page.tsx`
2. `PublicCatalogPageContent` (`components/public/catalog/public-catalog-page.tsx`) — SSR data + flag customization
3. `CatalogClient` — orquestador client (cart, modales, checkout nav)
4. Layout `[slug]` monta `PublicBusinessHeader`

### Superficies UI

| Superficie | Técnica | Contención iframe esperada | Riesgo iframe | Evidencia |
|------------|---------|---------------------------:|--------------:|-----------|
| Header | sticky + fixed menu overlay; body lock | Dentro iframe | Medio (sticky math) | `public-business-header.tsx`, globals |
| Categorías | sticky `top:0` | Dentro iframe | Medio | globals ~1317 |
| Product detail | fixed + `body.overflow=hidden` | Dentro iframe | Bajo–medio | `product-detail-modal.tsx` |
| Customization modal | fixed + body lock; z-index 80 | Dentro iframe | Bajo–medio | module CSS + tsx |
| Cart bar/FAB | fixed + safe-area | Viewport iframe | Medio (vh) | globals ~1540 |
| Cart sheet | fixed; **sin** body lock | Dentro iframe | Medio (scroll under) | `cart-sheet` |
| Toast | N/A público mínimo | — | Bajo | — |
| Checkout | página completa | Navegación iframe | Alto (pedido real) | `checkout-client` |
| Success | página + WhatsApp `_blank` | Success in-iframe; WA sale | Alto UX escape | `success/page.tsx` |

### Portals

- `createPortal` en `components/public/**`: **ninguno**.
- Overlays in-tree → quedan en documento del iframe (`CONFIRMED — SOURCE`).
- No hay portal hacia documento padre.

### Viewport

- Uso dominante `100vh` / `min(92vh,…)` en catálogo; poco/no `dvh`/`svh` en público.
- Sin `window.innerWidth` en public catalog.
- Diseño responde al viewport del **browsing context** (iframe), no al device físico del parent (`INFERRED`).

## 9. Preview existente de Product Customization

| Dimensión | Preview personalización | Preview catálogo propuesta |
|-----------|-------------------------|----------------------------|
| Objetivo | Validar opciones/precios de un producto | Validar experiencia móvil completa del storefront |
| Fuente | Corpus admin → `admin-preview-mapper` | Catálogo público live |
| Fidelidad | Modal-like parcial | Alta (stack real) si iframe |
| Carrito | No | Sí (localStorage) si real |
| Checkout | No | Sí si real |
| Pedidos | No | Sí si sin guard |
| Navegación | In-page | Full rutas `/b/...` |
| Nombre recomendado | Mantener “Vista previa del cliente” | “Vista previa del catálogo” / “Preview móvil” |

Ruta: `/admin/products/customizations`. CTA “Agregar al pedido” **disabled**; copy explícito de no carrito.

**Riesgo de confusión:** alto si ambos se llaman solo “Vista previa” sin cualificar.

## 10. Carrito, storage y sincronización

| Storage | Key | Scope | Lectores | Escritores | Limpieza | Riesgo preview |
|---------|-----|-------|----------|------------|----------|----------------|
| localStorage | `orderops-cart:{businessId}` | businessId | catalog, checkout | catalog persist | success removeItem | **Compartido same-origin** |
| localStorage | `orderops-cart-v2:{businessId}` | businessId | catalog, checkout | catalog persist | success removeItem | **Compartido same-origin** |
| localStorage | `orderops-public-theme` | global origin | header/catalog | theme toggle | no auto | Contamina tema UI |

- Dual legacy+V2: `loadUnifiedCartItems` / `persistUnifiedCartItems` (`lib/cart/local.ts`).
- **Sin** `storage` event listeners → sin sync reactiva cross-tab.
- Iframe same-origin + top-level **comparten** localStorage (`CONFIRMED — SOURCE` + estándar web; runtime de contaminación no ejercido — `UNVERIFIED` empírico).
- Cookies Supabase: same-origin; iframe `/b/*` recibe cookies admin (`CONFIRMED — SOURCE` middleware matcher).

## 11. Checkout y riesgo de pedidos reales

### Pipeline

```txt
CartSheet → router.push(/b/{slug}/checkout)
  → createPublicCheckoutOrderAction(slug, payload)
    → isBusinessAcceptingPublicOrders
    → validateCheckoutCartForCreateOrder
    → supabase.rpc("create_order")  // service role
  → clear cart keys
  → router.push(/b/{slug}/success?order_id=…)
  → WhatsApp link target=_blank
```

### `preview_mode`

**No existe** en TS ni firma RPC `create_order` (`CONFIRMED — SOURCE`).

### ¿Pedido desde iframe es real?

**Sí**, si el negocio acepta pedidos y el submit pasa validación: inserta orders/items, puede decrementar stock / ledger.

### ¿La preview propuesta sería productivamente mutante?

**CONDITIONAL → efectivamente YES** en el path de checkout sin protecciones.

| Capa | Mutante | Gate |
|------|---------|------|
| Browse | No | — |
| Add to cart | Sí (client storage) | localStorage |
| Submit | Sí (server) | accepting orders + validation |
| Preview guard | **Ninguno** | — |

## 12. Headers, CSP y framing

### Source audit

| Superficie | Hallazgo |
|------------|----------|
| `next.config.ts` | Sin `headers()` |
| `middleware.ts` | Sin security headers |
| `vercel.json` | No existe |
| Repo search XFO/CSP/frame-ancestors/frame busting | **Cero** en app code |

### Runtime audit (`CONFIRMED — RUNTIME`, 2026-07-26)

| Entorno | Ruta | Status | X-Frame-Options | CSP frame-ancestors | CSP frame-src | Resultado esperado |
|---------|------|--------|-----------------|---------------------|---------------|--------------------|
| Local :3000 | `/b/demohamburgueseria/catalogo` | 200 | ausente | ausente | ausente | Embebible |
| Local :3000 | `/admin` | 307→login | ausente | ausente | ausente | Embebible (login) |
| Local :3000 | `/admin/login` | 200 | ausente | ausente | ausente | Embebible |
| Local :3000 | `/b/.../checkout` | 200 | ausente | ausente | ausente | Embebible |
| Prod Vercel | mismas rutas | 200/307 | ausente | ausente | ausente | Embebible; HSTS presente |

**Conclusión framing:** same-origin iframe del catálogo **no está bloqueado** hoy. También implica **clickjacking abierto** para admin y público (deuda de seguridad transversal, no exclusiva de esta feature).

`X-Frame-Options: SAMEORIGIN` / `frame-ancestors 'self'` serían **compatibles** con iframe admin→catálogo same-origin; `DENY` lo bloquearía.

## 13. PWA admin y navegación standalone

| Constante | Valor |
|-----------|-------|
| scope / start_url / id | `/admin` |
| display | `standalone` |
| Manifest | `/admin/manifest.webmanifest` |
| Offline cache PWA | No (fase foundation) |

| Escenario | Efecto teórico |
|-----------|----------------|
| Top-level nav a `/b/...` | Sale del scope PWA → chrome browser típico |
| Iframe `/b/...` dentro de página `/admin/...` | Top-level permanece en scope → **shell standalone preservado** |
| `_blank` catálogo | Nueva pestaña/browser |
| WhatsApp | Protocolo externo / nueva pestaña |
| SW `/sw.js` | Push admin; scope efectivo origen `/` si registrado; no cachea HTML hoy |

Device-specific (iOS/Android standalone): **UNVERIFIED** — deuda Device QA.

## 14. Responsive y viewport móvil

Breakpoints públicos/admin usan media queries tradicionales; catálogo con `100vh` dominante.

| Pregunta | Hallazgo |
|----------|----------|
| ¿390×844 útil como target inicial? | Sí como viewport iframe inicial (`INFERRED`) |
| ¿`transform: scale()`? | Riesgoso (touch, fixed, focus) — no recomendado |
| ¿Contenedor fluido? | Preferible a scale |
| ¿Admin móvil cabe 390px iframe? | Probable overflow shell — necesita diseño (`UNVERIFIED` runtime) |
| ¿Marco teléfono en móvil admin? | Probablemente ocultar/reducir (P1 producto) |

Browser smoke mutante (agregar productos): **no ejecutado** para no contaminar carrito real.

## 15. Portals, fixed UI y contención visual

Resumen: fixed/sticky/body-lock viven en el documento del catálogo → **contenidos por el iframe**. No hay escape a parent via portal. Riesgos: doble scroll (admin shell + iframe), sticky offset, `100vh` en iframe corto, cart sheet sin scroll-lock.

## 16. Rendimiento, caché y recarga

- Catálogo: server load productos + customization summaries; client hidrata carrito.
- Iframe = **árbol React separado** + re-fetch público (`INFERRED`).
- `Cache-Control` prod catálogo: `private, no-cache, no-store, max-age=0, must-revalidate` (`CONFIRMED — RUNTIME`) → recarga iframe suele ver datos frescos server-side.
- Prefetch `Link` hacia futura ruta preview: riesgo bajo si la preview es admin-only; evitar prefetch del storefront completo sin necesidad.
- Loading state del iframe: necesario (P1).
- Memory: stack catálogo+imágenes en paralelo al admin dashboard — riesgo medio en móviles.

## 17. Accesibilidad

| Tema | Hallazgo |
|------|----------|
| iframe title | Debe ser descriptivo (ej. “Vista previa del catálogo — {business}”) |
| Focus traps públicos | Débiles/ausentes en modales catálogo (Escape incompleto) |
| Nested scroll | Shell admin + iframe = regiones anidadas |
| Alternativa | Enlace “Abrir catálogo en pestaña” obligatorio para a11y |
| Light/dark | Tema público en localStorage compartido |

QA a11y completa: Device/manual debt.

## 18. Seguridad y aislamiento

### Aislamiento visual / browsing context vs datos

| Capacidad | Same-origin iframe sin sandbox |
|-----------|--------------------------------|
| Viewport visual | Aislado |
| DOM parent↔child | **Accesible bidireccional** |
| Cookies auth | **Compartidas** |
| localStorage | **Compartido** |
| Pedidos | **Mutación real posible** |

### Sandbox attribute (futuro)

| Flag | Consecuencia |
|------|--------------|
| sin sandbox | Máxima fidelidad, mínimo aislamiento |
| `allow-scripts` + `allow-same-origin` | Casi equivalente a sin sandbox |
| sin `allow-forms` | Bloquea checkout UI submit — posible mitigación |
| sin `allow-popups` | Puede romper WhatsApp `_blank` |
| `allow-top-navigation` | Riesgo de escape al top |

### Riesgos clave

1. Pedidos reales presentados como “preview”.
2. Contaminación carrito cliente/admin.
3. Slug por query sin binding a `businessId`.
4. Clickjacking global (admin/público framable).
5. Child scripts pueden tocar `window.parent` (hoy no lo hacen, pero capacidad existe).

## 19. Alternativas arquitectónicas

| Criterio | A iframe real | B iframe + preview mode | C compose in-admin | D abrir externo | E híbrido |
|----------|--------------:|------------------------:|-------------------:|----------------:|----------:|
| Fidelidad cliente | HIGH | HIGH | LOW–MED | HIGH | MED–HIGH |
| Aislamiento visual | HIGH | HIGH | MED | LOW | MED–HIGH |
| Aislamiento datos | LOW | MED | HIGH | HIGH | MED |
| Riesgo pedido real | VERY HIGH | LOW–MED* | LOW | VERY HIGH** | LOW–MED* |
| Complejidad | MED | HIGH | MED–HIGH | LOW | MED |
| Blast radius | MED–HIGH | HIGH | MED | LOW | MED |
| Mantenimiento | LOW–MED | HIGH | HIGH | LOW | MED |
| Compatibilidad PWA | HIGH | HIGH | HIGH | LOW | HIGH |
| Seguridad | LOW | MED | HIGH | HIGH | MED |
| Fidelidad checkout | HIGH | MED–HIGH*** | LOW | HIGH | MED |
| Recomendación | Condicional | Preferida si iframe | Parcial | Escape hatch | **Preferida v1** |

\* si guards server-side reales  
\*\* si el usuario completa checkout en la pestaña externa  
\*\*\* checkout puede estar bloqueado a propósito

## 20. Recomendación preliminar

**No cerrar spec como “iframe naive del catálogo real”.**

Recomendación técnica preliminar (**no es decisión de producto**):

1. **V1 producto:** Opción **E (híbrido)** — preview admin dedicada con iframe del catálogo **solo si** se aceptan condiciones P0; mantener CTAs `_blank` de presencia pública.
2. Si se exige fidelidad full-stack in-shell: Opción **B** con guard server-side que impida `create_order` desde preview (no solo UI), más estrategia de carrito aislado o read-only.
3. Opción **A pura** solo aceptable con aceptación explícita de riesgo de pedidos + contaminación de carrito + copy de advertencia fuerte — **no recomendada** sin P0 resueltos.
4. Resolver slug exclusivamente desde `businessId` admin server-side.
5. Diferenciar naming de “Vista previa del cliente” (customization).

## 21. Blast radius futuro

### Probablemente necesarios

| Archivo | Motivo | Cambio posible | Riesgo | Condición |
|---------|--------|----------------|--------|-----------|
| `app/admin/(protected)/products/preview/page.tsx` (nuevo) o ruta under products/settings | Entry preview | crear página | MED | ubicación PO |
| Componente shell iframe (nuevo under `components/admin/…`) | Contenedor mobile | crear | MED | Opción A/B/E |
| CSS module shell | Marco/viewport | crear | LOW | — |
| `products-header-actions.tsx` | CTA Productos | redirigir/añadir | MED | P0 CTA |
| Helper slug from `requireAdminContext` | URL segura | crear/usar | LOW | — |
| Docs CURRENT_PHASE / memory | registro | docs | LOW | — |

### Condicionales

| Archivo | Motivo | Condición |
|---------|--------|-----------|
| `checkout-client.tsx` / `checkout/actions.ts` | bloquear submit | Opción B/E con guard |
| RPC / types `create_order` | flag preview | solo si server-enforced |
| `lib/cart/local.ts` | claves preview aisladas | si se aísla carrito |
| `next.config.ts` / middleware | CSP frame-ancestors / frame-src | hardening framing |
| `public-presence-*.tsx` | dual CTA | si settings también usa preview |
| PWA docs only | sin cambio runtime | salvo copy |

### No deberían tocarse (salvo decisión explícita mayor)

- `create_order` RPC productiva sin diseño de preview
- RLS / migrations
- Product Customization mapper/actions
- Dashboard realtime / orders sync
- Catálogo público UI salvo flags mínimos bien acotados
- `public/sw.js` offline

## 22. Estrategia de QA segura

### Sin mutaciones

Carga iframe, responsive 360–414, abrir producto, modal, cerrar, navegar a checkout **sin submit**, headers, URL top-level sigue `/admin/...`, a11y básica, PWA scope, light/dark.

### Mutación local controlada

Agregar al carrito / limpiar storage **solo** con perfil browser aislado o clave preview — **REQUIRES EXPLICIT AUTHORIZATION** sobre tenant real.

### Pedido real

Submit + RPC + dashboard + cleanup — **REQUIRES EXPLICIT AUTHORIZATION**.

| Caso | Mutación | Riesgo | Entorno | Autorización |
|------|----------|--------|---------|--------------|
| Load iframe + browse | No | Low | local/prod | implícita audit |
| Open checkout no submit | No | Low | local/prod | implícita |
| Add to cart | Sí storage | Med | browser aislado | explícita |
| Place order | Sí DB/stock | High | tenant QA | **REQUIRES EXPLICIT AUTHORIZATION** |
| Device PWA install | No | Low | device | Device QA |

## 23. Riesgos priorizados

| ID | Severidad | Área | Hallazgo | Evidencia | Impacto | Mitigación futura | Bloquea |
|----|-----------|------|----------|-----------|---------|-------------------|---------|
| R1 | P0 | Pedidos | Checkout crea pedidos reales; sin preview_mode | actions + RPC | Pedidos QA/accidentales + stock | Guard server-side o bloquear forms | **Sí** hasta decisión PO |
| R2 | P0 | Storage | localStorage carrito shared same-origin | `lib/cart/local.ts` | Contamina carrito real | Claves preview / read-only / wipe controlado | **Sí** hasta decisión |
| R3 | P0 | Tenant | Slug por query sin bind businessId | threat model | Cross-tenant preview | Resolver slug server from businessId | **Sí** en diseño |
| R4 | P1 | Seguridad | Sin XFO/CSP frame-ancestors | source+runtime | Clickjacking global | Headers `frame-ancestors 'self'` | No feature-only; deuda global |
| R5 | P1 | Seguridad | Same-origin parent↔child DOM/cookies | web platform | Fuga capacidades | sandbox cuidadoso / no confiar en UI-only | Condicional |
| R6 | P1 | UX/PWA | `_blank`/WhatsApp salen del shell | success/header | Escape standalone | Documentar; botones externos conscientes | No |
| R7 | P1 | Naming | Confusión con preview customization | live-preview copy | Uso incorrecto | Naming distinto | No |
| R8 | P2 | Responsive | `100vh` + nested scroll | globals | Cortes UI iframe | Viewport fluido; QA viewports | No |
| R9 | P2 | A11y | Modales públicos sin trap/Escape robusto | catalog modals | Deuda a11y en preview | QA + fixes futuros públicos | No |
| R10 | P3 | Perf | Doble carga admin+iframe | architecture | Memory móvil | Lazy mount iframe | No |

## 24. Supuestos contradichos

| Supuesto | Evidencia | Impacto |
|----------|-----------|---------|
| “Preview = sandbox seguro por defecto” | Checkout mutante real | Spec debe tratar mutación |
| “Middleware protege /admin” | Solo updateSession | Auth en layout |
| “Hay CSP/XFO que impide iframe” | Ausente local+prod | Framing abierto |
| “createPortal escapará al admin” | No hay portals públicos | Contención visual OK |
| “Todos los Ver catálogo son iguales” | Intenciones distintas | CTA mapping semántico |
| “Dashboard ya tiene CTA catálogo” | `catalogHref` dead prop | No reutilizar sin UI |

## 25. Incógnitas no verificadas

- Contaminación empírica localStorage iframe↔tab en browser real.
- Comportamiento PWA standalone iOS/Android con iframe interno.
- Overflow exacto del shell admin a 390px con marco teléfono.
- Si Vercel project settings añaden headers fuera del repo en algún entorno no sondeado.
- Preferencia PO sobre ubicación de la feature (Productos vs Settings).
- Si operadores (sin manageProducts) deben ver preview.

## 26. Preguntas P0 para cerrar la spec

### P0-1 — Pedidos reales

- **Decisión:** ¿La preview puede completar checkout y crear pedidos reales?
- **Por qué importa:** Sin guard, iframe = canal productivo (`create_order`).
- **Evidencia:** §11; no `preview_mode`.
- **Opciones:** (a) Permitir pedidos con advertencia; (b) Bloquear submit solo UI; (c) Bloquear server-side preview mode; (d) Navegar hasta checkout pero disable submit + copy.
- **Impacto:** (a) riesgo stock/ops; (b) bypassable; (c) blast en checkout/actions; (d) UX clara, bypassable si solo UI.
- **Recomendación técnica:** (c) o (d)+(c) mínimo viable.
- **Default sugerido:** (d)+(c) — browse OK, submit bloqueado server-side.
- **Bloquea implementación:** **sí**

### P0-2 — Carrito compartido

- **Decisión:** ¿El carrito de preview puede compartir claves `orderops-cart*` del tenant?
- **Por qué importa:** Same-origin localStorage.
- **Evidencia:** §10.
- **Opciones:** (a) Compartir; (b) Prefijo `preview:` keys; (c) Preview read-only sin persist; (d) Wipe al entrar/salir.
- **Impacto:** (a) contaminación; (b) cambio cart lib; (c) fidelidad media; (d) destructivo si mal scoped.
- **Recomendación técnica:** (b) o (c) según fidelidad deseada.
- **Default sugerido:** (b) si se permite add-to-cart; (c) si solo browse.
- **Bloquea implementación:** **sí**

### P0-3 — Permiso de acceso

- **Decisión:** ¿Qué permiso abre la preview? ¿`manageProducts`, `managePublicSettings`, ambos, u otro existente?
- **Por qué importa:** Operator/viewer hoy no ven Productos; settings usa otro permiso.
- **Evidencia:** §6–7.
- **Opciones:** (a) manageProducts; (b) managePublicSettings; (c) cualquiera de los dos; (d) todo admin autenticado.
- **Impacto:** superficie de acceso y ubicación CTA.
- **Recomendación técnica:** (a) si vive en Productos; (c) si vive en ambos.
- **Default sugerido:** (a) para v1 en Productos.
- **Bloquea implementación:** **sí**

### P0-4 — Ubicación de la feature

- **Decisión:** ¿Dónde vive la entrada? Productos / Settings presencia / ambos / dashboard.
- **Por qué importa:** CTA semántica distinta; dead `catalogHref` en dashboard.
- **Evidencia:** §7.
- **Opciones:** (a) Productos; (b) Settings; (c) ambos con copy distinto; (d) dashboard nuevo.
- **Recomendación técnica:** (a) inspección; conservar `_blank` en settings.
- **Default sugerido:** (a) + conservar settings `_blank`.
- **Bloquea implementación:** **sí**

### P0-5 — Reemplazo del CTA “Ver catálogo” (Productos)

- **Decisión:** ¿El CTA same-tab de Productos se reemplaza, se duplica (Preview + Abrir público), o se deja?
- **Evidencia:** `products-header-actions.tsx`.
- **Opciones:** (a) Reemplazar por preview; (b) Dual; (c) Solo añadir preview.
- **Recomendación técnica:** (b).
- **Default sugerido:** (b).
- **Bloquea implementación:** **sí**

### P0-6 — Framing security posture

- **Decisión:** ¿Esta feature exige introducir `frame-ancestors`/`XFO` global, solo documentar deuda, o bloquear framing de terceros?
- **Evidencia:** §12 runtime sin headers.
- **Opciones:** (a) Deuda aparte; (b) headers `'self'` en misma fase implementación; (c) bloquear feature hasta hardening.
- **Recomendación técnica:** (b) acoplado a implementación iframe, o (a) con ticket P0 seguridad separado explícito.
- **Default sugerido:** (b) mínimo `frame-ancestors 'self'` al implementar iframe.
- **Bloquea implementación:** **sí** si se elige iframe sin aceptar riesgo clickjacking.

## 27. Preguntas P1 para cerrar la spec

### P1-1 — Marco de teléfono
¿Mostrar bezel device en desktop y ocultarlo en admin móvil? Default sugerido: sí.

### P1-2 — Recargar iframe
¿Botón recargar explícito? Default: sí.

### P1-3 — Limpiar carrito preview
¿Acción “Vaciar carrito de preview”? Depende P0-2. Default: sí si hay persistencia preview.

### P1-4 — Abrir en pestaña
¿Link permanente “Abrir catálogo real”? Default: sí (a11y + escape hatch).

### P1-5 — Copy de advertencia
¿Banner “Esto puede crear pedidos reales” vs “Modo preview — checkout deshabilitado”? Depende P0-1.

### P1-6 — Slug null
¿UI cuando `businessSlug === null`? Default: CTA oculto + mensaje configurar slug (ya parcialmente en presence).

### P1-7 — PWA standalone
¿Documentar que WhatsApp/externos salen del shell? Default: sí en copy/help.

### P1-8 — Success dentro del iframe
¿Permitir llegar a success o cortar en checkout? Depende P0-1.

### P1-9 — Light/dark
¿Preview respeta tema público o fuerza light? Default: tema público actual.

### P1-10 — Nombre UI
¿“Vista previa del catálogo” vs “Preview móvil” vs “Ver como cliente”? Default: “Vista previa del catálogo” (distinto de customization).

## 28. Preguntas P2 diferibles

- Selector de dispositivos (360/390/414/768)
- Rotación landscape
- Tablet/desktop frames
- Sync live admin→iframe sin reload
- `postMessage` bridge
- Refresh automático al guardar productos
- Analytics de uso de preview
- Deep-link a producto específico en preview

## 29. Condiciones de entrada a SPEC-CLOSURE-1

| # | Condición | Estado |
|---|-----------|--------|
| 1 | Ruta pública confirmada | **OK** `/b/[slug]/catalogo` |
| 2 | Tenant/slug seguro documentado | **OK** (regla: no query slug) |
| 3 | CTA inventariados | **OK** |
| 4 | Carrito identificado | **OK** |
| 5 | Riesgo pedidos determinado | **OK** CONDITIONAL/YES |
| 6 | Headers auditados | **OK** source+runtime |
| 7 | Viabilidad iframe clasificada | **OK** VIABLE WITH CONDITIONS |
| 8 | PWA evaluada | **OK** |
| 9 | Preview customization diferenciada | **OK** |
| 10 | Preguntas P0 formuladas | **OK** |
| 11 | P0 técnicos con mitigación viable | **OK** (guards/cart/headers) |

**Clasificación de entrada:** `READY WITH TECHNICAL CONDITIONS`

No `BLOCKED`: no hay imposibilidad técnica; sí hay condiciones de diseño obligatorias.

## 30. Rollback de esta fase

Solo documentación. Revertir:

- `docs/admin-catalog-preview-audit-1-forensic-architecture.md`
- entradas en `docs/CURRENT_PHASE.md`
- entrada en `ORDEROPS_LIVING_MEMORY.md`

Sin DB, sin runtime, sin deploy. **Esta fase no hace commit/push.**

## 31. Clasificación final

```txt
READY WITH TECHNICAL CONDITIONS
```

**Viabilidad iframe:** `VIABLE WITH CONDITIONS`

**Condiciones mínimas antes de implementar:**

1. Decisión PO sobre pedidos (P0-1).
2. Decisión PO sobre carrito (P0-2).
3. Permiso + ubicación + CTA (P0-3/4/5).
4. Postura framing/headers (P0-6).
5. Spec que prohíba slug client-trust y confusión naming con customization preview.

**Próxima fase recomendada:** `ADMIN-CATALOG-PREVIEW-SPEC-CLOSURE-1`
)
