# OX.3.3 - Lane Header System

## Resumen ejecutivo del sistema de headers

OX.3.3 define conceptualmente que deberia comunicar el header de cada lane operacional. No diseña UI ni decide componentes exactos. Su funcion es establecer **que informacion minima necesita una lane para ser comprendida en segundos**, sin obligar al operador a leer cards antes de entender prioridad, volumen, ownership o riesgo.

La conclusion central es:

- un header de lane no es un titulo decorativo
- debe resumir el tipo de trabajo que vive ahi
- debe decir si esa lane requiere accion, seguimiento o solo contexto
- debe evitar saturacion: no todo merece metadata de primer nivel
- mobile necesita headers mucho mas duros y cortos

En corto: el header deberia responder **que es esta lane, cuanta carga tiene y por que deberia importarme ahora**.

## Definicion conceptual de cada header por tipo de lane

### Critical Operations

Headers de lanes criticas deben:

- priorizar riesgo, ownership y carga
- dejar claro si hay bloqueo o friccion
- mostrar cantidad de trabajo vivo
- evitar cualquier narrativa innecesaria

Ejemplos de lanes:

- `Con riesgo / Demorados`
- `Preparing`
- `Pending` cuando hay backlog o falta de responsable
- `Sin responsable`

### Tactical Awareness

Headers de lanes tacticas deben:

- resumir el flujo sin competir con las lanes criticas
- mostrar volumen o balance suficiente para decidir si entrar
- mantener senales operativas en segundo plano

Ejemplos de lanes:

- `Ready`
- `A mi cargo`
- `Delivery` o `Pickup` cuando afectan el flujo

### Business Context

Headers de lanes o grupos con valor de negocio deben:

- resumir throughput o patron
- evitar alertas que no cambian accion inmediata
- mantenerse compactos y secundarios

Ejemplos:

- `Completed`
- lanes de metodo cuando son lectura de mix mas que trabajo vivo

### Passive Narrative

Headers pasivos no deberian aspirar a existir como lanes primarias.

Si alguna capa secundaria sobreviviera como agrupamiento:

- su header deberia ser minimo
- no deberia competir con carga, ownership o riesgo
- probablemente deberia vivir comprimido o diferido

## Lista de headers de lanes y su informacion conceptual

### Header: Pending / Nuevo

Debe comunicar:

- nombre del estado
- cantidad de pedidos
- si hay acumulacion
- si hay pedidos sin responsable
- si hay envejecimiento de espera

Informacion minima:

- estado resumido
- conteo
- ownership gap
- alerta de espera si aplica

Lo que no deberia hacer:

- mezclar negocio o narrativa larga

### Header: Preparing / En preparacion

Debe comunicar:

- nombre del estado
- cantidad de pedidos en trabajo activo
- si hay demora o lentitud
- si hay carga alta o friccion
- ownership relevante

Informacion minima:

- estado resumido
- conteo
- riesgo / demora
- ownership o carga

Lo que no deberia hacer:

- convertirse en dashboard paralelo de metricas

### Header: Ready

Debe comunicar:

- nombre del estado
- cantidad de pedidos listos
- si existe acumulacion de salida
- si el ready esta fluyendo o retenido

Informacion minima:

- estado resumido
- conteo
- alerta de acumulacion si aplica

Lo que no deberia hacer:

- competir con preparing si no hay friccion

### Header: Con riesgo / Demorados / Estancados

Debe comunicar:

- que existe friccion real
- cuantos pedidos estan afectados
- si el problema es demora, regresion, estancamiento o ownership
- si la lane debe dominar el scanning

Informacion minima:

- tipo de riesgo dominante
- conteo afectado
- gravedad resumida
- ownership gap si existe

Lo que no deberia hacer:

- redundar con cada card al punto de sonar paranoico

### Header: Sin responsable

Debe comunicar:

- cantidad de pedidos sin ownership
- si el hueco es puntual o estructural
- urgencia de toma

Informacion minima:

- estado de ownership
- conteo
- urgencia resumida

Lo que no deberia hacer:

- esconderse como detalle secundario si hay varios pedidos sin tomar

### Header: A mi cargo

Debe comunicar:

- cantidad de pedidos asignados al usuario
- si alguno esta en riesgo
- si la carga personal es razonable o no

Informacion minima:

- ownership personal
- conteo
- senal de riesgo resumida si existe

Lo que no deberia hacer:

- competir con la lane de riesgo general si la friccion ya es transversal

### Header: Delivery

Debe comunicar:

- tipo de flujo
- cantidad de pedidos
- si el metodo esta afectando la operacion

Informacion minima:

- metodo
- conteo
- alerta operacional solo si cambia el flujo

Lo que no deberia hacer:

- fingir importancia estructural cuando solo aporta contexto de mix

### Header: Pickup / Retiro

Debe comunicar:

- tipo de flujo
- cantidad de pedidos
- si hay acumulacion puntual

Informacion minima:

- metodo
- conteo
- alerta solo si hace falta

Lo que no deberia hacer:

- competir con workflow base si el retiro no cambia nada tactico

### Header: Completed

Debe comunicar:

- throughput o volumen cerrado
- lectura breve de cierre

Informacion minima:

- estado
- conteo
- ritmo solo si agrega valor

Lo que no deberia hacer:

- usar alertas o metadata de primer plano salvo desvio excepcional

### Header: Cancelled

Debe comunicar:

- cantidad o ratio de cancelacion
- si hay anomalia

Informacion minima:

- estado
- conteo
- alerta solo si el patron es anormal

