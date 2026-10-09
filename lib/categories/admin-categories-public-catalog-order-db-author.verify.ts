/**
 * Verify ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-DB-AUTHOR-APPEND-LOCK-AUTHORITY-FIX-1
 *
 * Final (not applied) category-order migration contract:
 * order model + position privilege allow-list + DEFINER append with auth-before-lock.
 *
 * Run:
 *   npx tsx lib/categories/admin-categories-public-catalog-order-db-author.verify.ts
 * Probes:
 *   VERIFY_PROBES=1 npx tsx lib/categories/admin-categories-public-catalog-order-db-author.verify.ts
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const MIGRATION =
  "supabase/migrations/20260917210150_categories_public_catalog_order.sql";
const SUPERSEDED_1 =
  "supabase/migrations/20260917182047_categories_public_catalog_order.sql";
const SUPERSEDED_2 =
  "supabase/migrations/20260917202554_categories_public_catalog_order.sql";
const PRODUCTS_RLS =
  "supabase/migrations/20260909040000_products_manage_role_rls.sql";
const VERIFY_REL =
  "lib/categories/admin-categories-public-catalog-order-db-author.verify.ts";
const HISTORICAL_SHA_1 =
  "4bb35bec9da5981d0c58a1f9658cf8408d09b2286d44a2ec27ed1f90e0ece9e8";
const HISTORICAL_SHA_2 =
  "18ef63079eca6afaf6b5d44013df13e0742f7810cd597f590236002aaf4dd8cf";

function read(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function flatten(s: string) {
  return s.replace(/\s+/g, " ");
}

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
    `create\\s+(or\\s+replace\\s+)?function\\s+public\\.${name}\\s*\\(`,
    "i"
  );
  const m = sql.match(re);
  assert.ok(m && m.index != null, `function public.${name} must exist`);
  return extractStatement(sql, m.index);
}

function activeCategoryOrderMigrations(): string[] {
  const dir = path.join(ROOT, "supabase/migrations");
  return readdirSync(dir)
    .filter((f) => /categories_public_catalog_order/i.test(f) && f.endsWith(".sql"))
    .sort();
}

function runContractAssertions(): string {
  assert.ok(existsSync(path.join(ROOT, MIGRATION)), "final migration must exist");
  assert.ok(!existsSync(path.join(ROOT, SUPERSEDED_1)), "migration #1 must not be active");
  assert.ok(!existsSync(path.join(ROOT, SUPERSEDED_2)), "migration #2 must not be active");

  const active = activeCategoryOrderMigrations();
  assert.equal(
    active.length,
    1,
    `exactly one active category-order migration; found: ${active.join(", ")}`
  );
  assert.equal(active[0], path.basename(MIGRATION));

  const sql = read(MIGRATION);
  const flat = flatten(sql);
  const sha256 = createHash("sha256").update(sql).digest("hex");
  assert.notEqual(sha256, HISTORICAL_SHA_1, "must differ from superseded #1 SHA");
  assert.notEqual(sha256, HISTORICAL_SHA_2, "must differ from superseded #2 SHA");

  assert.ok(
    /ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-DB-AUTHOR-APPEND-LOCK-AUTHORITY-FIX-1/.test(
      sql
    ),
    "phase marker"
  );
  assert.ok(/NOT APPLIED/.test(sql));
  assert.ok(/APPEND_LOCK_AUTHORITY_FAIL|18ef6307/i.test(sql));
  assert.ok(/POSITION_AUTHORITY_BYPASS|4bb35bec/i.test(sql));

  // No new ordering model
  assert.ok(/categories\.position/.test(sql));
  assert.ok(!/add\s+column[\s\S]*\bsort_order\b/i.test(sql));
  assert.ok(!/add\s+column[\s\S]*\bdisplay_order\b/i.test(sql));
  assert.ok(!/create\s+table\s+public\.category_order/i.test(sql));
  assert.ok(!/alter\s+table\s+public\.products\b/i.test(sql));

  // Ambiguity + backfill
  assert.ok(/CATEGORY_ORDER_BACKFILL_AMBIGUOUS_CURRENT_ORDER/.test(sql));
  assert.ok(/group by business_id,\s*position,\s*name/i.test(flat));
  assert.ok(/row_number\(\)\s+over/i.test(sql));
  assert.ok(/partition by c\.business_id/i.test(flat));
  assert.ok(
    /order by\s+c\.position asc nulls last,\s*c\.name asc,\s*c\.created_at asc,\s*c\.id asc/i.test(
      flat
    )
  );
  assert.ok(
    /alter table public\.categories\s+alter column position set not null/i.test(flat)
  );
  assert.ok(!/alter column position set default\s+0/i.test(flat));
  assert.ok(
    /unique\s*\(\s*business_id\s*,\s*position\s*\)\s*deferrable initially immediate/i.test(
      flat
    )
  );

  // Append DEFINER + auth-before-lock
  const appendFn = findFunctionBody(sql, "categories_assign_append_position");
  const appendFlat = flatten(appendFn);
  assert.ok(/security definer/i.test(appendFlat), "append must be SECURITY DEFINER");
  assert.ok(!/security invoker/i.test(appendFlat), "append must not be INVOKER");
  assert.ok(/set search_path = ''/i.test(appendFlat));
  assert.ok(/auth\.uid\(\)/i.test(appendFn));
  assert.ok(/from public\.profiles p/i.test(appendFn));
  assert.ok(/'owner',\s*'admin',\s*'manager'/i.test(appendFn));
  assert.ok(/'super_admin'/i.test(appendFn));
  assert.ok(/CATEGORY_ORDER_APPEND_UNAUTHORIZED/.test(appendFn));
  assert.ok(/CATEGORY_ORDER_APPEND_FORBIDDEN/.test(appendFn));
  assert.ok(
    /v_profile_business_id is distinct from new\.business_id/i.test(appendFlat),
    "tenant equality for normal roles"
  );
  assert.ok(/into new\.position/i.test(appendFlat));
  assert.ok(/coalesce\(max\(c\.position\),\s*-1\)\s*\+\s*1/i.test(appendFlat));
  assert.ok(/before insert on public\.categories/i.test(flat));

  // Auth BEFORE businesses FOR UPDATE (structural order inside append body)
  const authIdx = appendFlat.search(/auth\.uid\(\)/i);
  const roleIdx = appendFlat.search(/'owner',\s*'admin',\s*'manager'/i);
  const tenantIdx = appendFlat.search(
    /v_profile_business_id is distinct from new\.business_id/i
  );
  const lockIdx = appendFlat.search(
    /from public\.businesses b\s+where b\.id = new\.business_id\s+for update/i
  );
  assert.ok(authIdx >= 0 && roleIdx >= 0 && tenantIdx >= 0 && lockIdx >= 0);
  assert.ok(authIdx < lockIdx, "auth.uid before business lock");
  assert.ok(roleIdx < lockIdx, "role allow-list before business lock");
  assert.ok(tenantIdx < lockIdx, "tenant equality before business lock");

  // No businesses domain drift
  assert.ok(!/businesses_update_own_business/i.test(sql));
  assert.ok(!/create policy[\s\S]*on public\.businesses/i.test(sql));
  assert.ok(!/drop policy[\s\S]*on public\.businesses/i.test(sql));
  assert.ok(!/alter table public\.businesses\b/i.test(sql));
  assert.ok(!/grant update on (table )?public\.businesses/i.test(flat));
  assert.ok(!/revoke update on (table )?public\.businesses/i.test(flat));
  assert.ok(!/row level security/i.test(sql));
  assert.ok(!/set_config\s*\(|current_setting\s*\(|pg_advisory/i.test(sql));

  // RPC preserved
  const rpc = findFunctionBody(sql, "save_category_display_order");
  const rpcFlat = flatten(rpc);
  assert.ok(
    /create function public\.save_category_display_order\(\s*p_ordered_category_ids uuid\[\]\s*\)/i.test(
      flat
    )
  );
  assert.ok(!/\bp_business_id\b/.test(rpc));
  assert.ok(/security definer/i.test(rpcFlat));
  assert.ok(/set search_path = ''/i.test(rpcFlat));
  assert.ok(/CATEGORY_ORDER_STALE_SET/.test(rpc));
  assert.ok(
    /from public\.businesses b\s+where b\.id = v_business_id\s+for update/i.test(
      rpcFlat
    )
  );
  assert.ok(/unnest\(p_ordered_category_ids\) with ordinality/i.test(rpcFlat));
  assert.ok(
    /set constraints public\.categories_business_id_position_key deferred/i.test(
      rpcFlat
    )
  );

  // Position privilege allow-list preserved
  assert.ok(/revoke update on table public\.categories from authenticated/i.test(flat));
  assert.ok(/revoke update on table public\.categories from anon/i.test(flat));
  assert.ok(
    /grant update\s*\(\s*name\s*\)\s*on table public\.categories to authenticated/i.test(
      flat
    )
  );
  assert.ok(!/grant update\s*\(\s*position\s*\)/i.test(flat));
  assert.ok(
    !/grant update on (table )?public\.categories to authenticated/i.test(flat)
  );

  // RLS manageProducts
  const productsRls = read(PRODUCTS_RLS);
  assert.ok(/p\.role in \('owner', 'admin', 'manager'\)/.test(productsRls));
  const updateStart = sql.search(
    /create policy "categories_update_own_business"/i
  );
  assert.ok(updateStart >= 0);
  const updatePol = extractStatement(sql, updateStart);
  assert.ok(/role in \('owner', 'admin', 'manager'\)/.test(updatePol));
  assert.ok(/with check/i.test(updatePol) && /using/i.test(updatePol));

  // Forbidden product/storage coupling
  assert.ok(!/storage\.objects/i.test(sql));
  assert.ok(!/delete_product_permanently/i.test(sql));
  assert.ok(!/save_product_edit_draft/i.test(sql));

  return sha256;
}

const sha256 = runContractAssertions();
console.log(
  "PASS — admin-categories-public-catalog-order-db-author.verify.ts"
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

  // A — DEFINER → INVOKER
  probe("A_invoker", (s) =>
    s.replace(
      /create function public\.categories_assign_append_position\(\)\s*returns trigger\s*language plpgsql\s*security definer/i,
      `create function public.categories_assign_append_position()
returns trigger
language plpgsql
security invoker`
    )
  );

  // B — remove auth.uid/profile authorization block
  probe("B_no_auth", (s) =>
    s.replace(
      /v_uid uuid := \(select auth\.uid\(\)\);[\s\S]*?else\s+raise exception 'CATEGORY_ORDER_APPEND_FORBIDDEN'[\s\S]*?end if;/i,
      "-- PROBE_B removed auth"
    )
  );

  // C — lock before auth (move FOR UPDATE before auth.uid)
  probe("C_lock_before_auth", (s) => {
    const body = findFunctionBody(s, "categories_assign_append_position");
    const swapped = body.replace(
      /as \$\$\s*declare([\s\S]*?)begin([\s\S]*?)-- 5: ONLY AFTER auth[\s\S]*?for update;([\s\S]*?)end;\s*\$\$;/i,
      `as $$
declare$1begin
  perform 1 from public.businesses b where b.id = new.business_id for update;
$2
end;
$$;`
    );
    return s.replace(body, swapped);
  });

  // D — remove tenant equality
  probe("D_no_tenant", (s) =>
    s.replace(
      /or v_profile_business_id is distinct from new\.business_id/i,
      "/* PROBE_D */ false"
    )
  );

  // E — remove manager
  probe("E_no_manager", (s) =>
    s.replace(/'owner', 'admin', 'manager'/g, "'owner', 'admin'")
  );

  // F — allow operator
  probe("F_operator", (s) =>
    s.replace(/'owner', 'admin', 'manager'/g, "'owner', 'admin', 'manager', 'operator'")
  );

  // G — businesses UPDATE RLS in migration
  probe("G_businesses_rls", (s) =>
    `${s}\n\ncreate policy "businesses_update_own_business_probe" on public.businesses for update to authenticated using (true);\n`
  );

  // H — grant businesses UPDATE
  probe("H_businesses_grant", (s) =>
    `${s}\n\ngrant update on table public.businesses to authenticated;\n`
  );

  // I — UPDATE(position) regression
  probe("I_position_grant", (s) =>
    `${s}\n\ngrant update (position) on table public.categories to authenticated;\n`
  );

  // J — remove UPDATE(name)
  probe("J_no_name", (s) =>
    s.replace(
      /grant update\s*\(\s*name\s*\)\s*on table public\.categories to authenticated;/i,
      "-- PROBE_J removed name grant"
    )
  );

  // K — remove NEW.position override (honor client)
  probe("K_no_override", (s) =>
    s.replace(
      /select coalesce\(max\(c\.position\), -1\) \+ 1\s+into new\.position\s+from public\.categories c\s+where c\.business_id = new\.business_id;/i,
      "-- PROBE_K honor client position\n  null;"
    )
  );

  // L — reactivate previous migration
  {
    const label = "L_old_migration_active";
    try {
      writeFileSync(
        path.join(ROOT, SUPERSEDED_2),
        "-- PROBE superseded #2 restored\nselect 1;\n",
        "utf8"
      );
      runFocusedExpectFail();
    } finally {
      if (existsSync(path.join(ROOT, SUPERSEDED_2))) {
        unlinkSync(path.join(ROOT, SUPERSEDED_2));
      }
      writeFileSync(migPath, original, "utf8");
    }
    runContractAssertions();
    console.log(`PROBE ${label}: FAIL_OK → restored PASS`);
  }

  console.log("ALL PROBES PASS");
}
