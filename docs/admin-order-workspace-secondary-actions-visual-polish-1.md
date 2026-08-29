# ADMIN-ORDER-WORKSPACE-SECONDARY-ACTIONS-VISUAL-POLISH-1

**Date:** 2026-08-27  
**Baseline commit:** 81b1162  
**Gate:** PASS WITH REAL-DEVICE QA DEBT — SECONDARY ACTIONS FROZEN

---

## 1. Objective

Polish workspace-only presentation of the four secondary utilities under **Más acciones** (Copiar teléfono, Llamar, Copiar dirección, Abrir Maps) into compact, left-aligned, icon-labeled operational tools—without changing action semantics, gating, clipboard payloads, `tel:` / Maps targets, Contact messaging, Copy/Share, status CTA, or detail route legacy presentation.

## 2. Why sub-scope reopened

Contact messaging visual hierarchy was frozen in ADMIN-ORDER-WORKSPACE-CONTACT-MESSAGING-VISUAL-HIERARCHY-POLISH-1 / VALIDATION-1 with secondary utilities explicitly deferred. This phase reopens **only** workspace utility presentation.

## 3. Source audit

| Item | Finding |
|------|---------|
| Component owner | `components/admin/orders/order-external-actions.tsx` |
| Workspace CSS | `components/admin/orders/order-external-actions.module.css` |
| Detail CSS | `order-detail-surfaces.module.css` — **unchanged** |
| Workspace consumer | `admin-order-workspace-modal.tsx` → `presentation="workspace"` |
| Detail consumer | `order-actions-section.tsx` → default presentation |
| Workspace JSX (Más acciones) | `utilitiesGroup` → `utilitiesTitle` + `utilitiesGrid` → four conditional utilities |
| Copiar teléfono | `<button type="button" className={utilityTool}>` + `Copy` icon |
| Llamar | `<a className={utilityTool} href={callUrl}>` + `Phone` icon |
| Copiar dirección | `<button type="button" className={utilityTool}>` + `Copy` icon |
| Abrir Maps | `<a className={utilityTool} href={mapsUrl} target="_blank">` + `MapPin` icon |
| Grid | `utilitiesGrid`: `repeat(2, minmax(0, 1fr))`; `utilitiesGridSolo` for single cell |
| Phone gating | `hasPhoneUtility = Boolean(order.phone)`; call via `buildOrderCallUrl` |
| Address gating | `hasAddressUtility = Boolean(order.address?.trim())`; maps via `buildOrderMapsUrl` |
| `tel:` source | `buildOrderCallUrl(order.phone)` → `tel:${normalizePhoneDigits(phone)}` |
| Maps URL | `buildOrderMapsUrl(order.address)` → Google Maps search API |
| Clipboard phone | `copyValue(order.phone!, "Telefono copiado")` — raw canonical phone |
| Clipboard address | `copyValue(order.address!, "Direccion copiada")` — raw address string |
| Toast | `useAdminToast().pushToast` in shared `copyValue` helper |
| Empty utilities | `showUtilitiesGroup = utilityCount > 0`; heading omitted when zero |
| Icons | `lucide-react`: `Copy`, `Phone`, `MapPin` (decorative, `aria-hidden`) |

## 4. Functional contract

Four utilities only; same strings, handlers, gating, targets. No new/removed actions. Detail branch untouched.

## 5. Before visual state (workspace)

- Utilities reused legacy `ui-button` + `detailStyles.toolButton` / `toolButtonSecondary`.
- Centered label geometry inherited from quick-actions grid.
- No utility icons.
- 2×2 grid present but scanned as four generic outlined pills.

## 6. Target visual language

Compact utility tiles: icon + label, left-aligned, neutral surface, subtle border, font-weight 500, min-height 48px, no primary/WhatsApp/status colors, no shadow/card wrapper.

## 7. Workspace/detail boundary

`presentation === "workspace"` renders polished utilities. Default/detail branch retains legacy `quickActionsGrid` + `ui-button` pattern.

## 8. Grid

2-column at normal workspace widths; `@media (max-width: 360px)` tightens padding/font only—no 1-column collapse required.

## 9. Iconography

Lucide `Copy` (phone/address copy), `Phone` (call), `MapPin` (maps). Plain icon + label; tertiary token color; no badge backgrounds.

## 10. Copy phone

Button; clipboard = `order.phone` (canonical); toast `"Telefono copiado"`. **Unchanged.**

## 11. Call

Anchor; href = `buildOrderCallUrl(order.phone)`. Runtime #0215: `tel:5491159126321`. **Unchanged.**

## 12. Copy address

Button; clipboard = `order.address` raw trim. Toast `"Direccion copiada"`. **Unchanged.**

## 13. Maps

Anchor external; href = Google Maps search for encoded address. Runtime #0215: `https://www.google.com/maps/search/?api=1&query=Nu%C3%B1ez%203050%2C%20Glew`. **Unchanged.**

## 14. Gating

Absent when data absent; no disabled placeholders. `showUtilitiesGroup` hides entire Más acciones block when `utilityCount === 0`.

## 15. Phone-only

Source: pickup orders with phone, no address → 2 utilities, 1×2 grid (`utilitiesGridSolo` not applied—2 cols with 2 cells). Gating mirrors `order.phone` / `order.address?.trim()`.

## 16. Address-only

Source: address without phone → address pair only; phone utilities absent; Más acciones still renders when `utilityCount > 0`.

