# PUBLIC-TENANT-BROWSER-BRANDING-ROUTES-AUDIT-1

## Estado

```text
AUDIT COMPLETE — TENANT BROWSER BRANDING READY FOR SPEC
```

Branch: `cursor-handoff-public-catalog-ui-redesign` @ `6aa3bed`
Scope: audit + documentation only (no runtime/metadata/favicon implementation).

## Contexto

Hoy, al abrir rutas públicas tenant en producción (`/b/demohamburgueseria/*`), la pestaña muestra:

```text
[icono OrderOps] OrderOps
```

Objetivo futuro (solo customer-facing con slug):

```text
[logo del negocio] Nombre del negocio
```

Ejemplo deseado (La Burguesía / `demohamburgueseria`):

```text
favicon: logo de La Burguesía
title: La Burguesía
```

Mantener OrderOps en plataforma, admin/auth, APIs, PWA admin y superficies no tenant.

## Preflight

Ejecutado en repo local:

| Check | Resultado |
|-------|-----------|
| Branch | `cursor-handoff-public-catalog-ui-redesign` |
| HEAD | `6aa3bed` — `feat(public-catalog): complete UI redesign closeout` |
| Working tree (inicio) | limpio |
| Pull / reset / checkout / commit / push / deploy | no ejecutados |
| Runtime / CSS / metadata changes | ninguno |

## Route inventory

Inventario desde `app/**/{page,layout,route,not-found}.tsx` + assets estáticos relevantes.

| Ruta | Tipo | Tiene slug | Customer-facing | Branding actual | Branding recomendado | Fuente title actual | Fuente favicon actual | Riesgo |
|------|------|------------|-----------------|-----------------|----------------------|--------------------|----------------------|--------|
| `/` | public-platform | No | No (marketing OrderOps) | OrderOps | OrderOps | `app/layout.tsx` `metadata.title` | `app/layout.tsx` → `/favicon.ico?v=2`, `/icon.png?v=2` | P3 |
| `/b/[slug]` | public-tenant | Sí | Sí (landing negocio) | OrderOps (incorrecto vs producto) | Tenant (`business.name` + logo) | hereda root | hereda root | P1 |
| `/b/[slug]/catalogo` | public-tenant | Sí | Sí | OrderOps | Tenant | hereda root | hereda root | P1 |
| `/b/[slug]/checkout` | public-checkout | Sí | Sí | OrderOps | Tenant (mismo) | hereda root | hereda root | P1 |
| `/b/[slug]/success` | public-success | Sí | Sí | OrderOps | Tenant (mismo) | hereda root | hereda root | P1 |
| `/b/[slug]/catalogo?orderopsPreview=1` | public-preview | Sí | No (admin iframe) | OrderOps en iframe document | Tenant OK en iframe; pestaña padre = admin OrderOps | hereda root (iframe) | hereda root (iframe) | P2 |
| `/b/[slug]/checkout?orderopsPreview=1` | public-preview | Sí | No (admin iframe) | OrderOps en iframe | Tenant OK en iframe; pestaña = admin | hereda root | hereda root | P2 |
| `/admin` | admin-protected | No | No | OrderOps (+ PWA) | OrderOps | `app/admin/layout.tsx` | apple + manifest; favicon vía convención/root merge | P0 si se cambia |
| `/admin/login` | admin-public-auth | No | No | OrderOps | OrderOps | admin layout | apple + manifest | P0 si se cambia |
| `/admin/(protected)/*` | admin-protected | No | No | OrderOps template `%s \| OrderOps` | OrderOps | admin layout | admin PWA icons | P0 |
| `/admin/manifest.webmanifest` | static / PWA | No | No | OrderOps | OrderOps | `lib/admin/pwa-manifest.ts` | icons admin bajo `/icons/orderops-admin-*` | P0 |
| `/super-admin/*` | admin-protected (platform) | No | No | OrderOps (root) | OrderOps | root (layout vacío) | root | P1 si se filtrara tenant |
| `/api/internal/orders/[id]/push` | api | No | No | N/A | fuera de branding pestaña | N/A | N/A | — |
| `/api/observability/public-catalog` | api | No | No | N/A | fuera | N/A | N/A | — |
| `app/not-found` | unknown / platform | — | — | OrderOps (sin metadata propia) | OrderOps (o title genérico) | root | root | P3 |
| `/favicon.ico`, `/icon.png` | static | No | No | OrderOps assets | fallback global | — | `public/favicon.ico`, `public/icon.png` | — |
| `/public/sw.js` | static / PWA push | No | No | OrderOps push titles | OrderOps only | push payload | N/A tab | P0 si se reusa en tenant |

## Public route classification

### public-platform

