# ADMIN-ORDER-WORKSPACE-CONTACT-MESSAGING-VISUAL-HIERARCHY-POLISH-1

**Date:** 2026-08-22  
**Baseline commit:** 81b1162  
**Gate:** PASS WITH REAL-DEVICE QA DEBT — CONTACT MESSAGING VISUAL HIERARCHY FROZEN (validated 2026-08-27)

## 1. Objective

Workspace-only visual hierarchy polish for **Contacto con el cliente**: separate **Contact messaging** (template → Abrir WhatsApp → Copiar resumen / Compartir) from **Más acciones** utilities (phone / call / address / maps). No message content, template keys, contextual default, or secondary utility visual redesign.

## 2. Why sub-scope reopened

Structured contact messaging content was frozen in **ADMIN-ORDER-WORKSPACE-CONTACT-MESSAGING-STRUCTURED-CONTENT-IMPL-1**. Product audit and information/action flow both recommended grouping WhatsApp + Copy/Share as one communication workflow. This phase implements presentation only.

## 3. Source audit

| Item | Finding |
|------|---------|
| Component | `components/admin/orders/order-external-actions.tsx` |
| CSS (detail legacy) | `order-detail-surfaces.module.css` |
| CSS (workspace) | **new** `order-external-actions.module.css` |
| Workspace consumer | `admin-order-workspace-modal.tsx` — heading owner `Contacto con el cliente` |
| Detail consumer | `order-actions-section.tsx` — `<OrderExternalActions order={order} />` |
| Before structure | WhatsApp block (phone-gated) → Más acciones grid mixing utilities + Copy/Share |
| Template select | Native `<select>` inside `admin-field` |
| WhatsApp button | Shared `Button`, `variant="secondary"` in workspace via `compactContact` |
| Copy/Share | Previously in quick-actions grid with utilities |
| Web Share | `canUseWebShare()` client effect; hidden when unsupported |
| No phone | WhatsApp block hidden; Copy/Share were still in grid (not phone-gated) |

## 4. Shared consumer audit

| Surface | Props | Presentation |
|---------|-------|--------------|
| Workspace modal | `compactContact`, `contextualTemplateDefault`, `presentation="workspace"` | New hierarchy |
| Order detail | `order` only | Legacy unchanged |

## 5. Workspace/detail boundary

Single prop: `presentation?: "default" | "workspace"` (default `"default"`). No viewport inference. No coupling to `contextualTemplateDefault`.

## 6. Before hierarchy

**Workspace & detail (shared legacy):**

1. Template select + Abrir WhatsApp (if phone + templates)
2. Más acciones: Copiar teléfono, Llamar, Copiar dirección, Abrir Maps, **Copiar resumen**, **Compartir** (all equivalent grid cells)

## 7. After hierarchy

**Workspace only:**

1. Contact messaging: template select → Abrir WhatsApp → Copiar resumen / Compartir
2. Más acciones: Copiar teléfono, Llamar, Copiar dirección, Abrir Maps

**Detail:** unchanged (Copy/Share remain in Más acciones grid).

## 8. Template select

Native `<select>` preserved. Workspace variant: local shell, `appearance: none`, inset `ChevronDown`, focus-visible ring, 44px min-height, semantic tokens only.

## 9. WhatsApp CTA

Full width; `Button variant="secondary"` + local contained styling; `MessageCircle` icon; copy **Abrir WhatsApp** unchanged. Medium-high emphasis within Contacto; subordinate to contextual status CTA.

## 10. Copy summary

Moved under WhatsApp in messaging group. Payload: `buildOrderContactSummary` (unchanged). Toast: **Resumen copiado** / error unchanged. **Not phone-gated.**

## 11. Share

Same row as Copy when `canUseWebShare()`. Same plain payload as Copy. Hidden when unsupported; solo Copy uses full-width compact row (no empty cell).

## 12. Contact secondary action row

Compact tertiary buttons with `Copy` / `Share2` icons; restrained border/surface; 44px touch targets.

## 13. Más acciones membership

Phone, call, address, maps only. Copy/Share removed.

## 14. Secondary utilities hard boundary

Legacy `detailStyles.toolButton` classes retained. No new icons/colors/hierarchy among utilities. Hairline separator + heading only for section split.

## 15. No-phone behavior

WhatsApp + select hidden when no phone (unchanged guard). Copy/Share remain visible in messaging group.

## 16. Delivery

Messaging block full. Utilities: up to 4 actions when phone + address present.

## 17. Pickup

Messaging unchanged. Utilities: phone/call only when no address; no fake address row.

## 18. Share unsupported

Compartir absent; Copiar resumen solo layout intentional.

## 19–25. Responsive gates

