# Order Modal Phase 2C.1 — Recommended Action Panel

## Objetivo

Agregar un bloque orientativo en la columna derecha del modal workstation que indique al operador cuál es la acción recomendada según status, responsable y permisos — sin mutaciones ni cambios de lógica operacional.

Referencias: Phase 1A–2B, `docs/order-modal-audit.md`.

## Archivos creados

- `components/admin/orders/order-recommended-action-panel.tsx`
- `components/admin/orders/order-recommended-action-panel.module.css`
- `docs/order-modal-phase-2c-1.md`

## Archivos modificados

- `components/admin/orders/admin-order-workspace-modal.tsx`
- `components/admin/orders/admin-order-modal.module.css`

## Cambio principal aplicado

`OrderRecommendedActionPanel` se renderiza arriba de `OrderActionsSection` en `commandColumn`, guiando la operación sin reemplazar controles existentes.

## Reglas de recomendación

| Condición | Título | Tono |
|-----------|--------|------|
| `canUpdateOrders === false` | Modo lectura | neutral |
| `status === "cancelled"` | Pedido cancelado | neutral |
| `status === "completed"` | Pedido completado | success |
| `pending` sin `assignedTo` | Tomá el pedido | primary |
| `pending` con responsable | Prepará el pedido | warning |
| `preparing` | Marcá cuando esté listo | primary |
| `ready` | Cerrá la operación | primary |

Helper puro: `buildRecommendedOrderAction()` en el mismo archivo del componente.

## Qué hace el panel

- Muestra eyebrow, título, descripción y hint opcional según contexto
- Cambia mensaje cuando cambian `status`, `assignedTo` o `canUpdateOrders` (vía props de `displayOrder`)
- Usa surface destacada con tono tokenizado (preparing/pending/ready/neutral)

## Qué NO hace el panel

- No muta estado
- No toma/libera pedido
- No llama server actions
- No dispara optimistic callbacks
- No abre WhatsApp
- No copia datos
- No cambia URL
- No cierra modal
- No incluye botones funcionales (solo texto hint)

## Integración en command column

```txt
OrderRecommendedActionPanel
OrderActionsSection
OrderRiskPanel
OrderHumanTimeline
```

## Ajustes CSS realizados

- `order-recommended-action-panel.module.css`: tipografía (eyebrow, title, description, hint)
- `admin-order-modal.module.css`: excepción al strip de `commandColumn > *` para `:global(.order-recommended-action-panel)` y variantes de tono con tokens existentes

## Confirmación de comportamiento preservado

- `OrderActionsSection`, `StatusForm`, assignment, WhatsApp sin cambios
- Risk, timeline, productos, notas, overview sin cambios
- Panel reacciona a optimistic updates porque recibe `displayOrder.status` y `assigned_to` del modal

## Qué NO se tocó

- hydration/cache / `useOrderWorkspaceHydration`
- optimistic callbacks (signatures y handlers)
- workspace route / server actions / realtime / DB
- status logic / assignment logic / WhatsApp logic
- risk logic / timeline rendering
- products list logic / notes logic
- overview/customer delivery
- page/modal variants
- texts fuera del nuevo panel

## Deuda técnica restante

- Panel orientativo, no mutante
- Status/assignment siguen en `OrderActionsSection`
- WhatsApp/quick actions sin jerarquía premium
- Risk/timeline sin polish premium
- Mobile/tablet no rediseñado
- `currentUserId` reservado para reglas futuras (ej. “ya lo tenés asignado”)
- Posible Phase 2C.2: agrupar status/responsable debajo del panel
- Posible Phase 2D: jerarquía WhatsApp/quick actions

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | ✅ Sin errores |
| `npm run lint` | ⚠️ ESLint no configurado — `npx next lint` abre setup interactivo (Next build linting pasa en `npm run build`) |
| `npm run build` | ✅ Compilación exitosa (Next.js 15.3.0) |

## QA manual recomendado

1. Pedido pendiente sin responsable → “Tomá el pedido” + hint botón debajo
2. Pendiente con responsable → “Prepará el pedido”
3. Preparando / listo / completado / cancelado → mensajes correspondientes
4. Sin permisos → “Modo lectura”
5. Cambiar status / tomar pedido → panel actualiza mensaje
6. Acciones, WhatsApp, risk, timeline sin regresión

## Próxima fase recomendada

**Phase 2C.2 — Operational controls grouping** bajo el recommended panel, o **Phase 2D — WhatsApp/quick actions hierarchy**.
