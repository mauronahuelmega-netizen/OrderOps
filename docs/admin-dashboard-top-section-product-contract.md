# Admin Dashboard Top Section Product Contract

**Phase:** D0 — Product Contract Freeze  
**Status:** Approved product definition (documentation only)  
**Route:** `/admin/dashboard`  
**Reference audit:** `docs/admin-dashboard-top-section-token-audit.md`  
**Effective from:** D0 forward — all implementation phases D1–D10 must comply with this contract unless explicitly revised.

---

## 1. Purpose

This document freezes the **functional product contract** for the redesigned top section of the OrderOps admin dashboard. It is the single source of truth for what the top section must communicate, measure, and prioritize — before any TSX, CSS, token, or logic changes.

The top section must answer, in under five seconds:

1. **Is the business running well or poorly?**
2. **How much has been sold in the active session?**
3. **Are there operational problems that require attention?**
4. **What insights help interpret the session?**

This phase does **not** fix visual, token, or hierarchy problems identified in the token audit. It only defines **what** the new top section shows and **what rules** govern it.

---

## 2. Product Direction

**Approved direction:**

```txt
Negocio + operación
con prioridad operacional
sobre sesión activa actual
```

| Principle | Rule |
|-----------|------|
| Not purely commercial | Must include operational health, not only revenue |
| Not purely operational | Must include business KPIs (sales, ticket, top product) |
| Operational priority when problems exist | When risk is present, operational signals outrank decorative or low-urgency business context |
| Session-scoped | All metrics and insights refer to the **current active session**, not calendar day comparisons |
| Descriptive first, actionable later | Insights are descriptive in MVP; click/filter behavior is deferred to D10 |

**What this replaces conceptually (current state — audit reference):**

The current top section mixes a heavy header (live pill + presence + queue pressure), four business KPIs (`Ventas`, `Activos`, `Completados`, `Ticket`), a three-column operational strip (`Estado de cocina`, `Cumplimiento SLA`, `Riesgo operativo`), and passive micro-insights as loose text. D0 approves a cleaner information architecture with explicit business vs operational grids, a status summary, and de-prioritized header badges.

---

## 3. Time Horizon

**Approved horizon:**

```txt
Horizonte temporal: sesión activa actual.
```

| Scope | Definition |
|-------|------------|
| Primary window | Orders and metrics scoped to the **active store session** when one exists (`operationalWindow.source === "store-session"`) |
| Fallback | When no store session is active, behavior falls back to the existing business window — **D1 must map this edge case**; D0 does not change fallback logic |

**Explicitly excluded from MVP:**

| Excluded | Reason |
|----------|--------|
| Full calendar day as primary label | Misaligns with operational session mental model |
| Last 24 hours | Not session-scoped |
| vs yesterday / vs average comparisons | No comparatives in MVP |
| Percentage trend arrows | No comparatives in MVP |
| Week/month rollups | Out of scope |

**Comparatives:**

```txt
No implementar comparativos en MVP.
```

---

## 4. Revenue Definition

**Approved definition:**

```txt
Ventas = ventas de pedidos activos + completados dentro de la sesión activa.
```

| Field | Contract |
|-------|----------|
| Included statuses | `pending`, `preparing`, `ready`, `completed` |
| Excluded statuses | `cancelled` (and any non-revenue status) |
| Scope | Orders whose timestamps fall within the active session window |
| Format | Local currency (existing `formatAdminOrderCurrency` pattern) |
| Example | `$44.000,00` |
| Empty fallback | `$0,00` |

**D1 data-mapping note (not implemented in D0):**

Current implementation (`getTotalRevenue` in `lib/orders/analytics.ts`) sums all non-cancelled orders in the window. D1 must verify whether any edge statuses beyond active + completed are included today and align calculation to this contract if needed.

---

## 5. Active Orders Definition

**Approved definition:**

```txt
Pedidos activos = pending + preparing + ready.
```

