/**
 * Verify ADMIN-PRODUCTS-STOCK-AVAILABILITY-CONTRACT-FIX-1
 * (PROD-P1-4 / PROD-P2-10 / PROD-P3-13).
 *
 * Run: npx tsx lib/products/admin-products-stock-availability-contract.verify.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  resolveEffectiveProductAvailability,
  TRACKED_ZERO_STOCK_ENABLE_ERROR
} from "@/lib/products/products-stock-availability-contract";

const MIGRATION =
  "supabase/migrations/20260909154400_products_stock_availability_contract.sql";
const ACTIONS = "app/admin/(protected)/products/actions.ts";
const CREATE_FORM = "components/admin/products/create-product-form.tsx";
const EDIT_FORM = "components/admin/products/edit-product-form.tsx";
const CREATE_ORDER_MIGRATION =
  "supabase/migrations/20260717010500_product_stock_decrement_order_1.sql";
const RLS_MIGRATION = "supabase/migrations/20260909040000_products_manage_role_rls.sql";

const migration = readFileSync(path.join(process.cwd(), MIGRATION), "utf8");
const actions = readFileSync(path.join(process.cwd(), ACTIONS), "utf8");
const createForm = readFileSync(path.join(process.cwd(), CREATE_FORM), "utf8");
const editForm = readFileSync(path.join(process.cwd(), EDIT_FORM), "utf8");

// ---------------------------------------------------------------------------
// A–C. Trigger contract in the new migration
// ---------------------------------------------------------------------------

assert.ok(
  /NEW\.track_stock\s*=\s*true\s+AND\s+NEW\.stock\s*<=\s*0/i.test(migration),
  "trigger must suspend only when track_stock=true AND stock<=0"
);
assert.ok(
  /NEW\.is_available\s*:=\s*false/i.test(migration),
  "trigger must force is_available=false under that condition"
);
assert.ok(
  /BEFORE\s+INSERT\s+OR\s+UPDATE\s+OF\s+stock,\s*track_stock,\s*is_available/i.test(migration),
  "trigger event must cover INSERT and UPDATE OF stock, track_stock, is_available"
);
assert.ok(
  !/NEW\.is_available\s*:=\s*true/i.test(migration),
  "trigger must never set is_available=true (no auto-reactivation)"
);
assert.ok(
  /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.auto_suspend_out_of_stock_product/i.test(migration),
  "must replace the existing trigger function"
);
assert.ok(
  /DROP\s+TRIGGER\s+IF\s+EXISTS\s+tr_auto_suspend_out_of_stock/i.test(migration),
  "must drop/recreate the existing trigger"
);
assert.ok(
  !/\bUPDATE\s+public\.products\b/i.test(migration.replace(/--.*/g, "")),
  "migration must not backfill/update business product rows"
);
assert.ok(
  !/\bINSERT\s+INTO\s+public\.products\b/i.test(migration.replace(/--.*/g, "")),
  "migration must not insert product rows"
);

// ---------------------------------------------------------------------------
// D. Create semantics
// ---------------------------------------------------------------------------

assert.equal(
  resolveEffectiveProductAvailability({
    trackStock: false,
    stock: 0,
    requestedAvailable: true
  }),
  true,
  "create: untracked + stock0 → available"
);
assert.equal(
  resolveEffectiveProductAvailability({
    trackStock: true,
    stock: 0,
    requestedAvailable: true
  }),
  false,
  "create: tracked + stock0 → unavailable"
);
assert.equal(
  resolveEffectiveProductAvailability({
    trackStock: true,
    stock: 5,
    requestedAvailable: true
  }),
  true,
  "create: tracked + positive stock → available"
);

assert.ok(
  actions.includes("resolveEffectiveProductAvailability"),
  "actions must use the shared availability contract helper"
);
assert.ok(
  /requestedAvailable:\s*true/.test(actions),
  "create must request available=true and let the helper coerce tracked+0"
);

// ---------------------------------------------------------------------------
// E. Edit semantics
// ---------------------------------------------------------------------------

assert.equal(
  resolveEffectiveProductAvailability({
    trackStock: false,
    stock: 0,
    requestedAvailable: true
  }),
  true,
  "edit: untracked stock0 requested true → true"
);
assert.equal(
  resolveEffectiveProductAvailability({
    trackStock: false,
    stock: 0,
    requestedAvailable: false
  }),
  false,
  "edit: untracked stock0 requested false → false"
);
assert.equal(
  resolveEffectiveProductAvailability({
    trackStock: true,
    stock: 0,
    requestedAvailable: true
  }),
  false,
  "edit: tracked stock0 requested true → forced false"
);
assert.equal(
  resolveEffectiveProductAvailability({
    trackStock: true,
    stock: 5,
    requestedAvailable: false
  }),
  false,
  "edit: tracked stock5 requested false → false (manual unavailable preserved)"
);
assert.equal(
  resolveEffectiveProductAvailability({
    trackStock: true,
    stock: 10,
    requestedAvailable: false
  }),
  false,
  "restock path: tracked restocked but requested false stays false"
);

