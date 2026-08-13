# PUBLIC-CATALOG-MVP-ENTRY-ROUTING-SPEC-1

## Estado

```text
SPEC COMPLETE — PUBLIC CATALOG MVP ENTRY ROUTING READY FOR IMPL
```

## Executive summary

V1/MVP entry público del negocio pasa a **Option D — Hybrid catalog-first**:

- negocio activo + catálogo listo → `redirect` a `/b/[slug]/catalogo`;
- negocio activo + catálogo no listo → home mínima (fallback);
- slug inexistente / negocio inactivo → `notFound()`;
- landing larga (`BusinessLandingPage`) **preservada** fuera del path principal.

No se tocan `/catalogo`, `/checkout`, `/success`, motion, DB schema, admin publish flags ni `create_order`.

## Source audit

Fuente: `docs/public-catalog-mvp-entry-routing-audit-1.md` @ branch `cursor-handoff-public-catalog-ui-redesign` / HEAD `3d83afd`.

Confirmado en re-lectura de código (sin cambios desde audit):

| Fact | Evidence |
|------|----------|
| `/b/[slug]` = `BusinessLandingPage` | `app/b/[slug]/page.tsx` |
| No `redirect()` hoy | same |
| Tenant gate = `slug` + `is_active` | `lib/catalog/public-cached-data.ts` |
| Catalog products = `is_available = true` | `lib/catalog/public.ts` |
| Store acceptance ≠ catalog ready | `on_demand_mode_active` overlay only |
| Metadata in layout | `app/b/[slug]/layout.tsx` |
| Header Home → `/b/[slug]`, Catálogo → `/catalogo` | `public-business-header.tsx` |
| Landing WA helper local, ungated | `business-landing-page.tsx` |
| Success WA shared helper | `lib/whatsapp/public.ts` |

## Product decision

```text
PUBLIC ENTRY MVP = HYBRID CATALOG-FIRST
```

Definición:

```text
La home pública del negocio deja de ser una landing educativa larga para negocios listos.
El catálogo se vuelve la entrada principal.
La landing larga se preserva como asset futuro de presencia pública, pero sale del path principal MVP.
```

## Route contract

### Unchanged routes

```text
GET /b/[slug]/catalogo   — unchanged behavior
GET /b/[slug]/checkout   — unchanged behavior
GET /b/[slug]/success    — unchanged behavior
```

### Entry route `GET /b/[slug]`

| Case | Condition | Response |
|------|-----------|----------|
| **A** | Slug inexistente **o** business no resuelto / inactive (`requirePublicBusinessBySlug` → `notFound`) | `notFound()` |
| **B** | Business activo **y** `PublicCatalogReady === true` | Server `redirect()` → `/b/${slug}/catalogo` (+ searchParams seguros) |
| **C** | Business activo **y** `PublicCatalogReady === false` | Render **minimal fallback home** (nuevo componente) |

Orden de evaluación en `app/b/[slug]/page.tsx`:

1. Resolver business (`getRequestPublicBusiness` / `requirePublicBusinessBySlug`) — Case A si falla.
2. Evaluar readiness helper — Case B redirect o Case C fallback.
3. **No** montar `BusinessLandingPage` como entry principal.

## Readiness predicate

### Definition (MVP)

```text
PublicCatalogReady =
  public business resolved (is_active gate already satisfied by resolver)
  AND sellableCatalogHasVisibleProducts === true
```

### Semantic match with public catalog (mandatory)

El helper **debe** usar la misma semántica de visibilidad que el catálogo público, no un conteo paralelo distinto.

Fuente canónica de filas:

- Reutilizar `loadPublicCatalogByBusinessId(businessId)` **o** un query equivalente que filtre:
  - `products.business_id = businessId`
  - `products.is_available = true`
  - categories del mismo `business_id` (mismo criterio que `lib/catalog/public.ts`)

**Ready = true** solo si, con esas filas, existiría al menos un producto visible en el catálogo:

```text
categoriesWithProducts.length >= 1
```

