/**
 * Source contracts for ADMIN-MANUAL-ORDER-MODAL-ACCESSIBILITY-INTERACTION-POLISH-1.
 *
 * Scope: the deferred accessibility debt of the manual order modal — 44px touch
 * targets, keyboard focus containment, focus-visible coverage on the compose
 * controls, and an accurate close accessible name. Asserts the containment is
 * scoped to the dialog node (never the document, never background nodes), that
 * the shell's new API is opt-in and backward compatible for the order workspace
 * modal, and that Escape, P1-1..P1-4, the ticket hierarchy, the material scale,
 * validation, pricing, payload and the server stay untouched.
 *
 * Run: npx tsx lib/orders/admin-manual-order-modal-accessibility-interaction-polish.verify.ts
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

/** Largest px value declared for a dimension, honouring the min- prefix. */
function target(body: string, dimension: "width" | "height"): number {
  const values = [...body.matchAll(new RegExp(`(?:min-)?${dimension}:\\s*(\\d+)px`, "g"))].map(
    (match) => Number(match[1])
  );
  assert.ok(values.length > 0, `Expected an explicit ${dimension} declaration`);
  return Math.max(...values);
}

const modalCss = read("components/admin/orders/manual-order-modal.module.css");
const panelCss = read("components/admin/orders/manual-order-customization-panel.module.css");
const modal = read("components/admin/orders/manual-order-modal.tsx");
const panel = read("components/admin/orders/manual-order-customization-panel.tsx");
const shell = read("components/admin/orders/admin-order-modal-shell.tsx");
const shellCss = read("components/admin/orders/admin-order-modal.module.css");
const workspaceModal = read("components/admin/orders/admin-order-workspace-modal.tsx");
const globals = read("app/globals.css");
const tokens = read("app/theme-tokens.css");
const button = read("components/ui/Button.tsx");
const actions = read("app/admin/(protected)/orders/actions.ts");
const ticket = read("lib/orders/manual-order-customization-ticket.ts");

const modalCode = code(modal);
const shellCode = code(shell);
const modalCssCode = code(modalCss);
const panelCssCode = code(panelCss);

/* ------------------------------------------------------------------------- */
/* 1. Touch targets — every interactive control reaches 44px                  */
/* ------------------------------------------------------------------------- */

const SQUARE_TARGETS: Array<[string, string, string]> = [
  ["compose add button", "modal", ".manual-order-modal__add-button"],
  ["ticket stepper", "modal", ".manual-order-modal__quantity-button"],
  ["configurator stepper", "panel", ".stepperButton"],
  ["shell close", "modal", ".manual-order-modal__shell-close"]
];

for (const [label, which, selector] of SQUARE_TARGETS) {
  const body = rule(which === "panel" ? panelCss : modalCss, selector);
  assert.equal(
    target(body, "width") >= 44,
    true,
    `${label} (${selector}) must be at least 44px wide`
  );
  assert.equal(
    target(body, "height") >= 44,
    true,
    `${label} (${selector}) must be at least 44px tall`
  );
}

const HEIGHT_TARGETS: Array<[string, string, string]> = [
  ["Quitar", "modal", ".manual-order-modal__remove-button"],
  ["segmented option", "modal", ".manual-order-modal__delivery-option"],
  ["product search", "modal", ".manual-order-modal__search"]
];

for (const [label, which, selector] of HEIGHT_TARGETS) {
  const body = rule(which === "panel" ? panelCss : modalCss, selector);
  assert.equal(
    target(body, "height") >= 44,
    true,
    `${label} (${selector}) must be at least 44px tall`
  );
}

/* Density rule: growing hit areas must not have inflated the rows. */
const productRow = rule(modalCss, ".manual-order-modal__product-row");
assert.equal(
  /min-height:\s*52px/.test(productRow),
  true,
  "Product row rhythm must stay at its 52px minimum, not be redesigned"
);
assert.equal(
  /padding:\s*6px 10px/.test(productRow),
  true,
  "Product row padding must absorb the larger add control instead of inflating the row"
);

