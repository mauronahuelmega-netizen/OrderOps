# ADMIN-ORDER-WORKSPACE-CONTACT-SURFACE-CONTRAST-TUNING-1

**Date:** 2026-08-27  
**Baseline commit:** 81b1162  
**Fixture:** La Burguesía — order **#0215** (`c1e031af-762a-429f-abca-4ffd03dd0215`), pending delivery, phone + address  
**Gate:** PASS WITH REAL-DEVICE QA DEBT — CONTACT SURFACE CONTRAST FROZEN

---

## 1. Objective

Improve workspace right-rail Contact/control surface contrast and materiality—especially light theme—without changing architecture, structure, content, handlers, or hierarchy order.

## 2. Reopen justification

New PO screenshots showed light theme right rail too flat: weak borders, washed controls, disabled-looking labels, insufficient tonal separation between WhatsApp / Copy-Share / utilities. Structure from prior Contact + secondary utility phases remains correct; only surface tuning reopened.

## 3. Source audit

| Item | Owner |
|------|-------|
| Primary CSS | `order-external-actions.module.css` — feature-local `--contact-*` tokens |
| Right-rail labels | `admin-order-modal.module.css` — `commandRailEyebrow`, section dividers |
| Manual status label | `order-workspace-status-section.module.css` — `manualLabel` |
| Cliente/Entrega eyebrows | `order-workspace-overview.module.css` |
| Workstation status select | `status-form.module.css` — `--workstation-manual` scoped only |
| Runtime JSX | **unchanged** |
| Detail branch | `presentation="default"` — unaffected by workspace module |
| Global tokens / shared primitives | **unchanged** |

## 4. Before visual issue

**Light:** controls nearly same tone as canvas; borders ~70% transparent; Copy/Share transparent background; utilities/icons tertiary; section labels tertiary (disabled-looking).  
**Dark:** acceptable but borders/icons could be slightly clearer.  
**Severity:** P2 visual — functional hierarchy correct, materiality insufficient.

## 5. Tuning strategy

Feature-local CSS variables on `.workspaceRoot` derived from semantic tokens; light-theme overrides via `html[data-dashboard-theme="light"]`; dark overrides restrained. Stronger borders + muted surfaces; Copy/Share no longer transparent; WhatsApp gets raised surface tier; labels bumped to `--text-secondary`; no shadows, no layout change.

## 6. Files changed

- `order-external-actions.module.css` (primary)
- `admin-order-modal.module.css` (eyebrow + section divider light tuning)
- `order-workspace-status-section.module.css` (manual label tone)
- `order-workspace-overview.module.css` (Cliente/Entrega eyebrow tone)
- `status-form.module.css` (workstation manual select/guardar contrast only)

## 7. Light theme changes

Stronger `--contact-border-strong` mix; white `--contact-surface`; raised WhatsApp surface; Copy/Share + utilities get `--contact-surface-muted` fill; section hairlines strengthened; rail eyebrows `--text-secondary`.

## 8. Dark theme changes

Modest border/divider bump only; no bright outlines or glow.

## 9. WhatsApp CTA

Raised surface (`--contact-surface-raised`), stronger border, weight 600 preserved, icon `--text-secondary`. Not blue/green. Still subordinate to status CTA.

## 10. Copy/Share

Surface fill + border (no longer transparent); icon `--contact-icon-muted`; weight 500. Weaker than WhatsApp (600 + raised surface).

## 11. Secondary utilities

Stronger border/surface; icons `--text-secondary` default; labels readable; tool geometry unchanged.

## 12. Labels

`commandRailEyebrow`, `utilitiesTitle`, `manualLabel`, `customer-delivery-eyebrow` → `--text-secondary` (not tertiary).

## 13. Manual/status adjacent controls

Workstation manual select + disabled Guardar borders clarified in light; logic/behavior unchanged.

## 14. Workspace/detail boundary

Workspace module classes apply only to `presentation="workspace"`. Detail route verified: `utilityToolCount: 0`, legacy `ui-button` classes.

## 15. 390 light

Authenticated CDP @390 light: select white surface + visible border; WhatsApp fw 600 / raised bg; Copy+utility fw 500 / muted surface; status blue fw 650; no overflow. **PASS.**

## 16. 390 dark

Prior dark pass + restrained token overrides; hierarchy preserved. **PASS.**

## 17. 1440 light

Desktop light: controls separate from canvas; compact in right rail; Products left rail dominant. **PASS (CDP + structure).**

## 18. 1440 dark

No over-bright borders; subtle materiality. **PASS.**

## 19. 360/430

2-col utilities retained; no horizontal overflow from border tuning. **PASS.**

## 20. 719/720

719: persistent footer + utilities reachable. 720: inline CTA, no footer duplication. **PASS (unchanged behavior).**

## 21. 768/1024

Right rail contained; no layout regression. **PASS.**

## 22. Scroll

`.workspaceGrid` sole scroll; no body horizontal leak. **PASS.**

## 23. Accessibility/focus

Native select preserved; `:focus-visible` rings retained/strengthened; tab order unchanged; contrast improved.

## 24. Functional boundaries

WhatsApp URL, Copy summary, Share, copy phone, call `tel:5491159126321`, copy address, Maps href — **unchanged** (CDP verified).

## 25. Verifies

All PASS: customer-summary, structured WhatsApp, contextual default, preparation, pending finalization, phone.

## 26. Static checks

tsc PASS | diff-check PASS | build PASS | lint executed (ESLint 9 circular JSON debt only).

## 27. Console/network

No material errors. Network +0.

## 28. P0–P3

| Level | Findings |
|-------|----------|
| P0 | none |
| P1 | none |
| P2 | none — light flatness resolved |
| P3 | Real Android not executed |

## 29. Gate

**ADMIN-ORDER-WORKSPACE-CONTACT-SURFACE-CONTRAST-TUNING-1 = PASS WITH REAL-DEVICE QA DEBT — CONTACT SURFACE CONTRAST FROZEN**

No commit. No push. No deploy.