| Field | Contract |
|-------|----------|
| Statuses | `pending`, `preparing`, `ready` |
| Excluded | `completed`, `cancelled` |
| Format | Number + unit — e.g. `2 pedidos` |
| Empty fallback | `0 pedidos` |

**Alignment with codebase:** Matches existing `getActiveOrdersCount` — D1 confirms session scoping only.

---

## 6. Approved Business KPIs

Exactly **four** business KPIs in the top section. Order in grid (left → right):

| # | KPI | Replaces / notes |
|---|-----|------------------|
| 1 | **Ventas** | Retained — primary commercial KPI |
| 2 | **Ticket promedio** | Retained — demoted visually vs Ventas (see §17) |
| 3 | **Pedidos activos** | Retained — bridges business and operations |
| 4 | **Más vendido** | **New in primary grid** — replaces **Completados** |

**Removed from primary business KPI row:**

| Removed | Reason |
|---------|--------|
| **Completados** | Lower immediate operational value than “Más vendido” for session interpretation |
| **Delivery / Retiro** (was in extended commercial insights) | Not a primary KPI — may appear as insight only |

**Previous structure (current code — for D1 diff):**

```txt
Ventas · Pedidos activos · Completados · Ticket promedio
```

**New approved structure:**

```txt
Ventas · Ticket promedio · Pedidos activos · Más vendido
```

Grid layout: **4 columns on desktop**, equal visual weight per card (polish in D5); same count as operational grid (§8).

---

## 7. Business KPI Definitions

### 7.1 Ventas

| Attribute | Value |
|-----------|-------|
| **Label** | Ventas |
| **Priority** | Principal (highest among business KPIs) |
| **Horizon** | Sesión activa |
| **Definition** | Sum of monetary value of active + completed orders in the active session |
| **Format** | Local currency |
| **Example** | `$44.000,00` |
| **Fallback** | `$0,00` |
| **Icon (future)** | Banknote or equivalent — visual phase only |

**Notes:** Ventas is the most important commercial KPI. It must remain visually dominant within the business grid (D5).

---

### 7.2 Ticket promedio

| Attribute | Value |
|-----------|-------|
| **Label** | Ticket promedio |
| **Priority** | Secundaria |
| **Horizon** | Sesión activa |
| **Definition** | Session sales ÷ count of orders considered for ticket (non-cancelled orders in session — **numerator/denominator exact rule audited in D1**) |
| **Format** | Local currency |
| **Example** | `$22.000,00` |
| **Fallback** | `Sin datos` or `$0,00` per existing presenter pattern |

---

### 7.3 Pedidos activos

| Attribute | Value |
|-----------|-------|
| **Label** | Pedidos activos |
| **Priority** | Secundaria-operacional |
| **Horizon** | Sesión activa (live count) |
| **Definition** | Count of orders in `pending`, `preparing`, or `ready` |
| **Format** | Number + unit |
| **Example** | `2 pedidos` |
| **Fallback** | `0 pedidos` |

---

### 7.4 Más vendido

| Attribute | Value |
|-----------|-------|
| **Label** | Más vendido |
| **Priority** | Insight comercial (fourth slot in business grid) |
| **Horizon** | Sesión activa |
| **Definition** | Product with highest units sold within the active session |
| **Format** | Product name + units |
| **Example** | `BBQ Bacon · 2 unidades` |
| **Fallback** | `Sin ventas todavía` |

**D1 pending — do not invent logic in D0:**

| Question | D1 action |
|----------|-----------|
| Data source | Existing `getTopProducts()` uses `order_items_preview` on scoped orders — D1 validates completeness vs full `order_items` |
| Tie-breaking | Current: quantity desc, then name localeCompare — confirm or document |
| Cancelled orders | Excluded today — confirm session scope |
| Missing preview | Fallback behavior when `order_items_preview` is empty |

Partial codebase support exists (`topProduct` in `buildAdminOrdersAnalytics`); promoting to primary grid is a **presentation change** (D3+) after D1 confirms data reliability.

---

## 8. Approved Operational KPIs

Exactly **four** operational KPIs in a **second row / second block** of equal cardinality to the business grid.

