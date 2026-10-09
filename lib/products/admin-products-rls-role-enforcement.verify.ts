/**
 * Verify ADMIN-PRODUCTS-RLS-ROLE-ENFORCEMENT-1 (PROD-P1-2).
 *
 * Asserts the *contract* of 20260909040000_products_manage_role_rls.sql — that every
 * mutative policy on public.products and on the product-images bucket requires tenancy
 * AND a manageProducts-equivalent role, that UPDATE carries both USING and WITH CHECK,
 * and that no read path was hardened. The SQL allow-list is cross-checked against the
 * real application predicate in lib/admin/permissions.ts rather than hardcoded twice.
 *
 * Run: npx tsx lib/products/admin-products-rls-role-enforcement.verify.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { canManageProducts } from "@/lib/admin/permissions";
import type { ProfileRole } from "@/types/database";

const MIGRATION = "supabase/migrations/20260909040000_products_manage_role_rls.sql";

const sql = readFileSync(path.join(process.cwd(), MIGRATION), "utf8");

// Roles actually persistable in profiles.role, per the profiles_role_valid CHECK in
// 20260516201000_s1_business_roles.sql. Kept in sync with the migration below.
const PERSISTED_ROLES: ProfileRole[] = [
  "admin",
  "owner",
  "manager",
  "operator",
  "viewer",
  "super_admin"
];

const roleConstraintSql = readFileSync(
  path.join(process.cwd(), "supabase/migrations/20260516201000_s1_business_roles.sql"),
  "utf8"
);
for (const role of PERSISTED_ROLES) {
  assert.ok(
    roleConstraintSql.includes(`'${role}'`),
    `role model drift: '${role}' is no longer in profiles_role_valid`
  );
}

const APP_ALLOWED = PERSISTED_ROLES.filter((role) => canManageProducts(role)).sort();
const APP_DENIED = PERSISTED_ROLES.filter((role) => !canManageProducts(role)).sort();

// Sanity: the app contract is the one we think it is before we compare SQL against it.
assert.deepEqual(APP_ALLOWED, ["admin", "manager", "owner", "super_admin"]);
assert.deepEqual(APP_DENIED, ["operator", "viewer"]);

// ---------------------------------------------------------------------------
// policy extraction
// ---------------------------------------------------------------------------

type Policy = {
  name: string;
  body: string;
  target: string;
  operation: string;
  usingClause: string | null;
  withCheckClause: string | null;
};

function extractPolicies(source: string): Policy[] {
  const policies: Policy[] = [];
  const starts = [...source.matchAll(/create policy "([^"]+)"/g)];

  for (const start of starts) {
    const from = start.index ?? 0;
    const body = source.slice(from, from + statementLength(source.slice(from)));
    const target = /\bon\s+([\w.]+)/.exec(body)?.[1] ?? "";
    const operation = /\bfor\s+(select|insert|update|delete|all)\b/.exec(body)?.[1] ?? "";

    policies.push({
      name: start[1],
      body,
      target,
      operation,
      usingClause: clause(body, "using"),
      withCheckClause: clause(body, "with check")
    });
  }

  return policies;
}

/** Length of the statement starting at index 0, up to the `;` at paren depth 0. */
function statementLength(source: string): number {
  let depth = 0;
  let inString = false;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];

    if (char === "'") {
      inString = !inString;
      continue;
    }
    if (inString) {
      continue;
    }
    if (char === "(") {
      depth += 1;
    } else if (char === ")") {
      depth -= 1;
    } else if (char === ";" && depth === 0) {
      return i + 1;
    }
  }

  return source.length;
}

/** Balanced contents of the `using (...)` / `with check (...)` clause, if present. */
function clause(body: string, keyword: "using" | "with check"): string | null {
  const marker = new RegExp(`\\b${keyword}\\s*\\(`, "i").exec(body);
  if (!marker) {
    return null;
  }

  const open = (marker.index ?? 0) + marker[0].length - 1;
  let depth = 0;
  let inString = false;

  for (let i = open; i < body.length; i += 1) {
    const char = body[i];

    if (char === "'") {
      inString = !inString;
      continue;
    }
    if (inString) {
      continue;
    }
    if (char === "(") {
      depth += 1;
    } else if (char === ")") {
      depth -= 1;
      if (depth === 0) {
        return body.slice(open + 1, i);
      }
    }
  }

  return null;
}

function rolesInAllowLists(predicate: string): string[] {
  const roles = new Set<string>();

  for (const match of predicate.matchAll(/p\.role\s+in\s*\(([^)]*)\)/g)) {
    for (const raw of match[1].split(",")) {
      const role = raw.trim().replace(/^'|'$/g, "");
      if (role) {
        roles.add(role);
      }
    }
  }

  for (const match of predicate.matchAll(/p\.role\s*=\s*'([^']+)'/g)) {
    roles.add(match[1]);
  }

  return [...roles].sort();
}

