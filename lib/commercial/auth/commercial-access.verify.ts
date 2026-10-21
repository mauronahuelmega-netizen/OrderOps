import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const middleware = readFileSync("middleware.ts", "utf8");
assert.equal(middleware.includes('"/commercial/:path*"'), true);
assert.equal(middleware.includes('"/commercial"'), true);
const index = readFileSync("app/commercial/page.tsx", "utf8");
assert.equal(index.includes('redirect("/commercial/opportunities")'), true);
assert.equal(middleware.includes('"/admin/:path*"'), true);
assert.equal(middleware.includes('"/b/:path*"'), true);

const gate = readFileSync("lib/commercial/auth/require-commercial-principal.ts", "utf8");
assert.equal(gate.includes("requireAdminContext"), false);
assert.equal(gate.includes("forbidden"), true);

const board = readFileSync("app/commercial/opportunities/[id]/page.tsx", "utf8");
assert.equal(board.includes("won"), false);
assert.equal(board.includes("Confirmar atribución"), false);

console.log("commercial-access.verify: ok");
