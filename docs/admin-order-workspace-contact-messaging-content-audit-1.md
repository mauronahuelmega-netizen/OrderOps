# ADMIN-ORDER-WORKSPACE-CONTACT-MESSAGING-CONTENT-AUDIT-1

**Date:** 2026-08-21  
**Type:** AUDIT-ONLY — Contact / WhatsApp message content forensics  
**Gate:** AUDIT COMPLETE — READY FOR PRODUCT DECISIONS  
**Baseline commit:** `81b1162` (unchanged)  
**Runtime / CSS / DB / RPC / realtime changes:** NONE  
**No commit / push / deploy**

---

## 1. Executive conclusion

| Question | Answer |
| --- | --- |
| Current messaging maturity | **MVP-era flat product lines** (`- Nx product_name` + Total). Structurally frozen since Initial OrderOps MVP (`31726f4`, 2026-06-16). |
| Main gap | Order payloads already carry V1/V2 `customization_snapshot`, `item_kind`, `parent_order_item_id`, but WhatsApp / Copiar resumen / Compartir **ignore** that structure. Upsells appear as detached flat lines. |
| Customer impact | Customer cannot verify personalizations / qty extras / parent-associated Adicional via Contacto messages. Operators already see richer preparation UI. |
| Implementation feasibility | **HIGH** for V2 (and safe partial V1) using persisted snapshots only — **no live config**. Requires Product decisions on density/format before coding. |

**Contextual WhatsApp default remains CLOSED / PASS** (selection only). This audit does **not** reopen defaults.

---

## 2. Why audit now

Product Customization V1 → V2 quantity extras → workspace preparation hierarchy evolved past the WhatsApp summary layer. Documented debt: `WHATSAPP_ADMIN_EXTRAS_DISPLAY_DEBT` (P3 in quantity-extras QA). Contact visual polish and secondary-action regrouping are deferred; content architecture must be decided first.

---

## 3. Current owners

### `lib/whatsapp/admin.ts` — symbols

| Symbol | Role |
| --- | --- |
| `AdminOrderWhatsappStatus` / `AdminOrderWhatsappMethod` | Local unions |
| `AdminOrderWhatsappItem` | `{ product_name, quantity }` only |
| `AdminOrderWhatsappShape` | Message input shape (narrow) |
| `AdminOrderWhatsappTemplateKey` | 7 keys |
| `AdminOrderWhatsappTemplate` | `{ key, label, message }` |
| `normalizeCustomerName` | **First token only** for greetings |
| `normalizePhoneDigits` | Digits for `wa.me` / `tel:` |
| `sanitizeWhatsappText` | NFC + whitespace normalize |
| `formatWhatsappCurrency` | `es-AR` `$N` |
| `buildGreeting` | `Hola {firstName}` |
| `buildOrderSummaryText` | Flat `- qtyx name` (or `item_summary` fallback) |
| `buildOrderWhatsappMessage` | Per-template body |
| `getWhatsappTemplatesForOrder` | Availability list + builds messages |
| `getWhatsappTemplateLabel` | UI labels |
| `buildAdminOrderWhatsappUrl` | `wa.me/{digits}?text=` |
| `getPreferredWhatsappTemplateKeyForOrder` | Contextual default (workspace) |
| `resolveWhatsappTemplateKey` | preferred → summary → first |
| `buildContextualOrderWhatsappUrl` | Preferred message URL |
| `buildOrderMapsUrl` / `buildOrderCallUrl` | Utilities |
| `buildOrderContactSummary` | Copiar resumen / Compartir payload |

### UI

| Surface | Consumer | Notes |
| --- | --- | --- |
| Workspace modal | `OrderExternalActions` + `contextualTemplateDefault` | Contacto rail |
| Order detail | `order-actions-section.tsx` → `OrderExternalActions` | list-position default |
| Message generation | At `getWhatsappTemplatesForOrder` / render | Message prebuilt per template; URL uses `selectedWhatsappTemplate.message` |
| Selected template | `useState` in `order-external-actions.tsx` | Contextual reset via `useLayoutEffect` on id/status/method |

