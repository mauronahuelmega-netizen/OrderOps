# Order Modal Phase 2C.2 — Operational Controls Grouping

## Objetivo

Agrupar visualmente los controles de `OrderActionsSection` en la consola operativa del modal workstation, separando control operativo (estado/responsable) de comunicación (WhatsApp/acciones externas), sin cambiar comportamiento ni lógica.

Referencias: Phase 1A–2C.1, `docs/order-modal-audit.md`.

## Archivos creados

- `docs/order-modal-phase-2c-2.md`

## Archivos modificados

- `components/admin/orders/order-actions-section.tsx`
- `components/admin/orders/order-workspace.module.css`

## Cambio principal aplicado

En `variant="workstation"`, `OrderActionsSection` envuelve controles existentes en dos secciones con heading y descripción: **Control operativo** y **Comunicación**.

## Antes

```txt
OrderActionsSection:
- StatusForm
- OrderAssignmentControls
- OrderExternalActions
```

## Después

```txt
OrderActionsSection (workstation):
- Control operativo
  - StatusForm
  - OrderAssignmentControls
- Comunicación
  - OrderExternalActions
```

## Grupos creados

| Grupo | Contenido | Textos |
|-------|-----------|--------|
| Control operativo | `StatusForm` + `OrderAssignmentControls` | "Actualizá estado y responsable del pedido." |
| Comunicación | `OrderExternalActions` | "Contactá al cliente y usá accesos rápidos." |

## Qué se preservó

- API pública de `OrderActionsSection` (props, callbacks, variant)
- Orden funcional: estado → responsable → acciones externas
- `StatusForm`, `OrderAssignmentControls`, `OrderExternalActions` sin cambios
- Permisos, optimistic handlers, `variant="modal"` en StatusForm para workstation

## Qué NO se tocó

- hydration/cache / `useOrderWorkspaceHydration`
- recommended action logic / `OrderRecommendedActionPanel`
- optimistic callbacks (signatures y handlers)
- workspace route / server actions / realtime / DB
- status logic / assignment logic / WhatsApp logic
- clipboard/share/maps/tel logic
- risk logic / timeline rendering
- products list logic / notes logic / overview/customer delivery
- `admin-order-workspace-modal.tsx`
- variants `default` / `modal` / `page` (layout Card plano sin grouping)

## Ajustes CSS realizados

En `order-workspace.module.css`:

- `.admin-actions-group` — stack con gap compacto
- `.admin-actions-group + .admin-actions-group` — separador `border-top` entre grupos
- `.admin-actions-group__title` / `__description` / `__body` — tipografía tokenizada
- `.admin-detail-panel--actions-workstation` — `gap: 0` (spacing delegado a grupos)

Sin border/surface pesada por grupo (evita caja dentro de caja). Sin cambios de paleta global.

## Compatibilidad con variants

| Variant | Comportamiento |
|---------|----------------|
| `workstation` | Grouping Control operativo + Comunicación |
| `default` / `modal` / `page` | Sin cambios — Card + header "Acciones" + lista plana |

`/admin/orders/[id]` usa `OrderWorkspace variant="page"` — no afectado.

## Confirmación de comportamiento preservado

- Mismos componentes hijos con mismas props
- Recommended panel sigue arriba en modal (sin cambios)
- Risk/timeline/productos/notas/overview sin cambios

## Deuda técnica restante

- Recommended panel sigue orientativo, no mutante
- WhatsApp/quick actions sin jerarquía premium (Phase 2D)
- Status form sigue selector + guardar
- Assignment mantiene UI actual
- Risk/timeline sin polish premium
- Mobile/tablet no rediseñado
- Posible compactación futura del grupo operativo

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | ✅ Sin errores |
| `npm run lint` | ⚠️ ESLint no configurado — `npx next lint` abre setup interactivo (Next build linting pasa en `npm run build`) |
| `npm run build` | ✅ Compilación exitosa (Next.js 15.3.0) |

## QA manual recomendado

1. Modal: orden Acción recomendada → Control operativo → Comunicación → Riesgo → Historial
2. Status, assignment, WhatsApp, tel/maps/share sin regresión
3. Optimistic + recommended panel actualiza mensaje
4. `/admin/orders/[id]` sin cambios visuales en acciones

## Próxima fase recomendada

**Phase 2D — Communication hierarchy** (jerarquía WhatsApp/quick actions premium).
