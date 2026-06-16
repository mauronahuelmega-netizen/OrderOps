# V.3.2 -- Lane Simplification & Single Presence Model

## Objetivo

Eliminar la duplicacion visual de pedidos entre lanes para que el dashboard principal vuelva a comportarse como una cola operativa real:

- 1 pedido = 1 card visible
- 1 estado actual = 1 lane de presencia
- workflow, riesgo y ownership como senal
- menos scroll
- menos repeticion

`V.3.2` no toca logica sensible. Reordena presencia visual y reduce capas repetidas.

## Problema detectado

Antes de esta fase, un mismo pedido podia aparecer al mismo tiempo en:

- lane de estado
- lane de workflow
- lane de prioridad / riesgo

Eso inflaba la interfaz:

- mas cards que pedidos reales
- mas scroll
- mas headers y metrics repetidas
- peor lectura mobile

## Modelo aplicado

Se implemento `Single Presence Model`.

Cada pedido:

- aparece una sola vez visualmente
- vive en la lane de su estado actual
- mantiene workflow dentro de la card
- mantiene ownership dentro de la card
- mantiene riesgo dentro de la card

Las lanes base siguen siendo:

- `pending`
- `preparing`
- `ready`
- `completed`
- `cancelled`

## Duplicacion eliminada

Se elimino la presencia paralela de cards dentro de:

- priority / risk lanes
- delivery / pickup lanes

Esas capas ya no renderizan cards en el dashboard principal.

## Como se garantiza single presence

La presencia visible principal ahora se resuelve solo desde `groupedOrders`, agrupados por estado actual.

La navegacion de lanes tambien pasa a construirse solo desde esas lanes base por estado, para evitar targets y superficies paralelas.

## Workflow como metadata

`Delivery` y `Retiro` dejan de crear presencia paralela.

Ahora quedan expresados como:

- kicker de la card
- metadata operacional ya existente
- orden natural dentro de la cola real

## Priority / risk / ownership como senal

`risk`, `priority` y `ownership` dejan de duplicar cards.

Quedan expresados como:

- chip de riesgo
- aging / stale visual
- label de assignment
- label explicita de `Sin responsable` en cards activas

## Simplificacion de lanes

Se redujo el patron repetitivo:

- lane
- metrics
- cards

Las lanes base mantienen:

- nombre
- contador
- metrics mas compactas

Las metrics de lane en vista principal pasan a modo minimo:

- menos items
- sin header repetido
- menos altura antes de cards

## Impacto mobile

En mobile, el beneficio esperado es directo:

- menos scroll
- menos headers repetidos
- menos surfaces previas a cards
- 3 pedidos reales mas cerca de 3 cards visibles

## Que NO se toco

- DB
- auth
- queries
- realtime
- pipelines
- mutations
- search behavior
- filtros funcionales
- estados reales
- metricas calculadas sensibles
- nuevas features
- nuevas lanes
- nueva navegacion

## Riesgos pendientes

- falta QA autenticado con datos vivos
- si una lane concentra demasiado volumen real, puede seguir pidiendo ajustes finos de orden o summary en `V.3.3`
- workflow y riesgo hoy viven mejor integrados, pero su enfasis fino todavia depende del dataset real

## Preparacion para V.3.3

`V.3.2` deja listo:

- presencia unica por pedido
- menos deuda de scroll inflado
- lanes base mas limpias
- mejor piso para jerarquia fina futura sin arrastrar duplicacion estructural
