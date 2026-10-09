import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const middleware = readFileSync("middleware.ts", "utf8");
assert.equal(middleware.includes('"/promoter/:path*"'), true);
assert.equal(middleware.includes('"/admin/:path*"'), true);
assert.equal(middleware.includes('"/b/:path*"'), true);
assert.equal(middleware.includes('"/commercial/:path*"'), true);

const actions = readFileSync("app/promoter/actions.ts", "utf8");
assert.equal(actions.includes("createSupabaseServiceClient"), false);
assert.equal(actions.includes("confirm_attribution"), false);
assert.equal(actions.includes("won"), false);

const opportunities = readFileSync("app/promoter/opportunities/page.tsx", "utf8");
assert.equal(opportunities.includes("won"), false);
assert.equal(opportunities.includes("Confirmar atribución"), false);
assert.equal(readFileSync("lib/commercial/promoters/verification-copy.ts", "utf8").includes("no consulta fiscal"), true);
assert.equal(readFileSync("app/promoter/profile/page.tsx", "utf8").includes("VERIFICATION_NOTICE"), true);
assert.equal(readFileSync("app/promoter/page.tsx", "utf8").includes("disponible en una fase posterior"), true);

console.log("promoter-panel.verify: ok");
