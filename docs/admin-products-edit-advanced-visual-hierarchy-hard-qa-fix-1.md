# ADMIN-PRODUCTS-EDIT-ADVANCED-VISUAL-HIERARCHY-HARD-QA-FIX-1

## Result

**PASS — ADVANCED GROUP/OPTION HIERARCHY OWNER-QA CLOSED**

## Trigger

Owner live visual QA after `ADMIN-PRODUCTS-EDIT-ADVANCED-VISUAL-HIERARCHY-POLISH-1` found remaining hierarchy/interaction gaps.

Previous phase status: **IMPLEMENTATION PASS** + **OWNER HARD QA FOUND FOLLOW-UP** (not a failure rewrite).

## Owner Hard-QA Findings

| Finding | Resolution |
|---------|------------|
| Hidden parent still showed operable child Eyes | Child Eyes `disabled` while parent hidden (draft only) |
| Group/option titles too similar | Stronger group weight + **16px measured inset** |
| Options still card-like | One group card; `optionList` flat separators; no option radius |
| Eye chrome too heavy (esp. hidden fill) | Ghost transparent Eye/EyeOff; chip carries hidden semantics |
| Crowded chip/price/Eye | Grid: `minmax(0,1fr) auto 2.75rem` |

## Functional Baseline

`ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-FINAL-QA-1` remains authoritative PASS. No draft equality / Save / RPC / DB changes.

## Parent-Hidden Decision

When `isGroupHidden` (current draft):

- option visibility buttons: **disabled**
- callback guard: no-op if parent hidden
- child `hiddenOptionIds`: **untouched**
- group Eye remains enabled
- group disclosure remains enabled

## Child Draft Preservation

Live BBQ Bacon sequence proved:

1. Hide Papas medianas → explicit child hidden + count +1  
2. Hide Papas → children disabled; medianas chip retained; helper shown  
3. Click children while parent hidden → **no state change**  
4. Restore Papas → children enabled; medianas still hidden  
5. Revert medianas → back to baseline (`1 oculta`); Save disabled  

## Disabled Child Interaction

- Real HTML `disabled`
- Helper: `Mostrá la sección para editar sus opciones.`
- `aria-label` explains locked state
- No hover affordance (`pointer-events: none` when disabled)

## Hierarchy Diagnosis / Levels

- L1 Advanced: section underline (preserved)
- L2 Group: single outer card owner
- L3 Option: inset flat list rows

Measured inset (live 412): option name left − group name left = **16px**.

## One-Card-Per-Group Contract

`advancedGroup` owns border/radius. Options use `optionList` + separator `border-top` only.

## Visibility Action Hierarchy

Ghost Eye under `.editHierarchy`. Hidden EyeOff no longer uses filled grey box. Hit target remains `2.75rem`.

## Hidden State Semantics

`Oculta` chip = **explicit** override only (not inherited effective hide from parent).

## Exception Count

Explicit groups + explicit options only. Live: parent hide + one child hidden → **3 ocultas** with prior baseline 1 (not descendant inflation to 4+).

## Responsive QA

| Viewport | Result |
|----------|--------|
| 360 LIVE | PASS (overflow-x 0) |
| 390 LIVE dark/light | PASS |
| 412 LIVE | PASS + parent-hidden sequence |
| 390 short (~700) | PASS sticky reachable |
| 899 | PASS |
| desktop | PASS |

## Light / Dark

Both PASS on live Edit Advanced.

## Accessibility

Disabled semantics real; group Eye/chevron remain keyboardable; option Eye not actionable while parent hidden.

## Sticky Regression

Sticky Save present through Advanced expanded / group expanded / parent hidden. No nested scroll. Last options scrollable above footer.

## Builder Regression

Draft-only `parentGroupHidden` / `editHierarchy`. Immediate option path still submit forms; no `parentGroupHidden`.

## Create Regression

Create does not mount overrides panel.

## Verification

| Check | Result |
|-------|--------|
| `admin-products-edit-advanced-visual-hierarchy-hard-qa-fix.verify.ts` | PASS |
| prior visual hierarchy polish verify | PASS (reconciled) |
| unified / dirty / accordion / density / sticky / flyout / image | PASS |
| Mutation A remove `disabled={controlsLocked}` | FAIL → restore PASS |
| Mutation B inject `setHiddenOptionIds` | FAIL → restore PASS |
| Mutation C option `border-radius: 12px` | FAIL → restore PASS |
| tsc | PASS |
| build | PASS |
| lint | NOT RUN |
| git diff --check | PASS |

## Mutation Probes

Documented above.

## Data Safety

No Save. Business mutations: **0**.

## Remaining Visual Debt

- Owner final visual acceptance
- Release-lip CSS still inert
- Disabled Eye opacity could be tuned further if owner wants stronger mute

## Next

**OWNER FINAL VISUAL ACCEPTANCE**  
→ PRODUCT REMOVAL DECISION or RELEASE SEQUENCING

COMMIT/PUSH/DEPLOY: **PAUSED**
