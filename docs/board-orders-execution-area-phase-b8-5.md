# Board / Orders Execution Area — Phase B8.5 — Board Search Scope Cleanup & Criteria Audit

## Objetivo

Limpiar la UX de búsqueda del Board y congelar criterios explícitos (nombre, teléfono, número de pedido) antes de B9.

## Contexto

- **B8.4** preservó kanban persistente con búsqueda search-aware.
- La búsqueda operacional venía de `natural-search.ts` con parser de lenguaje natural (estado, delivery, riesgo, chips visuales).
- El chip debajo del input (`Cliente: 226`) empujaba el kanban y sugería criterios más complejos de los necesarios.

## Problema detectado

El search summary/chip debajo del input ("Cliente: ...") no aportaba valor, empujaba el kanban hacia abajo y hacía parecer que la búsqueda tenía criterios visibles más complejos de los necesarios.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `lib/orders/natural-search.ts` | Parser simplificado; match acotado a nombre/teléfono/número; nuevos constants placeholder |
| `lib/orders/dashboard-board-view-model.ts` | Search apply sin risk analytics; `hasSearchQuery` incluye dígitos |
| `components/admin/orders/operational-search.tsx` | Eliminado render de chips; placeholder/aria nuevos |
| `components/admin/orders/operational-search.module.css` | Eliminados estilos chips; layout sin gap reservado |
| `components/admin/orders/DashboardToolbar.tsx` | Removido `searchChips`; placeholder/aria desde `natural-search` |
| `components/admin/orders/admin-dashboard-orders.tsx` | Removido prop `searchChips`; `searchActive` con dígitos |

## Archivos creados

| Archivo | Rol |
|---------|-----|
| `docs/board-orders-execution-area-phase-b8-5.md` | Este documento |

## Cambios aplicados

1. Eliminado bloque visual de chips/facets bajo el input.
2. Placeholder y aria-label actualizados.
3. `parseOperationalSearch` simplificado (`raw`, `normalized`, `normalizedDigits`; `chips` siempre `[]`).
4. `matchesOperationalSearch` acotado a tres criterios.
5. `applyOperationalSearch` ya no construye risk assessments para search.

## Search token removal

- Removido render condicional de `.admin-orders-search__chips` en `operational-search.tsx`.
- Eliminadas clases CSS asociadas; contenedor pasa de `grid` con gap a `block` sin espacio reservado.

## Search placeholder update

| Antes | Después |
|-------|---------|
| Buscar por cliente, estado o situación... | Buscar por nombre, teléfono o número de pedido... |

Constants: `BOARD_OPERATIONAL_SEARCH_PLACEHOLDER`, `BOARD_OPERATIONAL_SEARCH_ARIA_LABEL` en `natural-search.ts`.

## Search criteria audit

| Criterio actual (pre-B8.5) | Campo(s) | Se mantiene B8.5 | Motivo |
|----------------------------|----------|------------------|--------|
| Cliente nombre | `customer_name`, `customer_short_name`, `item_summary`, `notes_preview` | Sí (solo nombre) | criterio objetivo |
| Teléfono | — (no explícito) | Sí | criterio objetivo |
| Número pedido | — (no explícito) | Sí | criterio objetivo |
| Estado | `order.status` + términos NL | No | ya lo resuelve el board |
| Delivery/retiro | `order.delivery_method` | No | no forma parte de búsqueda simple |
| Riesgo/situación | `assessOrderRisk` | No | evita falsos positivos |
| Ticket alto / asignación / recientes | varios | No | fuera de scope B8.5 |
| Productos/items | `item_summary` | No | fuera de scope B8.5 |
| Notas | `notes_preview` | No | diferido |

## Accepted search criteria

- customer name (`customer_name`, `customer_short_name`)
- customer phone (`phone`, dígitos normalizados, partial match)
- order number / order id field audited (ver abajo)

## Rejected / deferred search criteria

- status
- delivery/pickup
- risk/situation
- products/items
- notes
- address

Post-B9 expansion posible: **B8.6 / post-B9 — Product Search Expansion**.

## Order number field decision

No existe campo `order_number` en DB ni en `AdminOrderDashboardItem`.

**Campo usado:** referencia derivada de `order.id` (UUID), mismo criterio que el modal:

```ts
buildOrderDisplayRef(orderId) = orderId.replace(/-/g, "").slice(-4).toUpperCase()
```

- UI modal: `#AB12 - Cliente`
- Búsqueda matchea:
  - últimos 4 caracteres del UUID sin guiones (display ref)
  - substring parcial del UUID compacto (`id` sin guiones)
  - `#` en query ignorado para matching

**Limitación documentada:** no hay número secuencial humano (226); si el usuario busca "226" matcheará teléfono parcial o fragmento de UUID/display ref, no un `order_number` dedicado.

## Matching behavior

- **Nombre:** case-insensitive, acentos normalizados (NFD), partial match en `customer_name` + `customer_short_name`.
- **Teléfono:** solo dígitos; partial match en `phone` normalizado.
- **Número:** partial match en display ref y UUID compacto; `#` ignorado.

## Search-aware kanban compatibility

Sin cambios en B8.4:

- `activeFilter === "all"` + búsqueda → `renderMode = "kanban"`.
- Sin resultados → lanes "Sin resultados", context panel empty.
- Filtros específicos sin resultados → `filtered-empty`.

## Mobile / tablet behavior

Sin cambios estructurales B8.4/B7. El input ya no reserva fila de chips; kanban sube visualmente.

## Comportamiento preservado

- Kanban persistente B8.4.
- Search-aware empty lanes.
- Status workflow igual.
- Assignment behavior igual.
- Quick actions iguales.
- Realtime/hydration/optimistic igual.
- Manual sync igual.
- Toolbar session/sync igual.
- Top section/modal iguales.

## Qué NO se cambió

- realtime
- hydration
- optimistic callbacks
- server actions
- DB/Supabase
- route JSON
- top section
- modal/detail
- card data
- card UX B5/B8
- quick action behavior
- status/assignment logic
- image optimization / no-img-element

## Compatibilidad con B8.2/B8.3/B8.4

- B8.2 toolbar/filter safeguard: intacto.
- B8.4 search-aware kanban: intacto.
- B8.3 lane layout: intacto.

## Riesgos encontrados

- `DASHBOARD_EXECUTION_SEARCH_PLACEHOLDER` en `dashboard-execution-view-model.ts` quedó stale (board usa constants B8.5 vía toolbar).
- Búsqueda por display ref (4 chars) puede colisionar entre pedidos en edge cases raros.
- Sin `order_number` real, expectativa de número secuencial puede confundir operadores.

## Validaciones ejecutadas

- `npm run build`
- `npx tsc --noEmit`
- `npm run lint`

## QA manual recomendado

Ver checklist en prompt B8.5 (visual, nombre, teléfono, número, criterios rechazados, B8.4, sanity funcional).

**Estado:** pendiente (sin sesión local verificada).

## Deuda técnica restante

- Alinear constantes stale en `dashboard-execution-view-model.ts` (fuera de scope B8.5).
- Campo `order_number` humano requeriría DB/route — fase futura.
- 16 warnings `no-img-element` preexistentes.

## Próxima fase recomendada

**B9 — Final QA / Production Readiness**
