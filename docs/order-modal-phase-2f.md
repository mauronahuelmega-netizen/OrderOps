# Order Modal Phase 2F — Desktop Premium Polish Pass

## Objetivo

Cerrar la calidad percibida del modal desktop con polish visual transversal (densidad, scroll, tipografía, botones, superficies) sin cambiar lógica operacional.

Referencias: Phase 1A–2E, `docs/order-modal-audit.md`.

## Archivos modificados

- `components/admin/orders/admin-order-modal.module.css`
- `components/admin/orders/order-items.module.css`
- `components/admin/orders/order-workspace-overview.module.css`
- `components/admin/orders/order-customer-delivery-info.tsx`
- `components/admin/orders/order-recommended-action-panel.module.css`
- `components/admin/orders/status-form.module.css`
- `components/admin/orders/order-detail-surfaces.module.css`
- `components/admin/orders/order-workspace.module.css`
- `components/admin/orders/order-risk-panel.module.css`
- `components/admin/orders/order-human-timeline.module.css`

## Archivos creados

- `docs/order-modal-phase-2f.md`

## Cambio principal aplicado

Pass de polish CSS desktop sobre columnas izquierda (ticket) y derecha (consola), corrigiendo wrap de status, scrollbar, jerarquía tipográfica y peso visual de comunicación/riesgo/timeline.

## Problemas atacados

- Botón "Guardar estado" wrap en command column
- Scrollbar derecha/izquierda demasiado visible
- Columna izquierda vacía/pobre
- WhatsApp naranja demasiado dominante
- Quick actions duras/pequeñas
- Exceso uppercase/bold en headings
- Risk/timeline poco integrados
- Link "Ver detalle completo" flotante

## Fixes aplicados

| Área | Fix |
|------|-----|
| Status form | Stack vertical en workstation ≥1024px; `white-space: nowrap` en botón |
| Scrollbar | Thin scrollbar local en `executionColumn` / `commandColumn` |
| Productos | Filas dense con surface suave; total en card compacta |
| Overview | Ficha con border/radius/background; labels sin uppercase agresivo; link alineado derecha con separador |
| Recommended | Padding/border/tonos más suaves en modal |
| WhatsApp | Altura/font reducidas (`toolButtonPrimary`) |
| Quick actions | Peso visual reducido (`toolButtonSecondary`) |
| Headings | Títulos de grupos más muted (control/comunicación/actividad) |
| Risk | Fondos/bordes menos intensos; chips más livianos; margen superior |
| Timeline | Título muted; copy menos bold; spacing compacto |

## Qué se preservó

- Toda la lógica operacional y handlers
- Textos de botones y labels (salvo casing visual via CSS en overview fields)
- Orden de secciones en command column
- Destino y behavior de link detalle
- Risk assessment, timeline events, max 5 compact

## Qué NO se tocó

- hydration/cache / `useOrderWorkspaceHydration`
- optimistic callbacks / workspace route / server actions / realtime / DB
- status logic / assignment logic
- WhatsApp builders/templates/URLs
- clipboard/share/maps/tel logic
- `lib/orders/risk-detection.ts` / `lib/orders/events.shared.ts`
- risk scoring/signals / timeline builders/events/order
- products logic / notes logic
- responsive/mobile redesign

## Ajustes CSS realizados

Principalmente CSS modules listados arriba + wrapper presentacional mínimo para link detalle en `order-customer-delivery-info.tsx`.

## Desktop QA notes

Validar en viewport ≥1024px (1366–1920): balance izquierda/derecha, botón status, scrollbar sutil, jerarquía WhatsApp vs recommended.

## Deuda técnica restante

- Mobile/tablet redesign (Phase 3)
- Iconografía en quick actions / timeline
- "Ver historial completo" más prominente si se desea
- Analytics/event tracking
- Unified alert/badge system global
- Posible refinamiento de color WhatsApp con token dedicado

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | ✅ Sin errores (post-build) |
| `npm run lint` | ⚠️ ESLint no configurado — `npx next lint` abre setup interactivo (Next build linting pasa en `npm run build`) |
| `npm run build` | ✅ Compilación exitosa tras limpiar `.next` y `node_modules/.cache` |

## QA manual recomendado

Checklist desktop 1366px+ según spec Phase 2F (status, scroll, productos, overview, recommended, WhatsApp, quick actions, risk, timeline, acciones operativas).

## Próxima fase recomendada

**Phase 3 — Mobile/tablet layout** para la consola del modal.
