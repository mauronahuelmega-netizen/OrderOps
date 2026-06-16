# OX.1.2 - Insight System Audit

## Alcance

OX.1.2 es una auditoria documental del sistema interpretativo del dashboard. No cambia UI, no retira insights, no modifica helpers ni recalcula nada. El objetivo es decidir que insight merece dominar, cual solo acompana y cual deberia callarse cuando la operacion aprieta.

## Inventario de capas interpretativas actuales

1. `INSIGHTS`
   - pedidos demorados
   - cambios regresivos
   - preparacion lenta
   - reasignaciones activas
   - delivery / retiro dominante
   - fallback `Operacion tranquila` / `Operacion estable`

2. `RESUMEN OPERATIVO`
   - pedidos con riesgo
   - pedidos estancados
   - cambios regresivos
   - preparacion lenta
   - cancelaciones relevantes
   - movimiento entre responsables
   - delivery / retiro dominante
   - fallbacks de calma / estabilidad

3. `INSIGHTS DEL NEGOCIO`
   - pedido de ticket alto
   - cliente frecuente
   - pico reciente
   - preparacion mas lenta
   - delivery / retiro dominante
   - buen movimiento comercial
   - ritmo bajo

4. `ACTIVIDAD RECIENTE`
   - riesgos activos agrupados
   - cambios regresivos agrupados
   - pico de pedidos
   - completados agrupados
   - movimiento entre responsables
   - mix delivery / retiro
   - actividad puntual util
   - fallback `Operacion estable`

5. `Riesgo operacional` V.2
   - sin movimiento
   - preparacion lenta
   - muchos cambios
   - cambio regresivo
   - reasignado
   - estancado

6. KPIs y chips superiores
   - health / estado del canal
   - presence
   - KPIs `HOY`
   - KPIs `OPERACION EN VIVO`

## Clasificacion por funcion

### ACTIONABLE

Senales que deberian mover al operador o manager a actuar ahora:

- pedidos demorados
- preparacion lenta
- cambios regresivos
- pedidos con riesgo V.2
- estancados
- congestiones o bursts que siguen activos
- movimiento entre responsables cuando revela friccion

### AWARENESS

Senales que ayudan a entender el dia pero no exigen accion inmediata:

- delivery domina hoy
- retiro domina hoy
- buen movimiento comercial
- cliente frecuente
- ticket alto
- pico reciente ya absorbido
- ritmo bajo cuando no hay riesgo

### NARRATIVE / DECORATIVE

Senales utiles pero con riesgo de repetir lo que ya dice otra capa:

- operacion tranquila
- operacion estable
- sin fricciones relevantes
- sin pedidos activos demorados
- movemento comercial cuando ventas/completados ya lo cuentan con claridad

### REDUNDANT / MERGEABLE

Senales que hoy pueden aparecer en multiples lugares:

- cambios regresivos
- preparacion lenta
- delivery domina
- pedidos completados
- movimiento entre responsables
- operacion tranquila / estable

## Analisis por capa

### INSIGHTS

Que muestra:

- friccion operativa sintetica del momento
- mezcla de riesgo real con contexto de mix

Que aporta:

- una lectura compacta y rapida arriba del fold

Que duplica:

- `Cambios regresivos`, `Preparacion lenta`, `Reasignaciones activas` y `Delivery domina hoy` reaparecen en otras capas

Que deberia priorizar:

- solo senales accionables o de awareness fuerte

Diagnostico:

- es la capa con mayor potencial de convertirse en semaforo principal
- hoy comparte demasiado terreno con `RESUMEN OPERATIVO`

### RESUMEN OPERATIVO

Que muestra:

- una narracion humana corta del estado

Que aporta:

- baja la complejidad del dashboard a frases entendibles

Que duplica:

- repite mucho de `INSIGHTS` y parte de `Riesgo operacional`

Que deberia priorizar:

- sintetizar la historia dominante, no competir item por item con otras capas

Diagnostico:

- funciona bien como resumen, pero en estados de riesgo puede repetir demasiado la misma alerta
- deberia ocultar calma cuando hay friccion fuerte

### INSIGHTS DEL NEGOCIO

Que muestra:

- patrones comerciales y de comportamiento del dia

