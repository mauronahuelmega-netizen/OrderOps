# OX.1.6 - Operational Density Review

## Alcance

OX.1.6 es una auditoria documental de densidad. No comprime la UI, no toca layout y no cambia ningun bloque. El objetivo es decidir que densidad ayuda a operar, cual sigue siendo tolerable y cual ya empieza a cansar al operador.

## Diagnostico general

El dashboard actual no sufre por falta de informacion. Sufre por coexistencia simultanea de demasiadas capas utiles. La densidad total no es un problema lineal; se vuelve pesada por la combinacion de:

- muchas superficies visibles
- muchas voces narrativas
- demasiadas decisiones antes de llegar a cards
- owner y operator leyendo el mismo fold con intenciones distintas

Conclusion sintetica:

- desktop: densidad alta pero todavia aprovechable
- laptop: densidad alta con perdida gradual de jerarquia
- tablet: densidad delicada
- mobile: densidad facilmente toxica si no se degrada contexto

## Diagnostico de visual density

La densidad visual actual es alta por:

- multiples strips horizontales
- chips superiores
- varias bandas narrativas
- busqueda + chips derivados + filtros
- cards con sus propias senales internas

Lectura:

- la pantalla tiene mucha informacion visible y bastante poca basura real
- el problema es que demasiadas superficies comparten peso medio
- hay poca informacion claramente silenciosa

Clasificacion:

- desktop: high but acceptable density
- laptop: high but acceptable tirando a limite
- tablet: cercana a toxic density
- mobile: toxic density si se mantiene todo arriba del fold

## Diagnostico de cognitive density

La densidad cognitiva es alta porque conviven varios sistemas semanticos:

- salud tecnica
- KPIs comerciales
- KPIs operacionales
- insights
- resumen
- feed
- busqueda y filtros
- senales de riesgo y ownership en cards

El operador necesita recordar simultaneamente:

- si el filtro actual sigue activo
- que la busqueda refina el filtro
- que el riesgo puede estar en cards, summaries, feed e insights
- que owner y operator extraen valor distinto del mismo fold

Diagnostico:

- hay hidden density importante
- la pantalla pide demasiada interpretacion antes de la accion

## Diagnostico de operational density

La densidad operacional mide cuantos pasos mentales hay antes de actuar.

Hoy el operador muchas veces debe:

1. leer salud minima
2. leer strips
3. leer capas narrativas
4. llegar a busqueda/filtros
5. escanear cards
6. decidir si abrir modal o actuar desde quick actions

Lo valioso:

- las cards siguen siendo muy densas y utiles
- V.2 y assignment agregan densidad que si ayuda a operar

Lo costoso:

- demasiadas capas previas pueden retrasar el momento de accion

Diagnostico:

- densidad operacional de cards: healthy density
- densidad operacional del fold previo a cards: high but acceptable en desktop, toxic en mobile

## Diagnostico de interactive density

La densidad interactiva actual nace de:

- busqueda operacional
- chips derivados
- filtros
- quick actions
- cards clickeables
- feed clickeable
- modal y vista profunda

No hay exceso de controles por bloque, pero si una suma grande de microinteracciones distribuidas.

Diagnostico:

- desktop: la densidad interactiva es alta pero util
- mobile: scroll horizontal + filtros + chips + tap targets eleva la fatiga
- parte de la carga es invisible: recordar que la busqueda y el filtro se combinan

## Diagnostico de narrative density

La densidad narrativa es el punto mas cargado del dashboard.

Conviven:

- `INSIGHTS`
- `RESUMEN OPERATIVO`
- `INSIGHTS DEL NEGOCIO`
- `ACTIVIDAD RECIENTE`
- copy de riesgo
- labels de KPIs
- empty states

Diagnostico:

- demasiadas voces intentando explicar el mismo estado
- la narrativa es rica, pero no siempre jerarquizada
- la calma y el contexto pueden aparecer demasiadas veces

Clasificacion:

- narrative density: toxic bajo riesgo
- narrative density: high but acceptable en calma desktop

## Analisis por bloque

### Health / realtime / presence

Nombre: Health / realtime / presence  
Tipo de densidad dominante: visual / contextual  
Densidad visual: media  
Densidad cognitiva: media  
Densidad operacional: baja-media  
Densidad interactiva: baja  
Densidad narrativa: baja  
Usuario mas afectado: operator  
Viewport mas afectado: mobile  
Estado operacional mas afectado: operacion tranquila  
Valor real: medio-alto  
Fatiga generada: baja aislada, media por acumulacion  
Redundancias: puede competir con queue pressure y otras pills  
Hidden density: mantener conciencia de salud tecnica  
Futuro probable: mantener / degradar  
Recomendacion: util, pero debe seguir siendo capa tecnica silenciosa

