# ADMIN-MANUAL-ORDER-MODAL-VISUAL-HIERARCHY-AUDIT-1

**Fecha:** 2026-09-07
**Tipo:** Forensic visual / UX audit — manual order modal only
**Resultado:** AUDIT COMPLETE WITH BLOCKING P1/P2 FINDINGS
**Implementación en esta fase:** NONE (no code, no CSS, no SQL, no RPC, no orders, no commit/push/deploy)

---

## 1. Objective

Auditar quirúrgicamente jerarquía visual, contraste, superficies, materialidad, estados, densidad y legibilidad del modal admin "Nuevo pedido" (compose view + configurator view) después del deploy del bloque mobile/orders, sin implementar ningún fix.

El objetivo no es arreglar. El objetivo es producir evidencia clasificada (P0–P3), mapa de ownership de código/CSS y una secuencia de microfases de polish segura.

---

## 2. Scope

**In scope**

- Modal "Nuevo pedido" (`AdminOrderModalShell` variant `workstation` + `ManualOrderModal`).
- Compose view: header, Cliente/Entrega, Productos, lista/rows de producto, ticket vacío, ticket con producto configurado, notas, total estimado, footer CTA (Crear pedido / Cancelar).
- Configurator view: header/contexto, cantidad, grupos obligatorios, grupos opcionales, extras con cantidad, Adicional/upsell, selected states, error states, footer CTA (Agregar / Volver).
- Mobile-first (390 / 412), boundary 899, workstation 900, desktop 1440.
- Light + dark theme.
- Source ownership mapping.

**Out of scope / no tocado**

- Dashboard (Kanban, search, metrics, toolbar, drawer, footer AdminShell).
- Workspace/preparation renderers, Contacto/WhatsApp.
- Public catalog/checkout.
- `create_order` RPC, DB schema, migraciones, `types/database.ts`.
- Lógica funcional del modal (validación, payload, submit).
- `app/globals.css`, `app/theme-tokens.css`.

**Orders created:** 0. **Status mutations:** 0. **WhatsApp sends:** 0.

---

## 3. Source phase dependency

Estado base confirmado antes de auditar:

| Item | Estado |
|------|--------|
| Admin dashboard mobile/orders block | CLOSED / DEPLOYED |
| Manual order modal functional flow | CLOSED |
| Manual order MODE B submit | VERIFIED (`#TJK9R5`) |
| create_order RPC | UNCHANGED |
| DB schema/migrations | UNCHANGED |
| Public checkout/catalog | UNCHANGED |
| Manual modal single-scroll | FROZEN |
| Release commit | `178d07c` (deploy doc `dpl_8T1JKrzPhCsKhNYeo8xKTJUesgZn`) |
| HEAD al auditar | `3e418bb` (docs de deploy), branch `main` |

Preflight git: branch `main`; HEAD `3e418bb056f7cd5eabe0e79a6218ec7b825a8684`; dirty tree = solo `tsconfig.tsbuildinfo` (artefacto generado, preexistente); **no staged files**; commit/push/deploy del bloque ya ejecutado y documentado en `docs/admin-dashboard-mobile-orders-commit-push-deploy-1.md` y reflejado en `docs/CURRENT_PHASE.md` → **no hay deuda de reconciliación documental** (no aplica el P2 previsto en el brief).

No reset. No stash. No clean. No staging. No commit.

---

## 4. Evidence used

**Evidencia de producción (operator-reported)**

Las capturas mobile Android Chrome descritas por el operador (compose vacío, lista de productos BBQ Bacon / Coca Cola 500ml / Doble Smash / Sprite 500ml, configurator BBQ/Doble Smash, error `Elegí una opción en "Papas".`, extras Bacon×4 / Cheddar×4 / Huevo×1, Adicional Coca Cola, ticket `1 × Doble Smash` con total `$24.250,00`, formulario delivery, light theme) se usaron como **descripción textual provista en el brief**. Los archivos de imagen **no quedaron adjuntos como archivos en esta sesión**, por lo que se tratan como evidencia reportada por el operador y no como capturas inspeccionadas píxel a píxel.

**Evidencia de producción (verificada por el agente)**

- `https://orderops.vercel.app/admin/dashboard` → **redirige a `/admin/login`**. No hay sesión admin de producción disponible para Cursor. Ver §5.

**Evidencia runtime (verificada por el agente)**

QA autenticado local sobre el código de la release branch (`main`, HEAD `3e418bb`, mismo árbol que `178d07c` salvo docs), dev server `http://localhost:3000`, tenant **La Burguesía**, dark theme por defecto (`html[data-dashboard-theme="dark"]`).

Capturas tomadas en esta fase (temp de sesión):

| # | Estado | Viewport / theme |
|---|--------|------------------|
| 1 | Compose vacío (top) | 390 dark |
| 2 | Ticket vacío + notas + total | 390 dark |
| 3 | Configurator entrado con scroll heredado (mid-groups) | 390 dark |
| 4 | Configurator top: header/cantidad/Papas + error + CTA disabled | 390 dark |
| 5 | Selected state opción requerida + CTA enabled | 390 dark |
| 6 | Qty extra (Cheddar ×1) + Adicional seleccionado | 390 dark |
| 7 | Ticket configurado + Adicional child + total | 390 dark |
| 8 | Ticket configurado | 390 light |
| 9 | Configurator con error + CTA disabled | 390 light |
| 10 | Compose con CTA habilitado y ticket fuera de viewport | 412 dark |
| 11 | Modal centrado sobre dashboard | 899 dark |
| 12 | Workstation dos columnas (overlap) | 900 light |
| 13 | Workstation dos columnas (limpio) | 1440 light |

**Source files leídos**

`components/admin/orders/manual-order-modal.tsx`, `manual-order-modal.module.css`, `manual-order-customization-panel.tsx`, `manual-order-customization-panel.module.css`, `admin-order-modal-shell.tsx`, `admin-order-modal.module.css`, `components/admin/admin-shell.css` (tap highlight), `app/globals.css` (`.ui-button*`), `app/theme-tokens.css` (tokens), `docs/admin-dashboard-forensic-living-audit.md`, `docs/CURRENT_PHASE.md`.

---

## 5. Runtime coverage

| Viewport / theme | Cobertura | Nota |
|------------------|-----------|------|
| 390 dark | **FULL** | compose vacío, ticket vacío, configurator (entrada, top, selected, qty, upsell, error), ticket configurado |
| 412 dark | SMOKE+ | compose con ticket cargado, CTA habilitado, single-scroll |
| 390 light | **FULL (core states)** | ticket configurado, configurator con error + CTA disabled |
| 412 light | **NO EJECUTADO** | deuda P3 — 390 light cubre el mismo layout (<640px) |
| 899 dark | SMOKE | sheet centrado, CTA con monto, clipping de ticket |
| 900 light | SMOKE | workstation dos columnas → **P1 overlap detectado** |
| 899 light / 900 dark / 1440 dark | **NO EJECUTADO** | deuda P3 |
| 1440 light | SMOKE | workstation limpio, sin overlap |
| Production authenticated admin | **NO DISPONIBLE** | `/admin/dashboard` → `/admin/login`; deuda P2 |

