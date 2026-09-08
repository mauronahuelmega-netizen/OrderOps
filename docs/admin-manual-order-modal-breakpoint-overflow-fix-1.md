# ADMIN-MANUAL-ORDER-MODAL-BREAKPOINT-OVERFLOW-FIX-1

**Fecha:** 2026-09-07
**Branch:** `main`
**HEAD:** `3e418bb056f7cd5eabe0e79a6218ec7b825a8684`
**Tipo:** targeted responsive layout fix — manual order modal only
**Resultado:** PASS — WORKSTATION PRODUCT ROW OVERFLOW FIXED

---

## 1. Objective

Cerrar exclusivamente **P1-4** del audit de jerarquía visual: entre 900px y 1023px el
product row del workstation de *Nuevo pedido* pintaba la identidad del producto
(nombre/badge/categoría/hint) por encima del precio y del botón de acción.

Objetivo acotado:

- product identity nunca pinta debajo/encima del precio ni del botón;
- precio íntegro, legible, sin reducción tipográfica;
- identidad puede envolver de forma intencional;
- ≤899 y ≥1024 sin cambios;
- sin rediseño visual, sin cambios de validación, configurator, server, DB o RPC.

---

## 2. P1-4 reproduction

Runtime QA local autenticado (`http://localhost:3000/admin/dashboard`, tenant
La Burguesía), modal *Nuevo pedido*, fixture actual: BBQ Bacon, Coca Cola 500ml,
Doble Smash, Sprite 500ml.

Medición **antes** del fix a 900px (rect + `scrollWidth`/`clientWidth`, no impresión visual):

| Métrica | Valor |
|---|---|
| workstation tracks | `247.984px 300px` |
| products column | 248px |
| summary column | 300px (piso `minmax(300px, …)`) |
| product row | 212px |
| row tracks | `55.56px \| 80.42px \| 34px` |
| identity track | **55.56px** |
| identity min-content (`copyScrollW`) | **139px** |
| overflow horizontal de identidad | **83px** |
| `HAMBURGUESAS` right edge | x = 290 |
| precio left edge | x = 259 |
| colisión texto↔precio | **sí** (BBQ Bacon, Doble Smash) |

Evidencia visual: `HAMBURGU$S 13.500,00` — la categoría cruzaba el precio, y el
hint corría por debajo de precio y botón.

Filas simples (Coca Cola / Sprite) **no** colisionaban: su categoría `BEBIDAS`
mide 60px y cabía en el track starved.

Intervalo reproducido: **900px–1023px** (constante, products column siempre 248px).
A 899px y a ≥1024px no reproduce.

---

## 3. Root cause

Causa compuesta, confirmada por medición (no por inspección visual):

1. **Starvation del track de identidad.** El dual-pane se activa en
   `@media (min-width: 900px)` con
   `grid-template-columns: minmax(0, 1.45fr) minmax(300px, 0.85fr)`, pero el panel
   del shell sigue capado en `max-width: 600px` hasta 1024px. La columna del ticket
   se apoya en su piso de `300px`, el `1.45fr` nunca actúa, y la columna de productos
   queda en 248px. El row de tres tracks (`minmax(0, 1fr) auto auto`) reparte
   80px de precio + 34px de botón + 20px de gaps y deja **~56px** para identidad.

2. **Shrink sin contención.** `.manual-order-modal__product-copy` ya tenía
   `min-width: 0`, así que el track baja por debajo de su min-content (139px), pero
   sin oportunidad de corte las palabras largas (`HAMBURGUESAS`, `Requiere
   personalización`) seguían pintando fuera de su grid area con `overflow: visible`.

Es decir: el patrón A del brief (`min-width: 0`) ya estaba aplicado, y era
**precisamente** lo que permitía el overflow visible al no haber contención (patrón E),
agravado por la geometría del rango intermedio (patrón D, sin tocar el breakpoint).

---

## 4. Source ownership

| Pieza | Owner |
|---|---|
| product row | `.manual-order-modal__product-row` — `manual-order-modal.module.css` |
| identity | `.manual-order-modal__product-copy` / `__product-title-row` / `__product-name` / `__product-category` |
| price | `.manual-order-modal__product-price` |
| action | `.manual-order-modal__add-button` |
| workstation | `.manual-order-modal__workstation` (`@media (min-width: 900px)`) |
| modal shell | `admin-order-modal.module.css` (`--workstation`: 600px → 1200px en ≥1024) |
| markup | `manual-order-modal.tsx` (no modificado en esta fase) |

Ownership 100% feature-local: `globals.css`, `theme-tokens.css`, `Button.tsx`,
`admin-page-layout.css`, `admin-shell.css` y el panel de customización no contienen
selectores de product row.

