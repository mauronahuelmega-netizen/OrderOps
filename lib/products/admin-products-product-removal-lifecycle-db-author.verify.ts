/**
 * Verify ADMIN-PRODUCTS-PRODUCT-REMOVAL-LIFECYCLE-DB-AUTHOR-1
 *
 * Static contract of the authored (not applied) final Product Removal
 * lifecycle migration: archive + restore foundation + permanent-delete RPC.
 *
 * Run:
 *   npx tsx lib/products/admin-products-product-removal-lifecycle-db-author.verify.ts
 * Probes:
 *   VERIFY_PROBES=1 npx tsx lib/products/admin-products-product-removal-lifecycle-db-author.verify.ts
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const MIGRATION =
  "supabase/migrations/20260916180000_products_removal_lifecycle.sql";
const OLD_ARCHIVE_MIGRATION =
  "supabase/migrations/20260916180000_products_archive_lifecycle.sql";
const SKU_MIGRATION =
  "supabase/migrations/20260910010123_products_sku_unique_integrity.sql";
const STOCK_MIGRATION =
  "supabase/migrations/20260909154400_products_stock_availability_contract.sql";
const RLS_MIGRATION =
  "supabase/migrations/20260909040000_products_manage_role_rls.sql";
const RESTOCK_MIGRATION =
  "supabase/migrations/20260717140000_product_stock_restock_cancel_1.sql";
const CORRECTION =
  "docs/admin-products-product-removal-contract-correction-1.md";
const VERIFY_REL =
  "lib/products/admin-products-product-removal-lifecycle-db-author.verify.ts";

function read(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function flatten(s: string) {
  return s.replace(/\s+/g, " ");
}

/** Extract a balanced SQL statement starting at `start` (inclusive), ending at matching `;`. */
function extractStatement(sql: string, start: number): string {
  let i = start;
  let depth = 0;
  let inSingle = false;
  let inDollar: string | null = null;
  while (i < sql.length) {
    const ch = sql[i];
    if (inDollar) {
      if (sql.startsWith(inDollar, i)) {
        i += inDollar.length;
        inDollar = null;
        continue;
      }
      i += 1;
      continue;
    }
    if (inSingle) {
      if (ch === "'" && sql[i + 1] === "'") {
        i += 2;
        continue;
      }
      if (ch === "'") {
        inSingle = false;
      }
      i += 1;
      continue;
    }
    if (ch === "'") {
      inSingle = true;
      i += 1;
      continue;
    }
    if (ch === "$") {
      const m = sql.slice(i).match(/^\$([A-Za-z_]*)\$/);
      if (m) {
        inDollar = m[0];
        i += m[0].length;
        continue;
      }
    }
    if (ch === "(") depth += 1;
    if (ch === ")") depth -= 1;
    if (ch === ";" && depth === 0) {
      return sql.slice(start, i + 1);
    }
    i += 1;
  }
  return sql.slice(start);
}

function findFunctionBody(sql: string, name: string): string {
  const re = new RegExp(
    `create\\s+or\\s+replace\\s+function\\s+public\\.${name}\\s*\\(`,
    "i"
  );
  const m = sql.match(re);
  assert.ok(m && m.index != null, `function public.${name} must exist`);
  return extractStatement(sql, m.index);
}

function deleteWhereClause(stmtFlat: string, tableHint: string): string {
  const re = new RegExp(
    `delete\\s+from\\s+public\\.${tableHint}[\\s\\S]*?where([\\s\\S]+)$`,
    "i"
  );
  const m = stmtFlat.match(re);
  assert.ok(m, `DELETE FROM public.${tableHint} ... WHERE must exist`);
  return m[1];
}

