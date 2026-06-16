# OX.2.5 - Collapsible Context Layers

## Resumen ejecutivo

OX.2.5 define que partes del dashboard no son basura ni error, pero tampoco merecen primer plano permanente. La idea no es esconder informacion porque si. La idea es reconocer que ciertas capas aportan valor **solo cuando el estado operativo las permite**.

La conclusion central es:

- hay bloques secundarios valiosos que hoy ocupan demasiado aire cognitivo
- esos bloques no deben desaparecer por completo
- deben poder comprimirse, diferirse o colapsarse segun riesgo, congestion, viewport y rol
- la operacion critica debe quedar liberada de narrativa y contexto redundante

Este documento deja una regla simple para lo que sigue: **se colapsa contexto antes que capacidad de operar**.

## Lista de bloques secundarios candidatos a colapsar

- `INSIGHTS DEL NEGOCIO`
- narrativa pasiva
- feed contextual
- KPIs comerciales secundarios
- `HOY` extendido
- chips derivados largos
- summaries secundarios
- contexto comercial suave dentro de strips
- fallbacks de calma repetidos

## Clasificacion por categoria

### Conditional

Bloques que pueden vivir arriba solo cuando no compiten con accion:

- `HOY`
- `ACTIVIDAD RECIENTE` contextual
- `RESUMEN OPERATIVO` suave
- queue pressure cuando no hay friccion real

### Compressible

Bloques que pueden seguir visibles, pero en version mas corta:

- `INSIGHTS DEL NEGOCIO`
- KPIs comerciales secundarios
- chips derivados largos
- summaries secundarios
- `HOY` en modo compacto

### Deferred

Bloques que deberian aparecer mas tarde en el recorrido o mas abajo:

- feed contextual
- narrativa comercial
- `mas vendido`
- cliente frecuente sin accion
- ticket alto sin implicancia operacional

### Hidden-first

Bloques que en estados calientes deberian retirarse primero del primer plano:

- calma repetida
- narrativa decorativa
- mix delivery / retiro cuando no afecta flujo
- KPIs pasivos
- summaries redundantes

## Analisis por bloque

### `INSIGHTS DEL NEGOCIO`

Bloque: `INSIGHTS DEL NEGOCIO`  
Categoria: Compressible / Deferred  
Condiciones de colapso: riesgo, congestion, operator rush, mobile  
Compresion: reducir cantidad de cards o convertir a lectura unica corta  
Degradacion: bajar del fold principal y perder voz narrativa propia  
Defer: si el foco ya esta en cards y workflow  
Persistencia minima: una lectura compacta para owner / manager en calma o review  
Mobile behavior: colapsar casi siempre por defecto  
Riesgo UX: esconder demasiado negocio para owner si se degrada en todos los estados  
Recomendacion: primer gran candidato a capa colapsable

### Narrativa pasiva

Bloque: narrativa pasiva  
Categoria: Hidden-first  
Condiciones de colapso: cualquier estado active, congested o risk  
Compresion: fusionar mensajes de calma en una sola senal  
Degradacion: desaparecer del primer plano  
Defer: siempre que ya exista evidencia suficiente de salud  
Persistencia minima: una sola frase de calma en estados realmente tranquilos  
Mobile behavior: casi nunca deberia vivir arriba  
Riesgo UX: si se mantiene visible, roba atencion sin ayudar  
Recomendacion: degradar primero y fusionar despues en OX.5

### Feed contextual

Bloque: feed contextual  
Categoria: Deferred / Compressible  
Condiciones de colapso: riesgo, congestion, fold cargado, mobile  
Compresion: agrupar items contextuales y dejar solo evidencia fuerte  
Degradacion: bajar en el recorrido y reducir volumen narrativo  
Defer: cuando cards y riesgo ya requieren foco  
Persistencia minima: evidencia util y no redundante  
Mobile behavior: mostrar solo items con implicancia tactica  
Riesgo UX: perder memoria util si se comprime sin criterio  
Recomendacion: tratar el feed contextual como capa tardia, no como primer impacto

### KPIs comerciales secundarios

Bloque: KPIs comerciales secundarios  
Categoria: Compressible / Hidden-first  
Condiciones de colapso: congestion, risk, mobile, operator rush  
Compresion: reducir slots o consolidar en una sola lectura  
Degradacion: bajar de peso y salir del fold principal  
Defer: cuando el pulso operacional ya explica la prioridad  
Persistencia minima: ventas resumidas o un KPI comercial ancla  
Mobile behavior: colapsar primero  
Riesgo UX: dejar owner sin referencia comercial rapida si se ocultan todos  
Recomendacion: preservar un minimo, colapsar el resto

### `HOY` extendido

Bloque: `HOY` extendido  
Categoria: Conditional / Compressible  
Condiciones de colapso: active, congested, risk, mobile  
Compresion: pasar de strip completo a contexto resumido conceptual  
Degradacion: bajar de prioridad y profundidad  
Defer: cuando la operacion necesita llegar a cards rapido  
Persistencia minima: lectura compacta del dia para owner / manager  
Mobile behavior: casi siempre comprimido o colapsado  
Riesgo UX: seguir ocupando espacio premium por costumbre  
Recomendacion: tratarlo como contexto valioso pero no fijo

### Chips derivados largos

Bloque: chips derivados largos  
Categoria: Compressible / Hidden-first  
Condiciones de colapso: mobile, query compuesta, congestion visual  
Compresion: truncar, resumir o agrupar en una sola lectura  
Degradacion: quitar protagonismo frente a foco y cards  
Defer: cuando el usuario ya entendio la query activa  
Persistencia minima: dejar clara la intencion de filtro / busqueda  
Mobile behavior: compactar primero  
Riesgo UX: generar fatiga horizontal y ruido semantico  
Recomendacion: soporte util, pero no superficie dominante