### KPIs `HOY`

Nombre: HOY  
Tipo de densidad dominante: visual / contextual  
Densidad visual: alta  
Densidad cognitiva: media  
Densidad operacional: media-baja para operator  
Densidad interactiva: baja  
Densidad narrativa: media  
Usuario mas afectado: operator  
Viewport mas afectado: mobile  
Estado operacional mas afectado: congestion / riesgo  
Valor real: alto para owner, medio para manager, bajo-medio para operator  
Fatiga generada: media  
Redundancias: se cruza con business insights  
Hidden density: obliga a separar negocio de operacion bajo presion  
Futuro probable: comprimir / degradar / hacer dinamico  
Recomendacion: contexto fuerte, pero no siempre merece fold premium completo

### KPIs `OPERACION EN VIVO`

Nombre: OPERACION EN VIVO  
Tipo de densidad dominante: operacional  
Densidad visual: alta  
Densidad cognitiva: media-alta  
Densidad operacional: alta  
Densidad interactiva: baja  
Densidad narrativa: baja-media  
Usuario mas afectado: operator / manager  
Viewport mas afectado: laptop / mobile  
Estado operacional mas afectado: congestion  
Valor real: muy alto  
Fatiga generada: baja si se mantiene jerarquizado  
Redundancias: algunas senales se repiten en insights y summaries  
Hidden density: leer estado sano vs critico con el mismo peso actual  
Futuro probable: mantener / hacer dinamico  
Recomendacion: densidad alta pero sana; es una de las mejores densidades del dashboard

### INSIGHTS

Nombre: INSIGHTS  
Tipo de densidad dominante: narrativa / operacional  
Densidad visual: media-alta  
Densidad cognitiva: alta  
Densidad operacional: media-alta  
Densidad interactiva: baja  
Densidad narrativa: alta  
Usuario mas afectado: operator / manager  
Viewport mas afectado: mobile  
Estado operacional mas afectado: riesgo activo  
Valor real: alto  
Fatiga generada: media-alta por repeticion con otras capas  
Redundancias: resumen, feed y V.2  
Hidden density: decidir si leer aqui o directamente en cards  
Futuro probable: fusionar / hacer dinamico  
Recomendacion: densidad valiosa, pero necesita menos competencia alrededor

### RESUMEN OPERATIVO

Nombre: RESUMEN OPERATIVO  
Tipo de densidad dominante: narrativa  
Densidad visual: media  
Densidad cognitiva: media-alta  
Densidad operacional: media  
Densidad interactiva: baja  
Densidad narrativa: alta  
Usuario mas afectado: operator  
Viewport mas afectado: mobile  
Estado operacional mas afectado: riesgo / congestion  
Valor real: alto como sintesis  
Fatiga generada: media-alta si repite insights  
Redundancias: insights, feed y V.2  
Hidden density: otra capa mas que interpretar antes de actuar  
Futuro probable: fusionar / comprimir / hacer dinamico  
Recomendacion: bueno como sintesis, costoso como banda adicional permanente

### INSIGHTS DEL NEGOCIO

Nombre: INSIGHTS DEL NEGOCIO  
Tipo de densidad dominante: narrativa / contextual  
Densidad visual: media  
Densidad cognitiva: media  
Densidad operacional: baja  
Densidad interactiva: baja  
Densidad narrativa: alta  
Usuario mas afectado: operator  
Viewport mas afectado: mobile  
Estado operacional mas afectado: operacion caliente  
Valor real: medio para owner, bajo para operator  
Fatiga generada: media-alta  
Redundancias: KPIs comerciales y feed contextual  
Hidden density: distinguir valor de negocio vs urgencia operacional  
Futuro probable: degradar / colapsar / hacer dinamico  
Recomendacion: claro candidato a compresion futura

### ACTIVIDAD RECIENTE

