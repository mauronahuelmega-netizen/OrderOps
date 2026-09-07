# Admin Mobile Footer Compact Polish 1

## 1. Objective

Compact the global admin footer on mobile so it closes admin surfaces with shorter, cleaner lines without changing desktop copy or layout.

## 2. Current issue

On mobile (≤640px), `AdminFooter` stacked as:

```text
© 2026 OrderOps · Sistema operativo para pedidos
V1.0 · Panel protegido
```

The long tagline made the mobile close feel unfinished after recent density polish.

## 3. Product decision

- **Mobile (≤640px):**
  ```text
  © {year} OrderOps
  Panel protegido · v1.0
  ```
- **Desktop (≥641px):** preserve
  ```text
  © {year} OrderOps · Sistema operativo para pedidos
  V1.0 · Panel protegido
  ```
- Year remains dynamic via `new Date().getFullYear()` (replacing prior hardcoded 2026 default).
- No AdminShell layout change; CSS + minimal responsive spans only.

## 4. Source ownership

| Surface | Owner |
| ------- | ----- |
| Markup | `components/admin/layout/admin-footer.tsx` |
| CSS | `components/admin/layout/admin-footer.module.css` |
| Consumer | `AdminShell` → `<AdminFooter variant="compact" />` (unchanged) |
| Scope | Global `/admin` via AdminShell (dashboard, products, settings, order detail) |
| Breakpoint | Existing `@media (max-width: 640px)` |

## 5. Mobile copy/layout

- Hide `.separator` + `.tagline` on mobile.
- Swap meta: hide `.metaDesktop`, show `.metaMobile` (`Panel protegido · v1.0`).
- Tighter column gap (`0.2rem`); muted tertiary tokens unchanged.

## 6. Desktop preservation

- Desktop meta + tagline remain visible; `.metaMobile` stays `display: none`.
- Spacing/alignment/colors of desktop footer unchanged outside the mobile MQ.

## 7. Implementation summary

- TSX: responsive `metaDesktop` / `metaMobile` spans; dynamic year brand default.
- CSS: mobile-only hide tagline/separator; swap meta visibility; slightly denser stack gap.
- Verify: `lib/orders/admin-mobile-footer-compact.verify.ts`.

## 8. Runtime QA

Authenticated agent browser (localhost):

| Viewport / route | Result |
| ---------------- | ------ |
| 360 dark dashboard | Compact 2 lines; no tagline; no overflow |
| 390 dark dashboard | Compact `© 2026 OrderOps` / `Panel protegido · v1.0` |
| 412 dark | Compact; no overflow |
| 430 dark | Compact; no overflow |
| 640 dark | Still mobile compact (MQ inclusive) |
| 641 boundary | Desktop copy restored (tagline + `V1.0 · Panel protegido`) |
| 768 / 1024 / 1440 | Desktop copy intact |
| 390 light products | Compact footer |
| 412 light settings | Compact footer (a11y tree) |
| Order detail `…d80ca455…` @390 | Compact footer |
| Drawer open smoke @390 | Portal/overlay present; Escape close |

Console: no footer-related errors observed during navigation.

## 9. Verifies

```bash
npx tsx lib/orders/admin-mobile-footer-compact.verify.ts
# + tap highlight, drawer motion/backdrop/width, toolbar, terminal density,
#   search/Kanban, metrics, order_code/display
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

- `components/admin/layout/admin-footer.tsx`
- `components/admin/layout/admin-footer.module.css`
- `lib/orders/admin-mobile-footer-compact.verify.ts`
- Docs: this file, CURRENT_PHASE, living audit, living memory, D4 follow-up on visual debt audit

## 13. P0–P3 findings

- **P0–P2:** none
- **P3:** shared admin footer blast radius constrained to ≤640px MQ only

## 14. Hard boundaries

No drawer, toolbar, dashboard logic/Kanban/metrics, manual modal, AdminShell layout, globals/theme, public catalog, DB/RPC/realtime. No commit/push/deploy.

## 15. Gate

`ADMIN-MOBILE-FOOTER-COMPACT-POLISH-1` — **PASS — ADMIN MOBILE FOOTER COMPACT POLISHED**

**Follow-up (2026-09-05):** `ADMIN-MOBILE-FOOTER-SINGLE-LINE-FOLLOWUP-1` refined the compact mobile copy into a single horizontal left/right close bar (CSS-only). Doc: `docs/admin-mobile-footer-single-line-followup-1.md`.
