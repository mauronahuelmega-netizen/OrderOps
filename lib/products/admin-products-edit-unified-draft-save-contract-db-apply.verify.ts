/**
 * Verify ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-CONTRACT-DB-APPLY-1 evidence contract.
 * Run: npx tsx lib/products/admin-products-edit-unified-draft-save-contract-db-apply.verify.ts
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

const migration = read(
  "supabase/migrations/20260915180000_products_edit_unified_draft_save_rpc.sql"
);
const sha = createHash("sha256").update(migration).digest("hex");
assert.equal(
  sha,
  "42b2e206635d0fe3a13ffff7972e8149ae86c909829641a30ca001e500a16631"
);

const phase = read("docs/admin-products-edit-unified-draft-save-contract-db-apply-1.md");
assert.match(phase, /# Resume Result/);
assert.match(phase, /PASS — RPC LIVE \/ VALIDATED/);
assert.match(phase, /SECURITY INVOKER/);
assert.match(phase, /Legacy Census[\s\S]*true[\s\S]*\*\*0\*\*/i);
assert.match(phase, /owner[\s\S]*ALLOW/i);
assert.match(phase, /operator[\s\S]*DENY/i);
assert.match(phase, /viewer[\s\S]*DENY/i);
assert.match(phase, /late-failure rollback proven/i);
assert.match(phase, /products_business_sku_uidx/);
assert.match(phase, /tr_auto_suspend_out_of_stock/);
assert.match(phase, /20260915215741_products_edit_unified_draft_save_rpc|products_edit_unified_draft_save_rpc/);
assert.match(phase, /6d31d3050a938022242eae9348c52697c46b8528b4f7b3afd08f5f3ff422079a/);
assert.match(phase, /STILL LEGACY MIXED PERSISTENCE/);
assert.match(phase, /NOT YET IMPLEMENTED/);
assert.doesNotMatch(phase, /Resume Result[\s\S]{0,200}BLOCK — CUSTOMIZATION LEGACY/);

console.log(
  JSON.stringify(
    { result: "PASS", sha256: sha, phase: "DB-APPLY-1 resume" },
    null,
    2
  )
);
console.log(
  "admin-products-edit-unified-draft-save-contract-db-apply.verify.ts: PASS"
);