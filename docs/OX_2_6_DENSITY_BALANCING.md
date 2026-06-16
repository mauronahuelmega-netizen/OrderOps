# OX.2.6 - Density Balancing

## Resumen ejecutivo

OX.2.6 convierte la jerarquia ya definida en una politica de densidad. No redisenia el dashboard ni decide layout final. Decide **cuanta presencia cognitiva y visual merece cada capa** segun su valor operacional, su valor contextual y el estado de la operacion.

La conclusion central es:

- la densidad no es enemiga si ayuda a decidir
- la densidad se vuelve problema cuando varias capas medias compiten por el mismo segundo de atencion
- la operacion critica debe conservar densidad util
- el contexto secundario debe comprimirse, diferirse o colapsarse antes que cards, ownership, riesgo y foco
- mobile necesita un balance mucho mas agresivo que desktop

En corto: el objetivo no es tener menos informacion, sino **menos friccion por unidad de informacion**.

## Principios de densidad cognitiva y visual

1. La densidad util se preserva.
2. La densidad redundante se degrada primero.
3. Las cards no pagan el costo del contexto secundario.
4. Riesgo, ownership y foco siempre tienen prioridad sobre narrativa y negocio.
5. La compresion debe afectar primero al contexto, no a la accion.
6. Mobile necesita menos capas, no solo menos ancho.
7. Una misma senal no debe ocupar multiples superficies con igual peso.
8. La densidad debe seguir el estado operacional, no una jerarquia fija e inmovil.

## Priorizacion de bloques

### Critical Operations

- cards
- risk indicators
- assignment / ownership
- `OPERACION EN VIVO`
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
- chips explicativos demasiado largos

## Analisis por bloque

### `INSIGHTS DEL NEGOCIO`

Bloque: `INSIGHTS DEL NEGOCIO`  
Categoria: Business Context  
Prioridad cognitiva: media-baja  
Compresion minima: una sola lectura resumida o menos cards visibles  
Degradacion bajo congestion: fuerte  
Defer / collapse: si hay riesgo, ownership gaps o carga alta  
Sticky candidate: no  
Mobile behavior: colapsado o diferido casi siempre  
Riesgo UX: dejar owner sin lectura del dia si desaparece en todos los modos  
Recomendacion: mantener valor comercial, quitar volumen por defecto

### Narrativa pasiva

Bloque: Narrativa pasiva  
Categoria: Passive Narrative  
Prioridad cognitiva: baja  
Compresion minima: fusionar en una sola senal de calma  
Degradacion bajo congestion: total  
Defer / collapse: si existe cualquier friccion o actividad real  
Sticky candidate: no  
Mobile behavior: ocultar primero  
Riesgo UX: ocupar fold premium sin mejorar decision  
Recomendacion: primera candidata a desaparecer del primer plano

### Feed contextual

Bloque: Feed contextual  
Categoria: Tactical Awareness / Passive Narrative segun contenido  
Prioridad cognitiva: media cuando hay evidencia, baja cuando es solo contexto  
Compresion minima: agrupar items y recortar narrativa  
Degradacion bajo congestion: alta  
Defer / collapse: si cards y riesgo ya llevan la conversacion  
Sticky candidate: no  
Mobile behavior: dejar solo evidencia util y no redundante  
Riesgo UX: perder memoria transversal si se comprime sin distinguir evidencia de ruido  
Recomendacion: preservar feed como memoria, no como ruido cronologico

### KPIs secundarios

Bloque: KPIs secundarios  
Categoria: Business Context  
Prioridad cognitiva: media-baja  
Compresion minima: consolidacion o lectura compacta del grupo  
Degradacion bajo congestion: alta  
Defer / collapse: cuando no cambian decisiones del momento  
Sticky candidate: no  
Mobile behavior: colapsar primero  
Riesgo UX: quitar demasiado negocio si desaparecen todos  
Recomendacion: mantener un ancla comercial minima y comprimir el resto

### Strips de informacion complementaria

Bloque: Strips de informacion complementaria  
Categoria: Business Context / Tactical Awareness segun contenido  
Prioridad cognitiva: media  
Compresion minima: menos slots o menos detalle conceptual  
Degradacion bajo congestion: media-alta  
Defer / collapse: si aumentan demasiado el pre-card scanning  
Sticky candidate: no  
Mobile behavior: gran parte del contenido deberia entrar comprimido  
Riesgo UX: seguir pesando como estructuras principales por costumbre visual  
Recomendacion: no dejar que la superficie mande mas que su valor

### `HOY` extendido

Bloque: `HOY` extendido  
Categoria: Business Context  
Prioridad cognitiva: media para owner, baja para operator bajo presion  
Compresion minima: strip resumido o lectura compacta del dia  
Degradacion bajo congestion: alta  
Defer / collapse: active, congested, risk, mobile  
Sticky candidate: no  
Mobile behavior: compacto o colapsado  
Riesgo UX: ocupar demasiado aire pre-card solo por ser historicamente fijo  
Recomendacion: sostenerlo como contexto, no como superficie de primer plano permanente

### Summaries secundarios

