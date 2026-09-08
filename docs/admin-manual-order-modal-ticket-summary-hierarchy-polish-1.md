# ADMIN-MANUAL-ORDER-MODAL-TICKET-SUMMARY-HIERARCHY-POLISH-1

Fecha: 2026-09-07
Modo: FAST MODE — feature-local visual / information hierarchy polish
Alcance runtime: `components/admin/orders/manual-order-modal.tsx` + `components/admin/orders/manual-order-modal.module.css`

---

## 1. Objective

Mejorar la legibilidad y jerarquía del bloque **PEDIDO / Ticket en construcción** cuando contiene
productos configurados. El contenido ya era correcto pero se leía como un párrafo continuo: producto
raíz, selecciones de Papas, Salsas, Agregados extra, deltas, `Adicional`, cantidad y `Quitar`
compartían el mismo peso visual.

Esta fase transforma esa información **ya existente** en una composición escaneable. No cambia el
modelo de ticket, no recalcula precios, no toca dominio/payload/servidor y no crea pedidos.

---

## 2. Findings addressed

| Hallazgo | Descripción | Resultado |
|----------|-------------|-----------|
| **P2-9** | Configured summary demasiado plano/denso | **CLOSED** — selecciones agrupadas por grupo con label propio y una fila por opción |
| **P2-10** | `Adicional` visualmente débil / poco diferenciado como child | **CLOSED** — micro-superficie anidada con indent, borde izquierdo y label `Adicional` |
| **P2-6** | Controles de cantidad / `Quitar` con poca jerarquía y proximidad | **CLOSED** — stepper agrupado por proximidad, `Quitar` empujado al borde opuesto |
| **P3-1** | Cantidades de extras poco claras dentro del resumen | **CLOSED** — `×N` explícito cuando la cantidad de la opción es > 1 |

---

## 3. Source structure used

Confirmado **antes** de implementar. No hizo falta parsear strings ni cambiar dominio.

`ManualOrderTicketLine` (`lib/orders/manual-order-customization-ticket.ts`) ya expone, por línea:

- `productName`, `quantity`, `unitPrice`, `lineTotal` — identidad y subtotal del padre.
- `customizationSnapshot: CustomizationSnapshotV2 | null` — snapshot estructurado del dominio.
- `selectedGroups: LocalCartSelectedGroup[] | null` — intención de selección para el submit.
- `parentClientLineId` + `kind` — relación padre → child de upsell.
- `displaySummary: string[]` — **presentation data**, sin autoridad de pricing.

La presentación nueva lee `customizationSnapshot.groups[]`, que ya trae exactamente lo que la UI
necesita: `group_name`, `sort_order` y por opción `option_name`, `quantity`, `sort_order` y
**`total_price_delta`** (el dominio ya calculó `priceDelta × quantity` en `buildCustomizationSnapshotV2`).

Consecuencias de esa elección:

- **Cero parsing de `displaySummary`**: no hay `split`, ni regex sobre `"Papas:"`, ni parseo de comas
  o de `(+$...)`.
- **Cero fórmula nueva**: el delta mostrado es `total_price_delta` tal cual. No se multiplica nada en
  render, así que no puede divergir del `unitPrice` del dominio.
- `displaySummary` se conserva como **fallback íntegro** para líneas sin snapshot (legacy/degradadas):
  se renderiza la entrada completa, nunca troceada.

Total estimado, subtotal de padre y subtotal de child siguen viniendo de
`getManualTicketEstimatedTotal` / `line.lineTotal` sin intervención de la UI.

---

## 4. Parent hierarchy

Helper de presentación nuevo, puro y local: `getManualTicketSummaryGroups(line)`. Sólo proyecta y
ordena (`sort_order`) los grupos y opciones del snapshot; filtra grupos sin opciones seleccionadas.

Fila raíz (`__summary-row-head`, sin cambios estructurales):

- **Izquierda**: `{quantity} × {productName}` — 0.86rem / 600, `--text-primary`.
- **Derecha**: `formatCurrency(line.lineTotal)` — `white-space: nowrap` + `font-variant-numeric: tabular-nums`.

El nombre pesa más que las selecciones (0.86rem/600 vs 0.76rem/400), el subtotal no envuelve, la
cantidad raíz vive en la identidad, no se duplica el subtotal en ningún otro punto de la fila y el
precio del `Adicional` **no** se suma al subtotal visual del padre (child mantiene su propio total).

