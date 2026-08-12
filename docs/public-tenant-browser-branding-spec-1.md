# PUBLIC-TENANT-BROWSER-BRANDING-SPEC-1

## Estado

```text
SPEC COMPLETE — TENANT BROWSER BRANDING READY FOR IMPL
```

Branch: `cursor-handoff-public-catalog-ui-redesign` @ `6aa3bed`
Prerrequisito: `docs/public-tenant-browser-branding-routes-audit-1.md`
Scope: especificación congelada — sin implementación runtime.

## Contexto

Hoy `/b/[slug]/*` hereda metadata global OrderOps (`app/layout.tsx`). El producto requiere marca blanca en pestaña del navegador solo en rutas públicas tenant:

```text
[logo del negocio] Nombre del negocio
```

Ejemplo (`demohamburgueseria` / La Burguesía):

```text
/b/demohamburgueseria/catalogo
→ favicon: logo_url del negocio
→ title: La Burguesía
```

Admin, plataforma, PWA y APIs permanecen OrderOps.

## Decisiones cerradas

Aprobadas por Product Owner — **congeladas** para IMPL:

| ID | Decisión |
|----|----------|
| **1A** | Title limpio = `business.name` (ej. `La Burguesía`) |
| **2A** | Rutas: `/b/[slug]`, `/catalogo`, `/checkout`, `/success` |
| **3A** | Preview iframe puede tener metadata tenant; pestaña padre admin = OrderOps |
| **4A** | Favicon = `business.logo_url` directo cuando exista |
| **5A** | Sin `logo_url` → icons OrderOps |
| **6A** | MVP sin cache-bust; QA incógnito/hard refresh |
| **7B** | No cambiar apple-touch-icon tenant; no PWA/mobile install |
| **8A** | OpenGraph/social fuera de scope |
| **9A** | `/`, admin, super-admin, APIs, PWA, SW = OrderOps |
| **10A** | Tras SPEC+IMPL: commit + push + deploy production (flujo rediseño) |

## Scope

### IN

- `/b/[slug]`
- `/b/[slug]/catalogo`
- `/b/[slug]/checkout`
- `/b/[slug]/success`
- Mismos documentos bajo `?orderopsPreview=1` (iframe admin) — solo document del iframe; **no** cambiar pestaña padre

Punto de implementación único: `generateMetadata` en `app/b/[slug]/layout.tsx` (cubre todas las rutas hijas del segmento).

### OUT

Ver sección **Out of scope**.

## Out of scope

- `/`
- `/admin`, `/admin/login`, `/admin/*`
- `/super-admin/*`
- `/api/*`
- `/admin/manifest.webmanifest`
- `public/sw.js`
- `app/admin/layout.tsx`, `lib/admin/pwa-manifest.ts`
- Apple-touch-icon tenant / admin
- OpenGraph / Twitter / social metadata
- Sufijos de title (`· Catálogo`, `· Checkout`, `Pedido recibido ·`, `· OrderOps`)
- Cache-bust avanzado de favicon (backlog opcional)
- DB / RPC / actions / packages
- Checkout logic / `create_order` / WhatsApp
- CSS / UI / rutas nuevas
- Cambiar `app/layout.tsx` branding global (salvo que IMPL demuestre necesidad mínima de composition; preferencia: **no tocar** root)

## Current metadata model

| Superficie | Fuente | Title | Icons |
|------------|--------|-------|-------|
| Global | `app/layout.tsx` | `OrderOps` | `/favicon.ico?v=2`, `/icon.png?v=2` (192), shortcut |
| Admin | `app/admin/layout.tsx` | default + template `%s \| OrderOps` | apple + manifest PWA |
| Tenant `/b/[slug]` | hereda root | OrderOps | OrderOps |
| `generateMetadata` tenant | **no existe** | — | — |

Layout tenant ya carga negocio:

