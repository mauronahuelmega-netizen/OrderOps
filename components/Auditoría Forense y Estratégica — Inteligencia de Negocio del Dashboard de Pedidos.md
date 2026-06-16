# Auditoría Forense y Estratégica — Inteligencia de Negocio del Dashboard de Pedidos

**Alcance:** Solo lectura · Cadena `admin-dashboard-orders.tsx` → `lib/orders/*`  
**Ruta:** `/admin/dashboard`  
**Fecha:** 2026-06-06

---

## 0. Arquitectura de Derivación (contexto obligatorio)

El dashboard no tiene un único “scope temporal”. Hay **tres capas de arrays** que alimentan métricas distintas:

```
optimisticOrders (Realtime + reconciler)
    ├── businessWindowOrders     → KPIs header + Operational Strip + Queue Pressure (overview)
    │     filtro: created_at ∈ jornada calendario (00:00–24:00, DEFAULT_BUSINESS_WINDOW_CONFIG)
    │
    ├── visibleOperationalOrders → Kanban + paneles inferiores
    │     filtro: created_at ∈ operationalWindow
    │       • Si hay store_session abierta → [openedAt, now)
    │       • Si no → misma jornada calendario
    │
    └── filteredOrders           → mismos paneles inferiores + búsqueda + tabs
          = visibleOperationalOrders ∩ filtro UI ∩ búsqueda natural
```

**Campos BD usados en cálculo** (vía `getAdminOrders`):

| Campo | Uso en métricas |
|-------|-----------------|
| `created_at` | Ventana temporal, aging, bursts, actividad |
| `status` | Activos, completados, cancelados, lanes |
| `total_price` | Ventas, ticket, high-ticket |
| `delivery_method` | Mix delivery/retiro |
| `order_items` (snapshot) | Top producto |
| `order_events` | Tiempos preparación/completado, reasignaciones, regresiones, actividad |
| `assigned_to`, `assigned_at` | Última actividad, riesgo |
| `customer_name`, `phone` | Contexto cliente (historial en memoria) |
| `delivery_date` | Solo presentación en tarjetas — **no entra en KPIs** |
| `delivery_time` | **No se selecciona en query** — invisible para analytics |

**Deuda detectada:** `commercialInsights` y `operationalInsights` se calculan en `admin-dashboard-orders.tsx` (L~1701, L~1741) pero **no se renderizan** — CPU desperdiciada en cada re-render.

---

## 1. Mapa de Cálculo Actual (Current State)

### 1.1 KPIs Principales (Header — `DashboardOverview`)

**Fuente:** `businessWindowOrders` → `buildAdminOrdersAnalytics()` → `formatOperationalInsightValue()`  
**Archivo:** `lib/orders/analytics.ts`

| KPI | Cálculo exacto | Campos BD | Ventana |
|-----|----------------|-----------|---------|
| **Ventas** | `SUM(total_price)` excluyendo `status = cancelled` | `total_price`, `status` | Jornada calendario por `created_at` |
| **Activos** | Count `pending \| preparing \| ready` | `status` | Idem |
| **Completados** | Count `status = completed` | `status` | Idem |
| **Ticket promedio** | `revenue / validOrdersCount` (no cancelados) | `total_price`, `status` | Idem |

**Observaciones críticas:**
- Las ventas incluyen pedidos **aún no completados** (pending/preparing/ready cuentan en revenue).
- No hay distinción entre ventas **cobradas** vs **pipeline**.
- `delivery_date` no participa; un pedido programado para mañana pero creado hoy entra en “ventas de hoy”.

**Queue Pressure (badge header):** `buildOrdersQueuePressure(businessWindowOrders, now)` — usa `getTodayActiveOrders()` que filtra activos por **jornada calendario**, no por sesión operativa. Umbrales fijos: calm / active (≥4 activos) / busy (≥8 o stale≥1) / critical (≥12 o stale≥3 o oldest≥90 min). El “oldest” mide edad desde `created_at`, no desde último evento.

---

### 1.2 Operational Strip (3 métricas visibles)

**Fuente:** `overviewOperationalMetrics` = `buildOperationalMetrics(businessWindowOrders, now)`  
**Keys mostradas:** `averagePreparation`, `stalled`, `lastMovement` (`OPERATIONAL_STRIP_KEYS`)  
**Archivo:** `lib/orders/metrics.ts`

