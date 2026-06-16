# Admin Dashboard Top Section Phase D3.1 — Hide / Compact Status Summary

## Objetivo

Eliminar la redundancia visual del bloque `Status summary` en el top section desktop de `/admin/dashboard`, manteniendo el dato en el view model para uso futuro.

## Contexto posterior a D3

D3 implementó la estructura:

```txt
Header → Status summary → Business KPIs → Operational KPIs → Insights
```

El presenter `buildDashboardTopSectionViewModel` compone `statusSummary` con health label, ventas de sesión y supporting signals.

## Problema detectado

En QA visual, `Status summary` repetía información ya presente en los KPIs:

- **Atención requerida** → visible en Pedidos demorados, Tiempo promedio, Listos esperando salida
- **Ventas de sesión** → visible en KPI Ventas
- **Supporting signals** (Sin demoras, pedidos activos, etc.) → redundantes con operational KPIs

El bloque ocupaba espacio vertical sin aportar jerarquía nueva.

## Decisión aplicada

Se mantiene `viewModel.statusSummary` en el presenter y en el tipo `DashboardTopSectionViewModel`, pero **no se renderiza** como bloque visual principal en desktop.

Arquitectura visual desktop:

```txt
Header
Business KPI grid
Operational KPI grid
Insights row
```

No se agregó `healthLabel` al header (preferencia D3.1: `Sesión activa · En vivo` únicamente).

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `components/admin/orders/DashboardOverview.tsx` | Removido `<StatusSummary />` y componente interno |
| `components/admin/orders/DashboardOverview.module.css` | Eliminadas clases `.statusSummary*`; gap root `1.5rem` → `1.25rem` |

## Archivos creados

- `docs/admin-dashboard-top-section-phase-d3-1.md`

## Cambio principal

- Removido render de `StatusSummary` en `DashboardOverview`
- Eliminado CSS muerto del summary
- Ajuste menor de spacing entre header y KPIs

## Qué se preservó

- Presenter `buildDashboardTopSectionViewModel`
- `DashboardTopSectionViewModel` y `statusSummary` en el view model
- Business KPIs (4)
- Operational KPIs (4)
- Insights (1–4)
- `visibleOperationalOrders` / session scoping
- Header meta (presence rules, sin queue pressure)

## Qué NO se tocó

- `lib/orders/dashboard-top-section-view-model.ts`
- lanes · order cards · modal
- toolbar/search/filtros · store session controls
- realtime · server actions · DB/Supabase
- tokens globales
- mobile/tablet
- insight filters

## CSS cleanup

Eliminadas clases no usadas:

- `.statusSummary`
- `.statusSummaryHeader`
- `.statusSummaryLabel`
- `.statusSummaryHealth`
- `.statusSummaryDetail`
- `.statusSummarySignals`
- Selectores `[data-tone]` del summary

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | ✅ Exit code 0 |
| `npm run lint` | ⚠️ Exit code 1 — ESLint no configurado; `next lint` abre setup interactivo (Strict / Base / Cancel) |
| `npm run build` | ✅ Exit code 0 — Next.js 15.3.0, compilación y tipos OK |

## QA manual recomendado

1. Top section sin errores
2. No aparece card/barra "Estado del negocio"
3. Header: Panel del Negocio + Sesión activa · En vivo
4. Business y operational KPIs intactos
5. Insights intactos
6. Espacio vertical más compacto
7. Lanes/cards/modal/toolbar sin cambios

**Estado:** Pendiente de verificación en browser.

## Riesgos restantes

- `statusSummary` sigue calculándose en cada render (costo mínimo; útil para mobile/futuro)
- Si mobile reutiliza `DashboardOverview`, no verá summary hasta fase mobile dedicada

## Próxima fase recomendada

**Phase D4 — Token Alignment / Surface System** — polish de superficies KPI/insights sin cambiar estructura.
