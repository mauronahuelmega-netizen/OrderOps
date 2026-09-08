/**
 * Source contracts for ADMIN-MANUAL-ORDER-MODAL-TICKET-SUMMARY-HIERARCHY-POLISH-1.
 *
 * Scope: presentation-only hierarchy for the "Pedido / Ticket en construcción"
 * block (P2-9, P2-10, P2-6, P3-1). Asserts the new grouped rendering reads the
 * structured snapshot the domain already produced — never a parsed
 * displaySummary string and never a re-derived price — and that ticket domain,
 * pricing, quantity/remove semantics, the four closed P1 guards, the
 * single-scroll owner and every shared/global/server file stay untouched.
 *
 * Run: npx tsx lib/orders/admin-manual-order-modal-ticket-summary-hierarchy-polish.verify.ts
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

const modal = read("components/admin/orders/manual-order-modal.tsx");
const css = read("components/admin/orders/manual-order-modal.module.css");
const ticket = read("lib/orders/manual-order-customization-ticket.ts");
const types = read("lib/orders/manual-order-types.ts");
const panel = read("components/admin/orders/manual-order-customization-panel.tsx");
const shellCss = read("components/admin/orders/admin-order-modal.module.css");
const globals = read("app/globals.css");
const tokens = read("app/theme-tokens.css");
const button = read("components/ui/Button.tsx");
const actions = read("app/admin/(protected)/orders/actions.ts");

const modalCode = code(modal);

/* ------------------------------------------------------------------------- */
/* 1. Ticket rendering still consumes ManualOrderTicketLine data              */
/* ------------------------------------------------------------------------- */

