# OX.3.1 - Lane Architecture Definition

## Resumen ejecutivo de la arquitectura de lanes

OX.3.1 define la arquitectura conceptual de los `Operational Lanes` para `/admin/dashboard`. No implementa lanes reales ni cambia el layout actual. Su funcion es decidir **que tipos de agrupamiento merecen convertirse en estructura operativa visible** y cuales deberian seguir siendo contexto, busqueda o filtro.

La conclusion central es:

- un lane no es solo una columna o un grupo visual
- un lane es una unidad de scanning, decision y accion
- los lanes deben expresar workflow, riesgo, ownership o metodo solo cuando eso reduce scanning real
- los lanes no deben duplicar filtros, feed o business context
- la arquitectura de lanes tiene que nacer desde la capa critica, no desde el deseo de mostrar mas bloques

En limpio: los lanes futuros deben ayudar a responder **que miro primero, donde actuo y que merece permanecer visible**.

## Definicion de lanes primarios y secundarios

### Lanes primarios

Son lanes que organizan directamente la operacion viva y el trabajo inmediato.

Caracteristicas:

- reducen scanning manual
- estructuran workflow real
- ayudan a decidir y actuar
- pueden dominar bajo carga, congestion o multioperador

### Lanes secundarios

Son lanes que agregan contexto util, pero no deberian convertirse en el esqueleto principal del dashboard.

Caracteristicas:

- ayudan a entender patrones
- pueden ser valiosos en momentos o roles especificos
- no deben competir con los lanes primarios

## Lista de lanes primarios y secundarios con criterios de agrupamiento

### Lane primario: Pending

Tipo: workflow / estado  
Criterio de agrupamiento: pedidos `pending`  
Valor operacional: muy alto  
Usuario principal: operator / manager  
Motivo: concentra lo que todavia no entro en ejecucion y ayuda a detectar ingreso, espera y ownership pendiente

### Lane primario: Preparing

Tipo: workflow / estado  
Criterio de agrupamiento: pedidos `preparing`  
Valor operacional: muy alto  
Usuario principal: operator / manager  
Motivo: concentra carga activa y expone friccion de preparacion, riesgo y throughput

### Lane primario: Ready

Tipo: workflow / estado  
Criterio de agrupamiento: pedidos `ready`  
Valor operacional: alto  
Usuario principal: operator / manager  
Motivo: marca pedidos listos para salida, entrega o cierre operativo

### Lane primario: Con riesgo / Demorados

Tipo: riesgo / congestion  
Criterio de agrupamiento: pedidos con V.2 activa, stalled, overdue, regressions o friccion relevante  
Valor operacional: muy alto  
Usuario principal: operator / manager  
Motivo: reduce scanning de problemas y deberia poder dominar bajo presion

### Lane primario: Sin responsable

Tipo: ownership / assignment  
Criterio de agrupamiento: pedidos sin `assigned_to` o con ownership ambiguo  
Valor operacional: muy alto en multioperador  
Usuario principal: operator / manager  
Motivo: hace visible el hueco de ownership que hoy requiere scanning o busqueda

### Lane primario: A mi cargo

Tipo: ownership / assignment  
Criterio de agrupamiento: pedidos asignados al usuario actual  
Valor operacional: alto  
Usuario principal: operator  
Motivo: reduce scanning personal y ayuda a enfoque individual

### Lane secundario: Delivery

Tipo: metodo / flujo  
Criterio de agrupamiento: pedidos con `delivery`  
Valor operacional: medio-alto cuando el mix afecta el flujo  
Usuario principal: manager / operator  
Motivo: puede ser util para staffing y lectura de salida, pero no siempre debe estructurar el tablero

### Lane secundario: Pickup / Retiro

Tipo: metodo / flujo  
Criterio de agrupamiento: pedidos con `pickup`  
Valor operacional: medio  
Usuario principal: manager / operator  
Motivo: valioso cuando el metodo cambia la operacion, secundario cuando solo contextualiza el dia

### Lane secundario: Completed

Tipo: estado / throughput  
Criterio de agrupamiento: pedidos `completed`  
Valor operacional: medio-bajo en tiempo real  
Usuario principal: owner / manager  
Motivo: sirve para leer ritmo y throughput, pero no deberia competir con trabajo vivo

### Lane secundario: Cancelled

Tipo: estado / excepcion  
Criterio de agrupamiento: pedidos `cancelled`  
Valor operacional: medio  
Usuario principal: manager / owner  
Motivo: util para calidad operativa y lectura de friccion, pero secundaria salvo desvio anormal

## Criterios conceptuales de agrupamiento

### Por estado de pedido

Sirve para:

- estructurar workflow base
- reflejar flujo real
- permitir lanes primarios estables

Estados con valor estructural fuerte:

- `pending`
- `preparing`
- `ready`

Estados con valor secundario:

- `completed`
- `cancelled`

### Por metodo de entrega

Sirve para:

- leer variantes del flujo
- anticipar carga por tipo de salida
- preparar lanes futuras de delivery / pickup solo si reducen scanning real

Regla:

- metodo no debe dominar siempre
- domina solo cuando modifica operacion o staffing

### Por riesgo o congestion

Sirve para:

- sacar los problemas del ruido general
- permitir una lane critica o prioritaria
- reducir dependencia de chips, summaries o feed para detectar friccion

Regla:

- riesgo es criterio de lane mas fuerte que negocio, pero no necesariamente mas estable que estado

### Por ownership / assignment

Sirve para:

- hacer visible trabajo sin responsable
- separar carga personal de carga total
- mejorar coordinacion multioperador

Regla:

- ownership tiene valor estructural real cuando hay varios operadores

## Relacion conceptual con Critical Operations Layer y fold consolidado

