/* Local QA runner for the existing pure TypeScript verifies. No dependency install. */
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const root = path.resolve(__dirname, "../..");
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  return resolve.call(this, request.startsWith("@/") ? path.join(root, request.slice(2)) : request, parent, ...rest);
};
Module._extensions[".ts"] = function (module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } });
  module._compile(compiled.outputText, filename);
};
const verifies = process.argv.slice(2);
const files = verifies.length ? verifies : [
  "components/marketing/marketing-config.verify.ts",
  "lib/orders/order-display-ref.verify.ts",
  "lib/whatsapp/public.verify.ts",
  "lib/whatsapp/admin-contextual-default.verify.ts",
  "lib/whatsapp/admin-structured-content.verify.ts",
  "lib/cart/post-add-upsell-contract.verify.ts",
  "lib/product-customization/order-preparation.verify.ts"
];
let failures = 0;
for (const file of files) {
  try { require(path.join(root, file)); console.log(`PASS ${file}`); }
  catch (error) { failures++; console.error(`FAIL ${file}: ${error.stack}`); }
}
process.exitCode = failures ? 1 : 0;
