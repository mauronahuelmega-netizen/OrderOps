/**
 * Verify ADMIN-CATEGORIES-PUBLIC-CATALOG-ORDER-FILTER-HANDOFF-AND-REORDER-SIMPLIFICATION-1
 *
 * Run:
 *   npx tsx lib/categories/admin-categories-public-catalog-order-filter-handoff-reorder-simplification.verify.ts
 * Probes:
 *   VERIFY_PROBES=1 npx tsx lib/categories/admin-categories-public-catalog-order-filter-handoff-reorder-simplification.verify.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  CATEGORY_ORDER_HELPER_COPY,
  CATEGORY_ORDER_SUCCESS_COPY
} from "@/lib/categories/category-order-draft";

const ROOT = process.cwd();
const RUN_PROBES = process.env.VERIFY_PROBES === "1";

function read(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function flatten(s: string) {
  return s.replace(/\s+/g, " ");
}

const TOOLBAR = "components/admin/products/products-toolbar.tsx";
const MENU = "components/admin/products/compact-products-filter-menu.tsx";
const MENU_CSS = "components/admin/products/compact-products-filter-menu.module.css";
const DIALOG = "components/admin/products/category-order-dialog.tsx";
const DIALOG_CSS = "components/admin/products/category-order-dialog.module.css";
const LEGACY_DIALOG = "components/admin/products/category-filter-order-dialog.tsx";
const REFLOW = "lib/categories/category-order-reflow-motion.ts";
const DRAFT = "lib/categories/category-order-draft.ts";
const ACTIONS = "app/admin/(protected)/categories/actions.ts";
const PACKAGE_JSON = "package.json";
const DOC =
  "docs/admin-categories-public-catalog-order-filter-handoff-and-reorder-simplification-1.md";

function assertHandoffAndReorderSimplification() {
  const toolbar = read(TOOLBAR);
  const menu = read(MENU);
  const menuCss = read(MENU_CSS);
  const dialog = read(DIALOG);
  const dialogCss = read(DIALOG_CSS);
  const reflow = read(REFLOW);
  const draft = read(DRAFT);
  const actions = read(ACTIONS);
  const pkg = read(PACKAGE_JSON);
  const doc = existsSync(path.join(ROOT, DOC)) ? read(DOC) : "";

  // --- Supersession: legacy shared dialog gone ---
  assert.equal(existsSync(path.join(ROOT, LEGACY_DIALOG)), false);
  assert.match(toolbar, /CategoryOrderDialog/);
  assert.doesNotMatch(toolbar, /CategoryFilterOrderDialog/);
  assert.doesNotMatch(dialog, /mode === "filter"/);
  assert.doesNotMatch(dialog, /mode === "order"/);
  assert.doesNotMatch(dialog, /discardToFilter/);

  // --- Single logical openFilter owner ---
  assert.match(toolbar, /type OpenProductFilter/);
  assert.match(toolbar, /useState<OpenProductFilter>\(null\)/);
  assert.match(toolbar, /setOpenFilter/);
  assert.doesNotMatch(toolbar, /stockOpen|statusOpen|categoryOpen|simpleMenu/);
  assert.match(toolbar, /open=\{openFilter === "category"\}/);
  assert.match(toolbar, /open=\{openFilter === "stock"\}/);
  assert.match(toolbar, /open=\{openFilter === "status"\}/);
  assert.match(toolbar, /onRequestOpen=\{\(\) => requestOpenFilter\("category"\)\}/);
  assert.match(toolbar, /onRequestOpen=\{\(\) => requestOpenFilter\("stock"\)\}/);
  assert.match(toolbar, /onRequestOpen=\{\(\) => requestOpenFilter\("status"\)\}/);

  // --- Presence / exit: exit finish must NOT call parent close ---
  assert.match(menu, /Exit finish never calls onRequestClose/);
  assert.match(menu, /setExiting\(true\)/);
  assert.match(menu, /data-exiting=/);
  assert.match(menu, /pointerEvents:\s*"none"/);
  assert.match(menu, /data-products-filter=\{filterKey\}/);
  assert.match(menu, /closest\("\[data-products-filter\]"\)/);
  assert.doesNotMatch(
    flatten(menu),
    /exitTimerRef[\s\S]{0,200}onRequestClose\(\)/
  );

  // No sequential wait-for-exit handoff in toolbar
  assert.doesNotMatch(toolbar, /await.*close|waitForExit|setTimeout\(\s*\(\)\s*=>\s*setOpenFilter/);
  assert.doesNotMatch(toolbar, /\.click\(\)/);

  // --- Category compact filter ---
  assert.match(toolbar, /filterKey="category"/);
  assert.match(toolbar, /emptyTriggerLabel="Categorías"/);
  assert.match(toolbar, /label:\s*"Todas"/);
  assert.match(toolbar, /Ordenar categorías/);
  assert.match(toolbar, /trailingAction/);
  assert.match(toolbar, /handleFilterChange\("categoryId"/);
  assert.match(menu, /trailingAction/);
  assert.match(menu, /trailingRegion/);
  assert.match(menuCss, /\.trailingRegion/);
  assert.match(menuCss, /\.trailingAction/);
  assert.match(menuCss, /\.menuWide/);
  // Order action is NOT a listbox option
  assert.doesNotMatch(
    flatten(menu),
    /trailingAction[\s\S]{0,120}role="option"/
  );
  assert.match(menu, /role="listbox"/);
  assert.match(menu, /role="option"/);

  // --- Stock / Estado preserved compact ---
  assert.match(toolbar, /filterKey="stock"/);
  assert.match(toolbar, /filterKey="status"/);
  assert.match(toolbar, /value:\s*"out"/);
  assert.match(toolbar, /value:\s*"low"/);
  assert.match(toolbar, /value:\s*"in"/);
  assert.match(toolbar, /value:\s*"active"/);
  assert.match(toolbar, /value:\s*"inactive"/);
  assert.match(toolbar, /value:\s*"archived"/);
  assert.doesNotMatch(toolbar, /<select[\s\S]*Filtrar por stock/);
  assert.doesNotMatch(toolbar, /<select[\s\S]*Filtrar por estado/);
  assert.doesNotMatch(menu, /<dialog/);
  assert.doesNotMatch(menu, /Guardar/);
  assert.doesNotMatch(menu, /Cancelar/);

  // --- URL / page reset ---
  assert.match(toolbar, /params\.delete\("page"\)/);
  assert.match(toolbar, /handleFilterChange\("stock"/);
  assert.match(toolbar, /handleFilterChange\("status"/);
  assert.doesNotMatch(toolbar, /\.filter\(\s*\(.*product/);
  assert.doesNotMatch(menu, /\.filter\(\s*\(.*product/);

  // --- Order-only dialog: no grip / no drag ---
  assert.match(dialog, /Ordenar categorías/);
  assert.match(dialog, /CATEGORY_ORDER_HELPER_COPY/);
  assert.equal(
    CATEGORY_ORDER_HELPER_COPY,
    "Usá las flechas para definir el orden del catálogo."
  );
  assert.doesNotMatch(draft, /Arrastrá las categorías/);
  assert.doesNotMatch(dialog, /Arrastrá/);
  assert.doesNotMatch(dialog, /GripVertical/);
  assert.doesNotMatch(dialog, /setPointerCapture/);
  assert.doesNotMatch(dialog, /releasePointerCapture/);
  assert.doesNotMatch(dialog, /elementFromPoint/);
  assert.doesNotMatch(dialog, /onPointerDown/);
  assert.doesNotMatch(dialog, /onPointerMove/);
  assert.doesNotMatch(dialog, /dragThreshold|draggingId|activeDrag|pointerId/);
  assert.doesNotMatch(dialogCss, /cursor:\s*grab/);
  assert.doesNotMatch(dialogCss, /touch-action:\s*none/);
  assert.doesNotMatch(dialogCss, /\.grip/);
  assert.doesNotMatch(dialogCss, /orderRowDragging|gripDragging|orderRowPressed/);

  // --- Move-only reorder ---
  assert.match(dialog, /Subir \$\{category\.name\}/);
  assert.match(dialog, /Bajar \$\{category\.name\}/);
  assert.match(dialog, /handleMove/);
  assert.match(dialog, /moveCategoryInOrder/);
  assert.match(dialog, /disabled=\{pending \|\| membershipStale \|\| isFirst\}/);
  assert.match(dialog, /disabled=\{pending \|\| membershipStale \|\| isLast\}/);
  assert.match(dialogCss, /min-height:\s*3\.125rem/);
  assert.match(dialogCss, /min-width:\s*2\.75rem/);
  assert.match(dialogCss, /min-height:\s*2\.75rem/);
  assert.match(dialogCss, /grid-template-columns:\s*minmax\(0,\s*1fr\)\s*auto/);

  // --- Reflow motion preserved (move-driven) ---
  assert.match(dialog, /captureReflowSnapshot/);
  assert.match(dialog, /animateCategoryRowReflow\(list, previousTops\)/);
  assert.match(reflow, /prefersCategoryOrderReducedMotion/);
  assert.match(reflow, /\.animate\(/);
  assert.match(reflow, /160/);
  assert.doesNotMatch(reflow, /activeId|draggingId/);
  assert.doesNotMatch(pkg, /"framer-motion"/);
  assert.doesNotMatch(pkg, /"@dnd-kit/);

  // --- Cancel / Escape = discard + close (no Filter mode) ---
  assert.match(dialog, /discardAndClose/);
  assert.match(dialog, /addEventListener\("cancel"/);
  assert.match(dialog, /onClose\(\)/);
  assert.doesNotMatch(dialog, /setMode\(|mode:\s*"filter"/);

  // --- Draft / Save freeze ---
  assert.match(dialog, /const dirty = isCategoryOrderDirty\(persistedOrder, draftOrder\)/);
  assert.match(
    dialog,
    /const saveEnabled = dirty && !pending && !membershipStale && draftOrder\.length >= 2;/
  );
  assert.match(dialog, /disabled=\{!saveEnabled\}/);
  assert.match(dialog, /saveCategoryDisplayOrderAction/);
  assert.match(dialog, /orderedCategoryIds:\s*draftOrder/);
  assert.equal(CATEGORY_ORDER_SUCCESS_COPY, "Orden de categorías guardado.");
  assert.match(actions, /export async function saveCategoryDisplayOrderAction/);
  assert.match(actions, /save_category_display_order/);
  assert.match(actions, /p_ordered_category_ids/);
  assert.doesNotMatch(dialog, /\.update\(\s*\{\s*position/);
  assert.doesNotMatch(
    flatten(actions),
    /saveCategoryDisplayOrderAction[\s\S]{0,1200}\.from\("categories"\)\.update\(\s*\{\s*position/
  );

  // --- Docs supersession labels ---
  if (doc) {
    assert.match(doc, /SUPERSEDED/);
    assert.match(doc, /Usá las flechas para definir el orden del catálogo/);
    assert.doesNotMatch(
      doc.split("## ")[0] + (doc.match(/# Result[\s\S]*?(?=\n## )/)?.[0] ?? ""),
      /Arrastrá las categorías para definir el orden del catálogo/
    );
  }
}

assertHandoffAndReorderSimplification();

function withTempMutation(rel: string, mutate: (src: string) => string, probe: () => void) {
  const abs = path.join(ROOT, rel);
  const original = readFileSync(abs, "utf8");
  try {
    writeFileSync(abs, mutate(original), "utf8");
    let failed = false;
    try {
      probe();
    } catch {
      failed = true;
    }
    assert.ok(failed, `probe against ${rel} must FAIL while mutated`);
  } finally {
    writeFileSync(abs, original, "utf8");
  }
}

if (RUN_PROBES) {
  // A. restore Category filtering to dialog-ish toolbar import
  withTempMutation(
    TOOLBAR,
    (src) =>
      src.replace(
        /import CategoryOrderDialog from "@\/components\/admin\/products\/category-order-dialog";/,
        `import CategoryFilterOrderDialog from "@/components/admin/products/category-filter-order-dialog";`
      ),
    () => {
      assert.match(read(TOOLBAR), /CategoryOrderDialog/);
      assert.doesNotMatch(read(TOOLBAR), /CategoryFilterOrderDialog/);
    }
  );

  // B. re-add GripVertical
  withTempMutation(
    DIALOG,
    (src) => `${src}\nconst __probeGrip = GripVertical;\n`,
    () => {
      assert.doesNotMatch(read(DIALOG), /GripVertical/);
    }
  );

  // C. re-add pointer drag path
  withTempMutation(
    DIALOG,
    (src) =>
      src.replace(
        /const handleMove =/,
        `const handleGripPointerMove = () => { elementFromPoint; setPointerCapture; };\n  const handleMove =`
      ),
    () => {
      assert.doesNotMatch(read(DIALOG), /setPointerCapture/);
      assert.doesNotMatch(read(DIALOG), /elementFromPoint/);
    }
  );

  // D. remove Subir
  withTempMutation(
    DIALOG,
    (src) => src.replace(/Subir \$\{category\.name\}/g, "Mover arriba ${category.name}"),
    () => {
      assert.match(read(DIALOG), /Subir \$\{category\.name\}/);
    }
  );

  // E. remove Bajar
  withTempMutation(
    DIALOG,
    (src) => src.replace(/Bajar \$\{category\.name\}/g, "Mover abajo ${category.name}"),
    () => {
      assert.match(read(DIALOG), /Bajar \$\{category\.name\}/);
    }
  );

  // F. restore old Arrastrá helper
  withTempMutation(
    DRAFT,
    (src) =>
      src.replace(
        'Usá las flechas para definir el orden del catálogo.',
        "Arrastrá las categorías para definir el orden del catálogo."
      ),
    () => {
      assert.equal(
        read(DRAFT).includes("Usá las flechas para definir el orden del catálogo."),
        true
      );
      assert.equal(read(DRAFT).includes("Arrastrá las categorías"), false);
    }
  );

  // G. make Category order action a listbox filter option
  withTempMutation(
    MENU,
    (src) =>
      src.replace(
        /className=\{styles\.trailingAction\}/,
        `role="option" aria-selected={false} className={styles.trailingAction}`
      ),
    () => {
      assert.doesNotMatch(
        flatten(read(MENU)),
        /trailingAction[\s\S]{0,80}role="option"/
      );
      assert.doesNotMatch(
        flatten(read(MENU)),
        /role="option" aria-selected=\{false\} className=\{styles\.trailingAction\}/
      );
    }
  );

  // H. use three independent open booleans
  withTempMutation(
    TOOLBAR,
    (src) =>
      src.replace(
        /const \[openFilter, setOpenFilter\] = useState<OpenProductFilter>\(null\);/,
        `const [stockOpen, setStockOpen] = useState(false);\n  const [statusOpen, setStatusOpen] = useState(false);\n  const [categoryOpen, setCategoryOpen] = useState(false);`
      ),
    () => {
      assert.match(read(TOOLBAR), /useState<OpenProductFilter>\(null\)/);
      assert.doesNotMatch(read(TOOLBAR), /stockOpen|statusOpen|categoryOpen/);
    }
  );

  // I. sequential wait-for-exit handoff
  withTempMutation(
    TOOLBAR,
    (src) =>
      src.replace(
        /const requestOpenFilter = useCallback\(\(key: Exclude<OpenProductFilter, null>\) => \{\s*setOpenFilter\(key\);\s*\}, \[\]\);/,
        `const requestOpenFilter = useCallback((key: Exclude<OpenProductFilter, null>) => {\n    setOpenFilter(null);\n    setTimeout(() => setOpenFilter(key), 120);\n  }, []);`
      ),
    () => {
      assert.doesNotMatch(read(TOOLBAR), /setTimeout\(\s*\(\)\s*=>\s*setOpenFilter/);
      assert.match(
        read(TOOLBAR),
        /const requestOpenFilter = useCallback\(\(key: Exclude<OpenProductFilter, null>\) => \{\s*setOpenFilter\(key\);\s*\}, \[\]\);/
      );
    }
  );

  // J. change stock URL value
  withTempMutation(
    TOOLBAR,
    (src) => src.replace(/value:\s*"low"/, 'value: "bajo"'),
    () => {
      assert.match(read(TOOLBAR), /value:\s*"low"/);
    }
  );

  // K. remove page reset
  withTempMutation(
    TOOLBAR,
    (src) => src.replace(/params\.delete\("page"\);/, ""),
    () => {
      assert.match(read(TOOLBAR), /params\.delete\("page"\)/);
    }
  );

  // L. change Save action/RPC
  withTempMutation(
    ACTIONS,
    (src) => src.replace(/save_category_display_order/g, "save_category_order_v2"),
    () => {
      assert.match(read(ACTIONS), /save_category_display_order/);
    }
  );

  assertHandoffAndReorderSimplification();
  console.log("filter-handoff + reorder simplification mutation probes A-L: FAIL_OK → restore PASS");
}

console.log(
  "PASS — admin-categories-public-catalog-order-filter-handoff-reorder-simplification.verify.ts"
);
