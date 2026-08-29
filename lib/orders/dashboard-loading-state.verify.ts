import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function verifyLoadingStateSourceContracts() {
  const root = process.cwd();

  // 1. Verify components/admin/admin-shell.tsx
  const shellPath = path.join(root, "components", "admin", "admin-shell.tsx");
  const shellSource = fs.readFileSync(shellPath, "utf8");

  assert.equal(
    shellSource.includes("Cargando configuración"),
    false,
    "admin-shell.tsx must not contain 'Cargando configuración'"
  );
  assert.equal(
    shellSource.includes("Cargando configuracion"),
    false,
    "admin-shell.tsx must not contain 'Cargando configuracion'"
  );
  assert.equal(
    shellSource.includes("Cargando panel..."),
    false,
    "admin-shell.tsx must not use 'Cargando panel...' with three dots"
  );
  assert.equal(
    shellSource.includes("Cargando panel…"),
    false,
    "admin-shell.tsx must not use 'Cargando panel…' with single ellipsis symbol in title"
  );
  assert.equal(
    shellSource.includes("Cargando panel"),
    true,
    "admin-shell.tsx must contain main title 'Cargando panel'"
  );
  assert.equal(
    shellSource.includes("Un momento…"),
    true,
    "admin-shell.tsx must contain subtitle 'Un momento…'"
  );
  assert.equal(
    shellSource.includes('role="status"'),
    true,
    "admin-shell.tsx loading state must have role='status' for accessibility"
  );
  assert.equal(
    shellSource.includes('aria-live="polite"'),
    true,
    "admin-shell.tsx loading state must have aria-live='polite'"
  );
  assert.equal(
    shellSource.includes('aria-busy="true"'),
    true,
    "admin-shell.tsx loading state must have aria-busy='true'"
  );

  // 2. Verify components/admin/admin-shell.css
  const shellCssPath = path.join(root, "components", "admin", "admin-shell.css");
  const shellCssSource = fs.readFileSync(shellCssPath, "utf8");

  assert.equal(
    shellCssSource.includes(".admin-shell.admin-shell--loading") ||
      shellCssSource.includes(".admin-shell--loading"),
    true,
    "admin-shell.css must declare .admin-shell--loading"
  );
  assert.equal(
    shellCssSource.includes("grid-template: 1fr / 1fr"),
    true,
    "admin-shell.css loading must use grid-template: 1fr / 1fr to reset multi-column layout"
  );
  assert.equal(
    shellCssSource.includes("place-items: center"),
    true,
    "admin-shell.css loading must use place-items: center"
  );
  assert.equal(
    shellCssSource.includes("min-height: 100dvh"),
    true,
    "admin-shell.css loading must declare min-height: 100dvh"
  );
  assert.equal(
    shellCssSource.includes("align-self: center"),
    true,
    "admin-shell.css loading content must declare align-self: center"
  );
  assert.equal(
    shellCssSource.includes("justify-self: center"),
    true,
    "admin-shell.css loading content must declare justify-self: center"
  );
  assert.equal(
    shellCssSource.includes(".admin-shell__loading-spinner"),
    true,
    "admin-shell.css must declare .admin-shell__loading-spinner"
  );
  assert.equal(
    shellCssSource.includes(".admin-shell__loading-title"),
    true,
    "admin-shell.css must declare .admin-shell__loading-title"
  );
  assert.equal(
    shellCssSource.includes(".admin-shell__loading-subtitle"),
    true,
    "admin-shell.css must declare .admin-shell__loading-subtitle"
  );
  assert.equal(
    shellCssSource.includes("clamp(44px, 11vw, 56px)"),
    true,
    "admin-shell.css spinner must scale to clamp(44px, 11vw, 56px)"
  );
  assert.equal(
    shellCssSource.includes("border:") || shellCssSource.includes("border-top-color:"),
    true,
    "admin-shell.css spinner must use restored border/ring technique"
  );
  assert.equal(
    shellCssSource.includes("conic-gradient"),
    false,
    "admin-shell.css spinner must NOT use conic-gradient"
  );
  assert.equal(
    shellCssSource.includes("-webkit-mask"),
    false,
    "admin-shell.css spinner must NOT use -webkit-mask"
  );
  assert.equal(
    shellCssSource.includes("radial-gradient"),
    false,
    "admin-shell.css spinner must NOT use radial-gradient mask"
  );
  assert.equal(
    shellCssSource.includes("prefers-reduced-motion"),
    true,
    "admin-shell.css loading must include prefers-reduced-motion support"
  );

  // 3. Verify route-specific dashboard loading was deleted to prevent double flash
  const routeLoadingPath = path.join(root, "app", "admin", "(protected)", "dashboard", "loading.tsx");
  assert.equal(
    fs.existsSync(routeLoadingPath),
    false,
    "app/admin/(protected)/dashboard/loading.tsx must NOT exist"
  );

  const routeLoadingCssPath = path.join(
    root,
    "app",
    "admin",
    "(protected)",
    "dashboard",
    "dashboard-loading.module.css"
  );
  assert.equal(
    fs.existsSync(routeLoadingCssPath),
    false,
    "dashboard-loading.module.css must NOT exist"
  );

  // 4. Verify AdminPageLayout, dashboard/page.tsx, globals.css and theme-tokens.css untouched
  const adminPageLayoutPath = path.join(root, "components", "admin", "admin-page-layout.tsx");
  const adminPageLayoutSource = fs.readFileSync(adminPageLayoutPath, "utf8");
  assert.equal(
    adminPageLayoutSource.includes("admin-shell__loading"),
    false,
    "AdminPageLayout must remain untouched"
  );

  const globalsPath = path.join(root, "app", "globals.css");
  const globalsSource = fs.readFileSync(globalsPath, "utf8");
  assert.equal(
    globalsSource.includes(".admin-shell__loading-title"),
    false,
    "app/globals.css must remain untouched"
  );

  const tokensPath = path.join(root, "app", "theme-tokens.css");
  const tokensSource = fs.readFileSync(tokensPath, "utf8");
  assert.equal(
    tokensSource.includes(".admin-shell__loading-title"),
    false,
    "app/theme-tokens.css must remain untouched"
  );
}

function run() {
  verifyLoadingStateSourceContracts();
  console.log("PASS: dashboard-loading-state.verify.ts");
}

run();
