# OX.3.7 - Lane Navigation & Scanning

## Resumen ejecutivo

OX.3.7 agrega una capa de navegacion operacional liviana sobre las lanes ya implementadas. No reemplaza filtros, no reordena el dashboard entero y no toca pipelines sensibles. Su funcion es reducir scanning manual y dar atajos visibles hacia:

- riesgo
- ownership gap
- foco personal
- workflow por metodo
- workflow por estado

La implementacion sigue la jerarquia definida en OX.2.8:

- primero foco critico
- despues workflow tactico
- despues estados base
- revision y throughput al final

## Componentes `.tsx` de lane navigation & scanning

Se agrego:

- `components/admin/orders/lane-navigation-scanning.tsx`

Responsabilidad:

- renderizar un strip de navegacion entre lanes visibles
- marcar foco sugerido
- permitir scroll suave hacia la lane correspondiente
- reflejar foco activo segun seccion visible

## Helpers de calculo y visualizacion de foco, prioridad y scanning

Se agrego:

- `lib/orders/lane-navigation-scanning.ts`

Responsabilidad:

- construir el modelo de navegacion visible
- ordenar items segun rol
- decidir foco sugerido
- resolver `targetId` por lane
- marcar tono y tipo de item:
  - `critical`
  - `workflow`
  - `state`
  - `review`

## Secuencia conceptual de paths de atencion y actualizacion por estado y rol

### Operator

1. lanes criticas
2. workflow por metodo
3. `preparing`
4. `pending`
5. `ready`
6. revision

### Manager

1. lanes criticas
2. workflow por metodo
3. `preparing`
4. `pending`
5. `ready`
6. `completed` / `cancelled`

### Owner

1. lanes criticas si existen
2. `completed`
3. `cancelled`
4. workflow por metodo
5. estados vivos si hace falta detalle

### Mobile

- mantiene menos densidad
- el strip vive en scroll horizontal
- el foco sugerido apunta primero a critical, despues a workflow y recien despues a estados base

### Actualizacion por estado del pedido

- si aparece riesgo, una lane critica gana prioridad de scanning
- si sube backlog o carga activa, `preparing` y `pending` ganan peso
- si se acumulan listos por metodo, `delivery` o `pickup` suben en la navegacion
- si la operacion esta tranquila, lanes de revision pueden ganar algo de visibilidad sin dominar

## Reglas conceptuales de compactacion, degradacion y densidad por viewport

### Desktop

- puede sostener mas items visibles al mismo tiempo
- el strip se distribuye en grid
- `critical` y `workflow` deben seguir leyendo primero

### Mobile

- el strip usa scroll horizontal compacto
- cada item resume nombre, conteo y dominance label
- no aparece narrativa larga
- el foco sugerido ayuda a evitar scanning sin rumbo

### Degradacion

- `completed` y `cancelled` bajan primero
- workflow por metodo baja si no aporta nada tactico
- lanes criticas no deberian desaparecer mientras haya friccion real

## Integracion con headers, metrics, priority/risk y workflow lanes

### OX.3.3 - Headers

La navegacion no reemplaza identidad de lane; solo ayuda a llegar antes a la lane correcta.

### OX.3.4 - Metrics layer

La navegacion no duplica metricas; apenas resume conteo y prioridad.

### OX.3.5 - Priority & Risk Lanes

Las lanes criticas son el primer destino sugerido y el primer grupo visible en el scanning.

### OX.3.6 - Delivery & Workflow Lanes

Las lanes de metodo aparecen despues de las criticas y antes del workflow base por estado cuando aportan lectura tactica.

## Condiciones de visibilidad

La navegacion se muestra solo cuando:

- `activeFilter === "all"`
- hay pedidos visibles
- existen varias secciones/layers que vale la pena escanear

Esto evita meter una navegacion redundante dentro de filtros ya especificos.

## Preparacion para OX.3.8 - Lane Density & Card Compression

OX.3.7 deja listo:

- un orden de lectura visible
- una prioridad por rol aplicada a codigo
- foco sugerido por lane
- ids y destinos reales sobre la superficie de lanes

OX.3.8 deberia apoyarse en esto para decidir:

- que lanes pueden volverse mas compactas
- cuantas cards visibles merece cada una
- donde empieza a sobrar densidad

## Riesgos conceptuales

- duplicar navegacion con filtros si el strip crece demasiado
- sugerir foco equivocado y volver el scanning mas confuso
- darle demasiado peso a review lanes
- llenar mobile de items sin valor
- convertir el strip en otra capa narrativa en vez de una capa de acceso

## Decisiones NO tomadas todavia

OX.3.7 no decide:

- sticky real de la navegacion
- scroll spy mas sofisticado
- navegacion por teclado avanzada entre lanes
- reorder general del dashboard
- cambios en realtime
- cambios en DB

## Archivos modificados

Codigo:

- `lib/orders/lane-navigation-scanning.ts`
- `components/admin/orders/lane-navigation-scanning.tsx`
- `components/admin/orders/priority-risk-lanes.tsx`
- `components/admin/orders/delivery-workflow-lanes.tsx`
- `components/admin/orders/admin-dashboard-orders.tsx`
- `components/admin/orders-admin.css`

Documentacion:

- `docs/OX_3_7_LANE_NAVIGATION_SCANNING.md`
- `docs/CURRENT_PHASE.md`
- `docs/HANDOFF.md`
- `docs/ROADMAP.md`
- `docs/QA_CHECKLIST.md`
- `docs/OX_OPERATIONS_UX_CONSOLIDATION_ROADMAP.md`

## Confirmacion de alcance

En esta fase no se toco:

- layout global
- CSS global
- cards fuera de lanes y scanning
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

- OX.3.7 le da al dashboard una capa real de scanning operacional sin rehacer la arquitectura
- riesgo, workflow y estados ya no solo existen: ahora tambien tienen rutas de atencion visibles
- la base queda lista para que OX.3.8 entre a densidad y compresion con una navegacion ya resuelta