| Métrica UI | Cálculo real | Umbral / lógica |
|------------|--------------|-----------------|
| **Preparación** | Promedio de minutos entre evento `→ preparing` (o `created_at`) y evento `→ ready` en `order_events` | Solo pedidos con evento ready; redondeo entero |
| **Estancados** | Activos con `inactiveMinutes ≥ 20` | Inactividad = tiempo desde `max(created_at, assigned_at, order_events.*.created_at)` |
| **Últ. mov.** | `formatLongestInactiveMetricValue()` = **mayor inactividad entre activos**, no el timestamp del último movimiento global | Semántica engañosa: es “peor demora activa”, no “último movimiento” |

**No mostrados en strip pero calculados:** tiempo promedio de completado, cancelados, reasignaciones (sí aparecen en mobile overview).

**Micro-insights pasivos (debajo del overview):** `buildOperationalDashboardInsights(businessWindowOrders, …)` — top 3 por prioridad (estancados, regresivos, prep lenta >25 min, reasignaciones, mix delivery/retiro, fallback “operación estable/tranquila”).

---

### 1.3 Paneles Inferiores (Contexto)

Todos usan **`filteredOrders`** (ventana operativa + filtros UI), salvo que el overview superior usa `businessWindowOrders` — **desalineación de scope** entre header y contexto cuando hay sesión de tienda activa.

#### A) Resumen Operativo — `buildOperationalSummaries()`

**Archivo:** `lib/orders/operational-summaries.ts` · Max 5 tarjetas

Reglas (prioridad descendente):
1. ≥2 pedidos con riesgo ≠ stable (sin estancados) → “necesitan revisión”
2. `stalledCount > 0` → atención (>20 min sin movimiento)
3. Insight regresivo en dashboard → “cambios regresivos”
4. Prep promedio > 25 min → “preparación lenta”
5. Cancelaciones ≥2 y ≥20% del total → “cancelaciones acumuladas”
6. Reasignaciones > 0 → info
7. Mix delivery/retiro ≥70% → info
8. Fallback estable según hora (`now.getHours() < 11`), activos ≤2, etc.

Input: `operationalMetrics`, `commercialAnalytics`, `operationalDashboardInsights`, `recentActivity`, `orderRiskAssessments`.

#### B) Insights del Negocio — `buildBusinessInsights()`

**Archivo:** `lib/orders/business-insights.ts` · Max 4 · Algunos enlazan a pedido (`orderId`)

| Kind | Regla | Accionable |
|------|-------|------------|
| high-ticket | Activo con `total_price ≥ 1.4× ticket promedio` | Sí — abre pedido |
| frequent-customer | `customer_context.totalOrders ≥ 5` (historial en dataset cargado) | Sí |
| recent-peak | ≥3 pedidos creados en últimos 10 min | No |
| preparation-trend | Prep promedio > 25 min | No |
| delivery/pickup-dominant | Ratio ≥ 70% | No |
| sales-momentum | ≥5 completados | No |
| slow-rhythm | Sin pedidos nuevos ≥35 min, ≤2 activos, sin riesgo | No |

#### C) Actividad Reciente — pipeline en dos pasos

1. **`buildRecentOperationalActivity(filteredOrders)`** (`activity.ts`): aplana `order_events` + `created_at`, ventana 24h, max 6 eventos, prioriza por timestamp.
2. **`buildOperationalFeed()`** (`operational-feed.ts`): agrega bursts, riesgo grupal, regresiones (180 min), completados agrupados (60 min), reasignaciones (90 min), mix delivery, fallback eventos sueltos, max 6 items.

**Riesgo por pedido:** `assessOrderRisk()` (`risk-detection.ts`) — score compuesto (inactive ≥15 min, slow-prep, many-changes ≥4 en 60 min, regressive, reassigned, stalled ≥20 min con señales). Alimenta summaries, feed y tarjetas Kanban — **pero no genera acciones prescriptivas textuales**.

---

## 2. Gap Analysis de Negocio (Enterprise vs Current)

### 2.1 Ausencia de SLAs

| Expectativa Enterprise | Estado actual |
|------------------------|---------------|
| Promesa al cliente (`delivery_date` + `delivery_time`) vs reloj operativo | `delivery_time` **no se carga**; `delivery_date` solo UI |
| % pedidos “en riesgo de incumplir” antes de ready | No existe |
| Tiempo restante hasta promesa | No calculado |
| SLA por canal (delivery vs pickup) | No |

Solo hay **umbrales operativos internos** hardcodeados (15/20/25/45/90 min) mezclando inactividad, aging visual y prep — sin vínculo con compromiso comercial.

### 2.2 Falta de Benchmarking (Deltas)

- **Cero comparación** vs ayer, misma hora ayer, promedio 7 días, o sesión anterior.
- “Delivery domina hoy” es **snapshot absoluto**, no delta (+12 pp vs ayer).
- Ticket promedio sin banda de normalidad (¿alto o bajo para este negocio?).
- Queue Pressure no expone tendencia (¿subiendo o bajando en últimos 30 min?).
- Revenue incluye pipeline — un pico de “ventas” puede ser solo pedidos pendientes sin conversión real.

