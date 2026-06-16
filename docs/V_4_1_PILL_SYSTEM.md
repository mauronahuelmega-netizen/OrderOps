# V.4.1 -- Pill System

## Objetivo

Ordenar visualmente el sistema de pills del dashboard para que filtros, shortcuts de scanning y counters se lean como navegacion operativa compacta, no como botones grandes ni mini-cards.

## Relacion con V.3.5

- `V.3.5` compacta y jerarquiza acciones dentro de cada card
- `V.4.1` toma esa misma disciplina de densidad y la lleva al nivel de filtros y shortcuts
- la prioridad sigue siendo llegar antes a ejecucion sin tocar logica ni comportamiento

## Sistema trabajado

### Filter pills

Se trabajan:

- `Todos`
- `Pendientes`
- `Preparando`
- `Listos`
- `Delivery`
- `Retiro`

Objetivo:

- selector operativo compacto
- active state claro
- baseline mejor alineada
- menos altura previa a pedidos

### Scanning shortcuts

Se trabajan:

- `Preparando`
- `Pendientes`
- `Listos`
- `Completados`
- `Cancelados`

Objetivo:

- menos sensacion de mini-card
- mas sensacion de shortcut navegable
- foco sugerido visible pero contenido
- counters claros sin crecer de mas

### Counters

Se alinean visualmente:

- counter de lane shortcut
- counter de seccion
- badge pequeno contextual

Objetivo:

- misma familia visual
- menos competencia con titulos
- mejor lectura periferica

## Jerarquia visual de pills

### Selected pill

- fondo mas firme
- contraste mas alto
- borde definido

### Default pill

- fondo liviano
- borde suave
- menos peso

### Count pill

- compacta
- centrada
- alineada con titulos y shortcuts

### Suggested / focus pill

- visible
- secundaria
- no dominante

## Ajustes aplicados

- menor altura de filter pills
- menor padding horizontal
- menos gap entre siblings
- lane shortcuts con menos padding y menos borde dominante
- counters compactados y unificados
- mobile con wrap mas limpio y menos altura previa a pedidos

## Alcance

Se toco:

- `components/admin/orders-admin.css`
- documentacion de continuidad

No se toco:

- logica de filtros
- handlers
- scroll behavior
- busqueda
- lanes logic
- metricas
- estados
- DB
- auth
- realtime
- queries
- pipelines

## Riesgos pendientes

- validar que el active state siga siendo suficientemente claro en tablet y mobile
- confirmar con datos vivos que los lane shortcuts no queden demasiado apagados
- revisar si el counter de lanes necesita un ultimo ajuste fino cuando aparezcan conteos altos

## Preparacion para V.4.2

`V.4.1` deja lista la base visual para seguir con jerarquia de filtros y navegacion sin reabrir el problema de pills sobredimensionadas.

## V.4.1a -- Pill Weight Rebalance Pass

`V.4.1a` cierra la deuda visual de peso y jerarquia dentro del mismo sistema de pills. El objetivo no es agregar nada nuevo, sino hacer que active pill, lane shortcuts, counters y `Foco sugerido` se lean mas claramente como navegacion compacta.

### Que se ajusta

- la pill activa baja de peso para dejar de parecer CTA primaria
- los lane shortcuts reducen padding, radio y aire interno para dejar de sentirse mini-surfaces
- los counters se acercan mas a una misma familia visual
- `Foco sugerido` baja de protagonismo y se integra mejor al shortcut
- mobile reduce un poco mas la altura antes de la primera card

### Regla mantenida

- active state sigue siendo claro
- shortcuts siguen siendo navegables
- counters siguen legibles
- no se cambia logica, copy, handlers ni comportamiento

## V.4.1b -- Shortcut Compression & Focus Integration Pass

`V.4.1b` cierra la deuda visual de altura y cohesion de los scanning shortcuts. El objetivo es que `Foco sugerido` deje de sentirse badge flotante, que el selected shortcut pierda peso de mini-card y que mobile llegue antes a la primera card.

### Que se ajusta

- `Foco sugerido` se integra mejor al subtitulo y baja de protagonismo
- los shortcuts reducen padding, gap interno y radio
- el selected shortcut suaviza borde y sombra
- search, filters y scanning recortan un poco mas el fold previo a pedidos en mobile

### Regla mantenida

- `Foco sugerido` sigue visible
- selected state sigue siendo claro
- counters siguen legibles
- no se cambia logica, copy, handlers ni comportamiento

## V.4.1c -- Fold Reduction & Shortcut Normalization Pass

`V.4.1c` cierra las ultimas deudas de altura y cohesion del bloque superior de execution. El objetivo es que `Foco sugerido` deje de sentirse separado, que los shortcuts queden mas parejos entre si y que mobile llegue antes a la primera card.

### Que se ajusta

- `Foco sugerido` se acerca al subtitulo con lectura casi inline
- los shortcuts reducen un poco mas su altura interna y se normalizan entre si
- las filter pills consumen menos fold en mobile
- search, filters y scanning recortan un poco mas el aire previo a cards

### Regla mantenida

- `Foco sugerido` sigue visible
- selected shortcut sigue siendo claro
- counters siguen legibles
- no se cambia logica, copy, handlers ni comportamiento
