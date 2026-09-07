/**
 * Source contracts for ADMIN-MOBILE-FOOTER-SINGLE-LINE-FOLLOWUP-1.
 *
 * Run: npx tsx lib/orders/admin-mobile-footer-single-line.verify.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assertPathUntouched(relativePath: string, leakTokens: string[]) {
  const source = read(relativePath);
  for (const token of leakTokens) {
    assert.equal(
      source.includes(token),
      false,
      `${relativePath} must not contain footer single-line leakage (${token})`
    );
  }
}

const footerTsx = read("components/admin/layout/admin-footer.tsx");
const footerCss = read("components/admin/layout/admin-footer.module.css");
const shellTsx = read("components/admin/admin-shell.tsx");

assert.equal(
  footerCss.includes("@media (max-width: 640px)"),
  true,
  "Mobile footer must remain scoped to max-width: 640px"
);

const mobileBlockMatch = footerCss.match(
  /@media\s*\(\s*max-width:\s*640px\s*\)\s*\{([\s\S]*)$/
);
assert.ok(mobileBlockMatch, "Mobile media query block required");
const mobileBlock = mobileBlockMatch[1];

assert.equal(
  /flex-direction:\s*row/.test(mobileBlock),
  true,
  "Mobile footer must use horizontal flex-direction: row"
);
assert.equal(
  /justify-content:\s*space-between/.test(mobileBlock),
  true,
  "Mobile footer must space brand and meta apart"
);
assert.equal(
  /flex-direction:\s*column/.test(mobileBlock),
  false,
  "Mobile footer must not stack as a column"
);
assert.equal(
  /flex-wrap:\s*nowrap/.test(mobileBlock),
  true,
  "Mobile footer must avoid wrapping to a second line"
);

assert.equal(
  footerTsx.includes("Panel protegido · v1.0") ||
    footerTsx.includes("Panel protegido"),
  true,
  "Compact mobile meta copy required"
);
assert.equal(
  footerTsx.includes("OrderOps") &&
    (footerTsx.includes("getFullYear") || footerTsx.includes("©")),
  true,
  "Brand/year OrderOps copyright required"
);
assert.equal(
  footerTsx.includes("Sistema operativo para pedidos"),
  true,
  "Desktop tagline must remain"
);
assert.equal(
  footerTsx.includes("V1.0 · Panel protegido") ||
    footerTsx.includes('meta = "V1.0'),
  true,
  "Desktop meta must remain"
);
assert.equal(
  footerTsx.includes("metaMobile") && footerCss.includes(".metaMobile"),
  true,
  "Mobile meta span must remain"
);
assert.equal(
  shellTsx.includes("AdminFooter"),
  true,
  "AdminShell must still consume AdminFooter"
);

assert.equal(
  read("components/admin/admin-mobile-drawer.css").includes(
    "--drawer-width: min(78vw, 340px)"
  ),
  true,
  "Drawer width frozen"
);
assert.equal(
  read("components/admin/admin-shell.css").includes(
    "-webkit-tap-highlight-color: transparent"
  ),
  true,
  "Tap highlight polish frozen"
);

const leak = ["flex-direction: row", "ADMIN-MOBILE-FOOTER-SINGLE-LINE"];
assertPathUntouched("components/admin/admin-shell.tsx", [
  "ADMIN-MOBILE-FOOTER-SINGLE-LINE"
]);
assertPathUntouched("components/admin/admin-mobile-drawer.tsx", leak);
assertPathUntouched("components/admin/orders/DashboardToolbar.tsx", leak);
assertPathUntouched("components/admin/orders/DashboardKanbanBoard.tsx", leak);
assertPathUntouched("lib/orders/natural-search.ts", leak);
assertPathUntouched("lib/orders/analytics.ts", leak);
assertPathUntouched("app/globals.css", ["ADMIN-MOBILE-FOOTER-SINGLE-LINE"]);
assertPathUntouched("app/theme-tokens.css", ["ADMIN-MOBILE-FOOTER-SINGLE-LINE"]);
assertPathUntouched("components/public/catalog/catalog-client.tsx", [
  "ADMIN-MOBILE-FOOTER-SINGLE-LINE"
]);

console.log("PASS: admin-mobile-footer-single-line.verify.ts");
