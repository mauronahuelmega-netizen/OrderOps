/**
 * Verify ADMIN-PRODUCTS-MOBILE-MAIN-SURFACE-HARD-VISUAL-POLISH-1
 *
 * Run: npx tsx lib/products/admin-products-mobile-main-surface-hard-visual-polish.verify.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

const header = read("components/admin/products/products-header-actions.tsx");
const headerCss = read("components/admin/products/products-header-actions.module.css");
const toolbar = read("components/admin/products/products-toolbar.tsx");
const toolbarCss = read("components/admin/products/products-toolbar.module.css");
const grid = read("components/admin/products/product-grid-server.tsx");
const gridCss = read("components/admin/products/product-grid.module.css");
const card = read("components/admin/products/product-card.tsx");
const views = read("components/admin/products/product-catalog-views.tsx");
const hook = read("components/admin/products/use-products-desktop-collection.ts");
const previewShared = read("lib/admin/catalog-preview-shared.ts");

// A — canonical 900 breakpoint preserved
assert.ok(
  hook.includes("(min-width: 900px)") && hook.includes("useSyncExternalStore"),
  "collection architecture must remain 900px"
);
assert.ok(!views.includes("desktopOnly") && !views.includes("mobileOnly"), "no dual-mount wrappers");

// B — desktop preview affordance preserved
assert.ok(header.includes('href="/admin/products/preview"'), "desktop preview route preserved");
assert.ok(header.includes("Vista previa del catálogo"), "desktop preview label preserved");
assert.ok(headerCss.includes("previewDesktop"), "desktop preview CSS owner exists");

// C — mobile public catalog affordance (real route, no preview flag)
assert.ok(header.includes("buildPublicCatalogPath"), "mobile catalog uses canonical helper");
assert.ok(
  previewShared.includes("export function buildPublicCatalogPath"),
  "canonical public path helper must exist"
);
assert.ok(header.includes("Abrir catálogo"), "mobile Abrir catálogo label present");
assert.ok(header.includes('target="_blank"'), "public catalog opens in new tab");
assert.ok(header.includes('rel="noopener noreferrer"'), "noopener noreferrer required");
assert.ok(headerCss.includes("catalogMobile"), "mobile catalog CSS owner exists");
assert.ok(
  /href=\{publicCatalogPath\}[\s\S]{0,220}catalogMobile|catalogMobile[\s\S]{0,220}href=\{publicCatalogPath\}/.test(
    header
  ),
  "mobile Abrir catálogo must bind href={publicCatalogPath}"
);

// Mobile public href must come from buildPublicCatalogPath, not preview builder / query flag
assert.ok(
  !/buildCatalogPreviewPath/.test(header),
  "header must not use preview path builder for Abrir catálogo"
);
assert.ok(
  !/orderopsPreview/.test(header),
  "mobile Abrir catálogo must not inject orderopsPreview"
);
assert.ok(
  !/styles\.catalogMobile[\s\S]{0,400}href="\/admin\/products\/preview"/.test(header) &&
    !/href="\/admin\/products\/preview"[\s\S]{0,400}styles\.catalogMobile/.test(header),
  "mobile Abrir catálogo must not point at admin preview"
);

// CSS-switched visibility at 899
assert.ok(
  /@media\s*\(\s*max-width:\s*899px\s*\)/.test(headerCss),
  "mobile header treatment at max-width 899"
);
assert.ok(
  headerCss.includes("previewDesktop") &&
    /previewDesktop[\s\S]*display:\s*none/.test(headerCss.replace(/\s+/g, " ")),
  "preview hidden on mobile"
);
assert.ok(
  /catalogMobile[\s\S]*display:\s*none/.test(headerCss.replace(/\s+/g, " ")),
  "public catalog link hidden on desktop by default"
);

// D — 3-column mobile secondary actions
assert.ok(
  /grid-template-columns:\s*repeat\(\s*3\s*,\s*minmax\(\s*0\s*,\s*1fr\s*\)\s*\)/.test(headerCss),
  "mobile secondary actions must be 3 equal columns"
);

// E — mobile filters: 3-column native select row
assert.ok(
  /grid-template-columns:\s*repeat\(\s*3\s*,\s*minmax\(\s*0\s*,\s*1fr\s*\)\s*\)/.test(toolbarCss),
  "mobile filters must be 3-column grid"
);
assert.ok(
  (toolbar.match(/<select/g) || []).length >= 3,
  "three native selects required"
);
assert.ok(!/Popover|Combobox|Listbox|dropdown-menu/i.test(toolbar), "no custom select replacement");
assert.ok(toolbar.includes('type="search"'), "search remains native input");
assert.ok(toolbar.includes("300"), "search debounce preserved");
assert.ok(toolbar.includes('params.delete("page")'), "filter change resets page");

// F — mobile summary dedupe
assert.ok(
  /@media\s*\(\s*max-width:\s*899px\s*\)[\s\S]*\.summary[\s\S]*display:\s*none/.test(toolbarCss),
  "mobile must hide redundant toolbar summary"
);
assert.ok(toolbar.includes("catalogTotalCount"), "desktop summary still owned by toolbar");
assert.ok(grid.includes("Catálogo") && grid.includes("activos"), "rich catalog metrics preserved");

// G — Por categorías redundant on mobile
assert.ok(grid.includes("Por categorías"), "subtitle remains in markup for desktop");
assert.ok(
  /@media\s*\(\s*max-width:\s*899px\s*\)[\s\S]*\.catalogSubtitle[\s\S]*display:\s*none/.test(
    gridCss
  ),
  "Por categorías hidden on mobile"
);

// H — touch >=44px (2.75rem)
assert.ok(headerCss.includes("min-height: 2.75rem"), "header touch >=44");
assert.ok(toolbarCss.includes("min-height: 2.75rem"), "toolbar touch >=44");
assert.ok(!/min-height:\s*2\.25rem/.test(toolbarCss), "toolbar must not shrink below 44");

// I — copy-link accessible feedback
assert.ok(
  /role=["']status["']/.test(header) && /aria-live=["']polite["']/.test(header),
  "copy success must use polite live status"
);
assert.ok(header.includes("Link del catálogo público copiado") || header.includes("copiado"), "copy announcement copy exists");

// J — ProductCard architecture not rewritten
assert.ok(card.includes("ProductAvailabilityToggle"), "card availability preserved");
assert.ok(card.includes("Gestionar") || card.includes("linkHint"), "card manage affordance preserved");
assert.ok(card.includes('role="button"'), "card keyboard edit contract preserved");

// K — no form/modal owners in this verify scope (sanity: files still exist untouched by intent)
assert.ok(
  !header.includes("optimizeProductImage") && !toolbar.includes("optimizeProductImage"),
  "image optimizer out of scope"
);

console.log("admin-products-mobile-main-surface-hard-visual-polish.verify.ts: PASS");
