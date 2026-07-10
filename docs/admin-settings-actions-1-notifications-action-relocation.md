# SETTINGS-ACTIONS-1 — Notifications Action Relocation

## Objetivo

Reubicar `updateNotificationPreferencesAction` desde `settings/public/actions.ts` hacia un módulo
semánticamente correcto de Notificaciones, sin cambiar contrato, autosave, UX ni lógica de negocio.

## Contexto

Tras SETTINGS-TEAM-1, SETTINGS-NOTIF-1, SETTINGS-VALIDATION-1 y SETTINGS-CLEANUP-1, la action de
preferencias de notificaciones seguía definida en el archivo de acciones de Presencia pública — deuda
documentada en `docs/admin-settings-notifications-team-alignment-audit.md`.

## Alcance

- Crear `app/admin/(protected)/settings/notifications/actions.ts`
- Mover implementación de `updateNotificationPreferencesAction`
- Actualizar import en `notification-settings-card.tsx`
- Limpiar `public/actions.ts` (sin lógica duplicada)
- Validar tsc/build/lint + browser smoke
- **Fuera de scope:** push actions, DB, RLS, auth, CSS, UI, Team, Operations

## Auditoría de imports

Comandos: `rg "updateNotificationPreferencesAction"`, `rg "settings/public/actions"` en app/components/lib.

| Referencia | Ubicación | Rol |
|------------|-----------|-----|
| **Definición (antes)** | `app/admin/(protected)/settings/public/actions.ts` | Implementación completa |
| **Único consumidor TSX** | `components/admin/notifications/notification-settings-card.tsx` | Autosave por toggle |
| **Push (sin cambios)** | `components/admin/notifications/use-push-subscription.ts` | Importa `savePushSubscriptionAction`, `revokePushSubscriptionAction` desde `public/actions.ts` |
| **Presencia pública** | `public-settings-form.tsx`, `public-catalog-settings-form.tsx` | `updatePublicBusinessSettingsAction`, `updateCatalogHeroSettingsAction` |
| **Docs históricos** | Varios `docs/admin-settings-*.md` | Mencionan ubicación vieja (no bloquean build) |

**Exports activos en `public/actions.ts` (conservados):**

- `updatePublicBusinessSettingsAction`
- `updateCatalogHeroSettingsAction`
- `savePushSubscriptionAction`
- `revokePushSubscriptionAction`

**Imports de `public/actions.ts` que no son Presencia pública:**

- `use-push-subscription.ts` — push subscription actions (fuera de scope ACTIONS-1)

No hay tests unitarios que importen `updateNotificationPreferencesAction` desde la ruta vieja.

## Estrategia aplicada

1. Crear `app/admin/(protected)/settings/notifications/actions.ts` con `"use server"` y copiar la
   implementación exacta de `updateNotificationPreferencesAction`.
2. Actualizar `notification-settings-card.tsx` para importar desde la nueva ruta.
3. Remover implementación de `public/actions.ts`.

### Re-export deprecated — descartado

Se intentó un re-export de compatibilidad:

```ts
export { updateNotificationPreferencesAction } from "../notifications/actions";
```

**Resultado:** `npm run build` falló — Next.js/Turbopack reporta que el módulo `"use server"`
`public/actions.ts` "has no exports at all" cuando mezcla `export { ... } from` con
`export async function` en el mismo archivo.

**Decisión:** eliminar el re-export. Auditoría confirmó 0 consumidores activos fuera de
`notification-settings-card.tsx` (ya actualizado). No hay lógica duplicada.

## Archivos modificados

- `app/admin/(protected)/settings/public/actions.ts` — removida implementación de notificaciones;
  conservadas actions de Presencia pública y push
- `components/admin/notifications/notification-settings-card.tsx` — import actualizado a
  `settings/notifications/actions`

## Archivos creados

- `app/admin/(protected)/settings/notifications/actions.ts` — nueva ubicación de
  `updateNotificationPreferencesAction`
