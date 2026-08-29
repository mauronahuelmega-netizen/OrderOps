# ADMIN-ORDER-WORKSPACE-PRODUCT-PREPARATION-VISUAL-SEPARATION-POLISH-1

**Date:** 2026-08-18  
**Status:** **PASS WITH VISUAL QA DEBT**  
**Baseline commit (living audit):** `81b1162` (unchanged — no commit this phase)

No commit / push / deploy.

Follow-up to: `docs/admin-order-workspace-product-preparation-hierarchy-1.md`

---

## 1. Problem

Structured preparation data was correct, but presentation read as a single text stream: product, groups, options, and Adicional shared similar visual weight. Desktop lacked a specification-style left/right axis; mobile stacked labels and options without enough grouping.

---

## 2. Visual strategy

STRUCTURE, NOT DECORATION.

- One quiet surface per parent product (header + customizations + Adicional)
- Hairlines only at semantic boundaries (header/body, Adicional, product-to-product via unit border)
- Group rhythm via spacing, not per-group boxes
- Desktop: group name left / options right
- Narrow: stack with option indent
- No ticket aesthetic, nested cards, chips, icons, or color-coded groups

---

## 3. Product unit treatment

Each parent is a `.preparationProduct` unit:

- subtle `--bg-surface-soft` mix + low-contrast `--border-subtle`
- shared 10px radius
- no shadow / elevation

Header remains L1: `N× name` + secondary line total.  
Body (groups + Adicional) sits under a header hairline when present.  
Legacy/simple products: compact surface, no empty customization body.

---

## 4. Desktop group layout

`@media (min-width: 720px)` — existing Orders breakpoint:

```text
grid-template-columns: minmax(6.75rem, 8.75rem) minmax(0, 1fr)
```

Papas              Papas grandes  
Salsas             Big Mac  
Agregados extra    Bacon ×4  
                   Huevo  
                   Cheddar ×4

---

## 5. Mobile group layout

Same DOM. Below 720px: stacked groups, options indented ~0.45rem.

Papas  
  Papas grandes

---

## 6. Option hierarchy

- Group label: `--text-secondary`, 0.75rem / 600  
- Option: `--text-primary`, 0.88rem / 600  
- Quantity suffix (`×4`, `×4 c/u`): same line, font-weight 700  
- Parent>1 meta (`8 total`): `--text-secondary`, 0.75rem — readable, not tiny  
- No comma-separated options, chips, or uppercase group labels

---

## 7. Adicional boundary

Top hairline + extra padding inside the same product unit.  
Label slightly stronger than customization groups.  
Child rows: `Name ×N` left, line total right. One label for multiple children.

---

## 8. Total

Unchanged closing surface. Slightly more top margin after product units. Authoritative `total_price` still passed through.

---

## 9. Functional boundaries

| Area | Changed? |
|------|----------|
| Mapper / snapshot / qty / prices | NO |
| Realtime / reconciliation / actions | NO |
| Checkout / create_order / DB / public | NO |
| OrderCard / WhatsApp / modal rail | NO |
| Click → product detail modal | preserved |
| Network | +0 |

---

## 10. Visual QA

Authenticated Cursor browser: **not available** (no logged-in admin session).

| Viewport | Result |
|----------|--------|
| 1440 light | DEBT |
| 1440 dark | DEBT |
| 768 | DEBT |
| 390 light | DEBT |
| 390 dark | DEBT |

Owner screenshots informed the BEFORE problem. AFTER must be human-verified.

---

## 11. Responsive

One local breakpoint: **720px** (existing Orders pattern).  
No extra renderers. `min-width: 0` / wrap on product names to avoid overflow.

---

## 12. Themes

Semantic tokens only (`--bg-surface-soft`, `--border-subtle`, `--text-primary/secondary`). No hardcoded palettes.

---

## 13. Checks

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS |
| `git diff --check` | PASS |
| `npm run build` | PASS |
| `npx tsx lib/product-customization/order-preparation.verify.ts` | PASS |
| `npm run lint` | known ESLint 9 circular JSON |

---

## 14. Findings

| Severity | Finding |
|----------|---------|
| P0 | None |
| P1 | None |
| P2 | Authenticated viewport matrix pending |
| P3 | `order-product-modal.tsx` still flat summary (out of scope) |

---

## 15. Debt

- **AUTHENTICATED VISUAL QA DEBT** — 1440/768/390 light/dark
- **PRODUCT MODAL PARITY** — unchanged P3

---

## 16. Gate

**ADMIN-ORDER-WORKSPACE-PRODUCT-PREPARATION-VISUAL-SEPARATION-POLISH-1** = **PASS WITH VISUAL QA DEBT**

---

## FOLLOW-UP

**IMPLEMENTED BY:** `ADMIN-ORDER-WORKSPACE-PREPARATION-PER-UNIT-TOTAL-ADDITIONAL-POLISH-1` (2026-08-18)

Per-unit/operational total clarity for multi-unit parents; `Ambas` coverage; Adicional without child price. Structured data unchanged. See `docs/admin-order-workspace-preparation-per-unit-total-additional-polish-1.md`.

