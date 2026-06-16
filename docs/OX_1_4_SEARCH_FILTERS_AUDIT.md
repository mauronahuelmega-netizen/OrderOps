# OX.1.4 - Search & Filters Audit

## Alcance

OX.1.4 es una auditoria documental del sistema de navegacion del dashboard. No cambia el parser V.5, no cambia filtros, no mueve secciones y no toca realtime. El objetivo es decidir como encuentra foco el operador sin depender de scanning manual infinito.

## Inventario de navegacion actual

### Filtros persistentes visibles hoy

- Todos
- Pendientes
- Preparando
- Listos
- Delivery
- Retiro

### Filtros que no estan hoy como tab persistente, pero existen como intencion de navegacion

- Completados
- Cancelados
- Riesgo / demorados
- Sin responsable
- Mios / a mi cargo
- Nuevos

### Busqueda operacional V.5

Queries soportadas hoy:

- `delivery pendientes`
- `retiro listos`
- `pedidos de Mauro`
- `sin responsable`
- `mios`
- `a mi cargo`
- `ticket alto`
- `demorados`
- `con riesgo`
- `estancados`
- `delivery`
- `retiro`
- `pendientes`
- `preparando`
- `listos`
- `completados`
- `cancelados`

### Chips derivados de busqueda

- estado
- metodo
- riesgo
- cliente
- assignment
- valor
- tiempo / recientes

### Scanning manual que hoy complementa la navegacion

- grouping por estado
- badges de estado en cards
- labels de assignment
- chip de riesgo V.2
- highlight de nuevo pedido
- feed `ACTIVIDAD RECIENTE`

## Clasificacion de navegacion operacional

### PRIMARY NAVIGATION

Navegacion que un operador o manager puede necesitar de forma constante:

- Pendientes
- Preparando
- Listos
- Demorados / con riesgo / estancados
- Sin responsable
- Mios / a mi cargo
- Delivery pendientes
- Retiro listos

### SECONDARY NAVIGATION

Valiosa, pero no de primer plano permanente:

- Delivery
- Retiro
- Completados
- Cancelados

### CONTEXTUAL NAVIGATION

Navegacion por intencion puntual:

- Pedidos de Mauro
- Cliente especifico
- Ticket alto
- Pedido caro

### PASSIVE / LOW VALUE NAVIGATION

No merece persistencia fija:

- microestados raros
- variaciones poco accionables del historial
- navegacion de baja frecuencia que puede vivir solo en busqueda

## Analisis por elemento

### Todos

Nombre: Todos  
Tipo: filtro  
Clasificacion sugerida: primary navigation  
Usuario principal: operator / manager / owner  
Frecuencia esperada: alta  
Accionabilidad: alta  
Valor operacional: alto  
Redundancias: ninguna real; es la vista madre  
Conflictos: puede producir scanning pesado cuando la carga crece  
Mobile impact: alto valor, pero aumenta scroll si se usa como unico modo de trabajo  
Futuro probable: persistente  
Recomendacion: debe seguir existiendo, pero no deberia ser la unica respuesta cuando la operacion se carga

### Pendientes

Nombre: Pendientes  
Tipo: filtro  
Clasificacion sugerida: primary navigation  
Usuario principal: operator / manager  
Frecuencia esperada: alta  
Accionabilidad: alta  
Valor operacional: alto  
Redundancias: puede solaparse con busqueda `pendientes`  
Conflictos: bajo  
Mobile impact: alto valor  
Futuro probable: persistente o lane  
Recomendacion: merece seguir como acceso directo y tambien alimentar lanes futuras

### Preparando

Nombre: Preparando  
Tipo: filtro  
Clasificacion sugerida: primary navigation  
Usuario principal: operator / manager  
Frecuencia esperada: alta  
Accionabilidad: alta  
Valor operacional: alto  
Redundancias: busqueda `preparando`  
Conflictos: bajo  
Mobile impact: alto valor  
Futuro probable: persistente o lane  
Recomendacion: es navegacion troncal del workflow

### Listos

Nombre: Listos  
Tipo: filtro  
Clasificacion sugerida: primary navigation  
Usuario principal: operator / manager  
Frecuencia esperada: alta  
Accionabilidad: alta  
Valor operacional: alto  
Redundancias: busqueda `listos`  
Conflictos: bajo  
Mobile impact: alto valor  
Futuro probable: persistente o lane  
Recomendacion: acceso directo justificado por frecuencia y rapidez de retiro / despacho

