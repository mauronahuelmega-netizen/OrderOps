# U.3 Notification Preferences Report

## 1. Que problema resuelve U.3

U.3 agrega control operativo por perfil sobre los side effects de nuevos pedidos sin tocar el pipeline realtime base ni convertir OrderOps en un notification center.

Permite separar:

- browser notification
- sonido
- toast
- highlight

sin perder la regla central de recovery silencioso.

## 2. Que preferencias se agregaron

Dentro de `profiles.notification_preferences` ahora conviven:

- `new_order_browser_notifications_enabled`
- `new_order_sound_enabled`
- `new_order_toast_enabled`
- `new_order_highlight_enabled`

## 3. Defaults definidos

Defaults seguros cuando falta una key o el JSON llega parcial:

- browser notification: `false`
- sound: `true`
- toast: `true`
- highlight: `true`

## 4. Como se persisten

No hubo tabla nueva ni migracion nueva.

U.3 reutiliza:

- `profiles.notification_preferences`

La action `updateNotificationPreferencesAction` ahora acepta patch parcial, valida rol operativo y mergea con el JSON existente sin borrar otras keys futuras.

## 5. Como se aplican en visible / hidden / recovery

Visible:

- toast solo si `new_order_toast_enabled = true`
- sonido solo si `new_order_sound_enabled = true`
- highlight solo si `new_order_highlight_enabled = true`
- browser notification nunca

Hidden:

- browser notification solo si:
  - permission `granted`
  - `new_order_browser_notifications_enabled = true`
- sonido solo si `new_order_sound_enabled = true`
- hidden arrival awareness solo si `new_order_highlight_enabled = true`
- toast nunca retroactivo

Recovery / reconnect / silent refresh:

- nunca sonido
- nunca toast
- nunca browser notification
- nunca highlight falso

## 6. Como conviven con browser permission

Se mantiene separado:

- permiso del navegador
- preferencia del perfil

Entonces:

- `granted` + preference ON -> puede notificar
- `granted` + preference OFF -> no notifica
- `denied` -> no notifica aunque preference ON
- `default` -> settings puede ofrecer activar

## 7. Como conviven con audio unlock modal

El modal de dashboard sigue siendo el mecanismo para preparar audio real de la sesion actual.

Regla nueva:

- si `new_order_sound_enabled = false`
- el modal no aparece

O sea: no molestamos con setup de audio si el usuario ya decidio no usar sonido.

## 8. Que NO se implemento

U.3 no implementa:

- service worker
- Push API real
- PushSubscription
- VAPID
- Firebase
- OneSignal
- notification center
- inbox
- historial persistido de notificaciones
- notificaciones para status / assignment / presence
- preferencias por negocio o por dispositivo

## 9. Riesgos pendientes

- QA real del prompt nativo y de los toggles en navegador autenticado sigue pendiente
- `npm run lint` sigue sin estar listo de forma no interactiva
- el browser in-app de este entorno no alcanza para validar visualmente todo el flujo de permisos y sonido

## 10. Resultado de validaciones

- `npx tsc --noEmit`: OK
- `npm run lint`: sigue abriendo el setup interactivo de `next lint`
- QA dirigido visual real: pendiente