### Preparation / snapshot (structured, unused by WhatsApp)

| Owner | Role |
| --- | --- |
| `order-types.ts` | V1/V2 snapshot types |
| `order-dashboard.ts` | `parseCustomizationSnapshot`, `getCustomizationSummaryLines`, `buildDashboardOrderItemTree` |
| `order-preparation.ts` | `buildOrderPreparationItems` — kitchen/UI view model from tree + snapshot |

Public `lib/whatsapp/public.ts`: **out of scope**; no shared summary helper with admin.

---

## 4. Git / history timeline

| Milestone | Evidence | Date / commit |
| --- | --- | --- |
| **T0 — WhatsApp admin architecture** | `lib/whatsapp/admin.ts` introduced; flat `buildOrderSummaryText`; all 7 templates | **2026-06-16** `31726f4` Initial OrderOps MVP |
| **T1 — Customization snapshots** | Catalog/order snapshot path | **2026-07-17** `a284a23` (+ related migrations) |
| **T2 — Quantity-enabled extras** | V2 qty in cart/orders | **2026-08-13** `de89087` / schema `842c2fc` |
| **T3 — Structured preparation** | `order-preparation.ts` + Products hierarchy | **Uncommitted** relative to baseline `81b1162`; audit docs ~2026-08-18 |
| **T4 — Contextual WhatsApp default** | Preference helpers + workspace flag | **Uncommitted** (docs 2026-08-20); **message bodies unchanged** |
| **Message body last material update** | `git blame` / `git log --follow`: template copy still from `31726f4` | **2026-06-16** |
| Confidence | **HIGH** for body freeze vs T1–T3; working-tree only adds selection helpers |

**Verdict:** Message content **pre-dates** customization architecture and remained frozen through V1/V2/preparation.

---

## 5. Template inventory

| key | visible label | exact intent | available when | delivery restriction | pickup restriction | current structure | data inputs | order ref | customer name | products | personalization | address | total | owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `received` | Pedido recibido | Ack receipt | `status===pending` | — | — | greeting + “Recibimos…” + flat summary + Total + prep teaser | first name, flat items, total | NO | first name | flat | NO | NO | YES | `buildOrderWhatsappMessage` |
| `preparing` | Avisar preparación | Prep started | `status===preparing` | — | — | greeting + prep + flat summary + Total | same | NO | first | flat | NO | NO | YES | same |
| `ready_pickup` | Listo para retirar | Ready for pickup | `status===ready` && pickup | — | pickup only | greeting + ready + flat + Total + “Te esperamos” | same | NO | first | flat | NO | NO | YES | same |
| `ready_delivery` | Listo para delivery | Ready, about to leave | `status===ready` && delivery | delivery | — | greeting + ready delivery + flat + Total | same | NO | first | flat | NO | NO | YES | same |
| `on_the_way` | En camino | Out for delivery | always if delivery (any status) | delivery only | hidden on pickup | greeting + en camino + flat + Total | same | NO | first | flat | NO | NO | YES | same |
| `confirm_address` | Confirmar dirección (delivery) / Confirmar datos (pickup label unused — key only pushed for delivery) | Confirm address | delivery method | delivery only | not listed | greeting + confirm Q + address | first name, address | NO | first | NO | NO | YES | NO | same |
| `summary` | Enviar resumen | Share order summary | always | — | — | greeting + “resumen” + flat + Total | same as received products | NO | first | flat | NO | NO | YES | same |

---

## 6. Contextual default vs availability

**Default (CLOSED):** matches documented matrix — pending→`received`, preparing→`preparing`, ready+delivery→`ready_delivery`, ready+pickup→`ready_pickup`, completed/cancelled→`summary`. Verified via helpers + `admin-contextual-default.verify.ts` PASS.