```text
app/b/[slug]/layout.tsx
  → getRequestPublicBusiness(slug)
  → PublicBusinessHeader
```

Sin override de metadata hoy.

## Target metadata model

Solo en segmento `app/b/[slug]`:

```text
generateMetadata({ params })
  → await params.slug
  → getRequestPublicBusiness(slug)
  → Metadata {
      title: business.name,
      icons: logo_url ? tenant : OrderOps fallback
    }
```

No setear: `apple`, `manifest`, `openGraph`, `twitter`, `applicationName` PWA.

Root y admin **sin cambios**.

## Title contract

```text
title = business.name
```

Ejemplos válidos:

```text
La Burguesía
```

Prohibido en IMPL:

```text
La Burguesía · Catálogo
La Burguesía · Checkout
Pedido recibido · La Burguesía
La Burguesía · OrderOps
OrderOps | La Burguesía
```

Motivo: marca blanca limpia; foco en el negocio (decisión **1A**).

Misma title en landing, catálogo, checkout y success.

## Favicon contract

Cuando `business.logo_url` es string no vacío (tras trim):

```ts
icons: {
  icon: [{ url: business.logo_url }],
  shortcut: [{ url: business.logo_url }]
}
```

Reglas:

- Usar `logo_url` **tal cual** (URL absoluta Storage object pública — ya es el formato en prod).
- No pasar por Image Transformations / render URL para metadata.
- No setear `apple`, `manifest`, `openGraph.images`, `twitter.images`.
- No tocar archivos en `public/icons/orderops-admin-*`.

## Fallback contract

Cuando `logo_url` es `null`, vacío o solo whitespace:

```ts
icons: {
  icon: [
    { url: "/favicon.ico?v=2", type: "image/x-icon" },
    { url: "/icon.png?v=2", type: "image/png", sizes: "192x192" }
  ],
  shortcut: [{ url: "/favicon.ico?v=2" }]
}
```

Alineado con `app/layout.tsx` actual (`shortcut` puede emitirse como array de un ítem; equivalente funcional al string root).

Title en fallback de icons: **sigue siendo** `business.name` (el negocio existe; solo falta logo).

## Data source

Fuente recomendada (única):

```text
app/b/[slug]/layout.tsx
  export async function generateMetadata({ params })
    → const { slug } = await params
    → const business = await getRequestPublicBusiness(slug)
    → title / icons desde business.name / business.logo_url
```

Validación código:

| Check | Evidencia |
|-------|-----------|
| React `cache` | `getRequestPublicBusiness = cache(async (slug) => requirePublicBusinessBySlug(slug))` en `get-public-business.ts` |
| Datos tagged | `require` → `getPublicBusinessBySlug` → `getCachedPublicBusinessStable` (`unstable_cache` + tag `public-business:{slug}`) |
| Invalid slug | `requirePublicBusinessBySlug` → `notFound()` |
| Dedup con layout | Layout ya llama el mismo helper; `generateMetadata` + layout en el mismo request comparten `cache()` |

Campos usados: `PublicBusiness.name`, `PublicBusiness.logo_url` (`lib/business/public.ts`).

No introducir query nueva de branding. No cargar catálogo solo por metadata.

## Invalid slug behavior

Contrato elegido (alineado al layout actual):

```text
Usar getRequestPublicBusiness(slug) en generateMetadata.
Si el negocio no existe / no activo → notFound() (mismo path que el layout).
```

Justificación:

1. El layout **ya** dispara `notFound()` vía el mismo helper; metadata no debe diverger.
2. React `cache` evita doble trabajo de branding en el mismo request.
3. No inventar metadata OrderOps “fantasma” para un slug que la UI tampoco renderiza.
4. No rompe build: `notFound` en `generateMetadata` es el patrón App Router; slug inválidos son runtime, no compile-time.

`app/not-found.tsx` permanece sin metadata propia → hereda OrderOps root (aceptable, P3).

