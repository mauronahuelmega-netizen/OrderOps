/**
 * Source contracts for ADMIN-MOBILE-DRAWER-WIDTH-DENSITY-POLISH-1.
 *
 * Run: npx tsx lib/orders/admin-mobile-drawer-width-density.verify.ts
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
      `${relativePath} must not contain drawer-width polish leakage (${token})`
    );
  }
}

const drawerCss = read("components/admin/admin-mobile-drawer.css");
const drawerTsx = read("components/admin/admin-mobile-drawer.tsx");

assert.equal(
  drawerCss.includes("min(88vw, 360px)"),
  false,
  "Primary drawer width must no longer use min(88vw, 360px)"
);
assert.equal(
  drawerCss.includes("min(88vw, 420px)"),
  false,
  "Tablet drawer override must no longer use min(88vw, 420px)"
);
assert.equal(
  drawerCss.includes("--drawer-width: min(78vw, 340px)"),
  true,
  "Primary drawer width must be min(78vw, 340px)"
);
assert.equal(
  drawerCss.includes("--drawer-width: min(78vw, 360px)") ||
    drawerCss.includes("--drawer-width: min(78vw, 340px)"),
  true,
  "Drawer must keep an approved compact vw/cap formula"
);
assert.equal(
  drawerCss.includes("--drawer-row-min-height: 44px"),
  true,
  "Tap-row min height contract (≥40px / 44px) must remain"
);
assert.equal(
  drawerCss.includes("admin-mobile-drawer-overlay") ||
    drawerCss.includes(".admin-mobile-drawer-overlay"),
  true,
  "Overlay styles must remain"
);
assert.equal(
  drawerCss.includes("admin-mobile-drawer-portal") ||
    drawerCss.includes(".admin-mobile-drawer-portal"),
  true,
  "Portal styles must remain"
);
assert.equal(
  drawerTsx.includes("admin-mobile-drawer-portal"),
  true,
  "Drawer TSX must retain portal mount"
);
assert.equal(
  drawerTsx.includes("admin-mobile-drawer-overlay"),
  true,
  "Drawer TSX must retain overlay"
);
assert.equal(
  drawerTsx.includes("ADMIN_MOBILE_DRAWER_ID"),
  true,
  "Drawer close/aria semantics id must remain"
);

const leak = ["min(78vw, 340px)", "--drawer-width: min(78vw"];
assertPathUntouched("components/admin/layout/admin-sidebar.tsx", leak);
assertPathUntouched("components/admin/layout/admin-sidebar.module.css", leak);
assertPathUntouched("components/admin/admin-shell.tsx", leak);
assertPathUntouched("components/admin/admin-shell.css", leak);
assertPathUntouched("components/admin/orders/DashboardToolbar.tsx", leak);
assertPathUntouched("components/admin/orders/dashboard-toolbar.module.css", leak);
assertPathUntouched("components/admin/layout/admin-footer.tsx", leak);
assertPathUntouched("components/admin/layout/admin-footer.module.css", leak);
assertPathUntouched("components/admin/orders/DashboardKanbanBoard.tsx", leak);
assertPathUntouched("components/admin/orders/dashboard-kanban.module.css", leak);
assertPathUntouched("lib/orders/natural-search.ts", leak);
assertPathUntouched("lib/orders/analytics.ts", leak);
assertPathUntouched("app/globals.css", leak);
assertPathUntouched("app/theme-tokens.css", leak);

assert.equal(
  fs.existsSync(path.join(root, "components/admin/layout/admin-sidebar.module.css")),
  true,
  "Desktop sidebar CSS must remain present"
);

console.log("PASS: admin-mobile-drawer-width-density.verify.ts");
