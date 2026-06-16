# S.4 Human Timeline Report

## 1. Que problema resuelve S.4

S.4 agrega memoria operacional humana basica por pedido. La idea no es auditar todo, sino dar contexto rapido sobre que paso antes:

- cuando entro el pedido
- quien cambio el estado
- quien tomo el pedido
- quien lo libero

## 2. Que tabla/campos se agregaron

Se agrega `public.order_events` con:

- `id`
- `business_id`
- `order_id`
- `actor_profile_id`
- `event_type`
- `payload`
- `created_at`

Eventos permitidos por constraint:

- `order_created`
- `status_changed`
- `assignment_taken`
- `assignment_released`

## 3. Que eventos iniciales existen

Persistidos:

- `status_changed`
- `assignment_taken`
- `assignment_released`

Fallback derivado:

- `order_created`

Hoy `order_created` no se persiste desde checkout para no tocar ese flujo en esta fase. La UI lo deriva desde `orders.created_at` como `Pedido recibido`.

## 4. Donde se emiten eventos

- `updateOrderStatusAction`
  - emite `status_changed` si el estado realmente cambio
- `updateOrderAssignmentAction`
  - emite `assignment_taken` al tomar
  - emite `assignment_released` al liberar

Las inserciones son server-side y best-effort: si falla el evento, la accion principal del pedido no debe romperse.

## 5. Donde se muestra timeline

- modal workspace del pedido
- vista profunda `/admin/orders/[id]`

No se muestra en cards del dashboard y no tiene subscription realtime propia.

## 6. Que fallback existe si no hay eventos

Si el pedido no tiene eventos persistidos, o si todavia no existe `order_created` persistido, la UI agrega un fallback:

- `Pedido recibido`

Ese item se deriva de `order.created_at`.

## 7. Que NO se implemento todavia

No se implemento:

- auditoria enterprise
- timeline global del negocio
- notification center
- comments
- presencia en timeline
- viewed events
- online/offline events
- event sourcing
- replay de eventos
- persistencia de `order_created` desde checkout

## 8. Como se mantiene separado de auditoria enterprise

La separacion se mantiene asi:

- tabla simple y acotada
- solo 4 tipos de evento
- payload chico
- sin triggers
- sin backfill masivo
- sin timeline global
- sin feed de notificaciones

Es memoria operacional local del pedido, no historial legal ni trazabilidad completa.

## 9. Riesgos pendientes

- falta QA real multiusuario para confirmar actor labels y orden visual
- `order_created` sigue siendo derivado, no persistido
- si falla la escritura del evento, la accion principal sigue viva y el timeline puede quedar incompleto
- no hay realtime propio para `order_events`; el timeline se refresca al abrir/reabrir y por append local tras acciones

## 10. Resultado de validaciones

- `npx tsc --noEmit`
  - pendiente de correr al cierre de la fase
- `npm run lint`
  - puede seguir abriendo el setup interactivo de Next; si ocurre, reportarlo sin inventar resultado
