# PRODUCT-CUSTOMIZATION-ADMIN-A11Y-POLISH-1 — Accessible Menus, Focus & Keyboard Polish

## Objetivo

Cerrar la deuda P2 de accesibilidad del rescore: menuitems de menús ⋮ cerrados no deben permanecer en el accessibility tree; reforzar ARIA, Escape, click fuera y restauración de foco sin cambiar lógica operativa.

## Contexto

- PRODUCT-CUSTOMIZATION-ADMIN-V1-PREMIUM-RESCORE-1 — PASS WITH RESIDUAL POLISH DEBT (score 4.3/5 · A11y 3.8)
- Hallazgo: `PC-RESCORE-003` — menús ⋮ exponían menuitems con panel cerrado (`<details>` siempre montaba el panel)

## Alcance

- `ActionsMenu` compartido + call sites (assignments, secciones, opciones, plus)
- Confirm dialog de remove (ARIA + foco de retorno)
- Focus-visible con `--focus-ring`
- Docs / deploy

## Fuera de scope

DnD touch size · actions · DB/RLS · mapper · público · rediseño · copy no-a11y · feedback post-save

## Autorización

```txt
AUTORIZO_PRODUCT_CUSTOMIZATION_ADMIN_A11Y_POLISH_LOCAL=yes
AUTORIZO_PRODUCT_CUSTOMIZATION_ADMIN_A11Y_POLISH_BROWSER_QA=yes
AUTORIZO_PRODUCT_CUSTOMIZATION_ADMIN_A11Y_POLISH_ACCESSIBILITY_TREE_INSPECTION=yes
AUTORIZO_GIT_COMMIT_PRODUCT_CUSTOMIZATION_ADMIN_A11Y_POLISH=yes
AUTORIZO_GIT_PUSH_PRODUCT_CUSTOMIZATION_ADMIN_A11Y_POLISH_TO_ORIGIN_MAIN=yes
AUTORIZO_DEPLOY_PRODUCT_CUSTOMIZATION_ADMIN_A11Y_POLISH_TO_VERCEL=yes
```

## Permisos operativos

TSX/CSS scoped · browser QA · a11y tree · tsc/build · commit · push `origin/main`

## Precheck local

`tsc PASS` · `build PASS` (baseline y post-cambio)

## Auditoría inicial

| Ítem | Hallazgo |
|------|----------|
| Implementación única | `reusable-sections/actions-menu.tsx` |
| Patrón previo | `<details>` + `<summary>` — panel siempre en DOM |
| Consumidores | AssignmentCard, ReusableSectionCard, ReusableOptionRow, PlusSuggestionCard, SuggestedProductRow |
| closeNearestMenu | `closest("details")` |
| Confirm remove | `<dialog>` nativo sin `aria-describedby` / foco de retorno |

## Implementaciones de menú encontradas

Una sola: `ActionsMenu` (reutilizada en todos los ⋮ del módulo).

## Problemas de accessibility tree

Con menú cerrado, `[role=menuitem]` seguía en el árbol (p. ej. 6–9 items en Secciones). `aria-expanded` / `aria-haspopup` incompletos en summary.

## Cambios implementados

1. **`actions-menu.tsx`** — botón trigger + montaje condicional `{isOpen ? menu : null}`; `aria-haspopup`, `aria-expanded`, `aria-controls`; Escape / click fuera; un solo menú abierto; `closeNearestMenu` vía evento `actions-menu-close`.
2. **Call sites** — `label` = nombre de entidad → “Más acciones para {nombre}”.
3. **`assignment-card.tsx`** — `aria-describedby` en confirm; foco vuelve al trigger al Cancelar/Escape.
4. **CSS** — `focus-visible` con `var(--focus-ring)` en trigger/items.

## Triggers de menús

```txt
button[type=button]
aria-label="Más acciones para Papas"
aria-haspopup="menu"
aria-expanded={boolean}
aria-controls={menuId | undefined}
icon ⋮ aria-hidden
```

