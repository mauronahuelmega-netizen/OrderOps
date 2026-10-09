# ADMIN-PRODUCTS-EDIT-CUSTOMIZATION-OVERRIDES-MOBILE-DENSITY-POLISH-1

## Result

**PASS** — ProductCustomizationOverridesPanel mobile density closed to Create/Edit base visual level without domain, dirty, or flyout-release changes.

## Delta Audit

| Item | Owner |
|------|--------|
| Component | `components/admin/product-customization/product-customization-overrides-panel.tsx` |
| CSS | `components/admin/product-customization/product-customization-admin.module.css` |
| Actions (unchanged) | `app/admin/(protected)/products/customizations/actions.ts` |
| Data | Existing `loadProductCustomizationInheritanceAction` → `inheritance.groups` / derived `optionRows` |
| Frozen owners touched | **none** (flyout release, edit-product-form, create, dirty snapshot untouched) |

Counts: `inheritance.groups.length` + `optionRows.length` only — no new fetches.

## Visual Changes

### Intro
- Title primary; **Avanzado** secondary on same row when space allows.
- Single helper: “Ocultá secciones u opciones solo para {productName}. La configuración general no cambia.”

### Summary
- **0 exceptions:** compact chips `[0 excepciones] [Configuración general]` + category; long hint hidden on mobile (`exceptionsSummaryHint`).
- **Active:** chip count + “Ocultas aquí {labels}” + category.

### Sections / Options
- Heading + count from existing arrays.
- Dense rows: name/meta top; status chip + action bottom.
- Mobile short labels (`Visible aquí` / `Oculta aquí` / `Ocultar aquí` / `Volver a mostrar`) with full `aria-label`.
- Desktop retains long visible copy.

## Density Evidence (412×915, content-driven)

| Metric | BEFORE | AFTER |
|--------|--------|-------|
| Section row height | ~141px | ~109px |
| Option row height | ~141px | ~109px |
| Action min-height | ~40px → target | **44px** (`2.75rem`) |
| Intro block | ~79px | ~57px |
| Summary 0-state | ~118px | ~68px |
| Summary active | tall card | ~94px |
| Option rows visible (options headed into view) | ~6 | **7** (412) / **8** prior 412 pass |

## Runtime QA Matrix

| Viewport | Result |
|----------|--------|
| 360 | PASS — overflow-x 0; title/badge no overlap; dense rows |
| 390 light | PASS — section/option 109; action 44; remnant paint covered by lip |
| 390 dark | PASS — prior dark frame + tokens |
| 412 (hard gate) | PASS — STATE A Doble Smash / STATE B BBQ Bacon |
| 899 | PASS — short labels (≤899); overflow 0 |
| ≥961 (1100) | PASS — long labels restored; overflow 0 |

Fixtures (read-only):
- STATE A: Doble Smash — 0 excepciones / Configuración general
- STATE B: BBQ Bacon — 1 excepción (BBQ)

## Sticky / Flyout Regression

| Check | Result |
|-------|--------|
| `headerReleaseClip` / `bodyReleaseClip` | preserved (untouched) |
| CTA remnant under header (visual) | **0** (lip covers exiting sticky CTA; `pointer-events: none` so hit-test may still see button) |
| Scroll back to base | sticky CTA restores near bottom |

## Dirty-State Regression

| Check | Result |
|-------|--------|
| Pristine Save | disabled |
| Base name change | Save enabled |
| Revert | Save disabled |
| Customization panel presence | no dirty coupling |
| Override actions | still independent forms → customization actions |

## Accessibility

- Native `<button>` actions; `min-height: 2.75rem` (44px)
- Short mobile labels + descriptive `aria-label` (e.g. “Ocultar Papas solo en BBQ Bacon”)
- Status chip informational (not a button)
- `:focus-visible` preserved on actions
- Pending/disabled semantics preserved on existing action state

## Data Safety

| Domain | Mutations |
|--------|-----------|
| products | 0 |
| Storage | 0 |
| customization overrides | 0 |
| orders | 0 |

## Verification

| Check | Result |
|-------|--------|
| Focused verify | PASS |
| Edit sticky-footer release | PASS |
| Edit simple mobile parity | PASS |
| Edit dirty-state | PASS |
| Flyout interaction | PASS |
| Mutation A (break compact row owners) | FAIL → restore PASS |
| Mutation B (break action min-height) | FAIL → restore PASS |
| Mutation C (introduce `setIsDirty` in panel) | FAIL → restore PASS |
| `npx tsc --noEmit` | PASS |
| `git diff --check` (scoped) | PASS |
| full build / full lint | not run (out of scope) |

## Runtime Scope

- `components/admin/product-customization/product-customization-overrides-panel.tsx`
- `components/admin/product-customization/product-customization-admin.module.css`
- `lib/products/admin-products-edit-customization-overrides-mobile-density-polish.verify.ts` (new)
- Docs: this file + minimal CURRENT_PHASE / living audit / ORDEROPS_LIVING_MEMORY

## Frozen Contracts

| Contract | Status |
|----------|--------|
| Create | FROZEN / PRESERVED |
| Edit base | FROZEN / PRESERVED |
| Dirty state | FROZEN / PRESERVED |
| Images KEEP/REMOVE/REPLACE | FROZEN / PRESERVED |
| Stock / availability | FROZEN / PRESERVED |
| Flyout release lip | FROZEN / PRESERVED |
| Customization domain / persistence | FROZEN / PRESERVED |
| Customization mobile density | **CLOSED / FROZEN** |

## Remaining Debt

- Product removal: SEPARATE DECISION PHASE / NEXT
- No new blocking visual debt in this panel from this phase

## Release

**COMMIT / PUSH / DEPLOY: PAUSED**
