# Admin Settings — SETTINGS-6.7 Hub Light Mode & Density Final Polish

## Objetivo

Micro-polish visual final del hub `/admin/settings`: contraste en light mode, acciones visibles, densidad mobile, jerarquía tipográfica y spacing tablet, sin cambiar arquitectura.

## Contexto

SETTINGS-6.5–6.6 resolvieron IA, grid 3/2/1, filas clickeables y ancho desktop. QA visual detectó paleta demasiado plana, acciones débiles y mobile aún alto.

## Problema detectado en QA

- Light mode demasiado pálido
- Acciones poco visibles (`Editar` / `Configurar` / `Administrar`)
- Mobile todavía sobredimensionado
- Headings de grupo compiten con items
- Tablet necesita spacing fino

## Archivos modificados

- `components/admin/settings/settings-hub-index.tsx`
- `components/admin/settings/settings-hub-index.module.css`
- `components/admin/settings/settings-shell.module.css`
- `docs/board-orders-execution-area-v1-final-handoff.md`

## Archivos creados

- `docs/admin-settings-phase-settings-6-7-hub-light-density-final-polish.md`

## Cambio principal aplicado

Refinamiento CSS local del índice: cards con `--surface-elevated-*`, bordes `color-mix`, sombra sutil; acciones con `font-weight: 600` y `--accent-primary` en hover; mobile más compacto; group titles más pequeños/muted; item titles más fuertes.

## Light mode card contrast

- Background: `--surface-elevated-bg`
- Border: `--surface-elevated-border` con fallback `color-mix`
- Shadow: `--shadow-sm` + capa sutil derivada de `--text-primary`
- Mobile: borde reforzado sin sombra pesada

## Actions / chevrons

- Color base `--text-secondary`, weight 600
- Hover/active → `--accent-primary`
- Chevron 17px desktop, strokeWidth 2
- Mobile: sólo chevron visible (label en sr-only + `aria-label`)

## Hover / focus states

- Hover fila: mezcla `--bg-surface-soft` + `--accent-soft`
- Focus: `--focus-ring` + borde accent sutil
- Active: `--surface-interactive-press-bg`
- `cursor: pointer` en items

## Mobile density

- Gap index 6px, padding sección reducido
- Títulos 0.875rem, descripciones 0.6875rem
- Items padding 6px vertical
- Sin box-shadow en cards mobile

## Heading hierarchy

- Group title: 0.6875rem, weight 500, `--text-muted`
- Group description: más pequeña y muted
- Item title: `--text-primary`, weight 600, body size
- Eliminado bump de group title a body size en desktop

## Tablet spacing

- Breakpoint 640–1023: gap `space-md`, padding sección `space-md`
- Grid 2 columnas mantenido

## Footer polish

- `padding-bottom` en `.index` para separación respecto al footer global
- Shell content gap ajustado (`space-md` mobile, `space-lg` tablet+)
- Footer global no modificado (evita regresiones en otras páginas)

## Dark mode regression notes

- Tokens `--surface-elevated-*`, `--accent-soft`, `--accent-primary` tienen variantes dark en theme
- Sin colores hardcoded; `color-mix` relativo a tokens
- Sombras usan opacidad baja compatible con ambos modos

## Qué se preservó

- arquitectura del hub
- rutas settings existentes
- `/admin/settings/team`
- `/admin/team` redirect
- SettingsNavigation en subpáginas
- server actions
- DB/schema
- RLS/policies
- permissions
- dashboard/orders/products
- checkout público

## Qué NO se cambió

- no server action changes
- no DB changes
- no RLS changes
- no route changes
- no team logic changes
- no notification logic changes
- no operations logic changes
- no public presence logic changes
- no new data fetches

## Deuda restante

- ESLint circular config flake
- Next.js Proxy (Middleware) warning
- Estados hub opcionales (SETTINGS-8)
- SETTINGS-7 — Responsive QA & final handoff

## Validaciones ejecutadas

- `npm run build`: pass
- `npx tsc --noEmit`: pass
- `npm run lint`: fail — flake conocido ESLint (`Converting circular structure to JSON` en config validator)

## QA manual recomendado

Light desktop/tablet/mobile, dark regression, subpáginas SettingsNavigation, app regression (dashboard, products, team redirect, checkout).

## Próxima fase recomendada

**SETTINGS-7 — Responsive QA & final handoff**