- `/` — landing comercial OrderOps (`app/page.tsx`).
- No hay otras rutas marketing/legales dedicadas bajo `app/` en este inventario.

### public-tenant

- `/b/[slug]` — landing del negocio (`BusinessLandingPage`).
- `/b/[slug]/catalogo` — catálogo customer-facing.

### public-checkout / public-success

- `/b/[slug]/checkout`
- `/b/[slug]/success`

Ambas viven bajo el mismo segmento `app/b/[slug]` y reutilizan `PublicBusinessHeader` vía layout. Son customer-facing del mismo tenant.

### public-preview

- Mismo path físico `/b/[slug]/catalogo|checkout` con `?orderopsPreview=1`.
- Shell admin: `/admin/(protected)/products/preview` carga iframe `buildCatalogPreviewPath(slug, …)`.
- La **pestaña del navegador** es la del admin (OrderOps). El document del iframe hoy también hereda OrderOps; branding tenant en iframe sería coherente con WYSIWYG y **no** cambia la pestaña padre.

### admin / auth / internal

- `/admin`, `/admin/login`, `/admin/(protected)/*`, `/super-admin/*`
- Manifest + apple icons OrderOps; scope PWA `/admin`.

### api / static / observability

- APIs y assets: fuera de branding de pestaña.

## Current metadata model

Evidencia repo:

1. **Único metadata global:** `app/layout.tsx`

```ts
title: "OrderOps"
description: "OrderOps"
icons: favicon.ico?v=2 + icon.png?v=2 (192x192) + shortcut
```

2. **Único override de segmento:** `app/admin/layout.tsx`

```ts
title: { default: "OrderOps", template: "%s | OrderOps" }
manifest: /admin/manifest.webmanifest
appleWebApp + apple-touch-icon
// icons: solo apple — no redefine favicon.ico explícitamente
```

3. **`generateMetadata`:** no existe en ningún archivo bajo `app/` (solo `export const metadata` en root + admin).

4. **Segmento tenant:** `app/b/[slug]/layout.tsx` carga `getRequestPublicBusiness(slug)` y renderiza header — **sin** `generateMetadata` / sin icons override.

5. **`app/b/layout.tsx`:** passthrough (`return children`) — sin metadata.

6. Ninguna página pública `/b/[slug]/*` sobreescribe `title` hoy.

Conclusión: todas las rutas públicas tenant heredan title/favicon OrderOps del root.

## Current favicon model

| Superficie | Iconos |
|------------|--------|
| Root / público / tenant | `/favicon.ico?v=2`, `/icon.png?v=2` desde `public/` |
| Admin | Apple touch `/icons/orderops-admin-apple-180.png` + manifest icons 192/512/maskable; HTML login no emite `<link rel="icon">` explícito en head (curl) — navegador puede caer a `/favicon.ico` por convención |
| PWA admin | `buildAdminWebAppManifest()` — name/icons OrderOps, scope `/admin` |
| SW | `public/sw.js` — notificaciones OrderOps /admin; no aplica a pestaña pública |

Cache busting actual: query `?v=2` en icons root.

## Tenant data sources

| Dato | Fuente | Disponible en layout `/b/[slug]` hoy |
|------|--------|--------------------------------------|
| `name` | `businesses.name` vía `getCachedPublicBusinessStable` / `PublicBusiness` | Sí (`getRequestPublicBusiness`) |
| `slug` | `businesses.slug` | Sí |
| `logo_url` | `businesses.logo_url` (`string \| null`) | Sí |
| `primary_color` | `businesses.primary_color` | Sí (no necesario para favicon fase 1) |
| cover / hero | cover + catalog_hero_* | Sí (no para tab branding) |

Cadena:

```text
requirePublicBusinessBySlug
  → getCachedPublicBusinessStable(slug)  // unstable_cache + tag public-business:{slug}
  → getFreshPublicOrderingStatus(id)     // overlay aceptación (no branding)
```

Request dedupe: `getRequestPublicBusiness = cache(...)` en `app/b/[slug]/get-public-business.ts`.

**Logo URL (prod QA La Burguesía):**

```text
https://pkrsedmwxekbhlohhqds.supabase.co/storage/v1/object/public/business-assets/{businessId}/logo/...png
```

- Absoluta HTTPS.
- Bucket público `business-assets`.
- UI usa `PublicStorageImage` (loader transform + fallback object URL en 403).
- Para **favicon/metadata**, preferir URL object pública (sin depender de Image Transformations) — ya es el path object en el ejemplo prod.
- `logo_url` nullable → fallback OrderOps icons obligatorio.
- Formato típico PNG; dimensiones/tamaño variables (riesgo P2).
- Invalidación branding: `revalidatePublicCatalogCache({ scope: "business", slug })` → `updateTag(publicBusinessTag(slug))` + `revalidatePath(/b/{slug})` desde settings públicas.

