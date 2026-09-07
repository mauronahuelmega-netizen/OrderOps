/**
 * Source contracts for ADMIN-MOBILE-FOOTER-COMPACT-POLISH-1.
 *
 * Run: npx tsx lib/orders/admin-mobile-footer-compact.verify.ts
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
      `${relativePath} must not contain footer-compact leakage (${token})`
    );
  }
}

const footerTsx = read("components/admin/layout/admin-footer.tsx");
const footerCss = read("components/admin/layout/admin-footer.module.css");
const shellTsx = read("components/admin/admin-shell.tsx");

assert.equal(
  footerCss.includes("@media (max-width: 640px)"),
  true,
  "Mobile footer polish must use max-width: 640px breakpoint"
);
assert.equal(
  footerCss.includes(".metaMobile") && footerCss.includes(".metaDesktop"),
  true,
  "Responsive meta spans required"
);
assert.equal(
  footerCss.includes(".tagline") && /display:\s*none/.test(footerCss),
  true,
  "Long tagline must hide on mobile"
);
assert.equal(
  footerTsx.includes("Panel protegido · v1.0") ||
    footerTsx.includes("Panel protegido"),
  true,
  "Compact mobile meta copy required"
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
  footerTsx.includes("getFullYear") || footerTsx.includes("OrderOps"),
  true,
  "Brand/year must remain OrderOps copyright"
);
assert.equal(
  footerTsx.includes("metaMobile") && footerTsx.includes("metaDesktop"),
  true,
  "TSX must expose desktop/mobile meta spans"
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

const leak = ["metaMobile", "Panel protegido · v1.0", "ADMIN-MOBILE-FOOTER"];
assertPathUntouched("components/admin/admin-mobile-drawer.tsx", leak);
assertPathUntouched("components/admin/orders/DashboardToolbar.tsx", leak);
assertPathUntouched("components/admin/orders/DashboardKanbanBoard.tsx", leak);
assertPathUntouched("lib/orders/natural-search.ts", leak);
assertPathUntouched("lib/orders/analytics.ts", leak);
assertPathUntouched("app/globals.css", ["metaMobile"]);
assertPathUntouched("app/theme-tokens.css", ["metaMobile"]);
assertPathUntouched("components/public/catalog/catalog-client.tsx", [
  "metaMobile"
]);

console.log("PASS: admin-mobile-footer-compact.verify.ts");
