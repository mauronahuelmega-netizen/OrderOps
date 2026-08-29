# ADMIN-ORDER-WORKSPACE-MOBILE-PERSISTENT-STATUS-ACTION-1

**Date:** 2026-08-21  
**Gate:** PASS WITH REAL-DEVICE QA DEBT — MOBILE WORKSPACE FROZEN  
**Baseline commit:** 81b1162 (uncommitted working tree)  
**Evidence mode:** AGENT VERIFIED (Cursor IDE browser, authenticated)

### History — previously blocked

Earlier close attempt was **BLOCKED — ADMIN SESSION REQUIRED FOR RUNTIME MATRIX**. Authenticated runtime matrix completed 2026-08-21 evening.

### Addendum — mobile Estado heading (2026-08-21)

On ≤719, the visible `Estado` heading is visually hidden (sr-only clip) as redundant after the persistent contextual action + header status chip + manual-correction label. Semantic/`aria-labelledby` identity preserved. ≥720 heading unchanged. Risk/terminal copy unchanged. **Runtime verified.**

---

## 1. Objective

On narrow mobile (≤719px), keep the contextual primary status action permanently available at the bottom of the workstation while a valid transition exists — without a second mutation controller and without changing desktop/tablet inline Estado behavior.

## 2–12. Architecture (frozen — unchanged during resume)

See prior sections in git history / implementation notes. Summary:

- Authoritative `useOrderStatusMutation`: **1** in `AdminOrderWorkspaceModal` (StatusForm unused internal when prop supplied).
- ≤719 persistent footer CTA; ≥720 inline Estado CTA.
- Terminal: no contextual CTA / no footer shell.
- Mobile `Estado` heading: sr-only.
- Scroll owner: `.workspaceGrid` only.
- Footer: structural flex sibling (not `position:fixed`).
- No viewport JS.

**Runtime changes during resume:** NONE.

## Runtime environment

| Field | Value |
| ----- | ----- |
| Auth | demo owner `laburguesia@demo.com` |
| Tenant | La Burguesía |
| Primary order | `#7DC3` / `e6e2a819-3018-48f9-b9d9-4025b4847dc3` (long comanda; disposable QA path) |
| Cancelled fixture | `#45E0` / `a0514bae-4edf-46e0-8013-c4b69d4045e0` |
| Browser | Cursor IDE browser |
| Primary viewport | 390×844 |
| Evidence | AGENT VERIFIED |
| Real Android | NOT EXECUTED |

## Status matrix (footer only) — AGENT VERIFIED

| Starting | Footer | After click | Settled | Next footer |
| -------- | ------ | ----------- | ------- | ----------- |
| pending | Empezar preparación | Actualizando… | preparing | Marcar como listo |
| preparing | Marcar como listo | — | ready | Completar pedido |
| ready | Completar pedido | — | completed | none |
| completed | none | — | — | none |
| cancelled | none | — | — | none |

Unsaved manual isolation: select Listo (unsaved) → footer remained Empezar preparación → click → **preparing** (not ready). PASS.

Double-submit: two rapid clicks on first transition → settled **preparing** only; shared pending (`Actualizando…` + select disabled). Extra no-op info toast “No hubo cambios…” observed (P3). Status not double-advanced. PASS (safe).

Pending state shared: PASS.

Manual correction completed→pending: footer reappeared Empezar preparación. PASS.

Reopen completed: no footer; select completed; Pedido completado. PASS.

Kanban: `#7DC3` aria-label → `estado completado` after ready→completed. PASS.

Cancellation confirmation destructive path: NOT EXECUTED this resume (source contract unchanged). Cancelled fixture: footer none + Pedido cancelado. PASS.

## Responsive CTA counts (active pending) — AGENT VERIFIED

| Width | Persistent | Inline | Heading visible |
| ----: | ---------: | -----: | --------------: |
| 360 | 1 | 0 | 0 |
| 390 | 1 | 0 | 0 |
| 430 | 1 | 0 | 0 |
| 719 | 1 | 0 | 0 |
| 720 | 0 | 1 | 1 |
| 768 | 0 | 1 | 1 |
| 1024 | 0 | 1 | 1 |
| 1440 | 0 | 1 | 1 |

## Scroll @390 (long `#7DC3`) — AGENT VERIFIED

| Check | Result |
| ----- | ------ |
| Top / middle / bottom footer visible | PASS (footerTop stable ~781) |
| Last content reachable above footer | YES |
| Nested scrollables | only `workspaceGrid` |
| Body overflow | `hidden` |
| Panel height | 844 ≈ 100dvh |
| Footer height | ~63px |
| Overlay | none |

## Theme / overflow

Dark mobile matrix primary. Light: spacing/token based — no visual defect observed on surface tokens. Overflow 360/390/430: none.

## Console

expectedStatus / workspace-boundary / Next overlay: **NONE** observed during matrix.

## Network / events

New network from placement: **0**. Mutation writes: existing status action path. Events: **NOT OBSERVED** (no timeline instrumentation).

## Regression / static

| Check | Result |
| ----- | ------ |
| pending-status-mutation-finalization.verify | PASS |
| admin-contextual-default.verify | PASS |
| order-preparation.verify | PASS |
| tsc | PASS |
| diff-check | PASS |
| build | PASS |
| lint | known ESLint 9 circular JSON only |

## P0–P3

- P0 / P1: none
- P2: none
- P3: double-click may emit extra “No hubo cambios…” info toast; real Android NOT EXECUTED

## Gate

```text
ADMIN-ORDER-WORKSPACE-MOBILE-PERSISTENT-STATUS-ACTION-1
= PASS WITH REAL-DEVICE QA DEBT — MOBILE WORKSPACE FROZEN

DESKTOP WORKSPACE: REMAINS FROZEN
MOBILE WORKSPACE: FROZEN
Contextual status runtime gate: REMAINS CLOSED
Manual cancellation safety: REMAINS PASS
WhatsApp contextual default: REMAINS PASS
Dashboard overall polish: OPEN

No commit. No push. No deploy.
```
