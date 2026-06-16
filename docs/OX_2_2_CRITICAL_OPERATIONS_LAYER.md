# OX.2.2 - Critical Operations Layer

## Resumen ejecutivo

OX.2.2 define la columna vertebral operacional del dashboard. No diseña UI, no mueve componentes y no crea lanes reales. Define **qué manda cuando la operación está viva**.

La decisión principal es:

- la capa crítica no es una colección de métricas
- es la superficie que responde instantáneamente:
  - qué requiere acción
  - qué está bloqueando flujo
  - qué está en riesgo
  - quién está operando qué
  - dónde hay congestión
  - qué pedidos requieren atención humana inmediata

La Critical Operations Layer de OrderOps debe estar construida sobre cinco ejes:

1. riesgo
2. carga viva
3. ownership
4. navegación de foco
5. cards como verdad operacional

## Definición de Critical Operations Layer

La Critical Operations Layer es la capa del dashboard que permite responder instantáneamente:

- qué requiere acción
- qué está bloqueando flujo
- qué está en riesgo
- quién está operando qué
- dónde hay congestión
- qué pedidos requieren atención humana inmediata

No debe ser:

- BI
- dashboard ejecutivo
- centro de notificaciones
- feed social
- analytics wall

Sí debe ser:

- cabina operacional
- superficie de decisión
- capa táctica viva

## Señales críticas del sistema

### CRITICAL

- stalled orders
- regressions
- congestion
- high queue pressure
- no ownership
- overdue preparation
- many active orders bajo carga
- risk escalation

### TACTICAL

- active throughput
- pending / preparing / ready balance
- movimiento operacional reciente relevante
- operator activity
- focused navigation

### CONTEXTUAL

- delivery / retiro mix
- revenue pace
- ticket average
- best seller
- calm summaries

### PASSIVE

- narrative repetition
- decorative calm
- redundant summaries
- contextual feed noise

## Señales auditadas

### Stalled orders

Señal: stalled orders  
Clasificación: critical  
Usuario principal: operator / manager  
Debe dominar cuando: hay pedidos activos sin movimiento sostenido  
Debe degradarse cuando: no hay estancados  
Persistencia recomendada: persistente hasta resolución  
Valor operacional: muy alto  
Valor comercial: indirecto  
Riesgo de ruido: medio si el umbral es demasiado sensible  
Riesgo de invisibilización: altísimo si queda enterrado en narrativa  
Viewport crítico: mobile  
Recomendación: una de las señales rectoras del sistema

### Regressions

Señal: regressions  
Clasificación: critical  
Usuario principal: operator / manager  
Debe dominar cuando: un pedido vuelve a estado previo o se agrupan regresiones  
Debe degradarse cuando: no hay regresiones recientes  
Persistencia recomendada: persistente mientras siga siendo evidencia útil o riesgo activo  
Valor operacional: alto  
Valor comercial: indirecto  
Riesgo de ruido: medio  
Riesgo de invisibilización: alto  
Viewport crítico: mobile  
Recomendación: crítica, pero evitar repetirla en demasiadas capas

### Congestion

Señal: congestion / high load  
Clasificación: critical  
Usuario principal: manager / operator  
Debe dominar cuando: carga viva, cola y fricción superan el estado normal  
Debe degradarse cuando: la carga vuelve a rango sano  
Persistencia recomendada: persistente mientras dure la congestión  
Valor operacional: muy alto  
Valor comercial: indirecto  
Riesgo de ruido: medio  
Riesgo de invisibilización: alto  
Viewport crítico: desktop y mobile  
Recomendación: señal sistémica que debe ordenar el resto del fold

### High queue pressure

Señal: high queue pressure  
Clasificación: critical  
Usuario principal: manager / operator  
Debe dominar cuando: realmente cambia el ritmo de decisiones  
Debe degradarse cuando: solo aporta contexto menor  
Persistencia recomendada: contextual persistente mientras exista presión  
Valor operacional: alto  
Valor comercial: bajo  
Riesgo de ruido: alto si aparece siempre  
Riesgo de invisibilización: medio  
Viewport crítico: mobile  
Recomendación: tratarlo como acelerador de criticidad, no como KPI fijo

### No ownership / ownership gaps