assert.equal(
  modalCode.includes("type ManualOrderTicketLine"),
  true,
  "The modal must keep consuming the ManualOrderTicketLine type from the domain"
);
assert.equal(
  /rootTicketLines\.map\(\(line\) => \{/.test(modalCode),
  true,
  "The summary must still iterate the derived root ticket lines"
);
assert.equal(
  /\{line\.quantity\} × \{line\.productName\}/.test(modalCode),
  true,
  "Root identity must render line.quantity × line.productName from the line itself"
);
assert.equal(
  /manual-order-modal__summary-subtotal"\]\}>\s*\{formatCurrency\(line\.lineTotal\)\}/.test(
    modalCode
  ),
  true,
  "Root subtotal must render the domain lineTotal, not a recomputed value"
);

const projection = modalCode.match(
  /function getManualTicketSummaryGroups\([\s\S]*?\n\}/
)?.[0];
assert.ok(
  projection,
  "A local presentation projection must build the grouped selections"
);

/* ------------------------------------------------------------------------- */
/* 2. No parsing of displaySummary to infer domain groups                    */
/* ------------------------------------------------------------------------- */

assert.equal(
  /displaySummary[\s\S]{0,120}?\.(split|match|replace|slice|indexOf|substring|exec)\(/.test(
    modalCode
  ),
  false,
  "displaySummary must never be split/matched/sliced to reconstruct groups"
);
assert.equal(
  /(split|match|exec|matchAll)\([\s\S]{0,40}(Papas|Salsas|Agregados|:\s*"|\+\$)/.test(
    modalCode
  ),
  false,
  "No group/label/price string parsing may drive the new summary UI"
);
assert.equal(
  /Papas|Salsas|Agregados extra/.test(modalCode),
  false,
  "Group names must come from data, never be hardcoded in the modal"
);
assert.equal(
  modalCode.includes("line.displaySummary.map((entry) => ("),
  true,
  "Lines without a snapshot must still render displaySummary entries whole"
);

/* Grouped rendering must read the structured snapshot fields as-is. */
for (const field of [
  "snapshot.groups",
  "group.selected_options",
  "group.group_name",
  "option.option_name",
  "option.quantity",
  "option.total_price_delta"
]) {
  assert.equal(
    projection.includes(field),
    true,
    `The projection must read ${field} straight from the customization snapshot`
  );
}
assert.equal(
  projection.includes("line.customizationSnapshot"),
  true,
  "The projection must source the snapshot already attached to the ticket line"
);

/* ------------------------------------------------------------------------- */
/* 3. Qty extras explicit, delta never re-multiplied in render (P3-1)        */
/* ------------------------------------------------------------------------- */

assert.equal(
  /option\.quantity > 1 \? \(/.test(modalCode),
  true,
  "Option quantity above 1 must be rendered explicitly"
);
assert.equal(
  /×\{option\.quantity\}/.test(modalCode),
  true,
  "The explicit option quantity must render the structured quantity value"
);
assert.equal(
  /formatCurrency\(option\.totalPriceDelta\)/.test(modalCode),
  true,
  "The option delta must render the snapshot's own total_price_delta"
);
assert.equal(
  /(priceDelta|price_delta|totalPriceDelta|total_price_delta)\s*\*/.test(modalCode),
  false,
  "The modal must not multiply option deltas — the snapshot already totals them"
);
assert.equal(
  /(unitPrice|lineTotal)\s*\*\s*(quantity|line\.quantity)/.test(modalCode),
  false,
  "The modal must not recompute line totals from unit price × quantity"
);

/* ------------------------------------------------------------------------- */
/* 4. Parent → upsell child relation still uses the existing line structure  */
/* ------------------------------------------------------------------------- */

assert.equal(
  /child\.kind === "upsell" &&\s*child\.parentClientLineId === line\.clientLineId/.test(
    modalCode
  ),
  true,
  "Children must still be resolved by kind + parentClientLineId on the lines"
);
assert.equal(
  modalCode.includes("{UPSELL_ASSOCIATED_LABEL}"),
  true,
  "The child block must use the shared Adicional label copy"
);
assert.equal(
  /manual-order-modal__summary-upsells/.test(modalCode),
  true,
  "Children must render inside a dedicated nested Adicional container (P2-10)"
);
assert.equal(
  /manual-order-modal__summary-child-total"\]\s*\}\s*>\s*\{formatCurrency\(child\.lineTotal\)\}/.test(
    modalCode
  ),
  true,
  "Child subtotal must stay separate and render the child's own lineTotal"
);
assert.equal(
  /\{child\.parentClientLineId\}|\{child\.kind\}|item_kind/.test(modalCode),
  false,
  "Technical fields (parentClientLineId, kind, item_kind) must never be rendered"
);
assert.equal(
  /line\.lineTotal\s*\+|\+\s*child\.lineTotal/.test(modalCode),
  false,
  "Child price must not be folded into the parent subtotal"
);

/* ------------------------------------------------------------------------- */
/* 5-6. Quantity + remove/cascade handlers unchanged                          */
/* ------------------------------------------------------------------------- */

assert.equal(
  /updateLineQuantity\(line\.clientLineId, line\.quantity - 1\)/.test(modalCode),
  true,
  "Decrement handler must remain untouched"
);
assert.equal(
  /updateLineQuantity\(line\.clientLineId, line\.quantity \+ 1\)/.test(modalCode),
  true,
  "Increment handler must remain untouched"
);
assert.equal(
  /removeLine\(line\.clientLineId\)/.test(modalCode),
  true,
  "Remove handler must remain untouched"
);
assert.equal(
  modalCode.includes("updateManualTicketLineQuantity"),
  true,
  "Quantity mutation must keep delegating to the domain helper"
);
assert.equal(
  modalCode.includes("removeManualTicketLine"),
  true,
  "Removal must keep delegating to the domain helper (cascade lives there)"
);
assert.equal(
  /aria-label=\{`Quitar uno de \$\{line\.productName\}`\}/.test(modalCode),
  true,
  "Stepper decrement accessible name must be preserved"
);
assert.equal(
  /aria-label=\{`Agregar uno de \$\{line\.productName\}`\}/.test(modalCode),
  true,
  "Stepper increment accessible name must be preserved"
);
assert.equal(
  /aria-label=\{`Quitar \$\{line\.productName\} del pedido`\}/.test(modalCode),
  true,
  "Remove accessible name must be preserved"
);

/* Stepper grouped as a unit, Quitar separated — spacing only, no resizing. */
const actionsRowStart = modalCode.indexOf("manual-order-modal__summary-actions");
const stepperStart = modalCode.indexOf("manual-order-modal__quantity-controls");
const removeStart = modalCode.indexOf("manual-order-modal__remove-button");
assert.equal(
  actionsRowStart >= 0 && stepperStart > actionsRowStart && removeStart > stepperStart,
  true,
  "Quitar must sit outside the stepper group inside the actions row (P2-6)"
);
const stepperMarkup = modalCode.slice(stepperStart, removeStart);
assert.equal(
  /Agregar uno de/.test(stepperMarkup),
  true,
  "Both stepper buttons must stay inside the stepper group, before Quitar"
);
assert.equal(
  /manual-order-modal__quantity-controls[\s\S]*?manual-order-modal__remove-button/.test(
    modalCode
  ),
  true,
  "The remove control must render after the stepper unit"
);
const actionsRow = css.match(
  /\.manual-order-modal__summary-actions\s*\{([\s\S]*?)\}/
)?.[1];
assert.ok(actionsRow, "The summary actions row must be styled");
assert.equal(
  /justify-content:\s*space-between/.test(actionsRow),
  true,
  "Quitar must be visually separated from the stepper's + button"
);
const quantityButton = css.match(
  /\.manual-order-modal__quantity-button\s*\{([\s\S]*?)\}/
)?.[1];
assert.ok(quantityButton, "Stepper button rule must remain");
/*
 * Originally pinned at exactly 28×28 while the tap-target debt was deferred.
 * ADMIN-MANUAL-ORDER-MODAL-ACCESSIBILITY-INTERACTION-POLISH-1 closed that debt,
 * so the guard keeps the same protective intent — the stepper must declare an
 * explicit, adequate square hit area — in the direction that now applies.
 */
const stepperWidth = quantityButton.match(/(?:min-)?width:\s*(\d+)px/)?.[1];
const stepperHeight = quantityButton.match(/(?:min-)?height:\s*(\d+)px/)?.[1];
assert.ok(stepperWidth && stepperHeight, "Stepper must declare an explicit square hit area");
assert.equal(
  Number(stepperWidth) >= 44 && Number(stepperHeight) >= 44,
  true,
  `Stepper hit area must stay at least 44px (found ${stepperWidth}×${stepperHeight})`
);

/* ------------------------------------------------------------------------- */
/* 7. Ticket domain, payload and pricing untouched                            */
/* ------------------------------------------------------------------------- */

assert.equal(
  ticket.includes("total += option.priceDelta * qty;"),
  true,
  "Domain customization delta computation must remain the single pricing source"
);
assert.equal(
  ticket.includes("lineTotal: line.unitPrice * line.quantity"),
  true,
  "Domain line total computation must remain unchanged"
);
assert.equal(
  /export function getManualTicketEstimatedTotal\(lines: ManualOrderTicketLine\[\]\): number \{\s*return lines\.reduce\(\(sum, line\) => sum \+ line\.lineTotal, 0\);/.test(
    ticket
  ),
  true,
  "Estimated total must remain the domain reduction over lineTotal"
);
assert.equal(
  /displaySummary: buildDisplaySummaryFromSelectedGroups\(input\.selectedGroups\)/.test(
    ticket
  ),
  true,
  "displaySummary must keep being produced by the domain builder"
);
assert.equal(
  ticket.includes("displaySummary: string[];"),
  true,
  "The ticket line shape must still expose displaySummary"
);
assert.equal(
  /kind: "upsell";\s*clientLineId: string;\s*productId: string;\s*quantity: number;\s*parentClientLineId: string;/.test(
    types
  ),
  true,
  "The create-input upsell payload shape must remain unchanged"
);
assert.equal(
  modalCode.includes("manualTicketLinesToCreateInput(ticketLines)"),
  true,
  "Submission must keep building the payload from the untouched mapper"
);
assert.equal(
  modalCode.includes("getManualTicketEstimatedTotal(ticketLines)"),
  true,
  "Preview total must keep using the domain estimated-total helper"
);

/* ------------------------------------------------------------------------- */
/* 8. P1-2 readiness helper / canSubmit unchanged                             */
/* ------------------------------------------------------------------------- */

const requiredRules = modalCode.match(
  /function getManualOrderRequiredFieldErrors\([\s\S]*?return requiredErrors;\s*\n\}/
)?.[0];
assert.ok(requiredRules, "The shared required-field helper must remain");
assert.equal(
  /requiredErrors\.customerName =/.test(requiredRules) &&
    /requiredErrors\.phone =/.test(requiredRules) &&
    /if \(input\.deliveryMethod === "delivery" && !input\.address\.trim\(\)\) \{\s*requiredErrors\.address =/.test(
      requiredRules
    ),
  true,
  "Required rules must stay exactly name + phone + delivery-only address"
);
assert.equal(
  /const requiredFormReady = useMemo\(/.test(modalCode),
  true,
  "requiredFormReady must remain a memoised derivation"
);
assert.equal(
  /const canSubmit =[\s\S]*?requiredFormReady/.test(modalCode),
  true,
  "canSubmit must keep depending on requiredFormReady"
);
assert.equal(
  /const canSubmit =[\s\S]*?hasSelectedItems/.test(modalCode),
  true,
  "canSubmit must keep the ticket readiness condition"
);
assert.equal(
  /const canSubmit =[\s\S]*?!isSubmitting/.test(modalCode),
  true,
  "canSubmit must keep the submitting guard"
);
assert.equal(
  modalCode.includes("Completá los datos obligatorios"),
  true,
  "The CTA readiness copy must remain"
);
assert.equal(
  modalCode.includes("Agregá productos"),
  true,
  "The empty-ticket CTA copy must remain"
);

/* ------------------------------------------------------------------------- */
/* 9. P1-3 configurator scroll entry / compose restore intact                 */
/* ------------------------------------------------------------------------- */

assert.equal(
  modalCode.includes("composeScrollTopRef"),
  true,
  "Compose scroll position must still be preserved for restore"
);
assert.equal(
  /bodyRef\.current[\s\S]{0,80}scrollTop = 0/.test(modalCode),
  true,
  "Entering the configurator must still reset the body scroll to 0"
);
assert.equal(
  /window\.scrollTo|document\.documentElement\.scrollTop\s*=|scrollIntoView/.test(
    modalCode
  ),
  false,
  "Scroll handling must stay scoped to the modal body element"
);

/* ------------------------------------------------------------------------- */
/* 10. P1-4 900–1023 product-row geometry intact                              */
/* ------------------------------------------------------------------------- */

const intermediate = css.match(
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

/* ------------------------------------------------------------------------- */
/* 11. CTA / footer selectors intact (P1-1)                                   */
/* ------------------------------------------------------------------------- */

const scopedDisabled = css.match(
  /\.manual-order-modal__footer\s+\.manual-order-modal__submit-button:disabled\s*\{([\s\S]*?)\}/
)?.[1];
assert.ok(scopedDisabled, "Scoped disabled CTA rule must remain");
assert.equal(
  /opacity:\s*1\b/.test(scopedDisabled) && /cursor:\s*not-allowed/.test(scopedDisabled),
  true,
  "Disabled CTA must keep its scoped neutral treatment"
);
const footerBlock = css.match(/\.manual-order-modal__footer\s*\{([\s\S]*?)\}/)?.[1];
assert.ok(footerBlock, "Footer rule must remain");
assert.equal(
  /position:\s*sticky/.test(footerBlock),
  true,
  "Footer must remain sticky in flow so it cannot cover the ticket"
);
assert.equal(
  /\.manual-order-modal__submit-label\s*\{[\s\S]*?white-space:\s*nowrap/.test(css),
  true,
  "Amount label must not wrap inside the CTA"
);

/* ------------------------------------------------------------------------- */
/* 12. No nested summary scroll introduced (single-scroll frozen)             */
/* ------------------------------------------------------------------------- */

const mobileBlock = css.match(/@media \(max-width: 899px\)\s*\{([\s\S]*?)\n\}/)?.[1];
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

for (const selector of [
  "summary-groups",
  "summary-group",
  "summary-options",
  "summary-option",
  "summary-upsells",
  "summary-child",
  "summary-actions"
]) {
  const block = css.match(
    new RegExp(`\\.manual-order-modal__${selector}\\s*\\{([\\s\\S]*?)\\}`)
  )?.[1];
  assert.ok(block, `The .manual-order-modal__${selector} rule must exist`);
  assert.equal(
    /overflow-y:\s*auto|overflow:\s*auto|overflow-y:\s*scroll|max-height:/.test(block),
    false,
    `.manual-order-modal__${selector} must not introduce a nested ticket scroll`
  );
  assert.equal(
    /position:\s*(fixed|sticky)/.test(block),
    false,
    `.manual-order-modal__${selector} must not become a fixed/sticky pane`
  );
}

/* Prices must have their own column so they can never overlap long names. */
for (const selector of ["summary-option", "summary-child"]) {
  const block = css.match(
    new RegExp(`\\.manual-order-modal__${selector}\\s*\\{([\\s\\S]*?)\\}`)
  )?.[1];
  assert.equal(
    /grid-template-columns:\s*minmax\(0, 1fr\) auto/.test(block ?? ""),
    true,
    `.manual-order-modal__${selector} must reserve a dedicated price column`
  );
}
assert.equal(
  /\.manual-order-modal__summary-option-delta\s*\{[\s\S]*?white-space:\s*nowrap/.test(
    css
  ),
  true,
  "Option deltas must not wrap"
);
assert.equal(
  /\.manual-order-modal__summary-child-total\s*\{[\s\S]*?white-space:\s*nowrap/.test(css),
  true,
  "Child subtotals must not wrap"
);

/* ------------------------------------------------------------------------- */
/* 13. No global / shared / server change                                     */
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
  /--summary-|--ticket-/.test(tokens),
  false,
  "This phase must not introduce ticket-specific global tokens"
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
  panel.includes("getManualTicketSummaryGroups"),
  false,
  "The configurator panel must not be touched by this ticket polish"
);
assert.equal(
  /supabase|create_order|migrations/.test(modalCode),
  false,
  "The modal must not reach the database or RPC directly"
);
assert.equal(
  /const result = await createManualOrderAction\(\{/.test(modalCode),
  true,
  "Submission must keep calling the untouched server action"
);
assert.equal(
  actions.includes("export async function createManualOrderAction"),
  true,
  "The server action signature must remain untouched"
);

console.log("PASS: admin-manual-order-modal-ticket-summary-hierarchy-polish.verify.ts");
