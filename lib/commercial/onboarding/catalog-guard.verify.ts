import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { promoterCatalogDecision } from "@/lib/commercial/onboarding/catalog-guard";
import { canManageProducts, hasAdminPermission } from "@/lib/admin/permissions";

assert.equal(promoterCatalogDecision(["name", "description"]), "content");
assert.equal(promoterCatalogDecision(["name", "price"]), "reject");
assert.equal(promoterCatalogDecision(["price_delta"]), "reject");
assert.equal(promoterCatalogDecision(["is_available"]), "reject");
assert.equal(promoterCatalogDecision(["sku", "description"]), "reject");

assert.equal(canManageProducts("owner"), true);
assert.equal(canManageProducts("manager"), true);
assert.equal(canManageProducts("operator"), false);
assert.equal(hasAdminPermission("owner", "manageProducts"), true);

const products = readFileSync("app/admin/(protected)/products/actions.ts", "utf8");
const categories = readFileSync("app/admin/(protected)/categories/actions.ts", "utf8");
const customizations = readFileSync("app/admin/(protected)/products/customizations/actions.ts", "utf8");
const permissions = readFileSync("lib/admin/permissions.ts", "utf8");
const catalogSql = readFileSync("supabase/migrations/20261011022000_commercial_phase04_catalog.sql", "utf8");

assert.equal(products.includes('requireAdminPermission("manageProducts")'), true);
assert.equal(products.includes("price,"), true);
assert.equal(products.includes("promoterCatalogGate"), true);
assert.equal(categories.includes('requireAdminPermission("manageProducts")'), true);
assert.equal(customizations.includes("price_delta"), true);
assert.equal(customizations.includes("promoterCatalogGate"), true);
assert.equal(permissions.includes("return isOwner(role) || isManager(role);"), true);
assert.equal(catalogSql.includes("create policy"), false);
assert.equal(catalogSql.includes("grant_field_forbidden"), true);
assert.equal(catalogSql.includes("grant_expired"), true);
assert.equal(catalogSql.includes("price_delta"), true);

console.log("catalog-guard.verify: ok");
