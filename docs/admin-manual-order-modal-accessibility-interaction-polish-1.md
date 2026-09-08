# ADMIN-MANUAL-ORDER-MODAL-ACCESSIBILITY-INTERACTION-POLISH-1

## Status

**PASS** — 2026-09-08. Tap-target y focus-containment debt cerrada. Sin cambios de lógica,
validación, pricing, dominio, payload, servidor ni DB. 0 pedidos creados.

## Files changed

Runtime:

- `components/admin/orders/manual-order-modal.tsx` — focus containment, captura/restauración del opener, props de accesibilidad al shell.
- `components/admin/orders/manual-order-modal.module.css` — targets 44px, focus-visible de compose, clase local del close, compensación de densidad.
- `components/admin/orders/manual-order-customization-panel.module.css` — stepper del configurador 44×44.
- `components/admin/orders/admin-order-modal-shell.tsx` — **4 props opcionales con default**: `dialogRef`, `closeLabel`, `overlayLabel`, `closeClassName`. Ningún cambio de comportamiento por defecto; `admin-order-workspace-modal.tsx` no pasa ninguna y queda intacto (fijado por el verify).

Shell CSS, `globals.css`, `theme-tokens.css`, `Button`/`Input`/`Card`, dominio, server y DB: **sin cambios**.

Verify: `lib/orders/admin-manual-order-modal-accessibility-interaction-polish.verify.ts`.

## Implemented

**Tap targets** — medidos en runtime a 390: add `44×44`, ticket stepper `44×44`, `Quitar` `44` alto,
stepper del configurador `44×44`, segmented `44×88` (ambas opciones), search `44` alto,
close `44×44`. Los glifos conservan su tamaño original (el verify lo fija).

**Densidad** — la product row conserva su `min-height: 52px`; el padding vertical bajó 8→6px y, en
`@media (max-width: 639px)` (donde price y add se apilan en la misma columna), el `row-gap` bajó a
2px. Alturas medidas a 390: 76–78px, frente a ~74–76px antes. El close de 44px vive en una clase
local pasada por `closeClassName`, así que el workspace modal no se mueve.

**Focus containment** — listener de `keydown` sobre el nodo `[role="dialog"]` real, obtenido por
`dialogRef`. No hay listener global, no se consulta el documento entero, no se muta `tabindex` de
ningún nodo, no hay sentinels ni timers. La lista de focusables se recalcula en cada pulsación, así
que el CTA deshabilitado y la subvista no montada quedan fuera solos. Verificado por evento real:
Tab desde el último → `preventDefault` + foco al primero; Shift+Tab desde el primero →
`preventDefault` + foco al último; el foco nunca sale del diálogo.

**Initial focus** — se conserva el del shell (botón de cerrar). No se agregó autofocus.

**Return focus** — el opener se captura en un *layout effect*, porque el shell mueve el foco en un
passive effect y los passive effects corren de hijo a padre: sólo un layout effect del padre alcanza
a ver el trigger del dashboard. Al cerrar se restaura si sigue conectado. Verificado: abrir con el
trigger enfocado → Escape → el foco vuelve a `Crear nuevo pedido manual`.

**Escape** — intacto, sigue siendo del shell. Verificado cerrando desde el modal.

**Close semantics** — el shell nombraba `Cerrar detalle del pedido` en **el overlay y el botón a la
vez** (nombre accesible duplicado e incorrecto para este modal). Ahora el modal pasa
`closeLabel="Cerrar nuevo pedido manual"` (o `Cerrar configurar {producto}` en el configurador) y
`overlayLabel="Salir del pedido manual"`. Los defaults del shell preservan los nombres previos.

**Focus-visible en compose** — agregado a `__quantity-button` y al segmented vía
`:has(input:focus-visible)` (el radio está visualmente oculto pero sigue siendo parada de teclado).
Ya existía en add, `Quitar` y search; el del configurador se conserva. Sin `:focus` genérico y sin
`outline: none` sin reemplazo (el verify lo fija). Selected sigue en la familia accent y el foco en
`--focus`, así que permanecen distinguibles.

**Tab order** — sigue el orden visual, sin `tabindex` positivo: overlay → cerrar → nombre → teléfono
→ Retiro/Delivery → buscar → acciones de producto → stepper/Quitar del ticket → notas → Cancelar.

## Checks

| Check | Resultado |
|-------|-----------|
| `admin-manual-order-modal-accessibility-interaction-polish.verify.ts` | PASS |
| `admin-manual-order-modal-surface-materiality-polish.verify.ts` | PASS |
| `admin-manual-order-modal-ticket-summary-hierarchy-polish.verify.ts` | PASS |
| `admin-manual-order-modal-configurator-context-polish.verify.ts` | PASS |
| `npx tsc --noEmit` | PASS |
| `git diff --check` | PASS |
| `npm run build` / `npm run lint` | NO EJECUTADOS (por instrucción) |

Smoke: 390 (targets) + 900 (teclado). Pedidos creados: **0**.

Excepción de scope autorizada por el usuario: se actualizaron **2 assertions stale** de fases
previas conservando su intención protectora — el verify del ticket pasó de fijar el stepper en
`28×28` a exigir `>=44px`, y el del configurador cambió la prohibición global de `useLayoutEffect`
por un guard dirigido (la entrada de scroll sigue siendo un `useEffect` plano y ningún layout effect
toca `scrollTop`).

Nota de método: `browser_press_key` no reproduce la navegación por Tab de forma fiable en este
entorno — devolvía siempre el botón de cerrar. La evidencia válida vino de despachar `keydown` real
y leer `defaultPrevented` + `document.activeElement`.

## Remaining debt

- Microcopy consistency.
- QA en producción con auth real.
- Final visual QA completa.
- El overlay del shell sigue siendo un `button` a pantalla completa y por eso es el primer elemento
  del tab order; se dejó como está para no cambiar el comportamiento del shell para el otro consumer.

## Next phase

`ADMIN-MANUAL-ORDER-MODAL-MICROCOPY-CONSISTENCY-POLISH-1` o, si no queda deuda de microcopy,
`ADMIN-MANUAL-ORDER-MODAL-FINAL-VISUAL-QA-1`.

No commit. No push. No deploy.
