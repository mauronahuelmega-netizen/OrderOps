# PUBLIC-CATALOG-MVP-ENTRY-ROUTING-QA-1

## Estado

```text
QA COMPLETE WITH ACCEPTED P3 FALLBACK DEBT — PUBLIC CATALOG MVP ENTRY ROUTING QA-1 PASSED
```

## Contexto

Formal QA closeout for `PUBLIC-CATALOG-MVP-ENTRY-ROUTING-IMPL-1` (Option D hybrid catalog-first).

- Branch: `cursor-handoff-public-catalog-ui-redesign`
- HEAD: `3d83afd` (+ uncommitted IMPL-1 runtime + prior docs)
- Local base: `http://localhost:3000`
- Tenant ready: `demohamburgueseria` / La Burguesía
- No runtime/CSS/routing/DB/product/admin/checkout/success/motion mutations in this phase
- No commit / push / deploy

## Preflight

| Check | Result |
|-------|--------|
| Branch | `cursor-handoff-public-catalog-ui-redesign` |
| HEAD | `3d83afd` |
| Dirty tree | IMPL-1 runtime + prior docs only (expected) |
| Unexpected runtime/CSS/package/DB outside IMPL-1 | None |
| `tsconfig.tsbuildinfo` | Restored if touched |

IMPL-1 expected paths present:

- `M app/b/[slug]/page.tsx`
- `M components/public/business/public-business-header.tsx`
- `M lib/whatsapp/public.ts`
- `?? lib/business/public-catalog-readiness.ts`
- `?? components/public/business/public-business-fallback-home.tsx`
- `?? components/public/business/public-business-fallback-home.module.css`
- `?? docs/public-catalog-mvp-entry-routing-impl-1.md`

Code inspection:

- `/b/[slug]/page.tsx` does **not** mount `BusinessLandingPage` (0 imports under `app/`)
- `hasReadyPublicCatalog` uses `loadPublicCatalogByBusinessId` only
- `buildPublicOrderWhatsappUrl` unchanged; success still imports it
- checkout / `create_order` / `components/public/catalog` absent from IMPL diffs

## Technical validation

| Check | Result |
|-------|--------|
| `tsc --noEmit` | PASS (`tsc_exit=0`) |
| `npm run build` | PASS (`build_exit=0`; `/b/[slug]` dynamic route present) |
| `git diff --check` | PASS |
| `npm run lint` | P3 tooling — ESLint 9 circular JSON/config-validator (non-blocking; no new code lint findings) |

## HTTP redirect QA

Tool: `curl.exe -sI` (PowerShell `Invoke-WebRequest -MaximumRedirection 0` falsely reported 200; curl is authoritative).

| Case | Result |
|------|--------|
| `GET /b/demohamburgueseria` | **307** `Location: /b/demohamburgueseria/catalogo` |
| `GET …?utm_source=instagram&utm_campaign=mvp` | **307** `Location: /b/demohamburgueseria/catalogo?utm_source=instagram&utm_campaign=mvp` |
| `GET …?redirectTo=https://evil.example&next=https://evil.example` | **307** to same-origin `/catalogo?redirectTo=…&next=…` (params preserved as query only; **no** external hop) |
| `GET /b/no-existe` | **404** (no Location to catalog) |

## Browser QA

| Case | Result |
|------|--------|
| Follow `/b/demohamburgueseria` | Lands on `/b/demohamburgueseria/catalogo`; products visible; title `La Burguesía`; no long landing |
| UTM follow | URL = `/catalogo?utm_source=instagram&utm_campaign=mvp` |
| Open-redirect params follow | Stays on `localhost` `/catalogo?redirectTo=…&next=…`; never `evil.example` |
| Brand click (`href=/b/demohamburgueseria`) | Remains/returns on `/catalogo` via ready redirect |

## Route regression QA

| Route | Result |
|-------|--------|
| Direct `/b/demohamburgueseria/catalogo` | PASS — products, header, FAB/cart path intact |
| `/b/demohamburgueseria/checkout` | PASS — empty cart UX (“Tu pedido está vacío”); no submit; no `create_order` |
| `/success?order_id=invalid` | PASS — loads; manual “Confirmar por WhatsApp” link; no auto-send |
| `/b/no-existe` | PASS — “Página no encontrada” (404 / notFound); no false fallback |

## Header / nav QA

On `/b/demohamburgueseria/catalogo` (DOM + menu sheet anchors):

- No visible/textual **Home** (`hasHomeText: false`)
- **Catálogo** present → `/b/demohamburgueseria/catalogo`
- Brand → `/b/demohamburgueseria`
- Staff link remains internal (`/admin/login`) — not primary catalog path
- No primary-nav link to long landing

## Not-ready fallback QA

### Tenant search (read-only)

