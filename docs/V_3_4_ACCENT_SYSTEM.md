# V.3.4 -- Accent System

## Objetivo

Crear y aplicar un sistema visual consistente de acentos por:

- estado
- riesgo
- ownership
- active vs resolved

para que el operador reconozca mas rapido que requiere atencion sin depender tanto de leer texto.

## Relacion con V.3.3

- `V.3.1` comprimio cards
- `V.3.2` elimino duplicacion visual
- `V.3.3` mejoro eficiencia interna
- `V.3.4` refuerza lectura rapida con un sistema de acentos consistente

No cambia logica. Cambia legibilidad operacional.

## Acentos por estado

Se aplican sobre:

- badge principal
- borde / acento lateral
- tono general de presencia

Estados:

- `pending`: neutro-calido, backlog
- `preparing`: naranja operacional
- `ready`: azul de salida
- `completed`: verde liviano
- `cancelled`: rojo suave y no dominante

## Acentos de riesgo

El riesgo sigue sin crear otra lane y queda como senal secundaria:

- `attention`: acento discreto
- `warning`: acento mas visible

Se expresa con:

- chip de riesgo
- refuerzo de acento lateral cuando hay friccion real

## Acentos de ownership

Se diferencian:

- `A tu cargo`
- `A cargo de operador`
- `Sin responsable`

Regla:

- `Sin responsable` = mayor enfasis
- `A tu cargo` = enfasis medio
- ownership normal = enfasis bajo

## Active vs resolved

Las cards activas conservan mas presencia.

Las resueltas:

- usan menor peso de surface
- badges menos dominantes
- helper text mas discreto
- siguen legibles sin competir con produccion

## Que NO se toco

- DB
- auth
- queries
- realtime
- pipelines
- mutations
- search behavior
- filtros funcionales
- estados reales
- acciones reales
- nuevas features

## Riesgos pendientes

- falta QA autenticado con datos vivos
- el balance exacto entre acento de estado y acento de riesgo necesita validacion real
- mobile todavia necesita confirmacion tactil y de scroll con sesion real

## Preparacion para V.3.5

`V.3.4` deja lista una gramatica visual mas clara para una futura fase de refinamiento sin volver a abrir:

- nuevas lanes
- nuevas metricas
- nueva navegacion

## V.3.4a -- Accent Consistency Fix

`V.3.4a` cierra la deuda de consistencia entre:

- border
- accent rail
- badge
- shell

### Que se reforzo

- border por estado mas visible
- accent rail lateral consistente
- badge alineado con el color del shell
- surface mas activa en produccion y mas suave en resueltas

### Objetivo

Que la card sea reconocible por periferia, incluso sin leer el texto del badge.

## V.3.4b -- Accent Propagation Fix

`V.3.4b` completa la propagacion del acento para que el estado ya no viva solo en:

- el badge
- el borde
- el rail

Ahora tambien alcanza:

- contadores de seccion
- kicker de workflow
- accion primaria
- timeline activo
- hint contextual `Abrir pedido`
- boton de WhatsApp

### Regla principal

Cada estado debe sentirse como un lenguaje unico:

- `pending` = backlog calido
- `preparing` = naranja operacional
- `ready` = azul de salida
- `completed` = verde suave
- `cancelled` = rojo contenido

### Ajustes aplicados

- el shell deja de verse neutro frente al badge
- el rail y el borde refuerzan el mismo estado
- los contadores de lane heredan el color de la seccion
- `DELIVERY` / `RETIRO` ya no quedan en gris generico
- las acciones principales se alinean con el color de la card
- el timeline activo usa el mismo acento del estado
- WhatsApp acompana el estado sin competir con el badge

### Restriccion mantenida

- riesgo sigue siendo senal secundaria
- ownership sigue siendo metadata contextual
- no se agrega ninguna lane ni feature nueva

## V.3.4c -- Accent Priority Fix

`V.3.4c` corrige la prioridad visual entre:

- `statusAccent`
- `riskAccent`

### Regla aplicada

`statusAccent` ahora controla:

- border principal
- accent rail
- shell wash
- badge de estado
- kicker
- accion primaria
- timeline activo

`riskAccent` ahora controla solo:

- chip de riesgo o demora
- texto secundario de metadata
- `Ult. mov.`
- micro senales contextuales

### Bug visual corregido

Antes de este fix pass, una card `ready` o `completed` con demora podia sentirse mas naranja que azul o verde porque `stale / warning` estaban pisando el mismo canal visual del shell.

Ahora:

- `ready + stale` sigue siendo azul
- `completed + warning` sigue siendo verde
- `pending / preparing` conservan su familia calida propia
- riesgo sigue visible, pero no se aduena de la card

### Implementacion

- se separaron variables de `statusAccent` y `riskAccent`
- las clases `aging / stale / risk-attention / risk-warning` dejaron de sobrescribir rail, borde principal y shell
- el sistema secundario de riesgo se mueve a chips y metadata contextual

## V.3.4d -- Accent Rail Weight Fix

`V.3.4d` refuerza el rail lateral izquierdo para que funcione como senal periferica principal del estado.

### Nueva jerarquia visual

- rail lateral = senal fuerte del estado
- border general = contencion suave
- shell wash = presencia de fondo
- badge = confirmacion textual

### Ajuste aplicado

- el rail gana grosor y presencia
- se implementa sin layout shift
- se mantiene gobernado por `statusAccent`
- `riskAccent` no toca el rail

### Tecnica

- rail absoluto con pseudo-element interno
- sin empujar contenido
- sin aumentar ancho real de la card
- sin romper compactacion mobile

## V.3.4e -- Accent Rail Rebalance

`V.3.4e` rebalancea el rail para devolver limpieza visual despues del refuerzo de `V.3.4d`.

### Nueva prioridad visual

El estado vuelve a leerse en este orden:

1. badge
2. border
3. shell tint
4. accion primaria
5. timeline
6. rail

### Ajuste aplicado

- el rail deja de ser protagonista
- se vuelve casi imperceptible
- border y shell recuperan el rol principal junto con el badge
- se mantiene el sistema de acentos sin eliminarlo

### Resultado buscado

- menos ruido visual
- cards mas limpias
- mejor sensacion SaaS premium
- mobile menos cargado

## V.3.4f -- Secondary Metadata Neutralization

`V.3.4f` neutraliza metadata secundaria para que no compita con el acento principal del estado.

### Que se neutraliza

- `Ult. mov.`
- ownership normal
- `Sin responsable` como texto
- historial y contexto del cliente
- helper text
- hints secundarios
- chips contextuales suaves

### Que sigue coloreado por estado

- badge
- border
- shell tint
- CTA principal
- timeline activo
- contador de seccion
- kicker

### Regla aplicada

`metadata/contexto` deja de usar calidos por defecto.

`risk` solo toma color mas visible cuando hay `warning` real.

### Resultado buscado

- `ready` mas limpio y azul
- `completed` mas limpio y verde
- `pending / preparing` conservan identidad sin exagerar el calor
- riesgo sigue visible, pero subordinado
