# Admin Dashboard Mobile Orders — Final Visual Debt Audit

## 1. Objective

Forensic visual/UX debt audit of four mobile admin/orders issues captured before moving to the Products module. This phase maps ownership, runtime behavior, risk, and surgical follow-up phases. **No implementation.**

Baseline confirmed:

- Dashboard mobile terminal density: **FROZEN**
- Dashboard search/Kanban: **FIXED**
- Dashboard metrics semantics: **FROZEN**
- Dashboard card root count: **FROZEN**
- Order code block: **CLOSED**
- Workspace Products inline-only: **FROZEN**
- Admin loading: unified / centered / spinner restored
- Public success order ref hierarchy: **FROZEN**
- Dashboard overall polish: **OPEN**

---

## 2. Capture Mapping

| Capture | Debt ID | User signal | Area |
| ------: | ------- | ----------- | ---- |
| 1 | D1 — `ADMIN-MOBILE-DRAWER-WIDTH-DENSITY` | Drawer too wide horizontally; evaluate ~30% less invasiveness (not a hard quota) | AdminShell mobile nav drawer |
| 2 | D2 — `ADMIN-DASHBOARD-MOBILE-ORDERS-TOOLBAR-DENSITY` | Session / close / new order / refresh wrap to two lines under “Pedidos en curso” | Dashboard orders toolbar |
| 3 | D3 — `ADMIN-MANUAL-ORDER-MODAL-MOBILE-SCROLL-AND-CUSTOMIZATION` | Modal split into two scroll areas; also audit customization currency | Manual order modal |
| 4 | D4 — `ADMIN-MOBILE-FOOTER-COMPACT` | Footer wraps to two lines; want compact mobile footer; desktop unchanged | Shared AdminFooter |

---

## 3. Source Ownership Map

| Debt ID | Concern | Owner file(s) | CSS owner | Shared vs mobile-only | Risk |
| ------- | ------- | ------------- | --------- | --------------------- | ---- |
| D1 | Mobile drawer width | `components/admin/admin-mobile-drawer.tsx` (mounted from topbar); nav via `admin-nav-list.tsx` variant `"drawer"` | `components/admin/admin-mobile-drawer.css` (`--drawer-width: min(88vw, 360px)`) | **Mobile-only drawer** (desktop uses `AdminSidebar` + `admin-sidebar.module.css`) | Medium: shared shell surface, but width token is drawer-local |
| D2 | Orders toolbar density | `components/admin/orders/DashboardToolbar.tsx`; orchestrated by `admin-dashboard-orders.tsx` | `dashboard-toolbar.module.css` (+ wrapper classes in `admin-dashboard-orders.module.css`) | **Dashboard orders only**; mobile rules `@media (max-width: 768px)` | Medium: accidental session close if “Cerrar sesión” densified poorly |
| D3 | Manual modal scroll + customization | `manual-order-modal.tsx`; create path `createManualOrderAction` in `app/admin/(protected)/orders/actions.ts`; product option type `lib/orders/manual-order-types.ts` | `manual-order-modal.module.css` | Modal shared desktop/tablet/mobile; nested scrolls intentional on desktop workstation | **High**: order creation, pricing, snapshots, customization model |
| D4 | Mobile footer | `AdminFooter` in `components/admin/layout/admin-footer.tsx`; rendered from `admin-shell.tsx` as `variant="compact"` | `admin-footer.module.css` (`@media (max-width: 640px)` stacks column) | **All admin routes** via AdminShell | Low visual; shared blast radius if copy/layout changes carelessly |

### Debt table (required)

