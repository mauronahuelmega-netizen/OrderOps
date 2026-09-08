# ADMIN-MANUAL-ORDER-MODAL-CTA-FOOTER-STATES-POLISH-1

**Fecha:** 2026-09-07
**Tipo:** Targeted visual / UX polish — CTA states + sticky footer materiality
**Alcance:** manual order modal únicamente (CSS scoped + markup presentacional)
**Base:** `docs/admin-manual-order-modal-visual-hierarchy-audit-1.md`, HEAD `3e418bb`
**Resultado:** PASS WITH ACCEPTED P3 COPY DEBT — CTA/FOOTER STATES POLISHED

---

## 1. Objective

Corregir la jerarquía visual de las acciones primarias del modal "Nuevo pedido" y mejorar la
materialidad del footer sticky, sin reabrir lógica funcional cerrada (validación, payload,
server actions, arquitectura de scroll).

---

## 2. Audit findings addressed

| Finding | Descripción | Estado |
|---------|-------------|--------|
| **P1-1** | CTA primario disabled visualmente indistinguible del enabled (`.ui-button:disabled` sólo aplica `opacity: .6` sobre azul saturado) | **CLOSED** |
| **P2-12** | Footer sticky sin separación/material suficiente; contenido cortado contra su borde parecía truncado | **CLOSED** |
| **P2-15** | En compose `<640px` el CTA válido perdía el monto justo al confirmar | **CLOSED** |
| **P3-8** | Comunicación/copy del CTA bloqueado | **PARTIAL** — configurator cerrado, compose diferido (ver §8) |

No abordados por diseño (fases separadas): **P1-2**, **P1-3**, **P1-4**.

---

## 3. Source ownership

| Elemento | Owner |
|----------|-------|
| Markup CTA compose (`Crear pedido`) | `components/admin/orders/manual-order-modal.tsx` (`type="submit"`, `disabled={!canSubmit}`) |
| Markup CTA configurator (`Agregar`) | `manual-order-modal.tsx` (`onClick={confirmConfigure}`, `disabled={isSubmitting \|\| !configureDraftValid}`) |
| Primitiva base del botón | `components/ui/Button.tsx` → `.ui-button .ui-button--primary` (`app/globals.css`) |
| Estado disabled global | `app/globals.css` → `.ui-button:disabled { cursor: not-allowed; opacity: 0.6; transform: none }` — **READ ONLY** |
| Override scoped del disabled | `manual-order-modal.module.css` → `.manual-order-modal__footer .manual-order-modal__submit-button:disabled` |
| Footer | `manual-order-modal.module.css` → `.manual-order-modal__footer` (+ `::before`) |
| Label con monto | `manual-order-modal.module.css` → `.manual-order-modal__submit-label` |
| Secundarios (`Cancelar` / `Volver`) | `manual-order-modal.module.css` → `.manual-order-modal__footer :global(.ui-button--secondary)` |

El hook local `manual-order-modal__submit-button` ya existía en ambos CTA primarios (sólo
declaraba `white-space: nowrap`), por lo que **no fue necesario agregar clases nuevas al TSX**
para el fix del disabled.

---

## 4. Implementation

Archivos runtime modificados:

- `components/admin/orders/manual-order-modal.module.css` (CSS scoped)
- `components/admin/orders/manual-order-modal.tsx` (presentación únicamente)

Verify nuevo:

- `lib/orders/admin-manual-order-modal-cta-footer-states-polish.verify.ts`

Sin cambios en: `canSubmit`, `validateForm`, validación de cliente/entrega, validación de
customización, payload, `createManualOrderAction`, `create_order`, scroll architecture,
`app/globals.css`, `app/theme-tokens.css`, `components/ui/Button.tsx`, panel de customización.

---

## 5. Scoped disabled CTA treatment

```css
.manual-order-modal__footer .manual-order-modal__submit-button:disabled {
  opacity: 1;
  background: color-mix(in srgb, var(--bg-surface-soft) 88%, var(--bg-surface));
  border-color: color-mix(in srgb, var(--border-subtle) 72%, transparent);
  color: var(--text-secondary);
  box-shadow: none;
  transform: none;
  cursor: not-allowed;
}
```

Decisiones:

- **Especificidad vía ancestro `__footer`** (0,3,0) para ganarle a `.ui-button:disabled` (0,2,0)
  con independencia del orden de inserción entre `globals.css` y el CSS module. El CTA primario
  siempre vive dentro del footer.
