# SETTINGS-ACTIONS-2 — Push Subscription Action Relocation

## Objetivo

Reubicar `savePushSubscriptionAction` y `revokePushSubscriptionAction` desde
`settings/public/actions.ts` hacia `settings/notifications/actions.ts`, consolidando todas las server
actions de Notificaciones en un único módulo semántico sin cambiar contrato ni lógica push.

## Contexto

SETTINGS-ACTIONS-1 movió `updateNotificationPreferencesAction` a `notifications/actions.ts` y
documentó que **no** se debe usar re-export deprecated en archivos `"use server"` mixtos (rompe el
bundler de Next.js/Turbopack).

## Alcance

- Mover implementación real de push subscription actions
- Actualizar `use-push-subscription.ts`
- Limpiar `public/actions.ts` (solo Presencia pública)
- Validar tsc/build/lint + browser smoke
- **Fuera de scope:** service worker, manifest, DB, RLS, auth, CSS, UI, push client logic

## Auditoría de imports

Comandos: `rg "savePushSubscriptionAction"`, `rg "revokePushSubscriptionAction"`,
`rg "settings/public/actions"` en app/components/lib.

| Referencia | Ubicación | Rol |
|------------|-----------|-----|
| **Definición (antes)** | `app/admin/(protected)/settings/public/actions.ts` | Implementación completa |
| **Único consumidor TS/TSX** | `components/admin/notifications/use-push-subscription.ts` | Hook client — `prepareDevice` / `unsubscribeDevice` |
| **notifications/actions.ts** | Ya contenía `updateNotificationPreferencesAction` (ACTIONS-1) | Destino de consolidación |
| **Presencia pública** | `public-settings-form.tsx`, `public-catalog-settings-form.tsx` | Solo `updatePublicBusinessSettingsAction`, `updateCatalogHeroSettingsAction` |
| **Consumidores fuera de notifications/** | Ninguno | — |
| **Docs históricos** | Varios `docs/*.md` | Citaban ubicación vieja (no bloquean build) |

**Exports activos en `public/actions.ts` tras migración:**

- `updatePublicBusinessSettingsAction`
- `updateCatalogHeroSettingsAction`

## Estrategia aplicada

1. Copiar implementación exacta de `savePushSubscriptionAction` y `revokePushSubscriptionAction` a
   `notifications/actions.ts` (agregar import `readSerializablePushSubscription`).
2. Actualizar import en `use-push-subscription.ts`.
3. Eliminar implementaciones y imports no usados de `public/actions.ts`.
4. **Sin re-export deprecated** (lección de SETTINGS-ACTIONS-1).

## Archivos modificados

- `app/admin/(protected)/settings/notifications/actions.ts` — agregadas push subscription actions
- `app/admin/(protected)/settings/public/actions.ts` — removidas push actions; solo Presencia pública
- `components/admin/notifications/use-push-subscription.ts` — import actualizado

## Archivos creados

- `docs/admin-settings-actions-2-push-subscription-action-relocation.md` — este documento

## Compatibilidad / re-exports

- **Ningún re-export** en `public/actions.ts`.
- Todos los consumidores activos apuntan a `settings/notifications/actions.ts`.

## Contrato preservado

| Aspecto | `savePushSubscriptionAction` | `revokePushSubscriptionAction` |
|---------|------------------------------|--------------------------------|
| Firma | `(input: unknown)` | `(endpoint: string)` |
| Permiso | `canManageNotifications` | `canManageNotifications` |
| Service client | `createSupabaseServiceClient` → `push_subscriptions` | idem |
| `revalidatePath` | `/admin/settings/public` | `/admin/settings/public` |
| `logActionFailure` key | `settings.public.savePushSubscription` | `settings.public.revokePushSubscription` |
| Mensajes de error | Sin cambio | Sin cambio |
| Retorno | `{ success: true }` o `{ error }` | idem |

Hook `usePushSubscription`: sin cambios en lógica (`requestPermission`, `PushManager`, `subscribe`,
`unsubscribe`, estados).

## Validaciones

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | **PASS** |
| `npm run build` | **PASS** |
| `npm run lint` | **FAIL** — flake conocido ESLint 9: `Converting circular structure to JSON` |

## Browser smoke

| Ruta | Resultado |
|------|-----------|
| `/admin/settings/notifications` | PASS — preferencias + sección Dispositivo y permisos; botón "Preparar este dispositivo" visible |
| `/admin/settings/public` | PASS |
| `/admin/settings/public/landing` | PASS — botón guardar visible |
| `/admin/settings/public/catalogo` | PASS |
| `/admin/settings` | PASS — hub cards y links |

Sin module not found, hydration mismatch ni solicitud automática de permisos del navegador.

## Qué se preservó

- Contrato y comportamiento de ambas push actions
- Lógica completa de `usePushSubscription` (solo cambió ruta de import)
- Actions de Presencia pública en `public/actions.ts`
- `updateNotificationPreferencesAction` en `notifications/actions.ts`
- DB, RLS, auth, permisos, service worker, manifest, middleware, CSS, UI

## Qué NO se tocó

- Service worker, manifest, middleware
- Lógica push client-side (`requestPermission`, `subscribe`, `unsubscribe`)
- Browser permission logic
- Componentes UI y CSS modules
- Team, Operations, Public Presence UI
- `revalidatePath` (deuda preexistente: push actions revalidan `/admin/settings/public`)

## Riesgos

- **Bajo:** único consumidor actualizado; build verificado.
- **`revalidatePath("/admin/settings/public")`** en push actions: deuda preexistente; no alterada.

## Deuda restante

- Considerar `revalidatePath("/admin/settings/notifications")` en actions de notificaciones/push
  (cambio de comportamiento — fase aparte)
- Actualizar `logActionFailure` keys de `settings.public.*` a `settings.notifications.*` (cosmético)
- ESLint 9 circular config flake (DEVX)
- Docs históricos citan ubicación vieja

## Próxima fase recomendada

**SETTINGS-ACTIONS-3** (opcional) — alinear `revalidatePath` y `logActionFailure` keys al módulo
Notificaciones, solo si se aprueba cambio de comportamiento de cache invalidation.

Alternativa: cerrar epic Settings Actions y pasar a otra deuda (DEVX lint, `audio-unlock-modal` global
CSS).
