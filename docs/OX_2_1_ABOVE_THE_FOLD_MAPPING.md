# OX.2.1 - Above-the-Fold Mapping

## Resumen ejecutivo

OX.2.1 inaugura OX.2 con una definicion arquitectonica del fold futuro. No decide UI exacta ni cambia layout. Decide **que merece vivir arriba**, **que puede acompanar**, **que debe degradarse** y **que no deberia secuestrar el primer impacto cognitivo**.

La conclusion central es:

- el fold de OrderOps no debe ser definido solo por lo visible sin scroll
- debe ser definido por lo que el operador entiende y decide en los primeros segundos
- el fold futuro debe priorizar:
  1. salud minima
  2. riesgo / carga viva
  3. foco de navegacion
  4. acceso rapido a cards
  5. contexto secundario

## Definicion de above-the-fold para OrderOps

En OrderOps, above-the-fold no es solo la zona visible sin scroll. Es:

- el primer impacto cognitivo
- el primer camino de scanning
- la zona donde el operador entiende que pasa
- la zona donde el operador decide que hacer
- la zona que no debe ser secuestrada por contexto secundario

Above-the-fold ideal debe responder en menos de 3 segundos:

- la sesion esta sana o no
- hay riesgo o no
- donde esta la friccion
- donde empiezo a operar

Y debe evitar que compitan arriba:

- calma narrativa repetida
- negocio secundario
- feed contextual debil
- chips largos
- KPIs pasivos

## Mapa actual del fold

Orden aproximado actual:

1. health / realtime / presence
2. queue pressure
3. `HOY`
4. `OPERACION EN VIVO`
5. `INSIGHTS`
6. `RESUMEN OPERATIVO`
7. `INSIGHTS DEL NEGOCIO`
8. `ACTIVIDAD RECIENTE`
9. busqueda operacional
10. filtros
11. cards

Que domina hoy:

- strips y pills por ubicacion
- varias bandas narrativas consecutivas

Que llega tarde:

- busqueda como foco
- filtros como workflow
- cards como verdad operacional

Que compite:

- `INSIGHTS`
- `RESUMEN OPERATIVO`
- `INSIGHTS DEL NEGOCIO`
- `ACTIVIDAD RECIENTE`

Que genera scanning pre-card:

- demasiadas capas antes del trabajo real

Que se vuelve toxico en mobile:

- la suma de strips, narrativa, feed, busqueda y filtros antes de cards

## Mapa futuro recomendado

### 1. Minimal System Health

Debe incluir:

- realtime status
- presence minima
- queue pressure solo si aporta

Rol:

- confirmar que la estacion esta viva
- no convertirse en la historia principal del negocio

### 2. Critical Operations

Debe incluir:

- riesgo activo
- carga viva
- ownership
- foco de navegacion
- cards relevantes
- `OPERACION EN VIVO` esencial

Rol:

- dominar el primer segundo cuando hay friccion

### 3. Tactical Awareness

Debe incluir:

- una sintesis operacional fuerte
- feed solo si trae evidencia real
- busqueda / filtros como foco

Rol:

- ayudar a decidir, no competir con cards

### 4. Business Context

Debe incluir:

- `HOY`
- `INSIGHTS DEL NEGOCIO`
- parte del contexto comercial

Rol:

- acompanar
- degradarse bajo riesgo o congestion

### 5. Passive Narrative

Debe incluir:

- calma repetida
- contexto suave
- feed contextual debil

Rol:

- no deberia vivir arriba salvo calma extrema

## First Attention Zone

### Riesgo operacional

Elemento: Riesgo operacional  
Debe estar en First Attention Zone: si  
Motivo: define prioridad tactica inmediata  
Condicion: riesgo activo, regresion, estancamiento, demora  
Riesgo: repetirlo en demasiadas capas

### Carga viva

Elemento: `OPERACION EN VIVO` esencial  
Debe estar en First Attention Zone: si  
Motivo: da pulso real del tablero  
Condicion: operacion activa o congestion  
Riesgo: compartir demasiado peso con contexto comercial

### Ownership

Elemento: assignment / sin responsable / mios  
Debe estar en First Attention Zone: si  
Motivo: reduce scanning manual y destraba accion  
Condicion: operacion multioperador  
Riesgo: quedar enterrado bajo contexto narrativo

### Foco de navegacion

Elemento: busqueda y filtros base  
Debe estar en First Attention Zone: si  
Motivo: transforma scanning en foco  
Condicion: siempre, sobre todo bajo presion  
Riesgo: aparecer demasiado abajo del feed y summaries

