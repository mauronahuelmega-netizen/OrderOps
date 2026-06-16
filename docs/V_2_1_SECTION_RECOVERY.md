# V.2.1 -- Section Recovery

## Objetivo

Recuperar la estructura visual del dashboard admin para reducir fragmentación, exceso de separación vertical y ruido entre bloques.

La meta de esta fase fue mover el dashboard desde:

**"dashboard fragmentado"**

hacia:

**"dashboard agrupado y legible"**

## Secciones existentes

Antes de esta fase, el dashboard presentaba los bloques principales en secuencia casi lineal:

- realtime bar
- `HOY`
- `OPERACION EN VIVO`
- `INSIGHTS`
- `RESUMEN OPERATIVO`
- `INSIGHTS DEL NEGOCIO`
- `ACTIVIDAD RECIENTE`
- búsqueda
- filtros
- lanes / grupos de pedidos

El problema no era falta de contenido, sino falta de agrupación estructural.

## Grouping aplicado

### 1. Overview

Grupo de lectura superior.

Incluye:

- realtime bar
- `HOY`
- `OPERACION EN VIVO`
- `INSIGHTS`

Objetivo:

- juntar señales de lectura rápida
- reducir sensación de bloques sueltos
- consolidar la capa de “estado general + pulso”

### 2. Context

Grupo intermedio.

Incluye:

- `RESUMEN OPERATIVO`
- `INSIGHTS DEL NEGOCIO`
- `ACTIVIDAD RECIENTE`

Objetivo:

- mantener contexto útil
- hacerlo competir menos con la ejecución
- dar continuidad visual a summaries y narrativa operacional

### 3. Execution

Grupo principal de trabajo.

Incluye:

- búsqueda
- filtros
- lane navigation
- priority lanes
- workflow lanes
- grupos/listas de pedidos

Objetivo:

- concentrar el flujo operativo en una sola familia estructural
- reducir corte visual entre navegación, foco y pedidos

## Rhythm rules

Se aplicaron estas reglas:

- spacing vertical consistente entre grupos
- menos separación artificial entre bloques internos
- el ritmo lo controla la sección, no cada bloque por separado
- se evita crear mega-contenedores o nesting excesivo

## Implementación realizada

Se agregaron:

- `admin-orders-structure`
- `admin-orders-section`
- `admin-orders-section--overview`
- `admin-orders-section--context`
- `admin-orders-section--execution`
- `admin-orders-section-cluster`
- `admin-orders-controls`
- `admin-orders-execution-flow`

También se ajustaron márgenes y anchos de varios bloques cuando viven dentro de sección para que:

- no se separen por cuenta propia
- no rompan el grouping
- mantengan una anchura coherente dentro del dashboard

## Cómo usa tokens / surfaces / visual rules

V.2.1 reutiliza:

- tokens de spacing y layout de V.1.1
- `oo-surface` y `oo-panel` de V.1.2
- reglas de jerarquía y agrupación de V.1.3

No crea otra gramática.
Solo aplica la existente a la estructura.

## Riesgos

Riesgos conscientes:

- todavía hay densidad heredada dentro de algunos bloques
- esta fase mejora estructura, no compacta contenido
- algunas strips siguen cargadas y necesitarán tratamiento más fino después

Eso es correcto para V.2.1.

## Preparación para V.2.2

V.2.1 deja listo:

- grouping semántico claro
- base más estable para rhythm refinements
- una lectura más cercana a overview / context / execution

Lo que no corresponde hacer todavía desde esta fase:

- card refactor
- compactación real
- KPI redesign
- mobile recovery
- nuevas lanes
- nuevos widgets

## Confirmación de alcance

Esta fase:

- no tocó lógica
- no tocó comportamiento funcional
- no tocó DB / auth / queries / realtime
- no creó features
- no rediseñó cards
- no abrió layout nuevo paralelo

## Legacy OX Context

### Que se conserva

- OX como memoria de jerarquía, scanning y operación viva

### Que se congela

- expansión OX del dashboard como dirección activa

### Que se reemplaza

- la prioridad de expansión operacional por una prioridad de recuperación estructural visual

### Como convivira OX con el roadmap nuevo

- OX sigue informando contexto
- V.2.1 toma ese contexto para mejorar agrupación, no para sumar complejidad