function hasTenantScope(predicate: string): boolean {
  return (
    /business_id\s*=\s*\(\s*select\s+p\.business_id/i.test(predicate) &&
    /p\.id\s*=\s*auth\.uid\(\)/i.test(predicate)
  );
}

function hasRoleGate(predicate: string): boolean {
  return /p\.role\s+in\s*\(/.test(predicate);
}

const policies = extractPolicies(sql);
const byName = new Map(policies.map((policy) => [policy.name, policy]));

// ---------------------------------------------------------------------------
// products — mutative policies are tenant + role gated
// ---------------------------------------------------------------------------

const PRODUCT_MUTATIONS = [
  { name: "products_insert_own_business", operation: "insert" },
  { name: "products_update_own_business", operation: "update" },
  { name: "products_delete_own_business", operation: "delete" }
];

for (const { name, operation } of PRODUCT_MUTATIONS) {
  const policy = byName.get(name);
  assert.ok(policy, `${name} must be recreated by the migration`);
  assert.equal(policy.target, "public.products", `${name} must target public.products`);
  assert.equal(policy.operation, operation, `${name} must be FOR ${operation.toUpperCase()}`);
  assert.ok(/\bto\s+authenticated\b/.test(policy.body), `${name} must apply to authenticated`);

  // INSERT carries WITH CHECK only; DELETE carries USING only; UPDATE must carry BOTH.
  const predicates: string[] = [];
  if (operation === "insert") {
    assert.ok(policy.withCheckClause, `${name} must define WITH CHECK`);
    assert.equal(policy.usingClause, null, `${name} must not define USING`);
    predicates.push(policy.withCheckClause);
  } else if (operation === "delete") {
    assert.ok(policy.usingClause, `${name} must define USING`);
    predicates.push(policy.usingClause);
  } else {
    assert.ok(policy.usingClause, `${name} must define USING (row targeting)`);
    assert.ok(
      policy.withCheckClause,
      `${name} must define WITH CHECK so business_id cannot be moved to another tenant`
    );
    predicates.push(policy.usingClause, policy.withCheckClause);
  }

  for (const predicate of predicates) {
    assert.ok(hasTenantScope(predicate), `${name}: tenant scope (business_id) must remain`);
    assert.ok(hasRoleGate(predicate), `${name}: must gate on p.role`);

    // The SQL allow-list must equal the application's manageProducts contract exactly.
    assert.deepEqual(
      rolesInAllowLists(predicate),
      APP_ALLOWED,
      `${name}: SQL roles must match canManageProducts() exactly`
    );

    // Tenant and role are required together, never as alternatives.
    assert.ok(
      /business_id\s*=\s*\([\s\S]*?\)\s*and\s+exists/i.test(predicate),
      `${name}: tenant and role must be ANDed, not ORed`
    );

    // Existing super-admin bypass is preserved.
    assert.ok(
      /p\.role\s*=\s*'super_admin'/.test(predicate),
      `${name}: existing super_admin branch must be preserved`
    );

    for (const denied of APP_DENIED) {
      assert.ok(
        !predicate.includes(`'${denied}'`),
        `${name}: '${denied}' must never appear in a mutative allow-list`
      );
    }
  }
}

// ---------------------------------------------------------------------------
// storage — product-images mutative policies
// ---------------------------------------------------------------------------

const STORAGE_MUTATIONS = [
  { name: "product_images_insert_own_business", operation: "insert" },
  { name: "product_images_update_own_business", operation: "update" }
];

for (const { name, operation } of STORAGE_MUTATIONS) {
  const policy = byName.get(name);
  assert.ok(policy, `${name} must be recreated by the migration`);
  assert.equal(policy.target, "storage.objects", `${name} must target storage.objects`);
  assert.equal(policy.operation, operation, `${name} must be FOR ${operation.toUpperCase()}`);

  const predicates: string[] = [];
  if (operation === "insert") {
    assert.ok(policy.withCheckClause, `${name} must define WITH CHECK`);
    predicates.push(policy.withCheckClause);
  } else {
    assert.ok(policy.usingClause, `${name} must define USING`);
    assert.ok(policy.withCheckClause, `${name} must define WITH CHECK`);
    predicates.push(policy.usingClause, policy.withCheckClause);
  }

  for (const predicate of predicates) {
    assert.ok(
      /bucket_id\s*=\s*'product-images'/.test(predicate),
      `${name}: must stay scoped to the product-images bucket`
    );

    // Tenant folder ownership preserved: business_id is the first path segment.
    assert.ok(
      /\(storage\.foldername\(name\)\)\[1\]\s*=\s*\(\s*select\s+p\.business_id::text/.test(
        predicate
      ),
      `${name}: tenant folder ownership must remain`
    );
    assert.ok(
      /array_length\(storage\.foldername\(name\), 1\)\s*=\s*2/.test(predicate),
      `${name}: path shape check must remain`
    );

    assert.ok(hasRoleGate(predicate), `${name}: must gate on p.role`);

    // Storage has no super_admin branch (business_id is NULL there, so it already fails
    // the folder check). The allow-list must therefore be the tenant-scoped subset.
    const roles = rolesInAllowLists(predicate);
    assert.deepEqual(
      roles,
      ["admin", "manager", "owner"],
      `${name}: SQL roles must be the tenant-scoped manageProducts subset`
    );
    for (const role of roles) {
      assert.ok(
        canManageProducts(role as ProfileRole),
        `${name}: '${role}' must satisfy canManageProducts()`
      );
    }

    for (const denied of APP_DENIED) {
      assert.ok(
        !predicate.includes(`'${denied}'`),
        `${name}: '${denied}' must never appear in a mutative allow-list`
      );
    }
  }
}

// ---------------------------------------------------------------------------
// reads must NOT be hardened, and no storage DELETE may be introduced
// ---------------------------------------------------------------------------

const READ_POLICIES = [
  "products_select_own_business",
  "products_select_available_public",
  "product_images_public_read"
];

for (const name of READ_POLICIES) {
  assert.ok(!byName.has(name), `${name} must not be recreated by this migration`);
  assert.ok(
    !sql.includes(`drop policy if exists "${name}"`),
    `${name} must not be dropped — SELECT is not the finding`
  );
}

assert.ok(
  !/\bfor\s+select\b/.test(sql),
  "the migration must not define any SELECT policy"
);

const deletePolicies = policies.filter((policy) => policy.operation === "delete");
assert.deepEqual(
  deletePolicies.map((policy) => policy.target),
  ["public.products"],
  "the only DELETE policy may be on public.products — no storage DELETE in this phase"
);
assert.ok(
  !/drop policy if exists "product_images_delete/.test(sql),
  "storage DELETE belongs to image lifecycle (PROD-P3-15), not this phase"
);

// Read policies still exist upstream and were never redefined here.
const publicReadSql = readFileSync(
  path.join(process.cwd(), "supabase/migrations/20260426231500_t7_product_images_storage.sql"),
  "utf8"
);
assert.ok(
  publicReadSql.includes('create policy "product_images_public_read"'),
  "public object read must remain defined"
);

const anonReadSql = readFileSync(
  path.join(process.cwd(), "supabase/migrations/20260426230000_t6_public_catalog_read.sql"),
  "utf8"
);
assert.ok(
  anonReadSql.includes('create policy "products_select_available_public"'),
  "anon catalog read must remain defined"
);

// ---------------------------------------------------------------------------
// blast radius: policies only
// ---------------------------------------------------------------------------

const statements = sql
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("--"))
  .join("\n");

const FORBIDDEN = [
  /\balter\s+table\b/i,
  /\bcreate\s+table\b/i,
  /\bdrop\s+table\b/i,
  /\bcreate\s+(or\s+replace\s+)?function\b/i,
  /\bcreate\s+trigger\b/i,
  /\bdrop\s+trigger\b/i,
  /\btruncate\b/i,
  /\bgrant\b/i,
  /\brevoke\b/i,
  /\binsert\s+into\b/i,
  /\bdelete\s+from\b/i,
  /^\s*update\s+\w/im,
  /create_order/i,
  /auto_suspend/i
];

for (const pattern of FORBIDDEN) {
  assert.ok(
    !pattern.test(statements),
    `migration must only touch policies — found ${pattern}`
  );
}

// Every dropped policy is recreated in the same migration (no capability left dangling).
const dropped = [...sql.matchAll(/drop policy if exists "([^"]+)"/g)].map((m) => m[1]).sort();
const created = policies.map((policy) => policy.name).sort();
assert.deepEqual(dropped, created, "every dropped policy must be recreated");

assert.equal(policies.length, 5, "expected exactly 5 policies: 3 products + 2 storage");

// Out-of-scope tables must not appear: system-wide RLS hardening is a follow-up.
for (const table of ["orders", "categories", "order_items", "businesses", "profiles"]) {
  assert.ok(
    !new RegExp(`on\\s+public\\.${table}\\b`).test(statements),
    `public.${table} is out of scope for this phase`
  );
}

console.log("admin-products-rls-role-enforcement.verify.ts: PASS");
