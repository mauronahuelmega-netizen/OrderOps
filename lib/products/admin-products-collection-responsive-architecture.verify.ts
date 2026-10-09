/**
 * Verify ADMIN-PRODUCTS-COLLECTION-RESPONSIVE-ARCHITECTURE-1
 * (PROD-P2-2, PROD-P2-7 pagination, PROD-P3-1, PROD-P3-2 collection-only).
 *
 * Run: npx tsx lib/products/admin-products-collection-responsive-architecture.verify.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

const views = read("components/admin/products/product-catalog-views.tsx");
const viewsCss = read("components/admin/products/product-catalog-views.module.css");
const hook = read("components/admin/products/use-products-desktop-collection.ts");
const grid = read("components/admin/products/product-grid-server.tsx");
const gridCss = read("components/admin/products/product-grid.module.css");
const table = read("components/admin/products/product-table-view.tsx");
const card = read("components/admin/products/product-card.tsx");
const pagination = read("components/admin/products/product-pagination.tsx");
const adminProducts = read("lib/products/admin.ts");

// A/B — single active tree driven by canonical 900px media query
assert.ok(
  views.includes("useProductsDesktopCollection"),
  "collection owner must use the desktop media-query hook"
);
assert.ok(
  /isDesktopCollection\s*\?\s*\([\s\S]*ProductTableView[\s\S]*:\s*\([\s\S]*ProductGridServer/.test(
    views
  ) ||
    /isDesktopCollection\s*\?[\s\S]*ProductTableView[\s\S]*:[\s\S]*ProductGridServer/.test(views),
  "exactly one of table/grid must render via ternary"
);
assert.ok(!views.includes("desktopOnly"), "CSS dual-mount desktopOnly wrapper must be gone");
assert.ok(!views.includes("mobileOnly"), "CSS dual-mount mobileOnly wrapper must be gone");
assert.ok(
  !viewsCss.includes("display: none") && !viewsCss.includes("display:none"),
  "collection views CSS must not hide a second tree"
);

assert.ok(
  hook.includes('(min-width: 900px)') || hook.includes('(min-width:900px)'),
  "canonical media query must be min-width 900px"
);
assert.equal(
  (hook.match(/min-width:\s*900px/g) || []).length,
  1,
  "hook should define the 900px query once"
);

// C — deterministic server snapshot (mobile-first false)
assert.ok(
  /getServerSnapshot[\s\S]*return false/.test(hook),
  "server snapshot must be deterministic mobile (false)"
);
assert.ok(
  hook.includes("useSyncExternalStore"),
  "must use useSyncExternalStore for hydration-safe subscription"
);

// D/E — no window.innerWidth in render path; no suppressHydrationWarning
for (const [label, source] of [
  ["views", views],
  ["hook", hook],
  ["grid", grid],
  ["table", table]
] as const) {
  assert.ok(
    !/window\.innerWidth/.test(source),
    `${label}: must not read window.innerWidth`
  );
  assert.ok(
    !/suppressHydrationWarning/.test(source),
    `${label}: must not use suppressHydrationWarning`
  );
}

// F — no dual display:none wrappers remaining for collection switch
assert.ok(!/\.desktopOnly/.test(viewsCss), "desktopOnly class removed");
assert.ok(!/\.mobileOnly/.test(viewsCss), "mobileOnly class removed");

// G — mobile grid: 1 col default, 2 cols from 720
assert.ok(
  /\.cardGrid\s*\{[^}]*grid-template-columns:\s*1fr/.test(gridCss),
  "default cardGrid must be one column"
);
assert.ok(
  /@media\s*\(\s*min-width:\s*720px\s*\)\s*\{[\s\S]*?\.cardGrid\s*\{[\s\S]*?repeat\(\s*2\s*,/.test(
    gridCss
  ),
  "720px+ must enable two columns"
);
assert.ok(
  !/@media\s*\(\s*min-width:\s*480px\s*\)\s*\{[\s\S]*?\.cardGrid\s*\{[\s\S]*?repeat\(\s*2/.test(
    gridCss
  ),
  "obsolete 480px two-column rule must be gone"
);
// The 768–899 band must not force cardGrid back to a single column
const tabletBand = gridCss.match(
  /@media\s*\(\s*min-width:\s*768px\s*\)\s+and\s*\(\s*max-width:\s*899px\s*\)\s*\{([\s\S]*?)\n\}/
);
if (tabletBand) {
  assert.ok(
    !/\.cardGrid\s*\{[^}]*grid-template-columns:\s*1fr/.test(tabletBand[1]),
    "768–899 must not override cardGrid back to one column"
  );
}

// H — desktop table begins at 900 via the hook (not CSS dual mount)
assert.ok(views.includes("ProductTableView"), "desktop table renderer retained");
assert.ok(views.includes("ProductGridServer"), "mobile card renderer retained");

// I — shared single pagination owner in catalog views
assert.ok(
  views.includes("ProductPagination"),
  "catalog views must own ProductPagination"
);
assert.equal(
  (views.match(/<ProductPagination/g) || []).length,
  1,
  "exactly one ProductPagination instance in the collection owner"
);
assert.ok(
  !grid.includes("ProductPagination"),
  "grid must not mount its own pagination"
);
assert.ok(
  !table.includes("ProductPagination"),
  "table must not mount its own pagination"
);

// J — page size / URL-driven pagination unchanged
assert.ok(
  /ADMIN_PRODUCTS_PAGE_SIZE/.test(adminProducts),
  "ADMIN_PRODUCTS_PAGE_SIZE must remain in admin products loader"
);
assert.ok(
  pagination.includes('params.set("page"') || pagination.includes("params.set(\"page\""),
  "pagination must remain URL-driven via search params"
);
assert.ok(
  pagination.includes("useSearchParams"),
  "pagination must read current URL search params"
);

// K — ProductCard interaction semantics preserved
assert.ok(/role=["']button["']/.test(card), "ProductCard role=button preserved");
assert.ok(/aria-label=/.test(card), "ProductCard aria-label preserved");
assert.ok(/onKeyDown/.test(card), "ProductCard keyboard handler preserved");

// L — no client data fetch introduced by breakpoint handling
assert.ok(!/fetch\s*\(/.test(hook), "hook must not fetch");
assert.ok(!/getAdminProducts/.test(views), "views must not re-query products");
assert.ok(!/useEffect/.test(hook), "hook should not use useEffect for media (useSyncExternalStore)");

console.log("admin-products-collection-responsive-architecture.verify.ts: PASS");
