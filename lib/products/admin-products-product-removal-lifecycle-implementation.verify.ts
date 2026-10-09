/**
 * Verify ADMIN-PRODUCTS-PRODUCT-REMOVAL-LIFECYCLE-IMPLEMENTATION-1
 *
 * Run: npx tsx lib/products/admin-products-product-removal-lifecycle-implementation.verify.ts
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function sha256File(rel: string) {
  return createHash("sha256").update(readFileSync(path.join(ROOT, rel))).digest("hex");
}

const EXPECTED_MIGRATION_SHA =
  "5f19d2697f79d2bf17a3388d619a42bc31e32690313362a1cf26400c32628d57";
const MIGRATION_REL =
  "supabase/migrations/20260916180000_products_removal_lifecycle.sql";

const admin = read("lib/products/admin.ts");
const actions = read("app/admin/(protected)/products/actions.ts");
const customizationActions = read(
  "app/admin/(protected)/products/customizations/actions.ts"
);
const publicCatalog = read("lib/catalog/public.ts");
const publicCustomization = read("lib/product-customization/public.ts");
const customizationAdmin = read("lib/product-customization/admin.ts");
const orderValidation = read("lib/product-customization/order-validation.ts");
const imageStorage = read("lib/products/product-image-storage.ts");
const editForm = read("components/admin/products/edit-product-form.tsx");
const overridesPanel = read(
  "components/admin/product-customization/product-customization-overrides-panel.tsx"
);
const toolbar = read("components/admin/products/products-toolbar.tsx");
const card = read("components/admin/products/product-card.tsx");
const table = read("components/admin/products/product-table-view.tsx");
const emptyState = read("components/admin/products/product-catalog-empty-state.tsx");
const catalogSection = read("components/admin/products/product-catalog-section.tsx");
const createForm = read("components/admin/products/create-product-form.tsx");
const availabilityToggle = read(
  "components/admin/products/product-availability-toggle.tsx"
);

// AH — no migration/SQL edits (fingerprint)
assert.equal(
  sha256File(MIGRATION_REL).toLowerCase(),
  EXPECTED_MIGRATION_SHA,
  "AH — lifecycle migration SHA must remain frozen"
);

// A — types include archived_at
assert.ok(/archived_at: string \| null/.test(admin) || /archived_at: string \| null/.test(read("lib/products/admin-product-types.ts")), "A — AdminProductListItem archived_at");
assert.ok(/export type AdminProduct = AdminProductListItem/.test(admin) || /export type AdminProduct = AdminProductListItem/.test(read("lib/products/admin-product-types.ts")), "A — AdminProduct");
assert.ok(/function isProductArchived/.test(admin) || /function isProductArchived/.test(read("lib/products/admin-product-types.ts")), "A — isProductArchived helper");
assert.ok(!/is_archived\s*:/.test(admin), "A — no persisted is_archived boolean");

// B–E — query status matrix
{
  const getAdminProducts = admin.slice(
    admin.indexOf("export async function getAdminProducts"),
    admin.indexOf("export async function getAdminProductsCatalogCount")
  );
  assert.ok(
    /\.is\("archived_at", null\)/.test(getAdminProducts),
    "B — default excludes archived"
  );
  assert.ok(
    /status === "archived"[\s\S]*\.not\("archived_at", "is", null\)/.test(getAdminProducts),
    "E — archived view only archived"
  );
  assert.ok(
    /status === "active"[\s\S]*\.eq\("is_available", true\)/.test(getAdminProducts),
    "C — active = non-archived + available"
  );
  assert.ok(
    /status === "inactive"[\s\S]*\.eq\("is_available", false\)/.test(getAdminProducts),
    "D — inactive = non-archived + unavailable"
  );
}

// F — exact detail does not exclude archived
{
  const byId = admin.slice(admin.indexOf("export async function getAdminProductById"));
  const fnBody = byId.slice(0, 1200);
  assert.ok(!/\.is\("archived_at", null\)/.test(fnBody), "F — detail must allow archived");
  assert.ok(/archived_at/.test(fnBody), "F — detail projects archived_at");
}

// G — catalog existence includes archived
{
  const catalogCount = admin.slice(
    admin.indexOf("export async function getAdminProductsCatalogCount"),
    admin.indexOf("export async function getAdminProductsActiveLifecycleCount")
  );
  assert.ok(
    !/\.is\("archived_at"/.test(catalogCount),
    "G — catalog existence must include archived"
  );
  assert.ok(/getAdminProductsActiveLifecycleCount/.test(admin), "G — active lifecycle count");
  assert.ok(/getAdminProductsActiveLifecycleCount/.test(catalogSection));
}

// H — manual order excludes archived
{
  const manual = admin.slice(admin.indexOf("export async function getManualOrderProductOptions"));
  const body = manual.slice(0, 900);
  assert.ok(/\.is\("archived_at", null\)/.test(body), "H — manual order excludes archived");
  assert.ok(/\.eq\("is_available", true\)/.test(body), "H — manual order requires available");
}

// I — public product query excludes archived
assert.ok(
  /\.is\("archived_at", null\)/.test(publicCatalog),
  "I — public catalog excludes archived"
);

// J — public customization excludes archived
assert.ok(
  /archived_at == null/.test(publicCustomization) ||
    /\.is\("archived_at", null\)/.test(publicCustomization),
  "J — public customization excludes archived"
);
assert.ok(/archived_at/.test(orderValidation), "J — order validation gates archived");

// K — customization product-target selectors exclude archived
assert.ok(
  /\.is\("archived_at", null\)/.test(customizationAdmin),
  "K — admin customization product options exclude archived"
);

// L — server target validation rejects archived for new assignment
assert.ok(
  /requireNonArchived/.test(customizationActions),
  "L — assertProductOwnership supports requireNonArchived"
);
assert.ok(
  /El producto está archivado\. Restáuralo para usarlo como destino\./.test(
    customizationActions
  ),
  "L — archived target rejection copy"
);

// M/N/O — mutation guards
function assertArchivedGuard(fnName: string, label: string) {
  const idx = actions.indexOf(`export async function ${fnName}`);
  assert.ok(idx >= 0, `${label} — ${fnName} must exist`);
  const body = actions.slice(idx, idx + 4500);
  assert.ok(/archived_at/.test(body), `${label} — ${fnName} reads archived_at`);
  assert.ok(
    /El producto está archivado\. Restáuralo para editarlo\./.test(body),
    `${label} — ${fnName} rejects archived`
  );
}

assertArchivedGuard("setProductAvailabilityAction", "M");
assertArchivedGuard("saveProductEditDraftAction", "N");
assertArchivedGuard("updateProductAction", "O");

// P — archive writes only lifecycle fields
{
  const idx = actions.indexOf("export async function archiveProductAction");
  assert.ok(idx >= 0, "P — archiveProductAction");
  const body = actions.slice(idx, idx + 1800);
  assert.ok(/archived_at:\s*new Date\(\)\.toISOString\(\)/.test(body), "P — sets archived_at");
  assert.ok(/is_available:\s*false/.test(body), "P — forces unavailable");
  assert.ok(/\.is\("archived_at", null\)/.test(body), "P — only active rows");
  assert.ok(!/removeProductImageIfUnreferenced/.test(body), "W — Archive does not delete Storage");
  assert.ok(/requireAdminPermission\("manageProducts"\)/.test(body), "archive permission");
}

// Q — restore clears archived_at + unavailable
{
  const idx = actions.indexOf("export async function restoreProductAction");
  assert.ok(idx >= 0, "Q — restoreProductAction");
  const body = actions.slice(idx, idx + 1800);
  assert.ok(/archived_at:\s*null/.test(body), "Q — clears archived_at");
  assert.ok(/is_available:\s*false/.test(body), "Q — remains unavailable");
  assert.ok(!/removeProductImageIfUnreferenced/.test(body), "X — Restore does not mutate Storage");
  assert.ok(/requireAdminPermission\("manageProducts"\)/.test(body), "restore permission");
}

// R/S/T/U — permanent delete via RPC + post-commit cleanup
{
  const idx = actions.indexOf("export async function deleteProductPermanentlyAction");
  assert.ok(idx >= 0, "R — deleteProductPermanentlyAction");
  const body = actions.slice(idx, idx + 2800);
  assert.ok(/delete_product_permanently/.test(body), "R — calls delete_product_permanently RPC");
  assert.ok(!/\.from\("products"\)\s*\.delete\(/.test(body), "S — no raw products delete");
  assert.ok(!/p_business_id|business_id:/.test(body.match(/delete_product_permanently[\s\S]{0,400}/)?.[0] ?? ""), "T — RPC args product id only");
  const rpcIdx = body.indexOf("delete_product_permanently");
  const cleanupIdx = body.indexOf("removeProductImageIfUnreferenced");
  assert.ok(cleanupIdx > rpcIdx, "U — Storage cleanup after RPC");
  assert.ok(/deleted === true|deleted=true|row\?\.deleted === true/.test(body), "deleted=true gate");
  assert.ok(
    /No se pudo limpiar su imagen automáticamente/.test(body),
    "cleanup failure warning"
  );
  assert.ok(/requireAdminPermission\("manageProducts"\)/.test(body), "delete permission");
}

assert.ok(
  !/\.from\("products"\)\s*\.delete\(/.test(actions),
  "S — no raw products.delete anywhere in products actions"
);

// V — shared-ref query includes archived (no archived_at filter)
{
  const cleanup = imageStorage.slice(
    imageStorage.indexOf("export async function removeProductImageIfUnreferenced")
  );
  const body = cleanup.slice(0, 900);
  assert.ok(/\.from\("products"\)/.test(body), "V — shared-ref queries products");
  assert.ok(
    !/\.is\("archived_at"/.test(body) && !/\.not\("archived_at"/.test(body),
    "V — shared-ref must include archived products"
  );
}

// Y/Z/AA/AB/AC — UI contracts
assert.ok(/isProductArchived\(product\)/.test(editForm), "archived detection in edit");
assert.ok(/Gestión del producto/.test(editForm), "AB — lifecycle section");
assert.ok(/Archivar producto/.test(editForm) || />\s*Archivar\s*</.test(editForm) || /<span>Archivar<\/span>/.test(editForm), "AB — Archive action");
assert.ok(/Eliminar producto/.test(editForm) || /<span>Eliminar<\/span>/.test(editForm), "AB/AC — Delete action");
assert.ok(/Restaurar producto/.test(editForm) || /Restaurar/.test(editForm), "AC — Restore action");
assert.ok(/Producto archivado/.test(editForm), "archived banner");
assert.ok(
  /\{!isArchived \?[\s\S]*Guardar cambios[\s\S]*: null\}/.test(editForm) ||
    (/!isArchived/.test(editForm) && /Guardar cambios/.test(editForm)),
  "Y — archived has no normal Save"
);
assert.ok(/readOnly=\{isArchived\}/.test(editForm), "AA — Advanced readOnly when archived");
assert.ok(/readOnly\?: boolean/.test(overridesPanel), "AA — overrides readOnly prop");
assert.ok(
  /disabled=\{readOnly\}|readOnly \?/.test(overridesPanel),
  "AA — visibility controls locked when readOnly"
);

assert.ok(
  /archived[\s\S]*ProductAvailabilityToggle|isProductArchived[\s\S]*ProductAvailabilityToggle/.test(
    card
  ) || /archived \?[\s\S]*Archivado/.test(card),
  "Z — archived card has no availability toggle"
);
assert.ok(/Archivado/.test(card), "archived card badge");
assert.ok(/Archivado/.test(table), "archived table state");
assert.ok(
  /archived \?[\s\S]*Archivado[\s\S]*ProductAvailabilityToggle|isProductArchived[\s\S]*ProductAvailabilityToggle/.test(
    table
  ),
  "Z — archived desktop has no toggle"
);
assert.ok(!/Eliminar producto/.test(card), "AD — Delete absent from cards");
assert.ok(!/Eliminar producto/.test(table), "AD — Delete absent from rows");
assert.ok(!/archiveProductAction|deleteProductPermanentlyAction/.test(card));
assert.ok(!/archiveProductAction|deleteProductPermanentlyAction/.test(table));

assert.ok(/Archivados/.test(toolbar), "archived filter option");
assert.ok(/Disponibles/.test(toolbar), "availability copy Disponibles");
assert.ok(/No disponibles/.test(toolbar), "availability copy No disponibles");
assert.ok(/Disponible/.test(availabilityToggle), "toggle label Disponible");

assert.ok(
  /No hay productos activos en tu catálogo/.test(emptyState),
  "only-archived empty copy"
);
assert.ok(/Ver archivados/.test(emptyState), "discover archived path");
assert.ok(!/archiveProductAction|Gestión del producto/.test(createForm), "Create unchanged");

// AE/AF/AG — dirty lifecycle
assert.ok(/requestLifecycleAction/.test(editForm), "AE — lifecycle intent owner");
assert.ok(/discardIntentRef/.test(editForm), "AE — discard intent");
assert.ok(/resetDraftToPersistedBaseline/.test(editForm), "AE — whole-draft discard");
assert.ok(
  /if \(isDirtyRef\.current\)[\s\S]*discardIntentRef/.test(editForm),
  "AG — dirty blocks lifecycle network until discard"
);
assert.ok(
  /intent === "close"[\s\S]*commitClose|commitClose\?\.\(\)/.test(editForm),
  "close vs lifecycle discard paths"
);
assert.ok(!/window\.confirm/.test(editForm), "no window.confirm");
assert.ok(/Archivar producto/.test(editForm), "archive confirm title");
assert.ok(
  /catálogo|restaurarlo|conservarán|conservar/i.test(editForm),
  "archive confirm reversible wording"
);
assert.ok(
  /permanente|no se puede deshacer|No se puede deshacer|irreversible|no se puede revertir/i.test(
    editForm
  ),
  "delete confirm irreversible"
);

console.log("admin-products-product-removal-lifecycle-implementation.verify.ts: PASS");

// ---------------------------------------------------------------------------
// Mutation probes A–H (local temp only; restore after each)
// ---------------------------------------------------------------------------

function withTempMutation(rel: string, mutate: (src: string) => string, probe: () => void) {
  const full = path.join(ROOT, rel);
  const original = readFileSync(full, "utf8");
  try {
    writeFileSync(full, mutate(original), "utf8");
    let failed = false;
    try {
      probe();
    } catch {
      failed = true;
    }
    assert.ok(failed, `probe against ${rel} must FAIL while mutated`);
  } finally {
    writeFileSync(full, original, "utf8");
  }
}

function runVerifyCore(): void {
  // Re-read and assert a cheap subset that each probe targets.
  const a = read("lib/products/admin.ts");
  const act = read("app/admin/(protected)/products/actions.ts");
  const img = read("lib/products/product-image-storage.ts");
  const edit = read("components/admin/products/edit-product-form.tsx");

  const getAdminProducts = a.slice(
    a.indexOf("export async function getAdminProducts"),
    a.indexOf("export async function getAdminProductsCatalogCount")
  );
  assert.ok(/else \{\s*query = query\.is\("archived_at", null\)/.test(getAdminProducts) || /\.is\("archived_at", null\)/.test(getAdminProducts));

  const saveIdx = act.indexOf("export async function saveProductEditDraftAction");
  const saveBody = act.slice(saveIdx, saveIdx + 2200);
  assert.ok(/El producto está archivado\. Restáuralo para editarlo\./.test(saveBody));

  const delIdx = act.indexOf("export async function deleteProductPermanentlyAction");
  const delBody = act.slice(delIdx, delIdx + 2800);
  assert.ok(/delete_product_permanently/.test(delBody));
  assert.ok(!/\.from\("products"\)\s*\.delete\(/.test(delBody));

  const cleanup = img.slice(img.indexOf("export async function removeProductImageIfUnreferenced"));
  assert.ok(!/\.is\("archived_at"/.test(cleanup.slice(0, 900)));

  const restoreIdx = act.indexOf("export async function restoreProductAction");
  const restoreBody = act.slice(restoreIdx, restoreIdx + 1800);
  assert.ok(/is_available:\s*false/.test(restoreBody));

  assert.ok(/!isArchived/.test(edit) && /Guardar cambios/.test(edit));
  assert.ok(/requestLifecycleAction/.test(edit) && /isDirtyRef\.current/.test(edit));

  const manual = a.slice(a.indexOf("export async function getManualOrderProductOptions"));
  assert.ok(/\.is\("archived_at", null\)/.test(manual.slice(0, 900)));
}

if (process.env.RUN_LIFECYCLE_PROBES === "1") {
  // PROBE A — remove default archived_at IS NULL
  withTempMutation(
    "lib/products/admin.ts",
    (src) =>
      src.replace(
        /query = query\.is\("archived_at", null\);\s*if \(status === "active"\)/,
        '/* PROBE_A */ if (status === "active")'
      ),
    () => {
      const a = read("lib/products/admin.ts");
      const getAdminProducts = a.slice(
        a.indexOf("export async function getAdminProducts"),
        a.indexOf("export async function getAdminProductsCatalogCount")
      );
      assert.ok(
        /query = query\.is\("archived_at", null\);\s*if \(status === "active"\)/.test(
          getAdminProducts
        )
      );
    }
  );

  // PROBE B — remove archived guard from saveProductEditDraftAction only
  withTempMutation(
    "app/admin/(protected)/products/actions.ts",
    (src) => {
      const start = src.indexOf("export async function saveProductEditDraftAction");
      const end = src.indexOf("export async function archiveProductAction");
      assert.ok(start >= 0 && end > start);
      const head = src.slice(0, start);
      const body = src.slice(start, end).replace(
        /if \(currentProduct\.archived_at != null\) \{\s*return \{\s*error: "El producto está archivado\. Restáuralo para editarlo\."\s*\};\s*\}/,
        "/* PROBE_B_REMOVED */"
      );
      return head + body + src.slice(end);
    },
    () => {
      const act = read("app/admin/(protected)/products/actions.ts");
      const saveBody = act.slice(
        act.indexOf("export async function saveProductEditDraftAction"),
        act.indexOf("export async function archiveProductAction")
      );
      assert.ok(/El producto está archivado\. Restáuralo para editarlo\./.test(saveBody));
    }
  );

  // PROBE C — break RPC name
  withTempMutation(
    "app/admin/(protected)/products/actions.ts",
    (src) => {
      const start = src.indexOf("export async function deleteProductPermanentlyAction");
      assert.ok(start >= 0);
      const head = src.slice(0, start);
      const body = src
        .slice(start)
        .replaceAll("delete_product_permanently", "PROBE_C_RAW_DELETE");
      return head + body;
    },
    () => {
      const act = read("app/admin/(protected)/products/actions.ts");
      const delBody = act.slice(
        act.indexOf("export async function deleteProductPermanentlyAction")
      );
      assert.ok(/delete_product_permanently/.test(delBody));
      assert.ok(!/\.from\("products"\)\s*\.delete\(/.test(delBody));
    }
  );

  // PROBE D — shared-ref excludes archived
  withTempMutation(
    "lib/products/product-image-storage.ts",
    (src) =>
      src.replace(
        /\.not\("image_url", "is", null\);/,
        '.not("image_url", "is", null).is("archived_at", null);'
      ),
    () => {
      const img = read("lib/products/product-image-storage.ts");
      const cleanup = img.slice(
        img.indexOf("export async function removeProductImageIfUnreferenced")
      );
      assert.ok(!/\.is\("archived_at"/.test(cleanup.slice(0, 900)));
    }
  );

  // PROBE E — restore republishes
  withTempMutation(
    "app/admin/(protected)/products/actions.ts",
    (src) => {
      const start = src.indexOf("export async function restoreProductAction");
      const end = src.indexOf("export async function deleteProductPermanentlyAction");
      assert.ok(start >= 0 && end > start);
      const head = src.slice(0, start);
      const body = src.slice(start, end).replace(
        /archived_at: null,\s*is_available: false/,
        "archived_at: null,\n        is_available: true"
      );
      return head + body + src.slice(end);
    },
    () => {
      const act = read("app/admin/(protected)/products/actions.ts");
      const restoreBody = act.slice(
        act.indexOf("export async function restoreProductAction"),
        act.indexOf("export async function deleteProductPermanentlyAction")
      );
      assert.ok(/is_available:\s*false/.test(restoreBody));
    }
  );

  // PROBE F — archived UI always shows Save
  withTempMutation(
    "components/admin/products/edit-product-form.tsx",
    (src) => src.replace("{!isArchived ? (", "{true ? ("),
    () => {
      const edit = read("components/admin/products/edit-product-form.tsx");
      assert.ok(/\{!isArchived \?/.test(edit));
    }
  );

  // PROBE G — manual order drops archived filter
  withTempMutation(
    "lib/products/admin.ts",
    (src) => {
      const start = src.indexOf("export async function getManualOrderProductOptions");
      const end = src.indexOf("export async function getAdminProductById");
      assert.ok(start >= 0 && end > start);
      const head = src.slice(0, start);
      const body = src
        .slice(start, end)
        .replace(/\.is\("archived_at", null\)\s*/, "");
      return head + body + src.slice(end);
    },
    () => {
      const a = read("lib/products/admin.ts");
      const manual = a.slice(
        a.indexOf("export async function getManualOrderProductOptions"),
        a.indexOf("export async function getAdminProductById")
      );
      assert.ok(/\.is\("archived_at", null\)/.test(manual));
    }
  );

  // PROBE H — allow lifecycle while dirty
  withTempMutation(
    "components/admin/products/edit-product-form.tsx",
    (src) =>
      src.replace(
        /if \(isDirtyRef\.current\) \{\s*discardIntentRef\.current = kind;/,
        "if (false) {\n      discardIntentRef.current = kind;"
      ),
    () => {
      const edit = read("components/admin/products/edit-product-form.tsx");
      assert.ok(
        /if \(isDirtyRef\.current\)[\s\S]*discardIntentRef\.current = kind/.test(edit)
      );
    }
  );

  runVerifyCore();
  console.log("lifecycle mutation probes A-H: FAIL_OK → restore PASS");
}
