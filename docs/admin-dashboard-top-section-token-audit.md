# Admin Dashboard Top Section Token Audit

## 1. Executive Summary

Auditoría técnica del bloque superior de `/admin/dashboard` (OrderOps) para preparar una fase futura de polish visual **enterprise premium**. El bloque auditado es la primera impresión operacional: título de negocio, badges de sesión/presencia, KPIs comerciales, strip operativo en vivo y micro-insights pasivos.

**Estado general:** La zona funciona y ya consume tokens semánticos base (`--bg-*`, `--text-*`, `--color-*`, `--border-subtle`). Sin embargo, mezcla **tres capas visuales distintas** (DashboardOverview moderno, micro-insights legacy de `orders-admin.css`, mobile overview en `dashboard-analytics-surfaces`) con tipografía, radios, sombras y densidad inconsistentes. Hay **1 hardcode P0** (bordes rgba fijos en superficies mobile/legacy), **varios P1** (shadow hardcodeada en KPI cards desktop, escala tipográfica no tokenizada, jerarquía header vs badges) y oportunidad clara de consolidar superficies usando el **surface system** ya definido en `theme-tokens.css`.

**Componentes identificados:** 8 en el bloque superior desktop (+ 1 mobile paralelo).  
**Archivos auditados:** 16.  
**Tokens existentes mapeados:** 28 usos directos + 12 aliases/surface system disponibles pero subutilizados.  
**Hardcodes detectados:** 14 significativos.  
**Hallazgos:** P0: 1 · P1: 8 · P2: 11 · P3: 6.  
**Fases recomendadas:** 6 (D1–D6).

No se modificó código funcional, CSS ni tokens en esta fase.

---

## 2. Scope Audited

### Incluido

| Zona | Ubicación DOM | Contenido visible |
|------|---------------|-------------------|
| Page shell | `AdminPageLayout` → `admin-orders-structure` | Max-width, gap vertical entre secciones |
| Overview section | `.admin-orders-section--overview` | Bloque completo above-the-fold desktop |
| Dashboard header | `DashboardOverview` → `HeaderSection` | "Panel del Negocio", subtítulo, live badge |
| Session / scope | Inline en live indicator | "En vivo (Sesión activa)" / "Jornada actual" |
| Presence badge | `OperatorPresencePill` | "Solo vos" / "N online" |
| Queue pressure pill | `DashboardOverview` → `.queuePressure` | "Requiere atención", "Sin demoras", etc. |
| KPI grid | `DashboardOverview` → `KPIGrid` | Ventas, Activos, Completados, Ticket |
| Operational strip | `DashboardOverview` → `OperationalStrip` | Cocina fluida, Sin promesas activas, Atención requerida… |
| Passive micro-insights | Inline en `admin-dashboard-orders.tsx` | Revisar pedidos demorados, Delivery domina hoy… |
| Mobile top equivalent | `DashboardMobileOverview` | Jornada / Operación en vivo / Insights (@ ≤768px) |

### Excluido (explícito)

- Order lanes, order cards, order modal
- `DashboardToolbar` (filtros, búsqueda, sesión de tienda) — solo se documenta el **gap** hacia "Pedidos en curso"
- `DashboardContextPanel` (debajo del kanban en DOM): `OperationalSummaryStrip`, `BusinessInsightsStrip`, `OperationalFeed` — **fuera del bloque superior físico**, pero referenciado como **patrón duplicado** para consolidación futura
- Products, settings, sidebar completa
- Lógica de datos, realtime, server actions, DB

### Límite inferior del bloque

El bloque superior termina al final de `.admin-orders-section--overview` (micro-insights pasivos). La sección `.executionSection` (`DashboardToolbar` + kanban) comienza inmediatamente después con `gap: 6px` (overview) → `gap: 10–12px` (structure).

---

## 3. Files Audited

| Archivo | Rol |
|---------|-----|
| `app/admin/(protected)/dashboard/page.tsx` | Page entry, `AdminPageLayout size="operational"` |
| `components/admin/admin-page-layout.tsx` | Wrapper layout |
| `components/admin/orders/admin-dashboard-orders.tsx` | Orquestación, datos, render overview + micro-insights |
| `components/admin/orders/admin-dashboard-orders.module.css` | Grid structure, section gaps, overview visibility |
| `components/admin/orders/DashboardOverview.tsx` | Header + KPI + operational strip |
| `components/admin/orders/DashboardOverview.module.css` | Estilos principales del bloque superior desktop |
| `components/admin/orders/DashboardMobileOverview.tsx` | Paridad mobile del overview |
| `components/admin/orders/dashboard-analytics-surfaces.module.css` | Mobile overview, `analyticsMeta`, legacy KPI |
| `components/admin/orders/operator-presence-pill.tsx` | Pill "Solo vos" |
| `components/admin/orders/operator-presence-pill.module.css` | Estilos presence |
| `components/admin/orders/operational-summary-strip.module.css` | Clases micro-insight (reutilizadas en overview) |
| `app/theme-tokens.css` | Design tokens light/dark |
| `lib/orders/queue-pressure.ts` | Labels queue pressure ("Requiere atención") |
| `lib/orders/saturation-metrics.ts` | "Cocina fluida" |
| `lib/orders/sla-metrics.ts` | "Sin promesas activas" |
| `lib/orders/prescriptive-actions.ts` | "Atención requerida en X pedido" |
| `lib/orders/metrics.ts` | `buildOperationalDashboardInsights` (micro-insights) |

**No auditados en profundidad (referencia cruzada):** `components/admin/admin-surfaces.css` (sin reglas dashboard-specific), `tailwind.config.*` (proyecto usa CSS modules + tokens, no Tailwind utility en overview).

---

## 4. Component Map