- **Sin cambios globales**: `app/globals.css` intacto (blast radius admin + público).
- **Tokens semánticos**, no un sistema de color paralelo.
- **`--text-secondary`, no `--text-tertiary`**: `--text-tertiary` no pasa AA sobre superficies
  claras (P2-7 del audit). El verify bloquea el uso de `--text-tertiary` aquí.

Medición runtime (390px):

| Estado | Tema | Background | Label | Opacity | Cursor | Shadow | Alto |
|--------|------|-----------|-------|---------|--------|--------|------|
| Disabled | dark | `#1F2025` | `#CBD5E1` | 1 | `not-allowed` | none | 44px |
| Disabled | light | `#F3F6FA` | `#52525B` (contraste **7.13:1**) | 1 | `not-allowed` | none | 44px |
| Enabled | dark/light | `rgb(37,99,235)` = `--accent-primary` | `#FFFFFF` | 1 | `pointer` | — | 44px |

El disabled ya no lee como acción primaria disponible en ninguno de los dos temas, y sigue
leyéndose como botón (superficie rellena + borde + label legible), no como elemento ausente.

---

## 6. Footer material treatment

```css
.manual-order-modal__footer {
  position: sticky;               /* sin cambios: sigue siendo hermano en el flujo */
  border-top: 1px solid color-mix(in srgb, var(--border-subtle) 68%, var(--text-secondary));
  background: color-mix(in srgb, var(--bg-surface) 97%, transparent);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 -8px 18px -10px color-mix(in srgb, black 26%, transparent);
}

.manual-order-modal__footer::before {
  content: "";
  position: absolute;
  left: 0; right: 0; bottom: 100%;
  height: 18px;
  pointer-events: none;
  background: linear-gradient(to top, color-mix(in srgb, var(--bg-surface) 88%, transparent), transparent);
}
```

- **Separación superior**: borde con tinte de `--text-secondary` (antes hairline plano al 92% de
  `--border-subtle`, casi invisible en dark).
- **Sombra ascendente**: `0 -8px 18px -10px` — separa sin crear una barra flotante.
- **Fade decorativo de borde de scroll** (18px, `pointer-events: none`, anclado en `bottom: 100%`):
  el contenido ahora se desvanece hacia el footer en lugar de cortarse en seco. No cubre la fila
  de acciones ni intercepta toques.
- **Safe-area**: sin cambios (la sigue aportando el padding del body del shell).
- **Deuda P3 registrada**: el pipeline de CSS (Lightning CSS / Turbopack) **elimina
  `backdrop-filter`** de este módulo — verificado inspeccionando el CSSOM servido: no existe
  ninguna declaración `backdrop*` para el footer, ni suelta ni en `@supports`. Es preexistente
  (ya ocurría con el `blur(6px)` anterior). Por eso la superficie se subió a **97%** y la
  materialidad se apoya en surface + borde + sombra + fade, no en el blur. La declaración se
  mantiene en fuente por intención y para cuando el pipeline la respete.

---

## 7. Mobile amount parity

Antes: dos spans mutuamente excluyentes por breakpoint —
`__submit-label-desktop` (con monto, `display: none` bajo 640px) y
`__submit-label-mobile` (sin monto).

Ahora: **un único label con monto en todos los anchos**.

```tsx
{isSubmitting ? "Creando pedido..."
 : hasSelectedItems ? (
   <span className={styles["manual-order-modal__submit-label"]}>
     Crear pedido · {formatCurrency(previewTotal)}
   </span>
 ) : "Crear pedido"}
```

Se eliminaron los dos spans width-gated, sus reglas CSS y el bloque
`@media (min-width: 640px)` que sólo las alternaba (no contenía otras reglas).

Sin lógica de precios nueva: se sigue usando el `previewTotal` memoizado existente
(`getManualTicketEstimatedTotal(ticketLines)`) y `formatCurrency`.

Medición de ajuste (label a `600 16px Inter`, `white-space: nowrap`, `font-variant-numeric: tabular-nums`):

| Viewport | Ancho interno del botón | Ancho del label | Líneas |
|----------|------------------------|-----------------|--------|
| 360 | 336px (full width) | 210px | 1 |
| 390 | 366px (full width) | 210px | 1 |
| 412 | 388px (full width) | 210px | 1 |
| 899 | 244px (auto) | 210px | 1 |

Peor caso medido por `canvas.measureText` con la fuente real del botón:
`Crear pedido · $ 1.234.500,00` = **231px** contra **332px** disponibles a 390px. Sin riesgo de
wrap ni overflow en el rango mobile. No se tocó la altura de toque (44px).

---

## 8. Blocked CTA copy decision

