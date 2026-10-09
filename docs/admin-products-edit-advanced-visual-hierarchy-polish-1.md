# ADMIN-PRODUCTS-EDIT-ADVANCED-VISUAL-HIERARCHY-POLISH-1

## Result

**PASS — ADVANCED VISUAL HIERARCHY CLOSED / FROZEN**

Functional Final QA remains authoritative. This phase is presentation-only.

## Trigger

Owner screenshots (412 × ~915) showed Advanced still reading like a form control; groups/options with similar visual weight; Eye actions competing with labels; expanded options retaining excess card chrome.

## Functional Baseline

`ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-FINAL-QA-1` — **PASS**

- ONE EDITOR = ONE DRAFT = ONE SAVE
- Category: EDIT read-only
- Eye/EyeOff: LOCAL BEFORE SAVE
- Pre-Save customization writes: **0**
- Dirty / Discard: UNIFIED
- Sticky: WHOLE EDITOR
- RPC: LIVE / VALIDATED
- Create / Builder: unchanged contracts

## Owner Evidence

Observed states A/B/C (collapsed / groups collapsed / Papas expanded) treated as visual trigger. No domain rewrite.

## Preflight

| Item | Value |
|------|-------|
| Branch | `main` |
| HEAD | `c9af635e27ad86e0731eea0a90b16b9b628d5aa6` |
| Pre-existing dirty tree | preserved (Products package + docs) |
| Destructive git | none |
| Commit / push / deploy | none |

## Visual Diagnosis

### Advanced

Previously resembled muted select/input (bordered filled control). Redesigned as **section disclosure header** (underline / transparent surface under `.editHierarchy`).

### Groups

Distinct Level 2 cards with tertiary metadata; chevron + Eye remain siblings.

### Options

Flattened to **separator list rows** inside group container (`border-radius: 0`, soft `border-top`).

### Visibility Actions

Ghost/transparent treatment under `.editHierarchy`; still `2.75rem` hit target.

### Hidden State

Explicit `Oculta` chip (`hiddenBadge`) + EyeOff; not color-only.

### Density

Mobile-first compact rhythm; Advanced margin separates from stock toggles.

## Design Contract

### Level 1 — Advanced

- Class: `advancedDisclosure` + `editHierarchy` (draft/Edit only)
- Section title typography; not input geometry
- Collapsed shows compact hidden count when > 0 (`N oculta(s)`)
- Expanded: helper + in-memory summary

### Level 2 — Groups

- `data-level="group"`, `data-expanded`, `data-hidden`
- Name primary; meta tertiary; optional `Oculta` chip
- Chevron (`groupChevron`) independent of Eye

### Level 3 — Options

- `optionOverrideRow` + `optionOverridePrice` secondary
- Flat nested list under `groupOptions`
- No independent heavy option cards

## Advanced Summary

| Metric | Source |
|--------|--------|
| Sections | `inheritance.groups.length` |
| Options | sum of `group.options.length` |
| Hidden (collapsed label) | draft `hiddenGroupIds` + `hiddenOptionIds` |
| New fetch | **0** |

Exception/hidden count has **one** collapsed owner; expanded summary is inventory only (`N secciones · M opciones`) — no competing second counter.

## Hidden-State Semantics

- Chip copy: **Oculta**
- `aria-hidden="true"` on chip (Eye `aria-label` remains authoritative)
- Parent hidden does not erase child draft state (behavior frozen)

## Responsive Behavior

CSS hierarchy scoped under `.editHierarchy`. Same structure across breakpoints; no two-column Advanced layout.

Preview matrix (source CSS fixture, not live flyout when session expired):

| Viewport | Result |
|----------|--------|
| 360 | PASS — no overflow; hierarchy readable |
| 390 dark | PASS |
| 412 light | PASS — Advanced ≠ input; flat options |
| 719 / 899 / 961+ / 1440 | structural CSS continuous; desktop density preserved |

Live Edit flyout: session expired mid-QA; password automation rejected. Partial live evidence before logout: products list @412 dark; Edit Clásica (no groups → Advanced absent, correct empty contract). Products with groups: BBQ Bacon / Doble Smash (DB). Owner live confirm recommended on those.

## Light / Dark

Token-based surfaces; preview verified light + dark. No hardcoded light-only greys.

## Sticky Integration

Unchanged architecture: Advanced remains inside Edit form above sticky Save. Preview confirms sticky CTA separate from Advanced content. No nested scroll owners introduced.

## Accessibility

- `type="button"` preserved on draft Eye
- `aria-expanded` / `aria-controls` preserved
- Focus-visible rules retained
- Touch targets ≥44px (`2.75rem`)

## Create Regression

Create does not mount `ProductCustomizationOverridesPanel`. Shared form CSS untouched for Create-required markers. Expected Create unchanged (session blocked for live Create open).

## Builder Regression

Immediate mode **does not** receive `editHierarchy`. Builder markup/actions preserved. Hierarchy polish is Edit draft-scoped.

## Source Delta

| File | Change |
|------|--------|
| `product-customization-overrides-panel.tsx` | `editHierarchy`; summary; `Oculta` chips; option price element; data-level/hidden |
| `product-customization-admin.module.css` | Level 1–3 Edit hierarchy styles |
| `admin-products-edit-advanced-visual-hierarchy-polish.verify.ts` | **NEW** focused verify |
| Phase / CURRENT_PHASE / living audit / memory | docs |

No actions / RPC / migrations / draft equality helpers modified.

## Focused Verification

`npx tsx lib/products/admin-products-edit-advanced-visual-hierarchy-polish.verify.ts` → **PASS**

## Mutation Probes

| Probe | Result |
|-------|--------|
| A remove option list separator/radius-0 under editHierarchy | FAIL → restore PASS |
| B remove `hiddenBadge` | FAIL → restore PASS |
| C draft Eye `type="button"` → `submit` | FAIL → restore PASS |

## Browser Visual Matrix

| Check | Result |
|-------|--------|
| CSS hierarchy fixture light 412 | PASS |
| CSS hierarchy fixture dark 390 | PASS |
| CSS hierarchy fixture 360 | PASS |
| Live products list 412 dark | PASS (pre-logout) |
| Live Edit with Advanced groups | **DEFERRED** — session expired / auth blocked |
| Create live | DEFERRED (auth) |
| Builder live | DEFERRED (auth); source-scoped safe |

## Data Safety

Live interactions: Eye toggles only when authenticated earlier; this phase final matrix used non-mutating CSS fixture. No Save clicked on dirty draft in this phase closeout.

products / overrides / categories / profiles / Storage / orders / DB / RLS / RPC / migration history: **0** mutations intended by this phase.

## Remaining Visual Debt

- Live Edit flyout re-auth visual confirm on BBQ Bacon / Doble Smash (owner)
- Release-lip inert CSS (`headerReleaseClip` / `bodyReleaseClip`) left untouched
- Preview used text placeholders for Eye icons; production uses Lucide (quieter)

## Next

**OWNER VISUAL REVIEW** on live Edit Advanced  
→ then PRODUCT REMOVAL DECISION or RELEASE SEQUENCING

COMMIT/PUSH/DEPLOY: **PAUSED**
