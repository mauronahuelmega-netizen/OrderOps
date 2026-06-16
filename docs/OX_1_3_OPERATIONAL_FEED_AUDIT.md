# OX.1.3 - Operational Feed Audit

## Alcance

OX.1.3 es una auditoria documental del bloque `ACTIVIDAD RECIENTE`. No cambia su logica, no toca realtime y no redisenia el feed. El objetivo es definir con claridad el rol del feed dentro de OrderOps: que merece memoria operacional y que solo ocupa atencion.

## Definicion conceptual actual del feed

Hoy `ACTIVIDAD RECIENTE` funciona como una mezcla de:

- evidencia operacional reciente
- agrupacion de actividad
- lectura narrativa
- awareness de ownership
- contexto de negocio
- fallback de estabilidad

Eso le da valor, pero tambien lo empuja a querer hacer demasiadas cosas a la vez.

## Inventario de eventos actuales

### Eventos individuales

- nuevo pedido
- pedido completado
- pedido cancelado
- cambio de estado
- cambio regresivo
- pedido tomado
- pedido liberado
- pedido reasignado

### Agrupaciones inteligentes

- pedidos con riesgo activo
- cambios regresivos agrupados
- pico de pedidos reciente
- pedidos completados recientemente
- movimiento entre responsables
- delivery / retiro dominante

### Fallbacks narrativos

- operacion estable

## Clasificacion de eventos

### CRITICAL

- cambios regresivos
- pedidos con riesgo activo
- varios pedidos estancados o con demora
- movimiento entre responsables cuando expresa friccion real

### OPERATIONAL

- nuevo pedido
- pedido completado
- pedido cancelado
- cambio de estado relevante
- tomado / liberado / reasignado

### CONTEXTUAL

- pico reciente
- delivery / retiro dominante
- ritmo o mix del dia si aporta lectura de flujo

### DECORATIVE / LOW VALUE

- demasiados completados seguidos sin novedad tactica
- demasiadas tomas/liberaciones aisladas
- `Operacion estable` cuando ya hay otras capas contando calma
- narrativa repetida de contexto que no cambia decisiones

## Analisis por evento

### Cambios regresivos agrupados

Nombre: Cambios regresivos agrupados  
Tipo: operacional / riesgo  
Clasificacion sugerida: critical  
Fuente actual: ACTIVIDAD RECIENTE  
Persistencia ideal: persistente mientras exista riesgo o friccion reciente  
Valor operacional: alto  
Valor comercial: indirecto  
Accionabilidad: alta  
Redundancias: se repite con `INSIGHTS`, `RESUMEN OPERATIVO` y Riesgo V.2  
Problemas de densidad: la misma alerta puede aparecer en demasiadas capas  
Problemas de fatiga: si se repite demasiado pierde urgencia  
Recomendacion: mantener como evidencia operacional, no como summary duplicado

### Pedidos con riesgo activo

Nombre: Pedidos que necesitan revision  
Tipo: operacional / riesgo  
Clasificacion sugerida: critical  
Fuente actual: ACTIVIDAD RECIENTE  
Persistencia ideal: persistente mientras el riesgo siga vivo  
Valor operacional: muy alto  
Valor comercial: indirecto  
Accionabilidad: muy alta  
Redundancias: se pisa con V.2 y con `RESUMEN OPERATIVO`  
Problemas de densidad: riesgo de duplicar el mismo mensaje agregado y por pedido  
Problemas de fatiga: acostumbramiento si el feed solo repite que hay riesgo  
Recomendacion: el feed deberia mostrar evidencia o agregacion util, no competir con la capa de riesgo

### Pico de pedidos reciente

Nombre: Pico de pedidos reciente  
Tipo: contextual / operacional  
Clasificacion sugerida: contextual  
Fuente actual: ACTIVIDAD RECIENTE  
Persistencia ideal: media  
Valor operacional: medio  
Valor comercial: medio  
Accionabilidad: media  
Redundancias: puede cruzarse con `Pico reciente` en V.4 y con carga alta visible en cards  
Problemas de densidad: si el burst ya paso, puede seguir ocupando lugar de primer plano  
Problemas de fatiga: varios bursts similares pueden sentirse repetitivos  
Recomendacion: agruparlo y degradarlo cuando la operacion ya absorbio la carga

### Pedidos completados recientemente

Nombre: Pedidos completados recientemente  
Tipo: operacional / throughput  
Clasificacion sugerida: operational  
Fuente actual: ACTIVIDAD RECIENTE  
Persistencia ideal: efimera a media  
Valor operacional: medio  
Valor comercial: medio  
Accionabilidad: baja  
Redundancias: se cruza con KPI `Completados` y con `Buen movimiento comercial`  
Problemas de densidad: demasiados completados pueden llenar espacio con poco valor tactico  
Problemas de fatiga: muy alta si aparecen seguido  
Recomendacion: solo tiene sentido agrupado; no deberia monopolizar el feed

### Movimiento entre responsables

