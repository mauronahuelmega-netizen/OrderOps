/**
 * Source contracts for ADMIN-MANUAL-ORDER-MODAL-CTA-FOOTER-STATES-POLISH-1.
 *
 * Scope: feature-scoped disabled treatment for the manual order modal primary
 * CTA, sticky footer material/scroll-edge affordance and mobile confirmation
 * amount parity. Asserts the polish is present AND that no shared primitive,
 * validation path, scroll architecture or deferred P1 was touched.
 *
 * Run: npx tsx lib/orders/admin-manual-order-modal-cta-footer-states-polish.verify.ts
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
const globals = read("app/globals.css");
const tokens = read("app/theme-tokens.css");
const button = read("components/ui/Button.tsx");
const panel = read("components/admin/orders/manual-order-customization-panel.tsx");
const panelCss = read(
  "components/admin/orders/manual-order-customization-panel.module.css"
);

/* ------------------------------------------------------------------------- */
/* 1. Primary CTA keeps a local, feature-scoped styling hook                  */
/* ------------------------------------------------------------------------- */

assert.equal(
  modal.includes('styles["manual-order-modal__submit-button"]'),
  true,
  "Primary CTA must keep its local CSS module class hook"
);

const submitButtonHooks = modal.match(
  /styles\["manual-order-modal__submit-button"\]/g
);
assert.ok(
  submitButtonHooks && submitButtonHooks.length >= 2,
  "Both compose and configurator primary CTAs must carry the scoped hook"
);

/* ------------------------------------------------------------------------- */
/* 2. Scoped disabled treatment exists and is not opacity-only                */
/* ------------------------------------------------------------------------- */

const scopedDisabled = css.match(
  /\.manual-order-modal__footer\s+\.manual-order-modal__submit-button:disabled\s*\{([\s\S]*?)\}/
);
assert.ok(
  scopedDisabled,
  "Scoped disabled rule for the modal primary CTA is required"
);
const disabledBlock = scopedDisabled[1];

assert.equal(
  /opacity:\s*1\b/.test(disabledBlock),
  true,
  "Scoped disabled state must stop relying on the global opacity dim"
);
assert.equal(
  /background:/.test(disabledBlock),
  true,
  "Scoped disabled state must repaint the surface (neutral, not accent)"
);
assert.equal(
  /color:/.test(disabledBlock),
  true,
  "Scoped disabled state must set a readable muted label color"
);
assert.equal(
  /border-color:/.test(disabledBlock),
  true,
  "Scoped disabled state must define its own subtle border"
);
assert.equal(
  /box-shadow:\s*none/.test(disabledBlock),
  true,
  "Scoped disabled state must drop the primary shadow"
);
assert.equal(
  /cursor:\s*not-allowed/.test(disabledBlock),
  true,
  "Scoped disabled state must keep the not-allowed cursor"
);

// Neutral surface must come from semantic tokens, not a parallel color system.
assert.equal(
  /var\(--bg-surface(-soft)?\)/.test(disabledBlock),
  true,
  "Disabled surface must derive from semantic surface tokens"
);
assert.equal(
  /var\(--text-(secondary|primary)\)/.test(disabledBlock),
  true,
  "Disabled label must use a semantic text token that passes contrast"
);
assert.equal(
  /--accent-primary|--color-primary|#2563eb/i.test(disabledBlock),
  false,
  "Disabled state must not keep accent-primary paint"
);
// --text-tertiary fails AA on light surfaces (audit P2-7); must not be used here.
assert.equal(
  /var\(--text-tertiary\)/.test(disabledBlock),
  false,
  "Disabled label must not use --text-tertiary (fails AA on light)"
);

/* ------------------------------------------------------------------------- */
/* 3–6. Shared primitives and global stylesheets untouched                     */
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
assert.equal(
  button.includes("disabled"),
  false,
  "Shared Button must not gain disabled-specific handling"
);

