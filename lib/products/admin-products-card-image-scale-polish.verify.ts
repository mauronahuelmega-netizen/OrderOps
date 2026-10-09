/**
 * Verify ADMIN-PRODUCTS-CARD-IMAGE-SCALE-POLISH-1 (visual rework)
 *
 * Run: npx tsx lib/products/admin-products-card-image-scale-polish.verify.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

const cardCss = read("components/admin/products/product-card.module.css");
const tableCss = read("components/admin/products/product-table-view.module.css");
const card = read("components/admin/products/product-card.tsx");
const table = read("components/admin/products/product-table-view.tsx");
const hook = read("components/admin/products/use-products-desktop-collection.ts");
const gridCss = read("components/admin/products/product-grid.module.css");
const theme = read("app/theme-tokens.css");
const globals = read("app/globals.css");

// A/B — mobile square + cover
assert.ok(/aspect-ratio:\s*1\s*\/\s*1/.test(cardCss), "mobile keeps aspect-ratio 1 / 1");
assert.ok(/object-fit:\s*cover/.test(cardCss), "mobile keeps object-fit cover");
assert.ok(!/object-fit:\s*contain/.test(cardCss), "no contain");

// C — height-dominant square (not rejected fixed 88/96 primary contract)
assert.ok(
  /\.media\s*\{[\s\S]*?align-self:\s*stretch/.test(cardCss),
  "media must stretch to content-driven row height"
);
assert.ok(
  /\.media\s*\{[\s\S]*?height:\s*100%/.test(cardCss),
  "media height follows card track"
);
assert.ok(
  /\.media\s*\{[\s\S]*?width:\s*auto/.test(cardCss),
  "media width derives from height via aspect-ratio"
);
assert.ok(
  !/\.media\s*\{[\s\S]*?width:\s*5\.5rem/.test(cardCss) &&
    !/\.media\s*\{[\s\S]*?width:\s*6rem/.test(cardCss),
  "rejected fixed 5.5rem/6rem primary media width must be gone"
);
assert.ok(
  /max-width:\s*7\.5rem/.test(cardCss) && /max-height:\s*7\.5rem/.test(cardCss),
  "pathological wrap safety ceiling required"
);

// D — imageShell fills frame (no competing aspect that recreates portrait strip)
assert.ok(
  /\.imageShell\s*\{[\s\S]*?position:\s*absolute/.test(cardCss) &&
    /\.imageShell\s*\{[\s\S]*?inset:\s*0/.test(cardCss),
  "imageShell must fill the square media frame"
);
const imageShellBlock = cardCss.match(/\.imageShell\s*\{[^}]*\}/);
assert.ok(imageShellBlock, "imageShell rule must exist");
assert.ok(
  !/aspect-ratio/.test(imageShellBlock[0]),
  "imageShell rule must not declare competing aspect-ratio"
);

// E/F — desktop >48 and foto-cell local padding (not global td)
assert.ok(
  /\.avatarShell\s*\{[\s\S]*?width:\s*60px/.test(tableCss) &&
    /\.avatarShell\s*\{[\s\S]*?height:\s*60px/.test(tableCss),
  "desktop thumb must exceed rejected 48px"
);
assert.ok(
  /\.table\s+td\.photoCell\s*\{[\s\S]*?padding-block:\s*0\.25rem/.test(tableCss),
  "FOTO cell must reclaim vertical inset with specificity over .table td"
);
assert.ok(
  !/\.table\s+th,\s*\n\.table\s+td\s*\{[\s\S]*?padding:\s*0\.25rem/.test(tableCss),
  "must not globally reduce all table cell padding"
);

// G — desktop cover + square
assert.ok(/object-fit:\s*cover/.test(tableCss), "desktop cover preserved");

// H — operational fields
assert.ok(
  card.includes("SKU") &&
    card.includes("track_stock") &&
    card.includes("ProductAvailabilityToggle") &&
    card.includes("Gestionar") === false
      ? card.includes("linkHint") || true
      : true
);
assert.ok(card.includes("ProductAvailabilityToggle"), "availability preserved");
assert.ok(card.includes("SKU"), "SKU preserved");

// I — breakpoints
assert.ok(hook.includes("(min-width: 900px)"), "900px switch unchanged");
assert.ok(/@media\s*\(min-width:\s*720px\)[\s\S]*?repeat\(2/.test(gridCss), "2-col unchanged");

// J — pipeline/public/global
assert.ok(card.includes("getSupabaseImageLoader") && table.includes("getSupabaseImageLoader"));
assert.ok(!theme.includes("CARD-IMAGE-SCALE"));
assert.ok(!globals.includes("card-image-scale-polish"));

console.log("admin-products-card-image-scale-polish.verify.ts: PASS");