Señal: no ownership / sin responsable  
Clasificación: critical  
Usuario principal: operator / manager  
Debe dominar cuando: hay carga y pedidos sin responsable  
Debe degradarse cuando: la operación es individual o la asignación está clara  
Persistencia recomendada: persistente hasta asignación  
Valor operacional: muy alto  
Valor comercial: bajo  
Riesgo de ruido: medio  
Riesgo de invisibilización: muy alto porque hoy depende de scanning o búsqueda  
Viewport crítico: mobile  
Recomendación: ownership libre debe poder ganar foco real

### Overdue preparation

Señal: overdue preparation  
Clasificación: critical  
Usuario principal: operator / manager  
Debe dominar cuando: preparar ya excede referencia útil  
Debe degradarse cuando: la preparación vuelve a rango esperado  
Persistencia recomendada: persistente mientras dure el desvío  
Valor operacional: alto  
Valor comercial: indirecto  
Riesgo de ruido: medio  
Riesgo de invisibilización: alto  
Viewport crítico: mobile  
Recomendación: se integra mejor como riesgo + pulso que como frase aislada

### Many active orders

Señal: many active orders  
Clasificación: tactical, puede volverse critical por congestión  
Usuario principal: manager / owner / operator  
Debe dominar cuando: la carga compromete foco y throughput  
Debe degradarse cuando: solo describe actividad sana  
Persistencia recomendada: contextual  
Valor operacional: alto  
Valor comercial: medio  
Riesgo de ruido: medio  
Riesgo de invisibilización: medio  
Viewport crítico: desktop  
Recomendación: la carga por sí sola no basta; debe leerse junto con fricción

### Active throughput / flow balance

Señal: active throughput / pending-preparing-ready balance  
Clasificación: tactical  
Usuario principal: manager / operator  
Debe dominar cuando: ayuda a decidir dónde actuar  
Debe degradarse cuando: solo describe operación estable  
Persistencia recomendada: media  
Valor operacional: alto  
Valor comercial: medio  
Riesgo de ruido: bajo  
Riesgo de invisibilización: medio  
Viewport crítico: desktop  
Recomendación: parte del pulso, no del drama

### Focused navigation

Señal: focused navigation (`demorados`, `mios`, `sin responsable`, etc.)  
Clasificación: tactical  
Usuario principal: operator / manager  
Debe dominar cuando: reduce scanning real  
Debe degradarse cuando: la vista base ya es suficiente  
Persistencia recomendada: mientras el foco esté activo  
Valor operacional: alto  
Valor comercial: bajo  
Riesgo de ruido: bajo  
Riesgo de invisibilización: alto si queda demasiado abajo  
Viewport crítico: mobile  
Recomendación: navegación es operación, no accesorio

### Delivery / retiro mix

Señal: delivery / retiro mix  
Clasificación: contextual  
Usuario principal: owner / manager  
Debe dominar cuando: define staffing o modo de flujo, y no hay fricción más urgente  
Debe degradarse cuando: hay riesgo o congestión  
Persistencia recomendada: contextual  
Valor operacional: medio  
Valor comercial: medio  
Riesgo de ruido: alto por repetición  
Riesgo de invisibilización: bajo  
Viewport crítico: none  
Recomendación: contexto, nunca foco crítico

### Revenue pace / ticket average / best seller

Señal: revenue pace / ticket average / best seller  
Clasificación: contextual / passive  
Usuario principal: owner  
Debe dominar cuando: lectura comercial en calma  
Debe degradarse cuando: la operación exige acción  
Persistencia recomendada: contextual  
Valor operacional: bajo  
Valor comercial: medio-alto  
Riesgo de ruido: medio  
Riesgo de invisibilización: bajo  
Viewport crítico: desktop  
Recomendación: acompañan; no deben competir con la capa crítica

## Risk dominance model

### ¿Cuándo riesgo domina todo?

Cuando se cumple cualquiera de estas condiciones:

- múltiples pedidos stalled
- regresiones recientes con impacto operativo
- preparación vencida sostenida
- ownership gaps bajo carga
- congestión que ya altera el flujo

### ¿Qué debe callarse cuando aparece riesgo?

- contexto comercial extendido
- calma narrativa
- business insights de bajo impacto
- feed contextual débil
- throughput positivo no accionable

### ¿Qué señales deben persistir hasta resolverse?