---

## 5. Selection groups

Estructura nueva por grupo:

```
PAPAS
  Papas grandes                    +$ 1.500,00
SALSAS
  Mayonesa
  Mostaza
  BBQ                                +$ 250,00
  Big Mac                            +$ 250,00
AGREGADOS EXTRA
  Cheddar ×4                       +$ 2.000,00
  Bacon ×4                         +$ 4.000,00
```

- `__summary-group-label`: 0.66rem, 600, uppercase, `letter-spacing: 0.04em`, `--text-tertiary`.
- `__summary-options`: indent de 8px, una fila por opción.
- `__summary-option`: `grid-template-columns: minmax(0, 1fr) auto` con `column-gap: 10px`, así el
  precio tiene **columna propia** y el nombre puede envolver (`overflow-wrap: anywhere`) sin colisionar.
- `__summary-option-delta`: `nowrap` + tabular-nums; sólo se renderiza si `total_price_delta > 0`.

`Sin costo` se omite: una opción sin delta simplemente no muestra precio, que es menos ruidoso y no
introduce ambigüedad porque el grupo ya contextualiza la selección. Sin chips saturados ni azules —
la jerarquía es tipográfica y de espaciado, no de color, así que no compite con el CTA.

---

## 6. Qty extras

Cuando `option.quantity > 1` se renderiza `×{quantity}` en un `__summary-option-qty` con peso 650 y
`--text-primary`, pegado al nombre. La cantidad queda explícita (`Cheddar ×4`) en lugar de esconderse
detrás de un delta agregado.

El delta que acompaña es `total_price_delta` (el total de las 4 unidades: `+$ 2.000,00`), no el
unitario, y proviene del snapshot — **no** de una multiplicación hecha en render.

---

## 7. Adicional hierarchy

Los children `kind === "upsell"` con `parentClientLineId === line.clientLineId` (misma resolución que
antes) se agrupan ahora en un contenedor único `__summary-upsells`:

- `border-left: 2px` + `border-radius: 0 8px 8px 0` + `background` muy sutil
  (`color-mix(... --bg-surface-soft 45%, transparent)`) → micro-superficie anidada.
- Un único label `Adicional` (`UPSELL_ASSOCIATED_LABEL`) reutilizando `__summary-group-label`.
- Por child: `{productName} ×{quantity}` a la izquierda, `formatCurrency(child.lineTotal)` a la derecha,
  en la misma grilla de dos columnas que las opciones.

El label ya no se concatena dentro de la línea del producto (antes: `Adicional: Coca Cola 500ml ×1`),
lo que separa la etiqueta de relación de la identidad del child. No se muestra `parentClientLineId`,
ni `kind`, ni `item_kind`, ni copy técnico. El remove en cascada del padre sigue siendo el del dominio.

---

## 8. Controls

`__summary-actions`: fila `flex` con `justify-content: space-between`.

- El stepper (`- valor +`) queda en `__quantity-controls` con `gap` 6px → 4px, agrupado por proximidad
  como una sola unidad.
- `Quitar` sale de `__quantity-controls` y se va al borde opuesto, así no se lee como el botón que
  sigue al `+`.
- Handlers, `aria-label`s, `disabled={isSubmitting}` y semántica: **idénticos**.

**Tap targets sin tocar**: los botones del stepper siguen en 28×28. El rediseño de targets <44px
queda diferido a `ADMIN-MANUAL-ORDER-MODAL-ACCESSIBILITY-INTERACTION-POLISH-1`, y el verify lo fija
para que esta fase no lo adelante.

---

## 9. Runtime QA

Local autenticado, dev server en `:3000`. Caso de estrés: ticket con línea simple
(`1 × Coca Cola 500ml`) + `Doble Smash` configurado con Papas grandes, 4 salsas (Mayonesa, Mostaza,
BBQ, Big Mac), `Cheddar ×4`, `Bacon ×4` y `Adicional` Coca Cola 500ml. Total estimado `$ 26.500,00`.