---

## 5. Product decision

**OPTION A + OPTION C** (del brief), en ese orden de responsabilidad:

- **A (invariante durable):** contener la copia dentro de su track con
  `overflow-wrap: anywhere`, de modo que a *cualquier* ancho de columna la
  identidad envuelva en lugar de pintar afuera.
- **C (geometría del rango):** media query feature-local `900–1023` que da a la
  identidad el ancho completo del row y reserva una línea propia para precio/acción.

A sola habría sido correcta pero pobre: con 56px de track, `HAMBURGUESAS` se
partiría a mitad de palabra. C sola no sería durable frente a contenido más largo.

**OPTION D rechazada:** no se movió el breakpoint del workstation de 900 a 1024.
El dual-pane a 900–1023 no es estructuralmente inválido; el problema era la
geometría del row, no la existencia del segundo pane.

---

## 6. Implementation

CSS-only. Único archivo runtime modificado:
`components/admin/orders/manual-order-modal.module.css`.

Cambio 1 — contención de identidad:

```
.manual-order-modal__product-copy {
  display: grid;
  gap: 2px;
  min-width: 0;
  overflow-wrap: anywhere;   /* nuevo */
}
```

Cambio 2 — geometría del rango intermedio:

```
@media (min-width: 900px) and (max-width: 1023px) {
  .manual-order-modal__product-row {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      "copy copy"
      "price add";
    row-gap: 6px;
  }
  .manual-order-modal__product-copy  { grid-area: copy; }
  .manual-order-modal__product-price { grid-area: price; justify-self: start; text-align: left; }
  .manual-order-modal__add-button    { grid-area: add; justify-self: end; }
}
```

No se tocó: TSX, breakpoint del workstation, shell, panel del configurator,
tokens, globals, `Button`, ni ninguna regla de ≤899 / ≥1024.

---

## 7. 900–1023 geometry (después)

| Métrica | 900 | 920 | 960 | 1023 |
|---|---|---|---|---|
| products column | 248 | 248 | 248 | 248 |
| product row | 212 | 212 | 212 | 212 |
| row tracks | `145.98px \| 34px` | idem | idem | idem |
| identity width | 190 | 190 | 190 | 190 |
| identity overflow | 0 | 0 | 0 | 0 |
| precio | `$ 13.500,00` íntegro | íntegro | íntegro | íntegro |
| botón | 34×34 | 34×34 | 34×34 | 34×34 |
| scroll horizontal | 0 | 0 | 0 | 0 |
| overlap texto↔precio | ninguno | ninguno | ninguno | ninguno |
| overlap texto↔botón | ninguno | ninguno | ninguno | ninguno |

Identidad pasó de 55.56px → **190px** (3.4×), con min-content 139px holgadamente
contenido.

Overlap medido por **intersección real de rectángulos en ambos ejes** (no comparación
de bordes horizontales), sobre nombre, categoría, hint y cada badge contra el rect
del precio y del botón. Resultado: área de intersección 0 en todos los casos.

---

## 8. Product identity behavior

- **nombre:** legible, envuelve a 2 líneas si hace falta, sin clipping forzado;
- **categoría:** envuelve dentro de su track; nunca cruza al precio;
- **helper (`Tocá + para configurar opciones antes de agregar.`):** envuelve
  naturalmente dentro del ancho completo del row;
- **badges (`Requiere personalización`, `En pedido`):** contenidos, legibles,
  `flex-shrink: 0` intacto;
- **overflow:** 0 medido en todas las filas y anchos;
- sin `text-overflow: ellipsis` ni `line-clamp` nuevos — no fueron necesarios.

---

## 9. Price/action behavior

- `white-space: nowrap` conservado; precio nunca envuelve;
- `min-width: 4.75rem` conservado; ancho real 76–80px en todos los anchos;
- `font-size: 0.84rem` **sin cambios** — el fix no reduce el precio;
- en 900–1023 el precio queda alineado a la izquierda en su propia línea
  (`justify-self: start`), con el botón a la derecha de esa misma línea;
- botón de acción 34×34 en todos los anchos, sin shrink;
- tap target: **sin cambios** (los 34px < 44px son deuda P2 preexistente,
  explícitamente no tocada en esta fase).

---

## 10. Simple/configurable parity

Medido a 900px, misma geometría para ambos tipos:

| Producto | Tipo | Badge | Overflow | Overlap |
|---|---|---|---|---|
| BBQ Bacon | configurable | `Requiere personalización` | 0 | ninguno |
| Doble Smash | configurable | `Requiere personalización` | 0 | ninguno |
| Coca Cola 500ml | simple (seleccionado) | `En pedido` | 0 | ninguno |
| Sprite 500ml | simple | — | 0 | ninguno |

