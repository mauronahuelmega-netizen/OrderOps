# V.5 -- Mobile Recovery

## Objetivo

Abrir formalmente el frente de mobile recovery del dashboard operativo.

`V.5` no implementa cambios visuales todavia. Define baseline, microfases, riesgos, reglas y criterios de aprobacion para recuperar operacion mobile real sin improvisar sobre la UI productiva.

El objetivo operacional de `V.5` es:

- menos scroll
- menos fatiga tactil
- menos alcance incomodo
- menos perdida de contexto
- mas cards utiles por viewport
- mejor continuidad tras acciones
- mejor uso en sesiones largas

`V.5` no es hacerlo mas lindo.
`V.5` es recuperacion operacional mobile.

## V.5a -- Mobile Compression Constraints & Success Metrics

`V.5a` existe para preparar `V.5.1`.

No implementa UI, layout, CSS ni logica. Agrega restricciones explicitas para evitar que:

- `V.5.1` derive en miniaturizacion
- se compriman componentes equivocados
- QA quede subjetiva
- se rompa desktop intentando arreglar mobile
- se itere sin metricas

## Relacion con V.4.2

`V.4.2` y sus fix passes dejan la navegacion superior mas compacta, mas continua y mas compatible con mobile.

`V.5` toma esa base y abre el trabajo real de recuperacion mobile, pero sin ejecutar todavia ninguna microfase.

## Microfases oficiales

### V.5.1 -- Mobile Compression

Objetivo:

- reducir altura visual de cards, lanes y bloques mobile
- meter mas operacion util por viewport
- evitar miniaturizacion

#### Implementacion aplicada

`V.5.1` ya se implemento como una pasada de compresion mobile-first sobre CSS compartido del dashboard.

Se aplico en `320px`, `390px`, `768px` y con sanity-safe para `1024px`:

- menor padding vertical de card shell
- menor gap entre bloques internos no criticos
- menor aire entre lane header, metrics y cards
- metadata secundaria mas compacta
- menor separacion entre cards consecutivas
- menor aire alrededor del bloque de acciones, sin tocar CTA primaria

No se tocaron logica, handlers, queries, realtime ni layout funcional.

### V.5.2 -- Thumb Zones

Objetivo:

- mejorar accesibilidad tactil
- revisar ubicacion de primary actions
- asegurar touch targets razonables
- reducir reposicionamiento de mano

#### Implementacion aplicada

`V.5.2` ya se implemento como una pasada de ergonomia tactil mobile-first sobre CSS compartido del dashboard.

Se aplico en `320px`, `390px`, `768px` y con sanity-safe para `1024px`:

- audit de touch target sobre primary y secondary actions
- ajuste de min-height y padding tactil en acciones sin cambiar handlers
- mejora de reachability de primary action sin volverla full-width
- mejor separacion tactil entre secondary siblings
- ajuste de lower-zone ergonomics entre timeline, price/meta y actions
- verificacion conservadora de search / filter touch safety

No se tocaron logica, labels, orden funcional ni layout operativo.

### V.5.3 -- Scroll Recovery

Objetivo:

- reducir perdida de contexto durante scroll largo
- preservar ubicacion despues de acciones
- mejorar continuidad entre lanes
- validar sesiones con muchos pedidos

#### Implementacion aplicada

`V.5.3` ya se implemento como una pasada de continuidad visual y recovery de contexto sobre CSS compartido del dashboard.

Se aplico en `320px`, `390px`, `768px` y con sanity-safe para `1024px`:

- mejor continuidad visual entre lane header, lane count y primera card
- menor corte entre ultima card de una lane y siguiente lane
- menor costo previo a la primera lane dentro del bloque operativo
- rhythm mas predecible despues de acciones, sin tocar handlers ni optimistic updates
- ajustes conservadores de session rhythm en stacks largos

No se tocaron resultados visibles, orden de pedidos, queries ni comportamiento funcional.

## Success metrics obligatorias para V.5.1

### En `390px`

Objetivos tentativos:

- `+15%` a `+30%` mas contenido util visible
- primera card visible antes
- menor altura previa a lanes

### En `320px`

Objetivos tentativos:

- primera card usable sin friccion inmediata
- actions siguen tocables
- cards siguen escaneables

### Generales

- mas informacion util por viewport
- menos scroll requerido
- misma claridad operacional

Estas metricas son deliberadamente simples. Sirven para acotar decisiones sin inventar benchmarks artificiales.

## Protected zones

Estas zonas quedan explicitamente protegidas y no deben comprimirse de forma agresiva:

- CTAs primarios
- precios
- status pills
- lane headers
- nombre del cliente
- targets tactiles
- search input minimo
- botones criticos
- counters criticos

Regla de interpretacion:

densidad no equivale a miniaturizacion.

## Compressible zones

Estas zonas si pueden comprimirse durante `V.5.1`:

- gaps verticales
- padding vertical
- spacing entre bloques
- metadata secundaria
- rhythm entre lanes
- aire interno no critico
- margenes redundantes
- wrappers altos

La compresion valida debe venir de ritmo, espacios y aire no critico; no de achicar las senales operativas clave.

## Dataset baseline obligatorio

`V.5` no se valida solo con datasets chicos.

### Datasets

Smoke:

- `1-3` pedidos

Normal:

- `10-20` pedidos

Stress:

- `40+` pedidos

### Escenarios

- lanes desbalanceadas
- multiples estados
- multiples owners
- varias cards consecutivas

## Failure conditions

Un cambio de mobile recovery falla si:

- requiere zoom visual
- genera targets incomodos
- rompe scanability
- crea wraps feos
- esconde informacion critica
- mueve CTAs fuera de alcance
- rompe desktop
- genera overflow horizontal
- empeora velocidad operacional

## Execution order obligatorio

`V.5a -- Constraints & Success Metrics`
↓
`V.5.1 -- Mobile Compression`
↓
QA
↓
`V.5.2 -- Thumb Zones`
↓
QA
↓
`V.5.3 -- Scroll Recovery`
↓
QA final

## Decision sobre sticky lane headers

Se evaluo la opcion de sticky lane headers y la decision en esta pasada fue:

**NO sticky**

Motivo:

- esta fase buscaba continuidad visual, no layering nuevo
- el beneficio no justificaba el riesgo de tapar acciones, search o dropdown
- habia riesgo de layering bugs en mobile y regresiones en desktop

Si sticky vuelve a evaluarse, deberia hacerse como decision aislada y con QA dedicada.

## Reglas obligatorias de V.5

1. Densidad si, miniaturizacion no.
2. No esconder informacion critica.
3. No romper acciones primarias.
4. No reducir touch targets por debajo de lo razonable.
5. No tocar logica operacional salvo bug claro.
6. No cambiar filtros, search, realtime, queries ni estado global.
7. No abrir nuevos modos operativos.
8. No reintroducir fragmentacion visual.
9. No optimizar desktop a costa de mobile.
10. Cada microfase debe tener QA mobile real.

## Baseline de QA mobile

### Breakpoints obligatorios

- `320px`
- `390px`
- `768px`
- `1024px` como sanity check

### Dispositivos de referencia

- Android mid-size / Galaxy A51-like
- iPhone narrow viewport equivalent
- tablet portrait

### Validaciones obligatorias

- no overflow horizontal
- search sigue usable
- filtros siguen accesibles
- shortcuts siguen claros
- cards siguen legibles
- actions siguen tocables
- thumb reach razonable
- CTA principal sigue dominante
- no aparecen filas nuevas innecesarias
- lane scanning sigue rapido
- primera card entra antes cuando aplique
- scroll no pierde contexto
- no hay regressions desktop criticas

## V.5.1 -- Cambios protegidos y aplicados

### Protected zones mantenidas

Durante la implementacion de `V.5.1` no se comprimieron agresivamente:

- CTAs primarios
- precios
- status pills
- lane headers
- nombre del cliente
- targets tactiles
- search input minimo
- botones criticos
- counters criticos

### Compressible zones aplicadas

La compresion real se concentro en:

- gaps verticales
- padding vertical
- spacing entre bloques
- metadata secundaria
- rhythm entre lanes
- aire interno no critico
- margenes redundantes
- wrappers altos
- separacion entre metadata rows
- separacion card -> actions cuando no comprometia touch safety

## V.5.2 -- Cambios protegidos y aplicados

### Touch targets mantenidos o reforzados

Durante la implementacion de `V.5.2` se protegieron o reforzaron:

- CTAs primarios
- secondary actions visibles
- targets tactiles
- search input minimo
- filter trigger
- dropdown de filtros
- lane counters
- precio y status en zona baja de card

### Ajustes tactiles aplicados

La pasada de thumb zones se concentro en:

- min-height razonable de primary y secondary actions
- ancho minimo razonable de primary action
- gap tactil entre acciones
- icon spacing estable en `Cancelar`, `Completar` secondary y `WhatsApp`
- mejor separacion entre timeline / meta / actions
- seguridad tactil de search y trigger `Filtros`

## V.5.3 -- Cambios protegidos y aplicados

### Continuidad visual reforzada

Durante la implementacion de `V.5.3` se reforzo la relacion entre:

- lane header
- lane count
- lane metrics
- primera card
- ultima card y siguiente lane

### Ajustes de scroll rhythm aplicados

La pasada de scroll recovery se concentro en:

- gap entre navigation/scanning y primera lane
- gap entre lane header y primera card
- gap entre cards consecutivas dentro del stack
- gap entre ultima card y siguiente lane header
- spacing mas predecible entre estados para reducir reencuadre mental

## Riesgos principales

- sobrecompactar
- targets demasiado chicos
- perder scanability
- cards ilegibles
- acciones secundarias demasiado ocultas
- romper jerarquia de estados
- generar overflow horizontal
- mejorar un breakpoint y romper otro
- tocar logica por accidente

## Definition of Done de V.5

`V.5` se considera completa solo cuando:

- `V.5.1` aprobado
- `V.5.2` aprobado
- `V.5.3` aprobado
- QA mobile real aprobado
- desktop sanity check aprobado
- sin overflow horizontal
- sin regresiones funcionales
- documentacion actualizada

## Alcance consolidado hasta V.5.3

Ya se hizo:

- apertura formal de `V.5`
- restricciones y metricas para `V.5.1`
- compresion mobile de cards y lanes en `V.5.1`
- ergonomia tactil de thumb zones en `V.5.2`
- scroll recovery visual y continuidad de lanes en `V.5.3`

Todavia no se hace:

- cambios de logica
- cambios funcionales
- nuevas features

## Nota de alcance futuro

Operational Windows no forma parte de `V.5`.

Queda reservado para:

- `V.6 -- Operational Windows`
- `V.6.1 -- Default Day Scope`
- `V.6.2 -- Business Day Windows`
- `V.6.3 -- Store Sessions`

## V.5.3a -- Mobile Recovery Documentation Reconciliation

Nota de reconciliacion:

- `V.5.1`, `V.5.2` y `V.5.3` ya estan implementadas
- `V.5.3a` corrige solo documentacion
- no cambia UI ni comportamiento
- Operational Windows sigue reservado para `V.6`