### Cards

Elemento: cards relevantes  
Debe estar en First Attention Zone: si  
Motivo: son la verdad operacional  
Condicion: siempre  
Riesgo: llegar demasiado tarde por acumulacion de capas

### Calma narrativa

Elemento: operacion estable / tranquila  
Debe estar en First Attention Zone: no  
Motivo: no habilita accion  
Condicion: solo calma extrema y sin riesgo  
Riesgo: ocupar espacio premium sin justificarlo

### Business insights largos

Elemento: `INSIGHTS DEL NEGOCIO`  
Debe estar en First Attention Zone: condicional  
Motivo: sirven a owner, no al operador bajo friccion  
Condicion: calma o lectura comercial  
Riesgo: desplazar riesgo, foco y cards

## Scanning paths por rol

### Operator

1. riesgo / carga
2. ownership
3. foco de navegacion
4. cards
5. evidencia secundaria
6. negocio si hace falta

### Owner

1. salud general
2. carga / estabilidad
3. negocio resumido
4. friccion operacional
5. cards o feed si hay problema

### Manager

1. carga
2. riesgo
3. ownership
4. estado de flujo
5. negocio resumido

### Mobile

1. salud minima
2. riesgo / carga
3. busqueda / foco
4. cards
5. contexto colapsado

## Attention budget

### Desktop

- Critical Operations: 50%
- Tactical Awareness: 25%
- Business Context: 15%
- Passive Narrative: 10% maximo

Por que:

- el tablero debe ser operacional primero
- el negocio sigue visible, pero subordinado
- la narrativa debe tener presupuesto controlado

Que viola el budget hoy:

- demasiada superficie compartida entre tactical awareness, business context y passive narrative

### Mobile

- Critical Operations: 65%
- Tactical Awareness: 25%
- Business Context: 10%
- Passive Narrative: 0-5%

Por que:

- mobile tiene menos tolerancia a capas
- cards y foco deben llegar mucho antes

Que viola el budget hoy:

- demasiados bloques contextuales y narrativos antes de la accion

## Clasificacion de bloques

### Health / realtime / presence

Bloque: Health / realtime / presence  
Clasificacion: ABOVE-FOLD CONDITIONAL  
Debe estar arriba cuando: siempre como salud minima  
Debe bajar cuando: no deberia bajar del todo, pero si perder protagonismo  
Puede ser sticky: no  
Puede colapsarse: parcialmente  
Riesgo: robar foco si ya esta sano  
Recomendacion: salud minima siempre; narrativa tecnica nunca

### Queue pressure

Bloque: Queue pressure  
Clasificacion: ABOVE-FOLD CONDITIONAL  
Debe estar arriba cuando: aporta friccion real  
Debe bajar cuando: no hay cola relevante  
Puede ser sticky: no  
Puede colapsarse: si  
Riesgo: ruido si se muestra siempre  
Recomendacion: claramente dinamico

### HOY

Bloque: `HOY`  
Clasificacion: COLLAPSIBLE CONTEXT  
Debe estar arriba cuando: owner-centric o calma  
Debe bajar cuando: riesgo / congestion  
Puede ser sticky: no  
Puede colapsarse: si  
Riesgo: desplazar cards y foco  
Recomendacion: contexto visible, no dominante

### OPERACION EN VIVO

Bloque: `OPERACION EN VIVO`  
Clasificacion: ABOVE-FOLD CRITICAL  
Debe estar arriba cuando: siempre  
Debe bajar cuando: no deberia bajar fuera del fold critico  
Puede ser sticky: condicional  
Puede colapsarse: parcialmente en calma  
Riesgo: competir con demasiadas voces narrativas  
Recomendacion: ancla operacional del fold

### INSIGHTS

Bloque: `INSIGHTS`  
Clasificacion: ABOVE-FOLD CONDITIONAL  
Debe estar arriba cuando: sintetiza friccion principal  
Debe bajar cuando: repite lo que ya cuentan V.2 y cards  
Puede ser sticky: no  
Puede colapsarse: si  
Riesgo: duplicacion semantica  
Recomendacion: una voz sintetica fuerte, no una capa mas

### RESUMEN OPERATIVO

Bloque: `RESUMEN OPERATIVO`  
Clasificacion: ABOVE-FOLD CONDITIONAL  
Debe estar arriba cuando: resume de verdad  
Debe bajar cuando: solo repite insights  
Puede ser sticky: no  
Puede colapsarse: si  
Riesgo: sumar otra voz media  
Recomendacion: sintetizar o degradarse

