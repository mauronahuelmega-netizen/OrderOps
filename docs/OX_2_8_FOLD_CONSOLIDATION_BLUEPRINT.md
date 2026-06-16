# OX.2.8 - Fold Consolidation Blueprint

## Resumen ejecutivo de la consolidacion del fold

OX.2.8 cierra OX.2 consolidando en un solo blueprint la arquitectura conceptual del fold para desktop y mobile. No decide una UI final, pero si deja una filosofia operativa suficientemente clara para que la implementacion futura no improvise.

La conclusion central es:

- el fold no debe ser una coleccion de bloques visibles, sino una secuencia de lectura y decision
- la operacion critica debe dominar siempre el primer segundo
- la awareness tactica debe ayudar sin competir
- el contexto de negocio debe acompanar en compacto y degradarse bajo presion
- la narrativa pasiva debe ser la primera candidata a compresion, colapso o diferido
- mobile requiere una arquitectura de fold propia, no una replica estrecha de desktop

Este blueprint deja una regla rectora para lo que sigue: **el fold de OrderOps existe para llevar antes a foco, riesgo, ownership y cards**.

## Mapa conceptual maestro de bloques

### Critical Operations

- cards
- risk indicators
- assignment / ownership
- `OPERACION EN VIVO` esencial
- busqueda operacional
- filtros workflow
- highlights
- queue pressure bajo friccion real

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
- delivery / retiro
- mas vendido

### Passive Narrative

- calma repetida
- narrative soft
- summaries redundantes
- feed contextual debil
- chips explicativos largos

## Blueprint conceptual consolidado de folds desktop y mobile

### Desktop fold

Secuencia ideal:

1. salud minima
2. riesgo / carga viva
3. ownership y foco
4. cards
5. awareness tactica
6. negocio resumido
7. narrativa pasiva solo si sobra aire y no compite

Principio:

- desktop puede sostener mas contexto, pero no mas confusion

### Mobile fold

Secuencia ideal:

1. salud minima
2. riesgo / carga
3. foco de navegacion
4. cards
5. awareness tactica minima
6. contexto secundario colapsado o diferido

Principio:

- mobile llega mas rapido a cards y filtra mas fuerte el contexto

### Tablet fold

Secuencia ideal:

1. salud minima
2. riesgo / carga / ownership
3. foco
4. cards
5. awareness tactica compacta
6. negocio resumido

Principio:

- tablet es un intermedio real, no una copia de phone ni de laptop

## Secuencia de lectura y paths de atencion

### Desktop operator path

1. salud minima
2. riesgo / friccion
3. ownership gaps
4. foco de navegacion
5. cards
6. evidencia secundaria
7. negocio solo si no roba accion

### Desktop owner path

1. salud general
2. carga / estabilidad
3. negocio resumido
4. friccion operacional
5. cards o feed si hay problema

### Desktop manager path

1. carga
2. riesgo
3. ownership
4. flujo
5. negocio resumido

### Mobile path

1. salud minima
2. riesgo / carga
3. foco
4. cards
5. contexto secundario comprimido

## Priorizacion de blocks y reglas de compactacion, colapso y degradacion

### Reglas generales

1. Se comprime contexto antes que accion.
2. Se degrada narrativa antes que evidencia.
3. Se difiere negocio antes que cards.
4. Se colapsa primero lo que no cambia una decision inmediata.
5. Una misma senal no debe ocupar multiples superficies con igual peso.

### Reglas por categoria

#### Critical Operations

- no deben perder visibilidad base
- pueden compactarse, pero no esconderse
- son los ultimos en degradarse

#### Tactical Awareness

- deben mantenerse solo si reducen scanning
- si repiten riesgo, cards o pulso, se compactan o salen del fold

#### Business Context

- puede sostenerse en desktop y calm states
- debe comprimirse o diferirse bajo congestion y risk
- en mobile suele entrar resumido o colapsado

#### Passive Narrative

- primer grupo en retirarse del primer plano
- solo vive visible cuando no compite con nada mas importante

## Reglas de persistencia y degradacion de informacion contextual

### Calm

Persiste:

- salud minima
- cards
- negocio resumido
- una capa suave de sintesis

Se degrada:

- alertas innecesarias

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
- queue pressure
- ownership gaps
- cards afectadas
- foco

Se degrada:

- negocio
- summaries largos
- feed contextual
- chips largos
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

