# ADMIN-PRODUCTS-FLYOUT-FORM-INTERACTION-POLISH-1

## Result

**PASS** (2026-09-09)

## Closed

P2-3: **CLOSED** — flyout/form remainder touch targets ≥44×44 (Close, inputs/selects, image/crop badge, icon buttons, stock/availability switches, sticky CTA; crop Cancel/Apply/zoom via crop CSS).

P2-4: **CLOSED** — sticky footer opaque `--bg-surface` + border-top + upward shadow; form clearance via `:has(.actionsSticky)` last-field padding so Create/Edit final controls scroll above footer.

P2-5: **CLOSED** — dialog-local initial focus (Cerrar), Tab/Shift+Tab wrap, Escape → `closeFlyout`, opener capture/restore for manual openers; auto-open without opener safe (no restore).

## Focus

initial: Close button (`closeButtonRef`) after panel visible  
trap: `dialogRef` keydown; focusables recomputed per Tab  
Escape: canonical `closeFlyout` (skipped while crop modal title present)  
return: `openerRef` + `isConnected` restore on mode → null  

## Footer

surface: solid `var(--bg-surface)`, border-top, soft upward shadow  
Create: last fields above footer @390 (measured)  
Edit: same @390 and desktop  

## Touch Targets

count: 11 discrete Edit targets measured @390 (all pass); Create parity + crop CSS ≥44  
minimum: **44×44**  
under 44: **0**

## Runtime

390 Create: PASS (focus, trap, footer, Escape → `+ Nuevo producto`)  
390 Edit: PASS (focus, trap, footer, Escape → ProductCard)  
desktop: PASS (table action opener; Escape → Acciones)

## Verification

targeted: PASS  
tsc: PASS  
diff: PASS  

## Boundaries

No collection/card/table image CSS. No actions/DB. No dirty tracking. No validation/persistence changes. No crop algorithm/upload changes. No commit/push/deploy.

## Remaining

P3 focus-visible debt outside this remainder: not claimed closed.  
Image lifecycle / remove / delete: deferred.  
Dirty tracking / unsaved confirm: deferred.  
Next: **ADMIN-PRODUCTS-SKU-DATA-INTEGRITY-1**