| Width | Result |
|------:|--------|
| 360 | SOURCE VERIFIED — compact select + Copy/Share + utilities; no horizontal overflow expected |
| 390 | SOURCE VERIFIED — communication group reads before utilities; status CTA remains global primary |
| 430 | SOURCE VERIFIED — Copy/Share grouped; no awkward spread |
| 719 | SOURCE VERIFIED — persistent footer unchanged; Contact scrolls above |
| 720 | SOURCE VERIFIED — inline status CTA; Contact hierarchy stable |
| 768 | SOURCE VERIFIED — rail placement unchanged |
| 1024 | SOURCE VERIFIED — Contacto in right rail |
| 1440 | SOURCE VERIFIED — not oversized; detail unchanged |

**Real-device/browser matrix:** Authenticated Cursor browser matrix EXECUTED 2026-08-27 — see validation doc. Real Android NOT EXECUTED.

## Authenticated visual validation — 2026-08-27

**ADMIN-ORDER-WORKSPACE-CONTACT-MESSAGING-VISUAL-HIERARCHY-VALIDATION-1 = PASS WITH REAL-DEVICE QA DEBT**

| Area | Result |
|------|--------|
| Browser matrix @390/360/430/719/720/1440 | PASS |
| Light + dark theme | PASS |
| Detail route regression | PASS — legacy unchanged |
| Seven-equivalent-buttons | NO — resolved |
| Manual override | PASS |
| Share unsupported (Cursor browser) | Copy solo layout PASS |
| Console | No material errors |
| Lint | EXECUTED — known ESLint 9 circular JSON debt only |
| Real Android | NOT EXECUTED |
| Runtime code changes | NONE |

Doc: `docs/admin-order-workspace-contact-messaging-visual-hierarchy-validation-1.md`

## 26. Light/dark

Tokens only (`--bg-surface`, `--border-subtle`, `--text-*`, `--focus`). No hardcoded WhatsApp green. Real-device theme smoke: NOT EXECUTED.

## 27. Accessibility / tab order

Semantic DOM: select → WhatsApp → Copy → Share → utilities. Native select + labels preserved. Decorative icons `aria-hidden`. One instance per action (no CSS-hidden duplicates).

## 28. Detail route regression

`/admin/orders/[id]` — zero visual/behavior delta (default presentation branch).

## 29. Contextual default regression

`admin-contextual-default.verify.ts` — **PASS**. Manual override lifecycle unchanged.

## 30. Structured-content regression

`customer-order-summary.verify.ts` — **PASS**  
`admin-structured-content.verify.ts` — **PASS**  
Copy plain text / Share identity unchanged.

## 31. Console / network

No new network reads. Clipboard/share local APIs unchanged. Browser console QA: NOT EXECUTED.

## 32. Checks

| Check | Result |
|-------|--------|
| contextual default verify | PASS |
| customer summary verify | PASS |
| structured WhatsApp verify | PASS |
| preparation verify | PASS |
| pending finalization verify | PASS |
| phone verify | PASS |
| tsc | PASS |
| diff-check | PASS |
| build | PASS |
| lint (full `eslint .`) | NOT EXECUTED — known ESLint 9 circular JSON debt; scoped files lint NOT EXECUTED |

## 33. P0–P3

| Level | Findings |
|-------|----------|
| P0 | none |
| P1 | none |
| P2 | none (source-level hierarchy resolved) |
| P3 | real-device 390/1440 light/dark smoke deferred |

## 34. Files changed

**Runtime:** `order-external-actions.tsx`, `admin-order-workspace-modal.tsx`  
**CSS:** `order-external-actions.module.css` (new)  
**Domain:** NONE

## 35. Hard boundaries

Structured message content, customer summary model, WhatsApp bodies, template keys/availability, contextual default, manual override, secondary utility behavior, Products, status, persistent CTA, risk, Cliente/Entrega, Indicaciones, Activity, public WhatsApp, realtime, reconciliation, RPC, DB — **UNCHANGED**. Network reads: **+0**.

## 36. Gate

**ADMIN-ORDER-WORKSPACE-CONTACT-MESSAGING-VISUAL-HIERARCHY-POLISH-1 = PASS WITH REAL-DEVICE QA DEBT**

CONTACT MESSAGING CONTENT: **REMAINS STRUCTURED + FROZEN**  
CONTACT MESSAGING VISUAL HIERARCHY: **FROZEN**  
CONTEXTUAL WHATSAPP DEFAULT: **REMAINS PASS**  
SECONDARY UTILITIES: **DEFERRED / NOT POLISHED**  
Products / Status / Persistent mobile CTA: **REMAIN FROZEN**  
Dashboard overall polish: **OPEN**

No commit. No push. No deploy.

## Secondary utilities follow-up — 2026-08-27

- Contact messaging hierarchy remains frozen.
- Later phase **ADMIN-ORDER-WORKSPACE-SECONDARY-ACTIONS-VISUAL-POLISH-1** polished only phone/call/address/maps workspace presentation as compact icon-labeled tools.
- Messaging actions, structured content, contextual default, and Copy/Share row remained unchanged.
- Workspace/detail presentation boundary preserved (`presentation="workspace"` vs default).
- Doc: `docs/admin-order-workspace-secondary-actions-visual-polish-1.md`.