**Configurator — implementado.** El booleano que ya gobierna `disabled` es exactamente
`configureDraftValid`, así que el label puede comunicar ese mismo estado sin lógica nueva:

- inválido → `Completá las opciones`
- válido → `Agregar · $ 15.000,00`

**Compose — diferido (deuda P3 aceptada).** El CTA queda `Crear pedido` cuando está bloqueado.
`canSubmit` combina `canCreateOrder && !isSubmitting && products.length > 0 && hasSelectedItems &&
ticketSubmitReady`; atribuir una causa concreta requeriría un condicional nuevo que desambigüe
"sin sesión activa" de "ticket vacío" de "línea inválida". Además, por **P1-2**, la validez de
los campos del cliente no participa de `canSubmit`, así que cualquier copy causal podría afirmar
algo falso (p. ej. "Agregá un producto" cuando el bloqueo real es la sesión). Se prefirió no
introducir semántica de validación nueva; el estado bloqueado se comunica visualmente con el
tratamiento neutro del §5, y el alert existente de sesión sigue explicando ese caso.

Reabrir junto a **P1-2** en `FORM-VALIDATION-UX-DECISION-1`.

---

## 9. Single-scroll invariant

Sin cambios en owner de overflow, modelo de scroll del workstation, overflow de products/summary
ni ubicación del footer.

Verificación runtime (compose con ticket válido):

| Viewport | `manual-order-modal__body` overflow-y | Scrollers dentro del modal | Footer position |
|----------|--------------------------------------|----------------------------|-----------------|
| 360 | `auto` | `[manual-order-modal__body]` | `sticky` |
| 390 | `auto` | `[manual-order-modal__body]` | `sticky` |
| 412 | `auto` | `[manual-order-modal__body]` | `sticky` |
| 899 | `auto` | `[manual-order-modal__body]` | `sticky` |

Sin `position: fixed`, sin overlay absoluto del CTA, sin `overflow-y: auto` nuevo, sin scrollbar
nueva en products ni en el ticket. El pseudo-elemento del fade es `position: absolute` **decorativo**
(`pointer-events: none`) y no participa del layout ni del scroll.

`admin-manual-order-modal-mobile-single-scroll.verify.ts`: **PASS**.

---

## 10. P1-2 / P1-3 / P1-4 deferred guards

| Finding | Comportamiento esperado | Verificado |
|---------|------------------------|-----------|
| **P1-2** | `Crear pedido` sigue habilitado con Nombre/Teléfono vacíos | **UNCHANGED** — runtime: ticket válido `$15.000,00`, ambos campos vacíos, CTA habilitado (azul, con monto). `canSubmit` byte-identical; el verify falla si `customerName`/`phone`/`address`/`fieldErrors` aparecen en `canSubmit` |
| **P1-3** | El configurator sigue heredando `scrollTop` del compose | **UNCHANGED** — no se tocó lógica de scroll/reset; el verify falla si aparece `scrollTop`/`scrollIntoView`/`useLayoutEffect` en el modal |
| **P1-4** | Solape texto↔precio en 900–1023px sigue reproduciéndose | **UNCHANGED** — reproducido a 900px (`HAMBURGU$S 13.500,00`). Grid de `__product-row`, `min-width` del precio, breakpoint `min-width: 900px` y `grid-template-areas` de ≤639 quedan aseverados por el verify |

Diferidos a: `FORM-VALIDATION-UX-DECISION-1` (P1-2), `CONFIGURATOR-CONTEXT-POLISH-1` (P1-3),
`ADMIN-MANUAL-ORDER-MODAL-BREAKPOINT-OVERFLOW-FIX-1` (P1-4).

---

## 11. Runtime matrix

QA local autenticada (`http://localhost:3000/admin/dashboard`, tenant **La Burguesía**).
**0 pedidos creados**, 0 mutaciones de status, 0 envíos de WhatsApp. Nunca se pulsó `Crear pedido`.

| Estado | Viewport | Resultado |
|--------|----------|-----------|
| **A** — compose vacío | 390 dark | `Crear pedido` disabled, superficie neutra `#1F2025`, no es el elemento dominante; `Cancelar` sigue secundario; footer con separación clara; sin overlay; single-scroll OK |
| **B** — compose con ticket válido | 390 dark / light | `Crear pedido · $ 13.500,00` / `· $ 15.000,00` habilitado, azul `#2563EB`, contraste fuerte vs A, monto visible en mobile, una línea, footer estable |
| **C** — configurator inválido | 390 dark | `Completá las opciones`, `disabled` nativo (`btn.disabled === true`), error `Elegí una opción en "Papas"` intacto, tratamiento neutro |
| **D** — configurator válido | 390 dark | `Agregar · $ 13.500,00` habilitado, transición de acento evidente, monto visible, sin salto de layout |
| **E** — comparación light/dark | 390 | Distinción disabled↔enabled clara en ambos temas (contraste de label 7.13:1 en light) |
| Smoke | 360 dark | Footer en columna, ambos botones full-width 44px, monto sin wrap, fade visible |
| Smoke | 412 dark | Idéntico a 390, sin wrap |
| Smoke | 899 dark | Body sigue siendo único scroll owner, CTA auto-width con monto |
| Smoke | 900 dark | Dual-pane intacto, footer horizontal, P1-4 reproduce (esperado) |
| Smoke | 1440 dark | Layout desktop intacto, sin overlap de filas |