### Delivery

Nombre: Delivery  
Tipo: filtro  
Clasificacion sugerida: secondary navigation  
Usuario principal: manager / owner / operator  
Frecuencia esperada: media  
Accionabilidad: media  
Valor operacional: medio  
Redundancias: busqueda `delivery`, KPI mix, insights de negocio  
Conflictos: puede chocar con busqueda `retiro` y producir vacio inesperado  
Mobile impact: medio  
Futuro probable: lane o filtro contextual  
Recomendacion: hoy es util, pero probablemente no merece el mismo peso fijo que estados de workflow

### Retiro

Nombre: Retiro  
Tipo: filtro  
Clasificacion sugerida: secondary navigation  
Usuario principal: manager / owner / operator  
Frecuencia esperada: media  
Accionabilidad: media  
Valor operacional: medio  
Redundancias: busqueda `retiro`, KPI mix, insights de negocio  
Conflictos: puede chocar con busqueda `delivery`  
Mobile impact: medio  
Futuro probable: lane o filtro contextual  
Recomendacion: similar a Delivery; valioso, pero no necesariamente troncal

### Completados

Nombre: Completados  
Tipo: busqueda / futuro filtro posible  
Clasificacion sugerida: secondary navigation  
Usuario principal: owner / manager  
Frecuencia esperada: media-baja  
Accionabilidad: baja  
Valor operacional: medio-bajo  
Redundancias: KPI `Completados`, feed de completados, movimiento comercial  
Conflictos: puede confundir si el operador espera verlo como filtro fijo y hoy no existe como tab  
Mobile impact: bajo  
Futuro probable: search-only o colapsable  
Recomendacion: no necesita prioridad fija por ahora

### Cancelados

Nombre: Cancelados  
Tipo: busqueda / futuro filtro posible  
Clasificacion sugerida: secondary navigation  
Usuario principal: owner / manager  
Frecuencia esperada: baja-media  
Accionabilidad: media  
Valor operacional: medio  
Redundancias: KPI `Cancelados`, summaries por cancelacion relevante  
Conflictos: igual que `Completados`, existe como intencion pero no como tab fijo  
Mobile impact: bajo  
Futuro probable: search-only o dinamico  
Recomendacion: util como acceso puntual, no necesariamente como navegacion persistente

### Sin responsable

Nombre: Sin responsable  
Tipo: busqueda / futuro filtro dinamico  
Clasificacion sugerida: primary navigation  
Usuario principal: operator / manager  
Frecuencia esperada: alta en multioperador  
Accionabilidad: alta  
Valor operacional: alto  
Redundancias: hoy depende de assignment visible en cards  
Conflictos: podria competir con lanes futuras de ownership  
Mobile impact: muy alto valor porque reduce scanning  
Futuro probable: dinamico o lane secundaria  
Recomendacion: una de las mejores queries de V.5; buena candidata a acceso rapido futuro

### Mios / a mi cargo

Nombre: Mios / a mi cargo  
Tipo: busqueda / futuro filtro dinamico  
Clasificacion sugerida: primary navigation  
Usuario principal: operator / manager  
Frecuencia esperada: alta  
Accionabilidad: alta  
Valor operacional: alto  
Redundancias: el assignment visible ya permite scanning manual, pero mas lento  
Conflictos: puede competir con estado si no se entiende bien la combinacion actual  
Mobile impact: muy alto valor  
Futuro probable: dinamico o lane de ownership  
Recomendacion: navegacion real, no simple rescate

### Demorados / con riesgo / estancados

Nombre: Demorados / con riesgo / estancados  
Tipo: busqueda / futuro filtro dinamico  
Clasificacion sugerida: primary navigation  
Usuario principal: operator / manager  
Frecuencia esperada: alta bajo presion  
Accionabilidad: muy alta  
Valor operacional: muy alto  
Redundancias: V.2 ya los marca visualmente; summaries e insights tambien los nombran  
Conflictos: depende de que el operador descubra que la query existe  
Mobile impact: altisimo valor  
Futuro probable: dinamico o lane de prioridad  
Recomendacion: hoy funciona como search-as-navigation muy fuerte

