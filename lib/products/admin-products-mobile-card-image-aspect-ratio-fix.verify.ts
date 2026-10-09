/**
 * Verify ADMIN-PRODUCTS-MOBILE-CARD-IMAGE-ASPECT-RATIO-FIX-1
 * (reconciled for ADMIN-PRODUCTS-CARD-IMAGE-SCALE-POLISH-1 height-derived square)
 *
 * Run: npx tsx lib/products/admin-products-mobile-card-image-aspect-ratio-fix.verify.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function cssBlock(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  assert.ok(match, `missing CSS block ${selector}`);
  return match[1] ?? "";
}

const cardCss = read("components/admin/products/product-card.module.css");
const card = read("components/admin/products/product-card.tsx");
const table = read("components/admin/products/product-table-view.tsx");
const hook = read("components/admin/products/use-products-desktop-collection.ts");
const views = read("components/admin/products/product-catalog-views.tsx");
const theme = read("app/theme-tokens.css");
const globals = read("app/globals.css");

const media = cssBlock(cardCss, ".media");
const imageShell = cssBlock(cardCss, ".imageShell");
const image = cssBlock(cardCss, ".image");

// A — media owns durable square 1:1 (height-derived stretch is ALLOWED)
assert.ok(
  /aspect-ratio:\s*1\s*\/\s*1/.test(media),
  "media frame must declare aspect-ratio 1 / 1"
);
assert.ok(
  /max-width:/.test(media) && /max-height:/.test(media),
  "media must keep max-* bounds for the height-derived square"
);
// align-self: stretch is an accepted sizing strategy (card-scale polish) — do not forbid.

// B — imageShell fills the square media frame
assert.ok(
  /inset:\s*0/.test(imageShell) || (/width:\s*100%/.test(imageShell) && /height:\s*100%/.test(imageShell)),
  "imageShell must fill the square media frame"
);

// C — cover, not contain / not distort via fit mode
assert.ok(/object-fit:\s*cover/.test(image), "image must use object-fit: cover");
assert.ok(!/object-fit:\s*contain/.test(cardCss), "must not introduce object-fit: contain");

// D — no image pipeline change in card TSX for this phase intent
assert.ok(card.includes('from "next/image"'), "still uses Next/Image");
assert.ok(card.includes("getSupabaseImageLoader"), "loader wiring preserved");
assert.ok(card.includes("fill"), "fill layout preserved");

// E — architecture freeze
assert.ok(
  hook.includes("(min-width: 900px)") && hook.includes("useSyncExternalStore"),
  "900px collection architecture untouched"
);
assert.ok(views.includes("ProductPagination"), "pagination owner remains in catalog views");
assert.ok(!views.includes("desktopOnly"), "no dual-mount regression");

// F — operational fields remain
assert.ok(card.includes("SKU"), "SKU remains");
assert.ok(card.includes("track_stock") || card.includes("Stock"), "stock remains");
assert.ok(card.includes("ProductAvailabilityToggle"), "availability remains");

// G — card interaction contract
assert.ok(
  card.includes('role="button"') && card.includes("onKeyDown") && card.includes("openEditProduct"),
  "card edit interaction remains"
);

// H — no global CSS / theme churn markers for this phase
assert.ok(!theme.includes("PRODUCT-CARD-IMAGE-ASPECT"), "theme tokens untouched by phase marker");
assert.ok(!globals.includes("product-card-image-aspect"), "globals untouched by phase marker");

// I — ProductTableView image styling untouched (no aspect-ratio patch there)
assert.ok(
  !/aspect-ratio:\s*1/.test(table),
  "table view source must not receive this ProductCard aspect patch"
);

console.log("admin-products-mobile-card-image-aspect-ratio-fix.verify.ts: PASS");
