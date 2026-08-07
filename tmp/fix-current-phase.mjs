import fs from "node:fs";
const path = "docs/CURRENT_PHASE.md";
let existing = fs.readFileSync(path, "utf8");
const marker = "## Registro — ADMIN-PWA-FOUNDATION-1";
const idx = existing.indexOf(marker);
if (idx === -1) { console.error("marker not found"); process.exit(1);} 
const prepend = `## Registro — ADMIN-PWA-BRANDING-POLISH-1 (2026-07-24)

**Fase:** ADMIN-PWA-BRANDING-POLISH-1 — Admin PWA app name & icon polish  
**Estado:** PASS WITH BRAND ASSET AND DEVICE QA DEBT  
**Resultado:** Se unificó el nombre instalado a **OrderOps** y se reemplazó el icono tipo "O" aislada por una marca compuesta (checklist + anillos + **Ops**) en iconos admin PWA. \`start_url\`/\`scope\`/\`id\` permanecen en \`/admin\`. Sin SW/offline ni cambios auth/admin/catálogo.

- Doc: \`docs/admin-pwa-branding-polish-1-app-name-icon.md\`
- Asset: \`public/icon.png\` existe pero es marca parcial; se usó fallback SVG compuesto en script
- **Usuario:** desinstalar PWA admin anterior y reinstalar para ver nombre/icono en launcher
- CLI: \`tsc\` PASS → \`build\` PASS
- **Deuda:** DEVICE QA manual + asset corporativo master opcional

---
`;
fs.writeFileSync(path, prepend + existing.slice(idx), "utf8");
console.log("fixed prepend");
