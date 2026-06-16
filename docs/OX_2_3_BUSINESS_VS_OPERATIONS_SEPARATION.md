# OX.2.3 - Business vs Operations Separation

## Resumen ejecutivo

OX.2.3 define la separacion conceptual entre operacion viva y contexto de negocio dentro de `/admin/dashboard`. No es un intento de esconder negocio ni de convertir OrderOps en una consola fria. Es una decision de jerarquia: **el negocio debe acompanar a la operacion sin competir contra ella cuando la friccion aprieta**.

La conclusion central es:

- la operacion viva responde accion inmediata
- el contexto de negocio responde lectura del dia
- varias senales actuales son hibridas y cambian de valor segun el estado operacional
- en riesgo o congestion, negocio debe degradarse antes que operacion
- en calma o owner review, negocio puede subir sin secuestrar foco

## Definicion de operacion viva

Operacion viva es la informacion que responde:

- que requiere accion ahora
- que esta frenando flujo
- que pedido mirar
- quien esta operando que
- donde hay riesgo
- como reducir scanning

Ejemplos claros:

- `OPERACION EN VIVO`
- risk indicators V.2
- assignment / ownership
- busqueda de foco
- filtros workflow
- cards
- queue pressure cuando hay friccion

## Definicion de contexto de negocio

Contexto de negocio es la informacion que responde:

- como va el dia
- cuanto se vendio
- que patron comercial aparece
- que producto o metodo domina
- que lectura owner / manager aporta

Ejemplos claros:

- `HOY`
- ventas
- ticket promedio
- mas vendido
- `INSIGHTS DEL NEGOCIO`
- ritmo comercial
- cliente frecuente
- ticket alto si no afecta operacion

## Hibridos

Hay senales que no pertenecen siempre a un solo lado. Cambian de peso segun calma, actividad, congestion o riesgo.

Ejemplos:

- activos
- completados
- delivery / retiro
- cancelados
- preparacion
- throughput
- queue pressure

## Clasificacion de bloques actuales

### Health / realtime / presence

Bloque: Health / realtime / presence  
Categoria: operations supporting  
Usuario principal: operator / manager  
Valor operacional: medio-alto  
Valor comercial: bajo  
Domina cuando: la salud del canal o la sesion afecta confianza operacional  
Acompana cuando: la sesion esta estable  
Se degrada cuando: cards y riesgo ya explican la urgencia  
Mobile behavior: sobrevive como capa minima y silenciosa  
Riesgo: competir con otras pills si gana demasiado peso  
Recomendacion: mantener como soporte tecnico discreto

### Queue pressure

Bloque: Queue pressure  
Categoria: hybrid / state-dependent  
Usuario principal: operator / manager  
Valor operacional: alto bajo carga  
Valor comercial: bajo-medio  
Domina cuando: hay carga, demora o congestion  
Acompana cuando: la operacion esta activa pero estable  
Se degrada cuando: la cola no expresa friccion real  
Mobile behavior: sobrevive solo si aporta lectura de carga  
Riesgo: quedarse visible aun cuando no cambia decisiones  
Recomendacion: tratarlo como senal operacional condicional

### `HOY`

Bloque: `HOY`  
Categoria: business primary  
Usuario principal: owner / manager  
Valor operacional: medio-bajo  
Valor comercial: alto  
Domina cuando: owner review o calma estable  
Acompana cuando: la operacion esta activa pero sin friccion severa  
Se degrada cuando: hay congestion, riesgo o ownership ambiguo  
Mobile behavior: compactado o colapsado  
Riesgo: empujar cards y foco demasiado abajo  
Recomendacion: contexto valioso, pero no capa dominante en estados calientes

### `OPERACION EN VIVO`

Bloque: `OPERACION EN VIVO`  
Categoria: operations primary  
Usuario principal: operator / manager  
Valor operacional: muy alto  
Valor comercial: indirecto  
Domina cuando: hay carga viva, friccion o necesidad de decidir rapido  
Acompana cuando: la operacion esta calma  
Se degrada cuando: casi nunca; solo parte de su expresion visual en calma extrema  
Mobile behavior: debe sobrevivir siempre en forma compacta  
Riesgo: competir con summaries si todos hablan al mismo tiempo  
Recomendacion: ancla operacional principal del dashboard

