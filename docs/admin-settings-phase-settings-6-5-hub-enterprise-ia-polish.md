# Admin Settings — SETTINGS-6.5 Hub Enterprise IA Polish

## Objetivo

Convertir `/admin/settings` en un **Settings Index** enterprise agrupado, eliminando redundancia tabs + cards en el hub raíz.

## Contexto

SETTINGS-2–6 consolidaron rutas y navegación. El hub root duplicaba tabs horizontales y cards grandes apuntando a las mismas secciones.

## Problema detectado en QA

- Tabs redundantes con cards en el mismo hub
- Tabs cortadas en mobile/tablet
- Cards demasiado grandes y scroll innecesario
- Hub más cercano a dashboard que a settings center
- Necesidad de experiencia SaaS enterprise premium escaneable

## Archivos modificados

- `app/admin/(protected)/settings/page.tsx`
- `components/admin/settings/settings-shell.tsx`
- `docs/board-orders-execution-area-v1-final-handoff.md`

## Archivos creados

- `components/admin/settings/settings-hub-index.tsx`
- `components/admin/settings/settings-hub-index.module.css`
- `docs/admin-settings-phase-settings-6-5-hub-enterprise-ia-polish.md`

## Cambio principal aplicado

Hub root usa **`SettingsHubIndex`** agrupado. **`SettingsShell showNavigation={false}`** sólo en `/admin/settings`.

## Settings root sin tabs redundantes

Prop `showNavigation={false}` en hub. Subpáginas mantienen tabs (default `true`).

## Settings index agrupado

| Grupo | Items |
|-------|-------|
| Presencia pública | Landing, Catálogo (owner/manager) |
| Operación | Operaciones, Notificaciones |
| Administración | Equipo (owner) |

## Presencia pública

Visible si `canManagePublicSettings`. Links a landing y catálogo.

## Operación

Siempre visible (page requiere `manageNotifications`). Notificaciones con status simple desde profile context.

## Administración

Equipo si `canManageTeam`. Link `/admin/settings/team`.

## Responsive desktop/tablet/mobile

- Single column index, max-width 52rem
- Filas compactas clickeables con chevron
- Mobile: acción bajo título, sin overflow horizontal
- Sin tabs horizontales en root

## A11y

- Links `<Link>` por fila completa
- `aria-labelledby` por sección
- `focus-visible` con `--focus-ring`
- Sin botones anidados en links

## Light/dark notes

Tokens: `--bg-surface`, `--border-subtle`, `--text-*`, `--shadow-sm`, `--focus-ring`. Sin hardcoded colors.

## Qué se preservó

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

## Deuda restante

| ID | Deuda | Fase |
|----|-------|------|
| D-1 | Estados Landing/Catálogo/Equipo count | SETTINGS-8 |
| D-2 | Responsive QA final all settings | SETTINGS-7 |

## Validaciones ejecutadas

```txt
npm run build: pass
npx tsc --noEmit: pass
npm run lint: fail — ESLint circular config (flake conocido)
```

## QA manual recomendado

Desktop/tablet/mobile hub + subpáginas regression + app regression.

## Próxima fase recomendada

**SETTINGS-7 — Responsive QA & final handoff**
