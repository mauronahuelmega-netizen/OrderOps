# U.5 Server-side Web Push Report

## 1. Que problema resuelve U.5

U.5 agrega el primer delivery server-side real de Web Push para nuevos pedidos.

La meta no es reemplazar realtime ni browser notifications locales, sino sumar un aviso best-effort que pueda llegar aunque OrderOps no este abierto en primer plano.

## 2. Donde se engancha el envio

El envio queda enganchado despues de que el pedido se crea exitosamente en checkout.

Flujo actual:

1. checkout publico llama a `create_order`
2. recibe `order_id`
3. dispara `POST /api/internal/orders/[id]/push`
4. limpia carrito y redirige al success sin esperar el resultado del push

Esto mantiene el checkout no bloqueante.

## 3. Como se configura VAPID

Variables esperadas:

- `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY`
- `WEB_PUSH_VAPID_PRIVATE_KEY`
- `WEB_PUSH_CONTACT`

Si falta alguna:

- no se rompe la creacion del pedido
- el helper server-only devuelve `reason: missing-vapid-config`
- se loggea warning server-side

## 4. Como se seleccionan subscriptions

Fuente:

- `public.push_subscriptions`

Se cargan subscriptions activas por `business_id` y luego se filtran con `profiles`:

- rol operativo permitido
- `new_order_browser_notifications_enabled === true`
- `revoked_at is null`

No se envia a `viewer`.

## 5. Que preferencias y roles se respetan

Roles permitidos:

- `owner`
- `admin` legacy
- `manager`
- `operator`

Preferencia usada:

- `new_order_browser_notifications_enabled`

Las preferencias de sonido, toast y highlight no aplican al Web Push server-side.

## 6. Payload enviado

Titulo:

- `Nuevo pedido`

Body:

- preferente: `Cliente - Delivery/Retiro - $total`
- fallback: `Nuevo pedido recibido`

Data:

- `type: "new_order"`
- `orderId`
- `businessId`
- `url: "/admin/dashboard"`

Tag:

- `new-order:<orderId>`

## 7. Cleanup de endpoints invalidos

Si `web-push` devuelve:

- `404`
- `410`

la subscription se marca con:

- `revoked_at = now()`

No se creo tabla de delivery logs ni retry queue.

## 8. Como convive con U.2 browser notifications

U.2 sigue intacto:

- visible: toast + sonido + highlight
- hidden: browser notification local + sonido + highlight diferido
- recovery: silencioso

U.5 agrega un segundo canal best-effort via Service Worker.

Riesgo residual:

- si coinciden U.2 hidden y U.5, puede haber duplicado visual en algunos navegadores

Mitigacion actual:

- `tag: new-order:<orderId>` tanto en payload push como en el Service Worker

## 9. Que NO se implemento

U.5 no implementa:

- notification center
- inbox
- unread count
- push para status / assignment / presence
- retry queue
- analytics de push
- acciones interactivas de notification
- Web Push enterprise-grade con delivery exactness

## 10. Riesgos pendientes

- el hook actual usa una route interna best-effort disparada desde checkout publico; no hay dedupe persistente en DB
- la mitigacion de duplicados entre U.2 y U.5 depende del `tag`, no de presencia online ni cancelacion server-side
- falta validar delivery real con VAPID configurado y browser autenticado

## 11. Resultado de validaciones

- `npm install web-push @types/web-push`: OK
- `npx tsc --noEmit`: OK
- `npm run lint`: sigue abriendo el setup interactivo de `next lint`
- delivery real en browser con VAPID configurado: pendiente desde este entorno