```
AdminDashboardPage (app/admin/(protected)/dashboard/page.tsx)
└── AdminPageLayout (size="operational")
    └── AdminDashboardOrders
        ├── DashboardMobileOverview          [@media max-width:768px — reemplaza overview desktop]
        └── section.admin-orders-section--overview
            ├── DashboardOverview
            │   ├── HeaderSection            [inline function component]
            │   │   ├── h1 + liveIndicator   [En vivo (Sesión activa)]
            │   │   ├── p.headerDescription
            │   │   ├── OperatorPresencePill [Solo vos / N online]
            │   │   └── .queuePressure       [Requiere atención / Sin demoras…]
            │   ├── KPIGrid                  [inline — 4× KpiCard pattern]
            │   └── OperationalStrip         [inline — 3× opMetric]
            └── div.admin-orders-micro-insights--passive
                └── article.admin-orders-micro-insight × N   [inline map]
```

### 4.1 AdminDashboardPage

| Campo | Valor |
|-------|-------|
| **Nombre** | `AdminDashboardPage` |
| **Archivo** | `app/admin/(protected)/dashboard/page.tsx` |
| **Tipo** | Page component |
| **Responsabilidad** | SSR de pedidos + sesión; monta layout operacional |
| **Dónde se importa** | Route `/admin/dashboard` |
| **Dónde se renderiza** | Root de la ruta admin dashboard |
| **Props** | N/A (server component) |
| **Datos** | `getAdminOrders`, `getActiveStoreSession`, `requireAdminContext` |
| **CSS** | `AdminPageLayout` global classes |
| **Tokens** | Hereda `--layout-*` vía theme |
| **Hardcodes** | Ninguno directo |
| **Dark/light** | Ready (delegado) |
| **Problemas** | Ninguno visual directo |
| **Recomendación** | Sin cambios en fase polish |

### 4.2 AdminPageLayout

| Campo | Valor |
|-------|-------|
| **Nombre** | `AdminPageLayout` |
| **Archivo** | `components/admin/admin-page-layout.tsx` |
| **Tipo** | UI primitive / layout shell |
| **Responsabilidad** | Contenedor con modifier `--operational` (100% width) |
| **CSS** | Global `.admin-page-layout`, `.admin-page-layout--operational` |
| **Tokens** | `--layout-max-width`, padding aliases (indirecto) |
| **Hardcodes** | Ninguno en TSX |
| **Dark/light** | Ready |
| **Problemas** | Operational mode ignora max-width 1280px del token — intencional para kanban |
| **Recomendación** | Mantener; overview hereda full width coherente con execution |

### 4.3 AdminDashboardOrders (porción overview)

| Campo | Valor |
|-------|-------|
| **Nombre** | `AdminDashboardOrders` |
| **Archivo** | `components/admin/orders/admin-dashboard-orders.tsx` |
| **Tipo** | Feature component |
| **Responsabilidad** | Calcula métricas, presencia, queue pressure; renderiza overview + micro-insights |
| **Dónde se importa** | `AdminDashboardPage` |
| **Props clave overview** | Derivadas internamente: `dashboardOverviewKpiMetrics`, `dashboardOverviewOperationalMetrics`, `overviewOperationalDashboardInsights`, `overviewQueuePressure`, `topBarRealtimeLabel`, `dashboardSessionScopeLabel` |
| **Hooks** | `useMemo` (métricas), `useAdminOrdersRealtime` (live label), presence hooks |
| **CSS** | `admin-dashboard-orders.module.css`, `operational-summary-strip.module.css` |
| **Tokens** | Gap vía `--space-lg` en breakpoints |
| **Hardcodes** | `MICRO_INSIGHT_TONE_CLASS_NAMES` mapping inline |
| **Dark/light** | Parcial (micro-insights passive pierden borde semántico) |
| **Problemas** | Lógica de presentación mezclada (`formatDashboardSnapshotLabel`) en orchestrator |
| **Recomendación** | Fase D1: no mover lógica; solo CSS/token alignment |

### 4.4 DashboardOverview

| Campo | Valor |
|-------|-------|
| **Nombre** | `DashboardOverview` |
| **Archivo** | `components/admin/orders/DashboardOverview.tsx` + `.module.css` |
| **Tipo** | Feature component (sub-secciones inline) |
| **Responsabilidad** | Header + 4 KPI cards + 3-column operational strip |
| **Props** | `liveLabel`, `sessionScopeLabel`, `showGlobalPresence`, `globalPresenceLabel`, `queuePressure`, `kpiMetrics`, `operationalMetrics` |
| **CSS** | `DashboardOverview.module.css` |
| **Tokens usados** | `--text-primary/secondary/tertiary`, `--bg-surface`, `--bg-surface-soft`, `--border-subtle`, `--color-ready/pending/cancelled/delivery`, `--text-*-strong` fallbacks |
| **Hardcodes** | `box-shadow: 0 1px 3px rgba(0,0,0,0.05)` en `.kpiCard`; radii `16px`, `12px`, `10px`, `9999px` sin `--radius-*` |
| **Dark/light** | Parcial — shadow KPI no usa `--shadow-sm` |
| **Problemas** | Header compite visualmente con pills; KPI labels uppercase; operational strip es barra única vs cards |
| **Recomendación** | Fase D2 + D3 + D4 |

### 4.5 OperatorPresencePill

| Campo | Valor |
|-------|-------|
| **Nombre** | `OperatorPresencePill` |
| **Archivo** | `components/admin/orders/operator-presence-pill.tsx` + `.module.css` |
| **Tipo** | UI primitive |
| **Responsabilidad** | Badge presencia global ("Solo vos") |
| **Props** | `label`, `names?`, `ariaLabel?`, `tone?: global \| contextual` |
| **CSS** | `operator-presence-pill.module.css` |
| **Tokens** | `--border-subtle`, `--bg-surface-soft`, `--color-delivery` (dot), `--text-secondary` |
| **Hardcodes** | Pixel gaps (`6px`, `7px`), `font-size: 0.71rem` |
| **Dark/light** | Ready |
| **Problemas** | Mismo patrón pill que live/queue pero tipografía ligeramente distinta |
| **Recomendación** | Unificar con badge system en D4 |

### 4.6 Passive micro-insights (inline)

