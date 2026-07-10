# Admin Settings — SETTINGS-2 IA & Team Consolidation

## Objetivo

Primera capa de arquitectura de información para **Configuración**: hub raíz, navegación interna unificada, Equipo integrado conceptualmente sin migrar ruta ni lógica.

## Contexto

SETTINGS-1 identificó Equipo como entrada sidebar separada, ausencia de `/admin/settings`, y copy inconsistente. SETTINGS-2 implementa la estructura vendible mínima sin polish premium ni cambios de datos.

## Archivos modificados

- `components/admin/admin-nav-config.ts`
- `components/admin/layout/admin-nav-list.tsx`
- `app/admin/(protected)/settings/public/page.tsx`
- `app/admin/(protected)/settings/public/landing/page.tsx`
- `app/admin/(protected)/settings/public/catalogo/page.tsx`
- `app/admin/(protected)/settings/operations/page.tsx`
- `app/admin/(protected)/settings/operations/operations-settings-client.tsx`
- `app/admin/(protected)/team/page.tsx`
- `components/admin/settings/public-settings-nav.tsx` (wrapper deprecated)
- `docs/board-orders-execution-area-v1-final-handoff.md`

## Archivos creados

- `app/admin/(protected)/settings/page.tsx`
- `components/admin/settings/settings-navigation.tsx`
- `components/admin/settings/settings-navigation.module.css`
- `docs/admin-settings-phase-settings-2-ia-team-consolidation.md`

## Cambio principal aplicado

Configuración es ahora el hub central del admin secundario. Equipo deja el sidebar principal y aparece como tab interno apuntando provisionalmente a `/admin/team`.

## Sidebar principal

**Antes:** Pedidos, Productos, Equipo, Configuracion → `/admin/settings/public`

**Después:** Pedidos, Productos, **Configuración** → `/admin/settings`

- Equipo removido del sidebar.
- Label corregido: `Configuración` (con tilde).
- Icono Settings mapeado a `/admin/settings`.

## Settings hub

`/admin/settings` — hub/resumen con:

- Header: eyebrow Configuración, título Resumen.
- `SettingsNavigation` con tabs filtradas por permiso.
- Cards: Presencia pública, Catálogo público, Operación, Equipo (owner).
- `NotificationSettingsCard` (sin cambiar lógica).

`/admin/settings/public` se conserva como subruta legacy (notificaciones + overview anterior).

## Settings navigation

Componente compartido `SettingsNavigation`:

| Tab | Ruta | Visible si |
|-----|------|------------|
| Resumen | `/admin/settings` | siempre (manageNotifications) |
| Landing | `/admin/settings/public/landing` | `canManagePublicSettings` |
| Catálogo | `/admin/settings/public/catalogo` | `canManagePublicSettings` |
| Operaciones | `/admin/settings/operations` | siempre |
| Equipo | `/admin/team` | `canManageTeam` (owner) |

- Active state vía `usePathname` + `aria-current="page"`.
- Reutiliza clases `admin-context-nav` de `public-settings.css`.

Integrado en: hub, public, landing, catalogo, operations, team.

## Equipo como link provisional

- Tab **Equipo** → `/admin/team` (sin crear `/admin/settings/team`).
- `/admin/team` incluye `SettingsNavigation` y eyebrow **Configuración**.
- Ruta, actions y permisos `manageTeam` sin cambios.

## Active route logic

`admin-nav-config.ts` — item Configuración:

```txt
matchPrefixes: ["/admin/settings", "/admin/team"]
href: /admin/settings
```

Marca activo en sidebar y mobile drawer para todas las rutas settings + `/admin/team`.

## Permisos preservados

| Permiso | Comportamiento |
|---------|----------------|
| `manageNotifications` | Nav Configuración + acceso settings |
| `managePublicSettings` | Tabs Landing/Catálogo |
| `manageTeam` | Tab Equipo + `/admin/team` |
| `requireAdminContext` operations | Sin cambio (deuda SETTINGS-5) |

No se ampliaron permisos a manager/operator/viewer.

## Qué se preservó

- `/admin/team` route
- team actions
- settings actions
- admin auth
- role permissions
- dashboard/orders/products
- checkout público
- DB/RLS/Supabase

## Qué NO se cambió

- No route migration to `/admin/settings/team`
- No redirect `/admin/team`
- No server actions changes
- No DB/schema changes
- No visual premium redesign
- No notifications logic changes
- No operations logic changes
- No tokenización `public-settings.css`

## Deuda restante

| ID | Deuda | Fase |
|----|-------|------|
| D-1 | Operations `requireAdminContext` laxo (viewer URL) | SETTINGS-5 |
| D-2 | `public-settings.css` hardcoded colors | SETTINGS-4 |
| D-3 | Tab `/admin/settings/notifications` | SETTINGS-5 |
| D-4 | Migración `/admin/settings/team` + redirect | SETTINGS-6 |
| D-5 | Shell operational premium | SETTINGS-3 |
| D-6 | `/admin/settings/public` legacy duplicate overview | SETTINGS-3/5 |

## Validaciones ejecutadas

```txt
npm run build: pass
npx tsc --noEmit: pass
npm run lint: fail — ESLint 9.39.4 circular config (flake conocido entorno)
```

Next.js middleware→proxy warning: deuda conocida, no corregida.

## QA manual recomendado

### Sidebar desktop

1. `/admin/dashboard` → sidebar: Pedidos, Productos, Configuración (sin Equipo).
2. Click Configuración → `/admin/settings`.
3. Active state en Configuración.

### Settings hub

1. Tabs visibles según rol.
2. Links Resumen/Landing/Catálogo/Operaciones/Equipo funcionan.

### Equipo provisional

1. Tab Equipo → `/admin/team`.
2. Sidebar sigue marcando Configuración activo.
3. SettingsNavigation visible en team page.

### Rutas legacy

- `/admin/settings/public`, landing, catalogo, operations cargan.

### Mobile drawer

- Mismos items principales; Equipo no aparece como principal.

## Próxima fase recomendada

**SETTINGS-3 — Settings shell premium alignment** (layout operational, header variant, consolidar overview legacy).
