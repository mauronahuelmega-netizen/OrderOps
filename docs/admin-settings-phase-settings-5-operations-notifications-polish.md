# Admin Settings — SETTINGS-5 Operations & Notifications Polish

## Objetivo

Ordenar **Operaciones** y **Notificaciones** dentro de Configuración: tab dedicada, cleanup de presencia pública, polish copy ES, guard de acceso y SSR inicial en operations — sin cambiar lógica de negocio.

## Contexto

SETTINGS-1–4 dejaron notificaciones mezcladas en presencia pública, operations con guard laxo y copy EN legacy. SETTINGS-5 cierra esa deuda de IA y UX.

## Archivos modificados

- `app/admin/(protected)/settings/operations/page.tsx`
- `app/admin/(protected)/settings/operations/operations-settings-client.tsx`
- `app/admin/(protected)/settings/public/page.tsx`
- `app/admin/(protected)/settings/page.tsx`
- `components/admin/settings/settings-navigation.tsx`
- `components/admin/notifications/notification-settings-card.tsx`
- `components/admin/notifications/push-device-settings.tsx`
- `docs/board-orders-execution-area-v1-final-handoff.md`

## Archivos creados

- `app/admin/(protected)/settings/notifications/page.tsx`
- `components/admin/notifications/notification-settings-card.module.css`
- `docs/admin-settings-phase-settings-5-operations-notifications-polish.md`

## Cambio principal aplicado

Tab **Notificaciones** (`/admin/settings/notifications`) como única fuente del módulo. Presencia pública y hub resumen enlazan vía `SettingsCard`. Operations con guard `manageNotifications`, SSR `business_settings` y copy ES.

## Notifications tab

- Ruta: `/admin/settings/notifications`
- Shell: `SettingsShell` + header premium
- Contenido: `NotificationSettingsCard` (misma lógica/actions)

## NotificationSettingsCard

- CSS module tokenizado (`notification-settings-card.module.css`)
- Copy ES corregido (Mostrar, Reproducir, tildes)
- `PushDeviceSettings` reutiliza estilos del module
- Sin cambios en actions, localStorage, service worker

## Public presence cleanup

- `/admin/settings/public`: removido `NotificationSettingsCard`; card link → Notificaciones
- `/admin/settings`: removido card inline; card link → Notificaciones

## Operations polish

- Labels: Bajo demanda, Programado, Cocina, Modo programado
- Descripción shell actualizada
- Copy permisos: "No tenés permisos…"
- Secciones sin cambio funcional de toggle/form

## SSR / double fetch audit

**FIXED (parcial):**

- `operations/page.tsx` SSR fetch `business_settings` → `initialSettings`
- Client usa `contextSettings ?? initialSettings` — evita loading shell duplicado en operations
- AdminShell sigue cargando settings globalmente (sin refactor); operations ya no depende solo del hook para primer render

## Guard audit

**FIXED:**

- Operations: `requireAdminContext` → `requireAdminPermission("manageNotifications")`
- Bloquea **viewer** por URL (sin `manageNotifications`)
- Owner/manager/operator conservan acceso; edición sigue gated por `canManagePublicSettings` en UI

## Copy ES / mojibake

- Operations: On-Demand/Scheduled/Kitchen → ES
- Notifications: Mostra→Mostrar, Reproduci→Reproducir, tildes
- Push device settings copy corregido
- Sin mojibake detectado

## Responsive notes

- SettingsNavigation incluye tab extra; scroll horizontal mobile preservado
- Notification card module responsive padding
- Sin overflow nuevo identificado en código

## Qué se preservó

- server actions existentes
- DB/schema
- RLS/policies
- admin auth
- role model
- operations business logic
- notification behavior
- dashboard/orders/products
- checkout público
- `/admin/team` route

## Qué NO se cambió

- no DB changes
- no RLS changes
- no migrations
- no new notification backend
- no service worker changes
- no store_sessions refactor
- no team migration
- no dashboard/product/checkout changes
- no cambios en `toggleBusinessStatus` semantics

## Deuda restante

| ID | Deuda | Fase |
|----|-------|------|
| D-1 | `toggleBusinessStatus` vs `store_sessions` desync | Futuro ops |
| D-2 | AdminShell global client fetch `business_settings` | Opcional perf |
| D-3 | Team migration `/admin/settings/team` | SETTINGS-6 |

## Validaciones ejecutadas

```txt
npm run build: pass
npx tsc --noEmit: pass
npm run lint: fail — ESLint circular config (flake conocido)
```

## QA manual recomendado

Notifications tab, public cleanup, operations save/toggle por rol, regression dashboard/products/checkout.

## Próxima fase recomendada

**SETTINGS-6 — Team migration**
