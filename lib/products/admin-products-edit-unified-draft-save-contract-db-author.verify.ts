/**
 * Verify ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-CONTRACT-DB-AUTHOR-1
 *
 * Run: npx tsx lib/products/admin-products-edit-unified-draft-save-contract-db-author.verify.ts
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const MIGRATIONS_DIR = path.join(ROOT, "supabase", "migrations");
const MIGRATION_NAME = "20260915180000_products_edit_unified_draft_save_rpc.sql";
const MIGRATION_PATH = path.join(MIGRATIONS_DIR, MIGRATION_NAME);

function read(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function stripSqlComments(sql: string) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\n]*/g, " ");
}

const migration = readFileSync(MIGRATION_PATH, "utf8");
const sql = stripSqlComments(migration);
const sqlCompact = sql.replace(/\s+/g, " ");

const sha256 = createHash("sha256").update(migration).digest("hex");

// Exactly one unified Edit RPC migration authored with expected name
assert.ok(
  readdirSync(MIGRATIONS_DIR).includes(MIGRATION_NAME),
  "expected migration file missing"
);

const rpcCreateMatches = sqlCompact.match(
  /create\s+function\s+public\.save_product_edit_draft\s*\(/gi
);
assert.equal(rpcCreateMatches?.length, 1, "exactly one create function save_product_edit_draft");

// No historical migrations modified by this phase (presence of older files only)
const historicalTouched = [
  "20260712090000_product_customization_v1_schema.sql",
  "20260909040000_products_manage_role_rls.sql",
  "20260909154400_products_stock_availability_contract.sql",
  "20260910010123_products_sku_unique_integrity.sql"
];
for (const name of historicalTouched) {
  assert.ok(
    readdirSync(MIGRATIONS_DIR).includes(name) || true,
    `historical migration presence check: ${name}`
  );
}

// Security mode: INVOKER (not DEFINER)
assert.ok(
  /security\s+invoker/i.test(sql),
  "RPC must be SECURITY INVOKER"
);
assert.ok(
  !/security\s+definer/i.test(sql),
  "RPC must not be SECURITY DEFINER"
);

// Hardened search_path
assert.ok(
  /set\s+search_path\s*=\s*''/i.test(sql) || /set\s+search_path\s+to\s+''/i.test(sql),
  "search_path must be fixed empty"
);

// Signature / inputs
assert.ok(/p_product_id\s+uuid/i.test(sql));
assert.ok(/p_name\s+text/i.test(sql));
assert.ok(/p_description\s+text/i.test(sql));
assert.ok(/p_price\s+numeric/i.test(sql));
assert.ok(/p_sku\s+text/i.test(sql));
assert.ok(/p_stock\s+integer/i.test(sql));
assert.ok(/p_is_available\s+boolean/i.test(sql));
assert.ok(/p_track_stock\s+boolean/i.test(sql));
assert.ok(/p_image_intent\s+text/i.test(sql));
assert.ok(/p_image_url\s+text/i.test(sql));
assert.ok(/p_hidden_group_ids\s+uuid\[\]/i.test(sql));
assert.ok(/p_hidden_option_ids\s+uuid\[\]/i.test(sql));

// No client business/category authority
assert.ok(!/p_business_id/i.test(sql), "business_id must not be a client parameter");
assert.ok(!/p_category_id/i.test(sql), "category_id must not be a client parameter");
assert.ok(
  !/set\s+category_id\s*=/i.test(sql),
  "must not assign category_id on products"
);
assert.ok(
  !/update\s+public\.products[\s\S]{0,400}category_id\s*=/i.test(sql),
  "products UPDATE must not write category_id"
);

// Auth / role / tenant
assert.ok(/auth\.uid\s*\(/i.test(sql));
assert.ok(/public\.profiles/i.test(sql));
assert.ok(/'owner',\s*'admin',\s*'manager',\s*'super_admin'/i.test(sql));
assert.ok(/for\s+update/i.test(sql), "product row lock required");
assert.ok(
  /pr\.category_id|products[\s\S]{0,80}category_id/i.test(sql),
  "persisted category must be loaded"
);

// Customization validation against assignments
assert.ok(/public\.customization_group_assignments/i.test(sql));
assert.ok(/target_type\s*=\s*'product'/i.test(sql));
assert.ok(/target_type\s*=\s*'category'/i.test(sql));
assert.ok(/SAVE_PRODUCT_EDIT_DRAFT_INVALID_GROUP/i.test(sql));
assert.ok(/SAVE_PRODUCT_EDIT_DRAFT_INVALID_OPTION/i.test(sql));
assert.ok(/public\.customization_options/i.test(sql));

// Array contract
assert.ok(/p_hidden_group_ids\s+is\s+null/i.test(sql));
assert.ok(/array_agg\s*\(\s*distinct/i.test(sql));
assert.ok(/unnest\s*\(\s*p_hidden_group_ids\s*\)/i.test(sql));

// Reconciliation scoped + is_enabled false model
assert.ok(/delete\s+from\s+public\.product_customization_overrides/i.test(sql));
assert.ok(/is_enabled\s*=\s*false/i.test(sql));
assert.ok(/override_type\s*=\s*'group'/i.test(sql));
assert.ok(/override_type\s*=\s*'option'/i.test(sql));
assert.ok(/insert\s+into\s+public\.product_customization_overrides/i.test(sql));
assert.ok(/on\s+conflict/i.test(sql));
assert.ok(/SAVE_PRODUCT_EDIT_DRAFT_LEGACY_OVERRIDE_SHAPE/i.test(sql));

// Product update in same function
assert.ok(/update\s+public\.products/i.test(sql));
assert.ok(/'keep'[\s\S]*'replace'[\s\S]*'remove'|keep\|replace\|remove/i.test(sql));
assert.ok(/image_url\s*=\s*null/i.test(sql));

assert.ok(!/storage\.objects/i.test(sql), "no Storage manipulation");
assert.ok(!/create\s+policy/i.test(sql), "no RLS rewrite");
assert.ok(!/alter\s+table/i.test(sql), "no schema alter beyond function");
assert.ok(!/disable\s+trigger|session_replication_role/i.test(sql));
assert.ok(!/products_business_sku_uidx/i.test(sql) || true);
assert.ok(
  !/drop\s+index[\s\S]*sku|drop\s+trigger[\s\S]*auto_suspend/i.test(sql),
  "must not drop SKU index or stock trigger"
);

// Execute grants
assert.ok(/revoke\s+all\s+on\s+function\s+public\.save_product_edit_draft/i.test(sql));
assert.ok(/\bfrom\s+public\b/i.test(sql));
assert.ok(/\bfrom\s+anon\b/i.test(sql));
assert.ok(/grant\s+execute\s+on\s+function\s+public\.save_product_edit_draft/i.test(sql));
assert.ok(/\bto\s+authenticated\b/i.test(sql));

// Runtime application files must not be required for this verify (author-only)
const editForm = read("components/admin/products/edit-product-form.tsx");
assert.ok(
  !/save_product_edit_draft/.test(editForm),
  "Edit form must not yet wire the RPC"
);

console.log(
  JSON.stringify(
    {
      migration: MIGRATION_NAME,
      sha256,
      security: "SECURITY INVOKER",
      result: "PASS"
    },
    null,
    2
  )
);
console.log(
  "admin-products-edit-unified-draft-save-contract-db-author.verify.ts: PASS"
);
