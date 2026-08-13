# PUBLIC-CATALOG-MVP-ENTRY-ROUTING-AUDIT-1

## Estado

```text
AUDIT COMPLETE — PUBLIC CATALOG MVP ENTRY ROUTING READY FOR SPEC
```

## Executive summary

Hoy `/b/[slug]` renderiza una **landing larga** (`BusinessLandingPage`) y el catálogo vive en `/b/[slug]/catalogo`. No hay redirect catalog-first. El tenant público se resuelve por `slug` + `businesses.is_active = true`; sin ese match → `notFound()`.

**No existe** un flag de “catálogo publicado” en runtime público. El catálogo lista productos con `is_available = true`. Si no hay categorías/productos, el propio catálogo ya muestra empty states suaves (“El catálogo todavía no está listo” / “Todavía no hay productos disponibles”).

La landing actual es visualmente prolija pero agrega fricción pre-producto (scroll + secciones “Cómo funciona” / “Pedido sin vueltas” que explican el canal más que el menú). Para MVP, el código **sí permite** una transición segura a **catalog-first híbrido** sin tocar checkout/`create_order`/motion, con cambios acotados en entry routing + header nav + definición explícita de readiness.

## Product question

¿Para V1/MVP, `/b/[slug]` debe ir directo al catálogo cuando hay productos disponibles, y mostrar una home mínima solo cuando el catálogo no está listo — diferiendo la landing larga?

## Current public route inventory

| Route | Current behavior | Data dependencies | Empty/error state | MVP risk | Recommendation |
|-------|------------------|-------------------|-------------------|----------|----------------|
| `/b/[slug]` | SSR `BusinessLandingPage` (landing larga) | `requirePublicBusinessBySlug` → `is_active` business | Missing/inactive slug → `notFound()`; logo/WhatsApp incompletos degradan UI pero no bloquean | Fricción pre-catálogo alta | Redirect a `/catalogo` si ready; fallback mínimo si no |
| `/b/[slug]/catalogo` | `PublicCatalogPageContent` → `CatalogClient` | Business + categories + `products.is_available` + live `on_demand_mode_active` | Empty panels si 0 categorías / 0 productos; search empty; invalid slug → `notFound()` | Bajo — ya es destination principal | Mantener como destino MVP |
| `/b/[slug]/checkout` | `CheckoutClient` con business | `requirePublicBusinessBySlug`; cart client-side | Empty cart handled in client; no create_order en esta audit | Bajo si entry cambia | No tocar en entry routing |
| `/b/[slug]/success` | Success panel + WhatsApp CTA | Business + optional `order_id` query | Sin `order_id` aún muestra success soft + WA CTA | Bajo | No tocar |
| Layout `/b/[slug]/layout.tsx` | Header + `generateMetadata` | Same public business | Icons fallback OrderOps si no logo | Medio: brand link → Home | Ajustar nav/brand si catalog-first |
| Tenant resolve | `getRequestPublicBusiness` (React `cache`) → `lib/business/public.ts` | `businesses` + `business_settings` + fresh ordering status | `null` → `notFound()` | Bajo | Reutilizar; no inventar segundo resolver |

**Hallazgos de routing:**

- No hay `redirect()` en `app/b/[slug]/page.tsx` hoy.
- Metadata (title = `business.name`, icons tenant/fallback) vive en el **layout** y aplica a todas las subrutas `/b/[slug]/*`.
- Header nav: **Home** → `/b/${slug}`, **Catálogo** → `/b/${slug}/catalogo`; logo brand también apunta a Home.

## Current landing/home inventory

