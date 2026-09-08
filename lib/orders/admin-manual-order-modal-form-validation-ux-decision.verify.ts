/**
 * Source contracts for ADMIN-MANUAL-ORDER-MODAL-FORM-VALIDATION-UX-DECISION-1.
 *
 * Scope: align the manual order compose CTA readiness with the required-field
 * rules validateForm already owned (P1-2). Asserts the alignment exists AND that
 * no validation rule was invented or hardened, Retiro never requires
 * Delivery-only fields, and the configurator, CTA/footer polish, P1-3 scroll
 * entry, P1-4 row geometry, single-scroll and server wiring are untouched.
 *
 * Run: npx tsx lib/orders/admin-manual-order-modal-form-validation-ux-decision.verify.ts
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

/** Extracts a declaration up to its terminating `;`, scoped from its start. */
function declaration(source: string, name: string): string {
  const match = source.match(new RegExp(`const ${name} =[\\s\\S]*?;`));
  assert.ok(match, `Expected to locate the ${name} declaration`);
  return match[0];
}

const modal = read("components/admin/orders/manual-order-modal.tsx");
const css = read("components/admin/orders/manual-order-modal.module.css");
const panel = read("components/admin/orders/manual-order-customization-panel.tsx");
const panelCss = read(
  "components/admin/orders/manual-order-customization-panel.module.css"
);
const shell = read("components/admin/orders/admin-order-modal-shell.tsx");
const shellCss = read("components/admin/orders/admin-order-modal.module.css");
const globals = read("app/globals.css");
const tokens = read("app/theme-tokens.css");
const button = read("components/ui/Button.tsx");
const actions = read("app/admin/(protected)/orders/actions.ts");

const modalCode = code(modal);

/* ------------------------------------------------------------------------- */
/* 0. Single source of truth for the required-field rules                     */
/* ------------------------------------------------------------------------- */

const requiredRules = modalCode.match(
  /function getManualOrderRequiredFieldErrors\([\s\S]*?return requiredErrors;\s*\n\}/
)?.[0];
assert.ok(
  requiredRules,
  "A shared pure helper must own the required customer/delivery rules"
);

// It must be a pure derivation: no state, no side effects, no async.
assert.equal(
  /useState|useMemo|useEffect|setFieldErrors|async|await|fetch/.test(requiredRules),
  false,
  "The required-field helper must stay pure and synchronous"
);

/* ------------------------------------------------------------------------- */
/* 1. canSubmit now incorporates required-form readiness                      */
/* ------------------------------------------------------------------------- */

const canSubmitBlock = declaration(modalCode, "canSubmit");
assert.equal(
  canSubmitBlock.includes("requiredFormReady"),
  true,
  "canSubmit must incorporate readiness of the already-required form fields"
);