- `docs/admin-settings-actions-1-notifications-action-relocation.md` — este documento

## Compatibilidad / re-exports

- **Sin re-export deprecated** en `public/actions.ts` (incompatible con bundler de server actions).
- Consumidores deben importar desde `@/app/admin/(protected)/settings/notifications/actions`.

## Contrato preservado

| Aspecto | Estado |
|---------|--------|
| Nombre exportado | `updateNotificationPreferencesAction` |
| Firma | `(input: NotificationPreferencesActionInput) => Promise<...>` |
| Input patch parcial | `newOrderBrowserNotificationsEnabled`, `newOrderSoundEnabled`, `newOrderToastEnabled`, `newOrderHighlightEnabled` |
| Permiso | `canManageNotifications` |
| Service client | `createSupabaseServiceClient` → `profiles.notification_preferences` |
| `revalidatePath` | `/admin/settings/public`, `/admin/dashboard` (sin cambio) |
| `logActionFailure` key | `settings.public.updateNotificationPreferences` (sin cambio) |
| Mensaje éxito | `"Preferencias de notificaciones actualizadas."` |
| Autosave | `startTransition` + `persistPreferences` en card — sin cambios |

## Validaciones

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | **PASS** |
| `npm run build` | **PASS** (tras remover re-export incompatible) |
| `npm run lint` | **FAIL** — flake conocido ESLint 9: `Converting circular structure to JSON` |

## Browser smoke

| Ruta | Resultado |
|------|-----------|
| `/admin/settings/notifications` | PASS — toggles visibles; autosave Sonido OFF→ON; mensaje "Preferencias de notificaciones actualizadas." |
| `/admin/settings/public` | PASS — overview carga |
| `/admin/settings/public/landing` | PASS — formulario + botón guardar visible |
| `/admin/settings/public/catalogo` | PASS (navegación OK; landing verificada en misma sesión) |
| `/admin/settings` | PASS — hub cards y links correctos |

Sin `useActionState` warnings, hydration mismatch ni module not found.

## Qué se preservó

- Contrato y comportamiento de `updateNotificationPreferencesAction`
- Autosave por toggle en Notificaciones
- Actions de Presencia pública en `public/actions.ts`
- Push subscription actions en `public/actions.ts`
- DB, RLS, auth, permisos, roles, service worker, manifest, middleware
- CSS y UI de Notificaciones, Team, Operations, Public Presence

## Qué NO se tocó

- `savePushSubscriptionAction` / `revokePushSubscriptionAction` (siguen en `public/actions.ts`)
- Lógica push, hooks de permiso del navegador
- Componentes UI, CSS modules
- Team, Operations, Products, Orders
- `components/public/**`
- Migraciones, RLS, auth

## Riesgos

- **Bajo:** único consumidor actualizado; build verificado.
- **Re-export en `"use server"`:** no soportado por el bundler actual — documentado para evitar regresión.
- **`revalidatePath("/admin/settings/public")`** en action de notificaciones: deuda preexistente (ruta
  histórica); no alterada en esta fase.

## Deuda restante

- Mover `savePushSubscriptionAction` / `revokePushSubscriptionAction` a `notifications/actions.ts`
  (SETTINGS-ACTIONS-2 o equivalente)
- Considerar `revalidatePath("/admin/settings/notifications")` en la action (cambio de comportamiento —
  fase aparte)
- ESLint 9 circular config flake (DEVX)
- Docs históricos aún citan ubicación vieja en `public/actions.ts` (cosmético)

## Próxima fase recomendada

**SETTINGS-ACTIONS-2** — reubicar push subscription actions (`savePushSubscriptionAction`,
`revokePushSubscriptionAction`) desde `public/actions.ts` a `notifications/actions.ts`, aplicando la
misma restricción: sin re-export `export { ... } from` en archivos `"use server"` mixtos.