| Campo | Valor |
|-------|-------|
| **Nombre** | Inline JSX en `AdminDashboardOrders` |
| **Archivo** | `admin-dashboard-orders.tsx` ~L2598–2613 |
| **Tipo** | Helper/presenter inline |
| **Responsabilidad** | Muestra hasta 3 insights de `buildOperationalDashboardInsights` |
| **CSS** | `operational-summary-strip.module.css` (`.admin-orders-micro-insights--passive`) |
| **Tokens** | `--text-primary/secondary/tertiary`, `--color-*` en border-left (anulado en passive) |
| **Hardcodes** | Font sizes `0.59rem`–`0.72rem`, weights `620`/`650` |
| **Dark/light** | Parcial — modo passive elimina affordance semántica |
| **Problemas** | Texto muy pequeño; no clickable; desconectado del operational strip |
| **Recomendación** | Fase D3 |

### 4.7 DashboardMobileOverview

| Campo | Valor |
|-------|-------|
| **Nombre** | `DashboardMobileOverview` |
| **Archivo** | `DashboardMobileOverview.tsx` + `dashboard-analytics-surfaces.module.css` |
| **Tipo** | Feature component |
| **Responsabilidad** | Paridad mobile: jornada KPIs, operación en vivo, insights |
| **CSS** | `dashboard-analytics-surfaces.module.css` |
| **Tokens** | Parcial; borders hardcoded rgba en legacy `.kpiCard` |
| **Dark/light** | Parcial — requiere selector `[data-dashboard-theme="dark"]` manual en legacy |
| **Problemas** | Sistema visual distinto al desktop overview |
| **Recomendación** | Fase D6 |

---

## 5. Current TSX Structure

```tsx
// admin-dashboard-orders.tsx — extracto overview
<section className="admin-orders-section admin-orders-section--overview">
  <DashboardOverview
    liveLabel={topBarRealtimeLabel}
    sessionScopeLabel={dashboardSessionScopeLabel}
    showGlobalPresence={shouldShowGlobalPresence}
    globalPresenceLabel={globalPresenceLabel}
    queuePressure={overviewQueuePressure}
    kpiMetrics={dashboardOverviewKpiMetrics}
    operationalMetrics={dashboardOverviewOperationalMetrics}
  />
  <div className="admin-orders-micro-insights admin-orders-micro-insights--passive">
    <div className="admin-orders-micro-insights__strip">
      {overviewOperationalDashboardInsights.map((insight) => (
        <article className={`admin-orders-micro-insight ${toneClass}`}>
          <strong>{insight.title}</strong>
          <span>{insight.detail}</span>
        </article>
      ))}
    </div>
  </div>
</section>
```

**DashboardOverview interno:** tres sub-componentes function-level (`HeaderSection`, `KPIGrid`, `OperationalStrip`) — no archivos separados.

**Datos → copy visible:**

| UI | Fuente |
|----|--------|
| Ventas / Activos / Completados / Ticket | `overviewCommercialInsights` → `CORE_OVERVIEW_KPI_KEYS` |
| Cocina fluida | `calculateSaturationIndex` → `overviewSaturationIndex.label` |
| Sin promesas activas | `formatSLAComplianceMetric` cuando `evaluableCount === 0` |
| Atención requerida en X pedido | `buildPrescriptiveActions` → `formatPrescriptiveActionMetricValue` |
| Revisar pedidos demorados | `buildOperationalDashboardInsights` id `stalled-orders` |
| Delivery domina hoy | `buildOperationalDashboardInsights` id `delivery-dominance` |
| En vivo | `useAdminOrdersRealtime` → `realtimeLabel` (o fallback "En vivo" on error) |
| Sesión activa | `operationalWindow.source === "store-session"` |
| Solo vos | `buildGlobalPresenceLabel(1)` |
| Requiere atención | `buildOrdersQueuePressure` → `pressureLevel === "critical"` |

---

## 6. Header / Title Area Audit

### Inventario visual

| Elemento | Estilo actual | Tokens |
|----------|---------------|--------|
| Título h1 | `1.75rem / 700 / --text-primary` | Parcial (no `--type-heading-size`) |
| Subtítulo | `0.875rem / --text-secondary`, `margin-top: 0.25rem` | Parcial |
| Live indicator | Pill soft bg, dot `--color-ready`, pulse animation | Definitivo tokens; animation hardcoded |
| Layout header | `flex space-between`, `padding-bottom: 1.5rem`, `border-bottom: 1px --border-subtle` | Definitivo |

### Preguntas de evaluación

| Pregunta | Respuesta |
|----------|-----------|
| ¿El título tiene escala enterprise? | **Parcial.** 1.75rem es sólido pero no usa `--type-display-*`; compite con live pill en la misma fila |
| ¿Subtítulo demasiado cerca/lejos? | **Aceptable** (0.25rem) pero pierde jerarquía vs pills del meta row |
| ¿Badge "En vivo" compite con título? | **Sí (P1).** Mismo row, peso 600, pill con borde — roba atención del h1 |
| ¿Badges superiores consistentes? | **Parcial.** Live, presence y queue comparten patrón pill pero difieren padding, font-size (0.8 vs 0.71rem) |
| ¿Exceso de pills? | **Riesgo medio.** Hasta 3 pills en `headerMeta` + live inline con título |
| ¿Colores semánticos correctos? | Live dot = success (`--color-ready`) OK; queue pressure usa semántica operativa correcta |

### Clasificación

| Item | Estado |
|------|--------|
| Título tipografía | Parcial |
| Subtítulo | Definitivo (color token) |
| Header divider | Definitivo |
| Live pill | Tokenizable (consolidar badge token) |
| Pulse animation | Hardcodeado (keyframes inline) |

---

## 7. Top Badges / Session State Audit

### Live / session

- **Copy:** `{liveLabel} ({sessionScopeLabel})` — ej. "En vivo (Sesión activa)"
- **Surface:** `--bg-surface-soft` + `--border-subtle`, radius pill
- **Semántica:** Dot verde = conexión OK; no distingue visualmente "reconnecting" vs "live" en CSS (solo copy)

### OperatorPresencePill ("Solo vos")

- Dot: `--color-delivery` (info/brand) — **semántica info**, no success
- Solo visible si `onlineCount > 0`; label "Solo vos" cuando `onlineCount <= 1`