| Debt ID | Capture | Area | Owner file(s) | Current issue | Risk | Suggested phase | Priority |
| ------- | ------: | ---- | ------------- | ------------- | ---- | --------------- | -------- |
| D1 | 1 | Mobile drawer width | `admin-mobile-drawer.tsx` + `.css` | `--drawer-width: min(88vw, 360px)` covers ~88% of 390px viewport | P2 visual / shell | `ADMIN-MOBILE-DRAWER-WIDTH-DENSITY-POLISH-1` | P3 |
| D2 | 2 | Mobile orders toolbar density | `DashboardToolbar.tsx` + `dashboard-toolbar.module.css` | `sessionCluster` `flex-wrap: wrap` + large touch targets → two control rows | P2 UX / accidental close | `ADMIN-DASHBOARD-MOBILE-ORDERS-TOOLBAR-DENSITY-POLISH-1` | P2 |
| D3 | 3 | Manual order modal scroll/customization | `manual-order-modal.tsx` + `.module.css` + `createManualOrderAction` | Dual nested scrolls + **no customization UI/payload** | P1 functional + visual | `ADMIN-MANUAL-ORDER-MODAL-MOBILE-SCROLL-AND-CUSTOMIZATION-AUDIT-1` first | P1 |
| D4 | 4 | Mobile admin footer | `admin-footer.tsx` + `.module.css` via AdminShell | Brand+tagline then meta stack to 2+ lines ≤640px | P3 visual / shared | `ADMIN-MOBILE-FOOTER-COMPACT-POLISH-1` | P4 |

---

## 4. Runtime Observations

Source-derived + viewport matrix (authenticated browser QA deferred where session unavailable; measurements from CSS contracts):

| Viewport | D1 Drawer | D2 Toolbar | D3 Modal | D4 Footer |
| -------- | --------- | ---------- | -------- | --------- |
| **390** | Width ≈ `min(88vw,360)` = **~343px** (~88% width; ~47px canvas strip) | Title row + session row; status + close + `+ Pedido` + refresh wrap | Nested product + ticket scrolls; body/workstation also scroll ≤899 | Column stack ≤640 → 2 lines |
| **412 / S20** | Hits **360px** cap | Same wrap pattern | Same dual-scroll | 2 lines |
| **430** | 360px cap | Same | Same | 2 lines |
| **719** | Drawer still mobile shell path (sidebar rail hidden ≤899) | Toolbar still mobile ≤768 | Dual scroll ≤899 | May still stack if ≤640 |
| **767** | Same | Mobile toolbar rules apply | Dual scroll | Desktop footer layout if >640 |
| **768** | Drawer mobile | **Boundary**: toolbar tablet rules start ≥769 | Dual scroll until 899 | Desktop footer row |
| **1024** | Desktop sidebar (no drawer) | Desktop/tablet toolbar | Desktop 2-col workstation; product scroll unconstrained height, ticket max-height | Single horizontal footer |
| **1440** | Desktop sidebar | Desktop toolbar | Desktop workstation | Single horizontal footer |

Themes: drawer/footer/toolbar use semantic tokens (`--bg-surface`, `--text-*`); dark/light inherit AdminShell theme — no separate debt.

---

## 5. D1 Drawer Width Audit

**Current width:** `--drawer-width: min(88vw, 360px)` in `admin-mobile-drawer.css`.

At 390px: ~343px (~88% viewport). A literal “30% reduction” of that width ≈ 240px / ~62vw — aggressive for nav labels + logout + theme.

**Issue:** Drawer feels dominant; canvas peek is thin; content behind is hard to contextualize.

**Recommended option: B — `min(78vw, 340px)`** as first polish target.

- At 390: ~304px (~22% less than today; still room for labels/tap targets).
- At 412+: still capped near 340px.
- Option A (`min(72vw, 320px)`) is acceptable fallback if B still feels wide after visual QA.
- Option C (spacing-only) insufficient for the capture complaint.

**Must not touch:** `admin-sidebar.module.css`, desktop rail, nav item list semantics, logout action, theme toggle logic.

**Future phase:** `ADMIN-MOBILE-DRAWER-WIDTH-DENSITY-POLISH-1`

**Risk:** P2 — mobile-only CSS token; verify 390/412 labels and logout row don’t clip.

---

## 6. D2 Orders Toolbar Audit

**Current layout:**

1. `operationalRow`: title “Pedidos en curso” then `sessionCluster`
2. `sessionCluster`: `flex-wrap: wrap` with status, optional review hint, **Cerrar sesión** / Abrir, **+ Pedido**, sync/refresh
3. `viewControlsRow`: search (+ filters when not kanban)

Mobile `@media (max-width: 768px)` forces 2.75rem min-heights on session/manual/sync buttons → wrap is structural, not accidental.

**Issue:** Session controls occupy two visual lines; search pushed down; density fights the already-polished mobile board.

**Recommended option: B — two tighter rows**

