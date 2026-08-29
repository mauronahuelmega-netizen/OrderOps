# Public Catalog — Success WhatsApp Business Copy Phase 1

## 1. Objective

Update the public WhatsApp message prefilled from the public catalog success page (`/b/[slug]/success`) to be business-first, addressing the customer's order directly to the merchant using the actual business name and raw `order_code` without a leading `#` or platform references.

---

## 2. Locked Copy

```text
Hola {businessName}, ya hice mi pedido {orderCode} desde el catálogo online.
Te escribo para confirmarlo.
```

### Rules & Formatting
- Uses `business.name` (e.g. `"La Burguesía"`).
- Uses `orderCode` without `#` (e.g. `"EU86T4"`).
- Does **not** mention `"OrderOps"`.
- Does **not** mention `"WhatsApp"`.
- Does **not** include `"Pedido:"` as a field label.
- Does **not** use exclamation marks.
- Maintains natural ES-AR tone in exactly two lines.
- The visible order reference in the success page HTML continues to render `#ORDER_CODE` (e.g. `#EU86T4`).

---

## 3. Source Ownership

| Surface | File | Description |
| :--- | :--- | :--- |
| Public WhatsApp URL Builder | `lib/whatsapp/public.ts` | `buildPublicOrderWhatsappUrl` generates the encoded `https://wa.me/` destination. |
| Public Success Page | `app/b/[slug]/success/page.tsx` | Server Component passing `businessName`, `whatsappNumber`, `orderId`, and `orderRef`. |
| Public Verification | `lib/whatsapp/public.verify.ts` | Deterministic verification suite for URL generation and copy formatting. |
| Admin WhatsApp Messages | `lib/whatsapp/admin.ts` | **UNCHANGED** (strictly preserved for admin/operator workflow). |
| Plain-Text Copy/Share | `lib/orders/customer-order-summary.ts` | **UNCHANGED** (strictly preserved for admin/operator workflow). |

---

## 4. Implementation

### 4.1 Public WhatsApp Helper (`lib/whatsapp/public.ts`)
Updated `buildPublicOrderWhatsappUrl` parameters to support `businessName?: string` while retaining backwards compatibility with `orderId` and `orderRef`:

```ts
export function buildPublicOrderWhatsappUrl(input: {
  whatsappNumber: string;
  businessName?: string;
  orderId?: string;
  orderRef?: string;
}) {
  const cleanedNumber = input.whatsappNumber.replace(/[^\d]/g, "");
  const businessGreeting = input.businessName?.trim()
    ? `Hola ${input.businessName.trim()}`
    : "Hola";

  const rawRef = (input.orderRef || input.orderId || "").trim();
  const orderCode = rawRef.replace(/^#+/, "");

  const firstLine = orderCode
    ? `${businessGreeting}, ya hice mi pedido ${orderCode} desde el catálogo online.`
    : `${businessGreeting}, ya hice mi pedido desde el catálogo online.`;

  const lines = [
    firstLine,
    "Te escribo para confirmarlo."
  ];

  const message = encodeURIComponent(lines.join("\n"));

  return `https://wa.me/${cleanedNumber}?text=${message}`;
}
```

### 4.2 Callsite (`app/b/[slug]/success/page.tsx`)
Passed `businessName: business.name` to `buildPublicOrderWhatsappUrl`.

---

## 5. Hash / Ref Handling

- In HTML: The success card displays `Referencia del pedido: #EU86T4`.
- In WhatsApp message: `orderRef.replace(/^#+/, "")` defensively removes any leading hash, producing `...mi pedido EU86T4 desde el catálogo online.`.

---

## 6. Runtime QA

- **Success Page Visible Ref:** `#EU86T4` shown in HTML panel.
- **WhatsApp Button Destination:** Generates `https://wa.me/<digits>?text=...`.
- **Decoded Message Text:**
  ```text
  Hola La Burguesía, ya hice mi pedido EU86T4 desde el catálogo online.
  Te escribo para confirmarlo.
  ```
- **Phone Normalization:** Strips non-digits, correctly formatting `54911...`.
- **Query Identity:** Route preserves UUID `?order_id=<uuid>`.
- **Live Safety:** Zero live WhatsApp messages sent; zero checkout mutations executed.

---

## 7. Verifies

All deterministic verify scripts executed and passed:

| Verify Script | Scope | Result |
| :--- | :--- | :---: |
| `lib/whatsapp/public.verify.ts` | Public WhatsApp business copy, hash stripping, no platform mentions | PASS |
| `lib/orders/order-display-ref.verify.ts` | Order code normalization & UUID fallback | PASS |
| `lib/orders/order-code-ui-search.verify.ts` | Operational search matching | PASS |
| `lib/orders/order-code-loaders-realtime.verify.ts` | Loader & realtime data model propagation | PASS |
| `lib/orders/dashboard-card-summary.verify.ts` | Root-level item count freezing | PASS |
| `lib/orders/customer-order-summary.verify.ts` | Customer summary model & plain-text summary | PASS |
| `lib/whatsapp/admin-structured-content.verify.ts` | Admin structured WhatsApp messaging | PASS |
| `lib/whatsapp/admin-contextual-default.verify.ts` | Contextual WhatsApp templates | PASS |

---

## 8. Static Checks

- `npx tsc --noEmit`: PASS (exit code 0)
- `git diff --check`: PASS (clean diff)
- `npm run build`: PASS (Next.js 16.2.9 production build compiled successfully)
- `npm run lint`: EXECUTED (exit code 2, known circular JSON ESLint 9 debt only)

---

## 9. Lint Evidence

ESLint execution completed with known tooling debt:
```text
TypeError: Converting circular structure to JSON
    at ConfigValidator.formatErrors
```
Workspace files checked via `ReadLints` report zero linter diagnostics.

---

## 10. Files Changed

### Runtime
- `lib/whatsapp/public.ts`
- `app/b/[slug]/success/page.tsx`

### Verify
- `lib/whatsapp/public.verify.ts` (NEW)

### CSS / SQL
- None (0 files)

---

## 11. Findings (P0–P3)

- **P0:** 0 findings.
- **P1:** 0 findings.
- **P2:** 0 findings.
- **P3:** Public checkout submit was not executed live without explicit environment authorization; manual order creation toast remains generic `"Pedido creado."`.

---

## 12. Hard Boundaries

- `create_order` RPC = **UNCHANGED**
- UUID query identity (`/b/[slug]/success?order_id=...`) = **UNCHANGED**
- `orders.id` primary key = **UNCHANGED**
- `orders.order_code` schema & generation = **UNCHANGED**
- `buildOrderDisplayRef` helper = **UNCHANGED**
- Admin WhatsApp (`lib/whatsapp/admin.ts`) = **UNCHANGED**
- Admin Copy/Share = **UNCHANGED**
- Dashboard & Workspace = **UNCHANGED**
- DB / SQL / RPC = **UNCHANGED**
- CSS = **NONE**
- Commit / push / deploy = **NO**

---

## 13. Gate

`PUBLIC-CATALOG-SUCCESS-WHATSAPP-BUSINESS-COPY-1` = **PASS — PUBLIC SUCCESS WHATSAPP BUSINESS COPY FROZEN**
