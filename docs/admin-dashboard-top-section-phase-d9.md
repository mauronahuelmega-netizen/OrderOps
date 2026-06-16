# Admin Dashboard Top Section Phase D9 — Mobile Top Section Parity

## Objetivo

Alinear el top section mobile/tablet con la arquitectura D0–D8 del desktop, consumiendo el mismo `DashboardTopSectionViewModel` session-scoped sin KPIs legacy.

## Contexto

Post-D8, desktop usa presenter + `DashboardOverview`. Mobile seguía mostrando `JORNADA ACTUAL`, `Completados`, SLA, Riesgo operativo e insights legacy desde `businessWindowOrders` y métricas antiguas.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `components/admin/orders/DashboardMobileOverview.tsx` | Reescrito para consumir `viewModel`; misma estructura que desktop |
| `components/admin/orders/DashboardMobileOverview.module.css` | **Creado** — estilos mobile compactos D4–D7 |
| `components/admin/orders/admin-dashboard-orders.tsx` | Wire `viewModel`; eliminados useMemos legacy mobile |
| `components/admin/orders/admin-dashboard-orders.module.css` | Spacing mobile + min-width execution chrome |

## Archivos creados

- `components/admin/orders/DashboardMobileOverview.module.css`
- `docs/admin-dashboard-top-section-phase-d9.md`

## Cambio principal aplicado

`DashboardMobileOverview` ahora recibe `dashboardTopSectionViewModel` (mismo que desktop) y renderiza header, 4 business KPIs, 4 operational KPIs y señales desde `viewModel.insights`.

## Mobile wiring aplicado

```tsx
<DashboardMobileOverview viewModel={dashboardTopSectionViewModel} />
```

Session scoping: `visibleOperationalOrders` vía presenter — igual que desktop.

## Legacy mobile removido

- `Completados` como KPI principal
- `Cumplimiento SLA` / Sin promesas activas
- `Riesgo operativo`
- `INSIGHTS` legacy / `buildOperationalDashboardInsights` slice en mobile
- `JORNADA ACTUAL` / `OPERACION EN VIVO` section titles
- Props `daySummaryInsights`, `operationalSummaryInsights`, `dashboardInsights`
- `getMobileOverviewOperationalInsightIconKey` export
- Dependencia de `dashboard-analytics-surfaces.module.css` para mobile overview

## Business KPI mobile parity

4 KPIs desde `viewModel.businessKpis`: Ventas, Ticket promedio, Pedidos activos, Más vendido. Grid 2 columnas (1 en ≤389px). Cards compactas con padding `--space-md`.

## Operational KPI mobile parity

4 KPIs desde `viewModel.operationalKpis`: Estado de cocina, Pedidos demorados, Tiempo promedio, Listos esperando salida. Rails de severidad 3px (patrón D6 compacto).

## Insights mobile parity

`viewModel.insights` con título **Señales de la sesión**, tone dots, `data-action-key` sin click. Grid 1 col narrow / 2 cols con 2–4 insights.

## Mobile spacing / density

- Root gap `--space-md`
- KPI padding/icon reducidos vs desktop
- `admin-orders-structure` gap `--space-sm` @768px
- Execution divider + padding compacto hacia `Pedidos en curso`

## Search / overflow notes

- `dashboardExecutionChrome`: `min-width: 0`, `width: 100%` en mobile
- Toolbar/search logic no modificada; fix profundo documentado como posible D10 si persiste overflow interno del toolbar

## Desktop preservation

- `DashboardOverview.module.css` sin cambios en D9
- Mobile CSS scoped con `@media (max-width: 768px)` en módulo propio
- Desktop overview sigue oculto en mobile vía reglas existentes

## Qué se preservó

- Presenter y view model (sin cambios)
- Session scoping
- Business / operational KPI IDs
- Insight IDs, priorities, `futureActionKey`
- Desktop top section D8
- Lanes, cards, modal, toolbar logic

## Qué NO se tocó

- `lib/orders/dashboard-top-section-view-model.ts`
- Cálculos y thresholds
- Realtime, server actions, DB/Supabase
- Tokens globales
- Search/filter logic
- Store session controls logic
- Insight filters clickables
- Mobile lanes/cards/modal redesign

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | ✅ Exit code 0 |
| `npm run lint` | ⚠️ Exit code 1 — ESLint no configurado; `next lint` abre setup interactivo |
| `npm run build` | ✅ Exit code 0 — Next.js 15.3.0 |

## QA manual recomendado

Desktop: top section D8 intacto.
Mobile: sin Completados/SLA/Riesgo, con 4+4 KPIs D0, Señales de la sesión, header session-scoped, cards compactas, search funcional.

**Estado:** Pendiente de verificación en browser.

## Riesgos restantes

- Duplicación estructural TSX entre `DashboardOverview` y `DashboardMobileOverview` (extracción compartida posible en fase futura)
- Search overflow interno del toolbar puede requerir D10 en `dashboard-toolbar.module.css`
- `overviewOperationalDashboardInsights` sigue calculándose en orchestrator para otros usos potenciales

## Próxima fase recomendada

**Phase D10 — Toolbar Mobile Polish / Search Overflow** o extracción de subcomponentes compartidos overview mobile/desktop.
