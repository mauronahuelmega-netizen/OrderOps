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

const opportunities = readFileSync("app/promoter/(panel)/opportunities/page.tsx", "utf8");
assert.equal(opportunities.includes("won"), false);
assert.equal(opportunities.includes("labelOpportunityStage"), true);
assert.equal(opportunities.includes("Confirmar atribución"), false);
assert.equal(readFileSync("lib/commercial/promoters/verification-copy.ts", "utf8").includes("no consulta fiscal"), true);
assert.equal(readFileSync("app/promoter/(panel)/profile/page.tsx", "utf8").includes("VERIFICATION_NOTICE"), true);
const home = readFileSync("app/promoter/(panel)/page.tsx", "utf8");
assert.equal(home.includes("Las comisiones individuales no se listan en esta lectura."), true);
assert.equal(home.includes("disponible en una fase posterior"), false);
assert.equal(readFileSync("components/commercial/commercial-area-nav.tsx", "utf8").includes('roles.includes("finance")'), true);
assert.equal(readFileSync("app/commercial/settlements/page.tsx", "utf8").includes("Este rol no consulta ni opera liquidaciones."), true);

console.log("promoter-panel.verify: ok");