Nombre: Movimiento entre responsables  
Tipo: operacional / ownership  
Clasificacion sugerida: operational cuando es leve, critical si expresa friccion reiterada  
Fuente actual: ACTIVIDAD RECIENTE  
Persistencia ideal: media  
Valor operacional: medio  
Valor comercial: bajo  
Accionabilidad: media  
Redundancias: se cruza con KPI `Reasignaciones` y con V.2 `reassigned`  
Problemas de densidad: ownership puede contarse en demasiados lugares  
Problemas de fatiga: tomas y liberaciones sueltas cansan rapido  
Recomendacion: agrupar siempre; no mostrar micro-eventos triviales uno por uno

### Delivery / retiro dominante

Nombre: Delivery domina la operacion / Retiro domina la operacion  
Tipo: contextual  
Clasificacion sugerida: contextual  
Fuente actual: ACTIVIDAD RECIENTE  
Persistencia ideal: contextual  
Valor operacional: medio-bajo  
Valor comercial: medio  
Accionabilidad: baja-media  
Redundancias: se pisa con KPI mix y con `INSIGHTS DEL NEGOCIO`  
Problemas de densidad: repite una historia que ya vive mejor en otra capa  
Problemas de fatiga: moderada por repeticion  
Recomendacion: no deberia ser protagonista fuerte dentro del feed

### Nuevo pedido

Nombre: Nuevo pedido  
Tipo: operacional  
Clasificacion sugerida: operational  
Fuente actual: actividad concreta fallback  
Persistencia ideal: efimera  
Valor operacional: alto  
Valor comercial: indirecto  
Accionabilidad: alta  
Redundancias: puede convivir con side effects live y con cards ya visibles  
Problemas de densidad: si cada pedido entra como item, el feed se vuelve cronologia plana  
Problemas de fatiga: alta en picos  
Recomendacion: util como evidencia concreta solo cuando no hay burst o cuando el pedido aporta contexto especial

### Pedido completado individual

Nombre: Pedido completado  
Tipo: operacional  
Clasificacion sugerida: operational  
Fuente actual: actividad concreta fallback  
Persistencia ideal: efimera  
Valor operacional: medio  
Valor comercial: medio  
Accionabilidad: baja  
Redundancias: KPI `Completados`, grupo de completados y `Buen movimiento comercial`  
Problemas de densidad: repeticion facil  
Problemas de fatiga: alta  
Recomendacion: mostrar solo si el item individual agrega algo que la agrupacion no cuenta

### Cambio de estado individual

Nombre: Cambio de estado  
Tipo: operacional  
Clasificacion sugerida: operational  
Fuente actual: actividad concreta fallback  
Persistencia ideal: efimera  
Valor operacional: medio  
Valor comercial: bajo  
Accionabilidad: baja-media  
Redundancias: cards, timeline y modal ya exponen mucho de esto  
Problemas de densidad: demasiados `Listo`, `Preparando`, etc. generan ruido  
Problemas de fatiga: alta  
Recomendacion: deberia filtrarse fuerte; solo estados realmente relevantes merecen feed

### Operacion estable

Nombre: Operacion estable  
Tipo: narrativa  
Clasificacion sugerida: decorative / low value  
Fuente actual: fallback del feed  
Persistencia ideal: contextual y corta  
Valor operacional: bajo  
Valor comercial: bajo  
Accionabilidad: baja  
Redundancias: repite calma que tambien aparece en `INSIGHTS` y `RESUMEN OPERATIVO`  
Problemas de densidad: agrega otra capa de calma innecesaria  
Problemas de fatiga: baja, pero desperdicia espacio  
Recomendacion: el feed no deberia ser la capa principal para declarar calma

## Respuestas explicitas

1. Que deberia ver primero un operador en el feed  
   Evidencia de friccion real: cambios regresivos, pedidos con riesgo, ownership problematico.

2. Que deberia ver primero un dueno  
   Un resumen de friccion operativa fuerte y, si no la hay, un patron contextual de movimiento.

3. Que eventos generan accion inmediata  
   Cambios regresivos, pedidos con riesgo, ownership conflictivo, bursts que siguen vivos.

4. Que eventos solo ayudan a contextualizar  
   Pico reciente, delivery/retiro dominante, throughput de completados, ritmo general.

5. Que eventos son demasiado efimeros para ocupar espacio  
   Cambios de estado triviales, completados uno por uno, tomas/liberaciones aisladas.

6. Que eventos merecen persistencia  
   Riesgo activo, cambios regresivos, ownership conflictivo y friccion que siga vigente.

7. Que eventos deberian agruparse  
   Completados, bursts de pedidos, tomas/liberaciones, movimientos entre responsables, cambios de estado repetidos.

8. Que eventos generan fatiga operacional  
   Completados repetidos, cambios de estado triviales, muchas tomas/liberaciones, demasiada narrativa de calma.

9. Que eventos repiten insights  
   Cambios regresivos, preparacion lenta, delivery dominante, operacion estable.

10. Que eventos repiten riesgo V.2  
   Pedidos que necesitan revision, cambios regresivos, ownership conflictivo, demora por pedido.

11. Que eventos repiten KPIs  
   Completados, mix delivery/retiro, reasignaciones.