## Atencion operativa (Attention Budget) conceptual por viewport

### Desktop

- Critical Operations: 50%
- Tactical Awareness: 25%
- Business Context: 15%
- Passive Narrative: 10% maximo

### Mobile

- Critical Operations: 70%
- Tactical Awareness: 20%
- Business Context: 10%
- Passive Narrative: 0-5%

### Tablet

- Critical Operations: 60%
- Tactical Awareness: 25%
- Business Context: 10-15%
- Passive Narrative: 5% maximo

Regla consolidada:

- si una capa secundaria empuja cards o foco fuera del primer recorrido, se paso de presupuesto

## Definicion de sticky / flow / deferred / collapsible candidates

### Sticky candidates

- busqueda operacional
- filtros base
- riesgo sintetico bajo friccion sostenida
- modo operacional futuro

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
- summaries secundarios
- chips derivados largos
- parte de `ACTIVIDAD RECIENTE`

## Integracion conceptual de OX.2.1 -> OX.2.7

### OX.2.1 - Above-the-Fold Mapping

Dejo claro que el fold es una zona de decision cognitiva, no solo de visibilidad.

### OX.2.2 - Critical Operations Layer

Definio que manda cuando la operacion esta viva: riesgo, carga, ownership, foco y cards.

### OX.2.3 - Business vs Operations Separation

Separo operacion viva de contexto de negocio y marco las senales hibridas.

### OX.2.4 - Dashboard Flow Redesign

Convirtio esa jerarquia en un recorrido de lectura y accion por rol.

### OX.2.5 - Collapsible Context Layers

Definio que partes del contexto pueden plegarse, diferirse o colapsarse primero.

### OX.2.6 - Density Balancing

Tradujo colapso y prioridad a una politica de peso cognitivo y visual.

### OX.2.7 - Mobile Fold Re-Architecture

Adapto todo eso a 320px, 390px y tablet con una jerarquia mas dura.

## Preparacion para OX.3 - Operational Lanes

Este blueprint deja listo para OX.3:

- que el centro de gravedad esta en cards, riesgo, ownership y workflow
- que lanes futuras no deben contaminarse con negocio pasivo
- que la navegacion operacional ya es parte de la capa critica
- que el fold consolidado debe llevar naturalmente a lanes, no competir con ellas

Tambien deja una advertencia util:

- si OX.3 crea lanes sin respetar esta jerarquia, duplicara filtros, feed y contexto en vez de reducir scanning

## Relacion conceptual con fases futuras OX.3 -> OX.7

### OX.3 - Operational Lanes

- transformar workflow, riesgo y ownership en estructura operativa mas visible

### OX.4 - Dynamic Operational Priority

- convertir dominance y degradation conceptual en comportamiento real segun estado

### OX.5 - Smart Compression

- implementar compresion sobre narrativa, negocio pasivo y contexto redundante

### OX.6 - Visual Polish System

- dar lenguaje visual coherente a la jerarquia ya definida

### OX.7 - Multi-Operator Reality Check

- validar si esta arquitectura realmente reduce fatiga, scanning y conflicto bajo uso real

## Riesgos conceptuales de la consolidacion

- consolidar demasiado y perder matices utiles entre roles
- usar el blueprint como excusa para esconder negocio mas de la cuenta
- respetar la jerarquia conceptual pero no resolver redundancia real entre capas
- pensar que mobile se arregla solo comprimiendo desktop
- crear una implementacion futura demasiado dinamica y poco predecible
- llegar a OX.3 sin una lectura clara de que es verdad operacional y que es contexto

## Decisiones NO tomadas todavia

OX.2.8 no decide:

- layout final
- CSS final
- implementacion real de sticky
- implementacion real de collapse
- reorder real de componentes
- breakpoints definitivos
- thresholds dinamicos exactos
- lanes reales
- motion
- cambios en busqueda
- cambios en realtime
- cambios en DB

## Confirmacion de alcance

En esta fase no se implementa ni se toca:

- UI
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

- OX.2 deja un fold conceptual orientado a accion, no a acumulacion
- la operacion critica domina, la awareness tactica acompana, el negocio resume y la narrativa espera
- desktop y mobile comparten principios, pero no el mismo permiso de densidad
- el proximo paso ya no es seguir auditando: es usar este blueprint como contrato de implementacion para OX.3 en adelante