### Summaries secundarios

Bloque: summaries secundarios  
Categoria: Compressible / Deferred  
Condiciones de colapso: cuando ya existe resumen principal, riesgo visible o feed con evidencia  
Compresion: fusionar en una sola lectura tactica  
Degradacion: bajar de prioridad narrativa  
Defer: si solo repiten algo que ya dicen KPIs o cards  
Persistencia minima: una sintesis realmente reductora de scanning  
Mobile behavior: no deberian acumularse  
Riesgo UX: multiplicar voces sin aumentar claridad  
Recomendacion: permitir solo summaries que ahorren trabajo mental real

### Contexto comercial suave dentro de strips

Bloque: contexto comercial suave dentro de strips  
Categoria: Conditional / Compressible  
Condiciones de colapso: riesgo o operator rush  
Compresion: reducir detalle comercial fino  
Degradacion: moverlo a capa menos urgente conceptualmente  
Defer: cuando el recorrido ya pide cards y ownership  
Persistencia minima: una sola pista comercial resumida  
Mobile behavior: colapsar rapido  
Riesgo UX: contaminar la capa operacional con microcontexto irrelevante  
Recomendacion: conservarlo solo en calma y review

### Fallbacks de calma repetidos

Bloque: fallbacks de calma repetidos  
Categoria: Hidden-first  
Condiciones de colapso: cualquier nivel de actividad real  
Compresion: fusionar en una sola senal de salud  
Degradacion: desaparecer frente a cualquier friccion  
Defer: siempre que ya exista otra lectura de estabilidad  
Persistencia minima: una sola senal de calma, no varias  
Mobile behavior: ocultar primero  
Riesgo UX: sonar condescendiente o irrelevante en medio de operacion viva  
Recomendacion: una sola voz de calma, nunca varias

## Reglas conceptuales de colapsado

### Condiciones de activacion

Un bloque secundario es candidato a colapsarse cuando:

- no cambia una decision inmediata
- repite algo ya visible en cards, riesgo o KPIs operacionales
- agrega lectura owner, pero no lectura operator
- aumenta scroll o scanning antes de cards
- ocupa espacio premium en mobile
- contradice o compite con friccion real

### Prioridad cognitiva y secuencia de aparicion

Secuencia conceptual:

1. operacion critica
2. awareness tactica util
3. negocio resumido
4. narrativa pasiva

Regla:

- cuanto mas lejos este un bloque de accion inmediata, mas derecho tiene a colapsarse

### Comportamiento en desktop

- desktop tolera mas contexto
- los bloques secundarios pueden sobrevivir en forma compacta
- el colapso puede ser mas suave y mas condicionado al estado

### Comportamiento en mobile

- mobile exige degradacion mas agresiva
- varios bloques secundarios deberian entrar colapsados de base
- lo primero que debe llegar es foco, riesgo y cards

## Reglas mobile vs desktop

### Desktop

Debe mantener:

- negocio resumido visible en calma
- feed contextual corto si no compite
- alguna capa secundaria de lectura manager / owner

Puede colapsar:

- narrativa pasiva
- chips largos
- summaries redundantes
- contexto comercial fino

### Mobile

Debe mantener:

- cards
- riesgo
- ownership
- busqueda / foco
- `OPERACION EN VIVO` esencial

Debe colapsar primero:

- `INSIGHTS DEL NEGOCIO`
- `HOY` extendido
- feed contextual
- chips largos
- calma repetida

## Integracion conceptual con OX.2.4

OX.2.4 definio el recorrido cognitivo:

1. salud minima
2. riesgo / carga
3. foco
4. cards
5. contexto secundario

OX.2.5 toma ese recorrido y responde: **que partes del contexto secundario no deberian pedir atencion completa por defecto**.

Integracion conceptual:

- la First Attention Zone no deberia cargar capas colapsables
- lo colapsable vive despues de foco y cards
- la degradacion no elimina valor: retrasa su aparicion
- el colapso es una herramienta para proteger flujo, no para borrar negocio

## Preparacion para OX.2.6 y OX.2.7

### OX.2.6 - Density Balancing

Este documento deja claro:

- que bloques pueden perder volumen sin perder sentido
- que capas deben compactarse antes que otras
- que densidad es redundante y no estructural

### OX.2.7 - Mobile Fold Re-Architecture

Este documento deja claro:

- que contexto entra colapsado por defecto en mobile
- que nunca deberia aparecer antes de cards
- que bloques secundarios son demasiado costosos para 320px / 390px

## Riesgos conceptuales

- colapsar demasiado negocio y dejar lectura owner pobre
- comprimir tanto que el dashboard parezca mas vacio que claro
- esconder evidencia util dentro de feed contextual comprimido
- usar colapso para tapar problemas de jerarquia que en realidad piden redisenio
- generar una experiencia demasiado distinta entre desktop y mobile sin una logica comun
- confundir compresion con desaparicion
- mantener demasiados bloques "colapsables" visibles igual, anulando el beneficio

## Decisiones NO tomadas todavia

OX.2.5 no decide:

- layout final
- CSS final
- implementacion real de collapse
- animaciones o motion
- sticky real
- reorder real
- thresholds exactos
- comportamiento definitivo por rol
- lanes
- dynamic priority real
- cambios en busqueda / parser
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

- no todo lo secundario debe desaparecer; mucho de eso debe esperar su momento
- colapsar contexto es una decision de jerarquia, no de censura
- el objetivo es liberar espacio mental para operar sin perder lectura comercial
- el dashboard futuro deberia sentirse mas claro no porque cuente menos, sino porque **cuenta en el momento correcto**
