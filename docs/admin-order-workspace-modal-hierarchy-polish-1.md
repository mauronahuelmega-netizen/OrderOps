# ADMIN-ORDER-WORKSPACE-MODAL-HIERARCHY-POLISH-1

**Date:** 2026-08-18  
**Status:** **PASS WITH VISUAL QA DEBT** (browser auth required for full viewport matrix)  
**Baseline commit (living audit):** `81b1162` (unchanged — no commit this phase)

No commit / push / deploy.

---

## Visual problem (before)

- Left and right columns competed at similar visual weight
- Right rail felt like a nested mega-card (border + background + inner cards)
- Too many headings/descriptions (`Control operativo`, `Comunicación`, redundant status copy)
- `Guardar estado`, WhatsApp and `Cerrar` competed visually
- Quick actions felt as heavy as primary operations
- Escaped Unicode literals visible in modal copy (`Comunicaci\u00f3n`, etc.)
- Mobile column order placed operational rail before products (legacy `order: -1`)

---

## Target hierarchy (after)

**LEFT — “¿Qué pidió esta persona?”**

1. Productos (dominant)
2. Cliente + Entrega (compact, grouped)
3. Actividad (tertiary bitácora)
4. Notas (when present)

**RIGHT — “¿Qué tengo que hacer ahora?”**

1. Próximo paso (+ riesgo compacto si aplica)
2. Estado (select + Guardar estado)
3. Contacto con el cliente (WhatsApp + más acciones)

Desktop grid: **~55 / 45** (`1.15fr / 0.85fr`).  
Mobile DOM order: Productos → Cliente/Entrega → Próximo paso → Estado → Contacto → Actividad → Notas.

---

## Files changed

| File | Change |
| --- | --- |
| `admin-order-workspace-modal.tsx` | Flat section grid; open rail sections; Unicode fix; removed nested action card wrapper |
| `admin-order-modal.module.css` | Grid layout, rail typography, de-nested cards, CTA hierarchy, terminal-state demotion, quiet close |
| `admin-order-modal-shell.tsx` | Workstation close → quiet `×` + aria-label |
| `order-customer-delivery-info.tsx` | Cliente / Entrega subgroups |
| `order-workspace-overview.module.css` | Lighter workstation context surface |
| `order-recommended-action-panel.tsx` | Eyebrow → **Próximo paso**; tighter copy |
| `order-recommended-action-panel.module.css` | Stronger headline |
| `order-external-actions.tsx` | **Más acciones** label |
| `order-detail-surfaces.module.css` | Tertiary quick-action demotion |

**Untouched (hard boundary):** realtime hooks, reconciliation, server actions, assignment flag, status semantics, Kanban pager, public catalog.

---

## Unicode fix

| Item | Detail |
| --- | --- |
| **Root cause** | JS string literals using `\u00xx` escapes in `admin-order-workspace-modal.tsx` rendered as literal backslash sequences in some contexts |
| **Fix** | Replaced with native UTF-8 characters (`Sesión`, `Comunicación`, etc.) |
| **Verified** | Source inspection + build; browser strings not re-tested (login gate) |

---

## Functional changes

**NONE** — markup/CSS/copy presentation only.  
`orderResponsibilityEnabled` gates preserved unchanged.

---

## Visual QA

| Viewport | Result | Notes |
| --- | --- | --- |
| 1440px | **DEBT** | Login required — layout verified via CSS/grid review |
| 1024px | **DEBT** | Same |
| 768px | **DEBT** | Same |
| 390px | **DEBT** | Same |
| Dark theme | **CODE PASS** | Token-only styling |
| Light theme | **CODE PASS** | Token-only styling |

**Status coverage:** not exercised live (no auth). Terminal-state CSS demotion is presentation-only (`opacity` on primary button when `completed`/`cancelled`).

---

## Findings

| Severity | Item |
| --- | --- |
| **P0** | None |
| **P1** | Unicode escapes in modal — **FIXED** |
| **P2** | Full responsive screenshot matrix pending operator login |
| **P3** | Future UX: contextual status shortcuts (`Marcar como Preparando`, etc.) — out of scope |

---

## Checks

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | **PASS** |
| `git diff --check` | **PASS** (LF/CRLF warnings) |
| `npm run build` | **PASS** |
| `npm run lint` | **FAIL** — known ESLint 9 circular JSON |

---

## Accepted debt

- Browser visual QA at 1440 / 1024 / 768 / 390 after admin login
- Per-status modal screenshots (pending / preparing / ready / completed / cancelled)

---

## Follow-up

`ADMIN-ORDER-WORKSPACE-MODAL-ACTION-HIERARCHY-VISUAL-FIX-1`

Closed residual visual issues:

- duplicated visible `Estado` (accessible label preserved)
- terminal-state `Guardar estado` demotion
- WhatsApp secondary treatment
- contact heading duplication

Responsive/auth visual matrix remains **DEBT**.

`ADMIN-ORDER-WORKSPACE-INDEPENDENT-RAILS-LAYOUT-FIX-1` (2026-08-19): independent left/right vertical rails implemented so variable Products height no longer pushes operational controls downward. Preserves information-left / operations-right hierarchy.
