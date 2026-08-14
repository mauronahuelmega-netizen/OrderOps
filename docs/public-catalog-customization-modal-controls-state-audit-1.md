# PUBLIC-CATALOG-CUSTOMIZATION-MODAL-CONTROLS-STATE-AUDIT-1

## Estado

```text
AUDIT COMPLETE — READ-ONLY — NO RUNTIME CHANGES — QUANTITY RESET CONFIRMED (P1)
```

**Fixture:** Doble Smash · `/b/demohamburgueseria/catalogo`
**Fecha:** 2026-08-14
**Scope:** Modal público de personalización — controles Papas / Salsas / Agregados extra + estado V2.

---

## 1. Render architecture

```
CustomizationModal (customization-modal.tsx)
│
├── loadState === "ready" → readyConfig.groups.map(group)
│
├── BRANCH A — quantity-enabled group
│   getEffectiveAllowsOptionQuantity(group) === true
│   └── <section.quantityGroup>  [INLINE en modal — no componente hijo]
│       ├── .quantityGroupHeader
│       └── <ul.quantityOptionList>  (grid 2 col)
│           └── <li.quantityOptionCard> × N
│               ├── .quantityOptionCopy (name + meta)
│               └── qty < 1 ? <button.quantityAddButton> : <div.quantityStepper>
│
└── BRANCH B — single / multi (non-quantity)
    └── <CustomizationOptionGroup>  (shared/customization-option-group.tsx)
        ├── optionLayout = groupUsesRequiredLayout(group) ? "list" : "compact-grid"
        │   · Papas (required single) → "list"
        │   · Salsas (optional multi) → "compact-grid"
        └── <ul.optionList | .optionListCompact>
            └── <CustomizationOptionRow> × N  (shared/customization-option-row.tsx)
                └── <label.optionRow[.optionRowCompact]>
                    ├── <input type=radio|checkbox>
                    ├── .optionCopy
                    └── .optionDelta
```

| Grupo (Doble Smash) | Branch | Componente owner | Layout |
|---------------------|--------|------------------|--------|
| **Papas** | B | `CustomizationOptionGroup` → `CustomizationOptionRow` | lista vertical (`optionLayout="list"`) |
| **Salsas** | B | mismo path compartido | grid 2 col (`optionLayout="compact-grid"`) |
| **Agregados extra** | A | inline en `customization-modal.tsx` | grid 2 col (`.quantityOptionList`) |

**Conclusión:** Papas y Salsas **comparten** el mismo componente de fila; solo difieren `selectionType`, `optionLayout` y CSS compact. Extras quantity tienen **branch separado** inline en el modal.

---

## 2. Control semantics — Papas

| Atributo | Valor |
|----------|-------|
| Input semántico | `<input type="radio">` |
| Owner | `CustomizationOptionRow` |
| `name` | `group-${groupId}` (grupo radio) |
| `checked` | `selectedOptionIds.includes(option.id)` |
| Handler | `onSelectOption` → `selectSingleOption` (legacy) → round-trip V2 |
| Wrapper | `<label className={optionRow}>` |
| Selected row | `.optionRowSelected` |
| Focus | `.optionRow:has(input:focus-visible)` → outline 2px primary |
| Control CSS | `.optionRow input { width: 1rem; height: 1rem; accent-color: primary }` — **native radio** (círculo UA) |
| Row min-height | `2.75rem` (~44px) |
| Row padding | `0.6rem 0.7rem` vertical/horizontal |
| Grid | `.optionList` — flex column, gap `0.4rem` |

---

## 3. Control semantics — Salsas

| Atributo | Valor |
|----------|-------|
| Input semántico | `<input type="checkbox">` |
| Owner | mismo `CustomizationOptionRow` |
| `name` | `undefined` (checkbox independiente) |
| Grid owner | `.optionListCompact` en `customization-shared.module.css` — `grid-template-columns: repeat(2, …)` |
| Selected row | `.optionRowSelected` (mismo token que Papas) |
| Focus | mismo `:has(input:focus-visible)` |
| Control CSS | mismo `.optionRow input` — **native checkbox** (cuadrado UA) |
| Compact row | `.optionRowCompact` — min-height `2.9rem`, padding `0.56rem`, gap `0.4rem` |

**Incongruencia visual:** mismo tamaño de input (`1rem`) pero **forma distinta** (radio círculo vs checkbox cuadrado). Row selected styling ya es compartido.

---

## 4. Visual congruence verdict — Salsas ≈ Papas

