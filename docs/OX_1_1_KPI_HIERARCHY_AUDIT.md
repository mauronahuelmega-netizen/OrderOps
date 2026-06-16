# OX.1.1 - KPI Hierarchy Audit

## Alcance

OX.1.1 es una fase de auditoria. No redisenia el dashboard, no cambia calculos y no retira KPIs. El objetivo es dejar una decision clara sobre que metricas merecen foco operacional real y cuales deberian degradarse o comprimirse en fases futuras.

## Inventario actual

### Strip `HOY`

- Ventas
- Ticket promedio
- Activos
- Completados
- Delivery / Retiro
- Mas vendido

### Strip `OPERACION EN VIVO`

- Tiempo promedio
- Preparacion
- Estancados
- Cancelados
- Reasignaciones
- Ult. mov.

## KPI Priority Matrix

| KPI | Strip | Tipo | Prioridad sugerida | Accion inmediata | Notas |
| --- | --- | --- | --- | --- | --- |
| Activos | HOY | mixto | PRIMARY / CRITICAL | Alta | Es el mejor proxy de carga viva y deberia liderar lectura operacional. |
| Estancados | OPERACION EN VIVO | operacional | PRIMARY / CRITICAL | Muy alta | Detecta friccion real y conecta directo con V.2. |
| Preparacion | OPERACION EN VIVO | operacional | PRIMARY / CRITICAL | Alta | Marca salud de flujo cuando sube sobre umbral. |
| Tiempo promedio | OPERACION EN VIVO | operacional | PRIMARY / CRITICAL | Media / alta | Sirve como pulso global, sobre todo para manager y owner. |
| Ult. mov. | OPERACION EN VIVO | operacional | PRIMARY / CRITICAL cuando hay activos | Media | Senal de ritmo; pierde peso cuando la operacion esta quieta. |
| Ventas | HOY | comercial | SECONDARY / CONTEXTUAL | Media | Importa a owner/manager, menos al operador puro. |
| Ticket promedio | HOY | comercial | SECONDARY / CONTEXTUAL | Media | Da calidad comercial, no urgencia tactica. |
| Completados | HOY | mixto | SECONDARY / CONTEXTUAL | Media | Ayuda a entender throughput, no decide accion sola. |
| Delivery / Retiro | HOY | comercial / flujo | SECONDARY / CONTEXTUAL | Media | Orienta staffing y futura arquitectura de lanes. |
| Cancelados | OPERACION EN VIVO | operacional | SECONDARY / CONTEXTUAL | Media cuando sube, baja cuando es 0 | Debe volverse dinamico. |
| Reasignaciones | OPERACION EN VIVO | operacional | PASSIVE / BACKGROUND cuando es 0; SECONDARY cuando sube | Baja / media | Es valioso como friccion emergente, no como lectura fija. |
| Mas vendido | HOY | comercial | PASSIVE / BACKGROUND | Baja | Buen contexto de negocio, poca urgencia operacional. |

## Analisis por KPI

### 1. Ventas

Nombre: Ventas  
Ubicacion actual: HOY  
Tipo: comercial  
Prioridad sugerida: secondary  
Usuario principal: owner / manager  
Valor operacional: medio-bajo  
Valor comercial: alto  
Accionabilidad: media  
Redundancias: puede solaparse parcialmente con `Buen movimiento comercial` en V.4  
Problemas visuales: compite de igual a igual con KPIs operacionales mas urgentes  
Recomendacion: mantener visible, pero no deberia dominar el fold en estados de riesgo

### 2. Ticket promedio

Nombre: Ticket promedio  
Ubicacion actual: HOY  
Tipo: comercial  
Prioridad sugerida: secondary  
Usuario principal: owner / manager  
Valor operacional: bajo  
Valor comercial: alto  
Accionabilidad: media  
Redundancias: alimenta `ticket alto` en V.4, pero no la duplica del todo  
Problemas visuales: hoy pesa igual que Activos o Estancados sin tener la misma urgencia  
Recomendacion: mantener, con posible compresion en OX.5 y menor peso en mobile

### 3. Activos

Nombre: Activos  
Ubicacion actual: HOY  
Tipo: mixto  
Prioridad sugerida: primary  
Usuario principal: operator / manager / owner  
Valor operacional: muy alto  
Valor comercial: medio  
Accionabilidad: alta  
Redundancias: se cruza con mensajes de `operacion tranquila` o `sin pedidos activos` en otras capas  
Problemas visuales: al vivir en HOY puede leerse como KPI comercial cuando es carga viva  
Recomendacion: candidato fuerte a subir de jerarquia en OX.2 y alimentar lanes en OX.3

### 4. Completados