**No** usar en IMPL un getter nullable paralelo solo para metadata, salvo bug demostrado de `notFound` + metadata (fuera de expectativa actual).

## Preview iframe behavior

```text
- /b/{slug}/catalogo|checkout?orderopsPreview=1 → document iframe puede mostrar title/favicon tenant.
- Pestaña padre /admin/(protected)/products/preview → OrderOps vía app/admin/layout.tsx (sin cambios).
- No tocar: CatalogPreviewShell, cookie preview, CSP frame-ancestors, checkout guard preview.
```

Decisión **3A** — aceptado.

## Admin / PWA boundary

**P0 — no modificar en IMPL:**

| Archivo / ruta | Motivo |
|----------------|--------|
| `app/admin/layout.tsx` | Metadata + apple + manifest admin |
| `lib/admin/pwa-manifest.ts` | Nombre/icons/scope OrderOps |
| `app/admin/manifest.webmanifest` (route) | PWA install |
| `public/sw.js` | Push admin |
| `public/icons/orderops-admin-*` | Icons PWA |
| `/`, `/super-admin/*`, `/api/*` | Plataforma / no tenant |

Cualquier diff en estos paths = **bloqueo de release**.

## Cache and invalidation

### MVP (fase IMPL) — decisión **6A**

- Emitir `logo_url` sin query de cache-bust.
- QA obligatoria en **incógnito** y **hard refresh**.
- Si el admin sube logo con **nuevo path** Storage → favicon nuevo naturalmente.
- Si el path de logo **no cambia** y solo se sobrescribe el objeto → el navegador puede mostrar favicon viejo temporalmente (aceptado en MVP).

### Invalidación server (ya existe)

- Settings públicas llaman `revalidatePublicCatalogCache({ scope: "business", slug })`.
- Tag `public-business:{slug}` + `revalidatePath(/b/{slug})`.
- `generateMetadata` que lea vía `getCachedPublicBusinessStable` / `getRequestPublicBusiness` se beneficia de esa invalidación para **name/logo_url** en HTML nuevo.

### Backlog opcional

```text
PUBLIC-TENANT-BROWSER-BRANDING-FAVICON-CACHE-BUST-1
```

Solo si post-MVP el favicon stale es dolor real de soporte.

## Risks

| Riesgo | Severidad | Mitigación | En scope IMPL |
|--------|-----------|------------|---------------|
| Tocar metadata root/admin por error | P0 | Diff solo `app/b/[slug]/layout.tsx` (+ docs); review boundary | Prevenir |
| Alterar PWA admin / SW / manifest | P0 | Hard boundary; no tocar archivos listados | Prevenir |
| Fallback ausente si `logo_url` null | P1 | Contrato fallback OrderOps explícito | Sí |
| Favicon cache viejo en browser | P2 | QA incógnito/hard refresh; backlog cache-bust | Documentar |
| Logo pesado / no cuadrado | P2 | Aceptado MVP; polish futuro | No (MVP) |
| Supabase transform 403 | P2 | Usar object URL (`logo_url` tal cual); no render loader | Sí |
| Extra fetch en metadata | P2 | Reusar `getRequestPublicBusiness` + cache tagged | Sí |
| Invalid slug | P3 | `notFound()` consistente con layout | Sí |
| Iframe preview title/favicon tenant | P3 | Aceptado (3A); pestaña padre intacta | Aceptar |
| Title hydration mismatch | P3 | Solo SSR metadata; no `document.title` client hoy | N/A |
| OG/social incompleto | P3 | Fuera de scope (8A) | Out |

**Blockers para IMPL:** ninguno.

## Implementation recommendation

Fase siguiente: **PUBLIC-TENANT-BROWSER-BRANDING-IMPL-1**

Sin escribir código en esta fase — checklist para IMPL:

1. Agregar `generateMetadata` **solo** en `app/b/[slug]/layout.tsx`.
2. Reutilizar `getRequestPublicBusiness(slug)` (mismo que el layout default).
3. `title = business.name` (string limpio; sin template OrderOps).
4. Si `logo_url` trim no vacío → `icons.icon` + `icons.shortcut` = esa URL.
5. Else → fallback icons OrderOps (`/favicon.ico?v=2`, `/icon.png?v=2`).
6. No `apple` / no `manifest` / no OG / no Twitter.
7. No tocar admin, PWA, SW, root layout (preferido), DB, checkout, `create_order`, CSS, rutas.
8. Verificar TypeScript `Metadata` sin `any`.
9. No actualizar living memory salvo cambio estructural acordado en IMPL (metadata de segmento público).

Archivos esperados en diff IMPL:

```text
M app/b/[slug]/layout.tsx
(+ docs de IMPL/QA si la fase lo pide)
```

## QA plan for implementation

### Browser (local y/o preview/prod según fase)

| URL | Expectativa title | Expectativa favicon |
|-----|-------------------|---------------------|
| `/b/demohamburgueseria` | `La Burguesía` (o name real) | logo_url si existe |
| `/b/demohamburgueseria/catalogo` | mismo name | mismo |
| `/b/demohamburgueseria/checkout` | mismo name | mismo |
| `/b/demohamburgueseria/success?order_id=invalid` | mismo name | mismo |
| `/` | `OrderOps` | OrderOps icons |
| `/admin/login` | `OrderOps` | OrderOps / apple+manifest admin |

### Checks

```js
document.title
Array.from(document.querySelectorAll(
  'link[rel~="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'
)).map((el) => ({
  rel: el.rel,
  href: el.href,
  type: el.type,
  sizes: el.sizes?.value
}))
```

Adicional:

- Pestaña visual (icono + título).
- Hard refresh + ventana incógnito.
- Tenant sin `logo_url` (si hay fixture) → fallback OrderOps icons + title = name.
- Admin login / dashboard: **no** title/favicon tenant.
- Preview admin: pestaña padre OrderOps; iframe puede ser tenant.
- `create_order`: 0 / sin pedidos reales / sin WhatsApp real.

## Release plan

Cola posterior (respetando **10A** — commit + push + deploy production):

```text
1. PUBLIC-TENANT-BROWSER-BRANDING-IMPL-1
2. PUBLIC-TENANT-BROWSER-BRANDING-QA-1   (puede fusionarse en IMPL si el paquete es chico)
3. PUBLIC-TENANT-BROWSER-BRANDING-COMMIT-DEPLOY-1
   → commit en branch
   → push
   → deploy / promote production (mismo flujo que rediseño público)
```

Variante empaquetada aceptable:

```text
1. PUBLIC-TENANT-BROWSER-BRANDING-IMPL-1   (incluye QA browser mínima)
2. PUBLIC-TENANT-BROWSER-BRANDING-DEPLOY-1 (= commit + push + prod)
```

Gates intermedios: IMPL no deploya; COMMIT-DEPLOY no arranca sin IMPL+QA PASS.

Backlog no bloqueante:

```text
PUBLIC-TENANT-BROWSER-BRANDING-FAVICON-CACHE-BUST-1
```

## Gate

```text
QUEUE_GATE: PUBLIC-TENANT-BROWSER-BRANDING-IMPL-1 = ALLOWED
QUEUE_GATE: PUBLIC-TENANT-BROWSER-BRANDING-COMMIT-DEPLOY-1 = PAUSED_UNTIL_IMPL
QUEUE_GATE: PUBLIC-CATALOG-SUCCESS-EDGE-STATES-POLISH-1 = OPTIONAL
QUEUE_GATE: PUBLIC-ORDERS-PUBLIC-CODE-SPEC-1 = BACKLOG
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-* = PAUSED
```

```text
SPEC COMPLETE — TENANT BROWSER BRANDING READY FOR IMPL
```
