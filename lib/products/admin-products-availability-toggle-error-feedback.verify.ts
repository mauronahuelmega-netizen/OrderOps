/**
 * Verify ADMIN-PRODUCTS-AVAILABILITY-TOGGLE-ERROR-FEEDBACK-1 (PROD-P3-16)
 *
 * Run: npx tsx lib/products/admin-products-availability-toggle-error-feedback.verify.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { TRACKED_ZERO_STOCK_ENABLE_ERROR } from "@/lib/products/products-stock-availability-contract";

const ROOT = process.cwd();

function read(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

const toggle = read("components/admin/products/product-availability-toggle.tsx");
const toggleCss = read("components/admin/products/product-availability-toggle.module.css");
const card = read("components/admin/products/product-card.tsx");
const table = read("components/admin/products/product-table-view.tsx");
const actions = read("app/admin/(protected)/products/actions.ts");
const stockContract = read("lib/products/products-stock-availability-contract.ts");
const stockMigration = read(
  "supabase/migrations/20260909154400_products_stock_availability_contract.sql"
);
const collection = read("components/admin/products/product-catalog-views.tsx");
const imageOpt = read("lib/products/product-image-optimization.ts");
const imageStorage = read("lib/products/product-image-storage.ts");
const pkg = JSON.parse(read("package.json")) as {
  dependencies?: Record<string, string>;
};

// A — shared availability interaction owner
assert.ok(toggle.includes("export default function ProductAvailabilityToggle"));
assert.ok(card.includes("ProductAvailabilityToggle"));
assert.ok(table.includes("ProductAvailabilityToggle"));

// B — setProductAvailabilityAction remains mutation authority
assert.ok(toggle.includes("setProductAvailabilityAction"));
assert.ok(/export async function setProductAvailabilityAction/.test(actions));

// C — stock-zero pre-check intact
assert.ok(actions.includes("TRACKED_ZERO_STOCK_ENABLE_ERROR"));
assert.ok(
  /track_stock\s*===\s*true[\s\S]*stock[\s\S]*<=\s*0/.test(actions) ||
    /track_stock[\s\S]*stock[\s\S]*<=\s*0[\s\S]*TRACKED_ZERO_STOCK_ENABLE_ERROR/.test(
      actions
    )
);
assert.equal(
  TRACKED_ZERO_STOCK_ENABLE_ERROR.length > 20,
  true,
  "domain copy must remain defined"
);

// D — pending prevents duplicate submit
assert.ok(toggle.includes("useTransition"));
assert.ok(/disabled\s*=\s*isPending|isPending\s*\|\|/.test(toggle));
assert.ok(/if\s*\(\s*isPending\s*\)/.test(toggle));

// E — failure stores/displays safe feedback
assert.ok(toggle.includes("errorMessage"));
assert.ok(/setErrorMessage\(result\.error/.test(toggle));
assert.ok(toggle.includes("styles.error"));
assert.ok(toggleCss.includes(".error"));
assert.ok(
  /errorMessage\s*\?\s*\([\s\S]*role=["']alert["'][\s\S]*\{errorMessage\}/.test(toggle),
  "error message must render when errorMessage is set"
);

// F — failure reconciles/rolls back to previous confirmed state
assert.ok(toggle.includes("confirmedIsAvailable"));
assert.ok(/setOptimisticIsAvailable\(\s*previousValue\s*\)/.test(toggle));

// G — success clears stale error
assert.ok(/setErrorMessage\(\s*null\s*\)/.test(toggle));
assert.ok(/setConfirmedIsAvailable\(\s*nextValue\s*\)/.test(toggle));

// H — domain error can reach UI (action error string rendered)
assert.ok(toggle.includes("result.error"));
assert.ok(actions.includes(TRACKED_ZERO_STOCK_ENABLE_ERROR) || stockContract.includes("No podés marcar"));

// I — unexpected error uses safe generic fallback
assert.ok(toggle.includes("AVAILABILITY_UNEXPECTED_ERROR") || toggle.includes("Intentá nuevamente"));
assert.ok(/catch\s*\{[\s\S]*setErrorMessage/.test(toggle));

// J — raw error object is not rendered
assert.ok(!/\{String\(error/.test(toggle));
assert.ok(!/error\.stack/.test(toggle));
assert.ok(!/JSON\.stringify\(error/.test(toggle));

// K — feedback has alert/live semantics
assert.ok(/role=["']alert["']/.test(toggle));

// L — availability control remains accessible
assert.ok(toggle.includes('role="switch"'));
assert.ok(toggle.includes("aria-label"));
assert.ok(toggle.includes("aria-describedby"));

// M — mobile and desktop share owner
assert.ok(card.includes('from "@/components/admin/products/product-availability-toggle"'));
assert.ok(table.includes('from "@/components/admin/products/product-availability-toggle"'));

// N — no toast dependency added for this control
assert.ok(!/useToast|admin-toast|toast\(/.test(toggle));
assert.ok(!/sonner|react-hot-toast|react-toastify/.test(JSON.stringify(pkg.dependencies ?? {})));

// O — no DB/migration/RLS changes in this phase owner (stock migration still present unchanged)
assert.ok(stockMigration.includes("track_stock"));

// P — stock/availability trigger files untouched conceptually (contract still present)
assert.ok(stockContract.includes("resolveEffectiveProductAvailability"));

// Q — public catalog files not referenced by toggle
assert.ok(!toggle.includes("public/"));

// R — collection breakpoint architecture untouched
assert.ok(collection.includes("900px") || collection.includes("useProductsDesktopCollection"));

// Image surfaces frozen (not imported by toggle)
assert.ok(!toggle.includes("optimizeProductImage"));
assert.ok(!toggle.includes("product-image-storage"));
assert.ok(imageOpt.includes("optimizeProductImage"));
assert.ok(imageStorage.includes("PRODUCT_IMAGES_BUCKET"));

console.log("admin-products-availability-toggle-error-feedback.verify.ts: PASS");