### INSIGHTS DEL NEGOCIO

Bloque: `INSIGHTS DEL NEGOCIO`  
Clasificacion: DEFERRED / SECONDARY  
Debe estar arriba cuando: calma o lectura owner  
Debe bajar cuando: riesgo o congestion  
Puede ser sticky: no  
Puede colapsarse: si  
Riesgo: robar espacio premium  
Recomendacion: contexto comercial degradable

### ACTIVIDAD RECIENTE

Bloque: `ACTIVIDAD RECIENTE`  
Clasificacion: ABOVE-FOLD CONDITIONAL  
Debe estar arriba cuando: trae evidencia fuerte  
Debe bajar cuando: es contexto o repeticion  
Puede ser sticky: no  
Puede colapsarse: si  
Riesgo: competir con summary e insights  
Recomendacion: evidencia arriba, contexto abajo

### Busqueda operacional

Bloque: Busqueda operacional  
Clasificacion: ABOVE-FOLD CRITICAL  
Debe estar arriba cuando: siempre que ayude a foco  
Debe bajar cuando: nunca demasiado  
Puede ser sticky: si  
Puede colapsarse: no del todo  
Riesgo: quedar demasiado abajo del feed  
Recomendacion: gran candidata a sticky / foco

### Chips derivados

Bloque: Chips derivados  
Clasificacion: COLLAPSIBLE CONTEXT  
Debe estar arriba cuando: ayudan a entender una query compleja  
Debe bajar cuando: solo agregan ruido  
Puede ser sticky: no  
Puede colapsarse: si  
Riesgo: longitud y ruido visual  
Recomendacion: compresion temprana

### Filtros

Bloque: Filtros  
Clasificacion: ABOVE-FOLD CRITICAL  
Debe estar arriba cuando: sostienen workflow base  
Debe bajar cuando: no mucho; pueden comprimirse  
Puede ser sticky: si  
Puede colapsarse: parcialmente  
Riesgo: perder foco si quedan enterrados  
Recomendacion: componente de navegacion principal

### Cards

Bloque: Cards  
Clasificacion: FLOW CANDIDATE  
Debe estar arriba cuando: siempre lo antes posible  
Debe bajar cuando: no deberian quedar demasiado abajo  
Puede ser sticky: no  
Puede colapsarse: no  
Riesgo: contexto los retrase demasiado  
Recomendacion: eje del flujo operativo

### Risk indicators

Bloque: Risk indicators  
Clasificacion: ABOVE-FOLD CRITICAL  
Debe estar arriba cuando: hay riesgo real  
Debe bajar cuando: no hay riesgo  
Puede ser sticky: condicional  
Puede colapsarse: si en calma  
Riesgo: repetirse demasiado  
Recomendacion: lider tactico bajo friccion

### Assignment

Bloque: Assignment  
Clasificacion: ABOVE-FOLD CONDITIONAL  
Debe estar arriba cuando: ownership es parte del problema  
Debe bajar cuando: la operacion es individual o estable  
Puede ser sticky: condicional  
Puede colapsarse: parcialmente  
Riesgo: convertirse en otra fuente de scanning  
Recomendacion: ownership visible cuando aporta

### Highlights

Bloque: Highlights  
Clasificacion: FLOW CANDIDATE  
Debe estar arriba cuando: senalan nuevos pedidos o retornos hidden  
Debe bajar cuando: expira la senal  
Puede ser sticky: no  
Puede colapsarse: no aplica  
Riesgo: ninguno fuerte  
Recomendacion: senal de accion inmediata dentro del flujo

## Sticky candidates

- busqueda operacional
- filtros base
- senal critica de riesgo
- modo operacional actual

## Flow candidates

- cards
- `OPERACION EN VIVO`
- resumen critico
- highlights

## Deferred candidates

- `INSIGHTS DEL NEGOCIO`
- feed contextual
- narrativa pasiva
- KPIs pasivos

## Collapsible candidates

- `HOY` completo
- `INSIGHTS DEL NEGOCIO`
- feed contextual
- summaries secundarios
- chips derivados largos

## Fold modes

### Calm Mode

Modo: Calm Mode  
Domina: salud minima, contexto comercial moderado, una sintesis suave  
Acompana: cards, feed ligero  
Se degrada: alertas innecesarias  
Se difiere: ownership sobredimensionado, contexto redundante  
Riesgo UX: sentirse demasiado tibio si aparece una friccion real

### Active Mode

