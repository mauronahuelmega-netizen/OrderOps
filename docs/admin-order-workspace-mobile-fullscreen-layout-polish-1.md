# ADMIN-ORDER-WORKSPACE-MOBILE-FULLSCREEN-LAYOUT-POLISH-1

**Date:** 2026-08-21  
**Type:** TARGETED MOBILE UX / LAYOUT POLISH (mobile sub-scope reopen)  
**Result:** **PASS WITH REAL-DEVICE QA DEBT**  
**Commit / push / deploy:** NONE

---

## 1. Objective

Convert the order workspace modal into an intentional mobile-first full-screen operational surface on narrow phones, without reopening the frozen desktop workspace.

## 2. Why frozen mobile scope was reopened

Final visual QA had frozen the workspace with non-blocking P3 only. Product Owner mobile evidence showed a floating reduced desktop modal, accidental header wrap, and preparation quantity metadata stacking under option labels. Per durable rule: new product requirement / regression evidence → **mobile sub-scope explicitly reopened**. Desktop remains frozen.

## 3. Screenshot baseline

PO / prior mobile capture (~Galaxy S20 Ultra class):

- floating card with outer margin + radius;
- dashboard visible around modal;
- header wraps into accidental multi-line mix;
- Bacon / ×4 left-stacked;
- Cliente 2-track near width limit.

## 4. Consumer audit

| Component | Consumers | Shared impact |
|---|---|---|
| `OrderProductsList` / `OrderPreparationItems` | workspace modal + order detail (`order-workspace.tsx` / items section) | Mobile two-track option CSS in `order-items.module.css` applies to both — intentional shared improvement |
| `OrderModalHeaderLeading` | workspace modal shell only | workspace-only |
| `OrderCustomerDeliveryInfo` | workstation overview (modal) + non-workstation overview paths | Mobile stack rules scoped under `--workstation` |
| `AdminOrderModalShell` workstation | workspace modal + manual-order modal | Full-screen shell at ≤719px for workstation variant |

**Strategy:** A — shared preparation mobile row improvement desirable; detail route smoked at 390.

## 5. Mobile breakpoint

**FULLSCREEN MOBILE BREAKPOINT = `max-width: 719px`**

Matches existing preparation / shell `720px` semantic boundary.

| Range | Behavior |
|---|---|
| ≤719 | Full-screen `100dvh`, radius 0, 2-row header, stacked single-column workspace |
| 720–1023 | Existing tablet: centered bounded card (`max-width: 600px`), stacked rails, header flex |
| ≥1024 | Frozen desktop ~60/40 workstation |

## 6. Full-screen shell

Workstation ≤719:

- shell padding `0`;
- panel `width: 100%`, `height: 100dvh`, `max-width/max-height: none`;
- `border-radius: 0`, no floating shadow;
- safe-area on header top + body bottom/sides.

Measured @390×844: panel top `0`, bottom `844`, radius `0px`, shell pad `0`.

## 7. Dynamic viewport / safe areas

`100dvh` on panel; `env(safe-area-inset-*)` on header/body. No JS resize / UA sniffing.

## 8. Scroll ownership

Single `.workspaceGrid` overflow. No Products/Contact nested scroll. Body scroll locked by existing shell effect.

## 9. Header before/after

**Before:** identity + badges wrap with age/close competing.

**After (≤719):** CSS grid via `display: contents`:

1. `#REF - Customer` | close  
2. Delivery + Status badges | `Hace N`

Long names: ellipsis on identity; close always row-1. Age copy unchanged (P3 preserved).

## 10. Products mobile structure

Overall single-column flow unchanged. Option rows use two-track `minmax(0,1fr) auto`.

## 11. Quantity metadata alignment

| Case | Mobile presentation |
|---|---|
| Quantity-enabled parent>1 | name \| `×N c/u` / `N total` right stack |
| Simple ×N | name \| `×N` |
| Ambas / N total | name \| coverage right |
| No metadata | name alone |

## 12. Product header

Existing two-track header preserved; multi-unit unit price still under title on ≤719 (prior track rule).

## 13. Adicional / Total

Unchanged semantics; Adicional subsection + Total left/right preserved.

## 14. Mobile density

Tightened workstation gutters, section padding, product card padding, group gaps, Productos heading (~0.68rem). Operational, not cramped.

