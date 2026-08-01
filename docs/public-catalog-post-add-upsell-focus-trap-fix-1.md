# PUBLIC-CATALOG-POST-ADD-UPSELL-FOCUS-TRAP-FIX-1
## Targeted Post-Add Dialog Focus Containment

**Date:** 2026-08-01
**Status:** **PASS - POST-ADD FOCUS TRAP FIX VERIFIED IN PRODUCTION**

```text
MODE - TARGETED POST-ADD FOCUS TRAP RUNTIME FIX
ROOT-CAUSE-FIRST
MINIMAL RUNTIME CHANGE
SYSTEM CHROME + BUNDLED CODEX PLAYWRIGHT
EPHEMERAL BROWSER CONTEXTS
ISOLATED GIT WORKTREE
AUTHORIZED FUNCTIONAL COMMIT
AUTHORIZED PUSH TO ORIGIN/MAIN
NO VERCEL CLI
NO MANUAL DEPLOY
NO DATABASE CHANGES
NO MIGRATIONS
NO CHECKOUT SUBMIT
NO REAL ORDERS
```

## Root cause

**VERIFIED FROM SOURCE AND THE PRE-FIX BROWSER PROBE:** the post-add sheet already computed first and last focusable elements, but listened for `keydown` on `window` in the bubbling phase. The focused production probe escaped the dialog to `Ver pedido, 1 producto` and catalog controls. The empty-focusable branch also allowed native Tab behavior.

## Minimal change

`components/public/catalog/post-add-upsell-sheet.tsx` now listens on `document` in capture phase, filters the focus cycle to visible enabled elements, and prevents native Tab behavior when no focusable element remains. No cart, checkout, data, product, upsell, or overlay-flow behavior changed.

## Git and validation

```text
BASE_SHA=649f732dc790a09306ca87cb3dbfc5f868a7d8f2
FUNCTIONAL_COMMIT_SHA=2322999434ed113f897a67c796eb3adde55d7743
FUNCTIONAL_COMMIT_SUBJECT=fix(public-catalog): contain post-add dialog focus
TYPESCRIPT=npx tsc --noEmit PASS
TURBOPACK_BUILD=BLOCKED BY TEMPORARY NODE_MODULES JUNCTION OUTSIDE ROOT
WEBPACK_BUILD=BLOCKED BY PRE-EXISTING OUT-OF-SCOPE CSS MODULE ERRORS
LOCAL_BROWSER=BLOCKED BY THE SAME PRE-EXISTING CSS MODULE ERRORS
```

The build and local-server limitations occurred before the target route could be served and were not changed in this phase.

## Production browser smoke

**VERIFIED IN THIS CODEX RUN** using system Chrome and bundled Codex Playwright in a new `390x844` context against `https://orderops.vercel.app/b/demohamburgueseria/catalogo` after the automatic deployment interval.

```text
PRODUCT=Doble Smash
REQUIRED_SELECTION=Papas chicas
CANDIDATE=Coca Cola 500ml
INITIAL_FOCUS=Cerrar adicionales (inside dialog)
TAB_CYCLE_BEFORE_ATTACH=8/8 inside dialog
SHIFT_TAB_CYCLE_BEFORE_ATTACH=8/8 inside dialog
ATTACH=PASS (Agregado, CTA disabled)
TAB_CYCLE_AFTER_ATTACH=8/8 inside dialog
SHIFT_TAB_CYCLE_AFTER_ATTACH=8/8 inside dialog
DISMISS=Listo -> CartSheet opened
CHECKOUT_SUBMIT=NOT EXECUTED
REAL_ORDERS=0
```

The context cleared only its catalog localStorage after the smoke and was closed. No personal browser profile, admin session, or persistent production mutation was used.

## Gates and remaining debt

```text
QUEUE_GATE: PUBLIC-CATALOG-POST-ADD-UPSELL-POST-DEPLOY-MONITOR-1-FOLLOWUP-2 = ALLOWED
QUEUE_GATE: PUBLIC-CATALOG-POST-ADD-UPSELL-FINAL-HANDOFF-1 = BLOCKED
```

The focus-trap P2 is resolved. Final handoff remains blocked pending the explicitly scoped Followup-2 reconciliation; provider logs/deployment identity, real device, screen reader, preview, closed-store, PWA, fixture timeouts, and the unrelated build limitation remain P3/unverified where applicable.
