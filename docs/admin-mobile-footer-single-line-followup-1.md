# Admin Mobile Footer Single-Line Follow-up 1

## 1. Objective

Refine the compact admin mobile footer into a single horizontal close bar: brand left, protected-panel meta right.

## 2. Current issue

`ADMIN-MOBILE-FOOTER-COMPACT-POLISH-1` shortened mobile copy correctly but stacked it in two lines via `flex-direction: column`.

## 3. Product decision

- **Mobile (≤640px):** one row — `© {year} OrderOps` left · `Panel protegido · v1.0` right
- **Desktop (≥641px):** unchanged long copy/layout
- CSS-only; no shell/drawer/dashboard changes

## 4. Source ownership

| Surface | Owner |
| ------- | ----- |
| Markup | `components/admin/layout/admin-footer.tsx` (unchanged this phase) |
| CSS | `components/admin/layout/admin-footer.module.css` |
| Consumer | `AdminShell` → `<AdminFooter variant="compact" />` |
| Breakpoint | `@media (max-width: 640px)` |

## 5. Mobile single-line layout

- `.inner`: `flex-direction: row`, `flex-wrap: nowrap`, `justify-content: space-between`, `gap: 0.75rem`
- `.trailing`: `width: auto`, right-aligned (no full-width column force)
- Brand + `.metaMobile`: `white-space: nowrap`
- Tagline/separator remain hidden; `.metaDesktop` remains hidden

## 6. Desktop preservation

Rules outside the 640px MQ and desktop copy/spans untouched.

## 7. Implementation summary

CSS-only change in the existing mobile media query. Compact copy/year/desktop preservation from prior phase retained.

## 8. Runtime QA

Authenticated agent browser (localhost):

| Viewport / route | Result |
| ---------------- | ------ |
| 360 dark dashboard | Single-line row; brand left / meta right; no overflow |
| 390 dark | PASS (`sameLine`, `space-between`) |
| 412 / 430 dark | PASS |
| 640 dark | Mobile single-line |
| 641 boundary | Desktop long copy restored |
| 768 / 1024 / 1440 | Desktop unchanged |
| 390 light products | Single-line |
| 412 light settings | Single-line |
| Order detail `…d80ca455…` @390 | Single-line |

## 9. Verifies

```bash
npx tsx lib/orders/admin-mobile-footer-single-line.verify.ts
npx tsx lib/orders/admin-mobile-footer-compact.verify.ts
# + tap / drawer trio / toolbar / terminal / search / metrics / order_code
```

All listed verifies: **PASS**

## 10. Static checks

- `tsc --noEmit` PASS
- `git diff --check` PASS (CRLF warnings only)
- `npm run build` PASS
- `npm run lint` → known ESLint 9 circular JSON debt only

## 11. Lint evidence

- Executed: `npm run lint`
- Exact: ESLint 9.39.4 `TypeError: Converting circular structure to JSON` (React plugin cycle)
- Known tooling debt only

## 12. Files changed

- `components/admin/layout/admin-footer.module.css`
- `lib/orders/admin-mobile-footer-single-line.verify.ts`
- Docs: this file, CURRENT_PHASE, living audit, living memory, compact polish + visual debt audit follow-up notes

## 13. P0–P3 findings

- **P0–P2:** none
- **P3:** shared footer; constrained to ≤640px MQ

## 14. Hard boundaries

No AdminShell, drawer, toolbar, dashboard logic, manual modal, globals/theme, public catalog, DB/RPC. No commit/push/deploy.

## 15. Gate

`ADMIN-MOBILE-FOOTER-SINGLE-LINE-FOLLOWUP-1` — **PASS — ADMIN MOBILE FOOTER SINGLE-LINE POLISHED**
