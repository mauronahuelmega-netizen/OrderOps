# Public Catalog Success Order Reference Visual Hierarchy (Phase 1)

## 1. Objective

Enhance the visual hierarchy of the order reference on the public catalog success page (`/b/[slug]/success?order_id=<uuid>`), giving the 6-character `order_code` prominent centering, increased size, bold weight, and subtle letter spacing without the `#` prefix, while keeping the primary WhatsApp confirmation CTA dominant and preserving internal UUID routing and admin `#ORDER_CODE` conventions.

---

## 2. Current Issue

- With the adoption of 6-character Crockford base32 `order_code` (e.g. `ZZNXT4`), the order reference card on the public success page retained a small, left-aligned, monospace presentation (`font-size: 0.78rem`) prefixed with `#` (e.g. `#ZZNXT4`).
- Inside a spacious card, the reference lacked visual presence and clarity, while the `#` was redundant given the explicit label "Referencia del pedido".

---

## 3. Product Decision

- **Prefix Removal**: Display the order reference as `ZZNXT4` (without `#`) on `/b/[slug]/success`.
- **Visual Stature**:
  - Center both the label and code within the reference card.
  - Scale up the code font size (`1.35rem`) with strong weight (`font-weight: 700`).
  - Apply subtle letter spacing (`0.1em`) for enhanced legibility.
  - Retain the monospace stack (`ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`) and primary text color (`var(--success-text)`).
- **Label**: Centered above the code with muted tone (`var(--success-subtle)`), font size `0.75rem`, and weight `500`.
- **Card**: Retain compact surface padding, subtle border, and rounded corners without introducing heavy shadows or distracting from the primary WhatsApp button.

---

## 4. Source Ownership

- **Success Page Component**: `app/b/[slug]/success/page.tsx`
- **Success Page CSS Module**: `app/b/[slug]/success/success-page.module.css`
- **Display Ref Helper**: `lib/orders/display-ref.ts` (untouched; returns raw code string)
- **Public WhatsApp URL Builder**: `lib/whatsapp/public.ts` (untouched; strips `#` defensively)

---

## 5. Implementation Summary

1. **`app/b/[slug]/success/page.tsx`**:
   - Updated `visibleOrderRef` assignment to use `buildOrderDisplayRef(data)` and fallback `buildOrderDisplayRef(orderId)` directly without prepending `#`.
   - Pass `orderRef: visibleOrderRef ?? undefined` to `buildPublicOrderWhatsappUrl`.
2. **`app/b/[slug]/success/success-page.module.css`**:
   - Updated `.orderRef` layout to `display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;`.
   - Updated `.orderRefLabel` to `text-align: center; font-size: 0.75rem; font-weight: 500;`.
   - Updated `.orderRefValue` to `font-size: 1.35rem; font-weight: 700; line-height: 1.2; letter-spacing: 0.1em; color: var(--success-text); text-align: center;`.

---

## 6. Visible Order Reference Behavior

| State | Previous Visible Display | New Visible Display | WhatsApp URL Ref |
|---|---|---|---|
| Order with `order_code = "ZZNXT4"` | `#ZZNXT4` | `ZZNXT4` | `ZZNXT4` (no `#`) |
| Legacy Order with UUID `...-7dc3` | `#7DC3` | `7DC3` | `7DC3` (no `#`) |
| Admin Dashboard / Workspace | `#ZZNXT4` | `#ZZNXT4` (unchanged) | `#ZZNXT4` (unchanged) |

---

## 7. Visual Hierarchy

- **Title**: `Pedido recibido` (`1.35rem` / `1.5rem` desktop, bold)
- **Business Name**: `0.95rem` (semibold)
- **Status / Copy**: `0.92rem` (readable line-height `1.45`)
- **Order Reference Card**:
  - Label: `Referencia del pedido` (`0.75rem`, centered, muted)
  - Code: `ZZNXT4` (`1.35rem`, centered, bold, `0.1em` letter spacing)
- **Primary Action**: `Confirmar por WhatsApp` (prominent full-width button, `3rem` height)
- **Secondary Action**: `Volver al catálogo` (secondary button)

