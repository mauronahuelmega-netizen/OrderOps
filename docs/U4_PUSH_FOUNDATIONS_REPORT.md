# U.4 Push Foundations Report

## 1. Que problema resuelve U.4

U.4 deja preparada la base tecnica para Web Push real futuro sin tocar el pipeline realtime actual ni prometer delivery productivo de pedidos.

## 2. Que tabla se creo

Nueva tabla:

- `public.push_subscriptions`

Migracion local creada:

- `supabase/migrations/20260518113000_u4_push_subscriptions.sql`

## 3. Que guarda una push subscription

Por dispositivo / navegador:

- `business_id`
- `profile_id`
- `endpoint`
- `p256dh`
- `auth`
- `user_agent`
- `created_at`
- `last_seen_at`
- `revoked_at`

No guarda payloads de notificaciones ni preferencias del usuario.

## 4. Como se detecta soporte

Client-side, despues del mount:

- `serviceWorker` en `navigator`
- `PushManager` en `window`
- `Notification` en `window`

Si falta algo:

- `Este navegador no soporta push web.`

Si falta `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY`:

- `Push no esta configurado en este entorno.`

## 5. Como se registra service worker

Se agrega:

- `public/sw.js`

Y el cliente registra:

- `/sw.js`

con helper client-safe antes de consultar o crear la subscription.

## 6. Que actions se agregaron

En `app/admin/(protected)/settings/public/actions.ts`:

- `savePushSubscriptionAction`
- `revokePushSubscriptionAction`

Ambas:

- validan sesion
- validan rol operativo
- resuelven `business_id` y `profile_id` desde contexto autenticado
- no confian en ids enviados por client

## 7. Que UI aparece en settings

Dentro de `Notificaciones operativas`, debajo de `Nuevos pedidos`, aparece:

- `Push del navegador`

Estados:

- no soportado
- entorno no configurado
- no configurado
- configurado
- bloqueado

Copy explicita:

- `Todavia no enviamos pedidos por push. Esta opcion prepara la base para una proxima fase.`

## 8. Que NO se implemento todavia

U.4 no implementa:

- envio push real de pedidos
- `web-push.sendNotification`
- fanout
- retry / queue
- delivery logs
- notification center
- inbox
- historial persistido de notificaciones
- push para status / assignment / presence

Nota posterior:

- U.5 ya consume estas foundations para el primer delivery server-side real
- este reporte sigue describiendo solamente lo que U.4 dejo preparado sin enviar pedidos todavia

## 9. Riesgos pendientes

- QA real del registro del service worker y de `PushManager.subscribe()` sigue pendiente
- falta validar visualmente el estado con y sin VAPID public key en navegador autenticado
- el entorno local sigue sin lint no interactivo

## 10. Resultado de validaciones

- `npx tsc --noEmit`: OK
- `npm run lint`: sigue abriendo el setup interactivo de `next lint`
- aplicacion remota de la migracion: no validada desde este entorno
