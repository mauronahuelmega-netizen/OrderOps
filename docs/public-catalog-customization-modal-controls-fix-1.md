# PUBLIC-CATALOG-CUSTOMIZATION-MODAL-CONTROLS-FIX-1

## Estado

```text
PASS WITH ANDROID DEVICE QA PENDING — CONTROLS FIX-1 COMPLETE (local)
```

**Audit source:** `docs/public-catalog-customization-modal-controls-state-audit-1.md`
**Fecha:** 2026-08-14
**Scope:** P1 quantity preservation · P2 salsa circular checkbox · P2/P3 extra tile compaction.

---

## 1. P1 — Quantity preservation

### Handler viejo (destructivo)

```tsx
setSelectionV2((current) =>
  normalizeSelectionToV2(
    normalizeLegacySelectionToV2(
      selectSingleOption(selectionV2ToLegacyOptionIds(current), group.id, optionId)
    ),
    readyConfig.groups
  )
);
```

Round-trip legacy → `normalizeLegacySelectionToV2` forzaba `qty = 1` en **todos** los grupos.

### Handler nuevo

```tsx
setSelectionV2((current) =>
  group.selectionType === "single"
    ? selectSingleOptionInV2({ selection: current, groups: readyConfig.groups, group, optionId })
    : toggleMultipleOptionInV2({ selection: current, groups: readyConfig.groups, group, optionId })
);
```

### Helpers (`lib/product-customization/selection-v2.ts`)

| Helper | Comportamiento |
|--------|----------------|
| `selectSingleOptionInV2` | `{ ...current, [groupId]: { [optionId]: 1 } }` → `normalizeSelectionToV2` |
| `toggleMultipleOptionInV2` | Toggle solo en `[groupId]`; preserva sibling options y **todos los demás group maps** |

Legacy helpers (`preview-selection.ts`) **no eliminados** — solo retirado el uso destructivo del modal público.

---

## 2. Runtime / unit reproduction

### Unit (`order-qty-helpers.verify.ts`)

Fixture: `papas-chicas`, `bacon:3`, `cheddar:2`.

| Acción | Bacon | Cheddar | Result |
|--------|------:|--------:|--------|
| base | 3 | 2 | PASS |
| toggle mayo ON | 3 | 2 | PASS |
| papas → medianas | 3 | 2 | PASS |
| toggle mayo OFF | 3 | 2 | PASS |

### Pricing (fixture conceptual)

| Estado | CTA esperado |
|--------|--------------|
| base 12500 + Bacon×3 | $ 15.500 |
| + Mayonesa (0 delta) | $ 15.500 |
| Papas medianas +950 | $ 16.450 |

`computeVisualCustomizationTotal` usa `selectionV2` directamente — refleja qty preservada sin cambios adicionales.

---

## 3. Salsa indicator (P2)

**Archivo:** `components/product-customization/shared/customization-shared.module.css`

**Selector:** `.optionRow input[type="checkbox"]`

| Estado | Visual |
|--------|--------|
| unselected | ○ círculo 1rem, border subtle |
| selected | círculo primary + ✓ blanco (`::after` border check) |

- Semántica `type="checkbox"` preservada
- Radio Papas sin cambios (native `accent-color`)
- Grid `compact-grid` intacto
- `.optionRowSelected` sin cambios

---

## 4. Extras compaction (P2/P3)

**Archivo:** `components/public/catalog/customization-modal.module.css`

| Token | Before | After |
|-------|--------|-------|
| `.quantityOptionCard` padding | `0.56rem` | `0.44rem` |
| `.quantityOptionCard` gap | `0.4rem` | `0.28rem` |
| `.quantityOptionCopy` gap | `0.14rem` | `0.1rem` |
| `.quantityAddButton` min-height | `2.35rem` (~38px) | `2.75rem` (~44px) |
| `.quantityStepperButton` min-height | `2.25rem` (~36px) | `2.75rem` (~44px) |

Card total puede ser similar o ligeramente menor en whitespace; controles ahora cumplen ~44px táctil. Grid 2 col, copy, stepper UX sin cambios semánticos.

---

## 5. Validation

| Check | Result |
|-------|--------|
| Papas required sin selección | PASS — alert + CTA disabled |
| Seleccionar Papas | PASS — error desaparece, CTA enabled |
| V2 handler no rompe validación | PASS |

---

## 6. Architecture untouched

| Area | Status |
|------|--------|
| Modal load/cache/dedupe | unchanged |
| Footer CTA behavior | unchanged |
| Grid layouts | unchanged |
| DB / server actions / checkout | unchanged |
| `buildCartLinesFromCustomizationSelection` | unchanged |

---

## 7. Files changed

| File | Change |
|------|--------|
| `lib/product-customization/selection-v2.ts` | `selectSingleOptionInV2`, `toggleMultipleOptionInV2` |
| `components/public/catalog/customization-modal.tsx` | P1 handler |
| `components/product-customization/shared/customization-shared.module.css` | circular checkbox |
| `components/public/catalog/customization-modal.module.css` | extra compaction + 44px controls |
| `lib/product-customization/order-qty-helpers.verify.ts` | cross-group preservation tests |

---

## 8. Checks

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS |
| `git diff --check` | PASS |
| `npm run build` | PASS |
| `npm run lint` | FAIL — ESLint 9 circular JSON (pre-existing) |
| `npx tsx lib/product-customization/order-qty-helpers.verify.ts` | PASS |

---

## 9. Device QA

| Platform | Status |
|----------|--------|
| Local browser (modal open, structure) | PASS |
| Android Chrome real device | **PENDING** |

---

## Gate

| Criterion | Status |
|-----------|--------|
| P1 quantity reset fixed | ✓ |
| Cross-group preservation | ✓ |
| Pricing with qty | ✓ |
| Validation | ✓ |
| Salsa checkbox semantics | ✓ |
| Salsa circular indicator | ✓ |
| Salsa grid preserved | ✓ |
| Extra cards compacter | ✓ |
| Extra touch ≥ ~44px | ✓ |
| Stepper behavior preserved | ✓ |
| No DB/server/checkout/cache | ✓ |
| Dedicated doc | ✓ |

No commit · no push · no deploy.
