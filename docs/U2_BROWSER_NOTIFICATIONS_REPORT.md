# U.2 Browser Notifications Report

## 1. Que problema resuelve U.2

U.2 hace que OrderOps pueda avisar un nuevo pedido aunque el operador este usando otra pestana, sin convertir eso en push real ni reabrir bugs de replay historico.

## 2. Como se conecta al pipeline realtime

U.2 no crea un pipeline paralelo.

Se monta sobre `onOrderInsert` del dashboard:

- `INSERT` realtime llega
- se pide `summary`
- se inserta el pedido en state
- si la pestana esta visible:
  - siguen funcionando toast / audio / highlight
- si la pestana esta oculta:
  - puede aparecer browser notification

## 3. Reglas de visibility

- visible:
  - no hay browser notification
  - siguen toast / sonido / highlight
- hidden:
  - solo se notifica si el insert es live, el permiso esta concedido y la preferencia esta activa
  - el sonido y el highlight diferido quedaron documentados en U.2.1

Desde U.3 esa preferencia convive con otras tres del mismo pedido:

- browser notification
- sonido
- toast
- highlight

## 4. Como se evita replay historico

La notification respeta las mismas guardias de recovery ya existentes:

- suppression por `visibility`
- suppression por `online`
- suppression por `reconnect`
- exclusion de `silent refresh`

No se dispara desde fetches, reconcile ni refresh silencioso.

## 5. Estrategia de dedupe multi-tab

Se usa una estrategia liviana:

- `Notification.tag` por `orderId`
- `localStorage` para reclamar localmente el pedido ya notificado

No busca perfeccion enterprise, pero evita spam excesivo entre pestañas.

## 6. Payload de notifications

Titulo:

- `Nuevo pedido`

Body:

- cliente + metodo + total cuando existe
- fallback a cantidad de productos + metodo
- fallback final a un texto corto del dashboard

## 7. Click behavior

Click simple:

- `window.focus()`
- `notification.close()`

No hay deep link complejo ni apertura automatica de modal desde la notification.

## 8. Que NO se implemento todavia

U.2 no implementa:

- service worker
- Web Push real
- VAPID
- PushSubscription
- Firebase
- OneSignal
- notification center
- inbox
- notificaciones de status
- notificaciones de assignment
- notificaciones de presence

## 9. Riesgos pendientes

- QA visual real del prompt y de la notification del navegador sigue pendiente
- el dedupe multi-tab es razonable pero no pretende ser infalible en condiciones de carrera extremas
- si el dashboard esta en estado vacio y no monta el componente cliente, esta fase no cambia ese comportamiento previo
- la separacion fina entre hidden audio, toast foreground y replay historico ahora vive en U.2.1

## 10. Resultado de validaciones

- `npx tsc --noEmit`: OK
- `npm run lint`: sigue abriendo el setup interactivo de `next lint`
- dev server local: pendiente de chequeo visual autenticado para notifications reales
