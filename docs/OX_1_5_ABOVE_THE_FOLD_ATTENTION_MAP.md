# OX.1.5 - Above-the-Fold Attention Map

## Alcance

OX.1.5 es una auditoria documental de la arquitectura de atencion del dashboard. No mueve bloques, no cambia CSS y no toca logica. El objetivo es decidir que merece atencion humana inmediata y que esta ocupando espacio cognitivo premium sin justificarlo.

## Arquitectura actual del fold

En desktop y laptop, el primer impacto del dashboard puede incluir:

1. health / realtime / presence / queue pressure
2. `HOY`
3. `OPERACION EN VIVO`
4. `INSIGHTS`
5. `RESUMEN OPERATIVO`
6. `INSIGHTS DEL NEGOCIO`
7. `ACTIVIDAD RECIENTE`
8. busqueda operacional
9. filtros
10. cards

En tablet y mobile, el mismo orden empuja mas abajo:

1. health / realtime / presence
2. strips de KPIs
3. capas narrativas
4. busqueda y filtros
5. cards

Conclusion inicial:

- el fold ya contiene muchas capas simultaneas
- la consola se siente poderosa, pero tambien cerca del limite de saturacion

## Mapa de atencion visual

### Primer impacto visual

Lo primero que recibe el ojo no siempre es lo mas accionable. Hoy dominan:

- los chips y pills superiores por contraste y ubicacion
- los dos strips de KPIs por volumen horizontal
- las varias capas de texto interpretativo por acumulacion

### Atencion operacional

Deberia concentrarse en:

- riesgo
- carga viva
- ownership
- friccion de flujo

Pero hoy esa lectura compite con:

- contexto comercial
- narrativa de estabilidad
- memoria reciente

### Atencion contextual

La aportan bien:

- `HOY`
- `INSIGHTS DEL NEGOCIO`
- partes del feed

El problema es que a veces ese contexto vive demasiado arriba para estados de riesgo.

### Atencion pasiva

Le corresponde a:

- mas vendido
- ticket alto
- cliente frecuente
- mix delivery / retiro
- ritmo comercial

Hoy varias de esas senales todavia pisan demasiado cerca del foco tactico.

## Jerarquia cognitiva actual

Jerarquia operacional ideal:

1. salud de sesion y riesgo real
2. carga y friccion del workflow
3. ownership / priorizacion de pedidos
4. memoria reciente que explica lo critico
5. contexto comercial

Jerarquia real percibida hoy:

1. health chips y strips superiores
2. KPIs comerciales y operacionales con peso parecido
3. varias capas narrativas simultaneas
4. feed, busqueda y filtros
5. cards reales

Diagnostico:

- la jerarquia cognitiva esta algo aplanada
- el fold intenta servir a owner y operator al mismo tiempo
- eso sube el costo de lectura antes de llegar a la accion

## Analisis por bloque

### Health / realtime / presence

Nombre: Health / realtime / presence  
Tipo: estado tecnico / awareness  
Ubicacion actual: parte superior del dashboard  
Peso visual actual: medio  
Peso cognitivo real: medio  
Usuario principal: operator / manager  
Valor operacional: medio-alto  
Valor comercial: bajo  
Tiempo esperado de lectura: instantaneo  
Compite con: queue pressure, KPIs operacionales  
Problemas detectados: puede robar foco cuando la operacion esta estable  
Problemas de densidad: varios chips pequeños tambien suman carga  
Problemas mobile: ocupan ancho premium muy arriba  
Futuro probable: contextual / degradable  
Recomendacion: mantener como capa tecnica, no como narrativa dominante del negocio

### KPIs `HOY`

Nombre: HOY  
Tipo: KPIs comerciales / mixtos  
Ubicacion actual: arriba del fold, antes de friccion operativa profunda  
Peso visual actual: alto  
Peso cognitivo real: medio para operator, alto para owner  
Usuario principal: owner / manager  
Valor operacional: medio  
Valor comercial: alto  
Tiempo esperado de lectura: rapido  
Compite con: `OPERACION EN VIVO`, `INSIGHTS`, `RESUMEN OPERATIVO`  
Problemas detectados: comparte jerarquia con senales mas urgentes  
Problemas de densidad: suma otra banda horizontal antes de llegar a pedidos  
Problemas mobile: empuja mucho hacia abajo la accion real  
Futuro probable: contextual / comprimible  
Recomendacion: debe seguir visible, pero no siempre con el mismo protagonismo que riesgo y workflow

### KPIs `OPERACION EN VIVO`