12. Que eventos no deberian vivir en el feed  
   Cualquier narrativa de calma repetida, awareness comercial redundante y micro-eventos de bajo valor.

13. El feed debe priorizar:  
   primero evidencia, luego memoria operacional y recien despues awareness contextual.

14. Que NO deberia convertirse el feed  
   No deberia convertirse en inbox, chat, auditoria enterprise, notification center ni cronologia plana infinita.

15. Que identidad deberia tener el feed en OrderOps  
   **Memoria operacional priorizada basada en evidencia reciente.**

## Feed vs otras capas

### Con INSIGHTS

Overlap fuerte en:

- cambios regresivos
- preparacion lenta
- reasignaciones
- delivery domina

Diagnostico:

- `INSIGHTS` deberia sintetizar; el feed deberia mostrar evidencia o secuencia, no repetir el mismo titular.

### Con RESUMEN OPERATIVO

Overlap fuerte en:

- pedidos con riesgo
- operacion tranquila / estable
- movimiento entre responsables

Diagnostico:

- el resumen deberia hablar; el feed deberia respaldar o detallar, no competir.

### Con INSIGHTS DEL NEGOCIO

Overlap en:

- delivery domina
- buen movimiento comercial
- pico reciente

Diagnostico:

- estas senales viven mejor como contexto de negocio que como feed principal.

### Con Riesgo V.2

Overlap fuerte en:

- pedidos demorados
- cambios multiples / regresivos
- reassigned

Diagnostico:

- V.2 deberia ser la fuente dominante del riesgo. El feed solo deberia mostrar memoria o evidencia de ese riesgo.

### Con KPIs

Overlap en:

- completados
- mix delivery/retiro
- reasignaciones

Diagnostico:

- el feed no deberia repetir numericamente lo que los KPIs ya fijan, salvo cuando el patron temporal agrega sentido.

## Fatiga operacional

### Ruido repetitivo

- demasiados completados seguidos
- demasiados cambios de estado triviales
- demasiadas tomas/liberaciones de bajo impacto
- demasiadas frases de estabilidad

### Sobreagrupacion

- el feed corre el riesgo de explicar demasiado patrones que otra capa ya resume

### Invisibilizacion

- si entran demasiados eventos operativos menores, los cambios regresivos o riesgos reales pueden perderse en el volumen

## Persistencia temporal ideal

### Efimeros

- completados individuales
- cambios de estado triviales
- nuevos pedidos sin contexto especial

### Persistentes

- riesgo activo
- cambios regresivos
- ownership conflictivo o friccion reiterada

### Agrupables

- completados
- bursts de nuevos pedidos
- movimientos entre responsables
- cambios de estado repetidos

### Contextuales

- delivery / retiro dominante
- ritmo del dia
- buen movimiento solo cuando no compite con riesgo

## Densidad y mobile

- el feed hoy ocupa un lugar importante antes de filtros y cards
- en mobile, el feed deberia sobrevivir solo con:
  - eventos critical
  - una o dos piezas de evidencia operacional
- lo primero en comprimirse deberia ser:
  - delivery dominante dentro del feed
  - completados agrupados sin novedad tactica
  - fallbacks de estabilidad
- lo primero en desaparecer deberia ser la narrativa de calma repetida

## Recomendaciones para OX.2 / OX.3 / OX.4 / OX.5 / OX.6

### OX.2 - Fold Re-Architecture

- el feed no deberia competir con todas las capas interpretativas en igualdad de peso
- si el fold esta caliente, el feed deberia bajar o colapsar parcialmente
- su protagonismo deberia depender del estado operativo

### OX.3 - Operational Lanes

- estados y ownership podrian vivir mejor parcialmente en lanes futuras
- el feed deberia quedarse con memoria transversal y evidencia, no con todo el workflow

### OX.4 - Dynamic Operational Priority

- cuando haya riesgo o regresiones, el feed debe escalar evidencia critica
- cuando la operacion este calma, puede degradarse a contexto compacto
- ciertos eventos deben subir solos: cambios regresivos, ownership conflictivo, bursts activos

### OX.5 - Smart Compression

- agrupar completados y micro-eventos de ownership
- comprimir texto narrativo de calma
- degradar mix delivery/retiro y awareness comercial dentro del feed

### OX.6 - Visual Polish System

- `critical`: visual sobrio pero dominante
- `operational`: claro y escaneable
- `contextual`: mas bajo y menos saturado
- `narrative`: el tono mas tenue de todos

## Definicion final

### Que SI es el feed

Una **memoria operacional priorizada basada en evidencia reciente**.

### Que NO es el feed

- no es inbox
- no es chat
- no es auditoria enterprise
- no es notification center
- no es BI
- no es cronologia plana infinita

## Conclusiones

- el feed tiene valor real cuando muestra evidencia reciente y agrupada de lo que esta pasando
- pierde claridad cuando intenta resumir, contextualizar y tranquilizar al mismo tiempo
- la fase futura no deberia preguntarse solo `como se ve el feed`, sino `que merece memoria operacional y que no`