Nombre: Completados  
Ubicacion actual: HOY  
Tipo: mixto  
Prioridad sugerida: secondary  
Usuario principal: owner / manager  
Valor operacional: medio  
Valor comercial: medio-alto  
Accionabilidad: media  
Redundancias: se cruza con `Pedidos completados recientemente` en V.3 y `Buen movimiento comercial` en V.4  
Problemas visuales: comunica throughput, pero rara vez exige reaccion inmediata  
Recomendacion: mantener como contexto de performance del dia, no como foco tactico permanente

### 5. Delivery / Retiro

Nombre: Delivery / Retiro  
Ubicacion actual: HOY  
Tipo: comercial / flujo  
Prioridad sugerida: secondary  
Usuario principal: manager / owner  
Valor operacional: medio  
Valor comercial: medio  
Accionabilidad: media  
Redundancias: hoy se repite narrativamente con `Delivery domina hoy` o `Retiro domina hoy` en V.4  
Problemas visuales: ocupa un slot entero incluso cuando el mix es estable y obvio  
Recomendacion: mantener porque anticipa necesidades de flujo, pero probablemente comprimible o movible a contexto adaptativo

### 6. Mas vendido

Nombre: Mas vendido  
Ubicacion actual: HOY  
Tipo: comercial  
Prioridad sugerida: passive  
Usuario principal: owner  
Valor operacional: bajo  
Valor comercial: medio  
Accionabilidad: baja  
Redundancias: puede convivir con insights comerciales sin conflicto, pero rara vez define accion del momento  
Problemas visuales: hoy consume el mismo aire que KPIs mas accionables  
Recomendacion: candidato claro a capa colapsable o compresion futura en OX.5

### 7. Tiempo promedio

Nombre: Tiempo promedio  
Ubicacion actual: OPERACION EN VIVO  
Tipo: operacional  
Prioridad sugerida: primary  
Usuario principal: manager / owner / operator  
Valor operacional: alto  
Valor comercial: indirecto  
Accionabilidad: media-alta  
Redundancias: se cruza semanticamente con `Preparacion` y con `Preparacion mas lenta` de V.4  
Problemas visuales: si el valor esta sano no deberia competir con Estancados  
Recomendacion: mantener, pero con prioridad dinamica en OX.4 segun desvio real

### 8. Preparacion

Nombre: Preparacion  
Ubicacion actual: OPERACION EN VIVO  
Tipo: operacional  
Prioridad sugerida: primary  
Usuario principal: operator / manager  
Valor operacional: muy alto  
Valor comercial: indirecto  
Accionabilidad: alta  
Redundancias: se relaciona con V.2 `slow-preparation` y V.4 `Preparacion mas lenta`, aunque en otro nivel  
Problemas visuales: sano o critico hoy pesan parecido  
Recomendacion: mantener y escalar visualmente solo cuando cruce umbral

### 9. Estancados

Nombre: Estancados  
Ubicacion actual: OPERACION EN VIVO  
Tipo: operacional  
Prioridad sugerida: primary  
Usuario principal: operator / manager  
Valor operacional: muy alto  
Valor comercial: indirecto  
Accionabilidad: muy alta  
Redundancias: puede duplicarse con chip superior de salud y con frases tipo `sin demoras` o `hay pedidos que necesitan revision`  
Problemas visuales: cuando esta en cero ocupa el mismo peso que cuando hay riesgo real  
Recomendacion: mantener, pero volverlo dinamico en OX.4 y comprimible a estado sano en OX.5

### 10. Cancelados

Nombre: Cancelados  
Ubicacion actual: OPERACION EN VIVO  
Tipo: operacional  
Prioridad sugerida: secondary  
Usuario principal: manager / owner  
Valor operacional: medio  
Valor comercial: medio  
Accionabilidad: media  
Redundancias: puede reflejarse tambien en insights o summaries cuando el ratio es relevante  
Problemas visuales: en cero tiene poco valor de primer plano  
Recomendacion: mantener, pero degradar cuando no hay senal y amplificar solo si sube anormalmente

### 11. Reasignaciones

Nombre: Reasignaciones  
Ubicacion actual: OPERACION EN VIVO  
Tipo: operacional  
Prioridad sugerida: passive cuando es 0 / secondary cuando crece  
Usuario principal: manager  
Valor operacional: medio  
Valor comercial: bajo  
Accionabilidad: media  
Redundancias: convive con V.2 `reassigned` y V.3 `Movimiento entre responsables`  
Problemas visuales: como KPI fijo puede sobrerrepresentar una senal que casi siempre es silenciosa  
Recomendacion: muy buen candidato para prioridad dinamica y compresion cuando esta en cero

### 12. Ult. mov.

Nombre: Ult. mov.  
Ubicacion actual: OPERACION EN VIVO  
Tipo: operacional  
Prioridad sugerida: primary cuando hay carga / passive cuando no hay activos  
Usuario principal: operator / manager  
Valor operacional: alto como ritmo, bajo sin actividad  
Valor comercial: bajo  
Accionabilidad: media  
Redundancias: puede solaparse con `operacion tranquila` y parte de `ACTIVIDAD RECIENTE`  
Problemas visuales: la semantica cambia mucho segun si hay operacion viva o no  
Recomendacion: KPI claramente dinamico; deberia escalar o comprimirse segun contexto