Nombre: OPERACION EN VIVO  
Tipo: KPIs operacionales  
Ubicacion actual: arriba del fold, debajo de `HOY`  
Peso visual actual: alto  
Peso cognitivo real: alto  
Usuario principal: operator / manager  
Valor operacional: muy alto  
Valor comercial: medio  
Tiempo esperado de lectura: rapido  
Compite con: `HOY`, `INSIGHTS`, `RESUMEN OPERATIVO`  
Problemas detectados: comparte aire con demasiado contexto narrativo enseguida despues  
Problemas de densidad: puede perder fuerza por acumulacion, no por falta de calidad  
Problemas mobile: sigue siendo muy util, pero con costo de scroll  
Futuro probable: dominante / dinamico  
Recomendacion: esta es una de las capas que mas justifica espacio premium

### INSIGHTS

Nombre: INSIGHTS  
Tipo: sintesis operacional  
Ubicacion actual: debajo de KPIs  
Peso visual actual: medio-alto  
Peso cognitivo real: alto  
Usuario principal: operator / manager  
Valor operacional: alto  
Valor comercial: bajo  
Tiempo esperado de lectura: rapido  
Compite con: `RESUMEN OPERATIVO`, V.2, feed  
Problemas detectados: puede repetir riesgo que ya esta en otras capas  
Problemas de densidad: varias frases cortas compiten con otras frases cortas  
Problemas mobile: agrega scroll textual antes de cards  
Futuro probable: dominante / dinamico  
Recomendacion: buena candidata a capa sintetica principal, pero no deberia duplicar otras voces

### RESUMEN OPERATIVO

Nombre: RESUMEN OPERATIVO  
Tipo: sintesis humana  
Ubicacion actual: debajo de `INSIGHTS`  
Peso visual actual: medio  
Peso cognitivo real: medio-alto  
Usuario principal: owner / manager / operator  
Valor operacional: alto  
Valor comercial: medio  
Tiempo esperado de lectura: rapido  
Compite con: `INSIGHTS`, feed, V.2  
Problemas detectados: puede repetir demasiado la historia dominante  
Problemas de densidad: otra banda narrativa mas antes de filtros y pedidos  
Problemas mobile: suma altura antes de cards  
Futuro probable: contextual / comprimible / dinamico  
Recomendacion: deberia sintetizar, no competir en paralelo con todas las otras capas

### INSIGHTS DEL NEGOCIO

Nombre: INSIGHTS DEL NEGOCIO  
Tipo: awareness comercial  
Ubicacion actual: encima de feed / busqueda / filtros  
Peso visual actual: medio-alto  
Peso cognitivo real: medio-bajo para operator, medio para owner  
Usuario principal: owner  
Valor operacional: bajo  
Valor comercial: medio  
Tiempo esperado de lectura: contextual  
Compite con: resumen, insights, feed  
Problemas detectados: puede empujar pedidos demasiado abajo  
Problemas de densidad: varias frases simultaneas antes de cards  
Problemas mobile: aumenta scroll pre-accion  
Futuro probable: degradable / contextual / colapsable  
Recomendacion: mantener, pero con protagonismo variable segun estado operativo

### ACTIVIDAD RECIENTE

Nombre: ACTIVIDAD RECIENTE  
Tipo: memoria operacional priorizada  
Ubicacion actual: debajo de insights del negocio  
Peso visual actual: medio  
Peso cognitivo real: medio-alto  
Usuario principal: operator / manager  
Valor operacional: alto cuando trae evidencia real  
Valor comercial: medio-bajo  
Tiempo esperado de lectura: rapido / contextual  
Compite con: resumen, insights, riesgo  
Problemas detectados: puede sumar mas narrativa que evidencia  
Problemas de densidad: otra capa fuerte antes de cards  
Problemas mobile: empuja busqueda, filtros y pedidos hacia abajo  
Futuro probable: dinamico / colapsable / comprimible  
Recomendacion: buen bloque, pero no siempre merece el mismo peso arriba del fold

### Busqueda operacional

Nombre: Busqueda operacional  
Tipo: navegacion tactica  
Ubicacion actual: debajo del feed  
Peso visual actual: medio  
Peso cognitivo real: alto  
Usuario principal: operator / manager  
Valor operacional: alto  
Valor comercial: bajo  
Tiempo esperado de lectura: instantaneo si ya se usa, contextual si no  
Compite con: filtros y scanning manual  
Problemas detectados: llega relativamente tarde para una herramienta de foco  
Problemas de densidad: sumada a chips y filtros aumenta la pared de controles  
Problemas mobile: alto valor, pero puede quedar demasiado abajo  
Futuro probable: dominante / dinamico  
Recomendacion: una herramienta de foco tan fuerte deberia cuidarse mejor en el fold