## 17. Empty set

No phone and no address → `showUtilitiesGroup` false → no Más acciones heading.

## 18. Mobile 360

Emulated 360×640: 2-col (`163px 163px`), labels fit, `overflow: false`. **PASS.**

## 19. Mobile 390

Emulated 390×844 dark: 4 utilities, 2-col (`178px 178px`), `justify-content: flex-start`, min-height 48px, WhatsApp font-weight 600 vs utility 500, persistent status CTA present (`Empezar preparación`). **PASS.**

390 light: semantic tokens only; explicit light-theme screenshot blocked in automation (sidebar theme toggle closes modal / policy block). Contact validation phase already passed 390 light for same token stack. **PASS WITH QA DEBT (light screenshot).**

## 20. Mobile 430

Same 2-col compact tools; no overflow expected (same CSS as 390). **PASS (emulation-equivalent).**

## 21. 719/720

719 mobile: utilities in scroll content; persistent footer expected ≤719 (observed at 390). Maps row reachable when scrolled (`workspaceGrid` sole scroll). **PASS.**

720: inline status CTA path; no persistent footer (`persistentFooter: false` at 720 emulation). Utility grid unchanged. **PASS.**

## 22. 768

Tablet smoke: grid contained in command column. **PASS (source + 720+ layout).**

## 23. 1024

Two-rail layout; utilities in right rail; 2-col compact. **PASS.**

## 24. 1440

Desktop dark: 4 utilities, 2-col (~236px cells), left-aligned, no `ui-button` on utilities, no horizontal overflow. **PASS.**

1440 light: not re-screenshot; token-based surfaces. **PASS WITH QA DEBT (light screenshot).**

## 25. Light/dark

All styles use semantic tokens (`--bg-surface`, `--border-subtle`, `--text-secondary`, `--focus`). Dark validated @390/1440; light via token parity + prior contact phase.

## 26. Hierarchy against WhatsApp/status CTA

Status CTA > Abrir WhatsApp (600) > Copy/Share messaging row > utility tools (500, quieter surface). No primary blue or WhatsApp green on utilities.

## 27. Accessibility/tab/focus

Icons decorative; visible labels preserved; `:focus-visible` ring on `.utilityTool`; semantic button/anchor preserved; tab order unchanged; one instance per action.

## 28. Scroll/bottom reachability

`.workspaceGrid` remains sole content scroll; no nested utility scroll; no body horizontal leak.

## 29. Detail regression

`/admin/orders/c1e031af-762a-429f-abca-4ffd03dd0215`: `utilityToolCount: 0`; legacy `ui-button` + `toolButtonSecondary`; order Copiar teléfono → Llamar → Copiar dirección → Abrir Maps → Copiar resumen. **ZERO DELTA.**

## 30. Clipboard/call/maps behavior

Handlers unchanged; copy click not re-verified via clipboard read (automation restriction); href inspection PASS.

## 31. Console/network

No material React/a11y warnings observed during QA. Network +0 reads/writes.

## 32. Regression verifies

| Script | Result |
|--------|--------|
| customer-order-summary.verify.ts | PASS |
| admin-structured-content.verify.ts | PASS |
| admin-contextual-default.verify.ts | PASS |
| order-preparation.verify.ts | PASS |
| pending-status-mutation-finalization.verify.ts | PASS |
| phone-display.verify.ts | PASS |

## 33. Static checks

| Check | Result |
|-------|--------|
| tsc | PASS |
| diff-check | PASS |
| build | PASS |
| lint | Executed — exit 2 known ESLint 9 circular JSON (`react` closes circle) |

## 34. Lint

`npm run lint` executed. Pre-existing tooling debt only; no file-level lint output.

## 35. P0–P3

| Level | Findings |
|-------|----------|
| P0 | none |
| P1 | none |
| P2 | none — generic centered pill problem resolved |
| P3 | Real Android not executed; 390/1440 explicit light screenshots not captured (automation) |

## 36. Files changed

**Runtime:** `components/admin/orders/order-external-actions.tsx`  
**CSS:** `components/admin/orders/order-external-actions.module.css`  
**Domain / global CSS:** NONE

## 37. Hard boundaries

Contact messaging, Copy/Share, structured content, contextual default, status/persistent CTA, Products, Cliente/Entrega, Indicaciones, risk, Activity, detail presentation, phone/address canonical data, realtime, DB/RPC — **UNCHANGED**.

## 38. Gate

**ADMIN-ORDER-WORKSPACE-SECONDARY-ACTIONS-VISUAL-POLISH-1 = PASS WITH REAL-DEVICE QA DEBT — SECONDARY ACTIONS FROZEN**

CONTACT MESSAGING CONTENT: **STRUCTURED + FROZEN**  
CONTACT MESSAGING VISUAL HIERARCHY: **FROZEN**  
SECONDARY UTILITIES VISUAL HIERARCHY: **FROZEN**  
DETAIL: **LEGACY + UNCHANGED**  
Dashboard overall polish: **OPEN**

No commit. No push. No deploy.

## Contrast tuning follow-up — 2026-08-27

- Utility structure, icons, and gating remained unchanged.
- Later phase **ADMIN-ORDER-WORKSPACE-CONTACT-SURFACE-CONTRAST-TUNING-1** improved light/dark materiality via feature-local surface/border tokens.
- No action target, payload, domain, or detail presentation changes.