```text
row 1: session status (ellipsis) + Cerrar sesión (secondary, not full-width)
row 2: + Pedido (primary-ish) + refresh (icon)
```

- Option A (single row) only if 390px QA proves no overlap/clip after tightening padding — unlikely with 2.75rem targets.
- Option C (overflow menu for close) deferred — higher interaction cost; keep close visible but not accidentally primary.

**Hard rule:** Do not enlarge or promote destructive `Cerrar sesión`; keep secondary/danger styling; preserve disabled states while pending.

**Must not touch:** Kanban, search matching, session RPC actions, metrics, terminal density.

**Future phase:** `ADMIN-DASHBOARD-MOBILE-ORDERS-TOOLBAR-DENSITY-POLISH-1`

**Risk:** P2 — accidental session close if hit targets crowd; desktop `@media (min-width: 769px)` must remain unchanged.

---

## 7. D3 Manual Order Modal Audit

### Scroll owners (exact)

| Container | Class | Behavior |
| --------- | ----- | -------- |
| Modal shell / form | `manual-order-modal__form` + body | Flex column, `min-height: 0` |
| Products list | `manual-order-modal__products-scroll` | `overflow-y: auto`, `max-height: min(38vh, 320px)` |
| Ticket summary | `manual-order-modal__summary-scroll` | `overflow-y: auto`, `max-height: min(24vh, 200px)` |
| Workstation (≤899px) | `manual-order-modal__workstation` | **Additional** `overflow-y: auto` |
| Footer CTA | `manual-order-modal__footer` | Outside body scroll (Cancelar / Crear pedido) |

On mobile/tablet ≤899px this yields **competing nested scroll regions** (products + ticket + workstation), matching the capture.

Desktop ≥900px: 2-column workstation; ticket keeps constrained scroll — acceptable for dual-pane ops.

**Scroll recommendation (visual only, after functional audit):** Option A — single scroll owner on modal body for ≤639/≤899; keep footer sticky outside scroll; collapse nested max-heights on mobile.

### Customization support — **INCOMPLETE**

Evidence:

1. `ManualOrderProductOption` = `{ id, name, price, categoryName?, isAvailable }` — **no groups/options/upsells**.
2. UI `addProduct(product.id)` adds quantity only — **no customization picker**.
3. `createManualOrderAction` RPC payload: `{ product_id, quantity }` only — **no customization_snapshot / selections**.
4. Public checkout + workspace preparation already use V2 snapshot/hierarchy (`order-preparation`, inline Products) — manual path is **behind** current product model.

Implications:

- Manual orders of customizable products can under-price / omit required options / diverge from WhatsApp & workspace preparation.
- **Do not ship scroll-only polish as “done” for D3** without a dedicated customization flow audit.

**Recommended option:** Split:

1. `ADMIN-MANUAL-ORDER-MODAL-MOBILE-SCROLL-AND-CUSTOMIZATION-AUDIT-1` (functional + scroll architecture)
2. Later: `ADMIN-MANUAL-ORDER-MODAL-MOBILE-SINGLE-SCROLL-FIX-1` and/or `ADMIN-MANUAL-ORDER-CUSTOMIZATION-FLOW-AUDIT-1` / impl — only after audit proves safe path (reuse public catalog customization UX vs admin-lite).

**Must not touch until audit:** `create_order` RPC contract casually, public checkout, workspace preparation, pricing without snapshot parity.

**Risk:** **P1** functional (highest of the four) + P2 visual scroll.

**Follow-up (2026-09-05):** `ADMIN-MANUAL-ORDER-MODAL-MOBILE-SCROLL-AND-CUSTOMIZATION-AUDIT-1` — **AUDIT COMPLETE**. Nested scrolls confirmed; customization **INCOMPLETE/ungated**; next recommended **`ADMIN-MANUAL-ORDER-CUSTOMIZATION-SAFETY-GATE-1`** then single-scroll. Doc: `docs/admin-manual-order-modal-mobile-scroll-and-customization-audit-1.md`.

**Follow-up (2026-09-06):** `ADMIN-MANUAL-ORDER-CUSTOMIZATION-SAFETY-GATE-1` — **IMPLEMENTED**. Customizable products blocked UI+server; simple products allowed; picker/single-scroll still pending. Doc: `docs/admin-manual-order-customization-safety-gate-1.md`.