| Caso | Viewport | Resultado |
|------|----------|-----------|
| A — línea simple | 390 light | PASS — `1 × Coca Cola 500ml` + `$ 3.000,00`, sin grupos vacíos, sin bloque `Adicional` |
| B — parent configurado | 390 light | PASS — identidad/subtotal separados de las selecciones |
| C — muchas selecciones | 390 light/dark | PASS — 4 grupos, 7 filas de opción, escaneables |
| D — qty extras | 390 light/dark | PASS — `Cheddar×4 +$ 2.000,00`, `Bacon×4 +$ 4.000,00` |
| E — Adicional | 390/412 | PASS — `hasUpsellSurface: true`, `Coca Cola 500ml×1 $ 3.000,00` con precio separado |
| F — cantidad raíz 1→2 | 390 light | PASS — `2 × Doble Smash` `$ 41.000,00`; child `×2` `$ 6.000,00`; total `$ 50.000,00`; grupos idénticos |
| G — 390 dark/light | 390 | PASS |
| H — 900 light | 900 | PASS — sin regresión P1-4 |

Geometría medida (390 light, 390 dark, 412 dark, 900 light):

- `docHorizontalScroll: false` en los cuatro viewports.
- Overlap texto/precio **0**: en cada fila de opción y de child, `aRight` < `bLeft` con gap constante
  de 10px y `sameLineOverlap: false`.
- `clipped: []` — ningún precio recortado (`scrollWidth <= clientWidth`).
- Controles sin colisión; footer `position: sticky` sin tapar el ticket.

Dark real verificado vía el toggle de admin (`html[data-dashboard-theme="dark"]`, body
`rgb(9,10,13)`) — **no** vía `prefers-color-scheme`, que esta app ignora. Estilos computados en dark:

| Elemento | Color | Tamaño / peso |
|----------|-------|---------------|
| Identidad del padre | `rgb(248,250,252)` | 13.76px / 600 |
| Subtotal del padre | `rgb(248,250,252)` | 13.44px / 650 |
| Label de grupo | `rgb(148,163,184)` | 10.56px / 600 |
| Nombre de opción | `rgb(203,213,225)` | 12.16px / 400 |
| Delta de opción | `rgb(203,213,225)` | 11.84px / 400 |
| Superficie `Adicional` | bg `srgb 0.125 0.129 0.149 / 0.45`, borde `/ 0.40` | padding `5px 7px 5px 8px` |

Identidad raíz dominante, labels legibles sin ser tenues, deltas legibles y alineados, `Adicional`
distinguible de los grupos de customización, total general dominante, sin paredes de texto ni exceso
de bordes.

**Orders created: 0.** El CTA primario nunca se clickeó; se mantuvo `disabled` con copy
`Completá los datos obligatorios` (Nombre/Teléfono vacíos a propósito como red de seguridad).
Post-QA el dashboard sigue con el mismo único pedido activo `#3EMZ8G` del baseline.

---

## 10. Regression guards

Los cuatro P1 del modal siguen **CLOSED**:

- **P1-1** — CTA disabled neutral: regla scoped `opacity: 1` + `cursor: not-allowed` intacta, sin
  `pointer-events: none`; monto sin wrap.
- **P1-2** — readiness de formulario: `getManualOrderRequiredFieldErrors`, `requiredFormReady` y la
  semántica de `canSubmit` sin tocar; los tres copies del CTA intactos (observado en runtime).
- **P1-3** — entrada al configurador en `scrollTop: 0` + restore de compose: `composeScrollTopRef` y
  el reset sobre `bodyRef` intactos; sin `window.scrollTo` / `scrollIntoView`.
- **P1-4** — 900–1023: bloque de geometría de `__product-row` intacto; overlap medido **0** en las
  cuatro product rows a 900 light.

**Single-scroll FROZEN**: a ≤899 `manual-order-modal__body` sigue siendo el único owner
(`overflowY: auto`), y `__summary-scroll` sigue neutralizado (`overflow: visible`, `max-height: none`,
`nestedScrollable: false`). A 900 se preserva el pane workstation preexistente (`max-height: 220px`).
Ninguna de las clases nuevas introduce `overflow`, `max-height`, `position: fixed` ni `sticky` — el
verify lo asserta clase por clase.

---

## 11. Verifies

Nuevo: `lib/orders/admin-manual-order-modal-ticket-summary-hierarchy-polish.verify.ts` — **PASS**

