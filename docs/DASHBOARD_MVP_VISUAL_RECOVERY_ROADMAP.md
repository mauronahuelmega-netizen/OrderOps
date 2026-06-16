# Dashboard MVP Visual Recovery Roadmap

## Fuente de verdad

Este documento consolida la direccion oficial definida en [PANEL ADMIN.pdf](C:\Users\Oasis%20Desktop\Desktop\PANEL%20ADMIN.pdf).

No reemplaza el PDF. Lo traduce a roadmap de trabajo documental para el repo, sin reinterpretar el mockup.

## Objetivo

Migrar el dashboard desde:

**"dashboard operacional funcional"**

hacia:

**"dashboard operacional SaaS, compacto y premium"**

## Diagnostico base

El dashboard actual representa:

- arquitectura operacional existente
- exceso de densidad visual
- demasiada dependencia de borders
- exceso de superficies verticales
- scroll elevado
- baja sensacion SaaS
- cards extensas
- baja jerarquia visual

El dashboard objetivo representa:

- direccion visual oficial
- reduccion de ruido
- surfaces mas limpias
- mejor jerarquia
- cards compactas
- sensacion SaaS premium
- mejor scanning operacional
- menor carga visual
- mejor separacion visual

## Cambio de direccion

El dashboard ya es funcional operacionalmente.

El principal problema actual pasa a ser:

- exceso de scroll
- densidad excesiva
- demasiadas capas verticales
- duplicacion visual
- poca sensacion SaaS
- cards demasiado altas
- exceso de borders
- baja compresion visual

La nueva direccion es:

Pasar de:

**"seguir agregando inteligencia operacional"**

a:

**"hacer que la inteligencia actual se vea simple"**

## Freeze de expansion operacional

Queda congelado:

- expansion OX aplicada al dashboard
- nuevas lanes
- nuevas capas verticales
- nuevas metricas
- nuevas surfaces
- nuevos widgets
- nueva complejidad operacional

No corresponde proponer:

- arquitectura nueva
- redisenos completos paralelos
- sistemas paralelos
- dashboards alternativos

## Scope boundary

Esta direccion afecta unicamente:

- `/dashboard`
- surfaces visuales
- cards
- spacing
- hierarchy
- visual system
- responsive behavior
- dashboard density
- dashboard scanning

Fuera de alcance:

- catalogo
- checkout
- onboarding
- configuraciones
- backend
- APIs
- auth
- DB
- realtime
- pipelines
- notificaciones

## Roadmap oficial

### V.0 -- Baseline & Freeze

- consolidar documentacion
- fijar boundaries
- congelar expansion operacional

### V.1 -- Design System Foundation

- token system
- surface system
- bases visuales comunes

### V.2 -- Dashboard Structure Recovery

- recuperar estructura
- limpiar jerarquia
- reducir ruido estructural

### V.3 -- Order Cards Refactor

- compactar cards
- reducir altura
- reforzar scanning

### V.4 -- Filters, Pills & Navigation

- recuperar claridad de navegacion
- reducir ruido de pills y filtros

### V.5 -- Mobile Recovery

- adaptar densidad y jerarquia a mobile
- mejorar fold y comportamiento responsive

### V.6 -- Operational Modes

- documentar y preparar modos operacionales
- sin reabrir expansion funcional del dashboard

### V.7 -- Final Polish

- ajuste final de consistencia visual
- cierre visual del MVP

## Implementation order

1. token system
2. surface system
3. order cards
4. KPI recovery
5. pills
6. section spacing
7. mobile recovery
8. dark mode
9. operational modes
10. final polish

## Definition of Done del MVP

- [ ] 20-30% menos altura general
- [ ] menos scroll
- [ ] cards compactas
- [ ] menor dependencia de borders
- [ ] mejor jerarquia visual
- [ ] sistema visual SaaS consistente
- [ ] desktop aprobado
- [ ] tablet aprobado
- [ ] mobile aprobado
- [ ] dark mode documentado y preparado
- [ ] operational modes documentados
- [ ] dashboard visualmente cercano al mockup objetivo

## Legacy OX Context

### Que se conserva

- la historia de `OX.1 -> OX.3.6`
- la continuidad visible inmediata de `OX.3.7`
- los principios de riesgo, ownership, scanning, densidad y foco
- la arquitectura operacional ya construida

### Que se congela

- la expansion operacional del dashboard como roadmap activo
- nuevas lanes, capas, metrics layers, widgets o surfaces
- cualquier paso que aumente complejidad antes de recuperar claridad visual

### Que se reemplaza

- OX deja de marcar la hoja de ruta activa del MVP
- el roadmap visual `V.0 -> V.7` toma ese rol

### Como convivira OX con el roadmap nuevo

- OX sigue explicando por que el dashboard es como es
- este roadmap define como debe verse y consolidarse el MVP
- el trabajo visual futuro debe conservar la inteligencia operacional ya ganada sin seguir expandiendola

## Restricciones de esta consolidacion

No tocar:

- codigo
- UI
- componentes
- CSS
- logica operacional
- pipelines criticos

No reinterpretar el mockup.
No agregar nuevas features.
