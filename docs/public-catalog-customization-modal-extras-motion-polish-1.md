# PUBLIC-CATALOG-CUSTOMIZATION-MODAL-EXTRAS-MOTION-POLISH-1

## Estado

```text
PASS WITH ANDROID DEVICE QA PENDING — EXTRAS MOTION POLISH-1 COMPLETE (local)
```

**Fecha:** 2026-08-14
**Scope:** CSS-only motion on Agregados extra quantity tiles (+ minimal TSX `key={qty}` for bump restart).

---

## 1. Preflight

| Selector | Encontrado |
|----------|------------|
| `.quantityOptionCard` | ✓ |
| `.quantityOptionCardSelected` | ✓ |
| `.quantityAddButton` | ✓ |
| `.quantityStepper` | ✓ |
| `.quantityStepperValue` | ✓ (qty span) |
| `.quantityStepperButton` | ✓ (+/−) |
| `prefers-reduced-motion` block | ✓ (extended) |

**TSX:** `key={qty}` añadido solo en `<span className={styles.quantityStepperValue}>`.

**Archivos:**
- `components/public/catalog/customization-modal.module.css`
- `components/public/catalog/customization-modal.tsx` (1 línea: `key={qty}`)

---

## 2. Card transition

```css
transition:
  background-color 180ms ease-out,
  border-color 180ms ease-out;
```

- Properties: `background-color`, `border-color` only
- Duration: **180ms**
- Easing: **ease-out**
- No transform / layout animation on card

---

## 3. Add / stepper entrance

```css
@keyframes quantityActionEnter {
  from { opacity: 0; transform: scale(0.98); }
  to   { opacity: 1; transform: scale(1); }
}
```

Applied to: `.quantityAddButton`, `.quantityStepper`
Duration: **150ms ease-out both**
No exit animation · no JS lifecycle

---

## 4. Button press

```css
transition: transform 100ms ease-out;
:active:not(:disabled) { transform: scale(0.96); }
```

- Scale: **0.96**
- Timing: **100ms ease-out**
- `:disabled` excluded — no false press feedback

---

## 5. Quantity bump

```css
@keyframes quantityBump {
  0%   { transform: scale(1); }
  45%  { transform: scale(1.08); }
  100% { transform: scale(1); }
}
```

- Duration: **140ms ease-out**
- Restart: `key={qty}` on value span only (not stepper/buttons/card)

---

## 6. Reduced motion

Under `@media (prefers-reduced-motion: reduce)`:

| Disabled |
|----------|
| Card color transition |
| Add/stepper entrance |
| Quantity bump |
| Button press transform |

Functional state instant · no hidden content.

---

## 7. Functional regression

| Test | Result |
|------|--------|
| Bacon 3 → Salsa → 3 | PASS (verify script) |
| Bacon 3 → Papas → 3 | PASS (verify script) |
| Max `+` disable | PASS (logic untouched) |
| Pricing CTA | PASS (unchanged) |

---

## 8. Performance

| Constraint | Status |
|------------|--------|
| New JS animation | **0** |
| New dependency | **0** |
| Layout animation | **0** |
| filter / blur | **0** |
| Allowed props only | transform, opacity, background-color, border-color |

---

## 9. Checks

| Check | Result |
|-------|--------|
| `tsc --noEmit` | PASS |
| `git diff --check` | PASS |
| `npm run build` | PASS |
| `order-qty-helpers.verify.ts` | PASS |
| `npm run lint` | FAIL — ESLint 9 circular JSON (pre-existing) |

---

## 10. Android QA

**PENDING**

---

## Gate

| Criterion | Status |
|-----------|--------|
| Card color transition subtle | ✓ |
| Add/stepper entrance subtle | ✓ |
| Button press responsive | ✓ |
| Quantity bump subtle | ✓ |
| No layout shift / height anim | ✓ |
| P1 preservation | ✓ |
| prefers-reduced-motion | ✓ |
| Grid/dimensions unchanged | ✓ |
| Papas/Salsas/footer untouched | ✓ |

No commit · no push · no deploy.
