/**
 * Source contracts for ADMIN-MANUAL-ORDER-MODAL-CONFIGURATOR-CONTEXT-POLISH-1.
 *
 * Scope: manual order modal configurator entry context — subview scroll entry on
 * the existing body scroll owner, contextual shell header, single canonical
 * required-block feedback surface and feature-scoped focus-visible. Asserts the
 * polish is present AND that validity authority, submit logic, pricing, payload,
 * shared primitives, the single-scroll architecture, the CTA/footer polish and
 * the P1-4 row geometry were not touched.
 *
 * Run: npx tsx lib/orders/admin-manual-order-modal-configurator-context-polish.verify.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

/** Comment-free view, so banned-API checks can't be satisfied by prose. */
function code(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
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
const panelCode = code(panel);

/* ------------------------------------------------------------------------- */
/* 1. compose/configure subview identity exists                               */
/* ------------------------------------------------------------------------- */

assert.equal(
  /type ManualOrderModalView =\s*\|\s*\{ type: "compose" \}\s*\|\s*\{ type: "configure"; productId: string \};/.test(
    modal
  ),
  true,
  "Subview union (compose | configure) must remain the view model"
);
assert.equal(
  /const viewKey =\s*\n?\s*view\.type === "configure" \? `configure:\$\{view\.productId\}` : "compose";/.test(
    modal
  ),
  true,
  "A subview identity key including the configured product id is required"
);

/* ------------------------------------------------------------------------- */
/* 2. Configurator entry resets ONLY the existing modal body scroll owner     */
/* ------------------------------------------------------------------------- */

assert.equal(
  modal.includes('<div className={styles["manual-order-modal__body"]} ref={bodyRef}>'),
  true,
  "The scroll reset must be wired to the existing modal body element"
);
assert.equal(
  /const bodyRef = useRef<HTMLDivElement \| null>\(null\);/.test(modal),
  true,
  "Body scroll owner must be reached through a local ref, not a DOM query"
);

const scrollAssignments = modalCode.match(/\.scrollTop\s*=/g) ?? [];
assert.equal(
  scrollAssignments.length,
  2,
  "Exactly two scroll writes are expected: the entry reset and the subview restore"
);
assert.equal(
  modal.includes("bodyRef.current.scrollTop = 0;"),
  true,
  "Opening the configurator must reset the body scroll owner to its top"
);
assert.equal(
  /body\.scrollTop = viewKey === "compose" \? composeScrollTopRef\.current : 0;/.test(
    modal
  ),
  true,
  "Subview effect must land the configurator at 0 and compose at the stored offset"
);

// Every scroll write must target the body owner: never a descendant, never a query.
assert.equal(
  /(document|window)\.(querySelector|getElementById|documentElement|body)[^\n]*scrollTop/.test(
    modalCode
  ),
  false,
  "Scroll reset must not reach the owner through a global DOM query"
);

/* ------------------------------------------------------------------------- */
/* 3–4. No window / document / body scrolling authority                       */
/* ------------------------------------------------------------------------- */

for (const forbidden of [
  "window.scrollTo",
  "window.scroll(",
  "window.scrollBy",
  "document.body.scrollTop",
  "document.documentElement.scrollTop",
  "scrollIntoView",
  "ResizeObserver",
  "IntersectionObserver",
  "setTimeout",
  "requestAnimationFrame"
]) {
  assert.equal(
    modalCode.includes(forbidden),
    false,
    `Scroll entry must not rely on ${forbidden}`
  );
}
/*
 * Originally a file-wide ban on useLayoutEffect. The accessibility phase needs
 * one for focus (the opener has to be read before the shell moves focus), so the
 * guard is now targeted at what it always meant to protect: scroll entry must
 * still be a plain effect, and no layout effect may drive scroll position.
 */
assert.equal(
  /useEffect\(\(\) => \{\s*const body = bodyRef\.current;[\s\S]*?body\.scrollTop = viewKey === "compose"/.test(
    modalCode
  ),
  true,
  "Scroll entry must remain a plain useEffect that only moves the modal body"
);
for (const layoutEffectBody of modalCode.match(/useLayoutEffect\([\s\S]*?\n  \}, \[[^\]]*\]\);/g) ??
  []) {
  assert.equal(
    /scrollTop|scrollTo|composeScrollTopRef/.test(layoutEffectBody),
    false,
    "No layout effect may drive scroll position"
  );
}
assert.equal(
  /useOpenerCaptureEffect\(\(\) => \{[\s\S]*?openerRef\.current/.test(modalCode),
  true,
  "The only layout-timed effect must be the focus opener capture"
);
assert.equal(
  panelCode.includes("scrollTop") || panelCode.includes("scrollIntoView"),
  false,
  "The configurator panel must not own any scroll behaviour"
);

// The compose offset is captured before the swap and cleared with the form.
assert.equal(
  modal.includes("composeScrollTopRef.current = bodyRef.current?.scrollTop ?? 0;"),
  true,
  "Compose offset must be captured before the subview swaps"
);
assert.equal(
  modal.includes("composeScrollTopRef.current = 0;"),
  true,
  "Reopening the modal must not restore a stale compose offset"
);

/* ------------------------------------------------------------------------- */
/* 5. No nested scroll owner introduced                                       */
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
  /overflow-y:\s*(auto|scroll)/.test(panelCss),
  false,
  "The configurator panel must not introduce a second scroll owner"
);
assert.equal(
  /position:\s*fixed/.test(panelCss),
  false,
  "The configurator panel must not become a fixed internal panel"
);

// Footer stays a sibling in flow.
const footerMatch = css.match(/\.manual-order-modal__footer\s*\{([\s\S]*?)\}/);
assert.ok(footerMatch, "Footer rule required");
assert.equal(
  /position:\s*sticky/.test(footerMatch[1]),
  true,
  "Footer must remain sticky in flow"
);
assert.equal(
  /overflow-y:\s*auto/.test(footerMatch[1]),
  false,
  "Footer must not introduce a nested scroll"
);

/* ------------------------------------------------------------------------- */
/* 6–7. Contextual shell header derives from the current subview              */
/* ------------------------------------------------------------------------- */

assert.equal(
  /const shellTitle = configureProduct\s*\n?\s*\? `Configurar \$\{configureProduct\.name\}`\s*\n?\s*: "Nuevo pedido";/.test(
    modal
  ),
  true,
  "Shell title must switch to the configured product and back to Nuevo pedido"
);
assert.equal(
  /const shellSubtitle = configureProduct/.test(modal),
  true,
  "Shell subtitle must also be subview-derived"
);
assert.equal(
  modal.includes('"Cargá un pedido tomado manualmente."'),
  true,
  "Compose subtitle must remain unchanged"
);
assert.equal(
  modal.includes("title={shellTitle}"),
  true,
  "The shell must receive the contextual title through its existing prop"
);
assert.equal(
  modal.includes("<h2>{shellTitle}</h2>"),
  true,
  "The visible header heading must render the contextual title"
);
assert.equal(
  modal.includes(">Pedido manual<"),
  true,
  "The PEDIDO MANUAL badge must stay on both subviews"
);

// The shared shell resolved the context through props: it must be untouched.
assert.equal(
  shell.includes("headerLeading"),
  true,
  "Shared shell must keep the headerLeading prop that made this possible"
);
assert.equal(
  shell.includes("Configurar"),
  false,
  "Shared shell must not learn manual-order configurator copy"
);
assert.equal(
  shellCss.includes("manual-order-modal"),
  false,
  "Shared shell CSS must not learn about the manual order modal"
);

/* ------------------------------------------------------------------------- */
/* 8. Duplicate equal-weight configurator heading demoted                     */
/* ------------------------------------------------------------------------- */

assert.equal(
  panelCode.includes("Configurar"),
  false,
  "The panel must not repeat the substep title now owned by the header"
);
assert.equal(
  /<h3 className=\{styles\.identity\}>/.test(panel),
  true,
  "Product identity must survive as a compact, demoted heading"
);
assert.equal(
  /<span className=\{styles\.identityName\}>\{productName\}<\/span>/.test(panel),
  true,
  "The identity block must still name the product for accessibility"
);
// h2 (shell) -> h3 (identity) -> h4 (groups): no skipped level, no competing h3.
assert.equal(
  (panel.match(/<h3/g) ?? []).length,
  1,
  "The panel must expose exactly one h3 (the identity anchor)"
);
assert.equal(
  panel.includes("<h4 className={styles.groupTitle}>"),
  true,
  "Groups must remain h4 under the identity h3"
);
assert.equal(
  panel.includes("<h2"),
  false,
  "The panel must not compete with the shell h2"
);
assert.equal(
  /\.identity\s*\{[\s\S]*?font-size:\s*0\.8[0-9]*rem/.test(panelCss),
  true,
  "The identity heading must be visually demoted, not equal-weight"
);

/* ------------------------------------------------------------------------- */
/* 9–10. configureDraftValid remains the only validity authority              */
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
  modal.includes(
    "if (!isManualOrderCustomizationDraftValid(configureConfig, customizationDraft)) {"
  ),
  true,
  "Confirm must keep re-checking the same validity helper"
);
assert.equal(
  /export function isManualOrderCustomizationDraftValid\([\s\S]*?const validation = validateCustomizationSelection\(\s*config\.groups,\s*selectedOptionsByGroupId,\s*draft\.selection\s*\);[\s\S]*?return isSelectionStrictlyWithinLimits\(config\.groups, draft\.selection\);/.test(
    panel
  ),
  true,
  "Draft validity must still be validateCustomizationSelection + strict limits only"
);

// The blocking-reason helper is a read-only projection: no rule of its own.
const reasonHelper = panel.match(
  /export function getManualOrderCustomizationDraftBlockingReason\([\s\S]*?\n\}/
);
assert.ok(reasonHelper, "Blocking-reason helper must exist");
assert.equal(
  /validation\.issues\[0\]\?\.message \?\? null/.test(reasonHelper[0]),
  true,
  "Blocking reason must be read from existing validation issues"
);
assert.equal(
  /required|minSelections|maxSelections|length ===|>=|<=/.test(reasonHelper[0]),
  false,
  "Blocking reason must not re-implement any selection rule"
);

/* ------------------------------------------------------------------------- */
/* Canonical blocking feedback: one surface, next to the CTA                  */
/* ------------------------------------------------------------------------- */

const noteRenders = modal.match(/CONFIGURE_BLOCKING_NOTE_ID/g) ?? [];
assert.equal(
  noteRenders.length,
  3,
  "The blocking note must be declared once, referenced by the CTA and rendered once"
);
assert.equal(
  /id=\{CONFIGURE_BLOCKING_NOTE_ID\}/.test(modal),
  true,
  "The blocking note must carry the stable local id"
);
assert.equal(
  /aria-describedby=\{\s*configureBlockingReason \? CONFIGURE_BLOCKING_NOTE_ID : undefined\s*\}/.test(
    modal
  ),
  true,
  "aria-describedby must only point at the note while it is rendered"
);
// The sentence must exist in exactly one place across modal + panel.
assert.equal(
  (modal.match(/\{configureBlockingReason\}/g) ?? []).length,
  1,
  "The blocking reason text must render exactly once"
);
assert.equal(
  panel.includes("validationMessage"),
  false,
  "The panel must no longer render a competing copy of the blocking message"
);
assert.equal(
  panelCss.includes("validationMessage"),
  false,
  "Dead validation-message rule must be removed from the panel CSS"
);
assert.equal(
  panelCss.includes(".groupIssue"),
  false,
  "Per-group full error copy must be gone (quiet badge cue only)"
);
assert.equal(
  /\.manual-order-modal__configure-note\s*\{/.test(css),
  true,
  "The blocking note must be styled locally in the modal CSS module"
);
assert.equal(
  /\.manual-order-modal__configure-note\s*\{[\s\S]*?position:\s*(fixed|absolute)/.test(
    css
  ),
  false,
  "The blocking note must not float over content as an overlay"
);

/* ------------------------------------------------------------------------- */
/* Pristine vs error timing is presentation-only                              */
/* ------------------------------------------------------------------------- */

assert.equal(
  modal.includes("const [hasConfigureInteraction, setHasConfigureInteraction] = useState(false);"),
  true,
  "Presentation-only interaction state is expected for pristine/error timing"
);
assert.equal(
  modal.includes('data-tone={hasConfigureInteraction ? "error" : "quiet"}'),
  true,
  "Interaction state must only drive the note tone"
);
assert.equal(
  modal.includes("hasInteracted={hasConfigureInteraction}"),
  true,
  "The panel must receive the timing flag as a presentation prop"
);
assert.equal(
  modal.includes("showMissingCue") || panel.includes("showMissingCue={hasInteracted}"),
  true,
  "The missing-group cue must be gated by the same presentation flag"
);
assert.equal(
  panel.includes('data-missing={issue && showMissingCue ? "true" : undefined}'),
  true,
  "The quiet missing cue must be a data attribute on the existing badge"
);

// Hard rule: the flag must not leak into validity, disabled, pricing or payload.
const leakScopes: Array<[string, string]> = [
  ["configureDraftValid", modalCode.match(/const configureDraftValid =[\s\S]*?;/)?.[0] ?? ""],
  ["canSubmit", modalCode.match(/const canSubmit =[\s\S]*?;/)?.[0] ?? ""],
  [
    "configurePreviewTotal",
    modalCode.match(/const configurePreviewTotal =[\s\S]*?;/)?.[0] ?? ""
  ],
  [
    "createManualOrderAction payload",
    modalCode.match(/createManualOrderAction\(\{[\s\S]*?\}\);/)?.[0] ?? ""
  ],
  [
    "ticket bundle",
    modalCode.match(/createManualConfiguredTicketBundle\(\{[\s\S]*?\}\);/)?.[0] ?? ""
  ],
  ["confirmConfigure", modalCode.match(/const confirmConfigure = \(\) => \{[\s\S]*?\n  \};/)?.[0] ?? ""]
];
for (const [label, scope] of leakScopes) {
  assert.notEqual(scope, "", `Expected to locate the ${label} block`);
}
for (const [label, scope] of leakScopes) {
  if (label === "confirmConfigure") {
    // confirmConfigure may only RESET the flag, never read it as a condition.
    assert.equal(
      /if \([^)]*hasConfigureInteraction|hasConfigureInteraction \?/.test(scope),
      false,
      "confirmConfigure must not branch on the presentation flag"
    );
    continue;
  }
  assert.equal(
    scope.includes("hasConfigureInteraction"),
    false,
    `Presentation state must not feed ${label}`
  );
}
assert.equal(
  /disabled=\{[^}]*hasConfigureInteraction/.test(modalCode),
  false,
  "Presentation state must not feed any disabled attribute"
);
assert.equal(
  /hasInteracted/.test(
    panel.match(/export function isManualOrderCustomizationDraftValid[\s\S]*?\n\}/)?.[0] ?? ""
  ),
  false,
  "Draft validity must not read the interaction flag"
);
assert.equal(
  /hasInteracted/.test(
    panel.match(/export function getManualOrderCustomizationDraftPreviewTotal[\s\S]*?\n\}/)?.[0] ??
      ""
  ),
  false,
  "Pricing must not read the interaction flag"
);
// The panel is stateless again: timing is owned by the modal.
assert.equal(
  panel.includes("useState"),
  false,
  "The panel must not keep a private interaction state that can desync"
);
assert.equal(
  modal.includes("key={configureProduct.id}"),
  true,
  "Reopening another product must remount the panel so no stale state survives"
);

/* ------------------------------------------------------------------------- */
/* 15. focus-visible for configurator option / quantity controls              */
/* ------------------------------------------------------------------------- */

const focusRule = panelCss.match(
  /\.optionButton:focus-visible,\s*\.qtyOptionToggle:focus-visible,\s*\.stepperButton:focus-visible\s*\{([\s\S]*?)\}/
);
assert.ok(
  focusRule,
  "focus-visible must cover option buttons, qty toggles and stepper buttons"
);
assert.equal(
  /outline:\s*2px solid/.test(focusRule[1]),
  true,
  "Keyboard focus must paint a visible outline"
);
assert.equal(
  /outline-offset:/.test(focusRule[1]),
  true,
  "The focus ring must be offset so it reads against the control"
);
assert.equal(
  /var\(--focus\)/.test(focusRule[1]),
  true,
  "The focus ring must come from the existing semantic focus token"
);
assert.equal(
  /box-shadow/.test(focusRule[1]),
  false,
  "The focus ring must not stack with the pressed inset shadow"
);
// Upsell ("Adicional") choices reuse .optionButton, so they inherit the ring.
assert.equal(
  /className=\{\[\s*styles\.optionButton,\s*pressed \? styles\.optionButtonPressed : ""\s*\]/.test(
    panel
  ),
  true,
  "Upsell choices must keep using .optionButton so they inherit focus-visible"
);
assert.equal(
  /outline:\s*(none|0)/.test(focusRule[1]),
  false,
  "focus-visible must not be suppressed"
);

/* ------------------------------------------------------------------------- */
/* Volver / close semantics stay distinct                                     */
/* ------------------------------------------------------------------------- */

assert.equal(
  /onClick=\{cancelConfigure\}[\s\S]{0,120}Volver/.test(modal),
  true,
  "Volver must return to compose, not close the modal"
);
const cancelConfigureBlock = modalCode.match(
  /const cancelConfigure = \(\) => \{[\s\S]*?\n  \};/
)?.[0];
assert.ok(cancelConfigureBlock, "cancelConfigure must exist");
assert.equal(
  /setView\(\{ type: "compose" \}\);/.test(cancelConfigureBlock),
  true,
  "cancelConfigure must swap the subview back to compose"
);
assert.equal(
  /onClose\(\)|handleClose\(\)/.test(cancelConfigureBlock),
  false,
  "Volver must not close the whole modal"
);
assert.equal(
  /setTicketLines|setCustomerName|setPhone/.test(cancelConfigureBlock),
  false,
  "Volver must leave the compose ticket and customer state untouched"
);
assert.equal(
  modal.includes("onClose={handleClose}"),
  true,
  "× must still close the entire modal through the shell"
);
assert.equal(
  modal.includes("window.confirm") || modal.includes("Descartar"),
  false,
  "No discard confirmation may be introduced in this phase"
);

/* ------------------------------------------------------------------------- */
/* 11. CTA/footer polish from the previous phase remains intact               */
/* ------------------------------------------------------------------------- */

assert.equal(
  /\.manual-order-modal__footer\s+\.manual-order-modal__submit-button:disabled\s*\{[\s\S]*?opacity:\s*1\b/.test(
    css
  ),
  true,
  "Scoped disabled CTA treatment must remain"
);
assert.equal(
  modal.includes('"Completá las opciones"'),
  true,
  "Blocked configurator CTA copy must remain"
);
assert.equal(
  /Agregar · \{formatCurrency\(configurePreviewTotal\)\}/.test(modal),
  true,
  "Enabled configurator CTA must keep its amount"
);
assert.equal(
  /Crear pedido · \{formatCurrency\(previewTotal\)\}/.test(modal),
  true,
  "Compose CTA must keep the mobile-visible amount"
);
assert.equal(
  /box-shadow:\s*0\s+-/.test(footerMatch[1]),
  true,
  "Footer separation shadow must remain"
);
assert.equal(
  /\.manual-order-modal__footer::before\s*\{[\s\S]*?linear-gradient/.test(css),
  true,
  "Footer scroll-edge fade must remain"
);

/* ------------------------------------------------------------------------- */
/* 12. P1-4 900–1023 row geometry remains intact                              */
/* ------------------------------------------------------------------------- */

assert.equal(
  /@media\s*\(\s*min-width:\s*900px\s*\)\s*and\s*\(\s*max-width:\s*1023px\s*\)\s*\{[\s\S]*?grid-template-areas:\s*\n?\s*"copy copy"\s*\n?\s*"price add";/.test(
    css
  ),
  true,
  "P1-4 fix must remain: 900–1023 product row keeps its two-line geometry"
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

/* ------------------------------------------------------------------------- */
/* 13. Validation contract: P1-2-aware readiness guard                        */
/*                                                                             */
/* P1-2 was closed by ADMIN-MANUAL-ORDER-MODAL-FORM-VALIDATION-UX-DECISION-1:   */
/* canSubmit now reflects the required-field rules validateForm already owned,   */
/* so the previous "customer validity must stay out of canSubmit" assertion is   */
/* retired. What it protected is now asserted positively: same rules, no new or  */
/* hardened rule, Retiro never requires Delivery-only fields.                   */
/* ------------------------------------------------------------------------- */

const canSubmitBlock = modalCode.match(/const canSubmit =[\s\S]*?;/)?.[0];
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

const requiredRules = modalCode.match(
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
    modalCode
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
  assert.equal(modal.includes(rule), true, `validateForm must keep: ${rule}`);
}

/* ------------------------------------------------------------------------- */
/* 14. Create action / payload / pricing untouched                            */
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
  modal.includes("getManualOrderCustomizationDraftPreviewTotal(configureConfig, customizationDraft)"),
  true,
  "Configurator pricing must still come from the existing helper"
);
assert.equal(
  modal.includes("getManualTicketEstimatedTotal(ticketLines)"),
  true,
  "Compose total must still come from the existing helper"
);
assert.equal(
  actions.includes("requireAdminPermission(\"updateOrders\")"),
  true,
  "Server action permission gate must remain unchanged"
);

/* ------------------------------------------------------------------------- */
/* 16–18. Globals / tokens / Button / shell breakpoints untouched              */
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
  tokens.includes("--accent-primary: #2563eb"),
  true,
  "Brand accent token must remain unchanged"
);
assert.equal(
  tokens.includes("--focus:"),
  true,
  "The focus token consumed by the new ring must already exist"
);
assert.equal(
  button.includes('const classes = ["ui-button", `ui-button--${variant}`, className]'),
  true,
  "Shared Button primitive must remain unchanged"
);

// Shell breakpoints: the configurator context must not have moved them.
const shellBreakpoints = (shellCss.match(/@media[^{]+/g) ?? []).map((query) =>
  query.replace(/\s+/g, " ").trim()
);
assert.deepEqual(
  shellBreakpoints,
  [
    "@media (min-width: 720px)",
    "@media (max-width: 1023px)",
    "@media (max-width: 719px)",
    "@media (min-width: 720px)",
    "@media (min-width: 1024px)"
  ],
  "Shared shell must keep its existing breakpoint set unchanged"
);
assert.equal(
  panelCss.includes("@media (min-width: 900px)") ||
    !panelCss.includes("manual-order-modal__workstation"),
  true,
  "The panel must not redefine the workstation breakpoint"
);

/* ------------------------------------------------------------------------- */
/* No DB / public surface reached from this feature                            */
/* ------------------------------------------------------------------------- */

for (const source of [modal, panel]) {
  assert.equal(
    /supabase|from\("orders"\)|create_order|migrations/.test(source),
    false,
    "The modal feature must not reach the database or RPC directly"
  );
  assert.equal(
    /public\/(catalog|checkout)|checkout-cart/.test(source),
    false,
    "The modal feature must not reach public checkout/catalog surfaces"
  );
}

console.log("PASS: admin-manual-order-modal-configurator-context-polish.verify.ts");
