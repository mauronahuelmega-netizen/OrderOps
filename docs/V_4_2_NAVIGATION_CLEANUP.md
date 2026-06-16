# V.4.2 -- Navigation Cleanup

## Objetivo

Limpiar la navegacion visual del bloque de ejecucion para que search, filters, scanning shortcuts, lane headers y counters se lean como un flujo continuo, no como capas separadas.

## Relacion con V.4.1

- `V.4.1` compacta pills y shortcuts
- `V.4.1a`, `V.4.1b` y `V.4.1c` reducen peso, altura y fold
- `V.4.2` ordena la continuidad entre esos elementos sin cambiar logica ni comportamiento

## Objetivo visual

Pasar de:

- Overview
- Search
- Filters
- Scanning
- Shortcuts
- Lane
- Cards

a:

- Overview
- Execution controls
- Navigation shortcuts
- Work lanes
- Cards

## Ajustes aplicados

### Search + filters consolidation

- menor separacion vertical
- mejor alineacion entre search y pills
- menos sensacion de cajas apiladas
- search sigue dominante como entrada principal

### Controls module cleanup

- ritmo vertical mas continuo entre search, filters y shortcuts
- menos micro-gaps arbitrarios
- surface de execution se siente mas como un flujo unico

### Scanning header cleanup

- subtitulo mas discreto
- heading/subheading mas juntos
- header mas cerca de shortcuts

### Shortcut to lane transition cleanup

- menos gap entre shortcuts y primer lane
- menos corte visual antes de cards
- lane header sigue legible

### Counter cleanup

- ajustes finos de alineacion
- misma familia visual entre counts de shortcuts y de lanes
- sin rehacer el sistema desde cero

## V.4.2a -- Mobile Navigation Tightening

### Search + pills tightening

- menor gap debajo de search en mobile
- controls module mas compacto en `320px` y `390px`
- pills con menos padding vertical y menos aire entre filas
- search mantiene predominio visual como entrada principal

### Filters weight control

- pills default mas livianas en mobile
- active pill clara pero menos pesada
- filters mas secundarios frente al search

### Shortcut height review at 390px

- shortcuts con menos padding vertical
- counters mas compactos para no empujar altura
- `Foco sugerido` sigue visible sin crear una fila extra

### Mobile flow continuity

- menos interrupciones entre search, filters, scanning y primer lane
- lane header un poco mas cerca de shortcuts
- lanes y cards caen antes dentro del fold

### Tablet safety

- search conserva presencia suficiente en `768px` y `1024px`
- filters siguen compactos sin perder lectura
- shortcuts sostienen lectura horizontal sin overflow nuevo

## V.4.2b -- Search & Filter Bar Consolidation

### Search + filter trigger

- search y filtros se consolidan en una barra mas compacta
- search sigue siendo el elemento dominante
- filtros pasan a un trigger secundario
- en desktop/tablet quedan inline
- en mobile estrecho cae a fallback vertical, pero mas corto que el sistema anterior

### Filter dropdown / panel

- los filtros actuales viven dentro de un panel compacto
- se mantiene el mismo orden: `Todos`, `Pendientes`, `Preparando`, `Listos`, `Delivery`, `Retiro`
- no cambia la logica, los nombres ni los handlers
- el panel se cierra al seleccionar y tambien al click afuera / `Escape`

### Active state

- el trigger usa `Filtros` cuando el filtro activo es `Todos`
- usa `Filtros · <estado>` cuando hay un filtro especifico
- dentro del panel, la pill activa conserva su estado visible

### Filter performance audit

- no se detectaron queries nuevas ni subscriptions extra al cambiar filtros
- la demora percibida venia mas del rerender y de derivaciones del lado cliente que del transporte de datos
- se aislo el estado visual del dropdown para que abrir/cerrar el panel no recalcule pedidos
- se removieron sorts redundantes en derivaciones ya preservadas por el orden de `optimisticOrders`

### Safe performance fixes

- se separo `baseFilteredOrders` de la fase de busqueda para no repetir trabajo innecesario
- `filteredOrders` deja de reordenar una lista ya estable cuando solo se aplica `filter()`
- `groupedOrders` deja de resortear subconjuntos ya preservados por el orden original
- no se tocaron resultados visibles ni el orden efectivo del tablero

## V.4.2c -- Filter Panel Positioning & Mobile Ergonomics Fix

### Filter button mobile compaction

