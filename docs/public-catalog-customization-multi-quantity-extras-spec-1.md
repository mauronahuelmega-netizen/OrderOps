# PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-SPEC-1

## Estado

```text
SPEC COMPLETE WITH DATA MODEL MIGRATION REQUIRED — MULTI-QUANTITY EXTRAS READY FOR PHASED IMPL
```

## Executive summary

Cierra la especificación para **quantity-enabled option groups**: ciertos grupos `multiple` permiten cantidad por opción (ej. Bacon ×2), afectando el **precio unitario** del producto. La cantidad del producto en carrito permanece ortogonal.

No es un “checkbox seleccionable varias veces”. Es un eje de producto nuevo que requiere migración DB + estado V2 + signature + checkout/`create_order` + snapshot V2 + admin + UI stepper full-width.

Base: audit `docs/public-catalog-customization-multi-quantity-extras-audit-1.md` @ `89aecc2`.

## Source audit

| Finding | Locked decision |
|---------|-----------------|
| Presence-only `optionId[]` | Evolve to qty-aware selection V2 |
| `max_selections` = distinct | Keep for distinct; add `max_total_quantity` for units |
| `price_delta` × 1 | Become `price_delta × option.quantity` |
| Signature omits qty | Must include `optionIdx{qty}` |
| Snapshot V1 no qty | Add `CustomizationSnapshotV2`; keep V1 readers |
| Admin no qty config | Add group toggle + option `max_quantity` |
| UX 2-col too tight | Quantity groups → full-width stepper cards (E+B/C) |

## Product decision

```text
MULTI-QUANTITY EXTRAS = QUANTITY-ENABLED OPTION GROUPS
```

**Definition:** Algunos grupos de personalización `selection_type = multiple` pueden habilitar cantidad por opción. Cada opción del grupo puede tener cantidad `0..max_quantity`. Esa cantidad modifica el **precio unitario** del producto configurado.

### Rules

| Rule | Behavior |
|------|----------|
| Single groups | Radio; qty implícita 1; nunca steppers |
| Multiple + `allows_option_quantity = false` | Checkbox binario (hoy) |
| Multiple + `allows_option_quantity = true` | Stepper cards full-width |
| Product cart qty vs extra qty | **Separados** |
| Qty 0 | Opción no seleccionada (omitida del payload) |
| Qty 1 | Selección simple |
| Qty > 1 | Solo si el grupo es quantity-enabled **y** server lo valida |

### Canonical pricing example

```text
Producto base: $12.500
Bacon: +$1.000 × 2
Cheddar: +$500 × 1
Unitario: $15.000
Product quantity 2 → line $30.000
```

### Default rollout intent

- Grupos existentes: **no** quantity-enabled.
- Owner activa explícitamente (ej. “Agregados extra”).
- Salsas / free toggles tipicamente permanecen checkbox.

## Data model decision

### Group-level (proposed)

```text
customization_groups.allows_option_quantity  boolean NOT NULL DEFAULT false
customization_groups.max_total_quantity      integer NULL
  -- CHECK (max_total_quantity IS NULL OR max_total_quantity >= 1)
```

| Field | Semantics |
|-------|-----------|
| `allows_option_quantity` | `false` default (compat). Solo significativo si `selection_type = 'multiple'`. Si `single`, runtime **fuerza** comportamiento false aunque el bit esté true. |
| `max_total_quantity` | Cap de **unidades totales** del grupo (solo quantity-enabled). |

**Admin rule (locked):** al activar `allows_option_quantity`, exigir `max_total_quantity >= 1` en UI/validación admin. DB puede permanecer nullable para migración; runtime público: si quantity-enabled y `max_total_quantity` null → **fallback bridge** = usar `max_selections` como cap de unidades **solo** en ese caso, documentado como compat temporal (preferir owner set explícito).

### Option-level (proposed)

```text
customization_options.max_quantity  integer NOT NULL DEFAULT 1
  -- CHECK (max_quantity >= 1)
```

| Field | Semantics |
|-------|-----------|
| `max_quantity` | Límite individual. Default `1` = comportamiento actual. En grupos quantity-enabled, admin puede subir (ej. Bacon=5). |

**No MVP:** `min_quantity` por opción. Mínimos siguen en `is_required` / `min_selections` del grupo. Qty 0 = no seleccionado.

### Max semantics (locked)

| Group mode | `max_selections` | `max_total_quantity` | `option.max_quantity` |
|------------|------------------|----------------------|------------------------|
| Non-quantity | Max **distinct** options | Ignored | Effective 1 |
| Quantity-enabled | Max **distinct** options still | Max **total units** | Max per option |

Example:

