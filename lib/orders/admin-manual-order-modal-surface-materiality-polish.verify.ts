/**
 * Source contracts for ADMIN-MANUAL-ORDER-MODAL-SURFACE-MATERIALITY-POLISH-1.
 *
 * Scope: feature-local surface/material hierarchy for the manual order modal
 * (P2-1, P2-3, P2-4, P2-7, P2-16). Asserts the three-level material scale
 * exists in both feature CSS modules, that selected states speak one accent
 * family while --focus stays reserved for keyboard focus, and that shared
 * globals/tokens/primitives/shell, validation, pricing, the closed P1 guards,
 * the ticket hierarchy, the CTA/footer treatment, the single-scroll owner and
 * the deferred tap targets are all untouched.
 *
 * Run: npx tsx lib/orders/admin-manual-order-modal-surface-materiality-polish.verify.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

/** Comment-free view, so contract checks can't be satisfied by prose. */
function code(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

/** Body of a single top-level rule, comments stripped. */
function rule(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\n\\}`));
  assert.ok(match, `Expected to locate the ${selector} rule`);
  return code(match[1]);
}

const modalCss = read("components/admin/orders/manual-order-modal.module.css");
const panelCss = read("components/admin/orders/manual-order-customization-panel.module.css");
const modal = read("components/admin/orders/manual-order-modal.tsx");
const panel = read("components/admin/orders/manual-order-customization-panel.tsx");
const globals = read("app/globals.css");
const tokens = read("app/theme-tokens.css");
const button = read("components/ui/Button.tsx");
const shell = read("components/admin/orders/admin-order-modal-shell.tsx");
const shellCss = read("components/admin/orders/admin-order-modal.module.css");
const actions = read("app/admin/(protected)/orders/actions.ts");
const ticket = read("lib/orders/manual-order-customization-ticket.ts");

const modalCssCode = code(modalCss);
const panelCssCode = code(panelCss);
const modalCode = code(modal);

/* ------------------------------------------------------------------------- */
/* 1. Three-level material scale declared feature-locally                     */
/* ------------------------------------------------------------------------- */

const MATERIAL_VARS = [
  "--mo-surface-section",
  "--mo-surface-row",
  "--mo-border-section",
  "--mo-border-row",
  "--mo-shadow-section",
  "--mo-selected-border",
  "--mo-selected-surface",
  "--mo-text-aux"
];

const modalScale = rule(modalCss, ".manual-order-modal__form");
for (const token of MATERIAL_VARS) {
  assert.equal(
    modalScale.includes(`${token}:`),
    true,
    `The modal must declare ${token} on its own root, not globally`
  );
}

const panelScale = rule(panelCss, ".panel");
for (const token of MATERIAL_VARS) {
  assert.equal(
    panelScale.includes(`${token}:`),
    true,
    `The configurator must redeclare ${token} so it is self-sufficient`
  );
}

/* Rows must be mixed toward the soft surface so one formula serves both themes. */
for (const [label, scale] of [
  ["modal", modalScale],
  ["configurator", panelScale]
] as const) {
  assert.equal(
    /--mo-surface-row:\s*color-mix\(in srgb, var\(--bg-surface-soft\)[^;]*var\(--bg-surface\)\)/.test(
      scale
    ),
    true,
    `${label} row surface must be derived from --bg-surface-soft over --bg-surface`
  );
  assert.equal(
    /--mo-surface-section:\s*var\(--bg-surface\)/.test(scale),
    true,
    `${label} section surface must be the plain semantic surface token`
  );
}

/* ------------------------------------------------------------------------- */
/* 2. Section cards (level 1) consume the scale                               */
/* ------------------------------------------------------------------------- */

const SECTION_RULES: Array<[string, string]> = [
  ["components/admin/orders/manual-order-modal.module.css", ".manual-order-modal__customer-strip"],
  ["components/admin/orders/manual-order-modal.module.css", ".manual-order-modal__products-panel"],
  ["components/admin/orders/manual-order-modal.module.css", ".manual-order-modal__summary-panel"],
  ["components/admin/orders/manual-order-customization-panel.module.css", ".group"],
  ["components/admin/orders/manual-order-customization-panel.module.css", ".quantitySection"]
];

for (const [file, selector] of SECTION_RULES) {
  const css = file.includes("customization-panel") ? panelCss : modalCss;
  const body = rule(css, selector);
  assert.equal(
    body.includes("--mo-surface-section"),
    true,
    `${selector} must use the level 1 section surface`
  );
  assert.equal(
    body.includes("--mo-border-section"),
    true,
    `${selector} must use the level 1 section border`
  );
  assert.equal(
    body.includes("--mo-shadow-section"),
    true,
    `${selector} must use the shared soft section shadow`
  );
}

/* ------------------------------------------------------------------------- */
/* 3. Inner rows / inputs (level 2) consume the scale — P2-16                 */
/* ------------------------------------------------------------------------- */

const ROW_RULES: Array<[string, string]> = [
  ["modal", ".manual-order-modal__product-row"],
  ["modal", ".manual-order-modal__search"],
  ["modal", ".manual-order-modal__ticket-empty"],
  ["modal", ".manual-order-modal__empty-products"],
  ["panel", ".optionButton"],
  ["panel", ".qtyOptionCard"]
];

for (const [which, selector] of ROW_RULES) {
  const body = rule(which === "panel" ? panelCss : modalCss, selector);
  assert.equal(
    /--mo-surface-row|--mo-surface-recessed/.test(body),
    true,
    `${selector} must sit on a level 2 surface`
  );
  assert.equal(
    /--mo-border-row/.test(body),
    true,
    `${selector} must carry a perceptible level 2 hairline`
  );
}

const customerInput = rule(
  modalCss,
  ".manual-order-modal__customer-strip :global(.admin-field) input"
);
assert.equal(
  customerInput.includes("--mo-surface-row") && customerInput.includes("--mo-border-row"),
  true,
  "Customer inputs must be recessed against the section card"
);
const notes = rule(modalCss, ".manual-order-modal__notes-field textarea");
assert.equal(
  notes.includes("--mo-surface-row") && notes.includes("--mo-border-row"),
  true,
  "The notes textarea must use the same level 2 input surface"
);

/* Product rows must no longer be borderless (the P2-1 affordance inversion). */
const productRow = rule(modalCss, ".manual-order-modal__product-row");
assert.equal(
  /border:\s*1px solid transparent/.test(productRow),
  false,
  "Simple product rows must not fall back to a transparent border"
);
assert.equal(
  /border:\s*1px solid/.test(productRow),
  true,
  "Product row border width must stay 1px so row geometry is unchanged"
);

/* Configurable rows share the base and only add a quiet accent hint. */
const configurableRow = rule(modalCss, ".manual-order-modal__product-row--configurable");
assert.equal(
  /--mo-accent-hint-border|--mo-accent-hint-surface/.test(configurableRow),
  true,
  "Configurable rows must add only the quiet accent hint over the shared base"
);
assert.equal(
  /background:\s*var\(--accent-primary\)|background:\s*var\(--color-primary\)/.test(
    configurableRow
  ),
  false,
  "Configurable rows must not become a solid accent CTA"
);

/* ------------------------------------------------------------------------- */
/* 4. Segmented control — surface only, no sizing change                      */
/* ------------------------------------------------------------------------- */

const segmentTrack = rule(modalCss, ".manual-order-modal__delivery-options");
assert.equal(
  /--mo-surface-recessed/.test(segmentTrack),
  true,
  "The segmented track must read as a recessed surface"
);
const segmentOption = rule(modalCss, ".manual-order-modal__delivery-option");
const segmentHeight = segmentOption.match(/min-height:\s*(\d+)px/)?.[1];
assert.equal(
  Number(segmentHeight) >= 44,
  true,
  `Segmented options must keep a hit area of at least 44px (found ${segmentHeight}px)`
);
assert.equal(
  /min-width:\s*5\.5rem/.test(segmentOption),
  true,
  "Segmented option min-width must stay unchanged"
);
const segmentActive = rule(
  modalCss,
  ".manual-order-modal__delivery-option:has(input:checked)"
);
assert.equal(
  /--mo-surface-section/.test(segmentActive),
  true,
  "The active segment must lift onto the section surface"
);
assert.equal(
  /padding:\s*5px 11px/.test(segmentActive),
  true,
  "The active segment must compensate its 1px border so the box size is unchanged"
);

/* ------------------------------------------------------------------------- */
/* 5. One accent language — P2-3                                              */
/* ------------------------------------------------------------------------- */

/* --focus may only appear in focus-visible contexts inside these modules. */
for (const [label, css] of [
  ["modal", modalCssCode],
  ["configurator", panelCssCode]
] as const) {
  const blocks = css.split(/\}/);
  for (const block of blocks) {
    if (!/var\(--focus\)/.test(block)) {
      continue;
    }
    assert.equal(
      /focus-visible|:focus\b/.test(block),
      true,
      `${label}: --focus must only style focus rings, not selected/hover surfaces — offending block: ${block
        .trim()
        .slice(0, 120)}`
    );
  }
}

const selectedRow = rule(modalCss, ".manual-order-modal__product-row--selected");
assert.equal(
  /--mo-selected-border/.test(selectedRow) && /--mo-selected-surface/.test(selectedRow),
  true,
  "Selected product rows must use the local accent-primary family"
);
const qtySelected = rule(panelCss, ".qtyOptionCardSelected");
assert.equal(
  /--mo-selected-border/.test(qtySelected) && /--mo-selected-surface/.test(qtySelected),
  true,
  "Selected quantity option cards must use the same accent family"
);
for (const [label, scale] of [
  ["modal", modalScale],
  ["configurator", panelScale]
] as const) {
  assert.equal(
    /--mo-selected-border:\s*color-mix\(in srgb, var\(--accent-primary\)/.test(scale),
    true,
    `${label} selected border must derive from --accent-primary`
  );
  assert.equal(
    /--mo-selected-surface:\s*color-mix\(in srgb, var\(--accent-soft\)/.test(scale),
    true,
    `${label} selected surface must derive from --accent-soft`
  );
}

/* Keyboard focus rings must still exist in the configurator. */
assert.equal(
  /\.optionButton:focus-visible[\s\S]{0,200}outline:\s*2px solid color-mix\(in srgb, var\(--focus\)/.test(
    panelCss
  ),
  true,
  "The configurator focus-visible ring from the previous phase must remain"
);

/* ------------------------------------------------------------------------- */
/* 6. P2-7 auxiliary contrast, applied selectively                            */
/* ------------------------------------------------------------------------- */

for (const [label, scale] of [
  ["modal", modalScale],
  ["configurator", panelScale]
] as const) {
  assert.equal(
    /--mo-text-aux:\s*color-mix\(in srgb, var\(--text-secondary\)[^;]*var\(--text-tertiary\)\)/.test(
      scale
    ),
    true,
    `${label} auxiliary text must sit between secondary and tertiary`
  );
}
assert.equal(
  rule(modalCss, ".manual-order-modal__product-blocked-hint").includes("--mo-text-aux"),
  true,
  "The configure hint carries real information and must be legible"
);
assert.equal(
  rule(modalCss, ".manual-order-modal__summary-group-label").includes("--mo-text-aux"),
  true,
  "Ticket group labels carry real information and must be legible"
);
assert.equal(
  rule(panelCss, ".basePrice").includes("--mo-text-aux"),
  true,
  "The configurator base price must be legible"
);
/* Not a blanket rewrite: primary/secondary copy must stay where it was. */
assert.equal(
  rule(modalCss, ".manual-order-modal__product-name").includes("var(--text-primary)"),
  true,
  "Product names must remain primary text"
);
assert.equal(
  rule(modalCss, ".manual-order-modal__product-category").includes("var(--text-secondary)"),
  true,
  "Product category must remain secondary text, not promoted"
);

/* ------------------------------------------------------------------------- */
/* 7. Dark handled via data-dashboard-theme, never prefers-color-scheme       */
/* ------------------------------------------------------------------------- */

for (const [label, css] of [
  ["modal", modalCssCode],
  ["configurator", panelCssCode]
] as const) {
  assert.equal(
    /@media[^{]*prefers-color-scheme/.test(css),
    false,
    `${label} must not theme the admin modal with prefers-color-scheme`
  );
  assert.equal(
    /:global\(html\[data-dashboard-theme="dark"\]\)/.test(css),
    true,
    `${label} must strengthen dark hairlines via the data-dashboard-theme hook`
  );
}

/* ------------------------------------------------------------------------- */
/* 8. No nested scroll, no fixed positioning introduced                       */
/* ------------------------------------------------------------------------- */

const mobileBlock = modalCss.match(/@media \(max-width: 899px\)\s*\{([\s\S]*?)\n\}/)?.[1];
assert.ok(mobileBlock, "The ≤899 single-scroll block must remain");
assert.equal(
  /\.manual-order-modal__body\s*\{[\s\S]*?overflow-y:\s*auto/.test(mobileBlock),
  true,
  "The modal body must remain the sole primary scroll owner at ≤899"
);
assert.equal(
  /\.manual-order-modal__products-scroll,\s*\n\s*\.manual-order-modal__summary-scroll\s*\{[\s\S]*?max-height:\s*none;[\s\S]*?overflow:\s*visible/.test(
    mobileBlock
  ),
  true,
  "Nested list panes must stay neutralised at ≤899"
);
assert.equal(
  (modalCssCode.match(/overflow-y:\s*auto/g) ?? []).length,
  2,
  "No new overflow-y: auto owner may be introduced in the modal CSS"
);
assert.equal(
  /overflow-y:\s*(auto|scroll)/.test(panelCssCode),
  false,
  "The configurator must not introduce its own scroll pane"
);
assert.equal(
  /position:\s*fixed/.test(modalCssCode) || /position:\s*fixed/.test(panelCssCode),
  false,
  "No fixed positioning may be introduced by this polish"
);

/* ------------------------------------------------------------------------- */
/* 9. Hit areas                                                               */
/* ------------------------------------------------------------------------- */

/*
 * These were pinned at their pre-44px values while the tap-target debt was
 * deferred. ADMIN-MANUAL-ORDER-MODAL-ACCESSIBILITY-INTERACTION-POLISH-1 closed
 * that debt, so the guard now keeps the protective intent in the other
 * direction: the controls must never shrink back below the 44px floor.
 */
const TOUCH_TARGETS: Array<[string, string]> = [
  ["modal", ".manual-order-modal__quantity-button"],
  ["modal", ".manual-order-modal__add-button"],
  ["panel", ".stepperButton"]
];

for (const [which, selector] of TOUCH_TARGETS) {
  const body = rule(which === "panel" ? panelCss : modalCss, selector);
  const width = body.match(/(?:min-)?width:\s*(\d+)px/)?.[1];
  const height = body.match(/(?:min-)?height:\s*(\d+)px/)?.[1];
  assert.ok(width && height, `${selector} must declare an explicit square hit area`);
  assert.equal(
    Number(width) >= 44 && Number(height) >= 44,
    true,
    `${selector} must keep a hit area of at least 44px (found ${width}×${height})`
  );
}
const searchHeight = rule(modalCss, ".manual-order-modal__search").match(
  /min-height:\s*(\d+)px/
)?.[1];
assert.equal(
  Number(searchHeight) >= 44,
  true,
  `Search input must keep a hit area of at least 44px (found ${searchHeight}px)`
);

/* ------------------------------------------------------------------------- */
/* 10. P1-4 row geometry intact                                               */
/* ------------------------------------------------------------------------- */

const intermediate = modalCss.match(
  /@media \(min-width: 900px\) and \(max-width: 1023px\)\s*\{([\s\S]*?)\n\}/
)?.[1];
assert.ok(intermediate, "The 900–1023 product-row block must remain");
assert.equal(
  intermediate.includes(".manual-order-modal__product-row"),
  true,
  "The intermediate range must keep re-flowing the product row"
);
assert.equal(
  /grid-template-columns:\s*minmax\(0, 1fr\)/.test(intermediate),
  true,
  "Product identity must keep the full row width in the intermediate range"
);
assert.equal(
  /grid-template-columns:\s*minmax\(0, 1fr\) auto auto/.test(productRow),
  true,
  "The base three-track product row grid must be unchanged"
);

/* ------------------------------------------------------------------------- */
/* 11. Ticket hierarchy rendering intact (previous phase frozen)              */
/* ------------------------------------------------------------------------- */

assert.equal(
  modalCode.includes("function getManualTicketSummaryGroups"),
  true,
  "The ticket summary projection must remain"
);
assert.equal(
  /×\{option\.quantity\}/.test(modalCode),
  true,
  "Explicit option quantities must remain"
);
assert.equal(
  /formatCurrency\(option\.totalPriceDelta\)/.test(modalCode),
  true,
  "Option deltas must still come from the snapshot total"
);
assert.equal(
  /displaySummary[\s\S]{0,120}?\.(split|match|replace|exec)\(/.test(modalCode),
  false,
  "displaySummary must still never be parsed"
);
for (const selector of [
  ".manual-order-modal__summary-groups",
  ".manual-order-modal__summary-option",
  ".manual-order-modal__summary-upsells",
  ".manual-order-modal__summary-actions"
]) {
  assert.equal(
    modalCss.includes(selector),
    true,
    `${selector} from the ticket hierarchy phase must remain`
  );
}
for (const selector of [
  ".manual-order-modal__summary-option",
  ".manual-order-modal__summary-child"
]) {
  assert.equal(
    /grid-template-columns:\s*minmax\(0, 1fr\) auto/.test(rule(modalCss, selector)),
    true,
    `${selector} must keep its dedicated price column`
  );
}
assert.equal(
  /justify-content:\s*space-between/.test(rule(modalCss, ".manual-order-modal__summary-actions")),
  true,
  "Quitar must stay separated from the stepper"
);

/* ------------------------------------------------------------------------- */
/* 12. CTA / footer treatment intact                                          */
/* ------------------------------------------------------------------------- */

const scopedDisabled = modalCss.match(
  /\.manual-order-modal__footer\s+\.manual-order-modal__submit-button:disabled\s*\{([\s\S]*?)\}/
)?.[1];
assert.ok(scopedDisabled, "Scoped disabled CTA rule must remain");
assert.equal(
  /opacity:\s*1\b/.test(scopedDisabled) && /cursor:\s*not-allowed/.test(scopedDisabled),
  true,
  "Disabled CTA must keep its scoped neutral treatment"
);
const footerBlock = rule(modalCss, ".manual-order-modal__footer");
assert.equal(
  /position:\s*sticky/.test(footerBlock),
  true,
  "Footer must remain sticky in flow"
);
assert.equal(
  /box-shadow:\s*0\s+-/.test(footerBlock),
  true,
  "Footer separation shadow must remain"
);
assert.equal(
  /\.manual-order-modal__footer::before\s*\{[\s\S]*?linear-gradient/.test(modalCss),
  true,
  "Footer scroll-edge fade must remain"
);
assert.equal(
  /\.manual-order-modal__submit-label\s*\{[\s\S]*?white-space:\s*nowrap/.test(modalCss),
  true,
  "Amount label must not wrap inside the CTA"
);

/* ------------------------------------------------------------------------- */
/* 13. Logic owners untouched (P1-2 / P1-3 / domain / server)                 */
/* ------------------------------------------------------------------------- */

assert.equal(
  /function getManualOrderRequiredFieldErrors\([\s\S]*?return requiredErrors;\s*\n\}/.test(
    modalCode
  ),
  true,
  "The required-field helper must remain untouched"
);
assert.equal(
  /const canSubmit =[\s\S]*?requiredFormReady/.test(modalCode),
  true,
  "canSubmit must keep depending on requiredFormReady"
);
assert.equal(
  modalCode.includes("composeScrollTopRef"),
  true,
  "P1-3 compose scroll restoration must remain"
);
assert.equal(
  /bodyRef\.current[\s\S]{0,80}scrollTop = 0/.test(modalCode),
  true,
  "P1-3 configurator scroll reset must remain"
);
assert.equal(
  panel.includes("isManualOrderCustomizationDraftValid") ||
    modalCode.includes("configureDraftValid"),
  true,
  "Configurator validity wiring must remain"
);
assert.equal(
  ticket.includes("lineTotal: line.unitPrice * line.quantity"),
  true,
  "Domain pricing must remain unchanged"
);
assert.equal(
  actions.includes("export async function createManualOrderAction"),
  true,
  "The server action must remain unchanged"
);
assert.equal(
  /supabase|create_order|migrations/.test(modalCssCode + panelCssCode),
  false,
  "CSS must not reference server or database concerns"
);

/* ------------------------------------------------------------------------- */
/* 14. Shared / global surfaces untouched                                     */
/* ------------------------------------------------------------------------- */

assert.equal(
  globals.includes("manual-order-modal"),
  false,
  "app/globals.css must not learn about the manual order modal"
);
assert.equal(
  tokens.includes("manual-order-modal"),
  false,
  "app/theme-tokens.css must not learn about the manual order modal"
);
assert.equal(
  /--mo-surface-|--mo-border-|--mo-selected-|--mo-text-aux/.test(tokens),
  false,
  "The feature-local material scale must not leak into the global tokens"
);
assert.equal(
  /--accent-primary:\s*#2563eb/.test(tokens),
  true,
  "The global accent token must remain unchanged"
);
assert.equal(
  /--focus:\s*#6366f1/.test(tokens),
  true,
  "The global focus token must remain unchanged"
);
assert.equal(
  button.includes('const classes = ["ui-button", `ui-button--${variant}`, className]'),
  true,
  "Shared Button primitive must remain unchanged"
);
assert.equal(
  shellCss.includes("manual-order-modal"),
  false,
  "Shared shell CSS must not learn about the manual order modal"
);
assert.equal(
  /--mo-surface-|--mo-border-section/.test(shellCss),
  false,
  "The shared shell must not consume the feature-local material scale"
);
assert.equal(
  shell.includes("headerMeta"),
  true,
  "The shell contract used by the modal header must remain unchanged"
);

console.log("PASS: admin-manual-order-modal-surface-materiality-polish.verify.ts");