### Queue pressure ("Requiere atención")

- `data-level`: calm | active | busy | critical
- Dot mapping: ready → delivery → pending → cancelled (**coherente con escalada de riesgo**)
- Label fuerte + sublabel tenue (column layout)

### Problemas

1. **Tres familias de pill** con micro-diferencias (P1 Layout + Visual hierarchy)
2. Live mezclado en title row; presence/queue en meta row — **asimetría intencional pero no enterprise-unified**
3. No hay token `--dashboard-badge-*`; todo compuesto ad hoc

---

## 8. KPI Cards Audit

### Por card (estructura idéntica)

| Card | Icon (Lucide) | Key | Label renderizado |
|------|---------------|-----|-------------------|
| Ventas | `Banknote` | `revenue` | VENTAS (uppercase CSS) |
| Activos | `Activity` | `activeOrders` | PEDIDOS ACTIVOS |
| Completados | `CheckCircle` | `completedOrders` | COMPLETADOS |
| Ticket | `ReceiptText` | `averageTicket` | TICKET |

### Estilos

| Propiedad | Valor | Token? |
|-----------|-------|--------|
| Surface | `--bg-surface` | Definitivo |
| Border | `1px --border-subtle` | Definitivo |
| Radius | `16px` | **Hardcodeado** (≈ `--radius-lg` 14px / `--radius-xl` 20px) |
| Shadow | `0 1px 3px rgba(0,0,0,0.05)` | **Hardcodeado P1** |
| Padding | `1.5rem` | Hardcodeado (≈ `--space-xl`) |
| Value | `2rem / 700` | No `--type-metric-size` (1.1rem token mismatch) |
| Label | `0.75rem uppercase 600` | Parcial |
| Icon container | `40×40`, radius `10px`, `--bg-surface-soft` | Parcial |
| Icon | `20×20`, stroke 2, `--text-primary` | Neutral (no semantic per KPI) |
| Hover/focus | **Ninguno** | N/A (display-only) |

### Grid responsive

- Desktop: `repeat(4, 1fr)` gap `1.5rem`
- ≤1200px: `repeat(2, …)`
- ≤768px: overview **hidden** (mobile component takes over)

### Preguntas

| Pregunta | Respuesta |
|----------|-----------|
| ¿Misma altura? | **Sí** (flex column, no min-height fijo — depende de label wrap) |
| ¿Jerarquía numérica correcta? | **Parcial.** 2rem fuerte pero labels uppercase pequeños compiten |
| ¿Labels demasiado pequeños? | **Parcial** — 0.75rem uppercase es legible pero "dashboard básico" |
| ¿Icon containers premium? | **No (P2).** Flat soft square, sin elevación ni brand accent |
| ¿Borde demasiado visible? | **No** — subtle OK |
| ¿Fondo vs canvas? | **Parcial en dark** — surface separation OK; shadow hardcode hurt light→dark |
| ¿Hardcoded colors? | **Sí** — shadow rgba |
| ¿Enterprise o MVP? | **Entre MVP+ y enterprise-light** — falta surface system + metric typography tokens |

---

## 9. Operational Insights Strip Audit

### Forma

- **Una barra** (`.operationalStrip`): grid 3 columnas, fondo `--bg-surface-soft`, radius `12px`, padding `1rem`
- **No son 3 cards separadas** — celdas `.opMetric` sin borde individual
- ≤1200px: stack 1 columna

### Métricas

| Columna | Label CSS | Value examples | Tone |
|---------|-----------|----------------|------|
| Estado de cocina | uppercase 0.7rem | Cocina fluida | success → `--text-ready-strong` |
| Cumplimiento SLA | uppercase | Sin promesas activas / 85% a tiempo | neutral / success / attention / danger |
| Riesgo operativo | uppercase | Atención requerida en 2 pedidos | danger |

### Evaluación

| Pregunta | Respuesta |
|----------|-----------|
| ¿Card, barra o tres cards? | **Barra única** con 3 celdas |
| ¿Insight vs alerta claro? | **Parcial.** Titles genéricos (Estado de cocina) vs values semánticos — usuario lee el value |
| ¿Success/danger balanceados? | **Sí** en tone coloring del value only |
| ¿Atención domina? | **Parcial.** Danger rojo en value pero label sigue siendo uppercase gris |
| ¿Ruido visual? | **Bajo** — buena contención vs KPI cards arriba |
| ¿Premium? | **Parcial** — soft strip funcional, no elevated panel |

### Clasificación surface

| Item | Estado |
|------|--------|
| Strip background | Definitivo (`--bg-surface-soft`) |
| Semantic value colors | Definitivo con fallbacks |
| Labels uppercase | Duplicado con KPI pattern (Legacy density) |
| Radius/padding | Hardcodeado |

---

## 10. Small Insight Links Audit

### Ubicación

Debajo de `DashboardOverview`, dentro `.admin-orders-micro-insights--passive`.

### Contenido típico

- "Revisar pedidos demorados" + detail
- "Delivery domina hoy" + detail
- Fallback: "Operacion tranquila" / "Operacion estable"

### Estilos passive mode

```css
/* operational-summary-strip.module.css */
.admin-orders-micro-insights--passive .admin-orders-micro-insight {
  border: none;
  background: transparent;
  box-shadow: none;
  padding: 0;
}
/* border-left semantic colors → transparent */
```

### Evaluación

| Pregunta | Respuesta |
|----------|-----------|
| ¿Links accionables? | **No** — `<article>`, no `<button>`/`<a>` (P1 UX polish) |
| ¿Demasiado pequeños? | **Sí (P1).** strong `0.68–0.72rem`, span `0.59–0.62rem` |
| ¿Desconectados del strip? | **Sí (P1).** Gap visual y pérdida de borde semántico en passive |
| ¿Chips vs mini cards? | Hoy: **texto suelto en grid 2–4 cols** — parece metadata, no insights |

### Grid

- 1 col mobile → 2 cols ≥768px → 4 cols ≥1024px
- Gap `8–12px`

---

## 11. Container / Layout Audit

### Jerarquía spacing

