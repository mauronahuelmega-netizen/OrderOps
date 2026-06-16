# V.1 Operational Summaries Report

## 1. Que problema resuelve V.1

V.1 agrega una lectura humana corta del estado actual del dashboard.

La idea no es reemplazar metricas, insights ni actividad reciente, sino ayudar a que alguien entienda el pulso operativo en segundos sin leer todas las capas por separado.

## 2. Por que no usa IA externa todavia

V.1 es completamente deterministico.

No usa:

- OpenAI API
- embeddings
- vector DB
- fetch extra

Esto mantiene el costo, la explicabilidad y la estabilidad del dashboard bajo control.

## 3. Que summaries se agregaron

Nuevo bloque en dashboard:

- `RESUMEN OPERATIVO`

Puede mostrar hasta 5 frases cortas sobre:

- pedidos estancados
- cambios regresivos
- preparacion lenta
- cancelaciones relevantes
- reasignaciones
- dominancia delivery / retiro
- fallback de operacion estable o tranquila

## 4. Reglas y thresholds

Reglas actuales:

- estancados:
  - prioridad maxima
  - threshold: mas de 20 min sin movimiento
- preparacion lenta:
  - threshold: promedio mayor a 25 min
- cancelaciones relevantes:
  - al menos 2 cancelaciones
  - y al menos 20% de los pedidos del dia
- dominancia delivery / retiro:
  - 70% o mas del mix del dia

Si no hay senales fuertes:

- `La operacion esta tranquila.`
- `La operacion esta estable en este momento.`
- o fallback vacio cuando todavia no hay pedidos

## 5. Donde aparece en UI

Jerarquia actual:

1. barra operacional superior
2. `HOY`
3. `OPERACION EN VIVO`
4. `INSIGHTS`
5. `RESUMEN OPERATIVO`
6. `ACTIVIDAD RECIENTE`
7. filtros
8. cards

## 6. Como convive con INSIGHTS y ACTIVIDAD RECIENTE

- `INSIGHTS` sigue siendo la capa corta de senales priorizadas
- `RESUMEN OPERATIVO` traduce esas senales y metricas a frases mas humanas
- `ACTIVIDAD RECIENTE` sigue mostrando hechos concretos del negocio

No se retiro ni reemplazo ninguna de esas capas.

## 7. Confirmacion de que no se retiro nada previo

V.1 no retiro:

- `HOY`
- `OPERACION EN VIVO`
- `INSIGHTS`
- `ACTIVIDAD RECIENTE`
- filtros
- cards
- assignment
- presence
- timeline

## 8. Que NO se implemento

V.1 no implementa:

- OpenAI
- chatbot
- agentes
- streaming
- pantalla nueva
- cambios en realtime
- cambios en push / browser notifications

## 9. Riesgos pendientes

- el valor real del copy todavia necesita QA con datos reales del negocio
- en algunos escenarios tranquilos el bloque puede terminar con muy pocas frases, porque prioriza no inventar senales
- falta validacion visual real en mobile y desktop autenticado desde este entorno

## 10. Resultado de validaciones

- `npx tsc --noEmit`: OK
- `npm run lint`: sigue abriendo el setup interactivo de `next lint`
- QA visual real en navegador autenticado: pendiente
