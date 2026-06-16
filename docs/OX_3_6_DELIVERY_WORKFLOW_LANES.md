# OX.3.6 - Delivery & Workflow Lanes

## Resumen ejecutivo

OX.3.6 implementa una primera superficie real de lanes de workflow por metodo de entrega en `/admin/dashboard`. La meta no fue reemplazar filtros, ni convertir `delivery` y `pickup` en otra taxonomia paralela. La meta fue darles una expresion operativa corta cuando ayudan a leer salida, ownership y friccion sin obligar a entrar por busqueda o filtro.

La implementacion deja esta jerarquia:

- priority lanes siguen expresando riesgo y ownership critico
- workflow lanes expresan `Delivery` y `Pickup / Retiro`
- los grupos por estado siguen siendo el workflow base
- las cards siguen siendo la verdad operacional

## Componentes `.tsx` de Delivery & Workflow Lanes

Se agrego:

- `components/admin/orders/delivery-workflow-lanes.tsx`

Responsabilidad:

- renderizar lanes de `Delivery` y `Pickup / Retiro`
- reutilizar `LaneMetricsLayer`
- reutilizar las mismas cards existentes
- resumir overflow sin abrir otra superficie densa

## Helpers de calculo y agregacion de metricas de workflow

Se agrego:

- `lib/orders/delivery-workflow-lanes.ts`

Responsabilidad:

- construir lanes por metodo sobre pedidos activos
- decidir tono, alerta y dominance label por lane
- reutilizar `buildOperationalLaneMetrics(...)` para no inventar otra capa de metricas
- devolver cards visibles y overflow resumido

## Metricas conceptuales por lane

### Delivery

Resume:

- conteo de pedidos
- activos
- listos
- con riesgo
- ownership gap cuando aplica
- backlog / congestion cuando cambia la lectura

### Pickup / Retiro

Resume:

- conteo de pedidos
- activos
- listos
- con riesgo
- ownership gap si aparece
- acumulacion de retiros listos

## Integracion con headers y metrics layer

### Header

Se queda con:

- identidad de la lane
- dominance label
- alerta corta
- motivo de lectura tactica

### Metrics layer

Se queda con:

- conteo
- riesgo
- activos / listos
- ownership o backlog segun corresponda

### Cards

Se quedan con:

- detalle real del pedido
- assignment
- quick actions
- timeline y chips existentes

## Reglas conceptuales de visualizacion, compactacion y actualizacion

### Desktop

- puede sostener ambas lanes si aportan
- cada lane muestra hasta 2 cards visibles
- el resto queda resumido como `+N pedidos mas`

### Mobile

- las lanes se mantienen compactas
- las cards visibles son pocas
- no se agrega narrativa nueva
- nada de negocio o contexto pasivo entra a estas lanes

### Actualizacion por estado

- `pending` suma backlog tactico por metodo
- `preparing` vuelve mas importante la lane si hay carga o lentitud
- `ready` la vuelve mas importante si hay salida acumulada
- `completed` y `cancelled` no entran en estas lanes en esta fase

### Actualizacion por riesgo

- si hay riesgo dentro de `delivery` o `pickup`, la lane sube de tono
- si hay ownership gap, la alerta se vuelve mas tactica
- si la cola esta en `busy` o `critical`, `delivery` gana mas peso que un contexto neutro

## Secuencia conceptual de actualizacion y paths de atencion por rol

### Operator

1. priority lanes (`risk`, `unassigned`)
2. lane de metodo relevante del momento
3. workflow base por estado

### Manager

1. `risk`
2. `unassigned`
3. `delivery` / `pickup` si cambian coordinacion o salida
4. grupos por estado para balance general

### Owner

1. friccion general
2. metodo dominante si explica el flujo
3. resto del board como lectura de contexto

## Integracion con OX.3.3, OX.3.4 y OX.3.5

### OX.3.3

Respeta la separacion entre identidad minima de lane y metadata adicional.

### OX.3.4

Reutiliza `LaneMetricsLayer` en vez de crear otra gramatica visual.

### OX.3.5

Convive con las priority lanes sin competir con ellas:

- primero riesgo y ownership critico
- despues metodo de workflow
- despues grupos por estado

## Preparacion para OX.3.7 - Lane Navigation & Scanning

OX.3.6 deja listo:

- que `delivery` y `pickup` ya tienen superficie real
- que su lectura puede convivir con risk lanes y grupos por estado
- que OX.3.7 ya puede decidir mejor como navegar entre lanes sin duplicar filtros ni search

## Riesgos conceptuales

- duplicar demasiado pedidos entre workflow lanes y grupos por estado
- hacer que `delivery` y `pickup` compitan con `risk`
- sostener lanes de metodo aunque no aporten nada tactico
- meter demasiadas cards por lane en mobile
- convertir metodo en jerarquia fija cuando a veces solo debe ser contexto

## Decisiones NO tomadas todavia

OX.3.6 no decide:

- layout final del sistema de lanes
- sticky real
- scroll real por lanes
- si `delivery` o `pickup` merecen mas prioridad bajo estados futuros
- navigation model final entre lanes
- cambios en realtime
- cambios en DB

## Archivos modificados

Codigo:

- `lib/orders/delivery-workflow-lanes.ts`
- `components/admin/orders/delivery-workflow-lanes.tsx`
- `components/admin/orders/admin-dashboard-orders.tsx`
- `components/admin/orders-admin.css`

Documentacion:

- `docs/OX_3_6_DELIVERY_WORKFLOW_LANES.md`
- `docs/CURRENT_PHASE.md`
- `docs/HANDOFF.md`
- `docs/ROADMAP.md`
- `docs/QA_CHECKLIST.md`
- `docs/OX_OPERATIONS_UX_CONSOLIDATION_ROADMAP.md`

## Confirmacion de alcance

En esta fase no se toco:

- layout global
- CSS global
- cards fuera de estas lanes
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

- OX.3.6 le da a `Delivery` y `Pickup / Retiro` una expresion operativa real pero controlada
- la lectura por metodo ya no depende solo de filtro o busqueda
- la base queda lista para que OX.3.7 trabaje navegacion y scanning entre lanes con una superficie concreta