| Item | Location | Notes |
|------|----------|-------|
| Page entry | `app/b/[slug]/page.tsx` | Solo monta landing |
| Component | `components/public/business/business-landing-page.tsx` | Server component |
| CSS | `app/globals.css` (`.business-landing-*`) | No module CSS |
| Header | `components/public/business/public-business-header.tsx` + `.module.css` | Shared across public routes |
| Hero | Logo/placeholder, eyebrow “Pedido online”, `h1` name, description | Description fallback genérico OrderOps-ish |
| Primary CTA | “Ver catálogo” → `/b/${slug}/catalogo` | Correct destination |
| Secondary CTA | “Consultar por WhatsApp” | Local `buildBusinessWhatsappUrl` (no shared lib) |
| Sections | “Cómo funciona” (3 steps), “Pedido sin vueltas” (3 cards), bottom CTA card | Contenido educativo / canal |
| Optional | Instagram link, cover image | Soft optional |
| Logo missing | Initial letter placeholder | OK |
| WhatsApp missing | No gate — `wa.me/` con digits vacíos posibles | Risk |

**Producto / fricción:**

- Indispensable para pedir: nombre, acceso al catálogo (y WhatsApp opcional de consulta).
- Explica más el **canal OrderOps** que el menú del negocio: steps “pedido claro / confirmación WhatsApp”.
- Diferible para fase presencia pública: secciones largas, showcase cover, copy “Más claro para vos…”.
- Reutilizable en fallback mínimo: brand block (logo/name), soft “preparando catálogo”, CTA WhatsApp si hay número.

## Current catalog readiness model

### What exists today

| Signal | Meaning | Used for public entry? |
|--------|---------|------------------------|
| `businesses.is_active` | Tenant visible públicamente | **Yes** — gate de existencia (`eq("is_active", true)`) |
| `products.is_available` | Producto listable en catálogo | **Yes** — catalog query filter |
| Categories present | Taxonomy | Empty copy if none |
| `on_demand_mode_active` | Live order acceptance (store session) | Overlay fresco — **NO** es “catálogo listo” |
| Admin Public Presence readiness | Identidad / Landing / Catálogo hero / Publicación URL | **Admin-only** — no gatea runtime público |
| Catalog published flag | — | **Does not exist** in public runtime |

### Readiness matrix (audit)

| Condition | Current handling | Desired MVP handling | Missing data/flag | Risk |
|-----------|------------------|----------------------|-------------------|------|
| 1. Slug inexistente | `notFound()` | Keep `notFound()` | — | Low |
| 2. Activo + productos disponibles | Landing larga → CTA catálogo | Redirect `/catalogo` | Need shared “ready” predicate | Low |
| 3. Activo sin productos / sin categorías | Landing igual; catálogo empty panels | Minimal fallback en `/b/[slug]` (no fingir catálogo lleno) | Define ready = `products.length > 0` (o categoriesWithProducts) | Medium — must not use store-closed |
| 4. Sin WhatsApp | CTA igual; `wa.me/` frágil | Fallback: ocultar CTA o deshabilitar | No nullable in types (`string`) but empty string possible | Medium UX |
| 5. Sin logo | Placeholder letter / OrderOps icons | Keep | — | Low |
| 6. Catálogo “oculto/no publicado” | No flag público | Treat as not-ready via empty products **or** future flag | No publication flag | Spec must choose |
| 7. Checkout sin carrito | Client empty cart UX | Unchanged | — | Low |
| 8. Success `order_id` inválido/ausente | Soft success + WA | Unchanged | — | Low |
| Store cerrado (`on_demand` false) | Catálogo sigue accesible | **No** tratar como not-ready | Confusion if conflated | High if mis-specified |

**Demo tenant:** histórico QA (`demohamburgueseria`) tiene productos disponibles — ready para catalog-first.

## WhatsApp CTA audit

| Surface | Helper | Message | Gate if missing |
|---------|--------|---------|-----------------|
| Landing | Local `buildBusinessWhatsappUrl` in `business-landing-page.tsx` | “Hola, quiero hacer una consulta sobre el catálogo.” | None |
| Success | `lib/whatsapp/public.ts` → `buildPublicOrderWhatsappUrl` | OrderOps confirmation + optional order id | None |
| Catalog | No primary “Consultar por WhatsApp” on landing path | — | — |