Los lanes futuros deben nacer desde lo ya definido en OX.2:

- la `Critical Operations Layer` dijo que riesgo, cards, ownership, foco y carga mandan
- el fold consolidado dijo que el dashboard debe llevar antes a cards y accion

Por eso:

- lanes no deberian ser una nueva capa paralela al fold
- deberian convertirse en la forma principal de expresar workflow y prioridad dentro de la capa critica

Los lanes deben integrarse mejor con:

- cards como verdad operacional
- ownership como lectura critica
- riesgo como agrupamiento dominante bajo friccion
- foco de navegacion como herramienta para entrar rapido a una lane relevante

## Prioridad conceptual y visibilidad de cada lane

### Prioridad alta / visibilidad fuerte

- Pending
- Preparing
- Ready
- Con riesgo / Demorados
- Sin responsable

Estas lanes deberian:

- aparecer antes
- sobrevivir bajo carga
- mantener legibilidad incluso en mobile comprimido

### Prioridad media / visibilidad condicional

- A mi cargo
- Delivery
- Pickup

Estas lanes deberian:

- subir cuando ayudan al trabajo real
- bajar cuando solo agregan contexto

### Prioridad baja / visibilidad secundaria

- Completed
- Cancelled

Estas lanes deberian:

- vivir como soporte de throughput o revision
- no competir con trabajo activo salvo excepcion

## Secuencia conceptual de lectura y paths de scanning

### Operator path

1. lane de riesgo / demorados
2. lane sin responsable
3. lane preparing
4. lane pending
5. lane ready
6. lane a mi cargo
7. lanes secundarias si sobran atencion y contexto

### Manager path

1. lane de riesgo / demorados
2. lane sin responsable
3. preparing / pending balance
4. ready
5. delivery / pickup si el mix afecta flujo
6. completed / cancelled como revision

### Owner path

1. carga general y lanes activas con friccion
2. completed / cancelled para lectura de ritmo
3. lanes de delivery / pickup si explican patron
4. lanes criticas solo si hay problema real

### Mobile path

1. lane de riesgo o congestion si existe
2. lane sin responsable o foco actual
3. cards del workflow principal
4. lanes secundarias solo comprimidas o diferidas

## Reglas conceptuales de degradacion por congestion, riesgo o mobile

### Congestion

- lanes de riesgo y ownership suben
- lanes de throughput bajan
- metodo de entrega se mantiene solo si cambia la operacion

### Risk

- lane de riesgo puede dominar el primer scanning
- pending / preparing siguen visibles, pero subordinadas a friccion
- completed / cancelled se degradan primero

### Mobile

- se sostienen menos lanes a la vez
- las lanes secundarias deberian comprimirse o diferirse
- ownership y riesgo mantienen prioridad

### Calma

- las lanes de riesgo pueden bajar o fusionarse conceptualmente con workflow
- completed y negocio pueden recuperar algo de visibilidad

## Preparacion conceptual para OX.3.2 - State-Based Operational Lanes

OX.3.1 deja claro que OX.3.2 deberia:

- arrancar desde lanes de estado como columna vertebral
- decidir si riesgo y ownership son lanes completas o capas dominantes sobre esas lanes
- evitar construir lanes que repliquen sin criterio busqueda, filtros o chips
- resolver que estados merecen expresion primaria y cuales secundaria

Tambien deja una secuencia sana para la fase siguiente:

1. resolver lanes base de estado
2. decidir superposicion o prioridad de riesgo
3. decidir expresion de ownership
4. recien despues evaluar metodo como lane estructural

## Integracion conceptual con OX.2.2 -> OX.2.8

### OX.2.2

Tomo la definicion de capa critica para decidir que lanes merecen primer plano.

### OX.2.3

Tomo la separacion negocio / operacion para evitar lanes comerciales disfrazadas de workflow.

### OX.2.4

Tomo el recorrido cognitivo para ordenar la lectura entre lanes.

### OX.2.5

Tomo la idea de contexto colapsable para que lanes secundarias no compitan con lanes criticas.

### OX.2.6

Tomo la politica de densidad para evitar demasiadas lanes visibles al mismo tiempo.

### OX.2.7

Tomo la logica mobile para asumir que no todos los lanes tienen derecho a vivir arriba en pantallas chicas.

### OX.2.8

Tomo el blueprint consolidado como contrato general: los lanes existen para reforzar fold, no para romperlo.

## Riesgos conceptuales de la arquitectura de lanes

- crear demasiadas lanes y empeorar el scanning
- duplicar filtros y busqueda con lanes mal elegidas
- convertir lanes secundarias en ruido permanente
- hacer que ownership y riesgo compitan en vez de integrarse
- tratar completed / cancelled como workflow vivo cuando son revision
- intentar meter todas las dimensiones al mismo tiempo: estado, metodo, riesgo y assignment
- romper mobile con demasiadas lanes visibles

## Decisiones NO tomadas todavia

OX.3.1 no decide:

- layout final de lanes
- CSS final
- si las lanes seran columnas, tabs, bandas o segmentos
- sticky real
- scroll real entre lanes
- motion
- implementacion realtime
- expresion exacta de lane de riesgo
- expresion exacta de lane de ownership
- breakpoints finales
- cambios en DB

## Confirmacion de alcance

En esta fase no se implementa ni se toca:

- UI
- CSS
- layout
- cards
- KPIs
- insights
- feed
- busqueda
- realtime
- side effects
- DB

## Conclusiones

- los lanes deben nacer desde workflow, riesgo y ownership, no desde taxonomias bonitas
- estado es la base mas solida para lanes primarios
- riesgo y assignment son candidatos fuertes a lanes dominantes o overlays estructurales
- delivery / pickup, completed y cancelled son lanes utiles solo si no compiten con la operacion viva
