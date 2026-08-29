# ADMIN-ORDER-WORKSPACE-INDEPENDENT-RAILS-LAYOUT-FIX-1

**Date:** 2026-08-19  
**Status:** PASS WITH VISUAL QA DEBT  
**Scope:** Workspace modal layout — independent left/right vertical rails

---

## 1. Problem

Authenticated desktop QA showed long Products content in the left rail pushed Estado, Contacto, and quick actions downward on the right rail. Operational controls were vertically coupled to left content height.

---

## 2. Real QA evidence

Multi-product preparation orders: Estado appeared only after Products + Total height. Short and long orders produced materially different Y positions for right-rail controls — unacceptable for operational scanning.

---

## 3. Root cause

`admin-order-modal.module.css` at `@media (min-width: 1024px)` placed flat sections on a **shared-row CSS Grid**:

| Row | Col 1 | Col 2 |
|-----|-------|-------|
| 1 | Products | Próximo paso |
| 2 | Cliente | Estado |
| 3 | Actividad | Contacto |

Row 1 height = max(Products, Próximo paso). Tall Products inflated row 1, pushing row 2+ right content down.

**Shared row mechanism:** explicit `grid-row` / `grid-column` on sibling sections within one grid.

---

## 4. Previous shared-row architecture

Single `.workspaceGrid` with seven direct `<section>` children and pairwise row synchronization across columns.

---

## 5. New independent rail architecture

Two rail wrappers inside `.workspaceGrid`:

| Rail | Class | Sections |
|------|-------|----------|
| Left (information) | `.executionColumn` | Products, Cliente/Entrega, Actividad, Notas |
| Right (operations) | `.commandColumn` | Próximo paso, Estado, Contacto |

Desktop `@media (min-width: 1024px)`:

```css
.workspaceGrid {
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  align-items: start;
}
.executionColumn, .commandColumn {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  align-self: start;
}
```

Each rail is one grid cell with independent vertical flex flow. **LEFT CONTENT HEIGHT MUST NOT CONTROL RIGHT RAIL FLOW.**

---

## 6. Left rail

Order preserved: Productos → Cliente/Entrega → Actividad → Notas.

---

## 7. Right rail

Order preserved: Próximo paso → Estado (+ assignment when flag ON) → Contacto/WhatsApp.

---

## 8. Desktop

Two columns, top-aligned. Ratio unchanged: `1.15fr` / `0.85fr` (~60/40). No sticky, no nested scroll, no height hacks.

Scroll owner remains `.workspaceGrid` (`overflow-y: auto`).

---

## 9. Mobile / source order

Below 1024px: `.workspaceGrid` becomes flex column; rails use `display: contents`; sections use CSS `order` to preserve approved interleaved sequence:

1. Productos  
2. Cliente/Entrega  
3. Próximo paso  
4. Estado  
5. Contacto  
6. Actividad  
7. Notas  

Single semantic DOM. No duplicated components.

---

## 10. Scroll behavior

One modal scroll surface (`.workspaceGrid`). No nested rail scrollbars. No sticky.

---

## 11. Accessibility / tab order

Desktop tab order: left rail top-to-bottom, then right rail top-to-bottom — matches independent-rail visual scan. Forms, labels, dialog semantics unchanged. No nested forms introduced.

---

## 12. 60/40 freeze

Horizontal ratio unchanged. Modal width unchanged.

---

## 13. Product preparation freeze

No changes to preparation renderer, mapper, tabular numerals, or product header.

---

## 14. Long vs short order QA

| Case | Expected right-rail behavior |
|------|------------------------------|
| Short order | Próximo paso / Estado at natural top of right rail |
| Long order | Same — Products height does not shift Estado Y |

Left-height coupling: **NONE** (structural).

---

## 15. Checks

| Check | Result |
|-------|--------|
| `order-preparation.verify.ts` | PASS |
| `tsc --noEmit` | PASS |
| `git diff --check` | PASS |
| `npm run build` | PASS |
| `npm run lint` | known ESLint 9 circular JSON |

---

## 16. Findings (P0–P3)

| Severity | Finding |
|----------|---------|
| P0 | None |
| P1 | None |
| P2 right-rail vertical coupling | **CLOSED** (structural) |
| P2 | Authenticated viewport matrix pending |
| P3 | Modal 60/40 may still feel wide — optional future follow-up only |

---

## 17. Post-fix ratio assessment

Ratio unchanged. Internal preparation density already improved. **Modal rail ratio polish not required yet** — reassess after authenticated QA.

---

## 18. Gate

**ADMIN-ORDER-WORKSPACE-INDEPENDENT-RAILS-LAYOUT-FIX-1** = **PASS WITH VISUAL QA DEBT**

---

## Consumers

| Surface | Affected |
|---------|----------|
| Dashboard workspace modal | YES — `admin-order-workspace-modal.tsx` |
| Order detail page | NO — uses `order-workspace.tsx` (distinct layout) |
| Loading skeleton | Already matched rail structure (`executionColumn` / `commandColumn`) |

---

## Files changed

| File | Change |
|------|--------|
| `components/admin/orders/admin-order-workspace-modal.tsx` | Rail wrappers (`executionColumn` / `commandColumn`) |
| `components/admin/orders/admin-order-modal.module.css` | Independent rails desktop; mobile order via flex + `display: contents` |

---

## Follow-up audit

**ADMIN-ORDER-WORKSPACE-INFORMATION-ACTION-FLOW-AUDIT-1** (2026-08-19): next audited focus — information/action mental order within stable rails (notes placement, Próximo paso wiring, contact defaults). See `docs/admin-order-workspace-information-action-flow-audit-1.md`.

**ADMIN-ORDER-WORKSPACE-INFORMATION-HIERARCHY-POLISH-1** (2026-08-19): information hierarchy changed inside stable rails (Indicaciones after Productos; header Delivery/Retiro; terminal `Estado final`). Rail architecture, ratio, and scroll model remained unchanged.

**ADMIN-ORDER-WORKSPACE-CUSTOMER-DELIVERY-RAIL-REALIGNMENT-1** (2026-08-19): Cliente/Entrega moved from `executionColumn` to `commandColumn` (after Estado, before Contacto). Independent rails, ratio, scroll unchanged.

**ADMIN-ORDER-WORKSPACE-CONTEXTUAL-STATUS-ACTION-FLOW-1** (2026-08-19): workspace status section now owns contextual CTA + manual escape; Próximo paso panel removed from workspace; Activity limit 2. Rails/ratio/scroll unchanged.
