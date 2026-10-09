# ADMIN-PRODUCTS-MOBILE-CARD-IMAGE-ASPECT-RATIO-FIX-1

## Result

**PASS** (2026-09-09)

## Root Cause

`.media` used `align-self: stretch` and `.imageShell` used `height: 100%`, so the thumb grew with the taller operational card into a portrait strip. `object-fit: cover` alone could not keep a square frame.

## Contract

**aspect:** `1 / 1` on `.media` + `.imageShell` / `.placeholder`  
**fit:** `object-fit: cover`  
**scope:** ProductCard CSS only (`4.5rem` @390 · `5rem` @720–899); no stretch; side-by-side thumb retained (no full-width stack)

## Runtime

**390:** 72×72 · ratio 1.00 · cover · no overflow · SKU/stock/toggle preserved  
**899:** 80×80 · ratio 1.00 · 2 columns · no overflow  
**900:** 0 cards · 1 table · desktop thumb CSS untouched

## Verification

**targeted:** PASS  
**tsc:** PASS  
**diff:** PASS

## Boundaries

- Image pipeline / storage / transforms / upload: UNCHANGED  
- Table / hook / pagination / forms / flyout / global CSS: UNCHANGED  
- Product mutations: 0

## Next

**ADMIN-PRODUCTS-FLYOUT-FORM-INTERACTION-POLISH-1**