### `INSIGHTS`

Bloque: `INSIGHTS`  
Categoria: operations supporting  
Usuario principal: operator / manager  
Valor operacional: alto  
Valor comercial: bajo-indirecto  
Domina cuando: sintetiza friccion real que todavia no esta resuelta  
Acompana cuando: riesgo y cards ya cuentan la historia  
Se degrada cuando: repite V.2, feed y summaries  
Mobile behavior: conservar solo lo mas tactico  
Riesgo: duplicar alerta con otras capas  
Recomendacion: soporte sintetico, no voz principal permanente

### `RESUMEN OPERATIVO`

Bloque: `RESUMEN OPERATIVO`  
Categoria: operations supporting  
Usuario principal: operator / manager  
Valor operacional: alto como sintesis  
Valor comercial: bajo  
Domina cuando: logra condensar friccion en una sola lectura corta  
Acompana cuando: cards y riesgo ya son suficientemente claros  
Se degrada cuando: repite insights o calma blanda  
Mobile behavior: mantener solo si reduce scanning  
Riesgo: otra banda narrativa compitiendo antes de la accion  
Recomendacion: mantenerlo como puente tactico, no como discurso paralelo

### `INSIGHTS DEL NEGOCIO`

Bloque: `INSIGHTS DEL NEGOCIO`  
Categoria: business supporting  
Usuario principal: owner / manager  
Valor operacional: bajo  
Valor comercial: medio-alto  
Domina cuando: owner review o calma con interes comercial  
Acompana cuando: la operacion esta activa pero sana  
Se degrada cuando: hay congestion, riesgo o exceso de narrativa  
Mobile behavior: colapsable o diferido  
Riesgo: competir con foco operacional sin exigir accion  
Recomendacion: contexto comercial degradable por definicion

### `ACTIVIDAD RECIENTE`

Bloque: `ACTIVIDAD RECIENTE`  
Categoria: hybrid / state-dependent  
Usuario principal: operator / manager  
Valor operacional: medio-alto cuando aporta evidencia  
Valor comercial: medio-bajo  
Domina cuando: trae evidencia critica o tactica real  
Acompana cuando: solo contextualiza  
Se degrada cuando: se vuelve narrativa repetida o feed contextual debil  
Mobile behavior: quedarse corto y enfocado  
Riesgo: mezclarse con resumen e insights  
Recomendacion: tratarlo como memoria operacional, no como contexto fijo

### Busqueda operacional

Bloque: Busqueda operacional  
Categoria: operations primary  
Usuario principal: operator / manager  
Valor operacional: muy alto  
Valor comercial: bajo  
Domina cuando: reduce scanning y crea foco real  
Acompana cuando: el workflow ya esta claro  
Se degrada cuando: la query esta vacia y el flujo base alcanza  
Mobile behavior: debe sobrevivir como acceso rapido al foco  
Riesgo: sentirse secundaria cuando en realidad es navegacion operativa  
Recomendacion: considerarla parte de la capa de operacion viva

### Chips derivados

Bloque: Chips derivados  
Categoria: hybrid / state-dependent  
Usuario principal: operator / manager  
Valor operacional: medio  
Valor comercial: bajo  
Domina cuando: explican el foco activo sin ambiguedad  
Acompana cuando: solo resumen una query ya entendida  
Se degrada cuando: ocupan demasiado aire visual  
Mobile behavior: compactar primero  
Riesgo: fatiga y ruido por longitud / cantidad  
Recomendacion: soporte de navegacion, no destino visual

### Filtros

Bloque: Filtros  
Categoria: operations primary  
Usuario principal: operator / manager  
Valor operacional: alto  
Valor comercial: bajo-medio  
Domina cuando: estructuran workflow base  
Acompana cuando: la busqueda ya resolvio foco puntual  
Se degrada cuando: contexto secundario esta dominando sin razon  
Mobile behavior: deben sobrevivir al menos en su version base  
Riesgo: competir con lanes futuras si se inflan demasiado  
Recomendacion: tratarlos como navegacion operativa persistente

