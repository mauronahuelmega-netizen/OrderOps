# Admin Manual Order Customization Safety Gate — Runtime QA 1

## 1. Objective

Close authenticated runtime QA debt for `ADMIN-MANUAL-ORDER-CUSTOMIZATION-SAFETY-GATE-1` without implementation or mutations.

## 2. Precondition / auth state

- Route: `/admin/dashboard`
- Login redirect: **no**
- Session: authenticated (La Burguesía admin dashboard)
- `Nuevo pedido` / `Crear nuevo pedido manual` visible and openable

## 3. Runtime QA matrix

| Viewport | Theme | BBQ blocked | Notes |
| -------- | ----- | ----------- | ----- |
| 360 | dark | PASS | badge + disabled `+` |
| 390 | dark | PASS | full simple/customizable cases |
| 412 | dark | PASS | |
| 430 | dark | PASS | |
| 719 | dark | PASS | |
| 768 | dark | PASS | |
| 899 | dark | PASS | nested scroll debt unchanged |
| 900 | dark | PASS | dual-pane |
| 1024 | dark | PASS | |
| 1440 | dark | PASS | |
| 390 | light | PASS | |
| 412 | light | PASS | |

Known P2: nested product/summary/workstation scrolls ≤899 remain (deferred single-scroll).

## 4. Simple product validation

- Product: **Coca Cola 500ml**
- Row available; no customization badge
- `+` enabled (`Agregar Coca Cola 500ml`)
- Local add to ticket: PASS
- Qty `+` → 2 / total `$ 6.000,00`; qty `-` → 1 / total `$ 3.000,00` (base `$ 3.000,00`)
- No create request / no DB mutation

## 5. Customizable product block validation

- Product: **BBQ Bacon**
- Row `--blocked`
- Badge: `Requiere personalización`
- Helper: `Usá el catálogo hasta habilitar el selector manual.`
- `+` disabled; aria explains unavailability
- Click no-op; ticket stayed without BBQ (empty before Coca add)
- No native alert; no customization picker; no mutation
- Also blocked in list: **Doble Smash** (same badge/disabled)

## 6. Search behavior

- Search `BBQ` → BBQ Bacon still listed (blocked)
- Search `Coca` → Coca Cola 500ml listed (available)
- Cleared query restored list

## 7. No-order / no-mutation proof

- **Crear pedido** never clicked
- Modal closed via **Cancelar**
- No order created, no WhatsApp, no status mutation

## 8. Regression QA

- Drawer: open/close smoke PASS (menu + Escape)
- Footer @390: single-line `© 2026 OrderOps` / `Panel protegido · v1.0` PASS
- Toolbar / terminal density / search-Kanban / metrics / order_code: source verifies PASS (no visual regressions observed during dashboard use)

## 9. Verifies

All PASS:

- `manual-order-customization-safety.verify.ts`
- `admin-manual-order-customization-safety-gate.verify.ts`
- footer / tap / drawer trio / toolbar / terminal / search-Kanban / metrics / order_code / display

## 10. Checks

- `git diff --check` PASS (CRLF warnings only)
- Runtime/CSS/SQL not edited in this QA phase

## 11. Files changed

Docs only:

- this file
- `docs/CURRENT_PHASE.md`
- `docs/admin-dashboard-forensic-living-audit.md`
- `ORDEROPS_LIVING_MEMORY.md`
- `docs/admin-manual-order-customization-safety-gate-1.md` (follow-up note)

## 12. P0–P3 findings

- **P0–P1:** none in QA
- **P2:** nested manual-modal scrolls remain (pre-existing)
- **P3:** none new

## 13. Hard boundaries

No runtime/CSS/DB/RPC/public/dashboard polish changes. No real orders. No commit/push/deploy.

## 14. Gate

`ADMIN-MANUAL-ORDER-CUSTOMIZATION-SAFETY-GATE-RUNTIME-QA-1` — **PASS — MANUAL ORDER CUSTOMIZATION SAFETY GATE RUNTIME QA CLOSED**
