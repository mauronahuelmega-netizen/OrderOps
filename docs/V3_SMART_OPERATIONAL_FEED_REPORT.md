# V.3 Smart Operational Feed Report

## 1. Que problema resuelve

V.3 mejora `ACTIVIDAD RECIENTE` para que deje de ser una lista cronologica plana y pase a ser una lectura mas util de lo que acaba de pasar en la operacion.

La meta es priorizar senales importantes sin convertir el dashboard en inbox ni notification center.

## 2. Diferencia entre T.5 y V.3

T.5 agrego memoria reciente transversal:

- eventos recientes
- acceso rapido al pedido
- contexto del negocio sin abrir pedido por pedido

V.3 no agrega una seccion nueva. Reusa ese bloque, pero cambia la logica interna:

- agrupa patrones repetidos
- sube arriba lo que requiere atencion
- deja eventos concretos solo cuando siguen siendo utiles

## 3. Feed items implementados

Kinds actuales:

- `risk-detected`
- `regressive-changes`
- `new-orders-burst`
- `orders-completed`
- `assignment-changed`
- `delivery-mix`
- `order-completed`
- `order-status-changed`
- `recent-activity`
- `operation-stable`

## 4. Reglas de agrupacion / prioridad

Prioridad actual:

1. riesgo activo
2. cambios regresivos
3. pico de pedidos nuevos
4. varios completados
5. movimiento entre responsables
6. mix delivery / retiro
7. actividad concreta restante
8. fallback estable

Agrupaciones actuales:

- 3+ pedidos nuevos en 10 min -> `Pico de pedidos reciente`
- 2+ completados en 60 min -> `Pedidos completados recientemente`
- 2+ movimientos de assignment en 90 min -> `Movimiento entre responsables`

## 5. Donde aparece

Sigue apareciendo en el mismo lugar:

- `ACTIVIDAD RECIENTE`

Debajo de:

- `INSIGHTS`
- `RESUMEN OPERATIVO`

Y arriba de:

- filtros
- cards

## 6. Como convive con V.1 y V.2

- V.1 resume el estado general en frases humanas
- V.2 detecta riesgo por pedido
- V.3 narra que paso hace poco y que merece atencion primero

No reemplaza ninguna de esas capas.

## 7. Que NO se implemento

V.3 no implementa:

- OpenAI
- inbox
- notification center
- DB nueva
- cambios en realtime
- cambios en push o browser notifications

## 8. Riesgos pendientes

- algunas agrupaciones pueden requerir tuning fino con datos reales del negocio
- falta validacion visual real en mobile y desktop autenticado
- el riesgo de duplicacion conceptual con V.1/V.2 esta mitigado, pero necesita QA humano con datos reales

## 9. QA realizado

Realizado:

- `npx tsc --noEmit`: OK
- el feed se integra por `useMemo` sin effects ni side effects

Pendiente:

- validar agrupaciones reales en dashboard autenticado
- validar click al modal desde items concretos
- revisar densidad en 320px / 390px