## Candidate routes for tenant branding

Respuestas 5.1:

| Pregunta | Respuesta |
|----------|-----------|
| ¿Qué rutas con slug existen? | `/b/[slug]`, `/catalogo`, `/checkout`, `/success` (+ mismos paths con `orderopsPreview=1`) |
| ¿Todas son customer-facing? | Las cuatro sin preview: sí. Preview: admin iframe, no pestaña customer |
| ¿Todas deberían mostrar favicon/title del negocio? | Sí para las cuatro customer-facing. Preview iframe: sí tenant en document; pestaña padre permanece OrderOps |
| ¿Preview/admin iframe distinto? | No cambiar shell admin. Metadata tenant en `/b/[slug]` aplica al iframe automáticamente; aceptable |
| ¿Checkout y success mismo branding? | **Sí** — misma marca del negocio; sin sufijos de producto en fase 1 |

**Branding exacto recomendado (producto hoy):**

```text
title: business.name          // ej. "La Burguesía"
favicon: business.logo_url || OrderOps /favicon.ico|/icon.png
```

Variantes con sufijo (`La Burguesía · Catálogo`, `Pedido recibido · …`) quedan **fuera** del pedido actual; documentadas como polish futuro (P3).

## Routes that must keep OrderOps branding

- `/` landing plataforma
- `/admin`, `/admin/login`, `/admin/(protected)/*`
- `/super-admin/*`
- `/admin/manifest.webmanifest` + icons `/icons/orderops-admin-*`
- `public/sw.js` / push admin
- `/api/*`
- Static OrderOps favicon/icon como **fallback** global

## Preview/admin considerations

- Preview path helper: `buildCatalogPreviewPath` → `/b/{slug}/catalogo|checkout?orderopsPreview=1`.
- Parent page `/admin/.../products/preview` usa metadata admin OrderOps — **no tocar**.
- CSP `frame-ancestors 'self'` — preview same-origin.
- Riesgo: admin viendo iframe con favicon tenant en DevTools del iframe es correcto; no debe filtrar logo tenant al `document` padre ni al manifest PWA.

## PWA/admin manifest considerations

- Manifest solo bajo `/admin/manifest.webmanifest`.
- Scope `/admin` — no incluye `/b/[slug]`.
- Implementar metadata tenant en segmento `/b/[slug]` **no** debe modificar `app/admin/layout.tsx`, `lib/admin/pwa-manifest.ts`, ni assets admin.
- No introducir `manifest` tenant en esta iniciativa.

## Performance and cache analysis

| Tema | Hallazgo |
|------|----------|
| ¿`generateMetadata` duplica queries? | Mitigable: reutilizar `getRequestPublicBusiness` / `getCachedPublicBusinessStable` (React `cache` + `unstable_cache`). Layout ya llama el mismo helper |
| Helper cacheado | Sí — tag `public-business:{slug}`, revalidate 60s + `updateTag` en settings |
| Invalidación nombre/logo | Cubierta por `revalidatePublicCatalogCache(scope: "business")` + path `/b/{slug}`; metadata dinámica debería invalidarse con los mismos tags/paths si `generateMetadata` lee el cache tagged |
| Favicon browser cache | Fuerte; logos remotos sin `?v=` pueden quedar stale tras cambio de logo. Mitigación futura: cache-bust query en URL metadata o path versionado; QA en incógnito |
| Overhead | Bajo si se comparte cache; no re-fetch catalog products solo por metadata |
| Invalid slug | `notFound()` — sin business; title OrderOps root (aceptable) |

## Risks

| ID | Riesgo | Sev | Notas |
|----|--------|-----|-------|
| R1 | Cambiar metadata root/admin por error | P0 | Spec debe limitar a `app/b/[slug]` |
| R2 | PWA/manifest admin alterado | P0 | Fuera de scope |
| R3 | Branding OrderOps en rutas tenant (estado actual) | P1 | Motivo del trabajo |
| R4 | Favicon remoto stale en navegador | P2 | Incógnito / hard refresh en QA |
| R5 | Logo pesado / dimensiones no-cuadradas | P2 | Puede verse mal como favicon; no bloquea SPEC |
| R6 | SVG remoto / CORS | P3 | Logos actuales PNG object public; metadata icons no usan fetch CORS del browser igual que `<img>` |
| R7 | Supabase transform 403 | P2 | Favicon debe usar object URL, no render transform |
| R8 | Fallback sin logo | P1 si falta | Debe caer a icons OrderOps |
| R9 | Preview iframe vs pestaña admin | P2 | OK si solo cambia document iframe |
| R10 | Extra fetch en metadata | P2 | Evitar con helpers cacheados |
| R11 | Title hydration mismatch | P3 | Metadata SSR; sin `document.title` client hoy |
| R12 | Open Graph / social | P3 | No hay OG tenant hoy; fuera de fase 1 tab branding |
| R13 | `not-found` slug inválido | P3 | Hereda OrderOps |

