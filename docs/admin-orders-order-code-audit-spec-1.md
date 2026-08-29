# ADMIN-ORDERS-ORDER-CODE-AUDIT-SPEC-1

**Date:** 2026-08-27  
**Baseline commit:** 81b1162  
**Gate:** AUDIT/SPEC COMPLETE — READY FOR IMPLEMENTATION

Audit and technical specification only. No implementation / no migration / no runtime changes / no commit / no push / no deploy.

---

## 1. Objective

Audit and specify the introduction of an authoritative, public/operator-facing order code (`orders.order_code`) distinct from the internal UUID primary key (`orders.id`).

Currently, operator and customer surfaces rely on an ad-hoc 4-character hex substring derived from the UUID (e.g. `#0215`, `#8CBA`, `#7DC3`) or expose raw 36-character UUID strings on public checkout success. This specification establishes a robust, human-readable, non-sequential, collision-free order identity while strictly preserving the UUID as the internal relational and routing identifier.

---

## 2. Current Identity Problem

1. **Ad-hoc Hex Derivation:**
   - Display references are currently computed on the fly via `buildOrderDisplayRef(order.id) = orderId.replace(/-/g, "").slice(-4).toUpperCase()`.
   - 4 hexadecimal characters offer only $16^4 = 65,536$ possible values. By the Birthday Paradox, the collision probability reaches 50% at just ~300 orders within a business.
   - Hex characters `[0-9A-F]` look like memory addresses or hash fragments rather than customer-grade order identifiers.
2. **Public UUID Exposure:**
   - On the public checkout success page (`app/b/[slug]/success/page.tsx`), the customer is shown the full raw UUID (e.g., `c1e031af-762a-429f-abca-4ffd03dd0215`) as the "Referencia del pedido".
   - The public WhatsApp confirmation message passes `Pedido: <full UUID>`, which is unreadable on mobile screens and clumsy for phone support.
3. **Lack of Authoritative Database Column:**
   - There is no persistent `order_code` column in `public.orders`. The display reference is purely ephemeral and recomputed on client/server presenters.

---

## 3. Current UUID/Display-Ref Ownership

| Layer / Surface | Current Identifier Source | Owner File |
|-----------------|---------------------------|------------|
| Canonical Helper | `orderId.replace(/-/g, "").slice(-4).toUpperCase()` | `lib/orders/display-ref.ts` → `buildOrderDisplayRef` |
| Dashboard OrderCard | `buildOrderDisplayRef(order.id)` | `components/admin/orders/order-card.tsx` |
| Workspace Modal Header | `buildOrderDisplayRef(displayOrder.id)` | `components/admin/orders/admin-order-workspace-modal.tsx` + `order-modal-header.tsx` |
| Order Detail Page Header | `Pedido de ${order.customer_name}` (no code) | `components/admin/orders/order-detail-page-client.tsx` |
| WhatsApp Structured Messages | `summary.orderRef = buildOrderDisplayRef(input.id)` | `lib/whatsapp/admin.ts` + `lib/orders/customer-order-summary.ts` |
| Plain-Text Copy/Share | `summary.orderRef = buildOrderDisplayRef(input.id)` | `lib/orders/customer-order-summary.ts` |
| Natural Search | Substring match on `order.id` and `buildOrderDisplayRef(order.id)` | `lib/orders/natural-search.ts` |
| Public Success Page | Raw `searchParams.order_id` (full UUID) | `app/b/[slug]/success/page.tsx` |
| Public WhatsApp Link | `Pedido: ${orderId}` (full UUID) | `lib/whatsapp/public.ts` |
| Internal Routes | `params.id` (full UUID) | `app/admin/(protected)/orders/[id]/*` |
| Realtime Subscriptions | `orders` table events filtered by `business_id` | `components/admin/orders/use-admin-orders-realtime.ts` |
| In-Memory Pending Mutations | Map keyed by `orderId` (UUID) | `use-admin-orders-realtime.ts` |

---

## 4. Product Decision Candidate

- **Column:** `public.orders.order_code` (`text NOT NULL`).
- **Format:** 6 uppercase alphanumeric characters from an unambiguous alphabet (e.g. `#K7M4Q9`).
- **Storage:** Uppercase only, enforced by `CHECK (order_code ~ '^[A-Z0-9]{6}$')`.
- **Uniqueness:** Unique per tenant: `UNIQUE (business_id, order_code)`.
- **Generation:** Authoritative server-side generation inside the PostgreSQL `create_order` RPC function.
- **Stability:** Immutable upon creation; non-editable by operators or clients.
- **Internal Identity:** `orders.id` (UUID) remains untouched as primary key, foreign key target, routing key, and mutation target.

