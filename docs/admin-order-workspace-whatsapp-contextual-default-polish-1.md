# ADMIN-ORDER-WORKSPACE-WHATSAPP-CONTEXTUAL-DEFAULT-POLISH-1

**Status:** PASS  
**Date:** 2026-08-20  
**Type:** Targeted functional UX polish — contextual Contacto WhatsApp default  
**Baseline commit (unchanged):** `81b1162`  
**No commit / push / deploy**

---

## 1. Objective

Replace list-position WhatsApp default (`whatsappTemplates[0]`) with a deterministic default from `order.status` + `order.delivery_method`, without changing templates, message copy, Abrir WhatsApp behavior, or status/realtime/DB.

## 2. Previous defect

Default = first template in list order.

Completed + delivery templates were `[confirm_address, on_the_way, summary]` → default **Confirmar dirección** — operationally misleading (P2).

## 3. Owners / consumers

| Symbol | Consumers |
| ------ | --------- |
| `OrderExternalActions` | `admin-order-workspace-modal.tsx` (workspace), `order-actions-section.tsx` (detail/shared) |
| `buildContextualOrderWhatsappUrl` | defined in `lib/whatsapp/admin.ts` only (no UI callers before this phase) |

**Scoping:** SHARED component → optional `contextualTemplateDefault` enabled only from workspace (`key={displayOrder.id}`). Detail surfaces keep list-position default.

## 4. Template inventory

Unchanged: `received`, `preparing`, `ready_pickup`, `ready_delivery`, `on_the_way`, `confirm_address`, `summary` with existing labels/messages.

## 5. Contextual default matrix

| Status | Delivery | Pickup |
| ------ | -------- | ------ |
| pending | `received` | `received` |
| preparing | `preparing` | `preparing` |
| ready | `ready_delivery` | `ready_pickup` |
| completed | `summary` | `summary` |
| cancelled | `summary` | `summary` |

## 6. Preference helper architecture

`lib/whatsapp/admin.ts`:

- `getPreferredWhatsappTemplateKeyForOrder({ status, deliveryMethod })`
- `resolveWhatsappTemplateKey(preferred, availableKeys)`
- `buildContextualOrderWhatsappUrl` reuses the preferred helper

UI: `order-external-actions.tsx` sets `selectedTemplate` via `useLayoutEffect` on `order.id` / `status` / `delivery_method` / available keys (stable semantic deps).

## 7. Fallback behavior

preferred available → preferred  
else summary if available → summary  
else first available → first  
else empty → existing empty/no-template UX

Unknown status / ready without valid modality → `summary`.

## 8. Initial open

Workspace open selects contextual default for that order’s status + modality.

## 9. Same-order status changes

Status transitions (optimistic/authoritative display) reset selection to the new contextual default. No auto-open WhatsApp.

## 10. Manual override preservation

While `id`/`status`/`delivery_method`/available keys unchanged, manual selection is preserved across unrelated rerenders. Abrir WhatsApp uses `selectedTemplate`.

## 11. Cross-order reset

`key={displayOrder.id}` remount + `order.id` in layout effect. Manual selection from order A does not leak to B.

## 12. Ready modality split

Ready + delivery → `ready_delivery`  
Ready + pickup → `ready_pickup`  
Uses canonical `delivery_method` only.

## 13. Terminal states

Completed / cancelled → `summary` (both modalities). No cancel-specific template.

## 14. WhatsApp URL behavior

Abrir WhatsApp still builds from current `selectedTemplate.message` via `buildAdminOrderWhatsappUrl`. Message bodies / phone / encoding unchanged.

## 15. Quick actions boundaries

Unchanged: copy phone/call/address/maps/summary/share.

## 16. Network

Additional reads/writes for default selection: **0**.

## 17. Runtime QA

Tenant: La Burguesía.

| Scenario | Expected | Result |
| -------- | -------- | ------ |
| pending delivery | received | PASS (`#33B5`) |
| pending pickup | received | VERIFY PASS / RUNTIME N/A |
| preparing delivery | preparing | PASS |
| preparing pickup | preparing | VERIFY PASS / RUNTIME N/A |
| ready delivery | ready_delivery | PASS (`#33B5`) |
| ready pickup | ready_pickup | VERIFY PASS / RUNTIME N/A (no pickup fixture) |
| completed delivery | summary | PASS (`#AF33`, `#33B5` after complete) |
| completed pickup | summary | VERIFY PASS / RUNTIME N/A |
| cancelled delivery | summary | PASS (`#45E0`) |
| cancelled pickup | summary | VERIFY PASS / RUNTIME N/A |
| manual override same context | preserved | PASS |
| status change after override | reset contextual | PASS (confirm_address → Completar → summary) |
| switch orders | reset contextual | PASS |
| preferred/summary/first/empty fallbacks | as specified | VERIFY PASS |

Primary P2: completed + delivery never defaults `confirm_address` — **CLOSED**.

## 18. Mobile/desktop

Logic identical; no CSS changes. Desktop smoked. Narrow viewport not required for this logic phase.

## 19. Accessibility

Select label intact; keyboard selection works; no aria regressions.

## 20. Console

No controlled/uncontrolled warnings, effect loops, or workspace boundaries observed during QA.

## 21. Checks

| Check | Result |
| ----- | ------ |
| `admin-contextual-default.verify.ts` | PASS |
| pending finalization verify | PASS (prior / unchanged) |
| preparation verify | PASS (prior / unchanged) |
| `tsc --noEmit` | PASS |
| `git diff --check` (scoped) | PASS |
| `npm run build` | PASS (earlier this session; code deltas local) |
| `npm run lint` | known ESLint 9 circular JSON only |

## 22. P0–P3

- **P0:** none  
- **P1:** none  
- **P2 closed:** terminal delivery defaulted to Confirmar dirección  
- **P3:** pickup modality runtime not exercised (no fixture)

## 23. Files changed

Runtime:

- `lib/whatsapp/admin.ts`
- `components/admin/orders/order-external-actions.tsx`
- `components/admin/orders/admin-order-workspace-modal.tsx`

Verify:

- `lib/whatsapp/admin-contextual-default.verify.ts`

Docs:

- this file
- `docs/CURRENT_PHASE.md`
- `docs/admin-dashboard-forensic-living-audit.md`
- `docs/admin-order-workspace-information-action-flow-audit-1.md`
- `ORDEROPS_LIVING_MEMORY.md`

## 24. Hard boundaries

Status / cancel safety / realtime / reconciliation / RPC / DB / Products / Cliente-Entrega / quick actions / message copy / modal layout / network = UNCHANGED.

## 25. Gate

```text
# ADMIN-ORDER-WORKSPACE-WHATSAPP-CONTEXTUAL-DEFAULT-POLISH-1
PASS

Contextual status runtime gate: REMAINS CLOSED
Manual status cancellation safety: REMAINS PASS
Dashboard visual polish: OPEN
No commit. No push. No deploy.
```

---

## Follow-up — content audit (2026-08-21)

This phase remains authoritative for **TEMPLATE DEFAULT selection**.

A later content audit evaluates **template message bodies** separately:

`docs/admin-order-workspace-contact-messaging-content-audit-1.md`

Default selection was complete for its scope; message-copy / personalization parity was intentionally out of scope here.

## Follow-up — structured content impl (2026-08-22)

* Contextual template **DEFAULT** remains authoritative and unchanged.
* Later structured-content phase modernized **message bodies only**.
* Template keys / availability / default matrix unchanged.
* Doc: `docs/admin-order-workspace-contact-messaging-structured-content-impl-1.md`.
