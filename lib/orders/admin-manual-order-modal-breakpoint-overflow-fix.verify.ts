/**
 * Source contracts for ADMIN-MANUAL-ORDER-MODAL-BREAKPOINT-OVERFLOW-FIX-1.
 *
 * Scope: P1-4 — in the 900–1023px intermediate range the workstation dual-pane
 * is already active while the modal is still capped, so the summary column sits
 * on its 300px floor and the products column lands at ~248px. The three-track
 * product row then starved the identity track (~56px measured at 900px) and the
 * identity copy painted over the price/action tracks.
 *
 * Asserts the fix is present (identity containment + feature-local 900–1023 row
 * geometry) AND that the workstation breakpoint, modal shell, ≤899 single-scroll
 * architecture, CTA/footer polish, validation and server wiring were not touched.
 *
 * Run: npx tsx lib/orders/admin-manual-order-modal-breakpoint-overflow-fix.verify.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const css = read("components/admin/orders/manual-order-modal.module.css");
const modal = read("components/admin/orders/manual-order-modal.tsx");
const shell = read("components/admin/orders/admin-order-modal-shell.tsx");
const shellCss = read("components/admin/orders/admin-order-modal.module.css");
const globals = read("app/globals.css");
const tokens = read("app/theme-tokens.css");
const button = read("components/ui/Button.tsx");
const panel = read("components/admin/orders/manual-order-customization-panel.tsx");
const panelCss = read(
  "components/admin/orders/manual-order-customization-panel.module.css"
);

/** Extracts a top-level block body, assuming nested rules are indented. */
function block(source: string, header: RegExp): string {
  const match = source.match(
    new RegExp(`${header.source}\\s*\\{([\\s\\S]*?)\\n\\}`)
  );
  assert.ok(match, `Expected to find block: ${header.source}`);
  return match[1];
}

/* ------------------------------------------------------------------------- */
/* 1. The fix is owned by the feature stylesheet                              */
/* ------------------------------------------------------------------------- */

for (const [name, source] of [
  ["app/globals.css", globals],
  ["app/theme-tokens.css", tokens],
  ["admin-order-modal.module.css", shellCss],
  ["manual-order-customization-panel.module.css", panelCss]
] as const) {
  assert.equal(
    /manual-order-modal__product/.test(source),
    false,
    `${name} must not own manual order product-row geometry`
  );
}

/* ------------------------------------------------------------------------- */
/* 2. Shared primitives / globals / tokens untouched                          */
/* ------------------------------------------------------------------------- */

assert.equal(
  /\.ui-button:disabled\s*\{\s*cursor:\s*not-allowed;\s*opacity:\s*0\.6;\s*transform:\s*none;\s*\}/.test(
    globals
  ),
  true,
  "Global .ui-button:disabled must remain exactly as before"
);
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
  tokens.includes("--accent-primary: #2563eb"),
  true,
  "Brand accent token must remain unchanged"
);
assert.equal(
  button.includes('const classes = ["ui-button", `ui-button--${variant}`, className]'),
  true,
  "Shared Button primitive must remain unchanged (className passthrough only)"
);

/* ------------------------------------------------------------------------- */
/* 3. Product identity track can shrink AND contains its own copy             */
/* ------------------------------------------------------------------------- */

const copyBlock = block(css, /\.manual-order-modal__product-copy/);

assert.equal(
  /min-width:\s*0/.test(copyBlock),
  true,
  "Identity wrapper must keep min-width: 0 so the 1fr track can shrink"
);
// The root cause was shrink-without-containment: the track shrank below
// min-content while long words still painted outside their grid area.
assert.equal(
  /overflow-wrap:\s*(anywhere|break-word)|word-break:\s*break-word|overflow:\s*hidden/.test(
    copyBlock
  ),
  true,
  "Identity wrapper must contain its copy (wrap/break) instead of overflowing its track"
);
assert.equal(
  /white-space:\s*nowrap/.test(copyBlock),
  false,
  "Identity copy must stay wrappable, never forced onto one line"
);

/* ------------------------------------------------------------------------- */
/* 4. Price keeps whole, stable, non-wrapping geometry                        */
/* ------------------------------------------------------------------------- */

