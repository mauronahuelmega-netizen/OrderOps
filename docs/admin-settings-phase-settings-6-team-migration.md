# Admin Settings — SETTINGS-6 Team Migration

## Objetivo

Migrar **Equipo** de `/admin/team` a `/admin/settings/team` como ruta canónica dentro de Configuración, con redirect seguro desde la ruta legacy.

## Contexto

SETTINGS-2–5 consolidaron Configuración con tab Equipo provisional → `/admin/team`. SETTINGS-6 completa la migración técnica sin cambiar lógica de equipo.

## Archivos modificados

- `app/admin/(protected)/team/page.tsx` → redirect
- `app/admin/(protected)/team/actions.ts` (revalidatePath)
- `app/admin/(protected)/settings/page.tsx` (link hub)
- `components/admin/settings/settings-navigation.tsx`
- `docs/board-orders-execution-area-v1-final-handoff.md`

## Archivos creados

- `app/admin/(protected)/settings/team/page.tsx`
- `components/admin/team/admin-team-settings-view.tsx`
- `docs/admin-settings-phase-settings-6-team-migration.md`

## Cambio principal aplicado

Vista de Equipo extraída a `AdminTeamSettingsView` compartida. Ruta canónica `/admin/settings/team`. Legacy `/admin/team` → `redirect("/admin/settings/team")`.

## Nueva ruta /admin/settings/team

- Server component reutiliza `AdminTeamSettingsView`
- `SettingsShell` + `SettingsNavigation` (tab Equipo)
- Guard: `requireAdminPermission("manageTeam")` (owner)
- Misma UI: create form + member list + role forms

## Redirect /admin/team

```tsx
redirect("/admin/settings/team");
```

Redirect framework-level Next.js App Router (307 temporal por defecto). Sin middleware.

## SettingsNavigation

| Tab | Ruta |
|-----|------|
| Equipo | `/admin/settings/team` |

Active key: `/admin/settings/team` y legacy `/admin/team` (durante redirect).

## Sidebar/mobile drawer active route

`admin-nav-config.ts` — `matchPrefixes: ["/admin/settings", "/admin/team"]` preservado.

- `/admin/settings/team` → activo vía prefix `/admin/settings`
- `/admin/team` → activo durante redirect

## Permisos preservados

| Permiso | Comportamiento |
|---------|----------------|
| `manageTeam` | Page guard en vista (owner only) |
| Actions | `requireAdminPermission("manageTeam")` sin cambio |

Manager/operator/viewer: sin acceso (igual que antes).

## Server actions preservadas

- `createTeamMemberAction` — sin cambio de lógica
- `updateTeamMemberRoleAction` — sin cambio de lógica
- Ubicación: `app/admin/(protected)/team/actions.ts` (sin mover)

## Revalidation notes

Ambas acciones ahora revalidan:

```ts
revalidatePath("/admin/settings/team");
revalidatePath("/admin/team");
```

Compatibilidad durante bookmarks legacy y redirect.

## Links actualizados

- `settings/page.tsx` hub card Equipo → `/admin/settings/team`
- `settings-navigation.tsx` tab Equipo → `/admin/settings/team`

## Qué se preservó

- team actions
- team permissions
- admin auth
- role model
- DB/schema
- RLS/policies
- dashboard/orders/products
- checkout público
- operations/notifications

## Qué NO se cambió

- no DB changes
- no RLS changes
- no migrations
- no role model changes
- no team feature changes
- no team performance refactor
- no dashboard/product/checkout changes

## Deuda restante

| ID | Deuda | Fase |
|----|-------|------|
| D-1 | `listUsers({ perPage: 1000 })` performance | SETTINGS-6.1 / TEAM-1 |
| D-2 | Responsive QA final settings | SETTINGS-7 |

## Validaciones ejecutadas

```txt
npm run build: pass
npx tsc --noEmit: pass
npm run lint: fail — ESLint circular config (flake conocido)
```

## QA manual recomendado

Ruta nueva, redirect legacy, permisos owner vs no-owner, acciones team, navegación desde hub/mobile.

## Próxima fase recomendada

**SETTINGS-7 — Responsive QA & final handoff**