| Status | Default | Available (delivery) | Available (pickup) |
| --- | --- | --- | --- |
| pending | received | received, confirm_address, on_the_way, summary | received, summary |
| preparing | preparing | preparing, confirm_address, on_the_way, summary | preparing, summary |
| ready | ready_* | ready_delivery, confirm_address, on_the_way, summary | ready_pickup, summary |
| completed | summary | confirm_address, on_the_way, summary | summary |
| cancelled | summary | confirm_address, on_the_way, summary | summary |

`confirm_address` / `on_the_way` remain **manually selectable** on delivery even when not default.

---

## 7. Current exact message examples

Fixture (source-shaped, local helper execution — no WhatsApp send):

- customer_name: `Mauro Ramirez` → greeting **`Hola Mauro`**
- delivery + address + total `$68.600`
- flat items: BBQ Bacon×2, Coca Cola×2, Doble Smash×1, Coca Cola×1  
  (**Note:** upsells are indistinguishable from roots in current builder.)

### received

```text
Hola Mauro

Recibimos tu pedido:

- 2x BBQ Bacon
- 2x Coca Cola 500ml
- 1x Doble Smash
- 1x Coca Cola 500ml

Total: $68.600

Te avisamos apenas comience la preparación.
```

### preparing

```text
Hola Mauro

Tu pedido ya está en preparación.

- 2x BBQ Bacon
- 2x Coca Cola 500ml
- 1x Doble Smash
- 1x Coca Cola 500ml

Total: $68.600
```

### ready_pickup / ready_delivery / on_the_way

Same flat summary + Total; only status sentence differs (see §5).

### confirm_address

```text
Hola Mauro

Nos confirmás esta dirección para el envío?

Nunez N°3050, Glew
```

### summary

```text
Hola Mauro

Te compartimos el resumen de tu pedido:

- 2x BBQ Bacon
- 2x Coca Cola 500ml
- 1x Doble Smash
- 1x Coca Cola 500ml

Total: $68.600
```

---

## 8. Order data available

Workspace/`AdminOrderDetail` items include (among others): `id`, `product_name`, `quantity`, `unit_price`, `item_kind`, `parent_order_item_id`, `customization_snapshot`, plus order-level `customer_name`, `phone`, `delivery_method`, `address`, `status`, `total_price`, `notes`, `item_summary`.

Nested `order_items` select has **no explicit `.order(...)`** — array order is preserved by tree helpers but DB order is **not formally guaranteed** without ORDER BY.

---

## 9. Order data currently consumed by WhatsApp

| Field | Used? |
| --- | --- |
| `customer_name` | YES — **first word only** |
| `phone` | YES — URL / actions |
| `delivery_method` | YES — availability + labels |
| `address` | YES — `confirm_address` + contact summary |
| `status` | YES — availability + default |
| `total_price` | YES — most templates |
| `order_items[].product_name` + `quantity` | YES — flat |
| `item_summary` | fallback only |
| `id` / display ref | **NO** |
| `notes` | **NO** |
| `item_kind` / `parent_order_item_id` | **NO** |
| `customization_snapshot` | **NO** |
| `unit_price` | **NO** |

---

## 10–13. Snapshot capabilities

| Data | V2 | V1 | Legacy | Safe for customer message? |
| --- | --- | --- | --- | --- |
| parent product | YES | YES | YES | YES |
| parent qty | YES | YES | YES | YES |
| group name | YES | YES | NO | YES (optional) |
| option name | YES | YES | NO* | YES |
| option qty per unit | YES | NO (implicit 1) | NO | YES if present |
| operational total (`qty×parent`) | YES (derivable) | PARTIAL | NO | **Kitchen-leaning** — recommend omit customer-facing |
| upsell child | YES via tree | YES via tree | YES if rows exist | YES with parent association |
| sort order (group/option) | YES | YES | NO | YES when present |
| price delta | YES | YES | NO | **Avoid** (double-count vs final unit_price) |

\*Legacy may have free-text `products.description` fragments — **not trustworthy** for messaging without strong evidence; prefer `N× product_name` only.

**Live config reads for historical messages:** must remain **NO**. Preparation path already proves snapshot-only derivation.

---

## 14. Upsell / Adicional