### Cards

Bloque: Cards  
Categoria: operations primary  
Usuario principal: operator / manager / owner cuando hay friccion  
Valor operacional: maximo  
Valor comercial: indirecto  
Domina cuando: siempre; son la verdad operacional  
Acompana cuando: nunca dejan de ser la referencia principal  
Se degrada cuando: no deberian degradarse, solo compactarse mejor  
Mobile behavior: deben sobrevivir siempre y llegar antes  
Riesgo: enterrarlas bajo contexto o narrativa  
Recomendacion: mantenerlas como superficie principal de decision

### Risk indicators

Bloque: Risk indicators  
Categoria: operations primary  
Usuario principal: operator / manager  
Valor operacional: muy alto  
Valor comercial: indirecto  
Domina cuando: existe friccion real por pedido  
Acompana cuando: el riesgo es leve o contextual  
Se degrada cuando: el riesgo desaparece o es ruido transitorio  
Mobile behavior: sobrevivir siempre en forma compacta  
Riesgo: fatiga si todo se siente riesgoso  
Recomendacion: capa critica, pero con thresholds sobrios

### Assignment

Bloque: Assignment  
Categoria: operations primary  
Usuario principal: operator / manager  
Valor operacional: muy alto bajo multioperador  
Valor comercial: bajo  
Domina cuando: hay ownership gap, congestion o handoff inestable  
Acompana cuando: la responsabilidad esta clara  
Se degrada cuando: la operacion esta calma y ownership estable  
Mobile behavior: sobrevivir en cards y foco de busqueda  
Riesgo: tratarlo como detalle visual menor  
Recomendacion: poner ownership al nivel del estado cuando hay presion

### Highlights

Bloque: Highlights  
Categoria: operations supporting  
Usuario principal: operator  
Valor operacional: alto de corta duracion  
Valor comercial: bajo  
Domina cuando: hay nuevos pedidos o cambios que requieren atencion inmediata  
Acompana cuando: la novedad ya fue reconocida  
Se degrada cuando: la urgencia ya paso  
Mobile behavior: mantenerlos breves y claros  
Riesgo: saturacion si todo queda destacado demasiado tiempo  
Recomendacion: usarlos como senal corta, no como estado cronico

## Clasificacion de KPIs hibridos

KPI: Ventas  
Tipo: business  
Debe dominar cuando: owner review o calma  
Debe acompanar cuando: operacion activa sin friccion severa  
Debe degradarse cuando: congestion o riesgo  
Mobile behavior: compactado  
Recomendacion: contexto comercial claro, no prioridad operacional

KPI: Ticket promedio  
Tipo: business  
Debe dominar cuando: lectura comercial del dia  
Debe acompanar cuando: se quiere contexto de calidad comercial  
Debe degradarse cuando: la operacion aprieta  
Mobile behavior: colapsable  
Recomendacion: mantenerlo fuera del primer plano tactico

KPI: Activos  
Tipo: hybrid  
Debe dominar cuando: expresa carga viva  
Debe acompanar cuando: hay calma o owner review  
Debe degradarse cuando: otros indicadores de carga ya explican la situacion  
Mobile behavior: sobrevivir  
Recomendacion: tratarlo como KPI operacional en estados calientes

KPI: Completados  
Tipo: hybrid  
Debe dominar cuando: owner review o lectura de throughput  
Debe acompanar cuando: la operacion esta activa pero estable  
Debe degradarse cuando: riesgo y congestión exigen foco tactico  
Mobile behavior: compactado  
Recomendacion: throughput contextual, no alarma

KPI: Delivery / Retiro  
Tipo: hybrid  
Debe dominar cuando: el mix afecta staffing o flujo  
Debe acompanar cuando: solo explica patron comercial  
Debe degradarse cuando: no cambia decisiones del momento  
Mobile behavior: comprimir primero  
Recomendacion: no tratarlo como siempre negocio ni siempre operacion

