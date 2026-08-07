# PUBLIC-CATALOG-CART-SHEET-ACTIONS-DENSITY-FOLLOWUP-1

## Estado

**PASS — CART SHEET ACTIONS DENSITY VERIFIED**

## Problema corregido

Tras `PUBLIC-CATALOG-CART-SHEET-FLAT-POLISH-1`, el CartSheet tenía dark parity y a11y correctas, pero las acciones `edit/delete` root y el trash de children upsell seguían con caja bordered + fondo card, compitiendo con quantity y con el CTA de checkout. La card root también ganaba altura por padding + acciones pesadas.

## Cambios visuales

- Root `edit/delete` → ghost/soft: `background: transparent`, `border: transparent`, color `--cart-sheet-subtle`.
- Child trash → mismo ghost; hover soft via `color-mix` sobre `--cart-sheet-hover`.
- Header close conserva affordance suave (borde + card surface) para no perder el X.
- Iconos de acciones: stroke `1.85` (antes `2.1`); tamaño icono acción `1.05rem`; qty mantiene `1.15rem`.
- Densidad leve: row padding/gap, list gap, child padding, `actionCluster` gap.

## Root actions

- Target táctil `2.75rem` (44px) preservado.
- Sin cambio de orden, handlers, `aria-label` ni iconos (solo stroke más liviano).
- Alineación con quantity intacta; quantity sigue siendo el control más claro del bloque.

## Child delete action

- Trash ghost, color muted/subtle; no compite con precio.
- Layout `nombre | precio | trash` preservado.
- Handlers / grouping / label Adicional sin cambios.

## Quantity / density

- Quantity no rediseñado: border group + botones 44px + valor tabular.
- Compactación solo en gaps/padding de card/acciones; displaySummary y children siguen legibles.

## Dark / Light

- Tokens `--cart-sheet-*` del flat polish intactos.
- CDP light: acciones `bg/border` transparentes; close con surface card.
- CDP dark: sheet/card oscuros; acciones ghost transparentes; CTA accent teal; X visible.

## Accessibility

| Feature | Estado |
|---------|--------|
| Target ≥44px edit/delete/child/qty | Preservado |
| `focus-visible` outline accent | Preservado |
| Foco inicial en X | Preservado |
| Escape close | Preservado |
| Scroll lock (`overflow: hidden`) | Preservado |
| Focus trap Tab | Preservado (código flat polish; Tab QA no revalidó ciclo completo en esta pasada) |
| Handlers / aria-labels | Sin cambios semánticos |

## Contratos preservados

- Hierarchy, totals, signatures, upsell children, remove child/root, qty sync, edit preserve qty+children, checkout navigation, preview isolation, empty state.
- Sin cambios a helpers, storage, payload, DB/RPC/actions/packages.

## QA browser

Viewports usados: 390×844 (+ métricas CDP). Temas: light + dark (`data-theme`).

### Light

- Ghost actions confirmadas (CDP: `bg rgba(0,0,0,0)`, border transparente, 44×44).
- Quantity y CTA más protagonistas que edit/delete.

### Dark

- Sheet/card oscuros; ghost delete transparente; close soft; CTA accent.

### Flujos A-G

| Flujo | Resultado |
|-------|-----------|
| A Configurable + 1–2 upsells | PASS (Doble Smash + Coca + Sprite) |
| B Acciones sin peso excesivo | PASS |
| C Remove child | PASS (Coca out; root + Sprite) |
| D Remove root | PASS (empty state) |
| E Quantity | PASS (qty 2; Sprite `$ 5.800,00`) |
| F Edit | PASS (Actualizar; qty+children; sin Post-add) |
| G A11y | PASS (foco X, Escape, scroll lock; Tab no re-ciclado exhaustivo) |

## Console/network

- Abrir/cerrar CartSheet / qty / remove / edit: sin server actions esperadas (mutaciones locales).
- Sin pedido real.
- Sin PII/tokens registrados.

## Validación

| Check | Resultado |
|-------|-----------|
| `tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `git diff --check` | PASS |
| HTTP catalogo/checkout/success | 200 / 200 / 200 |

## Deuda aceptada

- P3: Tab cycle no revalidado exhaustivo en esta pasada (código de trap intacto del flat polish).
- P3: En edit, radiogrupo Papas a veces no marca `checked` en a11y tree al abrir; re-selección + Actualizar preservó qty/children (preexistente al density follow-up; no tocado).

## Gate siguiente

```text
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-FLAT-POLISH-1 = ALLOWED
```