**Single-scroll (frozen behavior):** verificado en runtime. A 390/412/900 el único elemento con overflow scrolleable dentro del modal es `manual-order-modal__body` (medido `scrollHeight 1025 / clientHeight 623` a 390, sin scrollers anidados). No hay regresión del fix de single-scroll.

**Limitaciones declaradas**

1. No hay QA autenticado en producción (sin sesión). El runtime auditado es local sobre el mismo código desplegado.
2. Dark theme **sí** fue auditado en browser (local), no inferido de capturas light.
3. Light theme fue auditado en browser forzando `data-dashboard-theme="light"` en runtime (override temporal revertido al terminar); las capturas light de producción del operador se usan como corroboración textual.

---

## 6. Source ownership map

| # | Elemento visual | Owner (markup) | Owner (estilo) |
|---|-----------------|----------------|----------------|
| 1 | Modal shell / overlay / portal / scroll lock / Escape | `admin-order-modal-shell.tsx` | `admin-order-modal.module.css` → `.admin-order-modal-shell*`, `--workstation`, `@media (max-width:719px)` full-screen |
| 2 | Modal header (contenedor, close ×, meta slot) | `admin-order-modal-shell.tsx` | `admin-order-modal.module.css` → `__header--workstation`, `__close--quiet` |
| 3 | Header copy (título/subtítulo) + badge `PEDIDO MANUAL` | `manual-order-modal.tsx` (`headerLeading` / `headerMeta`) | `manual-order-modal.module.css` → `__header-copy`, `__subtitle`, `__header-badge` |
| 4 | Compose body / scroll owner | `manual-order-modal.tsx` | `manual-order-modal.module.css` → `__body` + `@media (max-width:899px)` |
| 5 | Cliente/Entrega card + inputs + segmented Retiro/Delivery | `manual-order-modal.tsx` | `manual-order-modal.module.css` → `__customer-strip`, `__customer-grid*`, `__field`, `__delivery-*`; inputs heredan `.admin-field` (global) |
| 6 | Productos panel + search | `manual-order-modal.tsx` | `manual-order-modal.module.css` → `__products-panel`, `__panel-header`, `__panel-hint`, `__search` |
| 7 | Product row / name / category / price / badges | `manual-order-modal.tsx` | `manual-order-modal.module.css` → `__product-row(-–selected/--blocked/--configurable)`, `__product-copy`, `__product-name`, `__product-category`, `__product-price`, `__product-selected-badge`, `__product-blocked-badge`, `__product-blocked-hint` |
| 8 | Affordance configurable (`+` = configurar) | `manual-order-modal.tsx` (`addProduct` → `openConfigure`) | `manual-order-modal.module.css` → `__add-button` |
| 9 | Ticket card (panel Pedido) | `manual-order-modal.tsx` | `manual-order-modal.module.css` → `__summary-panel`, `__ticket-header`, `__ticket-subtitle` |
| 10 | Empty ticket state | `manual-order-modal.tsx` | `__ticket-empty*` |
| 11 | Ticket parent line + selections | `manual-order-modal.tsx` (`line.displaySummary` de `lib/orders/manual-order-customization-ticket.ts`) | `__summary-row`, `__summary-row-head`, `__summary-line`, `__summary-subtotal`, `__summary-chips` |
| 12 | Ticket child / Adicional | `manual-order-modal.tsx` (+ `UPSELL_ASSOCIATED_LABEL`) | `__summary-child*` |
| 13 | Qty controls + Quitar | `manual-order-modal.tsx` | `__quantity-controls`, `__quantity-button`, `__quantity-value`, `__remove-button` |
| 14 | Notas | `manual-order-modal.tsx` | `__notes-field` |
| 15 | Total estimado (idle/active) | `manual-order-modal.tsx` | `__total-block(--idle/--active)`, `__total-row`, `__total-label`, `__total-value`, `__total-note` |
| 16 | Sticky modal footer | `manual-order-modal.tsx` | `__footer` + `@media (max-width:639px)` column-reverse full-width |
| 17 | Primary/secondary CTA base + **disabled state** | `components/ui/Button` | **`app/globals.css`** → `.ui-button`, `.ui-button--primary`, `.ui-button--secondary`, **`.ui-button:disabled`** (owner global, no local) |
| 18 | CTA labels responsive (con/sin monto) | `manual-order-modal.tsx` | `__submit-label-desktop` / `__submit-label-mobile` (`@media min-width:640px`) |
| 19 | Configurator header/subcopy/precio base | `manual-order-customization-panel.tsx` | `manual-order-customization-panel.module.css` → `.header`, `.title`, `.subcopy`, `.basePrice` |
| 20 | Quantity control (parent) | `manual-order-customization-panel.tsx` | `.quantitySection`, `.quantityLabel*`, `.stepper*` |
| 21 | Option group card + badge + descripción | `manual-order-customization-panel.tsx` (`GroupSection`) | `.group`, `.groupHeader`, `.groupTitle`, `.groupBadge`, `.groupDescription` |
| 22 | Option row + selected state | `manual-order-customization-panel.tsx` | `.optionButton`, `.optionButtonPressed`, `.optionButtonDisabled`, `.optionName`, `.optionDescription`, `.optionDelta` |
| 23 | Quantity extra selected + stepper inline | `manual-order-customization-panel.tsx` (`QuantityOptionRow`) | `.qtyOptionCard`, `.qtyOptionCardSelected`, `.qtyOptionToggle` |
| 24 | Adicional/upsell group | `manual-order-customization-panel.tsx` | reutiliza `.group` + `.optionButton` (sin variante propia) |
| 25 | Error states (group + preview) | `manual-order-customization-panel.tsx` | `.groupIssue`, `.validationMessage`, `.blockedMessage`; compose: `__field-error`, `__alert--error` |
| 26 | Preview total configurator | `manual-order-customization-panel.tsx` | `.preview`, `.previewRow`, `.previewLabel`, `.previewValue` |
| 27 | Tap highlight admin | — | `components/admin/admin-shell.css` (`html:has(.admin-shell)`) — frozen |
| 28 | Tokens semánticos (light/dark) | — | `app/theme-tokens.css` — frozen |
| 29 | Breakpoint behavior | — | modal: `min-width:640/900`, `max-width:639/719/899`; shell: `min-width:720/1024`, `max-width:719` |

**Conclusión de ownership:** todo el polish visual del modal es alcanzable desde `manual-order-modal.module.css` y `manual-order-customization-panel.module.css`, **excepto el estado `disabled` del CTA**, cuyo único owner hoy es `app/globals.css` (`.ui-button:disabled { opacity: .6 }`). Cualquier fix del P1-1 debe hacerse con override **scoped** dentro del CSS module del modal, sin tocar el global.

