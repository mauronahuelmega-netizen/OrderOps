# U.2.1 Operational Audio Hotfix Report

## 1. Causa del bug

U.2 trataba `hidden` como si fuera un caso a suprimir por completo.

Eso mezclaba dos cosas distintas:

- efectos visuales de foreground
- senales operacionales live

Resultado:

- la browser notification si salia
- pero el sonido quedaba suprimido
- y el pedido no quedaba claramente marcado al volver visible

## 2. Nuevo modelo de side effects

U.2.1 separa cuatro capas:

1. efectos live operacionales
   - sonido
   - dedupe por pedido
   - solo para `INSERT` realtime live

2. efectos visuales de foreground
   - toast
   - highlight inmediato
   - solo con pestana visible

3. hidden arrival awareness
   - browser notification
   - tracking del pedido recibido hidden
   - highlight al volver visible

4. recovery reconciliation
   - sin sonido
   - sin toast
   - sin notification
   - sin highlight falso

## 3. Comportamiento visible vs hidden

Visible:

- insert into state
- toast
- sonido
- highlight
- sin browser notification

Hidden:

- insert into state
- browser notification si corresponde
- sonido
- se guarda como hidden arrival
- al volver visible: highlight
- sin toast retroactivo

## 4. Como se preserva sonido en hidden

El sonido ya no depende de `document.visibilityState`.

Depende de:

- insert live
- no recovery
- dedupe por `orderId`

## 5. Como se evita toast retroactivo

El toast sigue atado solo al camino visible.

Los pedidos que entran hidden:

- no muestran toast al volver
- solo se marcan como nuevos visualmente

## 6. Como se evita replay historico

La clasificacion del insert ahora distingue mejor:

- `visible`
- `hidden`
- `recovery`

Si la suppression window por `visibility` / `online` / `reconnect` esta activa:

- el insert cae en `recovery`
- no reproduce sonido
- no muestra notification
- no marca highlight falso

## 7. Como funciona audio unlock

Desde U.2.2 el unlock ya no se presenta como card sino como modal operativo.

Se muestra un modal minimo en dashboard:

- `Activar avisos operativos`

Se muestra para:

- owner
- admin legacy
- manager
- operator

solo si la sesion actual no tiene audio preparado.

Desde U.3:

- si `new_order_sound_enabled = false`
- el modal ya no molesta en dashboard
- y el pipeline live no intenta reproducir sonido

Persistencias:

- `orderops:audio-unlocked:v1`

El estado real de audio habilitado sigue dependiendo de la sesion/documento actual.

## 8. Que NO se implemento

No se implemento:

- service worker
- Push API real
- PushSubscription
- backend sender
- notification center
- nuevas notificaciones para status / assignment / presence

## 9. Validaciones

- `npx tsc --noEmit`: OK
- `npm run lint`: sigue abriendo el setup interactivo de `next lint`
- QA visual real de sonido hidden y prompt del navegador: pendiente