- stalled
- no ownership
- overdue preparation
- congestión severa
- regresión relevante mientras siga abierta o muy reciente

### ¿Qué riesgo merece sticky / escalation / visual persistence / grouping?

- **sticky:** stalled, congestion severa, ownership gaps bajo carga
- **escalation:** múltiples stalled, regressions agrupadas, overdue preparation en varios pedidos
- **visual persistence:** riesgo activo por pedido y síntesis crítica global
- **grouping:** regressions, churn de reassignment, bursts de riesgo similar

### ¿Qué riesgo NO merece dominar?

- señales leves aisladas
- un solo reassignment sin fricción
- picos transitorios ya absorbidos
- contexto de delivery/retiro

### ¿Cómo evitar fatiga de alertas?

- una señal crítica debe tener una capa dominante
- las demás capas acompañan o callan
- persistir riesgo real, no repetirlo textual en cuatro bloques
- agrupar churn y regressions en vez de enumerarlas una por una

### Reglas conceptuales

Si múltiples pedidos están stalled:
- dominar: cards afectadas + síntesis de riesgo
- acompañar: ownership + queue pressure
- degradar: negocio + narrativa suave

Si hay regressions agrupadas:
- dominar: evidencia de regressions + V.2
- acompañar: feed como memoria
- degradar: calma y contexto pasivo

Si hay ownership gaps bajo carga:
- dominar: cards sin responsable + navegación de foco
- acompañar: pulso operacional
- degradar: business context

## Operational pulse model

Operational pulse real:

- carga
- ritmo
- fricción
- ownership
- riesgo

Señales que realmente representan flujo:

- `OPERACION EN VIVO`
- balance pending / preparing / ready
- active load
- queue pressure
- newest / stalled / overdue transitions
- ownership libre o saturada

Señales que ayudan a decidir:

- stalled
- preparing overload
- many active orders con fricción
- no ownership
- pulse desbalanceado

Señales que solo describen:

- completados sin problema
- revenue pace
- best seller
- ticket average

Definición:

El pulso operacional no es un KPI wall. Es la lectura mínima que permite saber si el flujo:

- corre
- se frena
- se congestiona
- se reparte mal
- escala a riesgo

## Ownership visibility model

### ¿Ownership es critical o contextual?

Es **critical** cuando:

- hay pedidos sin responsable
- hay multioperador
- hay congestión
- hay churn de responsabilidad

Es **contextual** cuando:

- la operación es individual
- el responsable ya está claro y no hay tensión

### ¿Cuándo debe dominar?

- bajo congestión
- cuando hay `sin responsable`
- cuando el operador necesita `mios`
- cuando la reasignación revela fricción

### ¿Cómo evitar ruido multioperador?

- no tratar toda reasignación como crisis
- agrupar churn de ownership
- mostrar ownership libre y ownership crítico como foco real

### ¿Qué merece persistencia?

- `sin responsable` bajo carga
- `mios` como foco de trabajo
- reassignment churn si sigue impactando

### ¿Qué debe vivir en cards vs búsqueda vs lanes futuras?

- **cards:** responsable actual, libre, tension visible
- **búsqueda:** `mios`, `sin responsable`, foco puntual
- **lanes futuras:** ownership como eje estructural si el patrón se confirma

### ¿Qué cambia en mobile?

- ownership libre gana valor todavía mayor
- búsqueda de ownership reduce scanning mucho más que contexto comercial

Regla:

Bajo congestión:
- ownership libre domina más que business context

## Navigation-as-operation model

### Navegación crítica

- `demorados`
- `con riesgo`
- `estancados`
- `sin responsable`
- `mios`
- combinaciones tácticas como `delivery pendientes`

### Navegación táctica

- tabs de workflow
- búsqueda activa
- filtros activos
- combinaciones por estado + método

### Navegación contextual

- cliente puntual
- ticket alto
- búsquedas de rescate

### ¿Qué navegación reduce scanning real?

- riesgo
- ownership
- combinaciones tácticas

### ¿Qué navegación merece persistencia?

- workflow base
- foco de riesgo
- ownership frecuente

### ¿Qué navegación debería ser contextual?

- cliente puntual
- valor comercial
- búsquedas raras

### ¿Qué navegación debería convertirse en lane futura?

- estado
- riesgo
- ownership
- posiblemente método de entrega si condiciona operación

