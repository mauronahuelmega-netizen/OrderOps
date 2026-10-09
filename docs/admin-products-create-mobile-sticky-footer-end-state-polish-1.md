# ADMIN-PRODUCTS-CREATE-MOBILE-STICKY-FOOTER-END-STATE-POLISH-1

## Result

**PASS** — Create mobile sticky footer MID vs END visual regression closed.

## Owner Evidence

412 × ~915 light: MID sticky footer compact; END showed an extra white band below the CTA, making the footer region look taller.

## Delta Audit

scroll owner:
`.body` (`flyout-panel.module.css`) — `overflow-y: auto`

form owner:
`form.createForm.shell` (`product-form.module.css`)

footer owner:
`.createActions.actionsSticky`

CTA owner:
`.createActions .admin-primary-button`

## Root Cause

classification:
**CASE B** — Footer box geometry constant; trailing parent padding becomes visible at END.

selector:
`.createForm.shell` (mobile rule previously `padding: 0.75rem var(--create-shell-inline) 0.875rem`)

property:
`padding-bottom: 0.875rem` (**14px**)

why MID differs from END:
Sticky footer sticks flush to `.body` bottom during MID (`footerToBodyBottom = 0`). At max scroll the form’s trailing padding paints **after** the last child (the sticky footer), exposing a 14px band below the footer surface (`footerToBodyBottom = 14`). Footer/CTA heights themselves did not change.

## Geometry Before

Primary: 412 × 915 light

| state | footer h | CTA h | CTA→footer bottom | footer→body bottom | form pad-b |
|-------|---------:|------:|------------------:|-------------------:|-----------:|
| MID | 71 | 48 | 12 | **0** | 14px |
| END | 71 | 48 | 12 | **14** | 14px |

## Fix

exact CSS:
- `.createForm.shell:has(.actionsSticky) { padding-bottom: 0; }`
- mobile `.createForm.shell` padding bottom → `0` (was `0.875rem`)

scope:
Create-only (`createForm`)

safe-area:
preserved on `.actionsSticky` / `.createActions.actionsSticky`

dvh:
preserved

single-scroll:
preserved (`.body`)

## Geometry After

| state | footer h | CTA h | CTA→footer bottom | footer→body bottom | form pad-b |
|-------|---------:|------:|------------------:|-------------------:|-----------:|
| MID | 71 | 48 | 12 | **0** | 0px |
| END | 71 | 48 | 12 | **0** | 0px |

delta MID→END: footerH 0 · CTA 0 · CTA→footer 0 · footer→body **0**

## Runtime Matrix

| viewport | theme | MID | END | overflow | result |
|----------|-------|-----|-----|----------|--------|
| 412 × 915 | light | stable | stable | 0 | PASS |
| 360 × 640 | light | stable | stable | 0 | PASS |
| 390 × 640 | dark | stable | stable | 0 | PASS |

## Edit Guard

Coca Cola read-only: Stock actual, track true, stock 3, sticky footer, formRoot pen pad 76px, no createActions — PASS.

## Frozen Contracts

viewport dvh · single scroll · sticky · safe-area · full-bleed · CTA inset · stock defaults · focus-visible · feedback spacer fix — all preserved.

## Data Safety

creates 0 · updates 0 · Storage 0 · orders 0

## Verification

focused: PASS  
final visual QA / viewport / stock / flyout: PASS  
mutation (restore 0.875rem trailing pad): FAIL → RESTORED PASS  
tsc: PASS  
diff: PASS

## Runtime Scope

`components/admin/products/product-form.module.css`  
`lib/products/admin-products-create-mobile-sticky-footer-end-state-polish.verify.ts`  
docs: phase + CURRENT_PHASE + living audit + memory handoff

## Create Decision

**CREATE MOBILE: FROZEN AGAIN / PRODUCTION-READY**

## Next

OWNER REVIEW → EDIT SIMPLE MOBILE VISUAL QA

COMMIT/PUSH/DEPLOY: **PAUSED**
