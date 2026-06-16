# T3 - Historial por pedido mas util

## Que problema resuelve T.3

T.1 ya habia vuelto mas humano el timeline, pero seguia obligando a leer evento por evento para entender rapido el caso. T.3 agrega una capa de resumen y senales derivadas para que, al abrir un pedido, sea mas facil responder en segundos:

- cuanto tiempo lleva
- cuando se movio por ultima vez
- cuantos cambios tuvo
- si fue reasignado
- si hubo una secuencia rara
- en que etapa parece haberse demorado

## Que resumen por pedido se agrego

Se agrego un resumen compacto con:

- Tiempo total
- Ult. mov.
- Cambios
- Reasignaciones
- En estado actual

Ese resumen vive dentro de `Historial`, sin desplazar Acciones ni reemplazar el timeline.

## Como se calculan duracion total y ultimo movimiento

- `Tiempo total`
  - desde `created_at`
  - hasta `now()` si el pedido sigue activo
  - o hasta el ultimo evento terminal si ya termino en `completed` o `cancelled`

- `Ult. mov.`
  - usa el ultimo timestamp relevante del timeline del pedido
  - se presenta como tiempo relativo compacto

## Como se calcula duracion por etapa

Se deriva recorriendo `status_changed` en orden cronologico:

- inicio implicito en `pending` desde `created_at`
- cada cambio de estado cierra la etapa anterior
- la etapa actual se mide hasta `now()` si el pedido sigue activo
- pedidos terminales muestran el estado final sin inventar una duracion rara

No se persiste nada nuevo y no se crea una state machine formal.

## Que senales relevantes se derivan

T.3 puede mostrar hasta 3 senales suaves:

- Reasignado
- Cambio regresivo
- Estancado
- Completado
- Cancelado
- Operacion simple

La idea es orientar, no alarmar.

## Diferencias modal vs vista profunda

### Modal

- resumen compacto
- timeline mas tactico
- si hay muchos eventos, muestra los ultimos 5
- deja salida clara a `Ver historial completo`

### Vista profunda

- resumen mas comodo
- timeline completo
- mismo contexto, con mas aire visual

## Confirmacion de que no se retiro nada

T.3 no retira ni reemplaza:

- strip comercial `HOY`
- strip operacional `OPERACION EN VIVO`
- health indicator
- presence global
- queue pressure
- filtros
- cards
- quick actions
- assignment controls
- timeline T.1
- eventos actuales
- duracion entre eventos de T.1
- fallback `Pedido recibido`
- modal workspace
- vista profunda

## Que NO se implemento todavia

- nuevas tablas
- nuevas migraciones
- nuevos `event_type` persistidos
- realtime propio para `order_events`
- feed global
- analytics por operador
- notification center
- push notifications
- audit log enterprise

## Riesgos pendientes

- falta QA visual real en mobile para medir si el modal sigue sintiendose tactico
- pedidos legacy con secuencias muy raras pueden producir etapas menos perfectas, aunque no deberian romper render
- el entorno sigue limitando QA browser local completo

## Resultado de validaciones

- `npx tsc --noEmit`
- `npm run lint` sigue pendiente de configuracion no interactiva
