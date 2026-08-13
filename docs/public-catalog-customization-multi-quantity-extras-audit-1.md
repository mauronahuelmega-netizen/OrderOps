# PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-AUDIT-1

## Estado

```text
AUDIT COMPLETE WITH DATA MODEL DEBT — MULTI-QUANTITY EXTRAS READY FOR SPEC
```

## Executive summary

Hoy los extras del modal de personalización son **binarios** (opción seleccionada / no seleccionada). El cliente necesita **cantidad por opción** (ej. Bacon ×2).

El stack completo (DB → modal → cart signature → checkout payload → `create_order` snapshot → admin summary → WhatsApp) modela **presencia de option IDs distintos**, no unidades. `max_selections` cuenta **opciones distintas**, no unidades totales. No hay `quantity` en `customization_options`, ni en el estado del modal (`Record<groupId, optionId[]>`), ni en el snapshot v1.

**Viable con SPEC + migración end-to-end.** No es un cambio solo de UI. Riesgo principal: confundir **qty del producto en carrito** con **qty de un extra dentro del producto**, y firmas/merge incorrectos.

Base auditada: `cursor-handoff-public-catalog-ui-redesign` @ `89aecc2` (working tree limpio).

## Customer feedback

```text
Quiere poder elegir varias veces el mismo opcional/adicional.
Ejemplo: Bacon x2 en Doble Smash / Agregados extra.
```

Comportamiento actual percibido: checkbox on/off por extra.

## Current visual behavior

Browser local (viewport mobile-ish) — producto **Doble Smash**:

| Grupo | UI | Badge | Control |
|-------|-----|-------|---------|
| Papas | radio single | Obligatorio | 1 columna |
| Salsas | checkbox multi | Opcional · máx. 5 | grid 2 columnas |
| Agregados extra | checkbox multi | Opcional · máx. 5 | grid 2 columnas |

Observado:

- Cards táctiles; nombre + `+$ delta` alineado; control radio/checkbox.
- CTA sticky: `Agregar · $ 12.500,00` deshabilitado si falta Papas + alertas de required.
- Sin stepper / qty por opción.
- Nombres largos (“Salsa Big Mac”) ya estiran en 2 columnas → un stepper inline saturaría el layout.
- Motion overlay enter/exit ya cerrado (no reabrir en esta fase).

## Current customization data model

### Surface table

| Surface | File/Table | Current shape | Quantity support? | Risk | Notes |
|---------|------------|---------------|-------------------|------|-------|
| Groups | `customization_groups` | `selection_type` single\|multiple; `is_required`; `min_selections`; `max_selections` | **No** | Medium | Counts = distinct options |
| Options | `customization_options` | `price_delta`, name, availability, sort | **No** | High for feature | No min/max qty fields |
| Assignments | `customization_group_assignments` | group → category\|product | N/A | Low | |
| Overrides | `product_customization_overrides` | enable/disable | N/A | Low | |
| Modal state | `customization-modal.tsx` | `Record<string, string[]>` | **No** | High | Toggle no-ops duplicates |
| Validation | `public-shared.ts` | Set-deduped unique IDs | **No** | High | “hasta N opciones” |
| Cart V2 | `lib/cart/types.ts` | `selectedOptions: { optionId, priceDelta, … }[]` | **No** | High | Line `quantity` = product only |
| Signature | `lib/cart/signature.ts` | product + sorted option IDs | **No** | Critical | Bacon×1 ≡ Bacon×2 if only IDs |
| Checkout payload | `order-types.ts` | `selectedOptionIds: string[]` | **No** | High | |
| Snapshot | `CustomizationSnapshotV1` | `selected_options[]` sin qty | **No** | High | JSON flexible but schema typed v1 |
| Admin summary | `order-dashboard.ts` | name + delta list | **No** | Medium | |
| Public WhatsApp | `lib/whatsapp/public.ts` | order id only | N/A | Low today | No item lines |
| Admin WhatsApp | `lib/whatsapp/admin.ts` | `qty x product` only | **No** | Medium | Omits extras |

### Obligatory Q&A

| # | Question | Answer |
|---|----------|--------|
| 1 | ¿Una opción puede aparecer más de una vez en el estado? | **No** (toggle + `Set` dedupe en validación/checkout) |
| 2 | ¿Estado Set/string[] o por ID? | `Record<groupId, optionId[]>` (lista de IDs, sin qty) |
| 3 | ¿Precio suma cada opción una vez? | **Sí** (`price_delta` × 1) |
| 4 | ¿máx. 5 = distintas u unidades? | **Opciones distintas** |
| 5 | ¿Config por grupo “permite cantidad”? | **No** |
| 6 | ¿Max individual por opción? | **No** |
| 7 | ¿Serialización carrito? | `selectedGroups[].selectedOptionIds: string[]` + product `quantity` |
| 8 | ¿Serialización pedido? | Snapshot v1 `groups[].selected_options[]` { id, name, price_delta, sort } |

