/**
 * Source contracts for ADMIN-MOBILE-DRAWER-MOTION-POLISH-1.
 *
 * Run: npx tsx lib/orders/admin-mobile-drawer-motion.verify.ts
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
      `${relativePath} must not contain motion polish leakage (${token})`
    );
  }
}

const drawerCss = read("components/admin/admin-mobile-drawer.css");
const drawerTsx = read("components/admin/admin-mobile-drawer.tsx");

assert.equal(
  drawerCss.includes("translate3d") && drawerCss.includes("transform"),
  true,
  "Sheet motion must use transform on X axis"
);
assert.equal(
  drawerCss.includes("calc(100% + 12px)") || drawerCss.includes("translate3d(100%"),
  true,
  "Closed/closing sheet must sit off to the right"
);
assert.equal(
  drawerCss.includes('data-state="open"') && drawerCss.includes('data-state="closing"'),
  true,
  "CSS must style open and closing motion states"
);
assert.equal(
  drawerCss.includes("transition") &&
    (drawerCss.includes("--drawer-motion-open-duration") ||
      drawerCss.includes("240ms")),
  true,
  "Opening transition duration must exist"
);
assert.equal(
  drawerCss.includes("--drawer-motion-close-duration") || drawerCss.includes("180ms"),
  true,
  "Closing transition duration must exist"
);
assert.equal(
  /transition[^;]*\bwidth\b/.test(drawerCss) === false ||
    drawerCss.includes("transform: translate3d"),
  true,
  "Primary motion must be transform, not width"
);
assert.equal(
  drawerCss.includes("--drawer-width: min(78vw, 340px)"),
  true,
  "Approved compact width must remain"
);
assert.equal(
  drawerCss.includes("--drawer-width: min(78vw, 360px)"),
  true,
  "Tablet width override must remain"
);
assert.equal(
  drawerCss.includes("rgba(15, 23, 42, 0.48)") &&
    drawerCss.includes("rgba(2, 6, 23, 0.64)"),
  true,
  "Approved backdrop rgba tokens must remain"
);
assert.equal(
  /backdrop-filter:\s*blur\(\s*([3-9]|\d{2,})px\s*\)/.test(drawerCss),
  false,
  "Blur must not exceed 2px"
);
assert.equal(
  drawerCss.includes("blur(2px)"),
  true,
  "Approved blur(2px) must remain"
);
assert.equal(
  drawerCss.includes("prefers-reduced-motion"),
  true,
  "Reduced-motion handling required"
);
assert.equal(
  drawerCss.includes(".admin-mobile-drawer-overlay") &&
    /opacity:\s*0/.test(drawerCss) &&
    /\[data-state="open"\][\s\S]*opacity:\s*1/.test(drawerCss),
  true,
  "Overlay fade open/closed must exist"
);

assert.equal(
  drawerTsx.includes("data-state={motionState}") || drawerTsx.includes("data-state={"),
  true,
  "Portal must expose motion data-state"
);
assert.equal(
  drawerTsx.includes("closing") && drawerTsx.includes("DRAWER_CLOSE_MS"),
  true,
  "Delayed unmount / closing timeout required"
);
assert.equal(
  drawerTsx.includes("clearTimeout") || drawerTsx.includes("clearMotionTimers"),
  true,
  "Close timer cleanup required"
);
assert.equal(
  drawerTsx.includes("Escape") &&
    drawerTsx.includes("aria-modal") &&
    drawerTsx.includes('role="dialog"'),
  true,
  "Escape / dialog a11y must remain"
);
assert.equal(
  drawerTsx.includes("ADMIN_DRAWER_OPEN_CLASS") &&
    drawerTsx.includes("menuButtonRef"),
  true,
  "Scroll-lock class and focus-return menu button must remain"
);
assert.equal(
  drawerTsx.includes("framer-motion") || drawerTsx.includes("from \"motion\""),
  false,
  "No external motion library"
);

const leak = ["DRAWER_CLOSE_MS", "data-state={motionState}", "translate3d(calc(100%"];
assertPathUntouched("components/admin/layout/admin-sidebar.tsx", leak);
assertPathUntouched("components/admin/layout/admin-sidebar.module.css", leak);
assertPathUntouched("components/admin/admin-shell.tsx", leak);
assertPathUntouched("components/admin/admin-shell.css", leak);
assertPathUntouched("components/admin/orders/DashboardToolbar.tsx", leak);
assertPathUntouched("components/admin/layout/admin-footer.tsx", leak);
assertPathUntouched("app/globals.css", leak);
assertPathUntouched("app/theme-tokens.css", leak);

console.log("PASS: admin-mobile-drawer-motion.verify.ts");
