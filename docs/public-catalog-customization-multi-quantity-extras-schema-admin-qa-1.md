# PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-SCHEMA-ADMIN-QA-1

## Estado

```text
QA COMPLETE WITH ACCEPTED P3 ADMIN SAVE DEBT — MULTI-QUANTITY EXTRAS SCHEMA ADMIN QA-1 PASSED
```

Additional accepted P3 debts: local migration not executed (Docker/Supabase local unavailable); types updated manually (no gen script).

## Contexto

Formal QA for `PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-SCHEMA-ADMIN-IMPL-1`.

- Branch: `cursor-handoff-public-catalog-ui-redesign`
- HEAD: `89aecc2` (+ dirty IMPL-1 package)
- Docs-only QA phase — no runtime/CSS/remote DB/product mutations

## Preflight

| Check | Result |
|-------|--------|
| Branch | `cursor-handoff-public-catalog-ui-redesign` |
| HEAD | `89aecc2` |
| Dirty tree | IMPL-1 + prior audit/spec docs only |
| Boundary (public/cart/checkout/success/whatsapp/orders/globals/theme/package) | **No diff** |

## Migration SQL QA

File: `supabase/migrations/20260813010000_add_quantity_enabled_customization_extras.sql`

| Requirement | Result |
|-------------|--------|
| `allows_option_quantity boolean NOT NULL DEFAULT false` | PASS |
| `max_total_quantity integer NULL` | PASS |
| `max_quantity integer NOT NULL DEFAULT 1` | PASS |
| `customization_groups_max_total_quantity_positive` | PASS (`null OR >= 1`) |
| `customization_options_max_quantity_positive` | PASS (`>= 1`) |
| No data UPDATE / RLS / triggers / new tables / min_quantity / selection_type cross-CHECK | PASS |
| Idempotency | PASS — `IF NOT EXISTS` columns; `DROP CONSTRAINT IF EXISTS` then add |

One-shot migrations convention: re-run safety via drop-if-exists — OK.

## Types QA

`types/database.ts` — Row/Insert/Update include:

- groups: `allows_option_quantity`, `max_total_quantity`
- options: `max_quantity`

| Check | Result |
|-------|--------|
| snake_case | PASS |
| Optional Insert/Update | PASS |
| `tsc --noEmit` | PASS |
| Manual generation | **P3 TYPES_GENERATION_DEBT** accepted |

## Admin group editor QA

`section-edit-modal.tsx` + `parseCustomizationGroupInput`:

| Behavior | Result |
|----------|--------|
| Multiple shows “Permitir cantidades por opción” | PASS (code) |
| Toggle on → “Máximo de unidades en total” required min=1 | PASS |
| Single → hidden `allows=false`, `max_total=""` | PASS |
| Switch to single clears allows state | PASS |
| Copy “Máximo de opciones distintas” | PASS |
| Parser forces allows only if `selectionType === "multiple"` | PASS |
| Empty/0 max_total when allows → validation error | PASS |
| Insert/update persist new columns | PASS |
| Quantity off → reset options `max_quantity=1` | PASS |

Admin visual save against real DB: **not exercised**.

## Admin option editor QA

`option-edit-modal.tsx` + `parseCustomizationOptionInput`:

| Behavior | Result |
|----------|--------|
| Field visible only if multiple + `allows_option_quantity` | PASS |
| Else hidden `max_quantity=1` | PASS |
| Parser forces 1 when group off | PASS |
| Rejects maxQuantity &lt; 1 when group on | PASS |
| Create/update persist `max_quantity` using group ownership flags | PASS |
| price_delta / name / availability / sort untouched | PASS |

## Persistence / validation QA

| Flow | Result |
|------|--------|
| UI → parser → action → Supabase columns | PASS by code |
| Group ownership includes `selection_type`, `allows_option_quantity` | PASS |
| Option create/update re-reads group flags | PASS |
| Invalid 0 values blocked in parsers + HTML min=1 | PASS |
| Single cannot persist effective allows=true | PASS |

## Public behavior regression

| Check | Result |
|-------|--------|
| Diff public/catalog, cart, checkout, success, whatsapp, orders | None |
| HTTP catalog/checkout/success | 200 |
| Modal Doble Smash | radio Papas + checkbox Salsas/Agregados; **no steppers** |
| create_order | 0 |

## Technical validation

| Check | Result |
|-------|--------|
| `tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `git diff --check` | PASS |
| `npm run lint` | P3 ESLint 9 circular (non-blocking) |

## Local admin QA

Admin login/save against production-linked DB: **skipped** (no disposable isolated tenant guarantee).

Code/UI wiring PASS. Save path: accepted P3 debt.

## Local migration QA

```text
LOCAL_MIGRATION_EXECUTION_DEBT — SQL reviewed but not applied locally.
```

`supabase status` failed: Docker Desktop engine not running (`dockerDesktopLinuxEngine` missing). No local migration up. No remote push.

## Safety

```text
production DB push: 0
remote migration applied: 0
product/tenant/admin data mutation: 0
create_order: 0
pedidos reales: 0
WhatsApp real: 0
checkout submit: 0
cart/checkout/order files changed: 0
public catalog files changed: 0
motion files changed: 0
package/lockfile changes: 0
secrets logged: 0
```

## Findings

| ID | Severity | Finding |
|----|----------|---------|
| F1 | Pass | Migration/constraints match SPEC |
| F2 | Pass | Types + tsc/build |
| F3 | Pass | Admin parsers/actions/UI wired |
| F4 | Pass | Public binary modal unchanged |
| F5 | P3 | Admin save not exercised |
| F6 | P3 | Local migration not applied (no Docker) |
| F7 | P3 | Types manual / ESLint tooling |

No P0 / P1 / P2.

## Risks / Debt

| ID | Severity | Disposition |
|----|----------|-------------|
| Admin save not exercised | P3 | **ACCEPTED** — avoid real data mutation |
| Local migration execution | P3 | **ACCEPTED** — SQL reviewed; apply in authorized env at COMMIT-DEPLOY |
| Types generation script absent | P3 | **ACCEPTED** — manual types; tsc PASS |
| Admin list may error until migration applied | Info | Expected until release applies SQL |

## Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-SCHEMA-ADMIN-COMMIT-DEPLOY-1 = ALLOWED_WITH_ACCEPTED_P3_ADMIN_SAVE_DEBT
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-SCHEMA-ADMIN-QA-1 = COMPLETE_WITH_ACCEPTED_P3_ADMIN_SAVE_DEBT
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-SCHEMA-ADMIN-IMPL-1 = COMPLETE_WITH_ADMIN_SAVE_QA_DEBT
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-PUBLIC-CART-IMPL-1 = PAUSED_UNTIL_SCHEMA_ADMIN_RELEASE
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-SPEC-1 = COMPLETE_WITH_DATA_MODEL_MIGRATION_REQUIRED
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-AUDIT-1 = COMPLETE_WITH_DEBT
```
