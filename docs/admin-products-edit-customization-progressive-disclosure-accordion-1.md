# ADMIN-PRODUCTS-EDIT-CUSTOMIZATION-PROGRESSIVE-DISCLOSURE-ACCORDION-1

## Result

**PASS** — Advanced customization progressive disclosure closed. Flat Secciones/Opciones presentation superseded.

## Delta Audit

| Item | Finding |
|------|---------|
| owner | `ProductCustomizationOverridesPanel` |
| CSS | `product-customization-admin.module.css` |
| group mapping | Deterministic: `inheritance.groups[]` with `groupId` |
| option mapping | Deterministic: `group.options[]` with `optionId` (no string inference) |
| customization types | Generic groups only — no separate upsell entity in this panel |
| empty-state | No groups → panel returns `null` (no Advanced burden). Coca Cola 500ml verified |
| lucide-react | Present (`ChevronDown`, `Eye`, `EyeOff`) |
| frozen owners touched | **none** |

## Product Decision

Top-level **Avanzado** disclosure, collapsed by default on every Edit open.
Exception count visible while closed only when `> 0`.
Groups are a single-open accordion; options nest under the open group.
Visibility uses Eye / EyeOff sibling icon buttons wired to existing actions.

## Advanced Disclosure

| Contract | Value |
|----------|--------|
| default | `advancedOpen = false` |
| exception discoverability | `N excepción(es)` when count > 0 |
| copy (open) | “Ocultá secciones u opciones solo para este producto. La configuración general no cambia.” |
| empty (no groups) | Advanced not rendered |
| height collapsed @412 | **~48px** |

## Group Accordion

| Contract | Value |
|----------|--------|
| initial | all closed (`expandedGroupId = null`) |
| single-open | yes — opening another closes the previous |
| disclosure | native `<button aria-expanded aria-controls>` |
| chevron | `ChevronDown` + CSS rotate 180° |
| visibility | sibling Eye/EyeOff form button |
| touch | disclosure ≥48px; visibility **44×44** |

## Option List

| Contract | Value |
|----------|--------|
| nesting | conditional render under expanded group only |
| row anatomy | `Name · $price` + Eye action |
| price | `formatCustomizationPriceDelta` |
| visibility | Eye / EyeOff + descriptive `aria-label` |
| touch | 44px |

## Accessibility

- Advanced / group: `aria-expanded` + `aria-controls`
- Icons: `aria-hidden`
- Visibility labels describe the **action** (hide/restore + names)
- Keyboard: native button Enter/Space
- `:focus-visible` on disclosure + visibility
- No nested interactive controls
- No focus steal on single-open switch

## Sticky / Dirty Guards

| Guard | Result |
|-------|--------|
| flyout release lip | untouched / preserved |
| blue CTA remnant | 0 (lip intact) |
| sticky Save restore | PASS |
| pristine Save | disabled |
| open Advanced / groups | Save stays disabled |
| base name change → revert | enabled → disabled |
| coupling | none |

## Responsive QA

| Viewport | Result |
|----------|--------|
| 360 | PASS — overflow-x 0; Advanced 48 |
| 390 light | PASS |
| 390 dark | PASS |
| 412 | PASS (hard gate) |
| 899 | PASS |
| ≥961 (1100) | PASS |
| nested scroll in panel | 0 (flyout body remains sole scroller) |

## Density Evidence

| state | before (flat always-expanded) | after |
|-------|-------------------------------|-------|
| Advanced closed | N/A (always expanded hundreds of px) | **~48px** |
| Advanced open / groups closed | intro+summary+3 section cards ≈ hundreds | **~289px** @412 |
| one group open (3 options) | all sections + all options | **~484px** @412 |
| scroll reduction | operator paid full options list always | options opt-in only |

## Data Safety

| Domain | Mutations |
|--------|-----------|
| products | 0 |
| customizations | 0 (no Eye clicks on live data) |
| Storage | 0 |
| orders | 0 |
| DB / RLS / migrations | unchanged |

## Verification

| Check | Result |
|-------|--------|
| focused progressive-disclosure verify | PASS |
| density verify (reconciled supersession) | PASS |
| dirty / sticky / simple parity / flyout | PASS |
| mutation A (default open) | FAIL → restore PASS |
| mutation B (always expanded groups) | FAIL → restore PASS |
| mutation C (break 44px target) | FAIL → restore PASS |
| tsc | PASS |
| git diff --check | PASS |
| build / lint | NOT RUN |

## Runtime Scope

- `components/admin/product-customization/product-customization-overrides-panel.tsx`
- `components/admin/product-customization/product-customization-admin.module.css`
- `lib/products/admin-products-edit-customization-progressive-disclosure-accordion.verify.ts` (new)
- `lib/products/admin-products-edit-customization-overrides-mobile-density-polish.verify.ts` (reconciled)
- Docs: this file + CURRENT_PHASE / products-living-audit / ORDEROPS_LIVING_MEMORY

## Superseded Presentation

Intentionally retired:

- permanent expanded intro + large summary card
- flat **Secciones** / **Opciones** dual lists
- status chips + giant text action buttons
- repeated “En {sección}” metadata inside nested options

## Remaining Debt

- Product removal: SEPARATE DECISION PHASE / NEXT
- Owner visual QA: pending as appropriate

## Next

**PRODUCT REMOVAL DECISION PHASE**

## Release

**COMMIT / PUSH / DEPLOY: PAUSED**