### Opción recomendada (futuro): CSS-only + semántica preservada

Mantener `type="checkbox"` y multi-select. Estilizar el indicador con:

```css
/* Conceptual — en customization-shared.module.css */
.optionRow input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  /* mismo box 1rem × 1rem que radio */
  border: 2px solid var(--customization-border);
  border-radius: 50%;          /* círculo como Papas */
}
.optionRow input[type="checkbox"]:checked {
  border-color: var(--business-primary);
  background: radial-gradient(circle, primary 45%, transparent 46%);
  /* alternativa: check dentro de círculo — evaluar en implementación */
}
```

**Dot vs check (accesibilidad):**
- **Dot filled (●):** más congruente con radio selected; riesgo de confundir single vs multi si el usuario no lee el badge “Opcional · máx. N”.
- **Check en círculo (✓):** patrón familiar multi-select (iOS Settings style); distingue mejor de radio.
- **Recomendación audit:** preferir **check en círculo del mismo diámetro** — preserva affordance multi-select sin romper lenguaje circular.

**Alcance:** CSS en `customization-shared.module.css` scoped a `.optionRow` / `.optionRowCompact`. Opcional prop `indicatorVariant="circular"` en row **no es necesario** si solo el público usa este CSS module.

**Grid 2 col:** intacto — solo cambia el pseudo-control dentro de cada tile.

**Keyboard / a11y:** label+input nativos intactos; focus-visible en label wrapper ya existe; no tocar ARIA.

---

## 5. Control semantics — Extras quantity

| Atributo | Valor |
|----------|-------|
| Owner | inline `customization-modal.tsx` L533–642 |
| Unselected | `<button.quantityAddButton>` “Agregar” |
| Selected | `<div.quantityStepper>` + minus/value/plus buttons |
| CSS module | `customization-modal.module.css` |
| State read | `getSelectedOptionQuantity(selectionV2, group.id, option.id)` |
| State write | `incrementOptionQuantity` / `decrementOptionQuantity` (preservan V2 correctamente) |

---

## 6. Extras height — medidas CSS actuales

Estructura de tile (selected):

```
.quantityOptionCard          flex-col, gap 0.4rem, min-height 2.9rem, padding 0.56rem
├── .quantityOptionCopy      flex-col, gap 0.14rem
│   ├── .quantityOptionName  font 0.81rem, line-height 1.28
│   └── .quantityOptionMeta  font 0.71rem, line-height 1.35
└── .quantityStepper         width 100%
    └── buttons              min-height 2.25rem (36px @ 16px root)
```

| Propiedad | Valor | Contribución altura |
|-----------|-------|---------------------|
| Card padding vertical | `0.56rem × 2` ≈ **17.9px** | media |
| Card gap (copy ↔ control) | **0.4rem** ≈ 6.4px | media |
| Copy block (2 líneas) | ~**34–38px** | alta |
| Agregar button | min-height **2.35rem** ≈ 37.6px | **muy alta** |
| Stepper buttons | min-height **2.25rem** ≈ 36px | alta |
| Card min-height | 2.9rem ≈ 46px | piso — contenido lo supera |
| Grid gap | 0.42rem | entre tiles, no intra |

**Root cause de exceso vertical:** layout **columna de 3 bandas apiladas** (copy 2 líneas + gap + control full-width). El control ocupa una **tercera franja completa** bajo el texto. Padding + gap acumulan whitespace. Botones a **36–38px** — por debajo del target 44px táctil, así que **no** conviene reducirlos más; conviene reducir padding/gap del card y/o integrar meta en una sola línea más compacta.

**Target compacto (propuesta audit):**
- Card padding `0.56 → 0.44rem`, gap `0.4 → 0.28rem`
- Mantener controles ≥ `2.75rem` (44px) en implementación futura
- Grid 2 col preservado
- Sin tocar copy semántico (name + price + máx.)

---

## 7. Quantity reset — reproducción

### Runtime QA (Doble Smash, localhost:3000)

| Acción | Bacon qty | CTA total | Evidencia |
|--------|-----------|-----------|-----------|
| inicial (después de +×2) | **3** | $ 15.500,00 | 12500 + 3×1000 |
| cambiar salsa (Mayonesa ON) | **1** | $ 13.500,00 | −$2000 = perdió 2 unidades |
| cambiar papas (chicas → medianas) | **1** | $ 14.450,00 | qty sin cambio; papas +950 |

**Resultado: PASS (bug reproducido).**