---

## 7. Compose view audit

### 7.1 Modal shell

- ≤719px el panel es full-screen (`height:100dvh`, sin border/radius/shadow) → se comporta como pantalla nativa, correcto para Android Chrome. Overlay `black 74%` sin blur.
- En dark, el panel (`#17181D`) contra overlay 74% negro tiene separación baja: el modal se lee como "la app cambió de pantalla", no como sheet elevado. Aceptable en full-screen, pero a 899 (sheet centrado 600px) la separación depende sólo de `1px` border + `--shadow-premium`.
- Profundidad de superficie interna casi nula: `__customer-strip` (`bg-surface-soft 42%`), `__products-panel` (`bg-surface 98%`), `__summary-panel` (`bg-surface-soft 58%`) producen mezclas de ~2–6% sobre el fondo del panel. Medido en dark: panel `#17181D`, products panel `≈#17181D`, product row `≈#1A1C21`. En light: los tres quedan `≈#FEFEFE`.
- Región de scroll: no hay indicio visual de scroll salvo el scrollbar fino; el corte contra el footer no tiene fade ni máscara.

**Findings:** P2 (materialidad plana pero usable), P2 (falta afordancia de borde de scroll).

### 7.2 Header

- Jerarquía interna correcta (`h2` 1.02rem/650 + subtítulo 0.8rem secundario).
- ≤719px el header es grid 2×2: título fila 1 col 1, `×` fila 1 col 2, badge fila 2 col 1. El badge `PEDIDO MANUAL` queda flotando en su propia fila, sin relación fuerte con el título ni con el modo actual.
- **El header no refleja el modo.** En configurator sigue diciendo "Nuevo pedido / Cargá un pedido tomado manualmente" mientras el body muestra `h3` "Configurar Doble Smash" → dos títulos compitiendo y el sticky (más prominente) es el desactualizado.
- `×` es `34×34`, color `--text-tertiary`, sin border ni fondo; `:focus-visible` sí existe (`box-shadow 0 0 0 3px focus/30%`).
- `aria-label` del `×` y del overlay es **`"Cerrar detalle del pedido"`** en ambos → dos botones con el mismo nombre accesible y copy incorrecto para un modal de creación.
- El header tiene `border-bottom` sólido pero sin sombra/material al scrollear.

**Findings:** P2 (header no contextual), P2 (`aria-label` incorrecto/duplicado), P3 (badge sin anclaje), P3 (falta material al scrollear).

### 7.3 Cliente / Entrega

- Card con borde hairline y tinte ~42% de `bg-surface-soft`: se lee como bloque agrupado, aceptable.
- Labels `0.74rem/550` en `--text-secondary`: contraste OK en ambos temas.
- Inputs `min-height:36px` con `border-color: border-subtle 92%` y `background: bg-surface`. En dark los campos vacíos se leen como pozos oscuros con borde casi invisible. **No se observó relleno azul de focus/autofill** en el runtime local (el brief lo anticipaba desde capturas de producción con autofill de Chrome Android — queda como hipótesis no reproducida localmente).
- Segmented Retiro/Delivery: activo = `bg-surface` + `box-shadow 0 1px 2px`; inactivo = transparente. Funciona pero la diferencia es sutil en dark; altura de opción medida `40px` (bajo 44).
- Delivery address: al activar Delivery el campo aparece dentro del mismo grid (≥640px ocupa col 2, con spacer). No se observó salto de layout problemático.

**Findings:** P2 (materialidad/contraste de inputs en dark), P2 (tap target 40px), P3 (estado activo del segmented poco premium).

### 7.4 Productos

- Título/subtítulo correctos; search `min-height:38px` con `:focus-visible` propio (`--focus`).
- **Inversión de afordancia (hallazgo central):** las filas que **requieren configuración** reciben la variante `--blocked` (borde visible + tinte `bg-surface-soft 40%`), mientras las filas **directamente agregables** (Coca Cola, Sprite) quedan con `border: 1px solid transparent` y fondo a ~1–4/255 del panel. Resultado: los productos gateados parecen tarjetas y los agregables parecen texto sin estilo. Visible en dark y light.
- El `+` no comunica "configurar": mismo glifo y mismo componente para agregar y para abrir el configurator. El único diferenciador es el badge `Requiere personalización` y el hint `Tocá + para configurar opciones antes de agregar.` (este último en `--text-tertiary`, que en light falla AA).
- Badge junto al título: en `__product-title-row` con `flex-wrap`. A 390 el wrap es inconsistente (BBQ Bacon: badge en la misma línea del nombre y del precio; Doble Smash: badge baja a una segunda línea) → ritmo irregular entre filas hermanas.
- Precio `0.84rem/650` alineado a la derecha con `tabular-nums`, `min-width: 4.75rem`; compite en peso con el nombre (`0.88rem/650`).
- A ≤639px el grid pasa a áreas `"copy price" / "copy add"` → el `+` queda abajo a la derecha, separado verticalmente del nombre.

**Findings:** P2 (inversión de afordancia), P2 (`+` ambiguo), P2 (contraste `--text-tertiary` en light), P3 (wrap del badge), P3 (peso del precio).

### 7.5 Ticket vacío

- Estado vacío con borde dashed, título `Pedido vacío` y copy `Agregá productos desde el catálogo para armar el pedido.` → comunica el siguiente paso.
- `Total estimado $0,00` en variante `--idle` (0.95rem, `--text-secondary`): degradación correcta.
- **El CTA sí está deshabilitado con ticket vacío** (`canSubmit` requiere `hasSelectedItems`), pero visualmente sigue siendo azul saturado (§10). Con el ticket vacío es el elemento más dominante de la pantalla y es inerte.
- A 390/412 la sección Pedido queda **fuera del viewport inicial**: el operador ve Cliente/Entrega + Productos + CTA, y el ticket/total sólo aparecen al scrollear.

**Findings:** P1 (CTA inerte dominante, ver §10), P2 (ticket/total fuera del fold junto a un CTA visible).

### 7.6 Ticket con producto configurado

Estado auditado: `1 × Doble Smash` · `$ 14.500,00`; selecciones `Papas: Papas grandes (+$1.500)`, `Agregados extra: Cheddar (+$500)`; child `Adicional: Coca Cola 500ml ×1` · `$ 3.000,00`; `TOTAL ESTIMADO $ 17.500,00`.

