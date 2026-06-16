# Admin Dashboard Top Section Phase D5 — Business KPI Premium Polish

## Objetivo

Elevar la presentación visual de los 4 Business KPIs del top section desktop para que lean como panel operativo premium, no como grid técnico — sin cambiar datos, cálculos ni presenter.

## Contexto

Post-D4, el surface system y la estructura están correctos:

```txt
Header → Negocio → Business KPIs → Operación → Operational KPIs → Insights
```

D5 aplica polish editorial y tipográfico sobre la fila de negocio, con cambios mínimos en TSX (`data-section`, `data-kpi-id`).

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `components/admin/orders/DashboardOverview.module.css` | Polish business KPIs, section labels, revenue/topProduct, header sutil |
| `components/admin/orders/DashboardOverview.tsx` | `data-section={variant}`, `data-kpi-id={item.id}` en cards |

## Archivos creados

- `docs/admin-dashboard-top-section-phase-d5.md`

## Cambio principal aplicado

Refinamiento CSS-first de la fila Business: labels en sentence case, jerarquía editorial (label → value → detail), Ventas como protagonista por composición, tonos semánticos neutralizados en negocio.

## Business KPI polish aplicado

- Labels sin uppercase agresivo (`text-transform: none`, `--text-secondary`)
- Valores con tracking negativo y `tabular-nums`
- Details como contexto de soporte con `margin-top: auto`
- Icon containers neutrales (excepto acento sutil en Ventas)
- Tonos `data-tone` neutralizados en business (valores siempre `--text-primary`)
- Grid business con `align-items: stretch` para altura consistente

## Typography refinements

- Section titles: sentence case, `font-weight: 600`, `--text-secondary`
- Business labels: `0.8125rem`, peso 600, sin letter-spacing técnico
- Business values: `letter-spacing: -0.04em`, `line-height: 1.05`
- Revenue value: `clamp(1.9rem, 2.6vw, 2.35rem)`, `-0.045em` tracking
- Top product value: `1.5rem`, line-clamp 2 para nombres largos

## Section label refinements

Títulos `Negocio`, `Operación`, `Insights` ya venían en sentence case en TSX; se removió `text-transform: uppercase` del CSS para lectura más humana.

## Revenue KPI treatment

Selector `data-kpi-id="revenue"`:

- Borde acento 14% `--accent-primary` (no selected state)
- Value con escala responsive via `clamp`
- Detail ligeramente más grande (`0.875rem`)
- Icon container con acento sutil (8% bg, 16% border mix)

Se eliminó el borde genérico `[data-priority="primary"]` en favor de tratamiento explícito por ID.

## Top product treatment

Selector `data-kpi-id="topProduct"`:

- `-webkit-line-clamp: 2` + `overflow-wrap: anywhere`
- Detail `0.875rem` para unidades legibles

## Header refinements

- h1: `1.8125rem`, `letter-spacing: -0.02em`
- Divider más sutil (`color-mix` en border)
- Metadata: `0.8125rem`, `--text-tertiary`
- Live dot: mezcla suave con `--color-ready`

## Qué se preservó

- Presenter `buildDashboardTopSectionViewModel`
- View model y tipos
- Session scoping (`visibleOperationalOrders`)
- Business KPI IDs (`revenue`, `averageTicket`, `activeOrders`, `topProduct`)
- Operational KPIs (lógica y tonos semánticos intactos)
- Insights (sin cambios de polish profundo)
- Surface system D4 (aliases locales preservados)

## Qué NO se tocó

- `lib/orders/dashboard-top-section-view-model.ts`
- Cálculos y copy del presenter (ej. "Pendientes + preparación + listos")
- lanes · order cards · modal
- toolbar/search/filtros · store session controls
- realtime · server actions · DB/Supabase
- tokens globales
- mobile/tablet (`DashboardMobileOverview`)
- insight filters / click behavior
- Operational KPI polish profundo (D6)
- Insights polish profundo (D7)

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | ✅ Exit code 0 |
| `npm run lint` | ⚠️ Exit code 1 — ESLint no configurado; `next lint` abre setup interactivo |
| `npm run build` | ✅ Exit code 0 — Next.js 15.3.0, compilación y tipos OK |

## QA manual recomendado

1. Top section sin errores
2. Section titles leen `Negocio`, `Operación`, `Insights`
3. Business labels en sentence case, no técnicos
4. Ventas protagonista sin parecer selected
5. Más vendido legible con nombres largos
6. Operational cards e insights intactos
7. Header más refinado, sin pills nuevas
8. Dark/light theme OK
9. Lanes/cards/modal/toolbar sin cambios

**Estado:** Pendiente de verificación en browser.

## Riesgos restantes

- Copy técnico en detail de `activeOrders` ("Pendientes + preparación + listos") — posible D5.1/D6 copy refinement
- Operational labels siguen uppercase (intencional hasta D6)
- `order` CSS en business cards puede afectar lectura con screen readers (orden DOM sin cambiar)

## Próxima fase recomendada

**Phase D6 — Operational KPI Polish** — tonos operacionales, severidad, ritmo y jerarquía de la fila Operación.
