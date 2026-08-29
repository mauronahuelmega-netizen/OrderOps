# ADMIN-ORDER-WORKSPACE-CONTACT-MESSAGING-STRUCTURED-CONTENT-IMPL-1

**Date:** 2026-08-22  
**Gate:** PASS — STRUCTURED CONTACT MESSAGING FROZEN  
**Baseline commit:** `81b1162` (uncommitted working tree)  
**No commit / push / deploy**

---

## 1. Objective

Replace MVP flat admin Contact messaging (`- Nx product_name` + Total) with a persisted snapshot-derived customer-facing structured order summary for WhatsApp, Copiar resumen, and Compartir — without live catalog config and without Contacto UI changes.

## 2. Product decisions

| Decision | Implementation |
| --- | --- |
| preparing / ready_* / on_the_way | MINIMAL status pings |
| received + summary | RICH structured |
| confirm_address | Address-focused + order ref |
| Kitchen `N total` | OMITTED |
| Monetary Total | OMITTED from all Contact content |
| Indicaciones | Conditional on received / summary / copy / share |
| WhatsApp root | `*N× Product*` |
| Plain root | `N× Product` (no markdown) |
| Group labels | Light: `- Group: opt / opt` |
| Dividers | Blank lines between roots |
| Adicional | Under parent: `- Adicional: Name ×qty` |
| Architecture | Option B |

## 3. Source ownership before

- Templates/bodies: `lib/whatsapp/admin.ts` (`buildOrderSummaryText` flat)
- UI: `order-external-actions.tsx`
- Snapshot/tree: `order-dashboard.ts` (unused by WhatsApp)
- Ref: duplicated local `buildOrderDisplayRef` in card/modal/search

## 4. Architecture before

```text
order_items {product_name, quantity}
  → buildOrderSummaryText (flat)
  → templates / Copiar / Compartir
```

## 5. Architecture after

```text
persisted order_items (+ snapshot, item_kind, parent)
  → buildDashboardOrderItemTree / parseCustomizationSnapshot
  → buildCustomerOrderSummary()
  → formatWhatsappCustomerOrderProducts / formatPlainText…
  → buildOrderWhatsappMessage / buildOrderContactSummary
```

## 6. Customer summary model

`lib/orders/customer-order-summary.ts`

Pure types: roots → groups → options (+ optional `perUnitQuantity`) → additionals.  
No markdown, no kitchen `operationalTotal`, no prices.

## 7. Data dependency direction

```text
orders/customer-order-summary → product-customization/order-dashboard (parser/tree)
whatsapp/admin → orders/customer-order-summary
UI → whatsapp/admin
```

## 8. No-live-config invariant

Customer summary imports only `order-dashboard` tree/parser types.  
No catalog loaders. No preparation VM. No network.

## 9. V2 behavior

Structured groups/options; qty-enabled → `×N c/u` (including ×1); parent-associated Adicional; sort_order respected.

## 10. V1 fallback

Structured groups/options; **no** fabricated `c/u`; Adicional still associated.

## 11. Legacy fallback

`*N× Product*` / plain `N× Product` only.

## 12. Invalid snapshot fallback

Parser returns null → root-only; no throw.

## 13–16. Formatting

Root `N× Name`; WhatsApp bold; groups `- Name: a / b`; qty `×N c/u`; Adicional under parent; blank line between roots.

## 17. Indicaciones

`Indicaciones: …` when `notes.trim()`; omitted for empty/whitespace; only rich templates + plain summary.

## 18. Order reference

Canonical helper extracted: `lib/orders/display-ref.ts` → `buildOrderDisplayRef`  
(UUID without hyphens, last 4 hex, upper). Consumers: card, workspace modal, natural-search, messaging.

## 19–25. Templates

Exact contracts verified in `admin-structured-content.verify.ts` (received, preparing, ready_*, on_the_way, confirm_address, summary).

## 26–27. Copy / Share

`buildOrderContactSummary` → plain structured formatter. Share uses same payload. No `*bold*`. No Total.

## 28. WhatsApp encoding

Existing `buildAdminOrderWhatsappUrl` + sanitize. Roundtrip PASS. `*` left unescaped by `encodeURIComponent` (ECMAScript); newlines `%0A`.

## 29. Contextual-default regression

`admin-contextual-default.verify.ts` PASS. Keys/availability/default matrix unchanged.

## 30. UI boundary

`order-external-actions.tsx` unchanged (payloads widen via existing order object). Visual delta: NONE.

## 31. Network / DB / realtime boundary

+0 network. No DB/RPC/realtime/snapshot-write changes. Public WhatsApp untouched.

## 32. Verify matrix

| Verify | Result |
| --- | --- |
| customer-order-summary.verify.ts | PASS |
| admin-structured-content.verify.ts | PASS |
| admin-contextual-default.verify.ts | PASS |
| order-preparation.verify.ts | PASS |
| pending-status-mutation-finalization.verify.ts | PASS |
| phone-display.verify.ts | PASS |

## 33. Runtime smoke

SOURCE/helper authoritative. Authenticated browser send: NO. Visual delta: NONE expected. Copy/Share browser: NOT EXECUTED (helper identity verified).

## 34. Checks

tsc PASS · diff-check PASS · build PASS · lint known ESLint 9 debt.

## 35. P0–P3

P0/P1/P2: none. P3: tenant product names containing `*`/`_` may affect WhatsApp styling (documented limitation; no escaping framework).

## 36. Files changed

**New:** `lib/orders/customer-order-summary.ts`, `lib/orders/display-ref.ts`, verifies  
**Modified:** `lib/whatsapp/admin.ts`, `order-card.tsx`, `admin-order-workspace-modal.tsx`, `natural-search.ts`  
**CSS:** NONE  
**Docs:** phase + audit closure + default follow-up + living audit/memory + CURRENT_PHASE

## 37. Hard boundaries

Contacto layout / selector / keys / availability / default / Copy-Share placement / Products / status / CTA / public WhatsApp / pricing / snapshot creation / realtime / DB = UNCHANGED.

## 38. Gate

**PASS — STRUCTURED CONTACT MESSAGING FROZEN**

## Visual hierarchy follow-up — 2026-08-22

Structured message architecture remains frozen. Later workspace presentation phase **ADMIN-ORDER-WORKSPACE-CONTACT-MESSAGING-VISUAL-HIERARCHY-POLISH-1** visually grouped WhatsApp + Copiar resumen + Compartir as Contact messaging; message bodies/formatters/defaults unchanged; secondary utilities (phone/call/address/maps) remain separate and were not visually redesigned. Doc: `docs/admin-order-workspace-contact-messaging-visual-hierarchy-polish-1.md`.
