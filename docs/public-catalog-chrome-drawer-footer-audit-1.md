# PUBLIC-CATALOG-CHROME-DRAWER-FOOTER-AUDIT-1

## Estado

```text
AUDIT COMPLETE / READY FOR IMPLEMENTATION
```

**Fecha:** 2026-08-15
**Scope:** Audit only — no runtime / CSS / commit / push / deploy

---

## Executive summary

Dos superficies independientes:

| Surface | Owner | CSS owner | Mount |
|---------|-------|-----------|-------|
| Nav drawer | `PublicBusinessHeader` | mostly `app/globals.css` (`.public-business-header__*`) | `app/b/[slug]/layout.tsx` |
| Tenant footer | **recommend** `CatalogClient` end of `<main className="catalog-page">` | new `.module.css` or small globals catalog block | catalog route only |

**Phasing recommendation:** **TWO MICROPHASES** (drawer ≠ footer owners/blast radius).

**OrderOps link:** same-origin marketing root **`/`** exists (`app/page.tsx`). Absolute external marketing domain = optional product decision later — **does not block drawer**; footer can ship with `href="/"`.

---

## 1. Drawer — current architecture

### Owners

| Role | Location |
|------|----------|
| Component | `components/public/business/public-business-header.tsx` |
| Module CSS (header shell only) | `components/public/business/public-business-header.module.css` — **does not own sheet geometry** |
| Sheet / overlay / portal CSS | `app/globals.css` — `.public-business-header__portal`, `__overlay`, `__sheet`, utilities, dark, MQ |
| Mount root | `app/b/[slug]/layout.tsx` → `<PublicBusinessHeader />` sibling of content |
| Scroll lock | `usePublicOverlayScrollLock(isMenuOpen)` → `public-overlay-scroll-lock.ts` |
| Theme | `ThemeToggle` inside sheet + `data-catalog-theme` on `html` |
| Staff | `Link` → `/admin/login` |
| Catalog nav | `Link` items from `navigationItems` (Catálogo, etc.) |

### Structure

```
header (menu button)
div.public-business-header__portal   [fixed inset 0, z-index 34]
  button.overlay                     [absolute inset 0]
  div.sheet role="dialog" aria-modal [absolute; slides from right]
    header (title + close)
    stack (nav + utilities: Instagram?, theme, Staff)
```

### Measured geometry (effective cascade)

Base block (~2055) then override “compact flat” (~2610) then desktop MQ `@media (min-width: 768px)` (~2853):

| Property | Mobile (effective) | Desktop ≥768px |
|----------|--------------------|----------------|
| `position` | `absolute` (inside fixed portal) | same |
| `top` | `max(10px, env(safe-area-inset-top))` | `14px` |
| `right` | `max(10px, env(safe-area-inset-right))` | `max(14px, calc((100vw - 1080px) / 2))` |
| `bottom` | `max(10px, env(safe-area-inset-bottom))` | `14px` |
| `width` | **`min(86vw, 360px)`** | `min(420px, calc(100vw - 28px))` |
| height | `min/max-height: calc(100dvh - safe insets)` | inherits + top/bottom margins |
| `border-radius` | **`22px` all corners** | same unless overridden |
| `padding` | `14px` | inherits |
| `overflow` | sheet `hidden`; stack `overflow-y: auto` | same |
| backdrop | overlay `rgba(15,18,24,0.28)`; portal full viewport | slight blur only in reduced-transparency MQ path |
| `z-index` | portal `34` | same |
| open motion | `transform: translateX(calc(100% + 22px))` → `0` | same |

**Current visual read:** floating card with inset margins on all sides + uniform radius — matches product complaint (“card/modal grande flotante”).

### Viewport / safe-area today

- Portal: `position: fixed; inset: 0` (correct full-viewport chrome host).
- Sheet: **outer margins** via top/right/bottom + **100dvh**-based min/max-height.
- Safe areas applied as **panel inset**, not content padding — this is why the drawer never flushes to the right edge.
- No `100svh` on this surface. Catalog page uses `min-height: 100vh` elsewhere (unrelated).

