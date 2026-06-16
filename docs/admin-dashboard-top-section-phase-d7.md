# Admin Dashboard Top Section Phase D7 — Insights Polish

## Objetivo

Convertir la fila de insights del top section en una capa secundaria clara, legible y premium — señales útiles de la sesión sin competir con KPIs ni parecer botones clickeables.

## Contexto

Post-D6, Business y Operational KPIs tienen polish completo. D7 enfoca mini-cards de insights: tono sutil, copy humano, layout equilibrado y `futureActionKey` preservado sin click behavior.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `components/admin/orders/DashboardOverview.module.css` | Insights polish: dot tone, layout por count, prioridad visual, typography |
| `components/admin/orders/DashboardOverview.tsx` | Título `Señales de la sesión`, `data-insight-id`, `data-insight-count` |
| `lib/orders/dashboard-top-section-view-model.ts` | Microcopy: pluralización correcta en details de insights |

## Archivos creados

- `docs/admin-dashboard-top-section-phase-d7.md`

## Cambio principal aplicado

Insights como mini-superficies compactas y secundarias, con indicador de tono por dot (no título coloreado), grid adaptado al número de cards, y copy sin `pedido(s)`.

## Insights polish aplicado

- Section title: **Señales de la sesión** (más contextual que "Insights")
- Cards: background muted, border suave, sin shadow, `cursor: default`
- Titles: `--text-primary`, weight 600 (no colores semánticos fuertes)
- Dot `::before` por `data-tone` (success/warning/danger/info)
- Padding con espacio para dot lateral

## Microcopy refinements

Helpers locales en presenter (sin cambiar lógica/IDs/priorities):

| Antes | Después |
|-------|---------|
| `5 pedido(s) necesitan revisión` | `5 pedidos necesitan revisión` |
| `1 pedido(s) necesitan revisión` | `1 pedido necesita revisión` |
| `2 pedido(s) esperan salida` | `2 pedidos esperan salida` |
| `1 pedido(s) esperan salida` | `1 pedido espera salida` |

Funciones: `formatNeedsReviewDetail`, `formatReadyWaitingInsightDetail`.

## Tone system aplicado

- Tonos como micro-acento en dot, no en fondo ni título completo
- `stalled-orders` / `ready-waiting`: borde con mix warning sutil
- `delivery-dominance` / `pickup-dominance` / `recent-peak`: borde más neutro
- `positive-operations`: borde con mix success calmado

## Layout refinements

Grid con `data-insight-count`:

| Count | Columns |
|-------|---------|
| 1 | `minmax(0, 22rem)` — no ocupa todo el ancho |
| 2 | 2 columnas |
| 3 | 3 columnas |
| 4 | 4 columnas (default) |

Breakpoint ≤1200px: 2 columnas (heredado).

## Future action readiness

- `data-action-key={insight.futureActionKey ?? undefined}` preservado
- Sin `onClick`, sin `<button>`, sin cursor pointer, sin chevron/hover

## Qué se preservó

- Presenter shape (`buildTopSectionInsights` condiciones intactas)
- Insight IDs (`stalled-orders`, `ready-waiting`, etc.)
- Insight priority y sorting
- `futureActionKey` values
- Session scoping
- Business KPIs (D5)
- Operational KPIs (D6)
- Surface system D4

## Qué NO se tocó

- Cálculos y thresholds
- lanes · order cards · modal
- toolbar/search/filtros · store session controls
- realtime · server actions · DB/Supabase
- tokens globales
- mobile/tablet
- insight filters clickables

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | ✅ Exit code 0 |
| `npm run lint` | ⚠️ Exit code 1 — ESLint no configurado; `next lint` abre setup interactivo |
| `npm run build` | ✅ Exit code 0 — Next.js 15.3.0, compilación y tipos OK |

## QA manual recomendado

1. Business/Operational KPIs intactos
2. Sección titulada "Señales de la sesión"
3. Insights no parecen KPIs ni botones
4. Sin `pedido(s)` en copy
5. Dots de tono sutiles, títulos legibles
6. 1/2/3/4 insights con layout equilibrado
7. Sin Status Summary, Completados, Solo vos, queue pressure
8. Lanes/toolbar sin cambios
9. Dark/light theme OK

**Estado:** Pendiente de verificación en browser.

## Riesgos restantes

- Grid `data-insight-count` puede interactuar con breakpoint 1200px en layouts intermedios
- Copy de operational KPI `En ready` sigue en presenter (fuera de scope D7)

## Próxima fase recomendada

**Phase D8 — Top Section Spacing & Integration** — gap hacia "Pedidos en curso", densidad above-the-fold, alineación con execution section.
