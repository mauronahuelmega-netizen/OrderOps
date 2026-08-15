# PUBLIC-CATALOG-TENANT-FOOTER-1

## Estado

```text
PASS — ANDROID REAL-DEVICE QA COMPLETE
```

**Fecha:** 2026-08-15
**Commit / push / deploy:** closeout with drawer polish
**Base audit:** `docs/public-catalog-chrome-drawer-footer-audit-1.md`

---

## Objetivo

Footer customer-facing al final del catálogo público: nombre tenant, año dinámico, attribution OrderOps → `/`. Sin fetch. Sin card.

---

## Preflight

| Item | Resultado |
|------|-----------|
| Render owner | `CatalogClient` inside `<main className="catalog-page">` |
| Placement | After `.catalog-content`, before `CartBar` / sheets / modals |
| Business source | `business.name: string` on `PublicBusiness` (required) |
| Year strategy | Server: `new Date().getFullYear()` in `PublicCatalogPageContent` → prop `copyrightYear` |
| Additional fetch | **NO** |
| Layout | Untouched (catalog-only) |

---

## Implementation

| Piece | Path |
|-------|------|
| Component | `components/public/catalog/public-catalog-footer.tsx` |
| Styles | `components/public/catalog/public-catalog-footer.module.css` |
| Wire | `catalog-client.tsx`, `public-catalog-page.tsx` |

**Final copy:** `© {year} {businessName} · Pedidos online · Hecho con OrderOps`
**Link:** `Link` → `/` (same-origin marketing `app/page.tsx`)
**Note:** trademark symbol intentionally omitted from final visible copy.

---

## Styling

| Trait | Value |
|-------|--------|
| Font | 12.5px, centered, `text-wrap: pretty` |
| Color | `var(--catalog-muted)` |
| Link | slightly stronger mix of `--catalog-text` / `--catalog-muted`; underline; `white-space: nowrap` on link only |
| Focus | `:focus-visible` with business-primary ring |
| Spacing | `margin-top: 28px`; `padding-bottom: 12px` |
| Card/shadow/glass | **none** |
| Dark | inherits `.catalog-page` / `data-theme` tokens |

---

## Cart coexistence

| Gate | Status |
|------|--------|
| New cart state | **NO** |
| Existing `--with-cart` padding reused | **YES** (footer inside `.catalog-page`) |

---

## Accessibility

| Gate | Status |
|------|--------|
| Semantic `<footer>` | YES |
| Focus-visible | YES |
| No manual tabIndex | YES |

---

## Responsive

Expected natural wrap 1–2 lines at ~360–412; centered ≥768. OrderOps not split (`nowrap` on link).

---

## Android Chrome

**PASS** — product owner, Android Chrome real device (2026-08-15). Footer visible; FAB clearance OK; OrderOps link táctil; no tap flash celeste.

---

## Checks

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | **PASS** (closeout) |
| `git diff --check` | **PASS** (closeout) |
| `npm run build` | **PASS** (closeout) |
| `npm run lint` | **KNOWN DEBT** — ESLint 9 circular JSON (`plugins.react`) |

---

## Out of scope

Drawer · ProductCard · categories · modals · checkout · CartBar logic · DB
