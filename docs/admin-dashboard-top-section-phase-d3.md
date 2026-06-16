# Admin Dashboard Top Section Phase D3 — TSX Structure Refactor + Presenter Implementation

## Objetivo

Implementar el presenter `buildDashboardTopSectionViewModel` (D2) y reestructurar el top section desktop de `/admin/dashboard` para usar un único view model session-scoped, corrigiendo el desajuste P0 de D1 (UI “Sesión activa” vs datos de `businessWindowOrders`).

## Referencias

- `docs/admin-dashboard-top-section-product-contract.md` (D0)
- `docs/admin-dashboard-top-section-data-map.md` (D1)
- `docs/admin-dashboard-top-section-view-model-plan.md` (D2)
- `docs/admin-dashboard-top-section-token-audit.md` (visual — no polish en D3)

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `components/admin/orders/admin-dashboard-orders.tsx` | Wiring presenter con `visibleOperationalOrders`; eliminación micro-insights pasivos desktop |
| `components/admin/orders/DashboardOverview.tsx` | Nueva estructura: header, status summary, KPI grids, insights row |
| `components/admin/orders/DashboardOverview.module.css` | CSS estructural mínimo para nuevas secciones |

## Archivos creados

| Archivo | Rol |
|---------|-----|
| `lib/orders/dashboard-top-section-view-model.ts` | Presenter puro + tipos exportados |

## Presenter implementado

- Función: `buildDashboardTopSectionViewModel(input)`
- Pureza: sin React, fetch, DOM ni mutaciones
- Lib reutilizada: `buildAdminOrdersAnalytics`, `buildOperationalMetrics`, `calculateSaturationIndex`, `formatAdminOrderCurrency`, `formatOperationalMetricMinutes`
- Constantes: `OPERATIONAL_THRESHOLDS`, `BUSINESS_INSIGHT_THRESHOLDS`

## View model implementado

```ts
DashboardTopSectionViewModel {
  meta
  statusSummary
  businessKpis[4]
  operationalKpis[4]
  insights[1..4]
}
```

## Wiring aplicado

```tsx
buildDashboardTopSectionViewModel({
  orders: visibleOperationalOrders,
  operationalWindow,
  now,
  liveLabel: topBarRealtimeLabel,
  realtimeStatus,
  onlineCount,
  presenceLabel: globalPresenceLabel
})
```

**Fix P0:** KPIs e insights del top section desktop usan `visibleOperationalOrders`, no `businessWindowOrders`.

`businessWindowOrders` se mantiene para mobile overview y otros bloques legacy.

## Cambios en DashboardOverview

Nueva estructura renderizada:

1. **Header** — `meta.title`, `meta.sessionLabel · meta.liveLabel`, presence condicional
2. **Status summary** — health label, ventas de sesión/jornada, supporting signals
3. **Business KPI grid** — 4 cards
4. **Operational KPI grid** — 4 cards
5. **Insights row** — hasta 4 `<article>` descriptivos

Props: `{ viewModel: DashboardTopSectionViewModel }` únicamente.

## Cambios en datos / session scoping

| Antes | Después |
|-------|---------|
| KPIs desde `businessWindowOrders` | Desde `visibleOperationalOrders` |
| Completados en business grid | Más vendido |
| Strip 3 cols: Cocina, SLA, Riesgo | Grid 4 cols operacional D0 |
| Queue pressure en header | Removido del overview |
| “Solo vos” con 1 operador | Oculto (`showPresence = onlineCount > 1`) |
| Micro-insights pasivos externos | Integrados en `viewModel.insights` |

## Business KPIs renderizados

1. Ventas (primary)
2. Ticket promedio
3. Pedidos activos
4. Más vendido

## Operational KPIs renderizados

1. Estado de cocina
2. Pedidos demorados
3. Tiempo promedio (preparación)
4. Listos esperando salida

## Insights renderizados

IDs: `stalled-orders`, `ready-waiting`, `recent-peak`, `delivery-dominance`, `pickup-dominance`, `positive-operations`.

Sin `onClick`; `data-action-key` preparado para D10.

## Qué se preservó

- `DashboardMobileOverview` sin rediseño (sigue usando `overviewCommercialInsights` / `businessWindowOrders`)
- `DashboardContextPanel`, lanes, cards, modal, toolbar
- Realtime hooks sin cambios
- `buildOrdersQueuePressure` para lane navigation / otros consumidores
- Thresholds existentes en `lib/orders/constants.ts`

## Qué NO se tocó

- lanes
- order cards
- modal
- toolbar/search/filtros
- store session controls
- realtime
- server actions
- DB/Supabase
- tokens globales (`theme-tokens.css`, `globals.css`)
- polish CSS premium
- mobile/tablet redesign
- insight filters clickables

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | ✅ Pass (exit 0) |
| `npm run lint` | ⚠️ No configurado — `next lint` abre setup interactivo ESLint |
| `npm run build` | ✅ Pass (exit 0) |

## Tests

No hay infraestructura de tests unitarios en el repo (`*.test.ts` no encontrados). **Test del presenter pendiente** para fase posterior.

Casos recomendados cuando exista runner:

- empty orders → Sin actividad, ticket Sin datos, positive insight
- stalled → delayed KPI + stalled insight
- readyCount >= 2 → ready-waiting insight
- onlineCount 1 → showPresence false
- onlineCount 2 → showPresence true

## QA manual recomendado

Verificar en `/admin/dashboard` desktop (checklist D3 prompt §25):

- [ ] Top section sin errores
- [ ] Header: Panel del Negocio + Sesión activa · En vivo
- [ ] No “Solo vos” con un operador
- [ ] No queue pressure pill en header
- [ ] Status summary visible
- [ ] Business grid: Ventas, Ticket, Activos, Más vendido (sin Completados)
- [ ] Operational grid: Cocina, Demorados, Tiempo, Listos (sin SLA/Riesgo)
- [ ] Insights en bloque propio, no clickeables
- [ ] KPIs reflejan sesión activa (no pedidos pre-apertura de sesión)
- [ ] Lanes/cards/modal/toolbar sin cambios

**Estado:** Pendiente de verificación manual en browser.

## Riesgos restantes

- `order_items_preview` puede estar vacío → Más vendido “Sin ventas todavía”
- Mobile overview sigue en dataset business window (deuda documentada)
- CSS estructural mínimo — polish en D4–D7
- `averagePreparationMinutes` null sin eventos ready → “Sin datos” en tiempo promedio

## Próxima fase recomendada

**Phase D4 — Token Alignment / Surface System** — aplicar surface tokens del audit sin cambiar lógica del presenter.