El tema light se evaluó fijando `data-dashboard-theme="light"` de forma efímera en el DOM y
restaurándolo a `dark`; no se cambió ninguna preferencia persistida.

---

## 12. Light theme

- Footer: `rgba(255,255,255,0.97)` + borde con tinte `--text-secondary` + sombra ascendente;
  el fade blanco al 88% suaviza el corte sobre las filas de producto.
- Disabled CTA: `#F3F6FA` con label `#52525B` → **7.13:1** (AA/AAA para texto normal).
- Enabled CTA: `#2563EB` con label blanco; jerarquía primaria intacta.
- `Cancelar` mantiene superficie blanca, borde definido y texto primario: sigue leyéndose
  secundario y no se confunde con el primario deshabilitado (borde más marcado + label más oscuro).

---

## 13. Dark theme

- Footer: `rgba(23,24,29,0.97)`, borde `rgba(210,219,229,0.37)` (antes casi invisible), sombra
  `rgba(0,0,0,0.26)`.
- Disabled CTA: `#1F2025` con label `#CBD5E1` — inactivo a primera vista, legible, aún botón.
- Enabled CTA: `#2563EB` / blanco.
- Fade oscuro al 88% sobre `--bg-surface`: transición suave, verificada en compose y configurator
  (fila `Big Mac` / `Doble Smash` se desvanecen en lugar de cortarse).

---

## 14. Verifies

Nuevo: `lib/orders/admin-manual-order-modal-cta-footer-states-polish.verify.ts` — **PASS**

Cubre: hook local scoped en ambos CTA · disabled scoped no-opacity con superficie/label/borde
semánticos · prohibición de `--text-tertiary` y de acento en disabled · `.ui-button:disabled`
global byte-identical · `globals.css` / `theme-tokens.css` sin conocimiento del modal ·
`Button.tsx` sin manejo de disabled · `canSubmit` y reglas de `validateForm` byte-identical ·
P1-2 guard sobre `canSubmit` · prohibición de `pointer-events: none` como disabled falso ·
wiring de `createManualOrderAction` y payload · invariante single-scroll ≤899 · footer sticky
sin overflow ni fixed · sombra/borde/fade decorativo con `pointer-events: none`, `bottom: 100%`
y altura ≤24px · panel de customización intacto · labels width-gated eliminados y label con
monto presente · totales desde los helpers existentes · copy bloqueado ligado a
`configureDraftValid` · guards P1-3 y P1-4.

Regresión (todos **PASS**):

```
admin-manual-order-modal-mobile-single-scroll   PASS
admin-manual-order-customization-flow-ui        PASS
admin-manual-order-customization-flow-server-payload PASS
manual-order-customization-ticket               PASS
admin-manual-order-customization-flow-domain    PASS
admin-manual-order-customization-safety-gate    PASS
dashboard-mobile-orders-toolbar-density         PASS
dashboard-mobile-terminal-density               PASS
dashboard-search-kanban-visual-stability        PASS
dashboard-metrics-semantic-fix                  PASS
order-code-ui-search                            PASS
order-display-ref                               PASS
```

---

## 15. Static checks

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | **PASS** (exit 0) |
| `git diff --check` | **PASS** (exit 0; sólo warnings CRLF conocidos y no bloqueantes) |
| `npm run build` | **PASS** — compiled in 21.3s, TypeScript OK, 23/23 static pages |
| `npm run lint` | **EJECUTADO** — falla con deuda conocida exacta |

---

## 16. Lint evidence

```
> eslint .
Oops! Something went wrong! :(
ESLint: 9.39.4
TypeError: Converting circular structure to JSON
    --> starting at object with constructor 'Object'
    |     property 'configs' -> object with constructor 'Object'
    |     property 'flat' -> object with constructor 'Object'
    |     ...
    |     property 'plugins' -> object with constructor 'Object'
    --- property 'react' closes the circle
```