**Follow-up (2026-09-06):** `ADMIN-MANUAL-ORDER-MODAL-MOBILE-SINGLE-SCROLL-FIX-1` — **PASS**. Nested ≤899 scrolls removed; single body scroll; desktop dual-pane preserved; picker still not implemented. Doc: `docs/admin-manual-order-modal-mobile-single-scroll-fix-1.md`.

**Follow-up (2026-09-06):** `ADMIN-MANUAL-ORDER-CUSTOMIZATION-FLOW-SPEC-1` — **SPEC COMPLETE**. Admin-native picker + shared domain helpers specified; safety gate remains until implementation. Doc: `docs/admin-manual-order-customization-flow-spec-1.md`.

---

## 8. D4 Mobile Footer Audit

**Current layout:** `AdminFooter` compact variant in every AdminShell page.

Desktop: horizontal `brand · tagline` + trailing `V1.0 · Panel protegido`.

Mobile ≤640px: `.inner { flex-direction: column }` → typically:

```text
© 2026 OrderOps · Sistema operativo para pedidos
V1.0 · Panel protegido
```

**Issue:** Two lines feel unfinished after mobile board density work; not a functional bug.

**Recommended option: A**

```text
© 2026 OrderOps
Panel protegido · v1.0
```

(Drop or demote long tagline on mobile only; keep desktop unchanged.)

Option B (one line) risks truncation at 390. Option C leaves debt open.

**Must not touch:** AdminShell structure beyond footer module; global theme tokens; dashboard board CSS.

**Future phase:** `ADMIN-MOBILE-FOOTER-COMPACT-POLISH-1`

**Risk:** P3 — shared admin footer; constrain with `@media (max-width: 640px)` only.

**Follow-up (2026-09-05):** `ADMIN-MOBILE-FOOTER-COMPACT-POLISH-1` — **IMPLEMENTED / FROZEN**. Mobile ≤640 hides tagline/separator and shows `Panel protegido · v1.0`; desktop unchanged. Doc: `docs/admin-mobile-footer-compact-polish-1.md`.

**Follow-up (2026-09-05):** `ADMIN-MOBILE-FOOTER-SINGLE-LINE-FOLLOWUP-1` — **SINGLE-LINE / FROZEN**. Compact copy kept; mobile layout is one horizontal row (brand left / meta right). Doc: `docs/admin-mobile-footer-single-line-followup-1.md`.

---

## 9. Product Recommendations (summary)

| Debt | Recommendation |
| ---- | -------------- |
| D1 | Option **B** `min(78vw, 340px)`; A as fallback |
| D2 | Option **B** two compact rows; keep close secondary |
| D3 | **Deeper audit first**; then single-scroll Option A; customization separate |
| D4 | Option **A** two short mobile lines |

---

## 10. Priority and Phasing

**Chosen sequence (close visible dashboard orders finish before Products):**

1. **`ADMIN-DASHBOARD-MOBILE-ORDERS-TOOLBAR-DENSITY-POLISH-1`** (D2) — highest visible density on `/admin/dashboard` orders surface; scoped CSS.
2. **`ADMIN-MOBILE-DRAWER-WIDTH-DENSITY-POLISH-1`** (D1) — shell mobile-only width token.
3. **`ADMIN-MOBILE-FOOTER-COMPACT-POLISH-1`** (D4) — low risk shared footer polish.
4. **`ADMIN-MANUAL-ORDER-MODAL-MOBILE-SCROLL-AND-CUSTOMIZATION-AUDIT-1`** (D3) — **required before any D3 implementation**; blocks Products-adjacent correctness for manual create of personalized catalog items.

**Why not D3 first for implementation:** Functional gap (no customizations) is larger than scroll UX; fixing scroll alone would green-wash incomplete order creation. Why not Products yet: these four debts are the remaining mobile admin finish line on Orders.

Do **not** merge D1–D4 into one phase.

---

## 11. Future Phase List

```text
ADMIN-DASHBOARD-MOBILE-ORDERS-TOOLBAR-DENSITY-POLISH-1
ADMIN-MOBILE-DRAWER-WIDTH-DENSITY-POLISH-1
ADMIN-MOBILE-FOOTER-COMPACT-POLISH-1
ADMIN-MANUAL-ORDER-MODAL-MOBILE-SCROLL-AND-CUSTOMIZATION-AUDIT-1
```

