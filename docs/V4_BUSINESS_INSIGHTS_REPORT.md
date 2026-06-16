# V4 Business Insights Report

## 1. Que problema resuelve

V.4 agrega una lectura compacta de patrones del negocio dentro del dashboard operativo.

La idea no es abrir una capa de BI ni una pantalla nueva, sino explicar en frases cortas cosas como mix del dia, pedidos de ticket alto, clientes frecuentes o ritmo reciente.

## 2. Que diferencia V.4 de V.1 / V.2 / V.3

- V.1 resume el estado operativo general
- V.2 detecta riesgo por pedido
- V.3 narra mejor la actividad reciente
- V.4 mira patrones simples del negocio

No reemplaza ninguna de esas capas.

## 3. Insights implementados

Actuales:

- `delivery-dominant`
- `pickup-dominant`
- `high-ticket`
- `frequent-customer`
- `recent-peak`
- `slow-rhythm`
- `sales-momentum`
- `preparation-trend`

## 4. Reglas y thresholds

- delivery / retiro dominante:
  - 70% o mas del mix del dia
- ticket alto:
  - pedido activo que supera el ticket promedio por al menos 40%
- cliente frecuente:
  - contexto de cliente con 5 o mas pedidos
- pico reciente:
  - 3 o mas pedidos en 10 min
- ritmo bajo:
  - mas de 35 min sin pedidos nuevos
  - solo si no hay riesgo activo y la operacion no esta fuerte
- preparacion mas lenta:
  - promedio mayor a 25 min
- buen movimiento comercial:
  - 5 o mas completados

## 5. Donde aparece

Nuevo bloque:

- `INSIGHTS DEL NEGOCIO`

Ubicacion actual:

1. `HOY`
2. `OPERACION EN VIVO`
3. `INSIGHTS`
4. `RESUMEN OPERATIVO`
5. `INSIGHTS DEL NEGOCIO`
6. `ACTIVIDAD RECIENTE`

## 6. Como convive con el dashboard actual

Convive con las capas existentes sin retirarlas:

- `HOY`
- `OPERACION EN VIVO`
- `INSIGHTS`
- `RESUMEN OPERATIVO`
- `ACTIVIDAD RECIENTE`

Si un insight tiene `orderId`, puede abrir el modal del pedido con el flujo local-first ya existente.

## 7. Que NO se implemento

V.4 no implementa:

- OpenAI
- API externa
- embeddings
- DB nueva
- charts grandes
- nueva pantalla de analytics
- cambios en realtime
- cambios en push, browser notifications, audio, toast o highlight

## 8. Riesgos pendientes

- el umbral de ticket alto y cliente frecuente puede necesitar tuning fino con datos reales
- el copy de ritmo bajo necesita validacion con trafico de negocio real
- falta QA visual autenticado en mobile y desktop

## 9. QA realizado

Realizado:

- `npx tsc --noEmit`: OK
- integracion por `useMemo` sin effects ni side effects

Pendiente:

- validar visualmente la nueva tira en dashboard
- probar click al modal desde insight con `orderId`
- revisar densidad en 320px / 390px
