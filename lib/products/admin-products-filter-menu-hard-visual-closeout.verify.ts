/**
 * Verify ADMIN-PRODUCTS-FILTER-MENU-HARD-VISUAL-CLOSEOUT-1
 *
 * Run:
 *   npx tsx lib/products/admin-products-filter-menu-hard-visual-closeout.verify.ts
 * Probes:
 *   VERIFY_PROBES=1 npx tsx lib/products/admin-products-filter-menu-hard-visual-closeout.verify.ts
 */
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

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
const ACTIONS = "app/admin/(protected)/categories/actions.ts";
const ORDER_DIALOG = "components/admin/products/category-order-dialog.tsx";

function assertVisualCloseout() {
  const toolbar = read(TOOLBAR);
  const menu = read(MENU);
  const css = read(MENU_CSS);
  const actions = read(ACTIONS);
  const orderDialog = read(ORDER_DIALOG);

  // Architecture freeze
  assert.match(toolbar, /type OpenProductFilter/);
  assert.match(toolbar, /useState<OpenProductFilter>\(null\)/);
  assert.match(toolbar, /filterKey="category"/);
  assert.match(toolbar, /filterKey="stock"/);
  assert.match(toolbar, /filterKey="status"/);
  assert.match(toolbar, /Ordenar categorías/);
  assert.match(toolbar, /trailingAction/);
  assert.doesNotMatch(toolbar, /<select[\s\S]*Filtrar por stock/);
  assert.doesNotMatch(toolbar, /<select[\s\S]*Filtrar por estado/);
  assert.doesNotMatch(menu, /<dialog/);
  assert.doesNotMatch(menu, /Guardar/);
  assert.doesNotMatch(menu, /Cancelar/);

  // Trailing action: not option, text-only, available
  assert.match(menu, /styles\.trailingAction/);
  assert.match(menu, /trailingRegion/);
  assert.doesNotMatch(
    flatten(menu),
    /trailingAction[\s\S]{0,160}role="option"/
  );
  assert.doesNotMatch(
    flatten(menu),
    /className=\{styles\.trailingAction\}[\s\S]{0,120}aria-selected/
  );
  assert.doesNotMatch(menu, /disabled=\{[^}]*trailing/);
  // No decorative icon inside trailing action button body
  assert.doesNotMatch(
    flatten(menu),
    /className=\{styles\.trailingAction\}[\s\S]{0,200}<(Grip|Settings|Sliders|Chevron|Arrow|Sort)/
  );
  assert.match(
    flatten(menu),
    /className=\{styles\.trailingAction\}[\s\S]{0,280}\{trailingAction\.label\}/
  );

  // Trailing action CSS: primary text family, not muted/disabled; touch height
  assert.match(css, /\.trailingAction\s*\{/);
  assert.match(css, /color:\s*var\(--text-primary\)/);
  assert.doesNotMatch(
    css.match(/\.trailingAction\s*\{[\s\S]*?\n\}/)?.[0] ?? "",
    /--text-tertiary|--text-muted|opacity:\s*0\.[0-6]|cursor:\s*not-allowed/
  );
  assert.doesNotMatch(
    css.match(/\.trailingAction\s*\{[\s\S]*?\n\}/)?.[0] ?? "",
    /color:\s*var\(--text-secondary\)/
  );
  assert.match(
    css.match(/\.trailingAction\s*\{[\s\S]*?\n\}/)?.[0] ?? "",
    /min-height:\s*2\.75rem/
  );
  assert.match(css, /font-weight:\s*500/);
  assert.match(css, /\.trailingRegion/);
  assert.match(css, /border-top:\s*1px solid var\(--border-subtle\)/);

  // Separator rhythm tightened (not the old 0.375+0.375 footer band)
  const trailingRegion = css.match(/\.trailingRegion\s*\{[\s\S]*?\n\}/)?.[0] ?? "";
  assert.match(trailingRegion, /margin-top:\s*0\.125rem/);
  assert.match(trailingRegion, /padding-top:\s*0\.25rem/);
  assert.doesNotMatch(trailingRegion, /margin-top:\s*0\.375rem/);
  assert.doesNotMatch(trailingRegion, /padding-top:\s*0\.375rem/);

  // Popup edge: 1px border + contact + floating
  const shell = css.match(/\.menuShell\s*\{[\s\S]*?\n\}/)?.[0] ?? "";
  assert.match(shell, /border:\s*1px solid/);
  assert.match(shell, /var\(--shadow-sm\)/);
  assert.match(shell, /var\(--shadow-floating\)/);
  assert.doesNotMatch(shell, /border:\s*[2-9]px/);

  // Selected state freeze (no checkmarks)
  assert.match(css, /\.optionSelected/);
  assert.match(css, /inset 3px 0 0/);
  assert.doesNotMatch(menu, /Check|Checkmark|✓/);
  assert.doesNotMatch(css, /content:\s*["'].*✓|checkmark/i);

  // Width architecture freeze
  assert.match(css, /\.menuWide/);
  assert.match(toolbar, /menuWide/);
  assert.match(toolbar, /menuAlign="end"/);

  // URL / page freeze
  assert.match(toolbar, /params\.delete\("page"\)/);
  assert.match(toolbar, /handleFilterChange\("categoryId"/);
  assert.match(toolbar, /handleFilterChange\("stock"/);
  assert.match(toolbar, /handleFilterChange\("status"/);
  assert.match(toolbar, /value:\s*"out"/);
  assert.match(toolbar, /value:\s*"low"/);
  assert.match(toolbar, /value:\s*"in"/);
  assert.match(toolbar, /value:\s*"active"/);
  assert.match(toolbar, /value:\s*"inactive"/);
  assert.match(toolbar, /value:\s*"archived"/);
  assert.doesNotMatch(toolbar, /\.filter\(\s*\(.*product/);

  // Category Order / action freeze
  assert.match(orderDialog, /saveCategoryDisplayOrderAction/);
  assert.match(actions, /save_category_display_order/);
  assert.match(actions, /p_ordered_category_ids/);
  assert.doesNotMatch(orderDialog, /GripVertical/);
}

assertVisualCloseout();

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
  // A. disabled-looking trailing color
  withTempMutation(
    MENU_CSS,
    (src) => src.replace(/--text-primary\)/g, "--text-tertiary)"),
    () => {
      assert.match(
        read(MENU_CSS).match(/\.trailingAction\s*\{[\s\S]*?\n\}/)?.[0] ?? "",
        /color:\s*var\(--text-primary\)/
      );
    }
  );

  // B. trailing <44px
  withTempMutation(
    MENU_CSS,
    (src) =>
      src.replace(
        /(\.trailingAction\s*\{[\s\S]*?)min-height:\s*2\.75rem;/,
        "$1min-height: 2rem;"
      ),
    () => {
      assert.match(
        read(MENU_CSS).match(/\.trailingAction\s*\{[\s\S]*?\n\}/)?.[0] ?? "",
        /min-height:\s*2\.75rem/
      );
    }
  );

  // C. role=option on trailing
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
        /role="option" aria-selected=\{false\} className=\{styles\.trailingAction\}/
      );
    }
  );

  // D. icon on trailing action
  withTempMutation(
    MENU,
    (src) =>
      src.replace(
        /\{trailingAction\.label\}/,
        `<Settings aria-hidden="true" />{trailingAction.label}`
      ),
    () => {
      assert.doesNotMatch(
        flatten(read(MENU)),
        /className=\{styles\.trailingAction\}[\s\S]{0,200}<Settings/
      );
    }
  );

  // E. remove separator
  withTempMutation(
    MENU_CSS,
    (src) => src.replace(/border-top:\s*1px solid var\(--border-subtle\);/, ""),
    () => {
      assert.match(read(MENU_CSS), /border-top:\s*1px solid var\(--border-subtle\)/);
    }
  );

  // F. change Category menu width architecture
  withTempMutation(
    MENU_CSS,
    (src) => src.replace(/\.menuWide\s*\{[\s\S]*?\n\}/, ".menuWide {\n  min-width: 100%;\n}"),
    () => {
      assert.match(read(MENU_CSS), /min-width:\s*max\(100%,\s*15rem\)/);
    }
  );

  // G. checkmark selected state
  withTempMutation(
    MENU,
    (src) =>
      src.replace(
        /\{option\.label\}/,
        `{isSelected ? "✓ " : ""}{option.label}`
      ),
    () => {
      assert.doesNotMatch(read(MENU), /✓/);
    }
  );

  // H. native Stock select
  withTempMutation(
    TOOLBAR,
    (src) =>
      src.replace(
        /<CompactProductsFilterMenu[\s\S]*?filterKey="stock"[\s\S]*?\/>/,
        `<select aria-label="Filtrar por stock" value={stock} onChange={(e) => handleFilterChange("stock", e.target.value)}><option value="">Stock</option></select>`
      ),
    () => {
      assert.doesNotMatch(read(TOOLBAR), /<select[\s\S]*Filtrar por stock/);
      assert.match(read(TOOLBAR), /filterKey="stock"/);
    }
  );

  // I. native Estado select
  withTempMutation(
    TOOLBAR,
    (src) =>
      src.replace(
        /<CompactProductsFilterMenu[\s\S]*?filterKey="status"[\s\S]*?\/>/,
        `<select aria-label="Filtrar por estado" value={status} onChange={(e) => handleFilterChange("status", e.target.value)}><option value="">Estado</option></select>`
      ),
    () => {
      assert.doesNotMatch(read(TOOLBAR), /<select[\s\S]*Filtrar por estado/);
      assert.match(read(TOOLBAR), /filterKey="status"/);
    }
  );

  // J. URL filter value contract
  withTempMutation(
    TOOLBAR,
    (src) => src.replace(/value:\s*"low"/, 'value: "bajo"'),
    () => {
      assert.match(read(TOOLBAR), /value:\s*"low"/);
    }
  );

  assertVisualCloseout();
  console.log("filter-menu hard visual closeout probes A-J: FAIL_OK → restore PASS");
}

console.log("PASS — admin-products-filter-menu-hard-visual-closeout.verify.ts");