function runContractAssertions(): string {
  assert.ok(
    /ARCHIVE \+ RESTORE \+ PERMANENT DELETE/.test(read(CORRECTION)),
    "corrected contract baseline must remain ARCHIVE + RESTORE + PERMANENT DELETE"
  );

  assert.ok(
    !existsSync(path.join(ROOT, OLD_ARCHIVE_MIGRATION)),
    "A/B — superseded archive-only migration must not remain as a pending apply file"
  );

  assert.ok(
    existsSync(path.join(ROOT, MIGRATION)),
    "A — final lifecycle migration must exist"
  );

  const sql = read(MIGRATION);
  const sqlFlat = flatten(sql);
  const sha256 = createHash("sha256").update(sql).digest("hex");
  const rpcBody = findFunctionBody(sql, "delete_product_permanently");
  const rpcFlat = flatten(rpcBody);

  // C — archived_at authored nullable
  assert.ok(
    /add column if not exists archived_at\s+timestamptz\s+null/i.test(sql),
    "C — archived_at timestamptz null must be authored"
  );

  // D — no business-data backfill
  assert.ok(
    !/\bupdate\s+public\.products\b/i.test(sql),
    "D — migration must not UPDATE products (no backfill)"
  );
  assert.ok(
    !/\binsert\s+into\s+public\.products\b/i.test(sql),
    "D — migration must not INSERT products"
  );

  // E — archived⇒unavailable CHECK
  assert.ok(
    /products_archived_requires_unavailable/i.test(sql),
    "E — CHECK name"
  );
  assert.ok(
    /check\s*\(\s*archived_at\s+is\s+null\s+or\s+is_available\s*=\s*false\s*\)/i.test(
      sqlFlat
    ),
    "E — CHECK must enforce archived_at IS NULL OR is_available = false"
  );

  // F/G — public SELECT
  const publicPolicyMatch = sql.match(
    /create policy "products_select_available_public"[\s\S]*?;/i
  );
  assert.ok(publicPolicyMatch, "F — public SELECT policy must be recreated");
  const publicPolicy = publicPolicyMatch[0];
  assert.ok(/to\s+anon\b/i.test(publicPolicy));
  assert.ok(
    /is_available\s*=\s*true/i.test(publicPolicy),
    "G — is_available preserved"
  );
  assert.ok(
    /archived_at\s+is\s+null/i.test(publicPolicy),
    "F — archived excluded"
  );
  assert.ok(
    /businesses\s+b[\s\S]*b\.is_active\s*=\s*true/i.test(publicPolicy),
    "G — active-business predicate preserved"
  );

  // H — admin SELECT not archive-filtered
  assert.ok(
    !/drop policy if exists "products_select_own_business"/i.test(sql),
    "H — must not drop admin own-business SELECT"
  );
  assert.ok(
    !/create policy "products_select_own_business"/i.test(sql),
    "H — must not recreate admin SELECT with archive filter"
  );

  // I/J — raw DELETE
  assert.ok(
    /drop policy if exists "products_delete_own_business"/i.test(sql),
    "I — must drop products_delete_own_business"
  );
  assert.ok(
    !/create policy "products_delete/i.test(sql),
    "J — must not create a replacement products DELETE policy"
  );
  assert.ok(!/drop policy if exists "products_update_own_business"/i.test(sql));
  assert.ok(!/drop policy if exists "products_insert_own_business"/i.test(sql));
  const rlsHist = read(RLS_MIGRATION);
  assert.ok(/create policy "products_update_own_business"/i.test(rlsHist));

  // K — SKU
  const skuSql = read(SKU_MIGRATION);
  assert.ok(
    /create unique index if not exists products_business_sku_uidx[\s\S]*where\s+sku\s+is\s+not\s+null/i.test(
      skuSql
    )
  );
  assert.ok(
    !/create\s+unique\s+index[\s\S]{0,240}sku[\s\S]{0,240}archived_at/i.test(
      sql
    ),
    "K — must not author SKU unique index allowing reuse via archived predicate"
  );
  assert.ok(
    !/drop\s+index[\s\S]*products_business_sku_uidx/i.test(sql),
    "K — must not drop existing SKU unique index"
  );

  // L — active-list index
  assert.ok(
    /create index if not exists products_business_created_at_active_idx[\s\S]*where\s+archived_at\s+is\s+null/i.test(
      sql
    ),
    "L — active-list partial index predicate"
  );

  // M — RPC exists
  assert.ok(
    /create\s+or\s+replace\s+function\s+public\.delete_product_permanently\s*\(\s*p_product_id\s+uuid\s*\)/i.test(
      sql
    ),
    "M — delete_product_permanently(p_product_id uuid) must exist"
  );

  // N — no trusted business_id / force / cascade
  assert.ok(
    !/delete_product_permanently\s*\([^)]*business_id/i.test(sql),
    "N — RPC must not accept business_id"
  );
  assert.ok(!/p_business_id/i.test(rpcBody), "N — no p_business_id");
  assert.ok(!/p_force\b/i.test(rpcBody), "AF — no force flag");
  assert.ok(!/p_cascade\b/i.test(rpcBody), "AF — no cascade flag");

  // O/AE — image_url from DB
  assert.ok(
    /pr\.image_url/i.test(rpcBody) && /into[\s\S]*v_image_url/i.test(rpcBody),
    "O — image_url captured from locked products row"
  );
  assert.ok(
    /image_url\s*:=\s*v_image_url/i.test(rpcBody),
    "AE — image_url returned from captured DB value"
  );

  // P — auth
  assert.ok(/auth\.uid\(\)/i.test(rpcBody), "P — auth.uid() required");
  assert.ok(
    /DELETE_PRODUCT_PERMANENTLY_UNAUTHORIZED/i.test(rpcBody),
    "P — unauthorized outcome"
  );

  // Q — manageProducts roles
  assert.ok(
    /v_role\s+not\s+in\s*\(\s*'owner'\s*,\s*'admin'\s*,\s*'manager'\s*,\s*'super_admin'\s*\)/i.test(
      rpcFlat
    ),
    "Q — role allow-list must match manageProducts semantics"
  );

  // R — tenant
  assert.ok(
    /pr\.business_id\s*=\s*v_profile_business_id/i.test(rpcBody),
    "R — tenant ownership enforced on lock for non-super_admin"
  );

  // S/T — ACL
  assert.ok(
    /revoke\s+all\s+on\s+function\s+public\.delete_product_permanently\s*\(\s*uuid\s*\)\s+from\s+public/i.test(
      sql
    ),
    "S — PUBLIC execute revoked"
  );
  assert.ok(
    /revoke\s+all\s+on\s+function\s+public\.delete_product_permanently\s*\(\s*uuid\s*\)\s+from\s+anon/i.test(
      sql
    ),
    "T — anon execute denied"
  );
  assert.ok(
    /grant\s+execute\s+on\s+function\s+public\.delete_product_permanently\s*\(\s*uuid\s*\)\s+to\s+authenticated/i.test(
      sql
    ),
    "authenticated EXECUTE only"
  );

  // U — DEFINER + search_path
  assert.ok(/security\s+definer/i.test(rpcBody), "U/security — SECURITY DEFINER");
  assert.ok(
    /set\s+search_path\s*=\s*''/i.test(rpcBody),
    "U — search_path hardened to empty"
  );
  assert.ok(!/execute\s+immediate/i.test(rpcBody), "no dynamic SQL");
  assert.ok(!/format\s*\(\s*'delete/i.test(rpcBody), "no dynamic SQL delete");

  // V — lock
  assert.ok(/\bfor\s+update\b/i.test(rpcBody), "V — product row locked FOR UPDATE");

  // W — stock_movements scoped
  {
    const smMatch = rpcBody.match(
      /delete\s+from\s+public\.stock_movements[\s\S]*?;/i
    );
    assert.ok(smMatch, "W — stock_movements DELETE must exist");
    const where = deleteWhereClause(flatten(smMatch[0]), "stock_movements");
    assert.ok(
      /product_id\s*=\s*v_product_id/i.test(where),
      "W — stock_movements DELETE must be scoped by product_id"
    );
    assert.ok(
      !/order_id\s*=/i.test(where),
      "W — must not delete by order_id broadly"
    );
  }

  // X — assignments target_type + target_id
  {
    const aMatch = rpcBody.match(
      /delete\s+from\s+public\.customization_group_assignments[\s\S]*?;/i
    );
    assert.ok(aMatch, "X — assignment DELETE must exist");
    const where = deleteWhereClause(
      flatten(aMatch[0]),
      "customization_group_assignments"
    );
    assert.ok(
      /target_type\s*=\s*'product'/i.test(where),
      "X — target_type = product required"
    );
    assert.ok(
      /target_id\s*=\s*v_product_id/i.test(where),
      "X — target_id = product required"
    );
  }

  // Y — upsell items scoped
  {
    const uMatch = rpcBody.match(
      /delete\s+from\s+public\.upsell_group_items[\s\S]*?;/i
    );
    assert.ok(uMatch, "Y — upsell_group_items DELETE must exist");
    const where = deleteWhereClause(flatten(uMatch[0]), "upsell_group_items");
    assert.ok(
      /product_id\s*=\s*v_product_id/i.test(where),
      "Y — upsell items scoped to deleted product only"
    );
  }

  // Z — shared definitions preserved
  assert.ok(
    !/delete\s+from\s+public\.customization_groups\b/i.test(rpcBody),
    "Z — must not delete customization_groups definitions"
  );
  assert.ok(
    !/delete\s+from\s+public\.customization_options\b/i.test(rpcBody),
    "Z — must not delete customization_options"
  );
  {
    const ugMatch = rpcBody.match(
      /delete\s+from\s+public\.upsell_groups[\s\S]*?;/i
    );
    assert.ok(ugMatch, "upsell product-target cleanup must exist");
    const where = deleteWhereClause(flatten(ugMatch[0]), "upsell_groups");
    assert.ok(
      /target_type\s*=\s*'product'/i.test(where) &&
        /target_id\s*=\s*v_product_id/i.test(where),
      "Z — upsell_groups delete must be product-target scoped only"
    );
  }

  // AA/AB — orders preserved
  assert.ok(!/delete\s+from\s+public\.order_items\b/i.test(rpcBody), "AA");
  assert.ok(!/delete\s+from\s+public\.orders\b/i.test(rpcBody), "AB");
  assert.ok(!/update\s+public\.order_items\b/i.test(rpcBody), "AA snapshots");
  assert.ok(!/update\s+public\.orders\b/i.test(rpcBody), "AB");

  // AC — cleanup before products DELETE
  {
    const productsDeleteIdx = rpcBody.search(
      /delete\s+from\s+public\.products\b/i
    );
    const stockIdx = rpcBody.search(
      /delete\s+from\s+public\.stock_movements\b/i
    );
    const itemsIdx = rpcBody.search(
      /delete\s+from\s+public\.upsell_group_items\b/i
    );
    assert.ok(productsDeleteIdx > 0, "AC — products DELETE must exist");
    assert.ok(
      stockIdx >= 0 && stockIdx < productsDeleteIdx,
      "AC — stock_movements cleanup before products DELETE"
    );
    assert.ok(
      itemsIdx >= 0 && itemsIdx < productsDeleteIdx,
      "AC — upsell item cleanup before products DELETE"
    );
  }

  // AD — no Storage
  assert.ok(!/storage\.objects/i.test(sql), "AD");
  assert.ok(!/http[s]?_request|net\.http|pg_net/i.test(sql), "AD");
  assert.ok(!/product-images/i.test(rpcBody), "AD");

  // AG — restock untouched (comments may mention the function name)
  assert.ok(
    !/create\s+(or\s+replace\s+)?function\s+public\.transition_order_status/i.test(
      sql
    ),
    "AG — restock/cancel function not redefined here"
  );
  const restockSql = read(RESTOCK_MIGRATION);
  assert.ok(
    /join\s+public\.products\s+p/i.test(restockSql),
    "AG — existing restock INNER JOIN products remains the compatibility proof source"
  );

  // AH — stock trigger untouched
  const stockSql = read(STOCK_MIGRATION);
  assert.ok(
    /auto_suspend_out_of_stock|tr_auto_suspend_out_of_stock/i.test(stockSql)
  );
  assert.ok(
    !/auto_suspend_out_of_stock|tr_auto_suspend_out_of_stock/i.test(sql),
    "AH — must not redefine stock/availability trigger"
  );

  // AI — no FK rewrite
  assert.ok(!/\balter\s+table[\s\S]*\bforeign key\b/i.test(sql));
  assert.ok(!/\badd\s+constraint[\s\S]*\breferences\b/i.test(sql));
  assert.ok(!/\bdrop\s+constraint[\s\S]*_fkey\b/i.test(sql));

  // AJ — no archive/restore RPCs
  assert.ok(
    !/create\s+(or\s+replace\s+)?function[\s\S]*archive_product/i.test(sql),
    "AJ — archive RPC not required"
  );
  assert.ok(
    !/create\s+(or\s+replace\s+)?function[\s\S]*restore_product/i.test(sql),
    "AJ — restore RPC not required"
  );

  assert.ok(
    /deleted\s*:=\s*false/i.test(rpcBody),
    "idempotent absent outcome must set deleted=false"
  );
  assert.ok(
    /deleted\s*:=\s*true/i.test(rpcBody),
    "successful delete must set deleted=true"
  );

  return sha256;
}

const sha256 = runContractAssertions();
console.log(
  "PASS — admin-products-product-removal-lifecycle-db-author.verify.ts"
);
console.log(`migration: ${MIGRATION}`);
console.log(`sha256: ${sha256}`);

if (process.env.VERIFY_PROBES === "1") {
  const migPath = path.join(ROOT, MIGRATION);
  const original = read(MIGRATION);

  function runFocusedExpectFail(): void {
    const result = spawnSync(
      process.execPath,
      [
        ...process.execArgv.filter((a) => !a.includes("VERIFY_PROBES")),
        path.join(ROOT, "node_modules/tsx/dist/cli.mjs"),
        path.join(ROOT, VERIFY_REL),
      ],
      {
        cwd: ROOT,
        env: { ...process.env, VERIFY_PROBES: "0" },
        encoding: "utf8",
      }
    );
    assert.ok(
      result.status !== 0,
      `expected focused verify FAIL, got status=${result.status}\n${result.stdout}\n${result.stderr}`
    );
  }

  function probe(label: string, mutate: (s: string) => string) {
    try {
      writeFileSync(migPath, mutate(original), "utf8");
      runFocusedExpectFail();
    } finally {
      writeFileSync(migPath, original, "utf8");
    }
    runContractAssertions();
    console.log(`PROBE ${label}: FAIL_OK → restored PASS`);
  }

  probe("A", (s) =>
    s.replace(/and archived_at is null\n/i, "-- PROBE_A_REMOVED archived_at\n")
  );

  probe("B", (s) =>
    s.replace(
      /-- NOT APPLIED in DB-AUTHOR\. Remote apply = next phase\./,
      `-- NOT APPLIED in DB-AUTHOR. Remote apply = next phase.\ncreate unique index products_business_sku_uidx on public.products (business_id, sku) where sku is not null and archived_at is null;`
    )
  );

  probe("C", (s) =>
    s.replace(
      /drop policy if exists "products_delete_own_business" on public\.products;/,
      `drop policy if exists "products_delete_own_business" on public.products;\ncreate policy "products_delete_own_business" on public.products for delete to authenticated using (true);`
    )
  );

  probe("D", (s) =>
    s.replace(
      /if v_role not in \('owner', 'admin', 'manager', 'super_admin'\) then[\s\S]*?end if;/,
      `-- PROBE_D_REMOVED role check`
    )
  );

  probe("E", (s) =>
    s.replace(
      /delete from public\.customization_group_assignments a\n  where a\.target_type = 'product'\n    and a\.target_id = v_product_id;/,
      `delete from public.customization_group_assignments a\n  where a.target_id = v_product_id;`
    )
  );

  probe("F", (s) =>
    s.replace(/set search_path = ''\nvolatile/, "volatile")
  );

  console.log("ALL PROBES PASS");
}