/* ------------------------------------------------------------------------- */
/* 7–8. Validation contract: P1-2-aware readiness guard                        */
/*                                                                             */
/* P1-2 was closed by ADMIN-MANUAL-ORDER-MODAL-FORM-VALIDATION-UX-DECISION-1:   */
/* canSubmit now reflects the required-field rules validateForm already owned,   */
/* so the previous "customer validity must stay out of canSubmit" assertion is   */
/* retired. What it protected is now asserted positively: same rules, no new or  */
/* hardened rule, Retiro never requires Delivery-only fields.                   */
/* ------------------------------------------------------------------------- */

const canSubmitBlock = modal.match(/const canSubmit =[\s\S]*?;/)?.[0];
assert.ok(canSubmitBlock, "canSubmit declaration required");

// 1–3. Required-field readiness + preserved ticket/session/submitting guards.
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
  canSubmitBlock.includes("!isSubmitting"),
  true,
  "canSubmit must keep blocking while a submit is in progress"
);
assert.equal(
  canSubmitBlock.includes("canCreateOrder"),
  true,
  "canSubmit must keep the session/permission guard"
);
assert.equal(
  modal.includes("disabled={!canSubmit}"),
  true,
  "Compose CTA must keep native disabled driven by canSubmit"
);

// 4–7. Readiness derives from the existing rules only.
const requiredRules = modal.match(
  /function getManualOrderRequiredFieldErrors\([\s\S]*?return requiredErrors;\s*\n\}/
)?.[0];
assert.ok(requiredRules, "Shared required-field helper must exist");
assert.equal(
  requiredRules.includes("if (!input.customerName.trim()) {"),
  true,
  "customerName must stay a non-empty check (not hardened)"
);
assert.equal(
  requiredRules.includes("if (!input.phone.trim()) {"),
  true,
  "phone must stay a non-empty check (no new regex/length/format rule)"
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

// 8. validateForm keeps the same rules and messages, now via the shared helper.
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

// 9. Configurator validity untouched and not mixed with compose readiness.
assert.equal(
  modal.includes("disabled={isSubmitting || !configureDraftValid}"),
  true,
  "Configurator CTA must keep native disabled driven by configureDraftValid"
);
assert.equal(
  canSubmitBlock.includes("configureDraftValid"),
  false,
  "Compose readiness must not mix with configurator validity"
);

// pointer-events must never substitute native disabled on the CTA.
assert.equal(
  /\.manual-order-modal__submit-button[\s\S]{0,200}pointer-events:\s*none/.test(css),
  false,
  "Disabled CTA must not be faked with pointer-events: none"
);

/* ------------------------------------------------------------------------- */
/* 9. Order action wiring unchanged                                           */
/* ------------------------------------------------------------------------- */

assert.equal(
  modal.includes(
    'import { createManualOrderAction } from "@/app/admin/(protected)/orders/actions"'
  ),
  true,
  "createManualOrderAction wiring must remain unchanged"
);
assert.equal(
  modal.includes("ticketLines: createInput.ticketLines"),
  true,
  "Submit payload must remain unchanged"
);
assert.equal(
  modal.includes("manualTicketLinesToCreateInput(ticketLines)"),
  true,
  "Payload derivation must remain unchanged"
);

/* ------------------------------------------------------------------------- */
/* 10. Single-scroll architecture untouched                                   */
/* ------------------------------------------------------------------------- */

const mobileMatch = css.match(
  /@media\s*\(\s*max-width:\s*899px\s*\)\s*\{([\s\S]*?)(?=@media|$)/
);
assert.ok(mobileMatch, "≤899 single-scroll media block must remain");
const mobileBlock = mobileMatch[1];
assert.equal(
  /\.manual-order-modal__body\s*\{[\s\S]*?overflow-y:\s*auto/.test(mobileBlock),
  true,
  "Body must remain the sole ≤899 scroll owner"
);
assert.equal(
  /\.manual-order-modal__workstation\s*\{[\s\S]*?overflow:\s*visible/.test(mobileBlock),
  true,
  "Workstation must not nest-scroll on ≤899"
);
assert.equal(
  mobileBlock.includes("max-height: none"),
  true,
  "Nested panes must keep dropping max-height on ≤899"
);

// Footer must stay a sibling in flow: sticky only, never fixed/absolute.
const footerMatch = css.match(/\.manual-order-modal__footer\s*\{([\s\S]*?)\}/);
assert.ok(footerMatch, "Footer rule required");
const footerBlock = footerMatch[1];
assert.equal(
  /position:\s*sticky/.test(footerBlock),
  true,
  "Footer must remain sticky in flow"
);
assert.equal(
  /position:\s*(fixed|absolute)/.test(footerBlock),
  false,
  "Footer must not become fixed/absolute"
);
assert.equal(
  /overflow-y:\s*auto/.test(footerBlock),
  false,
  "Footer must not introduce a nested scroll"
);

/* ------------------------------------------------------------------------- */
/* 11. Footer material + decorative scroll-edge fade                          */
/* ------------------------------------------------------------------------- */

assert.equal(
  /box-shadow:\s*0\s+-/.test(footerBlock),
  true,
  "Footer must gain an upward separation shadow"
);
assert.equal(
  /backdrop-filter:\s*blur/.test(footerBlock),
  true,
  "Footer must keep its translucent material"
);
assert.equal(
  /-webkit-backdrop-filter:\s*blur/.test(footerBlock),
  true,
  "Footer blur must include the -webkit- prefix for Safari/iOS parity"
);
assert.equal(
  /border-top:\s*1px solid/.test(footerBlock),
  true,
  "Footer must keep an explicit top separator"
);

const fadeMatch = css.match(
  /\.manual-order-modal__footer::before\s*\{([\s\S]*?)\}/
);
assert.ok(fadeMatch, "Decorative scroll-edge fade pseudo-element required");
const fadeBlock = fadeMatch[1];
assert.equal(
  /pointer-events:\s*none/.test(fadeBlock),
  true,
  "Scroll-edge fade must be non-interactive"
);
assert.equal(
  /linear-gradient/.test(fadeBlock),
  true,
  "Scroll-edge fade must be a gradient, not a solid block"
);
assert.equal(
  /bottom:\s*100%/.test(fadeBlock),
  true,
  "Scroll-edge fade must sit above the footer, not over the action row"
);
const fadeHeight = fadeBlock.match(/height:\s*(\d+)px/);
assert.ok(fadeHeight, "Scroll-edge fade must declare an explicit height");
assert.ok(
  Number(fadeHeight[1]) <= 24,
  "Scroll-edge fade must stay a thin edge treatment, not a body overlay"
);

/* ------------------------------------------------------------------------- */
/* 12. Configurator panel untouched                                           */
/* ------------------------------------------------------------------------- */

assert.equal(
  panel.includes("validateCustomizationSelection"),
  true,
  "Configurator validation must remain in place"
);
assert.equal(
  panel.includes("manual-order-modal__submit"),
  false,
  "Configurator panel must not absorb footer CTA styling"
);
assert.equal(
  panelCss.includes("manual-order-modal__footer"),
  false,
  "Configurator panel CSS must not own the modal footer"
);
assert.equal(
  panelCss.includes("ui-button"),
  false,
  "Configurator panel CSS must not restyle the shared button primitive"
);

/* ------------------------------------------------------------------------- */
/* 13. Mobile amount parity + blocked CTA copy                                */
/* ------------------------------------------------------------------------- */

// The split desktop/mobile labels are gone: one amount-bearing label at all widths.
assert.equal(
  modal.includes("manual-order-modal__submit-label-desktop"),
  false,
  "Width-gated desktop-only amount label must be removed"
);
assert.equal(
  modal.includes("manual-order-modal__submit-label-mobile"),
  false,
  "Amount-less mobile label must be removed"
);
assert.equal(
  css.includes("manual-order-modal__submit-label-desktop"),
  false,
  "Dead desktop label rule must be removed from CSS"
);
assert.equal(
  css.includes("manual-order-modal__submit-label-mobile"),
  false,
  "Dead mobile label rule must be removed from CSS"
);
assert.equal(
  /<span className=\{styles\["manual-order-modal__submit-label"\]\}>\s*Crear pedido · \{formatCurrency\(previewTotal\)\}/.test(
    modal
  ),
  true,
  "Compose CTA must render the amount at every width from the existing previewTotal"
);
assert.equal(
  /\.manual-order-modal__submit-label\s*\{[\s\S]*?white-space:\s*nowrap/.test(css),
  true,
  "Amount label must not wrap inside the CTA"
);
// No new pricing derivation: totals still come from the existing memoized values.
assert.equal(
  modal.includes("getManualTicketEstimatedTotal(ticketLines)"),
  true,
  "Compose total must still come from the existing ticket helper"
);
assert.equal(
  modal.includes("getManualOrderCustomizationDraftPreviewTotal(configureConfig, customizationDraft)"),
  true,
  "Configurator total must still come from the existing draft helper"
);

// Blocked configurator copy is driven by the same boolean that drives `disabled`.
assert.equal(
  modal.includes('"Completá las opciones"'),
  true,
  "Blocked configurator CTA must communicate the already-known invalid draft state"
);
assert.equal(
  /\{configureDraftValid \? \(/.test(modal),
  true,
  "Blocked copy must reuse configureDraftValid, not new validation logic"
);

/* ------------------------------------------------------------------------- */
/* Deferred P1-4 guard: product row grid / breakpoints unchanged              */
/* ------------------------------------------------------------------------- */

assert.equal(
  /\.manual-order-modal__product-row\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)\s*auto\s*auto/.test(
    css
  ),
  true,
  "P1-4 must remain deferred: base product row grid unchanged"
);
assert.equal(
  /\.manual-order-modal__product-price\s*\{[\s\S]*?min-width:\s*4\.75rem/.test(css),
  true,
  "P1-4 must remain deferred: product price min-width unchanged"
);
assert.equal(
  /@media\s*\(\s*min-width:\s*900px\s*\)\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1\.45fr\)\s*minmax\(300px,\s*0\.85fr\)/.test(
    css
  ),
  true,
  "P1-4 must remain deferred: workstation two-column breakpoint unchanged"
);
assert.equal(
  /grid-template-areas:\s*\n?\s*"copy price"/.test(css),
  true,
  "≤639 product row areas must remain unchanged"
);

/* ------------------------------------------------------------------------- */
/* P1-3 configurator scroll entry: modal-body-owner guard                     */
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
 * Retired blanket `querySelector` ban: the focus containment certified in
 * ADMIN-MANUAL-ORDER-MODAL-ACCESSIBILITY-INTERACTION-POLISH-1 queries the dialog
 * node. All this block ever needed to prove is that CTA/footer work did not reach
 * for the scroll owner through the DOM, so it pins query ownership instead.
 */
const domQueries = [...new Set(modalCode.match(/[\w.?]*\.querySelector(?:All)?\b/g) ?? [])];
assert.deepEqual(
  domQueries,
  ["container.querySelectorAll"],
  `CTA/footer work must not introduce a DOM lookup for scrolling, found: ${domQueries.join(", ")}`
);
assert.equal(
  /function getManualOrderFocusableElements\(container: HTMLElement\)[\s\S]*?container\.querySelectorAll/.test(
    modalCode
  ),
  true,
  "The only DOM query must remain the dialog-scoped focusables helper"
);

// 4. Single-scroll invariant: no second owner introduced by the configurator.
assert.equal(
  /overflow-y:\s*(auto|scroll)/.test(panelCss),
  false,
  "The configurator panel must not introduce a nested scroll owner"
);

console.log("PASS: admin-manual-order-modal-cta-footer-states-polish.verify.ts");
