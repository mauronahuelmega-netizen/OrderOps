/**
 * Verify ADMIN-PRODUCTS-CLIENT-IMAGE-OPTIMIZATION-1
 * (+ 800-first quality-preserving selection — ADMIN-PRODUCTS-CLIENT-IMAGE-OPTIMIZATION-800-FIRST-SELECTION-1)
 *
 * Run: npx tsx lib/products/admin-products-client-image-optimization.verify.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  PRODUCT_IMAGE_MAX_DIMENSION,
  PRODUCT_IMAGE_MIN_DIMENSION_FALLBACK,
  PRODUCT_IMAGE_MIN_QUALITY,
  PRODUCT_IMAGE_OUTLIER_MAX_BYTES,
  PRODUCT_IMAGE_TARGET_BYTES,
  selectLargestDimensionFirstCandidate,
  type DimensionCandidateGroup
} from "@/lib/products/product-image-optimization";

const ROOT = process.cwd();

function read(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

const optimizer = read("lib/products/product-image-optimization.ts");
const createForm = read("components/admin/products/create-product-form.tsx");
const editForm = read("components/admin/products/edit-product-form.tsx");
const crop = read("components/admin/products/image-crop-modal.tsx");
const storage = read("lib/products/product-image-storage.ts");
const lifecycleMigration = read(
  "supabase/migrations/20260910022504_product_images_delete_lifecycle.sql"
);
const imageLoader = read("lib/supabase/image-loader.ts");
const nextConfig = read("next.config.ts");
const pkg = JSON.parse(read("package.json")) as {
  dependencies?: Record<string, string>;
};

// A — single shared optimizer
assert.ok(optimizer.includes("export async function optimizeProductImage"));
assert.equal(
  (optimizer.match(/export async function optimizeProductImage/g) || []).length,
  1
);

// B — primary max dimension 800
assert.ok(/PRODUCT_IMAGE_MAX_DIMENSION\s*=\s*800/.test(optimizer));
assert.ok(optimizer.includes("800, 720, 640") || optimizer.includes("[800, 720, 640]"));
assert.equal(PRODUCT_IMAGE_MAX_DIMENSION, 800);
assert.equal(PRODUCT_IMAGE_MIN_DIMENSION_FALLBACK, 640);

// C — WebP output
assert.ok(/PRODUCT_IMAGE_WEBP_MIME\s*=\s*"image\/webp"/.test(optimizer));
assert.ok(optimizer.includes(".webp"));
assert.ok(/type:\s*PRODUCT_IMAGE_WEBP_MIME/.test(optimizer));

// D — preferred target + outlier ceiling
assert.equal(PRODUCT_IMAGE_TARGET_BYTES, 90 * 1024);
assert.equal(PRODUCT_IMAGE_OUTLIER_MAX_BYTES, 150 * 1024);
assert.ok(/PRODUCT_IMAGE_TARGET_BYTES\s*=\s*90\s*\*\s*1024/.test(optimizer));
assert.ok(/PRODUCT_IMAGE_OUTLIER_MAX_BYTES\s*=\s*150\s*\*\s*1024/.test(optimizer));

// E — quality loop bounded
assert.ok(/PRODUCT_IMAGE_INITIAL_QUALITY\s*=\s*0\.8/.test(optimizer));
assert.ok(/PRODUCT_IMAGE_MIN_QUALITY\s*=\s*0\.6/.test(optimizer));
assert.equal(PRODUCT_IMAGE_MIN_QUALITY, 0.6);
assert.ok(optimizer.includes("0.8, 0.75, 0.7, 0.65, 0.6") || /QUALITY_STEPS/.test(optimizer));

// F — no upscale
assert.ok(optimizer.includes("largest <= maxDimension"));

// G — HEIC MIME + extension
assert.ok(optimizer.includes("image/heic") && optimizer.includes(".heic"));
assert.ok(optimizer.includes("isHeicFile"));

// H — lazy HEIC import
assert.ok(/await import\(["']heic-to["']\)/.test(optimizer));
assert.ok(!/^import .*from ["']heic-to["']/m.test(optimizer));

// I — no Supabase / React imports in optimizer
assert.ok(!/from\s+["'][^"']*supabase[^"']*["']/.test(optimizer));
assert.ok(!/from\s+["']react["']/.test(optimizer));
assert.ok(!/createSupabase|@supabase/.test(optimizer));

// J/K — Create/Edit share optimizer
assert.ok(createForm.includes("optimizeProductImage"));
assert.ok(editForm.includes("optimizeProductImage"));
assert.ok(createForm.includes('from "@/lib/products/product-image-optimization"'));
assert.ok(editForm.includes('from "@/lib/products/product-image-optimization"'));

// L — crop confirmation does not upload
assert.ok(!/storage\.from|supabase\.storage/.test(crop));
assert.ok(crop.includes("getCroppedImg"));
assert.ok(crop.includes("onCropComplete(croppedFile)"));

// M — Storage upload remains Save-time only (form action path)
assert.ok(createForm.includes(".upload("));
assert.ok(editForm.includes(".upload("));
assert.ok(!/optimizeProductImage[\s\S]{0,200}\.upload\(/.test(createForm));
assert.ok(createForm.includes("pendingImageFileRef.current"));

// N/O — KEEP / REMOVE do not optimize/upload (optimize only in cropped handler)
assert.ok(/handleCroppedImage[\s\S]*optimizeProductImage/.test(createForm));
assert.ok(/handleCroppedImage[\s\S]*optimizeProductImage/.test(editForm));
assert.ok(/handleRemoveImage[\s\S]*setImageIntentState\("remove"\)/.test(editForm));
assert.ok(!/handleRemoveImage[\s\S]*optimizeProductImage/.test(editForm));

// P — optimization outside SKU retry (optimize in crop path, upload once before action)
assert.ok(createForm.includes("createProductAction"));
assert.ok(!/for\s*\(.*sku|SKU.*optimizeProductImage|optimizeProductImage.*sku/i.test(createForm));

// Q — no tmp-product
assert.ok(!/tmp-product/.test(createForm));
assert.ok(!/tmp-product/.test(editForm));
assert.ok(!/tmp-product/.test(optimizer));

// R — path/MIME from File (extension from staged name)
assert.ok(createForm.includes("getFileExtension(file.name)"));
assert.ok(createForm.includes("contentType: file.type"));
assert.ok(editForm.includes("contentType: file.type"));

// S — lifecycle migration untouched contract
assert.ok(lifecycleMigration.includes("product_images_delete_own_business"));
assert.ok(lifecycleMigration.includes("for delete"));

// T — public delivery untouched (no optimizer refs)
assert.ok(!imageLoader.includes("optimizeProductImage"));
assert.ok(!nextConfig.includes("optimizeProductImage"));
assert.ok(!storage.includes("optimizeProductImage"));

// Dependencies present
assert.ok(pkg.dependencies?.pica);
assert.ok(pkg.dependencies?.["heic-to"]);

// Processing UX
assert.ok(createForm.includes("isProcessingImage"));
assert.ok(editForm.includes("isProcessingImage"));
assert.ok(createForm.includes("Optimizando imagen"));
assert.ok(editForm.includes("Optimizando imagen"));

// U — encode path uses outlier ceiling (800-first selection)
assert.ok(optimizer.includes("PRODUCT_IMAGE_OUTLIER_MAX_BYTES"));
assert.ok(optimizer.includes("bestAcceptableOutlier"));
assert.ok(optimizer.includes("export function selectLargestDimensionFirstCandidate"));

// --- Deterministic selection matrices (800-first) ---

function group(
  maxDimension: number,
  pairs: Array<[number, number]>
): DimensionCandidateGroup {
  return {
    maxDimension,
    candidates: pairs.map(([quality, sizeKiB]) => ({
      quality,
      size: Math.round(sizeKiB * 1024)
    }))
  };
}

// MATRIX A — preferred ≤90 achievable at 800 → return 800/q.60/88 (not early outlier)
{
  const outcome = selectLargestDimensionFirstCandidate([
    group(800, [
      [0.8, 170],
      [0.75, 142],
      [0.7, 118],
      [0.65, 101],
      [0.6, 88]
    ]),
    group(720, [[0.8, 50]])
  ]);
  assert.ok(outcome);
  assert.equal(outcome?.kind, "preferred");
  assert.equal(outcome?.maxDimension, 800);
  assert.equal(outcome?.quality, 0.6);
  assert.ok((outcome?.size ?? 0) <= PRODUCT_IMAGE_TARGET_BYTES);
}

// MATRIX B — 800 outlier ≤150 beats 720 preferred
{
  const outcome = selectLargestDimensionFirstCandidate([
    group(800, [
      [0.8, 180],
      [0.75, 146],
      [0.7, 125],
      [0.65, 108],
      [0.6, 97]
    ]),
    group(720, [[0.8, 74]])
  ]);
  assert.ok(outcome);
  assert.equal(outcome?.kind, "outlier");
  assert.equal(outcome?.maxDimension, 800);
  assert.equal(outcome?.quality, 0.75);
  assert.ok((outcome?.size ?? 0) <= PRODUCT_IMAGE_OUTLIER_MAX_BYTES);
  assert.ok((outcome?.size ?? 0) > PRODUCT_IMAGE_TARGET_BYTES);
}

// MATRIX C — 800 all >150 → 720 preferred
{
  const outcome = selectLargestDimensionFirstCandidate([
    group(800, [
      [0.8, 200],
      [0.75, 190],
      [0.7, 180],
      [0.65, 170],
      [0.6, 160]
    ]),
    group(720, [
      [0.8, 175],
      [0.75, 138],
      [0.7, 110],
      [0.65, 92],
      [0.6, 86]
    ])
  ]);
  assert.ok(outcome);
  assert.equal(outcome?.kind, "preferred");
  assert.equal(outcome?.maxDimension, 720);
  assert.equal(outcome?.quality, 0.6);
}

// MATRIX D — 800/720 >150 → 640 highest-quality outlier
{
  const outcome = selectLargestDimensionFirstCandidate([
    group(800, [
      [0.8, 200],
      [0.6, 160]
    ]),
    group(720, [
      [0.8, 190],
      [0.6, 155]
    ]),
    group(640, [
      [0.8, 145],
      [0.75, 126],
      [0.7, 111],
      [0.65, 100],
      [0.6, 96]
    ])
  ]);
  assert.ok(outcome);
  assert.equal(outcome?.kind, "outlier");
  assert.equal(outcome?.maxDimension, 640);
  assert.equal(outcome?.quality, 0.8);
}

// MATRIX E — all >150 → bestOverall (smallest)
{
  const outcome = selectLargestDimensionFirstCandidate([
    group(800, [
      [0.8, 200],
      [0.6, 180]
    ]),
    group(720, [
      [0.8, 190],
      [0.6, 170]
    ]),
    group(640, [
      [0.8, 165],
      [0.6, 155]
    ])
  ]);
  assert.ok(outcome);
  assert.equal(outcome?.kind, "bestOverall");
  assert.equal(outcome?.maxDimension, 640);
  assert.equal(outcome?.quality, 0.6);
  assert.equal(outcome?.size, Math.round(155 * 1024));
}

console.log("admin-products-client-image-optimization.verify.ts: PASS");