### Filtros

Nombre: Filtros  
Tipo: navegacion persistente  
Ubicacion actual: debajo de la busqueda  
Peso visual actual: medio  
Peso cognitivo real: alto  
Usuario principal: operator / manager  
Valor operacional: alto  
Valor comercial: bajo  
Tiempo esperado de lectura: instantaneo  
Compite con: busqueda, feed y scanning visual  
Problemas detectados: quedan demasiado abajo despues de demasiadas capas previas  
Problemas de densidad: suman scroll horizontal y decision extra  
Problemas mobile: faciles de empujar fuera del primer impacto  
Futuro probable: dominante / comprimible  
Recomendacion: el acceso al workflow no deberia quedar enterrado por contexto narrativo

### Cards

Nombre: Cards de pedido  
Tipo: superficie operativa principal  
Ubicacion actual: despues de todas las capas de contexto  
Peso visual actual: alto, pero tardio  
Peso cognitivo real: muy alto  
Usuario principal: operator / manager  
Valor operacional: maximo  
Valor comercial: medio  
Tiempo esperado de lectura: instantaneo y continuo  
Compite con: todo lo que esta arriba  
Problemas detectados: llegan demasiado abajo respecto del valor real  
Problemas de densidad: la informacion util vive aqui, pero el fold la retrasa  
Problemas mobile: principal victima del exceso de capas  
Futuro probable: dominante  
Recomendacion: la consola deberia llevar antes hacia cards, no despues de tantas interpretaciones

### Highlights / chips de riesgo / assignment visible

Nombre: Highlights / chips de riesgo / assignment  
Tipo: senal in-card  
Ubicacion actual: dentro de cards  
Peso visual actual: medio  
Peso cognitivo real: alto  
Usuario principal: operator / manager  
Valor operacional: muy alto  
Valor comercial: bajo  
Tiempo esperado de lectura: instantaneo  
Compite con: summaries y feed que cuentan lo mismo desde arriba  
Problemas detectados: a veces la narrativa superior roba atencion a la evidencia concreta de card  
Problemas de densidad: baja dentro de la card, alta por competencia externa  
Problemas mobile: son de las pocas senales que realmente sobreviven bien  
Futuro probable: dominante / dinamico  
Recomendacion: estas senales merecen prioridad operacional real

## Heavy attention blocks

Bloques que solo deberian dominar cuando de verdad importa:

- riesgo operacional V.2
- KPIs `OPERACION EN VIVO`
- `INSIGHTS` cuando expresan friccion real
- cards con chips de riesgo / assignment / highlights
- busqueda activa si el operador ya esta focalizando algo critico

## Medium attention blocks

- `RESUMEN OPERATIVO`
- `ACTIVIDAD RECIENTE` cuando trae evidencia util
- filtros activos
- health / realtime / presence
- queue pressure

## Light attention blocks

- `HOY`
- `INSIGHTS DEL NEGOCIO`
- mas vendido
- ticket alto
- cliente frecuente
- mix delivery / retiro

## Noise / competitive attention blocks

- demasiados strips antes de cards
- demasiadas capas de texto interpretativo seguidas
- health + KPIs + insights + resumen + negocio + feed antes de navegacion y cards
- chips y pills superiores que compiten con foco operacional real

## Scanning path esperado

### Operador

Idealmente deberia recorrer:

1. salud tecnica minima
2. riesgo / friccion
3. carga viva
4. ownership / foco
5. cards
6. memoria reciente
7. contexto comercial

### Recorrido percibido hoy

1. pills superiores
2. KPIs comerciales
3. KPIs operacionales
4. varias capas narrativas
5. feed
6. busqueda y filtros
7. cards

Problemas detectados:

- loops visuales entre strips y bandas narrativas
- salto tardio hacia la superficie operativa real
- scanning redundante: varias capas cuentan la misma historia antes de llegar al pedido

## Owner vs operator

### Que mira primero un operator

- pendientes
- preparing
- riesgo
- nuevos
- sin responsable

### Que mira primero un owner

- ritmo
- ventas
- completados
- estabilidad general
- congestion

### Hallazgo

- el fold actual intenta satisfacer a ambos al mismo tiempo
- eso da riqueza, pero tambien mete ruido
- futuro probable: prioridad contextual o degradacion dinamica segun estado operacional

## Densidad del fold

Diagnostico:

- hay mucha informacion antes de llegar a cards
- no parece un dashboard roto; parece una consola muy capaz con demasiadas capas simultaneas
- el principal riesgo no es falta de aire, sino demasiadas decisiones cognitivas antes de la accion