- Jerarquía parent → selecciones → child → controles existe, pero se apoya casi sólo en tamaño de fuente. `__summary-chips` se llama "chips" y renderiza `li` de texto plano `0.74rem` sin superficie, sin separadores y sin agrupación por grupo.
- El child Adicional se distingue por un `border-left: 2px` de baja opacidad y `padding-left: 10px`. Es la única señal de anidamiento; no hay micro-superficie.
- Aritmética de precios ambigua: `$14.500` ya incluye `+$1.500` y `+$500`, pero los deltas se muestran otra vez en las líneas de selección → invita a sumar de nuevo. Sin subtotal intermedio entre parent y child.
- Controles `−` / `1` / `+` medidos `28×28` y `Quitar` `52×24`, con `gap: 6px` / `margin-left: 4px`: el control destructivo queda pegado al `+`, todos por debajo de 44px.
- `TOTAL ESTIMADO` en variante `--active` (1.2rem/750, `-0.02em`) tiene buen énfasis; convive con el CTA sin competir de forma grave.
- Densidad a 390: legible, pero el bloque Notas queda **dentro** del card del ticket, entre la lista y el total.

**Findings:** P2 (chips sin jerarquía real), P2 (aritmética densa), P2 (targets/adyacencia destructiva), P3 (ubicación de Notas).

---

## 8. Configurator view audit

### 8.1 Contexto

- **P1 — el configurator hereda el scroll de compose.** Medido al entrar: `scrollTop = 402` (Doble Smash, 390 dark) y `scrollTop = 452` (BBQ Bacon, 390 light). Consecuencia: el usuario aterriza en medio de los grupos ("Salsas") y **no ve** el `h3` "Configurar {producto}", el `Precio base`, el control `Cantidad` ni el primer grupo obligatorio. Reproducido dos veces, con dos productos y dos temas.
- Identidad de producto: existe (`h3` 1rem/650) pero es más débil que el título sticky del header, que además está desactualizado (§7.2).
- `Precio base` en `--text-tertiary`: en light `#A1A1AA` sobre blanco ≈ **2.5:1**, por debajo de AA para texto pequeño.
- `Cantidad`: card propio con label + hint `1–99` + stepper `30×30`. Prominencia razonable, targets chicos.
- Sensación de sub-paso: parcial. El body cambia por completo pero el chrome (header + badge) no, y no hay breadcrumb/back visual arriba; el único retorno es `Volver` en el footer.

**Findings:** P1 (scroll heredado / pérdida de contexto), P2 (header no contextual), P2 (contraste `--text-tertiary`), P2 (tap targets).

### 8.2 Grupos

Auditados: `Papas` (obligatorio, single), `Salsas` (opcional, múltiple máx. 5), `Agregados extra` (opcional con cantidad, máx. 5 opciones), `Adicional` (upsell).

- Los cards de grupo (`.group`) usan `background: var(--bg-surface)` + `box-shadow: var(--shadow-sm)` + borde hairline: **tienen más materialidad que los paneles de compose**, lo que produce dos lenguajes de profundidad dentro del mismo modal.
- Títulos `h4` 0.86rem/650 + badge pill a la derecha con `max-width:55%` y `text-align:right`.
- Copy de badges inconsistente en longitud: `Obligatorio` / `Opcional · máx. 5` / `Opcional · máx. 5 opciones` / `Opcional`. El más largo empuja el título.
- Descripciones `0.76rem` en `--text-secondary`: legibles.
- Filas no seleccionadas: pill con borde hairline y fondo `bg-surface-soft 28%` → afordancia clara (mejor que las filas de producto de compose).
- Precios: deltas `+$ 1.500` a la derecha; opciones sin costo muestran **nada** en grupos normales y **`Sin costo`** en grupos con cantidad → dos tratamientos para el mismo concepto.

**Findings:** P2 (dos lenguajes de profundidad), P3 (copy/ancho de badges), P3 (`Sin costo` inconsistente).

### 8.3 Selected states

- Single/múltiple: `.optionButtonPressed` = borde `accent-primary 55%` + fondo `accent-soft 62%` + `inset ring`. Legible en dark y light.
- Quantity extra: `.qtyOptionCardSelected` = borde `accent-primary 45%` + fondo `accent-soft 48%` y revela el stepper inline `− 1 +`. Buena señal de estado.
- **Selección color-only en lo visual** (sin check/icono). En la capa accesible sí hay `aria-pressed` (`pressed`/`released`) verificado en el snapshot.
- **El Adicional/upsell usa exactamente el mismo `optionButton` seleccionado que un ingrediente**, aunque semánticamente se convierte en una línea hija facturada aparte. La única pista es el formato de precio (absoluto `$ 3.000,00` vs delta `+$ 500`).
- Estado `atMax` usa `.optionButtonDisabled` (`opacity:.5`) — distinguible de seleccionado, pero indistinguible de un `disabled` global.
- **No hay regla `:focus-visible`** para `.optionButton`, `.qtyOptionToggle` ni `.stepperButton` en el CSS del panel (a diferencia de compose, que sí la define para `__search` y `__add-button`).

**Findings:** P2 (upsell visualmente indistinguible de ingrediente), P2 (falta `:focus-visible` en controles del configurator), P3 (selección color-only, sin check).

### 8.4 Required error state

- Semántica correcta: `Agregar` está **realmente deshabilitado** cuando falta un grupo obligatorio (verificado: `disabled = true`, y pasa a habilitado al elegir `Papas grandes`, total `$13.000 → $14.500`).
- **P1 — el motivo del bloqueo no está a la vista.** Al entrar (con scroll heredado) el error existe duplicado en dos nodos y ninguno queda en el viewport: `role="alert"` del grupo medido a `top: 46px` (detrás del header sticky) y `role="status"` del preview a `top: 844px` (por debajo del fold de `623px`). El usuario ve un botón azul que "no hace nada" sin explicación visible.
- **Error prematuro:** el configurator recién abierto, sin ninguna interacción, ya muestra `Elegí una opción en "Papas".`. Es un error antes del intento.
- **Mensaje duplicado:** el mismo texto se renderiza dos veces (grupo + preview), con roles distintos (`alert` y `status`).
- Contraste del error: `--text-cancelled-strong` (`#B91C1C` light / `#fca5a5` dark) → adecuado.
- El copy del CTA no cambia cuando está bloqueado: sigue `Agregar · $ 13.500,00`.

**Findings:** P1 (motivo de bloqueo fuera de vista), P2 (error prematuro), P2 (mensaje duplicado), P3 (copy del CTA no refleja bloqueo).

### 8.5 Footer del configurator

- Estructura: `Volver` (secundario) + `Agregar · monto` (primario); a ≤639px `column-reverse` y ambos full-width → el primario queda arriba, jerarquía correcta.
- Material: `background: color-mix(bg-surface 96%, transparent)` + `backdrop-filter: blur(6px)` + `border-top` hairline. **Sin fade/máscara**: la última fila del body queda cortada a mitad de altura y se lee como "acá termina el contenido" (observado a 390 en el grupo Adicional y a 899 en el ticket).
- Safe area: cubierta por el padding inferior del shell body (`max(12px, env(safe-area-inset-bottom))` a ≤719px). El footer vive dentro de ese contenedor → no se detectó recorte por barra del sistema.
- El footer **no tapa** contenido (es hermano en flujo flex, no superpuesto), pero el corte sin fade sugiere lo contrario.
- `Agregar` full-width en azul saturado mientras está bloqueado se siente pesado (§10).

