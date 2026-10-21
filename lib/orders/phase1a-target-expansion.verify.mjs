/**
 * Phase 1A deterministic contract verification.
 * Run: node lib/orders/phase1a-target-expansion.verify.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { mergeRealtimeField } from "./realtime-fields.ts";
import { formatAdminOrderTechnicalTotal } from "./presenter.ts";

const read = (file) => readFileSync(path.join(process.cwd(), file), "utf8");
const migrations = {
  core: read("supabase/migrations/20260926010000_shared_core_expand.sql"),
  orderFinance: read("supabase/migrations/20260926011000_order_financials.sql"),
  foundation: read("supabase/migrations/20260926012000_finance_foundation.sql"),
  settings: read("supabase/migrations/20260926013000_business_finance_settings.sql"),
  ledger: read("supabase/migrations/20260926014000_finance_ledger.sql"),
  reconciliation: read("supabase/migrations/20260926015000_finance_reconciliation.sql"),
  security: read("supabase/migrations/20260926016000_finance_security.sql"),
  finalize: read("supabase/migrations/20260926017000_order_contract_finalize.sql")
};

assert.match(migrations.core, /finance_enabled boolean not null default false/i);
assert.match(migrations.core, /finance_enabled = false or timezone is not null/i);
assert.match(migrations.core, /pg_catalog\.pg_timezone_names/i);
assert.match(migrations.core, /add column timezone text\s*,/i);
assert.doesNotMatch(migrations.core, /add column timezone text\s+default/i);
assert.match(migrations.core, /composition_status[\s\S]*not null default 'itemized'/i);

assert.match(migrations.finalize, /alter column total_price drop not null/i);
assert.match(migrations.finalize, /composition_status = 'itemized' and total_price is not null/i);
assert.match(migrations.finalize, /composition_status = 'legacy_unknown' and total_price is null/i);
assert.doesNotMatch(Object.values(migrations).join("\n"), /alter column delivery_time/i);

assert.match(migrations.orderFinance, /agreed_total is null or agreed_total > 0/i);
assert.match(migrations.orderFinance, /financial_status = 'settled'[\s\S]*settled_at is null and settled_by is null/i);
assert.doesNotMatch(migrations.orderFinance, /insert into public\.order_financials/i);

for (const table of [
  "finance_accounts",
  "finance_categories",
  "finance_funds",
  "finance_operations",
  "finance_transactions",
  "finance_transaction_entries",
  "finance_audit_events",
  "finance_reconciliations",
  "finance_reconciliation_fund_snapshots",
  "finance_reconciliation_entries"
]) {
  assert.match(Object.values(migrations).join("\n"), new RegExp(`create table public\\.${table}`, "i"));
  assert.doesNotMatch(Object.values(migrations).join("\n"), new RegExp(`insert into public\\.${table}`, "i"));
}

assert.match(
  migrations.settings,
  /foreign key \(protection_account_id, business_id\)[\s\S]*finance_accounts\(id, business_id\)/i
);
assert.match(
  migrations.settings,
  /foreign key \(default_operating_fund_id, business_id\)[\s\S]*finance_funds\(id, business_id\)/i
);

assert.match(migrations.security, /v_role in \('owner', 'admin'\)/i);
assert.match(migrations.security, /p_permission <> 'read'[\s\S]*require_finance_enabled/i);
assert.doesNotMatch(migrations.security, /for (insert|update|delete|all) to authenticated/i);
assert.match(migrations.security, /revoke all on table public\.finance_audit_events from anon, authenticated/i);

const createOrder = read("supabase/migrations/20260827234500_add_orders_order_code.sql");
const signature = createOrder.match(/create or replace function public\.create_order\(([\s\S]*?)\)\s*returns uuid/i);
assert.ok(signature, "create_order must retain its UUID-returning public signature");
assert.doesNotMatch(signature[1], /delivery_time/i);
assert.match(signature[1], /p_items jsonb/i);
assert.match(createOrder, /items must not be empty/i);
assert.match(createOrder, /set total_price = v_total_price/i);

const previous = 1250;
assert.equal(mergeRealtimeField({}, "total_price", previous), previous);
assert.equal(mergeRealtimeField({ total_price: null }, "total_price", previous), null);
assert.equal(mergeRealtimeField({ total_price: 2500 }, "total_price", previous), 2500);
assert.equal(formatAdminOrderTechnicalTotal(null), "Total técnico no disponible");
assert.notEqual(formatAdminOrderTechnicalTotal(0), "Total técnico no disponible");

const realtime = read("lib/orders/realtime.ts");
assert.match(realtime, /mergeRealtimeField\(row, "total_price", order\.total_price\)/g);
assert.doesNotMatch(realtime, /row\.total_price\s*\?\?/);
assert.match(read("lib/orders/realtime-fields.ts"), /Object\.prototype\.hasOwnProperty\.call/);

const analytics = read("lib/orders/analytics.ts");
assert.match(analytics, /order\.total_price !== null/);
assert.match(analytics, /unknownTechnicalTotalOrders/);
assert.match(read("types/database.ts"), /total_price: number \| null/);

console.log("phase1a-target-expansion.verify.mjs: PASS");
