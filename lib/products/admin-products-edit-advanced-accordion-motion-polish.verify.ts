/**
 * Verify ADMIN-PRODUCTS-EDIT-ADVANCED-ACCORDION-MOTION-POLISH-1
 *
 * Motion-only: CSS grid reveal for Advanced + draft groups,
 * reduced-motion, closed inert, no max-height hack, no deps,
 * scoped under editHierarchy (builder/immediate unchanged).
 *
 * Run: npx tsx lib/products/admin-products-edit-advanced-accordion-motion-polish.verify.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

const panel = read(
  "components/admin/product-customization/product-customization-overrides-panel.tsx"
);
const css = read(
  "components/admin/product-customization/product-customization-admin.module.css"
);
const formCss = read("components/admin/products/product-form.module.css");
const createForm = read("components/admin/products/create-product-form.tsx");
const pkg = read("package.json");
const editUnified = read("lib/products/edit-unified-draft.ts");

const draftGroupStart = panel.indexOf("function DraftInheritanceGroupAccordion");
const draftGroupEnd = panel.indexOf("function DraftInheritanceOptionRow");
assert.ok(draftGroupStart > 0 && draftGroupEnd > draftGroupStart);
const draftGroup = panel.slice(draftGroupStart, draftGroupEnd);

const immediateStart = panel.indexOf("function ImmediateInheritanceGroupAccordion");
const immediateEnd = panel.indexOf("function ImmediateInheritanceOptionRow");
assert.ok(immediateStart > 0 && immediateEnd > immediateStart);
const immediateGroup = panel.slice(immediateStart, immediateEnd);

const cssFlat = css.replace(/\s+/g, " ");

// 1 — Draft Advanced + group use disclosureMotion wrappers
assert.ok(
  /data-motion="advanced"/.test(panel),
  "Advanced draft path must use disclosureMotion advanced"
);
assert.ok(
  /data-motion="group"/.test(draftGroup),
  "Draft group body must use disclosureMotion group"
);
assert.ok(
  /styles\.disclosureMotion/.test(panel),
  "disclosureMotion class must be applied"
);

// 2 — Motion state derives from disclosure UI only (not draft)
assert.ok(/data-open=\{advancedOpen \? "true" : "false"\}/.test(panel));
assert.ok(/data-open=\{expanded \? "true" : "false"\}/.test(draftGroup));
assert.ok(
  !/disclosureMotion|advancedOpen|expandedGroupId/.test(editUnified),
  "unified draft must not store motion/disclosure state"
);

// 3 — CSS grid 0fr/1fr (no arbitrary max-height hack)
assert.ok(
  /\.editHierarchy\s+\.disclosureMotion\s*\{[^}]*grid-template-rows:\s*0fr/.test(cssFlat),
  "closed motion must use grid-template-rows: 0fr"
);
assert.ok(
  /\.editHierarchy\s+\.disclosureMotion\[data-open="true"\]\s*\{[^}]*grid-template-rows:\s*1fr/.test(
    cssFlat
  ),
  "open motion must use grid-template-rows: 1fr"
);
assert.ok(
  !/max-height:\s*(500|999|1000)px/.test(css),
  "must not use arbitrary max-height accordion hack"
);
assert.ok(
  !/max-height:\s*\d{3,}px/.test(
    css.match(/\.editHierarchy\s+\.disclosureMotion[\s\S]*?(?=\.editHierarchy\s+\.|@media|$)/)?.[0] ??
      ""
  ),
  "disclosureMotion must not rely on large max-height ceilings"
);

// 4 — No animation dependency
assert.ok(!/"framer-motion"|"motion"|"@react-spring"|"gsap"|"animejs"/.test(pkg));
assert.ok(!/from ["']framer-motion["']|from ["']motion["']/.test(panel));

// 5 — Chevron transform class retained (single icon + rotate)
assert.ok(/advancedChevronOpen/.test(panel));
assert.ok(/groupChevronOpen/.test(draftGroup));
assert.ok(/transform:\s*rotate\(180deg\)/.test(css));

// 6 — Reduced motion covers reveal + chevron (base .disclosureMotion must be listed)
assert.ok(
  /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{[^}]*\.editHierarchy\s+\.disclosureMotion\s*,/.test(
    css.replace(/\s+/g, " ")
  ),
  "reduced-motion must list .editHierarchy .disclosureMotion (base selector)"
);
assert.ok(
  /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{[^}]*\.editHierarchy\s+\.advancedChevron[^}]*transition:\s*none/.test(
    css.replace(/\s+/g, " ")
  ) &&
    /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{[^}]*\.editHierarchy\s+\.groupChevron[^}]*transition:\s*none/.test(
      css.replace(/\s+/g, " ")
    ),
  "reduced-motion must disable chevron transition under editHierarchy"
);

// 7 — Collapsed mounted content not actionable (inert)
assert.ok(
  /inert=\{!advancedOpen \? true : undefined\}/.test(panel) ||
    /inert=\{!advancedOpen\}/.test(panel),
  "Advanced motion clip must set inert when closed"
);
assert.ok(
  /inert=\{!expanded \? true : undefined\}/.test(draftGroup) ||
    /inert=\{!expanded\}/.test(draftGroup),
  "Group motion clip must set inert when collapsed"
);
assert.ok(/aria-hidden=\{!advancedOpen\}/.test(panel));
assert.ok(/aria-hidden=\{!expanded\}/.test(draftGroup));

// 8 — Loading / empty shells stay non-expandable (no motion wrappers)
const loadingBranch = panel.slice(
  panel.indexOf('data-loading="true"'),
  panel.indexOf('data-error="true"')
);
const emptyBranch = panel.slice(
  panel.indexOf('data-empty="true"'),
  panel.indexOf("// Loading / error branches")
);
assert.ok(
  !/disclosureMotion/.test(loadingBranch),
  "loading shell must not animate as disclosure"
);
assert.ok(
  !/disclosureMotion/.test(emptyBranch),
  "empty-valid shell must not become expandable/motion"
);
assert.ok(/disabled/.test(loadingBranch) && /Avanzado…/.test(loadingBranch));
assert.ok(/disabled/.test(emptyBranch) && /Sin ajustes/.test(emptyBranch));

// 9 — Parent-hidden does not gate expansion (Eye ≠ collapse)
assert.ok(/onToggleGroupHidden/.test(draftGroup));
assert.ok(!/onToggleGroupHidden[\s\S]*setExpanded|expanded.*isGroupHidden/.test(draftGroup));
assert.ok(
  /data-expanded=\{expanded \? "true" : "false"\}/.test(draftGroup) &&
    /data-hidden=\{isGroupHidden \? "true" : "false"\}/.test(draftGroup),
  "expanded and hidden remain independent attributes"
);

// 10 — Builder/immediate path unchanged (still conditional unmount; no motion)
assert.ok(
  /expanded \? \(/.test(immediateGroup),
  "immediate group must keep conditional mount (no motion)"
);
assert.ok(
  !/disclosureMotion/.test(immediateGroup),
  "immediate/builder group must not use disclosureMotion"
);
assert.ok(
  /isDraftMode[\s\S]*disclosureMotion[\s\S]*advancedOpen \? advancedBody : null/.test(
    panel.replace(/\s+/g, " ")
  ) ||
    (/isDraftMode/.test(panel) &&
      /advancedOpen \? advancedBody : null/.test(panel.replace(/\s+/g, " "))),
  "immediate Advanced path must preserve unmount when closed"
);

// 11 — Motion scoped under editHierarchy only
assert.ok(/\.editHierarchy\s+\.disclosureMotion\s*\{/.test(css));
assert.ok(
  !/(?<!\.editHierarchy\s)\.disclosureMotion\s*\{/.test(css.replace(/\.editHierarchy\s+\.disclosureMotion/g, "")),
  "disclosureMotion rules must be editHierarchy-scoped"
);

// 12 — Sticky/footer owners untouched by this phase intent (no motion in product-form)
assert.ok(!/disclosureMotion|grid-template-rows:\s*0fr/.test(formCss));
assert.ok(!/ProductCustomizationOverridesPanel/.test(createForm));

// 13 — Durations stay in premium band (<~240ms) when declared
const durationMatches = [
  ...css.matchAll(
    /\.editHierarchy[^{]*disclosureMotion[^}]*transition(?:-duration)?:\s*[^;]*?(\d+)ms/g
  ),
  ...css.matchAll(
    /\.editHierarchy[^{]*disclosureMotion\[data[^\]]*\][^{]*\{[^}]*transition(?:-duration)?:\s*[^;]*?(\d+)ms/g
  )
];
for (const m of durationMatches) {
  const ms = Number(m[1]);
  assert.ok(ms > 0 && ms <= 240, `motion duration ${ms}ms must be ≤240ms`);
}

// 14 — Overflow clip is hidden (not scroll) on motion clip
assert.ok(
  /\.editHierarchy\s+\.disclosureMotionClip\s*\{[^}]*overflow:\s*hidden/.test(cssFlat)
);
assert.ok(
  !/\.editHierarchy\s+\.disclosureMotionClip\s*\{[^}]*overflow(?:-y)?:\s*(auto|scroll)/.test(
    cssFlat
  )
);

console.log(
  "admin-products-edit-advanced-accordion-motion-polish.verify.ts: PASS"
);
