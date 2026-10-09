/**
 * SUPERSEDED — ADMIN-PRODUCTS-PRODUCT-REMOVAL-ARCHIVE-DB-AUTHOR-1
 *
 * The archive-only migration was replaced before apply by
 * ADMIN-PRODUCTS-PRODUCT-REMOVAL-LIFECYCLE-DB-AUTHOR-1.
 *
 * This file only asserts supersession so historical corpus entry points
 * do not re-require the obsolete archive-only SQL path.
 *
 * Run: npx tsx lib/products/admin-products-product-removal-archive-db-author.verify.ts
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OLD =
  "supabase/migrations/20260916180000_products_archive_lifecycle.sql";
const FINAL =
  "supabase/migrations/20260916180000_products_removal_lifecycle.sql";

assert.ok(
  !existsSync(path.join(ROOT, OLD)),
  "archive-only migration must be absent (superseded before apply)"
);
assert.ok(
  existsSync(path.join(ROOT, FINAL)),
  "final removal lifecycle migration must be the sole pending 20260916180000 file"
);

console.log(
  "PASS — archive-db-author.verify.ts (SUPERSEDED → lifecycle migration present)"
);
