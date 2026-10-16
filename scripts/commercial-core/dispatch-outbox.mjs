import { spawnSync } from "node:child_process";
import { join } from "node:path";

const host = process.env.COMMERCIAL_INBUCKET_HOST ?? "";
const port = process.env.COMMERCIAL_INBUCKET_PORT ?? "";
const sink = process.env.COMMERCIAL_EMAIL_SINK ?? "";
const databaseUrl = process.env.COMMERCIAL_DISPATCH_DATABASE_URL ?? "";

const qaPort = process.env.COMMERCIAL_QA_INBUCKET_PORT ?? "";
const dbContainer = process.env.COMMERCIAL_QA_DB_CONTAINER ?? "";
if (sink === "inbucket") {
  if (host !== "127.0.0.1" || host === "smtp.gmail.com" || port !== qaPort || ["54324", "56324", "56424"].includes(port)) {
    console.error(port === "54324" ? "foreign_project_sink" : "non_loopback_sink");
    process.exit(1);
  }
  if (!/^supabase_db_orderops-phase06-[a-z0-9-]+$/.test(dbContainer)) {
    console.error("qa_container_required");
    process.exit(1);
  }
  const inbucketContainer = dbContainer.replace("supabase_db_", "supabase_inbucket_");
  const published = spawnSync("docker", ["port", inbucketContainer, "8025"], { encoding: "utf8" });
  const publishedPort = published.stdout.match(/:(\d+)\s*$/m);
  if (published.status !== 0 || !publishedPort || publishedPort[1] !== port) {
    console.error("inbucket_project_mismatch");
    process.exit(1);
  }
} else if (sink.length > 0) {
  console.error("unsupported_sink");
  process.exit(1);
}

if (databaseUrl.length === 0 || !databaseUrl.includes("127.0.0.1")) {
  console.error("dispatch_database_not_loopback");
  process.exit(1);
}
if (databaseUrl.includes(":54322/") || databaseUrl.includes(":54322?")) {
  console.error("dispatch_refuses_main_database");
  process.exit(1);
}

const tsxCli = join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");
const result = spawnSync(
  process.execPath,
  [tsxCli, "lib/commercial/notifications/dispatch-cli.ts"],
  { stdio: "inherit", env: process.env }
);
process.exit(result.status ?? 1);
