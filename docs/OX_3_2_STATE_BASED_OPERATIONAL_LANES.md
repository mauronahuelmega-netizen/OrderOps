# OX.3.2 - State-Based Operational Lanes

## Resumen ejecutivo de la fase

OX.3.2 define como deberian comportarse conceptualmente los lanes operacionales segun el estado del pedido. No implementa lanes reales ni modifica la UI actual. Su objetivo es responder una pregunta concreta: **que informacion debe dominar dentro de cada lane segun el tipo de trabajo que ese estado representa**.

La conclusion central es:

- no todos los estados requieren la misma densidad ni la misma prioridad
- `pending` y `preparing` concentran el trabajo vivo mas estructural
- `completed` y `cancelled` son lanes de revision, no de accion inmediata
- `con riesgo / demorado / estancado` es una lane critica o una super-prioridad transversal
- mobile debe ver menos capas por lane y llegar antes a accion

En limpio: los lanes no solo agrupan pedidos; tambien deberian **cambiar la lectura segun el estado del trabajo**.

## Definicion conceptual de lanes y su comportamiento segun estado

### Pending / Nuevo

Naturaleza del estado:

- trabajo entrante
- espera de toma o inicio
- punto de deteccion de ownership y backlog

Comportamiento conceptual:

- debe privilegiar visibilidad de novedad
- debe hacer evidente si el pedido no tiene responsable
- debe permitir leer rapido volumen de ingreso y espera

### Preparing / En preparacion

Naturaleza del estado:

- trabajo activo
- carga operacional viva
- mejor lugar para detectar lentitud, friccion y congestion

Comportamiento conceptual:

- debe privilegiar riesgo, tiempo, ownership y balance de carga
- es la lane con mayor densidad operacional valida
- deberia sentirse como el corazon del workflow

### Completed / Completado

Naturaleza del estado:

- throughput
- cierre del flujo
- revision, no trabajo vivo

Comportamiento conceptual:

- debe ser compacta
- no deberia competir con lanes activas salvo en review owner/manager
- puede priorizar lectura agregada por encima de detalle continuo

### Cancelled / Cancelado

Naturaleza del estado:

- excepcion o perdida de flujo
- indicador de calidad operativa / comercial
- relevancia alta solo si el volumen crece o el patron se repite

Comportamiento conceptual:

- debe quedar secundaria por defecto
- puede subir si el ratio o patron de cancelacion revela friccion
- no deberia ocupar el mismo peso que `preparing` o riesgo salvo desvio fuerte

### Con riesgo / Demorado / Estancado

Naturaleza del estado:

- friccion activa
- prioridad operacional maxima
- lectura transversal a otros estados

Comportamiento conceptual:

- debe dominar el scanning cuando existe
- puede vivir como lane propia o como prioridad superior dentro de lanes base
- debe hacer visibles stalled, overdue, regressions y ownership gaps

## Reglas conceptuales por estado

### Pending / Nuevo

Bloques visibles y prioritarios:

- novedad / highlight
- ownership
- tiempo desde ingreso
- foco operativo

Bloques comprimidos o colapsables:

- negocio
- narrativa
- feed contextual

Secuencia de aparicion:

1. nuevo ingreso
2. sin responsable si aplica
3. tiempo esperando
4. detalles secundarios

Condiciones de highlight o alerta:

- pedido nuevo
- varios pendientes acumulados
- pendientes sin responsable
- pendientes envejeciendo sin avance

### Preparing / En preparacion

Bloques visibles y prioritarios:

- riesgo
- tiempo en estado
- responsable
- carga viva
- senales de regresion o lentitud

Bloques comprimidos o colapsables:

- negocio extendido
- contexto comercial
- narrativa pasiva

Secuencia de aparicion:

1. riesgo / demora
2. ownership
3. tiempo / friccion
4. detalle operativo secundario

Condiciones de highlight o alerta:

- slow preparation
- stalled
- many changes
- regressions
- churn de reassignment

### Completed / Completado

Bloques visibles y prioritarios:

- cierre claro
- throughput agregado
- lectura rapida de volumen

Bloques comprimidos o colapsables:

- detalle fino por card
- narrativa repetitiva
- contexto no accionable

Secuencia de aparicion:

1. volumen completado
2. velocidad o ritmo si aporta
3. detalle individual solo en revision

Condiciones de highlight o alerta:

- no deberia alertar por defecto
- puede subir si completed revela throughput excepcional o cierre de congestion

### Cancelled / Cancelado

Bloques visibles y prioritarios:

- volumen o ratio si es anormal
- patron de friccion asociado

Bloques comprimidos o colapsables:

- detalle individual constante
- narrativa excesiva

Secuencia de aparicion:

1. volumen / anomalia
2. lectura contextual
3. detalle solo si hace falta investigar

Condiciones de highlight o alerta:

- multiples cancelados recientes
- cancelaciones repetidas asociadas a friccion operativa

### Con riesgo / Demorado / Estancado

Bloques visibles y prioritarios:

- stalled
- overdue
- regressions
- ownership gap
- tiempo sin movimiento

Bloques comprimidos o colapsables:

- negocio
- summaries suaves
- feed contextual

