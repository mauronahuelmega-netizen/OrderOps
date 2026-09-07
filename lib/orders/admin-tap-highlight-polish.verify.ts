/**
 * Source contracts for ADMIN-TAP-HIGHLIGHT-POLISH-1.
 *
 * Run: npx tsx lib/orders/admin-tap-highlight-polish.verify.ts
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
      `${relativePath} must not contain tap-highlight polish leakage (${token})`
    );
  }
}

const shellCss = read("components/admin/admin-shell.css");
const globalsCss = read("app/globals.css");
const themeTokens = read("app/theme-tokens.css");
const drawerCss = read("components/admin/admin-mobile-drawer.css");
const drawerTsx = read("components/admin/admin-mobile-drawer.tsx");

assert.equal(
  shellCss.includes("-webkit-tap-highlight-color: transparent"),
  true,
  "Admin shell CSS must neutralize tap highlight"
);
assert.equal(
  shellCss.includes("html:has(.admin-shell)") || shellCss.includes(".admin-shell"),
  true,
  "Tap highlight reset must be scoped to admin root"
);
assert.equal(
  shellCss.includes("html:has(.admin-shell)"),
  true,
  "Prefer html:has(.admin-shell) so body portals are covered"
);
assert.equal(
  shellCss.includes("-webkit-tap-highlight-color: transparent"),
  true,
  "Admin shell CSS must neutralize tap highlight"
);
/* Media query optional; admin-wide scoped reset is accepted when touch MQ is unreliable. */
assert.equal(
  shellCss.includes("outline: none") === false ||
    !/html:has\(\.admin-shell\)[\s\S]{0,800}outline:\s*none/.test(shellCss),
  true,
  "Must not remove outlines near tap-highlight block"
);
assert.equal(
  shellCss.includes("user-select: none") || shellCss.includes("-webkit-user-select: none"),
  false,
  "Must not add admin-wide user-select: none"
);
assert.equal(
  /:focus\s*\{[^}]*outline:\s*none/.test(shellCss),
  false,
  "Must not kill :focus outlines in admin-shell.css"
);

assert.equal(
  globalsCss.includes("html:has(.admin-shell)"),
  false,
  "globals must not own admin html:has(.admin-shell) tap reset"
);
assert.equal(
  globalsCss.includes(".public-business-layout") &&
    globalsCss.includes("-webkit-tap-highlight-color: transparent"),
  true,
  "Public catalog tap polish must remain in its own scoped rule"
);
assert.equal(
  themeTokens.includes("-webkit-tap-highlight-color"),
  false,
  "theme-tokens must not own tap highlight"
);

assert.equal(
  drawerCss.includes("--drawer-width: min(78vw, 340px)"),
  true,
  "Drawer width frozen"
);
assert.equal(
  drawerCss.includes("rgba(15, 23, 42, 0.48)") &&
    drawerCss.includes("rgba(2, 6, 23, 0.64)") &&
    drawerCss.includes("blur(2px)"),
  true,
  "Drawer backdrop/blur frozen"
);
assert.equal(
  drawerCss.includes("translate3d") && drawerTsx.includes("DRAWER_CLOSE_MS"),
  true,
  "Drawer motion frozen"
);
assert.equal(
  drawerCss.includes("ADMIN-TAP-HIGHLIGHT") ||
    drawerTsx.includes("ADMIN-TAP-HIGHLIGHT"),
  false,
  "Drawer files should not own this phase"
);

assertPathUntouched("components/public/catalog/catalog-client.tsx", [
  "html:has(.admin-shell)"
]);
assertPathUntouched("components/public/business/public-business-header.tsx", [
  "html:has(.admin-shell)"
]);
assertPathUntouched("lib/orders/natural-search.ts", [
  "html:has(.admin-shell)",
  "ADMIN-TAP-HIGHLIGHT-POLISH-1"
]);
assertPathUntouched("lib/orders/analytics.ts", [
  "html:has(.admin-shell)",
  "ADMIN-TAP-HIGHLIGHT-POLISH-1"
]);
assertPathUntouched("components/admin/orders/DashboardKanbanBoard.tsx", [
  "html:has(.admin-shell)"
]);
assertPathUntouched("app/theme-tokens.css", ["-webkit-tap-highlight-color"]);

assert.equal(
  fs.existsSync(path.join(root, "components/admin/admin-shell.css")),
  true
);

console.log("PASS: admin-tap-highlight-polish.verify.ts");