| # | KPI | Status vs current UI |
|---|-----|----------------------|
| 1 | **Estado de cocina** | Evolves from current saturation label (`Cocina fluida`, etc.) |
| 2 | **Pedidos demorados** | Replaces stalled metric in strip; clearer label than “estancados” in KPI row |
| 3 | **Tiempo promedio** | Exists in operational metrics (`averageCompletionMinutes` / preparation — **D1 picks canonical metric**) |
| 4 | **Listos esperando salida** | **New KPI** — count of `ready` orders not yet completed/dispatched |

**Must NOT appear as top-level operational KPI:**

| Excluded from operational KPI row |
|-----------------------------------|
| Sin responsable |
| Completados |
| Cambios regresivos |
| Cuello de botella (as separate KPI — may inform Estado de cocina internally) |
| Cumplimiento SLA (may inform insights or status summary — not a fourth/fifth KPI slot) |
| Riesgo operativo / prescriptive action pill (moves to status summary + insights) |

**Previous operational strip (current — 3 columns):**

```txt
Estado de cocina · Cumplimiento SLA · Riesgo operativo
```

**New approved operational grid (4 columns):**

```txt
Estado de cocina · Pedidos demorados · Tiempo promedio · Listos esperando salida
```

---

## 9. Operational KPI Definitions

### 9.1 Estado de cocina

| Attribute | Value |
|-----------|-------|
| **Label** | Estado de cocina |
| **Priority** | Principal operacional |
| **Definition** | Composite signal: saturation, queue load, delay, preparation rhythm |
| **Allowed values** | `Cocina fluida` · `Atención requerida` · `Saturada` · `Sin actividad` |
| **Tone** | `success` · `warning` · `danger` · `neutral` |
| **Example** | `Cocina fluida` |

**D1 scope:** Exact calculation merges existing `calculateSaturationIndex`, queue pressure, and preparation metrics — formula frozen in D1, not D0.

**Mapping hint (non-binding):** Current `formatSaturationLabel` returns `Cocina fluida`, `Alta demanda`, `Saturacion / Cuello de botella` — D2 normalizes copy to approved value set.

---

### 9.2 Pedidos demorados

| Attribute | Value |
|-----------|-------|
| **Label** | Pedidos demorados |
| **Priority** | Alerta operacional |
| **Definition** | Orders exceeding operational delay threshold or classified as stalled |
| **Example** | `2 pedidos` |
| **Positive fallback** | `Sin demoras` |
| **Tone** | `warning` / `danger` if count > 0; `success` / `neutral` if zero |

**D1 scope:** Uses existing `stalledCount` / `STALLED_INACTIVE_MINUTES` unless audit finds gap. Threshold changes are out of D0 scope.

---

### 9.3 Tiempo promedio

| Attribute | Value |
|-----------|-------|
| **Label** | Tiempo promedio |
| **Priority** | Indicador de ritmo |
| **Definition** | Average operational time for orders in the active session |
| **Example** | `18 min` |
| **Fallback** | `Sin datos` |
| **Tone** | `neutral` / `success` / `warning` per future thresholds — **no new thresholds in D0** |

**D1 scope:** Choose between `averageCompletionMinutes`, `averagePreparationMinutes`, or blended rule; document in D1.

---

### 9.4 Listos esperando salida

| Attribute | Value |
|-----------|-------|
| **Label** | Listos esperando salida |
| **Priority** | Indicador de fricción operacional |
| **Definition** | Orders in `ready` status not yet completed, picked up, or delivered |
| **Example** | `1 pedido` |
| **Fallback** | `Sin pedidos listos` |
| **Tone** | `info` / `warning` by count or age — **age thresholds deferred to D1/D2** |

**D1 scope:** Implement count from session-scoped orders where `status === "ready"`.

---

## 10. Approved Insights

Insights are **descriptive** in MVP. They must not feel like loose text in final UI (surface required in D7) but need not be clickable until D10.

### 10.1 Allowed insight categories