Lo que no deberia hacer:

- quedarse fijo con el mismo peso que trabajo vivo

## Informacion minima a mostrar

Todo header de lane deberia decidir entre estas piezas, no acumularlas todas siempre:

- estado del pedido o tipo de lane
- cantidad de pedidos
- ownership / assigned to si aporta foco
- alertas de riesgo / demora / congestion
- resumen minimo del volumen

Regla:

- si una pieza no ayuda a decidir o a entrar a la lane correcta, deberia quedarse fuera del header

## Secuencia conceptual de actualizacion por estado del pedido

### Pending

El header deberia volverse mas relevante cuando:

- entran pedidos nuevos
- crece el backlog
- aparecen pedidos sin responsable
- sube el tiempo de espera

### Preparing

El header deberia ganar peso cuando:

- sube la carga activa
- aumenta preparacion lenta
- aparecen stalled, regressions o churn
- la ownership se vuelve ambigua

### Ready

El header deberia ganar peso cuando:

- se acumulan pedidos listos
- la salida o retiro no fluye

### Completed

El header deberia actualizar volumen y ritmo, pero sin exigir prioridad salvo lectura de throughput.

### Cancelled

El header deberia permanecer discreto salvo cuando el conteo o patron sube anormalmente.

### Con riesgo / Demorados / Estancados

El header deberia ser el primero en escalar cuando:

- aumenta el numero de pedidos afectados
- el problema persiste
- el riesgo se cruza con ownership gap

## Paths de atencion y lectura

### Operator

1. header de lane critica
2. header de preparing
3. header de pending o sin responsable
4. cards
5. lanes tacticas si todavia aportan

### Manager

1. header de riesgo
2. header de sin responsable
3. headers de pending / preparing / ready
4. headers secundarios de metodo o throughput

### Owner

1. header de lanes criticas si existen
2. header de completed / cancelled
3. negocio resumido fuera de lanes si aplica

### Mobile

1. header de lane critica
2. header del workflow activo
3. cards
4. headers secundarios solo si estan muy comprimidos

## Compactacion y degradacion conceptual por congestion, viewport y mobile

### Bajo congestion

- headers de lanes criticas pueden aumentar densidad util
- headers de completed, cancelled y metodo deben compactarse o bajar
- ownership y riesgo ganan prioridad

### Bajo risk

- la lane de riesgo puede usar el header mas fuerte del tablero
- pending y preparing mantienen headers claros pero mas subordinados
- cualquier header de negocio o throughput se degrada

### En desktop

- mas tolerancia para submetadata compacta
- se puede sostener conteo + alerta + ownership si ayuda

### En mobile

- header corto
- una o dos senales maximas por lane
- nada de narrativa
- nada de metadata que obligue a horizontal excesivo o multiple lectura previa

## Reglas de compactacion y degradacion por estado y viewport

### Pending

- desktop: conteo + ownership gap + espera si aplica
- mobile: conteo + ownership gap o espera, no ambas salvo criticidad fuerte

### Preparing

- desktop: conteo + riesgo + ownership
- mobile: conteo + riesgo dominante

### Ready

- desktop: conteo + acumulacion si aplica
- mobile: conteo o alerta, no ambos salvo retencion real

### Completed

- desktop: conteo + ritmo opcional
- mobile: conteo minimo

### Cancelled

- desktop: conteo + alerta solo si anomalo
- mobile: casi siempre solo conteo o diferido

### Con riesgo / Demorados / Estancados

- desktop: tipo de riesgo + conteo + ownership gap si existe
- mobile: riesgo dominante + conteo afectado

## Integracion conceptual con OX.3.1 -> OX.3.2

### OX.3.1

Toma la definicion de lanes primarios y secundarios para decidir que headers merecen mas peso.

### OX.3.2

Toma el comportamiento por estado para decidir que metadata deberia dominar en cada header.

### OX.2.8

Toma el fold consolidado para no permitir que un header secundario rompa la jerarquia del tablero.

## Preparacion conceptual para OX.3.4 - Lane Metrics Layer

OX.3.3 deja listo para OX.3.4:

- que informacion debe vivir como identidad minima del header
- que informacion podria expandirse a una capa de metricas por lane
- donde termina el resumen operacional y donde empieza la metrica adicional

La regla importante es:

- si una metrica no cabe conceptualmente en el header sin saturarlo, probablemente pertenezca a la metric layer y no al header

## Riesgos conceptuales y advertencias

- convertir headers en mini dashboards
- repetir riesgo tanto en header como en cards sin jerarquia
- poner demasiada metadata en lanes secundarias
- usar headers narrativos en vez de headers operativos
- hacer que mobile necesite leer demasiado antes de ver cards
- no distinguir entre identidad de lane y metricas de lane

## Decisiones NO tomadas todavia

OX.3.3 no decide:

- layout final del header
- CSS final
- iconografia
- color system
- motion
- cantidad exacta de metadata visible
- sticky real del header
- header expandible real
- implementacion realtime
- cambios en DB

## Confirmacion de alcance

En esta fase no se implementa ni se toca:

- UI
- layout
- CSS
- cards
- KPIs
- feed
- insights
- busqueda
- realtime
- DB

## Conclusiones

- el header de una lane debe explicar rapidamente por que esa lane merece atencion
- identidad, conteo, riesgo y ownership son sus piezas mas valiosas
- mobile necesita headers mas cortos y mas duros
- OX.3.4 ya puede construir una metric layer sin mezclarla con la identidad minima de cada lane