### A11y / focus (must preserve)

| Behavior | Present |
|----------|---------|
| `role="dialog"` + `aria-modal="true"` | YES |
| `aria-labelledby` title | YES |
| Escape closes | YES |
| Focus trap (Tab cycle) | YES |
| Initial focus → close button | YES |
| Focus return → menu button | YES (cleanup) |
| Overlay click closes | YES (`tabIndex={-1}`) |
| `aria-expanded` / `aria-controls` on menu button | YES |
| Scroll lock while open | YES |
| Pathname change closes | YES |

**Risk if touched naively:** changing portal/sheet DOM nesting, removing `role`/`aria-*`, or breaking `menuSheetRef` / focusable query selector.

---

## 2. Drawer — recommendation

### A1. Full-height strategy

**Prefer: pin to portal edges**

```text
top: 0; right: 0; bottom: 0; left: auto;
/* height implicit from top+bottom */
```

**Why over standalone `height: 100dvh`:**
- Portal is already `fixed; inset: 0` — filling it is the natural full-viewport strategy.
- Avoids double-subtracting safe-area + dvh math that currently creates floating margins.
- Works with Android Chrome / iOS dynamic toolbars **without** trying to paint under browser chrome (panel stays in layout viewport / portal).
- Internal scroll remains on `.public-business-header__sheet-stack` (`overflow-y: auto`, `overscroll-behavior: contain`).

Optional keep `100dvh` only as fallback if top/bottom pinning regresses a specific WebView — not first choice.

### A2. Width

| Viewport | Current `min(86vw,360)` | Proposed `min(82vw, 348px)` |
|----------|-------------------------|----------------------------|
| 360 | ~310 | ~295 |
| 390 | ~335 | ~320 |
| 412 | ~354 | ~338 |

**Recommendation:** `width: min(82vw, 348px);`

Rationale:
- Slightly narrower than today (86vw / 360 max) without starving Staff two-line row (~56px min-height, icon + copy).
- Cap **348px** keeps desktop/tablet from feeling like a second page; still room for theme row.
- Avoid `80vw` on 360 (~288) — workable but tighter for Staff description.

Desktop MQ must **stop** re-widening to 420px + side margins if the goal is a consistent edge drawer; use same formula or `min(82vw, 360px)` max.

### A3. Radius

```text
border-radius: 22px 0 0 22px; /* TL BR? → top-left, top-right, bottom-right, bottom-left */
/* desired: TL + BL only → 22px 0 0 22px */
```

- Keep radius token **22px** (current compact value) unless design asks otherwise.
- Overlay is full-bleed — no competing rounded wrapper.
- Portal has no radius — OK.
- Confirm open transform offset (`100% + 22px`) still clears; may reduce to `100%` once flush (margin gone).

### A4. Safe areas

Move safe-area from **outer position insets** to **inner padding**:

```text
padding-top: max(14px, env(safe-area-inset-top));
padding-right: max(14px, env(safe-area-inset-right));
padding-bottom: max(14px, env(safe-area-inset-bottom));
padding-left: 14px; /* or keep asymmetric if needed */
```

Panel flush to edges; content clears notch/home indicator. Do **not** invent browser-UI coverage hacks.

### A5. A11y

Visual-only CSS change is sufficient if TSX structure stays. **Do not** change dialog semantics, focus trap, Escape, or scroll lock in the visual polish phase unless a bug appears.

### Files expected (drawer)

| Class | Files |
|-------|--------|
| **MUST TOUCH** | `app/globals.css` (`.public-business-header__sheet` + desktop MQ + possibly open transform) |
| **MAY TOUCH** | `public-business-header.tsx` only if class/token rename or transform constant needs sync — prefer CSS-only |
| **DO NOT TOUCH** | `public-overlay-scroll-lock.ts`, ThemeToggle logic, Staff/nav hrefs, ProductCard, modals, checkout |

---

## 3. Footer — data architecture

### Render owner (B1) — **ONE recommendation**

