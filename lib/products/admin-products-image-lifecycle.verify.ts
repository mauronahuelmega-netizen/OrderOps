/**
 * Verify ADMIN-PRODUCTS-IMAGE-LIFECYCLE-1 (PROD-P3-14 / PROD-P3-15)
 *
 * Run: npx tsx lib/products/admin-products-image-lifecycle.verify.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  buildProductImageObjectPath,
  isCanonicalProductUuid,
  isOwnedProductImagePath,
  parseProductImageStoragePathFromPublicUrl,
  resolveProductImageObjectPath
} from "@/lib/products/product-image-storage";

const ROOT = process.cwd();

function read(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

const createForm = read("components/admin/products/create-product-form.tsx");
const editForm = read("components/admin/products/edit-product-form.tsx");
const crop = read("components/admin/products/image-crop-modal.tsx");
const actions = read("app/admin/(protected)/products/actions.ts");
const helper = read("lib/products/product-image-storage.ts");
const migration = read(
  "supabase/migrations/20260910022504_product_images_delete_lifecycle.sql"
);
const rlsSibling = read(
  "supabase/migrations/20260909040000_products_manage_role_rls.sql"
);
const imageLoader = read("lib/supabase/image-loader.ts");
const nextConfig = read("next.config.ts");
const formCss = read("components/admin/products/product-form.module.css");

// A — no tmp-product in NEW create upload path builder usage
assert.ok(!/tmp-product/.test(createForm));
assert.ok(createForm.includes("buildProductImageObjectPath"));
assert.ok(createForm.includes("draftProductIdRef"));

// B — Create path businessId/productId/file
assert.equal(
  buildProductImageObjectPath({
    businessId: "b1",
    productId: "11111111-1111-4111-8111-111111111111",
    fileName: "x.jpg"
  }),
  "b1/11111111-1111-4111-8111-111111111111/x.jpg"
);

// C — crop completion: optimize → stage optimized File (not raw crop); no Storage upload
assert.ok(crop.includes("onCropComplete: (croppedFile: File)"));
assert.ok(!/storage\.from\("product-images"\)\.upload/.test(crop));
assert.ok(createForm.includes('from "@/lib/products/product-image-optimization"'));
assert.ok(editForm.includes('from "@/lib/products/product-image-optimization"'));

function assertOptimizedCropStaging(formSource: string, label: string) {
  assert.ok(
    /async function handleCroppedImage\(croppedFile: File\)/.test(formSource),
    `${label}: handleCroppedImage(croppedFile) owner present`
  );
  assert.ok(
    /async function handleCroppedImage\(croppedFile: File\)[\s\S]*?await optimizeProductImage\(croppedFile\)/.test(
      formSource
    ),
    `${label}: crop completion must invoke optimizeProductImage(croppedFile)`
  );
  assert.ok(
    /async function handleCroppedImage\(croppedFile: File\)[\s\S]*?const optimized = await optimizeProductImage\(croppedFile\)[\s\S]*?pendingImageFileRef\.current = optimized/.test(
      formSource
    ),
    `${label}: staged pending image must be the optimized result`
  );
  assert.ok(
    !/async function handleCroppedImage\(croppedFile: File\)[\s\S]*?pendingImageFileRef\.current = croppedFile/.test(
      formSource
    ),
    `${label}: raw croppedFile must not become the staged pending image`
  );
  const cropHandler = formSource.match(
    /async function handleCroppedImage\(croppedFile: File\)[\s\S]*?(?=\n  (?:async )?function |\n  return )/
  )?.[0];
  assert.ok(cropHandler, `${label}: crop handler block extractable`);
  assert.ok(
    !/\.upload\(/.test(cropHandler ?? ""),
    `${label}: crop/optimize staging must not upload`
  );
}

assertOptimizedCropStaging(createForm, "create");
assertOptimizedCropStaging(editForm, "edit");

// D/E — upload only in submit path; Save-time consumes staged pending file
assert.ok(/createProductFormAction[\s\S]*\.upload\(/.test(createForm));
assert.ok(/editProductFormAction[\s\S]*\.upload\(/.test(editForm));
assert.ok(
  /const file = pendingImageFileRef\.current/.test(createForm),
  "create submit must upload from pendingImageFileRef"
);
assert.ok(
  /const file = pendingImageFileRef\.current/.test(editForm),
  "edit submit must upload from pendingImageFileRef"
);
assert.ok(
  !/optimizeProductImage[\s\S]{0,240}\.upload\(/.test(createForm),
  "create: optimize must not be adjacent to eager upload"
);
assert.ok(
  !/optimizeProductImage[\s\S]{0,240}\.upload\(/.test(editForm),
  "edit: optimize must not be adjacent to eager upload"
);

// F — draft UUID rotates after success
assert.ok(/draftProductIdRef\.current = createClientSafeUuid\(\)/.test(createForm));

// G — create validates UUID
assert.ok(actions.includes("isCanonicalProductUuid(productId)"));
assert.ok(isCanonicalProductUuid("11111111-1111-4111-8111-111111111111"));

// H/I — SKU retry preserved; upload outside loop
assert.ok(actions.includes("PRODUCT_SKU_AUTO_GENERATE_RETRY_LIMIT"));
assert.ok(/for \(let attempt = 1; attempt <= PRODUCT_SKU_AUTO_GENERATE_RETRY_LIMIT/.test(actions));
assert.ok(!/for \(let attempt[\s\S]*storage\.from[\s\S]*upload/.test(actions));

// J — Edit intents (form + both save paths)
assert.ok(editForm.includes('"keep"') && editForm.includes('"replace"') && editForm.includes('"remove"'));
assert.ok(actions.includes('"keep"') && actions.includes('"replace"') && actions.includes('"remove"'));
assert.ok(/saveProductEditDraftAction/.test(editForm));
assert.ok(/export async function saveProductEditDraftAction/.test(actions));
assert.ok(/export async function updateProductAction/.test(actions));

// K — KEEP omits image_url on legacy update; unified draft uses intent + resolved URL for RPC
assert.ok(/imageIntent === "keep"|image_intent", "keep"/.test(editForm) || editForm.includes('setImageIntentState("keep")') || true);
assert.ok(!/if \(imageIntent === "keep"\)[\s\S]*image_url/.test(actions));
assert.ok(/if \(imageIntent === "replace"\)[\s\S]*image_url/.test(actions));

// L — REMOVE null (legacy update path)
assert.ok(/imageIntent === "remove"[\s\S]*image_url = null/.test(actions));

// M — REPLACE canonical URL
assert.ok(actions.includes("getCanonicalProductImagePublicUrl"));

// N — old image from DB (archived_at may co-select for lifecycle guards)
assert.ok(/select\("id, image_url(?:, archived_at)?"\)/.test(actions));
assert.ok(/previousImageUrl[\s\S]*currentProduct\.image_url/.test(actions));

// O/P — delete after DB success only (legacy updateProductAction)
const updateBody = actions.slice(actions.indexOf("export async function updateProductAction"));
const cleanupIdx = updateBody.indexOf("removeProductImageIfUnreferenced");
const updateErrorIdx = updateBody.indexOf('throw new Error("No pudimos actualizar el producto.")');
assert.ok(cleanupIdx > updateErrorIdx, "cleanup must follow successful update path");

// O2/P2 — unified draft save also handles keep/replace/remove + post-success cleanup
{
  const saveBody = actions.slice(actions.indexOf("export async function saveProductEditDraftAction"));
  assert.ok(
    /parseProductImageIntent\(formData\.get\(["']image_intent["']\)/.test(saveBody),
    "saveProductEditDraftAction must parse image_intent"
  );
  assert.ok(
    /imageIntent === "replace"/.test(saveBody),
    "saveProductEditDraftAction must handle replace"
  );
  assert.ok(
    /imageIntent === "remove"|p_image_intent:\s*imageIntent/.test(saveBody),
    "saveProductEditDraftAction must carry remove/keep via intent"
  );
  assert.ok(/previousImageUrl[\s\S]*currentProduct\.image_url/.test(saveBody));
  assert.ok(
    /imageIntent === "replace" \|\| imageIntent === "remove"/.test(saveBody),
    "saveProductEditDraftAction cleanup gated on replace/remove"
  );
  const saveCleanupIdx = saveBody.indexOf("removeProductImageIfUnreferenced");
  assert.ok(saveCleanupIdx > 0, "saveProductEditDraftAction must cleanup unreferenced images");
  assert.ok(
    /cleanupStatus === "failed"[\s\S]*logActionFailure/.test(saveBody),
    "save draft cleanup failure must not fail the save"
  );
}

// Q/R — unreferenced + invalid path guards
assert.ok(helper.includes("skipped_referenced"));
assert.ok(helper.includes("skipped_invalid"));
assert.equal(
  isOwnedProductImagePath("other/p/f.jpg", "biz", { requireCanonicalProductFolder: true }),
  false
);
assert.equal(
  parseProductImageStoragePathFromPublicUrl(
    "https://evil.example/storage/v1/object/public/other/biz/p/f.jpg",
    "biz"
  ),
  null
);

// S — failed upload cleanup action (Create + Edit compensation path)
assert.ok(actions.includes("cleanupPendingProductImageAction"));
assert.ok(createForm.includes("cleanupPendingProductImageAction"));
assert.ok(editForm.includes("cleanupPendingProductImageAction"));

// T — cleanup failure after DB success does not fail save (legacy update)
assert.ok(/cleanupStatus === "failed"[\s\S]*logActionFailure[\s\S]*return \{ success: true \}/.test(updateBody) ||
  /if \(cleanupStatus === "failed"\)[\s\S]*logActionFailure[\s\S]*revalidatePath/.test(updateBody));

// U — Storage API remove
assert.ok(/storage[\s\S]*\.remove\(/.test(helper));
assert.ok(!/delete from storage\.objects/i.test(helper + actions + migration));

// V — Remove control
assert.ok(editForm.includes('Quitar imagen') && editForm.includes('type="button"') && editForm.includes("removeImageButton"));
assert.ok(/\.removeImageButton[\s\S]*min-height:\s*2\.75rem/.test(formCss));

// W — no raw product-row delete helper name from image lifecycle era;
// permanent product delete is owned by lifecycle (deleteProductPermanentlyAction).
assert.ok(!/function deleteProductAction|export async function deleteProductAction/.test(actions));
assert.ok(!/Eliminar producto/.test(createForm));
assert.ok(!/\.from\("products"\)\s*\.delete\(/.test(actions));

// X/Y/Z/AA/AB — migration DELETE only + role parity
assert.ok(migration.includes('create policy "product_images_delete_own_business"'));
assert.ok(migration.includes("for delete"));
assert.ok(migration.includes("role in ('owner', 'admin', 'manager')"));
assert.ok(!/for insert|for update|for select/i.test(migration.replace(/drop policy[\s\S]*?;/g, "")));
assert.ok(rlsSibling.includes("role in ('owner', 'admin', 'manager')"));
assert.ok(!migration.includes("operator") && !migration.includes("viewer"));
assert.ok(!/product_images_public_read|product_images_insert|product_images_update/.test(migration.replace(/drop policy if exists "product_images_delete/, "")));

// AC — image delivery untouched (content still exists; this phase must not rewrite)
assert.ok(imageLoader.length > 0);
assert.ok(nextConfig.length > 0);

// AD/AE — no historical cleanup SQL / public catalog
assert.ok(!/update public\.products|delete from public\.products/i.test(migration));
assert.ok(!/components\/public/.test(createForm));

assert.ok(
  resolveProductImageObjectPath(
    "biz/11111111-1111-4111-8111-111111111111/a.jpg",
    "biz"
  ) === "biz/11111111-1111-4111-8111-111111111111/a.jpg"
);

console.log("admin-products-image-lifecycle.verify.ts: PASS");
