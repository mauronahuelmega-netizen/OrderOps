# V.3.3 -- Card Hierarchy & Lane Efficiency

## Objetivo

Mejorar eficiencia interna de cards y lanes para que entren mas pedidos por viewport, especialmente en mobile, sin tocar logica ni abrir nuevas features.

## Relacion con V.3.2

- `V.3.2` elimino duplicacion visual entre lanes
- `V.3.3` aprovecha esa presencia unica para compactar mejor cards y prefacios de lane

No cambia ubicacion funcional del pedido. Cambia el costo visual de leerlo.

## Que se compacta

### Jerarquia de card

La card prioriza:

1. producto / pedido
2. estado
3. total
4. accion principal
5. workflow / ownership / contexto
6. metadata secundaria

Se reduce peso de:

- helper text
- labels repetidas
- metadata secundaria apilada
- timeline y actions en resueltas

### Metadata inline

La metadata secundaria pasa a una lectura mas corta y lineal.

En vez de varias filas pequenas, la card se acerca mas a:

- contexto
- ownership
- ultima actividad

en una sola banda breve de lectura.

### Lane metrics

Las metrics de lane en la vista principal se degradan desde mini KPI hacia resumen inline:

- menos altura
- menos surfaces repetidas
- menos prefacio antes de cards

### Resueltas

`completed` y `cancelled` se vuelven todavia mas compactas que las activas:

- menos padding
- menos metadata auxiliar
- actions mas cortas
- WhatsApp mas discreto

## Que NO se toca

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
- el comportamiento real de `completed` con volumen productivo todavia necesita revision visual
- puede quedar algun ajuste fino de accesibilidad tactil en mobile luego del QA real

## Preparacion para V.3.4

`V.3.3` deja listo:

- cards mas eficientes
- lanes con menos prefacio
- metrics menos pesadas
- mejor base para una futura pasada de fine tuning sin reabrir duplicacion ni estructura global
