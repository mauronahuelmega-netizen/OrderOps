/**
 * Source contracts for ADMIN-MOBILE-DRAWER-BACKDROP-FOCUS-POLISH-1.
 *
 * Run: npx tsx lib/orders/admin-mobile-drawer-backdrop-focus.verify.ts
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
      `${relativePath} must not contain backdrop-focus polish leakage (${token})`
    );
  }
}

const drawerCss = read("components/admin/admin-mobile-drawer.css");
const drawerTsx = read("components/admin/admin-mobile-drawer.tsx");

assert.equal(
  drawerCss.includes(".admin-mobile-drawer-overlay"),
  true,
  "Backdrop/overlay selector must remain"
);
assert.equal(
  drawerCss.includes("admin-mobile-drawer-overlay") &&
    drawerTsx.includes("admin-mobile-drawer-overlay"),
  true,
  "Overlay class must exist in CSS and TSX"
);

assert.equal(
  drawerCss.includes("--drawer-width: min(78vw, 340px)"),
  true,
  "Approved compact drawer width must remain unchanged"
);
assert.equal(
  drawerCss.includes("min(88vw, 360px)"),
  false,
  "Must not regress to prior near-full width"
);

assert.equal(
  /--drawer-overlay:\s*rgba\(15,\s*23,\s*42,\s*0\.(3[8-9]|4[0-8])\)/.test(drawerCss) ||
    drawerCss.includes("--drawer-overlay: rgba(15, 23, 42, 0.48)"),
  true,
  "Light scrim must be in approved ~0.38–0.48 range"
);
assert.equal(
  /--drawer-overlay:\s*rgba\(2,\s*6,\s*23,\s*0\.(5[6-9]|6[0-4])\)/.test(drawerCss) ||
    drawerCss.includes("--drawer-overlay: rgba(2, 6, 23, 0.64)"),
  true,
  "Dark scrim must be in approved ~0.56–0.64 range"
);

assert.equal(
  drawerCss.includes(".admin-mobile-drawer-portal") &&
    drawerCss.includes("--drawer-overlay"),
  true,
  "Overlay tokens must resolve from portal (sibling of sheet)"
);

assert.equal(
  /admin-mobile-drawer-portal\s*\{[^}]*opacity\s*:/.test(drawerCss),
  false,
  "Must not apply opacity to portal (would dim drawer)"
);
assert.equal(
  /\.admin-mobile-drawer\s*\{[^}]*opacity\s*:/.test(drawerCss),
  false,
  "Must not apply opacity to drawer sheet"
);

assert.equal(
  /backdrop-filter:\s*blur\(\s*([3-9]|\d{2,})px\s*\)/.test(drawerCss) ||
    /-webkit-backdrop-filter:\s*blur\(\s*([3-9]|\d{2,})px\s*\)/.test(drawerCss),
  false,
  "Heavy backdrop-filter blur (3px+) is forbidden"
);
assert.equal(
  /backdrop-filter:\s*blur\(2px\)/.test(drawerCss) ||
    /backdrop-filter:\s*blur\(1px\)/.test(drawerCss) ||
    /backdrop-filter:\s*none/.test(drawerCss),
  true,
  "Backdrop blur must be none or documented 1–2px only"
);

assert.equal(
  drawerTsx.includes("admin-mobile-drawer-overlay"),
  true,
  "Overlay close semantics must remain in TSX"
);
assert.equal(
  drawerTsx.includes("ADMIN_MOBILE_DRAWER_ID"),
  true,
  "Drawer a11y id must remain"
);
assert.equal(
  drawerTsx.includes("Cerrar sesión") && drawerTsx.includes("AdminThemeToggle"),
  true,
  "Logout / theme toggle semantics must remain"
);

const leak = ["rgba(2, 6, 23, 0.64)", "rgba(15, 23, 42, 0.48)", "BACKDROP-FOCUS"];
assertPathUntouched("components/admin/layout/admin-sidebar.tsx", leak);
assertPathUntouched("components/admin/layout/admin-sidebar.module.css", leak);
assertPathUntouched("components/admin/admin-shell.tsx", leak);
assertPathUntouched("components/admin/admin-shell.css", leak);
assertPathUntouched("components/admin/orders/DashboardToolbar.tsx", leak);
assertPathUntouched("components/admin/orders/dashboard-toolbar.module.css", leak);
assertPathUntouched("components/admin/layout/admin-footer.tsx", leak);
assertPathUntouched("components/admin/layout/admin-footer.module.css", leak);
assertPathUntouched("components/admin/orders/DashboardKanbanBoard.tsx", leak);
assertPathUntouched("app/globals.css", leak);
assertPathUntouched("app/theme-tokens.css", leak);

assert.equal(fs.existsSync(path.join(root, "supabase/migrations")), true);

console.log("PASS: admin-mobile-drawer-backdrop-focus.verify.ts");