donde `categoriesWithProducts` = categorías del negocio que tienen ≥1 producto `is_available` (misma derivación que `CatalogClient`).

**Ready = false** cuando:

- 0 categorías, o
- 0 productos disponibles, o
- productos disponibles pero ninguno asignado a una categoría del negocio (no serían visibles).

### Implementation notes for IMPL-1

```text
- Helper server-only: lib/business/public-catalog-readiness.ts (nombre sugerido)
- Prefer lightweight existence check (limit/head) that mirrors the same filters
- OR reuse cached catalog stable loader and derive boolean — acceptable if cost is OK
- No migrations
- No new DB flag
- No schema changes
- No checkout/create_order
```

### Explicitly forbidden as readiness inputs

```text
NO on_demand_mode_active / store session closed
NO admin Public Presence readiness
NO logo required
NO WhatsApp required
NO landing hero / cover / description required
NO Instagram required
```

## Redirect behavior

```text
Mechanism: Next.js App Router server redirect() from app/b/[slug]/page.tsx
Type: temporary runtime redirect (default Next redirect() behavior — not a static rewrite)
Destination: only internal path `/b/${slug}/catalogo`
```

### Search params

```text
Preserve incoming searchParams when present and safe.
Example:
  /b/demo?utm_source=instagram → /b/demo/catalogo?utm_source=instagram
```

### Security

```text
- No external destination
- No redirectTo / returnUrl / next query param trusted as destination
- Build path only from validated slug + fixed suffix `/catalogo`
- Do not open redirect vectors
```

### Brand click loop

Brand href permanece en `/b/[slug]`:

- ready → redirect a catalog (un hop extra aceptable);
- not-ready → fallback (sin loop).

## Minimal fallback home

### When

Case C: business activo + `PublicCatalogReady === false`.

### Component (IMPL-1)

```text
components/public/business/public-business-fallback-home.tsx
components/public/business/public-business-fallback-home.module.css
```

Usar tokens semánticos + module CSS (regla de estilos del repo). No agregar estilos de componente a `globals.css` / `theme-tokens.css`.

### Copy ES-AR (locked)

**Con WhatsApp válido:**

```text
Eyebrow: Pedido online
H1:     Estamos preparando el catálogo online
Body:   Muy pronto vas a poder ver los productos y armar tu pedido desde acá.
        Mientras tanto, podés consultar directamente por WhatsApp.
CTA:    Consultar por WhatsApp
```

**Sin WhatsApp válido:**

```text
Eyebrow: Pedido online
H1:     Estamos preparando el catálogo online
Body:   Muy pronto vas a poder ver los productos y armar tu pedido desde acá.
        Volvé a intentar más tarde.
CTA:    (none)
```

### Copy rules

```text
- No usar “Próximamente” como H1
- No error técnico / stack / 500 copy
- No decir que el negocio está cerrado
- No horarios / disponibilidad / “abrimos a las…”
- No mencionar OrderOps en el mensaje principal
```

### Visual MVP

```text
IN:
- Logo o placeholder (inicial)
- Nombre del negocio
- Eyebrow + H1 + body corto
- CTA WhatsApp solo si número válido

OUT:
- Secciones “Cómo funciona”
- “Pedido sin vueltas”
- Showcase/cover obligatorio
- Instagram required
- Grid de cards educativas
- Botón “Ver catálogo” (no hay catálogo listo)
```

## Header / navigation behavior

### Locked decision

```text
- Remover/ocultar el nav item visible “Home” en MVP.
- Mantener nav item “Catálogo” → /b/${slug}/catalogo.
- Mantener brand/logo href → /b/${slug}
  (ready → redirect; not-ready → fallback).
- Header no necesita conocer readiness para el brand href.
```

### Rationale

Evita deep-link a landing larga; mantiene fallback accesible vía brand; Catálogo sigue siendo destino explícito.

### Optional alternative (not preferred)

Apuntar brand directo a `/catalogo` solo si IMPL demuestra ausencia de mismatch con Case C (usuarios not-ready perderían acceso fácil al fallback). **Spec recomienda brand → `/b/[slug]`.**

