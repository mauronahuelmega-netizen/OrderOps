import fs from "node:fs";
const path = "ORDEROPS_LIVING_MEMORY.md";
let c = fs.readFileSync(path, "utf8");
const needle =
  "- Archivos: `lib/admin/pwa-manifest.ts`, `app/admin/manifest.webmanifest/route.ts`, `app/admin/layout.tsx`, `public/icons/orderops-admin-*.png`, `scripts/generate-admin-pwa-icons.mjs`, `docs/admin-pwa-foundation-1-installable-standalone.md`, `docs/CURRENT_PHASE.md`, `ORDEROPS_LIVING_MEMORY.md`; commit `b8dcbb1`.";
const insert = `

### 2026-07-24 — ADMIN-PWA-BRANDING-POLISH-1 — Admin PWA branding polish

- **Frontend / Admin PWA** ADMIN-PWA-BRANDING-POLISH-1 completada. Se pulió branding PWA admin: nombre instalado "OrderOps", icono OrderOps más completo (no O aislada). start_url/scope/id /admin. Sin SW/offline. Sin cambios auth/admin/catalog/cart/checkout/pricing/stock/DB/RLS/actions/pedidos.
- Archivos: \`lib/admin/pwa-manifest.ts\`, \`scripts/generate-admin-pwa-icons.mjs\`, \`public/icons/orderops-admin-*.png\`, \`docs/admin-pwa-branding-polish-1-app-name-icon.md\`, \`docs/CURRENT_PHASE.md\`, \`ORDEROPS_LIVING_MEMORY.md\`.`;
if (!c.includes(needle)) {
  console.error("needle not found");
  process.exit(1);
}
c = c.replace(needle, needle + insert);
fs.writeFileSync(path, c, "utf8");
console.log("inserted");
