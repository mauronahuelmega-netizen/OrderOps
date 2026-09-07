# Admin Tap Highlight Polish 1

## 1. Objective

Neutralize the native Android/Chrome mobile tap highlight (celeste/blue flash) on admin interactive controls while preserving premium custom feedback and keyboard focus-visible.

## 2. Current issue

On Android/Chrome, tapping buttons/links in admin (drawer, toolbar, tabs, modals, nav) shows a native blue tap flash that clashes with the Zinc/premium UI.

## 3. Product decision

- Single admin-scoped CSS reset: `-webkit-tap-highlight-color: transparent`
- Touch/coarse media query preferred
- Cover body-mounted portals via `html:has(.admin-shell)` (drawer/order modal/crop are outside `.admin-shell` DOM)
- Do not touch public catalog (already has `.public-business-layout` polish in globals)
- Do not remove outlines / focus-visible / user-select

## 4. Source ownership

| Surface | Owner |
| ------- | ----- |
| Admin root | `.admin-shell` in `AdminShell` (`app/admin/(protected)/layout.tsx`) |
| CSS | `components/admin/admin-shell.css` |
| Portals | drawer / order modal / crop → `document.body`; covered by `:has(.admin-shell)` |
| Public | `.public-business-layout` in `app/globals.css` — untouched |

## 5. Admin-only selector strategy

```css
html:has(.admin-shell) :where(
  a, button, input, select, textarea, summary, label,
  [role="button"], [role="tab"], [role="menuitem"],
  [tabindex]:not([tabindex="-1"])
) {
  -webkit-tap-highlight-color: transparent;
}
```

Touch-only media query was evaluated; admin-wide scoped reset accepted (no desktop visual side effects; more reliable on real Android + agent emulators that do not match `(hover: none)`).

## 6. Implementation summary

One block appended to `admin-shell.css`. No component refactors. Drawer width/backdrop/motion unchanged.

## 7. Focus-visible preservation

No `outline: none`, no `:focus` killers, no admin-wide `user-select: none`. Existing module `:focus-visible` rules remain.

## 8. Public catalog boundary

Public keeps its own scoped rule. Admin rule requires `.admin-shell` in the document.

## 9. Runtime QA

Authenticated admin mobile:

| Surface | Result |
| ------- | ------ |
| Dashboard drawer/menu/+Pedido @412 | `-webkit-tap-highlight-color: rgba(0,0,0,0)` |
| Products @390 | transparent tap on nav/controls |
| Settings | transparent tap on links/buttons |
| Focus styles | no `outline: none` introduced |
| Public catalog live URL | source-boundary verified; live `/b/...` not opened in agent |

## 10. Verifies

```bash
npx tsx lib/orders/admin-tap-highlight-polish.verify.ts
# + drawer motion/backdrop/width + toolbar/terminal/search/metrics/order_code
```

## 11. Static checks

- `tsc --noEmit` PASS
- `git diff --check` PASS
- `npm run build` PASS
- `npm run lint` → known ESLint 9 circular JSON debt only

## 12. Lint evidence

- Executed: `npm run lint`
- Exact: ESLint 9.39.4 `TypeError: Converting circular structure to JSON`
- Known tooling debt only

## 13. Files changed

- `components/admin/admin-shell.css`
- `lib/orders/admin-tap-highlight-polish.verify.ts`
- Docs: this file, CURRENT_PHASE, living audit, living memory

## 14. P0–P3 findings

- **P0–P1:** none
- **P2:** none
- **P3:** admin-wide scoped reset (not touch-MQ-only); live public URL smoke skipped — public boundary enforced by source contracts

## 15. Hard boundaries

Public/globals/theme/DB/drawer motion/width/backdrop/dashboard logic untouched. No commit/push/deploy.

## 16. Gate

`ADMIN-TAP-HIGHLIGHT-POLISH-1` — **PASS — ADMIN TAP HIGHLIGHT POLISHED**