```text
max_selections = 3
max_total_quantity = 5

OK: Bacon×2, Cheddar×2, Huevo×1  (distinct 3, units 5)
NO: + Cebolla×1                   (distinct 4 > 3)
NO: Bacon×3, Cheddar×3            (units 6 > 5)
NO: Bacon×6                       (option max / group units)
```

### Tables

Reuse `customization_groups` / `customization_options`. **No new table** unless IMPL finds blocker. RLS: same `business_id` policies; column adds only.

## Selection state model

### Modal internal state V2

```ts
type CustomizationSelectionStateV2 = Record<
  string, // groupId
  Record<string, number> // optionId → quantity
>;
```

Rules:

- Missing key or `0` → not selected (normalize away).
- Single: at most one `optionId` with `1`.
- Multiple non-qty: selected options have `1` only.
- Quantity-enabled: `1..min(option.max_quantity, remainingGroupUnits)`.

### Normalizers (required in IMPL)

| Helper | Role |
|--------|------|
| `normalizeSelectionToV2` | Drop zeros; enforce single; clamp |
| `normalizeLegacySelectionToV2` | `Record<groupId, optionId[]>` → qty `1` each |
| `serializeSelectionForCart` | Emit cart selected options with qty |
| `selectionV2ToLegacyOptionIds` | Bridge for any leftover ID-only APIs during transition |

### Compatibility

- Edit cart lines: hydrate modal from cart qty (legacy missing qty → 1).
- localStorage carts without qty → normalize to 1.
- Do not break flag-off / legacy cart paths.

## Pricing model

```text
customizationDelta = Σ (option.price_delta × option.quantity)
finalUnitPrice     = basePrice + customizationDelta
lineTotal          = finalUnitPrice × productQuantity
```

Rules:

- Extra qty affects **unit** price only.
- Product qty multiplies final unit price.
- `price_delta = 0` allowed (show without `+$` or as gratis).
- Never double-count deltas.
- Server recalculates; **never trust client totals**.
- ARS formatting: keep `formatPublicCatalogCurrency`.

### UI price presentation

| Surface | Copy |
|---------|------|
| Option card | `+$1.000 c/u` |
| Qty > 1 | `x2 · +$2.000` (option subtotal) |
| CTA | `Agregar · $15.000` (unit configured) |
| Cart line | Unit + product qty as today; summary includes `Bacon x2` |

## Cart payload and signature

### Cart selected option V2

```ts
type CartSelectedOptionV2 = {
  optionId: string;
  optionName: string;
  priceDelta: number; // unit delta (per one extra)
  quantity: number;   // >= 1 when present; legacy missing → 1
  sortOrder: number;
};
```

`LocalCartSelectedGroup` gains optional `allowsOptionQuantity?: boolean` for display/validation hints (IMPL may derive from live config on edit).

**`LocalCartItemV2.quantity` remains product line qty only.**

### Signature (locked conceptual format)

```text
product:{productId}|groups:{groupId}:{optionId}x{qty},{optionId}x{qty};...|upsells:{ids}
```

Rules:

- Stable sort by `groupId`, then `optionId`.
- Omit qty `0`; always emit `xN` for selected (`x1` explicit preferred for clarity).
- Bacon×1 ≠ Bacon×2 signatures.
- Identical config (including extra qtys) → merge by **product** quantity.
- `1×` product Bacon×4 **does not** equal `2×` products Bacon×2 as the same line identity problem: merge only when **unit config signature** matches; product qty stacks on that signature.
- Legacy signatures without `xN` normalize as `x1` when parsing/comparing during transition.

Upsell signature rules unchanged (product IDs only).

## Checkout / create_order / snapshot

### Checkout payload V2

```ts
type SelectedCustomizationOptionInputV2 = {
  optionId: string;
  quantity: number; // integer >= 1
};

type SelectedCustomizationGroupInputV2 = {
  groupId: string;
  selectedOptions: SelectedCustomizationOptionInputV2[];
};
```

Compat: if legacy `selectedOptionIds: string[]` still appears during transition, treat each as `quantity: 1`. Prefer dual-read once; remove after PUBLIC+ORDER IMPL.

### `create_order` validation (server)

Must enforce:

1. Option exists; belongs to group/business; assignment/overrides allow it.
2. If any `quantity > 1` → group `allows_option_quantity` effective true.
3. `quantity` positive integer.
4. `quantity <= option.max_quantity` (effective 1 if group non-qty).
5. Distinct selected ≤ `max_selections` (when set).
6. Sum of quantities ≤ `max_total_quantity` (or fallback bridge).
7. Required / `min_selections` still pass (distinct counts unless SPEC IMPL clarifies min as distinct — **locked: min_selections = distinct options with qty≥1**).
8. Recalculate `customizationDelta` / `finalUnitPrice` server-side.
9. Reject mismatched client totals.

