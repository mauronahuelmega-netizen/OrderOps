# V.1.2 -- Surface System

## Objetivo

Implementar un sistema reutilizable de surfaces para el admin usando la token layer creada en V.1.1.

La meta de esta fase fue:

- pasar de una logica visual de cajas con borde a una gramatica de surfaces
- centralizar reglas de fondo, borde, elevacion e interaccion
- preparar una base reutilizable para el dashboard MVP

## Relacion con V.1.1

V.1.1 construyo:

- color tokens
- spacing tokens
- radius tokens
- elevation tokens
- typography tokens
- motion tokens
- responsive tokens

V.1.2 reutiliza esa base y agrega una capa semantica de surfaces sobre esos tokens.

## Clases creadas o consolidadas

- `.oo-canvas`
- `.oo-surface`
- `.oo-surface-soft`
- `.oo-surface-elevated`
- `.oo-surface-interactive`
- `.oo-surface-critical`
- `.oo-surface-muted`
- `.oo-panel`
- `.oo-card`
- `.oo-strip`

## Tokens de surface agregados

En [app/theme-tokens.css](C:\Users\Oasis%20Desktop\Documents\New%20project%202\app\theme-tokens.css) se agregaron tokens como:

- `--surface-canvas-*`
- `--surface-base-*`
- `--surface-soft-*`
- `--surface-elevated-*`
- `--surface-interactive-*`
- `--surface-critical-*`
- `--surface-muted-*`
- `--surface-strip-*`

Tambien se agregaron tokens de padding estructural:

- `--surface-panel-padding`
- `--surface-card-padding`
- `--surface-strip-padding-*`

## Reglas de uso

### Canvas

Usar para:

- fondo general del admin
- shell principal

Clase:

- `.oo-canvas`

### Surface

Usar para:

- paneles principales
- secciones base

Clase:

- `.oo-surface`

### Surface Soft

Usar para:

- KPIs
- metadata
- chips
- summaries ligeros

Clase:

- `.oo-surface-soft`

### Surface Elevated

Usar para:

- cards importantes
- paneles destacados
- bloques que necesitan separacion visual premium sin volverse agresivos

Clase:

- `.oo-surface-elevated`

### Surface Interactive

Usar para:

- elementos clickeables
- links tipo panel
- surfaces con hover/focus/press

Clase:

- `.oo-surface-interactive`

### Surface Critical

Usar para:

- riesgo
- alerta
- demora
- atencion inmediata

Clase:

- `.oo-surface-critical`

### Surface Muted

Usar para:

- informacion secundaria
- contexto no dominante
- elementos suaves de apoyo

Clase:

- `.oo-surface-muted`

## Mapping conceptual por bloques

- KPIs -> `Surface Soft`
- order cards -> `Surface Elevated / Interactive`
- dashboard sections -> `Surface`
- risk / warning states -> `Surface Critical`
- metadata -> `Surface Muted`
- header / admin shell -> `Surface / Elevated` segun el caso
- strips compactos -> `Surface Soft / Strip`

Importante:

Este mapping es conceptual y de clases base.
No implico refactorizar todas las instancias del dashboard en esta fase.

## Integracion realizada

Se aplico la nueva gramatica de forma acotada en:

- [components/admin/admin-surfaces.css](C:\Users\Oasis%20Desktop\Documents\New%20project%202\components\admin\admin-surfaces.css)
- [components/admin/admin-shell.css](C:\Users\Oasis%20Desktop\Documents\New%20project%202\components\admin\admin-shell.css)
- [components/admin/admin-header.css](C:\Users\Oasis%20Desktop\Documents\New%20project%202\components\admin\admin-header.css)

Tambien se generaron aliases sobre surfaces admin existentes para evitar romper compatibilidad.

## Restricciones respetadas

No se tocó:

- layout
- TSX
- cards internas
- lanes internas
- logica operacional
- realtime
- DB
- search
- notifications
- checkout
- catalog

## Riesgos

Riesgos conscientes de esta fase:

- el repo sigue teniendo surfaces legacy fuera del alcance tocado
- todavia no todas las cards ni strips consumen la nueva gramatica
- la gramatica existe antes de que se aplique masivamente

Eso es correcto para V.1.2.

## Preparacion para V.1.3

V.1.2 deja listo:

- un vocabulario comun de surfaces
- reglas de uso por jerarquia
- tokens suficientes para que V.1.3 defina reglas visuales sin inventar otra capa

Lo que no corresponde hacer todavia desde esta fase:

- refactor de cards
- recuperacion de spacing
- restructura del dashboard
- mobile recovery completa
- dark mode real

## Legacy OX Context

### Que se conserva

- OX como memoria de jerarquia, scanning y operacion viva

### Que se congela

- expansion OX del dashboard como direccion activa

### Que se reemplaza

- la prioridad de expansion operacional por una prioridad de gramatica visual consistente

### Como convivira OX con el roadmap nuevo

- OX sigue informando contexto
- V.1.2 construye la capa de surfaces para las fases siguientes