Que aporta:

- contexto de negocio que no siempre aparece en el foco operacional

Que duplica:

- `Delivery domina hoy` repite el KPI de mix
- `Preparacion mas lenta` roza lo operacional
- `Buen movimiento comercial` se cruza con ventas y completados

Que deberia priorizar:

- awareness comercial de baja friccion

Diagnostico:

- aporta una lectura distinta, pero no deberia competir visualmente con riesgo operativo

### ACTIVIDAD RECIENTE

Que muestra:

- feed priorizado con grupos y eventos concretos

Que aporta:

- memoria viva de lo que paso hace poco

Que duplica:

- `Pedidos que necesitan revision`
- `Cambios regresivos recientes`
- `Delivery domina la operacion`
- `Movimiento entre responsables`

Que deberia priorizar:

- secuencia y evidencia, no resumen tematico repetido

Diagnostico:

- es un feed real y util, pero algunos items narrativos pisan summaries o insights

### Riesgo V.2

Que muestra:

- riesgo por pedido puntual

Que aporta:

- la capa mas accionable a nivel pedido

Que duplica:

- la misma senal puede ascender luego a `INSIGHTS`, `RESUMEN OPERATIVO` y `ACTIVIDAD RECIENTE`

Que deberia priorizar:

- ser la fuente dominante para friccion concreta por pedido

Diagnostico:

- cuando existe, deberia ganar prioridad narrativa sobre mensajes de calma

### Chips / health

Que muestran:

- estado tecnico y awareness de sesion

Que aportan:

- salud de realtime y presencia

Que duplican:

- si el copy se vuelve demasiado operacional pueden competir con estancados o calma

Que deberian priorizar:

- estado tecnico y de presencia, no el resumen operativo de negocio

Diagnostico:

- conviene mantenerlos como capa tecnica / infraestructura, no como voz principal del estado del negocio

## Senales auditadas

### Cambios regresivos

Nombre: Cambios regresivos  
Capa actual: INSIGHTS / RESUMEN OPERATIVO / ACTIVIDAD RECIENTE / Riesgo V.2  
Tipo: operacional  
Clasificacion sugerida: actionable  
Usuario principal: operator / manager  
Valor operacional: alto  
Valor comercial: indirecto  
Accionabilidad: alta  
Redundancias: aparece en multiples capas  
Posibles contradicciones: puede convivir con `Operacion tranquila` o `Operacion estable`  
Problemas de densidad: la misma alerta puede repetirse cuatro veces  
Recomendacion: mantener como senal critica, pero definir capa dominante en OX.4

### Preparacion lenta

Nombre: Preparacion lenta  
Capa actual: INSIGHTS / RESUMEN OPERATIVO / INSIGHTS DEL NEGOCIO / Riesgo V.2  
Tipo: operacional  
Clasificacion sugerida: actionable  
Usuario principal: operator / manager  
Valor operacional: alto  
Valor comercial: indirecto  
Accionabilidad: alta  
Redundancias: se repite entre operacional, resumen, negocio y riesgo por pedido  
Posibles contradicciones: puede convivir con `Buen movimiento comercial` sin aclarar tension operativa  
Problemas de densidad: ruido semantico por contar la misma lentitud en varios tonos  
Recomendacion: mantener, pero separar mejor la version global de la version por pedido

### Pedidos con riesgo

Nombre: Pedidos con riesgo / revision  
Capa actual: RESUMEN OPERATIVO / ACTIVIDAD RECIENTE / Riesgo V.2  
Tipo: operacional  
Clasificacion sugerida: actionable  
Usuario principal: operator / manager  
Valor operacional: muy alto  
Valor comercial: indirecto  
Accionabilidad: muy alta  
Redundancias: el conteo agregado y el riesgo por pedido se pisan facil  
Posibles contradicciones: se contradice con cualquier mensaje de calma  
Problemas de densidad: riesgo de sobrecontar la misma friccion  
Recomendacion: en estados de riesgo, esta debe ser la narrativa dominante

### Delivery domina hoy

