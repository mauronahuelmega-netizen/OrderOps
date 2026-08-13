# PUBLIC-CATALOG-MVP-ENTRY-ROUTING-IMPL-1

## Estado

```text
PASS WITH QA DEBT — PUBLIC CATALOG MVP ENTRY ROUTING IMPL-1 COMPLETE
```

## Contexto

Implementa `PUBLIC-CATALOG-MVP-ENTRY-ROUTING-SPEC-1` — Option D hybrid catalog-first.

Base: `3d83afd` on `cursor-handoff-public-catalog-ui-redesign`. Motion block cerrado; no se reabre.

## Scope

**IN**

- Readiness helper (`hasReadyPublicCatalog`)
- `/b/[slug]` redirect ready / fallback not-ready
- Minimal fallback home + module CSS
- WhatsApp inquiry helper gated
- Header: remove visible “Home”
- Preserve long landing unused as primary entry
- Impl doc

**OUT**

- Checkout / success / create_order
- Motion
- DB migrations / publish flag
- Delete landing / new landing route
- Packages / product data / admin mutations

## Implementation

```text
requirePublicBusinessBySlug (Case A notFound)
  → hasReadyPublicCatalog(business.id)
    → true:  redirect(`/b/${slug}/catalogo` + safe searchParams)
    → false: PublicBusinessFallbackHome + inquiry WA if valid
```

## Files changed

| File | Change |
|------|--------|
| `app/b/[slug]/page.tsx` | Catalog-first entry: redirect / fallback |
| `lib/business/public-catalog-readiness.ts` | **New** readiness helper |
| `lib/whatsapp/public.ts` | `buildPublicBusinessInquiryWhatsappUrl` |
| `components/public/business/public-business-fallback-home.tsx` | **New** fallback UI |
| `components/public/business/public-business-fallback-home.module.css` | **New** module styles |
| `components/public/business/public-business-header.tsx` | Remove Home nav item |
| `docs/public-catalog-mvp-entry-routing-impl-1.md` | This doc |
| `docs/CURRENT_PHASE.md` | Phase gate |

Untouched (forbidden): checkout, success, catalog components, cart, supabase, motion, packages, `business-landing-page.tsx`, `layout.tsx`, globals landing CSS.

## Readiness helper

`lib/business/public-catalog-readiness.ts` → `hasReadyPublicCatalog(businessId)`:

- Reuses `loadPublicCatalogByBusinessId` (same filters as public catalog).
- Ready iff ≥1 product `is_available` whose `category_id` is in business categories.
- **Does not** read `on_demand_mode_active` / store session.

## Entry route behavior

`app/b/[slug]/page.tsx`:

1. `getRequestPublicBusiness(slug)` → inactive/missing → `notFound()`
2. Ready → `redirect()` 307 to `/b/${slug}/catalogo` (+ preserved searchParams)
3. Not-ready → `PublicBusinessFallbackHome`
4. No `BusinessLandingPage` mount

Verified: `GET /b/demohamburgueseria` → `307 Location: /b/demohamburgueseria/catalogo`.

## Minimal fallback home

Copy ES-AR locked from spec. Module CSS with semantic tokens. Logo or initial placeholder. WA CTA only when `whatsappUrl` non-null.

## Header / navigation

- Brand href remains `/b/${slug}`
- Visible nav: **Catálogo** only (no Home)
- Verified in menu sheet: only “Catálogo Ver productos…”

## WhatsApp CTA

`buildPublicBusinessInquiryWhatsappUrl` returns `null` for empty/null numbers; never builds empty `wa.me/`.

`buildPublicOrderWhatsappUrl` unchanged (success intact).

## Long landing disposition

`BusinessLandingPage` remains in repo; **no imports** from `app/` after this change. Globals `.business-landing-*` preserved as future asset.

## Validation

| Check | Result |
|-------|--------|
| `tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `git diff --check` | PASS |
| `npm run lint` | P3 tooling ESLint 9 circular (non-blocking) |

## Browser QA

| Case | Result |
|------|--------|
| `/b/demohamburgueseria` → `/catalogo` | PASS (307 + products) |
| UTM preserve | PASS (`?utm_source=instagram&utm_campaign=mvp`) |
| Direct `/catalogo` | PASS |
| `/checkout` | PASS (empty cart UX, no submit) |
| `/success?order_id=invalid` | PASS |
| `/b/no-existe` | PASS (404) |
| Header no Home | PASS |
| Brand → entry → catalog | PASS |
| Tenant title | PASS (`La Burguesía`) |
| Root/admin titles | PASS (`OrderOps`) |
| Not-ready tenant browser | **P3 debt** — no real empty-catalog tenant without DB mutation |
| WA empty CTA | PASS (helper unit: `null`) |
| Store-closed ≠ not-ready | PASS by code (helper ignores `on_demand`) |

## Safety

```text
create_order: 0
pedidos reales: 0
WhatsApp real: 0
DB writes: 0
DB/RPC/actions/packages: 0
checkout submit: 0
secrets: 0
motion files changed: 0
```

## Risks / Debt

| ID | Severity | Note |
|----|----------|------|
| Not-ready tenant browser QA | P3 | No demo tenant without products; fallback compiled + helper proven |
| Long landing dead-code asset | Info | Intentional preserve |
| Extra redirect hop via brand | P3 | Accepted per spec |
| ESLint 9 circular | P3 tooling | Known |

No P0/P1/P2.

## Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-MVP-ENTRY-ROUTING-QA-1 = ALLOWED
QUEUE_GATE: PUBLIC-CATALOG-MVP-ENTRY-ROUTING-COMMIT-DEPLOY-1 = PAUSED_UNTIL_QA_OR_ACCEPTED_DEBT
QUEUE_GATE: PUBLIC-CATALOG-MVP-ENTRY-ROUTING-IMPL-1 = COMPLETE_WITH_QA_DEBT
QUEUE_GATE: PUBLIC-CATALOG-MVP-ENTRY-ROUTING-SPEC-1 = COMPLETE
QUEUE_GATE: PUBLIC-CATALOG-MVP-ENTRY-ROUTING-AUDIT-1 = COMPLETE
QUEUE_GATE: PUBLIC-CATALOG-MOTION-PUBLIC-CATALOG-COMPLETE = COMPLETE
QUEUE_GATE: PUBLIC-CATALOG-SUCCESS-EDGE-STATES-POLISH-1 = OPTIONAL
QUEUE_GATE: PUBLIC-TENANT-BROWSER-BRANDING-FAVICON-CACHE-BUST-1 = BACKLOG_OPTIONAL
QUEUE_GATE: PUBLIC-ORDERS-PUBLIC-CODE-SPEC-1 = BACKLOG
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-* = PAUSED
```