### Snapshot strategy (locked)

**Introduce `CustomizationSnapshotV2`** (`version: 2`). Do **not** rewrite historical V1 rows.

```ts
type CustomizationSnapshotV2 = {
  version: 2;
  source: "public_checkout";
  configuration_signature: string;
  product: { id: string; name: string };
  groups: Array<{
    group_id: string;
    group_name: string;
    selection_type: "single" | "multiple";
    allows_option_quantity: boolean;
    is_required: boolean;
    min_selections: number;
    max_selections: number | null;
    max_total_quantity: number | null;
    sort_order: number;
    selected_options: Array<{
      option_id: string;
      option_name: string;
      price_delta: number;
      quantity: number;
      total_price_delta: number; // price_delta * quantity
      sort_order: number;
    }>;
  }>;
  pricing: {
    base_unit_price: number;
    customization_total: number;
    final_unit_price: number;
  };
  summary: string[];
};
```

Readers:

- V1 → display as implicit quantity 1.
- V2 → show `xN` when `quantity > 1`.
- Dashboard helpers: branch on `version`.

## Admin product editor behavior

### Group editor (`multiple` only)

```text
[ ] Permitir cantidades por opción
```

When on:

- Show **Máximo de unidades en total** (`max_total_quantity`) — required ≥ 1.
- Keep **Máximo de opciones distintas** (`max_selections`) — clarify copy.

| Control | Single groups |
|---------|---------------|
| Quantity toggle | Hidden/disabled |
| Switch to single | Force `allows_option_quantity = false` (or ignore) |

Do **not** auto-enable on existing groups.

### Option editor

```text
Cantidad máxima por opción  (default 1)
```

Visible only when parent group allows quantity. Examples: Bacon 5, Cheddar 5, Huevo 3.

Warn (soft) if all options remain `max_quantity = 1` while group is quantity-enabled (UX looks like steppers that never go past 1) — P3 admin polish.

## Public modal UX

### Group behavior

| Config | UI |
|--------|-----|
| `single` | Radio (unchanged) |
| `multiple` + quantity off | Checkbox 2-col (unchanged) |
| `multiple` + quantity on | Full-width stepper cards |

### Layout (locked)

Quantity-enabled groups: **full-width** on mobile. No 2-column stepper grid (touch targets, long names, price + controls).

### Card states

**Qty 0:**

```text
Bacon
+$1.000 c/u
[Agregar]
```

**Qty ≥ 1:**

```text
Bacon
+$1.000 c/u · x2 · +$2.000
[-] 2 [+]
```

Rules:

- `+` up to `min(option.max_quantity, remainingGroupUnits)`.
- `-` to 0 removes option.
- At max: plus disabled.
- No checkbox on quantity cards.
- Do **not** reopen/change overlay motion contracts; only control interactions. Respect reduced-motion for any micro-feedback if added later (prefer CSS already used).

### Badges / errors

```text
Opcional · máx. 5 unidades
Opcional · máx. 3 opciones · 5 unidades
```

Error:

```text
Podés sumar hasta 5 unidades en “Agregados extra”.
```

Distinct overflow:

```text
Podés elegir hasta 3 opciones distintas en “Agregados extra”.
```

## Cart / checkout / admin / WhatsApp display

### Cart sheet / checkout summary

```text
Doble Smash
Papas: Papas chicas
Agregados extra: Bacon x2, Cheddar
```

With prices (if surface shows deltas):

```text
Bacon x2 (+$2.000)
Cheddar (+$500)
```

Qty 1: omit `x1` in customer copy (`Cheddar`, not `Cheddar x1`) unless admin prefers always explicit — **locked customer copy:** omit `x1`.

### Admin / kitchen

```text
Doble Smash x1
- Papas: Papas chicas
- Extras: Bacon x2, Cheddar
```

### WhatsApp

| Channel | Spec |
|---------|------|
| Public (`buildPublicOrderWhatsappUrl`) | Keep order-id-focused; **no** mandatory item expansion in this feature |
| Admin WhatsApp | **Should** include extras with qty when summarizing items (ORDER IMPL) |

## Compatibility and migration strategy

```text
1. Add group columns (default allows_option_quantity=false, max_total_quantity null).
2. Add option max_quantity DEFAULT 1.
3. CHECK constraints.
4. Regenerate types/database.ts in SCHEMA-ADMIN IMPL.
5. Do not mutate existing group/option commercial config beyond defaults.
6. localStorage / cart: missing quantity → 1.
7. Snapshots: V1 forever readable; new orders → V2 after ORDER IMPL ships.
8. No backfill of historical order_items.
```

RLS: reuse existing table policies.