Nombre: Delivery domina hoy  
Capa actual: INSIGHTS / RESUMEN OPERATIVO / INSIGHTS DEL NEGOCIO / ACTIVIDAD RECIENTE / KPI mix  
Tipo: comercial / flujo  
Clasificacion sugerida: awareness  
Usuario principal: manager / owner  
Valor operacional: medio  
Valor comercial: medio  
Accionabilidad: media  
Redundancias: es una de las senales mas repetidas del dashboard  
Posibles contradicciones: puede sonar importante aunque haya friccion mas urgente  
Problemas de densidad: ocupa demasiado aire para una senal de contexto  
Recomendacion: necesita una sola capa dominante futura

### Buen movimiento comercial

Nombre: Buen movimiento comercial  
Capa actual: INSIGHTS DEL NEGOCIO  
Tipo: comercial  
Clasificacion sugerida: awareness / narrative  
Usuario principal: owner  
Valor operacional: bajo  
Valor comercial: medio  
Accionabilidad: baja  
Redundancias: ventas y completados ya cuentan una historia cercana  
Posibles contradicciones: puede convivir con congestion operativa y sonar optimista de mas  
Problemas de densidad: suma tono positivo cuando el operador puede necesitar foco tactico  
Recomendacion: degradar cuando exista riesgo o congestion

### Operacion tranquila / estable

Nombre: Operacion tranquila / estable  
Capa actual: INSIGHTS / RESUMEN OPERATIVO / ACTIVIDAD RECIENTE  
Tipo: narrativa  
Clasificacion sugerida: narrative / decorative  
Usuario principal: owner / manager / operator  
Valor operacional: medio cuando es cierto  
Valor comercial: bajo  
Accionabilidad: baja  
Redundancias: varios fallbacks dicen practicamente lo mismo  
Posibles contradicciones: puede chocar con riesgo leve, regresiones o lentitud  
Problemas de densidad: la calma se repite demasiado  
Recomendacion: deberia existir una sola forma de decir calma y desaparecer si hay cualquier senal fuerte

### Ritmo bajo

Nombre: Ritmo bajo  
Capa actual: INSIGHTS DEL NEGOCIO  
Tipo: comercial / awareness  
Clasificacion sugerida: awareness  
Usuario principal: owner / manager  
Valor operacional: medio-bajo  
Valor comercial: medio  
Accionabilidad: media  
Redundancias: se cruza con `Ult. mov.` y con lecturas de calma del resumen  
Posibles contradicciones: puede convivir con pedidos estancados o riesgo activo si el gating se afloja  
Problemas de densidad: puede volverse ruido si aparece mientras hay otras alertas  
Recomendacion: deberia vivir solo en calma real

### Movimiento entre responsables

Nombre: Movimiento entre responsables  
Capa actual: RESUMEN OPERATIVO / ACTIVIDAD RECIENTE / Riesgo V.2 / KPI Reasignaciones  
Tipo: operacional  
Clasificacion sugerida: awareness cuando es leve / actionable cuando escala  
Usuario principal: manager  
Valor operacional: medio  
Valor comercial: bajo  
Accionabilidad: media  
Redundancias: se expresa como KPI, riesgo y feed narrativo  
Posibles contradicciones: puede sonar friccion fuerte cuando solo hubo una transferencia esperable  
Problemas de densidad: demasiadas capas cuentan ownership  
Recomendacion: necesita reglas de escalado dinamico, no presencia constante

## Respuestas explicitas

1. Que insight deberia mirar primero un operador  
   Cualquier senal de riesgo: `Pedidos que necesitan revision`, `Revisar pedidos demorados`, `Cambios regresivos`, `Preparacion lenta`.

2. Que insight deberia mirar primero un dueno  
   `Preparacion lenta` o `Pedidos que necesitan revision` primero; luego `Buen movimiento comercial`, `Delivery domina hoy` y `Ticket alto`.

3. Que insights generan accion inmediata  
   `Pedidos demorados`, `Preparacion lenta`, `Cambios regresivos`, `Pedidos con riesgo`, `Movimiento entre responsables` si escala.

4. Que insights solo dan contexto  
   `Delivery domina hoy`, `Retiro domina hoy`, `Cliente frecuente`, `Ticket alto`, `Ritmo bajo`, `Buen movimiento comercial`.

5. Que insights repiten KPIs  
   `Delivery domina hoy`, `Preparacion mas lenta`, `Buen movimiento comercial`, `Ritmo bajo` y parte de `Operacion tranquila`.

