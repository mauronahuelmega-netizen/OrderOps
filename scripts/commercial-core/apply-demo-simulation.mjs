// Applies the OrderOps demo simulation to the loopback QA database only.
// Writes ORDEROPS_DEMO_ACCESS.private.md (gitignored) with individual passwords.
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const CONTAINER = "supabase_db_orderops-phase06-qa";
const PORT = "56722";
const SEED = resolve(ROOT, "supabase/seed/orderops_demo_simulation.sql");
const PRIVATE_GUIDE = resolve(ROOT, "ORDEROPS_DEMO_ACCESS.private.md");

const USERS = [
  { n: 1, key: "PW_1", name: "Martín Alegre", email: "demo.martin@local.test", role: "Superadmin de OrderOps", business: "—", login: "/admin/login → /super-admin" },
  { n: 2, key: "PW_2", name: "Lucía Benítez", email: "demo.lucia@local.test", role: "Comercial", business: "—", login: "/admin/login → /commercial/opportunities" },
  { n: 3, key: "PW_3", name: "Nicolás Herrera", email: "demo.nicolas@local.test", role: "Finanzas", business: "—", login: "/admin/login → /commercial/billing" },
  { n: 4, key: "PW_4", name: "Tomás Ferrero", email: "demo.tomas@local.test", role: "Promotor", business: "Atribuido a Brasa Norte y Distrito", login: "/promoter/login" },
  { n: 5, key: "PW_5", name: "Valentina Ríos", email: "demo.valentina@local.test", role: "Owner", business: "Brasa Norte Burgers", login: "/admin/login → /admin/dashboard y /admin/billing" },
  { n: 6, key: "PW_6", name: "Sofía Molina", email: "demo.sofia@local.test", role: "Manager", business: "Brasa Norte Burgers", login: "/admin/login → /admin/dashboard y /admin/billing" },
  { n: 7, key: "PW_7", name: "Diego Acosta", email: "demo.diego@local.test", role: "Operator", business: "Brasa Norte Burgers", login: "/admin/login → /admin/dashboard" },
  { n: 8, key: "PW_8", name: "Camila Duarte", email: "demo.camila@local.test", role: "Owner", business: "Distrito Burger", login: "/admin/login → /admin/dashboard y /admin/billing" }
];

const port = spawnSync("docker", ["port", CONTAINER, "5432/tcp"], { encoding: "utf8" });
if (port.status !== 0 || !port.stdout.includes(`:${PORT}`)) {
  console.error(`apply-demo-simulation: ${CONTAINER} is not bound to ${PORT}; refusing`);
  process.exit(2);
}

function password() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = randomBytes(14);
  let out = "";
  for (const byte of bytes) {
    out += alphabet[byte % alphabet.length];
  }
  return out;
}

const secrets = USERS.map((user) => ({ ...user, password: password() }));
let sql = readFileSync(SEED, "utf8");
for (const user of secrets) {
  sql = sql.replaceAll(`{{${user.key}}}`, user.password.replaceAll("'", "''"));
}
if (sql.includes("{{PW_")) {
  console.error("apply-demo-simulation: leftover password placeholders");
  process.exit(2);
}

const guide = `# OrderOps — Acceso de demostración (privado)

**No commitear este archivo.** Solo QA local. Las cobranzas y el CVU son sintéticos: no son respuestas de Talo.

## URL

- App: http://127.0.0.1:3105
- Catálogo Brasa Norte: http://127.0.0.1:3105/b/brasa-norte
- Catálogo Distrito Burger: http://127.0.0.1:3105/b/distrito-burger
- QA API: http://127.0.0.1:56721

Levantá el servidor desde el worktree \`OrderOps-talo-first\`:

\`npx next dev --webpack -p 3105\`

## Cuentas

| Perfil | Nombre | Email | Contraseña | Negocio | Entrada |
|---|---|---|---|---|---|
${secrets
  .map((user) => `| ${user.role} | ${user.name} | \`${user.email}\` | \`${user.password}\` | ${user.business} | ${user.login} |`)
  .join("\n")}

## Qué puede hacer cada perfil

- **Martín (superadmin):** \`/super-admin\` crea negocios y usuarios. En comercial puede confirmar atribución y ganar una oportunidad **solo por RPC** (\`confirm_attribution\`, \`win_opportunity\`). No hay botón de conversión.
- **Lucía (comercial):** tablero y detalle de oportunidades; cambia etapa y completa tareas. No puede ganar ni confirmar atribución.
- **Nicolás (finanzas):** \`/commercial/billing\` concilia, registra inicio, carga comprobantes, devuelve transferencias. No opera el CRM.
- **Tomás (promotor):** registra comercios, notas, tareas y reclamos. Ve comisiones en liquidaciones cuando existan. No confirma su propia atribución.
- **Valentina (owner Brasa):** pedidos, productos, facturación, configuración.
- **Sofía (manager Brasa):** igual que owner en facturación y pedidos; no es owner.
- **Diego (operator Brasa):** pedidos y configuración. **No** ve Facturación.
- **Camila (owner Distrito):** su negocio, aislado de Brasa. Estado suspendido hasta que Finanzas impute una mensualidad.

## Restricciones esperadas

- Comercial, Finanzas y Superadmin no tienen \`business_id\`. Después de \`/admin/login\` el dashboard los echa; en la misma sesión abrí la URL de su área.
- El CVU/alias de Facturación es **sintético** (\`demo.brasanorte\`, \`demo.distrito\`). No fue emitido por Talo. Cobranzas \`demo-synth-*\`.
- Tras aplicar el seed, el bloqueo comercial en QA puede quedar apagado. Para demo de suspensión de pedidos, un superadmin debe encenderlo con preflight (solo QA). Ver \`docs/commercial-core-v1/DEMO_SIMULATION_REPORT.md\`.
- Webpack no compila el catálogo público (CSS preview preexistente). Admin, Facturación, Comercial y Promotor sí.

## Orden recomendado de QA manual

1. Tomás en \`/promoter\`: Brasa, Distrito, Puesto Sur; liquidaciones con comisiones.
2. Lucía: oportunidades; sin botón de ganar ni confirmar atribución.
3. Valentina: pedidos, productos, facturación activa.
4. Diego: sin Facturación; completar un pedido.
5. Camila: suspendida; pedido nuevo bloqueado solo si el gate QA está on.
6. Nicolás: transferencia 50.000 en revisión; imputar 55.000 para reactivar Distrito.
7. Martín: \`/super-admin\`; conversión solo por RPC.

## Restaurar la demostración

Desde el worktree autorizado:

\`node scripts/commercial-core/apply-demo-simulation.mjs\`

- Solo toca ids \`d0d0d0d0-d0d0-40d0-80d0-*\`.
- Si la conversión ya existe, rota contraseñas y refresca catálogo; no borra cobranzas.
- \`conversion_terms\` es inmutable: no hay reset económico sin un QA nuevo.
- Este archivo se reescribe con claves nuevas en cada corrida.
`;

writeFileSync(PRIVATE_GUIDE, guide, "utf8");

await new Promise((resolve, reject) => {
  const child = spawn(
    "docker",
    ["exec", "-i", CONTAINER, "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1"],
    { stdio: ["pipe", "inherit", "inherit"] }
  );
  child.stdin.end(sql);
  child.on("close", (code) => {
    if (code === 0) resolve();
    else reject(new Error(`psql exit ${code}`));
  });
});

console.log("apply-demo-simulation: APPLIED");
console.log(`private guide: ${PRIVATE_GUIDE}`);
console.log("emails: " + secrets.map((user) => user.email).join(" "));