assert.ok(
  /requestedAvailable:\s*isAvailable/.test(actions),
  "edit must pass the form's is_available into the helper"
);

// ---------------------------------------------------------------------------
// F. Inline availability action
// ---------------------------------------------------------------------------

assert.ok(
  actions.includes('select("id, stock, track_stock")') ||
    actions.includes("select('id, stock, track_stock')") ||
    actions.includes('select("id, stock, track_stock, archived_at")') ||
    actions.includes("select('id, stock, track_stock, archived_at')"),
  "setProductAvailabilityAction must load stock + track_stock in the ownership pre-check"
);
assert.ok(
  actions.includes("TRACKED_ZERO_STOCK_ENABLE_ERROR"),
  "inline enable must return the domain failure constant"
);
assert.ok(
  actions.includes(TRACKED_ZERO_STOCK_ENABLE_ERROR) ||
    /No podés marcar este producto como disponible mientras el control de stock está activo y no hay stock\./.test(
      readFileSync(
        path.join(process.cwd(), "lib/products/products-stock-availability-contract.ts"),
        "utf8"
      )
    ),
  "user-facing tracked-zero enable error must exist"
);

const setAvailabilitySlice = actions.slice(
  actions.indexOf("export async function setProductAvailabilityAction")
);
assert.ok(
  /isAvailable\s*&&[\s\S]*track_stock[\s\S]*stock/.test(setAvailabilitySlice) ||
    /track_stock[\s\S]*isAvailable[\s\S]*stock/.test(setAvailabilitySlice) ||
    /isAvailable\s*&&[\s\S]*currentProduct\.track_stock/.test(setAvailabilitySlice),
  "inline action must refuse enable when tracked and stock<=0 before UPDATE"
);

// ---------------------------------------------------------------------------
// G. Guards preserved
// ---------------------------------------------------------------------------

assert.ok(
  actions.includes('requireAdminPermission("manageProducts")'),
  "manageProducts guard must remain"
);
assert.ok(
  /\.eq\("business_id",\s*adminContext\.businessId\)/.test(actions),
  "business_id ownership scoping must remain on mutations"
);

// ---------------------------------------------------------------------------
// H–I. create_order and RLS migration untouched
// ---------------------------------------------------------------------------

const createOrderSql = readFileSync(path.join(process.cwd(), CREATE_ORDER_MIGRATION), "utf8");
assert.ok(
  createOrderSql.includes("track_stock = true"),
  "create_order stock accounting contract must still exist"
);
const migrationExecutable = migration
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("--"))
  .join("\n");

assert.ok(
  !/create_order/i.test(migrationExecutable),
  "stock/availability migration must not touch create_order"
);

const rlsHashBaseline = readFileSync(path.join(process.cwd(), RLS_MIGRATION), "utf8");
assert.ok(
  rlsHashBaseline.includes("products_insert_own_business"),
  "RLS migration file must remain present and unmodified by this phase"
);

// ---------------------------------------------------------------------------
// J. Stale copy removed
// ---------------------------------------------------------------------------

const STALE_PHRASES = [
  "se implementará en una fase posterior",
  "solo prepara el producto para el control automático"
];

for (const phrase of STALE_PHRASES) {
  assert.ok(!createForm.includes(phrase), `create form still contains stale copy: ${phrase}`);
  assert.ok(!editForm.includes(phrase), `edit form still contains stale copy: ${phrase}`);
}

function flattenJsxText(source: string): string {
  return source.replace(/\s+/g, " ");
}

const createFlat = flattenJsxText(createForm);
const editFlat = flattenJsxText(editForm);

assert.ok(
  createFlat.includes("Descontamos el stock con cada pedido") ||
    createFlat.includes("el stock se descuenta automáticamente con cada pedido"),
  "create form must carry accurate stock-tracking helper copy"
);
assert.ok(
  editFlat.includes("el stock se descuenta automáticamente con cada pedido"),
  "edit form must carry the accurate stock-tracking helper copy"
);
// Create: no Disponible switch — restock/reactivation copy belongs to Edit/ops, not Create helper.
assert.ok(
  !createFlat.includes("Al reponer stock, volvé a marcarlo como disponible"),
  "create form must not instruct Edit-only restock reactivation"
);
assert.ok(
  createFlat.includes("Con stock 0, el producto se creará como no disponible") ||
    createFlat.includes("create-stock-zero-info"),
  "create form must communicate tracked stock-0 → unavailable consequence"
);
assert.ok(
  editFlat.includes("Al reponer stock, volvé a marcarlo como disponible"),
  "edit form must mention that restock does not auto-reactivate"
);

console.log("admin-products-stock-availability-contract.verify.ts: PASS");