const priceBlock = block(css, /\.manual-order-modal__product-price/);

assert.equal(
  /white-space:\s*nowrap/.test(priceBlock),
  true,
  "Price must never wrap"
);
assert.equal(
  /min-width:\s*4\.75rem/.test(priceBlock),
  true,
  "Price must keep its reserved minimum width"
);
assert.equal(
  /font-size:\s*0\.84rem/.test(priceBlock),
  true,
  "Price typography must not be shrunk to dodge the overlap"
);

/* ------------------------------------------------------------------------- */
/* 5–6. No horizontal scrolling introduced anywhere in the modal              */
/* ------------------------------------------------------------------------- */

assert.equal(
  /overflow-x:\s*(auto|scroll)/.test(css),
  false,
  "The modal must not introduce horizontal scrolling"
);
const productsScrollBlock = block(
  css,
  /\.manual-order-modal__products-scroll,\n\.manual-order-modal__summary-scroll/
);
assert.equal(
  /overflow-x/.test(productsScrollBlock),
  false,
  "Product list must not gain a horizontal scroll axis"
);

/* ------------------------------------------------------------------------- */
/* 7. Modal shell untouched                                                   */
/* ------------------------------------------------------------------------- */

// The shell is the reason the range ends at 1023: the panel stays capped at
// 600px and only widens at ≥1024. Both invariants must survive untouched.
assert.equal(
  /\.admin-order-modal-shell__panel--workstation\s*\{[\s\S]*?max-width:\s*600px/.test(
    shellCss
  ),
  true,
  "Workstation panel must keep its 600px cap below 1024px"
);
assert.equal(
  /@media\s*\(min-width:\s*1024px\)\s*\{[\s\S]*?\.admin-order-modal-shell__panel--workstation\s*\{[\s\S]*?max-width:\s*1200px/.test(
    shellCss
  ),
  true,
  "Workstation panel must keep widening at ≥1024px"
);
assert.equal(
  /product-row|grid-template-areas/.test(shell),
  false,
  "Modal shell component must stay unaware of product row geometry"
);

/* ------------------------------------------------------------------------- */
/* 8. Workstation breakpoint + dual-pane geometry unchanged                   */
/* ------------------------------------------------------------------------- */

const workstationBlock = block(css, /@media\s*\(min-width:\s*900px\)/);
assert.equal(
  /\.manual-order-modal__workstation\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1\.45fr\)\s*minmax\(300px,\s*0\.85fr\)/.test(
    workstationBlock
  ),
  true,
  "Workstation dual-pane must still activate at 900px with the same tracks"
);
assert.equal(
  /@media\s*\(\s*min-width:\s*1024px\s*\)\s*\{[\s\S]*?\.manual-order-modal__workstation/.test(
    css
  ),
  false,
  "The workstation breakpoint must not be pushed to 1024px"
);

/* ------------------------------------------------------------------------- */
/* 9. Feature-local intermediate range targets row geometry only              */
/* ------------------------------------------------------------------------- */

const intermediateHeader =
  /@media\s*\(min-width:\s*900px\)\s*and\s*\(max-width:\s*1023px\)/;
assert.equal(
  intermediateHeader.test(css),
  true,
  "Intermediate 900–1023 range must be expressed as one feature-local media query"
);
const intermediateBlock = block(css, intermediateHeader);

// The range must be exactly the gap between the workstation breakpoint and the
// width where the shell widens: no leakage into ≤899 or ≥1024.
for (const selector of [
  "manual-order-modal__product-row",
  "manual-order-modal__product-copy",
  "manual-order-modal__product-price",
  "manual-order-modal__add-button"
]) {
  assert.equal(
    intermediateBlock.includes(selector),
    true,
    `Intermediate range must position .${selector}`
  );
}
const intermediateSelectors =
  intermediateBlock.match(/^\s{2}\.[a-zA-Z0-9_\-,\s.]*?\{/gm) ?? [];
assert.ok(
  intermediateSelectors.length > 0,
  "Intermediate range must declare at least one rule"
);
for (const selector of intermediateSelectors) {
  assert.equal(
    /product-row|product-copy|product-price|add-button/.test(selector),
    true,
    `Intermediate range must only touch product row geometry, found: ${selector.trim()}`
  );
}
assert.equal(
  /workstation|products-panel|summary-panel|__body|__footer|__submit/.test(
    intermediateBlock
  ),
  false,
  "Intermediate range must not restructure the workstation, panels, body or footer"
);
// Identity gets the full row width; price/action keep their own stable line.
assert.equal(
  /grid-template-areas:\s*\n?\s*"copy copy"\s*\n?\s*"price add"/.test(
    intermediateBlock
  ),
  true,
  "Intermediate row must give identity the full width and reserve a price/action line"
);
assert.equal(
  /font-size/.test(intermediateBlock),
  false,
  "Intermediate range must not resize type (price must stay legible at full size)"
);
assert.equal(
  /overflow-y|position:\s*(fixed|absolute)/.test(intermediateBlock),
  false,
  "Intermediate range must not introduce nested scrolling or take rows out of flow"
);

/* ------------------------------------------------------------------------- */
/* 10. Base (≥1024) and ≤639 row geometry unchanged                           */
/* ------------------------------------------------------------------------- */

assert.equal(
  /\.manual-order-modal__product-row\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)\s*auto\s*auto/.test(
    css
  ),
  true,
  "Base three-track product row (identity | price | action) must remain"
);
assert.equal(
  /grid-template-areas:\s*\n?\s*"copy price"\s*\n?\s*"copy add"/.test(css),
  true,
  "≤639 product row areas must remain unchanged"
);

/* ------------------------------------------------------------------------- */
/* 11. ≤899 single-scroll architecture unchanged                              */
/* ------------------------------------------------------------------------- */

const mobileBlock = block(css, /@media\s*\(max-width:\s*899px\)/);
assert.equal(
  /\.manual-order-modal__body\s*\{[\s\S]*?overflow-y:\s*auto/.test(mobileBlock),
  true,
  "Body must remain the sole ≤899 scroll owner"
);
assert.equal(
  /\.manual-order-modal__workstation\s*\{[\s\S]*?overflow:\s*visible/.test(
    mobileBlock
  ),
  true,
  "Workstation must not nest-scroll on ≤899"
);
assert.equal(
  mobileBlock.includes("max-height: none"),
  true,
  "Nested panes must keep dropping max-height on ≤899"
);

/* ------------------------------------------------------------------------- */
/* 12. CTA/footer polish from the previous phase preserved                    */
/* ------------------------------------------------------------------------- */

assert.equal(
  /\.manual-order-modal__footer\s+\.manual-order-modal__submit-button:disabled\s*\{/.test(
    css
  ),
  true,
  "Scoped disabled CTA treatment must remain"
);
assert.equal(
  /\.manual-order-modal__footer::before\s*\{/.test(css),
  true,
  "Footer scroll-edge fade must remain"
);
const footerBlock = block(css, /\.manual-order-modal__footer/);
assert.equal(
  /position:\s*sticky/.test(footerBlock),
  true,
  "Footer must remain sticky in flow"
);
assert.equal(
  /\.manual-order-modal__submit-label\s*\{[\s\S]*?white-space:\s*nowrap/.test(css),
  true,
  "CTA amount label must keep its non-wrapping geometry"
);
assert.equal(
  modal.includes('"Completá las opciones"'),
  true,
  "Configurator blocked copy must remain"
);

/* ------------------------------------------------------------------------- */
/* 13. Validation contract: P1-2-aware readiness guard                        */
/*                                                                             */
/* P1-2 was closed by ADMIN-MANUAL-ORDER-MODAL-FORM-VALIDATION-UX-DECISION-1:   */
/* canSubmit now reflects the required-field rules validateForm already owned,   */
/* so the previous "customer validity must stay out of canSubmit" assertion is   */
/* retired. What it protected is now asserted positively: same rules, no new or  */
/* hardened rule, Retiro never requires Delivery-only fields.                   */
/* ------------------------------------------------------------------------- */

const canSubmitBlock = modal.match(/const canSubmit =[\s\S]*?;/)?.[0];
assert.ok(canSubmitBlock, "canSubmit declaration required");
assert.equal(
  canSubmitBlock.includes("requiredFormReady"),
  true,
  "canSubmit must incorporate readiness of the already-required form fields"
);
assert.equal(
  canSubmitBlock.includes("hasSelectedItems") &&
    canSubmitBlock.includes("ticketSubmitReady"),
  true,
  "canSubmit must keep ticket readiness"
);
assert.equal(
  canSubmitBlock.includes("!isSubmitting") && canSubmitBlock.includes("canCreateOrder"),
  true,
  "canSubmit must keep the submitting and session guards"
);
assert.equal(
  canSubmitBlock.includes("configureDraftValid"),
  false,
  "Compose readiness must not mix with configurator validity"
);

const requiredRules = modal.match(
  /function getManualOrderRequiredFieldErrors\([\s\S]*?return requiredErrors;\s*\n\}/
)?.[0];
assert.ok(requiredRules, "Shared required-field helper must exist");
assert.equal(
  requiredRules.includes("if (!input.customerName.trim()) {") &&
    requiredRules.includes("if (!input.phone.trim()) {"),
  true,
  "customerName/phone must stay non-empty checks (not hardened)"
);
assert.equal(
  /if \(input\.deliveryMethod === "delivery" && !input\.address\.trim\(\)\) \{\s*requiredErrors\.address =/.test(
    requiredRules
  ),
  true,
  "The address requirement must remain conditional on Delivery"
);
assert.equal(
  (requiredRules.match(/requiredErrors\.address\s*=/g) ?? []).length,
  1,
  "Retiro must not require Delivery-only fields: address is set only in that branch"
);
assert.equal(
  /RegExp|\.test\(|\.match\(|\.replace\(|length\s*[<>]=?\s*\d/.test(requiredRules),
  false,
  "No new regex/normalization/length rule may be introduced"
);
assert.equal(
  /const validateForm = \(\) => \{[\s\S]*?getManualOrderRequiredFieldErrors\(\{/.test(
    modal
  ),
  true,
  "validateForm must consume the same shared required-field rules"
);
for (const rule of [
  '"El nombre del cliente es obligatorio."',
  '"El teléfono es obligatorio."',
  '"La dirección es obligatoria para delivery."',
  'nextFieldErrors.items = "Agregá al menos un producto."'
]) {
  assert.equal(
    modal.includes(rule),
    true,
    `Existing validation rule/message must be preserved: ${rule}`
  );
}

/* ------------------------------------------------------------------------- */
/* 14. P1-3 configurator scroll entry: modal-body-owner guard                  */
/*                                                                             */
/* P1-3 was closed by ADMIN-MANUAL-ORDER-MODAL-CONFIGURATOR-CONTEXT-POLISH-1,   */
/* so the previous "no scrollTop at all" assertion is retired. Scroll work on   */
/* the existing modal body owner is now expected; what stays forbidden is any   */
/* window/document scrolling, scrollIntoView, global scroller lookup or second  */
/* scroll owner.                                                               */
/* ------------------------------------------------------------------------- */

// Comment-free view: a ban must not be satisfiable by prose.
const modalCode = modal
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/(^|[^:])\/\/.*$/gm, "$1");

// 1. The reset/restoration targets the existing modal body ref.
assert.equal(
  modal.includes('<div className={styles["manual-order-modal__body"]} ref={bodyRef}>'),
  true,
  "Configurator scroll entry must operate on the existing modal body element"
);
assert.equal(
  modalCode.includes("bodyRef.current.scrollTop = 0;"),
  true,
  "Entering the configurator must reset the modal body owner to its top"
);
for (const scrollWrite of modalCode.match(/[\w.?]+\.scrollTop\s*=/g) ?? []) {
  assert.equal(
    /^(bodyRef\.current|body)\./.test(scrollWrite),
    true,
    `Only the modal body owner may be scrolled, found: ${scrollWrite}`
  );
}

// 2–3. No window/document scrolling, no scrollIntoView, no global scroller lookup.
for (const forbidden of [
  "window.scrollTo",
  "window.scroll(",
  "window.scrollBy",
  "document.body.scrollTop",
  "document.documentElement.scrollTop",
  "scrollIntoView",
  "getElementById"
]) {
  assert.equal(
    modalCode.includes(forbidden),
    false,
    `Configurator scroll entry must not rely on ${forbidden}`
  );
}

/*
 * The blanket `querySelector` ban that used to live in the list above was retired
 * by ADMIN-MANUAL-ORDER-MODAL-ACCESSIBILITY-INTERACTION-POLISH-1, whose focus
 * containment legitimately queries the dialog node. What the ban protected is
 * scroll *ownership*: the configurator must never look the scroller up in the
 * DOM. So instead of forbidding the call outright, pin who is allowed to query.
 */
const domQueries = [...new Set(modalCode.match(/[\w.?]*\.querySelector(?:All)?\b/g) ?? [])];
assert.deepEqual(
  domQueries,
  ["container.querySelectorAll"],
  `The only DOM query may be the dialog-scoped focus lookup, found: ${domQueries.join(", ")}`
);
assert.equal(
  /function getManualOrderFocusableElements\(container: HTMLElement\)[\s\S]*?container\.querySelectorAll/.test(
    modalCode
  ),
  true,
  "The dialog-scoped query must live in the focusables helper, never in scroll code"
);
assert.equal(
  modalCode.includes("getManualOrderFocusableElements(dialog)"),
  true,
  "Focus containment must be handed the dialog node, never the document"
);

// 4. Single-scroll invariant: no second owner introduced by the configurator.
assert.equal(
  /overflow-y:\s*(auto|scroll)/.test(panelCss),
  false,
  "The configurator panel must not introduce a nested scroll owner"
);
assert.equal(
  panel.includes("validateCustomizationSelection"),
  true,
  "Configurator validation must remain in place"
);
assert.equal(
  /manual-order-modal__product|grid-template-areas/.test(panelCss),
  false,
  "Configurator panel CSS must not absorb product row geometry"
);

/* ------------------------------------------------------------------------- */
/* 15. Server/action/payload wiring untouched                                 */
/* ------------------------------------------------------------------------- */

assert.equal(
  modal.includes(
    'import { createManualOrderAction } from "@/app/admin/(protected)/orders/actions"'
  ),
  true,
  "createManualOrderAction wiring must remain unchanged"
);
assert.equal(
  modal.includes("manualTicketLinesToCreateInput(ticketLines)"),
  true,
  "Payload derivation must remain unchanged"
);
assert.equal(
  modal.includes("ticketLines: createInput.ticketLines"),
  true,
  "Submit payload must remain unchanged"
);

/* ------------------------------------------------------------------------- */
/* 16. Accessibility/semantics of the row untouched                           */
/* ------------------------------------------------------------------------- */

const addButtonMarkup = modal.match(
  /className=\{styles\["manual-order-modal__add-button"\]\}[\s\S]*?aria-label=\{([\s\S]*?)\n\s*\}/
);
assert.ok(
  addButtonMarkup,
  "Product action button must keep its aria-label expression"
);
assert.equal(
  /`Configurar \$\{product\.name\}`/.test(addButtonMarkup[1]) &&
    /`Agregar \$\{product\.name\}`/.test(addButtonMarkup[1]),
  true,
  "Product action button must keep both Configurar/Agregar accessible names"
);
/*
 * This was a file-wide `tabIndex` ban, but the certified focus containment has to
 * *read* `tabIndex` to skip programmatically unreachable nodes. The behaviour it
 * protected is that no element is ever re-tabindexed by this modal — reading is
 * fine, writing and positive tabindexes are not.
 */
assert.equal(
  /\.tabIndex\s*=[^=]/.test(modalCode),
  false,
  "No tabindex may be assigned by this modal"
);
for (const mutation of [
  'setAttribute("tabindex"',
  "setAttribute('tabindex'",
  'removeAttribute("tabindex"',
  "removeAttribute('tabindex'"
]) {
  assert.equal(
    modalCode.includes(mutation),
    false,
    `No tabindex mutation may be introduced: ${mutation}`
  );
}
assert.equal(
  /tabIndex=\{?\s*[1-9]/.test(modalCode),
  false,
  "No positive tabindex may be introduced in markup"
);
assert.equal(
  modalCode.includes("element.tabIndex !== -1"),
  true,
  "The focusables filter must keep skipping tabindex=-1 nodes"
);

console.log("PASS: admin-manual-order-modal-breakpoint-overflow-fix.verify.ts");
