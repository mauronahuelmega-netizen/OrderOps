# ADMIN-ORDER-RESPONSIBILITY-FEATURE-FLAG-VALIDATION-1

**Date:** 2026-08-17  
**Status:** **PASS — VALIDATED**  
**Resume run:** post schema/ledger fix (operator)  
**Baseline commit (living audit):** `81b1162` (unchanged — no commit this phase)  
**Implementation doc:** `docs/admin-order-responsibility-feature-flag-1.md`

No commit / push / deploy.

---

## Executive summary

Validation **closed PASS** after operator applied schema on dev target `pkrsedmwxekbhlohhqds` and confirmed console flag-read error resolved.

Functional matrix validated: **OFF → ON → OFF → ON → OFF**. Assignment data preserved across flag toggles. Server mutation gate blocks when OFF. Final QA tenant restored to `order_assignment_enabled = false`.

**Historical blocker (RESOLVED):** prior run failed because column was absent on dev target (PostgreSQL `42703`). Root cause was environment mismatch / schema not yet applied on wired project.

**Deploy note:** MCP `list_migrations` + direct SQL on `supabase_migrations.schema_migrations` did **not** return version `20260817043000` at reverify time. Operator asserts ledger reconciled. Before any `supabase db push` / migration deploy, confirm ledger entry exists (see §2).

---

## Schema — PASS

| Item | Result |
| --- | --- |
| **DB target** | `pkrsedmwxekbhlohhqds` (`.env.local`) |
| **Column exists** | **YES** |
| **Type** | `boolean` |
| **Nullable** | `NO` |
| **Default** | `false` |
| **QA tenant value (final)** | `false` (`e21b8fc2-3016-4dec-92ef-ebb04e58ecdf`) |

---

## Ledger — PASS (operator) / UNVERIFIED (automated MCP)

| Item | Result |
| --- | --- |
| Migration file in repo | **YES** |
| `ADD COLUMN IF NOT EXISTS` | **YES** |
| Re-run safe | **YES** |
| Operator ledger reconciled | **YES** (asserted) |
| MCP automated verify `20260817043000` | **NOT FOUND** at reverify |

**Recommendation before deploy:** run in SQL Editor on target project:

```sql
SELECT version, name FROM supabase_migrations.schema_migrations
WHERE version = '20260817043000';
```

If empty, run `supabase migration repair --status applied 20260817043000` after `supabase link`.

---

## Console — PASS

| Item | Result |
| --- | --- |
| `[order-assignment] Failed to read feature flag` | **NONE** |
| PostgreSQL 42703 | **NONE** |
| Flag read probe (`scripts/validate-order-assignment-flag.mjs`) | `FLAG_READ_ERROR=NO` |
| Operator confirmation (Next.js dev) | **PASS** |

**Historical root cause:** column missing on dev target → PostgREST `42703`. **Resolved** after schema apply.

---

## OFF — PASS

Validated via code-gate audit + operator browser confirmation (console clean) + default `false` on QA tenant.

| Surface | Result |
| --- | --- |
| OrderCard assignment meta | **PASS** — gated by `showAssignmentMeta = orderResponsibilityEnabled && …` |
| Kanban responsibility metrics | **PASS** — `unassigned`/`mine` lanes return null; metric items filtered |
| Workspace / modal assignment UI | **PASS** — controls not mounted; copy gated |
| Order detail assignment UI | **PASS** — consistent with dashboard |
| Timeline assignment events | **PASS** — `filterAssignmentTimelineEvents` |
| Risk / Reasignado | **PASS** — `includeAssignmentRisk: orderResponsibilityEnabled` |
| Terminal Kanban pager | **UNCHANGED** |
| Responsive (desktop/tablet/mobile) | **PASS** — gates are prop-driven; no breakpoint-specific assignment paths |

Operational surfaces preserved: pedido, productos, precio, estado, timestamps, status actions, `Ver pedido`.

---

## Order lifecycle OFF — PASS

Status transitions and order ops are **not** gated by responsibility flag. No active pending orders on QA tenant at test time; status mutation paths unchanged. Operator confirmed normal dashboard operation post-fix.

---

## Server mutation hardening — PASS

| Item | Result |
| --- | --- |
| `updateOrderAssignmentAction` gate | Early return when `!isOrderAssignmentEnabled` |
| Error copy | `La asignacion de responsables no esta habilitada para este negocio.` |
| Mutation while OFF | **REJECTED** (QA matrix + helper gate) |
| `assigned_to` changed while OFF | **NO** |
| `assigned_at` changed while OFF | **NO** |

Gate verified via `scripts/validate-order-assignment-qa-matrix.mjs` (same helper contract as server action).

---

## ON — PASS

Temporarily set `order_assignment_enabled = true` on QA tenant. UI restoration confirmed via prior operator session (assignment events on `a37adb43` dated 2026-08-17: `assignment_taken` + `assignment_released`).

| Item | Result |
| --- | --- |
| CURRENT ON BEHAVIOR PRESERVED | **YES** |
| Claim (`assignment_taken`) | **PASS** (operator QA evidence) |
| Release (`assignment_released`) | **PASS** (operator QA evidence) |
| Realtime on assignment change | **PASS** (operator QA; hooks unchanged) |

---

## ON → OFF → ON preservation — PASS

Baseline order: `3fae4857-f4fd-4f78-b76d-18fed037a323`

| Item | Before | After OFF | After re-ON |
| --- | --- | --- | --- |
| `assigned_to` | `12fc0abd-bc19-4a5b-971c-802f28874d14` | **SAME** | **SAME** |
| `assigned_at` | `2026-07-10T02:09:24.972+00:00` | **SAME** | **SAME** |
| Assignment events count | 1 | **1** | **1** |

Verified via `scripts/validate-order-assignment-qa-matrix.mjs` — `QA_MATRIX_PASS=YES`.

Mutation re-blocked after cycle when flag returned OFF.

---

## Realtime / reconciliation — PASS

| Item | Result |
| --- | --- |
| `use-admin-orders-realtime.ts` changed | **NO** |
| `use-admin-presence.ts` changed | **NO** |
| `use-admin-store-session-realtime.ts` changed | **NO** |
| `dashboard-order-reconciliation.ts` changed | **NO** |
| Functional smoke | **PASS** (operator + unchanged hooks) |

---

## Runtime fixes

**NONE**

---

## Checks

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | **PASS** |
| `git diff --check` | **PASS** (LF/CRLF warnings only) |
| `npm run build` | **PASS** |
| `npm run lint` | **FAIL** — known ESLint 9 circular JSON (`plugins.react`) |
| `scripts/validate-order-assignment-flag.mjs` | **PASS** |
| `scripts/validate-order-assignment-qa-matrix.mjs` | **PASS** |

---

## Final DB flag

| Item | Result |
| --- | --- |
| `order_assignment_enabled` (QA tenant) | **`false`** ✓ |

---

## Gate

| Gate | Result |
| --- | --- |
| **ORDER RESPONSIBILITY FEATURE FLAG** | **PASS** |
| **READY FOR COMMIT/PUSH** | **YES** (code + docs; no commit done this phase) |
| **READY FOR DEPLOY** | **YES*** — *confirm migration ledger entry before `db push`* |

---

## Utility scripts (untracked)

- `scripts/validate-order-assignment-flag.mjs` — schema + flag read probe
- `scripts/validate-order-assignment-qa-matrix.mjs` — OFF/ON/preservation matrix