Config vive en **tablas normalizadas** (no JSON de producto). Pedidos guardan **JSON snapshot** en `order_items.customization_snapshot`.

## Modal state and validation audit

**Files:** `components/public/catalog/customization-modal.tsx`, `components/product-customization/shared/customization-option-{group,row}.tsx`, `lib/product-customization/{preview-selection,public-shared}.ts`

- Single → `selectSingleOption` → `[optionId]`; radio.
- Multiple → `toggleMultipleOption`; checkbox; at `maxSelections` → no-op + row disabled.
- Required/min/max: `validateCustomizationSelection` sobre `uniqueSelected.length`.
- CTA total: `basePrice + Σ priceDelta` de opciones listadas (una vez).
- Confirm → `buildCartLinesFromCustomizationSelection` (`quantity: 1` para nueva línea; edit reusa línea).

**Si hubiera cantidad:** el row deja de ser boolean `checked`; validación pasa a sumar unidades; CTA multiplica `priceDelta * qty`; layout 2-col necesita rediseño (ver UX).

## Pricing audit

| Layer | Behavior |
|-------|----------|
| Modal CTA | Base + sum of selected option deltas (once each) |
| Cart line | `finalUnitPrice = base + customizationTotal`; `lineTotal = finalUnitPrice * productQty` |
| Checkout | Server revalida y recalcula desde IDs + catálogo live (no confía ciegamente en client total) |
| Order item | `unit_price` = final customized unit; × product quantity |
| ARS | `formatPublicCatalogCurrency` |

**Caso futuro esperado:**

```text
Base $12.500 + Bacon $1.000×2 + Cheddar $500×1 = $15.000
```

Hoy imposible: seleccionar Bacon una sola vez suma $1.000.

## Cart payload / merge audit

**Critical separation:**

```text
2 × Doble Smash (cada una Bacon×2)  ≠  1 × Doble Smash (Bacon×4)
```

Hoy:

- Signature **no incluye** qty de opción (solo IDs).
- Misma signature → merge incrementa **product quantity**.
- Extra qty no existe → Bacon×1 y Bacon×2 **no se pueden distinguir**.

Para multi-qty: signature **debe** incluir qty por optionId; display `Bacon x2`; product qty stepper del cart sheet permanece ortogonal.

## Checkout / order / WhatsApp audit

| Impact area | Current behavior | Multi-quantity implication | Migration needed? | Risk |
|-------------|------------------|----------------------------|-------------------|------|
| Checkout payload | `selectedOptionIds[]` | Need `{ optionId, quantity }[]` or parallel map | Yes (types + builders) | High |
| `create_order` / validation | Dedupes Set; validates distinct counts | Unit counts + price × qty | Yes (RPC validation path) | High |
| Snapshot v1 | No qty on options | Extend v1 carefully **or** v2 | Yes | High (compat) |
| Admin dashboard | `Extras: Bacon +$…` | Must show `Bacon x2` | Yes (summary builders) | Medium |
| Public WA | No item breakdown | Optional later | No for MVP if unchanged | Low |
| Admin WA | Product qty only | Should include extras qty for kitchen | Recommended | Medium |

## DB / schema / types audit

- Options/groups: **normalized tables** + RLS by `business_id`.
- No CHECK/column that stores option quantity.
- Snapshot JSON is flexible at Postgres level but **typed as `CustomizationSnapshotV1`** in app — bump/extension required for safe readers.
- Types in `types/database.ts` mirror tables — regenerar tras migración.
- **Solo payload JSON sin migración de tablas** podría prototipar qty solo en snapshot/cart, pero **rompería** admin config (“permitir cantidad” / max por opción) y validación server alineada con reglas de grupo. **No recomendado para MVP serio.**

## Admin product editor audit

Group editor: `selection_type`, min/max selections (“Máximo de opciones”), required.
Option editor: name, `price_delta`, description, availability.

- **No** UI “permitir cantidad”.
- **No** max por opción.

**Producto:** no todos los opcionales deben repetirse. Salsas (Mayonesa/Ketchup) suelen ser 0/1; agregados pagados (Bacon/Cheddar/Huevo) son el caso de qty. **Recomendación: solo grupos quantity-enabled (config por grupo), no global.**

## UX alternatives

| Option | Idea | Pros | Cons | Fit |
|--------|------|------|------|-----|
| **A** | Checkbox + stepper siempre | Selección explícita | Doble control; satura 2-col | Débil en mobile |
| **B** | Full-width quantity card | Claro; espacio para `[-] N [+]` y `+$ / c/u` | Pierde grid 2-col en ese grupo | **Fuerte** para extras pagos |
| **C** | Stepper solo tras “Agregar” | Menos ruido inicial | Más estados | **Fuerte** + B |
| **D** | “Agregar otro” textual | Simple | Poco táctil / no estándar | Débil |
| **E** | Solo ciertos grupos qty-enabled | Alineado a negocio | Requiere flag de grupo | **Necesario** |

## Recommended product direction

