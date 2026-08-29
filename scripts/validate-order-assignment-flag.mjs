import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

function parseEnvFile(path) {
  const text = readFileSync(path, "utf8");
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.slice(0, idx);
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const env = parseEnvFile(".env.local");
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.log("ENV_MISSING=YES");
  process.exit(1);
}

const ref = new URL(url).hostname.split(".")[0];
console.log("DB_TARGET_REF=" + ref);

const supabase = createClient(url, key, { auth: { persistSession: false } });

const { data: sample, error: sampleErr } = await supabase
  .from("business_settings")
  .select("business_id, order_assignment_enabled, product_customization_enabled")
  .limit(10);

if (sampleErr) {
  console.log("FLAG_READ_ERROR=YES");
  console.log("code=" + (sampleErr.code ?? ""));
  console.log("message=" + sampleErr.message);
  console.log("details=" + (sampleErr.details ?? ""));
  console.log("hint=" + (sampleErr.hint ?? ""));
} else {
  console.log("FLAG_READ_ERROR=NO");
  console.log("BUSINESS_FLAGS=" + JSON.stringify(sample));
}

const { data: orders, error: ordersErr } = await supabase
  .from("orders")
  .select("id, business_id, assigned_to, assigned_at, status")
  .not("assigned_to", "is", null)
  .limit(3);

if (!ordersErr) {
  console.log("ASSIGNED_ORDERS_SAMPLE=" + JSON.stringify(orders));
}

// Migration ledger via rpc raw sql not available - try direct query if exposed
const { data: migrations, error: migErr } = await supabase
  .schema("supabase_migrations")
  .from("schema_migrations")
  .select("version, name")
  .like("version", "%20260817043000%");

if (migErr) {
  console.log("MIGRATION_LEDGER_ERROR=YES");
  console.log("mig_code=" + (migErr.code ?? ""));
  console.log("mig_message=" + migErr.message);
} else {
  console.log("MIGRATION_LEDGER=" + JSON.stringify(migrations));
}
