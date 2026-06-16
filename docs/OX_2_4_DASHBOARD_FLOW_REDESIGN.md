# OX.2.4 - Dashboard Flow Redesign

## Resumen ejecutivo del flujo

OX.2.4 no redisenia el dashboard. Define el **recorrido cognitivo completo** que el dashboard futuro deberia facilitar para operators, managers y owners. La pregunta central no es donde vive cada bloque, sino **en que orden deberia ser leido para reducir tiempo de decision y scanning manual**.

La conclusion principal es:

- el flujo debe empezar en salud minima y friccion real
- debe llegar rapido a foco y cards
- debe dejar contexto y narrativa para despues
- debe degradar negocio y calma cuando aparece congestion o riesgo
- debe permitir que owner lea negocio sin secuestrar el primer segundo del operator

En otras palabras: el dashboard no deberia sentirse como una coleccion de widgets, sino como una **cabina operacional con recorrido guiado**.

## Mapa conceptual del fold

### First Attention Zone

La First Attention Zone debe responder en segundos:

- hay riesgo o no
- hay carga viva o no
- quien esta operando que
- donde conviene enfocarse
- que cards merecen atencion

Debe incluir:

- health minima / realtime silencioso
- riesgo activo
- pulso de `OPERACION EN VIVO`
- ownership visible
- foco de navegacion
- acceso temprano a cards

### Que acompana

Puede acompanar sin dominar:

- `INSIGHTS` cuando realmente sintetizan friccion
- `RESUMEN OPERATIVO` cuando reduce scanning
- `ACTIVIDAD RECIENTE` si trae evidencia real
- queue pressure cuando agrega lectura de carga

### Que se difiere

Debe quedar mas abajo o mas tarde en el recorrido:

- `HOY`
- `INSIGHTS DEL NEGOCIO`
- contexto comercial extendido
- feed contextual sin evidencia fuerte

### Que se degrada

Debe bajar primero cuando la operacion aprieta:

- narrativa de calma
- negocio extendido
- KPIs pasivos
- chips derivados largos
- summaries redundantes

## Secuencia de lectura y accion

### Operator scanning path

Recorrido ideal:

1. salud minima del sistema
2. riesgo / friccion
3. ownership gaps
4. foco de navegacion activo
5. cards relevantes
6. evidencia secundaria
7. negocio solo si no bloquea accion

Sentido operacional:

- el operator entra para actuar
- necesita saber rapido si hay algo frenado
- luego necesita encontrar el pedido correcto
- despues puede aceptar contexto tactico

### Owner scanning path

Recorrido ideal:

1. salud general
2. carga y estabilidad
3. negocio resumido
4. friccion operacional si existe
5. cards o feed si hay desvio

Sentido operacional:

- owner entra a leer estado del dia
- pero no puede perder una friccion real si la hay
- por eso negocio puede subir en calma, nunca negar riesgo

### Manager scanning path

Recorrido ideal:

1. carga viva
2. riesgo
3. ownership
4. estado del flujo
5. negocio resumido

Sentido operacional:

- manager necesita coordinar mas que ejecutar cada card
- por eso combina pulso, ownership y negocio

### Mobile scanning path

Recorrido ideal:

1. salud minima
2. riesgo / carga
3. busqueda / foco
4. cards
5. contexto colapsado

Sentido operacional:

- mobile no puede intentar mostrar la misma conversacion completa que desktop
- debe llevar antes a cards y accion

## Clasificacion de bloques segun prioridad

### Critical Operations

- cards
- risk indicators
- assignment / ownership
- `OPERACION EN VIVO` esencial
- busqueda operacional
- filtros workflow
- highlights de nuevos pedidos
- queue pressure si hay friccion

### Tactical Awareness

- `INSIGHTS`
- `RESUMEN OPERATIVO`
- `ACTIVIDAD RECIENTE` cuando aporta evidencia
- health minima
- presence discreta

### Business Context

- `HOY`
- `INSIGHTS DEL NEGOCIO`
- ventas
- ticket promedio
- mix delivery / retiro
- mas vendido

### Passive Narrative

- operacion tranquila repetida
- calma decorativa
- feed contextual debil
- summaries redundantes
- chips largos que solo explican algo ya entendido

## Sticky / Flow / Deferred / Collapsible candidates

### Sticky candidates

- busqueda operacional
- filtros base de workflow
- riesgo sintetico cuando hay friccion sostenida
- modo operacional actual en fases futuras

### Flow candidates

- cards
- `OPERACION EN VIVO`
- resumen tactico critico
- highlights

### Deferred candidates

- `INSIGHTS DEL NEGOCIO`
- `HOY` extendido
- feed contextual
- narrativa pasiva

### Collapsible candidates