---

## 5. Recommended Column Name

**Recommendation:** `order_code`

**Comparison Analysis:**

| Candidate Name | Evaluation | Recommendation |
|----------------|------------|----------------|
| `order_code` | **Explicit, domain-accurate, aligns with industry standards** (Shopify, Toast, Deliverect). Accurately describes an alphanumeric token without implying a sequence. | **RECOMMENDED** |
| `order_number` | Strongly implies a sequential integer (e.g. 1001, 1002). Misleading when the value is alphanumeric `#K7M4Q9`. | Rejected |
| `public_code` | Ambiguous; could be confused with a public catalog promo code, share token, or voucher. | Rejected |
| `display_code` | Presentation-polluted naming for a foundational database entity column. | Rejected |
| `short_code` | Implies length brevity over domain identity; commonly used for SMS/OTP verification codes. | Rejected |

---

## 6. Format Options

| Option | Definition | Alphabet | Space Size | Pros | Cons |
|--------|------------|----------|------------|------|------|
| **Option A** | 6 chars standard alphanumeric | `0-9, A-Z` (36 chars) | $36^6 \approx 2.18\text{B}$ | Compact, simple regex | Ambiguous chars (`0`/`O`, `1`/`I`/`L`) |
| **Option B** | 8 chars standard alphanumeric | `0-9, A-Z` (36 chars) | $36^8 \approx 2.82\text{T}$ | Virtually zero collision | Too long for quick voice/WhatsApp communication |
| **Option C** | **6 chars unambiguous alphanumeric** | `23456789ABCDEFGHJKMNPQRSTUVWXYZ` (30 chars) | $30^6 = 729\text{M}$ | **High readability over phone/chat, eliminates optical confusion** (`0`/`O`, `1`/`I`/`L`) | Requires custom alphabet generator in SQL |
| **Option D** | Sequential integer | `0-9` (e.g. `#000123`) | Sequential per tenant | Natural for legacy kitchens | Leaks order volume to competitors/customers; requires locks |
| **Option E** | Hex suffix (current debt) | `0-9, A-F` (4 chars) | $16^4 = 65.5\text{K}$ | No migration needed | High collision rate, looks like memory address |

---

## 7. Recommended Format

**Recommendation:** **Option C (6-character unambiguous alphanumeric)**
- **Allowed Characters:** `23456789ABCDEFGHJKMNPQRSTUVWXYZ` (excludes `0`, `O`, `1`, `I`, `L`).
- **Length:** 6 characters.
- **Display Prefix:** `#` (e.g., `#K7M4Q9`).
- **Case Rule:** Stored uppercase, validated uppercase, searched case-insensitively.

---

## 8. Uniqueness Scope

**Recommendation:** `UNIQUE (business_id, order_code)`

**Architectural Rationale:**
1. **Multi-Tenant Isolation:** OrderOps strictly segments tenant data by `business_id`. Every query in admin and public routes resolves `business_id` server-side.
2. **Collision Space Optimization:** $729,000,000$ combinations allocated *per tenant*. A store processing 100 orders/day will use fewer than 365,000 codes in a decade (<0.05% of namespace).
3. **No Cross-Tenant Coordination:** Order creation transactions do not contend on a global namespace.
4. **No Global Leakage:** A customer seeing `#K7M4Q9` has no clue about the order volume or code distribution of other businesses on the platform.

---

## 9. Collision Strategy

Generation occurs exclusively inside the PostgreSQL `create_order` RPC function during the order creation transaction:

1. A loop attempts code generation with a maximum of **5 retries**.
2. Generation helper selects 6 random characters from the unambiguous 30-character alphabet.
3. A fast lookup `EXISTS (SELECT 1 FROM public.orders WHERE business_id = p_business_id AND order_code = v_code)` checks availability.
4. If available, the insert proceeds.
5. In the astronomically rare case of a concurrent race condition, the `UNIQUE (business_id, order_code)` constraint catches the violation and the retry loop iterates.
6. If 5 retries are exhausted (mathematical probability $< 10^{-15}$), the RPC raises a clear server error: `failed to generate unique order code`.

**Collision Probability Analysis:**
- With 10,000 existing orders in a store:
  - 1st attempt collision chance: $10,000 / 729,000,000 \approx 0.00137\%$ (~1 in 72,900).
  - 2 consecutive collisions: $(0.0000137)^2 \approx 1.88 \times 10^{-10}$ (~1 in 5.3 billion).
  - 3 consecutive collisions: virtually zero.

---

## 10. Database Schema Proposal

