/**
 * ADMIN-MANUAL-ORDER-MODAL-MICROCOPY-CONSISTENCY-POLISH-1
 *
 * Small, intent-based guard. It deliberately does NOT snapshot the modal's full
 * text: it pins only the contracts that are expensive to notice if they drift —
 * device-specific wording, the two CTA state contracts, technical vocabulary
 * leaking into visible copy, and the functional conditions this phase promised
 * not to touch.
 *
 * Run: npx tsx lib/orders/admin-manual-order-modal-microcopy-consistency.verify.ts
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative: string) => readFileSync(path.join(root, relative), "utf8");

/** Strips comments so a banned word inside an explanation never trips a check. */
const code = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const modal = read("components/admin/orders/manual-order-modal.tsx");
const panel = read("components/admin/orders/manual-order-customization-panel.tsx");
const modalCode = code(modal);
const panelCode = code(panel);

/* ------------------------------------------------------------------------- */
/* 1. No device-specific copy                                                */
/* ------------------------------------------------------------------------- */

/*
 * The modal is used on touch, mouse and keyboard, so no visible sentence may
 * name a gesture or a specific glyph as the way to act.
 */
for (const [label, source] of [
  ["manual-order-modal.tsx", modalCode],
  ["manual-order-customization-panel.tsx", panelCode]
] as const) {
  for (const banned of ["Tocá", "Tocar", "Hacé clic", "Clickeá", "Cliqueá", "Deslizá"]) {
    assert.equal(
      source.includes(banned),
      false,
      `${label} must not use device-specific wording (${banned})`
    );
  }
}

assert.equal(
  /Tocá\s*\+|para configurar.*\+|\+\s*para configurar/.test(modalCode),
  false,
  "The configurable-product hint must not instruct the operator to press +"
);
assert.equal(
  modal.includes("Configurá las opciones antes de agregarlo."),
  true,
  "The configurable-product hint must state the action without naming a control"
);

/* ------------------------------------------------------------------------- */
/* 2. Compose CTA contract preserved                                         */
/* ------------------------------------------------------------------------- */

for (const state of [
  '"Agregá productos"',
  '"Completá los datos obligatorios"',
  '"Creando pedido..."',
  "Crear pedido · {formatCurrency(previewTotal)}"
]) {
  assert.equal(
    modal.includes(state),
    true,
    `Compose CTA state must be preserved verbatim: ${state}`
  );
}

/* The CTA state order is the contract, not just the strings. */
const composeCta = modal.slice(modal.indexOf('type="submit"'));
assert.equal(
  composeCta.indexOf("Creando pedido...") < composeCta.indexOf("Agregá productos") &&
    composeCta.indexOf("Agregá productos") <
      composeCta.indexOf("Completá los datos obligatorios") &&
    composeCta.indexOf("Completá los datos obligatorios") <
      composeCta.indexOf("Crear pedido ·"),
  true,
  "Compose CTA must keep the submitting → empty → incomplete → ready precedence"
);

/* ------------------------------------------------------------------------- */
/* 3. Configurator CTA contract preserved                                    */
/* ------------------------------------------------------------------------- */

for (const state of [
  '"Completá las opciones"',
  "Agregar · {formatCurrency(configurePreviewTotal)}"
]) {
  assert.equal(
    modal.includes(state),
    true,
    `Configurator CTA state must be preserved: ${state.trim()}`
  );
}

/* The back affordance keeps its one-word label. */
assert.equal(
  /onClick=\{cancelConfigure\}[\s\S]{0,160}?>\s*Volver\s*<\/Button>/.test(modal),
  true,
  "The configurator back button must still be labelled Volver"
);

/* ------------------------------------------------------------------------- */
/* 4. No technical vocabulary in visible copy                                */
/* ------------------------------------------------------------------------- */

/*
 * Identifiers legitimately contain these words, so this only inspects strings
 * and JSX text that can actually reach the operator's screen.
 */
const visibleCopy = (source: string) => {
  const fromStrings = [...source.matchAll(/"([^"\n]{4,})"/g)].map((match) => match[1]);
  const fromJsxText = [...source.matchAll(/>\s*([A-ZÁÉÍÓÚÑ][^<>{}\n]{3,})\s*</g)].map(
    (match) => match[1]
  );
  return [...fromStrings, ...fromJsxText].filter(
    (text) =>
      // Drop class names, selectors, enum-ish values and import paths.
      !text.includes("manual-order-modal__") &&
      !text.includes("@/") &&
      !text.startsWith("./") &&
      /\s/.test(text)
  );
};