Bloque: Summaries secundarios  
Categoria: Tactical Awareness / Passive Narrative  
Prioridad cognitiva: media si sintetizan, baja si repiten  
Compresion minima: fusionar o dejar solo uno  
Degradacion bajo congestion: media-alta  
Defer / collapse: si cards, riesgo o feed ya explican el estado  
Sticky candidate: no  
Mobile behavior: nunca acumular varios a la vez  
Riesgo UX: multiplicar voces con apariencia de claridad  
Recomendacion: permitir solo summaries que ahorren trabajo real

### Chips derivados largos

Bloque: Chips derivados largos  
Categoria: Passive Narrative / Tactical Awareness  
Prioridad cognitiva: baja-media  
Compresion minima: agrupar o acortar la explicacion  
Degradacion bajo congestion: media  
Defer / collapse: cuando la query ya fue entendida  
Sticky candidate: no  
Mobile behavior: compactacion agresiva  
Riesgo UX: ruido horizontal y costo de scanning  
Recomendacion: mantener claridad de foco sin ocupar mas superficie de la necesaria

## Secuencia conceptual de aparicion y retiro de bloques

### Aparicion ideal

1. salud minima
2. riesgo / carga
3. ownership
4. foco de navegacion
5. cards
6. awareness tactica
7. negocio resumido
8. narrativa pasiva

### Retiro ideal cuando sube la presion

1. narrativa pasiva
2. chips largos
3. feed contextual
4. insights del negocio
5. KPIs comerciales secundarios
6. `HOY` extendido

Regla:

- lo ultimo en retirarse deberia ser lo mas cercano a una decision real

## Ajustes por dispositivo

### Desktop

Permite:

- mas contexto visible
- compresion mas suave
- convivencia de negocio resumido y awareness tactica

Debe evitar:

- demasiadas bandas medias con igual peso
- fold largo antes de cards

### Mobile

Debe priorizar:

- cards
- riesgo
- ownership
- foco
- `OPERACION EN VIVO` esencial

Debe comprimir:

- negocio extendido
- feed contextual
- chips largos
- summaries redundantes
- narrativa suave

Debe evitar:

- scroll previo excesivo
- muchas capas antes de cards
- horizontales largas para entender foco

## Relacion con atencion operativa (Attention Budget)

### Desktop

- Critical Operations: 50%
- Tactical Awareness: 25%
- Business Context: 15%
- Passive Narrative: 10% maximo

### Mobile

- Critical Operations: 65%
- Tactical Awareness: 25%
- Business Context: 10%
- Passive Narrative: 0-5%

OX.2.6 aterriza ese budget como politica de densidad:

- si un bloque ya excede su presupuesto, debe comprimirse o diferirse
- si una capa secundaria roba superficie a una capa critica, su densidad esta desbalanceada

## Reglas conceptuales para colapsar, comprimir o diferir segun riesgo / congestion

### Calm

- negocio puede seguir visible en compacto
- summaries suaves pueden vivir
- feed contextual puede acompanar

### Active

- negocio se compacta
- summaries redundantes pierden peso
- foco y workflow suben

### Congested

- riesgo, ownership y cards dominan
- business context se degrada
- feed contextual se recorta
- chips y narrativa se comprimen

### Risk

- se preserva solo lo que reduce accion o scanning
- todo lo no accionable pierde prioridad
- la compresion debe ser maxima sobre narrativa y contexto pasivo

## Integracion conceptual con OX.2.5

OX.2.5 dijo **que** puede colapsarse.  
OX.2.6 define **cuanto peso** deberia conservar mientras siga visible.

Integracion:

- lo colapsable no siempre debe desaparecer: a veces solo debe compactarse
- la compresion es una capa intermedia entre visibilidad plena y colapso
- desktop puede conservar mas bloques en version compacta
- mobile debe empujar varios de esos bloques directamente a estado diferido o hidden-first

## Preparacion para OX.2.7 y OX.2.8

### OX.2.7 - Mobile Fold Re-Architecture

Este documento deja claro:

- que bloques deben entrar al fold mobile ya comprimidos
- que densidad es tolerable en pantallas chicas
- que elementos secundarios no deben vivir arriba de cards

### OX.2.8 - Fold Consolidation Blueprint

Este documento deja claro:

- como balancear las capas sin redisenar cada bloque por separado
- que orden de compresion deberia guiar la consolidacion final del fold

## Riesgos conceptuales

- comprimir demasiado pronto y perder lectura owner
- mantener demasiadas superficies por miedo a ocultar valor
- intentar balancear densidad sin resolver redundancia narrativa
- tratar desktop y mobile con la misma tolerancia de densidad
- convertir compresion en una solucion cosmetica sin cambiar jerarquia real
- esconder señales utiles dentro de grupos demasiado compactos

## Decisiones NO tomadas todavia

OX.2.6 no decide:

- layout final
- CSS final
- compactacion real implementada
- colapso real implementado
- sticky real
- reorder real
- breakpoints finales
- lanes
- dynamic priority real
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

- densidad balanceada no significa dashboard vacio; significa dashboard jerarquizado
- la operacion critica merece densidad fuerte si esa densidad ayuda a decidir
- el contexto secundario debe seguir existiendo, pero con menos friccion visual y cognitiva
- mobile no necesita una copia pequena de desktop; necesita una politica de densidad distinta