Modo: Active Mode  
Domina: workflow, carga, foco, cards  
Acompana: resumen operacional corto, feed de evidencia  
Se degrada: negocio secundario, narrativa larga  
Se difiere: calma repetida  
Riesgo UX: seguir cargando demasiado contexto arriba

### Congested Mode

Modo: Congested Mode  
Domina: riesgo, ownership, operaciones en vivo, cards  
Acompana: feed evidencia, busqueda de foco  
Se degrada: negocio, calma, contexto suave  
Se difiere: feed contextual y KPIs pasivos  
Riesgo UX: volver la consola demasiado tensa si no hay jerarquia clara

### Risk Mode

Modo: Risk Mode  
Domina: V.2, cards, una sintesis critica unica, `OPERACION EN VIVO`  
Acompana: feed solo como evidencia  
Se degrada: negocio, calma, feed contextual, narrative duplicada  
Se difiere: pasivos y negocio  
Riesgo UX: repetir riesgo en multiples capas

### Mobile Mode

Modo: Mobile Mode  
Domina: salud minima, riesgo / carga, busqueda / foco, cards  
Acompana: contexto colapsado  
Se degrada: negocio y narrativa  
Se difiere: casi todo lo pasivo  
Riesgo UX: convertir mobile en version pobre si se degrada sin criterio

## Fold compression candidates

1. `INSIGHTS DEL NEGOCIO`  
   Por que: contexto valioso pero secundario  
   Que no debe perderse: lectura comercial del dia  
   Fase futura: OX.5

2. Feed contextual  
   Por que: no debe competir con evidencia critica  
   Que no debe perderse: memoria reciente util  
   Fase futura: OX.5

3. Narrativa repetida de calma  
   Por que: roba espacio premium  
   Que no debe perderse: una sola senal de estabilidad  
   Fase futura: OX.5 / OX.6

4. Chips derivados largos  
   Por que: cargan mucho la zona de foco  
   Que no debe perderse: traduccion de la query  
   Fase futura: OX.5

5. `HOY` pasivo  
   Por que: parte del contexto comercial no es tactico  
   Que no debe perderse: lectura owner  
   Fase futura: OX.5

6. Summaries redundantes  
   Por que: multiplican voces  
   Que no debe perderse: sintesis humana clara  
   Fase futura: OX.5 / OX.6

## Relacion con OX.2.2 a OX.2.8

### OX.2.2 - Critical Operations Layer

Debe usar este mapa para definir la capa critica real:

- riesgo
- carga
- ownership
- foco
- cards

### OX.2.3 - Business vs Operations Separation

Debe usar este mapa para:

- separar el contexto comercial del tactico
- evitar que `HOY` compita con la accion

### OX.2.4 - Dashboard Flow Redesign

Debe usar este mapa para:

- ordenar el recorrido operator / manager / owner
- reducir scanning pre-card

### OX.2.5 - Collapsible Context Layers

Debe usar este mapa para:

- decidir que colapsar
- diferir negocio, feed contextual y narrativa suave

### OX.2.6 - Density Balancing

Debe usar este mapa para:

- ajustar proporciones
- bajar el numero de bloques de peso medio

### OX.2.7 - Mobile Fold Re-Architecture

Debe usar este mapa para:

- tratar mobile como experiencia propia
- priorizar foco y cards antes que contexto

### OX.2.8 - Fold Consolidation Blueprint

Debe consolidar:

- lo aprendido en arquitectura
- lo probado en desktop y mobile
- lo que realmente quedara sticky, flow o colapsable

## Riesgos conceptuales

- sobreoptimizar para operator y matar lectura owner
- subir cards sin suficiente contexto y empobrecer negocio
- dejar negocio demasiado oculto
- hacer sticky demasiadas cosas
- volver el fold demasiado dinamico e inestable
- comprimir senales criticas por error
- convertir mobile en una version pobre
- crear un fold tenso incluso en calma

## Decisiones NO tomadas todavia

OX.2.1 no decide todavia:

- layout final
- CSS final
- componentes exactos a mover
- sticky real
- breakpoint final
- thresholds de modo
- implementacion de collapse
- reorder real
- cambios en busqueda / filtros
- cambios en realtime

## Conclusiones

- OX.2.1 deja definido que el fold futuro no debe ser una coleccion de bloques visibles, sino una zona de decision operacional
- la prioridad ya no es sumar inteligencia, sino ordenar quien vive arriba, quien acompana y quien espera
- con este mapa, OX.2.2 ya puede construir la Critical Operations Layer sin improvisar