**Findings:** P2 (sin afordancia de borde de scroll), P1 (estado disabled, §10).

---

## 9. Ticket summary audit

| Dimensión | Evaluación |
|-----------|------------|
| Jerarquía parent | `1 × Doble Smash` 0.86rem/600 + subtotal 0.84rem/650 → correcto pero de bajo contraste jerárquico frente a las selecciones |
| Legibilidad de selecciones | `li` de texto plano 0.74rem `--text-secondary`, sin superficie ni agrupación; nombre de grupo repetido por línea (`Papas:`, `Agregados extra:`) |
| Legibilidad de extras | Igual que selecciones; la cantidad del extra no aparece en el chip (`Cheddar (+$500)` sin `×1`) |
| Asociación del Adicional | `border-left: 2px` + indent + label `Adicional:`; funciona, sin micro-superficie |
| Claridad de precios | Parent incluye deltas pero los deltas se repiten; child con precio propio; total al pie. Sin subtotal intermedio → requiere aritmética mental |
| Controles de cantidad | `28×28`, `Quitar` `52×24` pegado al `+`; sub-44px y riesgo de mis-tap destructivo |
| Densidad a 390 | Aceptable con 1 línea configurada; con 2–3 líneas configuradas el bloque se vuelve un párrafo continuo |
| Root count | Correcto: el child Adicional no infla el conteo raíz (consistente con MODE B `#TJK9R5`) |

---

## 10. CTA / footer audit

**P1 — el estado `disabled` del CTA primario es visualmente casi idéntico al habilitado.**

Evidencia de source: el único owner del estado es `app/globals.css`

```
.ui-button:disabled { cursor: not-allowed; opacity: 0.6; transform: none; }
.ui-button--primary { background: var(--color-primary); color: #fff; }
```

`--color-primary` = `var(--accent-primary)` = `#2563eb`, sin override en dark. No hay desaturación, ni fondo neutro, ni cambio de borde, ni cambio de copy.

Evidencia de runtime (computed):

| Estado | `background-color` | `opacity` | `disabled` |
|--------|--------------------|-----------|------------|
| `Crear pedido` con ticket vacío | `rgb(37, 99, 235)` | `0.6` | `true` |
| `Agregar · $13.000,00` con obligatorio faltante (dark) | `rgb(37, 99, 235)` | `0.6` | `true` |
| `Agregar · $13.500,00` con obligatorio faltante (light) | `rgb(37, 99, 235)` | `0.6` | `true` |
| `Agregar · $14.500,00` válido | `rgb(37, 99, 235)` | `1` | `false` |

En dark el delta es un azul navy vs azul brillante; en light es un azul claro vs azul saturado. En ambos casos el botón sigue leyéndose como acción primaria disponible, y es el único elemento cromático de la pantalla.

**P1 — `Crear pedido` se habilita con campos obligatorios vacíos.**

Verificado en runtime: con el ticket configurado y `customer_name = ""`, `phone = ""`, el CTA está **habilitado** (`disabled = false`). `canSubmit` sólo exige sesión + productos + ticket válido; nombre/teléfono/dirección se validan al hacer submit (`validateForm`). Los errores resultantes se renderizan **dentro del card Cliente/Entrega**, en el tope de un body de `1025px` de scroll, sin scroll-to-error, sin resumen de errores cerca del footer y sin foco programático. A 412 el ticket y el total ni siquiera están en el viewport cuando el CTA está visible.

Nota de alcance: la habilitación es una decisión de lógica (`canSubmit`), no de CSS. La parte **visual** (falta de relación error↔CTA, ausencia de resumen junto al footer, CTA sin estado "bloqueado" legible) es lo que corresponde a las microfases de polish; cambiar `canSubmit` sería un cambio funcional y queda fuera de polish.

**Resto del footer**

| Item | Evaluación |
|------|------------|
| `Crear pedido` con ticket vacío | Disabled real, pero visualmente activo → P1 |
| `Crear pedido` válido | Correcto; a <640px **pierde el monto** (`Crear pedido`), a ≥640px lo muestra (`Crear pedido · $ 17.500,00`) → asimetría justo en el momento de confirmación |
| `Agregar` incompleto | Disabled real, motivo fuera de vista → P1 |
| `Agregar` válido | Correcto, con monto |
| `Volver` | Secundario, jerarquía correcta; en light casi invisible (fondo `--color-card` + borde `--color-border` legacy) |
| `Cancelar` | Igual que `Volver`; full-width debajo del primario a ≤639px |
| Safe area | Cubierta por el shell body; sin recorte observado |
| Cobertura de contenido | El footer no superpone contenido, pero sin fade el corte parece truncamiento |
| Material | `bg-surface 96%` + `blur(6px)` + borde hairline; sin separador fuerte ni sombra |

---

## 11. Surface / materiality audit

| Capa | Dark (medido) | Light (medido/derivado) | Lectura |
|------|----------------|--------------------------|---------|
| Panel del modal | `#17181D` | `#FFFFFF` | base |
| Products panel | `≈#17181D` (`srgb .0909 .0948 .1144`) | `≈#FEFEFE` | indistinguible de la base |
| Product row | `≈#1A1C21` (`srgb .1043 .1082 .1278`), borde `rgba(255,255,255,.069)` | `≈#FEFEFE`, borde transparente | fila casi sin superficie |
| Summary panel (ticket) | `≈#1C1D22`, borde `rgba(214,222,232,.28)` | `≈#F7F9FB` | **la superficie mejor definida del modal** (borde 4× más fuerte) |
| Customer strip | `bg-surface-soft 42%` | `≈#F9FBFC` | agrupación tenue |
| Group card (configurator) | `--bg-surface` + `--shadow-sm` | `#FFF` + `--shadow-sm` | más material que compose |
| Option row | `bg-surface-soft 28%` + borde hairline | `≈#FBFCFD` | afordancia clara |

Conclusiones:

1. El modal tiene **dos lenguajes de materialidad**: compose (mezclas de 2–6%, sin sombras) vs configurator (cards con `--shadow-sm`). El mismo modal se siente de dos calidades distintas.
2. La jerarquía de superficies no acompaña la jerarquía de importancia: el ticket (lo más importante) está bien, pero las filas de producto (la zona de trabajo principal) son las más planas.
3. **Dos hues de acento en el mismo modal:** compose usa `--focus` `#6366f1` (product-row `--selected`, badge `EN PEDIDO`, focus del search, hover del `+`) y configurator/CTA usan `--accent-primary` `#2563eb`. Son dos azules distintos para "seleccionado/activo".

---

## 12. Light theme audit

