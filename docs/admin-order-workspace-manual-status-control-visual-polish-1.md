# ADMIN-ORDER-WORKSPACE-MANUAL-STATUS-CONTROL-VISUAL-POLISH-1

**Date:** 2026-08-21  
**Gate:** PASS WITH REAL-DEVICE QA DEBT  
**Baseline commit:** 81b1162 (uncommitted)  
**Evidence:** AGENT VERIFIED (Cursor IDE browser)

## 1. Objective

Polish only the manual status correction control: native select presentation (custom chevron inset), Guardar secondary hierarchy, and same-status disabled affordance — without touching persistent/contextual CTA architecture.

## 2. Why sub-scope reopened

Final visual QA judged manual correction ACCEPTABLE; new mobile workstation evidence (persistent primary CTA) made the native/flat select + always-active Guardar feel too competing and indistinct. Sub-scope reopened for control quality only.

## 3. Current control audit

| Item | Finding |
| ---- | ------- |
| Select markup | Native `<select name="status">` |
| Appearance (before) | Browser native arrow via shared `.admin-field select` |
| Chevron (before) | None |
| Button | Shared `Button` + workstation `admin-status-form__manual-save` |
| selectedStatus | `useOrderStatusMutation` |
| Authoritative status | `initialStatus` prop (`order.status`) |
| Disabled (before) | `isPending` only |
| Same-status submit | Allowed → no-op toast |
| Cancel branch | Select cancelled → Guardar opens confirm (no mutation) |
| Consumers | `order-workspace-status-section` (workstation), `order-actions-section` (detail/modal/page) |

## 4. Select semantics

Native `<select>` preserved. OS picker preserved.

## 5. Chevron implementation

`lucide-react` `ChevronDown` in relative shell; `pointer-events: none`; `right: ~1.05rem` (~17px inset). `appearance: none` + `padding-right: 2.5rem` (specificity beats `.admin-field select`).

## 6. Guardar visual hierarchy

Workstation: neutral contained surface (not primary blue). Enabled: stronger text/border. Disabled: muted tertiary text, `opacity: 1` (no washed-out 0.3). Detail/modal non-workstation keep `admin-primary-button` but gain same-status disable.

## 7. Same-status state

Derived: `hasManualChange = selectedStatus !== initialStatus`. Guardar disabled when `!hasManualChange || isPending`. Submit guard mirrors. No extra `isDirty` state.

## 8. Changed-status state

Guardar enabled when selection differs; after settle sync → disabled again. AGENT VERIFIED (preparing→ready).

## 9. Pending state

Unchanged: select disabled, Guardar disabled, `Sincronizando...` copy.

## 10. Cancellation compatibility

First Guardar on Cancelado → confirmation only; Volver restores authoritative + Guardar disabled. AGENT VERIFIED. Explicit Cancelar pedido: NOT EXECUTED (prior phase PASS / disposable policy).

## 11–13. Mobile 360 / 390 / 430

| Width | Select | Chevron inset | Unchanged Guardar | Result |
| ----: | ------ | ------------- | ----------------- | ------ |
| 360 | appearance none, pr 40px | ~17px | disabled | PASS |
| 390 | same | ~17px | hierarchy vs blue CTA clear | PASS |
| 430 | same | ~17px | PASS | PASS |

## 14. 719 / 720

719: persistent CTA 1, inline 0, polished manual.  
720: persistent 0, inline 1, Estado heading visible, polished manual. PASS.

## 15. Desktop

1440: two-rail grid intact; footer display none; select polish only. NO layout regression.

## 16. Light/dark

Token-based surfaces. Dark primary matrix PASS. Light inherits same rules PASS.

## 17. Accessibility

Native select + sr-only/workstation label; focus-visible; chevron non-interactive; disabled semantics. PASS.

## 18. Runtime same-status

pending=pending → Guardar disabled; no mutation. PASS.

## 19. Runtime changed-status

preparing→ready via Guardar → settle ready; Guardar disabled; footer Completar pedido. PASS.

## 20. Unsaved-select isolation

pending, select ready unsaved, footer Empezar preparación → click CTA → preparing; select sync; Guardar disabled. PASS.

## 21. Cancellation regression

First Guardar → confirm; card stayed preparing; Volver → preparing + Guardar disabled. PASS.

## 22. Double submit

Double Guardar on ready change → single settle ready. PASS.

## 23. Console/network

expectedStatus / workspace-boundary: NONE. Network reads +0.

## 24. Checks

pending / WhatsApp / preparation verifies PASS · tsc PASS · diff-check PASS · build PASS · lint known ESLint 9 circular only.

## 25. P0–P3

P0/P1/P2: none · P3: real Android NOT EXECUTED

## 26. Files changed

- `status-form.tsx`
- `status-form.module.css`
- docs

## 27. Hard boundaries

contextual CTA / persistent footer / mapping / mutation / cancel safety / realtime / RPC / DB / WhatsApp / Products / shared UI primitives = UNCHANGED

## 28. Gate

```text
ADMIN-ORDER-WORKSPACE-MANUAL-STATUS-CONTROL-VISUAL-POLISH-1
= PASS WITH REAL-DEVICE QA DEBT

MANUAL STATUS CONTROL: FROZEN
Persistent mobile contextual action: REMAINS PASS
Contextual status runtime gate: REMAINS CLOSED
Manual cancellation safety: REMAINS PASS
Desktop/Mobile workspace: REMAINS FROZEN
Dashboard overall polish: OPEN

No commit. No push. No deploy.
```