| Category | Allowed |
|----------|---------|
| Delay / stalled orders | Yes |
| Delivery dominance | Yes |
| Pickup dominance | Yes |
| Many ready orders waiting dispatch | Yes |
| Recent order spike | Yes |
| Positive / stable operation | Yes |

### 10.2 Valid insight examples

| Title | Detail example | Tone |
|-------|----------------|------|
| Revisar demorados | `2 pedidos necesitan revisión` | warning |
| Delivery domina hoy | `2 de 2 pedidos` | neutral |
| Retiro domina hoy | `3 de 5 pedidos` | neutral |
| Pico reciente | `3 pedidos en los últimos 15 min` | attention |
| Buen ritmo operativo | `Sin preparación lenta` | stable |
| Pedidos listos | `2 pedidos esperan salida` | attention |

### 10.3 Insights to de-emphasize or exclude from top row

| Insight | Rule |
|---------|------|
| Cambios regresivos | Not a primary top insight — context panel or later |
| Reasignaciones activas | Secondary — not top insight MVP |
| Sin responsable | Must not drive primary “attention” framing |
| Completados milestone | Not an insight — removed from KPI row |

### 10.4 Relationship to current micro-insights

Current `buildOperationalDashboardInsights` (max 3, passive `<article>`) partially aligns. D7 replaces passive strip with **Actionable insights row** per §15 — descriptive copy first, dedicated surface, optional actions in D10.

---

## 11. Insight Actionability Rules

**MVP (D0 through D7):**

```txt
Insights must be descriptive.
No filter implementation.
No click behavior, except where a future phase explicitly adds it.
```

| Phase | Behavior |
|-------|----------|
| D0–D7 | Display only; structured presenter prepares `insightId`, `tone`, `title`, `detail` |
| D10 (optional) | Click → filter/focus |

**Future action mapping (D10 — not implemented now):**

| Insight | Future action |
|---------|---------------|
| Pedidos demorados | Filter/focus delayed or stalled orders |
| Delivery domina hoy | Filter `delivery` |
| Retiro domina hoy | Filter `pickup` |
| Listos esperando salida | Filter `ready` |
| Pico reciente | Focus recent arrivals (TBD in D10 spec) |

---

## 12. Header Rules

The header must be **more subtle and less crowded** than the current implementation.

**Approved copy structure:**

```txt
Panel del Negocio
Sesión activa · En vivo
```

| Element | Rule |
|---------|------|
| Title | `Panel del Negocio` — remains page title |
| Session + live | Combined metadata line: `Sesión activa · En vivo` (or equivalent when reconnecting — copy in D2) |
| Subtitle | De-emphasize or remove long descriptive paragraph (`Gestioná los pedidos…`) from prominent header — optional secondary line in D8 |
| Live indicator | Subtle — must not compete with title (audit finding F-03) |
| Pills in header | Minimal — no cluster of 3+ badges |

**Removed from dominant header position:**

| Element | New home |
|---------|----------|
| Queue pressure pill (`Requiere atención`, etc.) | Status summary + operational KPIs + insights |
| Large live pill inline with h1 | Metadata line |

**Not in D0 scope:** Visual/CSS implementation — D8.

---

## 13. Presence Rules

**Approved rule for “Solo vos”:**

```txt
No mostrar “Solo vos” cuando hay un solo operador conectado.
```

| Condition | Show presence? |
|-----------|----------------|
| `onlineCount <= 1` | **No** — hide presence badge entirely |
| `onlineCount > 1` | **Yes** — show count label (e.g. `3 online`) |

**Rationale:** “Solo vos” adds visual noise without operational value (audit + product decision).

**Implementation phase:** D8 (header cleanup) — may require TSX condition change on `showGlobalPresence` / `buildGlobalPresenceLabel`.

---

## 14. Attention / Risk Rules

### 14.1 “Requiere atención” queue pressure pill

```txt
No mostrar “Requiere atención” como pill dominante superior.
```