```sql
-- 1. Helper function for random unambiguous code generation
create or replace function public.generate_order_code()
returns text
language plpgsql
as $$
declare
  chars text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  result text := '';
  i integer;
begin
  for i in 1..6 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  end loop;
  return result;
end;
$$;

-- 2. Add nullable column first
alter table public.orders
add column if not exists order_code text;

-- 3. Backfill existing rows (idempotent PL/pgSQL block)
do $$
declare
  r record;
  v_new_code text;
  v_exists boolean;
begin
  for r in select id, business_id from public.orders where order_code is null loop
    loop
      v_new_code := public.generate_order_code();
      select exists(
        select 1 from public.orders
        where business_id = r.business_id and order_code = v_new_code
      ) into v_exists;
      exit when not v_exists;
    end loop;
    update public.orders set order_code = v_new_code where id = r.id;
  end loop;
end;
$$;

-- 4. Set NOT NULL, CHECK, and UNIQUE index
alter table public.orders
alter column order_code set not null;

alter table public.orders
add constraint orders_order_code_format_chk
check (order_code ~ '^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$');

create unique index if not exists orders_business_order_code_uidx
on public.orders (business_id, order_code);
```

---

## 11. Backfill Plan

1. **Idempotence:** The backfill script filters strictly on `WHERE order_code IS NULL`.
2. **Business Isolation:** Backfill generates collision-free codes evaluated against `(business_id, order_code)`.
3. **No Downtime:** For existing dev/staging/production databases, backfill executes in sub-seconds (even for thousands of orders) within the same migration transaction before applying `NOT NULL` and `UNIQUE`.
4. **Fallback Safety during Rollout:** Presentation helpers will implement a fallback: `order.order_code ?? buildOrderDisplayRef(order.id)`.

---

## 12. Generation Owner Options

| Option | Architecture | Evaluation | Recommendation |
|--------|--------------|------------|----------------|
| **A. PostgreSQL RPC `create_order`** | Generated in SQL inside the transactional insert | **Single authoritative choke point for both public checkout and admin manual order.** Zero client trust. Atomic. | **RECOMMENDED** |
| **B. Server Action (Next.js)** | Generated in TypeScript before calling RPC | Requires passing `p_order_code` to RPC. Duplicates logic across checkout and manual actions. Vulnerable to race conditions. | Rejected |
| **C. Database Trigger `BEFORE INSERT`** | Trigger on `public.orders` table | Hidden side effect. Harder to test and debug than explicit logic inside `create_order`. | Rejected |
| **D. Client-side Generation** | Generated in React browser bundle | Major security vulnerability. Untrusted input. High collision risk. | Prohibited |

---

## 13. Order Creation Paths

| Path | Owner | Inserts Orders? | Uses RPC `create_order`? | Needs `order_code`? | Action Required in Implementation |
|------|-------|:---------------:|:------------------------:|:-------------------:|-----------------------------------|
| **Public Checkout** | `app/b/[slug]/checkout/actions.ts` | Yes | Yes | Yes | RPC returns `orderId` (UUID) or enriched `{ orderId, orderCode }`. Checkout action redirects to `/b/[slug]/success?order_id=<uuid>&order_code=<code>`. |
| **Admin Manual Order** | `app/admin/(protected)/orders/actions.ts` | Yes | Yes | Yes | RPC automatically generates `order_code`. Optimistic/hydrated order receives code. |
| **Database Seed / Tests** | Seed scripts / verify suites | Yes | Mixed | Yes | Update seed scripts to supply `order_code` or call `generate_order_code()`. |

---

## 14. Display Surfaces

| Surface | File | Current Source | Future Source | Display Format |
|---------|------|:--------------:|:-------------:|:--------------:|
| **Dashboard OrderCard** | `components/admin/orders/order-card.tsx` | `buildOrderDisplayRef(order.id)` | `order.order_code` (with fallback) | `#K7M4Q9` |
| **Workspace Modal Header** | `components/admin/orders/order-modal-header.tsx` | `buildOrderDisplayRef(displayOrder.id)` | `order.order_code` | `#K7M4Q9 - Cliente` |
| **Order Detail Page Header** | `components/admin/orders/order-detail-page-client.tsx` | `Pedido de ${customer_name}` | `Pedido #${order.order_code} · ${customer_name}` | `#K7M4Q9` |
| **WhatsApp Message Templates** | `lib/whatsapp/admin.ts` | `summary.orderRef` | `order.order_code` | `#K7M4Q9` |
| **Copy / Share Order Text** | `lib/orders/customer-order-summary.ts` | `summary.orderRef` | `order.order_code` | `Pedido #K7M4Q9` |
| **Public Success Page** | `app/b/[slug]/success/page.tsx` | Raw UUID (`orderId`) | `order_code` | `#K7M4Q9` |
| **Public WhatsApp URL** | `lib/whatsapp/public.ts` | `Pedido: ${orderId}` (UUID) | `Pedido: #${order_code}` | `#K7M4Q9` |
| **Operational Search** | `lib/orders/natural-search.ts` | UUID suffix | `order.order_code` | Matches `K7M4Q9` and `#K7M4Q9` |

