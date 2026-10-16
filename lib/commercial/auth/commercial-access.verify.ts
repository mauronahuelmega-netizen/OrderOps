import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const middleware = readFileSync("middleware.ts", "utf8");
assert.equal(middleware.includes('"/commercial/:path*"'), true);
assert.equal(middleware.includes('"/commercial"'), true);
const gate = readFileSync("lib/commercial/auth/require-commercial-principal.ts", "utf8");
const index = readFileSync("app/commercial/page.tsx", "utf8");
assert.equal(index.includes("requireCommercialArea"), true);
assert.equal(index.includes('roles.includes("finance") && !roles.includes("commercial") && !roles.includes("superadmin")'), true);
assert.equal(index.includes('redirect(financeOnly ? "/commercial/settlements" : "/commercial/opportunities")'), true);
const principal = gate.slice(0, gate.indexOf("export async function requireCommercialArea"));
assert.equal(principal.includes('roles.includes("commercial") || roles.includes("superadmin")'), true);
assert.equal(principal.includes('roles.includes("finance")'), false);
assert.equal(principal.includes('redirect("/admin/login")'), true);
assert.equal(principal.includes("forbidden()"), true);
const area = gate.slice(gate.indexOf("export async function requireCommercialArea"));
assert.equal(area.includes('roles.includes("commercial") || roles.includes("superadmin") || roles.includes("finance")'), true);
assert.equal(area.includes('redirect("/admin/login")'), true);
assert.equal(area.includes("forbidden()"), true);
assert.equal(middleware.includes('"/admin/:path*"'), true);
assert.equal(middleware.includes('"/b/:path*"'), true);
assert.equal(middleware.includes('"/promoter/:path*"'), true);

assert.equal(gate.includes("requireAdminContext"), false);
assert.equal(gate.includes("forbidden"), true);

const board = readFileSync("app/commercial/opportunities/[id]/page.tsx", "utf8");
assert.equal(board.includes("won"), false);
assert.equal(board.includes("Confirmar atribución"), false);

console.log("commercial-access.verify: ok");