- Predomina blanco sobre blanco: panel, products panel, summary panel y filas quedan en `#FE–#FF`; toda la separación depende de bordes hairline uniformes.
- Bordes demasiado uniformes: casi todo usa `border-subtle` a 78–92%, sin escala de énfasis (salvo el borde del summary panel).
- Selected states: correctos y legibles (`accent-soft` sobre blanco).
- **Dominancia del CTA azul:** es el único color saturado de la pantalla; con el CTA deshabilitado en `opacity .6` se convierte en un azul medio que sigue leyéndose como disponible.
- Inputs completados: no se reprodujo localmente el relleno azul de autofill; los inputs vacíos/llenos se leen neutros.
- **Contraste secundario/terciario:** `--text-secondary` `#52525B` sobre blanco ≈ 7.4:1 (OK). `--text-tertiary` `#A1A1AA` sobre blanco ≈ **2.5:1 → falla AA** y se usa en `Precio base`, hint `1–99` y `Tocá + para configurar opciones antes de agregar.`.
- Botones secundarios (`Cancelar`/`Volver`) usan tokens legacy (`--color-card`, `--color-border`) y quedan como franjas blancas apenas perceptibles.

---

## 13. Dark theme audit

**Auditado en browser (local autenticado), no inferido de capturas light.**

- Fondo del modal vs section cards: delta mínimo (§11) → las secciones se perciben por borde, no por superficie.
- Selected states: legibles; `accent-soft` en dark es `rgba(96,165,250,.16)` mientras los bordes usan `accent-primary #2563eb` → el relleno es más frío/claro que el borde, mezcla algo incoherente pero funcional.
- Bordes: `rgba(255,255,255,.069)` en filas es el punto más débil; el ticket a `.28` demuestra que existe margen de escala.
- Intensidad del CTA: `#2563eb` sobre `#17181D` funciona; el `disabled` a `.6` produce un navy que se lee como botón normal en superficie oscura → **peor discriminación que en light**.
- Footer: `bg-surface 96%` + blur sobre fondo oscuro casi no se distingue del body; sólo el borde hairline lo delimita.
- Focus rings: presentes en shell `×`, `__search`, `__add-button`, `__remove-button`; **ausentes** en los controles del configurator.
- Estados disabled: `opacity .45/.5` en steppers y `+` → consistente y comprensible.
- Empty state: dashed border legible.
- Ticket: legible; los chips de 0.74rem en `#CBD5E1` son el límite inferior aceptable de densidad.

---

## 14. Accessibility / touch audit

| Check | Resultado | Detalle |
|-------|-----------|---------|
| Tap targets ≥44px | **FALLA parcial** | `+` producto `34×34`; qty ticket `28×28`; `Quitar` `52×24`; steppers configurator `30×30`; `×` shell `34×34`; opción segmented `h=40`. Sólo `.ui-button` cumple (`min-height:44px`) |
| Focus-visible | **PARCIAL** | OK en `×`, search, `+`, `Quitar`, `.ui-button`. Sin regla en `.optionButton`, `.qtyOptionToggle`, `.stepperButton` |
| Selected no color-only | **PARCIAL** | Visualmente color-only (sin check); accesiblemente OK vía `aria-pressed` (verificado `pressed`/`released`) |
| Disabled comprensible | **FALLA en CTA primario** | `opacity .6` sobre azul saturado; OK en steppers (`.45/.5`) |
| Error visible/asociado | **FALLA** | Errores con `role="alert"`/`role="status"` pero fuera del viewport al entrar; duplicados; sin `aria-describedby` desde el CTA; en compose los errores de campo no están vinculados por `aria-describedby` (sólo `aria-invalid`) |
| Close button accesible | **PARCIAL** | Alcanzable y con focus inicial, pero `aria-label` `"Cerrar detalle del pedido"` incorrecto y **duplicado** entre overlay y `×` |
| Sticky footer no atrapa foco | OK | Footer en flujo, no superpuesto |
| `Volver` vs `×` | **AMBIGUO** | `×` cierra todo el modal (descarta el ticket), `Volver` vuelve a compose; visualmente el `×` no advierte pérdida de trabajo |
| Focus trap | **AUSENTE** | `AdminOrderModalShell` implementa `Escape` + foco inicial + scroll lock, sin trap de Tab |
| Escape | OK | Cierra el modal desde cualquier vista (también descarta el ticket sin confirmación) |
| Safe area Android | OK | `env(safe-area-inset-*)` en shell/header/body |
| Tap highlight | OK | Neutralizado admin-wide en `admin-shell.css`, sin afectar focus |

---

## 15. Findings (P0 / P1 / P2 / P3)

### P0 — ninguno

El modal abre, scrollea, cierra, valida y permite completar el flujo. Sin fallas de contraste que impidan el uso.

### P1

| ID | Finding | Evidencia | Owner |
|----|---------|-----------|-------|
| **P1-1** | Estado `disabled` del CTA primario visualmente indistinguible del habilitado (sólo `opacity .6` sobre azul saturado) | computed `rgb(37,99,235)` / `opacity .6` en 3 estados bloqueados vs `opacity 1` habilitado; dark y light | `app/globals.css` `.ui-button:disabled` → **fix scoped** en `manual-order-modal.module.css` |
| **P1-2** | `Crear pedido` habilitado con `Nombre`/`Teléfono` vacíos y errores que aparecen fuera del viewport, sin resumen junto al CTA ni scroll-to-error | `disabled=false` con `customer_name=""`, `phone=""`; body `scrollHeight 1025` vs `clientHeight 623` | lógica: `manual-order-modal.tsx` (`canSubmit`/`validateForm`) · visual: CSS module + ubicación del mensaje |
| **P1-3** | El configurator hereda el `scrollTop` de compose: header "Configurar X", precio base, `Cantidad` y el primer grupo obligatorio quedan fuera de vista al entrar | `scrollTop` heredado `402` (Doble Smash/dark) y `452` (BBQ Bacon/light) | `manual-order-modal.tsx` (reset de scroll al cambiar `view`) |
| **P1-4** | A 900–1023px el nombre/categoría del producto desborda su celda de grid y se pinta **sobre** el precio | a 900px: celda `copy` `56px`, `category.right = 290` vs `price.left = 259` → **31px de solape**; a 1440px `overlap = 0` | `manual-order-modal.module.css` (`__workstation` `min-width:900`, `__product-row`, `__product-price min-width`) + `admin-order-modal.module.css` (`--workstation max-width:600px` hasta 1024) |

### P2