### Static trace (mismo handler path)

```
INITIAL: 3
AFTER_SALSA: 1
AFTER_PAPAS: 1
```

---

## 8. Quantity reset — root cause (P1)

**Archivo:** `components/public/catalog/customization-modal.tsx`
**Handler:** `onSelectOption` en `<CustomizationOptionGroup>` (L665–694)

**Operación exacta que destruye qty:**

```tsx
setSelectionV2((current) =>
  normalizeSelectionToV2(
    normalizeLegacySelectionToV2(          // ← RECONSTRUYE TODO EL ESTADO
      selectSingleOption(                  //   solo IDs, sin cantidades
        selectionV2ToLegacyOptionIds(current),  // ← STRIP qty >1 → solo optionId[]
        group.id,
        optionId
      )
    ),
    readyConfig.groups
  )
);
```

**Cadena:**

1. `selectionV2ToLegacyOptionIds(current)` — convierte `{ bacon: 3 }` → `["bacon"]` (**pierde magnitud**).
2. `selectSingleOption` / `toggleMultipleOption` — muta solo el grupo Papas/Salsas en formato legacy.
3. `normalizeLegacySelectionToV2(...)` — **`selection-v2.ts` L188–189:** `groupMap[optionId] = 1` para **cada** opción de **cada** grupo al reconstruir.
4. `normalizeSelectionToV2` — valida/clampa; no restaura qty perdida.

**Segundo punto de pérdida:** `normalizeLegacySelectionToV2` itera solo `Object.entries(selectedOptionsByGroupId)` — al reconstruir desde legacy, **todos** los grupos quantity-enabled quedan en qty **1**.

**No hay regla de dominio** que justifique resetear extras al cambiar Papas/Salsas. Grupos son independientes en config. **Clasificación: bug P1.**

**Effects:** ningún `useEffect` del modal re-dispara esto al cambiar grupo. El reset es **síncrono en el handler** de Papas/Salsas, no en effects.

---

## 9. Estado — estructura y flujos

### State principal

```ts
selectionV2: CustomizationSelectionStateV2
// Record<groupId, Record<optionId, quantity>>
// qty >= 1 cuando seleccionado; ausente = no seleccionado
```

### Derivados

- `selectedOptionsByGroupId` = `selectionV2ToLegacyOptionIds(selectionV2)` (memo)
- `validation` = `validateCustomizationSelection(groups, legacy, selectionV2)`
- `visualTotal` = `computeVisualCustomizationTotal({ …, selectedQuantitiesByGroupId: selectionV2 })`

### Handlers trace

| Evento | Handler | Update | Normalización |
|--------|---------|--------|---------------|
| Papas radio | `onSelectOption` | legacy round-trip | `normalizeLegacySelectionToV2` → **reset qty** |
| Salsa checkbox | `onSelectOption` | legacy round-trip | idem |
| Bacon Agregar/+/- | `setSelectionV2` directo | `incrementOptionQuantity` / `decrementOptionQuantity` | `normalizeSelectionToV2` — **preserva otros grupos** |

---

## 10. Pricing — coherencia con reset

`computeVisualCustomizationTotal` (`public-shared.ts` L171–175):

```ts
const qty = group && getEffectiveAllowsOptionQuantity(group)
  ? Math.max(1, Math.floor(qtyRaw))
  : 1;
total += option.priceDelta * qty;
```

El total CTA **sí refleja** el reset: $15.500 → $13.500 al perder 2× Bacon. State real, UI y pricing **convergen en el valor incorrecto**.

**Distinción:** `quantity: 1` en `buildCartLinesFromCustomizationSelection` es **qty del producto en carrito**, no qty de extra. Bug afecta `selectedQuantitiesByGroupId` (extra option qty).

---

## 11. Accesibilidad (futuro congruence)

| Check | Papas | Salsas | Extras |
|-------|-------|--------|--------|
| Native semantics | radio ✓ | checkbox ✓ | buttons ✓ |
| Label click | `<label htmlFor>` ✓ | ✓ | N/A (buttons con aria-label en stepper) |
| Keyboard | space/arrow en radio group ✓ | space toggle ✓ | button focus ✓ |
| focus-visible | label outline ✓ | ✓ | button outline ✓ |

Futuro visual circular en checkbox **no debe** cambiar `type` ni roles.

---

## 12. Findings classification