### 2.3 Actionability (Accionabilidad)

| Patrón actual | Limitación |
|---------------|------------|
| “5 estancados” | No dice **cuáles**, ni acción (“revisar pedido X de Cliente Y”) |
| “Preparación lenta” | Promedio agregado; no identifica estación/cuello |
| “Operación estable” | Cierra conversación; no guía optimización |
| Insights duplicados | Misma regla delivery 70% en 4 módulos — ruido, no jerarquía |
| `orderId` en business insights | Parcialmente accionable; summaries/feed agrupan sin CTA semántico |
| Riesgo con score | Existe en `assessOrderRisk` pero UI muestra badge genérico, no playbook |

**Conclusión:** El sistema es **descriptivo + ligero diagnóstico**. Falta capa **prescriptiva** (qué hacer, en qué orden, impacto estimado) y **predictiva** (qué pasará si no actúas en N minutos).

### 2.4 Otras debilidades estructurales (datos)

1. **Scope inconsistente:** overview (jornada) vs ejecución (sesión) confunde al dueño en modo “Abrir sesión”.
2. **Ventas infladas:** revenue cuenta no-cancelados, no solo completados.
3. **Historial cliente:** `totalOrders` se construye del batch cargado en SSR, no de agregación SQL histórica profunda.
4. **Sin series temporales persistidas:** todo es recompute in-memory; imposible forecasting sin ampliar datos.
5. **Lógica duplicada:** umbrales 20/25/70 min repetidos en 5+ archivos — drift risk enterprise.

---

## 3. Propuestas de Elevación (The Enterprise Upgrade)

> Enfoque exclusivo en `lib/orders/` — arrays, agregaciones, reglas temporales. Sin rediseño UI.

### Propuesta 1 — **SLA Promise Tracker** (mínimo campo: cargar `delivery_time`)

**Datos existentes:** `delivery_date`, `status`, `order_events`, `delivery_method`  
**Cambio mínimo:** incluir `delivery_time` en query + parser de “promesa datetime”.

```ts
// lib/orders/sla-tracking.ts (nuevo)
computeOrderSlaState(order, now) → {
  promisedAt, minutesToPromise, breachRisk: 'ok' | 'at_risk' | 'breached',
  recommendedAction: 'prioritize_kitchen' | 'contact_customer' | ...
}
```

Agregados dashboard: `slaAtRiskCount`, `slaBreachedCount`, `nextBreachInMinutes`.  
**Prescriptivo:** “3 pedidos delivery incumplen promesa en <15 min — priorizar IDs […]”.

### Propuesta 2 — **Velocity & Saturation Index (evolución Queue Pressure)**

Ya existe `buildOrdersQueuePressure`. Extender en `lib/orders/queue-pressure.ts`:

- **Throughput:** completados / hora rolling (últimos 60 min desde `order_events`).
- **Arrival rate:** pedidos creados / hora rolling.
- **Saturation score:** `arrivalRate / max(throughput, ε)` + cola activa ponderada por estado.
- **Predictivo:** ETA a colapso si `arrivalRate > throughput` por 2 ventanas consecutivas.

Output: `{ saturationScore: 0–100, trend: 'rising'|'stable'|'falling', prescription: string }`.

### Propuesta 3 — **Benchmark Deltas (sin warehouse — ventana histórica ligera)**

Query adicional server-side: pedidos últimos 7 días (solo `created_at`, `status`, `total_price`, agregados por hora).  
En cliente:

```ts
buildMetricDelta(current, baselineSameHourLast7Days) → {
  revenueDeltaPct, activeDelta, prepMinutesDelta, cancelRateDelta
}
```

Mostrar en capa de datos como campos opcionales en `AdminOrdersAnalytics` extendido.  
**Prescriptivo:** “Ticket −18% vs promedio martes 14h — revisar mix o promociones”.

### Propuesta 4 — **Revenue Leakage & Anomaly Detection**

Con datos actuales (sin carritos abandonados):

| Señal | Regla |
|-------|-------|
| Cancel anomaly | `cancelRate > baseline + 2σ` o ≥3 cancelaciones en 30 min |
| Regressive churn | pedidos que vuelven de ready → preparing (ya parcialmente detectado) |
| Pipeline vs realized | `revenuePipeline` (activos) vs `revenueRealized` (completados) — ratio > umbral |

**Prescriptivo:** “Cancelaciones +40% vs ayer — revisar últimos 4 pedidos cancelados [IDs]”.