| Zona | Spacing actual | Fuente |
|------|----------------|--------|
| `DashboardOverview.root` | `gap: 2rem` | Entre header / KPI / strip |
| `admin-orders-section--overview` | `gap: 6px` | Entre DashboardOverview y micro-insights |
| `admin-orders-structure` | `gap: 10px` → `var(--space-lg)` @720px | Overview → execution |
| Header bottom padding | `1.5rem` + border | Inside overview |

### Problemas

1. **Inconsistencia de escala:** 2rem interno vs 6px entre overview y micro-insights — unidad fragmentada (P1 Layout)
2. **Altura total:** Header (wrap) + KPI (4) + strip + micro-insights ≈ **alto above-the-fold** — riesgo en laptops 768–900px height (P2)
3. **Alineación con "Pedidos en curso":** Misma `--admin-orders-content-width: 100%` en operational layout — **alineado horizontalmente OK**
4. **Unidad perceptual:** KPI cards (elevated) + strip (soft) + micro-insights (flat text) = **tres registros visuales** (P1 Surface)

### Max-width

- Operational layout: **100% width** (no cap 1280px)
- Non-operational pages cap at 1160–1280px — dashboard uses full bleed by design

---

## 12. Token Inventory

| Uso visual | Token actual | Archivo | Estado | Problema | Recomendación |
|------------|--------------|---------|--------|----------|---------------|
| Page background | `--bg-canvas` | theme-tokens | Definitivo | — | Mantener |
| KPI surface | `--bg-surface` | DashboardOverview.module.css | Definitivo | No usa `--surface-elevated-*` | Mapear a `--surface-elevated-bg/border/shadow` |
| KPI shadow | *(hardcode rgba)* | DashboardOverview.module.css | Hardcodeado | No theme-aware | `--shadow-sm` o `--surface-elevated-shadow` |
| Strip soft surface | `--bg-surface-soft` | DashboardOverview.module.css | Definitivo | Duplica `--surface-strip-bg` | Consolidar a `--surface-strip-bg` |
| Border subtle | `--border-subtle` | multiple | Definitivo | — | Mantener |
| Text primary | `--text-primary` | multiple | Definitivo | — | Mantener |
| Text secondary | `--text-secondary` | multiple | Definitivo | — | Mantener |
| Text muted/labels | `--text-tertiary` | multiple | Definitivo | KPI/insight uppercase tiny | Usar `--type-caption-*` |
| Success | `--color-ready`, `--text-ready-strong` | operational tones | Definitivo | — | `--success` alias OK |
| Warning/attention | `--color-pending`, `--text-pending-strong` | tones | Definitivo | Queue busy uses pending | Mantener |
| Danger | `--color-cancelled`, `--text-cancelled-strong` | tones | Definitivo | — | `--danger` alias |
| Info / presence dot | `--color-delivery` | presence pill | Definitivo | Semántica info para "Solo vos" | OK o `--info` |
| Live dot | `--color-ready` | liveIndicator | Definitivo | Live ≠ success semantically | Consider `--info` or dedicated live token via `--color-ready` |
| Shadow card (legacy) | `--shadow-premium` / `--shadow-card` | analytics-surfaces | Definitivo | Mobile legacy borders rgba | Fix borders |
| Radius | `--radius-md/lg/xl/full` | theme-tokens | **No usado** en overview | Magic numbers 10/12/16px | Map radii in D1 |
| Spacing | `--space-xs`…`--space-2xl` | theme-tokens | Parcial | Mix rem/px literals | Normalize gaps |
| Typography display | `--type-heading-size` etc. | theme-tokens | **No usado** | Custom rem everywhere | D1 typography alignment |
| Surface elevated | `--surface-elevated-*` | theme-tokens | **Subutilizado** | KPI cards ignore system | D2 |
| Surface strip | `--surface-strip-*` | theme-tokens | **Subutilizado** | operationalStrip manual | D3 |
| Focus ring | `--focus-ring` | theme-tokens | N/A | No interactive KPI | — |
| Brand primary | `--accent-primary` | theme-tokens | No usado en overview | Icons neutral | Optional D2 accent |

**Total tokens existentes mapeados:** 28 referencias directas + 12 aliases/surface disponibles.

---

## 13. Hardcoded Styles Audit

| ID | Archivo | Selector/Clase | Valor | Dónde | Problema | Token sugerido | Prioridad |
|----|---------|----------------|-------|-------|----------|----------------|-----------|
| H-01 | DashboardOverview.module.css | `.kpiCard` | `box-shadow: 0 1px 3px rgba(0,0,0,0.05)` | KPI cards desktop | No responde a dark shadow scale | `--shadow-sm` | **P1** |
| H-02 | dashboard-analytics-surfaces.module.css | `.kpiCard` | `border: 1px solid rgba(0,0,0,0.04)` | Legacy/mobile | Rompe theme unificado | `--border-subtle` | **P0** |
| H-03 | dashboard-analytics-surfaces.module.css | `:global(html[data-dashboard-theme="dark"]) .kpiCard` | `rgba(255,255,255,0.04)` | Dark override manual | Duplicación; fragile selector | `--border-subtle` | **P0** |
| H-04 | DashboardOverview.module.css | `.kpiCard` | `border-radius: 16px` | KPI | Off-scale vs tokens | `--radius-xl` (20) o new mapping | **P2** |
| H-05 | DashboardOverview.module.css | `.operationalStrip` | `border-radius: 12px` | Strip | Magic number | `--radius-lg` (14px) close | **P2** |
| H-06 | DashboardOverview.module.css | `.iconWrapper` | `border-radius: 10px` | Icons | Magic number | `--radius-md` (10px) | **P3** |
| H-07 | DashboardOverview.module.css | `.root` | `gap: 2rem` | Section gaps | Not `--space-*` | `--space-2xl` (32px) vs 2rem (32px) alias | **P3** |
| H-08 | operational-summary-strip.module.css | `.admin-orders-micro-insight strong` | `font-weight: 620` | Micro insights | Non-standard weight | `--type-caption-weight` (600) | **P3** |
| H-09 | operational-summary-strip.module.css | `.admin-orders-operational-summary__item strong` | `font-weight: 650` | Context strip | Non-standard | 600/700 scale | **P3** |
| H-10 | DashboardOverview.module.css | `@keyframes overviewPulse` | opacity 0.45 | Live dot | OK functionally | `--motion-normal` timing only partially used | **P3** |
| H-11 | admin-dashboard-orders.module.css | `.admin-orders-structure` | `gap: 10px`, `6px`, `7px` | Layout | Fragmented spacing | `--space-md`, `--space-sm` | **P2** |
| H-12 | operator-presence-pill.module.css | various | `6px`, `0.71rem` | Pill | Pixel/rem mix | `--space-sm`, `--type-caption-size` | **P2** |
| H-13 | DashboardOverview.module.css | `.kpiLabel`, `.opLabel` | `text-transform: uppercase` | Labels | Enterprise trend = sentence case | Typography policy | **P2** |
| H-14 | DashboardOverview.module.css | `.headerTitles h1` | `1.75rem` | Title | Bypasses `--type-heading-size` (1.05rem token too small for page title) | New page-title step or clamp | **P1** |