### Delivery pendientes / retiro listos

Nombre: Delivery pendientes / retiro listos  
Tipo: busqueda compuesta  
Clasificacion sugerida: primary navigation  
Usuario principal: operator / manager  
Frecuencia esperada: media-alta  
Accionabilidad: alta  
Valor operacional: alto  
Redundancias: combinan filtro persistente + estado ya visible  
Conflictos: pueden producir empty states sorprendentes si el filtro previo contradice la query  
Mobile impact: alto, porque evita varios pasos mentales  
Futuro probable: lane o navegacion dinamica  
Recomendacion: muy buena prueba de que la busqueda ya es navegacion real

### Pedidos de Mauro / cliente puntual

Nombre: Pedidos de Mauro  
Tipo: busqueda  
Clasificacion sugerida: contextual navigation  
Usuario principal: owner / manager / operator  
Frecuencia esperada: media-baja  
Accionabilidad: media  
Valor operacional: medio  
Redundancias: ninguna fuerte; resuelve recuperacion puntual  
Conflictos: puede no ser obvio que cualquier texto libre busca cliente  
Mobile impact: medio  
Futuro probable: search-only  
Recomendacion: caso tipico de search-as-rescue

### Ticket alto / caros

Nombre: Ticket alto / caros  
Tipo: busqueda  
Clasificacion sugerida: contextual navigation  
Usuario principal: owner / manager  
Frecuencia esperada: baja-media  
Accionabilidad: media  
Valor operacional: medio-bajo  
Redundancias: V.4 `Pedido de ticket alto` ya lo trae como insight  
Conflictos: puede sentirse menos discoverable que un insight clickkeable  
Mobile impact: bajo-medio  
Futuro probable: search-only  
Recomendacion: rescate puntual, no navegacion troncal

## Respuestas explicitas

1. Que busca primero un operador bajo presion  
   `demorados`, `con riesgo`, `sin responsable`, `mios`, `preparando`.

2. Que busca primero un dueno  
   `delivery`, `retiro`, `completados`, `ticket alto`, cliente puntual.

3. Que filtros merecen persistencia fija  
   `Todos`, `Pendientes`, `Preparando`, `Listos`. Son workflow puro.

4. Que filtros deberian vivir solo en busqueda  
   `completados`, `cancelados`, `sin responsable`, `mios`, `ticket alto`, cliente puntual.

5. Que filtros son redundantes con busqueda V.5  
   Los tabs de `Pendientes`, `Preparando`, `Listos`, `Delivery` y `Retiro` ya pueden escribirse como query, pero siguen siendo utiles por frecuencia.

6. Que busquedas son navegacion real  
   `demorados`, `con riesgo`, `estancados`, `sin responsable`, `mios`, `delivery pendientes`, `retiro listos`.

7. Que busquedas son rescue / puntual  
   `Mauro`, `pedidos de Mauro`, `ticket alto`, `caros`.

8. Que navegacion deberia convertirse en lane futura  
   estado, riesgo, ownership y posiblemente delivery/retiro.

9. Que navegacion deberia ser dinamica  
   riesgo, demorados, sin responsable, nuevos, ownership conflictivo.

10. Que navegacion deberia colapsarse  
    navegacion secundaria de baja frecuencia y chips excesivos en mobile.

11. Que navegacion genera fatiga  
    demasiados chips derivados, scroll horizontal de filtros, dependencia de scanning manual para ownership y riesgo.

12. Que navegacion depende demasiado de scanning manual  
    `sin responsable`, `mios`, `con riesgo`, `nuevos`, y parte de delivery/retiro cuando hay mucha carga.

13. Que deberia sobrevivir en mobile  
    busqueda, `Todos`, `Pendientes`, `Preparando`, `Listos`, y acceso rapido a riesgo / ownership.

14. Que deberia desaparecer primero en mobile  
    navegacion secundaria persistente de menor frecuencia, sobre todo delivery/retiro si compiten con estados del workflow.

15. La busqueda debe dominar sobre filtros o convivir con ellos  
    Debe convivir con ellos. Los filtros resuelven workflow recurrente; la busqueda resuelve navegacion inteligente y rescate.

## Search vs filters

### Combinacion actual

Hoy el modelo es:

1. primero filtro visible
2. despues busqueda V.5