---

## 15. Search Surfaces

`lib/orders/natural-search.ts` will be updated to match `order.order_code`:

1. **Case-Insensitive:** Operators typing `k7m4q9` or `K7M4Q9` both match.
2. **Decorator Tolerant:** Strips leading `#` or spaces (typing `#K7M4Q9` or `K7M4Q9` matches).
3. **Prefix / Partial Match:** Since operators often type the first 3-4 characters while on the phone, query length $\ge 2$ should match `order_code.startsWith(...)` or `order_code.includes(...)`.
4. **UUID Fallback:** Maintain support for matching `order.id` (legacy safety).

---

## 16. Routing Boundary

**CRITICAL ARCHITECTURAL BOUNDARY:**

The internal routing keys **MUST REMAIN UUID**:
- `/admin/orders/[id]` → `id` is `orders.id` (UUID).
- `/admin/orders/[id]/summary` → `id` is `orders.id` (UUID).
- `/admin/orders/[id]/workspace` → `id` is `orders.id` (UUID).
- `?order=<uuid>` query param for workspace modal selection.
- Realtime channel payloads (`new.id`, `old.id`).
- In-memory lock maps (`pendingMutationsRef.get(orderId)`).

`order_code` is strictly an operational/public identity token for human display, search, and communication. It is **NOT** a database foreign key or primary route identifier in this phase.

---

## 17. Types and Payloads

| Type / Interface | File | Needs `order_code`? | Reason |
|------------------|------|:-------------------:|--------|
| `Tables<"orders">` | `types/database.ts` | Yes | Supabase schema generated type |
| `AdminOrderListItem` | `lib/orders/admin.ts` | Yes | Base type for all admin order lists |
| `AdminOrderDashboardItem` | `lib/orders/admin.ts` | Yes (inherits) | Consumed by `OrderCard` and board view models |
| `AdminOrderDetail` | `lib/orders/admin.ts` | Yes (inherits) | Consumed by detail page and workspace modal |
| `AdminOrderWorkspaceData` | `lib/orders/workspace.ts` | Yes (inherits) | State carrier for workspace modal |
| `CustomerOrderSummary` | `lib/orders/customer-order-summary.ts` | Yes (`orderRef`) | Feeds WhatsApp templates and copy/share |
| `AdminOrderRealtimeRow` | `lib/orders/realtime.ts` | Yes | Patches optimistic/realtime board rows |

---

## 18. Realtime / Hydrate Impact

1. **Realtime Publication:**
   - Table `public.orders` is already in publication `supabase_realtime` with `REPLICA IDENTITY FULL`.
   - Any INSERT or UPDATE event automatically delivers `payload.new.order_code`.
2. **Realtime Patch Helpers:**
   - `patchDashboardOrderFromRealtime` in `lib/orders/realtime.ts` will map `order_code: row.order_code ?? order.order_code`.
   - `patchWorkspaceOrderFromRealtime` will map `order_code: row.order_code ?? order.order_code`.
3. **Hydration Endpoints:**
   - `GET /admin/orders/[id]/summary` and `GET /admin/orders/[id]/workspace` query loaders (`getAdminDashboardOrderById`, `getAdminOrderById`) include `order_code` in their `.select(...)` statements.

---

## 19. Security and RLS

1. **Guessability:** 30 characters, 6 positions = 729 million combinations. An attacker cannot guess valid order codes by brute force.
2. **Volume Obfuscation:** Random generation prevents competitors or malicious actors from discovering daily order volume (unlike sequential `1, 2, 3...`).
3. **Multi-Tenant Isolation:** Database constraint `UNIQUE (business_id, order_code)` guarantees no leakage across tenants.
4. **RLS Policies:** Remain 100% unchanged. Admin access is strictly governed by `business_id = (select business_id from profiles where id = auth.uid())`.
5. **Public Access Guard:** There is no unauthenticated endpoint to query orders by `order_code`.

---

## 20. Rollout Options

