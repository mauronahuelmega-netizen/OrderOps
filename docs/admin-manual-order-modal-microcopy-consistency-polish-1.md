# Status

**PASS** — 2026-09-08. Sólo copy estático propiedad de OrderOps. Un único archivo runtime
(`manual-order-modal.tsx`), 6 strings. Sin CSS, sin handlers, sin condiciones, sin dominio.
0 pedidos creados.

# Copy changed

| Antes | Ahora | Motivo |
|-------|-------|--------|
| `Tocá + para configurar opciones antes de agregar.` | `Configurá las opciones antes de agregarlo.` | Era la única línea device-specific del modal y nombraba un glifo (`+`). Ahora sirve igual para touch, mouse y teclado. |
| `Usá el catálogo hasta habilitar el selector manual.` | `Todavía no se puede agregar a un pedido manual.` | "Selector manual" es jerga interna y "catálogo" no le dice al operador qué hacer. |
| `Ticket en construcción` | `Resumen del pedido` | La interfaz usa **Pedido** como término principal; "Ticket" competía con el heading `Pedido` que está justo encima. |
| `Pedido vacío` | `Todavía no agregaste productos` | Describe el estado en lugar de etiquetarlo, y evita leerse como un error. |
| `Agregá productos desde el catálogo para armar el pedido.` | `Agregá productos para armar el pedido.` | Dentro de este modal admin "desde el catálogo" no aporta información operativa. |
| `Hay un adicional sin producto principal. Revisá el ticket.` | `...Revisá el pedido.` | Último resto de "Ticket" visible. |

Accessible label corregido:

| Antes | Ahora |
|-------|-------|
| `` `Cerrar ${shellTitle.toLowerCase()}` `` → "Cerrar configurar milanesa" | `` `Cerrar configuración de ${configureProduct.name}` `` |

# Copy intentionally preserved

**Los dos labels de cierre quedan sin cambios** (decisión A del usuario): el botón visible sigue
siendo `Cerrar nuevo pedido manual` y el overlay `Salir del pedido manual`. Ya son gramaticales,
**distintos entre sí** y parte del contrato cerrado en `ACCESSIBILITY-INTERACTION-POLISH-1`.
Unificarlos en `Cerrar pedido manual` habría dado un mismo nombre accesible a dos controles
distintos — exactamente el defecto que la fase anterior cerró — y habría requerido tocar 2
assertions de su verify. No se hizo verify surgery.

**`Requiere personalización` queda deferido.** El texto real del badge no vive en el modal: sale de
`MANUAL_ORDER_CUSTOMIZATION_UNAVAILABLE_REASON` en
`lib/orders/manual-order-customization-eligibility.ts`, fijado por
`manual-order-customization-safety.verify.ts`. El literal del modal es sólo el fallback del `??`.
Renombrar únicamente el fallback dejaría **dos textos de badge distintos según el code path**, y
renombrar la constante es un archivo de dominio fuera del scope de esta microfase. Esa es la
convención explícita que §5 pedía respetar.

**`Opcional · máx. 5 opciones` queda deferido.** Lo genera `formatQuantityGroupMeta` en
`lib/product-customization/selection-v2.ts`, **compartido con el checkout público**
(`components/public/catalog/customization-modal.tsx`). Acortarlo a `hasta 5` cambiaría el copy del
catálogo público, prohibido en esta fase.

Sin tocar, ya correctos: `Nuevo pedido` · `Cargá un pedido tomado manualmente.` ·
`Pedido manual` · `Productos` · `Seleccioná productos para armar el pedido.` ·
`Buscar producto...` · `Pedido` · `Notas del pedido` / `Opcional` · `Total estimado` ·
`El total final se valida al crear el pedido.` · `Precio base` · `Cantidad` · `Adicional`
(`UPSELL_ASSOCIATED_LABEL`, compartido con workspace/checkout) · `Sin costo` · `Obligatorio`.

CTA compose (`Agregá productos` / `Completá los datos obligatorios` / `Crear pedido · $ X` /
`Creando pedido...`) y CTA configurador (`Completá las opciones` / `Agregar · $ X` / `Volver`):
**verbatim**, precedencia incluida.

Contenido del negocio (nombres de producto, categoría, grupos, descripciones, opciones, notas,
datos del cliente): **intacto**.

# Checks

| Check | Resultado |
|-------|-----------|
| `admin-manual-order-modal-microcopy-consistency.verify.ts` | PASS |
| `npx tsc --noEmit` | PASS |
| `git diff --check` | PASS |
| Verifies históricos | NO EJECUTADOS (por instrucción) |
| build / lint / browser QA | NO EJECUTADOS (por instrucción) |

Sin smoke de browser: de los 6 strings, 5 son **más cortos** que los que reemplazan; el único más
largo (`Todavía no agregaste productos`) vive en `.manual-order-modal__ticket-empty`, un
`display: grid` de alto automático, centrado, sin `white-space: nowrap`, sin `line-clamp` y sin
`overflow: hidden` — puede envolver sin recortarse. Ningún string nuevo entra en un botón ni en el
header.

El verify nuevo es chico y basado en intención, no un snapshot del texto: prohíbe wording
device-specific, fija los dos contratos de CTA con su precedencia, prohíbe jerga técnica en copy
visible (inspeccionando sólo strings y texto JSX, no identificadores), exige `pedido` en lugar de
`ticket`, y re-fija las condiciones funcionales y los invariantes de foco de la fase anterior.

# Remaining debt

- `Requiere personalización` → `Requiere configuración`: requiere tocar la constante de dominio y su verify.
- `Opcional · máx. N opciones` → `hasta N`: requiere tocar el helper compartido con el catálogo público.
- QA autenticada en producción.
- Final visual QA completa.
- El overlay del shell sigue siendo un `button` full-screen y encabeza el tab order.

# Next

`ADMIN-MANUAL-ORDER-MODAL-FINAL-VISUAL-QA-1` — ahí se reconcilian `ORDEROPS_LIVING_MEMORY.md` y
`docs/admin-dashboard-forensic-living-audit.md`.

No commit. No push. No deploy.