Carritos abandonados requerirían evento checkout (`checkout_started`) — **campo nuevo**, fuera de scope mínimo.

### Propuesta 5 — **Smart Context Engine (franja horaria)**

Función pura `resolveDashboardBusinessMode(now, storeSession, orders)`:

| Modo | Hora / estado | Métricas priorizadas en agregador |
|------|---------------|-----------------------------------|
| `pre_open` | Antes de apertura / sesión cerrada | Forecast demanda (promedio histórico misma hora), checklist apertura |
| `service_peak` | Saturation ≥ busy | SLA at-risk, estancados top-N, throughput |
| `closeout` | Sesión cerrando o post 22h | Corte caja (`revenueRealized`), cancel rate, prep promedio sesión vs objetivo |

Retorna **ordered metric keys + prescriptions[]** — el UI solo reordena; la inteligencia vive en `lib/orders/context-engine.ts`.

### Propuesta 6 — **Prescriptive Action Queue (capa sobre riesgo existente)**

Unificar outputs de `assessOrderRisk`, `operationalSummaries`, `businessInsights` en:

```ts
buildPrescriptiveActions(orders, riskMap, slaMap, now) → ActionItem[] {
  orderId, priority, verb: 'assign'|'advance_status'|'call_customer'|'escalate',
  reason, estimatedImpactMinutes
}
```

Ordenar por score compuesto; deduplicar reglas delivery-dominance.  
Convierte “5 estancados” en lista accionable sin tocar componentes.

---

## 4. Tabla Resumen

| Métrica actual | Limitación | Evolución Enterprise propuesta |
|----------------|------------|--------------------------------|
| **Ventas (revenue)** | Suma no-cancelados en jornada; incluye pipeline; sin delta histórico | `revenueRealized` (solo completed) + delta vs baseline; separar pipeline |
| **Activos / Completados** | Count snapshot; scope header ≠ contexto con sesión | Unificar `operationalWindow`; añadir tasa conversión activo→completado/hora |
| **Ticket promedio** | Media simple del scope; sin bandas | Percentil vs histórico 7d; flag outlier por pedido (ya parcial en business-insights) |
| **Prep promedio (strip)** | Media de completados con evento ready; umbral 25 min fijo | SLA-adjusted prep; delta vs objetivo negocio; identificar top-3 outliers |
| **Estancados** | Count ≥20 min inactivos; sin identidad | Top-N con `orderId` + acción prescriptiva desde `assessOrderRisk` |
| **Últ. mov. (strip)** | Muestra max inactividad activa, label incorrecto | Renombrar semántica + añadir timestamp real último evento global |
| **Queue Pressure** | Umbrales fijos; scope jornada; sin predicción | Saturation Index + trend + ETA colapso (Propuesta 2) |
| **Resumen operativo** | Reglas duplicadas; texto genérico | Action Queue unificada; eliminar duplicados delivery 70% |
| **Insights del negocio** | Descriptivos; 4 max; poco playbook | Prescripciones con verbo + impacto; priorizar SLA y riesgo sobre mix |
| **Actividad reciente** | Feed de eventos 24h; max 6 | Timeline accionable filtrada por “requiere decisión”; agrupar por pedido |
| **Riesgo por pedido** | Score existe; no escala a negocio | Roll-up `businessRiskExposure` + recomendación staffing |
| **Promesa entrega** | `delivery_time` no cargado; no medido | SLA Promise Tracker (Propuesta 1) |
| **Benchmarking** | Inexistente | Deltas vs mismo slot horario 7d (Propuesta 3) |
| **Cancelaciones** | Count + ratio 20% en summaries | Anomaly detection + correlación con regresiones (Propuesta 4) |
| **Contexto horario** | Solo `getHours() < 11` en fallback | Smart Context Engine pre_open / peak / closeout (Propuesta 5) |

---

## Recomendación de secuencia (solo capa `lib/orders/`)

1. **Quick wins (sin migración):** unificar scopes, corregir semántica “Últ. mov.”, eliminar memos muertos, deduplicar reglas 70%/25 min en constantes compartidas, `buildPrescriptiveActions` sobre riesgo existente.  
2. **Alto impacto (query mínima):** cargar `delivery_time` → SLA Tracker.  
3. **Predictivo:** extender Queue Pressure → Saturation Index.  
4. **Enterprise:** endpoint/hook histórico 7d para deltas + Smart Context Engine.

---

*Auditoría basada en código en `admin-dashboard-orders.tsx`, `lib/orders/analytics.ts`, `metrics.ts`, `business-insights.ts`, `operational-summaries.ts`, `operational-feed.ts`, `activity.ts`, `queue-pressure.ts`, `risk-detection.ts`, `presenter.ts`, `admin.ts`.*