/* The glyphs themselves must not have been scaled up with the boxes. */
assert.equal(
  /font-size:\s*1\.15rem/.test(rule(modalCss, ".manual-order-modal__add-button")),
  true,
  "The add glyph must keep its original size"
);
assert.equal(
  /font-size:\s*0\.92rem/.test(rule(modalCss, ".manual-order-modal__quantity-button")),
  true,
  "The ticket stepper glyph must keep its original size"
);

/* ------------------------------------------------------------------------- */
/* 2. Focus containment is local, scoped and passive about the rest of the app*/
/* ------------------------------------------------------------------------- */

assert.equal(
  modalCode.includes("dialogRef"),
  true,
  "Containment must work against the real dialog node handed over by the shell"
);
assert.equal(
  /const dialog = dialogRef\.current/.test(modalCode),
  true,
  "The containment effect must resolve the dialog container before listening"
);
assert.equal(
  /dialog\.addEventListener\("keydown"/.test(modalCode) &&
    /dialog\.removeEventListener\("keydown"/.test(modalCode),
  true,
  "The Tab listener must be attached to (and cleaned up from) the dialog node"
);
assert.equal(
  /(window|document)\.addEventListener\(\s*"keydown"/.test(modalCode),
  false,
  "The modal must not register a global keydown listener"
);
assert.equal(
  /function getManualOrderFocusableElements\(container: HTMLElement\)[\s\S]*?container\.querySelectorAll/.test(
    modal
  ),
  true,
  "Focusables must be derived from the container argument only"
);
assert.equal(
  /document\.querySelectorAll|document\.body\.querySelector/.test(modalCode),
  false,
  "The modal must never query the whole document for focusables"
);

/* Wrapping in both directions. */
assert.equal(
  /if \(event\.shiftKey\)[\s\S]{0,220}?last\.focus\(\)/.test(modalCode),
  true,
  "Shift+Tab from the first focusable must wrap to the last"
);
assert.equal(
  /active === last[\s\S]{0,160}?first\.focus\(\)/.test(modalCode),
  true,
  "Tab from the last focusable must wrap to the first"
);
assert.equal(
  /event\.key !== "Tab"/.test(modalCode),
  true,
  "Only Tab may be intercepted by the containment handler"
);

/* Disabled and hidden controls drop out of the loop on their own. */
assert.equal(
  /button:not\(\[disabled\]\)/.test(modal) && /!element\.hasAttribute\("disabled"\)/.test(modalCode),
  true,
  "Disabled controls must be excluded from the focus loop"
);
assert.equal(
  /element\.getClientRects\(\)\.length > 0/.test(modalCode),
  true,
  "Hidden or unmounted controls must be excluded from the focus loop"
);
assert.equal(
  /element\.tabIndex !== -1/.test(modalCode),
  true,
  "Programmatically-focusable-only nodes must be excluded from the tab loop"
);

/* No background mutation, no sentinels, no polling. */
assert.equal(
  /setAttribute\(\s*["']tabindex/i.test(modalCode) || /\.tabIndex\s*=/.test(modalCode),
  false,
  "Focus containment must never mutate tabindex on any node"
);
assert.equal(
  /setTimeout|setInterval|requestAnimationFrame/.test(modalCode),
  false,
  "Focus containment must not rely on timers or polling"
);
assert.equal(
  /inert\b/.test(modalCode),
  false,
  "Background nodes must not be inerted by the modal"
);

/* No positive tabindex anywhere in the touched surfaces. */
for (const [label, source] of [
  ["modal", modal],
  ["configurator", panel],
  ["shell", shell]
] as const) {
  assert.equal(
    /tabIndex=\{?\s*["']?[1-9]/.test(source),
    false,
    `${label} must not introduce a positive tabindex`
  );
}

/* ------------------------------------------------------------------------- */
/* 3. Initial focus stays with the shell; return focus is local               */
/* ------------------------------------------------------------------------- */

assert.equal(
  /closeButtonRef\.current\?\.focus\(\)/.test(shellCode),
  true,
  "The shell must keep owning the initial focus on its close button"
);
assert.equal(
  /autoFocus/.test(modalCode),
  false,
  "The modal must not introduce a competing autofocus"
);
assert.equal(
  /openerRef\.current = active instanceof HTMLElement \? active : null/.test(modalCode),
  true,
  "The opener must be captured when the modal opens"
);
assert.equal(
  /useOpenerCaptureEffect/.test(modalCode) && /useLayoutEffect/.test(modalCode),
  true,
  "The opener must be captured in a layout effect, before the shell moves focus"
);
assert.equal(
  /opener\?\.isConnected/.test(modalCode),
  true,
  "Return focus must be skipped when the opener left the document"
);
assert.equal(
  /scrollIntoView/.test(modalCode),
  false,
  "Focus handling must not introduce custom scroll management"
);

/* ------------------------------------------------------------------------- */
/* 4. Escape and close semantics                                              */
/* ------------------------------------------------------------------------- */

assert.equal(
  /const handleEscape = \(event: KeyboardEvent\) => \{[\s\S]*?event\.key === "Escape"[\s\S]*?onClose\(\)/.test(
    shellCode
  ),
  true,
  "The shell must keep closing on Escape"
);
assert.equal(
  /window\.addEventListener\("keydown", handleEscape\)/.test(shellCode),
  true,
  "Escape must keep being handled where it already was"
);
assert.equal(
  /stopPropagation/.test(modalCode),
  false,
  "The modal must not swallow events that Escape handling depends on"
);

/* One accurate accessible name per close affordance, no duplicates. */
assert.equal(
  /closeLabel=\{/.test(modal) && /overlayLabel="/.test(modal),
  true,
  "The modal must supply its own accessible names for both close affordances"
);
assert.equal(
  modal.includes('"Cerrar nuevo pedido manual"'),
  true,
  "The visible close control must name the manual order modal"
);
assert.equal(
  modal.includes("Cerrar detalle del pedido"),
  false,
  "The manual modal must not reuse the generic order-detail close name"
);
const overlayLabelValue = modal.match(/overlayLabel="([^"]+)"/)?.[1];
const closeLabelFallback = modal.match(/:\s*"(Cerrar[^"]+)"/)?.[1];
assert.notEqual(
  overlayLabelValue,
  closeLabelFallback,
  "Overlay and close button must not share one accessible name"
);
assert.equal(
  /aria-label=\{closeLabel\}/.test(shellCode) && /aria-label=\{overlayLabel\}/.test(shellCode),
  true,
  "The shell must render the supplied accessible names"
);

/* ------------------------------------------------------------------------- */
/* 5. Shell API is opt-in and backward compatible                             */
/* ------------------------------------------------------------------------- */

for (const prop of ["dialogRef", "closeLabel", "overlayLabel", "closeClassName"]) {
  assert.equal(
    new RegExp(`${prop}\\?:`).test(shellCode),
    true,
    `The new shell prop ${prop} must be optional`
  );
}
assert.equal(
  /closeLabel = "Cerrar detalle del pedido"/.test(shellCode) &&
    /overlayLabel = "Cerrar detalle del pedido"/.test(shellCode),
  true,
  "The shell must default to its previous accessible names for existing consumers"
);
assert.equal(
  /dialogRef|closeLabel|overlayLabel|closeClassName/.test(code(workspaceModal)),
  false,
  "The order workspace modal must remain untouched by the new shell API"
);
assert.equal(
  /variant="workstation"/.test(code(workspaceModal)),
  true,
  "The order workspace modal must keep using the shared workstation variant"
);
/* The 44px close target is feature-local, so the workspace close does not move. */
assert.equal(
  /min-width:\s*34px/.test(rule(shellCss, ".admin-order-modal-shell__close--quiet")),
  true,
  "The shared quiet close must keep its original size for the other consumer"
);
assert.equal(
  shellCss.includes("manual-order-modal"),
  false,
  "Shared shell CSS must not learn about the manual order modal"
);

/* ------------------------------------------------------------------------- */
/* 6. Focus-visible coverage, without a blanket :focus                        */
/* ------------------------------------------------------------------------- */

const FOCUS_VISIBLE_OWNERS: Array<[string, string]> = [
  ["modal", ".manual-order-modal__add-button:focus-visible"],
  ["modal", ".manual-order-modal__quantity-button:focus-visible"],
  ["modal", ".manual-order-modal__remove-button:focus-visible"],
  ["modal", ".manual-order-modal__search:focus-visible"],
  ["modal", ".manual-order-modal__delivery-option:has(input:focus-visible)"],
  ["panel", ".optionButton:focus-visible"]
];

for (const [which, selector] of FOCUS_VISIBLE_OWNERS) {
  const css = which === "panel" ? panelCss : modalCss;
  assert.equal(
    css.includes(selector),
    true,
    `${selector} must show a keyboard focus treatment`
  );
}

/* No blanket :focus rule and no outline removal without a replacement. */
for (const [label, css] of [
  ["modal", modalCssCode],
  ["configurator", panelCssCode]
] as const) {
  for (const block of css.split("}")) {
    if (!/:focus(?!-visible)(?![\w-])/.test(block)) {
      continue;
    }
    assert.fail(`${label} must not style a blanket :focus — offending block: ${block.trim().slice(0, 120)}`);
  }
  for (const block of css.split("}")) {
    if (!/outline:\s*none/.test(block)) {
      continue;
    }
    assert.equal(
      /box-shadow|border-color/.test(block),
      true,
      `${label} must replace any removed outline with a visible ring: ${block.trim().slice(0, 120)}`
    );
  }
}

/* Selected and focused must remain separable: selected uses accent, focus uses --focus. */
assert.equal(
  /--mo-selected-border|--mo-selected-surface/.test(
    rule(modalCss, ".manual-order-modal__product-row--selected")
  ),
  true,
  "Selected state must keep speaking the accent family, not the focus token"
);
assert.equal(
  /var\(--focus\)/.test(rule(modalCss, ".manual-order-modal__quantity-button:focus-visible")),
  true,
  "Keyboard focus must keep speaking the focus token"
);

/* ------------------------------------------------------------------------- */
/* 7. Frozen guards: P1-1..P1-4, ticket, materiality, scroll                  */
/* ------------------------------------------------------------------------- */

/* P1-3 scroll ownership. */
assert.equal(
  modalCode.includes("composeScrollTopRef"),
  true,
  "P1-3 compose scroll restoration must remain"
);
assert.equal(
  /body\.scrollTop = viewKey === "compose" \? composeScrollTopRef\.current : 0/.test(modalCode),
  true,
  "P1-3 subview scroll entry must remain unchanged"
);

/* P1-4 intermediate product row geometry. */
const intermediate = modalCss.match(
  /@media \(min-width: 900px\) and \(max-width: 1023px\)\s*\{([\s\S]*?)\n\}/
)?.[1];
assert.ok(intermediate, "The 900–1023 product-row block must remain");
assert.equal(
  /grid-template-areas:\s*\n?\s*"copy copy"\s*\n?\s*"price add"/.test(intermediate),
  true,
  "The 900–1023 copy/price/add areas must remain"
);
assert.equal(
  /\.manual-order-modal__add-button\s*\{[\s\S]*?grid-area:\s*add/.test(intermediate),
  true,
  "The add control must keep its own grid area in the intermediate range"
);
assert.equal(
  /overflow-wrap:\s*anywhere/.test(rule(modalCss, ".manual-order-modal__product-copy")),
  true,
  "Product identity must keep its break opportunity"
);

/* P1-1 / P1-2 CTA and validation owners. */
assert.equal(
  /const canSubmit =[\s\S]*?requiredFormReady/.test(modalCode),
  true,
  "canSubmit must keep depending on requiredFormReady"
);
assert.equal(
  /function getManualOrderRequiredFieldErrors\([\s\S]*?return requiredErrors;\s*\n\}/.test(
    modalCode
  ),
  true,
  "The required-field helper must remain untouched"
);
assert.equal(
  modalCode.includes("configureDraftValid"),
  true,
  "Configurator validity wiring must remain"
);
const scopedDisabled = modalCss.match(
  /\.manual-order-modal__footer\s+\.manual-order-modal__submit-button:disabled\s*\{([\s\S]*?)\}/
)?.[1];
assert.ok(scopedDisabled, "Scoped disabled CTA rule must remain");
assert.equal(
  /opacity:\s*1\b/.test(scopedDisabled) && /cursor:\s*not-allowed/.test(scopedDisabled),
  true,
  "Disabled CTA must keep its scoped neutral treatment"
);
assert.equal(
  /position:\s*sticky/.test(rule(modalCss, ".manual-order-modal__footer")),
  true,
  "Footer must remain sticky in flow"
);

/* Ticket hierarchy. */
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
for (const selector of [
  ".manual-order-modal__summary-groups",
  ".manual-order-modal__summary-upsells",
  ".manual-order-modal__summary-actions"
]) {
  assert.equal(
    modalCss.includes(selector),
    true,
    `${selector} from the ticket hierarchy phase must remain`
  );
}
assert.equal(
  /justify-content:\s*space-between/.test(rule(modalCss, ".manual-order-modal__summary-actions")),
  true,
  "Quitar must stay separated from the stepper"
);

/* Material scale. */
for (const [label, css, selector] of [
  ["modal", modalCss, ".manual-order-modal__form"],
  ["configurator", panelCss, ".panel"]
] as const) {
  const scale = rule(css, selector);
  for (const token of [
    "--mo-surface-section",
    "--mo-surface-row",
    "--mo-border-section",
    "--mo-border-row",
    "--mo-selected-border"
  ]) {
    assert.equal(scale.includes(`${token}:`), true, `${label} must keep ${token}`);
  }
}
assert.equal(
  /@media[^{]*prefers-color-scheme/.test(modalCssCode + panelCssCode),
  false,
  "The admin modal must not be themed with prefers-color-scheme"
);

/* Single-scroll. */
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
/* 8. Shared / global / server surfaces untouched                             */
/* ------------------------------------------------------------------------- */

assert.equal(
  globals.includes("manual-order-modal"),
  false,
  "app/globals.css must not learn about the manual order modal"
);
assert.equal(
  /--mo-surface-|--mo-border-|manual-order-modal/.test(tokens),
  false,
  "app/theme-tokens.css must stay free of feature-local concerns"
);
assert.equal(
  /--focus:\s*#6366f1/.test(tokens) && /--accent-primary:\s*#2563eb/.test(tokens),
  true,
  "Global focus and accent tokens must remain unchanged"
);
assert.equal(
  button.includes('const classes = ["ui-button", `ui-button--${variant}`, className]'),
  true,
  "Shared Button primitive must remain unchanged"
);
assert.equal(
  actions.includes("export async function createManualOrderAction"),
  true,
  "The server action must remain unchanged"
);
assert.equal(
  ticket.includes("lineTotal: line.unitPrice * line.quantity"),
  true,
  "Domain pricing must remain unchanged"
);
assert.equal(
  /const result = await createManualOrderAction\(\{/.test(modalCode),
  true,
  "The payload call shape must remain unchanged"
);
assert.equal(
  /supabase|create_order|migrations/.test(modalCssCode + panelCssCode),
  false,
  "CSS must not reference server or database concerns"
);

console.log("PASS: admin-manual-order-modal-accessibility-interaction-polish.verify.ts");
