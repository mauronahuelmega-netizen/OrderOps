# OX.2.7 - Mobile Fold Re-Architecture

## Resumen ejecutivo de adaptacion mobile

OX.2.7 traduce la arquitectura conceptual del fold a un criterio especifico para mobile. No propone una UI nueva ni reordena componentes reales. Define **que debe sobrevivir arriba**, **que puede entrar comprimido** y **que deberia diferirse** para que la operacion viva siga siendo legible en 320px, 390px y tablet.

La conclusion central es:

- mobile no puede ser una version angosta de desktop
- mobile necesita menos capas concurrentes y una secuencia mas dura
- cards, riesgo, ownership y foco deben llegar antes
- negocio y narrativa solo sobreviven si entran sin bloquear accion
- tablet puede tolerar mas contexto que phone, pero no deberia heredar la densidad de desktop sin filtro

## Mapa conceptual del fold por viewport

### 320px

Fold ideal:

1. salud minima
2. riesgo / carga
3. foco de navegacion
4. cards
5. awareness tactica minima
6. contexto secundario colapsado

Que no deberia vivir arriba:

- `INSIGHTS DEL NEGOCIO`
- `HOY` extendido
- feed contextual largo
- chips derivados largos
- narrativa de calma repetida

### 390px

Fold ideal:

1. salud minima
2. riesgo / carga
3. ownership / foco
4. cards
5. resumen tactico corto
6. contexto comercial resumido y diferido

Que puede sobrevivir si no compite:

- una sola sintesis tactica
- una lectura comercial minima

### Tablet

Fold ideal:

1. salud minima
2. riesgo / carga / ownership
3. foco de navegacion
4. cards
5. awareness tactica compacta
6. negocio resumido

Tablet puede sostener:

- algo mas de negocio visible
- algo mas de feed util

Pero no deberia sostener:

- la misma cantidad de bandas narrativas de desktop
- la misma longitud de chips o strips si empujan cards

## Priorizacion de bloques

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

- `INSIGHTS` si reducen scanning
- `RESUMEN OPERATIVO` si sintetiza bien
- `ACTIVIDAD RECIENTE` solo cuando trae evidencia
- health minima
- presence discreta

### Business Context

- `HOY` resumido
- `INSIGHTS DEL NEGOCIO`
- ventas
- ticket promedio
- mix delivery / retiro
- mas vendido

### Passive Narrative

- calma repetida
- feed contextual debil
- summaries redundantes
- narrativa comercial suave
- chips explicativos largos

## Bloques colapsables / comprimibles / deferred para mobile

### `INSIGHTS DEL NEGOCIO`

Bloque: `INSIGHTS DEL NEGOCIO`  
Categoria: Business Context  
Prioridad cognitiva: baja en mobile operativo  
Compresion minima: una sola lectura o cero en 320px  
Degradacion bajo congestion: total del primer plano  
Defer / collapse: casi siempre  
Sticky candidate: no  
Mobile behavior: colapsado por defecto salvo calma o owner review  
Riesgo UX: dejar owner sin una lectura minima del dia si se elimina siempre  
Recomendacion: conservar solo una expresion minima y tardia

### Narrativa pasiva

Bloque: Narrativa pasiva  
Categoria: Passive Narrative  
Prioridad cognitiva: muy baja  
Compresion minima: una sola senal si la calma es realmente util  
Degradacion bajo congestion: total  
Defer / collapse: inmediato  
Sticky candidate: no  
Mobile behavior: hidden-first  
Riesgo UX: ocupar el poco aire disponible sin mejorar accion  
Recomendacion: sacarla primero del fold mobile

### Feed contextual

Bloque: Feed contextual  
Categoria: Tactical Awareness / Passive Narrative segun contenido  
Prioridad cognitiva: media si es evidencia, baja si es contexto  
Compresion minima: solo items con implicancia tactica  
Degradacion bajo congestion: alta  
Defer / collapse: si riesgo y cards ya dominan  
Sticky candidate: no  
Mobile behavior: recorte fuerte, con preferencia por evidencia  
Riesgo UX: perder memoria reciente util si se comprime sin criterio  
Recomendacion: en mobile, feed corto o diferido

### KPIs secundarios

Bloque: KPIs secundarios  
Categoria: Business Context  
Prioridad cognitiva: baja-media  
Compresion minima: un unico ancla comercial  
Degradacion bajo congestion: alta  
Defer / collapse: casi siempre en 320px, frecuente en 390px  
Sticky candidate: no  
Mobile behavior: uno visible o ninguno, segun estado  
Riesgo UX: saturar el fold con negocio antes de cards  
Recomendacion: elegir uno o resumir el grupo

### Strips de informacion complementaria

Bloque: Strips de informacion complementaria  
Categoria: Business Context / Tactical Awareness  
Prioridad cognitiva: media  
Compresion minima: menos slots, menos detalle, menos bandas  
Degradacion bajo congestion: media-alta  
Defer / collapse: cuando empujan cards o foco  
Sticky candidate: no  
Mobile behavior: fuerte compresion o diferido  
Riesgo UX: heredar estructura desktop y volverla pesada  
Recomendacion: tratar su ancho y cantidad como costo, no como neutral

