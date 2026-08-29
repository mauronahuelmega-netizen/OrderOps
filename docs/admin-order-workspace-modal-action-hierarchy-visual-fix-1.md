# ADMIN-ORDER-WORKSPACE-MODAL-ACTION-HIERARCHY-VISUAL-FIX-1

**Date:** 2026-08-18  
**Status:** **PASS WITH VISUAL QA DEBT** (browser auth required for viewport matrix)  
**Baseline commit (living audit):** `81b1162` (unchanged — no commit this phase)

No commit / push / deploy.

Follow-up to: `docs/admin-order-workspace-modal-hierarchy-polish-1.md`

---

## Problem

After hierarchy polish, real screenshots still showed:

1. duplicated visible **Estado** (section heading + form field label)
2. `Guardar estado` still looking primary in completed/cancelled
3. `Abrir WhatsApp` as a saturated orange full-width primary
4. duplicated conceptual headings: **Contacto con el cliente** + **WhatsApp**

Approved two-column architecture was not reopened.

---

## Fix

| Item | Change |
| --- | --- |
| Duplicate Estado | `StatusForm` `hideFieldLabel` → field text uses global `sr-only`; section heading remains visible |
| Accessible label | `<label className="admin-field">` + sr-only span preserved |
| Terminal CTA | Tokenized quiet surface (`bg-surface` + `text-secondary` + subtle border); not opacity-only |
| Active CTA | `Guardar estado` remains `admin-primary-button` |
| WhatsApp | Workstation `compactContact`: `variant="secondary"` + local `.whatsappAction` using admin tokens |
| Contact heading | Visible **WhatsApp** label hidden (`sr-only`); one heading: **Contacto con el cliente** |
| More actions / Close / Products / Client / Activity | Unchanged |

**Root cause of duplicate Estado:** previous visually-hidden CSS used `:global(.admin-status-form--modal)`, which does not match the CSS-module hashed class. Hide via `sr-only` on the owner label instead.

---

## Functional boundaries

**NONE changed.** No status/assignment/realtime/reconciliation/action behavior.

Responsibility `orderResponsibilityEnabled` wiring untouched.

---

## QA

| Viewport | Result | Notes |
| --- | --- | --- |
| 1440 | **DEBT** | Redirected to `/admin/login` |
| 1024 | **DEBT** | Same |
| 768 | **DEBT** | Same |
| 390 | **DEBT** | Same |
| Dark | **CODE PASS** | Token-only; live smoke blocked |
| Light | **DEBT** | Live smoke blocked |

---

## Findings

| Severity | Item |
| --- | --- |
| **P0** | None |
| **P1** | Duplicate Estado — **FIXED** (code); live DOM confirm pending auth |
| **P2** | Authenticated visual matrix (1440/1024/768/390 + light) |
| **P3** | Contextual status shortcut CTAs — still future UX |

---

## Checks

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | **PASS** |
| `git diff --check` | **PASS** (LF/CRLF warnings) |
| `npm run build` | **PASS** |
| `npm run lint` | **FAIL** — known ESLint 9 circular JSON (`plugins.react`) |
