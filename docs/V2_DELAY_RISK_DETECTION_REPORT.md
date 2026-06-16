# V.2 Delay / Risk Detection Report

## 1. Que problema resuelve

V.2 agrega una lectura preventiva sobre pedidos activos.

La idea no es alarmar ni automatizar decisiones, sino detectar cuando un pedido empieza a mostrar senales de demora o friccion antes de convertirse en problema real.

## 2. Signals implementados

Signals actuales:

- `inactive`
- `slow-preparation`
- `many-changes`
- `regressive`
- `reassigned`
- `stalled`

## 3. Thresholds usados

- `inactive`:
  - pedido activo
  - mas de 15 min sin movimiento
- `stalled`:
  - pedido activo
  - mas de 20 min sin movimiento
  - y ademas al menos otra senal de friccion
- `slow-preparation`:
  - pedido en `preparing`
  - supera el promedio operativo actual o el fallback de 25 min
- `many-changes`:
  - 4 o mas cambios de estado dentro de 60 min
- `reassigned`:
  - reasignacion derivada
  - o suficiente actividad de tomar / liberar

## 4. Scoring

Score acumulativo:

- `inactive`: +20
- `slow-preparation`: +25
- `many-changes`: +20
- `regressive`: +35
- `reassigned`: +15
- `stalled`: +50

Mapeo:

- `0-24` -> `stable`
- `25-59` -> `attention`
- `60+` -> `warning`

## 5. Donde aparece

- cards activas:
  - chip sutil de riesgo
- modal del pedido:
  - bloque `Riesgo operacional`
- vista profunda:
  - bloque `Riesgo operacional`
- `RESUMEN OPERATIVO`:
  - puede resumir cuantos pedidos activos muestran riesgo

## 6. Como convive con V.1

V.1 sigue siendo la lectura humana del tablero completo.

V.2 agrega la capa por pedido que permite explicar por que algunos casos aparecen en el resumen.

No reemplaza:

- `HOY`
- `OPERACION EN VIVO`
- `INSIGHTS`
- `ACTIVIDAD RECIENTE`

## 7. Que NO se implemento

V.2 no implementa:

- OpenAI
- fetch externo
- DB nueva
- notificaciones nuevas
- automatizacion de estados
- auto reasignacion
- auto cancelacion

## 8. Riesgos pendientes

- los thresholds todavia necesitan QA con datos reales del negocio
- algunas combinaciones de senales pueden requerir tuning fino para no sobre-sensibilizar pedidos muy activos
- falta QA visual real en mobile y desktop autenticado

## 9. QA realizado

Realizado:

- `npx tsc --noEmit`: OK
- `next dev` arranca y queda listo

Pendiente:

- validar visualmente chips y paneles de riesgo
- validar estados reales:
  - inactivo
  - regresivo
  - muchos cambios
  - reasignado
  - estancado