Definición:

La navegación crítica no es decoración ni filtro secundario. Es parte de la capa operacional crítica porque transforma scanning manual en decisión rápida.

## Card priority model

### ¿Qué cards dominan bajo riesgo?

- stalled
- regressions
- overdue preparation
- unassigned bajo carga

### ¿Qué cards dominan bajo congestión?

- pending / preparing con fricción
- unassigned
- many active with no clear owner
- new orders que entran sobre cola ya tensa

### ¿Qué cards no merecen competir?

- completed
- calm flow sin fricción
- high-value sin urgencia operativa

### ¿Qué cards deben persistir?

- stalled
- unassigned
- overdue
- regressions recientes

### ¿Qué cards pueden comprimirse primero?

- completed
- calm flow
- cards de baja urgencia comercial

Definición:

La prioridad cognitiva de una card no depende solo del estado. Depende de:

- riesgo
- ownership
- carga
- edad operacional
- capacidad de bloquear flujo

## Critical persistence rules

### Persistent Critical

Debe permanecer visible hasta resolución:

- stalled
- no ownership
- severe congestion
- overdue preparation sostenida

### Ephemeral Critical

Importante, pero de corta duración:

- nuevo pedido
- reassignment rápida sin churn
- pico transitorio de cola

### Contextual Critical

Importa solo bajo ciertas condiciones:

- delivery overload
- preparation imbalance
- throughput desbalanceado

## Dominance vs degradation rules

### Calm

Domina:
- workflow limpio
- contexto moderado

Degrada:
- alertas innecesarias

### Active

Domina:
- carga viva
- ownership
- pending / preparing flow

Degrada:
- narrativa suave

### Congested

Domina:
- riesgo
- cards afectadas
- ownership gaps
- queue pressure

Degrada:
- negocio
- summaries largos
- feed contextual

### Risk

Domina:
- V.2
- cards críticas
- síntesis operacional fuerte

Degrada:
- todo lo no accionable

## Mobile critical operations behavior

### Señales que sobreviven siempre

- riesgo
- carga
- ownership
- foco de navegación
- cards

### Señales que desaparecen primero

- business context extendido
- feed largo
- narrativa suave
- KPIs pasivos

### Señales que deben compactarse

- chips derivados
- contextos secundarios
- parts of `HOY`

### Navegación que merece persistencia

- workflow base
- riesgo
- ownership
- búsqueda

### Información demasiado densa para mobile

- múltiples bandas narrativas seguidas
- business insights largos
- feed contextual completo
- mezcla simétrica de owner + operator concerns

## Relación con OX.2.3 / OX.2.4 / OX.3 / OX.4 / OX.5

### OX.2.3 - Business vs Operations Separation

Debe usar esta capa para separar:

- operación viva
- contexto comercial

### OX.2.4 - Dashboard Flow Redesign

Debe usar esta capa para ordenar:

- ruta operator
- ruta manager
- ruta owner

### OX.3 - Operational Lanes

Debe usar esta capa para definir:

- lanes de riesgo
- lanes de ownership
- lanes de workflow
- lanes dinámicas

### OX.4 - Dynamic Operational Priority

Debe usar esta capa para:

- dominance switching
- degradation
- operational modes

### OX.5 - Smart Compression

Debe usar esta capa para:

- preservar señales críticas
- comprimir contexto primero

## Riesgos conceptuales

- convertir el dashboard en pura alarma
- hacer persistir demasiado riesgo
- generar fatiga de atención
- degradar demasiado negocio
- esconder contexto útil
- sobreoptimizar para operators
- generar demasiada intensidad visual
- duplicar señales entre cards, feed e insights
- hacer mobile excesivamente minimalista

## Decisiones NO tomadas todavía

OX.2.2 no decide:

- layout final
- diseño visual final
- sticky real
- lanes reales
- thresholds finales
- reglas realtime exactas
- motion system
- reorder visual definitivo
- CSS
- search parser changes
- DB changes

## Conclusiones

La Critical Operations Layer futura de OrderOps debe construirse sobre una verdad simple:

- cards son el lugar de la verdad
- riesgo y ownership son la prioridad
- navegación es parte de la operación
- el contexto comercial sigue vivo, pero subordinado
- la narrativa debe ayudar a decidir, no a competir por atención
