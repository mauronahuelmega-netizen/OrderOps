# Order Modal Phase 2D — Communication Hierarchy

## Objetivo

Jerarquizar visualmente `OrderExternalActions` separando template de mensaje, acción principal WhatsApp y acciones rápidas secundarias, sin cambiar handlers, builders ni lógica.

Referencias: Phase 1A–2C.2, `docs/order-modal-audit.md`.

## Archivos creados

- `docs/order-modal-phase-2d.md`

## Archivos modificados

- `components/admin/orders/order-external-actions.tsx`
- `components/admin/orders/order-detail-surfaces.module.css`

## Cambio principal aplicado

Reorganización interna de `OrderExternalActions` en tres sub-bloques: selector WhatsApp → botón principal full-width → grid de acciones rápidas con heading.

## Antes

```txt
OrderExternalActions:
- Template selector + WhatsApp en fila (desktop)
- Utility actions con peso visual similar en toolGrid
```

## Después

```txt
OrderExternalActions:
- Message template (select)
- Primary WhatsApp action (accent, full width)
- Secondary quick actions (heading + grid 2 columnas)
```

## Jerarquía creada

1. **Mensaje / template** — label `WhatsApp` + `<select>` (sin cambio de label)
2. **Acción principal** — `Abrir WhatsApp` (`variant="accent"`, ancho completo, mayor altura)
3. **Acciones rápidas** — heading `Acciones rápidas` + grid: copiar teléfono, llamar, copiar dirección, Maps, resumen, compartir

## Qué se preservó

- Props: `{ order }`
- Handlers: `copyValue`, `handleShareOrder`
- Builders: `buildAdminOrderWhatsappUrl`, `buildOrderCallUrl`, `buildOrderMapsUrl`, `buildOrderContactSummary`
- Templates: `getWhatsappTemplatesForOrder`, state `selectedTemplate`
- Condiciones de visibilidad (teléfono, dirección, share)
- Textos de botones existentes
- `target="_blank"`, `rel="noreferrer"`, toast messages

## Qué NO se tocó

- WhatsApp message builders / templates / URL generation
- phone normalization
- clipboard/share/maps/tel helpers (`lib/browser/client-actions.ts`, `lib/whatsapp/admin.ts`)
- toast behavior
- status / assignment logic
- optimistic callbacks
- hydration/cache / workspace route / server actions / realtime / DB
- risk / timeline
- products / notes / overview
- recommended action panel
- operational controls grouping (`OrderActionsSection`)
- `order-actions-section.tsx`

## Ajustes CSS realizados

En `order-detail-surfaces.module.css`:

- `.messageBlock`, `.primaryCommunication`, `.quickActions`, `.quickActionsTitle`, `.quickActionsGrid`
- `.toolButtonPrimary` — mayor altura y font-size
- `.toolButtonSecondary` — peso visual reducido para quick actions
- Eliminado layout side-by-side select+WhatsApp en ≥720px
- Eliminado grid 3 columnas en toolGrid desktop (quick actions quedan 2 columnas)

Sin tokens globales ni bordes adicionales (evita caja dentro de caja).

## Compatibilidad con variants

`OrderExternalActions` no tiene prop `variant`. La jerarquía aplica globalmente donde se usa (modal workstation y page detail vía `OrderWorkspace`). Misma API, mismo comportamiento; solo layout interno.

## Confirmación de comportamiento preservado

- Misma lógica de URL WhatsApp según template seleccionado
- Mismos handlers y condiciones de render
- Agrupación Comunicación de Phase 2C.2 intacta (wrapper externo sin cambios)

## Deuda técnica restante

- Color/token WhatsApp puede revisarse en polish visual futuro
- Quick actions podrían recibir iconos en fase posterior
- Mobile/tablet puede necesitar ajuste específico del grid
- Sin analytics/event tracking en communication block
- Risk/timeline sin polish premium

## Validaciones ejecutadas

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | ✅ Sin errores |
| `npm run lint` | ⚠️ ESLint no configurado — `npx next lint` abre setup interactivo (Next build linting pasa en `npm run build`) |
| `npm run build` | ✅ Compilación exitosa (Next.js 15.3.0) |

## QA manual recomendado

1. Pedido con teléfono + delivery: template → WhatsApp destacado → quick actions
2. Cambiar template y abrir WhatsApp (mismo mensaje/URL)
3. Copiar teléfono, llamar, dirección, Maps, resumen, compartir
4. Sin teléfono / sin dirección: botones ocultos según reglas
5. Status, assignment, recommended, risk, timeline sin regresión
6. `/admin/orders/[id]` si aplica

## Próxima fase recomendada

**Phase 2E — Risk/Timeline polish** o **Phase 3 — Mobile/tablet layout** según prioridad de producto.
