#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const IDS = {
  business: "b2000000-0000-4000-8000-000000000001",
  protectionAccount: "b2000000-0000-4000-8000-000000000002",
  cashAccount: "b2000000-0000-4000-8000-000000000003",
  operatingFund: "b2000000-0000-4000-8000-000000000004",
  cashFund: "b2000000-0000-4000-8000-000000000005",
  reserveFund: "b2000000-0000-4000-8000-000000000006",
  incomeCategory: "b2000000-0000-4000-8000-000000000007",
  expenseCategory: "b2000000-0000-4000-8000-000000000008",
  order: "b2000000-0000-4000-8000-000000000009",
  orderItem: "b2000000-0000-4000-8000-00000000000a",
};

function fail(message) {
  console.error(`M2 local bootstrap refused: ${message}`);
  process.exit(1);
}

function localStatus() {
  const executable = "supabase";
  const result = spawnSync(
    executable,
    ["status", "-o", "json"],
    { cwd: process.cwd(), encoding: "utf8", shell: false },
  );
  if (result.status !== 0) fail("OrderOps Supabase is not running");
  const start = result.stdout.indexOf("{");
  if (start < 0) fail("Supabase status did not return JSON");
  return JSON.parse(result.stdout.slice(start));
}

function assertLoopback(rawUrl) {
  const url = new URL(rawUrl);
  if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)) {
    fail("Supabase URL is not loopback");
  }
  if (url.port !== "54321") fail("expected OrderOps API on port 54321");
  return url.origin;
}

function unwrap(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

const email = process.env.MAJO_DEV_OWNER_EMAIL ?? "majo.owner@local.test";
const password = process.env.MAJO_DEV_OWNER_PASSWORD;
if (!password || password.length < 10) {
  fail("set MAJO_DEV_OWNER_PASSWORD to a local-only value with at least 10 characters");
}

const status = localStatus();
if (status.linked_project) fail("linked Supabase projects are not allowed");
const url = assertLoopback(status.API_URL);
// Newer local stacks expose an asymmetric sb_secret key. Prefer it over the
// deprecated demo JWT, whose signature may not match the active Auth signer.
const serviceKey = status.SECRET_KEY ?? status.SERVICE_ROLE_KEY;
const anonKey = status.ANON_KEY ?? status.PUBLISHABLE_KEY;
if (!serviceKey || !anonKey) fail("local Supabase credentials are unavailable");

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const listed = unwrap(await admin.auth.admin.listUsers({ page: 1, perPage: 1000 }), "list users");
let user = listed.users.find((candidate) => candidate.email === email);
if (!user) {
  const created = unwrap(
    await admin.auth.admin.createUser({ email, password, email_confirm: true }),
    "create local owner",
  );
  user = created.user;
} else {
  unwrap(
    await admin.auth.admin.updateUserById(user.id, { password, email_confirm: true }),
    "refresh local owner",
  );
}

unwrap(
  await admin.from("businesses").upsert(
    {
      id: IDS.business,
      name: "Majo Pastelería",
      slug: "majo-pasteleria-local",
      whatsapp_number: "+5491100000000",
      is_active: true,
    },
    { onConflict: "id" },
  ),
  "upsert business",
);
unwrap(
  await admin.from("profiles").upsert(
    { id: user.id, business_id: IDS.business, role: "owner" },
    { onConflict: "id" },
  ),
  "upsert owner profile",
);
unwrap(
  await admin.from("business_settings").update({
    timezone: "America/Argentina/Buenos_Aires",
    finance_enabled: true,
    on_demand_mode_active: true,
  }).eq("business_id", IDS.business),
  "configure business",
);

unwrap(
  await admin.from("finance_accounts").upsert([
    { id: IDS.protectionAccount, business_id: IDS.business, name: "Mercado Pago", kind: "mercado_pago", sort_order: 10 },
    { id: IDS.cashAccount, business_id: IDS.business, name: "Efectivo", kind: "cash", sort_order: 20 },
  ], { onConflict: "id" }),
  "upsert finance accounts",
);
unwrap(
  await admin.from("finance_funds").upsert([
    { id: IDS.operatingFund, business_id: IDS.business, account_id: IDS.protectionAccount, name: "Caja Semanal", fund_type: "business_operating", area_hint: "business", requires_strong_confirmation: false, sort_order: 10 },
    { id: IDS.reserveFund, business_id: IDS.business, account_id: IDS.protectionAccount, name: "Reserva General", fund_type: "protected_reserve", area_hint: "business", requires_strong_confirmation: true, sort_order: 20 },
    { id: IDS.cashFund, business_id: IDS.business, account_id: IDS.cashAccount, name: "Efectivo Negocio", fund_type: "business_operating", area_hint: "business", requires_strong_confirmation: false, sort_order: 30 },
  ], { onConflict: "id" }),
  "upsert finance funds",
);
unwrap(
  await admin.from("business_finance_settings").upsert({
    business_id: IDS.business,
    protection_account_id: IDS.protectionAccount,
    default_operating_fund_id: IDS.operatingFund,
  }, { onConflict: "business_id" }),
  "configure finance",
);
unwrap(
  await admin.from("finance_categories").upsert([
    { id: IDS.incomeCategory, business_id: IDS.business, name: "Ventas", area: "business", kind: "income", sort_order: 10 },
    { id: IDS.expenseCategory, business_id: IDS.business, name: "Insumos", area: "business", kind: "expense", sort_order: 20 },
  ], { onConflict: "id" }),
  "upsert finance categories",
);

const app = createClient(url, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
unwrap(await app.auth.signInWithPassword({ email, password }), "sign in local owner");
unwrap(
  await admin.from("orders").upsert({
    id: IDS.order,
    business_id: IDS.business,
    order_code: "M2DEMA",
    customer_name: "Cliente demo M2",
    phone: "+5491100000001",
    delivery_date: new Date().toISOString().slice(0, 10),
    delivery_method: "pickup",
    notes: "M2_LOCAL_SMOKE_ORDER",
    total_price: 100,
    status: "pending",
    composition_status: "itemized",
  }, { onConflict: "id" }),
  "upsert canonical smoke order",
);
unwrap(
  await admin.from("order_items").upsert({
    id: IDS.orderItem,
    order_id: IDS.order,
    product_id: null,
    product_name: "Torta demo M2",
    unit_price: 100,
    quantity: 1,
    item_kind: "product",
  }, { onConflict: "id" }),
  "upsert canonical smoke order item",
);
const existingFinancials = unwrap(
  await admin.from("order_financials").select("order_id")
    .eq("order_id", IDS.order).maybeSingle(),
  "find smoke order financials",
);
if (!existingFinancials) {
  unwrap(
    await app.rpc("initialize_order_financials", {
      p_business_id: IDS.business,
      p_order_id: IDS.order,
      p_mode: "copy_total_price",
    }),
    "initialize smoke order financials",
  );
}

console.log(JSON.stringify({
  backend: url,
  businessId: IDS.business,
  ownerEmail: email,
  orderId: IDS.order,
  financeEnabled: true,
  ledgerRowsCreated: 0,
}, null, 2));