**Findings:**

- Número desde `businesses.whatsapp_number` (required string in schema/types).
- Normalización: strip non-digits → `https://wa.me/${cleaned}?text=…`.
- Lógica **duplicada** landing vs success (mensajes distintos).
- Fallback mínimo **puede** reutilizar `lib/whatsapp/public.ts` o un helper de consulta compartido; hoy landing no lo usa.
- Riesgo: número vacío/`""` → `wa.me/` inválido sin UI feedback.

## Metadata / branding audit

| Surface | Title | Icons |
|---------|-------|-------|
| `/b/[slug]/*` (layout) | `business.name` | Tenant `logo_url` or OrderOps `/favicon.ico?v=2` + `/icon.png?v=2` |
| Root `/` | OrderOps | Platform icons |
| `/admin/login` | OrderOps | Platform/admin |

**Impact if `/b/[slug]` redirects to `/catalogo`:**

- Metadata layout sigue aplicando — title/favicon tenant **se preservan**.
- No hay Open Graph/canonical específicos documentados en layout público (gap preexistente, no bloquea MVP entry).
- Branding phase (`PUBLIC-TENANT-BROWSER-BRANDING-*`) permanece BACKLOG_OPTIONAL; esta audit no la toca.

## UX MVP assessment

1. **¿Ayuda a vender o retrasa?** Retrasa: el cliente quiere ver productos; la landing exige un click + scroll educativo.
2. **Indispensable:** identidad del negocio + camino al catálogo (+ WhatsApp opcional).
3. **Explica OrderOps más que el negocio:** steps “pedido claro / confirmación WhatsApp / catálogo fácil”.
4. **Diferible:** secciones largas, showcase, copy de canal.
5. **Negocio listo:** ir directo al catálogo.
6. **Negocio no listo:** home mínima — “Estamos preparando el catálogo online” + WA si existe (alinear con empty copy ya usada en catálogo).
7. **Evitar “producto incompleto”:** copy de preparación/servicio, no error técnico ni 404.
8. **“Próximamente”:** **no** usarlo como título principal. Preferir copy ya probada (“todavía no está listo” / “preparando…”). “Próximamente” como eyebrow opcional solo si la spec lo pide explícitamente.

## Options evaluated

| Option | MVP conversion | Impl risk | Tenant readiness | SEO/branding | Maintenance | Extensibility |
|--------|----------------|-----------|------------------|--------------|-------------|---------------|
| **A — Always redirect to catalog** | High when ready | Low | Weak when empty catalog (lands on empty panel) | OK (layout metadata) | Low | Weak for presence |
| **B — Minimal home always** | Medium | Medium | Good messaging | OK | Medium (new surface) | Good |
| **C — Keep current landing** | Low | None | Landing ignores empty products | OK | Low | Landing already presence asset |
| **D — Hybrid catalog-first** | **Highest** | Low–medium | Redirect if products; minimal fallback if not | OK | Low | Landing preservable / flaggable |

## Recommended MVP direction

```text
Option D — Hybrid catalog-first

- Active/ready business (is_active + ≥1 available product):
  /b/[slug] → redirect → /b/[slug]/catalogo

- Not-ready business (is_active but 0 available products / no sellable catalog):
  /b/[slug] → minimal fallback home
  (“Estamos preparando el catálogo online” + WhatsApp CTA if number present)

- Current long landing:
  remove from primary MVP path / nav as “Home”;
  preserve component/CSS as future public presence asset
  (optional feature flag later — out of MVP impl unless SPEC says otherwise)

- Inactive / unknown slug:
  keep notFound()
```

**Why (evidence):**

- Catálogo ya es el funnel real (checkout/success apuntan a `/catalogo`).
- Empty states de catálogo ya existen; readiness puede basarse en productos disponibles sin migración.
- Store closed ≠ not ready — no mezclar `on_demand_mode_active`.
- Landing larga no está ligada a create_order/motion; diferirla es seguro.
- No se encontró bloqueo fuerte en código que impida Option D.

