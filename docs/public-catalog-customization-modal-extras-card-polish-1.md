# PUBLIC-CATALOG-CUSTOMIZATION-MODAL-EXTRAS-CARD-POLISH-1

## Estado

```text
PASS WITH ANDROID DEVICE QA PENDING — EXTRAS CARD POLISH-1 COMPLETE (local)
```

**Fecha:** 2026-08-14
**Scope:** Layout 2-row para tiles de Agregados extra · ocultar “máx. N” per-option · preservar lógica max.

---

## 1. Preflight

### Markup anterior

```tsx
<div className={styles.quantityOptionCopy}>
  <p className={styles.quantityOptionName}>{option.name}</p>
  <p className={styles.quantityOptionMeta}>
    {unitLabel ?? "Sin costo"}
    {optionMax > 1 ? ` · máx. ${optionMax}` : null}
  </p>
</div>
{qty < 1 ? <button Agregar> : <div stepper>}
```

### Dónde vivían price / max

| Dato | Ubicación | Uso |
|------|-----------|-----|
| `priceDelta` | `.quantityOptionMeta` vía `formatOptionUnitDelta` | solo visual |
| `optionMax` | `.quantityOptionCap` en meta | **solo visual** — lógica en `canIncrementOptionQuantity` |

### Archivos modificados

- `components/public/catalog/customization-modal.tsx` — markup top row
- `components/public/catalog/customization-modal.module.css` — layout CSS

---

## 2. Markup final

```tsx
<div className={styles.quantityOptionTopRow}>
  <span className={styles.quantityOptionName}>{option.name}</span>
  <span className={styles.quantityOptionPrice}>{unitLabel ?? "Sin costo"}</span>
</div>
{qty < 1 ? <button.quantityAddButton> : <div.quantityStepper>}
```

- **Fila 1:** nombre ← → precio (`flex`, `space-between`)
- **Fila 2:** Agregar o stepper `[−] qty [+]`
- Selected/unselected comparten misma estructura de 2 filas

---

## 3. Max per-option

| Aspecto | Status |
|---------|--------|
| Visual “máx. N” en tile | **REMOVED** |
| `getEffectiveOptionMaxQuantity` / clamping V2 | **PRESERVED** (helpers intactos) |
| `canIncrementOptionQuantity` + `disabled={!canPlus}` | **PRESERVED** |
| Group badge “Opcional · máx. 5 opciones” | **PRESERVED** |

`optionMax` removido del TSX del tile — no era input de lógica, solo display.

---

## 4. Measurements (CSS computed @ 16px root)

| Token | Before | After |
|-------|--------|-------|
| Card padding | 0.44rem (~7px/side) | unchanged |
| Card internal gap | 0.28rem | unchanged |
| Copy block | 2 lines (name + meta) | 1 line (top row) |
| Meta line (`· máx. N`) | ~0.96rem (~15px) | **removed** |
| Add / stepper min-height | 2.75rem (~44px) | unchanged |

| Card state | Before (est.) | After (est.) |
|------------|---------------|--------------|
| Bacon selected | ~96px | **~79px** (−~17px) |
| Cheddar unselected | ~96px | **~79px** |

Reducción por eliminar segunda línea de copy; controles mantienen ≥44px.

---

## 5. P1 regression

Runtime Doble Smash:

| Acción | Bacon | CTA |
|--------|------:|-----|
| Bacon → 3 | 3 | $ 17.000 |
| toggle Mayonesa | **3** | $ 17.000 |
| Papas grandes → medianas | **3** | $ 16.450 |

Unit verify script: **PASS**

---

## 6. Pricing — PASS

`12500 + 950 + 3×1000 = 16450` confirmado en CTA tras switch de papas.

---

## 7. Grid

`.quantityOptionList` — `grid-template-columns: repeat(2, …)` — **unchanged**.

---

## 8. Checks

| Check | Result |
|-------|--------|
| `tsc --noEmit` | PASS |
| `git diff --check` | PASS |
| `npm run build` | PASS |
| `order-qty-helpers.verify.ts` | PASS |
| `npm run lint` | FAIL — ESLint 9 circular JSON (pre-existing) |

---

## 9. Device QA

| Platform | Status |
|----------|--------|
| Local browser | PASS |
| Android Chrome | **PENDING** |

---

## Gate

| Criterion | Status |
|-----------|--------|
| First row = name + price | ✓ |
| Per-option max copy removed | ✓ |
| Max logic preserved | ✓ |
| + disabled at max | ✓ |
| Selected/unselected consistent | ✓ |
| Card height reduced | ✓ |
| Touch ≥ ~44px | ✓ |
| Grid 2 col | ✓ |
| P1 preservation | ✓ |
| Papas/Salsas untouched | ✓ |

No commit · no push · no deploy.