### Files

```text
components/public/business/public-business-header.tsx
components/public/business/public-business-header.module.css (solo si hace falta ocultar Home)
```

## WhatsApp CTA behavior

### Fallback CTA gate

```text
Show CTA iff normalizedDigits.length > 0
where normalizedDigits = whatsapp_number.replace(/[^\d]/g, "")
```

Si no válido → no renderizar CTA (no `wa.me/` vacío, no botón disabled confuso).

### Shared helper (IMPL-1)

Agregar en `lib/whatsapp/public.ts`:

```text
buildPublicBusinessInquiryWhatsappUrl(params: {
  businessName: string;
  whatsappNumber: string;
}): string | null
```

Comportamiento:

- normalize digits;
- si `length === 0` → `null`;
- else → `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
- message: `Hola, quiero consultar por el catálogo de {businessName}.`

### Compatibility

```text
- Do NOT change buildPublicOrderWhatsappUrl behavior unless a bug blocks compile
- Do NOT break success page
- Do NOT auto-open / auto-send WhatsApp
- Landing local helper may remain unused after entry change; do not rewrite landing WA in MVP unless touching landing file for other reasons (prefer leave landing frozen)
```

## Metadata / branding

```text
Do NOT modify app/b/[slug]/layout.tsx unless strictly required for compile.
```

Layout ya provee:

- `title = business.name`
- icons tenant `logo_url` o fallback OrderOps

Redirect `/b/[slug]` → `/catalogo` **preserva** metadata del layout en la ruta destino.

### Out of this implementation

```text
- Open Graph / canonical
- Favicon cache bust
- Admin branding
- Root/admin layouts
```

## Long landing disposition

```text
BusinessLandingPage + .business-landing-* CSS remain in the repo.
They are NOT the MVP primary entry.
```

### Do not (IMPL-1)

```text
- delete component
- delete globals landing CSS
- move to new public route
- add feature flag
- add admin setting
```

### Why

Asset futuro para Public Presence / sitio público configurable.

## Implementation scope

### Next phase

```text
PUBLIC-CATALOG-MVP-ENTRY-ROUTING-IMPL-1
```

### IN

- Server readiness helper (`PublicCatalogReady`)
- `/b/[slug]` Case B redirect / Case C fallback
- Minimal fallback home + module CSS
- WhatsApp inquiry helper + gated CTA
- Header: hide/remove visible “Home”
- Preserve `BusinessLandingPage` unused as primary entry
- Local QA ready/not-ready when possible
- Impl doc

### OUT

- Checkout / `create_order` / Success
- Motion reopen
- DB migrations / publish flag
- Deleting landing / new landing route
- SEO OG/canonical / favicon cache bust
- Package changes / product data changes
- Admin settings changes

## Files expected in implementation

### Expected

```text
app/b/[slug]/page.tsx
components/public/business/public-business-header.tsx
components/public/business/public-business-header.module.css
components/public/business/public-business-fallback-home.tsx          (new)
components/public/business/public-business-fallback-home.module.css  (new)
lib/business/public-catalog-readiness.ts                             (new)
lib/whatsapp/public.ts
docs/public-catalog-mvp-entry-routing-impl-1.md                      (new)
```

### Only if proven necessary

```text
app/b/[slug]/layout.tsx
components/public/business/business-landing-page.tsx
```

### Forbidden

```text
app/b/[slug]/checkout/*
app/b/[slug]/success/*
components/public/catalog/*
lib/cart/*
supabase/*
types/database.ts
package.json
lockfiles
motion overlay files
```

## Validation plan

### Technical

```text
tsc --noEmit
npm run build
git diff --check
npm run lint
```

Lint: ESLint 9 circular JSON/config-validator = P3 tooling known, non-blocking. Real code lint errors = block.

### Diff hygiene (IMPL-1)

Solo archivos del scope. Restaurar `tsconfig.tsbuildinfo` si aparece.

## QA plan

| # | Case | Expected |
|---|------|----------|
| 1 | Ready tenant `demohamburgueseria` `/b/demohamburgueseria` | Lands on `/catalogo` (redirect) |
| 2 | Direct `/catalogo` | Loads as today |
| 3 | `/checkout` | Unchanged load |
| 4 | `/success?order_id=invalid` | Unchanged soft success |
| 5 | Invalid slug `/b/no-existe` | `notFound` |
| 6 | Not-ready tenant | Fallback mínimo; si no hay tenant real → **P3 QA debt** + unit/helper proof |
| 7 | WhatsApp missing/empty | CTA hidden; si no simulable sin DB → **P3 QA debt** + helper unit proof |
| 8 | Header | No visible “Home” to long landing; Catálogo accessible; brand → `/b/[slug]` |
| 9 | Branding | Tenant title/favicon preserved; root/admin OrderOps |
| 10 | Store closed + products available | **Still redirect to catalog** (not fallback) |
| 11 | Search params | UTM preserved on redirect when present |
| 12 | Deep-link `/catalogo` empty | Existing empty panels still OK |

## Safety constraints

```text
create_order: 0
pedidos reales: 0
WhatsApp real: 0
DB writes: 0
DB/RPC/actions/packages: 0
checkout submit: 0
secrets: 0
motion reopen: 0
```

No auto-send WhatsApp. No product/config/admin data mutations for QA.

## Risks / mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| No public catalog publish flag | P3 | Ready = visible available products; document future flag as backlog |
| Product-based ready ≠ future commercial “published” intent | P3 | Spec gap accepted for MVP; admin publish flag = later epic |
| Brand href causes extra redirect hop when ready | P3 | Acceptable; prefer vs losing fallback access |
| No real not-ready tenant for browser QA | P3 | Helper/unit proof + document QA debt; do not invent DB fixtures in IMPL |
| `whatsapp_number` typed required but empty string possible | P3 | Gate via normalized digits; helper returns `null` |
| Store closed confused with not-ready | P1 if mis-impl | Forbidden in readiness; QA case #10 |
| Long landing becomes dead code | Info | Preserve intentionally for presence; no delete |
| SEO/OG/canonical out of scope | P3 preexisting | Explicit OUT; not blocking entry |
| Readiness mismatch vs catalog visibility | P1 if wrong query | Mandate same filters + categoriesWithProducts semantics |
| Header CSS/globals coupling | P3 | Prefer module CSS; hide Home without globals edits |

## Explicitly out of scope

- Runtime changes in **this** SPEC phase (docs only)
- Checkout / success / create_order
- Motion
- DB migrations / RLS / RPC
- Admin publish setting
- Deleting or re-routing long landing
- Open Graph / canonical / favicon cache-bust
- Packages / lockfiles
- Product seed / demo data changes
- Commit / push / deploy in SPEC phase

## Next implementation phase

```text
PUBLIC-CATALOG-MVP-ENTRY-ROUTING-IMPL-1 = ALLOWED
```

IMPL must follow this spec without reopening motion or checkout. Living memory update deferred to IMPL closeout / release.

## Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-MVP-ENTRY-ROUTING-IMPL-1 = ALLOWED
QUEUE_GATE: PUBLIC-CATALOG-MVP-ENTRY-ROUTING-SPEC-1 = COMPLETE
QUEUE_GATE: PUBLIC-CATALOG-MVP-ENTRY-ROUTING-AUDIT-1 = COMPLETE
QUEUE_GATE: PUBLIC-CATALOG-MOTION-PUBLIC-CATALOG-COMPLETE = COMPLETE
QUEUE_GATE: PUBLIC-CATALOG-SUCCESS-EDGE-STATES-POLISH-1 = OPTIONAL
QUEUE_GATE: PUBLIC-TENANT-BROWSER-BRANDING-FAVICON-CACHE-BUST-1 = BACKLOG_OPTIONAL
QUEUE_GATE: PUBLIC-ORDERS-PUBLIC-CODE-SPEC-1 = BACKLOG
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-* = PAUSED
```