| ID | Finding |
|----|---------|
| **P2-1** | Inversión de afordancia: las filas que requieren configuración parecen tarjetas y las agregables parecen texto sin estilo (`border: transparent`, superficie a 1–4/255 del panel) |
| **P2-2** | Motivo de bloqueo del configurator fuera de vista + error duplicado (`role="alert"` de grupo a `top 46` detrás del header, `role="status"` de preview a `top 844` bajo el fold de `623`) |
| **P2-3** | Dos hues de acento en el mismo modal: `--focus #6366f1` (compose) vs `--accent-primary #2563eb` (configurator/CTA) |
| **P2-4** | Dos lenguajes de materialidad: compose sin sombras y con mezclas de 2–6% vs configurator con `--shadow-sm` y cards definidos |
| **P2-5** | Tap targets sub-44px en 6 controles (`+` 34, qty 28, `Quitar` 24 alto, steppers 30, `×` 34, segmented 40) |
| **P2-6** | `Quitar` (destructivo) adyacente a `+` con `gap 6px`/`margin-left 4px` y `24px` de alto → riesgo de mis-tap en 390px |
| **P2-7** | `--text-tertiary` sobre blanco ≈ 2.5:1 (falla AA) en `Precio base`, hint `1–99` y hint `Tocá + para configurar…` |
| **P2-8** | El header sticky no refleja el modo: "Nuevo pedido" compite con el `h3` "Configurar {producto}" |
| **P2-9** | Ticket: `__summary-chips` son texto plano sin jerarquía de chip/grupo; extras sin cantidad en el chip; aritmética de precios repetida sin subtotal |
| **P2-10** | El Adicional/upsell seleccionado es visualmente idéntico a un ingrediente pese a generar línea hija facturada aparte |
| **P2-11** | Error obligatorio prematuro: se muestra en un configurator prístino, antes de cualquier interacción |
| **P2-12** | Sin afordancia de borde de scroll (footer sin fade/máscara): la última fila queda cortada y se lee como contenido truncado (390 y 899) |
| **P2-13** | `aria-label` de cierre incorrecto (`"Cerrar detalle del pedido"` en un modal de creación) y duplicado entre overlay y `×`; `×` descarta el ticket sin advertencia |
| **P2-14** | Sin `:focus-visible` para `.optionButton` / `.qtyOptionToggle` / `.stepperButton`; sin focus trap en el shell |
| **P2-15** | El CTA mobile (<640px) pierde el monto mientras el del configurator siempre lo muestra |
| **P2-16** | Contraste/materialidad de inputs en dark: bordes a `border-subtle 92%` sobre `bg-surface`, campos casi sin definición |
| **P2-17** | Ticket y total fuera del viewport inicial a 390/412 mientras el CTA está visible |
| **P2-18** | Sin QA autenticado en producción (`/admin/dashboard` → `/admin/login`); evidencia de producción es reportada por el operador |

### P3

| ID | Finding |
|----|---------|
| **P3-1** | Cuatro formatos monetarios en un flujo: `$ 13.500,00`, `+$ 1.500`, `(+$1.500)`, `$ 3.000,00` |
| **P3-2** | Opciones sin costo: blanco en grupos normales vs `Sin costo` en grupos con cantidad |
| **P3-3** | Ancho/copy de badges de grupo inconsistente (`Opcional · máx. 5` vs `Opcional · máx. 5 opciones`) |
| **P3-4** | Badge `PEDIDO MANUAL` flotando en la fila 2 del header, sin anclaje al título |
| **P3-5** | Wrap inconsistente del badge `Requiere personalización` entre filas hermanas a 390px |
| **P3-6** | Notas anidadas dentro del card del ticket, entre la lista y el total |
| **P3-7** | Empty state del ticket correcto pero plano (sin ilustración/icono ni jerarquía secundaria) |
| **P3-8** | El copy del CTA no cambia cuando está bloqueado |
| **P3-9** | Header sin material/sombra al scrollear |
| **P3-10** | Selección sin check/icono (color-only en la capa visual) |
| **P3-11** | Cobertura de matriz incompleta: 412 light, 899 light, 900 dark, 1440 dark no ejecutados |

---

## 16. Recommended implementation sequence

Se **modifica** el orden propuesto en el brief: se inserta una microfase nueva en posición 2 porque **P1-4 es un defecto de layout con solape real de texto**, contenido y de bajo riesgo, y no encaja en ninguna de las fases previstas.

1. **`ADMIN-MANUAL-ORDER-MODAL-CTA-FOOTER-STATES-POLISH-1`** — P1-1, P2-12, P2-15, P3-8 (+ preparación visual para P1-2).
2. **`ADMIN-MANUAL-ORDER-MODAL-BREAKPOINT-OVERFLOW-FIX-1`** *(nueva)* — P1-4.
3. **`ADMIN-MANUAL-ORDER-MODAL-CONFIGURATOR-CONTEXT-POLISH-1`** — P1-3, P2-2, P2-8, P2-11, P2-14, P3-3.
4. **`ADMIN-MANUAL-ORDER-MODAL-TICKET-SUMMARY-HIERARCHY-POLISH-1`** — P2-9, P2-10, P2-6, P3-1, P3-6.
5. **`ADMIN-MANUAL-ORDER-MODAL-SURFACE-MATERIALITY-POLISH-1`** — P2-1, P2-3, P2-4, P2-5, P2-7, P2-16, P3-4, P3-5, P3-7.
6. **`ADMIN-MANUAL-ORDER-MODAL-FINAL-VISUAL-QA-1`** — matriz completa light/dark, P2-18, P3-11, y decisión explícita sobre P1-2 (parte lógica).

**P1-2** requiere una decisión de producto antes de implementar: (a) deshabilitar `Crear pedido` hasta que nombre/teléfono/dirección sean válidos (cambio funcional en `canSubmit`), o (b) mantenerlo habilitado y agregar resumen de errores + scroll/foco al primer error (cambio de UX/markup). No se resuelve en una fase puramente CSS.

---

## 17. Proposed future microphases

### Fase 1 — `ADMIN-MANUAL-ORDER-MODAL-CTA-FOOTER-STATES-POLISH-1`

- **Scope:** estado visual `disabled`/`enabled` del CTA primario (override scoped, no global); material del footer sticky (fade/máscara/separador); relación visual error↔botón; espaciado safe-area; paridad del monto en el label mobile.
- **Allowed files:** `components/admin/orders/manual-order-modal.module.css`, `docs/*`. Cambio mínimo en `manual-order-modal.tsx` **sólo** si el label mobile requiere markup (evaluar primero solución CSS).
- **Hard boundaries:** no tocar `app/globals.css` ni `app/theme-tokens.css`; no cambiar `canSubmit`/`validateForm`; no tocar el configurator panel; no romper single-scroll; sin órdenes reales.
- **Reason:** P1-1 es el hallazgo de mayor impacto/menor riesgo y está aislado en un solo selector.

### Fase 2 — `ADMIN-MANUAL-ORDER-MODAL-BREAKPOINT-OVERFLOW-FIX-1`

- **Scope:** eliminar el solape texto/precio en 900–1023px (alinear el breakpoint del grid workstation con el `max-width` real del panel, y/o contener el overflow de `__product-copy`/`__product-name`/`__product-category`, y/o revisar `min-width` del precio y el `minmax(300px, …)` de la columna derecha).
- **Allowed files:** `components/admin/orders/manual-order-modal.module.css`; `components/admin/orders/admin-order-modal.module.css` **sólo** si el fix exige el breakpoint del panel (requiere verificar que no afecta el workspace modal, que comparte ese archivo).
- **Hard boundaries:** no alterar layout ≤899px (frozen), ni ≥1024px verificado; no tocar el workspace/preparation; sin cambios de lógica.
- **Reason:** único hallazgo con solape visual real de contenido.