## Implementation phases

| Phase | ID | Scope |
|-------|-----|-------|
| 1 | `PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-SCHEMA-ADMIN-IMPL-1` | Migration, types, admin fields; public behavior unchanged until configured |
| 2 | `PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-PUBLIC-CART-IMPL-1` | Modal V2, steppers, cart qty, pricing, signature, localStorage compat |
| 3 | `PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-ORDER-IMPL-1` | Checkout payload V2, create_order validation, snapshot V2, admin display, admin WA if needed |
| 4 | `PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-QA-1` + `…-COMMIT-DEPLOY-1` | Formal QA + release |

Do **not** ship UI-only without signature + server validation.

**Next implementation phase:** SCHEMA-ADMIN-IMPL-1.

## Validation plan

Per IMPL phase:

```text
tsc --noEmit
npm run build
git diff --check
npm run lint
```

Lint: ESLint 9 circular = P3 tooling (non-blocking). Real code lint errors block.

## QA plan

1. Papas remains radio / required.
2. Salsas remains binary checkbox.
3. Quantity-enabled Agregados → full-width steppers.
4. Bacon×2 + Cheddar×1 → unit $15.000 (with stated deltas).
5. Qty → 0 removes option.
6. Option max blocks plus.
7. Group total units blocks plus.
8. Distinct max blocks new distinct option.
9. Cart summary `Bacon x2`.
10. Different extra qty → no merge.
11. Same config → merge product qty.
12. Checkout server price matches.
13. New order snapshot `version: 2` with quantities.
14. Old V1 snapshot still renders.
15. Admin dashboard shows ×2.
16. Admin WA does not drop extras (if touched).
17. Single group ignores accidental `allows_option_quantity=true`.
18. Reduced-motion / overlay motion unchanged.

## Safety constraints

```text
create_order real: 0 during QA unless explicitly authorized
pedidos reales: 0
WhatsApp real: 0
DB writes: only authorized migration/config phases
checkout submit: only authorized flows
motion overlay files: 0 (no reopen)
no secrets logged
```

## Risks / mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Signature omits qty → false merges | P0 | Signature includes `x{qty}`; tests Bacon×1 vs ×2 |
| Server/client price mismatch | P0/P1 | Server recalc only; reject bad totals |
| Snapshot V1 break | P1 | Dual readers; V2 for new orders only |
| `max_selections` semantic break | P1 | Keep distinct meaning; separate `max_total_quantity` |
| Product qty vs extra qty confusion | P1 | Copy + separate fields; cart QA matrix |
| Migration without regenerated types | P1 | SCHEMA-ADMIN includes types regen |
| Legacy localStorage carts | P2/P3 | Normalize qty=1 |
| Admin WA / dashboard omit qty | P2 | ORDER IMPL display + WA admin |
| Qty-enabled with all max_quantity=1 | P3 | Admin soft warning |
| Fallback max_total null → max_selections | P3 | Prefer required admin field; document bridge |

## Explicitly out of scope

- Implementing runtime/CSS/DB in this SPEC phase
- Auto-enabling quantity on existing tenants
- `min_quantity` per option
- Changing public WhatsApp to full item dump
- Upsell Plus product model changes
- Entry routing / Maps / motion reopen
- Commit / push / deploy
- Updating `ORDEROPS_LIVING_MEMORY.md` (deferred to IMPL/release)

## Next implementation phase

```text
QUEUE next:
PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-SCHEMA-ADMIN-IMPL-1 = ALLOWED
```

Deliverables for that phase: migration + CHECKs + types + admin group/option fields; no public stepper until PUBLIC-CART IMPL; no create_order change until ORDER IMPL.

## Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-SCHEMA-ADMIN-IMPL-1 = ALLOWED
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-SPEC-1 = COMPLETE_WITH_DATA_MODEL_MIGRATION_REQUIRED
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-AUDIT-1 = COMPLETE_WITH_DEBT
QUEUE_GATE: PUBLIC-CATALOG-MVP-V1-ENTRY-COMPLETE = COMPLETE_WITH_ACCEPTED_P3_FALLBACK_DEBT
QUEUE_GATE: PUBLIC-CATALOG-MOTION-PUBLIC-CATALOG-COMPLETE = COMPLETE
QUEUE_GATE: PUBLIC-CATALOG-SUCCESS-EDGE-STATES-POLISH-1 = OPTIONAL
QUEUE_GATE: PUBLIC-TENANT-BROWSER-BRANDING-FAVICON-CACHE-BUST-1 = BACKLOG_OPTIONAL
QUEUE_GATE: PUBLIC-ORDERS-PUBLIC-CODE-SPEC-1 = BACKLOG
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-* = PAUSED
```