## Respuestas explicitas

1. Que KPI deberia mirar primero un operador  
   `Estancados`, `Preparacion`, `Activos` y luego `Ult. mov.`.

2. Que KPI deberia mirar primero un dueno  
   `Activos`, `Ventas`, `Ticket promedio`, `Preparacion` y `Cancelados`.

3. Que KPI genera accion inmediata  
   `Estancados`, `Preparacion` cuando sube, `Activos` cuando la carga se dispara y `Ult. mov.` cuando revela frenado.

4. Que KPI solo da contexto  
   `Mas vendido`, `Ticket promedio` en calma y `Delivery / Retiro` cuando el mix no cambia decisiones en el momento.

5. Que KPI puede reducirse cuando no hay actividad  
   `Reasignaciones`, `Cancelados`, `Ult. mov.` y `Estancados` cuando estan sanos o en cero.

6. Que KPI deberia crecer visualmente cuando hay riesgo  
   `Estancados`, `Preparacion`, `Tiempo promedio` y `Ult. mov.`.

7. Que KPI esta duplicando informacion con insights o chips  
   `Estancados` con estados sanos tipo `Sin demoras`; `Activos` con mensajes de `operacion tranquila`; `Delivery / Retiro` con V.4; `Reasignaciones` con V.2/V.3; `Completados` con V.3/V.4.

8. Que KPI deberia alimentar lanes futuras  
   `Activos`, `Estancados`, `Preparacion`, `Delivery / Retiro` y `Reasignaciones`.

9. Que KPI deberia mantenerse visible en mobile  
   `Activos`, `Estancados`, `Preparacion` y un solo KPI de ritmo (`Ult. mov.` o `Tiempo promedio` segun contexto).

10. Que KPI podria ir a una capa colapsable futura  
    `Mas vendido`, `Ticket promedio`, `Delivery / Retiro` en calma y `Reasignaciones` cuando es cero.

## Redundancias detectadas

- `Estancados` sano puede duplicar chips o copy de `Sin demoras`
- `Activos` bajo o cero puede solaparse con `Operacion tranquila` o `Sin pedidos activos`
- `Delivery / Retiro` se repite narrativamente con V.4
- `Completados` se pisa parcialmente con agrupaciones del feed y con `Buen movimiento comercial`
- `Reasignaciones` se repite con riesgo por pedido y con `Movimiento entre responsables`
- `Ult. mov.` compite con la lectura de `ACTIVIDAD RECIENTE`

## KPIs que deberian escalar dinamicamente

- Estancados
- Preparacion
- Tiempo promedio
- Ult. mov.
- Cancelados
- Reasignaciones

## KPIs que podrian comprimirse en OX.5

- Mas vendido
- Ticket promedio
- Delivery / Retiro
- Reasignaciones en cero
- Cancelados en cero
- Ult. mov. cuando no hay activos

## Recomendaciones para OX.2 / OX.3 / OX.4 / OX.5

### OX.2 - Fold Re-Architecture

- separar con mas claridad lo que decide ahora de lo que solo contextualiza
- considerar mover `Activos` al frente de la lectura operacional, aunque hoy viva en `HOY`
- reducir la competencia visual entre KPIs comerciales y operacionales en el primer fold

### OX.3 - Operational Lanes

- usar `Activos`, `Estancados`, `Preparacion` y `Delivery / Retiro` como insumos de lanes
- `Reasignaciones` puede alimentar una lane o sub-capa de ownership solo si aparece friccion real

### OX.4 - Dynamic Operational Priority

- `Estancados`, `Preparacion`, `Tiempo promedio` y `Ult. mov.` deberian cambiar de peso segun estado
- `Cancelados` y `Reasignaciones` no deberian ocupar primer plano cuando estan en cero
- el sistema necesita diferenciar `calma`, `carga` y `friccion`

### OX.5 - Smart Compression

- comprimir o colapsar `Mas vendido`, `Ticket promedio` y `Delivery / Retiro` en momentos de congestion
- fusionar KPIs sanos con labels compactos en vez de mantener seis tarjetas con igual volumen
- usar compresion especialmente en mobile para preservar cards y filtros sin fatiga

## Conclusiones

- el dashboard actual ya tiene informacion valiosa; el problema no es falta de KPIs sino jerarquia plana
- `Activos`, `Estancados`, `Preparacion` y `Tiempo promedio` concentran la mayor utilidad operacional real
- varios KPIs sanos o en cero hoy ocupan mas peso del que merecen
- el siguiente paso no es inventar nuevos datos, sino decidir mejor que debe gritar, que debe susurrar y que puede esconderse cuando la operacion aprieta