- el trigger `Filtros` reduce su ancho minimo y padding en mobile
- en mobile deja de mostrar `Filtros · <estado>` y prioriza `Filtros`
- si hay filtro activo, conserva una senal compacta por punto de estado

### Search width recovery

- search recupera espacio util porque el trigger usa ancho contenido
- en `320px` y `390px` el trigger deja de empujar la barra por debajo de un ancho incomodo
- en `768px+` se mantiene el label completo para conservar contexto

### Filter panel anchoring

- desktop/tablet mantienen dropdown alineado al trigger
- el panel se afina en width, shadow y radio para dejar de sentirse mini-modal
- queda anclado al borde derecho del control bar con offset mas claro

### Mobile panel positioning

- en mobile y tablet chica el panel deja de flotar sobre scanning
- ahora se abre debajo de la barra y empuja el contenido hacia abajo
- eso evita tapar shortcuts y lanes de forma torpe

### Active filter indication

- desktop/tablet: `Filtros · <estado>`
- mobile: `Filtros` + indicador compacto si hay filtro activo
- dentro del panel la pill activa sigue marcando el estado real

### Performance preservation

- se conserva la separacion de `baseFilteredOrders`
- se mantienen eliminados los sorts redundantes seguros
- abrir/cerrar el panel sigue aislado del estado funcional del filtro
- no se disparan queries ni realtime al abrir/cerrar

## V.4.2d -- Single Row Filter Dropdown Fix

### Vertical dropdown correction

- el panel se corrige desde fila horizontal a columna vertical
- vuelve a sentirse como dropdown/select compacto real
- deja de parecer un strip horizontal accidental

### Positioning

- el panel queda anclado al trigger `Filtros`
- flota por encima del contenido como dropdown liviano
- mantiene ancho controlado
- no usa overlay ni bloqueo global

### Search width preservation

- search conserva mejor ancho util
- el trigger sigue compacto
- en `320px` y `390px` el panel vertical no le roba ancho extra a search

### Panel visual

- menos alto
- padding mas corto
- shadow mas sutil
- items internos verticales y compactos
- sin sensacion de mini-modal

### Active state

- mobile mantiene `Filtros` como label
- desktop/tablet conservan el contexto mas largo
- el filtro activo sigue claro dentro del panel y por indicador compacto en mobile

### Performance preservation

- no se reintroducen sorts redundantes
- abrir/cerrar panel sigue sin recalcular pedidos
- no dispara queries ni realtime

## V.4.2e -- Filter Dropdown Visual Polish & Ergonomics Pass

### Dropdown width reduction

- el panel reduce su width para sentirse mas cercano a un select
- en mobile queda en una franja compacta aproximada al rango `180px` o menos segun viewport real
- se mantiene alineado al borde derecho del trigger

### Height and padding compression

- menos padding del contenedor
- menos gap entre opciones
- menor min-height de cada item
- menor padding interno por opcion

### Option style rebalance

- las opciones dejan de parecer mini-pills apiladas
- cada item pierde radio y borde dominante
- el contenedor carga mas peso visual que las opciones individuales
- el active state sigue claro, pero mas sobrio

### Panel visual lightening

- shadow mas sutil
- border mas suave
- radius mas moderado
- fondo limpio
- panel menos invasivo y menos parecido a card flotante

### Panel overlap polish

- sigue anclado al trigger
- mantiene solapamiento compacto y controlado
- no empuja contenido
- cubre menos superficie sobre `Scanning operacional`

### Search and trigger safety

- search mantiene ancho util
- el trigger sigue compacto
- en mobile se conserva `Filtros` como label corto

### Performance preservation

- se mantienen intactos los fixes de `V.4.2b`, `V.4.2c` y `V.4.2d`
- no se reintroducen recomputaciones ni cambios de orden

## V.4.2f -- Dropdown Density & Anchoring Pass

### Dropdown height reduction

- baja la altura total del panel
- reduce padding vertical del contenedor
- reduce min-height y padding por item
- reduce el gap interno entre opciones

### Option flattening

- las opciones se aplanan aun mas hacia patron de lista/select
- menos radius por item
- menos borde individual
- active state sigue claro pero mas sobrio
- el contenedor lleva mas peso visual que cada opcion

### Anchoring optical fix

- el dropdown queda mas pegado opticamente al trigger
- el offset vertical se acorta
- se reduce la sensacion de panel “colgando”

### Overlap reduction

- el panel cubre menos superficie de `Scanning operacional`
- mantiene superposicion controlada
- no empuja contenido

### Search and trigger safety

