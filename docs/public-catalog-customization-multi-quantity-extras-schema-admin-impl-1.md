# PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-SCHEMA-ADMIN-IMPL-1

## Estado

```text
PASS WITH ADMIN SAVE QA DEBT — MULTI-QUANTITY EXTRAS SCHEMA ADMIN IMPL-1 COMPLETE
```

Secondary debt: types updated manually (no `supabase gen types` script in package.json) — P3 tooling; `tsc`/`build` PASS.

## Contexto

Implements SPEC-1 phase 1: **SCHEMA + TYPES + ADMIN CONFIG** for quantity-enabled option groups.

Base: `89aecc2` on `cursor-handoff-public-catalog-ui-redesign`.

Public stepper / cart / checkout / create_order / snapshot deferred.

## Scope

**IN**

- Migration columns + positive CHECKs
- `types/database.ts`
- Admin group/option editors
- Parse + persist + normalize validation
- Impl doc + CURRENT_PHASE

**OUT**

- Public modal steppers / selection V2
- Cart signature / checkout / create_order / WhatsApp / dashboard
- Production DB push / commercial data mutation
- Commit / push / deploy

## Migration

`supabase/migrations/20260813010000_add_quantity_enabled_customization_extras.sql`

| Table | Columns | Defaults |
|-------|---------|----------|
| `customization_groups` | `allows_option_quantity boolean NOT NULL` | `false` |
| `customization_groups` | `max_total_quantity integer NULL` | `null` |
| `customization_options` | `max_quantity integer NOT NULL` | `1` |

Constraints:

- `customization_groups_max_total_quantity_positive` (`null` or `>= 1`)
- `customization_options_max_quantity_positive` (`>= 1`)

No RLS changes, no triggers, no data UPDATE, no cross-column CHECK on `selection_type`.

**Not applied to production/remote** in this phase.

## Types

`types/database.ts` updated manually for Row/Insert/Update on both tables.

```text
TYPES_GENERATION_DEBT = P3 tooling/environment
(no package.json db:types / supabase gen types script)
```

## Admin group editor

`section-edit-modal.tsx`:

- Multiple: toggle **Permitir cantidades por opción**
- When on: **Máximo de unidades en total** (required ≥ 1)
- Single: hidden false/null fields
- Copy: **Máximo de opciones distintas**

## Admin option editor

`option-edit-modal.tsx`:

- Shows **Cantidad máxima por opción** only when `group.selection_type === "multiple" && group.allows_option_quantity`
- Otherwise hidden `max_quantity=1`

## Persistence / validation

`lib/product-customization/shared.ts`:

- `parseCustomizationGroupInput` → `allowsOptionQuantity` + `maxTotalQuantity` (forced false/null if not multiple)
- `parseCustomizationOptionInput(formData, { groupAllowsOptionQuantity })` → `maxQuantity` (forced 1 if group off)

`app/admin/.../customizations/actions.ts`:

- Insert/update group with new columns
- On group update with quantity off → reset group options `max_quantity = 1`
- Option create/update reads group flags via ownership

`lib/product-customization/admin.ts` selects include new columns.

## Public behavior guard

No changes under:

- `components/public/catalog/*`
- `lib/cart/*`
- `app/b/[slug]/checkout/*` / `success/*`
- `lib/whatsapp/*` / `lib/orders/*`

HTTP smoke local: catalog/checkout/success → 200.

Existing tenants remain quantity-off until admin enables after migration applied.

## Files changed

| Path | Change |
|------|--------|
| `supabase/migrations/20260813010000_add_quantity_enabled_customization_extras.sql` | **New** |
| `types/database.ts` | Columns |
| `lib/product-customization/shared.ts` | Parse types |
| `lib/product-customization/admin.ts` | Selects |
| `app/admin/(protected)/products/customizations/actions.ts` | Persist |
| `components/admin/.../section-edit-modal.tsx` | Group UI |
| `components/admin/.../option-edit-modal.tsx` | Option UI |
| `docs/public-catalog-customization-multi-quantity-extras-schema-admin-impl-1.md` | This doc |
| `docs/CURRENT_PHASE.md` | Gate |

## Validation

| Check | Result |
|-------|--------|
| `tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `git diff --check` | PASS |
| `npm run lint` | P3 ESLint 9 circular (non-blocking) |

## QA

| Case | Result |
|------|--------|
| Public catalog/checkout/success HTTP | PASS 200 |
| Public stepper absent (code guard) | PASS — public files untouched |
| Admin UI fields wired | PASS by code |
| Admin save exercised | **P3 debt** — no save (avoid DB/product mutation) |
| Migration applied remote | **0** (by design) |

## Safety

```text
create_order: 0
pedidos reales: 0
WhatsApp real: 0
checkout submit: 0
production DB push: 0
remote migration applied: 0
product/tenant/admin data mutation: 0
motion files: 0
cart/checkout/order files: 0
secrets: 0
```

## Risks / Debt

| ID | Severity | Note |
|----|----------|------|
| Admin save not exercised | P3 | Avoided data mutation; validation covered in parsers |
| Types manual | P3 | Regenerate when CLI available |
| Admin list fails until migration applied | Info | Expected; apply migration in authorized env before QA save |
| Public still ignores new columns | Info | Intentional until PUBLIC-CART IMPL |

## Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-SCHEMA-ADMIN-QA-1 = ALLOWED_WITH_ADMIN_SAVE_DEBT
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-SCHEMA-ADMIN-IMPL-1 = COMPLETE_WITH_ADMIN_SAVE_QA_DEBT
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-PUBLIC-CART-IMPL-1 = PAUSED_UNTIL_SCHEMA_ADMIN_QA
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-SPEC-1 = COMPLETE_WITH_DATA_MODEL_MIGRATION_REQUIRED
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-AUDIT-1 = COMPLETE_WITH_DEBT
QUEUE_GATE: PUBLIC-CATALOG-MVP-V1-ENTRY-COMPLETE = COMPLETE_WITH_ACCEPTED_P3_FALLBACK_DEBT
QUEUE_GATE: PUBLIC-CATALOG-MOTION-PUBLIC-CATALOG-COMPLETE = COMPLETE
```