| Rule | Detail |
|------|--------|
| Header | Must not show queue pressure as prominent top-right pill |
| Operational channel | Delay/risk surfaces via **Status summary**, **Pedidos demorados** KPI, and **insights** |

### 14.2 Conditions that MAY feed attention signals

| Signal | Allowed to raise attention |
|--------|---------------------------|
| Pedidos demorados / stalled | Yes |
| Pedidos estancados | Yes |
| Preparación lenta | Yes |
| High kitchen saturation | Yes (via Estado de cocina) |
| Ready orders waiting | Yes (via KPI + insight) |

### 14.3 Conditions that must NOT trigger primary attention (MVP)

| Signal | Rule |
|--------|------|
| Sin responsable | No primary attention |
| Cambio regresivo | No primary attention |
| Listos hace mucho tiempo | No primary attention pill — may become insight/KPI tone only in D6/D7 |

### 14.4 Prescriptive copy migration

Current `buildPrescriptiveActions` label (`Atención requerida en X pedidos`) informs **status summary tone** and insights — not a header pill or standalone operational KPI column.

---

## 15. Approved Information Architecture

**Future top section structure (conceptual — D3 implements layout):**

```txt
Header
Status summary
Business KPI grid        (4 cards)
Operational KPI grid     (4 cards)
Actionable insights row  (descriptive, surfaced)
```

| Block | Responsibility |
|-------|----------------|
| **Header** | Title + subtle session/live metadata; presence only if multi-operator |
| **Status summary** | Unified session health + session sales one-liner (§16) |
| **Business KPI grid** | §6 — Ventas, Ticket, Activos, Más vendido |
| **Operational KPI grid** | §8 — Cocina, Demorados, Tiempo, Listos |
| **Actionable insights row** | §10 — up to N insights with own surface (count TBD in D2, max 3–4 suggested) |

**Below top section (unchanged by this contract):**

```txt
DashboardToolbar → Pedidos en curso (execution)
Lanes / cards / modal — out of scope
```

**DashboardContextPanel** (operational summaries, business insights feed below kanban): Remains separate until a later consolidation phase; must not duplicate approved top insights verbatim.

---

## 16. Status Summary Contract

A **single primary summary block** sits between header and KPI grids.

**Example:**

```txt
Estado del negocio
Cocina fluida / Atención requerida / Saturada
Ventas de sesión: $44.000,00
```

| Rule | Detail |
|------|--------|
| Purpose | Unified read of session health before drilling into KPIs |
| Health line | Derived from operational state (primarily Estado de cocina + demora signals) |
| Sales line | Session revenue snapshot — same definition as Ventas KPI |
| Must NOT say | “Próxima acción”, “Hacé X ahora”, imperative prescriptions |
| Must NOT replace | Order console / kanban — execution stays in lanes |
| Tone | Informational summary, not alert banner |

**D2 presenter:** Exposes `statusSummary: { healthLabel, healthTone, sessionRevenueLabel }`.

---

## 17. Visual Priority Contract

**Approved visual priority (highest → lowest):**

| Rank | Element |
|------|---------|
| 1 | Estado del negocio / health summary |
| 2 | Ventas |
| 3 | Operational KPIs with real risk (demorados, listos, degraded cocina) |
| 4 | Remaining business KPIs (ticket, activos, más vendido) |
| 5 | Descriptive insights row |
| 6 | Session/live metadata |

**Must NOT be visually prioritized:**

| Deprioritized |
|---------------|
| “Solo vos” |
| Completados (removed from grid) |
| Decorative pills |
| Micro-insights without surface (current passive strip) |
| Queue pressure header pill |
| SLA compliance as standalone hero metric |

**Implementation:** D4–D8 apply tokens and layout; D0 only freezes priority order.

---

## 18. Explicitly Out of Scope

The following are **not defined or implemented** by D0 or implied for D1–D7 unless a phase explicitly says otherwise:

| Out of scope |
|--------------|
| TSX implementation |
| Final CSS / visual design |
| Token definitions / changes |
| New helpers or lib functions |
| New DB queries |
| Clickable insight filters (until D10) |
| Comparatives and trends |
| Mobile / tablet top section (deferred past D9 desktop pass) |
| Order lanes, order cards, modal |
| Dashboard toolbar, search, filters |
| Store session open/close controls |
| Realtime subscription changes |
| Server actions, Supabase, migrations |
| Changing order status logic or thresholds (D1 may document gaps only) |

---

## 19. Future Phase Roadmap

| Phase | Name | Delivers |
|-------|------|----------|
| **D0** | Product Contract Freeze | This document — functional SSOT |
| **D1** | Data Mapping Audit | Map each KPI/insight to existing lib functions; gaps for Más vendido, Ventas scope, Listos, Estado de cocina composite |
| **D2** | Presenter / View Model Design | `DashboardTopSectionViewModel` — no UI |
| **D3** | TSX Structure Refactor | Header, status summary, dual 4×4 grids, insights row shell |
| **D4** | Token Alignment / Surface System | Apply `theme-tokens` surface system per audit |
| **D5** | Business KPI Premium Polish | Visual hierarchy — Ventas dominant |
| **D6** | Operational KPI Grid | Four operational cards + tones |
| **D7** | Actionable Insights Row | Surfaced insights (descriptive) |
| **D8** | Header / Badge Cleanup | Subtle live/session; presence rules; remove queue pill |
| **D9** | Dark / Light QA | Desktop theme pass |
| **D10** | Optional Insight Filters | Click → filter/focus behaviors |

**Dependency chain:**

```txt
D0 → D1 → D2 → D3 → (D4 ∥ D5 ∥ D6 ∥ D7) → D8 → D9 → D10
```

D0 implements **none** of the above.

---

## 20. Acceptance Criteria for Future Phases

Any phase touching the top section **must** satisfy:

| # | Criterion |
|---|-----------|
| 1 | Use **sesión activa actual** as time horizon |
| 2 | Show exactly **4 approved business KPIs** (§6) |
| 3 | Show exactly **4 approved operational KPIs** (§8) |
| 4 | **Do not** show “Solo vos” when only one operator is connected |
| 5 | **Do not** use “Requiere atención” as a dominant header pill |
| 6 | **Do not** implement MVP comparatives (trends, vs yesterday) |
| 7 | Insights must be **descriptive** until D10; structure prepared for future actions |
| 8 | **Do not** modify lanes, order cards, or modal without explicit phase |
| 9 | **Do not** change order business logic without explicit data phase (D1+) |
| 10 | Ventas = active + completed revenue in session (§4) |
| 11 | Pedidos activos = pending + preparing + ready (§5) |
| 12 | Include **status summary** block (§16) from D3 onward |
| 13 | Respect visual priority order (§17) from D5 onward |

**Phase-specific gates:**

| Phase | Additional gate |
|-------|-----------------|
| D1 | Written mapping doc: each KPI → source function → gap list |
| D2 | View model types reviewed against §6–§10 |
| D3 | Component tree matches §15 |
| D7 | No passive loose text — insights have surface |
| D8 | Header matches §12–§13 |
| D10 | Actions match §11 table only |

---

## Appendix A — Current vs Approved Delta (for D1)

| Area | Current (audit) | Approved (D0) |
|------|-----------------|---------------|
| Business KPIs | Ventas, Activos, Completados, Ticket | Ventas, Ticket, Activos, Más vendido |
| Operational row | 3-col strip: Cocina, SLA, Riesgo | 4-col grid: Cocina, Demorados, Tiempo, Listos |
| Status summary | None | Required new block |
| Header pills | Live + presence + queue pressure | Subtle session · live; presence conditional |
| Insights | Passive micro-insights, max 3 | Insights row with surface, expanded catalog §10 |
| Completados | Primary KPI | Removed from top grid |
| topProduct | In extended insights, not primary grid | Primary business KPI #4 |

---

## Validaciones de esta fase

- No se modificó código funcional.
- No se modificó CSS.
- No se modificaron tokens.
- No se requiere tsc/build para esta fase.
