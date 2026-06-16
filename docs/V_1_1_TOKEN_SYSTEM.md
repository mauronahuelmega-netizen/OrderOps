# V.1.1 -- Token System

## Objetivo

Implementar la capa base de tokens visuales del dashboard MVP sin cambiar layout, componentes ni comportamiento.

La meta de esta fase fue:

- centralizar naming visual
- reducir dependencia de hardcodes en estilos base
- mantener retrocompatibilidad
- preparar dark mode, operational modes y responsive behavior futuros

## Estructura elegida

Se agrego:

- [app/theme-tokens.css](C:\Users\Oasis%20Desktop\Documents\New%20project%202\app\theme-tokens.css)

Y se conecto desde:

- [app/globals.css](C:\Users\Oasis%20Desktop\Documents\New%20project%202\app\globals.css)

La estructura usa dos capas:

1. **tokens nuevos**
2. **aliases legacy**

Eso permite introducir el sistema nuevo sin romper el dashboard actual ni el resto del producto.

## Tokens creados

### Color tokens

Canvas:

- `--bg-canvas`
- `--bg-surface`
- `--bg-surface-soft`

Text:

- `--text-primary`
- `--text-secondary`
- `--text-muted`

Borders:

- `--border-soft`
- `--border-strong`

Brand:

- `--accent-primary`
- `--accent-primary-strong`
- `--accent-soft`

Semantic:

- `--success`
- `--warning`
- `--danger`
- `--info`
- `--neutral`

Operational:

- `--risk`
- `--ownership`
- `--congestion`
- `--focus`

### Spacing tokens

- `--space-xs`
- `--space-sm`
- `--space-md`
- `--space-lg`
- `--space-xl`
- `--space-2xl`

### Radius tokens

- `--radius-sm`
- `--radius-md`
- `--radius-lg`
- `--radius-xl`
- `--radius-full`

### Elevation tokens

- `--shadow-sm`
- `--shadow-md`
- `--shadow-lg`
- `--shadow-surface`

### Typography tokens

Display:

- `--type-display-family`
- `--type-display-size`
- `--type-display-line-height`
- `--type-display-weight`

Heading:

- `--type-heading-family`
- `--type-heading-size`
- `--type-heading-line-height`
- `--type-heading-weight`

Body:

- `--type-body-family`
- `--type-body-size`
- `--type-body-line-height`
- `--type-body-weight`

Label:

- `--type-label-family`
- `--type-label-size`
- `--type-label-line-height`
- `--type-label-weight`

Caption:

- `--type-caption-family`
- `--type-caption-size`
- `--type-caption-line-height`
- `--type-caption-weight`

Metric:

- `--type-metric-family`
- `--type-metric-size`
- `--type-metric-line-height`
- `--type-metric-weight`

### Motion tokens

Durations:

- `--motion-fast`
- `--motion-normal`
- `--motion-slow`

Transitions:

- `--transition-hover`
- `--transition-focus`
- `--transition-press`

### Responsive tokens

- `--breakpoint-mobile`
- `--breakpoint-tablet`
- `--breakpoint-desktop`

## Dark mode preparation

Se dejo preparada una estructura de override en:

- `html[data-dashboard-theme="dark"]`

No se activo dark mode.
Solo se prepararon valores para una futura fase sin obligar implementacion ahora.

## Consumo inicial

La fase no buscaba reestilar el dashboard completo.

Solo se conecto el sistema en estilos base compartidos:

- `app/globals.css`
- `components/admin/admin-surfaces.css`
- `components/admin/admin-shell.css`
- `components/admin/admin-header.css`
- `components/admin/admin-page-header.css`

## Decisiones tomadas

### 1. Separar tokens nuevos de aliases legacy

Esto reduce riesgo porque:

- no obliga a migrar todo el repo en V.1.1
- evita romper public/catalog/checkout
- permite avanzar por capas en V.1.2+

### 2. No tocar componentes TSX

La fase se limito a la base visual y no reabrió componentes, layout ni comportamiento.

### 3. Consumir tokens solo en estilos base compartidos

Eso da una primera validacion real sobre el admin sin disparar una reescritura visual mas grande.

## Riesgos

Riesgos conscientes de esta fase:

- el repo todavia conserva hardcodes legacy fuera de la capa base ya tocada
- puede existir convivencia temporal entre tokens nuevos y estilos heredados
- dark mode esta preparado, no validado visualmente

Estos riesgos son aceptables en V.1.1 porque el objetivo era fundacional, no de polish.

## Preparacion para V.1.2

V.1.1 deja preparado:

- naming comun de color, spacing, radius, elevation y typography
- punto unico de entrada para temas del dashboard
- base para avanzar sin volver a hardcodear valores

Lo que no corresponde hacer todavia desde esta fase:

- refactor de cards
- cambio de layout
- recuperacion de spacing
- compresion visual
- restructura del dashboard
- nuevos componentes

## Legacy OX Context

### Que se conserva

- OX como memoria de jerarquia, scanning y operacion viva

### Que se congela

- expansion OX del dashboard como direccion activa

### Que se reemplaza

- la prioridad de expansion operacional por una prioridad de base visual consistente

### Como convivira OX con el roadmap nuevo

- OX sigue informando contexto
- V.1.1 construye el sistema visual minimo para las fases siguientes
