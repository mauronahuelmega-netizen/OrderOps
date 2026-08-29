import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const QA_BUSINESS_ID = "e21b8fc2-3016-4dec-92ef-ebb04e58ecdf";
const PRESERVATION_ORDER_ID = "3fae4857-f4fd-4f78-b76d-18fed037a323";

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

function log(section, payload) {
  console.log(`[${section}] ${JSON.stringify(payload)}`);
}

const env = parseEnvFile(".env.local");
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("ENV_MISSING");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const results = [];

async function readFlag(businessId) {
  const { data, error } = await supabase
    .from("business_settings")
    .select("order_assignment_enabled")
    .eq("business_id", businessId)
    .maybeSingle();
  return { data, error };
}

async function readOrder(orderId) {
  const { data, error } = await supabase
    .from("orders")
    .select("id, assigned_to, assigned_at, status")
    .eq("id", orderId)
    .maybeSingle();
  return { data, error };
}

async function countAssignmentEvents(orderId) {
  const { count, error } = await supabase
    .from("order_events")
    .select("id", { count: "exact", head: true })
    .eq("order_id", orderId)
    .in("event_type", ["assignment_taken", "assignment_released"]);
  return { count: count ?? 0, error };
}

async function setFlag(businessId, enabled) {
  const { error } = await supabase
    .from("business_settings")
    .update({ order_assignment_enabled: enabled })
    .eq("business_id", businessId);
  return { error };
}

async function simulateMutationGate(businessId) {
  const { data, error } = await readFlag(businessId);
  if (error) {
    return { blocked: true, reason: "flag_read_error", error: error.message };
  }
  const enabled = data?.order_assignment_enabled === true;
  if (!enabled) {
    return {
      blocked: true,
      reason: "feature_disabled",
      message: "La asignacion de responsables no esta habilitada para este negocio."
    };
  }
  return { blocked: false };
}

try {
  log("TARGET", { ref: new URL(url).hostname.split(".")[0] });

  const schemaProbe = await readFlag(QA_BUSINESS_ID);
  if (schemaProbe.error) {
    results.push({ gate: "schema", pass: false, error: schemaProbe.error.message });
    throw new Error("Schema probe failed");
  }
  results.push({
    gate: "schema",
    pass: true,
    flag: schemaProbe.data?.order_assignment_enabled
  });

  const baselineOrder = await readOrder(PRESERVATION_ORDER_ID);
  const baselineEvents = await countAssignmentEvents(PRESERVATION_ORDER_ID);
  results.push({
    gate: "preservation_baseline",
    order: baselineOrder.data,
    assignment_events: baselineEvents.count
  });

  const offGate = await simulateMutationGate(QA_BUSINESS_ID);
  results.push({ gate: "mutation_off", pass: offGate.blocked === true, detail: offGate });

  await setFlag(QA_BUSINESS_ID, true);
  const onRead = await readFlag(QA_BUSINESS_ID);
  results.push({
    gate: "flag_on",
    pass: onRead.data?.order_assignment_enabled === true
  });

  const onGate = await simulateMutationGate(QA_BUSINESS_ID);
  results.push({ gate: "mutation_on_allowed", pass: onGate.blocked === false, detail: onGate });

  await setFlag(QA_BUSINESS_ID, false);
  const afterOff = await readOrder(PRESERVATION_ORDER_ID);
  const afterOffEvents = await countAssignmentEvents(PRESERVATION_ORDER_ID);
  results.push({
    gate: "on_to_off_data",
    pass:
      afterOff.data?.assigned_to === baselineOrder.data?.assigned_to &&
      afterOff.data?.assigned_at === baselineOrder.data?.assigned_at &&
      afterOffEvents.count === baselineEvents.count,
    assigned_to: afterOff.data?.assigned_to,
    assigned_at: afterOff.data?.assigned_at,
    events: afterOffEvents.count
  });

  await setFlag(QA_BUSINESS_ID, true);
  const afterOn = await readOrder(PRESERVATION_ORDER_ID);
  results.push({
    gate: "off_to_on_data",
    pass:
      afterOn.data?.assigned_to === baselineOrder.data?.assigned_to &&
      afterOn.data?.assigned_at === baselineOrder.data?.assigned_at,
    assigned_to: afterOn.data?.assigned_to
  });

  await setFlag(QA_BUSINESS_ID, false);
  const offAgain = await simulateMutationGate(QA_BUSINESS_ID);
  const finalFlag = await readFlag(QA_BUSINESS_ID);

  results.push({
    gate: "mutation_off_after_cycle",
    pass: offAgain.blocked === true
  });
  results.push({
    gate: "final_flag_false",
    pass: finalFlag.data?.order_assignment_enabled === false
  });

  const allPass = results.every((r) => r.pass !== false);
  console.log("QA_MATRIX=" + JSON.stringify(results, null, 2));
  console.log("QA_MATRIX_PASS=" + (allPass ? "YES" : "NO"));
  process.exit(allPass ? 0 : 1);
} catch (error) {
  await setFlag(QA_BUSINESS_ID, false);
  console.error("QA_MATRIX_FATAL=" + (error instanceof Error ? error.message : String(error)));
  console.log("QA_MATRIX=" + JSON.stringify(results, null, 2));
  process.exit(1);
}