- alineación consistente entre filas simples y configurables;
- helper text sigue adherido sólo al producto configurable;
- las filas simples no adquirieron card/borde/material nuevo;
- **P2-1 (inversión de affordance) sigue diferido**: el `+` no se convirtió en
  `Configurar` en esta fase.

---

## 11. Light theme

900px light: identidad contenida, precio nítido en su propia línea, botón accesible,
sin colisiones, sin texto oculto por contraste. CTA deshabilitado sigue neutro
(gris), no azul saturado. Sin cambios de color en esta fase.

---

## 12. Dark theme

900/920/960/1023 dark: geometría **idéntica** a light (mismos rects medidos), sin
overflow theme-specific, sin regresión de los estilos scoped de CTA/footer.

---

## 13. Responsive matrix

Light: 360 ✅ · 390 ✅ · 412 ✅ · 719 ✅ · 899 ✅ · **900 ✅** · **920 ✅** · **960 ✅** ·
**1023 ✅** · 1024 ✅ · 1440 ✅
Dark: 390 ✅ · 899 ✅ · 900 ✅ · 960 ✅ · 1023 ✅ · 1024 ✅ · 1440 ✅

Geometría por régimen (verificada):

| Rango | Row layout | Tracks (ej.) |
|---|---|---|
| ≤639 | `"copy price" / "copy add"` | `249.58px \| 80.42px` @412 |
| 640–899 | 3 tracks en línea | `373.58 \| 80.42 \| 34` @899 |
| **900–1023** | `"copy copy" / "price add"` | `145.98 \| 34` |
| ≥1024 | 3 tracks en línea | `398.08 \| 80.42 \| 34` @1024 · `541.31 \| 80.42 \| 34` @1440 |

Sin scroll horizontal (`documentElement` y `products-scroll`: delta 0) en ningún ancho.

---

## 14. Extreme content test

Probe sintético **sólo en DevTools** (sin mutar fuente ni DB), a 900px:

- nombre: `Hamburguesa Doble Bacon Especial Superlarga` (43 chars);
- categoría: `HAMBURGUESASESPECIALESDELACASA` (30 chars, una sola palabra sin cortes).

Resultado: row crece a 177px de alto, la categoría envuelve
(`HAMBURGUESASESPECIALESDEL` / `ACASA`) en lugar de desbordar, `copyOverflow: 0`,
overlap con precio y botón: **0**, precio íntegro.

DOM restaurado por recarga de página; ninguna fixture sintética persistida.

---

## 15. P1-1 / P1-2 / P1-3 guards

**P1-1 (CLOSED, fase anterior) — PRESERVADO:**
compose vacío → CTA deshabilitado neutro; compose válido → CTA azul con monto
(`Crear pedido · $ 3.000,00`); configurator inválido → `Completá las opciones`
deshabilitado; footer sticky con borde/sombra/fade intactos. Selectores
`__footer`, `__submit-button`, `__submit-label` **no modificados**.

**P1-2 (OPEN / DEFERRED):** verificado sin cambios en runtime — con ticket válido y
Nombre/Teléfono vacíos, `Crear pedido` queda habilitado. `canSubmit` y `validateForm`
byte-idénticos; ninguna validez de campo de cliente entró a `canSubmit`.

**P1-3 (OPEN / DEFERRED):** configurator abierto y verificado — sin `scrollTop`,
sin `scrollIntoView`, sin cambio de transición de subvista, header y placement del
error (`Elegí una opción en "Papas".`) sin tocar.

---

## 16. Single-scroll guard

≤899: único scroll owner activo medido = `manual-order-modal__body`
(`overflow-y: auto`), verificado a 390 y 899. Sin `overflow-y` nuevo, sin scroll
anidado en productos ni ticket, footer sigue sticky en flujo (no fixed/absolute).
≥900: comportamiento del workstation preservado; esta fase alteró **sólo** la
geometría del row.

---

## 17. Verifies

Nuevo: `lib/orders/admin-manual-order-modal-breakpoint-overflow-fix.verify.ts` — **PASS**

Cubre: ownership feature-local · globals/tokens/Button intactos · shrink +
contención de identidad · precio nowrap/min-width/font-size · sin `overflow-x` ·
shell 600px→1200px intacto · breakpoint 900 del workstation intacto · media query
intermedia exactamente `900–1023` y sólo sobre row/identity/price/action ·
`"copy copy" / "price add"` presente · sin `font-size` en el rango · base 3 tracks
y áreas ≤639 intactas · single-scroll ≤899 · CTA/footer preservados · `canSubmit`/
`validateForm` · P1-3 sin scroll logic · payload/`createManualOrderAction` ·
aria-label y ausencia de `tabIndex`.

