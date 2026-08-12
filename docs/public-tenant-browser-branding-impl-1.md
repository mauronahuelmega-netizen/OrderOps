# PUBLIC-TENANT-BROWSER-BRANDING-IMPL-1

## Estado

```text
PASS — TENANT BROWSER BRANDING IMPLEMENTED
```

Branch: `cursor-handoff-public-catalog-ui-redesign` @ `6aa3bed` (+ working tree changes)
Refs: `docs/public-tenant-browser-branding-routes-audit-1.md`, `docs/public-tenant-browser-branding-spec-1.md`

## Contexto

Rutas públicas `/b/[slug]/*` heredaban metadata OrderOps del root. IMPL agrega `generateMetadata` en el layout del segmento para title/favicon del negocio, sin tocar admin/PWA/root.

## Scope

**IN:** `app/b/[slug]/layout.tsx` + este doc.

**OUT:** root layout, admin/PWA/SW, DB/RPC/actions/packages, checkout/`create_order`, CSS, OG/Twitter, apple-touch tenant, commit/push/deploy.

## Implementation

En `app/b/[slug]/layout.tsx`:

1. `ORDEROPS_FALLBACK_BROWSER_ICONS` — mismos paths que root (`/favicon.ico?v=2`, `/icon.png?v=2`).
2. `buildTenantBrowserIcons(logoUrl)` — trim; si hay URL → icon + shortcut tenant; else fallback.
3. `generateMetadata` — `await params` → `getRequestPublicBusiness(slug)` → `{ title: business.name, icons }`.
4. Default layout sin cambios de UI; misma llamada al helper (React `cache` dedupe).

Sin `force-dynamic`, sin `revalidate` nuevo, sin fetch extra de catálogo, sin apple/manifest/OG/Twitter/`applicationName`/template OrderOps.

## Files changed

| File | Change |
|------|--------|
| `app/b/[slug]/layout.tsx` | +`generateMetadata` + helpers icons |
| `docs/public-tenant-browser-branding-impl-1.md` | este doc (nuevo) |

Untracked previos (no tocados en runtime): audit + spec docs.

## Metadata contract

```text
title = business.name
```

Ejemplo verificado: `La Burguesía` en landing, catalogo, checkout, success, preview query.

Sin sufijos de página.

## Favicon contract

Con `logo_url` no vacío:

```text
icons.icon = [{ url: logo_url.trim() }]
icons.shortcut = [{ url: logo_url.trim() }]
```

Verificado local (`demohamburgueseria`):

```text
https://pkrsedmwxekbhlohhqds.supabase.co/storage/v1/object/public/business-assets/.../logo/...png
```

Sin `<link rel="apple-touch-icon">` tenant nuevo.

## Fallback behavior

Si `logo_url` null/empty/whitespace → OrderOps icons (`favicon.ico?v=2` + `icon.png?v=2`).

**QA fixture sin logo:** no ejecutada — no hay tenant fixture sin logo en entorno local; **no** se creó/modificó DB. Código implementa el branch de fallback; deuda P3 opcional para QA-1 con fixture.

## Admin / PWA boundary

Post-IMPL `git diff` vacío en:

- `app/layout.tsx`
- `app/admin/layout.tsx`
- `lib/admin/pwa-manifest.ts`
- `public/sw.js`
- `public/icons`
- `app/admin`
- `app/super-admin`

Admin login local: title `OrderOps`, apple-touch admin + sin logo tenant en icons.

Root `/`: title `OrderOps`, icons OrderOps.

## Validation

| Check | Resultado |
|-------|-----------|
| `tsc --noEmit` | PASS (exit 0) |
| `npm run build` | PASS (exit 0) |
| `git diff --check` | PASS (exit 0) |
| `npm run lint` | P3 tooling — ESLint 9 circular JSON/config-validator (conocido); no code regression nueva |
| Boundary admin/root/PWA | PASS — sin diff |

## Browser QA

Local `http://localhost:3000` — sin submit checkout, sin pedidos, sin WhatsApp.

| URL | title | icons |
|-----|-------|-------|
| `/b/demohamburgueseria` | La Burguesía | logo Supabase |
| `/b/demohamburgueseria/catalogo` | La Burguesía | logo Supabase |
| `/b/demohamburgueseria/checkout` | La Burguesía | logo Supabase |
| `/b/demohamburgueseria/success?order_id=invalid` | La Burguesía | logo Supabase |
| `/b/demohamburgueseria/catalogo?orderopsPreview=1` | La Burguesía | logo Supabase (document preview) |
| `/` | OrderOps | OrderOps favicon/icon |
| `/admin/login` | OrderOps | apple-touch admin (sin logo tenant) |

Browser CDP/snapshot catalogo: Page Title **La Burguesía**.

Hard refresh / cache: documentado — favicon remoto puede requerir hard refresh/incógnito (SPEC 6A). HTML SSR emite href correcto en cada response.

Fallback sin logo: no ejecutado (sin fixture) — ver Risks.

## Safety

```text
create_order: 0
pedidos reales: 0
WhatsApp real: 0
DB writes: 0
secrets: 0
commit: 0
push: 0
deploy: 0
```

## Risks / Debt

| Item | Sev | Notas |
|------|-----|-------|
| Favicon browser cache | P2 aceptado MVP | QA hard refresh/incógnito en deploy |
| Fixture sin logo no QA’d | P3 | Backlog opcional QA-1; código cubre fallback |
| ESLint 9 circular config | P3 | Tooling debt preexistente |
| Logo no cuadrado / pesado | P2 aceptado | SPEC |

## Gate

```text
QUEUE_GATE: PUBLIC-TENANT-BROWSER-BRANDING-COMMIT-DEPLOY-1 = ALLOWED
QUEUE_GATE: PUBLIC-TENANT-BROWSER-BRANDING-IMPL-1 = COMPLETE
QUEUE_GATE: PUBLIC-TENANT-BROWSER-BRANDING-QA-1 = OPTIONAL
QUEUE_GATE: PUBLIC-CATALOG-SUCCESS-EDGE-STATES-POLISH-1 = OPTIONAL
QUEUE_GATE: PUBLIC-ORDERS-PUBLIC-CODE-SPEC-1 = BACKLOG
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-* = PAUSED
```

```text
PASS — TENANT BROWSER BRANDING IMPLEMENTED
```