Secuencia de aparicion:

1. problema
2. ownership
3. impacto en flujo
4. contexto minimo para decidir

Condiciones de highlight o alerta:

- siempre que exista riesgo relevante
- mas fuerte si hay varios pedidos afectados
- mas fuerte si la friccion persiste

## Lista de lanes con comportamiento conceptual por estado

### Lane: Pending

- dominante para ingreso y backlog
- prioridad alta en operator / manager
- fuerte sensibilidad a ownership y tiempo de espera

### Lane: Preparing

- dominante para carga activa
- prioridad maxima en operacion viva junto con riesgo
- mejor candidata para concentrar decisiones rapidas

### Lane: Ready

- soporte de salida y cierre parcial
- prioridad media-alta
- relevante si el flujo depende de despacho o entrega inmediata

### Lane: Completed

- lane de throughput
- prioridad baja-media
- mas util para owner / manager que para operator en tiempo real

### Lane: Cancelled

- lane de excepcion
- prioridad baja salvo desvio
- mejor como revision que como trabajo vivo

### Lane: Con riesgo / Demorado / Estancado

- lane critica o super-lane transversal
- prioridad maxima cuando existe
- puede dominar el primer scanning del dashboard

## Secuencia conceptual de lectura y paths de atencion por rol y viewport

### Operator

1. con riesgo / demorado / estancado
2. pending sin responsable
3. preparing
4. ready
5. a mi cargo
6. completed / cancelled solo si sobra atencion

### Manager

1. con riesgo / demorado / estancado
2. sin responsable
3. balance pending / preparing / ready
4. cancelled si muestra desvio
5. completed como throughput

### Owner

1. carga general y lanes criticas si existen
2. completed / cancelled
3. negocio resumido
4. detalle de lanes criticas solo cuando hay friccion

### Mobile

1. lane critica si existe
2. pending o preparing segun foco actual
3. ownership visible
4. cards principales
5. lanes de revision comprimidas o diferidas

## Prioridad y reglas de compactacion / degradacion

### Prioridad maxima

- Con riesgo / Demorado / Estancado
- Preparing
- Pending con ownership gap

### Prioridad media-alta

- Ready
- A mi cargo
- Pending estable

### Prioridad baja o de revision

- Completed
- Cancelled

### Reglas de compactacion

- completed y cancelled se compactan primero
- riesgo nunca se compacta hasta perder legibilidad operativa
- preparing acepta densidad fuerte si esa densidad ayuda a decidir
- pending debe priorizar backlog, novedad y ownership sobre detalle fino

### Reglas de degradacion

- bajo congestion, lanes de revision bajan primero
- bajo riesgo, negocio y narrativa salen antes que cualquier lane critica
- en mobile, completed y cancelled casi nunca merecen primer plano

## Integracion conceptual con Critical Operations Layer y fold consolidado

OX.3.2 hereda de OX.2.8 estas reglas:

- la capa critica manda
- cards son la verdad operacional
- negocio acompana
- mobile endurece prioridad

Aplicado a lanes:

- lanes de estado no reemplazan la capa critica, la organizan
- la lane de riesgo debe reforzar la capa critica, no duplicarla torpemente
- completed y cancelled no deben reintroducir densidad pasiva al fold

## Ajustes por dispositivo

### Desktop

- puede sostener pending, preparing, ready y una lectura de riesgo con mayor simultaneidad
- completed y cancelled pueden vivir visibles en revision si no compiten

### Mobile

- debe mostrar menos lanes simultaneas
- la lane critica y la lane del trabajo vivo actual dominan
- completed y cancelled deberian entrar comprimidas, colapsadas o diferidas
- ownership visible es mas importante que narrativa

## Preparacion conceptual para OX.3.3 - Lane Header System

OX.3.2 deja claro que OX.3.3 deberia resolver:

- que informacion minima necesita cada lane para ser entendible
- que densidad de metadata debe vivir en el header y cual en las cards
- que headers deben ser mas tacticos y cuales mas compactos

Tambien deja una pista clave:

- si el header de una lane necesita demasiada explicacion para justificar su existencia, esa lane probablemente no esta bien definida

## Riesgos conceptuales y advertencias de implementacion

- duplicar riesgo dentro de una lane critica y en cada card sin jerarquia clara
- hacer que completed y cancelled compitan con trabajo vivo
- convertir preparing en un basurero de demasiadas senales a la vez
- tratar pending y preparing como equivalentes cuando responden a momentos distintos del flujo
- llevar demasiado detalle a mobile
- no decidir si riesgo es lane propia o prioridad transversal y terminar con ambas cosas mal resueltas

## Decisiones NO tomadas todavia

OX.3.2 no decide:

- layout final de lanes
- CSS final
- si riesgo sera lane dedicada o overlay transversal
- header real de lanes
- scroll real
- sticky real
- motion
- implementacion realtime
- breakpoints finales
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

- los estados del pedido no solo ordenan cards: ordenan que clase de lectura y accion necesita cada lane
- pending y preparing sostienen el workflow vivo
- completed y cancelled son revision, no centro de gravedad
- riesgo debe dominar cuando existe, pero sin destruir la legibilidad de los estados base
