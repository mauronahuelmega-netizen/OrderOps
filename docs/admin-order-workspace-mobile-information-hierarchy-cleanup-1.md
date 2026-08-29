# ADMIN-ORDER-WORKSPACE-MOBILE-INFORMATION-HIERARCHY-CLEANUP-1

**Date:** 2026-08-21  
**Gate:** PASS WITH REAL-DEVICE QA DEBT — INFORMATION HIERARCHY FROZEN  
**Baseline commit:** 81b1162 (uncommitted working tree)  
**Evidence mode:** AGENT VERIFIED (Cursor IDE browser, authenticated) + static verifies

## 1. Objective

Reduce Indicaciones visual dominance; simplify Cliente/Entrega into a compact operational value grid without redundant micro-labels; show full order-owned customer name; display-only phone formatting where safe; remove recent Activity from the workspace modal only.

## 2. Product decisions

- Indicaciones = quiet operational note (not warning/alert/primary).
- Cliente/Entrega = 2×2 values under CLIENTE / ENTREGA eyebrows; visible Nombre/Teléfono/Modalidad/Dirección removed; sr-only preserved.
- Full name = order `customer_name` only (no surname invention).
- Phone formatting = presentation only; canonical for tel/WhatsApp/copy unchanged.
- Activity = removed from workspace presentation only; events/detail/risk/realtime preserved.
- Contacto / Products / status / persistent CTA = frozen / out of scope.

## 3. Source ownership audit

| Surface | Owner |
| --- | --- |
| Indicaciones | `order-notes-section.tsx` + `order-notes-section.module.css` |
| Cliente/Entrega | `order-workspace-overview.tsx` → `order-customer-delivery-info.tsx` → `order-overview-field.tsx` + `order-workspace-overview.module.css` |
| Activity (workspace consumption) | `admin-order-workspace-modal.tsx` (removed render) |
| Timeline component (shared) | `order-human-timeline.tsx` (unchanged; detail still consumes) |
| Event consumers | risk panel / hydration / detail page — data path untouched |
| Phone utility | new `formatAdminPhoneDisplay` in `lib/orders/presenter.ts` (BA-deterministic only) |

## 4. Indicaciones before

Large tinted surface, accent-left rail (~blue), prominent uppercase heading — read as near-warning.

## 5. Indicaciones after

Neutral surface + hairline border; no accent left rail; quieter eyebrow; readable body. Empty/whitespace notes still hidden.

## 6. Customer data sources

| Field | Source |
| --- | --- |
| Name | `order.customer_name` |
| Phone | `order.phone` (display via `formatAdminPhoneDisplay`) |
| Method | `formatAdminDeliveryMethod(order.delivery_method)` |
| Address | `order.address` only when `delivery_method === "delivery"` |

## 7. Full-name behavior

- Fixture `#7DC3`: raw `Mauro` → display `Mauro`.
- Fixture `#33B5`: raw `Mauro Ramirez` → display `Mauro Ramirez`.
- No truncation/invention in workspace Cliente block.
- Header short-name derivation unchanged (out of scope).

## 8. Phone formatting audit

- No `libphonenumber` / display formatter existed.
- No new dependency.
- Added deterministic BA-only helper: `54911########` / `5411########` / `11########`.
- Non-BA shapes left raw (no invented area codes).

## 9. Phone display vs canonical action value

| Concern | Result |
| --- | --- |
| Display | `+54 9 11 5912-6321` for BA mobile fixture |
| Copy | still `order.phone` |
| `tel:` | still digit-normalized canonical (`tel:5491159126321`) |
| WhatsApp | still `wa.me/5491159126321…` |

## 10. Cliente mobile grid

≤719: `minmax(0,1fr) minmax(0,1fr)` — name | phone. Left-aligned. No per-cell cards.

## 11. Entrega mobile grid

Same 2-column grid — method | address. Address wraps; no ellipsis.

## 12. Delivery

390 delivery: Delivery | full address. PASS.

## 13. Pickup

No pickup card in current authenticated dashboard fixture set → **SOURCE VERIFIED / NOT EXECUTED**. Address omitted when `delivery_method !== "delivery"` (no invented address).

## 14. Long name/address