**`CatalogClient`** — last child of `<main className="catalog-page">`, **after** `.catalog-content` / groups, **before** `CartBar` / sheets / modals.

| Option | Verdict |
|--------|---------|
| `CatalogClient` | **YES** — has `business`, catalog scroll root, `--with-cart` class already |
| `PublicCatalogPageContent` | Possible wrapper, but footer styles belong with catalog page tokens; client already owns layout |
| `app/b/[slug]/layout.tsx` | **NO** — would appear on checkout/success; product asked for catalog end |
| Header | **NO** |

### Business name (B2)

| Field | Status |
|-------|--------|
| `business.name` | **Customer-facing SoT** — typed on `PublicBusiness`; used in header brand, hero alt |
| `display_name` | **Does not exist** on `PublicBusiness` |
| Demo hardcode | Forbidden |

Prop already passed: `CatalogClient` receives `business={pageData.business}` — **no new fetch**.

### Year (B3)

- Safe: `new Date().getFullYear()` inside client footer (SSR + hydrate same calendar year in practice).
- Preferable purity: compute in `PublicCatalogPageContent` (server) and pass `copyrightYear={new Date().getFullYear()}` — zero mismatch risk.
- Either is acceptable; **recommend server-passed year** if adding a tiny presentational child, else client year in `CatalogClient` is fine.

### OrderOps URL (B4)

| Candidate | Evidence |
|-----------|----------|
| Same-origin `/` | `app/page.tsx` — OrderOps marketing landing (problems/solution/benefits) |
| `https://orderops.vercel.app` | Production app host (docs) — same app, not a separate brand site config |
| Dedicated env `NEXT_PUBLIC_ORDEROPS_MARKETING_URL` | **Not found** |

**Resolution:** use **`href="/"`** (relative) — IDENTIFIED in-repo.
If product later wants an external marketing domain → env/config decision; **not required to ship footer**.

### Additional fetch

**NO.**

---

## 4. Footer — recommendation

### B5. Copy

**Recommend variant A:**

`© {year} {business.name} · Pedidos online · Hecho con OrderOps™`

- Keeps “Pedidos online” as soft category cue without noise.
- B is fine if product wants shorter; A matches stated conceptual example.

`OrderOps` (or `OrderOps™`) = link text → `/`.

### B6. Visual treatment

Reuse catalog tokens (no new tokens unless gap appears):

| Need | Token / pattern |
|------|-----------------|
| Muted text | `var(--catalog-muted)` |
| Optional hairline | `1px solid var(--catalog-border)` top only |
| Page bg continuity | inherit `catalog-page` bg — **no card, no shadow, no glass** |
| Link | muted → slightly stronger on hover/focus-visible; use existing focus-visible patterns |
| Dark | already via `.catalog-page[data-theme="dark"]` / `html[data-catalog-theme="dark"]` |
| Size | ~12–13px; centered; 1–2 lines wrap on ~360px |
| Spacing | top margin ~24–32px; horizontal padding aligned with page `14px` |

Prefer **co-located** `public-catalog-footer.module.css` (project modular CSS rule) over dumping into globals unless matching an existing globals catalog footer pattern (none today).

### B7. Cart FAB coexistence

| Fact | Detail |
|------|--------|
| FAB | `cart-bar.module.css` — `position: fixed; right/bottom: max(14px, safe-area);` ~52px; `z-index: 9` |
| Page clearance | `.catalog-page--with-cart { padding-bottom: 100px; }` (≥720px: 118px) when `cartCount > 0` |
| FAB visibility | `count <= 0` → `null` |

**Recommendation:** place footer **inside** `.catalog-page` so existing `--with-cart` padding already clears the FAB. **No dynamic footer offset state.**

Optional static extra `padding-bottom` on footer itself (~8–12px) for breathing room when cart empty — cosmetic only. Do **not** subscribe to cart count for footer layout unless QA shows collision (unlikely given 100px page pad).

---

## 5. Risks

