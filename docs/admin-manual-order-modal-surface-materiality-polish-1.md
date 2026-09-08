# ADMIN-MANUAL-ORDER-MODAL-SURFACE-MATERIALITY-POLISH-1 — PASS

Fecha: 2026-09-08
Modo: IMPLEMENTATION FAST MODE · FEATURE-LOCAL VISUAL POLISH · MANUAL ORDER MODAL ONLY

## 1. Objective

Dar al modal manual una jerarquía de superficies legible en lugar de la sensación plana de
blanco-sobre-blanco (light) y gris-sobre-gris (dark), sin tocar lógica, dominio, tokens globales,
primitivas compartidas ni el shell del modal.

## 2. Findings addressed

| Finding | Estado | Causa raíz encontrada |
|---------|--------|------------------------|
| P2-1 affordance inversion de product rows | **CLOSED** | `.manual-order-modal__product-row` tenía `border: 1px solid transparent`: las rows simples quedaban pegadas al panel y las configurables parecían más interactivas sólo porque su `:hover` sí pintaba borde. |
| P2-3 dos lenguajes de acento | **CLOSED LOCALLY** | El configurador ya usaba `--accent-primary` / `--accent-soft` para hover/selected, mientras compose usaba `--focus` (`#6366f1`) para lo mismo. Dos azules distintos para un mismo significado. |
| P2-4 materialidades distintas | **CLOSED** | Compose pintaba las secciones con mezclas de `--bg-surface-soft` y las rows casi en `--bg-surface` (invertido), mientras el configurador hacía group card en `--bg-surface` + `--shadow-sm`. |
| P2-7 `--text-tertiary` demasiado tenue en light | **IMPROVED LOCALLY** | `--text-tertiary` (`#A1A1AA`) se usaba para texto que transmite información real (hint de configuración, precio base, labels de grupo del ticket). |
| P2-16 inputs / segmented / rows planos, sobre todo dark | **CLOSED** | `--border-subtle` es sólo `rgba(255,255,255,0.08)` en dark; los hairlines desaparecían y los inputs compartían `background: var(--bg-surface)` con su propia section card. |

## 3. Material hierarchy

Escala feature-local declarada sobre `.manual-order-modal__form` y redeclarada sobre `.panel`
(el configurador queda autosuficiente y no depende en silencio del módulo padre):

```
level 0  modal/content background            (shell compartido — intacto)
level 1  --mo-surface-section + --mo-border-section + --mo-shadow-section
level 2  --mo-surface-row     + --mo-border-row
```

Las rows se derivan siempre mezclando hacia `--bg-surface-soft`, que resulta **más oscuro** que la
section en light y **más claro** en dark: una sola fórmula separa ambos temas.

Level 1 aplicado a: `__customer-strip`, `__products-panel`, `__summary-panel`, `.group`, `.quantitySection`.
Level 2 aplicado a: product rows, inputs, `__search`, notas, `.optionButton`, `.qtyOptionCard`,
`__ticket-empty`, `__empty-products`, `__summary-upsells`, badges.

Medido en runtime (dark): section `rgb(23,24,29)` vs row `srgb(0.111, 0.115, 0.134)` — row más clara
que la section, con hairline `rgba(255,255,255,0.1)` en lugar de `0.08` invisible.

## 4. Product rows

Todas las rows comparten la misma base level 2 (surface + hairline de 1px; el ancho de borde no
cambió, sólo su color, así que la geometría de fila queda intacta).

- Simple: superficie y borde neutros perceptibles; `+` sigue siendo la acción.
- Configurable: misma base + señal muy suave (`--mo-accent-hint-border` / `--mo-accent-hint-surface`).
  No se convirtió en CTA azul, no se cambió `+` por `Configurar`, no se tocó comportamiento.
- Selected: `--mo-selected-border` / `--mo-selected-surface` (familia accent-primary), claramente por
  encima del hint del configurable.
- Blocked: mantiene la base y su `opacity: 0.78`.

## 5. Inputs / segmented

Inputs (cliente, teléfono, dirección, búsqueda, notas): recessed contra la section card
(`--mo-surface-row`) con hairline `--mo-border-row`. Medido en light: input
`srgb(0.968, 0.977, 0.986)` sobre section `rgb(255,255,255)` — un campo completo ya no se lee como
si estuviera focused. El tratamiento de focus quedó tal cual.

Segmented Retiro/Delivery: track recessed (`--mo-surface-recessed` + inset shadow suave); inactivo
transparente y quiet; activo levantado sobre `--mo-surface-section` con borde accent-tinted, texto
primario, `font-weight: 600` y `--mo-shadow-raised`.

**Tamaños sin cambio:** el estado activo añade `1px` de borde y compensa el padding `6px 12px → 5px 11px`.
Medición runtime: ambas opciones `32 × 88px` exactamente.

## 6. Configurator parity

`.group` y `.quantitySection` pasaron a la misma familia level 1 que compose (mismo border, radius,
surface y `--mo-shadow-section`, reemplazando `--shadow-sm`). `.optionButton` y `.qtyOptionCard`
pasaron a level 2, de modo que se leen como inner rows y no como section cards completas.
`.optionButtonPressed` y `.qtyOptionCardSelected` siguen distinguibles y ahora usan la misma familia
de accent que el selected de compose. Badge required/optional sigue secundario. No se tocó el header
contextual, el `scrollTop`, la ubicación del error, `Completá las opciones` ni el `focus-visible`
de la fase anterior.