- `HOY` completo
- `INSIGHTS DEL NEGOCIO`
- parte de `ACTIVIDAD RECIENTE`
- summaries secundarios
- chips derivados extensos

## Reglas conceptuales de persistencia y degradacion por estado

### Calm

Persiste:

- salud minima
- workflow base
- cards
- negocio resumido

Se degrada:

- alertas innecesarias
- dramatizacion de riesgo leve

### Active

Persiste:

- cards
- foco
- `OPERACION EN VIVO`
- ownership

Se degrada:

- narrativa suave
- negocio extendido

### Congested

Persiste:

- riesgo
- ownership gaps
- queue pressure
- cards afectadas
- foco de navegacion

Se degrada:

- negocio
- summaries largos
- feed contextual
- KPIs pasivos

### Risk

Persiste:

- V.2
- cards criticas
- ownership
- pulso operacional
- una sola sintesis fuerte

Se degrada:

- todo lo no accionable
- calma repetida
- negocio secundario
- narrativa redundante

## Presupuesto de atencion por capa y dispositivo

### Desktop

- Critical Operations: 50%
- Tactical Awareness: 25%
- Business Context: 15%
- Passive Narrative: 10% maximo

Justificacion:

- desktop permite mas contexto
- pero el presupuesto sigue favoreciendo operacion y accion
- el problema actual es que demasiadas capas medias compiten por ese 50%

### Mobile

- Critical Operations: 65%
- Tactical Awareness: 25%
- Business Context: 10%
- Passive Narrative: 0-5%

Justificacion:

- mobile necesita foco brutalmente mas duro
- no alcanza con estrechar el layout: hay que reducir voces

## Condiciones para escalamiento de senales criticas

Una senal critica debe escalar cuando:

- afecta multiples pedidos
- persiste mas alla de una ventana razonable
- bloquea ownership claro
- contradice una lectura de calma
- convierte el scanning manual en trabajo excesivo
- cambia una decision inmediata

Condiciones concretas conceptuales:

- varios `stalled` activos
- regresiones recientes repetidas
- overload de preparacion
- queue pressure sostenido
- varios pedidos sin responsable
- carga alta con ownership ambiguo

Que no deberia escalar:

- ruido transitorio sin impacto
- negocio interesante pero no urgente
- feed narrativo sin evidencia accionable

## Relacion con fases futuras

### OX.2.5 - Collapsible Context Layers

Debe usar este flujo para decidir que aparece tarde o se esconde detras de colapso.

### OX.2.6 - Density Balancing

Debe usar este flujo para redistribuir peso entre accion, awareness y negocio.

### OX.2.7 - Mobile Fold Re-Architecture

Debe usar este flujo para proteger cards, foco y riesgo desde el primer scroll.

### OX.2.8 - Fold Consolidation Blueprint

Debe consolidar lo aprendido al aplicar este recorrido cognitivo al fold real.

### OX.3 - Operational Lanes

Debe usar este flujo para que lanes futuras expresen workflow, riesgo y ownership sin duplicar contexto.

### OX.4 - Dynamic Operational Priority

Debe usar este flujo para definir que sube, que baja y cuando el dashboard cambia de modo.

### OX.5 - Smart Compression

Debe usar este flujo para comprimir primero narrativa, negocio extendido y contexto pasivo.

## Riesgos conceptuales del flujo

- sobreoptimizar para operator y dejar owner sin lectura util
- darle demasiado negocio al owner y tapar friccion real
- mantener demasiadas capas narrativas aunque cambie el orden
- convertir el flujo en algo demasiado dinamico y poco predecible
- hacer sticky demasiadas cosas
- esconder demasiado pronto informacion hibrida valiosa
- dejar mobile demasiado pobre o demasiado cargado
- no resolver contradicciones entre riesgo, summaries y feed

## Decisiones NO tomadas todavia

OX.2.4 no decide:

- layout final
- CSS final
- reorder real de componentes
- sticky real implementado
- collapse real implementado
- breakpoints finales
- thresholds exactos de modos
- lanes reales
- dynamic priority real
- cambios en parser de busqueda
- cambios en realtime
- cambios en DB

## Confirmacion de alcance

En esta fase no se toca:

- layout
- CSS
- cards
- KPIs
- insights
- feed
- busqueda / filtros
- realtime
- side effects
- push / browser notifications
- audio / toast / highlight
- checkout / catalogo
- DB

## Conclusiones

- el dashboard necesita un recorrido cognitivo, no solo una nueva distribucion espacial
- la secuencia correcta es mas importante que la cantidad de bloques
- operacion viva debe abrir la lectura y negocio debe entrar cuando ya no roba accion
- cards siguen siendo el punto de verdad: todo el flujo debe llevar mas rapido hacia ellas