`Mauro Ramirez` + long address at 360: columns stable; wrap allowed; no horizontal overflow.

## 15. Activity workspace removal

Removed `OrderHumanTimeline` section from `admin-order-workspace-modal.tsx`. No empty Actividad heading/link/spacer.

## 16. Activity detail preservation

`order-detail-page-client.tsx` still renders `OrderHumanTimeline`. Component file retained.

## 17. Event/risk preservation

`order_events` hydration path unchanged; risk panel untouched; realtime unchanged; network reads +0.

## 18. Mobile flow after

Productos → Indicaciones → Estado/manual → Cliente/Entrega → Contacto + persistent contextual CTA footer (active orders). No Activity.

## 19. Desktop flow after

LEFT: Productos → Indicaciones. RIGHT: Estado → Cliente/Entrega → Contacto. Rails 60/40 unchanged. No Activity.

## 20. 360

No overflow; 2×2 recognizable; wrap OK. PASS (agent).

## 21. 390

Quiet Indicaciones; clear Cliente/Entrega 2×2; labels visually absent. PASS (agent).

## 22. 430

Grid remains grouped (not excessively sparse). Agent smoke via geometry continuity with 390.

## 23. 719/720

Architecture unchanged for CTA placement (≤719 footer / ≥720 inline). Activity absent both sides.

## 24. 768

Tablet smoke: no Activity; customer block compact. Agent CDP viewport checks; real tablet NOT EXECUTED.

## 25. 1024

Two-rail independent stacks; left shorter without Activity OK.

## 26. 1440

Expected compact Cliente/Entrega; rail ratio unchanged. Desktop screenshot gate = agent partial / real-device debt.

## 27. Light/dark

Dark authenticated PASS. Light theme: **NOT EXECUTED** (real-device/light debt).

## 28. Accessibility

Notes section semantics preserved. Micro-labels `sr-only`. No broken Actividad `aria-labelledby`. Phone display spaces do not alter action targets.

## 29. Action regressions

Copy phone / tel / WhatsApp / Maps / copy address — Contacto code untouched; hrefs verified canonical on `#33B5`. Risk panel unchanged.

## 30. Console/network

No new expectedStatus/workspace boundary errors observed in agent session. Network reads +0 for this phase.

## 31. Checks

| Check | Result |
| --- | --- |
| `phone-display.verify.ts` | PASS |
| `pending-status-mutation-finalization.verify.ts` | PASS |
| `admin-contextual-default.verify.ts` | PASS |
| `order-preparation.verify.ts` | PASS |
| `tsc --noEmit` | PASS |
| `git diff --check` | PASS |
| `npm run build` | PASS |
| `npm run lint` | KNOWN ESLint 9 circular JSON debt |

## 32. Files changed

**Runtime:** `order-notes-section.module.css`, `order-customer-delivery-info.tsx`, `order-overview-field.tsx`, `order-workspace-overview.tsx`, `order-workspace-overview.module.css`, `admin-order-workspace-modal.tsx`, `lib/orders/presenter.ts`, `lib/orders/phone-display.verify.ts`

**Docs:** this phase; final QA append; information-hierarchy append; CURRENT_PHASE; living audit; living memory.

## 33. P0–P3

| Severity | Status |
| --- | --- |
| P0 | None |
| P1 | None |
| P2 | None blocking |
| P3 | Light theme + real Android/tablet/desktop 1440 screenshot debt; pickup fixture not executed |

## 34. Hard boundaries

Products / status / manual control / persistent CTA / risk / Contacto / WhatsApp / quick actions / mapping / realtime / reconciliation / RPC / DB / order events / detail history / network = preserved.

## 35. Gate

**ADMIN-ORDER-WORKSPACE-MOBILE-INFORMATION-HIERARCHY-CLEANUP-1 = PASS WITH REAL-DEVICE QA DEBT — INFORMATION HIERARCHY FROZEN**

Manual status control: REMAINS PASS  
Persistent mobile contextual action: REMAINS PASS  
Contextual status runtime: REMAINS CLOSED  
Products: REMAINS FROZEN  
Contacto: DEFERRED / UNCHANGED  
Dashboard overall polish: OPEN  

No commit. No push. No deploy.
