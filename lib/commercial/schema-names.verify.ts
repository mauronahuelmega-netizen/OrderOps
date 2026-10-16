/**
 * Every commercial table created in migrations is named in DATA_MODEL.md.
 * Run: npx tsx lib/commercial/schema-names.verify.ts
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const migrations = readdirSync("supabase/migrations").filter((name) => name.endsWith(".sql"));
const names = new Set<string>();
for (const file of migrations) {
  const sql = readFileSync(join("supabase/migrations", file), "utf8");
  for (const match of sql.matchAll(/create table(?: if not exists)? commercial\.([a-z_]+)/gi)) {
    names.add(match[1]);
  }
}
const model = readFileSync("docs/commercial-core-v1/DATA_MODEL.md", "utf8");
const missing = [...names].filter((name) => !model.includes(name));
assert.deepEqual(missing, []);
console.log(`schema-names.verify: ${names.size} tables named`);