KPI: Mas vendido  
Tipo: business  
Debe dominar cuando: casi nunca dentro del dashboard operativo  
Debe acompanar cuando: owner review en calma  
Debe degradarse cuando: hay cualquier friccion operacional  
Mobile behavior: colapsable  
Recomendacion: candidato claro a contexto pasivo

KPI: Tiempo promedio  
Tipo: operational  
Debe dominar cuando: se desvía o expresa pulso global bajo carga  
Debe acompanar cuando: el valor esta sano  
Debe degradarse cuando: otras senales explican mejor la friccion puntual  
Mobile behavior: sobrevivir en compacto  
Recomendacion: mantener como pulso operacional

KPI: Preparacion  
Tipo: hybrid  
Debe dominar cuando: supera umbral o afecta flujo  
Debe acompanar cuando: esta estable  
Debe degradarse cuando: el valor sano no agrega decision  
Mobile behavior: sobrevivir  
Recomendacion: operacional bajo presion, contextual cuando esta sana

KPI: Estancados  
Tipo: operational  
Debe dominar cuando: existe cualquier volumen relevante  
Debe acompanar cuando: esta en cero o sano  
Debe degradarse cuando: la calma ya quedo explicada por otras senales  
Mobile behavior: sobrevivir siempre  
Recomendacion: una de las pocas senales que casi nunca deberia desaparecer

KPI: Cancelados  
Tipo: hybrid  
Debe dominar cuando: el ratio es anormal o revela friccion comercial / operativa  
Debe acompanar cuando: simplemente contextualiza el dia  
Debe degradarse cuando: esta en cero  
Mobile behavior: compactado  
Recomendacion: volverlo claramente dinamico

KPI: Reasignaciones  
Tipo: hybrid  
Debe dominar cuando: expresa churn real de ownership  
Debe acompanar cuando: hay alguna transferencia aislada  
Debe degradarse cuando: esta en cero  
Mobile behavior: compactado o absorbido por ownership  
Recomendacion: tratarlo como proxy de friccion, no como KPI fijo de primer plano

KPI: Ult. mov.  
Tipo: operational  
Debe dominar cuando: ayuda a leer frenado o ritmo  
Debe acompanar cuando: la operacion esta viva y sana  
Debe degradarse cuando: no hay activos  
Mobile behavior: contextual y corto  
Recomendacion: valor tactico condicional

KPI: Queue pressure  
Tipo: hybrid  
Debe dominar cuando: expresa congestion real  
Debe acompanar cuando: solo confirma carga moderada  
Debe degradarse cuando: no cambia decisiones  
Mobile behavior: solo sobrevivir si agrega foco  
Recomendacion: operacional bajo friccion, prescindible en calma

## Modelo de dominancia operacion vs negocio

### Calm

Negocio puede acompanar mas.  
Operacion mantiene presencia minima y clara.  
La lectura comercial tiene permiso para subir, pero sin desplazar cards ni workflow.

### Active

Operacion domina.  
Negocio acompana en compacto.  
El dashboard debe responder carga y foco antes que performance comercial.

### Congested

Operacion domina fuerte.  
Negocio se degrada.  
Cards, riesgo, ownership y pulso deben absorber el primer segundo.

### Risk

Riesgo + cards + ownership dominan.  
Negocio no debe competir.  
Si negocio cuenta una historia interesante mientras la operacion cuenta una urgente, gana la urgencia.

### Owner review

Negocio puede subir, siempre que no tape friccion operacional.  
El dashboard puede abrir un modo mas equilibrado, no puramente comercial.

## Reglas de degradacion del contexto comercial

1. `INSIGHTS DEL NEGOCIO`  
   - baja primero bajo riesgo o congestion  
   - no debe perderse del todo para owner review  
   - OX.5 deberia comprimirlo a version mas corta o colapsable

2. Mas vendido  
   - baja casi inmediatamente cuando hay presion  
   - no debe perderse en revisiones de calma  
   - OX.5 puede llevarlo a capa pasiva o resumen colapsado

3. Ticket promedio  
   - baja cuando el flujo exige accion  
   - no debe perderse como ancla comercial del dia  
   - OX.5 puede compactarlo junto a otros KPIs comerciales