- Stored as separate `order_items` with `item_kind='upsell'` + `parent_order_item_id`.
- `buildDashboardOrderItemTree` associates children to parents.
- WhatsApp today: **flat list**, no “Adicional”, no parent binding → customer-facing ambiguity (two Coca lines).
- Deterministic future line `- Adicional: Coca Cola 500ml ×2` under parent: **YES** from tree.

---

## 15. Preparation architecture

`buildOrderPreparationItems` = presentation/kitchen view model (includes `operationalTotal`, prices).  

**Reuse recommendation:** **B** — extract / introduce a **pure customer-order-summary model** from tree+snapshot; do **not** pipe kitchen preparation VM straight to WhatsApp (Option C contaminates). Option A (WhatsApp-only parse) duplicates work vs Copy/Share.

---

## 16. WhatsApp vs preparation gap

| | Products preparation | WhatsApp / copy / share |
| --- | --- | --- |
| Structure | Groups, qty extras, Adicional under parent | Flat `qtyx name` |
| Severity | — | **P2** content debt (not P0/P1 incorrect identity; omission + upsell detachment) |

---

## 17–18. Copiar resumen / Compartir

| | Copiar resumen | Compartir |
| --- | --- | --- |
| Builder | `buildOrderContactSummary` | same text via `shareText` / Web Share |
| Content | full `customer_name`, flat summary, Total, Método, Dirección | same |
| Personalization | NO | NO |
| Relationship to WhatsApp | **Same flat `buildOrderSummaryText`**; different envelope (no greeting templates) | same |

Both are **communication/content** actions sitting under “Más acciones” today — strong candidate to regroup with Contact messaging later (presentation phase).

---

## 19. Quick utility separation

| Action | Message content? | Future grouping |
| --- | --- | --- |
| Abrir WhatsApp | YES | CONTACT MESSAGING |
| Copiar resumen / Compartir | YES | CONTACT MESSAGING |
| Copiar teléfono / Llamar / Copiar dirección / Maps | NO | SECONDARY UTILITIES |

---

## 20. Customer vs kitchen metadata

| Field | Class |
| --- | --- |
| parent qty, product name, option names, meaningful per-unit qty, Adicional, delivery/address, notes | CUSTOMER-FACING |
| group name | BOTH (optional compact) |
| operational `N total` | KITCHEN-ONLY (recommend omit) |
| price deltas | KITCHEN/internal — avoid in customer copy |
| line/order monetary total | BOTH / CONTEXTUAL by template |
| risk flags | KITCHEN-ONLY |

---

## 21. Price / total decision

**Current:** Total in all templates except `confirm_address`. No unit/line prices. No option deltas.

**Recommendation:**

| Template | Monetary total |
| --- | --- |
| received | OPTIONAL / KEEP if short; if DETAILED products grow long, consider omit or footer-only |
| preparing / ready_* / on_the_way | OMIT preferred (status ping) |
| confirm_address | OMIT (already) |
| summary | KEEP or OPTIONAL — strongest “receipt” candidate |

Option price deltas: **never** in customer WhatsApp (double-count risk).

---

## 22. Notes / Indicaciones

**Current:** unused.  
**Recommendation:** **CONDITIONAL** — include in `received` and `summary` when `notes.trim()` present; omit on minimal status pings. Customer already authored text; reassurance value high; length risk manageable with one short block.

---

## 23. WhatsApp formatting syntax

Local URL roundtrip:

- `*bold*` preserved after `encodeURIComponent` / decode.
- Newlines preserved (`%0A`).
- Hyphens / plain dashes preserved.
- Candidate separators and `- ` options are encoding-safe.

Recommendation: WhatsApp markdown only in WhatsApp formatter; plain text for Copy/Share.

---

## 24. Product Owner candidate assessment

Candidate:

```text
*2× BBQ Bacon*
--------------------------------
- Papas grandes
- Big Mac / BBQ
- Bacon ×4 c/u
- Cheddar ×4 c/u
--------------------------------
- Adicional: Coca Cola 500ml ×2
```