| Strategy | Description | Pros | Cons | Recommendation |
|----------|-------------|------|------|----------------|
| **Option 1: Single Atomic Migration** | Add column, backfill existing rows, set `NOT NULL`, add check constraint + unique index, and update `create_order` in one migration file. | Clean, zero intermediate schema states, immediate consistency. | Safe for current codebase size and dev velocity. | **RECOMMENDED** |
| **Option 2: Two-Phase Deployment** | Phase 1: Add nullable column + backfill. Phase 2: Deploy app readers. Phase 3: Set `NOT NULL` constraint. | Safe for massive multi-million row production databases with rolling deployments. | Unnecessary overhead for current OrderOps scale. | Overkill |

---

## 21. Recommended Implementation Phases

1. **Phase 1: `ADMIN-ORDERS-ORDER-CODE-SCHEMA-RPC-1`**
   - Migration: `generate_order_code()` helper, add `order_code` column to `public.orders`, backfill existing rows, set `NOT NULL` + CHECK + UNIQUE index.
   - Update `create_order` RPC to generate and insert `order_code`.
   - Update `types/database.ts`.
2. **Phase 2: `ADMIN-ORDERS-ORDER-CODE-LOADERS-REALTIME-1`**
   - Update `lib/orders/admin.ts` query loaders (`getAdminOrders`, `getAdminDashboardOrderById`, `getAdminOrderById`) to select `order_code`.
   - Update `lib/orders/realtime.ts` patchers.
   - Update `lib/orders/display-ref.ts` to prefer `order.order_code` with legacy fallback.
3. **Phase 3: `ADMIN-ORDERS-ORDER-CODE-UI-SEARCH-1`**
   - Update `OrderCard`, workspace modal header, detail page client, public success page.
   - Update `lib/orders/natural-search.ts` to support search by `order_code`.
   - Update `lib/orders/customer-order-summary.ts` and WhatsApp formatters.
4. **Phase 4: `ADMIN-ORDERS-ORDER-CODE-RUNTIME-VALIDATION-1`**
   - Automated verify test suite (`lib/orders/order-code.verify.ts`).
   - Authenticated browser QA on dashboard cards, workspace modal, search, and public checkout.

---

## 22. P0–P3 Severity Breakdown

| Level | Concern | Mitigation in Spec |
|-------|---------|---------------------|
| **P0** | Breaking order creation RPC, breaking foreign keys or UUID routing | RPC transaction keeps exact return signature (`orderId` UUID); UUID remains primary key |
| **P1** | Collision in `order_code` during high-traffic order spikes | 30-char alphabet (729M space) + 5-attempt retry loop + DB unique constraint |
| **P2** | Existing orders showing empty or missing references after migration | Mandatory idempotent SQL backfill in migration before setting `NOT NULL` |
| **P3** | Natural search not finding orders when typed with `#` prefix | Strip `#` and whitespace in `natural-search.ts` normalizer |

---

## 23. Files Changed

**Runtime:** NONE  
**CSS:** NONE  
**SQL / Migrations:** NONE  
**Docs:**
- `docs/admin-orders-order-code-audit-spec-1.md` (this document)
- `docs/CURRENT_PHASE.md`
- `docs/admin-dashboard-forensic-living-audit.md`
- `ORDEROPS_LIVING_MEMORY.md`

---

## 24. Gate

**ADMIN-ORDERS-ORDER-CODE-AUDIT-SPEC-1 = AUDIT/SPEC COMPLETE — READY FOR IMPLEMENTATION**

| Scope | Status |
|-------|--------|
| **Order Code** | SPECIFIED — NOT IMPLEMENTED |
| **UUID Internal Identity** | UNCHANGED |
| **Dashboard Card Root Count** | REMAINS FROZEN |
| **Contact / Workspace Scopes** | REMAIN FROZEN |
| **Dashboard Overall Polish** | OPEN |

No commit. No push. No deploy.

---

## Schema/RPC implementation follow-up — 2026-08-27

- migration `supabase/migrations/20260827234500_add_orders_order_code.sql` implemented `orders.order_code`;
- SQL helper `public.generate_order_code()` implemented with exact 30-char unambiguous alphabet `23456789ABCDEFGHJKMNPQRSTUVWXYZ`;
- idempotent backfill implemented for historical rows before setting `NOT NULL` and `orders_order_code_format_chk`;
- unique index `orders_business_order_code_uidx` on `(business_id, order_code)` created;
- authoritative `create_order` RPC updated to generate and assign `order_code` transactionally without breaking return signature or existing checkout/admin callers;
- `types/database.ts` updated;
- UUID routing/internal identity unchanged;
- UI/search/display migration deferred to Phase 2 and Phase 3.