## Implementation impact estimate

### Option D (recommended)

| Area | Likely touch | Notes |
|------|--------------|-------|
| Entry | `app/b/[slug]/page.tsx` | `redirect()` when ready; else minimal UI |
| Readiness helper | New small pure helper under `lib/catalog/` or `lib/business/` | `products.length > 0` via existing catalog loader — **no migration** |
| Fallback UI | New compact component **or** slimmed landing variant | Prefer new minimal component; don’t delete long landing yet |
| Header | `public-business-header.tsx` | Brand/Home href → `/catalogo` when ready; hide or relabel Home |
| WhatsApp | Prefer shared helper; gate empty number | Don’t touch success/`create_order` |
| CSS | New `.module.css` for fallback (project rule) | Avoid expanding globals unless necessary |
| Admin readiness | Optional later align | Not required for MVP redirect |
| Checkout/success | **No** | Explicitly out |
| Motion | **No** | Block closed |
| DB/RPC/packages | **No** | |

**Tests needed:** slug 404; ready redirect 307/308; not-ready fallback; WA hidden if empty; header links; catalog empty still works if deep-linked; metadata title/icons; store-closed still reaches catalog.

**Rollback:** easy — revert page.tsx/header; landing files preserved.

**Admin setting:** not required for V1 if ready = available products; optional later “force landing” flag.

## Risks / unknowns

| ID | Severity | Note |
|----|----------|------|
| No public “published catalog” flag | P3/spec | Use product availability; document gap for future flag |
| WhatsApp empty → bad `wa.me` | P3 | Gate CTA in fallback/landing paths |
| Conflating store-closed with not-ready | P1 if mis-spec’d | Spec must forbid |
| Header “Home” semantics after redirect | P3 | Update nav copy/targets in SPEC |
| Admin presence “ready” ≠ public products | Info | Admin checklist is branding/hero, not inventory |
| Canonical/OG sparse | P3 preexisting | Not blocking entry routing |
| Long landing CSS in globals | Info | Preserve; don’t expand for MVP fallback if avoidable |
| Handoff docs still uncommitted | Info | Preflight dirty tree = motion handoff docs only (allowed) |

## Explicitly out of scope

- Runtime/CSS/routing changes in this audit phase
- Motion reopen
- Checkout / `create_order` / WhatsApp success message changes (unless future SPEC)
- DB migrations / admin publish flag (unless SPEC requires)
- Favicon cache-bust
- Maps / address
- Deleting landing assets
- Commit / push / deploy

## Suggested next spec

```text
PUBLIC-CATALOG-MVP-ENTRY-ROUTING-SPEC-1
```

Spec should lock:

1. Ready predicate = `is_active` business + ≥1 `is_available` product (confirm exact query reuse).
2. Redirect semantics (temporary vs permanent; preserve query string?).
3. Fallback copy ES-AR (avoid “Próximamente” as H1).
4. Header/brand link behavior.
5. WhatsApp CTA gating.
6. Fate of long landing (preserve unlinked vs flag).
7. Explicit non-goals: motion, checkout, DB.

## Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-MVP-ENTRY-ROUTING-SPEC-1 = ALLOWED
QUEUE_GATE: PUBLIC-CATALOG-MVP-ENTRY-ROUTING-AUDIT-1 = COMPLETE
QUEUE_GATE: PUBLIC-CATALOG-MOTION-PUBLIC-CATALOG-COMPLETE = COMPLETE
QUEUE_GATE: PUBLIC-CATALOG-SUCCESS-EDGE-STATES-POLISH-1 = OPTIONAL
QUEUE_GATE: PUBLIC-TENANT-BROWSER-BRANDING-FAVICON-CACHE-BUST-1 = BACKLOG_OPTIONAL
QUEUE_GATE: PUBLIC-ORDERS-PUBLIC-CODE-SPEC-1 = BACKLOG
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-* = PAUSED
```