4. Revenue pace / ventas extendidas  
   - baja cuando hay riesgo activo  
   - no debe desaparecer en owner review  
   - OX.5 puede resumirlo sin ocupar primer plano

5. Mix delivery / retiro si no afecta flujo  
   - baja cuando no cambia staffing ni workflow  
   - no debe perderse si el mix explica una friccion real  
   - OX.5 deberia comprimirlo antes que ocultar una senal operativa relacionada

6. Cliente frecuente si no exige accion  
   - baja cuando es solo insight interesante  
   - no debe perderse si ayuda a una decision manual concreta  
   - OX.5 puede llevarlo a contexto secundario o colapsado

7. Narrativa comercial suave  
   - baja siempre antes que cards, riesgo y ownership  
   - no debe desaparecer solo en calma o lectura owner  
   - OX.5 deberia fusionarla y quitar repeticion

## Reglas de persistencia operacional

- riesgo activo  
  - persiste porque cambia decisiones inmediatas  
  - si se oculta, se rompe confianza operacional  
  - OX.4 debera implementar su dominancia dinamica

- cards criticas  
  - persisten porque son la superficie de accion real  
  - si se ocultan, el dashboard se vuelve capa de resumen sin capacidad de operar  
  - OX.2.4 y OX.3 deberan reforzar su lugar

- ownership gaps  
  - persisten porque reducen scanning y destraban handoff  
  - si se ocultan, crece friccion multioperador  
  - OX.3 y OX.4 deberan resolver su expresion estructural

- busqueda / foco  
  - persiste porque reduce scanning manual  
  - si se oculta, la operacion pierde velocidad  
  - OX.2.4 y OX.5 deberan decidir su forma mas compacta

- filtros workflow  
  - persisten porque estructuran el flujo base  
  - si se ocultan, el dashboard pierde navegacion primaria  
  - OX.2.4 y OX.3 deberan integrarlos con la arquitectura futura

- `OPERACION EN VIVO` esencial  
  - persiste porque ofrece el pulso tactico del sistema  
  - si se oculta, se pierde lectura agregada de flujo  
  - OX.2.4 y OX.6 deberan endurecer su jerarquia

- queue pressure bajo congestion real  
  - persiste porque explica saturacion global  
  - si se oculta, la lectura del estado puede parecer contradictoria  
  - OX.4 debera activarlo solo cuando realmente aporta

## Business context behavior por estado

Estado: Calm  
Business context: puede subir y acompanar con libertad moderada  
Operations context: sigue visible como ancla minima  
Riesgo UX: sobrerreaccionar y dejar una pantalla demasiado vacia

Estado: Active  
Business context: acompana en compacto  
Operations context: domina  
Riesgo UX: dar demasiado aire a negocio y retrasar foco

Estado: Congested  
Business context: se degrada o colapsa  
Operations context: domina fuerte  
Riesgo UX: esconder por completo lectura owner si la degradacion es excesiva

Estado: Risk  
Business context: no compite, queda minimizado  
Operations context: domina con V.2, cards y ownership  
Riesgo UX: convertir todo el tablero en alarma si no hay thresholds sobrios

Estado: Mobile  
Business context: minimo y compacto  
Operations context: priorizado  
Riesgo UX: empujar demasiado abajo las cards con contexto secundario

Estado: Owner review  
Business context: puede subir incluso above-the-fold, sin tapar friccion  
Operations context: sigue presente como salud minima  
Riesgo UX: volver el dashboard demasiado ejecutivo y perder accionabilidad

Estado: Operator rush  
Business context: casi no debe competir  
Operations context: domina por completo  
Riesgo UX: dejar ruido comercial o narrativo en un momento de urgencia

## Respuestas explicitas a preguntas dificiles

1. Ventas importan durante congestion?  
   Si, pero no deben dominar. Durante congestion importan como consecuencia, no como foco de accion.

2. Delivery / retiro es negocio u operacion?  
   Es hibrido. Es negocio cuando describe el dia; es operacion cuando afecta staffing, ritmo o lanes futuras.

