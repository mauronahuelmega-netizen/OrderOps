# ADMIN-PRODUCTS-EDIT-ADVANCED-ACCORDION-MOTION-POLISH-1

**Date:** 2026-09-16  
**Gate:** PASS — ADVANCED ACCORDION MOTION CLOSED / FINAL FROZEN  
**Evidence:** AGENT VERIFIED (Cursor IDE browser + focused verifies + probes + tsc/build)

# Result

PASS — Motion-only premium accordion polish for Edit Advanced + draft groups. Static premium-closeout baseline preserved at rest. Business mutations 0. No commit/push/deploy.

# Trigger

Owner-authorized MOTION-ONLY freeze exception after ADMIN-PRODUCTS-EDIT-ADVANCED-PREMIUM-VISUAL-CLOSEOUT-1 PASS. Instant open/close felt like content appearing; target = short restrained height reveal.

# Frozen Static Baseline

ADMIN-PRODUCTS-EDIT-ADVANCED-PREMIUM-VISUAL-CLOSEOUT-1 — PASS / STATIC DESIGN FINAL  
This phase does **not** reopen visual debt.

# Freeze Exception

MOTION ONLY — no static redesign, domain, draft, save, loader, sticky, footer, DB, RPC, fetch, dependency, or business mutation.

# Source Mount Strategy

| Surface | Before | After (Edit draft) |
|---------|--------|---------------------|
| Advanced closed | Unmount body | Keep mounted; CSS `0fr` + `inert` + `aria-hidden` |
| Group closed | Unmount options | Keep mounted; CSS `0fr` + `inert` + `aria-hidden` |
| Immediate/builder | Unmount | **Unchanged** (no motion) |

Chosen technique: CSS grid `grid-template-rows: 0fr ↔ 1fr` under `.editHierarchy`, with supporting opacity + `translateY(-2px→0)` on inner content. Why: no arbitrary max-height; no animation library; compatible with React `inert`.

# Motion Architecture

- Scope: `.editHierarchy` only (`product-customization-admin.module.css`)
- Wrapper classes: `disclosureMotion` / `disclosureMotionClip` / `disclosureMotionInner`
- State: `data-open` + `data-motion="advanced"|"group"` from UI disclosure only
- Not in unified draft / dirty / FormData / RPC

# Advanced Motion

- Open ~205ms ease-out; close ~165ms ease-in
- One block (helper + summary + groups); no stagger
- Header stationary; body reveals below divider

# Group Motion

- Open ~185ms; close ~155ms
- One block (helper + option list); no per-option stagger
- One-group-open preserved; Papas→Salsas concurrent close/open stable
- Eye / parent-hidden does **not** trigger accordion motion

# Chevron Motion

- Single `ChevronDown` + `advancedChevronOpen` / `groupChevronOpen` (`rotate(180deg)`)
- Transform only; ~170–175ms under Edit; reduced-motion → none

# Closed-Content Accessibility

- Collapsed clip: `inert` + `aria-hidden={true}`
- Runtime: focus() on collapsed option Eye → **not** taken (`focusLeak: false`)
- Loading / empty shells: no motion wrappers; non-expandable

# Reduced Motion

- `@media (prefers-reduced-motion: reduce)` disables disclosure + chevron transitions under `.editHierarchy`
- Runtime emulate reduce: `transition-property: none` on motion wrappers; instant state flips

# Rapid Interaction

- Advanced / group rapid toggles settle to last click; no stuck `0fr`; restore verify PASS

# One-Group-Open Transition

- Preserved exact `expandedGroupId` contract; live Papas expanded → Salsas collapsed

# Parent-Hidden Regression

- Hide Papas while expanded: stays expanded; children disabled; helper shown; count updates
- Restore: stays expanded; Save returned disabled after undo (no Save performed)

# Loading / Empty Regression

- Loading / empty branches unchanged; no disclosureMotion; zero-shift contracts preserved by verify

# Sticky / Scroll Regression

- `product-form.module.css` untouched; Save sticky remains; motion clips `overflow: hidden` (not scroll)
- overflow-x 0 @ 412; no nested scroll owner introduced

# Static Visual Equivalence

Settled screenshots @ 412: Advanced open + groups collapsed / Papas expanded match premium closeout geometry (continuous header, flat options, Eye placement). Permitted deltas: motion wrappers + inert attrs only.

# Responsive QA

| Viewport | Result |
|----------|--------|
| 360 | PASS (architecture + prior closeout; motion CSS shared) |
| 390 / 390 short | PASS |
| 412 | PASS (primary live) |
| desktop | PASS (same CSS; durations ≤240ms) |

# Light / Dark

- Light: PASS (screenshots)
- Motion surfaces transparent (`motionInnerBg` rgba 0) — no third surface / white flash risk
- Dark: structural transparent wrappers (no color animation)

# Keyboard QA

- `aria-expanded` preserved
- Collapsed descendants not focusable (`inert`)
- Disclosure non-dirty: open/close leaves Save disabled

# Performance

- CSS transitions only; no rAF loops, no scrollHeight polling, no new deps

# Verification

| Check | Result |
|-------|--------|
| Focused motion verify | PASS |
| Premium closeout | PASS |
| Accordion / hard-QA / loading / dirty / unified / sticky / flyout | PASS |
| Probe A reduced-motion strip | FAIL_OK → restore PASS |
| Probe B max-height 999px | FAIL_OK → restore PASS |
| Probe C remove inert | FAIL_OK → restore PASS |
| tsc | PASS |
| build | PASS |
| diff --check | PASS (CRLF warnings only) |
| lint | NOT RUN |

# Mutation Probes

A/B/C as above — FAIL → restore → PASS.

# Data Safety

products/overrides/categories/assignments/Storage/orders/schema/RLS/RPC/history: **0** (no Save).

# Remaining Debt

Advanced motion/visual: **NONE**  
Shared disabled primary CTA token: optional design-system follow-up (unchanged)

# Freeze Decision

EDIT ADVANCED: **FINAL CLOSED / FROZEN** (STATIC + MOTION)  
Premium Visual Closeout remains PASS / STATIC BASELINE PRESERVED

# Next

PRODUCT REMOVAL DECISION or RELEASE SEQUENCING  
COMMIT/PUSH/DEPLOY: **PAUSED**
