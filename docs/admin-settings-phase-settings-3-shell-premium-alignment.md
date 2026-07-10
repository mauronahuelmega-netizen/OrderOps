# Admin Settings — SETTINGS-3 Shell Premium Alignment

## Objetivo

Alinear visualmente el área de **Configuración** al lenguaje premium de Dashboard/Products: layout operational, header, navegación con tokens, hub cards y responsive base — sin cambiar lógica funcional.

## Contexto

SETTINGS-2 creó hub `/admin/settings`, `SettingsNavigation` y consolidación IA. SETTINGS-3 aplica polish estructural reutilizando `AdminPageLayout size="operational"` y `AdminPageHeader variant="operational"` como en products.

## Archivos modificados

- `app/admin/(protected)/settings/page.tsx`
- `app/admin/(protected)/settings/public/page.tsx`
- `app/admin/(protected)/settings/public/landing/page.tsx`
- `app/admin/(protected)/settings/public/catalogo/page.tsx`
- `app/admin/(protected)/settings/operations/operations-settings-client.tsx`
- `app/admin/(protected)/team/page.tsx`
- `components/admin/settings/settings-navigation.tsx`
- `components/admin/settings/settings-navigation.module.css`
- `docs/board-orders-execution-area-v1-final-handoff.md`

## Archivos creados

- `components/admin/settings/settings-shell.tsx`
- `components/admin/settings/settings-shell.module.css`
- `components/admin/settings/settings-card.tsx`
- `components/admin/settings/settings-card.module.css`
- `components/admin/settings/settings-hub.module.css`
- `docs/admin-settings-phase-settings-3-shell-premium-alignment.md`

## Cambio principal aplicado

Nuevo **`SettingsShell`** envuelve todas las páginas de configuración con layout operational + header premium + `SettingsNavigation`. Hub usa **`SettingsCard`** en grid responsive con tokens existentes.

## Layout operational

- `AdminPageLayout size="operational"` — ancho full como dashboard/products.
- `SettingsShell` centraliza frame nav + content.
- Team deja `size="wide"` legacy → operational vía shell.

## Header premium

Patrón unificado:

| Ruta | Title | Description |
|------|-------|-------------|
| `/admin/settings` | Resumen | Ajustá la operación, la presencia pública y el equipo… |
| `/admin/settings/public` | Resumen | Presencia pública + avisos operativos |
| `/admin/settings/public/landing` | Landing pública | Portada, identidad y presentación pública |
| `/admin/settings/public/catalogo` | Catálogo público | Cómo se muestra la carta en el canal público |
| `/admin/settings/operations` | Operaciones | Reglas operativas, modalidad y avisos de trabajo |
| `/admin/team` | Equipo | Personas y permisos del panel |

Eyebrow: **Configuración** en todas.

## SettingsNavigation premium

- CSS module con tokens (`--border-subtle`, `--bg-surface`, `--text-primary`, `--focus-ring`).
- Sin dependencia de clases legacy hardcoded en `public-settings.css`.
- Horizontal scroll mobile; wrap desktop.
- `aria-current="page"` preservado.
- Equipo → `/admin/team` provisional.

## Settings hub polish

- Grid `repeat(auto-fit, minmax(280px, 1fr))`.
- Cards: Presencia pública, Catálogo público, Operación, Equipo.
- `NotificationSettingsCard` arriba del grid (sin cambiar lógica).
- Hover/focus en cards y acciones.

## Páginas existentes integradas

Todas usan `SettingsShell`. Formularios internos (`PublicSettingsForm`, operations sections, team forms) sin cambios.

## Equipo provisional preservado

- Ruta `/admin/team` intacta.
- Tab Equipo en nav.
- Sidebar marca Configuración activo (SETTINGS-2, sin cambio).

## Responsive base

- Nav: scroll horizontal suave en mobile, wrap en tablet+.
- Hub grid: auto-fit columns.
- Operational layout hereda breakpoints admin-shell.

## Light/dark notes

Navigation y cards usan tokens theme-aware (`--bg-surface`, `--text-primary`, etc.). No se agregaron colores hex nuevos. `public-settings.css` legacy sigue para formularios preview (SETTINGS-4).

## Qué se preservó

- `/admin/team` route
- Equipo como link provisional
- team actions
- settings actions
- admin auth
- permissions
- dashboard/orders/products
- checkout público
- DB/RLS/Supabase

## Qué NO se cambió

- No `/admin/settings/team` migration
- No redirect `/admin/team`
- No server actions changes
- No DB/schema changes
- No RLS changes
- No deep module polish (forms, operations copy EN, notification internals)
- No notification logic changes
- No operations logic changes
- No tokenización completa `public-settings.css`

## Deuda restante

| ID | Deuda | Fase |
|----|-------|------|
| D-1 | Formularios landing/catalog legacy CSS | SETTINGS-4 |
| D-2 | Tab notifications dedicada | SETTINGS-5 |
| D-3 | Operations guard viewer | SETTINGS-5 |
| D-4 | Team route migration | SETTINGS-6 |
| D-5 | Copy profundo formularios | SETTINGS-4/5 |

## Validaciones ejecutadas

```txt
npm run build: pass
npx tsc --noEmit: pass
npm run lint: fail — ESLint circular config (flake conocido)
```

## QA manual recomendado

Desktop/tablet/mobile según prompt SETTINGS-3 §19. Verificar hub, tabs, team provisional, regression dashboard/products.

## Próxima fase recomendada

**SETTINGS-4 — Public presence polish** (tokenizar forms/preview CSS, landing/catalogo visual).