Regresión — todos **PASS**:
`admin-manual-order-modal-cta-footer-states-polish` ·
`admin-manual-order-modal-mobile-single-scroll` ·
`admin-manual-order-customization-flow-ui` ·
`admin-manual-order-customization-flow-server-payload` ·
`manual-order-customization-ticket` ·
`admin-manual-order-customization-flow-domain` ·
`admin-manual-order-customization-safety-gate` ·
`dashboard-mobile-orders-toolbar-density` ·
`dashboard-mobile-terminal-density` ·
`dashboard-search-kanban-visual-stability` ·
`dashboard-metrics-semantic-fix` ·
`order-code-ui-search` · `order-display-ref`

Nota: el guard P1-4 del verify de CTA/footer sigue en verde porque afirma la
geometría **base** (row 3 tracks, `min-width` del precio, breakpoint 900, áreas
≤639) — todas preservadas por este fix.

---

## 18. Static checks

- `npx tsc --noEmit` → **PASS** (exit 0)
- `git diff --check` → **PASS** (exit 0; sólo warnings CRLF conocidos)
- `npm run build` → **PASS** (exit 0)
- `npm run lint` → **deuda conocida**: `TypeError: Converting circular structure to JSON`
  (ciclo ESLint 9 / plugin React). Sin cambios respecto a fases previas; no se tocó tooling.

---

## 19. Files changed

| Archivo | Estado |
|---|---|
| `components/admin/orders/manual-order-modal.module.css` | **CHANGED** (2 hunks de esta fase) |
| `components/admin/orders/manual-order-modal.tsx` | NONE en esta fase (dirty por fase CTA/footer previa) |
| `lib/orders/admin-manual-order-modal-breakpoint-overflow-fix.verify.ts` | **NEW** |
| `docs/admin-manual-order-modal-breakpoint-overflow-fix-1.md` | **NEW** |
| `docs/CURRENT_PHASE.md` · `ORDEROPS_LIVING_MEMORY.md` · `docs/admin-dashboard-forensic-living-audit.md` | updated |
| `admin-order-modal.*` · `manual-order-customization-panel.*` · `globals.css` · `theme-tokens.css` · `Button.tsx` · server/actions · SQL/migrations | **NONE** |
| `tsconfig.tsbuildinfo` | generated noise |

Sin archivos runtime no relacionados.

---

## 20. Findings P0–P3

- **P0:** ninguno.
- **P1:** **P1-4 CLOSED**. P1-1 CLOSED (fase previa). **P1-2 OPEN/DEFERRED**
  (form validation UX). **P1-3 OPEN/DEFERRED** (configurator context/scroll).
- **P2:** sin cambios. Sigue abierto P2-1 (inversión de affordance `+` vs
  `Configurar`) y la deuda de tap target de 34px en `__add-button`.
- **P3 (nuevo, no bloqueante):** el rango 900–1023 existe sólo porque el shell
  mantiene el cap de 600px mientras el workstation ya pidió dual-pane. Es
  coherente hoy, pero si alguna vez el shell cambia su cap o el ticket su piso de
  300px, el rango de esta media query debe revisarse. Documentado, no accionado
  (tocar el shell excedía el scope).
- **P3 (preexistente):** `backdrop-filter` sigue siendo removido por el pipeline
  CSS de este módulo.

---

## 21. Hard boundaries respetadas

Workstation breakpoint, modal shell, `canSubmit`, `validateForm`, configurator
scroll/panel, CTA/footer, `createManualOrderAction`, `create_order`, esquema/RPC/
migraciones, checkout y catálogo públicos, dashboard/workspace/drawer/toolbar/
footer admin, `globals.css`, `theme-tokens.css`, `Button.tsx`, single-scroll:
**todos sin cambios**.

Orders created: **0** · Status mutations: **0** · WhatsApp sends: **0** ·
commit/push/deploy: **ninguno**.

---

## 22. Gate

**ADMIN-MANUAL-ORDER-MODAL-BREAKPOINT-OVERFLOW-FIX-1 = PASS**

P1-4 900–1023 text/price overlap: **CLOSED** ·
900–1023 product row geometry: **STABLE** ·
≤899: **PRESERVED** · ≥1024: **PRESERVED** ·
CTA/footer polish: **PRESERVED** ·
P1-2 / P1-3: **DEFERRED** · single-scroll: **FROZEN** ·
create_order / DB: **UNCHANGED** · orders created: **0**

Next phase: **ADMIN-MANUAL-ORDER-MODAL-CONFIGURATOR-CONTEXT-POLISH-1**
