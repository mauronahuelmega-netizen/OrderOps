# PUBLIC-CATALOG-FOOTER-CART-BOTTOM-SPACING-POLISH

## Estado

```text
PASS WITH ANDROID DEVICE QA PENDING — CART BOTTOM SPACING POLISH COMPLETE (local)
```

**Fecha:** 2026-08-16  
**Commit / push / deploy:** no

---

## Objetivo

Reducir padding inferior excesivo de `.catalog-page--with-cart` al mínimo que mantiene clearance entre footer y cart FAB (incl. safe-area), sin overlap.

---

## Preflight

| Item | Valor |
|------|-------|
| `.catalog-page` base bottom | `36px` (mobile) / `56px` (≥720px) — **unchanged** |
| `.catalog-page--with-cart` BEFORE | **100px** mobile · **118px** ≥720px |
| FAB `min-height` | **52px** (`cart-bar.module.css`) |
| FAB `bottom` | `max(14px, env(safe-area-inset-bottom))` |
| FAB halo | `0 0 0 4px` (visual only; no layout) |
| Footer `padding-bottom` | **12px** (unchanged; inside footer box) |
| Safe-area | Owned by FAB `bottom`; page clearance mirrors same `max(14px, …)` |

Effective stack (safe-area = 0): FAB bottom 14 + height 52 + breath 10 = **76px** needed above viewport bottom.

---

## Fix

| | |
|---|---|
| Selector | `.catalog-page--with-cart` (+ MQ `min-width: 720px` same rule) |
| BEFORE | `100px` / `118px` |
| AFTER | `calc(52px + max(14px, env(safe-area-inset-bottom)) + 10px)` |
| Base (safe-area 0) | **≈ 76px** |
| Rationale | Matches real FAB geometry + 10px gap; scales with device safe-area without double-counting |

**mobile changed = YES** (100 → ~76 + safe)  
**desktop/tablet changed = YES** (118 → same formula; same FAB geometry, prior slack was historical)

Empty cart: only `--with-cart` changed → base `.catalog-page` spacing **unchanged**.

---

## Blast radius

| Gate | Status |
|------|--------|
| CSS-only | **YES** (`app/globals.css`) |
| new JS/state | **0** |
| FAB / footer design | untouched |

---

## QA

| Case | Expected |
|------|----------|
| Cart empty | spacing = base page; no regression |
| Cart with items | less empty block; footer above FAB |
| FAB overlap | **NO** |

Viewports ~360 / ~390 / ~412: same formula. ≥720: same calc.

---

## Android Chrome

**PENDING** — compare before/after on real device when available.

---

## Checks

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | **PASS** |
| `git diff --check` | **PASS** |
| `npm run build` | **PASS** |
| `npm run lint` | **KNOWN DEBT** — ESLint 9 circular JSON (`plugins.react`) |