const readinessBlock = declaration(modalCode, "requiredFormReady");
assert.equal(
  readinessBlock.includes("getManualOrderRequiredFieldErrors({"),
  true,
  "Readiness must derive from the shared required-field helper, not a copy"
);
assert.equal(
  /\.length === 0/.test(readinessBlock),
  true,
  "Readiness must mean 'no required-field issue', nothing stricter"
);
// Readiness must read exactly the same four inputs the rules need.
for (const input of ["customerName", "phone", "deliveryMethod", "address"]) {
  assert.equal(
    readinessBlock.includes(input),
    true,
    `Readiness must consider the existing input: ${input}`
  );
}
// No parallel rule set may live in the readiness derivation itself.
assert.equal(
  /trim\(\)|RegExp|\.test\(|\.replace\(/.test(readinessBlock),
  false,
  "Readiness must not re-implement any field rule inline"
);

/* ------------------------------------------------------------------------- */
/* 2–3. Ticket readiness and the submitting guard are preserved               */
/* ------------------------------------------------------------------------- */

assert.equal(
  canSubmitBlock.includes("hasSelectedItems"),
  true,
  "canSubmit must keep requiring a non-empty ticket"
);
assert.equal(
  canSubmitBlock.includes("ticketSubmitReady"),
  true,
  "canSubmit must keep requiring per-line ticket readiness"
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
  canSubmitBlock.includes("products.length > 0"),
  true,
  "canSubmit must keep the products-loaded guard"
);
assert.equal(
  modal.includes("disabled={!canSubmit}"),
  true,
  "Compose CTA must keep native disabled driven by canSubmit"
);
// The submit lock and its early return must survive untouched.
assert.equal(
  modalCode.includes("if (!canSubmit || submitLockRef.current) {"),
  true,
  "Submit handler must keep its canSubmit + lock early return"
);

/* ------------------------------------------------------------------------- */
/* 4–5. Delivery conditional: Retiro must not require Delivery-only fields    */
/* ------------------------------------------------------------------------- */

assert.equal(
  /if \(input\.deliveryMethod === "delivery" && !input\.address\.trim\(\)\) \{\s*requiredErrors\.address =/.test(
    requiredRules
  ),
  true,
  "Address must stay required only when the method is delivery"
);
assert.equal(
  (requiredRules.match(/requiredErrors\.address\s*=/g) ?? []).length,
  1,
  "Address may be required in exactly one place: the Delivery branch"
);
// Name and phone must NOT be gated on delivery method.
assert.equal(
  /deliveryMethod[\s\S]{0,80}requiredErrors\.customerName|deliveryMethod[\s\S]{0,80}requiredErrors\.phone/.test(
    requiredRules
  ),
  false,
  "Name/phone requirements must not become delivery-conditional"
);
// The address field itself stays rendered only for delivery, as before.
assert.equal(
  modal.includes('{deliveryMethod === "delivery" ? ('),
  true,
  "The conditional address field must keep its existing render condition"
);
// Switching method must not wipe typed data.
assert.equal(
  /onChange=\{\(\) => setDeliveryMethod\("pickup"\)\}/.test(modal),
  true,
  "Pickup radio must only set the method"
);
assert.equal(
  /setDeliveryMethod\("(pickup|delivery)"\);?\s*set(Address|CustomerName|Phone)\(/.test(
    modalCode
  ),
  false,
  "Switching delivery method must not clear address/customer data"
);

/* ------------------------------------------------------------------------- */
/* 6–7. No new / hardened phone or customer rule                              */
/* ------------------------------------------------------------------------- */

assert.equal(
  requiredRules.includes("if (!input.phone.trim()) {"),
  true,
  "phone must stay a plain non-empty check"
);
assert.equal(
  requiredRules.includes("if (!input.customerName.trim()) {"),
  true,
  "customerName must stay a plain non-empty check"
);
assert.equal(
  /RegExp|\.test\(|\.match\(|\.replace\(|length\s*[<>]=?\s*\d|parseInt|Number\(/.test(
    requiredRules
  ),
  false,
  "No regex, normalization, length or numeric rule may be introduced"
);
// No phone/format helper may have been imported for this purpose.
assert.equal(
  /import[^\n]*(phone|normalizePhone|validatePhone)/i.test(modal),
  false,
  "No new phone validation/normalization import may appear"
);
// Field onChange handlers must stay clear-error-only (no aggressive live errors).
for (const field of ["customerName", "phone", "address"]) {
  assert.equal(
    new RegExp(`${field}: undefined`).test(modal),
    true,
    `Typing must keep only clearing the ${field} error, not asserting new ones`
  );
}

/* ------------------------------------------------------------------------- */
/* 8. validateForm remains semantically equivalent                            */
/* ------------------------------------------------------------------------- */

const validateFormBlock = modalCode.match(
  /const validateForm = \(\) => \{[\s\S]*?\n  \};/
)?.[0];
assert.ok(validateFormBlock, "validateForm must exist");
assert.equal(
  validateFormBlock.includes("getManualOrderRequiredFieldErrors({"),
  true,
  "validateForm must consume the same shared rules (no duplicated rule set)"
);
// Every original message and ticket rule must survive verbatim.
for (const rule of [
  '"El nombre del cliente es obligatorio."',
  '"El teléfono es obligatorio."',
  '"La dirección es obligatoria para delivery."',
  'nextFieldErrors.items = "Agregá al menos un producto."',
  'nextFieldErrors.items = "La cantidad debe ser mayor a cero."',
  '"Este producto requiere configuración antes de crear el pedido."'
]) {
  assert.equal(
    modal.includes(rule),
    true,
    `validateForm must keep its existing rule/message: ${rule}`
  );
}

/*
 * The orphan-upsell rule used to be pinned by its exact sentence, which ended in
 * "Revisá el ticket." — replaced by "Revisá el pedido." in ADMIN-MANUAL-ORDER-
 * MODAL-MICROCOPY-CONSISTENCY-POLISH-1. The rule itself never changed, so pin the
 * triggering condition and the terminology rather than one brittle string.
 */
const orphanUpsellRule = modal.match(
  /if \(!parent \|\| parent\.kind !== "customized"\) \{[\s\S]{0,240}?nextFieldErrors\.items =\s*\n?\s*"([^"]+)";/
);
assert.ok(
  orphanUpsellRule,
  "The orphan-upsell guard must keep its condition and still set an items error"
);
assert.equal(
  /\bpedido\b/i.test(orphanUpsellRule[1]) && /ticket/i.test(orphanUpsellRule[1]) === false,
  true,
  `The orphan-upsell message must speak of pedido, not ticket: "${orphanUpsellRule[1]}"`
);
assert.equal(
  validateFormBlock.includes("return Object.keys(nextFieldErrors).length === 0;"),
  true,
  "validateForm must keep its existing return contract"
);
assert.equal(
  validateFormBlock.includes("setFieldErrors(nextFieldErrors);"),
  true,
  "validateForm must keep publishing field errors on submit"
);
assert.equal(
  modalCode.includes("if (!validateForm()) {"),
  true,
  "Submit must keep gating on validateForm as the authoritative check"
);

/* ------------------------------------------------------------------------- */
/* CTA copy: three readiness states, amount preserved                         */
/* ------------------------------------------------------------------------- */

assert.equal(
  modal.includes('"Agregá productos"'),
  true,
  "Empty ticket must state the missing ticket"
);
assert.equal(
  modal.includes('"Completá los datos obligatorios"'),
  true,
  "Ticket-ready but data-missing must state the missing required data"
);
assert.equal(
  /<span className=\{styles\["manual-order-modal__submit-label"\]\}>\s*Crear pedido · \{formatCurrency\(previewTotal\)\}/.test(
    modal
  ),
  true,
  "Ready state must keep the amount-bearing label at every width"
);
// Copy must be driven by the same booleans that drive disabled: no third source.
assert.equal(
  /!hasSelectedItems \? \(\s*"Agregá productos"\s*\) : !requiredFormReady \? \(\s*"Completá los datos obligatorios"/.test(
    modal
  ),
  true,
  "CTA copy must derive from hasSelectedItems then requiredFormReady, in that order"
);
assert.equal(
  modal.includes('"Creando pedido..."'),
  true,
  "Submitting copy must remain"
);
// Compose copy must not leak into the configurator, or vice versa.
assert.equal(
  modal.includes('"Completá las opciones"'),
  true,
  "Configurator blocked copy must remain unchanged"
);
assert.equal(
  /configureDraftValid \? \(/.test(modal),
  true,
  "Configurator copy must keep deriving from configureDraftValid"
);
assert.equal(
  /requiredFormReady[\s\S]{0,60}Completá las opciones/.test(modal),
  false,
  "Compose readiness must not drive the configurator copy"
);

/* ------------------------------------------------------------------------- */
/* 11. Configurator validity unchanged                                        */
/* ------------------------------------------------------------------------- */

assert.equal(
  /const configureDraftValid =\s*\n?\s*configureConfig && customizationDraft\s*\n?\s*\? isManualOrderCustomizationDraftValid\(configureConfig, customizationDraft\)\s*\n?\s*: false;/.test(
    modal
  ),
  true,
  "configureDraftValid composition must remain byte-identical"
);
assert.equal(
  modal.includes("disabled={isSubmitting || !configureDraftValid}"),
  true,
  "Configurator CTA disabled must stay driven by configureDraftValid"
);
assert.equal(
  canSubmitBlock.includes("configureDraftValid"),
  false,
  "Compose readiness must not mix with configurator validity"
);
assert.equal(
  declaration(modalCode, "configureDraftValid").includes("requiredFormReady"),
  false,
  "Configurator validity must not read compose readiness"
);
assert.equal(
  panel.includes("requiredFormReady") || panel.includes("canSubmit"),
  false,
  "The configurator panel must not learn about compose readiness"
);

/* ------------------------------------------------------------------------- */
/* 10. Pricing / payload / server wiring unchanged                            */
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
assert.equal(
  modal.includes("getManualTicketEstimatedTotal(ticketLines)"),
  true,
  "Compose pricing must still come from the existing helper"
);
// Readiness must never reach the payload.
assert.equal(
  /createManualOrderAction\(\{[\s\S]*?requiredFormReady/.test(
    modalCode.match(/createManualOrderAction\(\{[\s\S]*?\}\);/)?.[0] ?? ""
  ),
  false,
  "Readiness must not enter the submit payload"
);
assert.equal(
  actions.includes('requireAdminPermission("updateOrders")'),
  true,
  "Server action permission gate must remain unchanged"
);
assert.equal(
  /requiredFormReady|Completá los datos obligatorios/.test(actions),
  false,
  "The server action must not learn about client readiness"
);

/* ------------------------------------------------------------------------- */
/* 12. P1-3 scroll implementation intact                                      */
/* ------------------------------------------------------------------------- */

assert.equal(
  modal.includes('<div className={styles["manual-order-modal__body"]} ref={bodyRef}>'),
  true,
  "The modal body must remain the scroll owner reached by ref"
);
assert.equal(
  modalCode.includes("bodyRef.current.scrollTop = 0;"),
  true,
  "Configurator entry reset must remain"
);
assert.equal(
  /body\.scrollTop = viewKey === "compose" \? composeScrollTopRef\.current : 0;/.test(
    modalCode
  ),
  true,
  "Subview scroll effect must remain intact"
);
assert.equal(
  modalCode.includes("composeScrollTopRef.current = bodyRef.current?.scrollTop ?? 0;"),
  true,
  "Compose offset capture must remain"
);
assert.equal(
  /const viewKey =\s*\n?\s*view\.type === "configure" \? `configure:\$\{view\.productId\}` : "compose";/.test(
    modal
  ),
  true,
  "Subview identity key must remain intact"
);
for (const forbidden of [
  "window.scrollTo",
  "window.scroll(",
  "document.body.scrollTop",
  "document.documentElement.scrollTop",
  "scrollIntoView"
]) {
  assert.equal(
    modalCode.includes(forbidden),
    false,
    `This phase must not introduce ${forbidden}`
  );
}

/*
 * `querySelector` left the list above once focus containment started querying the
 * dialog node. The scroll owner must still never be resolved through the DOM, so
 * the guard pins that the only query is the dialog-scoped focusables lookup.
 */
const domQueries = [...new Set(modalCode.match(/[\w.?]*\.querySelector(?:All)?\b/g) ?? [])];
assert.deepEqual(
  domQueries,
  ["container.querySelectorAll"],
  `The scroll owner must not be resolved via DOM lookup, found: ${domQueries.join(", ")}`
);
// Contextual header from the previous phase stays.
assert.equal(
  /const shellTitle = configureProduct\s*\n?\s*\? `Configurar \$\{configureProduct\.name\}`\s*\n?\s*: "Nuevo pedido";/.test(
    modal
  ),
  true,
  "Contextual shell title must remain intact"
);
assert.equal(
  modal.includes("CONFIGURE_BLOCKING_NOTE_ID"),
  true,
  "Configurator blocking-feedback surface must remain intact"
);

/* ------------------------------------------------------------------------- */
/* 13–14. P1-4 row geometry + single-scroll intact                            */
/* ------------------------------------------------------------------------- */

assert.equal(
  /@media\s*\(\s*min-width:\s*900px\s*\)\s*and\s*\(\s*max-width:\s*1023px\s*\)\s*\{[\s\S]*?grid-template-areas:\s*\n?\s*"copy copy"\s*\n?\s*"price add";/.test(
    css
  ),
  true,
  "P1-4 fix must remain: 900–1023 row keeps its two-line geometry"
);
assert.equal(
  /\.manual-order-modal__product-copy\s*\{[\s\S]*?overflow-wrap:\s*anywhere/.test(css),
  true,
  "P1-4 fix must remain: product copy keeps overflow-wrap: anywhere"
);
assert.equal(
  /@media\s*\(\s*min-width:\s*900px\s*\)\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1\.45fr\)\s*minmax\(300px,\s*0\.85fr\)/.test(
    css
  ),
  true,
  "Workstation breakpoint must remain unchanged"
);

const mobileBlock = css.match(
  /@media\s*\(\s*max-width:\s*899px\s*\)\s*\{([\s\S]*?)(?=@media|$)/
)?.[1];
assert.ok(mobileBlock, "≤899 single-scroll media block must remain");
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
  /overflow-y:\s*(auto|scroll)/.test(panelCss),
  false,
  "No nested scroll owner may appear in the configurator panel"
);

/* ------------------------------------------------------------------------- */
/* CTA/footer scoped styles intact (P1-1 stays closed)                        */
/* ------------------------------------------------------------------------- */

const scopedDisabled = css.match(
  /\.manual-order-modal__footer\s+\.manual-order-modal__submit-button:disabled\s*\{([\s\S]*?)\}/
)?.[1];
assert.ok(scopedDisabled, "Scoped disabled CTA rule must remain");
assert.equal(
  /opacity:\s*1\b/.test(scopedDisabled),
  true,
  "Disabled CTA must keep its scoped neutral treatment, not the global dim"
);
assert.equal(
  /cursor:\s*not-allowed/.test(scopedDisabled),
  true,
  "Disabled CTA must keep the not-allowed cursor"
);
const footerBlock = css.match(/\.manual-order-modal__footer\s*\{([\s\S]*?)\}/)?.[1];
assert.ok(footerBlock, "Footer rule must remain");
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
  /\.manual-order-modal__footer::before\s*\{[\s\S]*?linear-gradient/.test(css),
  true,
  "Footer scroll-edge fade must remain"
);
assert.equal(
  /\.manual-order-modal__submit-label\s*\{[\s\S]*?white-space:\s*nowrap/.test(css),
  true,
  "Amount label must not wrap inside the CTA"
);
assert.equal(
  /\.manual-order-modal__submit-button[\s\S]{0,200}pointer-events:\s*none/.test(css),
  false,
  "Disabled CTA must not be faked with pointer-events: none"
);

/* ------------------------------------------------------------------------- */
/* 15. No global / shared file changed                                        */
/* ------------------------------------------------------------------------- */

assert.equal(
  globals.includes("manual-order-modal"),
  false,
  "app/globals.css must not learn about the manual order modal"
);
assert.equal(
  /\.ui-button:disabled\s*\{\s*cursor:\s*not-allowed;\s*opacity:\s*0\.6;\s*transform:\s*none;\s*\}/.test(
    globals
  ),
  true,
  "Global .ui-button:disabled must remain exactly as before"
);
assert.equal(
  tokens.includes("manual-order-modal"),
  false,
  "app/theme-tokens.css must not learn about the manual order modal"
);
assert.equal(
  button.includes('const classes = ["ui-button", `ui-button--${variant}`, className]'),
  true,
  "Shared Button primitive must remain unchanged"
);
assert.equal(
  shell.includes("requiredFormReady") || shell.includes("canSubmit"),
  false,
  "Shared modal shell must not learn about form readiness"
);
assert.equal(
  shellCss.includes("manual-order-modal"),
  false,
  "Shared shell CSS must not learn about the manual order modal"
);
assert.equal(
  /supabase|create_order|migrations/.test(modalCode),
  false,
  "The modal must not reach the database or RPC directly"
);

console.log("PASS: admin-manual-order-modal-form-validation-ux-decision.verify.ts");