6. Que insights repiten el feed  
   `Cambios regresivos`, `Pedidos completados`, `Movimiento entre responsables`, `Delivery domina la operacion`, `Pedidos que necesitan revision`.

7. Que insights repiten riesgo V.2  
   `Pedidos que necesitan revision`, `Preparacion lenta`, `Cambios regresivos`, parte de `Reasignaciones activas`.

8. Que insights pueden contradecirse entre si  
   `Operacion tranquila` con riesgo leve; `Ritmo bajo` con pedidos estancados; `Buen movimiento comercial` con congestion; `Delivery domina hoy` compitiendo con alertas mas urgentes.

9. Que insights deberian desaparecer cuando hay riesgo  
   `Operacion tranquila`, `Operacion estable`, `Sin fricciones relevantes`, `Buen movimiento comercial`, `Ritmo bajo`, y en muchos casos `Delivery domina hoy`.

10. Que insights deberian mantenerse en mobile  
    Solo los accionables dominantes y, si sobra aire, un awareness contextual fuerte.

11. Que insights deberian colapsarse o comprimirse  
    Los fallbacks de calma, dominancia delivery/retiro, movimiento comercial y ownership leve.

12. Que capa deberia ser dominante cuando varias cuentan lo mismo  
    Riesgo V.2 para friccion concreta por pedido; `INSIGHTS` o `RESUMEN OPERATIVO` para una sola sintesis superior; `ACTIVIDAD RECIENTE` como evidencia, no como resumen duplicado.

## Conflictos detectados

- `Operacion tranquila` o `Operacion estable` mientras existen cambios regresivos
- `Ritmo bajo` mientras hay pedidos con riesgo o estancados
- `Buen movimiento comercial` mientras la operacion esta congestionada
- `Sin fricciones relevantes` mientras V.2 detecta riesgo leve en varios pedidos
- `Delivery domina hoy` ocupando espacio cognitivo cuando la historia real es congestion o demora

## Densidad y mobile

- antes de llegar a filtros y cards, el dashboard ya acumula demasiadas capas interpretativas
- hoy el operador puede leer varias veces la misma historia con distinto tono
- el objetivo de comprender prioridad en menos de 3 segundos no siempre se cumple si varias capas hablan a la vez
- en mobile deberian sobrevivir primero:
  - riesgo dominante
  - un solo resumen superior
  - feed util
  - luego contexto de negocio comprimido

## Recomendaciones para OX.2 / OX.4 / OX.5 / OX.6

### OX.2 - Fold Re-Architecture

- definir una sola capa dominante de lectura sintetica arriba del fold
- bajar o colapsar contexto comercial cuando la operacion este caliente
- evitar que `INSIGHTS`, `RESUMEN OPERATIVO` e `INSIGHTS DEL NEGOCIO` tengan peso casi simetrico

### OX.4 - Dynamic Operational Priority

- cuando exista riesgo, V.2 debe dominar la narrativa y silenciar calma
- `Buen movimiento comercial`, `Ritmo bajo` y dominancias de mix deben degradarse automaticamente en friccion
- una misma senal no deberia gritar desde mas de una capa al mismo tiempo

### OX.5 - Smart Compression

- fusionar los distintos fallbacks de calma
- convertir awareness leves en chips o micro-copy
- agrupar ownership / reasignaciones en una sola lectura cuando el volumen sea bajo
- comprimir mix delivery/retiro en contexto pasivo en vez de repetirlo en varias bandas

### OX.6 - Visual Polish System

- actionable necesita un lenguaje visual claro, sobrio y mas tenso
- awareness necesita tono neutro, mas bajo y menos dominante
- narrative / decorative deberia tener intensidad muy baja y desaparecer rapido cuando haya riesgo
- el lenguaje visual debe distinguir mejor entre:
  - alerta tactica
  - contexto
  - calma

## Conclusiones

- el dashboard ya tiene inteligencia suficiente; el problema principal es competencia narrativa
- hoy varias capas cuentan la misma historia con palabras distintas
- la proxima mejora no es inventar mas insights, sino definir quien habla primero, quien acompana y quien se calla cuando aparece friccion real