---

## 14. Dark / Light Theme Readiness

| Elemento | Dark ready | Light ready | Problema | Recomendación |
|----------|------------|-------------|----------|---------------|
| Header title | Ready | Ready | No page-title token | Map typography scale |
| Subtitle | Ready | Ready | — | — |
| Live pill | Ready | Ready | Pulse OK both themes | — |
| Presence pill | Ready | Ready | — | — |
| Queue pressure pill | Ready | Ready | Semantic dots OK | — |
| KPI cards | Parcial | Parcial | Hardcoded shadow (H-01) | `--shadow-sm` |
| KPI icon container | Ready | Ready | Low contrast separation OK | Optional `--surface-muted-bg` |
| Operational strip | Ready | Ready | — | Use `--surface-strip-bg` |
| Micro-insights passive | Parcial | Parcial | Semantic borders removed | Restore subtle `--surface-muted-border` |
| Mobile overview items | Parcial | Parcial | H-02/H-03 rgba borders | Token borders |
| Legacy analyticsMeta | Ready | Ready | Uppercase micro labels | — |

**Estados globales:** Dark theme vía `.dark` / `html[data-dashboard-theme="dark"]` en `theme-tokens.css`. Overview desktop **mayormente Ready**; mobile/legacy **Parcial** por rgba borders.

---

## 15. Typography Audit

### Escala actual (medida)

| Rol | Size | Weight | Transform | Fuente CSS |
|-----|------|--------|-----------|------------|
| Page title | 1.75rem | 700 | none | `.headerTitles h1` |
| Subtitle | 0.875rem | 400 | none | `.headerDescription` |
| Live/session badge | 0.8rem | 600 | none | `.liveIndicator` |
| Presence label | 0.71rem | 600 | none | presence pill |
| Queue label | 0.8rem / 0.7rem | 600/500 | none | strong/small |
| KPI value | 2rem | 700 | none | `.kpiValue` |
| KPI label | 0.75rem | 600 | **uppercase** | `.kpiLabel` |
| Op strip value | 1.1rem | 600 | none | `.opValue` |
| Op strip label | 0.7rem | 600 | **uppercase** | `.opLabel` |
| Micro insight title | 0.68–0.72rem | 620 | none | micro-insight strong |
| Micro insight detail | 0.59–0.62rem | 400 | none | micro-insight span |

### Evaluación

- **Demasiados uppercase:** KPI labels + operational labels + `analyticsMeta` en context panel — **sí (P2)**
- **Demasiados bold:** 700 title + 700 KPI values + 600 everywhere — jerarquía comprimida
- **KPI values size:** Adequado para ops dashboard; token `--type-metric-size` (1.1rem) **no refleja realidad** — token subdimensionado vs uso
- **Premium feel:** **No** — mezcla de pesos non-standard (620, 650) y micro type

### Escala sugerida (sin implementar)

| Rol | Sugerencia | Mapeo token existente |
|-----|------------|----------------------|
| Page title | `clamp(1.5rem, 2vw, 1.875rem)` / 700 | Extender `--type-heading-*` o `--type-display-size` reducido |
| Section subtitle | `0.875rem` / 400 | `--type-body-size` reducido |
| KPI value | `1.75–2rem` / 700 tabular | Nuevo alias `--type-kpi-value-*` → documentar como extension of metric |
| KPI label | `0.6875rem` / 600 **sentence case** | `--type-caption-size` |
| Insight title | `0.8125rem` / 600 | `--type-label-size` |
| Insight metadata | `0.75rem` / 400 | `--type-caption-size` / weight 400 |
| Badge label | `0.75rem` / 600 | `--type-caption-size` |

---

## 16. Spacing / Grid Audit

| Zona | Spacing actual | Problema | Recomendación |
|------|----------------|----------|---------------|
| Header → KPI grid | `2rem` (32px) | Generoso vs section gap 6px abajo | Unificar a `--space-xl` / `--space-2xl` system |
| KPI grid → op strip | `2rem` | OK internamente | Mantener con token |
| Op strip → micro-insights | `6px` section gap | **Demasiado tight** vs 2rem arriba | `--space-md` (12px) mínimo |
| Micro-insights → execution | `10–16px` structure gap | Aceptable | `--space-lg` consistente |
| KPI card padding | `1.5rem` | OK | `--surface-card-padding` (20px) casi igual — align |
| KPI grid gap | `1.5rem` | OK | `--space-xl` |
| Overview internal | 3 surfaces stacked | Visual fragmentation | Optional wrapper `--surface-panel-padding` |

**Evaluación global:** **Demasiado separado** entre header/KPI/strip (2rem each) pero **demasiado denso** hacia micro-insights (6px). Grid KPI 4→2 responsive coherente.

---

## 17. Semantic Color Audit

### Mapping actual

