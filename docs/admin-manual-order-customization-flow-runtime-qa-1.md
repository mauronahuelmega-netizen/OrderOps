# Admin Manual Order Customization Flow — Runtime QA 1

## 1. Objective

Close runtime QA debt for the admin manual-order customization flow (MODE A no-submit by default; MODE B only with explicit authorization).

## 2. Previous phase dependency

`ADMIN-MANUAL-ORDER-CUSTOMIZATION-FLOW-SERVER-PAYLOAD-1` — enriched submit wired; bare-vs-configured safety; `create_order` unchanged.

## 3. Authorization mode

| Field | Value |
| ----- | ----- |
| Mode | **MODE A — NO-SUBMIT QA** |
| Explicit submit auth (`AUTORIZO_CREAR_1_PEDIDO_QA_MANUAL_PERSONALIZADO_EN_DEV=yes`) | **NO** |
| Real order allowed | **NO** |

## 4. Environment / auth preflight

| Check | Result |
| ----- | ------ |
| git dirty tree | Expected prior-phase dirt (no reset/clean) |
| Route | `http://localhost:3000/admin/dashboard` |
| Auth | Authenticated — **La Burguesía** · Sesión activa · En vivo |
| Redirect to login | NO |
| Nuevo pedido | Opens (`Crear nuevo pedido manual`) |
| Tenant | La Burguesía (local/dev) |

## 5. Verifies

All PASS:

- server-payload, ticket, domain, UI, safety ×2, single-scroll
- footer/drawer/toolbar/tap
- dashboard terminal/search/metrics
- order-code / display-ref

## 6. Static checks

| Check | Result |
| ----- | ------ |
| `npx tsc --noEmit` | PASS |
| `git diff --check` | PASS (CRLF warnings only) |
| `npm run build` | PASS |
| `npm run lint` | Known ESLint circular JSON debt only |

## 7. Runtime matrix

| Viewport | Theme | Depth |
| -------- | ----- | ----- |
| 390 | dark | **FULL INTERACTION** |
| 412 | dark | **FULL INTERACTION** (compose smoke after full at 390) |
| 360 / 430 / 719 / 768 | dark | smoke deferred (cheap coverage via 390/412/899) |
| 899 | dark | smoke — modal open, body scroll |
| 900 / 1024 / 1440 | dark | smoke — modal open (dual-pane/workstation present) |
| 390 | light | smoke — modal open compose |
| 412 | light | smoke deferred (390 light covered) |

## 8. Simple product QA

| Item | Result |
| ---- | ------ |
| Product | Coca Cola 500ml |
| Quick-add | PASS |
| Qty 1→2→1 | PASS (`$3.000` → `$6.000` → `$3.000`) |
| Total preview | PASS |
| Configure subview | NOT opened (simple path) |
| Remove | PASS |
| Network create | NONE |
| Crear pedido clicked | **NO** |

## 9. Customizable product configure QA

| Item | Result |
| ---- | ------ |
| Product | BBQ Bacon (+ Doble Smash visible) |
| Configure opens | PASS — admin-native `Configurar BBQ Bacon` |
| Public modal / native alert | NONE |
| Required incomplete | PASS — `Agregar` disabled; alert `Elegí una opción en “Papas”.` |
| Required complete | PASS — Papas chicas enables Agregar |
| Optional extras | PASS — Mayonesa selectable |
| Qty extras | PASS — Cheddar stepper (`− 1 +`); preview +`$500` |
| Adicional/upsell | PASS — Coca Cola 500ml under Adicional |
| Preview total | PASS — `$17.000` (base `$13.500` + Cheddar `$500` + Adicional `$3.000`) |
| Confirm to ticket | PASS |
| Ticket before Confirm | unchanged until Agregar |
| Back/discard | Observed Escape closes modal (operator note); Volver available in configure |

## 10. Client validation QA

- Required gate blocks Confirm until Papas selected — PASS
- Optional + qty extra update preview — PASS
- Adicional selectable — PASS
- Over-limit max options — not force-exercised at runtime; covered by server-payload verifies

## 11. Submit QA status

| Field | Value |
| ----- | ----- |
| Mode | A |
| Crear pedido clicked | **NO** |
| Valid configured submit | Ready (button enabled with enriched ticket) — not clicked |
| Order created | **NO** |
| order_code | N/A |
| DB mutation | **NO** |
| Result | **DEFERRED** (MODE B) |

## 12. Created order validation

authorized: NO · order_code: N/A · result: NOT RUN / DEFERRED

## 13. Dashboard card validation

NOT RUN (MODE A)

## 14. Workspace Products validation

NOT RUN (MODE A)

## 15. WhatsApp/contact summary validation

NOT RUN (MODE A) — no WhatsApp sending in any mode without auth

## 16. Single-scroll validation

| Check | Result |
| ----- | ------ |
| ≤899 owner | `.manual-order-modal__body` `overflow-y: auto` sole scroll owner |
| Products nested scroll | Not present as overflow auto pane |
| Ticket nested scroll | Not present |
| Configure subview | Flows in body; no panel `overflow-y: auto` |
| Footer CTA | Visible |
| Body leakage | No evidence of background scroll while modal open |
| ≥900 | Modal opens; workstation class present |

## 17. Regression smoke

Drawer/toolbar/footer/tap/terminal/search/Kanban/metrics/order_code: verify PASS · frozen · no mutations. Public catalog/success: untouched. Footer single-line visible on mobile (`© 2026 OrderOps` / `Panel protegido · v1.0`).

## 18. No mutation / mutation proof

- No `Crear pedido` click
- No order cards added during session for QA customer
- No WhatsApp send
- No status mutations

## 19. Files changed

| Area | Files |
| ---- | ----- |
| runtime/code | **NONE** |
| CSS | **NONE** |
| SQL/migration | **NONE** |
| docs | this file + CURRENT_PHASE + living audit + living memory (+ optional follow-ups) |

## 20. P0–P3 findings

| Sev | Finding |
| --- | ------- |
| P0 | None |
| P1 | None |
| P2 | MODE B submit + dashboard/workspace/contact post-create still deferred |
| P3 | Full smoke matrix widths 360/430/719/768/1024 light 412 not all exercised (390/412 dark full + representative smokes done) |

## 21. Hard boundaries

No code/CSS/SQL/RPC/public/dashboard polish changes. No commit/push/deploy. No real orders.

## 22. Gate

**ADMIN-MANUAL-ORDER-CUSTOMIZATION-FLOW-RUNTIME-QA-1 = PASS WITH ACCEPTED ORDER-SUBMIT QA DEBT — NO-SUBMIT RUNTIME QA COMPLETE**

MODE A remains closed.

**MODE B follow-up (2026-09-07):** authorized submit executed and closed — see `docs/admin-manual-order-customization-flow-runtime-qa-mode-b-1.md` (`order_code` **TJK9R5**). Combined runtime QA for the customization flow is now **PASS — MODE B AUTHORIZED SUBMIT QA CLOSED**.

Next: **ADMIN-DASHBOARD-MOBILE-ORDERS-FINAL-CLOSEOUT-1 — RESUME AFTER MODE B**