for (const [label, source] of [
  ["manual-order-modal.tsx", modalCode],
  ["manual-order-customization-panel.tsx", panelCode]
] as const) {
  for (const text of visibleCopy(source)) {
    for (const jargon of ["snapshot", "payload", "upsell", "line item", "tenant"]) {
      assert.equal(
        text.toLowerCase().includes(jargon),
        false,
        `${label} leaks technical vocabulary into visible copy ("${jargon}" in "${text}")`
      );
    }
  }
}

/* "Adicional" stays the operator-facing word for an associated line. */
assert.equal(
  read("lib/product-customization/upsell-copy.ts").includes(
    'UPSELL_ASSOCIATED_LABEL = "Adicional"'
  ),
  true,
  "The associated-line label must remain Adicional"
);

/* ------------------------------------------------------------------------- */
/* 5. Pedido is the primary term                                             */
/* ------------------------------------------------------------------------- */

/*
 * Ticket may survive in code identifiers and CSS class names, but not as a
 * user-facing noun: the operator sees one word for the thing being built.
 */
for (const text of visibleCopy(modalCode)) {
  assert.equal(
    /\bticket\b/i.test(text),
    false,
    `Visible copy must say pedido, not ticket ("${text}")`
  );
}
assert.equal(
  modal.includes("Ticket en construcción"),
  false,
  "The summary subtitle must not reintroduce Ticket as a concept"
);
assert.equal(
  modal.includes("Resumen del pedido"),
  true,
  "The summary panel must be subtitled Resumen del pedido"
);

/* Mode name and section headings. */
assert.equal(modal.includes(">Pedido manual<"), true, "The header badge must read Pedido manual");
assert.equal(modal.includes(">Productos<"), true, "The products section heading must be preserved");
assert.equal(modal.includes(">Pedido<"), true, "The summary section heading must be preserved");
assert.equal(
  modal.includes("Total estimado") && modal.includes("El total final se valida al crear el pedido."),
  true,
  "The total block copy must be preserved"
);

/* ------------------------------------------------------------------------- */
/* 6. Functional conditions unchanged                                        */
/* ------------------------------------------------------------------------- */

/*
 * Copy-only phase: the gates that decide CTA state, configurator validity and
 * submission must still read exactly as before.
 */
for (const condition of [
  "disabled={!canSubmit}",
  "disabled={isSubmitting || !configureDraftValid}",
  "!hasSelectedItems",
  "!requiredFormReady"
]) {
  assert.equal(
    modal.includes(condition),
    true,
    `Functional condition must be untouched: ${condition}`
  );
}

/* Accessibility work from the previous phase must survive a copy edit. */
for (const invariant of [
  "dialogRef",
  "openerRef",
  "getManualOrderFocusableElements",
  'overlayLabel="',
  "closeLabel={"
]) {
  assert.equal(
    modal.includes(invariant),
    true,
    `Accessibility invariant must be preserved: ${invariant}`
  );
}

/* The two close affordances must still have distinct accessible names. */
const overlayLabelValue = modal.match(/overlayLabel="([^"]+)"/)?.[1];
const closeLabelFallback = modal.match(/:\s*"(Cerrar[^"]+)"/)?.[1];
assert.equal(
  Boolean(overlayLabelValue) && Boolean(closeLabelFallback),
  true,
  "Both close affordances must carry an explicit accessible name"
);
assert.notEqual(
  overlayLabelValue,
  closeLabelFallback,
  "Overlay and close button must not share one accessible name"
);
assert.equal(
  /Cerrar configuración de \$\{configureProduct\.name\}/.test(modal),
  true,
  "The configurator close label must be grammatical"
);

/* No CSS was expected to change for copy. */
assert.equal(
  read("components/admin/orders/manual-order-modal.module.css").includes("min-height: 44px"),
  true,
  "Tap-target sizing must survive this phase"
);

console.log(
  "admin-manual-order-modal-microcopy-consistency.verify.ts: PASS — copy consistent, contracts and interaction untouched"
);