| Intención | Color source | Consistente? |
|-----------|--------------|--------------|
| Live / session active | `--color-ready` dot | Parcial — live ≠ success |
| Solo vos (presence) | `--color-delivery` dot | Info OK |
| Requires attention (queue critical) | `--color-cancelled` dot | Danger OK |
| Sales / active / completed / ticket KPI | Neutral icon `--text-primary` | Neutral OK |
| Kitchen fluid | success tone on op value | OK |
| No promises (SLA) | neutral tone | OK |
| Risk/attention prescriptive | danger on op value | OK |
| Delivery dominates (micro) | `neutral` → border `--color-delivery` (disabled in passive) | **Lost in passive** |
| Delayed orders insight | `warning` tone | OK in non-passive variant |
| Queue calm → active → busy | ready → delivery → pending | **Buen gradiente semántico** |

### Mapping sugerido a tokens existentes

| Semántica | Token recomendado |
|-----------|-------------------|
| Success | `--success` / `--color-ready` / `--text-ready-strong` |
| Warning | `--warning` / `--color-pending` |
| Danger | `--danger` / `--color-cancelled` |
| Info / live / presence | `--info` / `--color-delivery` |
| Neutral metrics | `--text-primary` + `--text-tertiary` labels |
| Brand accent (future) | `--accent-primary` sparingly on icons |

**No crear tokens nuevos** salvo alias documentados `--dashboard-*` → pointers a existentes.

---

## 18. Iconography Audit

| KPI | Icon | Size | Stroke | Container | Color |
|-----|------|------|--------|-----------|-------|
| Ventas | Banknote | 20px | 2 | 40px soft square | `--text-primary` |
| Activos | Activity | 20px | 2 | same | neutral |
| Completados | CheckCircle | 20px | 2 | same | neutral |
| Ticket | ReceiptText | 20px | 2 | same | neutral |

### Evaluación

- **Comunicación:** Clara y convencional ops/finance
- **Container:** Flat soft — **not premium** (P2)
- **Optical size:** Consistente 20px en 40px box
- **Semantic color:** All neutral — **correcto para KPIs comerciales**; semantic reserved for operational strip tones

Mobile uses same icons at `strokeWidth={1.8}` via `dashboard-analytics-surfaces` — **minor inconsistency (P3)**.

---

## 19. Visual Performance Notes

| Efecto | Presente | Archivo | Impacto |
|--------|----------|---------|---------|
| `overviewPulse` animation | Sí — infinite 2s | DashboardOverview.module.css | Bajo — opacity only on 6px dot |
| Hover transforms | No en overview | — | — |
| box-shadow transitions | No | — | — |
| backdrop-filter | No | — | — |
| color-mix on hover | No en overview | — | — |

**Conclusión:** Sección **ligera**; pulse del live dot es el único motion continuo. Sin riesgo de fluidez significativo.

---

## 20. Prioritized Findings

| ID | Pri | Categoría | Archivo | Descripción | Impacto | Recomendación |
|----|-----|-----------|---------|-------------|---------|---------------|
| F-01 | P0 | Dark/light | dashboard-analytics-surfaces.module.css | Borders `rgba(0,0,0,0.04)` en mobile KPI | Mobile/light-dark fracture | Reemplazar por `--border-subtle` en D6 |
| F-02 | P1 | Tokens | DashboardOverview.module.css | KPI shadow hardcoded rgba | Dark/light shadow drift | `--shadow-sm` |
| F-03 | P1 | Visual hierarchy | DashboardOverview.module.css | Live pill compite con h1 same row | Weak enterprise header | Mover live a meta row o reducir peso visual D4 |
| F-04 | P1 | Surface | Overview section | 3 registros visuales (card / strip / flat text) | No unified block | Wrapper surface D1 |
| F-05 | P1 | Typography | operational-summary-strip.module.css | Micro-insights 0.59–0.68rem | Legibility / premium | Scale to caption tokens D3 |
| F-06 | P1 | Layout | admin-dashboard-orders.module.css | 2rem internal vs 6px to micro-insights | Broken rhythm | Normalize spacing D1 |
| F-07 | P1 | Color semantics | passive micro-insights | Semantic borders removed | Insights feel like loose text | Subtle muted strip D3 |
| F-08 | P1 | Typography | theme-tokens vs usage | `--type-metric-size` 1.1rem vs KPI 2rem | Token model out of sync | Document KPI as extended metric tier |
| F-09 | P1 | Component architecture | admin-dashboard-orders.tsx | Presentation formatters in orchestrator | Harder polish passes | Accept for now; optional extract later |
| F-10 | P2 | Tokens | DashboardOverview.module.css | Radii 10/12/16px not `--radius-*` | Inconsistent roundness | Map in D1 |
| F-11 | P2 | Typography | KPI/op labels | Excessive uppercase | Non-enterprise tone | Sentence case policy D2 |
| F-12 | P2 | Surface | KPI icon wrapper | Flat neutral box | Weak premium signal | `--surface-muted-bg` + subtle border D2 |
| F-13 | P2 | Layout | Overview height | Tall stack on laptop viewports | Pushes kanban down | Compress gaps D6 |
| F-14 | P2 | Duplicado | dashboard-analytics-surfaces vs DashboardOverview | Two KPI visual systems | Maintenance cost | Consolidate D2/D6 |
| F-15 | P2 | Responsiveness | 768px breakpoint | Hard swap desktop/mobile components | Visual discontinuity | QA pass D6 |
| F-16 | P3 | Typography | font-weight 620/650 | Non-standard | Minor rendering variance | Normalize 600/700 |
| F-17 | P3 | Iconography | stroke 2 vs 1.8 mobile | Optical mismatch | Low | Unify stroke |
| F-18 | P3 | Performance | overviewPulse | Continuous animation | Negligible | Optional prefers-reduced-motion |
| F-19 | P3 | Badges | Three pill variants | Micro spacing diffs | Low polish | Badge primitive D4 |
| F-20 | P3 | Legacy | operational-summary CSS | Extracted from orders-admin | Debt label | Consolidate with surface system |
| F-21 | P3 | Semantics | Live dot uses `--color-ready` | Live ≡ success conflation | Low confusion | Consider `--info` |
| F-22 | P3 | Spacing | `--surface-card-padding` unused | 20px token vs 24px actual | Low | Align padding |