| Criterion | Score (1–5) |
| --- | --- |
| WhatsApp readability | 4 |
| Customer comprehension | 4 |
| Message density | 3 (dashes heavy on mobile) |
| Historical fidelity | 5 (V2) |
| V1 compatibility | 3 (no ×N c/u — must degrade) |
| V2 compatibility | 5 |
| Multi-product scalability | 3 with heavy dividers; 4 with blank lines |

**Decision: KEEP WITH CHANGES**

Strengths: bold roots; hyphen options; Adicional under parent; qty extras expressible.  
Weaknesses: long dashed separators; group labels omitted (Option A ambiguity if same option names collide — rare); no notes/ref; operational total correctly omitted.

**Preferred format family:** Option A compact **or** light Option B (`- Salsas: Big Mac / BBQ`) + **blank line** between roots (not `--------------------------------`). Multi-root: blank line + bold next root; Adicional stays under parent before next root.

---

## 25. Current vs candidate examples

### CURRENT (today)

```text
Hola Mauro

Te compartimos el resumen de tu pedido:

- 2x BBQ Bacon
- 2x Coca Cola 500ml
- 1x Doble Smash
- 1x Coca Cola 500ml

Total: $68.600
```

### CANDIDATE A — Product Owner proposal (V2-capable)

```text
*2× BBQ Bacon*
--------------------------------
- Papas grandes
- Big Mac / BBQ
- Bacon ×4 c/u
- Cheddar ×4 c/u
--------------------------------
- Adicional: Coca Cola 500ml ×2

*1× Doble Smash*
--------------------------------
- …
```

### CANDIDATE B — audit-recommended variant

```text
Hola Mauro

Resumen de tu pedido:

*2× BBQ Bacon*
- Papas grandes
- Salsas: Big Mac / BBQ
- Bacon ×4 c/u · Cheddar ×4 c/u
- Adicional: Coca Cola 500ml ×2

*1× Doble Smash*
- Papas grandes
- …

Indicaciones: Sin cebolla

Total: $68.600
```

Approx length (2 roots + extras + notes): ~450–700 characters / ~20–30 lines — usable; prefer for `summary` (+ maybe `received`), not every status ping.

---

## 26. Per-template recommended content matrix

| Template | Current content | Recommended density | Products | Customization | Address | Notes | Price/Total |
| --- | --- | --- | --- | --- | --- | --- | --- |
| received | flat + total | CONTEXTUAL | COMPACT or DETAILED | COMPACT/DETAILED | NONE | CONDITIONAL | OPTIONAL |
| preparing | flat + total | MINIMAL | NONE or MINIMAL ref | NONE | NONE | NONE | OMIT |
| ready_pickup | flat + total | MINIMAL | NONE | NONE | NONE | NONE | OMIT |
| ready_delivery | flat + total | MINIMAL | NONE | NONE | NONE | NONE | OMIT |
| on_the_way | flat + total | MINIMAL/CONTEXTUAL | NONE | NONE | CONDITIONAL short | NONE | OMIT |
| confirm_address | address only | CONTEXTUAL | NONE | NONE | DETAILED | NONE | NONE |
| summary | flat + total | DETAILED | DETAILED | DETAILED | CONDITIONAL | CONDITIONAL | KEEP/OPTIONAL |

---

## 27. Snapshot compatibility matrix

See §10–13 table (required matrix satisfied there).

---

## 28. Future architecture options

| Option | Pros | Cons |
| --- | --- | --- |
| **A** Upgrade `admin.ts` only | Fast | Duplicates Copy/Share; WhatsApp-coupled |
| **B** Pure `buildCustomerOrderSummary()` → channel formatters | Shared, testable, no live config | New module; careful API |
| **C** Reuse preparation VM | Already structured | Kitchen fields leak; UI coupling |

---

## 29. Recommended architecture

**Choice: B**

```text
AdminOrderItem[]
  → buildDashboardOrderItemTree / parseCustomizationSnapshot
  → buildCustomerOrderSummary()   // pure, customer-facing, no *bold*
  → formatWhatsappOrderSummary()  // *bold*, bullets
  → formatPlainTextOrderSummary() // Copiar / Compartir
```