### Fase 3 — `ADMIN-MANUAL-ORDER-MODAL-CONFIGURATOR-CONTEXT-POLISH-1`

- **Scope:** reset de scroll al entrar/salir del configurator; header contextual por modo; ubicación y de-duplicación del error obligatorio; error no prematuro; `:focus-visible` en controles del panel; badges de grupo.
- **Allowed files:** `manual-order-customization-panel.module.css`, `manual-order-modal.module.css`, y cambios acotados en `manual-order-modal.tsx` / `manual-order-customization-panel.tsx` para scroll-reset y header contextual.
- **Hard boundaries:** no cambiar validación (`validateCustomizationSelection`, `isManualOrderCustomizationDraftValid`), ni `selection-v2`, ni payload/snapshot, ni `lib/product-customization/*`.
- **Reason:** P1-3 requiere un cambio mínimo de comportamiento de vista (no de dominio).

### Fase 4 — `ADMIN-MANUAL-ORDER-MODAL-TICKET-SUMMARY-HIERARCHY-POLISH-1`

- **Scope:** jerarquía real de chips/grupos en el resumen; presentación anidada del Adicional; alineación y unificación de formatos de precio; separación del control destructivo; jerarquía del total; ubicación de Notas.
- **Allowed files:** `manual-order-modal.module.css` + `manual-order-modal.tsx` (sólo markup presentacional).
- **Hard boundaries:** no cambiar `lib/orders/manual-order-customization-ticket.ts` ni `manual-order-customization-payload.ts` ni el payload de submit; root count intacto.
- **Reason:** legibilidad del ticket es lo que evita pedidos mal cargados.

### Fase 5 — `ADMIN-MANUAL-ORDER-MODAL-SURFACE-MATERIALITY-POLISH-1`

- **Scope:** profundidad de secciones/cards; corregir la inversión de afordancia de filas de producto; unificar el hue de acento del modal; escala de bordes; tap targets ≥44px; reemplazar `--text-tertiary` en textos pequeños de light; estados de input.
- **Allowed files:** `manual-order-modal.module.css`, `manual-order-customization-panel.module.css`.
- **Hard boundaries:** sin nuevos tokens globales salvo que sean semánticos y reutilizables (excepción documentada de `.cursorrules`); no tocar dashboard/drawer/toolbar/footer.
- **Reason:** es la fase más amplia; conviene ejecutarla cuando estados y layout ya están estabilizados.

### Fase 6 — `ADMIN-MANUAL-ORDER-MODAL-FINAL-VISUAL-QA-1`

- **Scope:** matriz completa 390/412/899/900/1440 × light/dark; smoke read-only de producción (con sesión admin de producción si se habilita); cierre de P2-18 y P3-11; decisión de P1-2.
- **Hard boundaries:** sin órdenes reales salvo autorización explícita separada.

---

## 18. Non-goals / hard boundaries

**No ejecutado en esta fase**

- Ningún cambio de código, CSS, SQL, migración o RPC.
- Ninguna orden creada (0), ninguna mutación de status (0), ningún WhatsApp enviado (0).
- Ningún commit, push o deploy.
- No se tocó: `app/admin/(protected)/orders/actions.ts`, `manual-order-modal.tsx`, `manual-order-modal.module.css`, `manual-order-customization-panel.*`, `components/admin/orders/*`, `admin-shell.css`, `admin-mobile-drawer.css`, `layout/admin-footer.*`, `dashboard-*`, `lib/orders/*`, `lib/products/admin.ts`, `lib/product-customization/*`, `lib/whatsapp/*`, `supabase/migrations/*`, `types/database.ts`, `app/b/[slug]/*`, `components/public/*`, `app/globals.css`, `app/theme-tokens.css`, `package.json`.

**Interacciones runtime realizadas (read-only respecto del servidor)**

Se abrió el modal, se abrió el configurator, se seleccionaron opciones y se agregó una línea al ticket **en memoria del cliente**, sin invocar `createManualOrderAction` ni ninguna mutación. Se forzó `data-dashboard-theme="light"` temporalmente vía CDP y se restauró a `dark`; el modal se cerró con `Cancelar` al finalizar. No hubo llamadas a `create_order`.

---

## 19. Files changed

| Archivo | Tipo |
|---------|------|
| `docs/admin-manual-order-modal-visual-hierarchy-audit-1.md` | nuevo (este doc) |
| `docs/CURRENT_PHASE.md` | actualizado |
| `ORDEROPS_LIVING_MEMORY.md` | actualizado |
| `docs/admin-dashboard-forensic-living-audit.md` | actualizado (changelog + nota de ownership del modal manual) |

- runtime/code: **NONE**
- CSS: **NONE**
- SQL/migration: **NONE**
- DB/RPC: **NONE**
- public checkout/catalog: **NONE**
- dashboard logic: **NONE**
- Preexistente/generado (no de esta fase): `tsconfig.tsbuildinfo`

---

## 20. Gate

```text
ADMIN-MANUAL-ORDER-MODAL-VISUAL-HIERARCHY-AUDIT-1 = AUDIT COMPLETE WITH BLOCKING P1/P2 FINDINGS

MODAL VISUAL HIERARCHY: AUDITED
COMPOSE VIEW: AUDITED
CONFIGURATOR VIEW: AUDITED
TICKET SUMMARY: AUDITED
CTA / FOOTER: AUDITED
LIGHT THEME: AUDITED (runtime + operator-reported production screenshots)
DARK THEME: AUDITED (runtime local authenticated)
ACCESSIBILITY / TOUCH: AUDITED
P0: 0
P1: 4
P2: 18
P3: 11
IMPLEMENTATION: NONE
MANUAL ORDER MODAL FUNCTIONALITY: REMAINS CLOSED / FROZEN
MANUAL ORDER SUBMIT FLOW: REMAINS VERIFIED (#TJK9R5)
MANUAL MODAL SINGLE-SCROLL: REMAINS FROZEN (verified at 390/412/900)
CREATE_ORDER RPC: UNCHANGED
DB SCHEMA/MIGRATIONS: UNCHANGED
PUBLIC CHECKOUT/CATALOG: UNCHANGED
DASHBOARD FROZEN SURFACES: PRESERVED
ORDERS CREATED: 0
STATUS MUTATION: 0
WHATSAPP SEND: 0
PRODUCTION AUTH QA: NOT AVAILABLE (P2-18)
NEXT PHASE: ADMIN-MANUAL-ORDER-MODAL-CTA-FOOTER-STATES-POLISH-1

No code. No CSS. No DB. No orders. No commit. No push. No deploy.
```