- search conserva ancho util
- el trigger sigue compacto
- el panel mas bajo invade menos el bloque de ejecucion

### Performance preservation

- se conservan todos los fixes seguros de `V.4.2b`, `V.4.2c`, `V.4.2d` y `V.4.2e`
- no cambia orden, resultados ni recomputaciones de pedidos

## V.4.2g -- Dropdown Select Styling Pass

### Width tightening

- el panel reduce otro escalon de width
- el padding horizontal del contenedor baja un poco
- el ancho queda todavia mas cerca de un select contextual que de una card

### Item radius reduction

- las opciones reducen todavia mas su radius
- se alejan del look de capsula/pill
- el panel mantiene un radius externo moderado

### Border simplification

- el borde interno default baja fuerte de contraste
- el estado hover usa una separacion suave
- el active state conserva borde y fondo, pero mas sobrios
- el contenedor carga mas peso visual que cada item

### Row density tightening

- baja un poco mas el padding horizontal por item
- baja levemente la tipografia interna
- el dropdown entero queda mas compacto

### Active state preservation

- el item activo sigue reconocible de un vistazo
- gana apenas de peso sin volverse una pill pesada

### Performance preservation

- se mantienen intactos todos los fixes previos
- no se toca el estado funcional del filtro ni las derivaciones de pedidos

## V.4.2h -- Filter Dropdown Final Polish Pass

### Anchor offset tightening

- el panel reduce un poco mas la separacion vertical respecto al trigger
- queda mas pegado opticamente al boton `Filtros`
- se mantiene el patron flotante y la alineacion derecha

### Row border softening

- los bordes internos default bajan un poco mas de contraste
- cada opcion se siente menos boxed
- el contenedor sigue cargando mas peso visual que las rows

### Active state clarity

- el item activo gana apenas mas contraste y peso tipografico
- sigue sobrio y no vuelve a look de CTA

### Select-like feel

- el dropdown refuerza lectura de lista/select contextual
- no cambia estructura ni comportamiento

### Performance preservation

- se preservan todos los fixes seguros de `V.4.2b` a `V.4.2g`
- no se tocan orden, resultados ni recalculos de pedidos

## V.4.2i -- Dropdown Final Visual Balance Pass

### Trigger anchor tightening

- el offset vertical se reduce un poco mas
- el panel queda visualmente mas conectado al trigger
- se mantiene el patron flotante alineado a la derecha

### Border layer simplification

- el borde externo del panel baja un poco mas de contraste
- los bordes internos default de las rows se suavizan aun mas
- se reduce la sensacion de muchas cajas apiladas

### Active state micro-boost

- el item activo gana un poco mas de contraste en borde y fondo
- el font-weight sube apenas
- sigue sobrio y no vuelve a look de CTA

### Desktop scale safety

- el panel gana unos pocos pixeles de width en desktop/tablet amplia
- deja de sentirse demasiado mini respecto al canvas
- sin afectar el footprint mobile

### Performance preservation

- se preservan todos los fixes seguros de `V.4.2b` a `V.4.2h`
- no cambia estructura, orden ni resultados del filtrado

## Alcance

Se toco:

- `components/admin/orders-admin.css`
- documentacion de continuidad

No se toco:

- logica de filtros
- handlers
- scroll behavior funcional
- navegacion funcional
- busqueda behavior
- cards internas
- action rows
- lanes logic
- metricas
- estados
- DB
- auth
- realtime
- queries
- pipelines

## Riesgos pendientes

- validar que el flujo siga viendose estable con datos vivos en tablet y mobile
- confirmar que search siga teniendo suficiente predominio frente a filters
- revisar si algunos gaps necesitan un ultimo ajuste fino con datasets mas cargados
- confirmar que el punto compacto de filtro activo sea suficiente en mobile
- validar que el ancho contenido del dropdown siga siendo comodo en mobile chico
- validar que la compresion siga dejando touch target razonable en `320px`

## Preparacion para V.5

`V.4.2`, `V.4.2a` y `V.4.2b` dejan una base mas continua, compacta y mas clara en la relacion search/filtros para cualquier fase siguiente de mobile recovery, sin abrir todavia nuevos comportamientos avanzados.

La apertura formal de ese frente queda documentada en [docs/V_5_MOBILE_RECOVERY.md](C:\Users\Oasis%20Desktop\Documents\New%20project%202\docs\V_5_MOBILE_RECOVERY.md), pero `V.4.2` no implementa todavia `V.5.1`, `V.5.2` ni `V.5.3`.
