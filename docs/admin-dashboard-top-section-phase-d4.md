# Admin Dashboard Top Section Phase D4 — Token Alignment / Surface System

## Objetivo

Alinear el top section desktop de `/admin/dashboard` con el surface system y tokens existentes, elevando la calidad visual sin cambiar estructura, datos ni contenido.

## Contexto

Post-D3/D3.1, el top section tiene la arquitectura correcta:

```txt
Header → Business KPI grid → Operational KPI grid → Insights row
```

D4 es polish CSS-first sobre `DashboardOverview.module.css`. El presenter y el view model permanecen intactos.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `components/admin/orders/DashboardOverview.module.css` | Surface aliases locales, KPI/insight surfaces tokenizadas, spacing, tipografía y tonos semánticos suavizados |

## Archivos creados

- `docs/admin-dashboard-top-section-phase-d4.md`

## Cambio principal aplicado

Refactor visual CSS-only del top section para usar el surface system del proyecto en lugar de valores sueltos (radios px, shadow rgba, gaps rem).

## Surface system aplicado

Aliases locales en `.root`:

| Alias | Token fuente |
|-------|--------------|
| `--dashboard-top-surface` | `--surface-elevated-bg` → `--bg-surface` |
| `--dashboard-top-surface-muted` | `--surface-muted-bg` → `--bg-surface-soft` |
| `--dashboard-top-border` | `--surface-elevated-border` → `--border-subtle` |
| `--dashboard-top-shadow` | `--shadow-sm` |
| `--dashboard-top-card-radius` | `--radius-lg` |
| `--dashboard-top-section-gap` | `--space-md` |
| `--dashboard-top-grid-gap` | `--space-lg` |

## Tokens reutilizados

- `--surface-elevated-*`, `--surface-muted-*`
- `--bg-surface`, `--bg-surface-soft`
- `--border-subtle`
- `--text-primary`, `--text-secondary`, `--text-tertiary`
- `--text-ready-strong`, `--text-pending-strong`, `--text-cancelled-strong`, `--text-delivery-strong`
- `--color-ready`, `--color-pending`, `--color-cancelled`, `--color-delivery`
- `--accent-primary` (solo mezcla sutil en KPI primary)
- `--radius-md`, `--radius-lg`, `--radius-full`
- `--space-xs`, `--space-sm`, `--space-md`, `--space-lg`
- `--shadow-sm`

## Hardcodes eliminados

| Antes | Después |
|-------|---------|
| `box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05)` en `.kpiCard` | `var(--dashboard-top-shadow)` → `--shadow-sm` |
| `border-radius: 16px` en `.kpiCard` | `var(--radius-lg)` |
| `border-radius: 10px` en `.iconWrapper` | `var(--radius-md)` |
| `border-radius: 12px` en `.insightCard` | `var(--radius-lg)` |
| `padding: 1.25rem` / `0.875rem 1rem` sueltos | `var(--space-lg)` / `var(--space-md)` |
| Gaps `0.75rem`, `1rem`, `1.25rem` sueltos | `--space-*` tokens |
| Primary border `color-delivery` 30% | `accent-primary` 18% mezclado con border surface |

## Ajustes en KPI cards

- Background, border, radius y shadow desde surface aliases
- Padding `var(--space-lg)`
- Icon containers con `--surface-muted-bg/border`, color `--text-secondary`
- Primary KPI (Ventas): borde acento sutil (18% accent), no outline azul dominante

## Ajustes en operational tones

- Color semántico solo en `.kpiValue` (success/warning/danger/info)
- Cards mantienen superficie neutra elevada; sin fondos de alerta

## Ajustes en insights

- Mini-cards con `--dashboard-top-surface-muted`
- Border y radius tokenizados
- Padding más cómodo (`--space-md` / `--space-lg`)
- Título `0.875rem`, detail `0.8125rem` (más legible)
- Tonos semánticos solo en `.insightTitle`
- Sin hover, cursor pointer ni sombras pesadas

## Ajustes de spacing / grid

- Root gap: `var(--space-lg)` (compacto, no apretado)
- Section labels → grid: `var(--space-md)`
- KPI grid gap: `var(--space-lg)`
- Insights strip gap: `var(--space-md)`
- Header padding/gap tokenizados

## Qué se preservó

- Presenter `buildDashboardTopSectionViewModel`
- View model y tipos
- Session scoping (`visibleOperationalOrders`)
- Business KPIs (4)
- Operational KPIs (4)
- Insights (1–4)
- Header structure (sin status summary, sin queue pressure, sin “Solo vos”)
- TSX estructural sin cambios

## Qué NO se tocó

- `lib/orders/dashboard-top-section-view-model.ts`
- `components/admin/orders/admin-dashboard-orders.tsx`
- `app/theme-tokens.css`, `app/globals.css`, `components/admin/admin-surfaces.css`
- lanes · order cards · modal
- toolbar/search/filtros · store session controls
- realtime · server actions · DB/Supabase
- tokens globales
- mobile/tablet (`DashboardMobileOverview`)
- insight filters / click behavior

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | ✅ Exit code 0 (tras `npm run build`; falla previo por `.next/types` ausentes en entorno limpio) |
| `npm run lint` | ⚠️ Exit code 1 — ESLint no configurado; `next lint` abre setup interactivo |
| `npm run build` | ✅ Exit code 0 — Next.js 15.3.0, compilación y tipos OK |

## QA manual recomendado

1. Top section sin errores
2. Header: Panel del Negocio + Sesión activa · En vivo
3. Sin Status Summary
4. Business/operational KPIs e insights intactos
5. Cards más coherentes, familia visual unificada
6. Ventas no parece seleccionada por borde excesivo
7. Tonos operacionales legibles pero no ruidosos
8. Insights como mini-cards integradas
9. Espaciado compacto sin empujar “Pedidos en curso”
10. Dark/light theme legible
11. Lanes/cards/modal/toolbar sin cambios

**Estado:** Pendiente de verificación en browser.

## Riesgos restantes

- Título h1 sigue en `1.75rem` (sin token de page-title dedicado — deuda documentada en token audit)
- Labels KPI/section siguen uppercase vía CSS (reducido ruido, no sentence case)
- `--shadow-sm` puede variar perceptualmente vs shadow anterior en light; validar en QA

## Próxima fase recomendada

**Phase D5 — Typography & Label Refinement** — sentence case opcional, escala tipográfica tokenizada para page title y captions, sin tocar presenter.
