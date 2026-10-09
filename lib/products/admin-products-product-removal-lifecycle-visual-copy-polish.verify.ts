/**
 * Verify ADMIN-PRODUCTS-PRODUCT-REMOVAL-LIFECYCLE-PRE-FINAL-QA-VISUAL-COPY-POLISH-1
 *
 * Run: npx tsx lib/products/admin-products-product-removal-lifecycle-visual-copy-polish.verify.ts
 * Probes: RUN_LIFECYCLE_VISUAL_PROBES=1 npx tsx …
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

const editForm = read("components/admin/products/edit-product-form.tsx");
const formCss = read("components/admin/products/product-form.module.css");
const actions = read("app/admin/(protected)/products/actions.ts");
const admin = read("lib/products/admin.ts");
const packageJson = read("package.json");

const lifecycleSection =
  editForm.match(
    /<section className=\{styles\.lifecycleSection\}[\s\S]*?<\/section>/
  )?.[0] ?? "";

assert.ok(lifecycleSection.length > 0, "lifecycle section must exist");

// A/B — compact labels in action row (not "… producto")
{
  const archiveBtn = lifecycleSection.match(
    /lifecycleArchiveButton[\s\S]*?<\/button>/
  )?.[0] ?? "";
  const deleteBtn = lifecycleSection.match(
    /lifecycleDeleteButton[\s\S]*?<\/button>/
  )?.[0] ?? "";
  const restoreBtn = lifecycleSection.match(
    /lifecycleRestoreButton[\s\S]*?<\/button>/
  )?.[0] ?? "";

  assert.ok(/<span>Archivar<\/span>/.test(archiveBtn), "A — Archivar label");
  assert.ok(!/Archivar producto/.test(archiveBtn), "A — no Archivar producto in row");
  assert.ok(/<span>Eliminar<\/span>/.test(deleteBtn), "A — Eliminar label");
  assert.ok(!/Eliminar producto/.test(deleteBtn), "A — no Eliminar producto in row");
  assert.ok(/Restaurar/.test(restoreBtn), "B — Restaurar label");
  assert.ok(!/Restaurar producto/.test(restoreBtn), "B — no Restaurar producto in row");
}

// C/D/E/F — Lucide icons + text
assert.ok(/from "lucide-react"/.test(editForm), "lucide-react import");
assert.ok(/Archive/.test(editForm) && /<Archive[\s\S]*aria-hidden="true"/.test(lifecycleSection), "C — Archive icon");
assert.ok(/Trash2/.test(editForm) && /<Trash2[\s\S]*aria-hidden="true"/.test(lifecycleSection), "D — Trash2 icon");
assert.ok(/RotateCcw/.test(editForm) && /<RotateCcw[\s\S]*aria-hidden="true"/.test(lifecycleSection), "E — RotateCcw icon");
assert.ok(/<span>Archivar<\/span>/.test(lifecycleSection) && /<span>Eliminar<\/span>/.test(lifecycleSection), "F — text retained");

// G — single-row layout owner
assert.ok(
  /\.lifecycleActions\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/.test(
    formCss
  ),
  "G — compact two-column row"
);
assert.ok(
  !/\.lifecycleActions\s*\{[\s\S]*?flex-direction:\s*column/.test(formCss),
  "G — not stacked column"
);

// H/I — Archive non-destructive vs Delete destructive
{
  const archiveCss =
    formCss.match(/\.lifecycleArchiveButton\s*\{[\s\S]*?\n\}/)?.[0] ?? "";
  const deleteCss =
    formCss.match(/\.lifecycleDeleteButton,\s*\n\.lifecycleDangerButton\s*\{[\s\S]*?\n\}/)?.[0] ??
    formCss.match(/\.lifecycleDeleteButton\s*\{[\s\S]*?\n\}/)?.[0] ??
    "";
  assert.ok(!/color-cancelled|--color-cancelled/.test(archiveCss), "H — Archive not destructive");
  assert.ok(/color-cancelled|--color-cancelled/.test(deleteCss), "I — Delete destructive");
  assert.ok(
    !/lifecycleArchiveButton[\s\S]{0,40}lifecycleDeleteButton/.test(
      formCss.match(
        /\.lifecycleArchiveButton[\s\S]*?\.lifecycleDeleteButton[\s\S]*?\{[\s\S]*?color-cancelled/
      )?.[0] ?? ""
    ) || !archiveCss.includes("color-cancelled"),
    "H — Archive class not shared with danger color block"
  );
}

// J — Archive dialog concise copy
assert.ok(/Archivar producto/.test(editForm), "archive dialog title");
assert.ok(
  /dejará de mostrarse en el catálogo/.test(editForm) &&
    /restaures/.test(editForm) &&
    /datos se conservarán/.test(editForm),
  "J — archive dialog concepts"
);
assert.ok(
  !/Se conservan datos, imagen y configuración/.test(editForm),
  "J — old verbose archive body absent"
);

// K/L — Delete dialog concise
assert.ok(/Eliminar producto/.test(editForm), "delete dialog title");
assert.ok(
  /eliminará permanentemente/.test(editForm) && /no se puede deshacer/.test(editForm),
  "K — permanent + irreversible"
);
assert.ok(
  !/stock y configuración|SKU queda libre|pedidos históricos|imagen se quita/.test(editForm),
  "L — old verbose delete enumeration absent"
);

// M — confirmation buttons short labels
assert.ok(
  /lifecycleArchiveConfirm[\s\S]*?>[\s\S]*Archivar</.test(editForm) ||
    /\{lifecyclePending \? "Archivando\.\.\." : "Archivar"\}/.test(editForm),
  "M — confirm Archivar"
);
assert.ok(
  /\{lifecyclePending \? "Eliminando\.\.\." : "Eliminar"\}/.test(editForm),
  "M — confirm Eliminar"
);

// N — no new icon package
assert.ok(/"lucide-react"/.test(packageJson), "N — lucide already present");

// O/P/Q — no domain file churn expected beyond presentation: actions/admin still export lifecycle
assert.ok(/export async function archiveProductAction/.test(actions), "O — actions still present");
assert.ok(/export async function getAdminProducts/.test(admin), "P — queries still present");
assert.ok(/requestLifecycleAction/.test(editForm), "Q — dirty lifecycle owner preserved");

// R — migration frozen
assert.equal(
  sha256File("supabase/migrations/20260916180000_products_removal_lifecycle.sql").toLowerCase(),
  EXPECTED_MIGRATION_SHA,
  "R — migration SHA unchanged"
);

// S — sticky Save ownership
assert.ok(/actionsSticky/.test(editForm) && /Guardar cambios/.test(editForm), "S — sticky Save");

// T — Advanced still draft mode; lifecycle does not own Advanced CSS
assert.ok(/mode=["']draft["']/.test(editForm), "T — Advanced draft mode");
assert.ok(
  /\.lifecycleSection[\s\S]*?border-top:\s*none/.test(formCss),
  "T/divider — lifecycle top border removed"
);

// Separator: sticky footer keeps its border
assert.ok(
  /\.actionsSticky[\s\S]*?border-top:\s*1px solid var\(--border-subtle\)/.test(formCss),
  "sticky footer boundary retained"
);

console.log(
  "admin-products-product-removal-lifecycle-visual-copy-polish.verify.ts: PASS"
);

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

if (process.env.RUN_LIFECYCLE_VISUAL_PROBES === "1") {
  // PROBE A — stacked column
  withTempMutation(
    "components/admin/products/product-form.module.css",
    (src) =>
      src.replace(
        /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/,
        "flex-direction: column;"
      ),
    () => {
      const css = read("components/admin/products/product-form.module.css");
      assert.ok(
        /\.lifecycleActions\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/.test(
          css
        )
      );
    }
  );

  // PROBE B — remove Archive icon
  withTempMutation(
    "components/admin/products/edit-product-form.tsx",
    (src) => src.replace(/<Archive aria-hidden="true"[\s\S]*?\/>/, "/* PROBE_B */"),
    () => {
      const form = read("components/admin/products/edit-product-form.tsx");
      const section =
        form.match(/<section className=\{styles\.lifecycleSection\}[\s\S]*?<\/section>/)?.[0] ??
        "";
      assert.ok(/<Archive[\s\S]*aria-hidden="true"/.test(section));
    }
  );

  // PROBE C — Archive destructive
  withTempMutation(
    "components/admin/products/product-form.module.css",
    (src) =>
      src.replace(
        /\.lifecycleArchiveButton \{\n  border: 1px solid var\(--border-subtle\);\n  background: var\(--bg-surface\);\n  color: var\(--text-primary\);\n\}/,
        `.lifecycleArchiveButton {\n  border: 1px solid var(--color-cancelled);\n  background: var(--bg-surface);\n  color: var(--color-cancelled);\n}`
      ),
    () => {
      const css = read("components/admin/products/product-form.module.css");
      const archiveCss =
        css.match(/\.lifecycleArchiveButton\s*\{[\s\S]*?\n\}/)?.[0] ?? "";
      assert.ok(!/color-cancelled|--color-cancelled/.test(archiveCss));
    }
  );

  // PROBE D — verbose delete
  withTempMutation(
    "components/admin/products/edit-product-form.tsx",
    (src) =>
      src.replace(
        /El producto se eliminará permanentemente\. Esta acción no se puede deshacer\./,
        "El producto desaparecerá del catálogo; se eliminarán su stock y configuración; el SKU queda libre; los pedidos históricos se conservan."
      ),
    () => {
      const form = read("components/admin/products/edit-product-form.tsx");
      assert.ok(!/stock y configuración|SKU queda libre|pedidos históricos/.test(form));
      assert.ok(/eliminará permanentemente/.test(form));
    }
  );

  // PROBE E — remove irreversible concept
  withTempMutation(
    "components/admin/products/edit-product-form.tsx",
    (src) =>
      src.replace(
        /El producto se eliminará permanentemente\. Esta acción no se puede deshacer\./,
        "El producto se quitará del catálogo."
      ),
    () => {
      const form = read("components/admin/products/edit-product-form.tsx");
      assert.ok(/eliminará permanentemente/.test(form) && /no se puede deshacer/.test(form));
    }
  );

  // PROBE F — reintroduce lifecycle top separator
  withTempMutation(
    "components/admin/products/product-form.module.css",
    (src) =>
      src.replace(
        /\/\* Advanced disclosure already owns the single Advanced→lifecycle boundary\. \*\/\n  border-top: none;/,
        "border-top: 1px solid var(--border-subtle);"
      ),
    () => {
      const css = read("components/admin/products/product-form.module.css");
      assert.ok(/\.lifecycleSection[\s\S]*?border-top:\s*none/.test(css));
    }
  );

  console.log("lifecycle visual mutation probes A-F: FAIL_OK → restore PASS");
}