## 15. Estado

No logic change. Slight gap compaction only. Manual correction remains visible (no disclosure).

## 16. Cliente / Entrega

≤719 workstation:

- Cliente name/phone: 2-track when fit;
- Entrega: 1-column so address is full-width;
- ≤359: all context grids 1-column.

## 17. Contacto

Layout only; WhatsApp defaults untouched.

## 18. Activity

Max 2; tertiary; spacing tightened lightly.

## 19. Indicaciones

No fixture with notes in this pass; collapse contract unchanged.

## 20–25. Viewport matrix

| Viewport | Result |
|---|---|
| 360 | Full-screen PASS, no overflow |
| 390 | Full-screen + 2-row header + two-track options PASS |
| 412/430 | Same ≤719 rules (agent 390/360 primary) |
| 768 | Bounded tablet card preserved (600px, radius 18, header flex) |
| 1024 | Desktop boundary unchanged |
| 1440 | Frozen: ~1200px, radius 18, ~60/40 rails, header flex |

## 26. Light/dark

Mobile CSS uses semantic tokens; dark surfaces inherit. No token edits.

## 27. Real Android

**NOT EXECUTED** (agent emulation only). Operator device confirmation recommended.

## 28. Detail-route shared-renderer impact

`/admin/orders/[id]` @390: option metadata right-associated (`associated: true`). Acceptable shared improvement.

## 29. Accessibility

Semantic DOM preserved; Escape/close unchanged; no new focus traps. Mobile header uses `display: contents` for grid placement only.

## 30. Console

No workspace boundary / expectedStatus / hydration errors observed during matrix.

## 31. Regression checks

| Check | Result |
|---|---|
| WhatsApp verify | PASS |
| Pending finalization verify | PASS |
| Preparation verify | PASS |
| tsc | PASS |
| diff-check (touched CSS/TS) | PASS |
| build | (see gate run) |
| lint | known ESLint 9 circular JSON only |

## 32. P0–P3

| Sev | Finding |
|---|---|
| P0 | none |
| P1 | none |
| P2 | none |
| P3 | Real Android not executed (accepted debt) |

## 33. Files changed

| File | Change |
|---|---|
| `order-modal-header.tsx` | badges wrapper for mobile grid |
| `admin-order-modal.module.css` | ≤719 full-screen + header + density |
| `order-items.module.css` | mobile option two-track |
| `order-workspace-overview.module.css` | workstation Cliente/Entrega mobile rules |
| docs | phase + CURRENT_PHASE + audits + memory |

Runtime/domain: **NONE**.

## 34. Hard boundaries

desktop = UNCHANGED (≥720)  
status / cancel / WhatsApp / realtime / reconciliation / RPC / DB / preparation semantics / pricing = UNCHANGED  
network = +0

## 35. Gate

```text
ADMIN-ORDER-WORKSPACE-MOBILE-FULLSCREEN-LAYOUT-POLISH-1
= PASS WITH REAL-DEVICE QA DEBT

DESKTOP WORKSPACE: REMAINS FROZEN
MOBILE WORKSPACE: FROZEN (agent matrix; real device debt)
Dashboard overall polish: OPEN

No commit. No push. No deploy.
```

## Quantity-row follow-up — 2026-08-21

Original intermediate mobile layout used:

`label | metadata stack`

(e.g. Bacon with `×4 c/u` above `8 total`).

Product Owner final visual QA requested:

`label | per-unit | operational-total`

for quantity-enabled rows only.

Phase: **ADMIN-ORDER-WORKSPACE-MOBILE-PREPARATION-QUANTITY-THREE-TRACK-POLISH-1**

Result: **PASS WITH REAL-DEVICE QA DEBT** — three-track quantity-enabled rows; simple coverage/qty remain two-track; shell/header/desktop unchanged. Doc: `docs/admin-order-workspace-mobile-preparation-quantity-three-track-polish-1.md`.

## Persistent status action follow-up — 2026-08-21

Mobile full-screen shell now reserves a persistent bottom action region for active contextual status transitions (≤719). Single content scroll (`.workspaceGrid`) remains. No shell redesign beyond footer composition. Phase: **ADMIN-ORDER-WORKSPACE-MOBILE-PERSISTENT-STATUS-ACTION-1**.