### `HOY` extendido

Bloque: `HOY` extendido  
Categoria: Business Context  
Prioridad cognitiva: baja para operator, media para owner  
Compresion minima: lectura minima del dia  
Degradacion bajo congestion: alta  
Defer / collapse: por defecto en phone, parcial en tablet  
Sticky candidate: no  
Mobile behavior: compactado o colapsado  
Riesgo UX: convertirse en el gran empujador de scroll pre-card  
Recomendacion: no sostenerlo completo arriba del fold mobile

### Summaries secundarios

Bloque: Summaries secundarios  
Categoria: Tactical Awareness / Passive Narrative  
Prioridad cognitiva: media solo si ahorran trabajo real  
Compresion minima: un unico summary realmente util  
Degradacion bajo congestion: media-alta  
Defer / collapse: si repiten cards, riesgo o insights  
Sticky candidate: no  
Mobile behavior: uno solo o ninguno  
Riesgo UX: multiplicar bandas cortas que igual obligan a leer  
Recomendacion: mobile no debe acumular summaries

### Chips derivados largos

Bloque: Chips derivados largos  
Categoria: Passive Narrative / Tactical Awareness  
Prioridad cognitiva: baja-media  
Compresion minima: acortar o agrupar  
Degradacion bajo congestion: media  
Defer / collapse: si la query ya esta clara  
Sticky candidate: no  
Mobile behavior: compresion agresiva y horizontal minima  
Riesgo UX: costo horizontal enorme para explicar algo ya entendido  
Recomendacion: preservar foco, no verbosidad

## Reglas conceptuales de compactacion y degradacion por dispositivo

### 320px

- prioridad extrema a cards, riesgo, ownership y foco
- casi todo el contexto entra colapsado
- el fold no deberia pedir mas de una lectura secundaria antes de cards

### 390px

- permite una capa tactica breve adicional
- puede admitir una expresion comercial minima
- sigue siendo muy sensible a chips largos y strips extendidos

### Tablet

- puede sostener dos capas secundarias compactas
- deberia mantener cards visibles mas temprano que desktop actual
- no deberia simplemente heredar todo el contexto de laptop

## Secuencias de lectura mobile

### First Attention Zone

Debe responder:

- hay riesgo o no
- hay carga viva o no
- hay ownership gap o no
- donde enfoco la navegacion

### Tactical Awareness

Solo entra despues de que la operacion critica ya es visible. Debe ser:

- breve
- no redundante
- util para reducir scanning

### Contexto secundario

Debe vivir:

- mas abajo
- comprimido
- colapsado
- o solo visible en calma / owner review

## Atencion operativa y Attention Budget conceptual para mobile

### 320px / 390px

- Critical Operations: 70%
- Tactical Awareness: 20%
- Business Context: 10%
- Passive Narrative: 0-5%

### Tablet

- Critical Operations: 60%
- Tactical Awareness: 25%
- Business Context: 10-15%
- Passive Narrative: 5% maximo

La regla es:

- si una capa secundaria empuja cards, excedio su presupuesto
- si una narrativa obliga a leer antes de poder operar, excedio su presupuesto

## Integracion conceptual con OX.2.4 -> OX.2.6

### Con OX.2.4

OX.2.4 definio el flujo:

1. salud minima
2. riesgo / carga
3. foco
4. cards
5. contexto secundario

OX.2.7 adapta ese flujo a mobile endureciendo el filtro entre 4 y 5.

### Con OX.2.5

OX.2.5 definio que podia colapsarse.  
OX.2.7 define que en mobile deberia nacer ya comprimido o colapsado.

### Con OX.2.6

OX.2.6 definio cuanto peso merece cada capa.  
OX.2.7 lo traduce a una politica especifica por viewport.

## Preparacion para OX.2.8 - Fold Consolidation Blueprint

Este documento deja listo para OX.2.8:

- que sobrevive siempre en mobile
- que se colapsa primero
- que solo merece expresion minima
- que no deberia volver a aparecer arriba del fold por inercia

Tambien deja una regla consolidable:

- mobile no se resuelve con reflow, se resuelve con jerarquia y recorte de voces

## Riesgos conceptuales de mobile fold

- convertir mobile en una version demasiado pobre
- esconder demasiado negocio para owner / manager
- comprimir tanto que se pierda memoria operativa util
- dejar demasiadas capas vivas por miedo a ocultar valor
- empujar cards demasiado abajo por respetar estructuras heredadas
- tratar tablet como phone grande o como desktop pequeno sin criterio propio

## Decisiones NO tomadas todavia

OX.2.7 no decide:

- layout final mobile
- CSS final
- comportamiento real de collapse
- sticky real
- reorder real de componentes
- breakpoints definitivos
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

- mobile necesita una arquitectura de fold propia
- el fold mobile debe llegar mas rapido a cards que cualquier otro viewport
- negocio y narrativa no desaparecen, pero pierden derecho a competir por el primer scroll
- tablet requiere su propio criterio intermedio, no una copia de phone ni de desktop