Deuda conocida (ESLint 9 / ciclo del plugin de React). No se tocó tooling de lint.

---

## 17. Files changed

| Archivo | Estado |
|---------|--------|
| `components/admin/orders/manual-order-modal.module.css` | **CHANGED** (disabled scoped, footer material, fade, label) |
| `components/admin/orders/manual-order-modal.tsx` | **CHANGED** — presentación únicamente (2 hunks: label único con monto, copy bloqueado del configurator) |
| `lib/orders/admin-manual-order-modal-cta-footer-states-polish.verify.ts` | **NEW** |
| `docs/admin-manual-order-modal-cta-footer-states-polish-1.md` | **NEW** |
| `docs/CURRENT_PHASE.md` | **UPDATED** |
| `ORDEROPS_LIVING_MEMORY.md` | **UPDATED** (changelog) |
| `docs/admin-dashboard-forensic-living-audit.md` | **UPDATED** (changelog) |
| `app/globals.css` | **NONE** |
| `app/theme-tokens.css` | **NONE** |
| `components/ui/Button.tsx` | **NONE** |
| `components/admin/orders/manual-order-customization-panel.*` | **NONE** |
| `components/admin/orders/admin-order-modal-shell.tsx` / `admin-order-modal.module.css` | **NONE** |
| `app/admin/(protected)/orders/actions.ts` | **NONE** |
| `lib/orders/*` (excepto el verify nuevo) | **NONE** |
| `supabase/migrations/*`, `types/database.ts`, `package.json` | **NONE** |
| `tsconfig.tsbuildinfo` | pre-existente/generado, no parte de esta fase |

---

## 18. P0–P3 findings

- **P0:** ninguno.
- **P1:** **P1-1 CLOSED**. **P1-2**, **P1-3**, **P1-4** siguen **OPEN** y explícitamente diferidos
  (verificados como sin cambios en runtime y por verify).
- **P2:** **P2-12 CLOSED**, **P2-15 CLOSED**. El resto del inventario P2 del audit sigue abierto
  para fases posteriores (materialidad de superficies, tap targets, ARIA, jerarquía del ticket).
- **P3:** **P3-8 PARCIAL** (configurator cerrado, compose diferido — §8).
  **P3 nuevo:** el pipeline de CSS elimina `backdrop-filter` de este módulo (preexistente); la
  materialidad del footer no depende del blur.

---

## 19. Hard boundaries

| Boundary | Estado |
|----------|--------|
| `canSubmit` | UNCHANGED (byte-identical, aseverado por verify) |
| `validateForm` | UNCHANGED (4 reglas aseveradas) |
| Validación de cliente / entrega | UNCHANGED |
| Validación de customización | UNCHANGED |
| `createManualOrderAction` | UNCHANGED |
| `create_order` RPC | UNCHANGED |
| DB schema / migrations | UNCHANGED |
| Public checkout / catalog | UNCHANGED |
| Dashboard Kanban / search / metrics | UNCHANGED |
| Workspace / preparation / contact | UNCHANGED |
| Drawer / toolbar / AdminShell / admin footer | UNCHANGED |
| `components/ui/Button.tsx` | UNCHANGED |
| `app/globals.css` / `app/theme-tokens.css` | UNCHANGED |
| Single-scroll | FROZEN |
| Semántica nativa de `disabled` / focus-visible / ARIA / `type` | PRESERVADA |
| Pedidos creados | **0** |
| Mutaciones de status | **0** |
| Envíos de WhatsApp | **0** |
| commit / push / deploy | **NINGUNO** |

---

## 20. Gate

```
ADMIN-MANUAL-ORDER-MODAL-CTA-FOOTER-STATES-POLISH-1
= PASS WITH ACCEPTED P3 COPY DEBT

P1-1 CTA DISABLED VISUAL HIERARCHY: CLOSED
ENABLED CTA: PRESERVED
MOBILE AMOUNT: VISIBLE
FOOTER MATERIAL: POLISHED
SINGLE-SCROLL: FROZEN
P1-2 FORM VALIDATION UX: DEFERRED
P1-3 CONFIGURATOR CONTEXT: DEFERRED
P1-4 900–1023 OVERLAP: DEFERRED
GLOBAL BUTTON: UNCHANGED
GLOBAL TOKENS: UNCHANGED
CREATE_ORDER: UNCHANGED
DB: UNCHANGED
ORDERS CREATED: 0

NEXT PHASE: ADMIN-MANUAL-ORDER-MODAL-BREAKPOINT-OVERFLOW-FIX-1
```

No commit. No push. No deploy.
