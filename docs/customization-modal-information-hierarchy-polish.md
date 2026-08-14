# CUSTOMIZATION-MODAL-INFORMATION-HIERARCHY-POLISH

## Estado

```text
PASS — INFORMATION HIERARCHY POLISH COMPLETE (Android + production deploy 2026-08-14)
```

**Fecha:** 2026-08-14
**Principio:** mostrar solo información que modifica una decisión inmediata.

---

## 1. Preflight — owners

| Elemento | Owner |
|----------|-------|
| Product description | `customization-modal.tsx` (`.description`) |
| Group badge + helper (Papas/Salsas) | `customization-option-group.tsx` |
| Extras badge + helper | `customization-modal.tsx` (`.quantityGroupHeader` / `.quantityGroupDescription`) |
| Max/validation logic | `selection-v2.ts`, `public-shared.ts` — **unchanged** |

---

## 2. Removed visible information

| Item | Status |
|------|--------|
| Product description in modal | **REMOVED** |
| Salsas `Opcional · máx. N` badge | **REMOVED** |
| Salsas helper copy | **REMOVED** |
| Extras `Opcional · máx. N opciones` badge | **REMOVED** |
| Extras group helper | **REMOVED** |

Data/config/DB unchanged — presentation only.

---

## 3. Preserved

| Item | Status |
|------|--------|
| Papas `Obligatorio` badge | **YES** |
| Papas helper | **YES** |
| Max selection / qty logic | **YES** |
| Validation + CTA disabled | **YES** |
| Pricing | **YES** |
| Extras motion | **YES** |
| P1 quantity preservation | **YES** (verify PASS) |
| Controls / grids / touch targets | **YES** |

---

## 4. Accessibility

Metadata retirada visualmente se conserva con **`sr-only`** (global utility):

- **Salsas:** `groupMetaScreenReaderLabel(group)` + description cuando ocultos.
- **Extras:** `formatQuantityGroupMeta(group)` + description en `sr-only`.

Papas mantiene badge + helper visibles — sin duplicación sr-only.

Footer note existente al alcanzar max en multi-select (`Alcanzaste el máximo…`) **preservado** — feedback condicional, no densidad permanente.

---

## 5. Spacing

Sin ajustes CSS adicionales requeridos:

- `.quantityGroupHeader` ya `justify-content: flex-start` — sin badge huérfano.
- `.groupHeader` con solo `h3` alinea naturalmente a la izquierda.
- Gaps existentes entre heading y options se mantienen.

---

## 6. Density

scrollHeight modal body: **not measured** (browser tooling unavailable for precise before/after in this session). Reducción esperada ≈ **4–5 líneas** de copy permanente (product desc + 2× badge + 2× helper).

---

## 7. Implementation

### `customization-modal.tsx`
- Eliminado bloque `readyConfig.productDescription`.
- Extras: meta/description → `sr-only`.
- `CustomizationOptionGroup`: `showGroupMeta={group.isRequired}` · `showGroupDescription={group.isRequired}`.

### `customization-option-group.tsx`
- Props `showGroupMeta` / `showGroupDescription` (default `true` — admin preview intacto).
- `groupMetaScreenReaderLabel()` para fallback a11y.

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

## 9. Android QA

**PASS** — product owner, Android Chrome real device, build `831903f`.

---

## Gate

| Criterion | Status |
|-----------|--------|
| Product description not visible | ✓ |
| Papas required + helper preserved | ✓ |
| Salsas badge/helper hidden | ✓ |
| Extras badge/helper hidden | ✓ |
| Max logic preserved | ✓ |
| Motion / P1 / pricing untouched | ✓ |
| No control redesign | ✓ |

No commit · no push · no deploy.
