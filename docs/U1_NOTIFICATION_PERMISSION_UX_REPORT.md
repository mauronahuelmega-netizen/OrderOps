# U.1 Notification Permission UX Report

## 1. Que problema resuelve U.1

U.1 prepara el terreno para futuras notificaciones de nuevos pedidos sin dispararlas todavia.

Resuelve tres vacios concretos:

- saber si el navegador soporta notificaciones
- saber si el usuario ya concedio o bloqueo el permiso
- guardar una preferencia minima por perfil para decidir mas adelante si quiere avisos de nuevos pedidos

## 2. Donde vive la UI

La UI vive en:

- `/admin/settings/public`

Componente nuevo:

- `components/admin/notifications/notification-settings-card.tsx`

Hook nuevo:

- `components/admin/notifications/use-browser-notification-permission.ts`

## 3. Como se detecta permiso del navegador

La deteccion es client-side y SSR-safe.

Estados:

- `unknown`
- `unsupported`
- `default`
- `granted`
- `denied`

El hook:

- no toca `Notification`, `window` ni `document` durante el render SSR
- arranca en `unknown`
- despues del mount lee `Notification.permission`
- refresca el estado al volver la pestana a `visible`

## 4. Como se guarda la preferencia del usuario

Se agrego una migracion minima en `profiles`:

- `notification_preferences jsonb not null default '{}'::jsonb`

Preferencia inicial de U.1:

```json
{
  "new_order_browser_notifications_enabled": true
}
```

Server action:

- `updateNotificationPreferencesAction`

La action:

- valida sesion
- valida permiso server-side
- actualiza solo el perfil actual
- no toca preferencias globales del negocio

Desde U.3 la misma columna tambien guarda:

- `new_order_sound_enabled`
- `new_order_toast_enabled`
- `new_order_highlight_enabled`

## 5. Que roles pueden activar

Pueden activar o pausar:

- owner
- admin legacy
- manager
- operator

Viewer:

- no tiene permiso
- no puede usar la action

## 6. Como se evita hydration mismatch

Se evita no leyendo APIs del navegador durante SSR.

En particular:

- no se evalua `Notification.permission` en el render inicial server
- la UI arranca con estado neutral
- el estado real se resuelve despues del mount

## 7. Que NO se implemento todavia

U.1 no implementa:

- `new Notification(...)`
- service worker
- Web Push
- VAPID
- Firebase
- OneSignal
- PushSubscription
- notification center
- inbox
- disparo realtime de notificaciones

## 8. Riesgos pendientes

- QA real del prompt nativo del navegador sigue pendiente en este entorno
- algunos navegadores pueden cachear o endurecer el estado `denied` de forma distinta
- en U.2 habra que conectar permiso + preferencia con el pipeline de nuevo pedido sin reabrir bugs de replay historico

## 9. Resultado de validaciones

- `npx tsc --noEmit`: OK
- `npm run lint`: sigue abriendo el setup interactivo de `next lint`
- `GET /admin/settings/public` en dev server local: responde redirect de auth (`307`)
- QA visual real del prompt nativo: pendiente en un navegador autenticado
