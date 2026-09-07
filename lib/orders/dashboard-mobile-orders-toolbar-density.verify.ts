/**
 * Deterministic source contracts for ADMIN-DASHBOARD-MOBILE-ORDERS-TOOLBAR-DENSITY-POLISH-1.
 *
 * Run: npx tsx lib/orders/dashboard-mobile-orders-toolbar-density.verify.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assertFileUnchangedIntent(relativePath: string, forbiddenSnippets: string[]) {
  const source = read(relativePath);
  for (const snippet of forbiddenSnippets) {
    assert.equal(
      source.includes(snippet),
      false,
      `${relativePath} must not contain toolbar-density polish leakage: ${snippet}`
    );
  }
}

const toolbarTsx = read("components/admin/orders/DashboardToolbar.tsx");
const toolbarCss = read("components/admin/orders/dashboard-toolbar.module.css");

assert.equal(
  toolbarTsx.includes("sessionMetaRow"),
  true,
  "DashboardToolbar must expose sessionMetaRow for mobile session+close composition"
);
assert.equal(
  toolbarTsx.includes("sessionActionsRow"),
  true,
  "DashboardToolbar must expose sessionActionsRow for + Pedido + sync composition"
);
assert.equal(
  toolbarTsx.includes('variant="secondary"'),
  true,
  "Session and manual order buttons must remain secondary variants"
);
assert.equal(
  toolbarTsx.includes("sessionButtonDanger"),
  true,
  "Close-session danger styling must remain"
);
assert.equal(
  toolbarTsx.includes("OperationalSearch"),
  true,
  "Operational search must remain in the toolbar"
);
assert.equal(
  toolbarTsx.includes("filterCluster"),
  true,
  "Filter/tabs cluster must remain in the toolbar"
);
assert.equal(
  toolbarTsx.includes("onOpenStoreSession"),
  true,
  "Open session handler wiring must remain"
);
assert.equal(
  toolbarTsx.includes("onCloseStoreSession"),
  true,
  "Close session handler wiring must remain"
);
assert.equal(
  toolbarTsx.includes("onManualOperationalResync"),
  true,
  "Refresh/sync handler wiring must remain"
);
assert.equal(
  toolbarTsx.includes("onCreateManualOrder"),
  true,
  "Manual order handler wiring must remain"
);

assert.equal(
  toolbarCss.includes("@media (max-width: 768px)"),
  true,
  "CSS must keep mobile polish boundary at max-width: 768px"
);
assert.equal(
  toolbarCss.includes("@media (min-width: 769px)"),
  true,
  "CSS must preserve desktop/tablet branch at min-width: 769px"
);
assert.equal(
  toolbarCss.includes("display: contents"),
  true,
  "Desktop must dissolve mobile wrappers via display: contents"
);
assert.equal(
  /@media \(max-width: 768px\)[\s\S]*\.sessionMetaRow[\s\S]*display:\s*flex/.test(toolbarCss),
  true,
  "Mobile sessionMetaRow must become a real flex row"
);
assert.equal(
  /@media \(max-width: 768px\)[\s\S]*\.sessionActionsRow[\s\S]*display:\s*flex/.test(toolbarCss),
  true,
  "Mobile sessionActionsRow must become a real flex row"
);
assert.equal(
  /@media \(max-width: 768px\)[\s\S]*\.sessionButton[\s\S]*width:\s*auto/.test(toolbarCss),
  true,
  "Mobile session button must not be full-width (width: auto)"
);
assert.equal(
  toolbarCss.includes("sessionButtonDanger"),
  true,
  "Danger session button styling must remain in CSS"
);

const mobileBlock = toolbarCss.match(/@media \(max-width: 768px\) \{[\s\S]*?\n\}(?=\n\n\/\* Tablet)/)?.[0] ?? "";
assert.equal(mobileBlock.length > 0, true, "Must isolate a mobile max-width 768 block");
assert.equal(
  /width:\s*100%/.test(mobileBlock.match(/\.sessionButton\s*\{[\s\S]*?\}/)?.[0] ?? ""),
  false,
  "Mobile .sessionButton must not be width: 100% / full-width"
);
assert.equal(
  /background:\s*var\(--accent|variant:\s*primary/.test(
    mobileBlock.match(/\.sessionButton\s*\{[\s\S]*?\}/)?.[0] ?? ""
  ),
  false,
  "Mobile .sessionButton must not gain primary accent background"
);

assertFileUnchangedIntent("lib/orders/natural-search.ts", ["sessionMetaRow", "sessionActionsRow"]);
assertFileUnchangedIntent("lib/orders/dashboard-board-view-model.ts", [
  "sessionMetaRow",
  "sessionActionsRow"
]);
assertFileUnchangedIntent("components/admin/orders/DashboardKanbanBoard.tsx", [
  "sessionMetaRow",
  "sessionActionsRow"
]);
assertFileUnchangedIntent("lib/orders/analytics.ts", ["sessionMetaRow", "sessionActionsRow"]);
assertFileUnchangedIntent("app/globals.css", ["sessionMetaRow", "sessionActionsRow"]);
assertFileUnchangedIntent("app/theme-tokens.css", ["sessionMetaRow", "sessionActionsRow"]);

assert.equal(
  fs.existsSync(path.join(root, "components/admin/admin-mobile-drawer.css")),
  true,
  "Drawer CSS must remain present and untouched by this phase contract"
);

console.log("PASS: dashboard-mobile-orders-toolbar-density.verify.ts");