| ID | Severidad | Finding |
|----|-----------|---------|
| F1 | **P1** | Extra qty >1 resetea a 1 al cambiar Papas o Salsas — handler legacy round-trip |
| F2 | **P2** | Salsas checkbox cuadrado vs Papas radio circular — mismo row, distinto UA chrome |
| F3 | **P2/P3** | Tiles extras altas — columna copy+gap+control full-width; padding/gap generosos |

---

## 13. Fix plan mínimo (NO implementado)

### Fix 1 — Quantity preservation (P1)

| | |
|---|---|
| **Archivo** | `customization-modal.tsx` (+ opcional helper en `selection-v2.ts`) |
| **Causa** | `selectionV2ToLegacyOptionIds` → `normalizeLegacySelectionToV2` fuerza qty=1 global |
| **Cambio mínimo** | Actualizar **solo el grupo objetivo** sobre `current` V2, sin round-trip legacy. Ej.: helpers `selectSingleOptionInV2(current, group, optionId)` / `toggleMultipleOptionInV2(...)` que hagan `{ ...current, [groupId]: patchedMap }` + `normalizeSelectionToV2`. |
| **Scope** | TSX + ~30 LOC helper puro |

### Fix 2 — Salsa visual congruence (P2)

| | |
|---|---|
| **Archivo** | `customization-shared.module.css` |
| **Causa** | Native checkbox square vs radio circle |
| **Cambio mínimo** | `appearance: none` + indicador circular/check en `.optionRow input[type=checkbox]`; preservar grid compact |
| **Scope** | CSS-only |

### Fix 3 — Extra tile compaction (P2/P3)

| | |
|---|---|
| **Archivo** | `customization-modal.module.css` |
| **Causa** | padding 0.56, gap 0.4, control band full-width |
| **Cambio mínimo** | Reducir padding/gap; subir min-height botones a 2.75rem (44px) mientras se compacta card |
| **Scope** | CSS-only |

---

## 14. Blast radius

**NO requiere tocar:** DB, Supabase, migrations, server actions, checkout, create_order, product detail modal, catalog cards, header/categories, cache.

**Sí toca (fix P1):**
- `customization-modal.tsx` — handler Papas/Salsas
- Opcional `selection-v2.ts` — helpers group-scoped (reutilizable admin preview si comparte path)

**Riesgos de regresión (fix P1):**
- Validación min/max distinct — debe seguir pasando por `normalizeSelectionToV2`
- Pricing CTA — debe reflejar qty preservada
- Cart signature / edit cart item — payload usa `selectionV2`; fix **mejora** fidelidad
- max quantity per option — `incrementOptionQuantity` ya clamp; no afectado

---

## 15. Proposed implementation phase

**Nombre sugerido:** `PUBLIC-CATALOG-CUSTOMIZATION-MODAL-CONTROLS-FIX-1`

Orden:
1. P1 quantity preservation (TSX/helper) + test estático en `order-qty-helpers.verify.ts` o nuevo snippet
2. P2 salsa circular indicator (CSS)
3. P2/P3 extra tile compaction (CSS)

---

## 16. useEffect audit (modal)

| Effect | deps | Relación qty |
|--------|------|--------------|
| init selection | `[productId, readyConfig?.productId]` | solo al abrir producto |
| price bump | `[loadState.status, visualTotal]` | refleja reset, no lo causa |
| focus trap / scroll lock / close timer | varios | ninguna |

**Ningún effect reconstruye quantities al cambiar grupo.**

---

## Gate checklist

| Gate | Status |
|------|--------|
| SALSA VISUAL PATH | ✓ UNDERSTOOD |
| PAPAS VISUAL PATH | ✓ UNDERSTOOD |
| EXTRA TILE HEIGHT CAUSE | ✓ KNOWN |
| QUANTITY RESET | ✓ REPRODUCED |
| QUANTITY RESET ROOT CAUSE | ✓ KNOWN |
| MINIMAL FIX PLAN | ✓ IDENTIFIED |
| NO RUNTIME CHANGES | ✓ |
| NO DB / NO ORDER SUBMIT | ✓ |

---

## Archivos auditados

- `components/public/catalog/customization-modal.tsx`
- `components/public/catalog/customization-modal.module.css`
- `components/product-customization/shared/customization-option-group.tsx`
- `components/product-customization/shared/customization-option-row.tsx`
- `components/product-customization/shared/customization-shared.module.css`
- `lib/product-customization/selection-v2.ts`
- `lib/product-customization/preview-selection.ts`
- `lib/product-customization/public-shared.ts`