3. `HOY` debe vivir arriba siempre?  
   No. Debe seguir existiendo, pero no merece primer plano fijo cuando hay riesgo o congestion.

4. `INSIGHTS DEL NEGOCIO` deben desaparecer bajo riesgo?  
   Deben degradarse fuerte. No necesariamente desaparecer del todo en desktop owner/manager, pero si dejar de competir.

5. Que KPIs comerciales sobreviven en mobile?  
   Solo una lectura minima y compacta: ventas o activos/completados segun contexto, nunca el bloque comercial extendido completo.

6. Que senales operacionales no deben degradarse nunca?  
   Riesgo activo, cards criticas, ownership gaps, foco de busqueda, filtros workflow y `OPERACION EN VIVO` esencial.

7. Que informacion owner necesita sin romper foco operator?  
   Salud general, carga, ventas resumidas, throughput y una lectura de negocio comprimida que no tape cards ni riesgo.

8. Que capa debe dominar cuando negocio y riesgo cuentan historias distintas?  
   Operacion viva. El riesgo manda sobre el contexto comercial.

9. Que se comprime primero?  
   `INSIGHTS DEL NEGOCIO`, narrativa comercial suave, KPIs pasivos y mix delivery/retiro cuando no afectan flujo.

10. Que se mantiene visible siempre?  
    Cards, riesgo, ownership, foco de navegacion y pulso operacional minimo.

## Mobile business / operations behavior

Mobile debe priorizar:

- operacion viva
- riesgo
- ownership
- busqueda / foco
- cards

Mobile puede degradar:

- negocio extendido
- insights comerciales
- KPIs pasivos
- feed contextual
- narrativa suave

Contexto comercial minimo que deberia sobrevivir:

- una lectura muy compacta del dia para owner / manager
- activos o throughput si ayudan a entender carga

Que deberia estar colapsado:

- `INSIGHTS DEL NEGOCIO`
- gran parte de `HOY`
- contexto comercial pasivo

Que no deberia aparecer antes de cards:

- narrativa comercial extendida
- mas vendido
- cliente frecuente sin accion
- feed contextual largo

## Relacion con fases futuras

### OX.2.4 - Dashboard Flow Redesign

Debe usar esta separacion para ordenar el recorrido cognitivo y evitar que negocio se cruce con workflow.

### OX.2.5 - Collapsible Context Layers

Debe usar esta separacion para decidir que contexto comercial queda visible y que pasa a capas colapsables.

### OX.2.6 - Density Balancing

Debe usar esta separacion para ajustar proporciones entre operacion, awareness y negocio.

### OX.3 - Operational Lanes

Debe usar esta separacion para evitar lanes contaminadas por contexto comercial y reforzar lanes de riesgo, ownership y workflow.

### OX.4 - Dynamic Operational Priority

Debe usar esta separacion para degradar negocio cuando aparece riesgo o congestion y para evitar contradicciones entre capas.

### OX.5 - Smart Compression

Debe usar esta separacion para comprimir primero contexto y narrativa comercial, preservando operacion viva.

## Riesgos conceptuales

- esconder demasiado negocio
- convertir dashboard en consola fria solo para operator
- dejar owner sin lectura rapida
- degradar metricas comerciales utiles
- mantener demasiado negocio arriba bajo riesgo
- duplicar senales hibridas
- confundir delivery / retiro como siempre negocio o siempre operacion
- mobile demasiado pobre
- operation layer demasiado intensa

## Decisiones NO tomadas todavia

OX.2.3 no decide:

- layout final
- CSS final
- reorder real
- collapse real
- sticky real
- cambios de componentes
- thresholds dinamicos
- lanes
- parser / search changes
- DB changes
- nueva pagina de analytics

## Conclusiones

- operacion viva y contexto de negocio no compiten por valor, compiten por tiempo y foco
- el error a evitar no es mostrar negocio; es mostrarlo con el mismo peso que friccion y accion
- varias senales hibridas exigen una lectura dependiente del estado, no una clasificacion rigida
- el dashboard futuro debe permitir que owner lea negocio sin romper el primer segundo del operator