**Blockers para SPEC:** ninguno. Datos, rutas y puntos de extensión están claros.

## Browser/source QA

Producción `https://orderops.vercel.app` — solo lectura; sin login, sin formularios, sin pedidos.

| URL | `document.title` | Icons observados | Pestaña visual |
|-----|------------------|------------------|----------------|
| `/` | `OrderOps` | shortcut+icon `/favicon.ico?v=2`; icon png 192 `/icon.png?v=2` | OrderOps |
| `/b/demohamburgueseria` | `OrderOps` | mismos icons OrderOps | OrderOps (UI muestra “La Burguesía”) |
| `/b/demohamburgueseria/catalogo` | `OrderOps` | mismos | OrderOps; logo header = Supabase object URL La Burguesía |
| `/b/demohamburgueseria/checkout` | `OrderOps` | mismos | OrderOps |
| `/b/demohamburgueseria/success?order_id=invalid` | `OrderOps` | mismos | OrderOps |
| `/admin/login` | `OrderOps` (HTML fetch) | apple-touch-icon admin + manifest; sin `<link rel="icon">` explícito en HTML | OrderOps (esperado) |

Script de referencia usado en CDP / equivalente:

```js
document.title
Array.from(document.querySelectorAll('link[rel~="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')).map((el) => ({
  rel: el.rel,
  href: el.href,
  type: el.type,
  sizes: el.sizes?.value
}))
```

## Recommended implementation strategy

Fase siguiente propuesta: **PUBLIC-TENANT-BROWSER-BRANDING-SPEC-1** (luego IMPL).

Dirección (no implementar ahora):

1. Agregar `generateMetadata` **solo** en `app/b/[slug]/layout.tsx` (cubre catalogo/checkout/success/landing + preview iframe).
2. `title: business.name` (pestaña limpia; sin sufijos).
3. `icons`: si `logo_url` → URL absoluta object; else heredar / fallback OrderOps (`/favicon.ico`, `/icon.png`).
4. Reusar `getRequestPublicBusiness` / cached stable — no duplicar queries de catálogo.
5. No tocar `app/layout.tsx` branding global salvo necesidad mínima de composition (preferir override de segmento).
6. No tocar admin layout, PWA, SW, DB, RPC, `create_order`, checkout logic, CSS.
7. QA: rutas tenant + `/` + `/admin/login` + incógnito tras cambio de logo; preview iframe no debe alterar pestaña admin.

Next.js en repo: `^16.2.9` (App Router). Metadata dinámica por segmento dinámico es el patrón correcto; no hay `app/icon` file-based que bloquee override por metadata. Icons remotos absolutos son el camino natural para `logo_url` de Storage (validar en SPEC/IMPL con build).

## Implementation boundaries for next phase

**In:**

- Spec + (posterior) metadata/icons en `/b/[slug]`
- Title = `business.name`
- Favicon = `logo_url` || OrderOps
- Docs + QA incógnito

**Out:**

- Admin / login / super-admin / PWA / SW
- DB migrations / RPC / packages
- `create_order` / pedidos reales / WhatsApp
- OG/Twitter cards (salvo que SPEC las acote explícitamente)
- Sufijos de title por página
- CSS / UI redesign

## Out of scope

- Implementación de favicon/title dinámico (esta fase)
- Cambios de layout/rutas/runtime/CSS
- Commit / push / deploy
- Pedidos reales / WhatsApp real
- Maps checkout / public_order_code / success edge polish

## Gate

```text
QUEUE_GATE: PUBLIC-TENANT-BROWSER-BRANDING-SPEC-1 = ALLOWED
QUEUE_GATE: PUBLIC-TENANT-BROWSER-BRANDING-IMPL-1 = PAUSED_UNTIL_SPEC
QUEUE_GATE: PUBLIC-CATALOG-SUCCESS-EDGE-STATES-POLISH-1 = OPTIONAL
QUEUE_GATE: PUBLIC-ORDERS-PUBLIC-CODE-SPEC-1 = BACKLOG
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-* = PAUSED
```

Recomendación de cola: ejecutar **SPEC-1** antes de IMPL (contrato de title limpio, fallback icons, cache-bust favicon, límites admin/PWA). IMPL queda pausado hasta SPEC.

```text
AUDIT COMPLETE — TENANT BROWSER BRANDING READY FOR SPEC
```