```text
Recommended direction:
Introduce quantity-enabled option groups for paid extras (Option E + B/C).

- Single required groups remain radio.
- Normal optional groups remain checkbox (distinct max_selections).
- Quantity-enabled groups use full-width (or expanded) stepper cards.
- Price = price_delta × option_quantity.
- Group max for quantity groups = total units (SPEC must redefine semantics).
- Per-option max_quantity recommended (default e.g. 5).
- Cart/order/admin display: "Bacon x2".
- Product cart quantity and extra quantity remain separate.
- Signature includes option quantities so configs don't falsely merge.
- Preserve existing reduced-motion / overlay motion contracts (no motion reopen).
```

**máx. 5 hoy** = distintas. Para qty groups, SPEC debe decidir:

1. `max_selections` → total units, **o**
2. nuevo campo `max_units` dejando `max_selections` = distinct.

Preferencia audit: **campo/flag explícito** (`allows_option_quantity` + `max_units` / per-option `max_quantity`) para no romper salsas existentes con máx. 5 distintas.

## Implementation impact estimate

| Area | Effort | Notes |
|------|--------|-------|
| DB migration + types | M | Group flag + option max_qty |
| Admin editor | M | New toggles/fields |
| Modal + shared rows | M–L | Layout B/C; state shape change |
| Validation/pricing/signature | M | Units math + signature |
| Cart display/edit | M | Summary + edit restore qty |
| Checkout + create_order + snapshot | L | Compat v1→v1.1/v2 |
| Admin dashboard / WA | S–M | Display strings |
| QA matrix | M | Pricing, merge, edit, required, max |

**Rough:** 1 SPEC + 1–2 IMPL slices (schema/admin → public cart/order) + QA. No motion reopen. No entry-routing reopen.

## QA visual notes

| Item | Observation |
|------|-------------|
| Viewport | Mobile modal full-bleed; sticky CTA footer |
| Scroll | Body scrolls; groups stacked |
| 2-col grid | Salsas/Agregados; tight for steppers |
| Long names | “Salsa Big Mac” OK; stepper would need full-width row |
| Touch | Large cards; checkbox/radio hit targets OK |
| States | Selected / error alert / disabled CTA |
| Dark contrast | Adequate on observed tokens |
| Qty UI | **Absent** — confirmed live on Doble Smash |

No code changes; screenshots via browser automation on local catalog.

## Risks / unknowns

| ID | Severity | Note |
|----|----------|------|
| Signature omit qty | P0 if shipped without | False cart merges |
| Snapshot v1 readers | P1 | Old orders without qty field must keep rendering |
| max semantics change | P1 | Breaking salsas if reuse `max_selections` without flag |
| Product vs extra qty UX | P1 | Confusion in cart sheet |
| Public WA silent on extras | P3 | Preexisting; kitchen may rely on admin |
| Pilot tenant pricing | Info | Confirm real Bacon/Cheddar deltas before SPEC examples |

## Explicitly out of scope

- Runtime / CSS / DB / schema implementation
- Checkout Maps, entry routing, motion reopen
- create_order behavior change in this phase
- Commit / push / deploy
- Mutating products/tenants

## Suggested next spec

`PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-SPEC-1` should lock:

1. Group flag `allows_option_quantity` (name TBD).
2. Per-option `max_quantity` (and default).
3. State shape: `Record<groupId, Record<optionId, quantity>>` or `{ optionId, quantity }[]`.
4. Max units vs distinct options semantics.
5. Signature format version.
6. Snapshot versioning strategy (extend v1 vs v2).
7. Display copy ES-AR: `Bacon x2`, CTA unit vs line totals.
8. qty→0 removes option from selection.
9. Free extras (`price_delta=0`) with quantity — show/hide delta.
10. Non-goals: upsell Plus products qty model unchanged; no Framer; no DB writes in SPEC.

## Gate

```text
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-SPEC-1 = ALLOWED_WITH_AUDIT_DEBT
QUEUE_GATE: PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-AUDIT-1 = COMPLETE_WITH_DEBT
QUEUE_GATE: PUBLIC-CATALOG-MVP-V1-ENTRY-COMPLETE = COMPLETE_WITH_ACCEPTED_P3_FALLBACK_DEBT
QUEUE_GATE: PUBLIC-CATALOG-MOTION-PUBLIC-CATALOG-COMPLETE = COMPLETE
QUEUE_GATE: PUBLIC-CATALOG-SUCCESS-EDGE-STATES-POLISH-1 = OPTIONAL
QUEUE_GATE: PUBLIC-TENANT-BROWSER-BRANDING-FAVICON-CACHE-BUST-1 = BACKLOG_OPTIONAL
QUEUE_GATE: PUBLIC-ORDERS-PUBLIC-CODE-SPEC-1 = BACKLOG
QUEUE_GATE: PUBLIC-CATALOG-CHECKOUT-ADDRESS-MAPS-* = PAUSED
```

**Audit debt (documented, non-blocking for SPEC):** end-to-end quantity axis missing in schema/cart/snapshot; SPEC must design migration + compat, not assume UI-only.