Diagnostico:

- el modelo es potente, pero no totalmente obvio
- puede producir empty states inesperados si filtro y query se contradicen
- la combinacion es buena para power users, menos discoverable para uso casual

### Conflictos posibles

- filtro `Delivery` + busqueda `retiro`
- filtro `Pendientes` + busqueda `completados`
- filtro `Todos` + busqueda `sin responsable`
- filtro `Pendientes` + busqueda `mios`

Lectura:

- no son errores del sistema; son choques de intencion
- mas adelante convendra explicitar mejor que la busqueda refina el filtro actual

## Search as navigation vs search as rescue

### Search as navigation

Queries que ya funcionan como flujo real:

- `demorados`
- `con riesgo`
- `sin responsable`
- `mios`
- `delivery pendientes`
- `retiro listos`

### Search as rescue

Queries usadas para recuperar algo puntual:

- `Mauro`
- cliente especifico
- `ticket alto`
- `caros`

### Modelo recomendado

En OrderOps deberia dominar este equilibrio:

- filtros persistentes para workflow basico
- search-as-navigation para riesgo, ownership y combinaciones
- search-as-rescue para cliente y valor

## Fatiga cognitiva detectada

- chips derivados pueden crecer demasiado en queries compuestas
- filtros persistentes + busqueda + scanning visual compiten por la misma atencion
- algunos filtros futuros ya estan insinuados por V.5, lo que puede generar presion por sumar tabs
- empty states pueden sorprender si el operador no entiende que busqueda refina el filtro actual
- en mobile, el scroll horizontal de filtros sumado a chips puede cansar rapido
- la busqueda hoy es poderosa, pero no siempre obvia como navegacion diaria

## Mobile audit

- la busqueda deberia seguir antes de filtros; reduce scanning y scroll
- en 320px / 390px deberian sobrevivir:
  - input de busqueda
  - tabs de workflow
  - acceso rapido a riesgo y ownership, aunque hoy viva como query
- los chips derivados deberian poder comprimirse primero
- delivery/retiro son mas sacrificables en mobile que `Pendientes`, `Preparando` y `Listos`
- lo que mas reduce scroll es poder saltar por riesgo, ownership o combinacion de estado + metodo sin inspeccion visual card por card

## Recomendaciones para OX.2 / OX.3 / OX.4 / OX.5 / OX.6

### OX.2 - Fold Re-Architecture

- evaluar cuanto aire consume el bloque de busqueda + chips + filtros antes de llegar a pedidos
- proteger el acceso rapido al workflow sin convertir el fold en pared de controles

### OX.3 - Operational Lanes

- varios filtros actuales son candidatos naturales a lanes:
  - estado
  - riesgo
  - ownership
  - delivery/retiro
- si hay lanes, parte de la navegacion hoy resuelta con filtros podria salir del strip actual

### OX.4 - Dynamic Operational Priority

- riesgo, demorados, sin responsable y nuevos deberian tener navegacion dinamica
- delivery/retiro no necesita el mismo peso cuando la operacion esta caliente

### OX.5 - Smart Compression

- comprimir chips derivados
- reducir filtros persistentes de bajo uso
- evitar que filtros secundarios ocupen el mismo peso visual que workflow y riesgo

### OX.6 - Visual Polish System

- diferenciar visualmente:
  - busqueda activa
  - filtro activo
  - chip derivado
  - empty state por conflicto de navegacion
- el lenguaje visual deberia ayudar a entender que la busqueda refina, no reemplaza, el filtro actual

## Definicion final

### Search as navigation

Debe existir para:

- riesgo
- ownership
- combinaciones tacticas

### Search as rescue

Debe existir para:

- cliente puntual
- ticket alto
- recuperacion rapida de casos especificos

### Filtros persistentes

Deben representar el workflow base:

- Todos
- Pendientes
- Preparando
- Listos

### Filtros dinamicos

Deberian surgir mas adelante para:

- riesgo
- sin responsable
- mios
- nuevos

## Conclusiones

- V.5 ya demostro que la busqueda puede ser navegacion real, no solo caja de texto
- el problema no es falta de filtros; es decidir que merece persistencia y que puede seguir viviendo como query
- la navegacion futura de OrderOps deberia reducir scanning manual, no multiplicar controles
