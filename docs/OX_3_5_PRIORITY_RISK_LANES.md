# OX.3.5 - Priority & Risk Lanes

## Resumen ejecutivo

OX.3.5 toma la base conceptual de OX.3.1, OX.3.2 y OX.3.3, y la cruza con la implementacion acotada de OX.3.4 para crear una primera superficie real de lanes prioritarias dentro de `/admin/dashboard`.

La intencion de esta fase no fue redisenar todo el board ni reemplazar los grupos por estado. La intencion fue agregar una capa focal previa al workflow base que haga mas visible:

- riesgo activo
- ownership incompleto
- foco personal

La jerarquia resultante queda asi:

- el header de cada priority lane dice por que mirar ahi
- la metrics layer resume volumen, riesgo, ownership y tiempo
- las cards siguen siendo la verdad operacional
- los grupos por estado siguen siendo el workflow base

## Componentes `.tsx` de Priority & Risk Lanes

Se agrego:

- `components/admin/orders/priority-risk-lanes.tsx`

Responsabilidad:

- renderizar lanes de prioridad arriba del board principal
- expresar tres focos iniciales:
  - `Con riesgo / Demorados`
  - `Sin responsable`
  - `A mi cargo`
- reutilizar `LaneMetricsLayer`
- reutilizar las mismas cards existentes sin tocar su contenido interno

## Helpers para calculo de metricas de riesgo y priorizacion

Se agrego:

- `lib/orders/priority-risk-lanes.ts`

Responsabilidad:

- definir tipos de lanes prioritarias
- construir lanes a partir de `filteredOrders`
- decidir tono, alerta y dominance label por lane
- calcular cuantos pedidos mostrar y cuantos dejar resumidos como overflow
- reutilizar `buildOperationalLaneMetrics(...)` para que header, metrics y riesgo hablen el mismo idioma

Keys implementadas:

- `risk`
- `unassigned`
- `mine`

## Reglas de escalamiento y densidad conceptual por estado y viewport

### Risk lane

Escala cuando:

- hay pedidos con `warning`
- hay varios pedidos con riesgo simultaneo
- la cola esta en `busy` o `critical`

Header:

- explica que la lane es prioridad critica

Metrics:

- concentran conteo afectado, ownership gap, cola y antiguedad

Cards:

- muestran los casos concretos a resolver primero

### Unassigned lane

Escala cuando:

- hay varios pedidos sin responsable
- hay pedidos sin responsable que ademas tienen riesgo

Header:

- expresa hueco de ownership

Metrics:

- resumen volumen, riesgo y pending asociados

Cards:

- muestran las tomas pendientes reales

### Mine lane

Escala cuando:

- hay pedidos propios con riesgo
- la carga personal activa ya es relevante

Header:

- expresa foco individual

Metrics:

- resumen carga, riesgo y distribucion por estado

Cards:

- muestran solo el subconjunto prioritario visible

### Desktop

- puede sostener las 3 lanes si aportan
- cada lane puede mostrar hasta 3 cards visibles
- las metricas siguen con hasta 4 items sin volverse mini dashboard

### Mobile

- la densidad sigue siendo agresivamente compacta
- la cards area de cada lane queda corta
- el overflow se resume en `+N pedidos mas`
- no se agregan nuevas tiras narrativas ni negocio dentro de la lane

## Secuencia conceptual de actualizacion por estado y rol

### Operator

1. `Con riesgo / Demorados`
2. `Sin responsable`
3. `A mi cargo`
4. workflow base por estado

### Manager

1. `Con riesgo / Demorados`
2. `Sin responsable`
3. `Preparing` / `Pending` base
4. `A mi cargo` si aporta coordinacion

### Owner

1. lane de riesgo si existe friccion real
2. lectura general del board
3. lanes prioritarias como evidencia, no como dashboard paralelo

### Reglas por estado del pedido

- `pending` sube dentro de `risk` o `unassigned` si espera, envejece o no tiene ownership
- `preparing` sube fuerte dentro de `risk` si aparece lentitud, stalled o regression
- `ready` entra a `risk` si la salida se acumula o el pedido queda retenido
- `completed` y `cancelled` no alimentan estas lanes prioritarias en esta fase

## Integracion con headers (OX.3.3) y metrics layer (OX.3.4)

### Header

Se queda con:

- identidad de la lane
- razon para mirar ahi
- dominance label
- alerta corta

### Metrics layer

Se queda con:

- conteo
- riesgo
- ownership
- cola / tiempo / distribucion por estado

### Cards

Se quedan con:

- detalle del pedido
- acciones
- timeline
- chips y assignment por caso

La separacion sigue siendo intencional:

- header orienta
- metrics resume
- cards resuelven

## Integracion con fold consolidado (OX.2.8)

La implementacion se monto como una capa previa al board principal sin reemplazarlo.

Eso respeta OX.2.8 porque:

- riesgo aparece antes del workflow base
- ownership gana visibilidad sin mover el dashboard completo
- no se empuja negocio por encima de operacion
- no se toca el pipeline realtime ni el orden general del fold superior

## Preparacion para OX.3.6 - Delivery & Workflow Lanes

OX.3.5 deja lista una base util para OX.3.6:

- ya existe una superficie real de lane fuera de los grupos por estado
- ya existe helper para construir lanes de prioridad sobre `filteredOrders`
- ya existe integracion visual acotada con metricas y cards

OX.3.6 deberia apoyarse en esto para:

- decidir la expresion real de `delivery` y `pickup`
- reforzar workflow lanes sin duplicar filtros
- decidir mejor la convivencia entre priority lanes y lanes por estado

## Riesgos conceptuales y advertencias

- duplicar demasiado los mismos pedidos entre priority lanes y grupos por estado
- convertir las lanes prioritarias en una pared de cards antes del board
- hacer que `A mi cargo` compita con `Con riesgo` cuando no deberia
- sostener demasiada densidad en mobile
- dejar que la lane de riesgo repita todo lo que ya dicen las cards sin una sintesis real

## Decisiones NO tomadas todavia

OX.3.5 no decide:

- layout final del sistema de lanes
- sticky real
- scroll real por lane
- si `risk` sera lane definitiva o overlay transitorio
- si `mine` y `unassigned` quedaran permanentes o dinamicas
- reorder completo del dashboard
- cambios en realtime
- cambios en DB

## Archivos modificados

Codigo:

- `lib/orders/priority-risk-lanes.ts`
- `components/admin/orders/priority-risk-lanes.tsx`
- `components/admin/orders/admin-dashboard-orders.tsx`
- `components/admin/orders-admin.css`

Documentacion:

- `docs/OX_3_5_PRIORITY_RISK_LANES.md`
- `docs/CURRENT_PHASE.md`
- `docs/HANDOFF.md`
- `docs/ROADMAP.md`
- `docs/QA_CHECKLIST.md`
- `docs/OX_OPERATIONS_UX_CONSOLIDATION_ROADMAP.md`

## Confirmacion de alcance

En esta fase no se toco:

- layout global
- CSS global
- cards fuera de la nueva superficie de lanes
- KPIs
- insights
- feed
- busqueda
- realtime
- side effects
- push / browser notifications
- audio / toast / highlight
- checkout / catalogo
- DB

## Conclusiones

- OX.3.5 convierte riesgo y ownership en una estructura visible real sin romper el board actual
- las lanes prioritarias viven arriba del workflow base, no en reemplazo de el
- la base tecnica queda lista para que OX.3.6 avance sobre workflow y delivery sin improvisar otra capa paralela
