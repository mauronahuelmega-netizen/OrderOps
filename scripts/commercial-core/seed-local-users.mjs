const url = process.env.COMMERCIAL_QA_URL ?? "";
let parsed;
try {
  parsed = new URL(url);
} catch {
  console.error("fixture_refuses_target");
  process.exit(1);
}

if (parsed.hostname !== "127.0.0.1" || parsed.port === "54321" || parsed.protocol !== "http:") {
  console.error("fixture_refuses_target");
  process.exit(1);
}
if (process.env.COMMERCIAL_QA_PROJECT_ID !== "orderops-phase06-qa") {
  console.error("fixture_project_mismatch");
  process.exit(1);
}

console.log("seed-local-users: loopback QA accepted; auth rows are inserted by supabase/seed/commercial_core_fixture.sql");
