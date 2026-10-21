import { readdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, relative } from "node:path";

const root = process.cwd();
const commercialRoot = join(root, "lib", "commercial");

function verifyFiles(directory, found = []) {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) verifyFiles(path, found);
    else if (name.endsWith(".verify.ts")) found.push(path);
  }
  return found;
}

const files = verifyFiles(commercialRoot);
if (files.length === 0) {
  console.error("verify-all: no commercial verify files");
  process.exit(1);
}

for (const file of files) {
  const relativePath = relative(root, file);
  const tsxCli = join(root, "node_modules", "tsx", "dist", "cli.mjs");
  const result = spawnSync(process.execPath, [tsxCli, relativePath], { cwd: root, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(`verify-all: ${files.length} file(s) passed`);
