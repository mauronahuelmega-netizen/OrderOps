# V.3.1 -- Card Compression

## Objetivo

Reducir altura, ruido visual y densidad innecesaria de las order cards para que entren mas pedidos visibles por viewport y el scanning operacional sea mas rapido.

Esta fase no cambia logica ni comportamiento funcional. Trabaja sobre compresion visual, presentacion de metadata y ritmo interno de card.

## Relacion con V.2

- `V.2` recupero estructura global
- `V.2.3` dejo overview / execution / context en una jerarquia estable
- la deuda principal paso a estar dentro de las order cards

`V.3.1` no reabre overview ni lanes. Baja al nivel de card.

## Que se comprimio

### Card shell

Se redujo:

- padding vertical
- gap interno entre bloques
- peso de borde y sombra percibida
- altura general de cards activas y resueltas

Objetivo:

- mas cards visibles por viewport
- menos sensacion administrativa

### Header y top row

Se compacto:

- kicker
- separacion entre titulo y badge
- tamano del titulo
- aire entre top row y resto de la card

### Supporting metadata

Se reagruparon visualmente como banda compacta:

- contexto de cliente
- assignment
- chip de riesgo
- ultima actividad

Objetivo:

- evitar cuatro filas chicas apiladas
- mantener lectura rapida

### Meta y total

Se redujo:

- gap entre copy y total
- tamano de copy secundaria
- altura del bloque de total
- hint de apertura

### Timeline y quick actions

Se compacto:

- tamano de pasos del timeline
- separacion entre pasos
- altura de quick actions
- gap entre botones

Objetivo:

- mantener acciones accesibles
- bajar altura de cierre de card

## Metadata que perdio peso

Se degrado visualmente:

- contexto de cliente
- assignment
- ultima actividad
- notes preview
- hint "Abrir pedido"
- labels secundarios y captions

Se mantuvo clara:

- producto / pedido
- estado
- total
- accion principal

## Impacto por viewport

### 320px / 390px

- menos stacking vertical
- metadata secundaria mas compacta
- CTA sigue accesible
- total sigue visible

### 768px

- cards menos altas
- mejor uso horizontal
- menos aire muerto entre bloques

### 1024px+

- mas cards visibles por viewport
- top row y meta mas alineados
- total / acciones mas compactos

### 1440px+

- desktop mas eficiente sin agrandar de nuevo la card

## Que NO se toco

- logica operacional
- DB
- auth
- queries
- realtime
- pipelines
- search behavior
- filtros funcionales
- estados
- acciones reales
- mutations
- metricas calculadas
- lanes logic
- nuevas features

## Riesgos pendientes

- la jerarquia interna de acentos y estados todavia puede afinarse mas en `V.3.2`
- la validacion visual autenticada del dashboard real sigue pendiente
- puede seguir habiendo deuda puntual en cards resueltas con contenido largo

## Preparacion para V.3.2

`V.3.1` deja listo:

- cards mas bajas
- metadata menos pesada
- mejor scanning base
- mejor piso para una futura pasada de jerarquia interna y actions layer sin seguir peleando contra altura excesiva

## V.3.1a -- Production Lane Compression Fix

`V.3.1a` cierra la deuda pendiente de scroll en lanes activas o de produccion.

### Lanes comprimidas

Se comprimio:

- padding de priority lanes
- padding de workflow lanes
- gap entre header, metrics y cards
- separacion entre cards
- gap de grupos de produccion

Objetivo:

- mas pedidos visibles por pantalla
- menos scroll repetitivo dentro de produccion

### Lane header compression

Se redujo:

- tamano de eyebrow
- tamano de dominance label
- subtitulo
- alertas y overflow copy

Objetivo:

- header util
- no mini dashboard

### Lane metrics compression

Cuando la lane entra en compact mode:

- menor altura
- menor padding
- menor gap
- cards de metricas mas chicas
- supporting text mas discreto

### Active card compact mode

Las cards activas (`pending`, `preparing`, `ready`) ahora usan una compresion adicional:

- menos padding
- menos gap interno
- supporting metadata mas apretada
- total un poco mas corto
- timeline mas discreto
- acciones mas compactas

### Estado real

Estado actual:

- `V.3.1` implementada
- `V.3.1a` aplicada como fix pass
- `V.3.1` no debe considerarse aprobada hasta QA visual final autenticado

## V.3.1b -- Lane Structure Compression

`V.3.1b` cierra la deuda de scroll estructural repetido dentro de lanes.

### Lane header structure compression

Se redujo:

- eyebrow
- dominance label
- subtitulo
- alertas y overflow copy
- gaps internos del header

Objetivo:

- orientar rapido
- no repetir mini dashboards por lane

### Lane metrics structure compression

Se comprimio:

- padding
- gap
- altura de metric cards
- supporting labels
- peso visual de metricas secundarias

Sin eliminar metricas criticas.

### Repeated lane preface reduction

Se redujo:

- espacio header -> metrics
- espacio metrics -> cards
- gap entre grupos de produccion
- repeticion visual previa a la primera card

### Resolved card compression

Las cards `completed` y `cancelled` ahora son mas compactas que las activas:

- header mas corto
- meta mas corta
- total mas compacto
- WhatsApp mas discreto
- action row mas baja

### Estado real

Estado actual:

- `V.3.1` implementada
- `V.3.1a` aplicada como fix pass
- `V.3.1b` aplicada como fix pass
- `V.3.1` no debe considerarse aprobada hasta QA visual final autenticado