**Totals:** P0: 1 · P1: 8 · P2: 6 · P3: 7 (22 findings)

---

## 21. Recommended Token Model

Proposed aliases mapping to **existing** tokens (convención adaptada al proyecto — no nuevos hex):

```css
/* Conceptual — implement in Phase D1 as CSS aliases or documentation only */

--dashboard-page-bg: var(--bg-canvas);
--dashboard-section-gap: var(--space-lg);

--dashboard-surface: var(--surface-elevated-bg);
--dashboard-surface-muted: var(--surface-muted-bg);
--dashboard-surface-soft: var(--surface-strip-bg);

--dashboard-card-bg: var(--surface-elevated-bg);
--dashboard-card-border: var(--surface-elevated-border);
--dashboard-card-shadow: var(--surface-elevated-shadow);
--dashboard-card-hover: var(--surface-interactive-hover-bg); /* if interactive later */

--dashboard-border: var(--border-subtle);
--dashboard-border-strong: var(--border-strong);

--dashboard-kpi-value-size: clamp(1.75rem, 2.5vw, 2rem); /* extends beyond --type-metric-size */
--dashboard-kpi-value-weight: var(--type-metric-weight);
--dashboard-kpi-label-size: var(--type-caption-size);
--dashboard-kpi-label-color: var(--text-tertiary);

--dashboard-insight-success: var(--text-ready-strong);
--dashboard-insight-warning: var(--text-pending-strong);
--dashboard-insight-danger: var(--text-cancelled-strong);
--dashboard-insight-info: var(--text-delivery-strong);
--dashboard-insight-neutral: var(--text-primary);

--dashboard-badge-live-bg: var(--bg-surface-soft);
--dashboard-badge-live-border: var(--border-subtle);
--dashboard-badge-live-dot: var(--color-ready); /* or --info */

--dashboard-badge-scope-bg: var(--bg-surface-soft);
--dashboard-badge-attention-dot: var(--color-cancelled);
```

**Clasificación del modelo actual:**

| Token propuesto | Existe equivalente | Estado |
|-----------------|-------------------|--------|
| dashboard.page | `--bg-canvas` | Definitivo |
| dashboard.surface | `--surface-elevated-*` | Parcial uso |
| dashboard.card | `--surface-elevated-*` | Parcial |
| dashboard.insight.* | `--text-*-strong` | Definitivo |
| dashboard.badge.* | Composed ad hoc | Duplicado / Tokenizable |

---

## 22. Recommended Refactor / Polish Phases

### Phase D1 — Top Section Token Alignment
- Reemplazar hardcodes H-01, H-04–H-07, H-11 con tokens existentes
- Unificar gaps overview section (`--space-*`)
- Introducir aliases `--dashboard-*` como documentación/CSS custom properties scoped to `.admin-orders-section--overview`
- **Sin** mover componentes

### Phase D2 — KPI Card Premium Polish
- Aplicar `--surface-elevated-*` a `.kpiCard`
- Icon container → `--surface-muted-bg` + `--radius-md`
- KPI label sentence case + `--type-caption-*`
- Eliminar shadow rgba (F-02)

### Phase D3 — Operational Insights Redesign
- Unificar operational strip + passive micro-insights en una jerarquía clara (strip + secondary row)
- Restaurar semántica sutil en passive mode (border-left o tone dot)
- Subir tipografía micro-insights a caption scale
- Evaluar click-through a filtros (behavior — out of scope unless requested)

### Phase D4 — Header / Badge Hierarchy Polish
- Rebalance title vs live badge (row split o reduced pill contrast)
- Unificar `OperatorPresencePill`, `.liveIndicator`, `.queuePressure` spacing/typography
- Optional shared `DashboardBadge` primitive (CSS-only module)

### Phase D5 — Light/Dark QA
- Fix H-02/H-03 mobile borders
- Verify KPI shadow, strip backgrounds, passive insights contrast WCAG
- Screenshot matrix: light/dark × desktop/mobile

### Phase D6 — Responsive Top Section Pass
- Align `DashboardMobileOverview` visuals with desktop token model
- Reduce above-the-fold height (gap compression @ 900–1200px)
- Breakpoint continuity audit 767–769px

---

## 23. What Not To Touch Yet

- Order lanes, kanban, lane navigation
- Order cards and card CSS modules
- `AdminOrderWorkspaceModal` and modal phases
- `DashboardToolbar` search/filters/store session controls
- Realtime hooks and subscription logic
- Server actions, Supabase, migrations
- `DashboardContextPanel` content/behavior (optional consolidate **after** top section stable)
- Business logic in `lib/orders/*` metric calculations

---

## 24. Next Implementation Prompt Suggestion

```
Phase D1 — Admin Dashboard Top Section Token Alignment (CSS/tokens only)

Scope: `.admin-orders-section--overview` + `DashboardOverview.module.css` + passive micro-insights classes in `operational-summary-strip.module.css`. Do NOT touch lanes, cards, modal, toolbar logic, or TSX data flow.

Tasks:
1. Replace `.kpiCard` box-shadow with `var(--shadow-sm)`.
2. Map border-radius 16px→`var(--radius-xl)`, 12px→`var(--radius-lg)`, 10px→`var(--radius-md)`.
3. Replace overview section gaps with `--space-md` / `--space-xl` / `--space-2xl` consistently (fix 6px micro-insight gap → `--space-md`).
4. Apply `--surface-elevated-bg/border/shadow` to KPI cards.
5. Apply `--surface-strip-bg/border` to `.operationalStrip`.
6. Add scoped aliases under `.admin-orders-section--overview` per docs/admin-dashboard-top-section-token-audit.md §21.

Validation: visual QA dark+light desktop; `npx tsc --noEmit`; no TSX changes unless className-only.

Reference: docs/admin-dashboard-top-section-token-audit.md findings F-02, F-04, F-06, F-10, H-01.
```

---

## Validaciones de esta fase

- No se modificó código funcional.
- No se modificó CSS.
- No se modificaron tokens.
- No se requiere tsc/build para esta fase.