Nombre: ACTIVIDAD RECIENTE  
Tipo de densidad dominante: narrativa / evidencia  
Densidad visual: media  
Densidad cognitiva: media-alta  
Densidad operacional: media  
Densidad interactiva: media  
Densidad narrativa: media-alta  
Usuario mas afectado: operator / manager  
Viewport mas afectado: mobile  
Estado operacional mas afectado: congestion  
Valor real: alto si aporta evidencia; medio si repite  
Fatiga generada: media  
Redundancias: insights, resumen, KPIs y V.2  
Hidden density: decidir si es memoria o prioridad  
Futuro probable: comprimir / hacer dinamico / colapsar  
Recomendacion: densidad util cuando es evidencia; pesada cuando narra demasiado

### Busqueda operacional

Nombre: Busqueda operacional  
Tipo de densidad dominante: interactiva / operacional  
Densidad visual: media  
Densidad cognitiva: media  
Densidad operacional: alta  
Densidad interactiva: alta  
Densidad narrativa: baja  
Usuario mas afectado: operator  
Viewport mas afectado: mobile  
Estado operacional mas afectado: congestion  
Valor real: alto  
Fatiga generada: baja por si sola, media por coexistencia con filtros y chips  
Redundancias: parte de sus intenciones se pisan con filtros  
Hidden density: recordar que refina el filtro actual  
Futuro probable: mantener / hacer dinamico  
Recomendacion: densidad alta pero muy util

### Chips derivados

Nombre: Chips derivados de busqueda  
Tipo de densidad dominante: interactiva / visual  
Densidad visual: media  
Densidad cognitiva: media  
Densidad operacional: media  
Densidad interactiva: media  
Densidad narrativa: baja-media  
Usuario mas afectado: operator  
Viewport mas afectado: mobile 320px  
Estado operacional mas afectado: busquedas compuestas  
Valor real: medio  
Fatiga generada: media  
Redundancias: repiten parte del texto de query  
Hidden density: mas elementos para leer antes de cards  
Futuro probable: comprimir / colapsar  
Recomendacion: utiles como traduccion, candidatos tempranos a compresion

### Filtros

Nombre: Filtros  
Tipo de densidad dominante: interactiva  
Densidad visual: media  
Densidad cognitiva: media  
Densidad operacional: alta  
Densidad interactiva: alta  
Densidad narrativa: baja  
Usuario mas afectado: operator / manager  
Viewport mas afectado: mobile  
Estado operacional mas afectado: carga alta  
Valor real: alto  
Fatiga generada: media  
Redundancias: algunas intenciones ya viven en busqueda  
Hidden density: recordar combinacion filtro + query  
Futuro probable: mantener / comprimir / hacer dinamico  
Recomendacion: muy utiles, pero la convivencia con busqueda necesita menos friccion futura

### Cards

Nombre: Cards  
Tipo de densidad dominante: operacional  
Densidad visual: alta  
Densidad cognitiva: alta  
Densidad operacional: muy alta  
Densidad interactiva: alta  
Densidad narrativa: media  
Usuario mas afectado: owner ve de mas; operator las necesita  
Viewport mas afectado: mobile  
Estado operacional mas afectado: congestion  
Valor real: maximo  
Fatiga generada: baja-media si el acceso es rapido; alta si quedan enterradas  
Redundancias: poca; aqui vive la verdad operativa  
Hidden density: la superficie mas importante llega tarde  
Futuro probable: mantener / priorizar  
Recomendacion: densidad muy alta pero saludable; no es el problema, es la solucion

### Risk indicators V.2

Nombre: Risk indicators  
Tipo de densidad dominante: operacional / cognitiva  
Densidad visual: baja-media  
Densidad cognitiva: media  
Densidad operacional: alta  
Densidad interactiva: baja  
Densidad narrativa: media  
Usuario mas afectado: operator / manager  
Viewport mas afectado: mobile  
Estado operacional mas afectado: riesgo activo  
Valor real: muy alto  
Fatiga generada: baja si domina; alta si se repite arriba y abajo  
Redundancias: insights, resumen y feed  
Hidden density: misma senal contada varias veces  
Futuro probable: mantener / hacer dinamico  
Recomendacion: densidad sana si se vuelve capa dominante del riesgo

### Assignment

Nombre: Assignment visible  
Tipo de densidad dominante: operacional  
Densidad visual: media  
Densidad cognitiva: media  
Densidad operacional: alta  
Densidad interactiva: media  
Densidad narrativa: baja  
Usuario mas afectado: operator / manager  
Viewport mas afectado: mobile  
Estado operacional mas afectado: multioperador  
Valor real: muy alto  
Fatiga generada: baja-media  
Redundancias: busqueda `mios`, `sin responsable`, feed de ownership  
Hidden density: ownership puede leerse en demasiadas capas  
Futuro probable: mantener / hacer dinamico  
Recomendacion: densidad util y necesaria

