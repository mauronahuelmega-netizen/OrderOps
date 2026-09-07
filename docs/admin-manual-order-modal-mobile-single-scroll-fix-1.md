# Admin Manual Order Modal — Mobile Single-Scroll Fix 1

## 1. Objective

Make the admin manual order modal feel like one fluid surface on mobile/tablet (≤899px): a single primary content scroll for customer + products + ticket, with nested list scrolls removed, footer CTA still visible, and desktop ≥900 dual-pane preserved. No safety-gate, picker, RPC, or dashboard changes.

## 2. Previous audit finding

`ADMIN-MANUAL-ORDER-MODAL-MOBILE-SCROLL-AND-CUSTOMIZATION-AUDIT-1` confirmed competing scroll owners on ≤899:

- `.manual-order-modal__workstation` (`overflow-y: auto`)
- `.manual-order-modal__products-scroll` (`overflow-y: auto` + rigid max-heights; tablet often **180px**)
- `.manual-order-modal__summary-scroll` (same)

Result: modal felt split into mini-panes; products and ticket fought for space.

Safety gate (`ADMIN-MANUAL-ORDER-CUSTOMIZATION-SAFETY-GATE-1` + runtime QA) already closed functional risk for customizable products. This phase only fixes scroll architecture.

## 3. Product decision

| Surface | Decision |
| ------- | -------- |
| Mobile/tablet ≤899 | Single primary scroll on modal body; products + ticket grow naturally |
| Desktop ≥900 | Keep dual-pane + nested pane scrolls |
| Footer CTA | Remains outside body scroll (form sibling), sticky, usable |
| Safety gate | Unchanged (simple allowed / customizable blocked) |
| Customization picker | Not implemented |

## 4. Source ownership

| Concern | Owner |
| ------- | ----- |
| Modal shell / form | `components/admin/orders/manual-order-modal.tsx` (untouched this phase) |
| Scroll CSS | `components/admin/orders/manual-order-modal.module.css` |
| Verify | `lib/orders/admin-manual-order-modal-mobile-single-scroll.verify.ts` |

## 5. Scroll architecture before

```text
≤899:
  body (overflow:hidden)
    workstation (overflow-y:auto)     ← competing
      products-scroll (overflow-y:auto, max-height vh/180px)
      summary-scroll  (overflow-y:auto, max-height vh/180px)
  footer (sticky sibling)

≥900:
  dual-pane workstation; nested products/summary panes OK
```

## 6. Scroll architecture after

```text
≤899:
  body (overflow-y:auto)              ← sole primary owner
    customer strip
    workstation (overflow:visible, flex:0 0 auto)
      products-scroll (overflow:visible, max-height:none)
      summary-scroll  (overflow:visible, max-height:none)
  footer (sticky sibling, outside body scroll)

≥900:
  unchanged dual-pane + base nested overflow-y:auto on panes
```

## 7. Mobile/tablet behavior

- `@media (max-width: 899px)` neutralizes nested `products-scroll` / `summary-scroll` overflow and max-height.
- Workstation no longer scrolls independently.
- Body is the only active content scroller.
- Tablet 768–899 no longer uses 180px miniature panes (rule removed / overridden).
- Page `body` remains `overflow: hidden` while modal open.

## 8. Desktop preservation

- `@media (min-width: 900px)` still sets dual-pane `grid-template-columns`.
- Base `.products-scroll` / `.summary-scroll` keep `overflow-y: auto` for desktop pane scrolling.
- Runtime QA @900 / 1024 / 1440: dual columns + nested `overflow-y: auto` still present; footer visible.

## 9. Safety gate preservation

UI strings and disabled add path unchanged in TSX:

- Badge `Requiere personalización`
- Helper `Usá el catálogo hasta habilitar el selector manual.`
- `+` disabled for blocked products; no picker

Runtime: Coca Cola 500ml local add/qty; BBQ Bacon / Doble Smash blocked; ticket unchanged on BBQ tap; no create / no DB.

## 10. Runtime QA

Authenticated `/admin/dashboard` → Nuevo pedido. No **Crear pedido**.

| Viewport | Theme | Single-scroll ≤899 | Nested active | Footer | Notes |
| -------- | ----- | ------------------ | ------------- | ------ | ----- |
| 360 | dark | PASS (`body` oy:auto) | 0 | visible | |
| 390 | dark | PASS | 0 | visible | Coca qty 2→3→2; BBQ no-op |
| 412 | dark | PASS | 0 | visible | |
| 430 | dark | PASS | 0 | visible | |
| 719 | dark | PASS | 0 | visible | |
| 768 | dark | PASS | 0 | visible | no 180px panes |
| 899 | dark | PASS | 0 | visible | edge of single-scroll |
| 900 | dark | N/A (desktop) | dual-pane panes `auto` | visible | dual cols |
| 1024 | dark | N/A | dual-pane | visible | |
| 1440 | dark | N/A | dual-pane | visible | |
| 390 | light | PASS | 0 | visible | |
| 412 | light | PASS | 0 | visible | Cancel closed modal |

Body scroll leakage: **none** while open (`document.body.style.overflow = hidden`); restored after Cancel.

Search: `Coca` → Coca available; `BBQ` → BBQ blocked; clear restores list.

## 11. Verifies

All PASS:

- `admin-manual-order-modal-mobile-single-scroll.verify.ts`
- `manual-order-customization-safety.verify.ts`
- `admin-manual-order-customization-safety-gate.verify.ts`
- footer / tap / drawer trio / toolbar / terminal / search-Kanban / metrics / order_code / display

## 12. Static checks

- `npx tsc --noEmit` — PASS
- `git diff --check` — PASS
- `npm run build` — PASS (see phase closeout)
- `npm run lint` — known ESLint 9 circular JSON debt only

## 13. Lint evidence

Executed: `npm run lint`

Exact result: ESLint 9.39.4 failed with `TypeError: Converting circular structure to JSON` (configs → flat → plugins → react cycle). Known tooling debt only. No lint fix in this phase.

## 14. Files changed

| Kind | Path |
| ---- | ---- |
| CSS | `components/admin/orders/manual-order-modal.module.css` |
| Verify | `lib/orders/admin-manual-order-modal-mobile-single-scroll.verify.ts` |
| Docs | this file + CURRENT_PHASE + living audit + living memory + optional audit follow-ups |

TSX: **unchanged** (CSS-only).

## 15. P0–P3 findings

- **P0–P1:** none
- **P2:** none remaining for nested list scrolls ≤899 (resolved). Customization picker still not implemented (separate roadmap).
- **P3:** real-device soft-keyboard geometry not re-validated on physical Android.

## 16. Hard boundaries

No changes to `createManualOrderAction`, eligibility/safety helpers, `create_order` RPC, migrations, public checkout/catalog, WhatsApp/contact, workspace, dashboard Kanban/search/metrics, drawer/toolbar/footer, AdminShell, globals/theme. No real orders. No commit / push / deploy.

## 17. Gate

`ADMIN-MANUAL-ORDER-MODAL-MOBILE-SINGLE-SCROLL-FIX-1` — **PASS — MANUAL ORDER MODAL MOBILE SINGLE-SCROLL FIXED**