Live config reads: **NO**.  
Preparation mapper: inspiration only, not direct consumer.

---

## 30. Blast radius (future implementation)

| Area | Expectation |
| --- | --- |
| Likely files | new pure summary module; `lib/whatsapp/admin.ts`; `order-external-actions` only if UI regroups later |
| Shared consumers | WhatsApp templates, Copiar resumen, Compartir |
| Public WhatsApp | UNCHANGED |
| DB / RPC / realtime | NONE |
| Products UI | UNCHANGED |

---

## 31. P0–P3

| Sev | Finding |
| --- | --- |
| P0 | None (no cross-tenant/wrong-order architecture found) |
| P1 | None blocking; **reject** any future design that reads live customization config for historical messages |
| P2 | Flat summary omits V1/V2 personalization, qty extras, and parent-associated Adicional despite data availability; upsells flattened |
| P3 | No order ref; first-name only greeting; Total on every status ping; heavy candidate dividers; Copy/Share under Más acciones |

---

## 32. Product decisions required

| # | Question | Audit recommendation |
| --- | --- | --- |
| A | Minimal templates? | preparing, ready_*, on_the_way |
| B | Detailed products? | summary (+ optionally received) |
| C | `summary` = rich canonical? | **YES** |
| D | `received` include detail? | **YES compact/detailed** (PO choose length) |
| E | Omit kitchen `N total`? | **YES omit** |
| F | Omit monetary total? | omit on status pings; keep/optional on summary/received |
| G | Indicaciones? | conditional on received/summary |
| H | Root `*bold*`? | YES on WhatsApp only |
| I | Options `- `? | YES |
| J | Divider lines? | prefer blank lines over long dashes |
| K | Group labels? | light Option B preferred over pure A |
| L | Adicional? | under parent root |
| M | Copy/Share into Contacto? | YES conceptually |
| N | Architecture? | **Option B** |

---

## 33. Implementation readiness

**READY FOR PRODUCT DECISIONS** — not implementation until A–N locked. Data + reuse path are sufficient for a follow-up implementation phase.

---

## 34. Gate

**ADMIN-ORDER-WORKSPACE-CONTACT-MESSAGING-CONTENT-AUDIT-1 = AUDIT COMPLETE — READY FOR PRODUCT DECISIONS**

CONTACT MESSAGING: AUDITED — NOT IMPLEMENTED  
CONTEXTUAL WHATSAPP DEFAULT: REMAINS PASS / UNCHANGED  
CONTACT VISUAL POLISH: NOT STARTED  
SECONDARY ACTIONS: DEFERRED  

No commit. No push. No deploy.

---

## Product decision closure — 2026-08-22

Locked for implementation:

* preparing / ready_* / on_the_way = minimal;
* received + summary = structured;
* summary = canonical rich;
* kitchen `N total` omitted;
* monetary Total omitted from Contact messaging (stricter than audit optional keep);
* Indicaciones conditional received/summary (+ Copy/Share);
* WhatsApp bold roots;
* option bullets with light group labels;
* blank lines instead of dashed dividers;
* Adicional under parent;
* Copy/Share content uses same structured model (UI placement unchanged);
* architecture Option B.

## Implementation follow-up — 2026-08-22

**ADMIN-ORDER-WORKSPACE-CONTACT-MESSAGING-STRUCTURED-CONTENT-IMPL-1 = PASS — STRUCTURED CONTACT MESSAGING FROZEN**

Doc: `docs/admin-order-workspace-contact-messaging-structured-content-impl-1.md`

## Visual hierarchy closure — 2026-08-22

The audit recommendation to conceptually group WhatsApp + Copiar resumen + Compartir was implemented at workspace presentation level (**ADMIN-ORDER-WORKSPACE-CONTACT-MESSAGING-VISUAL-HIERARCHY-POLISH-1**). Phone/call/address/maps remain secondary utilities. No content architecture change. Doc: `docs/admin-order-workspace-contact-messaging-visual-hierarchy-polish-1.md`.