Contingent after D3 audit:

```text
ADMIN-MANUAL-ORDER-MODAL-MOBILE-SINGLE-SCROLL-FIX-1
ADMIN-MANUAL-ORDER-CUSTOMIZATION-FLOW-AUDIT-1
```

(or a combined impl only if audit proves low risk — **not expected**).

### Files likely touched / avoided per phase

| Phase | Likely touch | Avoid |
| ----- | ------------ | ----- |
| Toolbar polish | `DashboardToolbar.tsx`, `dashboard-toolbar.module.css` | Kanban, search, realtime, metrics, AdminShell |
| Drawer polish | `admin-mobile-drawer.css` (± minor TSX if needed) | `admin-sidebar.*`, desktop rail, globals |
| Footer polish | `admin-footer.module.css` (± copy props) | Board/CSS modules, theme tokens |
| Manual modal audit | docs + source read of modal/actions/types/create_order items | No runtime until audit closes |

---

## 12. Risks P0–P3

**P0 (none for polish-only phases if boundaries held):**

- Breaking desktop sidebar / Kanban / create_order / RLS.

**P1:**

- D3: manual orders without customization snapshots → wrong totals / incomplete kitchen prep / WhatsApp mismatch.
- D3: scroll fix that clips CTA or traps focus.

**P2:**

- D2: accidental session close.
- D1: clipped nav labels at reduced width.
- D2/D1: tablet boundary regressions at 768/769.

**P3:**

- D4 copy preference.
- Browser QA matrix incomplete without live auth session in this audit run (CSS contracts measured; live capture alignment assumed from user screenshots).

---

## 13. Files Changed (this phase)

- `docs/admin-dashboard-mobile-orders-final-visual-debt-audit-1.md` (new)
- `docs/CURRENT_PHASE.md`
- `docs/admin-dashboard-forensic-living-audit.md`
- `ORDEROPS_LIVING_MEMORY.md`

Runtime / CSS / SQL / DB / RPC: **NONE**

---

## Follow-up — 2026-09-05

| Debt | Status |
| ---- | ------ |
| D2 toolbar density | **IMPLEMENTED** — `ADMIN-DASHBOARD-MOBILE-ORDERS-TOOLBAR-DENSITY-POLISH-1` |
| D1 drawer width | **IMPLEMENTED / FROZEN** — `ADMIN-MOBILE-DRAWER-WIDTH-DENSITY-POLISH-1` (`min(78vw, 340px)`; tablet 768–899 `min(78vw, 360px)`) |
| D1 drawer backdrop focus | **IMPLEMENTED / FROZEN** — `ADMIN-MOBILE-DRAWER-BACKDROP-FOCUS-POLISH-1` (stronger portal-scoped light/dark scrim; no heavy blur) |
| D1 drawer motion | **IMPLEMENTED / FROZEN** — `ADMIN-MOBILE-DRAWER-MOTION-POLISH-1` (right-edge open/close + backdrop fade; delayed unmount) |
| D4 footer mobile | **AUDITED / PENDING** |
| D3 manual modal | **NEEDS DEEPER AUDIT** before polish |

Docs: `docs/admin-mobile-drawer-width-density-polish-1.md`, `docs/admin-mobile-drawer-backdrop-focus-polish-1.md`, `docs/admin-mobile-drawer-motion-polish-1.md`

---

## 14. Gate

**ADMIN-DASHBOARD-MOBILE-ORDERS-FINAL-VISUAL-DEBT-AUDIT-1**

=

**AUDIT COMPLETE — MANUAL ORDER MODAL NEEDS DEEPER AUDIT FIRST**

- Implementation: **NOT APPLIED** (audit phase)
- D1 drawer width: **AUDITED** → follow-up **IMPLEMENTED** (see Follow-up)
- D2 toolbar density: **AUDITED** → follow-up **IMPLEMENTED** (see Follow-up)
- D3 manual modal: **AUDITED / NEEDS DEEPER AUDIT** (customization incomplete; nested scrolls confirmed)
- D4 footer mobile: **AUDITED**
- Recommended next polish: **D4**, then **D3 audit**
- Frozen/fixed baselines preserved as listed in §1

*No commit. No push. No deploy.*