Clasificacion:

- desktop / laptop: densidad alta, cerca del limite sano
- mobile: densidad toxica si no se degrada contexto

## Mobile fold audit

En mobile deberian sobrevivir arriba:

- salud minima
- foco operativo
- una sola capa sintetica fuerte
- busqueda o acceso a foco
- cards

Deberian degradarse primero:

- `INSIGHTS DEL NEGOCIO`
- parte del feed contextual
- narrativa de calma
- parte de `HOY` si la operacion esta caliente

Lo que mas empuja pedidos demasiado abajo:

- acumulacion de strips
- varias bandas de texto interpretativo
- feed completo antes de busqueda y filtros

Lo que mas rompe scanning tactico:

- cambio constante de lenguaje entre KPI, insight, summary, feed y controles

## Respuestas explicitas

1. Que deberia ver el operador en menos de 2 segundos  
   Riesgo, carga viva, ownership y cards relevantes.

2. Que deberia ver el owner en menos de 2 segundos  
   Salud general, carga, ventas y senales de congestion.

3. Que deberia entenderse en menos de 5 segundos  
   Si la operacion esta caliente o estable, donde esta la friccion y donde actuar primero.

4. Que bloques compiten innecesariamente  
   `INSIGHTS`, `RESUMEN OPERATIVO`, `INSIGHTS DEL NEGOCIO` y `ACTIVIDAD RECIENTE` cuando todos hablan a la vez.

5. Que bloques gritan demasiado  
   Las varias bandas narrativas acumuladas y, a veces, el peso conjunto de strips mas chips superiores.

6. Que bloques estan ocupando espacio premium sin justificarlo  
   Parte de `INSIGHTS DEL NEGOCIO`, partes contextuales del feed y narrativa repetida de calma.

7. Que bloques deberian degradarse cuando hay riesgo  
   `HOY` comercial, `INSIGHTS DEL NEGOCIO`, feed contextual y narrativas de estabilidad.

8. Que bloques deberian escalar dinamicamente  
   `OPERACION EN VIVO`, V.2, `INSIGHTS` operacionales, busqueda de foco y senales in-card.

9. Que bloques deberian desaparecer primero en mobile  
   contexto comercial, feed contextual y narrativa redundante.

10. Que bloques deberian sobrevivir siempre en mobile  
    riesgo, carga, foco de navegacion y cards.

11. Que bloques fragmentan el scanning  
    la secuencia de muchas bandas distintas antes de llegar al trabajo real.

12. Que bloques interrumpen foco operacional  
    capas contextuales o comerciales cuando el operador necesita workflow y riesgo.

13. El dashboard transmite  
    hoy transmite mas una consola operacional poderosa, pero con riesgo de sentirse como coleccion de widgets en estados de alta densidad.

14. Que informacion merece prioridad comercial  
    `HOY`, ventas, ticket promedio, completados y contexto de negocio.

15. Que informacion merece prioridad operacional  
    riesgo, `OPERACION EN VIVO`, ownership, nuevos pedidos y cards activas.

## Recomendaciones para OX.2 / OX.4 / OX.5 / OX.6

### OX.2 - Fold Re-Architecture

- llevar mas rapido al operador desde salud minima hacia foco y cards
- separar mejor lo comercial de lo tactico
- reducir cantidad de capas simultaneas antes de la accion

### OX.4 - Dynamic Operational Priority

- riesgo, carga y ownership deben dominar cuando hay friccion
- negocio, calma y contexto deben degradarse automaticamente en estados calientes

### OX.5 - Smart Compression

- comprimir primero:
  - `INSIGHTS DEL NEGOCIO`
  - partes contextuales del feed
  - narrativa repetida
  - chips y strips secundarios

### OX.6 - Visual Polish System

- una jerarquia visual mas dura entre:
  - foco critico
  - tactico
  - contextual
  - pasivo
- el ritmo visual debe sentirse como consola operacional, no muro de widgets

## Definicion final

### Que debe dominar el fold

- riesgo real
- carga viva
- foco de navegacion
- acceso rapido a cards y ownership

### Que debe acompanar

- resumen sintetico
- feed como evidencia util
- salud tecnica minima

### Que debe degradarse

- narrativa repetida
- contexto comercial en estados calientes
- insights de negocio y feed contextual cuando empujan demasiado abajo la accion

## Conclusiones

- el fold actual no esta mal por falta de calidad, sino por exceso de simultaneidad
- hay demasiadas capas queriendo ser importantes al mismo tiempo
- la siguiente decision no es embellecer, sino decidir quien merece el primer segundo de atencion humana