### Highlights

Nombre: Highlights realtime  
Tipo de densidad dominante: visual / operacional  
Densidad visual: baja  
Densidad cognitiva: baja  
Densidad operacional: alta  
Densidad interactiva: baja  
Densidad narrativa: baja  
Usuario mas afectado: operator  
Viewport mas afectado: ninguno de forma grave  
Estado operacional mas afectado: nuevos pedidos / hidden returns  
Valor real: alto  
Fatiga generada: baja  
Redundancias: poca  
Hidden density: baja  
Futuro probable: mantener  
Recomendacion: ejemplo de densidad saludable

### Modal / vista profunda

Nombre: Modal / vista profunda  
Tipo de densidad dominante: operacional / interactiva  
Densidad visual: alta  
Densidad cognitiva: alta  
Densidad operacional: alta  
Densidad interactiva: alta  
Densidad narrativa: media-alta  
Usuario mas afectado: owner en detalle operativo excesivo; operator lo aprovecha  
Viewport mas afectado: mobile  
Estado operacional mas afectado: sesiones largas  
Valor real: muy alto  
Fatiga generada: aceptable porque aparece bajo demanda  
Redundancias: timeline / resumen / riesgo / assignment conviven, pero dentro de una superficie intencional  
Hidden density: baja comparada con el fold porque el contexto ya es explicito  
Futuro probable: mantener  
Recomendacion: densidad alta pero justificada

## Densidad por viewport

### Desktop

- mucha densidad, pero todavia interpretable
- varias capas pueden convivir sin colapsar
- ya esta cerca del limite sano antes de sentirse coleccion de widgets

### Laptop

- empieza a comprimirse visualmente
- se pierde aire entre strips, summaries y feed
- la jerarquia se vuelve menos obvia

### Tablet

- varias capas empiezan a parecer demasiado iguales
- el costo de scroll y lectura crece

### Mobile 390px

- los pedidos quedan demasiado abajo si se muestran todas las capas
- busqueda, filtros y cards pierden prioridad relativa

### Mobile 320px

- la densidad se vuelve toxica rapido
- chips, strips, summaries y feed pelean por el mismo espacio

## Densidad por rol

### Owner

Tolera mejor:

- `HOY`
- contexto comercial
- resumenes
- metrica agregada

Sufre:

- detalle operativo demasiado granular si aparece demasiado pronto

### Operator

Necesita:

- riesgo
- workflow
- ownership
- cards
- velocidad

Sufre:

- contexto comercial arriba del fold
- narrativa repetida
- demasiadas capas previas a la accion

### Manager

Necesita mezcla de ambos.

Sufre cuando:

- todo tiene el mismo peso
- no queda claro si mirar negocio, riesgo o ownership primero

## Densidad por estado operacional

### Operacion tranquila

- la densidad alta es mas tolerable
- contexto y narrativa aportan mas

### Operacion activa

- empieza a molestar lo comercial y lo repetitivo

### Congestion

- la densidad narrativa se vuelve friccion
- el scanning pre-cards pesa demasiado

### Riesgo activo

- deberian desaparecer o degradarse varias capas contextuales
- la repeticion de riesgo se vuelve cansadora

### Pico de pedidos

- aumenta el scanning manual
- vuelve mas valioso riesgo, ownership y foco

## Healthy density

- cards con estado, riesgo, assignment y quick actions
- `OPERACION EN VIVO`
- highlights realtime
- busqueda operacional cuando ayuda a encontrar foco

## High but acceptable density

- strips superiores en desktop
- feed priorizado cuando aporta evidencia real
- busqueda + filtros juntos, si la carga no es extrema
- modal / vista profunda bajo demanda

## Toxic density

- varias capas narrativas antes de cards en mobile
- contexto comercial visible con el mismo peso en estados calientes
- chips derivados + filtros + summaries + feed acumulados
- demasiados bloques de peso medio sin una voz dominante

## Hidden density

- recordar que la busqueda refina el filtro actual
- riesgo repetido en varias capas
- owner y operator mirando el mismo fold con intenciones diferentes
- tener que reconciliar negocio vs operacion bajo presion

## Cost of scanning

Diagnostico cualitativo:

