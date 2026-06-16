# V.2.3 -- KPI Recovery & Secondary Hierarchy

## Objetivo

Recuperar la jerarquia visual secundaria del dashboard admin para que:

- los KPIs no compitan todos igual
- la metadata pese menos
- `context` quede claramente en soporte
- `execution` se sienta como zona principal de trabajo

Esta fase no cambia logica ni contenido. Trabaja sobre peso visual, contraste, prioridad operacional y scanning.

## Relacion con V.2.1 y V.2.2

- `V.2.1` resolvio grouping: overview / execution / context
- `V.2.2` resolvio ritmo y densidad gruesa
- `V.2.2a` corrigio overflow y responsive
- `V.2.2b` termino de subir execution y bajo cardificacion secundaria

`V.2.3` toma esa base para cerrar la jerarquia fina.  
`V.2.3a` funciona como fix pass dentro de `V.2.3`, no como fase nueva.

## V.2.3 aplicado

### Jerarquia KPI

Aplicado sobre:

- `OPERACION EN VIVO`
- `HOY`
- counters y valores de lanes
- lane metrics

Reglas:

- `OPERACION EN VIVO` se lee como KPI primario
- `HOY` queda como KPI secundario
- labels y captions se degradan para que los valores escaneen antes
- `INSIGHTS` deja de ocupar una voz comparable a los KPI principales

### Information weight recovery

Se bajo peso visual de:

- labels no accionables
- captions
- helper text
- alerts secundarios
- metadata de contexto
- textos narrativos dentro de `context`

Se hizo con:

- color mas muted
- menor tamano en labels y captions
- menor line-height en texto pasivo
- menos protagonismo en bloques auxiliares

### Context demotion

`context` ya estaba debajo de `execution` desde `V.2.2b`.

En esta fase se reforzo eso:

- `context` usa una surface mas apagada
- sus bloques internos tienen menos borde, menos sombra y menos voz visual
- `actividad reciente` baja a rol de contexto pasivo
- `resumen operativo` e `insights del negocio` se leen mas agrupados y menos protagonistas

## V.2.3a -- Operational Hierarchy Completion

`V.2.3a` cierra la deuda pendiente detectada en QA sin reabrir estructura ni logica.

### Overview compression final

Se compacto:

- realtime pills
- stack KPI de `HOY`
- stack KPI de `OPERACION EN VIVO`
- bloque `INSIGHTS`

Objetivo:

- overview mas corto
- menos sensacion de panel de reporte
- llegada mas rapida a execution

### Merge KPI layers

`HOY`, `OPERACION EN VIVO` e `INSIGHTS` pasan a leerse como un solo snapshot operacional con tres niveles:

1. KPI secundario: `HOY`
2. KPI primario: `OPERACION EN VIVO`
3. apoyo auxiliar: `INSIGHTS`

No se fusionaron funcionalmente ni se tocaron metricas.  
Se fusiono la lectura visual:

- menos separacion entre bloques
- menos independencia de surface
- mas continuidad en el stack de overview

### Insights collapse

`INSIGHTS` se degrado de bloque independiente a capa auxiliar integrada:

- menos padding
- menos contraste
- menor surface weight
- menor jerarquia de labels y valores

Objetivo:

- insight acompana
- insight no manda

### Execution entry acceleration

Se reforzo visualmente:

- busqueda
- filtros
- lane navigation
- lane counters
- lane metrics

Se hizo con:

- menos aire vertical
- mejor contraste en la zona de execution
- labels mas discretos y valores mas legibles
- scanning operacional mas corto

### Mobile fold recovery

En mobile la lectura queda mas cerca de:

Hero  
Overview compacto  
Execution  
Pedidos

`context` sigue secundario y no compite con el primer tramo operativo.

## V.2.3b -- Snapshot Compression Pass

`V.2.3b` cierra la deuda pendiente de snapshot visual sin cambiar contenido ni logica.

### KPI surface compression

Se comprimio:

- padding vertical de KPI surfaces
- peso visual de borde
- radius percibido
- contraste de labels

Objetivo:

- menos sensacion de cards independientes
- mas sensacion de strip o snapshot operacional

### KPI row reduction

Se redujeron filas visibles antes de execution con:

- grids mas eficientes
- mejor uso horizontal en tablet y desktop
- menos wrapping innecesario
- menor altura total del snapshot en mobile

### Snapshot unification

`HOY`, `OPERACION EN VIVO` e `INSIGHTS` ahora se leen con mas continuidad visual:

- menos separacion entre capas
- headings mas discretos
- menos sensacion de subseccion independiente

### Insights inline recovery

`INSIGHTS` baja a micro contexto:

- strip mas corto
- menor contraste
- menor protagonismo de detalle
- peso de helper line operacional

### Execution proximity recovery

Se acerco `execution` con:

- menos gap overview -> execution
- search wrapper mas corto
- filtros mas compactos
- lane navigation mas baja

### Filter density pass

Pills y filtros pasan a leerse mas como selector operacional compacto:

- menor altura
- menor padding
- menor gap
- wrap mas eficiente
- active state claro, pero menos pesado

## Estado real de la fase

Estado actual:

- `V.2.3` implementada
- `V.2.3a` aplicado dentro de `V.2.3`
- `V.2.3b` aplicado dentro de `V.2.3`
- `V.2` no debe considerarse cerrada hasta QA visual autenticado aprobado

## Riesgos

- las order cards siguen teniendo deuda de jerarquia interna, fuera del alcance de esta fase
- la validacion real del dashboard autenticado sigue pendiente
- puede hacer falta un ajuste menor de fine tuning cuando exista QA con datos vivos, pero ya no corresponde reabrir el problema grueso de overview/context/execution

## Preparacion para la siguiente etapa

`V.2.3` deja listo:

- overview con snapshot operacional mas compacto
- `context` en soporte real
- `execution` con entry point mas fuerte
- base visual mas estable para abrir QA final de `V.2` antes de cualquier trabajo posterior