| ID | Severity | Note |
|----|----------|------|
| Drawer desktop MQ reintroduces margins/width 420 | **P1** | Must update `@media (min-width: 768px) .public-business-header__sheet` in same polish or mobile-only “flush” will regress on tablet |
| Safe-area moved to padding — content under notch if forgotten | **P1** | Explicit padding-top/bottom with `env(safe-area-inset-*)` |
| Transform offset `100% + 22px` with flush edge | **P2** | May look like a gap on close animation; tune to `100%` |
| Focus trap / dialog semantics broken if TSX edited carelessly | **P1** | Prefer CSS-only drawer phase |
| Footer in layout leaks to checkout | **P1** | Keep in catalog client only |
| OrderOps™ trademark display | **P3** | Copy/legal product preference |
| Year SSR edge at Dec 31 / Jan 1 | **P3** | Negligible; server-pass year if pedantic |

No P0 found for audit scope.

---

## 6. Blast radius

### Drawer

| Class | Items |
|-------|--------|
| **MUST TOUCH** | `app/globals.css` (sheet geometry + ≥768px sheet overrides) |
| **MAY TOUCH** | `public-business-header.tsx` (only if animation constant / class); docs |
| **DO NOT TOUCH** | scroll-lock, ProductCard, category sticky, modals, checkout, cart schema, DB, RLS, admin |

### Footer

| Class | Items |
|-------|--------|
| **MUST TOUCH** | `catalog-client.tsx` (render site); new `public-catalog-footer.tsx` + `.module.css` (recommended) |
| **MAY TOUCH** | `public-catalog-page.tsx` (pass `copyrightYear`); types none |
| **DO NOT TOUCH** | layout (all `/b/[slug]` routes), header drawer, checkout, cart FAB logic, DB |

---

## 7. Phasing

### Recommended: **TWO MICROPHASES**

1. **`PUBLIC-CATALOG-NAV-DRAWER-VISUAL-POLISH-1`**
   CSS-first flush side-sheet; preserve a11y; update mobile + desktop MQ.

2. **`PUBLIC-CATALOG-TENANT-FOOTER-1`**
   Catalog-only footer with `business.name`, year, link to `/`.

**Why not one phase:** different owners (`header` globals vs `catalog-client`), independent QA (drawer open/close vs scroll-to-end + FAB), and footer URL/copy can iterate without blocking drawer visual close.

### Alternative one phase

Only if delivery pressure demands a single PR — still keep file touch sets isolated in review.

---

## 8. Implementation readiness

| Track | Status |
|-------|--------|
| Drawer | **READY** |
| Footer | **READY** (OrderOps URL = `/`) |
| Blocked? | **Not blocked.** Optional later product decision only if external marketing URL is required instead of `/`. |

### Suggested concrete tokens (implementation guidance — not applied)

**Drawer**
- `top/right/bottom: 0`
- `width: min(82vw, 348px)`
- `border-radius: 22px 0 0 22px`
- safe-area via padding
- preserve overlay + dialog a11y

**Footer**
- Owner: end of `CatalogClient` `<main>`
- Copy A + `business.name` + year
- Link: `/`
- No card; muted; rely on `--with-cart` padding

---

## Gate checklist

| Gate | Status |
|------|--------|
| DRAWER OWNER | IDENTIFIED |
| DRAWER FULL-HEIGHT STRATEGY | IDENTIFIED (pin to portal edges) |
| DRAWER WIDTH RANGE | RECOMMENDED (`min(82vw, 348px)`) |
| DRAWER RADIUS STRATEGY | IDENTIFIED (`22px 0 0 22px`) |
| DRAWER A11Y RISKS | UNDERSTOOD |
| FOOTER OWNER | IDENTIFIED (`CatalogClient`) |
| BUSINESS NAME SOURCE | IDENTIFIED (`business.name`) |
| YEAR STRATEGY | IDENTIFIED |
| ORDEROPS URL | IDENTIFIED (`/`) — external domain optional later |
| FAB OVERLAP | EVALUATED (static `--with-cart` padding) |
| Runtime / CSS changes | NONE |
| Commit / push / deploy | NONE |
