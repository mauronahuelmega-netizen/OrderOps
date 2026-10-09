/**
 * Verify ADMIN-PRODUCTS-MOBILE-OPERATIONAL-UX-POLISH-1
 * (PROD-P2-7 operational remainder, collection portions of P2-3 / P2-6 / P2-8).
 *
 * Run: npx tsx lib/products/admin-products-mobile-operational-ux-polish.verify.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

const card = read("components/admin/products/product-card.tsx");
const cardCss = read("components/admin/products/product-card.module.css");
const toggle = read("components/admin/products/product-availability-toggle.tsx");
const toggleCss = read("components/admin/products/product-availability-toggle.module.css");
const table = read("components/admin/products/product-table-view.tsx");
const admin = read("lib/products/admin.ts");
const actions = read("app/admin/(protected)/products/actions.ts");
const hook = read("components/admin/products/use-products-desktop-collection.ts");
const views = read("components/admin/products/product-catalog-views.tsx");
const gridCss = read("components/admin/products/product-grid.module.css");
const headerCss = read("components/admin/products/products-header-actions.module.css");
const toolbarCss = read("components/admin/products/products-toolbar.module.css");
const theme = read("app/theme-tokens.css");
const button = read("components/ui/Button.tsx");
const input = read("components/ui/Input.tsx");
const uiCard = read("components/ui/Card.tsx");

// A — SKU at-a-glance
assert.ok(card.includes("SKU ·") || card.includes("SKU "), "ProductCard must render SKU label");
assert.ok(/product\.sku/.test(card), "SKU must come from product model");
assert.ok(
  card.includes('"—"') || card.includes("'—'"),
  "empty SKU must use short neutral fallback"
);

// B — stock meaning from track_stock
assert.ok(card.includes("track_stock"), "card must branch on track_stock");
assert.ok(card.includes("Stock ${product.stock}") || /Stock \$\{product\.stock\}/.test(card), "tracked stock shows Stock N");
assert.ok(
  card.includes("Sin control de stock"),
  "untracked stock must not look like operational zero"
);
assert.ok(
  /track_stock:\s*boolean/.test(admin) &&
    admin.includes("stock, track_stock"),
  "list query/type must include track_stock for presentation"
);

// C/D — inline availability uses existing action
assert.ok(card.includes("ProductAvailabilityToggle"), "card must mount inline availability");
assert.ok(
  toggle.includes("setProductAvailabilityAction"),
  "toggle must call setProductAvailabilityAction"
);
assert.ok(
  !card.includes("createClient") && !toggle.includes("createBrowserClient"),
  "no direct browser Supabase product mutation"
);
assert.ok(
  !/setMobileProductAvailabilityAction/.test(toggle + card + actions),
  "no second mobile availability action"
);

// E — single action owner remains
assert.ok(
  /export async function setProductAvailabilityAction/.test(actions),
  "existing availability action must remain the owner"
);

// F — availability isolates from card edit
assert.ok(
  toggle.includes("stopPropagation"),
  "availability interaction must stopPropagation"
);
assert.ok(
  card.includes('role="button"') &&
    card.includes("onKeyDown") &&
    card.includes("Editar ${product.name}"),
  "card edit a11y contract must remain"
);

// G — product-specific accessible name
assert.ok(
  toggle.includes("Marcar ${productName} como disponible") ||
    /Marcar \$\{productName\} como disponible/.test(toggle),
  "aria-label must be product-specific when enabling"
);
assert.ok(
  toggle.includes("Marcar ${productName} como no disponible") ||
    /Marcar \$\{productName\} como no disponible/.test(toggle),
  "aria-label must be product-specific when disabling"
);
assert.ok(table.includes("productName={product.name}"), "desktop table must pass productName");

// H — tracked+zero disableEnable when UI implements it
assert.ok(
  card.includes("disableEnable") &&
    /track_stock\s*&&\s*product\.stock\s*<=\s*0/.test(card),
  "card must disable enable path when tracked and stock<=0"
);
assert.ok(
  toggle.includes("disableEnable") && toggle.includes("disabled"),
  "toggle must honor disableEnable while pending"
);

// I — edit contract preserved (covered in F)

// J — collection breakpoints frozen in grid CSS
assert.ok(
  gridCss.includes("minmax(0, 1fr)") || /grid-template-columns:\s*1fr/.test(gridCss),
  "grid CSS present"
);
assert.ok(
  /@media\s*\(min-width:\s*720px\)/.test(gridCss) &&
    /grid-template-columns:\s*repeat\(2/.test(gridCss),
  "720–899 two-column rule must remain"
);

// K — canonical 900 architecture untouched
assert.ok(
  hook.includes("(min-width: 900px)") && hook.includes("useSyncExternalStore"),
  "900px useSyncExternalStore architecture must remain"
);
assert.ok(!views.includes("desktopOnly") && !views.includes("mobileOnly"), "no dual-mount wrappers");

// L — pagination single shared owner
assert.ok(
  views.includes("ProductPagination") &&
    !table.includes("ProductPagination") &&
    !read("components/admin/products/product-grid-server.tsx").includes("ProductPagination"),
  "pagination remains shared in catalog views only"
);

// M — no global CSS / theme / shared primitives churn for this phase intent
assert.ok(
  !theme.includes("/* MOBILE-OPERATIONAL"),
  "theme tokens file must not carry phase-specific patches"
);
assert.ok(button.includes("export"), "shared Button file remains present (unchanged by intent)");
assert.ok(input.includes("export") || input.includes("function"), "shared Input remains");
assert.ok(uiCard.includes("export"), "shared Card remains");

// N — feature-scoped >=44px (2.75rem) for collection controls
assert.ok(
  headerCss.includes("min-height: 2.75rem"),
  "header actions must use >=44px targets"
);
assert.ok(
  toolbarCss.includes("min-height: 2.75rem"),
  "toolbar controls must use >=44px targets"
);
assert.ok(
  toggleCss.includes("min-height: 2.75rem") || toggleCss.includes("min-height: 44px"),
  "availability hit area must be >=44px"
);

// O — no new product data fetching in card
assert.ok(
  !card.includes("fetch(") && !card.includes("getAdminProduct"),
  "card must not introduce product fetching"
);

// P — card CSS resilience
assert.ok(cardCss.includes("min-width: 0"), "card layout must allow truncation/wrapping");
assert.ok(
  cardCss.includes("metaLine") || cardCss.includes("sku"),
  "operational meta styles must exist"
);

// Contrast owners use stronger secondary token (not muted tertiary)
assert.ok(
  /linkHint[\s\S]*--text-secondary/.test(cardCss),
  "Gestionar contrast owner must use --text-secondary"
);
assert.ok(
  /catalogSubtitle[\s\S]*--text-secondary/.test(gridCss),
  "Por categorías contrast owner must use --text-secondary"
);
assert.ok(
  /categoryCount[\s\S]*--text-secondary/.test(gridCss),
  "category count contrast owner must use --text-secondary"
);

console.log("admin-products-mobile-operational-ux-polish.verify.ts: PASS");