Docs/code only surface ready pilot `demohamburgueseria`. No documented public active tenant with empty catalog suitable for browser QA without DB/product mutation.

```text
P3 ACCEPTED — Not-ready browser QA unavailable without DB/product mutation.
```

### Code evidence (required)

| Evidence | Status |
|----------|--------|
| `hasReadyPublicCatalog` → `false` when categories/products empty or no matching available product | PASS (`public-catalog-readiness.ts`) |
| `page.tsx` renders `PublicBusinessFallbackHome` when not ready | PASS |
| Fallback H1 copy | `Estamos preparando el catálogo online` |
| No “Ver catálogo” CTA on fallback | PASS |
| WA CTA only if `whatsappUrl` truthy | PASS |
| Fallback module CSS present; build includes entry route | PASS |

## WhatsApp CTA QA

`tsx` local unit (no network send):

| Input | Result |
|-------|--------|
| `whatsappNumber: ""` | `null` |
| `whatsappNumber: null` | `null` |
| `+54 9 11 1234-5678` | `https://wa.me/5491112345678?text=…` |
| Empty `wa.me/` | Not produced |
| `buildPublicOrderWhatsappUrl` | Still exported/functioning |

Success page still imports `buildPublicOrderWhatsappUrl` — unchanged path.

## Store-closed readiness guard

```text
rg on_demand_mode_active|store_session|store_sessions in:
  lib/business/public-catalog-readiness.ts → 0
  app/b/[slug]/page.tsx → 0
```

Comment-only note in readiness file: “Does NOT consider store-session / on_demand”. Header still uses `on_demand_mode_active` for **open-dot UX only** — outside readiness decision.

**PASS** — store closed ≠ not-ready.

## Metadata / branding QA

| Surface | Title | Result |
|---------|-------|--------|
| `/b/demohamburgueseria/catalogo` | La Burguesía | PASS |
| `/` | OrderOps | PASS (browser) |
| `/admin/login` | OrderOps | PASS (HTTP title probe; no admin interaction) |

Public layout / favicon behavior not modified in this QA phase.

## Network / safety

```text
create_order hits: 0
pedidos reales: 0
WhatsApp real: 0
DB writes: 0
DB/RPC/actions/packages changes: 0
checkout submit: 0
motion files changed: 0
secrets logged: 0
tokens/API keys logged: 0
```

## Findings

| ID | Severity | Finding |
|----|----------|---------|
| F1 | Pass | Ready entry 307 → catalog; no long landing |
| F2 | Pass | SearchParams / UTM preserved on redirect |
| F3 | Pass | `redirectTo`/`next` external values never used as redirect target |
| F4 | Pass | Catalog / checkout / success / 404 regressions clear |
| F5 | Pass | Header without Home; brand → entry redirect |
| F6 | Info/P3 | Not-ready browser path not exercised on real tenant |
| F7 | P3 tooling | ESLint 9 circular config validator (preexisting) |

No P0 / P1 / P2.

## Risks / Debt

| ID | Severity | Note | Disposition |
|----|----------|------|-------------|
| Not-ready browser QA | P3 | No empty-catalog public tenant without DB mutation | **ACCEPTED** for commit/deploy |
| Extra brand hop | P3 | Spec-accepted redirect via `/b/[slug]` | Accepted |
| ESLint 9 circular | P3 tooling | Known; non-blocking | Accepted |
| Long landing asset unused | Info | Preserved intentionally | N/A |

## Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-MVP-ENTRY-ROUTING-COMMIT-DEPLOY-1 = ALLOWED_WITH_ACCEPTED_P3_FALLBACK_DEBT
QUEUE_GATE: PUBLIC-CATALOG-MVP-ENTRY-ROUTING-QA-1 = COMPLETE_WITH_ACCEPTED_P3_FALLBACK_DEBT
QUEUE_GATE: PUBLIC-CATALOG-MVP-ENTRY-ROUTING-IMPL-1 = COMPLETE_WITH_ACCEPTED_P3_FALLBACK_DEBT
QUEUE_GATE: PUBLIC-CATALOG-MVP-ENTRY-ROUTING-SPEC-1 = COMPLETE
QUEUE_GATE: PUBLIC-CATALOG-MVP-ENTRY-ROUTING-AUDIT-1 = COMPLETE
QUEUE_GATE: PUBLIC-CATALOG-MOTION-PUBLIC-CATALOG-COMPLETE = COMPLETE
QUEUE_GATE: PUBLIC-CATALOG-SUCCESS-EDGE-STATES-POLISH-1 = OPTIONAL
QUEUE_GATE: PUBLIC-TENANT-BROWSER-BRANDING-FAVICON-CACHE-BUST-1 = BACKLOG_OPTIONAL
QUEUE_GATE: PUBLIC-ORDERS-PUBLIC-CODE-SPEC-1 = BACKLOG
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-* = PAUSED
```
