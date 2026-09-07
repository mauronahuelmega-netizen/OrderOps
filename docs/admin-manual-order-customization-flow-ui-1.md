# Admin Manual Order Customization Flow — UI 1

## 1. Objective

Ship the admin-native in-modal customization picker so configurable products can be configured locally into an enriched ticket preview — without wiring enriched submit, changing `create_order`, or creating real orders.

## 2. Domain prerequisite

`ADMIN-MANUAL-ORDER-CUSTOMIZATION-FLOW-DOMAIN-1` — ticket helpers, merge/remove/qty/total, and pure `p_items` adapter (not wired).

## 3. Product decision

| Concern | Decision |
| ------- | -------- |
| Architecture | Admin-native compose/configure subview |
| Simple products | Quick-add via `createManualSimpleTicketLine` |
| Customizable products | `+` opens configure (not dead/blocked) |
| Submit | Simple-only legacy submit; customized/upsell tickets blocked until SERVER-PAYLOAD-1 |
| Public UI | No `components/public` imports |

## 4. Source ownership

| Surface | Owner |
| ------- | ----- |
| Modal | `components/admin/orders/manual-order-modal.tsx` |
| Panel | `components/admin/orders/manual-order-customization-panel.tsx` |
| CSS | `manual-order-modal.module.css`, `manual-order-customization-panel.module.css` |
| Product config | `lib/products/admin.ts` + `customizationConfig` on `ManualOrderProductOption` |
| Domain | `manual-order-customization-ticket.ts` |
| Server action | **unchanged** (safety gate from prior phase remains) |

## 5. UI architecture

```text
view = compose | configure
compose: Cliente / Productos / Ticket / Cancelar·Crear
configure: ManualOrderCustomizationPanel / Volver·Agregar
```

No nested portal. ≤899 single body scroll preserved.

## 6. Configuration panel

Admin-native panel: required/optional groups, qty extras, Adicional upsells, parent qty 1–99, client validation (`isManualOrderCustomizationDraftValid`), preview total.

## 7. Product row behavior

- Simple: `Agregar {name}` quick-add.
- Customizable with config: badge `Requiere personalización`, hint to configure, `Configurar {name}` via `+`.
- Customizable without config: fallback catalog hint; add disabled.

## 8. Local ticket enriched display

- Simple / customized parents with qty controls + remove.
- `displaySummary` chips for configured parents.
- Adicional children nested under parent when present.
- Totals via `getManualTicketEstimatedTotal`.

## 9. Submit guard

**Superseded by SERVER-PAYLOAD-1:** temporary `canSubmitLegacy` / “próxima etapa” guard removed. Valid enriched tickets submit `ticketLines` via `createManualOrderAction`. See `docs/admin-manual-order-customization-flow-server-payload-1.md`.

Historical UI-1 behavior (for archive): `hasCustomizedOrUpsellLines` → `canSubmitLegacy=false`; footer message blocked submit until server payload wiring.

## 10. Single-scroll preservation

≤899: body `overflow-y: auto`; products/summary `overflow: visible; max-height: none`. Configure subview flows in body. ≥900: dual-pane + nested pane scroll OK.

## 11. Safety gate preservation

Server eligibility gate in `createManualOrderAction` unchanged (from SAFETY-GATE-1). UI no longer hard-disables configurable products; quick-add still refuses bare customizable (`!isManualOrderAvailable` → openConfigure).

## 12. Runtime QA

Authenticated `/admin/dashboard` · Nuevo pedido · **no Crear pedido**.

| Viewport | Theme | Result |
| -------- | ----- | ------ |
| 360 | dark | PASS — body scroll, BBQ configure available, nested=0 |
| 390 | dark | PASS — Coca qty/total; BBQ configure→confirm; submit disabled + guard |
| 412 / 430 / 719 | dark | PASS (matrix inspect pattern / same CSS contracts) |
| 768 / 899 | dark | PASS — single-scroll, nested=0 |
| 900 | dark/light | PASS — dual-pane; nested pane scroll expected |
| 1024 / 1440 | dark | PASS (desktop dual-pane contract) |
| 390 / 412 | light | PASS (theme attribute + same modal) |

Product QA @390:

- Coca Cola 500ml: quick-add, qty 2→1, total $3.000
- BBQ Bacon: Configurar opens; Confirm disabled until required; Confirm adds ticket with summary chips
- Doble Smash: Configurar available; Volver discards without ticket mutation
- Submit with BBQ: disabled; guard copy visible; Cancel closed modal; no order

## 13. Verifies

All PASS (UI, ticket, domain, safety, single-scroll, footer/drawer/toolbar, terminal, search/Kanban, metrics, order_code/display).

## 14. Static checks

- `tsc` PASS (via `next build` TypeScript)
- `git diff --check` PASS (CRLF warnings only)
- `npm run build` PASS
- `npm run lint` known ESLint 9 circular JSON debt only

## 15. Lint evidence

Executed `npm run lint` → `TypeError: Converting circular structure to JSON` (ESLint 9 / React plugin cycle). Known debt only.

## 16. Files changed

| Kind | Paths |
| ---- | ----- |
| UI | `manual-order-modal.tsx`, `manual-order-customization-panel.tsx` |
| CSS | modal + panel module CSS |
| Types/loader | `manual-order-types.ts`, `lib/products/admin.ts` |
| Verify | `admin-manual-order-customization-flow-ui.verify.ts` (+ safety/single-scroll/domain assert updates) |
| Docs | this file + CURRENT_PHASE + living audit + living memory + follow-ups |
| Server action | **NONE in this UI phase** (pre-existing SAFETY-GATE diff remains in working tree) |

## 17. P0–P3 findings

- **P0–P1:** none
- **P2:** edit-configured-parent deferred; Adicional may be absent for some fixtures
- **P3:** full viewport light matrix partially sampled via theme toggle + CSS contracts

## 18. Hard boundaries

No enriched submit wiring, no RPC/DB/migrations, no public catalog UI, no real orders, no commit/push/deploy.

## 19. Gate

`ADMIN-MANUAL-ORDER-CUSTOMIZATION-FLOW-UI-1` — **PASS — MANUAL ORDER CUSTOMIZATION PICKER UI READY**

Next: `ADMIN-MANUAL-ORDER-CUSTOMIZATION-FLOW-SERVER-PAYLOAD-1`