- muchos saltos visuales antes de cards
- scroll relevante antes de la accion en mobile
- scanning horizontal por filtros
- lectura redundante de la misma senal en KPI / insight / summary / feed / card

Encontrar:

- riesgo: hoy posible, pero repartido
- pendiente: facil via filtro o grouping
- sin responsable: depende demasiado de busqueda o scanning
- mio: depende demasiado de busqueda o scanning
- delivery listo: posible, pero exige combinacion de estado y metodo
- pedido nuevo: highlight ayuda, pero el camino hasta cards puede tardar

## Senales de fatiga operacional

- repeticion textual
- demasiados puntos de atencion media
- demasiados strips
- exceso de scroll antes de accion
- demasiadas voces narrativas
- varios estados visuales simultaneos
- cambio constante de lenguaje entre tecnico, comercial y operacional

## Que comprimir primero

1. `INSIGHTS DEL NEGOCIO`
2. partes contextuales del feed
3. narrativa repetida de calma
4. chips derivados largos
5. contexto comercial cuando la operacion esta caliente

## Que debe sobrevivir siempre

- cards
- riesgo
- ownership
- foco de navegacion
- KPIs operacionales esenciales
- salud minima de sesion

## Recomendaciones para OX.2 / OX.4 / OX.5 / OX.6

### OX.2 - Fold Re-Architecture

- llevar foco y cards mas arriba en la experiencia
- separar mejor negocio de operacion
- reducir capas previas a la accion

### OX.4 - Dynamic Operational Priority

- degradar contexto comercial, calma y feed contextual bajo riesgo
- escalar V.2, ownership y `OPERACION EN VIVO` bajo congestion

### OX.5 - Smart Compression

- comprimir narrativa antes que evidencia
- fusionar contexto redundante
- convertir contexto secundario en senales compactas

### OX.6 - Visual Polish System

- endurecer jerarquia entre critico, tactico, contextual y pasivo
- reducir ruido sin sacrificar capacidad operativa
- mantener la densidad util de las cards y bajar la densidad ruidosa del fold

## Respuestas explicitas

1. Que bloques generan mayor fatiga visual  
   Las capas narrativas acumuladas y los strips repetidos antes de cards.

2. Que bloques generan mayor fatiga cognitiva  
   `INSIGHTS`, `RESUMEN OPERATIVO`, `INSIGHTS DEL NEGOCIO`, feed y combinacion busqueda + filtros.

3. Que bloques generan mayor fatiga narrativa  
   `INSIGHTS`, `RESUMEN OPERATIVO`, `INSIGHTS DEL NEGOCIO` y feed cuando todos cuentan la misma historia.

4. Que bloques aumentan scanning manual  
   ownership, riesgo, combinaciones de estado + metodo y busqueda subordinada al filtro actual.

5. Que bloques son densos pero utiles  
   cards, `OPERACION EN VIVO`, V.2, assignment y modal.

6. Que bloques son densos y poco accionables  
   `INSIGHTS DEL NEGOCIO` y partes contextuales del feed en estados calientes.

7. Que bloques son tolerables en desktop pero toxicos en mobile  
   strips completos, resumenes en cadena, feed antes de cards, chips derivados largos.

8. Que bloques deberian comprimirse primero  
   negocio, feed contextual, calma repetida y chips derivados.

9. Que bloques deberian sobrevivir siempre  
   cards, riesgo, ownership, foco de navegacion y KPIs operacionales clave.

10. Que bloques deberian degradarse cuando hay riesgo  
    contexto comercial, feed contextual, calma y parte de `HOY`.

11. Que bloques deberian desaparecer primero en mobile  
    `INSIGHTS DEL NEGOCIO`, narrativa repetida, parte del feed contextual.

12. Que densidad es producto de redundancia  
    riesgo repetido, delivery dominante repetido, calma repetida, throughput repetido.

13. Que densidad es producto de interaccion  
    busqueda + chips + filtros + quick actions + feed clickeable.

14. Que densidad es producto de intentar servir owner y operator al mismo tiempo  
    gran parte del fold superior.

15. El dashboard se siente rapido porque es claro o porque muestra mucha informacion  
    hoy se siente potente porque muestra mucha informacion; la claridad todavia necesita consolidacion.

## Conclusiones

- la densidad mas saludable vive en cards, riesgo y ownership
- la densidad mas costosa vive en la acumulacion de capas previas
- el proximo trabajo no es sacar informacion util, sino distinguir mejor entre densidad que ayuda a operar y densidad que solo agrega friccion
