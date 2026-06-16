# OX.3.4 - Lane Metrics Layer

## Resumen ejecutivo

OX.3.4 marca el paso de blueprint conceptual a implementacion activa en codigo para la capa de metricas por lane dentro de `/admin/dashboard`. El objetivo no fue redisenar el tablero ni reemplazar headers o cards. El objetivo fue agregar una capa intermedia y liviana que ayude a leer mejor cada agrupacion sin tocar pipelines criticos.

La implementacion deja tres cosas claras:

- los headers siguen definiendo identidad minima
- las cards siguen siendo la verdad operacional
- la metrics layer vive entre ambas y aporta volumen, ownership, riesgo y tiempos resumidos

En esta fase se implemento una version conservadora:

- helper puro para agregar metricas por lane
- componente TSX reutilizable para renderizar la capa
- integracion solo en vistas agrupadas por estado y filtros actuales, sin tocar realtime ni side effects

## Componentes `.tsx` de metrics layer por lane

Se agrego:

- `components/admin/orders/lane-metrics-layer.tsx`

Responsabilidad:

- renderizar una capa compacta de metricas para una lane
- mostrar titulo, subtitulo, alerta corta y hasta cuatro metricas resumidas
- mantener tono visual sobrio y consistente con el dashboard existente

## Helpers de calculo y agregacion de metricas

Se agrego:

- `lib/orders/lane-metrics.ts`

Responsabilidad:

- definir tipos de lane metrics
- agregar conteos y senales resumidas por lane
- soportar lanes de estado, metodo y futuras lanes conceptuales de riesgo / ownership

Keys soportadas:

- `pending`
- `preparing`
- `ready`
- `completed`
- `cancelled`
- `delivery`
- `pickup`
- `risk`
- `unassigned`
- `mine`

## Reglas de compactacion y visibilidad segun viewport y estado

### Desktop

- la metrics layer puede mostrar hasta cuatro metricas por lane
- puede sostener conteo, ownership y riesgo a la vez en lanes criticas
- no debe competir con cards ni con el header del grupo

### Mobile

- la capa se mantiene en scroll horizontal compacto
- cada item tiene informacion minima
- se prioriza lectura rapida por encima de densidad completa

### Por estado

- `pending`: backlog, sin responsable, riesgo, antiguedad
- `preparing`: riesgo, asignacion, tiempo promedio, carga
- `ready`: acumulacion, riesgo, antiguedad
- `completed`: throughput y tiempo promedio
- `cancelled`: volumen, peso relativo y lectura de excepcion
- `delivery/pickup`: activos, listos y con riesgo

## Secuencia conceptual de actualizacion por estado y rol

### Operator

- debe ver primero riesgo y ownership dentro de `pending` y `preparing`
- `completed` y `cancelled` se mantienen secundarios

### Manager

- debe ver riesgo, ownership y balance de flujo
- lanes de metodo ganan valor si cambian la operacion del momento

### Owner

- puede leer throughput y cierre en `completed`
- no deberia perder la alerta de friccion si `preparing` o riesgo se disparan

### Actualizacion conceptual

- `pending` escala con backlog, espera y falta de responsable
- `preparing` escala con riesgo, lentitud y queue pressure
- `ready` escala si la salida se acumula
- `completed` y `cancelled` actualizan contexto y revision, no prioridad base

## Integracion con headers (OX.3.3) y fold consolidado (OX.2.8)

La separacion implementada queda asi:

### Header

Define:

- identidad de la lane
- tipo de trabajo
- senal minima de prioridad

### Metrics layer

Resume:

- conteo
- ownership
- riesgo
- tiempos o peso relativo

### Cards

Mantienen:

- detalle operativo
- acciones
- timeline corto
- riesgo por pedido

Esto respeta OX.2.8 porque:

- la metrics layer no reemplaza la capa critica
- no desplaza cards por encima del fold completo
- no agrega una nueva voz narrativa

## Reglas de actualizacion conceptual

- si la lane cambia por estado del pedido, cambia su set de metricas utiles
- si sube congestion, la lane de `preparing` debe volverse mas expresiva que `completed`
- si hay riesgo, la metric layer debe resumirlo sin duplicar todo el contenido de las cards
- si el usuario es owner, `completed` y `cancelled` ganan algo de valor contextual, pero no dominan

## Preparacion para OX.3.5 - Priority & Risk Lanes

La implementacion deja listo:

- un helper reutilizable para lanes futuras
- soporte tipado para `risk`, `unassigned` y `mine`
- una capa visual compacta que puede reaprovecharse cuando existan lanes reales

OX.3.5 deberia poder usar esta base para:

- reforzar lanes de riesgo
- convertir ownership en una lectura mas dominante cuando haga falta
- decidir si riesgo vive como lane propia u overlay estructural

## Archivos modificados

Codigo:

- `components/admin/orders/admin-dashboard-orders.tsx`
- `components/admin/orders/lane-metrics-layer.tsx`
- `components/admin/orders-admin.css`
- `lib/orders/lane-metrics.ts`

Documentacion:

- `docs/OX_3_4_LANE_METRICS_LAYER.md`
- `docs/CURRENT_PHASE.md`
- `docs/HANDOFF.md`
- `docs/ROADMAP.md`
- `docs/QA_CHECKLIST.md`
- `docs/OX_OPERATIONS_UX_CONSOLIDATION_ROADMAP.md`

## Riesgos conceptuales y advertencias

- convertir la metrics layer en otra banda narrativa en vez de una capa de lectura rapida
- duplicar demasiado riesgo entre header, metrics y cards
- darle demasiado peso a `completed` o `cancelled`
- cargar demasiado mobile con cuatro metricas irrelevantes
- asumir que las lanes conceptuales de riesgo / ownership ya estan implementadas cuando aun no existen como superficie propia

## Decisiones NO tomadas todavia

OX.3.4 no decide:

- layout final de lanes
- headers visuales definitivos
- si riesgo sera lane dedicada
- si ownership sera lane dedicada
- scroll / sticky reales
- motion
- dynamic priority real
- cambios en realtime
- cambios en DB

## Confirmacion de alcance

En esta fase no se toco:

- layout completo del dashboard
- CSS global
- cards fuera de la integracion de metrics layer
- KPIs existentes
- feed
- insights
- busqueda
- realtime
- side effects
- push / browser notifications
- audio / toast / highlight
- checkout / catalogo
- DB

## Conclusiones

- OX.3.4 deja una primera implementacion de metrics layer sobria y reutilizable
- la jerarquia sigue sana: header identifica, metrics resume, card resuelve
- la base tecnica ya existe para que OX.3.5 empiece a tratar riesgo y prioridad como estructura real y no solo como teoria