Contraste selectivo (P2-7): `--mo-text-aux` = `color-mix(--text-secondary 80%, --text-tertiary)`
aplicado sólo a `__product-blocked-hint`, `__summary-group-label`, `.basePrice` y `.quantityHint`.
Nombres de producto (primary) y categoría (secondary) quedaron donde estaban: no fue un reemplazo
indiscriminado.

## 7. Light / dark smoke

390px, estados A (compose vacío), B (compose con ticket), C (configurador con opciones seleccionadas),
en dark y light. Dark se activó vía `html[data-dashboard-theme="dark"]` — **nunca** `prefers-color-scheme`,
que la app ignora.

- Jerarquía de secciones visible en los dos temas; inner rows no se confunden con cards.
- Simple y configurable coherentes entre sí, con el paso extra comunicado sin CTA.
- Inputs legibles; segmented activo inequívoco; selected states con un solo lenguaje de acento.
- Ticket: `1 × Coca Cola 500ml` con columna de precio, stepper agrupado y `Quitar` al borde opuesto — jerarquía de la fase anterior intacta.
- CTA: `Agregá productos` / `Completá los datos obligatorios` quiet en disabled; `Agregar · $ 13.450,00` dominante sólo enabled.
- Dark no se aplasta en gris uniforme: los tres niveles se distinguen.

Único scroll owner medido: `manual-order-modal__body`.

900px: **NO EJECUTADO**. P1-4 no se vio roto y el cambio sobre la product row es sólo de color; el
verify fija además el bloque `@media (min-width: 900px) and (max-width: 1023px)` y el grid base.

Orders created: **0** (códigos de pedido idénticos al baseline: 3EMZ8G, G96QN4, 8DBT8G, TJK9R5, 3ZYV8A, ACWXPE, 9E8Y45).

## 8. Guards

- P1-1, P1-2, P1-3, P1-4: **CLOSED**. Sin cambios en `canSubmit`, `requiredFormReady`,
  `validateForm`, `configureDraftValid`, lógica de scroll ni arquitectura del grid 900–1023.
- Ticket hierarchy: **PRESERVED** (root, grupos, `×N`, columnas de precio, micro-superficie
  `Adicional`, arreglo stepper/`Quitar`, jerarquía del total). Sólo micro-ajustes de superficie.
- CTA / footer: **PRESERVED** (disabled scoped `opacity: 1` + `not-allowed`, azul enabled, monto sin
  wrap, fade y sombra del footer).
- Single-scroll: **FROZEN**. Sin nuevos `overflow-y: auto` (siguen siendo 2) ni `position: fixed`.
- Tap targets: **SIN TOCAR** (stepper 28×28, add 34×34, stepper del configurador 30×30, segmented 32px,
  search 38px) — fijados por el verify para la fase de accesibilidad.
- Pricing / ticket domain / payload / server / DB: **UNCHANGED**.
- `app/globals.css`, `app/theme-tokens.css`, `Button`/`Input`/`Card`, shell del modal: **UNCHANGED**.
  La escala `--mo-*` no se filtró a los tokens globales.

## 9. Checks

| Check | Resultado |
|-------|-----------|
| `admin-manual-order-modal-surface-materiality-polish.verify.ts` | PASS |
| `admin-manual-order-modal-ticket-summary-hierarchy-polish.verify.ts` | PASS |
| `admin-manual-order-modal-form-validation-ux-decision.verify.ts` | PASS |
| `admin-manual-order-modal-configurator-context-polish.verify.ts` | PASS |
| `npx tsc --noEmit` | PASS |
| `git diff --check` | PASS |
| `npm run build` | NO EJECUTADO (por instrucción) |
| `npm run lint` | NO EJECUTADO (por instrucción) |

## 10. Files changed

Runtime (2):
- `components/admin/orders/manual-order-modal.module.css`
- `components/admin/orders/manual-order-customization-panel.module.css`

TSX: **NONE** (no hizo falta markup nuevo; ninguna clase ni data attribute añadido).

Verify (1): `lib/orders/admin-manual-order-modal-surface-materiality-polish.verify.ts`

Shared / global: **NONE**.

Nota: `__header-badge` se dejó con mezclas literales a propósito — el shell lo renderiza como
`headerMeta`, fuera de `.manual-order-modal__form`, así que no puede ver las variables locales.

## 11. Remaining debt

- Tap targets (steppers 28px, add 34px, segmented 32px, close) — diferido.
- Focus trap / `tabindex` / loop de teclado — diferido.
- Microcopy de estados bloqueados.
- QA en producción con auth real.

## 12. Gate

**ADMIN-MANUAL-ORDER-MODAL-SURFACE-MATERIALITY-POLISH-1 = PASS**

Next: `ADMIN-MANUAL-ORDER-MODAL-ACCESSIBILITY-INTERACTION-POLISH-1`

No commit. No push. No deploy.