Cubre los 13 puntos del brief: consumo de `ManualOrderTicketLine`; ausencia de parsing de
`displaySummary` (incluye prohibir group names hardcodeados); lectura de los campos del snapshot;
`×N` explícito; prohibición de multiplicar deltas o recomputar totales en el modal; relación
padre→child por `kind` + `parentClientLineId`; campos técnicos nunca renderizados; child no plegado
en el subtotal del padre; handlers de cantidad/remove y sus `aria-label`; `Quitar` fuera del stepper;
tap targets 28px aún diferidos; dominio/pricing/payload intactos; P1-2/P1-3/P1-4; selectores de
CTA/footer; ausencia de scroll anidado nuevo; columna de precio dedicada; y globals/tokens/Button/
shell/panel/servidor sin cambios.

Set de regresión rápido autorizado — **6/6 PASS**:

| Verify | Resultado |
|--------|-----------|
| `admin-manual-order-modal-ticket-summary-hierarchy-polish` | PASS |
| `admin-manual-order-modal-form-validation-ux-decision` | PASS |
| `admin-manual-order-modal-configurator-context-polish` | PASS |
| `admin-manual-order-modal-breakpoint-overflow-fix` | PASS |
| `admin-manual-order-modal-cta-footer-states-polish` | PASS |
| `admin-manual-order-modal-mobile-single-scroll` | PASS |

Static: `npx tsc --noEmit` **PASS** · `git diff --check` **PASS** ·
`npm run build` **NO EJECUTADO** · `npm run lint` **NO EJECUTADO** (FAST MODE, por instrucción).
No hubo cambios en archivos shared/global/domain/server ni riesgo cross-scope que justificara escalar.

---

## 12. Files changed

| Archivo | Estado |
|---------|--------|
| `components/admin/orders/manual-order-modal.tsx` | **CHANGED** — sólo presentación: helper `getManualTicketSummaryGroups` + render agrupado, bloque `Adicional` anidado, fila de acciones |
| `components/admin/orders/manual-order-modal.module.css` | **CHANGED** — clases nuevas del resumen; `__summary-row` y `__quantity-controls` sólo spacing |
| `lib/orders/admin-manual-order-modal-ticket-summary-hierarchy-polish.verify.ts` | **NEW** |
| `lib/orders/manual-order-customization-ticket.ts` | **NONE** |
| `lib/orders/manual-order-types.ts` | **NONE** |
| `app/admin/(protected)/orders/actions.ts` | **NONE** |
| `app/globals.css` | **NONE** |
| `app/theme-tokens.css` | **NONE** |
| `components/ui/Button.tsx` | **NONE** |
| `manual-order-customization-panel.*` / `admin-order-modal-shell.*` | **NONE** en esta fase |

Sin cambios inesperados. Ningún token semántico nuevo (se reutilizan `--text-tertiary`,
`--text-secondary`, `--text-primary`, `--bg-surface-soft`, `--border-subtle`, `--text-muted`).

---

## 13. Remaining debt

| Deuda | Estado |
|-------|--------|
| P2 — affordance de product rows | OPEN — diferido |
| P2 — contraste general de `--text-tertiary` | OPEN — diferido (los labels de grupo usan el token tal cual; su legibilidad en dark quedó verificada) |
| Tap targets <44px (stepper 28px, `Quitar`) | OPEN — `ADMIN-MANUAL-ORDER-MODAL-ACCESSIBILITY-INTERACTION-POLISH-1` |
| Materialidad de superficies / cards | OPEN — `ADMIN-MANUAL-ORDER-MODAL-SURFACE-MATERIALITY-POLISH-1` |
| Focus trap del modal | OPEN — diferido |
| QA en auth de producción | OPEN — sólo local autenticado |

---

## 14. Gate

**PASS — TICKET SUMMARY HIERARCHY POLISHED**

- `displaySummary` parseado para reconstruir dominio: **NO**
- Pricing recalculado distinto: **NO**
- Semántica parent/child alterada: **NO**
- Quantity behavior / remove cascade alterados: **NO**
- Validación / `canSubmit` / configurador alterados: **NO**
- P1-3 scroll regresado: **NO** · P1-4 overlap regresado: **NO**
- Scroll anidado en el ticket introducido: **NO**
- Globals / tokens / Button / server / payload / DB alterados: **NO**
- Orders created: **0**
- Verifies 6/6 **PASS** · tsc **PASS** · diff-check **PASS**

No commit. No push. No deploy.

Next phase: **ADMIN-MANUAL-ORDER-MODAL-SURFACE-MATERIALITY-POLISH-1**
