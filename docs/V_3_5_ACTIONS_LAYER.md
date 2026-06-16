# V.3.5 -- Actions Layer

## Objetivo

Reducir ruido de acciones, reforzar la accion primaria y bajar la altura efectiva de las order cards sin tocar logica, estados ni workflows.

## Relacion con V.3.1 -> V.3.4

- `V.3.1` bajo altura general de card
- `V.3.2` elimino duplicacion de presencia
- `V.3.3` simplifico jerarquia interna
- `V.3.4` ordeno el sistema de acentos
- `V.3.5` usa esa base para hacer mas obvia la accion correcta

## Jerarquia aplicada

### Primary action

Se mantiene una sola accion dominante por card:

- `Preparar`
- `Marcar listo`
- `Completar`

Reglas:

- una sola primary visible
- primera posicion
- filled / emphasis surface
- mayor peso visual

### Secondary actions

Quedan degradadas:

- `Cancelar`
- `Completar` cuando no es la primary
- `WhatsApp`

Reglas:

- ghost / outline liviano
- menos contraste
- menos altura
- no compiten con la primary

## Grouping aplicado

La row de acciones ahora se divide en:

- grupo primario
- grupo secundario

La primary queda al inicio.
Las secondary quedan a la derecha o debajo solo cuando el ancho obliga.

## Compresion aplicada

Se redujo:

- padding vertical
- min-height
- gap entre acciones
- footprint de secondary actions
- peso visual de WhatsApp

## Mobile

En mobile:

- primary sigue visible
- secondary hacen wrap seguro
- no se agrega stack vertical pesado
- no se introduce overflow horizontal nuevo en la validacion disponible

## Que NO se toco

- logica
- handlers
- estados
- workflows
- queries
- realtime
- auth
- pipelines
- lane logic
- filtros
- navegacion
- DB

## Riesgos pendientes

- validar reach real en tablet y mobile autenticados
- confirmar que secondary actions no queden demasiado tenues en datasets vivos
- revisar si `Cancelar` necesita mas presencia en escenarios de stress operacional

## V.3.5a -- Actions Group Recovery

`V.3.5a` corrige la agrupacion visual de acciones en mobile y tablet sin romper la jerarquia de `V.3.5`.

### Que se ajusta

- primary y secondary vuelven a sentirse parte del mismo grupo
- se reduce la separacion vertical y horizontal excesiva
- secondary actions ganan un poco de discoverability
- WhatsApp recibe icono propio para reforzar el canal

### Regla mantenida

- la primary sigue mandando
- las secondary siguen siendo secundarias
- no se cambian handlers ni comportamiento

## V.3.5b -- Actions Cohesion Pass

`V.3.5b` termina de ajustar la cohesion del bloque de acciones para que primary y secondary se lean como un solo cluster operativo, sin que `WhatsApp` pese mas que `Cancelar` ni que el estado `completed` deje una accion flotando.

### Que se ajusta

- se reduce la separacion restante entre primary y secondary
- `Cancelar` recibe icono neutral y pequeno para ganar discoverability sin parecer accion critica
- `WhatsApp` conserva icono, pero con menor peso visual para no dominar la capa secundaria
- el estado `completed` usa un secondary cluster mas compacto para que `WhatsApp` no quede huerfano

### Regla mantenida

- una sola primary sigue visible por card
- las secondary siguen subordinadas
- no se cambian handlers, copy ni comportamiento

## V.3.5c -- Actions Affordance & Cohesion Fix

`V.3.5c` termina de cerrar la deuda de affordance: las secondary dejan de parecer texto/link suelto y pasan a leerse como micro-pills ghost accionables, pero subordinadas a la primary.

### Que se ajusta

- `Cancelar`, `Completar` secondary y `WhatsApp` comparten un mismo tratamiento de micro-pill
- `Completar` secondary recibe icono check neutral para equiparar discoverability con `Cancelar`
- se reduce un poco mas el gap del cluster para que primary y secondary se lean como un grupo operativo
- `completed` deja de mostrar `WhatsApp` como link suelto y pasa a usar la misma affordance secundaria compacta

### Regla mantenida

- la primary sigue siendo la unica accion dominante
- las secondary siguen subordinadas y compactas
- no se cambian handlers, logica, copy ni comportamiento

## V.3.5d -- Micro-Pill Tightening Pass

`V.3.5d` hace el ultimo ajuste fino de densidad sobre la action row: las micro-pills secundarias se compactan un poco mas, el spacing icono/texto se corrige y el cluster queda mas cerrado sin perder discoverability.

### Que se ajusta

- `Cancelar`, `Completar` secondary y `WhatsApp` reducen levemente altura y padding
- el gap entre icono y texto se acorta para evitar iconos flotando
- el cluster primary + secondary reduce aire horizontal
- el estado `completed` usa un secondary-only cluster mas corto y menos aislado

### Regla mantenida

- la primary sigue siendo la unica accion dominante
- las secondary siguen siendo micro-pills subordinadas
- no se cambian handlers, logica, copy ni comportamiento