## Montaje/desmontaje

Panel `role="menu"` solo cuando `isOpen`. Cerrado → `menuitems=0`, `menus=0` (CDP).

## Navegación por teclado

| Acción | Resultado |
|--------|-----------|
| Tab al trigger | OK |
| Enter/Space / click | Abre |
| Escape | Cierra + foco al trigger |
| Click fuera | Cierra |
| Tab con cerrado | No entra a menuitems |

## Manejo de foco

- Escape / click fuera: restaura trigger
- Confirm Cancelar/Escape: restaura trigger (`data-actions-menu-trigger`)
- Acción que desmonta card: no fuerza foco inválido

## Escape y click fuera

Document listeners mientras abierto; un menú abierto a la vez (registry de closers).

## Dialogs

Confirm remove: `aria-labelledby` + `aria-describedby`; Escape/Cancelar sin mutar; foco de retorno. Otros modales nativos `<dialog>` sin cambios de contrato.

## Tabs

Sin cambios; patrón existente con `aria-selected` intacto.

## Reorder / DnD

Handles ya tienen `aria-label` contextual + ↑/↓. Tamaño ~32px queda como deuda `DND-TOUCH-POLISH-1`.

## Focus visible

Triggers y menuitems usan `box-shadow: var(--focus-ring)`.

## Browser QA

Admin autenticado local · light (dark no regresivo de menús) · tabs Por producto / Secciones / Plus.

## Accessibility tree QA

| Estado | menuitems | menus | aria-expanded |
|--------|-----------|-------|---------------|
| Cerrado (Doble Smash assignments) | 0 | 0 | false |
| Abierto Papas | 2 | 1 | true + aria-controls |
| Post Escape | 0 | 0 | false · focus trigger |
| Secciones cerrado | 0 | 0 | — |
| Plus cerrado | 0 | 0 | — |
| Confirm abierto | 0 (menú desmontado) | — | título accesible |

## Validación Por producto

Menús assignment Ocultar/Quitar · confirm dialog · Escape/Cancelar · sin mutación crítica ejecutada

## Validación Por categoría

Mismo `ActionsMenu` / AssignmentCard (sin writes destructivos)

## Validación Secciones reutilizables

3 triggers · 0 menuitems cerrados · open/close OK

## Validación Plus sugeridos

1 trigger · 0 menuitems cerrados · open 3 items · Escape OK

## Validación pública

`/b/demohamburgueseria/catalogo` — modal Doble Smash: Papas / Salsas / Agregados / Sumá una bebida / Coca · sin confirmar pedido · sin código público tocado

## No side effects

Sin migrations · RLS · actions · mapper · cart/checkout/stock · pedidos · flags

## Deploy

Commit + push `origin/main` → Vercel (ver CURRENT_PHASE / hash post-push).

## Compatibilidad

API `ActionsMenu` / `closeNearestMenu` preservada; diseño visual del ⋮ sin rediseño.

## Qué NO se tocó

Server actions · DB · preview mapper · catálogo público · DnD size · copy comercial

## Validaciones CLI

`npx tsc --noEmit` PASS · `npm run build` PASS

## Riesgos / deuda residual

- Drag handle ~32px → **DND-TOUCH-POLISH-1**
- Flechas ↑/↓ en menú (roving tabindex) no implementadas — no obligatorias; items son botones tabbables
- Dialogs de edición secundarios: foco de retorno no auditado exhaustivamente en todos (nativo `showModal` OK)

## Rollback plan

Revert commit de esta fase. Sin migraciones.

## Resultado final

**PASS WITH DND TOUCH DEBT**

Menuitems cerrados fuera del a11y tree; triggers/ARIA/Escape/click fuera/foco OK. Deuda residual: tamaño táctil DnD.

## Próxima fase recomendada

`PRODUCT-CUSTOMIZATION-ADMIN-DND-TOUCH-POLISH-1` (opcional) o `PRODUCT-CUSTOMIZATION-ADMIN-V1-FINAL-HANDOFF-1`
