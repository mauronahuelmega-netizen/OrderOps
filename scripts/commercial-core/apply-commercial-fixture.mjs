import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const container = process.argv[2] ?? "";
const projectId = process.argv[3] ?? "";
if (projectId !== "orderops-phase06-qa" || !/^supabase_db_orderops-phase06-[a-z0-9-]+$/.test(container)) {
  console.error("fixture_refuses_target");
  process.exit(1);
}
if (container === "supabase_db_OrderOps") {
  console.error("fixture_refuses_main_database");
  process.exit(1);
}

const port = spawnSync("docker", ["port", container, "5432"], { encoding: "utf8" });
if (port.status !== 0 || port.stdout.includes("54322")) {
  console.error("fixture_refuses_main_database");
  process.exit(1);
}

const sql = `select set_config('orderops.qa_project_id', 'orderops-phase06-qa', false);\n${readFileSync("supabase/seed/commercial_core_fixture.sql", "utf8")}\nselect count(*) from commercial.commercial_businesses where fixture_tag = 'commercial-core-v1-fixture';\n`;
const applied = spawnSync(
  "docker",
  ["exec", "-i", container, "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-tA"],
  { input: sql, encoding: "utf8" }
);
if (applied.status !== 0) {
  console.error(applied.stderr);
  process.exit(applied.status ?? 1);
}
const count = applied.stdout.trim().split(/\s+/).filter(Boolean).at(-1);
if (count !== "3") {
  console.error(`fixture_count_${count}`);
  process.exit(1);
}
console.log("commercial_core_fixture: 3 businesses");