---

## 8. WhatsApp & Public Identity Boundaries

- **Route Query**: Remains `?order_id=<uuid>`. No search by `order_code` exposed publicly.
- **Order Lookup**: Server-side fetch remains strictly scoped by `id = orderId AND business_id = business.id`.
- **WhatsApp Public Copy**: Preserved approved format:
  `Hola {businessName}, ya hice mi pedido {orderCode} desde el catálogo online.\nTe escribo para confirmarlo.`
- **Admin Boundaries**: Dashboard cards, workspace header, and detail routes retain `#ORDER_CODE` convention.

---

## 9. Runtime QA

- **390px (Mobile)**: Reference code is centered and legible; no horizontal overflow; WhatsApp CTA primary.
- **412px (Android)**: Clean touch spacing; card surface balanced.
- **430px (Mobile)**: Crisp typographic hierarchy.
- **768px (Tablet)**: Max-width constraint (`32.5rem`) preserves panel geometry.
- **1024px / 1440px (Desktop)**: Centered layout with balanced margins.
- **WhatsApp Link**: Generated URL retains clean un-prefixed order code and correct phone/greeting.
- **Console**: Clean; 0 errors or warnings.

---

## 10. Verifies

- `lib/orders/public-success-order-ref-visual-hierarchy.verify.ts`: **PASS**
- `lib/whatsapp/public.verify.ts`: **PASS**
- `lib/orders/order-display-ref.verify.ts`: **PASS**
- `lib/orders/order-code-ui-search.verify.ts`: **PASS**

---

## 11. Static Checks

- `npx tsc --noEmit`: **PASS** (0 errors)
- `git diff --check`: **PASS** (clean whitespace)
- `npm run build`: **PASS** (Next.js 16.2.9 Turbopack static/dynamic compilation successful)
- `npm run lint`: **EXECUTED** (clean; accepted ESLint 9 circular JSON debt only)

---

## 12. Files Changed

- `app/b/[slug]/success/page.tsx`
- `app/b/[slug]/success/success-page.module.css`
- `lib/orders/public-success-order-ref-visual-hierarchy.verify.ts`
- `docs/public-catalog-success-order-ref-visual-hierarchy-1.md`
- `docs/CURRENT_PHASE.md`
- `docs/admin-dashboard-forensic-living-audit.md`
- `ORDEROPS_LIVING_MEMORY.md`

*(SQL NONE, DB/RPC NONE, admin NONE, checkout logic NONE, global CSS NONE)*

---

## 13. Findings

- **P0**: None.
- **P1**: None.
- **P2**: None.
- **P3**: Accepted ESLint 9 circular JSON debt only.

---

## 14. Hard Boundaries

- **Success Query**: UUID (`?order_id=...`) unchanged.
- **Order Code Schema**: Crockford base32 6-character code unchanged.
- **RPC `create_order`**: Unchanged.
- **Public WhatsApp Copy**: Remains frozen.
- **Admin `#ORDER_CODE`**: Unchanged.
- **Dashboard / Admin**: Unchanged.
- **Checkout Logic**: Unchanged.
- **DB / RPC**: Unchanged.
- **Global CSS / Theme**: Unchanged.
- **Commit / Push / Deploy**: None during this phase.

---

## 15. Gate

**PUBLIC-CATALOG-SUCCESS-ORDER-REF-VISUAL-HIERARCHY-1**

=

**PASS — PUBLIC SUCCESS ORDER REF HIERARCHY POLISHED**

- **VISIBLE SUCCESS REF**: ORDER_CODE WITHOUT #
- **ORDER REF HIERARCHY**: CENTERED + LARGER
- **PUBLIC WHATSAPP COPY**: REMAINS FROZEN
- **SUCCESS QUERY**: UUID UNCHANGED
- **ADMIN ORDER REFS**: `#ORDER_CODE` UNCHANGED
- **ORDER CODE BLOCK**: REMAINS CLOSED
- **DASHBOARD / ADMIN**: UNCHANGED

*No commit. No push. No deploy.*
