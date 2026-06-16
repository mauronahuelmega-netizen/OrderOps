# Order Modal Phase 2K — Customer / Delivery Info Card Cleanup

## Objetivo

Rebalancear la card de cliente/entrega en el modal workstation: grid equilibrado, dirección con label visible, sin link de detalle redundante — sin cambiar lógica ni datos.

Referencias: Phase 2A–2J, `docs/order-modal-audit.md`.

## Archivos modificados

- `components/admin/orders/order-customer-delivery-info.tsx`
- `components/admin/orders/order-workspace-overview.tsx`
- `components/admin/orders/order-workspace-overview.module.css`

## Archivos creados

- `docs/order-modal-phase-2k.md`

## Cambio principal aplicado

Reordenamiento de campos en `OrderCustomerDeliveryInfo` y eliminación del footer “Ver detalle completo” en `variant="workstation"`.

## Antes

```txt
Left: tipo entrega, teléfono, dirección sin label
Right: cliente
Footer: Ver detalle completo
```

Grid desbalanceado: tipo/teléfono a la izquierda, cliente a la derecha, dirección como párrafo suelto.

## Después

```txt
Cliente | Tipo de entrega
Teléfono | Dirección, si aplica
Sin link de detalle en workstation
```

## Campos reordenados

| Posición | Campo |
|----------|-------|
| Fila 1, col 1 | Cliente |
| Fila 1, col 2 | Tipo de entrega |
| Fila 2, col 1 | Teléfono |
| Fila 2, col 2 | Dirección (solo si `delivery` + address trim) |

Fallback teléfono: `Sin telefono` (sin cambios).

## Link eliminado

- “Ver detalle completo” removido del branch workstation en `OrderCustomerDeliveryInfo`.
- Props `detailHref` / `onDetailNavigation` eliminadas de `OrderCustomerDeliveryInfo` (solo lo usaba workstation).
- `OrderWorkspaceOverview` conserva `detailHref` para variants `modal` / `page` (link en header modal intacto).

## Qué se preservó

- Condición dirección: `order.delivery_method === "delivery" ? order.address : null`
- Formatters (`formatAdminDeliveryMethod`, etc.)
- Variants `modal` y `page` con link detalle donde existía
- Props públicas de `OrderWorkspaceOverview` (`detailHref`, `dashboardHref`)
- Card container workstation (border, padding, tokens)
- Resto del modal sin cambios

## Qué NO se tocó

- hydration/cache
- server actions
- optimistic callbacks
- realtime
- DB
- status/assignment logic
- WhatsApp logic
- risk/timeline logic
- productos
- notas
- layout general del modal (grid 54/46)
- mobile/tablet redesign
- `admin-order-workspace-modal.tsx`

## Ajustes CSS realizados

- Workstation card: `gap: 0` (sin footer link).
- Context grid workstation: 2 columnas fijas, `gap: 0.625rem 1rem`.
- Labels workstation: secondary, sentence case, 0.68rem.
- Values: 0.84rem, `word-break` en celdas existente.

## Validaciones ejecutadas

- `npx tsc --noEmit` — ✅ exit 0
- `npm run lint` — ⚠️ ESLint no configurado; Next.js abre setup interactivo
- `npm run build` — ✅ exit 0, compiled successfully

## QA manual recomendado

1. `/admin/dashboard` → pedido delivery: Cliente | Tipo arriba; Teléfono | Dirección abajo.
2. Dirección con label “Dirección”.
3. Sin “Ver detalle completo” en workstation.
4. Pedido pickup/retiro: sin celda dirección vacía.
5. Productos, timeline, acciones, riesgo sin cambios.
6. `/admin/orders/[id]` (modal/page variants): links detalle preservados si aplican.

## Próxima fase recomendada

**Phase 3 — Mobile/tablet layout redesign** del modal workstation.
