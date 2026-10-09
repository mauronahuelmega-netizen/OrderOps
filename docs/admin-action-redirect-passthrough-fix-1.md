# ADMIN-ACTION-REDIRECT-PASSTHROUGH-FIX-1

# Result

**PASS.** `PROD-P2-9` CLOSED.

# Root Cause

`requireAdminContext` / `requireAdminPermission` call Next.js `redirect()`, which
throws control-flow. Server Actions wrapped that guard **inside** `try/catch` and
passed the throw to `getActionErrorMessage`, which returned the literal
`error.message` (`NEXT_REDIRECT`). The redirect never completed; the UI showed
the string instead.

# Implementation

affected action files: **8**  
actions moved: **41**

| file | actions | guard |
|---|---|---|
| `categories/actions.ts` | 2 | `manageProducts` |
| `dashboard/actions.ts` | 3 | `managePublicSettings` |
| `orders/[id]/actions.ts` | 2 | `updateOrders` |
| `products/actions.ts` | 4 | `manageProducts` |
| `products/customizations/actions.ts` | 24 | `manageProducts` |
| `settings/notifications/actions.ts` | 3 | `requireAdminContext` |
| `settings/operations/actions.ts` | 1 | `managePublicSettings` |
| `settings/public/actions.ts` | 2 | `managePublicSettings` |

pattern: **guard outside try**

Already correct (not modified): `team/actions.ts`.  
Not in scope (guard without `getActionErrorMessage` catch): `orders/actions.ts`,
`products/preview/actions.ts`.

outliers: **none**

# Preserved

- permissions: byte-for-byte unchanged
- error normalization: `getActionErrorMessage` retained in every catch
- business logic / cache / revalidation / payloads: unchanged
- auth helpers (`lib/admin/context.ts`, `action-errors.ts`): unchanged
- no `NEXT_REDIRECT` string parsing, no `unstable_rethrow`, no `next/dist/*`

# Verification

- targeted: `lib/admin/admin-action-redirect-passthrough.verify.ts` — **PASS** (8 files, 41 actions)
- behavior: synthetic `getActionErrorMessage` cases PASS; auth-redirect escape is
  **SOURCE-DETERMINISTIC** (guard precedes normalizing try; no session destroy / browser logout)
- tsc: **PASS**
- diff: **PASS**

# Boundaries

UI / CSS / DB / RPC / migrations / RLS / Products visual: untouched.  
Data mutations: 0. Commit / push / deploy: none.

# Gate

All implicated actions traced; guards outside normalizing catch; permissions
preserved; real errors still normalized; no framework-error parsing; static
checks green.
